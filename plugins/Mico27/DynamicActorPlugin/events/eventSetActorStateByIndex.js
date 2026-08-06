export const id = "EVENT_SET_ACTOR_STATE_BY_INDEX";
export const name = "Set Actor State By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Set state of actor ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the state of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "stateId",
    label: "State id",
    description: "State id. 0 pauses the behavior, 1 grounded, 2 airborne Y, 3 airborne Z; 4 to 15 are free for your own use. The field is 4 bits wide, so values above 15 wrap around.",
    type: "value",
     defaultValue: {
          type: "number",
          value: 0,
        },
  }
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPop, _addComment, _stackPushScriptValue } = helpers;

  _addComment("Set Actor State By Index");

  _stackPushScriptValue(input.stateId);
  _stackPushScriptValue(input.actorIndex);

  _callNative("vm_set_actor_state");
  _stackPop(2);

};
