#ifndef GLYPH_TEXT_H
#define GLYPH_TEXT_H

#include <gbdk/platform.h>
#include "vm.h"

// engine fields (order must match engine.json)
extern UBYTE gtx_first_tile;
extern UBYTE gtx_last_tile;
extern UBYTE gtx_tile_placement;   // 0 = bank 0, 1 = bank 1, 2 = alternate (CGB only)

extern UBYTE gtx_text_drawn;
extern UBYTE gtx_current_text_speed;

// clears the glyph tile cache; call after anything reloads the reserved VRAM
// tiles (scene change, tileset swap, ...). Registered glyph sheets are kept.
void gtx_cache_reset(void) BANKED;

// renders one character (or a run of control codes) of ui_text_data
UBYTE gtx_draw_text_buffer_char(void) BANKED;

// VM natives
void gtx_display_text(SCRIPT_CTX * THIS) OLDCALL BANKED;
void gtx_display_text_speed(SCRIPT_CTX * THIS) OLDCALL BANKED;
UBYTE gtx_display_dialogue(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED;
void gtx_reset_cache(SCRIPT_CTX * THIS) OLDCALL BANKED;
void gtx_set_tile_range(SCRIPT_CTX * THIS) OLDCALL BANKED;
UBYTE gtx_ui_run_menu(menu_item_t * start_item, UBYTE bank, UBYTE options,
                       UBYTE count, UBYTE start_index, UBYTE pitch) BANKED;
void gtx_menu(SCRIPT_CTX * THIS) OLDCALL BANKED;
void gtx_set_glyph_sheet(SCRIPT_CTX * THIS) OLDCALL BANKED;
void gtx_set_width_table(SCRIPT_CTX * THIS) OLDCALL BANKED;

#endif
