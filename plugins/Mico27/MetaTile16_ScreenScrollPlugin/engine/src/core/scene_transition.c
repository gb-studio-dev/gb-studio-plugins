#pragma bank 255

#include "scene_transition.h"

#include <string.h>

#include "system.h"
#include "actor.h"
#include "camera.h"
#include "data_manager.h"
#include "game_time.h"
#include "math.h"
#include "fade_manager.h"
#include "parallax.h"
#include "scroll.h"
#include "ui.h"
#include "bankdata.h"
#include "input.h"
#include "projectiles.h"
#include "shadow.h"
#include "music_manager.h"
#include "vm.h"
#include "meta_tiles.h"
#include "macro.h"
#include "data/game_globals.h"

#define TILE_FRACTION_MASK         0b1111111
#define ONE_TILE_DISTANCE          256

INT16 player_transition_right_dist;
INT16 player_transition_left_dist;
INT16 player_transition_top_dist;
INT16 player_transition_bottom_dist;

INT16 player_transition_right_threshold;
INT16 player_transition_left_threshold;
INT16 player_transition_top_threshold;
INT16 player_transition_bottom_threshold;

UBYTE scene_transition_enabled;
UBYTE is_transitioning_scene;
far_ptr_t up_scene;
far_ptr_t right_scene;
far_ptr_t down_scene;
far_ptr_t left_scene;
UBYTE round_position_flags;
INT16 transitioning_player_pos_x;
INT16 transitioning_player_pos_y;

void enable_transition_to_scene(void) BANKED {
	camera_settings &= ~(CAMERA_LOCK_FLAG);
	//camera_x = SCROLL_CAM_X;
	//camera_y = SCROLL_CAM_Y;
	scene_transition_enabled = 1;
}

void scene_transition_reset(void) BANKED {
	up_scene.bank = 0;
	right_scene.bank = 0;
	down_scene.bank = 0;
	left_scene.bank = 0;
	scene_transition_enabled = 0;
}

void check_transition_to_scene_collision(void) BANKED {	
	if (scene_transition_enabled && !is_transitioning_scene && !CHK_FLAG(PLAYER.flags, ACTOR_FLAG_DISABLED)) {		
		// Check for scene scroll
		if (transitioning_player_pos_y != PLAYER.pos.y)
		{
			transitioning_player_pos_y = 0x7FFF;
			if (((WORD)PLAYER.pos.y) < player_transition_top_threshold){
				transition_to_scene_modal(DIRECTION_UP);				
			} else if ((WORD)PLAYER.pos.y > (TILE_TO_SUBPX(image_tile_height) - player_transition_bottom_threshold)){
				transition_to_scene_modal(DIRECTION_DOWN);		
			}
		}
		if (transitioning_player_pos_x != PLAYER.pos.x)
		{
			transitioning_player_pos_x = 0x7FFF;
			if (((WORD)PLAYER.pos.x) < player_transition_left_threshold){
				transition_to_scene_modal(DIRECTION_LEFT);
			} else if ((WORD)PLAYER.pos.x > (TILE_TO_SUBPX(image_tile_width) - player_transition_right_threshold)){
				transition_to_scene_modal(DIRECTION_RIGHT);
			}
		}
	}
}

void transition_to_scene_modal(UBYTE direction) BANKED {
	UBYTE scene_bank;
	const scene_t * scene;
	if (direction == DIRECTION_UP){
		scene_bank = up_scene.bank;
		scene = up_scene.ptr;
	} else if (direction == DIRECTION_RIGHT){
		scene_bank = right_scene.bank;
		scene = right_scene.ptr;
	} else if (direction == DIRECTION_DOWN){
		scene_bank = down_scene.bank;
		scene = down_scene.ptr;
	} else {
		scene_bank = left_scene.bank;
		scene = left_scene.ptr;
	}
	if (scene_bank && scene){
		is_transitioning_scene = 1;
		transition_load_scene(scene_bank, scene, (direction == DIRECTION_RIGHT)? image_tile_width: (direction == DIRECTION_LEFT)? -image_tile_width: 0, (direction == DIRECTION_DOWN)? image_tile_height: (direction == DIRECTION_UP)? -image_tile_height: 0);
		transitioning_player_pos_x = PLAYER.pos.x + ((direction == DIRECTION_RIGHT)? player_transition_right_dist: (direction == DIRECTION_LEFT)? -player_transition_left_dist: 0);
		transitioning_player_pos_y = PLAYER.pos.y + ((direction == DIRECTION_DOWN)? player_transition_bottom_dist: (direction == DIRECTION_UP)? -player_transition_top_dist: 0);
		if (round_position_flags & direction){		
			transitioning_player_pos_x = (transitioning_player_pos_x  & ~TILE_FRACTION_MASK);
			transitioning_player_pos_y = (transitioning_player_pos_y  & ~TILE_FRACTION_MASK);
			if (direction == DIRECTION_UP){
				transitioning_player_pos_y += ONE_TILE_DISTANCE;
			} else if (direction == DIRECTION_LEFT){
				transitioning_player_pos_x += ONE_TILE_DISTANCE;
			}
		}
		uint8_t camera_arrived = FALSE;
		uint8_t player_arrived = FALSE;
		metatile_bank = 0;
		metatile_attr_bank = 0;
		do {
			script_runner_update();
		} while (VM_ISLOCKED());
		wait_vbl_done();		
		if (direction == DIRECTION_RIGHT){
			scroll_x = (SUBPX_TO_PX(camera_x) - (SCREENWIDTH >> 1)) - 8;
		} else if (direction == DIRECTION_DOWN){
			if (image_height < SCREENHEIGHT){
				scroll_render_rows(draw_scroll_x, draw_scroll_y, image_tile_height, PX_TO_TILE(SCREENHEIGHT - image_height));
			}
			scroll_y = (SUBPX_TO_PX(camera_y) - (SCREENHEIGHT >> 1)) - 8;			
		} else if (direction == DIRECTION_LEFT){
			scroll_x = (SUBPX_TO_PX(camera_x) - (SCREENWIDTH >> 1));
		} else if (direction == DIRECTION_UP){
			scroll_y = (SUBPX_TO_PX(camera_y) - (SCREENHEIGHT >> 1));
		}
		wait_vbl_done();
		do {
			script_runner_update();	
			
			if (!VM_ISLOCKED()){
				camera_arrived = transition_camera_to();
				player_arrived = transition_player_to();
			}
			input_update();		
			ui_update();
	
			toggle_shadow_OAM();
			camera_update();
			scroll_update();
			actors_update();
            actors_render();
			projectiles_render();
			activate_shadow_OAM();
	
			game_time++;
			wait_vbl_done();
			
			if (camera_arrived && player_arrived) {				
				scroll_reset();
				is_transitioning_scene = 0;
			}
		} while (is_transitioning_scene);
	}
}

void transition_load_scene(UBYTE scene_bank, const scene_t * scene, BYTE t_scroll_x, BYTE t_scroll_y) BANKED {
	// hide actors (except player)
	actor_t *actor = actors_active_tail;
    while (actor) {
		if (actor != &PLAYER){
			SET_FLAG(actor->flags, ACTOR_FLAG_HIDDEN);
		}		
		actor = actor->prev;
	}
	// hide projectiles
	projectiles_init();
	// Update sprites before scene change
	toggle_shadow_OAM();
	actors_update();
	actors_render();
	projectiles_render();
	activate_shadow_OAM();
	wait_vbl_done();
	
	initial_camera_x = camera_x = -TILE_TO_SUBPX(t_scroll_x) + SCROLL_CAM_X;
	initial_camera_y = camera_y = -TILE_TO_SUBPX(t_scroll_y) + SCROLL_CAM_Y;
	initial_player_x_pos = (PLAYER.pos.x -= TILE_TO_SUBPX(t_scroll_x));
	initial_player_y_pos = (PLAYER.pos.y -= TILE_TO_SUBPX(t_scroll_y));	
	bkg_offset_x = (bkg_offset_x + t_scroll_x) & 31;
	bkg_offset_y = (bkg_offset_y + t_scroll_y) & 31;	
    // kill all threads, but don't clear variables 
    script_runner_init(FALSE);
    // reset timers on scene change
    timers_init(FALSE);
    // reset input events on scene change
    events_init(FALSE);
    // reset music events
    music_init_events(FALSE);	
	
	load_scene(scene, scene_bank, TRUE);	
	//reinitialize initial positions after loading scene
	initial_player_x_pos = 0;
	initial_player_y_pos = 0;
	initial_camera_x = 0;
	initial_camera_y = 0;
}

uint8_t transition_camera_to(void) BANKED {
	// Move camera towards destination
	
	if ((camera_x == SCROLL_CAM_X) && (camera_y == SCROLL_CAM_Y)) {
        return TRUE;
    }
    if (camera_x > SCROLL_CAM_X) {
        // Move left
        camera_x -= SCROLL_CAM_SPEED;
        if (camera_x <= SCROLL_CAM_X) {
            camera_x = SCROLL_CAM_X;
        }
    } else if (camera_x < SCROLL_CAM_X) {
        // Move right
        camera_x += SCROLL_CAM_SPEED;
        if (camera_x >= SCROLL_CAM_X) {
            camera_x = SCROLL_CAM_X;
        }        
    }

    if (camera_y > SCROLL_CAM_Y) {
        // Move up
        camera_y -= SCROLL_CAM_SPEED;
        if (camera_y <= SCROLL_CAM_Y) {
            camera_y = SCROLL_CAM_Y;
        }        
    } else if (camera_y < SCROLL_CAM_Y) {
        // Move down
        camera_y += SCROLL_CAM_SPEED;
        if (camera_y >= SCROLL_CAM_Y) {
            camera_y = SCROLL_CAM_Y;
        }      
    }	
	if ((camera_x == SCROLL_CAM_X) && (camera_y == SCROLL_CAM_Y)) {
        return TRUE;
    }	
	return FALSE;
}


uint8_t transition_player_to(void) BANKED {
	
	if ((PLAYER.pos.x == transitioning_player_pos_x) && (PLAYER.pos.y == transitioning_player_pos_y)) {
        return TRUE;
    }
	
	UINT16 oldPlayerPosX = PLAYER.pos.x + SCROLL_CAM_X;
	UINT16 oldPlayerPosY = PLAYER.pos.y + SCROLL_CAM_Y;
	UINT16 newPlayerPosX = transitioning_player_pos_x + SCROLL_CAM_X;
	UINT16 newPlayerPosY = transitioning_player_pos_y + SCROLL_CAM_Y;
	
	if (oldPlayerPosX > newPlayerPosX) {
        // Move left
        oldPlayerPosX -= SCROLL_PLAYER_SPEED;
        if (oldPlayerPosX <= newPlayerPosX) {
            oldPlayerPosX = newPlayerPosX;
        }
    } else if (oldPlayerPosX < newPlayerPosX) {
        // Move right
        oldPlayerPosX += SCROLL_PLAYER_SPEED;
        if (oldPlayerPosX >= newPlayerPosX) {
            oldPlayerPosX = newPlayerPosX;
        }        
    }

    if (oldPlayerPosY > newPlayerPosY) {
        // Move up
        oldPlayerPosY -= SCROLL_PLAYER_SPEED;
        if (oldPlayerPosY <= newPlayerPosY) {
            oldPlayerPosY = newPlayerPosY;
        }        
    } else if (oldPlayerPosY < newPlayerPosY) {
        // Move down
        oldPlayerPosY += SCROLL_PLAYER_SPEED;
        if (oldPlayerPosY >= newPlayerPosY) {
            oldPlayerPosY = newPlayerPosY;
        }      
    }
	
	PLAYER.pos.x = oldPlayerPosX - SCROLL_CAM_X;
	PLAYER.pos.y = oldPlayerPosY - SCROLL_CAM_Y;
	
	if ((PLAYER.pos.x == transitioning_player_pos_x) && (PLAYER.pos.y == transitioning_player_pos_y)) {
        return TRUE;
    }
	return FALSE;
}
