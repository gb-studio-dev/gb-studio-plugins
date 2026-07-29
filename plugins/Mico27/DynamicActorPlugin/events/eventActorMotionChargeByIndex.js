const WAIT_COL_H = 0x01;
const WAIT_COL_V = 0x02;
const WAIT_COL_PIT = 0x04;
const WAIT_COL_ACTOR = 0x08;

export const id = "EVENT_ACTOR_MOTION_CHARGE_BY_INDEX";
export const name = "Actor Motion: Charge At Target By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg, input) => {
  return `Charge At Target : ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor that charges. Needs a behavior with movement on the dash axis. One event = one charge: wait until aligned with the target, dash at it, stop on impact - place it in a loop.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "targetActorIndex",
    label: "Charge at index",
    description: "Index of the actor to charge at (0 = player).",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "dashAxis",
    label: "Dash axis",
    description:
      "Horizontal = dash sideways when the target is on the same row; Vertical = dash up/down when the target is on the same column",
    type: "select",
    options: [
      ["x", "Horizontal"],
      ["y", "Vertical"],
    ],
    defaultValue: "x",
  },
  {
    key: "alignRange",
    label: "Alignment range (px)",
    description:
      "How close the target must be on the other axis to trigger the charge",
    type: "number",
    min: 1,
    max: 160,
    defaultValue: 8,
  },
  {
    key: "dashVelocity",
    label: "Dash speed",
    description:
      "Dash velocity in subpixels per frame (32 = 1 pixel/frame, max 127)",
    type: "number",
    min: 1,
    max: 127,
    defaultValue: 64,
  },
  {
    key: "stopOnLedge",
    label: "Stop at ledges",
    description:
      "Also stop the dash at a ledge/pit edge (horizontal dash only, needs the Ledge stop component)",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "stopOnActor",
    label: "Stop on actor collision",
    description:
      "Also stop the dash when hitting another collidable actor (needs the Actor collision component)",
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
  __requireEngineField("DYNAMIC_ACTOR_ENABLE_VM_WAIT_FOR_COLLISION", "VM: Wait for collision");

  const {
    variableSetToScriptValue,
    _callNative,
    _stackPush,
    _stackPushConst,
    _stackPop,
    _addComment,
    _addNL,
    _declareLocal,
    _invoke,
    _idle,
    _label,
    _jump,
    _if,
    _ifConst,
    _rpn,
    _actorGetPosition,
    _localRef,
    getNextLabel,
  } = helpers;

  const clampInt = (v, min, max, dflt) => {
    const n = Math.round(Number(v));
    if (!isFinite(n)) return dflt;
    return Math.max(min, Math.min(max, n));
  };

  const alignRange = clampInt(input.alignRange, 1, 160, 8);
  const dashVel = clampInt(input.dashVelocity, 1, 127, 64);
  const axis = input.dashAxis === "y" ? "y" : "x";
  // Position offsets inside the fetched actor struct: 1 = x, 2 = y
  const dashOff = axis === "x" ? 1 : 2;
  const alignOff = axis === "x" ? 2 : 1;
  const setNative =
    axis === "x" ? "vm_set_actor_velocity_x" : "vm_set_actor_velocity_y";

  let waitFlags = axis === "x" ? WAIT_COL_H : WAIT_COL_V;
  if (axis === "x" && input.stopOnLedge === true) waitFlags |= WAIT_COL_PIT;
  if (input.stopOnActor === true) waitFlags |= WAIT_COL_ACTOR;

  const actorRef = _declareLocal("tmp0", 1, true);
  const selfPos = _declareLocal("chg_pos_a", 4, true);
  const targetPos = _declareLocal("chg_pos_b", 4, true);
  const flagRef = _declareLocal("chg_flag", 1, true);

  variableSetToScriptValue(actorRef, input.actorIndex);
  variableSetToScriptValue(selfPos, input.actorIndex);
  variableSetToScriptValue(targetPos, input.targetActorIndex);

  _addComment(`Actor Motion: Charge At Target (${axis})`);

  const setDashVel = (v) => {
    _stackPushConst(v);
    _stackPush(actorRef);
    _callNative(setNative);
    _stackPop(2);
  };

  // Watch: idle until the target is aligned on the other axis
  const detectLabel = getNextLabel();
  const chargeLabel = getNextLabel();
  _label(detectLabel);
  _actorGetPosition(selfPos);
  _actorGetPosition(targetPos);
  _rpn()
    .ref(_localRef(selfPos, alignOff))
    .ref(_localRef(targetPos, alignOff))
    .operator(".SUB")
    .operator(".ABS")
    .int16(alignRange * 32)
    .operator(".LTE")
    .refSet(flagRef)
    .stop();
  _ifConst(".EQ", flagRef, 1, chargeLabel, 0);
  _idle();
  _jump(detectLabel);

  // Dash toward the target's side
  _label(chargeLabel);
  const negLabel = getNextLabel();
  const joinLabel = getNextLabel();
  _if(
    ".LT",
    _localRef(targetPos, dashOff),
    _localRef(selfPos, dashOff),
    negLabel,
    0,
  );
  setDashVel(dashVel);
  _jump(joinLabel);
  _label(negLabel);
  setDashVel(-dashVel);
  _label(joinLabel);

  // Charge until something stops us, then halt
  _stackPushConst(waitFlags);
  _stackPush(actorRef);
  _invoke("vm_wait_for_collision", 2, ".ARG1");
  setDashVel(0);

  _addNL();
};
