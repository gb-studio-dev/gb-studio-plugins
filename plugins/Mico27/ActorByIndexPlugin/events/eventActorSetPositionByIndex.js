export const id = "EVENT_ACTOR_SET_POSITION_BY_INDEX";
export const name = "Actor Set Position By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_MOVEMENT",
};

export const autoLabel = (fetchArg, input) => {
  const unitPostfix = input.units === "pixels" ? "px" : "";
  return `Set position of actor ${fetchArg("actorIndex")} to ${fetchArg("x")}${unitPostfix}, ${fetchArg("y")}${unitPostfix}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the position of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    type: "group",
    wrapItems: true,
    fields: [
      {
        key: "x",
        label: "X",
        description: "X position.",
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
        defaultValue: { type: "number", value: 0 },
      },
      {
        key: "y",
        label: "Y",
        description: "Y position.",
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
        defaultValue: { type: "number", value: 0 },
      },
    ],
  },
];

export const compile = (input, helpers) => {
  const { actorSetPositionToScriptValues, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  actorSetPositionToScriptValues(actorRef, input.x, input.y, input.units);
};
