const l10n = require("../helpers/l10n").default;

export const id = "EVENT_ACTOR_MOTION_SWOOP";
export const name = "Actor Motion: Swoop";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg, input) => {
  return `Swoop Motion : ${fetchArg("actorId")}`;
};

export const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description:
      "Actor to move. Needs a behavior with Move Y enabled (no gravity). X velocity is left untouched, so set it separately to swoop while flying (e.g. bat / keese dive).",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "depth",
    label: "Dive depth (px)",
    description: "How far down the swoop reaches, in pixels",
    type: "number",
    min: 1,
    max: 127,
    defaultValue: 32,
  },
  {
    key: "diveFrames",
    label: "Dive time (frames)",
    description: "Frames spent diving down (eased, fast in the middle)",
    type: "number",
    min: 8,
    max: 512,
    defaultValue: 30,
  },
  {
    key: "climbFrames",
    label: "Climb time (frames)",
    description:
      "Frames spent climbing back up. Longer than the dive gives a natural fast-dive / slow-recover swoop.",
    type: "number",
    min: 8,
    max: 512,
    defaultValue: 60,
  },
  {
    key: "invert",
    label: "Invert (rise then dive)",
    description: "Swoop upward first instead of downward",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "stepFrames",
    label: "Update every (frames)",
    description:
      "Frames between velocity updates. Smaller = smoother but more script commands.",
    type: "number",
    min: 1,
    max: 32,
    defaultValue: 3,
  },
  {
    key: "stopAtEnd",
    label: "Stop at end",
    description:
      "Zero the Y velocity when done. Turn off to chain seamlessly into another motion.",
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
  } = helpers;

  const clampInt = (v, min, max, dflt) => {
    const n = Math.round(Number(v));
    if (!isFinite(n)) return dflt;
    return Math.max(min, Math.min(max, n));
  };

  const depth = clampInt(input.depth, 1, 127, 32);
  const diveFrames = clampInt(input.diveFrames, 8, 512, 30);
  const climbFrames = clampInt(input.climbFrames, 8, 512, 60);
  let stepFrames = clampInt(input.stepFrames, 1, 32, 3);
  const sign = input.invert === true ? -1 : 1;

  // Cap total segments to keep script size sane
  if (Math.round((diveFrames + climbFrames) / stepFrames) > 64) {
    stepFrames = Math.ceil((diveFrames + climbFrames) / 64);
  }

  // Eased dive-then-climb: y(t) follows a half-cosine down over the dive and a
  // half-cosine back up over the climb (velocity 0 at both ends, peak speed at
  // the middle of each phase). Boundary positions are snapped to multiples of
  // stepFrames so segment velocities are integers and the swoop returns to the
  // exact start height (zero drift). Positions in subpixels (32 = 1px).
  let vels;
  const buildVels = (d) => {
    vels = [];
    let prev = 0;
    const emitPhase = (frames, posFn) => {
      let steps = Math.round(frames / stepFrames);
      if (steps < 2) steps = 2;
      for (let k = 1; k <= steps; k++) {
        const ideal = posFn(k / steps);
        const snapped = Math.round(ideal / stepFrames) * stepFrames;
        vels.push((snapped - prev) / stepFrames);
        prev = snapped;
      }
    };
    emitPhase(diveFrames, (t) => (d * (1 - Math.cos(Math.PI * t))) / 2);
    emitPhase(climbFrames, (t) => (d * (1 + Math.cos(Math.PI * t))) / 2);
  };
  let d = depth * 32 * sign;
  buildVels(d);
  // Engine velocities are int8: if the swoop is too fast for +-127 subpx/frame,
  // scale the depth down to the fastest swoop that fits
  const maxV = Math.max(...vels.map(Math.abs));
  if (maxV > 127) {
    d = Math.trunc((d * 127) / maxV);
    buildVels(d);
  }

  const actorRef = _declareLocal("tmp0", 1, true);
  const waitArgsRef = _declareLocal("wait_args", 1, true);

  setActorId(actorRef, input.actorId);

  _addComment(
    `Actor Motion: Swoop (depth ${depth}px, ${diveFrames}+${climbFrames}f)`,
  );

  const setVelY = (v) => {
    _stackPushConst(v);
    _stackPush(actorRef);
    _callNative("vm_set_actor_velocity_y");
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

  for (const v of vels) {
    setVelY(v);
    waitN(stepFrames);
  }

  if (input.stopAtEnd !== false) {
    setVelY(0);
  }

  _addNL();
};
