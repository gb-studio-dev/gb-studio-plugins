const id = "DYNPROJ_EVENT_SET_TILE_HIT_SCRIPT";
const name = "Set Projectile Tile Hit Script";
const groups = ["Projectiles"];

const fields = [
  {
    label:
      "Sets the script any projectile runs when its Collision Behaviour reacts to a solid tile - removed on impact, or bounced off one. It stays set until cleared or the scene changes.",
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

const compile = (input, helpers) => {
  const { appendRaw, _compileSubScript, _addComment } = helpers;

  _addComment("Set Projectile Tile Hit Script");
  if (input.action == 0 && input.script && input.script.length > 0) {
    const ref = _compileSubScript("projectile", input.script, "p_tile_hit");
    appendRaw(`VM_PUSH_CONST ___bank_${ref}`);
    appendRaw(`VM_PUSH_CONST _${ref}`);
  } else {
    appendRaw(`VM_PUSH_CONST 0`);
    appendRaw(`VM_PUSH_CONST 0`);
  }
  appendRaw(`VM_CALL_NATIVE b_set_tile_hit_script, _set_tile_hit_script`);
  appendRaw(`VM_POP 2`);
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
