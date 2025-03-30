#ifndef META_TILES_H
#define META_TILES_H

#define METATILE_MAP_OFFSET(x, y)  ((y << image_tile_width_bit) + x)
//The metatile scene must be 128x128 made of 8x8 for a total of 256 unique metatiles
#include <gbdk/platform.h>
#include "gbs_types.h"
#include "vm.h"
#include "data/states_defines.h"

#define MAX_MAP_DATA_SIZE (MAX_MAP_DATA_WIDTH * MAX_MAP_DATA_HEIGHT) // 256 x 27 (Always make sure the width is a power of 2 if edited, cannot exceed 256)
#define SRAM_MAP_DATA_PTR (0xA000 + (0x2000 - MAX_MAP_DATA_SIZE))
#define SRAM_COLLISION_DATA_PTR (SRAM_MAP_DATA_PTR - 0x0100)

extern uint8_t __at(SRAM_COLLISION_DATA_PTR) sram_collision_data[256]; //sram_map_data Address 0xA500 - 0x0100(256)
extern uint8_t __at(SRAM_MAP_DATA_PTR) sram_map_data[MAX_MAP_DATA_SIZE]; //0xA000 + (0x2000 (8k SRAM max size) - 0x1B00 (MAX_MAP_DATA_SIZE))

extern UBYTE metatile_bank;
extern unsigned char* metatile_ptr;

extern UBYTE metatile_attr_bank;
extern unsigned char* metatile_attr_ptr;

extern UBYTE image_tile_width_bit;

void replace_meta_tile(UBYTE x, UBYTE y, UBYTE tile_id, UBYTE commit) BANKED;

#endif
