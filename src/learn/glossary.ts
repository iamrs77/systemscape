import type { System } from '@/model/schema';

/**
 * The words system design uses, each explained in a line for someone new to
 * it, and an everyday comparison where one helps. One list, shared by every
 * system: lesson text is matched against it, and the first time a word
 * appears on a card it's underlined, to tap for its meaning.
 */

export type Term = {
	id: string;
	/** How it's written as a heading. */
	term: string;
	/** What it means, in a line. */
	meaning: string;
	/** An everyday comparison, when one helps. */
	like?: string;
	/** The ways it's written in text, in lower case: plurals, other words for it. */
	forms: string[];
};

export const glossary: Term[] = [
	{
		id: 'request',
		term: 'Request',
		meaning:
			'A message an app sends to a server, asking it to do something or send something back, like “find me a driver”.',
		like: 'Ordering at a counter: you ask, you wait, you get an answer.',
		forms: ['request', 'requests'],
	},
	{
		id: 'server',
		term: 'Server',
		meaning:
			'A computer in a data centre that runs part of the backend, answering requests day and night.',
		forms: ['server', 'servers'],
	},
	{
		id: 'backend',
		term: 'Backend',
		meaning:
			'Everything behind an app that you never see: the computers and programs that store things and do the work.',
		like: 'The kitchen behind a restaurant’s dining room.',
		forms: ['backend', 'back end'],
	},
	{
		id: 'client',
		term: 'Client',
		meaning:
			'The app on someone’s phone or computer: it sends requests to the backend and shows the answers.',
		forms: ['client', 'clients'],
	},
	{
		id: 'service',
		term: 'Service',
		meaning:
			'A program with one job, like working out fares. A big app is many services sending requests to each other.',
		like: 'Departments in a company, each doing its own part of the work.',
		forms: ['service', 'services', 'microservice', 'microservices'],
	},
	{
		id: 'api',
		term: 'API',
		meaning:
			'The requests a part accepts, and what it sends back: the agreed way programs talk to each other.',
		like: 'A restaurant’s menu: what you can order, and what you’ll get.',
		forms: ['api', 'apis'],
	},
	{
		id: 'gateway',
		term: 'Gateway',
		meaning:
			'The single front door for requests from the apps. It checks who’s calling, then passes each request on to the right service.',
		like: 'A reception desk that checks visitors in and sends them to the right office.',
		forms: ['gateway', 'gateways'],
	},
	{
		id: 'copy',
		term: 'Copy (instance)',
		meaning:
			'One running copy of a service. Run more copies, on more servers, and they share the work, so more requests can be handled.',
		like: 'Opening more checkout tills when the shop gets busy.',
		forms: ['copy', 'copies', 'instance', 'instances'],
	},
	{
		id: 'scaling',
		term: 'Scaling',
		meaning:
			'Making a system handle more. Usually by adding copies (scaling out) rather than buying one bigger computer (scaling up).',
		forms: ['scaling', 'scale', 'scales', 'scaled', 'scale out', 'scale up'],
	},
	{
		id: 'autoscaling',
		term: 'Autoscaling',
		meaning:
			'Adding copies of a service automatically when it gets busy, and removing them when it’s quiet. It takes a few minutes to kick in.',
		like: 'A shop calling in extra staff when the queues grow.',
		forms: ['autoscaling', 'autoscale', 'autoscales', 'autoscaled'],
	},
	{
		id: 'load',
		term: 'Load',
		meaning: 'How much work is arriving at a part right now, counted in requests a second.',
		forms: ['load'],
	},
	{
		id: 'traffic',
		term: 'Traffic',
		meaning: 'How many people are using the app at once, and so how many requests arrive.',
		forms: ['traffic'],
	},
	{
		id: 'capacity',
		term: 'Capacity',
		meaning: 'The most a part can handle: how many requests a second, before it slows down.',
		forms: ['capacity'],
	},
	{
		id: 'overloaded',
		term: 'Overloaded',
		meaning:
			'Asked to do more than it can. Requests queue up, everything slows down, and some requests fail.',
		forms: ['overloaded', 'overload', 'overloads'],
	},
	{
		id: 'bottleneck',
		term: 'Bottleneck',
		meaning: 'The part that runs out of room first, and so holds everything else back.',
		like: 'The narrow neck of a bottle: however big the bottle, it only pours so fast.',
		forms: ['bottleneck', 'bottlenecks'],
	},
	{
		id: 'latency',
		term: 'Latency',
		meaning: 'How long a request takes: the wait from asking to getting the answer.',
		forms: ['latency', 'latencies'],
	},
	{
		id: 'ms',
		term: 'Millisecond (ms)',
		meaning: 'A thousandth of a second. A blink takes about 100 ms.',
		forms: ['ms', 'millisecond', 'milliseconds'],
	},
	{
		id: 'throughput',
		term: 'Throughput',
		meaning: 'How much work a part gets through each second.',
		forms: ['throughput'],
	},
	{
		id: 'timeout',
		term: 'Timeout',
		meaning:
			'How long a caller waits for an answer before giving up and counting the call as failed.',
		forms: ['timeout', 'timeouts', 'times out', 'timed out'],
	},
	{
		id: 'retry',
		term: 'Retry',
		meaning:
			'Trying a failed call again. It hides brief blips, but adds even more load to a part that’s already struggling.',
		forms: ['retry', 'retries', 'retried', 'retrying', 'tried again'],
	},
	{
		id: 'circuit-breaker',
		term: 'Circuit breaker',
		meaning:
			'A safety switch: once a part keeps failing, callers stop calling it for a while and answer straight away instead of waiting.',
		like: 'A fuse that trips, so one faulty plug doesn’t take down the whole house.',
		forms: ['circuit breaker', 'circuit breakers'],
	},
	{
		id: 'graceful-degradation',
		term: 'Graceful degradation',
		meaning:
			'Still working when a part fails, just a little worse: say, showing a ride without its arrival time.',
		forms: ['graceful degradation', 'degraded', 'degrades'],
	},
	{
		id: 'fall-back',
		term: 'Fall back',
		meaning: 'Use a simpler answer when the best one isn’t available.',
		like: 'Taking the main road when the satnav can’t load the traffic.',
		forms: ['fall back', 'falls back', 'fell back', 'fallback'],
	},
	{
		id: 'database',
		term: 'Database',
		meaning:
			'Where data is kept for good, organised so it can be found again quickly and survives a restart.',
		like: 'A well-labelled filing cabinet.',
		forms: ['database', 'databases'],
	},
	{
		id: 'in-memory',
		term: 'In memory',
		meaning:
			'Kept in a computer’s working memory (RAM): hundreds of times faster to read than disk, but gone if the machine restarts.',
		like: 'Notes on your desk, rather than files in the basement.',
		forms: ['in memory', 'in-memory', 'memory'],
	},
	{
		id: 'disk',
		term: 'Disk',
		meaning: 'Long-term storage that keeps data when the power goes off. Slower than memory.',
		forms: ['disk', 'disks', 'on disk'],
	},
	{
		id: 'index',
		term: 'Index',
		meaning:
			'A lookup that points straight to the data you want, so nothing has to be searched through one by one.',
		like: 'The index at the back of a book: it tells you the page, so you don’t read them all.',
		forms: ['index', 'indexes', 'indices'],
	},
	{
		id: 'shard',
		term: 'Shard',
		meaning:
			'One slice of data that’s too big for one machine. Each shard holds part of it, say one area of the city, on its own server.',
		like: 'A phone book split into A to M and N to Z, so two people can look things up at once.',
		forms: ['shard', 'shards', 'sharded', 'sharding'],
	},
	{
		id: 'partition',
		term: 'Partition',
		meaning: 'Another word for a shard: one slice of the data, kept and handled separately.',
		forms: ['partition', 'partitions', 'partitioned'],
	},
	{
		id: 'replica',
		term: 'Replica',
		meaning:
			'An exact copy of a database kept on another machine, so a breakdown doesn’t lose data and reading can be shared.',
		forms: ['replica', 'replicas', 'replicated', 'replication'],
	},
	{
		id: 'cache',
		term: 'Cache',
		meaning:
			'A small, fast store of recent answers, so the same question is answered again without doing the slow work.',
		like: 'Keeping the things you use most on your desk instead of in the cupboard.',
		forms: ['cache', 'caches', 'cached', 'caching'],
	},
	{
		id: 'cache-miss',
		term: 'Cache miss',
		meaning:
			'When the cache doesn’t have the answer, so the slow work has to be done after all.',
		forms: ['cache miss', 'cache misses'],
	},
	{
		id: 'hit-rate',
		term: 'Hit rate',
		meaning: 'The share of questions a cache answers by itself, without the slow work.',
		forms: ['hit rate'],
	},
	{
		id: 'queue',
		term: 'Queue',
		meaning:
			'A waiting line of work: jobs are added at one end and handled in order from the other.',
		forms: ['queue', 'queues', 'queued'],
	},
	{
		id: 'event-stream',
		term: 'Event stream',
		meaning:
			'A running log of things that happened (a trip ended, a driver moved) that any part can read, now or later.',
		like: 'A noticeboard: you pin up news once, and everyone who cares reads it.',
		forms: ['event stream', 'event streams', 'stream', 'streams'],
	},
	{
		id: 'publish',
		term: 'Publish',
		meaning:
			'Announce that something happened by adding it to an event stream, for whichever parts need it.',
		forms: ['publish', 'publishes', 'published', 'publishing'],
	},
	{
		id: 'background',
		term: 'Background work',
		meaning:
			'Work done after the user already has their answer, so nobody waits for it. Also called asynchronous (async).',
		like: 'A waiter taking your payment after you’ve left the table, not while you eat.',
		forms: ['background', 'async', 'asynchronous'],
	},
	{
		id: 'synchronous',
		term: 'Synchronous',
		meaning: 'The caller waits for the answer before carrying on.',
		forms: ['synchronous'],
	},
	{
		id: 'worker',
		term: 'Worker',
		meaning:
			'A program that does background work, taking jobs from a queue or stream one after another.',
		forms: ['worker', 'workers'],
	},
	{
		id: 'real-time',
		term: 'Real time',
		meaning: 'Happening as it happens, within a second or so: like the car moving on your map.',
		forms: ['real-time', 'real time', 'realtime'],
	},
	{
		id: 'live-connection',
		term: 'Live connection',
		meaning:
			'A connection between an app and a server that stays open, so the server can send updates the moment they happen. Often a WebSocket.',
		like: 'A phone call that stays connected, instead of texting “any news?” every few seconds.',
		forms: [
			'live connection',
			'live connections',
			'open connection',
			'open connections',
			'websocket',
			'websockets',
		],
	},
	{
		id: 'polling',
		term: 'Polling',
		meaning:
			'An app asking “anything new?” again and again. Simple, but wasteful when the answer is usually no.',
		forms: ['polling', 'poll', 'polls', 'polled'],
	},
	{
		id: 'map-cell',
		term: 'Map cell',
		meaning:
			'The city map is cut into small cells (here, hexagons), so finding nearby drivers means checking a few cells, not the whole city.',
		like: 'Looking for a friend in one block of a stadium, not every seat.',
		forms: ['map cell', 'map cells', 'cell', 'cells', 'hexagon', 'hexagons'],
	},
	{
		id: 'eta',
		term: 'ETA',
		meaning: 'Estimated time of arrival: how long until the driver reaches you.',
		forms: ['eta', 'etas'],
	},
	{
		id: 'routing',
		term: 'Routing',
		meaning: 'Working out the best way along real roads, and how long it will take.',
		forms: ['routing'],
	},
	{
		id: 'ledger',
		term: 'Ledger',
		meaning:
			'A record of every payment, where each amount in has a matching amount out, so mistakes show up.',
		forms: ['ledger', 'ledgers'],
	},
	{
		id: 'idempotent',
		term: 'Idempotent',
		meaning:
			'Safe to do twice: repeating it has the same effect as doing it once, so a retry can’t charge someone double.',
		forms: ['idempotent', 'idempotency'],
	},
	{
		id: 'load-balancer',
		term: 'Load balancer',
		meaning:
			'Spreads incoming requests across the copies of a service, so none of them gets swamped.',
		forms: ['load balancer', 'load balancers'],
	},
	{
		id: 'cdn',
		term: 'CDN',
		meaning:
			'Servers spread around the world that keep copies of files close to people, so they load fast.',
		forms: ['cdn', 'cdns'],
	},
];

export const termById = new Map(glossary.map((t) => [t.id, t]));

const named = new WeakMap<System, string[]>();

/**
 * The names in a system that aren't glossary words, even when they contain
 * one: its own name and its journeys' ("Request a ride" isn't a request).
 * Parts' names aren't here: "Driver location index" is an index, and saying
 * what an index is helps.
 */
export function namesOf(system: System): string[] {
	let names = named.get(system);
	if (!names) {
		names = [system.name, ...system.journeys.map((j) => j.name)];
		named.set(system, names);
	}
	return names;
}

const idOfForm = new Map(glossary.flatMap((t) => t.forms.map((f) => [f, t.id] as const)));

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Matches any phrase in the list as whole words, longest first: "circuit breakers" before "breakers". */
function phrases(list: string[]) {
	const sorted = [...new Set(list)].sort((a, b) => b.length - a.length).map(escape);
	return `(?<![\\p{L}\\p{N}-])(?:${sorted.join('|')})(?![\\p{L}\\p{N}-])`;
}

const termPattern = phrases(glossary.flatMap((t) => t.forms));

/** A piece of text: plain, bold (the name of a part), or a word from the glossary. */
export type Piece =
	| { kind: 'text'; text: string; strong?: boolean }
	| { kind: 'term'; text: string; id: string; strong?: boolean };

/**
 * Splits texts into pieces, marking the first time each glossary word
 * appears across all of them (the same word again stays plain, so a card
 * isn't covered in underlines). **Bold** (a part's name) stays bold, and its
 * words are explained too: "Driver location **index**". The names given are
 * left alone: "Request a ride" is a journey, not a request.
 */
export function annotate(texts: string[], names: string[] = []): Piece[][] {
	const seen = new Set<string>();
	const named = names.length ? `(${phrases(names)})|` : '';
	const pattern = new RegExp(`${named}(${termPattern})`, 'giu');
	const nameGroup = names.length ? 1 : -1;

	return texts.map((text) => {
		const pieces: Piece[] = [];
		const add = (piece: Piece) => {
			const last = pieces.at(-1);
			if (piece.kind === 'text' && last?.kind === 'text' && last.strong === piece.strong) {
				last.text += piece.text;
			} else if (piece.text) pieces.push(piece);
		};
		text.split(/\*\*(.+?)\*\*/g).forEach((part, i) => {
			const strong = i % 2 === 1 || undefined;
			let from = 0;
			for (const match of part.matchAll(pattern)) {
				const start = match.index;
				add({ kind: 'text', text: part.slice(from, start), strong });
				from = start + match[0].length;
				const id = match[nameGroup] ? undefined : idOfForm.get(match[0].toLowerCase());
				if (id && !seen.has(id)) {
					seen.add(id);
					add({ kind: 'term', text: match[0], id, strong });
				} else {
					add({ kind: 'text', text: match[0], strong });
				}
			}
			add({ kind: 'text', text: part.slice(from), strong });
		});
		return pieces;
	});
}
