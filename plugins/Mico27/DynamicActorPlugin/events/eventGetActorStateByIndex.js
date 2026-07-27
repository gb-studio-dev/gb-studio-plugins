export const id = "EVENT_GET_ACTOR_STATE_BY_INDEX";
export const name = "Get Actor State By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Get state of actor ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to get the state of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "variable",
    label: "Variable",
    description: "Variable to store the state id in.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  }
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPop, _addComment, getVariableAlias, _stackPushConst, _stackPushScriptValue, _isIndirectVariable, _setInd, _declareLocal } = helpers;

  const variableAlias = getVariableAlias(input.variable);
  let dest = variableAlias;
  if (_isIndirectVariable(input.variable)) {
    const state_result = _declareLocal("state_result", 1, true);
    dest = state_result;
  }

  _addComment("Get Actor State By Index");

  _stackPushConst(dest);
  _stackPushScriptValue(input.actorIndex);

  _callNative("vm_get_actor_state");
  _stackPop(2);

  if (_isIndirectVariable(input.variable)) {
    _setInd(variableAlias, dest);
  }

};
