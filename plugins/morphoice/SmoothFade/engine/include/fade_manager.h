#ifndef FADE_MANAGER_H
#define FADE_MANAGER_H

#include <gbdk/platform.h>

#define FADE_SPEED_MASK 0x3F
#define FADE_IN_FLAG 0x40
#define FADE_ENABLED_FLAG 0x80

typedef enum { FADE_IN, FADE_OUT } FADE_DIRECTION;

extern UBYTE fade_running;
extern UBYTE fade_frames_per_step;
extern UBYTE fade_timer;
extern UBYTE fade_style;

// Custom fade target (CGB 5-bit per channel, 0-31)
extern UBYTE fade_target_r;
extern UBYTE fade_target_g;
extern UBYTE fade_target_b;

#define BCPS_REG_ADDR 0x68
#define OCPS_REG_ADDR 0x6A

void fade_init(void) BANKED;
void fade_in(void) BANKED;
void fade_out(void) BANKED;
void fade_update(void) BANKED;
void fade_applypalettechange(void) BANKED;
void fade_setspeed(UBYTE speed) BANKED;

inline UBYTE fade_isfading(void) {
  return fade_running;
}

void fade_in_modal(void) BANKED;
void fade_out_modal(void) BANKED;

#endif
