#include <gbdk/platform.h>
#include "vm.h"

extern UINT16 image_width;
extern UINT16 image_height;

void vm_get_bkg_width (SCRIPT_CTX *THIS) OLDCALL BANKED;
void vm_get_bkg_height (SCRIPT_CTX *THIS) OLDCALL BANKED;