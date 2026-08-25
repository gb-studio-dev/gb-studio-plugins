const l10n = require("../helpers/l10n").default;

const id = "EVENT_SAVE_CONFIG";
const groups = ["EVENT_GROUP_SAVE_DATA", "EVENT_GROUP_VARIABLES"];
const subGroups = {
  "EVENT_GROUP_SAVE_DATA": "EVENT_GROUP_VARIABLES",
  "EVENT_GROUP_VARIABLES": "EVENT_GROUP_SAVE_DATA"
}

// ---------------------------------------------------------------------------
// SRAM layout, kept in step with engine/src/core/load_save.c.
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

const fields = [].concat(
  [
    {
        label: "⚠️ To peek a value from this variable list, use the \"Store Variable from Game Data In Variable by Index\" event"
    },
    {
        label: "⚠️ The built-in Game Data Save, Game Data Load and If Game Data Saved events use this list automatically"
    },
    {
        label: "⚠️ This event emits no runtime code: it only describes the save structure at build time"
    },
    {
        label: "⚠️ Requires \"Save structure\" to be set to \"Custom variable set\" in Settings > Engine > Configure Load/Save"
    },
    {
      key: "variableAmount",
      label: "Amount of variables",
      description: "Amount of variables",
      type: "number",
      min: 1,
      max: 768,
      defaultValue: 1,
    },
  ],
  Array(768)
    .fill()
    .reduce((arr, _, i) => {
      arr.push({
        key: `variableDest${i}`,
        conditions: [
          {
            key: "variableAmount",
            gt: i,
          },
        ],
        label: `Variable at index ${i}`,
        description: `Variable at index ${i}`,
        type: "variable",
        defaultValue: "LAST_VARIABLE",
      });
      return arr;
    }, []),
);

const compile = (input, helpers) => {
  const { getVariableAlias, writeAsset, warnings } = helpers;
  const layout = saveLayout(helpers);

  // This event *is* the custom structure, so it only has a job to do when the
  // engine setting asks for one. Anything else is a contradiction worth saying
  // out loud rather than silently resolving one way or the other.
  if (layout.structure !== STRUCTURE_CUSTOM) {
    throw new Error(
      `Save configuration: "Save structure" is set to "${
        STRUCTURE_LABELS[layout.structure]
      }", which does not use this event's variable list. Set it to "Custom variable set" in Settings > Engine > Configure Load/Save, or remove this event.`
    );
  }

  let save_points = "";
  let blobSize = SAVE_HEADER_SIZE;

  for (let i = 0; i < input.variableAmount; i++){
      save_points += `SAVEPOINT(script_memory[${getVariableAlias(input[`variableDest${i}`])}],${i}),\n`;
      blobSize += SAVE_BLOCK_HEADER_SIZE + 2;
  }

  // A blob has to sit inside a single SRAM bank: the engine refuses every slot
  // otherwise, which would leave the game unable to save at all.
  if (blobSize > SRAM_BANK_SIZE) {
    throw new Error(
      `Save configuration: a save slot needs ${blobSize} bytes but an SRAM bank only holds ${SRAM_BANK_SIZE}. Save fewer variables.`
    );
  }

  const fits = slotsThatFit(layout.startBank, blobSize);
  if (warnings) {
    const banksUsed = Math.ceil(
      layout.slotCount / Math.floor(SRAM_BANK_SIZE / blobSize)
    );
    warnings(
      `Save configuration: ${blobSize} bytes per save slot, ${
        layout.slotCount
      } slot(s) needing ${banksUsed} SRAM bank(s) from bank ${
        layout.startBank
      }. A compatibility variant may push the first bank higher.`
    );
    if (layout.slotCount > fits) {
      warnings(
        `Save configuration: "Save slot count" is ${layout.slotCount} but only ${fits} slot(s) of ${blobSize} bytes fit from SRAM bank ${layout.startBank} onwards. Slots ${fits} and above will do nothing — lower the slot count, save fewer variables, or lower "Starting SRAM bank".`
      );
    }
  }

  writeAsset(
      `save_points.c`,
      `#pragma bank 255

#include <string.h>
#include "data/save_points.h"
#include "vm.h"
#include "data/game_globals.h"

BANKREF(save_points)



const save_point_t save_points[] = {
    ${save_points}
    // terminator
    SAVEPOINTS_END
};`
    );

    writeAsset(
      `save_points.h`,
      `#ifndef __SAVE_POINTS_INCLUDE__
#define __SAVE_POINTS_INCLUDE__

#include <gbdk/platform.h>

typedef struct save_point_t {
    void * target;
    size_t size;
    uint8_t id;
} save_point_t;

#define SAVEPOINT(A, ID) {&(A), sizeof(A), (ID)}
// Only the global variables, not the VM context stacks that sit behind them in
// script_memory[]: those belong to the scripts running right now, and the load
// happens from inside one of them.
#define SAVEPOINT_VARIABLES(ID) {script_memory, (VM_HEAP_SIZE * sizeof(UWORD)), (ID)}
#define SAVEPOINTS_END {0, 0}

BANKREF_EXTERN(save_points)
extern const save_point_t save_points[];

#endif
`
    );
};

module.exports = {
  id,
  name: "Save configuration",
  description: "Save configuration",
  groups,
  subGroups,
  fields,
  compile,
};
