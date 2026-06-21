export const id = "EVENT_ACTOR_GET_INDEX_TO_VARIABLE";
export const name = "Actor Get Index To Variable";
export const groups = ["EVENT_GROUP_ACTOR", "EVENT_GROUP_VARIABLES"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_VARIABLES",
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_ACTOR",
};

export const autoLabel = (fetchArg) => {
  return `Store index of actor ${fetchArg("actorId")} into ${fetchArg("variable")}`;
};

export const fields = [
  {
    key: "actorId",
    label: "Actor",
    description: "Actor whose scene index will be stored.",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "variable",
    label: "Variable",
    description: "Variable to store the actor index in.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

export const compile = (input, helpers) => {
  const { setActorId, getVariableAlias, _declareLocal, _isIndirectVariable, _setInd, _addComment } = helpers;
  _addComment("Actor Get Index To Variable");
  const variableAlias = getVariableAlias(input.variable);
  if (_isIndirectVariable(input.variable)) {
    const tmp = _declareLocal("act_idx_tmp", 1, true);
    setActorId(tmp, input.actorId);
    _setInd(variableAlias, tmp);
  } else {
    setActorId(variableAlias, input.actorId);
  }
};
