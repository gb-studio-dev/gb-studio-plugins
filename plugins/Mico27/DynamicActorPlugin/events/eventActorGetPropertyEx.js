export const id = "EVENT_DYNAMIC_ACTOR_GET_PROPERTY";
export const name = "Actor Get Property (Extended)";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

export const autoLabel = (fetchArg) => {
  return `Get ${fetchArg("property")} of actor ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: "Actor",
    description:
      "Actor to read.",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "property",
    label: "Property",
    description: "Actor field to read.",
    type: "select",
    options: [
      ["1", "Is active"],
      ["2", "Is hidden"],
      ["3", "Is pinned"],
      ["4", "Is persistent"],
      ["5", "Is disabled"],
      ["6", "Collisions enabled"],
      ["7", "Animation loop disabled"],
      ["8", "Interrupt flag"],
      ["0", "Flags (raw byte)"],
      ["9", "Collision group"],
      ["10", "Collision group extra flags"],
      ["11", "Collision group (raw byte)"],
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
      ["25", "Has an On Interact / On Hit script"],
      ["26", "Has an On Update script"],
      ["27", "On Update script is running"],
      ["28", "On Update thread handle"],
      ["29", "On Hit thread handle"],
    ],
    defaultValue: "1",
  },
  {
    key: "variable",
    label: "Store in",
    description: "Variable that receives the property value.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
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
    setActorId,
    _stackPush,
    _addComment,
    _addNL,
    _declareLocal,
    _stackPushConst,
    _callNative,
    _stackPop,
    getVariableAlias,
    _isIndirectVariable,
    _setInd,
  } = helpers;

  const alias = getVariableAlias(input.variable);
  const indirect = _isIndirectVariable(input.variable);
  const dest = indirect ? _declareLocal("da_prop", 1, true) : alias;

  const actorRef = _declareLocal("actor_idx", 1, true);
  setActorId(actorRef, input.actorId);

  _addComment("Actor Get Property (Extended)");
  _stackPushConst(dest);
  _stackPush(actorRef);
  _stackPushConst(Number(input.property) || 0);
  _callNative("vm_actor_get_property");
  _stackPop(3);

  if (indirect) {
    _setInd(alias, dest);
  }
  _addNL();
};
