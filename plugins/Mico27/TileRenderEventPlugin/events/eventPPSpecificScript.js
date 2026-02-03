const id = "MICO_EVENT_RENDER_SCRIPT";
const groups = ["EVENT_GROUP_SCREEN"];
const name = "Attach a Script to a tile rendering Event";

const fields = [
    {
        key: "render_event",
        label: "Select Render Event",
        type: "select",
        defaultValue: "0",
        options: [
          ["0", "Render column"],
          ["1", "Render row"],
		  ["2", "Render all"],
        ],
    },
    {
        key: "__scriptTabs",
        type: "tabs",
        defaultValue: "scriptinput",
        values: {
          scriptinput: "On Render Event",
        },
    },
    {
        key: "script",
        label: "Render Event Script",
        description: "Render Event Script",
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
    const {appendRaw, _compileSubScript, _addComment, vm_call_native, event } = helpers;
    const ScriptRef = _compileSubScript("render_event", input.script, "test_symbol"+input.render_event);
    const stateNumber = `${input.render_event}`;
    const bank = `___bank_${ScriptRef}`;
    const ptr = `_${ScriptRef}`

    _addComment("Set Render Event Script");
    appendRaw(`VM_PUSH_CONST ${stateNumber}`);
    appendRaw(`VM_PUSH_CONST ${bank}`);
    appendRaw(`VM_PUSH_CONST ${ptr}`);
    appendRaw(`VM_CALL_NATIVE b_assign_render_script, _assign_render_script`);
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
  
  