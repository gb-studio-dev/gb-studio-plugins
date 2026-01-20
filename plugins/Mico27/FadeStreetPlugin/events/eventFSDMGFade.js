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

 */

const id = "GF_EVENT_FADE_STREET_DMG";
const groups = ["Fade Street"];
const description = "Fade between palettes in monochrome mode. This includes Super Game Boy mode. Has no effect in colour mode. Has the option to flicker colours for a smoother fade on some screens.";
const subGroups = {"Fade Street": "Monochrome Mode"};
const name = "DMG Fade";

const autoLabel = (fetchArg) => {
	let startpoint = fetchArg("startpoint");
	switch (startpoint) {
		case "default":
			startpoint = "default palette";
			break;
		case "custom":
			startpoint = "custom palette";
			break;
		case "white":
			startpoint = "white";
			break;
		case "light_grey":
			startpoint = "light grey";
			break;
		case "dark_grey":
			startpoint = "dark grey";
			break;
		case "black":
			startpoint = "black";
			break;
		case "inverted":
			startpoint = "inverted";
			break;
	}
	let endpoint = fetchArg("endpoint");
	switch (endpoint) {
		case "default":
			endpoint = "default palette";
			break;
		case "custom":
			endpoint = "custom palette";
			break;
		case "white":
			endpoint = "white";
			break;
		case "light_grey":
			endpoint = "light grey";
			break;
		case "dark_grey":
			endpoint = "dark grey";
			break;
		case "black":
			endpoint = "black";
			break;
		case "inverted":
			endpoint = "inverted";
			break;
	}
	let title = `DMG Fade from ${startpoint} to ${endpoint}`;
	if (fetchArg("fade_style") !== "even") {
		const frames = fetchArg("total_frames");
		title += ` (${frames} frames)`;
	}
	return title;
} 

const fields = [
	{
		type: "group",
		fields: [
			{
				label: "Affecting:",
				description: "Which palettes will this fade affect? Monochrome Game Boys have one four-colour palette for the background, and two four-colour palettes for sprites.",
			},
			{
				key: "use_bgp",
				label: "BGP",
				description: "The four-colour background palette.",
				type: "checkbox",
				defaultValue: true,
			},
			{
				key: "use_obp0",
				label: "OBP0",
				description: "The first four-colour sprite palette.",
				type: "checkbox",
				defaultValue: true,
			},
			{
				key: "use_obp1",
				label: "OBP1",
				description: "The second four-colour sprite palette.",
				type: "checkbox",
				defaultValue: true,
			},
		],
	},
	{
		type: "group",
		fields: [
			{
				label: "Fade from:",
				description: "The palettes at the start of the fade.",
				width: "50%",
			},
			{
				defaultValue: "white",
				key: "startpoint",
				type: "select",
				options: [
					["default",     "default DMG palettes for GB Studio"],
					["custom",      "custom palettes (specify)"],
					["white",       "all white"],
					["light_grey",  "all light grey"],
					["dark_grey",   "all dark grey"],
					["black",       "all black"],
					["inverted",    "inverted default palettes"],
				],
			},
		],
	},
	{
		conditions: [
			{
				key: "startpoint",
				in: ["custom",]
			},
			{
				key: "use_bgp",
				eq: true,
			}
		],
		type: "group",
		fields: [
			{
				label: "Start BGP:",
			},
			{
				defaultValue: "0",
				key: "start_bgp_0",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "1",
				key: "start_bgp_1",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "2",
				key: "start_bgp_2",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "3",
				key: "start_bgp_3",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
		],

	},
	{
		conditions: [
			{
				key: "startpoint",
				in: ["custom",]
			},
			{
				key: "use_obp0",
				eq: true,
			}
		],
		type: "group",
		fields: [
			{
				label: "Start OBP0:",
			},
			{
				defaultValue: "0",
				key: "start_obp0_0",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "1",
				key: "start_obp0_1",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "3",
				key: "start_obp0_3",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
		],

	},
	{
		conditions: [
			{
				key: "startpoint",
				in: ["custom",]
			},
			{
				key: "use_obp1",
				eq: true,
			}
		],
		type: "group",
		fields: [
			{
				label: "Start OBP1:",
			},
			{
				defaultValue: "0",
				key: "start_obp1_0",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "1",
				key: "start_obp1_1",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "3",
				key: "start_obp1_3",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
		],

	},
	{
		type: "group",
		fields: [
			{
				label: "Fade to:",
				description: "The palettes at the end of the fade.",
				width: "50%",
			},
			{
				defaultValue: "default",
				key: "endpoint",
				type: "select",
				options: [
					["default",     "default DMG palettes for GB Studio"],
					["custom",      "custom palettes (specify)"],
					["white",       "all white"],
					["light_grey",  "all light grey"],
					["dark_grey",   "all dark grey"],
					["black",       "all black"],
					["inverted",    "inverted default palettes"],
				],
			},
		],
	},
	{
		conditions: [
			{
				key: "endpoint",
				in: ["custom",]
			},
			{
				key: "use_bgp",
				eq: true,
			}
		],
		type: "group",
		fields: [
			{
				label: "End BGP:",
			},
			{
				defaultValue: "0",
				key: "end_bgp_0",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "1",
				key: "end_bgp_1",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "2",
				key: "end_bgp_2",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "3",
				key: "end_bgp_3",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
		],

	},
	{
		conditions: [
			{
				key: "endpoint",
				in: ["custom",]
			},
			{
				key: "use_obp0",
				eq: true,
			}
		],
		type: "group",
		fields: [
			{
				label: "End OBP0:",
			},
			{
				defaultValue: "0",
				key: "end_obp0_0",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "1",
				key: "end_obp0_1",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "3",
				key: "end_obp0_3",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
		],

	},
	{
		conditions: [
			{
				key: "endpoint",
				in: ["custom",]
			},
			{
				key: "use_obp1",
				eq: true,
			}
		],
		type: "group",
		fields: [
			{
				label: "End OBP1:",
			},
			{
				defaultValue: "0",
				key: "end_obp1_0",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "1",
				key: "end_obp1_1",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
			{
				defaultValue: "3",
				key: "end_obp1_3",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
				],
			},
		],

	},
	{
		type: "group",
		fields: [
			{
				label: "Fade style:",
				description: "The style affects which intermediate colours are shown in the fade, and the timing of the steps.",
				width: "50%",
			},
			{
				type: "select",
				key: "fade_style",
				defaultValue: "default",
				options: [
					["default",       "Default"],
					["flicker",  "Flicker intermediate colours"],
					["even",  "Evenly spaced steps"],
				],
			},
		],
	},
	{
		conditions: [
			{
				key: "fade_style",
				ne: "even",
			},
		],
		type: "group",
		fields: [
			{
				label: "Total length of fade in frames:",
				description: "The total length of the fade effect in frames.",
				width: "50%",
			},
			{
				key: "total_frames",
				type: "number",
				max: 180,
				min: 0,
				defaultValue: 30,
			},
		],
	},
	{
		conditions: [
			{
				key: "fade_style",
				eq: "even",
			},
		],
		type: "group",
		fields: [
			{
				label: "Frames to wait per step:",
				description: "The number of frames to wait between each step in the gradient.",
				width: "50%",
			},
			{
				key: "wait_frames",
				type: "number",
				max: 180,
				min: 0,
				defaultValue: 6,
			},
		],
	},
	{
		conditions: [
			{
				key: "total_frames",
				gt: 0,
			},
		],
		key: "force_initial",
		label: "[Advanced] Force load starting palettes.",
		description: "By default, the starting palettes are assumed to match the currently loaded palettes. For that reason, the plugin skips loading the 0th step in the gradient. Check this box to force loading the 0th step.",
		type: "checkbox",
		defaultValue: false,
	},
	{
		conditions: [
			{
				key: "fade_style",
				eq: "flicker",
			},
		],
		key: "flicker_non_adjacent",
		type: "checkbox",
		label: "[Advanced] Flicker non-adjacent colours",
		description: "When this box is checked, intermediate colours may be generated by flickering any pair of colours. If unchecked, only adjacent pairs of colours are flickered, i.e., black and dark grey, dark grey an light grey, or light grey and white.",
		defaultValue: "false",
	},
	{
		conditions: [
			{
				key: "fade_style",
				ne: "even",
			},
		],
		type: "group",
		fields: [
			{
				label: "[Advanced] Screen colours:",
				description: "Specifies the four colours appearing on the Game Boy screen. You do not need to change this option, but it can have a small effect on the timing of the steps in your fade. Don't assume that picking the \"correct\" option will make things better; look at the results and pick based on your own judgement. N.B. This option doesn't make the colours look different in GB Studio or anywhere else. It's about telling the plugin \"Here's how the four colours appear on my screen\". ",
				width: "50%",
			},
			{
				type: "select",
				key: "screen_colours",
				defaultValue: "green",
				options: [
					["green",    "Classic green (low contrast)"],
					["grey",     "Modern grey (high contrast)"],
					["gbs",      "GB Studio web export"],
					["custom",   "Custom (enter hex values)"],
				],
			},
		],
	},
	{
		conditions: [
			{
				key: "fade_style",
				ne: "even",
			},
			{
				key: "screen_colours",
				eq: "custom",
			},
		],
		type: "textarea",
		key: "colour_text",
		label: "Custom screen colours:",
		description: "Enter four colours in 24 bit hex format (e.g. #ff0000), from \"white\" to \"black\", separated by commas. These should approximately match the colours on the screen you are developing for.",
		defaultValue: "#8cad28,#6c9421,#426b29,#214231",
	},
];

const compile = (input, helpers) => {
	const { palettes, _addComment, appendRaw } = helpers;

	function bkg_byte_string(b) {
		return (b & 3).toString() + "," + ((b >> 2) & 3).toString() + "," + ((b >> 4) & 3).toString() + "," + ((b >> 6) & 3).toString();
	}

	function obj_byte_string(b) {
		return ((b >> 2) & 3).toString() + "," + ((b >> 4) & 3).toString() + "," + ((b >> 6) & 3).toString();
	}

	function bgp_byte(t) {
		if (input.fade_style === "flicker") {
			return l_shade_flicker(gradients[0][t],t) | (l_shade_flicker(gradients[1][t],t) << 2) | (l_shade_flicker(gradients[2][t],t) << 4) | (l_shade_flicker(gradients[3][t],t) << 6);
		} else {
			return l_shade(gradients[0][t],t) | (l_shade(gradients[1][t],t) << 2) | (l_shade(gradients[2][t],t) << 4) | (l_shade(gradients[3][t],t) << 6);
		}
	}

	function obp0_byte(t) {
		if (input.fade_style === "flicker") {
			return (l_shade_flicker(gradients[4][t],t) << 2) | (l_shade_flicker(gradients[5][t],t) << 4) | (l_shade_flicker(gradients[6][t],t) << 6);
		} else {
			return (l_shade(gradients[4][t],t) << 2) | (l_shade(gradients[5][t],t) << 4) | (l_shade(gradients[6][t],t) << 6);
		}
	}

	function obp1_byte(t) {
		if (input.fade_style === "flicker") {
			return (l_shade_flicker(gradients[7][t],t) << 2) | (l_shade_flicker(gradients[8][t],t) << 4) | (l_shade_flicker(gradients[9][t],t) << 6);
		} else {
			return (l_shade(gradients[7][t],t) << 2) | (l_shade(gradients[8][t],t) << 4) | (l_shade(gradients[9][t],t) << 6);
		}
	}

	function l_shade(lightness) {
		let min_dist = 1;
		let min_index = 0;
		for (let c = 0; c < lightness_array.length; ++ c) {
			let dist = Math.abs(lightness - lightness_array[c]);	
			if (dist < min_dist) {
				min_dist = dist;
				min_index = c;
			}
		}
		return min_index;
	}
	
	function l_shade_flicker(lightness, t) {
		let min_dist = 1;
		let min_index = 0;
		for (let c = 0; c < flicker_lightness_array.length; ++c) {
			let dist = Math.abs(lightness - flicker_lightness_array[c]);	
			if (dist < min_dist) {
				min_dist = dist;
				min_index = c;
			}
		}
		return flicker_index_array[min_index][t%2];
	}

	const green_pals = "#8cad28,#6c9421,#426b29,#214231"; // https://lospec.com/palette-list/dmg-nso
	const grey_pals =  "#ffffff,#949494,#363636,#000000";
	const gbs_pals = "#EFFFDE,#ADD794,#529273,#183442";
	let screen_pals;
	if (input.fade_style === "even") {
		screen_pals = green_pals;
	} else {
		switch (input.screen_colours) {
			default:
			case "green":
				screen_pals = green_pals;
				break;
			case "gbs":
				screen_pals = green_pals;
				break;
			case "grey":
				screen_pals = grey_pals;
				break;
			case "custom":
				screen_pals = input.colour_text;
				break;
		}
	}

	let lightness_array = Array(4);
	screen_pals = (screen_pals || "").split(',').slice(0,4);
	for (let c = 0; c < 4; ++c) {
		if (!screen_pals[c]) {
			throw new Error("Please enter 4 colours in 24 bit hex format, separated by commas.");
		}
		screen_pals[c] = screen_pals[c].trim().replace(/[^a-fA-F0-9]/g, "").padStart(6, 0).substring(0,6);
		const [r,g,b] = components(screen_pals[c]);
		if (r > 1 || r < 0 || g > 1 || g < 0 || b > 1 || b < 0) {
			throw new Error("Could not parse colour " + pals0[i] + ". Colours must be rgb24 hex values.");
		}
		[lightness_array[c],,] = sRGB_to_OKLab(r, g, b);
	}

	let flicker_lightness_array = []
	let flicker_index_array = [];
	for (let i = 0; i < 4; ++i) {
		for (let j = 0; j <= i; ++j) {
			if ((!input.flicker_non_adjacent) && (i - j > 1)) {
				continue;
			}
			// perceived lightness of flickering colours is nonlinear
			let high = Math.max(lightness_array[i], lightness_array[j]);
			let low  = Math.min(lightness_array[i], lightness_array[j]);
			flicker_lightness_array.push(((5 * low) + high) / 6); 
			flicker_index_array.push([i, j]);
		}
	}

	const default_dmg = [0, 1, 2, 3, 0, 1, 3, 0, 2, 3];
	const inverted =    [3, 2, 1, 0, 3, 2, 0, 3, 1, 0];
	const white =       [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	const black =       [3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
	const light_grey =  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
	const dark_grey =   [2, 2, 2, 2, 2, 2, 2, 2, 2, 2];

	let custom_start = [
		input.start_bgp_0,
		input.start_bgp_1,
		input.start_bgp_2,
		input.start_bgp_3,
		input.start_obp0_0,
		input.start_obp0_1,
		input.start_obp0_3,
		input.start_obp1_0,
		input.start_obp1_1,
		input.start_obp1_3,
	];
	let custom_end = [
		input.end_bgp_0,
		input.end_bgp_1,
		input.end_bgp_2,
		input.end_bgp_3,
		input.end_obp0_0,
		input.end_obp0_1,
		input.end_obp0_3,
		input.end_obp1_0,
		input.end_obp1_1,
		input.end_obp1_3,
	];

	let startpoint = black;
	switch (input.startpoint) {
		default:
		case "default":
			startpoint = default_dmg;
			break;
		case "white":
			startpoint = white;
			break;
		case "light_grey":
			startpoint = light_grey;
			break;
		case "dark_grey":
			startpoint = dark_grey;
			break;
		case "black":
			startpoint = black;
			break;
		case "inverted":
			startpoint = inverted;
			break;
		case "custom":
			startpoint = custom_start;
			break;

	}
	startpoint = startpoint.map((x) => parseInt(x));

	let endpoint;
	switch (input.endpoint) {
		default:
		case "default":
			endpoint = default_dmg;
			break;
		case "white":
			endpoint = white;
			break;
		case "light_grey":
			endpoint = light_grey;
			break;
		case "dark_grey":
			endpoint = dark_grey;
			break;
		case "black":
			endpoint = black;
			break;
		case "inverted":
			endpoint = inverted;
			break;
		case "custom":
			endpoint = custom_end;
			break;

	}
	endpoint = endpoint.map((x) => parseInt(x));

	const total_frames = input.total_frames;
	const force_step0 = input.force_initial;
	const steps = total_frames + 1;
	const steps_arr = [...Array(steps).keys()];

	let gradients = Array(10);
	for (let i = 0; i < 10; ++i) { 
		const c0 = lightness_array[startpoint[i]];
		const c1 = lightness_array[endpoint[i]];
		if (steps > 1) {
			const c_gradient = steps_arr.map((x) => c0 + ((c1 - c0) / (steps - 1)) * x);
			gradients[i] = c_gradient;
		} else {
			gradients[i] = [c1];
		}
	}

	let gbvm = "";
	let t_prev = 0;
	let bkg_byte_prev;
	let obp0_byte_prev;
	let obp1_byte_prev;
	let step0 = 1;
	if (force_step0 || (input.fade_style !== "even" && total_frames == 0)) {
		step0 = 0;
		bkg_byte_prev = -1;
		obp0_byte_prev = -1;
		obp1_byte_prev = -1;
	} else {
		bkg_byte_prev = bgp_byte(0);
		obp0_byte_prev = obp0_byte(0);
		obp1_byte_prev = obp1_byte(0);
	}

	for (let t = step0; t < steps; ++t) {
		const bkg_byte_next = bgp_byte(t);
		const obp0_byte_next = obp0_byte(t); 
		const obp1_byte_next = obp1_byte(t);
		const obj_word_next = (obp0_byte_next) | (obp1_byte_next << 8);

		const update_bkg = (bkg_byte_next != bkg_byte_prev) && input.use_bgp;
		const update_obp0 = (obp0_byte_next != obp0_byte_prev) && input.use_obp0;
		const update_obp1 = (obp1_byte_next != obp1_byte_prev) && input.use_obp1;
		const update_obj_word = update_obp0 && update_obp1; 

		const update_this_frame = (update_bkg || update_obp0 || update_obp1);

		bkg_byte_prev = bkg_byte_next;
		obp0_byte_prev = obp0_byte_next;
		obp1_byte_prev = obp1_byte_next;

		if (!update_this_frame) {
			continue;
		}

		let update_str = "";
		if (update_bkg) {
			const s = bkg_byte_string(bkg_byte_next);
			update_str += ` BGP=(${s})`;
		}
		if (update_obp0) {
			const s = obj_byte_string(obp0_byte_next);
			update_str += ` OBP0=(${s})`;
		}
		if (update_obp1) {
			const s = obj_byte_string(obp1_byte_next);
			update_str += ` OBP1=(${s})`;
		}

		if ((t > 0)) {
			if (input.fade_style === "even") {
				gbvm += "VM_PUSH_CONST " + (input.wait_frames) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
			} else {
				gbvm += "VM_PUSH_CONST " + (t - t_prev) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
				t_prev = t;
			}
		}
		gbvm += `\n; Frame ${t}: ${update_str}\n`
		if (update_bkg) {
			gbvm += `VM_SET_CONST_UINT8 _DMG_palette 0x${bkg_byte_next.toString(16).padStart(2, 0)}\n`;
		}
		if (update_obj_word) {
			gbvm += `VM_SET_CONST_INT16 ^/(_DMG_palette + 1)/ 0x${obj_word_next.toString(16).padStart(4, 0)}\n`
		} else if (update_obp0) {
			gbvm += `VM_SET_CONST_UINT8 ^/(_DMG_palette + 1)/ 0x${obp0_byte_next.toString(16).padStart(2, 0)}\n`
		} else if (update_obp1) {
			gbvm += `VM_SET_CONST_UINT8 ^/(_DMG_palette + 2)/ 0x${obp1_byte_next.toString(16).padStart(2, 0)}\n`
		}
	}
	if (input.fade_style !== "even" && t_prev < total_frames - 1) {
		gbvm += "VM_PUSH_CONST " + (total_frames - t_prev) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
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
	_addComment(`                        DMG Fade`);
	_addComment(`               [GF_EVENT_FADE_STREET_DMG]`);
	_addComment(``);
	_addComment(`    Parameters:`);
	let start_string = "";
	let end_string = "";
	if (input.use_bgp) {
		start_string += `BGP=(${bkg_byte_string(bgp_byte(0))}) `;
		end_string += `BGP=(${bkg_byte_string(bgp_byte(steps-1))}) `;
	}
	if (input.use_obp0) {
		start_string += `OBP0=(${obj_byte_string(obp0_byte(0))}) `;
		end_string += `OBP0=(${obj_byte_string(obp0_byte(steps-1))}) `;
	}
	if (input.use_obp1) {
		start_string += `OBP1=(${obj_byte_string(obp1_byte(0))})`;
		end_string += `OBP1=(${obj_byte_string(obp1_byte(steps-1))})`;
	}
	_addComment(`        Start: "${input.startpoint}" ${start_string}`);
	_addComment(`        End: "${input.endpoint}" ${end_string}`);
	_addComment(`        Fade style: ${input.fade_style}`);
	if (input.fade_style === "flicker") {
		_addComment(`        Flicker non-adjacent colours: ${input.flicker_non_adjacent}`);
	}
	if (input.fade_style === "even") {
		_addComment(`        Frames per step: ${input.wait_frames}`);
	} else {
		_addComment(`        Total frames: ${total_frames}`);
		_addComment(`        Force step 0: ${force_step0}`);
		_addComment(`        Screen colours: ${screen_pals}`);
	}
	_addComment("");
	appendRaw(gbvm);
	_addComment(`~~~ End of DMG Fade block ~~~\n\n`);
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
