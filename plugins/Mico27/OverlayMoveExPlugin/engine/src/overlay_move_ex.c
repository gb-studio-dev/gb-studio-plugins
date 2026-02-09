#pragma bank 255

#include <gbdk/platform.h>
#include "system.h"
#include "vm.h"
#include "gbs_types.h"
#include "bankdata.h"
#include "math.h"
#include "ui.h"
#include "camera.h"

#define SCREEN_HEIGHT_SUBPX PX_TO_SUBPX(SCREEN_HEIGHT)
#define SCREEN_WIDTH_SUBPX PX_TO_SUBPX(SCREEN_WIDTH)

UBYTE vm_overlay_move_to_ex(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
	if (start){
        stack_frame[0] = PX_TO_SUBPX(win_pos_x);
        stack_frame[1] = PX_TO_SUBPX(win_pos_y);        
        stack_frame[2] = PX_TO_SUBPX(stack_frame[2]);// target x pos
        stack_frame[3] = PX_TO_SUBPX(stack_frame[3]);// target y pos
        
    }
    UBYTE flag = TRUE;
    UWORD win_pos_subpx = stack_frame[1];
    UWORD target_win_pos_subpx = stack_frame[3];
    // y should always move first
    if (win_pos_subpx != target_win_pos_subpx) {
        // move window up/down
        if (win_pos_subpx < target_win_pos_subpx){
			win_pos_subpx += stack_frame[4];
			if (win_pos_subpx > target_win_pos_subpx || win_pos_subpx > SCREEN_HEIGHT_SUBPX){
				win_pos_subpx = target_win_pos_subpx;
			}
		} else {
			win_pos_subpx -= stack_frame[4];
			if (win_pos_subpx < target_win_pos_subpx || win_pos_subpx > SCREEN_HEIGHT_SUBPX){
				win_pos_subpx = target_win_pos_subpx;
			}
		}
        ((SCRIPT_CTX *)THIS)->waitable = TRUE;
        flag = FALSE;
        win_pos_y = win_dest_pos_y = SUBPX_TO_PX(win_pos_subpx);
        stack_frame[1] = win_pos_subpx;
        stack_frame[3] = target_win_pos_subpx;
    }    
    win_pos_subpx = stack_frame[0];
    target_win_pos_subpx = stack_frame[2];
    if (win_pos_subpx != target_win_pos_subpx) {
        // move window right/left
        if (win_pos_subpx < target_win_pos_subpx){
			win_pos_subpx += stack_frame[4];
			if (win_pos_subpx > target_win_pos_subpx  || win_pos_subpx > SCREEN_WIDTH_SUBPX){
				win_pos_subpx = target_win_pos_subpx;
			}
		} else {
			win_pos_subpx -= stack_frame[4];
			if (win_pos_subpx < target_win_pos_subpx  || win_pos_subpx > SCREEN_WIDTH_SUBPX){
				win_pos_subpx = target_win_pos_subpx;
			}
		}
        ((SCRIPT_CTX *)THIS)->waitable = TRUE;
        flag = FALSE;
        win_pos_x = win_dest_pos_x = SUBPX_TO_PX(win_pos_subpx);
        stack_frame[0] = win_pos_subpx;
        stack_frame[2] = target_win_pos_subpx;
    }    
	return flag;    
}