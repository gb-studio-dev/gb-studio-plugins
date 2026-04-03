const id = "HC_EVENT_UPDATE";
const groups = ["Handheld Camera"];
const name = "Update Handheld Camera";

const fields = [];

const compile = (input, helpers) => {
    const { _callNative } = helpers;
    _callNative("vm_handheld_camera_update");
};

module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
};
