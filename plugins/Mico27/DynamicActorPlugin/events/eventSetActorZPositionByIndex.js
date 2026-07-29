const l10n = require("../helpers/l10n").default;

export const id = "EVENT_SET_ACTOR_Z_POSITION_BY_INDEX";
export const name = "Set actor z position By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = () => {
  return "Set actor z position";
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the Z position of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "zPosition",
    label: "Z position",
    description: "Actor Z position in subpixels (16 = 1 pixel)",
    type: "value",
    min: 0,
    max: 32767,
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

  _addComment("Set actor z position By Index");

  _stackPushScriptValue(input.zPosition);
  _stackPush(tmp0);

  _callNative("vm_set_actor_z_position");
  _stackPop(2);
};
