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

uint8_t __at(0xBB80) sram_collision_data[1024];
uint8_t __at(0xBF80) sram_map_data[MAX_MAP_DATA_SIZE];

UBYTE metatile_bank;
unsigned char* metatile_ptr;

UBYTE metatile_attr_bank;
unsigned char* metatile_attr_ptr;

UBYTE metatile_collision_bank;
unsigned char* metatile_collision_ptr;

void vm_load_meta_tiles(SCRIPT_CTX * THIS) OLDCALL BANKED {
	scroll_reset();
	uint8_t scene_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
	const scene_t * scene_ptr = *(scene_t **) VM_REF_TO_PTR(FN_ARG1);	
	scene_t scn;
    MemcpyBanked(&scn, scene_ptr, sizeof(scn), scene_bank);
	metatile_collision_bank  = scn.collisions.bank;
    metatile_collision_ptr   = scn.collisions.ptr;
	background_t bkg;
    MemcpyBanked(&bkg, scn.background.ptr, sizeof(bkg), scn.background.bank);
    metatile_bank = bkg.tilemap.bank;
    metatile_ptr = bkg.tilemap.ptr;
    metatile_attr_bank = bkg.cgb_tilemap_attr.bank;
    metatile_attr_ptr = bkg.cgb_tilemap_attr.ptr;
	
	MemcpyBanked(&sram_collision_data, metatile_collision_ptr, 1024, metatile_collision_bank);
	
	//memset(sram_map_data, 0, sizeof(sram_map_data));
	UBYTE half_width = (image_tile_width >> 1);
	UBYTE half_height = (image_tile_height >> 1);
	for (UBYTE y = 0; y < half_height; y++) {
		MemcpyBanked(sram_map_data + METATILE_MAP_OFFSET(0, y << 1), image_ptr + (UWORD)(y * half_width), half_width, image_bank);
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
		MemcpyBanked(sram_map_data + METATILE_MAP_OFFSET(dest_x, current_y), tilemap_ptr + (UWORD)((((source_y + i) >> 1) * (bkg.width >> 1)) + (source_x >> 1)), width >> 1, bkg.tilemap.bank);
		if (commit){
			for (UBYTE j = 0; j < width; j++) {
				tile_buffer[j] = ReadBankedUBYTE(metatile_ptr + TILE_MAP_OFFSET(sram_map_data[METATILE_MAP_OFFSET(dest_x + j, current_y)], dest_x + j, current_y), metatile_bank);
			}
			set_bkg_tiles((dest_x + bkg_offset_x) & 31, (current_y + bkg_offset_y) & 31, width, 1, tile_buffer);
	
			#ifdef CGB
				if (_is_CGB) { 
					VBK_REG = 1;
					for (UBYTE j = 0; j < width; j++) {
						tile_buffer[j] = ReadBankedUBYTE(metatile_attr_ptr + TILE_MAP_OFFSET(sram_map_data[METATILE_MAP_OFFSET(dest_x + j, current_y)], dest_x + j, current_y), metatile_attr_bank);
					}
					set_bkg_tiles((dest_x + bkg_offset_x) & 31, (current_y + bkg_offset_y) & 31, width, 1, tile_buffer);
					VBK_REG = 0;
				}
			#endif
		}
	}
	
}

void replace_meta_tile(UBYTE x, UBYTE y, UBYTE tile_id, UBYTE commit) BANKED {
	x -= x & 1;
	y -= y & 1;
	sram_map_data[METATILE_MAP_OFFSET(x, y)] = tile_id;	
	if (commit){	
	#ifdef CGB
			if (_is_CGB) {
				VBK_REG = 1;
				tile_buffer[0] = ReadBankedUBYTE(metatile_attr_ptr + TILE_MAP_OFFSET(tile_id, x, y), metatile_attr_bank);
				tile_buffer[1] = ReadBankedUBYTE(metatile_attr_ptr + TILE_MAP_OFFSET(tile_id, x + 1, y), metatile_attr_bank);
				tile_buffer[2] = ReadBankedUBYTE(metatile_attr_ptr + TILE_MAP_OFFSET(tile_id, x, y + 1), metatile_attr_bank);
				tile_buffer[3] = ReadBankedUBYTE(metatile_attr_ptr + TILE_MAP_OFFSET(tile_id, x + 1, y + 1), metatile_attr_bank);
				set_bkg_tiles((x + bkg_offset_x) & 31, (y + bkg_offset_y) & 31, 2, 2, tile_buffer);
				VBK_REG = 0;
			}
	#endif
		tile_buffer[0] = ReadBankedUBYTE(metatile_ptr + TILE_MAP_OFFSET(tile_id, x, y), metatile_bank);
		tile_buffer[1] = ReadBankedUBYTE(metatile_ptr + TILE_MAP_OFFSET(tile_id, x + 1, y), metatile_bank);
		tile_buffer[2] = ReadBankedUBYTE(metatile_ptr + TILE_MAP_OFFSET(tile_id, x, y + 1), metatile_bank);
		tile_buffer[3] = ReadBankedUBYTE(metatile_ptr + TILE_MAP_OFFSET(tile_id, x + 1, y + 1), metatile_bank);
		set_bkg_tiles((x + bkg_offset_x) & 31, (y + bkg_offset_y) & 31, 2, 2, tile_buffer);	
	}
}