export const id = "EVENT_WAIT_FOR_ACTOR_STATE_BY_INDEX";
export const name = "Wait For Actor State By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg, input) => {
  return `Wait For Actor State : ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor whose behavior state to wait for. Grounded/airborne are managed by behaviors with Gravity + Move Y enabled.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "state",
    label: "Wait until state is",
    description: "Behavior state to wait for",
    type: "select",
    options: [
      [1, "Grounded (landed)"],
      [2, "Airborne Y (in the air by Y movement)"],
      [3, "Airborne Z (pos_z above ground)"],
      [0, "Paused"],
    ],
    defaultValue: 1,
  },
  {
    key: "invert",
    label: "Invert (wait until NOT in this state)",
    description: "Continue once the actor leaves the chosen state instead",
    type: "checkbox",
    defaultValue: false,
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
  __requireEngineField(
    "DYNAMIC_ACTOR_ENABLE_VM_WAIT_FOR_STATE",
    "VM: Wait for actor state"
  );

  const {
    variableSetToScriptValue,
    _stackPush,
    _stackPushConst,
    _addComment,
    _declareLocal,
    _invoke,
  } = helpers;

  const state = [0, 1, 2, 3].includes(Number(input.state))
    ? Number(input.state)
    : 1;
  const invert = input.invert === true;

  const actorRef = _declareLocal("actorRef", 1, true);

  variableSetToScriptValue(actorRef, input.actorIndex);

  _addComment(`Wait For Actor State ${invert ? "!=" : "=="} ${state}`);
  _stackPush(actorRef);
  _stackPushConst(state);
  _stackPushConst(invert ? 1 : 0);
  _invoke("vm_wait_for_actor_state", 3, ".ARG2");
};
