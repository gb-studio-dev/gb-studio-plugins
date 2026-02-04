#ifndef META_TILES_H
#define META_TILES_H

#define SRAM_MAP_WIDTH 16
#define SRAM_MAP_HEIGHT 16
#define METATILE_MAP_OFFSET(x,y)  (((y & 0xFE) << 3) + (x >> 1))
#define TILE_MAP_OFFSET(metatile_idx,x,y)  (((metatile_idx & 0xF0) << 2) + ((metatile_idx & 15) << 1) + ((y & 1) << 5) + (x & 1))

#include <gbdk/platform.h>
#include "gbs_types.h"
#include "events.h"
#include "vm.h"

#define MAX_MAP_DATA_SIZE (SRAM_MAP_WIDTH * SRAM_MAP_HEIGHT)

#define METATILE_EVENTS_SIZE 5
#define METATILE_ENTER_EVENT 0
#define METATILE_COLLISION_DOWN_EVENT 1
#define METATILE_COLLISION_RIGHT_EVENT 2
#define METATILE_COLLISION_UP_EVENT 3
#define METATILE_COLLISION_LEFT_EVENT 4
#define METATILE_COLLISION_ANY_EVENT 5

extern uint8_t __at(0xBB00) sram_collision_data[1024];
extern uint8_t __at(0xBF00) sram_map_data[MAX_MAP_DATA_SIZE]; //0xA000 + (0x2000 (8k SRAM max size) - 0x0100 (MAX_MAP_DATA_SIZE))

extern UBYTE metatile_bank;
extern unsigned char* metatile_ptr;

extern UBYTE metatile_attr_bank;
extern unsigned char* metatile_attr_ptr;

extern script_event_t metatile_events[METATILE_EVENTS_SIZE];

extern UBYTE overlap_metatile_id;
extern UBYTE overlap_metatile_x;
extern UBYTE overlap_metatile_y;

extern UBYTE collided_metatile_id;
extern UBYTE collided_metatile_x;
extern UBYTE collided_metatile_y;
extern UBYTE collided_metatile_dir;
extern UBYTE collided_metatile_source;

UWORD get_metatile_offset(UBYTE x, UBYTE y) NONBANKED;
void replace_meta_tile(UBYTE x, UBYTE y, UBYTE tile_id, UBYTE commit) BANKED;
void reset_meta_tile(UBYTE x, UBYTE y, UBYTE commit) BANKED;

UBYTE metatile_overlap_at_intersection(rect16_t *bb, upoint16_t *offset) BANKED;

void on_player_metatile_collision(UBYTE tile_x, UBYTE tile_y, UBYTE direction) BANKED;
void reset_collision_cache(UBYTE direction) BANKED;

#endif
