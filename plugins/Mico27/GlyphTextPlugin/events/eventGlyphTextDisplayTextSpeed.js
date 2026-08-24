const id = "EVENT_GTX_DISPLAY_TEXT_SPEED";
const name = "Glyph Text: Draw At Text Speed";
const groups = ["EVENT_GROUP_DIALOGUE"];
const autoLabel = (fetchArg) => {
  return `Glyph Text: Draw At Text Speed`;
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
    key: "layer",
    label: "Layer",
    type: "select",
    options: [
      ["background", "Background"],
      ["overlay", "Overlay"],
    ],
    defaultValue: "background",
    width: "50%",
  },
  {
    key: `x`,
    label: "X (tiles)",
    type: "number",
    min: 0,
    max: 31,
    width: "25%",
    defaultValue: 0,
  },
  {
    key: `y`,
    label: "Y (tiles)",
    type: "number",
    min: 0,
    max: 31,
    width: "25%",
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
  const isBkg = input.layer !== "overlay";
  _addComment("Glyph Text: Draw At Text Speed");
  if (isBkg) _setTextLayer(".TEXT_LAYER_BKG");
  inputTexts.forEach((inputText) => {
    const warped_x = wrap8Bit(input.x) % 32;
    const warped_y = wrap8Bit(input.y) % 32;
    _loadStructuredText(
      `\\003\\${decOct(warped_x + 1)}\\${decOct(warped_y + 1)}${inputText}`
    );
    _callNative("gtx_display_text_speed");
  });
  if (isBkg) _setTextLayer(".TEXT_LAYER_WIN");
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
