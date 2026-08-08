#pragma bank 255

// engineAlt variant for ContinuousScenePlugin / ScreenScrollPlugin: those
// plugins scroll the hardware background map and expose the scrolled origin
// as bkg_offset_x / bkg_offset_y (scroll.h) plus current_text_layer (ui.h).
// Background-layer drawing starts from the visible origin and wraps within
// the 32x32 map, exactly like the host engines' own ui.c and the
// UiAltDisplayTextPlugin engineAlt variants.
//
// 16x16 text renderer: every character is a 2x2 quad of 8x8 tiles (64 bytes of
// 2bpp data) streamed into a reserved range of background tiles as it is
// printed. Built for scripts that need large character sets and full-square
// glyphs -- Chinese, Japanese kanji, Korean -- where a font asset per character
// is not an option.
//
// Two glyph sources, picked per character by its code:
//
//  * "wide" characters (two bytes, both >= 0x80) come from a GLYPH SHEET: an
//    ordinary GB Studio tileset asset holding the glyph bitmaps in image order.
//    Tilesets carry a UWORD tile count and are addressed by offset, so one
//    sheet holds up to 1024 tiles (256 glyphs, one ROM bank); several sheets
//    can be registered at once and cover one contiguous glyph index range each.
//    This is the path a CJK project uses. Font assets cannot do this job: the
//    font compiler's recode table stores one BYTE per image tile, capping a
//    font at 256 unique tiles -- 64 full-square glyphs.
//
//  * "narrow" characters (one byte, 0x20-0x7F) come from the CURRENT GB STUDIO
//    FONT asset. By default they are half width -- one 8x16 cell, two tiles,
//    advancing one column -- so Latin letters and digits mixed into a Chinese
//    line stay readable instead of being stretched over a full square. The font
//    PNG is then a plain TallTextPlugin font: 128px wide, 8x16 cells, 16
//    characters per row. Turning the half-width engine setting off switches
//    them to full width: 256px wide PNG, 16x16 cells, four tiles, two columns.
//    Either way the font compiler's automatic recode table is positional
//    (table[32 + imageTilePos] = deduplicated tile index), which lets the
//    renderer find every quarter arithmetically while tile deduplication is
//    resolved by the table itself.
//
// The 2-byte encoding is produced by the `mapping` block of the font asset's
// .json (GB Studio maps a source string to a byte sequence at compile time):
// glyph index g is written as lead 0x80 + (g >> 7), trail 0x80 + (g & 0x7F),
// so g spans 0-16383 and neither byte can ever collide with a control code.
// tools/make_glyph_sheets.js generates the sheets and that mapping together.
//
// Rendered quads are allocated from the reserved VRAM range through an LRU
// cache keyed by character code (same proven structure as the TallTextPlugin
// and HalfWidthTextPlugin): repeated characters reuse their quad instead of
// consuming new tiles. The cache is optional -- turning it off compiles the
// bookkeeping out and hands quads out round-robin instead.

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
#include "glyph_text.h"

// GTX_VWF_ENABLED engine field (Settings -> Glyph Text): render text with
// VARIABLE-WIDTH glyphs instead of fixed 16px squares. Characters then advance
// by their own width and no longer land on tile boundaries, so text has to be
// composed pixel by pixel into tile columns -- and a glyph's tiles depend on the
// pixel offset it happened to start at, which is exactly what a per-character
// cache cannot express. The cache is therefore compiled out in this mode.
#ifdef GTX_VWF_ENABLED
#undef GTX_CACHE_ENABLED
#endif

// engine fields (order must match engine.json)
UBYTE gtx_first_tile;
UBYTE gtx_last_tile;
UBYTE gtx_tile_placement;

UBYTE gtx_text_drawn;
UBYTE gtx_current_text_speed;

// capacity of the tile-quad LRU cache; project-configurable through the
// GTX_CACHE_MAX engine field (Settings -> Glyph Text), 4 bytes WRAM per entry
#ifndef GTX_CACHE_MAX
#define GTX_CACHE_MAX 32
#endif

// how many glyph sheets can be registered at once (GTX_SHEET_MAX engine field),
// 6 bytes of WRAM each
#ifndef GTX_SHEET_MAX
#define GTX_SHEET_MAX 4
#endif

// glyphs per row in a sheet image (GTX_SHEET_COLS engine field). MUST be a
// power of two: the tile offset arithmetic below relies on the compiler turning
// the divide and multiply into shifts. tools/make_glyph_sheets.js emits 16.
#ifndef GTX_SHEET_COLS
#define GTX_SHEET_COLS 16
#endif

// first byte value that starts a two-byte (wide) character code
#ifndef GTX_LEAD_MIN
#define GTX_LEAD_MIN 0x80
#endif

#define GTX_NULL 0xFFu

// cache key layout. wide glyph indices only ever reach 0x3FFF, so bit 15 is
// free to mark a narrow character rendered from a font asset; the font index
// rides along in bits 8-14 because the same byte means a different glyph in a
// different font. Keying on it is what lets text switch fonts mid-line -- the
// two fonts' glyphs simply occupy separate cache entries, instead of the cache
// having to be thrown away (and the quads under already-drawn characters
// reused) every time a \002 goes past.
#define GTX_KEY_NARROW 0x8000u
#define GTX_KEY_FOR_NARROW(font_idx, ch) \
    (GTX_KEY_NARROW | (((UWORD)((font_idx) & 0x7Fu)) << 8) | (ch))

// tiles per character, and bytes of 2bpp data per character
#define GTX_TILES_PER_CHAR 4u

// what one allocation from the reserved range covers: a 2x2 quad for one
// character normally, or a 2x1 screen column of composed pixels under VWF
#ifdef GTX_VWF_ENABLED
#define GTX_TILES_PER_ENTRY 2u
#else
#define GTX_TILES_PER_ENTRY 4u
#endif
#define GTX_SHEET_ROW_BYTES (32u * GTX_SHEET_COLS)   // one image tile row of a sheet

// GTX_CACHE_ENABLED engine field (Settings -> Glyph Text): unchecking it
// compiles the LRU bookkeeping out entirely. Characters are then rendered into
// the reserved tile quads round-robin, which costs no WRAM and no lookup but
// re-uploads every character on every use, so the reserved range must hold all
// the characters visible at once. Without the LRU arrays the entry count is
// limited by the reserved range alone, not by GTX_CACHE_MAX.
#ifdef GTX_CACHE_ENABLED
#define GTX_ENTRY_MAX GTX_CACHE_MAX
#else
#define GTX_ENTRY_MAX 254u
#endif

// where cached tiles live in VRAM (gtx_tile_placement engine field).
// bank 1 placements only take effect on CGB (color-only or mixed mode on
// color hardware): the tilemap attribute bit 3 selects the tile data bank,
// so bank-1 glyphs coexist with scene tiles of the same index in bank 0.
// GTX_PLACEMENT_ALTERNATE spreads entries across both banks, doubling the
// characters a given tile range can hold.
#define GTX_PLACEMENT_BANK0     0
#define GTX_PLACEMENT_BANK1     1
#define GTX_PLACEMENT_ALTERNATE 2

// placement in effect for the current cache generation (bank-1 modes fall
// back to bank 0 when not running on CGB hardware)
static UBYTE gtx_placement_eff;

// a registered glyph sheet: a GB Studio tileset asset covering the contiguous
// wide-glyph index range [first, first + count)
typedef struct gtx_sheet_t {
    const UBYTE * ptr;   // tileset_t: UWORD n_tiles then the 2bpp tile data
    UBYTE bank;
    UWORD first;
    UWORD count;
} gtx_sheet_t;

static gtx_sheet_t gtx_sheets[GTX_SHEET_MAX];

// bank-0-only: cache entry i owns the four VRAM tiles starting at
// (gtx_first_tile + 4*i); alternate placement maps entries 2k/2k+1 onto the
// same four tile indices in banks 0 and 1 respectively
#ifdef GTX_CACHE_ENABLED
static UWORD gtx_key[GTX_CACHE_MAX];     // character code the quad was rendered from
static UBYTE gtx_next[GTX_CACHE_MAX];    // towards least recently used
static UBYTE gtx_prev[GTX_CACHE_MAX];    // towards most recently used
static UBYTE gtx_head;                   // most recently used entry
static UBYTE gtx_tail;                   // least recently used entry (evicted first)
#endif
static UBYTE gtx_count;                  // entries allocated so far (next quad to reuse when uncached)
static UBYTE gtx_size;                   // usable entries in the reserved range
static UBYTE gtx_initialized = FALSE;

// char printer internals
static UBYTE * gtx_text_ptr = 0;
static UBYTE * gtx_dest_ptr;
static UBYTE * gtx_dest_base;

#ifndef GTX_VWF_ENABLED
// blank quad, uploaded for a wide code no registered sheet covers
static const UBYTE gtx_blank[GTX_TILES_PER_CHAR * 16] = { 0 };
#define gtx_vwf_reset() ((void)0)
#else
static void gtx_vwf_reset(void);
#endif

void gtx_cache_reset(void) BANKED {
    UWORD n;
#ifdef CGB
    gtx_placement_eff = (_is_CGB) ? gtx_tile_placement : GTX_PLACEMENT_BANK0;
#else
    gtx_placement_eff = GTX_PLACEMENT_BANK0;
#endif
    if (gtx_last_tile < gtx_first_tile) {
        n = GTX_ENTRY_MAX;
    } else {
        n = ((UWORD)gtx_last_tile - gtx_first_tile + 1u) / GTX_TILES_PER_ENTRY;
        if (gtx_placement_eff == GTX_PLACEMENT_ALTERNATE) n <<= 1;   // one entry per bank
        if (n > GTX_ENTRY_MAX) n = GTX_ENTRY_MAX;
        if (n == 0) n = 1;              // range too small for one quad: reuse a single one
    }
    gtx_size = (UBYTE)n;
    gtx_count = 0;
    gtx_vwf_reset();
#ifdef GTX_CACHE_ENABLED
    gtx_head = gtx_tail = GTX_NULL;
#endif
    gtx_initialized = TRUE;
}

// first VRAM tile index owned by entry i
static UBYTE gtx_entry_tile(UBYTE i) {
    if (gtx_placement_eff == GTX_PLACEMENT_ALTERNATE) {
        return gtx_first_tile + ((i & 0xFEu) * (GTX_TILES_PER_ENTRY >> 1));
    }
    return gtx_first_tile + (i * GTX_TILES_PER_ENTRY);
}

// VRAM tile data bank the quad of cache entry i lives in
static UBYTE gtx_entry_bank(UBYTE i) {
    if (gtx_placement_eff == GTX_PLACEMENT_BANK1) return 1;
    if (gtx_placement_eff == GTX_PLACEMENT_ALTERNATE) return i & 0x01u;
    return 0;
}

// upload one image tile of the current font asset to a VRAM tile. the automatic
// recode table is indexed by (32 + image tile position) for fonts under 16 tile
// rows and resolves the font compiler's tile deduplication.
static void gtx_load_font_tile(UBYTE tile, UWORD idx) {
    UBYTE q = ReadBankedUBYTE(vwf_current_font_desc.recode_table + idx, vwf_current_font_bank);
    SetBankedBkgData(tile, 1, vwf_current_font_desc.bitmaps + ((UWORD)q << 4), vwf_current_font_bank);
}

// upload a narrow character from the current font asset.
static void gtx_load_font_glyph(UBYTE tile, UBYTE ch) {
    UBYTE n = ch - 0x20u;
#ifdef GTX_NARROW_HALFWIDTH
    // 8x16 cells, 16 per row (128px wide PNG): character n is at image tile
    // (2 * (n & 0xF0) + (n & 0x0F)), its bottom half 16 image tiles further on
    UWORD idx = 32u + (((UWORD)(n & 0xF0u)) << 1) + (n & 0x0Fu);
    gtx_load_font_tile(tile, idx);
    gtx_load_font_tile(tile + 1u, idx + 16u);
#else
    // 16x16 cells, 16 per row (256px wide PNG): character n is at image tile
    // (4 * (n & 0xF0) + 2 * (n & 0x0F)), the quarters below it one image tile
    // row (32 tiles) further on
    UWORD idx = 32u + (((UWORD)(n & 0xF0u)) << 2) + ((n & 0x0Fu) << 1);
    gtx_load_font_tile(tile, idx);
    gtx_load_font_tile(tile + 1u, idx + 1u);
    gtx_load_font_tile(tile + 2u, idx + 32u);
    gtx_load_font_tile(tile + 3u, idx + 33u);
#endif
}

// upload the four quarters of a wide character from the glyph sheet covering it.
// a sheet image is GTX_SHEET_COLS glyphs wide, so glyph k within the sheet sits
// at image tile (4 * GTX_SHEET_COLS * (k / GTX_SHEET_COLS) + 2 * (k % GTX_SHEET_COLS));
// its top two tiles are adjacent, and the bottom two are one image tile row on.
static const gtx_sheet_t * gtx_find_sheet(UWORD code) {
    UBYTE i;
    for (i = 0; i != GTX_SHEET_MAX; i++) {
        const gtx_sheet_t * sheet = &gtx_sheets[i];
        if ((sheet->ptr) && (code >= sheet->first) && ((code - sheet->first) < sheet->count)) {
            return sheet;
        }
    }
    return 0;
}

// address of the top-left tile of glyph `code` inside its sheet
static const UBYTE * gtx_sheet_cell(const gtx_sheet_t * sheet, UWORD code) {
    UWORD k = code - sheet->first;
    UWORD pos = ((k / GTX_SHEET_COLS) * (4u * GTX_SHEET_COLS)) + ((k % GTX_SHEET_COLS) << 1);
    // + 2 skips the tileset_t n_tiles field
    return sheet->ptr + 2u + (pos << 4);
}

#ifndef GTX_VWF_ENABLED
static void gtx_load_sheet_glyph(UBYTE tile, UWORD code) {
    const gtx_sheet_t * sheet = gtx_find_sheet(code);
    if (sheet) {
        const UBYTE * src = gtx_sheet_cell(sheet, code);
        SetBankedBkgData(tile, 2, src, sheet->bank);
        SetBankedBkgData(tile + 2u, 2, src + GTX_SHEET_ROW_BYTES, sheet->bank);
        return;
    }
    // no sheet covers this code: leave a blank square rather than stale pixels
    set_bkg_data(tile, GTX_TILES_PER_CHAR, gtx_blank);
}
#endif

#ifndef GTX_VWF_ENABLED
static void gtx_load_glyph_tiles(UBYTE tile, UBYTE bank, UWORD key) {
    (void)bank;
#ifdef CGB
    if (bank) VBK_REG = 1;
#endif
    if (key & GTX_KEY_NARROW) {
        gtx_load_font_glyph(tile, (UBYTE)key);
    } else {
        gtx_load_sheet_glyph(tile, key);
    }
#ifdef CGB
    if (bank) VBK_REG = 0;
#endif
}
#endif

#ifdef GTX_CACHE_ENABLED
// look the character up in the LRU list; on hit hoist the entry to the head
// and reuse its quad, on miss allocate a fresh quad (or evict the least
// recently used one) and render the character into it.
// returns the cache entry index (tile/bank via gtx_entry_tile/gtx_entry_bank).
static UBYTE gtx_get_char_entry(UWORD key) {
    UBYTE i, p, nx;
    for (i = gtx_head; i != GTX_NULL; i = gtx_next[i]) {
        if (gtx_key[i] == key) {
            if (i != gtx_head) {
                // unlink and move to front
                p = gtx_prev[i];
                nx = gtx_next[i];
                gtx_next[p] = nx;
                if (nx != GTX_NULL) gtx_prev[nx] = p; else gtx_tail = p;
                gtx_prev[i] = GTX_NULL;
                gtx_next[i] = gtx_head;
                gtx_prev[gtx_head] = i;
                gtx_head = i;
            }
            return i;
        }
    }
    // miss
    if (gtx_count < gtx_size) {
        i = gtx_count++;
    } else {
        // evict least recently used
        i = gtx_tail;
        p = gtx_prev[i];
        if (p != GTX_NULL) {
            gtx_next[p] = GTX_NULL;
            gtx_tail = p;
        } else {
            gtx_head = gtx_tail = GTX_NULL;
        }
    }
    gtx_key[i] = key;
    gtx_prev[i] = GTX_NULL;
    gtx_next[i] = gtx_head;
    if (gtx_head != GTX_NULL) gtx_prev[gtx_head] = i;
    gtx_head = i;
    if (gtx_tail == GTX_NULL) gtx_tail = i;
    gtx_load_glyph_tiles(gtx_entry_tile(i), gtx_entry_bank(i), key);
    return i;
}
#elif !defined(GTX_VWF_ENABLED)
// cache disabled: hand the reserved tile quads out round-robin and re-upload
// the character every time it is printed
static UBYTE gtx_get_char_entry(UWORD key) {
    UBYTE i = gtx_count;
    if (++gtx_count >= gtx_size) gtx_count = 0;
    gtx_load_glyph_tiles(gtx_entry_tile(i), gtx_entry_bank(i), key);
    return i;
}
#endif

// write one tilemap cell; on CGB the attribute byte carries the palette and
// the tile data bank (bit 3) the glyph was uploaded to
inline void gtx_set_tile(UBYTE * addr, UBYTE tile, UBYTE bank) {
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

// address of the cell n columns right of p, wrapped inside p's 32-cell map row
static UBYTE * gtx_row_cell(UBYTE * p, UBYTE n) {
    return (UBYTE *)(((UWORD)p & 0xFFE0u) | (((UWORD)p + n) & 0x1Fu));
}

#ifdef GTX_VWF_ENABLED

// ---------------------------------------------------------------------------
// Variable-width rendering.
//
// Glyphs no longer land on tile boundaries, so text is composed a pixel at a
// time into 8px screen columns. gtx_vwf_col[0] is the column being filled,
// [1] and [2] catch what spills past it -- a 16px glyph starting at offset 7
// reaches into the third. When the pen passes the end of column 0 that column
// is complete: its 16 rows become two VRAM tiles, the pipeline shifts down and
// the pen carries on. Every column costs its own tile pair, since no two
// columns hold the same pixels.
// ---------------------------------------------------------------------------

static UBYTE gtx_vwf_col[3][16];   // rows of the three columns in flight
static UBYTE gtx_vwf_ofs;          // pen position inside column 0, 0-7
static UWORD gtx_vwf_mask[16];     // the glyph being placed, bit 15 = its pixel 0
static UBYTE gtx_vwf_cell[64];     // one sheet cell fetched out of ROM

// widths table: a tileset asset used as a plain byte array.
// [0..95]  = advance of ASCII 0x20-0x7F in the font asset
// [96 + g] = advance of wide glyph g
static const UBYTE * gtx_widths_ptr = 0;
static UBYTE gtx_widths_bank;

#define GTX_WIDTH_ASCII_MAX 96u

static UBYTE gtx_char_width(UWORD key) {
    UWORD idx;
    UBYTE w;
    if (key & GTX_KEY_NARROW) {
        UBYTE ch = (UBYTE)key;
        if (ch < 0x20u) return 0;
        idx = ch - 0x20u;
        if (idx >= GTX_WIDTH_ASCII_MAX) return 8u;
    } else {
        idx = GTX_WIDTH_ASCII_MAX + key;
    }
    if (gtx_widths_ptr == 0) return (key & GTX_KEY_NARROW) ? 8u : 16u;
    // + 2 skips the tileset_t n_tiles field
    w = ReadBankedUBYTE(gtx_widths_ptr + 2u + idx, gtx_widths_bank);
    if (w == 0) return (key & GTX_KEY_NARROW) ? 4u : 16u;   // unmeasured, or a space
    return w;
}

// one row of a 2bpp tile pair -> a 1bpp ink mask
#define GTX_ROW_INK(p, y) ((p)[(y) << 1] | (p)[((y) << 1) + 1u])

// fetch a wide glyph out of its sheet into gtx_vwf_mask
static void gtx_vwf_load_sheet(UWORD code) {
    const gtx_sheet_t * sheet = gtx_find_sheet(code);
    UBYTE y;
    memset(gtx_vwf_mask, 0, sizeof(gtx_vwf_mask));
    if (sheet == 0) return;
    {
        const UBYTE * src = gtx_sheet_cell(sheet, code);
        // top-left and top-right tiles are adjacent, the bottom pair one image row on
        MemcpyBanked(gtx_vwf_cell, src, 32, sheet->bank);
        MemcpyBanked(gtx_vwf_cell + 32, src + GTX_SHEET_ROW_BYTES, 32, sheet->bank);
    }
    for (y = 0; y != 8; y++) {
        gtx_vwf_mask[y] = ((UWORD)GTX_ROW_INK(gtx_vwf_cell, y) << 8) |
                          GTX_ROW_INK(gtx_vwf_cell + 16, y);
        gtx_vwf_mask[y + 8u] = ((UWORD)GTX_ROW_INK(gtx_vwf_cell + 32, y) << 8) |
                               GTX_ROW_INK(gtx_vwf_cell + 48, y);
    }
}

// fetch a narrow glyph out of the current font asset (8x16 cells) into the mask
static void gtx_vwf_load_font(UBYTE ch) {
    UBYTE n = ch - 0x20u;
    UWORD idx = 32u + (((UWORD)(n & 0xF0u)) << 1) + (n & 0x0Fu);
    UBYTE q, y;
    q = ReadBankedUBYTE(vwf_current_font_desc.recode_table + idx, vwf_current_font_bank);
    MemcpyBanked(gtx_vwf_cell, vwf_current_font_desc.bitmaps + ((UWORD)q << 4), 16, vwf_current_font_bank);
    q = ReadBankedUBYTE(vwf_current_font_desc.recode_table + idx + 16u, vwf_current_font_bank);
    MemcpyBanked(gtx_vwf_cell + 16, vwf_current_font_desc.bitmaps + ((UWORD)q << 4), 16, vwf_current_font_bank);
    for (y = 0; y != 8; y++) {
        gtx_vwf_mask[y] = (UWORD)GTX_ROW_INK(gtx_vwf_cell, y) << 8;
        gtx_vwf_mask[y + 8u] = (UWORD)GTX_ROW_INK(gtx_vwf_cell + 16, y) << 8;
    }
}

// column 0 is finished: upload it as a tile pair and advance the pipeline
static void gtx_vwf_flush(void) {
    UBYTE tile = gtx_entry_tile(gtx_count);
    UBYTE bank = gtx_entry_bank(gtx_count);
    UBYTE data[16];
    UBYTE y;
    for (y = 0; y != 8; y++) {
        data[y << 1] = data[(y << 1) + 1u] = gtx_vwf_col[0][y];
    }
#ifdef CGB
    if (bank) VBK_REG = 1;
#endif
    set_bkg_data(tile, 1, data);
    for (y = 0; y != 8; y++) {
        data[y << 1] = data[(y << 1) + 1u] = gtx_vwf_col[0][y + 8u];
    }
    set_bkg_data(tile + 1u, 1, data);
#ifdef CGB
    if (bank) VBK_REG = 0;
#endif
    // wrap around within the 32-tile map row instead of bleeding into the next line
    if (((UBYTE)gtx_dest_ptr >> 5) != ((UBYTE)gtx_dest_base >> 5)) {
        gtx_dest_ptr -= 32u;
    }
    gtx_set_tile(gtx_dest_ptr, tile, bank);                 // top
    if (current_text_layer == TEXT_LAYER_BKG) {
        // bottom cell one map row below, wrapped within the 32x32 map
        gtx_set_tile(text_render_base_addr + (((UWORD)(gtx_dest_ptr - text_render_base_addr) + 32u) & 1023u), tile + 1u, bank);
    } else {
        gtx_set_tile(gtx_dest_ptr + 32u, tile + 1u, bank);  // bottom, map row below
    }
    gtx_dest_ptr++;
    if (++gtx_count >= gtx_size) gtx_count = 0;
    memcpy(&gtx_vwf_col[0][0], &gtx_vwf_col[1][0], 32);
    memset(&gtx_vwf_col[2][0], 0, 16);
}

static void gtx_vwf_reset(void) {
    gtx_vwf_ofs = 0;
    memset(&gtx_vwf_col[0][0], 0, sizeof(gtx_vwf_col));
}

// finish the line: flush a partly filled column and put the pen back to 0
static void gtx_vwf_break(void) {
    if (gtx_vwf_ofs) gtx_vwf_flush();
    gtx_vwf_reset();
}

static void gtx_emit_char(UWORD key) {
    UBYTE w, y, ofs;
    if (key & GTX_KEY_NARROW) gtx_vwf_load_font((UBYTE)key); else gtx_vwf_load_sheet(key);
    w = gtx_char_width(key);
    if (w == 0) return;
    ofs = gtx_vwf_ofs;
    for (y = 0; y != 16; y++) {
        UWORD m = gtx_vwf_mask[y];
        gtx_vwf_col[0][y] |= (UBYTE)(m >> (8u + ofs));
        gtx_vwf_col[1][y] |= (UBYTE)(m >> ofs);
        gtx_vwf_col[2][y] |= (UBYTE)(m << (8u - ofs));
    }
    ofs += w;
    while (ofs >= 8u) { gtx_vwf_flush(); ofs -= 8u; }
    gtx_vwf_ofs = ofs;
}

#else   // fixed-width rendering

#define gtx_vwf_break() ((void)0)

static void gtx_emit_char(UWORD key) {
    UBYTE entry = gtx_get_char_entry(key);
    UBYTE tile = gtx_entry_tile(entry);
    UBYTE bank = gtx_entry_bank(entry);
    UBYTE * right;
    UBYTE * below;
    if (current_text_layer == TEXT_LAYER_BKG) {
        // wrap around within the 32-tile map row instead of bleeding into the next line
        if (((UBYTE)gtx_dest_ptr >> 5) != ((UBYTE)gtx_dest_base >> 5)) {
            gtx_dest_ptr -= 32u;
        }
        // one map row below, wrapped within the 32x32 map
        below = text_render_base_addr + (((UWORD)(gtx_dest_ptr - text_render_base_addr) + 32u) & 1023u);
#ifdef GTX_NARROW_HALFWIDTH
        if (key & GTX_KEY_NARROW) {
            // half width: one column, two tiles (the quad's other half is unused)
            gtx_set_tile(gtx_dest_ptr, tile, bank);         // top
            gtx_set_tile(below, tile + 1u, bank);           // bottom
            gtx_dest_ptr++;
            return;
        }
#endif
        right = gtx_row_cell(gtx_dest_ptr, 1);
        gtx_set_tile(gtx_dest_ptr, tile, bank);             // top left
        gtx_set_tile(right, tile + 1u, bank);               // top right
        gtx_set_tile(below, tile + 2u, bank);               // bottom left
        gtx_set_tile(gtx_row_cell(below, 1), tile + 3u, bank);  // bottom right
    } else {
        if (((UBYTE)gtx_dest_ptr >> 5) != ((UBYTE)gtx_dest_base >> 5)) {
            gtx_dest_ptr -= 32u;
        }
#ifdef GTX_NARROW_HALFWIDTH
        if (key & GTX_KEY_NARROW) {
            gtx_set_tile(gtx_dest_ptr, tile, bank);             // top
            gtx_set_tile(gtx_dest_ptr + 32u, tile + 1u, bank);  // bottom, map row below
            gtx_dest_ptr++;
            return;
        }
#endif
        right = gtx_row_cell(gtx_dest_ptr, 1);
        gtx_set_tile(gtx_dest_ptr, tile, bank);             // top left
        gtx_set_tile(right, tile + 1u, bank);               // top right
        gtx_set_tile(gtx_dest_ptr + 32u, tile + 2u, bank);  // bottom left, map row below
        gtx_set_tile(right + 32u, tile + 3u, bank);         // bottom right
    }
    gtx_dest_ptr += 2u;
}

#endif

// renders one character (or a run of control codes) of ui_text_data.
// mirrors the stock ui_draw_text_buffer_char control-code handling, except
// every text line is two tilemap rows tall and every character two cells wide.
// returns TRUE when a printable character was consumed (for sound/speed).
UBYTE gtx_draw_text_buffer_char(void) BANKED {
    static UBYTE current_font_idx, current_text_ff_joypad, current_text_draw_speed;

    if (gtx_text_ptr == 0) {
        // set the delay mask
        gtx_current_text_speed = ui_time_masks[text_draw_speed];
        // save font and speed global properties
        current_font_idx        = vwf_current_font_idx;
        current_text_ff_joypad  = text_ff_joypad;
        current_text_draw_speed = text_draw_speed;
        if (!gtx_initialized) gtx_cache_reset();
        // current char pointer
        gtx_text_ptr = ui_text_data;
        // VRAM destination
        if ((text_options & TEXT_OPT_PRESERVE_POS) == 0) {
            if (current_text_layer == TEXT_LAYER_BKG) {
                // start at the visible origin of the scrolled background map
                gtx_dest_base = text_render_base_addr + ((((UWORD)bkg_offset_y << 5) + 32) & 1023) + (((UWORD)bkg_offset_x + 1) & 31);
            } else {
                gtx_dest_base = text_render_base_addr;
            }
            gtx_dest_ptr = gtx_dest_base;
        }
    }
    // normally runs once, but if control code encountered, then process them until printable symbol or terminator
    while (TRUE) {
        switch (*gtx_text_ptr) {
            case 0x00: {
                gtx_vwf_break();          // push out the last, partly filled column
                gtx_text_ptr = 0;
                gtx_text_drawn = TRUE;
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
                text_draw_speed = (*(++gtx_text_ptr) - 1u) & 0x07u;
                gtx_current_text_speed = ui_time_masks[text_draw_speed];
                break;
            case 0x02: {
                // set current font (temporary within this text, like stock)
                current_font_idx = *(++gtx_text_ptr) - 1u;
                const far_ptr_t * font = ui_fonts + current_font_idx;
                MemcpyBanked(&vwf_current_font_desc, font->ptr, sizeof(font_desc_t), vwf_current_font_bank = font->bank);
                // no cache invalidation: narrow entries are keyed by font index,
                // so the glyphs already on screen keep their quads
                break;
            }
            case 0x03:
                // gotoxy (tile coordinates, 1-based); background coordinates are
                // relative to the scrolled origin and wrap within the 32x32 map
                gtx_vwf_break();
                if (current_text_layer == TEXT_LAYER_BKG) {
                    gtx_dest_ptr = gtx_dest_base = text_render_base_addr + ((bkg_offset_x + (UWORD)(*++gtx_text_ptr - 1u)) & 31) + (((bkg_offset_y + (UWORD)(*++gtx_text_ptr - 1u)) << 5) & 1023);
                } else {
                    gtx_dest_ptr = gtx_dest_base = text_render_base_addr + (*++gtx_text_ptr - 1u) + (*++gtx_text_ptr - 1u) * 32u;
                }
                break;
            case 0x04: {
                // relative gotoxy (tile coordinates)
                BYTE dx = (BYTE)(*++gtx_text_ptr);
                if (dx > 0) dx--;
                BYTE dy = (BYTE)(*++gtx_text_ptr);
                if (dy > 0) dy--;
                gtx_vwf_break();
                gtx_dest_base = gtx_dest_ptr += dx + dy * 32;
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
                gtx_text_ptr++;
                // if high speed then skip waiting
                if (text_draw_speed) {
                    // wait for key press (parameter is a mask)
                    if (INPUT_PRESSED(*gtx_text_ptr)) {
                        // mask matches
                        text_ff_joypad = current_text_ff_joypad;
                        INPUT_RESET;
                    } else {
                        // go back to 0x06 control code
                        gtx_text_ptr--;
                        gtx_current_text_speed = 0;
                        return FALSE;
                    }
                }
                gtx_current_text_speed = ui_time_masks[text_draw_speed];
                break;
            case 0x07:  // text color: unsupported (would need the fill in the cache key), skip parameter
            case 0x08:  // text direction: 16x16 rendering is left-to-right only, skip parameter
                ++gtx_text_ptr;
                break;
            case 0x09:
                break;
            case '\n':  // 0x0a
                // new line: text lines are two tilemap rows tall
                gtx_vwf_break();
                gtx_dest_ptr = gtx_dest_base += 64u;
                break;
            case 0x0b:
            #ifdef CGB
                text_palette = (((*++gtx_text_ptr) - 1u) & 0x07u);
            #else
                ++gtx_text_ptr;
            #endif
                break;
            case '\r': {  // 0x0d
                // new line and scroll the text area (two tilemap rows per text line)
                gtx_vwf_break();
                UBYTE * scroll_end = (UBYTE *)((((UWORD)text_scroll_addr + ((UWORD)text_scroll_height << 5)) & 0xFFE0) - 1);
                if ((gtx_dest_base + 96u) > scroll_end) {
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
                    gtx_dest_ptr = gtx_dest_base;
                } else {
                    gtx_dest_ptr = gtx_dest_base += 64u;
                }
                break;
            }
            case 0x05:
                // escape symbol
                gtx_text_ptr++;
                // fall through
            default: {
                // a byte at or above the lead threshold starts a two-byte wide
                // glyph code; anything else is a narrow character from the font
                UBYTE ch = *gtx_text_ptr++;
                if (ch >= GTX_LEAD_MIN) {
                    UBYTE trail = *gtx_text_ptr++;
                    gtx_emit_char((((UWORD)(ch - GTX_LEAD_MIN)) << 7) | (trail & 0x7Fu));
                } else {
                    gtx_emit_char(GTX_KEY_FOR_NARROW(current_font_idx, ch));
                }
                return TRUE;
            }
        }
        gtx_text_ptr++;
    }
}

// draw ui_text_data instantly (all control codes processed, no waiting)
void gtx_display_text(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    gtx_text_ptr = 0;
    gtx_text_drawn = FALSE;
    do {
        gtx_draw_text_buffer_char();
    } while (!gtx_text_drawn);
}

// draw ui_text_data at the current text speed, blocking until done.
// keeps actors/camera/scroll updating while it draws (modal loop).
void gtx_display_text_speed(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    INPUT_RESET;
    gtx_text_ptr = 0;
    gtx_text_drawn = text_ff = FALSE;
    gtx_current_text_speed = 0;
    UBYTE play_sound, speed_wait = FALSE;
    do {
        // too fast - wait
        if ((text_ff_joypad) && (INPUT_A_OR_B_PRESSED)) {
            text_ff = TRUE;
        } else {
            if (game_time & gtx_current_text_speed) {
                speed_wait = TRUE;
            }
        }
        // render next char
        if (!speed_wait) {
            do {
                play_sound = gtx_draw_text_buffer_char();
            } while (((text_ff) || (text_draw_speed == 0)) && (!gtx_text_drawn));
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
    } while (!gtx_text_drawn);
}

// waitable dialogue driver for VM_INVOKE: renders one speed-tick of text per
// call and yields back to the VM, so the script engine stays responsive.
UBYTE gtx_display_dialogue(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    (void)stack_frame;
    UBYTE play_sound, speed_wait = FALSE;
    if (start) {
        INPUT_RESET;
        gtx_text_ptr = 0;
        gtx_text_drawn = text_ff = FALSE;
        gtx_current_text_speed = 0;
    }
    // all drawn - nothing to do
    if (!gtx_text_drawn) {
        // too fast - wait
        if ((text_ff_joypad) && (INPUT_A_OR_B_PRESSED)) {
            text_ff = TRUE;
        } else {
            if (game_time & gtx_current_text_speed) {
                speed_wait = TRUE;
            }
        }
        // render next char
        if (!speed_wait) {
            do {
                play_sound = gtx_draw_text_buffer_char();
            } while (((text_ff) || (text_draw_speed == 0)) && (!gtx_text_drawn));
            // play sound
            if ((play_sound) && (text_sound_bank != SFX_STOP_BANK)) music_play_sfx(text_sound_bank, text_sound_data, text_sound_mask, MUSIC_SFX_PRIORITY_NORMAL);
        }
        ((SCRIPT_CTX *)THIS)->waitable = TRUE;
        return FALSE;
    }
    return TRUE;
}

void gtx_reset_cache(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    gtx_cache_reset();
}

void gtx_set_tile_range(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    // FN_ARG0 is the argument pushed last (top of VM stack)
    gtx_first_tile      = *(UBYTE *)VM_REF_TO_PTR(FN_ARG2);
    gtx_last_tile       = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    gtx_tile_placement  = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    gtx_cache_reset();
}

// register (or, with a null pointer, clear) one glyph sheet slot.
// the glyph count is taken from the tileset's own n_tiles field, so a sheet
// always covers exactly the glyphs its image holds.
// point the renderer at the table of glyph advances (variable-width mode only).
// a null pointer clears it and every character falls back to its full cell.
void gtx_set_width_table(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
#ifdef GTX_VWF_ENABLED
    gtx_widths_ptr  = (const UBYTE *)(*(UWORD *)VM_REF_TO_PTR(FN_ARG1));
    gtx_widths_bank = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
#endif
}

void gtx_set_glyph_sheet(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE slot        = *(UBYTE *)VM_REF_TO_PTR(FN_ARG3);
    const UBYTE * ptr = (const UBYTE *)(*(UWORD *)VM_REF_TO_PTR(FN_ARG2));
    UBYTE bank        = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    UWORD first       = *(UWORD *)VM_REF_TO_PTR(FN_ARG0);
    gtx_sheet_t * sheet;
    if (slot >= GTX_SHEET_MAX) return;
    sheet = &gtx_sheets[slot];
    sheet->ptr = ptr;
    sheet->bank = bank;
    sheet->first = first;
    sheet->count = (ptr) ? (ReadBankedUWORD(ptr, bank) / GTX_TILES_PER_CHAR) : 0u;
    gtx_cache_reset();
}

// ---- stock UI replacement -------------------------------------------------
// With GTX_REPLACE_STOCK_UI set, the plugin's ui.c override leaves
// ui_draw_text_buffer_char undefined, and this claims the symbol. Everything
// in the stock engine that drew text -- ui_update(), and through it Display
// Dialogue, Display Text and ui_run_menu() -- lands here instead, so stock
// events render with this plugin and the stock renderer costs no ROM.
#ifdef GTX_REPLACE_STOCK_UI
UBYTE ui_draw_text_buffer_char(void) BANKED {
    return gtx_draw_text_buffer_char();
}
#endif // GTX_REPLACE_STOCK_UI

// ---- menu ------------------------------------------------------------------
// The stock menu driver steps its cursor one 8px row per option. A line of this
// plugin's text is two rows, so the cursor has to move in the same stride as
// whatever drew the text -- hence this copy, with the stride as a parameter.
//
// It is always compiled, under its own name, so the plugin's Menu event can call
// it whether or not the stock renderer is replaced. When GTX_REPLACE_STOCK_UI
// does remove the stock ui_run_menu, the symbol is rewired to it further down.
//
// start_item == NULL means a single-column menu of `count` options, laid out the
// way this plugin's Menu event draws them. Synthesising those saves carrying a
// menu_item_t table in WRAM just to describe previous/next.
static void gtx_menu_item_at(menu_item_t * out, UBYTE index, UBYTE count) {
    out->X = 1u;
    out->Y = index;              // stock row numbering; the stride is applied below
    out->iL = 1u;
    out->iR = count;
    out->iU = (index > 1u) ? (UBYTE)(index - 1u) : 0u;
    out->iD = (index < count) ? (UBYTE)(index + 1u) : 0u;
}

static void gtx_menu_fetch(menu_item_t * out, menu_item_t * start_item, UBYTE bank,
                              UBYTE index, UBYTE count) {
    if (start_item == 0) {
        gtx_menu_item_at(out, index, count);
    } else {
        MemcpyBanked(out, start_item + (index - 1u), sizeof(menu_item_t), bank);
    }
}

// Option n occupies rows (n - 1) * pitch + 1 through + pitch. Which of those the
// cursor takes is the GTX_MENU_CURSOR_ROW engine setting: 0 the upper tile, 1
// the lower. Beside a 16px line the upper tile reads as floating above the word
// and the lower sits level with the baseline, but which looks right depends on
// the font. At pitch 1 there is only one row and both settings give the stock
// position, so this is inert for single-row text.
#ifndef GTX_MENU_CURSOR_ROW
#define GTX_MENU_CURSOR_ROW 1
#endif

static void gtx_menu_cursor(const menu_item_t * item, UBYTE tile, UBYTE pitch) {
    // a compile-time constant either way, so the ternary folds away
    UBYTE ofs = (GTX_MENU_CURSOR_ROW) ? pitch : 1u;
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

UBYTE gtx_ui_run_menu(menu_item_t * start_item, UBYTE bank, UBYTE options,
                       UBYTE count, UBYTE start_index, UBYTE pitch) BANKED {
    menu_item_t current_menu_item;
    UBYTE current_index = ((options & MENU_SET_START) ? start_index : 1u), next_index = 0u;
    gtx_menu_fetch(&current_menu_item, start_item, bank, current_index, count);

    gtx_menu_cursor(&current_menu_item, ui_cursor_tile, pitch);

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
        gtx_menu_cursor(&current_menu_item, ui_bg_tile, pitch);
        gtx_menu_fetch(&current_menu_item, start_item, bank, current_index, count);
        gtx_menu_cursor(&current_menu_item, ui_cursor_tile, pitch);
        next_index = 0;
    }
}

// VM native behind this plugin's Menu event. VM_CHOICE is the only instruction
// that carries a menu, and it always calls the stock ui_run_menu -- so the event
// calls gtx_ui_run_menu through here instead, and works with the stock renderer
// left in place.
//
// args (push order): dest, options, count, start_index
void gtx_menu(SCRIPT_CTX * THIS) OLDCALL BANKED {
    INT16 dest    = *(INT16 *)VM_REF_TO_PTR(FN_ARG3);
    UBYTE options = *(UBYTE *)VM_REF_TO_PTR(FN_ARG2);
    UBYTE count   = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    UBYTE start   = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    UBYTE result;
    INT16 * A;
    // the options were drawn in full before this ran, so stop ui_update() inside
    // the menu loop from rendering the stock text buffer over the top of them
    text_drawn = TRUE;
    result = gtx_ui_run_menu(0, 0, options, count, start, 2u);
    // negative index = stack-local; step past the four arguments still on the stack
    A = (dest < 0) ? (INT16 *)(THIS->stack_ptr + dest - 4) : (INT16 *)(script_memory + dest);
    *A = result;
}

#ifdef GTX_REPLACE_STOCK_UI
// The stock renderer is gone, so everything on screen is this plugin's and every
// menu is two rows per option -- including the stock Menu event's, which reaches
// here through VM_CHOICE.
UBYTE ui_run_menu(menu_item_t * start_item, UBYTE bank, UBYTE options, UBYTE count, UBYTE start_index) BANKED {
    return gtx_ui_run_menu(start_item, bank, options, count, start_index, 2u);
}
#endif // GTX_REPLACE_STOCK_UI
