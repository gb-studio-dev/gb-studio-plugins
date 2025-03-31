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
  const { _callNative, _rpn, _stackPushConst, _stackPush, _stackPop, _addComment, _declareLocal, variableSetToScriptValue, getVariableAlias } = helpers;
  const {is_gbc, is_sprite} = input;
  
  
  const tmp_palette_idx = _declareLocal("tmp_palette_idx", 1, true);
  
  variableSetToScriptValue(tmp_palette_idx, input.palette_idx);
      
  _addComment("Set colors of a palette");
  
  _rpn()  .ref(tmp_palette_idx)  // ((tmp_palette_idx) & 7)
		  .int16((is_sprite)? 8: 0)
          .operator(".B_OR")
          .int16((!is_gbc)? 16: 0)
		  .operator(".B_OR")
		  .refSet(tmp_palette_idx)
          .stop();
		  
	const color0Alias = getVariableAlias(input.color0);
	const color1Alias = getVariableAlias(input.color1);
	const color2Alias = getVariableAlias(input.color2);
	const color3Alias = (!is_sprite)? getVariableAlias(input.color3): 0;
	  
  _stackPushConst(color3Alias);
  _stackPushConst(color2Alias);
  _stackPushConst(color1Alias);
  _stackPushConst(color0Alias);
  _stackPush(tmp_palette_idx);
  		
  _callNative("get_palette_colors");
  _stackPop(5);  
  
};
