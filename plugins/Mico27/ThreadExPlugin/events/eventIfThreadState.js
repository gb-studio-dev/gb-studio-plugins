export const id = "EVENT_THREAD_EX_IF_THREAD_STATE";
export const name = "If Thread State";
export const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_MISC"];
export const subGroups = {
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_THREADS",
  EVENT_GROUP_MISC: "EVENT_GROUP_THREADS",
};

export const autoLabel = (fetchArg, input) => {
  const state =
    input.state === "paused"
      ? "paused"
      : input.state === "terminated"
        ? "terminated"
        : "running";
  return `If thread ${fetchArg("variable")} is ${state}`;
};

export const fields = [
  {
    key: "variable",
    label: "Thread handle variable",
    description: "Variable holding the handle of the thread to check, as set by Thread Start.",
    type: "variable",
    defaultValue: "T0",
  },
  {
    key: "state",
    label: "Is",
    description:
      "Running: the thread exists and is executing. Paused: the thread exists but was stopped by Thread Pause. Terminated: the thread has finished, was stopped with Thread Stop, was lost to a scene change, or the variable never held a thread.",
    type: "select",
    options: [
      ["running", "Running"],
      ["paused", "Paused"],
      ["terminated", "Terminated"],
    ],
    defaultValue: "running",
  },
  {
    key: "true",
    label: "True",
    description: "Script to run when the thread is in the selected state.",
    type: "events",
  },
  {
    key: "__collapseElse",
    label: "Else",
    type: "collapsable",
    defaultValue: true,
    conditions: [
      {
        key: "__disableElse",
        ne: true,
      },
    ],
  },
  {
    key: "false",
    label: "False",
    description: "Script to run otherwise.",
    type: "events",
    conditions: [
      {
        key: "__collapseElse",
        ne: true,
      },
      {
        key: "__disableElse",
        ne: true,
      },
    ],
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
  if (!featureEnabled("THREAD_EX_ENABLE_THREAD_STATE")) {
    throw new Error(
      'This event requires the "Feature: Check thread state" engine setting to be enabled (Settings → Engine → Thread Ex).',
    );
  }

  const {
    _addComment,
    _addNL,
    _declareLocal,
    _stackPushConst,
    _stackPushVariable,
    _callNative,
    _stackPop,
    _ifConst,
    _label,
    _jump,
    getNextLabel,
    _compilePath,
  } = helpers;

  // Must stay in sync with THREAD_EX_STATE_* in thread_ex.h
  let wanted = 1;
  if (input.state === "terminated") wanted = 0;
  else if (input.state === "paused") wanted = 2;

  const stateRef = _declareLocal("thread_state", 1, true);
  const falseLabel = getNextLabel();
  const endLabel = getNextLabel();

  _addComment("If Thread State");
  _stackPushConst(stateRef);
  _stackPushVariable(input.variable);
  _callNative("vm_thread_get_state");
  _stackPop(2);

  _ifConst(".NE", stateRef, wanted, falseLabel, 0);
  _addNL();
  _compilePath(input.true);
  _jump(endLabel);
  _label(falseLabel);
  _compilePath(input.__disableElse ? [] : input.false);
  _label(endLabel);
  _addNL();
};
