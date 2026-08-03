#pragma bank 255

// Streamable Actor Plugin
//
// Keeps only the *current* animation frame of an actor resident in sprite
// VRAM instead of its whole spritesheet, the way Link's Awakening streams
// Link's frames into a fixed tile band.
//
// How it fits together:
//   * At build time the "Stream Actor Spritesheet" event re-packs the chosen
//     spritesheet so that every frame owns a contiguous block of tiles and its
//     metasprite references tiles 0..n-1 of that block (see stream_sheet_t).
//   * At run time the actor keeps a FIXED base_tile (the exclusive band that
//     GB Studio reserved for it), so nothing about the render path changes:
//     move_metasprite() adds base_tile to the frame-local tile ids.
//   * The VBlank handler below notices actor->frame changing and copies that
//     frame's block into the band. Because GB Studio commits shadow OAM in the
//     same VBlank, the new tiles and the new OAM entries become visible on the
//     same displayed frame - no tearing between OAM layout and tile data.
//
// No stock engine file is modified, so this plugin needs no engineAlt variants.
//
// Banking: everything runs from the plugin's own switchable bank except three
// small NONBANKED stubs that have to be resident in bank 0 - the VBlank entry
// point and the two routines that page in a sheet's data bank (see below).

#include <gbdk/platform.h>
#include <string.h>

#include "vm.h"
#include "gbs_types.h"
#include "actor.h"
#include "bankdata.h"
#include "data_manager.h"
#include "streamable_actor.h"

// Engine fields - declaration order must match engine.json field order.
UBYTE streamable_actor_enabled;
UBYTE streamable_actor_budget;

stream_slot_t streamable_actor_slots[STREAMABLE_ACTOR_SLOTS];

static UBYTE stream_rr;             // round robin start slot, for fair budgeting
static UBYTE stream_isr_installed;
static UBYTE stream_last_oam_base;  // shadow OAM page committed at the last VBlank

// ---------------------------------------------------------------------------
// Bank 0 residents
//
// The streamer runs from the plugin bank, so it cannot page in a sheet's data
// bank itself. Two stubs do it for it - one reads a frame descriptor, the
// other copies the frame's tiles into VRAM - and a third is the VBlank entry
// point, which has to be here because add_VBL() calls it directly.
//
// The two paging stubs deliberately do NOT use the engine's bankdata.c helpers. Every routine
// in bankdata.c stashes the outgoing bank in one shared static (_save) and is
// documented non-reentrant; these run from the VBlank handler while the main
// thread is very likely inside one of them (tile loads, scene setup), and
// clobbering _save would leave that caller restoring the wrong bank. Keeping
// the saved bank in a stack local makes them reentrant. The main-thread entry
// points below have no such constraint and do use bankdata.c.
// ---------------------------------------------------------------------------

// Both take plain scalars rather than a stream_slot_t: every struct
// dereference and address computation done here would be bank 0 code, so the
// banked callers work all of that out and these stay down to "swap bank, move
// bytes, swap back". The byte-at-a-time copy in stream_fetch is for the same
// reason - a struct assignment pulls in a call to ___memcpy.

static void stream_fetch(stream_frame_t *dest, const stream_frame_t *src, UBYTE bank) NONBANKED {
    UBYTE save_bank = CURRENT_BANK;
    SWITCH_ROM(bank);
    UBYTE *d = (UBYTE *)dest;
    const UBYTE *s = (const UBYTE *)src;
    *d++ = *s++;
    *d++ = *s++;
    *d = *s;
    SWITCH_ROM(save_bank);
}

// Reentrant equivalent of the engine's SetBankedSpriteData().
static void stream_copy(UBYTE base_tile, UBYTE n, const UBYTE *src, UBYTE bank) NONBANKED {
    UBYTE save_bank = CURRENT_BANK;
    SWITCH_ROM(bank);
    set_sprite_data(base_tile, n, src);
    SWITCH_ROM(save_bank);
}

void streamable_actor_VBL_isr(void) NONBANKED {
    if (streamable_actor_enabled) stream_vbl_update();
}

// ---------------------------------------------------------------------------
// VRAM upload
// ---------------------------------------------------------------------------

// Main thread only: MemcpyBanked and SetBankedSpriteData are not reentrant.
void streamable_actor_upload(stream_slot_t *slot, UBYTE frame) BANKED {
    if (frame >= slot->n_frames) return;

    stream_frame_t fd;
    MemcpyBanked(&fd, slot->frames + frame, sizeof(fd), slot->bank);

    UBYTE n = fd.n_tiles;
    if (n > slot->band_tiles) n = slot->band_tiles;

    if (n) {
#ifdef CGB
        UBYTE save_vbk = VBK_REG;
        VBK_REG = VBK_BANK_0;
#endif
        SetBankedSpriteData(slot->base_tile, n, slot->tiles + fd.offset, slot->bank);
#ifdef CGB
        VBK_REG = save_vbk;
#endif
    }
    slot->cur_frame = frame;
}

// A slot is only serviced while the actor still points at the streamed sheet
// and still owns the same tile band. Both change when a scene is (re)loaded or
// when another event swaps the actor's spritesheet, which is how stale
// registrations from a previous scene are ignored instead of corrupting VRAM.
#define STREAM_SLOT_IS_LIVE(SLOT, ACTOR) \
    (((ACTOR)->sprite.ptr == (SLOT)->sheet) && ((ACTOR)->base_tile == (SLOT)->base_tile))

void stream_vbl_update(void) BANKED {
    // Only stream in a VBlank that a render pass just fed. GB Studio double
    // buffers shadow OAM and flips _shadow_OAM_base once per rendered frame,
    // so an unchanged page means the sprites in hardware still describe the
    // previous frame: no actors_render() has run since. That happens whenever
    // a script keeps the VM busy (a dialogue, a long event chain) after
    // changing actor->frame - Set Animation State, Set Animation Frame, and
    // friends. Uploading the new tiles then would show them under the old
    // metasprite for one frame, which reads as a sprite glitch.
    UBYTE oam_base = _shadow_OAM_base;
    if (oam_base == stream_last_oam_base) return;
    stream_last_oam_base = oam_base;

    UBYTE budget = streamable_actor_budget;
    if (!budget) return;

#ifdef CGB
    UBYTE save_vbk = VBK_REG;
    VBK_REG = VBK_BANK_0;
#endif

    UBYTE start = stream_rr;
    for (UBYTE k = 0; k != STREAMABLE_ACTOR_SLOTS; k++) {
        UBYTE idx = start + k;
        if (idx >= STREAMABLE_ACTOR_SLOTS) idx -= STREAMABLE_ACTOR_SLOTS;

        stream_slot_t *slot = &streamable_actor_slots[idx];
        actor_t *actor = slot->actor;
        if (!actor) continue;

        UBYTE frame = actor->frame;
        if (frame == slot->cur_frame) continue;
        if (!STREAM_SLOT_IS_LIVE(slot, actor)) continue;
        if (frame >= slot->n_frames) continue;

        stream_frame_t fd;
        stream_fetch(&fd, slot->frames + frame, slot->bank);
        UBYTE n = fd.n_tiles;
        if (n > slot->band_tiles) n = slot->band_tiles;

        if (n > budget) {
            // Not enough VBlank left for this actor: leave it for the next
            // frame (it keeps showing its previous tiles) and serve it first
            // then. If the budget was still untouched the frame simply does
            // not fit in it at all - upload it anyway rather than freezing
            // this actor's animation forever, and skip the other slots.
            if (budget != streamable_actor_budget) {
                stream_rr = idx;
                break;
            }
            budget = n;
        }

        if (n) stream_copy(slot->base_tile, n, slot->tiles + fd.offset, slot->bank);
        slot->cur_frame = frame;
        budget -= n;
    }

#ifdef CGB
    VBK_REG = save_vbk;
#endif
}

// ---------------------------------------------------------------------------
// Slot management
// ---------------------------------------------------------------------------

static stream_slot_t *stream_find(actor_t *actor) {
    stream_slot_t *slot = streamable_actor_slots;
    for (UBYTE i = 0; i != STREAMABLE_ACTOR_SLOTS; i++, slot++) {
        if (slot->actor == actor) return slot;
    }
    return NULL;
}

static stream_slot_t *stream_alloc(actor_t *actor) {
    stream_slot_t *slot = stream_find(actor);
    if (slot) return slot;
    // free slot
    slot = streamable_actor_slots;
    for (UBYTE i = 0; i != STREAMABLE_ACTOR_SLOTS; i++, slot++) {
        if (!slot->actor) return slot;
    }
    // recycle a registration left behind by a previous scene
    slot = streamable_actor_slots;
    for (UBYTE i = 0; i != STREAMABLE_ACTOR_SLOTS; i++, slot++) {
        if (!STREAM_SLOT_IS_LIVE(slot, slot->actor)) return slot;
    }
    return NULL;
}

// Write a 16-bit result into a script destination.
//   idx >= 0 : global variable slot (script_memory + idx)
//   idx <  0 : stack-local; compensate for the `nargs` temporary values still
//              sitting on the VM stack at native-call time.
static void stream_write(SCRIPT_CTX *THIS, INT16 idx, INT16 value, UBYTE nargs) {
    INT16 *A;
    if (idx < 0) {
        A = (INT16 *)(THIS->stack_ptr + idx - nargs);
    } else {
        A = (INT16 *)(script_memory + idx);
    }
    *A = value;
}

// ---------------------------------------------------------------------------
// VM interface
// ---------------------------------------------------------------------------

// args (push order): band_tiles, anim_set, flags, actor, desc, sheet, bank
void vm_stream_actor(SCRIPT_CTX *THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE bank                  = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    const spritesheet_t *sheet  = *(const spritesheet_t **)VM_REF_TO_PTR(FN_ARG1);
    const stream_sheet_t *desc  = *(const stream_sheet_t **)VM_REF_TO_PTR(FN_ARG2);
    actor_t *actor              = actors + *(UBYTE *)VM_REF_TO_PTR(FN_ARG3);
    UBYTE flags                 = *(UBYTE *)VM_REF_TO_PTR(FN_ARG4);
    UWORD anim_set              = *(UWORD *)VM_REF_TO_PTR(FN_ARG5);
    UBYTE band_tiles            = *(UBYTE *)VM_REF_TO_PTR(FN_ARG6);

    stream_slot_t *slot = stream_alloc(actor);
    if (!slot) return;

    // Park the slot while it is being rewritten: the VBlank handler skips
    // slots without an actor, so it can never catch a half-updated one.
    slot->actor = NULL;

    stream_sheet_t sd;
    MemcpyBanked(&sd, (void *)desc, sizeof(sd), bank);

    // Repoint the actor at the streamed sheet without loading any tiles: the
    // band is filled one frame at a time by the VBlank handler.
    actor->sprite.bank = bank;
    actor->sprite.ptr = (void *)sheet;
    load_animations(sheet, bank, anim_set, actor->animations);
    if (flags & STREAM_FLAG_SET_BOUNDS) load_bounds(sheet, bank, &actor->bounds);
    actor_reset_anim(actor);

    slot->sheet      = sheet;
    slot->bank       = bank;
    slot->tiles      = sd.tiles;
    slot->frames     = sd.frames;
    slot->n_frames   = sd.n_frames;
    slot->base_tile  = actor->base_tile;
    slot->band_tiles = (band_tiles && (band_tiles < sd.max_tiles)) ? band_tiles : sd.max_tiles;
    slot->cur_frame  = 0xFFu;
    slot->actor      = actor;

    if (!stream_isr_installed) {
        CRITICAL {
            add_VBL(streamable_actor_VBL_isr);
        }
        stream_isr_installed = TRUE;
    }

    if (flags & STREAM_FLAG_UPLOAD_NOW) {
        if (LCDC_REG & LCDCF_ON) wait_vbl_done();
        streamable_actor_upload(slot, actor->frame);
    }
}

// args (push order): actor
void vm_stream_actor_stop(SCRIPT_CTX *THIS) OLDCALL BANKED {
    (void)THIS;
    actor_t *actor = actors + *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    stream_slot_t *slot = stream_find(actor);
    if (slot) slot->actor = NULL;
}

void vm_stream_actor_stop_all(SCRIPT_CTX *THIS) OLDCALL BANKED {
    (void)THIS;
    memset(streamable_actor_slots, 0, sizeof(streamable_actor_slots));
    stream_rr = 0;
}

// args (push order): actor -- forces the actor's current frame into VRAM now
void vm_stream_actor_upload_now(SCRIPT_CTX *THIS) OLDCALL BANKED {
    (void)THIS;
    actor_t *actor = actors + *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    stream_slot_t *slot = stream_find(actor);
    if (!slot) return;
    if (!STREAM_SLOT_IS_LIVE(slot, actor)) return;
    if (LCDC_REG & LCDCF_ON) wait_vbl_done();
    streamable_actor_upload(slot, actor->frame);
}

// args (push order): dest_streaming, dest_base_tile, dest_band_tiles, actor
void vm_stream_actor_get_info(SCRIPT_CTX *THIS) OLDCALL BANKED {
    INT16 dest_streaming = *(INT16 *)VM_REF_TO_PTR(FN_ARG3);
    INT16 dest_base      = *(INT16 *)VM_REF_TO_PTR(FN_ARG2);
    INT16 dest_band      = *(INT16 *)VM_REF_TO_PTR(FN_ARG1);
    actor_t *actor       = actors + *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);

    stream_slot_t *slot = stream_find(actor);
    UBYTE live = (slot != NULL) && STREAM_SLOT_IS_LIVE(slot, actor);

    stream_write(THIS, dest_streaming, live ? 1 : 0, 4);
    stream_write(THIS, dest_base, live ? slot->base_tile : 0, 4);
    stream_write(THIS, dest_band, live ? slot->band_tiles : 0, 4);
}
