export const id = "EVENT_TRIGGER_SET_BOUNDS";
export const name = "Trigger Set Bounds";
export const groups = ["Triggers"];

export const autoLabel = (fetchArg) => {
  return `Set bounds of trigger ${fetchArg("triggerIndex")}`;
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
        key: "left",
        label: "Left",
        description: "Left tile.",
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: { type: "number", value: 0 },
      },
      {
        key: "right",
        label: "Right",
        description: "Right tile (inclusive). Must be >= Left.",
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: { type: "number", value: 0 },
      },
    ],
  },
  {
    type: "group",
    wrapItems: true,
    fields: [
      {
        key: "top",
        label: "Top",
        description: "Top tile.",
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: { type: "number", value: 0 },
      },
      {
        key: "bottom",
        label: "Bottom",
        description: "Bottom tile (inclusive). Must be >= Top.",
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
  _addComment("Trigger Set Bounds");
  _stackPushScriptValue(input.triggerIndex);
  _stackPushScriptValue(input.left);
  _stackPushScriptValue(input.right);
  _stackPushScriptValue(input.top);
  _stackPushScriptValue(input.bottom);
  _callNative("vm_trigger_set_bounds");
  _stackPop(5);
};
