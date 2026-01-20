#pragma bank 255

#include <gbdk/platform.h>

#include "system.h"
#include "gbs_types.h"
#include "vm_palette.h"

#include "vm.h"
#include "bankdata.h"
#include "data/states_defines.h"
#include "fade_street.h"

BANKREF(VM_PALETTE)

void vm_load_palette(SCRIPT_CTX * THIS, UBYTE mask, UBYTE options) OLDCALL BANKED {
    UBYTE bank = THIS->bank;
    #ifdef SGB
        UBYTE sgb_changes = SGB_PALETTES_NONE;
    #endif
    UBYTE is_bkg = (options & PALETTE_BKG);
    const palette_entry_t * sour = (const palette_entry_t *)THIS->PC;
    palette_entry_t * dest = (is_bkg) ? BkgPalette : SprPalette;
    for (UBYTE i = mask, nb = 0; (i != 0); dest++, nb++, i >>= 1) {
        if ((i & 1) == 0) {
		continue;
	}
        if ((_is_CGB) || (nb > 1)) {
            MemcpyBanked(dest, sour, sizeof(palette_entry_t), bank);
        } else {
            UBYTE DMGPal;
            switch (nb) {
                case 0:
                    DMGPal = ReadBankedUBYTE((void *)sour, bank);
                    if (is_bkg) {
                        DMG_palette[0] = DMGPal;
                    } else {
                        DMG_palette[1] = DMGPal;
                    }
                    break;
                case 1:
                    if (!is_bkg) {
                        DMGPal = ReadBankedUBYTE((void *)sour, bank);
                        DMG_palette[2] = DMGPal;
                    }
                    break;
            }
        }
        #ifdef SGB
            //if (is_commit) {
                    if (is_bkg) {
                        if ((nb == 4) || (nb == 5)) sgb_changes |= SGB_PALETTES_01;
                        if ((nb == 6) || (nb == 7)) sgb_changes |= SGB_PALETTES_23;
                    }
            //}
        #endif
        sour++;
    }
    if (is_bkg) {
	    refresh_bkg_palettes = true;
    } else {
	    refresh_obj_palettes = true;
    }
    #ifdef SGB
        if ((sgb_changes) && (_is_SGB)) SGBTransferPalettes(sgb_changes);
    #endif
    THIS->PC = (UBYTE *)sour;
}

