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
	
	Special Fade handles edge cases that aren't covered by either
	Simple Fade or Standard Fade.

	It can do anything those events	do, but has a more complicated
	interface.
*/

const id = "GF_EVENT_FADE_STREET_SPECIAL";
const groups = ["Fade Street"];
const description = "A fade event with extra options to cover edge cases not covered by Simple Fade or Standard Fade. You choose palettes and a preset effect for both endpoints of the fade. That means you can fade from, e.g. a desaturated version of one palette to a colourised version of a different palette.";
const subGroups = {"Fade Street": "Colour Mode - Fade Only"};
const name = "Special Fade";

const autoLabel = (fetchArg) => {
	let steps = (fetchArg("steps") - 1);
	const wait_frames = fetchArg("frames");
	const skip_step0 = fetchArg("force_initial") === false;
	const no_wait = fetchArg("no_initial_wait") === "true";
	if (skip_step0 && no_wait) {
		steps -= 1;
	}
	let startpoint = fetchArg("startpoint");
	if (startpoint === "rgb" || startpoint === "colourised" || startpoint === "multiply") {
		const r = fetchArg("starting_r");
		const g = fetchArg("starting_g");
		const b = fetchArg("starting_b");
		startpoint += ` (${r},${g},${b})`;
	} else if (startpoint === "night") {
		const pc = fetchArg("starting_night_intensity");
		startpoint += ` ${pc}%`;
	} else if (startpoint === "hue") {
		const amount = fetchArg("starting_hue_shift");
		startpoint += ` shifted ${amount}`;
	} else if (startpoint === "desaturated") {
		const amount = fetchArg("starting_desaturate_intensity");
		startpoint = `${amount} ` + startpoint;
	}
	let endpoint = fetchArg("endpoint");
	if (endpoint === "rgb" || endpoint === "colourised" || startpoint === "multiply") {
		const r = fetchArg("target_r");
		const g = fetchArg("target_g");
		const b = fetchArg("target_b");
		endpoint += ` (${r},${g},${b})`;
	} else if (endpoint === "night") {
		const pc = fetchArg("target_night_intensity");
		endpoint += ` ${pc}%`;
	} else if (endpoint === "hue") {
		const amount = fetchArg("target_hue_shift");
		endpoint += ` shifted ${amount}`;
	} else if (endpoint === "desaturated") {
		const amount = fetchArg("target_desaturate_intensity");
		endpoint = `${amount}% ` + endpoint;
	}
	const frames = wait_frames * steps;
	return `Special Fade from ${startpoint} to ${endpoint} (${frames} frames)`;
}

const fields = [
	{
		type: "group",
		fields: [
			{
				label: "Fade from:",
				description: "Preset effect to apply to the start point of the colour gradient.",
				width: "50%",
			},
			{
				defaultValue: "normal",
				key: "startpoint",
				type: "select",
				options: [
					["normal",      "starting palettes (normal)"],
					["white",       "white"],
					["black",       "black"],
					["rgb",         "solid colour (enter RGB)"],
					["desaturated", "starting palettes (desaturated)"],
					["hue", 	"starting palettes (hue shifted)"],
					["night", 	"starting palettes (day for night filter)"],
					["saturated",   "starting palettes (saturated)"],
					["inverted",    "starting palettes (inverted)"],
					["colourised",  "starting palettes (colourised - enter RGB)"],
					["multiply", 	"starting palettes (RGB multiply)"],
				],
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "startpoint",
				in: ["hue"]
			},
		],
		fields: [
			{
				label: "Hue shift degrees: ",
				width: "50%",
			},
			{
				key: "starting_hue_shift",
				type: "slider",
				min: 0,
				max: 360,
				defaultValue: 0,
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "startpoint",
				in: ["desaturated"]
			},
		],
		fields: [
			{
				label: "Intensity (%): ",
				width: "50%",
			},
			{
				key: "starting_desaturate_intensity",
				type: "slider",
				min: 0,
				max: 100,
				defaultValue: 100,
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "startpoint",
				in: ["night"]
			},
		],
		fields: [
			{
				label: "Intensity (%): ",
				width: "50%",
			},
			{
				key: "starting_night_intensity",
				type: "slider",
				min: 0,
				max: 100,
				defaultValue: 75,
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "startpoint",
				in: ["rgb", "colourised", "multiply"]
			},
		],
		fields: [
			{
				label: "R: ",
				width: "50%",
			},
			{
				key: "starting_r",
				type: "slider",
				min: 0,
				max: 31,
				defaultValue: 0,
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "startpoint",
				in: ["rgb", "colourised", "multiply"]
			},
		],
		fields: [
			{
				label: "G: ",
				width: "50%",
			},
			{
				key: "starting_g",
				type: "slider",
				min: 0,
				max: 31,
				defaultValue: 0,
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "startpoint",
				in: ["rgb", "colourised", "multiply"]
			},
		],
		fields: [
			{
				label: "B: ",
				width: "50%",
			},
			{
				key: "starting_b",
				type: "slider",
				min: 0,
				max: 31,
				defaultValue: 0,
			},
		],
	},
	{
		conditions: [
			{
				key: "startpoint",
				in: ["rgb", "colourised", "multiply"]
			},
		],
		label: " ",
	},
	{
		type: "group",
		fields: [
			{
				label: "Fade to:",
				description: "Preset effect to apply to the end point of the colour gradient.",
				width: "50%",
			},
			{
				defaultValue: "normal",
				key: "endpoint",
				type: "select",
				options: [
					["normal",      "final palettes (normal)"],
					["white",       "white"],
					["black",       "black"],
					["rgb",         "solid colour (enter RGB)"],
					["desaturated", "final palettes (desaturated)"],
					["hue", 	"final palettes (hue shifted)"],
					["night", 	"final palettes (day for night filter)"],
					["saturated",   "final palettes (saturated)"],
					["inverted",    "final palettes (inverted)"],
					["colourised",  "final palettes (colourised - enter RGB)"],
					["multiply",	"final palettes (RGB multiply)"],
				],
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "endpoint",
				in: ["hue"]
			},
		],
		fields: [
			{
				label: "Hue shift degrees: ",
				width: "50%",
			},
			{
				key: "target_hue_shift",
				type: "slider",
				min: 0,
				max: 360,
				defaultValue: 0,
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "endpoint",
				in: ["desaturated"]
			},
		],
		fields: [
			{
				label: "Intensity (%): ",
				width: "50%",
			},
			{
				key: "target_desaturate_intensity",
				type: "slider",
				min: 0,
				max: 100,
				defaultValue: 100,
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "endpoint",
				in: ["night"]
			},
		],
		fields: [
			{
				label: "Intensity (%): ",
				width: "50%",
			},
			{
				key: "target_night_intensity",
				type: "slider",
				min: 0,
				max: 100,
				defaultValue: 75,
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "endpoint",
				in: ["rgb", "colourised", "multiply"]
			},
		],
		fields: [
			{
				label: "R: ",
				width: "50%",
			},
			{
				key: "target_r",
				type: "slider",
				min: 0,
				max: 31,
				defaultValue: 0,
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "endpoint",
				in: ["rgb", "colourised", "multiply"]
			},
		],
		fields: [
			{
				label: "G: ",
				width: "50%",
			},
			{
				key: "target_g",
				type: "slider",
				min: 0,
				max: 31,
				defaultValue: 0,
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "endpoint",
				in: ["rgb", "colourised", "multiply"]
			},
		],
		fields: [
			{
				label: "B: ",
				width: "50%",
			},
			{
				key: "target_b",
				type: "slider",
				min: 0,
				max: 31,
				defaultValue: 0,
			},
		],
	},
	{
		conditions: [
			{
				key: "endpoint",
				in: ["rgb", "colourised", "multiply"]
			},
		],
		label: " ",
	},
	{
		type: "group",
		fields:
		[
			{
				label: "Steps:",
				description: "Steps in the gradient, including both end points.",
				width: "50%",
			},
			{
				key: "steps",
				type: "number",
				max: 100,
				min: 2,
				defaultValue: 8,
			},
		],
	},
	{
		type: "group",
		fields:
		[
			{
				label: "Frames per step:",
				description: "Frames to wait between each step in the gradient. (There are about 60 frames per second).",
				width: "50%",
			},
			{
				key: "frames",
				type: "number",
				max: 120,
				min: 1,
				defaultValue: 6,
			},
		],
	},
	{
		label:" ",
	},
	{
		type: "group",
		fields: [
			{
				label: "Starting palettes - background:",
				description: "Background palettes at the beginning of the colour fade. These should usually match the palettes that are already loaded.",
			},
			{
				label: "Final palettes - background:",
				description: "Background palettes at the end of the colour fade.",
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
				defaultValue: "keep",
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
				defaultValue: "keep",
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
				defaultValue: "keep",
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
				defaultValue: "keep",
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
				defaultValue: "keep",
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
				defaultValue: "keep",
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
				defaultValue: "keep",
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
		],
	},
	{
		type: "group",
		fields: [
			{
				label: "Starting palettes - sprites:",
				description: "Sprite palettes at the beginning of the colour fade. These should usually match the palettes that are already loaded.",
			},
			{
				label: "Final palettes - sprites:",
				description: "Sprite palettes at the end of the colour fade.",
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
				defaultValue: "keep",
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
				defaultValue: "keep",
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
				defaultValue: "keep",
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
				defaultValue: "keep",
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
				defaultValue: "keep",
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
				defaultValue: "keep",
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
				defaultValue: "keep",
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
		],
	},
	{
		key: "force_initial",
		label: "[Advanced] Force palette update on step 0 of gradient.",
		description: "By default, the starting colour palettes of the gradient are assumed to match the currently loaded palettes. For that reason, the plugin skips loading the 0th step in the gradient. Check this box to force loading the 0th step.",
		type: "checkbox",
		defaultValue: false,
	},
	{
		key: "no_initial_wait",
		label: "[Advanced] Don't wait before loading step 1 of the gradient.",
		description: "By default, the event will begin by waiting [Frames per step] frames, then loading step 1 of the gradient. Check this box to skip the first wait, and load step 1 of the gradient immediately. Not applicable if \"Force palette update on step 0 of gradient\" is checked.",
		type: "checkbox",
		defaultValue: false,
		conditions: [
			{
				key: "force_initial",
				ne: true,
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

	const obj_start = [
		input.obj0_start,
		input.obj1_start,
		input.obj2_start,
		input.obj3_start,
		input.obj4_start,
		input.obj5_start,
		input.obj6_start,
		input.obj7_start,
	];

	const obj_end = [
		input.obj0_end,
		input.obj1_end,
		input.obj2_end,
		input.obj3_end,
		input.obj4_end,
		input.obj5_end,
		input.obj6_end,
		input.obj7_end,
	];

	const bkg_start = [
		input.bkg0_start,
		input.bkg1_start,
		input.bkg2_start,
		input.bkg3_start,
		input.bkg4_start,
		input.bkg5_start,
		input.bkg6_start,
		input.bkg7_start,
	];

	const bkg_end = [
		input.bkg0_end,
		input.bkg1_end,
		input.bkg2_end,
		input.bkg3_end,
		input.bkg4_end,
		input.bkg5_end,
		input.bkg6_end,
		input.bkg7_end,
	];

	let gradients = Array(64);
	let input_pals = Array(64);
	let output_pals = Array(64);
	let start_hex = Array(64);
	let end_hex = Array(64);
	let using = Array(16);

	function palettes_equal(index0, step1) {
		if (!using[Math.floor(index0 / 4)]) {
			return true;
		}
		if (step1 == 0) {
			return false;
		}
		for (let pal_entry = 0; pal_entry < 4; ++pal_entry) {
			let [r0,g0,b0] = gradients[index0 + pal_entry][step1];
			let [r1,g1,b1] = gradients[index0 + pal_entry][step1 - 1];
			if (r0 != r1 || g0 != g1 || b0 != b1) {
				return false;
			}
		}
		return true;
	}

	// INPUTS
	const steps = input.steps;
	const wait_frames = input.frames;
	const force_step0 = input.force_initial;
	const no_wait = input.no_initial_wait;
	let startpoint_str = input.startpoint;
	if (startpoint_str === "rgb" || startpoint_str === "colourised") {
		const r = input.starting_r;
		const g = input.starting_g;
		const b = input.starting_b;
		startpoint_str += ` (${r},${g},${b})`;
	} else if (startpoint_str === "desaturated") {
		startpoint_str == `${input.start_desaturate_intensity}% desaturated`;
	} else if (startpoint_str === "hue") {
		startpoint_str += ` shift ${input.start_hue_shift} degrees`;
	}
	let endpoint_str = input.endpoint;
	if (endpoint_str === "rgb" || endpoint_str === "colourised" || endpoint_str === "multiply") {
		const r = input.target_r;
		const g = input.target_g;
		const b = input.target_b;
		endpoint_str += ` (${r},${g},${b})`;
	} else if (endpoint_str === "desaturated") {
		endpoint_str == `${input.target_desaturate_intensity}% desaturated`;
	} else if (endpoint_str === "hue") {
		endpoint_str += ` shift ${input.target_hue_shift} degrees`;
	}

	// Get start and end palettes:
	for (let p_index = 0; p_index < 8; ++p_index) {
		if (bkg_start[p_index] === "keep" || bkg_end[p_index] === "keep") {
			using[p_index] = false;
		} else {
			using[p_index] = true;
		}
		const in_pal  = palettes.find((p) => p.id === bkg_start[p_index]);
		const out_pal = palettes.find((p) => p.id === bkg_end[p_index]);
		for (let c_index = 0; c_index < 4; ++c_index) {
			const linear_index = p_index * 4 + c_index;
			input_pals[linear_index]   =  in_pal && in_pal.colors ? in_pal.colors[c_index] : dmg_pal[c_index];
			output_pals[linear_index]  =  out_pal && out_pal.colors ? out_pal.colors[c_index] : dmg_pal[c_index];
		}
	}

	for (let p_index = 0; p_index < 8; ++p_index) {
		if (obj_start[p_index] === "keep" || obj_end[p_index] === "keep") {
			using[p_index + 8] = false;
		} else {
			using[p_index + 8] = true;
		}
		const in_pal  = palettes.find((p) => p.id === obj_start[p_index]);
		const out_pal = palettes.find((p) => p.id === obj_end[p_index]);
		for (let c_index = 0; c_index < 4; ++c_index) {
			const linear_index = 32 + p_index * 4 + c_index;
			input_pals[linear_index]   =  in_pal && in_pal.colors ? in_pal.colors[c_index] : dmg_pal[c_index];
			output_pals[linear_index]  =  out_pal && out_pal.colors ? out_pal.colors[c_index] : dmg_pal[c_index];
		}
	}

	// Create gradients:
	const steps_arr = [...Array(steps).keys()];

	for (let i = 0 ; i < 64; ++i) { // 4 colours * 16 palettes
		const p = Math.floor(i / 4);
		if (!using[p]) {
		      	continue;
		}
		const [r0, g0, b0] = components(input_pals[i]);
		let [OK_L0, OK_a0, OK_b0] = linear_RGB_to_OKLab(r0, g0, b0);
		switch(input.startpoint) {
			case "multiply":
				[r2, g2, b2] = [input.starting_r / 31.0, input.starting_g / 31.0, input.starting_b / 31.0];
				[OK_L0, OK_a0, OK_b0] = linear_RGB_to_OKLab(r0 * r2, g0 * g2, b0 * b2);
				break;
			case "night":
				[L,C,h] = OKLab_to_OKLCh(OK_L0, OK_a0, OK_b0);
				// desaturate reds and greens:
				C = 0.9 * C * Math.pow((1 - Math.abs(-1.6746081505015078 - h) / 6.283185), 1.5);
				// lower brightnes
				L = 0.94 * Math.pow(L, 1.9);
				[OK_L2, OK_a2, OK_b2] = OKLCh_to_OKLab(L, C, h);
				// hue shift towards blue:
				[blue_l, blue_a, blue_b] = linear_RGB_to_OKLab(0, 0, 1);
				OK_a2 = OK_a2 + 0.08 * (blue_a - OK_a2);
				OK_b2 = OK_b2 + 0.08 * (blue_b - OK_b2);
				// mix with original colours:
				OK_L2 = OK_L0 + (input.starting_night_intensity / 100.0) * (OK_L2 - OK_L0);
				OK_a2 = OK_a0 + (input.starting_night_intensity / 100.0) * (OK_a2 - OK_a0);
				OK_b2 = OK_b0 + (input.starting_night_intensity / 100.0) * (OK_b2 - OK_b0);
				[OK_L0, OK_a0, OK_b0] = [OK_L2, OK_a2, OK_b2];
				break;
			case "hue":
				[L,C,h] = OKLab_to_OKLCh(OK_L0, OK_a0, OK_b0);
				[OK_L0, OK_a0, OK_b0] = OKLCh_to_OKLab(L,C,h + (input.starting_hue_shift / 360) * 6.28318);
				break;
			case "desaturated":
				[L,C,h] = OKLab_to_OKLCh(OK_L0, OK_a0, OK_b0);
				C = C * (1 - input.starting_desaturate_intensity / 100.0);
				[OK_L0, OK_a0, OK_b0] = OKLCh_to_OKLab(L, C, h);
				break;
			case "inverted":
				[OK_L0, OK_a0, OK_b0] = linear_RGB_to_OKLab(1 - r0, 1 - g0 , 1 - b0);
				break;
			case "saturated":
				// search for highest C inside rgb gamut
				[L,C,h] = OKLab_to_OKLCh(OK_L0, OK_a0, OK_b0);
				left = 0;  // bracket inside
				right = 1; // bracket outside
				epsilon = 0.001;
				while (right - left > epsilon) {
					mid = left + (right - left) / 2;
					[r2, g2, b2] = OKLCh_to_linear_RGB(L, mid, h);
					if (r2 > 1 || g2 > 1 || b2 > 1) {
						// outside gamut, move bracket down
						right = mid;
					} else {
						// inside gamut, move bracket up
						left = mid;
					}
				}
				[OK_L0, OK_a0, OK_b0] = OKLCh_to_OKLab(L, left, h);
				break;
			case "colourised":
				[, OK_a0, OK_b0] = linear_RGB_to_OKLab(input.starting_r / 31, input.starting_g / 31, input.starting_b / 31);
				break;
			case "black":
				[OK_L0, OK_a0, OK_b0] = [0, 0, 0];
				break;
			case "white":
				[OK_L0, OK_a0, OK_b0] = linear_RGB_to_OKLab(1, 1, 1);
				break;
			case "rgb":
				[OK_L0, OK_a0, OK_b0] = linear_RGB_to_OKLab(input.starting_r / 31, input.starting_g / 31, input.starting_b / 31);
				break;
			default:
			case "normal":
				break;
		}

		const [r1, g1, b1] = components(output_pals[i]);
		let [OK_L1, OK_a1, OK_b1] = linear_RGB_to_OKLab(r1, g1, b1);
		switch(input.endpoint) {
			case "multiply":
				[r2, g2, b2] = [input.target_r / 31.0, input.target_g / 31.0, input.target_b / 31.0];
				[OK_L1, OK_a1, OK_b1] = linear_RGB_to_OKLab(r2 * r1, g2 * g1, b2 * b1);
				break;
			case "night":
				[L,C,h] = OKLab_to_OKLCh(OK_L1, OK_a1, OK_b1);
				// desaturate reds and greens:
				C = 0.9 * C * Math.pow((1 - Math.abs(-1.6746081505015078 - h) / 6.283185), 1.5);
				// lower brightnes
				L = 0.94 * Math.pow(L, 1.9);
				[OK_L2, OK_a2, OK_b2] = OKLCh_to_OKLab(L, C, h);
				// hue shift towards blue:
				[blue_l, blue_a, blue_b] = linear_RGB_to_OKLab(0, 0, 1);
				OK_a2 = OK_a1 + 0.08 * (blue_a - OK_a2);
				OK_b2 = OK_b1 + 0.08 * (blue_b - OK_b2);
				// mix with original colours:
				OK_L2 = OK_L1 + (input.target_night_intensity / 100.0) * (OK_L2 - OK_L1);
				OK_a2 = OK_a1 + (input.target_night_intensity / 100.0) * (OK_a2 - OK_a1);
				OK_b2 = OK_b1 + (input.target_night_intensity / 100.0) * (OK_b2 - OK_b1);
				[OK_L1, OK_a1, OK_b1] = [OK_L2, OK_a2, OK_b2];
				break;
			case "hue":
				[L,C,h] = OKLab_to_OKLCh(OK_L1, OK_a1, OK_b1);
				[OK_L1, OK_a1, OK_b1] = OKLCh_to_OKLab(L, C, h + (input.target_hue_shift / 360) * 6.28318);
				break;
			case "desaturated":
				[L,C,h] = OKLab_to_OKLCh(OK_L1, OK_a1, OK_b1);
				C = C * (1 - input.target_desaturate_intensity / 100.0);
				[OK_L1, OK_a1, OK_b1] = OKLCh_to_OKLab(L, C, h);
				break;
			case "inverted":
				[OK_L1, OK_a1, OK_b1] = linear_RGB_to_OKLab(1 - r1, 1 - g1 , 1 - b1);
				break;
			case "saturated":
				// search for highest C inside rgb gamut
				[L,C,h] = OKLab_to_OKLCh(OK_L1, OK_a1, OK_b1);
				left = 0;  // bracket inside
				right = 1; // bracket outside
				epsilon = 0.001;
				while (right - left > epsilon) {
					mid = left + (right - left) / 2;
					[r2, g2, b2] = OKLCh_to_linear_RGB(L, mid, h);
					if (r2 > 1 || g2 > 1 || b2 > 1) {
						// outside gamut, move bracket down
						right = mid;
					} else {
						// inside gamut, move bracket up
						left = mid;
					}
				}
				[OK_L1, OK_a1, OK_b1] = OKLCh_to_OKLab(L, left, h);
				break;
			case "colourised":
				[, OK_a1, OK_b1] = linear_RGB_to_OKLab(input.target_r / 31, input.target_g / 31, input.target_b / 31);
				break;
			case "black":
				[OK_L1, OK_a1, OK_b1] = [0, 0, 0];
				break;
			case "white":
				[OK_L1, OK_a1, OK_b1] = linear_RGB_to_OKLab(1, 1, 1);
				break;
			case "rgb":
				[OK_L1, OK_a1, OK_b1] = linear_RGB_to_OKLab(input.target_r / 31, input.target_g / 31, input.target_b / 31);
				break;
			default:
			case "normal":
				break;
		}

		const OK_L_gradient = steps_arr.map((x) => OK_L0 + ((OK_L1 - OK_L0) / (steps - 1)) * x);
		const OK_a_gradient = steps_arr.map((x) => OK_a0 + ((OK_a1 - OK_a0) / (steps - 1)) * x);
		const OK_b_gradient = steps_arr.map((x) => OK_b0 + ((OK_b1 - OK_b0) / (steps - 1)) * x);
		gradients[i] = steps_arr.map((x) => OKLab_to_GB(OK_L_gradient[x], OK_a_gradient[x], OK_b_gradient[x]));
		end_hex[i] = OKLab_to_hex(OK_L_gradient[OK_L_gradient.length - 1], OK_a_gradient[OK_a_gradient.length - 1], OK_b_gradient[OK_b_gradient.length - 1]);
		start_hex[i]   = OKLab_to_hex(OK_L_gradient[0], OK_a_gradient[0], OK_b_gradient[0]);
	}

	// Generate GBVM output:
	let gbvm = "";

	const step0 = force_step0 ? 0 : 1;

	if (step0 == 1) {
		gbvm += `\n;     Step 0: do nothing.\n`;
	}

	let carried_wait = 0; // carry-over frames if we want to skip an step entirely

	for (let j = step0; j < steps; ++j) { // time 
		/*
			Create the bitmasks to indicate which palettes are
			update this step. We recalculate the masks every 
			step because we want to omit redundant palette 
			updates. It's possible for zero palettes to be
			updated at a given step in the gradient.

		 */
		let using_now = Array(16); // palettes used this frame
		let bkg_mask = "";
		for (let p = 0; p < 8; ++p) {
			let bit = palettes_equal(p * 4, j) ? 0 : 1;
			bit = using[p] ? bit : 0;
			bkg_mask = bit + bkg_mask;
			using_now[p] = bit;
		}
		bkg_mask = "0b" + bkg_mask;

		let obj_mask = "";
		for (let p = 8; p < 16; ++p) {
			let bit = palettes_equal(p * 4, j) ? 0 : 1;
			bit = using[p] ? bit : 0;
			obj_mask = bit + obj_mask;
			using_now[p] = bit;
		}
		obj_mask = "0b" + obj_mask;


		// If no palettes are updated at this step, we want to skip to
		// the next step, but carry over the wait frames so the timing
		// remains the same.
		if (bkg_mask == "0b00000000" && obj_mask == "0b00000000") {
			if (j < steps - 1) {
				gbvm += `\n;     Step ${j}: do nothing.\n`;
				carried_wait += wait_frames;
				continue;
			} else {
				gbvm += `\n;     Step ${j}: wait ${wait_frames + carried_wait} frames.\n`;
				// write any remaining wait frames left:
				gbvm += "VM_PUSH_CONST " + (wait_frames + carried_wait) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
				break;
			}
		}

		if (j == 0 ||
			(j == 1 && step0 == 1 && no_wait)) {
			// Don't wait before step0, 
			// or before step1, if the "Don't wait before loading step 1..." option is checked.
			gbvm += `\n;     Step ${j}: load palettes.\n`;
		} else {
			gbvm += `\n;     Step ${j}: wait ${wait_frames + carried_wait} frames, then load palettes.\n`;
			// add a wait
			gbvm += "VM_PUSH_CONST " + (wait_frames + carried_wait) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
			carried_wait = 0;
		}
		if (bkg_mask != "0b00000000") { // 1+ bkg palettes to load this frame
			gbvm += "VM_LOAD_PALETTE " + bkg_mask + ", .PALETTE_BKG\n";
			gbvm += ";          GBS White     GBS LightG    GBS DarkG     GBS Black   ; Pal #\n";
			for (let p = 0; p < 8; ++p) {
				if (!using_now[p]) {
					continue;
				}
				let [r0,g0,b0] = gradients[p * 4][j];
				let [r1,g1,b1] = gradients[p * 4 + 1][j];
				let [r2,g2,b2] = gradients[p * 4 + 2][j];
				let [r3,g3,b3] = gradients[p * 4 + 3][j];
				const pals =  String(r0).padStart(2, ' ') + ", " +  String(g0).padStart(2, ' ') + ", " +  String(b0).padStart(2, ' ') + ",   " +  String(r1).padStart(2, ' ') + ", " +  String(g1).padStart(2, ' ') + ", " +  String(b1).padStart(2, ' ') + ",   " +  String(r2).padStart(2, ' ') + ", " +  String(g2).padStart(2, ' ') + ", " +  String(b2).padStart(2, ' ') + ",   " +  String(r3).padStart(2, ' ') + ", " +  String(g3).padStart(2, ' ') + ", " +  String(b3).padStart(2, ' ') + `  ; BKG ${p}`;
				gbvm += ".CGB_PAL   " + pals + "\n";
			}
		}
		if (obj_mask != "0b00000000") { // 1+ obj palettes to load this frame
			gbvm += "VM_LOAD_PALETTE " + obj_mask + ", .PALETTE_SPRITE\n";
			gbvm += ";          GBS Transp.   GBS White     GBS LightG    GBS Black   ; Pal #\n";
			for (let p = 8; p < 16; ++p) {
				if (!using_now[p]) {
					continue;
				}
				let [r0,g0,b0] = gradients[p * 4][j];
				let [r1,g1,b1] = gradients[p * 4 + 1][j];
				let [r3,g3,b3] = gradients[p * 4 + 3][j];
				const pals = ubh(p) + String(r0).padStart(2, ' ') + ", " +  String(g0).padStart(2, ' ') + ", " +  String(b0).padStart(2, ' ') + ",   " +  String(r1).padStart(2, ' ') + ", " +  String(g1).padStart(2, ' ') + ", " +  String(b1).padStart(2, ' ') + ",   " +  String(r3).padStart(2, ' ') + ", " + String(g3).padStart(2, ' ') + ", " +  String(b3).padStart(2, ' ') + `  ; OBJ ${p - 8}`;
				gbvm += ".CGB_PAL   " + pals + "\n";
			}
		}
	}

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
	_addComment(`                       Special Fade`);
	_addComment(`               [GF_EVENT_FADE_STREET_SPECIAL]`);
	_addComment(``);
	_addComment(`    Parameters:`);
	_addComment(`        Start point: ${startpoint_str}`);
	_addComment(`        End point:   ${endpoint_str}`);
	_addComment(`        Steps: ${steps}`);
	_addComment(`        Frames per step: ${wait_frames}`);
	_addComment(`        Force step 0: ${force_step0}`);
	_addComment(`        Don't wait before step 1: ${no_wait}`);
	_addComment("");
	if (using.slice(0, 8).some((x)=>(x))) {
		_addComment("    Background palettes:");
		for (let p = 0; p < 8; ++p) {
			if (using[p]) {
				_addComment(`        ${p}: ${start_hex.slice(p * 4, p * 4 + 4)} -> ${end_hex.slice(p * 4, p * 4 + 4)}`);
			}
		}
		_addComment(``);
	}
	if (using.slice(8, 16).some((x)=>(x))) {
		_addComment("    Object palettes:");
		for (let p = 8; p < 16; ++p) {
			if (using[p]) {
				_addComment(`        ${p-8}: ${start_hex.slice(p * 4, p * 4 + 4)} -> ${end_hex.slice(p * 4, p * 4 + 4)}`);
			}
		}
		_addComment(``);
	}
	appendRaw(gbvm);
	_addComment(`~~~ End of Special Fade block ~~~\n\n`);
};

module.exports = {
	id,
	autoLabel,
	name,
	groups,
	subGroups,
	description,
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

function linear_RGB_to_OKLab(r, g, b)
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

function OKLCh_to_OKLab(L, C, h)
{
	const a = C * Math.cos(h);
	const b = C * Math.sin(h);
	return [L, a, b];
}

function OKLab_to_OKLCh(OK_L, OK_a, OK_b)
{
	const C = Math.sqrt(OK_a * OK_a + OK_b * OK_b);
	const h = Math.atan2(OK_b, OK_a);
	return [OK_L, C, h];
}

function OKLab_to_hex(OK_L, OK_a, OK_b)
{
	let [r, g, b] = OKLab_to_GB(OK_L, OK_a, OK_b);

	let r2 = (8 * r).toString(16).padStart(2, '0');
    	let g2 = (8 * g).toString(16).padStart(2, '0');
    	let b2 = (8 * b).toString(16).padStart(2, '0');

	return `${r2}${g2}${b2}`;
}

function OKLCh_to_linear_RGB(L, C, h)
{
	const [OK_L, OK_a, OK_b] = OKLCh_to_OKLab(L, C, h);
	return OKLab_to_linear_RGB(OK_L, OK_a, OK_b);
}

function OKLab_to_linear_RGB(OK_L, OK_a, OK_b)
{
	if (OK_L >= 1) {
		return [1, 1, 1]
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

	return [r, g, b];
}

function OKLab_to_GB(OK_L, OK_a, OK_b)
{
	let [r, g, b] =  OKLab_to_linear_RGB(OK_L, OK_a, OK_b);

	r = Math.min(31, Math.round(31 * Math.max(r, 0)));
	g = Math.min(31, Math.round(31 * Math.max(g, 0)));
	b = Math.min(31, Math.round(31 * Math.max(b, 0)));

	return [r, g, b];
}

