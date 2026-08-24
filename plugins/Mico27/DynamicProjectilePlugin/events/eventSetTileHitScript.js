const id = "DYNPROJ_EVENT_SET_TILE_HIT_SCRIPT";
const name = "Set Projectile Tile Hit Script";
const groups = ["Projectiles"];

// Which face of the solid tile was struck. Strings, not numbers: a select whose
// value is a falsy 0 cannot be picked in the GB Studio editor.
const FACE_TOP = "0";
const FACE_RIGHT = "1";
const FACE_BOTTOM = "2";
const FACE_LEFT = "3";
const FACE_ANY = "4";

const fields = [
  {
    label:
      "Sets the script any projectile runs when its Collision Behaviour reacts to a solid tile - removed on impact, or bounced off one. There is one script per face of the tile, so a shot landing on a floor can do something different from one hitting a wall. Each stays set until cleared or the scene changes.",
  },
  {
    key: "face",
    label: "Tile Face",
    description:
      "Side of the solid tile the projectile came up against - not the way it was travelling. A shot falling onto a floor hits its Top; one flying right into a wall hits that wall's Left. Any sets all four at once. Needs the \"Tile hit script per face\" engine setting; with that off there is only one shared script and this must stay on Any.",
    type: "select",
    options: [
      [FACE_ANY, "Any"],
      [FACE_TOP, "Top"],
      [FACE_RIGHT, "Right"],
      [FACE_BOTTOM, "Bottom"],
      [FACE_LEFT, "Left"],
    ],
    defaultValue: FACE_ANY,
  },
  {
    key: "action",
    label: "Action",
    type: "select",
    options: [
      [0, "Set script"],
      [1, "Clear script"],
    ],
    defaultValue: 0,
  },
  {
    key: "script",
    label: "On Tile Hit",
    description:
      "Read where it hit with the Last Hit: X / Y engine fields, and which behaviour it was with Last Hit: Behaviour. A bouncing projectile runs this on every bounce.",
    type: "events",
    allowedContexts: ["global", "entity"],
    conditions: [
      {
        key: "action",
        eq: 0,
      },
    ],
  },
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

/** The trigger this event feeds has its own compile time switch. */
const requireFeature = (helpers) => {
  if (!featureEnabled(helpers, "DYNPROJ_ENABLE_TILE_HIT_SCRIPT")) {
    throw new Error(
      'The "Tile Hit" projectile script is disabled. Enable it under Settings -> Engine -> Dynamic Projectiles.'
    );
  }
};

const compile = (input, helpers) => {
  requireFeature(helpers);
  // With the per-face setting off there is a single slot, so naming one face
  // would quietly become "all of them" - say so instead.
  if (
    (input.face ?? FACE_ANY) !== FACE_ANY &&
    !featureEnabled(helpers, "DYNPROJ_TILE_HIT_BY_FACE")
  ) {
    throw new Error(
      'Picking a tile face needs the "Tile hit script per face" engine setting. Enable it under Settings -> Engine -> Dynamic Projectiles, or set Tile Face to "Any".'
    );
  }

  const { appendRaw, _compileSubScript, _addComment } = helpers;

  // The face is pushed first so the bank and pointer keep the FN_ARG slots
  // they had before this event grew a third argument.
  const face = Number(input.face ?? FACE_ANY);

  _addComment("Set Projectile Tile Hit Script");
  appendRaw(`VM_PUSH_CONST ${face}`);
  if (input.action == 0 && input.script && input.script.length > 0) {
    const ref = _compileSubScript("projectile", input.script, "p_tile_hit");
    appendRaw(`VM_PUSH_CONST ___bank_${ref}`);
    appendRaw(`VM_PUSH_CONST _${ref}`);
  } else {
    appendRaw(`VM_PUSH_CONST 0`);
    appendRaw(`VM_PUSH_CONST 0`);
  }
  appendRaw(`VM_CALL_NATIVE b_set_tile_hit_script, _set_tile_hit_script`);
  appendRaw(`VM_POP 3`);
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
