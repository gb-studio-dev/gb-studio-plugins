#pragma bank 255

#include "scroll.h"

#include <string.h>

#include "system.h"
#include "actor.h"
#include "camera.h"
#include "data_manager.h"
#include "game_time.h"
#include "math.h"
#include "fade_manager.h"
#include "parallax.h"
#include "palette.h"
#include "meta_tiles.h"

// put submap of a large map to screen
void set_bkg_submap(UINT8 x, UINT8 y, UINT8 w, UINT8 h, const unsigned char *map, UINT8 map_w) OLDCALL;

INT16 scroll_x;
INT16 scroll_y;
INT16 draw_scroll_x;
INT16 draw_scroll_y;
UINT16 scroll_x_min;
UINT16 scroll_y_min;
UINT16 scroll_x_max;
UINT16 scroll_y_max;
BYTE scroll_offset_x;
BYTE scroll_offset_y;
UBYTE pending_h_x, pending_h_y;
UBYTE pending_h_i;
UBYTE pending_w_x, pending_w_y;
UBYTE pending_w_i;
UBYTE current_row, new_row;
UBYTE current_col, new_col;

UWORD bkg_address_offset;

static FASTUBYTE _save_bank;

void scroll_init(void) BANKED {
    draw_scroll_x   = 0;
    draw_scroll_y   = 0;
	scroll_x_min    = 0;
    scroll_y_min    = 0;
    scroll_x_max    = 0;
    scroll_y_max    = 0;
    scroll_offset_x = 0;
    scroll_offset_y = 0;
    scroll_reset();
}

void scroll_reset(void) BANKED {
    pending_w_i     = 0;
    pending_h_i     = 0;
    scroll_x = 0x400;
	scroll_y = 0x400;
	metatile_bank = 0;
	metatile_attr_bank = 0;
}

void scroll_update(void) BANKED {
    INT16 x, y;
    UBYTE render = FALSE;

    x = SUBPX_TO_PX(camera_x) - (SCREENWIDTH >> 1);
    y = SUBPX_TO_PX(camera_y) - (SCREENHEIGHT >> 1);

    if ((x & 0x8000u) || (x < scroll_x_min)) {  // check for negative signed bit
		x = scroll_x_min;
	} else if (x > scroll_x_max) {
		x = scroll_x_max;
	}
	if ((y & 0x8000u) || (y < scroll_y_min)) {
		y = scroll_y_min;
	} else if (y > scroll_y_max) {
		y = scroll_y_max;
	}
    
	
    current_col = PX_TO_TILE(scroll_x);
    current_row = PX_TO_TILE(scroll_y);
    new_col = PX_TO_TILE(x);
    new_row = PX_TO_TILE(y);

    scroll_x = x;
    scroll_y = y;
    draw_scroll_x = x + scroll_offset_x;
    draw_scroll_y = y + scroll_offset_y;
	
    if (scroll_viewport(parallax_rows)) return;
    if (scroll_viewport(parallax_rows + 1)) return;
    scroll_viewport(parallax_rows + 2);
}

UBYTE scroll_viewport(parallax_row_t * port) BANKED {
    if (port->next_y) {
        // one of upper parallax slices
        UINT16 shift_scroll_x;
        if (port->shift == 127) {
            shift_scroll_x = 0;
        } else if (port->shift < 0) {
            shift_scroll_x = draw_scroll_x << (-port->shift);
        } else {
            shift_scroll_x = draw_scroll_x >> port->shift;
        }

        port->shadow_scx = shift_scroll_x;        
        UBYTE shift_col = PX_TO_TILE(shift_scroll_x);

        // If column is +/- 1 just render next column
        if (current_col == (UBYTE)(new_col - 1)) {
            // Render right column
            UBYTE x = shift_col - SCREEN_PAD_LEFT + SCREEN_TILE_REFRES_W - 1;
            scroll_load_col(x, port->start_tile, port->tile_height);
        } else if (current_col == (UBYTE)(new_col + 1)) {
            // Render left column
            UBYTE x = MAX(0, shift_col - SCREEN_PAD_LEFT);
            scroll_load_col(x, port->start_tile, port->tile_height);
        } else if (current_col != new_col) {
            // If column differs by more than 1 render entire viewport
            scroll_render_rows(shift_scroll_x, 0, port->start_tile, port->tile_height);
        }  
        return FALSE;   
    } else {
        // last parallax slice OR no parallax
        port->shadow_scx = draw_scroll_x;

        // If column is +/- 1 just render next column
        if (current_col == (UBYTE)(new_col - 1)) {
            // Queue right column
            UBYTE x = new_col - SCREEN_PAD_LEFT + SCREEN_TILE_REFRES_W - 1;
            UBYTE y = MAX(0, MAX((new_row - SCREEN_PAD_TOP), port->start_tile));
            UBYTE full_y = MAX(0, (new_row - SCREEN_PAD_TOP));
            scroll_queue_col(x, y);
            activate_actors_in_col(x, full_y);
        } else if (current_col == (UBYTE)(new_col + 1)) {
            // Queue left column
            UBYTE x = MAX(0, new_col - SCREEN_PAD_LEFT);
            UBYTE y = MAX(0, MAX((new_row - SCREEN_PAD_TOP), port->start_tile));
            UBYTE full_y = MAX(0, (new_row - SCREEN_PAD_TOP));
            scroll_queue_col(x, y);
            activate_actors_in_col(x, full_y);
        } else if (current_col != new_col) {
            // If column differs by more than 1 render entire screen
            scroll_render_rows(draw_scroll_x, draw_scroll_y, ((scene_LCD_type == LCD_parallax) ? port->start_tile : -SCREEN_PAD_TOP), SCREEN_TILE_REFRES_H);
            return TRUE;
        } else if (pending_h_i) {
            scroll_load_pending_col();
        }

        // If row is +/- 1 just render next row
        if (current_row == (UBYTE)(new_row - 1)) {
            // Queue bottom row
            UBYTE x = MAX(0, new_col - SCREEN_PAD_LEFT);
            UBYTE y = new_row - SCREEN_PAD_TOP + SCREEN_TILE_REFRES_H - 1;
            scroll_queue_row(x, y);
            activate_actors_in_row(x, y);
        } else if (current_row == (UBYTE)(new_row + 1)) {
            // Queue top row
            UBYTE x = MAX(0, new_col - SCREEN_PAD_LEFT);
            UBYTE y = MAX(port->start_tile, new_row - SCREEN_PAD_TOP);
            scroll_queue_row(x, y);
            activate_actors_in_row(x, y);
        } else if (current_row != new_row) {			
            // If row differs by more than 1 render entire screen
            scroll_render_rows(draw_scroll_x, draw_scroll_y, ((scene_LCD_type == LCD_parallax) ? port->start_tile : -SCREEN_PAD_TOP), SCREEN_TILE_REFRES_H);
            return TRUE;
        } else if (pending_w_i) {
            scroll_load_pending_row();
        }

        return TRUE;
    }
}

void scroll_repaint(void) BANKED {
    scroll_reset();
    scroll_update();
}

void scroll_render_rows(INT16 scroll_x, INT16 scroll_y, BYTE row_offset, BYTE n_rows) BANKED {
    // Clear pending rows/ columns
    pending_w_i = 0;
    pending_h_i = 0;
	
    UBYTE x = MAX(0, PX_TO_TILE(scroll_x) - SCREEN_PAD_LEFT);
    UBYTE y = MAX(0, PX_TO_TILE(scroll_y) + row_offset);

    for (BYTE i = 0; i != n_rows && y != image_tile_height; ++i, y++) {
        scroll_load_row(x, y);
        activate_actors_in_row(x, y);
    }	
}

void scroll_queue_row(UBYTE x, UBYTE y) BANKED {
    
	while (pending_w_i) {
        // If previous row wasn't fully rendered
        // render it now before starting next row        
        scroll_load_pending_row();
    }
		
    // Don't queue rows past image height
    if (y >= image_tile_height) {
        return;
    }
	
    pending_w_x = x;
    pending_w_y = y;
    pending_w_i = SCREEN_TILE_REFRES_W;	
	
	scroll_load_pending_row();
}

void scroll_queue_col(UBYTE x, UBYTE y) BANKED {
    
	while (pending_h_i) {
        // If previous column wasn't fully rendered
        // render it now before starting next column
        scroll_load_pending_col();
    }
		
    pending_h_x = x;
    pending_h_y = y;
    pending_h_i = MIN(SCREEN_TILE_REFRES_H, image_tile_height - y);	
	scroll_load_pending_col();
}


void load_metatile_row(const UBYTE* from, UBYTE x, UBYTE y, UBYTE width, UBYTE bank) NONBANKED {
	_save_bank = CURRENT_BANK;
	UBYTE i;
	SWITCH_ROM(bank);
	for (i = 0; i != width; i++) {
		set_vram_byte((UBYTE*)(0x9800 + bkg_address_offset), *(from + (UWORD)sram_map_data[METATILE_MAP_OFFSET(x + i, y)]));
		bkg_address_offset = (bkg_address_offset & 0xFFE0) + ((bkg_address_offset + 1) & 31);
	}
	SWITCH_ROM(_save_bank);		
}

void load_metatile_col(const UBYTE* from, UBYTE x, UBYTE y, UBYTE height, UBYTE bank) NONBANKED {
	_save_bank = CURRENT_BANK;
	UBYTE i;	
	SWITCH_ROM(bank);	
	for (i = 0; i != height; i++) {
		set_vram_byte((UBYTE*)(0x9800 + bkg_address_offset), *(from + (UWORD)sram_map_data[METATILE_MAP_OFFSET(x, y + i)]));
		bkg_address_offset = (bkg_address_offset + 32) & 1023;
	}
	SWITCH_ROM(_save_bank);		
}

void set_bkg_submap_banked(const UBYTE* ptr, UBYTE x, UBYTE y, UBYTE width, UBYTE height, UBYTE source_width, UBYTE bank) NONBANKED {
	_save_bank = CURRENT_BANK;
	SWITCH_ROM(bank);
	set_bkg_submap(x, y, width, height, ptr, source_width);	
	SWITCH_ROM(_save_bank);		
}

void scroll_load_row(UBYTE x, UBYTE y) BANKED {
	UBYTE width = MIN(SCREEN_TILE_REFRES_W, image_tile_width);	
	// DMG Row Load	
	if (metatile_bank){
		bkg_address_offset = ((UWORD)get_bkg_xy_addr(x & 31, y & 31)) - 0x9800;
		load_metatile_row(metatile_ptr, x, y, width, metatile_bank);
	} else {
		set_bkg_submap_banked(image_ptr, x, y, width, 1, image_tile_width, image_bank);
	}
#ifdef CGB
    if (_is_CGB) {  // Color Row Load
        VBK_REG = 1;		
		if (metatile_attr_bank){
			bkg_address_offset = ((UWORD)get_bkg_xy_addr(x & 31, y & 31)) - 0x9800;
			load_metatile_row(metatile_attr_ptr, x, y, width, metatile_attr_bank);
		} else {
			set_bkg_submap_banked(image_attr_ptr, x, y, width, 1, image_tile_width, image_attr_bank);
		}
        VBK_REG = 0;
    }
#endif
    
}

/* Update pending (up to 5) rows */
void scroll_load_pending_row(void) BANKED {    
    UBYTE width = MIN(pending_w_i, PENDING_BATCH_SIZE);	
	// DMG Row Load	
	if (metatile_bank){
		bkg_address_offset = ((UWORD)get_bkg_xy_addr(pending_w_x & 31, pending_w_y & 31)) - 0x9800;
		load_metatile_row(metatile_ptr, pending_w_x, pending_w_y, width, metatile_bank);
	} else {
		set_bkg_submap_banked(image_ptr, pending_w_x, pending_w_y, width, 1, image_tile_width, image_bank);
	}


#ifdef CGB
    if (_is_CGB) {  // Color Row Load
        VBK_REG = 1;		
		if (metatile_attr_bank){
			bkg_address_offset = ((UWORD)get_bkg_xy_addr(pending_w_x & 31, pending_w_y & 31)) - 0x9800;
			load_metatile_row(metatile_attr_ptr, pending_w_x, pending_w_y, width, metatile_attr_bank);
		} else {
			set_bkg_submap_banked(image_attr_ptr, pending_w_x, pending_w_y, width, 1, image_tile_width, image_attr_bank);
		}
        VBK_REG = 0;
    }
#endif
    
    pending_w_x += width;
    pending_w_i -= width;
}


void scroll_load_col(UBYTE x, UBYTE y, UBYTE height) BANKED {	
	// DMG Column Load
	if (metatile_bank){
		bkg_address_offset = ((UWORD)get_bkg_xy_addr(x & 31, y & 31)) - 0x9800;
		load_metatile_col(metatile_ptr, x, y, height, metatile_bank);
	} else {
		set_bkg_submap_banked(image_ptr, x, y, 1, height, image_tile_width, image_bank);
	}	
#ifdef CGB
    if (_is_CGB) {  // Color Column Load
        VBK_REG = 1;		
		if (metatile_attr_bank){
			bkg_address_offset = ((UWORD)get_bkg_xy_addr(x & 31, y & 31)) - 0x9800;
			load_metatile_col(metatile_attr_ptr, x, y, height, metatile_attr_bank);
		} else {
			set_bkg_submap_banked(image_attr_ptr, x, y, 1, height, image_tile_width, image_attr_bank);
		}
        VBK_REG = 0;
    }
#endif
    
}

void scroll_load_pending_col(void) BANKED {
    UBYTE height = MIN(pending_h_i, PENDING_BATCH_SIZE);	
	// DMG Column Load
	if (metatile_bank){
		bkg_address_offset = ((UWORD)get_bkg_xy_addr(pending_h_x & 31, pending_h_y & 31)) - 0x9800;
		load_metatile_col(metatile_ptr, pending_h_x, pending_h_y, height, metatile_bank);
	} else {
		set_bkg_submap_banked(image_ptr, pending_h_x, pending_h_y, 1, height, image_tile_width, image_bank);
	}	
#ifdef CGB
    if (_is_CGB) {  // Color Column Load
        VBK_REG = 1;		
		if (metatile_attr_bank){
			bkg_address_offset = ((UWORD)get_bkg_xy_addr(pending_h_x & 31, pending_h_y & 31)) - 0x9800;
			load_metatile_col(metatile_attr_ptr, pending_h_x, pending_h_y, height, metatile_attr_bank);
		} else {
			set_bkg_submap_banked(image_attr_ptr, pending_h_x, pending_h_y, 1, height, image_tile_width, image_attr_bank);
		}
        VBK_REG = 0;
    }
#endif
    
    pending_h_y += height;
    pending_h_i -= height;
}
