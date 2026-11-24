import { create } from 'zustand';
import type { System } from '@/model/schema';
import { simulate, type SimInput, type SimResult } from '@/sim/engine';
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
};

type Actions = {
	selectSystem(id: string): void;
	applyPreset(id: string): void;
	setTraffic(traffic: number): void;
	setOption(option: Option, on: boolean): void;
	setDown(componentId: string, down: boolean): void;
	setInstances(componentId: string, instances: number): void;
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
};

export type AppState = State & Actions;

const LEARNED_KEY = 'systemscape:learned';

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
		dialog: null,
	};
}

export const useApp = create<AppState>()((set, get) => {
	const system = () => getSystem(get().systemId);

	/** Runs the simulation with new conditions. */
	const run = (input: SimInput) => set({ input, result: simulate(system(), input) });

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

		openDialog(dialog) {
			set({ dialog });
		},
	};
});

/** The system being explored. */
export const useSystem = () => getSystem(useApp((s) => s.systemId));
