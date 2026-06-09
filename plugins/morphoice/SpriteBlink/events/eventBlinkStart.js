const id = "AB_EVENT_BLINK_START";
const groups = ["EVENT_GROUP_ACTOR"];
const name = "Blink Start";

const fields = [];

const compile = (input, helpers) => {
    const { _callNative } = helpers;
    _callNative("vm_blink_start");
};

module.exports = { id, name, groups, fields, compile };
