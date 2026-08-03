const l10n = require("../helpers/l10n").default;

export const id = "EVENT_SPAWN_POOL_ACTOR";
export const name = "Spawn Actor From Pool";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Spawn Actor From Pool : ${fetchArg("x")}, ${fetchArg("y")}`;
};

export const fields = [
  {
    key: "poolActorId",
    label: "First pool actor",
    description:
      "First actor of the spawn pool. The pool is this actor plus the next (pool size - 1) actors in the scene's actor order. Deactivate them on init and don't mark them pinned or persistent.",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "poolCount",
    label: "Pool size",
    description: "Number of pool actors (max simultaneously spawned)",
    type: "value",
    min: 1,
    max: 20,
    defaultValue: {
      type: "number",
      value: 3,
    },
  },
  {
      key: "x",
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
      key: "y",
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
    key: "variable",
    label: l10n("FIELD_VARIABLE"),
    description:
      "Receives the spawned actor's index (255 = no free actor in the pool). Use it to configure the spawned actor (e.g. with actor-by-index events).",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
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
  const {
    _callNative,
    _stackPush,
    _stackPushConst,
    _stackPop,
    _addComment,
    _declareLocal,
    _stackPushScriptValue,
    setActorId,
    getVariableAlias,
    _isIndirectVariable,
    _setInd,
  } = helpers;

  const variableAlias = getVariableAlias(input.variable);
  let dest = variableAlias;
  if (_isIndirectVariable(input.variable)) {
    const spawn_result = _declareLocal("spawn_result", 1, true);
    dest = spawn_result;
  }
  
  const tmpPoolStart = _declareLocal("tmp_pool_start", 1, true);
  setActorId(tmpPoolStart, input.poolActorId);
  
  _addComment("Spawn Actor From Pool");

  _stackPushConst(dest);  // FN_ARG4
  _stackPushScriptValue(scriptValueToPixels(input.y, input.units));                // FN_ARG3
  _stackPushScriptValue(scriptValueToPixels(input.x, input.units));                // FN_ARG2
  _stackPushScriptValue(input.poolCount);        // FN_ARG1
  _stackPush(tmpPoolStart);        // FN_ARG0

  _callNative("vm_spawn_pool_actor");
  _stackPop(5);
  
  if (_isIndirectVariable(input.variable)) {
    _setInd(variableAlias, dest);
  }
};
