import type { Term } from '../glossary';

/** Words the communication lessons explain. */
export const communicationTerms: Term[] = [
	{
		id: 'resource',
		term: 'Resource',
		meaning:
			'In a REST API, one thing the server knows about, like an order or a product, with its own address, like /orders/5521.',
		forms: ['resource', 'resources'],
	},
	{
		id: 'endpoint',
		term: 'Endpoint',
		meaning:
			'One address an API answers at, with a method: GET /orders/5521 is one endpoint, POST /orders another.',
		forms: ['endpoint', 'endpoints'],
	},
	{
		id: 'safe-method',
		term: 'Safe method',
		meaning:
			'A request that only reads and changes nothing, like GET. It can be sent again, or answered from a cache, without harm.',
		like: 'Looking at a shop window: do it as often as you like, and nothing changes.',
		forms: ['safe method', 'safe methods'],
	},
	{
		id: 'problem-details',
		term: 'Problem details',
		meaning:
			'A standard shape for an API’s error answers, in JSON: a type, a title a person can read, and the details.',
		forms: ['problem details'],
	},
	{
		id: 'pagination',
		term: 'Pagination',
		meaning:
			'Sending a long list a page at a time, say 50 items, with a way to ask for the next page.',
		like: 'A search engine showing ten results, with a “next” link at the bottom.',
		forms: ['pagination'],
	},
	{
		id: 'offset',
		term: 'Offset',
		meaning:
			'A position counted from the start. In a list, how many items to skip; in an event log, each event’s number in its partition.',
		forms: ['offset', 'offsets'],
	},
	{
		id: 'cursor',
		term: 'Cursor',
		meaning:
			'A marker for where the last page ended, so the next request asks for “the ones after this”. Quick at any depth, and new items don’t shift it.',
		like: 'A bookmark: you open the book where you stopped, without counting pages.',
		forms: ['cursor', 'cursors'],
	},
	{
		id: 'cache-control',
		term: 'Cache-Control',
		meaning:
			'A header on an answer saying who may keep it and for how long, like public, max-age=60: anyone, for a minute.',
		forms: ['cache-control'],
	},
	{
		id: 'etag',
		term: 'ETag',
		meaning:
			'A short code for one version of an answer, sent with it. Later, the app sends it back to ask “has this changed?”, and gets 304 Not Modified if not.',
		forms: ['etag', 'etags'],
	},
	{
		id: 'backend-for-frontend',
		term: 'Backend for frontend',
		meaning:
			'A small API made for one app, shaped like its screens, that gathers what each screen needs from the services behind it.',
		forms: ['backend for frontend', 'backends for frontends'],
	},
	{
		id: 'breaking-change',
		term: 'Breaking change',
		meaning:
			'A change to an API that stops working apps from working, like removing or renaming a field. Adding a field usually isn’t one.',
		forms: ['breaking change', 'breaking changes'],
	},
	{
		id: 'openapi',
		term: 'OpenAPI',
		meaning:
			'A standard way to describe a REST API in a file: every address, method and body. Tools turn it into documentation and code.',
		forms: ['openapi'],
	},
	{
		id: 'protocol-buffers',
		term: 'Protocol Buffers',
		meaning:
			'A language for describing messages and calls, made at Google, and the compact binary format they travel in. gRPC uses it.',
		forms: ['protocol buffers', 'protobuf'],
	},
	{
		id: 'unary',
		term: 'Unary call',
		meaning: 'The ordinary kind of RPC call: one question, one answer.',
		forms: ['unary'],
	},
	{
		id: 'streaming-call',
		term: 'Streaming call',
		meaning:
			'A gRPC call that sends many messages instead of one: answers from the server, messages from the caller, or both ways at once.',
		forms: ['server streaming', 'client streaming', 'bidirectional streaming'],
	},
	{
		id: 'grpc-web',
		term: 'gRPC-Web',
		meaning:
			'A version of gRPC a web page can use. A proxy in front of the services turns its calls into ordinary gRPC.',
		forms: ['grpc-web'],
	},
	{
		id: 'over-fetching',
		term: 'Over-fetching',
		meaning:
			'Getting more data than the screen shows, because the API sends the whole thing every time.',
		forms: ['over-fetching'],
	},
	{
		id: 'resolver',
		term: 'Resolver',
		meaning:
			'In GraphQL, the small function behind each field that fetches it, from a database or another service.',
		forms: ['resolver', 'resolvers'],
	},
	{
		id: 'mutation',
		term: 'Mutation',
		meaning: 'A GraphQL request that changes something, like placing an order.',
		forms: ['mutation', 'mutations'],
	},
	{
		id: 'n-plus-one-problem',
		term: 'N+1 problem',
		meaning:
			'Fetching a list with one call, then making one more call for each item in it: 1 call, then N more. It hides easily, and swamps whatever the N calls go to.',
		like: 'Fetching a shopping list, then walking back to the shop once for each item.',
		forms: ['n+1 problem'],
	},
	{
		id: 'dataloader',
		term: 'DataLoader',
		meaning:
			'A small library that collects the things asked for at the same moment, and fetches them in one call, so GraphQL avoids the N+1 problem.',
		forms: ['dataloader'],
	},
	{
		id: 'persisted-query',
		term: 'Persisted query',
		meaning:
			'A GraphQL query the server already knows, so the app sends only its id. Sent as a GET, its answer can be cached.',
		forms: ['persisted query', 'persisted queries'],
	},
	{
		id: 'producer',
		term: 'Producer',
		meaning: 'The part that adds messages to a queue or an event stream.',
		forms: ['producer', 'producers'],
	},
	{
		id: 'consumer',
		term: 'Consumer',
		meaning: 'The part that takes messages from a queue or an event stream, and acts on them.',
		forms: ['consumer', 'consumers'],
	},
	{
		id: 'acknowledgement',
		term: 'Acknowledgement',
		meaning:
			'A worker telling the queue a job is done, so the queue can delete it. A job with no acknowledgement is handed out again.',
		like: 'Signing for a parcel, so the courier knows it arrived.',
		forms: ['acknowledgement', 'acknowledgements'],
	},
	{
		id: 'visibility-timeout',
		term: 'Visibility timeout',
		meaning:
			'How long a job taken from a queue stays hidden from other workers. If it isn’t marked done by then, it shows up again.',
		forms: ['visibility timeout'],
	},
	{
		id: 'at-most-once',
		term: 'At most once',
		meaning: 'A promise that a message is never handled twice, though a crash can lose it.',
		forms: ['at most once'],
	},
	{
		id: 'exactly-once',
		term: 'Exactly once',
		meaning:
			'Every message handled once and only once. Over a network it’s really “effectively once”: delivered at least once, with the repeats thrown away.',
		forms: ['exactly once', 'effectively once'],
	},
	{
		id: 'load-levelling',
		term: 'Load levelling',
		meaning:
			'Letting a queue take in a burst of work, so the workers behind it get through it at a steady pace.',
		like: 'A reservoir that fills in the rain and lets water out evenly.',
		forms: ['load levelling'],
	},
	{
		id: 'competing-consumers',
		term: 'Competing consumers',
		meaning:
			'Several workers taking jobs from the same queue, each job going to just one of them, so they share the work.',
		like: 'Several cashiers serving one line of shoppers.',
		forms: ['competing consumers'],
	},
	{
		id: 'backpressure',
		term: 'Backpressure',
		meaning:
			'Slowing down, or pushing work back, because the next part can’t take any more. The queue holds the rest until it can.',
		like: 'A kitchen telling the waiters to stop taking orders until it catches up.',
		forms: ['backpressure'],
	},
	{
		id: 'poison-message',
		term: 'Poison message',
		meaning:
			'A message that fails every time it’s handled, like an email to an address that doesn’t exist. Retried for ever, it wastes the workers’ time.',
		forms: ['poison message', 'poison messages'],
	},
	{
		id: 'fifo',
		term: 'FIFO',
		meaning:
			'First in, first out: handled in the order they arrived. A FIFO queue keeps strict order, which costs some speed.',
		like: 'A queue at a ticket counter, served strictly in turn.',
		forms: ['fifo'],
	},
	{
		id: 'message-group',
		term: 'Message group',
		meaning:
			'In a FIFO queue, the messages that must stay in order, like everything about one order. One group is handled one message at a time; different groups go in parallel.',
		forms: ['message group', 'message groups'],
	},
	{
		id: 'delayed-job',
		term: 'Delayed job',
		meaning: 'A job put in a queue now, to run later, like a reminder an hour from now.',
		forms: ['delayed job', 'delayed jobs'],
	},
	{
		id: 'pub-sub',
		term: 'Publish and subscribe',
		meaning:
			'Announcing what happened once, to everyone who has asked to hear about it. Also written pub/sub.',
		like: 'A newsletter: written once, and every subscriber gets it.',
		forms: ['pub/sub', 'publish and subscribe'],
	},
	{
		id: 'fan-out',
		term: 'Fan-out',
		meaning:
			'One message in, many copies out: one to each subscriber, to each follower’s feed, or to each member of a group chat.',
		forms: ['fan-out'],
	},
	{
		id: 'schema-registry',
		term: 'Schema registry',
		meaning:
			'A store of the shape of each kind of event. It refuses a new shape that would break the parts reading the old one.',
		forms: ['schema registry'],
	},
	{
		id: 'change-data-capture',
		term: 'Change data capture',
		meaning:
			'Reading a database’s own record of every change, and publishing each change as an event. Debezium is a common tool for it.',
		forms: ['change data capture'],
	},
	{
		id: 'kafka',
		term: 'Kafka',
		meaning:
			'A widely used event log. It splits events into partitions over many machines, keeps each partition in order, and keeps events for days, so many groups can read them, and read them again.',
		forms: ['kafka'],
	},
	{
		id: 'topic',
		term: 'Topic',
		meaning: 'In an event log like Kafka, a named list of events of one kind, like orders.',
		forms: ['topic', 'topics'],
	},
	{
		id: 'broker',
		term: 'Broker',
		meaning:
			'A server that stores messages and hands them out: one of Kafka’s machines, or a queue server like RabbitMQ.',
		forms: ['broker', 'brokers'],
	},
	{
		id: 'consumer-group',
		term: 'Consumer group',
		meaning:
			'The copies of one service reading a topic together. Every group gets every event; within a group, each partition goes to one copy.',
		forms: ['consumer group', 'consumer groups'],
	},
	{
		id: 'committed-offset',
		term: 'Committed offset',
		meaning:
			'The place a consumer has saved in a partition: the next offset to read, with everything before it done. After a crash or a rebalance, reading starts again from there.',
		forms: ['committed offset', 'committed offsets'],
	},
	{
		id: 'rebalance',
		term: 'Rebalance',
		meaning:
			'Sharing a topic’s partitions out again between a group’s copies, when a copy joins, leaves or crashes.',
		forms: ['rebalance', 'rebalances'],
	},
	{
		id: 'retention',
		term: 'Retention',
		meaning:
			'How long messages are kept, whether or not anyone has read them. Kafka keeps them for 7 days unless told otherwise.',
		forms: ['retention'],
	},
	{
		id: 'compacted-topic',
		term: 'Compacted topic',
		meaning:
			'A topic that keeps only the newest event for each key, for ever, so it always holds the latest of everything.',
		forms: ['compacted topic', 'compacted topics'],
	},
	{
		id: 'redis-pub-sub',
		term: 'Redis pub/sub',
		meaning:
			'Redis passing each message sent to a channel to everyone listening right now. Very fast, but it keeps nothing: whoever isn’t listening misses it.',
		like: 'A radio broadcast: if your radio is off, you miss it.',
		forms: ['redis pub/sub'],
	},
	{
		id: 'thundering-herd',
		term: 'Thundering herd',
		meaning:
			'Many clients doing the same thing at the same moment, like reconnecting after a restart, and swamping a server that could handle them spread out.',
		like: 'Everyone leaving a stadium at the final whistle.',
		forms: ['thundering herd'],
	},
	{
		id: 'device-token',
		term: 'Device token',
		meaning:
			'An id Apple or Google gives an app on one phone. The shop sends a notification with it, so it reaches that phone.',
		like: 'A postal address for one app on one phone.',
		forms: ['device token', 'device tokens'],
	},
	{
		id: 'apns',
		term: 'APNs',
		meaning: 'Apple Push Notification service: how notifications reach iPhones.',
		forms: ['apns'],
	},
	{
		id: 'fcm',
		term: 'Firebase Cloud Messaging',
		meaning:
			'Google’s service for sending notifications to Android phones, and to apps on other devices.',
		forms: ['firebase cloud messaging'],
	},
	{
		id: 'signing-secret',
		term: 'Signing secret',
		meaning:
			'A secret only the sender and receiver of webhooks know. The sender signs each webhook with it, and the receiver checks the signature.',
		forms: ['signing secret', 'signing secrets'],
	},
	{
		id: 'hmac',
		term: 'HMAC',
		meaning:
			'A signature worked out from a message and a secret key. Change one letter of the message, or use another key, and it no longer matches.',
		like: 'A wax seal only the sender’s ring can make.',
		forms: ['hmac'],
	},
	{
		id: 'reconciling',
		term: 'Reconciling',
		meaning:
			'Comparing your records with someone else’s, like the shop’s payments with the provider’s, to find anything missed.',
		like: 'Checking your own notes against a bank statement.',
		forms: ['reconciling', 'reconcile', 'reconciliation'],
	},
];
