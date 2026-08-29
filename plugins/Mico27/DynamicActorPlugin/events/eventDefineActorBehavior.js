export const id = "EVENT_DEFINE_ACTOR_BEHAVIOR";
export const name = "Define Actor Behavior";
export const groups = ["EVENT_GROUP_ACTOR"];

// Physics component flags (flags byte; must match dynamic_actor.h)
const BHV_GRAVITY_Y = 0x01;
const BHV_GRAVITY_Z = 0x02;
const BHV_LEDGE_STOP = 0x04;
const BHV_REFLECT_X = 0x08;
const BHV_REFLECT_Y = 0x10;
const BHV_REFLECT_Z = 0x20;
const BHV_PLATFORM = 0x40;
const BHV2_NO_TILE_COLLISION = 0x80;

// Lock / animation flags
const BHV2_ANIM_JUMP_Y = 0x20;
const BHV2_ANIM_JUMP_Z = 0x40;
const BHV2_ACTOR_COLLISION = 0x80;

const BHV3_LOCK_POS_X = 0x01;
const BHV3_LOCK_POS_Y = 0x02;
const BHV3_LOCK_POS_Z = 0x04;
const BHV3_LOCK_DIR_H = 0x08;
const BHV3_LOCK_DIR_V = 0x10;

const BHV_EVENT_STATE_CHANGE = 0x01;
const BHV_EVENT_TILE_COLLISION_TOP = 0x02;
const BHV_EVENT_TILE_COLLISION_RIGHT = 0x04;
const BHV_EVENT_TILE_COLLISION_BOTTOM = 0x08;
const BHV_EVENT_TILE_COLLISION_LEFT = 0x10;
const BHV_EVENT_TILE_ENTER = 0x20;
const BHV_EVENT_HIT_ACTORS = 0x40;
const BHV_EVENT_ACTIVATE_TRIGGERS = 0x80;

const DYNAMIC_ACTOR_COLLISION_SINGLE_POINT = 0;
const DYNAMIC_ACTOR_COLLISION_TRIANGLE = 1;
const DYNAMIC_ACTOR_COLLISION_BOUNDING_BOX = 2;

const PRESETS = {
  walker: {
    flags: BHV_GRAVITY_Y | BHV_REFLECT_X,
    flags2: BHV3_LOCK_DIR_V | BHV2_ANIM_JUMP_Y | BHV2_ANIM_JUMP_Z,
    collisionType: DYNAMIC_ACTOR_COLLISION_SINGLE_POINT,
  },
  walker_ledge: {
    flags: BHV_GRAVITY_Y | BHV_REFLECT_X | BHV_LEDGE_STOP,
    flags2: BHV3_LOCK_DIR_V | BHV2_ANIM_JUMP_Y | BHV2_ANIM_JUMP_Z,
    collisionType: DYNAMIC_ACTOR_COLLISION_SINGLE_POINT,
  },
  bouncing_ball: {
    flags: BHV_GRAVITY_Y | BHV_REFLECT_X | BHV_REFLECT_Y,
    flags2: BHV3_LOCK_DIR_V,
    collisionType: DYNAMIC_ACTOR_COLLISION_SINGLE_POINT,
  },
  faller: {
    flags: BHV_GRAVITY_Y,
    flags2: BHV3_LOCK_POS_X | BHV3_LOCK_DIR_V | BHV2_ANIM_JUMP_Y | BHV2_ANIM_JUMP_Z,
    collisionType: DYNAMIC_ACTOR_COLLISION_SINGLE_POINT,
  },
  slider: {
    flags: BHV_REFLECT_X,
    flags2: BHV3_LOCK_DIR_V | BHV2_ANIM_JUMP_Y | BHV2_ANIM_JUMP_Z,
    collisionType: DYNAMIC_ACTOR_COLLISION_SINGLE_POINT,
  },
  reflector: {
    flags: BHV_REFLECT_X | BHV_REFLECT_Y,
    flags2: BHV3_LOCK_DIR_V,
    collisionType: DYNAMIC_ACTOR_COLLISION_SINGLE_POINT,
  },
  platform: {
    flags: BHV_PLATFORM,
    flags2: BHV3_LOCK_DIR_H | BHV3_LOCK_DIR_V,
    collisionType: DYNAMIC_ACTOR_COLLISION_SINGLE_POINT,
  },
  wanderer: {
    flags: BHV_REFLECT_X | BHV_REFLECT_Y,
    flags2: BHV2_ANIM_JUMP_Y | BHV2_ANIM_JUMP_Z,
    collisionType: DYNAMIC_ACTOR_COLLISION_SINGLE_POINT,
  },
  projectile: {
    flags: BHV2_NO_TILE_COLLISION,
    flags2: BHV3_LOCK_DIR_H | BHV3_LOCK_DIR_V,
    collisionType: DYNAMIC_ACTOR_COLLISION_SINGLE_POINT,
  },
};

export const autoLabel = (fetchArg, input) => {
  const presetLabels = {
    walker: "Walker",
    walker_ledge: "Walker (avoid ledges)",
    bouncing_ball: "Bouncing ball",
    faller: "Falling object",
    slider: "Slider (no gravity)",
    reflector: "Reflector (no gravity)",
    platform: "Moving platform",
    wanderer: "Wanderer (top down)",
    projectile: "Projectile",
    custom: "Custom",
  };
  return `Define Behavior : ${presetLabels[input.preset] || "Custom"}`;
};

export const fields = [
  {
    key: "behaviorId",
    label: "Behavior slot",
    description:
      "Slot number to store this behavior in (1 to Max behavior slots). Assign it to actors with 'Set Actor Behavior'.",
    type: "value",
    min: 1,
    max: 32,
    defaultValue: {
      type: "number",
      value: 1,
    },
  },
  {
    key: "preset",
    label: "Preset",
    description: "Start from a ready-made behavior or build a custom one from components",
    type: "select",
    options: [
      ["walker", "Platformer: Walker (gravity, turns at walls)"],
      ["walker_ledge", "Platformer: Walker (turns at walls and ledges)"],
      ["bouncing_ball", "Platformer: Bouncing ball (gravity, bounces)"],
      ["faller", "Platformer: Falling object (gravity, vertical only)"],
      ["platform", "Any: Moving platform (carries actors that touch it)"],
      ["wanderer", "Top down: Wanderer (bounces around, set Bounciness 255)"],
      ["slider", "Any: Slider (no gravity, turns at walls)"],
      ["reflector", "Any: Reflector (bounces, set Bounciness 255)"],
      ["projectile", "Shmup/Any: Projectile (through walls, no collision)"],
      ["custom", "Custom (choose components)"],
    ],
    defaultValue: "walker",
  },
  {
    key: "compGravityY",
    label: "Gravity Y",
    description: "Apply gravity to Y velocity each frame",
    type: "checkbox",
    defaultValue: true,
    conditions: [{ key: "preset", eq: "custom" }],
  },
  {
    key: "compGravityZ",
    label: "Gravity Z",
    description: "Apply gravity to Z velocity each frame",
    type: "checkbox",
    defaultValue: false,
    conditions: [{ key: "preset", eq: "custom" }],
  },
  {
    key: "compTileCollision",
    label: "Tile collision",
    description:
      "Stops on solid tiles while moving. Untick it to pass through walls and floors, for ghosts and flying pickups. Turning, bouncing, ledge stops and landing are skipped too.",
    type: "checkbox",
    defaultValue: true,
    conditions: [{ key: "preset", eq: "custom" }],
  },
  {
    key: "compActorCollision",
    label: "Collide with other actors",
    description:
      "Block and turn/bounce when running into another collidable actor (uses 'Turn at walls' / 'Bounce' settings). The player is already handled by the engine. Costs one overlap check per on-screen actor each frame.",
    type: "checkbox",
    defaultValue: false,
    conditions: [{ key: "preset", eq: "custom" }],
  },
  {
    key: "compPlatform",
    label: "Moving platform",
    description:
      "Claim every actor this actor touches as a child, so they inherit its movement (ride along), and release them when they stop touching. Skips actors that already have a different parent, and - if this actor has a collision group set - actors in a different group. Combine with Move horizontally/vertically so the platform itself moves.",
    type: "checkbox",
    defaultValue: false,
    conditions: [{ key: "preset", eq: "custom" }],
  },
  {
    key: "compLedgeStop",
    label: "Turn at ledges",
    description: "While grounded, treat ledges/pits like walls (smart ledge detection)",
    type: "checkbox",
    defaultValue: false,
    conditions: [{ key: "preset", eq: "custom" }],
  },
  {
    key: "compReflectX",
    label: "Turn at walls",
    description: "Reverse horizontal velocity when hitting a wall (otherwise stop)",
    type: "checkbox",
    defaultValue: true,
    conditions: [{ key: "preset", eq: "custom" }],
  },
  {
    key: "compReflectY",
    label: "Bounce on floor/ceiling",
    description: "Bounce vertical velocity when hitting floor or ceiling (otherwise stop)",
    type: "checkbox",
    defaultValue: false,
    conditions: [{ key: "preset", eq: "custom" }],
  },
  {
    key: "compReflectZ",
    label: "Bounce on z ground",
    description: "Bounce z velocity when z position reaches ground level (otherwise stop)",
    type: "checkbox",
    defaultValue: false,
    conditions: [{ key: "preset", eq: "custom" }],
  },
  {
    key: "animJumpY",
    label: "Jump animation in air on y axis",
    description: "Play jump animation while airborne on y axis (for platformer characters)",
    type: "checkbox",
    defaultValue: true,
    conditions: [{ key: "preset", eq: "custom" }],
  },
  {
    key: "animJumpZ",
    label: "Jump animation in air on z axis",
    description: "Play jump animation while airborne on z axis (for topdown characters)",
    type: "checkbox",
    defaultValue: true,
    conditions: [{ key: "preset", eq: "custom" }],
  },
  {
    key: "lockPositionAxes",
    label: "Lock position axes",
    description: "Freeze behavior-driven movement on selected position axes",
    type: "select",
    options: [
      ["0", "None"],
      [String(BHV3_LOCK_POS_X), "X"],
      [String(BHV3_LOCK_POS_Y), "Y"],
      [String(BHV3_LOCK_POS_Z), "Z"],
      [String(BHV3_LOCK_POS_X | BHV3_LOCK_POS_Y), "X + Y"],
      [String(BHV3_LOCK_POS_X | BHV3_LOCK_POS_Z), "X + Z"],
      [String(BHV3_LOCK_POS_Y | BHV3_LOCK_POS_Z), "Y + Z"],
      [String(BHV3_LOCK_POS_X | BHV3_LOCK_POS_Y | BHV3_LOCK_POS_Z), "X + Y + Z"],
    ],
    defaultValue: "0",
  },
  {
    key: "lockDirectionAxes",
    label: "Lock direction axes",
    description: "Prevent behavior animation from changing horizontal and/or vertical facing",
    type: "select",
    options: [
      ["0", "None"],
      [String(BHV3_LOCK_DIR_H), "Horizontal"],
      [String(BHV3_LOCK_DIR_V), "Vertical"],
      [String(BHV3_LOCK_DIR_H | BHV3_LOCK_DIR_V), "Horizontal + Vertical"],
    ],
    defaultValue: "0",
  },
  {
    key: "collisionType",
    label: "Tile collision type",
    description: "Collision model for this behavior slot",
    type: "select",
    options: [
      [String(DYNAMIC_ACTOR_COLLISION_SINGLE_POINT), "Origin point (fastest)"],
      [String(DYNAMIC_ACTOR_COLLISION_TRIANGLE), "Triangle"],
      [String(DYNAMIC_ACTOR_COLLISION_BOUNDING_BOX), "Bounding box"],
    ],
    defaultValue: String(DYNAMIC_ACTOR_COLLISION_SINGLE_POINT),
  },
  {
    key: "triggerStateChange",
    label: "Trigger state change event",
    description: "Allow this behavior to fire the state change event",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "triggerTileCollisionTop",
    label: "Trigger tile collision (top) event",
    description: "Allow this behavior to fire the tile collision (top) event",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "triggerTileCollisionRight",
    label: "Trigger tile collision (right) event",
    description: "Allow this behavior to fire the tile collision (right) event",
    type: "checkbox",
    defaultValue: false,
  },
    {
    key: "triggerTileCollisionBottom",
    label: "Trigger tile collision (bottom) event",
    description: "Allow this behavior to fire the tile collision (bottom) event",
    type: "checkbox",
    defaultValue: false,
  },
    {
    key: "triggerTileCollisionLeft",
    label: "Trigger tile collision (left) event",
    description: "Allow this behavior to fire the tile collision (left) event",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "triggerTileEnter",
    label: "Trigger tile enter event",
    description: "Allow this behavior to fire the tile enter event",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "triggerHitActors",
    label: "Trigger other actors' On Hit on collision",
    description:
      "When an actor with this behavior collides with another collidable actor, run that actor's On Hit script, passing this actor's collision group (so the On Hit script can branch on who hit it, exactly like the player's hit script). This actor must have a collision group set to deal hits. The engine normally only does this for the player. Requires the 'Trigger other actors' On Hit' engine component.",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "activateTriggers",
    label: "Activate triggers on enter/leave",
    description:
      "Let an actor with this behavior fire a trigger's On Enter / On Leave scripts as it moves in and out of the trigger (the engine normally only does this for the player). Requires the 'Actors activate triggers' engine component.",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "gravity",
    label: "Gravity",
    description: "Acceleration in subpixels per frame (position units: 16 subpixels = 1 pixel)",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: {
      type: "number",
      value: 8,
    },
  },
  {
    key: "maxFallVelocity",
    label: "Max fall speed",
    description: "Maximum downward velocity in subpixels per frame (16 = 1 pixel/frame)",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: {
      type: "number",
      value: 64,
    },
  },
  {
    key: "overrideTileCollision",
    label: "Tile Collision Override",
    description:
      "Advanced. Needs the 'Enable tile collision override' engine setting, and is refused without it. Changes what this behaviour treats as solid. 0 is normal collision, testing the side it is moving into. Values: 1 top, 2 bottom, 4 left, 8 right, then 16 ladder, 32 to 112 the six slopes, and 128, which nothing reads. A value of 16 or above makes tiles carrying it solid from every direction. A value of 1 to 8 makes the behaviour react only to that side, from wherever it touches. An empty tile is never solid.",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "bounce",
    label: "Bounciness",
    description:
      "Energy kept on each bounce, 0-255 (128 = half, 255 = perfect bounce). Only used with 'Bounce on floor/ceiling'.",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: {
      type: "number",
      value: 128,
    },
  },
];

export const compile = (input, helpers) => {
  const {
    _callNative,
    _stackPushConst,
    _stackPop,
    _addComment,
    _stackPushScriptValue,
  } = helpers;

  let flags = 0;
  let flags2 = 0;
  let collisionType = DYNAMIC_ACTOR_COLLISION_SINGLE_POINT;
  let eventFlags = 0;

  if (input.preset && input.preset !== "custom" && PRESETS[input.preset]) {
    flags = PRESETS[input.preset].flags;
    flags2 = PRESETS[input.preset].flags2;
    collisionType = PRESETS[input.preset].collisionType;
  } else {
    if (input.compGravityY || input.compGravity) flags |= BHV_GRAVITY_Y;
    if (input.compGravityZ) flags |= BHV_GRAVITY_Z;
    if (input.compLedgeStop) flags |= BHV_LEDGE_STOP;
    if (input.compReflectX) flags |= BHV_REFLECT_X;
    if (input.compReflectY) flags |= BHV_REFLECT_Y;
    if (input.compReflectZ) flags |= BHV_REFLECT_Z;
    if (input.compPlatform) flags |= BHV_PLATFORM;
    if (input.compTileCollision === false) flags |= BHV2_NO_TILE_COLLISION;
    if (input.compActorCollision) flags2 |= BHV2_ACTOR_COLLISION;
    if (input.animJumpY) flags2 |= BHV2_ANIM_JUMP_Y;
    if (input.animJumpZ) flags2 |= BHV2_ANIM_JUMP_Z;
  }

  if (input.collisionType !== undefined) {
    collisionType = Number(input.collisionType);
  }

  if (input.lockPositionAxes !== undefined) {
    flags2 |= Number(input.lockPositionAxes);
  }
  if (input.lockDirectionAxes !== undefined) {
    flags2 |= Number(input.lockDirectionAxes);
  }

  if (input.triggerStateChange) {
    eventFlags |= BHV_EVENT_STATE_CHANGE;
  }
  if (input.triggerTileCollisionTop) {
    eventFlags |= BHV_EVENT_TILE_COLLISION_TOP;
  }
  if (input.triggerTileCollisionRight) {
    eventFlags |= BHV_EVENT_TILE_COLLISION_RIGHT;
  }
  if (input.triggerTileCollisionBottom) {
    eventFlags |= BHV_EVENT_TILE_COLLISION_BOTTOM;
  }
  if (input.triggerTileCollisionLeft) {
    eventFlags |= BHV_EVENT_TILE_COLLISION_LEFT;
  }
  if (input.triggerTileEnter) {
    eventFlags |= BHV_EVENT_TILE_ENTER;
  }
  if (input.triggerHitActors) {
    eventFlags |= BHV_EVENT_HIT_ACTORS;
  }
  if (input.activateTriggers) {
    eventFlags |= BHV_EVENT_ACTIVATE_TRIGGERS;
  }

  // The engine ignores the override unless its setting is on, so a value that
  // would silently do nothing is reported here instead of at runtime. A
  // variable or expression can't be checked at compile time - the setting
  // alone decides.
  const overrideTileCollision = input.overrideTileCollision || { type: "number", value: 0 };
  const overrideIsSet =
    overrideTileCollision.type !== "number" || Number(overrideTileCollision.value) !== 0;
  if (overrideIsSet) {
    const key = "DYNAMIC_ACTOR_ENABLE_OVERRIDE_TILE_COLLISION";
    const fv =
      helpers.engineFieldValues && helpers.engineFieldValues.find((s) => s.id === key);
    const field = helpers.engineFields && helpers.engineFields[key];
    const enabled =
      fv && fv.value !== undefined && fv.value !== null
        ? !!fv.value
        : field
        ? !!field.defaultValue
        : true;
    if (!enabled) {
      throw new Error(
        `"Tile Collision Override" requires the "Enable tile collision override" engine setting to be enabled (Settings → Engine → Dynamic actor), or set it back to 0.`,
      );
    }
  }

  _addComment(`Define Actor Behavior: slot ${input.behaviorId}`);

  // Pushed first so the existing arguments keep their FN_ARGn slots. Pushed
  // whether or not the feature is compiled in, so the argument count always
  // matches what vm_define_actor_behavior indexes and the VM_POP below.
  _stackPushScriptValue(overrideTileCollision);
  _stackPushConst(eventFlags);
  _stackPushConst(collisionType);
  _stackPushScriptValue(input.bounce || { type: "number", value: 128 });
  _stackPushScriptValue(input.maxFallVelocity || { type: "number", value: 64 });
  _stackPushScriptValue(input.gravity || { type: "number", value: 8 });
  _stackPushConst(flags2);
  _stackPushConst(flags);
  _stackPushScriptValue(input.behaviorId);

  _callNative("vm_define_actor_behavior");
  _stackPop(9);
};
