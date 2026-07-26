#pragma bank 255

// === engineAlt variant: MetaTile + ScreenScroll/ContinuousScene (combined) ===
// Both fixes at once: (1) offset-scroll engines shift the visible VRAM origin
// by bkg_offset_x/y, so background WRITES add that offset; (2) a metatile scene
// stores a metatile-index map, so the REFRESH path resolves each visible tile
// through the SRAM metatile map + metatile defs. The metatile map READ uses
// logical scene-tile coords; only the VRAM write coord is offset (matches
// MetaTile's own engineAlt for these engines: read at (x,y), write at x+bkg_offset).

// Screen Transitions — runtime, waitable transition engine.
//
// Instead of baking hundreds of tile writes into GBVM script at compile time,
// each transition runs here in C as a single *waitable* VM function driven by
// VM_INVOKE: `screen_transition_update` is called once per frame (with
// `start` TRUE on the first call) until it returns TRUE. It advances the
// effect a few steps per frame and yields (waitable = TRUE) in between, so the
// invoking script pauses until the transition finishes while other threads keep
// running. The whole thing costs a handful of script bytes regardless of effect.

#include <gbdk/platform.h>
#include "system.h"
#include "vm.h"
#include "gbs_types.h"
#include "scroll.h"
#include "bankdata.h"
#include "data_manager.h"
#include "ui.h"    // win_pos_x/y, win_dest_pos_x/y, MENU_CLOSED_Y
#include "data/states_defines.h" // TRANSITION_* enable flags (engine settings)
#include "meta_tiles.h" // metatile_ptr/bank, sram_map_data, METATILE_* macros, get_metatile_tile

// Per-transition-type enable flags come from engine settings as #defines
// (defined = enabled). Derived flags for the shared helpers so a helper is only
// compiled when at least one effect that uses it is enabled.
#if defined(TRANSITION_CLOCK) || defined(TRANSITION_FAN)
    #define TR_USE_RAY
#endif
#if defined(TR_USE_RAY) || defined(TRANSITION_DIAGONAL) || defined(TRANSITION_DIAMOND) || defined(TRANSITION_X)
    #define TR_USE_LINE
#endif

// --- effects --- (ids are stable; the reverse-pair complements — wipe left/up,
// curtain close, iris/diamond close, diagonal BR, mask shrink — were dropped and
// are reproduced by the Direction = Reversed option, so their ids are now unused)
#define E_WIPE_R   0
#define E_WIPE_D   2
#define E_OPEN_H   5
#define E_OPEN_V   7
#define E_IRIS_OUT 9
#define E_DIAG_TL  10   // diagonal, vertical range (front spans top<->bottom, sweeps sideways)
#define E_DIAG_H   11   // diagonal, horizontal range (front spans left<->right, sweeps down)
#define E_CHECKER  12
#define E_SNAKE_H  13
#define E_SNAKE_V  14
#define E_BLINDS_H 15
#define E_BLINDS_V 16
#define E_FOUR_SQ  17
#define E_DIAMOND_OUT 19
#define E_CLOCK       20
#define E_NOISE       21
#define E_FAN4        22
#define E_X           23
#define E_MASK_GROW   24
#define E_SPIRAL      26

#define BLIND_BAND 3u   // venetian-blind band size (tiles)
#define NOISE_BINS    32u

// --- modes ---
#define M_FILL    0   // out: solid fill
#define M_REFRESH 1   // in: reload active scene tiles from ROM
#define M_COPY    2   // in: copy tiles from another scene (with source offset)

// --- layers ---
#define L_BKG     0
#define L_OVERLAY 1

// --- global state for the current transition ---
UBYTE tr_effect, tr_layer, tr_mode;
UBYTE tr_x0, tr_y0, tr_w, tr_h; // region (screen-relative tiles)
UBYTE tr_reverse;      // play steps in reverse order (flips direction / CW<->CCW)
UBYTE tr_angle;        // initial angle offset 0-255 (clock / fan phase)
UBYTE tr_cx, tr_cy;    // centre point (0xFF from event = auto = region centre); resolved in tr_begin
UBYTE tr_speed, tr_hold; // steps drawn per active frame / frames between batches
UBYTE tr_fill_tile, tr_fill_attr;
UBYTE tr_src_x, tr_src_y; // source offset in the other scene (copy mode)
UWORD tr_step, tr_total;
UWORD tr_min, tr_max; // min frame = initial tr_step; max frame = tr_total (0 = full; clamped to tr_calc_total())
UBYTE tr_hold_ctr;
UBYTE tr_noise_seed; // per-run seed for the noise dissolve
UBYTE tr_map_w, tr_mask_w, tr_mask_h;
const UBYTE * tr_map_ptr, * tr_attr_ptr, * tr_mask_ptr;
UBYTE tr_map_bank, tr_attr_bank, tr_mask_bank;
UWORD tr_mask_ntiles; // = tileset tile count = number of grow/shrink steps
// scene object pointers set directly by the event (copy / mask modes) — resolved
// into the tilemap pointers above on start.
const void * tr_scene_ptr; UBYTE tr_scene_bank;
const void * tr_maskscene_ptr; UBYTE tr_maskscene_bank;


#ifdef TR_USE_RAY
static UWORD tr_perim(void);   // fwd decl (tr_calc_total below uses it before its definition)
#endif

#ifdef TRANSITION_DIAGONAL
// Diagonal skew from tr_angle: signed offset of the front line across the given
// span `dim`. 0 => +(dim-1), 128 => 0, 255 => -(dim-1). Kept in [-(dim-1),dim-1]
// so the front stays one tile per row/column. Vertical variant passes tr_h
// (offset across the height); horizontal variant passes tr_w (across the width).
static int tr_diag_skew(UBYTE dim) {
    int m = (int)dim - 1;
    return m - (2 * m * (int)tr_angle) / 255;
}
#endif

#ifdef TRANSITION_NOISE
// Deterministic per-tile hash (0..255), varied per run by seed.
static UBYTE tr_hash(UBYTE x, UBYTE y, UBYTE seed) {
    UBYTE h = (UBYTE)(x * 37u + y * 101u + seed * 151u);
    h ^= (UBYTE)(h << 3);
    h ^= (UBYTE)(h >> 2);
    h = (UBYTE)(h + (x ^ (UBYTE)(y << 4) ^ seed));
    h ^= (UBYTE)(h << 1);
    return h;
}
#endif

static UWORD tr_calc_total(void) {
    UBYTE W = tr_w, H = tr_h;
    switch (tr_effect) {
#ifdef TRANSITION_WIPE
        case E_WIPE_R:                  return W;
        case E_WIPE_D:                  return H;
#endif
#ifdef TRANSITION_CURTAIN
        case E_OPEN_H:                  return (W + 1u) >> 1;
        case E_OPEN_V:                  return (H + 1u) >> 1;
#endif
#ifdef TRANSITION_IRIS
        case E_IRIS_OUT: {
            UBYTE rx = (tr_cx > (UBYTE)(W - 1u - tr_cx)) ? tr_cx : (UBYTE)(W - 1u - tr_cx);
            UBYTE ry = (tr_cy > (UBYTE)(H - 1u - tr_cy)) ? tr_cy : (UBYTE)(H - 1u - tr_cy);
            return (UWORD)((rx > ry ? rx : ry) + 1u);   // Chebyshev reach from centre
        }
#endif
#ifdef TRANSITION_DIAGONAL
        case E_DIAG_TL: { int sk = tr_diag_skew(tr_h); return (UWORD)(W + (sk < 0 ? -sk : sk)); }
        case E_DIAG_H:  { int sk = tr_diag_skew(tr_w); return (UWORD)(H + (sk < 0 ? -sk : sk)); }
#endif
#ifdef TRANSITION_CHECKER
        case E_CHECKER:                 return (UWORD)W << 1;
#endif
#ifdef TRANSITION_SNAKE
        case E_SNAKE_H: case E_SNAKE_V: return (UWORD)W * H;
#endif
#ifdef TRANSITION_SPIRAL
        case E_SPIRAL:                  return (UWORD)W * H;
#endif
#ifdef TRANSITION_BLINDS
        case E_BLINDS_H:                return (H < BLIND_BAND) ? H : BLIND_BAND;
        case E_BLINDS_V:                return (W < BLIND_BAND) ? W : BLIND_BAND;
#endif
#ifdef TRANSITION_FOURSQ
        case E_FOUR_SQ:                 return (UWORD)((W + 1u) >> 1) * ((H + 1u) >> 1);
#endif
#ifdef TRANSITION_DIAMOND
        case E_DIAMOND_OUT: {
            UBYTE mx = (tr_cx > (UBYTE)(W - 1u - tr_cx)) ? tr_cx : (UBYTE)(W - 1u - tr_cx);
            UBYTE my = (tr_cy > (UBYTE)(H - 1u - tr_cy)) ? tr_cy : (UBYTE)(H - 1u - tr_cy);
            return (UWORD)mx + my + 1u;
        }
#endif
#ifdef TRANSITION_CLOCK
        case E_CLOCK:                   return tr_perim();                    // one radius per step
#endif
#ifdef TRANSITION_NOISE
        case E_NOISE:                   return NOISE_BINS;
#endif
#ifdef TRANSITION_FAN
        case E_FAN4:                    return (UWORD)((tr_perim() + 3u) >> 2); // ceil(perim/4)
#endif
#ifdef TRANSITION_X
        case E_X:                       return (UWORD)((W >> 1) + 1u);   // half the width (linear thicken)
#endif
#ifdef TRANSITION_MASK
        case E_MASK_GROW:               return tr_mask_ntiles;
#endif
        default:                        return W;
    }
}

// Draw a single region-local tile (lx,ly) using the current mode/layer.
static void tr_put(UBYTE lx, UBYTE ly) {
    UBYTE sx = tr_x0 + lx;
    UBYTE sy = tr_y0 + ly;
    UBYTE vx, vy;
    if (tr_layer == L_BKG) {
        // logical scene tile (used for tilemap reads) = region + live scroll
        sx += (UBYTE)(scroll_x >> 3); sy += (UBYTE)(scroll_y >> 3);
        // offset-scroll engines shift the visible VRAM origin by bkg_offset_x/y,
        // so the VRAM WRITE coordinate adds it (reads stay in logical space).
        vx = (UBYTE)(sx + bkg_offset_x) & 31u;
        vy = (UBYTE)(sy + bkg_offset_y) & 31u;
    } else {
        vx = sx & 31u; vy = sy & 31u; // window is not offset
    }

    if (tr_mode == M_FILL) {
        if (tr_layer == L_OVERLAY) {
#ifdef CGB
            if (_is_CGB) { VBK_REG = 1; set_win_tile_xy(vx, vy, tr_fill_attr); VBK_REG = 0; }
#endif
            set_win_tile_xy(vx, vy, tr_fill_tile);
        } else {
#ifdef CGB
            if (_is_CGB) { VBK_REG = 1; set_bkg_tile_xy(vx, vy, tr_fill_attr); VBK_REG = 0; }
#endif
            set_bkg_tile_xy(vx, vy, tr_fill_tile);
        }
        return;
    }

    if (tr_mode == M_REFRESH) {
        UBYTE tile;
        if (metatile_bank) {
            // metatile scene: resolve visible tile via SRAM map + metatile defs
#if METATILE_SIZE == METATILE_SIZE_16
            UWORD tofs = get_metatile_tile(METATILE_MAP_OFFSET(sx, sy),
                                           TILE_Y_OFFSET(sy) + TILE_X_OFFSET(sx));
            tile = ReadBankedUBYTE(metatile_ptr + tofs, metatile_bank);
#ifdef CGB
            if (_is_CGB && metatile_attr_bank) {
                UBYTE a = ReadBankedUBYTE(metatile_attr_ptr + tofs, metatile_attr_bank);
                VBK_REG = 1; set_bkg_tile_xy(vx, vy, a); VBK_REG = 0;
            }
#endif
#else
            UBYTE midx = sram_map_data[METATILE_MAP_OFFSET(sx, sy)];
            tile = ReadBankedUBYTE(metatile_ptr + midx, metatile_bank);
#ifdef CGB
            if (_is_CGB && metatile_attr_bank) {
                UBYTE a = ReadBankedUBYTE(metatile_attr_ptr + midx, metatile_attr_bank);
                VBK_REG = 1; set_bkg_tile_xy(vx, vy, a); VBK_REG = 0;
            }
#endif
#endif
        } else {
            UWORD off = (UWORD)sy * (UWORD)image_tile_width + sx;
            tile = ReadBankedUBYTE(image_ptr + off, image_bank);
#ifdef CGB
            if (_is_CGB) {
                UBYTE a = ReadBankedUBYTE(image_attr_ptr + off, image_attr_bank);
                VBK_REG = 1; set_bkg_tile_xy(vx, vy, a); VBK_REG = 0;
            }
#endif
        }
        set_bkg_tile_xy(vx, vy, tile);
        return;
    }

    // M_COPY: pull from the other scene at (src + region-local). In a metatile
    // scene (metatile_bank set) the source is assumed to be a metatile scene too
    // (sharing the metatile definitions), so resolve its metatile-index map
    // through metatile_ptr just like the current scene.
    {
        UBYTE cx = tr_src_x + tr_x0 + lx;
        UBYTE cy = tr_src_y + tr_y0 + ly;
        UBYTE tile;
#ifdef CGB
        const UBYTE * a_ptr; UBYTE a_bank; UWORD a_off;
#endif
        if (metatile_bank) {
#if METATILE_SIZE == METATILE_SIZE_16
            UBYTE idx = ReadBankedUBYTE(tr_map_ptr + (UWORD)(cy >> 1) * (UWORD)(tr_map_w >> 1) + (cx >> 1), tr_map_bank);
            UWORD tofs = TILE_MAP_OFFSET(idx, cx, cy);
            tile = ReadBankedUBYTE(metatile_ptr + tofs, metatile_bank);
#ifdef CGB
            a_ptr = metatile_attr_bank ? (const UBYTE *)metatile_attr_ptr : 0; a_bank = metatile_attr_bank; a_off = tofs;
#endif
#else
            UBYTE idx = ReadBankedUBYTE(tr_map_ptr + (UWORD)cy * (UWORD)tr_map_w + cx, tr_map_bank);
            tile = ReadBankedUBYTE(metatile_ptr + idx, metatile_bank);
#ifdef CGB
            a_ptr = metatile_attr_bank ? (const UBYTE *)metatile_attr_ptr : 0; a_bank = metatile_attr_bank; a_off = idx;
#endif
#endif
        } else {
            UWORD off = (UWORD)cy * (UWORD)tr_map_w + cx;
            tile = ReadBankedUBYTE(tr_map_ptr + off, tr_map_bank);
#ifdef CGB
            a_ptr = tr_attr_ptr; a_bank = tr_attr_bank; a_off = off;
#endif
        }
        if (tr_layer == L_OVERLAY) {
#ifdef CGB
            if (_is_CGB && a_ptr) {
                UBYTE a = ReadBankedUBYTE(a_ptr + a_off, a_bank);
                VBK_REG = 1; set_win_tile_xy(vx, vy, a); VBK_REG = 0;
            }
#endif
            set_win_tile_xy(vx, vy, tile);
        } else {
#ifdef CGB
            if (_is_CGB && a_ptr) {
                UBYTE a = ReadBankedUBYTE(a_ptr + a_off, a_bank);
                VBK_REG = 1; set_bkg_tile_xy(vx, vy, a); VBK_REG = 0;
            }
#endif
            set_bkg_tile_xy(vx, vy, tile);
        }
    }
}

#ifdef TR_USE_LINE
// Bresenham line between two region-local points (either may lie outside the
// region — off-region tiles are clipped by the tr_put guard). Signed coords so
// the walk is correct even when an endpoint is negative. Shared by the radial
// (clock / fan / X) and diamond effects.
static void tr_line(BYTE x0, BYTE y0, BYTE x1, BYTE y1) {
    BYTE ax = (BYTE)(x1 - x0), ay = (BYTE)(y1 - y0);
    BYTE sx = (ax >= 0) ? 1 : -1, sy = (ay >= 0) ? 1 : -1;
    BYTE dx = (ax >= 0) ? ax : (BYTE)-ax;
    BYTE dy = (ay >= 0) ? ay : (BYTE)-ay;
    BYTE err = (BYTE)(dx - dy);
    BYTE x = x0, y = y0;
    while (1) {
        if ((UBYTE)x < tr_w && (UBYTE)y < tr_h) tr_put((UBYTE)x, (UBYTE)y);
        if (x == x1 && y == y1) break;
        BYTE e2 = (BYTE)(err << 1);
        if (e2 > -dy) { err = (BYTE)(err - dy); x = (BYTE)(x + sx); }
        if (e2 <  dx) { err = (BYTE)(err + dx); y = (BYTE)(y + sy); }
    }
}
#endif // TR_USE_LINE

#ifdef TR_USE_RAY
// Draw a radius: a Bresenham line from the region centre out to the perimeter
// tile at clockwise walk-index `idx` (index 0 = top-left, walking L->R along the
// top, then down the right, etc.). Callers add their own phase offset to `idx`.
static void tr_ray(UWORD idx) {
    UBYTE W = tr_w, H = tr_h;
    UBYTE cx = tr_cx, cy = tr_cy;   // centre (resolved in tr_begin; may be offset)
    UWORD perim = (UWORD)2u * W + 2u * H; perim = (perim > 4u) ? (UWORD)(perim - 4u) : 1u;
    UWORD n = idx % perim;
    BYTE ex, ey;
    if (n < W) { ex = (BYTE)n; ey = 0; }                                   // top row  L->R
    else if ((n -= W) < (UWORD)(H - 1u)) { ex = (BYTE)(W - 1u); ey = (BYTE)(n + 1u); }        // right col T->B
    else if ((n -= (UWORD)(H - 1u)) < (UWORD)(W - 1u)) { ex = (BYTE)(W - 2u - n); ey = (BYTE)(H - 1u); } // bottom row R->L
    else { n -= (UWORD)(W - 1u); ex = 0; ey = (BYTE)(H - 2u - n); }        // left col  B->T
    tr_line((BYTE)cx, (BYTE)cy, ex, ey);
}

// Perimeter of the current region (>=1), used by the radial effects.
static UWORD tr_perim(void) {
    UWORD p = (UWORD)2u * tr_w + 2u * tr_h;
    return (p > 4u) ? (UWORD)(p - 4u) : 1u;
}
#endif // TR_USE_RAY

// Draw all tiles belonging to step `k` of the current effect.
static void tr_draw_step(UWORD k) {
    UBYTE W = tr_w, H = tr_h;
    switch (tr_effect) {
#ifdef TRANSITION_WIPE
        case E_WIPE_R: { UBYTE c = (UBYTE)k;         for (UBYTE y = 0; y < H; y++) tr_put(c, y); } break;
        case E_WIPE_D: { UBYTE r = (UBYTE)k;         for (UBYTE x = 0; x < W; x++) tr_put(x, r); } break;
#endif
#ifdef TRANSITION_CURTAIN
        case E_OPEN_H: { // curtain from centre outward (Reversed = close)
            UBYTE half = (W + 1u) >> 1;
            UBYTE c = half - 1u - (UBYTE)k;
            for (UBYTE y = 0; y < H; y++) { tr_put(c, y); if ((W - 1u - c) != c) tr_put(W - 1u - c, y); }
        } break;
        case E_OPEN_V: {
            UBYTE half = (H + 1u) >> 1;
            UBYTE r = half - 1u - (UBYTE)k;
            for (UBYTE x = 0; x < W; x++) { tr_put(x, r); if ((H - 1u - r) != r) tr_put(x, H - 1u - r); }
        } break;
#endif
#ifdef TRANSITION_IRIS
        case E_IRIS_OUT: { // Chebyshev (box) rings from the centre outward (Reversed = close)
            BYTE cx = (BYTE)tr_cx, cy = (BYTE)tr_cy;
            BYTE d = (BYTE)k;
            BYTE l = (BYTE)(cx - d), r = (BYTE)(cx + d), t = (BYTE)(cy - d), b = (BYTE)(cy + d);
            for (BYTE x = l; x <= r; x++) {
                if ((UBYTE)x < W) { if ((UBYTE)t < H) tr_put((UBYTE)x, (UBYTE)t); if (b != t && (UBYTE)b < H) tr_put((UBYTE)x, (UBYTE)b); }
            }
            for (BYTE y = t; y <= b; y++) {
                if ((UBYTE)y < H) { if ((UBYTE)l < W) tr_put((UBYTE)l, (UBYTE)y); if (r != l && (UBYTE)r < W) tr_put((UBYTE)r, (UBYTE)y); }
            }
        } break;
#endif
#ifdef TRANSITION_DIAGONAL
        case E_DIAG_TL: { // vertical range: front spans top<->bottom, swept sideways.
            // tr_angle tilts it: 0 = "/", 128 = vertical, 255 = "\". One tr_line per step.
            int sk = tr_diag_skew(tr_h);
            int t = (sk < 0 ? sk : 0) + (int)k;          // top-edge x for this step
            tr_line((BYTE)t, 0, (BYTE)(t - sk), (BYTE)(H - 1u));
        } break;
        case E_DIAG_H: { // horizontal range: front spans left<->right, swept downward.
            // tr_angle tilts it: 0 = "/", 128 = horizontal, 255 = "\". One tr_line per step.
            int sk = tr_diag_skew(tr_w);
            int u = (sk < 0 ? sk : 0) + (int)k;          // left-edge y for this step
            tr_line(0, (BYTE)u, (BYTE)(W - 1u), (BYTE)(u - sk));
        } break;
#endif
#ifdef TRANSITION_CHECKER
        case E_CHECKER: {
            UBYTE p  = (UBYTE)(k / W);
            UBYTE cx = (UBYTE)(k % W);
            for (UBYTE y = 0; y < H; y++) if (((cx + y) & 1u) == p) tr_put(cx, y);
        } break;
#endif
#ifdef TRANSITION_SNAKE
        case E_SNAKE_H: { // serpentine, one tile per step (row L->R, R->L, ...)
            UBYTE row = (UBYTE)(k / W);
            UBYTE i   = (UBYTE)(k % W);
            UBYTE col = (row & 1u) ? (UBYTE)(W - 1u - i) : i;
            tr_put(col, row);
        } break;
        case E_SNAKE_V: {
            UBYTE col = (UBYTE)(k / H);
            UBYTE j   = (UBYTE)(k % H);
            UBYTE row = (col & 1u) ? (UBYTE)(H - 1u - j) : j;
            tr_put(col, row);
        } break;
#endif
#ifdef TRANSITION_SPIRAL
        case E_SPIRAL: { // serpentine spiral, one tile per step; clockwise, outside -> in.
            //Get the next spiral position based on k
            UBYTE layer = 0;
            UBYTE x = 0, y = 0;
            UBYTE w = W, h = H;
            UWORD n = k;
            while (1) {
                if (n < w) { x = n; y = 0; break; }
                n -= w;
                if (n < h - 1) { x = w - 1; y = n + 1; break; }
                n -= h - 1;
                if (n < w - 1) { x = w - 2 - n; y = h - 1; break; }
                n -= w - 1;
                if (n < h - 2) { x = 0; y = h - 2 - n; break; }
                n -= h - 2;
                w -= 2; h -= 2; layer++; if (w == 0 || h == 0) break;
            }
            x += layer; y += layer;
            if (x < W && y < H) tr_put(x, y);

        } break;
#endif
#ifdef TRANSITION_BLINDS
        case E_BLINDS_H: { // venetian blinds: every band advances one row per step
            for (UBYTE bs = 0; bs < H; bs += BLIND_BAND) {
                UBYTE r = bs + (UBYTE)k;
                if (r < H && (UBYTE)k < BLIND_BAND) for (UBYTE x = 0; x < W; x++) tr_put(x, r);
            }
        } break;
        case E_BLINDS_V: {
            for (UBYTE bs = 0; bs < W; bs += BLIND_BAND) {
                UBYTE c = bs + (UBYTE)k;
                if (c < W && (UBYTE)k < BLIND_BAND) for (UBYTE y = 0; y < H; y++) tr_put(c, y);
            }
        } break;
#endif
#ifdef TRANSITION_FOURSQ
        case E_FOUR_SQ: { // chunky 2x2 (16x16px) block wipe
            UBYTE bcols = (W + 1u) >> 1;
            UBYTE by = (UBYTE)(k / bcols);
            UBYTE bx = (UBYTE)(k % bcols);
            UBYTE ox = bx << 1, oy = by << 1;
            for (UBYTE dy = 0; dy < 2u; dy++)
                for (UBYTE dx = 0; dx < 2u; dx++) {
                    UBYTE xx = ox + dx, yy = oy + dy;
                    if (xx < W && yy < H) tr_put(xx, yy);
                }
        } break;
#endif
#ifdef TRANSITION_DIAMOND
        case E_DIAMOND_OUT: { // diamond iris from the centre outward (Reversed = close)
            BYTE cx = (BYTE)tr_cx, cy = (BYTE)tr_cy;
            BYTE d = (BYTE)k;
            // tips: N(cx,cy-d) E(cx+d,cy) S(cx,cy+d) W(cx-d,cy); edges connect them at 45deg
            tr_line(cx, (BYTE)(cy - d), (BYTE)(cx + d), cy);
            tr_line((BYTE)(cx + d), cy, cx, (BYTE)(cy + d));
            tr_line(cx, (BYTE)(cy + d), (BYTE)(cx - d), cy);
            tr_line((BYTE)(cx - d), cy, cx, (BYTE)(cy - d));
        } break;
#endif
#ifdef TRANSITION_CLOCK
        case E_CLOCK: { // radial clock sweep: one perimeter point per step, line centre->edge
            UWORD perim = tr_perim();
            UWORD phase = (UWORD)(W >> 1) + (UWORD)(((UWORD)tr_angle * perim) >> 8); // top-centre + angle
            tr_ray((UWORD)(k + phase));
        } break;
#endif
#ifdef TRANSITION_FAN
        case E_FAN4: { // 4-blade fan: 4 radii sweeping contiguous quarter-arcs in parallel
            UWORD perim = tr_perim();
            UWORD total = (UWORD)((perim + 3u) >> 2);   // ceil(perim/4) = steps
            UWORD phase = (UWORD)(W >> 1) + (UWORD)(((UWORD)tr_angle * perim) >> 8);
            for (UBYTE b = 0; b < 4u; b++) {
                UWORD idx = k + (UWORD)b * total;        // blade b sweeps its own quarter block
                if (idx < perim) tr_ray(idx + phase);
            }
        } break;
#endif
#ifdef TRANSITION_NOISE
        case E_NOISE: { // random-looking dissolve (hash binned)
            for (UBYTE y = 0; y < H; y++)
                for (UBYTE x = 0; x < W; x++)
                    if ((UBYTE)(tr_hash(x, y, tr_noise_seed) >> 3) == (UBYTE)k) tr_put(x, y);
        } break;
#endif
#ifdef TRANSITION_X
        case E_X: { // an X whose two diagonal arms thicken LINEARLY into uniform bands:
            // draw both full diagonals, translated horizontally by +/-k each step.
            BYTE kk = (BYTE)k;
            BYTE wm = (BYTE)(W - 1u), hm = (BYTE)(H - 1u);
            tr_line(kk, 0, (BYTE)(wm + kk), hm);           // main diagonal (TL->BR), shifted +k
            tr_line((BYTE)(wm + kk), 0, kk, hm);           // anti diagonal (TR->BL), shifted +k
            if (k) {                                       // k==0 is the bare X (2 lines)
                tr_line((BYTE)-kk, 0, (BYTE)(wm - kk), hm);   // main -k
                tr_line((BYTE)(wm - kk), 0, (BYTE)-kk, hm);   // anti -k
            }
        } break;
#endif
#ifdef TRANSITION_MASK
        case E_MASK_GROW: { // reveal by the mask scene's tile index, low first (Reversed = high first)
            // Sample so the mask's centre lands on (tr_cx,tr_cy); the mask scene is
            // sized by the author to cover the region for the chosen centre offset.
            UWORD target = k;
            UBYTE mcx = tr_mask_w >> 1, mcy = tr_mask_h >> 1;
            for (UBYTE y = 0; y < H; y++) {
                UBYTE my = (UBYTE)(mcy + y - tr_cy);
                UWORD row = (UWORD)my * (UWORD)tr_mask_w;
                for (UBYTE x = 0; x < W; x++) {
                    UBYTE mx = (UBYTE)(mcx + x - tr_cx);
                    UBYTE mv = ReadBankedUBYTE(tr_mask_ptr + row + mx, tr_mask_bank);
                    if ((UWORD)mv == target) tr_put(x, y);
                }
            }
        } break;
#endif
    }
}

// Prime the overlay (window) with the current scene's visible tiles and show it
// covering the screen. The transition then draws over the window, so the screen
// looks unchanged until the effect touches a tile — and the overlay is left
// OPEN afterwards so a following Change Scene is seamless (the window keeps
// covering the background repaint; win_pos + the window tilemap both survive a
// scene change). Dismiss it later with the stock "Hide Overlay" event.
static void tr_overlay_show(void) {
    UBYTE bx = (UBYTE)(scroll_x >> 3);
    UBYTE by = (UBYTE)(scroll_y >> 3);
    for (UBYTE ly = 0; ly < 18u; ly++) {
        for (UBYTE lx = 0; lx < 20u; lx++) {
            UBYTE tile;
            if (metatile_bank) {
                // metatile scene: resolve visible tile via SRAM map + metatile defs
#if METATILE_SIZE == METATILE_SIZE_16
                UWORD tofs = get_metatile_tile(METATILE_MAP_OFFSET(lx + bx, ly + by),
                                           TILE_Y_OFFSET(ly + by) + TILE_X_OFFSET(lx + bx));
                tile = ReadBankedUBYTE(metatile_ptr + tofs, metatile_bank);
#ifdef CGB
                if (_is_CGB && metatile_attr_bank) {
                    UBYTE a = ReadBankedUBYTE(metatile_attr_ptr + tofs, metatile_attr_bank);
                    VBK_REG = 1; set_win_tile_xy(lx, ly, a); VBK_REG = 0;
                }
#endif
#else
                UBYTE midx = sram_map_data[METATILE_MAP_OFFSET(bx + lx, by + ly)];
                tile = ReadBankedUBYTE(metatile_ptr + midx, metatile_bank);
#ifdef CGB
                if (_is_CGB && metatile_attr_bank) {
                    UBYTE a = ReadBankedUBYTE(metatile_attr_ptr + midx, metatile_attr_bank);
                    VBK_REG = 1; set_win_tile_xy(lx, ly, a); VBK_REG = 0;
                }
#endif
#endif
            } else {
                UWORD off = (UWORD)(UBYTE)(by + ly) * (UWORD)image_tile_width + (UBYTE)(bx + lx);
                tile = ReadBankedUBYTE(image_ptr + off, image_bank);
#ifdef CGB
                if (_is_CGB) {
                    UBYTE a = ReadBankedUBYTE(image_attr_ptr + off, image_attr_bank);
                    VBK_REG = 1; set_win_tile_xy(lx, ly, a); VBK_REG = 0;
                }
#endif
            }
            set_win_tile_xy(lx, ly, tile);
        }
    }
    win_pos_x = win_dest_pos_x = 0;
    win_pos_y = win_dest_pos_y = 0; // show at top-left, instantly
}

// Compute derived state for a transition whose parameter globals were already
// set DIRECTLY by the event (tr_effect / tr_layer / tr_mode / tr_x0.. / tr_fill_*
// / tr_src_* and, for copy/mask modes, tr_scene_* / tr_maskscene_*). Called once
// on the first (start) frame — no stack frame is passed anymore.
static void tr_begin(void) {
    if (!tr_w) tr_w = 1; if (tr_w > 32u) tr_w = 32u;
    if (!tr_h) tr_h = 1; if (tr_h > 32u) tr_h = 32u;
    if (!tr_speed) tr_speed = 1;
    if (!tr_hold) tr_hold = 1;
    if (tr_cx == 0xFFu) tr_cx = tr_w >> 1;   // 0xFF sentinel = auto centre
    if (tr_cy == 0xFFu) tr_cy = tr_h >> 1;
    // (custom centres are already clamped into the region by the event)

    if (tr_layer != L_BKG) tr_overlay_show(); // overlay primes+shows the window; bkg tracks scroll live in tr_put

    tr_attr_ptr = 0;
    if (tr_mode == M_COPY) {
        scene_t scn;
        MemcpyBanked(&scn, tr_scene_ptr, sizeof(scn), tr_scene_bank);
        background_t bkg;
        MemcpyBanked(&bkg, scn.background.ptr, sizeof(bkg), scn.background.bank);
        tr_map_w = bkg.width;
        tr_map_ptr = bkg.tilemap.ptr; tr_map_bank = bkg.tilemap.bank;
        tr_attr_ptr = bkg.cgb_tilemap_attr.ptr; tr_attr_bank = bkg.cgb_tilemap_attr.bank;
    }

#ifdef TRANSITION_NOISE
    if (tr_effect == E_NOISE) tr_noise_seed = (UBYTE)DIV_REG;   // vary the dissolve each run
#endif
#ifdef TRANSITION_MASK
    if (tr_effect == E_MASK_GROW) {
        scene_t scn;
        MemcpyBanked(&scn, tr_maskscene_ptr, sizeof(scn), tr_maskscene_bank);
        background_t bkg;
        MemcpyBanked(&bkg, scn.background.ptr, sizeof(bkg), scn.background.bank);
        tr_mask_w = bkg.width;
        tr_mask_h = bkg.height;
        tr_mask_ptr = bkg.tilemap.ptr; tr_mask_bank = bkg.tilemap.bank;
        // grow/shrink over the tileset's tile count (one index per step)
        tr_mask_ntiles = ReadBankedUWORD(&(((const tileset_t *)bkg.tileset.ptr)->n_tiles), bkg.tileset.bank);
        if (tr_mask_ntiles == 0) tr_mask_ntiles = 1;
    }
#endif

    {
        UWORD calc = tr_calc_total();
        // max frame sets the total but never exceeds the effect's natural length
        // (0 = run to the end); min frame sets the starting step (clamped).
        tr_total = (tr_max != 0u && tr_max < calc) ? tr_max : calc;
        tr_step = (tr_min < tr_total) ? tr_min : tr_total;
    }
    tr_hold_ctr = 0;
}

// Waitable VM function (VM_INVOKE target). Parameters live in the globals above,
// set by the event before the invoke; no stack frame is used.
UBYTE screen_transition_update(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    (void)stack_frame;
    if (start) tr_begin();

    if (tr_hold_ctr) {
        tr_hold_ctr--;
        ((SCRIPT_CTX *)THIS)->waitable = TRUE;
        return FALSE;
    }

    for (UBYTE s = 0; s < tr_speed && tr_step < tr_total; s++) {
        // reverse = play the [tr_min, tr_total) window back-to-front (flips
        // direction / CW<->CCW) — same steps as forward, just reversed order, so
        // min/max always select the same portion regardless of direction.
        tr_draw_step(tr_reverse ? (UWORD)(tr_total - 1u - tr_step + tr_min) : tr_step);
        tr_step++;
    }

    if (tr_step >= tr_total) return TRUE;

    tr_hold_ctr = tr_hold - 1u;
    ((SCRIPT_CTX *)THIS)->waitable = TRUE;
    return FALSE;
}

// One-shot: fill the whole background tilemap with a tile (+CGB attr). Used to
// cover the screen before an instant fade-in on scene entry.
//   VM_PUSH_CONST attr
//   VM_PUSH_CONST tile
//   VM_CALL_NATIVE b_vm_screen_cover, _vm_screen_cover
//   VM_POP 2
void vm_screen_cover(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE tile = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
    (void)tile;
#ifdef CGB
    if (_is_CGB) {
        UBYTE attr = *(uint8_t *) VM_REF_TO_PTR(FN_ARG1);
        VBK_REG = 1; fill_bkg_rect(0, 0, 32, 32, attr); VBK_REG = 0;
    }
#endif
    fill_bkg_rect(0, 0, 32, 32, tile);
    (void)THIS;
}
