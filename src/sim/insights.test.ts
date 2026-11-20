import { describe, expect, it } from 'vitest';
import { parseSystem } from '@/model/parseSystem';
import { rideHailing } from '@/systems/rideHailing';
import { defaultInput, simulate, type SimInput } from './engine';
import { explain } from './insights';

const system = parseSystem(rideHailing);
const insightsFor = (changes: Partial<SimInput>) => {
	const input = { ...defaultInput, ...changes };
	return explain(system, input, simulate(system, input));
};
const texts = (changes: Partial<SimInput>) => insightsFor(changes).map((i) => i.text);

describe('explaining a simulation', () => {
	it('says everything is working on a normal evening', () => {
		const insights = insightsFor({});
		expect(insights.at(-1)).toMatchObject({ level: 'good' });
		expect(insights.some((i) => i.level === 'bad' || i.level === 'warn')).toBe(false);
	});

	it('names what fails, and why autoscaling didn’t save it', () => {
		const insights = insightsFor({
			traffic: 1.5,
			journeyTraffic: { 'request-ride': 5, 'check-price': 4 },
			sudden: true,
		});
		// the most serious come first
		expect(insights[0]!.level).toBe('bad');
		const dispatch = insights.find((i) => i.text.startsWith('Dispatch is overloaded'));
		expect(dispatch).toMatchObject({ level: 'bad', componentId: 'dispatch-service' });
		expect(dispatch!.text).toMatch(/too suddenly for autoscaling/);
		expect(texts({ traffic: 3, autoscale: false }).join(' ')).toMatch(/Autoscaling is off/);
	});

	it('points out parts that can’t autoscale at all', () => {
		const all = texts({ down: new Set(['surge-cache']), traffic: 2.5 }).join(' ');
		expect(all).toMatch(/Trip database is overloaded.*can’t add instances by itself/);
	});

	it('explains a part being down using its own words', () => {
		const insight = insightsFor({ down: new Set(['eta-service']) }).find(
			(i) => i.componentId === 'eta-service' && i.level === 'bad',
		);
		expect(insight!.text).toMatch(/^ETA service is down\. Dispatch falls back/);
	});

	it('groups graceful degradation by the part that’s missing', () => {
		const degraded = texts({ down: new Set(['eta-service']) }).filter((t) =>
			t.includes('graceful degradation'),
		);
		expect(degraded).toHaveLength(1);
		expect(degraded[0]).toMatch(/See the price, Request a ride, Watch the driver arrive/);
	});

	it('mentions circuit breakers when they trip', () => {
		const all = texts({ down: new Set(['eta-service']), circuitBreakers: true }).join(' ');
		expect(all).toMatch(/Circuit breakers have tripped for ETA service/);
	});

	it('warns about slow journeys that still succeed', () => {
		const all = texts({ down: new Set(['eta-service']) }).join(' ');
		expect(all).toMatch(
			/Request a ride works but takes 2\.\d s, mostly waiting for ETA service/,
		);
	});

	it('reports background work failing even when users don’t notice', () => {
		const all = texts({ down: new Set(['payment-provider']) }).join(' ');
		expect(all).toMatch(/End the trip and pay: 100% of the background work afterwards fails/);
	});

	it('spots a retry storm', () => {
		// charges are retried 3 times, piling onto a provider that's already full
		const all = texts({ traffic: 6 }).join(' ');
		expect(all).toMatch(/Retries add \d+(\.\d)?% more calls to Payment provider/);
		expect(texts({ traffic: 6, retries: false }).join(' ')).not.toMatch(/Retries add/);
	});
});
