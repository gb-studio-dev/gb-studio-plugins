#ifndef DYNAMIC_ACTOR_H
#define DYNAMIC_ACTOR_H

#include <gbdk/platform.h>
#include "actor.h"
#include "events.h"
#include "data/states_defines.h"

// Number of user-definable behavior slots (slot 0 is reserved = no behavior)
#ifndef DYNAMIC_ACTOR_MAX_BEHAVIORS
#define DYNAMIC_ACTOR_MAX_BEHAVIORS 8
#endif

// Max moving-platform (BHV_PLATFORM) actors cached per frame for rider
// claiming/releasing. Platforms beyond this limit still move but never
// claim or release riders.
#ifndef DYNAMIC_ACTOR_MAX_PLATFORMS
#define DYNAMIC_ACTOR_MAX_PLATFORMS 2
#endif

// Parenting mode (DYNAMIC_ACTOR_PARENT_MODE engine setting) - how a parented
// actor follows its parent. Selected globally for the whole game.
//   STATIC   : the actor is rigidly pinned at a fixed pixel offset (its own
//              velocity, read as a pixel offset) from the parent position and
//              runs no other behavior code. Cheapest.
//   VELOCITY : the actor is displaced by its direct parent's velocity every
//              frame, then still runs its own behavior physics if it has one.
//   DELTA    : the actor is displaced by the summed position delta of its whole
//              parent chain (parent, grandparent, ...) since last frame, then
//              still runs its own behavior physics. Works with any parent
//              (including engine-moved actors like the player). Slowest.
#define DYNAMIC_ACTOR_PARENT_MODE_STATIC   0
#define DYNAMIC_ACTOR_PARENT_MODE_VELOCITY 1
#define DYNAMIC_ACTOR_PARENT_MODE_DELTA    2
#ifndef DYNAMIC_ACTOR_PARENT_MODE
#define DYNAMIC_ACTOR_PARENT_MODE DYNAMIC_ACTOR_PARENT_MODE_DELTA
#endif

// The per-actor prev_pos / prev_pos_z position snapshots only exist and are only
// maintained in DELTA parenting mode (it derives the parent movement from the
// position change between frames). The static and velocity modes don't need
// them, so they are compiled out of the actor struct (gbs_types.h) and every
// snapshot site below. gbs_types.h uses the raw numeric mode test since it can't
// see the DYNAMIC_ACTOR_PARENT_MODE_* names - keep them in sync.
#if defined(DYNAMIC_ACTOR_ENABLE_PARENT) && (DYNAMIC_ACTOR_PARENT_MODE == DYNAMIC_ACTOR_PARENT_MODE_DELTA)
#define DYNAMIC_ACTOR_USES_PREV_POS
#endif

// The velocity parenting mode carries a child by its direct parent's velocity,
// but the engine-controlled player never populates a velocity field. So when the
// parent is the player, that mode falls back to tracking the player by position
// delta, using a single player-position snapshot kept in dynamic_actor.c. That
// snapshot is only compiled in the velocity mode.
#if defined(DYNAMIC_ACTOR_ENABLE_PARENT) && (DYNAMIC_ACTOR_PARENT_MODE == DYNAMIC_ACTOR_PARENT_MODE_VELOCITY)
#define DYNAMIC_ACTOR_USES_PLAYER_PREV_POS
#endif

// Physics component flags (flags)
#define BHV_GRAVITY_Y   0x01u  // apply gravity to y velocity, clamped to max_fall_vel
#define BHV_GRAVITY_Z   0x02u  // apply gravity to z velocity, clamped to max_fall_vel
#define BHV_LEDGE_STOP  0x04u  // while grounded, treat ledges/pits as walls
#define BHV_REFLECT_X   0x08u  // reverse x velocity on wall hit (otherwise stop)
#define BHV_REFLECT_Y   0x10u  // bounce y velocity on floor/ceiling hit (otherwise stop)
#define BHV_REFLECT_Z   0x20u  // bounce z velocity when z position hits the ground
#define BHV_PLATFORM    0x40u  // moving platform: sets itself as the parent of every
                               // actor it intersects (unless that actor already has a
                               // different parent, or the platform has a collision
                               // group and the actor's group differs), and clears
                               // itself as parent when the actor stops intersecting.
                               // Parented actors inherit the platform's movement.
#define BHV2_NO_TILE_COLLISION 0x80u  // move by velocity without tile collision
                                      // (passes through walls/floors; no wall turn,
                                      // bounce, ledge stop or landing)

// Lock / animation / secondary behavior flags (flags2)
#define BHV3_LOCK_POS_X        0x01u  // freeze x position updates
#define BHV3_LOCK_POS_Y        0x02u  // freeze y position updates
#define BHV3_LOCK_POS_Z        0x04u  // freeze z position updates
#define BHV3_LOCK_DIR_H        0x08u  // prevent behavior from changing left/right dir
#define BHV3_LOCK_DIR_V        0x10u  // prevent behavior from changing up/down dir
#define BHV2_ANIM_JUMP_Y       0x20u  // jump animation while airborne in y direction
#define BHV2_ANIM_JUMP_Z       0x40u  // jump animation while airborne in z direction
#define BHV2_ACTOR_COLLISION   0x80u  // collide with other actors (player excluded -
                                      // the engine already handles that): on overlap
                                      // the frame's movement is reverted and velocity
                                      // turns/bounces per the reflect settings

// Behavior event trigger flags (event_flags)
#define BHV_EVENT_STATE_CHANGE   0x01u  // allow state change events
#define BHV_EVENT_TILE_COLLISION_TOP     0x02u  // allow tile collision events
#define BHV_EVENT_TILE_COLLISION_RIGHT   0x04u  // allow tile collision events
#define BHV_EVENT_TILE_COLLISION_BOTTOM  0x08u  // allow tile collision events
#define BHV_EVENT_TILE_COLLISION_LEFT    0x10u  // allow tile collision events
#define BHV_EVENT_TILE_ENTER      0x20u  // allow tile enter events
#define BHV_EVENT_HIT_ACTORS      0x40u  // on collision, run the collided actor's onHit script
                                         // (the engine normally only does this for the player)
#define BHV_EVENT_ACTIVATE_TRIGGERS 0x80u // fire trigger onEnter/onLeave scripts as this actor
                                          // moves in/out of a trigger (player-style activation)

// Actor behavior states (actor_state). 4 through 15 are free for your own use.
// BHV_STATE_KEEP is a "leave it alone" marker for Set Actor Behavior, never a
// value that reaches the actor.
#define BHV_STATE_PAUSED    0
#define BHV_STATE_GROUNDED  1
#define BHV_STATE_AIRBORNE_Y 2
#define BHV_STATE_AIRBORNE_Z 3
#define BHV_STATE_KEEP      255

// Callback slot numbers are part of the plugin's saved project data (the
// "Attach a Script to a Dynamic Actor Event" event stores the slot number), so
// they are fixed and must never be renumbered. The slots are grouped so that
// each compile-time gate switches off a run of slots at the END of the table,
// which is what lets DYNAMIC_ACTOR_CALLBACK_SIZE shrink without moving any
// surviving slot: [0] state change, [1..4] tile collision, [5] tile enter,
// [6..7] activation.
typedef enum dynamic_actor_event_e {
    DYNAMIC_ACTOR_EVENT_STATE_CHANGE = 0,
    DYNAMIC_ACTOR_EVENT_TILE_COLLISION_TOP = 1,
    DYNAMIC_ACTOR_EVENT_TILE_COLLISION_RIGHT = 2,
    DYNAMIC_ACTOR_EVENT_TILE_COLLISION_BOTTOM = 3,
    DYNAMIC_ACTOR_EVENT_TILE_COLLISION_LEFT = 4,
    DYNAMIC_ACTOR_EVENT_TILE_ENTER = 5,
    DYNAMIC_ACTOR_EVENT_ACTOR_ACTIVATED = 6,
    DYNAMIC_ACTOR_EVENT_ACTOR_DEACTIVATED = 7
} dynamic_actor_event_e;

// Slots actually allocated, given the gates. Each entry is a script_event_t
// (5 bytes of RAM). Never zero - a zero length array is not valid C - so the
// leanest build still pays for slot 0.
#if defined(DYNAMIC_ACTOR_ENABLE_ACTIVATION_EVENTS)
#define DYNAMIC_ACTOR_CALLBACK_SIZE 8
#elif defined(DYNAMIC_ACTOR_ENABLE_TILE_ENTER_EVENT)
#define DYNAMIC_ACTOR_CALLBACK_SIZE 6
#elif defined(DYNAMIC_ACTOR_ENABLE_TILE_COLLISION_EVENTS)
#define DYNAMIC_ACTOR_CALLBACK_SIZE 5
#else
#define DYNAMIC_ACTOR_CALLBACK_SIZE 1
#endif

// The two tile callback groups share one dispatch helper, so it is compiled
// whenever either of them is.
#if defined(DYNAMIC_ACTOR_ENABLE_TILE_COLLISION_EVENTS) || defined(DYNAMIC_ACTOR_ENABLE_TILE_ENTER_EVENT)
#define DYNAMIC_ACTOR_USES_TILE_INTERACTION
#endif

// "Tile enter" granularity, from the engine setting of the same name. The
// actor's tile is worked out in 8x8 tiles either way; a 16x16 grid is that
// shifted down once more rather than a second conversion from sub-pixels. Only
// the change detection is coarsened - the script still receives the real 8x8
// tile the actor arrived on, so Event tile x/y and the tile collision value
// keep meaning what they always did.
#ifndef DYNAMIC_ACTOR_TILE_ENTER_SIZE
#define DYNAMIC_ACTOR_TILE_ENTER_SIZE 0
#endif
#define DYNAMIC_ACTOR_TILE_ENTER_CELL(tile) ((tile) >> DYNAMIC_ACTOR_TILE_ENTER_SIZE)

typedef struct behavior_def_t {
    UBYTE flags;         // BHV_* physics components
    UBYTE flags2;        // BHV2_* secondary behavior/animation + BHV3_* lock flags
    UBYTE collision_type;// DYNAMIC_ACTOR_COLLISION_* collision model
    UBYTE gravity;       // subpixels/frame^2 added to y velocity
    BYTE max_fall_vel;  // max downward velocity in subpixels/frame
    UBYTE bounce;        // energy kept on bounce, 0..255 (255 = perfect reflect)
    UBYTE event_flags;   // BHV_EVENT_* trigger permissions
    UBYTE override_tile_collision; // Replaces every tile collision mask this
                         // behavior tests when non-zero, so a behavior can react
                         // to a fixed set of tile bits regardless of which
                         // direction it is testing (0 = stock collision, mask
                         // tested as normal). Only read when
                         // DYNAMIC_ACTOR_ENABLE_OVERRIDE_TILE_COLLISION is on; the
                         // byte itself stays either way, since it is the padding
                         // that keeps the slot at 8 bytes so behavior_defs
                         // indexing compiles to a shift instead of a multiply.
} behavior_def_t;

extern script_event_t dynamic_actor_events[DYNAMIC_ACTOR_CALLBACK_SIZE];
extern UBYTE dynamic_actor_event_actor_idx;
extern UBYTE dynamic_actor_event_tile_idx;
extern UBYTE dynamic_actor_event_tile_x;
extern UBYTE dynamic_actor_event_tile_y;

extern behavior_def_t behavior_defs[DYNAMIC_ACTOR_MAX_BEHAVIORS + 1];

#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
// Nonzero once anything in the scene can use parenting (a parent was set, or
// a behavior with BHV_PLATFORM was defined). While zero, dynamic_actor_update
// skips the whole end-of-frame claim/snapshot pass.
extern UBYTE dynamic_actor_parenting_used;
// Flips the flag on and refreshes every active actor's prev_pos so the first
// parent delta after enabling doesn't span the whole scene lifetime.
void dynamic_actor_mark_parenting_used(void) BANKED;
#endif

void dynamic_actor_init(void) BANKED;
void dynamic_actor_update(void) BANKED;

#ifdef DYNAMIC_ACTOR_ENABLE_ACTIVATION_EVENTS
// Runs the "Actor activated" / "Actor deactivated" callback scripts. The two
// macros are what the overridden actor.c calls at the end of
// activate_actor_impl() / deactivate_actor_impl(); with the feature disabled
// they expand to nothing and actor.c compiles as if they were not there.
void dynamic_actor_execute_activation(actor_t *actor, UBYTE activated) BANKED;
#define DYNAMIC_ACTOR_ON_ACTIVATE(actor)   dynamic_actor_execute_activation((actor), TRUE)
#define DYNAMIC_ACTOR_ON_DEACTIVATE(actor) dynamic_actor_execute_activation((actor), FALSE)
#else
#define DYNAMIC_ACTOR_ON_ACTIVATE(actor)   ((void)0)
#define DYNAMIC_ACTOR_ON_DEACTIVATE(actor) ((void)0)
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_ITERATION
// args (push order): stateSlot, x, y, width, height, options
void vm_actor_find_in_area(SCRIPT_CTX * THIS) OLDCALL BANKED;
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_PROPERTIES
// args (push order): dest, actorIndex, propertyId
void vm_actor_get_property(SCRIPT_CTX * THIS) OLDCALL BANKED;
// args (push order): actorIndex, propertyId, value
void vm_actor_set_property(SCRIPT_CTX * THIS) OLDCALL BANKED;
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_TRIGGER_SCRIPT
// args (push order): actorIndex, which, collisionGroup
void vm_actor_trigger_script(SCRIPT_CTX * THIS) OLDCALL BANKED;
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_HIT_ACTORS
// On collision, run the collided actor's onHit script - the same script the
// engine fires when the player touches that actor, but driven by this actor.
// Lives in vm_dynamic_actor.c to keep dynamic_actor.c under the 16KB bank limit.
void dynamic_actor_hit_actors(actor_t *actor) BANKED;
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_TRIGGERS
// Per-actor "last trigger index" so an actor can drive trigger onEnter/onLeave
// scripts independently of the engine's single player-only last_trigger. Kept in
// the plugin (not actor_t) so gbs_types.h is untouched. NO_TRIGGER_COLLISON = none.
extern UBYTE actor_last_trigger[MAX_ACTORS];
// Player-style trigger activation for an arbitrary actor. In vm_dynamic_actor.c.
void dynamic_actor_activate_triggers(actor_t *actor) BANKED;
#endif

#endif



