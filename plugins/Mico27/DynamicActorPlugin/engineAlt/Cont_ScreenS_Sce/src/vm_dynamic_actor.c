#pragma bank 255

#include <string.h>
#include <stdlib.h>
#include <gbdk/platform.h>
#include "system.h"
#include "vm.h"
#include "gbs_types.h"
#include "math.h"
#include "actor.h"
#include "game_time.h"
#include "dynamic_actor.h"
#include "sincos.h"
#include "data/states_defines.h"
#include "collision.h"
#include "events.h"
#include "macro.h"
#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_TRIGGERS
#include "trigger.h"
#endif

extern behavior_def_t behavior_defs[DYNAMIC_ACTOR_MAX_BEHAVIORS + 1];

#ifdef DYNAMIC_ACTOR_ENABLE_HIT_ACTORS
// On collision, run every overlapping collidable actor's onHit script - the same
// script the engine fires when the player touches that actor, but driven by this
// actor. This actor's own collision group is passed to the hit actor's onHit
// script (as the engine passes an attacker's group to the player's hit script),
// so the hit script can branch on who hit it. Only an actor that is itself in a
// collision group deals hits (matches the engine's player-collision gating).
// Skips self and the player (the engine already handles player contact). Each
// target is re-triggered only once its previous onHit thread has finished
// (hscript_hit debounce). Called from dynamic_actor_update for flagged actors.
void dynamic_actor_hit_actors(actor_t *actor) BANKED {
    UBYTE group = actor->collision_group & COLLISION_GROUP_MASK;
    if (!group) {
        return;
    }
    actor_t *other = actors_active_tail;
    while (other) {
        if ((other != actor) && (other != &PLAYER) &&
            (other->flags & ACTOR_FLAG_COLLISION) &&
            (other->script.bank) &&
            ((other->hscript_hit == 0) || (other->hscript_hit & SCRIPT_TERMINATED)) &&
            bb_intersects(&actor->bounds, &actor->pos, &other->bounds, &other->pos)) {
            dynamic_actor_event_actor_idx = (UBYTE)(actor - actors);
            script_execute(other->script.bank, other->script.ptr, &other->hscript_hit, 1, group);
            return;
        }
        other = other->prev;
    }
}
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_TRIGGERS
UBYTE actor_last_trigger[MAX_ACTORS];

// Player-style trigger activation for an arbitrary actor, using its own
// last-trigger slot: run the leave script of the trigger it left and the enter
// script of the trigger it entered when the intersected trigger changes.
void dynamic_actor_activate_triggers(actor_t *actor) BANKED {
    UBYTE idx = (UBYTE)(actor - actors);
    UBYTE hit = trigger_at_intersection(&actor->bounds, &actor->pos);
    UBYTE prev = actor_last_trigger[idx];
    if (hit != prev) {
        if ((prev != NO_TRIGGER_COLLISON) &&
            (triggers[prev].script_flags & TRIGGER_HAS_LEAVE_SCRIPT)) {
            dynamic_actor_event_actor_idx = (UBYTE)(actor - actors);
            script_execute(triggers[prev].script.bank, triggers[prev].script.ptr, 0, 1, 2);
        }
        if ((hit != NO_TRIGGER_COLLISON) &&
            (triggers[hit].script_flags & TRIGGER_HAS_ENTER_SCRIPT)) {
            dynamic_actor_event_actor_idx = (UBYTE)(actor - actors);
            script_execute(triggers[hit].script.bank, triggers[hit].script.ptr, 0, 1, 1);
        }
        actor_last_trigger[idx] = hit;
    }
}
#endif

#ifndef ACTOR_ATTR_H_FIRST
#define ACTOR_ATTR_H_FIRST            0x01
#define ACTOR_ATTR_CHECK_COLL_WALLS   0x02
#define ACTOR_ATTR_DIAGONAL           0x04
#define ACTOR_ATTR_RELATIVE_SNAP_PX   0x08
#define ACTOR_ATTR_RELATIVE_SNAP_TILE 0x10
#define ACTOR_ATTR_CHECK_COLL_ACTORS  0x20
#endif

#define MTPBV_ALLOW_H   0x01
#define MTPBV_ALLOW_V   0x02
#define MTPBV_DIR_H     0x04
#define MTPBV_DIR_V     0x08
#define MTPBV_NEEDED_H  0x10
#define MTPBV_NEEDED_V  0x20
#define MTPBV_H         (MTPBV_ALLOW_H | MTPBV_NEEDED_H)
#define MTPBV_V         (MTPBV_ALLOW_V | MTPBV_NEEDED_V)

void vm_define_actor_behavior(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE slot = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    if ((slot == 0) || (slot > DYNAMIC_ACTOR_MAX_BEHAVIORS)) return;
    behavior_def_t *def = &behavior_defs[slot];
    def->event_flags  = *(uint8_t *)VM_REF_TO_PTR(FN_ARG7);
    def->collision_type = *(uint8_t *)VM_REF_TO_PTR(FN_ARG6);
    def->flags        = *(uint8_t *)VM_REF_TO_PTR(FN_ARG1);
    def->flags2       = *(uint8_t *)VM_REF_TO_PTR(FN_ARG2);
    def->gravity      = *(uint8_t *)VM_REF_TO_PTR(FN_ARG3);
    def->max_fall_vel = *(uint8_t *)VM_REF_TO_PTR(FN_ARG4);
    def->bounce       = *(uint8_t *)VM_REF_TO_PTR(FN_ARG5);
#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
    if (CHK_FLAG(def->flags, BHV_PLATFORM)) {
        dynamic_actor_mark_parenting_used();
    }
#endif
}

void vm_set_actor_behavior(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    actor->actor_behavior_id = *(uint8_t *)VM_REF_TO_PTR(FN_ARG1);
    UBYTE state = *(uint8_t *)VM_REF_TO_PTR(FN_ARG2);
    if (state != BHV_STATE_KEEP) {
        actor->actor_state = state;
    }
}

void vm_get_actor_behavior(SCRIPT_CTX * THIS) OLDCALL BANKED {
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    int16_t idx = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
    int16_t * A;
    if (idx < 0) A = THIS->stack_ptr + idx - 2; else A = script_memory + idx;
    *A = actor->actor_behavior_id;
}

void vm_set_actor_state(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    actor->actor_state = *(uint8_t *)VM_REF_TO_PTR(FN_ARG1);
}

void vm_get_actor_state(SCRIPT_CTX * THIS) OLDCALL BANKED {
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    int16_t idx = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
    int16_t * A;
    if (idx < 0) A = THIS->stack_ptr + idx - 2; else A = script_memory + idx;
    *A = actor->actor_state;
}

void vm_assign_dynamic_actor_event_script(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE slot = *(uint8_t *)VM_REF_TO_PTR(FN_ARG2);
    UBYTE *bank = VM_REF_TO_PTR(FN_ARG1);
    UBYTE **ptr = VM_REF_TO_PTR(FN_ARG0);
    if (slot == 10){ //Any collision
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_TOP].script_bank = *bank;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_TOP].script_addr = *ptr;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_RIGHT].script_bank = *bank;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_RIGHT].script_addr = *ptr;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_BOTTOM].script_bank = *bank;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_BOTTOM].script_addr = *ptr;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_LEFT].script_bank = *bank;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_LEFT].script_addr = *ptr;
    } else {
        dynamic_actor_events[slot].script_bank = *bank;
        dynamic_actor_events[slot].script_addr = *ptr;
    }
}

void vm_clear_dynamic_actor_event_script(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE slot = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    if (slot == 10){ //Any collision
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_TOP].script_bank = 0;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_TOP].script_addr = NULL;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_RIGHT].script_bank = 0;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_RIGHT].script_addr = NULL;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_BOTTOM].script_bank = 0;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_BOTTOM].script_addr = NULL;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_LEFT].script_bank = 0;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_LEFT].script_addr = NULL;
    } else {
        dynamic_actor_events[slot].script_bank = 0;
        dynamic_actor_events[slot].script_addr = NULL;
    }
}

void vm_set_actor_velocity(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    actor->actor_vel_x = *(int16_t *)VM_REF_TO_PTR(FN_ARG1);
    actor->actor_vel_y = *(int16_t *)VM_REF_TO_PTR(FN_ARG2);
}

void vm_set_actor_velocity_x(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    actor->actor_vel_x = *(int16_t *)VM_REF_TO_PTR(FN_ARG1);
}

void vm_get_actor_velocity_x(SCRIPT_CTX * THIS) OLDCALL BANKED {
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    int16_t idx = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
    int16_t * A;
    if (idx < 0) A = THIS->stack_ptr + idx - 2; else A = script_memory + idx;
    *A = actor->actor_vel_x;
}

void vm_set_actor_velocity_y(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    actor->actor_vel_y = *(int16_t *)VM_REF_TO_PTR(FN_ARG1);
}

void vm_get_actor_velocity_y(SCRIPT_CTX * THIS) OLDCALL BANKED {
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    int16_t idx = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
    int16_t * A;
    if (idx < 0) A = THIS->stack_ptr + idx - 2; else A = script_memory + idx;
    *A = actor->actor_vel_y;
}

#ifdef DYNAMIC_ACTOR_ENABLE_MOVE_Z
void vm_set_actor_z_position(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    actor->pos_z = *(uint16_t *)VM_REF_TO_PTR(FN_ARG1);
}

void vm_get_actor_z_position(SCRIPT_CTX * THIS) OLDCALL BANKED {
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    int16_t idx = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
    int16_t * A;
    if (idx < 0) A = THIS->stack_ptr + idx - 2; else A = script_memory + idx;
    *A = actor->pos_z;
}

void vm_set_actor_velocity_z(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    actor->actor_vel_z = *(int16_t *)VM_REF_TO_PTR(FN_ARG1);
}

void vm_get_actor_velocity_z(SCRIPT_CTX * THIS) OLDCALL BANKED {
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    int16_t idx = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
    int16_t * A;
    if (idx < 0) A = THIS->stack_ptr + idx - 2; else A = script_memory + idx;
    *A = actor->actor_vel_z;
}
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
void vm_set_actor_parent(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    int8_t parent_actor_idx = *(int8_t *)VM_REF_TO_PTR(FN_ARG1);
    if (parent_actor_idx == -1) {
        actor->actor_parent = NULL;
    } else {
        actor->actor_parent = actors + parent_actor_idx;
        dynamic_actor_mark_parenting_used();
    }
}

void vm_get_actor_parent(SCRIPT_CTX * THIS) OLDCALL BANKED {
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    int16_t idx = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
    int16_t * A;
    if (idx < 0) A = THIS->stack_ptr + idx - 2; else A = script_memory + idx;
    if (!actor->actor_parent) {
        *A = -1;
    } else {
        *A = (int16_t)(actor->actor_parent - actors);
    }
}
#endif

void vm_get_tile_collision(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    uint8_t tile_x = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    uint8_t tile_y = *(uint8_t *)VM_REF_TO_PTR(FN_ARG1);
    int16_t idx = *(int16_t*)VM_REF_TO_PTR(FN_ARG2);
    int16_t * A;
    if (idx < 0) A = THIS->stack_ptr + idx - 3; else A = script_memory + idx;
    *A = tile_at(tile_x, tile_y);
}

void vm_get_actor_collision(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    uint16_t point_x = PX_TO_SUBPX(*(uint16_t *)VM_REF_TO_PTR(FN_ARG0));
    uint16_t point_y = PX_TO_SUBPX(*(uint16_t *)VM_REF_TO_PTR(FN_ARG1));
    int16_t idx = *(int16_t*)VM_REF_TO_PTR(FN_ARG2);
    int16_t * A;
    actor_t *actor = actors_active_tail;
    if (idx < 0) A = THIS->stack_ptr + idx - 3; else A = script_memory + idx;
    while (actor) {
        if (actor->flags & ACTOR_FLAG_COLLISION) {
            UWORD left = actor->pos.x + actor->bounds.left;
            UWORD right = actor->pos.x + actor->bounds.right;
            UWORD top = actor->pos.y + actor->bounds.top;
            UWORD bottom = actor->pos.y + actor->bounds.bottom;
            if ((point_x >= left) && (point_x <= right) &&
                (point_y >= top) && (point_y <= bottom)) {
                *A = (int16_t)(actor - actors);
                return;
            }
        }
        actor = actor->prev;
    }
    *A = -1;
}

#ifdef DYNAMIC_ACTOR_ENABLE_VM_MOTION_CHASE_ACTOR
UBYTE vm_actor_chase_actor(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    actor_t *actor = actors + (UBYTE)stack_frame[0];
    if (start){
        CLR_FLAG(actor->flags, ACTOR_FLAG_INTERRUPT);
    } else {
        if (CHK_FLAG(actor->flags, ACTOR_FLAG_INTERRUPT)) {
            return TRUE;
        }
    }
    actor_t *target = actors + (UBYTE)stack_frame[1];
    UBYTE flee = (UBYTE)stack_frame[2];
    UWORD range = stack_frame[3];
    UBYTE interval = (UBYTE)stack_frame[4];
    WORD speed = actor->move_speed >> 1;
    UBYTE steer_y = 1;

    if (start || ((game_time & interval) == 0)) {
        stack_frame[5] = target->pos.x;
        stack_frame[6] = target->pos.y;
    }

    UWORD target_x = stack_frame[5];
    UWORD target_y = stack_frame[6];

    if (flee) {
        speed = -speed;
    }

#ifdef DYNAMIC_ACTOR_ENABLE_GRAVITY
    if (behavior_defs[actor->actor_behavior_id].flags & BHV_GRAVITY_Y) {
        steer_y = 0;
    }
#endif

    WORD dx = (WORD)(target_x - actor->pos.x);
    WORD dy = (WORD)(target_y - actor->pos.y);
    UWORD adx = (dx < 0) ? (UWORD)(-dx) : (UWORD)dx;
    UWORD ady = (dy < 0) ? (UWORD)(-dy) : (UWORD)dy;

    if (dx > speed) {
        actor->actor_vel_x = speed;
    } else if (dx < -speed) {
        actor->actor_vel_x = -speed;
    } else {
        actor->actor_vel_x = 0;
    }
    if (steer_y) {
        if (dy > speed) {
            actor->actor_vel_y = speed;
        } else if (dy < -speed) {
            actor->actor_vel_y = -speed;
        } else {
            actor->actor_vel_y = 0;
        }
    }

    if (range) {
        UBYTE done;
        if (flee) {
            done = (adx > range) || (steer_y && (ady > range));
        } else {
            done = (adx <= range) && (!steer_y || (ady <= range));
        }
        if (done) {
            actor->actor_vel_x = 0;
            if (steer_y) {
                actor->actor_vel_y = 0;
            }
            return TRUE;
        }
    }

    ((SCRIPT_CTX *)THIS)->waitable = TRUE;
    return FALSE;
}
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_VM_MOTION_MOVE_TO_POS_BY_VELOCITY
UBYTE vm_actor_move_to_pos_by_velocity(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    actor_t *actor = actors + (UBYTE)stack_frame[0];
    UBYTE attr = (UBYTE)stack_frame[3];
    UBYTE direct_to_point = (UBYTE)stack_frame[4];
    UBYTE cancel_on_collision = (UBYTE)stack_frame[5];
    UBYTE flags;

    if (start) {
        UWORD target_x;
        UWORD target_y;

        CLR_FLAG(actor->flags, ACTOR_FLAG_INTERRUPT);

        target_x = PX_TO_SUBPX(stack_frame[1]);
        target_y = PX_TO_SUBPX(stack_frame[2]);

        if (CHK_FLAG(attr, ACTOR_ATTR_RELATIVE_SNAP_PX)) {
            target_x = SUBPX_SNAP_PX(target_x + actor->pos.x);
            target_y = SUBPX_SNAP_PX(target_y + actor->pos.y);
        } else if (CHK_FLAG(attr, ACTOR_ATTR_RELATIVE_SNAP_TILE)) {
            target_x = SUBPX_SNAP_TILE(target_x + actor->pos.x);
            target_y = SUBPX_SNAP_TILE(target_y + actor->pos.y);
        }

        stack_frame[1] = target_x;
        stack_frame[2] = target_y;

        flags = 0;
        if (CHK_FLAG(attr, ACTOR_ATTR_DIAGONAL)) {
            flags |= (MTPBV_ALLOW_H | MTPBV_ALLOW_V);
        } else if (CHK_FLAG(attr, ACTOR_ATTR_H_FIRST)) {
            flags |= MTPBV_ALLOW_H;
        } else {
            flags |= MTPBV_ALLOW_V;
        }

        if (actor->pos.x != target_x) {
            flags |= MTPBV_NEEDED_H;
        } else {
            flags |= MTPBV_ALLOW_V;
        }
        if (actor->pos.y != target_y) {
            flags |= MTPBV_NEEDED_V;
        } else {
            flags |= MTPBV_ALLOW_H;
        }

        if (actor->pos.x > target_x) {
            flags |= MTPBV_DIR_H;
        }
        if (actor->pos.y > target_y) {
            flags |= MTPBV_DIR_V;
        }

        stack_frame[6] = flags;
        stack_frame[7] = actor->pos.x;
        stack_frame[8] = actor->pos.y;
        stack_frame[9] = 0;
    } else {
        if (CHK_FLAG(actor->flags, ACTOR_FLAG_INTERRUPT)) {
            actor->actor_vel_x = 0;
            actor->actor_vel_y = 0;
            return TRUE;
        }

        if (cancel_on_collision) {
            if ((((stack_frame[9] >> 8) != 0) && (actor->pos.x == stack_frame[7])) ||
             (((stack_frame[9] & 0xFF) != 0) && (actor->pos.y == stack_frame[8]))) {
                actor->actor_vel_x = 0;
                actor->actor_vel_y = 0;
                return TRUE;
            }
        }
    }

    UWORD target_x = stack_frame[1];
    UWORD target_y = stack_frame[2];
    flags = (UBYTE)stack_frame[6];
    WORD speed = actor->move_speed >> 1;
    UBYTE move_h;
    UBYTE move_v;

    actor->actor_vel_x = 0;
    actor->actor_vel_y = 0;

    if (direct_to_point) {
        WORD dx = (WORD)(target_x - actor->pos.x);
        WORD dy = (WORD)(target_y - actor->pos.y);
        UBYTE near_x = (dx <= speed) && (dx >= -speed);
        UBYTE near_y = (dy <= speed) && (dy >= -speed);

        if (near_x && near_y) {
            actor->actor_vel_x = 0;
            actor->actor_vel_y = 0;
            return TRUE;
        }

        WORD t_dx = (WORD)SUBPX_TO_TILE(target_x) - (WORD)SUBPX_TO_TILE(actor->pos.x);
        WORD t_dy = (WORD)SUBPX_TO_TILE(target_y) - (WORD)SUBPX_TO_TILE(actor->pos.y);
        if ((t_dx <= 2 && t_dx >= -2) && (t_dy <= 2 && t_dy >= -2)) {
            // closer than 16px: use the px delta for direction
            t_dx = (WORD)SUBPX_TO_PX(target_x) - (WORD)SUBPX_TO_PX(actor->pos.x);
            t_dy = (WORD)SUBPX_TO_PX(target_y) - (WORD)SUBPX_TO_PX(actor->pos.y);
        }
        UBYTE angle = atan2(t_dy, t_dx);
        if (!near_x) {
            actor->actor_vel_x = (WORD)(SIN(angle) * speed) >> 7;
            if ((actor->actor_vel_x == 0) && (dx != 0)) {
                actor->actor_vel_x = (dx > 0) ? speed : -speed;
            }
        } 
        if (!near_y) {
            actor->actor_vel_y = -((WORD)(COS(angle) * speed) >> 7);
            if ((actor->actor_vel_y == 0) && (dy != 0)) {
                actor->actor_vel_y = (dy > 0) ? speed : -speed;
            }
        } 
        

    } else {
        move_h = (CHK_FLAG(flags, MTPBV_H) == MTPBV_H);
        move_v = (CHK_FLAG(flags, MTPBV_V) == MTPBV_V);

        if (!CHK_FLAG(attr, ACTOR_ATTR_DIAGONAL)) {
            if (move_h) {
                move_v = FALSE;
            } else if (move_v) {
                move_h = FALSE;
            }
        }

        if (move_h) {
            WORD dx = (WORD)(target_x - actor->pos.x);
            if (dx > speed) {
                actor->actor_vel_x = speed;
            } else if (dx < -speed) {
                actor->actor_vel_x = -speed;
            } else {
                actor->actor_vel_x = dx;
                CLR_FLAG(flags, MTPBV_NEEDED_H);
                SET_FLAG(flags, MTPBV_ALLOW_V);
            }
        }

        if (move_v) {
            WORD dy = (WORD)(target_y - actor->pos.y);
            if (dy > speed) {
                actor->actor_vel_y = speed;
            } else if (dy < -speed) {
                actor->actor_vel_y = -speed;
            } else {
                actor->actor_vel_y = dy;
                CLR_FLAG(flags, MTPBV_NEEDED_V);
                SET_FLAG(flags, MTPBV_ALLOW_H);
            }
        }
    }

    stack_frame[6] = flags;
    stack_frame[7] = actor->pos.x;
    stack_frame[8] = actor->pos.y;
    stack_frame[9] = (actor->actor_vel_x << 8) | actor->actor_vel_y;

    if (!CHK_FLAG(flags, MTPBV_NEEDED_H | MTPBV_NEEDED_V)) {
        actor->actor_vel_x = 0;
        actor->actor_vel_y = 0;
        return TRUE;
    }

    ((SCRIPT_CTX *)THIS)->waitable = TRUE;
    return FALSE;
}
#endif
