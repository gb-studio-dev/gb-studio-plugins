export const id = "EVENT_TRIGGER_SET_POSITION";
export const name = "Trigger Set Position";
export const groups = ["Triggers"];

export const autoLabel = (fetchArg) => {
  return `Set position of trigger ${fetchArg("triggerIndex")} to ${fetchArg("x")}, ${fetchArg("y")}`;
};

export const fields = [
  {
    key: "triggerIndex",
    label: "Trigger Index",
    description: "Index of the trigger (0 = first trigger in the scene).",
    type: "value",
    defaultValue: { type: "number", value: 0 },
  },
  {
    type: "group",
    wrapItems: true,
    fields: [
      {
        key: "x",
        label: "X",
        description: "New left tile position. The trigger keeps its current width and height.",
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: { type: "number", value: 0 },
      },
      {
        key: "y",
        label: "Y",
        description: "New top tile position. The trigger keeps its current width and height.",
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: { type: "number", value: 0 },
      },
    ],
  },
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPushScriptValue, _stackPop, _addComment } = helpers;
  _addComment("Trigger Set Position");
  _stackPushScriptValue(input.triggerIndex);
  _stackPushScriptValue(input.x);
  _stackPushScriptValue(input.y);
  _callNative("vm_trigger_set_position");
  _stackPop(3);
};
