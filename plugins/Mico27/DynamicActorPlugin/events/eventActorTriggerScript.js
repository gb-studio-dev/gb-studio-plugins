export const id = "EVENT_DYNAMIC_ACTOR_TRIGGER_SCRIPT";
export const name = "Actor Trigger Script";
export const groups = ["EVENT_GROUP_ACTOR"];
export const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

export const autoLabel = (fetchArg) => {
  return `Trigger ${fetchArg("which")} script of actor ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: "Actor",
    description:
      "Actor whose script should run.",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "which",
    label: "Script",
    description:
      "Which script to force. On Hit runs the actor's hit script for the chosen collision group, exactly like a real collision would.",
    type: "select",
    options: [
      ["interact", "On Interact"],
      ["hit", "On Hit (collision group)"],
      ["update", "On Update (restart if stopped)"],
    ],
    defaultValue: "interact",
  },
  {
    key: "group",
    label: "Collision Group",
    description: "Collision group whose On Hit script should run.",
    type: "select",
    options: [
      ["2", "Collision Group 1"],
      ["4", "Collision Group 2"],
      ["8", "Collision Group 3"],
      ["1", "Player"],
    ],
    defaultValue: "2",
    conditions: [
      {
        key: "which",
        eq: "hit",
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
  if (!featureEnabled("DYNAMIC_ACTOR_ENABLE_TRIGGER_SCRIPT")) {
    throw new Error(
      'This event requires the "Force trigger actor script" engine setting to be enabled (Settings → Engine → Dynamic actor).',
    );
  }

  const {
    setActorId,
    _stackPush,
    _declareLocal,
    _addComment,
    _addNL,
    _stackPushConst,
    _callNative,
    _stackPop,
  } = helpers;

  // Must stay in sync with ACTOR_TRIGGER_* in vm_dynamic_actor.c
  let which = 0;
  if (input.which === "hit") which = 1;
  else if (input.which === "update") which = 2;

  const group = which === 1 ? Number(input.group) || 2 : 0;

  const actorRef = _declareLocal("actor_idx", 1, true);
  setActorId(actorRef, input.actorId);

  _addComment("Actor Trigger Script");
  _stackPush(actorRef);
  _stackPushConst(which);
  _stackPushConst(group);
  _callNative("vm_actor_trigger_script");
  _stackPop(3);
  _addNL();
};
