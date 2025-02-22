export const id = "EVENT_LOAD_TILESET_EX";
export const name = "Load tileset";
export const groups = ["EVENT_GROUP_MISC"];

export const autoLabel = (fetchArg) => {
  return `Load tileset`;
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
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
];

export const compile = (input, helpers) => {
  const { options, _callNative, _stackPushConst, _stackPush, _stackPop, _addComment, _declareLocal, variableSetToScriptValue } = helpers;
  
  const { tilesets } = options;
  const tileset = tilesets.find((t) => t.id === input.tilesetId) ?? tilesets[0];
  if (!tileset) {
    return;
  }
  
  const tmp0 = _declareLocal("tmp_0", 1, true);
  const tmp1 = _declareLocal("tmp_1", 1, true);
  const tmp2 = _declareLocal("tmp_2", 1, true);
    
  variableSetToScriptValue(tmp0, input.idx_target_tile);
  variableSetToScriptValue(tmp1, input.idx_start_tile);
  variableSetToScriptValue(tmp2, input.tile_length);
    
  _addComment("Load tileset");
  
  _stackPush(tmp2);
  _stackPush(tmp1);
  _stackPushConst(`_${tileset.symbol}`);
  _stackPushConst(`___bank_${tileset.symbol}`);
  _stackPush(tmp0);
  		
  _callNative("load_tileset_ex"); 
  _stackPop(5);  
  
};
