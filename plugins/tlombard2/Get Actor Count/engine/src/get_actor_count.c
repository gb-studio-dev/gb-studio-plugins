#pragma bank 255

#include "get_actor_count.h"

void vm_get_actor_count(SCRIPT_CTX *THIS) OLDCALL BANKED {
    *(UINT16 *)VM_REF_TO_PTR(FN_ARG0) = actors_len;
}