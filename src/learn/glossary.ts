import type { System } from '@/model/schema';
import { trackTerms } from './terms';

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

const sharedTerms: Term[] = [
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
		forms: ['scaling', 'scale', 'scales', 'scaled'],
	},
	{
		id: 'scale-up',
		term: 'Scaling up',
		meaning:
			'Handling more by moving to a bigger computer, with more processors and memory. Also called vertical scaling.',
		like: 'Buying one much bigger oven.',
		forms: ['scaling up', 'scale up', 'scales up', 'vertical scaling'],
	},
	{
		id: 'scale-out',
		term: 'Scaling out',
		meaning:
			'Handling more by running more copies of the same part, and sharing the work between them. Also called horizontal scaling.',
		like: 'Adding more ovens, each baking the same bread.',
		forms: ['scaling out', 'scale out', 'scales out', 'horizontal scaling'],
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
		id: 'hot-shard',
		term: 'Hot shard',
		meaning:
			'A shard that gets far more work than the others, because what it holds is popular. It fills up while the rest sit idle.',
		forms: ['hot shard', 'hot shards'],
	},
	{
		id: 'hash',
		term: 'Hash',
		meaning:
			'A number or code worked out from a value, like a shopper’s id or a password. The same value always gives the same hash, so it spreads things evenly, like shoppers between shards. A good one can’t be worked backwards, which is why passwords are kept as hashes.',
		forms: ['hash', 'hashes'],
	},
	{
		id: 'replica',
		term: 'Replica',
		meaning:
			'An exact copy of a database, kept on another server. If one server breaks, no data is lost, and the copies share the work of reading.',
		like: 'Several copies of the same textbook, so more students can read at once and losing one doesn’t matter.',
		forms: ['replica', 'replicas', 'replicated', 'replication', 'read copy', 'read copies'],
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
		id: 'cache-hit',
		term: 'Cache hit',
		meaning: 'When the cache already has the answer, so the slow work is skipped.',
		like: 'Finding what you need right there on your desk.',
		forms: ['cache hit', 'cache hits'],
	},
	{
		id: 'cold-cache',
		term: 'Cold cache',
		meaning:
			'A cache that has just started, empty. Every request misses until it fills up again, so they all go on to the database.',
		like: 'A new desk with nothing on it yet: every time, you go to the cupboard.',
		forms: ['cold cache'],
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
		id: 'encoding',
		term: 'Encoding',
		meaning:
			'Turning data into a different form. A video is encoded into many sizes and qualities, so every screen and internet speed gets one that fits; bytes can be encoded as text, like Base64. Anyone can turn it back: it isn’t encryption.',
		like: 'Printing the same photo as a passport photo, a postcard and a poster.',
		forms: ['encoding', 'encode', 'encoded', 'encoder', 'encoders'],
	},
	{
		id: 'adaptive-streaming',
		term: 'Adaptive streaming',
		meaning:
			'The app picks a sharper or smaller version of the next few seconds to suit the internet speed right now. So a slow moment makes the picture softer, not stop.',
		like: 'A driver changing gear on a hill, instead of stalling.',
		forms: ['adaptive streaming'],
	},
	{
		id: 'file-storage',
		term: 'File storage',
		meaning:
			'A place for big files like videos and pictures, kept safely and cheaply. It holds far more than a database, but sends things more slowly.',
		like: 'A big warehouse: it holds everything, but it’s far from the shops.',
		forms: ['file storage', 'video storage', 'storage'],
	},
	{
		id: 'scale-ahead',
		term: 'Scaling ahead',
		meaning:
			'Adding copies before a big event, because autoscaling can’t add them fast enough once everyone arrives at once.',
		like: 'Opening every ticket counter before the match ends, not after the crowd arrives.',
		forms: ['scaling ahead', 'scale ahead', 'ahead of time', 'pre-scaling'],
	},
	{
		id: 'buffer',
		term: 'Buffer',
		meaning:
			'Video the app has already fetched but not shown yet, kept ready. If the next piece is slow to arrive, the film keeps playing from the buffer.',
		like: 'A full water tank, which keeps the taps running when the supply stops for a moment.',
		forms: ['buffer', 'buffers', 'buffering'],
	},
	{
		id: 'live-streaming',
		term: 'Live streaming',
		meaning:
			'Sending video as it happens. Each moment is made into pieces within seconds, so viewers see it a little after the people who are there.',
		forms: ['live streaming', 'live stream', 'live video'],
	},
	{
		id: 'upi',
		term: 'UPI',
		meaning:
			'India’s system for sending money between any two bank accounts from a phone app, in seconds, using an ID instead of account numbers.',
		forms: ['upi'],
	},
	{
		id: 'upi-id',
		term: 'UPI ID',
		meaning:
			'An address for a bank account, like raju.tea@okaxis. The part after @ says which bank or app it belongs to.',
		like: 'An email address, but for receiving money.',
		forms: ['upi id', 'upi ids'],
	},
	{
		id: 'npci',
		term: 'NPCI',
		meaning:
			'The National Payments Corporation of India, set up by India’s banks. It runs UPI’s switch, which passes every payment from one bank to another.',
		forms: ['npci'],
	},
	{
		id: 'pending',
		term: 'Pending',
		meaning:
			'Not known yet. No answer came back in time, so the money may or may not have moved. The app asks later what happened, instead of paying again.',
		like: 'A posted letter you haven’t had a reply to: you ask if it arrived, you don’t post a second one.',
		forms: ['pending'],
	},
	{
		id: 'qr-code',
		term: 'QR code',
		meaning:
			'A square pattern a phone camera can read. At a shop, it holds the shop’s UPI ID, so nobody has to type it.',
		forms: ['qr code', 'qr codes'],
	},
	{
		id: 'transaction',
		term: 'Transaction',
		meaning:
			'A group of database changes that are saved together or not at all. If one fails, none of them are kept.',
		like: 'Swapping keys for cash at a counter: either both change hands, or neither does.',
		forms: ['one transaction', 'same transaction', 'database transaction'],
	},
	{
		id: 'sql',
		term: 'SQL',
		meaning:
			'A kind of database that keeps data in tables, with rows and columns, and the language used to ask it questions. PostgreSQL and MySQL are SQL databases.',
		forms: ['sql'],
	},
	{
		id: 'nosql',
		term: 'NoSQL',
		meaning:
			'Any database that doesn’t use SQL’s linked tables, with a fixed schema and joins: documents, keys and values, wide columns, graphs. Many are built to spread over many machines.',
		forms: ['nosql'],
	},
	{
		id: 'document-database',
		term: 'Document database',
		meaning:
			'A NoSQL database that keeps each thing, like an order, as one document with everything about it inside, read in one go.',
		like: 'A folder per customer, instead of one big ledger for each kind of paper.',
		forms: ['document database', 'document databases'],
	},
	{
		id: 'join',
		term: 'Join',
		meaning:
			'Putting rows from several tables back together in one answer, like an order with its items and their products.',
		forms: ['join', 'joins', 'joining'],
	},
	{
		id: 'b-tree',
		term: 'B-tree',
		meaning:
			'The sorted shape most databases keep their data and indexes in. Finding a row takes a few quick steps, however big the table.',
		like: 'A dictionary: open it near the right letter, then narrow down.',
		forms: ['b-tree', 'b-trees'],
	},
	{
		id: 'locks',
		term: 'Lock',
		meaning:
			'A claim on something, like a row, that makes anyone else who wants it wait until it’s let go. A transaction locks the rows it changes; a lock held across machines works the same way.',
		like: 'An engaged sign on a changing room door.',
		forms: ['lock', 'locks', 'locked', 'locking'],
	},
	{
		id: 'isolation',
		term: 'Isolation',
		meaning:
			'How well transactions running at the same time are kept apart, so one never sees another’s half-made changes.',
		forms: ['isolation'],
	},
	{
		id: 'race',
		term: 'Race',
		meaning:
			'A mistake that only happens when two things run at the same moment, so the result depends on which gets there first.',
		like: 'Two people booking the last seat in a cinema at the same second.',
		forms: ['race', 'races', 'race condition', 'race conditions'],
	},
	{
		id: 'leader',
		term: 'Leader',
		meaning:
			'The copy of a database that takes changes and sends each one on to its followers. Usually there’s one; some designs have several.',
		forms: ['leader', 'leaders'],
	},
	{
		id: 'follower',
		term: 'Follower',
		meaning:
			'A copy of a database that receives every change from the leader. It can answer reads, and take over if the leader breaks.',
		forms: ['follower', 'followers'],
	},
	{
		id: 'failover',
		term: 'Failover',
		meaning:
			'When a broken part’s job is taken over by a copy that was standing by, like a follower made the new leader.',
		forms: ['failover'],
	},
	{
		id: 'backup',
		term: 'Backup',
		meaning:
			'The data saved as it was at one moment, and kept somewhere else, so it can be put back after a mistake or a disaster.',
		forms: ['backup', 'backups', 'backed up'],
	},
	{
		id: 'consistent-hashing',
		term: 'Consistent hashing',
		meaning:
			'A way to share things out between servers, round a circle, so that adding or removing a server moves only a small share of them.',
		forms: ['consistent hashing'],
	},
	{
		id: 'uuid',
		term: 'UUID',
		meaning:
			'A 128-bit ID that any machine can make without asking anyone, so long that two are never the same. Version 4 is random; version 7 starts with the time, so new ones sort in order.',
		forms: ['uuid', 'uuids'],
	},
	{
		id: 'cap',
		term: 'CAP theorem',
		meaning:
			'While the network between copies is broken, a system can keep its copies agreeing, or keep answering everyone, but not both.',
		forms: ['cap theorem'],
	},
	{
		id: 'eventual-consistency',
		term: 'Eventually consistent',
		meaning: 'Copies that may disagree for a moment after a change, and catch up soon after.',
		like: 'News reaching every town, a little later in the far ones.',
		forms: ['eventually consistent', 'eventual consistency'],
	},
	{
		id: 'read-your-writes',
		term: 'Reading your own writes',
		meaning:
			'After you change something, you always see your change, even if other people see it a moment later.',
		forms: ['reading your own writes', 'read your own writes'],
	},
	{
		id: 'split-brain',
		term: 'Split brain',
		meaning:
			'Two parts of a group each think they’re in charge, and both take changes, so their data no longer fits together.',
		forms: ['split brain'],
	},
	{
		id: 'rest',
		term: 'REST API',
		meaning:
			'A way for apps to ask a server for things: every thing has its own web address, like /orders/5521, and you GET, POST, PUT or DELETE it.',
		forms: ['rest api', 'rest apis'],
	},
	{
		id: 'graphql',
		term: 'GraphQL',
		meaning:
			'A way for an app to ask for exactly the data a screen needs, from many places, in one request.',
		like: 'Handing a waiter your whole order at once, instead of going to the counter for each dish.',
		forms: ['graphql'],
	},
	{
		id: 'rpc',
		term: 'RPC',
		meaning:
			'Remote procedure call: one service calls a function in another as if it were its own. gRPC is a popular, fast kind.',
		forms: ['rpc', 'grpc'],
	},
	{
		id: 'json',
		term: 'JSON',
		meaning:
			'A plain-text way to write data, with names and values, like { "id": 5521 }. Most web APIs send it.',
		forms: ['json'],
	},
	{
		id: 'subscribe',
		term: 'Subscribe',
		meaning:
			'To ask to hear about every event of a kind, like every order placed. Each subscriber gets its own copy.',
		like: 'Signing up for a newsletter: everyone on the list gets every issue.',
		forms: ['subscribe', 'subscribes', 'subscribed', 'subscriber', 'subscribers'],
	},
	{
		id: 'at-least-once',
		term: 'At least once',
		meaning:
			'A promise that every message is delivered, but maybe more than once. So whoever handles it must cope with repeats.',
		forms: ['at least once'],
	},
	{
		id: 'dead-letter-queue',
		term: 'Dead-letter queue',
		meaning:
			'Where messages that keep failing are moved after a few tries, so they stop blocking the rest and a person can look at them.',
		like: 'The post office’s pile of letters it can’t deliver.',
		forms: ['dead-letter queue', 'dead-letter queues'],
	},
	{
		id: 'server-sent-events',
		term: 'Server-sent events',
		meaning:
			'A connection a browser keeps open so the server can send it updates. Simpler than a WebSocket, but it only goes one way.',
		forms: ['server-sent events'],
	},
	{
		id: 'long-polling',
		term: 'Long polling',
		meaning:
			'Asking a server for news, and the server holding the answer until there is some, then asking again.',
		forms: ['long polling'],
	},
	{
		id: 'push-notification',
		term: 'Push notification',
		meaning:
			'A message that reaches a phone even when the app is closed, sent through Apple or Google.',
		forms: ['push notification', 'push notifications'],
	},
	{
		id: 'single-point-of-failure',
		term: 'Single point of failure',
		meaning: 'A part there’s only one of, so if it breaks, everything that needs it stops.',
		like: 'The one bridge into a town.',
		forms: ['single point of failure', 'single points of failure'],
	},
	{
		id: 'zone',
		term: 'Zone',
		meaning:
			'A data centre, or a group of them, with its own power and network, a few kilometres from the others. Copies spread over zones survive one of them going down.',
		forms: ['zone', 'zones'],
	},
	{
		id: 'backoff',
		term: 'Backoff',
		meaning:
			'Waiting before trying again, a little longer after each failure, so a struggling part gets room to recover.',
		like: 'Knocking again after a minute, then after five, instead of hammering on the door.',
		forms: ['backoff', 'back off'],
	},
	{
		id: 'jitter',
		term: 'Jitter',
		meaning:
			'Randomness added to a wait, so that many callers don’t all try again at the very same moment. It can be a small random extra, or, with full jitter, the whole wait picked at random, from nothing up to the backoff.',
		forms: ['jitter'],
	},
	{
		id: 'retry-storm',
		term: 'Retry storm',
		meaning:
			'When a part is too busy, its callers retry, which makes it busier, so more calls fail and are retried again.',
		forms: ['retry storm', 'retry storms'],
	},
	{
		id: 'cascading-failure',
		term: 'Cascading failure',
		meaning:
			'One part’s failure making the parts that depend on it fail too, and so on, until much of the system is down.',
		like: 'Dominoes falling.',
		forms: ['cascading failure', 'cascading failures'],
	},
	{
		id: 'load-shedding',
		term: 'Load shedding',
		meaning:
			'Turning away or switching off the least important work on purpose, so the most important keeps working under too much load.',
		like: 'A power company cutting some areas for an hour so the whole grid doesn’t go down.',
		forms: ['load shedding'],
	},
	{
		id: 'rate-limit',
		term: 'Rate limit',
		meaning:
			'The most requests one user may make in a time, like 20 a second. Past it, requests are turned away at once.',
		forms: ['rate limit', 'rate limits', 'rate limiting'],
	},
	{
		id: 'metrics',
		term: 'Metrics',
		meaning:
			'Numbers measured every few seconds, like requests a second, failures and wait, kept so they can be drawn as graphs over time.',
		forms: ['metric', 'metrics'],
	},
	{
		id: 'trace',
		term: 'Trace',
		meaning:
			'The path of one request through every part it visits, with how long each step took.',
		forms: ['trace', 'traces'],
	},
	{
		id: 'slo',
		term: 'SLO',
		meaning:
			'Service level objective: a target for how well the app works, like 99.9% of pages working in under 300 ms.',
		forms: ['slo', 'slos'],
	},
	{
		id: 'error-budget',
		term: 'Error budget',
		meaning:
			'How much failure the target allows, like 0.1% of requests. While some is left, the team can take risks; once it’s used up, it slows down.',
		forms: ['error budget', 'error budgets'],
	},
	{
		id: 'stateless',
		term: 'Stateless',
		meaning:
			'A server that keeps nothing between requests. What it needs to remember, like your cart, is kept in a shared store, so any copy can answer anyone.',
		like: 'A bank counter where any clerk can serve you, because your account is in the bank’s records, not in one clerk’s head.',
		forms: ['stateless'],
	},
	{
		id: 'sticky-sessions',
		term: 'Sticky sessions',
		meaning:
			'The load balancer sends a person to the same copy every time, because that copy remembers them. If it restarts, what it remembered is lost.',
		forms: ['sticky sessions', 'sticky session'],
	},
	{
		id: 'health-check',
		term: 'Health check',
		meaning:
			'A quick “are you well?” that a load balancer asks each copy every few seconds. A copy that doesn’t answer stops getting requests.',
		like: 'A teacher taking the register: whoever doesn’t answer isn’t given work.',
		forms: ['health check', 'health checks'],
	},
	{
		id: 'session',
		term: 'Session',
		meaning:
			'A record that someone has signed in. The app checks it on every request, and deleting it signs them out.',
		like: 'A wristband at an event: staff check it at every door, and cutting it off means you’re out.',
		forms: ['session', 'sessions'],
	},
	{
		id: 'webhook',
		term: 'Webhook',
		meaning:
			'A message one system sends to another system’s web address the moment something happens, instead of waiting to be asked.',
		like: 'A text message from your bank, instead of checking your account again and again.',
		forms: ['webhook', 'webhooks'],
	},
	{
		id: 'outbox',
		term: 'Outbox',
		meaning:
			'A table where a change saves the messages it needs to send, in the same save as the change. A worker sends them later, so none are lost.',
		like: 'An office out-tray: letters go when the post is collected, and none are forgotten.',
		forms: ['outbox'],
	},
	{
		id: 'checkpoint',
		term: 'Checkpoint',
		meaning:
			'A saved note of how far a long job has got, so it can carry on from there after a crash, instead of starting again.',
		like: 'A bookmark.',
		forms: ['checkpoint', 'checkpoints'],
	},
	{
		id: 'modular-monolith',
		term: 'Modular monolith',
		meaning:
			'One program, split inside into modules with clear borders. It’s simpler to run than many services, and a module can be moved out later.',
		forms: ['modular monolith', 'modules', 'module'],
	},
	{
		id: 'deadlock',
		term: 'Deadlock',
		meaning:
			'Two changes each waiting for something the other is holding, so neither can ever finish.',
		like: 'Two cars on a narrow bridge, each waiting for the other to reverse.',
		forms: ['deadlock', 'deadlocks'],
	},
	{
		id: 'cdn',
		term: 'CDN',
		meaning:
			'Short for content delivery network. Servers around the world keep copies of files, like pictures, close to people so they load fast.',
		like: 'Local warehouses that keep popular items near you, so delivery is quick.',
		forms: ['cdn', 'cdns'],
	},
	{
		id: 'proxy',
		term: 'Proxy',
		meaning:
			'A program that stands in the middle of a conversation, passing requests on and answers back, and able to check, change, count or turn them away on the way.',
		like: 'A secretary who takes every call and puts it through, or doesn’t.',
		forms: ['proxy', 'proxies'],
	},
	{
		id: 'reverse-proxy',
		term: 'Reverse proxy',
		meaning:
			'A server that takes requests in place of the servers behind it, passes each one on, and passes the answer back. A load balancer is one.',
		like: 'A receptionist who takes every visitor and walks them to the right office.',
		forms: ['reverse proxy', 'reverse proxies'],
	},
	{
		id: 'round-robin',
		term: 'Round robin',
		meaning:
			'Taking turns: the first request to the first copy, the next to the second, and round again.',
		like: 'Dealing cards around a table.',
		forms: ['round robin'],
	},
	{
		id: 'weighted-round-robin',
		term: 'Weighted round robin',
		meaning:
			'Taking turns, but each copy has a weight, and a copy with twice the weight gets twice as many requests.',
		forms: ['weighted round robin'],
	},
	{
		id: 'least-connections',
		term: 'Least connections',
		meaning:
			'Sending each request to the copy with the fewest requests still open. A slow copy keeps its count high, so it gets fewer.',
		like: 'Joining the shortest queue at the supermarket.',
		forms: ['least connections', 'weighted least connections'],
	},
	{
		id: 'least-response-time',
		term: 'Least response time',
		meaning:
			'Sending each request to the copy that has been answering fastest. The load balancer has to time every answer.',
		forms: ['least response time'],
	},
	{
		id: 'power-of-two-choices',
		term: 'Power of two choices',
		meaning:
			'Picking two copies at random, and sending the request to the less busy of the two. Nearly as good as checking every copy, and much cheaper.',
		forms: ['power of two choices'],
	},
	{
		id: 'outlier-detection',
		term: 'Outlier detection',
		meaning:
			'A load balancer watching real answers, and taking out for a while a copy whose answers keep failing. Also called a passive health check.',
		forms: ['outlier detection'],
	},
	{
		id: 'gray-failure',
		term: 'Gray failure',
		meaning:
			'A part that’s slow or half-working rather than down, so it passes its health checks while users suffer. Hard to spot.',
		forms: ['gray failure', 'gray failures'],
	},
	{
		id: 'noisy-neighbour',
		term: 'Noisy neighbour',
		meaning: 'Another program on the same machine using so much of it that yours slows down.',
		forms: ['noisy neighbour', 'noisy neighbours'],
	},
	{
		id: 'slow-start',
		term: 'Slow start',
		meaning:
			'Sending a newly added copy a few requests at first, and more over the next minute, while it warms up.',
		forms: ['slow start'],
	},
	{
		id: 'connection-draining',
		term: 'Connection draining',
		meaning:
			'Before a copy is removed, sending it no new requests, but letting it finish the ones it has. No one sees an error.',
		like: 'A shop that locks the door at closing time, but serves the people already inside.',
		forms: ['connection draining'],
	},
	{
		id: 'rolling-deploy',
		term: 'Rolling deploy',
		meaning:
			'Putting out a new version one copy at a time: drain it, update it, put it back, then the next. The app keeps working throughout.',
		forms: ['rolling deploy', 'rolling deploys'],
	},
	{
		id: 'canary',
		term: 'Canary',
		meaning:
			'A new version given to a small share of users first, like 5%. If it misbehaves, only a few people notice, and it’s rolled back.',
		like: 'Miners once took a canary underground: if it got ill, they left before it hurt them.',
		forms: ['canary', 'canaries'],
	},
	{
		id: 'virtual-address',
		term: 'Virtual address',
		meaning:
			'An address that can move between two machines. When the working one breaks, its standby takes the address over, so callers never notice.',
		forms: ['virtual address'],
	},
	{
		id: 'layer-4',
		term: 'Layer 4',
		meaning:
			'The connection level of the network: which computer and which port. A layer 4 load balancer passes connections on without reading what’s inside.',
		forms: ['layer 4'],
	},
	{
		id: 'layer-7',
		term: 'Layer 7',
		meaning:
			'The level of the request itself: the page asked for, the headers, the cookies. A layer 7 load balancer reads every request.',
		forms: ['layer 7'],
	},
	{
		id: 'https',
		term: 'HTTPS',
		meaning:
			'Web requests sent encrypted, using TLS, so nobody on the way can read or change them. The server proves who it is with a certificate.',
		forms: ['https', 'tls'],
	},
	{
		id: 'certificate',
		term: 'Certificate',
		meaning:
			'A file that proves a server really is shop.example.com, signed by a company browsers trust. It has to be renewed every few months.',
		forms: ['certificate', 'certificates'],
	},
	{
		id: 'tls-termination',
		term: 'TLS termination',
		meaning:
			'Decrypting HTTPS at the load balancer, once, so the servers behind it don’t each have to.',
		forms: ['tls termination'],
	},
	{
		id: 'cookie',
		term: 'Cookie',
		meaning:
			'A small note a website asks the browser or app to keep, and send back with every request, like which copy served you last.',
		forms: ['cookie', 'cookies'],
	},
	{
		id: 'dns',
		term: 'DNS',
		meaning:
			'The internet’s phone book: it turns a name like shop.example.com into the address of a computer.',
		forms: ['dns'],
	},
	{
		id: 'region',
		term: 'Region',
		meaning:
			'A group of data centres in one part of the world, like Mumbai or Frankfurt. Each has several zones.',
		forms: ['region', 'regions'],
	},
	{
		id: 'geodns',
		term: 'GeoDNS',
		meaning:
			'DNS that answers with a different address depending on where you are, to send you to the nearest region.',
		forms: ['geodns'],
	},
	{
		id: 'anycast',
		term: 'Anycast',
		meaning:
			'Many places announcing the same address, so the internet’s routing takes each user to the nearest one.',
		forms: ['anycast'],
	},
];

/** Every word explained: the shared ones, and each track's own. */
export const glossary: Term[] = [...sharedTerms, ...trackTerms];

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
