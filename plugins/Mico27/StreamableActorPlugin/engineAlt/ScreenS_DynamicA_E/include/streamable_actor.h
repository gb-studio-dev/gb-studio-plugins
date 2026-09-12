#ifndef STREAMABLE_ACTOR_H
#define STREAMABLE_ACTOR_H

#include <gbdk/platform.h>
#include "vm.h"
#include "gbs_types.h"
#include "actor.h"
#include "data/states_defines.h"

// Actors that can stream at once. Set by the STREAMABLE_ACTOR_SLOTS setting.
#ifndef STREAMABLE_ACTOR_SLOTS
#define STREAMABLE_ACTOR_SLOTS 4
#endif

// How a new frame reaches VRAM, chosen by STREAMABLE_ACTOR_MODE.
//
//   VBLANK      - one band per actor, copied over in a single VBlank. A copy
//                 that outlasts the blank tears, and holds off the LCD
//                 interrupt parallax scenes need.
//   VRAM_BUFFER - two bands per actor, copy into the spare one and switch the
//                 actor over. Nothing is visible mid-copy, so the copy can be
//                 spread out. Costs twice the sprite VRAM.
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

// One per animation frame. Each frame owns a contiguous block of tiles, so
// uploading it is one linear copy per VRAM bank it lands in; identical blocks
// are shared. Four bytes so indexing the table is a shift, not a multiply.
typedef struct stream_frame_t {
    uint16_t offset;        // byte offset of the frame's tile block in tiles[]
    uint8_t  n_tiles;       // number of 8x8 tiles in the block
    uint8_t  n_bank0;       // of which this many go in VRAM bank 0, the rest in
                            // bank 1 at the same indices (see max_slots)
} stream_frame_t;

// Streaming descriptor that accompanies a generated streamed spritesheet_t.
typedef struct stream_sheet_t {
    const uint8_t *tiles;           // all frame blocks, back to back
    const stream_frame_t *frames;   // one entry per metasprite (actor->frame)
    uint8_t n_frames;
    // Tile slots the band needs: the largest frame's tile count, or half of it
    // rounded up on a colour only sheet, whose tiles are split over both VRAM
    // banks the way GB Studio splits an ordinary sheet's. Rounded up again to
    // whole pairs in 8x16 mode, where one object owns two tiles.
    uint8_t max_slots;
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
    uint8_t band_slots;             // sheet's max_slots (upload clamp, and the
                                    // distance to the spare band when buffered)
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

// Uploads `frame` into the actor's band, saving and restoring both banks. Main
// thread only: it goes through bankdata.c, which is not reentrant. The VBlank
// streamer has its own reentrant path.
void streamable_actor_upload(stream_slot_t *slot, UBYTE frame) BANKED;

#if STREAM_BUFFERED

// Called once at the end of actors_update(), never from VBlank. Every actor's
// frame for the coming render is final by then, so the tiles and the OAM
// entries pointing at them always agree, and the copy costs main thread time
// rather than holding off the LCD interrupts that set parallax scroll. Walking
// the few slots here also beats asking "is this one streamed?" per drawn actor.
// Banked, which keeps the plugin out of bank 0 for one trampoline per frame.
void streamable_actor_sync_all(void) BANKED;

// Copies one frame into the spare band and switches the actor over. The caller
// has already checked that the slot is live and that neither half holds it.
void streamable_actor_sync_slot(stream_slot_t *slot, actor_t *actor) BANKED;

#define STREAMABLE_ACTOR_SYNC_ALL() streamable_actor_sync_all()

#else

// VBlank handler, installed on first registration. A thin bank 0 stub; the work
// happens in stream_vbl_update(), in the plugin's own bank.
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
