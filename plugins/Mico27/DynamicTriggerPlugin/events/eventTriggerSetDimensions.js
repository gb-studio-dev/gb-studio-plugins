export const id = "EVENT_TRIGGER_SET_DIMENSIONS";
export const name = "Trigger Set Dimensions";
export const groups = ["Triggers"];

export const autoLabel = (fetchArg) => {
  return `Set size of trigger ${fetchArg("triggerIndex")} to ${fetchArg("width")} x ${fetchArg("height")}`;
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
        key: "width",
        label: "Width",
        description: "New width in tiles (anchored at the trigger top-left corner). Minimum 1.",
        type: "value",
        min: 1,
        max: 255,
        width: "50%",
        defaultValue: { type: "number", value: 1 },
      },
      {
        key: "height",
        label: "Height",
        description: "New height in tiles (anchored at the trigger top-left corner). Minimum 1.",
        type: "value",
        min: 1,
        max: 255,
        width: "50%",
        defaultValue: { type: "number", value: 1 },
      },
    ],
  },
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPushScriptValue, _stackPop, _addComment } = helpers;
  _addComment("Trigger Set Dimensions");
  _stackPushScriptValue(input.triggerIndex);
  _stackPushScriptValue(input.width);
  _stackPushScriptValue(input.height);
  _callNative("vm_trigger_set_dimensions");
  _stackPop(3);
};
