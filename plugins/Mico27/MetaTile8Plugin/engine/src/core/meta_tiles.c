#pragma bank 255

#include <string.h>

#include "meta_tiles.h"
#include "system.h"
#include "events.h"
#include "vm.h"
#include "bankdata.h"
#include "scroll.h"
#include "gbs_types.h"
#include "actor.h"
#include "data/game_globals.h"
#include "data_manager.h"
#include "data/states_defines.h"



uint8_t __at(SRAM_COLLISION_DATA_PTR) sram_collision_data[256]; //sram_map_data Address 0xA500 - 0x0100(256)
uint8_t __at(SRAM_MAP_DATA_PTR) sram_map_data[MAX_MAP_DATA_SIZE]; //0xA000 + (0x2000 (8k SRAM max size) - 0x1B00 (MAX_MAP_DATA_SIZE))

UBYTE metatile_bank;
unsigned char* metatile_ptr;

UBYTE metatile_attr_bank;
unsigned char* metatile_attr_ptr;

UBYTE image_tile_width_bit;

script_event_t metatile_events[METATILE_EVENTS_SIZE];

UBYTE prev_metatile_overlap_iteration;
UBYTE metatile_overlap_iteration;
UBYTE previous_top_tile;
UBYTE previous_left_tile;
UBYTE previous_bottom_tile;
UBYTE previous_right_tile;
UBYTE current_left_tile; 
UBYTE current_top_tile;	
UBYTE current_right_tile; 
UBYTE current_bottom_tile;
UBYTE overlap_metatile_id;
UBYTE overlap_metatile_x;
UBYTE overlap_metatile_y;

UBYTE collided_metatile_id;
UBYTE collided_metatile_x;
UBYTE collided_metatile_y;
UBYTE collided_metatile_dir;
UBYTE collided_metatile_source;
	
UBYTE metatile_collisionx_cache[4];
UBYTE metatile_collisiony_cache[4];

void vm_load_meta_tiles(SCRIPT_CTX * THIS) OLDCALL BANKED {
	scroll_reset();
	uint8_t scene_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
	const scene_t * scene_ptr = *(scene_t **) VM_REF_TO_PTR(FN_ARG1);	
	scene_t scn;
    MemcpyBanked(&scn, scene_ptr, sizeof(scn), scene_bank);
	background_t bkg;
    MemcpyBanked(&bkg, scn.background.ptr, sizeof(bkg), scn.background.bank);
    metatile_bank = bkg.tilemap.bank;
    metatile_ptr = bkg.tilemap.ptr;
    metatile_attr_bank = bkg.cgb_tilemap_attr.bank;
    metatile_attr_ptr = bkg.cgb_tilemap_attr.ptr;
	
	MemcpyBanked(&sram_collision_data, scn.collisions.ptr, 256, scn.collisions.bank);
	
	image_tile_width_bit = 1;
	UBYTE width = (image_tile_width - 1);
	while(width >>= 1){
		image_tile_width_bit++;
	}
	
	for (UBYTE y = 0; y < image_tile_height; y++) {
		MemcpyBanked(sram_map_data + METATILE_MAP_OFFSET(0, y), image_ptr + (UWORD)(y * image_tile_width), image_tile_width, image_bank);
	}
	
	
	scroll_update();
}

void vm_replace_meta_tile(SCRIPT_CTX * THIS) OLDCALL BANKED {
	uint8_t x = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
	uint8_t y = *(uint8_t *) VM_REF_TO_PTR(FN_ARG1);
	uint8_t tile_id = *(uint8_t *) VM_REF_TO_PTR(FN_ARG2);	
	uint8_t commit = *(uint8_t *) VM_REF_TO_PTR(FN_ARG3);	
	replace_meta_tile(x, y, tile_id, commit);	
}

void vm_reset_meta_tile(SCRIPT_CTX * THIS) OLDCALL BANKED {
	uint8_t x = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
	uint8_t y = *(uint8_t *) VM_REF_TO_PTR(FN_ARG1);
	uint8_t commit = *(uint8_t *) VM_REF_TO_PTR(FN_ARG2);	
	reset_meta_tile(x, y, commit);	
}

void vm_get_sram_tile_id_at_pos(SCRIPT_CTX * THIS) OLDCALL BANKED {
	uint8_t x = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
	uint8_t y = *(uint8_t *) VM_REF_TO_PTR(FN_ARG1);
	script_memory[*(int16_t*)VM_REF_TO_PTR(FN_ARG2)] = sram_map_data[METATILE_MAP_OFFSET(x, y)];	
}

void vm_replace_collision(SCRIPT_CTX * THIS) OLDCALL BANKED {
	uint8_t tile_id = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);	
	uint8_t collision = *(uint8_t *) VM_REF_TO_PTR(FN_ARG1);	
	sram_collision_data[tile_id] = collision;
}

void vm_get_collision_at_pos(SCRIPT_CTX * THIS) OLDCALL BANKED {
	uint8_t x = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
	uint8_t y = *(uint8_t *) VM_REF_TO_PTR(FN_ARG1);
	script_memory[*(int16_t*)VM_REF_TO_PTR(FN_ARG2)] = sram_collision_data[sram_map_data[METATILE_MAP_OFFSET(x, y)]];
}

void vm_submap_metatiles(SCRIPT_CTX * THIS) OLDCALL BANKED {	
	int16_t source_pos = *(int16_t*)VM_REF_TO_PTR(FN_ARG0);
	int16_t dest_pos = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
	int16_t wh = *(int16_t*)VM_REF_TO_PTR(FN_ARG2);	
	uint8_t commit = *(int8_t*)VM_REF_TO_PTR(FN_ARG3);	
	uint8_t scene_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG4);
	const scene_t * scene_ptr = *(scene_t **) VM_REF_TO_PTR(FN_ARG5);	

	uint8_t source_x = source_pos & 0xFF;
	uint8_t source_y = (source_pos >> 8) & 0xFF;
	uint8_t dest_x = dest_pos & 0xFF;
	uint8_t dest_y = (dest_pos >> 8) & 0xFF;
	uint8_t width = (wh & 0xFF) & 31;
	uint8_t height = ((wh >> 8) & 0xFF) & 31;
		
	scene_t scn;
    MemcpyBanked(&scn, scene_ptr, sizeof(scn), scene_bank);
	background_t bkg;
    MemcpyBanked(&bkg, scn.background.ptr, sizeof(bkg), scn.background.bank);
    unsigned char* tilemap_ptr = bkg.tilemap.ptr;
	unsigned char* tilemap_attr_ptr = bkg.cgb_tilemap_attr.ptr;		
	
	UBYTE buffer_size = sizeof(UBYTE) * width;
	for (uint8_t i = 0; i < height; i++){		
		UBYTE current_y = (dest_y + i);			
		MemcpyBanked(sram_map_data + METATILE_MAP_OFFSET(dest_x, current_y), tilemap_ptr + (UWORD)(((source_y + i) * bkg.width) + source_x), width, bkg.tilemap.bank);
		if (commit){
			bkg_address_offset = ((UWORD)get_bkg_xy_addr(dest_x & 31, current_y & 31)) - 0x9800;
			load_metatile_row(metatile_ptr, dest_x, current_y, width, metatile_bank);	
			#ifdef CGB
				if (_is_CGB) { 
					VBK_REG = 1;					
					bkg_address_offset = ((UWORD)get_bkg_xy_addr(dest_x & 31, current_y & 31)) - 0x9800;
					load_metatile_row(metatile_attr_ptr, dest_x, current_y, width, metatile_attr_bank);
					VBK_REG = 0;
				}
			#endif
		}
	}
	
}

void vm_assign_metatile_script(SCRIPT_CTX * THIS) OLDCALL BANKED {
    uint8_t slot = *(int8_t*)VM_REF_TO_PTR(FN_ARG2);
    UBYTE *bank = VM_REF_TO_PTR(FN_ARG1);
    UBYTE **ptr = VM_REF_TO_PTR(FN_ARG0);
    if (slot == METATILE_COLLISION_ANY_EVENT){
        metatile_events[METATILE_COLLISION_DOWN_EVENT].script_bank = *bank;
        metatile_events[METATILE_COLLISION_DOWN_EVENT].script_addr = *ptr;
        metatile_events[METATILE_COLLISION_RIGHT_EVENT].script_bank = *bank;
        metatile_events[METATILE_COLLISION_RIGHT_EVENT].script_addr = *ptr;
        metatile_events[METATILE_COLLISION_UP_EVENT].script_bank = *bank;
        metatile_events[METATILE_COLLISION_UP_EVENT].script_addr = *ptr;
        metatile_events[METATILE_COLLISION_LEFT_EVENT].script_bank = *bank;
        metatile_events[METATILE_COLLISION_LEFT_EVENT].script_addr = *ptr;
    } else {
        metatile_events[slot].script_bank = *bank;
        metatile_events[slot].script_addr = *ptr;
    }
}

void vm_clear_metatile_script(SCRIPT_CTX * THIS) OLDCALL BANKED {
    uint8_t slot = *(int8_t*)VM_REF_TO_PTR(FN_ARG0);    
    if (slot == METATILE_COLLISION_ANY_EVENT){
        metatile_events[METATILE_COLLISION_DOWN_EVENT].script_bank = 0;
        metatile_events[METATILE_COLLISION_DOWN_EVENT].script_addr = NULL;
        metatile_events[METATILE_COLLISION_RIGHT_EVENT].script_bank = 0;
        metatile_events[METATILE_COLLISION_RIGHT_EVENT].script_addr = NULL;
        metatile_events[METATILE_COLLISION_UP_EVENT].script_bank = 0;
        metatile_events[METATILE_COLLISION_UP_EVENT].script_addr = NULL;
        metatile_events[METATILE_COLLISION_LEFT_EVENT].script_bank = 0;
        metatile_events[METATILE_COLLISION_LEFT_EVENT].script_addr = NULL;
    } else {
        metatile_events[slot].script_bank = 0;
        metatile_events[slot].script_addr = NULL;
    }
}

static void impl_replace_meta_tile(UBYTE x, UBYTE y, UBYTE tile_id, UBYTE commit) {	
	sram_map_data[METATILE_MAP_OFFSET(x, y)] = tile_id;	
	if (commit){
	#ifdef CGB
			if (_is_CGB) {
				VBK_REG = 1;
				set_bkg_tile_xy(x, y, ReadBankedUBYTE(metatile_attr_ptr + tile_id, metatile_attr_bank));
				VBK_REG = 0;
			}
	#endif
		set_bkg_tile_xy(x, y, ReadBankedUBYTE(metatile_ptr + tile_id, metatile_bank));
	}
}


void replace_meta_tile(UBYTE x, UBYTE y, UBYTE tile_id, UBYTE commit) BANKED {	
	impl_replace_meta_tile(x, y, tile_id, commit);
}

void reset_meta_tile(UBYTE x, UBYTE y, UBYTE commit) BANKED {	
	impl_replace_meta_tile(x, y, ReadBankedUBYTE(image_ptr + (UWORD)((y * image_tile_width) + x), image_bank), commit);	
}

static UBYTE on_metatile_enter(UBYTE tile_x, UBYTE tile_y) {
	UBYTE tile_id = sram_map_data[METATILE_MAP_OFFSET(tile_x, tile_y)];
	if (tile_id >= MIN_OVERLAP_METATILE){
		overlap_metatile_id = tile_id;
		overlap_metatile_x = tile_x;
		overlap_metatile_y = tile_y;
		script_execute(metatile_events[METATILE_ENTER_EVENT].script_bank, metatile_events[METATILE_ENTER_EVENT].script_addr, 0, 0);
		return TRUE;
	}
	return FALSE;
}

UBYTE metatile_overlap_at_intersection(rect16_t *bb, upoint16_t *offset) BANKED {
	if (!metatile_bank || !metatile_events[METATILE_ENTER_EVENT].script_addr){
		return FALSE;
	}
	if (!prev_metatile_overlap_iteration){
		current_left_tile = SUBPX_TO_TILE(offset->x + bb->left); 
		current_top_tile = SUBPX_TO_TILE(offset->y + bb->top);	
		current_right_tile = SUBPX_TO_TILE(offset->x + bb->right); 
		current_bottom_tile = SUBPX_TO_TILE(offset->y + bb->bottom);
	}
	UBYTE tmp_tile = 0;
	UBYTE left_side_checked = 0;
	UBYTE right_side_checked = 0;
	metatile_overlap_iteration = 0;
	//check left
	if (current_left_tile < previous_left_tile){
		tmp_tile = current_top_tile;
		while (tmp_tile <= current_bottom_tile){
			metatile_overlap_iteration++;
			if (metatile_overlap_iteration > prev_metatile_overlap_iteration){
				if (on_metatile_enter(current_left_tile, tmp_tile)){
					prev_metatile_overlap_iteration = metatile_overlap_iteration;
					return TRUE;
				}
			}
			tmp_tile++;
		}
		left_side_checked = 1;
	}
	//check right	
	if (current_left_tile != current_right_tile && (current_right_tile > previous_right_tile)){
		tmp_tile = current_top_tile;
		while (tmp_tile <= current_bottom_tile){
			metatile_overlap_iteration++;
			if (metatile_overlap_iteration > prev_metatile_overlap_iteration){
				if (on_metatile_enter(current_right_tile, tmp_tile)){
					prev_metatile_overlap_iteration = metatile_overlap_iteration;
					return TRUE;
				}
			}
			tmp_tile++;
		}
		right_side_checked = 1;
	}
	
	//Check top
	if (current_top_tile < previous_top_tile){
		tmp_tile = current_left_tile + left_side_checked;
		while (tmp_tile <= (current_right_tile - right_side_checked)){
			metatile_overlap_iteration++;
			if (metatile_overlap_iteration > prev_metatile_overlap_iteration){
				if (on_metatile_enter(tmp_tile, current_top_tile)){
					prev_metatile_overlap_iteration = metatile_overlap_iteration;
					return TRUE;
				}		
			}			
			tmp_tile++;
		}
	}	
	
	//Check bottom
	if (current_top_tile != current_bottom_tile && (current_bottom_tile > previous_bottom_tile)){
		tmp_tile = current_left_tile + left_side_checked;
		while (tmp_tile <= (current_right_tile - right_side_checked)){
			metatile_overlap_iteration++;
			if (metatile_overlap_iteration > prev_metatile_overlap_iteration){
				if (on_metatile_enter(tmp_tile, current_bottom_tile)){
					prev_metatile_overlap_iteration = metatile_overlap_iteration;
					return TRUE;
				}
			}			
			tmp_tile++;
		}
	}
	
	previous_left_tile = current_left_tile;
	previous_top_tile = current_top_tile;
	previous_right_tile = current_right_tile;
	previous_bottom_tile = current_bottom_tile;
	prev_metatile_overlap_iteration = 0;
	return FALSE;
}

static script_event_t* metatile_event;
void on_player_metatile_collision(UBYTE tile_x, UBYTE tile_y, UBYTE direction) BANKED {	
    if (!metatile_bank){ 
        return; 
    }
	if (metatile_collisionx_cache[direction] != tile_x || metatile_collisiony_cache[direction] != tile_y) {
		metatile_collisionx_cache[direction] = tile_x;
		metatile_collisiony_cache[direction] = tile_y;
		switch(direction){
			case DIR_DOWN:
                metatile_event = metatile_events + METATILE_COLLISION_DOWN_EVENT;
                if (metatile_event->script_addr){
                    UBYTE tile_id = sram_map_data[METATILE_MAP_OFFSET(tile_x, tile_y)];
                    if (tile_id >= MIN_DOWN_COLLISION_METATILE){
                        collided_metatile_id = tile_id;
                        collided_metatile_x = tile_x;
                        collided_metatile_y = tile_y;
                        collided_metatile_dir = DIR_DOWN;
                        collided_metatile_source = 0;                      
                        script_execute(metatile_event->script_bank, metatile_event->script_addr, 0, 0);
                    }
                }                
				break;
			case DIR_RIGHT:
				metatile_event = metatile_events + METATILE_COLLISION_RIGHT_EVENT;
                if (metatile_event->script_addr){
                    UBYTE tile_id = sram_map_data[METATILE_MAP_OFFSET(tile_x, tile_y)];
                    if (tile_id >= MIN_RIGHT_COLLISION_METATILE){
                        collided_metatile_id = tile_id;
                        collided_metatile_x = tile_x;
                        collided_metatile_y = tile_y;
                        collided_metatile_dir = DIR_RIGHT;
                        collided_metatile_source = 0;                        
                        script_execute(metatile_event->script_bank, metatile_event->script_addr, 0, 0);
                    }
                }                
				break;
			case DIR_UP:
				metatile_event = metatile_events + METATILE_COLLISION_UP_EVENT;
                if (metatile_event->script_addr){
                    UBYTE tile_id = sram_map_data[METATILE_MAP_OFFSET(tile_x, tile_y)];
                    if (tile_id >= MIN_UP_COLLISION_METATILE){
                        collided_metatile_id = tile_id;
                        collided_metatile_x = tile_x;
                        collided_metatile_y = tile_y; 
                        collided_metatile_dir = DIR_UP;
                        collided_metatile_source = 0;                        
                        script_execute(metatile_event->script_bank, metatile_event->script_addr, 0, 0);
                    }
                }                
				break;
			case DIR_LEFT:
				metatile_event = metatile_events + METATILE_COLLISION_LEFT_EVENT;
                if (metatile_event->script_addr){
                    UBYTE tile_id = sram_map_data[METATILE_MAP_OFFSET(tile_x, tile_y)];
                    if (tile_id >= MIN_LEFT_COLLISION_METATILE){
                        collided_metatile_id = tile_id;
                        collided_metatile_x = tile_x;
                        collided_metatile_y = tile_y;  
                        collided_metatile_dir = DIR_LEFT;
                        collided_metatile_source = 0;                        
                        script_execute(metatile_event->script_bank, metatile_event->script_addr, 0, 0);
                    }
                }                
				break;
		}
	}
}

void reset_collision_cache(UBYTE direction) BANKED {	
	metatile_collisionx_cache[direction] = 0xFF;
	metatile_collisiony_cache[direction] = 0xFF;	
}
