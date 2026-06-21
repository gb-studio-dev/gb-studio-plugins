export const id = "EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR_BY_INDEX";
export const name = "If Actor Distance From Actor By Index";
export const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_CONTROL_FLOW",
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_ACTOR",
};

export const autoLabel = (fetchArg) => {
  return `If actor ${fetchArg("actorIndex")} ${fetchArg("operator")} ${fetchArg("distance")} tiles from actor ${fetchArg("otherActorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the first actor.",
    type: "value",
    defaultValue: { type: "number", value: 0 },
    width: "50%",
  },
  {
    type: "group",
    fields: [
      {
        key: "operator",
        label: "Comparison",
        description: "Distance comparison operator.",
        type: "operator",
        width: "50%",
        defaultValue: "<=",
      },
      {
        key: "distance",
        label: "Distance",
        description: "Distance in tiles.",
        type: "value",
        min: 0,
        max: 181,
        width: "50%",
        unitsDefault: "tiles",
        defaultValue: { type: "number", value: 0 },
      },
    ],
  },
  {
    key: "otherActorIndex",
    label: "Other Actor Index",
    description: "Index of the second actor.",
    type: "value",
    defaultValue: { type: "number", value: 1 },
    width: "50%",
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
  const { ifActorDistanceScriptValueFromActor, _declareLocal, variableSetToScriptValue } = helpers;

  const actorRef = _declareLocal("act_idx", 1, true);
  const otherActorRef = _declareLocal("other_act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  variableSetToScriptValue(otherActorRef, input.otherActorIndex);

  const operationLookup = {
    "==": ".EQ",
    "!=": ".NE",
    "<": ".LT",
    ">": ".GT",
    "<=": ".LTE",
    ">=": ".GTE",
  };
  const operator = operationLookup[input.operator];

  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;

  ifActorDistanceScriptValueFromActor(
    actorRef,
    input.distance,
    operator,
    otherActorRef,
    truePath,
    falsePath,
  );
};
