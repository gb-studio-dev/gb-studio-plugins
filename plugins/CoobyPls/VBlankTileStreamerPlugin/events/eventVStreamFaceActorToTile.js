export const id = "EVENT_VSTREAM_FACE_ACTOR_TO_TILE";
export const name = "VBlank Stream: Face Actor To Tile";
export const groups = ["EVENT_GROUP_SCENE"];

export const fields = [
  {
    key: "actorId",
    label: "Actor",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "targetX",
    label: "Target X",
    type: "number",
    min: 0,
    max: 255,
    defaultValue: 0,
  },
  {
    key: "targetY",
    label: "Target Y",
    type: "number",
    min: 0,
    max: 255,
    defaultValue: 0,
  },
];

const clampByte = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(255, parsed | 0));
};

export const compile = (input, helpers) => {
  const {
    _addComment,
    _callNative,
    _stackPop,
    _stackPushConst,
    actorPushById,
  } = helpers;

  _addComment("VBlank Stream: face actor toward target tile");
  _stackPushConst(clampByte(input.targetY));
  _stackPushConst(clampByte(input.targetX));
  actorPushById(input.actorId || "$self$");
  _callNative("vstream_face_actor_to_tile");
  _stackPop(3);
};
