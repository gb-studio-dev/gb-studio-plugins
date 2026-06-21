export const id = "EVENT_ACTOR_SET_DIRECTION_BY_INDEX";
export const name = "Actor Set Direction By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

export const autoLabel = (fetchArg) => {
  return `Set direction of actor ${fetchArg("actorIndex")} to ${fetchArg("direction")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the direction of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "direction",
    label: "Direction",
    description: "Direction to face.",
    type: "value",
    defaultValue: {
      type: "direction",
      value: "up",
    },
  },
];

export const compile = (input, helpers) => {
  const { actorSetDirectionToScriptValue, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  actorSetDirectionToScriptValue(actorRef, input.direction);
};
