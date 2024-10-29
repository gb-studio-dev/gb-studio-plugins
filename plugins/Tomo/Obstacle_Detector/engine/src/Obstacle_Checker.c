/*
 * Author: Tomo (@indiegdevstdio)
 * Given the tile position (X,Y), checks if there's any obstacles (collisions or actors) at that position
 */
#pragma bank 255

#include <gbdk/platform.h>
#include "vm.h"
#include "collision.h"
#include "actor.h"

BYTE get_collision_object_id_at_tile(UBYTE x, UBYTE y, UBYTE is_include_player) BANKED {
    // Get the collision ID at the specified tile position
    UBYTE collisionID = tile_at(x, y);
    if(collisionID != 0) {
        return collisionID;
    }
    // Map collision check passed, so now we will check if any actor's are there
    actor_t* actor = actor_at_tile(x, y, 1);
    // Ignore pinned actors and player it self
    if(!actor->pinned && actor != NULL) {
        // Can't walk through because there's an actor
        if(is_include_player && actor == &PLAYER) {
            // For player actor, return the actor ID as -128
            return -128;
        } else {
            // Return the actor ID (but with negative actor ID value so we can distinguish between collision ID and actor ID)
            return -(actor - actors);
        }
    }
    // No collision found
    return 0;
}

void obstacle_checker(SCRIPT_CTX * THIS) OLDCALL BANKED {
    // Variable index is passed (in ARG0) for result storage, so now we can assign the results back to this variable
    int16_t* results = VM_REF_TO_PTR(*(int16_t *)VM_REF_TO_PTR(FN_ARG0));

    // Passed in values from editor
    int16_t is_include_player = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
    int16_t y = *(int16_t*)VM_REF_TO_PTR(FN_ARG2);
    int16_t x = *(int16_t*)VM_REF_TO_PTR(FN_ARG3);
    
    // Get and store the collision object ID
    *results = get_collision_object_id_at_tile(x, y, is_include_player);
}
