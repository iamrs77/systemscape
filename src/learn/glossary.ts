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
			'A message an app sends to a server to ask for something, like “find me a driver” or “how much will this trip cost?”',
		like: 'Asking for something at a shop counter, then waiting for the answer.',
		forms: ['request', 'requests'],
	},
	{
		id: 'server',
		term: 'Server',
		meaning:
			'A computer that stays on day and night, waiting for requests from apps and answering them. Big apps use thousands of them.',
		forms: ['server', 'servers'],
	},
	{
		id: 'backend',
		term: 'Backend',
		meaning:
			'The part of an app you never see. It’s the servers and programs that store the data and do the real work.',
		like: 'A restaurant’s kitchen, where the food is made out of sight.',
		forms: ['backend', 'back end'],
	},
	{
		id: 'client',
		term: 'Client',
		meaning:
			'The app on someone’s phone, like the rider app or the driver app. It sends requests to the servers and shows the answers.',
		like: 'A customer in a shop, and the server is the shop assistant who serves them.',
		forms: ['client', 'clients'],
	},
	{
		id: 'service',
		term: 'Service',
		meaning:
			'A program with one job, like working out fares or finding drivers. A big app is many services that send requests to each other.',
		like: 'The departments of a company, each doing its own part of the work.',
		forms: ['service', 'services', 'microservice', 'microservices'],
	},
	{
		id: 'api',
		term: 'API',
		meaning:
			'The agreed way programs talk to each other. It lists the requests a program accepts and what it sends back.',
		like: 'A restaurant’s menu, which shows what you can order and what you’ll get.',
		forms: ['api', 'apis'],
	},
	{
		id: 'gateway',
		term: 'Gateway',
		meaning:
			'The one front door for all requests from the apps. It checks who is asking, then sends each request to the right service.',
		like: 'A reception desk that checks visitors in and sends them to the right office.',
		forms: ['gateway', 'gateways'],
	},
	{
		id: 'copy',
		term: 'Copy (instance)',
		meaning:
			'One running copy of a service, on its own server. More copies share the work, so the app can answer more requests at once.',
		like: 'Opening more checkouts when a shop gets busy.',
		forms: ['copy', 'copies', 'instance', 'instances'],
	},
	{
		id: 'scaling',
		term: 'Scaling',
		meaning:
			'Making the app able to handle more users. You can add more copies, called scaling out, or use a bigger computer, called scaling up.',
		like: 'A bakery making more bread by adding ovens, or by buying one much bigger oven.',
		forms: ['scaling', 'scale', 'scales', 'scaled', 'scale out', 'scale up'],
	},
	{
		id: 'autoscaling',
		term: 'Autoscaling',
		meaning:
			'The app adds copies of a service by itself when it gets busy, and removes them when it’s quiet. New copies take a few minutes to start.',
		like: 'A shop calling in extra staff when the queues grow, though they take a while to arrive.',
		forms: ['autoscaling', 'autoscale', 'autoscales', 'autoscaled'],
	},
	{
		id: 'load',
		term: 'Load',
		meaning: 'How much work a part is getting right now, counted in requests each second.',
		forms: ['load'],
	},
	{
		id: 'traffic',
		term: 'Traffic',
		meaning:
			'How many people are using the app at once, and so how many requests come in. Here it doesn’t mean cars on the road.',
		forms: ['traffic'],
	},
	{
		id: 'capacity',
		term: 'Capacity',
		meaning:
			'The most work a part can handle, in requests each second, before it starts to slow down.',
		like: 'A lift that holds eight people, so the ninth has to wait for the next one.',
		forms: ['capacity'],
	},
	{
		id: 'overloaded',
		term: 'Overloaded',
		meaning:
			'Getting more work than it can handle. Requests wait in line, everything slows down, and some requests fail.',
		like: 'A kitchen with more orders than it can cook, so food comes late or not at all.',
		forms: ['overloaded', 'overload', 'overloads'],
	},
	{
		id: 'bottleneck',
		term: 'Bottleneck',
		meaning:
			'The slowest or busiest part, which holds everything else back. Speeding up other parts won’t help until this one is fixed.',
		like: 'The narrow neck of a bottle, which limits how fast it pours, however big the bottle is.',
		forms: ['bottleneck', 'bottlenecks'],
	},
	{
		id: 'latency',
		term: 'Latency',
		meaning:
			'How long you wait for an answer, from sending a request to getting the reply. Lower is better.',
		like: 'The time between ordering food and it arriving at your table.',
		forms: ['latency', 'latencies'],
	},
	{
		id: 'ms',
		term: 'Millisecond (ms)',
		meaning: 'One thousandth of a second. A quick blink of an eye takes about 100 ms.',
		forms: ['ms', 'millisecond', 'milliseconds'],
	},
	{
		id: 'throughput',
		term: 'Throughput',
		meaning:
			'How many requests a part finishes each second. If more arrive than it can finish, the rest have to wait.',
		like: 'How many cars get through a toll gate each minute.',
		forms: ['throughput'],
	},
	{
		id: 'timeout',
		term: 'Timeout',
		meaning:
			'The longest a part will wait for an answer. After that, it gives up and treats the request as failed.',
		like: 'Hanging up when the phone has rung for a minute with no answer.',
		forms: ['timeout', 'timeouts', 'times out', 'timed out'],
	},
	{
		id: 'retry',
		term: 'Retry',
		meaning:
			'Sending a failed request again. It helps when the problem was brief, but adds more work to a part that’s already struggling.',
		like: 'Calling again when a call doesn’t go through, which makes the lines even busier if everyone does it.',
		forms: ['retry', 'retries', 'retried', 'retrying', 'tried again'],
	},
	{
		id: 'circuit-breaker',
		term: 'Circuit breaker',
		meaning:
			'A safety switch. When a part keeps failing, the others stop asking it for a while, so nobody waits on it and it gets time to recover.',
		like: 'A fuse that switches off one faulty socket, so the rest of the house keeps its power.',
		forms: ['circuit breaker', 'circuit breakers'],
	},
	{
		id: 'graceful-degradation',
		term: 'Graceful degradation',
		meaning:
			'When a part breaks, the app keeps working, just not as well. For example, riders still get a car but see no arrival time.',
		like: 'A shop whose card machine is down, so it takes cash only but stays open.',
		forms: ['graceful degradation', 'degraded', 'degrades'],
	},
	{
		id: 'fall-back',
		term: 'Fall back',
		meaning:
			'Using a simpler answer when the best one isn’t available. For example, picking drivers by straight-line distance when road times can’t be worked out.',
		like: 'Taking your usual road home when your map app won’t load.',
		forms: ['fall back', 'falls back', 'fell back', 'fallback'],
	},
	{
		id: 'database',
		term: 'Database',
		meaning:
			'Where the app keeps its data safely for a long time, like riders, trips and payments. It’s organised so things can be found quickly.',
		like: 'A big, well-labelled filing cabinet.',
		forms: ['database', 'databases'],
	},
	{
		id: 'in-memory',
		term: 'In memory',
		meaning:
			'Kept in a computer’s working memory. It’s very fast to read, but it’s lost if the computer turns off or restarts.',
		like: 'Writing on a whiteboard, which is quick to read but gets wiped at the end of the day.',
		forms: ['in memory', 'in-memory', 'memory'],
	},
	{
		id: 'disk',
		term: 'Disk',
		meaning:
			'Storage that keeps data even when the computer turns off. It’s safe, but slower to read than the computer’s working memory.',
		like: 'Writing in a notebook, which is slower than a whiteboard but keeps your notes.',
		forms: ['disk', 'disks', 'on disk'],
	},
	{
		id: 'index',
		term: 'Index',
		meaning:
			'A list that points straight to the data you want, so the computer doesn’t have to check every item one by one.',
		like: 'The index at the back of a book, which tells you the page so you don’t read every page.',
		forms: ['index', 'indexes', 'indices'],
	},
	{
		id: 'shard',
		term: 'Shard',
		meaning:
			'When there’s too much data for one server, it’s split into pieces called shards. Each one holds one part, like one area of the city.',
		like: 'A dictionary printed as two books, A to M and N to Z, so two people can look up words at once.',
		forms: ['shard', 'shards', 'sharded', 'sharding'],
	},
	{
		id: 'partition',
		term: 'Partition',
		meaning:
			'Another word for a shard. It’s one piece of the data, kept and handled on its own.',
		forms: ['partition', 'partitions', 'partitioned'],
	},
	{
		id: 'replica',
		term: 'Replica',
		meaning:
			'An exact copy of a database, kept on another server. If one server breaks, no data is lost, and the copies share the work of reading.',
		like: 'Several copies of the same textbook, so more students can read at once and losing one doesn’t matter.',
		forms: ['replica', 'replicas', 'replicated', 'replication'],
	},
	{
		id: 'cache',
		term: 'Cache',
		meaning:
			'A small, fast place that keeps recent answers. When the same question comes again, the answer is ready without doing the slow work.',
		like: 'Keeping the things you use most on your desk, instead of in the cupboard.',
		forms: ['cache', 'caches', 'cached', 'caching'],
	},
	{
		id: 'cache-miss',
		term: 'Cache miss',
		meaning:
			'When the cache doesn’t have the answer, so the slow work has to be done after all.',
		like: 'Finding that the thing you need isn’t on your desk, so you go to the cupboard.',
		forms: ['cache miss', 'cache misses'],
	},
	{
		id: 'hit-rate',
		term: 'Hit rate',
		meaning:
			'How often the cache already has the answer. A 90% hit rate means 9 in 10 questions skip the slow work.',
		forms: ['hit rate'],
	},
	{
		id: 'queue',
		term: 'Queue',
		meaning:
			'A line of jobs waiting their turn. New jobs join at the back, and they’re handled in order from the front.',
		like: 'People waiting at a ticket counter, where whoever came first is served first.',
		forms: ['queue', 'queues', 'queued'],
	},
	{
		id: 'event-stream',
		term: 'Event stream',
		meaning:
			'A long list of everything that happens, in order, like every driver location and trip change. Other parts read it when they’re ready.',
		like: 'A notice board where news is pinned in order, and anyone can come and read it later.',
		forms: ['event stream', 'event streams', 'stream', 'streams'],
	},
	{
		id: 'publish',
		term: 'Publish',
		meaning:
			'Adding a note to the event stream that something happened, like “a trip ended”, so any part that needs it can read it.',
		like: 'Pinning a new notice on the notice board.',
		forms: ['publish', 'publishes', 'published', 'publishing'],
	},
	{
		id: 'background',
		term: 'Background work',
		meaning:
			'Work done after the user already has their answer, so nobody waits for it. It’s also called async, short for asynchronous.',
		like: 'Leaving your clothes at the laundry and going home, instead of waiting while they’re washed.',
		forms: ['background', 'async', 'asynchronous'],
	},
	{
		id: 'synchronous',
		term: 'Synchronous',
		meaning:
			'The part that asks waits for the answer before it does anything else. It’s the opposite of background work.',
		like: 'Waiting at the counter until your coffee is ready.',
		forms: ['synchronous'],
	},
	{
		id: 'worker',
		term: 'Worker',
		meaning:
			'A program that does background work. It takes jobs from a queue or the event stream, one after another.',
		forms: ['worker', 'workers'],
	},
	{
		id: 'real-time',
		term: 'Real time',
		meaning:
			'Updated straight away, within a second or so. For example, you watch the driver’s car move on the map as it drives.',
		like: 'Watching a match live on TV, instead of the highlights later.',
		forms: ['real-time', 'real time', 'realtime'],
	},
	{
		id: 'live-connection',
		term: 'Live connection',
		meaning:
			'A line kept open between a phone and a server, so either side can send something the moment it happens. One common kind is a WebSocket.',
		like: 'A phone call that stays connected, instead of sending a new letter each time.',
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
			'The app asking the server “anything new?” again and again. It’s simple, but wasteful, because the answer is usually no.',
		like: 'A child in the car asking “are we there yet?” every five minutes.',
		forms: ['polling', 'poll', 'polls', 'polled'],
	},
	{
		id: 'map-cell',
		term: 'Map cell',
		meaning:
			'The city map is cut into small six-sided cells, called hexagons. To find nearby drivers, the app checks a few cells, not the whole city.',
		like: 'Looking for a friend in one section of a stadium, not in every seat.',
		forms: ['map cell', 'map cells', 'cell', 'cells', 'hexagon', 'hexagons'],
	},
	{
		id: 'eta',
		term: 'ETA',
		meaning:
			'Short for estimated time of arrival. It’s how long until the driver reaches you, or until you reach where you’re going.',
		forms: ['eta', 'etas'],
	},
	{
		id: 'routing',
		term: 'Routing',
		meaning:
			'Finding the best way to drive from one place to another on real roads, and how long it will take.',
		forms: ['routing'],
	},
	{
		id: 'ledger',
		term: 'Ledger',
		meaning:
			'A careful record of every payment. Money taken from one place is always added to another, so the totals match and mistakes show up.',
		like: 'A shopkeeper’s account book, where all money in and out is written down.',
		forms: ['ledger', 'ledgers'],
	},
	{
		id: 'idempotent',
		term: 'Idempotent',
		meaning:
			'Safe to do twice. Doing it again has the same result as doing it once, so trying a payment again can’t charge the rider twice.',
		like: 'Pressing the lift button twice, which still calls only one lift.',
		forms: ['idempotent', 'idempotency'],
	},
	{
		id: 'load-balancer',
		term: 'Load balancer',
		meaning:
			'A part that spreads incoming requests across the copies of a service, so no single copy gets too much work.',
		like: 'A guard at a bank door sending each customer to the counter with the shortest line.',
		forms: ['load balancer', 'load balancers'],
	},
	{
		id: 'cdn',
		term: 'CDN',
		meaning:
			'Short for content delivery network. Servers around the world keep copies of files, like pictures, close to people so they load fast.',
		like: 'Local warehouses that keep popular items near you, so delivery is quick.',
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
