const l10n = require("../helpers/l10n").default;

export const id = "EVENT_GET_BACKGROUND_TILE";
export const name = "Get background tile";
export const groups = ["EVENT_GROUP_SCREEN"];

export const autoLabel = (fetchArg) => {
  return `Get background tile`;
};

export const fields = [
  {
    key: `x`,
    label: "X",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: `y`,
    label: "Y",
    type: "value",
    width: "50%",
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
  }
];

export const compile = (input, helpers) => {
  const __submapFeatureEnabled = (key) => {
    const fv = helpers.engineFieldValues && helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  if (!__submapFeatureEnabled("SUBMAP_ENABLE_TILE_GET_SET")) {
    throw new Error("This event requires the \"Individual tile getters/setters\" engine setting to be enabled (Settings → Engine → Submapping Ex).");
  }

  const { _callNative, _stackPop, _addComment, _declareLocal, getVariableAlias, _stackPushConst, _isIndirectVariable, _setInd, _stackPushScriptValue } = helpers;

  const variableAlias = getVariableAlias(input.variable);
  let dest = variableAlias;
  if (_isIndirectVariable(input.variable)) {
    const index_result = _declareLocal("index_result", 1, true);
    dest = index_result;
  }
  
  _addComment("Get background tile");

  _stackPushConst(dest);
  _stackPushScriptValue(input.y);
  _stackPushScriptValue(input.x);

  _callNative("vm_get_background_tile");
  _stackPop(3);
  
  if (_isIndirectVariable(input.variable)) {
    _setInd(variableAlias, dest);
  }

};
