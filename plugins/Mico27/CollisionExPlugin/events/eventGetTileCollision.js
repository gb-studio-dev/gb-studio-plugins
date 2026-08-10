const l10n = require("../helpers/l10n").default;

export const id = "EVENT_GET_TILE_COLLISION";
export const name = "Get tile collision";
export const groups = ["Collision Ex"];

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
    description:
      "Variable to store the tile's raw collision byte in. Out of bounds coordinates report 15 (solid on every side), the same as the engine's own tile tests.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

export const compile = (input, helpers) => {
  const engineFieldOn = (key) => {
    const fv =
      helpers.engineFieldValues &&
      helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  if (!engineFieldOn("COLLISION_EX_ENABLE_GET_TILE_COLLISION")) {
    throw new Error(
      `This event requires the "Enable event: Get tile collision" engine setting to be enabled (Settings → Engine → Collision Ex).`
    );
  }

  const {
    _callNative,
    _stackPop,
    _addComment,
    getVariableAlias,
    _stackPushConst,
    _stackPushScriptValue,
    _isIndirectVariable,
    _setInd,
    _declareLocal,
  } = helpers;

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
