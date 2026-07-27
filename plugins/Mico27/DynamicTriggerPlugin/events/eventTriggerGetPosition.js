export const id = "EVENT_TRIGGER_GET_POSITION";
export const name = "Trigger Get Position";
export const groups = ["Triggers"];

export const autoLabel = (fetchArg) => {
  return `Get position of trigger ${fetchArg("triggerIndex")} into ${fetchArg("vectorX")}, ${fetchArg("vectorY")}`;
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
        key: "vectorX",
        type: "variable",
        label: "X",
        description: "Variable to store the trigger left tile position.",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "vectorY",
        type: "variable",
        label: "Y",
        description: "Variable to store the trigger top tile position.",
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

  const aliasX = getVariableAlias(input.vectorX);
  const aliasY = getVariableAlias(input.vectorY);
  let destX = aliasX;
  let destY = aliasY;
  if (_isIndirectVariable(input.vectorX)) destX = _declareLocal("trig_x", 1, true);
  if (_isIndirectVariable(input.vectorY)) destY = _declareLocal("trig_y", 1, true);

  _addComment("Trigger Get Position");
  _stackPushConst(destX);
  _stackPushConst(destY);
  _stackPushScriptValue(input.triggerIndex);
  _callNative("vm_trigger_get_position");
  _stackPop(3);

  if (_isIndirectVariable(input.vectorX)) _setInd(aliasX, destX);
  if (_isIndirectVariable(input.vectorY)) _setInd(aliasY, destY);
};
