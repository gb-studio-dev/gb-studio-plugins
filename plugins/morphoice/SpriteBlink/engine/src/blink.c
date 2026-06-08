#pragma bank 255

#include "vm.h"
#include "actor.h"
#include <gb/gb.h>

// --- Configuration ---
#define BLINK_CLOSED_FRAMES  4
#define BLINK_MIN_OPEN      60
#define MAX_BLINKERS         2
#define MAX_ROWS_PER         2
#define TOTAL_ROWS           (MAX_BLINKERS * MAX_ROWS_PER)

// --- Per-blinker state (flat arrays, SDCC-friendly) ---
static UBYTE bk_active[MAX_BLINKERS];
static UBYTE bk_actor[MAX_BLINKERS];
static UBYTE bk_n_rows[MAX_BLINKERS];
static UBYTE bk_timer[MAX_BLINKERS];
static UBYTE bk_closed[MAX_BLINKERS];
static UBYTE bk_spr_bank[MAX_BLINKERS]; // sprite bank at setup — scene-change detection

// --- Per-row state (indexed as slot * MAX_ROWS_PER + row_index) ---
static UBYTE bk_dtile[TOTAL_ROWS];    // dtile offset from base_tile
static UBYTE bk_rownum[TOTAL_ROWS];   // row within tile (0-7)
static UBYTE bk_mask[TOTAL_ROWS];     // bit mask for eye pixels
static UBYTE bk_clo[TOTAL_ROWS];      // close color bits for lo plane
static UBYTE bk_chi[TOTAL_ROWS];      // close color bits for hi plane

// Global enable flag — checked by VBL_isr before calling bk_vbl_update
UBYTE bk_enabled;

// Tile row VRAM address: inline macro, no function call, no bank 0 footprint
#define TILE_ROW_ADDR(tile, row) \
    ((UBYTE *)(0x8000u + ((UWORD)(tile) << 4) + ((UWORD)(row) << 1)))

// Called from VBL_isr (via interrupts.c override). Runs every frame.
// Read-modify-write: reads current VRAM, toggles only eye bits, writes back.
// No precomputed values needed. VRAM is accessible during VBlank.
void bk_vbl_update(void) BANKED {
    for (UBYTE s = 0; s < MAX_BLINKERS; s++) {
        if (!bk_active[s]) continue;

        actor_t *actor = &actors[bk_actor[s]];
        // Scene-change detection: if sprite bank changed, actor is from a different scene
        if (actor->sprite.bank != bk_spr_bank[s]) {
            bk_active[s] = 0;
            continue;
        }
        if (actor->dir != DIR_DOWN) continue;
        if (actor->flags & (ACTOR_FLAG_HIDDEN | ACTOR_FLAG_DISABLED)) continue;

        if (bk_timer[s] > 0) {
            bk_timer[s]--;
            continue;
        }

        UBYTE base = s << 1;  // s * MAX_ROWS_PER, but avoid multiply
        UBYTE bt = actor->base_tile;

        if (!bk_closed[s]) {
            // Close eyes: clear eye bits, set to blink color
            for (UBYTE i = 0; i < bk_n_rows[s]; i++) {
                UBYTE idx = base + i;
                UBYTE m = bk_mask[idx];
                UBYTE *addr = TILE_ROW_ADDR(bt + bk_dtile[idx], bk_rownum[idx]);
                addr[0] = (addr[0] & ~m) | bk_clo[idx];
                addr[1] = (addr[1] & ~m) | bk_chi[idx];
            }
            bk_closed[s] = 1;
            bk_timer[s] = BLINK_CLOSED_FRAMES;
        } else {
            // Open eyes: set eye bits to color 3 (black) = both planes 1
            for (UBYTE i = 0; i < bk_n_rows[s]; i++) {
                UBYTE idx = base + i;
                UBYTE m = bk_mask[idx];
                UBYTE *addr = TILE_ROW_ADDR(bt + bk_dtile[idx], bk_rownum[idx]);
                addr[0] |= m;
                addr[1] |= m;
            }
            bk_timer[s] = BLINK_MIN_OPEN + 60 + ((DIV_REG ^ (s << 5)) & 0x3F);
            bk_closed[s] = 0;
        }
    }
}

// --- Setup helpers (all BANKED via #pragma bank 255) ---

static UBYTE bk_setup_slot;
static UBYTE bk_setup_n;
static UBYTE bk_setup_dtile_left;
static UBYTE bk_setup_dtile_right;

static UBYTE bk_find(UBYTE actor_idx) {
    for (UBYTE i = 0; i < MAX_BLINKERS; i++) {
        if (bk_active[i] && bk_actor[i] == actor_idx) return i;
    }
    return MAX_BLINKERS;
}

static UBYTE bk_alloc(void) {
    for (UBYTE i = 0; i < MAX_BLINKERS; i++) {
        if (!bk_active[i]) return i;
    }
    return MAX_BLINKERS;
}

// Register one eye pixel. Writes directly to final arrays.
// Safe because bk_active[slot] is FALSE during setup — VBL handler skips it.
static void add_pixel(UBYTE px, UBYTE py, UBYTE blink_color) {
    // dtile from ROM metasprite: left/right column + top/bottom half offset
    UBYTE dtile = ((px < 8) ? bk_setup_dtile_left : bk_setup_dtile_right) + (py >> 3);
    UBYTE row = py & 7;
    UBYTE bit = 0x80 >> (px & 7);
    UBYTE base = bk_setup_slot << 1;

    // Find existing row entry or create new
    for (UBYTE i = 0; i < bk_setup_n; i++) {
        UBYTE idx = base + i;
        if (bk_dtile[idx] == dtile && bk_rownum[idx] == row) {
            bk_mask[idx] |= bit;
            if (blink_color & 0x01) bk_clo[idx] |= bit;
            if (blink_color & 0x02) bk_chi[idx] |= bit;
            return;
        }
    }

    if (bk_setup_n >= MAX_ROWS_PER) return;  // safety

    UBYTE idx = base + bk_setup_n;
    bk_dtile[idx] = dtile;
    bk_rownum[idx] = row;
    bk_mask[idx] = bit;
    bk_clo[idx] = (blink_color & 0x01) ? bit : 0;
    bk_chi[idx] = (blink_color & 0x02) ? bit : 0;
    bk_setup_n++;
}

// shape: 0=1x1, 1=2x1 horizontal, 2=1x2 vertical, 3=2x2 L-shape
// Shape 3: left eye (mirror=0) = ## / _#, right eye (mirror=1) = ## / #_
static void add_eye(UBYTE x, UBYTE y, UBYTE shape, UBYTE color, UBYTE mirror) {
    add_pixel(x, y, color);
    if (shape == 1 && x < 15) {
        add_pixel(x + 1, y, color);
    } else if (shape == 2 && y < 15) {
        add_pixel(x, y + 1, color);
    } else if (shape == 3) {
        if (x < 15) add_pixel(x + 1, y, color);
        if (y < 15) {
            if (mirror) add_pixel(x, y + 1, color);
            else        add_pixel(x + 1, y + 1, color);
        }
    }
}

void vm_blink_setup(SCRIPT_CTX * THIS) OLDCALL BANKED {
    UBYTE actor_idx = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    UBYTE lx     = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1) - 1;
    UBYTE ly     = *(UBYTE *)VM_REF_TO_PTR(FN_ARG2) - 1;
    UBYTE rx_raw = *(UBYTE *)VM_REF_TO_PTR(FN_ARG3);
    UBYTE rx     = (rx_raw == 255) ? 255 : (rx_raw - 1);
    UBYTE ry     = (rx_raw == 255) ? 0   : (*(UBYTE *)VM_REF_TO_PTR(FN_ARG4) - 1);
    UBYTE color  = *(UBYTE *)VM_REF_TO_PTR(FN_ARG5);
    UBYTE shape  = *(UBYTE *)VM_REF_TO_PTR(FN_ARG6);

    UBYTE slot = bk_find(actor_idx);
    if (slot >= MAX_BLINKERS) slot = bk_alloc();
    if (slot >= MAX_BLINKERS) return;

    // Deactivate slot during setup so VBL handler skips it
    bk_active[slot] = 0;

    bk_actor[slot] = actor_idx;
    bk_spr_bank[slot] = actors[actor_idx].sprite.bank;
    bk_setup_slot = slot;
    bk_setup_n = 0;

    // dtiles passed from event: high nibble = left column, low nibble = right column
    UBYTE dtiles = *(UBYTE *)VM_REF_TO_PTR(FN_ARG7);
    bk_setup_dtile_left  = dtiles >> 4;
    bk_setup_dtile_right = dtiles & 0x0F;

    // Clear arrays for this slot
    UBYTE base = slot << 1;
    for (UBYTE i = 0; i < MAX_ROWS_PER; i++) {
        bk_mask[base + i] = 0;
        bk_clo[base + i] = 0;
        bk_chi[base + i] = 0;
    }

    add_eye(lx, ly, shape, color, 0);
    if (rx != 255) {
        add_eye(rx, ry, shape, color, 1);
    }

    bk_n_rows[slot] = bk_setup_n;
    bk_closed[slot] = 0;
    bk_timer[slot] = BLINK_MIN_OPEN + 60 + (DIV_REG & 0x3F);
    bk_active[slot] = 1;
    bk_enabled = 1;
}

void vm_blink_start(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;
    for (UBYTE i = 0; i < MAX_BLINKERS; i++) {
        if (bk_actor[i]) bk_active[i] = 1;
    }
    bk_enabled = 1;
}

void vm_blink_stop(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;
    // Deactivate all — VBL handler will skip them
    for (UBYTE s = 0; s < MAX_BLINKERS; s++) {
        bk_active[s] = 0;
    }
    bk_enabled = 0;
    // Restore open eyes for any that were closed
    for (UBYTE s = 0; s < MAX_BLINKERS; s++) {
        if (bk_closed[s]) {
            actor_t *actor = &actors[bk_actor[s]];
            UBYTE base = s << 1;
            UBYTE bt = actor->base_tile;
            for (UBYTE i = 0; i < bk_n_rows[s]; i++) {
                UBYTE idx = base + i;
                UBYTE m = bk_mask[idx];
                UBYTE *addr = TILE_ROW_ADDR(bt + bk_dtile[idx], bk_rownum[idx]);
                // Set eye pixels to color 3 (black) = open eyes
                // Must wait for VRAM access since we're outside VBlank
                __critical {
                    while (LY_REG < 144);
                    addr[0] |= m;
                    addr[1] |= m;
                }
            }
            bk_closed[s] = 0;
        }
    }
}
