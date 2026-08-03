// -----------------------------------------------------------------------------
// Camera Ex shared definitions.
//
// GB Studio event files are sandboxed and cannot require a sibling module, so
// this block is duplicated verbatim across every Camera Ex event. It is
// generated - edit tools/genEvents.js and re-run it rather than editing one
// copy. Must stay in sync with engine/include/camera_ex.h.
// -----------------------------------------------------------------------------

const PATH_DIAGONAL = 0;
const PATH_HORIZONTAL = 1;
const PATH_VERTICAL = 2;
const PATH_LINE = 3;

const MEDIAN_BOUNDS = 0;
const MEDIAN_AVERAGE = 1;

const CAMERA_LOCK_X_FLAG = 0x01;
const CAMERA_LOCK_Y_FLAG = 0x02;
const CAMERA_LOCK_X_MIN_FLAG = 0x04;
const CAMERA_LOCK_X_MAX_FLAG = 0x08;
const CAMERA_LOCK_Y_MIN_FLAG = 0x10;
const CAMERA_LOCK_Y_MAX_FLAG = 0x20;

const SUBPX_PER_PX = 32;
const SUBPX_PER_TILE = 256;

// The camera position is the centre of the view, so half a screen is added to
// the requested top left corner, exactly as the stock camera events do.
const SCREEN_HALF_X_SUBPX = 80 * SUBPX_PER_PX;
const SCREEN_HALF_Y_SUBPX = 72 * SUBPX_PER_PX;

const pathModeField = (defaultValue) => ({
  key: "pathMode",
  label: "Path",
  description:
    "Route the camera takes while it travels. Direct line follows the true straight line between the two points; the other three are the stock behaviours.",
  type: "select",
  options: [
    [PATH_LINE, "Direct line"],
    [PATH_DIAGONAL, "Diagonal"],
    [PATH_HORIZONTAL, "Horizontal first"],
    [PATH_VERTICAL, "Vertical first"],
  ],
  defaultValue: defaultValue === undefined ? PATH_LINE : defaultValue,
  width: "50%",
});

const smoothSpeedField = () => ({
  key: "smoothSpeed",
  label: "Smoothing",
  description:
    "How fast the camera catches up with its target, in pixels per frame. Instant reproduces the stock camera, which snaps to its target every frame.",
  type: "moveSpeed",
  allowNone: true,
  noneLabel: "Instant",
  defaultValue: 0,
  width: "50%",
});

const lockAxisField = {
  key: "axis",
  label: "Lock Axis",
  description: "Axes the camera follows its target on.",
  type: "togglebuttons",
  options: [
    ["x", "H", "Horizontal"],
    ["y", "V", "Vertical"],
  ],
  allowMultiple: true,
  allowNone: false,
  defaultValue: ["x", "y"],
  width: "50%",
};

const preventScrollField = {
  key: "preventScroll",
  label: "Prevent Backtracking",
  description:
    "Directions the camera is not allowed to scroll back towards once it has moved.",
  type: "direction",
  allowMultiple: true,
};

const medianField = {
  key: "median",
  label: "Combine",
  description:
    "How the followed actors are reduced to a single point. Midpoint keeps every actor equally framed; Average is pulled towards clusters of actors.",
  type: "select",
  options: [
    [MEDIAN_BOUNDS, "Midpoint of all actors"],
    [MEDIAN_AVERAGE, "Average of all actors"],
  ],
  defaultValue: MEDIAN_BOUNDS,
  width: "50%",
};

// Builds the camera_settings byte the engine expects.
const lockFlags = (axis, preventScroll) => {
  const axes = axis || ["x", "y"];
  const dirs = preventScroll || [];
  return (
    (axes.includes("x") ? CAMERA_LOCK_X_FLAG : 0) |
    (axes.includes("y") ? CAMERA_LOCK_Y_FLAG : 0) |
    (dirs.includes("left") ? CAMERA_LOCK_X_MIN_FLAG : 0) |
    (dirs.includes("right") ? CAMERA_LOCK_X_MAX_FLAG : 0) |
    (dirs.includes("up") ? CAMERA_LOCK_Y_MIN_FLAG : 0) |
    (dirs.includes("down") ? CAMERA_LOCK_Y_MAX_FLAG : 0)
  );
};

// moveSpeed fields are pixels per frame; the engine works in subpixels and
// accepts at most one byte of step.
const toSubpxSpeed = (speed) => {
  const subpx = Math.floor(Number(speed || 0) * SUBPX_PER_PX);
  if (!Number.isFinite(subpx) || subpx < 0) return 0;
  return subpx > 255 ? 255 : subpx;
};

const toPathMode = (mode) => {
  const value = Number(mode);
  return Number.isFinite(value) && value >= 0 && value <= 3 ? value : PATH_LINE;
};

// Converts a script value expressed in `units` into a camera coordinate.
const toCameraSubpx = (value, units, halfScreen) => ({
  type: "add",
  valueA: {
    type: "mul",
    valueA: value,
    valueB: {
      type: "number",
      value: units === "pixels" ? SUBPX_PER_PX : SUBPX_PER_TILE,
    },
  },
  valueB: { type: "number", value: halfScreen },
});

// Pushes one actor onto the camera's follow list. `target` is either
// { actorId } (a scene actor field) or { actorIndex } (a script value).
const compileTargetAdd = (target, helpers) => {
  const {
    _callNative,
    _stackPush,
    _stackPushScriptValue,
    _stackPop,
    _declareLocal,
    setActorId,
  } = helpers;

  if (target.actorId !== undefined) {
    // Resolve the actor field (including $self$) to a scene index first.
    const actorRef = _declareLocal("camera_target", 1, true);
    setActorId(actorRef, target.actorId);
    _stackPush(actorRef);
  } else {
    _stackPushScriptValue(target.actorIndex);
  }
  _callNative("vm_camera_target_add");
  _stackPop(1);
};

// Clears the follow list, sets the combine mode, then adds each target.
// An empty list leaves the camera following the player.
const compileTargets = (targets, median, helpers) => {
  const { _callNative, _stackPushConst, _stackPop } = helpers;

  _stackPushConst(
    Number(median) === MEDIAN_AVERAGE ? MEDIAN_AVERAGE : MEDIAN_BOUNDS,
  );
  _callNative("vm_camera_targets_begin");
  _stackPop(1);

  for (const target of targets) {
    compileTargetAdd(target, helpers);
  }
};

const compileSmoothing = (speed, mode, helpers) => {
  const { _callNative, _stackPushConst, _stackPop } = helpers;
  _stackPushConst(toSubpxSpeed(speed));
  _stackPushConst(toPathMode(mode));
  _callNative("vm_camera_set_smooth");
  _stackPop(2);
};

const compileLock = (axis, preventScroll, helpers) => {
  const { _callNative, _stackPushConst, _stackPop } = helpers;
  _stackPushConst(lockFlags(axis, preventScroll));
  _callNative("vm_camera_set_lock");
  _stackPop(1);
};

const id = "EVENT_CAMERA_EX_MOVE_TO";
const name = "Camera Move To (Extended)";
const groups = ["EVENT_GROUP_CAMERA"];

const autoLabel = (fetchArg, input) => {
  const unit = input.units === "pixels" ? "px" : "";
  return `Camera move to ${fetchArg("x")}${unit}, ${fetchArg("y")}${unit}`;
};

const coordField = (key, label) => ({
  key,
  label,
  description: `${label} coordinate of the top left of the view.`,
  type: "value",
  min: 0,
  max: 2047,
  width: "50%",
  unitsField: "units",
  unitsDefault: "tiles",
  unitsAllowed: ["tiles", "pixels"],
  defaultValue: { type: "number", value: 0 },
});

const fields = [
  { type: "group", fields: [coordField("x", "X"), coordField("y", "Y")] },
  {
    type: "group",
    fields: [
      {
        key: "speed",
        label: "Speed",
        description:
          "Camera travel speed in pixels per frame. Instant jumps straight to the destination.",
        type: "moveSpeed",
        defaultValue: 1,
        allowNone: true,
        noneLabel: "Instant",
        width: "50%",
      },
      pathModeField(),
    ],
  },
  {
    key: "relock",
    label: "Lock camera after move",
    description:
      "Re-enable camera following once the destination has been reached. When off the camera stays where it was moved to.",
    type: "checkbox",
    defaultValue: false,
  },
  {
    type: "group",
    conditions: [{ key: "relock", eq: true }],
    fields: [lockAxisField],
  },
  {
    key: "preventScroll",
    label: preventScrollField.label,
    description: preventScrollField.description,
    type: "direction",
    allowMultiple: true,
    conditions: [{ key: "relock", eq: true }],
  },
];

const compile = (input, helpers) => {
  const {
    _addComment,
    _addNL,
    _declareLocal,
    _localRef,
    _set,
    _setConst,
    _invoke,
    variableSetToScriptValue,
  } = helpers;

  _addComment("Camera Move To (Extended)");

  // [0] X, [1] Y, [2] speed, [3] path mode, [4] lock settings to restore.
  const argsRef = _declareLocal("camera_move_args", 5, true);
  // variableSetToScriptValue only resolves a local's base slot, so anything
  // past slot 0 is built in a scratch local and copied into place.
  const tmpRef = _declareLocal("camera_move_tmp", 1, true);

  variableSetToScriptValue(
    argsRef,
    toCameraSubpx(input.x, input.units, SCREEN_HALF_X_SUBPX),
  );
  variableSetToScriptValue(
    tmpRef,
    toCameraSubpx(input.y, input.units, SCREEN_HALF_Y_SUBPX),
  );
  _set(_localRef(argsRef, 1), tmpRef);
  _setConst(_localRef(argsRef, 2), toSubpxSpeed(input.speed));
  _setConst(_localRef(argsRef, 3), toPathMode(input.pathMode));
  _setConst(
    _localRef(argsRef, 4),
    input.relock ? lockFlags(input.axis, input.preventScroll) : 0,
  );

  _invoke("camera_move_to_frames", 0, argsRef);
  _addNL();
};

module.exports = {
  id,
  name,
  description:
    "Moves the camera to a position along a chosen path. Adds a true direct line option to the stock horizontal first / vertical first / diagonal routes.",
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
  helper: { type: "camera", x: "x", y: "y", units: "units" },
};
