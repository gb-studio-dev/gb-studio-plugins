export const id = "EVENT_ACTOR_SET_COLLISION_BOX_BY_INDEX";
export const name = "Actor Set Collision Box By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

export const autoLabel = (fetchArg) => {
  return `Set collision box of actor ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the collision box of.",
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
        description: "Collision box X offset in pixels.",
        type: "value",
        min: -96,
        max: 96,
        width: "50%",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
        defaultValue: { type: "number", value: 0 },
      },
      {
        key: "y",
        label: "Y",
        description: "Collision box Y offset in pixels.",
        type: "value",
        min: -96,
        max: 96,
        width: "50%",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
        defaultValue: { type: "number", value: -8 },
      },
    ],
  },
  {
    type: "group",
    wrapItems: true,
    fields: [
      {
        key: "width",
        label: "Width",
        description: "Collision box width in pixels.",
        type: "value",
        min: 0,
        max: 128,
        width: "50%",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
        defaultValue: { type: "number", value: 16 },
      },
      {
        key: "height",
        label: "Height",
        description: "Collision box height in pixels.",
        type: "value",
        min: 0,
        max: 128,
        width: "50%",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
        defaultValue: { type: "number", value: 16 },
      },
    ],
  },
];

export const compile = (input, helpers) => {
  const { actorSetBoundToScriptValues, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  actorSetBoundToScriptValues(actorRef, input.x, input.y, input.width, input.height);
};
