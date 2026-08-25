const l10n = require("../helpers/l10n").default;

// Plugin-only event: reads a save point by its position in the Save
// configuration list, which the built-in peek event cannot express.
const id = "EVENT_PEEK_DATA_BY_INDEX";
const groups = ["EVENT_GROUP_SAVE_DATA", "EVENT_GROUP_VARIABLES"];
const subGroups = {
  "EVENT_GROUP_SAVE_DATA": "EVENT_GROUP_VARIABLES",
  "EVENT_GROUP_VARIABLES": "EVENT_GROUP_SAVE_DATA"
}

// ---------------------------------------------------------------------------
// Save slot plumbing, kept in step with engine/src/core/load_save.c.
// Plugin event files cannot require one another, so this block is repeated in
// every event of this plugin that takes a save slot.
// ---------------------------------------------------------------------------
const SRAM_BANK_SIZE = 0x2000;
const MAX_SRAM_BANKS = 4; // GB Studio links every ROM with -Wm-ya4
const MAX_SAVE_SLOTS = 255; // the engine takes the slot as a UBYTE
const VM_HEAP_BYTES = 768 * 2; // VM_HEAP_SIZE words: every global variable
const SAVE_HEADER_SIZE = 4 + 2; // signature + blob size
const SAVE_BLOCK_HEADER_SIZE = 2 + 1; // block size + block id

const engineSetting = (helpers, key, fallback) => {
  const fv =
    helpers.engineFieldValues &&
    helpers.engineFieldValues.find((s) => s.id === key);
  if (fv && fv.value !== undefined && fv.value !== null) return fv.value;
  const def = helpers.engineFields && helpers.engineFields[key];
  if (def && def.defaultValue !== undefined && def.defaultValue !== null) {
    return def.defaultValue;
  }
  return fallback;
};

const STRUCTURE_FULL = "SAVE_STRUCTURE_FULL";
const STRUCTURE_VARIABLES = "SAVE_STRUCTURE_VARIABLES";
const STRUCTURE_CUSTOM = "SAVE_STRUCTURE_CUSTOM";

const STRUCTURE_LABELS = {
  [STRUCTURE_FULL]: "Full save-state",
  [STRUCTURE_VARIABLES]: "All variables only",
  [STRUCTURE_CUSTOM]: "Custom variable set",
};

const saveLayout = (helpers) => {
  let structure = String(
    engineSetting(helpers, "SAVE_STRUCTURE", STRUCTURE_FULL)
  );
  if (!STRUCTURE_LABELS[structure]) structure = STRUCTURE_FULL;
  let startBank = Number(engineSetting(helpers, "SAVE_SRAM_START_BANK", 1));
  let slotCount = Number(engineSetting(helpers, "SAVE_SLOT_COUNT", 3));
  if (!isFinite(startBank)) startBank = 1;
  if (!isFinite(slotCount)) slotCount = 3;
  startBank = Math.max(0, Math.min(MAX_SRAM_BANKS - 1, Math.floor(startBank)));
  slotCount = Math.max(1, Math.min(MAX_SAVE_SLOTS, Math.floor(slotCount)));
  return { structure, startBank, slotCount };
};

// How many slots of a given size actually fit in SRAM. A compatibility variant
// can push the first bank higher than the setting asks for, so this is an upper
// bound, never a promise.
const slotsThatFit = (startBank, blobSize) => {
  if (!blobSize || blobSize > SRAM_BANK_SIZE) return 0;
  return Math.floor(SRAM_BANK_SIZE / blobSize) * (MAX_SRAM_BANKS - startBank);
};

const checkSaveSlot = (helpers, slot) => {
  if (
    !isFinite(slot) ||
    slot < 0 ||
    slot >= MAX_SAVE_SLOTS ||
    Math.floor(slot) !== slot
  ) {
    throw new Error(
      `Save slot must be a whole number from 0 to ${MAX_SAVE_SLOTS - 1}, got ${slot}.`
    );
  }
  const layout = saveLayout(helpers);
  if (slot >= layout.slotCount) {
    throw new Error(
      `Save slot ${slot} does not exist: "Save slot count" is ${
        layout.slotCount
      }, so the slots are 0 to ${
        layout.slotCount - 1
      }. Raise it in Settings > Engine > Configure Load/Save, or use a lower slot.`
    );
  }
  // With "All variables only" the size of a save is settled here, so how many
  // slots SRAM can hold is known too.
  if (layout.structure === STRUCTURE_VARIABLES && helpers.warnings) {
    const blobSize = SAVE_HEADER_SIZE + SAVE_BLOCK_HEADER_SIZE + VM_HEAP_BYTES;
    const fits = slotsThatFit(layout.startBank, blobSize);
    if (slot >= fits) {
      helpers.warnings(
        `Save slot ${slot} does not fit in SRAM: with "All variables only" each slot takes ${blobSize} bytes, and only ${fits} fit from SRAM bank ${layout.startBank} onwards. Saving to or loading from that slot will do nothing.`
      );
    }
  }
};

// The slot as a build-time constant, or null when it is only known at runtime.
// The stock save/load path carries the slot as a literal assembler operand
// (.SAVE_SLOT), so only a constant can take it.
const literalSaveSlot = (helpers, input) => {
  let slot = input.saveSlot;
  if (slot === "custom") {
    const value = input.saveSlotValue;
    if (!value || value.type !== "number") return null;
    slot = Number(value.value);
  }
  if (typeof slot !== "number") return null;
  checkSaveSlot(helpers, slot);
  return slot;
};

// A runtime slot cannot go through the stock save/load path, so those events
// call the plugin’s native from inside the running script instead. That native
// runs on the VM contexts, so it cannot restore them — which is exactly what the
// full save-state structure needs it to do. Only save and load restore state;
// peeking or checking a runtime slot is always safe.
const checkRuntimeSaveSlot = (helpers, what) => {
  if (saveLayout(helpers).structure === STRUCTURE_FULL) {
    throw new Error(
      `${what}: a save slot taken from a variable needs a save structure that holds no running scripts. Set "Save structure" to "All variables only" or "Custom variable set" in Settings > Engine > Configure Load/Save, or pick a fixed slot.`
    );
  }
};

const pushSaveSlot = (helpers, input) => {
  const { _stackPushConst, _stackPushScriptValue } = helpers;
  let slot = input.saveSlot;
  if (slot === "custom") {
    slot =
      input.saveSlotValue === undefined || input.saveSlotValue === null
        ? { type: "number", value: 0 }
        : input.saveSlotValue;
  }
  if (typeof slot === "number") {
    checkSaveSlot(helpers, slot);
    _stackPushConst(slot);
    return;
  }
  if (slot && slot.type === "number") {
    checkSaveSlot(helpers, Number(slot.value));
  }
  _stackPushScriptValue(slot);
};

const describeSaveSlot = (input) => {
  if (input.saveSlot !== "custom") return String(input.saveSlot);
  const value = input.saveSlotValue;
  if (value && value.type === "number") return String(value.value);
  return "(value)";
};

const saveSlotFields = [
  {
    key: "saveSlot",
    label: l10n("FIELD_SAVE_SLOT"),
    description: l10n("FIELD_SAVE_SLOT_DESC"),
    type: "togglebuttons",
    options: [
      [
        0,
        l10n("FIELD_SLOT_N", { slot: 1 }),
        l10n("FIELD_SAVE_SLOT_N", { slot: 1 }),
      ],
      [
        1,
        l10n("FIELD_SLOT_N", { slot: 2 }),
        l10n("FIELD_SAVE_SLOT_N", { slot: 2 }),
      ],
      [
        2,
        l10n("FIELD_SLOT_N", { slot: 3 }),
        l10n("FIELD_SAVE_SLOT_N", { slot: 3 }),
      ],
      ["custom", "#", "Use a slot number or a variable"],
    ],
    allowNone: false,
    defaultValue: 0,
  },
  {
    key: "saveSlotValue",
    label: "Slot number",
    description:
      "0-based save slot index. The number of slots is set by \"Save slot count\" in Settings > Engine > Configure Load/Save; a slot beyond that, or one that would not fit in SRAM, does nothing.",
    type: "value",
    min: 0,
    max: 254,
    conditions: [
      {
        key: "saveSlot",
        eq: "custom",
      },
    ],
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
];

const fields = [
  {
    key: "variableDest",
    label: l10n("FIELD_SET_VARIABLE"),
    description: l10n("FIELD_VARIABLE_SET_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    type: "group",
    fields: [
      {
        key: `variableSource`,
        label: "Saved data index",
        description:
          "Index to read. With a Save configuration event this is the 0-based position of the variable in that event's list. With the \"Save all variables only\" engine setting it is the variable's own index instead.",
        type: "number",
        defaultValue: 0,
      },
    ].concat(saveSlotFields),
  },
];

const compile = (input, helpers) => {

    const { _declareLocal, getVariableAlias, getNextLabel, _addComment, _ifConst, _setVariableConst, _label, _addNL, _stackPushConst, _callNative, _stackPop, _isIndirectVariable, _setInd } = helpers;

  const variableAlias = getVariableAlias(input.variableDest);
  let dest = variableAlias;
  if (_isIndirectVariable(input.variableDest)) {
    const dataResultRef = _declareLocal("data_result", 1, true);
    dest = dataResultRef;
  }

  _addComment(
    `Store ${input.variableSource} from save slot ${describeSaveSlot(input)} into ${variableAlias}`
  );

  _stackPushConst(dest);
  _stackPushConst(1);
  _stackPushConst(input.variableSource);
  pushSaveSlot(helpers, input);
  _callNative("vm_data_peek_ex");
  _stackPop(4);

  if (_isIndirectVariable(input.variableDest)) {
    _setInd(variableAlias, dest);
  }

};

module.exports = {
  id,
  name: "Store Variable from Game Data In Variable by Index",
  description: "Store Variable from Game Data In Variable by Index",
  groups,
  subGroups,
  fields,
  compile,
};
