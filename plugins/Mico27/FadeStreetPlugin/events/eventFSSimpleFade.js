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
	
	Simple Fade is a streamlined version of the Standard Fade event.
	The user only needs to supply palettes for one endpoint of the colour
	gradients, while the other endpoint is selected from a list of common
	options.
*/

const id = "GF_EVENT_FADE_STREET_QUICKFADE";
const groups = ["Fade Street", "Fade Street - Beginner Friendly"];
const subGroups = {"Fade Street": "Colour Mode - Fade Only", "Fade Street - Beginner Friendly": "Fade in or out"};
const description = "Fade between your chosen palettes and a preset endpoint e.g. fade to black, fade from white. \"Simple\" refers to a simplified interface to let you solve common tasks quickly.";
const name = "Simple Fade";

const autoLabel = (fetchArg) => {
	let steps = (fetchArg("steps") - 1);
	const wait_frames = fetchArg("frames");
	const skip_step0 = fetchArg("force_initial") === false;
	const no_wait = fetchArg("no_initial_wait") === "true";
	if (skip_step0 && no_wait) {
		steps -= 1;
	}
	let endpoint = fetchArg("endpoint");
	if (endpoint === "rgb" || endpoint ===  "colourised" || endpoint === "multiply") {
		const r = fetchArg("target_r");
		const g = fetchArg("target_g");
		const b = fetchArg("target_b");
		endpoint += ` (${r},${g},${b})`;
	} else if (endpoint === "night") {
		const pc = fetchArg("night_intensity");
		endpoint += ` ${pc}%`;
	} else if (endpoint === "hue") {
		const amount = fetchArg("hue_shift");
		endpoint += ` shifted ${amount}`;
	} else if (endpoint === "desaturated") {
		const amount = fetchArg("desaturate_intensity");
		endpoint = `${amount}% ` + endpoint;
	}
	const tofrom = fetchArg("tofrom");
	const frames = wait_frames * steps;
	return `Simple Fade ${tofrom} ${endpoint} (${frames} frames)`;
}

const fields = [
	{
		type: "group",
		fields: [
			{
				label: "Fade:",
				description: "Select a preset endpoint for the fade. If you select a \"from\" endpoint, this forms the first step in the gradient, and should ideally match the palettes that are already loaded in the scene.",
			},
			{
				key: "tofrom",
				type: "select",
				defaultValue: "from",
				options: [
					["to", "to"],
					["from", "from"],
				],
			},
			{
				defaultValue: "white",
				key: "endpoint",
				type: "select",
				options: [
					["white",     "white"],
					["black",     "black"],
					["rgb",       "solid colour (enter RGB)"],
					["desaturated", "desaturated"],
					["hue", "hue shifted"],
					["night", "day for night filter"],
					["saturated", "saturated"],
					["inverted", "inverted"],
					["colourised", "colourised"],
					["multiply", "RGB multiply"],
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
				key: "hue_shift",
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
				key: "desaturate_intensity",
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
				key: "night_intensity",
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
		type: "group",
		fields: [
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
		fields: [
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
		label: "Starting palettes - background:",
		description: "Background palettes at the beginning of the colour fade.",
		conditions: [
			{
				key: "tofrom",
				eq: "to",
			},
		],
	},
	{
		label: "Final palettes - background:",
		description: "Background palettes at the end of the colour fade.",
		conditions: [
			{
				key: "tofrom",
				eq: "from",
			},
		],
	},
	{
		key: "bkg0_start",
		type: "palette",
		paletteIndex: 0,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "bkg1_start",
		type: "palette",
		paletteIndex: 1,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "bkg2_start",
		type: "palette",
		paletteIndex: 2,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "bkg3_start",
		type: "palette",
		paletteIndex: 3,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "bkg4_start",
		type: "palette",
		paletteIndex: 4,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "bkg5_start",
		type: "palette",
		paletteIndex: 5,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "bkg6_start",
		type: "palette",
		paletteIndex: 6,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "bkg7_start",
		type: "palette",
		paletteIndex: 7,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		label: "Starting palettes - sprites:",
		description: "Sprite palettes at the beginning of the colour fade. These should usually match the palettes that are already loaded.",
		conditions: [
			{
				key: "tofrom",
				eq: "to",
			},
		],
	},
	{
		label: "Final palettes - sprites:",
		description: "Sprite palettes at the end of the colour fade. These should usually match the palettes that are already loaded.",
		conditions: [
			{
				key: "tofrom",
				eq: "from",
			},
		],
	},
	{
		key: "obj0_start",
		type: "palette",
		paletteType: "sprite",
		paletteIndex: 0,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "obj1_start",
		type: "palette",
		paletteType: "sprite",
		paletteIndex: 1,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "obj2_start",
		type: "palette",
		paletteType: "sprite",
		paletteIndex: 2,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "obj3_start",
		type: "palette",
		paletteType: "sprite",
		paletteIndex: 3,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "obj4_start",
		type: "palette",
		paletteType: "sprite",
		paletteIndex: 4,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "obj5_start",
		type: "palette",
		paletteType: "sprite",
		paletteIndex: 5,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "obj6_start",
		type: "palette",
		paletteType: "sprite",
		paletteIndex: 6,
		defaultValue: "keep",
		canKeep: true,
	},
	{
		key: "obj7_start",
		type: "palette",
		paletteType: "sprite",
		paletteIndex: 7,
		defaultValue: "keep",
		canKeep: true,
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

	let gradients = Array(64);
	let input_pals = Array(64);
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
		if (bkg_start[p_index] === "keep") {
			using[p_index] = false;
		} else {
			using[p_index] = true;
		}
		const in_pal  = palettes.find((p) => p.id === bkg_start[p_index]);
		for (let c_index = 0; c_index < 4; ++c_index) {
			const linear_index = p_index * 4 + c_index;
			input_pals[linear_index]   =  in_pal && in_pal.colors ? in_pal.colors[c_index] : dmg_pal[c_index];
		}
	}

	for (let p_index = 0; p_index < 8; ++p_index) {
		if (obj_start[p_index] === "keep") {
			using[p_index + 8] = false;
		} else {
			using[p_index + 8] = true;
		}
		const in_pal  = palettes.find((p) => p.id === obj_start[p_index]);
		for (let c_index = 0; c_index < 4; ++c_index) {
			const linear_index = 32 + p_index * 4 + c_index;
			input_pals[linear_index]   =  in_pal && in_pal.colors ? in_pal.colors[c_index] : dmg_pal[c_index];
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
		const [OK_L0, OK_a0, OK_b0] = linear_RGB_to_OKLab(r0, g0, b0);

		let [OK_L1, OK_a1, OK_b1] = [0,0,0];

		switch(input.endpoint) {
			case "multiply":
				[r1, g1, b1] = [input.target_r / 31.0, input.target_g / 31.0, input.target_b / 31.0];
				[OK_L1, OK_a1, OK_b1] = linear_RGB_to_OKLab(r0 * r1, g0 * g1, b0 * b1);
				break;
			case "night":
				[L,C,h] = OKLab_to_OKLCh(OK_L0, OK_a0, OK_b0);
				// desaturate reds and greens:
				C = 0.9 * C * Math.pow((1 - Math.abs(-1.6746081505015078 - h) / 6.283185), 1.5);
				// lower brightnes
				L = 0.94 * Math.pow(L, 1.9);
				[OK_L1, OK_a1, OK_b1] = OKLCh_to_OKLab(L, C, h);
				// hue shift towards blue:
				[blue_l, blue_a, blue_b] = linear_RGB_to_OKLab(0, 0, 1);
				OK_a1 = OK_a1 + 0.08 * (blue_a - OK_a1);
				OK_b1 = OK_b1 + 0.08 * (blue_b - OK_b1);
				// mix with original colours:
				OK_L1 = OK_L0 + (input.night_intensity / 100.0) * (OK_L1 - OK_L0);
				OK_a1 = OK_a0 + (input.night_intensity / 100.0) * (OK_a1 - OK_a0);
				OK_b1 = OK_b0 + (input.night_intensity / 100.0) * (OK_b1 - OK_b0);
				break;
			case "hue":
				[L,C,h] = OKLab_to_OKLCh(OK_L0, OK_a0, OK_b0);
				[OK_L1, OK_a1, OK_b1] = OKLCh_to_OKLab(L,C,h + (input.hue_shift / 360) * 6.28318);
				break;
			case "desaturated":
				[L,C,h] = OKLab_to_OKLCh(OK_L0, OK_a0, OK_b0);
				C = C * (1 - input.desaturate_intensity / 100.0);
				[OK_L1, OK_a1, OK_b1] = OKLCh_to_OKLab(L, C, h);
				break;
			case "inverted":
				[OK_L1, OK_a1, OK_b1] = linear_RGB_to_OKLab(1 - r0, 1 - g0 , 1 - b0);
				break;
			case "saturated":
				// search for highest C inside rgb gamut
				[L,C,h] = OKLab_to_OKLCh(OK_L0, OK_a0, OK_b0);
				left = 0;  // bracket inside
				right = 1; // bracket outside
				epsilon = 0.001;
				while (right - left > epsilon) {
					mid = left + (right - left) / 2;
					[r1, g1, b1] = OKLCh_to_linear_RGB(L, mid, h);
					if (r1 > 1 || g1 > 1 || b1 > 1) {
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
				[OK_L1, OK_a1, OK_b1] = linear_RGB_to_OKLab(input.target_r / 31, input.target_g / 31, input.target_b / 31);
				OK_L1 = OK_L0;
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

		let OK_L_gradient;
		let OK_a_gradient;
		let OK_b_gradient;

		if (input.tofrom === "from") {
			OK_L_gradient = steps_arr.map((x) => OK_L1 + ((OK_L0 - OK_L1) / (steps - 1)) * x);
			OK_a_gradient = steps_arr.map((x) => OK_a1 + ((OK_a0 - OK_a1) / (steps - 1)) * x);
			OK_b_gradient = steps_arr.map((x) => OK_b1 + ((OK_b0 - OK_b1) / (steps - 1)) * x);
		} else {
			OK_L_gradient = steps_arr.map((x) => OK_L0 + ((OK_L1 - OK_L0) / (steps - 1)) * x);
			OK_a_gradient = steps_arr.map((x) => OK_a0 + ((OK_a1 - OK_a0) / (steps - 1)) * x);
			OK_b_gradient = steps_arr.map((x) => OK_b0 + ((OK_b1 - OK_b0) / (steps - 1)) * x);
		}
		gradients[i] = steps_arr.map((x) => OKLab_to_GB(OK_L_gradient[x], OK_a_gradient[x], OK_b_gradient[x]));
		end_hex[i] = OKLab_to_hex(OK_L_gradient[OK_L_gradient.length - 1], OK_a_gradient[OK_a_gradient.length - 1], OK_b_gradient[OK_b_gradient.length - 1]);
		start_hex[i]   = OKLab_to_hex(OK_L_gradient[0], OK_a_gradient[0], OK_b_gradient[0]);
	}

	// Generate GBVM output:
	let gbvm = "";

	const step0 = force_step0 ? 0 : 1;

	if (step0 == 1) {
		gbvm += `\n;     Step 0: do nothing\n`;
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
	_addComment(`                   Simple Fade`);
	_addComment(`          [GF_EVENT_FADE_STREET_QUICKFADE]`);
	_addComment(``);
	_addComment(`    Parameters:`);
	_addComment(`        Endpoint: ${input.tofrom} ${endpoint_str}`);
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
	_addComment(`~~~ End of Simple Fade block ~~~\n\n`);
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

function OKLab_to_hex(OK_L, OK_a, OK_b)
{
	let [r, g, b] = OKLab_to_GB(OK_L, OK_a, OK_b);

	let r2 = (8 * r).toString(16).padStart(2, '0');
    	let g2 = (8 * g).toString(16).padStart(2, '0');
    	let b2 = (8 * b).toString(16).padStart(2, '0');

	return `${r2}${g2}${b2}`;
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

function OKLCh_to_linear_RGB(L, C, h)
{
	const [OK_L, OK_a, OK_b] = OKLCh_to_OKLab(L, C, h);
	return OKLab_to_linear_RGB(OK_L, OK_a, OK_b);
}

