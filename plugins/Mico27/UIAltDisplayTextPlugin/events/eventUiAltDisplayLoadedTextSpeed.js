const id = "EVENT_UI_ALT_DISPLAY_LOADED_TEXT_SPEED";
const name = "Alt Display Loaded Text At Various Speed";
const groups = ["EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg) => {
  return `Alt Display Loaded Text At Various Speed`;
};

const fields = [
  {
    label: "Display currently loaded text at various speed",
  },
];

const compile = (input, helpers) => {
  const {
	_callNative,
  } = helpers;
  		
	_callNative("ui_alt_display_dialogue"); 
    
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