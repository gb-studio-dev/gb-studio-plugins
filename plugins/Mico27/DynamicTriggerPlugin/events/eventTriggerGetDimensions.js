export const id = "EVENT_TRIGGER_GET_DIMENSIONS";
export const name = "Trigger Get Dimensions";
export const groups = ["Triggers"];

export const autoLabel = (fetchArg) => {
  return `Get size of trigger ${fetchArg("triggerIndex")} into ${fetchArg("vectorW")}, ${fetchArg("vectorH")}`;
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
        key: "vectorW",
        type: "variable",
        label: "Width",
        description: "Variable to store the trigger width in tiles.",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "vectorH",
        type: "variable",
        label: "Height",
        description: "Variable to store the trigger height in tiles.",
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

  const aliasW = getVariableAlias(input.vectorW);
  const aliasH = getVariableAlias(input.vectorH);
  let destW = aliasW;
  let destH = aliasH;
  if (_isIndirectVariable(input.vectorW)) destW = _declareLocal("trig_w", 1, true);
  if (_isIndirectVariable(input.vectorH)) destH = _declareLocal("trig_h", 1, true);

  _addComment("Trigger Get Dimensions");
  _stackPushConst(destW);
  _stackPushConst(destH);
  _stackPushScriptValue(input.triggerIndex);
  _callNative("vm_trigger_get_dimensions");
  _stackPop(3);

  if (_isIndirectVariable(input.vectorW)) _setInd(aliasW, destW);
  if (_isIndirectVariable(input.vectorH)) _setInd(aliasH, destH);
};
