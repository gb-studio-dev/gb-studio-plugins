/*
 * Author: Tomo (@indiegdevstdio)
 * Replaces a sprite tile with a tile in the tileset
 */
#pragma bank 255

#include <gbdk/platform.h>
#include "vm.h"
#include "actor.h"

void SpriteTileReplacer(SCRIPT_CTX * THIS, UBYTE actor_id, UBYTE target_tile, UBYTE tileset_bank, const tileset_t * tileset, UBYTE start_tile, UBYTE vram_bank) BANKED {
	vm_set_const(THIS, FN_ARG0, actor_id);
	UBYTE * n_actor = VM_REF_TO_PTR(FN_ARG0);
	actor_t * actor = actors + *n_actor;
	VBK_REG = vram_bank;
	SetBankedSpriteData(actor->base_tile + target_tile, 1, tileset->tiles + (start_tile << 4), tileset_bank);
	VBK_REG = 0;
}

void SetupSpriteTileReplacer(SCRIPT_CTX * THIS) OLDCALL BANKED {
	tileset_t* tileset = *(tileset_t**)VM_REF_TO_PTR(FN_ARG0);
	uint8_t tileset_bank = *(uint8_t*)VM_REF_TO_PTR(FN_ARG1);
	UBYTE target_tile_idx = *(uint8_t*)VM_REF_TO_PTR(FN_ARG2);
	UBYTE source_tile_idx = *(uint8_t*)VM_REF_TO_PTR(FN_ARG3);
	UBYTE vram_bank = *(uint8_t*)VM_REF_TO_PTR(FN_ARG4);
	UBYTE actor_id = *(uint8_t*)VM_REF_TO_PTR(FN_ARG5);
	SpriteTileReplacer(THIS, actor_id, target_tile_idx, tileset_bank, tileset, source_tile_idx, vram_bank);
}
