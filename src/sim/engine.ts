import type { Component, System } from '@/model/schema';

/**
 * The simulation: given a system and the conditions (traffic, scaling,
 * failures), it works out where things settle. Each component gets its load,
 * how busy it is, how slow it is and how many requests it fails; each journey
 * gets its success rate and latency.
 *
 * It's a steady-state model, solved by iterating until the numbers stop
 * changing, because load and failures feed each other: failures cause
 * retries, retries add load, load causes failures.
 */

export type SimInput = {
	/** Multiplies every journey's traffic (1 = a normal day). */
	traffic: number;
	/** Extra multipliers for some journeys. */
	journeyTraffic?: Record<string, number>;
	/** The traffic arrived within minutes, too fast for autoscaling. */
	sudden: boolean;
	autoscale: boolean;
	retries: boolean;
	circuitBreakers: boolean;
	/** Components that are down. */
	down: ReadonlySet<string>;
	/** Instances set by hand, by component id. */
	instances: Readonly<Record<string, number>>;
	/** Bigger servers: multiplies a component's capacity for each copy, e.g. 2 for twice as much. */
	scale?: Readonly<Record<string, number>>;
	/** A cache's hit rate set by hand, e.g. a cold cache that's just started. */
	hitRate?: Readonly<Record<string, number>>;
};

export type Status = 'idle' | 'ok' | 'busy' | 'overloaded' | 'down';

export type ComponentState = {
	/** Requests per second arriving, retries included, each counted by how much work it is (see a hop's `work`). */
	load: number;
	/** Requests per second asked for, before retries: what circuit breakers judge by. */
	demand: number;
	instances: number;
	/** Requests per second it can handle; Infinity for clients. */
	capacity: number;
	/** load ÷ capacity: above 1 it's overloaded. */
	utilization: number;
	/** The share of its requests that fail: when overloaded, or all of them when down. */
	failRate: number;
	/** Time per request at this load (queueing makes busy components slower). */
	latencyMs: number;
	status: Status;
	/** Autoscaling added instances. */
	autoscaled: boolean;
	/** Callers have stopped calling it (circuit breakers). */
	breakerOpen: boolean;
};

export type HopState = {
	/** Calls per second sent, retries included. */
	sent: number;
	/** The share of calls that fail after retries (1 when the breaker is open). */
	failRate: number;
	breakerOpen: boolean;
	/** Time this step adds to what the user waits for, averaged over all requests. */
	waitMs: number;
};

export type JourneyState = {
	/** Requests per second at these conditions. */
	rps: number;
	/** The share of requests that succeed. */
	success: number;
	/** Succeeded, but without an optional step (graceful degradation). */
	degraded: number;
	/** Typical time a user waits, in ms. Async steps don't count. */
	latencyMs: number;
	/** The share of background (async) work that fails. */
	backgroundFailure: number;
	hops: HopState[];
};

export type SimResult = {
	components: Record<string, ComponentState>;
	journeys: Record<string, JourneyState>;
	/** The busiest component at 70% or more, or null. */
	bottleneck: string | null;
};

/** Autoscaling adds instances to stay at or below this utilization. */
export const AUTOSCALE_TARGET = 0.7;
/** A busy component; above this, queueing delay grows quickly. */
export const BUSY_AT = 0.7;
/** Callers wait this long for a call that fails by timing out. */
export const TIMEOUT_MS = 2000;
/** Cache calls get a much shorter timeout: a miss is cheap to recover from. */
export const CACHE_TIMEOUT_MS = 50;
/** A circuit breaker opens when more than this share of calls would fail. */
export const BREAKER_THRESHOLD = 0.5;
/** With the breaker open, this share of calls still goes through, to test recovery. */
export const BREAKER_PROBES = 0.02;

const isCache = (c: Component) => c.kind === 'cache' || c.kind === 'cdn';

export const defaultInput: SimInput = {
	traffic: 1,
	sudden: false,
	autoscale: true,
	retries: true,
	circuitBreakers: false,
	down: new Set(),
	instances: {},
};

export function simulate(system: System, input: SimInput): SimResult {
	const byId = new Map(system.components.map((c) => [c.id, c]));
	const baseInstances = (c: Component) => input.instances[c.id] ?? c.instances;

	// state carried between iterations
	const failRate = new Map<string, number>();
	const instances = new Map<string, number>();
	for (const c of system.components) {
		failRate.set(c.id, input.down.has(c.id) ? 1 : 0);
		instances.set(c.id, baseInstances(c));
	}
	const capacityOf = (c: Component) =>
		c.capacityPerInstance === undefined
			? Infinity
			: c.capacityPerInstance * (input.scale?.[c.id] ?? 1) * (instances.get(c.id) ?? 1);
	const hitRateOf = (c: Component) => input.hitRate?.[c.id] ?? c.hitRate ?? 0;

	let load = new Map<string, number>();
	let offered = new Map<string, number>();
	// the last round's totals: this round's are still being added up
	let lastLoad = new Map<string, number>();
	let lastOffered = new Map<string, number>();
	let journeys: Record<string, JourneyState> = {};

	for (let round = 0; round < 200; round++) {
		load = new Map();
		// first attempts only, as if nothing failed: what circuit breakers judge by
		offered = new Map();
		journeys = {};
		const breakerOpen = (c: Component) => {
			if (!input.circuitBreakers || isCache(c) || c.kind === 'client') return false;
			if (input.down.has(c.id)) return true;
			const demand = lastOffered.get(c.id) ?? 0;
			return demand > 0 && 1 - capacityOf(c) / demand > BREAKER_THRESHOLD;
		};

		for (const journey of system.journeys) {
			const rps = journey.rps * input.traffic * (input.journeyTraffic?.[journey.id] ?? 1);
			// the share of this journey's requests that got to each component
			const reach = new Map<string, number>([[journey.hops[0]!.from, 1]]);
			let failed = 0;
			let degraded = 0;
			let latencyMs = 0;
			let background = 0;
			let backgroundFailed = 0;
			const hops: HopState[] = [];

			for (const hop of journey.hops) {
				const from = byId.get(hop.from)!;
				const to = byId.get(hop.to)!;
				let perRequest = (reach.get(hop.from) ?? 0) * hop.share;
				if (hop.onMiss) {
					// a cache that fails counts as a miss: the request carries on behind it
					perRequest *= 1 - hitRateOf(from) * (1 - (failRate.get(from.id) ?? 0));
				}
				const calls = perRequest * hop.calls;
				offered.set(to.id, (offered.get(to.id) ?? 0) + calls * hop.work * rps);

				const f = failRate.get(to.id) ?? 0;
				const open = breakerOpen(to);
				const tries = input.retries ? hop.retries : 0;
				let sent: number;
				let callFail: number;
				// a breaker answers failures at once instead of waiting for a timeout
				const failFast = open;
				if (open && input.down.has(to.id)) {
					// a dead component only gets the occasional test call
					sent = calls * BREAKER_PROBES;
					callFail = 1;
				} else if (open) {
					// an overloaded one: the breaker flaps open and shut, so calls get
					// through up to what it can handle, without retries piling on
					sent = calls;
					callFail = f;
				} else {
					// each retry only happens when the attempt before it failed
					let attempts = 0;
					for (let k = 0; k <= tries; k++) attempts += f ** k;
					sent = calls * attempts;
					callFail = f ** (tries + 1);
				}
				load.set(to.id, (load.get(to.id) ?? 0) + sent * hop.work * rps);
				const hopState: HopState = {
					sent: sent * rps,
					failRate: callFail,
					breakerOpen: open,
					waitMs: 0,
				};
				hops.push(hopState);

				const continues = isCache(to) || hop.optional ? 1 : 1 - callFail;
				reach.set(to.id, Math.min(1, (reach.get(to.id) ?? 0) + perRequest * continues));

				if (hop.mode === 'async') {
					// background work finishes only if every async step does
					background = Math.max(background, perRequest);
					backgroundFailed += perRequest * callFail;
					continue;
				}
				// otherwise a failed call waits for its timeout, once per try
				const timeout = isCache(to) ? CACHE_TIMEOUT_MS : TIMEOUT_MS;
				const waitOnFailure = failFast ? 0 : timeout * (tries + 1);
				const toLatency = Math.min(
					TIMEOUT_MS,
					hop.work * latencyAt(to, (lastLoad.get(to.id) ?? 0) / capacityOf(to)),
				);
				hopState.waitMs =
					perRequest * ((1 - callFail) * toLatency + callFail * waitOnFailure);
				latencyMs += hopState.waitMs;
				if (isCache(to)) continue;
				if (hop.optional) degraded += perRequest * callFail;
				else failed += perRequest * callFail;
			}

			const success = Math.max(0, 1 - Math.min(1, failed));
			journeys[journey.id] = {
				rps,
				success,
				degraded: Math.min(success, degraded),
				latencyMs,
				backgroundFailure: background > 0 ? Math.min(1, backgroundFailed / background) : 0,
				hops,
			};
		}

		// let each component react to its load: autoscale, then see what fails
		let change = 0;
		for (const c of system.components) {
			const arriving = load.get(c.id) ?? 0;
			if (c.capacityPerInstance !== undefined) {
				const base = baseInstances(c);
				let next = base;
				if (input.autoscale && !input.sudden && c.maxInstances !== undefined) {
					const wanted = Math.ceil(arriving / (c.capacityPerInstance * AUTOSCALE_TARGET));
					next = Math.min(c.maxInstances, Math.max(base, wanted));
				}
				change = Math.max(change, Math.abs(next - (instances.get(c.id) ?? base)));
				instances.set(c.id, next);
			}
			const capacity = capacityOf(c);
			const target = input.down.has(c.id)
				? 1
				: arriving > capacity
					? 1 - capacity / arriving
					: 0;
			const previous = failRate.get(c.id) ?? 0;
			// move halfway each round, so retries and failures settle instead of swinging
			const next = previous + (target - previous) / 2;
			change = Math.max(change, Math.abs(next - previous));
			failRate.set(c.id, next);
		}
		const loadMoved = [...load].some(
			([id, value]) => Math.abs(value - (lastLoad.get(id) ?? 0)) > 1e-6 * Math.max(1, value),
		);
		lastLoad = load;
		lastOffered = offered;
		if (round > 2 && change < 1e-7 && !loadMoved) break;
	}

	const components: Record<string, ComponentState> = {};
	let bottleneck: string | null = null;
	let busiest = BUSY_AT;
	for (const c of system.components) {
		const arriving = load.get(c.id) ?? 0;
		const capacity = capacityOf(c);
		const utilization = capacity === Infinity ? 0 : arriving / capacity;
		const down = input.down.has(c.id);
		const count = instances.get(c.id) ?? baseInstances(c);
		const demand = offered.get(c.id) ?? 0;
		components[c.id] = {
			load: arriving,
			demand,
			instances: count,
			capacity,
			utilization,
			failRate: down ? 1 : Math.max(0, failRate.get(c.id) ?? 0),
			latencyMs: latencyAt(c, utilization),
			status: down
				? 'down'
				: utilization >= 1
					? 'overloaded'
					: utilization >= BUSY_AT
						? 'busy'
						: arriving === 0
							? 'idle'
							: 'ok',
			autoscaled: count > baseInstances(c),
			breakerOpen:
				input.circuitBreakers &&
				!isCache(c) &&
				c.kind !== 'client' &&
				(down || (demand > 0 && 1 - capacity / demand > BREAKER_THRESHOLD)),
		};
		if (!down && c.kind !== 'client' && utilization >= busiest) {
			busiest = utilization;
			bottleneck = c.id;
		}
	}
	return { components, journeys, bottleneck };
}

/** Queueing delay: the closer to full, the longer requests wait (an M/M/1 queue). */
function latencyAt(c: Component, utilization: number) {
	if (utilization >= 1) return TIMEOUT_MS;
	return Math.min(TIMEOUT_MS, c.latencyMs / (1 - utilization));
}
