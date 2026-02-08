const l10n = require("../helpers/l10n").default;

export const id = "EVENT_OVERLAY_MOVE_TO_FAST";
export const name = l10n("EVENT_OVERLAY_MOVE_TO") + " (Extended)";
export const groups = ["EVENT_GROUP_SCREEN"];
export const subGroups = {
  EVENT_GROUP_SCREEN: "EVENT_GROUP_OVERLAY",
};

export const autoLabel = (fetchArg) => {
  return l10n(`EVENT_OVERLAY_MOVE_TO`) + " (Extended)";
};

export const fields = [
  {
  	key: `x`,
  	label: l10n("FIELD_X"),
    description: l10n("FIELD_X_DESC"),
  	type: "value",
  	width: "50%",
  	defaultValue: {
        type: "number",
        value: 0,
  	},
    unitsField: "units",
    unitsDefault: "tiles",
    unitsAllowed: ["tiles", "pixels"],
  },
  {
  	key: `y`,
  	label: l10n("FIELD_Y"),
    description: l10n("FIELD_Y_DESC"),
  	type: "value",
  	width: "50%",
  	defaultValue: {
        type: "number",
        value: 0,
  	},
    unitsField: "units",
    unitsDefault: "tiles",
    unitsAllowed: ["tiles","pixels"],
  },
  {
  	key: `sppf`,
  	label: "Subpixels per frame",
  	type: "value",
  	width: "50%",
  	defaultValue: {
        type: "number",
        value: 0,
  	},  
  },
];

const shiftLeftScriptValueConst = (value, num) => {
  return {
    type: "shl",
    valueA: value,
    valueB: {
      type: "number",
      value: num,
    },
  };
};

const scriptValueToPixels = (value, units) => {
  if (units === "pixels") {
    return value;
  }
  return shiftLeftScriptValueConst(value, 3);
};

export const compile = (input, helpers) => {
  const { _invoke, _stackPushScriptValue, _stackPushConst, _setConst, _declareLocal, _localRef  } = helpers;    
    _stackPushConst(0);
    _stackPushConst(0);    
    const valueX = scriptValueToPixels(input.x, input.units);
    const valueY = scriptValueToPixels(input.y, input.units);
    _stackPushScriptValue(valueX);
    _stackPushScriptValue(valueY);
    _stackPushScriptValue(input.sppf);
    _invoke("vm_overlay_move_to_ex", 5, ".ARG4");
    
};
