# Draw Lifebar Plugin

Draw a (life/power/mana)bar to a specified position on the overlay.

- `X`, `Y`: Tile coordinates on the overlay.
- `Tileset`: A tileset that includes the tiles for the bar in consecutive order.
- `Tile`: The first tile of the bar in the tileset (usually the empty tile).
- `Value`: The current value to be represented by the bar.
- `Max Value`: The maximum value that can be represented by the bar.
- `Steps`: The number of tiles needed to "fill" an item in the bar (not including the empty one).

_Note:_ The tileset will load in tile 128 of VRAM (right after the sprites block). This allows combining the lifebar rendering with using `Draw Text` on the overlay. The VRAM index can be changed by editing the `const VRAM_BASE_START_TILE = 128` line in the plugin file.

![Draw Lifebar](screenshots/draw_lifebar.png)
![Draw Lifebar](screenshots/draw_lifebar_screenshot.png)
