import type { Track } from '@/learn/course';
import type { Conditions } from '@/sim/scenario';
import { type TrackModule, roomy, copies } from './shared';

const threeCopies: Conditions = { only: ['look-pick'], traffic: 3, bigger: roomy };
const smallCopy: Conditions = {
	only: ['look-pick'],
	traffic: 4,
	bigger: { ...roomy, 'web-3': 0.5 },
};
const sickCopy: Conditions = { ...threeCopies, slow: { 'web-3': 10 } };
const office: Conditions = {
	only: ['look-office'],
	traffic: 4,
	bigger: roomy,
	balancing: { lb: 'hash' },
};
const routed: Conditions = {
	only: ['look-path', 'see-photo'],
	copies: { server: 3 },
	bigger: roomy,
};

type Parts = NonNullable<TrackModule['parts']>;
type Journeys = NonNullable<TrackModule['journeys']>;

/** The three machines a bigger cache is split over, for the hot key. */
const nodes = ['sc-node-1', 'sc-node-2', 'sc-node-3'];

const parts: Parts = [
	...nodes.map((id, i) => ({
		id,
		name: `Cache node ${i + 1}`,
		kind: 'cache' as const,
		layer: 'data' as const,
		summary:
			'One of the three machines a bigger cache is split over. Each key lives on one of them, picked by a hash of the key. It can answer about 2,000 requests a second.',
		why: 'One machine can’t hold, or answer, everything a big shop asks its cache. Three share the keys between them.',
		onFailure: 'The keys it holds go missing, so those requests go to the database instead.',
		scaling:
			'Add nodes for more keys. But one very popular key stays on one node, unless it’s copied to several.',
		capacityPerInstance: 2_000,
		instances: 1,
		latencyMs: 1,
		hitRate: 0.99,
	})),
	{
		id: 'sc-shield',
		name: 'Origin shield',
		kind: 'cdn',
		layer: 'edge',
		summary:
			'One more layer of the CDN, close to file storage. Edge locations that don’t have a photo ask the shield, and only the shield asks file storage.',
		why: 'Otherwise each of the CDN’s hundreds of edge locations fetches every new photo from file storage by itself.',
		onFailure: 'Edge locations fetch from file storage directly, as they did without it.',
		scaling: 'It belongs to the CDN company, which grows it.',
		capacityPerInstance: 20_000,
		instances: 1,
		latencyMs: 40,
		hitRate: 0.9,
	},
];

/** The load balancer passing a request to one of the three web servers, by its rule. */
const toCopies = (shares: number[]) =>
	copies.map((to, i) => ({
		from: 'lb',
		to,
		label: `Pass it to Web server ${i + 1}`,
		pick: true,
		share: shares[i]!,
	}));
const even = [1 / 3, 1 / 3, 1 / 3];
const changePrice = [
	{ from: 'app', to: 'lb', label: 'Change the kettle’s price to ₹1,299' },
	{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
];
const askPage = [
	{ from: 'app', to: 'lb', label: 'Ask for the product page' },
	{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
];

const journeys: Journeys = [
	{
		id: 'sc-cart-memory',
		name: 'Add to cart, kept in a copy’s memory',
		description:
			'Someone adds a product to their cart, and the copy of the web server that answers keeps it in its own memory. With sticky sessions, each shopper stays on one copy, and after a restart most of them ended up on Web server 1.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Add the Blue kettle to my cart' },
			...toCopies([0.6, 0.2, 0.2]),
		],
	},
	{
		id: 'sc-cart-store',
		name: 'Add to cart, kept in a shared store',
		description:
			'Someone adds a product to their cart. Whichever copy of the web server answers reads and saves the cart in the shared cart store.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Add the Blue kettle to my cart' },
			...toCopies(even),
			...copies.map((from) => ({ from, to: 'carts', label: 'Read and save the cart' })),
		],
	},
	{
		id: 'sc-cart-token',
		name: 'Add to cart, kept in a signed cookie',
		description:
			'Someone adds a product to their cart. The cart travels with every request, in a cookie the server signed, so any copy can read it and nothing is kept on the servers.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Add it to my cart, here’s my signed cart cookie' },
			...toCopies(even),
		],
	},
	{
		id: 'sc-upload',
		name: 'Upload a product photo, to shared storage',
		description:
			'A seller uploads a product photo. Whichever copy of the web server takes it saves it in shared file storage, not on its own disk, so every copy can find it.',
		rps: 5,
		hops: [
			{ from: 'app', to: 'lb', label: 'Upload kettle.jpg' },
			...toCopies(even),
			...copies.map((from) => ({ from, to: 'files', label: 'Save it in shared storage' })),
		],
	},
	{
		id: 'sc-write-around',
		name: 'Change a price, around the cache',
		description:
			'The shop changes the Blue kettle’s price. It’s saved in the database only, and the cached copy is left alone until it expires.',
		rps: 5,
		hops: [...changePrice, { from: 'server', to: 'db', label: 'Save the new price' }],
	},
	{
		id: 'sc-write-aside',
		name: 'Change a price, then delete the cached copy',
		description:
			'The shop changes the Blue kettle’s price. It’s saved in the database, then the cached copy is deleted, so the next read fetches the new price.',
		rps: 5,
		hops: [
			...changePrice,
			{ from: 'server', to: 'db', label: 'Save the new price' },
			{ from: 'server', to: 'cache', label: 'Delete the cached copy' },
		],
	},
	{
		id: 'sc-write-through',
		name: 'Change a price, through the cache',
		description:
			'The shop changes the Blue kettle’s price. It’s written to the cache, which writes it to the database and waits, so both have it before the change counts as done.',
		rps: 5,
		hops: [
			...changePrice,
			{ from: 'server', to: 'cache', label: 'Write the new price' },
			{ from: 'cache', to: 'db', label: 'Write it through to the database, and wait' },
		],
	},
	{
		id: 'sc-write-behind',
		name: 'Change a price, written behind',
		description:
			'The shop changes the Blue kettle’s price. It’s written only to the cache, which answers at once and saves it in the database a moment later, in the background.',
		rps: 5,
		hops: [
			...changePrice,
			{ from: 'server', to: 'cache', label: 'Write the new price' },
			{
				from: 'cache',
				to: 'db',
				label: 'Save it in the database later, in a batch',
				mode: 'async',
			},
		],
	},
	{
		id: 'sc-look-once',
		name: 'Look at a product, one refill at a time',
		description:
			'Someone opens a product just after the cache restarted, empty. Only the first request to miss each product reads the database; the others wait a moment for it to refill the cache.',
		rps: 50,
		hops: [
			...askPage,
			{ from: 'server', to: 'cache', label: 'Look in the cache' },
			{
				from: 'cache',
				to: 'db',
				label: 'First to miss it: read the database, refill',
				onMiss: true,
				share: 0.05,
			},
		],
	},
	{
		id: 'sc-look-hot',
		name: 'Look at a product, with a hot key',
		description:
			'Sale day: 7 views in 10 are for the Blue kettle. The cache is split over three nodes, and the kettle’s key lives on node 1.',
		rps: 1_000,
		hops: [
			...askPage,
			...nodes.map((to, i) => ({
				from: 'server',
				to,
				label:
					i === 0
						? 'The kettle, and a third of the rest: ask Cache node 1'
						: `A third of the rest: ask Cache node ${i + 1}`,
				share: i === 0 ? 0.8 : 0.1,
			})),
			...nodes.map((from) => ({
				from,
				to: 'db',
				label: 'Not there: read the database',
				onMiss: true,
			})),
		],
	},
	{
		id: 'sc-look-spread',
		name: 'Look at a product, the hot key copied',
		description:
			'Sale day, with the Blue kettle’s key copied to all three cache nodes, and each request reading one copy at random.',
		rps: 1_000,
		hops: [
			...askPage,
			...nodes.map((to, i) => ({
				from: 'server',
				to,
				label: `Ask Cache node ${i + 1}`,
				share: 1 / 3,
			})),
			...nodes.map((from) => ({
				from,
				to: 'db',
				label: 'Not there: read the database',
				onMiss: true,
			})),
		],
	},
	{
		id: 'sc-photos-shield',
		name: 'See the photos, through a CDN with a shield',
		description:
			'A product page shows four photos, each downloaded from a CDN server nearby. What it doesn’t have, it asks the origin shield for, and only what the shield doesn’t have comes from file storage.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'cdn', label: 'Download the photos', calls: 4 },
			{
				from: 'cdn',
				to: 'sc-shield',
				label: 'Not here: ask the shield',
				onMiss: true,
				calls: 4,
			},
			{
				from: 'sc-shield',
				to: 'files',
				label: 'Not there either: fetch it from storage',
				onMiss: true,
				calls: 4,
			},
		],
	},
	{
		id: 'sc-look-own',
		name: 'See your orders, reading your own writes',
		description:
			'Shoppers open their orders. The few who placed an order in the last few seconds read from the main database; everyone else reads from a copy.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Show me my orders' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{
				from: 'server',
				to: 'db',
				label: 'Ordered seconds ago: read the main database',
				share: 0.1,
			},
			{ from: 'server', to: 'replica', label: 'Read from a copy', share: 0.9 },
		],
	},
	{
		id: 'sc-order-one',
		name: 'Save an order, in one database',
		description: 'Someone places an order. Every order is saved in the one database.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place the order' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Save the order' },
		],
	},
];

// Bigger, or more copies
const oneServer: Conditions = { only: ['look'], bigger: roomy, traffic: 3 };
const outThree: Conditions = {
	only: ['look-lb'],
	bigger: roomy,
	traffic: 3,
	copies: { server: 3 },
};
const dataLimit: Conditions = { only: ['look-lb'], traffic: 4, copies: { server: 3 } };

// Servers that remember nothing
const inMemory: Conditions = { only: ['sc-cart-memory'], traffic: 3 };
const sticky: Conditions = { ...inMemory, balancing: { lb: 'hash' } };
const sharedStore: Conditions = { only: ['sc-cart-store'], traffic: 3 };
const carried: Conditions = { only: ['sc-cart-token'], traffic: 3 };
const uploads: Conditions = { only: ['sc-upload'] };
const storeShown = ['app', 'lb', ...copies, 'carts'];

// Caching
const busyDay: Conditions = { only: ['look-cache'], traffic: 3.4, copies: { server: 3 } };
const cacheShown = ['app', 'lb', 'server', 'cache', 'db'];

// Writes, stampedes and hot keys
const writing = (design: string): Conditions => ({ only: [design, 'look-cache'] });
const saleDay: Conditions = { only: ['look-cache'], traffic: 6, copies: { server: 5 } };
const hotShown = ['app', 'lb', 'server', ...nodes, 'db'];
const hot: Conditions = { only: ['sc-look-hot'], traffic: 3, copies: { server: 50 } };
const spread: Conditions = { only: ['sc-look-spread'], traffic: 3, copies: { server: 50 } };

// Content delivery
const photos: Conditions = { only: ['photos-cdn'] };
const photoSale: Conditions = { only: ['photos-cdn'], traffic: 6 };

// Read copies
const readShown = ['app', 'lb', 'server', 'db', 'replica'];
const readCopies: Conditions = {
	only: ['look-replica', 'order-save'],
	traffic: 3,
	copies: { server: 3, replica: 2 },
};

// Splitting the data
const splitShown = ['app', 'lb', 'server', 'shard-1', 'shard-2'];
const split: Conditions = { only: ['order-split'], traffic: 20, copies: { server: 3 } };

// Autoscaling
const evening: Conditions = { only: ['look-lb'], bigger: roomy, autoscale: true, traffic: 3 };
const receipts: Conditions = { only: ['order'], traffic: 8 };

const scaling: Track = {
	id: 'scaling',
	name: 'Scaling',
	tagline:
		'Bigger servers or more of them, load balancers, caches, CDNs, read copies and splitting the data: how apps grow.',
	lessons: [
		{
			id: 'up-or-out',
			title: 'Bigger, or more copies',
			summary:
				'Two ways to handle more: a bigger machine, or more of them. What each one costs, and why most apps do both.',
			steps: [
				{
					title: 'One server, too many shoppers',
					show: ['app', 'server'],
					journey: 'look',
					set: oneServer,
					facts: ['succeed', { busy: 'server' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A sale brings 150 requests a second. The one **Web server** can answer 100, so it turns the rest away, and a third of the shoppers get an error.',
						'The shop has to grow. There are two ways: make the server bigger, or run more of them.',
					],
				},
				{
					title: 'Scale up: a bigger machine',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...oneServer, bigger: { ...roomy, server: 2 } },
					facts: [
						'succeed',
						{ busy: 'server' },
						{ label: 'Capacity', value: '200/s', hint: 'one server, twice as big' },
					],
					body: [
						'The first way is a bigger computer: more processors, more memory, faster disks. One twice as big answers about twice as many, 200 a second, so it’s 75% busy and everyone gets an answer.',
						'This is called scaling up, or vertical scaling. In the cloud, it means picking a bigger size from a list. Nothing about the app changes, so it’s usually the first thing tried.',
					],
					example: {
						says: 'Sizes of one kind of AWS machine: each of the first three is twice the one before.',
						data: {
							'm7i.large': '2 vCPUs, 8 GiB of memory',
							'm7i.xlarge': '4 vCPUs, 16 GiB',
							'm7i.2xlarge': '8 vCPUs, 32 GiB',
							'm7i.48xlarge, the biggest': '192 vCPUs, 768 GiB',
						},
					},
				},
				{
					title: 'The ceiling',
					show: ['app', 'server'],
					journey: 'look',
					set: { only: ['look'], bigger: { ...roomy, server: 4 }, traffic: 10 },
					facts: [
						'succeed',
						{ busy: 'server' },
						{
							label: 'Biggest machine',
							value: '400/s',
							hint: 'four times the first, and nothing bigger',
						},
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'But there’s a biggest machine. Say the biggest this shop can get is four times the first: 400 a second. A huge sale brings 500, and there’s nowhere left to go, so a fifth of the shoppers get errors.',
						'It gets dearer, too. Bought as hardware, the fastest processors and the biggest machines cost more for each bit of extra power. And past a point, twice the processors rarely means twice the answers, because parts of a program wait for each other, and can’t all run at once.',
					],
				},
				{
					title: 'Still one machine',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...oneServer, bigger: { ...roomy, server: 2 }, down: ['server'] },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'And it’s still one computer. When it breaks, nobody can shop. It’s a single point of failure.',
						'It goes down on purpose, too. Moving to a bigger size usually means stopping the server and starting it again on the new machine: on AWS, a server must be stopped before its size can change. Updates to its operating system often need a restart as well.',
					],
				},
				{
					title: 'Scale out: more copies',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: outThree,
					facts: ['succeed', { busy: 'server' }, { copies: 'server' }],
					copies: true,
					body: [
						'The other way is to run several ordinary servers, all doing the same job. Three copies answer 300 a second between them, so each is half busy.',
						'This is called scaling out, or horizontal scaling. There’s no biggest size: when you need more, you add another copy, without stopping the others. A **Load balancer** in front shares the requests between them. The next three lessons are about it.',
					],
				},
				{
					title: 'One copy breaks',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: { ...outThree, copies: { server: 2 } },
					facts: ['succeed', { busy: 'server' }, { copies: 'server' }],
					copies: true,
					body: [
						'When one of the three breaks, the other two carry on. They’re busier, at 75%, but everyone still gets an answer. Copies can also be updated one at a time, so the shop never has to close.',
						'Many small machines also follow the traffic better than one big one: more copies for the evening, fewer at night. Autoscaling, at the end of this track, does that by itself.',
					],
				},
				{
					title: 'The data doesn’t copy so easily',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: dataLimit,
					facts: ['succeed', { busy: 'server' }, { busy: 'db' }],
					copies: true,
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Scaling out needs two things first: something to share the requests, the load balancer, and servers that remember nothing between requests, so any copy can answer anyone. The next lessons cover both.',
						'The harder part is the data. Web servers are easy to copy because they all read the same **Database**. Now 200 shoppers a second arrive. The web servers are fine, at 67%, but the database can answer only 150, so a quarter of the requests fail.',
						'A database can’t simply run copies that each take orders: they’d have to agree on every one. Spreading a database takes read copies, or splitting the data, both later in this track.',
					],
				},
				{
					title: 'Scale the database up first',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { ...dataLimit, bigger: { db: 2 } },
					facts: ['succeed', { busy: 'db' }],
					copies: true,
					body: [
						'So the usual move is to scale out the web servers, and scale up the database. A **Database** twice as big answers 300 a second, and it’s two-thirds busy.',
						'A big database machine goes a long way. Stack Overflow is a well-known example: for years, one of the busiest sites on the web ran on a handful of web servers and a few very large SQL Server machines.',
						'Only when the biggest database isn’t enough do apps add read copies, or split the data.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { ...dataLimit, bigger: { db: 2 } },
					copies: true,
					body: [
						'Most apps do both: many copies where copying is easy, and a bigger machine where it isn’t.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Scale up',
								'Early on, and for what’s hard to copy, like the main database. Simple: nothing about the app changes. But there’s a biggest machine, resizing needs a restart, and one breaking stops everything.',
							],
							[
								'Scale out',
								'Servers that remember nothing, like web servers and workers. No ceiling, one breaking doesn’t matter, and copies can follow the traffic. Needs a load balancer.',
							],
							[
								'Both',
								'What most apps do: many copies of the web server in front of one big database, then a cache, read copies, and last of all, splitting the data.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with 200 shoppers a second and three web servers. From the web server’s details, change how many copies it runs, and see that the database stays the limit.',
				journey: 'look-lb',
				set: dataLimit,
			},
		},
		{
			id: 'load-balancing',
			title: 'Load balancing',
			summary:
				'One address in front of many copies: sharing the work, skipping broken copies, and keeping the load balancer itself from breaking.',
			steps: [
				{
					title: 'Which copy?',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					current: [['app', 'lb']],
					set: threeCopies,
					facts: [{ load: 'lb' }],
					body: [
						'With three copies of the web server, which one should your phone ask? Phones can’t keep track of which copies are running, which are busy, or which were added a minute ago.',
						'So a **Load balancer** stands in front of them. The shop’s name, shop.example.com, leads to the load balancer’s address, and that’s the only address the app ever knows. The load balancer takes each request, passes it to one of the copies, and passes the answer back.',
						'Because it stands in for the copies like this, it’s also called a reverse proxy. The copies get private addresses inside the data centre, so nobody outside can reach them directly.',
					],
					example: {
						says: 'GET shop.example.com/products/77',
						data: {
							'the app connects to': 'the load balancer, 203.0.113.10',
							'which passes it to': 'Web server 2, at 10.0.1.12 (private)',
							answer: 'the Blue kettle’s page, through the load balancer',
						},
					},
				},
				{
					title: 'Sharing out the work',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					current: [
						['lb', 'web-1'],
						['lb', 'web-2'],
						['lb', 'web-3'],
					],
					set: threeCopies,
					facts: [{ load: 'lb' }, { busyEach: copies }],
					body: [
						'The simplest way to share the work is to take turns: the first request goes to copy 1, the next to copy 2, then copy 3, and round again. That’s called round robin.',
						'The 150 requests a second become 50 for each copy, and each is half busy. No copy is overloaded while another sits idle.',
						'Taking turns isn’t the only way to choose, and it isn’t always the best. The next lesson is about the others.',
					],
					example: {
						says: 'Four requests in a row, taking turns.',
						data: {
							'request 1': 'Web server 1',
							'request 2': 'Web server 2',
							'request 3': 'Web server 3',
							'request 4': 'Web server 1 again',
						},
					},
				},
				{
					title: 'A copy breaks, and nobody notices',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: { ...threeCopies, down: ['web-2'], healthChecks: false },
					facts: ['succeed', { busyEach: copies }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'**Web server 2** crashes. If the load balancer just keeps taking turns, every third request still goes to it, and fails after waiting for a timeout.',
						'One copy in three is broken, so one shopper in three gets an error, even though two healthy copies have plenty of room.',
					],
				},
				{
					title: 'Health checks',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: { ...threeCopies, down: ['web-2'] },
					facts: ['succeed', { busyEach: copies }],
					body: [
						'So the load balancer checks on every copy, every couple of seconds, by asking a special address like /health. A copy that fails a few checks in a row is taken out, and gets no more requests. When it passes a couple in a row, it’s put back. HAProxy, for example, checks every 2 seconds, takes a copy out after 3 failed checks, and puts it back after 2 good ones.',
						'Now copies 1 and 3 share the work, at three quarters busy each, and every page works. That’s an active health check.',
						'Many load balancers also watch the real requests: a copy whose answers keep failing is taken out for a while, even if its health check passes. That’s a passive health check, also called outlier detection.',
					],
					example: {
						says: 'GET /health, to every copy, every 2 seconds.',
						data: {
							'Web server 1': '200 OK',
							'Web server 2': 'no answer, the third time in a row: taken out',
							'Web server 3': '200 OK',
						},
					},
					note: {
						title: 'What should /health check?',
						text: 'Only that this copy can do its own job. If it also checks the database, then one slow moment at the database fails every copy’s check at once, and the load balancer takes them all out.',
					},
				},
				{
					title: 'Adding and removing copies',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: threeCopies,
					facts: [{ busyEach: copies }],
					body: [
						'When a copy is added, by hand or by autoscaling, it’s registered with the load balancer, and starts getting requests once it passes its health checks. The app never needs to know.',
						'A new copy starts cold, with nothing in its memory yet, so some load balancers send it a few requests at first, and more over the next half a minute or so. That’s slow start.',
						'Removing a copy is gentler still. The load balancer stops sending it new requests, but lets the ones it’s working on finish first. That’s connection draining: AWS waits up to 5 minutes by default. It’s how a new version goes out with no errors: drain a copy, update it, put it back, then the next one. That’s a rolling deploy.',
					],
					example: {
						says: 'A rolling deploy of a new version.',
						data: {
							'Web server 1': 'draining, then updated, then back',
							'Web server 2': 'next',
							'Web server 3': 'last',
						},
					},
				},
				{
					title: 'The load balancer breaks',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: { ...threeCopies, down: ['lb'] },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Everything goes through the load balancer, so if it breaks, nobody can shop, however many copies are behind it. It’s a single point of failure.',
						'So it runs as a pair. One works, the other stands by, and they share a virtual address. When the standby stops hearing from the working one, it takes over the address within seconds, and the apps never notice. Tools like keepalived do this.',
						'A cloud load balancer, like AWS’s or Google’s, is many machines behind one name, spread over several zones, and the cloud company keeps it running for you.',
					],
				},
				{
					title: 'Load balancers you’ll meet',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: threeCopies,
					body: [
						'A load balancer is usually a program you run, a service your cloud runs for you, or, in older data centres, a box you buy. They all do the same job: one address in front, health checks, and a rule for choosing a copy.',
					],
					compare: {
						title: 'Common load balancers',
						rows: [
							[
								'nginx',
								'A web server that’s also a popular load balancer. Free, and used by a huge share of sites.',
							],
							[
								'HAProxy',
								'Built only to balance load, and very fast. Used by GitHub, Reddit and many others.',
							],
							[
								'Envoy',
								'Made at Lyft for services calling each other inside a data centre, with detailed health checks and timings.',
							],
							[
								'AWS ALB and NLB',
								'Amazon’s load balancers, run for you. The ALB reads each request; the NLB only passes connections on, very fast. The next lessons explain the difference.',
							],
							[
								'DNS with several addresses',
								'Giving out a few addresses for one name spreads people out, but there are no health checks, and phones remember an address for minutes, so it’s rarely enough alone.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with three copies. Take a copy down from its details, then select the load balancer and turn its health checks off and on.',
				journey: 'look-pick',
				set: threeCopies,
			},
		},
		{
			id: 'lb-algorithms',
			title: 'How a load balancer picks a copy',
			summary:
				'Round robin, weights, least connections, least response time, two random choices, and hashing: what each one does, and when it goes wrong.',
			steps: [
				{
					title: 'Round robin: take turns',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: threeCopies,
					facts: ['succeed', 'wait', { busyEach: copies }],
					body: [
						'Round robin takes turns, and it’s what most load balancers do unless told otherwise. It’s simple and fair, and the load balancer doesn’t need to know anything about the copies.',
						'It works well when two things are true: the copies are alike, and the requests take about the same work. Here, both are true: three equal copies, each half busy.',
						'The next steps break one of them at a time.',
					],
				},
				{
					title: 'An older, smaller copy',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: smallCopy,
					facts: ['succeed', { busyEach: copies }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'On a busy evening, 200 requests arrive a second. **Web server 3** is an older machine, half as powerful as the others: it can do 50 a second, not 100.',
						'Round robin doesn’t know that, so it still sends each copy a third. Copies 1 and 2 are two thirds busy, while copy 3 gets more than it can handle, and turns some away. About 1 request in 12 fails.',
					],
				},
				{
					title: 'Weighted round robin',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: { ...smallCopy, balancing: { lb: 'weighted' } },
					facts: ['succeed', { busyEach: copies }],
					body: [
						'So each copy is given a weight, by its size: 2 for the new machines, 1 for the old one. Out of every 5 requests, copies 1 and 2 get 2 each, and copy 3 gets 1.',
						'Now every copy is equally busy, and every request works.',
						'Weights are set by people, in advance. They’re right for differences you know about, like machines of different sizes, or sending just 5% of requests to a new version to see if it works. That’s called a canary.',
					],
					example: {
						says: 'Weights 2, 2 and 1: every 5 requests.',
						data: {
							'Web server 1': '2 of them',
							'Web server 2': '2 of them',
							'Web server 3': '1 of them',
						},
					},
				},
				{
					title: 'A copy falls sick',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: sickCopy,
					facts: ['succeed', 'wait', { busyEach: copies }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Now the copies are alike again, but **Web server 3** falls sick: its disk is failing, or another program on the same machine is hogging it, a noisy neighbour. Every request there takes ten times as long.',
						'It still answers its health check, so it stays in. Round robin keeps sending it a third of the requests, and weights don’t help: nobody knew in advance. It can’t keep up, and about 1 request in 4 fails.',
						'A copy that’s slow or half-working, but not dead, is called a gray failure. It’s one of the hardest problems to spot.',
					],
				},
				{
					title: 'Least connections',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: { ...sickCopy, balancing: { lb: 'least-connections' } },
					facts: ['succeed', 'wait', { busyEach: copies }],
					body: [
						'Instead, the load balancer counts the requests each copy is still working on, and sends each new one to the copy with the fewest. That’s least connections.',
						'A slow copy holds on to its requests for longer, so its count stays high, and it gets fewer new ones. Here, the sick copy gets about 1 request in 20, and every request works. Nobody had to change anything: it adapts by itself.',
						'It also helps when requests take very different times, like a quick page next to a big upload, or connections that stay open for minutes. With copies of different sizes, it’s used with weights: weighted least connections.',
					],
					example: {
						says: 'Requests open right now, on each copy.',
						data: {
							'Web server 1': '3',
							'Web server 2': '2: the next request goes here',
							'Web server 3': '21, still working on old ones',
						},
					},
				},
				{
					title: 'Least response time',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: { ...sickCopy, balancing: { lb: 'least-time' } },
					facts: ['succeed', 'wait', { busyEach: copies }],
					body: [
						'Some load balancers also time every answer, and send each request to the copy answering fastest. That’s least response time.',
						'The sick copy gets nothing at all now: the healthy ones answer faster, even when busy. It would only get requests if the others got so busy that they were as slow.',
						'The cost is that the load balancer has to measure and remember every copy’s times. And a broken copy that answers with an error at once can look like the fastest, so it’s always used with health checks. NGINX Plus calls it least_time.',
					],
				},
				{
					title: 'Many load balancers: two random choices',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: { ...sickCopy, balancing: { lb: 'least-connections' } },
					facts: ['succeed', { busyEach: copies }],
					body: [
						'Big sites run many load balancers side by side, and each one only knows the requests it sent itself. If all of them send to the copy that looks least busy, they all pick the same one at the same moment, and swamp it.',
						'Picking at random avoids that, but it’s blind. The trick in between: pick two copies at random, and send the request to whichever of the two has fewer open. It’s nearly as good as least connections, it’s cheap, and the load balancers don’t gang up on one copy.',
						'This is called the power of two choices. It’s what Envoy’s “least request” does, and HAProxy’s random rule.',
					],
					example: {
						says: 'Two copies, picked at random.',
						data: {
							'Web server 1': '4 open',
							'Web server 3': '2 open: the request goes here',
						},
					},
				},
				{
					title: 'The same shopper, the same copy: hashing',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: { ...threeCopies, balancing: { lb: 'hash' } },
					facts: [{ busyEach: copies }],
					body: [
						'Sometimes you want each shopper to keep going to the same copy, because it keeps something for them in memory: their recommendations, say, or a game in progress.',
						'So the load balancer turns the shopper’s address into a number, a hash, and picks the copy from it. The same address always gives the same number, so the same copy. With many shoppers, the numbers spread evenly, and the copies share the work. In nginx, this is ip_hash.',
					],
					example: {
						says: 'Picking a copy from the address.',
						data: {
							address: '49.36.12.8',
							hash: '2,874,113,906',
							'divided by 3, the remainder': '2, so Web server 3, every time',
						},
					},
				},
				{
					title: 'A whole office behind one address',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-office',
					set: office,
					facts: ['succeed', { busyEach: copies }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'But addresses aren’t people. A company’s 2,000 staff reach the internet through one office address, and a mobile network puts thousands of phones behind a few. During a sale, a big share of shoppers can come from one address, and they all land on the same copy.',
						'Here, 6 shoppers in 10 hash to **Web server 1**, which can’t keep up, while the others sit two-fifths busy.',
						'And adding a fourth copy changes “divided by 3” to “divided by 4”, which moves three shoppers in four to a new copy. Consistent hashing, from a later lesson, fixes that part.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: threeCopies,
					body: [
						'There’s no best rule, only the best one for what varies: the copies, the requests, or the shoppers.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Round robin',
								'The copies are alike, and requests are similar. The default almost everywhere.',
							],
							[
								'Weighted round robin',
								'Copies of different sizes, or a small share for a new version, a canary.',
							],
							[
								'Least connections',
								'Requests that take very different times, or copies that slow down. It adapts by itself.',
							],
							[
								'Least response time',
								'When copies’ speed changes a lot, and the load balancer can time every answer.',
							],
							[
								'Two random choices',
								'Many load balancers sharing the same copies, or thousands of copies.',
							],
							[
								'Hashing the address',
								'When a copy keeps something for each shopper. Better still, keep that in a shared store, and use any rule.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the sick copy. Select the load balancer, change how it picks a copy, and watch where the requests go.',
				journey: 'look-pick',
				set: sickCopy,
			},
		},
		{
			id: 'lb-layers',
			title: 'Layer 4 and layer 7',
			summary:
				'What a load balancer can see: just connections, or each request. Routing by page, HTTPS, sticky cookies, and sending people to the nearest region.',
			steps: [
				{
					title: 'What a load balancer can see',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					current: [['app', 'lb']],
					set: threeCopies,
					body: [
						'A request travels in layers, like a letter in an envelope in a parcel. The outside says which computer and which port it’s for: that’s the connection, layer 4. Inside is the request itself, the page asked for, the headers and cookies: that’s layer 7.',
						'A load balancer works at one layer or the other, and that decides what it can do.',
					],
					example: {
						says: 'One request, seen at each layer.',
						data: {
							'layer 4 sees':
								'from 49.36.12.8, port 52144, to 203.0.113.10, port 443',
							'layer 7 also sees': 'GET /products/77, Cookie: cart=5521',
						},
					},
				},
				{
					title: 'Layer 4: fast, and blind',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					current: [
						['lb', 'web-1'],
						['lb', 'web-2'],
						['lb', 'web-3'],
					],
					set: threeCopies,
					facts: [{ busyEach: copies }],
					body: [
						'A layer 4 load balancer picks a copy when a connection opens, then passes the bytes along without reading them. It does very little, so it’s very fast, and handles millions of connections.',
						'It works for anything, not just web pages: databases, games, video calls. But it can’t see which page is asked for, so it can’t send different pages to different servers, and every request on one connection goes to the same copy. AWS’s Network Load Balancer works like this.',
					],
				},
				{
					title: 'Layer 7: reads each request',
					show: ['app', 'lb', 'server', 'images', 'db'],
					journey: 'look-path',
					draw: ['see-photo'],
					current: [
						['lb', 'server'],
						['lb', 'images'],
					],
					set: routed,
					copies: true,
					facts: [{ load: 'server' }, { load: 'images' }],
					body: [
						'A layer 7 load balancer reads each request. So it can send pages to the web servers, and every address starting /images/ to separate **Image servers**, each kind sized for its own work.',
						'It can also route by header, sending the app and the website to different servers, try a failed request again on another copy, compress answers, and turn away a user who asks too often. nginx, HAProxy, Envoy and AWS’s Application Load Balancer all work at layer 7.',
						'Reading every request is more work, so a layer 7 load balancer handles fewer requests than a layer 4 one on the same machine.',
					],
					example: {
						says: 'Two requests, two destinations.',
						data: {
							'GET /products/77': 'to the web servers',
							'GET /images/kettle.jpg': 'to the image servers',
						},
					},
				},
				{
					title: 'HTTPS ends at the load balancer',
					show: ['app', 'lb', 'server', 'images', 'db'],
					journey: 'look-path',
					draw: ['see-photo'],
					current: [['app', 'lb']],
					set: routed,
					copies: true,
					body: [
						'Requests arrive encrypted, as HTTPS. To read them, a layer 7 load balancer has to decrypt them, so it holds the shop’s certificate, the proof that it really is shop.example.com.',
						'Decrypting once, at the front, saves every copy that work, and the certificate is renewed in one place. That’s called TLS termination. Inside, the load balancer passes plain requests over the private network, or encrypts them again where the inside must be secured too, as banks do.',
						'A layer 4 load balancer can pass HTTPS through untouched, and then each copy holds the certificate and decrypts it.',
					],
					example: {
						says: 'The same request, on each part of its way.',
						data: {
							'phone to load balancer': 'HTTPS, encrypted',
							'load balancer to web server':
								'plain HTTP inside the data centre, or HTTPS again',
						},
					},
				},
				{
					title: 'Sticky sessions with a cookie',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: threeCopies,
					facts: [{ busyEach: copies }],
					body: [
						'At layer 7, a load balancer can keep each shopper on one copy better than by address: with the first answer, it sets a cookie saying which copy, and every later request carrying that cookie goes back there. That’s a sticky session, and an office of 2,000 people gets 2,000 different cookies.',
						'It still has costs. The load can end up uneven, as some shoppers stay for hours. And when that copy breaks, its shoppers lose whatever it kept for them.',
						'That’s why servers that remember nothing, with carts and sessions in a shared store, are better: then any copy will do, and any rule works.',
					],
					example: {
						says: 'The first answer sets a cookie.',
						data: {
							'Set-Cookie': 'srv=2',
							'every later request': 'carries srv=2, so goes to Web server 2',
						},
					},
				},
				{
					title: 'Many regions: global load balancing',
					show: ['app', 'lb', 'web-1', 'web-2', 'web-3'],
					journey: 'look-pick',
					set: threeCopies,
					body: [
						'A big shop runs in several regions, each with its own load balancers and copies. Something has to send each shopper to the right region, before any load balancer sees them.',
						'One way is DNS: when a phone looks up shop.example.com, it’s given the address of the nearest region, and never one that’s down. That’s GeoDNS. But phones remember the answer for a while, so moving people away from a region takes minutes.',
						'The other is anycast: every region announces the same address, and the internet’s own routing takes each shopper to the nearest one. If a region goes quiet, traffic flows to the next nearest within seconds. Cloudflare and Google’s global load balancers work this way.',
					],
					example: {
						says: 'Looking up shop.example.com.',
						data: {
							'from Bengaluru': 'the Mumbai region’s address',
							'from London': 'the Frankfurt region’s address',
							'Mumbai is down': 'Bengaluru is sent to Singapore instead',
						},
					},
				},
				{
					title: 'Which layer when',
					show: ['app', 'lb', 'server', 'images', 'db'],
					journey: 'look-path',
					draw: ['see-photo'],
					set: routed,
					copies: true,
					body: [
						'Big sites often use both: a layer 4 load balancer in front, fast and able to take anything, passing connections to layer 7 load balancers behind it, which read the requests and route them. And DNS or anycast in front of it all, to pick the region.',
					],
					compare: {
						title: 'Which layer when',
						rows: [
							[
								'Layer 4',
								'Any protocol, the most connections, the least delay, HTTPS passed through untouched. Can’t route by page.',
							],
							[
								'Layer 7',
								'Routes by page, header or cookie, ends HTTPS, retries, limits how often each user asks. More work for each request.',
							],
							[
								'DNS or anycast',
								'Sends each user to the nearest region, and away from one that’s down.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the pages and the images routed apart. Push the traffic up, and see which servers fill first.',
				journey: 'look-path',
				set: routed,
			},
		},
		{
			id: 'stateless',
			title: 'Servers that remember nothing',
			summary:
				'What a server remembers, why that stops copies sharing the work, and where to keep it instead: sticky sessions, a shared store, or a signed token.',
			steps: [
				{
					title: 'What a server remembers',
					show: ['app', 'lb', ...copies],
					journey: 'sc-cart-memory',
					current: [
						['app', 'lb'],
						['lb', 'web-1'],
					],
					set: inMemory,
					body: [
						'Riya adds the Blue kettle to her cart. The **Load balancer** passes her request to **Web server 1**, which keeps her cart in its own memory.',
						'Anything a server keeps from one request to the next is called state: who’s signed in, their session; what’s in their cart; a checkout half done; a photo just uploaded. A server that keeps state like this is stateful.',
					],
					example: {
						says: 'Add the Blue kettle to my cart.',
						data: {
							'answered by': 'Web server 1',
							cart: 'Blue kettle × 1',
							'kept in': 'Web server 1’s memory',
						},
					},
				},
				{
					title: 'The next tap goes elsewhere',
					show: ['app', 'lb', ...copies],
					journey: 'sc-cart-memory',
					current: [['lb', 'web-2']],
					set: inMemory,
					facts: [{ busyEach: copies }],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'The load balancer takes turns, so Riya’s next tap goes to **Web server 2**. It has never seen her cart, so it tells her the cart is empty.',
						'The copies share the work evenly, each half busy, but each one only knows the shoppers it happened to answer. Servers that keep state and a load balancer that shares the work don’t mix.',
					],
					example: {
						says: 'Show me my cart.',
						data: { 'answered by': 'Web server 2', answer: 'Your cart is empty' },
					},
				},
				{
					title: 'Sticky sessions',
					show: ['app', 'lb', ...copies],
					journey: 'sc-cart-memory',
					set: sticky,
					facts: [{ busyEach: copies }, 'wait'],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'One fix is to keep each shopper on the copy that has their cart. The load balancer sets a cookie naming the copy, and sends every later request back there. That’s a sticky session, and Riya’s cart works again.',
						'But the load drifts uneven. Web servers 2 and 3 restarted for an update an hour ago; their shoppers moved to **Web server 1**, and stayed. Now copy 1 is 90% busy, and slow, while the other two sit at 30%. The load balancer can’t move anyone without losing their cart.',
					],
				},
				{
					title: 'A sticky copy breaks',
					show: ['app', 'lb', ...copies],
					journey: 'sc-cart-memory',
					set: { ...sticky, down: ['web-1'] },
					facts: [{ busyEach: copies }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'**Web server 1** crashes. Health checks send its shoppers to the other copies, so pages still load. But their carts were in its memory: six shoppers in ten just lost them.',
						'The same happens on purpose. To put out a new version, or when autoscaling removes copies at night, a sticky copy can’t go without taking its carts with it, unless you wait for every one of its shoppers to leave, which can take hours.',
					],
				},
				{
					title: 'A shared session store',
					show: storeShown,
					journey: 'sc-cart-store',
					current: copies.map((from): [string, string] => [from, 'carts']),
					set: sharedStore,
					facts: ['wait', { busyEach: copies }, { busy: 'carts' }],
					body: [
						'The better fix: the copies keep nothing between requests. They’re stateless. Riya’s cart goes into a shared **Cart store**, and whichever copy answers reads it from there. The load balancer can take turns again, and the copies are evenly half busy.',
						'The store is usually Redis or Memcached, kept in memory, so it answers in a millisecond or two, and thousands of requests a second. Each request makes one more call, but that’s a small price.',
					],
					warn: 'If the cart store goes down, nobody can use a cart. So it runs with a copy that takes over, like Redis with Sentinel, or a managed service like Amazon ElastiCache. Memcached keeps no copies, and forgets everything when it restarts, so it suits data you can lose.',
					example: {
						says: 'Show me my cart.',
						data: {
							'the app sends': 'Cookie: session=8f3a91c2',
							'any copy asks the store': 'GET session:8f3a91c2',
							answer: 'Riya, cart: Blue kettle × 1',
						},
					},
				},
				{
					title: 'Now any copy will do',
					show: storeShown,
					journey: 'sc-cart-store',
					set: { ...sharedStore, down: ['web-1'] },
					facts: ['succeed', { busyEach: copies }],
					body: [
						'Now when **Web server 1** breaks, its shoppers move to the other two, and their carts are still there, in the store. Nobody notices.',
						'Copies can be added, removed and updated one at a time, whenever you like. That’s what makes load balancing, rolling deploys and autoscaling work, and why most services in big apps are built this way.',
					],
				},
				{
					title: 'Or let the app carry it',
					show: ['app', 'lb', ...copies],
					journey: 'sc-cart-token',
					current: [['app', 'lb']],
					set: carried,
					facts: ['wait', { busyEach: copies }],
					body: [
						'A third way is to give the state to the app to carry. The server writes it down, signs it with a secret key, and sends it back in a cookie. Every later request brings it along, and any copy can check the signature and trust it: nobody can change it without the key. Rails keeps its sessions this way by default, encrypted as well as signed.',
						'For who’s signed in, it’s usually a JSON Web Token, a JWT: what it says, and a signature. There’s no store to ask, or to keep running, so each request here takes 21 ms, against 23 ms with the cart store.',
					],
					note: {
						title: 'What a token costs',
						text: 'It travels with every request, so it must stay small: browsers keep each cookie to about 4 KB. A JWT is signed, not hidden, so anyone holding it can read it. And it can’t be taken back: if Riya’s account is blocked, her token still works until it expires. So tokens last minutes, not days, and a list of cancelled ones is kept, which is state again.',
					},
					example: {
						says: 'A JWT: three parts, joined by dots.',
						data: {
							header: 'eyJhbGciOiJIUzI1NiJ9, which says: signed with HS256',
							'what it says': 'sub: riya, exp: 15 minutes from now',
							signature: 'made with the shop’s secret key',
						},
					},
				},
				{
					title: 'Files are state too',
					show: ['app', 'lb', ...copies, 'files'],
					journey: 'sc-upload',
					current: [['web-2', 'files']],
					set: uploads,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A seller uploads a photo of the Blue kettle, and **Web server 2** saves it on its own disk. Copies 1 and 3 can’t find it. And when copy 2 is replaced, the photo’s gone, since a fresh copy starts with a fresh disk.',
						'So uploads go to shared **File storage**, like Amazon S3, and the database keeps only each file’s name. Logs leave the copies too, for one central place.',
					],
					example: {
						says: 'Upload kettle.jpg.',
						data: {
							'saved in': 'File storage, as products/77/kettle.jpg',
							'the database keeps': 'the name, products/77/kettle.jpg',
							'read by': 'any copy',
						},
					},
				},
				{
					title: 'Which one when',
					show: storeShown,
					journey: 'sc-cart-store',
					set: sharedStore,
					body: [
						'A server can still keep things in memory that it’s fine to lose, like a copy of popular products: that’s a cache. What matters is that losing a copy loses nothing that can’t be fetched again.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Sticky sessions',
								'A quick fix for an old app that keeps state in memory. The load drifts uneven, and a copy that breaks or is removed loses its shoppers’ state.',
							],
							[
								'A shared store, like Redis',
								'The usual choice for sessions and carts. Any copy will do. One more call each time, and the store must keep running, with a copy.',
							],
							[
								'A signed cookie or token, like a JWT',
								'Small state that’s needed on every request, like who’s signed in. Nothing to store or ask. It must stay small, can be read, and can’t be taken back before it expires.',
							],
							[
								'The database',
								'State that must last, like a saved cart or an order. Slower than memory, but already there, and already safe.',
							],
							[
								'Shared file storage, like S3',
								'Uploads, and anything else a server would put on its own disk.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the carts in a shared store. Take a web server down from its details, then the cart store, and see which one the shoppers notice.',
				journey: 'sc-cart-store',
				set: sharedStore,
			},
		},
		{
			id: 'caching',
			title: 'Caching',
			summary:
				'Keep popular answers close, so the database isn’t asked the same thing all day: where caches sit, hit rates, eviction, expiry, and what to leave out.',
			steps: [
				{
					title: 'The same question, all day',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { only: ['look-lb'], traffic: 3.4, copies: { server: 3 } },
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'On a busy day, 170 product pages are opened every second, and the **Database** can answer 150. So about 1 shopper in 8 gets an error.',
						'But most of those pages are the same few popular products, and a product’s details rarely change. The database works out the same answers again and again.',
					],
				},
				{
					title: 'A cache in front',
					show: cacheShown,
					journey: 'look-cache',
					current: [['server', 'cache']],
					set: busyDay,
					facts: ['succeed', { load: 'db' }, { busy: 'db' }],
					body: [
						'A **Cache** keeps answers in memory, where they’re very quick to read. The server asks it first. When it has the answer, a cache hit, it takes about a millisecond, against 15 for the **Database**.',
						'Here, 9 requests in 10 are hits. The database is asked only 17 times a second, and everyone gets an answer.',
					],
				},
				{
					title: 'A miss, then fill it: cache-aside',
					show: cacheShown,
					journey: 'look-cache',
					current: [['cache', 'db']],
					set: busyDay,
					facts: [
						{ label: 'Hit rate', value: '90%', hint: '9 in 10 answered by the cache' },
						'wait',
					],
					timeline: true,
					body: [
						'When the cache doesn’t have the answer, a cache miss, the server reads the **Database** as before, then puts the answer in the **Cache**, so the next shopper gets a hit.',
						'The app does the work, and the cache sits to one side, so this is called cache-aside, or lazy loading. Only what’s asked for gets cached. The other way is read-through: the cache fetches from the database itself on a miss, as Amazon’s DAX does for DynamoDB.',
					],
					example: {
						says: 'Show me product 77, the Blue kettle.',
						data: {
							'ask the cache': 'GET product:77, and nothing’s there',
							'ask the database': 'SELECT * FROM products WHERE id = 77',
							'keep it for 5 minutes': 'SET product:77 … EX 300',
							answer: 'the Blue kettle, ₹1,499',
						},
					},
				},
				{
					title: 'Where caches sit',
					show: ['app', 'cdn', 'lb', 'server', 'cache', 'db'],
					journey: 'look-cache',
					draw: ['photos-cdn'],
					set: { ...busyDay, only: ['look-cache', 'photos-cdn'] },
					body: [
						'A request can meet a cache at every step of its way. The nearer the shopper, the quicker the answer, but the harder it is to change.',
					],
					compare: {
						title: 'Where caches sit',
						rows: [
							[
								'The phone or browser',
								'Keeps files it’s told it may, like photos and the app’s own files. Nothing to ask at all, but the shop can’t reach in to change them.',
							],
							[
								'A CDN',
								'Servers near the shoppers, keeping what’s the same for everyone. That’s a later lesson.',
							],
							[
								'The server’s own memory',
								'Each copy keeps a few very popular answers. As fast as it gets, but each copy has its own, and they can disagree.',
							],
							[
								'A shared cache, like Redis or Memcached',
								'One cache that every copy uses, a millisecond away. What this lesson is about.',
							],
							[
								'The database’s own',
								'Postgres and MySQL keep recently read data in memory, and go to the disk only for the rest. It’s automatic, but every request still reaches the database.',
							],
						],
					},
				},
				{
					title: 'When the cache is full',
					show: cacheShown,
					journey: 'look-cache',
					set: { ...busyDay, hitRate: { cache: 0.5 } },
					facts: [
						{ label: 'Hit rate', value: '50%', hint: 'the cache is too small' },
						{ load: 'db' },
						{ busy: 'db' },
					],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A cache has only so much memory. When it’s full, each new answer pushes an old one out: that’s eviction. Most caches throw out the one read longest ago, least recently used, or LRU. Some throw out the one read least often, least frequently used, or LFU, which keeps the steady favourites. Redis lets you choose, with its maxmemory-policy setting. Its default, noeviction, throws nothing out: once its memory limit is reached, new writes fail. So a cache is set to evict, with allkeys-lru, say.',
						'If the cache is too small for what’s asked, answers are pushed out before they’re read again, and the hit rate falls. Here it’s 50%, and the database gets 85 requests a second, five times as many. What counts is the misses, and they went from 1 in 10 to 5 in 10.',
					],
					example: {
						says: 'The cache is full, and product 912 arrives.',
						data: {
							LRU: 'throws out product 3, last read 2 hours ago',
							LFU: 'throws out product 40, read twice today',
							'product 77, the Blue kettle': 'read every second, so it stays',
						},
					},
				},
				{
					title: 'Big enough for the working set',
					show: cacheShown,
					journey: 'look-cache',
					set: { ...busyDay, hitRate: { cache: 0.99 } },
					facts: [
						{ label: 'Hit rate', value: '99%', hint: 'the working set fits' },
						{ load: 'db' },
						{ busy: 'db' },
					],
					body: [
						'The data asked for often is called the working set. Most shoppers look at the same few hundred products, so it’s a small share of everything in the database. Give the cache enough memory to hold it, with room to spare, and the hit rate climbs.',
						'From 90% to 99% sounds small. But the misses fall from 10 in 100 to 1 in 100, so the database does a tenth of the work: under 2 requests a second.',
					],
				},
				{
					title: 'Old answers: expiry',
					show: cacheShown,
					journey: 'look-cache',
					set: busyDay,
					facts: [
						{
							label: 'Kept for',
							value: '5 min',
							hint: 'then read again from the database',
						},
					],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'The shop drops the Blue kettle’s price to ₹1,299, but the cache still holds ₹1,499. An answer that’s out of date like this is called stale.',
						'So every answer is kept for a set time, its time to live, or TTL, then thrown away and read again. A short TTL means fresher answers but more misses; a long one, more hits but staler answers. Product details might keep for 5 minutes, a stock count for a few seconds.',
						'Better still is to delete the cached copy the moment the data changes. That’s the next lesson.',
					],
					example: {
						says: 'Product 77, a minute after the price changed.',
						data: { database: '₹1,299', cache: '₹1,499, for 4 more minutes' },
					},
				},
				{
					title: 'What to cache, and what not',
					show: cacheShown,
					journey: 'look-cache',
					set: busyDay,
					body: [
						'A cache earns its place for data that’s read far more often than it changes, is slow to work out, and can be a little out of date.',
						'Cache “not found” too, briefly. Otherwise requests for a product that doesn’t exist, by mistake or from an attacker, miss every time, and every one reaches the database.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Cache it, for minutes',
								'Product details, the categories, the home page’s best sellers. Read all day, rarely changed.',
							],
							[
								'Cache it, briefly',
								'Prices and stock shown on a product page, search results, another service’s slow answers: seconds to a minute.',
							],
							[
								'Read the database',
								'The stock left at checkout, a payment, an order just placed: anything that must be exactly right at that moment.',
							],
							[
								'Don’t cache',
								'Data written more often than it’s read. And never one shopper’s data under a key that doesn’t say whose it is: the next shopper would be shown it.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the cache, on a busy day. Take the cache down from its details, and watch what lands on the database. Then push the traffic up, and see how far the cache carries it.',
				journey: 'look-cache',
				set: busyDay,
			},
		},
		{
			id: 'cache-writes',
			title: 'Writes, stampedes and hot keys',
			summary:
				'Keeping a cache right when the data changes: write-around, cache-aside, write-through and write-behind. Then the crowds: stampedes when a cache empties, and keys too popular for one machine.',
			steps: [
				{
					title: 'A price changes',
					show: cacheShown,
					journey: 'sc-write-around',
					draw: ['look-cache'],
					current: [['server', 'db']],
					set: writing('sc-write-around'),
					facts: ['wait'],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'The shop drops the Blue kettle’s price from ₹1,499 to ₹1,299, and the server saves it in the **Database**. But the **Cache** still holds the old price, so shoppers see ₹1,499 until it expires, up to 5 minutes later.',
						'Writing only to the database, and leaving the cache alone, is called write-around. It’s right for data that’s written once and rarely read soon after, like a past order or a log, so it doesn’t fill the cache. But anything already cached goes stale.',
					],
					example: {
						says: 'A minute after the change.',
						data: {
							database: '₹1,299',
							cache: '₹1,499, for 4 more minutes',
							'shoppers see': '₹1,499',
						},
					},
				},
				{
					title: 'Delete it when it changes',
					show: cacheShown,
					journey: 'sc-write-aside',
					draw: ['look-cache'],
					current: [['server', 'cache']],
					set: writing('sc-write-aside'),
					facts: ['wait'],
					body: [
						'The usual fix: save the change in the database, then delete the cached copy. The next shopper misses, reads ₹1,299 from the database, and puts it in the cache. That’s cache-aside, from the caching lesson, with a delete on every write.',
						'Why delete it, rather than write the new price in? Two changes close together can reach the cache in the wrong order, and leave the older price there. Two deletes leave the same thing in any order: nothing.',
					],
					example: {
						says: 'The kettle’s new price.',
						data: {
							'save it': 'UPDATE products SET price = 1299 WHERE id = 77',
							'then delete the copy': 'DEL product:77',
							'the next read': 'misses, and fills the cache with ₹1,299',
						},
					},
				},
				{
					title: 'Write-through',
					show: cacheShown,
					journey: 'sc-write-through',
					draw: ['look-cache'],
					current: [
						['server', 'cache'],
						['cache', 'db'],
					],
					set: writing('sc-write-through'),
					facts: ['wait'],
					body: [
						'Or every write goes through the cache: the new price is written to the cache and the database together, and the change only counts as done when both have it. That’s write-through. The cache is never behind, and the next read is a hit.',
						'The cost: every write waits for both, and the cache fills with things that were written but are never read, so a TTL still clears them out. Some caches do it for you: Amazon’s DAX, in front of DynamoDB, writes through.',
					],
				},
				{
					title: 'Write-behind',
					show: cacheShown,
					journey: 'sc-write-behind',
					draw: ['look-cache'],
					current: [['server', 'cache']],
					set: writing('sc-write-behind'),
					facts: ['wait'],
					body: [
						'Write-behind, also called write-back, goes further. The change is written only to the cache, which answers at once, then saves it in the database a moment later, in the background, often many changes in one go. A change here takes 24 ms, not 40.',
						'The database sees fewer writes, too: a view counter bumped 1,000 times a second can become one write a second.',
						'The risk: if the cache breaks before it has saved them, those changes are lost. So it suits data you can afford to lose a little of, like view counts, and never orders or payments.',
					],
				},
				{
					title: 'Why it’s hard: a race',
					show: cacheShown,
					journey: 'sc-write-aside',
					draw: ['look-cache'],
					set: writing('sc-write-aside'),
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'“There are only two hard things in computer science: cache invalidation and naming things,” Phil Karlton said. Invalidation is removing a cached copy that’s no longer true, and even deleting on every write can get it wrong.',
						'A shopper misses, and reads ₹1,499 from the database. Just then, the price changes, and the cached copy is deleted. A moment later, the shopper’s server puts the ₹1,499 it read into the cache. Now the cache is wrong, and nothing will delete it.',
						'So always set a TTL too, so a wrong copy fixes itself. Some apps delete again a second later. Facebook’s memcache gives the request that missed a lease, a ticket to fill the cache, and a delete in between cancels it, so the old price is refused.',
					],
					example: {
						says: 'The race, step by step.',
						data: {
							'1. a shopper misses': 'reads ₹1,499 from the database',
							'2. the shop saves ₹1,299': 'and deletes the cached copy',
							'3. the shopper’s server, a moment late': 'puts ₹1,499 in the cache',
							result: 'shoppers see ₹1,499 until it expires',
						},
					},
				},
				{
					title: 'The cache restarts: a stampede',
					show: cacheShown,
					journey: 'look-cache',
					set: { ...saleDay, hitRate: { cache: 0 } },
					facts: [
						'succeed',
						{ label: 'Hit rate', value: '0%', hint: 'the cache has just restarted' },
						{ load: 'db' },
						{ busy: 'db' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'On a sale day, 300 product pages are opened a second, and the cache answers 9 in 10. Then the cache restarts, empty: a cold cache. Every request misses, and all 300 land on the **Database**, twice what it can answer, so half fail. A struggling database refills the cache slowly, so it stays cold for longer.',
						'That’s a cache stampede, or a thundering herd. The same happens to one product when a popular key expires: hundreds of requests miss in the same instant, all ask the database the same question, and all write back the same answer.',
					],
				},
				{
					title: 'One refills, the others wait',
					show: cacheShown,
					journey: 'sc-look-once',
					current: [['cache', 'db']],
					set: { ...saleDay, only: ['sc-look-once'], hitRate: { cache: 0 } },
					facts: ['succeed', { load: 'db' }, { busy: 'db' }],
					body: [
						'The fix for the herd: when many requests miss the same key, only the first goes to the database. It takes a short lock in the cache, reads the database and refills the cache. The others wait a moment and read the new copy, or are given the old one meanwhile. That’s request coalescing.',
						'Here, about 1 miss in 20 is the first for its product, so the database gets 15 requests a second, not 300, while the cache fills up again.',
					],
					example: {
						says: 'Three requests miss product 77 at once.',
						data: {
							'request 1':
								'SET lock:product:77 1 NX EX 5: gets the lock, reads the database',
							'requests 2 and 3':
								'the lock is taken: wait 50 ms, then read the cache',
							'the database': 'asked about product 77 once, not three times',
						},
					},
				},
				{
					title: 'Refresh early, spread out, warm up',
					show: cacheShown,
					journey: 'look-cache',
					set: saleDay,
					facts: ['succeed', { load: 'db' }, { busy: 'db' }],
					body: [
						'Three more habits keep herds away. Refresh early: a popular answer is fetched again in the background a little before it expires, so it never does. Or serve the old copy while one request fetches the new one, as HTTP’s stale-while-revalidate does.',
						'Spread the expiry times: add a few random seconds to each TTL, called jitter, so answers cached together don’t all expire together. And warm the cache before shoppers reach it: fill it with the most popular products first, or keep a copy of the cache, so a restart doesn’t start empty.',
					],
					example: {
						says: 'TTLs with a random spread.',
						data: {
							'product:77': '5 minutes, plus 17 seconds',
							'product:78': '5 minutes, minus 9 seconds',
							'product:79': '5 minutes, plus 26 seconds',
						},
					},
				},
				{
					title: 'A hot key',
					show: hotShown,
					journey: 'sc-look-hot',
					set: hot,
					facts: [
						'succeed',
						{ busy: 'sc-node-1' },
						{ busy: 'sc-node-2' },
						{ busy: 'db' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A big cache is several machines, and each key lives on one of them, picked by a hash of the key. Redis Cluster, for example, splits keys into 16,384 slots, and each node holds some of the slots.',
						'On sale day, 7 views in 10 are for the Blue kettle, so **Cache node 1**, which holds it, gets 8 requests in 10. It can’t keep up, while the others sit nearly idle, and the requests it turns away fall through to the **Database**, which can’t take them either.',
						'More nodes wouldn’t help: the kettle is still one key, on one node. That’s a hot key.',
					],
				},
				{
					title: 'Spreading a hot key',
					show: hotShown,
					journey: 'sc-look-spread',
					set: spread,
					facts: [
						'succeed',
						{ busy: 'sc-node-1' },
						{ busy: 'sc-node-2' },
						{ busy: 'db' },
					],
					body: [
						'So the hot key is copied. Keep the kettle on every node, as product:77#1, #2 and #3, and have each server read one at random. Now each node takes a third, and none is more than half busy.',
						'Or keep the hottest answers in each web server’s own memory for a few seconds, so most requests for them never leave the server. Either way, you need to know which keys are hot: Redis can list them, with redis-cli --hotkeys.',
					],
				},
				{
					title: 'Which one when',
					show: cacheShown,
					journey: 'sc-write-aside',
					draw: ['look-cache'],
					set: writing('sc-write-aside'),
					body: [
						'Most apps use cache-aside, deleting on every write, with a TTL as a safety net, and add the others where they fit.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Write-around',
								'Data written once and rarely read soon after, like past orders and logs. Anything already cached stays stale until it expires.',
							],
							[
								'Cache-aside, deleting on write',
								'The usual choice. Simple, and only what’s read gets cached. A rare race can leave a stale copy, so keep a TTL.',
							],
							[
								'Write-through',
								'Data read straight after it’s written. The cache is never behind, but every write waits for both.',
							],
							[
								'Write-behind',
								'Many writes you can afford to lose a few of, like view counts. The fastest, and the fewest database writes, but a crash loses what wasn’t saved.',
							],
							[
								'Against stampedes',
								'One request refills while the others wait, refreshing early, a random spread on expiry times, and a warm cache.',
							],
							[
								'Against hot keys',
								'Copies of the key on several nodes, or a few seconds in each server’s own memory.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely on the sale day, with the cache. Take the cache down from its details to see the stampede, then bring it back and watch the database recover.',
				journey: 'look-cache',
				set: saleDay,
			},
		},
		{
			id: 'cdn',
			title: 'Content delivery (CDN)',
			summary:
				'Copies of the photos in cities all over the world: pulling and pushing, how long to keep them, changing them, shielding the origin, and what never to put there.',
			steps: [
				{
					title: 'Photos from far away',
					show: ['app', 'files'],
					journey: 'photos',
					set: { only: ['photos'] },
					facts: ['wait'],
					body: [
						'Every product page has four photos, kept in **File storage** in Mumbai. A shopper in Delhi waits for each one to cross the country, and one in London waits longer still.',
						'Here, the photos take about a quarter of a second to arrive.',
					],
				},
				{
					title: 'Copies near everyone',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					current: [['app', 'cdn']],
					set: photos,
					facts: ['wait'],
					body: [
						'A **CDN**, a content delivery network, is servers in hundreds of cities, called edge locations, each keeping copies of the photos. Your phone is sent to the nearest, by DNS or anycast, as in the layer 4 and 7 lesson, and downloads them from there.',
						'Now the photos take a few hundredths of a second, about ten times faster. The shop’s own storage, where the photos really live, is called the origin.',
					],
				},
				{
					title: 'Pull: fetched the first time',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					current: [['cdn', 'files']],
					set: photos,
					facts: [
						{ label: 'Hit rate', value: '95%', hint: '95 in 100 answered nearby' },
						{ load: 'files' },
					],
					body: [
						'A CDN doesn’t have a photo until someone nearby asks for it. Then it fetches it from the origin, keeps it, and answers everyone after. That’s a pull CDN, and it’s how most work: there’s nothing to upload, and only what’s asked for is kept.',
						'Photos hardly ever change, so 95 requests in 100 are answered nearby, and **File storage** sends 10 photos a second, instead of 200.',
						'A push CDN works the other way: you upload the files before anyone asks. It suits big files that everyone wants at the same moment, like an app update on release day, so the first crowd doesn’t all miss at once.',
					],
				},
				{
					title: 'How long to keep it',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					set: photos,
					body: [
						'The origin says how long each file may be kept, in a header sent with it, Cache-Control. Its max-age is the time in seconds, for every cache, the phone’s included. An s-maxage, if there is one, is for shared caches like the CDN.',
						'When the time’s up, the CDN doesn’t just throw the photo away. It asks the origin whether it has changed, quoting the photo’s version tag, its ETag. If not, the origin answers 304 Not Modified, with no photo, and the CDN keeps its copy for another round.',
					],
					example: {
						says: 'GET /images/kettle.jpg',
						data: {
							'Cache-Control': 'public, max-age=86400, so keep it a day',
							ETag: '3f9a2c, its version tag',
							'a day later, the CDN asks': 'If-None-Match: 3f9a2c',
							answer: '304 Not Modified: keep it another day',
						},
					},
				},
				{
					title: 'Changing a file: purge it, or rename it',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					set: photos,
					body: [
						'The kettle gets a better photo, but the CDN may keep the old one for the rest of the day. You can purge it: tell the CDN to drop it everywhere. Every CDN can do that, from its dashboard or its API, and CloudFront calls it an invalidation. It takes seconds or minutes to reach every location, and phones may still keep their own copy.',
						'The tidier way is a new name. Put a fingerprint of the file’s contents in its name, like kettle.3f9a2c.jpg, and have the page ask for the new name. The old file is simply never asked for again. A file named this way never changes, so it can be kept for a year.',
					],
					example: {
						says: 'The product page, before and after the new photo.',
						data: {
							before: '/images/kettle.3f9a2c.jpg',
							after: '/images/kettle.8b41d7.jpg',
							'both are sent with':
								'Cache-Control: public, max-age=31536000, immutable',
						},
					},
				},
				{
					title: 'Sale day, without a CDN',
					show: ['app', 'files'],
					journey: 'photos',
					set: { only: ['photos'], traffic: 6 },
					facts: ['succeed', { busy: 'files' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'On sale day, six times as many shoppers arrive. Without a CDN, every photo comes from **File storage**: 1,200 a second, more than it can send, so 1 in 6 fail.',
					],
				},
				{
					title: 'Sale day, with a CDN',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					set: photoSale,
					facts: ['succeed', { load: 'files' }, { busy: 'files' }, 'wait'],
					body: [
						'With the **CDN**, file storage only sends what the CDN doesn’t have yet: 60 a second. The CDN’s servers share everything else, and shopping keeps working.',
						'So a CDN does two jobs: it’s quicker for faraway shoppers, and it takes the crowd off the origin. Big CDNs are also built to soak up floods of requests from attackers, which would swamp the origin.',
					],
				},
				{
					title: 'Many edges, one origin: a shield',
					show: ['app', 'cdn', 'sc-shield', 'files'],
					journey: 'sc-photos-shield',
					current: [['cdn', 'sc-shield']],
					set: { only: ['sc-photos-shield'], traffic: 6 },
					facts: [{ load: 'sc-shield' }, { load: 'files' }],
					body: [
						'A CDN has hundreds of edge locations, and each one misses on its own. A new photo can be fetched from the origin once by every one of them.',
						'An **Origin shield** is one more layer, near the origin. Edge locations that miss ask the shield, and only the shield asks the origin. Here it answers 9 in 10 of their misses, so file storage sends 6 photos a second, not 60. CloudFront calls this Origin Shield; Cloudflare, tiered cache; Fastly, shielding.',
					],
				},
				{
					title: 'Pages, and personal data',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					set: photos,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A CDN can keep whole pages too: the Blue kettle’s page, for a minute, so a sale’s crowd never reaches the servers. Many CDNs, Cloudflare among them, don’t keep HTML pages at all unless they’re told to.',
						'But never a page that’s different for each person: a cart, past orders, an account page. Keep Riya’s account page, and the CDN hands it to the next shopper. In December 2015, a caching mistake on Steam’s store showed some users other people’s account pages. So personal pages are sent with Cache-Control: private, or no-store.',
					],
					example: {
						says: 'Two pages, two answers.',
						data: {
							'/products/77': 'Cache-Control: public, s-maxage=60',
							'/account': 'Cache-Control: private, no-store',
						},
					},
				},
				{
					title: 'Code at the edge, and CDNs you’ll meet',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					set: photos,
					body: [
						'Most CDNs can also run small programs in their edge locations, called edge functions: send a shopper to their country’s site, check a sign-in token, pick which version of a page they see, or shrink a photo to fit the phone. It happens near the shopper, before the request crosses the world. Cloudflare Workers, CloudFront Functions, Lambda@Edge and Fastly Compute all do this.',
					],
					compare: {
						title: 'CDNs you’ll meet',
						rows: [
							[
								'Akamai',
								'One of the first CDNs, from 1998, and still one of the biggest.',
							],
							[
								'Cloudflare',
								'A CDN and security service on one network, reached by anycast, with a free plan. Runs Workers at its edge.',
							],
							[
								'Amazon CloudFront',
								'Amazon’s CDN, and the usual choice in front of S3 and the rest of AWS.',
							],
							[
								'Fastly',
								'Known for purging in a moment, and for being programmable: its edge runs your code.',
							],
						],
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					set: photos,
					body: [
						'A CDN suits anything that’s the same for everyone. The longer it can keep a file, the more of the work it does.',
					],
					compare: {
						title: 'What goes on a CDN, and for how long',
						rows: [
							[
								'Files with a fingerprint in the name',
								'The app’s scripts, styles and fonts: a year, marked immutable. A new version gets a new name.',
							],
							[
								'Photos and videos',
								'A pull CDN, for days. Purge or rename one when it changes.',
							],
							[
								'A big launch, like an app update',
								'Push it to the CDN first, so the first crowd doesn’t all miss at once.',
							],
							[
								'Pages the same for everyone',
								'Like a product page: seconds to a minute, with an origin shield behind.',
							],
							[
								'Anything personal',
								'Never on a shared cache: Cache-Control: private, or no-store.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely on sale day, with the CDN. Take the CDN down from its details, and see what lands on file storage.',
				journey: 'photos-cdn',
				set: photoSale,
			},
		},
		{
			id: 'read-copies',
			title: 'Read copies',
			summary:
				'Copies of the database that answer reads, while the main one takes the writes: how far they go, the moment they lag behind, and why they don’t help with writes.',
			steps: [
				{
					title: 'Mostly reading',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					draw: ['order-save'],
					set: { only: ['look-lb', 'order-save'], traffic: 3, copies: { server: 3 } },
					facts: ['succeed', { load: 'db' }, { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'For every order placed, products are looked at many times. Here, 150 reads a second and 30 orders: 180 requests, more than the **Database** can answer.',
						'Most apps read far more than they write. A cache helps with the same popular answers, but many reads are different for each shopper, like their past orders, so they still come from the database.',
					],
				},
				{
					title: 'Copies that answer reads',
					show: readShown,
					journey: 'look-replica',
					draw: ['order-save'],
					current: [['db', 'replica']],
					set: readCopies,
					copies: true,
					facts: ['succeed', { busy: 'db' }, { busy: 'replica' }],
					body: [
						'Now the main database, the leader, keeps copies of itself, called read copies, or replicas. Every change it saves is sent on to the copies a moment later, and they apply it too.',
						'Reads go to the copies, and only writes go to the leader. Here the **Database copy** runs on two machines, which can answer 300 requests a second between them, and the leader has only the 30 writes. Each copy also applies all 30 writes, so they’re 70% busy.',
						'Postgres and MySQL both do this out of the box, and Amazon Aurora allows up to 15 copies. The app keeps two connections, one for writes and one for reads, or a proxy like ProxySQL splits them for it.',
					],
					example: {
						says: 'Two requests, two destinations.',
						data: {
							'SELECT * FROM products WHERE id = 77': 'a read: to a read copy',
							'INSERT INTO orders …': 'a write: to the leader',
						},
					},
				},
				{
					title: 'More reads? More copies',
					show: readShown,
					journey: 'look-replica',
					draw: ['order-save'],
					set: { ...readCopies, traffic: 6, copies: { server: 6, replica: 4 } },
					copies: true,
					facts: ['succeed', { busy: 'db' }, { busy: 'replica' }, { copies: 'replica' }],
					body: [
						'When reads double, add copies: four share the reads, and the leader still takes only the writes. But every copy also applies every write, and writes have doubled too, so each copy is 90% busy. Reads scale out well, as long as there are far fewer writes than reads.',
						'Copies are useful in other ways too. One can run the shop’s slow reports, so they don’t slow the shoppers down. And one is ready to take over if the leader breaks: that’s in the replication lesson.',
					],
				},
				{
					title: 'A moment behind',
					show: readShown,
					journey: 'look-replica',
					draw: ['order-save'],
					set: readCopies,
					copies: true,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A copy gets each change a moment after the leader, usually well under a second. That gap is called replication lag. When the leader is very busy, or a copy is stuck on a long query, it can grow to seconds, or minutes.',
						'Riya places order 5521, and the page reloads her orders from a read copy that hasn’t got it yet. Her new order is missing, so she places it again.',
					],
					example: {
						says: 'Show me my orders, a moment after placing one.',
						data: {
							'the leader': '3 orders, with 5521',
							'a read copy': '2 orders: 5521 isn’t there yet',
							'Riya sees': '2 orders',
						},
					},
				},
				{
					title: 'Reading your own writes',
					show: readShown,
					journey: 'sc-look-own',
					draw: ['order-save'],
					current: [['server', 'db']],
					set: { ...readCopies, only: ['sc-look-own', 'order-save'] },
					copies: true,
					facts: [{ load: 'db' }, { busy: 'db' }, { busy: 'replica' }],
					body: [
						'The fix is to read your own writes: for a few seconds after a shopper changes something, their reads go to the leader. Everyone else still reads the copies. Here, 1 read in 10 goes to the leader, which stays comfortably busy.',
						'Other ways: pages that must be right, like “your order is placed”, always read the leader. Or the app notes how far along the leader’s log its write was, and reads from a copy only once it has caught up that far.',
						'Keep each shopper on one copy, too. Otherwise two reloads can reach copies with different lags, and an order can appear, then vanish again.',
					],
				},
				{
					title: 'Writes don’t spread',
					show: readShown,
					journey: 'order-save',
					set: { only: ['order-save'], traffic: 20, copies: { server: 3, replica: 2 } },
					copies: true,
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Read copies only help with reads. Every order is still saved by the leader, and every copy has to apply every change too. On a big sale, with 200 orders a second, the leader is overloaded again, however many copies there are.',
						'For a write-heavy app, the answers are a bigger leader, fewer and steadier writes, by batching them or putting them through a queue, or splitting the data. That’s the next lesson.',
					],
				},
				{
					title: 'Which one when',
					show: readShown,
					journey: 'look-replica',
					draw: ['order-save'],
					set: readCopies,
					copies: true,
					body: [
						'They add up: most big apps have a cache and read copies in front of a big leader, long before they split anything.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'A bigger database',
								'The first step, for reads and writes alike. Nothing changes in the app.',
							],
							[
								'A cache',
								'The same answers read again and again, like popular products. The cheapest read there is.',
							],
							[
								'Read copies',
								'Many different reads, like each shopper’s own orders, that can be a moment behind. Also for reports, and a spare ready to take over.',
							],
							[
								'Splitting the data',
								'Too many writes, or too much data, for one leader.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with read copies. Push the traffic up, and add read copies from their details. Then see which part fills up next.',
				journey: 'look-replica',
				set: readCopies,
			},
		},
		{
			id: 'sharding',
			title: 'Splitting the data',
			summary:
				'When one database can’t take all the writes, split the data between several: the shard key, finding the right shard, and what gets harder.',
			steps: [
				{
					title: 'Too many writes for one',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'sc-order-one',
					set: { only: ['sc-order-one'], traffic: 20, copies: { server: 3 } },
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'On a big sale, 200 orders are placed a second. Every one must be saved by the one **Database**, and it can save 150, so a quarter fail. Read copies don’t help: they take reads, not writes.',
						'The other reason to split is size: years of orders that no longer fit on one machine’s disks, or in its memory.',
					],
				},
				{
					title: 'Two databases, each with half',
					show: splitShown,
					journey: 'order-split',
					current: [
						['server', 'shard-1'],
						['server', 'shard-2'],
					],
					set: split,
					facts: ['succeed', { busy: 'shard-1' }, { busy: 'shard-2' }],
					body: [
						'Instead of one database with every order, use two, each with half. Each piece is called a shard, and splitting the data like this is sharding, or partitioning.',
						'Each shopper’s orders live on one shard, picked by their shopper number: the shard key. An order is saved on just one shard, so each takes half, 100 a second, and it’s two-thirds busy.',
					],
					example: {
						says: 'Shopper 1043 places an order.',
						data: {
							'shard key': 'shopper 1043',
							'an odd number, so': 'Shard 1',
							'shopper 1044’s orders': 'Shard 2',
						},
					},
				},
				{
					title: 'Choosing the shard key',
					show: splitShown,
					journey: 'order-split',
					set: split,
					facts: [{ load: 'shard-1' }, { load: 'shard-2' }],
					body: [
						'The key decides how evenly the data and the work spread, and which questions stay on one shard. Splitting by a hash of the shopper number, a scrambled number made from it, spreads shoppers evenly.',
						'Splitting by range, like names A to M and N to Z, or by month, keeps neighbours together, but can be uneven: far more names start with S than with X, and every new order lands in this month’s shard.',
						'Pick the key by the questions asked most. Orders are nearly always looked up by shopper, so with the shopper as the key, “show me my orders” goes to one shard.',
					],
				},
				{
					title: 'A bad key: a hot shard',
					show: splitShown,
					journey: 'order-hot',
					set: { only: ['order-hot'], traffic: 20, copies: { server: 3 } },
					facts: ['succeed', { busy: 'shard-1' }, { busy: 'shard-2' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Split by seller instead, and one big seller with 8 orders in 10 makes their shard hot: **Shard 1** gets 160 a second, more than it can save, while **Shard 2** is only a quarter busy.',
						'A key with few values, or with one value far more popular than the rest, makes hot shards. The sharding lesson, in Data on many machines, goes deeper.',
					],
				},
				{
					title: 'Finding the shard',
					show: splitShown,
					journey: 'order-split',
					set: split,
					body: [
						'Something has to know which shard holds what. The app can work it out from the key, with the same hash every time. Or a lookup table says which shard each shopper is on, which lets you move one shopper at a time, but is one more thing to ask, and to keep running.',
						'Often a router does it, so the app sees one database: Vitess does this for MySQL, and was built at YouTube; Citus does it for Postgres; MongoDB has its mongos routers. DynamoDB and Cassandra split the data by a partition key by themselves.',
					],
				},
				{
					title: 'Questions for every shard',
					show: splitShown,
					journey: 'search-shards',
					current: [
						['server', 'shard-1'],
						['server', 'shard-2'],
					],
					set: { only: ['search-shards'], traffic: 5, copies: { server: 3 } },
					facts: [{ load: 'shard-1' }, { load: 'shard-2' }],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Some questions don’t follow the key. “Who bought the Blue kettle?” could be any shopper, so every shard is asked, and the answers put together. 100 such questions a second become 100 for each shard: splitting didn’t share this work at all.',
						'Other things get harder too. A change to two shoppers on different shards can’t be one simple transaction. Joins across shards are slow. And a rule like “each email address only once” can’t be checked by one shard alone.',
					],
				},
				{
					title: 'Adding a shard',
					show: [...splitShown, 'shard-3'],
					journey: 'order-split3',
					set: { only: ['order-split3'], traffic: 30, copies: { server: 5 } },
					facts: [{ busyEach: ['shard-1', 'shard-2', 'shard-3'] }],
					body: [
						'When two shards fill up, add a third. Now 300 orders a second share three ways, each two-thirds busy. But with “divide by the number of shards”, going from 2 to 3 moves about two-thirds of all shoppers to a different shard, and their data has to be copied across while the shop stays open.',
						'Consistent hashing, a later lesson, moves only the share the new shard should take. Many systems also start with many small shards, say 256, on a few machines, and move whole shards to new machines later.',
					],
				},
				{
					title: 'Last, not first',
					show: splitShown,
					journey: 'order-split',
					set: split,
					body: [
						'Sharding makes everything after it harder, so it usually comes last: a bigger database, a cache and read copies first.',
					],
					compare: {
						title: 'Ways to split',
						rows: [
							[
								'By a hash of the key',
								'Spreads evenly. A range of keys, like this week’s orders, is scattered over every shard.',
							],
							[
								'By a range of the key',
								'Neighbours stay together, good for “orders from last week”. Can be uneven, and new data piles onto the newest range.',
							],
							[
								'By a lookup table',
								'Any shopper on any shard, and easy to move one. One more thing to ask, and to keep running.',
							],
							[
								'By region, or by customer',
								'Each country’s, or each big customer’s, data together, and kept near them. Uneven if one is much bigger.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the orders split in two. Push the traffic up until the shards fill, and compare it with one database.',
				journey: 'order-split',
				set: split,
			},
		},
		{
			id: 'autoscaling',
			title: 'Autoscaling, and scaling ahead',
			summary:
				'Adding and removing copies by itself: what to watch, how fast to react, the limits, and why a sudden rush needs a plan.',
			steps: [
				{
					title: 'Quiet hours, busy hours',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: { ...evening, traffic: 1 },
					copies: true,
					facts: [{ copies: 'server' }, { busy: 'server' }],
					body: [
						'Shoppers come and go: few at night, many in the evening. Enough servers for the busiest hour would sit idle all night, and you pay for every one.',
						'Autoscaling adds copies when they’re busy, and removes them when they’re not. Right now it’s quiet, and one copy of the **Web server** is enough, half busy.',
					],
				},
				{
					title: 'Target tracking',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: evening,
					copies: true,
					facts: ['succeed', { copies: 'server' }, { busy: 'server' }],
					body: [
						'The usual rule is to pick a target, say 70% busy, and let the autoscaler keep the copies near it. That’s target tracking. In the evening, 150 requests a second arrive, so it runs three copies, each half busy.',
						'Kubernetes’ Horizontal Pod Autoscaler checks every 15 seconds. It wants the copies there are now, times how busy they are, divided by the target, rounded up. AWS Auto Scaling groups do much the same with whole machines.',
					],
					example: {
						says: 'How many copies, with a target of 70% busy?',
						data: {
							'copies now': '1',
							'how busy': '150%',
							wanted: '1 × 150 ÷ 70 = 2.1, rounded up: 3',
						},
					},
				},
				{
					title: 'What to watch',
					show: ['app', 'server', 'queue', 'worker'],
					journey: 'order',
					current: [['queue', 'worker']],
					set: receipts,
					facts: [{ backlog: 'worker' }, { busy: 'worker' }, { copies: 'worker' }],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'How busy the processors are, the CPU, is the usual measure, but not always the right one. A server that spends its time waiting on other parts can be slow while its CPU is idle. For those, requests a second for each copy is a better measure.',
						'For an **Email worker** taking jobs from a **Queue**, what matters is how many jobs are waiting. Here 80 orders a second each need a receipt, the one worker can send 50, and 30 more jobs pile up every second.',
					],
				},
				{
					title: 'Scaling on the queue',
					show: ['app', 'server', 'queue', 'worker'],
					journey: 'order',
					current: [['queue', 'worker']],
					set: { ...receipts, autoscale: true },
					copies: true,
					facts: [{ backlog: 'worker' }, { busy: 'worker' }, { copies: 'worker' }],
					body: [
						'So workers are scaled on the queue: the jobs waiting, for each worker. As the line grows, more workers start; as it empties, they stop. Three keep up here, each about half busy.',
						'KEDA does this for Kubernetes, reading the length of a queue, or how far behind a Kafka reader is, and it can even scale down to no workers at all when there’s nothing to do.',
					],
				},
				{
					title: 'Too slow for a sudden rush',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: { ...evening, sudden: true },
					copies: true,
					facts: ['succeed', { copies: 'server' }, { busy: 'server' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A new copy isn’t ready at once. A new machine takes minutes to start; a container, seconds, if a machine has room for it. Then the app warms up: it connects to the database and fills its caches. That’s warm-up time.',
						'When a sale opens at 8 pm sharp, everyone arrives within seconds, long before new copies are ready. For those minutes, one copy faces three times its usual load, and a third of the shoppers get errors.',
					],
				},
				{
					title: 'Flapping, and cooldowns',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: evening,
					copies: true,
					facts: [{ copies: 'server' }, { busy: 'server' }],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Traffic wobbles. An autoscaler that follows every dip removes a copy, the others get busier, it adds one back, and round it goes, starting and stopping machines all day. That’s flapping.',
						'So it adds copies quickly, and removes them slowly. After each change it waits a while, a cooldown, before the next. Kubernetes, by default, only removes copies once it has wanted fewer for 5 whole minutes.',
					],
					example: {
						says: 'A wobble in the evening, waiting 5 minutes before removing.',
						data: {
							'8:00 pm': '150 a second: 3 copies',
							'8:01 pm': '100 a second: 2 would do, but wait',
							'8:03 pm': '150 again: still 3, and nothing was stopped',
						},
					},
				},
				{
					title: 'Removing a copy safely',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: { ...evening, traffic: 2 },
					copies: true,
					facts: ['succeed', { copies: 'server' }, { busy: 'server' }],
					body: [
						'Late at night, 100 requests a second need only two copies, and the third is removed. Done carelessly, the requests it was in the middle of fail.',
						'So it’s drained first: the load balancer stops sending it new requests, the ones it has finish, and only then is it stopped. Kubernetes tells a copy to finish up, and gives it 30 seconds by default before stopping it.',
						'That only works because the servers remember nothing. A copy that kept carts or sessions would take them with it.',
					],
				},
				{
					title: 'A floor and a ceiling',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: { ...evening, traffic: 25 },
					copies: true,
					facts: ['succeed', { copies: 'server' }, { busy: 'server' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Every autoscaler has a minimum and a maximum. The minimum keeps enough copies that one breaking doesn’t matter: at least two, in different zones. The maximum protects the bill, and the parts behind the servers, from a bug or an attack that looks like shoppers.',
						'Here the maximum is 10 copies. A huge sale brings 1,250 requests a second, but 10 copies can answer 1,000, so 1 in 5 fail. Raising the maximum is a decision for people, before the sale.',
					],
				},
				{
					title: 'Databases don’t autoscale easily',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { only: ['look-lb'], autoscale: true, traffic: 4 },
					copies: true,
					facts: ['succeed', { copies: 'server' }, { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Autoscaling added web servers for 200 shoppers a second. But every copy reads the same **Database**, which can answer 150, and autoscaling can’t add another.',
						'A new database copy needs all the data first, which can take hours, and then only takes reads. More writes need a bigger machine, or splitting the data. Some cloud databases do grow by themselves, within limits: Aurora Serverless grows and shrinks its own capacity, Aurora can add read copies automatically, and DynamoDB’s on-demand mode grows to match the requests.',
					],
				},
				{
					title: 'Scaling ahead',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: { ...evening, sudden: true, copies: { server: 4 } },
					copies: true,
					facts: ['succeed', { copies: 'server' }, { busy: 'server' }],
					body: [
						'When you know a rush is coming, start the copies before it does: that’s scaling ahead. Scheduled scaling does it by the clock: four copies from 7:45 pm on sale day. Predictive scaling, on AWS, learns the daily and weekly pattern from past traffic, and starts copies before each evening’s rise.',
						'For a big event, like a sale, a launch or a live match, teams plan it by hand: raise the minimum and the maximum, warm the caches, and make the database bigger the day before.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: evening,
					copies: true,
					body: [
						'Kubernetes’ Horizontal Pod Autoscaler adds copies of a service, and Cluster Autoscaler or Karpenter add machines for them to run on. AWS Auto Scaling groups, and Google Cloud’s managed instance groups, add whole machines.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Target tracking on CPU',
								'The usual choice for web servers: keep them near a target, like 70% busy.',
							],
							[
								'Requests for each copy',
								'Servers that wait on other parts more than they work themselves.',
							],
							[
								'Queue length',
								'Workers taking jobs from a queue or a stream. Can scale down to none.',
							],
							['Scheduled', 'A pattern you know by the clock, like a sale at 8 pm.'],
							[
								'Predictive',
								'A steady daily or weekly rhythm, learned from the past.',
							],
							[
								'By hand, ahead',
								'One-off events bigger than anything before. Raise the limits, and warm up.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with a sudden rush. Turn autoscaling and the sudden rush on and off, then add copies by hand, before the rush.',
				journey: 'look-lb',
				set: { ...evening, sudden: true },
			},
		},
	],
};

export const scalingTrack: TrackModule = { track: scaling, parts, journeys };
