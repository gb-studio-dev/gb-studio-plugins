const l10n = require("../helpers/l10n").default;
const id = "EVENT_UI_CHANGE_TEXT_LAYER";
const name = "Change text layer";
const groups = ["EVENT_GROUP_DIALOGUE"];

const labelsMap = {
  "background": l10n("FIELD_BACKGROUND"),
  "overlay": l10n("FIELD_OVERLAY"),
};

const valuesMap = {
  "background": ".TEXT_LAYER_BKG",
  "overlay": ".TEXT_LAYER_WIN",
};

const autoLabel = (_, input) => {
  return `Change text layer to ${labelsMap[input.location] || l10n("FIELD_BACKGROUND")}`;
};

const fields = [
  {
    key: `location`,
    label: l10n("FIELD_LOCATION"),
    description: l10n("FIELD_TEXT_DRAW_LOCATION_DESC"),
    type: "select",
    defaultValue: "background",
    width: "50%",
    options: Object.entries(labelsMap),
  },
];

const compile = (input, helpers) => {
  const {
    _setTextLayer,
  } = helpers;  		
	_setTextLayer(valuesMap[input.location] ?? ".TEXT_LAYER_BKG");
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