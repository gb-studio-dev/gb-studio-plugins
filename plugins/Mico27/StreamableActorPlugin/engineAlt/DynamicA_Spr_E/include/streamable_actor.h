#ifndef STREAMABLE_ACTOR_H
#define STREAMABLE_ACTOR_H

#include <gbdk/platform.h>
#include "vm.h"
#include "gbs_types.h"
#include "actor.h"
#include "data/states_defines.h"

// Number of actors that can stream their frames simultaneously.
// Overridden by the STREAMABLE_ACTOR_SLOTS engine setting.
#ifndef STREAMABLE_ACTOR_SLOTS
#define STREAMABLE_ACTOR_SLOTS 4
#endif

// How a new frame reaches VRAM, chosen by the STREAMABLE_ACTOR_MODE setting.
//
//   VBLANK      - copy the frame over the tiles the actor is drawing from.
//                 One band per actor, but the whole frame has to be copied in
//                 a single VBlank: anything the actor is showing while the
//                 copy is in flight is half of one frame and half of another,
//                 and a copy that outlasts VBlank holds off the LCD interrupt
//                 that parallax scenes use to set the first row's scroll.
//
//   VRAM_BUFFER - reserve two bands per actor and copy into the one the actor
//                 is *not* drawing from, then point the actor at it. Nothing
//                 on screen changes until that switch, so the copy can be
//                 spread over as many VBlanks as the tile budget needs and a
//                 small budget becomes safe. Costs twice the sprite VRAM.
#define STREAM_MODE_VBLANK      0
#define STREAM_MODE_VRAM_BUFFER 1

#ifndef STREAMABLE_ACTOR_MODE
#define STREAMABLE_ACTOR_MODE STREAM_MODE_VBLANK
#endif

#define STREAM_BUFFERED (STREAMABLE_ACTOR_MODE == STREAM_MODE_VRAM_BUFFER)

// Flags for vm_stream_actor()
#define STREAM_FLAG_UPLOAD_NOW  0x01    // upload the current frame immediately
#define STREAM_FLAG_SET_BOUNDS  0x02    // also copy the streamed sheet's bounds to the actor

// ---------------------------------------------------------------------------
// ROM side (emitted at build time by the "Stream Actor Spritesheet" event)
// ---------------------------------------------------------------------------

// One entry per animation frame of a streamed spritesheet. Each frame owns a
// contiguous block of 8x8 tiles inside the sheet's tile array, so uploading a
// frame is a single linear copy. Frames with identical tile blocks share one
// block, frames may have different tile counts.
typedef struct stream_frame_t {
    uint16_t offset;        // byte offset of the frame's tile block in tiles[]
    uint8_t  n_tiles;       // number of 8x8 tiles in the block
} stream_frame_t;

// Streaming descriptor that accompanies a generated streamed spritesheet_t.
typedef struct stream_sheet_t {
    const uint8_t *tiles;           // all frame blocks, back to back
    const stream_frame_t *frames;   // one entry per metasprite (actor->frame)
    uint8_t n_frames;
    uint8_t max_tiles;              // largest frame = VRAM tiles the actor needs
    uint8_t tiles_bank;             // bank of the shared pool tiles[] points into
} stream_sheet_t;

// ---------------------------------------------------------------------------
// RAM side
// ---------------------------------------------------------------------------

typedef struct stream_slot_t {
    actor_t *actor;                 // NULL when the slot is free
    const void *sheet;              // expected actor->sprite.ptr (staleness guard)
    const uint8_t *tiles;
    const stream_frame_t *frames;
    uint8_t bank;                   // bank holding frames[] and the sheet itself
    uint8_t tiles_bank;             // bank holding the shared tile pool
    uint8_t n_frames;
    uint8_t base_tile;              // first VRAM tile of the actor's band
    uint8_t band_tiles;             // tiles one frame needs (upload clamp)
    uint8_t cur_frame;              // frame currently resident in VRAM (0xFF = none)
#if STREAM_BUFFERED
    uint16_t band_offset[2];        // tile block resident in each half of the band
    uint8_t band_frame[2];          // frame each half is known to hold (0xFF = none)
#endif
} stream_slot_t;

// No block ever lands here, so it means "this half holds nothing yet".
#define STREAM_NO_OFFSET 0xFFFFu
#define STREAM_NO_FRAME  0xFFu

extern UBYTE streamable_actor_enabled;
extern UBYTE streamable_actor_budget;
extern stream_slot_t streamable_actor_slots[STREAMABLE_ACTOR_SLOTS];

// Uploads `frame` of a slot's sheet into the actor's VRAM band; saves and
// restores the ROM bank and the VRAM bank. Main thread only - it goes through
// the engine's bankdata.c helpers, which are not reentrant. The VBlank
// streamer has its own reentrant path and does not call this.
void streamable_actor_upload(stream_slot_t *slot, UBYTE frame) BANKED;

#if STREAM_BUFFERED

// VRAM buffer mode does its copying from the end of actors_update(), in the
// actor.c override, just before the actors are rendered - never from VBlank.
// By then the frame the actor is about to be drawn with is final, so the new
// tiles and the OAM entries that reference them always agree, and the copy
// costs ordinary main-thread time instead of holding off the LCD interrupts
// that set parallax scroll and hide sprites behind the overlay.
//
// Writing over the band the actor is drawing from would be visible - the LCD
// is mid-frame - which is why this mode keeps a second band and switches the
// actor over once the copy is complete.
//
// Called once at the end of actors_update(), not per actor: by then every
// actor's frame for the coming render is final, and walking the handful of
// streaming slots is far less work than asking "is this one streamed?" for
// every actor being drawn. Banked, so it costs the plugin no bank 0 space -
// the caller is banked too, so an idle frame pays one trampoline through
// ___sdcc_bcall_ehl.
void streamable_actor_sync_all(void) BANKED;

// Copies one frame into the actor's spare band and switches it over. Assumes
// its caller has already checked that the slot is live and that the frame is
// not the one either half of the band already holds.
void streamable_actor_sync_slot(stream_slot_t *slot, actor_t *actor) BANKED;

#define STREAMABLE_ACTOR_SYNC_ALL() streamable_actor_sync_all()

#else

// VBlank handler doing the actual streaming, installed on first registration.
// A thin bank 0 stub; the work happens in stream_vbl_update() in the plugin's
// own bank.
void streamable_actor_VBL_isr(void) NONBANKED;
void stream_vbl_update(void) BANKED;

#define STREAMABLE_ACTOR_SYNC_ALL() ((void)0)

#endif

void vm_stream_actor(SCRIPT_CTX *THIS) OLDCALL BANKED;
void vm_stream_actor_stop(SCRIPT_CTX *THIS) OLDCALL BANKED;
void vm_stream_actor_stop_all(SCRIPT_CTX *THIS) OLDCALL BANKED;
void vm_stream_actor_upload_now(SCRIPT_CTX *THIS) OLDCALL BANKED;
void vm_stream_actor_get_info(SCRIPT_CTX *THIS) OLDCALL BANKED;

#endif
