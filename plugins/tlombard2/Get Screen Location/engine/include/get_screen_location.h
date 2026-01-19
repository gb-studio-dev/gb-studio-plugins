#include <gbdk/platform.h>
#include "vm.h"
#include "math.h"

extern INT16 draw_scroll_x;
extern INT16 draw_scroll_y;

void vm_get_screen_location (SCRIPT_CTX *THIS) OLDCALL BANKED;