const l10n = require("../helpers/l10n").default;

export const id = "EVENT_GET_TILE_COLLISION";
export const name = "Get tile collision";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Get tile collision`;
};

export const fields = [
  {
    key: "tileX",
    label: "Tile X",
    description: "Tile X coordinate to test",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "tileY",
    label: "Tile Y",
    description: "Tile Y coordinate to test",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "variable",
    label: l10n("FIELD_VARIABLE"),
    description: "Variable to store tile collision value",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPop, _addComment, getVariableAlias, _stackPushConst, _stackPushScriptValue, _isIndirectVariable, _setInd, _declareLocal } = helpers;

  const variableAlias = getVariableAlias(input.variable);
  let dest = variableAlias;
  if (_isIndirectVariable(input.variable)) {
    const tile_collision_result = _declareLocal("tile_collision_result", 1, true);
    dest = tile_collision_result;
  }

  _addComment("Get tile collision");

  _stackPushConst(dest);
  _stackPushScriptValue(input.tileY);
  _stackPushScriptValue(input.tileX);

  _callNative("vm_get_tile_collision");
  _stackPop(3);

  if (_isIndirectVariable(input.variable)) {
    _setInd(variableAlias, dest);
  }
};
