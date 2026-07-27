const l10n = require("../helpers/l10n").default;

export const id = "EVENT_SET_ACTOR_STATE";
export const name = "Set actor state";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Set actor state`;
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
    key: "stateId",
    label: "State id",
    description: "State id",
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

  _addComment("Set actor state");

  _stackPushScriptValue(input.stateId);
  _stackPush(tmp0);

  _callNative("vm_set_actor_state");
  _stackPop(2);

};
