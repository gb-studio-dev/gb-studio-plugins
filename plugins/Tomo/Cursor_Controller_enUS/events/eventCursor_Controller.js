/*
 * Author: Tomo (@indiegdevstdio)
 * Setups the cursor actor depending on user d-pad input and returns the results when user presses the A or B button
 */
const scriptValueHelpers = require("shared/lib/scriptValue/helpers");

export const id = "XV_CURSOR_CONTROLLER";
export const name = "Cursor Controller";
export const groups = ["XV Plugins"];

const fields = [].concat(
  [
    {
      key: "cursor_controller_tabs",
      type: "tabs",
      defaultValue: "tabSetupActor",
      values: {
        tabSetupActor: "Actor & States",
        tabBoundaries: "Boundaries",
        tabOptions: "Options",
        tabReturnValues: "Return Values",
      },
    },
  ],
  [{}],

  [{
    type: "group",
    conditions: [{key: "cursor_controller_tabs", in: ["tabSetupActor"]}],
    fields: [
      {
        label: "This event is designed to be used inside the actor's [On Update] event. It controls the selection cursor actor depending on user d-pad input and returns the results when user presses the A or B buttons. You will need a cursor actor having normal state or optional selected state.",
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
        label: "Cursor Actor (Default State)",
        description: "The selection cursor actor in its default state. This is the loop animation where the actor is in its idle state.",
        defaultValue: "$self$",
        width: "50%",
      },
      {
        key: "actor_activated_state_id",
        label: "State: Activated (Play Once)",
        description: "Specify the actor's animation state when the cursor is activated for the first time.",
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
        label: "State: Enter Item (Play Once)",
        description: "Specify the actor's animation state to be used when entered into a different item.",
        type: "animationstate",
        defaultValue: "",
        width: "50%",
      },
      {
        key: "actor_cancel_state_id",
        type: "animationstate",
        label: "State: Cancel (Play Once)",
        description: "The selection cursor animation state when user cancels the selection mode.",
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
        label: "State: Selected (Play Once)",
        description: "Specify the actor's animation state to be used when the item is selected.",
        defaultValue: "",
        width: "50%",
      },
      {
        key: "actor_selected_loop_state_id",
        label: "State: Selected-Stay (Play Loop)",
        description: "Specify the actor's animation state to be used when the item is selected, and cursor is staying in its same position.",
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
        label: "Base Pos X",
        description: "Base position-x (far left) of cursor in pixels units.",
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
        label: "Base Pos Y",
        description: "Base position-y (far top) of cursor in pixels units.",
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
        label: "Offset Pos X",
        description: "If needed, you can add an offset to the x-axes of cursor in pixels units.",
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
        label: "Offset Pos Y",
        description: "If needed, you can add an offset to the y-axes of cursor in pixels units.",
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
        label: "Move Step X",
        description: "How many pixels the cursor actor should move in the X axis when d-pad is pressed in horizontal direction.",
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
        label: "Move Step Y",
        description: "How many pixels the cursor actor should move in the Y axis when d-pad is pressed in vertical direction.",
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
        label: "Max Columns",
        description: "Specify the maximum columns or steps the cursor is allowed to move in the horizontal direction.",
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
        label: "Max Rows",
        description: "Specify the maximum rows or steps the cursor is allowed to move in the vertical direction.",
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
        label: "When the following option is enabled, the map collisions of the current scene are used to define the region in which the cursor can move. Paths with non-zero collision values will be blocked. You can also use top/bottom/left/right collisions to allow the cursor to move in one-way direction. You can also use the ladder collision type to \"jump\" or skip the cursor to the next non-collision tile. Note: The movement step must be constant (i.e., Move Step X/Y specified as variables will be ignored).",
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
        label: "Use Scene Collisions For Moveable Region",
        description: "Enable to use the current scene's map collision to define the region where the cursor can move.",
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
        label: "Collision Tile Start X",
        description: "Specify the top-left tile (x-axes) where the scene's collision begins.",
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
        label: "Collision Tile Start Y",
        description: "Specify the top-left tile (y-axes) where the scene's collision begins.",
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
        label: "Smooth movement",
        description: "Enable to animate the cursor with easing transition movement.",
        type: "checkbox",
        defaultValue: true,
        width: "50%",
      },
      {
        key: "is_move_opposite_dir_at_edge",
        label: "Reverse direction on end reached",
        description: "If 'Smooth movement' and 'Move to opposite side beyond boundary' is enabled, enabling this option will move the cursor with animation to the opposite direction until it reaches the beginning/end of column.",
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
        label: "Move to opposite side beyond boundary",
        description: "Move the cursor to the beginning or the end of the opposite side in the item list when it moves out-bound of maximum rows/columns.",
        type: "checkbox",
        defaultValue: true,
        width: "50%",
      },
      {
        key: "is_bounce_at_edge",
        label: "Bounce at dead end",
        description: "Enabling this option will play a slight bouncing animation when it reaches the item list boundary or hits a collision when [Use Scene Collisions For Moveable Region] is enabled.",
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
        label: "Move while D-pad held",
        description: "Move the cursor while the D-pad is held.",
        type: "checkbox",
        defaultValue: false,
        width: "50%",
      },
      {
        key: "is_enable_continuous_a_btn_held",
        label: "Enable 'A' button held",
        description: "Enable 'A' button to be triggered while the button is held.",
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
        label: "Change cursor index instantly",
        description: "When enabled, changes the cursor index instantly when cursor leaves the current position. If disabled, cursor index changes after the position change completes. May be useful if you want to apply pre/post script processing depending on the current cursor index.",
        type: "checkbox",
        defaultValue: false,
        width: "50%",
      },
      {
        key: "is_show_above_overlay",
        label: "Show cursor above overlay",
        description: "Shows the cursor actor above overlay.",
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
        label: "When user is not pressing A or B buttons, results stores -1. When user presses the B button, results stores 0. If A button is pressed, results stores 1. When cursor hover overs the menu item, current index stores the current menu item index, starting from 0.",
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
        label: "Store A/B results to",
        description: "Variable to store the A/B button press results.",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        width: "50%",
      },
      {
        key: "current_index",
        label: "Store current index to",
        description: "Variable to store the current cursor index.",
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
