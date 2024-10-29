/*
 * Author: Tomo (@indiegdevstdio)
 * Checks for any obstacle (collisions or other actors) found relative to the specified actor's position and facing direction,
 * given the offset tile amount to walk relatively towards the destination
 */
const scriptValueHelpers = require("shared/lib/scriptValue/helpers");
const l10n = require("../helpers/l10n").default;
const lang_enUS = (l10n("ACTOR") == "アクター") ? false : true;

export const id = "XV_TILE_MAP_ACTOR_WALKABILITY_CHECK";
export const name = (lang_enUS) ? "Actor Walkability Checker" : "アクターの進行方向の障害物を取得する";
export const groups = (lang_enUS) ? ["XV Plugins"] : ["XV プラグイン"];

const fields = [].concat(
  [{
    type: "group",
    fields: [
      {
        label: (lang_enUS) ? 
        "Checks for any obstacle (collisions or other actors) found relative to the specified actor's position and facing direction, given the offset tile amount to walk relatively towards the destination. If there are no collisions or other actors, it means there are no obstacles, and 0 will be assigned to the specified return variable. Example: No obstacle = 0, Obstacle found = Collision ID, or the actor ID represented with a negative value (Note that if the obstacle was a Player actor, the returned ID will be -128)." :
        "アクターの現在地と向きを基準にして、向かう方角に障害物が無く通行可能かどうかをチェックします。アクターが向かう方角にどのくらい進むかをオフセット値として指定し、アクターと目的地の間に他のアクターが存在せず、かつコリジョンが無い場合は、障害物無しとみなされます。それ以外の場合は、衝突したオブジェクトの ID 情報が代入されます。（例）障害物なし=0、障害物あり=コリジョンID、またはマイナス値で表されたアクターのID（ただし、プレイヤーの ID は -128 となる）の値が入ります。マップのコリジョンが先に代入された場合、アクター / プレイヤー ID は取得されません。",
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
        label: (lang_enUS) ? "Actor" : "アクター",
        description: (lang_enUS) ? "The base actor." : "基準となるアクターを指定します。",
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
        label: (lang_enUS) ? "Offset" : "オフセット",
        description: (lang_enUS) ? 
        "How many tiles the actor should move until it detects an obstacle." : 
        "アクターが現在向いている方角にどのくらいのタイル数を進ませるかを指定します。",
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
        label: (lang_enUS) ? "Variable to store results" : "結果を保存する変数",
        description: (lang_enUS) ? "Variable to store the results." : "障害物の有無を保存する変数",
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
