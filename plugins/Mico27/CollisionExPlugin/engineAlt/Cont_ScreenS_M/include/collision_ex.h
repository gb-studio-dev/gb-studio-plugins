#ifndef COLLISION_EX_H
#define COLLISION_EX_H

#include <gbdk/platform.h>

// Must come first: the COLLISION_EX_* switches below arrive from here, so this
// header has to see them whatever order the including file uses.
#include "data/states_defines.h"

#include "vm.h"
#include "events.h"

// Engine field. XOR'd into every tile collision mask the scene type code tests
// for the PLAYER: XOR a COLLISION_* direction bit out to walk through that side,
// or XOR a tile property bit in to make those tiles solid. 0 = stock collision.
//
// Declared even when the feature is compiled out: GB Studio builds the engine
// field's initialiser (a .globl plus a memory set) from the engine.json entry
// regardless of any #define, so the symbol has to exist or the link fails.
extern UBYTE player_xor_tile_collision;

// Wrapped around every tile collision mask the scene type code tests for the
// player. With COLLISION_EX_ENABLE_PLAYER_XOR off it expands to the plain mask,
// so each of the ~34 test sites compiles exactly as stock does - no load, no
// XOR, no ROM, nothing per frame.
//
// Only the PLAYER's own tests go through this. A dynamic actor has its own
// per-behavior XOR (DynamicActorPlugin) and a projectile its own per-definition
// one (DynamicProjectilePlugin), so nothing is XOR'd twice.
#ifdef COLLISION_EX_ENABLE_PLAYER_XOR
#define PLAYER_TILE_COL(mask) ((mask) ^ player_xor_tile_collision)
#else
#define PLAYER_TILE_COL(mask) (mask)
#endif

#ifdef COLLISION_EX_ENABLE_GET_TILE_COLLISION
// args (push order): tileX, tileY, dest
void vm_get_tile_collision(SCRIPT_CTX * THIS) OLDCALL BANKED;
#endif

// --- Player tile events -----------------------------------------------------
// Callback slots, numbered as the "Attach a Script to a Player Tile Event" event
// stores them, so they are fixed and must never be renumbered. Slot order
// matches MetatilePlugin's metatile events, which do the same job for metatiles.
#define COLLISION_EX_EVENT_TILE_ENTER      0
#define COLLISION_EX_EVENT_COLLISION_DOWN  1
#define COLLISION_EX_EVENT_COLLISION_RIGHT 2
#define COLLISION_EX_EVENT_COLLISION_UP    3
#define COLLISION_EX_EVENT_COLLISION_LEFT  4
#define COLLISION_EX_EVENTS                5
// The event's "Any collision" option, which writes all four collision slots.
#define COLLISION_EX_EVENT_COLLISION_ANY   5

// Direction of travel a collision happened in, which is also the slot it fires.
#define COLLISION_EX_DIR_DOWN  COLLISION_EX_EVENT_COLLISION_DOWN
#define COLLISION_EX_DIR_RIGHT COLLISION_EX_EVENT_COLLISION_RIGHT
#define COLLISION_EX_DIR_UP    COLLISION_EX_EVENT_COLLISION_UP
#define COLLISION_EX_DIR_LEFT  COLLISION_EX_EVENT_COLLISION_LEFT

// The two features share the slot table and the dispatch helper, so it is
// compiled whenever either of them is.
#if defined(COLLISION_EX_ENABLE_TILE_ENTER_EVENT) || defined(COLLISION_EX_ENABLE_TILE_COLLISION_EVENT)
#define COLLISION_EX_USES_TILE_EVENTS

extern script_event_t collision_ex_events[COLLISION_EX_EVENTS];

// Engine fields filled in before a callback runs, so the script can branch on
// what happened. Kept as separate sets for the two events, the way
// MetatilePlugin keeps its overlap_* and collided_* fields apart: a frame can
// both collide and enter, and a script reading one set must not see the other's.
extern UBYTE entered_tile_value;
extern UBYTE entered_tile_x;
extern UBYTE entered_tile_y;
extern UBYTE collided_tile_value;
extern UBYTE collided_tile_x;
extern UBYTE collided_tile_y;
extern UBYTE collided_tile_dir;

// Clears the slots and the enter tracking. Called from every scene type's init.
void collision_ex_init(void) BANKED;

// args (push order): script ptr, script bank, slot
void vm_assign_player_tile_script(SCRIPT_CTX * THIS) OLDCALL BANKED;
#endif

#ifdef COLLISION_EX_ENABLE_TILE_COLLISION_EVENT
// The player was stopped by `tile` while travelling in `dir`. The tile's
// collision byte is what the test returned, so it is passed in rather than read
// back - tile_at() would repeat the banked read the test just did. The position
// comes out of the engine's tile_hit_x / tile_hit_y, which every
// tile_col_test_range_* call leaves behind.
void collision_ex_tile_collision(UBYTE tile, UBYTE dir) BANKED;

// Holds the tile the test found while the callback runs, so the expression still
// yields it. One byte, and only when the event is compiled in.
//
// It is what keeps `test` out of the macro body more than once: a bare
// `(test ? (report(test), test) : 0)` would substitute the expression three
// times, and `test` is a tile_col_test_range_* call - three banked tile scans per
// blocked move, which costs far more than the one byte saved.
extern UBYTE collision_ex_hit;

// Wrapped around a player tile test in the scene type code: fires the collision
// callback when the test hits, passing it the tile the test returned, and
// evaluates to that same value either way, so a call site that reads the tile is
// unaffected. The test is evaluated exactly once.
//
// Written on one line at each site on purpose - the scene state files exist in a
// dozen merged variants with differing indentation, and a single-line wrap is the
// one edit that is identical in all of them. With the event switched off it
// expands to the bare test and the sites compile as stock does.
#define COLLISION_EX_HIT(test, dir) \
    ((collision_ex_hit = (test)) ? (collision_ex_tile_collision(collision_ex_hit, dir), collision_ex_hit) : 0)
#else
#define COLLISION_EX_HIT(test, dir) (test)
#endif

// Enter detection, run once per frame at the end of each scene type's update.
// In origin point mode that is the single tile under the player's position; in
// bounding box mode it is every tile the player's collision box covers, and the
// event fires for each one the box did not cover last frame.
#ifdef COLLISION_EX_ENABLE_TILE_ENTER_EVENT
void collision_ex_tile_update(void) BANKED;
#define COLLISION_EX_UPDATE() collision_ex_tile_update()
#else
#define COLLISION_EX_UPDATE() ((void)0)
#endif

#ifdef COLLISION_EX_USES_TILE_EVENTS
#define COLLISION_EX_INIT() collision_ex_init()
#else
#define COLLISION_EX_INIT() ((void)0)
#endif

#endif
