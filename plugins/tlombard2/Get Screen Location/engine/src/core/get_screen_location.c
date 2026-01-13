#pragma bank 255

#include "get_screen_location.h"

#define SCREEN_TILE8_W            19u
#define SCREEN_TILE8_H            17u

UBYTE screenLeftX;
UBYTE screenRightX;
UBYTE screenTopY;
UBYTE screenBotY;

void vm_get_screen_location(SCRIPT_CTX *THIS) OLDCALL BANKED {
    screenLeftX = PX_TO_TILE(draw_scroll_x);
    screenRightX = screenLeftX + SCREEN_TILE8_W;
    screenTopY = PX_TO_TILE(draw_scroll_y);
    screenBotY = screenTopY + SCREEN_TILE8_H;

    *(UINT16 *)VM_REF_TO_PTR(FN_ARG0) = screenLeftX; // screen left edge
    *(UINT16 *)VM_REF_TO_PTR(FN_ARG1) = screenRightX; // screen right edge
    *(UINT16 *)VM_REF_TO_PTR(FN_ARG2) = screenTopY; // screen top edge
    *(UINT16 *)VM_REF_TO_PTR(FN_ARG3) = screenBotY; // screen bottom edge
}