import { create } from 'zustand';
import type { Preset, System } from '@/model/schema';
import { defaultInput, simulate, type SimInput, type SimResult } from '@/sim/engine';
import { challengeInput, meetsGoal } from '@/systems/challenges';
import { getSystem, systems } from '@/systems';

export type Option = 'autoscale' | 'retries' | 'circuitBreakers' | 'sudden';
export type Dialog = 'about' | 'glossary' | null;

/** Instances you can set by hand. */
export const MAX_INSTANCES = 100;
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
	challengeId: string | null;
	/** Solved challenges, as "system/challenge". */
	solved: string[];
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
	startChallenge(id: string): void;
	leaveChallenge(): void;
	/** Back to how the scenario (or challenge) started. */
	reset(): void;
	/** Marks a lesson of the current system as finished. */
	markLearned(lessonId: string): void;
	/** Forgets the finished lessons and solved challenges of the current system. */
	resetProgress(): void;
	setPaused(paused: boolean): void;
	openDialog(dialog: Dialog): void;
};

export type AppState = State & Actions;

const SOLVED_KEY = 'systemscape:solved';
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

function presetInput(preset: Preset): Pick<SimInput, 'traffic' | 'journeyTraffic' | 'sudden'> {
	return {
		traffic: preset.traffic,
		journeyTraffic: preset.journeyTraffic,
		sudden: preset.sudden,
	};
}

/** The journey a system starts by following: the one with the most steps, so the most to show. */
export function startingJourney(system: System) {
	return [...system.journeys].sort((a, b) => b.hops.length - a.hops.length)[0]!;
}

/** A system as it starts: its first preset, with nothing changed, following its starting journey. */
function fresh(system: System) {
	const preset = system.presets[0]!;
	const input = { ...defaultInput, ...presetInput(preset) };
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
		challengeId: null,
		solved: load(SOLVED_KEY),
		learned: load(LEARNED_KEY),
		paused: prefersReducedMotion(),
		dialog: null,
	};
}

export const useApp = create<AppState>()((set, get) => {
	const system = () => getSystem(get().systemId);
	const challenge = () => system().challenges.find((c) => c.id === get().challengeId);

	/** Runs the simulation with new conditions, and records a solved challenge. */
	const run = (input: SimInput, extra: Partial<State> = {}) => {
		const result = simulate(system(), input);
		const active = challenge();
		let solved = get().solved;
		const key = active && `${system().id}/${active.id}`;
		if (active && key && !solved.includes(key) && meetsGoal(result, active)) {
			solved = [...solved, key];
			save(SOLVED_KEY, solved);
		}
		set({ ...extra, input, result, solved });
	};

	return {
		...initialState(),

		selectSystem(id) {
			set({ ...fresh(getSystem(id)), selected: null, challengeId: null });
		},

		applyPreset(id) {
			const preset = system().presets.find((p) => p.id === id);
			if (!preset || get().challengeId) return;
			set({ presetId: id });
			run({ ...get().input, ...presetInput(preset) });
		},

		setTraffic(traffic) {
			if (get().challengeId) return;
			const clamped = Math.min(TRAFFIC_RANGE.max, Math.max(TRAFFIC_RANGE.min, traffic));
			run({ ...get().input, traffic: clamped });
		},

		setOption(option, on) {
			// the challenge decides how suddenly traffic arrives
			if (option === 'sudden' && get().challengeId) return;
			run({ ...get().input, [option]: on });
		},

		setDown(componentId, down) {
			const component = system().components.find((c) => c.id === componentId);
			if (!component || component.kind === 'client') return;
			// a challenge's broken parts can't be fixed in time: that's the point
			if (!down && challenge()?.down.includes(componentId)) return;
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

		startChallenge(id) {
			const found = system().challenges.find((c) => c.id === id);
			if (!found) return;
			set({
				challengeId: id,
				presetId: found.preset,
				selected: null,
				journeyId: found.goal.journey,
			});
			run(challengeInput(system(), found));
		},

		leaveChallenge() {
			set({ ...fresh(system()), challengeId: null });
		},

		reset() {
			const active = challenge();
			if (active) {
				run(challengeInput(system(), active));
				return;
			}
			const preset =
				system().presets.find((p) => p.id === get().presetId) ?? system().presets[0]!;
			run({ ...defaultInput, ...presetInput(preset) });
		},

		resetProgress() {
			const mine = (key: string) => key.startsWith(`${get().systemId}/`);
			const learned = get().learned.filter((key) => !mine(key));
			const solved = get().solved.filter((key) => !mine(key));
			save(LEARNED_KEY, learned);
			save(SOLVED_KEY, solved);
			set({ learned, solved });
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

/** The active challenge, if any. */
export function useChallenge() {
	const system = useSystem();
	const id = useApp((s) => s.challengeId);
	return system.challenges.find((c) => c.id === id);
}
