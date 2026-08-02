const l10n = require("../helpers/l10n").default;

export const id = "EVENT_GET_ACTOR_X_VELOCITY_BY_INDEX";
export const name = "Get actor x velocity By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Get x velocity of actor ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to get the x velocity of.",
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
    const xvel_result = _declareLocal("xvel_result", 1, true);
    dest = xvel_result;
  }

  _addComment("Get actor x velocity By Index");

  _stackPushConst(dest);
  _stackPush(tmp0);

  _callNative("vm_get_actor_velocity_x");
  _stackPop(2);

  if (_isIndirectVariable(input.variable)) {
    _setInd(variableAlias, dest);
  }
};
