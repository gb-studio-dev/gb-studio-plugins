export const id = "EVENT_REDRAW_META_TILES";
export const name = "Redraw meta tiles";
export const groups = ["Meta Tiles"];

export const autoLabel = (fetchArg) => {
  return `Redraw meta tiles`;
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
    key: `width`,
    label: "Width",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 1,
    },
  },
  {
    key: `height`,
    label: "Height",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 1,
    },
  },
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPushScriptValue, _stackPop, _addComment } = helpers;

  _addComment("Redraw meta tiles");

  _stackPushScriptValue(input.height);
  _stackPushScriptValue(input.width);
  _stackPushScriptValue(input.y);
  _stackPushScriptValue(input.x);

  _callNative("vm_redraw_metatiles");
  _stackPop(4);
};
