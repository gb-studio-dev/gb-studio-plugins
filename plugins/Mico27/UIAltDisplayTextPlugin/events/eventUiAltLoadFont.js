const l10n = require("../helpers/l10n").default;
const id = "EVENT_UI_ALT_LOAD_FONT";
const name = "Alt Load Font tiles";
const groups = ["EVENT_GROUP_MISC"];
const autoLabel = (fetchArg) => {
  return `Alt Load Font tiles`;
};
const fields = [
  {
    key: "fontId",
    label: l10n("FIELD_FONT"),
    description: l10n("FIELD_FONT_DESC"),
    type: "font",
    defaultValue: "LAST_FONT",
  },
  {
    key: `offset`,
    label: "Offset",
    type: "number",
    defaultValue: 0,
  },
  {
    key: `length`,
    label: "Length",
    type: "number",
    defaultValue: 0,
  },
  {
    key: 'adjustFontMappingWithOffset',
    label: 'Adjust font mapping with offset on compile',
    description: 'Whether to adjust the font mapping based on the offset on compile',
    type: 'checkbox',
    defaultValue: false,
  }
];
const offsetted_fonts_cache = {};
const compile = (input, helpers) => {
  const { _callNative, _getFontSymbol, _stackPushConst, _stackPop, options } = helpers;
  if (input.adjustFontMappingWithOffset) {
    const { fonts } = options;
    const font = fonts.find((f) => f.id === input.fontId);
    if (font && font.table) {
        if (!offsetted_fonts_cache[input.fontId]) {
            offsetted_fonts_cache[input.fontId] = true;
        } else {
            throw new Error(`Font mapping for font ${font.name} has already been offset, cannot offset again. Please uncheck adjustFontMappingWithOffset option to prevent this error.`);
        }
        font.table = font.table.map((value) => value + input.offset);
    }
  }
  _stackPushConst(input.length);
  _stackPushConst(input.offset);
  _stackPushConst(_getFontSymbol(input.fontId));
  _callNative("ui_alt_load_font");
  _stackPop(3);
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