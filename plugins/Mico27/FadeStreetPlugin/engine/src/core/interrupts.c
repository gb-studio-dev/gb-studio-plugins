/*
   This is an empty file to mask the default engine file from GB Studio.
   
   The contents of interrupts.c have been moved to fade_street_interrupts.c

   For plugin developers:

   Fade Street only modifies VBL_isr; the rest of the functions from
   interrupts.c are unchanged.

   For Fade Street to be compatible with another engine plugin that
   modified interrupts.c, four things are required:

   1. Make sure the plugins don't write over the same files.
   	- Rename your version of interrupts.c
	- Keep an empty interrupts.c to mask the default version.
	- You can use an extern declaration to suppress warnings.
	- Doing this ensures that both of our changes can be compiled.

   2. Stop my plugin from doubling up on your work.
        - #define GF_FADE_STREET_INTERRUPTS_COMPATIBILITY in your engine.json
	- _Without_ this definition, Fade Street supplies the entire contents
	  of interrupts.c
	- _With_ this definition, Fade Street will _only_ supply a definition for
	  VBL_isr, and your plugin can provide everything else.
	- Use cType define in engine.json to #define a constant in
	  "data/states_defines.h"
		{
			"group": "Your group",
			"label": "Fade Street Compatibility",
			"type": "select",
			"options": [
				["true",  "True"]
			],
			"key": "GF_FADE_STREET_INTERRUPTS_COMPATIBILITY",
			"cType": "define",
			"defalultValue": "true"
		},

   3. Stop your plugin from doubling up on my work.
   	- Fade Street #defines the constant GF_FADE_STREET_INSTALLED in the
	  header data/states_defines.h
	- You can check for this constant to determine if Fade Street is
	  present in the same project as your plugin.
	- Don't provide a definition for VBL_isr if Fade Street is present.
	- You can use #ifndef to conditionally compile your version of VBL_isr:

		#include "data/states_defines.h"

		#ifndef GF_FADE_STREET_INSTALLED
		void VBL_isr(void) NONBANKED {
			if ((WY_REG = win_pos_y) < MENU_CLOSED_Y) WX_REG = (win_pos_x + DEVICE_WINDOW_PX_OFFSET_X), SHOW_WIN; else WX_REG = 0, HIDE_WIN;
			if (hide_sprites) HIDE_SPRITES; else SHOW_SPRITES;
			scroll_shadow_update();
		}
		#endif

   4. Hope there is enough space in bank 0 for both plugins
*/
 
extern char suppress_warning; // suppress warning about empty translation unit

