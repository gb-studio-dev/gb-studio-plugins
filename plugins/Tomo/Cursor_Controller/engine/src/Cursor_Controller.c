/*
 * Author: Tomo (@indiegdevstdio)
 * Controls the cursor actor depending on user d-pad input and returns the results when user presses the A or B button
 */
#pragma bank 255

#include <gbdk/platform.h>
#include "vm.h"
#include "interrupts.h"
#include "actor.h"
#include "vm_actor.h"
#include "input.h"
#include "math.h"
#include "collision.h"
#include "macro.h"
#include "data/game_globals.h"

#define CURSOR_ANIM_COUNTER_MAX 48

//#define CURSOR_STEP_SPEED_DIVIDER_OPPOSITE_BOUNDARY 10
//#define CURSOR_STEP_SPEED_DIVIDER_SHORT 6
#define CURSOR_STEP_SPEED_DIVIDER_LONG 4
//#define CURSOR_STEP_OPPOSITE_BOUNDARY_DISTANCE_DIVIDER 2
//#define CURSOR_STEP_BOUNCE_AMOUNT_DIVIDER 4
#define CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT 8
#define CURSOR_BOUNCE_AMOUNT_LEFT 60
#define CURSOR_BOUNCE_AMOUNT_RIGHT -15
#define CURSOR_BOUNCE_AMOUNT_TOP 60
#define CURSOR_BOUNCE_AMOUNT_BOTTOM -16
#define CURSOR_BOUNCE_ANIM_WAIT_LEFT 2
#define CURSOR_BOUNCE_ANIM_WAIT_RIGHT 2
#define CURSOR_BOUNCE_ANIM_WAIT_TOP 2
#define CURSOR_BOUNCE_ANIM_WAIT_BOTTOM 2

#define CURSOR_BUTTON_PRESSED_NULL -1
#define CURSOR_BUTTON_PRESSED_B 0
#define CURSOR_BUTTON_PRESSED_A 1
#define CURSOR_BUTTON_PRESSED_UP 2
#define CURSOR_BUTTON_PRESSED_DOWN 3
#define CURSOR_BUTTON_PRESSED_LEFT 4
#define CURSOR_BUTTON_PRESSED_RIGHT 5
#define CURSOR_BUTTON_PRESSED_START 6
#define CURSOR_BUTTON_PRESSED_SELECT 7

#define CURSOR_ANIM_STATE_DEFAULT 0
#define CURSOR_ANIM_STATE_ACTIVATED 1
#define CURSOR_ANIM_STATE_ENTER 2
#define CURSOR_ANIM_STATE_CANCEL 3
#define CURSOR_ANIM_STATE_SELECTED 4
#define CURSOR_ANIM_STATE_SELECTED_LOOP 5

#define COLLISION_SEARCH_DIR_UP 0
#define COLLISION_SEARCH_DIR_DOWN 1
#define COLLISION_SEARCH_DIR_LEFT 2
#define COLLISION_SEARCH_DIR_RIGHT 3

#define EX_FN_ARG8 -9
#define EX_FN_ARG9 -10
#define EX_FN_ARG10 -11
#define EX_FN_ARG11 -12
#define EX_FN_ARG12 -13
#define EX_FN_ARG13 -14
#define EX_FN_ARG14 -15
#define EX_FN_ARG15 -16
#define EX_FN_ARG16 -17
#define EX_FN_ARG17 -18
#define EX_FN_ARG18 -19

UBYTE isInputHeld = FALSE;
int16_t posOffsetX = 0;
int16_t posOffsetY = 0;
int16_t accumPosX = 0;
int16_t accumPosY = 0;
UBYTE btnHeldCounter = 0;
UBYTE animCounter = 0;
UBYTE btnHeldFirstTime = FALSE;
UBYTE currentAnimStateID = 0;
BYTE previousButtonPressed = CURSOR_BUTTON_PRESSED_NULL; 
BYTE prevCursorIndex = -1;
BYTE cursorIndex = -1;

int16_t animOffsetAmountX = NULL;
int16_t animOffsetAmountY = NULL;

// Changes actor state
void ChangeActorState(SCRIPT_CTX * THIS, UBYTE actor_id, UWORD state, UBYTE state_id) BANKED {
	vm_set_const(THIS, FN_ARG0, actor_id);
	vm_actor_set_anim_set(THIS, FN_ARG0, state);
    actor_set_frame_offset((actor_t*)(actors + actor_id), 0);
    currentAnimStateID = state_id;
}

// Find the next tile that does not have any collisions in the current row/column (depending on the direction to search)
int16_t FindNextNonCollisionTile(UBYTE tile_idx, UBYTE max_columns, UBYTE max_rows, UBYTE direction, UBYTE mapping_start_tile_x, UBYTE mapping_start_tile_y) BANKED {
    int16_t i = 0;
    UBYTE tile_id = 0;
    UBYTE tile_x = tile_idx % max_columns + mapping_start_tile_x;
    UBYTE tile_y = tile_idx / max_columns + mapping_start_tile_y;
    if(direction == COLLISION_SEARCH_DIR_RIGHT) {
        // Find the next tile without collisions (including the current tile idx)
        for(i = tile_x; i < mapping_start_tile_x + max_columns; i++) {
            tile_id = tile_at(i, tile_y);
            if(tile_id != COLLISION_ALL && tile_id != TILE_PROP_LADDER && tile_id != COLLISION_LEFT) return tile_idx;
            tile_idx++;
        }
        return -1;
    } else if(direction == COLLISION_SEARCH_DIR_LEFT) {
        // Find the next tile without collisions (including the current tile idx)
        for(i = tile_x; i >= mapping_start_tile_x; i--) {
            tile_id = tile_at(i, tile_y);
            if(tile_id != COLLISION_ALL && tile_id != TILE_PROP_LADDER && tile_id != COLLISION_RIGHT) return tile_idx;
            tile_idx--;
        }
        return -1;
    } else if(direction == COLLISION_SEARCH_DIR_UP) {
        // Find the next tile without collisions (including the current tile idx)
        for(i = tile_y; i >= mapping_start_tile_y; i--) {
            tile_id = tile_at(tile_x, i);
            if(tile_id != COLLISION_ALL && tile_id != TILE_PROP_LADDER && tile_id != COLLISION_BOTTOM) return tile_idx;
            tile_idx -= max_columns;
        }
        return -1;
    } else if(direction == COLLISION_SEARCH_DIR_DOWN) {
        // Find the next tile without collisions (including the current tile idx)
        for(i = tile_y; i < mapping_start_tile_y + max_rows; i++) {
            tile_id = tile_at(tile_x, i);
            if(tile_id != COLLISION_ALL && tile_id != TILE_PROP_LADDER && tile_id != COLLISION_TOP) return tile_idx;
            tile_idx += max_columns;
        }
        return -1;
    }
    return tile_idx;
}

void CursorController(SCRIPT_CTX * THIS) OLDCALL BANKED {
    // Variable index is passed (in ARG0) for result storage, so now we can assign the results back to this variable
    int16_t* results = VM_REF_TO_PTR(*(int16_t *)VM_REF_TO_PTR(FN_ARG0));
    int16_t* current_index = VM_REF_TO_PTR(*(int16_t *)VM_REF_TO_PTR(FN_ARG1));
    int16_t base_pos_y = *(int16_t*)VM_REF_TO_PTR(FN_ARG2) << 4 << 1; // 4.2.0 fix
	int16_t base_pos_x = *(int16_t*)VM_REF_TO_PTR(FN_ARG3) << 4 << 1; // 4.2.0 fix
	int16_t ex_offset_pos_y = *(int16_t*)VM_REF_TO_PTR(FN_ARG4) << 4 << 1; // 4.2.0 fix
	int16_t ex_offset_pos_x = *(int16_t*)VM_REF_TO_PTR(FN_ARG5) << 4 << 1; // 4.2.0 fix
	int16_t move_step_y = *(int16_t*)VM_REF_TO_PTR(FN_ARG6) << 4 << 1; // 4.2.0 fix
	int16_t move_step_x = *(int16_t*)VM_REF_TO_PTR(FN_ARG7) << 4 << 1; // 4.2.0 fix
    UBYTE max_rows = *(uint8_t*)VM_REF_TO_PTR(EX_FN_ARG8);
    UBYTE max_columns = *(uint8_t*)VM_REF_TO_PTR(EX_FN_ARG9);

    UBYTE mapping_start_tile_y = *(uint8_t*)VM_REF_TO_PTR(EX_FN_ARG10);
    UBYTE mapping_start_tile_x = *(uint8_t*)VM_REF_TO_PTR(EX_FN_ARG11);

    uint16_t flags = *(uint16_t*)VM_REF_TO_PTR(EX_FN_ARG12);
    UBYTE is_easing_movement = flags >> 15;
    UBYTE is_move_opposite_dir_at_edge = flags << 1 >> 15;
    UBYTE is_move_to_opposite_end_on_edge = flags << 2 >> 15;
    UBYTE is_bounce_at_edge = flags << 3 >> 15;
    UBYTE is_move_while_btn_held = flags << 4 >> 15;
    UBYTE is_enable_continuous_a_btn_held = flags << 5 >> 15;
    // Show actor on top of overlay or not
    show_actors_on_overlay = flags << 6 >> 15;
    UBYTE is_use_mappings = flags << 7 >> 15;
    UBYTE is_change_index_immediately = flags << 8 >> 15;

    /*
    if(is_bounce_at_edge) {
        is_move_opposite_dir_at_edge = false;
        is_move_to_opposite_end_on_edge = false;
    }*/

    UBYTE actor_selected_loop_state_id = *(uint8_t*)VM_REF_TO_PTR(EX_FN_ARG13);
    UBYTE actor_selected_active_state_id = *(uint8_t*)VM_REF_TO_PTR(EX_FN_ARG14);
    UBYTE actor_cancel_state_id = *(uint8_t*)VM_REF_TO_PTR(EX_FN_ARG15);
    UBYTE actor_enter_state_id = *(uint8_t*)VM_REF_TO_PTR(EX_FN_ARG16);
    UBYTE actor_activated_state_id = *(uint8_t*)VM_REF_TO_PTR(EX_FN_ARG17);

    int16_t actor_id = *(int16_t*)VM_REF_TO_PTR(EX_FN_ARG18);
    actor_t* actor = actors + (UBYTE)(actor_id);

    //BYTE cursorIndex = *current_index;
    BYTE currentKeyPressed = CURSOR_BUTTON_PRESSED_NULL;

    UBYTE is_boundary_reached = FALSE;
    UBYTE is_ignore_buttons_press = FALSE;
    UBYTE is_ignore_cursor_pos_change = FALSE;
    UBYTE is_jump_cursor_index = FALSE;

	//int16_t animOffsetAmountX; // = ((actor->bounds.right - actor->bounds.left) << 1) >> 2;//((actor->bounds.right - actor->bounds.left) << 4) - 48;
	//int16_t animOffsetAmountY; // = ((actor->bounds.bottom - actor->bounds.top) << 1) >> 2;
	
	if(animOffsetAmountX == NULL || animOffsetAmountY == NULL) {
		animOffsetAmountX = 400; //((actor->bounds.right - actor->bounds.left) << 1) - (((actor->bounds.right - actor->bounds.left) << 1) / 2);
		animOffsetAmountY = 400; //((actor->bounds.bottom - actor->bounds.top) << 1);
	}
	
    // If initial call, set to default states
    // NOTE: To initialize properly, results should be set to 0 before calling this plugin
	if(*results == 0) {
        ChangeActorState(THIS, actor_id, actor_activated_state_id, CURSOR_ANIM_STATE_ACTIVATED);
		SET_FLAG(actor->flags, ACTOR_FLAG_ANIM_NOLOOP); //actor->anim_noloop = TRUE;
        previousButtonPressed = CURSOR_BUTTON_PRESSED_NULL;
        cursorIndex = *current_index;
        prevCursorIndex = cursorIndex;
        actor->pos.x = base_pos_x + (cursorIndex % max_columns * move_step_x);
        actor->pos.y = base_pos_y + (cursorIndex / max_columns * move_step_y);
        accumPosX = actor->pos.x;
        accumPosY = actor->pos.y;
		CLR_FLAG(actor->flags, ACTOR_FLAG_HIDDEN); //actor->hidden = FALSE;
        *results = CURSOR_BUTTON_PRESSED_NULL;
	} else {
        currentKeyPressed = CURSOR_BUTTON_PRESSED_NULL;
        if(INPUT_A) currentKeyPressed = CURSOR_BUTTON_PRESSED_A;
        if(INPUT_B) currentKeyPressed = CURSOR_BUTTON_PRESSED_B;
        if(INPUT_UP) {
            currentKeyPressed = CURSOR_BUTTON_PRESSED_UP;
            if(INPUT_A && !is_enable_continuous_a_btn_held) {
                currentKeyPressed = CURSOR_BUTTON_PRESSED_A;
                is_ignore_buttons_press = TRUE;
                btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT;
            }
        }
        if(INPUT_DOWN) {
            currentKeyPressed = CURSOR_BUTTON_PRESSED_DOWN;
            if(INPUT_A && !is_enable_continuous_a_btn_held) {
                currentKeyPressed = CURSOR_BUTTON_PRESSED_A;
                is_ignore_buttons_press = TRUE;
                btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT;
            }
        }
        if(INPUT_LEFT) {
            currentKeyPressed = CURSOR_BUTTON_PRESSED_LEFT;
            // Don't allow left/right inputs if up/down buttons are pressed
            if(INPUT_UP) {
                currentKeyPressed = CURSOR_BUTTON_PRESSED_UP;
                is_ignore_buttons_press = TRUE;
                is_bounce_at_edge = FALSE;
                btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT;
            }
            if(INPUT_DOWN) {
                currentKeyPressed = CURSOR_BUTTON_PRESSED_DOWN;
                is_ignore_buttons_press = TRUE;
                is_bounce_at_edge = FALSE;
                btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT;
            }
            if(INPUT_A && !is_enable_continuous_a_btn_held) {
                currentKeyPressed = CURSOR_BUTTON_PRESSED_A;
                is_ignore_buttons_press = TRUE;
                btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT;
            }
        }
        if(INPUT_RIGHT) {
            currentKeyPressed = CURSOR_BUTTON_PRESSED_RIGHT;
            // Don't allow left/right inputs if up/down buttons are pressed
            if(INPUT_UP) {
                currentKeyPressed = CURSOR_BUTTON_PRESSED_UP;
                is_ignore_buttons_press = TRUE;
                is_bounce_at_edge = FALSE;
                btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT;
            }
            if(INPUT_DOWN) {
                currentKeyPressed = CURSOR_BUTTON_PRESSED_DOWN;
                is_ignore_buttons_press = TRUE;
                is_bounce_at_edge = FALSE;
                btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT;
            }
            if(INPUT_A && !is_enable_continuous_a_btn_held) {
                currentKeyPressed = CURSOR_BUTTON_PRESSED_A;
                is_ignore_buttons_press = TRUE;
                btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT;
            }
        }
        if(INPUT_START) currentKeyPressed = CURSOR_BUTTON_PRESSED_START;
        if(INPUT_SELECT) currentKeyPressed = CURSOR_BUTTON_PRESSED_SELECT;
    }

    if(is_move_while_btn_held) {
        if(btnHeldCounter > 0) {
            btnHeldCounter--;
            is_move_while_btn_held = FALSE;
            isInputHeld = TRUE;
        }
    }

    is_ignore_buttons_press = (posOffsetX != 0 || posOffsetY != 0) && is_move_while_btn_held;

    if(!is_ignore_buttons_press) {
        if((INPUT_A_PRESSED && !isInputHeld) || (INPUT_A && is_move_while_btn_held && is_enable_continuous_a_btn_held)) {
            ChangeActorState(THIS, actor_id, actor_selected_active_state_id, CURSOR_ANIM_STATE_SELECTED);
			SET_FLAG(actor->flags, ACTOR_FLAG_ANIM_NOLOOP); //actor->anim_noloop = TRUE;
            isInputHeld = TRUE;
            btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT;
            *results = CURSOR_BUTTON_PRESSED_A;
        } else if(INPUT_B_PRESSED && !isInputHeld) {
            ChangeActorState(THIS, actor_id, actor_cancel_state_id, CURSOR_ANIM_STATE_CANCEL);
			SET_FLAG(actor->flags, ACTOR_FLAG_ANIM_NOLOOP); //actor->anim_noloop = TRUE;
            isInputHeld = TRUE;
            btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT;
            *results = CURSOR_BUTTON_PRESSED_B;
        } else if((INPUT_LEFT_PRESSED && !isInputHeld) || (INPUT_LEFT && is_move_while_btn_held)) {
            prevCursorIndex = cursorIndex;
            cursorIndex--;
            accumPosX -= move_step_x;
            if((cursorIndex + 1) % max_columns == 0) {
				if(is_move_to_opposite_end_on_edge) {
                    cursorIndex += max_columns;
                    accumPosX += move_step_x * max_columns;
                    // Check whether if the new cursor index has landed on a collision
                    // and adjust the index to the next (including the current index) non-collision index
                    if(is_use_mappings) {
                        cursorIndex = FindNextNonCollisionTile(cursorIndex, max_columns, max_rows, COLLISION_SEARCH_DIR_LEFT, mapping_start_tile_x, mapping_start_tile_y);
                        accumPosX = base_pos_x + (cursorIndex % max_columns) * move_step_x;
                        // If cursor index has not changed, prevent bouncing effect
                        if(cursorIndex == prevCursorIndex && !is_bounce_at_edge) is_easing_movement = FALSE;
                    }
                } else {
                    cursorIndex++;
                    accumPosX += move_step_x;
                }
                is_boundary_reached = TRUE;
            } else {
                // Check whether if the new cursor index has landed on a collision
                UBYTE collision_id = tile_at(cursorIndex % max_columns + mapping_start_tile_x, cursorIndex / max_columns + mapping_start_tile_y);
                if(is_use_mappings && (collision_id == COLLISION_ALL || collision_id == COLLISION_RIGHT || collision_id == TILE_PROP_LADDER)) {
                    // Get the next non-collision tile towards the destination direction
                    int16_t next_cursor_idx = FindNextNonCollisionTile(cursorIndex, max_columns, max_rows, COLLISION_SEARCH_DIR_LEFT, mapping_start_tile_x, mapping_start_tile_y);
                    if(is_move_to_opposite_end_on_edge) {
                        // Check if the rest of the tiles are collision free or not
                        // If there's a collision, we move to the opposite direction and set the cursor index to the first non-collision index
                        if(next_cursor_idx == -1) {
                            // Move to the end index of the current row
                            cursorIndex = max_columns * (cursorIndex / max_columns + 1) - 1;
                            // Search for the next non-collision tile from the beginning
                            cursorIndex = FindNextNonCollisionTile(cursorIndex, max_columns, max_rows, COLLISION_SEARCH_DIR_LEFT, mapping_start_tile_x, mapping_start_tile_y);
                            accumPosX = base_pos_x + (cursorIndex % max_columns) * move_step_x;
                            is_boundary_reached = TRUE;
                            // If cursor index has not changed, prevent bouncing effect
                            if(cursorIndex == prevCursorIndex && !is_bounce_at_edge) is_easing_movement = FALSE;
                        } else {
                            // If a jump collision property was found, we want to jump over it until the next non-collision tile index
                            if(collision_id == TILE_PROP_LADDER) {
                                cursorIndex = next_cursor_idx;
                                accumPosX = base_pos_x + (cursorIndex % max_columns) * move_step_x;
                                is_jump_cursor_index = TRUE;
                            } else {
                                // Collision found, so revert index back
                                cursorIndex++;
                                accumPosX += move_step_x;
                                // Prevent bouncing effect
                                if(!is_bounce_at_edge) is_easing_movement = FALSE;
                            }
                        }
                    } else {
                        // If a jump collision property was found, we want to jump over it until the next non-collision tile index
                        if(collision_id == TILE_PROP_LADDER && next_cursor_idx != -1) {
                            cursorIndex = next_cursor_idx;
                            accumPosX = base_pos_x + (cursorIndex % max_columns) * move_step_x;
                            is_jump_cursor_index = TRUE;
                        } else {
                            // Collision found, so revert index back
                            cursorIndex++;
                            accumPosX += move_step_x;
                        }
                    }
                    is_boundary_reached = TRUE;
                }
            }
            if(is_easing_movement) {
                if(is_boundary_reached && is_move_opposite_dir_at_edge || is_jump_cursor_index) {
                    if(is_use_mappings) {
						posOffsetX = actor->pos.x - (base_pos_x + (cursorIndex % max_columns) * move_step_x);
						//posOffsetX = (actor->pos.x << 1) - (base_pos_x + (cursorIndex % max_columns) * move_step_x);
                    } else {
                        posOffsetX = -move_step_x * (max_columns - 1);
                    }
                    animCounter = move_step_x / CURSOR_STEP_SPEED_DIVIDER_LONG;
                } else if(is_boundary_reached && !is_move_opposite_dir_at_edge) {
                    if(is_bounce_at_edge) {
                        // Don't bounce if we only have a single column
                        if(max_columns != 1) {
                            posOffsetX = CURSOR_BOUNCE_AMOUNT_LEFT;
                            animCounter = CURSOR_BOUNCE_ANIM_WAIT_LEFT;
                        }
                    } else {
                        posOffsetX = animOffsetAmountX;// move_step_x - (move_step_x / CURSOR_STEP_SPEED_DIVIDER_SHORT);
                        animCounter = CURSOR_ANIM_COUNTER_MAX;//move_step_x / CURSOR_STEP_SPEED_DIVIDER_OPPOSITE_BOUNDARY;
                        // Ignore updating the cursor position for button press on first time
                        // to prevent unexpected offset being applied
                        is_ignore_cursor_pos_change = TRUE;
                    }
                } else {
                    posOffsetX = animOffsetAmountX;//move_step_x;
                    animCounter = CURSOR_ANIM_COUNTER_MAX;//move_step_x / CURSOR_STEP_SPEED_DIVIDER_SHORT;
                }
            }
            isInputHeld = TRUE;
            *results = CURSOR_BUTTON_PRESSED_LEFT;
        } else if((INPUT_RIGHT_PRESSED && !isInputHeld) || (INPUT_RIGHT && is_move_while_btn_held)) {
            prevCursorIndex = cursorIndex;
            cursorIndex++;
            accumPosX += move_step_x;
            if(cursorIndex % max_columns == 0) {
                if(is_move_to_opposite_end_on_edge) {
                    cursorIndex -= max_columns;
                    accumPosX -= move_step_x * max_columns;
                    // Check whether if the new cursor index has landed on a collision
                    // and adjust the index to the next (including the current index) non-collision index
                    if(is_use_mappings) {
                        cursorIndex = FindNextNonCollisionTile(cursorIndex, max_columns, max_rows, COLLISION_SEARCH_DIR_RIGHT, mapping_start_tile_x, mapping_start_tile_y);
                        accumPosX = base_pos_x + (cursorIndex % max_columns) * move_step_x;
                        // If cursor index has not changed, prevent bouncing effect
                        if(cursorIndex == prevCursorIndex && !is_bounce_at_edge) is_easing_movement = FALSE;
                    }
                } else {
                    cursorIndex--;
                    accumPosX -= move_step_x;
                }
                is_boundary_reached = TRUE;
            } else {
                // Check whether if the new cursor index has landed on a collision
                UBYTE collision_id = tile_at(cursorIndex % max_columns + mapping_start_tile_x, cursorIndex / max_columns + mapping_start_tile_y);
                if(is_use_mappings && (collision_id == COLLISION_ALL || collision_id == COLLISION_LEFT || collision_id == TILE_PROP_LADDER)) {
                    // Get the next non-collision tile towards the destination direction
                    int16_t next_cursor_idx = FindNextNonCollisionTile(cursorIndex, max_columns, max_rows, COLLISION_SEARCH_DIR_RIGHT, mapping_start_tile_x, mapping_start_tile_y);
                    if(is_move_to_opposite_end_on_edge) {
                        // Check if the rest of the tiles are collision free or not
                         // If there's a collision, we move to the opposite direction and set the cursor index to the first non-collision index
                        if(next_cursor_idx == -1) {
                            // Move to the start index of the current row
                            cursorIndex = cursorIndex / max_columns * max_columns;
                            // Search for the next non-collision tile from the beginning
                            cursorIndex = FindNextNonCollisionTile(cursorIndex, max_columns, max_rows, COLLISION_SEARCH_DIR_RIGHT, mapping_start_tile_x, mapping_start_tile_y);
                            accumPosX = base_pos_x + (cursorIndex % max_columns) * move_step_x;
                            // If cursor index has not changed, prevent bouncing effect
                            if(cursorIndex == prevCursorIndex && !is_bounce_at_edge) is_easing_movement = FALSE;
                        } else {
                            // If a jump collision property was found, we want to jump over it until the next non-collision tile index
                            if(collision_id == TILE_PROP_LADDER) {
                                cursorIndex = next_cursor_idx;
                                accumPosX = base_pos_x + (cursorIndex % max_columns) * move_step_x;
                                is_jump_cursor_index = TRUE;
                            } else {
                                // Collision found, so revert index back
                                cursorIndex--;
                                accumPosX -= move_step_x;
                                // Prevent bouncing effect
                                if(!is_bounce_at_edge) is_easing_movement = FALSE;
                            }
                        }
                    } else {
                        // If a jump collision property was found, we want to jump over it until the next non-collision tile index
                        if(collision_id == TILE_PROP_LADDER && next_cursor_idx != -1) {
                            cursorIndex = next_cursor_idx;
                            accumPosX = base_pos_x + (cursorIndex % max_columns) * move_step_x;
                            is_jump_cursor_index = TRUE;
                        } else {
                            // Collision found, so revert index back
                            cursorIndex--;
                            accumPosX -= move_step_x;
                        }
                    }
                    is_boundary_reached = TRUE;
                }
            }
            if(is_easing_movement) {
                if(is_boundary_reached && is_move_opposite_dir_at_edge || is_jump_cursor_index) {
                    if(is_use_mappings) {
						posOffsetX = actor->pos.x - (base_pos_x + (cursorIndex % max_columns) * move_step_x);
						//posOffsetX = (actor->pos.x << 1) - (base_pos_x + (cursorIndex % max_columns) * move_step_x);
                    } else {
                        posOffsetX = move_step_x * (max_columns - 1);
                    }
                    animCounter = move_step_x / CURSOR_STEP_SPEED_DIVIDER_LONG;
                } else if(is_boundary_reached && !is_move_opposite_dir_at_edge) {
                    if(is_bounce_at_edge) {
                        // Don't bounce if we only have a single column
                        if(max_columns != 1) {
                            posOffsetX = CURSOR_BOUNCE_AMOUNT_RIGHT;
                            animCounter = CURSOR_BOUNCE_ANIM_WAIT_RIGHT;
                        }
                    } else {
                        posOffsetX = -animOffsetAmountX; //-move_step_x + (move_step_x / CURSOR_STEP_OPPOSITE_BOUNDARY_DISTANCE_DIVIDER);
                        animCounter = CURSOR_ANIM_COUNTER_MAX; //move_step_x / CURSOR_STEP_SPEED_DIVIDER_OPPOSITE_BOUNDARY;
                        // Ignore updating the cursor position for button press on first time
                        // to prevent unexpected offset being applied
                        is_ignore_cursor_pos_change = TRUE;
                    }
                } else {
                    posOffsetX = -animOffsetAmountX; //-move_step_x;
                    animCounter = CURSOR_ANIM_COUNTER_MAX; //move_step_x / CURSOR_STEP_SPEED_DIVIDER_SHORT;
                }
            }
            isInputHeld = TRUE;
            *results = CURSOR_BUTTON_PRESSED_RIGHT;
        } else if((INPUT_UP_PRESSED && !isInputHeld) || (INPUT_UP && is_move_while_btn_held)) {
            prevCursorIndex = cursorIndex;
            cursorIndex -= max_columns;
            accumPosY -= move_step_y;
            if(cursorIndex < 0) {
                if(is_move_to_opposite_end_on_edge) {
                    cursorIndex += max_columns * max_rows;
                    accumPosY += move_step_y * max_rows;
                    // Check whether if the new cursor index has landed on a collision
                    // and adjust the index to the next (including the current index) non-collision index
                    if(is_use_mappings) {
                        cursorIndex = FindNextNonCollisionTile(cursorIndex, max_columns, max_rows, COLLISION_SEARCH_DIR_UP, mapping_start_tile_x, mapping_start_tile_y);
                        accumPosY = base_pos_y + (cursorIndex / max_columns) * move_step_y;
                        // If cursor index has not changed, prevent bouncing effect
                        if(cursorIndex == prevCursorIndex && !is_bounce_at_edge) is_easing_movement = FALSE;
                    }
                } else {
                    cursorIndex += max_columns;
                    accumPosY += move_step_y;
                }
                is_boundary_reached = TRUE;
            } else {
                // Check whether if the new cursor index has landed on a collision
                UBYTE collision_id = tile_at(cursorIndex % max_columns + mapping_start_tile_x, cursorIndex / max_columns + mapping_start_tile_y);
                if(is_use_mappings && (collision_id == COLLISION_ALL || collision_id == COLLISION_BOTTOM || collision_id == TILE_PROP_LADDER)) {
                    // Get the next non-collision tile towards the destination direction
                    int16_t next_cursor_idx = FindNextNonCollisionTile(cursorIndex, max_columns, max_rows, COLLISION_SEARCH_DIR_UP, mapping_start_tile_x, mapping_start_tile_y);
                    if(is_move_to_opposite_end_on_edge) {
                        // Check if the rest of the tiles are collision free or not
                        // If there's a collision, we move to the opposite direction and set the cursor index to the first non-collision index 
                        if(next_cursor_idx == -1) {
                            // Move to end index of the current column
                            cursorIndex = (max_rows * max_columns - max_columns) + cursorIndex % max_columns;
                            // Search for the next non-collision tile from the beginning
                            cursorIndex = FindNextNonCollisionTile(cursorIndex, max_columns, max_rows, COLLISION_SEARCH_DIR_UP, mapping_start_tile_x, mapping_start_tile_y);
                            accumPosY = base_pos_y + (cursorIndex / max_columns) * move_step_y;
                            // If cursor index has not changed, prevent bouncing effect
                            if(cursorIndex == prevCursorIndex && !is_bounce_at_edge) is_easing_movement = FALSE;
                        } else {
                            // If a jump collision property was found, we want to jump over it until the next non-collision tile index
                            if(collision_id == TILE_PROP_LADDER) {
                                cursorIndex = next_cursor_idx;
                                accumPosY = base_pos_y + (cursorIndex / max_columns) * move_step_y;
                                is_jump_cursor_index = TRUE;
                            } else {
                                // Collision found, so revert index back
                                cursorIndex += max_columns;
                                accumPosY += move_step_y;
                                // Prevent bouncing effect
                                if(!is_bounce_at_edge) is_easing_movement = FALSE;
                            }
                        }
                    } else {
                        // If a jump collision property was found, we want to jump over it until the next non-collision tile index
                        if(collision_id == TILE_PROP_LADDER && next_cursor_idx != -1) {
                            cursorIndex = next_cursor_idx;
                            accumPosY = base_pos_y + (cursorIndex / max_columns) * move_step_y;
                            is_jump_cursor_index = TRUE;
                        } else {
                            // Collision found, so revert index back
                            cursorIndex += max_columns;
                            accumPosY += move_step_y;
                        }
                    }
                    is_boundary_reached = TRUE;
                }
            }
            if(is_easing_movement) {
                if(is_boundary_reached && is_move_opposite_dir_at_edge || is_jump_cursor_index) {
                    if(is_use_mappings) {
                        posOffsetY = actor->pos.y - (base_pos_y + (cursorIndex / max_columns) * move_step_y);
                    } else {
                        posOffsetY = -move_step_y * (max_rows - 1);
                    }
                    
                    animCounter = move_step_y / CURSOR_STEP_SPEED_DIVIDER_LONG;
                } else if(is_boundary_reached && !is_move_opposite_dir_at_edge) {
                    if(is_bounce_at_edge) {
                        // Don't bounce if we only have a single row
                        if(max_rows != 1) {
                            posOffsetY = CURSOR_BOUNCE_AMOUNT_TOP;
                            animCounter = CURSOR_BOUNCE_ANIM_WAIT_TOP;
                        }
                    } else {
                        posOffsetY = animOffsetAmountY;//move_step_y - (move_step_y / CURSOR_STEP_OPPOSITE_BOUNDARY_DISTANCE_DIVIDER);
                        animCounter = CURSOR_ANIM_COUNTER_MAX;//move_step_y / CURSOR_STEP_SPEED_DIVIDER_OPPOSITE_BOUNDARY;
                        // Ignore updating the cursor position for button press on first time
                        // to prevent unexpected offset being applied
                        is_ignore_cursor_pos_change = TRUE;
                    }
                } else {
                    posOffsetY = animOffsetAmountY;//move_step_y;
                    animCounter = CURSOR_ANIM_COUNTER_MAX;//move_step_y / CURSOR_STEP_SPEED_DIVIDER_SHORT;
                }
            }
            isInputHeld = TRUE;
            *results = CURSOR_BUTTON_PRESSED_UP;
        } else if((INPUT_DOWN_PRESSED && !isInputHeld) || (INPUT_DOWN && is_move_while_btn_held)) {
            prevCursorIndex = cursorIndex;
            cursorIndex += max_columns;
            accumPosY += move_step_y;
            if(cursorIndex >= max_columns * max_rows) {
                if(is_move_to_opposite_end_on_edge) {
                    cursorIndex -= max_columns * max_rows;
                    accumPosY -= move_step_y * max_rows;
                    // Check whether if the new cursor index has landed on a collision
                    // and adjust the index to the next (including the current index) non-collision index
                    if(is_use_mappings) {
                        cursorIndex = FindNextNonCollisionTile(cursorIndex, max_columns, max_rows, COLLISION_SEARCH_DIR_DOWN, mapping_start_tile_x, mapping_start_tile_y);
                        accumPosY = base_pos_y + (cursorIndex / max_columns) * move_step_y;
                        // If cursor index has not changed, prevent bouncing effect
                        if(cursorIndex == prevCursorIndex && !is_bounce_at_edge) is_easing_movement = FALSE;
                    }
                } else {
                    cursorIndex -= max_columns;
                    accumPosY -= move_step_y;
                }
                is_boundary_reached = TRUE;
            } else {
                // Check whether if the new cursor index has landed on a collision
                UBYTE collision_id = tile_at(cursorIndex % max_columns + mapping_start_tile_x, cursorIndex / max_columns + mapping_start_tile_y);
                if(is_use_mappings && (collision_id == COLLISION_ALL || collision_id == COLLISION_TOP || collision_id == TILE_PROP_LADDER)) {
                    // Get the next non-collision tile towards the destination direction
                    int16_t next_cursor_idx = FindNextNonCollisionTile(cursorIndex, max_columns, max_rows, COLLISION_SEARCH_DIR_DOWN, mapping_start_tile_x, mapping_start_tile_y);
                    if(is_move_to_opposite_end_on_edge) {
                        // Check if the rest of the tiles are collision free or not
                        // If there's a collision, we move to the opposite direction and set the cursor index to the first non-collision index
                        if(next_cursor_idx == -1) {
                            // Move to start index of the current column
                            cursorIndex = cursorIndex % max_columns;
                            // Search for the next non-collision tile from the beginning
                            cursorIndex = FindNextNonCollisionTile(cursorIndex, max_columns, max_rows, COLLISION_SEARCH_DIR_DOWN, mapping_start_tile_x, mapping_start_tile_y);
                            accumPosY = base_pos_y + (cursorIndex / max_columns) * move_step_y;
                            // If cursor index has not changed, prevent bouncing effect
                            if(cursorIndex == prevCursorIndex && !is_bounce_at_edge) is_easing_movement = FALSE;
                        } else {
                            // If a jump collision property was found, we want to jump over it until the next non-collision tile index
                            if(collision_id == TILE_PROP_LADDER) {
                                cursorIndex = next_cursor_idx;
                                accumPosY = base_pos_y + (cursorIndex / max_columns) * move_step_y;
                                is_jump_cursor_index = TRUE;
                            } else {
                                // Collision found, so revert index back
                                cursorIndex -= max_columns;
                                accumPosY -= move_step_y;
                                // Prevent bouncing effect
                                if(!is_bounce_at_edge) is_easing_movement = FALSE;
                            }
                        }
                    } else {
                        // If a jump collision property was found, we want to jump over it until the next non-collision tile index
                        if(collision_id == TILE_PROP_LADDER && next_cursor_idx != -1) {
                            cursorIndex = next_cursor_idx;
                            accumPosY = base_pos_y + (cursorIndex / max_columns) * move_step_y;
                            is_jump_cursor_index = TRUE;
                        } else {
                            // Collision found, so revert index back
                            cursorIndex -= max_columns;
                            accumPosY -= move_step_y;
                        }
                    }
                    is_boundary_reached = TRUE;
                }
            }
            if(is_easing_movement) {
                if(is_boundary_reached && is_move_opposite_dir_at_edge || is_jump_cursor_index) {
                    if(is_use_mappings) {
                        posOffsetY = actor->pos.y - (base_pos_y + (cursorIndex / max_columns) * move_step_y);
                    } else {
                        posOffsetY = move_step_y * (max_rows - 1);
                    }
                    animCounter = move_step_y / CURSOR_STEP_SPEED_DIVIDER_LONG; //move_step_y * (max_rows - 1) / CURSOR_STEP_SPEED_DIVIDER_LONG;
                } else if(is_boundary_reached && !is_move_opposite_dir_at_edge) {
                    if(is_bounce_at_edge) {
                        // Don't bounce if we only have a single row
                        if(max_rows != 1) {
                            posOffsetY = CURSOR_BOUNCE_AMOUNT_BOTTOM; //-move_step_y / CURSOR_STEP_BOUNCE_AMOUNT_DIVIDER;
                            animCounter = CURSOR_BOUNCE_ANIM_WAIT_BOTTOM; //move_step_y / CURSOR_STEP_SPEED_DIVIDER_OPPOSITE_BOUNDARY;
                        }
                    } else {
                        posOffsetY = -animOffsetAmountY;//-move_step_y + (move_step_y / CURSOR_STEP_OPPOSITE_BOUNDARY_DISTANCE_DIVIDER);
                        animCounter = CURSOR_ANIM_COUNTER_MAX;//move_step_y / CURSOR_STEP_SPEED_DIVIDER_OPPOSITE_BOUNDARY;
                        // Ignore updating the cursor position for button press on first time
                        // to prevent unexpected offset being applied
                        is_ignore_cursor_pos_change = TRUE;
                    }
                } else {
                    posOffsetY = -animOffsetAmountY;//-move_step_y;
                    animCounter = CURSOR_ANIM_COUNTER_MAX;//move_step_y / CURSOR_STEP_SPEED_DIVIDER_SHORT;
                }
            }
            isInputHeld = TRUE;
            *results = CURSOR_BUTTON_PRESSED_DOWN;
        } else {
            isInputHeld = FALSE;
        }
    }

    if(is_easing_movement) {
        if(posOffsetX < 0) {
            posOffsetX += animCounter--;
            if(posOffsetX > 0) posOffsetX = 0;
        } else if(posOffsetX > 0) {
            posOffsetX -= animCounter--;
            if(posOffsetX < 0) posOffsetX = 0;
        }
        if(posOffsetY < 0) {
            posOffsetY += animCounter--;
            if(posOffsetY > 0) posOffsetY = 0;
        } else if(posOffsetY > 0) {
            posOffsetY -= animCounter--;
            if(posOffsetY < 0) posOffsetY = 0;
        }
    }

    if(is_boundary_reached && !is_bounce_at_edge) {
        // No slide-in animations
        if(!is_move_to_opposite_end_on_edge) {
            posOffsetX = 0;
            posOffsetY = 0;
            animCounter = 0;
        }
        // Slight slide-in animations
        if(is_easing_movement && is_move_to_opposite_end_on_edge && !is_move_opposite_dir_at_edge) {
            //int16_t orgPosOffsetY = posOffsetY;
            posOffsetX -= posOffsetX / 2;
            posOffsetY -= posOffsetY / 2;
        }
    }

    // If all inputs are released
    if(!INPUT_ANY) {
        // Allow cursor movement without extra wait when buttons are released and pressed again in a small interval
        if(btnHeldFirstTime == TRUE) btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT / 4;
        if(is_boundary_reached && is_move_opposite_dir_at_edge) btnHeldCounter = 0;
        // Reset flag to indicate that the button is pressed for the first time
        btnHeldFirstTime = FALSE;
    }

    if(isInputHeld) {
        btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT;
        // If button held for the first time, add some more delays until moving further
        if(!btnHeldFirstTime) {
            btnHeldFirstTime = TRUE;
            btnHeldCounter *= 2;
        }
    }

    // If a different button is pressed from previously, respond a bit faster
    if((currentKeyPressed != -1 && previousButtonPressed != -1) && (currentKeyPressed != previousButtonPressed)) {
        btnHeldFirstTime = TRUE;
        btnHeldCounter = CURSOR_BUTTON_HELD_WAIT_FRAME_AMOUNT / 4;
    }

    previousButtonPressed = currentKeyPressed;

	// If cursor index has changed from previous selection
	/*
    if(prevCursorIndex != cursorIndex) {
        // Play enter state if cursor index has changed
        if(posOffsetX == 0 && posOffsetY == 0 && currentAnimStateID != CURSOR_ANIM_STATE_ENTER) {
            ChangeActorState(THIS, actor_id, actor_enter_state_id, CURSOR_ANIM_STATE_ENTER);
			CLR_FLAG(actor->flags, ACTOR_FLAG_ANIM_NOLOOP); //actor->anim_noloop = FALSE;
            prevCursorIndex = cursorIndex;
        }
    }*/

    // If state is activated or enter state, we only play it once, so now change to default state
    if(currentAnimStateID == CURSOR_ANIM_STATE_ACTIVATED || currentAnimStateID == CURSOR_ANIM_STATE_ENTER) {
        if(actor->frame == actor->animations->end) {
            ChangeActorState(THIS, actor_id, 0, CURSOR_ANIM_STATE_DEFAULT);
			CLR_FLAG(actor->flags, ACTOR_FLAG_ANIM_NOLOOP); //actor->anim_noloop = FALSE;
        }
    }
    // If cancel state is triggered already, hide actor and set results to 0 if animation is ended
    else if(currentAnimStateID == CURSOR_ANIM_STATE_CANCEL) {
        // If cancel state was same as default, just return 0 immediately
        if(actor->frame == actor->animations->end || actor_cancel_state_id == 0) {
			SET_FLAG(actor->flags, ACTOR_FLAG_HIDDEN); //actor->hidden = TRUE;
            ChangeActorState(THIS, actor_id, 0, CURSOR_ANIM_STATE_DEFAULT);
			CLR_FLAG(actor->flags, ACTOR_FLAG_ANIM_NOLOOP); //actor->anim_noloop = FALSE;
            *results = CURSOR_BUTTON_PRESSED_B;
            return;
        }
    }
    // If state is selected (selection activated first time), change to selection loop state
    else if(currentAnimStateID == CURSOR_ANIM_STATE_SELECTED) {
        // If cancel state was same as default, just return 0 immediately
        if(actor->frame == actor->animations->end || actor_cancel_state_id == 0) {
            ChangeActorState(THIS, actor_id, actor_selected_loop_state_id, CURSOR_ANIM_STATE_SELECTED_LOOP);
			CLR_FLAG(actor->flags, ACTOR_FLAG_ANIM_NOLOOP); //actor->anim_noloop = FALSE;
            *results = CURSOR_BUTTON_PRESSED_A;
            return;
        }
    }

    // Store current index to specified global variable
    if(is_change_index_immediately) {
        *current_index = cursorIndex;
    } else {
        if(posOffsetX == 0 && posOffsetY == 0) {
            *current_index = cursorIndex;
        } else {
            *current_index = prevCursorIndex;
        }
    }

    if(is_ignore_cursor_pos_change) return;

    // Update cursor positions
    actor->pos.x = accumPosX + posOffsetX + ex_offset_pos_x;
	actor->pos.y = accumPosY + posOffsetY + ex_offset_pos_y;
}
