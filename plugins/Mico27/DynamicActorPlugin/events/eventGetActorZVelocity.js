const l10n = require("../helpers/l10n").default;

export const id = "EVENT_GET_ACTOR_Z_VELOCITY";
export const name = "Get actor z velocity";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = () => {
  return "Get actor z velocity";
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
    key: "variable",
    label: l10n("FIELD_VARIABLE"),
    description: l10n("FIELD_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
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
    getVariableAlias,
    _stackPushConst,
    _isIndirectVariable,
    _setInd,
  } = helpers;

  const tmp0 = _declareLocal("tmp0", 1, true);

  setActorId(tmp0, input.actorId);

  const variableAlias = getVariableAlias(input.variable);
  let dest = variableAlias;
  if (_isIndirectVariable(input.variable)) {
    const zvel_result = _declareLocal("zvel_result", 1, true);
    dest = zvel_result;
  }

  _addComment("Get actor z velocity");

  _stackPushConst(dest);
  _stackPush(tmp0);

  _callNative("vm_get_actor_velocity_z");
  _stackPop(2);

  if (_isIndirectVariable(input.variable)) {
    _setInd(variableAlias, dest);
  }
};
