export const id = "EVENT_COPY_BKG_SUBMAP_TO_WIN";
export const name = "Copy scene submap to overlay";
export const groups = ["EVENT_GROUP_SCREEN"];

export const autoLabel = (fetchArg) => {
  return `Copy scene submap to overlay`;
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
          key: `bkg_x`,
          label: "Background X",
          type: "value",
          width: "50%",
          defaultValue: {
            type: "number",
            value: 0,
          },
        },
		{
          key: `bkg_y`,
          label: "Background Y",
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
          key: `win_x`,
          label: "Overlay X",
          type: "value",
          width: "50%",
          defaultValue: {
            type: "number",
            value: 0,
          },
        },
		{
          key: `win_y`,
          label: "Overlay Y",
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
}
];

export const compile = (input, helpers) => {
  const { options, _callNative, _stackPushConst, _stackPushScriptValue, _stackPop, _addComment } = helpers;
  
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
  _stackPushScriptValue(input.h);
  _stackPushScriptValue(input.w);
  _stackPushScriptValue(input.win_y);
  _stackPushScriptValue(input.win_x);
  _stackPushScriptValue(input.bkg_y);
  _stackPushScriptValue(input.bkg_x);
  		
  _callNative("copy_background_submap_to_overlay");
  _stackPop(8);  
  
};
