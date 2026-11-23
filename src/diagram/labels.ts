import type { Component } from '@/model/schema';
import type { Status } from '@/sim/engine';
import { formatUtilization } from '@/sim/format';
import { kindLabel, statusColor } from '@/theme';
import { wrap } from './geometry';

/** Longer names wrap, so labels side by side don't run into each other. */
export const WRAP = 24;

export const FAILED = '#dc4a32';

/**
 * What a part's label says, the same in the 3D scene and the flat diagram:
 * its name (wrapped), how busy it is when load is shown, the colour of its
 * dot, and the sentence a screen reader reads.
 */
export function labelText(
	component: Component,
	state: { status: Status | undefined; utilization: number; instances: number },
	detail: 'none' | 'load',
) {
	const { status, utilization, instances } = state;
	const isApp = component.kind === 'client';
	let line: string | undefined;
	let tone: 'plain' | 'busy' | 'bad' = 'plain';
	if (detail === 'load' && !isApp) {
		if (status === 'down') {
			line = 'down';
			tone = 'bad';
		} else {
			line = `${formatUtilization(utilization)} busy`;
			if (status === 'overloaded') tone = 'bad';
			else if (status === 'busy') tone = 'busy';
		}
	}
	const spokenState = isApp
		? kindLabel.client
		: status === 'down'
			? 'down'
			: `${kindLabel[component.kind]}, ${formatUtilization(utilization)} busy, ${instances} ${instances === 1 ? 'copy' : 'copies'}`;
	return {
		lines: wrap(component.name, WRAP),
		detail: line,
		tone,
		spoken: `${component.name}: ${spokenState}`,
		dot: isApp ? '#8b5cf6' : statusColor[status ?? 'ok'],
	};
}

export const toneColour = { plain: '#64748b', busy: '#a16207', bad: FAILED } as const;
