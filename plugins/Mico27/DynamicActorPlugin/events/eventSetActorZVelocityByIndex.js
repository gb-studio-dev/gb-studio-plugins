const l10n = require("../helpers/l10n").default;

export const id = "EVENT_SET_ACTOR_Z_VELOCITY_BY_INDEX";
export const name = "Set actor z velocity By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = () => {
  return "Set actor z velocity";
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the Z velocity of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
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
    variableSetToScriptValue,
    _callNative,
    _stackPush,
    _stackPop,
    _addComment,
    _declareLocal,
    _stackPushScriptValue,
  } = helpers;

  const tmp0 = _declareLocal("tmp0", 1, true);

  variableSetToScriptValue(tmp0, input.actorIndex);

  _addComment("Set actor z velocity By Index");

  _stackPushScriptValue(input.zVelocity);
  _stackPush(tmp0);

  _callNative("vm_set_actor_velocity_z");
  _stackPop(2);
};
