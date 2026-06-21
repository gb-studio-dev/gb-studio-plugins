export const id = "EVENT_ACTOR_MOVE_TO_BY_INDEX";
export const name = "Actor Move To By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_MOVEMENT",
};

export const autoLabel = (fetchArg, input) => {
  const unitPostfix = input.units === "pixels" ? "px" : "";
  return `Move actor ${fetchArg("actorIndex")} to ${fetchArg("x")}${unitPostfix}, ${fetchArg("y")}${unitPostfix}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to move.",
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
        description: "Target X position.",
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
        description: "Target Y position.",
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
    key: "collideWith",
    label: "Collide With",
    type: "togglebuttons",
    options: [
      ["walls", "Walls", "Walls"],
      ["actors", "Actors", "Actors"],
    ],
    allowNone: true,
    allowMultiple: true,
    defaultValue: ["walls"],
  },
  {
    key: "moveType",
    label: "Move Type",
    hideLabel: true,
    type: "moveType",
    defaultValue: "horizontal",
    flexBasis: 35,
    flexGrow: 0,
  },
];

export const compile = (input, helpers) => {
  const { actorMoveToScriptValues, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  actorMoveToScriptValues(
    actorRef,
    input.x,
    input.y,
    input.collideWith,
    input.moveType,
    input.units,
    input.lockDirection,
  );
};

export const waitUntilAfterInitFade = true;
