import type { System } from '@/model/schema';
import type { SimInput, SimResult } from './engine';
import type { Insight } from './insights';
import { MAX_INSTANCES } from './scenario';

/** Autoscaling and hand-added copies aim to keep each part at most this busy. */
const COMFORTABLE = 0.7;

export type Change =
	| { kind: 'copies'; componentId: string; instances: number }
	| { kind: 'bring-back'; componentId: string }
	| { kind: 'switch'; option: 'autoscale' | 'retries' | 'circuitBreakers'; on: boolean };

/** Something to try for a problem: what it says on the button, and what it changes. */
export type Fix = { label: string; change: Change };

/**
 * A fix to try for each problem, beside the first problem it would help:
 * enough copies to bring an overloaded part back to comfortable, bringing
 * back a part that's down, or the safety feature that would help.
 */
export function fixesFor(
	system: System,
	input: SimInput,
	result: SimResult,
	insights: Insight[],
): Fix[][] {
	const offered = new Set<string>();
	return insights.map((insight) => {
		const fixes: Fix[] = [];
		const component = system.components.find((c) => c.id === insight.componentId);
		const state = component && result.components[component.id];
		// breakers only help when someone waits on the part, and the simulation
		// never trips them on a cache
		const breakersHelp =
			!input.circuitBreakers &&
			component !== undefined &&
			component.kind !== 'cache' &&
			component.kind !== 'cdn' &&
			// a person using an app waits on it: not just another company's system
			system.journeys.some(
				(j) =>
					system.components.find((c) => c.id === j.hops[0]!.from)?.kind === 'client' &&
					j.hops.some((h) => h.to === component.id && h.mode === 'sync'),
			);
		const breakers: Fix = {
			label: 'Turn on circuit breakers',
			change: { kind: 'switch', option: 'circuitBreakers', on: true },
		};
		if (insight.retryStorm && input.retries) {
			fixes.push({
				label: 'Turn off retries',
				change: { kind: 'switch', option: 'retries', on: false },
			});
		}
		if (component && state?.status === 'down') {
			fixes.push({
				// another company's outage ends; our own part is brought back
				label:
					component.kind === 'external'
						? `End the outage at ${component.name}`
						: `Bring back ${component.name}`,
				change: { kind: 'bring-back', componentId: component.id },
			});
			if (breakersHelp) fixes.push(breakers);
		} else if (component && state?.status === 'overloaded') {
			if (component.kind === 'external') {
				if (breakersHelp) fixes.push(breakers);
			} else {
				const needed = Math.min(
					MAX_INSTANCES,
					Math.ceil((state.instances * state.utilization) / COMFORTABLE),
				);
				if (needed > state.instances) {
					const more = needed - state.instances;
					fixes.push({
						label: `Add ${more} ${more === 1 ? 'copy' : 'copies'} of ${component.name}`,
						change: { kind: 'copies', componentId: component.id, instances: needed },
					});
				}
				if (!input.autoscale && component.maxInstances !== undefined) {
					fixes.push({
						label: 'Turn on autoscaling',
						change: { kind: 'switch', option: 'autoscale', on: true },
					});
				}
			}
		}
		return fixes.filter((fix) => {
			if (offered.has(fix.label)) return false;
			offered.add(fix.label);
			return true;
		});
	});
}
