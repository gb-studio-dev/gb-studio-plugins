const WAIT_RNG_X = 0x01;
const WAIT_RNG_Y = 0x02;
const WAIT_RNG_OUTSIDE = 0x04;

// Pixel -> actor position subpixel scale
const SUBPX = 32;

export const id = "EVENT_WAIT_FOR_ACTOR_IN_RANGE_BY_INDEX";
export const name = "Wait For Actor In Range By Index";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg, input) => {
  return `Wait For Actor In Range : ${fetchArg("actorIndex")}`;
};

export const fields = [
  {
    key: "actorIndex",
    label: "Actor Index",
    description: "Index of the actor at the center of the range check.",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "targetActorIndex",
    label: "Wait for index",
    description: "Index of the actor whose distance is checked (0 = player).",
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "until",
    label: "Wait until",
    description:
      "Inside = continue once the target is within range (proximity trigger); Outside = continue once the target has left the range",
    type: "select",
    options: [
      ["inside", "Target is inside range"],
      ["outside", "Target is outside range"],
    ],
    defaultValue: "inside",
  },
  {
    key: "checkX",
    label: "Check horizontal distance",
    description: "Include the X axis in the range check",
    type: "checkbox",
    defaultValue: true,
  },
  {
    key: "rangeX",
    label: "X range (px)",
    description: "Maximum horizontal distance in pixels",
    type: "number",
    min: 1,
    max: 255,
    defaultValue: 32,
    conditions: [
      {
        key: "checkX",
        eq: true,
      },
    ],
  },
  {
    key: "checkY",
    label: "Check vertical distance",
    description: "Include the Y axis in the range check",
    type: "checkbox",
    defaultValue: true,
  },
  {
    key: "rangeY",
    label: "Y range (px)",
    description: "Maximum vertical distance in pixels",
    type: "number",
    min: 1,
    max: 255,
    defaultValue: 32,
    conditions: [
      {
        key: "checkY",
        eq: true,
      },
    ],
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
    "DYNAMIC_ACTOR_ENABLE_VM_WAIT_FOR_IN_RANGE",
    "VM: Wait for actor in range"
  );

  const {
    variableSetToScriptValue,
    _addComment,
    _declareLocal,
    _stackPush,
    _stackPushConst,
    _invoke,
  } = helpers;

  const clampInt = (v, min, max, dflt) => {
    const n = Math.round(Number(v));
    if (!isFinite(n)) return dflt;
    return Math.max(min, Math.min(max, n));
  };

  const rangeX = clampInt(input.rangeX, 1, 255, 32);
  const rangeY = clampInt(input.rangeY, 1, 255, 32);
  // If both axes are disabled fall back to checking X so the wait can finish
  const checkX = input.checkX !== false || input.checkY === false;
  const checkY = input.checkY !== false;
  const waitForInside = input.until !== "outside";

  let flags = 0;
  if (checkX) flags |= WAIT_RNG_X;
  if (checkY) flags |= WAIT_RNG_Y;
  if (!waitForInside) flags |= WAIT_RNG_OUTSIDE;

  const actorRef = _declareLocal("rng_actor", 1, true);
  const targetRef = _declareLocal("rng_target", 1, true);

  variableSetToScriptValue(actorRef, input.actorIndex);
  variableSetToScriptValue(targetRef, input.targetActorIndex);

  _addComment(
    `Wait For Actor In Range (${waitForInside ? "inside" : "outside"})`,
  );
  _stackPush(actorRef);
  _stackPush(targetRef);
  _stackPushConst(flags);
  _stackPushConst(rangeX * SUBPX);
  _stackPushConst(rangeY * SUBPX);
  _invoke("vm_wait_for_actor_in_range", 5, ".ARG4");
};
