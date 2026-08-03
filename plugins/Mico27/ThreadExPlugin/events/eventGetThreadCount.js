export const id = "EVENT_THREAD_EX_GET_THREAD_COUNT";
export const name = "Get Thread Count";
export const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_MISC"];
export const subGroups = {
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_THREADS",
  EVENT_GROUP_MISC: "EVENT_GROUP_THREADS",
};

export const autoLabel = (fetchArg) => {
  return `Store thread count in ${fetchArg("variable")}`;
};

export const fields = [
  {
    key: "variable",
    label: "Store in",
    description:
      "Variable that receives how many of the engine's 16 thread contexts are currently in use. Paused threads are counted - they keep their context - and so is the script running this event. 16 minus this value is how many more threads can be started right now.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

export const compile = (input, helpers) => {
  const featureEnabled = (key) => {
    const fv =
      helpers.engineFieldValues && helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  if (!featureEnabled("THREAD_EX_ENABLE_THREAD_COUNT")) {
    throw new Error(
      'This event requires the "Feature: Read thread count" engine setting to be enabled (Settings → Engine → Thread Ex).',
    );
  }

  const {
    _addComment,
    _addNL,
    _declareLocal,
    _stackPushConst,
    _callNative,
    _stackPop,
    getVariableAlias,
    _isIndirectVariable,
    _setInd,
  } = helpers;

  const alias = getVariableAlias(input.variable);
  const indirect = _isIndirectVariable(input.variable);
  const dest = indirect ? _declareLocal("thread_count", 1, true) : alias;

  _addComment("Get Thread Count");
  _stackPushConst(dest);
  _callNative("vm_thread_count");
  _stackPop(1);

  if (indirect) {
    _setInd(alias, dest);
  }
  _addNL();
};
