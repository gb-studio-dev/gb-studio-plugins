export const id = "EVENT_VSTREAM_CANCEL";
export const name = "VBlank Stream: Cancel";
export const groups = ["EVENT_GROUP_SCENE"];
export const fields = [];

export const compile = (input, helpers) => {
  const { _addComment, _callNative } = helpers;

  _addComment("VBlank Stream: cancel");
  _callNative("vstream_cancel");
};
