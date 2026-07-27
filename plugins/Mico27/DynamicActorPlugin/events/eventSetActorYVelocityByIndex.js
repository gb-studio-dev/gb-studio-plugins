export const id = "EVENT_SET_ACTOR_Y_VELOCITY_BY_INDEX";
export const name = "Set Actor Y Velocity By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Set y velocity of actor ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the y velocity of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "yVelocity",
    label: "Y velocity",
    description: "Y velocity",
    type: "value",
     defaultValue: {
          type: "number",
          value: 0,
        },
  }
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPop, _addComment, _stackPushScriptValue } = helpers;

  _addComment("Set Actor Y Velocity By Index");

  _stackPushScriptValue(input.yVelocity);
  _stackPushScriptValue(input.actorIndex);

  _callNative("vm_set_actor_velocity_y");
  _stackPop(2);

};
