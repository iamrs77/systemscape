import { describe, expect, it } from 'vitest';
import { parseSystem } from '@/model/parseSystem';
import { rideHailing } from '@/systems/rideHailing';
import { extrude, piecesFor, project, roundedRect, turned, wrap } from './geometry';

const system = parseSystem(rideHailing);
const part = (id: string) => system.components.find((c) => c.id === id)!;

describe('the drawing', () => {
	it('puts the apps above the data, so requests read down the page', () => {
		const apps = project(0, 5)[1];
		const data = project(0, -5)[1];
		expect(apps).toBeLessThan(data);
		// and higher things are higher on the page
		expect(project(0, 0, 1)[1]).toBeLessThan(project(0, 0, 0)[1]);
	});

	it('shows the two sides of a block that face the viewer, one in light and one in shade', () => {
		const block = extrude(turned(roundedRect(1, 1, 0)), [0, 0], 0, 1);
		expect(block.sides).toHaveLength(2);
		const shades = block.sides.map((s) => s.shade).sort();
		expect(shades[0]).toBeLessThan(0.5);
		expect(shades[1]).toBeGreaterThan(0.5);
		// the outline closes round the top
		expect(block.outline).toContain('Z');
	});

	it('shows the front half of a cylinder', () => {
		const circle = roundedRect(1, 1, 0.5);
		const cylinder = extrude(circle, [0, 0], 0, 1);
		expect(cylinder.sides.length).toBeGreaterThan(circle.length * 0.4);
		expect(cylinder.sides.length).toBeLessThan(circle.length * 0.6);
	});

	it('draws each part as one block, with the icon for its kind', () => {
		for (const component of system.components) {
			const pieces = piecesFor(component);
			expect(pieces, component.id).toHaveLength(1);
			expect(pieces[0]!.icon, component.id).not.toBeNull();
		}
		expect(piecesFor(part('load-balancer'))[0]!.icon).toBe('balancer');
		expect(piecesFor(part('rider-app'))[0]!.icon).toBe('phone');
		// a database is a cylinder: round all the way along its outline
		const cylinder = extrude(piecesFor(part('trip-db'))[0]!.contour, [0, 0], 0, 1);
		expect(cylinder.sides.length).toBeGreaterThan(8);
	});

	it('wraps long names, so labels side by side don’t run into each other', () => {
		expect(wrap('Driver location index', 14)).toEqual(['Driver', 'location index']);
		expect(wrap('Dispatch', 14)).toEqual(['Dispatch']);
		expect(wrap('Real-time gateway', 14)).toEqual(['Real-time', 'gateway']);
	});
});
