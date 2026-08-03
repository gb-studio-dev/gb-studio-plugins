export const id = "EVENT_THREAD_EX_UPDATE_SCRIPT_PAUSE_BY_INDEX";
export const name = "Actor Pause Update Script By Index";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_SCRIPT",
};

export const autoLabel = (fetchArg) => {
  return `Pause update script of actor ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor whose On Update script should be paused (0 = the player).",
    type: "value",
    defaultValue: { type: "number", value: 0 },
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
  if (!featureEnabled("THREAD_EX_ENABLE_ACTOR_UPDATE_PAUSE")) {
    throw new Error(
      'This event requires the "Feature: Pause / resume actor update scripts" engine setting to be enabled (Settings → Engine → Thread Ex).',
    );
  }

  const {
    _addComment,
    _addNL,
    _compileSubScript,
    _stackPushConst,
    _stackPushScriptValue,
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

  _addComment("Actor Pause Update Script");
  _stackPushConst(`___bank_${stubSymbol}`);
  _stackPushConst(`_${stubSymbol}`);
  _stackPushScriptValue(input.actorIndex);
  _callNative("vm_actor_update_script_pause");
  _stackPop(3);
  _addNL();
};
