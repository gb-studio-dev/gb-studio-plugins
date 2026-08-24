const id = "COLLISION_EX_EVENT_PLAYER_TILE_SCRIPT";
const name = "Attach a Script to a Player Tile Event";
const groups = ["Collision Ex"];

// Slot numbers are stored in the project, so they are fixed. Must match the
// COLLISION_EX_EVENT_* defines in collision_ex.h.
const SLOT_ENTER = "0";
const SLOT_DOWN = "1";
const SLOT_RIGHT = "2";
const SLOT_UP = "3";
const SLOT_LEFT = "4";
const SLOT_ANY = "5";

const slotRequires = {
  [SLOT_ENTER]: ["COLLISION_EX_ENABLE_TILE_ENTER_EVENT", "Events: Player tile enter"],
  [SLOT_DOWN]: ["COLLISION_EX_ENABLE_TILE_COLLISION_EVENT", "Events: Player tile collision"],
  [SLOT_RIGHT]: ["COLLISION_EX_ENABLE_TILE_COLLISION_EVENT", "Events: Player tile collision"],
  [SLOT_UP]: ["COLLISION_EX_ENABLE_TILE_COLLISION_EVENT", "Events: Player tile collision"],
  [SLOT_LEFT]: ["COLLISION_EX_ENABLE_TILE_COLLISION_EVENT", "Events: Player tile collision"],
  [SLOT_ANY]: ["COLLISION_EX_ENABLE_TILE_COLLISION_EVENT", "Events: Player tile collision"],
};

const fields = [
  {
    key: "tile_event",
    label: "Select Player Tile Event",
    description:
      "Tile enter fires when the player moves onto a tile it was not on last frame, using the detection mode set in the engine settings. The collision events fire when a tile stops the player moving that way. Any collision attaches one script to all four directions.",
    type: "select",
    defaultValue: SLOT_ENTER,
    options: [
      [SLOT_ENTER, "Tile Enter"],
      [SLOT_DOWN, "Tile Down Collision"],
      [SLOT_RIGHT, "Tile Right Collision"],
      [SLOT_UP, "Tile Up Collision"],
      [SLOT_LEFT, "Tile Left Collision"],
      [SLOT_ANY, "Tile Any Collision"],
    ],
  },
  {
    key: "__scriptTabs",
    type: "tabs",
    defaultValue: "scriptinput",
    values: {
      scriptinput: "On Player Tile Event",
    },
  },
  {
    key: "script",
    label: "Player Tile Event Script",
    description:
      "Runs when the event fires. Read where it happened with the Entered tile / Collided tile engine fields. One script runs at a time per slot - a firing while the previous run is still going is skipped, so keep it short.",
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

const compile = (input, helpers) => {
  const { appendRaw, _compileSubScript, _addComment } = helpers;

  const engineFieldOn = (key) => {
    const fv =
      helpers.engineFieldValues &&
      helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  const required = slotRequires[`${input.tile_event}`];
  if (required && !engineFieldOn(required[0])) {
    throw new Error(
      `This event slot requires the "${required[1]}" engine setting to be enabled (Settings → Engine → Collision Ex).`
    );
  }

  const scriptRef = _compileSubScript(
    "player_tile_event",
    input.script,
    "player_tile_event_" + input.tile_event
  );
  const slot = `${input.tile_event}`;
  const bank = `___bank_${scriptRef}`;
  const ptr = `_${scriptRef}`;

  _addComment("Attach a Script to a Player Tile Event");
  appendRaw(`VM_PUSH_CONST ${slot}`);
  appendRaw(`VM_PUSH_CONST ${bank}`);
  appendRaw(`VM_PUSH_CONST ${ptr}`);
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
