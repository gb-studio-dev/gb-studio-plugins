const l10n = require("../helpers/l10n").default;

export const id = "EVENT_WAIT_FOR_ACTOR_IN_RANGE";
export const name = "Wait For Actor In Range";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg, input) => {
  return `Wait For Actor In Range : ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: "Actor at the center of the range check",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "targetActorId",
    label: "Wait for",
    description: "Actor whose distance is checked (usually the player)",
    type: "actor",
    defaultValue: "player",
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
  const {
    _addComment,
    _addNL,
    _declareLocal,
    setActorId,
    _idle,
    _label,
    _jump,
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

  const rangeX = clampInt(input.rangeX, 1, 255, 32);
  const rangeY = clampInt(input.rangeY, 1, 255, 32);
  // If both axes are disabled fall back to checking X so the wait can finish
  const checkX = input.checkX !== false || input.checkY === false;
  const checkY = input.checkY !== false;
  const waitForInside = input.until !== "outside";

  const selfPos = _declareLocal("rng_pos_a", 4, true);
  const targetPos = _declareLocal("rng_pos_b", 4, true);
  const flagRef = _declareLocal("rng_flag", 1, true);

  setActorId(selfPos, input.actorId);
  setActorId(
    targetPos,
    input.targetActorId != null ? input.targetActorId : "player",
  );

  _addComment(
    `Wait For Actor In Range (${waitForInside ? "inside" : "outside"})`,
  );

  const loopLabel = getNextLabel();
  const doneLabel = getNextLabel();
  _label(loopLabel);
  _actorGetPosition(selfPos);
  _actorGetPosition(targetPos);

  // flag = 1 while the target is inside range on every checked axis
  const rpn = _rpn().int16(1);
  if (checkX) {
    rpn
      .ref(_localRef(selfPos, 1))
      .ref(_localRef(targetPos, 1))
      .operator(".SUB")
      .operator(".ABS")
      .int16(rangeX * 32)
      .operator(".LTE")
      .operator(".AND");
  }
  if (checkY) {
    rpn
      .ref(_localRef(selfPos, 2))
      .ref(_localRef(targetPos, 2))
      .operator(".SUB")
      .operator(".ABS")
      .int16(rangeY * 32)
      .operator(".LTE")
      .operator(".AND");
  }
  rpn.refSet(flagRef).stop();

  _ifConst(".EQ", flagRef, waitForInside ? 1 : 0, doneLabel, 0);
  _idle();
  _jump(loopLabel);
  _label(doneLabel);

  _addNL();
};
