export const id = "EVENT_COMPILE_SCENE_ARRAY";
export const name = "Compile scene array";
export const groups = ["EVENT_GROUP_SCENE"];
export const subGroups = {
  EVENT_GROUP_SCENE: "EVENT_GROUP_TILES",
};

export const autoLabel = (fetchArg) => {
  return `Compile scene array`;
};

export const fields = [].concat(
  [
    {
      key: `rom_data_symbol`,
      label: "Custom data symbol",
      type: "text",
    }, 
    {
      key: "sceneCount",
      label: "Scene count",
      description: "Amount of scenes to compile in array",
      type: "number",
      min: 1,
      max: 4096,
      defaultValue: 1,
    }
  ],
  Array(4096)
    .fill()
    .reduce((arr, _, i) => {      
      arr.push({
    type: "group",
	wrapItems: false,
    conditions: [
      {
        key: "sceneCount",
        gt: i,
      },
    ],
    fields: [
	  {
        key: `sceneId_${i}`,
        type: "scene",
        label: `scene ${i + 1}`,
        defaultValue: "LAST_SCENE",
      }
    ],
  });
      return arr;
    }, []),  
);

export const compile = (input, helpers) => {
  
  const { options, writeAsset, _getAvailableSymbol } = helpers;
  
  const { scenes } = options;
  
  let scenesIncludes = "";
  let scenesData = "";
    
  for (let i = 0; i < input.sceneCount; i++){
      const scene = scenes.find((t) => t.id === input[`sceneId_${i}`]) ?? scenes[0];
      if (!scene) {
          continue;
      }
      scenesIncludes += `#include "data/${scene.symbol}.h"\n	  `
	  scenesData += `TO_FAR_PTR_T(${scene.symbol}),\n	 	 `;
  }
  
  const scenes_symbol = _getAvailableSymbol(input.rom_data_symbol);
  
  writeAsset(
      `${scenes_symbol}.c`,
      `#pragma bank 255
	  
	  #include "data/${scenes_symbol}.h"
	  #include "bankdata.h"
	  ${scenesIncludes}
	  
	  BANKREF(${scenes_symbol})
	  
	  const far_ptr_t ${scenes_symbol}[] = {
	 	 ${scenesData}
	  };`
	);
	  
  writeAsset(
	  `${scenes_symbol}.h`,
	  `#ifndef __${scenes_symbol}_INCLUDE__
	  #define __${scenes_symbol}_INCLUDE__
	  
	  #include "bankdata.h"
	  	  	  
	  BANKREF_EXTERN(${scenes_symbol})
	  extern const far_ptr_t ${scenes_symbol}[];
	  
	  #endif
	  `
    );  
  
};
