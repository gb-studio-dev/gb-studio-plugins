export const id = "EVENT_IF_ACTOR_DIRECTION_BY_INDEX";
export const name = "If Actor Direction By Index";
export const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_CONTROL_FLOW",
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_ACTOR",
};

export const autoLabel = (fetchArg) => {
  return `If actor ${fetchArg("actorIndex")} facing ${fetchArg("direction")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to check the direction of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "direction",
    label: "Direction",
    description: "Direction to check.",
    type: "value",
    defaultValue: {
      type: "direction",
      value: "up",
    },
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
  const { ifActorDirectionScriptValue, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifActorDirectionScriptValue(actorRef, input.direction, truePath, falsePath);
};
