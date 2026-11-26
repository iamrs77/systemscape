/** Each system's own colour: on its card, its poster and in the top bar. */
const SYSTEM_COLOR: Record<string, string> = {
	basics: '#7c3aed',
	'ride-hailing': '#ea580c',
	'video-streaming': '#db2777',
	'upi-payments': '#059669',
	stockroom: '#4f46e5',
};

/** For a system added later without a colour of its own. */
const SPARE = ['#0284c7', '#0d9488', '#c026d3'];

export function systemColor(id: string, index = 0) {
	return SYSTEM_COLOR[id] ?? SPARE[index % SPARE.length]!;
}

/** One colour per track of the fundamentals, in order, so the path runs through them. */
const TRACK_COLORS = [
	'#4f46e5',
	'#7c3aed',
	'#c026d3',
	'#db2777',
	'#e11d48',
	'#ea580c',
	'#b45309',
	'#4d7c0f',
	'#059669',
	'#0d9488',
	'#0284c7',
];

export const trackColor = (i: number) => TRACK_COLORS[i % TRACK_COLORS.length]!;

/** The one colour every lesson page wears: Stockroom's indigo. */
export const LESSON_COLOR = SYSTEM_COLOR.stockroom!;
