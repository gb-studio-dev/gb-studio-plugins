const id = "SF_EVENT_SET_FADE_COLOR";
const groups = ["EVENT_GROUP_SCREEN"];
const name = "Set Fade Color";

const fields = [
    {
        key: "fadeType",
        label: "Fade To",
        description: "Choose which color the screen fades to/from",
        type: "select",
        options: [
            ["0", "White"],
            ["1", "Black"],
            ["2", "Custom RGB"],
        ],
        defaultValue: "0",
    },
    {
        type: "group",
        conditions: [
            {
                key: "fadeType",
                eq: "2",
            },
        ],
        fields: [
            {
                key: "r",
                label: "Red (0-31)",
                description: "Red channel (0-31, CGB only)",
                type: "number",
                min: 0,
                max: 31,
                defaultValue: 0,
                width: "33%",
            },
            {
                key: "g",
                label: "Green (0-31)",
                description: "Green channel (0-31, CGB only)",
                type: "number",
                min: 0,
                max: 31,
                defaultValue: 0,
                width: "33%",
            },
            {
                key: "b",
                label: "Blue (0-31)",
                description: "Blue channel (0-31, CGB only)",
                type: "number",
                min: 0,
                max: 31,
                defaultValue: 0,
                width: "33%",
            },
        ],
    },
];

const compile = (input, helpers) => {
    const { _setConstMemInt8, _addComment } = helpers;

    const fadeType = parseInt(input.fadeType) || 0;

    _addComment("Set Fade Color");
    _setConstMemInt8("fade_style", fadeType);

    if (fadeType === 2) {
        _setConstMemInt8("fade_target_r", input.r || 0);
        _setConstMemInt8("fade_target_g", input.g || 0);
        _setConstMemInt8("fade_target_b", input.b || 0);
    }
};

module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
};
