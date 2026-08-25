const id = "DYNPROJ_EVENT_SET_TILE_ENTER_SCRIPT";
const name = "Set Projectile Tile Enter Script";
const groups = ["Projectiles"];

const fields = [
  {
    label:
      "Sets the script any projectile runs when its origin point crosses into a new tile. The grid it counts is the Tile enter grid engine setting - 8x8 or 16x16. It stays set until cleared or the scene changes.",
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
    label: "On Tile Enter",
    description:
      "Read the tile it moved onto with the Last Hit: X / Y engine fields, and which behaviour it was with Last Hit: Behaviour. A fast projectile can skip over a tile entirely, so this reports where it landed, not every tile on the line between.",
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
  if (!featureEnabled(helpers, "DYNPROJ_ENABLE_TILE_ENTER_SCRIPT")) {
    throw new Error(
      'The "Tile Enter" projectile script is disabled. Enable it under Settings -> Engine -> Dynamic Projectiles.'
    );
  }
};

const compile = (input, helpers) => {
  requireFeature(helpers);

  const { appendRaw, _compileSubScript, _addComment } = helpers;

  _addComment("Set Projectile Tile Enter Script");
  if (input.action == 0 && input.script && input.script.length > 0) {
    const ref = _compileSubScript("projectile", input.script, "p_tile_enter");
    appendRaw(`VM_PUSH_CONST ___bank_${ref}`);
    appendRaw(`VM_PUSH_CONST _${ref}`);
  } else {
    appendRaw(`VM_PUSH_CONST 0`);
    appendRaw(`VM_PUSH_CONST 0`);
  }
  appendRaw(`VM_CALL_NATIVE b_set_tile_enter_script, _set_tile_enter_script`);
  appendRaw(`VM_POP 2`);
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
