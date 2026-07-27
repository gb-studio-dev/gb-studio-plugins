const l10n = require("../helpers/l10n").default;

export const id = "EVENT_GET_ACTOR_COLLISION";
export const name = "Get actor collision";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Get actor collision`;
};

export const fields = [
  {
    key: "x",
    label: l10n("FIELD_X"),
    description: l10n("FIELD_X_DESC"),
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
    unitsField: "units",
    unitsDefault: "tiles",
    unitsAllowed: ["tiles", "pixels"],
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    description: l10n("FIELD_Y_DESC"),
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
    unitsField: "units",
    unitsDefault: "tiles",
    unitsAllowed: ["tiles", "pixels"],
  },
  {
    key: "variable",
    label: l10n("FIELD_VARIABLE"),
    description: "Variable to store the actor index (-1 if none)",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

const shiftLeftScriptValueConst = (value, num) => {
  return {
    type: "shl",
    valueA: value,
    valueB: {
      type: "number",
      value: num,
    },
  };
};

const scriptValueToPixels = (value, units) => {
  if (units === "pixels") {
    return value;
  }
  return shiftLeftScriptValueConst(value, 3);
};

export const compile = (input, helpers) => {
  const { _callNative, _stackPop, _addComment, getVariableAlias, _stackPushConst, _stackPushScriptValue, _isIndirectVariable, _setInd, _declareLocal } = helpers;

  const variableAlias = getVariableAlias(input.variable);
  let dest = variableAlias;
  if (_isIndirectVariable(input.variable)) {
    const actor_collision_result = _declareLocal("actor_collision_result", 1, true);
    dest = actor_collision_result;
  }

  _addComment("Get actor collision");

  _stackPushConst(dest);
  _stackPushScriptValue(scriptValueToPixels(input.y, input.units));
  _stackPushScriptValue(scriptValueToPixels(input.x, input.units));

  _callNative("vm_get_actor_collision");
  _stackPop(3);

  if (_isIndirectVariable(input.variable)) {
    _setInd(variableAlias, dest);
  }
};
