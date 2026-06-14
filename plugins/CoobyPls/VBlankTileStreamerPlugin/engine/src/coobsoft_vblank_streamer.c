#pragma bank 255

#include <gbdk/platform.h>

#include "actor.h"
#include "data_manager.h"
#include "macro.h"
#include "system.h"
#include "vm.h"
#include "coobsoft_vblank_streamer.h"

extern UBYTE actors_len;
extern UBYTE allocated_sprite_tiles;

#define VSTREAM_DEFAULT_TILES_PER_FRAME 4u
#define VSTREAM_NORMAL_TILES_PER_FRAME_MAX 8u
#define VSTREAM_RISKY_TILES_PER_FRAME_MAX 12u
#define VSTREAM_NORMAL_TILE_MAX 48u
#define VSTREAM_RISKY_TILE_MAX 48u
#define VSTREAM_ABSOLUTE_TILE_MAX 48u
#define VSTREAM_OBJ_TILE_BASE 96u
#define VSTREAM_OBJ_TILE_COUNT 48u
#define VSTREAM_OBJ_TILE_END 144u
#define VSTREAM_TEXT_SAFE_START 151u
#define VSTREAM_TEXT_SAFE_END 180u

#ifndef CHK_FLAG
#define CHK_FLAG(VAR, FLAG) (((VAR) & (FLAG)) != 0u)
#endif

typedef struct vstream_asset_t {
    const tileset_t *tileset;
    UBYTE tileset_bank;
    const tileset_t *cgb_tileset;
    UBYTE cgb_tileset_bank;
} vstream_asset_t;

/* Asset registry
 *
 * This standalone plugin cannot guess project-specific generated C symbol
 * names. To use it, include your generated sprite tileset headers above and
 * replace these empty slots with your project's tilesets.
 *
 * Example:
 *
 * #include "data/sprite_flash_tileset.h"
 * #include "data/sprite_flash_bank2_tileset.h"
 *
 * Slot 1:
 * { &sprite_flash_tileset, BANK(sprite_flash_tileset),
 *   &sprite_flash_bank2_tileset, BANK(sprite_flash_bank2_tileset) }
 */
static const vstream_asset_t vstream_assets[] = {
    { 0, 0u, 0, 0u },
    { 0, 0u, 0, 0u },
    { 0, 0u, 0, 0u },
    { 0, 0u, 0, 0u },
    { 0, 0u, 0, 0u },
    { 0, 0u, 0, 0u },
    { 0, 0u, 0, 0u },
    { 0, 0u, 0, 0u },
};

static UBYTE vstream_asset_slot = 0u;
static UBYTE vstream_actor_id = 0u;
static UBYTE vstream_tiles_per_frame = VSTREAM_DEFAULT_TILES_PER_FRAME;
static UBYTE vstream_requested_tiles = 0u;
static UBYTE vstream_reserved_tiles = 0u;
static UBYTE vstream_allow_experimental = FALSE;
static UBYTE vstream_hide_actor = TRUE;
static UBYTE vstream_status = VSTREAM_STATUS_IDLE;
static UBYTE vstream_tiles_done = 0u;
static UBYTE vstream_total_tiles = 0u;
static UBYTE vstream_tile_map_reserved = FALSE;
static UWORD *vstream_status_out = 0;

static const vstream_asset_t *vstream_current_asset(void) {
    if (vstream_asset_slot >= (sizeof(vstream_assets) / sizeof(vstream_assets[0]))) return 0;
    return &vstream_assets[vstream_asset_slot];
}

static void vstream_write_status(UBYTE status) {
    vstream_status = status;
    if (vstream_status_out) *vstream_status_out = status;
}

static actor_t *vstream_actor(void) {
    if (vstream_actor_id >= actors_len) return 0;
    return &actors[vstream_actor_id];
}

static void vstream_hide_runtime_actor(actor_t *actor) {
    (void)actor;
    (void)vstream_hide_actor;
}

static void vstream_snap_flash_to_player(actor_t *actor) {
    if (actor && vstream_asset_slot == 1u) {
        actor->pos.x = PLAYER.pos.x;
        actor->pos.y = PLAYER.pos.y;
    }
}

static direction_e vstream_dir_to_tile(actor_t *actor, UBYTE target_tile_x, UBYTE target_tile_y) {
    UWORD target_x = ((UWORD)target_tile_x) << 8;
    UWORD target_y = ((UWORD)target_tile_y) << 8;
    UWORD dx;
    UWORD dy;

    if (!actor) return DIR_DOWN;

    dx = actor->pos.x > target_x ? actor->pos.x - target_x : target_x - actor->pos.x;
    dy = actor->pos.y > target_y ? actor->pos.y - target_y : target_y - actor->pos.y;

    if (dx >= dy) return actor->pos.x > target_x ? DIR_LEFT : DIR_RIGHT;
    return actor->pos.y > target_y ? DIR_UP : DIR_DOWN;
}

static void vstream_reserve_obj_tile_map(void) {
    /* Fixed OBJ tile map for streamed effects: 96-143.
     * GB Studio's dialogue/UI tile data lives higher up in VRAM, so the stream
     * block stays below it and the sprite allocator is moved past the block.
     */
    if (allocated_sprite_tiles < VSTREAM_OBJ_TILE_END) {
        allocated_sprite_tiles = VSTREAM_OBJ_TILE_END;
    }
    vstream_tile_map_reserved = TRUE;
}

static UBYTE vstream_ensure_actor_tile_window(actor_t *actor, UBYTE requested_tiles) {
    if (!actor || !requested_tiles) return 0u;
    if (requested_tiles > VSTREAM_OBJ_TILE_COUNT) return 0u;
    if (VSTREAM_OBJ_TILE_BASE < VSTREAM_TEXT_SAFE_END && VSTREAM_OBJ_TILE_END > VSTREAM_TEXT_SAFE_START) return 0u;
    actor->base_tile = VSTREAM_OBJ_TILE_BASE;
    actor->reserve_tiles = VSTREAM_OBJ_TILE_COUNT;
    vstream_reserve_obj_tile_map();
    load_sprite(actor->base_tile, actor->sprite.ptr, actor->sprite.bank);
    return actor->reserve_tiles;
}

static UBYTE vstream_clamp_tiles_per_frame(UBYTE tiles_per_frame) {
    UBYTE cap = vstream_allow_experimental ? VSTREAM_RISKY_TILES_PER_FRAME_MAX : VSTREAM_NORMAL_TILES_PER_FRAME_MAX;

    if (!tiles_per_frame) tiles_per_frame = VSTREAM_DEFAULT_TILES_PER_FRAME;
    if (tiles_per_frame > cap) tiles_per_frame = cap;
    return tiles_per_frame;
}

static UBYTE vstream_clamp_tile_count(UBYTE tile_count) {
    UBYTE cap = vstream_allow_experimental ? VSTREAM_RISKY_TILE_MAX : VSTREAM_NORMAL_TILE_MAX;

    if (tile_count > VSTREAM_ABSOLUTE_TILE_MAX) tile_count = VSTREAM_ABSOLUTE_TILE_MAX;
    if (tile_count > cap) tile_count = cap;
    return tile_count;
}

void vstream_configure(SCRIPT_CTX *THIS) OLDCALL BANKED {
    (void)THIS;

    vstream_asset_slot = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    vstream_tiles_per_frame = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    vstream_requested_tiles = *(UBYTE *)VM_REF_TO_PTR(FN_ARG2);
    vstream_reserved_tiles = *(UBYTE *)VM_REF_TO_PTR(FN_ARG3);
    vstream_allow_experimental = *(UBYTE *)VM_REF_TO_PTR(FN_ARG4);
    vstream_hide_actor = *(UBYTE *)VM_REF_TO_PTR(FN_ARG5);
    vstream_status_out = (UWORD *)VM_REF_TO_PTR(FN_ARG6);

    vstream_tiles_per_frame = vstream_clamp_tiles_per_frame(vstream_tiles_per_frame);
    vstream_requested_tiles = vstream_clamp_tile_count(vstream_requested_tiles);
    vstream_reserved_tiles = vstream_clamp_tile_count(vstream_reserved_tiles);

    if (vstream_allow_experimental ||
        vstream_tiles_per_frame > VSTREAM_NORMAL_TILES_PER_FRAME_MAX ||
        vstream_requested_tiles > VSTREAM_NORMAL_TILE_MAX) {
        vstream_write_status(VSTREAM_STATUS_EXPERIMENTAL);
    } else {
        vstream_write_status(VSTREAM_STATUS_IDLE);
    }
}

void vstream_start(SCRIPT_CTX *THIS) OLDCALL BANKED {
    actor_t *actor;
    const vstream_asset_t *asset;
    UBYTE source_tiles;
    UBYTE tile_count;

    (void)THIS;

    vstream_actor_id = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    actor = vstream_actor();
    if (!actor) {
        vstream_write_status(VSTREAM_STATUS_BAD_ACTOR);
        return;
    }

    if (vstream_status == VSTREAM_STATUS_BUSY) {
        vstream_write_status(VSTREAM_STATUS_BUSY_REJECTED);
        return;
    }

    asset = vstream_current_asset();
    if (!asset || !asset->tileset || !asset->tileset_bank) {
        vstream_write_status(VSTREAM_STATUS_BAD_ASSET_SLOT);
        return;
    }

    source_tiles = ReadBankedUBYTE(&(asset->tileset->n_tiles), asset->tileset_bank);
    tile_count = vstream_requested_tiles ? vstream_requested_tiles : vstream_reserved_tiles;
    if (!tile_count) tile_count = source_tiles;
    if (!tile_count || !source_tiles) {
        vstream_write_status(VSTREAM_STATUS_INVALID_CONFIG);
        return;
    }
    if (source_tiles > VSTREAM_OBJ_TILE_COUNT || tile_count > VSTREAM_OBJ_TILE_COUNT) {
        vstream_write_status(VSTREAM_STATUS_INVALID_CONFIG);
        return;
    }

    vstream_reserved_tiles = vstream_ensure_actor_tile_window(actor, tile_count);
    if (!vstream_reserved_tiles) {
        vstream_write_status(VSTREAM_STATUS_INVALID_CONFIG);
        return;
    }

    vstream_total_tiles = tile_count;
    if (vstream_total_tiles > source_tiles) vstream_total_tiles = source_tiles;
    if (vstream_total_tiles > vstream_reserved_tiles) vstream_total_tiles = vstream_reserved_tiles;
    if (vstream_total_tiles > VSTREAM_ABSOLUTE_TILE_MAX) vstream_total_tiles = VSTREAM_ABSOLUTE_TILE_MAX;

    vstream_hide_runtime_actor(actor);
    if (!CHK_FLAG(actor->flags, ACTOR_FLAG_ACTIVE)) {
        activate_actor(actor);
    }
    vstream_snap_flash_to_player(actor);
    vstream_tiles_done = 0u;

    if (vstream_total_tiles != tile_count) {
        vstream_write_status(VSTREAM_STATUS_CLAMPED);
    } else if (vstream_allow_experimental ||
               vstream_tiles_per_frame > VSTREAM_NORMAL_TILES_PER_FRAME_MAX ||
               vstream_total_tiles > VSTREAM_NORMAL_TILE_MAX) {
        vstream_write_status(VSTREAM_STATUS_EXPERIMENTAL);
    } else {
        vstream_write_status(VSTREAM_STATUS_BUSY);
    }

    vstream_status = VSTREAM_STATUS_BUSY;
}

void vstream_tick(void) BANKED {
    actor_t *actor;
    const vstream_asset_t *asset;
    UBYTE batch_tiles;
    UBYTE remaining_tiles;

    if (vstream_status != VSTREAM_STATUS_BUSY) return;

    actor = vstream_actor();
    asset = vstream_current_asset();
    if (!actor || !asset || !asset->tileset || !asset->tileset_bank) {
        vstream_write_status(VSTREAM_STATUS_FAILED);
        return;
    }

    remaining_tiles = vstream_total_tiles - vstream_tiles_done;
    batch_tiles = vstream_tiles_per_frame;
    if (!batch_tiles) batch_tiles = VSTREAM_DEFAULT_TILES_PER_FRAME;
    if (batch_tiles > remaining_tiles) batch_tiles = remaining_tiles;

    VBK_REG = 0u;
    SetBankedSpriteData(
        actor->base_tile + vstream_tiles_done,
        batch_tiles,
        asset->tileset->tiles + ((UWORD)vstream_tiles_done << 4),
        asset->tileset_bank
    );

#ifdef CGB
    if (_is_CGB && asset->cgb_tileset && asset->cgb_tileset_bank) {
        VBK_REG = 1u;
        SetBankedSpriteData(
            actor->base_tile + vstream_tiles_done,
            batch_tiles,
            asset->cgb_tileset->tiles + ((UWORD)vstream_tiles_done << 4),
            asset->cgb_tileset_bank
        );
    }
#endif
    VBK_REG = 0u;

    vstream_tiles_done += batch_tiles;
    if (vstream_tiles_done >= vstream_total_tiles) {
        actor_reset_anim(actor);
        actor->frame = actor->frame_start;
        vstream_snap_flash_to_player(actor);
        vstream_write_status(VSTREAM_STATUS_COMPLETE);
    }
}

void vstream_update(SCRIPT_CTX *THIS) OLDCALL BANKED {
    (void)THIS;
    vstream_tick();
}

void vstream_get_status(SCRIPT_CTX *THIS) OLDCALL BANKED {
    UWORD *status_out = (UWORD *)VM_REF_TO_PTR(FN_ARG0);

    (void)THIS;
    if (status_out) *status_out = vstream_status;
}

void vstream_face_actor_to_tile(SCRIPT_CTX *THIS) OLDCALL BANKED {
    UBYTE actor_id = *(UBYTE *)VM_REF_TO_PTR(FN_ARG0);
    UBYTE target_tile_x = *(UBYTE *)VM_REF_TO_PTR(FN_ARG1);
    UBYTE target_tile_y = *(UBYTE *)VM_REF_TO_PTR(FN_ARG2);
    actor_t *actor;

    (void)THIS;

    if (actor_id >= actors_len) return;
    actor = &actors[actor_id];

    if (actor_id == vstream_actor_id && vstream_asset_slot == 1u) {
        actor->pos.x = PLAYER.pos.x;
        actor->pos.y = PLAYER.pos.y;
    }

    actor_set_dir(actor, vstream_dir_to_tile(actor, target_tile_x, target_tile_y), TRUE);
    actor->frame = actor->frame_start;
}

void vstream_cancel(SCRIPT_CTX *THIS) OLDCALL BANKED {
    (void)THIS;

    vstream_tiles_done = 0u;
    vstream_total_tiles = 0u;
    vstream_write_status(VSTREAM_STATUS_IDLE);
}
