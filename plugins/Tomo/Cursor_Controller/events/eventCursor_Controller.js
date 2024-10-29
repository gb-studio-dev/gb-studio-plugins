/*
 * Author: Tomo (@indiegdevstdio)
 * Setups the cursor actor depending on user d-pad input and returns the results when user presses the A or B button
 */
const scriptValueHelpers = require("shared/lib/scriptValue/helpers");
const l10n = require("../helpers/l10n").default;
const lang_enUS = (l10n("ACTOR") == "アクター") ? false : true;

export const id = "XV_CURSOR_CONTROLLER";
export const name = (lang_enUS) ? "Cursor Controller" : "カーソルコントローラー";
export const groups = (lang_enUS) ? ["XV Plugins"] : ["XV プラグイン"];

const fields = [].concat(
  [
    {
      key: "cursor_controller_tabs",
      type: "tabs",
      defaultValue: "tabSetupActor",
      values: {
        tabSetupActor: (lang_enUS) ? "Actor & States" : "アクターとアニメーション",
        tabBoundaries: (lang_enUS) ? "Boundaries" : "境界設定",
        tabOptions: (lang_enUS) ? "Options" : "オプション",
        tabReturnValues: (lang_enUS) ? "Return Values" : "戻り値",
      },
    },
  ],
  [{}],

  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabSetupActor"]}],
    fields: [
      {
        label: (lang_enUS) ? 
        "This event is designed to be used inside the actor's [On Update] event. It controls the selection cursor actor depending on user d-pad input and returns the results when user presses the A or B buttons. You will need a cursor actor having normal state or optional selected state." :
        "このプラグインは、アクターの [アップデート] イベント内で使用することを前提に設計されています。ユーザーの十字キー入力または A/B ボタンの入力に応じて選択カーソルを制御することができます。カーソルとして使用するデフォルトのアクターは指定する必要がありますが、アニメーションパターンはオプションです。",
        type: "label",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabSetupActor"]}],
    fields: [
      {
        key: "actor_id",
        type: "actor",
        label: (lang_enUS) ? "Cursor Actor (Default State)" : "アイドル（デフォルト）",
        description: (lang_enUS) ? 
        "The selection cursor actor in its default state. This is the loop animation where the actor is in its idle state." :
        "選択カーソルのアクター。ユーザー入力が無いアイドル状態でループ再生されるデフォルトのアニメーションパターンが設定されます。",
        defaultValue: "$self$",
        width: "50%",
      },
      {
        key: "actor_activated_state_id",
        label: (lang_enUS) ? "State: Activated (Play Once)" : "アクティブ化（一度のみ再生）",
        description: (lang_enUS) ? 
        "Specify the actor's animation state when the cursor is activated for the first time." :
        "カーソルがアクティブになった時に一度だけ再生されるアニメーションパターンです。",
        type: "animationstate",
        defaultValue: "",
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabSetupActor"]}],
    fields: [
      {
        key: "actor_enter_state_id",
        label: (lang_enUS) ? "State: Enter Item (Play Once)" : "進入（一度のみ再生）",
        description: (lang_enUS) ? "Specify the actor's animation state to be used when entered into a different item." :
        "カーソルが十字キー入力によって移動した時に、一度だけ再生されるアニメーションパターンです。",
        type: "animationstate",
        defaultValue: "",
        width: "50%",
      },
      {
        key: "actor_cancel_state_id",
        type: "animationstate",
        label: (lang_enUS) ? "State: Cancel (Play Once)" : "キャンセル（一度のみ再生）",
        description: (lang_enUS) ? "The selection cursor animation state when user cancels the selection mode." :
        "キャンセル時（B ボタン）に、一度だけ再生されるアニメーションパターンです。",
        defaultValue: "",
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabSetupActor"]}],
    fields: [
      {
        key: "actor_selected_active_state_id",
        type: "animationstate",
        label: (lang_enUS) ? "State: Selected (Play Once)" : "選択（一度のみ再生）",
        description: (lang_enUS) ? "Specify the actor's animation state to be used when the item is selected." :
        "項目選択時（A ボタン）に、一度だけ再生されるアニメーションパターンです。",
        defaultValue: "",
        width: "50%",
      },
      {
        key: "actor_selected_loop_state_id",
        label: (lang_enUS) ? "State: Selected-Stay (Play Loop)" : "選択-待機（ループ再生）",
        description: (lang_enUS) ? "Specify the actor's animation state to be used when the item is selected, and cursor is staying in its same position." :
        "項目を選択後に繰り返し再生されるアニメーションパターンです。",
        type: "animationstate",
        defaultValue: "",
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabBoundaries"]}],
    fields: [
      {
        key: "base_pos_x",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "Base Pos X" : "基本位置（X）",
        description: (lang_enUS) ? "Base position-x (far left) of cursor in pixels units." : "最左側のカーソルの基本位置（X 軸）をピクセル単位で指定します。",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
        defaultType: "number",
        defaultValue: {
          number: 12,
          variable: "LAST_VARIABLE",
        },
        width: "50%",
      },
      {
        key: "base_pos_y",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "Base Pos Y" : "基本位置（Y）",
        description: (lang_enUS) ? "Base position-y (far top) of cursor in pixels units." : "最上側のカーソルの基本位置（Y 軸）をピクセル単位で指定します。",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
        defaultType: "number",
        defaultValue: {
          number: 24,
          variable: "LAST_VARIABLE",
        },
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabBoundaries"]}],
    fields: [
      {
        key: "offset_pos_x",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "Offset Pos X" : "オフセット（X）",
        description: (lang_enUS) ? "If needed, you can add an offset to the x-axes of cursor in pixels units." : "必要に応じて X 軸のオフセットをピクセル単位で指定します。",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
        defaultType: "number",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
        },
        width: "50%",
      },
      {
        key: "offset_pos_y",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "Offset Pos Y" : "オフセット（Y）",
        description: (lang_enUS) ? "If needed, you can add an offset to the y-axes of cursor in pixels units." : "必要に応じて Y 軸のオフセットをピクセル単位で指定します。",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
        defaultType: "number",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
        },
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabBoundaries"]}],
    fields: [
      {
        key: "move_step_x",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "Move Step X" : "移動量（X）",
        description: (lang_enUS) ? 
        "How many pixels the cursor actor should move in the X axis when d-pad is pressed in horizontal direction." :
        "十字キー（X 軸方向）が入力された時に、カーソルが水平方向に移動するピクセル数を指定します。",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
        defaultType: "number",
        defaultValue: {
          number: 24,
          variable: "LAST_VARIABLE",
        },
        width: "50%",
      },
      {
        key: "move_step_y",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "Move Step Y" : "移動量（Y）",
        description: (lang_enUS) ? 
        "How many pixels the cursor actor should move in the Y axis when d-pad is pressed in vertical direction." :
        "十字キー（Y 軸方向）が入力された時に、カーソルが垂直方向に移動するピクセル数を指定します。",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
        defaultType: "number",
        defaultValue: {
          number: 24,
          variable: "LAST_VARIABLE",
        },
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabBoundaries"]}],
    fields: [
      {
        key: "max_columns",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "Max Columns" : "最大列数",
        description: (lang_enUS) ? 
        "Specify the maximum columns or steps the cursor is allowed to move in the horizontal direction." :
        "カーソルが水平方向に移動できる最大ステップ数（列）を指定します。",
        defaultType: "number",
        defaultValue: {
          number: 5,
        },
        width: "50%",
      },
      {
        key: "max_rows",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "Max Rows" : "最大行数",
        description: (lang_enUS) ? 
        "Specify the maximum rows or steps the cursor is allowed to move in the vertical direction." :
        "カーソルが垂直方向に移動できる最大ステップ数（行）を指定します。",
        defaultType: "number",
        defaultValue: {
          number: 3,
        },
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabBoundaries"]}],
    fields: [
      {
        label: (lang_enUS) ? 
        "When the following option is enabled, the map collisions of the current scene are used to define the region in which the cursor can move. Paths with non-zero collision values will be blocked. You can also use top/bottom/left/right collisions to allow the cursor to move in one-way direction. You can also use the ladder collision type to \"jump\" or skip the cursor to the next non-collision tile. Note: The movement step must be constant (i.e., Move Step X/Y specified as variables will be ignored)." :
        "以下のオプションが有効の時、シーンのマップコリジョンを利用してカーソルの移動範囲を定めることができます。コリジョンが設定されているタイルはカーソル移動ができなくなります。また、上下左右のコリジョンを設定することで、一方方向にしか移動できないカーソルを設定することもできます。コリジョン（はしご）が設定されている場合、カーソルはそのコリジョンを飛び越えて移動します。注意：この機能を正しく動作させるためには、移動量を一定に設定する必要があります（例：移動量（X）および移動量（Y）の値を可変にすることはできません）。",
        type: "label",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabBoundaries"]}],
    fields: [
      {
        key: "is_use_mappings",
        label: (lang_enUS) ? "Use Scene Collisions For Moveable Region" : "シーンのコリジョンを移動範囲として使用",
        description: (lang_enUS) ? 
        "Enable to use the current scene's map collision to define the region where the cursor can move." :
        "現在のシーンのマップコリジョンを利用してカーソルの移動範囲を定めます。",
        type: "checkbox",
        defaultValue: false,
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabBoundaries"]}],
    fields: [
      {
        key: "mapping_start_tile_x",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "Collision Tile Start X" : "コリジョンの開始タイル（X）",
        description: (lang_enUS) ? 
        "Specify the top-left tile (x-axes) where the scene's collision begins." :
        "移動範囲として設定するコリジョンの開始地点（X）をタイル座標の単位で指定します。",
        defaultType: "number",
        defaultValue: {
          number: 0,
        },
        width: "50%",
      },
      {
        key: "mapping_start_tile_y",
        type: "union",
        types: ["number", "variable"],
        label: (lang_enUS) ? "Collision Tile Start Y" : "コリジョンの開始タイル（Y）",
        description: (lang_enUS) ? 
        "Specify the top-left tile (y-axes) where the scene's collision begins." :
        "移動範囲として設定するコリジョンの開始地点（Y）をタイル座標の単位で指定します。",
        defaultType: "number",
        defaultValue: {
          number: 0,
        },
        width: "50%",
      },
    ],
  }],


  // Options Tab
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabOptions"]}],
    fields: [
      {
        key: "is_easing_movement",
        label: (lang_enUS) ? "Smooth movement" : "スムーズな移動",
        description: (lang_enUS) ? 
        "Enable to animate the cursor with easing transition movement." :
        "カーソルを滑らかなアニメーションで移動させます。",
        type: "checkbox",
        defaultValue: true,
        width: "50%",
      },
      {
        key: "is_move_opposite_dir_at_edge",
        label: (lang_enUS) ? "Reverse direction on end reached" : "境界線を越えたら向きを反転",
        description: (lang_enUS) ? 
        "If 'Smooth movement' and 'Move to opposite side beyond boundary' is enabled, enabling this option will move the cursor with animation to the opposite direction until it reaches the beginning/end of column." :
        "[スムーズな移動] および [境界線を越えたら反対側に移動] が有効の場合、カーソルが進行方向と逆方向にアニメーションしながら戻ります。",
        type: "checkbox",
        defaultValue: true,
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabOptions"]}],
    fields: [
      {
        key: "is_move_to_opposite_end_on_edge",
        label: (lang_enUS) ? "Move to opposite side beyond boundary" : "境界線を越えたら反対側に移動",
        description: (lang_enUS) ? 
        "Move the cursor to the beginning or the end of the opposite side in the item list when it moves out-bound of maximum rows/columns." :
        "カーソルが列または行の境界線を越えたら、その列または行の反対側に移動します。",
        type: "checkbox",
        defaultValue: true,
        width: "50%",
      },
      {
        key: "is_bounce_at_edge",
        label: (lang_enUS) ? "Bounce at dead end" : "移動範囲を越えたら跳ね返る",
        description: (lang_enUS) ? 
        "Enabling this option will play a slight bouncing animation when it reaches the item list boundary or hits a collision when [Use Scene Collisions For Moveable Region] is enabled." :
        "このオプションを有効にすると、カーソルが移動可能な範囲を越えようとした場合、または [シーンのコリジョンを移動範囲として使用] オプションが有効の状態でコリジョン衝突した場合に、少量の振動を与え、跳ね返るようなエフェクトアニメーションを再生します。",
        type: "checkbox",
        defaultValue: false,
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabOptions"]}],
    fields: [
      {
        key: "is_move_while_btn_held",
        label: (lang_enUS) ? "Move while D-pad held" : "十字キーが押されている間も移動",
        description: (lang_enUS) ? "Move the cursor while the D-pad is held." : "十字キーが押されている間もカーソル移動を行います。",
        type: "checkbox",
        defaultValue: false,
        width: "50%",
      },
      {
        key: "is_enable_continuous_a_btn_held",
        label: (lang_enUS) ? "Enable 'A' button held" : "「A」ボタンの長押しを有効化",
        description: (lang_enUS) ? "Enable 'A' button to be triggered while the button is held." : "「A」ボタンを押し続けている間は、常に「A」ボタンをトリガーします。",
        type: "checkbox",
        defaultValue: false,
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabOptions"]}],
    fields: [
      {
        key: "is_change_index_immediately",
        label: (lang_enUS) ? "Change cursor index instantly" : "瞬時にカーソルインデックスを変更",
        description: (lang_enUS) ? 
        "When enabled, changes the cursor index instantly when cursor leaves the current position. If disabled, cursor index changes after the position change completes. May be useful if you want to apply pre/post script processing depending on the current cursor index." :
        "有効化した場合は、カーソルが現在の位置から移動した瞬間にカーソルのインデックスを変更します。無効化した場合は、カーソルが新しい位置への移動を完了してからインデックスが変更されます。インデックスの変更のタイミングに応じて特定のスクリプトを実行したいケースなどで活用できます。",
        type: "checkbox",
        defaultValue: false,
        width: "50%",
      },
      {
        key: "is_show_above_overlay",
        label: (lang_enUS) ? "Show cursor above overlay" : "オーバーレイの上にカーソルを表示",
        description: (lang_enUS) ? "Shows the cursor actor above overlay." : "オーバーレイの上にカーソルを表示します。",
        type: "checkbox",
        defaultValue: false,
        width: "50%",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabReturnValues"]}],
    fields: [
      {
        label: (lang_enUS) ? 
        "When user is not pressing A or B buttons, results stores -1. When user presses the B button, results stores 0. If A button is pressed, results stores 1. When cursor hover overs the menu item, current index stores the current menu item index, starting from 0." :
        "「A」または「B」ボタンが押されていない場合は戻り値として -1 が設定されます。「B」ボタンが押された場合は、0 が設定されます。「A」ボタンが押された場合は、1 が設定されます。カーソルがメニューやアイテム項目の上に位置した時に、カーソルインデックスには現在のカーソルのインデックス（0 から開始するインデックス）が代入されます。",
        type: "label",
      },
    ],
  }],
  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabReturnValues"]}],
    fields: [
      {
        key: "results",
        label: (lang_enUS) ? "Store A/B results to" : "A/B ボタン押下の結果を保存する変数",
        description: (lang_enUS) ? "Variable to store the A/B button press results." : "「A」または「B」ボタンが押された時に、その結果を保存する変数を指定します。",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "current_index",
        label: (lang_enUS) ? "Store current index to" : "現在のインデックスを保存する変数",
        description: (lang_enUS) ? "Variable to store the current cursor index." : "現在のカーソルインデックスを保存する変数を指定します。",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
    ],
  }],
);

export const compile = (input, helpers) => {
  const { actor_id, actor_activated_state_id, actor_enter_state_id, actor_cancel_state_id, actor_selected_active_state_id, actor_selected_loop_state_id,
    base_pos_x, base_pos_y, offset_pos_x, offset_pos_y, move_step_x, move_step_y, max_columns, max_rows, mapping_start_tile_x, mapping_start_tile_y,
    is_easing_movement, is_move_opposite_dir_at_edge, is_move_to_opposite_end_on_edge, is_bounce_at_edge, is_move_while_btn_held,
    is_use_mappings, is_enable_continuous_a_btn_held, is_show_above_overlay, is_change_index_immediately,
    results, current_index } = input;
  const { _stackPush, getVariableAlias, _stackPushConst, _callNative, _stackPop, appendRaw, actorSetState, statesOrder, stateReferences,
    variableSetToScriptValue, variableSetToValue, _stackPushReference, actorSetById, actorSetActive, actorPushById } = helpers;
    const { precompileScriptValue, optimiseScriptValue } = scriptValueHelpers;

    // Make sure the actor to manipulate is active
    actorSetById(actor_id);
    // Push actor index to stack
    actorPushById(actor_id);

    // Push actor state to stack
    let stateIndex = statesOrder.indexOf(actor_activated_state_id);
    _stackPushConst(stateReferences[stateIndex]);
    stateIndex = statesOrder.indexOf(actor_enter_state_id);
    _stackPushConst(stateReferences[stateIndex]);
    stateIndex = statesOrder.indexOf(actor_cancel_state_id);
    _stackPushConst(stateReferences[stateIndex]);
    stateIndex = statesOrder.indexOf(actor_selected_active_state_id);
    _stackPushConst(stateReferences[stateIndex]);
    stateIndex = statesOrder.indexOf(actor_selected_loop_state_id);
    _stackPushConst(stateReferences[stateIndex]);

    // Store as bit flags for boolean values and push it as combined uint16 value
    stateID_U = (is_easing_movement ? 1 : 0) << 15 | (is_move_opposite_dir_at_edge ? 1 : 0) << 14 |
    (is_move_to_opposite_end_on_edge ? 1 : 0) << 13 | (is_bounce_at_edge ? 1 : 0) << 12 |
    (is_move_while_btn_held ? 1 : 0) << 11 | (is_enable_continuous_a_btn_held ? 1 : 0) << 10 |
    (is_show_above_overlay ? 1 : 0) << 9 | (is_use_mappings ? 1 : 0) << 8 | (is_change_index_immediately ? 1 : 0) << 7;
    _stackPushConst(stateID_U);

    // Get & push the value
    const [type_mapping_start_tile_x] = precompileScriptValue(optimiseScriptValue(mapping_start_tile_x));
    // Check if the passed value is a number or variable
    if(type_mapping_start_tile_x[0].type === "number") {
      // It was a number, so we push to stack as constant
      _stackPushConst(type_mapping_start_tile_x[0].value);
    } else if(type_mapping_start_tile_x[0].type === "variable") {
      // It was a variable, so we push to stack as variable
      const variableAlias = getVariableAlias(type_mapping_start_tile_x[0].value);
      _stackPush(variableAlias);
    }

    const [type_mapping_start_tile_y] = precompileScriptValue(optimiseScriptValue(mapping_start_tile_y));
    // Check if the passed value is a number or variable
    if(type_mapping_start_tile_y[0].type === "number") {
      // It was a number, so we push to stack as constant
      _stackPushConst(type_mapping_start_tile_y[0].value);
    } else if(type_mapping_start_tile_y[0].type === "variable") {
      // It was a variable, so we push to stack as variable
      const variableAlias = getVariableAlias(type_mapping_start_tile_y[0].value);
      _stackPush(variableAlias);
    }

    // Get & push the value
    const [type_max_columns] = precompileScriptValue(optimiseScriptValue(max_columns));
    // Check if the passed value is a number or variable
    if(type_max_columns[0].type === "number") {
      // It was a number, so we push to stack as constant
      _stackPushConst(type_max_columns[0].value);
    } else if(type_max_columns[0].type === "variable") {
      // It was a variable, so we push to stack as variable
      const variableAlias = getVariableAlias(type_max_columns[0].value);
      _stackPush(variableAlias);
    }

    const [type_max_rows] = precompileScriptValue(optimiseScriptValue(max_rows));
    // Check if the passed value is a number or variable
    if(type_max_rows[0].type === "number") {
      // It was a number, so we push to stack as constant
      _stackPushConst(type_max_rows[0].value);
    } else if(type_max_rows[0].type === "variable") {
      // It was a variable, so we push to stack as variable
      const variableAlias = getVariableAlias(type_max_rows[0].value);
      _stackPush(variableAlias);
    }

    const [type_move_step_x] = precompileScriptValue(optimiseScriptValue(move_step_x));
    // Check if the passed value is a number or variable
    if(type_move_step_x[0].type === "number") {
      // It was a number, so we push to stack as constant
      _stackPushConst(type_move_step_x[0].value);
    } else if(type_move_step_x[0].type === "variable") {
      // It was a variable, so we push to stack as variable
      const variableAlias = getVariableAlias(type_move_step_x[0].value);
      _stackPush(variableAlias);
    }

    const [type_move_step_y] = precompileScriptValue(optimiseScriptValue(move_step_y));
    // Check if the passed value is a number or variable
    if(type_move_step_y[0].type === "number") {
      // It was a number, so we push to stack as constant
      _stackPushConst(type_move_step_y[0].value);
    } else if(type_move_step_y[0].type === "variable") {
      // It was a variable, so we push to stack as variable
      const variableAlias = getVariableAlias(type_move_step_y[0].value);
      _stackPush(variableAlias);
    }

    // Get & push the value
    const [type_offset_pos_x] = precompileScriptValue(optimiseScriptValue(offset_pos_x));
    // Check if the passed value is a number or variable
    if(type_offset_pos_x[0].type === "number") {
      // It was a number, so we push to stack as constant
      _stackPushConst(type_offset_pos_x[0].value);
    } else if(type_offset_pos_x[0].type === "variable") {
      // It was a variable, so we push to stack as variable
      const variableAlias = getVariableAlias(type_offset_pos_x[0].value);
      _stackPush(variableAlias);
    }

    // Get & push the value
    const [type_offset_pos_y] = precompileScriptValue(optimiseScriptValue(offset_pos_y));
    // Check if the passed value is a number or variable
    if(type_offset_pos_y[0].type === "number") {
      // It was a number, so we push to stack as constant
      _stackPushConst(type_offset_pos_y[0].value);
    } else if(type_offset_pos_y[0].type === "variable") {
      // It was a variable, so we push to stack as variable
      const variableAlias = getVariableAlias(type_offset_pos_y[0].value);
      _stackPush(variableAlias);
    }


    // Get & push the value
    const [type_base_pos_x] = precompileScriptValue(optimiseScriptValue(base_pos_x));
    // Check if the passed value is a number or variable
    if(type_base_pos_x[0].type === "number") {
      // It was a number, so we push to stack as constant
      _stackPushConst(type_base_pos_x[0].value);
    } else if(type_base_pos_x[0].type === "variable") {
      // It was a variable, so we push to stack as variable
      const variableAlias = getVariableAlias(type_base_pos_x[0].value);
      _stackPush(variableAlias);
    }

    // Get & push the value
    const [type_base_pos_y] = precompileScriptValue(optimiseScriptValue(base_pos_y));
    // Check if the passed value is a number or variable
    if(type_base_pos_y[0].type === "number") {
      // It was a number, so we push to stack as constant
      _stackPushConst(type_base_pos_y[0].value);
    } else if(type_base_pos_y[0].type === "variable") {
      // It was a variable, so we push to stack as variable
      const variableAlias = getVariableAlias(type_base_pos_y[0].value);
      _stackPush(variableAlias);
    }

    // Get & push the reference for variable to store current cursor index
    const [varcurrent_index] = precompileScriptValue(optimiseScriptValue(current_index));
    _stackPushReference(getVariableAlias(varcurrent_index[0]));
    // Get & push the reference for variable results
    const [rvar_results] = precompileScriptValue(optimiseScriptValue(results));
    _stackPushReference(getVariableAlias(rvar_results[0]));

    // Call native function on engine side
    _callNative("CursorController");

    // Remove pushed values from stack
    _stackPop(19);
};

module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
};
