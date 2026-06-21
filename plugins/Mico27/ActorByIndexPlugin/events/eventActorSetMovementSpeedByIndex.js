export const id = "EVENT_ACTOR_SET_MOVEMENT_SPEED_BY_INDEX";
export const name = "Actor Set Movement Speed By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

export const autoLabel = (fetchArg) => {
  return `Set movement speed of actor ${fetchArg("actorIndex")} to ${fetchArg("speed")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the movement speed of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "speed",
    label: "Speed",
    description: "Movement speed.",
    type: "moveSpeed",
    defaultValue: 1,
  },
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorSetMovementSpeed, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  actorSetActive(actorRef);
  actorSetMovementSpeed(input.speed);
};
