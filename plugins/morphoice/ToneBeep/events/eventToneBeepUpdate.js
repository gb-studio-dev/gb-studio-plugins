const id = "TB_EVENT_UPDATE";
const groups = ["Tone Beep"];
const name = "Update Tone Beep";

const fields = [];

const compile = (input, helpers) => {
    const { _callNative } = helpers;
    _callNative("vm_tone_beep_update");
};

module.exports = {
    id,
    name,
    groups,
    fields,
    compile,
};
