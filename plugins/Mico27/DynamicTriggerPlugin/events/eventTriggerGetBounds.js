export const id = "EVENT_TRIGGER_GET_BOUNDS";
export const name = "Trigger Get Bounds";
export const groups = ["Triggers"];

export const autoLabel = (fetchArg) => {
  return `Get bounds of trigger ${fetchArg("triggerIndex")}`;
};

export const fields = [
  {
    key: "triggerIndex",
    label: "Trigger Index",
    description: "Index of the trigger (0 = first trigger in the scene).",
    type: "value",
    defaultValue: { type: "number", value: 0 },
  },
  {
    type: "group",
    fields: [
      {
        key: "vectorLeft",
        type: "variable",
        label: "Left",
        description: "Variable to store the left tile.",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "vectorRight",
        type: "variable",
        label: "Right",
        description: "Variable to store the right tile (inclusive).",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  },
  {
    type: "group",
    fields: [
      {
        key: "vectorTop",
        type: "variable",
        label: "Top",
        description: "Variable to store the top tile.",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "vectorBottom",
        type: "variable",
        label: "Bottom",
        description: "Variable to store the bottom tile (inclusive).",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  },
];

export const compile = (input, helpers) => {
  const {
    _callNative,
    _stackPushConst,
    _stackPushScriptValue,
    _stackPop,
    _addComment,
    _declareLocal,
    getVariableAlias,
    _isIndirectVariable,
    _setInd,
  } = helpers;

  const aliasL = getVariableAlias(input.vectorLeft);
  const aliasR = getVariableAlias(input.vectorRight);
  const aliasT = getVariableAlias(input.vectorTop);
  const aliasB = getVariableAlias(input.vectorBottom);
  let destL = aliasL;
  let destR = aliasR;
  let destT = aliasT;
  let destB = aliasB;
  if (_isIndirectVariable(input.vectorLeft)) destL = _declareLocal("trig_l", 1, true);
  if (_isIndirectVariable(input.vectorRight)) destR = _declareLocal("trig_r", 1, true);
  if (_isIndirectVariable(input.vectorTop)) destT = _declareLocal("trig_t", 1, true);
  if (_isIndirectVariable(input.vectorBottom)) destB = _declareLocal("trig_b", 1, true);

  _addComment("Trigger Get Bounds");
  _stackPushConst(destL);
  _stackPushConst(destR);
  _stackPushConst(destT);
  _stackPushConst(destB);
  _stackPushScriptValue(input.triggerIndex);
  _callNative("vm_trigger_get_bounds");
  _stackPop(5);

  if (_isIndirectVariable(input.vectorLeft)) _setInd(aliasL, destL);
  if (_isIndirectVariable(input.vectorRight)) _setInd(aliasR, destR);
  if (_isIndirectVariable(input.vectorTop)) _setInd(aliasT, destT);
  if (_isIndirectVariable(input.vectorBottom)) _setInd(aliasB, destB);
};
