const id = "GET_BKG_SIZE";
const name = "Get Background Size";
const groups = ["Custom Events"];

const fields = [
  {
    key: "bkgWidthVar",
    label: "Background Width",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    description: "Variable to hold the current background's width in pixels."
  },
  {
    key: "bkgHeightVar",
    label: "Background Height",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    description: "Variable to hold the current background's height in pixels."
  }
];

const compile = (input, helpers) => {
    const { 
      _setVariable,
      _callNative,
      _reserve
     } = helpers;
     
    _reserve(1);
    _callNative("vm_get_bkg_width");
    _setVariable(input.bkgWidthVar, ".ARG0");
    _reserve(-1);

    _reserve(1);
    _callNative("vm_get_bkg_height");
    _setVariable(input.bkgHeightVar, ".ARG0"); 
    _reserve(-1);
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile
};