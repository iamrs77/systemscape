import { describe, expect, it } from 'vitest';
import { parseSystem } from '@/model/parseSystem';
import { defaultInput, simulate, TIMEOUT_MS, type SimInput } from './engine';

// A small system whose numbers are easy to check by hand:
// reads go through a cache (90% hits) to the database; orders write to the
// database, ask an optional ETA service, and hand work to a queue.
const system = parseSystem({
	id: 'test-shop',
	name: 'Test shop',
	tagline: 'For tests',
	basis: 'real',
	description: ['A tiny system for checking the simulation.'],
	components: [
		{
			id: 'app',
			name: 'App',
			kind: 'client',
			layer: 'clients',
			summary: 's',
			why: 'w',
			onFailure: 'f',
			scaling: 's',
		},
		{
			id: 'api',
			name: 'API',
			kind: 'gateway',
			layer: 'edge',
			summary: 's',
			why: 'w',
			onFailure: 'f',
			scaling: 's',
			capacityPerInstance: 10_000,
			instances: 1,
			latencyMs: 2,
		},
		{
			id: 'svc',
			name: 'Service',
			kind: 'service',
			layer: 'services',
			summary: 's',
			why: 'w',
			onFailure: 'f',
			scaling: 's',
			capacityPerInstance: 500,
			instances: 4,
			maxInstances: 40,
			latencyMs: 10,
		},
		{
			id: 'cache',
			name: 'Cache',
			kind: 'cache',
			layer: 'data',
			summary: 's',
			why: 'w',
			onFailure: 'f',
			scaling: 's',
			capacityPerInstance: 50_000,
			latencyMs: 1,
			hitRate: 0.9,
		},
		{
			id: 'db',
			name: 'Database',
			kind: 'database',
			layer: 'data',
			summary: 's',
			why: 'w',
			onFailure: 'f',
			scaling: 's',
			capacityPerInstance: 300,
			latencyMs: 20,
		},
		{
			id: 'eta',
			name: 'ETA',
			kind: 'service',
			layer: 'services',
			summary: 's',
			why: 'w',
			onFailure: 'f',
			scaling: 's',
			capacityPerInstance: 1_000,
			latencyMs: 30,
		},
		{
			id: 'queue',
			name: 'Queue',
			kind: 'queue',
			layer: 'async',
			summary: 's',
			why: 'w',
			onFailure: 'f',
			scaling: 's',
			capacityPerInstance: 100_000,
			latencyMs: 1,
		},
		{
			id: 'worker',
			name: 'Worker',
			kind: 'worker',
			layer: 'async',
			summary: 's',
			why: 'w',
			onFailure: 'f',
			scaling: 's',
			capacityPerInstance: 1_000,
			latencyMs: 50,
		},
	],
	journeys: [
		{
			id: 'read',
			name: 'Read',
			description: 'd',
			rps: 1_000,
			hops: [
				{ from: 'app', to: 'api', label: 'l' },
				{ from: 'api', to: 'svc', label: 'l' },
				{ from: 'svc', to: 'cache', label: 'l' },
				{ from: 'cache', to: 'db', label: 'l', onMiss: true },
			],
		},
		{
			id: 'order',
			name: 'Order',
			description: 'd',
			rps: 100,
			hops: [
				{ from: 'app', to: 'api', label: 'l' },
				{ from: 'api', to: 'svc', label: 'l' },
				{ from: 'svc', to: 'db', label: 'l', retries: 2 },
				{ from: 'svc', to: 'eta', label: 'l', optional: true },
				{ from: 'svc', to: 'queue', label: 'l', mode: 'async' },
				{ from: 'queue', to: 'worker', label: 'l', mode: 'async' },
			],
		},
	],
	presets: [{ id: 'normal', name: 'Normal', description: 'd', traffic: 1 }],
});

const run = (overrides: Partial<SimInput> = {}) =>
	simulate(system, { ...defaultInput, ...overrides });

describe('a normal day', () => {
	const result = run();

	it('sends cache misses on to the database', () => {
		// 10% of 1,000 reads miss, plus 100 orders
		expect(result.components.db!.load).toBeCloseTo(200, 5);
		expect(result.components.db!.utilization).toBeCloseTo(200 / 300, 5);
		expect(result.components.db!.status).toBe('ok');
	});

	it('succeeds for everyone, with queueing making busier parts slower', () => {
		expect(result.journeys.read!.success).toBeCloseTo(1, 5);
		expect(result.journeys.order!.success).toBeCloseTo(1, 5);
		// the database is two thirds busy, so its 20 ms becomes 60 ms
		expect(result.components.db!.latencyMs).toBeCloseTo(60, 5);
	});

	it("doesn't count async work in what the user waits for", () => {
		const withQueue = result.journeys.order!.latencyMs;
		const queueDown = run({ down: new Set(['worker']) }).journeys.order!.latencyMs;
		expect(queueDown).toBeCloseTo(withQueue, 5);
	});
});

describe('when the cache goes down', () => {
	const result = run({ down: new Set(['cache']) });

	it('treats every read as a miss, so the database gets all of them', () => {
		expect(result.components.cache!.status).toBe('down');
		expect(result.components.db!.status).toBe('overloaded');
		// reads still reach the database: a failing cache is a miss, not an error
		expect(result.components.db!.load).toBeGreaterThan(1_000);
	});

	it('fails most requests, because the database can only take 300 a second', () => {
		expect(result.journeys.read!.success).toBeLessThan(0.35);
		expect(result.bottleneck).toBe('db');
	});

	it('recovers when the database gets more instances', () => {
		const scaled = run({ down: new Set(['cache']), instances: { db: 6 } });
		expect(scaled.components.db!.status).not.toBe('overloaded');
		expect(scaled.journeys.read!.success).toBeCloseTo(1, 3);
	});
});

describe('retries and circuit breakers', () => {
	const overload = { down: new Set(['cache']) };

	it('retries add load to a struggling database (a retry storm)', () => {
		const withRetries = run({ ...overload, retries: true });
		const without = run({ ...overload, retries: false });
		expect(withRetries.components.db!.load).toBeGreaterThan(without.components.db!.load);
	});

	it('a breaker stops calls to a dead database, so requests fail fast instead of timing out', () => {
		const dbDown = { down: new Set(['db']) };
		const waiting = run({ ...dbDown, circuitBreakers: false });
		const breaker = run({ ...dbDown, circuitBreakers: true });

		expect(waiting.journeys.order!.success).toBeCloseTo(0, 5);
		expect(breaker.journeys.order!.success).toBeCloseTo(0, 5);
		expect(waiting.journeys.order!.latencyMs).toBeGreaterThan(TIMEOUT_MS);
		expect(breaker.journeys.order!.latencyMs).toBeLessThan(100);
		expect(breaker.components.db!.breakerOpen).toBe(true);
		expect(breaker.components.db!.load).toBeLessThan(waiting.components.db!.load / 10);
	});

	it('on an overloaded database, a breaker stops the retries and answers failures at once', () => {
		const overloaded = { down: new Set(['cache']) };
		const waiting = run({ ...overloaded, circuitBreakers: false });
		const breaker = run({ ...overloaded, circuitBreakers: true });

		expect(breaker.components.db!.breakerOpen).toBe(true);
		// calls still get through up to what the database can handle
		expect(breaker.journeys.read!.success).toBeGreaterThan(0.2);
		expect(breaker.journeys.read!.success).toBeGreaterThanOrEqual(
			waiting.journeys.read!.success,
		);
		expect(breaker.components.db!.load).toBeLessThan(waiting.components.db!.load);
		expect(breaker.journeys.order!.latencyMs).toBeLessThan(waiting.journeys.order!.latencyMs);
	});
});

describe('graceful degradation', () => {
	it('an optional step that fails leaves the request working, just degraded', () => {
		const result = run({ down: new Set(['eta']) });
		expect(result.journeys.order!.success).toBeCloseTo(1, 5);
		expect(result.journeys.order!.degraded).toBeCloseTo(1, 5);
	});

	it("background work can fail without the user noticing, but it's reported", () => {
		const result = run({ down: new Set(['worker']) });
		expect(result.journeys.order!.success).toBeCloseTo(1, 5);
		expect(result.journeys.order!.backgroundFailure).toBeCloseTo(1, 5);
	});
});

describe('scaling', () => {
	it('autoscaling adds service instances as traffic grows, but not database instances', () => {
		const result = run({ traffic: 4 });
		// 4,400 requests a second at 500 each, aiming for 70% busy
		expect(result.components.svc!.instances).toBe(Math.ceil(4_400 / 350));
		expect(result.components.svc!.autoscaled).toBe(true);
		expect(result.components.db!.instances).toBe(1);
		expect(result.components.db!.status).toBe('overloaded');
	});

	it("can't react to a sudden spike: only scaling ahead of time helps", () => {
		const sudden = run({ traffic: 4, sudden: true });
		expect(sudden.components.svc!.instances).toBe(4);
		expect(sudden.components.svc!.status).toBe('overloaded');

		const preScaled = run({ traffic: 4, sudden: true, instances: { svc: 13, db: 4 } });
		expect(preScaled.components.svc!.status).not.toBe('overloaded');
		expect(preScaled.journeys.read!.success).toBeCloseTo(1, 3);
	});

	it('picks a journey traffic multiplier on top of the overall one', () => {
		const result = run({ traffic: 2, journeyTraffic: { order: 3 } });
		expect(result.journeys.read!.rps).toBe(2_000);
		expect(result.journeys.order!.rps).toBe(600);
	});
});

it('gives the same answer for the same conditions', () => {
	const input = { traffic: 3, down: new Set(['cache']), circuitBreakers: true };
	expect(run(input)).toEqual(run(input));
});
