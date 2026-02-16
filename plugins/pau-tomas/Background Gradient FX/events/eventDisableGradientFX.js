export const id = "PT_EVENT_DISABLE_GRADIENT_FX";
export const name = "Disable Background Gradient FX";
export const groups = ["Plugin Pak"];

export const fields = [
    {
        label: "Disables the Background Gradient Effect",
    },
];

export const compile = (input, helpers) => {
    const { _callNative } = helpers;
    _callNative("disable_gradient_fx");
};
