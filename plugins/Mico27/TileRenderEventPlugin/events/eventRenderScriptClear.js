const id = "MICO_EVENT_RENDER_SCRIPT_CLEAR";
const groups = ["EVENT_GROUP_SCREEN"];
const name = "Remove a Script from a tile rendering Event";

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
  ];
  
  const compile = (input, helpers) => {
    const {appendRaw, _addComment} = helpers;

    const render_event = `${input.render_event}`;

    _addComment("Remove Render Event Script");
    appendRaw(`VM_PUSH_CONST ${render_event}`);
    appendRaw(`VM_CALL_NATIVE b_clear_render_script, _clear_render_script`);
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
  
  