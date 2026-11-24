import { useMemo } from 'react';
import { Diagram, type EdgeLook } from '@/diagram/Diagram';
import { edgeKey, journeyComponents } from '@/diagram/layout';
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
			for (const hop of journey.hops) looks.set(edgeKey(hop.from, hop.to), 'flow');
		}
		return looks;
	}, [system, journeyId]);
	const focus = useMemo(
		() => (journeyId ? journeyComponents(system, journeyId) : null),
		[system, journeyId],
	);
	const journey = system.journeys.find((j) => j.id === journeyId);

	return (
		<Diagram
			system={system}
			result={result}
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
