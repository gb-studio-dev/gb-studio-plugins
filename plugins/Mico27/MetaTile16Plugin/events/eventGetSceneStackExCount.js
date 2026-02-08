export const id = "EVENT_GET_SCENE_STACK_EX_COUNT";
export const name = "Get scene stack count (EXTENDED)";
export const description = "Get scene stack count (EXTENDED)";
export const groups = ["EVENT_GROUP_SCENE"];
export const subGroups = {
  EVENT_GROUP_SCENE: "EVENT_GROUP_SCENE_STACK",
};

export const autoLabel = (fetchArg) => {
    return `Get scene stack count (EXTENDED)`;
};

export const fields = [
  {
  	key: "output",
  	label: "Variable",
  	type: "variable",
  	defaultValue: "LAST_VARIABLE",
  },
    
];

export const compile = (input, helpers) => {
    
    const { _getMemUInt8, getVariableAlias } = helpers;    
    const variableAlias = getVariableAlias(input.output);
    _getMemUInt8(variableAlias, "scene_stack_ex_count");    
};
