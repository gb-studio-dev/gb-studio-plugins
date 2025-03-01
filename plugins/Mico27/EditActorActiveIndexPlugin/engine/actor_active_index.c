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
	if (!actor->active){
		DL_REMOVE_ITEM(actors_inactive_head, actor);
		actor->active = TRUE;
	} else {		
		DL_REMOVE_ITEM(actors_active_head, actor);
		if (!actor->next) {
			actors_active_tail = actor->prev;
		}
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