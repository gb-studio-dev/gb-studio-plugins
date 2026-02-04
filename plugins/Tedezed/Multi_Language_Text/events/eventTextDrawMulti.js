/*
* Author: Tedezed
* Multi Language Draw Text based on source code of GB Studio
*/

const l10n = require("../helpers/l10n").default;

const id = "EVENT_TEXT_DRAW_MULTI";
const name = "Multi Language Text Draw";
const groups = ["Plugin Pack", "Multi Language", "EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg, args) => {
    if (([].concat(args.text) || []).join()) {
        return l10n("EVENT_TEXT_DRAW_LABEL", {
            text: fetchArg("text"),
        });
    } else {
        return l10n("EVENT_TEXT_DRAW");
    }
};

const fields = [
    {
        label: l10n("FIELD_TEXT_IN_LOGO_WARNING"),
        labelVariant: "warning",
        flexBasis: "100%",
        conditions: [
            {
                sceneType: ["logo"],
            },
        ],
    },
    {
        key: "languageVariable",
        type: "variable",
        label: "Language Variable (1, 2, 3, 4)",
        description: "Variable that determines which language to display (1-4)",
        defaultValue: undefined,
    },
    {
        type: "break",
    },
    {
        key: "text",
        label: "Text Value Language 1",
        type: "textarea",
        placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
        multiple: false,
        defaultValue: "",
        flexBasis: "100%",
    },
    {
        key: "text2",
        label: "Text Value Language 2",
        type: "textarea",
        placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
        multiple: false,
        defaultValue: "",
        flexBasis: "100%",
    },
    {
        key: "text3",
        label: "Text Value Language 3",
        type: "textarea",
        placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
        multiple: false,
        defaultValue: "",
        flexBasis: "100%",
    },
    {
        key: "text4",
        label: "Text Value Language 4",
        type: "textarea",
        placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
        multiple: false,
        defaultValue: "",
        flexBasis: "100%",
    },
    {
        type: "break",
    },
    {
        key: `x`,
        label: l10n("FIELD_X"),
        description: l10n("FIELD_X_DESC"),
        type: "number",
        min: 0,
        max: 19,
        width: "50%",
        defaultValue: 1,
    },
    {
        key: `y`,
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_DESC"),
        type: "number",
        min: 0,
        max: 17,
        width: "50%",
        defaultValue: 1,
    },
    {
        key: `location`,
        label: l10n("FIELD_LOCATION"),
        description: l10n("FIELD_TEXT_DRAW_LOCATION_DESC"),
        type: "select",
        defaultValue: "background",
        width: "50%",
        options: [
            ["background", l10n("FIELD_BACKGROUND")],
            ["overlay", l10n("FIELD_OVERLAY")],
        ],
    },
];

const compile = (input, helpers) => {
    const { textDraw, ifVariableValue } = helpers;

    // Helper function to call textDraw with the appropriate language text
    const callTextDraw = (text) => {
        textDraw(text || "", input.x, input.y, input.location);
    };

    // Validate that languageVariable exists and is within valid range (1-4)
    if (input.languageVariable === undefined || input.languageVariable === null) {
        // ERROR Multi Language Text Draw 1: Define VAR
        callTextDraw("ERMLTD1: " + input.text);
    } else {
        ifVariableValue(input.languageVariable, ".LT", 1, () => {
            // ERROR Multi Language Text Draw 2: VAR < 1
            callTextDraw("ERMLTD2: " + input.text);
        }, () => {
            ifVariableValue(input.languageVariable, ".GT", 4, () => {
                // ERROR Multi Language Text Draw 3: VAR > 4
                callTextDraw("ERMLTD3: " + input.text);
            }, () => {
                // Variable is valid (1-4), proceed with language selection
                ifVariableValue(input.languageVariable, ".EQ", 1, () => {
                    callTextDraw(input.text || "");
                }, () => {
                    ifVariableValue(input.languageVariable, ".EQ", 2, () => {
                        callTextDraw(input.text2 || "");
                    }, () => {
                        ifVariableValue(input.languageVariable, ".EQ", 3, () => {
                            callTextDraw(input.text3 || "");
                        }, () => {
                            ifVariableValue(input.languageVariable, ".EQ", 4, () => {
                                callTextDraw(input.text4 || "");
                            });
                        });
                    });
                });
            });
        });
    }
};

module.exports = {
    id,
    name: "Multi-Language Text Draw",
    description: "Draw text on screen in multiple languages based on a language variable (1, 2, 3, 4)",
    autoLabel,
    groups,
    fields,
    compile,
    waitUntilAfterInitFade: false,
    helper: {
        type: "textdraw",
        text: "text",
        x: "x",
        y: "y",
        location: "location",
    },
};
