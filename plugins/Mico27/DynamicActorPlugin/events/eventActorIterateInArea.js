export const id = "EVENT_DYNAMIC_ACTOR_ITERATE_IN_AREA";
export const name = "Actor Iterate In Area";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

export const autoLabel = (fetchArg, input) => {
  const anchor = input.relativeToScroll === true ? " on screen" : "";
  return `For each actor in area${anchor} ${fetchArg("x")},${fetchArg("y")} ${fetchArg("width")}x${fetchArg("height")}`;
};

export const fields = [
  {
    type: "group",
    fields: [
      {
        key: "x",
        label: "X",
        description: "Left edge of the area.",
        type: "value",
        min: 0,
        defaultValue: { type: "number", value: 0 },
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
      {
        key: "y",
        label: "Y",
        description: "Top edge of the area.",
        type: "value",
        min: 0,
        defaultValue: { type: "number", value: 0 },
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
    ],
  },
  {
    type: "group",
    fields: [
      {
        key: "width",
        label: "Width",
        description: "Width of the area. 0 matches only the row of the top-left cell.",
        type: "value",
        min: 0,
        defaultValue: { type: "number", value: 1 },
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
      {
        key: "height",
        label: "Height",
        description: "Height of the area. 0 matches only the column of the top-left cell.",
        type: "value",
        min: 0,
        defaultValue: { type: "number", value: 1 },
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
    ],
  },
  {
    key: "relativeToScroll",
    label: "Relative to scroll",
    description:
      "When checked, X and Y are measured from the top-left corner of what is currently on screen instead of from the top-left of the scene, so the area follows the camera. Unchecked, the area is a fixed position in the scene.",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "test",
    label: "Match",
    description:
      "Origin: the actor's position must be inside the area. Bounding box: the actor's collision box must overlap the area.",
    type: "select",
    options: [
      ["origin", "Actor origin is inside area"],
      ["bounds", "Actor bounding box overlaps area"],
    ],
    defaultValue: "origin",
  },
  {
    key: "activeOnly",
    label: "Skip inactive actors",
    description:
      "When checked, actors that are currently deactivated (offscreen or manually deactivated) are not visited.",
    type: "checkbox",
    defaultValue: true,
  },
  {
    key: "includePlayer",
    label: "Include the player",
    description: "When checked, actor index 0 (the player) can be visited too.",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "variable",
    label: "Store actor index in",
    description:
      "Variable that receives the index of the current actor before each iteration of the script below.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "__scriptTabs",
    type: "tabs",
    defaultValue: "true",
    values: {
      true: "For Each Actor",
    },
  },
  {
    key: "true",
    label: "For Each Actor",
    description: "Script to run once per matching actor.",
    type: "events",
  },
];

export const compile = (input, helpers) => {
  const featureEnabled = (key) => {
    const fv =
      helpers.engineFieldValues && helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  if (!featureEnabled("DYNAMIC_ACTOR_ENABLE_ACTOR_ITERATION")) {
    throw new Error(
      'This event requires the "Iterate actors in area" engine setting to be enabled (Settings → Engine → Dynamic actor).',
    );
  }

  const {
    _addComment,
    _addNL,
    _declareLocal,
    _localRef,
    _setConst,
    _stackPushConst,
    _stackPushScriptValue,
    _callNative,
    _stackPop,
    _ifConst,
    _label,
    _jump,
    getNextLabel,
    _compilePath,
    getVariableAlias,
    _isIndirectVariable,
    _set,
    _setInd,
  } = helpers;

  // Bit layout must stay in sync with ACTOR_AREA_* in vm_dynamic_actor.c
  let options = 0;
  if (input.units === "pixels") options |= 0x01;
  if (input.activeOnly !== false) options |= 0x02;
  if (input.includePlayer !== true) options |= 0x04;
  if (input.test === "bounds") options |= 0x08;
  if (input.relativeToScroll === true) options |= 0x10;

  // [0] = found actor index (out), [1] = scan cursor (in/out).
  // The name is derived from this event instance so that nested iterations get
  // their own slots, and it is re-declared after the body so that the locals
  // packer keeps the block alive for the whole loop.
  const localName = `da_iter_${String(helpers.event && helpers.event.id).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}`;
  const stateRef = _declareLocal(localName, 2, false);
  const alias = getVariableAlias(input.variable);
  const indirect = _isIndirectVariable(input.variable);

  const loopLabel = getNextLabel();
  const endLabel = getNextLabel();

  _addComment("Actor Iterate In Area");
  _setConst(_localRef(stateRef, 1), 0);

  _label(loopLabel);
  _stackPushConst(stateRef);
  _stackPushScriptValue(input.x);
  _stackPushScriptValue(input.y);
  _stackPushScriptValue(input.width);
  _stackPushScriptValue(input.height);
  _stackPushConst(options);
  _callNative("vm_actor_find_in_area");
  _stackPop(6);

  _ifConst(".EQ", stateRef, 255, endLabel, 0);

  if (indirect) {
    _setInd(alias, stateRef);
  } else {
    _set(alias, stateRef);
  }

  _compilePath(input.true);

  // Extend the lifetime of the state block past the body
  _declareLocal(localName, 2, false);

  _jump(loopLabel);
  _label(endLabel);
  _addNL();
};
