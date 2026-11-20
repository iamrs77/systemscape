import { describe, expect, it } from 'vitest';
import { parseSystem } from '@/model/parseSystem';
import { defaultInput, simulate } from '@/sim/engine';
import { rideHailing } from '@/systems/rideHailing';
import {
	anchorsFor,
	edgeKey,
	edgeTraffic,
	journeyComponents,
	labelPriority,
	layoutSystem,
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
		expect(z('rider-app')).toBeGreaterThan(z('api-gateway'));
		expect(z('api-gateway')).toBeGreaterThan(z('dispatch-service'));
		expect(z('trip-db')).toBeGreaterThan(z('payment-provider'));
		expect(layout.rows.map((r) => r.layer)).toEqual([
			'clients',
			'edge',
			'services',
			'async',
			'data',
			'external',
		]);
	});

	it('centres each row', () => {
		for (const row of layout.rows) {
			const xs = Object.values(layout.nodes)
				.filter((n) => n.layer === row.layer)
				.map((n) => n.position[0]);
			expect(xs.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 5);
		}
	});

	it('draws one connection per pair, even when several journeys use it', () => {
		const keys = layout.edges.map((e) => e.key);
		expect(new Set(keys).size).toBe(keys.length);
		expect(keys).toContain(edgeKey('rider-app', 'api-gateway'));
		expect(
			layout.edges.find((e) => e.key === edgeKey('event-stream', 'surge-worker'))!.mode,
		).toBe('async');
	});

	it('arcs connections up, over what’s between', () => {
		for (const edge of layout.edges) {
			expect(edge.control[1]).toBeGreaterThan(Math.max(edge.start[1], edge.end[1]));
		}
	});
});

describe('traffic on connections', () => {
	it('adds up every journey using a connection', () => {
		const all = edgeTraffic(system, result, null);
		const fromRider = all.get(edgeKey('rider-app', 'api-gateway'))!;
		// seeing the price and asking for a ride both go this way
		expect(fromRider.sent).toBeCloseTo(1_500 + 250, 5);
		expect(fromRider.active).toBe(true);
	});

	it('shows only the followed journey', () => {
		const one = edgeTraffic(system, result, 'request-ride');
		expect(one.get(edgeKey('rider-app', 'api-gateway'))!.sent).toBeCloseTo(250, 5);
		expect(one.get(edgeKey('driver-app', 'realtime-gateway'))!.active).toBe(false);
	});

	it('lists the components a journey touches', () => {
		const touched = journeyComponents(system, 'end-trip');
		expect(touched).toContain('payment-provider');
		expect(touched).not.toContain('geo-index');
	});
});

describe('labels', () => {
	it('puts labels above shapes, or below them from the top', () => {
		const above = anchorsFor(system, layout, false).find((a) => a.id === 'trip-db')!;
		const below = anchorsFor(system, layout, true).find((a) => a.id === 'trip-db')!;
		const node = layout.nodes['trip-db']!.position;
		expect(above.position[1]).toBeGreaterThan(1);
		expect(below.position[2]).toBeGreaterThan(node[2]);
	});

	it('gives way to what’s selected, then to what’s in trouble', () => {
		const broken = simulate(system, { ...defaultInput, down: new Set(['eta-service']) });
		const priority = labelPriority(system, broken, {
			selected: 'trip-db',
			hovered: null,
			inJourney: null,
		});
		const order = [...priority.entries()].sort((a, b) => a[1] - b[1]).map(([id]) => id);
		expect(order[0]).toBe('trip-db');
		expect(order[1]).toBe('eta-service');
	});
});
