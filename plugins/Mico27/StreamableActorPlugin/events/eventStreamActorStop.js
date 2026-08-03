const l10n = require("../helpers/l10n").default;

export const id = "EVENT_STREAM_ACTOR_STOP";
export const name = "Stop Streaming Actor";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "Streaming",
};

export const autoLabel = (fetchArg) => {
  return `Stop streaming actor ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description:
      "Releases the actor's streaming slot. The tiles currently in VRAM stay as they are, so the actor keeps showing its last streamed frame.",
    type: "actor",
    defaultValue: "$self$",
  },
];

export const compile = (input, helpers) => {
  const {
    _callNative,
    _stackPush,
    _stackPop,
    _addComment,
    _declareLocal,
    setActorId,
  } = helpers;

  const actorRef = _declareLocal("stream_actor", 1, true);
  setActorId(actorRef, input.actorId);

  _addComment("Stop Streaming Actor");
  _stackPush(actorRef);
  _callNative("vm_stream_actor_stop");
  _stackPop(1);
};
