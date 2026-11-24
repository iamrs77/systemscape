# Adding a system

A system is one TypeScript file in `src/systems`, exporting a plain object. There's no code to write: the diagram, the lessons, the simulation and the panels all come from the data. `src/systems/rideHailing.ts`, `src/systems/videoStreaming.ts` and `src/systems/upiPayments.ts` are complete examples, and `src/systems/stockroom.ts` is one drawn from a real codebase (`basis: 'real'`).

## 1. Describe it

```ts
export const videoStreaming: SystemInput = {
	id: 'video-streaming',
	name: 'Video streaming',
	tagline: 'Getting a film to millions of screens without buffering.',
	basis: 'inspired', // or 'real', for a system whose actual design you can show
	description: ['What it does, in a paragraph or two.', 'What’s simplified.'],
	sources: [{ title: '…', url: 'https://…', publisher: 'Netflix Tech Blog, 2023' }],
	decisions: [{ title: 'Videos are cut into short chunks', detail: 'Why, and the cost.' }],
	rows: { edge: 'What the front door does in this system, if the general sentence doesn’t fit.' },
	components: [...],
	journeys: [...],
	presets: [...],
};
```

`rows` is optional: the big-picture lesson introduces each row of the diagram with a general sentence, and `rows` replaces it where this system needs its own (the video app's front door has a second door, the CDN).

Use `basis: 'inspired'` and say so in the description unless the design is truly yours to show. Every fact in `decisions` and in the components' text should come from a listed source, or be clearly a simplification ([ADR 0005](adr/0005-honest-about-sources.md)).

## 2. Components

```ts
{
	id: 'origin-storage',
	name: 'Origin storage',
	kind: 'storage',     // client, cdn, balancer, gateway, service, worker, cache, database, queue, stream, storage, external
	layer: 'data',       // the row it sits in: clients, balancing, edge, services, async, data, external
	summary: 'What it does, in a sentence.',
	why: 'Why the design needs it.',
	onFailure: 'What users notice when it fails.',
	scaling: 'How it grows with traffic.',
	capacityPerInstance: 5_000, // requests a second one instance handles (not for clients)
	instances: 4,
	maxInstances: 40,    // leave out for parts that don't autoscale (databases, streams, outside providers)
	latencyMs: 20,       // when it isn't busy
	hitRate: 0.95,       // caches and CDNs only
}
```

`kind` picks how it's drawn (one block with the icon for its kind; a cylinder for a database, a phone for an app) and `layer` the row. Within a row, components are placed near what they connect to; declaring them in a sensible order helps when there's a tie.

## 3. Journeys

A journey is something people do, with its requests per second at normal traffic and its hops in the order they happen. Each hop starts from the client or a component an earlier hop reached.

```ts
{
	id: 'start-watching',
	name: 'Press play',
	description: 'The app asks where to stream from, then fetches the first chunks.',
	rps: 3_000,
	person: 'Meera',
	story: 'It’s 8 pm on a Friday. Meera picks a film and presses play.',
	hops: [
		{
			from: 'tv-app',
			to: 'api-gateway',
			label: 'Play this title',
			example: {
				says: 'Meera’s TV asks to start the film.',
				data: { viewer: 'Meera', title: 'Kantara', quality: '4K' },
			},
		},
		{ from: 'api-gateway', to: 'playback-service', label: 'Pick a server' },
		{ from: 'playback-service', to: 'recommendations', label: 'What’s next', optional: true },
		{ from: 'tv-app', to: 'edge-cache', label: 'First chunks' },
		{ from: 'edge-cache', to: 'origin-storage', label: 'Not cached here', onMiss: true },
		{ from: 'playback-service', to: 'events', label: 'Started watching', mode: 'async' },
	],
}
```

| Hop field  | Meaning                                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `label`    | What's sent, shown in the journey's steps.                                                                                             |
| `mode`     | `'async'`: handed off; the user doesn't wait, and failures count as background work failing.                                           |
| `optional` | The request still succeeds without it (graceful degradation).                                                                          |
| `onMiss`   | Only happens when `from`, a cache, can't answer.                                                                                       |
| `share`    | The share of requests that make this call (default 1).                                                                                 |
| `calls`    | Calls per request, e.g. 5 when asking about five drivers (default 1).                                                                  |
| `retries`  | How many times a failed call is tried again (0 to 5).                                                                                  |
| `example`  | What one real request sends here, for the lessons: `says` (a sentence) and `data` (the details, with an `answer` for what comes back). |

A journey's `person` and `story` are optional too: with them, its lesson follows that person (“Meera waits for this”) and opens with the scene.

## 4. Scenarios

```ts
presets: [
	{ id: 'normal', name: 'Normal evening', description: '…', traffic: 1 },
	{ id: 'final', name: 'Cup final', description: '…', traffic: 3,
	  journeyTraffic: { 'start-watching': 8 }, sudden: true },
	{ id: 'cdn-down', name: 'The CDN goes down', description: '…', traffic: 1,
	  down: ['edge-cache'] },
],
```

The first preset is where the system starts. A scenario can make more traffic (`traffic`, and `journeyTraffic` for some journeys), make it arrive too fast for autoscaling (`sudden`), or take parts down (`down`).

Each journey's lesson ends on a scenario: the one named by the journey's `scenario`, or else the one that's hardest on it. Name one per journey when you can, so each lesson shows something different: a rush, a cache restarting, an outside provider's outage.

## 5. Register it and check it

Add it to `systems` in `src/systems/index.ts` (and take it off `comingSoon`).

`parseSystem` runs when the app loads, and lists every problem at once: a hop to a component that doesn't exist, a hop from somewhere the journey hasn't reached, a cache without a hit rate. Then tune capacities until the scenarios tell the story you want: open Explore freely on each one, and the panel beside the diagram says what's failing and why. The normal scenario should run without failures.
