import type { ComponentKind, Layer, System } from '@/model/schema';
import type { JourneyState, Status } from '@/sim/engine';
import { SLOW_MS } from '@/sim/insights';

/** Colours shared by the diagram and the panels, so a status looks the same in both. */
export const statusColor: Record<Status, string> = {
	idle: '#94a3b8',
	ok: '#3f9a5f',
	busy: '#d39a1c',
	behind: '#c2741a',
	overloaded: '#d1492f',
	down: '#64748b',
};

export const statusLabel: Record<Status, string> = {
	idle: 'Idle',
	ok: 'Healthy',
	busy: 'Busy',
	behind: 'Behind',
	overloaded: 'Overloaded',
	down: 'Down',
};

export const kindLabel: Record<ComponentKind, string> = {
	client: 'App',
	cdn: 'CDN',
	balancer: 'Load balancer',
	gateway: 'Gateway',
	service: 'Service',
	worker: 'Background worker',
	cache: 'Cache',
	database: 'Database',
	queue: 'Queue',
	stream: 'Event stream',
	storage: 'File storage',
	notifier: 'Notifications',
	external: 'Outside provider',
};

export const layerLabel: Record<Layer, string> = {
	clients: 'Apps',
	balancing: 'Load balancing',
	edge: 'Edge',
	services: 'Services',
	async: 'Background',
	data: 'Data',
	external: 'Outside',
};

/** Whether a system's design is its real one, said up front wherever it's shown. */
export const basisLabel: Record<System['basis'], string> = {
	inspired: 'Simplified, from public talks',
	real: 'Real architecture',
	example: 'Made up to teach',
};

/** Green when nearly everything succeeds quickly, amber when slow, red when failing. */
export function journeyColor(state: JourneyState) {
	if (state.success < 0.99) return statusColor.overloaded;
	if (state.latencyMs > SLOW_MS) return statusColor.busy;
	return statusColor.ok;
}
