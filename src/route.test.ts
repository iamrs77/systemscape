import { describe, expect, it } from 'vitest';
import { exploreHref, lessonHref, parseRoute, practiceHref, systemHref } from './route';

const at = (mode: unknown) => ({ page: 'system', systemId: 'ride-hailing', mode });

describe('parseRoute', () => {
	it('opens the home page with no hash, or just a slash', () => {
		expect(parseRoute('')).toEqual({ page: 'home' });
		expect(parseRoute('#')).toEqual({ page: 'home' });
		expect(parseRoute('#/')).toEqual({ page: 'home' });
	});

	it('opens a system at its first lesson', () => {
		expect(parseRoute(systemHref('ride-hailing'))).toEqual(
			at({ kind: 'learn', lessonId: 'overview', step: 0 }),
		);
		expect(parseRoute('#/ride-hailing/')).toEqual(
			at({ kind: 'learn', lessonId: 'overview', step: 0 }),
		);
	});

	it('opens a lesson at a step, counted from 1 in the link', () => {
		expect(parseRoute('#/ride-hailing/learn/request-ride')).toEqual(
			at({ kind: 'learn', lessonId: 'request-ride', step: 0 }),
		);
		expect(parseRoute(lessonHref('ride-hailing', 'request-ride', 2))).toEqual(
			at({ kind: 'learn', lessonId: 'request-ride', step: 2 }),
		);
		expect(lessonHref('ride-hailing', 'request-ride', 2)).toBe(
			'#/ride-hailing/learn/request-ride/3',
		);
	});

	it('opens a challenge, and the sandbox', () => {
		expect(parseRoute(practiceHref('ride-hailing', 'routing-down'))).toEqual(
			at({ kind: 'practice', challengeId: 'routing-down' }),
		);
		expect(parseRoute(exploreHref('ride-hailing'))).toEqual(at({ kind: 'explore' }));
	});

	it('falls back to the first lesson for a lesson or challenge that doesn’t exist', () => {
		const first = at({ kind: 'learn', lessonId: 'overview', step: 0 });
		expect(parseRoute('#/ride-hailing/learn/flying-cars')).toEqual(first);
		expect(parseRoute('#/ride-hailing/practice/flying-cars')).toEqual(first);
		expect(parseRoute('#/ride-hailing/learn/overview/zero')).toEqual(first);
	});

	it('falls back to the home page for a system that doesn’t exist', () => {
		expect(parseRoute('#/stock-trading')).toEqual({ page: 'home' });
		expect(parseRoute('#nonsense')).toEqual({ page: 'home' });
	});
});
