#ifndef DYNAMIC_SFX_PLAYER_H
#define DYNAMIC_SFX_PLAYER_H

#include <gbdk/platform.h>
#include <stdint.h>

#include "vm.h"
#include "bankdata.h"

// one base sound = three command streams (pulse 1, pulse 2, noise),
// compiled from the IDE via the "Compile Base Sfx Data" event
typedef struct {
    const uint8_t * pulse1;
    const uint8_t * pulse2;
    const uint8_t * noise;
} dynsfx_base_t;

// a preset compiled from the IDE via the "Compile Preset Sfx Data" event:
// a base sound plus the two playback modifiers
typedef struct {
    far_ptr_t base;  // compiled dynsfx_base_t
    uint8_t pitch;   // added to the hardware frequency of every note
    uint8_t length;  // note duration factor: frames = len16 * (0x80 + length) / 256
} dynsfx_preset_def_t;

// nonzero while a dynamic sfx is playing (bit per channel)
extern volatile uint8_t dynsfx_active_channels;

// both run from the plugin's own bank — safe to call from anywhere on the
// main thread, but not from an interrupt handler
void dynsfx_play_far(uint8_t bank, const dynsfx_base_t * base, uint8_t pitch, uint8_t length) BANKED;
void dynsfx_stop(void) BANKED;

void vm_dynsfx_play_data(SCRIPT_CTX * THIS) OLDCALL BANKED;
void vm_dynsfx_play_preset_data(SCRIPT_CTX * THIS) OLDCALL BANKED;
void vm_dynsfx_stop(SCRIPT_CTX * THIS) OLDCALL BANKED;
UBYTE vm_dynsfx_wait(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED;

#endif
