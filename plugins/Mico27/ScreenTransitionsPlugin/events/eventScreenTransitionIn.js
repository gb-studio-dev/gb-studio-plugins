export const id = "PT_EVENT_SCREEN_TRANSITION_IN";
export const name = "Screen Transition In (reveal scene)";
export const groups = ["EVENT_GROUP_SCREEN", "Screen Transitions"];

export const autoLabel = (fetchArg, input) => {
  if (input.source === "scene") {
    const layer = input.layer === "background" ? "bkg" : "overlay";
    return `Screen Transition In: ${input.effect || "wipe_right"} (${layer} from ${fetchArg("sceneId")})`;
  }
  return `Screen Transition In: ${input.effect || "wipe_right"} (this scene)`;
};

// One canonical effect per reverse-pair; use Direction = Reversed for the
// complement (e.g. Wipe reversed = left/up, Curtain reversed = close, Iris
// reversed = close, Diagonal reversed = from bottom-right, Mask reversed = shrink).
const EFFECTS = [
  ["wipe_right", "Wipe (horizontal)"],
  ["wipe_down", "Wipe (vertical)"],
  ["open_h", "Curtain (horizontal)"],
  ["open_v", "Curtain (vertical)"],
  ["iris_out", "Iris (box)"],
  ["diag_tl", "Diagonal (vertical)"],
  ["diag_h", "Diagonal (horizontal)"],
  ["checker", "Checkerboard"],
  ["snake_h", "Snake (horizontal)"],
  ["snake_v", "Snake (vertical)"],
  ["spiral", "Spiral (snake)"],
  ["blinds_h", "Blinds (horizontal bars)"],
  ["blinds_v", "Blinds (vertical bars)"],
  ["four_sq", "4-Square (chunky blocks)"],
  ["diamond_out", "Diamond"],
  ["clock", "Clock (radial sweep)"],
  ["noise", "Random Noise"],
  ["fan4", "4-Blade Fan"],
  ["x", "X (cross)"],
  ["mask_grow", "Mask (scene as mask)"],
  ["shrink", "Shrink (quadrants inward)"],
  ["split", "Split (quadrants outward)"],
];
// Ids are stable (gaps left where reverse-pair complements were removed).
const EFFECT_ID = {
  wipe_right: 0, wipe_down: 2,
  open_h: 5, open_v: 7,
  iris_out: 9, diag_tl: 10, diag_h: 11, checker: 12,
  snake_h: 13, snake_v: 14, spiral: 26,
  blinds_h: 15, blinds_v: 16, four_sq: 17,
  diamond_out: 19,
  clock: 20, noise: 21, fan4: 22, x: 23, mask_grow: 24,
  shrink: 27, split: 28,
};

const num = (value) => ({ type: "number", value });

// Effects that support an angular start offset / a custom centre point.
const ANGLE_FX = ["clock", "fan4", "diag_tl", "diag_h"];
const CENTER_FX = ["iris_out", "diamond_out", "clock", "fan4", "mask_grow", "shrink", "split"];
// Quadrant-shift effects (Shrink / Split): the centre is the point the
// region is split into four quadrants at, and the fill tile paints the rim the
// sliding quadrants uncover.
const QUAD_FX = ["shrink", "split"];

// Each effect maps to the engine setting (Settings > Engine > Screen Transitions)
// that must be enabled for it to be compiled into the ROM.
const EFFECT_SETTING = {
  wipe_right: "TRANSITION_WIPE", wipe_down: "TRANSITION_WIPE",
  open_h: "TRANSITION_CURTAIN", open_v: "TRANSITION_CURTAIN",
  iris_out: "TRANSITION_IRIS",
  diag_tl: "TRANSITION_DIAGONAL", diag_h: "TRANSITION_DIAGONAL",
  checker: "TRANSITION_CHECKER",
  snake_h: "TRANSITION_SNAKE", snake_v: "TRANSITION_SNAKE",
  spiral: "TRANSITION_SPIRAL",
  blinds_h: "TRANSITION_BLINDS", blinds_v: "TRANSITION_BLINDS",
  four_sq: "TRANSITION_FOURSQ",
  diamond_out: "TRANSITION_DIAMOND",
  clock: "TRANSITION_CLOCK",
  noise: "TRANSITION_NOISE",
  fan4: "TRANSITION_FAN",
  x: "TRANSITION_X",
  mask_grow: "TRANSITION_MASK",
  shrink: "TRANSITION_SHRINK",
  split: "TRANSITION_SPLIT",
};

export const fields = [
  {
    key: "effect",
    label: "Transition",
    type: "select",
    options: EFFECTS,
    defaultValue: "wipe_right",
  },
  {
    type: "group",
    fields: [
      {
        key: "source",
        label: "Reveal",
        type: "select",
        width: "50%",
        options: [
          ["current", "This scene (reload)"],
          ["scene", "Another scene (copy)"],
        ],
        defaultValue: "current",
      },
      {
        key: "layer",
        label: "Layer",
        type: "select",
        width: "50%",
        options: [
          ["overlay", "Overlay (window)"],
          ["background", "Background"],
        ],
        defaultValue: "overlay",
        conditions: [{ key: "source", eq: "scene" }],
      },
    ],
  },
  {
    type: "label",
    label:
      "Overlay: draws the source scene onto the window and leaves it open, so a following Change Scene (fade None) is seamless — dismiss it with \"Hide Overlay\" on the target scene.",
    conditions: [
      { key: "source", eq: "scene" },
      { key: "layer", eq: "overlay" },
    ],
  },
  {
    type: "label",
    label:
      "Background: morphs the current background into the source scene's tiles in place. Follow with Change Scene (fade None) to that scene.",
    conditions: [
      { key: "source", eq: "scene" },
      { key: "layer", eq: "background" },
    ],
  },
  {
    type: "label",
    label: "The two scenes must share a background tileset.",
    conditions: [{ key: "source", eq: "scene" }],
  },
  {
    key: "sceneId",
    label: "Source scene",
    type: "scene",
    defaultValue: "LAST_SCENE",
    conditions: [{ key: "source", eq: "scene" }],
  },
  {
    type: "group",
    fields: [
      {
        key: "srcX",
        label: "Source X (tiles)",
        description:
          "Tile offset in the source scene to pull from — set to the scroll position the target scene will be entered at, so the switch lines up.",
        type: "value",
        width: "50%",
        min: 0,
        max: 255,
        defaultValue: num(0),
      },
      {
        key: "srcY",
        label: "Source Y (tiles)",
        type: "value",
        width: "50%",
        min: 0,
        max: 255,
        defaultValue: num(0),
      },
    ],
    conditions: [{ key: "source", eq: "scene" }],
  },
  {
    type: "group",
    fields: [
      {
        key: "speed",
        label: "Steps per frame",
        type: "value",
        width: "50%",
        min: 1,
        max: 32,
        defaultValue: num(1),
      },
      {
        key: "hold",
        label: "Frames per step",
        type: "value",
        width: "50%",
        min: 1,
        max: 60,
        defaultValue: num(1),
      },
    ],
  },
  {
    key: "coverFirst",
    label: "Cover + fade in first (scene entry)",
    description:
      "Fills the screen, then does an instant palette fade-in, before revealing. Use as the first event of a scene entered with Change Scene fade = None and On Init auto-fade = Manual.",
    type: "checkbox",
    defaultValue: false,
    conditions: [{ key: "source", eq: "current" }],
  },
  {
    key: "coverTile",
    label: "Cover tile id",
    type: "select",
    options: [
      [202, "Black"],
      [201, "White"],
    ],
    defaultValue: 202,
    conditions: [
      { key: "source", eq: "current" },
      { key: "coverFirst", eq: true },
    ],
  },
  {
    type: "group",
    fields: [
      {
        key: "minFrame",
        label: "Start step",
        description: "Begin the effect at this step instead of 0 (skips the start).",
        type: "value",
        width: "50%",
        min: 0,
        max: 1023,
        defaultValue: num(0),
      },
      {
        key: "maxFrame",
        label: "End step (0 = full)",
        description:
          "Stop at this step, clamped to the effect's own length. 0 = run to the end.",
        type: "value",
        width: "50%",
        min: 0,
        max: 1023,
        defaultValue: num(0),
      },
    ],
  },
  {
    key: "direction",
    label: "Direction",
    description:
      "Plays the effect in reverse — flips a wipe to the opposite side, an iris close to open, a clock/fan/spiral to counter-clockwise, and Shrink/Split from covering the screen to revealing it.",
    type: "select",
    options: [
      ["forward", "Normal / Clockwise"],
      ["reverse", "Reversed / Counter-clockwise"],
    ],
    defaultValue: "forward",
  },
  {
    key: "angle",
    label: "Initial angle (0-255)",
    description:
      "Rotates the sweep direction. Clock/fan: 0 = 12 o'clock. Diagonal: 0 = down-right, 128 = vertical, 255 = down-left.",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: num(0),
    conditions: [{ key: "effect", in: ANGLE_FX }],
  },
  {
    key: "customCenter",
    label: "Custom centre point",
    description:
      "Move the pivot/centre of the effect off the region centre. For Shrink / Split this is where the region is cut into its four quadrants.",
    type: "checkbox",
    defaultValue: false,
    conditions: [{ key: "effect", in: CENTER_FX }],
  },
  {
    key: "centerAbsolute",
    label: "Centre is absolute (world) position",
    description:
      "Treat Centre X/Y as world/map tiles and subtract the current scroll at runtime, instead of screen-relative tiles. Background layer only (the overlay isn't scrolled).",
    type: "checkbox",
    defaultValue: false,
    conditions: [
      { key: "customCenter", eq: true },
      { key: "effect", in: CENTER_FX },
      // background layer only: this-scene reveal, or another-scene on the background
      { or: [[{ key: "source", eq: "current" }], [{ key: "layer", eq: "background" }]] },
    ],
  },
  {
    type: "group",
    fields: [
      { key: "centerX", label: "Centre X", type: "value", width: "50%", min: 0, max: 255, defaultValue: num(10) },
      { key: "centerY", label: "Centre Y", type: "value", width: "50%", min: 0, max: 255, defaultValue: num(9) },
    ],
    conditions: [
      { key: "customCenter", eq: true },
      { key: "effect", in: CENTER_FX },
    ],
  },
  {
    type: "group",
    fields: [
      {
        key: "rimFill",
        label: "Rim tile",
        description: "Tile drawn where a quadrant has slid away from.",
        type: "select",
        width: "50%",
        options: [
          ["black", "Black"],
          ["white", "White"],
          ["custom", "Custom tile id"],
        ],
        defaultValue: "black",
      },
      {
        key: "rimPalette",
        label: "CGB rim palette (0-7)",
        type: "value",
        width: "50%",
        min: 0,
        max: 7,
        defaultValue: num(7),
      },
    ],
    conditions: [{ key: "effect", in: QUAD_FX }],
  },
  {
    key: "rimTile",
    label: "Rim tile id",
    type: "value",
    min: 0,
    max: 255,
    defaultValue: num(0),
    conditions: [
      { key: "effect", in: QUAD_FX },
      { key: "rimFill", eq: "custom" },
    ],
  },
  {
    type: "label",
    label:
      "Shrink / Split cut the region into four quadrants at the centre point, then re-render each quadrant one tile toward the centre (Shrink) or away from it (Split) every step, covering the strip it vacates with the fill tile. Because they re-render moving content they are much heavier than the other effects, so start around 4-6 in Frames per step. Reversed plays them backwards, so Shrink reversed opens out from the centre and Split reversed closes in from the rim.",
    conditions: [{ key: "effect", in: QUAD_FX }],
  },
  {
    key: "hideSprites",
    label: "Hide sprites during transition",
    description:
      "Sprites draw above the background and overlay, so hide them while the transition covers the screen.",
    type: "checkbox",
    defaultValue: true,
  },
  {
    key: "showSprites",
    label: "Show sprites after transition",
    type: "checkbox",
    defaultValue: true,
    conditions: [{ key: "source", eq: "current" }],
  },
  {
    type: "label",
    label: "Region (tiles, screen-relative)",
    isHeading: true,
  },
  {
    type: "group",
    fields: [
      { key: "x", label: "X", type: "value", width: "50%", min: 0, max: 31, defaultValue: num(0) },
      { key: "y", label: "Y", type: "value", width: "50%", min: 0, max: 31, defaultValue: num(0) },
    ],
  },
  {
    type: "group",
    fields: [
      { key: "width", label: "Width", type: "value", width: "50%", min: 1, max: 32, defaultValue: num(20) },
      { key: "height", label: "Height", type: "value", width: "50%", min: 1, max: 32, defaultValue: num(18) },
    ],
  },
  {
    type: "label",
    label:
      "Mask: the mask scene's tile values (0-255) set the reveal order — lower tiles first (Reversed = highest first), so a drawn gradient becomes the transition shape (separate from the reveal content above). With a Custom centre the mask's centre tile aligns to that screen point; size the mask scene large enough to cover the screen at the chosen offset.",
    conditions: [{ key: "effect", in: ["mask_grow"] }],
  },
  {
    key: "maskSceneId",
    label: "Mask scene (screen-sized; larger for a custom centre)",
    type: "scene",
    defaultValue: "LAST_SCENE",
    conditions: [{ key: "effect", in: ["mask_grow"] }],
  },
];

export const compile = (input, helpers) => {
  const {
    options, engineFields, engineFieldValues,
    _stackPushConst, _setConstMemInt16, _setMemInt8ToVariable, _setMemInt8, _setMemInt16,
    _stackPushScriptValue, _stackPop,
    _invoke, _callNative, _spritesHide, _spritesShow, _setConstMemInt8, _fadeIn,
    _addComment, _idle,
  } = helpers;

  const V = (v, d) =>
    v === undefined || v === null ? num(d) : typeof v === "number" ? num(v) : v;
  const bAND = (a, b) => ({ type: "bAND", valueA: a, valueB: b });
  const bOR = (a, b) => ({ type: "bOR", valueA: a, valueB: b });
  const sub = (a, b) => ({ type: "sub", valueA: a, valueB: b });
  const shr = (a, b) => ({ type: "shr", valueA: a, valueB: b });
  const vmin = (a, b) => ({ type: "min", valueA: a, valueB: b });
  const vmax = (a, b) => ({ type: "max", valueA: a, valueB: b });

  // Write a script value (const / variable / expression) into an engine byte
  // global directly (the internal state globals are not engine.json fields).
  const setField = (cvar, value) => {
    if (value && value.type === "number") {
      _setConstMemInt8(cvar, value.value);
    } else if (value && value.type === "variable") {
      _setMemInt8ToVariable(cvar, value.value);
    } else {
      // expression: push it (no temp var) and copy the result into the global
      _stackPushScriptValue(value);
      _setMemInt8(cvar, ".ARG0");
      _stackPop(1);
    }
  };

  // 16-bit variant for the UWORD globals (min/max frame can exceed 255).
  const setField16 = (cvar, value) => {
    if (value && value.type === "number") {
      _setConstMemInt16(cvar, value.value);
    } else {
      _stackPushScriptValue(value);
      _setMemInt16(cvar, ".ARG0");
      _stackPop(1);
    }
  };

  // Set a centre component as one pushed expression (any value type, no temp
  // var), clamped into the region [0, dim-1], then copied to the global. For an
  // "absolute" (world) centre, subtract the current scroll (axis = xscroll /
  // yscroll) first; the signed RPN means an off-screen pivot clamps to 0, not the
  // far edge. `dim` is the region width/height value (matches tr_w / tr_h).
  const setCenter = (cvar, value, axis, dim, absolute) => {
    let expr = value;
    if (absolute) {
      const scroll = { type: "property", target: "camera", property: axis };
      expr = sub(value, shr(scroll, num(3))); // centre - (scroll >> 3)
    }
    expr = vmax(num(0), vmin(expr, sub(dim, num(1)))); // clamp to [0, dim-1]
    _stackPushScriptValue(expr);
    _setMemInt8(cvar, ".ARG0"); // copy the result off the stack into the global
    _stackPop(1);
  };

  // Compile-time guard: the effect's engine setting must be enabled.
  const isEnabled = (key) => {
    const field = engineFields && engineFields[key];
    if (!field) return true;
    const ev = (engineFieldValues || []).find((v) => v.id === key);
    const val = ev && ev.value !== undefined ? ev.value : field.defaultValue;
    return !!val;
  };
  const settingKey = EFFECT_SETTING[input.effect];
  if (settingKey && !isEnabled(settingKey)) {
    throw new Error(
      `Screen Transition In: the "${input.effect}" transition is disabled in Settings > Engine > Screen Transitions. Enable it (or pick another effect) to use it.`,
    );
  }

  const effect = EFFECT_ID[input.effect] ?? 0;
  const isScene = input.source === "scene";
  const layer = isScene ? (input.layer === "background" ? 0 : 1) : 0;
  const mode = isScene ? 2 : 1; // 2 copy, 1 refresh

  // Resolve scene symbol for copy mode.
  let sceneSym = 0;
  let sceneBank = 0;
  if (mode === 2) {
    const scenes = (options && options.scenes) || [];
    const scene = scenes.find((s) => s.id === input.sceneId);
    if (!scene) {
      throw new Error(
        "Screen Transition In: select a valid Source scene to copy tiles from.",
      );
    }
    sceneSym = `_${scene.symbol}`;
    sceneBank = `___bank_${scene.symbol}`;
  }

  // Mask grow/shrink: resolve the mask scene (separate from the copy source).
  const isMask = input.effect === "mask_grow";
  let maskSym = 0;
  let maskBank = 0;
  if (isMask) {
    const scenes = (options && options.scenes) || [];
    const scene = scenes.find((s) => s.id === input.maskSceneId);
    if (!scene) {
      throw new Error(
        "Screen Transition In: Mask Grow/Shrink needs a valid Mask scene.",
      );
    }
    maskSym = `_${scene.symbol}`;
    maskBank = `___bank_${scene.symbol}`;
  }

  const coverFirst = !isScene && !!input.coverFirst;
  const coverTile = input.coverTile === 201 ? 201 : 202;

  _addComment(
    `Screen Transition In: ${input.effect} (${
      isScene
        ? (layer ? "overlay" : "background") + " from scene " + input.sceneId
        : "this scene"
    })`,
  );

  if (input.hideSprites !== false) _spritesHide();

  // Cover the screen and instantly restore the palette before revealing, so
  // the transition survives a scene change (screen was faded out).
  if (coverFirst) {
    _idle();
    _stackPushConst(0x80 | 7); // cover attr (CGB priority + palette 7)
    _stackPushConst(coverTile);
    _callNative("vm_screen_cover");
    _stackPop(2);
    _setConstMemInt8("fade_frames_per_step", 0);
    _fadeIn(true);
  }

  // Set the transition state globals directly (control words as consts, value
  // fields via setField so they still accept variables/expressions).
  _setConstMemInt8("tr_effect", effect);
  _setConstMemInt8("tr_layer", layer);
  _setConstMemInt8("tr_mode", mode);
  setField("tr_x0", V(input.x, 0));
  setField("tr_y0", V(input.y, 0));
  setField("tr_w", V(input.width, 20));
  setField("tr_h", V(input.height, 18));
  setField("tr_speed", V(input.speed, 1));
  setField("tr_hold", V(input.hold, 1));
  setField16("tr_min", V(input.minFrame, 0)); // start frame
  setField16("tr_max", V(input.maxFrame, 0)); // end frame (0 = full)
  if (QUAD_FX.includes(input.effect)) {
    // Shrink / Split paint the rim the quadrants uncover, so they need a fill
    // tile even in the reveal direction (the other In effects never fill).
    const rim =
      input.rimFill === "white" ? num(201)
      : input.rimFill === "custom" ? V(input.rimTile, 0)
      : num(202);
    setField("tr_fill_tile", rim);
    // fill attr = CGB priority (0x80) | (palette & 7)
    setField("tr_fill_attr", bOR(num(0x80), bAND(V(input.rimPalette, 7), num(7))));
  }
  // direction (reverse step order), angle offset, and centre point
  _setConstMemInt8("tr_reverse", input.direction === "reverse" ? 1 : 0);
  if (ANGLE_FX.includes(input.effect)) {
    setField("tr_angle", V(input.angle, 0));
  }
  if (CENTER_FX.includes(input.effect) && input.customCenter) {
    // absolute (scroll-subtracted) centre only makes sense on the scrolled background
    const absCentre = !!input.centerAbsolute && layer === 0;
    setCenter("tr_cx", V(input.centerX, 10), "xscroll", V(input.width, 20), absCentre);
    setCenter("tr_cy", V(input.centerY, 9), "yscroll", V(input.height, 18), absCentre);
  } else {
    _setConstMemInt8("tr_cx", 0xff); // auto centre
    _setConstMemInt8("tr_cy", 0xff);
  }
  if (isScene) {
    setField("tr_src_x", V(input.srcX, 0));
    setField("tr_src_y", V(input.srcY, 0));
    _setConstMemInt16("tr_scene_ptr", sceneSym);
    _setConstMemInt8("tr_scene_bank", sceneBank);
  }
  if (isMask) {
    _setConstMemInt16("tr_maskscene_ptr", maskSym);
    _setConstMemInt8("tr_maskscene_bank", maskBank);
  }
  _invoke("screen_transition_update", 0, 0);

  if (coverFirst) {
    _setConstMemInt8("fade_frames_per_step", 3); // restore a sane fade speed
  }
  if (!isScene && input.showSprites !== false) _spritesShow();
};

// Run after the scene's initial fade-in (named export so the ESM->CJS loader keeps it).
export const waitUntilAfterInitFade = true;
