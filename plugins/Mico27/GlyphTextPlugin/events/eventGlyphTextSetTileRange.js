const id = "EVENT_GTX_SET_TILE_RANGE";
const name = "Glyph Text: Set Tile Range";
const groups = ["EVENT_GROUP_DIALOGUE"];
const autoLabel = (fetchArg) => {
  return `Glyph Text: Set Tile Range (${fetchArg("firstTile")} - ${fetchArg(
    "lastTile"
  )})`;
};
const fields = [
  {
    type: "label",
    label:
      "Sets the VRAM background tile range reserved for 16x16 character quads, where the tiles are placed, and resets the cache. Each cached character uses four tiles. Bank 1 placements are Game Boy Color features (fall back to bank 0 on DMG); alternate placement doubles the characters the range can hold.",
  },
  {
    key: "firstTile",
    label: "First Tile (0-255)",
    type: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: 64,
  },
  {
    key: "lastTile",
    label: "Last Tile (0-255)",
    type: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: 191,
  },
  {
    key: "placement",
    label: "Tile Placement (VRAM bank)",
    type: "select",
    options: [
      [0, "Bank 0 only"],
      [1, "Bank 1 only (Color)"],
      [2, "Alternate bank 0/1 (Color)"],
    ],
    defaultValue: 0,
    width: "50%",
  },
];
const compile = (input, helpers) => {
  const { _callNative, _addComment, _addNL, _stackPushConst, _stackPop } =
    helpers;
  _addComment("Glyph Text: Set Tile Range");
  _stackPushConst(input.firstTile);
  _stackPushConst(input.lastTile);
  _stackPushConst(input.placement ?? 0);
  _callNative("gtx_set_tile_range");
  _stackPop(3);
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
