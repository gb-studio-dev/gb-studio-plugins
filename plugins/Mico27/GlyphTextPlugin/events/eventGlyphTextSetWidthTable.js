const id = "EVENT_GTX_SET_WIDTH_TABLE";
const name = "Glyph Text: Set Width Table";
const groups = ["EVENT_GROUP_DIALOGUE"];
const autoLabel = (fetchArg) => {
  return `Glyph Text: Set Width Table`;
};
const fields = [
  {
    type: "label",
    label:
      "Points the renderer at the table of glyph advances that variable-width mode needs. The table is a tileset asset generated alongside your sheets by make_glyph_sheets.js --vwf. Register it once, in the first scene's On Init, next to the Set Glyph Sheet events. Has no effect unless the 'Variable width glyphs (VWF)' engine setting is on.",
  },
  {
    key: "clear",
    label: "Clear Table",
    description:
      "Forget the table instead of setting one. Every character then advances by its full cell: 16px wide, 8px single-byte.",
    type: "checkbox",
    defaultValue: false,
    width: "50%",
  },
  {
    key: "tilesetId",
    label: "Width Table (tileset)",
    type: "tileset",
    defaultValue: "LAST_TILESET",
    conditions: [
      {
        key: "clear",
        ne: true,
      },
    ],
  },
];
const compile = (input, helpers) => {
  const { _callNative, _addComment, _addNL, _stackPushConst, _stackPop, options } =
    helpers;
  const { tilesets } = options;

  const clear = input.clear ?? false;
  const tileset = clear
    ? undefined
    : tilesets.find((t) => t.id === input.tilesetId) ?? tilesets[0];
  if (!clear && !tileset) {
    return;
  }

  _addComment("Glyph Text: Set Width Table");
  _stackPushConst(tileset ? `_${tileset.symbol}` : 0);
  _stackPushConst(tileset ? `___bank_${tileset.symbol}` : 0);
  _callNative("gtx_set_width_table");
  _stackPop(2);
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
};
