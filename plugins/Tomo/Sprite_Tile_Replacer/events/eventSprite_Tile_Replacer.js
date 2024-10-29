/*
 * Author: Tomo (@indiegdevstdio)
 * Replaces sprite tiles in Color-Only mode
 */
const scriptValueHelpers = require("shared/lib/scriptValue/helpers");
const l10n = require("../helpers/l10n").default;
const lang_enUS = (l10n("ACTOR") == "アクター") ? false : true;

export const id = "XV_SPRITE_TILE_REPLACER";
export const name = (lang_enUS) ? "Sprite Tile Replacer" : "指定のスプライトタイルを置き換える";
export const groups = (lang_enUS) ? ["XV Plugins"] : ["XV プラグイン"];

const fields = [].concat(
  [{
    type: "group",
    fields: [
      {
        label: (lang_enUS) ? 
        "Replaces a specified sprite tile with ability to select a VRAM bank in 'Color Only' mode games." :
        "指定したスプライトタイルを別の背景タイルで置き換えます。「カラーのみ」モードのゲーム専用です。",
        type: "label",
      },
    ],
  }],
  [{
    type: "group",
    fields: [
      {
        key: "actor",
        type: "actor",
        label: (lang_enUS) ? "Actor" : "アクター",
        description: (lang_enUS) ? "The actor in which you want to replace the sprite’s tile." : "置き換え対象のスプライトを持つアクターを指定します。",
        defaultValue: "$self$",
        width: "70%",
      },
      {
        key: "vram_bank",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "VRAM Bank" : "VRAM バンク",
        description: (lang_enUS) ? "The bank you want to reference. 0 = Bank 0, 1 = Bank 1." : "置き換え元タイルが配置されている VRAM バンク（0 または 1）を指定します。",
        defaultType: "number",
        defaultValue: {
          number: 0,
        },
        width: "30%",
      },
    ],
  }],
  [{
    type: "group",
    fields: [
      {
        key: "tileset_bank_tiles",
        type: "text",
        label: (lang_enUS) ? "Tile Bank" : "タイルバンク",
        description: (lang_enUS) ? "The source tile bank reference to use for replacing." : "背景タイルセットバンクを指定します。",
        defaultValue: "___bank_tileset_number_tiles",
        width: "50%",
      },
      {
        key: "tileset_tiles",
        type: "text",
        label: (lang_enUS) ? "Tileset" : "タイルセット",
        description: (lang_enUS) ? "The source tileset reference to use for replacing." : "背景タイルセットを指定します。",
        defaultValue: "_tileset_number_tiles",
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    fields: [
      {
        key: "source_tile_idx",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "Background Tile Index" : "背景タイルのインデックス",
        description: (lang_enUS) ? "The background tile index in the source tileset to replace with." : "置き換え元の背景タイルのインデックスを指定します。",
        defaultType: "number",
        defaultValue: {
          number: 0,
        },
        width: "50%",
      },
      {
        key: "target_tile_idx",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "Sprite Tile Index" : "スプライトタイルのインデックス",
        description: (lang_enUS) ? "The sprite’s tile index to be replaced by the background tile." : "置き換え先のスプライトタイルのインデックスを指定します。",
        defaultType: "number",
        defaultValue: {
          number: 0,
        },
        width: "50%",
      },
    ],
  }],
);

export const compile = (input, helpers) => {
  const { vram_bank, actor, tileset_bank_tiles, tileset_tiles, source_tile_idx, target_tile_idx } = input;
  const { _stackPush, getVariableAlias, _stackPushConst, _callNative, _stackPop, appendRaw,
    variableSetToScriptValue, variableSetToValue, _stackPushReference, actorSetById, actorSetActive, actorPushById } = helpers;
  const { precompileScriptValue, optimiseScriptValue } = scriptValueHelpers;

  // Push actor index to stack
  actorPushById(actor);

  // Get & push the value for vram_bank
  const [typeVramBank] = precompileScriptValue(optimiseScriptValue(vram_bank));
  // Check if the passed value is a number or variable
  if (typeVramBank[0].type === "number") {
    // It was a number, so we push to stack as constant
    _stackPushConst(typeVramBank[0].value);
  } else if (typeVramBank[0].type === "variable") {
    // It was a variable, so we push to stack as variable
    const variableAlias = getVariableAlias(typeVramBank[0].value);
    _stackPush(variableAlias);
  }

  // Get & push the value for source tile index
  const [typeSourceTileIdx] = precompileScriptValue(optimiseScriptValue(source_tile_idx));
  // Check if the passed value is a number or variable
  if (typeSourceTileIdx[0].type === "number") {
    // It was a number, so we push to stack as constant
    _stackPushConst(typeSourceTileIdx[0].value);
  } else if (typeSourceTileIdx[0].type === "variable") {
    // It was a variable, so we push to stack as variable
    const variableAlias = getVariableAlias(typeSourceTileIdx[0].value);
    _stackPush(variableAlias);
  }

  // Get & push the value for target tile index
  const [typeTargetTileIdx] = precompileScriptValue(optimiseScriptValue(target_tile_idx));
  // Check if the passed value is a number or variable
  if (typeTargetTileIdx[0].type === "number") {
    // It was a number, so we push to stack as constant
    _stackPushConst(typeTargetTileIdx[0].value);
  } else if (typeTargetTileIdx[0].type === "variable") {
    // It was a variable, so we push to stack as variable
    const variableAlias = getVariableAlias(typeTargetTileIdx[0].value);
    _stackPush(variableAlias);
  }

  appendRaw(`
    VM_PUSH_CONST ` + tileset_bank_tiles + `
    VM_PUSH_CONST ` + tileset_tiles + `
    `);

  // Call native function on engine side
  _callNative("SetupSpriteTileReplacer");

  // Remove pushed values from stack
  appendRaw(`
    VM_POP 2
    `);

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
