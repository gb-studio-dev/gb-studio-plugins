# Coobsoft VBlank Tile Streamer

This plugin streams sprite tiles into a reusable actor a few tiles at a time.

It is meant for effects like spells, bursts, flashes, and other things that only need to appear for a moment. Instead of keeping every effect loaded in sprite VRAM, you can stream the graphics into one effect actor when you need it.

## Step 1: Add The Plugin

Install the plugin from GB Studio's Plugin Manager.

For manual installs, copy the whole `VBlankTileStreamerPlugin` folder into your GB Studio project's `plugins` folder.

After reopening the project, the VBlank Stream events should show up in the event menu.

## Step 2: Register Your Streamed Sprites

Open:

```text
engine/src/coobsoft_vblank_streamer.c
```

Near the top of that file is a `vstream_assets` list. That is where you register the sprite tilesets you want to stream.

For example, if you have a sprite called `flash`, include its generated tileset header and put it in a slot:

```c
#include "data/sprite_flash_tileset.h"

static const vstream_asset_t vstream_assets[] = {
    { &sprite_flash_tileset, BANK(sprite_flash_tileset), 0, 0u },
    { 0, 0u, 0, 0u },
    { 0, 0u, 0, 0u },
};
```

If your project uses CGB sprite palettes and has a second bank tileset, use that instead of `0, 0u`. For a DMG-only project, `0, 0u` is fine.

## Step 3: Make One Reusable Effect Actor

Make an effect actor in your scene. This actor is the thing that will temporarily receive the streamed graphics.

Put it somewhere out of the way, or hide it until the stream is done.

## Step 4: Start The Stream

When you want to use an effect, call `VBlank Stream: Start Sprite Tiles`.

Choose:

1. The asset slot from `vstream_assets`.
2. The reusable effect actor.
3. How many tiles to stream.
4. How many tiles to copy per frame.

Keep streamed sprites at `48` tiles or less.

## Step 5: Update Until Complete

Call `VBlank Stream: Update` once per frame until the status is `2`.

In a script, that usually looks like this:

```text
Hide effect actor
Start Sprite Tiles stream
Update
Wait 1 frame
Update
Wait 1 frame
Update until complete
Move effect actor
Set effect animation
Show effect actor
```

## Step 6: Move And Show The Effect

Once the stream is complete, move the actor where the effect should happen, set the right animation state, and show it.

For moving effects, like a fireball, move the same actor with normal GB Studio events after the tiles are ready.

A small demo project is available here:

```text
https://github.com/CoobyPls/SecretOfEvermoreGB/tree/coobsoft/vblank-plugin-demo
```

## Step 7: Know The VRAM Map

The streamer always uses OBJ sprite tiles `96-143`.

That range sits below GB Studio's dialogue/UI tile area, which keeps the effect graphics from overwriting text tiles. The plugin also moves GB Studio's sprite allocator past the stream block when it starts, so later sprite loads should not claim those tiles either.

All streamed effects share that same fixed block. Keep one stream active at a time.

For a clean setup, keep the reusable effect actor in the scene from the start and avoid filling the scene with a pile of large sprite sheets before using the streamer.

## Events Included

- `VBlank Stream: Start Sprite Tiles`
- `VBlank Stream: Update`
- `VBlank Stream: Get Status`
- `VBlank Stream: Cancel`
- `VBlank Stream: Face Actor To Tile`

These are normal GB Studio custom events included with this plugin. There is no extra editor plugin to install.

## Status Values

```text
0 idle
1 busy
2 complete
3 busy rejected
4 invalid config
5 clamped
6 failed
7 experimental
8 bad actor
9 bad asset slot
```

## Important Note

This is not a battle system or spell system. It only streams sprite tiles. Movement, sounds, damage, menus, and targeting are still handled by your GB Studio scripts.

The demo project's Stars scene shows one simple way to use it.
