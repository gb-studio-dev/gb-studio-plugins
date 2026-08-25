export const id = "EVENT_REFRESH_BACKGROUND_RECT";
export const name = "Refresh background rectangle";
export const groups = ["EVENT_GROUP_SCREEN"];

export const autoLabel = (fetchArg) => {
  return `Refresh background rectangle`;
};

export const fields = [
  {
    type: "group",
    fields: [
      {
        key: `x`,
        label: "X",
        type: "value",
        width: "50%",
        defaultValue: { type: "number", value: 0 },
      },
      {
        key: `y`,
        label: "Y",
        type: "value",
        width: "50%",
        defaultValue: { type: "number", value: 0 },
      },
    ],
  },
  {
    type: "group",
    fields: [
      {
        key: `w`,
        label: "Width",
        type: "value",
        width: "50%",
        defaultValue: { type: "number", value: 1 },
      },
      {
        key: `h`,
        label: "Height",
        type: "value",
        width: "50%",
        defaultValue: { type: "number", value: 1 },
      },
    ],
  },
  {
    key: "relative_to_scroll",
    label: "Coordinates relative to camera scroll",
    description:
      "When enabled, X/Y are screen coordinates: (0,0) is the top-left tile currently visible and the camera's scroll position is added automatically. When disabled, X/Y are absolute scene tile coordinates.",
    type: "checkbox",
    width: "100%",
  },
];

export const compile = (input, helpers) => {
  const __submapFeatureEnabled = (key) => {
    const fv = helpers.engineFieldValues && helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  if (!__submapFeatureEnabled("SUBMAP_ENABLE_REFRESH_BACKGROUND")) {
    throw new Error("This event requires the \"Refresh background rectangle (reload original scene tiles)\" engine setting to be enabled (Settings → Engine → Submapping Ex).");
  }

  const { _callNative, _stackPushScriptValue, _stackPushConst, _stackPop, _addComment } = helpers;
  _addComment("Refresh background rectangle");
  _stackPushConst(input.relative_to_scroll ? 1 : 0);
  _stackPushScriptValue(input.h);
  _stackPushScriptValue(input.w);
  _stackPushScriptValue(input.y);
  _stackPushScriptValue(input.x);
  _callNative("vm_refresh_background_rect");
  _stackPop(5);
};
