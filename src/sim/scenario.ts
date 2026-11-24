import type { Preset } from '@/model/schema';
import { defaultInput, type SimInput } from './engine';

/** The most copies of a part you can ask for. */
export const MAX_INSTANCES = 100;

/** What a scenario decides: how much traffic, how suddenly, and what's broken. */
export function scenarioConditions(
	preset: Preset,
): Pick<SimInput, 'traffic' | 'journeyTraffic' | 'sudden' | 'down'> {
	return {
		traffic: preset.traffic,
		journeyTraffic: preset.journeyTraffic,
		sudden: preset.sudden,
		down: new Set(preset.down),
	};
}

/** A scenario as it starts, with nothing else changed. */
export function scenarioInput(preset: Preset): SimInput {
	return { ...defaultInput, ...scenarioConditions(preset) };
}
