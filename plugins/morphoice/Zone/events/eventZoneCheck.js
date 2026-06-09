const id = "AB_EVENT_ZONE_CHECK";
const groups = ["EVENT_GROUP_SCREEN"];
const name = "Zone Check";

const autoLabel = (fetchArg) => {
    return `Zone Check (${fetchArg("zoneX")},${fetchArg("zoneY")} ${fetchArg("zoneW")}x${fetchArg("zoneH")})`;
};

const fields = [
    {
        type: "group",
        fields: [
            {
                key: "zoneX",
                label: "Zone X (tiles)",
                type: "number",
                min: 0,
                max: 255,
                defaultValue: 0,
                width: "50%",
            },
            {
                key: "zoneY",
                label: "Zone Y (tiles)",
                type: "number",
                min: 0,
                max: 255,
                defaultValue: 0,
                width: "50%",
            },
        ],
    },
    {
        type: "group",
        fields: [
            {
                key: "zoneW",
                label: "Width (tiles)",
                type: "number",
                min: 1,
                max: 255,
                defaultValue: 4,
                width: "50%",
            },
            {
                key: "zoneH",
                label: "Height (tiles)",
                type: "number",
                min: 1,
                max: 255,
                defaultValue: 4,
                width: "50%",
            },
        ],
    },
    {
        key: "stateVariable",
        label: "State Variable",
        description: "Tracks zone state (0=outside, 1=inside). Must be unique per zone instance.",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
    },
    {
        key: "onEnter",
        label: "On Enter",
        description: "Runs once when the player enters the zone",
        type: "events",
    },
    {
        key: "onExit",
        label: "On Exit",
        description: "Runs once when the player exits the zone",
        type: "events",
    },
];

const compile = (input, helpers) => {
    const {
        _declareLocal, _addComment, _addCmd, _rpn, _setConst,
        getNextLabel, _label, _jump, _ifConst, _compilePath,
        getVariableAlias,
    } = helpers;

    const pos = _declareLocal("zn_pos", 3, true);
    const result = _declareLocal("zn_res", 1, true);
    const stateAlias = getVariableAlias(input.stateVariable);

    const zoneX = input.zoneX || 0;
    const zoneY = input.zoneY || 0;
    const zoneW = input.zoneW || 1;
    const zoneH = input.zoneH || 1;

    const enterLabel = getNextLabel();
    const endLabel = getNextLabel();

    _addComment("Zone Check");

    // Get player position (actor 0)
    _setConst(pos, 0);
    _addCmd("VM_ACTOR_GET_POS", pos);

    // Compute in_zone: check tile coords against zone bounds
    // tile = subpixels >> 8 (256 subpixels per tile)
    _rpn()
        .ref(`^/(${pos} + 1)/`).int16(8).operator(".SHR")
        .int16(zoneX).operator(".GTE")
        .ref(`^/(${pos} + 1)/`).int16(8).operator(".SHR")
        .int16(zoneX + zoneW).operator(".LT")
        .operator(".AND")
        .ref(`^/(${pos} + 2)/`).int16(8).operator(".SHR")
        .int16(zoneY).operator(".GTE")
        .ref(`^/(${pos} + 2)/`).int16(8).operator(".SHR")
        .int16(zoneY + zoneH).operator(".LT")
        .operator(".AND")
        .operator(".AND")
        .refSet(result)
        .stop();

    // If result == state → no change, skip entirely
    _rpn()
        .ref(result)
        .ref(stateAlias)
        .operator(".EQ")
        .stop();
    _ifConst(".NE", ".ARG0", 0, endLabel, 1);

    // State changed — which direction?
    _rpn().ref(result).stop();
    _ifConst(".NE", ".ARG0", 0, enterLabel, 1);

    // EXIT path: was inside, now outside
    _rpn().int16(0).refSet(stateAlias).stop();
    if (input.onExit) {
        _compilePath(input.onExit);
    }
    _jump(endLabel);

    // ENTER path: was outside, now inside
    _label(enterLabel);
    _rpn().int16(1).refSet(stateAlias).stop();
    if (input.onEnter) {
        _compilePath(input.onEnter);
    }

    _label(endLabel);
};

module.exports = { id, name, groups, autoLabel, fields, compile };
