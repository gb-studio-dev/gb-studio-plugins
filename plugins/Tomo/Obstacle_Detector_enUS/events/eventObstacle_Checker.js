/*
 * Author: Tomo (@indiegdevstdio)
 * Given the tile position (X,Y), checks if there's any obstacles (collisions or actors) at that position
 */
const scriptValueHelpers = require("shared/lib/scriptValue/helpers");

export const id = "XV_TILE_MAP_OBSTACLE_OBTAIN";
export const name = "Obstacle Checker";
export const groups = ["XV Plugins"];

const fields = [].concat(
  [{
    type: "group",
    fields: [
      {
        label: "Given the tile position (X,Y), checks if there are any obstacles (collisions or actors) on that tile. If there are no collisions or other actors on the tile, 0 will be assigned to the specified return variable. Example: No obstacle = 0, Obstacle found = Collision ID, or the actor ID represented with a negative value (Note that if the obstacle was a Player actor, the returned ID will be -128).",
        type: "label",
      },
    ],
  }],

  [{
    type: "group",
    fields: [
      {
        key: "x",
        type: "union",
        types: ["number", "variable"],
        label: "X",
        description: "Tile's X position to check",
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles"],
        defaultType: "number",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
        },
      },
      {
        key: "y",
        type: "union",
        types: ["number", "variable"],
        label: "Y",
        description: "Tile's Y position to check",
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles"],
        defaultType: "number",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
        },
      },
    ],
  }],
  [{
    type: "group",
    fields: [
      {
        key: "is_include_player",
        label: "Treat Player as Obstacle",
        description: "Enable this to treat the player as one of the obstacles as well.",
        type: "checkbox",
        defaultValue: false,
      },
    ],
  }],
  [{
    type: "group",
    fields: [
      {
        key: "results",
        label: "Variable to store results",
        description: "Variable to store the results.",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
      },
    ],
  }],
);

export const compile = (input, helpers) => {
  //console.log(input);
  const { x, y, is_include_player, results } = input;
  const { _stackPush, getVariableAlias, _stackPushConst, _callNative, _stackPop, _stackPushReference } = helpers;
  const { precompileScriptValue, optimiseScriptValue } = scriptValueHelpers;

  // Get & push the value for tile X
  const [typeX] = precompileScriptValue(optimiseScriptValue(x));
  // Check if the passed tile X value is a number or variable
  if(typeX[0].type === "number") {
    // It was a number, so we push to stack as constant
    _stackPushConst(typeX[0].value);
  } else if(typeX[0].type === "variable") {
    // It was a variable, so we push to stack as variable
    const variableAlias = getVariableAlias(typeX[0].value);
    _stackPush(variableAlias);
  } else {
    return;
  }

  // Get & push the value for tile Y
  const [typeY] = precompileScriptValue(optimiseScriptValue(y));

  // Check if the passed tile Y value is a number or variable
  if(typeY[0].type === "number") {
    // It was a number, so we push to stack as constant
    _stackPushConst(typeY[0].value);
  } else if(typeY[0].type === "variable") {
    // It was a variable, so we push to stack as variable
    const variableAlias = getVariableAlias(typeY[0].value);
    _stackPush(variableAlias);
  } else {
    _stackPop(1); // We already have value X pushed in stack, so remove it here
    return;
  }

  // Get & push the value for checking the player as collidable object or not
  _stackPushConst(is_include_player ? 1 : 0);

  // Get & push the reference for variable results
  const [resultsVar] = precompileScriptValue(optimiseScriptValue(results));
  _stackPushReference(getVariableAlias(resultsVar[0]));
  
  // Call native function on engine side
  _callNative("obstacle_checker");
  // Remove pushed values from stack
  _stackPop(4);
    
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
