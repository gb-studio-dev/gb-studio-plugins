const id = "PM_EVENT_METATILE_SCRIPT_CLEAR";
const groups = ["Meta Tiles"];
const name = "Remove a Script from Metatile Event";

const fields = [
    {
        key: "metatile_event",
        label: "Select Metatile Event",
        type: "select",
        defaultValue: "0",
        options: [
          ["0", "Metatile Enter"],
          ["1", "Metatile Down Collision"],
          ["2", "Metatile Right Collision"],
          ["3", "Metatile Up Collision"],
          ["4", "Metatile Left Collision"],
          ["5", "Metatile Any Collision"],
        ],
    },
  ];
  
  const compile = (input, helpers) => {
    const {appendRaw, _addComment} = helpers;

    const metatile_event = `${input.metatile_event}`;

    _addComment("Remove a Script from Metatile Event");
    appendRaw(`VM_PUSH_CONST ${metatile_event}`);
    appendRaw(`VM_CALL_NATIVE b_vm_clear_metatile_script, _vm_clear_metatile_script`);
    appendRaw(`VM_POP 1`);
  };
  
  module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
    allowedBeforeInitFade: true,
  };
  
  