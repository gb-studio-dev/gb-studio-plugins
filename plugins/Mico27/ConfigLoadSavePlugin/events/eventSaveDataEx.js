const l10n = require("../helpers/l10n").default;

const id = "EVENT_SAVE_DATA_EX";
const groups = ["EVENT_GROUP_SAVE_DATA", "EVENT_GROUP_VARIABLES"];
const subGroups = {
  "EVENT_GROUP_SAVE_DATA": "EVENT_GROUP_VARIABLES",
  "EVENT_GROUP_VARIABLES": "EVENT_GROUP_SAVE_DATA"
}

const fields = [
  {
    key: "saveSlot",
    label: l10n("FIELD_SAVE_SLOT"),
    description: l10n("FIELD_SAVE_SLOT_DESC"),
    type: "togglebuttons",
    options: [
      [
        0,
        l10n("FIELD_SLOT_N", { slot: 1 }),
        l10n("FIELD_SAVE_SLOT_N", { slot: 1 }),
      ],
      [
        1,
        l10n("FIELD_SLOT_N", { slot: 2 }),
        l10n("FIELD_SAVE_SLOT_N", { slot: 2 }),
      ],
      [
        2,
        l10n("FIELD_SLOT_N", { slot: 3 }),
        l10n("FIELD_SAVE_SLOT_N", { slot: 3 }),
      ],
    ],
    allowNone: false,
    defaultValue: 0,
  },
];

const compile = (input, helpers) => {
  const { _callNative, _stackPushConst, _stackPop, _addComment } = helpers;
      
  _addComment("Save Game Data Using Save Config");
    
  _stackPushConst(input.saveSlot);  	
  _callNative("vm_data_save_ex");
  _stackPop(1);   
};

module.exports = {
  id,
  name: "Save Game Data Using Save Config",
  description: "Save Game Data Using Save Config",
  groups,
  subGroups,
  fields,
  compile,
};
