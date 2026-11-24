import { layers, type Layer, type System } from '@/model/schema';
import type { SimResult, Status } from '@/sim/engine';

/**
 * The diagram's plan. Each layer is a row of lots, from the apps to outside
 * providers, with a gap where our system ends and theirs begin. All rows share
 * one grid of columns, so every connection runs along the gaps between rows
 * and columns, in straight lines and right angles, never through a part.
 * Pure, so it's tested without drawing anything.
 */

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

/** A lot, and the street or avenue beside it. */
export const COLUMN_GAP = 5;
export const ROW_GAP = 7.4;
export const LOT_SIZE = 3.7;
/** The extra gap before outside providers: where our system ends. */
export const BOUNDARY_GAP = 3;
/** Traffic keeps to its own side of the road. */
export const LANE_OFFSET = 0.28;

export type NodeLayout = { id: string; layer: Layer; column: number; position: Vec3 };

export type EdgeLayout = {
	/** "from>to" */
	key: string;
	from: string;
	to: string;
	/** async when every journey hands this off without waiting. */
	mode: 'sync' | 'async';
	/** The road's centre line, on the ground: straight segments, right-angle turns. */
	road: Vec2[];
	/** The lane traffic drives in, kept to one side of the road. */
	lane: Vec2[];
};

export type RowLayout = { layer: Layer; z: number; left: number; right: number };

export type SystemLayout = {
	nodes: Record<string, NodeLayout>;
	edges: EdgeLayout[];
	rows: RowLayout[];
	/** Where our system ends and outside providers begin, when there are any. */
	boundary: { z: number } | null;
	/** The ground the diagram stands on. */
	bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
};

export const edgeKey = (from: string, to: string) => `${from}>${to}`;

export function layoutSystem(system: System): SystemLayout {
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
	const columns = Math.max(
		...used.map((l) => system.components.filter((c) => c.layer === l).length),
	);
	const columnX = (column: number) => (column - (columns - 1) / 2) * COLUMN_GAP;

	// rows from the front, with a wider gap before outside providers
	const rowZ: number[] = [];
	let z = 0;
	used.forEach((layer, i) => {
		if (i > 0) z -= ROW_GAP + (layer === 'external' ? BOUNDARY_GAP : 0);
		rowZ.push(z);
	});
	const middle = (rowZ[0]! + rowZ.at(-1)!) / 2;
	const centred = rowZ.map((value) => value - middle);

	const x = new Map<string, number>();
	const nodes: Record<string, NodeLayout> = {};
	const rows: RowLayout[] = [];
	used.forEach((layer, row) => {
		const members = system.components.filter((c) => c.layer === layer);
		// each wants to sit near what it connects to (the average position of
		// neighbours already placed); without any, it keeps its declared order
		const wanted = (id: string, declared: number) => {
			const placed = [...(neighbours.get(id) ?? [])].filter((n) => x.has(n));
			const free = columnX(declared + (columns - members.length) / 2);
			if (placed.length === 0) return free;
			return placed.reduce((sum, n) => sum + x.get(n)!, 0) / placed.length;
		};
		const ordered = members
			.map((c, i) => ({ c, wanted: wanted(c.id, i), i }))
			.sort((a, b) => a.wanted - b.wanted || a.i - b.i);
		// then the run of columns closest to where they want to be
		const average = ordered.reduce((sum, o) => sum + o.wanted, 0) / ordered.length;
		const ideal = Math.round(
			average / COLUMN_GAP + (columns - 1) / 2 - (members.length - 1) / 2,
		);
		const first = Math.min(columns - members.length, Math.max(0, ideal));

		ordered.forEach(({ c }, i) => {
			const column = first + i;
			x.set(c.id, columnX(column));
			nodes[c.id] = {
				id: c.id,
				layer,
				column,
				position: [columnX(column), 0, centred[row]!],
			};
		});
		rows.push({
			layer,
			z: centred[row]!,
			left: columnX(first) - LOT_SIZE / 2,
			right: columnX(first + members.length - 1) + LOT_SIZE / 2,
		});
	});

	const rowOf = new Map(used.map((layer, i) => [layer, i]));
	const avenues = Array.from({ length: columns + 1 }, (_, i) => columnX(i) - COLUMN_GAP / 2);

	const edges = new Map<string, EdgeLayout>();
	for (const journey of system.journeys) {
		for (const hop of journey.hops) {
			const key = edgeKey(hop.from, hop.to);
			const existing = edges.get(key);
			if (existing) {
				if (hop.mode === 'sync') existing.mode = 'sync';
				continue;
			}
			const a = nodes[hop.from]!;
			const b = nodes[hop.to]!;
			const road = route(a, b, rowOf.get(a.layer)!, rowOf.get(b.layer)!, avenues);
			edges.set(key, {
				key,
				from: hop.from,
				to: hop.to,
				mode: hop.mode,
				road,
				lane: keepRight(road),
			});
		}
	}

	const margin = 1.2;
	return {
		nodes,
		edges: [...edges.values()],
		rows,
		boundary: used.includes('external') ? { z: (centred.at(-1)! + centred.at(-2)!) / 2 } : null,
		bounds: {
			minX: columnX(0) - COLUMN_GAP / 2 - margin,
			maxX: columnX(columns - 1) + COLUMN_GAP / 2 + margin,
			minZ: centred.at(-1)! - ROW_GAP / 2 - margin / 2,
			maxZ: centred[0]! + ROW_GAP / 2 + margin / 2,
		},
	};
}

/**
 * A route from one lot to another along the streets: out of the lot's side
 * facing the destination, along the street, up an avenue if it's more than one
 * row away, and in.
 */
function route(
	a: NodeLayout,
	b: NodeLayout,
	rowA: number,
	rowB: number,
	avenues: number[],
): Vec2[] {
	const [xa, , za] = a.position;
	const [xb, , zb] = b.position;
	const edge = LOT_SIZE / 2;

	if (rowA === rowB) {
		// along the street below the row, away from the names above it
		const street = za - ROW_GAP / 2;
		return tidy([
			[xa, za - edge],
			[xa, street],
			[xb, street],
			[xb, zb - edge],
		]);
	}

	// towards the back is towards -z
	const towards = Math.sign(zb - za);
	const streetA = za + (towards * ROW_GAP) / 2;
	const streetB = zb - (towards * ROW_GAP) / 2;
	const start: Vec2 = [xa, za + towards * edge];
	const end: Vec2 = [xb, zb - towards * edge];

	if (Math.abs(rowA - rowB) === 1 && Math.abs(streetA - streetB) < 1e-9) {
		return tidy([start, [xa, streetA], [xb, streetA], end]);
	}
	// up the avenue nearest the middle, between the two if there is one
	const mid = (xa + xb) / 2;
	const avenue = [...avenues].sort((p, q) => Math.abs(p - mid) - Math.abs(q - mid))[0]!;
	return tidy([start, [xa, streetA], [avenue, streetA], [avenue, streetB], [xb, streetB], end]);
}

/** Drops repeated points and points in the middle of a straight line. */
function tidy(points: Vec2[]): Vec2[] {
	const same = (p: Vec2, q: Vec2) => Math.abs(p[0] - q[0]) < 1e-9 && Math.abs(p[1] - q[1]) < 1e-9;
	const unique = points.filter((p, i) => i === 0 || !same(p, points[i - 1]!));
	return unique.filter((p, i) => {
		if (i === 0 || i === unique.length - 1) return true;
		const prev = unique[i - 1]!;
		const next = unique[i + 1]!;
		const straight =
			(Math.abs(prev[0] - p[0]) < 1e-9 && Math.abs(p[0] - next[0]) < 1e-9) ||
			(Math.abs(prev[1] - p[1]) < 1e-9 && Math.abs(p[1] - next[1]) < 1e-9);
		return !straight;
	});
}

/** The same route shifted to one side, so traffic each way has its own lane. */
function keepRight(road: Vec2[]): Vec2[] {
	const normal = (p: Vec2, q: Vec2): Vec2 => {
		const dx = Math.sign(q[0] - p[0]);
		const dz = Math.sign(q[1] - p[1]);
		return [-dz * LANE_OFFSET, dx * LANE_OFFSET];
	};
	return road.map((p, i) => {
		const before: Vec2 = i > 0 ? normal(road[i - 1]!, p) : [0, 0];
		const after: Vec2 = i < road.length - 1 ? normal(p, road[i + 1]!) : [0, 0];
		// at a corner, shift by both segments' sides
		return [p[0] + before[0] + after[0], p[1] + before[1] + after[1]] as Vec2;
	});
}

/** The length of a route, and the point a given distance along it. */
export function pathLength(points: Vec2[]) {
	let length = 0;
	for (let i = 1; i < points.length; i++) {
		length += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]);
	}
	return length;
}

export function pointAlong(points: Vec2[], distance: number): Vec2 {
	let left = distance;
	for (let i = 1; i < points.length; i++) {
		const p = points[i - 1]!;
		const q = points[i]!;
		const length = Math.hypot(q[0] - p[0], q[1] - p[1]);
		if (left <= length || i === points.length - 1) {
			const t = length === 0 ? 0 : Math.min(1, left / length);
			return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
		}
		left -= length;
	}
	return points[0]!;
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

/**
 * The system with only some of its parts, and the calls between them, so a
 * small picture is laid out on its own rather than among faint parts it
 * doesn't use. Given the journeys to draw, the others are left out too, so a
 * design that's switched off can't change how a call looks (waited for, or
 * not). The same system comes back when nothing is left out.
 */
export function withOnly(
	system: System,
	keep: ReadonlySet<string>,
	journeys?: ReadonlySet<string>,
): System {
	if (!journeys && system.components.every((c) => keep.has(c.id))) return system;
	return {
		...system,
		components: system.components.filter((c) => keep.has(c.id)),
		journeys: system.journeys
			.filter((j) => !journeys || journeys.has(j.id))
			.map((j) => ({ ...j, hops: j.hops.filter((h) => keep.has(h.from) && keep.has(h.to)) }))
			.filter((j) => j.hops.length > 0),
	};
}

/** A result to go with `withOnly`: each journey's steps, the same ones left out. */
export function resultWithOnly(
	system: System,
	result: SimResult,
	keep: ReadonlySet<string>,
): SimResult {
	if (system.components.every((c) => keep.has(c.id))) return result;
	const journeys: SimResult['journeys'] = {};
	for (const journey of system.journeys) {
		const state = result.journeys[journey.id];
		if (!state) continue;
		journeys[journey.id] = {
			...state,
			hops: state.hops.filter((_, i) => {
				const hop = journey.hops[i]!;
				return keep.has(hop.from) && keep.has(hop.to);
			}),
		};
	}
	return { ...result, journeys };
}

/** The journeys that are running: the designs a course keeps switched off aren't. */
export function runningJourneys(system: System, result: SimResult): string[] {
	return system.journeys.filter((j) => (result.journeys[j.id]?.rps ?? 0) > 0).map((j) => j.id);
}

/** The parts the journeys that are running touch. */
export function runningParts(system: System, result: SimResult): Set<string> {
	const running = new Set(runningJourneys(system, result));
	return new Set(
		system.journeys
			.filter((j) => running.has(j.id))
			.flatMap((j) => j.hops.flatMap((h) => [h.from, h.to])),
	);
}

/** The components a journey touches. */
export function journeyComponents(system: System, journeyId: string): Set<string> {
	const journey = system.journeys.find((j) => j.id === journeyId);
	return new Set(journey?.hops.flatMap((h) => [h.from, h.to]) ?? []);
}

/** Overloaded or down: it stands out even when it isn't part of the followed journey. */
export function inTrouble(status: Status) {
	return status === 'overloaded' || status === 'down';
}
