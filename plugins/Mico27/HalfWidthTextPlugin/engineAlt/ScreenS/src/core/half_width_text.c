#pragma bank 255

// engineAlt variant for ContinuousScenePlugin / ScreenScrollPlugin: those
// plugins scroll the hardware background map and expose the scrolled origin
// as bkg_offset_x / bkg_offset_y (scroll.h) plus current_text_layer (ui.h).
// Background-layer drawing starts from the visible origin and wraps within
// the 32x32 map, exactly like the host engines' own ui.c and the
// UiAltDisplayTextPlugin engineAlt variants.
//
// Half-width (4px wide) text renderer using the Pokemon TCG technique:
// two characters are packed into one 8x8 tile. Composed pair-tiles live in a
// reserved VRAM tile range and are tracked in an LRU doubly-linked list keyed
// by the character pair, so a pair that was already drawn reuses its tile
// instead of being rendered again (see poketcg src/home/process_text.asm:
// Func_235e / Func_2325 / GenerateTextTile).
//
// Glyphs come from the current GB Studio font asset (vwf_current_font_desc):
// the font's recode table (the "table" field of the font's .json) maps each
// character to its glyph, and the glyph's left 4px column is used as the
// half-width bitmap. Glyphs must be drawn in the left half of their tile.

#include <string.h>
#include "system.h"
#include "ui.h"
#include "game_time.h"
#include "bankdata.h"
#include "input.h"
#include "shadow.h"
#include "music_manager.h"
#include "actor.h"
#include "camera.h"
#include "scroll.h"
#include "projectiles.h"
#include "vm.h"
#include "data/data_bootstrap.h"
#include "data/states_defines.h"
#include "half_width_text.h"

// engine fields (order must match engine.json)
UBYTE hwt_first_tile;
UBYTE hwt_last_tile;
UBYTE hwt_tile_placement;

UBYTE hwt_text_drawn;
UBYTE hwt_current_text_speed;

// capacity of the pair-tile LRU cache; project-configurable through the
// HWT_CACHE_MAX engine field (Settings -> Half-Width Text), 4 bytes WRAM per entry
#ifndef HWT_CACHE_MAX
#define HWT_CACHE_MAX 64
#endif
#define HWT_NULL 0xFFu

// where cached tiles live in VRAM (hwt_tile_placement engine field).
// bank 1 placements only take effect on CGB (color-only or mixed mode on
// color hardware): the tilemap attribute bit 3 selects the tile data bank,
// so bank-1 pair tiles coexist with scene tiles of the same index in bank 0.
// HWT_PLACEMENT_ALTERNATE spreads entries across both banks, doubling the
// pairs a given tile range can hold.
#define HWT_PLACEMENT_BANK0     0
#define HWT_PLACEMENT_BANK1     1
#define HWT_PLACEMENT_ALTERNATE 2

// placement in effect for the current cache generation (bank-1 modes fall
// back to bank 0 when not running on CGB hardware)
static UBYTE hwt_placement_eff;

// bank-0-only: cache entry i owns VRAM tile (hwt_first_tile + i); alternate
// placement maps entries 2k/2k+1 onto tile (hwt_first_tile + k) in banks 0
// and 1 respectively
static UBYTE hwt_key_l[HWT_CACHE_MAX];   // left character of the pair
static UBYTE hwt_key_r[HWT_CACHE_MAX];   // right character of the pair
static UBYTE hwt_next[HWT_CACHE_MAX];    // towards least recently used
static UBYTE hwt_prev[HWT_CACHE_MAX];    // towards most recently used
static UBYTE hwt_head;                   // most recently used entry
static UBYTE hwt_tail;                   // least recently used entry (evicted first)
static UBYTE hwt_count;                  // entries allocated so far
static UBYTE hwt_size;                   // usable entries in the reserved range
static UBYTE hwt_cache_font_idx;         // font the cached tiles were composed with
static UBYTE hwt_initialized = FALSE;

static UBYTE hwt_tile_buf[16];
static UBYTE hwt_glyph_buf[16];
static UBYTE hwt_glyph_l[8];
static UBYTE hwt_glyph_r[8];

// char printer internals
static UBYTE * hwt_text_ptr = 0;
static UBYTE * hwt_dest_ptr;
static UBYTE * hwt_dest_base;
static UBYTE hwt_pending;                // buffered left char of an incomplete pair, 0 = none

void hwt_cache_reset(void) BANKED {
    UBYTE n;
#ifdef CGB
    hwt_placement_eff = (_is_CGB) ? hwt_tile_placement : HWT_PLACEMENT_BANK0;
#else
    hwt_placement_eff = HWT_PLACEMENT_BANK0;
#endif
    if (hwt_last_tile < hwt_first_tile) {
        n = HWT_CACHE_MAX;
    } else {
        UBYTE range = hwt_last_tile - hwt_first_tile + 1u;   // 0 means the full 256 tiles
        if (hwt_placement_eff == HWT_PLACEMENT_ALTERNATE) {
            // one entry per tile per bank; avoid UBYTE overflow before clamping
            n = (range > (HWT_CACHE_MAX >> 1)) ? HWT_CACHE_MAX : (UBYTE)(range << 1);
        } else {
            n = range;
        }
        if ((n == 0) || (n > HWT_CACHE_MAX)) n = HWT_CACHE_MAX;
    }
    hwt_size = n;
    hwt_count = 0;
    hwt_head = hwt_tail = HWT_NULL;
    hwt_cache_font_idx = vwf_current_font_idx;
    hwt_initialized = TRUE;
}

// cached tiles were composed from another font's glyphs: forget them
static void hwt_check_font(UBYTE font_idx) {
    if (font_idx != hwt_cache_font_idx) {
        hwt_cache_reset();
        hwt_cache_font_idx = font_idx;
    }
}

// fetch the 8 glyph rows for a character from the current font asset,
// masked to the left 4px. runs the character through the font's recode
// table (FONT_RECODE / json "table" field) exactly like the stock renderer.
static void hwt_fetch_glyph(UBYTE ch, UBYTE * dst) {
    UBYTE letter = (vwf_current_font_desc.attr & FONT_RECODE)
        ? ReadBankedUBYTE(vwf_current_font_desc.recode_table + (ch & vwf_current_font_desc.mask), vwf_current_font_bank)
        : ch;
    MemcpyBanked(hwt_glyph_buf, vwf_current_font_desc.bitmaps + ((UWORD)letter << 4), 16, vwf_current_font_bank);
    // merge both bitplanes so any non-white color counts as ink
    for (UBYTE i = 0; i < 8; i++) {
        dst[i] = (hwt_glyph_buf[i << 1] | hwt_glyph_buf[(i << 1) + 1u]) & 0xF0u;
    }
}

// VRAM tile index owned by cache entry i
static UBYTE hwt_entry_tile(UBYTE i) {
    if (hwt_placement_eff == HWT_PLACEMENT_ALTERNATE) return hwt_first_tile + (i >> 1);
    return hwt_first_tile + i;
}

// VRAM tile data bank the tile of cache entry i lives in
static UBYTE hwt_entry_bank(UBYTE i) {
    if (hwt_placement_eff == HWT_PLACEMENT_BANK1) return 1;
    if (hwt_placement_eff == HWT_PLACEMENT_ALTERNATE) return i & 0x01u;
    return 0;
}

// compose the two 4px glyphs into one 2bpp tile (both bitplanes set -> color 3,
// same as poketcg CreateHalfWidthFontTile) and upload it to VRAM.
static void hwt_compose_tile(UBYTE tile, UBYTE bank, UBYTE l, UBYTE r) {
    UBYTE * dst = hwt_tile_buf;
    UBYTE row;
    hwt_fetch_glyph(l, hwt_glyph_l);
    hwt_fetch_glyph(r, hwt_glyph_r);
    for (UBYTE i = 0; i < 8; i++) {
        row = hwt_glyph_l[i] | (hwt_glyph_r[i] >> 4);
        *dst++ = row;
        *dst++ = row;
    }
    (void)bank;
#ifdef CGB
    if (bank) VBK_REG = 1;
#endif
    set_bkg_data(tile, 1, hwt_tile_buf);
#ifdef CGB
    if (bank) VBK_REG = 0;
#endif
}

// look the pair up in the LRU list; on hit hoist the entry to the head and
// reuse its tile, on miss allocate a fresh tile (or evict the least recently
// used one) and render the pair into it.
// returns the cache entry index (tile/bank via hwt_entry_tile/hwt_entry_bank).
static UBYTE hwt_get_pair_entry(UBYTE l, UBYTE r) {
    UBYTE i, p, nx;
    for (i = hwt_head; i != HWT_NULL; i = hwt_next[i]) {
        if ((hwt_key_l[i] == l) && (hwt_key_r[i] == r)) {
            if (i != hwt_head) {
                // unlink and move to front
                p = hwt_prev[i];
                nx = hwt_next[i];
                hwt_next[p] = nx;
                if (nx != HWT_NULL) hwt_prev[nx] = p; else hwt_tail = p;
                hwt_prev[i] = HWT_NULL;
                hwt_next[i] = hwt_head;
                hwt_prev[hwt_head] = i;
                hwt_head = i;
            }
            return i;
        }
    }
    // miss
    if (hwt_count < hwt_size) {
        i = hwt_count++;
    } else {
        // evict least recently used
        i = hwt_tail;
        p = hwt_prev[i];
        if (p != HWT_NULL) {
            hwt_next[p] = HWT_NULL;
            hwt_tail = p;
        } else {
            hwt_head = hwt_tail = HWT_NULL;
        }
    }
    hwt_key_l[i] = l;
    hwt_key_r[i] = r;
    hwt_prev[i] = HWT_NULL;
    hwt_next[i] = hwt_head;
    if (hwt_head != HWT_NULL) hwt_prev[hwt_head] = i;
    hwt_head = i;
    if (hwt_tail == HWT_NULL) hwt_tail = i;
    hwt_compose_tile(hwt_entry_tile(i), hwt_entry_bank(i), l, r);
    return i;
}

static void hwt_emit_pair(UBYTE l, UBYTE r) {
    UBYTE entry = hwt_get_pair_entry(l, r);
    UBYTE tile = hwt_entry_tile(entry);
    UBYTE bank = hwt_entry_bank(entry);
    (void)bank;
    // wrap around within the 32-tile map row instead of bleeding into the next line on background
    if (current_text_layer == TEXT_LAYER_BKG) {
        if (((UBYTE)hwt_dest_ptr >> 5) != ((UBYTE)hwt_dest_base >> 5)) {
            hwt_dest_ptr -= 32u;
        }
    }
#ifdef CGB
    // the attribute byte carries the palette and the tile data bank (bit 3)
    // the pair tile was composed into
    if (_is_CGB) {
        VBK_REG = 1;
        set_vram_byte(hwt_dest_ptr, overlay_priority | (text_palette & 0x07u) | (bank ? 0x08u : 0x00u));
        VBK_REG = 0;
    }
#endif
    set_vram_byte(hwt_dest_ptr, tile);
    hwt_dest_ptr++;
}

// finish an incomplete pair with a half-width space
// (poketcg TerminateHalfWidthText)
static void hwt_flush_pending(void) {
    if (hwt_pending) {
        hwt_emit_pair(hwt_pending, ' ');
        hwt_pending = 0;
    }
}

// renders one character (or a run of control codes) of ui_text_data.
// mirrors the stock ui_draw_text_buffer_char control-code handling.
// returns TRUE when a printable character was consumed (for sound/speed).
UBYTE hwt_draw_text_buffer_char(void) BANKED {
    static UBYTE current_font_idx, current_text_ff_joypad, current_text_draw_speed;

    if (hwt_text_ptr == 0) {
        // set the delay mask
        hwt_current_text_speed = ui_time_masks[text_draw_speed];
        // save font and speed global properties
        current_font_idx        = vwf_current_font_idx;
        current_text_ff_joypad  = text_ff_joypad;
        current_text_draw_speed = text_draw_speed;
        hwt_pending = 0;
        if (!hwt_initialized) hwt_cache_reset();
        hwt_check_font(vwf_current_font_idx);
        // current char pointer
        hwt_text_ptr = ui_text_data;
        // VRAM destination
        if ((text_options & TEXT_OPT_PRESERVE_POS) == 0) {
            if (current_text_layer == TEXT_LAYER_BKG) {
                // start at the visible origin of the scrolled background map
                hwt_dest_base = text_render_base_addr + ((((UWORD)bkg_offset_y << 5) + 32) & 1023) + (((UWORD)bkg_offset_x + 1) & 31);
            } else {
                hwt_dest_base = text_render_base_addr;
            }
            hwt_dest_ptr = hwt_dest_base;
        }
    }
    // normally runs once, but if control code encountered, then process them until printable symbol or terminator
    while (TRUE) {
        switch (*hwt_text_ptr) {
            case 0x00: {
                hwt_flush_pending();
                hwt_text_ptr = 0;
                hwt_text_drawn = TRUE;
                // restore font and color global properties
                if (vwf_current_font_idx != current_font_idx) {
                    const far_ptr_t * font = ui_fonts + vwf_current_font_idx;
                    MemcpyBanked(&vwf_current_font_desc, font->ptr, sizeof(font_desc_t), vwf_current_font_bank = font->bank);
                }
                text_ff_joypad = current_text_ff_joypad;
                text_draw_speed = current_text_draw_speed;
                return FALSE;
            }
            case 0x01:
                // set text speed
                text_draw_speed = (*(++hwt_text_ptr) - 1u) & 0x07u;
                hwt_current_text_speed = ui_time_masks[text_draw_speed];
                break;
            case 0x02: {
                // set current font (temporary within this text, like stock)
                hwt_flush_pending();
                current_font_idx = *(++hwt_text_ptr) - 1u;
                const far_ptr_t * font = ui_fonts + current_font_idx;
                MemcpyBanked(&vwf_current_font_desc, font->ptr, sizeof(font_desc_t), vwf_current_font_bank = font->bank);
                hwt_check_font(current_font_idx);
                break;
            }
            case 0x03:
                // gotoxy (tile coordinates, 1-based); background coordinates are
                // relative to the scrolled origin and wrap within the 32x32 map
                hwt_flush_pending();
                if (current_text_layer == TEXT_LAYER_BKG) {
                    hwt_dest_ptr = hwt_dest_base = text_render_base_addr + ((bkg_offset_x + (UWORD)(*++hwt_text_ptr - 1u)) & 31) + (((bkg_offset_y + (UWORD)(*++hwt_text_ptr - 1u)) << 5) & 1023);
                } else {
                    hwt_dest_ptr = hwt_dest_base = text_render_base_addr + (*++hwt_text_ptr - 1u) + (*++hwt_text_ptr - 1u) * 32u;
                }
                break;
            case 0x04: {
                // relative gotoxy
                hwt_flush_pending();
                BYTE dx = (BYTE)(*++hwt_text_ptr);
                if (dx > 0) dx--;
                BYTE dy = (BYTE)(*++hwt_text_ptr);
                if (dy > 0) dy--;
                hwt_dest_base = hwt_dest_ptr += dx + dy * 32;
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
                hwt_text_ptr++;
                // if high speed then skip waiting
                if (text_draw_speed) {
                    // wait for key press (parameter is a mask)
                    if (INPUT_PRESSED(*hwt_text_ptr)) {
                        // mask matches
                        text_ff_joypad = current_text_ff_joypad;
                        INPUT_RESET;
                    } else {
                        // go back to 0x06 control code
                        hwt_text_ptr--;
                        hwt_current_text_speed = 0;
                        return FALSE;
                    }
                }
                hwt_current_text_speed = ui_time_masks[text_draw_speed];
                break;
            case 0x07:  // text color: not supported for half-width, skip parameter
            case 0x08:  // text direction: half-width rendering is left-to-right only, skip parameter
                ++hwt_text_ptr;
                break;
            case 0x09:
                break;
            case '\n':  // 0x0a
                // new line
                hwt_flush_pending();
                hwt_dest_ptr = hwt_dest_base += 32u;
                break;
            case 0x0b:
            #ifdef CGB
                text_palette = (((*++hwt_text_ptr) - 1u) & 0x07u);
            #else
                ++hwt_text_ptr;
            #endif
                break;
            case '\r':  // 0x0d
                // new line and scroll the text area
                hwt_flush_pending();
                if ((hwt_dest_ptr + 32u) > (UBYTE *)((((UWORD)text_scroll_addr + ((UWORD)text_scroll_height << 5)) & 0xFFE0) - 1)) {
                    scroll_rect(text_scroll_addr, text_scroll_width, text_scroll_height, text_scroll_fill);
#ifdef CGB
                    if (_is_CGB) {
                        VBK_REG = 1;
                        scroll_rect(text_scroll_addr, text_scroll_width, text_scroll_height, overlay_priority | (text_palette & 0x07u));
                        VBK_REG = 0;
                    }
#endif
                    hwt_dest_ptr = hwt_dest_base;
                } else {
                    hwt_dest_ptr = hwt_dest_base += 32u;
                }
                break;
            case 0x05:
                // escape symbol
                hwt_text_ptr++;
                // fall through
            default:
                if (hwt_pending) {
                    hwt_emit_pair(hwt_pending, *hwt_text_ptr);
                    hwt_pending = 0;
                } else {
                    // buffer the left character; drawn when its pair completes
                    hwt_pending = *hwt_text_ptr;
                }
                hwt_text_ptr++;
                return TRUE;
        }
        hwt_text_ptr++;
    }
}

// draw ui_text_data instantly (all control codes processed, no waiting)
void hwt_display_text(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    hwt_text_ptr = 0;
    hwt_text_drawn = FALSE;
    do {
        hwt_draw_text_buffer_char();
    } while (!hwt_text_drawn);
}

// draw ui_text_data at the current text speed, blocking until done.
// keeps actors/camera/scroll updating while it draws (modal loop).
void hwt_display_text_speed(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    INPUT_RESET;
    hwt_text_ptr = 0;
    hwt_text_drawn = text_ff = FALSE;
    hwt_current_text_speed = 0;
    UBYTE play_sound, speed_wait = FALSE;
    do {
        // too fast - wait
        if ((text_ff_joypad) && (INPUT_A_OR_B_PRESSED)) {
            text_ff = TRUE;
        } else {
            if (game_time & hwt_current_text_speed) {
                speed_wait = TRUE;
            }
        }
        // render next char
        if (!speed_wait) {
            do {
                play_sound = hwt_draw_text_buffer_char();
            } while (((text_ff) || (text_draw_speed == 0)) && (!hwt_text_drawn));
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
    } while (!hwt_text_drawn);
}

// waitable dialogue driver for VM_INVOKE: renders one speed-tick of text per
// call and yields back to the VM, so the script engine stays responsive.
UBYTE hwt_display_dialogue(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    (void)stack_frame;
    UBYTE play_sound, speed_wait = FALSE;
    if (start) {
        INPUT_RESET;
        hwt_text_ptr = 0;
        hwt_text_drawn = text_ff = FALSE;
        hwt_current_text_speed = 0;
    }
    // all drawn - nothing to do
    if (!hwt_text_drawn) {
        // too fast - wait
        if ((text_ff_joypad) && (INPUT_A_OR_B_PRESSED)) {
            text_ff = TRUE;
        } else {
            if (game_time & hwt_current_text_speed) {
                speed_wait = TRUE;
            }
        }
        // render next char
        if (!speed_wait) {
            do {
                play_sound = hwt_draw_text_buffer_char();
            } while (((text_ff) || (text_draw_speed == 0)) && (!hwt_text_drawn));
            // play sound
            if ((play_sound) && (text_sound_bank != SFX_STOP_BANK)) music_play_sfx(text_sound_bank, text_sound_data, text_sound_mask, MUSIC_SFX_PRIORITY_NORMAL);
        }
        ((SCRIPT_CTX *)THIS)->waitable = TRUE;
        return FALSE;
    }
    return TRUE;
}

void hwt_reset_cache(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    hwt_cache_reset();
}

void hwt_set_tile_range(SCRIPT_CTX * THIS) OLDCALL BANKED {
    // FN_ARG0 is the argument pushed last (top of VM stack)
    hwt_first_tile      = *(UBYTE *)VM_REF_TO_PTR(FN_ARG2);
    hwt_last_tile       = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    hwt_tile_placement  = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    hwt_cache_reset();
}
