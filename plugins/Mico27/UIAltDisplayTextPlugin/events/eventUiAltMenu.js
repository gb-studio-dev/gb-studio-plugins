const id = "EVENT_UI_ALT_MENU";
const name = "Alt Menu";
const groups = ["EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg) => {
  const numItems = parseInt(fetchArg("items"), 10) || 0;
  const text = Array(numItems)
    .fill()
    .map((_, i) => `"${fetchArg(`option${i + 1}`)}"`)
    .join(", ");
  return `${fetchArg("variable")} = Alt Menu ${text}`;
};

const fields = [].concat(
  [
    {
      type: "label",
      label:
        "A menu whose options are drawn by this plugin instead of GB Studio's own " +
        "text renderer, so they use the tiles already in VRAM like the rest of its " +
        "text. The stock Menu event draws its options through the stock renderer and " +
        "ignores those tiles. Everything else -- window size, cursor, navigation, the " +
        "cancel flags -- behaves exactly as the stock menu does.",
    },
    {
      key: "variable",
      label: "Set Variable To Selected Option",
      description:
        "The chosen option's number, counting from 1. Zero when the menu is cancelled.",
      type: "variable",
      defaultValue: "LAST_VARIABLE",
    },
    {
      key: "items",
      label: "Number Of Options",
      description: "Each option takes one row, as stock text does.",
      type: "number",
      min: 2,
      max: 8,
      defaultValue: 2,
    },
    {
      key: "layout",
      label: "Layout",
      description:
        "Narrow is the stock menu box on the right-hand side. Full width gives every " +
        "option the whole screen width.",
      type: "select",
      options: [
        ["narrow", "Narrow (right side)"],
        ["full", "Full width"],
      ],
      defaultValue: "narrow",
    },
    { type: "break" },
  ],
  Array(8)
    .fill()
    .reduce((arr, _, i) => {
      arr.push({
        key: `option${i + 1}`,
        label: `Set To ${i + 1} If`,
        type: "textarea",
        singleLine: true,
        defaultValue: "",
        placeholder: `Item ${i + 1}`,
        conditions: [{ key: "items", gte: i + 1 }],
      });
      return arr;
    }, []),
  [
    { type: "break" },
    {
      key: "cancelOnLastOption",
      label: "Last Option Cancels",
      description: "Choosing the final option sets the variable to 0 instead of its number.",
      type: "checkbox",
      defaultValue: false,
    },
    {
      key: "cancelOnB",
      label: "Cancel On B Button",
      description: "B closes the menu and sets the variable to 0.",
      type: "checkbox",
      defaultValue: false,
    },
  ]
);

// The goto control code, written the way the compiler's own helper does:
// \003 followed by two zero-padded three digit octal arguments.
const wrap8Bit = (val) => (256 + (val % 256)) % 256;
const decOct = (dec) => wrap8Bit(dec).toString(8).padStart(3, "0");
const codeGoto = (x, y) => `\\003\\${decOct(x)}\\${decOct(y)}`;

const compile = (input, helpers) => {
  const {
    _addComment,
    _addNL,
    _declareLocal,
    _setInd,
    _isIndirectVariable,
    getVariableAlias,
    _overlayClear,
    _overlayMoveTo,
    _setTextLayer,
    _loadStructuredText,
    _callNative,
    _stackPushConst,
    _stackPop,
    _overlayWait,
  } = helpers;

  const count = Math.max(2, Math.min(8, parseInt(input.items, 10) || 2));
  const options = [];
  for (let i = 0; i < count; i++) {
    options.push(input[`option${i + 1}`] || `Item ${i + 1}`);
  }

  const narrow = input.layout !== "full";
  const x = narrow ? 10 : 0;
  // one row per option, exactly as stock text -- this plugin's lines are one
  // tilemap row tall, so the stock window arithmetic is already right
  const height = count;
  const menuText = codeGoto(3, 2) + options.join("\n");

  _addComment("Alt Menu");

  const variableAlias = getVariableAlias(input.variable);
  let dest = variableAlias;
  if (_isIndirectVariable(input.variable)) {
    dest = _declareLocal("menu_result", 1, true);
  }

  _overlayClear(0, 0, 20 - x, height + 2, ".UI_COLOR_WHITE", true, true);
  if (narrow) _overlayMoveTo(10, 18, ".OVERLAY_SPEED_INSTANT");
  _overlayMoveTo(x, 18 - height - 2, ".OVERLAY_IN_SPEED");
  // the window has to be in place before drawing into it: this plugin's draw is
  // blocking, unlike the stock text path it replaces here
  _overlayWait(false, [".UI_WAIT_WINDOW"]);
  _setTextLayer(".TEXT_LAYER_WIN");
  _loadStructuredText(menuText);
  _callNative("ui_alt_display_text");

  // MENU_CANCEL_LAST = 1, MENU_CANCEL_B = 2 (ui.h)
  const menuFlags = (input.cancelOnLastOption ? 1 : 0) | (input.cancelOnB ? 2 : 0);

  // Straight to this plugin's own driver. VM_CHOICE would reach the stock
  // ui_run_menu instead, which would let ui_update() redraw the stock text
  // buffer over the options this plugin just drew.
  _stackPushConst(dest);
  _stackPushConst(menuFlags);
  _stackPushConst(count);
  _stackPushConst(1);
  _callNative("ui_alt_menu");
  _stackPop(4);

  _overlayMoveTo(x, 18, ".OVERLAY_OUT_SPEED");
  _overlayWait(false, [".UI_WAIT_WINDOW"]);
  if (narrow) _overlayMoveTo(0, 18, ".OVERLAY_SPEED_INSTANT");

  if (_isIndirectVariable(input.variable)) _setInd(variableAlias, dest);

  _addNL();
};

module.exports = {
  id,
  name,
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
