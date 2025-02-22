#ifndef META_TILES_H
#define META_TILES_H

#define SRAM_MAP_WIDTH 16
#define SRAM_MAP_HEIGHT 8
#define METATILE_MAP_OFFSET(x,y)  ((((y >> 1) & 7) << 4) + ((x >> 1) & 15))
#define TILE_MAP_OFFSET(metatile_idx,x,y)  (((metatile_idx >> 4) << 6) + ((metatile_idx & 15) << 1) + ((y & 1) << 5) + (x & 1))

#include <gbdk/platform.h>
#include "gbs_types.h"
#include "vm.h"

#define MAX_MAP_DATA_SIZE (SRAM_MAP_WIDTH * SRAM_MAP_HEIGHT)

extern uint8_t __at(0xBB80) sram_collision_data[1024];
extern uint8_t __at(0xBF80) sram_map_data[MAX_MAP_DATA_SIZE]; //0xA000 + (0x2000 (8k SRAM max size) - 0x0080 (MAX_MAP_DATA_SIZE))

extern UBYTE metatile_bank;
extern unsigned char* metatile_ptr;

extern UBYTE metatile_attr_bank;
extern unsigned char* metatile_attr_ptr;

extern UBYTE metatile_collision_bank;
extern unsigned char* metatile_collision_ptr;


void replace_meta_tile(UBYTE x, UBYTE y, UBYTE tile_id, UBYTE commit) BANKED;

#endif
