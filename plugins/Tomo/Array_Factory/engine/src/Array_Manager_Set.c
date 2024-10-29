/*
 * Author: Tomo (@indiegdevstdio)
 * A variable bit divider which divides multiple global variables with specified bits, which can be accessed like an array
 * This function will assign a specified value into the specified index of the virtual array created
 */
#pragma bank 255

#include <gbdk/platform.h>
#include "vm.h"

void ArrayManagerSet(SCRIPT_CTX * THIS) OLDCALL BANKED {
	UBYTE variableCount = *(uint8_t*)VM_REF_TO_PTR(FN_ARG0);
	UBYTE divideBitAmount = *(uint8_t*)VM_REF_TO_PTR(FN_ARG1);
	UBYTE varIndex = *(uint8_t*)VM_REF_TO_PTR(FN_ARG2);
	int16_t valueToSet = *(int16_t*)VM_REF_TO_PTR(FN_ARG3);
	
	UBYTE divisor = 16 / divideBitAmount;
	// Get the pointer to the global vars we will be manipulating on
	// (note that it's pushed in reversed order so we can just increment the stack pointer index)
	BYTE varStackIndex = FN_ARG4 - varIndex / divisor;
	int16_t* pGlobalVar = VM_REF_TO_PTR(*(int16_t*)VM_REF_TO_PTR(varStackIndex));

	// Create mask to clear out the destination bits
	// Which is same as doing:
	/*switch(divideBitAmount) {
		case 1: valMask = 0x8000; break; //0b0000000000000001
		case 2: valMask = 0xc000; break; //0b0000000000000011
		case 4: valMask = 0xf000; break; //0b0000000000001111
		case 8: valMask = 0xff00; break; //0b0000000011111111
		case 16: valMask = 0xffff; break; //0b1111111111111111
	}*/
	UBYTE shiftOffset = 16 - divideBitAmount;
	uint16_t valMask = 0xffff >> shiftOffset;

	// Pad unwanted bits with 0
	valueToSet &= valMask;
	uint16_t result = *pGlobalVar;
	// Use the shift offset now for bit shifting according to the destination array index in blocks of divideBitAmount (left to right)
	// (FYI: varIndex % divisor = The bit index which determines which bit block (left to right) to manipulate on)
	shiftOffset -= (varIndex % divisor) * divideBitAmount;
	// Bit shift mask to the destination bit to clear
	valMask <<= shiftOffset;
	// Clear the destination bits with 0
	result &= ~valMask;
	// Replace the destination bits with the specified value
	valueToSet <<= shiftOffset;
	// Merge it with the current value set for other bits (if any)
	result |= valueToSet;
	*pGlobalVar = result;
}
