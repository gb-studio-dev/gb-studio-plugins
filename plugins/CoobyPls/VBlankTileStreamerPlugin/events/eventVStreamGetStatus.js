export const id = "EVENT_VSTREAM_GET_STATUS";
export const name = "VBlank Stream: Get Status";
export const groups = ["EVENT_GROUP_SCENE"];

export const fields = [
  {
    key: "statusVariable",
    label: "Status Variable",
    description: "Writes the stream status into this variable.",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

export const compile = (input, helpers) => {
  const {
    _addComment,
    _callNative,
    _stackPop,
    _stackPushReference,
    getVariableAlias,
  } = helpers;

  _addComment("VBlank Stream: get status");
  _stackPushReference(getVariableAlias(input.statusVariable));
  _callNative("vstream_get_status");
  _stackPop(1);
};
