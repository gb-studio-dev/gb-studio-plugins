const l10n = require("../helpers/l10n").default;

export const id = "EVENT_ACTOR_MOTION_CIRCLE";
export const name = "Actor Motion: Circle / Arc";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg, input) => {
  return `Circle Motion : ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description:
      "Actor to move. Needs a behavior with Move X and Move Y enabled (usually with tile collision off).",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "radius",
    label: "Radius (px)",
    description: "Circle radius in pixels",
    type: "number",
    min: 1,
    max: 127,
    defaultValue: 24,
  },
  {
    key: "period",
    label: "Period (frames)",
    description: "Frames for one full revolution (60 = 1 second)",
    type: "number",
    min: 16,
    max: 1024,
    defaultValue: 180,
  },
  {
    key: "direction",
    label: "Direction",
    description: "Direction of rotation",
    type: "select",
    options: [
      ["cw", "Clockwise"],
      ["ccw", "Counter-clockwise"],
    ],
    defaultValue: "cw",
  },
  {
    key: "startAngle",
    label: "Start angle (degrees)",
    description:
      "Where on the circle the actor starts: 0 = top of the circle, 90 = right, 180 = bottom, 270 = left",
    type: "number",
    min: 0,
    max: 359,
    defaultValue: 0,
  },
  {
    key: "arcDegrees",
    label: "Arc (degrees)",
    description:
      "How much of the circle to travel. 360 = full circle (loops without drift), 180 = half circle (u-turn / swoop arc).",
    type: "number",
    min: 15,
    max: 360,
    defaultValue: 360,
  },
  {
    key: "stepFrames",
    label: "Update every (frames)",
    description:
      "Frames between velocity updates. Smaller = smoother but more script commands.",
    type: "number",
    min: 1,
    max: 32,
    defaultValue: 4,
  },
  {
    key: "cycles",
    label: "Cycles (0 = forever)",
    description: "Number of times to run the circle/arc before continuing",
    type: "number",
    min: 0,
    max: 255,
    defaultValue: 1,
  },
  {
    key: "stopAtEnd",
    label: "Stop at end",
    description:
      "Zero the velocity when done. Turn off to chain seamlessly into another motion.",
    type: "checkbox",
    defaultValue: true,
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
    setActorId,
    _setConst,
    _invoke,
    _idle,
    _label,
    _jump,
    _loop,
    getNextLabel,
  } = helpers;

  const clampInt = (v, min, max, dflt) => {
    const n = Math.round(Number(v));
    if (!isFinite(n)) return dflt;
    return Math.max(min, Math.min(max, n));
  };

  const radius = clampInt(input.radius, 1, 127, 24);
  const period = clampInt(input.period, 16, 1024, 180);
  let stepFrames = clampInt(input.stepFrames, 1, 32, 4);
  const cycles = clampInt(input.cycles, 0, 255, 1);
  const startAngle = clampInt(input.startAngle, 0, 359, 0);
  const arcDegrees = clampInt(input.arcDegrees, 15, 360, 360);
  const dir = input.direction === "ccw" ? -1 : 1;

  // Frames spent on the requested arc
  const arcFrames = Math.max(stepFrames * 2, Math.round((period * arcDegrees) / 360));
  let steps = Math.round(arcFrames / stepFrames);
  if (steps > 64) {
    stepFrames = Math.ceil(arcFrames / 64);
    steps = Math.round(arcFrames / stepFrames);
  }
  if (steps < 2) steps = 2;

  // Quantized circle: boundary positions snapped to multiples of stepFrames so
  // every segment velocity is an integer; a full 360 arc closes exactly (zero
  // drift when looped). Angle 0 = top of circle; position x = R*sin, y = -R*cos.
  const theta0 = (startAngle * Math.PI) / 180;
  const arcRad = (arcDegrees * Math.PI) / 180;
  let velsX, velsY;
  const buildVels = (r) => {
    velsX = [];
    velsY = [];
    let prevX = Math.round((r * Math.sin(theta0)) / stepFrames) * stepFrames;
    let prevY = Math.round((-r * Math.cos(theta0)) / stepFrames) * stepFrames;
    for (let k = 1; k <= steps; k++) {
      const theta = theta0 + dir * ((arcRad * k) / steps);
      const px = Math.round((r * Math.sin(theta)) / stepFrames) * stepFrames;
      const py = Math.round((-r * Math.cos(theta)) / stepFrames) * stepFrames;
      velsX.push((px - prevX) / stepFrames);
      velsY.push((py - prevY) / stepFrames);
      prevX = px;
      prevY = py;
    }
  };
  let r = radius * 32;
  buildVels(r);
  // Engine velocities are int8: if the orbit is too fast for +-127 subpx/frame,
  // scale the radius down to the fastest orbit that fits
  const maxV = Math.max(...velsX.map(Math.abs), ...velsY.map(Math.abs));
  if (maxV > 127) {
    r = Math.trunc((r * 127) / maxV);
    buildVels(r);
  }

  const actorRef = _declareLocal("tmp0", 1, true);
  const waitArgsRef = _declareLocal("wait_args", 1, true);

  setActorId(actorRef, input.actorId);

  _addComment(
    `Actor Motion: Circle (r ${radius}px, ${arcDegrees} deg, ${
      steps * stepFrames
    }f)`,
  );

  const setVelXY = (vx, vy) => {
    _stackPushConst(vy);
    _stackPushConst(vx);
    _stackPush(actorRef);
    _callNative("vm_set_actor_velocity");
    _stackPop(3);
  };

  const waitN = (frames) => {
    if (frames <= 0) return;
    if (frames < 5) {
      for (let i = 0; i < frames; i++) _idle();
    } else {
      _setConst(waitArgsRef, frames);
      _invoke("wait_frames", 0, waitArgsRef);
    }
  };

  const emitCycle = () => {
    for (let k = 0; k < steps; k++) {
      setVelXY(velsX[k], velsY[k]);
      waitN(stepFrames);
    }
  };

  if (cycles === 0) {
    const topLabel = getNextLabel();
    _label(topLabel);
    emitCycle();
    _jump(topLabel);
  } else if (cycles === 1) {
    emitCycle();
  } else {
    const counterRef = _declareLocal("cycle_count", 1, true);
    _setConst(counterRef, cycles - 1);
    const topLabel = getNextLabel();
    _label(topLabel);
    emitCycle();
    _loop(counterRef, topLabel, 0);
  }

  if (cycles !== 0 && input.stopAtEnd !== false) {
    setVelXY(0, 0);
  }

  _addNL();
};
