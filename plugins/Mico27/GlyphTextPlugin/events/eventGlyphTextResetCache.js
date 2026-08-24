const id = "EVENT_GTX_RESET_CACHE";
const name = "Glyph Text: Reset Tile Cache";
const groups = ["EVENT_GROUP_DIALOGUE"];
const autoLabel = (fetchArg) => {
  return `Glyph Text: Reset Tile Cache`;
};
const fields = [
  {
    type: "label",
    label:
      "Forgets all cached 16x16 character tile quads. Call this in each scene's On Init (or after anything that reloads background tiles) so stale tiles are not reused. Registered glyph sheets are kept.",
  },
];
const compile = (input, helpers) => {
  const { _callNative, _addComment, _addNL } = helpers;
  _addComment("Glyph Text: Reset Tile Cache");
  _callNative("gtx_reset_cache");
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
