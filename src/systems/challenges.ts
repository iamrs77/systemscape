import type { Challenge, System } from '@/model/schema';
import { defaultInput, type SimInput, type SimResult } from '@/sim/engine';

/** The conditions a challenge starts from: its preset, and what's down. */
export function challengeInput(system: System, challenge: Challenge): SimInput {
	const preset = system.presets.find((p) => p.id === challenge.preset);
	return {
		...defaultInput,
		traffic: preset?.traffic ?? 1,
		journeyTraffic: preset?.journeyTraffic ?? {},
		sudden: preset?.sudden ?? false,
		down: new Set(challenge.down),
	};
}

/** Whether a simulation result meets the challenge's goal. */
export function meetsGoal(result: SimResult, challenge: Challenge) {
	const journey = result.journeys[challenge.goal.journey];
	if (!journey) return false;
	const { minSuccess, maxLatencyMs } = challenge.goal;
	return (
		journey.success >= minSuccess &&
		(maxLatencyMs === undefined || journey.latencyMs <= maxLatencyMs)
	);
}
