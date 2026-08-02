#pragma bank 255

// Camera Ex Plugin - extended camera follow logic.
//
// This file is identical in every engineAlt variant: it only ever talks to the
// stock camera globals through camera.h, so it compiles unchanged whether
// camera_x is UINT16 (stock) or INT16 (ScreenScroll / ContinuousScene).

#include "camera.h"
#include "camera_ex.h"

#include "actor.h"
#include "math.h"

#include "data/states_defines.h"

#define CAMERA_FIXED_OFFSET_X PX_TO_SUBPX(8)
#define CAMERA_FIXED_OFFSET_Y PX_TO_SUBPX(8)

UBYTE camera_targets[CAMERA_EX_MAX_TARGETS];
UBYTE camera_target_count;
UBYTE camera_target_median;
UBYTE camera_smooth_speed;
UBYTE camera_smooth_mode;

// Engine fields - declared in the same order as in engine.json.
UBYTE camera_default_smooth_speed;
UBYTE camera_default_smooth_mode;

// Resolves the world position the camera should be centred on.
static void camera_get_target_pos(UWORD * out_x, UWORD * out_y) {
    actor_t * a;

    if (camera_target_count == 0) {
        *out_x = PLAYER.pos.x;
        *out_y = PLAYER.pos.y;
        return;
    }

#ifdef CAMERA_EX_MULTI_TARGET
    if (camera_target_count > 1) {
        UBYTE count = camera_target_count;
        UWORD min_x, max_x, min_y, max_y;
        UBYTE i;

        a = &actors[camera_targets[0]];
        min_x = max_x = a->pos.x;
        min_y = max_y = a->pos.y;
        for (i = 1; i != count; i++) {
            a = &actors[camera_targets[i]];
            if (a->pos.x < min_x) min_x = a->pos.x;
            else if (a->pos.x > max_x) max_x = a->pos.x;
            if (a->pos.y < min_y) min_y = a->pos.y;
            else if (a->pos.y > max_y) max_y = a->pos.y;
        }

        if (camera_target_median == CAMERA_MEDIAN_AVERAGE) {
            // Sum the offsets from the minimum, scaled down by 8, so the
            // accumulator can never overflow 16 bits even with the maximum
            // number of targets spread across the largest possible scene
            // (8 * (65504 >> 3) == 65504). The cost is a quarter pixel of
            // precision, which is invisible at the camera's resolution.
            UWORD acc_x = 0, acc_y = 0;
            for (i = 0; i != count; i++) {
                a = &actors[camera_targets[i]];
                acc_x += (a->pos.x - min_x) >> 3;
                acc_y += (a->pos.y - min_y) >> 3;
            }
            *out_x = min_x + ((acc_x / count) << 3);
            *out_y = min_y + ((acc_y / count) << 3);
        } else {
            // Midpoint of the bounding box, written as min + half the span so
            // that min + max can never overflow 16 bits.
            *out_x = min_x + ((max_x - min_x) >> 1);
            *out_y = min_y + ((max_y - min_y) >> 1);
        }
        return;
    }
#endif

    a = &actors[camera_targets[0]];
    *out_x = a->pos.x;
    *out_y = a->pos.y;
}

void camera_step_towards(UWORD target_x, UWORD target_y, UBYTE speed, UBYTE mode) BANKED {
    UWORD cur_x = (UWORD)camera_x;
    UWORD cur_y = (UWORD)camera_y;
    UBYTE neg_x, neg_y;
    UWORD adx, ady, step_x, step_y;

    if (speed == 0) {
        camera_x = target_x;
        camera_y = target_y;
        return;
    }

    // Distances are taken unsigned so a jump larger than 32767 subpixels can
    // never flip the direction of travel.
    neg_x = (target_x < cur_x);
    neg_y = (target_y < cur_y);
    adx = neg_x ? (cur_x - target_x) : (target_x - cur_x);
    ady = neg_y ? (cur_y - target_y) : (target_y - cur_y);

    if ((adx == 0) && (ady == 0)) return;

    if ((mode == CAMERA_PATH_HORIZONTAL) && (adx != 0)) {
        ady = 0;
    } else if ((mode == CAMERA_PATH_VERTICAL) && (ady != 0)) {
        adx = 0;
    }

    step_x = adx;
    step_y = ady;

    if (mode == CAMERA_PATH_LINE) {
        UWORD major = (adx > ady) ? adx : ady;
        if (major > speed) {
            UWORD minor = (adx > ady) ? ady : adx;
            UWORD minor_step;
            UBYTE m, n, shift = 0;
            // Scale both components down until the major axis fits in 7 bits,
            // so speed * minor stays inside 16 bits (255 * 127 == 32385) and no
            // 32 bit maths is needed. The ratio - and therefore the direction of
            // travel - is preserved to better than 1%.
            while ((major >> shift) > 127u) shift++;
            m = (UBYTE)(major >> shift);
            n = (UBYTE)(minor >> shift);
            minor_step = ((UWORD)speed * n) / m;
            if (adx > ady) {
                step_x = speed;
                step_y = minor_step;
            } else {
                step_y = speed;
                step_x = minor_step;
            }
        }
    } else {
        // Diagonal / horizontal first / vertical first: each axis advances by up
        // to `speed` on its own.
        if (step_x > speed) step_x = speed;
        if (step_y > speed) step_y = speed;
    }

    // Never overshoot.
    if (step_x > adx) step_x = adx;
    if (step_y > ady) step_y = ady;

    camera_x = neg_x ? (cur_x - step_x) : (cur_x + step_x);
    camera_y = neg_y ? (cur_y - step_y) : (cur_y + step_y);
}

void camera_ex_update(void) BANKED {
    UWORD target_x, target_y;
    UWORD desired_x = (UWORD)camera_x;
    UWORD desired_y = (UWORD)camera_y;

    camera_get_target_pos(&target_x, &target_y);

    if (camera_settings & CAMERA_LOCK_X_FLAG)
    {
        UWORD target_pos = target_x + CAMERA_FIXED_OFFSET_X - PX_TO_SUBPX(camera_offset_x);
        WORD tolerance = PX_TO_SUBPX(camera_deadzone_x);
        UWORD target_min_pos = (tolerance > target_pos) ? 0 : target_pos - tolerance;
        UWORD target_max_pos = target_pos + tolerance;
        UWORD new_cam_pos = (UWORD)camera_x;

        if (new_cam_pos < target_min_pos)
        {
            new_cam_pos = target_min_pos;
            if ((camera_settings & CAMERA_LOCK_X_MAX_FLAG) && new_cam_pos > (UWORD)camera_clamp_x)
            {
                new_cam_pos = (UWORD)camera_clamp_x;
            }
        }
        else if (new_cam_pos > target_max_pos)
        {
            new_cam_pos = target_max_pos;
            if ((camera_settings & CAMERA_LOCK_X_MIN_FLAG) && new_cam_pos < (UWORD)camera_clamp_x)
            {
                new_cam_pos = (UWORD)camera_clamp_x;
            }
        }
        camera_clamp_x = new_cam_pos;
        desired_x = new_cam_pos;
    }

    if (camera_settings & CAMERA_LOCK_Y_FLAG)
    {
        UWORD target_pos = target_y + CAMERA_FIXED_OFFSET_Y - PX_TO_SUBPX(camera_offset_y);
        WORD tolerance = PX_TO_SUBPX(camera_deadzone_y);
        UWORD target_min_pos = (tolerance > target_pos) ? 0 : target_pos - tolerance;
        UWORD target_max_pos = target_pos + tolerance;
        UWORD new_cam_pos = (UWORD)camera_y;

        if (new_cam_pos < target_min_pos)
        {
            new_cam_pos = target_min_pos;
            if ((camera_settings & CAMERA_LOCK_Y_MAX_FLAG) && new_cam_pos > (UWORD)camera_clamp_y)
            {
                new_cam_pos = (UWORD)camera_clamp_y;
            }
        }
        else if (new_cam_pos > target_max_pos)
        {
            new_cam_pos = target_max_pos;
            if ((camera_settings & CAMERA_LOCK_Y_MIN_FLAG) && new_cam_pos < (UWORD)camera_clamp_y)
            {
                new_cam_pos = (UWORD)camera_clamp_y;
            }
        }
        camera_clamp_y = new_cam_pos;
        desired_y = new_cam_pos;
    }

#ifdef CAMERA_EX_SMOOTH
    if (camera_smooth_speed != 0) {
        // Ease towards the position the stock camera would have snapped to. This
        // covers every case at once: changing the lock target, the offset or the
        // deadzone all simply move `desired` and the camera glides after it.
        camera_step_towards(desired_x, desired_y, camera_smooth_speed, camera_smooth_mode);
        return;
    }
#endif

    camera_x = desired_x;
    camera_y = desired_y;
}
