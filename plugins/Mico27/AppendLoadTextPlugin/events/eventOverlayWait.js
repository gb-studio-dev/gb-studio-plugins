const l10n = require("../helpers/l10n").default;
const id = "EVENT_UI_OVERLAY_WAIT";
const name = "Wait for overlay/text to finish displaying";
const groups = ["EVENT_GROUP_DIALOGUE"];

const autoLabel = (_, input) => {
  return `Wait for overlay/text to finish displaying`;
};

const fields = [
  {
    key: "modal",
    label: "Modal",
    description: "Prevent anything else from running before completion.",
    type: "checkbox",
    width: "25%",
    defaultValue: false,
  },
  {
    key: "wait_window",
    label: "Wait for overlay",
    description: "Wait for overlay to finish moving.",
    type: "checkbox",
    width: "25%",
    defaultValue: false,
  },
  {
    key: "wait_text",
    label: "Wait for text",
    description: "Wait for text to finish displaying.",
    type: "checkbox",
    width: "25%",
    defaultValue: false,
  },
  {
    key: "wait_btn_a",
    label: "Wait for button A",
    description: "Wait for button A to be pressed.",
    type: "checkbox",
    width: "25%",
    defaultValue: false,
  },
  {
    key: "wait_btn_b",
    label: "Wait for button B",
    description: "Wait for button B to be pressed.",
    type: "checkbox",
    width: "25%",
    defaultValue: false,
  },
  {
    key: "wait_btn_any",
    label: "Wait for any button",
    description: "Wait for any button to be pressed.",
    type: "checkbox",
    width: "25%",
    defaultValue: false,
  },
];

const compile = (input, helpers) => {
    const { _overlayWait } = helpers;
    const waitFlags = [];
    if (input.wait_window){
        waitFlags.push(".UI_WAIT_WINDOW");
    }
    if (input.wait_text){
        waitFlags.push(".UI_WAIT_TEXT");
    }
    if (input.wait_btn_a){
        waitFlags.push(".UI_WAIT_BTN_A");
    }
    if (input.wait_btn_b){
        waitFlags.push(".UI_WAIT_BTN_B");
    }
    if (input.wait_btn_any){
        waitFlags.push(".UI_WAIT_BTN_ANY");
    }
    _overlayWait(input.modal, waitFlags);    
    
};

module.exports = {
  id,
  name,
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: false,
};