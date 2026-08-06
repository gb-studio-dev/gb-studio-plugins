export const id = "EVENT_REPLACE_BACKGROUND_TILE";
export const name = "Set background tile";
export const groups = ["EVENT_GROUP_SCREEN"];

export const autoLabel = (fetchArg) => {
  return `Set background tile`;
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
    key: `tile_id`,
    label: "Tile id",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
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
  if (!__submapFeatureEnabled("SUBMAP_ENABLE_TILE_GET_SET")) {
    throw new Error("This event requires the \"Individual tile getters/setters\" engine setting to be enabled (Settings → Engine → Submapping Ex).");
  }

  const { _callNative, _stackPushScriptValue, _stackPushConst, _stackPop, _addComment } = helpers;
  _addComment("Replace background tile");
  _stackPushConst(input.relative_to_scroll ? 1 : 0);
  _stackPushScriptValue(input.tile_id);
  _stackPushScriptValue(input.y);
  _stackPushScriptValue(input.x);
  _callNative("vm_replace_background_tile");
  _stackPop(4);
};
