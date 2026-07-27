const l10n = require("../helpers/l10n").default;

export const id = "EVENT_ACTOR_MOTION_SINE";
export const name = "Actor Motion: Sine Wave";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg, input) => {
  return `Sine Wave Motion : ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: "Actor to move. Needs a behavior with Move X / Move Y enabled.",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "axis",
    label: "Axis",
    description: "Axis to oscillate on. The other axis is left untouched.",
    type: "select",
    options: [
      ["y", "Vertical (Y)"],
      ["x", "Horizontal (X)"],
    ],
    defaultValue: "y",
  },
  {
    key: "amplitude",
    label: "Amplitude (px)",
    description: "Peak distance from the start position, in pixels",
    type: "number",
    min: 1,
    max: 127,
    defaultValue: 16,
  },
  {
    key: "period",
    label: "Period (frames)",
    description: "Frames for one full wave cycle (60 = 1 second)",
    type: "number",
    min: 8,
    max: 1024,
    defaultValue: 120,
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
    key: "invert",
    label: "Invert (start moving up / left)",
    description: "Start the wave in the negative direction",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "cycles",
    label: "Cycles (0 = forever)",
    description: "Number of full wave cycles to run before continuing",
    type: "number",
    min: 0,
    max: 255,
    defaultValue: 1,
  },
  {
    key: "stopAtEnd",
    label: "Stop at end",
    description:
      "Zero the axis velocity when done. Turn off to chain seamlessly into another motion.",
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

  const amplitude = clampInt(input.amplitude, 1, 127, 16);
  const period = clampInt(input.period, 8, 1024, 120);
  let stepFrames = clampInt(input.stepFrames, 1, 32, 4);
  const cycles = clampInt(input.cycles, 0, 255, 1);
  const axis = input.axis === "x" ? "x" : "y";
  const invert = input.invert === true;

  // Number of velocity segments per cycle (capped to keep script size sane)
  let steps = Math.round(period / stepFrames);
  if (steps > 64) {
    stepFrames = Math.ceil(period / 64);
    steps = Math.round(period / stepFrames);
  }
  if (steps < 2) steps = 2;

  // Quantized wave: boundary positions are snapped to multiples of stepFrames
  // so every segment velocity is an integer and the cycle closes exactly
  // (zero drift, safe to loop forever). Positions in subpixels (32 = 1px).
  const buildVels = (a) => {
    const out = [];
    let prev = 0;
    for (let k = 1; k <= steps; k++) {
      const ideal = a * Math.sin((2 * Math.PI * k) / steps);
      const snapped = Math.round(ideal / stepFrames) * stepFrames;
      out.push((snapped - prev) / stepFrames);
      prev = snapped;
    }
    return out;
  };
  let amp = amplitude * 32 * (invert ? -1 : 1);
  let vels = buildVels(amp);
  // Engine velocities are int8: if the wave is too fast for +-127 subpx/frame,
  // scale the amplitude down to the fastest wave that fits
  const maxV = Math.max(...vels.map(Math.abs));
  if (maxV > 127) {
    amp = Math.trunc((amp * 127) / maxV);
    vels = buildVels(amp);
  }

  const actorRef = _declareLocal("tmp0", 1, true);
  const waitArgsRef = _declareLocal("wait_args", 1, true);

  setActorId(actorRef, input.actorId);

  _addComment(
    `Actor Motion: Sine Wave (${axis}, amp ${amplitude}px, period ${
      steps * stepFrames
    }f)`,
  );

  const setAxisVel = (v) => {
    _stackPushConst(v);
    _stackPush(actorRef);
    _callNative(
      axis === "x" ? "vm_set_actor_velocity_x" : "vm_set_actor_velocity_y",
    );
    _stackPop(2);
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
    for (const v of vels) {
      setAxisVel(v);
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
    setAxisVel(0);
  }

  _addNL();
};
