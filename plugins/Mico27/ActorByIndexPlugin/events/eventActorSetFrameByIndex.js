export const id = "EVENT_ACTOR_SET_FRAME_BY_INDEX";
export const name = "Actor Set Animation Frame By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

export const autoLabel = (fetchArg) => {
  return `Set animation frame of actor ${fetchArg("actorIndex")} to ${fetchArg("frame")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the animation frame of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "frame",
    label: "Animation Frame",
    description: "Animation frame to set.",
    type: "value",
    min: 0,
    defaultValue: { type: "number", value: 0 },
  },
];

export const compile = (input, helpers) => {
  const { actorSetFrameToScriptValue, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  actorSetFrameToScriptValue(actorRef, input.frame);
};
