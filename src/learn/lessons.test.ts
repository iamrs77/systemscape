import { describe, expect, it } from 'vitest';
import { edgeKey, layoutSystem } from '@/diagram/layout';
import { parseSystem } from '@/model/parseSystem';
import type { ComponentKind, Layer, System } from '@/model/schema';
import { simulate } from '@/sim/engine';
import { rideHailing } from '@/systems/rideHailing';
import { lessonsFor, OVERVIEW, stepInput } from './lessons';

const system = parseSystem(rideHailing);
const lessons = lessonsFor(system);
const lesson = (id: string) => lessons.find((l) => l.id === id)!;

/** Every id a lesson mentions is a real part, connection, scenario or challenge. */
function checkReferences(system: System) {
	const parts = new Set(system.components.map((c) => c.id));
	const edges = new Set(layoutSystem(system).edges.map((e) => e.key));
	for (const lesson of lessonsFor(system)) {
		expect(lesson.steps.length, lesson.id).toBeGreaterThan(2);
		for (const step of lesson.steps) {
			for (const id of step.focus ?? [])
				expect(parts, `${lesson.id}: ${step.title}`).toContain(id);
			for (const [key] of step.edges)
				expect(edges, `${lesson.id}: ${step.title}`).toContain(key);
			if (step.about) expect(parts).toContain(step.about);
			if (step.presetId) expect(system.presets.map((p) => p.id)).toContain(step.presetId);
			if (step.action?.kind === 'challenge') {
				expect(system.challenges.map((c) => c.id)).toContain(step.action.id);
			}
			expect(step.body.join(' ').length, `${lesson.id}: ${step.title}`).toBeGreaterThan(20);
		}
	}
}

describe('lessons', () => {
	it('start with the big picture, then follow each journey in turn', () => {
		expect(lessons.map((l) => l.id)).toEqual([OVERVIEW, ...system.journeys.map((j) => j.id)]);
	});

	it('show the big picture a row at a time, from the apps down', () => {
		const titles = lesson(OVERVIEW).steps.map((s) => s.title);
		expect(titles).toEqual([
			'What it does',
			'How to read it',
			'The apps',
			'Spreading the load',
			'The front door',
			'The services',
			'Background work',
			'The data',
			'Outside providers',
			'Next: follow a request',
		]);
		// each row lights up with the ones above it, and names every part in it
		const services = lesson(OVERVIEW).steps[5]!;
		expect(services.focus).toContain('rider-app');
		expect(services.focus).toContain('dispatch-service');
		expect(services.focus).not.toContain('trip-db');
		expect(services.body.join(' ')).toContain('**Dispatch**');
	});

	it('take a step per call, in order, lighting up the call being explained', () => {
		const journey = system.journeys.find((j) => j.id === 'request-ride')!;
		const steps = lesson('request-ride').steps;
		const calls = steps.slice(1, 1 + journey.hops.length);
		expect(calls.map((s) => s.title)).toEqual(journey.hops.map((h) => h.label));
		calls.forEach((step, i) => {
			const current = step.edges.filter(([, look]) => look === 'current');
			const hop = journey.hops[i]!;
			expect(current).toEqual([[edgeKey(hop.from, hop.to), 'current']]);
			// what's been met so far is lit up
			expect(step.focus).toContain(hop.from);
			expect(step.focus).toContain(hop.to);
		});
	});

	it('say who waits for each call, and what happens in the background', () => {
		const steps = lesson('request-ride').steps;
		const find = steps.find((s) => s.title === 'Find a driver')!;
		expect(find.tags).toContainEqual({ text: 'Rohit waits for this', tone: 'wait' });
		// and what one real request sends there
		expect(find.example?.data).toContainEqual(['rider', 'Rohit']);
		expect(find.body[0]).toBe('**API gateway** calls **Dispatch**, and waits for the answer.');
		expect(find.goodToKnow?.title).toBe('Why Dispatch?');
		const eta = steps.find((s) => s.title === 'Arrival time for the closest drivers')!;
		expect(eta.tags.map((t) => t.text)).toContain('Optional');
		expect(eta.goodToKnow?.text).toContain('graceful degradation');
		const background = steps.find((s) => s.title === 'Trip requested')!;
		expect(background.tags).toContainEqual({
			text: 'Background: nobody waits',
			tone: 'background',
		});
	});

	it('end on the night that’s hardest on the journey, then the challenge for it', () => {
		const steps = lesson('request-ride').steps;
		const load = steps.at(-2)!;
		const result = simulate(system, stepInput(system, load.presetId));
		expect(load.presetId).toBeDefined();
		expect(result.journeys['request-ride']!.success).toBeLessThan(0.99);
		expect(load.tags).toContainEqual({ text: 'Something breaks', tone: 'warn' });

		const last = steps.at(-1)!;
		expect(last.action).toMatchObject({ kind: 'challenge' });
		const challenge = system.challenges.find(
			(c) => last.action?.kind === 'challenge' && c.id === last.action.id,
		);
		expect(challenge?.goal.journey).toBe('request-ride');
	});

	it('only mention parts, connections, scenarios and challenges that exist', () => {
		checkReferences(system);
	});

	it('are made for any system, even a tiny one with no challenges', () => {
		const part = (id: string, kind: ComponentKind, layer: Layer) => ({
			id,
			name: id.toUpperCase(),
			kind,
			layer,
			summary: `The ${id}.`,
			why: 'Because.',
			onFailure: 'Nothing works.',
			scaling: 'Add more.',
			capacityPerInstance: kind === 'client' ? undefined : 1000,
			latencyMs: 5,
		});
		const tiny = parseSystem({
			id: 'tiny',
			name: 'Tiny app',
			tagline: 'A tiny app.',
			basis: 'real',
			description: ['A tiny app with one service and a database.'],
			components: [
				part('phone', 'client', 'clients'),
				part('api', 'service', 'services'),
				part('db', 'database', 'data'),
			],
			journeys: [
				{
					id: 'look',
					name: 'Look something up',
					description: 'Someone looks something up.',
					rps: 10,
					hops: [
						{ from: 'phone', to: 'api', label: 'Ask' },
						{ from: 'api', to: 'db', label: 'Read it' },
					],
				},
			],
			presets: [
				{ id: 'normal', name: 'Normal day', description: 'An ordinary day.', traffic: 1 },
			],
		});
		checkReferences(tiny);
		const look = lessonsFor(tiny)[1]!;
		expect(look.steps.at(-1)!.action).toEqual({ kind: 'explore', label: 'Explore freely' });
		expect(look.steps.at(-2)!.tags).toContainEqual({ text: 'It holds up', tone: 'plain' });
	});
});
