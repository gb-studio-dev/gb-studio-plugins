const id = "DYNPROJ_EVENT_SET_HOOKSHOT";
const name = "Set Hookshot State";
const groups = ["Projectiles"];

const num = (value) => ({ type: "number", value });

const fields = [
  {
    key: "hookshot_state",
    label: "Set Hookshot State",
    type: "select",
    options: [
      [0, "Firing"],
      [1, "Returning"],
      [2, "Pull Player"],
      [3, "Pull Actor"],
      [5, "Remove"],
    ],
    defaultValue: 0,
  },
  {
    key: "actor",
    label: "Actor to pull",
    type: "actor",
    defaultValue: "$self$",
    conditions: [
      {
        key: "hookshot_state",
        eq: 3,
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

/** This event only means anything when the Hookshot behaviour is compiled in. */
const requireBehaviour = (helpers) => {
  if (!featureEnabled(helpers, "DYNPROJ_ENABLE_HOOKSHOT")) {
    throw new Error(
      'The "Hookshot" projectile behaviour is disabled. Enable it under Settings -> Engine -> Custom Projectiles.'
    );
  }
};

const compile = (input, helpers) => {
  requireBehaviour(helpers);

  const { engineFieldSetToScriptValue, getActorIndex } = helpers;

  engineFieldSetToScriptValue(
    "projectile_hookshot_state",
    num(Number(input.hookshot_state || 0))
  );
  if (input.hookshot_state == 3) {
    engineFieldSetToScriptValue(
      "projectile_actor_index",
      num(getActorIndex(input.actor))
    );
  }
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
