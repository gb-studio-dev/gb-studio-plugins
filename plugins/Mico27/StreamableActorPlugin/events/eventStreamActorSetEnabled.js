export const id = "EVENT_STREAM_ACTOR_SET_ENABLED";
export const name = "Streamed Actor Set Enabled";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "Streaming",
};

export const autoLabel = (fetchArg) => {
  return `Set actor streaming enabled to ${fetchArg("enabled")}`;
};

export const fields = [
  {
    key: "enabled",
    label: "Streaming enabled",
    description:
      "Suspends or resumes the VBlank tile streamer for every streamed actor. Suspend it while another system needs the whole VBlank (large VRAM transfers, screen transitions), then resume it.",
    type: "value",
    defaultValue: { type: "number", value: 1 },
  },
];

export const compile = (input, helpers) => {
  const { engineFieldSetToScriptValue, _addComment } = helpers;

  _addComment("Streamed Actor Set Enabled");
  engineFieldSetToScriptValue("streamable_actor_enabled", input.enabled);
};
