const l10n = require("../helpers/l10n").default;
export const id = "EVENT_POP_SCENE_STACK_EX";
export const name = l10n("FIELD_SCENE_POP_STATE_DESCRIPTION") + " (EXTENDED)";
export const description = l10n("EVENT_SCENE_POP_STATE_DESC") + " (EXTENDED)";
export const groups = ["EVENT_GROUP_SCENE"];
export const subGroups = {
  EVENT_GROUP_SCENE: "EVENT_GROUP_SCENE_STACK",
};

export const autoLabel = (fetchArg) => {
    return l10n("FIELD_SCENE_POP_STATE_DESCRIPTION") + " (EXTENDED)";
};

export const fields = [
    {
        label: l10n("FIELD_SCENE_POP_STATE_DESCRIPTION") + " (EXTENDED)",
    },
    {
        type: "break",
    },
    {
        key: "fadeSpeed",
        label: l10n("FIELD_FADE_SPEED"),
        description: l10n("FIELD_SPEED_FADE_DESC"),
        type: "fadeSpeed",
        allowNone: true,
        defaultValue: "2",
        width: "50%",
    },
];

export const compile = (input, helpers) => {
    
    const { _callNative, fadeOut } = helpers;
    if (input.fadeSpeed > 0){
        fadeOut(input.fadeSpeed);
    }
    _callNative("vm_pop_scene_stack_ex");
    
};
