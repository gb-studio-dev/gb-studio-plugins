# Handheld Camera

Smooth handheld camera sway and screen shake effect for GB Studio 4.2+.

Applies randomized, eased offsets to `scroll_offset_x` / `scroll_offset_y` to simulate organic camera movement — from subtle documentary-style drift to intense screen shake.

## Events

### Start Handheld Camera
Configures and activates the camera effect.

| Parameter | Range | Description |
|-----------|-------|-------------|
| X Range | 0–8 px | Horizontal movement amplitude (0 = disabled) |
| Y Range | 0–8 px | Vertical movement amplitude (0 = disabled) |
| Speed | Slow / Normal / Fast / Faster / Fastest | How quickly the camera picks new target positions |
| Smoothness | Sharp / Normal / Smooth / Very Smooth | How gradually the camera eases toward targets |

### Update Handheld Camera
Call once per frame in your scene's Update script to drive the effect.

### Stop Handheld Camera
Deactivates the effect and resets scroll offsets to zero.

## Usage

1. Add **Start Handheld Camera** in your scene's On Init (or wherever you want the effect to begin)
2. Add **Update Handheld Camera** in the scene's On Update (Actor) script — it must run every frame
3. Call **Stop Handheld Camera** when you want to end the effect cleanly

## Speed Presets

| Speed | Behavior |
|-------|----------|
| Slow | Gentle drift, new target every ~20–27 frames |
| Normal | Subtle handheld sway, ~10–17 frames |
| Fast | Noticeable movement, ~5–12 frames |
| Faster | Rapid shake, ~2–9 frames |
| Fastest | Raw random offset every frame (earthquake/explosion shake) |

## Tips

- Set one axis to 0 for directional-only effects (e.g., X=3, Y=0 for horizontal sway)
- Speed 5 + high amplitude = intense screen shake for explosions or impacts
- Speed 1–2 + low amplitude + high smoothness = cinematic handheld feel
- The effect works with any scene type that uses the scroll system

## Technical Details

- 8.8 fixed-point math for sub-pixel smooth easing
- Per-axis independent random target selection with variable intervals
- Velocity-based easing with 7/8 damping per frame
- X and Y axes use offset base intervals to prevent synchronized movement
- ~40 bytes WRAM for state variables
