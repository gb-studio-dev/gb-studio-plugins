#pragma bank 255

// engineAlt variant for ContinuousScenePlugin / ScreenScrollPlugin: those
// plugins scroll the hardware background map and expose the scrolled origin
// as bkg_offset_x / bkg_offset_y (scroll.h) plus current_text_layer (ui.h).
// Background-layer drawing starts from the visible origin and wraps within
// the 32x32 map, exactly like the host engines' own ui.c and the
// UiAltDisplayTextPlugin engineAlt variants.
//
// Tall (8x16) text renderer using the Dragon Warrior III (GBC) technique:
// every character is a double-height glyph made of two vertically stacked
// 8x8 tiles (32 bytes of 2bpp data). DW3 pre-fills the dialog tilemap with
// sequential even/odd tile-index pairs so printing a character is a single
// 32-byte copy into VRAM (see dragon-warrior-3-gbc game/src/text/draw.asm:
// DrawCharacter copies $20 bytes when the double-height bit of
// W_TextConfiguration is set, and DrawTextBoxAndSetupTilesetLoad writes the
// paired tilemap with "inc a; inc a" per column).
//
// In GB Studio the text layer tilemap is dynamic, so instead of pre-tiling
// the window this plugin allocates tile pairs from a reserved VRAM range
// through an LRU cache keyed by character (same proven structure as the
// HalfWidthTextPlugin): repeated characters reuse their pair instead of
// consuming new tiles. Cache entry i owns tiles first_tile + 2*i (top half)
// and first_tile + 2*i + 1 (bottom half).
//
// Glyphs come from the current GB Studio font asset laid out in the DW3
// grid: the font PNG is 128px wide with 8x16 character cells, 16 characters
// per row, so image tile rows alternate 16 top halves / 16 bottom halves.
// The font compiler's automatic recode table is positional
// (table[32 + imageTilePos] = deduplicated tile index), which lets the
// renderer find both halves arithmetically while tile deduplication is
// resolved by the table itself.

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
#include "tall_text.h"

// engine fields (order must match engine.json)
UBYTE ttx_first_tile;
UBYTE ttx_last_tile;
UBYTE ttx_tile_placement;

UBYTE ttx_text_drawn;
UBYTE ttx_current_text_speed;

// capacity of the tile-pair LRU cache; project-configurable through the
// TTX_CACHE_MAX engine field (Settings -> Tall Text), 3 bytes WRAM per entry
#ifndef TTX_CACHE_MAX
#define TTX_CACHE_MAX 64
#endif
#define TTX_NULL 0xFFu

// TTX_CACHE_ENABLED engine field (Settings -> Tall Text): unchecking it
// compiles the LRU bookkeeping out entirely. Characters are then rendered into
// the reserved tile pairs round-robin, which costs no WRAM and no lookup but
// re-uploads every character on every use, so the reserved range must hold all
// the characters visible at once. Without the LRU arrays the entry count is
// limited by the reserved range alone, not by TTX_CACHE_MAX.
#ifdef TTX_CACHE_ENABLED
#define TTX_ENTRY_MAX TTX_CACHE_MAX
#else
#define TTX_ENTRY_MAX 254u
#endif

// where cached tiles live in VRAM (ttx_tile_placement engine field).
// bank 1 placements only take effect on CGB (color-only or mixed mode on
// color hardware): the tilemap attribute bit 3 selects the tile data bank,
// so bank-1 glyphs coexist with scene tiles of the same index in bank 0.
// TTX_PLACEMENT_ALTERNATE spreads entries across both banks, doubling the
// characters a given tile range can hold.
#define TTX_PLACEMENT_BANK0     0
#define TTX_PLACEMENT_BANK1     1
#define TTX_PLACEMENT_ALTERNATE 2

// placement in effect for the current cache generation (bank-1 modes fall
// back to bank 0 when not running on CGB hardware)
static UBYTE ttx_placement_eff;

// bank-0-only: cache entry i owns VRAM tiles (ttx_first_tile + 2*i) and
// (+ 2*i + 1); alternate placement maps entries 2k/2k+1 onto the same pair
// of tile indices in banks 0 and 1 respectively
#ifdef TTX_CACHE_ENABLED
static UBYTE ttx_key[TTX_CACHE_MAX];     // character the pair was rendered from
static UBYTE ttx_next[TTX_CACHE_MAX];    // towards least recently used
static UBYTE ttx_prev[TTX_CACHE_MAX];    // towards most recently used
static UBYTE ttx_head;                   // most recently used entry
static UBYTE ttx_tail;                   // least recently used entry (evicted first)
static UBYTE ttx_cache_font_idx;         // font the cached tiles were rendered with
#endif
static UBYTE ttx_count;                  // entries allocated so far (next pair to reuse when uncached)
static UBYTE ttx_size;                   // usable entries in the reserved range
static UBYTE ttx_initialized = FALSE;

// char printer internals
static UBYTE * ttx_text_ptr = 0;
static UBYTE * ttx_dest_ptr;
static UBYTE * ttx_dest_base;

void ttx_cache_reset(void) BANKED {
    UBYTE n;
#ifdef CGB
    ttx_placement_eff = (_is_CGB) ? ttx_tile_placement : TTX_PLACEMENT_BANK0;
#else
    ttx_placement_eff = TTX_PLACEMENT_BANK0;
#endif
    if (ttx_last_tile < ttx_first_tile) {
        n = TTX_ENTRY_MAX;
    } else {
        UBYTE range = ttx_last_tile - ttx_first_tile + 1u;   // 0 means the full 256 tiles
        if (ttx_placement_eff == TTX_PLACEMENT_ALTERNATE) {
            n = range & 0xFEu;          // one entry per tile pair per bank
        } else {
            n = range >> 1;
        }
#if TTX_ENTRY_MAX < 254u
        // only the LRU tables can cap the count below what the range holds
        if (n > TTX_ENTRY_MAX) n = TTX_ENTRY_MAX;
#endif
        if (n == 0) n = TTX_ENTRY_MAX;  // range too small for one tile pair
    }
    ttx_size = n;
    ttx_count = 0;
#ifdef TTX_CACHE_ENABLED
    ttx_head = ttx_tail = TTX_NULL;
    ttx_cache_font_idx = vwf_current_font_idx;
#endif
    ttx_initialized = TRUE;
}

#ifdef TTX_CACHE_ENABLED
// cached tiles were rendered from another font's glyphs: forget them
static void ttx_check_font(UBYTE font_idx) {
    if (font_idx != ttx_cache_font_idx) {
        ttx_cache_reset();
        ttx_cache_font_idx = font_idx;
    }
}
#else
// nothing is retained between characters, so a font change needs no invalidation
// (and rewinding the round-robin cursor mid-text would overwrite live tiles)
#define ttx_check_font(font_idx) ((void)(font_idx))
#endif

// top-half VRAM tile index owned by cache entry i (bottom half is + 1)
static UBYTE ttx_entry_tile(UBYTE i) {
    if (ttx_placement_eff == TTX_PLACEMENT_ALTERNATE) return ttx_first_tile + (i & 0xFEu);
    return ttx_first_tile + (i << 1);
}

// VRAM tile data bank the pair of cache entry i lives in
static UBYTE ttx_entry_bank(UBYTE i) {
    if (ttx_placement_eff == TTX_PLACEMENT_BANK1) return 1;
    if (ttx_placement_eff == TTX_PLACEMENT_ALTERNATE) return i & 0x01u;
    return 0;
}

// upload both halves of a character to the pair of VRAM tiles.
// the DW3 grid layout puts the top half of character n (n = ch - 32) at
// image tile ((n >> 4) * 32 + (n & 15)) and the bottom half 16 tiles later;
// the automatic recode table is indexed by (32 + image tile position) for
// fonts under 16 tile rows and resolves tile deduplication.
static void ttx_load_glyph_tiles(UBYTE tile, UBYTE bank, UBYTE ch) {
    UBYTE n = ch - 0x20u;
    UWORD idx = 32u + (((UWORD)(n & 0xF0u)) << 1) + (n & 0x0Fu);
    UBYTE top = ReadBankedUBYTE(vwf_current_font_desc.recode_table + idx, vwf_current_font_bank);
    UBYTE bot = ReadBankedUBYTE(vwf_current_font_desc.recode_table + idx + 16u, vwf_current_font_bank);
    (void)bank;
#ifdef CGB
    if (bank) VBK_REG = 1;
#endif
    SetBankedBkgData(tile, 1, vwf_current_font_desc.bitmaps + ((UWORD)top << 4), vwf_current_font_bank);
    SetBankedBkgData(tile + 1u, 1, vwf_current_font_desc.bitmaps + ((UWORD)bot << 4), vwf_current_font_bank);
#ifdef CGB
    if (bank) VBK_REG = 0;
#endif
}

#ifdef TTX_CACHE_ENABLED
// look the character up in the LRU list; on hit hoist the entry to the head
// and reuse its tile pair, on miss allocate a fresh pair (or evict the least
// recently used one) and render the character into it.
// returns the cache entry index (tile/bank via ttx_entry_tile/ttx_entry_bank).
static UBYTE ttx_get_char_entry(UBYTE ch) {
    UBYTE i, p, nx;
    for (i = ttx_head; i != TTX_NULL; i = ttx_next[i]) {
        if (ttx_key[i] == ch) {
            if (i != ttx_head) {
                // unlink and move to front
                p = ttx_prev[i];
                nx = ttx_next[i];
                ttx_next[p] = nx;
                if (nx != TTX_NULL) ttx_prev[nx] = p; else ttx_tail = p;
                ttx_prev[i] = TTX_NULL;
                ttx_next[i] = ttx_head;
                ttx_prev[ttx_head] = i;
                ttx_head = i;
            }
            return i;
        }
    }
    // miss
    if (ttx_count < ttx_size) {
        i = ttx_count++;
    } else {
        // evict least recently used
        i = ttx_tail;
        p = ttx_prev[i];
        if (p != TTX_NULL) {
            ttx_next[p] = TTX_NULL;
            ttx_tail = p;
        } else {
            ttx_head = ttx_tail = TTX_NULL;
        }
    }
    ttx_key[i] = ch;
    ttx_prev[i] = TTX_NULL;
    ttx_next[i] = ttx_head;
    if (ttx_head != TTX_NULL) ttx_prev[ttx_head] = i;
    ttx_head = i;
    if (ttx_tail == TTX_NULL) ttx_tail = i;
    ttx_load_glyph_tiles(ttx_entry_tile(i), ttx_entry_bank(i), ch);
    return i;
}
#else
// cache disabled: hand the reserved tile pairs out round-robin and re-upload
// the character every time it is printed
static UBYTE ttx_get_char_entry(UBYTE ch) {
    UBYTE i = ttx_count;
    if (++ttx_count >= ttx_size) ttx_count = 0;
    ttx_load_glyph_tiles(ttx_entry_tile(i), ttx_entry_bank(i), ch);
    return i;
}
#endif

// write one tilemap cell; on CGB the attribute byte carries the palette and
// the tile data bank (bit 3) the glyph was uploaded to
inline void ttx_set_tile(UBYTE * addr, UBYTE tile, UBYTE bank) {
    (void)bank;
#ifdef CGB
    if (_is_CGB) {
        VBK_REG = 1;
        set_vram_byte(addr, overlay_priority | (text_palette & 0x07u) | (bank ? 0x08u : 0x00u));
        VBK_REG = 0;
    }
#endif
    set_vram_byte(addr, tile);
}

static void ttx_emit_char(UBYTE ch) {
    UBYTE entry = ttx_get_char_entry(ch);
    UBYTE tile = ttx_entry_tile(entry);
    UBYTE bank = ttx_entry_bank(entry);
    if (current_text_layer == TEXT_LAYER_BKG) {
        // wrap around within the 32-tile map row instead of bleeding into the next line
        if (((UBYTE)ttx_dest_ptr >> 5) != ((UBYTE)ttx_dest_base >> 5)) {
            ttx_dest_ptr -= 32u;
        }
        ttx_set_tile(ttx_dest_ptr, tile, bank);          // top half
        // bottom half one map row below, wrapped within the 32x32 map
        ttx_set_tile(text_render_base_addr + (((UWORD)(ttx_dest_ptr - text_render_base_addr) + 32u) & 1023u), tile + 1u, bank);
    } else {
        ttx_set_tile(ttx_dest_ptr, tile, bank);              // top half
        ttx_set_tile(ttx_dest_ptr + 32u, tile + 1u, bank);   // bottom half, map row below
    }
    ttx_dest_ptr++;
}

// renders one character (or a run of control codes) of ui_text_data.
// mirrors the stock ui_draw_text_buffer_char control-code handling, except
// every text line is two tilemap rows tall.
// returns TRUE when a printable character was consumed (for sound/speed).
UBYTE ttx_draw_text_buffer_char(void) BANKED {
    static UBYTE current_font_idx, current_text_ff_joypad, current_text_draw_speed;

    if (ttx_text_ptr == 0) {
        // set the delay mask
        ttx_current_text_speed = ui_time_masks[text_draw_speed];
        // save font and speed global properties
        current_font_idx        = vwf_current_font_idx;
        current_text_ff_joypad  = text_ff_joypad;
        current_text_draw_speed = text_draw_speed;
        if (!ttx_initialized) ttx_cache_reset();
        ttx_check_font(vwf_current_font_idx);
        // current char pointer
        ttx_text_ptr = ui_text_data;
        // VRAM destination
        if ((text_options & TEXT_OPT_PRESERVE_POS) == 0) {
            if (current_text_layer == TEXT_LAYER_BKG) {
                // start at the visible origin of the scrolled background map
                ttx_dest_base = text_render_base_addr + ((((UWORD)bkg_offset_y << 5) + 32) & 1023) + (((UWORD)bkg_offset_x + 1) & 31);
            } else {
                ttx_dest_base = text_render_base_addr;
            }
            ttx_dest_ptr = ttx_dest_base;
        }
    }
    // normally runs once, but if control code encountered, then process them until printable symbol or terminator
    while (TRUE) {
        switch (*ttx_text_ptr) {
            case 0x00: {
                ttx_text_ptr = 0;
                ttx_text_drawn = TRUE;
                // restore font and speed global properties
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
                text_draw_speed = (*(++ttx_text_ptr) - 1u) & 0x07u;
                ttx_current_text_speed = ui_time_masks[text_draw_speed];
                break;
            case 0x02: {
                // set current font (temporary within this text, like stock)
                current_font_idx = *(++ttx_text_ptr) - 1u;
                const far_ptr_t * font = ui_fonts + current_font_idx;
                MemcpyBanked(&vwf_current_font_desc, font->ptr, sizeof(font_desc_t), vwf_current_font_bank = font->bank);
                ttx_check_font(current_font_idx);
                break;
            }
            case 0x03:
                // gotoxy (tile coordinates, 1-based); background coordinates are
                // relative to the scrolled origin and wrap within the 32x32 map
                if (current_text_layer == TEXT_LAYER_BKG) {
                    ttx_dest_ptr = ttx_dest_base = text_render_base_addr + ((bkg_offset_x + (UWORD)(*++ttx_text_ptr - 1u)) & 31) + (((bkg_offset_y + (UWORD)(*++ttx_text_ptr - 1u)) << 5) & 1023);
                } else {
                    ttx_dest_ptr = ttx_dest_base = text_render_base_addr + (*++ttx_text_ptr - 1u) + (*++ttx_text_ptr - 1u) * 32u;
                }
                break;
            case 0x04: {
                // relative gotoxy (tile coordinates)
                BYTE dx = (BYTE)(*++ttx_text_ptr);
                if (dx > 0) dx--;
                BYTE dy = (BYTE)(*++ttx_text_ptr);
                if (dy > 0) dy--;
                ttx_dest_base = ttx_dest_ptr += dx + dy * 32;
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
                ttx_text_ptr++;
                // if high speed then skip waiting
                if (text_draw_speed) {
                    // wait for key press (parameter is a mask)
                    if (INPUT_PRESSED(*ttx_text_ptr)) {
                        // mask matches
                        text_ff_joypad = current_text_ff_joypad;
                        INPUT_RESET;
                    } else {
                        // go back to 0x06 control code
                        ttx_text_ptr--;
                        ttx_current_text_speed = 0;
                        return FALSE;
                    }
                }
                ttx_current_text_speed = ui_time_masks[text_draw_speed];
                break;
            case 0x07:  // text color: unsupported (would need the fill in the cache key), skip parameter
            case 0x08:  // text direction: tall rendering is left-to-right only, skip parameter
                ++ttx_text_ptr;
                break;
            case 0x09:
                break;
            case '\n':  // 0x0a
                // new line: text lines are two tilemap rows tall
                ttx_dest_ptr = ttx_dest_base += 64u;
                break;
            case 0x0b:
            #ifdef CGB
                text_palette = (((*++ttx_text_ptr) - 1u) & 0x07u);
            #else
                ++ttx_text_ptr;
            #endif
                break;
            case '\r': {  // 0x0d
                // new line and scroll the text area (two tilemap rows per text line)
                UBYTE * scroll_end = (UBYTE *)((((UWORD)text_scroll_addr + ((UWORD)text_scroll_height << 5)) & 0xFFE0) - 1);
                if ((ttx_dest_base + 96u) > scroll_end) {
                    scroll_rect(text_scroll_addr, text_scroll_width, text_scroll_height, text_scroll_fill);
                    scroll_rect(text_scroll_addr, text_scroll_width, text_scroll_height, text_scroll_fill);
#ifdef CGB
                    if (_is_CGB) {
                        VBK_REG = 1;
                        scroll_rect(text_scroll_addr, text_scroll_width, text_scroll_height, overlay_priority | (text_palette & 0x07u));
                        scroll_rect(text_scroll_addr, text_scroll_width, text_scroll_height, overlay_priority | (text_palette & 0x07u));
                        VBK_REG = 0;
                    }
#endif
                    ttx_dest_ptr = ttx_dest_base;
                } else {
                    ttx_dest_ptr = ttx_dest_base += 64u;
                }
                break;
            }
            case 0x05:
                // escape symbol
                ttx_text_ptr++;
                // fall through
            default:
                ttx_emit_char(*ttx_text_ptr);
                ttx_text_ptr++;
                return TRUE;
        }
        ttx_text_ptr++;
    }
}

// draw ui_text_data instantly (all control codes processed, no waiting)
void ttx_display_text(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    ttx_text_ptr = 0;
    ttx_text_drawn = FALSE;
    do {
        ttx_draw_text_buffer_char();
    } while (!ttx_text_drawn);
}

// draw ui_text_data at the current text speed, blocking until done.
// keeps actors/camera/scroll updating while it draws (modal loop).
void ttx_display_text_speed(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    INPUT_RESET;
    ttx_text_ptr = 0;
    ttx_text_drawn = text_ff = FALSE;
    ttx_current_text_speed = 0;
    UBYTE play_sound, speed_wait = FALSE;
    do {
        // too fast - wait
        if ((text_ff_joypad) && (INPUT_A_OR_B_PRESSED)) {
            text_ff = TRUE;
        } else {
            if (game_time & ttx_current_text_speed) {
                speed_wait = TRUE;
            }
        }
        // render next char
        if (!speed_wait) {
            do {
                play_sound = ttx_draw_text_buffer_char();
            } while (((text_ff) || (text_draw_speed == 0)) && (!ttx_text_drawn));
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
    } while (!ttx_text_drawn);
}

// waitable dialogue driver for VM_INVOKE: renders one speed-tick of text per
// call and yields back to the VM, so the script engine stays responsive.
UBYTE ttx_display_dialogue(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    (void)stack_frame;
    UBYTE play_sound, speed_wait = FALSE;
    if (start) {
        INPUT_RESET;
        ttx_text_ptr = 0;
        ttx_text_drawn = text_ff = FALSE;
        ttx_current_text_speed = 0;
    }
    // all drawn - nothing to do
    if (!ttx_text_drawn) {
        // too fast - wait
        if ((text_ff_joypad) && (INPUT_A_OR_B_PRESSED)) {
            text_ff = TRUE;
        } else {
            if (game_time & ttx_current_text_speed) {
                speed_wait = TRUE;
            }
        }
        // render next char
        if (!speed_wait) {
            do {
                play_sound = ttx_draw_text_buffer_char();
            } while (((text_ff) || (text_draw_speed == 0)) && (!ttx_text_drawn));
            // play sound
            if ((play_sound) && (text_sound_bank != SFX_STOP_BANK)) music_play_sfx(text_sound_bank, text_sound_data, text_sound_mask, MUSIC_SFX_PRIORITY_NORMAL);
        }
        ((SCRIPT_CTX *)THIS)->waitable = TRUE;
        return FALSE;
    }
    return TRUE;
}

void ttx_reset_cache(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    ttx_cache_reset();
}

void ttx_set_tile_range(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    // FN_ARG0 is the argument pushed last (top of VM stack)
    ttx_first_tile      = *(UBYTE *)VM_REF_TO_PTR(FN_ARG2);
    ttx_last_tile       = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    ttx_tile_placement  = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    ttx_cache_reset();
}

// ---- stock UI replacement -------------------------------------------------
// With TTX_REPLACE_STOCK_UI set, the plugin's ui.c override leaves
// ui_draw_text_buffer_char undefined, and this claims the symbol. Everything
// in the stock engine that drew text -- ui_update(), and through it Display
// Dialogue, Display Text and ui_run_menu() -- lands here instead, so stock
// events render with this plugin and the stock renderer costs no ROM.
#ifdef TTX_REPLACE_STOCK_UI
UBYTE ui_draw_text_buffer_char(void) BANKED {
    return ttx_draw_text_buffer_char();
}
#endif // TTX_REPLACE_STOCK_UI

// ---- menu ------------------------------------------------------------------
// The stock menu driver steps its cursor one 8px row per option. A line of this
// plugin's text is two rows, so the cursor has to move in the same stride as
// whatever drew the text -- hence this copy, with the stride as a parameter.
//
// It is always compiled, under its own name, so the plugin's Menu event can call
// it whether or not the stock renderer is replaced. When TTX_REPLACE_STOCK_UI
// does remove the stock ui_run_menu, the symbol is rewired to it further down.
//
// start_item == NULL means a single-column menu of `count` options, laid out the
// way this plugin's Menu event draws them. Synthesising those saves carrying a
// menu_item_t table in WRAM just to describe previous/next.
static void ttx_menu_item_at(menu_item_t * out, UBYTE index, UBYTE count) {
    out->X = 1u;
    out->Y = index;              // stock row numbering; the stride is applied below
    out->iL = 1u;
    out->iR = count;
    out->iU = (index > 1u) ? (UBYTE)(index - 1u) : 0u;
    out->iD = (index < count) ? (UBYTE)(index + 1u) : 0u;
}

static void ttx_menu_fetch(menu_item_t * out, menu_item_t * start_item, UBYTE bank,
                              UBYTE index, UBYTE count) {
    if (start_item == 0) {
        ttx_menu_item_at(out, index, count);
    } else {
        MemcpyBanked(out, start_item + (index - 1u), sizeof(menu_item_t), bank);
    }
}

// Option n occupies rows (n - 1) * pitch + 1 through + pitch. Which of those the
// cursor takes is the TTX_MENU_CURSOR_ROW engine setting: 0 the upper tile, 1
// the lower. Beside a 16px line the upper tile reads as floating above the word
// and the lower sits level with the baseline, but which looks right depends on
// the font. At pitch 1 there is only one row and both settings give the stock
// position, so this is inert for single-row text.
#ifndef TTX_MENU_CURSOR_ROW
#define TTX_MENU_CURSOR_ROW 1
#endif

static void ttx_menu_cursor(const menu_item_t * item, UBYTE tile, UBYTE pitch) {
    // a compile-time constant either way, so the ternary folds away
    UBYTE ofs = (TTX_MENU_CURSOR_ROW) ? pitch : 1u;
    UBYTE y = (item->Y) ? (UBYTE)(((item->Y - 1u) * pitch) + ofs) : 0u;
#ifdef CGB
    if (_is_CGB) {
        VBK_REG = VBK_ATTRIBUTES;
        set_win_tile_xy(item->X, y, overlay_priority | (text_palette & 0x07u));
        VBK_REG = VBK_TILES;
    }
#endif
    set_win_tile_xy(item->X, y, tile);
}

UBYTE ttx_ui_run_menu(menu_item_t * start_item, UBYTE bank, UBYTE options,
                       UBYTE count, UBYTE start_index, UBYTE pitch) BANKED {
    menu_item_t current_menu_item;
    UBYTE current_index = ((options & MENU_SET_START) ? start_index : 1u), next_index = 0u;
    ttx_menu_fetch(&current_menu_item, start_item, bank, current_index, count);

    ttx_menu_cursor(&current_menu_item, ui_cursor_tile, pitch);

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
        ttx_menu_cursor(&current_menu_item, ui_bg_tile, pitch);
        ttx_menu_fetch(&current_menu_item, start_item, bank, current_index, count);
        ttx_menu_cursor(&current_menu_item, ui_cursor_tile, pitch);
        next_index = 0;
    }
}

// VM native behind this plugin's Menu event. VM_CHOICE is the only instruction
// that carries a menu, and it always calls the stock ui_run_menu -- so the event
// calls ttx_ui_run_menu through here instead, and works with the stock renderer
// left in place.
//
// args (push order): dest, options, count, start_index
void ttx_menu(SCRIPT_CTX * THIS) OLDCALL BANKED {
    INT16 dest    = *(INT16 *)VM_REF_TO_PTR(FN_ARG3);
    UBYTE options = *(UBYTE *)VM_REF_TO_PTR(FN_ARG2);
    UBYTE count   = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    UBYTE start   = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    UBYTE result;
    INT16 * A;
    // the options were drawn in full before this ran, so stop ui_update() inside
    // the menu loop from rendering the stock text buffer over the top of them
    text_drawn = TRUE;
    result = ttx_ui_run_menu(0, 0, options, count, start, 2u);
    // negative index = stack-local; step past the four arguments still on the stack
    A = (dest < 0) ? (INT16 *)(THIS->stack_ptr + dest - 4) : (INT16 *)(script_memory + dest);
    *A = result;
}

#ifdef TTX_REPLACE_STOCK_UI
// The stock renderer is gone, so everything on screen is this plugin's and every
// menu is two rows per option -- including the stock Menu event's, which reaches
// here through VM_CHOICE.
UBYTE ui_run_menu(menu_item_t * start_item, UBYTE bank, UBYTE options, UBYTE count, UBYTE start_index) BANKED {
    return ttx_ui_run_menu(start_item, bank, options, count, start_index, 2u);
}
#endif // TTX_REPLACE_STOCK_UI
