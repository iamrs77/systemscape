import { create } from 'zustand';
import type { System } from '@/model/schema';
import { simulate, type Balancing, type SimInput, type SimResult } from '@/sim/engine';
import type { Change } from '@/sim/fixes';
import { mainJourney } from '@/learn/lessons';
import {
	conditionsInput,
	MAX_INSTANCES,
	scenarioConditions,
	scenarioInput,
	type Conditions,
} from '@/sim/scenario';
import { getSystem, systems } from '@/systems';

export type Option = 'autoscale' | 'retries' | 'circuitBreakers' | 'sudden';
export type Dialog = 'about' | 'glossary' | null;

/** Instances you can set by hand. */
export { MAX_INSTANCES };
export const TRAFFIC_RANGE = { min: 0.25, max: 8 } as const;

type State = {
	systemId: string;
	presetId: string;
	input: SimInput;
	result: SimResult;
	/** The component shown in the inspector. */
	selected: string | null;
	/** The component under the pointer, in the scene or its label. */
	hovered: string | null;
	/** The journey whose requests are shown flowing; null for all of them. */
	journeyId: string | null;
	/** Lessons finished, as "system/lesson". */
	learned: string[];
	paused: boolean;
	dialog: Dialog;
	/** The side panels, widened from how they start. */
	wide: Wide;
};

type Actions = {
	selectSystem(id: string): void;
	applyPreset(id: string): void;
	setTraffic(traffic: number): void;
	setOption(option: Option, on: boolean): void;
	setDown(componentId: string, down: boolean): void;
	setInstances(componentId: string, instances: number): void;
	/** How a load balancer picks between its copies. */
	setBalancing(balancerId: string, rule: Balancing): void;
	setHealthChecks(on: boolean): void;
	/** Every request to a part takes ten times as long, like a copy with a failing disk. */
	setSlow(componentId: string, on: boolean): void;
	/** A part turns away what it can't take at once, instead of letting it time out. */
	setShed(componentId: string, on: boolean): void;
	/** Breaks the network link between two parts, or mends it. */
	setCut(a: string, b: string, cut: boolean): void;
	/** A cache's share of answers from memory. */
	setHitRate(componentId: string, rate: number): void;
	select(componentId: string | null): void;
	hover(componentId: string | null): void;
	selectJourney(journeyId: string | null): void;
	/** Starts exploring from an evening, following a journey: where a lesson's "try it yourself" leads. */
	setUp(presetId: string | null, journeyId: string | null, conditions?: Conditions): void;
	/** Back to how the evening started. */
	reset(): void;
	/** Makes one of the fixes offered for a problem. */
	applyChange(change: Change): void;
	/** Marks a lesson of the current system as finished. */
	markLearned(lessonId: string): void;
	/** Forgets the finished lessons of the current system. */
	resetProgress(): void;
	setPaused(paused: boolean): void;
	openDialog(dialog: Dialog): void;
	/** Widens a side panel, or puts it back. */
	toggleWide(side: keyof Wide): void;
};

export type AppState = State & Actions;

const LEARNED_KEY = 'systemscape:learned';
const WIDE_KEY = 'systemscape:wide';

export type Wide = { left: boolean; right: boolean };

/** The panels as this viewer left them: as they start, unless widened. */
function loadWide(): Wide {
	try {
		const saved: unknown = JSON.parse(localStorage.getItem(WIDE_KEY) ?? '{}');
		const wide = (saved ?? {}) as Partial<Wide>;
		return { left: wide.left === true, right: wide.right === true };
	} catch {
		return { left: false, right: false };
	}
}

/** Saved progress: a list of "system/thing" keys. */
function load(key: string): string[] {
	try {
		const saved: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
		return Array.isArray(saved) ? saved.filter((x) => typeof x === 'string') : [];
	} catch {
		return [];
	}
}

function save(key: string, list: string[]) {
	try {
		localStorage.setItem(key, JSON.stringify(list));
	} catch {
		// progress just isn't remembered
	}
}

function prefersReducedMotion() {
	try {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	} catch {
		return false;
	}
}

/** The journey a system starts by following: the one with the most steps, so the most to show. */
export function startingJourney(system: System) {
	return mainJourney(system);
}

/** A system as it starts: its first preset, with nothing changed, following its starting journey. */
function fresh(system: System) {
	const preset = system.presets[0]!;
	const input = scenarioInput(preset);
	return {
		systemId: system.id,
		presetId: preset.id,
		input,
		result: simulate(system, input),
		journeyId: startingJourney(system).id as string | null,
	};
}

export function initialState(): State {
	return {
		...fresh(systems[0]!),
		selected: null,
		hovered: null,
		learned: load(LEARNED_KEY),
		paused: prefersReducedMotion(),
		wide: loadWide(),
		dialog: null,
	};
}

export const useApp = create<AppState>()((set, get) => {
	const system = () => getSystem(get().systemId);

	/** Runs the simulation with new conditions. */
	const run = (input: SimInput) => {
		const result = simulate(system(), input);
		// a journey that isn't running any more, like a lesson's design after a scenario
		// switches it off, has nothing to show: follow them all instead
		const followed = get().journeyId;
		const stopped = followed !== null && (result.journeys[followed]?.rps ?? 0) === 0;
		set({ input, result, ...(stopped ? { journeyId: null } : {}) });
	};

	return {
		...initialState(),

		selectSystem(id) {
			set({ ...fresh(getSystem(id)), selected: null });
		},

		applyPreset(id) {
			const preset = system().presets.find((p) => p.id === id);
			if (!preset) return;
			set({ presetId: id });
			run({ ...get().input, ...scenarioConditions(preset) });
		},

		setTraffic(traffic) {
			const clamped = Math.min(TRAFFIC_RANGE.max, Math.max(TRAFFIC_RANGE.min, traffic));
			run({ ...get().input, traffic: clamped });
		},

		setOption(option, on) {
			run({ ...get().input, [option]: on });
		},

		setDown(componentId, down) {
			const component = system().components.find((c) => c.id === componentId);
			if (!component || component.kind === 'client') return;
			const next = new Set(get().input.down);
			if (down) next.add(componentId);
			else next.delete(componentId);
			run({ ...get().input, down: next });
		},

		setInstances(componentId, instances) {
			const component = system().components.find((c) => c.id === componentId);
			// apps stand for the users, and outside providers aren't ours to scale
			if (!component || component.kind === 'client' || component.kind === 'external') return;
			const count = Math.min(MAX_INSTANCES, Math.max(1, Math.round(instances)));
			const { [componentId]: _removed, ...others } = get().input.instances;
			run({
				...get().input,
				instances:
					count === component.instances ? others : { ...others, [componentId]: count },
			});
		},

		setBalancing(balancerId, rule) {
			run({ ...get().input, balancing: { ...get().input.balancing, [balancerId]: rule } });
		},

		setHealthChecks(on) {
			run({ ...get().input, healthChecks: on });
		},

		setSlow(componentId, on) {
			const { [componentId]: _removed, ...others } = get().input.slow ?? {};
			run({ ...get().input, slow: on ? { ...others, [componentId]: 10 } : others });
		},

		setShed(componentId, on) {
			const others = (get().input.shed ?? []).filter((id) => id !== componentId);
			run({ ...get().input, shed: on ? [...others, componentId] : others });
		},

		setCut(a, b, cut) {
			const others = (get().input.cut ?? []).filter(
				([x, y]) => !((x === a && y === b) || (x === b && y === a)),
			);
			run({ ...get().input, cut: cut ? [...others, [a, b] as const] : others });
		},

		setHitRate(componentId, rate) {
			const hitRate = {
				...get().input.hitRate,
				[componentId]: Math.min(1, Math.max(0, rate)),
			};
			run({ ...get().input, hitRate });
		},

		select(componentId) {
			set({ selected: componentId });
		},

		hover(componentId) {
			set({ hovered: componentId });
		},

		selectJourney(journeyId) {
			set({ journeyId });
		},

		setUp(presetId, journeyId, conditions) {
			const preset = system().presets.find((p) => p.id === presetId) ?? system().presets[0]!;
			set({ presetId: preset.id, journeyId, selected: null });
			run(conditions ? conditionsInput(system(), conditions) : scenarioInput(preset));
		},

		reset() {
			const preset =
				system().presets.find((p) => p.id === get().presetId) ?? system().presets[0]!;
			run(scenarioInput(preset));
		},

		applyChange(change) {
			if (change.kind === 'copies') get().setInstances(change.componentId, change.instances);
			else if (change.kind === 'bring-back') get().setDown(change.componentId, false);
			else if (change.kind === 'balancing')
				get().setBalancing(change.balancerId, change.rule);
			else get().setOption(change.option, change.on);
		},

		resetProgress() {
			const mine = (key: string) => key.startsWith(`${get().systemId}/`);
			const learned = get().learned.filter((key) => !mine(key));
			save(LEARNED_KEY, learned);
			set({ learned });
		},

		markLearned(lessonId) {
			const key = `${get().systemId}/${lessonId}`;
			if (get().learned.includes(key)) return;
			const learned = [...get().learned, key];
			save(LEARNED_KEY, learned);
			set({ learned });
		},

		setPaused(paused) {
			set({ paused });
		},

		toggleWide(side) {
			const wide = { ...get().wide, [side]: !get().wide[side] };
			try {
				localStorage.setItem(WIDE_KEY, JSON.stringify(wide));
			} catch {
				// the panels just start as they are next time
			}
			set({ wide });
		},

		openDialog(dialog) {
			set({ dialog });
		},
	};
});

/** The system being explored. */
export const useSystem = () => getSystem(useApp((s) => s.systemId));
