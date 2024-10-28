/*
 * Author: Tomo (@indiegdevstdio)
 * Setups the cursor actor depending on user d-pad input and returns the results when user presses the A or B button
 */
const scriptValueHelpers = require("shared/lib/scriptValue/helpers");

export const id = "XV_CURSOR_CONTROLLER";
export const name = "カーソルコントローラー";
export const groups = ["XV プラグイン"];

const fields = [].concat(
  [
    {
      key: "cursor_controller_tabs",
      type: "tabs",
      defaultValue: "tabSetupActor",
      values: {
        tabSetupActor: "アクターとアニメーション",
        tabBoundaries: "境界設定",
        tabOptions: "オプション",
        tabReturnValues: "戻り値",
      },
    },
  ],
  [{}],

  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabSetupActor"]}],
    fields: [
      {
        label: "このプラグインは、アクターの [アップデート] イベント内で使用することを前提に設計されています。ユーザーの十字キー入力または A/B ボタンの入力に応じて選択カーソルを制御することができます。カーソルとして使用するデフォルトのアクターは指定する必要がありますが、アニメーションパターンはオプションです。",
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
        label: "アイドル（デフォルト）",
        description: "選択カーソルのアクター。ユーザー入力が無いアイドル状態でループ再生されるデフォルトのアニメーションパターンが設定されます。",
        defaultValue: "$self$",
        width: "50%",
      },
      {
        key: "actor_activated_state_id",
        label: "アクティブ化（一度のみ再生）",
        description: "カーソルがアクティブになった時に一度だけ再生されるアニメーションパターンです。",
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
        label: "進入（一度のみ再生）",
        description: "カーソルが十字キー入力によって移動した時に、一度だけ再生されるアニメーションパターンです。",
        type: "animationstate",
        defaultValue: "",
        width: "50%",
      },
      {
        key: "actor_cancel_state_id",
        type: "animationstate",
        label: "キャンセル（一度のみ再生）",
        description: "キャンセル時（B ボタン）に、一度だけ再生されるアニメーションパターンです。",
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
        label: "選択（一度のみ再生）",
        description: "項目選択時（A ボタン）に、一度だけ再生されるアニメーションパターンです。",
        defaultValue: "",
        width: "50%",
      },
      {
        key: "actor_selected_loop_state_id",
        label: "選択-待機（ループ再生）",
        description: "項目を選択後に繰り返し再生されるアニメーションパターンです。",
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
        label: "基本位置（X）",
        description: "最左側のカーソルの基本位置（X 軸）をピクセル単位で指定します。",
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
        label: "基本位置（Y）",
        description: "最上側のカーソルの基本位置（Y 軸）をピクセル単位で指定します。",
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
        label: "オフセット（X）",
        description: "必要に応じて X 軸のオフセットをピクセル単位で指定します。",
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
        label: "オフセット（Y）",
        description: "必要に応じて Y 軸のオフセットをピクセル単位で指定します。",
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
        label: "移動量（X）",
        description: "十字キー（X 軸方向）が入力された時に、カーソルが水平方向に移動するピクセル数を指定します。",
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
        label: "移動量（Y）",
        description: "十字キー（Y 軸方向）が入力された時に、カーソルが垂直方向に移動するピクセル数を指定します。",
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
        label: "最大列数",
        description: "カーソルが水平方向に移動できる最大ステップ数（列）を指定します。",
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
        label: "最大行数",
        description: "カーソルが垂直方向に移動できる最大ステップ数（行）を指定します。",
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
        label: "以下のオプションが有効の時、シーンのマップコリジョンを利用してカーソルの移動範囲を定めることができます。コリジョンが設定されているタイルはカーソル移動ができなくなります。また、上下左右のコリジョンを設定することで、一方方向にしか移動できないカーソルを設定することもできます。コリジョン（はしご）が設定されている場合、カーソルはそのコリジョンを飛び越えて移動します。注意：この機能を正しく動作させるためには、移動量を一定に設定する必要があります（例：移動量（X）および移動量（Y）の値を可変にすることはできません）。",
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
        label: "シーンのコリジョンを移動範囲として使用",
        description: "現在のシーンのマップコリジョンを利用してカーソルの移動範囲を定めます。",
        type: "checkbox",
        defaultValue: true,
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
        label: "コリジョンの開始タイル（X）",
        description: "移動範囲として設定するコリジョンの開始地点（X）をタイル座標の単位で指定します。",
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
        label: "コリジョンの開始タイル（Y）",
        description: "移動範囲として設定するコリジョンの開始地点（Y）をタイル座標の単位で指定します。",
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
        label: "スムーズな移動",
        description: "カーソルを滑らかなアニメーションで移動させます。",
        type: "checkbox",
        defaultValue: true,
        width: "50%",
      },
      {
        key: "is_move_opposite_dir_at_edge",
        label: "境界線を越えたら向きを反転",
        description: "[スムーズな移動] および [境界線を越えたら反対側に移動] が有効の場合、カーソルが進行方向と逆方向にアニメーションしながら戻ります。",
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
        label: "境界線を越えたら反対側に移動",
        description: "カーソルが列または行の境界線を越えたら、その列または行の反対側に移動します。",
        type: "checkbox",
        defaultValue: true,
        width: "50%",
      },
      {
        key: "is_bounce_at_edge",
        label: "移動範囲を越えたら跳ね返る",
        description: "このオプションを有効にすると、カーソルが移動可能な範囲を越えようとした場合、または [シーンのコリジョンを移動範囲として使用] オプションが有効の状態でコリジョン衝突した場合に、少量の振動を与え、跳ね返るようなエフェクトアニメーションを再生します。",
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
        label: "十字キーが押されている間も移動",
        description: "十字キーが押されている間もカーソル移動を行います。",
        type: "checkbox",
        defaultValue: false,
        width: "50%",
      },
      {
        key: "is_enable_continuous_a_btn_held",
        label: "「A」ボタンの長押しを有効化",
        description: "「A」ボタンを押し続けている間は、常に「A」ボタンをトリガーします。",
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
        label: "瞬時にカーソルインデックスを変更",
        description: "有効化した場合は、カーソルが現在の位置から移動した瞬間にカーソルのインデックスを変更します。無効化した場合は、カーソルが新しい位置への移動を完了してからインデックスが変更されます。インデックスの変更のタイミングに応じて特定のスクリプトを実行したいケースなどで活用できます。",
        type: "checkbox",
        defaultValue: false,
        width: "50%",
      },
      {
        key: "is_show_above_overlay",
        label: "オーバーレイの上にカーソルを表示",
        description: "オーバーレイの上にカーソルを表示します。",
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
        label: "「A」または「B」ボタンが押されていない場合は戻り値として -1 が設定されます。「B」ボタンが押された場合は、0 が設定されます。「A」ボタンが押された場合は、1 が設定されます。カーソルがメニューやアイテム項目の上に位置した時に、カーソルインデックスには現在のカーソルのインデックス（0 から開始するインデックス）が代入されます。",
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
        label: "A/B ボタン押下の結果を保存する変数",
        description: "「A」または「B」ボタンが押された時に、その結果を保存する変数を指定します。",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "current_index",
        label: "現在のインデックスを保存する変数",
        description: "現在のカーソルインデックスを保存する変数を指定します。",
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
