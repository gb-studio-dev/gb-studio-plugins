export const id = "EVENT_ACTOR_MOVE_CANCEL_BY_INDEX";
export const name = "Actor Move Cancel By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_MOVEMENT",
};

export const autoLabel = (fetchArg) => {
  return `Cancel move for actor ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to cancel movement for.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorMoveCancel, _declareLocal, variableSetToScriptValue } = helpers;
  const actorRef = _declareLocal("act_idx", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  actorSetActive(actorRef);
  actorMoveCancel();
};
