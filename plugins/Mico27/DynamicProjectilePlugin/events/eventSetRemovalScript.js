const id = "DYNPROJ_EVENT_SET_REMOVAL_SCRIPT";
const name = "Set Projectile Removal Script";
const groups = ["Projectiles"];

const fields = [
  {
    label:
      "Sets the script projectiles run when they are removed. It stays set until cleared or the scene changes, so it only needs setting once.",
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
    label: "On Removal",
    description:
      "Read the position with the Last Hit: X / Y engine fields, and which behaviour it was with Last Hit: Behaviour.",
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

  _addComment("Set Projectile Removal Script");
  if (input.action == 0 && input.script && input.script.length > 0) {
    const ref = _compileSubScript("projectile", input.script, "p_removal");
    appendRaw(`VM_PUSH_CONST ___bank_${ref}`);
    appendRaw(`VM_PUSH_CONST _${ref}`);
  } else {
    appendRaw(`VM_PUSH_CONST 0`);
    appendRaw(`VM_PUSH_CONST 0`);
  }
  appendRaw(`VM_CALL_NATIVE b_set_removal_script, _set_removal_script`);
  appendRaw(`VM_POP 2`);
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
