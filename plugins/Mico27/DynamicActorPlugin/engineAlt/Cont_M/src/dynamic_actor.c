#pragma bank 255

#include <string.h>
#include <gbdk/platform.h>
#include "system.h"
#include "vm.h"
#include "gbs_types.h"
#include "math.h"
#include "actor.h"
#include "dynamic_actor.h"
#include "data/states_defines.h"
#include "collision.h"
#include "events.h"
#include "data_manager.h"
#include "macro.h"
#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_TRIGGERS
#include "trigger.h"
#endif

#define DYNAMIC_ACTOR_COLLISION_SINGLE_POINT 0
#define DYNAMIC_ACTOR_COLLISION_TRIANGLE 1
#define DYNAMIC_ACTOR_COLLISION_BOUNDING_BOX 2

#define COLLISION_SLOPE_LEFT          0x10u
#define COLLISION_SLOPE_45            0x20u
#define COLLISION_SLOPE_225_BOT       0x40u
#define COLLISION_SLOPE_225_TOP       (COLLISION_SLOPE_45 | COLLISION_SLOPE_225_BOT)
#define COLLISION_SLOPE_45_RIGHT      COLLISION_SLOPE_45
#define COLLISION_SLOPE_225_RIGHT_BOT COLLISION_SLOPE_225_BOT
#define COLLISION_SLOPE_225_RIGHT_TOP COLLISION_SLOPE_225_TOP
#define COLLISION_SLOPE_45_LEFT       (COLLISION_SLOPE_LEFT | COLLISION_SLOPE_45)
#define COLLISION_SLOPE_225_LEFT_BOT  (COLLISION_SLOPE_LEFT | COLLISION_SLOPE_225_BOT)
#define COLLISION_SLOPE_225_LEFT_TOP  (COLLISION_SLOPE_LEFT | COLLISION_SLOPE_225_TOP)
#define COLLISION_SLOPE_ANY           (COLLISION_SLOPE_45 | COLLISION_SLOPE_225_BOT | COLLISION_SLOPE_225_TOP)
#define COLLISION_SLOPE               0x70u

#define IS_ON_SLOPE(t) ((t) & COLLISION_SLOPE_ANY)
#define IS_SLOPE_LEFT(t) ((t) & COLLISION_SLOPE_LEFT)
#define IS_SLOPE_RIGHT(t) (!((t) & COLLISION_SLOPE_LEFT))

behavior_def_t behavior_defs[DYNAMIC_ACTOR_MAX_BEHAVIORS + 1];

// Engine Fields --------------------------------------------------------------

// Dynamic actor trigger context exposed to scripts as engine fields.
// These are written by the runtime when a callback fires.
UBYTE dynamic_actor_event_actor_idx;
UBYTE dynamic_actor_event_behavior_idx;
UBYTE dynamic_actor_event_state;
UBYTE dynamic_actor_event_tile_idx;
UBYTE dynamic_actor_event_tile_x;
UBYTE dynamic_actor_event_tile_y;

// End of Engine Fields -------------------------------------------------------

script_event_t dynamic_actor_events[DYNAMIC_ACTOR_CALLBACK_SIZE];
static actor_t *dynamic_actor_current_actor;

// override_tile_collision of the behavior driving the actor currently being
// moved, cached here so the collision helpers don't reload it from the
// behavior def at every test site. Kept in step with dynamic_actor_current_actor
// by DYNAMIC_ACTOR_LOAD_TILE_COL_OVERRIDE.
//
// With the feature off, DYNAMIC_ACTOR_TILE_COL passes the mask straight through
// and the load expands to nothing (its argument is never evaluated), so the ~27
// collision test sites below compile exactly as they did before the feature
// existed and the physics loop pays nothing per actor per frame.
#ifdef DYNAMIC_ACTOR_ENABLE_OVERRIDE_TILE_COLLISION
static UBYTE dynamic_actor_override_tile_collision;
#define DYNAMIC_ACTOR_TILE_COL(mask) (dynamic_actor_override_tile_collision ? dynamic_actor_override_tile_collision : (mask))
#define DYNAMIC_ACTOR_LOAD_TILE_COL_OVERRIDE(value) (dynamic_actor_override_tile_collision = (value))
#else
#define DYNAMIC_ACTOR_TILE_COL(mask) (mask)
#define DYNAMIC_ACTOR_LOAD_TILE_COL_OVERRIDE(value) ((void)0)
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
UBYTE dynamic_actor_parenting_used;

// Per-frame cache of BHV_PLATFORM actors: box edges and claim parameters are
// computed once per platform in the main update loop, then the end-of-frame
// walk claims/releases riders against these instead of each platform walking
// the whole actor list itself.
typedef struct platform_cache_t {
    actor_t *actor;
    UWORD left;
    UWORD right;
    UWORD top;
    UWORD bottom;
    UBYTE group;
} platform_cache_t;
static platform_cache_t platform_cache[DYNAMIC_ACTOR_MAX_PLATFORMS];
static UBYTE platform_count;
#endif

#ifdef DYNAMIC_ACTOR_USES_PLAYER_PREV_POS
// Player position at the end of the previous update, so the velocity parenting
// mode can follow the engine-controlled player (which has no velocity field) by
// position delta. Snapshotted once per frame in dynamic_actor_update.
static upoint16_t player_prev_pos;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
static uint16_t player_prev_pos_z;
#endif
#endif

WORD new_actor_x;
WORD new_actor_y;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
WORD new_actor_z;
#endif
UBYTE col_tx;
UBYTE col_ty;

#ifdef DYNAMIC_ACTOR_ENABLE_STATE_CHANGE_EVENT
static void dynamic_actor_execute_state_change(actor_t *actor) {
    script_event_t *event = &dynamic_actor_events[DYNAMIC_ACTOR_EVENT_STATE_CHANGE];
    if (!event->script_addr) {
        return;
    }
    if ((event->handle == 0) || ((event->handle & SCRIPT_TERMINATED) != 0)) {
        dynamic_actor_event_actor_idx = actor->actor_index;
        dynamic_actor_event_behavior_idx = actor->actor_behavior_id;
        dynamic_actor_event_state = actor->actor_state;
        script_execute(event->script_bank, event->script_addr, &event->handle, 0, 0);
    }
}
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_ACTIVATION_EVENTS
void dynamic_actor_execute_activation(actor_t *actor, UBYTE activated) BANKED {
    // load_scene() activates the player before state_init() has run
    // dynamic_actor_init(), so at that point the callback table still holds the
    // previous scene's scripts. The player is activated exactly once per scene
    // load and is never deactivated afterwards, so skipping it both closes that
    // window and costs nothing.
    if (actor == &PLAYER) {
        return;
    }
    script_event_t *event = &dynamic_actor_events[
        (activated) ? DYNAMIC_ACTOR_EVENT_ACTOR_ACTIVATED : DYNAMIC_ACTOR_EVENT_ACTOR_DEACTIVATED];
    if (!event->script_addr) {
        return;
    }
    if ((event->handle == 0) || ((event->handle & SCRIPT_TERMINATED) != 0)) {
        dynamic_actor_event_actor_idx = actor->actor_index;
        dynamic_actor_event_behavior_idx = actor->actor_behavior_id;
        dynamic_actor_event_state = actor->actor_state;
        script_execute(event->script_bank, event->script_addr, &event->handle, 0, 0);
    }
}
#endif

#ifdef DYNAMIC_ACTOR_USES_TILE_INTERACTION
static void dynamic_actor_execute_tile_interaction(actor_t *actor, UBYTE tile_x, UBYTE tile_y, dynamic_actor_event_e event_type) {
    script_event_t *event = &dynamic_actor_events[event_type];    
    if (!event->script_addr) {
        return;
    }
    if ((event->handle == 0) || ((event->handle & SCRIPT_TERMINATED) != 0)) {
        dynamic_actor_event_actor_idx = actor->actor_index;
        dynamic_actor_event_behavior_idx = actor->actor_behavior_id;
        dynamic_actor_event_tile_idx = tile_at(tile_x, tile_y);
        dynamic_actor_event_tile_x = tile_x;
        dynamic_actor_event_tile_y = tile_y;
        script_execute(event->script_bank, event->script_addr, &event->handle, 0, 0);
    }
}
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_TILE_COLLISION_EVENTS
static void dynamic_actor_execute_tile_collision_top(actor_t *actor, UBYTE tile_x, UBYTE tile_y) {
    behavior_def_t *def = &behavior_defs[actor->actor_behavior_id];
    if ((def->event_flags & BHV_EVENT_TILE_COLLISION_TOP) == 0) {
        return;
    }
    dynamic_actor_execute_tile_interaction(actor, tile_x, tile_y, DYNAMIC_ACTOR_EVENT_TILE_COLLISION_TOP);
}

static void dynamic_actor_execute_tile_collision_right(actor_t *actor, UBYTE tile_x, UBYTE tile_y) {
    behavior_def_t *def = &behavior_defs[actor->actor_behavior_id];
    if ((def->event_flags & BHV_EVENT_TILE_COLLISION_RIGHT) == 0) {
        return;
    }
    dynamic_actor_execute_tile_interaction(actor, tile_x, tile_y, DYNAMIC_ACTOR_EVENT_TILE_COLLISION_RIGHT);
}

static void dynamic_actor_execute_tile_collision_bottom(actor_t *actor, UBYTE tile_x, UBYTE tile_y) {
    behavior_def_t *def = &behavior_defs[actor->actor_behavior_id];
    if ((def->event_flags & BHV_EVENT_TILE_COLLISION_BOTTOM) == 0) {
        return;
    }
    dynamic_actor_execute_tile_interaction(actor, tile_x, tile_y, DYNAMIC_ACTOR_EVENT_TILE_COLLISION_BOTTOM);
}

static void dynamic_actor_execute_tile_collision_left(actor_t *actor, UBYTE tile_x, UBYTE tile_y) {
    behavior_def_t *def = &behavior_defs[actor->actor_behavior_id];
    if ((def->event_flags & BHV_EVENT_TILE_COLLISION_LEFT) == 0) {
        return;
    }
    dynamic_actor_execute_tile_interaction(actor, tile_x, tile_y, DYNAMIC_ACTOR_EVENT_TILE_COLLISION_LEFT);
}
#else
// Tile collision events compiled out. The collision helpers below report hits
// from about thirty call sites; expanding the dispatchers to nothing removes
// all of them without an #ifdef at each site.
#define dynamic_actor_execute_tile_collision_top(actor, tile_x, tile_y)    ((void)0)
#define dynamic_actor_execute_tile_collision_right(actor, tile_x, tile_y)  ((void)0)
#define dynamic_actor_execute_tile_collision_bottom(actor, tile_x, tile_y) ((void)0)
#define dynamic_actor_execute_tile_collision_left(actor, tile_x, tile_y)   ((void)0)
#endif

// Tile enter is the same dispatch as a tile collision, only the callback slot
// differs - dynamic_actor_execute_tile_interaction covers it, no second copy of
// the body is needed.
#ifdef DYNAMIC_ACTOR_ENABLE_TILE_ENTER_EVENT
#define dynamic_actor_execute_tile_enter(actor, tile_x, tile_y) \
    dynamic_actor_execute_tile_interaction((actor), (tile_x), (tile_y), DYNAMIC_ACTOR_EVENT_TILE_ENTER)
#else
#define dynamic_actor_execute_tile_enter(actor, tile_x, tile_y)            ((void)0)
#endif

void dynamic_actor_init(void) BANKED {
    memset(behavior_defs, 0, sizeof(behavior_defs));
    memset(dynamic_actor_events, 0, sizeof(dynamic_actor_events));
    dynamic_actor_event_actor_idx = 0;
    dynamic_actor_event_tile_idx = 0;
    dynamic_actor_event_tile_x = 0;
    dynamic_actor_event_tile_y = 0;
#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_TRIGGERS
    memset(actor_last_trigger, NO_TRIGGER_COLLISON, sizeof(actor_last_trigger));
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
    dynamic_actor_parenting_used = FALSE;
    platform_count = 0;
#ifdef DYNAMIC_ACTOR_USES_PLAYER_PREV_POS
    player_prev_pos = PLAYER.pos;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
    player_prev_pos_z = PLAYER.pos_z;
#endif
#endif
#endif
    UBYTE i;
    actor_t * actor = actors;
    for (i = 0; i != actors_len; i++, actor++) {
        actor->actor_index = i;
#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
        actor->actor_parent = NULL;
#ifdef DYNAMIC_ACTOR_USES_PREV_POS
        actor->prev_pos = actor->pos;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
        actor->prev_pos_z = actor->pos_z;
#endif
#endif
#endif
    }
}

#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
void dynamic_actor_mark_parenting_used(void) BANKED {
    if (dynamic_actor_parenting_used) {
        return;
    }
    dynamic_actor_parenting_used = TRUE;
#ifdef DYNAMIC_ACTOR_USES_PLAYER_PREV_POS
    // Refresh the player snapshot too, so a child parented to the player doesn't
    // inherit a delta spanning every frame since scene load.
    player_prev_pos = PLAYER.pos;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
    player_prev_pos_z = PLAYER.pos_z;
#endif
#endif
#ifdef DYNAMIC_ACTOR_USES_PREV_POS
    // Refresh the snapshots: they haven't been maintained while the flag was
    // off, so without this the first parent delta would span every frame
    // since scene load.
    actor_t *actor = actors_active_tail;
    while (actor) {
        actor->prev_pos = actor->pos;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
        actor->prev_pos_z = actor->pos_z;
#endif
        actor = actor->prev;
    }
#endif
}
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_SINGLE_POINT

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Y
static UWORD check_vertical_collision_point(UWORD start_x, UWORD start_y, UBYTE down) {
    col_ty = SUBPX_TO_TILE(start_y);
    col_tx = SUBPX_TO_TILE(start_x);
    if (down) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
        UBYTE tile = tile_at(col_tx, col_ty);
        if (tile & DYNAMIC_ACTOR_TILE_COL(COLLISION_TOP)) {
            start_y = TILE_TO_SUBPX(col_ty) - 1;
            col_ty = SUBPX_TO_TILE(start_y);
            tile = tile_at(col_tx, col_ty);
        }
        if (IS_ON_SLOPE(tile)){
            const UBYTE slope_type = (tile & COLLISION_SLOPE);
            UBYTE x_offset = SUBPX_TILE_REMAINDER(start_x);
            WORD offset = 0;

            switch (slope_type) {
                case COLLISION_SLOPE_45_RIGHT:
                    offset = (PX_TO_SUBPX(8) - x_offset);
                    break;
                case COLLISION_SLOPE_225_RIGHT_BOT:
                    offset = (PX_TO_SUBPX(8) - DIV_2(x_offset));
                    break;
                case COLLISION_SLOPE_225_RIGHT_TOP:
                    offset = (PX_TO_SUBPX(4) - DIV_2(x_offset));
                    break;
                case COLLISION_SLOPE_45_LEFT:
                    offset = x_offset;
                    break;
                case COLLISION_SLOPE_225_LEFT_BOT:
                    offset = DIV_2(x_offset) + PX_TO_SUBPX(4);
                    break;
                case COLLISION_SLOPE_225_LEFT_TOP:
                    offset = DIV_2(x_offset);
                    break;
            }
            UWORD slope_y_coord = TILE_TO_SUBPX(col_ty) + offset - 32;
            if (slope_y_coord < start_y){
                return slope_y_coord;
            }
            return start_y;
        }
        return start_y;
#else
        if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_TOP)) {
            dynamic_actor_execute_tile_collision_bottom(dynamic_actor_current_actor, col_tx, col_ty);
            return TILE_TO_SUBPX(col_ty) - 1;
        }
        return start_y;
#endif
    }
    if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_BOTTOM)) {
        dynamic_actor_execute_tile_collision_top(dynamic_actor_current_actor, col_tx, col_ty);
        return TILE_TO_SUBPX(col_ty + 1);
    }
    return start_y;
}
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_X
static UWORD check_horizontal_collision_point(UWORD start_x, UWORD start_y, UBYTE right) {
    col_ty = SUBPX_TO_TILE(start_y);
    col_tx = SUBPX_TO_TILE(start_x);
    if (right) {

        if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_LEFT)) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
            if (IS_ON_SLOPE(tile_at(col_tx - 1, col_ty))){
                return start_x;
            }
#endif
            dynamic_actor_execute_tile_collision_right(dynamic_actor_current_actor, col_tx, col_ty);
            return TILE_TO_SUBPX(col_tx) - 1;
        }
        return start_x;
    }

    if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_RIGHT)) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
            if (IS_ON_SLOPE(tile_at(col_tx + 1, col_ty))){
                return start_x;
            }
#endif
        dynamic_actor_execute_tile_collision_left(dynamic_actor_current_actor, col_tx, col_ty);
        return TILE_TO_SUBPX(col_tx + 1);
    }
    return start_x;
}
#endif

#if defined(DYNAMIC_ACTOR_ENABLE_MOVE_X) && defined(DYNAMIC_ACTOR_ENABLE_LEDGE_STOP)
static UWORD check_pit_point(UWORD start_x, UWORD start_y, UBYTE right) {
    col_ty = SUBPX_TO_TILE(start_y);
    col_tx = SUBPX_TO_TILE(start_x);
    if (right) {
        if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_LEFT)) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
            if (IS_ON_SLOPE(tile_at(col_tx - 1, col_ty))){
                return start_x;
            }
#endif
            dynamic_actor_execute_tile_collision_right(dynamic_actor_current_actor, col_tx, col_ty);
            return TILE_TO_SUBPX(col_tx) - 1;
        }
        if (!(tile_at(col_tx, col_ty + 1) & DYNAMIC_ACTOR_TILE_COL(COLLISION_TOP | COLLISION_SLOPE_ANY))) {
            return TILE_TO_SUBPX(col_tx) - 1;
        }
        return start_x;
    }
    if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_RIGHT)) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
            if (IS_ON_SLOPE(tile_at(col_tx + 1, col_ty))){
                return start_x;
            }
#endif
        dynamic_actor_execute_tile_collision_left(dynamic_actor_current_actor, col_tx, col_ty);
        return TILE_TO_SUBPX(col_tx + 1);
    }
    if (!(tile_at(col_tx, col_ty + 1) & DYNAMIC_ACTOR_TILE_COL(COLLISION_TOP | COLLISION_SLOPE_ANY))) {
        return TILE_TO_SUBPX(col_tx + 1);
    }
    return start_x;
}
#endif

#endif

#if defined(DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION) && defined(DYNAMIC_ACTOR_ENABLE_MOVE_Y) && (defined(DYNAMIC_ACTOR_ENABLE_COLLISION_TRIANGLE) || defined(DYNAMIC_ACTOR_ENABLE_COLLISION_BOUNDING_BOX))
static UBYTE on_slope;
static UWORD check_collision_slope(UWORD start_x, UWORD start_y, rect16_t *bounds){
    col_ty = SUBPX_TO_TILE(start_y + bounds->bottom);
    col_tx = SUBPX_TO_TILE(start_x);
    UBYTE tile = tile_at(col_tx, col_ty);
    if (tile & DYNAMIC_ACTOR_TILE_COL(COLLISION_TOP)) {
        start_y = (TILE_TO_SUBPX(col_ty) - (bounds->bottom + 1));
        col_ty = SUBPX_TO_TILE(start_y + (bounds->bottom - 1));
        tile = tile_at(col_tx, col_ty);

    }
    on_slope = IS_ON_SLOPE(tile);
    if (on_slope){
        const UBYTE slope_type = (tile & COLLISION_SLOPE);
        UBYTE x_offset = SUBPX_TILE_REMAINDER(start_x);
        WORD offset = 0;
        switch (slope_type) {
            case COLLISION_SLOPE_45_RIGHT:
                offset = (PX_TO_SUBPX(8) - x_offset) - bounds->bottom;
                break;
            case COLLISION_SLOPE_225_RIGHT_BOT:
                offset = (PX_TO_SUBPX(8) - DIV_2(x_offset)) - bounds->bottom;
                break;
            case COLLISION_SLOPE_225_RIGHT_TOP:
                offset = (PX_TO_SUBPX(4) - DIV_2(x_offset)) - bounds->bottom;
                break;
            case COLLISION_SLOPE_45_LEFT:
                offset = x_offset - bounds->bottom;
                break;
            case COLLISION_SLOPE_225_LEFT_BOT:
                offset = DIV_2(x_offset) - bounds->bottom + PX_TO_SUBPX(4);
                break;
            case COLLISION_SLOPE_225_LEFT_TOP:
                offset = DIV_2(x_offset) - bounds->bottom;
                break;
        }
        UWORD slope_y_coord = TILE_TO_SUBPX(col_ty) + offset - 32;
        if (slope_y_coord < start_y){
            return slope_y_coord;
        }
    }
    return start_y;
}

#endif


#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_TRIANGLE

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Y
static UWORD check_vertical_collision_triangle(UWORD start_x, UWORD start_y, rect16_t *bounds, UBYTE down) {
    if (down) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
        UWORD middle_pos = start_x + bounds->left + ((bounds->right - bounds->left) >> 1);
        UWORD slope_y = check_collision_slope(middle_pos, start_y, bounds);
        if (slope_y != start_y) {
            dynamic_actor_execute_tile_collision_bottom(dynamic_actor_current_actor, col_tx, col_ty);
        }
        return slope_y;
#else
        col_ty = SUBPX_TO_TILE(start_y + bounds->bottom);
        col_tx = SUBPX_TO_TILE(start_x + bounds->left);
        if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_TOP)) {
            dynamic_actor_execute_tile_collision_bottom(dynamic_actor_current_actor, col_tx, col_ty);
            return TILE_TO_SUBPX(col_ty) - (bounds->bottom + 1);
        }
        col_tx = SUBPX_TO_TILE(start_x + bounds->right);
        if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_TOP)) {
            dynamic_actor_execute_tile_collision_bottom(dynamic_actor_current_actor, col_tx, col_ty);
            return TILE_TO_SUBPX(col_ty) - (bounds->bottom + 1);
        }
        return start_y;
#endif
    }
    col_ty = SUBPX_TO_TILE(start_y + bounds->top);
    col_tx = SUBPX_TO_TILE(start_x + bounds->left + ((bounds->right - bounds->left) >> 1));
    if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_BOTTOM)) {
        dynamic_actor_execute_tile_collision_top(dynamic_actor_current_actor, col_tx, col_ty);
        return TILE_TO_SUBPX(col_ty + 1) - bounds->top;
    }
    return start_y;
}
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_X
static UWORD check_horizontal_collision_triangle(UWORD start_x, UWORD start_y, rect16_t *bounds, UBYTE right) {
    if (right) {
        col_tx = SUBPX_TO_TILE(start_x + bounds->right);
        col_ty = SUBPX_TO_TILE(start_y + bounds->bottom);
        if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_LEFT)) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
            if (IS_ON_SLOPE(tile_at(col_tx - 1, col_ty))){
                return start_x;
            }
#endif
            dynamic_actor_execute_tile_collision_right(dynamic_actor_current_actor, col_tx, col_ty);
            return TILE_TO_SUBPX(col_tx) - (bounds->right + 1);
        }
        return start_x;
    }
    col_tx = SUBPX_TO_TILE(start_x + bounds->left);
    col_ty = SUBPX_TO_TILE(start_y + bounds->bottom);
    if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_RIGHT)) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
            if (IS_ON_SLOPE(tile_at(col_tx + 1, col_ty))){
                return start_x;
            }
#endif
        dynamic_actor_execute_tile_collision_left(dynamic_actor_current_actor, col_tx, col_ty);
        return TILE_TO_SUBPX(col_tx + 1) - bounds->left;
    }
    return start_x;
}
#endif

#if defined(DYNAMIC_ACTOR_ENABLE_MOVE_X) && defined(DYNAMIC_ACTOR_ENABLE_LEDGE_STOP)
static UWORD check_pit_triangle(UWORD start_x, UWORD start_y, rect16_t *bounds, UBYTE right) {
    if (right) {
        col_tx = SUBPX_TO_TILE(start_x + bounds->right);
        col_ty = SUBPX_TO_TILE(start_y + bounds->bottom);
        if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_LEFT)) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
            if (IS_ON_SLOPE(tile_at(col_tx - 1, col_ty))){
                return start_x;
            }
#endif
            dynamic_actor_execute_tile_collision_right(dynamic_actor_current_actor, col_tx, col_ty);
            return TILE_TO_SUBPX(col_tx) - (bounds->right + 1);
        }
        if (!(tile_at(col_tx, col_ty + 1) & DYNAMIC_ACTOR_TILE_COL(COLLISION_TOP | COLLISION_SLOPE_ANY))) {
            dynamic_actor_execute_tile_collision_bottom(dynamic_actor_current_actor, col_tx, col_ty + 1);
            return TILE_TO_SUBPX(col_tx) - (bounds->right + 1);
        }
        return start_x;
    }
    col_tx = SUBPX_TO_TILE(start_x + bounds->left);
    col_ty = SUBPX_TO_TILE(start_y + bounds->bottom);
    if (tile_at(col_tx, col_ty) & DYNAMIC_ACTOR_TILE_COL(COLLISION_RIGHT)) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
            if (IS_ON_SLOPE(tile_at(col_tx + 1, col_ty))){
                return start_x;
            }
#endif
        dynamic_actor_execute_tile_collision_left(dynamic_actor_current_actor, col_tx, col_ty);
        return TILE_TO_SUBPX(col_tx + 1) - bounds->left;
    }
    if (!(tile_at(col_tx, col_ty + 1) & DYNAMIC_ACTOR_TILE_COL(COLLISION_TOP | COLLISION_SLOPE_ANY))) {
        dynamic_actor_execute_tile_collision_bottom(dynamic_actor_current_actor, col_tx, col_ty + 1);
        return TILE_TO_SUBPX(col_tx + 1)  - bounds->left;
    }
    return start_x;
}
#endif

#endif

#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_BOUNDING_BOX

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Y
static UWORD check_vertical_collision_bbox(UWORD start_x, UWORD start_y, rect16_t *bounds, UBYTE down) {
    UBYTE tile_x_start = SUBPX_TO_TILE(start_x + bounds->left);
    UBYTE tile_x_end = SUBPX_TO_TILE(start_x + bounds->right);
    if (down) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
        UWORD middle_pos = start_x + bounds->left + ((bounds->right - bounds->left) >> 1);
        start_y = check_collision_slope(middle_pos, start_y, bounds);
        if (on_slope){
            return start_y;
        }
#endif
        col_ty = SUBPX_TO_TILE(start_y + bounds->bottom);
        if (tile_col_test_range_x(DYNAMIC_ACTOR_TILE_COL(COLLISION_TOP), col_ty, tile_x_start, tile_x_end)){
            dynamic_actor_execute_tile_collision_top(dynamic_actor_current_actor, tile_x_start, col_ty);
            return TILE_TO_SUBPX(col_ty) - (bounds->bottom + 1);
        }
        return start_y;
    }
    col_ty = SUBPX_TO_TILE(start_y + bounds->top);
    if (tile_col_test_range_x(DYNAMIC_ACTOR_TILE_COL(COLLISION_BOTTOM), col_ty, tile_x_start, tile_x_end)){
        dynamic_actor_execute_tile_collision_bottom(dynamic_actor_current_actor, tile_x_start, col_ty);
        return TILE_TO_SUBPX(col_ty + 1) - bounds->top;
    }
    return start_y;
}
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_X
static UWORD check_horizontal_collision_bbox(UWORD start_x, UWORD start_y, rect16_t *bounds, UBYTE right) {
    UBYTE tile_y_start = SUBPX_TO_TILE(start_y + bounds->bottom);
    UBYTE tile_y_end = SUBPX_TO_TILE(start_y + bounds->top);
    if (right) {
        col_tx = SUBPX_TO_TILE(start_x + bounds->right);
        if (tile_col_test_range_y(DYNAMIC_ACTOR_TILE_COL(COLLISION_LEFT), col_tx, tile_y_start, tile_y_end)) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
            if (IS_ON_SLOPE(tile_at(col_tx - 1, tile_y_start))){
                return start_x;
            }
#endif
            dynamic_actor_execute_tile_collision_right(dynamic_actor_current_actor, col_tx, tile_y_start);
            return TILE_TO_SUBPX(col_tx) - (bounds->right + 1);
        }
        return start_x;
    }
    col_tx = SUBPX_TO_TILE(start_x + bounds->left);
    if (tile_col_test_range_y(DYNAMIC_ACTOR_TILE_COL(COLLISION_RIGHT), col_tx, tile_y_start, tile_y_end)) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
            if (IS_ON_SLOPE(tile_at(col_tx + 1, tile_y_start))){
                return start_x;
            }
#endif
        dynamic_actor_execute_tile_collision_left(dynamic_actor_current_actor, col_tx, tile_y_start);
        return TILE_TO_SUBPX(col_tx + 1) - bounds->left;
    }
    return start_x;
}
#endif

#if defined(DYNAMIC_ACTOR_ENABLE_MOVE_X) && defined(DYNAMIC_ACTOR_ENABLE_LEDGE_STOP)
static UWORD check_pit_bbox(UWORD start_x, UWORD start_y, rect16_t *bounds, UBYTE right) {
    UBYTE tile_y_start = SUBPX_TO_TILE(start_y + bounds->bottom);
    UBYTE tile_y_end = SUBPX_TO_TILE(start_y + bounds->top);
    if (right) {
        col_tx = SUBPX_TO_TILE(start_x + bounds->right);
        if (tile_col_test_range_y(DYNAMIC_ACTOR_TILE_COL(COLLISION_LEFT), col_tx, tile_y_start, tile_y_end)) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
            if (IS_ON_SLOPE(tile_at(col_tx - 1, tile_y_start))){
                return start_x;
            }
#endif
            dynamic_actor_execute_tile_collision_right(dynamic_actor_current_actor, col_tx, tile_y_start);
            return TILE_TO_SUBPX(col_tx) - (bounds->right + 1);
        }
        if (!(tile_at(col_tx, tile_y_start + 1) & DYNAMIC_ACTOR_TILE_COL(COLLISION_TOP | COLLISION_SLOPE_ANY))) {
            dynamic_actor_execute_tile_collision_bottom(dynamic_actor_current_actor, col_tx, tile_y_start + 1);
            return TILE_TO_SUBPX(col_tx) - (bounds->right + 1);
        }
        return start_x;
    }
    col_tx = SUBPX_TO_TILE(start_x + bounds->left);
    if (tile_col_test_range_y(DYNAMIC_ACTOR_TILE_COL(COLLISION_RIGHT), col_tx, tile_y_start, tile_y_end)) {
#ifdef DYNAMIC_ACTOR_ENABLE_SLOPE_COLLISION
            if (IS_ON_SLOPE(tile_at(col_tx + 1, tile_y_start))){
                return start_x;
            }
#endif
        dynamic_actor_execute_tile_collision_left(dynamic_actor_current_actor, col_tx, tile_y_start);
        return TILE_TO_SUBPX(col_tx + 1) - bounds->left;
    }
    if (!(tile_at(col_tx, tile_y_start + 1) & DYNAMIC_ACTOR_TILE_COL(COLLISION_TOP | COLLISION_SLOPE_ANY))) {
        dynamic_actor_execute_tile_collision_bottom(dynamic_actor_current_actor, col_tx, tile_y_start + 1);
        return TILE_TO_SUBPX(col_tx + 1)  - bounds->left;
    }
    return start_x;
}
#endif

#endif

#define ACTOR_COLLISION_TYPE(actor) (behavior_defs[(actor)->actor_behavior_id].collision_type)
#define ACTOR_OVERRIDE_TILE_COLLISION(actor) (behavior_defs[(actor)->actor_behavior_id].override_tile_collision)

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_X
static UWORD check_horizontal_collision_by_type(UWORD start_x, UWORD start_y, actor_t *actor, UBYTE right, UBYTE collision_type) {
    (void)actor;
    switch (collision_type) {
#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_TRIANGLE
        case DYNAMIC_ACTOR_COLLISION_TRIANGLE:
            return check_horizontal_collision_triangle(start_x, start_y, &actor->bounds, right);
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_BOUNDING_BOX
        case DYNAMIC_ACTOR_COLLISION_BOUNDING_BOX:
            return check_horizontal_collision_bbox(start_x, start_y, &actor->bounds, right);
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_SINGLE_POINT
        case DYNAMIC_ACTOR_COLLISION_SINGLE_POINT:
            return check_horizontal_collision_point(start_x, start_y, right);
#endif
    }
    return start_x;
}
#else
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Y
static UWORD check_vertical_collision_by_type(UWORD start_x, UWORD start_y, actor_t *actor, UBYTE down, UBYTE collision_type) {
    (void)actor;
    switch (collision_type) {
#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_TRIANGLE
        case DYNAMIC_ACTOR_COLLISION_TRIANGLE:
            return check_vertical_collision_triangle(start_x, start_y, &actor->bounds, down);
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_BOUNDING_BOX
        case DYNAMIC_ACTOR_COLLISION_BOUNDING_BOX:
            return check_vertical_collision_bbox(start_x, start_y, &actor->bounds, down);
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_SINGLE_POINT
        case DYNAMIC_ACTOR_COLLISION_SINGLE_POINT:
            return check_vertical_collision_point(start_x, start_y, down);
#endif
    }
    return start_y;
}
#endif

#if defined(DYNAMIC_ACTOR_ENABLE_MOVE_X) && defined(DYNAMIC_ACTOR_ENABLE_LEDGE_STOP)
static UWORD check_pit_by_type(UWORD start_x, UWORD start_y, actor_t *actor, UBYTE right, UBYTE collision_type) {
    (void)actor;
    switch (collision_type) {
#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_TRIANGLE
        case DYNAMIC_ACTOR_COLLISION_TRIANGLE:
            return check_pit_triangle(start_x, start_y, &actor->bounds, right);
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_BOUNDING_BOX
        case DYNAMIC_ACTOR_COLLISION_BOUNDING_BOX:
            return check_pit_bbox(start_x, start_y, &actor->bounds, right);
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_SINGLE_POINT
        case DYNAMIC_ACTOR_COLLISION_SINGLE_POINT:
            return check_pit_point(start_x, start_y, right);
#endif
    }
    return start_x;
}
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
// Claim/release intersection test between a cached platform box and a candidate
// rider: a plain bounding-box overlap (they touch). This is deliberately
// independent of either actor's tile-collision model - a moving platform parents
// whatever its box overlaps, so single-point / triangle platforms still pick up
// riders standing on them (their origin/point need not be inside the box).
static UBYTE platform_cache_test(platform_cache_t *p, actor_t *other) {
    return ((other->pos.x + other->bounds.left) <= p->right) &&
           ((other->pos.x + other->bounds.right) >= p->left) &&
           ((other->pos.y + other->bounds.top) <= p->bottom) &&
           ((other->pos.y + other->bounds.bottom) >= p->top);
}
#endif

#if defined(DYNAMIC_ACTOR_ENABLE_PARENT) && (DYNAMIC_ACTOR_PARENT_MODE == DYNAMIC_ACTOR_PARENT_MODE_DELTA)
// Apply the summed position delta of an actor's whole parent chain since last
// frame (tile-collision checked). Called from the end-of-frame pass, after every
// actor has its final position but before any prev_pos is snapshotted - so every
// parent still holds last frame's snapshot and the delta is identical regardless
// of the order the actor and its parents happened to be processed in. (Doing this
// in the main loop instead reads a 0 delta whenever the parent is processed after
// the rider, which left riders stuck.)
static void dynamic_actor_apply_parent_delta(actor_t *actor) {
    behavior_def_t *def = &behavior_defs[actor->actor_behavior_id];
    UBYTE flags = def->flags;
    UBYTE flags2 = def->flags2;
    UBYTE collision_type = def->collision_type;
    WORD parent_actor_delta_x = 0;
    WORD parent_actor_delta_y = 0;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
    WORD parent_actor_delta_z = 0;
#endif
    actor_t *chain_actor = actor->actor_parent;
    UBYTE chain_guard = MAX_ACTORS;
    while (chain_actor && chain_guard) {
        parent_actor_delta_x += (WORD)(chain_actor->pos.x - chain_actor->prev_pos.x);
        parent_actor_delta_y += (WORD)(chain_actor->pos.y - chain_actor->prev_pos.y);
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
        parent_actor_delta_z += (WORD)(chain_actor->pos_z - chain_actor->prev_pos_z);
#endif
        chain_actor = chain_actor->actor_parent;
        chain_guard--;
    }
    // Set the current actor so the collision helpers fire this rider's tile
    // collision events (they read dynamic_actor_current_actor) and test tiles
    // with this behavior's tile collision override.
    dynamic_actor_current_actor = actor;
    DYNAMIC_ACTOR_LOAD_TILE_COL_OVERRIDE(def->override_tile_collision);
    if (parent_actor_delta_x && !(flags2 & BHV3_LOCK_POS_X)) {
        new_actor_x = actor->pos.x + parent_actor_delta_x;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_X
        if (CHK_FLAG(flags, BHV2_NO_TILE_COLLISION)) {
            actor->pos.x = new_actor_x;
        } else {
            actor->pos.x = check_horizontal_collision_by_type(new_actor_x, actor->pos.y, actor, (parent_actor_delta_x > 0), collision_type);
        }
#else
        actor->pos.x = new_actor_x;
#endif
    }
    if (parent_actor_delta_y && !(flags2 & BHV3_LOCK_POS_Y)) {
        new_actor_y = actor->pos.y + parent_actor_delta_y;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Y
        if (CHK_FLAG(flags, BHV2_NO_TILE_COLLISION)) {
            actor->pos.y = new_actor_y;
        } else {
            actor->pos.y = check_vertical_collision_by_type(actor->pos.x, new_actor_y, actor, (parent_actor_delta_y > 0), collision_type);
        }
#else
        actor->pos.y = new_actor_y;
#endif
    }
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
    if (parent_actor_delta_z && !(flags2 & BHV3_LOCK_POS_Z)) {
        new_actor_z = (WORD)actor->pos_z + parent_actor_delta_z;
        if (new_actor_z < 0) {
            actor->pos_z = 0;
        } else {
            actor->pos_z = (UWORD)new_actor_z;
        }
    }
#endif
}
#endif

void dynamic_actor_update(void) BANKED {
    dynamic_actor_event_actor_idx = 0;
    dynamic_actor_event_tile_idx = 0;
    dynamic_actor_event_tile_x = 0;
    dynamic_actor_event_tile_y = 0;
    actor_t *actor = actors_active_tail;
#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
    platform_count = 0;
#endif
    while (actor) {
        UBYTE behavior_id = actor->actor_behavior_id;
        // Cheap early-out before loading anything else: plain actors (no
        // behavior, no parent) pay only these tests per frame.
#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
        if ((actor->actor_parent == NULL) &&
            ((behavior_id == 0) || (actor->actor_state == BHV_STATE_PAUSED))) {
#else
        if ((behavior_id == 0) || (actor->actor_state == BHV_STATE_PAUSED)) {
#endif
            actor = actor->prev;
            continue;
        }
        behavior_def_t *def = &behavior_defs[behavior_id];
        UBYTE collision_type = def->collision_type;
        UBYTE flags = def->flags;
        UBYTE flags2 = def->flags2;
        UBYTE event_flags = def->event_flags;
        dynamic_actor_current_actor = actor;
        DYNAMIC_ACTOR_LOAD_TILE_COL_OVERRIDE(def->override_tile_collision);
#ifdef DYNAMIC_ACTOR_ENABLE_TILE_ENTER_EVENT
        // Which cell of the tile enter grid the actor started this frame in.
        // Only tracked when something is listening for it.
        UBYTE start_cell_x = 0;
        UBYTE start_cell_y = 0;
        if (CHK_FLAG(event_flags, BHV_EVENT_TILE_ENTER)) {
            start_cell_x = DYNAMIC_ACTOR_TILE_ENTER_CELL(SUBPX_TO_TILE(actor->pos.x));
            start_cell_y = DYNAMIC_ACTOR_TILE_ENTER_CELL(SUBPX_TO_TILE(actor->pos.y));
        }
#endif

#if defined(DYNAMIC_ACTOR_ENABLE_PARENT) && (DYNAMIC_ACTOR_PARENT_MODE != DYNAMIC_ACTOR_PARENT_MODE_DELTA)
        // Parenting is not a behavior: every actor with a defined parent
        // inherits the parent actor's per-frame movement (tile-collision
        // checked, like riding a moving platform), then still runs its own
        // behavior physics below if it has any. Runs even for actors with no
        // behavior assigned (slot 0 is zeroed, so tile collision stays on) or
        // a paused one. Set the parent explicitly with the Set Actor Parent
        // Actor events, or automatically via a BHV_PLATFORM actor.
        // NOTE: the "apply all parents positions delta" mode does NOT carry here.
        // It carries at the END of the frame (dynamic_actor_apply_parent_delta),
        // after every actor has its final position, so a rider inherits the same
        // delta no matter what order it and its parent were processed in - doing
        // it here would read a 0 delta whenever the parent hadn't moved yet.
        if (actor->actor_parent) {
            actor_t *parent_actor = actor->actor_parent;

#if DYNAMIC_ACTOR_PARENT_MODE == DYNAMIC_ACTOR_PARENT_MODE_STATIC
            // Static parenting (Fast): the actor is rigidly pinned at a fixed
            // pixel offset (its own velocity, read as a pixel offset) from the
            // parent position. It runs no other behavior code - the parent
            // position plus offset is its whole update.
            if (!(flags2 & BHV3_LOCK_POS_X)) {
                actor->pos.x = parent_actor->pos.x + PX_TO_SUBPX(actor->actor_vel_x);
            }
            if (!(flags2 & BHV3_LOCK_POS_Y)) {
                actor->pos.y = parent_actor->pos.y + PX_TO_SUBPX(actor->actor_vel_y);
            }
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
            if (!(flags2 & BHV3_LOCK_POS_Z)) {
                actor->pos_z = parent_actor->pos_z + PX_TO_SUBPX(actor->actor_vel_z);
            }
#endif
            actor = actor->prev;
            continue;
#else
            // Inherit first parent velocity (Slower): the actor is carried by
            // its direct parent's current velocity (tile-collision checked),
            // then runs its own behavior. The player has no velocity field
            // (engine-moved), so track it by its position delta instead.
            WORD parent_actor_delta_x;
            WORD parent_actor_delta_y;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
            WORD parent_actor_delta_z;
#endif
            if (parent_actor == &PLAYER) {
                parent_actor_delta_x = (WORD)(PLAYER.pos.x - player_prev_pos.x);
                parent_actor_delta_y = (WORD)(PLAYER.pos.y - player_prev_pos.y);
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
                parent_actor_delta_z = (WORD)(PLAYER.pos_z - player_prev_pos_z);
#endif
            } else {
                parent_actor_delta_x = (WORD)parent_actor->actor_vel_x;
                parent_actor_delta_y = (WORD)parent_actor->actor_vel_y;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
                parent_actor_delta_z = (WORD)parent_actor->actor_vel_z;
#endif
            }
            if (parent_actor_delta_x && !(flags2 & BHV3_LOCK_POS_X)) {
                new_actor_x = actor->pos.x + parent_actor_delta_x;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_X
                if (CHK_FLAG(flags, BHV2_NO_TILE_COLLISION)) {
                    actor->pos.x = new_actor_x;
                } else {
                    actor->pos.x = check_horizontal_collision_by_type(new_actor_x, actor->pos.y, actor, (parent_actor_delta_x > 0), collision_type);
                }
#else
                actor->pos.x = new_actor_x;
#endif
            }
            if (parent_actor_delta_y && !(flags2 & BHV3_LOCK_POS_Y)) {
                new_actor_y = actor->pos.y + parent_actor_delta_y;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Y
                if (CHK_FLAG(flags, BHV2_NO_TILE_COLLISION)) {
                    actor->pos.y = new_actor_y;
                } else {
                    actor->pos.y = check_vertical_collision_by_type(actor->pos.x, new_actor_y, actor, (parent_actor_delta_y > 0), collision_type);
                }
#else
                actor->pos.y = new_actor_y;
#endif
            }
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
            if (parent_actor_delta_z && !(flags2 & BHV3_LOCK_POS_Z)) {
                new_actor_z = (WORD)actor->pos_z + parent_actor_delta_z;
                if (new_actor_z < 0) {
                    actor->pos_z = 0;
                } else {
                    actor->pos_z = (UWORD)new_actor_z;
                }
            }
#endif
#endif /* DYNAMIC_ACTOR_PARENT_MODE != STATIC */
        }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
        // Parent-only actors are done after inheriting the parent movement.
        if ((behavior_id == 0) || (actor->actor_state == BHV_STATE_PAUSED)) {
            actor = actor->prev;
            continue;
        }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_STATE_CHANGE_EVENT
        UBYTE old_state = actor->actor_state;
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_COLLISION
        // Position before this frame's own movement (after any parent carry),
        // restored when the movement runs the actor into another actor.
        UWORD prev_x = actor->pos.x;
        UWORD prev_y = actor->pos.y;
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_GRAVITY
        if (CHK_FLAG(flags, (BHV_GRAVITY_Y | BHV_GRAVITY_Z))) {
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Y
            if (CHK_FLAG(flags, BHV_GRAVITY_Y) && !CHK_FLAG(flags2, BHV3_LOCK_POS_Y)) {
                actor->actor_vel_y += def->gravity;
                if (actor->actor_vel_y > def->max_fall_vel) {
                    actor->actor_vel_y = def->max_fall_vel;
                }
            }
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
            if (CHK_FLAG(flags, BHV_GRAVITY_Z) && !CHK_FLAG(flags2, BHV3_LOCK_POS_Z)) {
                actor->actor_vel_z += def->gravity;
                if (actor->actor_vel_z > def->max_fall_vel) {
                    actor->actor_vel_z = def->max_fall_vel;
                }
            }
#endif
        }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
        if (!CHK_FLAG(flags2, BHV3_LOCK_POS_Z)) {
            new_actor_z = (WORD)actor->pos_z - actor->actor_vel_z;
            if (new_actor_z > 0) {
                actor->pos_z = new_actor_z;
            } else {
                actor->pos_z = 0;
#ifdef DYNAMIC_ACTOR_ENABLE_BOUNCE
                if (flags & BHV_REFLECT_Z) {
                    if (def->bounce == 128) {
                        actor->actor_vel_z = -actor->actor_vel_z;
                    } else {
                        actor->actor_vel_z = -(WORD)(((int16_t)actor->actor_vel_z * def->bounce) >> 7);
                    }
                    if (-actor->actor_vel_z <= def->gravity) {
                        actor->actor_vel_z = 0;
                    }
                } else {
                    actor->actor_vel_z = 0;
                }
#else
                actor->actor_vel_z = 0;
#endif
            }
        }
        if (actor->pos_z != 0) {
            actor->actor_state = BHV_STATE_AIRBORNE_Z;
        } else {
            actor->actor_state = BHV_STATE_GROUNDED;            
        }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_X
    if (!CHK_FLAG(flags2, BHV3_LOCK_POS_X)) {
            new_actor_x = actor->pos.x + actor->actor_vel_x;
            if (CHK_FLAG(flags, BHV2_NO_TILE_COLLISION)) {
                // Tile collision disabled: apply velocity directly
                actor->pos.x = new_actor_x;
            } else {
                UBYTE moving_right = (actor->pos.x < (UWORD)new_actor_x);
#ifdef DYNAMIC_ACTOR_ENABLE_LEDGE_STOP
                if (CHK_FLAG(flags, BHV_LEDGE_STOP) && (actor->actor_state == BHV_STATE_GROUNDED)) {
                    actor->pos.x = check_pit_by_type(new_actor_x, actor->pos.y, actor, moving_right, collision_type);
                } else {
                    actor->pos.x = check_horizontal_collision_by_type(new_actor_x, actor->pos.y, actor, moving_right, collision_type);
                }
#else
                actor->pos.x = check_horizontal_collision_by_type(new_actor_x, actor->pos.y, actor, moving_right, collision_type);
#endif
                if (actor->pos.x != (UWORD)new_actor_x) {
#ifdef DYNAMIC_ACTOR_ENABLE_REFLECT_X
                    if (CHK_FLAG(flags, BHV_REFLECT_X)) {
                        actor->actor_vel_x = -actor->actor_vel_x;
                    } else {
                        actor->actor_vel_x = 0;
                    }
#else
                    actor->actor_vel_x = 0;
#endif
                }
            }
        }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Y
    if (!CHK_FLAG(flags2, BHV3_LOCK_POS_Y)) {
            new_actor_y = actor->pos.y + actor->actor_vel_y;
            if (CHK_FLAG(flags, BHV2_NO_TILE_COLLISION)) {
                // Tile collision disabled: apply velocity directly, never land
                actor->pos.y = new_actor_y;
#ifdef DYNAMIC_ACTOR_ENABLE_GRAVITY
                if (CHK_FLAG(flags, BHV_GRAVITY_Y)) {
                    if (actor->actor_state != BHV_STATE_AIRBORNE_Z) {
                        actor->actor_state = BHV_STATE_AIRBORNE_Y;
                    }
                }
#endif
            } else {
            UBYTE moving_down = (actor->pos.y <= (UWORD)new_actor_y);
            actor->pos.y = check_vertical_collision_by_type(actor->pos.x, new_actor_y, actor, moving_down, collision_type);
            if (actor->pos.y != (UWORD)new_actor_y) {
                // Hit floor (moving down) or ceiling (moving up)
#ifdef DYNAMIC_ACTOR_ENABLE_BOUNCE
                if (CHK_FLAG(flags, BHV_REFLECT_Y)) {
                    if (def->bounce == 128) {
                        actor->actor_vel_y = -actor->actor_vel_y;
                    } else {
                        actor->actor_vel_y = -(WORD)(((int16_t)actor->actor_vel_y * def->bounce) >> 7);
                    }
                    // Kill micro-bounces caused by gravity pumping while resting
                    if (moving_down && (-actor->actor_vel_y <= def->gravity)) {
                        actor->actor_vel_y = 0;
                    }
                } else {
                    actor->actor_vel_y = 0;
                }
#else
                actor->actor_vel_y = 0;
#endif
                if (moving_down && (actor->actor_vel_y == 0)) {
#ifdef DYNAMIC_ACTOR_ENABLE_GRAVITY
                    if (CHK_FLAG(flags, BHV_GRAVITY_Y)){
                        //apply force to stick on ground to prevent bliping between grounded and airborne states on slopes
                        actor->actor_vel_y = 64;
                    }
#endif
                    if (actor->actor_state != BHV_STATE_AIRBORNE_Z) {
                        actor->actor_state = BHV_STATE_GROUNDED;
                    }
                }
            }
#ifdef DYNAMIC_ACTOR_ENABLE_GRAVITY
            else if (CHK_FLAG(flags, BHV_GRAVITY_Y)) {
                if (actor->actor_state != BHV_STATE_AIRBORNE_Z) {
                    actor->actor_state = BHV_STATE_AIRBORNE_Y;
                }
            }
#endif
            }
        }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_COLLISION
        // Actor-vs-actor collision (the engine already handles the player):
        // if this frame's movement ran into another collidable actor, restore
        // the pre-move position and turn/bounce per the reflect settings.
        if (CHK_FLAG(flags2, BHV2_ACTOR_COLLISION)) {
            actor_t *other = actors_active_tail;
            while (other) {
                if ((other != actor) && (other != &PLAYER) &&
                    (other->flags & ACTOR_FLAG_COLLISION) &&
                    bb_intersects(&actor->bounds, &actor->pos, &other->bounds, &other->pos)) {
                    actor->pos.x = prev_x;
                    actor->pos.y = prev_y;
#ifdef DYNAMIC_ACTOR_ENABLE_REFLECT_X
                    if (CHK_FLAG(flags, BHV_REFLECT_X)) {
                        actor->actor_vel_x = -actor->actor_vel_x;
                    } else {
                        actor->actor_vel_x = 0;
                    }
#else
                    actor->actor_vel_x = 0;
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_BOUNCE
                    if (CHK_FLAG(flags, BHV_REFLECT_Y)) {
                        actor->actor_vel_y = -actor->actor_vel_y;
                    } else
#endif
                    {
#ifdef DYNAMIC_ACTOR_ENABLE_GRAVITY
                        // Leave vertical velocity to gravity for side-view actors
                        if (!CHK_FLAG(flags, BHV_GRAVITY_Y))
#endif
                        {
                            actor->actor_vel_y = 0;
                        }
                    }
                    break;
                }
                other = other->prev;
            }
        }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_HIT_ACTORS
        // On collision, run the collided actor's onHit script (in vm_dynamic_actor.c
        // to keep this bank under the 16KB limit).
        if (CHK_FLAG(event_flags, BHV_EVENT_HIT_ACTORS)) {
            dynamic_actor_hit_actors(actor);
        }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_ANIMATION
        BYTE abs_vx = actor->actor_vel_x;
        if (abs_vx < 0) abs_vx = -abs_vx;
        BYTE abs_vy = actor->actor_vel_y;
        if (abs_vy < 0) abs_vy = -abs_vy;
        // actor_set_anim is a header inline whose actor_set_frames call
        // dedupes internally, so setting the animation directly here avoids
        // the BANKED actor_set_dir/actor_set_anim_moving trampoline calls
        // that used to run once per animated actor per frame.
        if (abs_vx || abs_vy) {
            UBYTE anim_dir = actor->dir;
            if ((flags2 & (BHV3_LOCK_DIR_H | BHV3_LOCK_DIR_V)) != (BHV3_LOCK_DIR_H | BHV3_LOCK_DIR_V)) {
                if (CHK_FLAG(flags2, BHV3_LOCK_DIR_H)) {
                    anim_dir = (actor->actor_vel_y < 0) ? DIR_UP : DIR_DOWN;
                } else if (CHK_FLAG(flags2, BHV3_LOCK_DIR_V)) {
                    anim_dir = (actor->actor_vel_x < 0) ? DIR_LEFT : DIR_RIGHT;
                } else if (abs_vy > abs_vx) {
                    anim_dir = (actor->actor_vel_y < 0) ? DIR_UP : DIR_DOWN;
                } else {
                    anim_dir = (actor->actor_vel_x < 0) ? DIR_LEFT : DIR_RIGHT;
                }
                actor->dir = anim_dir;
            }
            actor_set_anim(actor, anim_dir + N_DIRECTIONS);
        } else {
            actor_set_anim(actor, actor->dir);
        }
        if (((CHK_FLAG(flags2, BHV2_ANIM_JUMP_Y)) && (actor->actor_state == BHV_STATE_AIRBORNE_Y)) || ((CHK_FLAG(flags2, BHV2_ANIM_JUMP_Z)) && (actor->actor_state == BHV_STATE_AIRBORNE_Z))) {
            if (actor->dir == DIR_LEFT) {
                actor_set_anim(actor, ANIM_JUMP_LEFT);
            } else {
                actor_set_anim(actor, ANIM_JUMP_RIGHT);
            }
        }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_STATE_CHANGE_EVENT
        if (CHK_FLAG(event_flags, BHV_EVENT_STATE_CHANGE) && old_state != actor->actor_state) {
            dynamic_actor_execute_state_change(actor);
        }
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_TILE_ENTER_EVENT
        if (CHK_FLAG(event_flags, BHV_EVENT_TILE_ENTER)) {
            UBYTE end_tile_x = SUBPX_TO_TILE(actor->pos.x);
            UBYTE end_tile_y = SUBPX_TO_TILE(actor->pos.y);
            // Crossing into a new cell of the tile enter grid. The script still
            // gets the real 8x8 tile the actor landed on, not the coarse cell.
            if ((start_cell_x != DYNAMIC_ACTOR_TILE_ENTER_CELL(end_tile_x)) ||
                (start_cell_y != DYNAMIC_ACTOR_TILE_ENTER_CELL(end_tile_y))) {
                dynamic_actor_execute_tile_enter(actor, end_tile_x, end_tile_y);
            }
        }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_TRIGGERS
        // Let this actor activate scene triggers (onEnter/onLeave). The player
        // is skipped - the engine already drives its trigger activation.
        if (CHK_FLAG(event_flags, BHV_EVENT_ACTIVATE_TRIGGERS) && (actor != &PLAYER)) {
            dynamic_actor_activate_triggers(actor);
        }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
        // Moving platform: cache this platform's final box for the
        // end-of-frame claim/release pass. Platforms past the cache limit
        // still move but never claim or release riders.
        if (CHK_FLAG(flags, BHV_PLATFORM) && (platform_count != DYNAMIC_ACTOR_MAX_PLATFORMS)) {
            platform_cache_t *p = &platform_cache[platform_count];
            platform_count++;
            p->actor = actor;
            p->left = actor->pos.x + actor->bounds.left;
            p->right = actor->pos.x + actor->bounds.right;
            p->top = actor->pos.y + actor->bounds.top;
            p->bottom = actor->pos.y + actor->bounds.bottom;
            p->group = actor->collision_group & COLLISION_GROUP_MASK;
        }
#endif

        actor = actor->prev;
    }

    dynamic_actor_current_actor = NULL;
    DYNAMIC_ACTOR_LOAD_TILE_COL_OVERRIDE(0);

#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
    // End-of-frame pass, skipped entirely until parenting is first used:
    // claim/release riders against the cached platform boxes, then snapshot
    // every active actor's position for next frame's parent deltas.
    if (dynamic_actor_parenting_used) {
        actor = actors_active_tail;
        while (actor) {
#ifdef DYNAMIC_ACTOR_USES_PREV_POS
            // "Apply all parents positions delta" carry, done here (end of frame,
            // before any prev_pos snapshot) so it is order-independent. Uses the
            // parent set on a previous frame - a rider claimed by the block below
            // this frame starts moving next frame.
            if (actor->actor_parent) {
                dynamic_actor_apply_parent_delta(actor);
            }
#endif
            if (actor->actor_parent == NULL
#ifdef DYNAMIC_ACTOR_PLATFORM_PLAYER_ONLY
                // Platforms only auto-attach the player; other actors are never
                // claimed (they can still be parented explicitly).
                && (actor == &PLAYER)
#endif
            ) {
                // Unparented: the first intersecting platform claims it, unless
                // the platform has a collision group and this actor's group
                // differs (a group-less platform claims everything). The player
                // is always eligible - a platform picks it up no matter its
                // collision group.
                platform_cache_t *p = platform_cache;
                UBYTE i = platform_count;
                while (i) {
                    if ((p->actor != actor) &&
                        ((actor == &PLAYER) ||
                         (p->group == COLLISION_GROUP_NONE) ||
                         (p->group == (actor->collision_group & COLLISION_GROUP_MASK))) &&
                        platform_cache_test(p, actor)) {
                        actor->actor_parent = p->actor;
                        break;
                    }
                    p++;
                    i--;
                }
            } else if (actor->actor_parent) {
                // Parented: only test against its own parent, and only when
                // that parent is a platform that ran this frame - explicitly
                // set parents and paused platforms never auto-release.
                platform_cache_t *p = platform_cache;
                UBYTE i = platform_count;
                while (i) {
                    if (p->actor == actor->actor_parent) {
                        if (!platform_cache_test(p, actor)) {
                            actor->actor_parent = NULL;
                        }
                        break;
                    }
                    p++;
                    i--;
                }
            }
            actor = actor->prev;
        }
#ifdef DYNAMIC_ACTOR_USES_PREV_POS
        // Snapshot every actor's final position AFTER all carries above, in a
        // separate pass, so the carry always reads last frame's snapshot.
        actor = actors_active_tail;
        while (actor) {
            actor->prev_pos = actor->pos;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
            actor->prev_pos_z = actor->pos_z;
#endif
            actor = actor->prev;
        }
#endif
#ifdef DYNAMIC_ACTOR_USES_PLAYER_PREV_POS
        // Snapshot the player for next frame's player-parent position delta.
        player_prev_pos = PLAYER.pos;
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
        player_prev_pos_z = PLAYER.pos_z;
#endif
#endif
    }
#endif
}

#ifdef DYNAMIC_ACTOR_ENABLE_VM_WAIT_FOR_COLLISION
#define WAIT_COL_H     0x01u
#define WAIT_COL_V     0x02u
#define WAIT_COL_PIT   0x04u
#define WAIT_COL_ACTOR 0x08u

UBYTE vm_wait_for_collision(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    actor_t* actor = actors + stack_frame[0];
    behavior_def_t *def = &behavior_defs[actor->actor_behavior_id];
    UBYTE collision_type = def->collision_type;
    // Probe the tiles with the same override the behavior itself moves with,
    // otherwise the wait would report a wall the actor is allowed to pass.
    DYNAMIC_ACTOR_LOAD_TILE_COL_OVERRIDE(def->override_tile_collision);
    if (start){
        CLR_FLAG(actor->flags, ACTOR_FLAG_INTERRUPT);
    } else {
        // Interrupt actor movement
        if (CHK_FLAG(actor->flags, ACTOR_FLAG_INTERRUPT)) {
            return TRUE;
        }
    }
    UBYTE collision_flag = stack_frame[1]; //Horizontal or vertical or checkpit or another actor collision

    if (!collision_flag) {
        return TRUE;
    }

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_X
    if ((collision_flag & WAIT_COL_H) && actor->actor_vel_x) {
        new_actor_x = actor->pos.x + actor->actor_vel_x;
        if (check_horizontal_collision_by_type(new_actor_x, actor->pos.y, actor, (actor->actor_vel_x > 0), collision_type) != (UWORD)new_actor_x) {
            return TRUE;
        }
    }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Y
    if ((collision_flag & WAIT_COL_V) && actor->actor_vel_y) {
        new_actor_y = actor->pos.y + actor->actor_vel_y;
        if (check_vertical_collision_by_type(actor->pos.x, new_actor_y, actor, (actor->actor_vel_y > 0), collision_type) != (UWORD)new_actor_y) {
            return TRUE;
        }
    }
#endif

#if defined(DYNAMIC_ACTOR_ENABLE_MOVE_X) && defined(DYNAMIC_ACTOR_ENABLE_LEDGE_STOP)
    if ((collision_flag & WAIT_COL_PIT) && actor->actor_vel_x) {
        new_actor_x = actor->pos.x + actor->actor_vel_x;
        if (check_pit_by_type(new_actor_x, actor->pos.y, actor, (actor->actor_vel_x > 0), collision_type) != (UWORD)new_actor_x) {
            return TRUE;
        }
    }
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_COLLISION
    if (collision_flag & WAIT_COL_ACTOR) {
        UWORD test_x = actor->pos.x;
        UWORD test_y = actor->pos.y;
        upoint16_t test_pos;
        actor_t *other = actors_active_tail;

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_X
        test_x += actor->actor_vel_x;
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Y
        test_y += actor->actor_vel_y;
#endif
    test_pos.x = test_x;
    test_pos.y = test_y;

        while (other) {
            if ((other != actor) &&
                (other->flags & ACTOR_FLAG_COLLISION) &&
        bb_intersects(&actor->bounds, &test_pos, &other->bounds, &other->pos)) {
                return TRUE;
            }
            other = other->prev;
        }
    }
#endif

    ((SCRIPT_CTX *)THIS)->waitable = TRUE;
    return FALSE;
}
#endif

// The crawl step steers on both axes through the MOVE_X/MOVE_Y collision
// helpers, so it also needs both movement components compiled.
#if defined(DYNAMIC_ACTOR_ENABLE_VM_MOTION_CRAWL_STEP) && defined(DYNAMIC_ACTOR_ENABLE_MOVE_X) && defined(DYNAMIC_ACTOR_ENABLE_MOVE_Y)
#define CRAWL_SOLID(tx, ty) ((tile_at((tx), (ty)) & COLLISION_ALL) == COLLISION_ALL)

#define DIR_XMOD(value, dir) (((dir) & 1) ? ((dir) == 1 ? (value) : -(value)) : 0)
#define DIR_YMOD(value, dir) (((dir) & 1) ? 0 : ((dir) == 0 ? -(value) : (value)))

#define DIR_BOUNDS_X(bounds, dir) (((dir) & 1) ? ((dir) == 1 ? (bounds).right : (bounds).left) : 0)
#define DIR_BOUNDS_Y(bounds, dir) (((dir) & 1) ? 0 : ((dir) == 0 ? (bounds).top : (bounds).bottom))


// One step of wall/ceiling crawling (right/left-hand wall follower).
// Call every frame from a looping script; the current direction lives in a
// script local owned by the caller, so every crawler keeps its own state and
// no per-actor engine RAM is needed. The behavior applies the velocity, so
// the actor needs Move X + Move Y (tile collision is not needed - the crawl
// logic already does the tile collision correction of the behavior). 
// A wall is a fully solid tile (all
// four collision bits); out-of-bounds reads count as solid, so map borders
// can be crawled. Stack frame slots [3] and [4] cache the last tile X/Y that
// was processed so the collision test only runs when the actor enters a new
// tile instead of depending on exact grid alignment.
UBYTE vm_actor_crawl_step(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    actor_t * actor = actors + (UBYTE)stack_frame[0];
    if (start){
        CLR_FLAG(actor->flags, ACTOR_FLAG_INTERRUPT);
    } else {
        // Interrupt actor movement
        if (CHK_FLAG(actor->flags, ACTOR_FLAG_INTERRUPT)) {
            return TRUE;
        }
    }
    UBYTE dir = ((UBYTE)stack_frame[1]) & 3;
    UBYTE side = (UBYTE)stack_frame[2];   // 0 = wall on right hand (clockwise around blocks), 1 = left hand
    UBYTE speed = actor->move_speed >> 1; // player max velocity is 128, so divide by 2 to get a speed that lands on cell boundaries
    UBYTE collision_type = ACTOR_COLLISION_TYPE(actor);
    // The crawl steers through the same collision helpers as the behavior, so it
    // needs the behavior's tile collision override loaded too.
    DYNAMIC_ACTOR_LOAD_TILE_COL_OVERRIDE(ACTOR_OVERRIDE_TILE_COLLISION(actor));
    UBYTE tile_x;
    UBYTE tile_y;

    if (collision_type == DYNAMIC_ACTOR_COLLISION_SINGLE_POINT) {
        tile_x = SUBPX_TO_TILE(actor->pos.x + DIR_XMOD(speed, dir));
        tile_y = SUBPX_TO_TILE(actor->pos.y + DIR_YMOD(speed, dir));
    } else {
        tile_x = SUBPX_TO_TILE(actor->pos.x + DIR_BOUNDS_X(actor->bounds, dir) + DIR_XMOD(speed, dir));
        tile_y = SUBPX_TO_TILE(actor->pos.y + DIR_BOUNDS_Y(actor->bounds, dir) + DIR_YMOD(speed, dir));
    }
    if (start) {
        stack_frame[3] = tile_x;
        stack_frame[4] = tile_y;
    } else if ((tile_x != (UBYTE)stack_frame[3]) || (tile_y != (UBYTE)stack_frame[4])) {
        if (collision_type != DYNAMIC_ACTOR_COLLISION_SINGLE_POINT) {
#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_BOUNDING_BOX
            if (dir & 1){
                UBYTE sdir = (dir + (side ? 3 : 1)) & 3; 
                UWORD new_actor_y = actor->pos.y + DIR_YMOD(speed, sdir);
                actor->pos.y = check_vertical_collision_bbox(actor->pos.x, new_actor_y, &actor->bounds, sdir == 2);
                if (actor->pos.y == new_actor_y) {
                    // Outer corner: the wall beside us ended - turn toward it to wrap around
                    dir = sdir;
                    //Adjust horizontal overshoot
                    sdir = (dir + (side ? 3 : 1)) & 3;
                    UWORD new_actor_x = actor->pos.x + DIR_XMOD(speed, sdir);
                    actor->pos.x = check_horizontal_collision_bbox(new_actor_x, actor->pos.y, &actor->bounds, sdir == 1);

                } else {
                    UWORD new_actor_x = actor->pos.x + DIR_XMOD(speed, dir);
                    actor->pos.x = check_horizontal_collision_bbox(new_actor_x, actor->pos.y, &actor->bounds, dir == 1);
                    if (new_actor_x != actor->pos.x) {
                        // Ran into a wall: turn away from the wall side
                        dir = (dir + (side ? 1 : 3)) & 3;
                    }
                }
            } else {                
                UBYTE sdir = (dir + (side ? 3 : 1)) & 3;
                UWORD new_actor_x = actor->pos.x + DIR_XMOD(speed, sdir);
                actor->pos.x = check_horizontal_collision_bbox(new_actor_x, actor->pos.y, &actor->bounds, sdir == 1);
                if (actor->pos.x == new_actor_x) {
                    // Outer corner: the wall beside us ended - turn toward it to wrap around
                    dir = sdir;
                    //Adjust vertical overshoot
                    sdir = (dir + (side ? 3 : 1)) & 3;
                    UWORD new_actor_y = actor->pos.y + DIR_YMOD(speed, sdir);
                    actor->pos.y = check_vertical_collision_bbox(actor->pos.x, new_actor_y, &actor->bounds, sdir == 2);

                } else {
                    UWORD new_actor_y = actor->pos.y + DIR_YMOD(speed, dir);
                    actor->pos.y = check_vertical_collision_bbox(actor->pos.x, new_actor_y, &actor->bounds, dir == 2);
                    if (new_actor_y != actor->pos.y) {
                        // Ran into a wall: turn away from the wall side
                        dir = (dir + (side ? 1 : 3)) & 3;
                    }
                }
            }
#endif
        } else {
#ifdef DYNAMIC_ACTOR_ENABLE_COLLISION_SINGLE_POINT
            if (dir & 1){
                UWORD new_actor_x = actor->pos.x + DIR_XMOD(speed, dir);
                actor->pos.x = check_horizontal_collision_point(new_actor_x, actor->pos.y, dir == 1);
                if (new_actor_x != actor->pos.x) {
                    // Ran into a wall: turn away from the wall side
                    dir = (dir + (side ? 1 : 3)) & 3;
                } else {
                    UBYTE sdir = (dir + (side ? 3 : 1)) & 3;
                    UWORD new_actor_y = actor->pos.y + DIR_YMOD(speed, sdir);
                    actor->pos.y = check_vertical_collision_point(actor->pos.x, new_actor_y, sdir == 2);
                    if (actor->pos.y == new_actor_y) {
                        // Outer corner: the wall beside us ended - turn toward it to wrap around
                        dir = sdir;
                    }
                }
            } else {
                UWORD new_actor_y = actor->pos.y + DIR_YMOD(speed, dir);
                actor->pos.y = check_vertical_collision_point(actor->pos.x, new_actor_y, dir == 2);
                if (new_actor_y != actor->pos.y) {
                    // Ran into a wall: turn away from the wall side
                    dir = (dir + (side ? 1 : 3)) & 3;
                } else {
                    UBYTE sdir = (dir + (side ? 3 : 1)) & 3;
                    UWORD new_actor_x = actor->pos.x + DIR_XMOD(speed, sdir);
                    actor->pos.x = check_horizontal_collision_point(new_actor_x, actor->pos.y, sdir == 1);
                    if (actor->pos.x == new_actor_x) {
                        // Outer corner: the wall beside us ended - turn toward it to wrap around
                        dir = sdir;
                    }
                }
            }
#endif
        }
        stack_frame[3] = tile_x;
        stack_frame[4] = tile_y;
    }

    switch (dir) {
        case 0:
            actor->actor_vel_x = 0;
            actor->actor_vel_y = -speed;
            break;
        case 1:
            actor->actor_vel_x = speed;
            actor->actor_vel_y = 0;
            break;
        case 2:
            actor->actor_vel_x = 0;
            actor->actor_vel_y = speed;
            break;
        default:
            actor->actor_vel_x = -speed;
            actor->actor_vel_y = 0;
            break;
    }
    stack_frame[1] = dir;
    ((SCRIPT_CTX *)THIS)->waitable = TRUE;
    return FALSE;
}
#endif



