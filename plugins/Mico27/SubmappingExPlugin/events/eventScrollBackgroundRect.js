export const id = "EVENT_SCROLL_BACKGROUND_RECT";
export const name = "Scroll background rectangle by 1 tile";
export const groups = ["EVENT_GROUP_SCREEN"];

export const autoLabel = (fetchArg) => {
  return `Scroll background rectangle by 1 tile`;
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
    key: "direction",
    label: "Direction",
    type: "select",
    width: "50%",
    options: [
      ["up", "Up"],
      ["down", "Down"],
      ["left", "Left"],
      ["right", "Right"],
    ],
    defaultValue: "up",
  },
  {
    key: `fill_tile_id`,
    label: "Fill tile id",
    description:
      "Tile id written into the row/column newly exposed by the scroll.",
    type: "value",
    width: "50%",
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
  if (!__submapFeatureEnabled("SUBMAP_ENABLE_SCROLL_RECT")) {
    throw new Error("This event requires the \"Scroll rectangle by 1 tile\" engine setting to be enabled (Settings → Engine → Submapping Ex).");
  }
  const __dirFlag = {
    down: "SUBMAP_ENABLE_SCROLL_RECT_DOWN",
    left: "SUBMAP_ENABLE_SCROLL_RECT_LEFT",
    right: "SUBMAP_ENABLE_SCROLL_RECT_RIGHT",
  };
  if (__dirFlag[input.direction] && !__submapFeatureEnabled(__dirFlag[input.direction])) {
    throw new Error(`This event scrolls ${input.direction}, which requires the "Scroll rectangle ${input.direction}" engine setting to be enabled (Settings → Engine → Submapping Ex).`);
  }

  const { _callNative, _stackPushScriptValue, _stackPushConst, _stackPop, _addComment } = helpers;
  const dirMap = { up: 0, down: 1, left: 2, right: 3 };
  _addComment("Scroll background rectangle by 1 tile");
  _stackPushScriptValue(input.fill_tile_id);
  _stackPushConst(dirMap[input.direction] || 0);
  _stackPushScriptValue(input.h);
  _stackPushScriptValue(input.w);
  _stackPushScriptValue(input.y);
  _stackPushScriptValue(input.x);
  _callNative("vm_scroll_background_rect");
  _stackPop(6);
};
