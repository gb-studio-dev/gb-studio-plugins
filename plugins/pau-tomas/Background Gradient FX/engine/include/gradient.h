#ifndef GRADIENT_H
#define GRADIENT_H

#pragma bank 255

#include "gbs_types.h"
#include "vm.h"

#define GRADIENT_MAX_STEPS 32           
extern UWORD gradient_colors[GRADIENT_MAX_STEPS];

void gradient_LCD_isr(void) NONBANKED;

#endif
