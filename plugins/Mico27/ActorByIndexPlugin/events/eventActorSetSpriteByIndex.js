export const id = "EVENT_ACTOR_SET_SPRITE_BY_INDEX";
export const name = "Actor Set Sprite By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

export const autoLabel = (fetchArg) => {
  return `Set sprite of actor ${fetchArg("actorIndex")} to ${fetchArg("spriteSheetId")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the sprite of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "spriteSheetId",
    label: "Sprite Sheet",
    description: "Sprite sheet to assign to the actor.",
    type: "sprite",
    defaultValue: "LAST_SPRITE",
  },
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorSetSprite, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  actorSetActive(actorRef);
  actorSetSprite(input.spriteSheetId);
};
