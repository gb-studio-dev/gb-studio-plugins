const l10n = require("../helpers/l10n").default;
const name = "Attach Script To Button EX";
const id = "EVENT_SET_INPUT_SCRIPT_EX";
const groups = ["EVENT_GROUP_INPUT"];

const autoLabel = (fetchArg, input) => {
  const modes = [];
  if (input.combine) {
    modes.push("Combination");
  }
  if (input.doubleTap) {
    modes.push("Double Tap");
  }
  return (
    l10n("EVENT_SET_INPUT_SCRIPT_LABEL", {
      input: fetchArg("input"),
    }) + (modes.length > 0 ? ` (${modes.join(" + ")})` : " (Extended)")
  );
};

const fields = [
  {
    label:
      "This event must be put inside an " +
      l10n("EVENT_SET_INPUT_SCRIPT") +
      " event",
  },
  {
    key: "input",
    label: l10n("FIELD_BUTTON"),
    description: l10n("FIELD_BUTTON_DESC"),
    type: "input",
    defaultValue: ["b"],
  },
  {
    key: "combine",
    label: "Button Combination",
    description:
      "When enabled every selected button must be held at the same time, and no other button may be held. On Press only runs once the whole combination is formed, On Hold runs while it stays formed and On Release runs as soon as one of its buttons is released.",
    type: "checkbox",
    defaultValue: false,
    width: "50%",
  },
  {
    key: "doubleTap",
    label: "Double Tap",
    description:
      "When enabled the button (or combination) must be released and pressed a second time within the double tap window before On Press runs.",
    type: "checkbox",
    defaultValue: false,
    width: "50%",
  },
  {
    key: "tapWindow",
    label: "Double Tap Window",
    description:
      "Number of frames allowed between the first press and the second press. If the second press does not happen in time the event ends without running any script.",
    type: "value",
    min: 1,
    max: 3600,
    width: "50%",
    defaultValue: {
      type: "number",
      value: 15,
    },
    conditions: [
      {
        key: "doubleTap",
        eq: true,
      },
    ],
  },
  {
    key: "__scriptTabs",
    type: "tabs",
    defaultValue: "press",
    values: {
      press: l10n("FIELD_ON_PRESS"),
      hold: "On Hold",
      release: "On Release",
    },
  },
  {
    key: "onPressed",
    label: l10n("FIELD_ON_PRESS"),
    description: l10n("FIELD_ON_PRESS_DESC"),
    type: "events",
    conditions: [
      {
        key: "__scriptTabs",
        in: [undefined, "press"],
      },
    ],
  },
  {
    key: "onHold",
    label: "On Hold",
    description: "On Hold",
    type: "events",
    conditions: [
      {
        key: "__scriptTabs",
        in: [undefined, "hold"],
      },
    ],
  },
  {
    key: "onRelease",
    label: "On Release",
    description: "On Release",
    type: "events",
    conditions: [
      {
        key: "__scriptTabs",
        in: [undefined, "release"],
      },
    ],
  },
];

const KEY_BITS = {
  left: 0x02,
  right: 0x01,
  up: 0x04,
  down: 0x08,
  a: 0x10,
  b: 0x20,
  select: 0x40,
  start: 0x80,
};

// Raw bitmask of the selected buttons, 0 when nothing is selected
const inputBits = (input) => {
  let output = 0;
  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      output |= KEY_BITS[input[i]] || 0;
    }
  } else {
    output = KEY_BITS[input] || 0;
  }
  return output;
};

// Current raw joypad state, all pads combined
const JOYPAD_ADDR = "^/(_joypads + 1)/";

const compile = (input, helpers) => {
  const {
    _declareLocal,
    _markLocalUse,
    _addCmd,
    _addComment,
    _addNL,
    getNextLabel,
    _rpn,
    _ifConst,
    _jump,
    _label,
    _compilePath,
    _idle,
    variableSetToScriptValue,
  } = helpers;

  const selected = inputBits(input.input);
  // If no input set game would hang as could not continue on, assume this
  // isn't what user wants and instead allow any input
  const mask = selected === 0 ? 255 : selected;
  const foreignMask = ~mask & 0xff;
  // A combination needs at least one explicitly selected button, otherwise
  // "any button" would turn into "every button at once" and never fire
  const combine = !!input.combine && selected !== 0;
  const doubleTap = !!input.doubleTap;

  const inputRef = _declareLocal("input", 1, true);
  const endLabel = getNextLabel();
  const holdLoopLabel = getNextLabel();
  const releaseLabel = getNextLabel();

  // input = current raw joypad state
  const readJoypad = () => {
    _addCmd("VM_GET_UINT8", inputRef, JOYPAD_ADDR);
  };
  // if ((input & bits) <op> value) goto label
  const ifMasked = (op, bits, value, label) => {
    _rpn() //
      .ref(inputRef)
      .int16(bits)
      .operator(".B_AND")
      .stop();
    _ifConst(op, ".ARG0", value, label, 1);
  };
  const ifNoneHeld = (label) => ifMasked(".EQ", mask, 0, label);
  const ifAnyHeld = (label) => ifMasked(".NE", mask, 0, label);
  // A button outside of the combination is held
  const ifForeignHeld = (label) => {
    if (foreignMask !== 0) {
      ifMasked(".NE", foreignMask, 0, label);
    }
  };
  // Combination complete: every selected button held and nothing else
  const ifCombinationFormed = (label) => {
    _ifConst(".EQ", inputRef, mask, label, 0);
  };
  // Phase entry condition, used for the initial press and for the second tap
  const ifPressed = (label) => {
    if (combine) {
      ifCombinationFormed(label);
    } else {
      ifAnyHeld(label);
    }
  };

  _addComment(
    combine
      ? "Attach Script To Button EX (Combination)"
      : "Attach Script To Button EX",
  );

  readJoypad();

  if (combine) {
    // Wait for the remaining buttons of the combination to be pressed.
    // Give up as soon as the player lets go of the combination entirely or
    // presses a button that is not part of it.
    const formLabel = getNextLabel();
    const formedLabel = getNextLabel();
    _label(formLabel);
    ifNoneHeld(endLabel);
    ifForeignHeld(endLabel);
    ifCombinationFormed(formedLabel);
    _idle();
    readJoypad();
    _jump(formLabel);
    _label(formedLabel);
  } else {
    ifNoneHeld(endLabel);
  }

  if (doubleTap) {
    // First tap confirmed, wait for a full release then a second press,
    // both within the same window
    const tapTimerRef = _declareLocal("tap_timer", 1, true);
    const waitReleaseLabel = getNextLabel();
    const waitSecondLabel = getNextLabel();
    const secondPressLabel = getNextLabel();

    _addComment("Double Tap Window");
    variableSetToScriptValue(
      tapTimerRef,
      input.tapWindow || { type: "number", value: 15 },
    );

    const tickTimer = () => {
      _rpn() //
        .ref(tapTimerRef)
        .int16(1)
        .operator(".SUB")
        .refSet(tapTimerRef)
        .stop();
      _ifConst(".LTE", tapTimerRef, 0, endLabel, 0);
    };

    // Wait for the button (or every button of the combination) to be released
    _label(waitReleaseLabel);
    _idle();
    readJoypad();
    ifNoneHeld(waitSecondLabel);
    if (combine) {
      ifForeignHeld(endLabel);
    }
    tickTimer();
    _jump(waitReleaseLabel);

    // Wait for the second press
    _label(waitSecondLabel);
    _idle();
    readJoypad();
    ifPressed(secondPressLabel);
    if (combine) {
      ifForeignHeld(endLabel);
    }
    tickTimer();
    _jump(waitSecondLabel);

    _label(secondPressLabel);
    _markLocalUse(tapTimerRef);
  }

  // Press
  _compilePath(input.onPressed);
  _idle();

  // Hold
  _label(holdLoopLabel);
  readJoypad();
  if (combine) {
    // Release as soon as one of the buttons of the combination is released
    ifMasked(".NE", mask, mask, releaseLabel);
  } else {
    ifNoneHeld(releaseLabel);
  }
  _compilePath(input.onHold);
  _idle();
  _jump(holdLoopLabel);

  // Release
  _label(releaseLabel);
  _compilePath(input.onRelease);

  // End
  _label(endLabel);
  _markLocalUse(inputRef);
  _addNL();
};

module.exports = {
  id,
  name,
  description: l10n("EVENT_SET_INPUT_SCRIPT_DESC") + " (Extended)",
  autoLabel,
  groups,
  fields,
  compile,
  editableSymbol: true,
  allowChildrenBeforeInitFade: true,
};
