/*
* Author: Tedezed
* Multi Language Menu based on source code of GB Studio
*/

const l10n = require("../helpers/l10n").default;

const id = "EVENT_MENU_MULTI";
const name = "Multi Language Menu";
const groups = ["Plugin Pack", "Multi Language", "EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg) => {
    const numItems = parseInt(fetchArg("items"));
    const text = Array(numItems)
        .fill()
        .map((_, i) => {
            return `"${fetchArg(`option${i + 1}`)}"`;
        })
        .join();
    return l10n("EVENT_MENU_LABEL", {
        variable: fetchArg("variable"),
        text,
    });
};

const fields = [].concat(
    [
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
            key: "items",
            label: l10n("FIELD_NUMBER_OF_OPTIONS"),
            description: l10n("FIELD_NUMBER_OF_OPTIONS_DESC"),
            type: "number",
            min: 2,
            max: 8,
            defaultValue: 2,
        },
        {
            type: "break",
        },
    ],
    // Generate fields for each menu option with 4 language variants
    Array(8)
        .fill()
        .reduce((arr, _, i) => {
            const value = i + 1;

            // Language 1 (default)
            arr.push(
                {
                    key: `option${i + 1}`,
                    label: `Option ${i + 1} (Set 1 if) - Language 1`,
                    description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", {
                        value: String(i + 1),
                    }),
                    hideFromDocs: i >= 2,
                    type: "textarea",
                    singleLine: true,
                    defaultValue: "",
                    placeholder: l10n("FIELD_ITEM", { value: String(i + 1) }),
                    conditions: [
                        {
                            key: "items",
                            gt: value,
                        },
                    ],
                },
                {
                    key: `option${i + 1}`,
                    label: `Option ${i + 1} (Set 2 if) - Language 1`,
                    description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", {
                        value: String(i + 1),
                    }),
                    hideFromDocs: i >= 2,
                    type: "textarea",
                    singleLine: true,
                    defaultValue: "",
                    placeholder: l10n("FIELD_ITEM", { value: String(i + 1) }),
                    conditions: [
                        {
                            key: "items",
                            eq: value,
                        },
                        {
                            key: "cancelOnLastOption",
                            ne: true,
                        },
                    ],
                },
                {
                    key: `option${i + 1}`,
                    label: `Option ${i + 1} (Set 0 if) - Language 1`,
                    description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", { value: "0" }),
                    hideFromDocs: true,
                    type: "textarea",
                    singleLine: true,
                    defaultValue: "",
                    placeholder: l10n("FIELD_ITEM", { value: String(i + 1) }),
                    conditions: [
                        {
                            key: "items",
                            eq: value,
                        },
                        {
                            key: "cancelOnLastOption",
                            eq: true,
                        },
                    ],
                }
            );

            // Language 2
            arr.push(
                {
                    key: `option${i + 1}_lang2`,
                    label: `Option ${i + 1} (Set 1 if) - Language 2`,
                    description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", {
                        value: String(i + 1),
                    }),
                    hideFromDocs: i >= 2,
                    type: "textarea",
                    singleLine: true,
                    defaultValue: "",
                    placeholder: `Item ${i + 1} (Lang 2)`,
                    conditions: [
                        {
                            key: "items",
                            gt: value,
                        },
                    ],
                },
                {
                    key: `option${i + 1}_lang2`,
                    label: `Option ${i + 1} (Set 2 if) - Language 2`,
                    description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", {
                        value: String(i + 1),
                    }),
                    hideFromDocs: i >= 2,
                    type: "textarea",
                    singleLine: true,
                    defaultValue: "",
                    placeholder: `Item ${i + 1} (Lang 2)`,
                    conditions: [
                        {
                            key: "items",
                            eq: value,
                        },
                        {
                            key: "cancelOnLastOption",
                            ne: true,
                        },
                    ],
                },
                {
                    key: `option${i + 1}_lang2`,
                    label: `Option ${i + 1} (Set 0 if) - Language 2`,
                    description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", { value: "0" }),
                    hideFromDocs: true,
                    type: "textarea",
                    singleLine: true,
                    defaultValue: "",
                    placeholder: `Item ${i + 1} (Lang 2)`,
                    conditions: [
                        {
                            key: "items",
                            eq: value,
                        },
                        {
                            key: "cancelOnLastOption",
                            eq: true,
                        },
                    ],
                }
            );

            // Language 3
            arr.push(
                {
                    key: `option${i + 1}_lang3`,
                    label: `Option ${i + 1} (Set 1 if) - Language 3`,
                    description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", {
                        value: String(i + 1),
                    }),
                    hideFromDocs: i >= 2,
                    type: "textarea",
                    singleLine: true,
                    defaultValue: "",
                    placeholder: `Item ${i + 1} (Lang 3)`,
                    conditions: [
                        {
                            key: "items",
                            gt: value,
                        },
                    ],
                },
                {
                    key: `option${i + 1}_lang3`,
                    label: `Option ${i + 1} (Set 2 if) - Language 3`,
                    description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", {
                        value: String(i + 1),
                    }),
                    hideFromDocs: i >= 2,
                    type: "textarea",
                    singleLine: true,
                    defaultValue: "",
                    placeholder: `Item ${i + 1} (Lang 3)`,
                    conditions: [
                        {
                            key: "items",
                            eq: value,
                        },
                        {
                            key: "cancelOnLastOption",
                            ne: true,
                        },
                    ],
                },
                {
                    key: `option${i + 1}_lang3`,
                    label: `Option ${i + 1} (Set 0 if) - Language 3`,
                    description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", { value: "0" }),
                    hideFromDocs: true,
                    type: "textarea",
                    singleLine: true,
                    defaultValue: "",
                    placeholder: `Item ${i + 1} (Lang 3)`,
                    conditions: [
                        {
                            key: "items",
                            eq: value,
                        },
                        {
                            key: "cancelOnLastOption",
                            eq: true,
                        },
                    ],
                }
            );

            // Language 4
            arr.push(
                {
                    key: `option${i + 1}_lang4`,
                    label: `Option ${i + 1} (Set 1 if) - Language 4`,
                    description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", {
                        value: String(i + 1),
                    }),
                    hideFromDocs: i >= 2,
                    type: "textarea",
                    singleLine: true,
                    defaultValue: "",
                    placeholder: `Item ${i + 1} (Lang 4)`,
                    conditions: [
                        {
                            key: "items",
                            gt: value,
                        },
                    ],
                },
                {
                    key: `option${i + 1}_lang4`,
                    label: `Option ${i + 1} (Set 2 if) - Language 4`,
                    description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", {
                        value: String(i + 1),
                    }),
                    hideFromDocs: i >= 2,
                    type: "textarea",
                    singleLine: true,
                    defaultValue: "",
                    placeholder: `Item ${i + 1} (Lang 4)`,
                    conditions: [
                        {
                            key: "items",
                            eq: value,
                        },
                        {
                            key: "cancelOnLastOption",
                            ne: true,
                        },
                    ],
                },
                {
                    key: `option${i + 1}_lang4`,
                    label: `Option ${i + 1} (Set 0 if) - Language 4`,
                    description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", { value: "0" }),
                    hideFromDocs: true,
                    type: "textarea",
                    singleLine: true,
                    defaultValue: "",
                    placeholder: `Item ${i + 1} (Lang 4)`,
                    conditions: [
                        {
                            key: "items",
                            eq: value,
                        },
                        {
                            key: "cancelOnLastOption",
                            eq: true,
                        },
                    ],
                }
            );

            return arr;
        }, []),
    {
        type: "break",
    },
    {
        type: "checkbox",
        label: l10n("FIELD_LAST_OPTION_CANCELS"),
        description: l10n("FIELD_LAST_OPTION_CANCELS_DESC"),
        key: "cancelOnLastOption",
    },
    {
        type: "checkbox",
        label: l10n("FIELD_CANCEL_IF_B"),
        description: l10n("FIELD_CANCEL_IF_B_DESC"),
        key: "cancelOnB",
        defaultValue: true,
    },
    {
        key: "layout",
        type: "select",
        label: l10n("FIELD_LAYOUT"),
        description: l10n("FIELD_LAYOUT_MENU_DESC"),
        options: [
            ["dialogue", l10n("FIELD_LAYOUT_DIALOGUE")],
            ["menu", l10n("FIELD_LAYOUT_MENU")],
        ],
        defaultValue: "dialogue",
    },
);

const compile = (input, helpers) => {
    const { textMenu, ifVariableValue } = helpers;

    // Helper function to call textMenu with the appropriate language options
    const callMenu = (lang1Options, lang2Options, lang3Options, lang4Options) => {
        // Validate that languageVariable exists and is within valid range (1-4)
        if (input.languageVariable === undefined || input.languageVariable === null) {
            // ERROR Multi Language Menu 1: Define VAR - use language 1 as fallback with error prefix
            const errorOptions = lang1Options.map(opt => "ERMLM1: " + opt);
            textMenu(
                input.variable,
                errorOptions,
                input.layout,
                input.cancelOnLastOption,
                input.cancelOnB
            );
        } else {
            ifVariableValue(input.languageVariable, ".LT", 1, () => {
                // ERROR Multi Language Menu 2: VAR < 1
                const errorOptions = lang1Options.map(opt => "ERMLM2: " + opt);
                textMenu(
                    input.variable,
                    errorOptions,
                    input.layout,
                    input.cancelOnLastOption,
                    input.cancelOnB
                );
            }, () => {
                ifVariableValue(input.languageVariable, ".GT", 4, () => {
                    // ERROR Multi Language Menu 3: VAR > 4
                    const errorOptions = lang1Options.map(opt => "ERMLM3: " + opt);
                    textMenu(
                        input.variable,
                        errorOptions,
                        input.layout,
                        input.cancelOnLastOption,
                        input.cancelOnB
                    );
                }, () => {
                    // Variable is valid (1-4), proceed with language selection
                    ifVariableValue(input.languageVariable, ".EQ", 1, () => {
                        textMenu(
                            input.variable,
                            lang1Options,
                            input.layout,
                            input.cancelOnLastOption,
                            input.cancelOnB
                        );
                    }, () => {
                        ifVariableValue(input.languageVariable, ".EQ", 2, () => {
                            textMenu(
                                input.variable,
                                lang2Options,
                                input.layout,
                                input.cancelOnLastOption,
                                input.cancelOnB
                            );
                        }, () => {
                            ifVariableValue(input.languageVariable, ".EQ", 3, () => {
                                textMenu(
                                    input.variable,
                                    lang3Options,
                                    input.layout,
                                    input.cancelOnLastOption,
                                    input.cancelOnB
                                );
                            }, () => {
                                ifVariableValue(input.languageVariable, ".EQ", 4, () => {
                                    textMenu(
                                        input.variable,
                                        lang4Options,
                                        input.layout,
                                        input.cancelOnLastOption,
                                        input.cancelOnB
                                    );
                                });
                            });
                        });
                    });
                });
            });
        }
    };

    // Build arrays for each language
    const lang1Options = [
        input.option1,
        input.option2,
        input.option3,
        input.option4,
        input.option5,
        input.option6,
        input.option7,
        input.option8,
    ].splice(0, input.items);

    const lang2Options = [
        input.option1_lang2 || input.option1,
        input.option2_lang2 || input.option2,
        input.option3_lang2 || input.option3,
        input.option4_lang2 || input.option4,
        input.option5_lang2 || input.option5,
        input.option6_lang2 || input.option6,
        input.option7_lang2 || input.option7,
        input.option8_lang2 || input.option8,
    ].splice(0, input.items);

    const lang3Options = [
        input.option1_lang3 || input.option1,
        input.option2_lang3 || input.option2,
        input.option3_lang3 || input.option3,
        input.option4_lang3 || input.option4,
        input.option5_lang3 || input.option5,
        input.option6_lang3 || input.option6,
        input.option7_lang3 || input.option7,
        input.option8_lang3 || input.option8,
    ].splice(0, input.items);

    const lang4Options = [
        input.option1_lang4 || input.option1,
        input.option2_lang4 || input.option2,
        input.option3_lang4 || input.option3,
        input.option4_lang4 || input.option4,
        input.option5_lang4 || input.option5,
        input.option6_lang4 || input.option6,
        input.option7_lang4 || input.option7,
        input.option8_lang4 || input.option8,
    ].splice(0, input.items);

    callMenu(lang1Options, lang2Options, lang3Options, lang4Options);
};

module.exports = {
    id,
    name: "Multi-Language Menu",
    description: "Display a menu with options in multiple languages based on a language variable (1, 2, 3, 4)",
    autoLabel,
    groups,
    fields,
    compile,
    waitUntilAfterInitFade: true,
};
