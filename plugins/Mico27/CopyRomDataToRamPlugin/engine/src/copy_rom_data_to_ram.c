#pragma bank 255

#include <gbdk/platform.h>
#include "system.h"
#include "vm.h"
#include "gbs_types.h"
#include "bankdata.h"

void copy_rom_data_to_ram(SCRIPT_CTX * THIS) OLDCALL BANKED {
	uint8_t rom_data_bank = *(uint8_t *) VM_REF_TO_PTR(FN_ARG0);
	uint8_t* rom_data_ptr = *(uint8_t**) VM_REF_TO_PTR(FN_ARG1);	
	uint16_t rom_data_offset = *(int16_t*)VM_REF_TO_PTR(FN_ARG2);	
	uint16_t*  ram_data_ptr = &script_memory[*(int16_t*)VM_REF_TO_PTR(FN_ARG3)];
	uint16_t ram_data_offset = *(int16_t*)VM_REF_TO_PTR(FN_ARG4);	
	size_t data_length = *(size_t*)VM_REF_TO_PTR(FN_ARG5);
    MemcpyBanked(ram_data_ptr + ram_data_offset, rom_data_ptr + rom_data_offset, data_length, rom_data_bank);
}
