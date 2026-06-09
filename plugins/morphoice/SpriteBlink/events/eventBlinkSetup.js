const id = "AB_EVENT_BLINK_SETUP";
const groups = ["EVENT_GROUP_ACTOR"];
const name = "Blink Setup";

const autoLabel = (fetchArg) => {
    return `Blink Setup`;
};

const fields = [
    {
        key: "actor",
        label: "Actor",
        description: "The actor whose eyes will blink",
        type: "actor",
        defaultValue: "$self$",
    },
    {
        key: "leftEyeX",
        label: "Left Eye X",
        description: "X pixel of left eye within the 16x16 sprite (1-16, 1 = leftmost)",
        type: "number",
        min: 1,
        max: 16,
        defaultValue: 4,
        width: "50%",
    },
    {
        key: "leftEyeY",
        label: "Left Eye Y",
        description: "Y pixel of left eye within the 16x16 sprite (1-16, 1 = topmost)",
        type: "number",
        min: 1,
        max: 16,
        defaultValue: 4,
        width: "50%",
    },
    {
        key: "hasRightEye",
        label: "Two Eyes",
        description: "Enable if the sprite has a second eye to blink",
        type: "checkbox",
        defaultValue: true,
        width: "50%",
    },
    {
        key: "rightEyeX",
        label: "Right Eye X",
        description: "X pixel of right eye within the 16x16 sprite (1-16, 1 = leftmost)",
        type: "number",
        min: 1,
        max: 16,
        defaultValue: 13,
        width: "50%",
        conditions: [
            { key: "hasRightEye", eq: true },
        ],
    },
    {
        key: "rightEyeY",
        label: "Right Eye Y",
        description: "Y pixel of right eye within the 16x16 sprite (1-16, 1 = topmost)",
        type: "number",
        min: 1,
        max: 16,
        defaultValue: 4,
        width: "50%",
        conditions: [
            { key: "hasRightEye", eq: true },
        ],
    },
    {
        key: "eyeShape",
        label: "Eye Shape",
        description: "Size of each eye pixel area",
        type: "select",
        options: [
            ["0", "1x1 (single pixel)"],
            ["1", "2x1 (two pixels horizontal)"],
            ["2", "1x2 (two pixels vertical)"],
            ["3", "2x2 L-shape (## / _#)"],
        ],
        defaultValue: "0",
        width: "50%",
    },
    {
        key: "blinkColor",
        label: "Blink Color",
        description: "The color the eye pixels become when closed",
        type: "select",
        options: [
            ["0", "Transparent (color 0)"],
            ["1", "Light green (color 1)"],
            ["2", "Dark green (color 2)"],
            ["3", "Black (color 3)"],
        ],
        defaultValue: "0",
        width: "50%",
    },
    {
        key: "dtileLeft",
        label: "Left Tile Index",
        description: "dtile offset of left 8x16 column in the down-idle metasprite (from sprite editor)",
        type: "number",
        min: 0,
        max: 15,
        defaultValue: 0,
        width: "50%",
    },
    {
        key: "dtileRight",
        label: "Right Tile Index",
        description: "dtile offset of right 8x16 column in the down-idle metasprite (from sprite editor)",
        type: "number",
        min: 0,
        max: 15,
        defaultValue: 2,
        width: "50%",
    },
];

const compile = (input, helpers) => {
    const {
        _stackPushConst, _stackPush, _callNative, _stackPop,
        _addComment, _declareLocal, setActorId,
    } = helpers;

    _addComment("Blink Setup");

    const actorVar = _declareLocal("bk_actor", 1, true);
    setActorId(actorVar, input.actor);

    const rx = input.hasRightEye ? (input.rightEyeX !== undefined ? input.rightEyeX : 12) : 255;
    const ry = input.hasRightEye ? (input.rightEyeY !== undefined ? input.rightEyeY : 3) : 0;
    const shape = input.eyeShape !== undefined ? Number(input.eyeShape) : 0;
    const color = input.blinkColor !== undefined ? Number(input.blinkColor) : 0;
    const dtl = input.dtileLeft !== undefined ? Number(input.dtileLeft) : 0;
    const dtr = input.dtileRight !== undefined ? Number(input.dtileRight) : 2;
    const dtiles = ((dtl & 0x0F) << 4) | (dtr & 0x0F);

    // Push in reverse: last pushed = FN_ARG0
    _stackPushConst(dtiles);                                                   // FN_ARG7
    _stackPushConst(shape);                                                    // FN_ARG6
    _stackPushConst(color);                                                    // FN_ARG5
    _stackPushConst(ry);                                                       // FN_ARG4
    _stackPushConst(rx);                                                       // FN_ARG3
    _stackPushConst(input.leftEyeY !== undefined ? input.leftEyeY : 3);       // FN_ARG2
    _stackPushConst(input.leftEyeX !== undefined ? input.leftEyeX : 3);       // FN_ARG1
    _stackPush(actorVar);                                                      // FN_ARG0

    _callNative("vm_blink_setup");
    _stackPop(8);
};

module.exports = { id, name, groups, autoLabel, fields, compile };
