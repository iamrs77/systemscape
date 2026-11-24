import type { Component, ComponentKind } from '@/model/schema';
import { LOT_SIZE, type Vec2 } from './layout';

/**
 * The drawing maths for the isometric diagram: where a point lands on the
 * page, and the faces and outline of each block. The apps are at the top
 * and data at the bottom, so requests read down the page. Pure, so it's
 * tested without drawing anything.
 */

/**
 * The diagram is seen straight on, from above at an angle, so its rows lie
 * across the page and read from top to bottom. Each block is turned a
 * quarter of the way round, so it shows two sides, like an isometric drawing.
 */
const TURN = 0;
const ELEVATION = (38 * Math.PI) / 180;
const BLOCK_TURN = Math.PI / 4;
const COS = Math.cos(TURN);
const SIN = Math.sin(TURN);
/** From above at an angle, depth along the ground looks shorter, and so do heights. */
const SQUASH = Math.sin(ELEVATION);
const RISE = Math.cos(ELEVATION);

export type Pt = [number, number];

/** The ink every outline is drawn in. */
export const INK = '#1d2433';

/** Where a point lands on the page: x across, z towards the apps (up the page), y up. */
export function project(x: number, z: number, y = 0): Pt {
	return [x * COS + z * SIN, (x * SIN - z * COS) * SQUASH - y * RISE];
}

/** How near the viewer a point on the ground is: nearer things are drawn over farther ones. */
export function nearness(x: number, z: number) {
	return x * SIN - z * COS;
}

/**
 * Lays something drawn flat onto the ground: draw it with x across and
 * y = -z (towards the viewer), inside a group with this transform.
 */
export const GROUND = `matrix(${[COS, SIN * SQUASH, -SIN, COS * SQUASH, 0, 0].map((n) => n.toFixed(5)).join(' ')})`;

/** The same, also turned like the blocks are, for things drawn on a block's top. */
export const BLOCK_TOP = `${GROUND} rotate(${((BLOCK_TURN * 180) / Math.PI).toFixed(1)})`;

/** The same, centred on a point that's `height` above the ground. */
export function groundAt(x: number, z: number, height = 0, scale = 1) {
	const [px, py] = project(x, z, height);
	return `translate(${px.toFixed(3)} ${py.toFixed(3)}) ${GROUND} scale(${scale})`;
}

export const toPoints = (points: Pt[]) =>
	points.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ');

/** A block's outline on the ground, turned so it shows two sides. */
export function turned(contour: Vec2[]): Vec2[] {
	const [c, s] = [Math.cos(BLOCK_TURN), Math.sin(BLOCK_TURN)];
	return contour.map(([x, z]) => [x * c - z * s, x * s + z * c]);
}

/** A rectangle with rounded corners on the ground, centred on zero; a circle when r is half its size. */
export function roundedRect(width: number, depth: number, r: number, steps = 8): Vec2[] {
	const radius = Math.min(r, width / 2, depth / 2);
	const [w, d] = [width / 2 - radius, depth / 2 - radius];
	const corners: [number, number][] = [
		[w, d],
		[-w, d],
		[-w, -d],
		[w, -d],
	];
	const points: Vec2[] = [];
	corners.forEach(([cx, cz], corner) => {
		for (let i = 0; i <= steps; i++) {
			const angle = ((corner + i / steps) * Math.PI) / 2;
			points.push([cx + radius * Math.cos(angle), cz + radius * Math.sin(angle)]);
		}
	});
	// a circle's corners meet: drop the repeated points
	return points.filter((p, i) => {
		const q = points[(i + 1) % points.length]!;
		return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6;
	});
}

export type Face = {
	points: string;
	/** 0 faces left (towards the light), 1 faces right. */ shade: number;
};

export type Solid = {
	/** The sides you can see, each with how much it turns away from the light. */
	sides: Face[];
	top: string;
	/** The ink outline: the top's edge, the bottom edge you can see, and the two sides' edges. */
	outline: string;
	/** Where things on the top (an icon) are centred. */
	topCentre: Pt;
	/** The highest point on the page, for placing a label above. */
	peak: number;
};

/** A shape on the ground, raised from `base` to `base + height` at a point. */
export function extrude(contour: Vec2[], at: Vec2, base: number, height: number): Solid {
	const points = contour.map(([x, z]) => [x + at[0], z + at[1]] as Vec2);
	const n = points.length;
	const top = base + height;
	const facing: boolean[] = [];
	const sides: Face[] = [];
	for (let i = 0; i < n; i++) {
		const p = points[i]!;
		const q = points[(i + 1) % n]!;
		// the side's outward direction on the ground
		const [dx, dz] = [q[0] - p[0], q[1] - p[1]];
		const length = Math.hypot(dx, dz);
		let [nx, nz] = [dz / length, -dx / length];
		const [mx, mz] = [(p[0] + q[0]) / 2 - at[0], (p[1] + q[1]) / 2 - at[1]];
		if (nx * mx + nz * mz < 0) [nx, nz] = [-nx, -nz];
		const visible = nx * SIN - nz * COS > 1e-6;
		facing.push(visible);
		if (!visible) continue;
		const across = nx * COS + nz * SIN;
		sides.push({
			points: toPoints([
				project(p[0], p[1], base),
				project(q[0], q[1], base),
				project(q[0], q[1], top),
				project(p[0], p[1], top),
			]),
			shade: (across + 1) / 2,
		});
	}

	// the visible sides run on from one edge of the outline to the other
	const first = facing.findIndex((f, i) => f && !facing[(i - 1 + n) % n]);
	const run: Vec2[] = [];
	if (first >= 0) {
		for (let i = first; facing[i % n] && run.length <= n; i++) run.push(points[i % n]!);
		run.push(points[(first + run.length) % n]!);
	}
	const path = (list: Pt[], close = false) =>
		list.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(3)} ${y.toFixed(3)}`).join(' ') +
		(close ? ' Z' : '');
	const topRing = points.map(([x, z]) => project(x, z, top));
	const outline = [
		path(topRing, true),
		run.length > 1 ? path(run.map(([x, z]) => project(x, z, base))) : '',
		...[run[0], run.at(-1)]
			.filter((p): p is Vec2 => p !== undefined)
			.map(([x, z]) => path([project(x, z, base), project(x, z, top)])),
	].join(' ');

	return {
		sides,
		top: toPoints(topRing),
		outline,
		topCentre: project(at[0], at[1], top),
		peak: Math.min(...topRing.map((p) => p[1])),
	};
}

export type IconName =
	| 'server'
	| 'gateway'
	| 'worker'
	| 'database'
	| 'cache'
	| 'queue'
	| 'stream'
	| 'storage'
	| 'bell'
	| 'external'
	| 'cdn'
	| 'phone'
	| 'balancer';

export type Palette = { top: string; left: string; right: string };

/** A pastel per kind of part, so the same kind looks the same everywhere. */
export const kindPalette: Record<ComponentKind, Palette> = {
	client: { top: '#ece7fb', left: '#dcd3f7', right: '#c9bcf0' },
	cdn: { top: '#d5ecc6', left: '#c0e0ac', right: '#a8d192' },
	balancer: { top: '#cfe9f7', left: '#b3dbf1', right: '#97cbe9' },
	gateway: { top: '#c9ebe0', left: '#ade0d0', right: '#92cfbc' },
	service: { top: '#d3e2f8', left: '#bad1f1', right: '#a0bde6' },
	worker: { top: '#fadfc8', left: '#f3ccab', right: '#e9b88f' },
	cache: { top: '#d5ecc6', left: '#c0e0ac', right: '#a8d192' },
	database: { top: '#e0d6f6', left: '#cdc0ef', right: '#b8a9e4' },
	queue: { top: '#f8e8ad', left: '#f0da8e', right: '#e4ca71' },
	stream: { top: '#f8e8ad', left: '#f0da8e', right: '#e4ca71' },
	storage: { top: '#e0d6f6', left: '#cdc0ef', right: '#b8a9e4' },
	notifier: { top: '#cdeef0', left: '#b0e2e6', right: '#93d3d9' },
	external: { top: '#f6d3d9', left: '#eebcc5', right: '#e2a4b0' },
};

export const troublePalette = {
	overloaded: { top: '#f7c4b9', left: '#efab9c', right: '#e39382' },
	down: { top: '#e5e8ee', left: '#d7dbe3', right: '#c8cdd8' },
} satisfies Record<string, Palette>;

/** One block of a part: the part itself, or one disc of a database's stack. */
export type Piece = {
	type: 'block';
	contour: Vec2[];
	/** Where it stands, relative to the middle of its lot. */
	offset: Vec2;
	base: number;
	height: number;
	icon: IconName | null;
	iconSize: number;
	/** The radius of the white disc the icon sits on; 0 for none. */
	plate: number;
};

/**
 * What a part is drawn as: one soft, rounded block with its icon on a white
 * disc on top, like a toy. A database is a stack of discs, the usual symbol
 * for one; an app is a phone lying flat. How many copies a part runs shows
 * as a badge beside it, not as more blocks.
 */
export function piecesFor(component: Component): Piece[] {
	const block = (
		width: number,
		depth: number,
		height: number,
		round: number,
		icon: IconName | null,
		{ iconSize = 0.95, base = 0, plate = 0.6 } = {},
	): Piece => ({
		type: 'block',
		contour: turned(roundedRect(width, depth, round)),
		offset: [0, 0],
		base,
		height,
		icon,
		iconSize,
		plate: icon ? plate : 0,
	});

	switch (component.kind) {
		case 'client':
			return [block(1.5, 2.2, 0.4, 0.5, 'phone', { iconSize: 0.85, plate: 0.5 })];
		case 'service':
			return [block(2, 2, 0.95, 0.62, 'server')];
		case 'balancer':
			return [block(2.4, 1.7, 0.7, 0.6, 'balancer')];
		case 'gateway':
			return [block(2.2, 1.7, 0.95, 0.6, 'gateway')];
		case 'worker':
			return [block(2, 1.9, 0.9, 0.62, 'worker')];
		case 'database': {
			// three discs, one on another: the lines between them are the classic database symbol
			const disc = 0.36;
			return [0, 1, 2].map((i) =>
				block(1.9, 1.9, disc, 0.95, i === 2 ? 'database' : null, {
					base: i * disc,
					iconSize: 0.9,
					plate: 0.58,
				}),
			);
		}
		case 'cache':
			return [block(1.9, 1.9, 0.85, 0.62, 'cache')];
		case 'cdn':
			return [block(1.9, 1.9, 0.9, 0.95, 'cdn')];
		case 'queue':
			return [block(2.2, 1.5, 0.8, 0.5, 'queue', { plate: 0.55 })];
		case 'stream':
			return [block(2.4, 1.5, 0.8, 0.5, 'stream', { plate: 0.55 })];
		case 'storage':
			return [block(2, 1.8, 1.05, 0.5, 'storage')];
		case 'notifier':
			return [block(2, 1.9, 0.9, 0.62, 'bell')];
		case 'external':
			return [block(2.1, 1.9, 1.2, 0.58, 'external')];
	}
}

/**
 * The soft shadow a block casts on the ground, a little larger than it and
 * to the right, away from the light.
 */
export function shadowOf(contour: Vec2[], at: Vec2, grow: number): string {
	return toPoints(
		contour.map(([x, z]) => project(at[0] + 0.22 + x * grow, at[1] - 0.14 + z * grow)),
	);
}

/** The flat outline of a lot, for the ring round a selected part. */
export const LOT_RING = roundedRect(LOT_SIZE + 0.4, LOT_SIZE + 0.4, 0.6);

/** Breaks a name into lines of at most `max` characters, at spaces. */
export function wrap(text: string, max: number): string[] {
	const lines: string[] = [];
	for (const word of text.split(' ')) {
		const last = lines.at(-1);
		if (last !== undefined && last.length + 1 + word.length <= max)
			lines[lines.length - 1] = `${last} ${word}`;
		else lines.push(word);
	}
	return lines;
}
