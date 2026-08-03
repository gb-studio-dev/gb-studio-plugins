export const id = "EVENT_THREAD_EX_UPDATE_SCRIPT_RESUME";
export const name = "Actor Resume Update Script";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_SCRIPT",
};

export const autoLabel = (fetchArg) => {
  return `Resume update script of actor ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: "Actor",
    description:
      "Actor whose On Update script should resume from where it was paused.",
    type: "actor",
    defaultValue: "$self$",
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
    _declareLocal,
    setActorId,
    _stackPush,
    _callNative,
    _stackPop,
  } = helpers;

  const actorRef = _declareLocal("actor_idx", 1, true);
  setActorId(actorRef, input.actorId);

  _addComment("Actor Resume Update Script");
  _stackPush(actorRef);
  _callNative("vm_actor_update_script_resume");
  _stackPop(1);
  _addNL();
};
