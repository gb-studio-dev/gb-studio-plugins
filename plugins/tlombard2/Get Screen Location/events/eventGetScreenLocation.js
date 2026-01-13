const id = "Get_Screen_Location";
const name = "Get Screen Location";
const groups = ["Custom Events"];

const fields = [
  {
    label: "The 4 values create a bounding box of the visible screen in tiles."
  },
  {
    key: "formatSpacing",
    label: ""
  },
  {
    key: "screenLeftVar",
    label: "Screen Left X ",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    description: "Variable to hold the X value of the left of the screen."
  },
    {
    key: "screenRightVar",
    label: "Screen Right X ",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    description: "Variable to hold the X value of the right of the screen."
  },
    {
    key: "screenTopVar",
    label: "Screen Top Y ",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    description: "Variable to hold the Y value of the top of the screen."
  },
    {
    key: "screenBotVar",
    label: "Screen Bottom Y ",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    description: "Variable to hold the Y value of the bottom of the screen."
  },
];

const compile = (input, helpers) => {
    const { 
      _setVariable,
      _callNative,
     } = helpers;

    _callNative("vm_get_screen_location");
    _setVariable(input.screenLeftVar, ".ARG0");
    _setVariable(input.screenRightVar, ".ARG1");
    _setVariable(input.screenTopVar, ".ARG2");
    _setVariable(input.screenBotVar, ".ARG3");
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile
};