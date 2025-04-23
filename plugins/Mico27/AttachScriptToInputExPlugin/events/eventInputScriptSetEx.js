const l10n = require("../helpers/l10n").default;
const name = "Attach Script To Button EX";
const id = "EVENT_SET_INPUT_SCRIPT_EX";
const groups = ["EVENT_GROUP_INPUT"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_SET_INPUT_SCRIPT_LABEL", {
    input: fetchArg("input"),
  }) + " (Extended)";
};

const fields = [
	{
		label: "This event must be put inside an " + l10n("EVENT_SET_INPUT_SCRIPT") + " event",
	},
  {
    key: "input",
    label: l10n("FIELD_BUTTON"),
    description: l10n("FIELD_BUTTON_DESC"),
    type: "input",
    defaultValue: ["b"],
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
    description:  "On Release",
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

const inputDec = (input) => {
  let output = 0;
  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      output |= KEY_BITS[input[i]];
    }
  } else {
    output = KEY_BITS[input];
  }
  if (output === 0) {
    // If no input set game would hang
    // as could not continue on, assume
    // this isn't what user wants and
    // instead allow any input
    output = 255;
  }
  return output;
};

const compile = (input, helpers) => {
    const { _declareLocal, getNextLabel, _getMemInt8, _rpn, _ifConst, _addNL, _jump, _label, _compilePath, _idle } = helpers;
    const inputRef = _declareLocal("input", 1, true);
    const pressLabel = getNextLabel();
	const loopLabel = getNextLabel();
	const holdLabel = getNextLabel();
	const releaseLabel = getNextLabel();
	const endLabel = getNextLabel();
    _getMemInt8(inputRef, "^/(_joypads + 1)/");
    _rpn() //
      .ref(inputRef)
      .int8(inputDec(input.input))
      .operator(".B_AND")
      .stop();
    _ifConst(".NE", ".ARG0", 0, pressLabel, 1);
	_jump(endLabel);
	//Press
    _label(pressLabel);
    _compilePath(input.onPressed);
	_idle();
	//Hold
	_label(loopLabel);
	_getMemInt8(inputRef, "^/(_joypads + 1)/");
    _rpn() //
      .ref(inputRef)
      .int8(inputDec(input.input))
      .operator(".B_AND")
      .stop();
    _ifConst(".NE", ".ARG0", 0, holdLabel, 1);
	_jump(releaseLabel);
	_label(holdLabel);
    _compilePath(input.onHold);
	_idle();
	_jump(loopLabel);
	//Release
	_label(releaseLabel);
    _compilePath(input.onRelease);	
	//End
    _label(endLabel);
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
