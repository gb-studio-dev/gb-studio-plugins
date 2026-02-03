#pragma bank 255

#include <gbdk/platform.h>
#include "system.h"
#include "vm.h"
#include "gbs_types.h"
#include "bankdata.h"

void replace_tiles_ex(SCRIPT_CTX * THIS) OLDCALL BANKED {
	uint8_t tile_length = *(uint8_t*)VM_REF_TO_PTR(FN_ARG0);
	int16_t idx_start_tile = *(int16_t*)VM_REF_TO_PTR(FN_ARG1);
	int16_t idx_target_tile = *(int16_t*)VM_REF_TO_PTR(FN_ARG2);
	uint8_t tileset_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG3);
	const tileset_t * tileset = *(tileset_t **) VM_REF_TO_PTR(FN_ARG4);
#ifdef CGB
    if (_is_CGB) VBK_REG =  (idx_target_tile & 0x0800) ? 1 : 0;
#endif
    SetBankedBkgData((UBYTE)(idx_target_tile), tile_length, tileset->tiles + (idx_start_tile << 4), tileset_bank);
#ifdef CGB
    VBK_REG = 0;
#endif
	
}