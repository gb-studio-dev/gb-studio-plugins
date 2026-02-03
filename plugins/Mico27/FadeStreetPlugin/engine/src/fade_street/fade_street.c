/*
   Zero-Clause BSD
   ===============

   Permission to use, copy, modify, and/or distribute this software for
   any purpose with or without fee is hereby granted.

   THE SOFTWARE IS PROVIDED “AS IS” AND THE AUTHOR DISCLAIMS ALL
   WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
   OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE
   FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY
   DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN
   AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT
   OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

#pragma bank 255

#include <gbdk/platform.h>
#include <stdint.h>

#include "palette.h"
#include "vm.h"
#include "fade_street.h"

void set_single_sprite_colour(SCRIPT_CTX *THIS) OLDCALL BANKED
{
	uint8_t pal = *((uint8_t *)VM_REF_TO_PTR(FN_ARG0));
	uint8_t index = *((uint8_t *)VM_REF_TO_PTR(FN_ARG1));
	palette_color_t rgb = *((palette_color_t *) VM_REF_TO_PTR(FN_ARG2));
	// update palette right now:
	set_sprite_palette_entry(pal, index, rgb);
	// also update the buffer, so our colour isn't overwritten later:
	((palette_color_t *) SprPalette)[pal * 4 + index] = rgb;
	return;
}

void set_single_bkg_colour(SCRIPT_CTX *THIS) OLDCALL BANKED
{
	uint8_t pal = *((uint8_t *)VM_REF_TO_PTR(FN_ARG0));
	uint8_t index = *((uint8_t *)VM_REF_TO_PTR(FN_ARG1));
	palette_color_t rgb = *((palette_color_t *) VM_REF_TO_PTR(FN_ARG2));
	// update palette right now:
	set_bkg_palette_entry(pal, index, rgb); 
	// also update the buffer, so our colour isn't overwritten later:
	((palette_color_t *) BkgPalette)[pal * 4 + index] = rgb;
	return;
}

void set_all_palettes(SCRIPT_CTX *THIS) OLDCALL BANKED
{
	palette_color_t c = *((palette_color_t *)VM_REF_TO_PTR(FN_ARG0));
	palette_color_t *dest = (palette_color_t *) SprPalette;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	dest = (palette_color_t *) BkgPalette;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	*dest++ = c;
	refresh_bkg_palettes = true;
	refresh_obj_palettes = true;
		
}

