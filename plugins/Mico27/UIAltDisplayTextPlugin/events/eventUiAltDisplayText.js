const id = "EVENT_UI_ALT_DISPLAY_TEXT";
const name = "Alt Load and Display Text To Background Instantly";
const groups = ["EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg) => {
  return `Alt Load and Display Text To Background Instantly`;
};

const wrap8Bit = (val) => (256 + (val % 256)) % 256;

const decOct = (dec) => wrap8Bit(dec).toString(8).padStart(3, "0");

const fields = [
  {
    key: "text",
    type: "textarea",
    singleLine: false,
    placeholder: "",
    multiple: false,
    defaultValue: "",
    flexBasis: "100%",
  },
  {
    key: `x`,
    label: "X",
    type: "number",
    width: "50%",
    defaultValue: 0,
  },
  {
    key: `y`,
    label: "Y",
    type: "number",
    width: "50%",
    defaultValue: 0,
  },
];

const compile = (input, helpers) => {
  const {
	_callNative,
    _addComment,
    _loadStructuredText,
    _addNL,
    _setTextLayer,
  } = helpers;
  		
	const inputTexts = Array.isArray(input.text) ? input.text : [input.text];
    _addComment("Alt Draw Text To Background");
	_setTextLayer(".TEXT_LAYER_BKG");
    inputTexts.forEach((inputText, textIndex) => {
      const warped_x = input.x % 32;
	  const warped_y = input.y % 32;
	  _loadStructuredText(`\\003\\${decOct(warped_x + 1)}\\${decOct(warped_y + 1)}${inputText}`);	  	  
	  _callNative("ui_alt_display_text"); 	  
    });
     _setTextLayer(".TEXT_LAYER_WIN");
    _addNL();  
    
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
    x: "x",
    y: "y",
  },
};