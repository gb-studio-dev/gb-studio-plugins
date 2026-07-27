#pragma bank 255

// Dynamic Trigger Plugin
//
// Runtime get/set access to the stock scene trigger table (triggers[],
// triggers_len). Trigger bounds are stored in TILE units as
// left / right / top / bottom (inclusive), so:
//     position  = (left, top)
//     width      = right  - left + 1
//     height     = bottom - top  + 1
//
// This module ONLY reads/writes the existing stock trigger globals; it does
// not replace any stock engine file.

#include "trigger.h"
#include "vm.h"

// Write a 16-bit result into a script destination.
//   idx >= 0 : global variable slot (script_memory + idx)
//   idx <  0 : stack-local; compensate for the `nargs` temporary values
//              still sitting on the VM stack at native-call time.
static void trigger_write(SCRIPT_CTX * THIS, int16_t idx, int16_t value, uint8_t nargs) {
    int16_t * A;
    if (idx < 0) {
        A = (int16_t *)(THIS->stack_ptr + idx - nargs);
    } else {
        A = (int16_t *)(script_memory + idx);
    }
    *A = value;
}

// ---------------------------------------------------------------------------
// Position (tiles)
// ---------------------------------------------------------------------------

// args (push order): destX, destY, index
void vm_trigger_get_position(SCRIPT_CTX * THIS) OLDCALL BANKED {
    int16_t destX = *(int16_t *)VM_REF_TO_PTR(FN_ARG2);
    int16_t destY = *(int16_t *)VM_REF_TO_PTR(FN_ARG1);
    uint8_t i     = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    if (i >= triggers_len) return;
    trigger_write(THIS, destX, triggers[i].left, 3);
    trigger_write(THIS, destY, triggers[i].top, 3);
}

// args (push order): index, x, y  -- moves the trigger, preserving its size
void vm_trigger_set_position(SCRIPT_CTX * THIS) OLDCALL BANKED {
    uint8_t i = *(uint8_t *)VM_REF_TO_PTR(FN_ARG2);
    uint8_t x = *(uint8_t *)VM_REF_TO_PTR(FN_ARG1);
    uint8_t y = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    (void)THIS;
    if (i >= triggers_len) return;
    uint8_t w = triggers[i].right - triggers[i].left;
    uint8_t h = triggers[i].bottom - triggers[i].top;
    triggers[i].left   = x;
    triggers[i].top    = y;
    triggers[i].right  = x + w;
    triggers[i].bottom = y + h;
}

// ---------------------------------------------------------------------------
// Dimensions (tiles)
// ---------------------------------------------------------------------------

// args (push order): destW, destH, index
void vm_trigger_get_dimensions(SCRIPT_CTX * THIS) OLDCALL BANKED {
    int16_t destW = *(int16_t *)VM_REF_TO_PTR(FN_ARG2);
    int16_t destH = *(int16_t *)VM_REF_TO_PTR(FN_ARG1);
    uint8_t i     = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    if (i >= triggers_len) return;
    trigger_write(THIS, destW, (int16_t)(triggers[i].right  - triggers[i].left + 1), 3);
    trigger_write(THIS, destH, (int16_t)(triggers[i].bottom - triggers[i].top  + 1), 3);
}

// args (push order): index, width, height  -- anchored at the top-left corner
void vm_trigger_set_dimensions(SCRIPT_CTX * THIS) OLDCALL BANKED {
    uint8_t i = *(uint8_t *)VM_REF_TO_PTR(FN_ARG2);
    uint8_t w = *(uint8_t *)VM_REF_TO_PTR(FN_ARG1);
    uint8_t h = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    (void)THIS;
    if (i >= triggers_len) return;
    if (w) w--;   // tile count -> inclusive right offset
    if (h) h--;
    triggers[i].right  = triggers[i].left + w;
    triggers[i].bottom = triggers[i].top  + h;
}

// ---------------------------------------------------------------------------
// Raw bounds (tiles, inclusive)
// ---------------------------------------------------------------------------

// args (push order): destLeft, destRight, destTop, destBottom, index
void vm_trigger_get_bounds(SCRIPT_CTX * THIS) OLDCALL BANKED {
    int16_t destLeft   = *(int16_t *)VM_REF_TO_PTR(FN_ARG4);
    int16_t destRight  = *(int16_t *)VM_REF_TO_PTR(FN_ARG3);
    int16_t destTop    = *(int16_t *)VM_REF_TO_PTR(FN_ARG2);
    int16_t destBottom = *(int16_t *)VM_REF_TO_PTR(FN_ARG1);
    uint8_t i          = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    if (i >= triggers_len) return;
    trigger_write(THIS, destLeft,   triggers[i].left, 5);
    trigger_write(THIS, destRight,  triggers[i].right, 5);
    trigger_write(THIS, destTop,    triggers[i].top, 5);
    trigger_write(THIS, destBottom, triggers[i].bottom, 5);
}

// args (push order): index, left, right, top, bottom
void vm_trigger_set_bounds(SCRIPT_CTX * THIS) OLDCALL BANKED {
    uint8_t i      = *(uint8_t *)VM_REF_TO_PTR(FN_ARG4);
    uint8_t left   = *(uint8_t *)VM_REF_TO_PTR(FN_ARG3);
    uint8_t right  = *(uint8_t *)VM_REF_TO_PTR(FN_ARG2);
    uint8_t top    = *(uint8_t *)VM_REF_TO_PTR(FN_ARG1);
    uint8_t bottom = *(uint8_t *)VM_REF_TO_PTR(FN_ARG0);
    (void)THIS;
    if (i >= triggers_len) return;
    triggers[i].left   = left;
    triggers[i].right  = right;
    triggers[i].top    = top;
    triggers[i].bottom = bottom;
}
