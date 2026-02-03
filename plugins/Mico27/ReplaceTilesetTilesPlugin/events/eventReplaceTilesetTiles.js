export const id = "EVENT_REPLACE_TILESET_TILES";
export const name = "Replace Tileset Tiles";
export const groups = ["EVENT_GROUP_SCENE"];
export const subGroups = {
  EVENT_GROUP_SCENE: "EVENT_GROUP_TILES",
};

export const autoLabel = (fetchArg) => {
  return `Replace Tileset Tiles`;
};

export const fields = [
  {
    key: "tilesetId",
    type: "tileset",
    label: "tileset",
    defaultValue: "LAST_TILESET",
  }, 
  {
    key: `idx_target_tile`,
    label: "Target Tile Index",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: `idx_start_tile`,
    label: "Source Offset Tile Index",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "tile_length",
    label: "length",
    description: "length",
    type: "number",
    width: "50%",
    defaultValue: 1,
  },
];

export const compile = (input, helpers) => {
  const { options, _callNative, _stackPushConst, _stackPush, _stackPop, _addComment, _declareLocal, _stackPushScriptValue, _replaceTile } = helpers;
  
  const { tilesets } = options;
  const tileset = tilesets.find((t) => t.id === input.tilesetId) ?? tilesets[0];
  if (!tileset) {
    return;
  }
      
  _stackPushScriptValue(input.idx_target_tile);
  _stackPushScriptValue(input.idx_start_tile);
    
  _addComment("Replace tiles");
  
  _replaceTile(".ARG1", tileset.symbol, ".ARG0", input.tile_length);
  
  _stackPop(2);
};
