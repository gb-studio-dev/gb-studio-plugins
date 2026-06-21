export const id = "EVENT_ACTOR_EFFECTS_BY_INDEX";
export const name = "Actor Effects By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

export const autoLabel = (fetchArg) => {
  return `Effect ${fetchArg("effect")} on actor ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "effect",
    label: "Effect",
    description: "Visual effect to apply to the actor.",
    type: "select",
    options: [
      ["flicker", "Flicker"],
      ["splitIn", "Split In"],
      ["splitOut", "Split Out"],
    ],
    defaultValue: "flicker",
    width: "100%",
  },
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to apply the effect to.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
    width: "100%",
  },
  {
    type: "group",
    wrapItems: true,
    conditions: [
      {
        key: "effect",
        in: ["splitIn", "splitOut"],
      },
    ],
    fields: [
      {
        key: "distance",
        label: "Distance",
        description: "Split distance.",
        type: "number",
        min: 1,
        max: 80,
        defaultValue: 20,
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["tiles", "pixels"],
        width: "50%",
      },
      {
        key: "speed",
        label: "Speed",
        description: "Split speed.",
        type: "moveSpeed",
        allowNone: false,
        defaultValue: 2,
        width: "50%",
      },
    ],
  },
  {
    key: "time",
    type: "number",
    label: "Duration",
    description: "Duration in seconds.",
    min: 0,
    max: 60,
    step: 0.1,
    defaultValue: 0.5,
    unitsField: "timeUnits",
    unitsDefault: "time",
    unitsAllowed: ["time", "frames"],
    conditions: [
      {
        key: "effect",
        in: ["flicker"],
      },
      {
        key: "timeUnits",
        ne: "frames",
      },
    ],
  },
  {
    key: "frames",
    label: "Duration",
    description: "Duration in frames.",
    type: "number",
    min: 0,
    max: 3600,
    width: "50%",
    defaultValue: 30,
    unitsField: "timeUnits",
    unitsDefault: "time",
    unitsAllowed: ["time", "frames"],
    conditions: [
      {
        key: "effect",
        in: ["flicker"],
      },
      {
        key: "timeUnits",
        eq: "frames",
      },
    ],
  },
];

export const compile = (input, helpers) => {
  const { actorFXSplitIn, actorFXSplitOut, actorFXFlicker, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  if (input.effect === "splitIn") {
    actorFXSplitIn(actorRef, input.distance, input.speed, input.units);
    return;
  }
  if (input.effect === "splitOut") {
    actorFXSplitOut(actorRef, input.distance, input.speed, input.units);
    return;
  }
  if (input.effect === "flicker") {
    let frames = 0;
    if (input.timeUnits === "frames") {
      frames = typeof input.frames === "number" ? input.frames : 30;
    } else {
      const seconds = typeof input.time === "number" ? input.time : 0.5;
      frames = Math.ceil(seconds * 60);
    }
    actorFXFlicker(actorRef, frames);
  }
};

export const waitUntilAfterInitFade = true;
