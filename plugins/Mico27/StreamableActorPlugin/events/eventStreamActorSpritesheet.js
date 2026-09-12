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
// GB Studio de-duplicates tiles across the whole sheet, so one frame's tiles
// can be scattered anywhere in the tileset - useless for streaming. This
// rebuilds it so every frame owns a contiguous block referenced as tiles
// 0..n-1, making "show frame N" one linear copy into a fixed band.
// (Event files cannot require sibling modules, so this is duplicated.)
// ---------------------------------------------------------------------------

const analyseStreamSheet = (sprite, spriteMode, cgbOnly) => {
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
      // props bit 3 = S_VRAM2. Where a tile came from says nothing about where
      // its streamed copy goes, so clear it here and set it again below.
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

    // A slot is one tile index and on a Game Boy Color holds a tile in either
    // bank, so a band kept in bank 0 alone would cost a streamed actor twice
    // a stock one's slots. Split it the way GB Studio splits an ordinary
    // sheet (spriteTileAllocationColorOnly): low half in bank 0, rounded up,
    // and up again to whole pairs in 8x16 mode. Bank 0's tiles stay first, so
    // the second bank gets the tail of the block at the same tile index.
    const nBank0 = !cgbOnly
      ? next
      : step === 2
      ? Math.ceil(next / 4) * 2
      : Math.ceil(next / 2);
    for (const entry of entries) {
      if (entry.tile >= nBank0) {
        entry.tile -= nBank0;
        entry.props |= 0x08;
      }
    }

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

    return { entries, nTiles: next, nBank0, offset };
  });

  const frames = order.map(
    (index) => uniq[index] || { entries: [], nTiles: 0, nBank0: 0, offset: 0 }
  );
  const maxTiles = frames.reduce((max, frame) => Math.max(max, frame.nTiles), 0);
  // Tile slots the band needs. The bank 0 half is the larger of the two, so
  // it is the one that sizes the band.
  const maxSlots = frames.reduce((max, frame) => Math.max(max, frame.nBank0), 0);

  return { step, data, uniq, frames, maxTiles, maxSlots };
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
// Every streamed sheet's tiles go into one array shared by all of them,
// spilling into stream_tiles_1, _2 ... whenever the next blob will not fit in
// a bank. Two reasons:
//
//   * Alignment. GDMA ignores the low four bits of its source address, and
//     nothing in the toolchain can ask for a 16 byte boundary. Pooling turns
//     one coin flip per sheet into one for all of them, and a full array is
//     big enough that the packer usually opens a fresh bank for it, which
//     starts at 0x4000 and so is aligned.
//   * Packing. One large object the packer places on its own.
//
// The pool spans every "Stream Actor Spritesheet" event in the project, and
// each event file is its own sandbox, so the state cannot live in a variable
// here. It lives in the compiler's additionalOutput map, shared by every event
// in a build: the group file written so far is read back, the new blob is
// appended, and it is written out again. The manifest comment at the top
// records the length so far and where each sheet's blob starts.
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
// Generated by the Streamable Actor plugin. Every streamed spritesheet appends
// its frame blocks here, so they share one address and one 16 byte alignment.
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

// Places a sheet's blob in the pool and returns its group and byte offset.
// Re-registering a sheet returns the slice it already has rather than
// appending a second copy.
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
  alignPools,
  cgbOnly
) => {
  const analysis = analyseStreamSheet(sprite, spriteMode, cgbOnly);
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
// block referenced as tiles 0..n-1, so only the current frame has to be
// resident. Blocks live in ${pool.group}[], from byte ${pool.base}.

#include "data/${symbol}.h"
#include "data/${pool.group}.h"

BANKREF(${symbol})

const stream_frame_t ${symbol}_frames[] = {
${analysis.frames
  .map(
    (frame) => `    { ${frame.offset}, ${frame.nTiles}, ${frame.nBank0} }`
  )
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

// No tileset: streamed sheets never load through load_sprite(), the streamer
// fills the actor's reserved band one frame at a time.
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
    ${analysis.maxSlots},
    BANK(${pool.group})
};
`;

  const header = `#ifndef __${symbol}_INCLUDE__
#define __${symbol}_INCLUDE__

#include "gbs_types.h"
#include "streamable_actor.h"

// Tiles in the largest frame, and the slots they occupy - the same number
// unless the sheet is colour only and split over both VRAM banks.
#define ${symbol.toUpperCase()}_MAX_TILES ${analysis.maxTiles}
#define ${symbol.toUpperCase()}_MAX_SLOTS ${analysis.maxSlots}

BANKREF_EXTERN(${symbol})
extern const struct spritesheet_t ${symbol};
extern const stream_sheet_t ${symbol}_desc;

#endif
`;

  writeAsset(`${symbol}.c`, source);
  writeAsset(`${symbol}.h`, header);

  return { symbol, maxTiles: analysis.maxTiles, maxSlots: analysis.maxSlots };
};

// Streaming loads no tiles at scene load, so keep the sheet out of the scene's
// shared sprite VRAM pool: GB Studio adds any sprite named by a `spriteSheetId`
// arg to it, and gives every actor without an exclusive reservation a slot for
// its editor sheet. Both are wasted VRAM for a streamed actor.
// VRAM buffer mode gives each streamed actor two bands and copies into the one
// it is not drawing from, so the reservation has to be twice the frame size.
// (Plugin event files cannot require sibling modules, so this is duplicated in
// the events that reserve tiles.)
const engineFieldValue = (options, id) => {
  const values = options.engineFieldValues || [];
  const field = values.find((v) => v && v.id === id);
  return field && field.value !== undefined ? field.value : undefined;
};

// Whether each tile pool is padded out to a whole ROM bank, which forces the
// packer to give it a bank of its own and so a 0x4000 start.
//
// Only VBlank mode with HDMA on has anything to gain - GDMA is the only thing
// needing the alignment - and padding elsewhere would spend up to 16 KB of ROM
// on nothing. The editor hides the setting in the other cases, but a value
// stored before the mode changed survives, so both are re-checked here.
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

// GB Studio silently turns an actor id that is not in the scene into index 0,
// the player. Worse than a no-op here: the band is reserved against an id
// nothing reads, so the actor it was meant for keeps its shared pool slot and
// the streamer writes over whatever else draws from it - which surfaces as one
// actor wearing another's tiles, far from the cause. Duplicating a scene is the
// usual way to get one: new actor ids, same script naming the originals.
const resolveActorId = (input, options) => {
  const { scene, entity, entityType } = options;
  let actorId = String(input.actorId);
  if (actorId === "$self$") {
    actorId = entityType === "actor" && entity ? entity.id : "player";
  }
  if (
    actorId !== "player" &&
    scene &&
    !(scene.actors || []).some((a) => a && a.id === actorId)
  ) {
    const where = scene.name || scene.symbol || scene.id;
    throw new Error(
      `${name}: actor "${actorId}" is not in scene "${where}". Pick the actor again in that scene's script.`
    );
  }
  return actorId;
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
  const { sprites, settings, statesOrder, scene } = options;

  const sprite = (sprites || []).find((s) => s.id === input.spriteSheetId);
  if (!sprite) return;

  const spriteMode =
    sprite.spriteMode || (settings && settings.spriteMode) || "8x16";
  // A colour-only sheet is only ever in a Game Boy Color ROM, so its band can
  // use both VRAM banks and cost half the tile slots.
  const { symbol, maxSlots } = writeStreamSheet(
    writeAsset,
    additionalOutput,
    sprite,
    spriteMode,
    statesOrder,
    alignTilePools(options),
    sprite.colorMode === "color"
  );

  // ---- build time: reserve the actor's exclusive VRAM band ----------------
  const actorId = resolveActorId(input, options);
  const reserveTiles = Math.max(maxSlots, Number(input.reserveTiles) || 0);
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
