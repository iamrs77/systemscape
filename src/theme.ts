import type { ComponentKind, Layer } from '@/model/schema';
import type { JourneyState, Status } from '@/sim/engine';
import { SLOW_MS } from '@/sim/insights';

/** Colours shared by the 3D scene and the panels, so a status looks the same in both. */
export const statusColor: Record<Status, string> = {
	idle: '#64748b',
	ok: '#34d399',
	busy: '#fbbf24',
	overloaded: '#f87171',
	down: '#52525b',
};

export const statusLabel: Record<Status, string> = {
	idle: 'Idle',
	ok: 'Healthy',
	busy: 'Busy',
	overloaded: 'Overloaded',
	down: 'Down',
};

export const sceneColor = {
	background: '#070b16',
	client: '#818cf8',
	row: '#111a2e',
	edge: '#7dd3fc',
	edgeAsync: '#a78bfa',
	edgeIdle: '#1e293b',
	failing: '#f87171',
	breaker: '#f59e0b',
	packet: '#67e8f9',
	packetAsync: '#c4b5fd',
	selected: '#f8fafc',
} as const;

export const kindLabel: Record<ComponentKind, string> = {
	client: 'App',
	cdn: 'CDN',
	gateway: 'Gateway',
	service: 'Service',
	worker: 'Background worker',
	cache: 'Cache',
	database: 'Database',
	queue: 'Queue',
	stream: 'Event stream',
	storage: 'File storage',
	external: 'Outside provider',
};

export const layerLabel: Record<Layer, string> = {
	clients: 'Apps',
	edge: 'Edge',
	services: 'Services',
	async: 'Background',
	data: 'Data',
	external: 'Outside',
};

/** Green when nearly everything succeeds quickly, amber when slow, red when failing. */
export function journeyColor(state: JourneyState) {
	if (state.success < 0.99) return statusColor.overloaded;
	if (state.latencyMs > SLOW_MS) return statusColor.busy;
	return statusColor.ok;
}
