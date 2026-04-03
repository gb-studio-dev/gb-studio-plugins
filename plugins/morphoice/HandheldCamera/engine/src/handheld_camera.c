#pragma bank 255

#include <rand.h>

#include "vm.h"
#include "scroll.h"

// State variables for handheld camera effect
// Using 8.8 fixed point for smooth easing (matches INT16 range)
static INT16 hc_target_x;    // 8.8 fixed point
static INT16 hc_target_y;    // 8.8 fixed point
static INT16 hc_current_x;   // 8.8 fixed point
static INT16 hc_current_y;   // 8.8 fixed point
static INT16 hc_vel_x;       // velocity in 8.8
static INT16 hc_vel_y;       // velocity in 8.8
static UBYTE hc_timer_x;
static UBYTE hc_timer_y;
static UBYTE hc_interval_x;
static UBYTE hc_interval_y;
static UBYTE hc_amplitude_x; // pixels
static UBYTE hc_amplitude_y; // pixels
static UBYTE hc_base_x;
static UBYTE hc_base_y;
static UBYTE hc_smoothness;
static UBYTE hc_direction;   // 1=X only, 2=Y only, 3=both
static UBYTE hc_active;

/**
 * Start handheld camera effect
 * Args: amp_x, amp_y, speed (1-3), smoothness (1-4)
 */
void vm_handheld_camera_start(SCRIPT_CTX * THIS) OLDCALL BANKED {
    hc_amplitude_x = *(UBYTE*)VM_REF_TO_PTR(FN_ARG0);
    hc_amplitude_y = *(UBYTE*)VM_REF_TO_PTR(FN_ARG1);
    UBYTE speed = *(UBYTE*)VM_REF_TO_PTR(FN_ARG2);
    hc_smoothness = *(UBYTE*)VM_REF_TO_PTR(FN_ARG3);

    // Clamp values
    if (hc_amplitude_x > 8) hc_amplitude_x = 8;
    if (hc_amplitude_y > 8) hc_amplitude_y = 8;
    if (hc_smoothness < 1) hc_smoothness = 1;
    if (hc_smoothness > 4) hc_smoothness = 4;

    // Direction: enable axis if amplitude > 0
    hc_direction = 0;
    if (hc_amplitude_x > 0) hc_direction |= 1;
    if (hc_amplitude_y > 0) hc_direction |= 2;

    // Base intervals based on speed (1-5)
    switch (speed) {
        case 1:  // Slow
            hc_base_x = 20;
            hc_base_y = 25;
            break;
        case 3:  // Fast
            hc_base_x = 5;
            hc_base_y = 6;
            break;
        case 4:  // Faster
            hc_base_x = 2;
            hc_base_y = 3;
            break;
        case 5:  // Fastest (every frame)
            hc_base_x = 0;
            hc_base_y = 0;
            break;
        default: // Normal (2)
            hc_base_x = 10;
            hc_base_y = 12;
            break;
    }

    // Initialize state
    hc_target_x = hc_target_y = 0;
    hc_current_x = hc_current_y = 0;
    hc_vel_x = hc_vel_y = 0;
    hc_timer_x = hc_timer_y = 0;
    hc_interval_x = hc_base_x;
    hc_interval_y = hc_base_y;

    // Reset scroll offsets for enabled axes to match initial hc_current (0)
    if (hc_direction & 1) scroll_offset_x = 0;
    if (hc_direction & 2) scroll_offset_y = 0;

    hc_active = 1;
}

/**
 * Update handheld camera effect - call once per frame
 */
void vm_handheld_camera_update(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;
    if (!hc_active) return;

    // Update X axis (amplitude = total peak-to-peak range)
    if (hc_direction & 1) {
        INT16 half_x = hc_amplitude_x >> 1;  // half the range (for centering)

        if (hc_base_x == 0) {
            // Fastest mode: random value every frame, no easing (like original shake)
            scroll_offset_x = (BYTE)((rand() % (hc_amplitude_x + 1)) - half_x);
        } else {
            // Normal mode: eased movement
            hc_timer_x++;
            if (hc_timer_x >= hc_interval_x) {
                hc_target_x = ((INT16)(rand() % (hc_amplitude_x + 1)) - half_x) << 8;
                hc_interval_x = hc_base_x + (rand() & 7);
                hc_timer_x = 0;
            }

            // Smooth easing toward target
            INT16 diff_x = hc_target_x - hc_current_x;
            INT16 accel_x = diff_x >> (1 + hc_smoothness);
            hc_vel_x += accel_x;
            hc_vel_x = (hc_vel_x * 7) >> 3;  // damping
            hc_current_x += hc_vel_x;

            // Clamp to valid range
            INT16 min_x = -(half_x << 8);
            INT16 max_x = (hc_amplitude_x - half_x) << 8;
            if (hc_current_x > max_x) hc_current_x = max_x;
            if (hc_current_x < min_x) hc_current_x = min_x;

            scroll_offset_x = (BYTE)(hc_current_x >> 8);
        }
    }

    // Update Y axis (amplitude = total peak-to-peak range)
    if (hc_direction & 2) {
        INT16 half_y = hc_amplitude_y >> 1;

        if (hc_base_y == 0) {
            // Fastest mode: random value every frame, no easing
            scroll_offset_y = (BYTE)((rand() % (hc_amplitude_y + 1)) - half_y);
        } else {
            // Normal mode: eased movement
            hc_timer_y++;
            if (hc_timer_y >= hc_interval_y) {
                hc_target_y = ((INT16)(rand() % (hc_amplitude_y + 1)) - half_y) << 8;
                hc_interval_y = hc_base_y + (rand() & 7);
                hc_timer_y = 0;
            }

            INT16 diff_y = hc_target_y - hc_current_y;
            INT16 accel_y = diff_y >> (1 + hc_smoothness);
            hc_vel_y += accel_y;
            hc_vel_y = (hc_vel_y * 7) >> 3;
            hc_current_y += hc_vel_y;

            INT16 min_y = -(half_y << 8);
            INT16 max_y = (hc_amplitude_y - half_y) << 8;
            if (hc_current_y > max_y) hc_current_y = max_y;
            if (hc_current_y < min_y) hc_current_y = min_y;

            scroll_offset_y = (BYTE)(hc_current_y >> 8);
        }
    }
}

/**
 * Stop handheld camera effect
 */
void vm_handheld_camera_stop(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;
    hc_active = 0;
    // Only reset offsets for axes that were enabled
    if (hc_direction & 1) scroll_offset_x = 0;
    if (hc_direction & 2) scroll_offset_y = 0;
}
