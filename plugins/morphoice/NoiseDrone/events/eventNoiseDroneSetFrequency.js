const id = "ND_EVENT_SET_FREQ";
const groups = ["Noise Drone"];
const name = "Set Noise Drone Pitch";

const fields = [
    {
        key: "pitch",
        label: "Target Pitch",
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
        key: "porta_speed",
        label: "Portamento Speed",
        description: "Frames between pitch steps (0 = instant, 1 = fastest slide, higher = slower)",
        type: "number",
        min: 0,
        max: 255,
        defaultValue: 0,
        width: "50%",
    },
];

const compile = (input, helpers) => {
    const { _stackPushConst, _callNative, _stackPop } = helpers;

    const pitch = input.pitch !== undefined ? input.pitch : 14;
    const volume = input.volume !== undefined ? input.volume : 15;
    const porta_speed = input.porta_speed !== undefined ? input.porta_speed : 0;

    _stackPushConst(porta_speed);
    _stackPushConst(volume);
    _stackPushConst(pitch);
    _callNative("vm_noise_drone_set_freq");
    _stackPop(3);
};

module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
};
