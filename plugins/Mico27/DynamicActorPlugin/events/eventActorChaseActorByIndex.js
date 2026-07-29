export const id = "EVENT_ACTOR_CHASE_ACTOR_BY_INDEX";
export const name = "Actor Chase Actor By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg, input) => {
  const verb = input.mode === "flee" ? "flee from" : "chase";
  return `Actor ${fetchArg("actorIndex")} ${verb} ${fetchArg("targetActorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor to steer.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "targetActorIndex",
    label: "Target actor index",
    description: "Index of the actor to chase or flee from (0 = player).",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "mode",
    label: "Mode",
    description: "Steer toward the target (chase) or away from it (flee)",
    type: "select",
    options: [
      ["chase", "Chase"],
      ["flee", "Flee"],
    ],
    defaultValue: "chase",
  },
  {
    key: "stopRange",
    label: "Stop range",
    description:
      "Chase: stops once within this range of the target on every steered axis. Flee: stops once beyond this range on any steered axis. 0 = never stop (chase/flee forever - place in a looping thread or an actor's update script).",
    type: "value",
    min: 0,
    max: 32767,
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "interval",
    label: "Target refresh interval",
    description:
      "How often (in frames) to refresh the chased target position from the target actor. Must be a power of 2.",
    type: "select",
    options: [
      ["0", "1 frame"],
      ["1", "2 frames"],
      ["3", "4 frames"],
      ["7", "8 frames"],
      ["15", "16 frames"],
      ["31", "32 frames"],
      ["63", "64 frames"],
      ["127", "128 frames"],
    ],
    defaultValue: "0",
  },
];

export const compile = (input, helpers) => {
  const __engineFieldOn = (key) => {
    const fv =
      helpers.engineFieldValues &&
      helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  const __requireEngineField = (key, label) => {
    if (!__engineFieldOn(key)) {
      throw new Error(
        `This event requires the "${label}" engine setting to be enabled (Settings → Engine fields → Dynamic actor).`
      );
    }
  };
  __requireEngineField("DYNAMIC_ACTOR_ENABLE_VM_MOTION_CHASE_ACTOR", "VM motion: Chase actor");

  const { variableSetToScriptValue, _invoke, _stackPush, _stackPushConst, _stackPushScriptValue, _addComment, _declareLocal } = helpers;

  const actorRef = _declareLocal("actorRef", 1, true);
  const targetRef = _declareLocal("targetRef", 1, true);
  variableSetToScriptValue(actorRef, input.actorIndex);
  variableSetToScriptValue(targetRef, input.targetActorIndex);

  _addComment("Actor Chase Actor By Index");

  _stackPush(actorRef);
  _stackPush(targetRef);
  _stackPushConst(input.mode === "flee" ? 1 : 0);
  _stackPushScriptValue(input.stopRange);
  _stackPushConst(input.interval);
  _stackPushConst(0);
  _stackPushConst(0);
  
  _invoke("vm_actor_chase_actor", 7, ".ARG6");
};
