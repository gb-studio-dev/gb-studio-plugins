const l10n = require("../helpers/l10n").default;

// CGB background/window tile attribute layout:
//   bits 0-2 palette, bit 3 tile VRAM bank, bit 5 X flip, bit 6 Y flip,
//   bit 7 BG priority over sprites.
// "raw" (mask 0xFF, shift 0) returns the whole byte; every other part is
// masked out and shifted down to a plain 0-based value. The engine receives
// this as one packed value: (shift << 8) | mask.
const ATTR_PART_BITS = {
  raw: [0xff, 0],
  palette: [0x07, 0],
  bank: [0x08, 3],
  flip_x: [0x20, 5],
  flip_y: [0x40, 6],
  priority: [0x80, 7],
};

const ATTR_PART_OPTIONS = [
  ["raw", "Whole attribute value"],
  ["palette", "Palette (0-7)"],
  ["bank", "Tile VRAM bank (0-1)"],
  ["flip_x", "Flip horizontally (0-1)"],
  ["flip_y", "Flip vertically (0-1)"],
  ["priority", "Priority over sprites (0-1)"],
];

const attrPartArg = (part) => {
  const bits = ATTR_PART_BITS[part] || ATTR_PART_BITS.raw;
  return (bits[1] << 8) | bits[0];
};

const attrPartLabel = (part) => {
  const option = ATTR_PART_OPTIONS.find((o) => o[0] === part);
  return option && part && part !== "raw" ? option[1] : "";
};

export const id = "EVENT_GET_BACKGROUND_TILE_ATTR";
export const name = "Get background tile attribute";
export const groups = ["EVENT_GROUP_SCREEN"];

export const autoLabel = (fetchArg, input) => {
  const part = attrPartLabel(input && input.attribute_part);
  return part
    ? `Get background tile attribute: ${part}`
    : `Get background tile attribute`;
};

export const fields = [
  {
    key: `x`,
    label: "X",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: `y`,
    label: "Y",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "attribute_part",
    label: "Attribute part",
    description:
      "Which part of the tile attribute to read. Anything other than the whole value is masked out and shifted down to a plain 0-based value.",
    type: "select",
    width: "100%",
    options: ATTR_PART_OPTIONS,
    defaultValue: "raw",
  },
  {
    key: "variable",
    label: l10n("FIELD_VARIABLE"),
    description: l10n("FIELD_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "relative_to_scroll",
    label: "Coordinates relative to camera scroll",
    description:
      "When enabled, X/Y are screen coordinates: (0,0) is the top-left tile currently visible and the camera's scroll position is added automatically. When disabled, X/Y are absolute scene tile coordinates.",
    type: "checkbox",
    width: "100%",
  },
];

export const compile = (input, helpers) => {
  const __submapFeatureEnabled = (key) => {
    const fv = helpers.engineFieldValues && helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  if (!__submapFeatureEnabled("SUBMAP_ENABLE_TILE_GET_SET")) {
    throw new Error("This event requires the \"Individual tile getters/setters\" engine setting to be enabled (Settings → Engine → Submapping Ex).");
  }

  const { _callNative, _stackPop, _addComment, _declareLocal, getVariableAlias, _stackPushConst, _isIndirectVariable, _setInd, _stackPushScriptValue } = helpers;

  const variableAlias = getVariableAlias(input.variable);
  let dest = variableAlias;
  if (_isIndirectVariable(input.variable)) {
    const index_result = _declareLocal("index_result", 1, true);
    dest = index_result;
  }

  _addComment("Get background tile attribute");

  _stackPushConst(input.relative_to_scroll ? 1 : 0);
  _stackPushConst(attrPartArg(input.attribute_part));
  _stackPushConst(dest);
  _stackPushScriptValue(input.y);
  _stackPushScriptValue(input.x);

  _callNative("vm_get_background_attribute_tile");
  _stackPop(5);

  if (_isIndirectVariable(input.variable)) {
    _setInd(variableAlias, dest);
  }

};
