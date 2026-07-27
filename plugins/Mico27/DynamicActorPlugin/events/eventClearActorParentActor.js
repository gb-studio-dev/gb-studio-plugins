const l10n = require("../helpers/l10n").default;

export const id = "EVENT_CLEAR_ACTOR_PARENT_ACTOR";
export const name = "Clear Actor Parent Actor";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Clear Actor Parent Actor : ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: "Actor to remove the parent from",
    type: "actor",
    defaultValue: "$self$",
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

  const { _callNative, _stackPush, _stackPushConst, _stackPop, _addComment, _declareLocal, setActorId } =
    helpers;

  const tmp0 = _declareLocal("tmp0", 1, true);
  setActorId(tmp0, input.actorId);

  _addComment("Clear Actor Parent Actor");

  _stackPushConst(255);
  _stackPush(tmp0);

  _callNative("vm_set_actor_parent");
  _stackPop(2);
};

