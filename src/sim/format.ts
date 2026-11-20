/** Requests per second: 250/s, 1.5k/s, 25k/s. */
export function formatRps(rps: number) {
	if (rps >= 9_950) return `${Math.round(rps / 1000)}k/s`;
	if (rps >= 1000) return `${(rps / 1000).toFixed(1).replace(/\.0$/, '')}k/s`;
	if (rps >= 10 || rps === 0) return `${Math.round(rps)}/s`;
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
