export const id = "PT_EVENT_SET_GRADIENT";
export const name = "Init Background Gradient FX Colors";
export const groups = ["Plugin Pak"];

export const fields = [
    {
        label: "Set the Colors for the gradient",
    },
    {
        type: "group",
        fields: [
            {
                label: "From",
            },
            {
                key: "r0",
                label: "R",
                type: "number",
                max: 31,
                min: 0,
                defaultValue: 15,
            },
            {
                key: "g0",
                label: "G",
                type: "number",
                max: 31,
                min: 0,
                defaultValue: 15,
            },
            {
                key: "b0",
                label: "B",
                type: "number",
                max: 31,
                min: 0,
                defaultValue: 15,
            },
        ],
    },
    {
        type: "group",
        fields: [
            {
                label: "To",
            },
            {
                key: "r1",
                label: "R",
                type: "number",
                max: 31,
                min: 0,
                defaultValue: 15,
            },
            {
                key: "g1",
                label: "G",
                type: "number",
                max: 31,
                min: 0,
                defaultValue: 15,
            },
            {
                key: "b1",
                label: "B",
                type: "number",
                max: 31,
                min: 0,
                defaultValue: 15,
            },
        ],
    },
];

export const compile = (input, helpers) => {
    const { _callNative, _stackPushConst, _stackPop } = helpers;
    _stackPushConst((input.b0 << 10) | (input.g0 << 5) | input.r0);
    _stackPushConst((input.b1 << 10) | (input.g1 << 5) | input.r1);
    _callNative("build_gradient");
    _stackPop(2);
};
