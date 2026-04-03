const id = "ND_EVENT_SURF_STOP";
const groups = ["Noise Drone"];
const name = "Stop Ocean Surf";

const fields = [];

const compile = (input, helpers) => {
    const { _callNative } = helpers;
    _callNative("vm_noise_drone_stop");
};

module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
};
