#pragma bank 255

#include <gbdk/platform.h>

#include "data/states_defines.h"

#include "data_manager.h"

#include "math.h"
#include "scroll.h"
#include "gbs_types.h"
#include "vm.h"
#include "game_time.h"

#include "ui.h"

#include "gradient.h"

#define GRADIENT_FX_START    0u
#define GRADIENT_FX_END    143u
#define GRADIENT_FX_STEP     5  

UWORD gradient_colors[GRADIENT_MAX_STEPS];

UBYTE gradient_step_counter = 0;

void gradient_LCD_isr(void) NONBANKED {
    while (STAT_REG & STATF_BUSY);

#if GRADIENT_FX_START == 0
    // Added this if to supress the compiler warning when fx start is 0
    if (LYC_REG < GRADIENT_FX_END) {
#else
    if (LYC_REG >= GRADIENT_FX_START && LYC_REG < GRADIENT_FX_END) {
#endif

        uint16_t color = gradient_colors[gradient_step_counter];

#ifdef REPLACE_PALETTE_0
        BCPS_REG = (0 << 3) | 0x80; 
        BCPD_REG = color & 0xFF;
        BCPD_REG = color >> 8;
#endif

#ifdef REPLACE_PALETTE_1
        BCPS_REG = (1 << 3) | 0x80; 
        BCPD_REG = color & 0xFF;
        BCPD_REG = color >> 8;
#endif

#ifdef REPLACE_PALETTE_2
        BCPS_REG = (2 << 3) | 0x80;
        BCPD_REG = color & 0xFF;
        BCPD_REG = color >> 8;
#endif

#ifdef REPLACE_PALETTE_3
        BCPS_REG = (3 << 3) | 0x80;
        BCPD_REG = color & 0xFF;
        BCPD_REG = color >> 8;
#endif

#ifdef REPLACE_PALETTE_4
        BCPS_REG = (4 << 3) | 0x80;
        BCPD_REG = color & 0xFF;
        BCPD_REG = color >> 8;
#endif

#ifdef REPLACE_PALETTE_5
        BCPS_REG = (5 << 3) | 0x80;
        BCPD_REG = color & 0xFF;
        BCPD_REG = color >> 8;
#endif

#ifdef REPLACE_PALETTE_6
        BCPS_REG = (6 << 3) | 0x80;
        BCPD_REG = color & 0xFF;
        BCPD_REG = color >> 8;
#endif

#ifdef REPLACE_PALETTE_7
        BCPS_REG = (7 << 3) | 0x80;
        BCPD_REG = color & 0xFF;
        BCPD_REG = color >> 8;
#endif

        gradient_step_counter++;
    }

    LYC_REG += GRADIENT_FX_STEP;
    if (LYC_REG >= GRADIENT_FX_END) {
        LYC_REG = GRADIENT_FX_START;
        gradient_step_counter = 0; 
    }
}
