#ifndef META_TILES_H
#define META_TILES_H

#define METATILE_MAP_OFFSET(x, y)  (((y >> 1) << image_tile_width_bit) + (x >> 1))
#define TILE_MAP_OFFSET(metatile_idx,x,y)  (((metatile_idx >> 4) << 6) + ((metatile_idx & 15) << 1) + ((y & 1) << 5) + (x & 1))
//The metatile scene must be 256x256 made of 16x16 for a total of 256 unique metatiles
#include <gbdk/platform.h>
#include "gbs_types.h"
#include "vm.h"
#include "data/states_defines.h"

#define MAX_MAP_DATA_SIZE (MAX_MAP_DATA_WIDTH * MAX_MAP_DATA_HEIGHT) // 128 x 16 (Always make sure the width is a power of 2 if edited, cannot exceed 128)
#define SRAM_MAP_DATA_PTR (0xA000 + (0x2000 - MAX_MAP_DATA_SIZE))
#define SRAM_COLLISION_DATA_PTR (SRAM_MAP_DATA_PTR - 0x0400)

extern uint8_t __at(SRAM_COLLISION_DATA_PTR) sram_collision_data[1024]; //sram_map_data Address 0xBC00 - 0x0400(1024)
extern uint8_t __at(SRAM_MAP_DATA_PTR) sram_map_data[MAX_MAP_DATA_SIZE]; //0xA000 + (0x2000 (8k SRAM max size) - 0x0800 (MAX_MAP_DATA_SIZE))

extern UBYTE metatile_bank;
extern unsigned char* metatile_ptr;

extern UBYTE metatile_attr_bank;
extern unsigned char* metatile_attr_ptr;

extern UBYTE image_tile_width_bit;

void replace_meta_tile(UBYTE x, UBYTE y, UBYTE tile_id, UBYTE commit) BANKED;

#endif
