export const id = "EVENT_RESET_META_TILE";
export const name = "Reset meta tile";
export const groups = ["Meta Tiles"];

export const autoLabel = (fetchArg) => {
  return `Reset meta tiles`;
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
    key: "commit",
    label: "Commit render",
    type: "checkbox",
    defaultValue: false,
  },
];

export const compile = (input, helpers) => {

  const { _callNative, _stackPushConst, _stackPop, _addComment, _stackPushScriptValue } = helpers;

  _addComment("Reset metatile");

  _stackPushConst((input.commit)? 1: 0);
  _stackPushScriptValue(input.y);
  _stackPushScriptValue(input.x);

  _callNative("vm_reset_meta_tile");
  _stackPop(3);
};
