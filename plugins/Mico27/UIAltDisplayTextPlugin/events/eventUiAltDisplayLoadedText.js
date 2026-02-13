const id = "EVENT_UI_ALT_DISPLAY_LOADED_TEXT";
const name = "Alt Display Loaded Text Instantly";
const groups = ["EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg) => {
  return `Alt Display Loaded Text Instantly`;
};

const fields = [
  {
    label: "Display currently loaded text",
  },
];

const compile = (input, helpers) => {
  const {
	_callNative,
  } = helpers;
  		
	_callNative("ui_alt_display_text"); 
    
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