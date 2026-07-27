const l10n = require("../helpers/l10n").default;

export const id = "EVENT_SET_ACTOR_X_VELOCITY";
export const name = "Set actor x velocity";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Set actor x velocity`;
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
  const { _callNative, _stackPush, _stackPop, _addComment, _declareLocal, setActorId, _stackPushScriptValue } = helpers;

  const tmp0 = _declareLocal("tmp0", 1, true);

  setActorId(tmp0, input.actorId);

  _addComment("Set actor x velocity");

  _stackPushScriptValue(input.xVelocity);
  _stackPush(tmp0);

  _callNative("vm_set_actor_velocity_x");
  _stackPop(2);

};
