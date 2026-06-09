const id = "ND_EVENT_UPDATE";
const groups = ["Noise Drone"];
const name = "Update Noise Drone";

const fields = [];

const compile = (input, helpers) => {
    const { _callNative } = helpers;
    _callNative("vm_noise_drone_update");
};

module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
};
