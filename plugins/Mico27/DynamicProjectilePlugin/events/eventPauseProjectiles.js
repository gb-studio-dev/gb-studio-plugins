// Based on NukeOTron's pause projectile plugin for locked scripts

const id = "DYNPROJ_EVENT_PAUSE_PROJECTILES";
const name = "Pause Projectiles";
const groups = ["Projectiles"];

const num = (value) => ({ type: "number", value });

const fields = [
  {
    key: "pause",
    label: "Pause All Projectiles",
    type: "select",
    options: [
      [0, "Off"],
      [1, "Pause All Projectiles"],
      [2, "Pause on Locked Script"],
    ],
    defaultValue: 0,
  },
];

const compile = (input, helpers) => {
  const { engineFieldSetToScriptValue } = helpers;

  engineFieldSetToScriptValue("projectile_pause", num(Number(input.pause || 0)));
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
