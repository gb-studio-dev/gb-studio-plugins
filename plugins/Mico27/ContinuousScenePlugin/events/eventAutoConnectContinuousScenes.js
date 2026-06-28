export const id = "EVENT_AUTO_CONNECT_CONTINUOUS_SCENE";
export const name = "Auto Connect Continuous Scene";
export const groups = ["EVENT_GROUP_SCENE"];

export const autoLabel = (fetchArg) => {
  return `Auto Connect Continuous Scene`;
};

export const fields = [
  {
    key: `scene_data_symbol_prefix`,
    label: "Scene data symbol prefix",
    type: "text",
  },
  {
    key: `loop_horizontally`,
    label: "Loop Horizontally",
    description: "Whether to connect scenes on the left and right edges of the map",
    type: "checkbox",
  },
  {
    key: `loop_vertically`,
    label: "Loop Vertically",
    description: "Whether to connect scenes on the top and bottom edges of the map",
    type: "checkbox",
  },
];


export const compile = (input, helpers) => {
    const { options, writeAsset, _getAvailableSymbol } = helpers;

    const { scenes } = options;

    let left_most_scene_left_edge = Infinity;
    let right_most_scene_right_edge = -Infinity;
    let top_most_scene_top_edge = Infinity;
    let bottom_most_scene_bottom_edge = -Infinity;
    let scene_connections = [];
    //For each scene, check for any other scenes that are right next to it and create a connection object for them
    scenes.forEach((scene) => {
        //if scene gbvm symbol doesnt start by scene_data_symbol_prefix, skip it
        if (!scene.symbol.startsWith(input.scene_data_symbol_prefix)) {
            return;
        }
        const connections = [];
        const scene_left = scene.x >> 3;
        const scene_right = scene_left + scene.width;
        const scene_top = scene.y >> 3;
        const scene_bottom = scene_top + scene.height;
        if (scene_left < left_most_scene_left_edge) {
            left_most_scene_left_edge = scene_left;
        }
        if (scene_right > right_most_scene_right_edge) {
            right_most_scene_right_edge = scene_right;
        }
        if (scene_top < top_most_scene_top_edge) {
            top_most_scene_top_edge = scene_top;
        }
        if (scene_bottom > bottom_most_scene_bottom_edge) {
            bottom_most_scene_bottom_edge = scene_bottom;
        }
        scenes.forEach((other_scene) => {
            if (scene.id === other_scene.id) {
                return;
            }
            if (!other_scene.symbol.startsWith(input.scene_data_symbol_prefix)) {
                return;
            }
            const other_scene_left = other_scene.x >> 3;
            const other_scene_right = other_scene_left + other_scene.width;
            const other_scene_top = other_scene.y >> 3;
            const other_scene_bottom = other_scene_top + other_scene.height;
            if (scene_right === other_scene_left && scene_top < other_scene_bottom && scene_bottom > other_scene_top) {
                connections.push({
                    scene_symbol: other_scene.symbol,
                    direction: 1, //right
                    offset: scene_top - other_scene_top,
                });
            } else if (scene_left === other_scene_right && scene_top < other_scene_bottom && scene_bottom > other_scene_top) {
                connections.push({
                    scene_symbol: other_scene.symbol,
                    direction: 3, //left
                    offset: scene_top - other_scene_top,
                });
            } else if (scene_bottom === other_scene_top && scene_left < other_scene_right && scene_right > other_scene_left) {
                connections.push({
                    scene_symbol: other_scene.symbol,
                    direction: 2, //bottom
                    offset: scene_left - other_scene_left,
                });
            } else if (scene_top === other_scene_bottom && scene_left < other_scene_right && scene_right > other_scene_left) {
                connections.push({
                    scene_symbol: other_scene.symbol,
                    direction: 0, //top
                    offset: scene_left - other_scene_left,
                });
            } else if (scene_right === other_scene_left && scene_bottom === other_scene_top) {
                connections.push({
                    scene_symbol: other_scene.symbol,
                    direction: 6, //bottom right
                    offset: 0,
                });
            } else if (scene_left === other_scene_right && scene_bottom === other_scene_top) {
                connections.push({
                    scene_symbol: other_scene.symbol,
                    direction: 7, //bottom left
                    offset: 0,
                });
            } else if (scene_right === other_scene_left && scene_top === other_scene_bottom) {
                connections.push({
                    scene_symbol: other_scene.symbol,
                    direction: 5, //top right
                    offset: 0,
                });
            } else if (scene_left === other_scene_right && scene_top === other_scene_bottom) {
                connections.push({
                    scene_symbol: other_scene.symbol,
                    direction: 4, //top left
                    offset: 0,
                });
            }
        });
        scene_connections.push({
            scene: scene,
            scene_symbol: scene.symbol,
            connections,
        });
    });
    if (input.loop_horizontally) {
        //connect left most scenes to right most scenes
        const left_most_scenes = scenes.filter((scene) => (scene.x >> 3) === left_most_scene_left_edge && scene.symbol.startsWith(input.scene_data_symbol_prefix));
        const right_most_scenes = scenes.filter((scene) => ((scene.x >> 3) + (scene.width)) === right_most_scene_right_edge && scene.symbol.startsWith(input.scene_data_symbol_prefix));
        left_most_scenes.forEach((left_scene) => {
            const left_scene_top = left_scene.y >> 3;
            const left_scene_bottom = left_scene_top + (left_scene.height);
            right_most_scenes.forEach((right_scene) => {
                const right_scene_top = right_scene.y >> 3;
                const right_scene_bottom = right_scene_top + (right_scene.height);
                if ((left_scene_top >= right_scene_top && left_scene_top < right_scene_bottom) || (left_scene_bottom > right_scene_top && left_scene_bottom <= right_scene_bottom)) {
                    const offset = left_scene_top - right_scene_top;
                    scene_connections.find((s) => s.scene_symbol === left_scene.symbol).connections.push({
                        scene_symbol: right_scene.symbol,
                        direction: 3, //left
                        offset: -offset,
                    });
                    scene_connections.find((s) => s.scene_symbol === right_scene.symbol).connections.push({
                        scene_symbol: left_scene.symbol,
                        direction: 1, //right
                        offset,
                    });
                } else if (left_scene_top === right_scene_bottom) {
                    scene_connections.find((s) => s.scene_symbol === left_scene.symbol).connections.push({
                        scene_symbol: right_scene.symbol,
                        direction: 4, //top left
                        offset: 0,
                    });
                    scene_connections.find((s) => s.scene_symbol === right_scene.symbol).connections.push({
                        scene_symbol: left_scene.symbol,
                        direction: 6, //bottom right
                        offset: 0,
                    });
                } else if (left_scene_bottom === right_scene_top) {
                    scene_connections.find((s) => s.scene_symbol === left_scene.symbol).connections.push({
                        scene_symbol: right_scene.symbol,
                        direction: 7, //bottom left
                        offset: 0,
                    });
                    scene_connections.find((s) => s.scene_symbol === right_scene.symbol).connections.push({
                        scene_symbol: left_scene.symbol,
                        direction: 5, //top right
                        offset: 0,
                    });
                }
            });
        });
    }
    if (input.loop_vertically) {
        //connect top most scenes to bottom most scenes
        const top_most_scenes = scenes.filter((scene) => (scene.y >> 3) === top_most_scene_top_edge && scene.symbol.startsWith(input.scene_data_symbol_prefix));
        const bottom_most_scenes = scenes.filter((scene) => ((scene.y >> 3) + (scene.height)) === bottom_most_scene_bottom_edge && scene.symbol.startsWith(input.scene_data_symbol_prefix));
        top_most_scenes.forEach((top_scene) => {
            const top_scene_left = top_scene.x >> 3;
            const top_scene_right = top_scene_left + (top_scene.width);
            bottom_most_scenes.forEach((bottom_scene) => {
                const bottom_scene_left = bottom_scene.x >> 3;
                const bottom_scene_right = bottom_scene_left + (bottom_scene.width);
                if ((top_scene_left >= bottom_scene_left && top_scene_left < bottom_scene_right) || (top_scene_right > bottom_scene_left && top_scene_right <= bottom_scene_right)) {
                    const offset = top_scene_left - bottom_scene_left;
                    scene_connections.find((s) => s.scene_symbol === top_scene.symbol).connections.push({
                        scene_symbol: bottom_scene.symbol,
                        direction: 0, //top
                        offset: -offset,
                    });
                    scene_connections.find((s) => s.scene_symbol === bottom_scene.symbol).connections.push({
                        scene_symbol: top_scene.symbol,
                        direction: 2, //bottom
                        offset,
                    });
                } else if (top_scene_left === bottom_scene_right) {
                    scene_connections.find((s) => s.scene_symbol === top_scene.symbol).connections.push({
                        scene_symbol: bottom_scene.symbol,
                        direction: 4, //top left
                        offset: 0,
                    });
                    scene_connections.find((s) => s.scene_symbol === bottom_scene.symbol).connections.push({
                        scene_symbol: top_scene.symbol,
                        direction: 6, //bottom right
                        offset: 0,
                    });
                } else if (bottom_scene_left === top_scene_right) {
                    scene_connections.find((s) => s.scene_symbol === top_scene.symbol).connections.push({
                        scene_symbol: bottom_scene.symbol,
                        direction: 5, //top right
                        offset: 0,
                    });
                    scene_connections.find((s) => s.scene_symbol === bottom_scene.symbol).connections.push({
                        scene_symbol: top_scene.symbol,
                        direction: 7, //bottom left
                        offset: 0,
                    });
                }
            });
        });
    }

    if (input.loop_horizontally && input.loop_vertically) {
        //connect corner scenes
        const top_left_scene = scenes.find((scene) => (scene.x >> 3) === left_most_scene_left_edge && (scene.y >> 3) === top_most_scene_top_edge && scene.symbol.startsWith(input.scene_data_symbol_prefix));
        const bottom_right_scene = scenes.find((scene) => ((scene.x >> 3) + (scene.width)) === right_most_scene_right_edge && ((scene.y >> 3) + (scene.height)) === bottom_most_scene_bottom_edge && scene.symbol.startsWith(input.scene_data_symbol_prefix));
        if (top_left_scene && bottom_right_scene) {
            const top_left_scene_left = top_left_scene.x >> 3;
            const bottom_right_scene_right = (bottom_right_scene.x >> 3) + bottom_right_scene.width;
            if (top_left_scene_left === (bottom_right_scene_right - (right_most_scene_right_edge - left_most_scene_left_edge))) {
                scene_connections.find((s) => s.scene_symbol === top_left_scene.symbol).connections.push({
                    scene_symbol: bottom_right_scene.symbol,
                    direction: 4, //top left
                    offset: 0,
                });
                scene_connections.find((s) => s.scene_symbol === bottom_right_scene.symbol).connections.push({
                    scene_symbol: top_left_scene.symbol,
                    direction: 6, //bottom right
                    offset: 0,
                });
            }
        }
        const top_right_scene = scenes.find((scene) => ((scene.x >> 3) + (scene.width)) === right_most_scene_right_edge && (scene.y >> 3) === top_most_scene_top_edge && scene.symbol.startsWith(input.scene_data_symbol_prefix));
        const bottom_left_scene = scenes.find((scene) => (scene.x >> 3) === left_most_scene_left_edge && ((scene.y >> 3) + (scene.height)) === bottom_most_scene_bottom_edge && scene.symbol.startsWith(input.scene_data_symbol_prefix));
        if (top_right_scene && bottom_left_scene) {
            const top_right_scene_right = (top_right_scene.x >> 3) + top_right_scene.width;
            const bottom_left_scene_left = bottom_left_scene.x >> 3;
            if (top_right_scene_right === (bottom_left_scene_left + (right_most_scene_right_edge - left_most_scene_left_edge))) {
                scene_connections.find((s) => s.scene_symbol === top_right_scene.symbol).connections.push({
                    scene_symbol: bottom_left_scene.symbol,
                    direction: 5, //top right
                    offset: 0,
                });
                scene_connections.find((s) => s.scene_symbol === bottom_left_scene.symbol).connections.push({
                    scene_symbol: top_right_scene.symbol,
                    direction: 7, //bottom left
                    offset: 0,
                });
            }
        }
    }
    //sort connections by direction
    scene_connections.forEach((scene_connection) => {
        scene_connection.connections.sort((a, b) => a.direction - b.direction);
    });

    //throw new Error(JSON.stringify(scene_connections));

    const scene_connections_symbol = _getAvailableSymbol(input.scene_data_symbol_prefix + "_scene_connections");

    let sceneConnectionsIncludes = "";
    let sceneConnectionsData = "";
    let sceneConnectionCounter = 0;
    scene_connections.forEach((scene_connection) => {
        if (scene_connection.connections.length === 0) {
            return;
        }
        //insert GBVM event in scene scripts to set continuous scenes based on connections, using set_continuous_scene native, with scene id and offset for each connection. This will be done by pushing the event in the scene's script commands array right before the first command that isn't a set_scene_command, or at the end of the script if all commands are set_scene_commands. The event will have the scene connections data as arguments, and the compile function of the event will generate the necessary code to set the continuous scenes based on the
        const loadContinuousScenesEvent = {
          id: `load_scene_connections_${input.scene_data_symbol_prefix}_${sceneConnectionCounter}`,
          command: "EVENT_GBVM_SCRIPT",
          args: {
            "script": `VM_PUSH_CONST ${sceneConnectionCounter}\nVM_PUSH_CONST _${scene_connections_symbol}\nVM_PUSH_CONST ___bank_${scene_connections_symbol}\nVM_CALL_NATIVE b_load_scene_connections, _load_scene_connections\n`,
          },
        };
        scene_connection.scene.script.unshift(loadContinuousScenesEvent);
        const connections_formatted = [0, 0, 0, 0, 0, 0, 0, 0].map((_, i) => {
            const connection = scene_connection.connections.find((c) => c.direction === i);
            if (connection) {
                if (!sceneConnectionsIncludes.includes(`data/${connection.scene_symbol}.h`)) {
                    sceneConnectionsIncludes += `      #include "data/${connection.scene_symbol}.h"\n`
                }
                return `{ TO_FAR_PTR_T(${connection.scene_symbol}), ${connection.offset} }`;
            } else {
                return `{ {NULL, NULL}, 0 }`;
            }
        }).join(", ");
        sceneConnectionsData += `          ${connections_formatted},\n`;
        sceneConnectionCounter++;
    });

  writeAsset(
      `${scene_connections_symbol}.c`,
      `#pragma bank 255

      #include "data/${scene_connections_symbol}.h"
      #include "bankdata.h"
      #include "continuous_scene.h"
${sceneConnectionsIncludes}

      BANKREF(${scene_connections_symbol})

      const scene_connection_t ${scene_connections_symbol}[] = {
${sceneConnectionsData}
      };`
    );

  writeAsset(
      `${scene_connections_symbol}.h`,
      `#ifndef __${scene_connections_symbol}_INCLUDE__
      #define __${scene_connections_symbol}_INCLUDE__

      #include "bankdata.h"
      #include "continuous_scene.h"

      BANKREF_EXTERN(${scene_connections_symbol})
      extern const scene_connection_t ${scene_connections_symbol}[];

      #endif
      `
    );

};