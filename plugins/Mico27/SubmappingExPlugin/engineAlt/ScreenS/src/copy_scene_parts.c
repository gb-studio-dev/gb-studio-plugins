#pragma bank 255

#include <gbdk/platform.h>
#include "system.h"
#include "vm.h"
#include "gbs_types.h"
#include "scroll.h"
#include "math.h"
#include "bankdata.h"
#include "data_manager.h"
#include "data/states_defines.h"   // engine-field enable/disable #defines

UBYTE tmp_tile_buffer[32];

void set_xy_win_submap(const UBYTE * source, UBYTE bank, UBYTE width, UBYTE x, UBYTE y, UBYTE w, UBYTE h) OLDCALL;

// vm.h only declares FN_ARG0..FN_ARG7; one helper here takes a ninth argument.
#ifndef FN_ARG8
#define FN_ARG8 -9
#endif

// ---------------------------------------------------------------------------
// engineAlt variant for ScreenScrollPlugin / ContinuousScenePlugin.
// Absolute scene tile coordinate -> background VRAM tilemap cell (0-31).
// Those plugins shift the background tilemap in VRAM by (bkg_offset_x,
// bkg_offset_y) (declared extern in their scroll.h), so the offset is added
// here before the & 31 wrap. This pair of macros is the ONLY difference
// between this file and the base engine/src/copy_scene_parts.c.
// Overlay/window cells and ROM tilemap reads are unchanged.
// ---------------------------------------------------------------------------
#define BKG_VRAM_X(x) ((UBYTE)((x) + bkg_offset_x) & 31)
#define BKG_VRAM_Y(y) ((UBYTE)((y) + bkg_offset_y) & 31)

// ---------------------------------------------------------------------------
// Screen-relative coordinates ("take scrolling into account").
// When `rel` is non-zero the caller's X/Y are screen tile coordinates, with
// (0,0) at the top-left tile currently visible, and the camera's scroll
// position is added to turn them into absolute scene tile coordinates.
// draw_scroll_x/y are the values actually written to SCX/SCY by the engine.
// The coordinate argument is evaluated twice, so only pass a plain value or a
// side-effect-free expression.
// ---------------------------------------------------------------------------
#define SCROLL_REL_X(x, rel) ((UBYTE)((rel) ? ((x) + PX_TO_TILE(draw_scroll_x)) : (x)))
#define SCROLL_REL_Y(y, rel) ((UBYTE)((rel) ? ((y) + PX_TO_TILE(draw_scroll_y)) : (y)))

// ---------------------------------------------------------------------------
// Tile attribute part selection.
// The event passes a packed int16: low byte = bit mask, high byte = shift.
// A mask of 0xFF (shift 0) means "raw attribute value" and lets the fast,
// write-only paths be used; anything narrower needs a read-modify-write so the
// bits outside the mask are preserved.
// ---------------------------------------------------------------------------
#define ATTR_PART_MASK(part)  ((UBYTE)((part) & 0xFF))
#define ATTR_PART_SHIFT(part) ((UBYTE)(((part) >> 8) & 0xFF))
#define ATTR_PART_IS_RAW(part) (ATTR_PART_MASK(part) == 0xFF)
#define ATTR_PART_APPLY(old_attr, value, mask, shift) \
    ((UBYTE)(((old_attr) & ~(mask)) | (((UBYTE)((value) << (shift))) & (mask))))

#ifdef SUBMAP_ENABLE_COPY_SCENE_TO_OVERLAY
void copy_background_submap_to_overlay(SCRIPT_CTX * THIS) OLDCALL BANKED {

    uint8_t source_x = *(int8_t*)VM_REF_TO_PTR(FN_ARG0);
    uint8_t source_y = *(int8_t*)VM_REF_TO_PTR(FN_ARG1);
    uint8_t dest_x = *(int8_t*)VM_REF_TO_PTR(FN_ARG2);
    uint8_t dest_y = *(int8_t*)VM_REF_TO_PTR(FN_ARG3);
    uint8_t width = *(int8_t*)VM_REF_TO_PTR(FN_ARG4);
    uint8_t height = *(int8_t*)VM_REF_TO_PTR(FN_ARG5);
    uint8_t scene_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG6);
    const scene_t * scene_ptr = *(scene_t **) VM_REF_TO_PTR(FN_ARG7);
    scene_t scn;
    MemcpyBanked(&scn, scene_ptr, sizeof(scn), scene_bank);
    background_t bkg;
    MemcpyBanked(&bkg, scn.background.ptr, sizeof(bkg), scn.background.bank);
    unsigned char* tilemap_ptr = bkg.tilemap.ptr;
    unsigned char* tilemap_attr_ptr = bkg.cgb_tilemap_attr.ptr;
    int16_t offset = (source_y * (int16_t)bkg.width) + source_x;
#ifdef CGB
    if (_is_CGB) {
        VBK_REG = 1;
        set_xy_win_submap(tilemap_attr_ptr + offset,  bkg.cgb_tilemap_attr.bank, bkg.width, dest_x, dest_y, width, height);
        VBK_REG = 0;
    }
#endif
    set_xy_win_submap(tilemap_ptr + offset, bkg.tilemap.bank, bkg.width, dest_x, dest_y, width, height);

}
#endif

#ifdef SUBMAP_ENABLE_COPY_SCENE_TO_OVERLAY_BASE
void copy_background_submap_to_overlay_base(SCRIPT_CTX * THIS) OLDCALL BANKED {
    int16_t bkg_pos = *(int16_t*)VM_REF_TO_PTR(FN_ARG0);
    int16_t dest_pos = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
    int16_t wh = *(int16_t*)VM_REF_TO_PTR(FN_ARG2);
    uint8_t tile_idx_offset = *(int8_t*)VM_REF_TO_PTR(FN_ARG3);
    uint8_t scene_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG4);
    const scene_t * scene_ptr = *(scene_t **) VM_REF_TO_PTR(FN_ARG5);

    UBYTE source_x = bkg_pos & 0xFF;
    UBYTE source_y = (bkg_pos >> 8) & 0xFF;
    UBYTE dest_x = dest_pos & 0xFF;
    UBYTE dest_y = (dest_pos >> 8) & 0xFF;
    UBYTE width = (wh & 0xFF);
    UBYTE height = ((wh >> 8) & 0xFF);

    scene_t scn;
    MemcpyBanked(&scn, scene_ptr, sizeof(scn), scene_bank);
    background_t bkg;
    MemcpyBanked(&bkg, scn.background.ptr, sizeof(bkg), scn.background.bank);
    unsigned char* tilemap_ptr = bkg.tilemap.ptr;
    unsigned char* tilemap_attr_ptr = bkg.cgb_tilemap_attr.ptr;

    UBYTE buffer_size = sizeof(UBYTE) * width;
    for (uint8_t i = 0; i < height; i++){
        int16_t offset = ((source_y + i) * (int16_t)bkg.width) + source_x;
#ifdef CGB
        if (_is_CGB) {
            VBK_REG = 1;
            MemcpyBanked(tmp_tile_buffer, tilemap_attr_ptr + offset, buffer_size, bkg.cgb_tilemap_attr.bank);
            set_win_tiles(dest_x & 31, (dest_y + i) & 31, width, 1, tmp_tile_buffer);
            VBK_REG = 0;
        }
#endif
        MemcpyBanked(tmp_tile_buffer, tilemap_ptr + offset, buffer_size, bkg.tilemap.bank);
        set_win_based_tiles(dest_x & 31, (dest_y + i) & 31, width, 1, tmp_tile_buffer, tile_idx_offset);
    }
}
#endif


#ifdef SUBMAP_ENABLE_COPY_SCENE_TO_BACKGROUND
void copy_background_submap_to_background(SCRIPT_CTX * THIS) OLDCALL BANKED {

    uint8_t source_x = *(int8_t*)VM_REF_TO_PTR(FN_ARG0);
    uint8_t source_y = *(int8_t*)VM_REF_TO_PTR(FN_ARG1);
    uint8_t dest_x = *(int8_t*)VM_REF_TO_PTR(FN_ARG2);
    uint8_t dest_y = *(int8_t*)VM_REF_TO_PTR(FN_ARG3);
    uint8_t width = *(int8_t*)VM_REF_TO_PTR(FN_ARG4);
    uint8_t height = *(int8_t*)VM_REF_TO_PTR(FN_ARG5);
    uint8_t scene_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG6);
    const scene_t * scene_ptr = *(scene_t **) VM_REF_TO_PTR(FN_ARG7);
    uint8_t relative = *(uint8_t *) VM_REF_TO_PTR(FN_ARG8);
    dest_x = SCROLL_REL_X(dest_x, relative);
    dest_y = SCROLL_REL_Y(dest_y, relative);
    scene_t scn;
    MemcpyBanked(&scn, scene_ptr, sizeof(scn), scene_bank);
    background_t bkg;
    MemcpyBanked(&bkg, scn.background.ptr, sizeof(bkg), scn.background.bank);
    unsigned char* tilemap_ptr = bkg.tilemap.ptr;
    unsigned char* tilemap_attr_ptr = bkg.cgb_tilemap_attr.ptr;

    UBYTE buffer_size = sizeof(UBYTE) * width;
    for (uint8_t i = 0; i < height; i++){
        int16_t offset = ((source_y + i) * (int16_t)bkg.width) + source_x;
#ifdef CGB
        if (_is_CGB) {
            VBK_REG = 1;
            MemcpyBanked(tmp_tile_buffer, tilemap_attr_ptr + offset, buffer_size, bkg.cgb_tilemap_attr.bank);
            set_bkg_tiles(BKG_VRAM_X(dest_x), BKG_VRAM_Y(dest_y + i), width, 1, tmp_tile_buffer);
            VBK_REG = 0;
        }
#endif
        MemcpyBanked(tmp_tile_buffer, tilemap_ptr + offset, buffer_size, bkg.tilemap.bank);
        set_bkg_tiles(BKG_VRAM_X(dest_x), BKG_VRAM_Y(dest_y + i), width, 1, tmp_tile_buffer);
    }

}
#endif

#ifdef SUBMAP_ENABLE_COPY_SCENE_TO_BACKGROUND_BASE
void copy_background_submap_to_background_base(SCRIPT_CTX * THIS) OLDCALL BANKED {
    int16_t bkg_pos = *(int16_t*)VM_REF_TO_PTR(FN_ARG0);
    int16_t dest_pos = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
    int16_t wh = *(int16_t*)VM_REF_TO_PTR(FN_ARG2);
    uint8_t tile_idx_offset = *(int8_t*)VM_REF_TO_PTR(FN_ARG3);
    uint8_t scene_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG4);
    const scene_t * scene_ptr = *(scene_t **) VM_REF_TO_PTR(FN_ARG5);
    uint8_t relative = *(uint8_t *) VM_REF_TO_PTR(FN_ARG6);

    UBYTE source_x = bkg_pos & 0xFF;
    UBYTE source_y = (bkg_pos >> 8) & 0xFF;
    UBYTE dest_x = SCROLL_REL_X(dest_pos & 0xFF, relative);
    UBYTE dest_y = SCROLL_REL_Y((dest_pos >> 8) & 0xFF, relative);
    UBYTE width = (wh & 0xFF);
    UBYTE height = ((wh >> 8) & 0xFF);

    scene_t scn;
    MemcpyBanked(&scn, scene_ptr, sizeof(scn), scene_bank);
    background_t bkg;
    MemcpyBanked(&bkg, scn.background.ptr, sizeof(bkg), scn.background.bank);
    unsigned char* tilemap_ptr = bkg.tilemap.ptr;
    unsigned char* tilemap_attr_ptr = bkg.cgb_tilemap_attr.ptr;

    UBYTE buffer_size = sizeof(UBYTE) * width;

    for (uint8_t i = 0; i < height; i++){
        int16_t offset = ((source_y + i) * (int16_t)bkg.width) + source_x;
#ifdef CGB
        if (_is_CGB) {
            VBK_REG = 1;
            MemcpyBanked(tmp_tile_buffer, tilemap_attr_ptr + offset, buffer_size, bkg.cgb_tilemap_attr.bank);
            set_bkg_tiles(BKG_VRAM_X(dest_x), BKG_VRAM_Y(dest_y + i), width, 1, tmp_tile_buffer);
            VBK_REG = 0;
        }
#endif
        MemcpyBanked(tmp_tile_buffer, tilemap_ptr + offset, buffer_size, bkg.tilemap.bank);
        set_bkg_based_tiles(BKG_VRAM_X(dest_x), BKG_VRAM_Y(dest_y + i), width, 1, tmp_tile_buffer, tile_idx_offset);
    }
}
#endif

#ifdef SUBMAP_ENABLE_REFRESH_BACKGROUND
// Restores (refreshes) a rectangular area of the background tilemap from the
// ACTIVE scene's original ROM tilemap (image_ptr / image_attr_ptr), undoing any
// runtime tile edits in that region. x/y are absolute scene tile coordinates
// (the same coordinate system the scroll engine uses when it reloads rows), so
// this behaves like the built-in scroll refresh but confined to the rectangle.
void vm_refresh_background_rect(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE relative = *(uint8_t *) VM_REF_TO_PTR(FN_ARG4);
    UBYTE x = SCROLL_REL_X(*(uint8_t *) VM_REF_TO_PTR(FN_ARG0), relative);
    UBYTE y = SCROLL_REL_Y(*(uint8_t *) VM_REF_TO_PTR(FN_ARG1), relative);
    UBYTE width = *(uint8_t *) VM_REF_TO_PTR(FN_ARG2);
    UBYTE height = *(uint8_t *) VM_REF_TO_PTR(FN_ARG3);

    UBYTE buffer_size = sizeof(UBYTE) * width;
    for (uint8_t i = 0; i < height; i++){
        uint16_t offset = ((y + i) * (uint16_t)image_tile_width) + x;
#ifdef CGB
        if (_is_CGB) {
            VBK_REG = 1;
            MemcpyBanked(tmp_tile_buffer, image_attr_ptr + offset, buffer_size, image_attr_bank);
            set_bkg_tiles(BKG_VRAM_X(x), BKG_VRAM_Y(y + i), width, 1, tmp_tile_buffer);
            VBK_REG = 0;
        }
#endif
        MemcpyBanked(tmp_tile_buffer, image_ptr + offset, buffer_size, image_bank);
        set_bkg_tiles(BKG_VRAM_X(x), BKG_VRAM_Y(y + i), width, 1, tmp_tile_buffer);
    }
}
#endif

#ifdef SUBMAP_ENABLE_COPY_SCENE_TO_TILESET
void copy_background_submap_to_tileset(SCRIPT_CTX * THIS) OLDCALL BANKED {
    int16_t source_pos = *(int16_t*)VM_REF_TO_PTR(FN_ARG0);
    int16_t dest_pos = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
    int16_t wh = *(int16_t*)VM_REF_TO_PTR(FN_ARG2);
    int16_t overlay_pos = *(int16_t*)VM_REF_TO_PTR(FN_ARG3);
    uint8_t copy_attributes = *(int8_t*)VM_REF_TO_PTR(FN_ARG4);
    uint8_t scene_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG5);
    const scene_t * scene_ptr = *(scene_t **) VM_REF_TO_PTR(FN_ARG6);
    uint8_t relative = *(uint8_t *) VM_REF_TO_PTR(FN_ARG7);

    UBYTE source_x = source_pos & 0xFF;
    UBYTE source_y = (source_pos >> 8) & 0xFF;
    UBYTE dest_x = SCROLL_REL_X(dest_pos & 0xFF, relative);
    UBYTE dest_y = SCROLL_REL_Y((dest_pos >> 8) & 0xFF, relative);
    UBYTE width = (wh & 0xFF);
    UBYTE height = ((wh >> 8) & 0xFF);
    UBYTE overlay_x = overlay_pos & 0xFF;
    UBYTE overlay_y = (overlay_pos >> 8) & 0xFF;

    scene_t scn;
    MemcpyBanked(&scn, scene_ptr, sizeof(scn), scene_bank);
    background_t bkg;
    MemcpyBanked(&bkg, scn.background.ptr, sizeof(bkg), scn.background.bank);
    const tileset_t* tileset = bkg.tileset.ptr;
    UWORD n_tiles = ReadBankedUWORD(&(tileset->n_tiles), bkg.tileset.bank);
    UBYTE ui_reserved_offset = (n_tiles > 128 && n_tiles < 192)? (192 - n_tiles): 0;
    unsigned char* tilemap_ptr = bkg.tilemap.ptr;
    unsigned char* tilemap_attr_ptr = bkg.cgb_tilemap_attr.ptr;

    const tileset_t* cgb_tileset = bkg.cgb_tileset.ptr;

    UBYTE buffer_size = sizeof(UBYTE) * width;
    for (uint8_t i = 0; i < height; i++){
        uint16_t source_offset = ((source_y + i) * (uint16_t)bkg.width) + source_x;
        uint16_t dest_offset = ((dest_y + i) * (uint16_t)image_tile_width) + dest_x;
        for (uint8_t j = 0; j < width; j++){
            UBYTE dest_tile = ReadBankedUBYTE(image_ptr + (uint16_t)(dest_offset + j), image_bank);
            UBYTE source_tile = ReadBankedUBYTE(tilemap_ptr + (uint16_t)(source_offset + j), bkg.tilemap.bank);
            if (ui_reserved_offset && source_tile >= 128){
                source_tile = source_tile - ui_reserved_offset;
            }
            #ifdef CGB
                if (_is_CGB) {

                    UBYTE dest_attr = ReadBankedUBYTE(image_attr_ptr + (uint16_t)(dest_offset + j), image_attr_bank);
                    UBYTE source_attr = ReadBankedUBYTE(tilemap_attr_ptr + (uint16_t)(source_offset + j), bkg.cgb_tilemap_attr.bank);
                    if (copy_attributes){
                        VBK_REG = 1;
                        if (copy_attributes == 1){
                            set_bkg_tile_xy(BKG_VRAM_X(dest_x + j), BKG_VRAM_Y(dest_y + i), (dest_attr & 0x08)? (source_attr | 0x08): (source_attr & ~0x08));
                        } else if (copy_attributes == 2){
                            set_win_tile_xy((overlay_x + j) & 31, (overlay_y + i) & 31, (dest_attr & 0x08)? (source_attr | 0x08): (source_attr & ~0x08));
                        }
                        VBK_REG = 0;
                    }
                    if (dest_attr & 0x08){
                        VBK_REG = 1;
                    }
                    if (cgb_tileset && (source_attr & 0x08)){
                        SetBankedBkgData(dest_tile, 1, cgb_tileset->tiles + (uint16_t)(source_tile << 4), bkg.cgb_tileset.bank);
                    } else {
                        SetBankedBkgData(dest_tile, 1, tileset->tiles + (uint16_t)(source_tile << 4), bkg.tileset.bank);
                    }
                    VBK_REG = 0;
                } else {
                    SetBankedBkgData(dest_tile, 1, tileset->tiles + (uint16_t)(source_tile << 4), bkg.tileset.bank);
                }
            #else
                SetBankedBkgData(dest_tile, 1, tileset->tiles + (uint16_t)(source_tile << 4), bkg.tileset.bank);
            #endif
        }
    }
}
#endif

#ifdef SUBMAP_ENABLE_TILE_GET_SET
void vm_get_background_tile(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE relative = *(uint8_t *) VM_REF_TO_PTR(FN_ARG3);
    UBYTE x = SCROLL_REL_X(*(uint8_t *) VM_REF_TO_PTR(FN_ARG0), relative);
    UBYTE y = SCROLL_REL_Y(*(uint8_t *) VM_REF_TO_PTR(FN_ARG1), relative);
    int16_t idx = *(int16_t*)VM_REF_TO_PTR(FN_ARG2);
    int16_t * A;
    if (idx < 0) A = THIS->stack_ptr + idx - 3; else A = script_memory + idx;
    *A = ReadBankedUBYTE(image_ptr + (uint16_t)((y * (uint16_t)image_tile_width) + x), image_bank);

}

void vm_replace_background_tile(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE relative = *(uint8_t *) VM_REF_TO_PTR(FN_ARG3);
    UBYTE x = SCROLL_REL_X(*(uint8_t *) VM_REF_TO_PTR(FN_ARG0), relative);
    UBYTE y = SCROLL_REL_Y(*(uint8_t *) VM_REF_TO_PTR(FN_ARG1), relative);
    set_bkg_tile_xy(BKG_VRAM_X(x), BKG_VRAM_Y(y), (*(uint8_t *) VM_REF_TO_PTR(FN_ARG2)));
}

void vm_replace_overlay_tile(SCRIPT_CTX * THIS) OLDCALL BANKED {
    set_win_tile_xy(((*(uint8_t *) VM_REF_TO_PTR(FN_ARG0)) & 31), ((*(uint8_t *) VM_REF_TO_PTR(FN_ARG1)) & 31), (*(uint8_t *) VM_REF_TO_PTR(FN_ARG2)));
}

#ifdef CGB

void vm_get_background_attribute_tile(SCRIPT_CTX * THIS) OLDCALL BANKED {
    if (_is_CGB) {
        int16_t part = *(int16_t*)VM_REF_TO_PTR(FN_ARG3);
        UBYTE relative = *(uint8_t*)VM_REF_TO_PTR(FN_ARG4);
        UBYTE x = SCROLL_REL_X(*(uint8_t*)VM_REF_TO_PTR(FN_ARG0), relative);
        UBYTE y = SCROLL_REL_Y(*(uint8_t*)VM_REF_TO_PTR(FN_ARG1), relative);
        int16_t idx = *(int16_t*)VM_REF_TO_PTR(FN_ARG2);
        int16_t * A;
        if (idx < 0) A = THIS->stack_ptr + idx - 3; else A = script_memory + idx;
        UBYTE attr = ReadBankedUBYTE(image_attr_ptr + (uint16_t)((y * (uint16_t)image_tile_width) + x), image_attr_bank);
        *A = (int16_t)(UBYTE)((attr & ATTR_PART_MASK(part)) >> ATTR_PART_SHIFT(part));
    }
}

void vm_replace_background_attribute_tile(SCRIPT_CTX * THIS) OLDCALL BANKED {
    if (_is_CGB) {
        int16_t part = *(int16_t*)VM_REF_TO_PTR(FN_ARG3);
        UBYTE relative = *(uint8_t *) VM_REF_TO_PTR(FN_ARG4);
        UBYTE x = BKG_VRAM_X(SCROLL_REL_X(*(uint8_t *) VM_REF_TO_PTR(FN_ARG0), relative));
        UBYTE y = BKG_VRAM_Y(SCROLL_REL_Y(*(uint8_t *) VM_REF_TO_PTR(FN_ARG1), relative));
        UBYTE new_attr = (*(uint8_t *) VM_REF_TO_PTR(FN_ARG2));
        VBK_REG = 1;
        if (!ATTR_PART_IS_RAW(part)) {
            new_attr = ATTR_PART_APPLY(get_bkg_tile_xy(x, y), new_attr, ATTR_PART_MASK(part), ATTR_PART_SHIFT(part));
        }
        set_bkg_tile_xy(x, y, new_attr);
        VBK_REG = 0;
    }
}

void vm_replace_overlay_attribute_tile(SCRIPT_CTX * THIS) OLDCALL BANKED {
    if (_is_CGB) {
        UBYTE x = ((*(uint8_t *) VM_REF_TO_PTR(FN_ARG0)) & 31);
        UBYTE y = ((*(uint8_t *) VM_REF_TO_PTR(FN_ARG1)) & 31);
        UBYTE new_attr = (*(uint8_t *) VM_REF_TO_PTR(FN_ARG2));
        int16_t part = *(int16_t*)VM_REF_TO_PTR(FN_ARG3);
        VBK_REG = 1;
        if (!ATTR_PART_IS_RAW(part)) {
            new_attr = ATTR_PART_APPLY(get_win_tile_xy(x, y), new_attr, ATTR_PART_MASK(part), ATTR_PART_SHIFT(part));
        }
        set_win_tile_xy(x, y, new_attr);
        VBK_REG = 0;
    }
}

#endif
#endif // SUBMAP_ENABLE_TILE_GET_SET

// ---------------------------------------------------------------------------
// Rectangular fill
// ---------------------------------------------------------------------------

#ifdef SUBMAP_ENABLE_FILL_BACKGROUND
void vm_fill_background_rect(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE relative = *(uint8_t *) VM_REF_TO_PTR(FN_ARG5);
    UBYTE x = SCROLL_REL_X(*(uint8_t *) VM_REF_TO_PTR(FN_ARG0), relative);
    UBYTE y = SCROLL_REL_Y(*(uint8_t *) VM_REF_TO_PTR(FN_ARG1), relative);
    UBYTE w = *(uint8_t *) VM_REF_TO_PTR(FN_ARG2);
    UBYTE h = *(uint8_t *) VM_REF_TO_PTR(FN_ARG3);
    UBYTE tile = *(uint8_t *) VM_REF_TO_PTR(FN_ARG4);
    fill_bkg_rect(BKG_VRAM_X(x), BKG_VRAM_Y(y), w, h, tile);
}

#ifdef CGB
// Read-modify-write fill, used when only part of the attribute byte is being
// replaced. Each cell is wrapped individually so the rectangle behaves the same
// as the raw fill when it crosses the 32-tile tilemap edge.
static void fill_bkg_attr_rect_masked(UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE value, UBYTE mask, UBYTE shift) {
    UBYTE bits = (UBYTE)(value << shift) & mask;
    UBYTE keep = ~mask;
    for (UBYTE i = 0; i != h; i++) {
        UBYTE ty = BKG_VRAM_Y(y + i);
        for (UBYTE j = 0; j != w; j++) {
            UBYTE tx = BKG_VRAM_X(x + j);
            set_bkg_tile_xy(tx, ty, (get_bkg_tile_xy(tx, ty) & keep) | bits);
        }
    }
}

void vm_fill_background_attribute_rect(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    if (_is_CGB) {
        int16_t part = *(int16_t*)VM_REF_TO_PTR(FN_ARG5);
        UBYTE relative = *(uint8_t *) VM_REF_TO_PTR(FN_ARG6);
        UBYTE x = SCROLL_REL_X(*(uint8_t *) VM_REF_TO_PTR(FN_ARG0), relative);
        UBYTE y = SCROLL_REL_Y(*(uint8_t *) VM_REF_TO_PTR(FN_ARG1), relative);
        UBYTE w = *(uint8_t *) VM_REF_TO_PTR(FN_ARG2);
        UBYTE h = *(uint8_t *) VM_REF_TO_PTR(FN_ARG3);
        UBYTE attr = *(uint8_t *) VM_REF_TO_PTR(FN_ARG4);
        VBK_REG = 1;
        if (ATTR_PART_IS_RAW(part)) {
            fill_bkg_rect(BKG_VRAM_X(x), BKG_VRAM_Y(y), w, h, attr);
        } else {
            fill_bkg_attr_rect_masked(x, y, w, h, attr, ATTR_PART_MASK(part), ATTR_PART_SHIFT(part));
        }
        VBK_REG = 0;
    }
}
#endif
#endif // SUBMAP_ENABLE_FILL_BACKGROUND

#ifdef SUBMAP_ENABLE_FILL_OVERLAY
void vm_fill_overlay_rect(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE x = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
    UBYTE y = *(uint8_t *) VM_REF_TO_PTR(FN_ARG1);
    UBYTE w = *(uint8_t *) VM_REF_TO_PTR(FN_ARG2);
    UBYTE h = *(uint8_t *) VM_REF_TO_PTR(FN_ARG3);
    UBYTE tile = *(uint8_t *) VM_REF_TO_PTR(FN_ARG4);
    fill_win_rect(x, y, w, h, tile);
}

#ifdef CGB
static void fill_win_attr_rect_masked(UBYTE x, UBYTE y, UBYTE w, UBYTE h, UBYTE value, UBYTE mask, UBYTE shift) {
    UBYTE bits = (UBYTE)(value << shift) & mask;
    UBYTE keep = ~mask;
    for (UBYTE i = 0; i != h; i++) {
        UBYTE ty = (y + i) & 31;
        for (UBYTE j = 0; j != w; j++) {
            UBYTE tx = (x + j) & 31;
            set_win_tile_xy(tx, ty, (get_win_tile_xy(tx, ty) & keep) | bits);
        }
    }
}

void vm_fill_overlay_attribute_rect(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    if (_is_CGB) {
        UBYTE x = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
        UBYTE y = *(uint8_t *) VM_REF_TO_PTR(FN_ARG1);
        UBYTE w = *(uint8_t *) VM_REF_TO_PTR(FN_ARG2);
        UBYTE h = *(uint8_t *) VM_REF_TO_PTR(FN_ARG3);
        UBYTE attr = *(uint8_t *) VM_REF_TO_PTR(FN_ARG4);
        int16_t part = *(int16_t*)VM_REF_TO_PTR(FN_ARG5);
        VBK_REG = 1;
        if (ATTR_PART_IS_RAW(part)) {
            fill_win_rect(x, y, w, h, attr);
        } else {
            fill_win_attr_rect_masked(x, y, w, h, attr, ATTR_PART_MASK(part), ATTR_PART_SHIFT(part));
        }
        VBK_REG = 0;
    }
}
#endif
#endif // SUBMAP_ENABLE_FILL_OVERLAY

// ---------------------------------------------------------------------------
// Rectangular 1-tile scroll (up / down / left / right) on background or overlay
// ---------------------------------------------------------------------------
// dir: 0 = up, 1 = down, 2 = left, 3 = right
//
// Up reuses the stock asm scroll_rect. Down / left / right are the directional
// variants below, written in the same style as the stock scroll_rect but as
// BANKED NAKED inline-asm so each can be compiled out independently by its
// engine-field #define. Every one takes the address of the rectangle's
// top-left cell and is layer- and VBK-agnostic: the C wrapper picks the layer
// with GetBkgAddr()/GetWinAddr() and, on CGB, runs the shift once in VRAM
// bank 1 (attribute plane, exposed line = attribute 0) and once in bank 0
// (tile plane) so the colours follow the moved tiles.
//
// Argument layout at entry (BANKED convention, matches stock scroll_rect):
//   base_lo = SP+6, base_hi = SP+7, w = SP+8, h = SP+9, fill = SP+10
// The STAT spin (ldh a,(_STAT_REG); bit STATF_B_BUSY,a; jr nz) mirrors the
// engine's WAIT_STAT and is VRAM-safe.

#ifdef SUBMAP_ENABLE_SCROLL_RECT

#ifdef SUBMAP_ENABLE_SCROLL_RECT_DOWN
// Content moves down one row; the top row is filled.
void scroll_rect_down(UBYTE * base_addr, UBYTE w, UBYTE h, UBYTE fill) OLDCALL BANKED NAKED {
    base_addr; w; h; fill;
__asm
    ldhl    sp, #9
    ld      a, (hl-)        ; a = h
    or      a
    ret     z
    ld      d, a            ; d = h
    ld      a, (hl-)        ; a = w
    or      a
    ret     z
    ld      e, a            ; e = w

    push    bc

    ldhl    sp, #9
    ld      a, (hl-)        ; base high
    ld      l, (hl)         ; base low
    ld      h, a            ; hl = base (top-left)

    ld      a, d
    dec     a               ; a = h - 1
    jr      z, 4$           ; h == 1 -> only fill the (single) top row
    ld      c, a            ; c = walk count
5$:
    ld      a, #0x20
    add     l
    ld      l, a
    adc     h
    sub     l
    ld      h, a            ; hl += 0x20
    dec     c
    jr      nz, 5$
    ; hl = bottom row start ; d = h, e = w

    dec     d               ; d = h - 1 copies
2$:
    ld      b, h
    ld      c, l            ; bc = dest (current row)
    ld      a, l
    sub     #0x20
    ld      l, a
    ld      a, h
    sbc     #0
    ld      h, a            ; hl -= 0x20 (source = row above)
    push    hl
    push    de
3$:
    ldh     a, (_STAT_REG)
    bit     STATF_B_BUSY, a
    jr      nz, 3$
    ld      a, (hl+)        ; read source (row above)
    ld      (bc), a         ; write dest
    inc     bc
    dec     e
    jr      nz, 3$
    pop     de
    pop     hl              ; hl = source row start (next dest)
    dec     d
    jr      nz, 2$
    ; hl = base (top row)
4$:
    push    hl
    ldhl    sp, #14
    ld      d, (hl)         ; d = fill
    pop     hl
6$:
    ldh     a, (_STAT_REG)
    bit     STATF_B_BUSY, a
    jr      nz, 6$
    ld      a, d
    ld      (hl+), a        ; fill top row
    dec     e
    jr      nz, 6$

    pop     bc
    ret
__endasm;
}
#endif

#ifdef SUBMAP_ENABLE_SCROLL_RECT_LEFT
// Content moves left one column; the right column is filled.
void scroll_rect_left(UBYTE * base_addr, UBYTE w, UBYTE h, UBYTE fill) OLDCALL BANKED NAKED {
    base_addr; w; h; fill;
__asm
    ldhl    sp, #9
    ld      a, (hl-)        ; a = h
    or      a
    ret     z
    ld      d, a            ; d = h
    ld      a, (hl-)        ; a = w
    or      a
    ret     z
    ld      e, a            ; e = w

    push    bc

    ldhl    sp, #12
    ld      b, (hl)         ; b = fill
    ldhl    sp, #9
    ld      a, (hl-)        ; base high
    ld      l, (hl)         ; base low
    ld      h, a            ; hl = base (row start)
1$:                         ; per-row loop (d rows remaining)
    push    de              ; save d = row counter, e = w
    ld      c, e
    dec     c               ; c = w - 1 (bytes to move)
    push    hl              ; save row start
    ld      d, h
    ld      e, l            ; de = dest = row start
    inc     hl              ; hl = source = row start + 1
    ld      a, c
    or      a
    jr      z, 3$           ; w == 1 -> nothing to move
2$:
    ldh     a, (_STAT_REG)
    bit     STATF_B_BUSY, a
    jr      nz, 2$
    ld      a, (hl+)        ; source (col k+1)
    ld      (de), a         ; dest (col k)
    inc     de
    dec     c
    jr      nz, 2$
3$:
    ldh     a, (_STAT_REG)
    bit     STATF_B_BUSY, a
    jr      nz, 3$
    ld      a, b            ; fill
    ld      (de), a         ; last column = fill  (de = rowstart + w - 1)
    pop     hl              ; row start
    pop     de              ; row counter, w
    ld      a, #0x20
    add     l
    ld      l, a
    adc     h
    sub     l
    ld      h, a            ; hl += 0x20 (next row)
    dec     d
    jr      nz, 1$

    pop     bc
    ret
__endasm;
}
#endif

#ifdef SUBMAP_ENABLE_SCROLL_RECT_RIGHT
// Content moves right one column; the left column is filled.
void scroll_rect_right(UBYTE * base_addr, UBYTE w, UBYTE h, UBYTE fill) OLDCALL BANKED NAKED {
    base_addr; w; h; fill;
__asm
    ldhl    sp, #9
    ld      a, (hl-)        ; a = h
    or      a
    ret     z
    ld      d, a            ; d = h
    ld      a, (hl-)        ; a = w
    or      a
    ret     z
    ld      e, a            ; e = w

    push    bc

    ldhl    sp, #12
    ld      b, (hl)         ; b = fill
    ldhl    sp, #9
    ld      a, (hl-)        ; base high
    ld      l, (hl)         ; base low
    ld      h, a            ; hl = base (row start)
1$:                         ; per-row loop (d rows remaining)
    push    de              ; save d = row counter, e = w
    ld      c, e
    dec     c               ; c = w - 1 (bytes to move)
    push    hl              ; save row start
    ld      a, c
    add     l
    ld      l, a
    adc     h
    sub     l
    ld      h, a            ; hl = row start + (w-1) = last column
    ld      d, h
    ld      e, l
    dec     de              ; de = source = last column - 1
    ld      a, c
    or      a
    jr      z, 3$           ; w == 1 -> nothing to move
2$:
    ldh     a, (_STAT_REG)
    bit     STATF_B_BUSY, a
    jr      nz, 2$
    ld      a, (de)         ; source (col k-1)
    ld      (hl-), a        ; dest (col k) ; hl--
    dec     de
    dec     c
    jr      nz, 2$
3$:
    ldh     a, (_STAT_REG)
    bit     STATF_B_BUSY, a
    jr      nz, 3$
    ld      a, b            ; fill
    ld      (hl), a         ; first column = fill  (hl = row start)
    pop     hl              ; row start
    pop     de              ; row counter, w
    ld      a, #0x20
    add     l
    ld      l, a
    adc     h
    sub     l
    ld      h, a            ; hl += 0x20 (next row)
    dec     d
    jr      nz, 1$

    pop     bc
    ret
__endasm;
}
#endif

static void scroll_rect_dir(UBYTE * base_addr, UBYTE w, UBYTE h, UBYTE dir, UBYTE fill) {
    switch (dir) {
#ifdef SUBMAP_ENABLE_SCROLL_RECT_DOWN
        case 1:  scroll_rect_down(base_addr, w, h, fill);  break;
#endif
#ifdef SUBMAP_ENABLE_SCROLL_RECT_LEFT
        case 2:  scroll_rect_left(base_addr, w, h, fill);  break;
#endif
#ifdef SUBMAP_ENABLE_SCROLL_RECT_RIGHT
        case 3:  scroll_rect_right(base_addr, w, h, fill); break;
#endif
        default: scroll_rect(base_addr, w, h, fill);       break; // 0 = up (stock)
    }
}

void vm_scroll_background_rect(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE relative = *(uint8_t *) VM_REF_TO_PTR(FN_ARG6);
    UBYTE x    = SCROLL_REL_X(*(uint8_t *) VM_REF_TO_PTR(FN_ARG0), relative);
    UBYTE y    = SCROLL_REL_Y(*(uint8_t *) VM_REF_TO_PTR(FN_ARG1), relative);
    UBYTE w    = *(uint8_t *) VM_REF_TO_PTR(FN_ARG2);
    UBYTE h    = *(uint8_t *) VM_REF_TO_PTR(FN_ARG3);
    UBYTE dir  = *(uint8_t *) VM_REF_TO_PTR(FN_ARG4);
    UBYTE fill = *(uint8_t *) VM_REF_TO_PTR(FN_ARG5);
    UBYTE * base_addr = GetBkgAddr() + ((UWORD)BKG_VRAM_Y(y) << 5) + BKG_VRAM_X(x);
#ifdef CGB
    if (_is_CGB) {
        VBK_REG = 1;
        scroll_rect_dir(base_addr, w, h, dir, 0); // move the attribute plane too, new line = attribute 0
        VBK_REG = 0;
    }
#endif
    scroll_rect_dir(base_addr, w, h, dir, fill);
}

void vm_scroll_overlay_rect(SCRIPT_CTX * THIS) OLDCALL BANKED {
    (void)THIS;
    UBYTE x    = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
    UBYTE y    = *(uint8_t *) VM_REF_TO_PTR(FN_ARG1);
    UBYTE w    = *(uint8_t *) VM_REF_TO_PTR(FN_ARG2);
    UBYTE h    = *(uint8_t *) VM_REF_TO_PTR(FN_ARG3);
    UBYTE dir  = *(uint8_t *) VM_REF_TO_PTR(FN_ARG4);
    UBYTE fill = *(uint8_t *) VM_REF_TO_PTR(FN_ARG5);
    UBYTE * base_addr = GetWinAddr() + ((y & 31) << 5) + (x & 31);
#ifdef CGB
    if (_is_CGB) {
        VBK_REG = 1;
        scroll_rect_dir(base_addr, w, h, dir, 0); // move the attribute plane too, new line = attribute 0
        VBK_REG = 0;
    }
#endif
    scroll_rect_dir(base_addr, w, h, dir, fill);
}

#endif // SUBMAP_ENABLE_SCROLL_RECT
