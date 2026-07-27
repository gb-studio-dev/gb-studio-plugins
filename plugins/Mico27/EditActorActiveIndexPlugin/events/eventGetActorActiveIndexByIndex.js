export const id = "EVENT_GET_ACTOR_ACTIVE_INDEX_BY_INDEX";
export const name = "Get Actor Active Index By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Get active index of actor ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to get the active index of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "variable",
    label: "Variable",
    description: "Variable to store the active index in.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  }
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPush, _stackPop, _addComment, _declareLocal, variableSetToScriptValue, getVariableAlias, _stackPushConst, _isIndirectVariable, _setInd } = helpers;

  const variableAlias = getVariableAlias(input.variable);
  let dest = variableAlias;
  if (_isIndirectVariable(input.variable)) {
    const index_result = _declareLocal("index_result", 1, true);
    dest = index_result;
  }

  const tmp0 = _declareLocal("tmp0", 1, true);
  variableSetToScriptValue(tmp0, input.actorIndex);

  _addComment("Get Actor Active Index By Index");

  _stackPushConst(dest);
  _stackPush(tmp0);

  _callNative("get_actor_active_index");
  _stackPop(2);

  if (_isIndirectVariable(input.variable)) {
    _setInd(variableAlias, dest);
  }

};
