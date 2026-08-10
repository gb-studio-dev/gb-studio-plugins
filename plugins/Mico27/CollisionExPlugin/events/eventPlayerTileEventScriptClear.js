const id = "COLLISION_EX_EVENT_PLAYER_TILE_SCRIPT_CLEAR";
const name = "Remove a Script from a Player Tile Event";
const groups = ["Collision Ex"];

const fields = [
  {
    key: "tile_event",
    label: "Select Player Tile Event",
    description:
      "Stops the chosen slot firing until a script is attached to it again. Any collision clears all four directions.",
    type: "select",
    defaultValue: "0",
    options: [
      ["0", "Tile Enter"],
      ["1", "Tile Down Collision"],
      ["2", "Tile Right Collision"],
      ["3", "Tile Up Collision"],
      ["4", "Tile Left Collision"],
      ["5", "Tile Any Collision"],
    ],
  },
];

const compile = (input, helpers) => {
  const { appendRaw, _addComment } = helpers;

  _addComment("Remove a Script from a Player Tile Event");
  // A null pointer is what the runtime tests before firing, so clearing a slot is
  // the same call with no script behind it.
  appendRaw(`VM_PUSH_CONST ${input.tile_event}`);
  appendRaw(`VM_PUSH_CONST 0`);
  appendRaw(`VM_PUSH_CONST 0`);
  appendRaw(`VM_CALL_NATIVE b_vm_assign_player_tile_script, _vm_assign_player_tile_script`);
  appendRaw(`VM_POP 3`);
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
  allowedBeforeInitFade: true,
};
