export const id = "EVENT_SET_ACTOR_BEHAVIOR_BY_INDEX";
export const name = "Set Actor Behavior By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Set behavior of actor ${fetchArg("actorIndex")} : ${fetchArg("behaviorId")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the behavior of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "behaviorId",
    label: "Behavior slot",
    description: "Behavior slot to use (defined with 'Define Actor Behavior'). 0 disables the behavior.",
    type: "value",
    min: 0,
    max: 32,
    defaultValue: {
      type: "number",
      value: 1,
    },
  },
  {
    key: "state",
    label: "Initial state",
    description: "State to put the actor in when the behavior is assigned",
    type: "select",
    options: [
      ["1", "Active (grounded)"],
      ["2", "Active (airborne)"],
      ["0", "Paused"],
      ["255", "Keep current state"],
    ],
    defaultValue: "1",
  },
];

export const compile = (input, helpers) => {
  const {
    _callNative,
    _stackPushConst,
    _stackPop,
    _addComment,
    _stackPushScriptValue,
  } = helpers;

  const state = parseInt(input.state !== undefined ? input.state : "1", 10);

  _addComment("Set Actor Behavior By Index");

  _stackPushConst(state);
  _stackPushScriptValue(input.behaviorId);
  _stackPushScriptValue(input.actorIndex);

  _callNative("vm_set_actor_behavior");
  _stackPop(3);
};
