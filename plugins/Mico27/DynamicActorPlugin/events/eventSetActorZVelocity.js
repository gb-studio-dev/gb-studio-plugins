const l10n = require("../helpers/l10n").default;

export const id = "EVENT_SET_ACTOR_Z_VELOCITY";
export const name = "Set actor z velocity";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = () => {
  return "Set actor z velocity";
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_DEACTIVATE_DESC"),
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "zVelocity",
    label: "Z velocity",
    description: "Actor Z velocity in subpixels per frame (16 = 1 pixel/frame)",
    type: "value",
    min: -128,
    max: 127,
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
  __requireEngineField("DYNAMIC_ACTOR_ENABLE_MOVE_Z", "Topdown Z axis");

  const {
    _callNative,
    _stackPush,
    _stackPop,
    _addComment,
    _declareLocal,
    setActorId,
    _stackPushScriptValue,
  } = helpers;

  const tmp0 = _declareLocal("tmp0", 1, true);

  setActorId(tmp0, input.actorId);

  _addComment("Set actor z velocity");

  _stackPushScriptValue(input.zVelocity);
  _stackPush(tmp0);

  _callNative("vm_set_actor_velocity_z");
  _stackPop(2);
};
