const id = "PM_EVENT_METATILE_SCRIPT";
const groups = ["Meta Tiles"];
const name = "Attach a Script to A Metatile Event";

const fields = [
    {
        key: "metatile_event",
        label: "Select Metatile Event",
        type: "select",
        defaultValue: "0",
        options: [
          ["0", "Metatile Enter"],
          ["1", "Metatile Collision"],
        ],
    },
    {
        key: "__scriptTabs",
        type: "tabs",
        defaultValue: "scriptinput",
        values: {
          scriptinput: "On Metatile Event",
        },
    },
    {
        key: "script",
        label: "Metatile Event Script",
        description: "Metatile Event Script",
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
    const {appendRaw, _compileSubScript, _addComment } = helpers;
    const ScriptRef = _compileSubScript("metatile_event", input.script, "metatile_event_" + input.metatile_event);
    const stateNumber = `${input.metatile_event}`;
    const bank = `___bank_${ScriptRef}`;
    const ptr = `_${ScriptRef}`

    _addComment("Attach a Script to A Metatile Event");
    appendRaw(`VM_PUSH_CONST ${stateNumber}`);
    appendRaw(`VM_PUSH_CONST ${bank}`);
    appendRaw(`VM_PUSH_CONST ${ptr}`);
    appendRaw(`VM_CALL_NATIVE b_vm_assign_metatile_script, _vm_assign_metatile_script`);
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
  
  