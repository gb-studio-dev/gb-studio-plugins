/*
 * Author: Tomo (@indiegdevstdio)
 * A variable bit divider which divides multiple global variables with specified bits, which can be accessed like an array
 * This function will assign a value obtained from the index of the virtual array into a reference variable
 */
#pragma bank 255

#include <gbdk/platform.h>
#include "vm.h"

void ArrayManagerGet(SCRIPT_CTX * THIS) OLDCALL BANKED { 
	// Variable index is passed (in ARG0) for result storage, so now we can assign the results back to this variable
	int16_t* results = VM_REF_TO_PTR(*(int16_t*)VM_REF_TO_PTR(FN_ARG0));
	UBYTE variableCount = *(uint8_t*)VM_REF_TO_PTR(FN_ARG1);
	UBYTE divideBitAmount = *(uint8_t*)VM_REF_TO_PTR(FN_ARG2);
	UBYTE varIndex = *(uint8_t*)VM_REF_TO_PTR(FN_ARG3);
	UBYTE divisor = 16 / divideBitAmount;

	// Get the pointer to the global vars we will be manipulating on
	// (note that it's pushed in reversed order so we can just increment the stack pointer index)
	BYTE varStackIndex = FN_ARG4 - varIndex / divisor;
	int16_t* pGlobalVar = VM_REF_TO_PTR(*(int16_t *)VM_REF_TO_PTR(varStackIndex));
	// Get the target value by shifting around and padding unwanted bits with 0
	uint16_t varValue = *pGlobalVar;
	// Bit shift left and remove the unwanted preceding bits
	varValue <<= (varIndex % divisor) * divideBitAmount;
	// Bit shift right to pad the preceding bits with 0, leaving only the value that we need to obtain
	varValue >>= (16 - divideBitAmount);
	// Set the new value to the specified variable
	switch(divideBitAmount) {
		case 2: *results = (uint8_t)varValue; break; // UNSIGNED 2 BIT: 0 to 3
		case 4: *results = (uint8_t)varValue; break; // UNSIGNED 4 BIT: 0 to 15
		case 8: *results = (int8_t)varValue; break; // SIGNED 8 BIT: -128 to 127
		default: *results = (int16_t)varValue; break; // SIGNED 16 BIT: -32,768 to 32,767
	}
}
