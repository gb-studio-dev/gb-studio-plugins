#pragma bank 255

#include <gbdk/platform.h>
#include "vm.h"
#include "actor.h"
#include "collision.h"
#include "math.h"
#include "collision_ex.h"

// Enter detection modes (COLLISION_EX_TILE_ENTER_DETECTION engine setting).
#define COLLISION_EX_ENTER_ORIGIN_POINT 0
#define COLLISION_EX_ENTER_BOUNDING_BOX 1
#ifndef COLLISION_EX_TILE_ENTER_DETECTION
#define COLLISION_EX_TILE_ENTER_DETECTION COLLISION_EX_ENTER_ORIGIN_POINT
#endif

// Engine Fields --------------------------------------------------------------

// Replaces every tile collision mask the scene type code tests for the player
// when non-zero. Not reset per scene: it is an engine field, so GB Studio
// initialises it to the configured value at engine init and scripts change it
// from there with Engine Field Update.
//
// Declared whatever the COLLISION_EX_ENABLE_PLAYER_OVERRIDE setting says, because GB
// Studio emits the field's initialiser from engine.json either way. With the
// setting off nothing reads it (PLAYER_TILE_COL is the identity) and it costs
// one byte of WRAM.
UBYTE player_override_tile_collision;

UBYTE entered_tile_value;
UBYTE entered_tile_x;
UBYTE entered_tile_y;
UBYTE collided_tile_value;
UBYTE collided_tile_x;
UBYTE collided_tile_y;
UBYTE collided_tile_dir;

// End of Engine Fields -------------------------------------------------------

#ifdef COLLISION_EX_ENABLE_GET_TILE_COLLISION
// Reads the raw collision byte of a scene tile into a variable, so a script can
// branch on the extra tile values this plugin makes paintable. Out of bounds
// reads report COLLISION_ALL, exactly as the engine's own tile tests do.
void vm_get_tile_collision(SCRIPT_CTX * THIS) OLDCALL BANKED {
    uint8_t tile_x = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    uint8_t tile_y = *(uint8_t *)VM_REF_TO_PTR(FN_ARG1);
    int16_t idx = *(int16_t *)VM_REF_TO_PTR(FN_ARG2);
    int16_t * A;
    if (idx < 0) A = THIS->stack_ptr + idx - 3; else A = script_memory + idx;
    *A = tile_at(tile_x, tile_y);
}
#endif

#ifdef COLLISION_EX_USES_TILE_EVENTS

script_event_t collision_ex_events[COLLISION_EX_EVENTS];

#ifdef COLLISION_EX_ENABLE_TILE_ENTER_EVENT
// The tiles the player covered at the end of the previous frame. In origin point
// mode only the one cell is tracked, so the span fields collapse to it.
static UBYTE prev_tile_x0;
static UBYTE prev_tile_y0;
#if COLLISION_EX_TILE_ENTER_DETECTION == COLLISION_EX_ENTER_BOUNDING_BOX
static UBYTE prev_tile_x1;
static UBYTE prev_tile_y1;
#endif
// Set once the first frame has recorded where the player started, so a scene
// does not open by reporting every tile under the player as newly entered.
static UBYTE prev_valid;
#endif

// One slot runs one script at a time: if the player triggers the same slot again
// while its previous script is still running, that firing is skipped rather than
// queued. Same rule the stock trigger and actor scripts follow.
static void collision_ex_run(UBYTE slot) {
    script_event_t *event = &collision_ex_events[slot];
    if (!event->script_addr) {
        return;
    }
    if ((event->handle == 0) || ((event->handle & SCRIPT_TERMINATED) != 0)) {
        script_execute(event->script_bank, event->script_addr, &event->handle, 0, 0);
    }
}

void collision_ex_init(void) BANKED {
    UBYTE i;
    for (i = 0; i != COLLISION_EX_EVENTS; ++i) {
        collision_ex_events[i].script_addr = 0;
        collision_ex_events[i].script_bank = 0;
        collision_ex_events[i].handle = 0;
    }
#ifdef COLLISION_EX_ENABLE_TILE_ENTER_EVENT
    prev_valid = FALSE;
#endif
}

// args (push order): script ptr, script bank, slot
void vm_assign_player_tile_script(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE slot = *(uint8_t *)VM_REF_TO_PTR(FN_ARG2);
    UBYTE *bank = VM_REF_TO_PTR(FN_ARG1);
    UBYTE **ptr = VM_REF_TO_PTR(FN_ARG0);
    if (slot == COLLISION_EX_EVENT_COLLISION_ANY) {
        // One script for all four faces, so the common case needs one event.
        UBYTE i;
        for (i = COLLISION_EX_EVENT_COLLISION_DOWN; i <= COLLISION_EX_EVENT_COLLISION_LEFT; ++i) {
            collision_ex_events[i].script_bank = *bank;
            collision_ex_events[i].script_addr = *ptr;
        }
        return;
    }
    if (slot >= COLLISION_EX_EVENTS) {
        return;
    }
    collision_ex_events[slot].script_bank = *bank;
    collision_ex_events[slot].script_addr = *ptr;
}

#ifdef COLLISION_EX_ENABLE_TILE_COLLISION_EVENT
// Set by COLLISION_EX_HIT so the wrapped expression still yields the tile the
// test found while the callback runs, without substituting the test expression
// into the macro body more than once.
UBYTE collision_ex_hit;

void collision_ex_tile_collision(UBYTE tile, UBYTE dir) BANKED {
    // The collision byte comes from the test that just matched, not a second
    // tile_at() - that would switch to the collision bank and read the same byte
    // again for nothing. tile_hit_x / tile_hit_y are where that test stopped.
    collided_tile_x = tile_hit_x;
    collided_tile_y = tile_hit_y;
    collided_tile_value = tile;
    collided_tile_dir = dir;
    collision_ex_run(dir);
}
#endif

#ifdef COLLISION_EX_ENABLE_TILE_ENTER_EVENT
static void collision_ex_enter(UBYTE tx, UBYTE ty) {
    entered_tile_x = tx;
    entered_tile_y = ty;
    entered_tile_value = tile_at(tx, ty);
    collision_ex_run(COLLISION_EX_EVENT_TILE_ENTER);
}

void collision_ex_tile_update(void) BANKED {
#if COLLISION_EX_TILE_ENTER_DETECTION == COLLISION_EX_ENTER_BOUNDING_BOX
    UBYTE x0 = SUBPX_TO_TILE(PLAYER.pos.x + PLAYER.bounds.left);
    UBYTE x1 = SUBPX_TO_TILE(PLAYER.pos.x + PLAYER.bounds.right);
    UBYTE y0 = SUBPX_TO_TILE(PLAYER.pos.y + PLAYER.bounds.top);
    UBYTE y1 = SUBPX_TO_TILE(PLAYER.pos.y + PLAYER.bounds.bottom);

    if (!prev_valid) {
        prev_tile_x0 = x0; prev_tile_x1 = x1;
        prev_tile_y0 = y0; prev_tile_y1 = y1;
        prev_valid = TRUE;
        return;
    }
    // Nothing moved on the tile grid: the common case, and the whole cost of
    // having the event switched on while the player stands still.
    if ((x0 == prev_tile_x0) && (x1 == prev_tile_x1) &&
        (y0 == prev_tile_y0) && (y1 == prev_tile_y1)) {
        return;
    }
    // Every tile the box covers now that it did not cover last frame. Walked in
    // scanline order, so a diagonal step reports the tiles it opened onto in a
    // stable order rather than whichever axis moved first.
    UBYTE ty = y0;
    while (1) {
        UBYTE tx = x0;
        while (1) {
            if ((tx < prev_tile_x0) || (tx > prev_tile_x1) ||
                (ty < prev_tile_y0) || (ty > prev_tile_y1)) {
                collision_ex_enter(tx, ty);
            }
            if (tx == x1) break;
            tx++;
        }
        if (ty == y1) break;
        ty++;
    }
    prev_tile_x0 = x0; prev_tile_x1 = x1;
    prev_tile_y0 = y0; prev_tile_y1 = y1;
#else
    UBYTE tx = SUBPX_TO_TILE(PLAYER.pos.x);
    UBYTE ty = SUBPX_TO_TILE(PLAYER.pos.y);
    if (!prev_valid) {
        prev_tile_x0 = tx;
        prev_tile_y0 = ty;
        prev_valid = TRUE;
        return;
    }
    if ((tx == prev_tile_x0) && (ty == prev_tile_y0)) {
        return;
    }
    prev_tile_x0 = tx;
    prev_tile_y0 = ty;
    collision_ex_enter(tx, ty);
#endif
}
#endif

#endif /* COLLISION_EX_USES_TILE_EVENTS */
