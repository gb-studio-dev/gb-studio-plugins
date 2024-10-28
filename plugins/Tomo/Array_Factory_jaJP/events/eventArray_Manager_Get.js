/*
 * Author: Tomo (@indiegdevstdio)
 * A variable bit divider which divides multiple global variables with specified bits, which can be accessed like an array
 *  (i.e. if specified with divider of "2" each divided value can have a 2 bit number value: 0, 1, 2, 3)
 */
const scriptValueHelpers = require("shared/lib/scriptValue/helpers");

export const id = "XV_ARRAY_MANAGER_GET";
export const name = "配列マネージャー（値の取得）";
export const groups = ["XV プラグイン"];

const fields = [].concat(
  [
    {
      key: "array_manager_get_tabs",
      type: "tabs",
      defaultValue: "tabSetupArray",
      values: {
        tabGetValue: "値の取得",
        tabSetupArray: "配列のセットアップ",
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
        label: "「配列マネージャー（値の代入）」イベントで設定した最大 16 個のグローバル変数のうち、指定したインデックスの値を取得します。[配列インデックス] と [取得した値を保存する変数] 以外のプロパティは「配列マネージャー（値の代入）」イベントで設定したプロパティと同じである必要があります。",
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
        label: "グローバル変数 1",
        description: "グローバル変数 1",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var2",
        label: "グローバル変数 2",
        description: "グローバル変数 2",
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
        label: "グローバル変数 3",
        description: "グローバル変数 3",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var4",
        label: "グローバル変数 4",
        description: "グローバル変数 4",
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
        label: "グローバル変数 5",
        description: "グローバル変数 5",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var6",
        label: "グローバル変数 6",
        description: "グローバル変数 6",
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
        label: "グローバル変数 7",
        description: "グローバル変数 7",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var8",
        label: "グローバル変数 8",
        description: "グローバル変数 8",
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
        label: "グローバル変数 9",
        description: "グローバル変数 9",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var10",
        label: "グローバル変数 10",
        description: "グローバル変数 10",
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
        label: "グローバル変数 11",
        description: "グローバル変数 11",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var12",
        label: "グローバル変数 12",
        description: "グローバル変数 12",
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
        label: "グローバル変数 13",
        description: "グローバル変数 13",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var14",
        label: "グローバル変数 14",
        description: "グローバル変数 14",
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
        label: "グローバル変数 15",
        description: "グローバル変数 15",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "var16",
        label: "グローバル変数 16",
        description: "グローバル変数 16",
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
        label: "使用するグローバル変数の数",
        description: "上記で設定したグローバル変数のうち、使用するグローバル変数の数を指定します（頭から数えます）。",
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
        label: "各配列要素のビットサイズ",
        description: "より多くの配列を扱えるように、1 つのグローバル変数を何ビットで分割するかを指定します（GB Studio の各グローバル変数は 16 ビットのビット数を持ちます）。例えば、「2」を指定すると、各グローバル変数が 8 分割されます（例：1 つのグローバル変数は 16 ビットなので、8 個の 2 ビット値を持つ変数に分割することができます）。「8」を指定すると、2 個の要素（各要素は 8 ビットの値を持つ）に分割されます。",
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
        label: "配列インデックス",
        description: "上記で分割されたグローバル変数を 1 つのまとまりとした時に、値を設定したいインデックスを指定します。例えば、16 個のグローバル変数を指定し、それぞれ 1 ビットで分割した場合は、0〜255 の範囲のインデックスを指定することができます。",
        defaultType: "number",
        defaultValue: {
          number: 0,
        },
        width: "50%",
      },
      {
        key: "results",
        label: "取得した値を保存する変数",
        description: "指定した配列インデックスの要素の値を格納する変数を指定します。",
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
