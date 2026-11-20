import { beforeEach, describe, expect, it } from 'vitest';
import { initialState, MAX_INSTANCES, TRAFFIC_RANGE, useApp } from './store';

const app = () => useApp.getState();

beforeEach(() => {
	localStorage.clear();
	useApp.setState(initialState());
});

describe('the app state', () => {
	it('starts on the first system, on a normal evening, with everything working', () => {
		expect(app().systemId).toBe('ride-hailing');
		expect(app().presetId).toBe('normal');
		expect(app().result.journeys['request-ride']!.success).toBeCloseTo(1, 5);
	});

	it('changes the traffic with a scenario, keeping your other changes', () => {
		app().setOption('circuitBreakers', true);
		app().setInstances('dispatch-service', 8);
		app().applyPreset('sudden-rain');
		expect(app().input).toMatchObject({
			traffic: 1.5,
			sudden: true,
			circuitBreakers: true,
			instances: { 'dispatch-service': 8 },
		});
		expect(app().input.journeyTraffic).toEqual({ 'request-ride': 5, 'check-price': 4 });
	});

	it('keeps traffic in range', () => {
		app().setTraffic(100);
		expect(app().input.traffic).toBe(TRAFFIC_RANGE.max);
		app().setTraffic(0);
		expect(app().input.traffic).toBe(TRAFFIC_RANGE.min);
	});

	it('keeps instances in range, and forgets ones set back to the default', () => {
		app().setInstances('trip-db', 1000);
		expect(app().input.instances['trip-db']).toBe(MAX_INSTANCES);
		app().setInstances('trip-db', 3);
		expect(app().input.instances).toEqual({});
	});

	it('won’t take down or scale the apps, or scale an outside provider', () => {
		app().setDown('rider-app', true);
		app().setInstances('rider-app', 4);
		app().setInstances('payment-provider', 4);
		expect(app().input.down.size).toBe(0);
		expect(app().input.instances).toEqual({});
	});

	it('takes parts down and brings them back', () => {
		app().setDown('trip-db', true);
		expect(app().result.components['trip-db']!.status).toBe('down');
		app().setDown('trip-db', false);
		expect(app().result.components['trip-db']!.status).not.toBe('down');
	});

	it('resets to the scenario as it started', () => {
		app().applyPreset('friday-night');
		app().setDown('trip-db', true);
		app().setOption('retries', false);
		app().reset();
		expect(app().input.down.size).toBe(0);
		expect(app().input.retries).toBe(true);
		expect(app().input.traffic).toBe(2.5);
	});
});

describe('challenges', () => {
	it('start from their own conditions, following the goal journey', () => {
		app().startChallenge('routing-down');
		expect(app().challengeId).toBe('routing-down');
		expect(app().journeyId).toBe('request-ride');
		expect([...app().input.down]).toEqual(['eta-service']);
	});

	it('lock what the challenge decides', () => {
		app().startChallenge('sudden-rain');
		app().setTraffic(0.5);
		app().applyPreset('normal');
		app().setOption('sudden', false);
		expect(app().input).toMatchObject({ traffic: 1.5, sudden: true });

		app().startChallenge('routing-down');
		app().setDown('eta-service', false);
		expect(app().input.down.has('eta-service')).toBe(true);
	});

	it('are remembered once solved, even in a new session', () => {
		app().startChallenge('routing-down');
		expect(app().solved).toEqual([]);
		app().setOption('circuitBreakers', true);
		expect(app().solved).toEqual(['ride-hailing/routing-down']);
		expect(initialState().solved).toEqual(['ride-hailing/routing-down']);
	});

	it('reset to where the challenge started', () => {
		app().startChallenge('new-year');
		app().setInstances('dispatch-service', 20);
		app().reset();
		expect(app().challengeId).toBe('new-year');
		expect(app().input.instances).toEqual({});
		expect(app().input.traffic).toBe(2.5);
	});

	it('can be left, back to a normal evening', () => {
		app().startChallenge('surge-cache-friday');
		app().leaveChallenge();
		expect(app().challengeId).toBeNull();
		expect(app().presetId).toBe('normal');
		expect(app().input.down.size).toBe(0);
	});
});
