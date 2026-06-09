const id = "ND_EVENT_SURF_START";
const groups = ["Noise Drone"];
const name = "Start Ocean Surf";

const fields = [];

const compile = (input, helpers) => {
    const { _callNative } = helpers;
    _callNative("vm_noise_drone_surf_start");
};

module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
};
