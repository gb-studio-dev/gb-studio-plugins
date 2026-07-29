export const id = "EVENT_CLEAR_ACTOR_PARENT_ACTOR_BY_INDEX";
export const name = "Clear Actor Parent Actor By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Clear Actor Parent Actor : ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to remove the parent from.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
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

  const { variableSetToScriptValue, _callNative, _stackPush, _stackPushConst, _stackPop, _addComment, _declareLocal } =
    helpers;

  const tmp0 = _declareLocal("tmp0", 1, true);
  variableSetToScriptValue(tmp0, input.actorIndex);

  _addComment("Clear Actor Parent Actor By Index");

  _stackPushConst(255);
  _stackPush(tmp0);

  _callNative("vm_set_actor_parent");
  _stackPop(2);
};

