const id = "AB_EVENT_BLINK_STOP";
const groups = ["EVENT_GROUP_ACTOR"];
const name = "Blink Stop";

const fields = [];

const compile = (input, helpers) => {
    const { _callNative } = helpers;
    _callNative("vm_blink_stop");
};

module.exports = { id, name, groups, fields, compile };
