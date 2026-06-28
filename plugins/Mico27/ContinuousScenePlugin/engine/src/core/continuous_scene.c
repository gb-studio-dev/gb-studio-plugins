#pragma bank 255

#include "continuous_scene.h"

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
#include "macro.h"
#include "interrupts.h"
#include "data/scene_types.h"
#include "data/game_globals.h"

#if __has_include ("states/topdown.h")
#include "states/topdown.h"
#endif

UBYTE continuous_scene_enabled;
UBYTE is_transitioning_scene;
continuous_scene_t continuous_scenes[8];
INT16 transitioning_player_pos_x;
INT16 transitioning_player_pos_y;

UBYTE fill_tile_id;
UBYTE fill_tile_attr;

void scene_transition_reset(void) BANKED {
    memset(continuous_scenes, 0, sizeof(continuous_scenes));
    transitioning_player_pos_x = 0;
    transitioning_player_pos_y = 0;
    continuous_scene_enabled = 0;
    //camera_settings |= CAMERA_LOCK_FLAG;
}

bool check_transition_to_scene_collision(void) BANKED {
    if (continuous_scene_enabled && !is_transitioning_scene && !CHK_FLAG(PLAYER.flags, ACTOR_FLAG_DISABLED)) {
        // Check for scene change collision
        if (transitioning_player_pos_y != PLAYER.pos.y)
        {
            transitioning_player_pos_y = 0x7FFF;
            if (PLAYER.pos.y > TILE_TO_SUBPX(SCREEN_OOB_TOP)){
                return transition_to_scene_modal(DIRECTION_TOP);
            } else if (PLAYER.pos.y >= image_height_subpx){
                return transition_to_scene_modal(DIRECTION_BOTTOM);
            }
        }
        if (transitioning_player_pos_x != PLAYER.pos.x)
        {
            transitioning_player_pos_x = 0x7FFF;
            if (PLAYER.pos.x > TILE_TO_SUBPX(SCREEN_OOB_LEFT)){
                return transition_to_scene_modal(DIRECTION_LEFT);
            } else if (PLAYER.pos.x >= image_width_subpx){
                return transition_to_scene_modal(DIRECTION_RIGHT);
            }
        }
    }
    return FALSE;
}

bool transition_to_scene_modal(UBYTE direction) BANKED {
    continuous_scene_t* continuous_scene = &continuous_scenes[direction];
    if (continuous_scene->scene.ptr && continuous_scene->scene.bank){
        is_transitioning_scene = 1;
        UBYTE was_scroll_render_disabled = scroll_render_disabled;
        scroll_render_disabled = 1;
        transition_load_scene(continuous_scene, direction);
        do {
            script_runner_update();
        } while (VM_ISLOCKED());
        is_transitioning_scene = 0;
        scroll_render_disabled = was_scroll_render_disabled;
        return TRUE;
    }
    return FALSE;
}

void transition_load_scene(continuous_scene_t* continuous_scene, UBYTE direction) BANKED {
    // hide actors (except player)
    actor_t *actor = actors_active_tail;
    while (actor) {
        if (actor != &PLAYER){
            SET_FLAG(actor->flags, ACTOR_FLAG_HIDDEN);
        }
        actor = actor->prev;
    }
    UBYTE tmp_show_actors_on_overlay = show_actors_on_overlay;
    show_actors_on_overlay = TRUE;
    // hide projectiles
    projectiles_init();
    // Update sprites before scene change
    toggle_shadow_OAM();
    actors_update();
    actors_render();
    projectiles_render();
    activate_shadow_OAM();
    wait_vbl_done();
    show_actors_on_overlay = tmp_show_actors_on_overlay;
    WORD offset = continuous_scene->offset;
    switch (direction){
        case DIRECTION_RIGHT:
            camera_x -= image_width_subpx;
            scroll_x -= (image_width + 8);
            PLAYER.pos.x -= image_width_subpx;
            bkg_offset_x = (bkg_offset_x + image_tile_width) & 31;
            transitioning_player_pos_x = PLAYER.pos.x;
            if (offset){
                camera_y += (offset << 8);
                scroll_y = SUBPX_TO_PX(camera_y) - (SCREENHEIGHT >> 1);
                PLAYER.pos.y += (offset << 8);
                bkg_offset_y = (bkg_offset_y - offset) & 31;
                transitioning_player_pos_y = PLAYER.pos.y;
            }
        break;
        case DIRECTION_BOTTOM:
            camera_y -= image_height_subpx;
            scroll_y -= (image_height + 8);
            PLAYER.pos.y -= image_height_subpx;
            bkg_offset_y = (bkg_offset_y + image_tile_height) & 31;
            transitioning_player_pos_y = PLAYER.pos.y;
            if (offset){
                camera_x += (offset << 8);
                scroll_x = SUBPX_TO_PX(camera_x) - (SCREENWIDTH >> 1);
                PLAYER.pos.x += (offset << 8);
                bkg_offset_x = (bkg_offset_x - offset) & 31;
                transitioning_player_pos_x = PLAYER.pos.x;
            }
        break;
    }
    // kill all threads, but don't clear variables
    script_runner_init(FALSE);
    // reset timers on scene change
    timers_init(FALSE);
    // reset input events on scene change
    events_init(FALSE);
    // reset music events
    music_init_events(FALSE);

    load_scene(continuous_scene->scene.ptr, continuous_scene->scene.bank, TRUE);

    switch (direction){
        case DIRECTION_LEFT:
            camera_x += image_width_subpx;
            scroll_x += (image_width + 8);
            PLAYER.pos.x += image_width_subpx;
            bkg_offset_x = (bkg_offset_x - image_tile_width) & 31;
            transitioning_player_pos_x = PLAYER.pos.x;
            if (offset){
                camera_y += (offset << 8);
                scroll_y = SUBPX_TO_PX(camera_y) - (SCREENHEIGHT >> 1);
                PLAYER.pos.y += (offset << 8);
                bkg_offset_y = (bkg_offset_y - offset) & 31;
                transitioning_player_pos_y = PLAYER.pos.y;
            }
        break;
        case DIRECTION_TOP:
            camera_y += image_height_subpx;
            scroll_y += (image_height + 8);
            PLAYER.pos.y += image_height_subpx;
            bkg_offset_y = (bkg_offset_y - image_tile_height) & 31;
            transitioning_player_pos_y = PLAYER.pos.y;
            if (offset){
                camera_x += (offset << 8);
                scroll_x = SUBPX_TO_PX(camera_x) - (SCREENWIDTH >> 1);
                PLAYER.pos.x += (offset << 8);
                bkg_offset_x = (bkg_offset_x - offset) & 31;
                transitioning_player_pos_x = PLAYER.pos.x;
            }
        break;
    }
}

void set_continuous_scene(SCRIPT_CTX * THIS) OLDCALL BANKED {
    uint8_t scene_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
    const scene_t * scene_ptr = *(scene_t **) VM_REF_TO_PTR(FN_ARG1);
    uint8_t direction = *(uint8_t *)VM_REF_TO_PTR(FN_ARG2);
    int8_t offset = *(int8_t *)VM_REF_TO_PTR(FN_ARG3);
    far_ptr_t background_col_ptr;
    ReadBankedFarPtr(&background_col_ptr, (void *)&(scene_ptr->background), scene_bank);
    background_t bkg;
    MemcpyBanked(&bkg, background_col_ptr.ptr, sizeof(bkg), background_col_ptr.bank);
    ReadBankedFarPtr(&background_col_ptr, (void *)&(scene_ptr->collisions), scene_bank);
    continuous_scene_enabled |= DIRECTION_BIT(direction);
    continuous_scenes[direction].scene.bank = scene_bank;
    continuous_scenes[direction].scene.ptr = (void *)scene_ptr;
    continuous_scenes[direction].tilemap.bank = bkg.tilemap.bank;
    continuous_scenes[direction].tilemap.ptr = bkg.tilemap.ptr;
    continuous_scenes[direction].cgb_tilemap_attr.bank = bkg.cgb_tilemap_attr.bank;
    continuous_scenes[direction].cgb_tilemap_attr.ptr = bkg.cgb_tilemap_attr.ptr;
    continuous_scenes[direction].collision.bank = background_col_ptr.bank;
    continuous_scenes[direction].collision.ptr = background_col_ptr.ptr;
    continuous_scenes[direction].tile_width = bkg.width;
    continuous_scenes[direction].tile_height = bkg.height;
    continuous_scenes[direction].offset = offset;
    scroll_reset();
}

void remove_continuous_scene(SCRIPT_CTX * THIS) OLDCALL BANKED {
    uint8_t direction = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    continuous_scene_enabled &= ~DIRECTION_BIT(direction);
    continuous_scenes[direction].scene.bank = 0;
    continuous_scenes[direction].scene.ptr = NULL;
    continuous_scenes[direction].tilemap.bank = 0;
    continuous_scenes[direction].tilemap.ptr = NULL;
    continuous_scenes[direction].cgb_tilemap_attr.bank = 0;
    continuous_scenes[direction].cgb_tilemap_attr.ptr = NULL;
    continuous_scenes[direction].tile_width = 0;
    continuous_scenes[direction].tile_height = 0;
    continuous_scenes[direction].offset = 0;
    continuous_scenes[direction].collision.bank = 0;
    continuous_scenes[direction].collision.ptr = NULL;
    scroll_reset();
}

void load_scene_connections(SCRIPT_CTX * THIS) OLDCALL BANKED {
    uint8_t scene_connection_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
    const scene_connection_t* scene_connection_ptr = *(scene_connection_t**)VM_REF_TO_PTR(FN_ARG1);
    uint16_t connections_index = *(uint16_t *)VM_REF_TO_PTR(FN_ARG2) << 3; // multiply by number of directions which is 8
    scene_connection_t connection;
    far_ptr_t background_col_ptr;
    background_t bkg;
    for (uint8_t i = 0; i < 8; i++){
        MemcpyBanked(&connection, (scene_connection_ptr + (connections_index + (UWORD)i)), sizeof(scene_connection_t), scene_connection_bank);
        if (connection.scene.ptr && connection.scene.bank){
            ReadBankedFarPtr(&background_col_ptr, (void *)&(((const scene_t *)connection.scene.ptr)->background), connection.scene.bank);
            MemcpyBanked(&bkg, background_col_ptr.ptr, sizeof(bkg), background_col_ptr.bank);
            ReadBankedFarPtr(&background_col_ptr, (void *)&(((const scene_t *)connection.scene.ptr)->collisions), connection.scene.bank);
            continuous_scene_enabled |= DIRECTION_BIT(i);
            continuous_scenes[i].scene.bank = connection.scene.bank;
            continuous_scenes[i].scene.ptr = (void *)connection.scene.ptr;
            continuous_scenes[i].tilemap.bank = bkg.tilemap.bank;
            continuous_scenes[i].tilemap.ptr = bkg.tilemap.ptr;
            continuous_scenes[i].cgb_tilemap_attr.bank = bkg.cgb_tilemap_attr.bank;
            continuous_scenes[i].cgb_tilemap_attr.ptr = bkg.cgb_tilemap_attr.ptr;
            continuous_scenes[i].collision.bank = background_col_ptr.bank;
            continuous_scenes[i].collision.ptr = background_col_ptr.ptr;
            continuous_scenes[i].tile_width = bkg.width;
            continuous_scenes[i].tile_height = bkg.height;
            continuous_scenes[i].offset = connection.offset;
        } else {
            continuous_scene_enabled &= ~DIRECTION_BIT(i);
            continuous_scenes[i].scene.bank = 0;
            continuous_scenes[i].scene.ptr = NULL;
            continuous_scenes[i].tilemap.bank = 0;
            continuous_scenes[i].tilemap.ptr = NULL;
            continuous_scenes[i].cgb_tilemap_attr.bank = 0;
            continuous_scenes[i].cgb_tilemap_attr.ptr = NULL;
            continuous_scenes[i].tile_width = 0;
            continuous_scenes[i].tile_height = 0;
            continuous_scenes[i].offset = 0;
            continuous_scenes[i].collision.bank = 0;
            continuous_scenes[i].collision.ptr = NULL;
        }
    }
    scroll_reset();
}