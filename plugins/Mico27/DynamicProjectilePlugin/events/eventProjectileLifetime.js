const id = "DYNPROJ_EVENT_PROJECTILE_LIFETIME";
const name = "Set Projectile Lifetime";
const groups = ["Projectiles"];

const num = (value) => ({ type: "number", value });

const fields = [
  {
    key: "lifetime",
    label: "Infinite Lifetime (Global)",
    type: "checkbox",
    defaultValue: false,
  },
];

const compile = (input, helpers) => {
  const { engineFieldSetToScriptValue } = helpers;

  engineFieldSetToScriptValue(
    "projectile_no_lifetime",
    num(input.lifetime ? 1 : 0)
  );
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
