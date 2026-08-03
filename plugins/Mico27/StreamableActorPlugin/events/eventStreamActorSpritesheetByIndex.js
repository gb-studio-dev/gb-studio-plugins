const l10n = require("../helpers/l10n").default;

export const id = "EVENT_STREAM_ACTOR_SPRITESHEET_BY_INDEX";
export const name = "Stream Actor Spritesheet By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "Streaming",
};

export const autoLabel = (fetchArg) => {
  return `Stream spritesheet ${fetchArg("spriteSheetId")} on actor ${fetchArg(
    "actorIndex"
  )}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor index",
    description:
      "Index of the actor in the scene (0 = player). The actor's VRAM band must be reserved separately with the 'Reserve Streamed Actor Tiles' event.",
    type: "value",
    defaultValue: { type: "number", value: 0 },
  },
  {
    key: "spriteSheetId",
    label: l10n("FIELD_SPRITE_SHEET"),
    description:
      "Spritesheet to stream. It is re-packed at build time so each frame owns a contiguous tile block; only the current frame is ever resident in VRAM.",
    type: "sprite",
    defaultValue: "LAST_SPRITE",
  },
  {
    key: "spriteStateId",
    label: l10n("FIELD_ANIMATION_STATE"),
    description: "Animation state to select on the streamed spritesheet.",
    type: "animationstate",
    defaultValue: "",
    width: "50%",
  },
  {
    key: "reserveTiles",
    label: "Band size limit (0 = auto)",
    description:
      "Never upload more than this many tiles per frame. 0 uses the size of the sheet's largest frame. Must not exceed the tiles reserved for the target actor.",
    type: "number",
    min: 0,
    max: 128,
    defaultValue: 0,
    width: "50%",
  },
  {
    key: "uploadNow",
    label: "Upload first frame immediately",
    description:
      "Copy the current frame into VRAM right away instead of waiting for the next VBlank. Avoids showing the placeholder sprite for one frame.",
    type: "checkbox",
    defaultValue: true,
    width: "50%",
  },
  {
    key: "setBounds",
    label: "Apply sheet collision bounds",
    description:
      "Also copy the streamed spritesheet's collision bounds onto the actor.",
    type: "checkbox",
    defaultValue: true,
    width: "50%",
  },
];

// ---------------------------------------------------------------------------
// Build-time spritesheet re-packer
//
// GB Studio de-duplicates sprite tiles across the whole sheet, so the tiles of
// one frame can be scattered anywhere in the tileset - useless for streaming.
// This rebuilds the sheet so that every frame owns one contiguous block of
// tiles and its metasprite only references tiles 0..n-1 of that block, which
// makes "show frame N" a single linear copy into a fixed VRAM band.
// (Plugin event files cannot require sibling modules, so this helper is
// duplicated in the events that need it.)
// ---------------------------------------------------------------------------

const analyseStreamSheet = (sprite, spriteMode) => {
  const step = spriteMode === "8x8" ? 1 : 2; // 8x8 tiles per metasprite entry
  const vramData = sprite.vramData || [[], []];
  const metasprites = sprite.metasprites || [];
  const order = sprite.metaspritesOrder || [];

  const readTiles = (vramBank, tile, count) => {
    const src = vramData[vramBank] || [];
    const out = [];
    const start = tile * 16;
    const end = start + count * 16;
    for (let i = start; i < end; i++) {
      out.push(src[i] === undefined ? 0 : src[i] & 0xff);
    }
    return out;
  };

  const data = []; // re-packed tile bytes, all frame blocks back to back
  const blockOffsets = new Map(); // identical blocks are shared

  const uniq = metasprites.map((metasprite) => {
    const localOf = new Map();
    const sources = [];
    let next = 0;
    const entries = (metasprite || []).map((t) => {
      // props bit 3 = S_VRAM2: colour-only sheets keep some tiles in VRAM
      // bank 1. Streamed frames always land in bank 0, so the flag is cleared.
      const vramBank = t.props & 0x08 ? 1 : 0;
      const key = `${vramBank}:${t.tile}`;
      let local = localOf.get(key);
      if (local === undefined) {
        local = next;
        next += step;
        localOf.set(key, local);
        sources.push({ vramBank, tile: t.tile });
      }
      return { y: t.y, x: t.x, tile: local, props: t.props & ~0x08 };
    });

    const bytes = [];
    for (const source of sources) {
      const tileBytes = readTiles(source.vramBank, source.tile, step);
      for (let i = 0; i < tileBytes.length; i++) bytes.push(tileBytes[i]);
    }

    const key = bytes.join(",");
    let offset = blockOffsets.get(key);
    if (offset === undefined) {
      offset = data.length;
      blockOffsets.set(key, offset);
      for (let i = 0; i < bytes.length; i++) data.push(bytes[i]);
    }

    return { entries, nTiles: next, offset };
  });

  const frames = order.map(
    (index) => uniq[index] || { entries: [], nTiles: 0, offset: 0 }
  );
  const maxTiles = frames.reduce((max, frame) => Math.max(max, frame.nTiles), 0);

  return { step, data, uniq, frames, maxTiles };
};

const toHexRows = (bytes) => {
  const rows = [];
  for (let i = 0; i < bytes.length; i += 16) {
    rows.push(
      "    " +
        bytes
          .slice(i, i + 16)
          .map((b) => `0x${(b & 0xff).toString(16).padStart(2, "0")}`)
          .join(", ")
    );
  }
  return rows.join(",\n");
};

const writeStreamSheet = (writeAsset, sprite, spriteMode, statesOrder) => {
  const analysis = analyseStreamSheet(sprite, spriteMode);
  const symbol = `${sprite.symbol}_stream`;

  const stateNames = (sprite.states || []).map((state) => state.name);
  const stateIndexes = stateNames.map((state) =>
    (statesOrder || []).indexOf(state)
  );
  const maxState = stateIndexes.length > 0 ? Math.max(...stateIndexes) : 0;
  const animationsLookup = [];
  for (let n = 0; n <= maxState; n++) {
    animationsLookup.push(
      Math.max(0, stateNames.indexOf((statesOrder || [])[n])) * 8
    );
  }

  const boundsX = sprite.boundsX || 0;
  const boundsY = sprite.boundsY || 0;
  const boundsWidth = sprite.boundsWidth || 16;
  const boundsHeight = sprite.boundsHeight || 16;

  const source = `#pragma bank 255

// Streamed spritesheet: ${sprite.name}
// Generated by the Streamable Actor plugin. Every frame owns a contiguous
// block of tiles in ${symbol}_tiles[] and references it as tiles 0..n-1, so
// only the current frame has to be resident in sprite VRAM.

#include "data/${symbol}.h"

BANKREF(${symbol})

const uint8_t ${symbol}_tiles[] = {
${toHexRows(analysis.data)}
};

const stream_frame_t ${symbol}_frames[] = {
${analysis.frames
  .map((frame) => `    { ${frame.offset}, ${frame.nTiles} }`)
  .join(",\n")}
};

${analysis.uniq
  .map(
    (frame, index) => `const metasprite_t ${symbol}_metasprite_${index}[] = {
    ${frame.entries
      .map((t) => `{ ${t.y}, ${t.x}, ${t.tile}, ${t.props} }`)
      .join(", ")}${frame.entries.length > 0 ? ",\n    " : ""}{metasprite_end}
};`
  )
  .join("\n\n")}

const metasprite_t * const ${symbol}_metasprites[] = {
${(sprite.metaspritesOrder || [])
  .map((index) => `    ${symbol}_metasprite_${index}`)
  .join(",\n")}
};

const struct animation_t ${symbol}_animations[] = {
${(sprite.animationOffsets || [])
  .map((animation) => `    { ${animation.start}, ${animation.end} }`)
  .join(",\n")}
};

const UWORD ${symbol}_animations_lookup[] = {
${animationsLookup.map((value) => `    ${value}`).join(",\n")}
};

// No tileset: streamed sheets never load their tiles through load_sprite(),
// the VBlank streamer fills the actor's reserved band one frame at a time.
const struct spritesheet_t ${symbol} = {
    .n_metasprites = ${(sprite.metaspritesOrder || []).length},
    .emote_origin = { .x = 0, .y = ${-(sprite.canvasHeight || 16)} },
    .metasprites = ${symbol}_metasprites,
    .animations = ${symbol}_animations,
    .animations_lookup = ${symbol}_animations_lookup,
    .bounds = {
        .left = PX_TO_SUBPX(${boundsX}),
        .right = PX_TO_SUBPX(${boundsX + boundsWidth}) - 1,
        .top = PX_TO_SUBPX(${boundsY}),
        .bottom = PX_TO_SUBPX(${boundsY + boundsHeight}) - 1
    },
    .tileset = { .bank = 0, .ptr = NULL },
    .cgb_tileset = { .bank = 0, .ptr = NULL }
};

const stream_sheet_t ${symbol}_desc = {
    ${symbol}_tiles,
    ${symbol}_frames,
    ${analysis.frames.length},
    ${analysis.maxTiles}
};
`;

  const header = `#ifndef __${symbol}_INCLUDE__
#define __${symbol}_INCLUDE__

#include "gbs_types.h"
#include "streamable_actor.h"

#define ${symbol.toUpperCase()}_MAX_TILES ${analysis.maxTiles}

BANKREF_EXTERN(${symbol})
extern const struct spritesheet_t ${symbol};
extern const stream_sheet_t ${symbol}_desc;

#endif
`;

  writeAsset(`${symbol}.c`, source);
  writeAsset(`${symbol}.h`, header);

  return { symbol, maxTiles: analysis.maxTiles };
};

// Streaming loads no tiles at scene load, so keep the sheet out of the scene's
// shared sprite VRAM pool. GB Studio adds any sprite referenced by an event arg
// named `spriteSheetId` to that pool, and gives every actor without an
// exclusive reservation a slot for its editor spritesheet - both are wasted
// VRAM for a streamed actor.
const removeFromScenePool = (scene, spriteSheetId, keepForActorId) => {
  if (!scene || !scene.sprites || !spriteSheetId) return;
  const stillUsed = (scene.actors || []).some(
    (other) =>
      other &&
      other.id !== keepForActorId &&
      other.spriteSheetId === spriteSheetId &&
      !scene.actorsExclusiveLookup[other.id]
  );
  if (stillUsed) return;
  // Look the entry up by id and splice by index: plugin code sees the project
  // through per-access proxies, so indexOf() on an object read out of the
  // array never matches, while calling splice() does reach the real array.
  const index = scene.sprites.findIndex((s) => s.id === spriteSheetId);
  if (index !== -1) scene.sprites.splice(index, 1);
};

export const compile = (input, helpers) => {
  const {
    options,
    writeAsset,
    _callNative,
    _stackPush,
    _stackPushConst,
    _stackPop,
    _addComment,
    _declareLocal,
    variableSetToScriptValue,
  } = helpers;
  const { sprites, settings, statesOrder, scene } = options;

  const sprite = (sprites || []).find((s) => s.id === input.spriteSheetId);
  if (!sprite) return;

  const spriteMode =
    sprite.spriteMode || (settings && settings.spriteMode) || "8x16";
  const { symbol, maxTiles } = writeStreamSheet(
    writeAsset,
    sprite,
    spriteMode,
    statesOrder
  );

  // The target actor is only known at run time, so the VRAM band has to be
  // reserved separately (Reserve Streamed Actor Tiles). Referencing the sheet
  // still pulled it into the scene sprite pool though - take it back out.
  // 0 lets the run time use the sheet's own largest frame as the clamp.
  const bandLimit = Math.min(Number(input.reserveTiles) || 0, maxTiles);
  if (scene) removeFromScenePool(scene, input.spriteSheetId, null);

  // ---- run time ----------------------------------------------------------
  const animSet = Math.max(
    0,
    (statesOrder || []).indexOf(input.spriteStateId || "")
  );
  let flags = 0;
  if (input.uploadNow !== false) flags |= 0x01;
  if (input.setBounds !== false) flags |= 0x02;

  const actorRef = _declareLocal("stream_actor", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);

  _addComment("Stream Actor Spritesheet By Index");
  _stackPushConst(bandLimit);
  _stackPushConst(animSet);
  _stackPushConst(flags);
  _stackPush(actorRef);
  _stackPushConst(`_${symbol}_desc`);
  _stackPushConst(`_${symbol}`);
  _stackPushConst(`___bank_${symbol}`);
  _callNative("vm_stream_actor");
  _stackPop(7);
};
