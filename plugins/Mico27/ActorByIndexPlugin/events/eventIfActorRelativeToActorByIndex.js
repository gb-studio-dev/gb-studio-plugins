export const id = "EVENT_IF_ACTOR_RELATIVE_TO_ACTOR_BY_INDEX";
export const name = "If Actor Relative To Actor By Index";
export const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_CONTROL_FLOW",
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_ACTOR",
};

export const autoLabel = (fetchArg) => {
  const dir = fetchArg("operation");
  const dirLabel = dir === "down" ? "below" : dir === "left" ? "left of" : dir === "right" ? "right of" : "above";
  return `If actor ${fetchArg("actorIndex")} is ${dirLabel} actor ${fetchArg("otherActorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the first actor.",
    type: "value",
    defaultValue: { type: "number", value: 0 },
  },
  {
    key: "operation",
    label: "Comparison",
    description: "Relative position comparison.",
    type: "select",
    options: [
      ["up", "Is Above"],
      ["down", "Is Below"],
      ["left", "Is Left Of"],
      ["right", "Is Right Of"],
    ],
    defaultValue: "up",
    width: "50%",
  },
  {
    key: "otherActorIndex",
    label: "Other Actor Index",
    description: "Index of the second actor.",
    type: "value",
    defaultValue: { type: "number", value: 1 },
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
  const { actorSetActive, ifActorRelativeToActor, _declareLocal, variableSetToScriptValue } = helpers;

  const actorRef = _declareLocal("act_idx", 1, true);
  const otherActorRef = _declareLocal("other_act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  variableSetToScriptValue(otherActorRef, input.otherActorIndex);

  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;

  actorSetActive(actorRef);
  ifActorRelativeToActor(input.operation, otherActorRef, truePath, falsePath);
};
