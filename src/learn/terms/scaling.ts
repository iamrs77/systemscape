import type { Term } from '../glossary';

/** Words the scaling lessons explain. */
export const scalingTerms: Term[] = [
	{
		id: 'vcpu',
		term: 'vCPU',
		meaning:
			'A virtual processor: a share of a cloud machine’s processor, rented by the hour. More vCPUs can do more work at once.',
		forms: ['vcpu', 'vcpus'],
	},
	{
		id: 'stateful',
		term: 'Stateful',
		meaning:
			'A server that keeps something from one request to the next in its own memory or on its own disk, like a cart. Only that copy can answer for it.',
		like: 'A clerk who keeps your order in their head: only they can help you, and if they go home, it’s gone.',
		forms: ['stateful'],
	},
	{
		id: 'session-store',
		term: 'Session store',
		meaning:
			'A shared, fast store, usually kept in memory, that holds every shopper’s session and cart, so any copy of a server can read them.',
		forms: ['session store', 'session stores'],
	},
	{
		id: 'signed-cookie',
		term: 'Signed cookie',
		meaning:
			'A cookie the server has signed with a secret key. The app carries it, and any server can check that nobody has changed it.',
		like: 'A letter with a wax seal: anyone can read it, but a broken seal shows it was tampered with.',
		forms: ['signed cookie', 'signed cookies'],
	},
	{
		id: 'redis',
		term: 'Redis',
		meaning:
			'A popular store that keeps everything in memory, so it’s very fast. Used as a cache, a session store and more. It can save to disk, and keep copies.',
		forms: ['redis'],
	},
	{
		id: 'memcached',
		term: 'Memcached',
		meaning:
			'A simple, very fast cache kept in memory. It keeps no copies and nothing on disk, so a restart starts it empty.',
		forms: ['memcached'],
	},
	{
		id: 'cache-aside',
		term: 'Cache-aside',
		meaning:
			'The app asks the cache first. On a miss, it reads the database itself and puts the answer in the cache, which sits to one side.',
		like: 'Checking your desk first, and when it isn’t there, fetching it from the cupboard and leaving it on the desk.',
		forms: ['cache-aside', 'lazy loading'],
	},
	{
		id: 'read-through',
		term: 'Read-through',
		meaning:
			'A cache that fetches from the database by itself on a miss, so the app only ever asks the cache.',
		forms: ['read-through'],
	},
	{
		id: 'write-around',
		term: 'Write-around',
		meaning:
			'Writing a change only to the database, and leaving the cache alone. A copy already cached stays until it expires.',
		forms: ['write-around'],
	},
	{
		id: 'write-through',
		term: 'Write-through',
		meaning:
			'Writing each change to the cache and the database together, and waiting for both, so the cache is never behind.',
		forms: ['write-through', 'writes through'],
	},
	{
		id: 'write-behind',
		term: 'Write-behind',
		meaning:
			'Writing a change only to the cache, which saves it in the database later, often in batches. Fast, but a crash loses what wasn’t saved yet.',
		forms: ['write-behind', 'write-back'],
	},
	{
		id: 'eviction',
		term: 'Eviction',
		meaning: 'Throwing an answer out of a full cache, to make room for a new one.',
		like: 'Clearing space on a full desk by putting away what you haven’t touched for longest.',
		forms: ['eviction', 'evict', 'evicts', 'evicted'],
	},
	{
		id: 'lru',
		term: 'LRU',
		meaning:
			'Least recently used: when a cache is full, it throws out what was read longest ago.',
		forms: ['lru', 'least recently used'],
	},
	{
		id: 'lfu',
		term: 'LFU',
		meaning:
			'Least frequently used: when a cache is full, it throws out what’s read least often.',
		forms: ['lfu', 'least frequently used'],
	},
	{
		id: 'working-set',
		term: 'Working set',
		meaning:
			'The data that’s asked for often, right now. A cache big enough to hold it answers almost everything.',
		like: 'The few tools on a workbench, out of everything in the shed.',
		forms: ['working set'],
	},
	{
		id: 'stale',
		term: 'Stale',
		meaning:
			'Out of date: a copy that no longer matches the real data, like an old price still in a cache.',
		forms: ['stale'],
	},
	{
		id: 'invalidation',
		term: 'Invalidation',
		meaning: 'Removing or replacing a cached copy because the data behind it has changed.',
		forms: ['invalidation', 'invalidate', 'invalidates', 'invalidated'],
	},
	{
		id: 'cache-stampede',
		term: 'Cache stampede',
		meaning:
			'Many requests missing the cache at once, after it restarts or a popular answer expires, and all landing on the database together.',
		like: 'The doors opening on sale day, and everyone rushing the same counter.',
		forms: ['cache stampede', 'cache stampedes', 'stampede', 'stampedes'],
	},
	{
		id: 'request-coalescing',
		term: 'Request coalescing',
		meaning:
			'When many requests need the same missing answer, only one fetches it, and the others wait and share it.',
		like: 'One person going to the counter for the whole table’s order.',
		forms: ['request coalescing'],
	},
	{
		id: 'warm-up',
		term: 'Warm-up',
		meaning:
			'The time a new copy, or an empty cache, needs before it works at full speed: starting, connecting, and filling its memory.',
		forms: [
			'warm-up',
			'warm up',
			'warms up',
			'warm the cache',
			'warm the caches',
			'warm cache',
		],
	},
	{
		id: 'edge-location',
		term: 'Edge location',
		meaning:
			'One of a CDN’s many sites, in cities all over the world, each keeping copies of files near the people who ask for them.',
		forms: ['edge location', 'edge locations'],
	},
	{
		id: 'origin',
		term: 'Origin',
		meaning:
			'Where a CDN gets its files from: the shop’s own storage or servers, which hold the real copies.',
		forms: ['origin'],
	},
	{
		id: 'pull-cdn',
		term: 'Pull CDN',
		meaning:
			'A CDN that fetches a file from the origin the first time someone asks for it, then keeps it.',
		forms: ['pull cdn', 'pull cdns'],
	},
	{
		id: 'push-cdn',
		term: 'Push CDN',
		meaning: 'A CDN you upload files to in advance, before anyone asks for them.',
		forms: ['push cdn', 'push cdns'],
	},
	{
		id: 'purge',
		term: 'Purge',
		meaning:
			'Telling a CDN to drop a file everywhere, so the next request fetches the new one.',
		forms: ['purge', 'purges', 'purged', 'purging'],
	},
	{
		id: 'fingerprint',
		term: 'Fingerprint',
		meaning:
			'A short code worked out from something’s contents: change the contents, and the code changes. Put in a file’s name, like kettle.3f9a2c.jpg, it gives a changed file a new name.',
		forms: ['fingerprint', 'fingerprints'],
	},
	{
		id: 'origin-shield',
		term: 'Origin shield',
		meaning:
			'A layer of a CDN between its edge locations and the origin, so the origin is asked once for each file, not once by every location.',
		forms: ['origin shield', 'tiered cache', 'shielding'],
	},
	{
		id: 'edge-function',
		term: 'Edge function',
		meaning:
			'A small program a CDN runs in its edge locations, near the user, before a request goes any further.',
		forms: ['edge function', 'edge functions'],
	},
	{
		id: 'target-tracking',
		term: 'Target tracking',
		meaning:
			'Autoscaling that keeps a measure, like how busy the copies are, near a target, adding or removing copies to stay there.',
		like: 'A thermostat, keeping a room at the temperature you set.',
		forms: ['target tracking'],
	},
	{
		id: 'flapping',
		term: 'Flapping',
		meaning: 'Adding and removing copies again and again, as the traffic wobbles.',
		forms: ['flapping'],
	},
	{
		id: 'cooldown',
		term: 'Cooldown',
		meaning: 'A wait after an autoscaling change before the next one, so it doesn’t flap.',
		forms: ['cooldown', 'cooldowns'],
	},
	{
		id: 'scheduled-scaling',
		term: 'Scheduled scaling',
		meaning: 'Changing the number of copies by the clock, like more from 7:45 pm on sale day.',
		forms: ['scheduled scaling'],
	},
	{
		id: 'predictive-scaling',
		term: 'Predictive scaling',
		meaning:
			'Autoscaling that learns the daily and weekly pattern from past traffic, and adds copies before the rise.',
		forms: ['predictive scaling'],
	},
	{
		id: 'container',
		term: 'Container',
		meaning:
			'A program packed with everything it needs to run, like its libraries and settings, so it runs the same on any machine. It starts in seconds, and many can share one machine.',
		like: 'A shipping container: the same box fits any ship, train or lorry.',
		forms: ['container', 'containers'],
	},
	{
		id: 'kubernetes',
		term: 'Kubernetes',
		meaning:
			'A system that runs containers across many machines. It starts the copies you ask for, restarts broken ones, and lets services find each other by name.',
		forms: ['kubernetes'],
	},
	{
		id: 'horizontal-pod-autoscaler',
		term: 'Horizontal Pod Autoscaler',
		meaning:
			'Kubernetes’ autoscaler. It adds or removes copies of a service to keep a measure, like how busy they are, near a target.',
		forms: ['horizontal pod autoscaler'],
	},
	{
		id: 'drain',
		term: 'Drain',
		meaning:
			'To stop sending a copy new requests, and let it finish the ones it has, before stopping it.',
		forms: ['drain', 'drains', 'drained'],
	},
	{
		id: 'hot-key',
		term: 'Hot key',
		meaning:
			'One key, like a famous product or account, asked for far more often than the rest, so the one place holding it, a cache node or a shard, gets swamped.',
		forms: ['hot key', 'hot keys'],
	},
];
