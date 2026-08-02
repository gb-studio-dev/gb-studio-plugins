const l10n = require("../helpers/l10n").default;

export const id = "EVENT_SET_ACTOR_ACTIVE_INDEX_BY_INDEX";
export const name = "Set Actor Active Index By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Set active index of actor ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to set the active index of.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "activeIdx",
    label: "Active index",
    description: "Active index",
    type: "value",
     defaultValue: {
          type: "number",
          value: 0,
        },
  }
];

export const compile = (input, helpers) => {
  const { _callNative, _stackPush, _stackPop, _addComment, _declareLocal, variableSetToScriptValue } = helpers;

  const tmp0 = _declareLocal("tmp0", 1, true);
  const tmp1 = _declareLocal("tmp1", 1, true);

  variableSetToScriptValue(tmp0, input.actorIndex);
  variableSetToScriptValue(tmp1, input.activeIdx);

  _addComment("Set Actor Active Index By Index");

  _stackPush(tmp1);
  _stackPush(tmp0);

  _callNative("set_actor_active_index");
  _stackPop(2);

};
