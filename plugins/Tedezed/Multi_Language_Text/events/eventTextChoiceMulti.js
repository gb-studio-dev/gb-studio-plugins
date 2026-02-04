/*
* Author: Tedezed
* Multi Language Choice based on source code of GB Studio
*/

const l10n = require("../helpers/l10n").default;

const id = "EVENT_CHOICE_MULTI";
const name = "Multi Language Choice";
const groups = ["Plugin Pack", "Multi Language", "EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg) => {
    const text = [
        `"${fetchArg("trueText")}"`,
        `"${fetchArg("falseText")}"`,
    ].join();
    return l10n("EVENT_CHOICE_LABEL", {
        variable: fetchArg("variable"),
        text,
    });
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
        key: "variable",
        label: l10n("FIELD_SET_VARIABLE"),
        description: l10n("FIELD_VARIABLE_DESC"),
        type: "variable",
        defaultValue: "LAST_VARIABLE",
    },
    {
        type: "break",
    },
    // Language 1 - True option
    {
        key: "trueText",
        label: "Set True If - Language 1",
        description: l10n("FIELD_SET_TRUE_IF_DESC"),
        type: "textarea",
        singleLine: true,
        defaultValue: "",
        placeholder: l10n("FIELD_CHOICE_A"),
    },
    // Language 1 - False option
    {
        key: "falseText",
        label: "Set False If - Language 1",
        description: l10n("FIELD_SET_FALSE_IF_DESC"),
        type: "textarea",
        singleLine: true,
        defaultValue: "",
        placeholder: l10n("FIELD_CHOICE_B"),
    },
    {
        type: "break",
    },
    // Language 2 - True option
    {
        key: "trueText_lang2",
        label: "Set True If - Language 2",
        description: l10n("FIELD_SET_TRUE_IF_DESC"),
        type: "textarea",
        singleLine: true,
        defaultValue: "",
        placeholder: "Choice A (Lang 2)",
    },
    // Language 2 - False option
    {
        key: "falseText_lang2",
        label: "Set False If - Language 2",
        description: l10n("FIELD_SET_FALSE_IF_DESC"),
        type: "textarea",
        singleLine: true,
        defaultValue: "",
        placeholder: "Choice B (Lang 2)",
    },
    {
        type: "break",
    },
    // Language 3 - True option
    {
        key: "trueText_lang3",
        label: "Set True If - Language 3",
        description: l10n("FIELD_SET_TRUE_IF_DESC"),
        type: "textarea",
        singleLine: true,
        defaultValue: "",
        placeholder: "Choice A (Lang 3)",
    },
    // Language 3 - False option
    {
        key: "falseText_lang3",
        label: "Set False If - Language 3",
        description: l10n("FIELD_SET_FALSE_IF_DESC"),
        type: "textarea",
        singleLine: true,
        defaultValue: "",
        placeholder: "Choice B (Lang 3)",
    },
    {
        type: "break",
    },
    // Language 4 - True option
    {
        key: "trueText_lang4",
        label: "Set True If - Language 4",
        description: l10n("FIELD_SET_TRUE_IF_DESC"),
        type: "textarea",
        singleLine: true,
        defaultValue: "",
        placeholder: "Choice A (Lang 4)",
    },
    // Language 4 - False option
    {
        key: "falseText_lang4",
        label: "Set False If - Language 4",
        description: l10n("FIELD_SET_FALSE_IF_DESC"),
        type: "textarea",
        singleLine: true,
        defaultValue: "",
        placeholder: "Choice B (Lang 4)",
    },
];

const compile = (input, helpers) => {
    const { textChoice, ifVariableValue } = helpers;

    // Helper function to call textChoice with the appropriate language options
    const callChoice = (trueText, falseText) => {
        textChoice(input.variable, {
            trueText: trueText || "",
            falseText: falseText || ""
        });
    };

    // Validate that languageVariable exists and is within valid range (1-4)
    if (input.languageVariable === undefined || input.languageVariable === null) {
        // ERROR Multi Language Choice 1: Define VAR - use language 1 as fallback with error prefix
        callChoice("ERMLC1: " + input.trueText, "ERMLC1: " + input.falseText);
    } else {
        ifVariableValue(input.languageVariable, ".LT", 1, () => {
            // ERROR Multi Language Choice 2: VAR < 1
            callChoice("ERMLC2: " + input.trueText, "ERMLC2: " + input.falseText);
        }, () => {
            ifVariableValue(input.languageVariable, ".GT", 4, () => {
                // ERROR Multi Language Choice 3: VAR > 4
                callChoice("ERMLC3: " + input.trueText, "ERMLC3: " + input.falseText);
            }, () => {
                // Variable is valid (1-4), proceed with language selection
                ifVariableValue(input.languageVariable, ".EQ", 1, () => {
                    callChoice(input.trueText, input.falseText);
                }, () => {
                    ifVariableValue(input.languageVariable, ".EQ", 2, () => {
                        callChoice(
                            input.trueText_lang2 || input.trueText,
                            input.falseText_lang2 || input.falseText
                        );
                    }, () => {
                        ifVariableValue(input.languageVariable, ".EQ", 3, () => {
                            callChoice(
                                input.trueText_lang3 || input.trueText,
                                input.falseText_lang3 || input.falseText
                            );
                        }, () => {
                            ifVariableValue(input.languageVariable, ".EQ", 4, () => {
                                callChoice(
                                    input.trueText_lang4 || input.trueText,
                                    input.falseText_lang4 || input.falseText
                                );
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
    name: "Multi-Language Choice",
    description: "Display a true/false choice with options in multiple languages based on a language variable (1, 2, 3, 4)",
    autoLabel,
    groups,
    fields,
    compile,
    waitUntilAfterInitFade: true,
};
