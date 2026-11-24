import type { EdgeLook } from '@/diagram/Diagram';
import { edgeKey } from '@/diagram/layout';
import {
	layers,
	type Component,
	type Hop,
	type Journey,
	type Layer,
	type System,
} from '@/model/schema';
import { simulate, type JourneyState, type SimInput, type SimResult } from '@/sim/engine';
import { fixesFor } from '@/sim/fixes';
import { feelOfMs, feelOfShare, formatMs, formatRps, formatShare, perMinute } from '@/sim/format';
import { explain, SLOW_MS } from '@/sim/insights';
import { scenarioInput } from '@/sim/scenario';

/**
 * Lessons, made from a system's data, so every system gets them without
 * writing any: first the big picture, a row of the diagram at a time; then
 * one lesson per journey, a step per call, ending with what happens under
 * load (or with a part broken) and a chance to try it yourself. Pure.
 */

export type Tone = 'plain' | 'wait' | 'background' | 'warn';

export type LessonStep = {
	title: string;
	/** Paragraphs. **Bold** marks the names of parts. */
	body: string[];
	/** Small labelled numbers over the diagram. */
	facts: { label: string; value: string; /** The number in everyday terms. */ hint?: string }[];
	/** Short notes about this step: who waits, whether it's optional... */
	tags: { text: string; tone: Tone }[];
	goodToKnow?: { title: string; text: string };
	whenItFails?: string;
	/** The parts at full strength; null for all of them. */
	focus: string[] | null;
	/** The connections drawn, and how. */
	edges: [string, EdgeLook][];
	/** Whose requests the connections carry. */
	journeyId: string | null;
	/** The scenario the diagram runs, when it isn't an ordinary day. */
	presetId?: string;
	/** Show how many copies of each part are running, as badges. */
	showCopies?: boolean;
	/** Show each step's time, for the journey this lesson follows. */
	timeline?: boolean;
	/** What one real request sends at this step, and what comes back. */
	example?: { says: string; data: [string, string][] };
	/** The part this step is about, to read more on. */
	about?: string;
	/** Where to go from the last step. */
	/** Opens Explore freely, set to an evening and following a journey. */
	action?: { kind: 'explore'; label: string; presetId?: string; journeyId?: string };
};

export type Lesson = {
	/** "overview", or the id of the journey it follows. */
	id: string;
	title: string;
	summary: string;
	steps: LessonStep[];
};

export const OVERVIEW = 'overview';

const tierIntro: Record<Layer, { title: string; text: string }> = {
	clients: {
		title: 'The apps',
		text: 'Everything starts on someone’s phone. The apps keep very little on the phone. They ask the backend for everything they show.',
	},
	balancing: {
		title: 'Sharing out the work',
		text: 'Every request from the apps comes here first. The parts behind it run as several copies. This part picks which copy gets each request. It picks the least busy one, and skips any copy that has stopped working.',
	},
	edge: {
		title: 'The front door',
		text: 'Requests from the apps come in through here. It checks who is asking, and turns away anyone who sends too many requests.',
	},
	services: {
		title: 'The services',
		text: 'These parts do the real work, and each one has one job. Because they are separate, each can run as many copies as it needs. If one breaks, the others keep going. And each one can be changed without touching the rest.',
	},
	async: {
		title: 'Background work',
		text: 'This is work that nobody waits for. It is handed over to happen a moment later. So if something here is slow or broken, the app stays fast.',
	},
	data: {
		title: 'The data',
		text: 'This is where things are stored. Data is harder to grow than code, because you can’t just start another copy. So the data is split into pieces called shards, each kept on its own machine. Some of it is also kept in memory, in a cache, to answer faster.',
	},
	external: {
		title: 'Outside providers',
		text: 'These are systems run by other companies, like a payment provider. They aren’t ours, so we can’t add copies or fix them. We can only cope when they are slow or down.',
	},
};

/** The scenario every lesson starts from: an ordinary day. */
function ordinary(system: System): SimInput {
	return scenarioInput(system.presets[0]!);
}

export function lessonsFor(system: System): Lesson[] {
	const result = simulate(system, ordinary(system));
	return [overview(system), ...system.journeys.map((j) => journeyLesson(system, j, result))];
}

const made = new WeakMap<System, Lesson[]>();

/** A system's lessons, made once. */
export function lessonsOf(system: System): Lesson[] {
	let lessons = made.get(system);
	if (!lessons) {
		lessons = lessonsFor(system);
		made.set(system, lessons);
	}
	return lessons;
}

const results = new WeakMap<System, Map<string, SimResult>>();

/** What a lesson step's diagram shows: an ordinary day, or the step's scenario. Worked out once. */
export function stepResult(system: System, presetId: string | undefined): SimResult {
	let bySystem = results.get(system);
	if (!bySystem) {
		bySystem = new Map();
		results.set(system, bySystem);
	}
	const key = presetId ?? '';
	let result = bySystem.get(key);
	if (!result) {
		result = simulate(system, stepInput(system, presetId));
		bySystem.set(key, result);
	}
	return result;
}

/** The conditions a lesson step's diagram runs: an ordinary day, or the step's scenario. */
export function stepInput(system: System, presetId: string | undefined): SimInput {
	const preset = system.presets.find((p) => p.id === presetId);
	return preset ? scenarioInput(preset) : ordinary(system);
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * The journey to show first: the one with the most calls, from the system's
 * first app (the riders', the viewers'), rather than a back-office tool's.
 */
export function mainJourney(system: System) {
	const app = system.components.find((c) => c.kind === 'client')?.id;
	const fromApp = system.journeys.filter((j) => j.hops[0]!.from === app);
	return [...(fromApp.length ? fromApp : system.journeys)].sort(
		(a, b) => b.hops.length - a.hops.length,
	)[0]!;
}

function overview(system: System): Lesson {
	const used = layers.filter((layer) => system.components.some((c) => c.layer === layer));
	// the example of calls and requests: the journey with the most calls
	const example = mainJourney(system);
	const copies = system.components.find(
		(c) => (c.kind === 'service' || c.kind === 'gateway') && c.instances > 1,
	);

	return {
		id: OVERVIEW,
		title: 'The big picture',
		summary: `The parts of the ${system.name.toLowerCase()}, one row at a time.`,
		steps: [
			{
				title: 'What it does',
				body: [
					system.description[0]!,
					'The diagram shows its backend. Each block is one part. Parts that do similar jobs sit in the same row. Requests start in the apps at the top and move down.',
				],
				facts: [
					{ label: 'Parts', value: String(system.components.length) },
					{ label: 'Rows', value: String(used.length) },
					{
						label: 'Journeys',
						value: String(system.journeys.length),
						hint: 'things people do in the app',
					},
				],
				tags: [],
				focus: null,
				edges: [],
				journeyId: null,
			},
			{
				title: 'How to read it',
				body: [
					copies
						? `Each block is one part. Its icon shows what kind of part it is, and a stack of discs is a database. A badge like ×${copies.instances} beside **${copies.name}** means ${copies.instances} copies of it are running. When it gets busy, more copies share the work.`
						: 'Each block is one part. Its icon shows what kind of part it is, and a stack of discs is a database. A badge like ×3 means three copies of it are running. When it gets busy, more copies share the work.',
					`An arrow means one part calls another. The dots moving along the arrows are requests. Here, they are requests for “${example.name}”. A dashed arrow is background work that nobody waits for.`,
				],
				facts: [],
				tags: [
					{ text: 'Orange dot: a request', tone: 'wait' },
					{ text: 'Purple dot: background work', tone: 'background' },
					{ text: 'Red dot: a failed request', tone: 'warn' },
				],
				focus: null,
				edges: example.hops.map((h): [string, EdgeLook] => [edgeKey(h.from, h.to), 'flow']),
				journeyId: example.id,
				showCopies: true,
			},
			...used.map((layer): LessonStep => {
				const parts = system.components.filter((c) => c.layer === layer);
				const before = used.slice(0, used.indexOf(layer));
				return {
					title: tierIntro[layer].title,
					body: [
						system.rows[layer] ?? tierIntro[layer].text,
						...parts.map((c) => `**${c.name}**: ${lowerFirst(c.summary)}`),
					],
					facts: [{ label: 'In this row', value: plural(parts.length, 'part') }],
					tags: [],
					focus: system.components
						.filter((c) => c.layer === layer || before.includes(c.layer))
						.map((c) => c.id),
					edges: [],
					journeyId: null,
					about: parts.length === 1 ? parts[0]!.id : undefined,
				};
			}),
			{
				title: 'Next: follow a request',
				body: [
					'Those are the parts. But a design works because of how the parts talk to each other. Who calls whom? Who has to wait? And what happens when a part can’t answer?',
					`Next, follow what happens when someone uses the app, one call at a time. We start with “${system.journeys[0]!.name}”.`,
				],
				facts: [],
				tags: [],
				focus: null,
				edges: [],
				journeyId: null,
			},
		],
	};
}

/** “Finds drivers” to “finds drivers”, but “ETA …” stays as it is. */
const lowerFirst = (text: string) =>
	/^[A-Z]{2}/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1);

/** Who waits: the person the lesson follows ("Rohit"), or "the rider", from "Rider app". */
function whoWaits(system: System, journey: Journey) {
	if (journey.person) return journey.person;
	const app = system.components.find((c) => c.id === journey.hops[0]!.from);
	const person = app?.kind === 'client' ? app.name.replace(/\s*app$/i, '').trim() : '';
	return person ? `the ${person.toLowerCase()}` : 'the user';
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function journeyLesson(system: System, journey: Journey, result: SimResult): Lesson {
	const part = (id: string) => system.components.find((c) => c.id === id)!;
	const state = result.journeys[journey.id]!;
	const who = whoWaits(system, journey);
	const involved = [...new Set(journey.hops.flatMap((h) => [h.from, h.to]))];
	const keys = journey.hops.map((h) => edgeKey(h.from, h.to));
	const met = new Set<string>([journey.hops[0]!.from]);

	const hopSteps = journey.hops.map((hop, i): LessonStep => {
		const from = part(hop.from);
		const to = part(hop.to);
		const firstMeeting = !met.has(to.id);
		met.add(from.id);
		met.add(to.id);
		const hopState = state.hops[i]!;
		return {
			title: hop.label,
			body: [callSentence(hop, from, to), to.summary],
			example: hop.example && {
				says: hop.example.says,
				data: Object.entries(hop.example.data),
			},
			facts: hopFacts(
				hop,
				to,
				hopState.sent,
				hopState.waitMs,
				result,
				state.rps > 0 ? hopState.sent / (state.rps * hop.calls) : 1,
			),
			tags: hopTags(hop, who),
			goodToKnow: goodToKnow(hop, to, firstMeeting),
			whenItFails: to.kind === 'client' ? undefined : to.onFailure,
			focus: [...met],
			edges: keys
				.slice(0, i + 1)
				.map((key, j): [string, EdgeLook] => [key, j === i ? 'current' : 'still']),
			journeyId: journey.id,
			about: to.id,
		};
	});

	// where the time goes: the slowest steps the user waits for
	const slowest = journey.hops
		.map((hop, i) => ({ hop, wait: state.hops[i]!.waitMs }))
		.filter(({ hop }) => hop.mode === 'sync')
		.sort((a, b) => b.wait - a.wait)[0];

	const load = underLoad(system, journey, state);
	const hasBackground = journey.hops.some((h) => h.mode === 'async');
	const allFlowing = keys.map((key): [string, EdgeLook] => [key, 'flow']);

	return {
		id: journey.id,
		title: journey.name,
		summary: journey.description,
		steps: [
			{
				title: 'The journey',
				body: [
					...(journey.story ? [journey.story] : []),
					journey.description,
					journey.person
						? `It takes ${plural(journey.hops.length, 'call')} between ${plural(involved.length, 'part')}. Let’s follow ${journey.person}’s request from start to finish.`
						: `It takes ${plural(journey.hops.length, 'call')} between ${plural(involved.length, 'part')}. Let’s follow one request from start to finish.`,
				],
				facts: [
					{
						label: 'Requests a second',
						value: formatRps(state.rps),
						hint: perMinute(state.rps),
					},
					{ label: 'Calls', value: String(journey.hops.length) },
					{ label: 'Parts', value: String(involved.length) },
				],
				tags: [],
				focus: [journey.hops[0]!.from],
				edges: [],
				journeyId: journey.id,
				about: journey.hops[0]!.from,
			},
			...hopSteps,
			{
				title: 'Where the time goes',
				body: [
					`Normally, ${who} waits about ${formatMs(state.latencyMs)} for an answer. That’s ${feelOfMs(state.latencyMs)}.`,
					slowest
						? `The longest step is “${slowest.hop.label}”, at ${formatMs(slowest.wait)}. That’s **${part(slowest.hop.from).name}** waiting for **${part(slowest.hop.to).name}**.`
						: '',
					hasBackground
						? 'The dashed calls happen in the background. They add nothing to the wait.'
						: '',
				].filter(Boolean),
				facts: [
					{
						label: 'Wait',
						value: formatMs(state.latencyMs),
						hint: feelOfMs(state.latencyMs),
					},
					{
						label: 'Succeed',
						value: formatShare(state.success),
						hint: feelOfShare(state.success),
					},
					{
						label: 'Requests a second',
						value: formatRps(state.rps),
						hint: perMinute(state.rps),
					},
				],
				tags: [],
				focus: involved,
				edges: allFlowing,
				journeyId: journey.id,
				timeline: true,
			},
			{
				title: load.preset.name,
				body: [load.preset.description, ...load.story],
				facts: [
					...(load.busier !== 1 || load.preset.down.length === 0
						? [
								{
									label: 'Traffic',
									value: `${load.busier}×`,
									hint:
										load.busier === 1
											? 'as busy as normal'
											: `${load.busier} times as busy as normal`,
								},
							]
						: []),
					...load.preset.down.map((id) => ({
						label: 'Not working',
						value: part(id).name,
						hint: 'down for now',
					})),
					{
						label: 'Succeed',
						value: formatShare(load.state.success),
						hint: feelOfShare(load.state.success),
					},
					{
						label: 'Wait',
						value: formatMs(load.state.latencyMs),
						hint: feelOfMs(load.state.latencyMs),
					},
				],
				tags: load.healthy
					? [
							{ text: 'It keeps working', tone: 'plain' },
							...(load.state.backgroundFailure > 0.01
								? [{ text: 'Background work fails', tone: 'warn' as const }]
								: []),
						]
					: [{ text: 'Something breaks', tone: 'warn' }],
				focus: involved,
				edges: allFlowing,
				journeyId: journey.id,
				presetId: load.preset.id,
				about: load.culprit,
			},
			{
				title: 'Try it yourself',
				body: [
					`Now try it in Explore freely. It opens on ${load.preset.name}, following “${journey.name}”.`,
					load.fixes.length > 0
						? `Things to try: ${orList(load.fixes.map((f) => `**${f.label}**`))}. Then watch the numbers and the diagram change.`
						: 'Push the traffic up, take a part down, or turn a safety feature off. Then watch what changes.',
					'When something breaks, the panel beside the diagram tells you why. It also offers a fix you can try with one click.',
				],
				facts: [],
				tags: [],
				focus: involved,
				edges: allFlowing,
				journeyId: journey.id,
				action: {
					kind: 'explore',
					label: `Explore ${load.preset.name}`,
					presetId: load.preset.id,
					journeyId: journey.id,
				},
			},
		],
	};
}

function callSentence(hop: Hop, from: Component, to: Component) {
	if (hop.onMiss) {
		const miss = from.hitRate !== undefined ? formatShare(1 - from.hitRate) : 'some';
		return `When **${from.name}** doesn’t have the answer, it asks **${to.name}**. That happens ${miss} of the time.`;
	}
	if (hop.mode === 'async') {
		return `**${from.name}** passes this to **${to.name}** and doesn’t wait for an answer.`;
	}
	if (from.kind === 'client') return `**${from.name}** sends a request to **${to.name}**.`;
	return `**${from.name}** calls **${to.name}**, and waits for the answer.`;
}

function hopTags(hop: Hop, who: string): LessonStep['tags'] {
	const tags: LessonStep['tags'] = [];
	if (hop.mode === 'async') tags.push({ text: 'Background: nobody waits', tone: 'background' });
	else tags.push({ text: `${capitalise(who)} waits for this`, tone: 'wait' });
	if (hop.optional) tags.push({ text: 'Optional', tone: 'plain' });
	if (hop.onMiss) tags.push({ text: 'Only if it’s not in the cache', tone: 'plain' });
	if (hop.share < 1) tags.push({ text: `${formatShare(hop.share)} of requests`, tone: 'plain' });
	if (hop.calls !== 1) tags.push({ text: `${hop.calls} calls per request`, tone: 'plain' });
	if (hop.retries > 0) {
		tags.push({ text: `Tried again up to ${plural(hop.retries, 'time')}`, tone: 'plain' });
	}
	return tags;
}

function hopFacts(
	hop: Hop,
	to: Component,
	sent: number,
	waitMs: number,
	result: SimResult,
	/** The share of the journey's requests that make this call. */
	often: number,
): LessonStep['facts'] {
	// a call few requests make: what it adds when it happens, not shared out over everyone
	const rare = often < 0.5 && often > 0;
	const facts: LessonStep['facts'] = [
		{ label: 'Calls a second', value: formatRps(sent), hint: perMinute(sent) },
		hop.mode === 'async'
			? { label: 'Adds to the wait', value: 'nothing', hint: 'nobody waits for it' }
			: rare
				? {
						label: 'Adds, when it happens',
						value: formatMs(waitMs / often),
						hint: `for ${formatShare(often)} of requests`,
					}
				: { label: 'Adds to the wait', value: formatMs(waitMs), hint: feelOfMs(waitMs) },
	];
	const copies = result.components[to.id]?.instances ?? to.instances;
	if (to.kind === 'cache' && to.hitRate !== undefined) {
		facts.push({
			label: 'Answered here',
			value: formatShare(to.hitRate),
			hint: `only ${Math.round((1 - to.hitRate) * 100)} in 100 take the slow way`,
		});
	} else if (to.kind === 'database') {
		facts.push({
			label: 'Shards',
			value: String(copies),
			hint:
				copies === 1 ? 'all the data on one machine' : `data split over ${copies} machines`,
		});
	} else if (to.kind !== 'client' && to.kind !== 'external') {
		facts.push({
			label: `Copies of ${to.name}`,
			value: String(copies),
			hint: `${copies} ${copies === 1 ? 'computer' : 'computers'} doing this job`,
		});
	}
	return facts;
}

function goodToKnow(hop: Hop, to: Component, firstMeeting: boolean): LessonStep['goodToKnow'] {
	if (hop.optional) {
		return {
			title: 'It can fail, and that’s fine',
			text: `This call is optional. If **${to.name}** doesn’t answer in time, the request still works, just not as well. This is called graceful degradation.`,
		};
	}
	if (firstMeeting && to.kind !== 'client') return { title: `Why ${to.name}?`, text: to.why };
	if (hop.mode === 'async') {
		return {
			title: 'Why in the background?',
			text: 'Nobody needs the answer right away, so the work is handed over. If this part is slow or down, the work waits and is tried again later. Nobody notices.',
		};
	}
	if (hop.retries > 0) {
		return {
			title: 'Trying again',
			text: 'A failed call is tried again. That hides small, short problems. But if the part is already overloaded, each retry gives it even more work.',
		};
	}
	return { title: `How ${to.name} grows`, text: to.scaling };
}

/** “A”, “A or B”, “A, B or C”. */
function orList(items: string[]) {
	return items.length < 2
		? (items[0] ?? '')
		: `${items.slice(0, -1).join(', ')} or ${items.at(-1)}`;
}

/**
 * The scenario a journey's lesson ends on: the one the system names for it,
 * or else the one that's hardest on it. And what happens to it, why, and
 * what to try.
 */
function underLoad(system: System, journey: Journey, normal: JourneyState) {
	const named = system.presets.find((p) => p.id === journey.scenario);
	const candidates = named
		? [named]
		: system.presets.slice(1).length
			? system.presets.slice(1)
			: system.presets;
	const runs = candidates.map((preset) => {
		const input = scenarioInput(preset);
		const result = simulate(system, input);
		return { preset, input, result, state: result.journeys[journey.id]! };
	});
	const worst = [...runs].sort(
		(a, b) => a.state.success - b.state.success || b.state.latencyMs - a.state.latencyMs,
	)[0]!;
	const healthy = worst.state.success >= 0.99 && worst.state.latencyMs <= SLOW_MS;
	const involved = new Set(journey.hops.flatMap((h) => [h.from, h.to]));
	const insights = explain(system, worst.input, worst.result).filter(
		(i) =>
			(i.level === 'bad' || i.level === 'warn') &&
			(i.text.startsWith(journey.name) || (i.componentId && involved.has(i.componentId))),
	);
	// the part this journey's own trouble is blamed on, or else the first one named
	const culprit =
		insights.find((i) => i.text.startsWith(`${journey.name}:`))?.componentId ??
		insights.find((i) => i.componentId)?.componentId;
	// the story's first line says how the journey does, so then it says why: what's
	// wrong with the parts behind it, the culprit first, rather than how each journey does
	const aboutJourney = (text: string) =>
		system.journeys.some((j) => text.startsWith(`${j.name}:`));
	const causes = insights
		.filter((i) => !aboutJourney(i.text))
		.sort((a, b) => Number(b.componentId === culprit) - Number(a.componentId === culprit));
	// its own background work failing is worth saying even when nobody notices
	const background = insights.filter(
		(i) => i.text.startsWith(`${journey.name}:`) && worst.state.backgroundFailure > 0.01,
	);
	// trouble elsewhere that this journey doesn't touch
	const elsewhere = system.components.filter((c) => {
		const status = worst.result.components[c.id]?.status;
		return (status === 'down' || status === 'overloaded') && !involved.has(c.id);
	});
	const who = whoWaits(system, journey);
	// still working, but much slower: say where the time goes
	const slower =
		worst.state.latencyMs > normal.latencyMs * 3 &&
		worst.state.latencyMs - normal.latencyMs > 150;
	const waitingOn = journey.hops
		.map((hop, i) => ({ hop, wait: worst.state.hops[i]!.waitMs }))
		.filter(({ hop }) => hop.mode === 'sync')
		.sort((a, b) => b.wait - a.wait)[0]?.hop.to;
	const waitingOnName = waitingOn && system.components.find((c) => c.id === waitingOn)?.name;
	const waitingOnDown = waitingOn && worst.result.components[waitingOn]?.status === 'down';
	const story = healthy
		? [
				slower
					? `“${journey.name}” keeps working, but it’s slower. ${capitalise(who)} waits about ${formatMs(worst.state.latencyMs)}, instead of ${formatMs(normal.latencyMs)}.`
					: `“${journey.name}” keeps working. ${formatShare(worst.state.success)} of requests still succeed, in about ${formatMs(worst.state.latencyMs)}.`,
				...(slower && waitingOnName
					? [
							waitingOnDown
								? `Most of that time is spent waiting for **${waitingOnName}**, which is down. Each call waits until it gives up. That’s called a timeout.`
								: `Most of that time is spent waiting for **${waitingOnName}**.`,
						]
					: []),
				...(elsewhere.length > 0
					? [
							`It doesn’t use ${orList(elsewhere.map((c) => `**${c.name}**`)).replace(/ or /, ' and ')}, which ${elsewhere.length > 1 ? 'are' : 'is'} in trouble right now.`,
						]
					: []),
				...[...background, ...causes].slice(0, 2).map((i) => i.text),
				...(elsewhere.length === 0 &&
				causes.length === 0 &&
				background.length === 0 &&
				worst.preset.traffic > 1
					? ['Autoscaling adds copies as the traffic grows.']
					: []),
			]
		: [
				worst.state.success < 0.005
					? `Now every “${journey.name}” request fails. ${capitalise(who)} waits about ${formatMs(worst.state.latencyMs)} for nothing.`
					: worst.state.success < 0.99
						? `Now only ${formatShare(worst.state.success)} of “${journey.name}” requests succeed. ${capitalise(feelOfShare(worst.state.success))}. ${capitalise(who)} waits about ${formatMs(worst.state.latencyMs)}.`
						: `“${journey.name}” still works, but ${who} now waits about ${formatMs(worst.state.latencyMs)}. That’s ${feelOfMs(worst.state.latencyMs)}.`,
				...(causes.length ? causes : insights).slice(0, 2).map((i) => i.text),
			];
	// what to try in Explore freely: the fixes for this journey's trouble, the culprit's first
	const ranked = [...insights].sort(
		(a, b) => Number(b.componentId === culprit) - Number(a.componentId === culprit),
	);
	const fixes = fixesFor(system, worst.input, worst.result, ranked).flat().slice(0, 3);
	// how much busier this journey is than normal: all traffic, and its own share of the rush
	const busier =
		Math.round(worst.preset.traffic * (worst.preset.journeyTraffic[journey.id] ?? 1) * 100) /
		100;
	return { preset: worst.preset, state: worst.state, healthy, story, culprit, fixes, busier };
}
