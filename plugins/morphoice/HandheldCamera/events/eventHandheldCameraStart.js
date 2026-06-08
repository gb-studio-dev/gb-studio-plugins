const id = "HC_EVENT_START";
const groups = ["Handheld Camera"];
const name = "Start Handheld Camera";

const fields = [
    {
        key: "amplitude_x",
        label: "X Range (pixels)",
        description: "Total horizontal movement range (0-8, 0 = disabled)",
        type: "number",
        min: 0,
        max: 8,
        defaultValue: 2,
        width: "50%",
    },
    {
        key: "amplitude_y",
        label: "Y Range (pixels)",
        description: "Total vertical movement range (0-8, 0 = disabled)",
        type: "number",
        min: 0,
        max: 8,
        defaultValue: 2,
        width: "50%",
    },
    {
        key: "speed",
        label: "Speed",
        description: "How fast the camera moves",
        type: "select",
        options: [
            ["1", "Slow"],
            ["2", "Normal"],
            ["3", "Fast"],
            ["4", "Faster"],
            ["5", "Fastest"],
        ],
        defaultValue: "2",
        width: "50%",
    },
    {
        key: "smoothness",
        label: "Smoothness",
        description: "How smoothly the camera interpolates",
        type: "select",
        options: [
            ["1", "Sharp"],
            ["2", "Normal"],
            ["3", "Smooth"],
            ["4", "Very Smooth"],
        ],
        defaultValue: "2",
        width: "50%",
    },
];

const compile = (input, helpers) => {
    const { _stackPushConst, _callNative, _stackPop } = helpers;

    const amplitude_x = input.amplitude_x !== undefined ? input.amplitude_x : 1;
    const amplitude_y = input.amplitude_y !== undefined ? input.amplitude_y : 1;
    const speed = parseInt(input.speed) || 2;
    const smoothness = parseInt(input.smoothness) || 2;

    _stackPushConst(smoothness);
    _stackPushConst(speed);
    _stackPushConst(amplitude_y);
    _stackPushConst(amplitude_x);
    _callNative("vm_handheld_camera_start");
    _stackPop(4);
};

module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
};
