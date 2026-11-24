import type { SystemInput } from '@/model/schema';

const REPO = 'https://github.com/iamrs77/stockroom';

/**
 * Stockroom, an open-source inventory app for small shops, drawn from its own
 * code and documentation: the real parts, flows and failure handling. The
 * traffic numbers are illustrative, for its free hosting.
 */
export const stockroom: SystemInput = {
	id: 'stockroom',
	name: 'Stockroom',
	tagline:
		'Inventory for small shops with a few stores, built to stay correct when two things happen at once.',
	basis: 'real',
	description: [
		'Shop owners see the stock in every store, record sales and deliveries, move stock between stores, and import big spreadsheets. When something runs low, Stockroom tells the shop’s own systems. Two cashiers selling the last jar at the same moment can never take stock below zero.',
		'Unlike the other systems here, this is a real design: the same parts and flows as Stockroom’s own code, which is open source. It runs on free hosting, on one small server, so its traffic numbers here are illustrative.',
	],
	sources: [
		{ title: 'Stockroom: source code', url: REPO, publisher: 'GitHub' },
		{
			title: 'Stockroom’s architecture',
			url: `${REPO}/blob/main/docs/architecture.md`,
			publisher: 'Stockroom docs',
		},
		{
			title: 'Performance: load tests and query plans',
			url: `${REPO}/blob/main/docs/performance.md`,
			publisher: 'Stockroom docs',
		},
		{
			title: 'ADR 0002: A stock ledger',
			url: `${REPO}/blob/main/docs/adr/0002-stock-ledger.md`,
			publisher: 'Stockroom docs',
		},
		{
			title: 'ADR 0006: The bulk import pipeline',
			url: `${REPO}/blob/main/docs/adr/0006-bulk-import-pipeline.md`,
			publisher: 'Stockroom docs',
		},
		{
			title: 'ADR 0008: Transfers and lock order',
			url: `${REPO}/blob/main/docs/adr/0008-transfers-and-lock-order.md`,
			publisher: 'Stockroom docs',
		},
		{
			title: 'ADR 0007: An outbox and webhooks',
			url: `${REPO}/blob/main/docs/adr/0007-outbox-and-webhooks.md`,
			publisher: 'Stockroom docs',
		},
		{ title: 'Live demo', url: 'https://stockroom-5x6w.onrender.com', publisher: 'Render' },
	],
	decisions: [
		{
			title: 'One program, split into modules',
			detail: 'Products, stock, imports, transfers, alerts and webhooks are separate modules, each owning its own routes and data, but they run in one Node program and call each other as plain functions. That’s simpler and faster than separate services. A setting can later run the background work on its own server, with no code changes.',
		},
		{
			title: 'Stock is a ledger, and the database refuses to oversell',
			detail: 'Every change is written to a history that’s only ever added to, in the same transaction as the new count. The database works out the new count itself while it holds the row, and a rule says the count can’t go below zero. In a test, 12 sales raced for 5 jars: exactly 5 went through.',
		},
		{
			title: 'Locks are always taken in the same order',
			detail: 'A change may need to lock several rows: a transfer, its products, their stock in each store, their alerts. Every part of Stockroom locks them in the same order, so two changes can never each wait for the other forever. That’s called a deadlock. Locking the product first also keeps the low-stock check right when two stores sell the same product at once.',
		},
		{
			title: 'Each business only ever sees its own data',
			detail: 'Many businesses share one database. The session decides which business a request is for, never the request itself. Every query filters by that business, so another business’s product looks exactly like one that doesn’t exist. And tests try to cross the line: one business tries to read and change another’s products.',
		},
		{
			title: 'A retried change is applied once',
			detail: 'Every stock change carries a unique key from the app. If the network drops and the app sends it again, the server finds the key and returns the first answer instead of changing stock twice. This makes the change idempotent.',
		},
		{
			title: 'Sessions live in the database',
			detail: 'Signing in stores a random token, and only its fingerprint is kept, so a leaked database can’t be used to sign in. Every request checks it, which costs a quick read, but signing out or removing a staff member works instantly.',
		},
		{
			title: 'Imports run in the background, in chunks',
			detail: 'An uploaded file is saved and queued in about a quarter of a second. A worker applies it 1,000 rows at a time, saving a checkpoint with each chunk. In a test, the worker was killed at 32,000 of 100,000 rows. It carried on from the checkpoint about a minute later, and every one of its 197,463 stock changes matched the history exactly.',
		},
		{
			title: 'Events are written with the change',
			detail: 'A low-stock alert is saved in an outbox in the same transaction as the sale that caused it, so it exists exactly when the sale does. A relay sends it on later as a signed webhook, retrying for about 20 minutes if the shop’s system doesn’t answer.',
		},
		{
			title: 'Lists stay fast at 100,000 products',
			detail: 'Load tests and query plans guided the tuning. Each product keeps its total stock, updated with every change, so lists can sort and filter by it using an index. Showing what’s running low went from 1.6 seconds to 6 milliseconds.',
		},
		{
			title: 'Free hosting, on purpose',
			detail: 'The demo runs on free plans: one small server that sleeps after 15 quiet minutes, a free database and a free Redis. The first visit after a quiet spell waits about a minute while it wakes up. Nothing is lost: imports and webhooks carry on afterwards.',
		},
	],
	rows: {
		clients: 'Everything starts in the web app, in a shop owner’s or a cashier’s browser.',
		edge: 'Every request comes in through the API. It checks who is signed in, checks every input, and makes sure a change sent twice is applied once.',
		services:
			'These are modules, not separate services. They run in the same program as the API and call each other as plain functions. Each one owns its own part of the data.',
		async: 'This is work nobody waits for. For now it runs in the same program too. A setting can move it to its own server, with no code changes.',
		data: 'PostgreSQL is the one source of truth: stock, history, sessions, imports and events all live there. Redis only carries jobs and progress, so losing it delays work but loses nothing.',
		external:
			'The shop’s own systems, which Stockroom tells about low stock and transfers, through webhooks.',
	},
	components: [
		{
			id: 'web-app',
			name: 'Web app',
			kind: 'client',
			layer: 'clients',
			summary:
				'The React app in a shop owner’s or cashier’s browser. It shows the products and the stock in every store, and handles transfers and imports.',
			why: 'It’s how shops use Stockroom.',
			onFailure:
				'This app stands for the people using it, so the simulation doesn’t make it fail.',
			scaling: 'It runs in each person’s own browser, so there’s nothing to grow.',
		},
		{
			id: 'api',
			name: 'API',
			kind: 'gateway',
			layer: 'edge',
			summary:
				'The front door. It checks who is signed in, checks every input, and stops a change sent twice from being applied twice.',
			why: 'Every rule about who can do what is enforced in one place. The web app only hides what the API would refuse.',
			onFailure: 'Nobody can use Stockroom until it’s back.',
			scaling:
				'Everything it needs to remember lives in PostgreSQL, so a second copy would work almost as it is. Only the limits on sign-in attempts are counted in each copy, so they would move to Redis first. On the free plan there’s only one copy, and it can’t add more by itself.',
			capacityPerInstance: 100,
			instances: 1,
			latencyMs: 5,
		},
		{
			id: 'products',
			name: 'Products',
			kind: 'service',
			layer: 'services',
			summary:
				'The catalogue. Every product, with its price and reorder point, in fast lists you can search, sort and filter.',
			why: 'Shop owners mostly look things up. Those lists have to be quick, even with 100,000 products.',
			onFailure: 'Nobody can see their products.',
			scaling: 'It’s a module in the same program as the API, so it grows with it.',
			capacityPerInstance: 2_000,
			instances: 1,
			latencyMs: 3,
		},
		{
			id: 'stock',
			name: 'Stock',
			kind: 'service',
			layer: 'services',
			summary:
				'Changes stock: sales, deliveries, damage and corrections. Each change is written to the history with the count after it.',
			why: 'Stock is the one thing that must never be wrong. One module owns every change to it.',
			onFailure: 'Nobody can change stock. Looking things up still works.',
			scaling: 'It’s a module in the same program as the API, so it grows with it.',
			capacityPerInstance: 2_000,
			instances: 1,
			latencyMs: 3,
		},
		{
			id: 'transfers',
			name: 'Transfers',
			kind: 'service',
			layer: 'services',
			summary:
				'Moves stock between stores. Sending takes it out straight away. Receiving adds what arrived and notes anything missing.',
			why: 'Stock in a van belongs to neither store. Transfers keep track of it until it arrives.',
			onFailure: 'Stock can’t be sent or received for a while.',
			scaling: 'It’s a module in the same program as the API, so it grows with it.',
			capacityPerInstance: 2_000,
			instances: 1,
			latencyMs: 3,
		},
		{
			id: 'imports',
			name: 'Imports',
			kind: 'service',
			layer: 'services',
			summary:
				'Takes in uploaded spreadsheets, queues them, and streams their progress to the browser.',
			why: 'A big file takes far longer to apply than a request should. The upload is answered at once, and the work happens later.',
			onFailure: 'New files can’t be uploaded. Imports already queued carry on.',
			scaling: 'It’s a module in the same program as the API, so it grows with it.',
			capacityPerInstance: 2_000,
			instances: 1,
			latencyMs: 5,
		},
		{
			id: 'import-worker',
			name: 'Import worker',
			kind: 'worker',
			layer: 'async',
			summary:
				'Applies an import 1,000 rows at a time. Each chunk is saved together with a checkpoint, so a crash carries on from there.',
			why: 'A 100,000-row file can’t be applied in one go: a crash halfway would leave a mess. Chunks with checkpoints make it safe to stop at any moment.',
			onFailure:
				'Imports stop where they are. When a worker is back, each one carries on from its last checkpoint, and nothing is applied twice.',
			scaling:
				'One import runs at a time for each business. A setting can run more workers, on their own servers.',
			capacityPerInstance: 0.5,
			instances: 1,
			latencyMs: 2_000,
		},
		{
			id: 'outbox-relay',
			name: 'Outbox relay',
			kind: 'worker',
			layer: 'async',
			summary:
				'Picks up new events from the outbox, such as a low-stock alert, and queues one delivery for each business system that wants it.',
			why: 'Events are saved with the change that caused them. Something has to send them on, without holding up the change.',
			onFailure:
				'Events wait safely in the outbox. Every 30 seconds, a sweep sends on any that were missed. On the free plan it runs every 30 minutes, so the database can sleep.',
			scaling:
				'Two relays can run at once: each takes a different batch, so nothing is sent twice.',
			capacityPerInstance: 50,
			instances: 1,
			latencyMs: 5,
		},
		{
			id: 'webhook-sender',
			name: 'Webhook sender',
			kind: 'worker',
			layer: 'async',
			summary:
				'Sends each event to the business’s system as a signed web request, and tries again with longer waits if it fails.',
			why: 'The business’s system may be slow or down. Retrying in the background keeps that from slowing anyone in the shop.',
			onFailure: 'Alerts arrive late. Everything in the shops carries on.',
			scaling: 'It runs in the same program for now, and can move to its own server.',
			capacityPerInstance: 20,
			instances: 1,
			latencyMs: 5,
		},
		{
			id: 'postgres',
			name: 'PostgreSQL',
			kind: 'database',
			layer: 'data',
			summary:
				'The one source of truth: products, the stock in every store, its full history, sessions, imports and events waiting to be sent.',
			why: 'Keeping everything in one database means a change and its history and its event are saved together, or not at all.',
			onFailure:
				'Nothing works until it’s back. But nothing is ever half saved: every change either happened completely or not at all.',
			scaling:
				'On the free plan it’s small, and it sleeps when nobody’s using it. When it gets busy, the first step is a read-only copy for the lists.',
			capacityPerInstance: 300,
			instances: 1,
			latencyMs: 4,
		},
		{
			id: 'redis',
			name: 'Redis',
			kind: 'queue',
			layer: 'data',
			summary:
				'Holds the job queues for imports and webhooks, and passes import progress back to the browser.',
			why: 'Workers need a fast place to wait for jobs. PostgreSQL still records every job, so Redis only delivers them.',
			onFailure:
				'Uploads still work, and nothing is lost. Imports and webhooks wait until it’s back, and the import page checks for progress every few seconds instead.',
			scaling: 'It’s a free plan with a monthly limit, so idle workers check it rarely.',
			capacityPerInstance: 200,
			instances: 1,
			latencyMs: 3,
		},
		{
			id: 'webhook-endpoint',
			name: 'Business’s system',
			kind: 'external',
			layer: 'external',
			summary:
				'The business’s own system, at a web address it gave Stockroom, which wants to hear about low stock and transfers.',
			why: 'A shop may reorder automatically, or tell its staff. Stockroom tells it when something happens.',
			onFailure:
				'Alerts can’t be delivered. They’re tried again for about 20 minutes, then marked failed. Nothing in the shops is held up.',
			scaling: 'It belongs to the business, so we can’t make it bigger.',
			capacityPerInstance: 20,
			instances: 1,
			latencyMs: 300,
		},
	],
	journeys: [
		{
			id: 'browse',
			name: 'Find what’s running low',
			description:
				'A shop owner lists the products that need reordering. The list comes straight from an index, so it’s fast even with 100,000 products.',
			rps: 20,
			person: 'Priya',
			scenario: 'busy',
			story: 'Priya runs Green Basket, three grocery stores in Kochi. On Monday morning she checks what needs reordering.',
			hops: [
				{
					from: 'web-app',
					to: 'api',
					label: 'Ask for low-stock products',
					example: {
						says: 'Priya’s browser asks for the first page of products at or below their reorder point.',
						data: { filter: 'low stock', page: '1' },
					},
				},
				{
					from: 'api',
					to: 'postgres',
					label: 'Check who’s signed in',
					example: {
						says: 'The API looks up Priya’s session. If she had signed out, it would be gone.',
						data: { user: 'Priya', business: 'Green Basket', role: 'owner' },
					},
				},
				{
					from: 'api',
					to: 'products',
					label: 'List the low-stock products',
					example: {
						says: 'The products module builds the list for Priya’s business only.',
						data: { business: 'Green Basket', filter: 'low stock' },
					},
				},
				{
					from: 'products',
					to: 'postgres',
					label: 'Read one page, by index',
					example: {
						says: 'An index finds the low-stock products at once, instead of adding up the stock of every product. It used to take 1.6 seconds; now it takes 6 milliseconds.',
						data: { answer: '25 products, 3 more pages' },
					},
				},
			],
		},
		{
			id: 'sell',
			name: 'Record a sale',
			description:
				'A cashier records a sale. The count and its history are saved together, and the database won’t let stock go below zero. If the product runs low, the shop’s system is told.',
			rps: 5,
			person: 'Sameer',
			scenario: 'webhook-down',
			story: 'Sameer, at the MG Road store, sells the last two jars of honey. At the same moment, the store’s other till tries to sell honey too.',
			hops: [
				{
					from: 'web-app',
					to: 'api',
					label: 'Sell 2 jars of honey',
					example: {
						says: 'Sameer’s screen sends the sale with a unique key, so if the network drops and it’s sent again, it still counts once.',
						data: {
							product: 'HNY-500',
							store: 'MG Road',
							change: '−2',
							key: '7f3c-9a1e',
						},
					},
				},
				{
					from: 'api',
					to: 'postgres',
					label: 'Check the key and the session',
					example: {
						says: 'The key hasn’t been used before, so this is a new sale, not a retry.',
						data: { key: '7f3c-9a1e', answer: 'new' },
					},
				},
				{
					from: 'api',
					to: 'stock',
					label: 'Take 2 out of the store',
					example: {
						says: 'The stock module makes the change. It never reads the count first and writes it later, so two sales can’t both see “2 left”.',
						data: { product: 'HNY-500', store: 'MG Road', change: '−2' },
					},
				},
				{
					from: 'stock',
					to: 'postgres',
					label: 'Change the count and the history together',
					example: {
						says: 'In one transaction: the count goes from 2 to 0, the sale is added to the history, and a low-stock alert is saved in the outbox. The other till’s sale waits, then is refused, because the count can’t go below zero.',
						data: { 'count after': '0', history: '+1 row', outbox: 'stock.low' },
					},
				},
				{
					from: 'stock',
					to: 'outbox-relay',
					label: 'Wake the relay',
					example: {
						says: 'Only when an alert was saved: the relay is nudged to send it now, rather than at its next sweep.',
						data: { event: 'stock.low', product: 'HNY-500' },
					},
					mode: 'async',
					// most sales don't take a product down to its reorder point
					share: 0.1,
				},
				{
					from: 'outbox-relay',
					to: 'postgres',
					label: 'Collect the new events',
					example: {
						says: 'The relay takes a batch of unsent events, locked so that another relay can’t take the same ones.',
						data: { events: '1', answer: 'stock.low for HNY-500' },
					},
					mode: 'async',
				},
				{
					from: 'outbox-relay',
					to: 'redis',
					label: 'Queue the delivery',
					example: {
						says: 'One delivery is queued for each business system that asked to hear about low stock.',
						data: { deliveries: '1' },
					},
					mode: 'async',
				},
				{
					from: 'redis',
					to: 'webhook-sender',
					label: 'Hand out the delivery',
					example: {
						says: 'The webhook sender takes the delivery from the queue.',
						data: { event: 'stock.low' },
					},
					mode: 'async',
				},
				{
					from: 'webhook-sender',
					to: 'webhook-endpoint',
					label: 'Send the signed alert',
					example: {
						says: 'The alert is sent with a signature, so the business can check it really came from Stockroom.',
						data: { event: 'stock.low', product: 'HNY-500', answer: '200 OK' },
					},
					mode: 'async',
					// 8 tries in all, spread over about 20 minutes
					retries: 7,
				},
			],
		},
		{
			id: 'import',
			name: 'Import a spreadsheet',
			description:
				'A shop owner uploads a spreadsheet of products and stock counts. It’s saved and queued straight away, then applied in the background, 1,000 rows at a time.',
			rps: 0.02,
			person: 'Priya',
			scenario: 'worker-killed',
			story: 'Priya has counted every shelf in all three stores. She uploads the spreadsheet: 10,000 rows.',
			hops: [
				{
					from: 'web-app',
					to: 'api',
					label: 'Upload 10,000 rows',
					example: {
						says: 'Priya’s browser sends the whole file.',
						data: { file: 'stock-count-june.xlsx', rows: '10,000' },
					},
				},
				{
					from: 'api',
					to: 'imports',
					label: 'Take in the file',
					example: {
						says: 'The imports module checks it’s not the same file already running. A double-click gets the same import, not a second one.',
						data: { file: 'stock-count-june.xlsx', answer: 'new import' },
					},
				},
				{
					from: 'imports',
					to: 'postgres',
					label: 'Save the file and the import together',
					example: {
						says: 'The file is saved in the database, so nothing depends on Redis to keep it.',
						data: { import: 'IMP-0118', status: 'queued' },
					},
				},
				{
					from: 'imports',
					to: 'redis',
					label: 'Queue the import',
					example: {
						says: 'A job is queued for a worker. If Redis doesn’t answer within 3 seconds, Priya gets her answer anyway, and a sweep queues the job once Redis is back. Normally, the whole upload is answered in about a quarter of a second.',
						data: { job: 'IMP-0118' },
					},
					optional: true,
				},
				{
					from: 'redis',
					to: 'import-worker',
					label: 'Hand out the job',
					example: {
						says: 'The import worker takes the job, and claims it so that no other worker runs it too.',
						data: { import: 'IMP-0118' },
					},
					mode: 'async',
				},
				{
					from: 'import-worker',
					to: 'postgres',
					label: 'Apply 1,000 rows and the checkpoint',
					example: {
						says: 'Each chunk of rows and the checkpoint saying how far it got are saved together. Bad rows are skipped and reported, not fatal.',
						data: { rows: '4,001 to 5,000', checkpoint: '5,000', skipped: '2' },
					},
					mode: 'async',
					calls: 10,
				},
				{
					from: 'import-worker',
					to: 'redis',
					label: 'Publish progress',
					example: {
						says: 'After each chunk, the worker publishes how far it’s got.',
						data: { done: '5,000 of 10,000' },
					},
					mode: 'async',
					calls: 10,
				},
				{
					from: 'redis',
					to: 'imports',
					label: 'Stream it to the browser',
					example: {
						says: 'The imports module passes the progress on to Priya’s open page, and the bar moves.',
						data: { done: '50%' },
					},
					mode: 'async',
					calls: 10,
				},
			],
		},
		{
			id: 'receive',
			name: 'Receive a transfer',
			description:
				'A store receives stock sent from another store. What arrived is added, anything missing is noted, and pressing Receive twice adds the stock only once.',
			rps: 1,
			person: 'Sameer',
			scenario: 'redis-down',
			story: 'A van brings 20 jars of honey from the Fort Kochi store to MG Road. Sameer counts them: 18 arrived.',
			hops: [
				{
					from: 'web-app',
					to: 'api',
					label: 'Receive TR-0042',
					example: {
						says: 'Sameer records what arrived. He presses Receive twice by mistake.',
						data: { transfer: 'TR-0042', sent: '20', arrived: '18' },
					},
				},
				{
					from: 'api',
					to: 'transfers',
					label: 'Mark it received, once',
					example: {
						says: 'The transfer only changes from “in transit” to “received” if it’s still in transit. The second press finds it already received, and changes nothing.',
						data: {
							transfer: 'TR-0042',
							answer: 'received (second press: already received)',
						},
					},
				},
				{
					from: 'transfers',
					to: 'postgres',
					label: 'Add what arrived, and the event, together',
					example: {
						says: 'In one transaction: 18 jars are added at MG Road, 2 are recorded as missing, and a “transfer received” event goes in the outbox.',
						data: { added: '18', missing: '2', outbox: 'transfer.received' },
					},
				},
				{
					from: 'transfers',
					to: 'outbox-relay',
					label: 'Wake the relay',
					example: {
						says: 'The relay is nudged to send the event on now.',
						data: { event: 'transfer.received' },
					},
					mode: 'async',
				},
				{
					from: 'outbox-relay',
					to: 'postgres',
					label: 'Collect the new events',
					example: {
						says: 'The relay takes the new event from the outbox.',
						data: { events: '1' },
					},
					mode: 'async',
				},
				{
					from: 'outbox-relay',
					to: 'redis',
					label: 'Queue the delivery',
					example: {
						says: 'A delivery is queued for the business’s system.',
						data: { deliveries: '1' },
					},
					mode: 'async',
				},
			],
		},
	],
	presets: [
		{
			id: 'normal',
			name: 'A normal day',
			description: 'An ordinary day, with a few shops using Stockroom.',
			traffic: 1,
		},
		{
			id: 'busy',
			name: 'Busy Saturday',
			description:
				'Every store is busy all day: five times the usual sales and lookups. Stockroom’s demo runs on one small, free server.',
			traffic: 5,
		},
		{
			id: 'webhook-down',
			name: 'Shop’s system down',
			description:
				'A normal day, but the business’s own system, which hears about low stock, is down.',
			traffic: 1,
			down: ['webhook-endpoint'],
		},
		{
			id: 'worker-killed',
			name: 'Import worker crashes',
			description:
				'The import worker is killed in the middle of a file, the way a crash or running out of memory would.',
			traffic: 1,
			down: ['import-worker'],
		},
		{
			id: 'redis-down',
			name: 'Redis down',
			description: 'A normal day, but Redis, which carries the job queues, is down.',
			traffic: 1,
			down: ['redis'],
		},
	],
};
