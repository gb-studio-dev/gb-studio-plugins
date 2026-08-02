#ifndef TALL_TEXT_H
#define TALL_TEXT_H

#include <gbdk/platform.h>
#include "vm.h"

// engine fields (order must match engine.json)
extern UBYTE ttx_first_tile;
extern UBYTE ttx_last_tile;
extern UBYTE ttx_tile_placement;   // 0 = bank 0, 1 = bank 1, 2 = alternate (CGB only)

extern UBYTE ttx_text_drawn;
extern UBYTE ttx_current_text_speed;

// clears the tall-character tile cache; call after anything reloads the
// reserved VRAM tiles (scene change, tileset swap, ...)
void ttx_cache_reset(void) BANKED;

// renders one character (or a run of control codes) of ui_text_data
UBYTE ttx_draw_text_buffer_char(void) BANKED;

// VM natives
void ttx_display_text(SCRIPT_CTX * THIS) OLDCALL BANKED;
void ttx_display_text_speed(SCRIPT_CTX * THIS) OLDCALL BANKED;
UBYTE ttx_display_dialogue(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED;
void ttx_reset_cache(SCRIPT_CTX * THIS) OLDCALL BANKED;
void ttx_set_tile_range(SCRIPT_CTX * THIS) OLDCALL BANKED;

#endif
