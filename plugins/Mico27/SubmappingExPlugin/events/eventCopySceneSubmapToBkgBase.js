export const id = "EVENT_COPY_BKG_SUBMAP_TO_BKG_BASE";
export const name = "Copy scene submap to background with tile offset";
export const groups = ["EVENT_GROUP_SCREEN"];

export const autoLabel = (fetchArg) => {
  return `Copy scene submap to background with tile offset`;
};

export const fields = [
{
	type: "group",
	fields: [
		{
			key: "sceneId",
			label: "Scene",
			type: "scene",
			width: "100%",
			defaultValue: "LAST_SCENE",
			conditions: [
			{
				key: "use_far_ptr",
				ne: true
			},
			],
		},
		{
			key: `scene_bank`,
			label: "Scene bank",
			type: "value",
			width: "50%",
			defaultValue: {
			type: "number",
			value: 0,
			},
			conditions: [
			{
				key: "use_far_ptr",
				eq: true
			},
			],
		},
		{
			key: `scene_ptr`,
			label: "Scene Pointer",
			type: "value",
			width: "50%",
			defaultValue: {
			type: "number",
			value: 0,
			},
			conditions: [
			{
				key: "use_far_ptr",
				eq: true
			},
			],
		},
		{
			key: "use_far_ptr",
			label: "Use scene's far ptr",
			type: "checkbox",
			width: "50%",
		},
	]
},
{
	type: "group",
	fields: [
		{
			key: `source_x`,
			label: "Source X",
			type: "value",
			defaultValue: {
			type: "number",
			value: 0,
			},
		},
		{
			key: `source_y`,
			label: "Source Y",
			type: "value",
			defaultValue: {
			type: "number",
			value: 0,
			},
		},
	]
},
{
	type: "group",
	fields: [
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
	]
},
{
	type: "group",
	fields: [
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
	]
},
{
    key: "tile_offset",
    label: "tile idx offset",
    description: "height",
    type: "value",
    width: "100%",
    defaultValue: {
      type: "number",
      value: 0,
    },
}
];

export const compile = (input, helpers) => {
  const { options, _callNative, _rpn, _stackPushScriptValue, _stackPushConst, _stackPop, _addComment } = helpers;
    
  _addComment("Copy scene submap to background with tile offset");
  
  if (input.use_far_ptr){
    _stackPushScriptValue(input.scene_ptr);
    _stackPushScriptValue(input.scene_bank);
  } else {
    const { scenes } = options;
	const scene = scenes.find((s) => s.id === input.sceneId);
	if (!scene) {
		return;
	}
    _stackPushConst(`_${scene.symbol}`);
	_stackPushConst(`___bank_${scene.symbol}`); 
  }
  _stackPushScriptValue(input.tile_offset);
  _stackPushScriptValue(input.w);
  _stackPushScriptValue(input.h);
  _stackPushScriptValue(input.dest_x);
  _stackPushScriptValue(input.dest_y);
  _stackPushScriptValue(input.source_x);
  _stackPushScriptValue(input.source_y);
  
  _rpn()
		  .ref(".ARG4").int16(256).operator(".MUL")		// (h << 8) | w 
		  .ref(".ARG5")        						      
          .operator(".B_OR")
          .refSet(".ARG5")
		  .ref(".ARG2").int16(256).operator(".MUL")		// (dest_y << 8) | dest_x
		  .ref(".ARG3")       							       
          .operator(".B_OR")
          .refSet(".ARG4")
		  .ref(".ARG0").int16(256).operator(".MUL")     // (source_y << 8) | source_x
		  .ref(".ARG1")       							        
          .operator(".B_OR")
          .refSet(".ARG3")
          .stop();
          
  _stackPop(3);  		
  _callNative("copy_background_submap_to_background_base");
  _stackPop(6);  
  
};
