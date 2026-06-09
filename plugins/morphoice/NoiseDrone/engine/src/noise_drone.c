#pragma bank 255

#include <gbdk/platform.h>
#include <stdint.h>

#include "vm.h"
#include "sfx_player.h"
#include "music_manager.h"

// ---------------------------------------------------------------------------
// Noise Drone — continuous CH4 noise with pitch table portamento
// + Surf Mode — looping ocean wave pattern (replicates Beach.uge CH4)
// Survives SFX interrupts. Auto-mutes CH4 in music driver.
// ---------------------------------------------------------------------------

// Pitch table: NR43 values sorted low-to-high frequency, 15-bit LFSR (bit3=0).
// OR with 0x08 for 7-bit LFSR (tonal buzz mode).
// Frequency = 524288 / divider / 2^(shift+1).  23 unique steps in 200-10000 Hz.
static const UBYTE nd_pitch_table[] = {
    0x85,  //  0:  ~205 Hz  — deep rumble
    0x84,  //  1:  ~256 Hz
    0x77,  //  2:  ~293 Hz
    0x76,  //  3:  ~341 Hz
    0x75,  //  4:  ~410 Hz
    0x74,  //  5:  ~512 Hz
    0x67,  //  6:  ~585 Hz
    0x66,  //  7:  ~683 Hz
    0x65,  //  8:  ~819 Hz
    0x64,  //  9: ~1024 Hz
    0x57,  // 10: ~1170 Hz
    0x56,  // 11: ~1365 Hz
    0x55,  // 12: ~1638 Hz
    0x54,  // 13: ~2048 Hz
    0x47,  // 14: ~2341 Hz  — engine idle
    0x46,  // 15: ~2731 Hz
    0x45,  // 16: ~3277 Hz
    0x44,  // 17: ~4096 Hz
    0x37,  // 18: ~4681 Hz
    0x36,  // 19: ~5461 Hz
    0x35,  // 20: ~6554 Hz
    0x34,  // 21: ~8192 Hz
    0x27,  // 22: ~9362 Hz  — high whine
};
#define ND_PITCH_COUNT 23

// ---------------------------------------------------------------------------
// Surf pattern — exact replica of Beach.uge noise channel (song_pattern_3)
// Tempo 7 = 7 hUGE ticks/row, 64 rows/pattern = 448 ticks total.
// hUGE runs at 64 Hz. VBlank is ~60 Hz. Fractional accumulator converts.
//
// NR43 values derived from get_note_poly():
//   C_7 (note 48) → NR43 = 0x27    B_6 (note 47) → NR43 = 0x34
// NR42 envelopes from noise_instruments[] (DN is 1-indexed: inst N → array[N-1]):
//   DN inst 7 → [6] = 0x1F (vol 1, inc, pace 7) = wave swell, building up
//   DN inst 8 → [7] = 0x97 (vol 9, dec, pace 7) = wave crash, fast decay
//   DN inst 9 → [8] = 0x20 (vol 2, dec, pace 0) = quiet wash, constant
// All instruments: highmask=0x00 → NR41=0x00, NR44=0x80, 15-bit LFSR
// ---------------------------------------------------------------------------
typedef struct {
    UBYTE nr42;      // envelope → NR42
    UBYTE nr43;      // polynomial counter → NR43
    UBYTE duration;  // hUGE ticks until next step
} surf_step_t;

static const surf_step_t nd_surf_pattern[] = {
    { 0x1F, 0x27,  42 },  // Row  0: C_7 inst7 — wave swell (vol 1→15, increasing)
    { 0x97, 0x27,  42 },  // Row  6: C_7 inst8 — wave crash (vol 9→0, fast decay)
    { 0x20, 0x34, 112 },  // Row 12: B_6 inst9 — quiet wash (vol 2, constant)
    { 0x1F, 0x27,  42 },  // Row 28: C_7 inst7 — wave swell (repeat)
    { 0x97, 0x27,  42 },  // Row 34: C_7 inst8 — wave crash (repeat)
    { 0x20, 0x34, 168 },  // Row 40: B_6 inst9 — quiet wash (longer tail)
};
#define SURF_STEPS 6

// Drone state (continuous mode)
static UBYTE nd_active;           // drone enabled
static UBYTE nd_vol_current;      // current volume (0-15), slides toward target
static UBYTE nd_vol_target;       // target volume (0-15)
static UBYTE nd_mode;             // 0x00 = hiss (15-bit), 0x08 = buzz (7-bit)
static UBYTE nd_pitch_current;    // current index into pitch table
static UBYTE nd_pitch_target;     // portamento target index
static UBYTE nd_porta_speed;      // frames between pitch steps (0 = instant)
static UBYTE nd_porta_counter;    // frame counter for portamento

// Surf state (looping pattern mode)
static UBYTE nd_surf_active;      // surf loop enabled
static UBYTE nd_surf_step;        // current step index (0 to SURF_STEPS-1)
static UBYTE nd_surf_remaining;   // hUGE ticks until next step fires
static UBYTE nd_surf_accum;       // fractional accumulator: +16/frame, tick every 15

// Shared state
static UBYTE nd_was_stolen;       // CH4 was taken by SFX, needs retrigger
static UBYTE nd_prev_global_mute; // saved music_global_mute_mask before muting CH4

// Get NR43 value for current pitch + mode (drone mode only)
static inline UBYTE nd_get_nr43(UBYTE pitch_idx) {
    return nd_pitch_table[pitch_idx] | nd_mode;
}

// Check if SFX currently owns CH4
static inline UBYTE sfx_owns_ch4(void) {
    return (sfx_play_bank != SFX_STOP_BANK) && (music_mute_mask & SFX_CH_4);
}

// Claim CH4: mute it in music driver (only if not already claimed)
static void nd_claim_ch4(void) {
    if (!nd_active && !nd_surf_active) {
        nd_prev_global_mute = music_global_mute_mask;
        CRITICAL {
            music_global_mute_mask |= SFX_CH_4;
            music_effective_mute = driver_set_mute_mask(music_global_mute_mask | music_mute_mask);
        }
    }
}

// Release CH4: restore music driver mute mask
static void nd_release_ch4(void) {
    CRITICAL {
        music_global_mute_mask = nd_prev_global_mute;
        music_effective_mute = driver_set_mute_mask(music_global_mute_mask | music_mute_mask);
    }
}

// Write all noise registers and trigger CH4 (drone mode)
static void nd_write_regs(void) {
    NR41_REG = 0x00;
    NR42_REG = nd_vol_current << 4;
    NR43_REG = nd_get_nr43(nd_pitch_current);
    NR44_REG = 0x80;
}

// Write noise registers for a surf step (exact Beach.uge values, no scaling)
static void nd_write_surf_regs(UBYTE step) {
    NR41_REG = 0x00;
    NR42_REG = nd_surf_pattern[step].nr42;
    NR43_REG = nd_surf_pattern[step].nr43;
    NR44_REG = 0x80;
}

/**
 * Start noise drone (continuous mode).
 * Stack args: pitch (0-22), volume (0-15), mode (0=hiss, 1=buzz)
 */
void vm_noise_drone_start(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE pitch = *(UBYTE*)VM_REF_TO_PTR(FN_ARG0);
    UBYTE volume = *(UBYTE*)VM_REF_TO_PTR(FN_ARG1);
    UBYTE mode = *(UBYTE*)VM_REF_TO_PTR(FN_ARG2);

    if (pitch >= ND_PITCH_COUNT) pitch = ND_PITCH_COUNT - 1;
    if (volume > 15) volume = 15;

    nd_claim_ch4();
    nd_surf_active = 0;  // stop surf if active

    nd_pitch_current = pitch;
    nd_pitch_target  = pitch;
    nd_vol_current   = volume;
    nd_vol_target    = volume;
    nd_mode = mode ? 0x08 : 0x00;

    nd_porta_speed   = 0;
    nd_porta_counter = 0;
    nd_was_stolen    = 0;

    nd_active = 1;

    if (!sfx_owns_ch4()) {
        nd_write_regs();
    } else {
        nd_was_stolen = 1;
    }
}

/**
 * Stop noise drone (both continuous and surf modes).
 * Silences CH4 and unmutes it for the music driver.
 */
void vm_noise_drone_stop(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;
    UBYTE was_active = nd_active | nd_surf_active;
    nd_active = 0;
    nd_surf_active = 0;
    nd_vol_current = 0;
    nd_vol_target  = 0;

    if (was_active) {
        if (!sfx_owns_ch4()) {
            NR42_REG = 0;
            NR44_REG = 0x80;
        }
        nd_release_ch4();
    }
}

/**
 * Set target pitch with portamento and optional volume slide (drone mode).
 * Stack args: target_pitch (0-22), volume (0-15), porta_speed (0=instant)
 * Both pitch and volume slide at the same rate (1 step per porta_speed frames).
 */
void vm_noise_drone_set_freq(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE pitch  = *(UBYTE*)VM_REF_TO_PTR(FN_ARG0);
    UBYTE volume = *(UBYTE*)VM_REF_TO_PTR(FN_ARG1);
    nd_porta_speed   = *(UBYTE*)VM_REF_TO_PTR(FN_ARG2);
    nd_porta_counter = 0;

    if (pitch >= ND_PITCH_COUNT) pitch = ND_PITCH_COUNT - 1;
    if (volume > 15) volume = 15;
    nd_pitch_target = pitch;
    nd_vol_target   = volume;

    // Instant portamento: jump to targets immediately
    if (nd_porta_speed == 0) {
        nd_pitch_current = nd_pitch_target;
        nd_vol_current   = nd_vol_target;
    }

    // Apply changes immediately if drone is sounding
    if (nd_active && !sfx_owns_ch4() && !nd_was_stolen) {
        if (nd_porta_speed == 0) {
            nd_write_regs();
        }
    }
}

/**
 * Start surf mode — looping ocean wave pattern on CH4.
 * Replicates Beach.uge noise channel exactly (instruments, notes, timing).
 * No arguments — pattern is hardcoded from Beach.uge song_pattern_3.
 */
void vm_noise_drone_surf_start(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;
    nd_claim_ch4();
    nd_active = 0;  // stop continuous drone if active

    nd_surf_step = 0;
    nd_surf_remaining = nd_surf_pattern[0].duration;
    nd_surf_accum = 0;
    nd_was_stolen = 0;

    nd_surf_active = 1;

    if (!sfx_owns_ch4()) {
        nd_write_surf_regs(0);
    } else {
        nd_was_stolen = 1;
    }
}

// Surf update: step through pattern using fractional 60→64 Hz accumulator
static void nd_surf_update(void) {
    UBYTE sfx_active = sfx_owns_ch4();

    if (sfx_active) {
        nd_was_stolen = 1;
    }

    // Fractional accumulator: 60 fps × 16/15 = 64 ticks/sec
    // Most frames: 1 tick. Every 15th frame: 2 ticks.
    nd_surf_accum += 16;
    while (nd_surf_accum >= 15) {
        nd_surf_accum -= 15;

        if (nd_surf_remaining > 0) {
            nd_surf_remaining--;
        }
        if (nd_surf_remaining == 0) {
            nd_surf_step++;
            if (nd_surf_step >= SURF_STEPS) nd_surf_step = 0;
            nd_surf_remaining = nd_surf_pattern[nd_surf_step].duration;

            // Write registers for new step (unless SFX owns CH4)
            if (!sfx_active) {
                nd_write_surf_regs(nd_surf_step);
                nd_was_stolen = 0;
            }
        }
    }

    // Retrigger after SFX releases CH4
    if (!sfx_active && nd_was_stolen) {
        nd_write_surf_regs(nd_surf_step);
        nd_was_stolen = 0;
    }
}

/**
 * Per-frame update.  Call from On Update script.
 * Handles drone portamento, surf pattern stepping, and SFX retrigger.
 */
void vm_noise_drone_update(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;
    if (nd_surf_active) {
        nd_surf_update();
        return;
    }
    if (!nd_active) return;

    // --- SFX check ---
    if (sfx_owns_ch4()) {
        nd_was_stolen = 1;
        return;
    }

    // --- Portamento: step pitch and volume toward targets ---
    UBYTE reg_changed = 0;
    UBYTE vol_changed = 0;
    UBYTE needs_slide = (nd_pitch_current != nd_pitch_target) ||
                        (nd_vol_current != nd_vol_target);

    if (needs_slide) {
        if (nd_porta_speed == 0) {
            nd_pitch_current = nd_pitch_target;
            nd_vol_current   = nd_vol_target;
            reg_changed = 1;
            vol_changed = 1;
        } else {
            nd_porta_counter++;
            if (nd_porta_counter >= nd_porta_speed) {
                nd_porta_counter = 0;
                if (nd_pitch_current < nd_pitch_target) {
                    nd_pitch_current++;
                    reg_changed = 1;
                } else if (nd_pitch_current > nd_pitch_target) {
                    nd_pitch_current--;
                    reg_changed = 1;
                }
                if (nd_vol_current < nd_vol_target) {
                    nd_vol_current++;
                    vol_changed = 1;
                } else if (nd_vol_current > nd_vol_target) {
                    nd_vol_current--;
                    vol_changed = 1;
                }
            }
        }
    }

    // --- Retrigger or update registers ---
    if (nd_was_stolen) {
        nd_write_regs();
        nd_was_stolen = 0;
    } else if (vol_changed) {
        // Volume change requires retrigger on CH4
        nd_write_regs();
    } else if (reg_changed) {
        NR43_REG = nd_get_nr43(nd_pitch_current);
    }
}
