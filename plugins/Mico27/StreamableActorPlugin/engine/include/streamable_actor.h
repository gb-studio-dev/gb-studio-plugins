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
} stream_sheet_t;

// ---------------------------------------------------------------------------
// RAM side
// ---------------------------------------------------------------------------

typedef struct stream_slot_t {
    actor_t *actor;                 // NULL when the slot is free
    const void *sheet;              // expected actor->sprite.ptr (staleness guard)
    const uint8_t *tiles;
    const stream_frame_t *frames;
    uint8_t bank;                   // bank holding tiles[] and frames[]
    uint8_t n_frames;
    uint8_t base_tile;              // first VRAM tile of the actor's band
    uint8_t band_tiles;             // tiles reserved for the actor (upload clamp)
    uint8_t cur_frame;              // frame currently resident in VRAM (0xFF = none)
} stream_slot_t;

extern UBYTE streamable_actor_enabled;
extern UBYTE streamable_actor_budget;
extern stream_slot_t streamable_actor_slots[STREAMABLE_ACTOR_SLOTS];

// Uploads `frame` of a slot's sheet into the actor's VRAM band; saves and
// restores the ROM bank and the VRAM bank. Main thread only - it goes through
// the engine's bankdata.c helpers, which are not reentrant. The VBlank
// streamer has its own reentrant path and does not call this.
void streamable_actor_upload(stream_slot_t *slot, UBYTE frame) BANKED;

// VBlank handler doing the actual streaming, installed on first registration.
// A thin bank 0 stub; the work happens in stream_vbl_update() in the plugin's
// own bank.
void streamable_actor_VBL_isr(void) NONBANKED;
void stream_vbl_update(void) BANKED;

void vm_stream_actor(SCRIPT_CTX *THIS) OLDCALL BANKED;
void vm_stream_actor_stop(SCRIPT_CTX *THIS) OLDCALL BANKED;
void vm_stream_actor_stop_all(SCRIPT_CTX *THIS) OLDCALL BANKED;
void vm_stream_actor_upload_now(SCRIPT_CTX *THIS) OLDCALL BANKED;
void vm_stream_actor_get_info(SCRIPT_CTX *THIS) OLDCALL BANKED;

#endif
