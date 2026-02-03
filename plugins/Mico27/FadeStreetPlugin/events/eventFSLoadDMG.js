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

const id = "GF_EVENT_FADE_STREET_LOAD_DMG";
const groups = ["Fade Street"];
const description = "Fade between palettes in monochrome mode. This includes Super Game Boy mode. Has no effect in colour mode. Has the option to flicker colours for a smoother fade on some screens.";
const subGroups = {"Fade Street": "Monochrome Mode"};
const name = "Quick Load DMG Palettes";

const autoLabel = (fetchArg) => {
	let endpoint = fetchArg("endpoint");
	switch (endpoint) {
		case "default":
			endpoint = "default";
			break;
		case "custom":
			endpoint = "custom";
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
	let title = `Quick Load ${endpoint} DMG palettes (0 frames)`;
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
				label: "Load:",
				description: "The palettes to load",
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
				label: "BGP:",
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
				label: "OBP0:",
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
				label: "OBP1:",
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
		return (endpoint[0]) | (endpoint[1] << 2) | (endpoint[2] << 4) | (endpoint[3] << 6);
	}

	function obp0_byte(t) {
		return (endpoint[4] << 2) | (endpoint[5] << 4) | (endpoint[6] << 6);
	}

	function obp1_byte(t) {
		return (endpoint[7] << 2) | (endpoint[8] << 4) | (endpoint[9] << 6);
	}


	const default_dmg = [0, 1, 2, 3, 0, 1, 3, 0, 2, 3];
	const inverted =    [3, 2, 1, 0, 3, 2, 0, 3, 1, 0];
	const white =       [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	const black =       [3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
	const light_grey =  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
	const dark_grey =   [2, 2, 2, 2, 2, 2, 2, 2, 2, 2];

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

	let gbvm = "";

	const bkg_byte_next = bgp_byte();
	const obp0_byte_next = obp0_byte(); 
	const obp1_byte_next = obp1_byte();
	const obj_word_next = (obp0_byte_next) | (obp1_byte_next << 8);

	const update_bkg = input.use_bgp;
	const update_obp0 = input.use_obp0;
	const update_obp1 = input.use_obp1;
	const update_obj_word = update_obp0 && update_obp1; 

	const update_this_frame = (update_bkg || update_obp0 || update_obp1);

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
	_addComment(`                   Quick Load DMG Palettes`);
	_addComment(`               [GF_EVENT_FADE_STREET_LOAD_DMG]`);
	_addComment(``);
	_addComment(`    Parameters:`);
	let end_string = "";
	if (input.use_bgp) {
		end_string += `BGP=(${bkg_byte_string(bgp_byte())}) `;
	}
	if (input.use_obp0) {
		end_string += `OBP0=(${obj_byte_string(obp0_byte())}) `;
	}
	if (input.use_obp1) {
		end_string += `OBP1=(${obj_byte_string(obp1_byte())})`;
	}
	_addComment(`        Load: "${input.endpoint}" ${end_string}`);
	_addComment("");
	appendRaw(gbvm);
	_addComment(`~~~ End of Load DMG Palettes block ~~~\n\n`);
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

