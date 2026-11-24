import { useMemo } from 'react';
import { Diagram, type EdgeLook } from '@/diagram/Diagram';
import {
	edgeKey,
	journeyComponents,
	resultWithOnly,
	runningJourneys,
	runningParts,
	withOnly,
} from '@/diagram/layout';
import { useApp, useSystem } from '@/store';

/** The diagram for exploring freely: the app’s own conditions and result. */
export function LiveDiagram() {
	const system = useSystem();
	const result = useApp((s) => s.result);
	const journeyId = useApp((s) => s.journeyId);
	const selected = useApp((s) => s.selected);
	const select = useApp((s) => s.select);
	const paused = useApp((s) => s.paused);

	const edges = useMemo(() => {
		const looks = new Map<string, EdgeLook>();
		for (const journey of system.journeys) {
			if (journeyId !== null && journey.id !== journeyId) continue;
			// a journey switched off (an alternative kept for teaching) isn't drawn
			if (journeyId === null && (result.journeys[journey.id]?.rps ?? 0) === 0) continue;
			for (const hop of journey.hops) looks.set(edgeKey(hop.from, hop.to), 'flow');
		}
		return looks;
	}, [system, journeyId, result]);
	const focus = useMemo(
		() => (journeyId ? journeyComponents(system, journeyId) : null),
		[system, journeyId],
	);
	const journey = system.journeys.find((j) => j.id === journeyId);

	// a course's system holds every design its lessons compare: only the parts in use are drawn
	const parts = system.course ? [...runningParts(system, result)].sort().join(' ') : '';
	const running = parts === '' ? null : parts;
	const journeys = system.course ? runningJourneys(system, result).join(' ') : '';
	const drawnSystem = useMemo(
		() =>
			running === null
				? system
				: withOnly(system, new Set(running.split(' ')), new Set(journeys.split(' '))),
		[system, running, journeys],
	);
	const drawnResult = useMemo(
		() =>
			running === null ? result : resultWithOnly(system, result, new Set(running.split(' '))),
		[system, result, running],
	);

	return (
		<Diagram
			system={drawnSystem}
			result={drawnResult}
			edges={edges}
			journeyId={journeyId}
			focus={focus}
			zoom={focus}
			selected={selected}
			onSelect={select}
			detail="load"
			badges
			paused={paused}
			title={`${system.name}, drawn as a diagram${journey ? `, following “${journey.name}”` : ''}. Every part is a button.`}
		/>
	);
}
