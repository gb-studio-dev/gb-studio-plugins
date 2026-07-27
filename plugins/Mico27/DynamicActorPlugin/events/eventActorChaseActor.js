const l10n = require("../helpers/l10n").default;

export const id = "EVENT_ACTOR_CHASE_ACTOR";
export const name = "Actor Chase Actor";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg, input) => {
  const verb = input.mode === "flee" ? "flee from" : "chase";
  return `Actor ${fetchArg("actorId")} ${verb} ${fetchArg("targetActorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: "Actor to steer",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "targetActorId",
    label: "Target actor",
    description: "Actor to chase or flee from",
    type: "actor",
    defaultValue: "player",
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

  const { _invoke, _stackPush, _stackPushConst, _stackPushScriptValue, _addComment, _declareLocal, setActorId } = helpers;

  const actorRef = _declareLocal("actorRef", 1, true);
  const targetRef = _declareLocal("targetRef", 1, true);
  setActorId(actorRef, input.actorId);
  setActorId(targetRef, input.targetActorId);

  _addComment("Actor Chase Actor");

  _stackPush(actorRef);
  _stackPush(targetRef);
  _stackPushConst(input.mode === "flee" ? 1 : 0);
  _stackPushScriptValue(input.stopRange);
  _stackPushConst(input.interval);
  _stackPushConst(0);
  _stackPushConst(0);
  
  _invoke("vm_actor_chase_actor", 7, ".ARG6");
};
