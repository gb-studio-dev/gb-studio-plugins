/*
 * Author: Tomo (@indiegdevstdio)
 * Checks for any obstacle (collisions or other actors) found relative to the specified actor's position and facing direction,
 * given the offset tile amount to walk relatively towards the destination
 */
#pragma bank 255

#include <gbdk/platform.h>
#include "vm.h"
#include "collision.h"
#include "actor.h"
#include "math.h"
#include "data_manager.h"

actor_t *actor_at_tile_ex(UBYTE tx, UBYTE ty, UBYTE inc_noclip, actor_t* this_actor) BANKED {
    for (actor_t *actor = actors_active_head; (actor); actor = actor->next) {
        if ((!inc_noclip && !actor->collision_enabled))
            continue;

        UBYTE a_tx = (actor->pos.x >> 7), a_ty = (actor->pos.y >> 7);
        if ((ty == a_ty) && (tx == a_tx || tx == a_tx + 1 || tx == a_tx - 1)) {
            // Ignore self
            if(actor == this_actor) continue;
            return actor;
        }
    }
    return NULL;
}

BYTE get_collision_object_id_at_tile_ex(UBYTE x, UBYTE y, actor_t* this_actor) BANKED {
    // Get the collision ID at the specified tile position
    UBYTE collisionID = tile_at(x, y);
    if(collisionID != 0) {
        return collisionID;
    }
    // Map collision check passed, so now we will check if any actor's are there
    actor_t* actor = actor_at_tile_ex(x, y, 1, this_actor);
    // Ignore pinned actors and actor it self
    if(!actor->pinned && actor != NULL) {
        // Can't walk through because there's an actor
        // Return the actor ID (but with negative actor ID value so we can distinguish between collision ID and actor ID)
        if(actor == &PLAYER) {
            // Return -128 if it was player
            return -128;
        } else {
            return -(actor - actors);
        }
    }
    // No collision found
    return 0;
}

void ActorWalkabilityChecker(SCRIPT_CTX * THIS) OLDCALL BANKED {
    // Variable index is passed (in ARG0) for result storage, so now we can assign the results back to this variable
    int16_t* results = VM_REF_TO_PTR(*(int16_t *)VM_REF_TO_PTR(FN_ARG0));
    
    // Passed in values from editor
    int16_t isPlatformer = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
    int16_t offset = *(int16_t*)VM_REF_TO_PTR(FN_ARG2);
    int16_t actorID = *(int16_t*)VM_REF_TO_PTR(FN_ARG3);
    actor_t* actor = actors + (UBYTE)(actorID);

    // Actor struct has positions in pixel units, so convert and store them to tile positions in the following vars
    UBYTE actor_tile_x;
    UBYTE actor_tile_y;

    // For platformer scene, it seems like the actor's position returns twice the amount compared to Topdown/Adventure
    if(isPlatformer) {
        actor_tile_x = actor->pos.x >> 7 >> 1;
        actor_tile_y = actor->pos.y >> 7 >> 1;
    } else {
        actor_tile_x = actor->pos.x >> 7; //actor->pos.x / (8 * 16);
        actor_tile_y = actor->pos.y >> 7; // actor->pos.y / (8 * 16);
    }
    
    BYTE collisionResults = 0;

    switch(actor->dir) {
        case DIR_LEFT:
            for(UBYTE i = 1; i < offset + 1; i++) {
                collisionResults = get_collision_object_id_at_tile_ex(actor_tile_x - i, actor_tile_y, actor);
                // Actor collision detected
                if(collisionResults != 0) {
                    *results = collisionResults;
                    return;
                }
            }
            break;
        case DIR_RIGHT:
            for(UBYTE i = 1; i < offset + 1; i++) {
                collisionResults = get_collision_object_id_at_tile_ex(actor_tile_x + i, actor_tile_y, actor);
                // Actor collision detected
                if(collisionResults != 0) {
                    *results = collisionResults;
                    return;
                }
            }
            break;
        case DIR_UP:
            for(UBYTE i = 1; i < offset + 1; i++) {
                collisionResults = get_collision_object_id_at_tile_ex(actor_tile_x, actor_tile_y - i, actor);
                // Actor collision detected
                if(collisionResults != 0) {
                    *results = collisionResults;
                    return;
                }
            }
            break;
        case DIR_DOWN:
            for(UBYTE i = 1; i < offset + 1; i++) {
                collisionResults = get_collision_object_id_at_tile_ex(actor_tile_x, actor_tile_y + i, actor);
                // Actor collision detected
                if(collisionResults != 0) {
                    *results = collisionResults;
                    return;
                }
            }
            break;
    }

    // Can walk through
    *results = 0;
}
