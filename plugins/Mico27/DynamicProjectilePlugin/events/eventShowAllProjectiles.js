const id = "DYNPROJ_EVENT_SHOW_ALL_PROJECTILES";
const name = "Show All Projectiles";
const groups = ["Projectiles"];

const num = (value) => ({ type: "number", value });

const fields = [
  {
    label: "Show All Projectiles",
  },
];

const compile = (input, helpers) => {
  const { engineFieldSetToScriptValue } = helpers;

  engineFieldSetToScriptValue("projectile_hide", num(0));
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
