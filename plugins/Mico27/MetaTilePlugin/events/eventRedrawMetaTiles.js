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
  {
    key: "relative_to_scroll",
    label: "Position relative to camera scroll",
    description:
      "When enabled, X/Y are screen coordinates: (0,0) is the top-left tile currently visible and the camera's scroll position is added automatically. When disabled, they are absolute scene tile coordinates.",
    type: "checkbox",
    width: "100%",
  },
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPushConst, _stackPushScriptValue, _stackPop, _addComment } = helpers;

  _addComment("Redraw meta tiles");

  // Pushed first so it lands in the deepest argument slot and every existing
  // argument index stays where it was.
  _stackPushConst(input.relative_to_scroll ? 1 : 0);

  _stackPushScriptValue(input.height);
  _stackPushScriptValue(input.width);
  _stackPushScriptValue(input.y);
  _stackPushScriptValue(input.x);

  _callNative("vm_redraw_metatiles");
  _stackPop(5);
};
