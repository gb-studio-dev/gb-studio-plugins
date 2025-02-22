const l10n = require("../helpers/l10n").default;

const id = "EVENT_SAVE_CONFIG";
const groups = ["EVENT_GROUP_SAVE_DATA", "EVENT_GROUP_VARIABLES"];
const subGroups = {
  "EVENT_GROUP_SAVE_DATA": "EVENT_GROUP_VARIABLES",
  "EVENT_GROUP_VARIABLES": "EVENT_GROUP_SAVE_DATA"
}

const fields = [].concat(
  [
	{
        label: "⚠️ Make sure to use the \"Store Variable from Game Data In Variable by Index\" if you want to peek data using save configuration!"
    },
    {
      key: "variableAmount",
      label: "Amount of variables",
      description: "Amount of variables",
      type: "number",
      min: 1,
      max: 768,
      defaultValue: 1,
    },
  ],
  Array(768)
    .fill()
    .reduce((arr, _, i) => {      
      arr.push({
        key: `variableDest${i}`,
        conditions: [
          {
            key: "variableAmount",
            gt: i,
          },
        ],
        label: `Variable at index ${i}`,
		description: `Variable at index ${i}`,
		type: "variable",
		defaultValue: "LAST_VARIABLE",
      });
      return arr;
    }, []),  
);

const compile = (input, helpers) => {
  const { getVariableAlias, writeAsset } = helpers;  
  let save_points = "";
  for (let i = 0; i < input.variableAmount; i++){	  
	  save_points += `SAVEPOINT(script_memory[${getVariableAlias(input[`variableDest${i}`])}]),\n`;
  }
  
  writeAsset(
      `save_points.c`,
      `#pragma bank 255

#include <string.h>
#include "data/save_points.h"
#include "vm.h"
#include "data/game_globals.h"

BANKREF(save_points)



const save_point_t save_points[] = {
	${save_points}
    // terminator
    SAVEPOINTS_END
};`
    );

    writeAsset(
      `save_points.h`,
      `#ifndef __SAVE_POINTS_INCLUDE__
#define __SAVE_POINTS_INCLUDE__

#include <gbdk/platform.h>

typedef struct save_point_t {
    void * target;
    size_t size;
} save_point_t;

#define SAVEPOINT(A) {&(A), sizeof(A)}
#define SAVEPOINTS_END {0, 0}

BANKREF_EXTERN(save_points)
extern const save_point_t save_points[];

#endif
`
    );
};

module.exports = {
  id,
  name: "Save configuration",
  description: "Save configuration",
  groups,
  subGroups,
  fields,
  compile,
};
