/*--..--..--..--..--..--..--..--..--..--..--..--..--..--..--..--..--..--..--.
/ .. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \
\ \/\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ \/ /
 \/ /`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'\/ /
 / /\                                                                    / /\
/ /\ \      ,---,.                                                      / /\ \
\ \/ /    ,'  .' |                 ,---,                                \ \/ /
 \/ /   ,---.'   |               ,---.'|                                 \/ /
 / /\   |   |   .'               |   | :                                 / /\
/ /\ \  :   :  :    ,--.--.      |   | |   ,---.                        / /\ \
\ \/ /  :   |  |-, /       \   ,--.__| |  /     \                       \ \/ /
 \/ /   |   :  ;/|.--.  .-. | /   ,'   | /    /  |                       \/ /
 / /\   |   |   .' \__\/: . ..   '  /  |.    ' / |                       / /\
/ /\ \  '   :  '   ," .--.; |'   ; |:  |'   ;   /|                      / /\ \
\ \/ /  |   |  |  /  /  ,.  ||   | '/  ''   |  / |                      \ \/ /
 \/ /   |   :  \ ;  :   .'   \   :    :||   :    |                       \/ /
 / /\   |   | ,' |  ,     .-./\   \  /   \   \  /                        / /\
/ /\ \  `----'    `--`---'     `----'     `----'                        / /\ \
\ \/ /    .--.--.       ___                                   ___       \ \/ /
 \/ /    /  /    '.   ,--.'|_                               ,--.'|_      \/ /
 / /\   |  :  /`. /   |  | :,'   __  ,-.                    |  | :,'     / /\
/ /\ \  ;  |  |--`    :  : ' : ,' ,'/ /|                    :  : ' :    / /\ \
\ \/ /  |  :  ;_    .;__,'  /  '  | |' | ,---.     ,---.  .;__,'  /     \ \/ /
 \/ /    \  \    `. |  |   |   |  |   ,'/     \   /     \ |  |   |       \/ /
 / /\     `----.   \:__,'| :   '  :  / /    /  | /    /  |:__,'| :       / /\
/ /\ \    __ \  \  |  '  : |__ |  | ' .    ' / |.    ' / |  '  : |__    / /\ \
\ \/ /   /  /`--'  /  |  | '.'|;  : | '   ;   /|'   ;   /|  |  | '.'|   \ \/ /
 \/ /   '--'.     /   ;  :    ;|  , ; '   |  / |'   |  / |  ;  :    ;    \/ /
 / /\     `--'---'    |  ,   /  ---'  |   :    ||   :    |  |  ,   /     / /\
/ /\ \                 ---`-'          \   \  /  \   \  /    ---`-'     / /\ \
\ \/ /                                  `----'    `----'                \ \/ /
 \/ /                                                                    \/ /
 / /\.--..--..--..--..--..--..--..--..--..--..--..--..--..--..--..--..--./ /\
/ /\ \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \/\ \
\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `' /
 `--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'

	https://gearfo.itch.io/fade-street

	GB Studio events to create perceptually correct-ish colour fades.
	
	"Standard Fade with Colour Cycle" is similar to "Standard Fade", but
	adds the ability to create a colour cycle from selected palette
	slots that are part of the fade.
 */

const id = "GF_EVENT_FADE_STREET_STANDARD_CYCLE";
const groups = ["Fade Street"];
const subGroups = {"Fade Street": "Colour Mode - Fade And Colour Cycle"};
const description = "Like a Standard Fade event with the option of cycling colours through selected palette slots. The base fade is between two selected palettes. Set the start and end points to the same palette if you just want a cycle with no fade. The cycle loops seamlessly. If the total length of the fade (in time) is longer than the length of a cycle, extra iterations of the cycle will be inserted so that the event ends exactly as a cycle ends."; 
const name = "Standard Fade with Colour Cycle";

const autoLabel = (fetchArg) => {
	const fade_steps = (fetchArg("fade_steps"));
	const fade_wait_frames = fetchArg("fade_frames");
	const cycle_wait_frames = fetchArg("cycle_frames");
	let cycle_steps = 0;
	for (let p = 0; p < 8; ++p) {
		let in1 = fetchArg("bkg" + p +"_start");
		let in2 = fetchArg("bkg" + p +"_end");
		if (in1 != "keep" && in2 != "keep") {
			for (let c = 0; c < 4; ++c) {
				if (fetchArg("bkg" + p + "_use" + c)==="true") {
					++cycle_steps;
				}
			}
		}
		if (fetchArg("obj" + p + "_start") != "keep") {
			for (let c = 0; c < 4; ++c) {
				if (c == 2) {
					continue;
				}
				if (fetchArg("obj" + p + "_use" + c)==="true") {
					++cycle_steps;
				}
			}
		}
	}
	let total_frames = cycle_steps * cycle_wait_frames;
	let cycle_count = 1;
	if (total_frames == 0) {
		total_frames = fade_steps * fade_wait_frames;
		cycle_count = 0;
	} else {
		while (total_frames < fade_steps * fade_wait_frames) {
			++cycle_count;
			total_frames += cycle_steps * cycle_wait_frames;
		}
	}
	return `Standard Fade with Colour Cycle (${total_frames} frames, ${cycle_count} full cycles)`;
}

const fields = [
	{
		type: "group",
		fields: [
			{
				label: "Fade steps:",
				description: "Steps in the gradient, including both end points.",
				width: "50%",
			},
			{
				key: "fade_steps",
				type: "number",
				max: 100,
				min: 2,
				defaultValue: 8,
			},
		],
	},
	{
		type: "group",
		fields: [
			{
				label: "Frames per step - fade",
				description: "Frames to wait between each step in the fade. (There are about 60 frames per second).",
				width: "50%",
			},
			{
				key: "fade_frames",
				type: "number",
				max: 120,
				min: 1,
				defaultValue: 6,
			},
		],
	},
	{
		type: "group",
		fields: [
			{
				label: "Frames per step - cycle",
				description: "Frames to wait between each step in the cycle. (There are about 60 frames per second).",
				width: "50%",
			},
			{
				key: "cycle_frames",
				type: "number",
				max: 120,
				min: 1,
				defaultValue: 6,
			},
		],
	},
	{
		key: "reverse",
		label: "Reverse cycle direction",
		description: "Checking this box causes the colours to run through the palette slots in the reverse order.",
		type: "checkbox",
		defaultValue: false,
	},
	{
		type: "group",
		fields: [
			{
				label: "BKG start pals:",
				description: "Background palettes at the beginning of the colour fade. These should usually match the palettes that are already loaded.",
			},
			{
				label: "BKG end pals:",
				description: "Background palettes at the end of the colour fade.",
			},
			{
				label: "Cycle Colours:",
				description: "Selected colour slots are part of the colour cycle. That means that the colours in these slots rotate through each slot. At every step of the cycle, the colours move along by one slot. The slots are ordered from top to bottom and left to right in this list. Background palette 1 comes before background palette 8, which comes before sprite palette 1, and within each palette, colour 0 comes before colour 1.",
			},
		]
	},
	{
		type: "group",
		fields: [
			{
				key: "bkg0_start",
				type: "palette",
				paletteIndex: 0,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "bkg0_start",
						ne: "keep",
					},
				],
				key: "bkg0_end",
				type: "palette",
				paletteIndex: 0,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "bkg0_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg0_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg0_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "bkg0_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg0_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg0_use2",
						label: "2",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg0_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},
	{
		type: "group",
		fields: [
			{
				key: "bkg1_start",
				type: "palette",
				paletteIndex: 1,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "bkg1_start",
						ne: "keep",
					},
				],
				key: "bkg1_end",
				type: "palette",
				paletteIndex: 1,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "bkg1_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg1_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg1_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "bkg1_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg1_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg1_use2",
						label: "2",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg1_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "bkg2_start",
				type: "palette",
				paletteIndex: 2,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "bkg2_start",
						ne: "keep",
					},
				],
				key: "bkg2_end",
				type: "palette",
				paletteIndex: 2,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "bkg2_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg2_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg2_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "bkg2_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg2_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg2_use2",
						label: "2",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg2_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "bkg3_start",
				type: "palette",
				paletteIndex: 3,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "bkg3_start",
						ne: "keep",
					},
				],
				key: "bkg3_end",
				type: "palette",
				paletteIndex: 3,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "bkg3_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg3_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg3_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "bkg3_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg3_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg3_use2",
						label: "2",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg3_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "bkg4_start",
				type: "palette",
				paletteIndex: 4,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "bkg4_start",
						ne: "keep",
					},
				],
				key: "bkg4_end",
				type: "palette",
				paletteIndex: 4,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "bkg4_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg4_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg4_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "bkg4_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg4_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg4_use2",
						label: "2",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg4_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "bkg5_start",
				type: "palette",
				paletteIndex: 5,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "bkg5_start",
						ne: "keep",
					},
				],
				key: "bkg5_end",
				type: "palette",
				paletteIndex: 5,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "bkg5_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg5_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg5_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "bkg5_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg5_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg5_use2",
						label: "2",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg5_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "bkg6_start",
				type: "palette",
				paletteIndex: 6,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "bkg6_start",
						ne: "keep",
					},
				],
				key: "bkg6_end",
				type: "palette",
				paletteIndex: 6,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "bkg6_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg6_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg6_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "bkg6_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg6_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg6_use2",
						label: "2",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg6_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "bkg7_start",
				type: "palette",
				paletteIndex: 7,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "bkg7_start",
						ne: "keep",
					},
				],
				key: "bkg7_end",
				type: "palette",
				paletteIndex: 7,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "bkg7_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg7_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "bkg7_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "bkg7_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg7_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg7_use2",
						label: "2",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "bkg7_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},
	{
		type: "group",
		fields: [
			{
				label: "Sprite start pals:",
				description: "Sprite palettes at the beginning of the colour fade. These should usually match the palettes that are already loaded.",
			},
			{
				label: "Sprite end pals:",
				description: "Sprite palettes at the end of the colour fade.",
			},
			{
				label: "Cycle Colours:",
				description: "Selected colour slots are part of the colour cycle. That means that the colours in these slots rotate through each slot. At every step of the cycle, the colours move along by one slot. The slots are ordered from top to bottom and left to right in this list. Background palette 1 comes before background palette 8, which comes before sprite palette 1, and within each palette, colour 0 comes before colour 1.",
			},
		]
	},
	{
		type: "group",
		fields: [
			{
				key: "obj0_start",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 0,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "obj0_start",
						ne: "keep",
					},
				],
				key: "obj0_end",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 0,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "obj0_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj0_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj0_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "obj0_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "obj0_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						label: "  ",
					},
					{
						key: "obj0_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "obj1_start",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 1,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "obj1_start",
						ne: "keep",
					},
				],
				key: "obj1_end",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 1,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "obj1_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj1_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj1_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "obj1_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "obj1_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						label: "  ",
					},
					{
						key: "obj1_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "obj2_start",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 2,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "obj2_start",
						ne: "keep",
					},
				],
				key: "obj2_end",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 2,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "obj2_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj2_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj2_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "obj2_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "obj2_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						label: "  ",
					},
					{
						key: "obj2_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "obj3_start",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 3,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "obj3_start",
						ne: "keep",
					},
				],
				key: "obj3_end",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 3,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "obj3_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj3_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj3_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "obj3_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "obj3_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						label: "  ",
					},
					{
						key: "obj3_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "obj4_start",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 4,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "obj4_start",
						ne: "keep",
					},
				],
				key: "obj4_end",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 4,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "obj4_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj4_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj4_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "obj4_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "obj4_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						label: "  ",
					},
					{
						key: "obj4_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "obj5_start",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 5,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "obj5_start",
						ne: "keep",
					},
				],
				key: "obj5_end",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 5,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "obj5_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj5_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj5_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "obj5_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "obj5_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						label: "  ",
					},
					{
						key: "obj5_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "obj6_start",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 6,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "obj6_start",
						ne: "keep",
					},
				],
				key: "obj6_end",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 6,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "obj6_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj6_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj6_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "obj6_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "obj6_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						label: "  ",
					},
					{
						key: "obj6_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},


	{
		type: "group",
		fields: [
			{
				key: "obj7_start",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 7,
				defaultValue: "keep",
				canKeep: true,
			},
			{
				conditions: [
					{
						key: "obj7_start",
						ne: "keep",
					},
				],
				key: "obj7_end",
				type: "palette",
				paletteType: "sprite",
				paletteIndex: 7,
				defaultValue: "dmg",
				canKeep: false,
			},
			{
				conditions: [
					{
						key: "obj7_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj7_start",
						eq: "keep",
					},
				],
				label: "Not modified",
			},
			{
				conditions: [
					{
						key: "obj7_start",
						ne: "keep",
					},
				],
				type: "group",
				fields: [
					{
						key: "obj7_use0",
						label: "0",
						type: "checkbox",
						defaultValue: true,
					},
					{
						key: "obj7_use1",
						label: "1",
						type: "checkbox",
						defaultValue: true,
					},
					{
						label: "  ",
					},
					{
						key: "obj7_use3",
						label: "3",
						type: "checkbox",
						defaultValue: true,
					}
				],
			}
		],
	},
];

const compile = (input, helpers) => {
	const { palettes, _addComment, appendRaw } = helpers;


	const dmg_pal = [
		"E8F8E0",
		"B0F088",
		"509878",
		"202850"
	];

	const start_pal_inputs = [
		input.bkg0_start,
		input.bkg1_start,
		input.bkg2_start,
		input.bkg3_start,
		input.bkg4_start,
		input.bkg5_start,
		input.bkg6_start,
		input.bkg7_start,
		input.obj0_start,
		input.obj1_start,
		input.obj2_start,
		input.obj3_start,
		input.obj4_start,
		input.obj5_start,
		input.obj6_start,
		input.obj7_start,
	];

	const end_pal_inputs = [
		input.bkg0_end,
		input.bkg1_end,
		input.bkg2_end,
		input.bkg3_end,
		input.bkg4_end,
		input.bkg5_end,
		input.bkg6_end,
		input.bkg7_end,
		input.obj0_end,
		input.obj1_end,
		input.obj2_end,
		input.obj3_end,
		input.obj4_end,
		input.obj5_end,
		input.obj6_end,
		input.obj7_end,
	];

	const checkboxes = [
		input.bkg0_use0,
		input.bkg0_use1,
		input.bkg0_use2,
		input.bkg0_use3,
		input.bkg1_use0,
		input.bkg1_use1,
		input.bkg1_use2,
		input.bkg1_use3,
		input.bkg2_use0,
		input.bkg2_use1,
		input.bkg2_use2,
		input.bkg2_use3,
		input.bkg3_use0,
		input.bkg3_use1,
		input.bkg3_use2,
		input.bkg3_use3,
		input.bkg4_use0,
		input.bkg4_use1,
		input.bkg4_use2,
		input.bkg4_use3,
		input.bkg5_use0,
		input.bkg5_use1,
		input.bkg5_use2,
		input.bkg5_use3,
		input.bkg6_use0,
		input.bkg6_use1,
		input.bkg6_use2,
		input.bkg6_use3,
		input.bkg7_use0,
		input.bkg7_use1,
		input.bkg7_use2,
		input.bkg7_use3,
		input.obj0_use0,
		input.obj0_use1,
		input.obj0_use2,
		input.obj0_use3,
		input.obj1_use0,
		input.obj1_use1,
		input.obj1_use2,
		input.obj1_use3,
		input.obj2_use0,
		input.obj2_use1,
		input.obj2_use2,
		input.obj2_use3,
		input.obj3_use0,
		input.obj3_use1,
		input.obj3_use2,
		input.obj3_use3,
		input.obj4_use0,
		input.obj4_use1,
		input.obj4_use2,
		input.obj4_use3,
		input.obj5_use0,
		input.obj5_use1,
		input.obj5_use2,
		input.obj5_use3,
		input.obj6_use0,
		input.obj6_use1,
		input.obj6_use2,
		input.obj6_use3,
		input.obj7_use0,
		input.obj7_use1,
		input.obj7_use2,
		input.obj7_use3,
	];

	// We have 16 palettes (8 bkg + 8 obj) storing 64 colours
	// (32 bkg + 32 obj). 8 object colours are invisible, but we only need
	// to consider that at the end when formatting the GBVM output.
	let start_colours = Array(64);
	let final_colours = Array(64);
	let colour_gradients = Array(64);
	let used_in_cycle = Array(64);
	let used_pals = Array(16);

	function palette_equal(palette_index) {
		const p1 = next_palette.slice(12 * palette_index, 12 * palette_index + 12);
		const p2 = last_palette.slice(12 * palette_index, 12 * palette_index + 12);
		for (let n  = 0; n < p1.length; ++n) {
			if (p1[n] != p2[n]) {
				return false;
			}
		}
		return true;
	}

	// Get options
	const fade_steps = input.fade_steps;
	const fade_wait_frames = input.fade_frames;
	const cycle_wait_frames = input.cycle_frames;

	// Get start and end palettes:
	for (let p_index = 0; p_index < 16; ++p_index) {
		used_pals[p_index] = !(start_pal_inputs[p_index] === "keep" || end_pal_inputs[p_index] === "keep");
		const in_pal  = palettes.find((p) => p.id === start_pal_inputs[p_index]);
		const out_pal = palettes.find((p) => p.id === end_pal_inputs[p_index]);
		for (let c_index = 0; c_index < 4; ++c_index) {
			const linear_index = p_index * 4 + c_index;
			start_colours[linear_index]   =  in_pal && in_pal.colors ? in_pal.colors[c_index] : dmg_pal[c_index];
			final_colours[linear_index]  =  out_pal && out_pal.colors ? out_pal.colors[c_index] : dmg_pal[c_index];
			used_in_cycle[linear_index] = used_pals[p_index] && checkboxes[linear_index];
		}
	}

	let cycle_indices = [];
	for (let n = 0; n < 64; ++n) {
		if (used_in_cycle[n]) {
			cycle_indices.push(n);
		} 
	}

	// find the total length of the effect in frames:
	const cycle_steps = cycle_indices.length;
	let cycle_iterations = 1;
	let total_frames = cycle_steps * cycle_wait_frames;
	if (total_frames == 0) {
		total_frames = fade_steps * fade_wait_frames;
		cycle_iterations = 0;
	} else {
		while (total_frames < fade_steps * fade_wait_frames) {
			total_frames += cycle_steps * cycle_wait_frames;
			++cycle_iterations;
		}
	}

	// Create colour_gradients for the palette fade:
	const steps_arr = [...Array(fade_steps).keys()];

	for (let i = 0 ; i < 64; ++i) { // 4 colours * 16 palettes
		const [r0, g0, b0] = components(start_colours[i]);
		const [OK_L0, OK_a0, OK_b0] = sRGB_to_OKLab(r0, g0, b0);

		const [r1, g1, b1] = components(final_colours[i]);
		const [OK_L1, OK_a1, OK_b1] = sRGB_to_OKLab(r1, g1, b1);

		const OK_L_gradient = steps_arr.map((x) => OK_L0 + ((OK_L1 - OK_L0) / (fade_steps - 1)) * x);
		const OK_a_gradient = steps_arr.map((x) => OK_a0 + ((OK_a1 - OK_a0) / (fade_steps - 1)) * x);
		const OK_b_gradient = steps_arr.map((x) => OK_b0 + ((OK_b1 - OK_b0) / (fade_steps - 1)) * x);
		colour_gradients[i] = steps_arr.map((x) => OKLab_to_GB(OK_L_gradient[x], OK_a_gradient[x], OK_b_gradient[x]));
	}


	// Generate GBVM output:
	let gbvm = "";
	let carried_wait = 0; // carry-over frames if we want to skip an step entirely
	let last_palette = [];
	let last_t = 0;
	let current_gradient_step = -1;
	let current_cycle_step = -1;
	let waited = 0;
	let next_palette = [];
	for (let t = 0; t < total_frames; ++t) { // time 
		/*
		 	Do we need to update the fade or the cycle or both on this
		 	frame? (FizzBuzz)
		*/
		const fade_frame = (t < fade_steps * fade_wait_frames) && ((t % fade_wait_frames) == 0);
		const cycle_frame = (t % cycle_wait_frames) == 0;
		if (!fade_frame && !cycle_frame) {
			// no update on this frame
			continue;
		}
		// advance through fade and cycle:
		if (fade_frame && (current_gradient_step < fade_steps - 1)) {
			++current_gradient_step;
		}
		if (cycle_frame) {
			if (input.reverse) {
				--current_cycle_step;
				if (current_cycle_step < 0) {
					current_cycle_step = cycle_steps - 1;
				}
			} else {
				++current_cycle_step;
				if (current_cycle_step == cycle_steps) {
					current_cycle_step = 0;
				}
			}
		}

		// get colours from current step in gradient
		next_palette = [];
		for (let c = 0; c < 64; ++c) {
			next_palette.push(colour_gradients[c][current_gradient_step]);
		}
		// isolate colours to cycle
		let cycle_colours = Array(cycle_steps);
		for (let n = 0; n < cycle_steps; ++n) {
			cycle_colours[n] = next_palette[cycle_indices[n]];
		}

		// rotate cycle colours
		let base_index = 0;
		for (let n = current_cycle_step; n < cycle_steps; ++n) { // palette slots
			next_palette[cycle_indices[n]] = cycle_colours[base_index];
			++base_index;
		}
		for (let n = 0; n < current_cycle_step; ++n) { // palette slots
			next_palette[cycle_indices[n]] = cycle_colours[base_index];
			++base_index;
		}
		// check if this palette is identical to the previous - if so, skip it
		next_palette = next_palette.flat();
		/*
			Create the bitmasks to indicate which palettes are
			update this step. We recalculate the masks every 
			step because we want to omit redundant palette 
			updates. It's possible for zero palettes to be
			updated at a given step in the gradient.
		 */
		let used_this_frame = Array(16); // palettes used this frame
		let bkg_mask = "";
		for (let p = 0; p < 8; ++p) {
			let bit = 1;
			if (t > 0) {
				bit = palette_equal(p) ? 0 : 1;
			}
			bit = used_pals[p] ? bit : 0;
			bkg_mask = bit + bkg_mask;
			used_this_frame[p] = bit;
		}
		bkg_mask = "0b" + bkg_mask;

		let obj_mask = "";
		for (let p = 8; p < 16; ++p) {
			let bit = 1;
			if (t > 0) {
				bit = palette_equal(p) ? 0 : 1;
			}
			bit = used_pals[p] ? bit : 0;
			obj_mask = bit + obj_mask;
			used_this_frame[p] = bit;
		}
		obj_mask = "0b" + obj_mask;

		let type_string;

		if (t > 0) {
			if ((bkg_mask !== "0b00000000" || obj_mask !== "0b00000000")) {
				// about to write palettes, so add a wait:
				gbvm += "VM_PUSH_CONST " + (t - last_t) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
				last_t = t;
			}
		}


		// If no palettes are updated at this step, we want to skip to
		// the next step, but carry over the wait frames so the timing
		// remains the same.
		if ((bkg_mask == "0b00000000" && obj_mask == "0b00000000")) {
			//gbvm += `\n;          Nothing to do.\n`;
			continue;
		}
		gbvm += `\n;     Frame ${t}:`;
		if( cycle_frame && fade_frame) {
			gbvm += " colour fade & colour cycle steps\n";
		} else if (cycle_frame) {
			gbvm += " colour cycle step\n";
		} else if (fade_frame) {
			gbvm += " colour fade step\n";
		}

		if (bkg_mask != "0b00000000") { // 1+ bkg palettes to load this frame
			gbvm += "VM_LOAD_PALETTE " + bkg_mask + ", .PALETTE_BKG\n";
			gbvm += ";          GBS White     GBS LightG    GBS DarkG     GBS Black   ; Pal #\n";
			for (let p = 0; p < 8; ++p) {
				if (!used_this_frame[p]) {
					continue;
				}
				const [r0,g0,b0,r1,g1,b1,r2,g2,b2,r3,g3,b3] = next_palette.slice(p * 12, p * 12 + 12);
				const pals =  String(r0).padStart(2, ' ') + ", " +  String(g0).padStart(2, ' ') + ", " +  String(b0).padStart(2, ' ') + ",   " +  String(r1).padStart(2, ' ') + ", " +  String(g1).padStart(2, ' ') + ", " +  String(b1).padStart(2, ' ') + ",   " +  String(r2).padStart(2, ' ') + ", " +  String(g2).padStart(2, ' ') + ", " +  String(b2).padStart(2, ' ') + ",   " +  String(r3).padStart(2, ' ') + ", " +  String(g3).padStart(2, ' ') + ", " +  String(b3).padStart(2, ' ') + `  ; BKG ${p}`;
				gbvm += ".CGB_PAL   " + pals + "\n";
			}
		}
		if (obj_mask != "0b00000000") { // 1+ obj palettes to load this frame
			gbvm += "VM_LOAD_PALETTE " + obj_mask + ", .PALETTE_SPRITE\n";
			gbvm += ";          GBS Transp.   GBS White     GBS LightG    GBS Black   ; Pal #\n";
			for (let p = 8; p < 16; ++p) {
				if (!used_this_frame[p]) {
					continue;
				}
				const [r0,g0,b0,r1,g1,b1,r2,g2,b2,r3,g3,b3] = next_palette.slice(p * 12, p * 12 + 12);
				const pals = ubh(p) + String(r0).padStart(2, ' ') + ", " +  String(g0).padStart(2, ' ') + ", " +  String(b0).padStart(2, ' ') + ",   " +  String(r1).padStart(2, ' ') + ", " +  String(g1).padStart(2, ' ') + ", " +  String(b1).padStart(2, ' ') + ",   " +  String(r3).padStart(2, ' ') + ", " + String(g3).padStart(2, ' ') + ", " +  String(b3).padStart(2, ' ') + `  ; OBJ ${p - 8}`;
				gbvm += ".CGB_PAL   " + pals + "\n";
			}
		}
		last_palette = next_palette;
	}
	gbvm += "VM_PUSH_CONST " + (total_frames - last_t) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n\n";
	gbvm += `;     ~~~ End of Standard Fade with Colour Cycle block ~~~\n`;

	// Write GBVM output:
	_addComment("");
	_addComment(`      ___      ___        _____        ___`);
	_addComment(`     /  /\\    /  /\\      /  /::\\      /  /\\`);
	_addComment(`    /  /:/_  /  /::\\    /  /:/\\:\\    /  /:/_`);
	_addComment(`   /  /:/ /\\/  /:/\\:\\  /  /:/  \\:\\  /  /:/ /\\`);
	_addComment(`  /  /:/ /:/  /:/~/::\\/__/:/ \\__\\:|/  /:/ /:/_`);
	_addComment(` /__/:/ /:/__/:/ /:/\\:\\  \\:\\ /  /:/__/:/ /:/ /\\`);
	_addComment(` \\  \\:\\/:/\\  \\:\\/:/__\\/\\  \\:\\  /:/\\  \\:\\/:/ /:/`);
	_addComment(`  \\  \\::/  \\  \\::/      \\  \\:\\/:/  \\  \\::/ /:/`);
	_addComment(`   \\  \\:\\   \\  \\:\\       \\  \\::/    \\  \\:\\/:/`);
	_addComment(`    \\  \\:\\   \\  \\:\\       \\__\\/      \\  \\::/`);
	_addComment(`     \\___/    \\__\\/       ___         ___\\/       ___`);
	_addComment(`     /  /\\        ___    /  /\\       /  /\\       /  /\\        ___`);
	_addComment(`    /  /:/_      /  /\\  /  /::\\     /  /:/_     /  /:/_      /  /\\`);
	_addComment(`   /  /:/ /\\    /  /:/ /  /:/\\:\\   /  /:/ /\\   /  /:/ /\\    /  /:/`);
	_addComment(`  /  /:/ /::\\  /  /:/ /  /:/~/:/  /  /:/ /:/_ /  /:/ /:/_  /  /:/`);
	_addComment(` /__/:/ /:/\\:\\/  /::\\/__/:/ /:/__/__/:/ /:/ //__/:/ /:/ /\\/  /::\\`);
	_addComment(` \\  \\:\\/:/~/:/__/:/\\:\\  \\:\\/:::::\\  \\:\\/:/ /:\\  \\:\\/:/ /:/__/:/\\:\\`);
	_addComment(`  \\  \\::/ /:/\\__\\/  \\:\\  \\::/~~~~ \\  \\::/ /:/ \\  \\::/ /:/\\__\\/  \\:\\`);
	_addComment(`   \\__\\/ /:/      \\  \\:\\  \\:\\      \\  \\:\\/:/   \\  \\:\\/:/      \\  \\:\\`);
	_addComment(`     /__/:/        \\__\\/\\  \\:\\      \\  \\::/     \\  \\::/        \\__\\/`);
	_addComment(`     \\__\\/               \\__\\/       \\__\\/       \\__\\/`);
	_addComment(`     `);
	_addComment(`                  Standard Fade with Colour Cycle`);
	_addComment(`               [GF_EVENT_FADE_STREET_STANDARD_CYCLE]`);
	_addComment(`     `);
	_addComment(`    Parameters:`);
	_addComment(`        Palette fade steps: ${fade_steps}`);
	_addComment(`        Palette fade frames per step: ${fade_wait_frames}`);
	_addComment(`        Colour cycle steps: ${cycle_steps}`);
	_addComment(`        Colour cycle frames per step: ${cycle_wait_frames}`);
	_addComment("");
	if (used_pals.slice(0, 8).some((x)=>(x))) {
		_addComment("    Background palettes:");
		for (let p = 0; p < 8; ++p) {
			if (used_pals[p]) {
				_addComment(`        ${p}: ${start_colours.slice(p * 4, p * 4 + 4)} -> ${final_colours.slice(p * 4, p * 4 + 4)}`);
			}
		}
		_addComment(``);
	}
	if (used_pals.slice(8, 16).some((x)=>(x))) {
		_addComment("    Object palettes:");
		for (let p = 8; p < 16; ++p) {
			if (used_pals[p]) {
				_addComment(`        ${p-8}: ${start_colours.slice(p * 4, p * 4 + 4)} -> ${final_colours.slice(p * 4, p * 4 + 4)}`);
			}
		}
		_addComment(``);
	}
	_addComment(`    Fade length: ${fade_steps * fade_wait_frames} frames`);
	_addComment(`    Cycle length: ${cycle_steps * cycle_wait_frames} frames`);
	_addComment(`    Cycle iterations: ${cycle_iterations} times`);
	_addComment("");
	_addComment(`    Total wait: ${total_frames} frames`);
	appendRaw(gbvm);
};

module.exports = {
	id,
	autoLabel,
	name,
	groups,
	description,
	subGroups,
	fields,
	compile,
	waitUntilAfterInitFade: true,
};

function components(rgb) {
	var r = (parseInt(rgb[0] + rgb[1], 16) / 8) / 31;
	var g = (parseInt(rgb[2] + rgb[3], 16) / 8) / 31;
	var b = (parseInt(rgb[4] + rgb[5], 16) / 8) / 31;
	return [r, g, b]
}

function ubh(p) {
	switch (p % 8) {
		case 0:
		case 5:
			return " 3, 19, 12,   ";
		case 1:
		case 6:
			return "31, 31, 31,   ";
		case 2:
		case 7:
			return "31, 17,  8,   ";
		case 3:
			return " 0,  0,  0,   ";
		case 4:
			return " 0,  0,  0,   ";
	}
}

function sRGB_to_OKLab(r, g, b)
{
	let l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
	let m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
	let s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
	l = Math.cbrt(l);
	m = Math.cbrt(m);
	s = Math.cbrt(s);
	const OK_L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
	const OK_a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
	const OK_b = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
	return [OK_L, OK_a, OK_b];
}

function OKLab_to_GB(OK_L, OK_a, OK_b)
{
	if (OK_L >= 1) {
		return [31, 31, 31]
	} else if (OK_L <= 0) {
		return [0, 0, 0]
	}
	let l = OK_L + 0.3963377774 * OK_a + 0.2158037573 * OK_b;
	let m = OK_L - 0.1055613458 * OK_a - 0.0638541728 * OK_b;
	let s = OK_L - 0.0894841775 * OK_a - 1.2914855480 * OK_b;

	l = l * l * l;
	m = m * m * m;
	s = s * s * s;

	let r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
	let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
	let b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

	r = Math.min(31, Math.round(31 * Math.max(r, 0)));
	g = Math.min(31, Math.round(31 * Math.max(g, 0)));
	b = Math.min(31, Math.round(31 * Math.max(b, 0)));

	return [r, g, b];
}

