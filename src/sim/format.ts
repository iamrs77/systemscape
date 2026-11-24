/** Requests per second: 250/s, 1.5k/s, 25k/s. */
export function formatRps(rps: number) {
	if (rps >= 9_950) return `${Math.round(rps / 1000)}k/s`;
	if (rps >= 1000) return `${(rps / 1000).toFixed(1).replace(/\.0$/, '')}k/s`;
	if (rps >= 10 || rps === 0) return `${Math.round(rps)}/s`;
	// rarer than one every 10 seconds reads better per minute: 1.2/min, not 0.0/s
	if (rps < 0.1) return `${(rps * 60).toFixed(1).replace(/\.0$/, '')}/min`;
	return `${rps.toFixed(1)}/s`;
}

/** Durations: 45 ms, 1.2 s. */
export function formatMs(ms: number) {
	if (ms >= 995) return `${(ms / 1000).toFixed(1)} s`;
	return `${Math.round(ms)} ms`;
}

/**
 * A share as a percentage. Rounds down, so 99.96% shows as 99.9%, not as a
 * perfect 100% it hasn't reached.
 */
export function formatShare(share: number) {
	const tenths = Math.floor(share * 1000 + 1e-9) / 10;
	return `${Number.isInteger(tenths) ? tenths : tenths.toFixed(1)}%`;
}

/** How full something is: 62%, 208%. */
export function formatUtilization(utilization: number) {
	return `${Math.round(utilization * 100)}%`;
}

/**
 * A wait next to something everyone knows: a blink takes about a tenth of a
 * second. Said after the time itself, so it doesn't repeat it.
 */
export function feelOfMs(ms: number) {
	if (ms < 1) return 'instant';
	if (ms < 40) return 'too quick to notice';
	if (ms < 80) return 'less than a blink';
	if (ms < 150) return 'about one blink';
	if (ms < 995) return `about ${Math.round(ms / 100)} blinks`;
	if (ms < 3000) return 'long enough to notice';
	return 'a long wait';
}

/** Requests a second, as how many arrive in a minute: 250/s is 15,000 every minute. */
export function perMinute(rps: number) {
	const n = rps * 60;
	const count =
		n >= 1e6
			? `${(n / 1e6).toFixed(1).replace(/\.0$/, '')} million`
			: Math.round(n).toLocaleString('en-US');
	return `${count} every minute`;
}

/** How many fail, as a simple fraction: 20% succeeding is “4 in 5 fail”. */
export function feelOfShare(success: number) {
	if (success >= 0.999) return 'every one';
	if (success >= 0.99) return 'almost every one';
	if (success < 0.001) return 'all fail';
	if (success < 0.01) return 'almost all fail';
	const fail = 1 - success;
	const [best] = [2, 3, 4, 5, 6, 8, 10, 20, 50, 100]
		.map((n) => ({ n, k: Math.max(1, Math.round(fail * n)) }))
		.sort((a, b) => Math.abs(a.k / a.n - fail) - Math.abs(b.k / b.n - fail) || a.n - b.n);
	return `${best!.k} in ${best!.n} fail`;
}
