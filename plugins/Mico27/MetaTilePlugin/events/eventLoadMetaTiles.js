export const id = "EVENT_LOAD_META_TILES";
export const name = "Load meta tiles";
export const groups = ["Meta Tiles"];

export const autoLabel = (fetchArg) => {
  return `Load meta tiles`;
};

export const fields = [
  {
    key: "sceneId",
    label: "Metatile Scene",
    type: "scene",
    width: "100%",
    defaultValue: "LAST_SCENE",
  },
  {
    key: "matchColor",
    label: "Must match metatile color attributes",
    type: "checkbox",
    defaultValue: false,
  },
  {
    key: "matchCollision",
    label: "Must match metatile collision",
    type: "checkbox",
    defaultValue: false,
  },
];

const background_cache = {};
const metatiles_cache = {};

export const compile = (input, helpers) => {
    const { options, _callNative, _stackPushConst, _stackPush, _stackPop, _addComment, _declareLocal, variableSetToScriptValue, writeAsset, engineFieldValues, engineFields } = helpers;

    const { scenes, scene } = options;
    const metatile_scene = scenes.find((s) => s.id === input.sceneId);
    if (!metatile_scene) {
        return;
    }
    //Get metatile size from engine fields
    let metatileSizeValue = engineFieldValues.find((s) => s.id === "METATILE_SIZE");
    if (!metatileSizeValue){
        const metatileSizeDefault = engineFields["METATILE_SIZE"];
        if (metatileSizeDefault){
            metatileSizeValue = {id: metatileSizeDefault.key, value: metatileSizeDefault.defaultValue};
        }
    }
    if (!background_cache[scene.backgroundId]){
        const newTilemapData = [];
        const oldTilemapData = scene.background.tilemap.data;
        const oldTilemapAttrData = scene.background.tilemapAttr?.data;
        const oldCollisionData = scene.collisions;
        const metaTilemapData = metatile_scene.background.tilemap.data;
        const metaTilemapAttrData = metatile_scene.background.tilemapAttr?.data;
        const metaCollisionData = metatile_scene.collisions;
        let idx = 0;
        let lookup_key = "";
        if (metatileSizeValue.value == "METATILE_SIZE_16"){
            let width = scene.background.width >> 1;
            width--;
            width |= width >> 1;
            width |= width >> 2;
            width |= width >> 4;
            width |= width >> 8;
            width++;
            const height = scene.background.height >> 1;
            if (width * height > 7168){
                throw new Error(`The background's width is: ${(scene.background.width >> 1)} which its upper power of two is: ${width} multiplied by the background height: ${height} totals: ${width * height} which exceeds the limit of 7168. Please reduce the scene size.`);
            }
            let metatile_dict = metatiles_cache[input.sceneId];
            if (!metatile_dict){
                metatile_dict = {};
                for (let y = 0; y < metatile_scene.background.height >> 1; y++){
                    for (let x = 0; x < metatile_scene.background.width >> 1; x++){
                        idx = ((y << 1) * metatile_scene.background.width) + (x << 1);
                        lookup_key = `${metaTilemapData[idx]}_${metaTilemapData[idx + 1]}_${metaTilemapData[idx + metatile_scene.background.width]}_${metaTilemapData[idx + metatile_scene.background.width + 1]}`;
                        if (input.matchColor){
                            lookup_key += `_${metaTilemapAttrData[idx]}_${metaTilemapAttrData[idx + 1]}_${metaTilemapAttrData[idx + metatile_scene.background.width]}_${metaTilemapAttrData[idx + metatile_scene.background.width + 1]}`;
                        }
                        if (input.matchCollision){
                            lookup_key += `_${metaCollisionData[idx]}_${metaCollisionData[idx + 1]}_${metaCollisionData[idx + metatile_scene.background.width]}_${metaCollisionData[idx + metatile_scene.background.width + 1]}`;
                        }
                        if (metatile_dict[lookup_key] === undefined){
                            metatile_dict[lookup_key] = (y * (metatile_scene.background.width >> 1)) + x;
                        }
                    }
                }
                metatiles_cache[input.sceneId] = metatile_dict;
            }
            let new_idx = 0;
            for (let y = 0; y < scene.background.height >> 1; y++){
                for (let x = 0; x < scene.background.width >> 1; x++){
                    idx = ((y << 1) * scene.background.width) + (x << 1);
                    lookup_key = `${oldTilemapData[idx]}_${oldTilemapData[idx + 1]}_${oldTilemapData[idx + scene.background.width]}_${oldTilemapData[idx + scene.background.width + 1]}`;
                    if (input.matchColor){
                        lookup_key += `_${oldTilemapAttrData[idx]}_${oldTilemapAttrData[idx + 1]}_${oldTilemapAttrData[idx + scene.background.width]}_${oldTilemapAttrData[idx + scene.background.width + 1]}`;
                    }
                    if (input.matchCollision){
                        lookup_key += `_${oldCollisionData[idx]}_${oldCollisionData[idx + 1]}_${oldCollisionData[idx + scene.background.width]}_${oldCollisionData[idx + scene.background.width + 1]}`;
                    }
                    new_idx = (y * (scene.background.width >> 1)) + x;
                    newTilemapData[new_idx] = metatile_dict[lookup_key];
                    if (newTilemapData[new_idx] === undefined){
                        throw new Error(`Cannot find matching metatile for tile at coordinate ${(x << 1)}, ${(y << 1)}`);
                    }
                }
            }
        } else {
            let width = scene.background.width;
            width--;
            width |= width >> 1;
            width |= width >> 2;
            width |= width >> 4;
            width |= width >> 8;
            width++;
            const height = scene.background.height;
            if (width * height > 7936){
                throw new Error(`The background's width is: ${scene.background.width} which its upper power of two is: ${width} multiplied by the background height: ${height} totals: ${width * height} which exceeds the limit of 7936. Please reduce the scene size.`);
            }
            let metatile_dict = metatiles_cache[input.sceneId];
            if (!metatile_dict){
                metatile_dict = {};
                for (let y = 0; y < metatile_scene.background.height; y++){
                    for (let x = 0; x < metatile_scene.background.width; x++){
                        idx = (y * metatile_scene.background.width) + x;
                        lookup_key = metaTilemapData[idx];
                        if (input.matchColor){
                            lookup_key += `_${metaTilemapAttrData[idx]}`;
                        }
                        if (input.matchCollision){
                            lookup_key += `_${metaCollisionData[idx]}`;
                        }
                        if (metatile_dict[lookup_key] === undefined){
                            metatile_dict[lookup_key] = idx;
                        }
                    }
                }
                metatiles_cache[input.sceneId] = metatile_dict;
            }
            for (let y = 0; y < scene.background.height; y++){
                for (let x = 0; x < scene.background.width; x++){
                    idx = (y * scene.background.width) + x;
                    lookup_key = oldTilemapData[idx];
                    if (input.matchColor){
                        lookup_key += `_${oldTilemapAttrData[idx]}`;
                    }
                    if (input.matchCollision){
                        lookup_key += `_${oldCollisionData[idx]}`;
                    }
                    newTilemapData[idx] = metatile_dict[lookup_key];
                    if (newTilemapData[idx] === undefined){
                        throw new Error(`Cannot find matching metatile for tile at coordinate ${x}, ${y}`);
                    }
                }
            }
        }
        scene.background.tilemap.data = newTilemapData;
        scene.background.tilemapAttr.data = [0];
        scene.collisions = [0];
        background_cache[scene.backgroundId] = true;
    }
    _addComment("Load meta tiles");

    _stackPushConst(`_${metatile_scene.symbol}`);
    _stackPushConst(`___bank_${metatile_scene.symbol}`);

    _callNative("vm_load_meta_tiles");
    _stackPop(2);

};
