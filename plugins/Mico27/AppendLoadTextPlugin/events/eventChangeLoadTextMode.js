const id = "EVENT_UI_CHANGE_LOAD_TEXT_MODE";
const name = "Change load text mode";
const groups = ["EVENT_GROUP_DIALOGUE"];

const labelsMap = {
  0: "Default",
  1: "Append",
};

const autoLabel = (_, input) => {
  return `Change load text mode to ${labelsMap[input.load_text_mode] || "Default"}`;
};

const fields = [
  {
    key: "load_text_mode",
    label: "Load text mode",
    type: "select",
    defaultValue: 0,
    options: Object.entries(labelsMap),
  },
];

const compile = (input, helpers) => {
  const {
    _setConstMemUInt8,
  } = helpers;  		
    _setConstMemUInt8("load_text_mode", input.load_text_mode || 0);
};

module.exports = {
  id,
  name,
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: false,
};