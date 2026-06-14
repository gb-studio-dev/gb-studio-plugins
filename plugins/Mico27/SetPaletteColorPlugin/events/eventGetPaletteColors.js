export const id = "EVENT_GET_PALETTE_COLORS";
export const name = "Get colors of a palette";
export const groups = ["EVENT_GROUP_COLOR"];

export const autoLabel = (fetchArg) => {
  return `Get colors of a palette`;
};

export const fields = [
  {
    key: "is_gbc",
    label: "Is gameboy color palette",
    type: "checkbox",
    width: "50%",
    defaultValue: true,
  },
  {
    key: "is_sprite",
    label: "Is sprite palette",
    type: "checkbox",
    width: "50%",
    defaultValue: false,
  },
  {
    type: "group",
    conditions: [
      {
        key: "is_gbc",
        ne: true,
      },
      {
        key: "is_sprite",
        eq: true,
      },
    ],
    fields: [
      {
        key: "palette_idx",
        label: "Palette",
        type: "value",
        width: "100%",
        min: 0,
        max: 1,
        defaultValue: {
            type: "number",
            value: 0,
        },
      },
    ],
  },
  {
    type: "group",
    conditions: [
      {
        key: "is_gbc",
        eq: true,
      }
    ],
    fields: [
      {
        key: "palette_idx",
        label: "Palette",
        type: "value",
        width: "100%",
        min: 0,
        max: 7,
        defaultValue: {
            type: "number",
            value: 0,
        },
      },
    ],
  },
  {
    type: "group",
    fields: [
      {
        key: "color0",
        label: "Color 1",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
      },
      {
        key: "color1",
        label: "Color 2",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
      },
      {
        key: "color2",
        label: "Color 3",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
      },
      {
        key: "color3",
        label: "Color 4",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        conditions: [
          {
            key: "is_sprite",
            ne: true
          },
        ],
      },
    ],
  },
  {
    type: "group",
    conditions: [
      {
        key: "is_gbc",
        ne: true,
      },
    ],
    width: "50%",
    fields: [
      {
        label: "Note: 0 is white, 1 is light green, 2 is dark green, and 3 is black.",
      },
    ],
  },
];

export const compile = (input, helpers) => {
  const { _callNative, _rpn, _stackPushConst, _stackPush, _stackPop, _addComment, _declareLocal, variableSetToScriptValue, getVariableAlias, _isIndirectVariable, _setInd } = helpers;
  const {is_gbc, is_sprite} = input;


  const tmp_palette_idx = _declareLocal("tmp_palette_idx", 1, true);

  variableSetToScriptValue(tmp_palette_idx, input.palette_idx);

  _addComment("Get colors of a palette");

  _rpn()  .ref(tmp_palette_idx)  // ((tmp_palette_idx) & 7)
          .int16((is_sprite)? 8: 0)
          .operator(".B_OR")
          .int16((!is_gbc)? 16: 0)
          .operator(".B_OR")
          .refSet(tmp_palette_idx)
          .stop();


  const color0Alias = getVariableAlias(input.color0);
  let color0Dest = color0Alias;
  if (_isIndirectVariable(input.color0)) {
    const color0_result = _declareLocal("color0_result", 1, true);
    color0Dest = color0_result;
  }
  
  const color1Alias = getVariableAlias(input.color1);
  let color1Dest = color1Alias;
  if (_isIndirectVariable(input.color1)) {
    const color1_result = _declareLocal("color1_result", 1, true);
    color1Dest = color1_result;
  }
  
  const color2Alias = getVariableAlias(input.color2);
  let color2Dest = color2Alias;
  if (_isIndirectVariable(input.color1)) {
    const color2_result = _declareLocal("color2_result", 1, true);
    color2Dest = color2_result;
  }
  
  const color3Alias = (!is_sprite)? getVariableAlias(input.color3): 0;
  let color3Dest = color3Alias;
  if (!is_sprite && _isIndirectVariable(input.color3)) {
    const color3_result = _declareLocal("color3_result", 1, true);
    color3Dest = color3_result;
  }

  _stackPushConst(color3Dest);
  _stackPushConst(color2Dest);
  _stackPushConst(color1Dest);
  _stackPushConst(color0Dest);
  _stackPush(tmp_palette_idx);

  _callNative("get_palette_colors");
  _stackPop(5);

  if (_isIndirectVariable(input.color0)) {
    _setInd(color0Alias, color0Dest);
  }
  
  if (_isIndirectVariable(input.color1)) {
    _setInd(color1Alias, color1Dest);
  }
  
  if (_isIndirectVariable(input.color2)) {
    _setInd(color2Alias, color2Dest);
  }
  
  if (!is_sprite && _isIndirectVariable(input.color3)) {
    _setInd(color3Alias, color3Dest);
  }
};
