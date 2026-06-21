export const id = "EVENT_ACTOR_SET_STATE_BY_INDEX";
export const name = "Actor Set Animation State By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

export const autoLabel = (fetchArg) => {
  return `Set animation state of actor ${fetchArg("actorIndex")} to ${fetchArg("spriteStateId") || "Default"}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the animation state of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "spriteStateId",
    label: "Animation State",
    description: "Animation state to set.",
    type: "animationstate",
    defaultValue: "",
    width: "50%",
  },
  {
    key: "loopAnim",
    label: "Loop Animation",
    description: "Whether to loop the animation.",
    type: "checkbox",
    defaultValue: true,
    width: "50%",
  },
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorSetState, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  actorSetActive(actorRef);
  actorSetState(input.spriteStateId, input.loopAnim);
};
