export const id = "EVENT_SUBMAP_METATILES";
export const name = "Submap metatiles";
export const groups = ["Meta Tiles"];

export const autoLabel = (fetchArg) => {
  return `Submap metatiles`;
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
    key: `source_x`,
    label: "Source X",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: `source_y`,
    label: "Source Y",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: `dest_x`,
    label: "Destination X",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: `dest_y`,
    label: "Destination Y",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "w",
    label: "width",
    description: "width",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "h",
    label: "height",
    description: "height",
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "commit",
    label: "Commit render",
    type: "checkbox",
    defaultValue: false,
  },
];

export const compile = (input, helpers) => {
  const { options, _callNative, _stackPushConst, _rpn, _stackPush, _stackPop, _addComment, _declareLocal, variableSetToScriptValue } = helpers;
  
  const { scenes } = options;
  const scene = scenes.find((s) => s.id === input.sceneId);
  if (!scene) {
    return;
  }
  
  const tmp0 = _declareLocal("tmp0", 1, true);
  const tmp1 = _declareLocal("tmp1", 1, true);
  const tmp2 = _declareLocal("tmp2", 1, true);
  const tmp3 = _declareLocal("tmp3", 1, true);
  
  _addComment("Submap metatiles");
    
  variableSetToScriptValue(tmp0, input.source_x);
  variableSetToScriptValue(tmp1, input.source_y);
   _rpn()
		  .ref(tmp1).int16(256).operator(".MUL")		// (source_y << 8) | source_x
		  .ref(tmp0)        						      
          .operator(".B_OR")
          .refSet(tmp0)
		  .stop();
  
  
  
  
  variableSetToScriptValue(tmp1, input.dest_x);
  variableSetToScriptValue(tmp2, input.dest_y);
  
   _rpn()
		  .ref(tmp2).int16(256).operator(".MUL")		// (dest_y << 8) | dest_x
		  .ref(tmp1)        						      
          .operator(".B_OR")
          .refSet(tmp1)
		  .stop();
  
  variableSetToScriptValue(tmp2, input.w);
  variableSetToScriptValue(tmp3, input.h);  
  
  _rpn()
		  .ref(tmp3).int16(256).operator(".MUL")		// (h << 8) | w
		  .ref(tmp2)        						      
          .operator(".B_OR")
          .refSet(tmp2)
		  .stop();
		  
    
  
  
  _stackPushConst(`_${scene.symbol}`);
  _stackPushConst(`___bank_${scene.symbol}`); 
  _stackPushConst((input.commit)? 1: 0);  
  _stackPush(tmp2);
  _stackPush(tmp1);
  _stackPush(tmp0);
  		
  _callNative("vm_submap_metatiles");
  _stackPop(6);  
  
};
