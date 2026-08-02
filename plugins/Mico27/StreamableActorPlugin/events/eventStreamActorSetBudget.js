export const id = "EVENT_STREAM_ACTOR_SET_BUDGET";
export const name = "Streamed Actor Set Tile Budget";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "Streaming",
};

export const autoLabel = (fetchArg) => {
  return `Set actor streaming budget to ${fetchArg("budget")} tiles`;
};

export const fields = [
  {
    key: "budget",
    label: "Tiles per frame",
    description:
      "Maximum 8x8 tiles copied to VRAM per VBlank. Actors that do not fit in the remaining budget keep their previous frame and are served first on the next frame. Too high a value overruns VBlank and corrupts tiles (8 is safe on DMG, 16 on Game Boy Color).",
    type: "value",
    defaultValue: { type: "number", value: 8 },
  },
];

export const compile = (input, helpers) => {
  const { engineFieldSetToScriptValue, _addComment } = helpers;

  _addComment("Streamed Actor Set Tile Budget");
  engineFieldSetToScriptValue("streamable_actor_budget", input.budget);
};
