export const id = "EVENT_REMOVE_CONTINUOUS_SCENE";
export const name = "Remove Continuous Scene";
export const groups = ["EVENT_GROUP_SCENE"];

export const autoLabel = (fetchArg) => {
  return `Remove Continuous Scene`;
};

export const fields = [
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
  }
];


export const compile = (input, helpers) => {
    const { _addComment, _stackPushConst, _callNative, _addNL, _stackPop } = helpers;
    _addComment("Remove continuous scene");
    _stackPushConst(input.direction);
    _callNative("remove_continuous_scene");
    _stackPop(1);
    _addNL();
};