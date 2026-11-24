import type { Component, Hop, System } from '@/model/schema';

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
	/** Parts that fail a share of calls at random, like a shaky connection: 0.05 for 1 in 20. */
	flaky?: Readonly<Record<string, number>>;
	/**
	 * Parts where every request takes this many times as long, like a copy
	 * with a failing disk: 10 for ten times. So it also gets through that
	 * much less.
	 */
	slow?: Readonly<Record<string, number>>;
	/** How each load balancer, by id, picks between copies. Round robin when not set. */
	balancing?: Readonly<Record<string, Balancing>>;
	/** Load balancers stop sending requests to copies that are down. On unless turned off. */
	healthChecks?: boolean;
	/**
	 * Parts that turn away what they can't take at once, with a quick “busy,
	 * try later”, instead of letting it wait for a timeout. They keep a short
	 * line, so what they take is answered in good time.
	 */
	shed?: readonly string[];
	/** Retries allowed, as a share of first tries: 0.1 lets through at most 10% more calls. */
	retryBudget?: number;
	/** Network links that are broken, both ways: the parts run, but can't reach each other. */
	cut?: readonly (readonly [string, string])[];
	/**
	 * Requests one copy of a part can have in progress at once, counting the
	 * time it waits for the parts it calls: its threads. Past that, it turns
	 * requests away.
	 */
	threads?: Readonly<Record<string, number>>;
	/** At most this many of each copy's threads may wait on one kind of call, by "from>to". */
	bulkheads?: Readonly<Record<string, number>>;
};

/** The rules a load balancer can pick a copy by. */
export const balancings = [
	'round-robin',
	'weighted',
	'least-connections',
	'least-time',
	'hash',
] as const;
export type Balancing = (typeof balancings)[number];

export const balancingName: Record<Balancing, string> = {
	'round-robin': 'Round robin',
	weighted: 'Weighted round robin',
	'least-connections': 'Least connections',
	'least-time': 'Least response time',
	hash: 'Hash of the address',
};

export const balancingRule: Record<Balancing, string> = {
	'round-robin': 'Takes turns: each copy gets the same share.',
	weighted: 'Takes turns, but a copy set to be twice as big gets twice as many.',
	'least-connections': 'Sends each request to the copy with the fewest still open.',
	'least-time': 'Sends each request to the copy answering fastest right now.',
	hash: 'The same address always goes to the same copy.',
};

/** `behind`: more work than it can do, but it all waits in a queue or stream, so nothing fails yet. */
export type Status = 'idle' | 'ok' | 'busy' | 'behind' | 'overloaded' | 'down';

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
	/**
	 * Requests a second it can't get to that wait in a queue in front of it,
	 * rather than failing: when only queues and streams hand it work.
	 */
	backlog: number;
	/** Requests in progress at once, counting those waiting on the parts it calls. */
	inFlight: number;
	/** Requests all its copies can have in progress at once, when that's limited (`threads`). */
	threads?: number;
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
/** A part that turns away what it can't take keeps itself about this busy, so its line stays short. */
export const SHED_AT = 0.9;
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
		failRate.set(c.id, input.down.has(c.id) ? 1 : (input.flaky?.[c.id] ?? 0));
		instances.set(c.id, baseInstances(c));
	}
	const slowness = (c: Component) => input.slow?.[c.id] ?? 1;
	// what it's set up to handle: what a load balancer's weights are based on
	const sizeOf = (c: Component) =>
		c.capacityPerInstance === undefined
			? Infinity
			: c.capacityPerInstance * (input.scale?.[c.id] ?? 1) * (instances.get(c.id) ?? 1);
	// what it gets through: less when it's slow
	const capacityOf = (c: Component) => sizeOf(c) / slowness(c);
	const latencyOf = (c: Component, utilization: number) =>
		latencyAt(c.latencyMs * slowness(c), utilization);
	const hitRateOf = (c: Component) => input.hitRate?.[c.id] ?? c.hitRate ?? 0;
	const sheds = (c: Component) => input.shed?.includes(c.id) ?? false;
	const cutLinks = new Set((input.cut ?? []).flatMap(([a, b]) => [`${a}>${b}`, `${b}>${a}`]));
	const isCut = (a: string, b: string) => cutLinks.has(`${a}>${b}`);
	/** Its own time for a request at this load: shedding keeps the line short. */
	const ownLatency = (c: Component, arriving: number) => {
		const busy = arriving / capacityOf(c);
		return latencyOf(c, sheds(c) ? Math.min(busy, SHED_AT) : busy);
	};
	const threadRoom = (c: Component) => {
		const threads = input.threads?.[c.id];
		return threads === undefined ? undefined : threads * (instances.get(c.id) ?? 1);
	};

	// the copies each load balancer picks between, in each journey
	const pickGroups = new Map<string, Map<string, Hop[]>>();
	for (const journey of system.journeys) {
		const groups = new Map<string, Hop[]>();
		for (const hop of journey.hops.filter((h) => h.pick)) {
			groups.set(hop.from, [...(groups.get(hop.from) ?? []), hop]);
		}
		if (groups.size > 0) pickGroups.set(journey.id, groups);
	}
	const groupKey = (from: string, group: Hop[]) => `${from}>${group.map((h) => h.to).join(',')}`;
	// requests a second into each group of copies, from every journey, last round
	let lastPicked = new Map<string, number>();
	/** Each copy's part of the requests a load balancer shares out. */
	const sharesFor = (from: string, group: Hop[], total: number) =>
		pickShares(
			input.balancing?.[from] ?? 'round-robin',
			group.map((hop) => {
				const copy = byId.get(hop.to)!;
				return {
					id: copy.id,
					hashed: hop.share,
					size: sizeOf(copy),
					capacity: capacityOf(copy),
					latencyMs: copy.latencyMs * slowness(copy),
					down: input.down.has(copy.id),
				};
			}),
			total,
			input.healthChecks ?? true,
		);

	let load = new Map<string, number>();
	let offered = new Map<string, number>();
	// the last round's totals: this round's are still being added up
	let lastLoad = new Map<string, number>();
	let lastOffered = new Map<string, number>();
	let journeys: Record<string, JourneyState> = {};
	// parts something calls directly, not only through a queue
	let called = new Set<string>();
	// requests each part has in progress waiting on the parts it calls, this round
	let held = new Map<string, number>();
	// threads waiting on each kind of call behind a bulkhead, as if it weren't there, last round
	let lastHeldOn = new Map<string, number>();

	// a journey that isn't running adds no load, so it's only worked out once,
	// in a last round after the others have settled
	let everyJourney = false;
	for (let round = 0; round < 201; round++) {
		load = new Map();
		// first attempts only, as if nothing failed: what circuit breakers judge by
		offered = new Map();
		called = new Set();
		held = new Map();
		// threads waiting on each kind of call behind a bulkhead, as if it weren't there
		const heldOn = new Map<string, number>();
		// requests a second into each group of copies, from every journey
		const picked = new Map<string, number>();
		journeys = {};
		const breakerOpen = (c: Component) => {
			if (!input.circuitBreakers || isCache(c) || c.kind === 'client') return false;
			if (input.down.has(c.id)) return true;
			const demand = lastOffered.get(c.id) ?? 0;
			return demand > 0 && 1 - capacityOf(c) / demand > BREAKER_THRESHOLD;
		};

		for (const journey of system.journeys) {
			const rps = journey.rps * input.traffic * (input.journeyTraffic?.[journey.id] ?? 1);
			if (rps === 0 && !everyJourney) continue;
			// the share of this journey's requests that got to each component
			const reach = new Map<string, number>([[journey.hops[0]!.from, 1]]);
			let failed = 0;
			let degraded = 0;
			let latencyMs = 0;
			let background = 0;
			let backgroundFailed = 0;
			const hops: HopState[] = [];
			// each load balancer's shares, worked out at its first copy
			const shares = new Map<string, Map<string, number>>();
			// calls made at the same time, waited on together, by name
			const together = new Map<
				string,
				{ from: string; need: number | undefined; calls: TogetherCall[] }
			>();

			for (const hop of journey.hops) {
				const from = byId.get(hop.from)!;
				const to = byId.get(hop.to)!;
				let share = hop.share;
				if (hop.pick) {
					let split = shares.get(hop.from);
					if (!split) {
						const group = pickGroups.get(journey.id)!.get(hop.from)!;
						const key = groupKey(hop.from, group);
						const own = (reach.get(hop.from) ?? 0) * rps;
						picked.set(key, (picked.get(key) ?? 0) + own);
						// the load balancer shares out everything it gets, from every journey
						split = sharesFor(hop.from, group, lastPicked.get(key) ?? own);
						shares.set(hop.from, split);
					}
					share = split.get(hop.to) ?? 0;
				}
				let perRequest = (reach.get(hop.from) ?? 0) * share;
				if (hop.onMiss) {
					// a cache that fails counts as a miss: the request carries on behind it
					perRequest *= 1 - hitRateOf(from) * (1 - (failRate.get(from.id) ?? 0));
				}
				const calls = perRequest * hop.calls;
				// a change every copy applies, like a write copied to each read copy
				const copies = hop.everyCopy ? (instances.get(to.id) ?? 1) : 1;
				offered.set(to.id, (offered.get(to.id) ?? 0) + calls * hop.work * rps * copies);

				// a broken link, or a part that's down: nothing gets through
				const cut = isCut(hop.from, hop.to);
				const unreachable = cut || input.down.has(to.id);
				const f = cut ? 1 : (failRate.get(to.id) ?? 0);
				const open =
					breakerOpen(to) ||
					(cut && input.circuitBreakers && !isCache(to) && to.kind !== 'client');
				const tries = input.retries ? hop.retries : 0;
				// a part that turns away what it can't take says so at once
				const shedding = sheds(to) && !unreachable;
				let sent: number;
				let callFail: number;
				// the share of failed calls tried again: all of them, unless a budget stops some
				let retried = 1;
				// a breaker answers failures at once instead of waiting for a timeout
				const failFast = open || shedding;
				if (open && unreachable) {
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
					let extra = 0;
					for (let k = 1; k <= tries; k++) extra += f ** k;
					// a retry budget lets through only so many retries, as a share of first tries
					if (input.retryBudget !== undefined && extra > input.retryBudget) {
						retried = input.retryBudget / extra;
					}
					sent = calls * (1 + retried * extra);
					callFail = f * (1 - retried + retried * f ** tries);
				}
				// a failed call waits for its timeout, once per try
				const timeout = isCache(to) ? CACHE_TIMEOUT_MS : TIMEOUT_MS;
				const waitOnFailure = failFast ? 0 : timeout * (1 + retried * tries);
				const busy = (lastLoad.get(to.id) ?? 0) / capacityOf(to);
				const toLatency = Math.min(
					TIMEOUT_MS,
					hop.work * latencyOf(to, shedding ? Math.min(busy, SHED_AT) : busy),
				);

				// a bulkhead: only so many of the caller's threads may wait on this call,
				// and the calls beyond that are refused at once
				let admitted = 1;
				const edge = `${hop.from}>${hop.to}`;
				const room = input.bulkheads?.[edge];
				if (room !== undefined && hop.mode !== 'async') {
					const each =
						(1 - callFail) * (toLatency + hop.travelMs) + callFail * waitOnFailure;
					heldOn.set(edge, (heldOn.get(edge) ?? 0) + (calls * rps * each) / 1000);
					const wanted = lastHeldOn.get(edge) ?? 0;
					const limit = room * (instances.get(from.id) ?? 1);
					if (wanted > limit) admitted = limit / wanted;
				}
				const failedCall = 1 - admitted * (1 - callFail);
				load.set(
					to.id,
					(load.get(to.id) ?? 0) + (cut ? 0 : sent * admitted) * hop.work * rps * copies,
				);

				// a queue keeps what its worker can't take yet, or can't take at all
				// while it's down: the work waits its turn, rather than failing
				const queued = from.kind === 'queue' || from.kind === 'stream';
				if (!queued && !cut && sent * admitted * rps > 0) called.add(to.id);
				const hopState: HopState = {
					sent: sent * admitted * rps,
					failRate: queued ? 0 : failedCall,
					breakerOpen: open,
					waitMs: 0,
				};
				hops.push(hopState);

				const continues = isCache(to) || hop.optional ? 1 : 1 - failedCall;
				reach.set(to.id, Math.min(1, (reach.get(to.id) ?? 0) + perRequest * continues));

				if (hop.mode === 'async') {
					// background work finishes only if every async step does
					background = Math.max(background, perRequest);
					backgroundFailed += perRequest * (queued ? 0 : failedCall);
					continue;
				}
				// an answer takes the part's time and the trip there and back; a refused
				// call fails at once, and any other failed call waits for its timeout
				const okMs = toLatency + hop.travelMs;
				const failMs =
					failedCall > 0 ? (admitted * callFail * waitOnFailure) / failedCall : 0;
				hopState.waitMs = perRequest * ((1 - failedCall) * okMs + failedCall * failMs);
				if (hop.together !== undefined) {
					// waited on with the calls made at the same time, below
					const group = together.get(hop.together) ?? {
						from: hop.from,
						need: hop.need,
						calls: [],
					};
					group.calls.push({
						perRequest,
						ok: 1 - failedCall,
						okMs,
						failMs,
						optional: hop.optional,
					});
					together.set(hop.together, group);
					continue;
				}
				latencyMs += hopState.waitMs;
				// the caller holds a thread while it waits
				held.set(from.id, (held.get(from.id) ?? 0) + (rps * hopState.waitMs) / 1000);
				if (isCache(to)) continue;
				if (hop.optional) degraded += perRequest * failedCall;
				else failed += perRequest * failedCall;
			}

			// calls made at the same time: the wait is for the slowest, or for the
			// first few that are needed, and the request fails if too few answer
			for (const group of together.values()) {
				const { ok, wait } = waitTogether(group.calls, group.need ?? group.calls.length);
				const perRequest = Math.max(...group.calls.map((c) => c.perRequest));
				latencyMs += perRequest * wait;
				held.set(
					group.from,
					(held.get(group.from) ?? 0) + (rps * perRequest * wait) / 1000,
				);
				if (group.calls.every((c) => c.optional)) degraded += perRequest * (1 - ok);
				else failed += perRequest * (1 - ok);
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
			const overload = arriving > capacity ? 1 - capacity / arriving : 0;
			// out of threads: more requests in progress at once than it has room for
			const room = threadRoom(c);
			const inFlight = (arriving * ownLatency(c, arriving)) / 1000 + (held.get(c.id) ?? 0);
			const outOfThreads = room !== undefined && inFlight > room ? 1 - room / inFlight : 0;
			// random failures, and on top of them the share turned away for being too busy
			const flaky = input.flaky?.[c.id] ?? 0;
			const target = input.down.has(c.id)
				? 1
				: 1 - (1 - flaky) * (1 - overload) * (1 - outOfThreads);
			const previous = failRate.get(c.id) ?? 0;
			// move halfway each round, so retries and failures settle instead of swinging
			const next = previous + (target - previous) / 2;
			change = Math.max(change, Math.abs(next - previous));
			failRate.set(c.id, next);
		}
		const loadMoved = [...load].some(
			([id, value]) => Math.abs(value - (lastLoad.get(id) ?? 0)) > 1e-6 * Math.max(1, value),
		);
		const pickMoved = [...picked].some(
			([key, value]) =>
				Math.abs(value - (lastPicked.get(key) ?? 0)) > 1e-6 * Math.max(1, value),
		);
		lastLoad = load;
		lastOffered = offered;
		lastPicked = picked;
		const heldMoved = [...heldOn].some(
			([key, value]) =>
				Math.abs(value - (lastHeldOn.get(key) ?? 0)) > 1e-6 * Math.max(1, value),
		);
		lastHeldOn = heldOn;
		if (pickMoved || heldMoved) change = Math.max(change, 1);
		if (everyJourney) break;
		if ((round > 2 && change < 1e-7 && !loadMoved) || round === 199) everyJourney = true;
	}

	const components: Record<string, ComponentState> = {};
	let bottleneck: string | null = null;
	let busiest = BUSY_AT;
	for (const c of system.components) {
		const arriving = load.get(c.id) ?? 0;
		const capacity = capacityOf(c);
		const cpu = capacity === Infinity ? 0 : arriving / capacity;
		const room = threadRoom(c);
		const inFlight = (arriving * ownLatency(c, arriving)) / 1000 + (held.get(c.id) ?? 0);
		// with its threads limited, being out of them is being full too
		const utilization = room === undefined ? cpu : Math.max(cpu, inFlight / room);
		const down = input.down.has(c.id);
		const count = instances.get(c.id) ?? baseInstances(c);
		const demand = offered.get(c.id) ?? 0;
		// more than it can do, all of it from queues: the rest waits its turn
		const waits = !down && arriving > capacity && !called.has(c.id);
		// down, with only queues handing it work: all of it waits for it to come back
		const waitsForIt = down && arriving > 0 && !called.has(c.id);
		components[c.id] = {
			load: arriving,
			demand,
			instances: count,
			capacity,
			utilization,
			failRate: down ? 1 : waits ? 0 : Math.max(0, failRate.get(c.id) ?? 0),
			backlog: waits ? arriving - capacity : waitsForIt ? arriving : 0,
			latencyMs: ownLatency(c, arriving),
			inFlight,
			threads: room,
			status: down
				? 'down'
				: waits
					? 'behind'
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

type TogetherCall = {
	/** The share of the journey's requests that make it. */
	perRequest: number;
	/** The chance it answers. */
	ok: number;
	/** Its wait when it answers, and when it doesn't. */
	okMs: number;
	failMs: number;
	optional: boolean;
};

/**
 * Calls made at the same time, and the first `need` answers waited for: how
 * often enough answer, and the average wait. Every mix of calls answering
 * and failing is weighed by how likely it is: the wait is the `need`-th
 * quickest answer or, when too few answer, the moment that's certain.
 */
export function waitTogether(calls: TogetherCall[], need: number) {
	let ok = 0;
	let wait = 0;
	const n = calls.length;
	for (let mask = 0; mask < 1 << n; mask++) {
		let chance = 1;
		const answered: number[] = [];
		const failedAt: number[] = [];
		calls.forEach((call, i) => {
			if (mask & (1 << i)) {
				chance *= call.ok;
				answered.push(call.okMs);
			} else {
				chance *= 1 - call.ok;
				failedAt.push(call.failMs);
			}
		});
		if (chance === 0) continue;
		if (answered.length >= need) {
			answered.sort((x, y) => x - y);
			ok += chance;
			wait += chance * answered[need - 1]!;
		} else {
			// it's failed once more have failed than can be spared
			failedAt.sort((x, y) => x - y);
			wait += chance * failedAt[n - need]!;
		}
	}
	return { ok, wait };
}

/** Queueing delay: the closer to full, the longer requests wait (an M/M/1 queue). */
function latencyAt(baseMs: number, utilization: number) {
	if (utilization >= 1) return TIMEOUT_MS;
	return Math.min(TIMEOUT_MS, baseMs / (1 - utilization));
}

type Copy = {
	id: string;
	/** Its share of the users, when they're shared by a hash of their address. */
	hashed: number;
	/** What it's set up to handle: the weight it's given. */
	size: number;
	/** What it actually gets through right now. */
	capacity: number;
	/** Its time for a request when it isn't busy. */
	latencyMs: number;
	down: boolean;
};

/**
 * How a load balancer shares `total` requests a second between copies, by
 * its rule. Where things settle: least connections leaves every copy with
 * the same number of requests open (each copy's requests a second times how
 * long each takes), and least response time leaves every copy it uses
 * answering in the same time, so a much slower copy gets none until the
 * others are busy enough to be as slow. Health checks leave out copies that
 * are down; a copy that's only slow still passes them.
 */
export function pickShares(
	rule: Balancing,
	copies: Copy[],
	total: number,
	healthChecks: boolean,
): Map<string, number> {
	const healthy = copies.filter((c) => !c.down);
	const using = healthChecks && healthy.length > 0 ? healthy : copies;
	const shares = new Map(copies.map((c) => [c.id, 0]));
	const split = (part: (c: Copy) => number) => {
		const sum = using.reduce((s, c) => s + part(c), 0);
		for (const c of using) shares.set(c.id, sum > 0 ? part(c) / sum : 1 / using.length);
		return shares;
	};
	if (rule === 'round-robin') return split(() => 1);
	// a copy that's left out hands its users to the others
	if (rule === 'hash') return split((c) => c.hashed);
	if (rule === 'weighted') return split((c) => c.size);
	// past what they can all do, every copy is full: it's shared by what each gets through
	const room = using.reduce((s, c) => s + c.capacity, 0);
	if (total <= 0 || total >= room) return split((c) => c.capacity);

	// requests a second each copy takes, at a level of the measure being evened out
	const at =
		rule === 'least-connections'
			? // k requests open: rate × time = k, with time = base ÷ (1 − rate ÷ capacity)
				(k: number) => (c: Copy) => {
					const base = Math.max(c.latencyMs, 0.1) / 1000;
					return (k * c.capacity) / (base * c.capacity + k);
				}
			: // answering in t ms: none until t is above its time when idle
				(t: number) => (c: Copy) =>
					t > c.latencyMs ? c.capacity * (1 - c.latencyMs / t) : 0;
	const taken = (level: number) => using.reduce((s, c) => s + at(level)(c), 0);
	let low = 0;
	let high = 1;
	for (let i = 0; i < 200 && taken(high) < total; i++) high *= 2;
	for (let i = 0; i < 100; i++) {
		const mid = (low + high) / 2;
		if (taken(mid) < total) low = mid;
		else high = mid;
	}
	return split(at(high));
}
