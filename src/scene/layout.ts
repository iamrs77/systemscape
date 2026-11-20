import { layers, type Layer, type System } from '@/model/schema';
import type { SimResult } from '@/sim/engine';
import { SHAPE_SCALE, shapeHeight } from './sizes';

/**
 * Where everything goes in the scene. Layers are rows from front to back
 * (clients nearest the camera); within a row, components are placed near the
 * ones they talk to, so fewer connections cross. Pure, so it's tested without
 * a 3D canvas.
 */

export type Vec3 = [number, number, number];

export const ROW_GAP = 5.5;
export const COLUMN_GAP = 4.8;
/** Connections start and end this high, around the middle of a shape. */
const ANCHOR_HEIGHT = 0.7;

export type NodeLayout = { id: string; layer: Layer; position: Vec3 };

export type EdgeLayout = {
	/** "from>to" */
	key: string;
	from: string;
	to: string;
	/** async when every journey hands this off without waiting. */
	mode: 'sync' | 'async';
	start: Vec3;
	end: Vec3;
	/** The curve's control point: connections arc up, over what's between. */
	control: Vec3;
};

export type RowLayout = { layer: Layer; z: number; width: number };

export type SceneLayout = {
	nodes: Record<string, NodeLayout>;
	edges: EdgeLayout[];
	rows: RowLayout[];
	/** The size of the area everything sits in. */
	width: number;
	depth: number;
};

export const edgeKey = (from: string, to: string) => `${from}>${to}`;

export function layoutSystem(system: System): SceneLayout {
	const neighbours = new Map<string, Set<string>>();
	const link = (a: string, b: string) => {
		if (!neighbours.has(a)) neighbours.set(a, new Set());
		neighbours.get(a)!.add(b);
	};
	for (const journey of system.journeys) {
		for (const hop of journey.hops) {
			link(hop.from, hop.to);
			link(hop.to, hop.from);
		}
	}

	const used = layers.filter((layer) => system.components.some((c) => c.layer === layer));
	const x = new Map<string, number>();
	const nodes: Record<string, NodeLayout> = {};
	const rows: RowLayout[] = [];

	used.forEach((layer, row) => {
		const members = system.components.filter((c) => c.layer === layer);
		const slot = (i: number) => (i - (members.length - 1) / 2) * COLUMN_GAP;
		// order by the average position of neighbours already placed; components
		// without any keep the slot they're declared in
		const score = (id: string, declared: number) => {
			const placed = [...(neighbours.get(id) ?? [])].filter((n) => x.has(n));
			if (placed.length === 0) return slot(declared);
			return placed.reduce((sum, n) => sum + x.get(n)!, 0) / placed.length;
		};
		const ordered = members
			.map((c, i) => ({ c, score: score(c.id, i), i }))
			.sort((a, b) => a.score - b.score || a.i - b.i);

		const z = ((used.length - 1) / 2 - row) * ROW_GAP;
		ordered.forEach(({ c }, i) => {
			x.set(c.id, slot(i));
			nodes[c.id] = { id: c.id, layer, position: [slot(i), 0, z] };
		});
		rows.push({ layer, z, width: Math.max(1, members.length) * COLUMN_GAP });
	});

	const edges = new Map<string, EdgeLayout>();
	for (const journey of system.journeys) {
		for (const hop of journey.hops) {
			const key = edgeKey(hop.from, hop.to);
			const existing = edges.get(key);
			if (existing) {
				if (hop.mode === 'sync') existing.mode = 'sync';
				continue;
			}
			const a = nodes[hop.from]!.position;
			const b = nodes[hop.to]!.position;
			const start: Vec3 = [a[0], ANCHOR_HEIGHT, a[2]];
			const end: Vec3 = [b[0], ANCHOR_HEIGHT, b[2]];
			const distance = Math.hypot(b[0] - a[0], b[2] - a[2]);
			// connections within a row arc higher, to clear the shapes between
			const sameRow = a[2] === b[2];
			const lift = sameRow ? 1.6 + distance * 0.22 : 1 + distance * 0.16;
			edges.set(key, {
				key,
				from: hop.from,
				to: hop.to,
				mode: hop.mode,
				start,
				end,
				control: [(a[0] + b[0]) / 2, ANCHOR_HEIGHT + lift * 2, (a[2] + b[2]) / 2],
			});
		}
	}

	return {
		nodes,
		edges: [...edges.values()],
		rows,
		width: Math.max(...rows.map((r) => r.width)),
		depth: used.length * ROW_GAP,
	};
}

export type EdgeTraffic = {
	/** Calls per second, retries included. */
	sent: number;
	/** The share that fail. */
	failRate: number;
	breakerOpen: boolean;
	/** Part of the chosen journey (always true when showing every journey). */
	active: boolean;
};

/** Adds up the traffic on each connection, for one journey or all of them. */
export function edgeTraffic(
	system: System,
	result: SimResult,
	journeyId: string | null,
): Map<string, EdgeTraffic> {
	const traffic = new Map<string, EdgeTraffic>();
	for (const journey of system.journeys) {
		const state = result.journeys[journey.id];
		const active = journeyId === null || journeyId === journey.id;
		journey.hops.forEach((hop, i) => {
			const key = edgeKey(hop.from, hop.to);
			const edge = traffic.get(key) ?? {
				sent: 0,
				failRate: 0,
				breakerOpen: false,
				active: false,
			};
			const hopState = state?.hops[i];
			if (active && hopState) {
				const sent = edge.sent + hopState.sent;
				edge.failRate =
					sent > 0
						? (edge.failRate * edge.sent + hopState.failRate * hopState.sent) / sent
						: 0;
				edge.sent = sent;
				edge.breakerOpen ||= hopState.breakerOpen;
				edge.active = true;
			}
			traffic.set(key, edge);
		});
	}
	return traffic;
}

/** The components a journey touches. */
export function journeyComponents(system: System, journeyId: string): Set<string> {
	const journey = system.journeys.find((j) => j.id === journeyId);
	return new Set(journey?.hops.flatMap((h) => [h.from, h.to]) ?? []);
}

export type Anchor = {
	id: string;
	position: Vec3;
	/** Hidden when it would overlap a more important label. */
	declutter: boolean;
	/** The label ends at its point, instead of being centred on it. */
	alignEnd?: boolean;
};

export const rowId = (layer: string) => `row:${layer}`;

/**
 * Where each label goes: above each component (below it, seen from the top,
 * so it doesn't cover it), and at the start of each row.
 */
export function anchorsFor(system: System, layout: SceneLayout, fromTop: boolean): Anchor[] {
	return [
		...system.components.map((c) => {
			const [x, , z] = layout.nodes[c.id]!.position;
			const position: Vec3 = fromTop
				? [x, 0, z + 2]
				: [x, shapeHeight[c.kind] * SHAPE_SCALE + 0.45, z];
			return { id: c.id, position, declutter: true };
		}),
		...layout.rows.map((row) => ({
			id: rowId(row.layer),
			position: [-row.width / 2 - 0.9, 0, row.z] as Vec3,
			declutter: false,
			alignEnd: true,
		})),
	];
}

/**
 * Which labels matter most, first: when two would overlap, the earlier one
 * shows. What you're pointing at and what's in trouble come before the rest.
 */
export function labelPriority(
	system: System,
	result: SimResult,
	focus: { selected: string | null; hovered: string | null; inJourney: Set<string> | null },
): Map<string, number> {
	const rank = (id: string) => {
		if (id === focus.selected) return 0;
		if (id === focus.hovered) return 1;
		const status = result.components[id]?.status;
		if (status === 'down' || status === 'overloaded') return 2;
		if (status === 'busy') return 3;
		if (focus.inJourney === null || focus.inJourney.has(id)) return 4;
		return 5;
	};
	const ranked = system.components
		.map((c, i) => ({ id: c.id, rank: rank(c.id), i }))
		.sort((a, b) => a.rank - b.rank || a.i - b.i);
	return new Map(ranked.map((r, order) => [r.id, order]));
}
