const l10n = require("../helpers/l10n").default;
export const id = "EVENT_RESET_SCENE_STACK_EX";
export const name = l10n("FIELD_SCENE_RESET_STATE_DESCRIPTION") + " (EXTENDED)";
export const description = l10n("EVENT_SCENE_RESET_STATE_DESC") + " (EXTENDED)";
export const groups = ["EVENT_GROUP_SCENE"];
export const subGroups = {
  EVENT_GROUP_SCENE: "EVENT_GROUP_SCENE_STACK",
};

export const autoLabel = (fetchArg) => {
    return l10n("FIELD_SCENE_RESET_STATE_DESCRIPTION") + " (EXTENDED)";
};

export const fields = [
    {
        label: l10n("FIELD_SCENE_RESET_STATE_DESCRIPTION") + " (EXTENDED)",
    },
];

export const compile = (input, helpers) => {
    
    const { _callNative } = helpers;
    _callNative("vm_reset_scene_stack_ex");
    
};
