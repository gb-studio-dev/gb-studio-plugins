export const id = "EVENT_COPY_ROM_DATA_TO_RAM";
export const name = "Copy ROM data to variable";
export const groups = ["EVENT_GROUP_VARIABLES", "EVENT_GROUP_MISC"];

export const autoLabel = (fetchArg) => {
  return `Copy ROM data to variable`;
};

export const fields = [
  {
    key: `rom_data_symbol`,
    label: "Custom data symbol",
    type: "text",
  },
  {
    key: `rom_data_offset`,
    label: "Custom data offset",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: `ram_data_ptr`,
    label: "Variable",
    type: "variable",
  },
  {
    key: `ram_data_offset`,
    label: "Variable offset",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: `data_length`,
    label: "Data length (byte)",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPushConst, _isIndirectVariable, _stackPop, _addComment, _declareLocal, _setInd, getVariableAlias, _stackPushScriptValue } = helpers;

  const variableAlias = getVariableAlias(input.ram_data_ptr);
  let dest = variableAlias;
  if (_isIndirectVariable(input.ram_data_ptr)) {
    const ram_result = _declareLocal("ram_result", 1, true);
    dest = ram_result;
  }

  _addComment("Copy ROM data to variable");

  _stackPushScriptValue(input.data_length);
  _stackPushScriptValue(input.ram_data_offset);
  _stackPushConst(dest);
  _stackPushScriptValue(input.rom_data_offset);
  _stackPushConst(`_${input.rom_data_symbol}`);
  _stackPushConst(`___bank_${input.rom_data_symbol}`);

  _callNative("copy_rom_data_to_ram");
  
  _stackPop(6);
  
  if (_isIndirectVariable(input.ram_data_ptr)) {
    _setInd(variableAlias, dest);
  }

};
