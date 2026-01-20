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
	
	Single Colour Fade calculates a colour gradient between the start and
	and end colour by using linear interpolation in OKLab colour space.

	Only one palette colour is updated by the event, meaning the other 
	three colours in the same palette are unaffected. This means two 
	copies of the event running in different threads can update two
	different colours in the same palette without clashing.
*/

const id = "GF_EVENT_FADE_STREET_SINGLE";
const groups = ["Fade Street"];
const subGroups = {"Fade Street": "Colour Mode - Fade Only"};
const name = "Single Colour Fade";

const autoLabel = (fetchArg) => {
	let steps = (fetchArg("steps") - 1);
	const wait_frames = fetchArg("frames");

	const pal_type = fetchArg("pal_type");
	const pal = parseInt(fetchArg("pal_index")) + 1;
	let col;
	if (pal_type ==="background") {
		col = fetchArg("bkg_colour_index");
	} else {
		col = fetchArg("obj_colour_index");
	}
	col = parseInt(col) + 1;

	const skip_step0 = fetchArg("force_initial") === "false";
	const no_wait = fetchArg("no_initial_wait") === "true";
	if (skip_step0 && no_wait) {
		steps -= 1;
	}
	const frames = wait_frames * steps;
	return `Single Colour Fade - ${pal_type} palette ${pal} colour ${col} (${frames} frames)`;
}

const fields = [
	{
		type: "group",
		fields: [
			{
				label: "Palette slot:",
				description: "The palette entry which is to be changed.",
				width: "50%",
			},
			{
				key: "pal_type",
				type: "select",
				defaultValue: "background",
				options: [
					["background", "background"],
					["sprite", "sprite"],
				],
			},
			{
				key: "pal_index",
				type: "select",
				defaultValue: "0",
				options: [
					["0", "palette 1"],
					["1", "palette 2"],
					["2", "palette 3"],
					["3", "palette 4"],
					["4", "palette 5"],
					["5", "palette 6"],
					["6", "palette 7"],
					["7", "palette 8"],
				],
			},
			{
				conditions: [
					{
						key: "pal_type",
						eq: "background",
					}
				],
				key: "bkg_colour_index",
				type: "select",
				defaultValue: "0",
				options: [
					["0", "colour 0"],
					["1", "colour 1"],
					["2", "colour 2"],
					["3", "colour 3"],
				],
			},
			{
				conditions: [
					{
						key: "pal_type",
						eq: "sprite",
					}
				],
				key: "obj_colour_index",
				type: "select",
				defaultValue: "0",
				options: [
					["0", "colour 0"],
					["1", "colour 1"],
					["3", "colour 3"],
				],
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
		label: "Start colour:",
		description: "Colour RGB value at the start of the fade.",
	},
	{
		type: "group",
		fields: [
			{
				label: "R: ",
				width: "50%",
			},
			{
				key: "start_r",
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
				label: "G: ",
				width: "50%",
			},
			{
				key: "start_g",
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
				label: "B: ",
				width: "50%",
			},
			{
				key: "start_b",
				type: "slider",
				min: 0,
				max: 31,
				defaultValue: 0,
			},
		],
	},
	{
		label: "End colour:",
		description: "Colour RGB value at the end of the fade.",
	},
	{
		type: "group",
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
		key: "force_initial",
		label: "[Advanced] Force palette update on step 0 of gradient.",
		description: "By default, the starting colour of the gradient are assumed to match the currently loaded colour. For that reason, the plugin skips loading the 0th step in the gradient. Check this box to force loading the 0th step.",
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

	function colour_equal(step1) {
		if (step1 == 0) {
			return false;
		}
		let rgb0 = rgb_gradient[step1];
		let rgb1 = rgb_gradient[step1 - 1];
		if (rgb0 == rgb1) {
			return true;
		}
		return false;
	}

	// INPUTS
	const steps = input.steps;
	const wait_frames = input.frames;
	const force_step0 = input.force_initial;
	const no_wait = input.no_initial_wait;
	const r0 = input.start_r / 31;
	const g0 = input.start_g / 31;
	const b0 = input.start_b / 31;
	const r1 = input.target_r / 31;
	const g1 = input.target_g / 31;
	const b1 = input.target_b / 31;
	const pal_type = input.pal_type;
	const pal_index = input.pal_index;
	let colour_index;
	if (pal_type === "sprite") {
		colour_index = input.obj_colour_index;
		switch (colour_index) {
			case "0":
				colour_index = 1;
				break;
			case "1":
				colour_index = 2;
				break;
			default:
				colour_index = 0;
				break;
			case "3":
				colour_index = 3;
				break;
		}
	} else {
		colour_index = input.bkg_colour_index;
	}


	// Create gradients:
	const steps_arr = [...Array(steps).keys()];

	const [OK_L0, OK_a0, OK_b0] = sRGB_to_OKLab(r0, g0, b0);
	const [OK_L1, OK_a1, OK_b1] = sRGB_to_OKLab(r1, g1, b1);

	const OK_L_gradient = steps_arr.map((x) => OK_L0 + ((OK_L1 - OK_L0) / (steps - 1)) * x);
	const OK_a_gradient = steps_arr.map((x) => OK_a0 + ((OK_a1 - OK_a0) / (steps - 1)) * x);
	const OK_b_gradient = steps_arr.map((x) => OK_b0 + ((OK_b1 - OK_b0) / (steps - 1)) * x);
	const rgb_gradient = steps_arr.map((x) => OKLab_to_GB(OK_L_gradient[x], OK_a_gradient[x], OK_b_gradient[x]));

	// Generate GBVM output:
	let gbvm = "";

	const step0 = force_step0 ? 0 : 1;

	if (step0 == 1) {
		gbvm += `\n;     Step 0: do nothing.\n`;
	}

	let carried_wait = 0; // carry-over frames if we want to skip an step entirely

	for (let j = step0; j < steps; ++j) { // time 
		// If no palettes are updated at this step, we want to skip to
		// the next step, but carry over the wait frames so the timing
		// remains the same.
		const skip = colour_equal(j);
		if (skip) {
			if (j < steps - 1) {
				gbvm += `\n;     Step ${j}: do nothing.\n`;
				carried_wait += wait_frames;
				continue;
			} else {
				if (j == 1 && step0 == 1 && no_wait) {
					gbvm += `\n;     Step ${j}: do nothing.\n`;
					continue;
				} else { 
					gbvm += `\n;     Step ${j}: wait ${wait_frames + carried_wait} frames.\n`;
					// write any remaining wait frames left:
					gbvm += "VM_PUSH_CONST " + (wait_frames + carried_wait) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
				}
				break;
			}
		}

		if (j == 0 ||
			(j == 1 && step0 == 1 && no_wait)) {
			// Don't wait before step0, 
			// or before step1, if the "Don't wait before loading step 1..." option is checked.
			gbvm += `\n;     Step ${j}: load colour.\n`;
		} else {
			gbvm += `\n;     Step ${j}: wait ${wait_frames + carried_wait} frames, then load colour.\n`;
			// add a wait
			gbvm += "VM_PUSH_CONST " + (wait_frames + carried_wait) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n";
			carried_wait = 0;
		}
		if (pal_type === "sprite") {
			gbvm += `VM_PUSH_CONST 0x${rgb_gradient[j]}\nVM_PUSH_CONST ${colour_index}\nVM_PUSH_CONST ${pal_index}\nVM_CALL_NATIVE b_set_single_sprite_colour _set_single_sprite_colour\nVM_POP 3\n`;
		} else {
			gbvm += `VM_PUSH_CONST 0x${rgb_gradient[j]}\nVM_PUSH_CONST ${colour_index}\nVM_PUSH_CONST ${pal_index}\nVM_CALL_NATIVE b_set_single_bkg_colour _set_single_bkg_colour\nVM_POP 3\n`;
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
	_addComment(`                    Single Colour Fade`);
	_addComment(`               [GF_EVENT_FADE_STREET_SINGLE]`);
	_addComment(`     `);
	_addComment(`    Parameters:`);
	_addComment(`        Slot: ${input.pal_type} palette ${input.pal_index}, colour ${input.pal_type==="sprite" ? input.obj_colour_index : input.bkg_colour_index}`);
	_addComment(`        Start colour: RGB(${input.start_r}, ${input.start_g}, ${input.start_b})`);
	_addComment(`        End colour:   RGB(${input.target_r}, ${input.target_g}, ${input.target_b})`);
	_addComment(`        Steps: ${steps}`);
	_addComment(`        Frames per step: ${wait_frames}`);
	_addComment(`        Force step 0: ${force_step0}`);
	_addComment(`        Don't wait before step 1: ${no_wait}`);
	_addComment("");
	appendRaw(gbvm);
	_addComment(`~~~ End of Single Colour Fade block ~~~\n\n`);
};

module.exports = {
	id,
	autoLabel,
	name,
	groups,
	subGroups,
	fields,
	compile,
	waitUntilAfterInitFade: true,
};

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


	let rgb15 = r | (g << 5) | (b << 10);

	return rgb15.toString(16);
}

