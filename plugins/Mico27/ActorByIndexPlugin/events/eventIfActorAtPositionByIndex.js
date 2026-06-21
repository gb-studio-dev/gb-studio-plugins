export const id = "EVENT_IF_ACTOR_AT_POSITION_BY_INDEX";
export const name = "If Actor At Position By Index";
export const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_CONTROL_FLOW",
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_ACTOR",
};

export const autoLabel = (fetchArg, input) => {
  const unitPostfix = input.units === "pixels" ? "px" : "";
  return `If actor ${fetchArg("actorIndex")} at ${fetchArg("x")}${unitPostfix}, ${fetchArg("y")}${unitPostfix}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to check the position of.",
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
        description: "X position to check.",
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
        description: "Y position to check.",
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
  {
    key: "true",
    label: "True",
    description: "Events to run if the condition is true.",
    type: "events",
  },
  {
    key: "__collapseElse",
    label: "Else",
    type: "collapsable",
    defaultValue: true,
    conditions: [
      {
        key: "__disableElse",
        ne: true,
      },
    ],
  },
  {
    key: "false",
    label: "False",
    description: "Events to run if the condition is false.",
    conditions: [
      {
        key: "__collapseElse",
        ne: true,
      },
      {
        key: "__disableElse",
        ne: true,
      },
    ],
    type: "events",
  },
];

export const compile = (input, helpers) => {
  const { ifActorAtPositionByScriptValues, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifActorAtPositionByScriptValues(actorRef, input.x, input.y, truePath, falsePath, input.units);
};
