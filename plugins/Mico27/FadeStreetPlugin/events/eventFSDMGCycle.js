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

const id = "GF_EVENT_FADE_STREET_DMG_CYCLE";
const groups = ["Fade Street"];
const subGroups = {"Fade Street": "Monochrome Mode"};
const description = "Cycle palette colours in monochrome mode. This includes Super Game Boy mode. Has no effect in colour mode.";
const name = "DMG Palette Cycle";

const autoLabel = (fetchArg) => {
	const base_colours = [
		"start_bgp_0",
		"start_bgp_1",
		"start_bgp_2",
		"start_bgp_3",
		"start_obp0_0",
		"start_obp0_1",
		"start_obp0_3",
		"start_obp1_0",
		"start_obp1_1",
		"start_obp1_3",
	];
	const slots = base_colours.map((x) => fetchArg(x) === "cycle").filter(Boolean).length;
	const frames = fetchArg("step_frames");
	const steps = Math.max(fetchArg("cycle_length"), slots);
	return `DMG Palette Cycle (${frames * steps} frames)`;
} 

const fields = [
	{
		label: "Choose the palette slots for the cycle, and a fixed colour for slots not in the cycle:"
	},
	{
		type: "group",
		fields: [
			{
				label: "BGP:",
				description: "The four-colour background palette. Set a slot to \"cycle\" to have that slot receive a colour from the cycle. Otherwise, the slot will be set to the given colour.",
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
					["cycle",       "cycle"],
				],
			},
			{
				defaultValue: "cycle",
				key: "start_bgp_1",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
					["cycle",       "cycle"],
				],
			},
			{
				defaultValue: "cycle",
				key: "start_bgp_2",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
					["cycle",       "cycle"],
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
					["cycle",       "cycle"],
				],
			},
		],

	},
	{
		type: "group",
		fields: [
			{
				label: "OBP0:",
				description: "The first four-colour sprite palette.",
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
					["cycle",       "cycle"],
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
					["cycle",       "cycle"],
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
					["cycle",       "cycle"],
				],
			},
		],

	},
	{
		type: "group",
		fields: [
			{
				label: "OBP1:",
				description: "The second four-colour sprite palette.",
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
					["cycle",       "cycle"],
				],
			},
			{
				defaultValue: "2",
				key: "start_obp1_1",
				type: "select",
				options: [
					["0",       "white"],
					["1",  "light grey"],
					["2",   "dark grey"],
					["3",       "black"],
					["cycle",       "cycle"],
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
					["cycle",       "cycle"],
				],
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
				label: "Length of cycle step (frames)",
				description: "Frames to wait between each step in the cycle.",
			},
			{
				key: "step_frames",
				type: "number",
				max: 180,
				min: 1,
				defaultValue: 16,
			},
		],
	},
	{
		label: "Choose the list of colours that will cycle through the slots chosen above:",
	},
	{
		type: "group",
		fields: [
			{
				label: "Number of colours in the cycle:",
				description: "The number of colours in the cycle. Can be larger than the number of slots.",
			},
			{
				key: "cycle_length",
				type: "number",
				max: 16,
				min: 2,
				defaultValue: 4,
			},
		],
	},
	{
		type: "group",
		fields: [
			{
				label: "Step 0 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_0",
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
				label: "Step 1 colour:",
				width: "50%",
			},
			{
				defaultValue: "3",
				key: "cycle_colour_1",
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
				key: "cycle_length",
				gt: 2,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 2 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_2",
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
				key: "cycle_length",
				gt: 3,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 3 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_3",
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
				key: "cycle_length",
				gt: 4,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 4 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_4",
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
				key: "cycle_length",
				gt: 5,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 5 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_5",
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
				key: "cycle_length",
				gt: 6,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 6 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_6",
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
				key: "cycle_length",
				gt: "7",
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 7 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_7",
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
				key: "cycle_length",
				gt: 8,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 8 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_8",
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
				key: "cycle_length",
				gt: 9,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 9 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_9",
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
				key: "cycle_length",
				gt: 10,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 10 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_10",
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
				key: "cycle_length",
				gt: 11,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 11 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_11",
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
				key: "cycle_length",
				gt: 12,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 12 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_12",
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
				key: "cycle_length",
				gt: 13,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 13 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_13",
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
				key: "cycle_length",
				gt: 14,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 14 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_14",
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
				key: "cycle_length",
				gt: 15,
			}
		],
		type: "group",
		fields: [
			{
				label: "Step 15 colour:",
				width: "50%",
			},
			{
				defaultValue: "0",
				key: "cycle_colour_15",
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
];

const compile = (input, helpers) => {
	const { palettes, _addComment, appendRaw } = helpers;
	
	function bgp_byte(next_pal) {
		return next_pal[0] | (next_pal[1] << 2) | (next_pal[2] << 4) | (next_pal[3] << 6);
	}

	function obp0_byte(next_pal) {
		return (next_pal[4] << 2) | (next_pal[5] << 4) | (next_pal[6] << 6);
	}

	function obp1_byte(next_pal) {
		return (next_pal[7] << 2) | (next_pal[8] << 4) | (next_pal[9] << 6);
	}

	function bkg_byte_string(b) {
		return (b & 3).toString() + "," + ((b >> 2) & 3).toString() + "," + ((b >> 4) & 3).toString() + "," + ((b >> 6) & 3).toString();
	}
	
	function obj_byte_string(b) {
		return ((b >> 2) & 3).toString() + "," + ((b >> 4) & 3).toString() + "," + ((b >> 6) & 3).toString();
	}


	function get_cycle_colour() {
		c = cycle_colours[cycle_index];
		if (input.reverse) {
			++cycle_index;
			if (cycle_index >= input.cycle_length) {
				cycle_index = 0;
			}
		} else {
			--cycle_index;
			if (cycle_index < 0) {
				cycle_index = input.cycle_length - 1;
			}
		}
		return c;
	}

	const base_colours = [
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

	let num_slots = 0;
	let using_bkg = false;
	let using_obp0 = false;
	let using_obp1 = false;
	let cycle_slots = [];
	for (let c = 0; c < 10; ++c) {
		if (base_colours[c] === "cycle") {
			++num_slots;
			cycle_slots.push(c);
			switch (c) {
				case 0:
				case 1:
				case 2:
				case 3:
					using_bkg = true;
					break;
				case 4:
				case 5:
				case 6:
					using_obp0 = true;
					break;
				case 7:
				case 8:
				case 9:
					using_obp1 = true;
					break;
			}
		}
	}
	let steps = Math.max(num_slots, input.cycle_length);

	const cycle_colours = [
		input.cycle_colour_0,
		input.cycle_colour_1,
		input.cycle_colour_2,
		input.cycle_colour_3,
		input.cycle_colour_4,
		input.cycle_colour_5,
		input.cycle_colour_6,
		input.cycle_colour_7,
		input.cycle_colour_8,
		input.cycle_colour_9,
		input.cycle_colour_10,
		input.cycle_colour_11,
		input.cycle_colour_12,
		input.cycle_colour_13,
		input.cycle_colour_14,
		input.cycle_colour_15,
	];
	let base_pal = base_colours.map((x) => parseInt(x));

	const wait_frames = input.step_frames;

	let gbvm = "";

	let bkg_byte_prev;
	let obp0_byte_prev;
	let obp1_byte_prev;
	let step0 = 1;
	bkg_byte_prev = -1;
	obp0_byte_prev = -1;
	obp1_byte_prev = -1;

	let cycle_index = 0;
	let carried_wait = 0;

	for (let t = 0; t < steps; ++t) {
		cycle_index = t % input.cycle_length;
		let next_pal = base_pal.slice();
		for (let c = 0 ; c < steps; ++c) {
			next_pal[cycle_slots[c]] = get_cycle_colour();

		}
		const bkg_byte_next = bgp_byte(next_pal);
		const obp0_byte_next = obp0_byte(next_pal); 
		const obp1_byte_next = obp1_byte(next_pal);
		const obj_word_next = (obp0_byte_next) | (obp1_byte_next << 8);

		const update_bkg = using_bkg && (bkg_byte_next != bkg_byte_prev);
		const update_obp0 = using_obp0 && (obp0_byte_next != obp0_byte_prev);
		const update_obp1 = using_obp1 && (obp1_byte_next != obp1_byte_prev);
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

		gbvm += `\n; Step ${t}: ${update_str}\n`
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
		gbvm += "VM_PUSH_CONST " + (wait_frames + carried_wait) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
		carried_wait = 0;
	}
	if (carried_wait > 0) {
		gbvm += "VM_PUSH_CONST " + (carried_wait) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
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
	_addComment(`                        DMG Palette Cycle`);
	_addComment(`               [GF_EVENT_FADE_STREET_DMG_CYCLE]`);
	_addComment(``);
	_addComment(`    Parameters:`);
	_addComment(`        Cycle steps: ${input.cycle_length}`);
	_addComment(`        Frames per step: ${wait_frames}`);
	_addComment(`        Affected palette slots: ${num_slots}`);
	_addComment("");
	_addComment(`    Total wait:              ${wait_frames * num_slots} frames`);
	_addComment("");
	appendRaw(gbvm);
	_addComment(`~~~ End of DMG Palette Cycle block ~~~\n\n`);
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

