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

const id = "GF_EVENT_FADE_STREET_VOLUME";
const groups = ["Fade Street"];
const description = "Fade the master volume. Affects all channels of music and sfx. Volume commands in music and sfx may override values you set with this event.";
const subGroups = {"Fade Street": "Audio"};
const name = "Volume Fade";

const autoLabel = (fetchArg) => {
	const startpoint = "";
	const endpoint = "";
	let title = `Volume Fade from ${startpoint} to ${endpoint}`;
	const frames = fetchArg("total_frames");
		title += ` (${frames} frames)`;
	return title;
} 

const fields = [
	{
		type: "group",
		fields: [
			{
				label: "From:",
				description: "Master volume at beginning of fade.",
				width: "50%",
			},
			{
				label: "L",
				description: "Left channel volume.",
				width: "50%",
			},
			{
				defaultValue: 1,
				key: "start_l",
				type: "number",
				max: 8,
				min: 1,
			},
			{
				label: "R",
				description: "Right channel volume.",
				width: "50%",
			},
			{
				defaultValue: 1,
				key: "start_r",
				type: "number",
				max: 8,
				min: 1,
			},
		],
	},
	{
		type: "group",
		fields: [
			{
				label: "To:",
				description: "Master volume at end of fade.",
				width: "50%",
			},
			{
				label: "L",
				description: "Left channel volume.",
				width: "50%",
			},
			{
				defaultValue: 8,
				key: "end_l",
				type: "number",
				max: 8,
				min: 1,
			},
			{
				label: "R",
				description: "Right channel volume.",
				width: "50%",
			},
			{
				defaultValue: 8,
				key: "end_r",
				type: "number",
				max: 8,
				min: 1,
			},
		],
	},
	{
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
				max: 600,
				min: 0,
				defaultValue: 60,
			},
		],
	},

];

const compile = (input, helpers) => {
	const {_addComment, appendRaw } = helpers;

	function volume_byte(t) {
		const l = Math.round(l_gradient[t])
		const r = Math.round(r_gradient[t])
		return "0x" + (l * 16 + r ).toString(16);
	}

	const total_frames = input.total_frames;
	const steps = total_frames + 1;
	const steps_arr = [...Array(steps).keys()];
	let volume_gradient;
	const start_l = input.start_l - 1;
	const start_r = input.start_r - 1;
	const end_l = input.end_l - 1;
	const end_r = input.end_r - 1;
	l_gradient = steps_arr.map((x) => start_l + ((end_l - start_l) / (steps - 1)) * x);
	r_gradient = steps_arr.map((x) => start_r + ((end_r - start_r) / (steps - 1)) * x);

	let volume_byte_prev = "0x77";
	let t_prev = -1;

	let gbvm = "";
	for (let t = 1; t < steps; ++t) {
		const volume_byte_next = volume_byte(t);
		if (volume_byte_next != volume_byte_prev) {
			volume_byte_prev = volume_byte_next;
			gbvm += "VM_PUSH_CONST " + (t - t_prev) +  "\nVM_INVOKE b_wait_frames, _wait_frames, 1, .ARG0\n\n";
			gbvm += `; Frame ${t}:\n`;
			t_prev = t;
			gbvm += `VM_SET_CONST_UINT8 _NR50_REG ${volume_byte_next}\n`;
		}
	}
	if (t_prev < total_frames - 1) {
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
	_addComment(`                        Volume Fade`);
	_addComment(`               [GF_EVENT_FADE_STREET_VOLUME]`);
	_addComment(``);
	_addComment(`    Parameters:`);
	_addComment(`        Start: L${input.start_l}, R${input.start_r}`);
	_addComment(`        End: L${input.end_l}, R${input.end_r}`);
	_addComment(`        Total frames: ${input.total_frames}`);
	_addComment("");
	appendRaw(gbvm);
	_addComment(`~~~ End of Volume Fade block ~~~\n\n`);
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

