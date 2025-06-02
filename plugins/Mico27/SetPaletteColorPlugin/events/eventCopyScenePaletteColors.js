export const id = "EVENT_COPY_BKG_COLORS_TO_BKG";
export const name = "Copy scene palette colors";
export const groups = ["EVENT_GROUP_SCREEN"];

export const autoLabel = (fetchArg) => {
  return `Copy scene palette colors`;
};

export const fields = [
  {
    key: "sceneId",
    label: "Scene",
    type: "scene",
	width: "100%",
    defaultValue: "LAST_SCENE",
  },
  {
    key: "commit",
    type: "checkbox",
    label: "Commit",
    defaultValue: true,
  },
];

export const compile = (input, helpers) => {
  const { options, _callNative, _stackPushConst, _stackPush, _stackPop, _addComment } = helpers;
  
  const { scenes } = options;
  const scene = scenes.find((s) => s.id === input.sceneId);
  if (!scene) {
    return;
  }
    
  _addComment("Copy scene palette colors");
  
  _stackPushConst(input.commit ? 0: 1);
  _stackPushConst(`_${scene.symbol}`);
  _stackPushConst(`___bank_${scene.symbol}`); 
  		
  _callNative("copy_scene_palette_colors");
  _stackPop(3);  
  
};
