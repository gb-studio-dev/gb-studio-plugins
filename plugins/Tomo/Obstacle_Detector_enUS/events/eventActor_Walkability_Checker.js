/*
 * Author: Tomo (@indiegdevstdio)
 * Checks for any obstacle (collisions or other actors) found relative to the specified actor's position and facing direction,
 * given the offset tile amount to walk relatively towards the destination
 */
const scriptValueHelpers = require("shared/lib/scriptValue/helpers");

export const id = "XV_TILE_MAP_ACTOR_WALKABILITY_CHECK";
export const name = "Actor Walkability Checker";
export const groups = ["XV Plugins"];

const fields = [].concat(
  [{
    type: "group",
    fields: [
      {
        label: "Checks for any obstacle (collisions or other actors) found relative to the specified actor's position and facing direction, given the offset tile amount to walk relatively towards the destination. If there are no collisions or other actors, it means there are no obstacles, and 0 will be assigned to the specified return variable. Example: No obstacle = 0, Obstacle found = Collision ID, or the actor ID represented with a negative value (Note that if the obstacle was a Player actor, the returned ID will be -128).",
        type: "label",
      },
    ],
  }],
  [{
    type: "group",
    fields: [
      {
        key: "actorID",
        type: "actor",
        label: "Actor",
        description: "The base actor.",
        defaultValue: "$self$",
        width: "100%",
      },
    ],
  }],
  [{
    type: "group",
    fields: [
      {
        key: "offset",
        type: "union",
        types: ["number", "variable"],
        label: "Offset",
        description: "How many tiles the actor should move until it detects an obstacle.",
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
  const { actorID, offset, results } = input;
  const { _stackPush, getVariableAlias, _stackPushConst, _callNative, _stackPop, appendRaw,
    variableSetToScriptValue, variableSetToValue, _stackPushReference, actorSetById, actorSetActive, actorPushById } = helpers;
    const { precompileScriptValue, optimiseScriptValue } = scriptValueHelpers;

    // Make sure the actor to manipulate is active
    actorSetById(actorID);
    // Push actor index to stack
    actorPushById(actorID);

    // Get & push the value for offset
    const [typeOffset] = precompileScriptValue(optimiseScriptValue(offset));
    // Check if the passed value is a number or variable
    if(typeOffset[0].type === "number") {
      // It was a number, so we push to stack as constant
      _stackPushConst(typeOffset[0].value);
    } else if(typeOffset[0].type === "variable") {
      // It was a variable, so we push to stack as variable
      const variableAlias = getVariableAlias(typeOffset[0].value);
      _stackPush(variableAlias);
    } else {
      _stackPop(1); // We already have value pushed in stack, so remove it here
      return;
    }

    // Get & push the reference for variable results
    const [resultsVar] = precompileScriptValue(optimiseScriptValue(results));
    _stackPushReference(getVariableAlias(resultsVar[0]));

    // Call native function on engine side
    _callNative("ActorWalkabilityChecker");
    // Remove pushed values from stack
    _stackPop(3);
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
