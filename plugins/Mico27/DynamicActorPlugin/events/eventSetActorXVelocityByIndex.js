export const id = "EVENT_SET_ACTOR_X_VELOCITY_BY_INDEX";
export const name = "Set Actor X Velocity By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Set x velocity of actor ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the x velocity of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "xVelocity",
    label: "X velocity",
    description: "X velocity",
    type: "value",
     defaultValue: {
          type: "number",
          value: 0,
        },
  }
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPop, _addComment, _stackPushScriptValue } = helpers;

  _addComment("Set Actor X Velocity By Index");

  _stackPushScriptValue(input.xVelocity);
  _stackPushScriptValue(input.actorIndex);

  _callNative("vm_set_actor_velocity_x");
  _stackPop(2);

};
