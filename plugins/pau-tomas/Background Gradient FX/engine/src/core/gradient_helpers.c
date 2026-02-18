#pragma bank 255

#include "data_manager.h"
#include "gbs_types.h"
#include "interrupts.h"
#include "gradient.h"

/**
    VM_PUSH_CONST start_color
    VM_PUSH_CONST end_color
    VM_CALL_NATIVE b_build_gradient, _build_gradient
 */
void build_gradient(SCRIPT_CTX * THIS) OLDCALL BANKED {
    uint16_t start_color = *(uint16_t *)VM_REF_TO_PTR(FN_ARG1);
    uint16_t end_color = *(uint16_t *)VM_REF_TO_PTR(FN_ARG0);

    uint8_t r0 = start_color & 0x1F;
    uint8_t g0 = (start_color >> 5) & 0x1F;
    uint8_t b0 = (start_color >> 10) & 0x1F;

    uint8_t r1 = end_color & 0x1F;
    uint8_t g1 = (end_color >> 5) & 0x1F;
    uint8_t b1 = (end_color >> 10) & 0x1F;

    for (uint8_t step = 0; step < GRADIENT_MAX_STEPS; step++) {
        uint8_t r = r0 + ((r1 - r0) * step) / (GRADIENT_MAX_STEPS - 1);
        uint8_t g = g0 + ((g1 - g0) * step) / (GRADIENT_MAX_STEPS - 1);
        uint8_t b = b0 + ((b1 - b0) * step) / (GRADIENT_MAX_STEPS - 1);

        gradient_colors[step] = (b << 10) | (g << 5) | r;
    }
}

// VM_CALL_NATIVE b_enable_gradient_fx, _enable_gradient_fx
void enable_gradient_fx(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;

    disable_interrupts();
    CRITICAL {
        remove_LCD(parallax_LCD_isr);
        remove_LCD(fullscreen_LCD_isr);

        remove_LCD(gradient_LCD_isr);
        add_LCD(gradient_LCD_isr);
    }
    LYC_REG = 0u;
    enable_interrupts();
}

// // VM_CALL_NATIVE b_disable_gradient_fx, _disable_gradient_fx
void disable_gradient_fx(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS;
    
    disable_interrupts();

    // restore GBS LCD interrupts
    CRITICAL {
        remove_LCD(gradient_LCD_isr);

        switch (scene_LCD_type) {
            case LCD_parallax: 
                add_LCD(parallax_LCD_isr);
                break;
            case LCD_fullscreen:
                add_LCD(fullscreen_LCD_isr);
                break;
            default:
                add_LCD(simple_LCD_isr);
                break;
        }
    }

    LYC_REG = 0u;

    enable_interrupts();
}