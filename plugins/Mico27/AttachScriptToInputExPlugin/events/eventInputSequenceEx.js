const l10n = require("../helpers/l10n").default;
const name = "Input Sequence EX";
const id = "EVENT_INPUT_SEQUENCE_EX";
const groups = ["EVENT_GROUP_INPUT"];

const MAX_STEPS = 12;

const autoLabel = (fetchArg, input) => {
  const numSteps = Math.min(
    Math.max(parseInt(input.steps, 10) || 1, 1),
    MAX_STEPS,
  );
  const parts = [];
  for (let i = 0; i < numSteps; i++) {
    parts.push(fetchArg(`input${i}`));
  }
  return `Input Sequence: ${parts.join(", ")}`;
};

const fields = [].concat(
  [
    {
      key: "steps",
      label: "Sequence Length",
      description: `Number of inputs that make up the sequence (1 to ${MAX_STEPS}).`,
      type: "number",
      min: 1,
      max: MAX_STEPS,
      defaultValue: 3,
      width: "50%",
    },
    {
      key: "timeout",
      label: "Step Timeout",
      description:
        "Number of frames allowed to enter each input after the first one. Set to 0 for no timeout. Read again at the start of every step, so a variable used here can be changed while the sequence is running.",
      type: "value",
      min: 0,
      max: 3600,
      width: "50%",
      defaultValue: {
        type: "number",
        value: 30,
      },
    },
    {
      key: "restart",
      label: "Restart On Failure",
      description:
        "When enabled the sequence starts listening again from the first input after a failure instead of ending. The input that caused the failure is still tested against the first step, so a sequence can restart on its own first input.",
      type: "checkbox",
      defaultValue: false,
    },
    {
      type: "break",
    },
  ],
  Array(MAX_STEPS)
    .fill()
    .reduce((arr, _, i) => {
      arr.push(
        {
          key: `input${i}`,
          label: `Step ${i + 1}`,
          description: `Button that has to be pressed for step ${
            i + 1
          } of the sequence. Leaving this empty accepts any button.`,
          hideFromDocs: i >= 2,
          type: "input",
          defaultValue: ["a"],
          conditions: [
            {
              key: "steps",
              gt: i,
            },
          ],
        },
        {
          key: `combine${i}`,
          label: `Step ${i + 1} Combination`,
          description: `When enabled every button selected for step ${
            i + 1
          } must be held at the same time, and the step only matches on the frame the combination is completed.`,
          hideFromDocs: i >= 2,
          type: "checkbox",
          defaultValue: false,
          conditions: [
            {
              key: "steps",
              gt: i,
            },
          ],
        },
        {
          type: "break",
          conditions: [
            {
              key: "steps",
              gt: i,
            },
          ],
        },
      );
      return arr;
    }, []),
  [
    {
      key: "__scriptTabs",
      type: "tabs",
      defaultValue: "success",
      values: {
        success: "On Success",
        failure: "On Failure",
        step: "On Step",
      },
    },
    {
      key: "onSuccess",
      label: "On Success",
      description: "Script to run once the whole sequence has been entered.",
      type: "events",
      conditions: [
        {
          key: "__scriptTabs",
          in: [undefined, "success"],
        },
      ],
    },
    {
      key: "onFailure",
      label: "On Failure",
      description:
        "Script to run when a wrong button is pressed or a step times out.",
      type: "events",
      conditions: [
        {
          key: "__scriptTabs",
          in: [undefined, "failure"],
        },
      ],
    },
    {
      key: "onStep",
      label: "On Step",
      description:
        "Script to run after every matched input of the sequence, before the timeout of the next step is read. Use it to give feedback on each input, or to change the variable used as the step timeout while the sequence is running.",
      type: "events",
      conditions: [
        {
          key: "__scriptTabs",
          in: [undefined, "step"],
        },
      ],
    },
  ],
);

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
    _set,
    _setConst,
    _ifConst,
    _switch,
    _jump,
    _label,
    _compilePath,
    _idle,
    variableSetToScriptValue,
  } = helpers;

  const numSteps = Math.min(
    Math.max(parseInt(input.steps, 10) || 1, 1),
    MAX_STEPS,
  );
  const steps = [];
  for (let i = 0; i < numSteps; i++) {
    const selected = inputBits(input[`input${i}`]);
    // If no input set the step would never match, assume this isn't what
    // user wants and instead allow any input
    const mask = selected === 0 ? 255 : selected;
    steps.push({
      mask,
      foreignMask: ~mask & 0xff,
      // A combination needs at least one explicitly selected button, otherwise
      // "any button" would turn into "every button at once" and never match
      combine: !!input[`combine${i}`] && selected !== 0,
    });
  }

  const timeoutValue = input.timeout || { type: "number", value: 30 };
  const constTimeout =
    timeoutValue.type === "number" ? Number(timeoutValue.value) || 0 : null;
  // A timeout given as a variable can become 0 at runtime, so it always needs
  // the "no timeout" test, a constant one is resolved here
  const dynamicTimeout = constTimeout === null;
  const hasTimeout = dynamicTimeout || constTimeout > 0;
  const restart = !!input.restart;
  const onStep = input.onStep;
  // The On Step script is compiled once and jumped into from every step, a
  // switch on the step index sends the script back to the step that follows
  const hasOnStep = Array.isArray(onStep) && onStep.length > 0;

  const inputRef = _declareLocal("input", 1, true);
  const prevRef = _declareLocal("prev_input", 1, true);
  const edgeRef = _declareLocal("input_edge", 1, true);
  const timerRef = hasTimeout ? _declareLocal("step_timer", 1, true) : null;
  const stepIndexRef = hasOnStep ? _declareLocal("step_index", 1, true) : null;

  const onStepLabel = hasOnStep ? getNextLabel() : null;
  const successLabel = getNextLabel();
  const failLabel = getNextLabel();
  const endLabel = getNextLabel();
  const resetLabels = [];
  const sampleLabels = [];
  const matchedLabels = [];
  for (let i = 0; i < numSteps; i++) {
    resetLabels.push(getNextLabel());
    sampleLabels.push(getNextLabel());
    matchedLabels.push(getNextLabel());
  }

  // input = current raw joypad state
  // input_edge = buttons pressed on this very frame
  const readJoypad = () => {
    _addCmd("VM_GET_UINT8", inputRef, JOYPAD_ADDR);
    _rpn() //
      .ref(inputRef)
      .ref(prevRef)
      .operator(".B_NOT")
      .operator(".B_AND")
      .refSet(edgeRef)
      .stop();
    _set(prevRef, inputRef);
  };
  // if ((ref & bits) <op> value) goto label
  const ifMasked = (ref, op, bits, value, label) => {
    _rpn() //
      .ref(ref)
      .int16(bits)
      .operator(".B_AND")
      .stop();
    _ifConst(op, ".ARG0", value, label, 1);
  };
  // Jumps to matchLabel when the step is entered on this frame,
  // falls through otherwise
  const ifStepMatched = (step, matchLabel) => {
    if (step.combine) {
      const skipLabel = getNextLabel();
      // Every button of the combination has to be held...
      ifMasked(inputRef, ".NE", step.mask, step.mask, skipLabel);
      // ...and one of them has to have been pressed on this frame
      ifMasked(edgeRef, ".NE", step.mask, 0, matchLabel);
      _label(skipLabel);
    } else {
      ifMasked(edgeRef, ".NE", step.mask, 0, matchLabel);
    }
  };
  const tickTimer = () => {
    const skipLabel = dynamicTimeout ? getNextLabel() : null;
    if (dynamicTimeout) {
      // A timeout of 0 means the step waits forever
      _ifConst(".LTE", timerRef, 0, skipLabel, 0);
    }
    _rpn() //
      .ref(timerRef)
      .int16(1)
      .operator(".SUB")
      .refSet(timerRef)
      .stop();
    _ifConst(".LTE", timerRef, 0, failLabel, 0);
    if (dynamicTimeout) {
      _label(skipLabel);
    }
  };

  _addComment(`Input Sequence (${numSteps} steps)`);
  // Buttons already held when the event starts count as freshly pressed, so
  // that the button which launched the attached script can match step 1
  _setConst(prevRef, 0);

  for (let i = 0; i < numSteps; i++) {
    const step = steps[i];
    _addComment(`Sequence step ${i + 1}`);
    _label(resetLabels[i]);
    // The first step has no timeout, it waits for the sequence to start
    if (i > 0 && hasTimeout) {
      variableSetToScriptValue(timerRef, timeoutValue);
    }
    _label(sampleLabels[i]);
    readJoypad();
    ifStepMatched(step, matchedLabels[i]);
    // Any button outside of this step ends the sequence
    if (step.foreignMask !== 0) {
      ifMasked(edgeRef, ".NE", step.foreignMask, 0, failLabel);
    }
    if (i > 0 && hasTimeout) {
      tickTimer();
    }
    _idle();
    _jump(sampleLabels[i]);
    // Step matched
    _label(matchedLabels[i]);
    if (hasOnStep) {
      _setConst(stepIndexRef, i);
      _jump(onStepLabel);
    }
    // Without an On Step script the next step follows straight after
  }

  // On Step, shared by every step of the sequence
  if (hasOnStep) {
    _addComment("Sequence step matched");
    _label(onStepLabel);
    _compilePath(onStep);
    _switch(
      stepIndexRef,
      steps.map((_step, i) => [
        i,
        `${i + 1 < numSteps ? resetLabels[i + 1] : successLabel}$`,
      ]),
      0,
    );
    _jump(endLabel);
  }

  // Success
  _label(successLabel);
  _compilePath(input.onSuccess);
  _jump(endLabel);

  // Failure
  _label(failLabel);
  _compilePath(input.onFailure);
  if (restart) {
    // Give the input that just failed a chance to start a new sequence
    ifStepMatched(steps[0], matchedLabels[0]);
    _jump(sampleLabels[0]);
  }

  // End
  _label(endLabel);
  _markLocalUse(inputRef);
  _markLocalUse(prevRef);
  _markLocalUse(edgeRef);
  if (timerRef) {
    _markLocalUse(timerRef);
  }
  if (stepIndexRef) {
    _markLocalUse(stepIndexRef);
  }
  _addNL();
};

module.exports = {
  id,
  name,
  description:
    "Waits for a sequence of button presses and runs a script when the whole sequence has been entered in time.",
  autoLabel,
  groups,
  fields,
  compile,
  allowChildrenBeforeInitFade: true,
};
