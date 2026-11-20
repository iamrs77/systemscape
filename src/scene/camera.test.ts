import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { parseSystem } from '@/model/parseSystem';
import { rideHailing } from '@/systems/rideHailing';
import { fitCamera } from './camera';
import { layoutSystem } from './layout';

const layout = layoutSystem(parseSystem(rideHailing));

/** Where every component lands on screen, from -1 to 1 across and up. */
function onScreen(view: '3d' | 'top', aspect: number, compact = false) {
	const camera = new PerspectiveCamera(32, aspect, 0.1, 1000);
	camera.position.copy(fitCamera(layout, view, 32, aspect, compact));
	camera.lookAt(0, 0, 0);
	camera.updateMatrixWorld();
	return Object.values(layout.nodes).map((n) => new Vector3(...n.position).project(camera));
}

describe('fitCamera', () => {
	it.each([
		['a wide screen', 1.6, false],
		['a square one', 1, false],
		['a phone', 0.55, true],
	])('fits %s, filling it without cutting anything off', (_, aspect, compact) => {
		for (const view of ['3d', 'top'] as const) {
			const points = onScreen(view, aspect, compact);
			for (const p of points) {
				expect(Math.abs(p.x)).toBeLessThan(0.95);
				expect(Math.abs(p.y)).toBeLessThan(0.9);
			}
			const xs = points.map((p) => p.x);
			const ys = points.map((p) => p.y);
			const width = Math.max(...xs) - Math.min(...xs);
			const height = Math.max(...ys) - Math.min(...ys);
			// the layout fills the screen in at least one direction
			expect(Math.max(width, height)).toBeGreaterThan(1.1);
		}
	});
});
