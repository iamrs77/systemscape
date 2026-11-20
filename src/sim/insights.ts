import type { System } from '@/model/schema';
import type { SimInput, SimResult } from './engine';
import { formatMs, formatShare, formatUtilization } from './format';

export type Insight = {
	level: 'bad' | 'warn' | 'info' | 'good';
	text: string;
	/** The component it's about, so the UI can link to it. */
	componentId?: string;
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
		if (!state) continue;

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
			insights.push({
				level: 'bad',
				text: worst
					? `${journey.name}: only ${formatShare(state.success)} succeed, because calls to ${name(worst.id)} are failing.`
					: `${journey.name}: only ${formatShare(state.success)} succeed.`,
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
				text: `${journey.name} works but takes ${formatMs(state.latencyMs)}, mostly waiting for ${name(slowest.id)}.`,
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
				text: `${journey.name}: ${formatShare(state.backgroundFailure)} of the background work afterwards fails. Users don’t notice yet, but it piles up for later.`,
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
			if (component.maxInstances === undefined) {
				why = ' It can’t add instances by itself: someone has to add them.';
			} else if (!input.autoscale) {
				why = ' Autoscaling is off.';
			} else if (input.sudden) {
				why = ' The rush came too suddenly for autoscaling to keep up.';
			} else if (state.instances >= component.maxInstances) {
				why = ` Autoscaling has hit its limit of ${component.maxInstances} instances.`;
			}
			insights.push({
				level: 'bad',
				text: `${component.name} is overloaded: asked for ${formatUtilization(state.utilization)} of what it can handle, so it fails ${formatShare(state.failRate)} of calls.${why}`,
				componentId: id,
			});
		}

		if (
			input.retries &&
			state.demand > 0 &&
			state.load > state.demand * 1.15 &&
			state.status !== 'down'
		) {
			insights.push({
				level: 'warn',
				text: `Retries add ${formatShare(state.load / state.demand - 1)} more calls to ${component.name}, on top of what it already can’t handle: a retry storm.`,
				componentId: id,
			});
		}

		if (state.breakerOpen) {
			insights.push({
				level: 'info',
				text: `Circuit breakers have tripped for ${component.name}: callers stop waiting for it and fail fast instead.`,
				componentId: id,
			});
		}
	}

	for (const [id, journeys] of degraded) {
		insights.push({
			level: 'info',
			text: `${journeys.join(', ')} carry on without ${name(id)} when it fails: worse, but still working. That’s graceful degradation.`,
			componentId: id,
		});
	}

	const autoscaled = system.components.filter((c) => result.components[c.id]?.autoscaled);
	if (autoscaled.length > 0) {
		insights.push({
			level: 'info',
			text: `Autoscaling added instances to ${autoscaled.map((c) => c.name).join(', ')}.`,
		});
	}

	if (!insights.some((i) => i.level === 'bad' || i.level === 'warn')) {
		const busiest = result.bottleneck;
		insights.push({
			level: 'good',
			text: busiest
				? `Everything is working. The busiest part is ${name(busiest)}, at ${formatUtilization(result.components[busiest]!.utilization)}.`
				: 'Everything is working, with room to spare.',
			componentId: busiest ?? undefined,
		});
	}

	return insights.sort((a, b) => order[a.level] - order[b.level]);
}
