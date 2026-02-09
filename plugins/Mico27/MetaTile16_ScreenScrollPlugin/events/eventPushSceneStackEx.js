const l10n = require("../helpers/l10n").default;
export const id = "EVENT_PUSH_SCENE_STACK_EX";
export const name = l10n("FIELD_SCENE_PUSH_STATE_DESCRIPTION") + " (EXTENDED)";
export const description = l10n("EVENT_SCENE_PUSH_STATE_DESC") + " (EXTENDED)";
export const groups = ["EVENT_GROUP_SCENE"];
export const subGroups = {
  EVENT_GROUP_SCENE: "EVENT_GROUP_SCENE_STACK",
};

export const autoLabel = (fetchArg) => {
    return l10n("FIELD_SCENE_PUSH_STATE_DESCRIPTION") + " (EXTENDED)";
};

export const fields = [
    {
        label: l10n("FIELD_SCENE_PUSH_STATE_DESCRIPTION") + " (EXTENDED)",
    },
    {
        key: "__scriptTabs",
        type: "tabs",
        defaultValue: "push",
        values: {
            push: "On push",
            pop: "On pop",
        },
    },
    {
        key: "push",
        label: "On push",
        description: "On push",
        type: "events",
        conditions: [
            {
                key: `__scriptTabs`,
                ne: "pop",
            },
        ],
    },
    {
        key: "pop",
        label: "On pop",
        description: "On pop",
        type: "events",
        conditions: [
            {
                key: `__scriptTabs`,
                eq: "pop",
            },
        ],
    },
    
];

export const compile = (input, helpers) => {
    
    const { _callNative, _stackPushConst, _addComment, _fadeIn, _ifConst, _compilePath, _declareLocal, getNextLabel, _addNL, _jump, _label, _stackPop } = helpers;
    
    const hasPoppedRef = _declareLocal("has_popped", 1, true);
    const popLabel = getNextLabel();
    const endLabel = getNextLabel();
    _addComment(`Push scene stack`);        
    _callNative("vm_push_scene_stack_ex");    
    _stackPushConst(hasPoppedRef);
    _callNative("vm_poll_stack_pop");
    _stackPop(1);    
    _ifConst(".EQ", hasPoppedRef, 1, popLabel, 0);
    _addNL();
    _compilePath(input.push);
    _jump(endLabel);
    _label(popLabel);
    _compilePath(input.pop);
    if (!Array.isArray(input.pop)) {
        _fadeIn(true);
    }
    _label(endLabel);
    
    _addNL();
};
