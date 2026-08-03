export const id = "EVENT_THREAD_EX_THREAD_RESUME";
export const name = "Thread Resume";
export const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_MISC"];
export const subGroups = {
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_THREADS",
  EVENT_GROUP_MISC: "EVENT_GROUP_THREADS",
};

export const autoLabel = (fetchArg) => {
  return `Resume thread ${fetchArg("variable")}`;
};

export const fields = [
  {
    key: "variable",
    label: "Thread handle variable",
    description:
      "Variable holding the handle of the thread to resume. The thread continues from the exact instruction where it was paused. Does nothing if the thread is not paused or has already finished.",
    type: "variable",
    defaultValue: "T0",
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
  if (!featureEnabled("THREAD_EX_ENABLE_THREAD_PAUSE")) {
    throw new Error(
      'This event requires the "Feature: Pause / resume threads" engine setting to be enabled (Settings → Engine → Thread Ex).',
    );
  }

  const { _addComment, _addNL, _stackPushVariable, _callNative, _stackPop } = helpers;

  _addComment("Thread Resume");
  _stackPushVariable(input.variable);
  _callNative("vm_thread_resume");
  _stackPop(1);
  _addNL();
};
