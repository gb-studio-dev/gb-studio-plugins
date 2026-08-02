export const id = "EVENT_STREAM_ACTOR_STOP_ALL";
export const name = "Stop All Actor Streaming";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "Streaming",
};

export const autoLabel = () => {
  return `Stop all actor streaming`;
};

export const fields = [
  {
    label:
      "Clears every streaming slot. Registrations left over from a previous scene are ignored automatically, so this is only needed when you want the slots back immediately.",
  },
];

export const compile = (input, helpers) => {
  const { _callNative, _addComment } = helpers;

  _addComment("Stop All Actor Streaming");
  _callNative("vm_stream_actor_stop_all");
};
