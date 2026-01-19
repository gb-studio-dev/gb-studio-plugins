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
  const { _callNative, _stackPushConst, _stackPush, _stackPop, _addComment, _declareLocal, variableSetToScriptValue, getVariableAlias } = helpers;
  
  const tmp0 = _declareLocal("tmp_0", 1, true);
  const tmp1 = _declareLocal("tmp_1", 1, true);
  const tmp2 = _declareLocal("tmp_2", 1, true);
    
  variableSetToScriptValue(tmp0, input.rom_data_offset);
  variableSetToScriptValue(tmp1, input.ram_data_offset);
  variableSetToScriptValue(tmp2, input.data_length);
  
  const variableAlias = getVariableAlias(input.ram_data_ptr);
    
  _addComment("Copy ROM data to variable");
  
  _stackPush(tmp2);
  _stackPush(tmp1);
  _stackPushConst(variableAlias);
  _stackPush(tmp0);
  _stackPushConst(`_${input.rom_data_symbol}`);
  _stackPushConst(`___bank_${input.rom_data_symbol}`);
    		
  _callNative("copy_rom_data_to_ram");
  _stackPop(6);  
  
};
