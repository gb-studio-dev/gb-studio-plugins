export const id = "EVENT_GET_META_TILE_COLLISION_AT_POS";
export const name = "Get meta tile collision at position";
export const groups = ["Meta Tiles"];

export const autoLabel = (fetchArg) => {
  return `Get meta tile collision at position`;
};

export const fields = [
  {
    key: `x`,
    label: "X",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: `y`,
    label: "Y",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
      key: "output",
      label: "Variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE",
  },
];

export const compile = (input, helpers) => {

  const { _callNative, _stackPushConst, _stackPop, _addComment, getVariableAlias, _stackPushScriptValue } = helpers;

  const variableAlias = getVariableAlias(input.output);

  _addComment("Get metatile collision at position");

  _stackPushConst(variableAlias);
  _stackPushScriptValue(input.y);
  _stackPushScriptValue(input.x);

  _callNative("vm_get_collision_at_pos");
  _stackPop(3);
};
