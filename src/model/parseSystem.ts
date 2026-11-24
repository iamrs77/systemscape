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
		if (start?.kind !== 'client' && start?.kind !== 'external') {
			problems.push(`journey ${journey.id} must start from a client or an outside provider`);
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
			if (hop.onMiss && byId.get(hop.from)?.hitRate === undefined) {
				problems.push(`${where}: onMiss hops must start from a cache or CDN`);
			}
			reached.add(hop.to);
		});
		// a load balancer's copies: at least two, each once, their shares adding up to 1
		const picks = new Map<string, typeof journey.hops>();
		for (const hop of journey.hops.filter((h) => h.pick)) {
			picks.set(hop.from, [...(picks.get(hop.from) ?? []), hop]);
		}
		// calls made together: from one part, waited on, and asking no more answers than there are calls
		const groups = new Map<string, typeof journey.hops>();
		for (const hop of journey.hops.filter((h) => h.together !== undefined)) {
			groups.set(hop.together!, [...(groups.get(hop.together!) ?? []), hop]);
		}
		for (const [name, group] of groups) {
			const where = `journey ${journey.id}, the calls made together as "${name}"`;
			if (new Set(group.map((h) => h.from)).size > 1)
				problems.push(`${where}: they must all come from one part`);
			if (group.some((h) => h.mode === 'async'))
				problems.push(`${where}: nobody waits for background calls`);
			if (group.length > 12) problems.push(`${where}: at most 12`);
			const needs = new Set(group.map((h) => h.need));
			const need = group[0]!.need;
			if (needs.size > 1) problems.push(`${where}: give them all the same need`);
			if (need !== undefined && need > group.length)
				problems.push(`${where}: need is more than the calls`);
		}
		for (const hop of journey.hops) {
			if (hop.need !== undefined && hop.together === undefined)
				problems.push(`journey ${journey.id}: need only goes with together`);
		}
		for (const [from, group] of picks) {
			const where = `journey ${journey.id}, the copies ${from} picks between`;
			if (group.length < 2) problems.push(`${where}: there must be at least two`);
			if (new Set(group.map((hop) => hop.to)).size < group.length) {
				problems.push(`${where}: each copy can only be named once`);
			}
			const total = group.reduce((sum, hop) => sum + hop.share, 0);
			if (Math.abs(total - 1) > 0.01) {
				problems.push(`${where}: their shares add up to ${total}, not 1`);
			}
		}
	}

	const journeyIds = new Set(system.journeys.map((j) => j.id));
	for (const preset of system.presets) {
		for (const journey of Object.keys(preset.journeyTraffic)) {
			if (!journeyIds.has(journey))
				problems.push(`preset ${preset.id}: no journey "${journey}"`);
		}
		for (const part of preset.down) {
			if (!ids.has(part)) problems.push(`preset ${preset.id}: no component "${part}"`);
		}
	}
	const presetIds = new Set(system.presets.map((p) => p.id));
	for (const journey of system.journeys) {
		if (journey.scenario && !presetIds.has(journey.scenario))
			problems.push(`journey ${journey.id}: no scenario "${journey.scenario}"`);
	}

	if (problems.length > 0) {
		throw new Error(`System "${system.id}" has problems:\n- ${problems.join('\n- ')}`);
	}
	return system;
}
