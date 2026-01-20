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

 */

const id = "GF_EVENT_FADE_STREET_BESPOKE_CYCLE";
const groups = ["Fade Street"];
const subGroups = {"Fade Street": "Colour Mode - Fade And Colour Cycle"};
const name = "Bespoke Colour Cycle";
const description = "A totally customisable colour cycle. You enter the exact palette slots you want, in whatever order you want, as well as the colours that make up the cycle. The number of colours can be bigger or smaller than the number of slots.";

const autoLabel = (fetchArg) => {
	const fade_steps = (fetchArg("fade_steps"));
	const fade_wait_frames = fetchArg("fade_frames");
	const cycle_wait_frames = fetchArg("cycle_frames");
	let cycle_steps = (fetchArg("start_colours_text") || "").replace(/,+$/, "").split(',').length;
	if (fetchArg("colour_format") === "triplet") {
		cycle_steps /= 3;
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
	return `Bespoke Colour Cycle (${total_frames} frames, ${cycle_count} full cycles)`;
}

const fields = [
	{
		label: "Select a base fade. This specifies colours for palette slots that are not part of the cycle. If a palette has 1+ colours included in the cycle, it needs to have a base fade selected here:"
	},
	{
		type: "group",
		fields: [
			{
				label: "Fade from:",
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
		fields: [
			{
				label: "Fade steps:",
				width: "50%",
			},
			{
				key: "fade_steps",
				description: "Steps in the gradient, including both end points.",
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
				width: "50%",
			},
			{
				key: "fade_frames",
				description: "Pause for this many frames between each step in the gradient. (There are about 60 frames per second).",
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
		label: "=== Specify the colour cycle: === ",
	},
	{
		type: "group",
		fields: [
			{
				label: "Frames per step - cycle",
				width: "50%",
			},
			{
				key: "cycle_frames",
				description: "Pause for this many frames between each step colour cycle. (There are about 60 frames per second).",
				type: "number",
				max: 120,
				min: 1,
				defaultValue: 6,
			},
		],
	},
	{
		type: "textarea",
		key:  "cycle_text",
		label: "Palette Slots For Cycle:",
		description: "Enter a comma separated list of integers indicating which palette colours should be included in the cycle.\nBackground slots are numbered 0-31, starting at the first colour of palette 1, and ending at the last colour of palette 8. Palette #1 comprises colours 0, 1, 2, and 3, palette #2 comprises colours 4, 5, 6, and 7, etc.\nSprite slots are number 32-63, starting at the first colour of palette 1, and ending at the last colour of palette 8. There are FOUR slots per sprite palette, and the first slot is invisible/unused. Sprite palette #1 comprises colours 32, 33, 34, and 35, with colour 32 is invisible. 33, 34, and 35 are the three visible colours in palette #1, corresponding to white, light grey, and black, respectively, in GB Studio.\nEach slot may appear no more that one time in the list. Slots may be listed in any order and colours will cycle through the slots in the given order.",
	},
	{
		type: "select",
		key: "colour_format",
		description: "The format you'll use to enter colours. Choose \"GBS representative hex\" if and only if you are copying a hex value from the Palettes screen of GB Studio. If you're not sure if your colours are sRGB or linear RGB, try both and find out. One option will look correct, and the other won't.",
		label: "Colour Format:",
		default: "gbs",
		options: [
			["gbs", "GBS representative hex (e.g. red is #c9002e)"],
			["triplet", "RGB components (e.g. red is 31,0,0,)"],
			["rgb24", "sRGB 24-bit hex (e.g. red is #ff0000)"],
			["linear24", "linear RGB 24-bit hex (e.g. red is #ff0000)"],
			["rgb15", "Game Boy Color 15-bit hex (e.g. red is 0x00f1)"],
		]
	},
	{
		type: "textarea",
		key:  "start_colours_text",
		description: "Enter a comma separated list of colours in the chosen format. Leading '#' or '0x' is optional.",
		label: "Cycle Colours - Start of Fade"
	},
	{
		type: "textarea",
		key:  "end_colours_text",
		description: "Enter a comma separated list of colours in the chosen format. Leading '#' or '0x' is optional.",
		label: "Cycle Colours - End of Fade"
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
	
	function palette_equal(palette_index) {
		if (!used_pals[palette_index]) {
			return true;
		}
		const p1 = next_palette.slice(12 * palette_index, 12 * palette_index + 12);
		const p2 = last_palette.slice(12 * palette_index, 12 * palette_index + 12);
		for (let n  = 0; n < p1.length; ++n) {
			if (p1[n] != p2[n]) {
				return false;
			}
		}
		return true;
	}
	
	let used_pals = Array(16);
	
	// Parse cycle slots from user input:
	let cycle_slots = (input.cycle_text || "").replace(/,$/, "").split(','); // remove trailing "," and split
	cycle_slots = cycle_slots.map((x) => parseInt(x)); // parse integers
	if (cycle_slots.length == 1 && Number.isNaN(cycle_slots[0])) {
		cycle_slots = [];
	}
	// verify we got numbers in the correct range:
	for (let i = 0; i < cycle_slots.length; ++i) {
		if (!Number.isInteger(cycle_slots[i]) || cycle_slots[i] < 0 || cycle_slots[i] > 64) {
			throw new Error(`Palette slots must be entered as a comma-separated list of integers in the range [0,63]. Found ${cycle_slots[i]}.`);
		}
	}
	// verify that the slot numbers are unique:
	let uniques = new Set(cycle_slots);
	if (uniques.size < cycle_slots.length) {
			throw new Error("Palette slots must only appear once in the list.");
	}

	// renumber palette slots to fit the GB Studio ordering for sprite palettes:
	for (let i = 0; i < cycle_slots.length; ++i) {
		if (cycle_slots[i] > 31) { // sprite slot
			switch( cycle_slots[i] % 4) {
				case 0: 
					cycle_slots[i] += 2;
					break;
				case 1:  
					cycle_slots[i] -= 1; 
					break;
				case 2:
					cycle_slots[i] -= 1;
					break;
				case 3:
					// black == black
					break;
			}
		}
		// mark palettes as used:
		const p = Math.floor(cycle_slots[i] / 4);
		used_pals[p] = true;
	}

	// Parse start and end colours for the cycle from user input:
	let cycle_colours = (input.start_colours_text || "").replace(/[\n\r\s]/g, "").replace(/[,],+/, "").replace(/,+$/, "").split(',');
	if (input.colour_format === "triplet" && cycle_colours.length % 3 != 0) {
			throw new Error("Could not parse cycle start colours. There must be three RGB components per colour.");
	}
	let cycle_palettes_start = [];
	for (let i = 0; i < cycle_colours.length; ++i) {
		cycle_colours[i] = cycle_colours[i].replace(/[^a-fA-F0-9]/g, "").padStart(6, 0).substring(0,6);
		let r;
		let g; 
		let b;
		switch (input.colour_format) {
			case "rgb15":
				[r,g,b] = components15(cycle_colours[i]);
				break;
			case "linear24":
			case "rgb24":
				[r,g,b] = components24(cycle_colours[i]);
				break;
			case "gbs":
				[r,g,b] = componentsGBS(cycle_colours[i]);
				break;
			case "triplet":
				r = parseInt(cycle_colours[i]) / 31;
				g = parseInt(cycle_colours[i + 1]) / 31;
				b = parseInt(cycle_colours[i + 2]) / 31;
				i += 2;
				break;
		}
		if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) {
			if (input.colour_format === "triplet") {
				throw new Error("Could not parse colour `" + [r, g, b] + "`. Is the colour in the right format?");
			} else {
				throw new Error("Could not parse colour `" + cycle_colours[i] + "`. Is the colour in the right format?");
			}
		}
		cycle_palettes_start.push([r, g, b])
	}
	
	let cycle_palettes_end = [];
	cycle_colours = (input.end_colours_text || "").replace(/[\n\r\s]/g, "").replace(/[,],+/, "").replace(/,+$/, "").split(',');
	for (let i = 0; i < cycle_colours.length; ++i) {
		cycle_colours[i] = cycle_colours[i].replace(/[^a-fA-F0-9]/g, "").padStart(6, 0).substring(0,6);
		let r;
		let g; 
		let b;
		switch (input.colour_format) {
			case "rgb15":
				[r,g,b] = components15(cycle_colours[i]);
				break;
			case "linear24":
			case "rgb24":
				[r,g,b] = components24(cycle_colours[i]);
				break;
			case "gbs":
				[r,g,b] = componentsGBS(cycle_colours[i]);
				break;
			case "triplet":
				r = parseInt(cycle_colours[i]) / 31;
				g = parseInt(cycle_colours[i + 1]) / 31;
				b = parseInt(cycle_colours[i + 2]) / 31;
				i += 2;
				break;
		}
		if (r > 1 || r < 0 || g > 1 || g < 0 || b > 1 || b < 0) {
			if (input.colour_format === "triplet") {
				throw new Error("Could not parse colour `" + [r, g, b] + "`. Is the colour in the right format?");
			} else {
				throw new Error("Could not parse colour `" + cycle_colours[i] + "`. Is the colour in the right format?");
			}
		}
		cycle_palettes_end.push([r, g, b])
	}

	if (cycle_palettes_end.length != cycle_palettes_start.length) {
		throw new Error(`Start and end palettes must have the same number of colours. (${cycle_palettes_start.length} != ${cycle_palettes_end.length})`);
	}

	// For each of 8 bkg and 8 obj palettes, count how many colours [0-4]
	// are part of the cycle:
	let cycled_slots_per_palette = Array(16).fill(0);
	cycle_slots.map((c) => {
		cycled_slots_per_palette[Math.floor(c/4)] += 1;
	});


	// We have 16 palettes (8 bkg + 8 obj) storing 64 colours
	// (32 bkg + 32 obj). 8 object colours are invisible, but we only need
	// to consider that at the end when formatting the GBVM output.
	let start_colours = Array(64);
	let final_colours = Array(64);
	let base_gradients = Array(64);
	let start_hex = Array(64);
	let end_hex = Array(64);

	// Get options
	const fade_steps = input.fade_steps;
	const fade_wait_frames = input.fade_frames;
	const cycle_wait_frames = input.cycle_frames;
	let startpoint_str = input.startpoint;
	if (startpoint_str === "rgb" || startpoint_str === "colourised") {
		const r = input.starting_r;
		const g = input.starting_g;
		const b = input.starting_b;
		startpoint_str += ` (${r},${g},${b})`;
	}
	let endpoint_str = input.endpoint;
	if (endpoint_str === "rgb" || endpoint_str === "colourised") {
		const r = input.target_r;
		const g = input.target_g;
		const b = input.target_b;
		endpoint_str += ` (${r},${g},${b})`;
	}

	// Get start and end base fade palettes:
	for (let p_index = 0; p_index < 16; ++p_index) {
		used_pals[p_index] = !(start_pal_inputs[p_index] === "keep" || end_pal_inputs[p_index] === "keep");
		if (!used_pals[p_index] && (cycled_slots_per_palette[p_index]) > 0 && (cycled_slots_per_palette[p_index] < 4)) {
			throw new Error(`A base fade must be specified for all cycle indices.}`);
		}
		if (cycled_slots_per_palette[p_index] > 0) {
			used_pals[p_index] = true;
		}
		const in_pal  = palettes.find((p) => p.id === start_pal_inputs[p_index]);
		const out_pal = palettes.find((p) => p.id === end_pal_inputs[p_index]);
		for (let c_index = 0; c_index < 4; ++c_index) {
			const linear_index = p_index * 4 + c_index;
			start_colours[linear_index] = in_pal && in_pal.colors ? in_pal.colors[c_index] : dmg_pal[c_index];
			final_colours[linear_index] = out_pal && out_pal.colors ? out_pal.colors[c_index] : dmg_pal[c_index];
		}
	}

	// find the total length of the effect in frames:
	let cycle_iterations = 1;
	let total_frames = cycle_palettes_start.length * cycle_wait_frames;
	if (total_frames == 0) {
		total_frames = fade_steps * fade_wait_frames;
		cycle_iterations = 0;
	} else {
		while (total_frames < fade_steps * fade_wait_frames) {
			total_frames += cycle_palettes_start.length * cycle_wait_frames;
			++cycle_iterations;
		}
	}

	const steps_arr = [...Array(fade_steps).keys()];

	let cycle_gradients = Array(cycle_palettes_start.length);
	let cycle_start_hex = Array(cycle_palettes_start.length);
	let cycle_end_hex = Array(cycle_palettes_start.length);

	// create fade for cycle palettes:
	for (let i = 0; i < cycle_palettes_start.length; ++i) {
		let [r0, g0, b0] = cycle_palettes_start[i];
		let OK_L0;
		let OK_a0;
		let OK_b0;
		if (input.colour_format === "rgb24") {
				[OK_L0, OK_a0, OK_b0] = sRGB_to_OKLab(r0, g0, b0);
		} else {
				[OK_L0, OK_a0, OK_b0] = linear_RGB_to_OKLab(r0, g0, b0);
		}
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
			case "black":
				[OK_L0, OK_a0, OK_b0] = [0, 0, 0];
				break;
			case "white":
				[OK_L0, OK_a0, OK_b0] = linear_RGB_to_OKLab(1, 1, 1);
				break;
			case "rgb":
				[OK_L0, OK_a0, OK_b0] = linear_RGB_to_OKLab(input.starting_r / 31, input.starting_g / 31, input.starting_b / 31);
				break;
		}

		let [r1, g1, b1] = cycle_palettes_end[i];
		let OK_L1;
		let OK_a1;
		let OK_b1;
		if (input.colour_format === "rgb24") {
				[OK_L1, OK_a1, OK_b1] = sRGB_to_OKLab(r1, g1, b1);
		} else {
				[OK_L1, OK_a1, OK_b1] = linear_RGB_to_OKLab(r1, g1, b1);
		}
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
		}
		const OK_L_gradient = steps_arr.map((x) => OK_L0 + ((OK_L1 - OK_L0) / (fade_steps - 1)) * x);
		const OK_a_gradient = steps_arr.map((x) => OK_a0 + ((OK_a1 - OK_a0) / (fade_steps - 1)) * x);
		const OK_b_gradient = steps_arr.map((x) => OK_b0 + ((OK_b1 - OK_b0) / (fade_steps - 1)) * x);
		cycle_gradients[i] = steps_arr.map((x) => OKLab_to_GB(OK_L_gradient[x], OK_a_gradient[x], OK_b_gradient[x]));
		cycle_end_hex[i] = OKLab_to_hex(OK_L_gradient[OK_L_gradient.length - 1], OK_a_gradient[OK_a_gradient.length - 1], OK_b_gradient[OK_b_gradient.length - 1]);
		cycle_start_hex[i]   = OKLab_to_hex(OK_L_gradient[0], OK_a_gradient[0], OK_b_gradient[0]);
	}

	// Create base_gradients for the palette fade:
	for (let i = 0 ; i < 64; ++i) { // 4 colours * 16 palettes
		const p = Math.floor(i / 4);
		if (!used_pals[p]) {
		      	continue;
		}
		const [r0, g0, b0] = components(start_colours[i]);
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
		}

		const [r1, g1, b1] = components(final_colours[i]);
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
		}
		const OK_L_gradient = steps_arr.map((x) => OK_L0 + ((OK_L1 - OK_L0) / (fade_steps - 1)) * x);
		const OK_a_gradient = steps_arr.map((x) => OK_a0 + ((OK_a1 - OK_a0) / (fade_steps - 1)) * x);
		const OK_b_gradient = steps_arr.map((x) => OK_b0 + ((OK_b1 - OK_b0) / (fade_steps - 1)) * x);
		base_gradients[i] = steps_arr.map((x) => OKLab_to_GB(OK_L_gradient[x], OK_a_gradient[x], OK_b_gradient[x]));
		end_hex[i] = OKLab_to_hex(OK_L_gradient[OK_L_gradient.length - 1], OK_a_gradient[OK_a_gradient.length - 1], OK_b_gradient[OK_b_gradient.length - 1]);
		start_hex[i]   = OKLab_to_hex(OK_L_gradient[0], OK_a_gradient[0], OK_b_gradient[0]);
	}


	// Generate GBVM output:
	let gbvm = "";
	let carried_wait = 0; // carry-over frames if we want to skip an step entirely
	let last_palette = [];
	let last_t = 0;
	let current_gradient_step = -1;
	let waited = 0;
	let cycle_start_index = -1;
	let next_palette;
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
			cycle_start_index++;
			if (cycle_start_index >= cycle_palettes_start.length) {
				cycle_start_index = 0;
			}
		}

		// get colours from current step in gradient
		next_palette = Array(64).fill([0, 0, 0]);
		for (let c = 0; c < 64; ++c) {
			const p = Math.floor(c / 4);
			if (used_pals[p]) {
				next_palette[c] = (base_gradients[c][current_gradient_step]);
			}
		}
		// isolate colours to cycle
		let cycle_colours = Array(cycle_palettes_start.length);
		for (let n = 0; n < cycle_palettes_start.length; ++n) {
			cycle_colours[n] = cycle_gradients[n][current_gradient_step];
		}

		// rotate cycle colours
		let colour_index = cycle_start_index;
		for (let slot = 0; slot < cycle_slots.length; ++slot) { // palette slots
			next_palette[cycle_slots[slot]] = cycle_colours[colour_index--];
			if (colour_index < 0) {
				colour_index = cycle_palettes_start.length - 1;
			}
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
	gbvm += "VM_PUSH_CONST " + (total_frames - last_t) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
	gbvm += `;     ~~~ End of Bespoke Colour Cycle block ~~~\n`;

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
	_addComment(`                       Bespoke Colour Cycle`);
	_addComment(`               [GF_EVENT_FADE_STREET_BESPOKE_CYCLE]`);
	_addComment(`     `);
	_addComment(`    Fade parameters:`);
	_addComment(`        Start point: ${startpoint_str}`);
	_addComment(`        End point:   ${endpoint_str}`);
	_addComment(`        Fade steps: ${fade_steps}`);
	_addComment(`        Fade frames per step: ${fade_wait_frames}`);
	_addComment("");
	if (used_pals.slice(0, 8).some((x)=>(x))) {
		_addComment("    Base fade: background palettes");
		for (let p = 0; p < 8; ++p) {
			if (used_pals[p]) {
				_addComment(`        ${p}: ${start_hex.slice(p * 4, p * 4 + 4)} -> ${end_hex.slice(p * 4, p * 4 + 4)}`);
			}
		}
		_addComment(``);
	}
	if (used_pals.slice(8, 16).some((x)=>(x))) {
		_addComment("    Base fade: object palettes");
		for (let p = 8; p < 16; ++p) {
			if (used_pals[p]) {
				_addComment(`        ${p-8}: ${start_hex.slice(p * 4, p * 4 + 4)} -> ${end_hex.slice(p * 4, p * 4 + 4)}`);
			}
		}
		_addComment(``);
	}
	_addComment(`    Cycle parameters:`);
	_addComment(`        Colour cycle slots: ${cycle_slots.slice(0,13)},`);
	let l = cycle_slots.length - 13;
	let start = 13;
	while (l > 0) {
		_addComment(`                            ${cycle_slots.slice(start,start + 13)},`);
		l -= 13;
		start += 13;
	}
	_addComment(`        Colour cycle frames per step: ${cycle_wait_frames}`);
	_addComment("");
	_addComment(`    Cycle colours:`);
	_addComment(`        Start  -> End`);
	for (let c = 0; c < cycle_gradients.length; ++c) {
		_addComment(`        ${cycle_start_hex[c]} -> ${cycle_end_hex[c]}`);
	}
	_addComment("");
	_addComment(`    Fade length: ${fade_steps * fade_wait_frames} frames`);
	_addComment(`    Cycle length: ${cycle_slots.length * cycle_wait_frames} frames`);
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
	let r = (parseInt(rgb[0] + rgb[1], 16) / 8) / 31;
	let g = (parseInt(rgb[2] + rgb[3], 16) / 8) / 31;
	let b = (parseInt(rgb[4] + rgb[5], 16) / 8) / 31;
	return [r, g, b];
}

function componentsGBS(rgb) {
	let r = parseInt(rgb[0] + rgb[1], 16);
	let g = parseInt(rgb[2] + rgb[3], 16);
	let b = parseInt(rgb[4] + rgb[5], 16);

	let r2 = Math.round((31 * r - 5 * g - b) / 200) / 31;
	let g2 = Math.round(( 3 * r + 35 * g - 13 * b) / 200) / 31;
	let b2 = Math.round((-9 * r - 5 * g + 39 *b) / 200) / 31;

	return [r2, g2, b2];
}

function components24(rgb) {
	let r = parseInt(rgb[0] + rgb[1], 16) / 255;
	let g = parseInt(rgb[2] + rgb[3], 16) / 255;
	let b = parseInt(rgb[4] + rgb[5], 16) / 255;
	return [r, g, b];
}

function components15(rgb) {
	rgb = parseInt(rgb);
	let r = (rgb & 7) / 31;
	let g = (rgb & 56) / 31;
	let b = (rgb & 448) / 31;
	return [r, g, b];
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

function sRGB_to_OKLab(r, g, b)
{
	// linearise rgb:
	r = Math.pow((r + 0.055) / 1.055, 2.4);
	g = Math.pow((g + 0.055) / 1.055, 2.4);
	b = Math.pow((b + 0.055) / 1.055, 2.4);

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
