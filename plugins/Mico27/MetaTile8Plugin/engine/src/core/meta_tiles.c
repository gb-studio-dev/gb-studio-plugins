#pragma bank 255

#include <string.h>

#include "meta_tiles.h"
#include "system.h"
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
			for (UBYTE j = 0; j < width; j++) {
				tile_buffer[j] = ReadBankedUBYTE(metatile_ptr + sram_map_data[METATILE_MAP_OFFSET(dest_x + j, current_y)], metatile_bank);
			}
			set_bkg_tiles(dest_x & 31, current_y & 31, width, 1, tile_buffer);
	
			#ifdef CGB
				if (_is_CGB) { 
					VBK_REG = 1;
					for (UBYTE j = 0; j < width; j++) {
						tile_buffer[j] = ReadBankedUBYTE(metatile_attr_ptr + sram_map_data[METATILE_MAP_OFFSET(dest_x + j, current_y)], metatile_attr_bank);
					}
					set_bkg_tiles(dest_x & 31, current_y & 31, width, 1, tile_buffer);
					VBK_REG = 0;
				}
			#endif
		}
	}
	
}

void replace_meta_tile(UBYTE x, UBYTE y, UBYTE tile_id, UBYTE commit) BANKED {	
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