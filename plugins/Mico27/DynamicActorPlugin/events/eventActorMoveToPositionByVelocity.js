const l10n = require("../helpers/l10n").default;

export const id = "EVENT_ACTOR_MOVE_TO_POSITION_BY_VELOCITY";
export const name = "Actor Move To Position By Velocity";
export const groups = ["EVENT_GROUP_ACTOR"];

const ACTOR_ATTR_H_FIRST = 0x01;
const ACTOR_ATTR_DIAGONAL = 0x04;
const ACTOR_ATTR_RELATIVE_SNAP_PX = 0x08;
const ACTOR_ATTR_RELATIVE_SNAP_TILE = 0x10;

export const autoLabel = (fetchArg, input) => {
  const unitPostfix =
    input.units === "pixels" ? l10n("FIELD_PIXELS_SHORT") : "";
  return l10n("EVENT_ACTOR_MOVE_TO_LABEL", {
    actor: fetchArg("actorId"),
    x: `${fetchArg("targetX")}${unitPostfix}`,
    y: `${fetchArg("targetY")}${unitPostfix}`,
  });
};

export const fields = [
  {
    key: "__section",
    type: "tabs",
    defaultValue: "movement",
    variant: "eventSection",
    values: {
      movement: l10n("FIELD_MOVEMENT"),
      options: l10n("FIELD_OPTIONS"),
      presets: l10n("FIELD_PRESETS"),
    },
  },
  {
    type: "group",
    wrapItems: true,
    flexBasis: "100%",
    fields: [
      {
        key: "actorId",
        label: l10n("ACTOR"),
        description: "Actor to move",
        type: "actor",
        defaultValue: "$self$",
        flexBasis: 0,
        minWidth: 150,
      },
      {
        type: "group",
        wrapItems: true,
        fields: [
          {
            key: "targetX",
            label: "Target X",
            description: "Destination X position",
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
            key: "targetY",
            label: "Target Y",
            description: "Destination Y position",
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
        ],
      },
    ],
    conditions: [
      {
        key: "__section",
        in: ["movement", undefined],
      },
    ],
  },
  {
    type: "group",
    wrapItems: true,
    flexBasis: "100%",
    fields: [
      {
        key: "cancelOnCollision",
        width: "50%",
        flexBasis: 0,
        minWidth: 150,
        label: "Cancel on collision",
        description:
          "If enabled, cancel movement when the actor remains in the same position on the next pass despite having non-zero velocity.",
        type: "checkbox",
        defaultValue: true,
      },
      {
        type: "group",
        flexBasis: 0,
        minWidth: 150,
        alignBottom: true,
        fields: [
          {
            key: "relative",
            label: "Relative",
            description:
              "If enabled, target is applied as an offset from current position and snapped using units.",
            type: "checkbox",
            defaultValue: false,
          },
          {
            key: "directToPoint",
            label: "Direct to point",
            description:
              "Move using angle-based steering directly toward the destination for smoother non-45-degree diagonals.",
            type: "checkbox",
            defaultValue: false,
          },
          {
            key: "moveType",
            label: "Move type",
            description:
              "Choose axis order or diagonal movement, same semantics as vm_actor_move_to.",
            hideLabel: true,
            type: "moveType",
            defaultValue: "horizontal",
            flexBasis: 35,
            flexGrow: 0,
            alignBottom: true,
          },
        ],
      },
    ],
    conditions: [
      {
        key: "__section",
        in: ["options"],
      },
    ],
  },
  {
    type: "presets",
    conditions: [
      {
        key: "__section",
        in: ["presets"],
      },
    ],
  },
];

export const userPresetsGroups = [
  {
    id: "movement",
    label: l10n("FIELD_MOVEMENT"),
    fields: ["targetX", "targetY"],
  },
  {
    id: "units",
    label: l10n("FIELD_UNITS"),
    fields: ["units"],
  },
  {
    id: "options",
    label: l10n("FIELD_OPTIONS"),
    fields: ["cancelOnCollision", "relative", "directToPoint", "moveType"],
    selected: true,
  },
];

export const userPresetsIgnore = ["__section", "actorId"];

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
  const __engineFieldOn = (key) => {
    const fv =
      helpers.engineFieldValues &&
      helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  const __requireEngineField = (key, label) => {
    if (!__engineFieldOn(key)) {
      throw new Error(
        `This event requires the "${label}" engine setting to be enabled (Settings → Engine fields → Dynamic actor).`
      );
    }
  };
  __requireEngineField("DYNAMIC_ACTOR_ENABLE_VM_MOTION_MOVE_TO_POS_BY_VELOCITY", "VM motion: Move to position by velocity");

  const {
    _invoke,
    _stackPush,
    _stackPushConst,
    _stackPushScriptValue,
    _addComment,
    _declareLocal,
    setActorId,
  } = helpers;

  const actorRef = _declareLocal("actorRef", 1, true);
  let attr = 0;
  setActorId(actorRef, input.actorId);

  if (input.moveType === "diagonal") {
    attr |= ACTOR_ATTR_DIAGONAL;
  } else if (input.moveType === "horizontal") {
    attr |= ACTOR_ATTR_H_FIRST;
  }

  if (input.relative) {
    if (input.units === "pixels") {
      attr |= ACTOR_ATTR_RELATIVE_SNAP_PX;
    } else {
      attr |= ACTOR_ATTR_RELATIVE_SNAP_TILE;
    }
  }

  _addComment("Actor Move To Position By Velocity");
  _stackPush(actorRef);
  _stackPushScriptValue(
    scriptValueToPixels(input.targetX || { type: "number", value: 0 }, input.units),
  );
  _stackPushScriptValue(
    scriptValueToPixels(input.targetY || { type: "number", value: 0 }, input.units),
  );
  _stackPushConst(attr);
  _stackPushConst(input.directToPoint ? 1 : 0);
  _stackPushConst(input.cancelOnCollision ? 1 : 0);
  _stackPushConst(0);
  _stackPushConst(0);
  _stackPushConst(0);
  _stackPushConst(0);

  _invoke("vm_actor_move_to_pos_by_velocity", 10, ".ARG9");
};

