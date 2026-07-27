export const id = "EVENT_DYNAMIC_ACTOR_STATE_CHANGE_SCRIPT_CLEAR";
export const name = "Remove a Script from a Dynamic Actor Event";
export const groups = ["Dynamic Actor"];

export const fields = [
  {
    key: "eventSlot",
    label: "Event slot",
    description: "Which dynamic actor event slot to clear",
    type: "select",
    defaultValue: "0",
    options: [
      ["0", "State change"],
      ["1", "Tile collision (Top)"],
      ["2", "Tile collision (Right)"],
      ["3", "Tile collision (Bottom)"],
      ["4", "Tile collision (Left)"],
      ["10", "Tile collision (Any)"],
      ["5", "Tile enter"],
    ],
  },
];

export const compile = (input, helpers) => {
  const { appendRaw, _addComment } = helpers;
  const eventSlot = `${parseInt(input.eventSlot !== undefined ? input.eventSlot : "0", 10)}`;

  _addComment("Remove a Script from a Dynamic Actor Event");
  appendRaw(`VM_PUSH_CONST ${eventSlot}`);
  appendRaw(`VM_CALL_NATIVE b_vm_clear_dynamic_actor_event_script, _vm_clear_dynamic_actor_event_script`);
  appendRaw(`VM_POP 1`);
};
