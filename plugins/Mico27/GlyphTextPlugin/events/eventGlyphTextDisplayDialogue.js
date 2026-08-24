const id = "EVENT_GTX_DISPLAY_DIALOGUE";
const name = "Glyph Text: Display Dialogue";
const groups = ["EVENT_GROUP_DIALOGUE"];
const autoLabel = (fetchArg) => {
  return `Glyph Text: Display Dialogue`;
};
const fields = [
  {
    key: "__section",
    type: "tabs",
    defaultValue: "text",
    variant: "eventSection",
    values: {
      text: "Text",
      layout: "Layout",
      behavior: "Behavior",
    },
  },
  // Text Section
  {
    key: "text",
    type: "textarea",
    placeholder: "Text...",
    multiple: true,
    defaultValue: "",
    flexBasis: "100%",
    conditions: [
      {
        key: "__section",
        in: ["text", undefined],
      },
    ],
  },
  // Layout Section
  {
    type: "group",
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
    ],
    fields: [
      {
        key: `minHeight`,
        label: "Min Height (tiles)",
        type: "number",
        min: 1,
        max: 18,
        width: "50%",
        defaultValue: 6,
      },
      {
        key: `maxHeight`,
        label: "Max Height (tiles)",
        type: "number",
        min: 1,
        max: 18,
        width: "50%",
        defaultValue: 8,
      },
    ],
  },
  {
    type: "group",
    wrapItems: true,
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
    ],
    fields: [
      {
        key: `textX`,
        label: "Text X (tiles)",
        type: "number",
        min: -20,
        max: 20,
        defaultValue: 1,
        width: "50%",
      },
      {
        key: `textY`,
        label: "Text Y (tiles)",
        type: "number",
        min: -18,
        max: 18,
        defaultValue: 1,
        width: "50%",
      },
      {
        key: `textHeight`,
        label: "Text Scroll Height (tiles)",
        description:
          "Height of the scrolling text area in tiles. Each 16x16 text line uses 2 tiles, so 4 shows two lines at a time.",
        type: "number",
        min: 2,
        max: 18,
        step: 2,
        defaultValue: 4,
        width: "50%",
      },
      {
        key: `position`,
        label: "Position",
        type: "select",
        defaultValue: "bottom",
        width: "50%",
        options: [
          ["bottom", "Bottom"],
          ["top", "Top"],
        ],
        conditions: [
          {
            key: "__section",
            in: ["layout"],
          },
          {
            parallaxEnabled: false,
          },
        ],
      },
    ],
  },
  {
    type: "group",
    alignBottom: true,
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
    ],
    fields: [
      {
        key: `clearPrevious`,
        label: "Clear Previous Content",
        type: "checkbox",
        defaultValue: true,
        width: "50%",
      },
      {
        key: `showFrame`,
        label: "Show Frame",
        type: "checkbox",
        defaultValue: "true",
        width: "50%",
        conditions: [
          {
            key: "__section",
            in: ["layout"],
          },
          {
            key: "clearPrevious",
            in: [true, undefined],
          },
        ],
      },
    ],
  },
  // Behavior Section
  {
    type: "group",
    alignBottom: true,
    conditions: [
      {
        key: "__section",
        in: ["behavior"],
      },
    ],
    fields: [
      {
        label: "Text Open Speed",
        key: "speedIn",
        type: "overlaySpeed",
        defaultValue: -1,
        width: "50%",
        allowDefault: true,
      },
      {
        label: "Text Close Speed",
        key: "speedOut",
        type: "overlaySpeed",
        defaultValue: -1,
        width: "50%",
        allowDefault: true,
      },
    ],
  },
  {
    key: `closeWhen`,
    label: "Close When",
    type: "select",
    defaultValue: "key",
    options: [
      ["key", "Button Pressed"],
      ["text", "Text Finished"],
      ["notModal", "Never (Non-Modal)"],
    ],
    conditions: [
      {
        key: "__section",
        in: ["behavior"],
      },
    ],
  },
  {
    key: "closeButton",
    type: "togglebuttons",
    alignBottom: true,
    options: [
      ["a", "A"],
      ["b", "B"],
      ["any", "Any"],
    ],
    allowNone: false,
    defaultValue: "a",
    conditions: [
      {
        key: "__section",
        in: ["behavior"],
      },
      {
        key: "closeWhen",
        in: ["key", undefined],
      },
    ],
  },
  {
    key: "closeDelayTime",
    label: "Close Delay",
    type: "number",
    min: 0,
    max: 3600,
    step: 0.1,
    defaultValue: 0.5,
    unitsField: "closeDelayUnits",
    unitsDefault: "time",
    unitsAllowed: ["time", "frames"],
    conditions: [
      {
        key: "__section",
        in: ["behavior"],
      },
      {
        key: "closeDelayUnits",
        ne: "frames",
      },
      {
        key: "closeWhen",
        in: ["text"],
      },
    ],
  },
  {
    key: "closeDelayFrames",
    label: "Close Delay",
    type: "number",
    min: 0,
    max: 3600,
    defaultValue: 30,
    unitsField: "closeDelayUnits",
    unitsDefault: "time",
    unitsAllowed: ["time", "frames"],
    conditions: [
      {
        key: "__section",
        in: ["behavior"],
      },
      {
        key: "closeDelayUnits",
        eq: "frames",
      },
      {
        key: "closeWhen",
        in: ["text"],
      },
    ],
  },
];
const textNumLines = (input) => {
  // eslint-disable-next-line no-control-regex
  return (input.match(/(\n|\r|\x0a|\x0d|\\012|\\015)/g)?.length ?? 0) + 1;
};
// every 16x16 text line occupies two tilemap rows
const calculateTextBoxHeight = (
  textLines,
  textY,
  textHeight,
  minHeight,
  maxHeight,
  showFrame
) => {
  return Math.max(
    minHeight,
    Math.min(
      maxHeight,
      Math.min(textLines * 2, textHeight) + textY + (showFrame ? 1 : 0)
    )
  );
};
const wrap8Bit = (val) => (256 + (val % 256)) % 256;
const decOct = (dec) => wrap8Bit(dec).toString(8).padStart(3, "0");
const compile = (input, helpers) => {
  const {
    _addComment,
    _addNL,
    _loadStructuredText,
    _stackPushConst,
    _stackPop,
    _getMemUInt8,
    _setMemUInt8,
    _setConstMemUInt8,
    _overlayClear,
    _overlayMoveTo,
    _overlaySetScroll,
    _injectScrollCode,
    _overlayWait,
    _idle,
    _declareLocal,
    stackPtr,
    _setConst,
    _invoke,
    _assertStackNeutral,
    options,
  } = helpers;
  const { scene } = options;

  const inputText = input.text || " ";
  const minHeight = input.minHeight ?? 6;
  const maxHeight = input.maxHeight ?? 8;
  const position = input.position ?? "bottom";
  const showFrame = input.showFrame ?? true;
  const clearPrevious = input.clearPrevious ?? true;
  const textX = input.textX ?? 1;
  const textY = input.textY ?? 1;
  const textHeight = input.textHeight ?? 4;
  const speedIn = input.speedIn;
  const speedOut = input.speedOut;
  const closeWhen = input.closeWhen ?? "key";
  const closeButton = input.closeButton ?? "a";
  let closeDelayFrames = 0;
  if (input.closeDelayUnits === "frames") {
    closeDelayFrames =
      typeof input.closeDelayFrames === "number" ? input.closeDelayFrames : 30;
  } else {
    const seconds =
      typeof input.closeDelayTime === "number" ? input.closeDelayTime : 0.5;
    closeDelayFrames = Math.ceil(seconds * 60);
  }

  const texts = Array.isArray(inputText) ? inputText : [inputText];
  const overlayInSpeed =
    speedIn === -1
      ? ".OVERLAY_IN_SPEED"
      : speedIn === -3
      ? ".OVERLAY_SPEED_INSTANT"
      : speedIn;
  const overlayOutSpeed =
    speedOut === -1
      ? ".OVERLAY_OUT_SPEED"
      : speedOut === -3
      ? ".OVERLAY_SPEED_INSTANT"
      : speedOut;
  const initialNumLines = texts.map(textNumLines);
  const maxNumLines = Math.max.apply(null, initialNumLines);
  const textBoxHeight = calculateTextBoxHeight(
    maxNumLines,
    textY,
    textHeight,
    minHeight,
    maxHeight,
    showFrame
  );
  // scroll code kicks in per visible text line (2 tiles each)
  const visibleLines = Math.max(1, Math.floor(textHeight / 2));
  const isModal = closeWhen !== "notModal";
  const renderOnTop = position === "top" && !scene.parallax;
  const textBoxY = renderOnTop ? 0 : 18 - textBoxHeight;
  const x = decOct(Math.max(1, 1 + textX));
  const y = decOct(Math.max(1, 1 + textY));
  const textPosSequence = textX !== 0 || textY !== 0 ? `\\003\\${x}\\${y}` : "";
  _addComment("Glyph Text Dialogue");
  if (renderOnTop) {
    _stackPushConst(0);
    _getMemUInt8(".ARG0", "overlay_cut_scanline");
    _setConstMemUInt8("overlay_cut_scanline", textBoxHeight * 8 - 1);
  }
  texts.forEach((text, textIndex) => {
    if (clearPrevious) {
      _overlayClear(0, 0, 20, textBoxHeight, ".UI_COLOR_WHITE", showFrame, false);
    }
    // Animate first dialogue window of sequence on screen
    if (textIndex === 0) {
      _overlayMoveTo(0, renderOnTop ? textBoxHeight : 18, ".OVERLAY_SPEED_INSTANT");
      _overlayMoveTo(0, textBoxY, overlayInSpeed);
      _overlaySetScroll(
        textX,
        textY,
        (showFrame ? 19 : 20) - textX,
        textHeight,
        ".UI_COLOR_WHITE"
      );
      _overlayWait(false, [".UI_WAIT_WINDOW"]);
    }
    const decoratedText = `${textPosSequence}${_injectScrollCode(text, visibleLines)}`;
    _loadStructuredText(decoratedText);
    _invoke("gtx_display_dialogue", 0, ".ARG0");
    if (isModal) {
      const waitFlags = [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"];
      if (closeWhen === "key") {
        if (closeButton === "a") {
          waitFlags.push(".UI_WAIT_BTN_A");
        }
        if (closeButton === "b") {
          waitFlags.push(".UI_WAIT_BTN_B");
        }
        if (closeButton === "any") {
          waitFlags.push(".UI_WAIT_BTN_ANY");
        }
      }
      _overlayWait(false, waitFlags);
      if (closeWhen === "text" && closeDelayFrames > 0) {
        if (closeDelayFrames < 5) {
          for (let i = 0; i < closeDelayFrames; i++) {
            _idle();
          }
        } else {
          const waitArgsRef = _declareLocal("wait_args", 1, true);
          _setConst(waitArgsRef, Math.round(closeDelayFrames));
          _invoke("wait_frames", 0, waitArgsRef);
          _assertStackNeutral(stackPtr);
        }
      } else {
        _idle();
      }
    }
    // Animate final dialogue window of sequence off screen
    if (textIndex === texts.length - 1) {
      if (isModal) {
        _overlayMoveTo(0, renderOnTop ? textBoxHeight : 18, overlayOutSpeed);
        _overlayWait(false, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);
      }
    }
  });
  // Reset scanline when rendering on top (as long as it wasn't non-modal)
  if (isModal && renderOnTop) {
    _overlayMoveTo(0, 18, ".OVERLAY_SPEED_INSTANT");
    _idle();
    _setMemUInt8("overlay_cut_scanline", ".ARG0");
  }
  if (renderOnTop) {
    _stackPop(1);
  }
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
  helper: {
    type: "text",
    text: "text",
    minHeight: "minHeight",
    maxHeight: "maxHeight",
    showFrame: "showFrame",
    clearPrevious: "clearPrevious",
    textX: "textX",
    textY: "textY",
    textHeight: "textHeight",
  },
};
