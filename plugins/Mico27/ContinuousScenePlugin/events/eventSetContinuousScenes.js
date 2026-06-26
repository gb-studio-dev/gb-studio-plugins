export const id = "EVENT_SET_CONTINUOUS_SCENE";
export const name = "Set Continuous Scene";
export const groups = ["EVENT_GROUP_SCENE"];

export const autoLabel = (fetchArg) => {
  return `Set Continuous Scene`;
};

export const fields = [
  {
    key: "sceneId",
    label: "Scene",
    type: "scene",
    defaultValue: "LAST_SCENE",
  },
  {
      key: "direction",
      label: "Direction of Scene",
      type: "select",
      defaultValue: "0",
      options: [
        ["0", "Top"],
        ["1", "Right"],
        ["2", "Bottom"],
        ["3", "Left"],
        ["4", "Top Left"],
        ["5", "Top Right"],
        ["6", "Bottom Right"],
        ["7", "Bottom Left"],
      ],
  },
  {
    key: "offset",
    type: "number",
    label: "Offset of Scene",
    defaultValue: 0,
  }
];


export const compile = (input, helpers) => {
    const { _addComment, options, _stackPushConst, _callNative, _addNL, _stackPop } = helpers;

    _addComment("Set continuous scene");
    const { scenes } = options;
    const scene = scenes.find((s) => s.id === input.sceneId);
    _stackPushConst(input.offset);
    _stackPushConst(input.direction);
    _stackPushConst((scene)? `_${scene.symbol}`: 0);
    _stackPushConst((scene)? `___bank_${scene.symbol}`: 0);

    _callNative("set_continuous_scene");
    _stackPop(4);

    _addNL();
};