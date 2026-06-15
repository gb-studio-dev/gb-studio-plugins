export const id = "EVENT_VSTREAM_UPDATE";
export const name = "VBlank Stream: Update";
export const groups = ["EVENT_GROUP_SCENE"];
export const fields = [];

export const compile = (input, helpers) => {
  const { _addComment, _callNative } = helpers;

  _addComment("VBlank Stream: upload next tile batch");
  _callNative("vstream_update");
};
