#ifndef META_TILES_H
#define META_TILES_H

#define METATILE_X_OFFSET(x) (x >> 1)
#define METATILE_Y_OFFSET(y) ((y >> 1) << image_tile_width_bit)
#define TILE_X_OFFSET(x) (x & 1)
#define TILE_Y_OFFSET(y) ((y & 1) << 5)
#define METATILE_MAP_OFFSET(x, y)  (METATILE_Y_OFFSET(y) + METATILE_X_OFFSET(x))
#define TILE_MAP_OFFSET(metatile_idx,x,y)  (UWORD)(((metatile_idx & 0xF0) << 2) + ((metatile_idx & 15) << 1) + TILE_Y_OFFSET(y) + TILE_X_OFFSET(x))
//The metatile scene must be 256x256 made of 16x16 for a total of 256 unique metatiles
#include <gbdk/platform.h>
#include "gbs_types.h"
#include "events.h"
#include "vm.h"
#include "data/states_defines.h"

#define MAX_MAP_DATA_SIZE (MAX_MAP_DATA_WIDTH * MAX_MAP_DATA_HEIGHT) // 128 x 16 (Always make sure the width is a power of 2 if edited, cannot exceed 128)
#define SRAM_MAP_DATA_PTR (0xA000 + (0x2000 - MAX_MAP_DATA_SIZE))
#define SRAM_COLLISION_DATA_PTR (SRAM_MAP_DATA_PTR - 0x0400)

#define METATILE_EVENTS_SIZE 5
#define METATILE_ENTER_EVENT 0
#define METATILE_COLLISION_DOWN_EVENT 1
#define METATILE_COLLISION_RIGHT_EVENT 2
#define METATILE_COLLISION_UP_EVENT 3
#define METATILE_COLLISION_LEFT_EVENT 4
#define METATILE_COLLISION_ANY_EVENT 5

extern uint8_t __at(SRAM_COLLISION_DATA_PTR) sram_collision_data[1024]; //sram_map_data Address 0xBC00 - 0x0400(1024)
extern uint8_t __at(SRAM_MAP_DATA_PTR) sram_map_data[MAX_MAP_DATA_SIZE]; //0xA000 + (0x2000 (8k SRAM max size) - 0x0800 (MAX_MAP_DATA_SIZE))

extern UBYTE metatile_bank;
extern unsigned char* metatile_ptr;

extern UBYTE metatile_attr_bank;
extern unsigned char* metatile_attr_ptr;

extern UBYTE metatile_collision_bank;
extern unsigned char* metatile_collision_ptr;

extern UBYTE image_tile_width_bit;

extern script_event_t metatile_events[METATILE_EVENTS_SIZE];

extern UBYTE overlap_metatile_id;
extern UBYTE overlap_metatile_x;
extern UBYTE overlap_metatile_y;

extern UBYTE collided_metatile_id;
extern UBYTE collided_metatile_x;
extern UBYTE collided_metatile_y;
extern UBYTE collided_metatile_dir;
extern UBYTE collided_metatile_source;

inline UWORD get_metatile_tile(UWORD metatile_offset, UWORD tile_offset) {
	UBYTE metatile_idx = sram_map_data[(metatile_offset)];
	return (((metatile_idx & 0xF0) << 2) + ((metatile_idx & 15) << 1) + tile_offset);	
}

void metatile_reset(void) BANKED;
void load_meta_tiles(void) BANKED;
void replace_meta_tile(UBYTE x, UBYTE y, UBYTE tile_id, UBYTE commit) BANKED;
void reset_meta_tile(UBYTE x, UBYTE y, UBYTE commit) BANKED;

UBYTE metatile_overlap_at_intersection(rect16_t *bb, upoint16_t *offset) BANKED;

void on_player_metatile_collision(UBYTE tile_x, UBYTE tile_y, UBYTE direction) BANKED;
void reset_collision_cache(UBYTE direction) BANKED;
#endif
