const l10n = require("../helpers/l10n").default;

export const id = "EVENT_ACTOR_MOTION_BEZIER";
export const name = "Actor Motion: Bezier";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Bezier Motion : ${fetchArg("actorId")}`;
};

const lerp = (a, b, t) => a + (b - a) * t;

const quadraticBezier = (p0, p1, p2, t) => {
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  return lerp(a, b, t);
};

const cubicBezier = (p0, p1, p2, p3, t) => {
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const c = lerp(p2, p3, t);
  const d = lerp(a, b, t);
  const e = lerp(b, c, t);
  return lerp(d, e, t);
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: "Actor to move along the Bezier path",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "bezierType",
    label: "Curve type",
    description: "Use quadratic (3 points) or cubic (4 points)",
    type: "select",
    options: [
      ["quadratic", "Quadratic"],
      ["cubic", "Cubic"],
    ],
    defaultValue: "quadratic",
  },
  {
    key: "incremental",
    label: "Increment per update",
    description:
      "Lerp step in 0..255 units per update. Larger values finish faster.",
    type: "number",
    min: 1,
    max: 255,
    defaultValue: 8,
  },
  {
    key: "stepFrames",
    label: "Update every (frames)",
    description:
      "Frames to keep each generated segment velocity (uses idles/wait_frames).",
    type: "number",
    min: 1,
    max: 32,
    defaultValue: 1,
  },
  {
    key: "cycles",
    label: "Cycles (0 = forever)",
    description: "Number of times to repeat the generated Bezier motion",
    type: "number",
    min: 0,
    max: 255,
    defaultValue: 1,
  },
  {
    key: "stopAtEnd",
    label: "Stop at end",
    description: "Zero velocity when finished",
    type: "checkbox",
    defaultValue: true,
  },
  {
    key: "p0x",
    label: "P0 X (px)",
    type: "number",
    min: -128,
    max: 127,
    width: "50%",
    defaultValue: 0,
  },
  {
    key: "p0y",
    label: "P0 Y (px)",
    type: "number",
    min: -128,
    max: 127,
    width: "50%",
    defaultValue: 0,
  },
  {
    key: "p1x",
    label: "P1 X (px)",
    type: "number",
    min: -128,
    max: 127,
    width: "50%",
    defaultValue: 32,
  },
  {
    key: "p1y",
    label: "P1 Y (px)",
    type: "number",
    min: -128,
    max: 127,
    width: "50%",
    defaultValue: 0,
  },
  {
    key: "p2x",
    label: "P2 X (px)",
    type: "number",
    min: -128,
    max: 127,
    width: "50%",
    defaultValue: 64,
  },
  {
    key: "p2y",
    label: "P2 Y (px)",
    type: "number",
    min: -128,
    max: 127,
    width: "50%",
    defaultValue: 32,
  },
  {
    key: "p3x",
    label: "P3 X (px)",
    type: "number",
    min: -128,
    max: 127,
    width: "50%",
    defaultValue: 96,
    conditions: [
      {
        key: "bezierType",
        eq: "cubic",
      },
    ],
  },
  {
    key: "p3y",
    label: "P3 Y (px)",
    type: "number",
    min: -128,
    max: 127,
    width: "50%",
    defaultValue: 0,
    conditions: [
      {
        key: "bezierType",
        eq: "cubic",
      },
    ],
  },
];

export const compile = (input, helpers) => {
  const {
    _callNative,
    _stackPush,
    _stackPushConst,
    _stackPop,
    _addComment,
    _addNL,
    _declareLocal,
    _setConst,
    _invoke,
    _idle,
    _label,
    _jump,
    _loop,
    getNextLabel,
    setActorId,
  } = helpers;

  const clampInt = (v, min, max, dflt) => {
    const n = Math.round(Number(v));
    if (!isFinite(n)) return dflt;
    return Math.max(min, Math.min(max, n));
  };

  const incremental = clampInt(input.incremental, 1, 255, 8);
  const stepFrames = clampInt(input.stepFrames, 1, 32, 1);
  const cycles = clampInt(input.cycles, 0, 255, 1);

  const p0x = clampInt(input.p0x, -128, 127, 0);
  const p0y = clampInt(input.p0y, -128, 127, 0);
  const p1x = clampInt(input.p1x, -128, 127, 32);
  const p1y = clampInt(input.p1y, -128, 127, 0);
  const p2x = clampInt(input.p2x, -128, 127, 64);
  const p2y = clampInt(input.p2y, -128, 127, 32);
  const p3x = clampInt(input.p3x, -128, 127, 96);
  const p3y = clampInt(input.p3y, -128, 127, 0);

  const actorRef = _declareLocal("actorRef", 1, true);
  const waitArgsRef = _declareLocal("wait_args", 1, true);
  setActorId(actorRef, input.actorId);

  const isCubic = input.bezierType === "cubic";

  _addComment(`Actor Motion: Bezier Pattern (${isCubic ? "cubic" : "quadratic"})`);

  const waitN = (frames) => {
    if (frames <= 0) return;
    if (frames < 5) {
      for (let i = 0; i < frames; i++) _idle();
    } else {
      _setConst(waitArgsRef, frames);
      _invoke("wait_frames", 0, waitArgsRef);
    }
  };

  const setVelXY = (vx, vy) => {
    _stackPushConst(vy);
    _stackPushConst(vx);
    _stackPush(actorRef);
    _callNative("vm_set_actor_velocity");
    _stackPop(3);
  };

  const checkpoints = [];
  checkpoints.push({
    x: 0,
    y: 0,
  });

  for (let t = incremental; ; t += incremental) {
    const clamped = Math.min(255, t);
    const s = clamped / 255;
    const x = isCubic
      ? cubicBezier(p0x, p1x, p2x, p3x, s) - p0x
      : quadraticBezier(p0x, p1x, p2x, s) - p0x;
    const y = isCubic
      ? cubicBezier(p0y, p1y, p2y, p3y, s) - p0y
      : quadraticBezier(p0y, p1y, p2y, s) - p0y;
    checkpoints.push({
      x: Math.round(x * 32),
      y: Math.round(y * 32),
    });
    if (clamped === 255) break;
  }

  const segments = [];
  for (let i = 1; i < checkpoints.length; i++) {
    const dx = checkpoints[i].x - checkpoints[i - 1].x;
    const dy = checkpoints[i].y - checkpoints[i - 1].y;
    segments.push({
      vx: Math.round(dx / stepFrames),
      vy: Math.round(dy / stepFrames),
    });
  }

  const emitPath = () => {
    for (let i = 0; i < segments.length; i++) {
      setVelXY(segments[i].vx, segments[i].vy);
      waitN(stepFrames);
    }
  };

  if (cycles === 0) {
    const topLabel = getNextLabel();
    _label(topLabel);
    emitPath();
    _jump(topLabel);
  } else if (cycles === 1) {
    emitPath();
  } else {
    const counterRef = _declareLocal("cycle_count", 1, true);
    const topLabel = getNextLabel();
    _setConst(counterRef, cycles - 1);
    _label(topLabel);
    emitPath();
    _loop(counterRef, topLabel, 0);
  }

  if (cycles !== 0 && input.stopAtEnd !== false) {
    setVelXY(0, 0);
  }

  _addNL();
};
