const id = "DYNPROJ_EVENT_HIDE_ALL_PROJECTILES";
const name = "Hide All Projectiles";
const groups = ["Projectiles"];

const num = (value) => ({ type: "number", value });

const fields = [
  {
    label: "Hide All Projectiles",
  },
];

const compile = (input, helpers) => {
  const { engineFieldSetToScriptValue } = helpers;

  engineFieldSetToScriptValue("projectile_hide", num(1));
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
