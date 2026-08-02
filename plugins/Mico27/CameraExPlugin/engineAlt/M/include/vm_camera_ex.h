#ifndef VM_CAMERA_EX_H
#define VM_CAMERA_EX_H

#include <gbdk/platform.h>

#include "vm.h"

// VM entry points for the Camera Ex Plugin.
//
// Follow targets are built up with a begin / add pair so that the number of
// targets is not limited by the number of VM function arguments:
//
//     vm_camera_targets_begin(median_mode)
//     vm_camera_target_add(actor_index)   x N
//
// Calling begin without any add leaves the camera following the player.

void vm_camera_targets_begin(SCRIPT_CTX * THIS) OLDCALL BANKED;
void vm_camera_target_add(SCRIPT_CTX * THIS) OLDCALL BANKED;
void vm_camera_set_smooth(SCRIPT_CTX * THIS) OLDCALL BANKED;
void vm_camera_set_lock(SCRIPT_CTX * THIS) OLDCALL BANKED;

// VM_INVOKE handler: waitable "move the camera to (X, Y)" along a chosen path.
// stack_frame[0] = X, [1] = Y, [2] = speed, [3] = path mode, [4] = camera
// settings to apply once the destination has been reached.
UBYTE camera_move_to_frames(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED;

#endif
