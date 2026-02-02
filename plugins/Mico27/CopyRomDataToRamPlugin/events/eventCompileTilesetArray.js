export const id = "EVENT_COMPILE_TILESET_ARRAY";
export const name = "Compile tileset array";
export const groups = ["EVENT_GROUP_SCENE"];
export const subGroups = {
  EVENT_GROUP_SCENE: "EVENT_GROUP_TILES",
};

export const autoLabel = (fetchArg) => {
  return `Compile tileset array`;
};

export const fields = [].concat(
  [
    {
      key: `rom_data_symbol`,
      label: "Custom data symbol",
      type: "text",
    }, 
    {
      key: "tilesetCount",
      label: "Tileset count",
      description: "Amount of tilesets to compile in array",
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
        key: "tilesetCount",
        gt: i,
      },
    ],
    fields: [
	  {
        key: `tilesetId_${i}`,
        type: "tileset",
        label: `tileset ${i + 1}`,
        defaultValue: "LAST_TILESET",
      }
    ],
  });
      return arr;
    }, []),  
);

export const compile = (input, helpers) => {
  
  const { options, writeAsset, _getAvailableSymbol } = helpers;
  
  const { tilesets } = options;
  
  let tilesetsIncludes = "";
  let tilesetsData = "";
    
  for (let i = 0; i < input.tilesetCount; i++){
      const tileset = tilesets.find((t) => t.id === input[`tilesetId_${i}`]) ?? tilesets[0];
      if (!tileset) {
          continue;
      }
      tilesetsIncludes += `#include "data/${tileset.symbol}.h"\n	  `
	  tilesetsData += `TO_FAR_PTR_T(${tileset.symbol}),\n	 	 `;
  }
  
  const tilesets_symbol = _getAvailableSymbol(input.rom_data_symbol);
  
  writeAsset(
      `${tilesets_symbol}.c`,
      `#pragma bank 255
	  
	  #include "data/${tilesets_symbol}.h"
	  #include "bankdata.h"
	  ${tilesetsIncludes}
	  
	  BANKREF(${tilesets_symbol})
	  
	  const far_ptr_t ${tilesets_symbol}[] = {
	 	 ${tilesetsData}
	  };`
	);
	  
  writeAsset(
	  `${tilesets_symbol}.h`,
	  `#ifndef __${tilesets_symbol}_INCLUDE__
	  #define __${tilesets_symbol}_INCLUDE__
	  
	  #include "bankdata.h"
	  	  	  
	  BANKREF_EXTERN(${tilesets_symbol})
	  extern const far_ptr_t ${tilesets_symbol}[];
	  
	  #endif
	  `
    );  
  
};
