const id = "DYNPROJ_EVENT_SET_ACTOR_HIT_SCRIPT";
const name = "Set Projectile Actor Hit Script";
const groups = ["Projectiles"];

const fields = [
  {
    label:
      "Sets the script any projectile runs when it touches an actor in its collision mask. It stays set until cleared or the scene changes.",
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
    label: "On Actor Hit",
    description:
      "Read which actor was hit with the Last Hit: Actor engine field, where with Last Hit: X / Y, and which behaviour it was with Last Hit: Behaviour.",
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
  if (!featureEnabled(helpers, "DYNPROJ_ENABLE_ACTOR_HIT_SCRIPT")) {
    throw new Error(
      'The "Actor Hit" projectile script is disabled. Enable it under Settings -> Engine -> Dynamic Projectiles.'
    );
  }
};

const compile = (input, helpers) => {
  requireFeature(helpers);

  const { appendRaw, _compileSubScript, _addComment } = helpers;

  _addComment("Set Projectile Actor Hit Script");
  if (input.action == 0 && input.script && input.script.length > 0) {
    const ref = _compileSubScript("projectile", input.script, "p_actor_hit");
    appendRaw(`VM_PUSH_CONST ___bank_${ref}`);
    appendRaw(`VM_PUSH_CONST _${ref}`);
  } else {
    appendRaw(`VM_PUSH_CONST 0`);
    appendRaw(`VM_PUSH_CONST 0`);
  }
  appendRaw(`VM_CALL_NATIVE b_set_actor_hit_script, _set_actor_hit_script`);
  appendRaw(`VM_POP 2`);
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
