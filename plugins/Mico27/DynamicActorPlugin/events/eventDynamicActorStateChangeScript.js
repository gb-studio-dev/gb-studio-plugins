const l10n = require("../helpers/l10n").default;

export const id = "EVENT_DYNAMIC_ACTOR_STATE_CHANGE_SCRIPT";
export const name = "Attach a Script to a Dynamic Actor Event";
export const groups = ["Dynamic Actor"];

export const fields = [
  {
    key: "eventSlot",
    label: "Event slot",
    description: "Which dynamic actor event slot to update",
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
  {
    key: "__scriptTabs",
    type: "tabs",
    defaultValue: "scriptinput",
    values: {
      scriptinput: "State Change Script",
    },
  },
  {
    key: "script",
    label: "Dynamic Actor Event Script",
    description: "Script to run when the selected dynamic actor event fires",
    type: "events",
    allowedContexts: ["global", "entity"],
    conditions: [
      {
        key: "__scriptTabs",
        in: [undefined, "scriptinput"],
      },
    ],
  },
];

export const compile = (input, helpers) => {
  const { appendRaw, _compileSubScript, _addComment } = helpers;
  const scriptRef = _compileSubScript("dynamic_actor_state_change", input.script, "dynamic_actor_state_change");
  const eventSlot = `${parseInt(input.eventSlot !== undefined ? input.eventSlot : "0", 10)}`;

  // Slots 6 and 7 only exist when the activation hooks are compiled in
  if (eventSlot === "6" || eventSlot === "7") {
    const fv =
      helpers.engineFieldValues &&
      helpers.engineFieldValues.find((s) => s.id === "DYNAMIC_ACTOR_ENABLE_ACTIVATION_EVENTS");
    const def = helpers.engineFields && helpers.engineFields["DYNAMIC_ACTOR_ENABLE_ACTIVATION_EVENTS"];
    const enabled =
      fv && fv.value !== undefined && fv.value !== null ? !!fv.value : def ? !!def.defaultValue : true;
    if (!enabled) {
      throw new Error(
        'The "Actor activated" and "Actor deactivated" event slots require the "Events: Actor activated / deactivated" engine setting to be enabled (Settings → Engine → Dynamic actor).',
      );
    }
  }
  const bank = `___bank_${scriptRef}`;
  const ptr = `_${scriptRef}`;

  _addComment("Attach a Script to a Dynamic Actor Event");
  appendRaw(`VM_PUSH_CONST ${eventSlot}`);
  appendRaw(`VM_PUSH_CONST ${bank}`);
  appendRaw(`VM_PUSH_CONST ${ptr}`);
  appendRaw(`VM_CALL_NATIVE b_vm_assign_dynamic_actor_event_script, _vm_assign_dynamic_actor_event_script`);
  appendRaw(`VM_POP 3`);
};
