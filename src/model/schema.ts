import { z } from 'zod';

/**
 * The data format for a system. Each system in src/systems is one of these,
 * checked by `parseSystem` so a typo fails the tests, not the 3D scene.
 */

export const componentKinds = [
	'client',
	'cdn',
	'balancer',
	'gateway',
	'service',
	'worker',
	'cache',
	'database',
	'queue',
	'stream',
	'storage',
	'notifier',
	'external',
] as const;
export type ComponentKind = (typeof componentKinds)[number];

// front to back: clients nearest the camera, outside providers furthest away
export const layers = [
	'clients',
	'balancing',
	'edge',
	'services',
	'async',
	'data',
	'external',
] as const;
export type Layer = (typeof layers)[number];

const id = z.string().regex(/^[a-z0-9-]+$/, 'ids are lower-case words joined by dashes');
const text = z.string().trim().min(1);

export const componentSchema = z.object({
	id,
	name: text,
	kind: z.enum(componentKinds),
	layer: z.enum(layers),
	/** What it does, in a sentence. */
	summary: text,
	/** Why the design needs it. */
	why: text,
	/** What users notice when it fails. */
	onFailure: text,
	/** How it grows with traffic. */
	scaling: text,
	/** Requests per second one instance handles. Clients don't have a limit. */
	capacityPerInstance: z.number().positive().optional(),
	instances: z.number().int().positive().default(1),
	/** Autoscaling stops here. Without it, the component can't add instances by itself. */
	maxInstances: z.number().int().positive().optional(),
	/** Time to handle one request when it isn't busy. */
	latencyMs: z.number().nonnegative().default(0),
	/** Caches and CDNs: the share of requests answered without going further. */
	hitRate: z.number().min(0).max(1).optional(),
});
export type Component = z.output<typeof componentSchema>;

export const hopSchema = z.object({
	from: id,
	to: id,
	/** What's sent, e.g. "find drivers nearby". */
	label: text,
	/** async: handed off, and the user doesn't wait for it. */
	mode: z.enum(['sync', 'async']).default('sync'),
	/** Only happens when `from` (a cache) can't answer by itself. */
	onMiss: z.boolean().default(false),
	/** The share of requests that make this call, e.g. 0.3. */
	share: z.number().min(0).max(1).default(1),
	/** Calls per request, e.g. 3 when a request asks three drivers. */
	calls: z.number().positive().default(1),
	/** How many times the caller tries again when the call fails. */
	retries: z.number().int().min(0).max(5).default(0),
	/** The request still succeeds without it (graceful degradation), e.g. a ride shown without an ETA. */
	optional: z.boolean().default(false),
	/**
	 * What one real request sends at this step, for the lessons: a sentence,
	 * and the details that travel (and an `answer` that comes back).
	 */
	example: z
		.object({ says: text, data: z.record(z.string(), z.string()).default({}) })
		.optional(),
});
export type Hop = z.output<typeof hopSchema>;

export const journeySchema = z.object({
	id,
	name: text,
	description: text,
	/** Requests per second at normal (1×) traffic. */
	rps: z.number().positive(),
	/** The person the lessons follow through this journey, e.g. "Rohit". */
	person: text.optional(),
	/** Sets the scene for the lesson: who, where, when. */
	story: text.optional(),
	/** In the order they happen. Each hop starts from the client or a component reached earlier. */
	hops: z.array(hopSchema).min(1),
	/**
	 * The scenario its lesson ends on, to show what can go wrong with it. By
	 * default, the one that's hardest on it.
	 */
	scenario: id.optional(),
});
export type Journey = z.output<typeof journeySchema>;

export const presetSchema = z.object({
	id,
	name: text,
	description: text,
	/** Multiplies every journey's traffic. */
	traffic: z.number().positive(),
	/** Extra multipliers for some journeys, e.g. more ride requests when it rains. */
	journeyTraffic: z.record(z.string(), z.number().positive()).default({}),
	/** Arrives within minutes: autoscaling is too slow to help, only scaling ahead of time does. */
	sudden: z.boolean().default(false),
	/** Parts that have stopped working, e.g. a cache that restarted or an outside provider's outage. */
	down: z.array(id).default([]),
});
export type Preset = z.output<typeof presetSchema>;

export const systemSchema = z.object({
	id,
	name: text,
	tagline: text,
	/** inspired: a simplified design based on public talks and posts, not anyone's actual system. */
	basis: z.enum(['real', 'inspired']),
	description: z.array(text).min(1),
	sources: z
		.array(z.object({ title: text, url: z.url(), publisher: text.optional() }))
		.default([]),
	decisions: z.array(z.object({ title: text, detail: text })).default([]),
	components: z.array(componentSchema).min(2),
	journeys: z.array(journeySchema).min(1),
	presets: z.array(presetSchema).min(1),
});
export type System = z.output<typeof systemSchema>;
export type SystemInput = z.input<typeof systemSchema>;
