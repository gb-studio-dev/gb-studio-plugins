export const id = "EVENT_REPLACE_COLLISION";
export const name = "Replace collision";
export const groups = ["Meta Tiles"];

export const autoLabel = (fetchArg) => {
  return `Assign meta collision`;
};

export const fields = [ 
  {
    key: `metatile_id`,
    label: "Metatile Id",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  }, 
  {
    key: `collision_tl`,
    label: "Collision Top Left",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  }, 
  {
    key: `collision_tr`,
    label: "Collision Top Right",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  }, 
  {
    key: `collision_bl`,
    label: "Collision Bottom Left",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  }, 
  {
    key: `collision_br`,
    label: "Collision Bottom Right",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  }, 
];

export const compile = (input, helpers) => {
  
  const { _callNative, _stackPush, _stackPushConst, _stackPop, _addComment, _declareLocal, variableSetToScriptValue } = helpers;
  
  const tmp0 = _declareLocal("tmp0", 1, true);
  const tmp1 = _declareLocal("tmp1", 1, true);
  const tmp2 = _declareLocal("tmp2", 1, true);
  const tmp3 = _declareLocal("tmp3", 1, true);
  const tmp4 = _declareLocal("tmp4", 1, true);
	
  variableSetToScriptValue(tmp0, input.metatile_id);
  variableSetToScriptValue(tmp1, input.collision_tl);
  variableSetToScriptValue(tmp2, input.collision_tr);
  variableSetToScriptValue(tmp3, input.collision_bl);
  variableSetToScriptValue(tmp4, input.collision_br);
  
  _addComment("Replace collision");
  
  _stackPush(tmp4);
  _stackPush(tmp3);
  _stackPush(tmp2);
  _stackPush(tmp1);
  _stackPush(tmp0);
  		
  _callNative("vm_replace_collision");
  _stackPop(5);   
};
