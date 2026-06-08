const id = "STP_EVENT_SET_TEXT_PALETTE";
const groups = ["EVENT_GROUP_SCREEN"];
const name = "Set Text Palette";

const autoLabel = (fetchArg) => {
    const palette = fetchArg("palette");
    const fill = fetchArg("fill");
    const fillLabel = fill === "1" ? ", Black Fill" : ", White Fill";
    return `Set Text Palette ${palette}${fillLabel}`;
};

const fields = [
    {
        key: "palette",
        label: "CGB Palette",
        description: "CGB background palette index (0-7) applied to text tiles",
        type: "number",
        min: 0,
        max: 7,
        defaultValue: 7,
        width: "50%",
    },
    {
        key: "fill",
        label: "Background Fill",
        description: "Fill color for unused pixels in variable-width font tiles",
        type: "select",
        options: [
            ["0", "White (default)"],
            ["1", "Black"],
        ],
        defaultValue: "0",
        width: "50%",
    },
];

const compile = (input, helpers) => {
    const { _setConstMemInt8, _addComment } = helpers;

    const palette = (input.palette != null ? input.palette : 7) & 0x07;
    const fill = parseInt(input.fill) || 0;

    _addComment("Set Text Palette");
    _setConstMemInt8("text_palette", palette);
    _setConstMemInt8("text_bkg_fill", fill ? 0xFF : 0x00);
};

module.exports = {
    id,
    name,
    groups,
    autoLabel,
    fields,
    compile,
};
