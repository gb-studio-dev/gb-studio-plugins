// GENERATED FILE - do not edit.
// Run `node tools/gen_by_index_events.js` after changing
// eventLaunchProjectileSlotEx.js, which this is derived from.
const id = "DYNPROJ_EVENT_LAUNCH_PROJECTILE_SLOT_BY_INDEX";
const name = "Launch Dynamic Projectile From Slot By Index";
const groups = ["Projectiles"];

const maxProjectileSlots = (helpers) => {
  const key = "DYNPROJ_MAX_PROJECTILE_DEFS";
  const value =
    helpers.engineFieldValues &&
    helpers.engineFieldValues.find((s) => s.id === key);
  if (value && value.value !== undefined && value.value !== null) {
    return Number(value.value);
  }
  const field = helpers.engineFields && helpers.engineFields[key];
  return field ? Number(field.defaultValue) : 5;
};

/** The slot becomes a raw operand, so an out of range one must not compile. */
const requireSlot = (helpers, slot) => {
  const max = maxProjectileSlots(helpers);
  if (!Number.isInteger(slot) || slot < 0 || slot >= max) {
    throw new Error(
      `Projectile slot ${slot} is out of range. "Max projectile slots" is ${max}, so slots 0 to ${
        max - 1
      } are available (Settings -> Engine -> Dynamic Projectiles).`
    );
  }
};

const sourceTab = { key: "tabs", in: ["source", undefined] };
const paramsTab = { key: "tabs", in: ["params"] };
const fromActor = { key: "sourceType", in: ["actor", undefined] };
const fromPosition = { key: "sourceType", eq: "position" };

// Positions are stored in sub-pixels: 32 per pixel (<< 5), 256 per tile (<< 8).
const SUBPX_SHIFT_PIXELS = 5;
const SUBPX_SHIFT_TILES = 8;

// Matches GB Studio's own dirToAngle.
const DIR_ANGLES = { up: 0, right: 64, down: 128, left: 192 };

const shiftLeftScriptValueConst = (value, num) => ({
  type: "shl",
  valueA: value,
  valueB: { type: "number", value: num },
});

/** Sub-pixel conversion as a script value, so any value form works. */
const scriptValueToSubpixels = (value, units) =>
  shiftLeftScriptValueConst(
    value ?? { type: "number", value: 0 },
    units === "pixels" ? SUBPX_SHIFT_PIXELS : SUBPX_SHIFT_TILES
  );

const TILE_SUBPX = 1 << SUBPX_SHIFT_TILES;

/**
 * Angle from a source point to a target point, built exactly like the stock
 * launchProjectileTowardsActor: both deltas are scaled down to whole tiles so
 * they stay in range, then ATAN2 with dy underneath dx.
 */
const rpnAimAt = (rpn, targetX, targetY, sourceX, sourceY) =>
  rpn
    .ref(targetY)
    .ref(sourceY)
    .operator(".SUB")
    .int16(TILE_SUBPX)
    .operator(".DIV")
    .ref(targetX)
    .ref(sourceX)
    .operator(".SUB")
    .int16(TILE_SUBPX)
    .operator(".DIV")
    .operator(".ATAN2");

const fields = [
  {
    key: "tabs",
    type: "tabs",
    defaultValue: "source",
    values: {
      source: "Source",
      params: "Dynamic projectile",
    },
  },
  {
    label:
      "Same as the stock Launch Projectile In Slot event, but the slot is a plain number so it can reach the extra slots added by the Max projectile slots setting. Actors are given as indexes (0 = player, then scene order) so they can come from a variable. The Dynamic projectile tab carries the few values that are per launch rather than per slot.",
  },
  {
    key: "slot",
    label: "Projectile Slot",
    description:
      "Slot to launch from. Must be below the Max projectile slots engine setting, and something must have been loaded into it first.",
    type: "number",
    min: 0,
    max: 19,
    defaultValue: 0,
  },
  {
    key: "sourceType",
    label: "Launch From",
    description:
      "Fire from an actor, or from a fixed point in the scene with no actor involved.",
    type: "select",
    options: [
      ["actor", "Actor"],
      ["position", "Position"],
    ],
    defaultValue: "actor",
    conditions: [sourceTab],
  },
  {
    key: "actorIndex",
    label: "Source",
    description:
      "Index of the actor the projectile is launched from (0 = player).",
    type: "value",
    defaultValue: { type: "number", value: 0 },
    conditions: [sourceTab, fromActor],
  },
  {
    type: "group",
    conditions: [sourceTab, fromPosition],
    fields: [
      {
        key: "posX",
        label: "X",
        type: "value",
        width: "50%",
        defaultValue: { type: "number", value: 0 },
        unitsField: "posUnits",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
      {
        key: "posY",
        label: "Y",
        type: "value",
        width: "50%",
        defaultValue: { type: "number", value: 0 },
        unitsField: "posUnits",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
    ],
  },
  {
    type: "group",
    conditions: [sourceTab, fromActor],
    fields: [
      {
        key: "x",
        label: "Offset X",
        type: "number",
        min: -256,
        max: 256,
        width: "50%",
        defaultValue: 0,
      },
      {
        key: "y",
        label: "Offset Y",
        type: "number",
        min: -256,
        max: 256,
        width: "50%",
        defaultValue: 0,
      },
    ],
  },
  {
    type: "group",
    conditions: [sourceTab, fromActor],
    fields: [
      {
        label: "Launch At",
        key: "directionType",
        type: "select",
        options: [
          ["direction", "Fixed Direction"],
          ["actor", "Actor Direction"],
          ["target", "Actor Target"],
          ["targetpos", "Position Target"],
          ["angle", "Angle"],
          ["anglevar", "Angle Variable"],
        ],
        defaultValue: "direction",
        alignBottom: true,
      },
      {
        key: "otherActorIndex",
        label: "Direction",
        description:
          "Index of the actor whose facing decides the direction (0 = player).",
        type: "value",
        defaultValue: { type: "number", value: 0 },
        conditions: [
          {
            key: "directionType",
            eq: "actor",
          },
        ],
      },
      {
        key: "direction",
        label: "Direction",
        type: "direction",
        defaultValue: "right",
        conditions: [
          {
            key: "directionType",
            eq: "direction",
          },
        ],
      },
      {
        key: "angle",
        label: "Angle",
        type: "angle",
        defaultValue: 0,
        min: -256,
        max: 256,
        conditions: [
          {
            key: "directionType",
            eq: "angle",
          },
        ],
      },
      {
        key: "angleVariable",
        label: "Angle",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        conditions: [
          {
            key: "directionType",
            eq: "anglevar",
          },
        ],
      },
      {
        key: "targetActorIndex",
        label: "Target",
        description: "Index of the actor to aim at (0 = player).",
        type: "value",
        defaultValue: { type: "number", value: 0 },
        conditions: [
          {
            key: "directionType",
            eq: "target",
          },
        ],
      },
      {
        key: "targetX",
        label: "Target X",
        type: "value",
        width: "50%",
        defaultValue: { type: "number", value: 0 },
        unitsField: "targetUnits",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
        conditions: [{ key: "directionType", eq: "targetpos" }],
      },
      {
        key: "targetY",
        label: "Target Y",
        type: "value",
        width: "50%",
        defaultValue: { type: "number", value: 0 },
        unitsField: "targetUnits",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
        conditions: [{ key: "directionType", eq: "targetpos" }],
      },
    ],
  },
  {
    type: "group",
    conditions: [sourceTab, fromPosition],
    fields: [
      {
        label: "Launch At",
        key: "directionType",
        description:
          "Without a source actor the aim is either fixed, or towards a point in the scene - the actor-relative options need somebody to aim from.",
        type: "select",
        options: [
          ["direction", "Fixed Direction"],
          ["targetpos", "Position Target"],
          ["angle", "Angle"],
        ],
        defaultValue: "direction",
        alignBottom: true,
      },
      {
        key: "direction",
        label: "Direction",
        type: "direction",
        defaultValue: "right",
        conditions: [{ key: "directionType", eq: "direction" }],
      },
      {
        key: "angle",
        label: "Angle",
        type: "angle",
        defaultValue: 0,
        min: -256,
        max: 256,
        conditions: [{ key: "directionType", eq: "angle" }],
      },
      {
        key: "targetX",
        label: "Target X",
        type: "value",
        width: "50%",
        defaultValue: { type: "number", value: 0 },
        unitsField: "targetUnits",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
        conditions: [{ key: "directionType", eq: "targetpos" }],
      },
      {
        key: "targetY",
        label: "Target Y",
        type: "value",
        width: "50%",
        defaultValue: { type: "number", value: 0 },
        unitsField: "targetUnits",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
        conditions: [{ key: "directionType", eq: "targetpos" }],
      },
    ],
  },
  {
    key: "frame",
    label: "Start Frame",
    description:
      "How many frames into the animation this shot starts, counted from the first frame of whichever direction it faces. 0 starts at the beginning. Keep it inside the animation's length - it is added as-is, so an overshoot lands on whatever frame follows.",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: { type: "number", value: 0 },
    conditions: [sourceTab],
  },
  {
    label:
      "A slot only stores 32 bytes, so these four are set per launch rather than per slot. Pick the behaviour the slot holds to see just the ones it reads.",
    conditions: [paramsTab],
  },
  {
    key: "paramBehaviour",
    label: "Slot Behaviour",
    description:
      "Only decides which parameters are shown below. The behaviour itself comes from the slot definition.",
    type: "select",
    options: [
      ["any", "Show all parameters"],
      ["plain", "Default / Custom (no parameters)"],
      ["arc", "Arc"],
      ["boomerang", "Boomerang"],
      ["sine", "Sine Wave"],
      ["orbit", "Orbit"],
      ["hookshot", "Hookshot"],
      ["anchor", "Anchor"],
      ["chain", "Chain"],
      ["trail", "Trail"],
    ],
    defaultValue: "any",
    conditions: [paramsTab],
  },
  {
    key: "paramX",
    label: "Range",
    description: "How quickly the boomerang sheds speed before turning back. Higher values bring it back sooner, so it travels less far.",
    type: "value",
    min: 0,
    max: 127,
    defaultValue: { type: "number", value: 2 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["boomerang"] }],
  },
  {
    key: "paramX",
    label: "X Offset",
    description: "Horizontal offset from the actor it circles.",
    type: "value",
    min: -128,
    max: 127,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["orbit"] }],
  },
  {
    key: "paramX",
    label: "X Offset",
    description: "Horizontal offset from the actor it is attached to.",
    type: "value",
    min: -128,
    max: 127,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["anchor"] }],
  },
  {
    key: "paramX",
    label: "Chain Link",
    description: "0 for the hook head, 1 to 3 for the chain links trailing behind it.",
    type: "value",
    min: 0,
    max: 3,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["hookshot"] }],
  },
  {
    key: "paramTrailHead",
    label: "Trail Head",
    description:
      "What the tail follows. The projectile flies and trails behind itself, or it hangs off an actor and records where that actor has been.",
    type: "select",
    options: [
      ["projectile", "This projectile"],
      ["actor", "An actor"],
    ],
    defaultValue: "projectile",
    conditions: [paramsTab, { key: "paramBehaviour", in: ["trail", "any"] }],
  },
  {
    key: "paramTrailActor",
    label: "Head Actor",
    description:
      "Index of the actor the tail follows (0 = player). The projectile itself is not drawn - this actor is the head - and it stops moving, colliding with tiles and expiring off screen, since all of that belongs to the actor now.",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: { type: "number", value: 0 },
    conditions: [
      paramsTab,
      { key: "paramBehaviour", in: ["trail", "any"] },
      { key: "paramTrailHead", eq: "actor" },
    ],
  },
  {
    key: "paramX",
    label: "Strung From Actor",
    description: "Index of the actor one end of the chain is fixed to (0 = player).",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["chain"] }],
  },
  {
    key: "paramX",
    label: "X Offset / Range / Chain Link",
    description: "Boomerang range, Orbit and Anchor X offset, or Hookshot chain link.",
    type: "value",
    min: -128,
    max: 127,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["any"] }],
  },
  {
    key: "paramY",
    label: "Launch Height",
    description: "How high the shot is thrown before gravity brings it back down.",
    type: "value",
    min: 0,
    max: 127,
    defaultValue: { type: "number", value: 34 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["arc"] }],
  },
  {
    key: "paramY",
    label: "Y Offset",
    description: "Vertical offset from the actor it circles.",
    type: "value",
    min: -128,
    max: 127,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["orbit"] }],
  },
  {
    key: "paramY",
    label: "Y Offset",
    description: "Vertical offset from the actor it is attached to.",
    type: "value",
    min: -128,
    max: 127,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["anchor"] }],
  },
  {
    key: "paramY",
    label: "Anchored To Actor",
    description: "Index of the actor the chain is strung from (0 = player).",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["hookshot"] }],
  },
  {
    key: "paramY",
    label: "Strung To Actor",
    description: "Index of the actor the other end of the chain is fixed to (0 = player).",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["chain"] }],
  },
  {
    key: "paramY",
    label: "Y Offset / Launch Height / Chain Source",
    description: "Arc launch height, Orbit and Anchor Y offset, or the Hookshot chain source actor.",
    type: "value",
    min: -128,
    max: 127,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["any"] }],
  },
  {
    key: "paramPhase",
    label: "Starting Phase",
    description: "Where in the wave it starts, so shots fired together do not overlap.",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: { type: "number", value: 64 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["sine"] }],
  },
  {
    key: "paramPhase",
    label: "Starting Angle",
    description: "Where on the circle it starts. Space several orbiters out by giving each a different value.",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: { type: "number", value: 64 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["orbit"] }],
  },
  {
    key: "paramPhase",
    label: "Attached To Actor",
    description:
      "Index of the actor it is pinned to (0 = player). Each anchored projectile carries its own, so several can hang off different actors at once.",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["anchor"] }],
  },
  {
    key: "paramPhase",
    label: "Phase / Anchor Actor",
    description: "Sine and Orbit starting phase, or the actor an Anchor is pinned to.",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: { type: "number", value: 64 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["any"] }],
  },
  {
    key: "paramActorIndex",
    label: "Actor To Circle",
    description: "Index of the actor it orbits (0 = player).",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["orbit"] }],
  },
  {
    key: "paramActorIndex",
    label: "Actor To Circle",
    description: "Index of the actor Orbit circles (0 = player).",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: { type: "number", value: 0 },
    conditions: [paramsTab, { key: "paramBehaviour", in: ["any"] }],
  },
];

const compile = (input, helpers) => {
  const {
    launchProjectileInDirection,
    launchProjectileInAngle,
    launchProjectileInActorDirection,
    launchProjectileInAngleVariable,
    launchProjectileTowardsActor,
    actorSetActive,
    getActorIndex,
    engineFieldSetToScriptValue,
    variableSetToScriptValue,
    markLocalsUsed,
    _declareLocal,
    _localRef,
    _rpn,
    _rpnProjectilePosArgs,
    _stackPushScriptValue,
    _stackPushConst,
    _projectileLaunch,
    _stackPop,
    _addComment,
  } = helpers;

  /** Stash a coordinate in a local so the RPN can reference it twice. */
  const localSubpixels = (symbol, value, units) => {
    const ref = _declareLocal(symbol, 1, true);
    variableSetToScriptValue(ref, scriptValueToSubpixels(value, units));
    return ref;
  };

  const slot = Number(input.slot);
  requireSlot(helpers, slot);

  // projectile_launch() copies these into the projectile, so they have to be
  // in place before the launch instruction.
  const value = (v, fallback) =>
    v === undefined || v === null ? { type: "number", value: fallback } : v;
  // Anchor and Trail name their actor with a picker here and with an index in
  // the By Index twin, so take either: a picker arrives as an actor id string,
  // everything else as a script value.
  const actorValue = (v, fallback) =>
    typeof v === "string"
      ? { type: "number", value: getActorIndex(v) }
      : value(v, fallback);
  // The engine stores a trail's head actor biased by one, so that the 0 a
  // launch defaults to keeps meaning "the projectile is its own head" - which
  // is what every trail launched before the option existed relies on. A
  // constant is folded here; anything else becomes one extra add.
  const biasedByOne = (v) =>
    v.type === "number"
      ? { type: "number", value: Number(v.value) + 1 }
      : { type: "add", valueA: v, valueB: { type: "number", value: 1 } };

  engineFieldSetToScriptValue(
    "projectile_distance",
    input.paramTrailHead === "actor"
      ? biasedByOne(actorValue(input.paramTrailActor, 0))
      : value(input.paramX, 0)
  );
  engineFieldSetToScriptValue("projectile_distance2", value(input.paramY, 0));
  engineFieldSetToScriptValue(
    "projectile_phase",
    actorValue(input.paramPhase, 64)
  );
  engineFieldSetToScriptValue(
    "projectile_actor_index",
    value(input.paramActorIndex, 0)
  );
  engineFieldSetToScriptValue("projectile_frame", value(input.frame, 0));

  if (input.sourceType === "position" && input.directionType === "targetpos") {
    // Neither end is an actor, so both points go into locals and the angle
    // between them is worked out at runtime.
    _addComment("Launch Projectile From Position Towards Position");
    const srcX = localSubpixels("dynproj_src_x", input.posX, input.posUnits);
    const srcY = localSubpixels("dynproj_src_y", input.posY, input.posUnits);
    const tgtX = localSubpixels("dynproj_tgt_x", input.targetX, input.targetUnits);
    const tgtY = localSubpixels("dynproj_tgt_y", input.targetY, input.targetUnits);
    const rpn = _rpn().ref(srcX).ref(srcY);
    rpnAimAt(rpn, tgtX, tgtY, srcX, srcY).stop();
    // Referencing a local through the RPN doesn't count as a use, so without
    // this the packer would give the four of them the same address.
    markLocalsUsed(srcX, srcY, tgtX, tgtY);
    _projectileLaunch(slot, ".ARG2");
    _stackPop(3);
    return;
  }

  if (input.sourceType === "position") {
    // No actor to read a position from, so push the coordinate straight onto
    // the stack in the layout VM_PROJECTILE_LAUNCH expects: x, y, angle.
    const angle =
      input.directionType === "angle"
        ? ((Math.round(Number(input.angle || 0)) % 256) + 256) % 256
        : DIR_ANGLES[input.direction] ?? 0;

    _addComment("Launch Projectile From Position");
    // Same stack layout the stock launch helpers build: x, y, angle, with
    // VM_PROJECTILE_LAUNCH reading from .ARG2 down.
    _stackPushScriptValue(scriptValueToSubpixels(input.posX, input.posUnits));
    _stackPushScriptValue(scriptValueToSubpixels(input.posY, input.posUnits));
    _stackPushConst(angle);
    _projectileLaunch(slot, ".ARG2");
    _stackPop(3);
    return;
  }

  /** An actor index has to be staged in a local before a helper can use it. */
  const localActor = (symbol, index) => {
    const ref = _declareLocal(symbol, 1, true);
    variableSetToScriptValue(ref, value(index, 0));
    return ref;
  };

  actorSetActive(localActor("dynproj_src_actor", input.actorIndex));

  if (input.directionType === "direction") {
    launchProjectileInDirection(slot, input.x, input.y, input.direction);
  } else if (input.directionType === "angle") {
    launchProjectileInAngle(slot, input.x, input.y, input.angle);
  } else if (input.directionType === "anglevar") {
    launchProjectileInAngleVariable(
      slot,
      input.x,
      input.y,
      input.angleVariable
    );
  } else if (input.directionType === "actor") {
    launchProjectileInActorDirection(
      slot,
      input.x,
      input.y,
      localActor("dynproj_dir_actor", input.otherActorIndex)
    );
  } else if (input.directionType === "targetpos") {
    // Same shape as launchProjectileTowardsActor, with the target read from a
    // pair of locals instead of a second actor.
    const tgtX = localSubpixels("dynproj_tgt_x", input.targetX, input.targetUnits);
    const tgtY = localSubpixels("dynproj_tgt_y", input.targetY, input.targetUnits);
    const actorRef = _declareLocal("actor", 4);
    _addComment("Launch Projectile Towards Position");
    const rpn = _rpnProjectilePosArgs(actorRef, input.x, input.y);
    rpnAimAt(rpn, tgtX, tgtY, _localRef(actorRef, 1), _localRef(actorRef, 2)).stop();
    markLocalsUsed(actorRef, tgtX, tgtY);
    _projectileLaunch(slot, ".ARG2");
    _stackPop(3);
  } else if (input.directionType === "target") {
    launchProjectileTowardsActor(
      slot,
      input.x,
      input.y,
      localActor("dynproj_target_actor", input.targetActorIndex)
    );
  }
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
