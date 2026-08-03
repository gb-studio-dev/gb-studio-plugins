export const id = "EVENT_THREAD_EX_THREAD_PAUSE";
export const name = "Thread Pause";
export const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_MISC"];
export const subGroups = {
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_THREADS",
  EVENT_GROUP_MISC: "EVENT_GROUP_THREADS",
};

export const autoLabel = (fetchArg) => {
  return `Pause thread ${fetchArg("variable")}`;
};

export const fields = [
  {
    key: "variable",
    label: "Thread handle variable",
    description:
      "Variable holding the handle of the thread to pause, as set by Thread Start. The thread is frozen exactly where it is - including in the middle of a wait - and keeps its stack, so Thread Resume continues from the same point.",
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

  const {
    _addComment,
    _addNL,
    _compileSubScript,
    _stackPushConst,
    _stackPushVariable,
    _callNative,
    _stackPop,
  } = helpers;

  const stubSymbol = _compileSubScript("thread", [
    {
      id: "threadExStub",
      command: "EVENT_THREAD_EX_INTERNAL_PAUSE_STUB",
      args: {},
    },
  ]);

  _addComment("Thread Pause");
  _stackPushConst(`___bank_${stubSymbol}`);
  _stackPushConst(`_${stubSymbol}`);
  _stackPushVariable(input.variable);
  _callNative("vm_thread_pause");
  _stackPop(3);
  _addNL();
};
