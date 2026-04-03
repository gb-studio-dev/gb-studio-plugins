#pragma bank 255

#include <gbdk/platform.h>

#include "compat.h"
#include "system.h"
#include "fade_manager.h"
#include "palette.h"

#define FADED_IN_FRAME 0
#define PURPLE_OFFSET 4

UBYTE fade_running;
UBYTE fade_frames_per_step;
UBYTE fade_timer;
UBYTE fade_style = 0;            // 0 = white, 1 = black, 2 = custom RGB

// Custom fade target (CGB 5-bit per channel, 0-31)
UBYTE fade_target_r;
UBYTE fade_target_g;
UBYTE fade_target_b;

// Bitmask-based speed table (compatible with GB Studio engine)
const UBYTE fade_speeds[] = {0x0, 0x1, 0x3, 0x7, 0xF, 0x1F, 0x3F};

// Per-speed curves optimized for each step count
// 8 steps: moderate easing
static const UBYTE curve_8[] = {0, 2, 5, 10, 16, 22, 27, 30, 32};
// 16 steps: gentle easing, every step visually distinct
static const UBYTE curve_16[] = {
    0, 1, 2, 4, 6, 9, 12, 14, 16, 18, 20, 23, 26, 28, 30, 31, 32
};
// 32 steps: linear for maximum smoothness (1 unit per step)
static const UBYTE curve_32[] = {
     0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32
};

static UBYTE fade_frame;
static FADE_DIRECTION fade_direction;
static UBYTE fade_max_steps;
static const UBYTE * active_curve = curve_8;

// Configure step count and curve from current fade_frames_per_step bitmask.
// Called at the start of each fade to adapt to whatever speed the engine set.
//
// Mapping (original mask → smooth steps, overridden mask):
//   mask 0x00 (every frame)  → 8 steps,  keep mask 0x00 (~8 frames)
//   mask 0x01 (every 2f)     → 8 steps,  keep mask 0x01 (~16 frames)
//   mask 0x03 (every 4f)     → 16 steps, override to 0x00 (~16 frames)
//   mask 0x07 (every 8f)     → 16 steps, override to 0x01 (~32 frames)
//   mask 0x0F (every 16f)    → 32 steps, override to 0x01 (~64 frames)
//   mask 0x1F (every 32f)    → 32 steps, override to 0x03 (~128 frames)
//   mask 0x3F (every 64f)    → 32 steps, override to 0x07 (~256 frames)
static void configure_fade_steps(void) {
    UBYTE mask = fade_frames_per_step;

    if (mask <= 0x01) {
        // Fast: 8 smooth steps, keep original timing
        fade_max_steps = 8;
        active_curve = curve_8;
    } else if (mask <= 0x07) {
        // Medium: 16 smooth steps
        fade_max_steps = 16;
        active_curve = curve_16;
        fade_frames_per_step = (mask <= 0x03) ? 0x00 : 0x01;
    } else {
        // Slow: 32 smooth steps (maximum smoothness)
        fade_max_steps = 32;
        active_curve = curve_32;
        if (mask <= 0x0F)       fade_frames_per_step = 0x01;
        else if (mask <= 0x1F)  fade_frames_per_step = 0x03;
        else                    fade_frames_per_step = 0x07;
    }
}

#ifdef CGB

// Precomputed palette buffer for deferred writes.
// Palette is computed during active display (timing doesn't matter),
// then written to hardware at the start of the next fade_update call
// (closest to VBlank, minimal computation before first byte write).
static UINT16 vbl_buf[64];      // [0..31] = BKG, [32..63] = SPR
static UBYTE buf_ready;

// Fade interpolation params (computed once per step, used by InterpolatePalette)
static UBYTE fi_inv_rb, fi_inv_g;
static UINT16 fi_bias_r, fi_bias_g, fi_bias_b;

// Fast path: copy source palette with no interpolation (fully visible)
static void ApplyPaletteDirect(const palette_entry_t * pal, UBYTE reg) OLDCALL {
    UBYTE i;
    const UINT16 * src = (const UINT16 *)pal;
    volatile UBYTE * idx  = (volatile UBYTE *)(0xFF00u + reg);
    volatile UBYTE * dat  = (volatile UBYTE *)(0xFF00u + reg + 1u);
    volatile UBYTE * stat = (volatile UBYTE *)0xFF41u;
    *idx = 0x80;

    for (i = 0; i < 32; i++) {
        UINT16 color = src[i];
        while (*stat & 0x02u);
        *dat = (UBYTE)(color);
        while (*stat & 0x02u);
        *dat = (UBYTE)(color >> 8);
    }
}

// Fast path: fill with solid target color (fully faded)
static void ApplyPaletteSolid(UBYTE reg, UINT16 target) OLDCALL {
    UBYTE i;
    UBYTE lo = (UBYTE)(target);
    UBYTE hi = (UBYTE)(target >> 8);
    volatile UBYTE * idx  = (volatile UBYTE *)(0xFF00u + reg);
    volatile UBYTE * dat  = (volatile UBYTE *)(0xFF00u + reg + 1u);
    volatile UBYTE * stat = (volatile UBYTE *)0xFF41u;
    *idx = 0x80;

    for (i = 0; i < 32; i++) {
        while (*stat & 0x02u);
        *dat = lo;
        while (*stat & 0x02u);
        *dat = hi;
    }
}

// Prepare interpolation params from step values.
// Formula per channel: result = (channel * inv + bias) >> 5
// where bias = target * step (precomputed once per fade step).
static void PrepareInterpolation(UBYTE step_rb, UBYTE step_g) OLDCALL {
    fi_inv_rb = 32 - step_rb;
    fi_inv_g  = 32 - step_g;

    if (fade_style == 0) {
        // White (target 31): 31*step = (step<<5) - step
        fi_bias_r = ((UINT16)step_rb << 5) - step_rb;
        fi_bias_g = ((UINT16)step_g << 5) - step_g;
        fi_bias_b = fi_bias_r;
    } else if (fade_style == 2) {
        fi_bias_r = (UINT16)fade_target_r * step_rb;
        fi_bias_g = (UINT16)fade_target_g * step_g;
        fi_bias_b = (UINT16)fade_target_b * step_rb;
    } else {
        fi_bias_r = 0;
        fi_bias_g = 0;
        fi_bias_b = 0;
    }
}

// Interpolate palette directly into buffer — no LUT needed.
// Uses per-entry multiply: result = (channel * inv + bias) >> 5
// Runs during active display so CPU budget is generous (~48000 T-cycles).
static void InterpolatePalette(const palette_entry_t * pal, UINT16 * dest) OLDCALL {
    UBYTE i;
    const UINT16 * src = (const UINT16 *)pal;
    for (i = 0; i < 32; i++) {
        UINT16 color = src[i];
        UBYTE lo = (UBYTE)color;
        UBYTE hi = (UBYTE)(color >> 8);
        UBYTE rr = (UBYTE)(((UINT16)(lo & 0x1Fu) * fi_inv_rb + fi_bias_r) >> 5);
        UBYTE rg = (UBYTE)(((UINT16)(((lo >> 5) | (hi << 3)) & 0x1Fu) * fi_inv_g + fi_bias_g) >> 5);
        UBYTE rb = (UBYTE)(((UINT16)((hi >> 2) & 0x1Fu) * fi_inv_rb + fi_bias_b) >> 5);
        dest[i] = ((UINT16)rb << 10) | ((UINT16)rg << 5) | (UINT16)rr;
    }
}

// Precompute both BKG and SPR interpolated palettes into vbl_buf.
// Called during active display (timing irrelevant); buffer is flushed
// at the start of the next fade_update for optimal VBlank timing.
static void PrecomputeFadedPalettes(UBYTE index) {
    UBYTE step_rb = active_curve[index];
    UBYTE step_g;

    // Purple hue emphasis
    if (fade_style == 0) {
        step_g = step_rb;
        step_rb = step_rb + PURPLE_OFFSET;
        if (step_rb > 32) step_rb = 32;
    } else if (fade_style == 1) {
        step_g = step_rb + PURPLE_OFFSET;
        if (step_g > 32) step_g = 32;
    } else {
        step_g = step_rb;
    }

    PrepareInterpolation(step_rb, step_g);
    InterpolatePalette(BkgPalette, vbl_buf);
    InterpolatePalette(SprPalette, vbl_buf + 32);
    buf_ready = 1;
}

void ApplyPaletteChangeColor(UBYTE index) {
    UBYTE step_rb, step_g;

    step_rb = active_curve[index];

    if (step_rb == 0) {
        ApplyPaletteDirect(BkgPalette, BCPS_REG_ADDR);
        ApplyPaletteDirect(SprPalette, OCPS_REG_ADDR);
        return;
    }

    if (step_rb >= 32) {
        UINT16 target;
        if (fade_style == 0) {
            target = 0x7FFFu;
        } else if (fade_style == 2) {
            target = ((UINT16)(fade_target_b & 0x1Fu) << 10) |
                     ((UINT16)(fade_target_g & 0x1Fu) << 5)  |
                      (UINT16)(fade_target_r & 0x1Fu);
        } else {
            target = 0x0000u;
        }
        ApplyPaletteSolid(BCPS_REG_ADDR, target);
        ApplyPaletteSolid(OCPS_REG_ADDR, target);
        return;
    }

    // Purple hue emphasis: offset in interpolation domain (0-32 range)
    if (fade_style == 0) {
        step_g = step_rb;
        step_rb = step_rb + PURPLE_OFFSET;
        if (step_rb > 32) step_rb = 32;
    } else if (fade_style == 1) {
        step_g = step_rb + PURPLE_OFFSET;
        if (step_g > 32) step_g = 32;
    } else {
        step_g = step_rb;
    }

    // Immediate write path (used by fade_init, fade_applypalettechange, endpoints)
    PrepareInterpolation(step_rb, step_g);
    InterpolatePalette(BkgPalette, vbl_buf);
    ApplyPaletteDirect((const palette_entry_t *)vbl_buf, BCPS_REG_ADDR);
    InterpolatePalette(SprPalette, vbl_buf + 32);
    ApplyPaletteDirect((const palette_entry_t *)(vbl_buf + 32), OCPS_REG_ADDR);
}
#endif

// DMG fade functions (assembly - only 4 shade levels possible)

UBYTE DMGFadeToWhiteStep(UBYTE step, UBYTE pal) NAKED {
    pal; step;
__asm
#if defined(__SDCC) && defined(NINTENDO)
        or      A
        jr      Z, 0$

        ld      D, A
1$:
        ld      H, #4
2$:
        ld      A, E
        and     #3
        jr      Z, 3$
        dec     A
3$:
        srl     A
        rr      L
        srl     A
        rr      L

        srl     E
        srl     E

        dec     H
        jr      NZ, 2$

        ld      E, L

        dec     D
        jr      NZ, 1$
0$:
        ld      A, E
#endif
        ret
__endasm;
}

UBYTE DMGFadeToBlackStep(UBYTE step, UBYTE pal) NAKED {
    pal; step;
__asm
#if defined(__SDCC) && defined(NINTENDO)
        or      A
        jr      Z, 0$

        ld      D, A
1$:
        ld      H, #4
2$:
        ld      A, E
        and     #3
        cp      #3
        jr      Z, 3$
        inc     A
3$:
        srl     A
        rr      L
        srl     A
        rr      L

        srl     E
        srl     E

        dec     H
        jr      NZ, 2$

        ld      E, L

        dec     D
        jr      NZ, 1$
0$:
        ld      A, E
#endif
        ret
__endasm;
}

void ApplyPaletteChangeDMG(UBYTE index) {
    UBYTE step = active_curve[index];
    UBYTE dmg_index = (step + 4) >> 3;
    if (dmg_index > 4) dmg_index = 4;

    if (!fade_style) {
        BGP_REG = DMGFadeToWhiteStep(dmg_index, DMG_palette[0]);
        OBP0_REG = DMGFadeToWhiteStep(dmg_index, DMG_palette[1]);
        OBP1_REG = DMGFadeToWhiteStep(dmg_index, DMG_palette[2]);
    } else {
        BGP_REG = DMGFadeToBlackStep(dmg_index, DMG_palette[0]);
        OBP0_REG = DMGFadeToBlackStep(dmg_index, DMG_palette[1]);
        OBP1_REG = DMGFadeToBlackStep(dmg_index, DMG_palette[2]);
    }
}

void fade_init(void) BANKED {
    fade_frames_per_step = fade_speeds[2];
    configure_fade_steps();
    fade_timer = fade_max_steps;
    fade_running = FALSE;
    fade_target_r = 0;
    fade_target_g = 0;
    fade_target_b = 0;
#ifdef CGB
    if (_is_CGB) {
        ApplyPaletteChangeColor(fade_timer);
        return;
    }
#endif
    ApplyPaletteChangeDMG(fade_timer);
}

void fade_in(void) BANKED {
    configure_fade_steps();
    if (fade_timer == FADED_IN_FRAME) {
#ifdef CGB
        if (_is_CGB) {
            ApplyPaletteChangeColor(FADED_IN_FRAME);
            return;
        }
#endif
        ApplyPaletteChangeDMG(FADED_IN_FRAME);
        return;
    }
    fade_frame = 0;
    fade_direction = FADE_IN;
    fade_running = TRUE;
    fade_timer = fade_max_steps;
#ifdef CGB
    if (_is_CGB) {
        ApplyPaletteChangeColor(fade_max_steps);
        return;
    }
#endif
    ApplyPaletteChangeDMG(fade_max_steps);
}

void fade_out(void) BANKED {
    UBYTE old_max = fade_max_steps;
    configure_fade_steps();
    if (fade_timer == old_max || fade_timer >= fade_max_steps) {
        fade_timer = fade_max_steps;
#ifdef CGB
        if (_is_CGB) {
            ApplyPaletteChangeColor(fade_max_steps);
            return;
        }
#endif
        ApplyPaletteChangeDMG(fade_max_steps);
        return;
    }
    fade_frame = 0;
    fade_direction = FADE_OUT;
    fade_running = TRUE;
    fade_timer = FADED_IN_FRAME;
#ifdef CGB
    if (_is_CGB) {
        ApplyPaletteChangeColor(fade_timer);
        return;
    }
#endif
    ApplyPaletteChangeDMG(FADED_IN_FRAME);
}

void fade_update(void) BANKED {
#ifdef CGB
    // Flush precomputed palette buffer FIRST — this is the closest point
    // to VBlank we can reach, with zero computation before the writes.
    if (_is_CGB && buf_ready) {
        ApplyPaletteDirect((const palette_entry_t *)vbl_buf, BCPS_REG_ADDR);
        ApplyPaletteDirect((const palette_entry_t *)(vbl_buf + 32), OCPS_REG_ADDR);
        buf_ready = 0;
    }
#endif

    if (fade_running) {
        if ((fade_frame++ & fade_frames_per_step) == 0) {
            if (fade_direction == FADE_IN) {
                if (fade_timer > FADED_IN_FRAME) fade_timer--;
                if (fade_timer == FADED_IN_FRAME) fade_running = FALSE;
            } else {
                if (fade_timer < fade_max_steps) fade_timer++;
                if (fade_timer == fade_max_steps) fade_running = FALSE;
            }

            if (!fade_running) {
                // Final step (endpoint): write immediately via fast path
#ifdef CGB
                if (_is_CGB) {
                    ApplyPaletteChangeColor(fade_timer);
                    return;
                }
#endif
                ApplyPaletteChangeDMG(fade_timer);
            } else {
                // Intermediate step: precompute into buffer for next frame's flush.
                // This runs during active display — timing doesn't matter.
#ifdef CGB
                if (_is_CGB) {
                    PrecomputeFadedPalettes(fade_timer);
                    return;
                }
#endif
                ApplyPaletteChangeDMG(fade_timer);
            }
        }
    }
}

void fade_applypalettechange(void) BANKED {
#ifdef CGB
    if (_is_CGB) {
        ApplyPaletteChangeColor(fade_timer);
        return;
    }
#endif
    ApplyPaletteChangeDMG(fade_timer);
}

void fade_setspeed(UBYTE speed) BANKED {
    fade_frames_per_step = fade_speeds[speed];
}

void fade_in_modal(void) BANKED {
    fade_in();
    while (fade_isfading()) {
        wait_vbl_done();
        fade_update();
    }
}

void fade_out_modal(void) BANKED {
    fade_out();
    while (fade_isfading()) {
        wait_vbl_done();
        fade_update();
    }
}
