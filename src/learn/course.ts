import type { EdgeLook } from '@/diagram/Diagram';
import { edgeKey, runningJourneys, runningParts } from '@/diagram/layout';
import type { System } from '@/model/schema';
import { simulate, type SimResult } from '@/sim/engine';
import { feelOfMs, feelOfShare, formatMs, formatRps, formatShare, perMinute } from '@/sim/format';
import { conditionsInput, type Conditions } from '@/sim/scenario';
import type { Lesson, LessonStep, Tone } from './lessons';

/**
 * Hand-written courses: lessons that teach an idea rather than follow a
 * product, on a small system made for them. Each step says which parts to
 * show, which calls to draw, and what conditions to run, and its numbers are
 * worked out by running the simulation under those conditions.
 */

/** A number over the diagram, worked out from the step's simulation. */
export type FactSpec =
	| 'wait'
	| 'succeed'
	| 'rate'
	/** Requests that worked without an optional part (graceful degradation). */
	| 'degraded'
	| { busy: string }
	| { copies: string }
	| { load: string }
	/** The requests each copy of a part gets: its load shared out. */
	| { each: string }
	/** Work arriving faster than a part can do it, waiting in its queue. */
	| { backlog: string }
	/** The extra calls a part gets because callers try again. */
	| { retries: string }
	/** Another journey's wait or success, beside this one's. */
	| { wait: string; label: string }
	| { succeed: string; label: string }
	| { label: string; value: string; hint?: string };

export type StepSpec = {
	title: string;
	body: string[];
	/** The parts at full strength; the others are faint. */
	show: string[];
	/** Whose calls are drawn, and whose numbers are shown. */
	journey?: string;
	/** Other journeys whose calls are drawn too, like the writes beside the reads. */
	draw?: string[];
	/** The calls being explained, drawn stronger: [from, to]. */
	current?: [string, string][];
	/** What this step changes from an ordinary day. */
	set?: Conditions;
	facts?: FactSpec[];
	tags?: { text: string; tone: Tone }[];
	/** Show how many copies each part runs. */
	copies?: boolean;
	/** Show each call's share of the wait. */
	timeline?: boolean;
	note?: { title: string; text: string };
	warn?: string;
	/** The part this step is about, to read more on. */
	about?: string;
	example?: { says: string; data: Record<string, string> };
};

export type LessonSpec = {
	id: string;
	title: string;
	summary: string;
	steps: StepSpec[];
	/** The last step: try it in Explore freely, under these conditions. */
	tryIt: { text: string; journey?: string; set?: Conditions };
};

/** A short course on one subject, like "Performance". */
export type Track = { id: string; name: string; tagline: string; lessons: LessonSpec[] };

function factsFor(
	system: System,
	result: SimResult,
	journeyId: string | undefined,
	specs: FactSpec[],
): LessonStep['facts'] {
	const name = (id: string) => system.components.find((c) => c.id === id)?.name ?? id;
	const journey = journeyId ? result.journeys[journeyId] : undefined;
	return specs.flatMap((spec): LessonStep['facts'] => {
		if (spec === 'wait') {
			return journey
				? [
						{
							label: 'Wait',
							value: formatMs(journey.latencyMs),
							hint: feelOfMs(journey.latencyMs),
						},
					]
				: [];
		}
		if (spec === 'succeed') {
			return journey
				? [
						{
							label: 'Succeed',
							value: formatShare(journey.success),
							hint: feelOfShare(journey.success),
						},
					]
				: [];
		}
		if (spec === 'rate') {
			return journey
				? [
						{
							label: 'Requests a second',
							value: formatRps(journey.rps),
							hint: perMinute(journey.rps),
						},
					]
				: [];
		}
		if (spec === 'degraded') {
			return journey
				? [
						{
							label: 'Without the extras',
							value: formatShare(journey.degraded),
							hint: 'worked, minus an optional part',
						},
					]
				: [];
		}
		if ('busy' in spec) {
			const state = result.components[spec.busy];
			if (!state) return [];
			const share = state.utilization;
			return [
				{
					label: `How busy: ${name(spec.busy)}`,
					value: `${Math.round(share * 100)}%`,
					hint:
						state.status === 'down'
							? 'down'
							: share >= 1
								? 'more than it can handle'
								: share >= 0.7
									? 'busy'
									: 'room to spare',
				},
			];
		}
		if ('copies' in spec) {
			const count = result.components[spec.copies]?.instances ?? 1;
			return [
				{
					label: `Copies of ${name(spec.copies)}`,
					value: String(count),
					hint: `${count} ${count === 1 ? 'computer' : 'computers'} doing this job`,
				},
			];
		}
		if ('wait' in spec || 'succeed' in spec) {
			const other = 'wait' in spec ? spec.wait : spec.succeed;
			const state = result.journeys[other];
			if (!state) return [];
			return 'wait' in spec
				? [
						{
							label: spec.label,
							value: formatMs(state.latencyMs),
							hint: feelOfMs(state.latencyMs),
						},
					]
				: [
						{
							label: spec.label,
							value: formatShare(state.success),
							hint: feelOfShare(state.success),
						},
					];
		}
		if ('retries' in spec) {
			const state = result.components[spec.retries];
			const extra = state ? Math.max(0, state.load - state.demand) : 0;
			return [
				{
					label: `Extra calls from retries`,
					value: formatRps(extra),
					hint: extra > 0 ? perMinute(extra) : 'none',
				},
			];
		}
		if ('backlog' in spec) {
			const state = result.components[spec.backlog];
			const extra = state?.backlog ?? 0;
			return [
				extra > 0
					? {
							label: 'Piling up in the queue',
							value: `+${formatRps(extra)}`,
							hint: perMinute(extra).replace(' every', ' more every'),
						}
					: { label: 'Piling up in the queue', value: '0', hint: 'keeping up' },
			];
		}
		if ('each' in spec) {
			const state = result.components[spec.each];
			const each = state ? state.load / state.instances : 0;
			return [
				{
					label: `Each copy of ${name(spec.each)}`,
					value: formatRps(each),
					hint: `${state?.instances ?? 1} copies share the work`,
				},
			];
		}
		if ('load' in spec) {
			const load = result.components[spec.load]?.load ?? 0;
			return [
				{
					label: `Requests to ${name(spec.load)}`,
					value: formatRps(load),
					hint: perMinute(load),
				},
			];
		}
		return [spec];
	});
}

function stepFrom(system: System, spec: StepSpec): LessonStep {
	const conditions = spec.set ?? {};
	const result = simulate(system, conditionsInput(system, conditions));
	const drawn = [spec.journey, ...(spec.draw ?? [])];
	const hops = system.journeys.filter((j) => drawn.includes(j.id)).flatMap((j) => j.hops);
	const current = new Set((spec.current ?? []).map(([from, to]) => edgeKey(from, to)));
	// only the calls between parts this step shows: the rest come later
	const shown = new Set(spec.show);
	const edges = hops
		.filter((hop) => shown.has(hop.from) && shown.has(hop.to))
		.map((hop): [string, EdgeLook] => {
			const key = edgeKey(hop.from, hop.to);
			return [key, current.has(key) ? 'current' : 'flow'];
		});
	return {
		title: spec.title,
		body: spec.body,
		facts: factsFor(system, result, spec.journey, spec.facts ?? []),
		tags: spec.tags ?? [],
		goodToKnow: spec.note,
		whenItFails: spec.warn,
		focus: spec.show,
		edges,
		// with more than one journey drawn, the dots follow them all
		journeyId: spec.draw ? null : (spec.journey ?? null),
		journeys: drawn.filter((id): id is string => id !== undefined),
		showCopies: spec.copies,
		timeline: spec.timeline,
		about: spec.about,
		example: spec.example && {
			says: spec.example.says,
			data: Object.entries(spec.example.data),
		},
		result,
		conditions,
	};
}

/** A system's hand-written course, as lessons, in order, each knowing its track. */
export function courseLessons(system: System, tracks: Track[]): Lesson[] {
	return tracks.flatMap((track) =>
		track.lessons.map((lesson): Lesson => {
			const steps = lesson.steps.map((spec) => stepFrom(system, spec));
			const last = lesson.steps.at(-1)!;
			const tryConditions = lesson.tryIt.set ?? last.set ?? {};
			const journeyId = lesson.tryIt.journey ?? last.journey ?? null;
			// what Explore freely will show: the journeys running, and the parts they use
			const tried = simulate(system, conditionsInput(system, tryConditions));
			const running = runningParts(system, tried);
			const others = runningJourneys(system, tried).filter((id) => id !== journeyId);
			return {
				id: lesson.id,
				title: lesson.title,
				summary: lesson.summary,
				track: { id: track.id, name: track.name },
				steps: [
					...steps,
					{
						...stepFrom(system, {
							...last,
							show: [...running],
							draw: others.length > 0 ? others : undefined,
							current: [],
							set: tryConditions,
							journey: journeyId ?? undefined,
						}),
						title: 'Try it yourself',
						body: [
							lesson.tryIt.text,
							'Change anything there: the traffic, the copies, what’s down. The panel beside the diagram says what happens, and why.',
						],
						facts: [],
						tags: [],
						goodToKnow: undefined,
						whenItFails: undefined,
						timeline: false,
						example: undefined,
						action: {
							kind: 'explore',
							label: 'Try it in Explore freely',
							journeyId: journeyId ?? undefined,
							conditions: tryConditions,
						},
					},
				],
			};
		}),
	);
}
