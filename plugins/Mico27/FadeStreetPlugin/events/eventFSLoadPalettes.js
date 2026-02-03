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

const id = "GF_EVENT_FADE_STREET_LOAD_PALETTES";
const groups = ["Fade Street"];
const subGroups = {"Fade Street": "Colour Mode - Other"};
const description = "Load new palettes. The changes will be visible on the next frame.";
const name = "Quick Load Palettes";

const autoLabel = (fetchArg) => {
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
		const shift_amount = fetchArg("hue_shift");
		endpoint +=  ` shift ${shift_amount}`;
	} else if (endpoint === "desaturated") {
		const amount = fetchArg("desaturate_intensity");
		endpoint =  `${amount}% desaturated`;
	}
	return `Quick Load Palettes (${endpoint})`;
}

const fields = [
	{
		type: "group",
		fields: [
			{
				label: "Special Effect:",
				description: "A colour effect to apply to the palettes that are loaded.",
			},
			{
				defaultValue: "white",
				key: "endpoint",
				type: "select",
				options: [
					["normal",     "none"],
					["desaturated", "desaturated"],
					["hue", "hue shifted"],
					["night", "day for night filter"],
					["saturated", "saturated"],
					["inverted", "inverted"],
					["colourised", "colourised (enter RGB)"],
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
		label: "Background palettes:",
		description: "Background palettes to load.",
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
		label: "Sprite palettes:",
		description: "Sprite palettes to load.",
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

	let input_pals = Array(64);
	let using = Array(16);

	// INPUTS
	let endpoint_str = input.endpoint;
	if (endpoint_str === "colourised") {
		const r = input.target_r;
		const g = input.target_g;
		const b = input.target_b;
		endpoint_str += ` (${r},${g},${b})`;
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


	for (let i = 0 ; i < 64; ++i) { // 4 colours * 16 palettes
		const p = Math.floor(i / 4);
		if (!using[p]) {
		      	continue;
		}
		const [r0, g0, b0] = components(input_pals[i]);
		const [OK_L0, OK_a0, OK_b0] = linear_RGB_to_OKLab(r0, g0, b0);

		let [OK_L1, OK_a1, OK_b1] = [OK_L0, OK_a0, OK_b0];

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
			case "normal":
			default:
				break;
		}
		input_pals[i] = OKLab_to_GB(OK_L1, OK_a1, OK_b1);
	}

	// Generate GBVM output:
	let gbvm = "";


	let bkg_mask = "";
	for (let p = 0; p < 8; ++p) {
		let bit = using[p] ? 1 : 0;
		bkg_mask = bit + bkg_mask;
	}
	bkg_mask = "0b" + bkg_mask;

	let obj_mask = "";
	for (let p = 8; p < 16; ++p) {
		let bit = using[p] ? 1 : 0;
		obj_mask = bit + obj_mask;
	}
	obj_mask = "0b" + obj_mask;

	if (bkg_mask != "0b00000000") { // 1+ bkg palettes to load
		gbvm += "VM_LOAD_PALETTE " + bkg_mask + ", .PALETTE_BKG\n";
		gbvm += ";          GBS White     GBS LightG    GBS DarkG     GBS Black   ; Pal #\n";
		for (let p = 0; p < 8; ++p) {
			if (!using[p]) {
				continue;
			}
			let [r0,g0,b0] = input_pals[p * 4];
			let [r1,g1,b1] = input_pals[p * 4 + 1];
			let [r2,g2,b2] = input_pals[p * 4 + 2];
			let [r3,g3,b3] = input_pals[p * 4 + 3];
			const pals =  String(r0).padStart(2, ' ') + ", " +  String(g0).padStart(2, ' ') + ", " +  String(b0).padStart(2, ' ') + ",   " +  String(r1).padStart(2, ' ') + ", " +  String(g1).padStart(2, ' ') + ", " +  String(b1).padStart(2, ' ') + ",   " +  String(r2).padStart(2, ' ') + ", " +  String(g2).padStart(2, ' ') + ", " +  String(b2).padStart(2, ' ') + ",   " +  String(r3).padStart(2, ' ') + ", " +  String(g3).padStart(2, ' ') + ", " +  String(b3).padStart(2, ' ') + `  ; BKG ${p}`;
			gbvm += ".CGB_PAL   " + pals + "\n";
		}
	}
	if (obj_mask != "0b00000000") { // 1+ obj palettes to load
		gbvm += "VM_LOAD_PALETTE " + obj_mask + ", .PALETTE_SPRITE\n";
		gbvm += ";          GBS Transp.   GBS White     GBS LightG    GBS Black   ; Pal #\n";
		for (let p = 8; p < 16; ++p) {
			if (!using[p]) {
				continue;
			}
			let [r0,g0,b0] = input_pals[p * 4];
			let [r1,g1,b1] = input_pals[p * 4 + 1];
			let [r3,g3,b3] = input_pals[p * 4 + 3];
			const pals = ubh(p) + String(r0).padStart(2, ' ') + ", " +  String(g0).padStart(2, ' ') + ", " +  String(b0).padStart(2, ' ') + ",   " +  String(r1).padStart(2, ' ') + ", " +  String(g1).padStart(2, ' ') + ", " +  String(b1).padStart(2, ' ') + ",   " +  String(r3).padStart(2, ' ') + ", " + String(g3).padStart(2, ' ') + ", " +  String(b3).padStart(2, ' ') + `  ; OBJ ${p - 8}`;
			gbvm += ".CGB_PAL   " + pals + "\n";
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
	_addComment(`                   Quick Load Palettes`);
	_addComment(`          [GF_EVENT_FADE_STREET_LOAD_PALETTES]`);
	_addComment(``);
	_addComment(`    Parameters:`);
	_addComment(`        Effect: ${endpoint_str}`);
	_addComment("");
	appendRaw(gbvm);
	_addComment(`~~~ End of Quick Load Palettes block ~~~\n\n`);
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


