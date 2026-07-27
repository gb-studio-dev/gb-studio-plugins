export const id = "EVENT_SET_ACTOR_LINKED_ACTOR_BY_INDEX";
export const name = "Set Actor Parent Actor By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Set actor ${fetchArg("actorIndex")} to follow actor ${fetchArg("linkedActorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor that will be given a parent.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "linkedActorIndex",
    label: "Parent Actor Index",
    description:
      "Index of the actor to follow. From now on, the actor inherits the parent's per-frame movement (tile-collision checked) every frame, in addition to its own behavior physics if it has one - until its parent is changed or cleared.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 1,
    },
  },
];

export const compile = (input, helpers) => {
  const __engineFieldOn = (key) => {
    const fv =
      helpers.engineFieldValues &&
      helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  const __requireEngineField = (key, label) => {
    if (!__engineFieldOn(key)) {
      throw new Error(
        `This event requires the "${label}" engine setting to be enabled (Settings → Engine fields → Dynamic actor).`
      );
    }
  };
  __requireEngineField("DYNAMIC_ACTOR_ENABLE_PARENT", "Component: Parent actors / moving platforms");

  const {
    _callNative,
    _stackPop,
    _addComment,
    _stackPushScriptValue,
  } = helpers;

  _addComment("Set Actor Parent Actor By Index");

  _stackPushScriptValue(input.linkedActorIndex);
  _stackPushScriptValue(input.actorIndex);

  _callNative("vm_set_actor_parent");
  _stackPop(2);
};


