# Sprite Blink

Per-pixel eye blink animation for GB Studio 4.2+ sprites via direct VRAM writes during VBlank.

Adds realistic blinking to up to 2 actor sprites by toggling individual pixels in the sprite tile data. Blink timing is randomized for a natural appearance. Eyes only blink when the actor faces down (front-facing).

## Events

### Blink Setup
Registers an actor for blinking. Can be called multiple times for different actors (up to 2).

| Parameter | Description |
|-----------|-------------|
| Actor | The actor to blink |
| Left Eye X | X pixel coordinate within the sprite (1-based) |
| Left Eye Y | Y pixel coordinate within the sprite (1-based) |
| Has Right Eye | Whether to also blink a second (right) eye |
| Right Eye X | X coordinate for right eye (if enabled) |
| Right Eye Y | Y coordinate for right eye (if enabled) |
| Eye Shape | 0 = 1x1 pixel, 1 = 2x1 horizontal, 2 = 1x2 vertical, 3 = 2x2 L-shape |
| Blink Color | 2-bit color value for closed eyes (0–3) |
| Left dTile | Tile offset for the left 8px column of the sprite |
| Right dTile | Tile offset for the right 8px column of the sprite |

### Blink Start
Re-enables blinking for all previously configured actors.

### Blink Stop
Stops all blinking and restores eyes to their open state.

## Usage

1. Add **Blink Setup** in your scene's On Init for each actor you want to blink (up to 2)
2. Add **Blink Start** to enable the effect (it auto-starts after setup, so this is mainly for re-enabling after a stop)
3. Call **Blink Stop** before scene transitions or when you want to disable blinking

## Finding the dTile Values

The dTile parameters tell the plugin which tiles in VRAM contain the eye pixels. These depend on your sprite's metasprite layout:

1. Open your sprite sheet in a tile editor or the GB Studio sprite editor
2. Count the tile offset from the actor's `base_tile` to the tile containing the left eye column
3. Do the same for the right eye column
4. These are typically 0–15 for standard sprite sizes

For a 16x16 sprite, the tiles are typically arranged as:
```
Tile 0 | Tile 1    (top row: left column, right column)
Tile 2 | Tile 3    (bottom row: left column, right column)
```
If the eyes are in the top-left tile, left dTile = 0, right dTile = 1.

## Important Notes

- **Core override**: This plugin overrides `interrupts.c` to hook `bk_vbl_update()` into `VBL_isr`. If you have other plugins that also override interrupts.c, you'll need to manually merge them.
- **WRAM usage**: The blink system uses ~50 bytes of static WRAM. In scenes with many actors or large scripts, this can cause stack overflow. If you experience crashes, consider reducing your VM heap size or script complexity.
- **Direction-locked**: Blinking only occurs when the actor faces `DIR_DOWN` (front-facing). Other directions are skipped automatically.
- **Scene-change safe**: The plugin detects scene changes via sprite bank comparison and auto-deactivates stale blink slots.

## Eye Shapes

```
Shape 0 (1x1):    Shape 1 (2x1):    Shape 2 (1x2):    Shape 3 (2x2 L):
    #                 ##                  #               ##
                                          #               _# (or #_)
```

Shape 3 uses an L-pattern: left eye gets bottom-right, right eye gets bottom-left (mirrored).

## Technical Details

- Runs entirely inside VBL_isr — zero CPU cost during active display
- Read-modify-write: only eye pixels are changed, surrounding sprite data is preserved
- 8.8 fixed-point randomized timing: ~2–4 seconds between blinks, 4 frames closed
- Flat parallel arrays for SDCC-friendly memory layout (no structs)
- Uses `DIV_REG` XOR for entropy in blink timing randomization
