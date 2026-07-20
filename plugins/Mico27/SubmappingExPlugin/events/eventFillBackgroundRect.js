export const id = "EVENT_FILL_BACKGROUND_RECT";
export const name = "Fill background rectangle with tile";
export const groups = ["EVENT_GROUP_SCREEN"];

export const autoLabel = (fetchArg) => {
  return `Fill background rectangle with tile`;
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
    key: `tile_id`,
    label: "Tile id",
    type: "value",
    defaultValue: { type: "number", value: 0 },
  },
];

export const compile = (input, helpers) => {
  const __submapFeatureEnabled = (key) => {
    const fv = helpers.engineFieldValues && helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  if (!__submapFeatureEnabled("SUBMAP_ENABLE_FILL_BACKGROUND")) {
    throw new Error("This event requires the \"Fill background rectangle (tile and attribute)\" engine setting to be enabled (Settings → Engine → Submapping Ex).");
  }

  const { _callNative, _stackPushScriptValue, _stackPop, _addComment } = helpers;
  _addComment("Fill background rectangle with tile");
  _stackPushScriptValue(input.tile_id);
  _stackPushScriptValue(input.h);
  _stackPushScriptValue(input.w);
  _stackPushScriptValue(input.y);
  _stackPushScriptValue(input.x);
  _callNative("vm_fill_background_rect");
  _stackPop(5);
};
