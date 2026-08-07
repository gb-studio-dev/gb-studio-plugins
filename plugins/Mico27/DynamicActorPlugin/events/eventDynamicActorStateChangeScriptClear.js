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
      ["6", "Actor activated"],
      ["7", "Actor deactivated"],
    ],
  },
];

export const compile = (input, helpers) => {
  const { appendRaw, _addComment } = helpers;
  const eventSlot = `${parseInt(input.eventSlot !== undefined ? input.eventSlot : "0", 10)}`;

  // Each slot group is compiled in by its own engine setting; refuse at compile
  // time rather than silently attaching a script to a slot that does not exist.
  const slotRequires = {
    0: ["DYNAMIC_ACTOR_ENABLE_STATE_CHANGE_EVENT", "Events: Actor state changed"],
    1: ["DYNAMIC_ACTOR_ENABLE_TILE_COLLISION_EVENTS", "Events: Tile collision"],
    2: ["DYNAMIC_ACTOR_ENABLE_TILE_COLLISION_EVENTS", "Events: Tile collision"],
    3: ["DYNAMIC_ACTOR_ENABLE_TILE_COLLISION_EVENTS", "Events: Tile collision"],
    4: ["DYNAMIC_ACTOR_ENABLE_TILE_COLLISION_EVENTS", "Events: Tile collision"],
    5: ["DYNAMIC_ACTOR_ENABLE_TILE_ENTER_EVENT", "Events: Tile enter"],
    10: ["DYNAMIC_ACTOR_ENABLE_TILE_COLLISION_EVENTS", "Events: Tile collision"],
    6: ["DYNAMIC_ACTOR_ENABLE_ACTIVATION_EVENTS", "Events: Actor activated / deactivated"],
    7: ["DYNAMIC_ACTOR_ENABLE_ACTIVATION_EVENTS", "Events: Actor activated / deactivated"],
  };
  const required = slotRequires[parseInt(eventSlot, 10)];
  if (required) {
    const [key, label] = required;
    const fv =
      helpers.engineFieldValues && helpers.engineFieldValues.find((s) => s.id === key);
    const def = helpers.engineFields && helpers.engineFields[key];
    const enabled =
      fv && fv.value !== undefined && fv.value !== null ? !!fv.value : def ? !!def.defaultValue : true;
    if (!enabled) {
      throw new Error(
        `This event slot requires the "${label}" engine setting to be enabled (Settings → Engine → Dynamic actor).`,
      );
    }
  }

  _addComment("Remove a Script from a Dynamic Actor Event");
  appendRaw(`VM_PUSH_CONST ${eventSlot}`);
  appendRaw(`VM_CALL_NATIVE b_vm_clear_dynamic_actor_event_script, _vm_clear_dynamic_actor_event_script`);
  appendRaw(`VM_POP 1`);
};
