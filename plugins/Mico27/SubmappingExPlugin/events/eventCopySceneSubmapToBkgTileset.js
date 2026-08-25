export const id = "EVENT_COPY_BKG_SUBMAP_TO_BKG_TILESET";
export const name = "Copy scene submap to background tileset";
export const groups = ["EVENT_GROUP_SCREEN"];

export const autoLabel = (fetchArg) => {
  return `Copy scene submap to background tileset`;
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
    label: "copy tile attributes to",
    key: "copy_attr",
    type: "select",
    width: "100%",
    options: [
        ["none", "None"],
        ["background", "Background"],
        ["overlay", "Overlay"],
    ],
    defaultValue: "none",
    alignBottom: true,
},
{
    type: "group",
    fields: [
        {
            key: `overlay_x`,
            label: "Overlay X",
            type: "value",
            width: "50%",
            defaultValue: {
            type: "number",
            value: 0,
            },
            conditions: [
            {
                key: "copy_attr",
                eq: "overlay",
            },
            ],
        },
        {
            key: `overlay_y`,
            label: "Overlay Y",
            type: "value",
            width: "50%",
            defaultValue: {
            type: "number",
            value: 0,
            },
            conditions: [
            {
                key: "copy_attr",
                eq: "overlay",
            },
            ],
        },
    ]
},
{
    key: "relative_to_scroll",
    label: "Destination relative to camera scroll",
    description:
      "When enabled, Destination X/Y are screen coordinates: (0,0) is the top-left tile currently visible and the camera's scroll position is added automatically. When disabled, they are absolute scene tile coordinates. Overlay X/Y are never affected.",
    type: "checkbox",
    width: "100%",
},
];

export const compile = (input, helpers) => {
  const __submapFeatureEnabled = (key) => {
    const fv = helpers.engineFieldValues && helpers.engineFieldValues.find((s) => s.id === key);
    if (fv && fv.value !== undefined && fv.value !== null) return !!fv.value;
    const def = helpers.engineFields && helpers.engineFields[key];
    return def ? !!def.defaultValue : true;
  };
  if (!__submapFeatureEnabled("SUBMAP_ENABLE_COPY_SCENE_TO_TILESET")) {
    throw new Error("This event requires the \"Copy scene submap to background tileset\" engine setting to be enabled (Settings → Engine → Submapping Ex).");
  }

  const { options, _callNative, _rpn, _stackPushScriptValue, _stackPushConst, _stackPop, _addComment } = helpers;

  _addComment("Copy scene submap to background tileset");

  // Resolve the scene before pushing anything, so the "scene not found" bail
  // out cannot leave the stack unbalanced.
  let scene;
  if (!input.use_far_ptr) {
    const { scenes } = options;
    scene = scenes.find((s) => s.id === input.sceneId);
    if (!scene) {
        return;
    }
  }

  // Pushed first so it lands in the deepest argument slot: the .ARGn indices
  // used by the packing RPN below are relative to the top of the stack and so
  // are unaffected, and it ends up as the native's last argument.
  _stackPushConst(input.relative_to_scroll ? 1 : 0);

  if (input.use_far_ptr){
    _stackPushScriptValue(input.scene_ptr);
    _stackPushScriptValue(input.scene_bank);
  } else {
    _stackPushConst(`_${scene.symbol}`);
    _stackPushConst(`___bank_${scene.symbol}`);
  }
  if (input.copy_attr === "background"){
      _stackPushConst(1);
  } else if (input.copy_attr === "overlay"){
      _stackPushConst(2);
  } else {
      _stackPushConst(0);
  }
  if (input.copy_attr === "overlay"){
    _stackPushScriptValue(input.overlay_x);
    _stackPushScriptValue(input.overlay_y);
  } else {
    _stackPushConst(0);
    _stackPushConst(0);
  }
  _stackPushScriptValue(input.w);
  _stackPushScriptValue(input.h);
  _stackPushScriptValue(input.dest_x);
  _stackPushScriptValue(input.dest_y);
  _stackPushScriptValue(input.source_x);
  _stackPushScriptValue(input.source_y);

  _rpn()  .ref(".ARG6").int16(256).operator(".MUL")        // (overlay_y << 8) | overlay_x
          .ref(".ARG7")
          .operator(".B_OR")
          .refSet(".ARG7")
          .ref(".ARG4").int16(256).operator(".MUL")        // (h << 8) | w
          .ref(".ARG5")
          .operator(".B_OR")
          .refSet(".ARG6")
          .ref(".ARG2").int16(256).operator(".MUL")        // (dest_y << 8) | dest_x
          .ref(".ARG3")
          .operator(".B_OR")
          .refSet(".ARG5")
          .ref(".ARG0").int16(256).operator(".MUL")     // (source_y << 8) | source_x
          .ref(".ARG1")
          .operator(".B_OR")
          .refSet(".ARG4")
          .stop();

  _stackPop(4);
  _callNative("copy_background_submap_to_tileset");
  _stackPop(8);

};
