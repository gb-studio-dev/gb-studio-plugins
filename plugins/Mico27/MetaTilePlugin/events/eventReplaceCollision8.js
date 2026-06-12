export const id = "EVENT_REPLACE_COLLISION_8";
export const name = "Replace collision (8px metatile)";
export const groups = ["Meta Tiles"];

export const autoLabel = (fetchArg) => {
  return `Replace collision (8px metatile)`;
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

  const { _callNative, _stackPop, _addComment, _stackPushScriptValue } = helpers;

  _addComment("Replace collision");

  _stackPushScriptValue(input.collision);
  _stackPushScriptValue(input.metatile_id);

  _callNative("vm_replace_collision");
  _stackPop(2);
};
