export const id = "EVENT_ACTOR_EMOTE_BY_INDEX";
export const name = "Actor Emote By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_ACTIONS",
};

export const autoLabel = (fetchArg) => {
  return `Emote ${fetchArg("emoteId")} on actor ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to show the emote on.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "emoteId",
    label: "Emote",
    description: "Emote to display.",
    type: "emote",
    defaultValue: "LAST_EMOTE",
  },
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorEmote, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  actorSetActive(actorRef);
  actorEmote(input.emoteId);
};

export const waitUntilAfterInitFade = true;
