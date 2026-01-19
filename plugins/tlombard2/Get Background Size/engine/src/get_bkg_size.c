#pragma bank 255

#include "get_bkg_size.h"

void vm_get_bkg_width(SCRIPT_CTX *THIS) OLDCALL BANKED {
    *(UINT16 *)VM_REF_TO_PTR(FN_ARG0) = image_width;
}

void vm_get_bkg_height(SCRIPT_CTX *THIS) OLDCALL BANKED {
    *(UINT16 *)VM_REF_TO_PTR(FN_ARG0) = image_height;
}