const id = "DYNPROJ_EVENT_LOAD_PROJECTILE_SLOT";
const name = "Load Dynamic Projectile Into Slot";
const groups = ["Projectiles"];

// Behaviour ids (must match projectile_state in projectiles.c).
const TYPE = {
  default: "0",
  arc: "1",
  boomerang: "2",
  sine: "3",
  orbit: "4",
  hookshot: "5",
  anchor: "6",
  custom: "7",
  chain: "8",
  trail: "9",
};

// Chain link placement. A chain never reacts to tiles, so it reuses the two
// `collision` bits of the definition to say how its links are laid out.
const CHAIN_STRAIGHT = "0";
const CHAIN_LOOSE = "1";

// Component flags (must match projectiles.c). The field is 5 bits and all five
// are in use, so a new flag means finding a bit elsewhere in the definition.
const EXECUTE_SCRIPT = 1 << 0;
const TILE_ENTER_SCRIPT = 1 << 1;
const IGNORE_PLAYER = 1 << 2;
const TILE_HIT_SCRIPT = 1 << 3;
const ACTOR_HIT_SCRIPT = 1 << 4;

// Tile collision behaviour (projectile_def_t.collision, 2 bits).
const COLLISION_NONE = "0";
const COLLISION_REMOVE = "1";
const COLLISION_BOUNCE = "2";
const COLLISION_BOUNCE_FLOOR = "3";

const PRESETS = {
  bullet: { type: TYPE.default, collision: COLLISION_REMOVE, gravity: 0, bounce: 0, amplitude: 0, frequency: 0 },
  lob: { type: TYPE.arc, collision: COLLISION_REMOVE, gravity: 6, bounce: 0, amplitude: 0, frequency: 0 },
  grenade: { type: TYPE.default, collision: COLLISION_BOUNCE, gravity: 4, bounce: 60, amplitude: 0, frequency: 0 },
  boomerang: { type: TYPE.boomerang, collision: COLLISION_NONE, gravity: 0, bounce: 0, amplitude: 0, frequency: 0 },
  wave: { type: TYPE.sine, collision: COLLISION_REMOVE, gravity: 0, bounce: 0, amplitude: 30, frequency: 10 },
  orbiter: { type: TYPE.orbit, collision: COLLISION_NONE, gravity: 0, bounce: 0, amplitude: 100, frequency: 16 },
  grapple: { type: TYPE.hookshot, collision: COLLISION_REMOVE, gravity: 0, bounce: 0, amplitude: 0, frequency: 0 },
  held: { type: TYPE.anchor, collision: COLLISION_NONE, gravity: 0, bounce: 0, amplitude: 0, frequency: 0 },
  scripted: { type: TYPE.custom, collision: COLLISION_REMOVE, gravity: 0, bounce: 0, amplitude: 0, frequency: 0 },
  // A taut chain: six links spread evenly between the two actors.
  tether: { type: TYPE.chain, collision: CHAIN_STRAIGHT, gravity: 0, bounce: 0, amplitude: 0, frequency: 6 },
  // A chain that hangs and drags: 7 pixels of slack against a 2 pixel catch-up.
  leash: { type: TYPE.chain, collision: CHAIN_LOOSE, gravity: 0, bounce: 2, amplitude: 7, frequency: 6 },
  // Four tail sprites four samples apart, hopping under light gravity.
  firetrail: { type: TYPE.trail, collision: COLLISION_BOUNCE_FLOOR, gravity: 3, bounce: 24, amplitude: 4, frequency: 4 },
};

const num = (value) => ({ type: "number", value });

const projectileTab = { key: "tabs", in: ["projectile", undefined] };
const behaviorTab = { key: "tabs", in: ["behavior"] };
const customBehaviour = { key: "preset", eq: "custom" };
// A preset fixes its parameters, so the tuning fields only appear for Custom -
// and then only the ones the chosen behaviour actually reads.
const forTypes = (...types) => [behaviorTab, customBehaviour, { key: "type", in: types }];
// The hookshot and script-driven extras are read whether they came from a
// preset or from Custom, so they need one entry for each route.
const forPresetOrType = (preset, type) => [
  [behaviorTab, { key: "preset", eq: preset }],
  [behaviorTab, customBehaviour, { key: "type", eq: type }],
];

const featureEnabled = (helpers, key) => {
  const value =
    helpers.engineFieldValues &&
    helpers.engineFieldValues.find((s) => s.id === key);
  if (value && value.value !== undefined && value.value !== null) {
    return !!value.value;
  }
  const field = helpers.engineFields && helpers.engineFields[key];
  return field ? !!field.defaultValue : true;
};

const typeDefines = {
  [TYPE.arc]: ["DYNPROJ_ENABLE_ARC", "Arc"],
  [TYPE.boomerang]: ["DYNPROJ_ENABLE_BOOMERANG", "Boomerang"],
  [TYPE.sine]: ["DYNPROJ_ENABLE_SINE", "Sine Wave"],
  [TYPE.orbit]: ["DYNPROJ_ENABLE_ORBIT", "Orbit"],
  [TYPE.hookshot]: ["DYNPROJ_ENABLE_HOOKSHOT", "Hookshot"],
  [TYPE.anchor]: ["DYNPROJ_ENABLE_ANCHOR", "Anchor"],
  [TYPE.custom]: ["DYNPROJ_ENABLE_CUSTOM", "Custom"],
  [TYPE.chain]: ["DYNPROJ_ENABLE_CHAIN", "Chain"],
  [TYPE.trail]: ["DYNPROJ_ENABLE_TRAIL", "Trail"],
};

/** Reads a numeric engine setting, falling back to its declared default. */
const engineNumber = (helpers, key, fallback) => {
  const value =
    helpers.engineFieldValues &&
    helpers.engineFieldValues.find((s) => s.id === key);
  if (value && value.value !== undefined && value.value !== null) {
    return Number(value.value);
  }
  const field = helpers.engineFields && helpers.engineFields[key];
  return field ? Number(field.defaultValue) : fallback;
};

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

const autoLabel = (fetchArg, input) => {
  const labels = {
    bullet: "Bullet",
    lob: "Lobbed shot",
    grenade: "Grenade",
    boomerang: "Boomerang",
    wave: "Wave",
    orbiter: "Orbiter",
    grapple: "Grapple",
    held: "Held weapon",
    scripted: "Script driven",
    tether: "Tether",
    leash: "Leash",
    firetrail: "Fire trail",
    custom: "Custom",
  };
  return `Load Dynamic Projectile Into Slot ${fetchArg("slot")} : ${
    labels[input.preset] || "Custom"
  }`;
};

const fields = [
  {
    key: "tabs",
    type: "tabs",
    defaultValue: "projectile",
    values: {
      projectile: "Projectile",
      behavior: "Dynamic projectile",
    },
  },
  {
    key: "slot",
    label: "Projectile Slot",
    description:
      "Slot this definition goes into (0 to Max projectile slots - 1). Fire it with Launch Dynamic Projectile From Slot.",
    type: "number",
    min: 0,
    max: 19,
    defaultValue: 0,
  },

  // --- Projectile tab: what it looks like and how the engine treats it ------
  {
    type: "group",
    conditions: [projectileTab],
    fields: [
      {
        key: "spriteSheetId",
        type: "sprite",
        label: "Sprite Sheet",
        defaultValue: "LAST_SPRITE",
      },
      {
        key: "spriteStateId",
        type: "animationstate",
        label: "Animation State",
        defaultValue: "",
      },
    ],
  },
  {
    type: "group",
    conditions: [projectileTab],
    fields: [
      {
        key: "speed",
        label: "Speed",
        type: "moveSpeed",
        allowNone: true,
        defaultValue: 2,
        width: "50%",
      },
      {
        key: "animSpeed",
        label: "Animation Speed",
        type: "animSpeed",
        defaultValue: 15,
        width: "50%",
      },
    ],
  },
  {
    type: "group",
    alignBottom: true,
    conditions: [projectileTab],
    fields: [
      {
        key: "lifeTime",
        label: "Life Time",
        description:
          "Seconds before the projectile expires on its own. 0 means it never does - it then only goes away by hitting something, leaving the screen, or a script removing it.",
        type: "number",
        min: 0,
        max: 4,
        step: 0.1,
        width: "50%",
        defaultValue: 1,
      },
      {
        key: "initialOffset",
        label: "Initial Offset",
        description: "Distance in front of the source to spawn at, in pixels.",
        type: "number",
        min: 0,
        max: 256,
        width: "50%",
        defaultValue: 0,
      },
    ],
  },
  {
    type: "group",
    alignBottom: true,
    conditions: [projectileTab],
    fields: [
      {
        key: "loopAnim",
        label: "Loop Animation",
        type: "checkbox",
        defaultValue: true,
      },
      {
        key: "destroyOnHit",
        label: "Destroy On Hit",
        type: "checkbox",
        defaultValue: true,
      },
    ],
  },
  {
    type: "group",
    conditions: [projectileTab],
    fields: [
      {
        key: "collisionGroup",
        label: "Collision Group",
        type: "collisionMask",
        width: "50%",
        includePlayer: false,
        defaultValue: "3",
      },
      {
        key: "collisionMask",
        label: "Collide With",
        type: "collisionMask",
        width: "50%",
        includePlayer: true,
        defaultValue: ["1"],
      },
    ],
  },

  // --- Behaviour tab: the Dynamic Projectile behaviour for this slot --------
  {
    key: "preset",
    label: "Preset",
    description:
      "Start from a ready-made behaviour, or build one from components.",
    type: "select",
    options: [
      ["bullet", "Bullet (straight, dies on walls)"],
      ["lob", "Lobbed shot (arcs under gravity)"],
      ["grenade", "Grenade (gravity, bounces off walls)"],
      ["boomerang", "Boomerang (slows, reverses, returns)"],
      ["wave", "Wave (weaves as it travels)"],
      ["orbiter", "Orbiter (circles an actor)"],
      ["grapple", "Grapple (hookshot head or chain link)"],
      ["held", "Held weapon (anchored to an actor)"],
      ["scripted", "Script driven (delta from variables)"],
      ["tether", "Tether (taut chain between two actors)"],
      ["leash", "Leash (chain that hangs and drags)"],
      ["firetrail", "Fire trail (hops, leaving a tail behind)"],
      ["custom", "Custom (choose components)"],
    ],
    defaultValue: "bullet",
    conditions: [behaviorTab],
  },
  {
    key: "type",
    label: "Behaviour",
    description: "How projectiles from this slot move.",
    type: "select",
    options: [
      [TYPE.default, "Default (straight line)"],
      [TYPE.arc, "Arc"],
      [TYPE.boomerang, "Boomerang"],
      [TYPE.sine, "Sine Wave"],
      [TYPE.orbit, "Orbit"],
      [TYPE.hookshot, "Hookshot"],
      [TYPE.anchor, "Anchor"],
      [TYPE.custom, "Custom"],
      [TYPE.chain, "Chain"],
      [TYPE.trail, "Trail"],
    ],
    defaultValue: TYPE.default,
    conditions: [behaviorTab, customBehaviour],
  },
  {
    key: "collision",
    label: "Tile Collision Behaviour",
    description: "What happens when one of these meets a solid tile.",
    type: "select",
    options: [
      [COLLISION_NONE, "Pass through"],
      [COLLISION_REMOVE, "Remove projectile"],
      [COLLISION_BOUNCE, "Bounce"],
      [COLLISION_BOUNCE_FLOOR, "Bounce (only floor)"],
    ],
    defaultValue: COLLISION_REMOVE,
    conditions: forTypes(
      TYPE.default, TYPE.arc, TYPE.boomerang, TYPE.sine,
      TYPE.orbit, TYPE.anchor, TYPE.custom, TYPE.trail
    ),
  },
  {
    key: "collision",
    label: "Tile Collision Behaviour",
    description:
      "React to tiles so the hook can land on walls. With Pass through it flies until it leaves the screen.",
    type: "select",
    options: [
      [COLLISION_NONE, "Pass through"],
      [COLLISION_REMOVE, "React to tiles"],
    ],
    defaultValue: COLLISION_REMOVE,
    conditions: forTypes(TYPE.hookshot),
  },
  {
    key: "gravity",
    label: "Gravity",
    description:
      "Downward pull applied every other frame. Only the behaviours that travel by velocity use it. Values outside -8 to 7 are clamped: gravity is a 4 bit field in the 32 byte definition.",
    type: "value",
    min: -8,
    max: 7,
    defaultValue: { type: "number", value: 0 },
    conditions: forTypes(
      TYPE.default, TYPE.arc, TYPE.boomerang, TYPE.sine, TYPE.hookshot,
      TYPE.trail
    ),
  },
  {
    key: "bounce",
    label: "Bounce",
    description: "How hard it rebounds off a surface.",
    type: "value",
    min: 0,
    max: 128,
    defaultValue: { type: "number", value: 0 },
    conditions: [behaviorTab, customBehaviour, { key: "collision", gte: COLLISION_BOUNCE }],
  },
  {
    key: "amplitude",
    label: "Wave Amplitude",
    description: "How far it weaves to each side of its path.",
    type: "value",
    min: -128,
    max: 127,
    defaultValue: { type: "number", value: 30 },
    conditions: forTypes(TYPE.sine),
  },
  {
    key: "frequency",
    label: "Wave Frequency",
    description: "How quickly it weaves. Higher is a tighter zigzag.",
    type: "value",
    min: 0,
    max: 127,
    defaultValue: { type: "number", value: 10 },
    conditions: forTypes(TYPE.sine),
  },
  {
    key: "amplitude",
    label: "Orbit Radius",
    description: "How far out it circles from the actor it orbits.",
    type: "value",
    min: -128,
    max: 127,
    defaultValue: { type: "number", value: 100 },
    conditions: forTypes(TYPE.orbit),
  },
  {
    key: "frequency",
    label: "Orbit Speed",
    description: "How quickly it goes round.",
    type: "value",
    min: 0,
    max: 127,
    defaultValue: { type: "number", value: 16 },
    conditions: forTypes(TYPE.orbit),
  },
  {
    key: "collision",
    label: "Chain Type",
    description:
      "Straight spreads the links evenly along the line between the two actors. Loose lets each link lag behind its neighbour and catch up, so the chain hangs and drags instead of staying taut.",
    type: "select",
    options: [
      [CHAIN_STRAIGHT, "Straight (evenly spread)"],
      [CHAIN_LOOSE, "Loose (hangs and drags)"],
    ],
    defaultValue: CHAIN_LOOSE,
    conditions: forTypes(TYPE.chain),
  },
  {
    key: "frequency",
    label: "Links",
    description:
      "How many sprites make up the chain, counting the one on each actor. Must fit in the Points per chain / trail engine setting.",
    type: "value",
    min: 2,
    max: 32,
    defaultValue: { type: "number", value: 6 },
    conditions: forTypes(TYPE.chain),
  },
  {
    key: "amplitude",
    label: "Slack",
    description:
      "How far apart two links may drift, in pixels, before the trailing one starts catching up. Larger values make a looser, droopier chain.",
    type: "value",
    min: 0,
    max: 64,
    defaultValue: { type: "number", value: 7 },
    conditions: [...forTypes(TYPE.chain), { key: "collision", eq: CHAIN_LOOSE }],
  },
  {
    key: "bounce",
    label: "Catch-Up Speed",
    description:
      "How fast a link closes the gap once it is past the slack, in pixels per update. 0 makes the chain rigid, closing it in one step.",
    type: "value",
    min: 0,
    max: 32,
    defaultValue: { type: "number", value: 2 },
    conditions: [...forTypes(TYPE.chain), { key: "collision", eq: CHAIN_LOOSE }],
  },
  {
    key: "frequency",
    label: "Trail Segments",
    description:
      "How many sprites follow along behind. Segments times spacing must fit in the Points per chain / trail engine setting.",
    type: "value",
    min: 1,
    max: 32,
    defaultValue: { type: "number", value: 4 },
    conditions: forTypes(TYPE.trail),
  },
  {
    key: "amplitude",
    label: "Trail Spacing",
    description:
      "Updates between one segment and the next, 2 or more. Higher values stretch the tail out further behind, at the cost of more of the points budget.",
    type: "value",
    min: 2,
    max: 16,
    defaultValue: { type: "number", value: 4 },
    conditions: forTypes(TYPE.trail),
  },
  {
    key: "hookshotTileHit",
    label: "Hookshot: On Tile Hit",
    description: "What the hook head does when it reaches a solid tile.",
    type: "select",
    options: [
      [0, "Return"],
      [1, "Pull Player"],
      [2, "Remove Hook"],
      [3, "Stay Where It Hit"],
    ],
    defaultValue: 0,
    conditions: [behaviorTab, { key: "preset", eq: "grapple" }],
  },
  {
    key: "hookshotTileHit",
    label: "Hookshot: On Tile Hit",
    description: "What the hook head does when it reaches a solid tile.",
    type: "select",
    options: [
      [0, "Return"],
      [1, "Pull Player"],
      [2, "Remove Hook"],
      [3, "Stay Where It Hit"],
    ],
    defaultValue: 0,
    conditions: forTypes(TYPE.hookshot),
  },
  {
    key: "hookshotActorHit",
    label: "Hookshot: On Actor Hit",
    description: "What the hook head does when it touches an actor.",
    type: "select",
    options: [
      [0, "Remove Hook"],
      [1, "Return"],
      [2, "Pull Player"],
      [3, "Pull Actor"],
      [4, "Stay Where It Hit"],
      [5, "Stick To Actor"],
    ],
    defaultValue: 0,
    conditions: [behaviorTab, { key: "preset", eq: "grapple" }],
  },
  {
    key: "hookshotActorHit",
    label: "Hookshot: On Actor Hit",
    description: "What the hook head does when it touches an actor.",
    type: "select",
    options: [
      [0, "Remove Hook"],
      [1, "Return"],
      [2, "Pull Player"],
      [3, "Pull Actor"],
      [4, "Stay Where It Hit"],
      [5, "Stick To Actor"],
    ],
    defaultValue: 0,
    conditions: forTypes(TYPE.hookshot),
  },
  {
    key: "customX",
    label: "Delta X Variable",
    description: "Variable read every frame as the horizontal step.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    conditions: [behaviorTab, { key: "preset", eq: "scripted" }],
  },
  {
    key: "customX",
    label: "Delta X Variable",
    description: "Variable read every frame as the horizontal step.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    conditions: forTypes(TYPE.custom),
  },
  {
    key: "customY",
    label: "Delta Y Variable",
    description: "Variable read every frame as the vertical step.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    conditions: [behaviorTab, { key: "preset", eq: "scripted" }],
  },
  {
    key: "customY",
    label: "Delta Y Variable",
    description: "Variable read every frame as the vertical step.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    conditions: forTypes(TYPE.custom),
  },
  {
    key: "compTileEnterScript",
    label: "Run Tile Enter script",
    description:
      'Trigger the script set by "Set Projectile Tile Enter Script" when one of these crosses into a new tile.',
    type: "checkbox",
    defaultValue: false,
    conditions: [behaviorTab],
  },
  {
    key: "compIgnorePlayer",
    label: "Ignore player collision",
    description: "Pass through the player instead of colliding with them.",
    type: "checkbox",
    defaultValue: false,
    conditions: [behaviorTab],
  },
  {
    key: "compRemoveScript",
    label: "Run On Remove script",
    description:
      'Trigger the script set by "Set Projectile Removal Script" when one of these is removed.',
    type: "checkbox",
    defaultValue: true,
    conditions: [behaviorTab],
  },
  {
    key: "compTileHitScript",
    label: "Run Tile Hit script",
    description:
      'Trigger the script set by "Set Projectile Tile Hit Script" when one of these reacts to a tile.',
    type: "checkbox",
    defaultValue: true,
    conditions: [behaviorTab],
  },
  {
    key: "compActorHitScript",
    label: "Run Actor Hit script",
    description:
      'Trigger the script set by "Set Projectile Actor Hit Script" when one of these touches an actor.',
    type: "checkbox",
    defaultValue: true,
    conditions: [behaviorTab],
  },
];

const compile = (input, helpers) => {
  const {
    loadProjectile,
    engineFieldSetToScriptValue,
    getVariableAlias,
    _setConstMemInt16,
    _stackPushConst,
    _stackPushScriptValue,
    _callNative,
    _stackPop,
    _addComment,
  } = helpers;

  const slot = Number(input.slot);
  const maxSlots = maxProjectileSlots(helpers);
  if (!Number.isInteger(slot) || slot < 0 || slot >= maxSlots) {
    throw new Error(
      `Projectile slot ${slot} is out of range. "Max projectile slots" is ${maxSlots}, so slots 0 to ${
        maxSlots - 1
      } are available (Settings -> Engine -> Dynamic Projectiles).`
    );
  }

  const preset =
    input.preset && input.preset !== "custom" ? PRESETS[input.preset] : null;
  // The behaviour and collision selects hold their values as strings, because
  // an option whose value is a falsy 0 cannot be selected in the editor. A
  // project saved before that change still holds numbers, and so does anything
  // generated, so both are normalised here - otherwise a stored 5 would fail to
  // match TYPE.hookshot and the behaviour would compile without its extras.
  const type = String(preset ? preset.type : (input.type ?? TYPE.default));
  const collision = String(
    preset ? preset.collision : (input.collision ?? COLLISION_REMOVE)
  );

  const required = typeDefines[type];
  if (required && !featureEnabled(helpers, required[0])) {
    throw new Error(
      `The "${required[1]}" projectile behaviour is disabled. Enable it under Settings -> Engine -> Dynamic Projectiles, or pick another behaviour.`
    );
  }

  // The three shared triggers each have a compile time switch. A slot that
  // ticks one while it is off gets the bit cleared rather than an error: the
  // checkbox cannot be hidden (field conditions cannot read engine settings),
  // and the flag would be dead weight the engine no longer looks at anyway.
  // Turning the switch back on restores the tick without touching the slot.
  let flags = 0;
  if (
    input.compTileEnterScript &&
    featureEnabled(helpers, "DYNPROJ_ENABLE_TILE_ENTER_SCRIPT")
  ) {
    flags |= TILE_ENTER_SCRIPT;
  }
  if (input.compIgnorePlayer) flags |= IGNORE_PLAYER;
  if (input.compRemoveScript !== false) flags |= EXECUTE_SCRIPT;
  if (
    input.compTileHitScript !== false &&
    featureEnabled(helpers, "DYNPROJ_ENABLE_TILE_HIT_SCRIPT")
  ) {
    flags |= TILE_HIT_SCRIPT;
  }
  if (
    input.compActorHitScript !== false &&
    featureEnabled(helpers, "DYNPROJ_ENABLE_ACTOR_HIT_SCRIPT")
  ) {
    flags |= ACTOR_HIT_SCRIPT;
  }

  const value = (v, fallback) =>
    v === undefined || v === null ? { type: "number", value: fallback } : v;
  const gravity = preset
    ? { type: "number", value: preset.gravity }
    : value(input.gravity, 0);
  const bounce = preset
    ? { type: "number", value: preset.bounce }
    : value(input.bounce, 0);
  // Amplitude and frequency mean something different for every behaviour that
  // reads them, so the fallback for a field the input never carried has to
  // follow the behaviour too.
  const amplitudeDefault =
    type === TYPE.chain ? 7 : type === TYPE.trail ? 4 : 30;
  const frequencyDefault =
    type === TYPE.chain ? 6 : type === TYPE.trail ? 4 : 10;
  const amplitude = preset
    ? { type: "number", value: preset.amplitude }
    : value(input.amplitude, amplitudeDefault);
  const frequency = preset
    ? { type: "number", value: preset.frequency }
    : value(input.frequency, frequencyDefault);

  // A chain and a trail both live in a strand out of a fixed size pool, so the
  // points they ask for have to fit. Only a plain number can be checked here -
  // a variable is clamped by the engine at launch instead.
  if (type === TYPE.chain || type === TYPE.trail) {
    const constant = (v) =>
      v && v.type === "number" && Number.isFinite(Number(v.value))
        ? Number(v.value)
        : null;
    const budget = engineNumber(helpers, "DYNPROJ_STRAND_POINTS", 16);
    const links = constant(frequency);
    const spacing = constant(amplitude);
    if (type === TYPE.chain) {
      if (links !== null && (links < 2 || links > budget)) {
        throw new Error(
          `A chain of ${links} links does not fit: it needs 2 to ${budget} points, and "Points per chain / trail" is ${budget} (Settings -> Engine -> Dynamic Projectiles).`
        );
      }
    } else if (links !== null && spacing !== null) {
      if (spacing < 2) {
        throw new Error(
          `A trail spacing of ${spacing} would put the first tail segment on top of the projectile itself: entry 0 of the history is where it is standing this pass. Use 2 or more.`
        );
      }
      if (links * spacing > budget) {
        throw new Error(
          `A trail of ${links} segments spaced ${spacing} apart needs ${
            links * spacing
          } points, but "Points per chain / trail" is ${budget}. Raise it under Settings -> Engine -> Dynamic Projectiles, or use fewer or closer segments.`
        );
      }
    }
  }

  // Load first: this memcpys a whole projectile_def_t into the slot, which
  // would wipe the behaviour fields if they were written before it.
  loadProjectile(
    slot,
    input.spriteSheetId,
    input.spriteStateId,
    input.speed,
    input.animSpeed,
    input.loopAnim,
    input.lifeTime,
    input.initialOffset,
    input.destroyOnHit,
    input.collisionGroup,
    input.collisionMask
  );

  _addComment(
    `Projectile Behaviour (type ${type}, flags ${flags}, collision ${collision})`
  );
  _stackPushScriptValue(frequency);
  _stackPushScriptValue(amplitude);
  _stackPushScriptValue(bounce);
  _stackPushScriptValue(gravity);
  // Numbers from here on: these become raw operands in the instruction.
  _stackPushConst(Number(collision));
  _stackPushConst(flags);
  _stackPushConst(Number(type));
  _stackPushConst(slot);
  _callNative("vm_define_projectile_behavior");
  _stackPop(8);

  if (type === TYPE.hookshot) {
    // Still engine globals: the two reactions did not fit in the 32 byte
    // definition, so they apply to whichever hookshot is in flight.
    engineFieldSetToScriptValue(
      "projectile_hookshot_tile_hit",
      num(Number(input.hookshotTileHit || 0))
    );
    engineFieldSetToScriptValue(
      "projectile_hookshot_actor_hit",
      num(Number(input.hookshotActorHit || 0))
    );
  }

  if (type === TYPE.custom) {
    // The Custom behaviour steps by the contents of two variables each frame.
    _setConstMemInt16("projectile_delta_x", getVariableAlias(input.customX));
    _setConstMemInt16("projectile_delta_y", getVariableAlias(input.customY));
  }
};

module.exports = {
  id,
  name,
  autoLabel,
  groups,
  fields,
  compile,
};
