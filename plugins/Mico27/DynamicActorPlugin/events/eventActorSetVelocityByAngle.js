const l10n = require("../helpers/l10n").default;

export const id = "EVENT_ACTOR_SET_VELOCITY_BY_ANGLE";
export const name = "Set Actor Velocity By Angle";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg, input) => {
  return `Set Velocity By Angle : ${fetchArg("angle")} deg`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: "Actor to set velocity on",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "angle",
    label: "Angle (degrees)",
    description: "Direction of travel: 0 = up, 90 = right, 180 = down, 270 = left",
    type: "number",
    min: 0,
    max: 359,
    defaultValue: 90,
  },
  {
    key: "speed",
    label: "Speed",
    description:
      "Velocity in subpixels per frame (32 = 1 pixel/frame, max 127)",
    type: "number",
    min: 1,
    max: 127,
    defaultValue: 32,
  },
];

export const compile = (input, helpers) => {
  const {
    _callNative,
    _stackPush,
    _stackPushConst,
    _stackPop,
    _addComment,
    _addNL,
    _declareLocal,
    setActorId,
  } = helpers;

  const clampInt = (v, min, max, dflt) => {
    const n = Math.round(Number(v));
    if (!isFinite(n)) return dflt;
    return Math.max(min, Math.min(max, n));
  };

  const angle = clampInt(input.angle, 0, 359, 90);
  const speed = clampInt(input.speed, 1, 127, 32);

  // 0 degrees = up, clockwise (same convention as projectile launch angles)
  const rad = (angle * Math.PI) / 180;
  const vx = Math.round(Math.sin(rad) * speed);
  const vy = -Math.round(Math.cos(rad) * speed);

  const actorRef = _declareLocal("tmp0", 1, true);
  setActorId(actorRef, input.actorId);

  _addComment(`Set Actor Velocity By Angle (${angle} deg, ${speed})`);

  _stackPushConst(vy);
  _stackPushConst(vx);
  _stackPush(actorRef);
  _callNative("vm_set_actor_velocity");
  _stackPop(3);

  _addNL();
};
