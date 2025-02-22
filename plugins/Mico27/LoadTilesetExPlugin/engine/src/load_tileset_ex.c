#pragma bank 255

#include <gbdk/platform.h>
#include "system.h"
#include "vm.h"
#include "bankdata.h"
#include "gbs_types.h"


void load_tileset_ex(SCRIPT_CTX * THIS) OLDCALL BANKED {
	uint8_t idx_target_tile = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
	uint8_t tileset_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG1);
	const tileset_t * tileset = *(tileset_t **) VM_REF_TO_PTR(FN_ARG2);
	uint8_t idx_start_tile = *(uint8_t *)VM_REF_TO_PTR(FN_ARG3);
	uint8_t length = *(uint8_t *)VM_REF_TO_PTR(FN_ARG4);
	SetBankedBkgData(idx_target_tile, length, tileset->tiles + (idx_start_tile << 4), tileset_bank);
}
