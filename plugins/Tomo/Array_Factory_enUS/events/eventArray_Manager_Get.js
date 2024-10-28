/*
 * Author: Tomo (@indiegdevstdio)
 * A variable bit divider which divides multiple global variables with specified bits, which can be accessed like an array
 *  (i.e. if specified with divider of "2" each divided value can have a 2 bit number value: 0, 1, 2, 3)
 */
const scriptValueHelpers = require("shared/lib/scriptValue/helpers");

export const id = "XV_ARRAY_MANAGER_GET";
export const name = "Array Manager (Get Value)";
export const groups = ["XV Plugins"];

const fields = [].concat(
  [
    {
      key: "array_manager_get_tabs",
      type: "tabs",
      defaultValue: "tabSetupArray",
      values: {
        tabGetValue: "Get Value",
        tabSetupArray: "Setup Array",
      },
    },
  ],
  [{}],

  // Setup Variables Tab
  [{
    type: "group",
    conditions: [{key: "array_manager_get_tabs", in: ["tabSetupArray"]}],
    fields: [
      {
        label: "Obtains a value from the array index of Virtual Global Variable that was set with the Array_Manager_Set plugin.",
        type: "label",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "array_manager_get_tabs", in: ["tabSetupArray"]}],
    fields: [
      {
        key: "var1",
        label: "Global Variable 1",
        description: "Global Variable 1",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var2",
        label: "Global Variable 2",
        description: "Global Variable 2",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "array_manager_get_tabs", in: ["tabSetupArray"]}],
    fields: [
      {
        key: "var3",
        label: "Global Variable 3",
        description: "Global Variable 3",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var4",
        label: "Global Variable 4",
        description: "Global Variable 4",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "array_manager_get_tabs", in: ["tabSetupArray"]}],
    fields: [
      {
        key: "var5",
        label: "Global Variable 5",
        description: "Global Variable 5",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var6",
        label: "Global Variable 6",
        description: "Global Variable 6",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "array_manager_get_tabs", in: ["tabSetupArray"]}],
    fields: [
      {
        key: "var7",
        label: "Global Variable 7",
        description: "Global Variable 7",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var8",
        label: "Global Variable 8",
        description: "Global Variable 8",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "array_manager_get_tabs", in: ["tabSetupArray"]}],
    fields: [
      {
        key: "var9",
        label: "Global Variable 9",
        description: "Global Variable 9",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var10",
        label: "Global Variable 10",
        description: "Global Variable 10",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "array_manager_get_tabs", in: ["tabSetupArray"]}],
    fields: [
      {
        key: "var11",
        label: "Global Variable 11",
        description: "Global Variable 11",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var12",
        label: "Global Variable 12",
        description: "Global Variable 12",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "array_manager_get_tabs", in: ["tabSetupArray"]}],
    fields: [
      {
        key: "var13",
        label: "Global Variable 13",
        description: "Global Variable 13",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var14",
        label: "Global Variable 14",
        description: "Global Variable 14",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "array_manager_get_tabs", in: ["tabSetupArray"]}],
    fields: [
      {
        key: "var15",
        label: "Global Variable 15",
        description: "Global Variable 15",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var16",
        label: "Global Variable 16",
        description: "Global Variable 16",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "array_manager_get_tabs", in: ["tabSetupArray"]}],
    fields: [
      {
        key: "number_of_vars_to_use",
        label: "Number of Global Variables to Use",
        description: "From the global variables set, specify the number of global variables to be merged (counting from top).",
        type: "select",
        defaultValue: "16",
        options: [
          ["1", 1], ["2", 2], ["3", 3], ["4", 4],
          ["5", 5], ["6", 6], ["7", 7], ["8", 8],
          ["9", 9], ["10", 10], ["11", 11], ["12", 12], 
          ["13", 13], ["14", 14], ["15", 15], ["16", 16],
        ],
        width: "50%",
      },
      {
        key: "divide_bit_amount",
        label: "Individual Array Element Bit Size",
        description: "To use more arrays, you can divide individual global variables with the bit size you want. GB Studio’s global variable has 16 bit size each, so you can divide up the bit size in the range of 1, 2, 4, 8, 16. For example, if 2 bit is specified, each global variables will be divided into 8 segments (having 2 bit worth of storage per segment).",
        type: "select",
        defaultValue: "16",
        options: [
          ["1", 1], ["2", 2], ["4", 4], ["8", 8], ["16", 16],
        ],
        width: "50%",
      },
    ],
  }],

  // Get Value Tab
  [{
    type: "group",
    conditions: [{key: "array_manager_get_tabs", in: ["tabGetValue"]}],
    fields: [
      {
        key: "array_index",
        type: "union",
        types: ["number", "variable"],
        label: "Array Index",
        description: "Specify the index in the Virtual Global Variable to be manipulated on.",
        defaultType: "number",
        defaultValue: {
          number: 0,
        },
        width: "50%",
      },
      {
        key: "results",
        label: "Get Value Storage Variable",
        description: "The variable to store the obtained value.",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  }],
);

export const compile = (input, helpers) => {
  const { var1, var2, var3, var4, var5, var6, var7, var8, var9, var10, var11, var12, var13, var14, var15, var16,
    number_of_vars_to_use, divide_bit_amount, array_index, results } = input;
  const { _stackPush, getVariableAlias, _stackPushConst, _callNative, _stackPop, appendRaw,
    variableSetToScriptValue, variableSetToValue, _stackPushReference } = helpers;
  const { precompileScriptValue, optimiseScriptValue } = scriptValueHelpers;

  // Push references to all global vars that we will use
  const vars = [var1, var2, var3, var4, var5, var6, var7, var8, var9, var10, var11, var12, var13, var14, var15, var16];
  for(var i = number_of_vars_to_use - 1; i >= 0; i--) {
    const [arrayVar] = precompileScriptValue(optimiseScriptValue(vars[i]));
    _stackPushReference(getVariableAlias(arrayVar[0]));
  }

  // Get & push the value
  const [typeArrayIdx] = precompileScriptValue(optimiseScriptValue(array_index));
  // Check if the passed value is a number or variable
  if (typeArrayIdx[0].type === "number") {
    // It was a number, so we push to stack as constant
    _stackPushConst(typeArrayIdx[0].value);
  } else if (typeArrayIdx[0].type === "variable") {
    // It was a variable, so we push to stack as variable
    const variableAlias = getVariableAlias(typeArrayIdx[0].value);
    _stackPush(variableAlias);
  }

  _stackPushConst(divide_bit_amount);
  _stackPushConst(number_of_vars_to_use);

  // Get & push the reference for variable results
  const [resultsVar] = precompileScriptValue(optimiseScriptValue(results));
  _stackPushReference(getVariableAlias(resultsVar[0]));

  // Call native function on engine side
  _callNative("ArrayManagerGet");

  // Remove pushed values from stack
  _stackPop(4 + Number(number_of_vars_to_use));
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
