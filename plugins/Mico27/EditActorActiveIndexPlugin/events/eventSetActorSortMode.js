const l10n = require("../helpers/l10n").default;

export const id = "EVENT_SET_ACTOR_SORT_MODE";
export const name = "Set actor sort mode";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Set actor sort mode`;
};

export const fields = [
   {
        key: "sort_mode",
        label: "Actor Sort Mode",
        type: "select",
        defaultValue: 0,
        options: [
          [0, "None"],
          [1, "Flicker"],
          [2, "Sort Vertically"],
        ],
    }
];

export const compile = (input, helpers) => {
  const { _setConstMemUInt8 } = helpers;
  _setConstMemUInt8('actor_sort_mode', input.sort_mode);
};
