const l10n = require("../helpers/l10n").default;

export const id = "EVENT_STREAM_ACTOR_RESERVE_TILES";
export const name = "Reserve Streamed Actor Tiles";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "Streaming",
};

export const autoLabel = (fetchArg) => {
  return `Reserve streaming band for actor ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description:
      "Actor to give an exclusive sprite VRAM band to. Build-time only, produces no bytecode.",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "spriteSheetId",
    label: l10n("FIELD_SPRITE_SHEET"),
    description:
      "Optional: size the band from this sheet's largest frame. Leave the tile count at 0 to use it.",
    type: "sprite",
    defaultValue: "LAST_SPRITE",
  },
  {
    key: "reserveTiles",
    label: "Reserve tiles (0 = from sheet)",
    description:
      "Number of sprite VRAM tiles to reserve. Use this when the actor streams several sheets: reserve the largest frame of the biggest one.",
    type: "number",
    min: 0,
    max: 128,
    defaultValue: 0,
    width: "50%",
  },
];

// Same frame packing maths as "Stream Actor Spritesheet", used here only to
// size the band. Returns tile slots, not tiles: a colour-only sheet splits
// each frame over both VRAM banks, so it needs half the tile indices.
const analyseStreamSheet = (sprite, spriteMode, cgbOnly) => {
  const step = spriteMode === "8x8" ? 1 : 2;
  const metasprites = sprite.metasprites || [];
  const order = sprite.metaspritesOrder || [];

  const uniq = metasprites.map((metasprite) => {
    const seen = new Set();
    let next = 0;
    (metasprite || []).forEach((t) => {
      const key = `${t.props & 0x08 ? 1 : 0}:${t.tile}`;
      if (!seen.has(key)) {
        seen.add(key);
        next += step;
      }
    });
    if (!cgbOnly) return next;
    return step === 2 ? Math.ceil(next / 4) * 2 : Math.ceil(next / 2);
  });

  return order.reduce((max, index) => Math.max(max, uniq[index] || 0), 0);
};

// VRAM buffer mode gives each streamed actor two bands and copies into the one
// it is not drawing from, so the reservation has to be twice the frame size.
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
  const { options } = helpers;
  const { sprites, settings, scene } = options;
  if (!scene) return;

  const actorId = resolveActorId(input, options);

  let reserveTiles = Number(input.reserveTiles) || 0;
  const sprite = (sprites || []).find((s) => s.id === input.spriteSheetId);
  if (!reserveTiles && sprite) {
    const spriteMode =
      sprite.spriteMode || (settings && settings.spriteMode) || "8x16";
    reserveTiles = analyseStreamSheet(
      sprite,
      spriteMode,
      sprite.colorMode === "color"
    );
  }
  if (!reserveTiles) return;

  if (actorId !== "player") {
    const actor = (scene.actors || []).find((a) => a.id === actorId);
    if (actor) removeFromScenePool(scene, actor.spriteSheetId, actor.id);
  }
  removeFromScenePool(scene, input.spriteSheetId, actorId);

  scene.actorsExclusiveLookup[actorId] = Math.max(
    scene.actorsExclusiveLookup[actorId] || 0,
    reserveTiles * bandsPerActor(options)
  );
};
