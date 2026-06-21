export const id = "EVENT_ACTOR_GET_DIRECTION_BY_INDEX";
export const name = "Actor Get Direction By Index";
export const groups = ["EVENT_GROUP_ACTOR", "EVENT_GROUP_VARIABLES"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_VARIABLES",
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_ACTOR",
};

export const autoLabel = (fetchArg) => {
  return `Get direction of actor ${fetchArg("actorIndex")} into ${fetchArg("direction")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to get the direction of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "direction",
    label: "Variable",
    description: "Variable to store the direction.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorGetDirection, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  actorSetActive(actorRef);
  actorGetDirection(input.direction);
};
