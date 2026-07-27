#ifndef SCREEN_TRANSITIONS_H
#define SCREEN_TRANSITIONS_H

#include <gbdk/platform.h>
#include "vm.h"

// Waitable VM function: advances a screen transition a few steps per frame and
// yields until complete. Driven by VM_INVOKE. Parameters are read from the
// invoke's stack frame (see screen_transitions.c / the event JS for the layout).
UBYTE screen_transition_update(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED;

// One-shot: fill the whole background tilemap with a tile (+CGB attr).
void vm_screen_cover(SCRIPT_CTX * THIS) OLDCALL BANKED;

#endif // SCREEN_TRANSITIONS_H
