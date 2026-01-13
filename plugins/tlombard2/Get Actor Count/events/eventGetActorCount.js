const id = "Get_Num_Of_Actors";
const name = "Get Actor Count";
const groups = ["Custom Events"];

const fields = [
  {
    key: "actorCountVar",
    label: "Actor Count",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    description: "Variable to hold the number of actors in the current scene. Output includes player actor."
  }
];

const compile = (input, helpers) => {
    const { 
      _setVariable,
      _callNative
     } = helpers;

    _callNative("vm_get_actor_count");
    _setVariable(input.actorCountVar, ".ARG0");
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile
};