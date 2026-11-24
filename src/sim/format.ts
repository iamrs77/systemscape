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
			: n < 10
				? n.toFixed(1).replace(/\.0$/, '')
				: Math.round(n).toLocaleString('en-US');
	return `${count} every minute`;
}

/**
 * How many fail, as a simple fraction: 20% succeeding is “4 in 5 fail”, 1.5%
 * failing “about 1 in 67 fail”, 5% succeeding “only 1 in 20 works”.
 */
export function feelOfShare(success: number) {
	if (success >= 0.999) return 'every one';
	if (success >= 0.99) return 'almost every one';
	if (success < 0.001) return 'all fail';
	if (success < 0.01) return 'almost all fail';
	const fail = 1 - success;
	// one in so many: a few that fail, or a few that work
	const oneIn = (share: number) => {
		const n = Math.round(1 / share);
		return { n, exact: Math.abs(1 / n - share) < 0.001 };
	};
	if (fail <= 0.1) {
		const { n, exact } = oneIn(fail);
		return `${exact ? '' : 'about '}1 in ${n} fail`;
	}
	if (success <= 0.1) {
		const { n, exact } = oneIn(success);
		return `only ${exact ? '' : 'about '}1 in ${n} works`;
	}
	// an exact simple fraction, or the closest simple one if it's close, or failing that, the closest
	const fit = (n: number) => {
		const k = Math.min(n - 1, Math.max(1, Math.round(fail * n)));
		return { n, k, off: Math.abs(k / n - fail) };
	};
	const simple = [2, 3, 4, 5, 6, 8, 10].map(fit);
	const best =
		simple.find((f) => f.off < 0.001) ??
		simple.filter((f) => f.off <= 0.035).sort((a, b) => a.off - b.off || a.n - b.n)[0] ??
		[2, 3, 4, 5, 6, 8, 10, 20, 50, 100].map(fit).sort((a, b) => a.off - b.off)[0]!;
	return `${best.off < 0.001 ? '' : 'about '}${best.k} in ${best.n} fail`;
}
