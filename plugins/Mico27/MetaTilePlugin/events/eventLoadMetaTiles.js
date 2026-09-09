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

// CGB background attribute bits kept when the whole attribute doesn't match:
// VRAM bank (bit 3) + X flip (bit 5) + Y flip (bit 6). The palette number and
// the BG-to-OAM priority bit are dropped.
const ATTR_BANK_FLIP_MASK = 0x68;

// Lookup tolerance levels, strictest first. Every level always matches the
// tile data itself; they only differ in how much of the attribute / collision
// data has to match on top of it.
//   attr: "full" (whole byte) | "mask" (bank + flip bits) | "none"
//   coll: collision bytes must match
const buildTiers = (matchColor, matchCollision) => {
    const tiers = [];
    if (matchColor){
        tiers.push({ attr: "full", coll: matchCollision });
        tiers.push({ attr: "mask", coll: matchCollision });
    }
    if (matchCollision){
        tiers.push({ attr: "none", coll: true });
    }
    tiers.push({ attr: "none", coll: false });
    return tiers;
};

const attrAt = (attrData, idx) => (attrData ? (attrData[idx] ?? 0) : 0);
const collAt = (collisionData, idx) => (collisionData ? (collisionData[idx] ?? 0) : 0);

// indices: the 1 (8px) or 4 (16px) tilemap offsets making up one metatile.
const makeLookupKey = (tier, indices, tilemapData, tilemapAttrData, collisionData) => {
    let key = indices.map((i) => tilemapData[i]).join("_");
    if (tier.attr === "full"){
        key += `_${indices.map((i) => attrAt(tilemapAttrData, i)).join("_")}`;
    } else if (tier.attr === "mask"){
        key += `_${indices.map((i) => attrAt(tilemapAttrData, i) & ATTR_BANK_FLIP_MASK).join("_")}`;
    }
    if (tier.coll){
        key += `_${indices.map((i) => collAt(collisionData, i)).join("_")}`;
    }
    return key;
};

const addMetatile = (tiers, dicts, indices, tilemapData, tilemapAttrData, collisionData, value) => {
    for (let t = 0; t < tiers.length; t++){
        const key = makeLookupKey(tiers[t], indices, tilemapData, tilemapAttrData, collisionData);
        if (dicts[t][key] === undefined){
            dicts[t][key] = value;
        }
    }
};

// Walks the tolerance levels in order and returns the first match, so a tile
// whose attributes or collision don't line up still resolves to a metatile
// with the same tile data instead of failing the build.
const findMetatile = (tiers, dicts, indices, tilemapData, tilemapAttrData, collisionData) => {
    for (let t = 0; t < tiers.length; t++){
        const value = dicts[t][makeLookupKey(tiers[t], indices, tilemapData, tilemapAttrData, collisionData)];
        if (value !== undefined){
            return value;
        }
    }
    return undefined;
};

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
    const tiers = buildTiers(input.matchColor, input.matchCollision);
    // The dicts depend on which match options are enabled, so the same
    // metatile scene used with different options needs its own cache entry.
    const metatiles_key = `${input.sceneId}_${input.matchColor ? 1 : 0}_${input.matchCollision ? 1 : 0}`;
    // A tilemap scene has no backgroundId of its own - GB Studio uses the
    // scene's id as its background - so keying the cache on backgroundId
    // alone would give every tilemap scene the same empty key, and only the
    // first would be transformed.
    const background_key = scene.backgroundId || scene.id;
    if (!background_cache[background_key]){
        const newTilemapData = [];
        const oldTilemapData = scene.background.tilemap.data;
        const oldTilemapAttrData = scene.background.tilemapAttr?.data;
        const oldCollisionData = scene.collisions;
        const metaTilemapData = metatile_scene.background.tilemap.data;
        const metaTilemapAttrData = metatile_scene.background.tilemapAttr?.data;
        const metaCollisionData = metatile_scene.collisions;
        let idx = 0;
        let indices = [];
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
            let metatile_dicts = metatiles_cache[metatiles_key];
            if (!metatile_dicts){
                metatile_dicts = tiers.map(() => ({}));
                for (let y = 0; y < metatile_scene.background.height >> 1; y++){
                    for (let x = 0; x < metatile_scene.background.width >> 1; x++){
                        idx = ((y << 1) * metatile_scene.background.width) + (x << 1);
                        indices = [idx, idx + 1, idx + metatile_scene.background.width, idx + metatile_scene.background.width + 1];
                        addMetatile(tiers, metatile_dicts, indices, metaTilemapData, metaTilemapAttrData, metaCollisionData, (y * (metatile_scene.background.width >> 1)) + x);
                    }
                }
                metatiles_cache[metatiles_key] = metatile_dicts;
            }
            let new_idx = 0;
            for (let y = 0; y < scene.background.height >> 1; y++){
                for (let x = 0; x < scene.background.width >> 1; x++){
                    idx = ((y << 1) * scene.background.width) + (x << 1);
                    indices = [idx, idx + 1, idx + scene.background.width, idx + scene.background.width + 1];
                    new_idx = (y * (scene.background.width >> 1)) + x;
                    newTilemapData[new_idx] = findMetatile(tiers, metatile_dicts, indices, oldTilemapData, oldTilemapAttrData, oldCollisionData);
                    if (newTilemapData[new_idx] === undefined){
                        throw new Error(`Cannot find a metatile matching the tile data at coordinate ${(x << 1)}, ${(y << 1)}`);
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
            let metatile_dicts = metatiles_cache[metatiles_key];
            if (!metatile_dicts){
                metatile_dicts = tiers.map(() => ({}));
                for (let y = 0; y < metatile_scene.background.height; y++){
                    for (let x = 0; x < metatile_scene.background.width; x++){
                        idx = (y * metatile_scene.background.width) + x;
                        addMetatile(tiers, metatile_dicts, [idx], metaTilemapData, metaTilemapAttrData, metaCollisionData, idx);
                    }
                }
                metatiles_cache[metatiles_key] = metatile_dicts;
            }
            for (let y = 0; y < scene.background.height; y++){
                for (let x = 0; x < scene.background.width; x++){
                    idx = (y * scene.background.width) + x;
                    newTilemapData[idx] = findMetatile(tiers, metatile_dicts, [idx], oldTilemapData, oldTilemapAttrData, oldCollisionData);
                    if (newTilemapData[idx] === undefined){
                        throw new Error(`Cannot find a metatile matching the tile data at coordinate ${x}, ${y}`);
                    }
                }
            }
        }
        scene.background.tilemap.data = newTilemapData;
        scene.background.tilemapAttr.data = [0];
        scene.collisions = [0];
        background_cache[background_key] = true;
    }
    _addComment("Load meta tiles");

    _stackPushConst(`_${metatile_scene.symbol}`);
    _stackPushConst(`___bank_${metatile_scene.symbol}`);

    _callNative("vm_load_meta_tiles");
    _stackPop(2);

};
