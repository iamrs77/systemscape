import { describe, expect, it } from 'vitest';
import { formatMs, formatRps, formatShare, formatUtilization } from './format';

describe('formatting', () => {
	it('shortens requests per second', () => {
		expect(formatRps(0)).toBe('0/s');
		expect(formatRps(4.25)).toBe('4.3/s');
		expect(formatRps(250)).toBe('250/s');
		expect(formatRps(1500)).toBe('1.5k/s');
		expect(formatRps(2000)).toBe('2k/s');
		expect(formatRps(25_000)).toBe('25k/s');
	});

	it('switches to seconds from about a second', () => {
		expect(formatMs(12.4)).toBe('12 ms');
		expect(formatMs(994)).toBe('994 ms');
		expect(formatMs(2089)).toBe('2.1 s');
	});

	it('never rounds a share up to a perfect 100%', () => {
		expect(formatShare(1)).toBe('100%');
		expect(formatShare(0.9996)).toBe('99.9%');
		expect(formatShare(0.48)).toBe('48%');
		expect(formatShare(0.123)).toBe('12.3%');
		expect(formatShare(0)).toBe('0%');
	});

	it('shows utilization as a whole percentage, past 100% too', () => {
		expect(formatUtilization(0.616)).toBe('62%');
		expect(formatUtilization(2.08)).toBe('208%');
	});
});
