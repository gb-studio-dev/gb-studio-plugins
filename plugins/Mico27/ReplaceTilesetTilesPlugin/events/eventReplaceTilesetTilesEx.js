export const id = "EVENT_REPLACE_TILESET_TILES_EX";
export const name = "Replace Tileset Tiles Ex";
export const groups = ["EVENT_GROUP_SCENE"];
export const subGroups = {
  EVENT_GROUP_SCENE: "EVENT_GROUP_TILES",
};

export const autoLabel = (fetchArg) => {
  return `Replace Tileset Tiles Ex`;
};

export const fields = [
  {
  	key: `tileset_bank`,
  	label: "Tileset bank",
  	type: "value",
  	width: "50%",
  	defaultValue: {
  	type: "number",
  	value: 0,
  	},
  },
  {
  	key: `tileset_ptr`,
  	label: "Tileset Pointer",
  	type: "value",
  	width: "50%",
  	defaultValue: {
  	type: "number",
  	value: 0,
  	},  	
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
    key: `tile_length`,
    label: "Length",
    type: "value",
  	width: "50%",
  	defaultValue: {
  	type: "number",
  	value: 1,
  	},  	
  },
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPop, _addComment, _stackPushScriptValue } = helpers;
          
  _addComment("Replace tiles Ex");
  
  _stackPushScriptValue(input.tileset_ptr);
  _stackPushScriptValue(input.tileset_bank);
  _stackPushScriptValue(input.idx_target_tile);
  _stackPushScriptValue(input.idx_start_tile);
  _stackPushScriptValue(input.tile_length);    
  
  _callNative("replace_tiles_ex");
  
  _stackPop(5);
};
