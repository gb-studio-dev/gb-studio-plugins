const id = "ND_EVENT_START";
const groups = ["Noise Drone"];
const name = "Start Noise Drone";

const fields = [
    {
        key: "pitch",
        label: "Pitch",
        description: "0 = deep rumble (~205 Hz), 9 = ~1024 Hz, 14 = ~2341 Hz, 17 = ~4096 Hz, 22 = high whine (~9362 Hz)",
        type: "number",
        min: 0,
        max: 22,
        defaultValue: 14,
        width: "50%",
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
        key: "mode",
        label: "Mode",
        description: "Noise character",
        type: "select",
        options: [
            ["0", "Hiss (15-bit)"],
            ["1", "Buzz (7-bit)"],
        ],
        defaultValue: "0",
        width: "50%",
    },
];

const compile = (input, helpers) => {
    const { _stackPushConst, _callNative, _stackPop } = helpers;

    const pitch = input.pitch !== undefined ? input.pitch : 14;
    const volume = input.volume !== undefined ? input.volume : 15;
    const mode = parseInt(input.mode) || 0;

    _stackPushConst(mode);
    _stackPushConst(volume);
    _stackPushConst(pitch);
    _callNative("vm_noise_drone_start");
    _stackPop(3);
};

module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
};
