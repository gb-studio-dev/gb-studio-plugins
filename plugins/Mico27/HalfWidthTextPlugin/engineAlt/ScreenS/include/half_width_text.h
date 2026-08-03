#ifndef HALF_WIDTH_TEXT_H
#define HALF_WIDTH_TEXT_H

#include <gbdk/platform.h>
#include "vm.h"

// engine fields (order must match engine.json)
extern UBYTE hwt_first_tile;
extern UBYTE hwt_last_tile;
extern UBYTE hwt_tile_placement;   // 0 = bank 0, 1 = bank 1, 2 = alternate (CGB only)

extern UBYTE hwt_text_drawn;
extern UBYTE hwt_current_text_speed;

// clears the pair-tile cache; call after anything reloads the reserved VRAM
// tiles (scene change, tileset swap, ...)
void hwt_cache_reset(void) BANKED;

// renders one character (or a run of control codes) of ui_text_data
UBYTE hwt_draw_text_buffer_char(void) BANKED;

// VM natives
void hwt_display_text(SCRIPT_CTX * THIS) OLDCALL BANKED;
void hwt_display_text_speed(SCRIPT_CTX * THIS) OLDCALL BANKED;
UBYTE hwt_display_dialogue(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED;
void hwt_reset_cache(SCRIPT_CTX * THIS) OLDCALL BANKED;
void hwt_set_tile_range(SCRIPT_CTX * THIS) OLDCALL BANKED;

#endif
