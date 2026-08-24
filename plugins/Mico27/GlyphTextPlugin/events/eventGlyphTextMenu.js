const id = "EVENT_GTX_MENU";
const name = "Glyph Text: Menu";
const groups = ["EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg) => {
  const numItems = parseInt(fetchArg("items"), 10) || 0;
  const text = Array(numItems)
    .fill()
    .map((_, i) => `"${fetchArg(`option${i + 1}`)}"`)
    .join(", ");
  return `${fetchArg("variable")} = Menu ${text}`;
};

const fields = [].concat(
  [
    {
      type: "label",
      label:
        "A menu drawn in glyphs. The stock Menu event lays its window out for 8px " +
        "rows, so with lines two rows tall its frame comes out half as tall as the text " +
        "inside it, and its cursor drifts a row further off with every option. This one " +
        "sizes the window for the taller lines, draws the options with this plugin and " +
        "steps the cursor to match. It does not need the 'Replace stock text rendering' " +
        "engine setting, and works the same either way.",
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
      description:
        "Each option is two tilemap rows tall here, so the window grows twice as fast " +
        "as it would with stock text: eight options fill the screen exactly.",
      type: "number",
      min: 2,
      max: 8,
      defaultValue: 2,
    },
    {
      key: "layout",
      label: "Layout",
      description:
        "Full width gives every option the whole screen width, which is what wide " +
        "characters need. Narrow reproduces the stock menu box on the right-hand side, " +
        "and only fits about four wide characters per option.",
      type: "select",
      options: [
        ["full", "Full width"],
        ["narrow", "Narrow (right side)"],
      ],
      defaultValue: "full",
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
const oct = (n) => "\\" + (n & 0xff).toString(8).padStart(3, "0");
const codeGoto = (x, y) => "\\003" + oct(x) + oct(y);

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

  const narrow = input.layout === "narrow";
  const x = narrow ? 10 : 0;
  // two tilemap rows per option, which is the whole point of this event
  const height = count * 2;
  const menuText = codeGoto(3, 2) + options.join("\n");

  _addComment("Glyph Text: Menu");

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
  _callNative("gtx_display_text");

  // MENU_CANCEL_LAST = 1, MENU_CANCEL_B = 2 (ui.h)
  const menuFlags = (input.cancelOnLastOption ? 1 : 0) | (input.cancelOnB ? 2 : 0);

  // Straight to the plugin's own driver. VM_CHOICE would work too, but it always
  // calls the stock ui_run_menu -- which only becomes this plugin's when the
  // Replace stock text rendering setting is on. Calling gtx_ui_run_menu
  // through this native keeps the event working either way. It lays the options
  // out itself, so there is no .MENUITEM table to emit.
  _stackPushConst(dest);
  _stackPushConst(menuFlags);
  _stackPushConst(count);
  _stackPushConst(1);
  _callNative("gtx_menu");
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
