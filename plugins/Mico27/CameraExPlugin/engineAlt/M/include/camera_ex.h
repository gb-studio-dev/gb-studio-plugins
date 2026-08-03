#ifndef CAMERA_EX_H
#define CAMERA_EX_H

#include <gbdk/platform.h>

// Camera Ex Plugin
//
// Everything declared here is additive: the stock camera globals still live in
// camera.c and keep their stock names/types, so any other engine file (and any
// other plugin) that reads camera_x / camera_settings / ... keeps working.
//
// This header is included from camera.h so that the stock (inline) camera_reset()
// can reset the extended state on scene load. It deliberately does NOT include
// vm.h - the VM entry points live in vm_camera_ex.h.

// Maximum number of actors the camera can follow at once.
#define CAMERA_EX_MAX_TARGETS 8

// Path the camera takes when travelling towards a new position.
#define CAMERA_PATH_DIAGONAL   0  // both axes move at `speed` (stock behaviour)
#define CAMERA_PATH_HORIZONTAL 1  // finish X, then Y
#define CAMERA_PATH_VERTICAL   2  // finish Y, then X
#define CAMERA_PATH_LINE       3  // true straight line between the two points

// How the positions of several follow targets are combined.
#define CAMERA_MEDIAN_BOUNDS  0   // midpoint of the bounding box of all targets
#define CAMERA_MEDIAN_AVERAGE 1   // arithmetic mean of all target positions

// Scene indices of the actors the camera follows. Only the first
// camera_target_count entries are used; a count of 0 means "follow the player",
// which is the stock behaviour and the state restored on every scene load.
extern UBYTE camera_targets[CAMERA_EX_MAX_TARGETS];
extern UBYTE camera_target_count;
extern UBYTE camera_target_median;

// Follow smoothing. A speed of 0 snaps the camera to its target position in a
// single frame, exactly like the stock camera.
extern UBYTE camera_smooth_speed;
extern UBYTE camera_smooth_mode;

// Project wide defaults (engine fields), re-applied on every scene load.
extern UBYTE camera_default_smooth_speed;
extern UBYTE camera_default_smooth_mode;

// Replaces the body of the stock camera_update().
void camera_ex_update(void) BANKED;

// Moves the camera at most `speed` subpixels towards (target_x, target_y)
// following `mode`. Never overshoots. A speed of 0 snaps to the target.
void camera_step_towards(UWORD target_x, UWORD target_y, UBYTE speed, UBYTE mode) BANKED;

// Resets the extended state. Called from camera_reset(), which the stock engine
// already calls on every scene load (data_manager.c) and on engine start.
inline void camera_ex_reset(void) {
    camera_target_count = 0;
    camera_target_median = CAMERA_MEDIAN_BOUNDS;
    camera_smooth_speed = camera_default_smooth_speed;
    camera_smooth_mode = camera_default_smooth_mode;
}

#endif
