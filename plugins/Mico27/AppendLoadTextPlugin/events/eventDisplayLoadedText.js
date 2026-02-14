const l10n = require("../helpers/l10n").default;
const id = "EVENT_UI_DISPLAY_LOADED_TEXT";
const name = "Display Loaded Text";
const groups = ["EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg) => {
  return `Display Loaded Text`;
};

const fields = [
  {
    label: "Display currently loaded text",
  },
  {
    key: "preserve_pos",
    label: "Use previous text position",
    description: "Use the end of text position from previous display of text.",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "use_start_tile",
    label: "Specify start tile",
    description: "Enable specifying the starting tile in VRAM, otherwise it will start from the last written tile.",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "start_tile",
    label: "Starting tile",
    description: "Starting tile index to draw the text into the VRAM",
    type: "number",
    defaultValue: 0,
    conditions: [
      {
        key: "use_start_tile",
        eq: true,
      },
    ],
  },
];

const compile = (input, helpers) => {
  const {
    _displayText,
  } = helpers;
  	_displayText(input.preserve_pos, (input.use_start_tile)? input.start_tile: null);
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