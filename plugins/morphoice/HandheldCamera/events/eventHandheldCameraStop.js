const id = "HC_EVENT_STOP";
const groups = ["Handheld Camera"];
const name = "Stop Handheld Camera";

const fields = [];

const compile = (input, helpers) => {
    const { _callNative } = helpers;
    _callNative("vm_handheld_camera_stop");
};

module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
};
