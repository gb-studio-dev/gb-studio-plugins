#pragma bank 255
#include <string.h>
#include "system.h"
#include "ui.h"
#include "game_time.h"
#include "bankdata.h"
#include "input.h"
#include "math.h"
#include "shadow.h"
#include "music_manager.h"
#include "actor.h"
#include "camera.h"
#include "data_manager.h"
#include "fade_manager.h"
#include "parallax.h"
#include "scroll.h"
#include "projectiles.h"
#include "vm.h"
#include "data/data_bootstrap.h"
UBYTE ui_alt_current_text_speed;
UBYTE ui_alt_text_drawn;
// char printer internals
static UBYTE * ui_alt_text_ptr;
static UBYTE * ui_alt_dest_ptr;
static UBYTE * ui_alt_dest_base;
inline void ui_alt_set_tile(UBYTE * addr, UBYTE tile) {
#ifdef CGB
    if (_is_CGB) {
        VBK_REG = 1;
        set_vram_byte(addr, overlay_priority | (text_palette & 0x07u));
        VBK_REG = 0;
    }
#endif
    set_vram_byte(addr, tile);
}

// address of the cell n columns right of p, wrapped inside p's 32-cell map row
static UBYTE * ui_alt_row_cell(UBYTE * p, UBYTE n) {
    return (UBYTE *)(((UWORD)p & 0xFFE0u) | (((UWORD)p + n) & 0x1Fu));
}

UBYTE ui_alt_draw_text_buffer_char(void) BANKED {
    static UBYTE current_text_ff_joypad, current_text_draw_speed;
    if (ui_alt_text_ptr == 0) {
        // set the delay mask
        ui_alt_current_text_speed = ui_time_masks[text_draw_speed];
        // save font and color global properties
        current_text_ff_joypad  = text_ff_joypad;
        current_text_draw_speed = text_draw_speed;
        // reset to first line
        // current char pointer
        ui_alt_text_ptr = ui_text_data;
        // VRAM destination
        if ((text_options & TEXT_OPT_PRESERVE_POS) == 0) {
            ui_alt_dest_base = text_render_base_addr;                  // gotoxy(0,0)
            // initialize current pointer with corrected base value
            ui_alt_dest_ptr = ui_alt_dest_base;
        }
    }
    // normally runs once, but if control code encountered, then process them until printable symbol or terminator
    while (TRUE) {
        switch (*ui_alt_text_ptr) {
            case 0x00: {
                ui_alt_text_ptr = 0;
                ui_alt_text_drawn = TRUE;
                text_ff_joypad = current_text_ff_joypad;
                text_draw_speed = current_text_draw_speed;
                return FALSE;
            }
            case 0x01:
                // set text speed
                text_draw_speed = (*(++ui_alt_text_ptr) - 1u) & 0x07u;
                ui_alt_current_text_speed = ui_time_masks[text_draw_speed];
                break;
            case 0x02: {
                break;
            }
            case 0x03:
                // gotoxy
                ui_alt_dest_ptr = ui_alt_dest_base = text_render_base_addr + (*++ui_alt_text_ptr - 1u) + (*++ui_alt_text_ptr - 1u) * 32u;
                break;
            case 0x04: {
                // relative gotoxy
                BYTE dx = (BYTE)(*++ui_alt_text_ptr);
                if (dx > 0) dx--;
                BYTE dy = (BYTE)(*++ui_alt_text_ptr);
                if (dy > 0) dy--;
                ui_alt_dest_base = ui_alt_dest_ptr += dx + dy * 32u;
                break;
            }
            case 0x06:
                // wait for input cancels fast forward
                if (text_ff) {
                    text_ff = FALSE;
                    INPUT_RESET;
                }
                text_ff_joypad = FALSE;
                // point to the button mask
                ui_alt_text_ptr++;
                // if high speed then skip waiting
                if (text_draw_speed) {
                    // wait for key press (parameter is a mask)
                    if (INPUT_PRESSED(*ui_alt_text_ptr)) {
                        // mask matches
                        text_ff_joypad = current_text_ff_joypad;
                        INPUT_RESET;
                    } else {
                        // go back to 0x06 control code
                        ui_alt_text_ptr--;
                        ui_alt_current_text_speed = 0;
                        return FALSE;
                    }
                }
                ui_alt_current_text_speed = ui_time_masks[text_draw_speed];
                break;
            case 0x07:
                break;
            case 0x08:
                break;
            case 0x09:
                break;
            case '\n':  // 0x0a
                // carriage return
                ui_alt_dest_ptr = ui_alt_dest_base += 32u;
                break;
            case 0x0b:
            #ifdef CGB
                text_palette = (*++ui_alt_text_ptr & 0x07);
            #endif
                break;
            case '\r':  // 0x0d
                 // line feed
                if ((ui_alt_dest_ptr + 32u) > (UBYTE *)((((UWORD)text_scroll_addr + ((UWORD)text_scroll_height << 5)) & 0xFFE0) - 1)) {
                    scroll_rect(text_scroll_addr, text_scroll_width, text_scroll_height, text_scroll_fill);
#ifdef CGB
                    if (_is_CGB) {
                        VBK_REG = 1;
                        scroll_rect(text_scroll_addr, text_scroll_width, text_scroll_height, overlay_priority | (text_palette & 0x07u));
                        VBK_REG = 0;
                    }
#endif
                    ui_alt_dest_ptr = ui_alt_dest_base;
                } else {
                    ui_alt_dest_ptr = ui_alt_dest_base += 32u;
                }
                break;
            case 0x05:
                // escape symbol
                ui_alt_text_ptr++;
                // fall down to default
            default:
                //UBYTE tile = (*ui_alt_text_ptr);
                UBYTE tile = ReadBankedUBYTE(vwf_current_font_desc.recode_table + (*ui_alt_text_ptr), vwf_current_font_bank);
                //UBYTE tile = ReadBankedUBYTE(char_tileset_mapping + (*ui_alt_text_ptr) , BANK(char_tileset_mapping));
                ui_alt_set_tile(ui_alt_dest_ptr, tile);
                ui_alt_dest_ptr = ui_alt_row_cell(ui_alt_dest_ptr, 1);
                ui_alt_text_ptr++;
                return TRUE;
        }
        ui_alt_text_ptr++;
    }
}
void ui_alt_display_text(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;
    ui_alt_text_drawn = FALSE;
    // all drawn - nothing to do
    do {
        ui_alt_draw_text_buffer_char();
    } while (!ui_alt_text_drawn);
}
inline void load_font_bitmaps(const font_desc_t *font, UBYTE bank, UBYTE tile_offset, UBYTE tile_length) {
    SetBankedBkgData(tile_offset, tile_length, font->bitmaps, bank);
}
void ui_alt_load_font(SCRIPT_CTX * THIS) OLDCALL BANKED {
    uint8_t font_index = *(int8_t*)VM_REF_TO_PTR(FN_ARG0);
    uint8_t tile_offset = *(int8_t*)VM_REF_TO_PTR(FN_ARG1);
    uint8_t tile_length = *(int8_t*)VM_REF_TO_PTR(FN_ARG2);
    load_font_bitmaps(ui_fonts[font_index].ptr, ui_fonts[font_index].bank, tile_offset, tile_length);
}
void ui_alt_display_dialogue_modal(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;
    INPUT_RESET;
    ui_alt_text_drawn = text_ff = FALSE;
    ui_alt_current_text_speed = 0;
    UBYTE play_sound, speed_wait = FALSE;
    // all drawn - nothing to do
    do {
        // too fast - wait
        if ((text_ff_joypad) && (INPUT_A_OR_B_PRESSED)) {
            text_ff = TRUE;
        } else {
            if (game_time & ui_alt_current_text_speed) {
                speed_wait = TRUE;
            }
        }
        // render next char
        if (!speed_wait){
            do {
                play_sound = ui_alt_draw_text_buffer_char();
            } while (((text_ff) || (text_draw_speed == 0)) && (!ui_alt_text_drawn));
            // play sound
            if ((play_sound) && (text_sound_bank != SFX_STOP_BANK)) music_play_sfx(text_sound_bank, text_sound_data, text_sound_mask, MUSIC_SFX_PRIORITY_NORMAL);
        }
        speed_wait = FALSE;
        toggle_shadow_OAM();
        camera_update();
        scroll_update();
        actors_update();
        actors_render();
        projectiles_render();
        activate_shadow_OAM();
        game_time++;
        wait_vbl_done();
        input_update();
    } while (!ui_alt_text_drawn);
}
UBYTE ui_alt_display_dialogue(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    THIS;
    stack_frame;
    UBYTE play_sound, speed_wait = FALSE;
    if (start){
        INPUT_RESET;
        ui_alt_text_drawn = text_ff = FALSE;
        ui_alt_current_text_speed = 0;
    }
     // all drawn - nothing to do
    if (!ui_alt_text_drawn) {
        // too fast - wait
        if ((text_ff_joypad) && (INPUT_A_OR_B_PRESSED)) {
            text_ff = TRUE;
        } else {
            if (game_time & ui_alt_current_text_speed) {
                speed_wait = TRUE;
            }
        }
        // render next char
        if (!speed_wait){
            do {
                play_sound = ui_alt_draw_text_buffer_char();
            } while (((text_ff) || (text_draw_speed == 0)) && (!ui_alt_text_drawn));
            // play sound
            if ((play_sound) && (text_sound_bank != SFX_STOP_BANK)) music_play_sfx(text_sound_bank, text_sound_data, text_sound_mask, MUSIC_SFX_PRIORITY_NORMAL);
        }
        ((SCRIPT_CTX *)THIS)->waitable = TRUE;
        return FALSE;
    }
    return TRUE;
}

// ---- menu ------------------------------------------------------------------
// A menu whose options are drawn by this plugin rather than by GB Studio's own
// text renderer. The stock Menu event draws through the stock renderer, so its
// options come out in the stock font and ignore the tiles this plugin maps to.
//
// Unlike the 16px text plugins this one puts a line on a single tilemap row,
// exactly like stock text, so the cursor needs no scaling -- the stride is kept
// as a parameter only so the code reads the same as its siblings, and callers
// pass 1. Nothing here touches the stock ui_run_menu: this plugin does not
// replace the stock renderer, and stock menus keep working unchanged.
static void ui_alt_menu_cursor(const menu_item_t * item, UBYTE tile, UBYTE pitch) {
    UBYTE y = (item->Y) ? (UBYTE)(((item->Y - 1u) * pitch) + pitch) : 0u;
#ifdef CGB
    if (_is_CGB) {
        VBK_REG = VBK_ATTRIBUTES;
        set_win_tile_xy(item->X, y, overlay_priority | (text_palette & 0x07u));
        VBK_REG = VBK_TILES;
    }
#endif
    set_win_tile_xy(item->X, y, tile);
}

// start_item == NULL means a single-column menu of `count` options, laid out the
// way this plugin's Menu event draws them, so no menu_item_t table is needed.
static void ui_alt_menu_fetch(menu_item_t * out, menu_item_t * start_item, UBYTE bank,
                              UBYTE index, UBYTE count) {
    if (start_item == 0) {
        out->X = 1u;
        out->Y = index;
        out->iL = 1u;
        out->iR = count;
        out->iU = (index > 1u) ? (UBYTE)(index - 1u) : 0u;
        out->iD = (index < count) ? (UBYTE)(index + 1u) : 0u;
    } else {
        MemcpyBanked(out, start_item + (index - 1u), sizeof(menu_item_t), bank);
    }
}

UBYTE ui_alt_ui_run_menu(menu_item_t * start_item, UBYTE bank, UBYTE options,
                         UBYTE count, UBYTE start_index, UBYTE pitch) BANKED {
    menu_item_t current_menu_item;
    UBYTE current_index = ((options & MENU_SET_START) ? start_index : 1u), next_index = 0u;
    ui_alt_menu_fetch(&current_menu_item, start_item, bank, current_index, count);

    ui_alt_menu_cursor(&current_menu_item, ui_cursor_tile, pitch);

    while (TRUE) {
        input_update();
        ui_update();

        toggle_shadow_OAM();
        camera_update();
        scroll_update();
        actors_update();
        actors_render();
        projectiles_render();
        activate_shadow_OAM();

        game_time++;
        wait_vbl_done();

        if (INPUT_UP_PRESSED) {
            next_index = current_menu_item.iU;
        } else if (INPUT_DOWN_PRESSED) {
            next_index = current_menu_item.iD;
        } else if (INPUT_LEFT_PRESSED) {
            next_index = current_menu_item.iL;
        } else if (INPUT_RIGHT_PRESSED) {
            next_index = current_menu_item.iR;
        } else if (INPUT_A_PRESSED) {
            return ((current_index == count) && (options & MENU_CANCEL_LAST)) ? 0u : current_index;
        } else if ((INPUT_B_PRESSED) && (options & MENU_CANCEL_B)) {
            return 0u;
        } else {
            continue;
        }

        if (!next_index) continue;

        current_index = next_index;
        ui_alt_menu_cursor(&current_menu_item, ui_bg_tile, pitch);
        ui_alt_menu_fetch(&current_menu_item, start_item, bank, current_index, count);
        ui_alt_menu_cursor(&current_menu_item, ui_cursor_tile, pitch);
        next_index = 0;
    }
}

// VM native behind this plugin's Menu event. VM_CHOICE is the only instruction
// that carries a menu and it always calls the stock ui_run_menu, so the event
// comes through here instead.
//
// args (push order): dest, options, count, start_index
void ui_alt_menu(SCRIPT_CTX * THIS) OLDCALL BANKED {
    INT16 dest    = *(INT16 *)VM_REF_TO_PTR(FN_ARG3);
    UBYTE options = *(UBYTE *)VM_REF_TO_PTR(FN_ARG2);
    UBYTE count   = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    UBYTE start   = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    UBYTE result;
    INT16 * A;
    // the options were already drawn, in full, by ui_alt_display_text; without
    // this ui_update() in the loop below would render the stock text buffer
    // straight over them
    text_drawn = TRUE;
    result = ui_alt_ui_run_menu(0, 0, options, count, start, 1u);
    // negative index = stack-local; step past the four arguments still on the stack
    A = (dest < 0) ? (INT16 *)(THIS->stack_ptr + dest - 4) : (INT16 *)(script_memory + dest);
    *A = result;
}
