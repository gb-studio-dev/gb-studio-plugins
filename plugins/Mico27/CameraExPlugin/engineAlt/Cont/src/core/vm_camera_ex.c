#pragma bank 255

// Camera Ex Plugin - VM entry points.

#include "vm_camera_ex.h"

#include "camera.h"
#include "camera_ex.h"
#include "actor.h"
#include "scroll.h"

// args (push order): median mode
void vm_camera_targets_begin(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE median = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    (void)THIS;
    camera_target_count = 0;
    camera_target_median = median;
}

// args (push order): actor index
void vm_camera_target_add(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE idx = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    (void)THIS;
    if (camera_target_count >= CAMERA_EX_MAX_TARGETS) return;
    if (idx >= MAX_ACTORS) return;
    camera_targets[camera_target_count] = idx;
    camera_target_count++;
}

// args (push order): speed, path mode
void vm_camera_set_smooth(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE speed = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    UBYTE mode = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    (void)THIS;
    camera_smooth_speed = speed;
    camera_smooth_mode = mode;
}

// args (push order): camera settings (lock flags)
void vm_camera_set_lock(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE settings = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    (void)THIS;
    camera_settings = settings;
    // Restart the prevent-backtracking high water mark from where the camera is
    // right now, otherwise a stale clamp from an earlier scene would hold it.
    camera_clamp_x = camera_x;
    camera_clamp_y = camera_y;
}

// VM_INVOKE handler.
// stack_frame: [0] X, [1] Y, [2] speed, [3] path mode, [4] settings to restore.
UBYTE camera_move_to_frames(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    UWORD target_x = stack_frame[0];
    UWORD target_y = stack_frame[1];
    (void)start;

    // Take manual control of the camera for the duration of the move.
    camera_settings &= ~(CAMERA_LOCK_FLAG);

    if (stack_frame[2] == 0) {
        // Instant: behave like the stock "Camera Set Position".
        camera_x = target_x;
        camera_y = target_y;
        camera_settings = (UBYTE)stack_frame[4];
        camera_clamp_x = camera_x;
        camera_clamp_y = camera_y;
        scroll_update();
        return TRUE;
    }

    if (((UWORD)camera_x == target_x) && ((UWORD)camera_y == target_y)) {
        camera_settings = (UBYTE)stack_frame[4];
        camera_clamp_x = camera_x;
        camera_clamp_y = camera_y;
        return TRUE;
    }

    camera_step_towards(target_x, target_y, (UBYTE)stack_frame[2], (UBYTE)stack_frame[3]);

    ((SCRIPT_CTX *)THIS)->waitable = TRUE;
    return FALSE;
}
