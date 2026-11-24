import type { Preset, System } from '@/model/schema';
import { defaultInput, type Balancing, type SimInput } from './engine';

/** The most copies of a part you can ask for. */
export const MAX_INSTANCES = 100;

/** What a scenario decides: how much traffic, how suddenly, and what's broken. */
export function scenarioConditions(
	preset: Preset,
): Pick<SimInput, 'traffic' | 'journeyTraffic' | 'sudden' | 'down'> {
	return {
		traffic: preset.traffic,
		journeyTraffic: preset.journeyTraffic,
		sudden: preset.sudden,
		down: new Set(preset.down),
	};
}

/** A scenario as it starts, with nothing else changed. */
export function scenarioInput(preset: Preset): SimInput {
	return { ...defaultInput, ...scenarioConditions(preset) };
}

/**
 * What a lesson step changes from the system's ordinary day: how much
 * traffic, which journeys run, what's down, how many copies or how big the
 * servers are, and which safety features are on.
 */
export type Conditions = {
	traffic?: number;
	/** Only these journeys run; the others are switched off. */
	only?: string[];
	down?: string[];
	copies?: Record<string, number>;
	/** Bigger servers: 2 is twice the capacity for each copy. */
	bigger?: Record<string, number>;
	hitRate?: Record<string, number>;
	/** Parts that fail a share of calls at random, like a shaky connection. */
	flaky?: Record<string, number>;
	/** Parts where every request takes this many times as long, like a copy with a failing disk. */
	slow?: Record<string, number>;
	/** How each load balancer picks between its copies. */
	balancing?: Record<string, Balancing>;
	/** On unless a step turns them off. */
	healthChecks?: boolean;
	/** Parts that turn away what they can’t take at once, instead of letting it time out. */
	shed?: string[];
	/** Retries allowed, as a share of first tries: 0.1 for at most 10% more calls. */
	retryBudget?: number;
	/** Network links that are broken: both parts run, but can’t reach each other. */
	cut?: [string, string][];
	/** Requests one copy of a part can have in progress at once, waits included. */
	threads?: Record<string, number>;
	/** Threads each copy may spend waiting on one kind of call, by "from>to". */
	bulkheads?: Record<string, number>;
	retries?: boolean;
	circuitBreakers?: boolean;
	/** Off unless a step turns it on, so the copies stay what the step says. */
	autoscale?: boolean;
	sudden?: boolean;
};

/** The conditions as the simulation takes them. */
export function conditionsInput(system: System, conditions: Conditions): SimInput {
	const base = scenarioInput(system.presets[0]!);
	const journeyTraffic = { ...base.journeyTraffic };
	if (conditions.only) {
		for (const journey of system.journeys) {
			journeyTraffic[journey.id] = conditions.only.includes(journey.id)
				? Math.max(journeyTraffic[journey.id] ?? 1, 1)
				: 0;
		}
	}
	return {
		...base,
		traffic: conditions.traffic ?? base.traffic,
		journeyTraffic,
		sudden: conditions.sudden ?? base.sudden,
		autoscale: conditions.autoscale ?? false,
		retries: conditions.retries ?? base.retries,
		circuitBreakers: conditions.circuitBreakers ?? base.circuitBreakers,
		down: new Set([...base.down, ...(conditions.down ?? [])]),
		instances: conditions.copies ?? {},
		scale: conditions.bigger,
		hitRate: conditions.hitRate,
		flaky: conditions.flaky,
		slow: conditions.slow,
		balancing: conditions.balancing,
		healthChecks: conditions.healthChecks,
		shed: conditions.shed,
		retryBudget: conditions.retryBudget,
		cut: conditions.cut,
		threads: conditions.threads,
		bulkheads: conditions.bulkheads,
	};
}
