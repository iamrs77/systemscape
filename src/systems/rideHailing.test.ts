import { describe, expect, it } from 'vitest';
import { parseSystem } from '@/model/parseSystem';
import { defaultInput, simulate, type SimInput } from '@/sim/engine';
import { challengeInput, meetsGoal } from './challenges';
import { rideHailing } from './rideHailing';

const system = parseSystem(rideHailing);

// a fix for each challenge: one nobody can solve, or one that's solved before
// you start, would be a bug
const solutions: Record<string, Partial<SimInput>> = {
	'routing-down': { circuitBreakers: true },
	'sudden-rain': { instances: { 'dispatch-service': 8, 'eta-service': 26 } },
	'surge-cache-friday': { instances: { 'trip-db': 7 } },
	'new-year': {
		instances: {
			'api-gateway': 6,
			'realtime-gateway': 8,
			'location-service': 12,
			'pricing-service': 8,
			'dispatch-service': 16,
			'geo-index': 8,
			'trip-service': 4,
			'trip-db': 6,
		},
		circuitBreakers: true,
	},
};

describe('the ride-hailing system', () => {
	it.each(['normal', 'friday-night'])('handles the %s preset without failures', (id) => {
		const preset = system.presets.find((p) => p.id === id)!;
		const result = simulate(system, {
			...defaultInput,
			traffic: preset.traffic,
			journeyTraffic: preset.journeyTraffic,
		});
		for (const journey of Object.values(result.journeys)) {
			expect(journey.success).toBeGreaterThan(0.999);
			expect(journey.latencyMs).toBeLessThan(1000);
		}
		expect(Object.values(result.components).map((c) => c.status)).not.toContain('overloaded');
	});

	it('has a tested solution for every challenge', () => {
		expect(Object.keys(solutions).sort()).toEqual(system.challenges.map((c) => c.id).sort());
	});

	describe.each(system.challenges)('challenge "$title"', (challenge) => {
		const start = challengeInput(system, challenge);

		it('starts out failing its goal', () => {
			expect(meetsGoal(simulate(system, start), challenge)).toBe(false);
		});

		it('is solved by a sensible fix', () => {
			const fixed = simulate(system, { ...start, ...solutions[challenge.id] });
			expect(meetsGoal(fixed, challenge)).toBe(true);
		});
	});
});
