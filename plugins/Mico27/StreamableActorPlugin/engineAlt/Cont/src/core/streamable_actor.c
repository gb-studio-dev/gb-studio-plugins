#pragma bank 255

// Streamable Actor Plugin
//
// Keeps only the *current* animation frame of an actor resident in sprite VRAM
// instead of its whole spritesheet, the way Link's Awakening streams Link's
// frames into a fixed tile band.
//
//   * At build time the "Stream Actor Spritesheet" event re-packs the sheet so
//     every frame owns a contiguous block of tiles whose metasprite references
//     tiles 0..n-1 of that block (see stream_sheet_t).
//   * At run time the actor keeps the fixed base_tile of the band GB Studio
//     reserved for it, so the render path is unchanged: move_metasprite() adds
//     base_tile to the frame-local tile ids.
//   * Whichever streamer the mode selects copies a block into the band when
//     actor->frame changes.
//
// Everything runs from the plugin's own bank except the stubs marked NONBANKED,
// which have to be resident in bank 0.

#include <gbdk/platform.h>
#include <string.h>

#include "vm.h"
#include "gbs_types.h"
#include "actor.h"
#include "bankdata.h"
#include "data_manager.h"
#include "system.h"     // _is_CGB, for the colour-only DMA path
#include "streamable_actor.h"

// Engine fields - declaration order must match engine.json field order.
UBYTE streamable_actor_enabled;
UBYTE streamable_actor_budget;

stream_slot_t streamable_actor_slots[STREAMABLE_ACTOR_SLOTS];

#if !STREAM_BUFFERED
static stream_slot_t *stream_rr;    // slot to serve first next time (NULL = table start)
static UBYTE stream_isr_installed;
static UBYTE stream_last_oam_base;  // shadow OAM page committed at the last VBlank
#endif

// ---------------------------------------------------------------------------
// Bank 0 residents
//
// The streamer runs from the plugin bank, so it cannot page in a sheet's data
// bank itself; these stubs do it for it, plus the VBlank entry point, which has
// to be here because add_VBL() calls it directly.
//
// They deliberately avoid bankdata.c: every routine there stashes the outgoing
// bank in one shared static and is documented non-reentrant, and these run from
// VBlank while the main thread is very likely inside one of them. Keeping the
// saved bank in a stack local makes them reentrant.
//
// They take plain scalars rather than a stream_slot_t because every struct
// dereference here would be bank 0 code; the banked callers work that out. The
// byte-at-a-time copy is for the same reason - a struct assignment pulls in
// ___memcpy.
// ---------------------------------------------------------------------------

static void stream_fetch(stream_frame_t *dest, const stream_frame_t *src, UBYTE bank) NONBANKED {
    UBYTE save_bank = CURRENT_BANK;
    SWITCH_ROM(bank);
    UBYTE *d = (UBYTE *)dest;
    const UBYTE *s = (const UBYTE *)src;
    *d++ = *s++;
    *d++ = *s++;
    *d++ = *s++;
    *d = *s;
    SWITCH_ROM(save_bank);
}

#if !STREAM_BUFFERED

// Reentrant equivalent of the engine's SetBankedSpriteData(). On a Game Boy
// Color general purpose DMA moves 16 bytes in about 8 cycles where
// set_sprite_data spends roughly 208 on the same tile, re-checking STAT before
// every byte - the difference between a four tile frame costing most of VBlank
// and almost none of it.
//
// GDMA ignores the low four bits of its source address, so it needs a 16 byte
// aligned tile pool, which is what STREAMABLE_ACTOR_ALIGN_POOLS guarantees.
// There is deliberately no runtime check: an unaligned pool draws visibly
// scrambled tiles, which is the cue to turn that setting on. Turning
// STREAMABLE_ACTOR_USE_HDMA off falls back to the slow copy, always correct.
static void stream_copy(UBYTE base_tile, UBYTE n, const UBYTE *src, UBYTE bank) NONBANKED {
    UBYTE save_bank = CURRENT_BANK;
    SWITCH_ROM(bank);

#if defined(CGB) && defined(STREAMABLE_ACTOR_USE_HDMA)
    if (_is_CGB) {
        UWORD dest = 0x8000u + ((UWORD)base_tile << 4);
        HDMA1_REG = (UBYTE)((UWORD)src >> 8);
        HDMA2_REG = (UBYTE)((UWORD)src & 0xF0u);
        HDMA3_REG = (UBYTE)(dest >> 8);
        HDMA4_REG = (UBYTE)(dest & 0xF0u);
        // Bit 7 clear selects general purpose DMA: n blocks of 16 bytes, all
        // moved now, with the CPU halted for the duration.
        HDMA5_REG = n - 1;
    } else
#endif
    {
        set_sprite_data(base_tile, n, src);
    }

    SWITCH_ROM(save_bank);
}

// The cheap checks live here in bank 0 because this runs sixty times a second
// and reaching stream_vbl_update() costs a banked call before it can even look
// at a slot. An animation changes frame every several frames at best, so most
// VBlanks have nothing to copy and end here.
void streamable_actor_VBL_isr(void) NONBANKED {
    if (!streamable_actor_enabled) return;

    // Only stream in a VBlank a render pass just fed. GB Studio flips
    // _shadow_OAM_base once per rendered frame, so an unchanged page means no
    // actors_render() has run since - which happens whenever a script keeps the
    // VM busy after changing actor->frame. Uploading then would show the new
    // tiles under the old metasprite for one frame.
    UBYTE oam_base = _shadow_OAM_base;
    if (oam_base == stream_last_oam_base) return;
    stream_last_oam_base = oam_base;

    if (!streamable_actor_budget) return;

    // Is any streamed actor showing a frame it has not been given tiles for?
    stream_slot_t *slot = streamable_actor_slots;
    for (UBYTE i = 0; i != STREAMABLE_ACTOR_SLOTS; i++, slot++) {
        actor_t *actor = slot->actor;
        if (actor && (actor->frame != slot->cur_frame)) {
            stream_vbl_update();
            return;
        }
    }
}

#endif // !STREAM_BUFFERED

// ---------------------------------------------------------------------------
// VRAM upload
// ---------------------------------------------------------------------------

// Puts one frame's block in a band, in up to two pieces: a colour only sheet
// splits its tiles over both VRAM banks, bank 0's share first, so the second
// bank gets the tail of the block at the same tile index. Every other sheet has
// n1 == 0. Main thread only - SetBankedSpriteData is not reentrant.
static void stream_put(UBYTE dest, UBYTE n0, UBYTE n1, const UBYTE *src, UBYTE bank) {
#ifdef CGB
    UBYTE save_vbk = VBK_REG;
    VBK_REG = VBK_BANK_0;
#endif
    if (n0) SetBankedSpriteData(dest, n0, src, bank);
#ifdef CGB
    // Guarded the way load_sprite() guards the stock second tileset: an
    // original Game Boy has no second bank to put them in.
    if (n1 && _is_CGB) {
        VBK_REG = VBK_BANK_1;
        SetBankedSpriteData(dest, n1, src + ((UWORD)n0 << 4), bank);
    }
    VBK_REG = save_vbk;
#endif
}

// Main thread only: MemcpyBanked and SetBankedSpriteData are not reentrant.
void streamable_actor_upload(stream_slot_t *slot, UBYTE frame) BANKED {
    if (frame >= slot->n_frames) return;

    stream_frame_t fd;
    stream_fetch(&fd, slot->frames + frame, slot->bank);

    UBYTE n0 = fd.n_bank0;
    UBYTE n1 = fd.n_tiles - n0;
    if (n0 > slot->band_slots) n0 = slot->band_slots;
    if (n1 > slot->band_slots) n1 = slot->band_slots;
    UBYTE n = n0 + n1;

#if STREAM_BUFFERED
    // The "make it right now" path, so it writes over the band the actor is
    // drawing from, which is not base_tile once it has switched to the spare.
    UBYTE dest = slot->actor ? slot->actor->base_tile : slot->base_tile;
#else
    UBYTE dest = slot->base_tile;
#endif

    if (n) stream_put(dest, n0, n1, slot->tiles + fd.offset, slot->tiles_bank);
    slot->cur_frame = frame;
#if STREAM_BUFFERED
    // Note what this put in that half, so the per-frame sync knows it is there.
    {
        UBYTE half = (dest == slot->base_tile) ? 0 : 1;
        slot->band_offset[half] = n ? fd.offset : STREAM_NO_OFFSET;
        slot->band_frame[half] = n ? frame : STREAM_NO_FRAME;
    }
#endif
}

// A slot is only serviced while the actor still points at the streamed sheet
// and still owns the same band. Both change when a scene is reloaded or another
// event swaps the sheet, which is how stale registrations are ignored rather
// than corrupting VRAM. When buffered the actor sits on either half.
#if STREAM_BUFFERED
#define STREAM_SLOT_IS_LIVE(SLOT, ACTOR)                                    \
    (((ACTOR)->sprite.ptr == (SLOT)->sheet) &&                              \
     (((ACTOR)->base_tile == (SLOT)->base_tile) ||                          \
      ((ACTOR)->base_tile == (UBYTE)((SLOT)->base_tile + (SLOT)->band_slots))))
#else
#define STREAM_SLOT_IS_LIVE(SLOT, ACTOR) \
    (((ACTOR)->sprite.ptr == (SLOT)->sheet) && ((ACTOR)->base_tile == (SLOT)->base_tile))
#endif

#if STREAM_BUFFERED

// ---------------------------------------------------------------------------
// VRAM buffer mode: copy from the end of actors_update(), never in VBlank.
//
// By then the frame each actor will be drawn with is final, so tiles and OAM
// entries always agree, and the copy costs main thread time instead of holding
// off the LCD interrupts that set parallax scroll and hide sprites behind the
// overlay. The LCD is mid-frame though, so the copy cannot go into the band the
// actor is drawing from - hence the second band and the switch.
// ---------------------------------------------------------------------------

// Only called from streamable_actor_sync_all(), which has already established
// that the slot is live and that neither half holds the frame. The range check
// stays: a script can point an actor at a frame its sheet does not have.
void streamable_actor_sync_slot(stream_slot_t *slot, actor_t *actor) BANKED {
    UBYTE frame = actor->frame;
    if (frame >= slot->n_frames) return;

    stream_frame_t fd;
    stream_fetch(&fd, slot->frames + frame, slot->bank);

    UBYTE n0 = fd.n_bank0;
    UBYTE n1 = fd.n_tiles - n0;
    if (n0 > slot->band_slots) n0 = slot->band_slots;
    if (n1 > slot->band_slots) n1 = slot->band_slots;

    if (n0 || n1) {
        // The pixels may still be resident under another frame number: frames
        // drawn from identical tiles share one block, so equal offsets mean
        // equal pixels. Either way, note the frame against that half so the
        // cheap check in sync_all() catches it next time.
        //
        //   the half being drawn from has them -> nothing to do at all;
        //   the spare half has them            -> switch to it, no copy;
        //   neither                            -> copy, then switch.
        UBYTE front = (actor->base_tile == slot->base_tile) ? 0 : 1;

        if (fd.offset == slot->band_offset[front]) {
            slot->band_frame[front] = frame;
        } else {
            UBYTE back = front ^ 1;
            UBYTE back_tile = back ? (UBYTE)(slot->base_tile + slot->band_slots)
                                   : slot->base_tile;

            if (fd.offset != slot->band_offset[back]) {
                // The engine's guarded copy waits out mode 3 byte by byte,
                // which is what makes copying outside VBlank safe at all.
                stream_put(back_tile, n0, n1, slot->tiles + fd.offset, slot->tiles_bank);
                slot->band_offset[back] = fd.offset;
            }
            slot->band_frame[back] = frame;
            actor->base_tile = back_tile;   // switch over, in time for this render
        }
    }
    slot->cur_frame = frame;
}

// The two frame comparisons matter as much as the loop: reaching
// streamable_actor_sync_slot() costs a banked call, a spilled stack frame and a
// bank-switched descriptor read - hundreds of cycles to conclude there is
// nothing to do. Remembering what sits in each half answers that with byte
// compares.
void streamable_actor_sync_all(void) BANKED {
    if (!streamable_actor_enabled) return;

    stream_slot_t *slot = streamable_actor_slots;
    for (UBYTE i = 0; i != STREAMABLE_ACTOR_SLOTS; i++, slot++) {
        actor_t *actor = slot->actor;
        if (!actor) continue;

        UBYTE frame = actor->frame;
        if (frame == slot->cur_frame) continue;           // still the same frame
        if (!STREAM_SLOT_IS_LIVE(slot, actor)) continue;  // stale registration

        // Already loaded: point the actor at that half and move on, which is
        // what an animation does once it has cycled through its frames.
        if (frame == slot->band_frame[0]) {
            actor->base_tile = slot->base_tile;
            slot->cur_frame = frame;
            continue;
        }
        if (frame == slot->band_frame[1]) {
            actor->base_tile = slot->base_tile + slot->band_slots;
            slot->cur_frame = frame;
            continue;
        }

        streamable_actor_sync_slot(slot, actor);          // has to be copied
    }
}

#else

// Reached only when the ISR found something to copy; the gate and the budget
// check have already been made there.
void stream_vbl_update(void) BANKED {
    UBYTE budget = streamable_actor_budget;

#ifdef CGB
    UBYTE save_vbk = VBK_REG;
    VBK_REG = VBK_BANK_0;
#endif

    // Round robin, kept as a pointer rather than an index: stepping a pointer
    // is an add, where &slots[idx] has to scale idx by a struct size that is
    // not a power of two, every iteration.
    stream_slot_t *const end = streamable_actor_slots + STREAMABLE_ACTOR_SLOTS;
    stream_slot_t *slot = stream_rr ? stream_rr : streamable_actor_slots;

    for (UBYTE k = 0; k != STREAMABLE_ACTOR_SLOTS;
         k++, slot = (slot + 1 == end) ? streamable_actor_slots : slot + 1) {

        actor_t *actor = slot->actor;
        if (!actor) continue;

        UBYTE frame = actor->frame;
        if (frame == slot->cur_frame) continue;
        if (!STREAM_SLOT_IS_LIVE(slot, actor)) continue;
        if (frame >= slot->n_frames) continue;

        stream_frame_t fd;
        stream_fetch(&fd, slot->frames + frame, slot->bank);
        UBYTE n0 = fd.n_bank0;
        UBYTE n1 = fd.n_tiles - n0;
        if (n0 > slot->band_slots) n0 = slot->band_slots;
        if (n1 > slot->band_slots) n1 = slot->band_slots;
        UBYTE n = n0 + n1;

        if (n > budget) {
            // Not enough VBlank left: leave this actor showing its previous
            // tiles and serve it first next frame. If the budget was still
            // untouched the frame does not fit at all - upload it anyway
            // rather than freezing the animation forever, and skip the rest.
            if (budget != streamable_actor_budget) {
                stream_rr = slot;
                break;
            }
            budget = n;
        }

        if (n0) stream_copy(slot->base_tile, n0, slot->tiles + fd.offset, slot->tiles_bank);
#ifdef CGB
        // Second half of a colour only frame. The loop already selected bank 0
        // and puts back what was there on the way out. The tail of a block is a
        // whole number of tiles past its start, so GDMA stays aligned.
        if (n1 && _is_CGB) {
            VBK_REG = VBK_BANK_1;
            stream_copy(slot->base_tile, n1, slot->tiles + fd.offset + ((UWORD)n0 << 4), slot->tiles_bank);
            VBK_REG = VBK_BANK_0;
        }
#endif
        slot->cur_frame = frame;
        budget -= n;
    }

#ifdef CGB
    VBK_REG = save_vbk;
#endif
}

#endif // STREAM_BUFFERED

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

// args (push order): band_slots, anim_set, flags, actor, desc, sheet, bank
void vm_stream_actor(SCRIPT_CTX *THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE bank                  = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    const spritesheet_t *sheet  = *(const spritesheet_t **)VM_REF_TO_PTR(FN_ARG1);
    const stream_sheet_t *desc  = *(const stream_sheet_t **)VM_REF_TO_PTR(FN_ARG2);
    actor_t *actor              = actors + *(UBYTE *)VM_REF_TO_PTR(FN_ARG3);
    UBYTE flags                 = *(UBYTE *)VM_REF_TO_PTR(FN_ARG4);
    UWORD anim_set              = *(UWORD *)VM_REF_TO_PTR(FN_ARG5);
    UBYTE band_slots            = *(UBYTE *)VM_REF_TO_PTR(FN_ARG6);

    stream_slot_t *slot = stream_alloc(actor);
    if (!slot) return;

    // Park the slot while it is rewritten: the streamer skips slots without an
    // actor, so it can never catch a half-updated one.
    slot->actor = NULL;

    stream_sheet_t sd;
    MemcpyBanked(&sd, (void *)desc, sizeof(sd), bank);

    // Repoint the actor at the streamed sheet without loading any tiles; the
    // band is filled one frame at a time.
    actor->sprite.bank = bank;
    actor->sprite.ptr = (void *)sheet;
    load_animations(sheet, bank, anim_set, actor->animations);
    if (flags & STREAM_FLAG_SET_BOUNDS) load_bounds(sheet, bank, &actor->bounds);
    actor_reset_anim(actor);

    slot->sheet      = sheet;
    slot->bank       = bank;
    slot->tiles_bank = sd.tiles_bank;
    slot->tiles      = sd.tiles;
    slot->frames     = sd.frames;
    slot->n_frames   = sd.n_frames;
    slot->base_tile  = actor->base_tile;
    slot->band_slots = (band_slots && (band_slots < sd.max_slots)) ? band_slots : sd.max_slots;
    slot->cur_frame  = 0xFFu;
#if STREAM_BUFFERED
    slot->band_offset[0] = STREAM_NO_OFFSET;
    slot->band_offset[1] = STREAM_NO_OFFSET;
    slot->band_frame[0] = STREAM_NO_FRAME;
    slot->band_frame[1] = STREAM_NO_FRAME;
#endif
    slot->actor      = actor;

#if !STREAM_BUFFERED
    if (!stream_isr_installed) {
        CRITICAL {
            add_VBL(streamable_actor_VBL_isr);
        }
        stream_isr_installed = TRUE;
    }
#endif

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
#if !STREAM_BUFFERED
    stream_rr = NULL;
#endif
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

// args (push order): dest_streaming, dest_base_tile, dest_band_slots, actor
void vm_stream_actor_get_info(SCRIPT_CTX *THIS) OLDCALL BANKED {
    INT16 dest_streaming = *(INT16 *)VM_REF_TO_PTR(FN_ARG3);
    INT16 dest_base      = *(INT16 *)VM_REF_TO_PTR(FN_ARG2);
    INT16 dest_band      = *(INT16 *)VM_REF_TO_PTR(FN_ARG1);
    actor_t *actor       = actors + *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);

    stream_slot_t *slot = stream_find(actor);
    UBYTE live = (slot != NULL) && STREAM_SLOT_IS_LIVE(slot, actor);

    stream_write(THIS, dest_streaming, live ? 1 : 0, 4);
    stream_write(THIS, dest_base, live ? slot->base_tile : 0, 4);
    stream_write(THIS, dest_band, live ? slot->band_slots : 0, 4);
}
