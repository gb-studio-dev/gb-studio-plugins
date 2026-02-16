export const id = "PT_EVENT_ENABLE_GRADIENT_FX";
export const name = "Enable Background Gradient FX";
export const groups = ["Plugin Pak"];

export const fields = [
    {
        label: "Enables the Background Gradient Effect",
    },
];

export const compile = (input, helpers) => {
    const { _callNative } = helpers;
    _callNative("enable_gradient_fx");
};
