const l10n = require("../helpers/l10n").default;

export const id = "EVENT_GET_ACTOR_Y_VELOCITY";
export const name = "Get actor y velocity";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = () => {
  return "Get actor y velocity";
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
    const yvel_result = _declareLocal("yvel_result", 1, true);
    dest = yvel_result;
  }

  _addComment("Get actor y velocity");

  _stackPushConst(dest);
  _stackPush(tmp0);

  _callNative("vm_get_actor_velocity_y");
  _stackPop(2);

  if (_isIndirectVariable(input.variable)) {
    _setInd(variableAlias, dest);
  }
};
