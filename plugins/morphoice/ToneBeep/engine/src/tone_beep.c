#pragma bank 255

#include <gbdk/platform.h>
#include <stdint.h>

#include "vm.h"
#include "sfx_player.h"
#include "music_manager.h"

// ---------------------------------------------------------------------------
// Tone Beep — patterned pulse-wave beep sequencer on CH1 and/or CH2
// Two independent channel instances can play simultaneously.
// Survives SFX interrupts.  Auto-mutes channel in music driver.
// ---------------------------------------------------------------------------

// Pattern step: 11-bit pulse frequency + duration in frames (~60 fps)
// freq = 0 means silence for that many frames (gap between beeps)
typedef struct {
    UINT16 freq;       // 11-bit NR value  (0 = silence)
    UBYTE  duration;   // frames
} tb_step_t;

typedef struct {
    const tb_step_t *steps;
    UBYTE count;       // number of steps
    UBYTE loop;        // 1 = loop, 0 = one-shot (stops after last step)
} tb_pattern_t;

// ---------------------------------------------------------------------------
// Frequency reference:  NR_value = 2048 - (131072 / freq_hz)
//   455 Hz -> 1760    520 Hz -> 1796    555 Hz -> 1812
//   470 Hz -> 1769    490 Hz -> 1781    550 Hz -> 1810
//   987.8 Hz -> 1915   1975.5 Hz -> 1982
// ---------------------------------------------------------------------------

// Pattern 0 — Status Change:  single 455 Hz tone, ~0.33 s
static const tb_step_t pat_status_change[] = {
    { 1760, 20 },
};

// Pattern 1 — New Plane (Waterfall):  550→520→490→470 Hz, 5 frames each
static const tb_step_t pat_new_plane[] = {
    { 1810,  5 },
    { 1796,  5 },
    { 1781,  5 },
    { 1769,  5 },
};

// Pattern 2 — Radar Uplink:  455↔555 Hz, 15 frames each (looping)
static const tb_step_t pat_radar_uplink[] = {
    { 1760, 15 },
    { 1812, 15 },
};

// Pattern 3 — Missile Approach:  455↔555 Hz, 6 frames each, ~1.6 sec one-shot
// 8 alternating pairs = 16 steps × 6 frames = 96 frames ≈ 1.6 seconds
static const tb_step_t pat_missile_approach[] = {
    { 1760, 6 }, { 1812, 6 }, { 1760, 6 }, { 1812, 6 },
    { 1760, 6 }, { 1812, 6 }, { 1760, 6 }, { 1812, 6 },
    { 1760, 6 }, { 1812, 6 }, { 1760, 6 }, { 1812, 6 },
    { 1760, 6 }, { 1812, 6 }, { 1760, 6 }, { 1812, 6 },
};

// Pattern 4 — Caution:  B5 (987.8 Hz), 8 frames on / 16 frames off, 8 reps
// 8 × (8 + 16) = 192 frames ≈ 3.2 seconds one-shot
static const tb_step_t pat_caution[] = {
    { 1915, 8 }, { 0, 16 }, { 1915, 8 }, { 0, 16 },
    { 1915, 8 }, { 0, 16 }, { 1915, 8 }, { 0, 16 },
    { 1915, 8 }, { 0, 16 }, { 1915, 8 }, { 0, 16 },
    { 1915, 8 }, { 0, 16 }, { 1915, 8 }, { 0, 16 },
};

#define TB_PATTERN_COUNT 5

static const tb_pattern_t tb_patterns[TB_PATTERN_COUNT] = {
    { pat_status_change,    1,  0 },   // 0: one-shot
    { pat_new_plane,        4,  0 },   // 1: one-shot
    { pat_radar_uplink,     2,  1 },   // 2: loop
    { pat_missile_approach, 16, 0 },   // 3: one-shot (~1.6 sec)
    { pat_caution,          16, 0 },   // 4: one-shot (~3.2 sec)
};

// ---------------------------------------------------------------------------
// Per-channel state (index 0 = CH1, index 1 = CH2)
// ---------------------------------------------------------------------------
typedef struct {
    UBYTE active;
    UBYTE pattern_idx;
    UBYTE step_idx;
    UBYTE frame_counter;
    UBYTE volume;
    UBYTE was_stolen;
    UBYTE sounding;
    UBYTE prev_global_mute;
} tb_chan_t;

static tb_chan_t tb[2];   // [0] = CH1, [1] = CH2

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

static inline UBYTE tb_sfx_mask(UBYTE ch_idx) {
    return (ch_idx == 0) ? SFX_CH_1 : SFX_CH_2;
}

static inline UBYTE sfx_owns_channel(UBYTE ch_idx) {
    return (sfx_play_bank != SFX_STOP_BANK) && (music_mute_mask & tb_sfx_mask(ch_idx));
}

// Trigger a tone on the selected channel
static void tb_trigger(UBYTE ch_idx, UINT16 freq, UBYTE volume) {
    UBYTE vol_env = (volume << 4);   // flat volume, no envelope
    UBYTE freq_lo = freq & 0xFF;
    UBYTE freq_hi = 0x80 | ((freq >> 8) & 0x07);   // trigger bit + freq high

    if (ch_idx == 0) {
        NR10_REG = 0x00;       // no sweep
        NR11_REG = 0x80;       // 50% duty
        NR12_REG = vol_env;
        NR13_REG = freq_lo;
        NR14_REG = freq_hi;
    } else {
        NR21_REG = 0x80;       // 50% duty
        NR22_REG = vol_env;
        NR23_REG = freq_lo;
        NR24_REG = freq_hi;
    }
    tb[ch_idx].sounding = 1;
}

// Silence the channel
static void tb_silence(UBYTE ch_idx) {
    if (ch_idx == 0) {
        NR12_REG = 0x00;
        NR14_REG = 0x80;
    } else {
        NR22_REG = 0x00;
        NR24_REG = 0x80;
    }
    tb[ch_idx].sounding = 0;
}

// Unmute channel for music driver
static void tb_unmute_music(UBYTE ch_idx) {
    CRITICAL {
        music_global_mute_mask = tb[ch_idx].prev_global_mute;
        music_effective_mute = driver_set_mute_mask(music_global_mute_mask | music_mute_mask);
    }
}

// Begin playing the current step
static void tb_play_step(UBYTE ch_idx) {
    tb_chan_t *c = &tb[ch_idx];
    const tb_pattern_t *pat = &tb_patterns[c->pattern_idx];
    const tb_step_t *step = &pat->steps[c->step_idx];

    c->frame_counter = step->duration;

    if (step->freq == 0) {
        if (c->sounding) tb_silence(ch_idx);
    } else {
        tb_trigger(ch_idx, step->freq, c->volume);
    }
}

// Advance one channel's sequencer by one frame
static void tb_update_channel(UBYTE ch_idx) {
    tb_chan_t *c = &tb[ch_idx];
    if (!c->active) return;

    // --- SFX check ---
    if (sfx_owns_channel(ch_idx)) {
        c->was_stolen = 1;
        return;   // don't advance while stolen
    }

    // --- Retrigger after SFX releases channel ---
    if (c->was_stolen) {
        c->was_stolen = 0;
        const tb_pattern_t *pat = &tb_patterns[c->pattern_idx];
        const tb_step_t *step = &pat->steps[c->step_idx];
        if (c->frame_counter > 0 && step->freq != 0) {
            tb_trigger(ch_idx, step->freq, c->volume);
        }
    }

    // --- Countdown current step ---
    if (c->frame_counter > 0) {
        c->frame_counter--;
        if (c->frame_counter == 0) {
            const tb_pattern_t *pat = &tb_patterns[c->pattern_idx];
            c->step_idx++;

            if (c->step_idx >= pat->count) {
                if (pat->loop) {
                    c->step_idx = 0;
                    tb_play_step(ch_idx);
                } else {
                    // Pattern complete — stop
                    if (c->sounding) tb_silence(ch_idx);
                    c->active = 0;
                    tb_unmute_music(ch_idx);
                }
            } else {
                tb_play_step(ch_idx);
            }
        }
    }
}

// ---------------------------------------------------------------------------
// GBVM functions
// ---------------------------------------------------------------------------

/**
 * Start a beep pattern on the specified channel.
 * Stack args: pattern (0-3), volume (0-15), channel (1=CH1, 2=CH2)
 * Each channel is independent — starting on CH1 does not stop CH2.
 */
void vm_tone_beep_start(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE pattern = *(UBYTE*)VM_REF_TO_PTR(FN_ARG0);
    UBYTE volume  = *(UBYTE*)VM_REF_TO_PTR(FN_ARG1);
    UBYTE channel = *(UBYTE*)VM_REF_TO_PTR(FN_ARG2);

    if (pattern >= TB_PATTERN_COUNT) pattern = 0;
    if (volume > 15) volume = 15;

    UBYTE ch_idx = (channel == 1) ? 0 : 1;
    tb_chan_t *c = &tb[ch_idx];

    // Clean up previous if this channel was active
    if (c->active) {
        if (!sfx_owns_channel(ch_idx) && c->sounding) {
            tb_silence(ch_idx);
        }
        tb_unmute_music(ch_idx);
    }

    c->pattern_idx  = pattern;
    c->volume       = volume;
    c->step_idx     = 0;
    c->was_stolen   = 0;
    c->sounding     = 0;

    // Mute channel in music driver
    c->prev_global_mute = music_global_mute_mask;
    CRITICAL {
        music_global_mute_mask |= tb_sfx_mask(ch_idx);
        music_effective_mute = driver_set_mute_mask(music_global_mute_mask | music_mute_mask);
    }

    c->active = 1;

    if (!sfx_owns_channel(ch_idx)) {
        tb_play_step(ch_idx);
    } else {
        c->was_stolen = 1;
    }
}

/**
 * Stop beep on the specified channel.
 * Stack args: channel (1=CH1, 2=CH2)
 */
void vm_tone_beep_stop(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE channel = *(UBYTE*)VM_REF_TO_PTR(FN_ARG0);
    UBYTE ch_idx = (channel == 1) ? 0 : 1;
    tb_chan_t *c = &tb[ch_idx];

    if (!c->active) return;

    c->active = 0;

    if (!sfx_owns_channel(ch_idx) && c->sounding) {
        tb_silence(ch_idx);
    }
    c->sounding = 0;

    tb_unmute_music(ch_idx);
}

/**
 * Per-frame update.  Advances both channels.
 * Call from On Update script once per frame.
 */
void vm_tone_beep_update(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;
    tb_update_channel(0);
    tb_update_channel(1);
}
