export const id = "EVENT_REPLACE_META_TILE";
export const name = "Replace meta tile";
export const groups = ["Meta Tiles"];

export const autoLabel = (fetchArg) => {
  return `Assign meta tiles`;
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
    key: `metatile_id`,
    label: "Metatile Id",
    type: "value",
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

  _addComment("Replace metatile");

  _stackPushConst((input.commit)? 1: 0);
  _stackPushScriptValue(input.metatile_id);
  _stackPushScriptValue(input.y);
  _stackPushScriptValue(input.x);

  _callNative("vm_replace_meta_tile");
  _stackPop(4);
};
