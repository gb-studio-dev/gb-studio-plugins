const l10n = require("../helpers/l10n").default;

export const id = "EVENT_SET_ACTOR_BEHAVIOR";
export const name = "Set Actor Behavior";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Set Actor Behavior : ${fetchArg("behaviorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_DEACTIVATE_DESC"),
    type: "actor",
    defaultValue: "$self$",
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
    _stackPush,
    _stackPushConst,
    _stackPop,
    _addComment,
    _declareLocal,
    setActorId,
    _stackPushScriptValue,
  } = helpers;

  const tmp0 = _declareLocal("tmp0", 1, true);

  setActorId(tmp0, input.actorId);

  const state = parseInt(input.state !== undefined ? input.state : "1", 10);

  _addComment("Set Actor Behavior");

  _stackPushConst(state);
  _stackPushScriptValue(input.behaviorId);
  _stackPush(tmp0);

  _callNative("vm_set_actor_behavior");
  _stackPop(3);
};
