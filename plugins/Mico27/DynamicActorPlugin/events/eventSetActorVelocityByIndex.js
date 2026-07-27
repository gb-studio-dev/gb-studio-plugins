export const id = "EVENT_SET_ACTOR_VELOCITY_BY_INDEX";
export const name = "Set Actor Velocity By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Set velocity of actor ${fetchArg("actorIndex")} : ${fetchArg("xVelocity")}, ${fetchArg("yVelocity")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the velocity of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "xVelocity",
    label: "X velocity",
    description:
      "Horizontal velocity in subpixels per frame (16 = 1 pixel/frame, negative = left)",
    type: "value",
    min: -32768,
    max: 32767,
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "yVelocity",
    label: "Y velocity",
    description:
      "Vertical velocity in subpixels per frame (16 = 1 pixel/frame, negative = up)",
    type: "value",
    min: -32768,
    max: 32767,
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
];

export const compile = (input, helpers) => {
  const {
    _callNative,
    _stackPop,
    _addComment,
    _stackPushScriptValue,
  } = helpers;

  _addComment("Set Actor Velocity By Index");

  _stackPushScriptValue(input.yVelocity);
  _stackPushScriptValue(input.xVelocity);
  _stackPushScriptValue(input.actorIndex);

  _callNative("vm_set_actor_velocity");
  _stackPop(3);
};
