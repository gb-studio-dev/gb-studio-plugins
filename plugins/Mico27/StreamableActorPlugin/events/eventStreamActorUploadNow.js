const l10n = require("../helpers/l10n").default;

export const id = "EVENT_STREAM_ACTOR_UPLOAD_NOW";
export const name = "Upload Streamed Actor Frame";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "Streaming",
};

export const autoLabel = (fetchArg) => {
  return `Upload streamed frame of actor ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description:
      "Copies the actor's current frame into VRAM straight away instead of waiting for the VBlank streamer. Waits for VBlank first if the screen is on, so it costs one frame.",
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

  _addComment("Upload Streamed Actor Frame");
  _stackPush(actorRef);
  _callNative("vm_stream_actor_upload_now");
  _stackPop(1);
};
