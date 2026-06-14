export const id = "EVENT_VSTREAM_START_SPRITE_TILES";
export const name = "VBlank Stream: Start Sprite Tiles";
export const groups = ["EVENT_GROUP_SCENE"];

export const autoLabel = (fetchArg) => {
  const slot = fetchArg("assetSlot") || 0;
  return `VBlank Stream: Start Slot ${slot}`;
};

export const fields = [
  {
    key: "compilerSpriteReference",
    label: "Compiler Sprite Reference",
    description: "Pick the sprite whose tiles you registered in the native asset table. This helps GB Studio include the sprite data in the build, but Asset Slot chooses what streams.",
    type: "sprite",
    defaultValue: "",
  },
  {
    key: "assetSlot",
    label: "Asset Slot",
    description: "Which native registry slot to stream. Fill the registry in engine/src/coobsoft_vblank_streamer.c first.",
    type: "number",
    min: 0,
    max: 7,
    defaultValue: 0,
  },
  {
    key: "targetActor",
    label: "Reusable Target Actor",
    description: "Hidden/non-solid actor whose reserved sprite tile window will receive the streamed graphics.",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "tilesPerFrame",
    label: "Tiles Per Frame",
    description: "4 is safe. 1-8 is normal live gameplay. 9-12 requires experimental mode.",
    type: "number",
    min: 1,
    max: 12,
    defaultValue: 4,
  },
  {
    key: "tileCount",
    label: "Stream Tile Count",
    description: "0 means use reserved/source size. Streamed effects can use up to 48 tiles.",
    type: "number",
    min: 0,
    max: 48,
    defaultValue: 24,
  },
  {
    key: "reservedTileCount",
    label: "Reserved Tile Count",
    description: "How many tiles are safe in the target actor's fixed window. 0 means use the source size.",
    type: "number",
    min: 0,
    max: 48,
    defaultValue: 24,
  },
  {
    key: "allowExperimental",
    label: "Allow Experimental Streaming Rates",
    description: "Allows 9-12 tiles/frame and up to 48 tiles. Leave off for normal gameplay.",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "hideActorWhileStreaming",
    label: "Hide Actor While Streaming",
    description: "Recommended on. Keeps the actor invisible while tile data is only partially loaded.",
    type: "checkbox",
    defaultValue: true,
  },
  {
    key: "statusVariable",
    label: "Status Variable",
    description: "0 idle, 1 busy, 2 complete, 3 busy rejected, 4 invalid config, 5 clamped, 6 failed, 7 experimental, 8 bad actor, 9 bad asset slot.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

const clamp = (value, fallback, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed | 0));
};

export const compile = (input, helpers) => {
  const {
    _addComment,
    _callNative,
    _stackPop,
    _stackPushConst,
    _stackPushReference,
    actorPushById,
    getVariableAlias,
  } = helpers;

  const experimental = input.allowExperimental === true;
  const tilesPerFrame = clamp(input.tilesPerFrame, 4, 1, experimental ? 12 : 8);
  const tileCount = clamp(input.tileCount, 24, 0, 48);
  const reservedTileCount = clamp(input.reservedTileCount, 24, 0, 48);

  _addComment("VBlank Stream: configure sprite tile stream");
  _stackPushReference(getVariableAlias(input.statusVariable));
  _stackPushConst(input.hideActorWhileStreaming === false ? 0 : 1);
  _stackPushConst(experimental ? 1 : 0);
  _stackPushConst(reservedTileCount);
  _stackPushConst(tileCount);
  _stackPushConst(tilesPerFrame);
  _stackPushConst(clamp(input.assetSlot, 0, 0, 7));
  _callNative("vstream_configure");
  _stackPop(7);

  _addComment("VBlank Stream: start");
  actorPushById(input.targetActor || "$self$");
  _callNative("vstream_start");
  _stackPop(1);
};
