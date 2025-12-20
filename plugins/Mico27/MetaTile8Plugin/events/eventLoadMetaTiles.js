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

export const compile = (input, helpers) => {
  const { options, _callNative, _stackPushConst, _stackPush, _stackPop, _addComment, _declareLocal, variableSetToScriptValue, writeAsset, engineFieldValues, engineFields } = helpers;
  
  //Validate engine fields
  let maxMapDataWidthValue = engineFieldValues.find((s) => s.id === "MAX_MAP_DATA_WIDTH");
  if (!maxMapDataWidthValue){
	  const maxMapDataWidthDefault = engineFields["MAX_MAP_DATA_WIDTH"];
	  if (maxMapDataWidthDefault){
		  maxMapDataWidthValue = {id: maxMapDataWidthDefault.key, value: maxMapDataWidthDefault.defaultValue};
	  }
  }
  let maxMapDataHeightValue = engineFieldValues.find((s) => s.id === "MAX_MAP_DATA_HEIGHT");
  if (!maxMapDataHeightValue){
	  const maxMapDataHeightDefault = engineFields["MAX_MAP_DATA_HEIGHT"];
	  if (maxMapDataHeightDefault){
		  maxMapDataHeightValue = {id: maxMapDataHeightDefault.key, value: maxMapDataHeightDefault.defaultValue};
	  }
  }    
  const { scenes, scene } = options;
  const metatile_scene = scenes.find((s) => s.id === input.sceneId);
  if (!metatile_scene) {
    return;
  }
  if ((maxMapDataWidthValue.value * maxMapDataHeightValue.value) >= 0x2000){
	  throw new Error(`The configured maximum size for metatile scene (width x height) must be lower than 8192`);
  }
  
  if (!background_cache[scene.backgroundId]){
	const newTilemapData = [];
	const oldTilemapData = scene.background.tilemap.data;
	const oldTilemapAttrData = scene.background.tilemapAttr?.data;
	const oldCollisionData = scene.collisions;
	const metaTilemapData = metatile_scene.background.tilemap.data;
	const metaTilemapAttrData = metatile_scene.background.tilemapAttr?.data;
	const metaCollisionData = metatile_scene.collisions;
	let tile_found = false;
	for (let y = 0; y < scene.background.height; y++){
		for (let x = 0; x < scene.background.width; x++){
			for (let y2 = 0; y2 < metatile_scene.background.height; y2++){
				for (let x2 = 0; x2 < metatile_scene.background.width; x2++){
					if ((oldTilemapData[(y * scene.background.width) + x] == metaTilemapData[(y2 * metatile_scene.background.width) + x2]) &&
						(!input.matchColor || !oldTilemapAttrData || !metaTilemapAttrData || 
						(oldTilemapAttrData[(y * scene.background.width) + x] == metaTilemapAttrData[(y2 * metatile_scene.background.width) + x2])) &&
						(!input.matchCollision || !oldCollisionData || !metaCollisionData || 
						(oldCollisionData[(y * scene.background.width) + x] == metaCollisionData[(y2 * metatile_scene.background.width) + x2]))){
							newTilemapData[(y * scene.background.width) + x] = (y2 * metatile_scene.background.width) + x2;
							tile_found = true;
							break;
					}
				}
				if (tile_found){
					break;
				}
			}
			if (!tile_found){
				throw new Error(`Cannot find matching metatile for tile at coordinate ${x}, ${y}`);
			}
			tile_found = false;
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
