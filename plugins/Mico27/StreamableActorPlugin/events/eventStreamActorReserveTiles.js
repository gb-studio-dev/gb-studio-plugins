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
// find the largest frame. (Plugin event files cannot require sibling modules.)
const analyseStreamSheet = (sprite, spriteMode) => {
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
    return next;
  });

  return order.reduce((max, index) => Math.max(max, uniq[index] || 0), 0);
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
  const { sprites, settings, scene, entity, entityType } = options;
  if (!scene) return;

  let actorId = String(input.actorId);
  if (actorId === "$self$") {
    actorId = entityType === "actor" && entity ? entity.id : "player";
  }

  let reserveTiles = Number(input.reserveTiles) || 0;
  const sprite = (sprites || []).find((s) => s.id === input.spriteSheetId);
  if (!reserveTiles && sprite) {
    const spriteMode =
      sprite.spriteMode || (settings && settings.spriteMode) || "8x16";
    reserveTiles = analyseStreamSheet(sprite, spriteMode);
  }
  if (!reserveTiles) return;

  if (actorId !== "player") {
    const actor = (scene.actors || []).find((a) => a.id === actorId);
    if (actor) removeFromScenePool(scene, actor.spriteSheetId, actor.id);
  }
  removeFromScenePool(scene, input.spriteSheetId, actorId);

  scene.actorsExclusiveLookup[actorId] = Math.max(
    scene.actorsExclusiveLookup[actorId] || 0,
    reserveTiles
  );
};
