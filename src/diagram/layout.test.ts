import { describe, expect, it } from 'vitest';
import { parseSystem } from '@/model/parseSystem';
import { defaultInput, simulate } from '@/sim/engine';
import { rideHailing } from '@/systems/rideHailing';
import {
	COLUMN_GAP,
	edgeKey,
	edgeTraffic,
	inTrouble,
	journeyComponents,
	layoutSystem,
	LOT_SIZE,
	pathLength,
	pointAlong,
	type Vec2,
} from './layout';

const system = parseSystem(rideHailing);
const layout = layoutSystem(system);
const result = simulate(system, defaultInput);

describe('laying out a system', () => {
	it('places every component, each in its own spot', () => {
		const spots = system.components.map((c) => layout.nodes[c.id]!.position.join(','));
		expect(new Set(spots).size).toBe(system.components.length);
	});

	it('puts the apps at the front and outside providers at the back', () => {
		const z = (id: string) => layout.nodes[id]!.position[2];
		expect(z('rider-app')).toBeGreaterThan(z('load-balancer'));
		expect(z('load-balancer')).toBeGreaterThan(z('api-gateway'));
		expect(z('api-gateway')).toBeGreaterThan(z('dispatch-service'));
		expect(z('trip-db')).toBeGreaterThan(z('payment-provider'));
		expect(layout.rows.map((r) => r.layer)).toEqual([
			'clients',
			'balancing',
			'edge',
			'services',
			'async',
			'data',
			'external',
		]);
	});

	it('lines every row up on one grid of columns, so avenues run between them', () => {
		const columnXs = new Set(Object.values(layout.nodes).map((n) => n.position[0]));
		for (const x of columnXs) {
			expect((((x / COLUMN_GAP + 0.5) % 1) + 1) % 1).toBeCloseTo(0, 5);
		}
	});

	it('marks where our system ends, before the outside providers', () => {
		const z = (id: string) => layout.nodes[id]!.position[2];
		expect(layout.boundary).not.toBeNull();
		expect(layout.boundary!.z).toBeLessThan(z('trip-db'));
		expect(layout.boundary!.z).toBeGreaterThan(z('payment-provider'));
	});

	it('draws one connection per pair, even when several journeys use it', () => {
		const keys = layout.edges.map((e) => e.key);
		expect(new Set(keys).size).toBe(keys.length);
		expect(keys).toContain(edgeKey('rider-app', 'load-balancer'));
		expect(keys).toContain(edgeKey('load-balancer', 'api-gateway'));
		expect(
			layout.edges.find((e) => e.key === edgeKey('event-stream', 'surge-worker'))!.mode,
		).toBe('async');
	});

	it('routes every connection along streets: straight lines and right angles', () => {
		for (const edge of layout.edges) {
			for (let i = 1; i < edge.road.length; i++) {
				const [p, q] = [edge.road[i - 1]!, edge.road[i]!];
				const straight = Math.abs(p[0] - q[0]) < 1e-9 || Math.abs(p[1] - q[1]) < 1e-9;
				expect(straight, edge.key).toBe(true);
			}
		}
	});

	it('starts and ends each route at the edge of its two lots', () => {
		for (const edge of layout.edges) {
			const touches = (id: string, [x, z]: Vec2) => {
				const [lx, , lz] = layout.nodes[id]!.position;
				return (
					Math.abs(x - lx) <= LOT_SIZE / 2 + 1e-9 &&
					Math.abs(Math.abs(z - lz) - LOT_SIZE / 2) < 1e-9
				);
			};
			expect(touches(edge.from, edge.road[0]!), edge.key).toBe(true);
			expect(touches(edge.to, edge.road.at(-1)!), edge.key).toBe(true);
		}
	});

	it('never drives through another building’s lot', () => {
		for (const edge of layout.edges) {
			const others = Object.values(layout.nodes).filter(
				(n) => n.id !== edge.from && n.id !== edge.to,
			);
			// check points every 0.1 along the route
			const length = pathLength(edge.road);
			for (let d = 0; d <= length; d += 0.1) {
				const [x, z] = pointAlong(edge.road, d);
				for (const lot of others) {
					const inside =
						Math.abs(x - lot.position[0]) < LOT_SIZE / 2 &&
						Math.abs(z - lot.position[2]) < LOT_SIZE / 2;
					expect(inside, `${edge.key} crosses ${lot.id}`).toBe(false);
				}
			}
		}
	});

	it('keeps traffic each way in its own lane', () => {
		const there = layout.edges.find(
			(e) => e.key === edgeKey('dispatch-service', 'trip-service'),
		)!;
		expect(there.lane.length).toBe(there.road.length);
		const [road, lane] = [there.road[1]!, there.lane[1]!];
		expect(Math.hypot(road[0] - lane[0], road[1] - lane[1])).toBeGreaterThan(0.2);
	});
});

describe('walking along a route', () => {
	it('measures it and finds points along it', () => {
		const route: Vec2[] = [
			[0, 0],
			[0, 3],
			[4, 3],
		];
		expect(pathLength(route)).toBe(7);
		expect(pointAlong(route, 1)).toEqual([0, 1]);
		expect(pointAlong(route, 5)).toEqual([2, 3]);
		expect(pointAlong(route, 99)).toEqual([4, 3]);
	});
});

describe('traffic on connections', () => {
	it('adds up every journey using a connection', () => {
		const all = edgeTraffic(system, result, null);
		const toGateway = all.get(edgeKey('load-balancer', 'api-gateway'))!;
		// seeing the price, asking for a ride and ending a trip all go this way
		expect(toGateway.sent).toBeCloseTo(1_500 + 250 + 250, 5);
		expect(toGateway.active).toBe(true);
	});

	it('shows only the followed journey', () => {
		const one = edgeTraffic(system, result, 'request-ride');
		expect(one.get(edgeKey('load-balancer', 'api-gateway'))!.sent).toBeCloseTo(250, 5);
		expect(one.get(edgeKey('load-balancer', 'realtime-gateway'))!.active).toBe(false);
	});

	it('lists the components a journey touches', () => {
		const touched = journeyComponents(system, 'end-trip');
		expect(touched).toContain('payment-provider');
		expect(touched).not.toContain('geo-index');
	});
});

describe('trouble', () => {
	it('is a part that’s overloaded or down, not one that’s only busy', () => {
		expect(inTrouble('overloaded')).toBe(true);
		expect(inTrouble('down')).toBe(true);
		expect(inTrouble('busy')).toBe(false);
		expect(inTrouble('ok')).toBe(false);
	});
});
