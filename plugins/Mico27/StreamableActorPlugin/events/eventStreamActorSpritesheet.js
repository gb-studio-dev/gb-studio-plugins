const l10n = require("../helpers/l10n").default;

export const id = "EVENT_STREAM_ACTOR_SPRITESHEET";
export const name = "Stream Actor Spritesheet";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "Streaming",
};

export const autoLabel = (fetchArg) => {
  return `Stream spritesheet ${fetchArg("spriteSheetId")} on actor ${fetchArg(
    "actorId"
  )}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description:
      "Actor that will stream its frames. Give this actor a small placeholder sprite in the editor: only the streaming band is kept in VRAM.",
    type: "actor",
    defaultValue: "$self$",
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
    label: "Reserve tiles (0 = auto)",
    description:
      "Sprite VRAM tiles reserved for this actor. 0 reserves exactly the size of the sheet's largest frame. Raise it if the same actor also streams a bigger sheet later.",
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

// ---------------------------------------------------------------------------
// Shared tile blob files
//
// Every streamed sheet's tiles go into one array shared by all of them, spilling
// into stream_tiles_1, _2 ... whenever the next blob would not fit in a bank.
// Two reasons:
//
//   * Alignment. On a Game Boy Color the streamer moves tiles with general
//     purpose DMA, which ignores the low four bits of its source address, so it
//     only works on a blob that starts on a 16 byte boundary - and nothing in
//     the toolchain can ask for one. Pooling turns one coin flip per sheet into
//     one coin flip for all of them: every blob in the array is a whole number
//     of tiles, so they are all aligned or all not, and a full array is big
//     enough that the bank packer usually has to open a fresh bank for it,
//     which starts at 0x4000 and is therefore aligned.
//   * Packing. One large object the packer places on its own, instead of a
//     tile blob welded to each sheet's metasprite and animation tables.
//
// The pool has to be built up across every "Stream Actor Spritesheet" event in
// the project, and each event file is its own sandbox with its own module
// scope - so the accumulated state cannot live in a variable here. It lives in
// the compiler's additionalOutput map instead, which is shared by every event
// in a build and created fresh for each one: the group file that has been
// written so far is read back, the new blob is appended to it, and it is
// written out again. The manifest comment at the top is what makes that
// readable - it records the length so far and where each sheet's blob starts.
// ---------------------------------------------------------------------------

const TILES_BANK_SIZE = 16384; // an object has to fit in one bank
const TILES_PREFIX = "stream_tiles_";
const TILES_MANIFEST = "// @manifest ";
const TILES_PAD = "    // @pad";

const readTileGroups = (additionalOutput) => {
  const groups = [];
  for (let index = 0; ; index++) {
    const entry =
      additionalOutput && additionalOutput[`${TILES_PREFIX}${index}.c`];
    if (!entry || !entry.data) break;

    const text = String(entry.data);
    const manifest = text.slice(
      text.indexOf(TILES_MANIFEST) + TILES_MANIFEST.length,
      text.indexOf("\n", text.indexOf(TILES_MANIFEST))
    );
    const sheets = {};
    let len = 0;
    for (const part of manifest.split(" ")) {
      const [symbol, base, size] = part.split(":");
      if (!symbol) continue;
      sheets[symbol] = Number(base);
      len = Number(base) + Number(size);
    }

    // Anything from the pad marker on is filler, not sheet data: drop it so a
    // later sheet appends to the real end of the pool.
    const open = text.indexOf("{\n", text.indexOf("[] = "));
    const pad = text.indexOf(TILES_PAD);
    let rows = text.slice(open + 2, pad === -1 ? text.lastIndexOf("\n};") : pad);
    if (rows.endsWith(",\n")) rows = rows.slice(0, -2);
    groups.push({ index, len, sheets, rows });
  }
  return groups;
};

const renderTileGroup = (group, alignPools) => {
  const symbol = `${TILES_PREFIX}${group.index}`;
  const manifest = Object.keys(group.sheets)
    .sort((a, b) => group.sheets[a] - group.sheets[b])
    .map((name, i, all) => {
      const base = group.sheets[name];
      const next = i + 1 < all.length ? group.sheets[all[i + 1]] : group.len;
      return `${name}:${base}:${next - base}`;
    })
    .join(" ");

  // Padding a pool out to a whole bank leaves the packer nowhere to put it but
  // an empty bank, which it then fills - so nothing can be linked in front of
  // it and it starts at 0x4000, which is 16 byte aligned. That is the only way
  // to guarantee the alignment general purpose DMA needs.
  const filler = alignPools ? TILES_BANK_SIZE - group.len : 0;
  const padding =
    filler > 0
      ? `,\n${TILES_PAD} ${filler} bytes of filler: this pool owns a whole bank\n${toHexRows(
          new Array(filler).fill(0)
        )}`
      : "";

  return {
    source: `#pragma bank 255

// Streamed tile blocks, pool ${group.index}
// Generated by the Streamable Actor plugin. Every streamed spritesheet in the
// project appends its frame blocks here, so they share one address and one
// 16 byte alignment. Each sheet's descriptor points at its own slice.
${TILES_MANIFEST}${manifest}

#include "data/${symbol}.h"

BANKREF(${symbol})

const uint8_t ${symbol}[] = {
${group.rows}${padding}
};
`,
    header: `#ifndef __${symbol}_INCLUDE__
#define __${symbol}_INCLUDE__

#include "gbs_types.h"

BANKREF_EXTERN(${symbol})
extern const uint8_t ${symbol}[];

#endif
`,
  };
};

// Places a sheet's blob in the pool and returns the group it landed in and the
// byte offset of its slice. Re-registering a sheet - two actors streaming the
// same spritesheet, or the by-index event alongside this one - returns the
// slice it already has instead of appending a second copy.
const addToTilePool = (
  writeAsset,
  additionalOutput,
  symbol,
  bytes,
  alignPools
) => {
  const groups = readTileGroups(additionalOutput);

  for (const group of groups) {
    if (group.sheets[symbol] !== undefined) {
      return { group: `${TILES_PREFIX}${group.index}`, base: group.sheets[symbol] };
    }
  }

  // First fit rather than "append to the last one": a blob big enough to open
  // a new group leaves room behind it that later, smaller sheets should still
  // be able to use. Appending never moves a slice that is already placed.
  let group = groups.find((g) => g.len + bytes.length <= TILES_BANK_SIZE);
  if (!group) {
    group = { index: groups.length, len: 0, sheets: {}, rows: "" };
    groups.push(group);
  }

  const base = group.len;
  group.sheets[symbol] = base;
  group.rows = group.rows
    ? `${group.rows},\n${toHexRows(bytes)}`
    : toHexRows(bytes);
  group.len += bytes.length;

  const { source, header } = renderTileGroup(group, alignPools);
  writeAsset(`${TILES_PREFIX}${group.index}.c`, source);
  writeAsset(`${TILES_PREFIX}${group.index}.h`, header);

  return { group: `${TILES_PREFIX}${group.index}`, base };
};

const writeStreamSheet = (
  writeAsset,
  additionalOutput,
  sprite,
  spriteMode,
  statesOrder,
  alignPools
) => {
  const analysis = analyseStreamSheet(sprite, spriteMode);
  const symbol = `${sprite.symbol}_stream`;
  const pool = addToTilePool(
    writeAsset,
    additionalOutput,
    symbol,
    analysis.data,
    alignPools
  );

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
// block of tiles and references it as tiles 0..n-1, so only the current frame
// has to be resident in sprite VRAM. The blocks live in the shared tile pool
// ${pool.group}[], starting at byte ${pool.base}.

#include "data/${symbol}.h"
#include "data/${pool.group}.h"

BANKREF(${symbol})

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
    ${pool.group} + ${pool.base},
    ${symbol}_frames,
    ${analysis.frames.length},
    ${analysis.maxTiles},
    BANK(${pool.group})
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
// VRAM buffer mode gives each streamed actor two bands and copies into the one
// it is not drawing from, so the reservation has to be twice the frame size.
// (Plugin event files cannot require sibling modules, so this is duplicated in
// the events that reserve tiles.)
const engineFieldValue = (options, id) => {
  const values = options.engineFieldValues || [];
  const field = values.find((v) => v && v.id === id);
  return field && field.value !== undefined ? field.value : undefined;
};

// Build-time only: whether each tile pool is padded out to a whole ROM bank so
// that it is guaranteed to start on a 16 byte boundary. A pool that size can be
// placed nowhere but an empty bank, which it then fills, so nothing can be
// linked in front of it and it starts at 0x4000.
//
// Only a VBlank mode build with HDMA enabled has anything to gain from it -
// general purpose DMA is the only thing that needs the alignment, and VRAM
// buffer mode copies from the render loop where it cannot be used. Padding in
// either of those cases would spend up to 16 KB of ROM on nothing. The setting
// is hidden in the editor there, but a value set before the mode or the HDMA
// setting was changed stays in the project, so both are checked here rather
// than trusting the editor to have kept up.
// (Plugin event files cannot require sibling modules, so this is duplicated in
// the events that need it.)
const alignTilePools = (options) => {
  const mode = engineFieldValue(options, "STREAMABLE_ACTOR_MODE");
  if (mode !== undefined && String(mode) !== "STREAM_MODE_VBLANK") return false;
  // Defaults to on, so only an explicit 0 turns it off.
  const hdma = engineFieldValue(options, "STREAMABLE_ACTOR_USE_HDMA");
  if (hdma !== undefined && !hdma) return false;
  return !!engineFieldValue(options, "STREAMABLE_ACTOR_ALIGN_POOLS");
};

const bandsPerActor = (options) => {
  const values = options.engineFieldValues || [];
  const field = values.find((v) => v && v.id === "STREAMABLE_ACTOR_MODE");
  const value =
    field && field.value !== undefined ? field.value : "STREAM_MODE_VBLANK";
  return String(value) === "STREAM_MODE_VRAM_BUFFER" ? 2 : 1;
};

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
    additionalOutput,
    _callNative,
    _stackPush,
    _stackPushConst,
    _stackPop,
    _addComment,
    _declareLocal,
    setActorId,
  } = helpers;
  const { sprites, settings, statesOrder, scene, entity, entityType } = options;

  const sprite = (sprites || []).find((s) => s.id === input.spriteSheetId);
  if (!sprite) return;

  const spriteMode =
    sprite.spriteMode || (settings && settings.spriteMode) || "8x16";
  const { symbol, maxTiles } = writeStreamSheet(
    writeAsset,
    additionalOutput,
    sprite,
    spriteMode,
    statesOrder,
    alignTilePools(options)
  );

  // ---- build time: reserve the actor's exclusive VRAM band ----------------
  let actorId = String(input.actorId);
  if (actorId === "$self$") {
    actorId = entityType === "actor" && entity ? entity.id : "player";
  }
  const reserveTiles = Math.max(maxTiles, Number(input.reserveTiles) || 0);
  if (scene) {
    if (actorId !== "player") {
      const actor = (scene.actors || []).find((a) => a.id === actorId);
      if (actor) removeFromScenePool(scene, actor.spriteSheetId, actor.id);
    }
    removeFromScenePool(scene, input.spriteSheetId, actorId);
    scene.actorsExclusiveLookup[actorId] = Math.max(
      scene.actorsExclusiveLookup[actorId] || 0,
      reserveTiles * bandsPerActor(options)
    );
  }

  // ---- run time ----------------------------------------------------------
  const animSet = Math.max(
    0,
    (statesOrder || []).indexOf(input.spriteStateId || "")
  );
  let flags = 0;
  if (input.uploadNow !== false) flags |= 0x01;
  if (input.setBounds !== false) flags |= 0x02;

  const actorRef = _declareLocal("stream_actor", 1, true);
  setActorId(actorRef, input.actorId);

  _addComment("Stream Actor Spritesheet");
  _stackPushConst(reserveTiles);
  _stackPushConst(animSet);
  _stackPushConst(flags);
  _stackPush(actorRef);
  _stackPushConst(`_${symbol}_desc`);
  _stackPushConst(`_${symbol}`);
  _stackPushConst(`___bank_${symbol}`);
  _callNative("vm_stream_actor");
  _stackPop(7);
};
