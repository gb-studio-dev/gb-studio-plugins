export const id = "EVENT_REPLACE_COLLISION_16";
export const name = "Replace collision (16px metatile)";
export const groups = ["Meta Tiles"];

export const autoLabel = (fetchArg) => {
  return `Replace collision (16px metatile)`;
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

  const { _callNative, _stackPop, _addComment, _stackPushScriptValue } = helpers;

  _addComment("Replace collision");

  _stackPushScriptValue(input.collision_br);
  _stackPushScriptValue(input.collision_bl);
  _stackPushScriptValue(input.collision_tr);
  _stackPushScriptValue(input.collision_tl);
  _stackPushScriptValue(input.metatile_id);

  _callNative("vm_replace_collision");
  _stackPop(5);
};
