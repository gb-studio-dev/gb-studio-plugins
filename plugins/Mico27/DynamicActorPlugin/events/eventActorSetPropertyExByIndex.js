export const id = "EVENT_DYNAMIC_ACTOR_SET_PROPERTY_BY_INDEX";
export const name = "Actor Set Property (Extended) By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

export const autoLabel = (fetchArg) => {
  return `Set ${fetchArg("property")} of actor ${fetchArg("actorIndex")} to ${fetchArg("value")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to modify (0 = the player).",
    type: "value",
    defaultValue: { type: "number", value: 0 },
  },
  {
    key: "property",
    label: "Property",
    description:
      "Actor field to write. 'Is active' is not writable here because the engine keeps active actors in a linked list - use the stock Activate / Deactivate Actor events instead.",
    type: "select",
    options: [
      ["9", "Collision group"],
      ["10", "Collision group extra flags"],
      ["11", "Collision group (raw byte)"],
      ["2", "Is hidden"],
      ["3", "Is pinned"],
      ["4", "Is persistent"],
      ["5", "Is disabled"],
      ["6", "Collisions enabled"],
      ["7", "Animation loop disabled"],
      ["8", "Interrupt flag"],
      ["0", "Flags (raw byte)"],
      ["12", "Direction"],
      ["13", "Move speed (subpixels per frame)"],
      ["14", "Animation state"],
      ["15", "Animation tick"],
      ["16", "Animation frame"],
      ["17", "Animation frame start"],
      ["18", "Animation frame end"],
      ["19", "Base sprite tile"],
      ["20", "Reserved sprite tiles"],
      ["21", "Bounds left (subpixels)"],
      ["22", "Bounds right (subpixels)"],
      ["23", "Bounds top (subpixels)"],
      ["24", "Bounds bottom (subpixels)"],
    ],
    defaultValue: "9",
  },
  {
    key: "value",
    label: "Value",
    description:
      "Value to write. Boolean properties treat 0 as off and anything else as on. Collision groups are 0 = none, 1 = player, 2 = group 1, 4 = group 2, 8 = group 3.",
    type: "value",
    defaultValue: { type: "number", value: 0 },
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
  if (!featureEnabled("DYNAMIC_ACTOR_ENABLE_ACTOR_PROPERTIES")) {
    throw new Error(
      'This event requires the "Get / Set extended actor properties" engine setting to be enabled (Settings → Engine → Dynamic actor).',
    );
  }

  const {
    _addComment,
    _addNL,
    _stackPushConst,
    _stackPushScriptValue,
    _callNative,
    _stackPop,
  } = helpers;

  _addComment("Actor Set Property (Extended)");
  _stackPushScriptValue(input.actorIndex);
  _stackPushConst(Number(input.property) || 0);
  _stackPushScriptValue(input.value);
  _callNative("vm_actor_set_property");
  _stackPop(3);
  _addNL();
};
