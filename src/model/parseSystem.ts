import { systemSchema, type System, type SystemInput } from './schema';

/**
 * Parses a system and checks what the schema can't: that every id it refers
 * to exists, and that each journey's hops connect. Throws with every problem
 * listed, so a broken system fails the tests with a clear message.
 */
export function parseSystem(input: SystemInput): System {
	const system = systemSchema.parse(input);
	const problems: string[] = [];
	const ids = new Set<string>();

	for (const component of system.components) {
		if (ids.has(component.id)) {
			problems.push(`two components have the id "${component.id}"`);
		}
		ids.add(component.id);
		const needsCapacity = component.kind !== 'client';
		if (needsCapacity && component.capacityPerInstance === undefined) {
			problems.push(`${component.id} needs a capacityPerInstance`);
		}
		if (component.maxInstances !== undefined && component.maxInstances < component.instances) {
			problems.push(`${component.id}: maxInstances is below instances`);
		}
		const isCache = component.kind === 'cache' || component.kind === 'cdn';
		if (isCache !== (component.hitRate !== undefined)) {
			problems.push(
				`${component.id}: only caches and CDNs have a hitRate, and they need one`,
			);
		}
	}

	const byId = new Map(system.components.map((c) => [c.id, c]));
	for (const journey of system.journeys) {
		const first = journey.hops[0];
		const start = first && byId.get(first.from);
		if (start?.kind !== 'client') {
			problems.push(`journey ${journey.id} must start from a client`);
		}
		const reached = new Set(first ? [first.from] : []);
		journey.hops.forEach((hop, i) => {
			const where = `journey ${journey.id}, hop ${i + 1}`;
			for (const end of [hop.from, hop.to]) {
				if (!ids.has(end)) problems.push(`${where}: no component "${end}"`);
			}
			if (!reached.has(hop.from)) {
				problems.push(`${where}: "${hop.from}" isn't reached by an earlier hop`);
			}
			if (hop.onMiss && !byId.get(hop.from)?.hitRate) {
				problems.push(`${where}: onMiss hops must start from a cache or CDN`);
			}
			reached.add(hop.to);
		});
	}

	const journeyIds = new Set(system.journeys.map((j) => j.id));
	for (const preset of system.presets) {
		for (const journey of Object.keys(preset.journeyTraffic)) {
			if (!journeyIds.has(journey))
				problems.push(`preset ${preset.id}: no journey "${journey}"`);
		}
	}

	if (problems.length > 0) {
		throw new Error(`System "${system.id}" has problems:\n- ${problems.join('\n- ')}`);
	}
	return system;
}
