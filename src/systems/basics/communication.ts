import type { Track } from '@/learn/course';
import type { Conditions } from '@/sim/scenario';
import { type TrackModule, roomy } from './shared';

// REST
const getOrder: Conditions = { only: ['cm-get-order'], copies: { server: 3 } };
const offsetPages: Conditions = { only: ['cm-page-offset'], copies: { server: 3 } };
const cursorPages: Conditions = { only: ['cm-page-cursor'], copies: { server: 3 } };
const shakyPost: Conditions = {
	only: ['cm-post-order'],
	copies: { server: 3 },
	flaky: { lb: 0.1 },
};
const cachedGets: Conditions = { only: ['cm-get-cdn'], traffic: 3, hitRate: { cdn: 0.9 } };
const threeRequests: Conditions = { only: ['order-rest'], copies: { server: 3 } };
const embedded: Conditions = { only: ['cm-order-embed', 'order-rest'], copies: { server: 3 } };

// RPC and GraphQL
const graphqlOnly: Conditions = { only: ['order-graphql'], copies: { server: 3 } };
const graphqlOrRest: Conditions = {
	only: ['order-graphql', 'order-rest'],
	copies: { server: 3 },
};
const nPlusOne: Conditions = { only: ['cm-gql-n1'], copies: { server: 3 } };
const batched: Conditions = { only: ['cm-gql-batched'], copies: { server: 3 } };

// message queues
const ordersOnly: Conditions = { only: ['order'], copies: { server: 2 } };
const rush: Conditions = { ...ordersOnly, traffic: 8 };
const bigSale: Conditions = {
	only: ['order'],
	traffic: 14,
	copies: { server: 2 },
	bigger: roomy,
	autoscale: true,
};
// the workers held to 45 emails a second each, 90 between them
const heldBack: Conditions = {
	only: ['order'],
	traffic: 14,
	copies: { server: 2, worker: 2 },
	bigger: { ...roomy, worker: 0.9 },
};

// publish and subscribe, and event logs
const telling: Conditions = { only: ['order-direct'], copies: { server: 3 } };
const publishing: Conditions = { only: ['order-event'], copies: { server: 3 } };
const loyal: Conditions = { only: ['cm-order-loyalty'], copies: { server: 3 } };
const lagging: Conditions = { ...loyal, traffic: 4 };
const caughtUp: Conditions = { ...lagging, copies: { server: 3, 'cm-loyalty': 3 } };

// real-time updates
const polling: Conditions = { only: ['parcel-poll'], copies: { server: 6 }, bigger: roomy };
const longPolling: Conditions = {
	only: ['cm-parcel-long'],
	traffic: 3,
	copies: { server: 6 },
	bigger: roomy,
};
const pushing: Conditions = {
	only: ['parcel-push', 'parcel-connect'],
	traffic: 3,
	copies: { server: 6 },
	bigger: roomy,
};
const sharedChannel: Conditions = {
	only: ['cm-parcel-shared', 'parcel-connect'],
	traffic: 3,
	copies: { server: 6, live: 3 },
	bigger: roomy,
};
// 12,000 apps reconnecting within 2 seconds, then spread over 30
const stampede: Conditions = { only: ['parcel-connect'], traffic: 3000, copies: { live: 2 } };
const gentle: Conditions = { only: ['parcel-connect'], traffic: 200, copies: { live: 2 } };
const notifying: Conditions = { only: ['cm-parcel-notify'], copies: { server: 3 } };

// webhooks
const payPolling: Conditions = { only: ['pay-poll'], copies: { server: 3 } };
const webhook: Conditions = { only: ['pay-webhook'], copies: { server: 3 } };
const slowHook: Conditions = { only: ['cm-hook-slow'], copies: { server: 3 }, down: ['email'] };
const queuedHook: Conditions = {
	only: ['cm-hook-queue'],
	copies: { server: 3 },
	down: ['email'],
};

const parts: TrackModule['parts'] = [
	{
		id: 'cm-books',
		name: 'Accounting app',
		kind: 'client',
		layer: 'clients',
		summary:
			'Another company’s program that copies every one of the shop’s orders into its accounts, 50 at a time, through the API.',
		why: 'Shops keep their accounts in software made for it, and it needs every order.',
		onFailure:
			'It stands for the other company’s program, so the simulation doesn’t make it fail.',
		scaling: 'It runs on the other company’s computers.',
	},
	{
		id: 'cm-loyalty',
		name: 'Loyalty service',
		kind: 'service',
		layer: 'services',
		summary:
			'Gives shoppers a point for every ₹100 they spend. It hears about orders from the event stream, and works out the points for every item, slowly: about 25 orders a second for each copy.',
		why: 'Points bring shoppers back. The service only needs to hear about orders, not to be asked.',
		onFailure:
			'Points arrive late. Its events wait in the stream, and it carries on from where it stopped when it’s back.',
		scaling:
			'Run more copies, up to one for each of the topic’s 6 partitions. Any more would sit idle.',
		capacityPerInstance: 25,
		instances: 1,
		maxInstances: 6,
		latencyMs: 20,
	},
	{
		id: 'cm-channel',
		name: 'Redis pub/sub',
		kind: 'stream',
		layer: 'async',
		summary:
			'Passes each message sent to a channel, like van:12, to every live updates server listening to that channel, at once. It keeps nothing.',
		why: 'Riya’s app is connected to one of several live servers. The web server doesn’t know which, so it sends to the van’s channel, and the right one hears it.',
		onFailure:
			'Live servers stop hearing about vans, so the maps freeze until it’s back. Apps can fall back to asking every few seconds.',
		scaling:
			'One Redis passes on a great many messages a second. Beyond that, the channels are split between several.',
		capacityPerInstance: 20_000,
		instances: 1,
		latencyMs: 1,
	},
	{
		id: 'cm-notify',
		name: 'Notification service',
		kind: 'notifier',
		layer: 'async',
		summary:
			'Keeps each shopper’s device token, and sends their notifications through Apple’s and Google’s push services.',
		why: 'A closed app can’t keep a connection open. A notification is the only way to reach it.',
		onFailure:
			'Notifications stop. Shoppers see their parcel’s news only when they open the app.',
		scaling: 'Run more copies; it keeps nothing between messages.',
		capacityPerInstance: 1_000,
		instances: 1,
		latencyMs: 10,
	},
	{
		id: 'cm-push',
		name: 'Apple and Google push',
		kind: 'external',
		layer: 'external',
		summary:
			'Apple’s push service, APNs, for iPhones, and Google’s Firebase Cloud Messaging for Android. They deliver a notification to a phone even when the app is closed.',
		why: 'Only the phone’s maker keeps a connection open to every phone, so only they can reach an app that isn’t running.',
		onFailure:
			'Notifications arrive late, or not at all. It belongs to Apple and Google, so the shop can only wait.',
		scaling: 'It belongs to Apple and Google, and carries every app’s notifications.',
		capacityPerInstance: 10_000,
		instances: 1,
		latencyMs: 50,
	},
];

const askForHistory = [
	{
		from: 'app',
		to: 'lb',
		label: 'One query: 20 orders, each with its delivery',
		travelMs: 150,
	},
	{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
	{ from: 'server', to: 'db', label: 'Read the 20 orders' },
];

const journeys: TrackModule['journeys'] = [
	{
		id: 'cm-get-order',
		name: 'See an order, a REST request',
		description:
			'Someone opens their order. The app asks for it at its address, and the server reads it from the database.',
		rps: 20,
		hops: [
			{ from: 'app', to: 'lb', label: 'GET /orders/5521', travelMs: 150 },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Read order 5521' },
		],
	},
	{
		id: 'cm-page-offset',
		name: 'Copy every order, skipping ahead by offset',
		description:
			'An accounting app copies every order, 50 at a time. Each page skips ahead by an offset, so the database reads every order before it, and throws them away.',
		rps: 10,
		hops: [
			{ from: 'cm-books', to: 'lb', label: 'GET /orders?offset=100000&limit=50' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{
				from: 'server',
				to: 'db',
				label: 'Read 100,050 orders, send the last 50',
				work: 20,
			},
		],
	},
	{
		id: 'cm-page-cursor',
		name: 'Copy every order, page by cursor',
		description:
			'An accounting app copies every order, 50 at a time. Each page carries on from a cursor, so the database finds its place in the index and reads only 50.',
		rps: 10,
		hops: [
			{ from: 'cm-books', to: 'lb', label: 'GET /orders?limit=50&after=b3JkZXItOTQ1Ng' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Find the cursor in the index, read the next 50' },
		],
	},
	{
		id: 'cm-post-order',
		name: 'Place an order, trying again',
		description:
			'Someone places an order over mobile data. When no answer comes, the app tries again, up to twice, with the same idempotency key.',
		rps: 10,
		hops: [
			{
				from: 'app',
				to: 'lb',
				label: 'POST /orders, with an idempotency key',
				travelMs: 150,
				retries: 2,
			},
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Save the order, unless the key is known' },
		],
	},
	{
		id: 'cm-get-cdn',
		name: 'Look at a product, kept by a CDN',
		description:
			'Someone opens a product. The API’s answer may be kept for a minute, so a CDN nearby answers most of these itself.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'cdn', label: 'GET /products/77' },
			{
				from: 'cdn',
				to: 'lb',
				label: 'Not kept, or too old: ask the servers',
				onMiss: true,
			},
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Read the product' },
		],
	},
	{
		id: 'cm-order-embed',
		name: 'See an order, in one REST request',
		description:
			'Someone opens an order. The app asks for the order with its items and delivery included, and the server gathers them all.',
		rps: 20,
		hops: [
			{
				from: 'app',
				to: 'lb',
				label: 'GET /orders/5521?include=items,delivery',
				travelMs: 150,
			},
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Read the order and its items' },
			{ from: 'server', to: 'delivery', label: 'Where is delivery 88?' },
		],
	},
	{
		id: 'cm-gql-n1',
		name: 'Order history, a call for each delivery',
		description:
			'Someone opens their last 20 orders, in one GraphQL query. The delivery resolver runs once for each order: 20 calls to the delivery service.',
		rps: 20,
		hops: [
			...askForHistory,
			{
				from: 'server',
				to: 'delivery',
				label: 'Where is this delivery? Once for each order',
				calls: 20,
			},
		],
	},
	{
		id: 'cm-gql-batched',
		name: 'Order history, deliveries batched',
		description:
			'The same query, but the deliveries are batched: one call to the delivery service fetches all 20.',
		rps: 20,
		hops: [
			...askForHistory,
			{ from: 'server', to: 'delivery', label: 'All 20 deliveries, in one call' },
		],
	},
	{
		id: 'cm-order-loyalty',
		name: 'Place an order, four subscribers',
		description:
			'Someone places an order. The server publishes “order placed”, and four parts read it from the event stream: stock, reports, the email worker and the loyalty service.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place the order' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Save the order' },
			{ from: 'server', to: 'events', label: 'Publish: order placed', mode: 'async' },
			{
				from: 'events',
				to: 'stock-svc',
				label: 'Order placed: take one from stock',
				mode: 'async',
			},
			{
				from: 'events',
				to: 'reports',
				label: 'Order placed: count the sale',
				mode: 'async',
			},
			{
				from: 'events',
				to: 'cm-loyalty',
				label: 'Order placed: add points',
				mode: 'async',
			},
			{
				from: 'events',
				to: 'worker',
				label: 'Order placed: send a receipt',
				mode: 'async',
			},
			{
				from: 'worker',
				to: 'email',
				label: 'Send the receipt',
				mode: 'async',
				retries: 2,
			},
		],
	},
	{
		id: 'cm-parcel-long',
		name: 'Watch my parcel, long polling',
		description:
			'A thousand shoppers watch their parcel. Each app asks for news, and the server holds the request until the van moves, then answers. The app asks again at once.',
		rps: 100,
		hops: [
			{ from: 'app', to: 'lb', label: 'Anything new? I’ll wait' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy, held until the van moves' },
			{ from: 'server', to: 'db', label: 'Read the van’s new location' },
		],
	},
	{
		id: 'cm-parcel-shared',
		name: 'Watch my parcel, many live servers',
		description:
			'Each van sends its location every 10 seconds. The server publishes it to the van’s channel in Redis, which passes it to the live servers whose apps watch that van.',
		rps: 100,
		hops: [
			{ from: 'vans', to: 'lb', label: 'Here’s where I am' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Save the location' },
			{
				from: 'server',
				to: 'cm-channel',
				label: 'Send it to channel van:12',
				mode: 'async',
			},
			{
				from: 'cm-channel',
				to: 'live',
				label: 'To each live server listening to van:12',
				mode: 'async',
			},
			{ from: 'live', to: 'app', label: 'Push: your van moved', mode: 'async' },
		],
	},
	{
		id: 'cm-parcel-notify',
		name: 'Parcel nearly here: a notification',
		description:
			'When a van is two stops from a shopper, the shop sends a notification through Apple or Google, which reaches the phone even when the app is closed.',
		rps: 5,
		hops: [
			{ from: 'vans', to: 'lb', label: 'Two stops from order 5521' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Save it' },
			{
				from: 'server',
				to: 'cm-notify',
				label: 'Tell Riya: arriving soon',
				mode: 'async',
			},
			{
				from: 'cm-notify',
				to: 'cm-push',
				label: 'Send it to her device token',
				mode: 'async',
			},
			{
				from: 'cm-push',
				to: 'app',
				label: 'Your parcel is 2 stops away',
				mode: 'async',
			},
		],
	},
	{
		id: 'cm-hook-slow',
		name: 'Paid: a webhook, all the work first',
		description:
			'The payment provider calls the shop’s webhook. The shop marks the order paid and sends the receipt before it answers.',
		rps: 2,
		hops: [
			{ from: 'payments', to: 'lb', label: 'POST /webhooks/payments: order 5521 is paid' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Mark the order paid' },
			{ from: 'server', to: 'email', label: 'Send the receipt, then answer' },
		],
	},
	{
		id: 'cm-hook-queue',
		name: 'Paid: a webhook, answered at once',
		description:
			'The payment provider calls the shop’s webhook. The shop saves the event, marks the order paid and answers at once. The receipt is sent in the background.',
		rps: 2,
		hops: [
			{ from: 'payments', to: 'lb', label: 'POST /webhooks/payments: order 5521 is paid' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Save the event, mark the order paid' },
			{
				from: 'server',
				to: 'queue',
				label: 'Leave a note for the receipt',
				mode: 'async',
			},
			{ from: 'queue', to: 'worker', label: 'Hand out the note', mode: 'async' },
			{
				from: 'worker',
				to: 'email',
				label: 'Send the receipt',
				mode: 'async',
				retries: 2,
			},
		],
	},
];

const loyaltyParts = ['server', 'events', 'stock-svc', 'reports', 'cm-loyalty'];

const communication: Track = {
	id: 'communication',
	name: 'Communication',
	tagline:
		'How the parts talk: asking for what you need, handing work over, announcing what happened, and pushing updates as they happen.',
	lessons: [
		{
			id: 'apis',
			title: 'REST APIs',
			summary:
				'Things with addresses and a few methods: answers an app can act on, long lists a page at a time, safe retries, caching, fewer trips, and changing an API without breaking apps.',
			steps: [
				{
					title: 'Things with addresses',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'cm-get-order',
					current: [['app', 'lb']],
					set: getOrder,
					body: [
						'The **Shop app** asks the **Web server** for everything through an API: the list of requests the server accepts, and what each one sends back. Most APIs on the web are REST APIs.',
						'In a REST API, each thing the shop knows about is a resource, with its own address. /products/77 is the Blue kettle, /orders/5521 is Riya’s order, and /orders/5521/items are the things in it. Addresses name things, not actions: there’s no /getOrder.',
						'Requests are ordinary HTTP, as in the lesson on how a request travels, and answers are JSON text. So any app, browser or other company’s program can use the API.',
					],
					example: {
						says: 'GET /orders/5521',
						data: {
							answer: '{ "id": 5521, "status": "packed", "total": 1499, "delivery": 88 }',
						},
					},
				},
				{
					title: 'Five methods, and which are safe to repeat',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'cm-get-order',
					set: getOrder,
					body: [
						'The method says what to do to the thing. GET reads it, POST makes a new one, PUT replaces it whole, PATCH changes part of it, and DELETE removes it.',
						'Two words matter here. A safe method only reads: GET changes nothing, so it can be sent again, or cached, without a second thought. An idempotent method can be repeated with the same result as doing it once: PUT a new delivery address twice, and the order still has that one address. POST isn’t: send it twice, and there are two orders.',
						'Many apps, proxies and libraries rely on this. They try a failed GET, PUT or DELETE again by themselves, but not a POST.',
					],
					compare: {
						title: 'The methods',
						rows: [
							['GET /orders/5521', 'Read the order. Safe, and idempotent.'],
							['POST /orders', 'Place a new order. Neither: twice makes two orders.'],
							[
								'PUT /orders/5521/address',
								'Replace the delivery address with this one. Idempotent: twice leaves the same address.',
							],
							[
								'PATCH /orders/5521',
								'Change only the fields sent, like the delivery note. Idempotent only if written that way: “add one more kettle” twice adds two.',
							],
							[
								'DELETE /cart/items/77',
								'Take the kettle out of the cart. Idempotent: after the first, it’s gone, and stays gone, even if the second answer is 404.',
							],
						],
					},
				},
				{
					title: 'Answers an app can act on',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'cm-get-order',
					set: getOrder,
					body: [
						'Bodies go both ways as JSON. Placing an order is a POST with the order in its body, and the answer is the order as saved, with its new number.',
						'The status code tells the app what to do next, so an API picks it with care: 201 Created and the new order’s address for a new order, 204 for a delete, 404 for an order that doesn’t exist, 409 for paying one that’s already paid, 422 for an order that makes no sense, like a quantity of zero, and 429 for an app asking too often. The lesson on how a request travels lists the rest.',
						'Errors come back as JSON too, in the same shape every time, so the app can show the right message. A common standard for that shape is problem details, RFC 9457.',
					],
					example: {
						says: 'POST /orders',
						data: {
							body: '{ "product": 77, "quantity": 1 }',
							status: '201 Created',
							Location: '/orders/5521',
							answer: '{ "id": 5521, "status": "placed", "total": 1499 }',
						},
					},
					note: {
						title: 'An error the app can use',
						text: '409 Conflict, with { "type": "/errors/out-of-stock", "title": "Out of stock", "detail": "Only 2 Blue kettles are left." }. The app shows the title, and its code acts on the type.',
					},
				},
				{
					title: 'A long list, skipping ahead',
					show: ['cm-books', 'lb', 'server', 'db'],
					journey: 'cm-page-offset',
					set: offsetPages,
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The shop has 200,000 orders, and an **Accounting app**, run by another company, pulls them all into the shop’s accounts. No answer can hold 200,000 orders, so the API sends a page at a time: 50 orders, then the app asks for the next 50. That’s pagination.',
						'The simplest way is an offset: “skip 100,000, then send 50”. But the **Database** can’t jump to the 100,000th order. It reads all 100,000, throws them away, and sends the next 50. The deeper the page, the more it reads.',
						'Here, the accounting app asks for 10 pages a second, most of them deep in the list. The database can’t keep up, and 1 page in 4 fails.',
					],
					example: {
						says: 'GET /orders?offset=100000&limit=50',
						data: {
							'the database reads': '100,050 orders',
							'and sends back': 'the last 50',
						},
					},
				},
				{
					title: 'Cursors: carry on from here',
					show: ['cm-books', 'lb', 'server', 'db'],
					journey: 'cm-page-cursor',
					set: cursorPages,
					facts: ['succeed', { busy: 'db' }],
					body: [
						'Offsets have a second problem: the list changes while it’s read. A new order arrives between two pages, everything moves down one place, and the app gets one order twice. Delete one, and it misses one.',
						'A cursor fixes both. Each page ends with a marker for its last order, and the app asks for “the 50 after this”. The **Database** finds that order in its index and reads just the next 50, so every page is as quick as the first, and new orders don’t shift anything. Here, it’s barely busy.',
						'The cost: you can only go on from a page you have, not jump to page 2,000. Stripe’s and Slack’s APIs use cursors.',
					],
					example: {
						says: 'GET /orders?limit=50&after=b3JkZXItOTQ1Ng',
						data: { answer: '50 orders, and "next": "b3JkZXItOTUwNg"' },
					},
					note: {
						title: 'Filtering and sorting',
						text: 'Asked for in the same place, after the ? in the address: /orders?status=packed&sort=placed_at. Each filter and sort an API allows needs an index to stay quick, so APIs allow a few, not any.',
					},
				},
				{
					title: 'Tried again: two orders?',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'cm-post-order',
					set: shakyPost,
					facts: [{ retries: 'lb' }, 'succeed'],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Shoppers place orders on shaky mobile connections, and 1 request in 10 gets no answer. So the app tries again, up to twice: about 1.1 extra requests a second here, and nearly every order goes through.',
						'For a GET, that’s harmless. For a POST, it isn’t: some of those orders were saved, and only the answer was lost on the way back. Trying again places a second order.',
						'So the app sends an idempotency key: a random id made once for each order Riya places, and sent again with every try. The server saves the key with the order. A request with a key it has already seen doesn’t place another order: it gets the same answer as the first time. Stripe’s API works this way.',
					],
					example: {
						says: 'POST /orders, tried twice',
						data: {
							'Idempotency-Key': '6f1c2a9e-4b7d-4e0a-9c55-2d8b1f3e7a10',
							'first try': 'order 5521 saved, but the answer is lost',
							'second try, same key': 'seen it: 201 Created, order 5521 again',
						},
					},
				},
				{
					title: 'Answers worth keeping',
					show: ['app', 'cdn', 'lb', 'server', 'db'],
					journey: 'cm-get-cdn',
					set: cachedGets,
					facts: [{ load: 'cdn' }, { load: 'server' }],
					body: [
						'GET is safe, so its answers can be kept and used again: by the app, or by a **CDN** near the shopper. The server says for how long, in a Cache-Control header: public, max-age=60 means anyone may keep it for a minute.',
						'In a sale, 150 shoppers a second open the Blue kettle. The CDN answers 9 in 10 itself, so the **Web server** gets only 15 a second.',
						'Answers about one person, like Riya’s orders, are marked private, so only her app keeps them. And when a kept answer is old, the app can ask whether it has changed, sending its ETag, a short code for that version of the answer. If it hasn’t, the reply is a short 304 Not Modified, with no body.',
					],
					example: {
						says: 'GET /products/77',
						data: {
							'Cache-Control': 'public, max-age=60',
							ETag: '"kettle-v12"',
							'a minute later, with If-None-Match: "kettle-v12"': '304 Not Modified',
						},
					},
				},
				{
					title: 'One screen, three requests',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'order-rest',
					set: threeRequests,
					facts: ['wait'],
					timeline: true,
					body: [
						'Riya’s order screen shows the order, its items and where the delivery is. In REST, those are three resources, so three requests, each waiting for the one before: the order says which delivery to ask the **Delivery service** about.',
						'On mobile data, each request takes about 150 ms just to travel there and back. Three, one after the other, and the screen takes over half a second to fill in.',
					],
				},
				{
					title: 'One request for the screen',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'cm-order-embed',
					draw: ['order-rest'],
					set: embedded,
					facts: [
						{ wait: 'cm-order-embed', label: 'Wait, one request' },
						{ wait: 'order-rest', label: 'Wait, three requests' },
					],
					body: [
						'REST’s answer is to let one request bring related things along: GET /orders/5521?include=items,delivery. The **Web server** gathers them, nearby in the data centre, and answers once: one trip across the mobile network instead of three.',
						'Some teams go further, and build a small API for each app, shaped like its screens: a backend for frontend. Either way, a new screen can mean new work on the server. GraphQL, in the next lesson, lets each screen ask for exactly what it needs.',
					],
					example: {
						says: 'GET /orders/5521?include=items,delivery',
						data: {
							answer: '{ "id": 5521, "items": [{ "name": "Blue kettle" }], "delivery": { "eta": "6 pm" } }',
						},
					},
				},
				{
					title: 'Changing it without breaking apps',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'cm-get-order',
					set: getOrder,
					body: [
						'Once apps use an API, changing it can break them, and old versions of an app stay on phones for months. Adding a field is safe, as long as apps ignore fields they don’t know. Removing or renaming one, or changing what it means, is a breaking change.',
						'Breaking changes go into a new version, and the old one keeps working until its apps are gone. The version usually goes in the path, /v1/orders and /v2/orders, easy to see and to route. Or it goes in a header, so each thing keeps one address: Stripe and GitHub take a dated version, like 2022-11-28, in a header.',
						'An OpenAPI file can describe every address, method and body, and tools turn it into documentation, tests, and code for the apps.',
					],
					example: {
						says: 'The same order, in two versions.',
						data: {
							'GET /v1/orders/5521': '"total": 1499',
							'GET /v2/orders/5521': '"total": { "amount": 1499, "currency": "INR" }',
						},
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'cm-order-embed',
					set: { only: ['cm-order-embed'], copies: { server: 3 } },
					body: [
						'REST is a set of habits more than a strict standard, so every API makes a few choices. These are the common ones.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Offset pages',
								'Short lists, or when people jump to page 7, like search results. Slow deep in a long list, and items shift as it changes.',
							],
							[
								'Cursor pages',
								'Long or changing lists: order histories, feeds, and anything another program downloads in full. No jumping ahead.',
							],
							[
								'A request per resource',
								'Simple, and each answer is kept on its own. Fine when a screen needs one or two things.',
							],
							[
								'Related things included',
								'Screens that need several things at once, on slow mobile networks. More work on the server for each new screen.',
							],
							[
								'Version in the path',
								'Public APIs: easy to see, test and route. The usual choice.',
							],
							[
								'Version in a header',
								'One address per thing, and many small dated versions, as Stripe and GitHub do.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the accounting app skipping ahead by offset. Turn the traffic down, or add copies of the database from its details, and see what it takes for every page to work.',
				journey: 'cm-page-offset',
				set: offsetPages,
			},
		},
		{
			id: 'rpc-graphql',
			title: 'RPC and GraphQL',
			summary:
				'Calling another service like a function, with gRPC, and asking for exactly what a screen shows, with GraphQL: how each works, what it costs, and where each fits.',
			steps: [
				{
					title: 'RPC: call a function on another computer',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'order-graphql',
					current: [['server', 'delivery']],
					set: graphqlOnly,
					facts: ['wait'],
					timeline: true,
					body: [
						'Inside the data centre, the **Web server** asks the **Delivery service** where delivery 88 is. It doesn’t think in addresses and methods. It calls GetDelivery(88) as if the function were its own, and the call travels over the network. That’s RPC, a remote procedure call.',
						'Your own services call each other all the time, many times for each tap, so these calls must be quick and hard to get wrong. A popular way is gRPC, which Google made and shared in 2015.',
						'Here, the call to the delivery service is a small slice of the wait. Most of it is the trip across mobile data.',
					],
					example: {
						says: 'GetDelivery(id: 88)',
						data: { answer: 'status: out for delivery, eta: 6 pm' },
					},
				},
				{
					title: 'A contract both sides share',
					show: ['server', 'delivery'],
					journey: 'order-graphql',
					current: [['server', 'delivery']],
					set: graphqlOnly,
					body: [
						'With gRPC, the calls are written down first, in a .proto file, in a language called Protocol Buffers. It lists each call, what it takes, and what it gives back.',
						'Tools turn that file into code for both sides, in many languages: functions the **Web server** calls as if they were its own, and an outline the **Delivery service** fills in. In a language like Go or Java, send the wrong thing, and the code won’t build, so the mistake is caught before it ships.',
						'Messages travel as compact binary, not readable text. Each field goes as its number and value, not its name, so messages are smaller than JSON and quicker to read. A new field gets a new number, and old code skips numbers it doesn’t know, so fields can be added without breaking anyone.',
					],
					example: {
						says: 'deliveries.proto',
						data: {
							service:
								'Deliveries { rpc GetDelivery (DeliveryId) returns (Delivery); }',
							'message Delivery': '{ string status = 1; string eta = 2; }',
							'on the network':
								'field 1 and field 2, as numbers and values: a few bytes',
						},
					},
				},
				{
					title: 'Four kinds of call',
					show: ['server', 'delivery'],
					journey: 'order-graphql',
					set: graphqlOnly,
					body: [
						'gRPC runs over HTTP/2, which carries many calls at once on one connection, and lets either side keep sending. So a call can be more than one question and one answer.',
						'Most calls are unary: one question, one answer. In server streaming, one question gets many answers, as they happen. In client streaming, the caller sends many messages and gets one answer at the end. In bidirectional streaming, both sides send whenever they like.',
					],
					example: {
						says: 'The four kinds, at the shop.',
						data: {
							unary: 'GetDelivery(88): one answer',
							'server streaming':
								'WatchDelivery(88): each new location of the van, as it moves',
							'client streaming': 'UploadRoute(points…): one “saved” at the end',
							bidirectional: 'DriverChat(messages…): messages both ways, any time',
						},
					},
					note: {
						title: 'Every call has a deadline',
						text: 'A gRPC caller says how long it will wait, and that travels with the call. A service can pass what’s left on to the calls it makes, so nobody further along keeps working on an answer nobody is waiting for.',
					},
				},
				{
					title: 'Why it stays inside',
					show: ['app', 'lb', 'server', 'delivery'],
					journey: 'order-graphql',
					set: graphqlOnly,
					body: [
						'Browsers can’t make gRPC calls directly: they don’t give a web page that much control over HTTP/2. A web page needs gRPC-Web, with a proxy like Envoy to translate, or a gateway that turns REST and JSON into gRPC.',
						'Binary messages are also hard for people to read while fixing a bug, and other companies expect REST and JSON. So the usual split is gRPC between your own services, and REST or GraphQL for apps and the outside world.',
					],
					note: {
						title: 'One connection, many calls',
						text: 'Each web server keeps one HTTP/2 connection to the delivery service, and sends every call down it. A layer 4 load balancer picks a copy once per connection, so all those calls land on one copy. gRPC needs a layer 7 load balancer, like Envoy, that spreads the calls themselves, or callers that spread them.',
					},
				},
				{
					title: 'GraphQL: ask for exactly what the screen shows',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'order-graphql',
					draw: ['order-rest'],
					set: graphqlOrRest,
					facts: [
						{ wait: 'order-graphql', label: 'Wait, one GraphQL request' },
						{ wait: 'order-rest', label: 'Wait, three REST requests' },
					],
					body: [
						'Back to Riya’s order screen. With GraphQL, the app sends one query to one address, /graphql, listing exactly the fields the screen shows. The server gathers them from the **Database** and the **Delivery service**, and answers once, in the same shape as the query.',
						'One trip across the mobile network instead of three. And nothing comes back that the screen doesn’t use, where a REST answer sends the whole order every time, called over-fetching.',
						'A REST endpoint made for this screen would be just as quick. GraphQL’s gain is that every screen gets that without one. Facebook made it for its apps, with their many screens.',
					],
					example: {
						says: '{ order(id: 5521) { status items { name } delivery { eta } } }',
						data: {
							answer: '{ "order": { "status": "packed", "items": [{ "name": "Blue kettle" }], "delivery": { "eta": "6 pm" } } }',
						},
					},
				},
				{
					title: 'A schema, and resolvers',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'order-graphql',
					current: [
						['server', 'db'],
						['server', 'delivery'],
					],
					set: graphqlOnly,
					body: [
						'A GraphQL server has a schema: every type, its fields, and how they link. An Order has a status, items and a delivery; a Delivery has an eta. Apps can ask only for what’s in it, and tools check every query against it, as the app is written and before the query runs.',
						'Behind each field is a resolver, a small function that fetches it. The order’s resolver reads the **Database**; the delivery’s calls the **Delivery service**. The server runs the ones a query needs, and puts the answer together.',
						'Changes go through the schema too, as mutations, like placeOrder. And subscriptions push updates to the app over a live connection, which the real-time lesson covers.',
					],
					example: {
						says: 'Part of the schema.',
						data: {
							'type Order':
								'{ id: ID!, status: String!, items: [Item!]!, delivery: Delivery }',
							'type Delivery': '{ eta: String, where: Location }',
							'type Mutation': '{ placeOrder(product: ID!, quantity: Int!): Order }',
						},
					},
				},
				{
					title: 'The N+1 problem',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'cm-gql-n1',
					set: nPlusOne,
					facts: ['succeed', { load: 'delivery' }, { busy: 'delivery' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Riya’s order history shows her last 20 orders, each with where its delivery is. One GraphQL query asks for all of it.',
						'The orders’ resolver reads all 20 in one go. But the delivery resolver runs once for each order, so the server calls the **Delivery service** 20 times: 1 query, then N more, the N+1 problem. With 20 of these screens opening a second, that’s 400 calls a second, more than the delivery service can answer, and 1 screen in 4 fails.',
						'Nothing in the query looks expensive. The cost hides in the resolvers.',
					],
					example: {
						says: '{ me { orders(last: 20) { id delivery { eta } } } }',
						data: {
							'the database': '1 query, for 20 orders',
							'the delivery service': '20 calls, one for each order',
						},
					},
				},
				{
					title: 'Batching: one call for all 20',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'cm-gql-batched',
					set: batched,
					facts: ['succeed', { load: 'delivery' }, { busy: 'delivery' }],
					body: [
						'The fix is to batch. Each delivery resolver adds its id to a list instead of calling at once. When all of them in that round have asked, one call fetches every delivery on the list.',
						'DataLoader, a small JavaScript library from the GraphQL project, does exactly this. It also remembers what it fetched during the request, so the same delivery is never fetched twice. Most GraphQL servers have something like it.',
						'Now each screen makes one call to the **Delivery service**, 20 a second in all, and it has plenty of room.',
					],
					example: {
						says: 'One round of resolvers, batched.',
						data: {
							'asked for': 'deliveries 88, 91, 97 and 17 more',
							'one call': 'GetDeliveries(20 ids)',
							answer: 'all 20 deliveries',
						},
					},
				},
				{
					title: 'Harder to cache, easy to ask too much',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'order-graphql',
					set: graphqlOnly,
					body: [
						'GraphQL queries usually go as a POST to the same address, /graphql, so a CDN can’t keep their answers the way it keeps GET /products/77. Apps keep their own cache instead, filed by each object’s type and id, as the popular Apollo library does. Or they use persisted queries: the server already knows the query, and the app sends just its id, as a GET, which a CDN can keep.',
						'The other risk is a query that asks for far too much: 100 products, each with 100 reviews, each review’s author with 100 orders. That’s up to a million rows from one request. So servers limit how deep a query can go, give each field a cost, and refuse a query over its limit before running it. GitHub’s GraphQL API gives each user 5,000 points an hour.',
					],
					example: {
						says: '{ products(first: 100) { reviews(first: 100) { author { orders(first: 100) { id } } } } }',
						data: {
							'rows it could read': '100 × 100 × 100 = 1,000,000',
							answer: 'refused: the query costs more than its limit',
						},
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'order-graphql',
					set: graphqlOnly,
					body: [
						'Big apps often use more than one: REST or GraphQL at the front, where apps and other companies come in, and gRPC between the services behind it.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'REST',
								'Public APIs and other companies’ programs. Simple, works everywhere, and answers to GET can be kept, even by a CDN.',
							],
							[
								'GraphQL',
								'Apps with many screens, each needing a different mix of data, often on slow mobile networks. Watch for the N+1 problem and costly queries.',
							],
							[
								'gRPC',
								'Calls between your own services: quick, compact, a strict contract, and streaming both ways. Browsers need a proxy.',
							],
							[
								'WebSockets',
								'When the server must tell the app the moment something changes, like a chat message or a moving van. The real-time lesson covers them.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the order history asking for each delivery one at a time. Add copies of the delivery service from its details until every screen works. Batching needed none.',
				journey: 'cm-gql-n1',
				set: nPlusOne,
			},
		},
		{
			id: 'message-queues',
			title: 'Message queues',
			summary:
				'Handing work over: saying it’s done, jobs done twice, rushes and more workers, backpressure, jobs that never work, order, delays and priorities, and the tools.',
			steps: [
				{
					title: 'A queue between them',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					current: [
						['server', 'queue'],
						['queue', 'worker'],
					],
					set: ordersOnly,
					facts: [{ load: 'queue' }, { busy: 'worker' }],
					body: [
						'As in the first track, the **Web server** leaves a note in a **Queue** for each receipt, and answers you straight away. The **Email worker** takes notes from the other end, and sends the emails through the **Email service**.',
						'The part that adds notes is the producer; the part that takes them is the consumer. They never talk to each other. Either can be slow, busy or restarting without the other noticing: the queue holds the notes in between.',
					],
					example: {
						says: 'A note: send the receipt for order 5521.',
						data: { to: 'riya@example.com', order: '5521', total: '₹1,499' },
					},
				},
				{
					title: 'Taking a note, and saying it’s done',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					current: [['queue', 'worker']],
					set: ordersOnly,
					body: [
						'A worker doesn’t delete a note when it takes it. It sends the email first, then tells the **Queue** “done”, called an acknowledgement, and only then is the note deleted.',
						'While a worker has it, the note is hidden from the other workers. Amazon SQS calls this the visibility timeout: 30 seconds, unless you change it. If no acknowledgement comes in time, because the worker crashed or got stuck, the note shows up again, and another worker takes it. RabbitMQ does the same when a worker’s connection drops.',
						'So the timeout must be longer than the work takes. Too short, and a slow job is handed to a second worker while the first is still on it.',
					],
					example: {
						says: 'One note, from start to finish.',
						data: {
							'8:02:00': 'a worker takes it: hidden for 30 seconds',
							'8:02:01': 'the email is sent, and the worker says done',
							then: 'the note is deleted',
							'no “done” by 8:02:30': 'it shows up again, for another worker',
						},
					},
				},
				{
					title: 'Sent twice',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: ordersOnly,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A worker sends Riya’s receipt, then crashes before saying done. The note shows up again, and another worker sends the receipt a second time.',
						'That’s the promise most queues make: at least once. Every note is handled, but some more than once. So workers are made idempotent: before sending, the worker checks whether this order’s receipt has already gone, and skips it if so.',
						'Exactly once is what everyone wants, but when a “done” can be lost on the way, no queue can promise it from end to end. What’s sold as exactly once is really effectively once: at least once, with the repeats thrown away.',
					],
					example: {
						says: 'A note: send the receipt for order 5521.',
						data: {
							'first worker': 'sends it, crashes before saying done',
							'second worker': 'checks: already sent for 5521, so skips it',
						},
					},
					compare: {
						title: 'Three promises',
						rows: [
							[
								'At most once',
								'Deleted as it’s taken, before the work. A crash loses it, but nothing is done twice. For things that hardly matter, like counting page views.',
							],
							[
								'At least once',
								'Deleted only when it’s done. A crash means it’s done again, so workers skip repeats. What most queues give.',
							],
							[
								'Exactly once',
								'At least once, with the repeats thrown away: by the worker, or by the queue for a while, like the 5 minutes an SQS FIFO queue remembers. Really effectively once.',
							],
						],
					},
				},
				{
					title: 'A rush: the queue takes the strain',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: rush,
					facts: ['succeed', { busy: 'worker' }, { backlog: 'worker' }],
					body: [
						'A sale brings 80 orders a second, and the **Email worker** can send 50 emails a second. It can’t keep up, so notes pile up in the **Queue**: 1,800 more every minute.',
						'But orders still work, as fast as ever. The emails go out late, not never: when the rush ends, the worker catches up. Taking in a burst and working through it at a steady pace like this is called load levelling.',
					],
				},
				{
					title: 'More workers',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: { ...rush, copies: { server: 2, worker: 2 } },
					copies: true,
					facts: [{ busy: 'worker' }, { backlog: 'worker' }],
					body: [
						'Or add a second worker. Both take notes from the same **Queue**, each note going to just one of them, so together they send 100 a second and keep up. Workers sharing one queue like this are called competing consumers.',
						'How long the queue is, and how long its oldest note has waited, say when to add workers. Many apps add them automatically as it grows: on Kubernetes, KEDA does it from the queue’s length.',
					],
				},
				{
					title: 'Too many workers',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: bigSale,
					copies: true,
					facts: [
						{ copies: 'worker' },
						{ busy: 'email' },
						{ retries: 'email' },
						'background',
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The biggest sale of the year brings 140 orders a second. Workers are added automatically, 4 of them, and they keep up with the queue. But every one of them calls the **Email service**, which takes at most 100 emails a second from the shop.',
						'So the email service is sent 140 a second, and turns the rest away. The workers try again, adding about 150 more calls a second. Now it gets nearly three times what it can take, and more than 1 receipt in 4 still fails after three tries.',
						'More workers only moved the jam to the part they call.',
					],
				},
				{
					title: 'Backpressure: hold back, and let the queue wait',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: heldBack,
					copies: true,
					facts: [{ busy: 'email' }, { backlog: 'worker' }],
					body: [
						'Instead, the workers send no faster than the **Email service** can take: 90 a second between them, just under its limit. The rest wait in the **Queue**, 50 more every second, and go out when the sale ends. Every receipt arrives, some of them late.',
						'Slowing down because the next part is full is called backpressure. The signal can be a limit you set, as here, or the part itself saying so: an answer of 429 or 503 means wait, and try later.',
						'A queue can’t grow for ever either: it fills its memory or its disk. So watch its length, and when it’s far too long, push back on the producers too: refuse new work for a while, or drop work nobody will miss.',
					],
				},
				{
					title: 'A note that never works',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: ordersOnly,
					body: [
						'One receipt has a mistyped email address, so it fails every time. Tried for ever, it would come back again and again, and waste the worker’s time. A note like this is called a poison message.',
						'So after a few tries, it’s moved to a separate dead-letter queue, where a person can look at it, fix it, and send it back. Everything else keeps flowing. In Amazon SQS, you set how many tries in the queue’s redrive policy; RabbitMQ has dead-letter exchanges.',
						'Anything in the dead-letter queue is work that didn’t happen, so teams set an alert for when it isn’t empty.',
					],
					example: {
						says: 'A note: send the receipt to riya@gmial.con.',
						data: {
							'tries 1 to 3': 'address doesn’t exist',
							then: 'moved to the dead-letter queue',
						},
					},
				},
				{
					title: 'In what order?',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: ordersOnly,
					body: [
						'Two notes about order 5521 arrive close together: “paid”, then “cancelled”. With several workers, the second can finish first: the first worker might be slow, or crash, so its note comes back later. Then the refund goes out before the payment is even recorded.',
						'Most queues keep order only roughly: Amazon SQS calls its standard queues best effort. Its FIFO queues, first in, first out, keep strict order within a message group. Give every note about order 5521 the same group, and they’re handled one at a time, in order, while other orders’ notes go to other workers.',
						'Strict order costs speed, so use it only where it matters. Often it’s simpler to let notes arrive in any order, and carry enough to cope: a version number, say, so an older update is skipped.',
					],
					example: {
						says: 'Notes in a FIFO queue, grouped by order.',
						data: {
							'order 5521, first': 'paid',
							'order 5521, second': 'cancelled: waits until “paid” is done',
							'order 6210': 'handled meanwhile, by another worker',
						},
					},
				},
				{
					title: 'Later, or first: delays and priorities',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: ordersOnly,
					body: [
						'Some jobs shouldn’t run yet. “Remind Riya about her cart in an hour” is a delayed job: it waits in the queue, hidden, until it’s due. Amazon SQS can delay a note by up to 15 minutes; Sidekiq and BullMQ can schedule a job for any time. For days ahead, a table of jobs with a due time, checked every minute, is common.',
						'Some jobs are more urgent: a password-reset email shouldn’t wait behind 50,000 newsletters. RabbitMQ queues can give notes priorities. More often, urgent and bulk jobs just get separate queues, each with its own workers, so a flood of one can’t hold up the other.',
					],
					example: {
						says: 'Three jobs, three timings.',
						data: {
							'password reset': 'the urgent queue: now',
							'receipt for order 5521': 'the normal queue: now',
							'cart reminder': 'delayed: in an hour',
						},
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: ordersOnly,
					body: [
						'They all hand each job to one worker. They differ in who runs them, and what they add.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'RabbitMQ',
								'A broker you run yourself, or rent. Acknowledgements, priorities, dead-letter exchanges, and rules that send each note to the right queue.',
							],
							[
								'Amazon SQS',
								'A queue Amazon runs for you, with nothing to manage. Standard queues: nearly unlimited, at least once, best-effort order. FIFO queues: strict order in each group, repeats removed, lower limits.',
							],
							[
								'Redis job queues',
								'Sidekiq for Ruby, BullMQ for Node.js: jobs kept in Redis, which many apps already run, with retries, delays and priorities built in. Set Redis to save to disk, or a restart loses jobs.',
							],
							[
								'A table in the database',
								'A few jobs a second, and no new system to run: workers claim rows with SELECT … FOR UPDATE SKIP LOCKED in Postgres.',
							],
							[
								'Kafka',
								'Not a queue but a log: every subscriber reads every event, and events are kept for days. The next two lessons.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely in the biggest sale. Turn autoscaling off, change how many workers run from their details, and watch the email service and the queue.',
				journey: 'order',
				set: bigSale,
			},
		},
		{
			id: 'pub-sub',
			title: 'Publish and subscribe',
			summary:
				'Say what happened once, and let every part that cares listen: fan-out, adding a subscriber, events or commands, changing an event safely, and the outbox.',
			steps: [
				{
					title: 'Telling everyone, one by one',
					show: ['app', 'lb', 'server', 'db', 'stock-svc', 'reports'],
					journey: 'order-direct',
					current: [
						['server', 'stock-svc'],
						['server', 'reports'],
					],
					set: telling,
					facts: ['wait'],
					timeline: true,
					body: [
						'When an order is placed, other parts need to know: the **Stock service** takes a kettle off the shelf count, and the **Reports service** counts the sale.',
						'Here, the **Web server** calls each one in turn, and waits for each. It has to know every part that cares, and you wait for all of them.',
					],
				},
				{
					title: 'One of them breaks',
					show: ['app', 'lb', 'server', 'db', 'stock-svc', 'reports'],
					journey: 'order-direct',
					set: { ...telling, down: ['reports'] },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The **Reports service** goes down, and now nobody can place an order, all because a sales count couldn’t be updated.',
						'And each new part that wants to hear about orders means changing, testing and shipping the order code again. The parts are tied tightly together.',
					],
				},
				{
					title: 'Publish once',
					show: ['app', 'lb', 'server', 'db', 'events', 'stock-svc', 'reports', 'worker'],
					journey: 'order-event',
					current: [['server', 'events']],
					set: publishing,
					facts: ['wait'],
					tags: [{ text: 'Background: nobody waits', tone: 'background' }],
					body: [
						'Instead, the server publishes one event, “order placed”, to an **Event stream**, and answers you. It doesn’t know or care who listens.',
						'The **Stock service**, the **Reports service** and the **Email worker** each subscribe, and each gets every event, reading at its own pace. One event in, three deliveries out: that’s fan-out. The whole idea is called publish and subscribe, or pub/sub.',
					],
					example: {
						says: 'Event: order placed.',
						data: { order: '5521', product: 'Blue kettle ×1', at: '24 Nov, 8:02 pm' },
					},
				},
				{
					title: 'The same break, now',
					show: ['app', 'lb', 'server', 'db', 'events', 'stock-svc', 'reports', 'worker'],
					journey: 'order-event',
					set: { ...publishing, down: ['reports'] },
					facts: ['succeed'],
					tags: [{ text: 'It keeps working', tone: 'plain' }],
					body: [
						'With the **Reports service** down, orders work as before. Its events wait in the stream, and when it’s back, it carries on reading from where it stopped.',
					],
				},
				{
					title: 'A new subscriber, and no other change',
					show: [
						'app',
						'lb',
						'server',
						'db',
						'events',
						'stock-svc',
						'reports',
						'worker',
						'cm-loyalty',
					],
					journey: 'cm-order-loyalty',
					current: [['events', 'cm-loyalty']],
					set: loyal,
					facts: [{ load: 'cm-loyalty' }, 'wait'],
					body: [
						'The shop starts a loyalty scheme: a point for every ₹100 spent. A new **Loyalty service** subscribes to “order placed”, and from then on gets 10 events a second, like the others.',
						'Not a line of the order code changed, and placing an order still takes 27 ms. The publisher doesn’t even know the loyalty service exists. That’s the real gain: parts can be added, changed and removed without the others knowing.',
						'The cost: nobody can see the whole flow in one place any more. What happens after an order is spread over every subscriber, so clear event names, and tracing, matter.',
					],
				},
				{
					title: 'Events, or commands',
					show: ['server', 'events', 'stock-svc', 'reports', 'worker'],
					journey: 'order-event',
					set: publishing,
					body: [
						'An event says something happened: “order 5521 placed”. It’s in the past tense, the publisher doesn’t mind who listens, or whether anyone does, and it can’t be refused: it has already happened.',
						'A command asks for something to be done: “send the receipt for order 5521”. It’s meant for one handler, the sender cares that it happens, and it can fail. Commands belong on a queue, as in the message queue lesson.',
						'Mixing them up causes trouble. An event called “send receipt” ties the publisher to one listener, and a command sent to every subscriber gets done many times.',
					],
					example: {
						says: 'One of each.',
						data: {
							event: 'OrderPlaced { order: 5521, total: ₹1,499 }',
							command: 'SendReceipt { order: 5521, to: riya@example.com }',
						},
					},
				},
				{
					title: 'Changing what an event says',
					show: ['server', 'events', 'stock-svc', 'reports', 'worker'],
					journey: 'order-event',
					set: publishing,
					body: [
						'Subscribers read the event’s fields, so an event’s shape is an API too, with readers the publisher may never have heard of. Adding a field is safe, as long as old readers ignore fields they don’t know. Removing or renaming one, or changing its type, breaks somebody.',
						'So a breaking change gets a new event, like OrderPlaced version 2, published beside the old one until every subscriber has moved. A schema registry, like Confluent’s for Kafka, keeps the shape of each event, and refuses a new shape that would break its readers.',
						'Put enough in each event for most subscribers to act without asking: the order’s total and items, not just its number. Otherwise every subscriber calls the web server for the order, and the parts are tied together again.',
					],
					example: {
						says: 'A safe change, and a breaking one.',
						data: {
							'adding a field, coupon': 'old readers skip it',
							'renaming total to amount': 'the reports service counts nothing',
						},
					},
				},
				{
					title: 'Saved, but never announced',
					show: ['app', 'lb', 'server', 'db', 'events'],
					journey: 'order-event',
					current: [
						['server', 'db'],
						['server', 'events'],
					],
					set: publishing,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'The **Web server** saves the order, then crashes before publishing. The order exists, but no receipt is sent, and the stock is never taken. Publish first instead, and a crash leaves an event for an order that doesn’t exist.',
						'The fix is an outbox: the event is saved in the **Database** in the same transaction as the order, so both are saved, or neither. A worker then publishes it from there, and marks it sent. If the worker crashes in between, it publishes again, so subscribers still skip repeats.',
						'Another way is change data capture: a tool like Debezium reads the database’s own record of changes, and publishes them. Stockroom uses an outbox.',
					],
					example: {
						says: 'In one transaction:',
						data: { orders: 'order 5521', outbox: 'event: order 5521 placed' },
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'db', 'events', 'stock-svc', 'reports', 'worker'],
					journey: 'order-event',
					set: publishing,
					body: [
						'Most systems use all three. For each message, ask: does the sender need the answer now, and does it care who acts on it?',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Call it directly',
								'The caller needs the answer to carry on, like the price before charging. Simple, but it waits, and breaks when the other part does.',
							],
							[
								'A command on a queue',
								'One part must do a job, and the sender can’t wait for it: send the receipt, resize the photo.',
							],
							[
								'Publish an event',
								'Something happened that any number of parts may care about, now or later: order placed, payment failed.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the event stream and its four subscribers. Take them down one at a time, and see what still works.',
				journey: 'cm-order-loyalty',
				set: loyal,
			},
		},
		{
			id: 'event-logs',
			title: 'Inside an event log',
			summary:
				'How Kafka works: topics, offsets and partitions, consumer groups, falling behind, crashes, keeping events to read again, and when a log beats a queue.',
			steps: [
				{
					title: 'A log that remembers',
					show: loyaltyParts,
					journey: 'cm-order-loyalty',
					current: [['server', 'events']],
					set: loyal,
					facts: [{ load: 'events' }],
					body: [
						'The **Event stream** here works like Kafka, the best known. It isn’t a queue that deletes each note once it’s handled. It’s a log: each event is added to the end, numbered in order, and kept.',
						'Events of one kind go to one topic, like orders. Each event’s number in it is its offset. Each subscriber remembers the offset it has read up to, and asks for what comes after. Reading removes nothing, so many subscribers read the same events, each at its own place.',
					],
					example: {
						says: 'The orders topic, and where two readers are.',
						data: {
							'offset 48,207': 'order 5519 placed',
							'offset 48,208': 'order 5520 placed',
							'offset 48,209': 'order 5521 placed',
							'Stock service': 'has read up to 48,209',
							'Loyalty service': 'has read up to 48,207',
						},
					},
				},
				{
					title: 'Partitions, and keys',
					show: loyaltyParts,
					journey: 'cm-order-loyalty',
					current: [['server', 'events']],
					set: loyal,
					body: [
						'One machine can only write so fast, so a topic is split into partitions, each a log of its own, with its own offsets, spread over Kafka’s machines, called brokers. The orders topic here has 6.',
						'The publisher gives each event a key, and a hash of the key picks the partition. Every event with the same key lands in the same partition, in the order it was published. Kafka keeps order only within a partition, not across the whole topic.',
						'So choose the key by what must stay in order. Key by order number, and “5521 placed”, “5521 paid” and “5521 shipped” stay in order. With no key, they spread out, and a subscriber can see “shipped” before “placed”. But a key with too many events, like one huge seller, makes one partition far busier than the rest.',
					],
					example: {
						says: 'Picking a partition from the key.',
						data: {
							key: 'order 5521',
							hash: '1,604,218,333',
							'divided by 6, the remainder': '1, so partition 1, every time',
						},
					},
				},
				{
					title: 'Consumer groups',
					show: loyaltyParts,
					journey: 'cm-order-loyalty',
					current: [
						['events', 'stock-svc'],
						['events', 'reports'],
						['events', 'cm-loyalty'],
					],
					set: loyal,
					body: [
						'Each subscribing service is a consumer group: the **Stock service** is one, the **Reports service** another, the **Loyalty service** a third. Every group gets every event.',
						'Within a group, the copies share the work: each partition is read by just one copy at a time. With 6 partitions and 2 copies of the reports service, each copy reads 3. So each partition is still read in order, by one reader.',
						'This one idea gives both kinds of messaging. Across groups, it’s pub/sub: everyone gets everything. Within a group, it’s a queue: each event goes to just one copy.',
					],
					example: {
						says: '6 partitions, two groups.',
						data: {
							'Reports service, 2 copies':
								'copy 1 reads partitions 0 to 2, copy 2 reads 3 to 5',
							'Loyalty service, 1 copy': 'reads all 6',
						},
					},
				},
				{
					title: 'Falling behind',
					show: loyaltyParts,
					journey: 'cm-order-loyalty',
					set: lagging,
					facts: ['succeed', { busy: 'cm-loyalty' }, { backlog: 'cm-loyalty' }],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A sale brings 40 orders a second. The **Loyalty service** works out points for every item, slowly, and can handle 25 orders a second. It falls behind: the gap between the newest offset and the one it has read grows by 15 every second. That gap is called consumer lag.',
						'Orders still work, and the other groups keep up. Only the points arrive late. Lag is the number to watch for every consumer group: when it keeps growing, the group can’t keep up.',
					],
				},
				{
					title: 'More copies, up to the partitions',
					show: loyaltyParts,
					journey: 'cm-order-loyalty',
					set: caughtUp,
					copies: true,
					facts: [
						{ copies: 'cm-loyalty' },
						{ busy: 'cm-loyalty' },
						{ backlog: 'cm-loyalty' },
					],
					body: [
						'Add two more copies of the **Loyalty service** to its group. Kafka shares the 6 partitions out, 2 each, and together they keep up.',
						'But a group can only use as many copies as there are partitions. A seventh copy would get no partition, and sit idle. So topics are made with room to grow: more partitions than you need today. Partitions can be added later, but then keys land in different partitions, and order for a key can break until the old events are read.',
					],
				},
				{
					title: 'A copy crashes',
					show: loyaltyParts,
					journey: 'cm-order-loyalty',
					set: caughtUp,
					copies: true,
					body: [
						'Each copy saves its offset to Kafka every so often: it commits it. When a copy crashes, the group notices it has gone quiet, and hands its partitions to the other copies, a rebalance. They start from its last committed offset.',
						'If it had handled a few events since that commit, they’re handled again. So, as with queues, consumers get events at least once, and skip repeats by each event’s id.',
						'Commit before handling instead, and a crash skips events: at most once. Kafka can do effectively once when a consumer reads from Kafka and writes only to Kafka, using its transactions.',
					],
					example: {
						says: 'A crash between commits.',
						data: {
							'last committed': 'offset 48,200, the next one to read',
							'handled before the crash': '48,200 to 48,209',
							'the next copy starts at':
								'48,200, so those 10 events are handled twice',
						},
					},
				},
				{
					title: 'Keeping events, and reading them again',
					show: loyaltyParts,
					journey: 'cm-order-loyalty',
					set: loyal,
					body: [
						'Kafka keeps events for as long as you choose, 7 days unless you change it, whether anyone has read them or not. A subscriber that was down for a day catches up from its offset.',
						'Because they’re kept, they can be read again. The reports service counted last Wednesday’s sales wrong? Fix the bug, move its offset back to Wednesday, and it reads them all again. A new service can start from the oldest event kept, and fill in its history.',
						'Some topics keep only the newest event for each key, for ever: a compacted topic. A topic of prices, keyed by product, then always holds every product’s current price.',
					],
					example: {
						says: 'Moving an offset back.',
						data: {
							'Reports service': 'moved to the first offset of 18 Nov',
							then: 'reads 6 days of orders again, and recounts',
						},
					},
					note: {
						title: 'Kept on several brokers',
						text: 'Each partition is kept on several brokers, often 3: a leader that takes the writes, and followers that copy it, ready to take over if the leader’s broker dies. With acks=all, the publisher hears “saved” only once the followers keeping up have the event too.',
					},
				},
				{
					title: 'A queue, or a log: which one when',
					show: loyaltyParts,
					journey: 'cm-order-loyalty',
					set: loyal,
					body: [
						'Both hand messages between parts that never talk directly. A queue is a to-do list that empties; a log is a record that stays.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'A queue: RabbitMQ, SQS',
								'Jobs for one worker each, deleted when done. Acknowledgements for each job, retries, delays and dead letters. Order is loose.',
							],
							[
								'A log: Kafka, Amazon Kinesis',
								'Events that many groups read, kept for days and read again when needed, in order within each partition, at huge volumes. A group’s copies are capped by the partitions.',
							],
							[
								'Pub/sub services: Amazon SNS, Google Pub/Sub',
								'Fan-out run for you: every subscriber gets every message, often into a queue of its own, like SNS into SQS.',
							],
							[
								'Redis pub/sub',
								'Fast and simple, but nothing is kept: a subscriber that isn’t connected misses the message. For live updates, not for work that must happen.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely in the sale, with the loyalty service falling behind. Add copies of it from its details until it keeps up.',
				journey: 'cm-order-loyalty',
				set: lagging,
			},
		},
		{
			id: 'real-time',
			title: 'Real-time updates',
			summary:
				'Asking again and again, or being told the moment something changes: polling, long polling, server-sent events, WebSockets, many live servers, reconnecting, and push notifications.',
			steps: [
				{
					title: 'Asking again and again',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'parcel-poll',
					set: polling,
					facts: ['rate', { busy: 'server' }],
					body: [
						'A thousand shoppers watch their parcel move on a map. Each app asks “anything new?” every 2 seconds: 500 requests a second.',
						'But each van only moves every 10 seconds, so 4 answers in 5 are “nothing new”. Asking again and again like this is called polling.',
					],
				},
				{
					title: 'A busy evening',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'parcel-poll',
					set: { ...polling, traffic: 3 },
					facts: ['rate', 'succeed', { busy: 'server' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'In the evening, three times as many people watch. That’s 1,500 requests a second, mostly for nothing, and six web servers can’t answer them all.',
					],
				},
				{
					title: 'Long polling: hold the answer',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'cm-parcel-long',
					set: longPolling,
					facts: ['rate', 'succeed', { busy: 'server' }],
					body: [
						'A small change helps a lot. The app asks “anything new?” as before, but when there’s nothing, the **Web server** doesn’t say no. It holds the request open until the van moves, or for about 30 seconds, then answers. The app asks again at once. That’s long polling.',
						'Now every answer has news in it. On the same busy evening, the servers get 300 requests a second, one each time a van moves, instead of 1,500, and every one works.',
						'It works wherever plain web requests do. But each update still costs a whole request, and the server holds thousands of requests open while they wait, so it has to be built for that.',
					],
					example: {
						says: 'GET /parcels/88/location?since=8:02:10',
						data: {
							'the server': 'holds it for 6 seconds, until the van moves',
							answer: '200: the van is 2 streets away',
						},
					},
				},
				{
					title: 'Keep a line open: WebSockets',
					show: ['vans', 'app', 'lb', 'server', 'db', 'live'],
					journey: 'parcel-push',
					draw: ['parcel-connect'],
					current: [
						['server', 'live'],
						['live', 'app'],
					],
					set: pushing,
					facts: [{ load: 'server' }, { busy: 'server' }],
					body: [
						'Better still, each app opens one connection to a **Live updates server**, and keeps it open: a WebSocket. It starts as an ordinary web request asking to “upgrade”, then stays open, and either side can send a message down it at any moment.',
						'When a van sends its location, the **Web server** passes it on, and the live server pushes it down the connection of whoever is watching. Messages flow only when something changes, each with just a few bytes of wrapping. On the same busy evening, the web servers handle only the vans’ updates: 300 a second.',
					],
				},
				{
					title: 'Server-sent events: one way is often enough',
					show: ['vans', 'app', 'lb', 'server', 'db', 'live'],
					journey: 'parcel-push',
					draw: ['parcel-connect'],
					current: [['live', 'app']],
					set: pushing,
					body: [
						'Often only the server has news: parcel locations, scores, prices. Server-sent events do just that. The app makes one ordinary request, and the answer never ends: the server writes another line each time there’s news.',
						'It’s plain HTTP, so it passes through proxies and load balancers that might trip up a WebSocket. And browsers reconnect by themselves, saying which event they saw last, so the server can send what they missed. What it can’t do is carry messages from the app, which go as ordinary requests.',
						'WebSockets suit chat, games and editing a document together, where both sides talk all the time.',
					],
					example: {
						says: 'GET /parcels/88/live, Accept: text/event-stream',
						data: {
							'id: 41': 'data: {"van": 12, "streets_away": 3}',
							'id: 42': 'data: {"van": 12, "streets_away": 2}',
							'if it drops': 'the browser reconnects, with Last-Event-ID: 42',
						},
					},
				},
				{
					title: 'Many live servers: who holds Riya’s connection?',
					show: ['vans', 'app', 'lb', 'server', 'db', 'live', 'cm-channel'],
					journey: 'cm-parcel-shared',
					draw: ['parcel-connect'],
					current: [
						['server', 'cm-channel'],
						['cm-channel', 'live'],
					],
					set: sharedChannel,
					copies: true,
					facts: [{ copies: 'live' }, { load: 'cm-channel' }],
					body: [
						'One live server holds tens of thousands of open connections, so a big shop runs several. Riya’s app is connected to one of them, whichever the load balancer picked. When van 12 moves, which one should the **Web server** tell?',
						'A shared channel answers it. Each **Live updates server** subscribes, in **Redis pub/sub**, to the channel of every van its apps are watching. The web server sends each location to its van’s channel, and Redis passes it to whichever live servers are listening. Any server can reach any user, without knowing where they are.',
						'Redis pub/sub keeps nothing: a live server that isn’t listening misses the message. That’s fine here, as the next location comes in 10 seconds.',
					],
					example: {
						says: 'Van 12 moves.',
						data: {
							'the web server': 'PUBLISH van:12 with the location',
							'live server 2':
								'subscribed to van:12, where Riya watches: pushes it to her',
							'live servers 1 and 3': 'not subscribed: never see it',
						},
					},
				},
				{
					title: 'A live server restarts',
					show: ['app', 'lb', 'live'],
					journey: 'parcel-connect',
					set: stampede,
					copies: true,
					facts: ['rate', 'succeed', { busy: 'live' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'On a sale day, with far more apps open, one of the three live servers restarts for an update, and its 12,000 apps lose their connection. They all notice within a second or two, and reconnect at once: about 6,000 a second, to the two **Live updates server** copies left.',
						'Opening a connection is far more work than keeping one open, and the two can’t take them all: 1 in 3 fails, and those apps try again at once, keeping the rush going. Everyone arriving at the same moment like this is called a thundering herd.',
					],
				},
				{
					title: 'Reconnecting gently, and heartbeats',
					show: ['app', 'lb', 'live'],
					journey: 'parcel-connect',
					set: gentle,
					copies: true,
					facts: ['rate', 'succeed', { busy: 'live' }],
					body: [
						'So each app waits a random moment before reconnecting, anywhere in the first 30 seconds, and longer after each failure: backoff, with jitter. The same 12,000 apps now arrive at about 400 a second, and every one gets in.',
						'Connections also die quietly: a phone goes into a tunnel, or a box on the way drops a connection that has been silent too long. So a tiny heartbeat goes back and forth every 20 or 30 seconds: a WebSocket ping from the server, answered by a pong, or a small message of the app’s own. A connection that misses a few is closed, and the app reconnects, then asks for anything it missed while it was away.',
					],
					note: {
						title: 'Open connections cost too',
						text: 'Each one holds some memory on the live server for as long as the app is open, even when nothing is said. Live servers are sized by the connections they hold, not just requests a second, and load balancers must be set to keep quiet connections open long enough.',
					},
				},
				{
					title: 'When the app is closed: push notifications',
					show: ['vans', 'lb', 'server', 'db', 'cm-notify', 'cm-push', 'app'],
					journey: 'cm-parcel-notify',
					current: [
						['cm-notify', 'cm-push'],
						['cm-push', 'app'],
					],
					set: notifying,
					facts: [{ load: 'cm-push' }],
					body: [
						'A closed app has no connection open, and phones don’t let apps keep one in the background. The only way in is through the phone’s maker: Apple’s push service, APNs, for iPhones, and Google’s Firebase Cloud Messaging for Android.',
						'When Riya first opened the app, it got a device token from Apple, and sent it to the shop. Now, when her van is 2 stops away, the **Notification service** sends the message and her token to **Apple and Google push**, which deliver it to her phone, even while it sleeps.',
						'Delivery is best effort, and can be late. So a notification says something worth opening the app for, and the app fetches the details when it opens.',
					],
					example: {
						says: 'A notification for Riya.',
						data: {
							'device token': 'a long id Apple gave her phone',
							title: 'Your parcel is 2 stops away',
							'when she taps it': 'the app opens on the parcel map',
						},
					},
				},
				{
					title: 'Which one when',
					show: ['vans', 'app', 'lb', 'server', 'db', 'live'],
					journey: 'parcel-push',
					draw: ['parcel-connect'],
					set: pushing,
					body: [
						'They all get news to people quickly, at different costs. Many apps use several: a WebSocket while the app is open, push notifications when it’s closed, and polling as a fallback.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Polling',
								'News every few minutes, or few users. Simple, works everywhere, and answers can be cached.',
							],
							[
								'Long polling',
								'Updates now and then, where only plain requests get through. A fallback when nothing else works.',
							],
							[
								'Server-sent events',
								'Only the server talks: live scores, prices, parcel maps, progress bars. Plain HTTP, and it reconnects by itself.',
							],
							[
								'WebSockets',
								'Both sides talk often: chat, games, editing together. Needs live servers, a shared channel, and gentle reconnects.',
							],
							[
								'Push notifications',
								'The app is closed. Through Apple and Google, best effort, a short message.',
							],
							[
								'Webhooks',
								'One company’s server telling another’s. The next lesson.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the live updates on a busy evening. Push the traffic up and down, and compare it with polling.',
				journey: 'parcel-push',
				set: pushing,
			},
		},
		{
			id: 'webhooks',
			title: 'Webhooks',
			summary:
				'One company’s server telling another’s, instead of being asked again and again: signed, answered quickly, sent more than once, and checked against the records.',
			steps: [
				{
					title: 'Is it paid yet?',
					show: ['app', 'lb', 'server', 'payments'],
					journey: 'pay-poll',
					set: payPolling,
					facts: [{ load: 'payments' }],
					body: [
						'Companies poll each other too. While shoppers pay, the shop asks the **Payment provider** every couple of seconds whether each payment has gone through: 50 questions a second, nearly all answered “not yet”.',
						'That’s work for both sides, and the news still arrives up to 2 seconds late.',
					],
				},
				{
					title: 'Tell me when it’s done',
					show: ['app', 'lb', 'server', 'db', 'payments'],
					journey: 'pay-webhook',
					current: [['payments', 'lb']],
					set: webhook,
					facts: [{ load: 'server' }],
					body: [
						'Instead, the shop gives the **Payment provider** an address of its own. When a payment goes through, the provider calls it, once. That’s a webhook: the call goes the other way.',
						'Now the **Web server** gets 2 requests a second, one for each payment, and every one has news in it.',
					],
					example: {
						says: 'POST shop.example.com/webhooks/payments',
						data: { event: 'payment succeeded', order: '5521', amount: '₹1,499' },
					},
				},
				{
					title: 'Is it really them? Signing',
					show: ['lb', 'server', 'db', 'payments'],
					journey: 'pay-webhook',
					current: [['payments', 'lb']],
					set: webhook,
					body: [
						'The webhook address is on the open internet. Anyone who finds it could send “order 5521 is paid” without paying. So the shop must check that each webhook really came from the provider.',
						'When the shop sets up webhooks, the provider gives it a signing secret that only the two of them know. With each webhook, the provider sends a signature: an HMAC, a code worked out from the secret and the exact body. The shop works it out again, from its own secret and the body it received. If the two match, the body came from the provider, unchanged.',
						'Stripe’s signature also covers the time it was sent, and the shop refuses old ones, so a webhook caught by an attacker can’t be sent again later. GitHub signs its webhooks with an HMAC too.',
					],
					example: {
						says: 'POST shop.example.com/webhooks/payments',
						data: {
							Signature: 't=1795530730, v1=5257a869e7ec…',
							body: '{ "id": "evt_1Q9", "type": "payment.succeeded", "order": 5521 }',
							'the shop checks':
								'an HMAC of the time and the body, with its secret: a match',
						},
					},
				},
				{
					title: 'All the work before answering',
					show: ['payments', 'lb', 'server', 'db', 'email'],
					journey: 'cm-hook-slow',
					set: slowHook,
					facts: ['succeed', 'wait'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Here, the shop does everything before answering the webhook: it marks the order paid, then sends the receipt through the **Email service**. Today the email service is down, so every webhook waits, times out, and fails.',
						'To the provider, the shop’s address is broken. It sends each webhook again later, and if the failures go on for days, some providers switch the address off. Yet nothing about the payment needed the email to work.',
					],
				},
				{
					title: 'Save it, answer, then work',
					show: ['payments', 'lb', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'cm-hook-queue',
					set: queuedHook,
					facts: ['succeed', 'wait'],
					tags: [{ text: 'It keeps working', tone: 'plain' }],
					body: [
						'Instead, the shop checks the signature, saves the event, marks the order paid, and answers 200 at once. The receipt is a note in the **Queue**, for the **Email worker**.',
						'Now every webhook is answered in 26 ms, even with the email service down. The receipts wait, and go out when it’s back. Providers expect an answer within seconds, so this is the usual way to receive webhooks.',
					],
				},
				{
					title: 'Twice, late, out of order, or never',
					show: ['payments', 'lb', 'server', 'db'],
					journey: 'pay-webhook',
					set: webhook,
					body: [
						'Providers send webhooks at least once: when the shop doesn’t answer 200 in time, they try again, waiting longer each time. Stripe keeps trying for up to 3 days. So the same webhook can arrive twice, and the shop saves each event’s id, and skips one it has seen.',
						'They can arrive out of order too: “payment refunded” before “payment succeeded”. So the shop doesn’t trust the order they come in. It checks the time in each, or asks the provider’s API for the payment as it is now.',
						'And one can go missing altogether. So the shop also checks for anything it missed: every hour, it asks the provider for recent payments, and compares them with its own records. That’s reconciling.',
					],
					example: {
						says: 'The same event, twice.',
						data: {
							'first, evt_1Q9': 'saved; order 5521 marked paid',
							'again, evt_1Q9': 'already seen: answer 200, do nothing',
						},
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'db', 'payments'],
					journey: 'pay-webhook',
					set: webhook,
					body: [
						'Webhooks are quick but not guaranteed; polling is guaranteed but slow and wasteful. So anything to do with money uses both.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Polling the provider',
								'Few payments, or a provider without webhooks. Simple, but late and wasteful.',
							],
							[
								'Webhooks',
								'Hearing about changes as they happen. Check the signature, answer fast, skip repeats.',
							],
							[
								'Webhooks, and reconciling',
								'Anything involving money: webhooks for speed, and a regular check against the provider’s records for any that went missing.',
							],
							[
								'Sending webhooks yourself',
								'When your own customers want to hear from you: sign them, give each event an id, and retry with backoff.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the webhook doing all its work before answering, while the email service is down. Bring the email service back from its details, and see what the provider sees.',
				journey: 'cm-hook-slow',
				set: slowHook,
			},
		},
	],
};

export const communicationTrack: TrackModule = { track: communication, parts, journeys };
