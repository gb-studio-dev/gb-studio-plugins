const id = "TB_EVENT_STOP";
const groups = ["Tone Beep"];
const name = "Stop Tone Beep";

const fields = [
    {
        key: "channel",
        label: "Channel",
        description: "Which channel to stop",
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

    const channel = parseInt(input.channel) || 2;

    _stackPushConst(channel);
    _callNative("vm_tone_beep_stop");
    _stackPop(1);
};

module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
};
