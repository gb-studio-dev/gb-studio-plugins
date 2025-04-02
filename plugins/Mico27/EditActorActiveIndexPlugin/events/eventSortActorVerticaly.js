const l10n = require("../helpers/l10n").default;

export const id = "EVENT_SORT_ACTORS_VERTICALY";
export const name = "Sort actors verticaly";
export const groups = ["EVENT_GROUP_ACTOR"];

export const autoLabel = (fetchArg) => {
  return `Sort actors verticaly`;
};

export const fields = [  
];

export const compile = (input, helpers) => {
  const { _callNative, _addComment } = helpers;
      
  _addComment("Sort actors verticaly");    
  		
  _callNative("sort_actors_by_ypos");
  
};
