#pragma bank 255

#include <string.h>
#include <stdlib.h>
#include <gbdk/platform.h>
#include "system.h"
#include "vm.h"
#include "gbs_types.h"
#include "math.h"
#include "actor.h"
#include "data_manager.h"
#include "game_time.h"
#include "dynamic_actor.h"
#include "sincos.h"
#include "data/states_defines.h"
#include "collision.h"
#include "scroll.h"
#include "events.h"
#include "macro.h"
#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_TRIGGERS
#include "trigger.h"
#endif

extern behavior_def_t behavior_defs[DYNAMIC_ACTOR_MAX_BEHAVIORS + 1];

// vm.h only names the first eight stack arguments.
#ifndef FN_ARG8
#define FN_ARG8 -9
#endif

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
            dynamic_actor_event_actor_idx = actor->actor_index;
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
    UBYTE idx = actor->actor_index;
    UBYTE hit = trigger_at_intersection(&actor->bounds, &actor->pos);
    UBYTE prev = actor_last_trigger[idx];
    if (hit != prev) {
        if ((prev != NO_TRIGGER_COLLISON) &&
            (triggers[prev].script_flags & TRIGGER_HAS_LEAVE_SCRIPT)) {
            dynamic_actor_event_actor_idx = idx;
            script_execute(triggers[prev].script.bank, triggers[prev].script.ptr, 0, 1, 2);
        }
        if ((hit != NO_TRIGGER_COLLISON) &&
            (triggers[hit].script_flags & TRIGGER_HAS_ENTER_SCRIPT)) {
            dynamic_actor_event_actor_idx = idx;
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
#ifdef DYNAMIC_ACTOR_ENABLE_OVERRIDE_TILE_COLLISION
    // Pushed first by the event so FN_ARG0..7 keep their meaning. The event
    // pushes it whether or not the feature is compiled in - the argument count
    // has to match the VM_POP the event emits, so only the read is gated.
    def->override_tile_collision = *(uint8_t *)VM_REF_TO_PTR(FN_ARG8);
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_PARENT
    if (CHK_FLAG(def->flags, BHV_PLATFORM)) {
        dynamic_actor_mark_parenting_used();
    }
#endif
}

void vm_set_actor_behavior(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    actor_t * actor = actors + *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    actor->actor_behavior_id = (*(uint8_t *)VM_REF_TO_PTR(FN_ARG1) & 0x0F);
    UBYTE state = *(uint8_t *)VM_REF_TO_PTR(FN_ARG2);
    if (state != BHV_STATE_KEEP) {
        actor->actor_state = (state & 0x0F);
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
    actor->actor_state = (*(uint8_t *)VM_REF_TO_PTR(FN_ARG1) & 0x0F);
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
    // Slots the callback gates compiled out are ignored rather than written
    // past the end of the table (10 is the "any tile collision" alias).
#ifdef DYNAMIC_ACTOR_ENABLE_TILE_COLLISION_EVENTS
    if ((slot >= DYNAMIC_ACTOR_CALLBACK_SIZE) && (slot != 10)) return;
#else
    if (slot >= DYNAMIC_ACTOR_CALLBACK_SIZE) return;
#endif
    UBYTE *bank = VM_REF_TO_PTR(FN_ARG1);
    UBYTE **ptr = VM_REF_TO_PTR(FN_ARG0);
#ifdef DYNAMIC_ACTOR_ENABLE_TILE_COLLISION_EVENTS
    if (slot == 10){ //Any collision
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_TOP].script_bank = *bank;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_TOP].script_addr = *ptr;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_RIGHT].script_bank = *bank;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_RIGHT].script_addr = *ptr;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_BOTTOM].script_bank = *bank;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_BOTTOM].script_addr = *ptr;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_LEFT].script_bank = *bank;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_LEFT].script_addr = *ptr;
    } else
#endif
    {
        dynamic_actor_events[slot].script_bank = *bank;
        dynamic_actor_events[slot].script_addr = *ptr;
    }
}

void vm_clear_dynamic_actor_event_script(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE slot = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
#ifdef DYNAMIC_ACTOR_ENABLE_TILE_COLLISION_EVENTS
    if ((slot >= DYNAMIC_ACTOR_CALLBACK_SIZE) && (slot != 10)) return;
#else
    if (slot >= DYNAMIC_ACTOR_CALLBACK_SIZE) return;
#endif
#ifdef DYNAMIC_ACTOR_ENABLE_TILE_COLLISION_EVENTS
    if (slot == 10){ //Any collision
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_TOP].script_bank = 0;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_TOP].script_addr = NULL;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_RIGHT].script_bank = 0;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_RIGHT].script_addr = NULL;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_BOTTOM].script_bank = 0;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_BOTTOM].script_addr = NULL;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_LEFT].script_bank = 0;
        dynamic_actor_events[DYNAMIC_ACTOR_EVENT_TILE_COLLISION_LEFT].script_addr = NULL;
    } else
#endif
    {
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
        *A = (int16_t)actor->actor_parent->actor_index;
    }
}
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_VM_GET_ACTOR_COLLISION
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
                *A = (int16_t)actor->actor_index;
                return;
            }
        }
        actor = actor->prev;
    }
    *A = -1;
}
#endif

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

#ifdef DYNAMIC_ACTOR_ENABLE_VM_WAIT_FOR_IN_RANGE
#define WAIT_RNG_X       0x01u  // include the x axis in the distance test
#define WAIT_RNG_Y       0x02u  // include the y axis in the distance test
#define WAIT_RNG_OUTSIDE 0x04u  // finish when the target is out of range instead

// Wait until a target actor is inside (or outside) a rectangular range around
// another actor. Both ranges are half-extents in the same subpixel units as
// actor->pos, so the event multiplies its pixel fields by the subpixel scale.
// An axis that is not selected is simply not tested; with no axis selected the
// actor always counts as inside.
// Stack frame: [0] actor index, [1] target actor index, [2] WAIT_RNG_* flags,
//              [3] x range, [4] y range.
UBYTE vm_wait_for_actor_in_range(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    actor_t * actor = actors + (UBYTE)stack_frame[0];
    if (start) {
        CLR_FLAG(actor->flags, ACTOR_FLAG_INTERRUPT);
    } else {
        // Interrupt actor movement
        if (CHK_FLAG(actor->flags, ACTOR_FLAG_INTERRUPT)) {
            return TRUE;
        }
    }
    actor_t * target = actors + (UBYTE)stack_frame[1];
    UBYTE flags = (UBYTE)stack_frame[2];
    UBYTE inside = TRUE;

    if (flags & WAIT_RNG_X) {
        UWORD a = actor->pos.x, b = target->pos.x;
        if (((a > b) ? (a - b) : (b - a)) > stack_frame[3]) {
            inside = FALSE;
        }
    }
    if (inside && (flags & WAIT_RNG_Y)) {
        UWORD a = actor->pos.y, b = target->pos.y;
        if (((a > b) ? (a - b) : (b - a)) > stack_frame[4]) {
            inside = FALSE;
        }
    }

    if (flags & WAIT_RNG_OUTSIDE) {
        if (!inside) return TRUE;
    } else if (inside) {
        return TRUE;
    }

    ((SCRIPT_CTX *)THIS)->waitable = TRUE;
    return FALSE;
}
#endif

#ifdef DYNAMIC_ACTOR_ENABLE_VM_WAIT_FOR_STATE
// Wait until an actor's behavior state matches (or stops matching) a state.
// Stack frame: [0] actor index, [1] BHV_STATE_* value, [2] nonzero to invert.
UBYTE vm_wait_for_actor_state(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    actor_t * actor = actors + (UBYTE)stack_frame[0];
    if (start) {
        CLR_FLAG(actor->flags, ACTOR_FLAG_INTERRUPT);
    } else {
        // Interrupt actor movement
        if (CHK_FLAG(actor->flags, ACTOR_FLAG_INTERRUPT)) {
            return TRUE;
        }
    }
    // Masked like Set Actor State masks on the way in, so waiting for a state
    // that overflows the 4 bit field matches whatever setting it stored.
    UBYTE match = (actor->actor_state == ((UBYTE)stack_frame[1] & 0x0F));
    if (stack_frame[2]) {
        match = !match;
    }
    if (match) {
        return TRUE;
    }

    ((SCRIPT_CTX *)THIS)->waitable = TRUE;
    return FALSE;
}
#endif

// ---------------------------------------------------------------------------
// Extended actor tooling
//
// Generic helpers over the stock actors[] table: iterating actors inside an
// area, and reading / writing actor fields no stock event exposes.
// ---------------------------------------------------------------------------

#if defined(DYNAMIC_ACTOR_ENABLE_ACTOR_ITERATION) || defined(DYNAMIC_ACTOR_ENABLE_ACTOR_PROPERTIES)

// Write a 16-bit result into a script destination.
//   idx >= 0 : global variable slot (script_memory + idx)
//   idx <  0 : stack-local; the destination index was pushed as a constant
//              before the call arguments, so compensate for the `nargs` values
//              still sitting on the VM stack at native-call time.
static void dynamic_actor_write(SCRIPT_CTX * THIS, INT16 idx, INT16 value, UBYTE nargs) {
    INT16 * A;
    if (idx < 0) {
        A = (INT16 *)(THIS->stack_ptr + idx - nargs);
    } else {
        A = (INT16 *)(script_memory + idx);
    }
    *A = value;
}

#endif

#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_ITERATION

#define ACTOR_AREA_UNITS_PIXELS  0x01
#define ACTOR_AREA_ACTIVE_ONLY   0x02
#define ACTOR_AREA_SKIP_PLAYER   0x04
#define ACTOR_AREA_TEST_BOUNDS   0x08
#define ACTOR_AREA_RELATIVE_TO_SCROLL 0x10

// Scans actors[] starting at the cursor and reports the first actor inside the
// area. Writes 0xFF into the result slot when none is left and advances the
// cursor past the reported actor, so calling this in a loop walks every match
// exactly once.
//
// The state block is a 2 word script local: [0] = found actor (out),
// [1] = cursor (in/out).
//
// args (push order): stateSlot, x, y, width, height, options
void vm_actor_find_in_area(SCRIPT_CTX * THIS) OLDCALL BANKED {
    INT16 state_idx = *(INT16 *)VM_REF_TO_PTR(FN_ARG5);
    UWORD x         = *(UWORD *)VM_REF_TO_PTR(FN_ARG4);
    UWORD y         = *(UWORD *)VM_REF_TO_PTR(FN_ARG3);
    UWORD w         = *(UWORD *)VM_REF_TO_PTR(FN_ARG2);
    UWORD h         = *(UWORD *)VM_REF_TO_PTR(FN_ARG1);
    UBYTE options   = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);

    UWORD * state;
    if (state_idx < 0) {
        state = (UWORD *)(THIS->stack_ptr + state_idx - 6);
    } else {
        state = (UWORD *)(script_memory + state_idx);
    }

    UBYTE i = (UBYTE)(state[1]);
    UBYTE found = 0xFF;

    // Area is inclusive and expressed in subpixels (32 subpixels per pixel,
    // 256 per tile) to match actor_t.pos / actor_t.bounds.
    UWORD x1, y1, x2, y2;
    if (options & ACTOR_AREA_UNITS_PIXELS) {
        x1 = x << 5;
        y1 = y << 5;
        x2 = ((x + w) << 5) - 1;
        y2 = ((y + h) << 5) - 1;
    } else {
        x1 = x << 8;
        y1 = y << 8;
        x2 = ((x + w) << 8) - 1;
        y2 = ((y + h) << 8) - 1;
    }
    // A zero width/height area still matches its own origin cell.
    if (w == 0) x2 = x1;
    if (h == 0) y2 = y1;

    // Optionally anchor the area to the top-left of what is on screen this
    // frame. draw_scroll_x/y is the scroll the engine rendered with, the same
    // value actor.c uses for its on-screen activation checks, so an area given
    // here lines up with what the player can actually see.
    if (options & ACTOR_AREA_RELATIVE_TO_SCROLL) {
        UWORD offset_x = ((UWORD)draw_scroll_x) << 5;
        UWORD offset_y = ((UWORD)draw_scroll_y) << 5;
        x1 += offset_x;
        x2 += offset_x;
        y1 += offset_y;
        y2 += offset_y;
    }

    for (; i < actors_len; i++) {
        actor_t * actor = actors + i;
        if ((i == 0) && (options & ACTOR_AREA_SKIP_PLAYER)) continue;
        if ((options & ACTOR_AREA_ACTIVE_ONLY) && !CHK_FLAG(actor->flags, ACTOR_FLAG_ACTIVE)) continue;
        if (options & ACTOR_AREA_TEST_BOUNDS) {
            if ((UWORD)(actor->pos.x + actor->bounds.left)   > x2) continue;
            if ((UWORD)(actor->pos.x + actor->bounds.right)  < x1) continue;
            if ((UWORD)(actor->pos.y + actor->bounds.top)    > y2) continue;
            if ((UWORD)(actor->pos.y + actor->bounds.bottom) < y1) continue;
        } else {
            if ((actor->pos.x < x1) || (actor->pos.x > x2)) continue;
            if ((actor->pos.y < y1) || (actor->pos.y > y2)) continue;
        }
        found = i;
        i++;
        break;
    }

    state[0] = found;
    state[1] = i;
}

#endif // DYNAMIC_ACTOR_ENABLE_ACTOR_ITERATION

#ifdef DYNAMIC_ACTOR_ENABLE_ACTOR_PROPERTIES

#define ACTOR_PROP_FLAGS_RAW         0
#define ACTOR_PROP_ACTIVE            1
#define ACTOR_PROP_HIDDEN            2
#define ACTOR_PROP_PINNED            3
#define ACTOR_PROP_PERSISTENT        4
#define ACTOR_PROP_DISABLED          5
#define ACTOR_PROP_COLLISION_ENABLED 6
#define ACTOR_PROP_ANIM_NOLOOP       7
#define ACTOR_PROP_INTERRUPT         8
#define ACTOR_PROP_COLL_GROUP        9
#define ACTOR_PROP_COLL_FLAGS        10
#define ACTOR_PROP_COLL_RAW          11
#define ACTOR_PROP_DIRECTION         12
#define ACTOR_PROP_MOVE_SPEED        13
#define ACTOR_PROP_ANIMATION         14
#define ACTOR_PROP_ANIM_TICK         15
#define ACTOR_PROP_FRAME             16
#define ACTOR_PROP_FRAME_START       17
#define ACTOR_PROP_FRAME_END         18
#define ACTOR_PROP_BASE_TILE         19
#define ACTOR_PROP_RESERVE_TILES     20
#define ACTOR_PROP_BOUNDS_LEFT       21
#define ACTOR_PROP_BOUNDS_RIGHT      22
#define ACTOR_PROP_BOUNDS_TOP        23
#define ACTOR_PROP_BOUNDS_BOTTOM     24
#define ACTOR_PROP_HAS_SCRIPT        25
#define ACTOR_PROP_HAS_UPDATE_SCRIPT 26
#define ACTOR_PROP_UPDATE_RUNNING    27
#define ACTOR_PROP_UPDATE_HANDLE     28
#define ACTOR_PROP_HIT_HANDLE        29

static INT16 dynamic_actor_flag_value(actor_t * actor, UBYTE mask) {
    return CHK_FLAG(actor->flags, mask) ? 1 : 0;
}

static void dynamic_actor_flag_assign(actor_t * actor, UBYTE mask, INT16 value) {
    if (value) {
        SET_FLAG(actor->flags, mask);
    } else {
        CLR_FLAG(actor->flags, mask);
    }
}

// args (push order): dest, actorIndex, propertyId
void vm_actor_get_property(SCRIPT_CTX * THIS) OLDCALL BANKED {
    INT16 dest_idx = *(INT16 *)VM_REF_TO_PTR(FN_ARG2);
    UBYTE i        = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    UBYTE prop     = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    actor_t * actor;
    INT16 value = 0;

    if (i >= MAX_ACTORS) {
        dynamic_actor_write(THIS, dest_idx, 0, 3);
        return;
    }
    actor = actors + i;

    switch (prop) {
        case ACTOR_PROP_FLAGS_RAW:         value = actor->flags; break;
        case ACTOR_PROP_ACTIVE:            value = dynamic_actor_flag_value(actor, ACTOR_FLAG_ACTIVE); break;
        case ACTOR_PROP_HIDDEN:            value = dynamic_actor_flag_value(actor, ACTOR_FLAG_HIDDEN); break;
        case ACTOR_PROP_PINNED:            value = dynamic_actor_flag_value(actor, ACTOR_FLAG_PINNED); break;
        case ACTOR_PROP_PERSISTENT:        value = dynamic_actor_flag_value(actor, ACTOR_FLAG_PERSISTENT); break;
        case ACTOR_PROP_DISABLED:          value = dynamic_actor_flag_value(actor, ACTOR_FLAG_DISABLED); break;
        case ACTOR_PROP_COLLISION_ENABLED: value = dynamic_actor_flag_value(actor, ACTOR_FLAG_COLLISION); break;
        case ACTOR_PROP_ANIM_NOLOOP:       value = dynamic_actor_flag_value(actor, ACTOR_FLAG_ANIM_NOLOOP); break;
        case ACTOR_PROP_INTERRUPT:         value = dynamic_actor_flag_value(actor, ACTOR_FLAG_INTERRUPT); break;
        case ACTOR_PROP_COLL_GROUP:        value = actor->collision_group & COLLISION_GROUP_MASK; break;
        case ACTOR_PROP_COLL_FLAGS:        value = actor->collision_group & ~COLLISION_GROUP_MASK; break;
        case ACTOR_PROP_COLL_RAW:          value = actor->collision_group; break;
        case ACTOR_PROP_DIRECTION:         value = actor->dir; break;
        case ACTOR_PROP_MOVE_SPEED:        value = actor->move_speed; break;
        case ACTOR_PROP_ANIMATION:         value = actor->animation; break;
        case ACTOR_PROP_ANIM_TICK:         value = actor->anim_tick; break;
        case ACTOR_PROP_FRAME:             value = actor->frame; break;
        case ACTOR_PROP_FRAME_START:       value = actor->frame_start; break;
        case ACTOR_PROP_FRAME_END:         value = actor->frame_end; break;
        case ACTOR_PROP_BASE_TILE:         value = actor->base_tile; break;
        case ACTOR_PROP_RESERVE_TILES:     value = actor->reserve_tiles; break;
        case ACTOR_PROP_BOUNDS_LEFT:       value = actor->bounds.left; break;
        case ACTOR_PROP_BOUNDS_RIGHT:      value = actor->bounds.right; break;
        case ACTOR_PROP_BOUNDS_TOP:        value = actor->bounds.top; break;
        case ACTOR_PROP_BOUNDS_BOTTOM:     value = actor->bounds.bottom; break;
        case ACTOR_PROP_HAS_SCRIPT:        value = (actor->script.bank) ? 1 : 0; break;
        case ACTOR_PROP_HAS_UPDATE_SCRIPT: value = (actor->script_update.bank) ? 1 : 0; break;
        case ACTOR_PROP_UPDATE_RUNNING:    value = (actor->hscript_update & SCRIPT_TERMINATED) ? 0 : 1; break;
        case ACTOR_PROP_UPDATE_HANDLE:     value = actor->hscript_update; break;
        case ACTOR_PROP_HIT_HANDLE:        value = actor->hscript_hit; break;
    }

    dynamic_actor_write(THIS, dest_idx, value, 3);
}

// args (push order): actorIndex, propertyId, value
void vm_actor_set_property(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE i    = *(UBYTE *)VM_REF_TO_PTR(FN_ARG2);
    UBYTE prop = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    INT16 v    = *(INT16 *)VM_REF_TO_PTR(FN_ARG0);
    actor_t * actor;
    (void)THIS;

    if (i >= MAX_ACTORS) return;
    actor = actors + i;

    switch (prop) {
        // ACTOR_FLAG_ACTIVE is owned by the active/inactive linked lists and is
        // preserved here; use the stock Activate/Deactivate Actor events instead.
        case ACTOR_PROP_FLAGS_RAW:
            actor->flags = (UBYTE)((v & ~ACTOR_FLAG_ACTIVE) | (actor->flags & ACTOR_FLAG_ACTIVE));
            break;
        case ACTOR_PROP_HIDDEN:            dynamic_actor_flag_assign(actor, ACTOR_FLAG_HIDDEN, v); break;
        case ACTOR_PROP_PINNED:            dynamic_actor_flag_assign(actor, ACTOR_FLAG_PINNED, v); break;
        case ACTOR_PROP_PERSISTENT:        dynamic_actor_flag_assign(actor, ACTOR_FLAG_PERSISTENT, v); break;
        case ACTOR_PROP_DISABLED:          dynamic_actor_flag_assign(actor, ACTOR_FLAG_DISABLED, v); break;
        case ACTOR_PROP_COLLISION_ENABLED: dynamic_actor_flag_assign(actor, ACTOR_FLAG_COLLISION, v); break;
        case ACTOR_PROP_ANIM_NOLOOP:       dynamic_actor_flag_assign(actor, ACTOR_FLAG_ANIM_NOLOOP, v); break;
        case ACTOR_PROP_INTERRUPT:         dynamic_actor_flag_assign(actor, ACTOR_FLAG_INTERRUPT, v); break;
        case ACTOR_PROP_COLL_GROUP:
            actor->collision_group = (UBYTE)((actor->collision_group & ~COLLISION_GROUP_MASK) | (v & COLLISION_GROUP_MASK));
            break;
        case ACTOR_PROP_COLL_FLAGS:
            actor->collision_group = (UBYTE)((actor->collision_group & COLLISION_GROUP_MASK) | (v & ~COLLISION_GROUP_MASK));
            break;
        case ACTOR_PROP_COLL_RAW:          actor->collision_group = (UBYTE)v; break;
        case ACTOR_PROP_DIRECTION:         actor->dir = (direction_e)v; break;
        case ACTOR_PROP_MOVE_SPEED:        actor->move_speed = (UBYTE)v; break;
        case ACTOR_PROP_ANIMATION:         actor_set_anim(actor, (UBYTE)v); break;
        case ACTOR_PROP_ANIM_TICK:         actor->anim_tick = (UBYTE)v; break;
        case ACTOR_PROP_FRAME:             actor->frame = (UBYTE)v; break;
        case ACTOR_PROP_FRAME_START:       actor->frame_start = (UBYTE)v; break;
        case ACTOR_PROP_FRAME_END:         actor->frame_end = (UBYTE)v; break;
        case ACTOR_PROP_BASE_TILE:         actor->base_tile = (UBYTE)v; break;
        case ACTOR_PROP_RESERVE_TILES:     actor->reserve_tiles = (UBYTE)v; break;
        case ACTOR_PROP_BOUNDS_LEFT:       actor->bounds.left = v; break;
        case ACTOR_PROP_BOUNDS_RIGHT:      actor->bounds.right = v; break;
        case ACTOR_PROP_BOUNDS_TOP:        actor->bounds.top = v; break;
        case ACTOR_PROP_BOUNDS_BOTTOM:     actor->bounds.bottom = v; break;
    }
}

#endif // DYNAMIC_ACTOR_ENABLE_ACTOR_PROPERTIES

#ifdef DYNAMIC_ACTOR_ENABLE_TRIGGER_SCRIPT

#define ACTOR_TRIGGER_INTERACT 0
#define ACTOR_TRIGGER_HIT      1
#define ACTOR_TRIGGER_UPDATE   2

// The stock compiler emits a single actor script that branches on thread local
// 0: 0 runs "On Interact", 2 / 4 / 8 run the "On Hit" script of collision
// group 1 / 2 / 3.
//
// args (push order): actorIndex, which, collisionGroup
void vm_actor_trigger_script(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE i     = *(UBYTE *)VM_REF_TO_PTR(FN_ARG2);
    UBYTE which = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    UBYTE group = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    actor_t * actor;
    (void)THIS;

    if (i >= MAX_ACTORS) return;
    actor = actors + i;

    switch (which) {
        case ACTOR_TRIGGER_INTERACT:
            if (actor->script.bank) {
                script_execute(actor->script.bank, actor->script.ptr, 0, 1, 0);
            }
            break;
        case ACTOR_TRIGGER_HIT:
            // Reuses the stock hit handle so the same actor cannot stack up
            // several concurrent hit scripts, exactly like projectile hits.
            if ((actor->script.bank) && (actor->hscript_hit & SCRIPT_TERMINATED)) {
                script_execute(actor->script.bank, actor->script.ptr, &(actor->hscript_hit), 1, (UWORD)group);
            }
            break;
        case ACTOR_TRIGGER_UPDATE:
            if ((actor->script_update.bank) && (actor->hscript_update & SCRIPT_TERMINATED)) {
                script_execute(actor->script_update.bank, actor->script_update.ptr, &(actor->hscript_update), 0);
            }
            break;
    }
}

#endif // DYNAMIC_ACTOR_ENABLE_TRIGGER_SCRIPT
