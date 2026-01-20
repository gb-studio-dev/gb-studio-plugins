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

const id = "GF_EVENT_FADE_STREET_AUTO_FADE_OUT";
const groups = ["Fade Street", "Fade Street - Beginner Friendly"];
const subGroups = {"Fade Street": "Monochrome or Colour Mode - Fade Only", "Fade Street - Beginner Friendly": "Fade in or out"};
const description = "Fade out to a solid colour from the selected palettes for this scene.";
const name = "Automagic Fade Out";

const autoLabel = (fetchArg) => {
	const fade_length = [
		[2,  0],
		[5,  1],
		[7,  2],
		[8,  4],
		[15, 5],
		[16, 8],
		[32, 8],
	];
	const speed = fetchArg("speed");
	const [steps, wait_frames] = fade_length[parseInt(speed)];
	let frames = (steps - 1) * wait_frames;
	let endpoint = fetchArg("endpoint");
	if (endpoint === "RGB") {
		const r = fetchArg("starting_r");
		const g = fetchArg("starting_g");
		const b = fetchArg("starting_b");
		endpoint += `(${r},${g},${b})`;
	}
	return `Automagic Fade Out to ${endpoint} (${frames} frames)`;
}

const fields = [
	{
		type: "group",
		fields: [
			{
				label: "Fade to:",
				description: "Colour to fade out to.",
				width: "50%",
			},
			{
				defaultValue: "White",
				key: "endpoint",
				type: "select",
				options: [
					["White",       "White"],
					["Black",       "Black"],
					["RGB",         "solid colour (enter RGB)"],
				],
			},
		],
	},
	{
		type: "group",
		conditions: [
			{
				key: "endpoint",
				in: ["RGB"]
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
				key: "endpoint",
				in: ["RGB"]
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
				key: "endpoint",
				in: ["RGB"]
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
				key: "endpoint",
				in: ["RGB"]
			},
		],
		label: " ",
	},
	{
		conditions: [
			{
				key: "endpoint",
				in: ["RGB"]
			},
		],
		type: "group",
		fields: [
			{
				label: "Monochrome fade from:",
				description: "Colour to fade in from on monochrome Game Boys.",
				width: "50%",
			},
			{
				defaultValue: "normal",
				key: "dmg_endpoint",
				type: "select",
				options: [
					["white",       "White"],
					["black",       "Black"],
				],
			},
		],
	},
	{
		type: "group",
		fields: [
			{
				label: "Speed:",
				description: "Speed of fade",
				width: "50%",
			},
			{
				defaultValue: "3",
				key: "speed",
				type: "select",
				options: [
					["0",   "instant"],
					["1",   "1"],
					["2",  "2"],
					["3",  "3"],
					["4",  "4"],
					["5", "5"],
					["6", "6 (Slowest)"],
				],
			},
		],
	},

];

const compile = (input, helpers) => {
	const { palettes, _addComment, appendRaw, scene, settings, getNextLabel } = helpers;
	
	function bkg_byte_string(b) {
		return (b & 3).toString() + "," + ((b >> 2) & 3).toString() + "," + ((b >> 4) & 3).toString() + "," + ((b >> 6) & 3).toString();
	}

	function obj_byte_string(b) {
		return ((b >> 2) & 3).toString() + "," + ((b >> 4) & 3).toString() + "," + ((b >> 6) & 3).toString();
	}

	function bgp_byte(t) {
		if (input.fade_style === "flicker") {
			return l_shade_flicker(dmg_gradients[0][t],t) | (l_shade_flicker(dmg_gradients[1][t],t) << 2) | (l_shade_flicker(dmg_gradients[2][t],t) << 4) | (l_shade_flicker(dmg_gradients[3][t],t) << 6);
		} else {
			return l_shade(dmg_gradients[0][t],t) | (l_shade(dmg_gradients[1][t],t) << 2) | (l_shade(dmg_gradients[2][t],t) << 4) | (l_shade(dmg_gradients[3][t],t) << 6);
		}
	}

	function obp0_byte(t) {
		if (input.fade_style === "flicker") {
			return (l_shade_flicker(dmg_gradients[4][t],t) << 2) | (l_shade_flicker(dmg_gradients[5][t],t) << 4) | (l_shade_flicker(dmg_gradients[6][t],t) << 6);
		} else {
			return (l_shade(dmg_gradients[4][t],t) << 2) | (l_shade(dmg_gradients[5][t],t) << 4) | (l_shade(dmg_gradients[6][t],t) << 6);
		}
	}

	function obp1_byte(t) {
		if (input.fade_style === "flicker") {
			return (l_shade_flicker(dmg_gradients[7][t],t) << 2) | (l_shade_flicker(dmg_gradients[8][t],t) << 4) | (l_shade_flicker(dmg_gradients[9][t],t) << 6);
		} else {
			return (l_shade(dmg_gradients[7][t],t) << 2) | (l_shade(dmg_gradients[8][t],t) << 4) | (l_shade(dmg_gradients[9][t],t) << 6);
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

	const dmg_screen_pals = ["8cad28","6c9421","426b29","214231"]; // https://lospec.com/palette-list/dmg-nso
	const default_dmg = [0, 1, 2, 3, 0, 1, 3, 0, 2, 3];
	const white =       [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	const black =       [3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
	
	let lightness_array = Array(4);
	for (let c = 0; c < 4; ++c) {
		const [r,g,b] = components24(dmg_screen_pals[c]);
		[lightness_array[c],,] = sRGB_to_OKLab(r, g, b);
	}

	let dmg_endpoint = white;
	switch (input.dmg_endpoint) {
		default:
		case "white":
			dmg_endpoint = white;
			break;
		case "black":
			dmg_endpoint = black;
			break;
	}

	const dmg_startpoint = default_dmg;

	let flicker_lightness_array = []
	let flicker_index_array = [];
	for (let i = 0; i < 4; ++i) {
		for (let j = 0; j <= i; ++j) {
			if ((!input.flicker_non_adjacent) && (i - j > 1)) {
				continue;
			}
			// perceived lightness of flickering colours is nonlinear
			const high = Math.max(lightness_array[i], lightness_array[j]);
			const low  = Math.min(lightness_array[i], lightness_array[j]);
			flicker_lightness_array.push(((5 * low) + high) / 6); 
			flicker_index_array.push([i, j]);
		}
	}
	

	const dmg_pal = [
		"E8F8E0",
		"B0F088",
		"509878",
		"202850"
	];

	const mode = settings['colorMode'];


	let colour_gradients = Array(64);
	let scene_pals = Array(64);
	let input_pals = Array(64);
	let end_hex = Array(64);
	let using = Array(16);
	
	if (mode !== "mono") {
		// Get background palettes for the scene:
		if (scene.background.autoColor) {
			for (let n = 0; n < scene.background.autoPalettes.length; ++n) {
				using[n] = true;
				for (let c_index = 0; c_index < 4; ++c_index) {
					const linear_index = n * 4 + c_index;
					scene_pals[linear_index]   =  scene.background.autoPalettes[n] && scene.background.autoPalettes[n].colors ? scene.background.autoPalettes[n].colors[c_index] : dmg_pal[c_index];
				}
			}
			/*
			for (let n = scene.background.autoPalettes.length; n < 8; ++n) {
				const pal_id = settings.defaultBackgroundPaletteIds[n];
				const pal  = palettes.find((p) => p.id === pal_id);
				for (let c_index = 0; c_index < 4; ++c_index) {
					const linear_index = n * 4 + c_index;
					scene_pals[linear_index]   =  pal && pal.colors ? pal.colors[c_index] : dmg_pal[c_index];
				}
			}*/
		} else {
			for (let n = 0; n < scene.paletteIds.length; ++n) {
				using[n] = true;
				let pal_id;
				if (scene.paletteIds[n]) {
					pal_id = scene.paletteIds[n];
				} else {
					pal_id = settings.defaultBackgroundPaletteIds[n];
				}
				const pal  = palettes.find((p) => p.id === pal_id);
				for (let c_index = 0; c_index < 4; ++c_index) {
					const linear_index = n * 4 + c_index;
					scene_pals[linear_index]   =  pal && pal.colors ? pal.colors[c_index] : dmg_pal[c_index];
				}
			}
			for (let n = scene.paletteIds.length; n < 8; ++n) {
				using[n] = true;
				const pal_id = settings.defaultBackgroundPaletteIds[n];
				const pal  = palettes.find((p) => p.id === pal_id);
				for (let c_index = 0; c_index < 4; ++c_index) {
					const linear_index = n * 4 + c_index;
					scene_pals[linear_index]   =  pal && pal.colors ? pal.colors[c_index] : dmg_pal[c_index];
				}
			}
		}

		// Get sprite palettes for the scene:
		for (let n = 0; n < scene.spritePaletteIds.length; ++n) {
			using[8 + n] = true;
			let pal_id;
			if (scene.spritePaletteIds[n]) {
				pal_id = scene.spritePaletteIds[n];
			} else {
				pal_id = settings.defaultSpritePaletteIds[n];
			}
			const pal  = palettes.find((p) => p.id === pal_id);
			for (let c_index = 0; c_index < 4; ++c_index) {
				const linear_index = 32 + n * 4 + c_index;
				scene_pals[linear_index]   =  pal && pal.colors ? pal.colors[c_index] : dmg_pal[c_index];
			}
		}
		for (let n = scene.spritePaletteIds.length; n < 8; ++n) {
			using[8 + n] = true;
			const pal_id = settings.defaultSpritePaletteIds[n];
			const pal  = palettes.find((p) => p.id === pal_id);
			for (let c_index = 0; c_index < 4; ++c_index) {
				const linear_index = 32 + n * 4 + c_index;
				scene_pals[linear_index]   =  pal && pal.colors ? pal.colors[c_index] : dmg_pal[c_index];
			}
		}
	}
	
	let endpoint_str = input.endpoint;
	if (endpoint_str === "RGB") {
		const r = input.starting_r;
		const g = input.starting_g;
		const b = input.starting_b;
		endpoint_str += ` (${r},${g},${b})`;
	}

	let mode_str;
	switch (mode) {
		case "mono":
			mode_str = "DMG only";
			break;
		case "color":
			mode_str = "Colour only";
			break;
		case "mixed":
			mode_str = "Colour + DMG";
			break;
	}

	function palettes_equal(index0, step1) {
		if (!using[Math.floor(index0 / 4)]) {
			return true;
		}
		if (step1 == 0) {
			return false;
		}
		for (let pal_entry = 0; pal_entry < 4; ++pal_entry) {
			let [r0,g0,b0] = colour_gradients[index0 + pal_entry][step1];
			let [r1,g1,b1] = colour_gradients[index0 + pal_entry][step1 - 1];
			if (r0 != r1 || g0 != g1 || b0 != b1) {
				return false;
			}
		}
		return true;
	}

	// INPUTS
	const fade_length = [
		[2, 1],
		[5, 1],
		[7, 2],
		[8, 4],
		[15,5],
		[16,8],
		[32,8],
	];

	const [steps, wait_frames] = fade_length[parseInt(input.speed)];
	const no_wait = (steps == 2);
	const step0 = 1;

	const dmg_total_frames = (steps - 1) * wait_frames + 1;
	const dmg_steps_arr = [...Array(dmg_total_frames).keys()]

	let dmg_gradients = Array(10);
	for (let i = 0; i < 10; ++i) { 
		const c0 = lightness_array[dmg_startpoint[i]];
		const c1 = lightness_array[dmg_endpoint[i]];
		if (dmg_total_frames > 2) {
			const c_gradient = dmg_steps_arr.map((x) => c0 + ((c1 - c0) / (dmg_total_frames - 1)) * x);
			dmg_gradients[i] = c_gradient;
		} else {
			dmg_gradients[i] = [c1];
		}
	}
	let dmg_gbvm = "; MONOCHROME MODE FADE\n";
	let t_prev = 0;
	let bkg_byte_prev = bgp_byte(0);
	let obp0_byte_prev = obp0_byte(0);
	let obp1_byte_prev = obp1_byte(0);

	for (let t = step0; t < dmg_total_frames; ++t) {
		const bkg_byte_next = bgp_byte(t);
		const obp0_byte_next = obp0_byte(t); 
		const obp1_byte_next = obp1_byte(t);
		const obj_word_next = (obp0_byte_next) | (obp1_byte_next << 8);

		const update_bkg = (bkg_byte_next != bkg_byte_prev);
		const update_obp0 = (obp0_byte_next != obp0_byte_prev);
		const update_obp1 = (obp1_byte_next != obp1_byte_prev);
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
			dmg_gbvm += "VM_PUSH_CONST " + (t - t_prev) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
			t_prev = t;
		}
		dmg_gbvm += `\n; Frame ${t}: ${update_str}\n`
		if (update_bkg) {
			dmg_gbvm += `VM_SET_CONST_UINT8 _DMG_palette 0x${bkg_byte_next.toString(16).padStart(2, 0)}\n`;
		}
		if (update_obj_word) {
			dmg_gbvm += `VM_SET_CONST_INT16 ^/(_DMG_palette + 1)/ 0x${obj_word_next.toString(16).padStart(4, 0)}\n`
		} else if (update_obp0) {
			dmg_gbvm += `VM_SET_CONST_UINT8 ^/(_DMG_palette + 1)/ 0x${obp0_byte_next.toString(16).padStart(2, 0)}\n`
		} else if (update_obp1) {
			dmg_gbvm += `VM_SET_CONST_UINT8 ^/(_DMG_palette + 2)/ 0x${obp1_byte_next.toString(16).padStart(2, 0)}\n`
		}
	}
	if (t_prev < dmg_total_frames - 1) {
		dmg_gbvm += "VM_PUSH_CONST " + (dmg_total_frames - t_prev) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
	}

	// Create gradients:
	const steps_arr = [...Array(steps).keys()];

	for (let i = 0 ; i < 64; ++i) { // 4 colours * 16 palettes
		const p = Math.floor(i / 4);
		if (!using[p]) {
		      	continue;
		}
		const [r0, g0, b0] = components(scene_pals[i]);
		const [OK_L0, OK_a0, OK_b0] = sRGB_to_OKLab(r0, g0, b0);

		let [OK_L1, OK_a1, OK_b1] = [0,0,0];

		switch (input.endpoint) {
			case "White":
				[OK_L1, OK_a1, OK_b1] = sRGB_to_OKLab(1, 1, 1);
				break;
			case "Black":
				[OK_L1, OK_a1, OK_b1] = [0, 0, 0];
				break;
			case "RGB":
				[OK_L1, OK_a1, OK_b1] = sRGB_to_OKLab(input.starting_r / 31, input.starting_g / 31, input.starting_b / 31);
				break;
		}
		const OK_L_gradient = steps_arr.map((x) => OK_L0 + ((OK_L1 - OK_L0) / (steps - 1)) * x);
		const OK_a_gradient = steps_arr.map((x) => OK_a0 + ((OK_a1 - OK_a0) / (steps - 1)) * x);
		const OK_b_gradient = steps_arr.map((x) => OK_b0 + ((OK_b1 - OK_b0) / (steps - 1)) * x);
		colour_gradients[i] = steps_arr.map((x) => OKLab_to_GB(OK_L_gradient[x], OK_a_gradient[x], OK_b_gradient[x]));
			end_hex[i] = OKLab_to_hex(OK_L_gradient[OK_L_gradient.length - 1], OK_a_gradient[OK_a_gradient.length - 1], OK_b_gradient[OK_b_gradient.length - 1]);
	}
	// Generate GBVM output:
	let colour_gbvm = "; COLOUR MODE FADE\n";

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
			bkg_mask = bit + bkg_mask;
			using_now[p] = bit;
		}
		bkg_mask = "0b" + bkg_mask;

		let obj_mask = "";
		for (let p = 8; p < 16; ++p) {
			let bit = palettes_equal(p * 4, j) ? 0 : 1;
			obj_mask = bit + obj_mask;
			using_now[p] = bit;
		}
		obj_mask = "0b" + obj_mask;

		// If no palettes are updated at this step, we want to skip to
		// the next step, but carry over the wait frames so the timing
		// remains the same.
		if (bkg_mask == "0b00000000" && obj_mask == "0b00000000") {
			if (j < steps - 1) {
				colour_gbvm += `\n;     Step ${j}: do nothing.\n`;
				carried_wait += wait_frames;
				continue;
			} else {
				colour_gbvm += `\n;     Step ${j}: wait ${wait_frames + carried_wait} frames.\n`;
				// write any remaining wait frames left:
				colour_gbvm += "VM_PUSH_CONST " + (wait_frames + carried_wait) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
				break;
			}
		}

		if (j == 0 ||
			(j == 1 && step0 == 1 && no_wait)) {
			// Don't wait before step0, 
			// or before step1, if the "Don't wait before loading step 1..." option is checked.
			colour_gbvm += `\n;     Step ${j}: load palettes.\n`;
		} else {
			colour_gbvm += `\n;     Step ${j}: wait ${wait_frames + carried_wait} frames, then load palettes.\n`;
			// add a wait
			colour_gbvm += "VM_PUSH_CONST " + (wait_frames + carried_wait) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
			carried_wait = 0;
		}
		if (bkg_mask != "0b00000000") { // 1+ bkg palettes to load this frame
			colour_gbvm += "VM_LOAD_PALETTE " + bkg_mask + ", .PALETTE_BKG\n";
			colour_gbvm += ";          GBS White     GBS LightG    GBS DarkG     GBS Black   ; Pal #\n";
			for (let p = 0; p < 8; ++p) {
				if (!using_now[p]) {
					continue;
				}
				let [r0,g0,b0] = colour_gradients[p * 4][j];
				let [r1,g1,b1] = colour_gradients[p * 4 + 1][j];
				let [r2,g2,b2] = colour_gradients[p * 4 + 2][j];
				let [r3,g3,b3] = colour_gradients[p * 4 + 3][j];
				const pals =  String(r0).padStart(2, ' ') + ", " +  String(g0).padStart(2, ' ') + ", " +  String(b0).padStart(2, ' ') + ",   " +  String(r1).padStart(2, ' ') + ", " +  String(g1).padStart(2, ' ') + ", " +  String(b1).padStart(2, ' ') + ",   " +  String(r2).padStart(2, ' ') + ", " +  String(g2).padStart(2, ' ') + ", " +  String(b2).padStart(2, ' ') + ",   " +  String(r3).padStart(2, ' ') + ", " +  String(g3).padStart(2, ' ') + ", " +  String(b3).padStart(2, ' ') + `  ; BKG ${p}`;
				colour_gbvm += ".CGB_PAL   " + pals + "\n";
			}
		}
		if (obj_mask != "0b00000000") { // 1+ obj palettes to load this frame
			colour_gbvm += "VM_LOAD_PALETTE " + obj_mask + ", .PALETTE_SPRITE\n";
			colour_gbvm += ";          GBS Transp.   GBS White     GBS LightG    GBS Black   ; Pal #\n";
			for (let p = 8; p < 16; ++p) {
				if (!using_now[p]) {
					continue;
				}
				let [r0,g0,b0] = colour_gradients[p * 4][j];
				let [r1,g1,b1] = colour_gradients[p * 4 + 1][j];
				let [r3,g3,b3] = colour_gradients[p * 4 + 3][j];
				const pals = ubh(p) + String(r0).padStart(2, ' ') + ", " +  String(g0).padStart(2, ' ') + ", " +  String(b0).padStart(2, ' ') + ",   " +  String(r1).padStart(2, ' ') + ", " +  String(g1).padStart(2, ' ') + ", " +  String(b1).padStart(2, ' ') + ",   " +  String(r3).padStart(2, ' ') + ", " + String(g3).padStart(2, ' ') + ", " +  String(b3).padStart(2, ' ') + `  ; OBJ ${p - 8}`;
				colour_gbvm += ".CGB_PAL   " + pals + "\n";
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
	_addComment(`                   Automagic Fade Out`);
	_addComment(`          [GF_EVENT_FADE_STREET_AUTO_FADE_OUT]`);
	_addComment(``);
	_addComment(`    Parameters:`);
	_addComment(`        Mode: ${mode_str}`);
	_addComment(`        Fade to: ${endpoint_str}`);
	_addComment(`        Speed: ${input.speed}`);
	_addComment("");
	if (mode !== "mono") {
		_addComment(`    Background palettes${scene.background.autoColor ? " [auto]" : ""}:`);
		for (let p = 0; p < 8; ++p) {
			if (!using[p]) {
				continue;
			}
			_addComment(`        ${p}: ${end_hex.slice(p * 4, p * 4 + 4)}`);
		}
		_addComment(``);
		_addComment("    Object palettes:");
		for (let p = 8; p < 16; ++p) {
			_addComment(`        ${p-8}: ${end_hex.slice(p * 4, p * 4 + 4)}`);
		}
		_addComment(``);
	}
	const colour_start = getNextLabel();
	const colour_end = getNextLabel();
	if (mode !== "color") {
		if (mode === "mixed") {
			appendRaw("VM_PUSH_CONST 0");
			appendRaw("VM_GET_UINT8            -1, __is_CGB");
			appendRaw(`VM_IF_CONST             .EQ, -1, 1, ${parseInt(colour_start)}\$, 0`);
		}
		appendRaw(dmg_gbvm);
		if (mode === "mixed") {
			appendRaw(`VM_JUMP ${colour_end}$`);
		}
	}
	if (mode !== "mono") {
		if (mode === "mixed") {
			appendRaw(`${colour_start}$:`);
		}
		appendRaw(colour_gbvm);
	}
	if (mode === "mixed") {
		appendRaw(`${colour_end}$:`);
		appendRaw("VM_POP 1");
	}
	_addComment(`~~~ End of Automagic Fade Out block ~~~\n\n`);
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

function components24(rgb) {
	let r = parseInt(rgb[0] + rgb[1], 16) / 255;
	let g = parseInt(rgb[2] + rgb[3], 16) / 255;
	let b = parseInt(rgb[4] + rgb[5], 16) / 255;
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

