import type { System } from '@/model/schema';
import type { SimInput, SimResult } from './engine';
import { formatMs, formatShare, formatUtilization, perMinute } from './format';

/** Names in a sentence: “A, B and C”. */
function listOf(names: string[]) {
	return names.length > 1
		? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
		: (names[0] ?? '');
}

export type Insight = {
	level: 'bad' | 'warn' | 'info' | 'good';
	text: string;
	/** The component it's about, so the UI can link to it. */
	componentId?: string;
	/** Retries piling extra calls onto a part that's already struggling. */
	retryStorm?: boolean;
};

const order = { bad: 0, warn: 1, info: 2, good: 3 } as const;

/** A user takes this long before they notice a request is slow. */
export const SLOW_MS = 1000;

/**
 * Explains a simulation result in plain words: what's failing, why, and what
 * the system is doing about it. The most serious come first.
 */
export function explain(system: System, input: SimInput, result: SimResult): Insight[] {
	const insights: Insight[] = [];
	const name = (id: string) => system.components.find((c) => c.id === id)?.name ?? id;
	// optional parts that are failing, and the journeys carrying on without them
	const degraded = new Map<string, string[]>();

	for (const journey of system.journeys) {
		const state = result.journeys[journey.id];
		// a journey switched off (an alternative kept for teaching) has nothing to say
		if (!state || state.rps === 0) continue;

		if (state.success < 0.99) {
			// blame the required step that fails the most
			let worst: { id: string; failRate: number } | undefined;
			journey.hops.forEach((hop, i) => {
				const failRate = state.hops[i]?.failRate ?? 0;
				const to = system.components.find((c) => c.id === hop.to);
				const required = hop.mode === 'sync' && !hop.optional && to?.kind !== 'cache';
				if (required && failRate > (worst?.failRate ?? 0.01))
					worst = { id: hop.to, failRate };
			});
			const succeed =
				formatShare(state.success) === '0%'
					? `${journey.name}: every request fails.`
					: `${journey.name}: only ${formatShare(state.success)} succeed.`;
			const culprit = worst && result.components[worst.id]?.status;
			const why = !worst
				? ''
				: culprit === 'down'
					? ` ${name(worst.id)} is down.`
					: culprit === 'overloaded'
						? ` ${name(worst.id)} is too busy, so it turns requests away.`
						: ` Calls to ${name(worst.id)} are failing.`;
			insights.push({
				level: 'bad',
				text: `${succeed}${why}`,
				componentId: worst?.id,
			});
		} else if (state.latencyMs > SLOW_MS) {
			let slowest = { id: '', waitMs: 0 };
			journey.hops.forEach((hop, i) => {
				const waitMs = state.hops[i]?.waitMs ?? 0;
				if (waitMs > slowest.waitMs) slowest = { id: hop.to, waitMs };
			});
			insights.push({
				level: 'warn',
				text: `${journey.name}: slow, but working. It takes ${formatMs(state.latencyMs)}, mostly waiting for ${name(slowest.id)}.`,
				componentId: slowest.id,
			});
		}

		if (state.degraded > 0.01) {
			journey.hops.forEach((hop, i) => {
				if (!hop.optional || (state.hops[i]?.failRate ?? 0) <= 0.01) return;
				const list = degraded.get(hop.to) ?? [];
				if (!list.includes(journey.name)) list.push(journey.name);
				degraded.set(hop.to, list);
			});
		}

		if (state.backgroundFailure > 0.01) {
			insights.push({
				level: 'warn',
				text: `${journey.name}: ${formatShare(state.backgroundFailure)} of the background work fails. People don’t notice yet, but the unfinished work piles up.`,
			});
		}
	}

	for (const component of system.components) {
		const state = result.components[component.id];
		if (!state || component.kind === 'client') continue;
		const id = component.id;

		if (state.status === 'down') {
			insights.push({
				level: 'bad',
				text: `${component.name} is down. ${component.onFailure}`,
				componentId: id,
			});
		} else if (state.status === 'overloaded') {
			let why = '';
			if (component.kind === 'external') {
				why = ' Another company runs it, so we can’t add copies.';
			} else if (component.maxInstances === undefined) {
				why = ' It can’t add copies by itself. Someone has to add them.';
			} else if (!input.autoscale) {
				why = ' Autoscaling is off.';
			} else if (input.sudden) {
				why = ' The rush came too fast for autoscaling to keep up.';
			} else if (state.instances >= component.maxInstances) {
				why = ` Autoscaling has reached its limit of ${component.maxInstances} copies.`;
			}
			insights.push(
				state.backlog > 0
					? {
							// a queue in front keeps the work: it's late, not lost, while the queue lasts
							level: 'warn',
							text: `${component.name} can’t keep up. It gets ${formatUtilization(state.utilization)} of the work it can do, so jobs pile up in the queue, ${perMinute(state.backlog).replace(' every', ' more every')}, and wait their turn.${why}`,
							componentId: id,
						}
					: {
							level: 'bad',
							text: `${component.name} is overloaded. It gets ${formatUtilization(state.utilization)} of the requests it can handle, so ${formatShare(state.failRate)} of them fail.${why}`,
							componentId: id,
						},
			);
		}

		if (
			input.retries &&
			state.demand > 0 &&
			state.load > state.demand * 1.15 &&
			state.status !== 'down'
		) {
			insights.push({
				level: 'warn',
				text: `Retries add ${formatShare(state.load / state.demand - 1)} more calls to ${component.name}, which already can’t keep up. This is called a retry storm.`,
				componentId: id,
				retryStorm: true,
			});
		}

		if (state.breakerOpen) {
			insights.push({
				level: 'info',
				text: `Circuit breakers have tripped for ${component.name}. Other parts stop waiting for it and give up straight away.`,
				componentId: id,
			});
		}
	}

	for (const [id, journeys] of degraded) {
		insights.push({
			level: 'info',
			text: `${listOf(journeys.map((j) => `“${j}”`))} still ${journeys.length === 1 ? 'works' : 'work'} without ${name(id)}, just not as well. This is called graceful degradation.`,
			componentId: id,
		});
	}

	const autoscaled = system.components.filter((c) => result.components[c.id]?.autoscaled);
	if (autoscaled.length > 0) {
		insights.push({
			level: 'info',
			text: `Autoscaling added copies of ${listOf(autoscaled.map((c) => c.name))}.`,
		});
	}

	if (!insights.some((i) => i.level === 'bad' || i.level === 'warn')) {
		const busiest = result.bottleneck;
		insights.push({
			level: 'good',
			text: busiest
				? `Everything is working. The busiest part is ${name(busiest)}, at ${formatUtilization(result.components[busiest]!.utilization)} busy.`
				: 'Everything is working, with room to spare.',
			componentId: busiest ?? undefined,
		});
	}

	return insights.sort((a, b) => order[a.level] - order[b.level]);
}
