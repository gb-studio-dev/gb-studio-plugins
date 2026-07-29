const l10n = require("../helpers/l10n").default;

export const id = "EVENT_GET_ACTOR_Z_POSITION_BY_INDEX";
export const name = "Get actor z position By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = () => {
  return "Get actor z position";
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to get the Z position of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
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
    variableSetToScriptValue,
    _callNative,
    _stackPush,
    _stackPop,
    _addComment,
    _declareLocal,
    getVariableAlias,
    _stackPushConst,
    _isIndirectVariable,
    _setInd,
  } = helpers;

  const tmp0 = _declareLocal("tmp0", 1, true);

  variableSetToScriptValue(tmp0, input.actorIndex);

  const variableAlias = getVariableAlias(input.variable);
  let dest = variableAlias;
  if (_isIndirectVariable(input.variable)) {
    const zpos_result = _declareLocal("zpos_result", 1, true);
    dest = zpos_result;
  }

  _addComment("Get actor z position By Index");

  _stackPushConst(dest);
  _stackPush(tmp0);

  _callNative("vm_get_actor_z_position");
  _stackPop(2);

  if (_isIndirectVariable(input.variable)) {
    _setInd(variableAlias, dest);
  }
};
