const id = "TB_EVENT_START";
const groups = ["Tone Beep"];
const name = "Start Tone Beep";

const fields = [
    {
        key: "pattern",
        label: "Pattern",
        description: "Warning tone pattern to play",
        type: "select",
        options: [
            ["0", "Status Change (455 Hz, one-shot)"],
            ["1", "New Plane / Waterfall (descending, one-shot)"],
            ["2", "Radar Uplink (455↔555 Hz slow, loop)"],
            ["3", "Missile Approach (455↔555 Hz fast, one-shot)"],
            ["4", "Caution (B5 988 Hz, 8 beeps, one-shot)"],
        ],
        defaultValue: "0",
        width: "100%",
    },
    {
        key: "volume",
        label: "Volume",
        description: "Channel volume (0 = silent, 15 = max)",
        type: "number",
        min: 0,
        max: 15,
        defaultValue: 15,
        width: "50%",
    },
    {
        key: "channel",
        label: "Channel",
        description: "Pulse channel to use (CH2 recommended to avoid sweep artifacts)",
        type: "select",
        options: [
            ["2", "CH2"],
            ["1", "CH1"],
        ],
        defaultValue: "2",
        width: "50%",
    },
];

const compile = (input, helpers) => {
    const { _stackPushConst, _callNative, _stackPop } = helpers;

    const pattern = parseInt(input.pattern) || 0;
    const volume = input.volume !== undefined ? input.volume : 15;
    const channel = parseInt(input.channel) || 2;

    _stackPushConst(channel);
    _stackPushConst(volume);
    _stackPushConst(pattern);
    _callNative("vm_tone_beep_start");
    _stackPop(3);
};

module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
};
