#pragma bank 255

#include <gbdk/platform.h>
#include "system.h"
#include "vm.h"
#include "actor.h"
#include "linked_list.h"

void set_actor_active_index(SCRIPT_CTX * THIS) OLDCALL BANKED {
	UBYTE actor_idx = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
	UBYTE active_idx = *(uint8_t *)VM_REF_TO_PTR(FN_ARG1);
	actor_t * actor = actors + actor_idx;
	if (actor->active){	
		DL_REMOVE_ITEM(actors_active_head, actor);
		if (!actor->next) {
			actors_active_tail = actor->prev;
		}
		actor_t * target_actor = actors_active_head;
		if (target_actor){
			while (active_idx && target_actor->next) { 
				active_idx--; 
				target_actor = target_actor->next; 
			} 
			if (active_idx){//Is end
				target_actor->next = actor;
				actor->prev = target_actor;
				actor->next = 0;
				actors_active_tail = actor;
			} else {
				actor->next = target_actor; 
				if (target_actor->prev){//Is middle
					actor->prev = target_actor->prev; 
					target_actor->prev->next = actor; 
				} else {//Is start
					actor->prev = 0;
					actors_active_head = actor;
				}
				target_actor->prev = actor; 
			}
		} else {
			//should never happen since the player actor is always in the list but just in case.
			actors_active_tail = actors_active_head = actor;
		}
	}
}

void get_actor_active_index(SCRIPT_CTX * THIS) OLDCALL BANKED {
	UBYTE actor_idx = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
	actor_t * actor = actors + actor_idx;
	if (actor->active){	
		actor_t * target_actor = actors_active_head;
		UBYTE active_idx = 0;
		while (target_actor) {
			if (target_actor == actor)
			{ 
				break;
			} 
			active_idx++;
			target_actor = target_actor->next;
		}
		script_memory[*(int16_t*)VM_REF_TO_PTR(FN_ARG1)] = active_idx;
	}
}

void sort_actors_by_ypos(SCRIPT_CTX * THIS) OLDCALL BANKED {
	THIS;	
	if (!actors_active_head) return;
    actor_t* actor_a = NULL;	
    actor_t* actor_b = actors_active_head;
	actor_t* temp_actor_a;
	actor_t* temp_next;
    // Traverse the list to sort each element
    while (actor_b) {      
        // Store the next node to process
        temp_next = actor_b->next;
        // Insert `actor_b` into the actor_a part
        if (!actor_a || actor_a->pos.y >= actor_b->pos.y) {
            actor_b->next = actor_a;
            // If actor_a is not empty, set its `prev`
            if (actor_a){
				actor_a->prev = actor_b;
			}
            // Update actor_a to the new head
            actor_a = actor_b;
            actor_a->prev = NULL;
        } else {          
            // Pointer to traverse the actor_a part
            temp_actor_a = actor_a;
            // Find the correct position to insert
            while (temp_actor_a->next && temp_actor_a->next->pos.y <= actor_b->pos.y) {
                temp_actor_a = temp_actor_a->next;
            }
            // Insert `actor_b` after `temp_actor_a`
            actor_b->next = temp_actor_a->next;
            // Set `prev` if `actor_b` is not inserted 
            // at the end
            if (temp_actor_a->next) {
                temp_actor_a->next->prev = actor_b;
			}

            // Set `next` of `temp_actor_a` to `actor_b`
            temp_actor_a->next = actor_b;
            actor_b->prev = temp_actor_a;
        }
        // Move to the next node to be actor_a, if next is empty, set tail
		if (!temp_next){
			actors_active_tail = actor_b;
		}
        actor_b = temp_next;
    }
	//set the finalized actor_a to head
    actors_active_head = actor_a;
}