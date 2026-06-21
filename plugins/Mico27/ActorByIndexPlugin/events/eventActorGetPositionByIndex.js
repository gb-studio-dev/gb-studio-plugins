export const id = "EVENT_ACTOR_GET_POSITION_BY_INDEX";
export const name = "Actor Get Position By Index";
export const groups = ["EVENT_GROUP_ACTOR", "EVENT_GROUP_VARIABLES"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_VARIABLES",
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_ACTOR",
};

export const autoLabel = (fetchArg) => {
  return `Get position of actor ${fetchArg("actorIndex")} into ${fetchArg("vectorX")}, ${fetchArg("vectorY")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to get the position of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    type: "group",
    fields: [
      {
        key: "vectorX",
        type: "variable",
        label: "X",
        description: "Variable to store the X position.",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
      {
        key: "vectorY",
        type: "variable",
        label: "Y",
        description: "Variable to store the Y position.",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
    ],
  },
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorGetPosition, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  actorSetActive(actorRef);
  actorGetPosition(input.vectorX, input.vectorY, input.units);
};
