#ifndef CONTINUOUS_SCENE_H
#define CONTINUOUS_SCENE_H

#include <gbdk/platform.h>

#include "gbs_types.h"

#define DIRECTION_TOP 0
#define DIRECTION_RIGHT 1
#define DIRECTION_BOTTOM 2
#define DIRECTION_LEFT 3
#define DIRECTION_TOP_LEFT 4
#define DIRECTION_TOP_RIGHT 5
#define DIRECTION_BOTTOM_RIGHT 6
#define DIRECTION_BOTTOM_LEFT 7

#define DIRECTION_TOP_FLAG 0x01
#define DIRECTION_RIGHT_FLAG 0x02
#define DIRECTION_BOTTOM_FLAG 0x04
#define DIRECTION_LEFT_FLAG 0x08
#define DIRECTION_TOP_LEFT_FLAG 0x10
#define DIRECTION_TOP_RIGHT_FLAG 0x20
#define DIRECTION_BOTTOM_RIGHT_FLAG 0x40
#define DIRECTION_BOTTOM_LEFT_FLAG 0x80

#define DIRECTION_BIT(direction) (1 << (direction));

#define SCROLL_CAM_X 2560
#define SCROLL_CAM_Y 2304

typedef struct continuous_scene_t
{
    far_ptr_t scene;
    far_ptr_t tilemap;
    far_ptr_t cgb_tilemap_attr;
    far_ptr_t collision;
    uint8_t tile_width;
    uint8_t tile_height;
    int8_t offset;
} continuous_scene_t;

typedef struct scene_connection_t
{
    far_ptr_t scene;
    int8_t offset;
} scene_connection_t;

extern UBYTE continuous_scene_enabled;
extern UBYTE is_transitioning_scene;
extern continuous_scene_t continuous_scenes[8];
extern INT16 transitioning_player_pos_x;
extern INT16 transitioning_player_pos_y;
extern UBYTE fill_tile_id;
extern UBYTE fill_tile_attr;

void scene_transition_reset(void) BANKED;
bool check_transition_to_scene_collision(void) BANKED;
bool transition_to_scene_modal(UBYTE direction) BANKED;
void transition_load_scene(continuous_scene_t* continuous_scene, UBYTE direction) BANKED;

#endif
