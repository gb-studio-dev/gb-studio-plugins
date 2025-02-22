const l10n = require("../helpers/l10n").default;

const id = "EVENT_PEEK_DATA_BY_INDEX";
const groups = ["EVENT_GROUP_SAVE_DATA", "EVENT_GROUP_VARIABLES"];
const subGroups = {
  "EVENT_GROUP_SAVE_DATA": "EVENT_GROUP_VARIABLES",
  "EVENT_GROUP_VARIABLES": "EVENT_GROUP_SAVE_DATA"
}

const fields = [
  {
    key: "variableDest",
    label: l10n("FIELD_SET_VARIABLE"),
    description: l10n("FIELD_VARIABLE_SET_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    type: "group",
    fields: [
	  {
		key: `variableSource`,
		label: "Saved data index",
		description: "Saved data index",
		type: "value",
		defaultValue: {
			type: "number",
			value: 0,
		},
	  }, 
      {
        key: "saveSlot",
        label: l10n("FIELD_FROM_SAVE_SLOT"),
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
    ],
  },
];

const compile = (input, helpers) => {
  const { _declareLocal, getVariableAlias, variableSetToScriptValue, getNextLabel, _savePeek, _addComment, _ifConst, _setVariableConst, _label, _addNL } = helpers;  
  
  const peekValueRef = _declareLocal("peek_value", 1, true);
  const variableSourceRef = _declareLocal("tmp0", 1, true);
  
  const variableDestAlias = getVariableAlias(input.variableDest);
  variableSetToScriptValue(variableSourceRef, input.variableSource);
  const foundLabel = getNextLabel();
  
  _addComment(
    `Store ${input.variableSource} from save slot ${input.saveSlot} into ${variableDestAlias}`
  );
  _savePeek(
    peekValueRef,
    variableDestAlias,
    variableSourceRef,
    1,
    input.saveSlot
  );
  _ifConst(".EQ", peekValueRef, 1, foundLabel, 0);
  _setVariableConst(input.variableDest, 0);
  _label(foundLabel);
  _addNL();
};

module.exports = {
  id,
  name: "Store Variable from Game Data In Variable by Index",
  description: "Store Variable from Game Data In Variable by Index",
  groups,
  subGroups,
  fields,
  compile,
};
