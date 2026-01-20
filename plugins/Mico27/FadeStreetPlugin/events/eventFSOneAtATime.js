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

	GB Studio events to create perceptually correct-ish colour transitions,
	and other effects.
	
	One at a Time Fade accepts a list of colour slots and fade those slots
	in one at a time, in the order given.

*/

const id = "GF_EVENT_FADE_STREET_ONE_AT_A_TIME";
const groups = ["Fade Street"];
const subGroups = {"Fade Street": "Colour Mode - Fade Only"};
const description = "Enter a list of colour slots, and colours will fade one at a time, in the order given.";
const name = "Fade One Colour At A Time";

const autoLabel = (fetchArg) => {
	const fade_groups = (input.slot_text || "").replace(/,+$/, "").split(',').length; 
	const steps = fetchArg("steps");
	const wait_frames = fetchArg("frames");
	const group_wait_frames = fetchArg("group_wait");
	const frames = wait_frames * (steps - 1) * fade_groups + (fade_groups - 1) * group_wait_frames;
	return `Fade One Colour at a Time (${frames} frames)`;
} 

const fields = [
	{
		type: "group",
		fields: [
			{
				label: "Steps per slot:",
				description: "Number of steps in the gradient, including both end points.",
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
		type: "group",
		fields: [
			{
				label: "Frames to wait between slots:",
				description: "After a slot has finished fading, wait this many frames before fading the next slot.",
				width: "50%",
			},
			{
				key: "group_wait",
				type: "number",
				max: 600,
				min: 0,
				defaultValue: 0,
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
		type: "textarea",
		key:  "slot_text",
		label: "Order of slots to fade:",
		description: "Enter a comma separated list of integers indicating which palette colours should be faded, and it what order. If a groups of slots should fade together, separate the numbers with a pipe symbol \"|\". \nBackground slots are numbered 0-31, starting at the first colour of palette 1, and ending at the last colour of palette 8. Palette #1 comprises colours 0, 1, 2, and 3, palette #2 comprises colours 4, 5, 6, and 7, etc.\nSprite slots are number 32-63, starting at the first colour of palette 1, and ending at the last colour of palette 8. There are FOUR slots per sprite palette, and the first slot is invisible/unused. Sprite palette #1 comprises colours 32, 33, 34, and 35, with colour 32 is invisible. 33, 34, and 35 are the three visible colours in palette #1, corresponding to white, light grey, and black, respectively, in GB Studio.\nEach slot may appear no more that one time in the list.",
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


	const pal_start = [
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

	const pal_end = [
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

	let gradients = Array(64);
	let input_pals = Array(64);
	let output_pals = Array(64);

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

	// INPUTS
	
	let need_pals = Array(16).fill(false);
	// Parse cycle slots from user input:
	let fade_groups = (input.slot_text || "").replace(/,+$/, "").split(','); // split on "," first
	for (let i = 0; i < fade_groups.length; ++i) {
		fade_groups[i] = fade_groups[i].split('|').map((x) => parseInt(x)); // parse integers
	}
	let fade_slots = fade_groups.flat();
	// verify we got numbers in the correct range:
	for (let i = 0; i < fade_slots.length; ++i) {
		if (!Number.isInteger(fade_slots[i]) || fade_slots[i] < 0 || fade_slots[i] > 64) {
			throw new Error(`Palette slots must be entered as a comma-separated list of integers in the range [0,63]. Found ${fade_slots[i]}.`);
		}
		const p = Math.floor(fade_slots[i] / 4);
		need_pals[p] = true;
	}
	// verify that the slot numbers are unique:
	let uniques = new Set(fade_slots);
	if (uniques.size < fade_slots.length) {
			throw new Error("Palette slots must only appear once in the list.");
	}

	// renumber palette slots to fit the GB Studio ordering for sprite palettes:
	for (let i = 0; i < fade_slots.length; ++i) {
		if (fade_slots[i] > 31) { // sprite slot
			switch( fade_slots[i] % 4) {
				case 0: 
					fade_slots[i] += 2;
					break;
				case 1:  
					fade_slots[i] -= 1; 
					break;
				case 2:
					fade_slots[i] -= 1;
					break;
				case 3:
					// black == black
					break;
			}
		}
	}
	const steps = input.steps;
	const wait_frames = input.frames;
	const leg_frames = (steps - 1) * wait_frames;
	const group_wait_frames = input.group_wait;

	// Get start and end palettes:
	for (let p_index = 0; p_index < 16; ++p_index) {
		if (pal_start[p_index] === "keep" || pal_end[p_index] === "keep") {
			if (need_pals[p_index]) {
				const out_index = p_index > 7 ? `sprite palette ${p_index - 7}` : `background palette ${p_index + 1}`;
				throw new Error(`You must enter start and end palettes for ${out_index}`);
			}
		}
		const in_pal  = palettes.find((p) => p.id === pal_start[p_index]);
		const out_pal = palettes.find((p) => p.id === pal_end[p_index]);
		for (let c_index = 0; c_index < 4; ++c_index) {
			const linear_index = p_index * 4 + c_index;
			input_pals[linear_index]   =  in_pal && in_pal.colors ? in_pal.colors[c_index] : dmg_pal[c_index];
			output_pals[linear_index]  =  out_pal && out_pal.colors ? out_pal.colors[c_index] : dmg_pal[c_index];
		}
	}

	// Create gradients:
	const steps_arr = [...Array(steps).keys()];

	for (let i = 0 ; i < 64; ++i) { // 4 colours * 16 palettes
		const [r0, g0, b0] = components(input_pals[i]);
		const [OK_L0, OK_a0, OK_b0] = sRGB_to_OKLab(r0, g0, b0);

		const [r1, g1, b1] = components(output_pals[i]);
		const [OK_L1, OK_a1, OK_b1] = sRGB_to_OKLab(r1, g1, b1);

		const OK_L_gradient = steps_arr.map((x) => OK_L0 + ((OK_L1 - OK_L0) / (steps - 1)) * x);
		const OK_a_gradient = steps_arr.map((x) => OK_a0 + ((OK_a1 - OK_a0) / (steps - 1)) * x);
		const OK_b_gradient = steps_arr.map((x) => OK_b0 + ((OK_b1 - OK_b0) / (steps - 1)) * x);
		gradients[i] = steps_arr.map((x) => OKLab_to_GB(OK_L_gradient[x], OK_a_gradient[x], OK_b_gradient[x]));
	}

	// Generate GBVM output:
	let gbvm = "";
	let next_palette = Array(64);
	for (let c = 0; c < 64; ++c) {
		next_palette[c] = gradients[c][0];
	}
	let saved_palette = next_palette;

	for (let group_n = 0; group_n < fade_groups.length; ++group_n) { // slots
		let carried_wait = 0; // carry-over frames if we want to skip an step entirely
		let current_gradient_step = 0;
		let last_t = 0;
		gbvm += `\n\n; NOW FADING SLOTS: (${fade_groups[group_n]})\n`
		for (let t = 0; t < leg_frames; ++t) { // time 
			const fade_frame = (t % wait_frames) == 0;
			if (!fade_frame) {
				// no update on this frame
				continue;
			}
			// advance through fade and cycle:
			if (fade_frame) {
				++current_gradient_step;
			}
			next_palette = saved_palette;
			for (let c = 0; c < fade_groups[group_n].length; ++c) {
				const colour = fade_groups[group_n][c];
				next_palette[colour] = gradients[colour][current_gradient_step];
			}
			saved_palette = next_palette;
			next_palette = next_palette.flat();

			// check if this palette is identical to the previous - if so, skip it
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
				bit = need_pals[p] ? bit : 0;
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
				bit = need_pals[p] ? bit : 0;
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
			if (fade_frame) {
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
		let group_wait = group_n < fade_groups.length - 1 ? group_wait_frames : 0;
		gbvm += "VM_PUSH_CONST " + (leg_frames - last_t + group_wait) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n\n";
	}

	let slots_str = "";

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
	_addComment(`                    Fade One Colour at a Time`);
	_addComment(`               [GF_EVENT_FADE_STREET_ONE_AT_A_TIME]`);
	_addComment(`     `);
	_addComment(`    Parameters:`);
	_addComment(`        Steps per slot: ${steps}`);
	_addComment(`        Frames per step: ${wait_frames}`);
	_addComment(`        Slots: `);
	for (let g = 0; g < fade_groups.length; ++g) { // loop over group
		if (fade_groups[g].length == 1) {
			_addComment(`        ${String(fade_groups[g][0]).padStart(2, ' ')} : ${input_pals[fade_groups[g][0]]} -> ${output_pals[fade_groups[g][0]]}`);
		} else if (fade_groups[g].length == 2) {
			_addComment(`       [${String(fade_groups[g][0]).padStart(2, ' ')} : ${input_pals[fade_groups[g][0]]} -> ${output_pals[fade_groups[g][0]]}`);
			_addComment(`        ${String(fade_groups[g][1]).padStart(2, ' ')}]: ${input_pals[fade_groups[g][1]]} -> ${output_pals[fade_groups[g][1]]}`);
		} else {
			_addComment(`       [${String(fade_groups[g][0]).padStart(2, ' ')} : ${input_pals[fade_groups[g][0]]} -> ${output_pals[fade_groups[g][0]]}`);
			for (let s = 1; s < fade_groups[g].length - 1; ++s) { // loop over slots in group
				_addComment(`        ${String(fade_groups[g][s]).padStart(2, ' ')} : ${input_pals[fade_groups[g][s]]} -> ${output_pals[fade_groups[g][s]]}`);
			}
			_addComment(`        ${String(fade_groups[g])[fade_groups[g].length - 1].padStart(2, ' ')}]: ${input_pals[fade_groups[g][fade_groups[g].length - 1]]} -> ${output_pals[fade_groups[g][fade_groups[g].length - 1]]}`);
		}
	}
	_addComment(``);
	appendRaw(gbvm);
	_addComment(`~~~ End of Fade One Colour at a Time block ~~~\n\n`);
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

