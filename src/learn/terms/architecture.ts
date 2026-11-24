import type { Term } from '../glossary';

/** Words the architecture lessons explain. */
export const architectureTerms: Term[] = [
	{
		id: 'monolith',
		term: 'Monolith',
		meaning:
			'One program that does everything an app does, built, tested and deployed as one piece, usually with one database.',
		like: 'A department store: everything under one roof, one set of doors.',
		forms: ['monolith', 'monoliths', 'monolithic'],
	},
	{
		id: 'distributed-monolith',
		term: 'Distributed monolith',
		meaning:
			'Services split apart that still have to change, deploy and stay up together: the costs of many services, without the freedom.',
		forms: ['distributed monolith', 'distributed monoliths'],
	},
	{
		id: 'loosely-coupled',
		term: 'Loosely coupled',
		meaning:
			'Parts that depend on each other as little as possible, so one can change, slow down or break without the others noticing much.',
		like: 'Housemates who leave notes, rather than waiting outside each other’s doors.',
		forms: ['loosely coupled', 'loose coupling'],
	},
	{
		id: 'conways-law',
		term: 'Conway’s law',
		meaning:
			'A system’s design ends up copying how the people who build it are organised and talk to each other. Arranging teams on purpose to get the design you want is the inverse Conway manoeuvre.',
		forms: ['conway’s law', 'inverse conway manoeuvre'],
	},
	{
		id: 'strangler-fig',
		term: 'Strangler fig',
		meaning:
			'Replacing an old system a piece at a time: a router sends each piece’s requests to its new service as it’s ready, until the old system is small or gone.',
		like: 'A vine that grows around a tree until it stands on its own.',
		forms: ['strangler fig'],
	},
	{
		id: 'service-discovery',
		term: 'Service discovery',
		meaning:
			'How one service finds the addresses of another’s copies, as copies start, stop and move.',
		forms: ['service discovery'],
	},
	{
		id: 'service-registry',
		term: 'Service registry',
		meaning:
			'A list of every running copy of every service and its address, kept up to date as copies start and stop. Consul, etcd and Eureka are examples.',
		like: 'A hotel’s front desk, which knows which room each guest is in today.',
		forms: ['service registry', 'service registries', 'registry', 'registries'],
	},
	{
		id: 'heartbeat',
		term: 'Heartbeat',
		meaning:
			'A small “I’m still alive” message sent again and again, from many times a second to every few seconds. When they stop, the others take it as dead.',
		like: 'Checking in with a text every hour on a long hike.',
		forms: ['heartbeat', 'heartbeats'],
	},
	{
		id: 'client-side-discovery',
		term: 'Client-side discovery',
		meaning:
			'The caller gets the list of copies from a registry and picks one itself, for each call, with nothing in between.',
		forms: ['client-side discovery'],
	},
	{
		id: 'server-side-discovery',
		term: 'Server-side discovery',
		meaning:
			'The caller sends every call to one address, a load balancer, which knows the copies and picks one.',
		forms: ['server-side discovery'],
	},
	{
		id: 'readiness-check',
		term: 'Readiness check',
		meaning:
			'A check Kubernetes runs on each copy, every few seconds, to see whether it’s ready for requests. Copies that fail it get none.',
		forms: ['readiness check', 'readiness checks'],
	},
	{
		id: 'service-mesh',
		term: 'Service mesh',
		meaning:
			'A small proxy beside every copy of every service, handling their calls to each other: finding copies, retrying, encrypting and measuring. Istio and Linkerd are examples.',
		forms: ['service mesh', 'service meshes'],
	},
	{
		id: 'sidecar',
		term: 'Sidecar',
		meaning:
			'A small helper program that runs beside each copy of a service, on the same machine, like the Envoy proxy in a service mesh.',
		like: 'A motorbike’s sidecar: it goes wherever the bike goes.',
		forms: ['sidecar', 'sidecars'],
	},
	{
		id: 'control-plane',
		term: 'Control plane',
		meaning:
			'The part that tells the others what to do, like which copies exist and what rules to follow, without handling the requests itself.',
		like: 'Air traffic control: it directs the planes, but carries no passengers.',
		forms: ['control plane', 'control planes'],
	},
	{
		id: 'distributed-transaction',
		term: 'Distributed transaction',
		meaning:
			'A change that has to happen in several databases or services, all of it or none of it.',
		forms: ['distributed transaction', 'distributed transactions'],
	},
	{
		id: 'two-phase-commit',
		term: 'Two-phase commit',
		meaning:
			'A vote for a distributed transaction: a coordinator asks everyone to prepare and promise, then tells them all to commit, or all to undo.',
		like: 'A wedding: both say “I do” first, and only then are they married.',
		forms: ['two-phase commit', '2pc'],
	},
	{
		id: 'transaction-coordinator',
		term: 'Transaction coordinator',
		meaning:
			'The part that runs two-phase commit: it collects the votes and tells everyone whether to commit or undo.',
		forms: ['transaction coordinator', 'transaction coordinators'],
	},
	{
		id: 'saga',
		term: 'Saga',
		meaning:
			'A long change made as a series of small steps, each saved at once in its own service. If a step fails, the steps before it are undone, one by one.',
		like: 'Booking a trip: flight, then hotel, then car. If there’s no car, you cancel the hotel and the flight.',
		forms: ['saga', 'sagas'],
	},
	{
		id: 'compensating-action',
		term: 'Compensating action',
		meaning:
			'The step that undoes an earlier one in a saga, like a refund for a charge. It’s a new change, not a rewind.',
		forms: ['compensating action', 'compensating actions'],
	},
	{
		id: 'orchestration',
		term: 'Orchestration',
		meaning:
			'One part, the orchestrator, tells each service what to do, in order, and keeps track of where every job has got to.',
		like: 'A conductor in front of an orchestra.',
		forms: ['orchestration', 'orchestrator', 'orchestrators'],
	},
	{
		id: 'choreography',
		term: 'Choreography',
		meaning:
			'Services work together with no one in charge: each listens for events, does its part, and announces what it did.',
		like: 'Dancers who each know their steps and follow the music, with no conductor.',
		forms: ['choreography'],
	},
	{
		id: 'batch-processing',
		term: 'Batch processing',
		meaning:
			'Working through a big, finished pile of data in one go, like all of yesterday’s orders at 2 am. Efficient, but its answers are late.',
		like: 'Doing a week’s washing on Sunday, instead of each shirt as you take it off.',
		forms: ['batch job', 'batch jobs', 'batch processing'],
	},
	{
		id: 'stream-processing',
		term: 'Stream processing',
		meaning:
			'Handling each event the moment it arrives, keeping running results, with input that never ends. Fresh, but harder to get right.',
		forms: ['stream processing', 'stream processor', 'stream processors'],
	},
	{
		id: 'data-lake',
		term: 'Data lake',
		meaning:
			'Cheap storage, like S3, holding all the raw data and events as files, for years, for big jobs to read later.',
		forms: ['data lake', 'data lakes'],
	},
	{
		id: 'mapreduce',
		term: 'MapReduce',
		meaning:
			'A way to spread a big job over many machines: each reads its share and writes out pairs (map), pairs with the same key are gathered together (shuffle), and each group is added up (reduce).',
		forms: ['mapreduce'],
	},
	{
		id: 'stream-window',
		term: 'Window',
		meaning:
			'A stretch of time a stream processor counts over. Tumbling windows are fixed and back to back; sliding ones overlap; a session window follows one person until they go quiet.',
		forms: ['tumbling window', 'tumbling windows', 'session window', 'session windows'],
	},
	{
		id: 'event-time',
		term: 'Event time',
		meaning:
			'When something actually happened, stamped where it happened. Processing time is when it reached the processor, which can be much later.',
		forms: ['event time', 'processing time'],
	},
	{
		id: 'watermark',
		term: 'Watermark',
		meaning:
			'A stream processor’s estimate that every event up to a certain time has now arrived, so windows ending before it can be closed.',
		forms: ['watermark', 'watermarks'],
	},
	{
		id: 'consumer-lag',
		term: 'Consumer lag',
		meaning:
			'How far a reader of a stream is behind the newest event: how many are waiting, or how old the one it’s on is.',
		forms: ['consumer lag'],
	},
	{
		id: 'exactly-once-processing',
		term: 'Exactly-once processing',
		meaning:
			'Each event affects the results exactly once, even after crashes, though it may be read more than once. Checkpoints make it possible.',
		forms: ['exactly-once processing'],
	},
	{
		id: 'lambda-architecture',
		term: 'Lambda architecture',
		meaning:
			'Running a stream job for fast numbers and a batch job that works them out again exactly, later. The same logic is written twice.',
		forms: ['lambda architecture'],
	},
	{
		id: 'kappa-architecture',
		term: 'Kappa architecture',
		meaning:
			'Using only a stream job. To recompute, a new copy reads the whole event log again from the start.',
		forms: ['kappa architecture'],
	},
	{
		id: 'coordinator',
		term: 'Coordinator',
		meaning:
			'A part that runs a job spanning several others: it asks each to do its piece, and decides what happens if one can’t.',
		forms: ['coordinator', 'coordinators'],
	},
];
