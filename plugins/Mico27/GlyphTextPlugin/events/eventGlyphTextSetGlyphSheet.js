const id = "EVENT_GTX_SET_GLYPH_SHEET";
const name = "Glyph Text: Set Glyph Sheet";
const groups = ["EVENT_GROUP_DIALOGUE"];
const autoLabel = (fetchArg) => {
  return `Glyph Text: Set Glyph Sheet ${fetchArg("slot")} (from glyph ${fetchArg(
    "firstGlyph"
  )})`;
};
const fields = [
  {
    type: "label",
    label:
      "Points a glyph sheet slot at a tileset asset holding 16x16 character bitmaps, covering a contiguous run of wide glyph indices. The number of characters is read from the tileset itself (4 tiles each), so only the first index has to be given. Registered sheets are global and survive scene changes; register them once, in the first scene's On Init.",
  },
  {
    key: "slot",
    label: "Slot",
    description:
      "Which glyph sheet slot to fill. The number of slots is the 'Glyph sheet slots' engine setting.",
    type: "number",
    min: 0,
    max: 15,
    width: "50%",
    defaultValue: 0,
  },
  {
    key: "firstGlyph",
    label: "First Glyph Index",
    description:
      "Glyph index the first character of this sheet stands for. tools/make_glyph_sheets.js prints the value for every sheet it generates.",
    type: "number",
    min: 0,
    max: 16383,
    width: "50%",
    defaultValue: 0,
  },
  {
    key: "clear",
    label: "Clear Slot",
    description:
      "Empty the slot instead of pointing it at a tileset. Characters the remaining sheets do not cover are drawn as blank squares.",
    type: "checkbox",
    defaultValue: false,
    width: "50%",
  },
  {
    key: "tilesetId",
    label: "Glyph Sheet (tileset)",
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

  _addComment("Glyph Text: Set Glyph Sheet");
  _stackPushConst(input.slot ?? 0);
  _stackPushConst(tileset ? `_${tileset.symbol}` : 0);
  _stackPushConst(tileset ? `___bank_${tileset.symbol}` : 0);
  _stackPushConst(input.firstGlyph ?? 0);
  _callNative("gtx_set_glyph_sheet");
  _stackPop(4);
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
