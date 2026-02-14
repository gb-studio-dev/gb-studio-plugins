const l10n = require("../helpers/l10n").default;
const id = "EVENT_UI_LOAD_TEXT";
const name = "Load text";
const groups = ["EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg, args) => {
  if (([].concat(args.text) || []).join()) {
    return `Load text: ${fetchArg("text")}`;
  } else {
    return `Load text`;
  }
};

const fields = [
  {
    key: "text",
    type: "textarea",
    singleLine: false,
    placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
    multiple: false,
    defaultValue: "",
    flexBasis: "100%",
  },
];

const compile = (input, helpers) => {
  const {
    _loadStructuredText,
  } = helpers;
  		
	const inputTexts = Array.isArray(input.text) ? input.text : [input.text];
    inputTexts.forEach((inputText, textIndex) => {
	  _loadStructuredText(inputText);	  
    });
};

module.exports = {
  id,
  name,
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: false,
  helper: {
    type: "textdraw",
    text: "text",
  },
};