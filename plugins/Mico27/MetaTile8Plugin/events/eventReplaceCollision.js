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
    key: `collision`,
    label: "Collision",
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
	
  variableSetToScriptValue(tmp0, input.metatile_id);
  variableSetToScriptValue(tmp1, input.collision);
  
  _addComment("Replace collision");
  
  _stackPush(tmp1);
  _stackPush(tmp0);
  		
  _callNative("vm_replace_collision");
  _stackPop(2);   
};
