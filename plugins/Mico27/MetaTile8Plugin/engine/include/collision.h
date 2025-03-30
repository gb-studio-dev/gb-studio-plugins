#ifndef COLLISIONS_H
#define COLLISIONS_H

#include <gbdk/platform.h>

#include "math.h"
#include "bankdata.h"
#include "data/states_defines.h"

#define COLLISION_TOP 0x1
#define COLLISION_BOTTOM 0x2
#define COLLISION_LEFT 0x4
#define COLLISION_RIGHT 0x8
#define COLLISION_ALL 0xF
#define TILE_PROP_LADDER 0x10

#define SRAM_MAP_WIDTH 128
#define SRAM_MAP_HEIGHT 16
#define METATILE_MAP_OFFSET(x, y)  ((y << image_tile_width_bit) + x)

#define MAX_MAP_DATA_SIZE (MAX_MAP_DATA_WIDTH * MAX_MAP_DATA_HEIGHT) // 256 x 27 (Always make sure the width is a power of 2 if edited, cannot exceed 256)
#define SRAM_MAP_DATA_PTR (0xA000 + (0x2000 - MAX_MAP_DATA_SIZE))
#define SRAM_COLLISION_DATA_PTR (SRAM_MAP_DATA_PTR - 0x0100)

typedef struct bounding_box_t {
    BYTE left, right, top, bottom;
} bounding_box_t;

extern UBYTE collision_bank;
extern unsigned char *collision_ptr;
extern UBYTE image_tile_width;
extern UBYTE image_tile_height;

extern uint8_t __at(SRAM_COLLISION_DATA_PTR) sram_collision_data[256]; //sram_map_data Address 0xA500 - 0x0100(256)
extern uint8_t __at(SRAM_MAP_DATA_PTR) sram_map_data[MAX_MAP_DATA_SIZE]; //0xA000 + (0x2000 (8k SRAM max size) - 0x1B00 (MAX_MAP_DATA_SIZE))

extern UBYTE metatile_bank;

extern UBYTE image_tile_width_bit;

/**
 * Check if point is within positioned bounding box.
 *
 * @param bb Pointer to bounding box
 * @param offset Pointer to position offset for bounding box (e.g Actor position)
 * @param point Pointer to position to look for within bounding box
 * @return Point is within bounding box
 */
inline UBYTE bb_contains(bounding_box_t *bb, point16_t *offset, point16_t *point) {
    if ((point->x < (offset->x >> 4) + bb->left) || 
        (point->x > (offset->x >> 4) + bb->right)) return FALSE;
    if ((point->y < (offset->y >> 4) + bb->top) || 
        (point->y > (offset->y >> 4) + bb->bottom)) return FALSE;
    return TRUE;
}

/**
 * Check if two positioned bounding boxes intersect.
 *
 * @param bb_a Pointer to bounding box A
 * @param offset_a Pointer to position offset for bounding box A
 * @param bb_b Pointer to bounding box B
 * @param offset_b Pointer to position offset for bounding box B
 * @return Positioned bounding boxes intersect
 */
inline UBYTE bb_intersects(bounding_box_t *bb_a, point16_t *offset_a, bounding_box_t *bb_b, point16_t *offset_b) {
    if (((offset_b->x >> 4) + bb_b->left   > (offset_a->x >> 4) + bb_a->right) ||
        ((offset_b->x >> 4) + bb_b->right  < (offset_a->x >> 4) + bb_a->left)) return FALSE;
    if (((offset_b->y >> 4) + bb_b->top    > (offset_a->y >> 4) + bb_a->bottom) ||
        ((offset_b->y >> 4) + bb_b->bottom < (offset_a->y >> 4) + bb_a->top)) return FALSE;
    return TRUE;
}

/**
 * Return collision tile value at given tile x,y coordinate.
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return Tile value, 0 if no collisions, COLLISION_ALL if out of bounds
 */
inline UBYTE tile_at(UBYTE tx, UBYTE ty) {
	if ((tx < image_tile_width) && (ty < image_tile_height)) {
		if (metatile_bank) {
			return sram_collision_data[sram_map_data[METATILE_MAP_OFFSET(tx, ty)]];
		} else {
			return ReadBankedUBYTE(collision_ptr + (ty * (UINT16)image_tile_width) + tx, collision_bank);
		}
	}
    return COLLISION_ALL;
}

#endif