/*
 * Author: Tomo (@indiegdevstdio)
 * Given the tile position (X,Y), checks if there's any obstacles (collisions or actors) at that position
 */
const scriptValueHelpers = require("shared/lib/scriptValue/helpers");
const l10n = require("../helpers/l10n").default;
const lang_enUS = (l10n("ACTOR") == "アクター") ? false : true;

const id = "XV_TILE_MAP_OBSTACLE_OBTAIN";
const name = (lang_enUS) ? "Obstacle Checker" : "タイルの障害物の情報を取得する";
const groups = (lang_enUS) ? ["XV Plugins"] : ["XV プラグイン"];

const fields = [].concat(
  [{
    type: "group",
    fields: [
      {
        label: (lang_enUS) ? 
        "Given the tile position (X,Y), checks if there are any obstacles (collisions or actors) on that tile. If there are no collisions or other actors on the tile, 0 will be assigned to the specified return variable. Example: No obstacle = 0, Obstacle found = Collision ID, or the actor ID represented with a negative value (Note that if the obstacle was a Player actor, the returned ID will be -128)." :
        "特定のタイル（X,Y）の障害物の情報（マップのコリジョンまたはアクター）を取得します。指定したタイル上にアクターが存在せず、かつコリジョンが無い場合は、指定した変数に 0 が代入されます。それ以外の場合は、衝突したオブジェクトの ID 情報が代入されます。（例）障害物なし=0、障害物あり=コリジョンID、またはマイナス値で表されたアクターのID（プレイヤーの衝突判定も含める場合、プレイヤーの ID は -128 となる）の値が入ります。マップのコリジョンが先に代入された場合、アクター / プレイヤー ID は取得されません。",
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
        label: (lang_enUS) ? "X" : "X",
        description: (lang_enUS) ? "Tile's X position to check" : "チェック対象のマップの X 座標",
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
        label: (lang_enUS) ? "Y" : "Y",
        description: (lang_enUS) ? "Tile's Y position to check" : "チェック対象のマップ Y 座標",
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
        label: (lang_enUS) ? "Treat Player as Obstacle" : "プレイヤーを衝突判定に含める",
        description: (lang_enUS) ? "Enable this to treat the player as one of the obstacles as well." : "プレイヤーも衝突判定の対象に含めるかどうかを指定します。",
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
        label: (lang_enUS) ? "Variable to store results" : "結果を保存する変数",
        description: (lang_enUS) ? "Variable to store the results." : "コリジョン情報を保存する変数",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
      },
    ],
  }],
);

const compile = (input, helpers) => {
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
