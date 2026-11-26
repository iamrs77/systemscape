import type { SystemInput } from '@/model/schema';
import { pickCopies, type TrackModule } from './shared';

/**
 * The basics: the ideas every system here is built from, taught on a small
 * shop app made up for the purpose. It grows track by track: each lesson
 * shows only the parts it's about, and runs the conditions that make its
 * point visible.
 *
 * The parts and journeys here are shared by the tracks; each track adds
 * the ones only its own lessons use.
 */
export function basicsSystem(modules: TrackModule[]): SystemInput {
	/** The designs the lessons compare are off on an ordinary day: Explore freely starts on the first. */
	const forLessons = Object.fromEntries(
		[
			'order-wait',
			'look-lb',
			'cart',
			'look-cache',
			'photos',
			'photos-cdn',
			'look-replica',
			'order-save',
			'order-split',
			'order-page',
			'order-page-docs',
			'find-scan',
			'find-index',
			'van-save',
			'van-see-db',
			'van-log',
			'van-see',
			'buy',
			'flash-buy',
			'upload-server',
			'upload-direct',
			'order-sync',
			'order-promoted',
			'order-hot',
			'search-shards',
			'order-split3',
			'order-ids',
			'price-later',
			'price-wait',
			'look-pick',
			'look-office',
			'look-path',
			'see-photo',
			'order-rest',
			'order-graphql',
			'order-direct',
			'order-event',
			'parcel-poll',
			'parcel-connect',
			'parcel-push',
			'pay-poll',
			'pay-webhook',
			'pay-card',
			'look-recs',
			'look-recs-opt',
			'look-gw',
			'scrape',
			'scrape-limited',
			...modules.flatMap((m) => (m.journeys ?? []).map((j) => j.id)),
		].map((id) => [id, 0]),
	);

	return {
		id: 'basics',
		name: 'The fundamentals',
		tagline:
			'The ideas every system is built from, on a small shop app: requests, latency, throughput and more.',
		basis: 'example',
		description: [
			'A small online shop: you look at products and place orders on your phone, and a web server answers, using a database. It’s made up to teach the ideas every other system here is built from, one at a time.',
			'Each lesson shows only the parts it’s about, and changes one thing at a time, so you can see exactly what it does.',
		],
		components: [
			...modules.flatMap((m) => m.parts ?? []),
			{
				id: 'app',
				name: 'Shop app',
				kind: 'client',
				layer: 'clients',
				summary:
					'The app on your phone. It shows products and takes orders, and asks the server for everything.',
				why: 'It’s how people shop.',
				onFailure:
					'This app stands for the shoppers, so the simulation doesn’t make it fail.',
				scaling: 'It runs on each shopper’s own phone, so there’s nothing to grow.',
			},
			{
				id: 'lb',
				name: 'Load balancer',
				kind: 'balancer',
				layer: 'balancing',
				summary:
					'Stands in front of the web servers. The app only knows its address, and it passes each request on to one of the copies.',
				why: 'With several copies of a server, something has to share the requests between them, and skip any that are broken.',
				onFailure:
					'Nothing gets through to the servers, so it’s run as a pair: one takes over if the other breaks.',
				scaling:
					'It does very little with each request, so one can pass on many thousands a second.',
				capacityPerInstance: 10_000,
				instances: 1,
				latencyMs: 1,
			},
			{
				id: 'cdn',
				name: 'CDN',
				kind: 'cdn',
				layer: 'edge',
				summary:
					'Servers in cities all over the world, each keeping copies of the photos, so every shopper downloads them from one nearby.',
				why: 'Photos are the same for everyone. Sending them from one far-away place is slow, and too much for one store on a sale day.',
				onFailure:
					'Every photo comes from file storage instead: slower, and too much for it on a busy day.',
				scaling:
					'It belongs to a CDN company, with servers all over the world. It grows by itself.',
				capacityPerInstance: 20_000,
				instances: 1,
				latencyMs: 15,
				hitRate: 0.95,
			},
			{
				id: 'server',
				name: 'Web server',
				kind: 'service',
				layer: 'services',
				summary:
					'Builds the pages and takes the orders. One copy can answer about 100 requests a second.',
				why: 'Something has to do the work for every tap: look things up, check them, save them.',
				onFailure: 'Nobody can shop until it’s back.',
				scaling:
					'You can run more copies of it, or a bigger one. Autoscaling can add copies when it gets busy.',
				capacityPerInstance: 100,
				instances: 1,
				maxInstances: 10,
				latencyMs: 10,
			},
			...[1, 2, 3].map((n) => ({
				id: `web-${n}`,
				name: `Web server ${n}`,
				kind: 'service' as const,
				layer: 'services' as const,
				summary: `Copy ${n} of the web server, on its own computer. It can answer about 100 requests a second, if it’s as big as the others.`,
				why: 'Three copies share the work, and the shop keeps working when one breaks. The load balancer decides which copy gets each request.',
				onFailure:
					'With health checks, the load balancer stops sending it requests, and the other copies take them. Without, its share of requests fail.',
				scaling: 'Add another copy, and register it with the load balancer.',
				capacityPerInstance: 100,
				instances: 1,
				latencyMs: 10,
			})),
			{
				id: 'images',
				name: 'Image servers',
				kind: 'service',
				layer: 'services',
				summary:
					'Send the product photos. They sit behind the same load balancer as the web servers, which sends them every address starting /images/.',
				why: 'Photos are big but simple to send, so they get servers of their own, sized for that, and a busy moment for one doesn’t slow the other.',
				onFailure: 'Pages load, but without their photos.',
				scaling: 'Run more copies; they keep nothing between requests.',
				capacityPerInstance: 1_000,
				instances: 1,
				latencyMs: 5,
			},
			{
				id: 'queue',
				name: 'Queue',
				kind: 'queue',
				layer: 'async',
				summary:
					'A list of jobs waiting their turn, like emails to send. Work is added at one end and taken from the other.',
				why: 'It lets the server hand over slow work and answer straight away.',
				onFailure: 'Jobs can’t be handed over, so the work that uses it stops.',
				scaling: 'It only holds the list, so it rarely needs to grow.',
				capacityPerInstance: 1_000,
				instances: 1,
				latencyMs: 2,
			},
			{
				id: 'worker',
				name: 'Email worker',
				kind: 'worker',
				layer: 'async',
				summary: 'Takes jobs from the queue, one after another, and sends the emails.',
				why: 'Slow work happens here, where nobody is waiting for it.',
				onFailure: 'Emails wait in the queue until it’s back. Shopping carries on.',
				scaling: 'Add more workers when the queue gets long.',
				capacityPerInstance: 50,
				instances: 1,
				maxInstances: 5,
				latencyMs: 5,
			},
			{
				id: 'db',
				name: 'Database',
				kind: 'database',
				layer: 'data',
				summary:
					'Keeps the products and the orders safe. One can answer about 150 requests a second.',
				why: 'The facts have to be kept somewhere safe, that every copy of the server can reach.',
				onFailure: 'Pages can’t be built and orders can’t be saved.',
				scaling:
					'A bigger machine, read-only copies, or splitting the data. The Scaling track covers all three.',
				capacityPerInstance: 150,
				instances: 1,
				latencyMs: 15,
			},
			{
				id: 'carts',
				name: 'Cart store',
				kind: 'database',
				layer: 'data',
				summary:
					'A small, very fast store, kept in memory, like Redis. It holds every shopper’s cart, so any copy of the web server can read it.',
				why: 'The web servers keep nothing between requests. What they’d otherwise remember, like carts, has to live somewhere they can all reach.',
				onFailure: 'Nobody can add to a cart, or see what’s in it.',
				scaling: 'It’s run with copies of its own, so one breaking doesn’t lose any carts.',
				capacityPerInstance: 5_000,
				instances: 1,
				latencyMs: 2,
			},
			{
				id: 'cache',
				name: 'Cache',
				kind: 'cache',
				layer: 'data',
				summary:
					'Keeps recent answers from the database in memory, like each product’s details. 9 questions in 10 are answered here, in about a millisecond.',
				why: 'Most shoppers look at the same few popular products, and their details rarely change. There’s no need to ask the database every time.',
				onFailure:
					'Every request goes to the database instead. On a busy day, that’s far more than it can answer.',
				scaling: 'Add memory, or more copies, each keeping some of the answers.',
				capacityPerInstance: 5_000,
				instances: 1,
				latencyMs: 1,
				hitRate: 0.9,
			},
			{
				id: 'replica',
				name: 'Database copy',
				kind: 'database',
				layer: 'data',
				summary:
					'A copy of the database that answers reads. Every change saved in the main database reaches it a moment later.',
				why: 'Most requests only read. Copies can share the reading, while the main database takes the writes.',
				onFailure: 'Reads go to the other copies, or to the main database.',
				scaling: 'Add more copies for more reads. They don’t help with writes.',
				capacityPerInstance: 150,
				instances: 1,
				latencyMs: 15,
			},
			{
				id: 'shard-1',
				name: 'Shard 1',
				kind: 'database',
				layer: 'data',
				summary: 'One half of the orders: those of shoppers with odd numbers.',
				why: 'One database can’t save every order on a big sale. Split in two, each saves half.',
				onFailure: 'Half the shoppers can’t place orders. The other half aren’t affected.',
				scaling: 'Split the data again, into more shards.',
				capacityPerInstance: 150,
				instances: 1,
				latencyMs: 15,
			},
			{
				id: 'shard-2',
				name: 'Shard 2',
				kind: 'database',
				layer: 'data',
				summary: 'The other half of the orders: those of shoppers with even numbers.',
				why: 'One database can’t save every order on a big sale. Split in two, each saves half.',
				onFailure: 'Half the shoppers can’t place orders. The other half aren’t affected.',
				scaling: 'Split the data again, into more shards.',
				capacityPerInstance: 150,
				instances: 1,
				latencyMs: 15,
			},
			{
				id: 'files',
				name: 'File storage',
				kind: 'storage',
				layer: 'data',
				summary:
					'Keeps the product photos, in one city. The farther away a shopper is, the longer each photo takes to arrive.',
				why: 'Photos are big files, better kept apart from the database.',
				onFailure: 'Product pages show without their photos.',
				scaling:
					'It can store any number of photos, but it can only send so many a second.',
				capacityPerInstance: 1_000,
				instances: 1,
				latencyMs: 180,
			},
			{
				id: 'vans',
				name: 'Delivery app',
				kind: 'client',
				layer: 'clients',
				summary:
					'The app in each delivery van. Every few seconds it sends where the van is, so shoppers can see their parcel coming.',
				why: 'Shoppers like to see where their parcel is.',
				onFailure: 'This app stands for the vans, so the simulation doesn’t make it fail.',
				scaling: 'It runs on each driver’s phone, so there’s nothing to grow.',
			},
			{
				id: 'ids',
				name: 'ID service',
				kind: 'service',
				layer: 'services',
				summary:
					'Hands out order numbers, one after another, so no two orders ever get the same one.',
				why: 'With the orders split over several databases, no one of them sees every order to count them.',
				onFailure: 'No order can get a number, so nobody can place one.',
				scaling:
					'It’s one counter, so it can’t simply run copies: two copies would hand out the same numbers.',
				capacityPerInstance: 500,
				instances: 1,
				latencyMs: 3,
			},
			{
				id: 'photo-worker',
				name: 'Photo worker',
				kind: 'worker',
				layer: 'async',
				summary:
					'Takes each new photo and makes smaller sizes of it, for lists and for phones.',
				why: 'Resizing is slow work that nobody needs to wait for.',
				onFailure: 'New photos show at full size until it catches up. Nothing is lost.',
				scaling: 'Add more workers when photos wait too long.',
				capacityPerInstance: 20,
				instances: 1,
				maxInstances: 5,
				latencyMs: 300,
			},
			{
				id: 'docs',
				name: 'Document database',
				kind: 'database',
				layer: 'data',
				summary:
					'Keeps each order as one document, with everything about it inside. Built to spread over many machines, like MongoDB or DynamoDB.',
				why: 'An order page needs the whole order, every time. Here, that’s one read.',
				onFailure: 'Orders can’t be read or saved.',
				scaling:
					'It shares the documents out between its machines by itself: add machines for more room.',
				capacityPerInstance: 150,
				instances: 3,
				latencyMs: 10,
			},
			{
				id: 'logdb',
				name: 'Write-first database',
				kind: 'database',
				layer: 'data',
				summary:
					'Adds each change to the end of a log, which is quick, and sorts it into files later, in the background. Built for writing, like Cassandra.',
				why: 'The vans send far more locations than anyone reads.',
				onFailure: 'Van locations can’t be saved or shown.',
				scaling:
					'It’s usually spread over many machines, each taking a share of the writes.',
				capacityPerInstance: 150,
				instances: 1,
				latencyMs: 15,
			},
			{
				id: 'row',
				name: 'Kettle stock row',
				kind: 'database',
				layer: 'data',
				summary:
					'The one row in the database that counts how many sale kettles are left. Each order locks it for a moment while it takes one.',
				why: 'Every order for the kettle changes the same count, one at a time, so the count is never wrong.',
				onFailure: 'Nobody can buy the kettle.',
				scaling:
					'Split the count into several rows, each with some of the kettles, so orders can take from different rows at once.',
				capacityPerInstance: 100,
				instances: 1,
				latencyMs: 10,
			},
			{
				id: 'shard-3',
				name: 'Shard 3',
				kind: 'database',
				layer: 'data',
				summary: 'A third shard, added when two weren’t enough.',
				why: 'More orders than two shards can save.',
				onFailure:
					'A third of the shoppers can’t place orders. The others aren’t affected.',
				scaling: 'Split the data again, into more shards.',
				capacityPerInstance: 150,
				instances: 1,
				latencyMs: 15,
			},
			{
				id: 'far',
				name: 'Copy in Delhi',
				kind: 'database',
				layer: 'data',
				summary:
					'A copy of the database in another city, so shoppers in the north read from somewhere near. Every change made in Mumbai is copied here.',
				why: 'Shoppers far from Mumbai get faster pages, and the shop keeps its data if Mumbai’s data centre goes down.',
				onFailure:
					'Changes can’t be copied to Delhi. Depending on the design, Mumbai refuses changes, or Delhi falls behind.',
				scaling: 'A copy in each region, each with copies of its own.',
				capacityPerInstance: 500,
				instances: 1,
				latencyMs: 35,
			},
			{
				id: 'live',
				name: 'Live updates server',
				kind: 'gateway',
				layer: 'edge',
				summary:
					'Keeps a connection open to every app that’s watching, and pushes each update down the right one as soon as it happens.',
				why: 'So apps hear about a change the moment it happens, without asking again and again.',
				onFailure:
					'Apps stop getting updates. They reconnect to another copy, or fall back to asking every few seconds.',
				scaling:
					'Each copy holds tens of thousands of open connections. Add copies for more watchers.',
				capacityPerInstance: 2_000,
				instances: 1,
				latencyMs: 5,
			},
			{
				id: 'delivery',
				name: 'Delivery service',
				kind: 'service',
				layer: 'services',
				summary: 'Knows where every parcel is, and when it should arrive.',
				why: 'Deliveries are their own job, run by their own team, so they’re their own service.',
				onFailure: 'Orders show without their delivery status.',
				scaling: 'Run more copies; it keeps nothing between requests.',
				capacityPerInstance: 300,
				instances: 1,
				latencyMs: 10,
			},
			{
				id: 'stock-svc',
				name: 'Stock service',
				kind: 'service',
				layer: 'services',
				summary: 'Keeps the stock levels, and reorders products that run low.',
				why: 'Every sale changes the stock, so it needs to hear about every order.',
				onFailure: 'Stock levels stop updating until it’s back.',
				scaling: 'Run more copies.',
				capacityPerInstance: 200,
				instances: 1,
				latencyMs: 8,
			},
			{
				id: 'reports',
				name: 'Reports service',
				kind: 'service',
				layer: 'services',
				summary: 'Counts every sale, for the shop’s daily sales reports.',
				why: 'The shop wants to know what sells, and when.',
				onFailure: 'The reports fall behind until it’s back.',
				scaling: 'Run more copies.',
				capacityPerInstance: 200,
				instances: 1,
				latencyMs: 20,
			},
			{
				id: 'events',
				name: 'Event stream',
				kind: 'stream',
				layer: 'async',
				summary:
					'A log of everything that happens, like “order placed”. Every part that cares reads it, each at its own pace. Like Kafka.',
				why: 'The server says what happened once, and doesn’t need to know who listens.',
				onFailure:
					'Nothing new can be published, so the parts that listen stop hearing about orders.',
				scaling:
					'It’s split into partitions spread over machines, so it can take millions of events a second.',
				capacityPerInstance: 5_000,
				instances: 1,
				latencyMs: 2,
			},
			{
				id: 'payments',
				name: 'Payment provider',
				kind: 'external',
				layer: 'external',
				summary:
					'Another company that takes card payments for the shop, like Razorpay or Stripe.',
				why: 'Taking card payments safely is a whole business of its own.',
				onFailure: 'Nobody can pay by card until it’s back.',
				scaling: 'It belongs to another company, so we can’t make it bigger.',
				capacityPerInstance: 100,
				instances: 1,
				latencyMs: 40,
			},
			{
				id: 'bot',
				name: 'Scraper bot',
				kind: 'client',
				layer: 'clients',
				summary:
					'Someone else’s program that copies every product and price from the shop, as fast as it can.',
				why: 'Competitors watch prices, and some programs are just badly written.',
				onFailure: 'It stands for the bot, so the simulation doesn’t make it fail.',
				scaling: 'It runs on someone else’s computers.',
			},
			{
				id: 'gateway',
				name: 'API gateway',
				kind: 'gateway',
				layer: 'edge',
				summary:
					'Checks every request before it reaches the servers: who’s asking, and whether they’ve asked too often.',
				why: 'One place to limit how often each user can ask, so no one user can swamp the servers.',
				onFailure: 'Nothing gets through to the servers.',
				scaling:
					'Run more copies. The counts it keeps live in a fast shared store, so every copy agrees.',
				capacityPerInstance: 10_000,
				instances: 1,
				latencyMs: 2,
			},
			{
				id: 'recs',
				name: 'Recommendations',
				kind: 'service',
				layer: 'services',
				summary: 'Suggests similar products for each product page.',
				why: 'Suggestions help people find more to buy. But a page is still useful without them.',
				onFailure:
					'Pages show without suggestions, if the design allows it. If not, they fail.',
				scaling: 'Run more copies.',
				capacityPerInstance: 200,
				instances: 1,
				latencyMs: 30,
			},
			{
				id: 'email',
				name: 'Email service',
				kind: 'external',
				layer: 'external',
				summary:
					'Another company’s service that delivers emails. It takes most of a second each time.',
				why: 'Sending email well is a whole business of its own. Shops pay someone else to do it.',
				onFailure: 'Emails can’t be sent until it’s back.',
				scaling: 'It belongs to another company, so we can’t make it bigger.',
				capacityPerInstance: 100,
				instances: 1,
				latencyMs: 600,
			},
		],
		journeys: [
			...modules.flatMap((m) => m.journeys ?? []),
			{
				id: 'look',
				name: 'Look at a product',
				description:
					'Someone opens a product. The server reads it from the database and builds the page.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'server', label: 'Ask for the product page' },
					{ from: 'server', to: 'db', label: 'Read the product' },
				],
			},
			{
				id: 'order',
				name: 'Place an order',
				description:
					'Someone places an order. It’s saved at once, and the receipt email is sent in the background.',
				rps: 10,
				hops: [
					{ from: 'app', to: 'server', label: 'Place the order' },
					{ from: 'server', to: 'db', label: 'Save the order' },
					{
						from: 'server',
						to: 'queue',
						label: 'Leave a note for the email',
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
			{
				id: 'order-wait',
				name: 'Place an order, waiting for the email',
				description:
					'The same order, in a design where you wait while the receipt email is sent.',
				rps: 10,
				hops: [
					{ from: 'app', to: 'server', label: 'Place the order' },
					{ from: 'server', to: 'db', label: 'Save the order' },
					{ from: 'server', to: 'email', label: 'Send the receipt' },
				],
			},
			{
				id: 'look-lb',
				name: 'Look at a product, through a load balancer',
				description:
					'Someone opens a product. The load balancer passes the request to a copy of the web server, which reads the product from the database.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'lb', label: 'Ask for the product page' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Read the product' },
				],
			},
			{
				id: 'look-pick',
				name: 'Look at a product, one of three copies picked',
				description:
					'Someone opens a product. The load balancer picks one of three web servers by its rule, and that copy reads the product from the database.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'lb', label: 'Ask for the product page' },
					...pickCopies([1 / 3, 1 / 3, 1 / 3]),
				],
			},
			{
				id: 'look-office',
				name: 'Look at a product, many from one office',
				description:
					'During a sale, many shoppers come from one company’s office, through one address. Picking a copy by a hash of the address sends them all to the same one.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'lb', label: 'Ask for the product page' },
					...pickCopies([0.6, 0.2, 0.2]),
				],
			},
			{
				id: 'look-path',
				name: 'Look at a product, routed by its address',
				description:
					'Someone opens a product. The load balancer reads the address asked for, /products/77, and sends it to the web servers.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'lb', label: 'GET /products/77' },
					{ from: 'lb', to: 'server', label: '/products/: to the web servers' },
					{ from: 'server', to: 'db', label: 'Read the product' },
				],
			},
			{
				id: 'see-photo',
				name: 'See a product’s photos',
				description:
					'Each product page shows a few photos. The load balancer sends every address starting /images/ to the image servers.',
				rps: 150,
				hops: [
					{ from: 'app', to: 'lb', label: 'GET /images/kettle.jpg' },
					{ from: 'lb', to: 'images', label: '/images/: to the image servers' },
				],
			},
			{
				id: 'cart',
				name: 'Add to cart',
				description:
					'Someone adds a product to their cart. Whichever copy of the web server answers saves the cart in the shared cart store.',
				rps: 20,
				hops: [
					{ from: 'app', to: 'lb', label: 'Add it to my cart' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'carts', label: 'Save the cart' },
				],
			},
			{
				id: 'look-cache',
				name: 'Look at a product, with a cache',
				description:
					'Someone opens a product. The web server asks the cache first, and only goes to the database when the cache doesn’t have it.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'lb', label: 'Ask for the product page' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'cache', label: 'Look in the cache' },
					{
						from: 'cache',
						to: 'db',
						label: 'Not there: read the database',
						onMiss: true,
					},
				],
			},
			{
				id: 'photos',
				name: 'See the photos',
				description:
					'A product page shows four photos, each downloaded from file storage, wherever the shopper is.',
				rps: 50,
				hops: [{ from: 'app', to: 'files', label: 'Download the photos', calls: 4 }],
			},
			{
				id: 'photos-cdn',
				name: 'See the photos, through a CDN',
				description:
					'A product page shows four photos, each downloaded from a CDN server nearby. Only photos it doesn’t have yet come from file storage.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'cdn', label: 'Download the photos', calls: 4 },
					{
						from: 'cdn',
						to: 'files',
						label: 'Not there: fetch it from storage',
						onMiss: true,
						calls: 4,
					},
				],
			},
			{
				id: 'look-replica',
				name: 'Look at a product, from a read copy',
				description:
					'Someone opens a product. The web server reads it from a read copy, not the main database.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'lb', label: 'Ask for the product page' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'replica', label: 'Read the product' },
				],
			},
			{
				id: 'order-save',
				name: 'Save an order',
				description:
					'Someone places an order. It’s saved in the main database, which copies it to the read copies a moment later.',
				rps: 10,
				hops: [
					{ from: 'app', to: 'lb', label: 'Place the order' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Save the order' },
					{
						from: 'db',
						to: 'replica',
						label: 'Copy the change',
						mode: 'async',
						everyCopy: true,
					},
				],
			},
			{
				id: 'order-split',
				name: 'Save an order, split in two',
				description:
					'Someone places an order. It’s saved in one of two shards, picked by the shopper’s number.',
				rps: 10,
				hops: [
					{ from: 'app', to: 'lb', label: 'Place the order' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{
						from: 'server',
						to: 'shard-1',
						label: 'Save it: odd shopper numbers',
						share: 0.5,
					},
					{
						from: 'server',
						to: 'shard-2',
						label: 'Save it: even shopper numbers',
						share: 0.5,
					},
				],
			},
			{
				id: 'order-page',
				name: 'See an order, from tables',
				description:
					'Someone opens an order. The database joins four tables to put it together: the order, its items, their products, and the shopper.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'lb', label: 'Show me my order' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Join four tables' },
				],
			},
			{
				id: 'order-page-docs',
				name: 'See an order, from a document',
				description:
					'Someone opens an order. The whole order is one document, read in one go.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'lb', label: 'Show me my order' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'docs', label: 'Read one document' },
				],
			},
			{
				id: 'find-scan',
				name: 'Find my past orders, without an index',
				description:
					'Someone opens their past orders. With no index, the database reads every order to find theirs.',
				rps: 5,
				hops: [
					{ from: 'app', to: 'lb', label: 'Show my past orders' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Read every order, keep theirs', work: 20 },
				],
			},
			{
				id: 'find-index',
				name: 'Find my past orders, with an index',
				description:
					'Someone opens their past orders. The index lists each shopper’s orders, so the database goes straight to them.',
				rps: 5,
				hops: [
					{ from: 'app', to: 'lb', label: 'Show my past orders' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Look them up in the index' },
				],
			},
			{
				id: 'van-save',
				name: 'Save where a van is',
				description:
					'Every few seconds, each delivery van sends where it is. The database finds the van’s row and changes it in place.',
				rps: 100,
				hops: [
					{ from: 'vans', to: 'lb', label: 'Here’s where I am' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Find the van’s row, change it' },
				],
			},
			{
				id: 'van-see-db',
				name: 'Where’s my parcel?',
				description:
					'A shopper checks where their parcel is. The database goes straight to the van’s row.',
				rps: 20,
				hops: [
					{ from: 'app', to: 'lb', label: 'Where’s my parcel?' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Read the van’s row' },
				],
			},
			{
				id: 'van-log',
				name: 'Save where a van is, in a log',
				description:
					'Every few seconds, each delivery van sends where it is. The database adds it to the end of its log.',
				rps: 100,
				hops: [
					{ from: 'vans', to: 'lb', label: 'Here’s where I am' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{
						from: 'server',
						to: 'logdb',
						label: 'Add it to the end of the log',
						work: 0.2,
					},
				],
			},
			{
				id: 'van-see',
				name: 'Where’s my parcel, from the log?',
				description:
					'A shopper checks where their parcel is. The database looks in its log and its sorted files for the newest location.',
				rps: 20,
				hops: [
					{ from: 'app', to: 'lb', label: 'Where’s my parcel?' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{
						from: 'server',
						to: 'logdb',
						label: 'Look in the log and the files',
						work: 1.5,
					},
				],
			},
			{
				id: 'buy',
				name: 'Buy a kettle',
				description:
					'Someone buys the blue kettle. Saving the order and taking one from stock happen together, in one transaction.',
				rps: 10,
				hops: [
					{ from: 'app', to: 'lb', label: 'Buy the blue kettle' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Save the order, take one from stock' },
				],
			},
			{
				id: 'flash-buy',
				name: 'Buy the sale kettle',
				description:
					'A flash sale on one kettle. Every order takes one from the same stock count, one at a time.',
				rps: 10,
				hops: [
					{ from: 'app', to: 'lb', label: 'Buy the sale kettle' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Save the order' },
					{ from: 'db', to: 'row', label: 'Lock the stock row, take one' },
				],
			},
			{
				id: 'upload-server',
				name: 'Upload a photo, through a server',
				description:
					'A seller uploads a product photo. It travels through a web server, which stays busy until all of it has arrived, then saves it in file storage.',
				rps: 2,
				hops: [
					{ from: 'app', to: 'lb', label: 'Upload a 5 MB photo' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy', work: 30 },
					{ from: 'server', to: 'files', label: 'Save the photo', work: 5 },
				],
			},
			{
				id: 'upload-direct',
				name: 'Upload a photo, straight to storage',
				description:
					'A seller uploads a product photo. The server only hands out a link that allows one upload, and the photo goes straight to file storage. Smaller sizes are made in the background.',
				rps: 2,
				hops: [
					{ from: 'app', to: 'lb', label: 'Ask for an upload link' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{
						from: 'app',
						to: 'files',
						label: 'Upload the photo, straight to storage',
						work: 5,
					},
					{ from: 'files', to: 'queue', label: 'A new photo arrived', mode: 'async' },
					{ from: 'queue', to: 'photo-worker', label: 'Hand out the job', mode: 'async' },
					{
						from: 'photo-worker',
						to: 'files',
						label: 'Save smaller sizes',
						mode: 'async',
					},
				],
			},
			{
				id: 'order-sync',
				name: 'Save an order, waiting for a copy',
				description:
					'Someone places an order. The database waits until a copy has it too, before saying it’s saved.',
				rps: 10,
				hops: [
					{ from: 'app', to: 'lb', label: 'Place the order' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Save the order' },
					{
						from: 'db',
						to: 'replica',
						label: 'Copy the change, and wait',
						everyCopy: true,
					},
				],
			},
			{
				id: 'order-promoted',
				name: 'Save an order, after a failover',
				description:
					'The main database has broken, and one of its copies has taken over. Orders are saved there now.',
				rps: 10,
				hops: [
					{ from: 'app', to: 'lb', label: 'Place the order' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'replica', label: 'Save the order, in the new leader' },
				],
			},
			{
				id: 'order-hot',
				name: 'Save an order, split by seller',
				description:
					'Someone places an order. Orders are split by seller, and one big seller has most of them.',
				rps: 10,
				hops: [
					{ from: 'app', to: 'lb', label: 'Place the order' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{
						from: 'server',
						to: 'shard-1',
						label: 'Save it: the big seller’s shard',
						share: 0.8,
					},
					{
						from: 'server',
						to: 'shard-2',
						label: 'Save it: every other seller',
						share: 0.2,
					},
				],
			},
			{
				id: 'search-shards',
				name: 'Who bought the kettle?',
				description:
					'The shop asks who bought the blue kettle. Orders are split by shopper, so every shard has to be asked.',
				rps: 20,
				hops: [
					{ from: 'app', to: 'lb', label: 'Who bought the blue kettle?' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'shard-1', label: 'Ask shard 1' },
					{ from: 'server', to: 'shard-2', label: 'Ask shard 2' },
				],
			},
			{
				id: 'order-split3',
				name: 'Save an order, split in three',
				description: 'Someone places an order. It’s saved in one of three shards.',
				rps: 10,
				hops: [
					{ from: 'app', to: 'lb', label: 'Place the order' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'shard-1', label: 'Save it in shard 1', share: 1 / 3 },
					{ from: 'server', to: 'shard-2', label: 'Save it in shard 2', share: 1 / 3 },
					{ from: 'server', to: 'shard-3', label: 'Save it in shard 3', share: 1 / 3 },
				],
			},
			{
				id: 'order-ids',
				name: 'Save an order, numbered by an ID service',
				description:
					'Someone places an order. The server asks the ID service for the next number, then saves the order in its shard.',
				rps: 10,
				hops: [
					{ from: 'app', to: 'lb', label: 'Place the order' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'ids', label: 'Ask for the next order number' },
					{
						from: 'server',
						to: 'shard-1',
						label: 'Save it: odd shopper numbers',
						share: 0.5,
					},
					{
						from: 'server',
						to: 'shard-2',
						label: 'Save it: even shopper numbers',
						share: 0.5,
					},
				],
			},
			{
				id: 'price-later',
				name: 'Change a price, copied later',
				description:
					'The shop changes a price in Mumbai. It’s saved at once, and copied to Delhi a moment later.',
				rps: 5,
				hops: [
					{ from: 'app', to: 'lb', label: 'Change the kettle’s price' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Save the new price' },
					{ from: 'db', to: 'far', label: 'Copy it to Delhi', mode: 'async' },
				],
			},
			{
				id: 'price-wait',
				name: 'Change a price, waiting for Delhi',
				description:
					'The shop changes a price in Mumbai. It only counts as saved once Delhi has it too.',
				rps: 5,
				hops: [
					{ from: 'app', to: 'lb', label: 'Change the kettle’s price' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Save the new price' },
					{ from: 'db', to: 'far', label: 'Copy it to Delhi, and wait' },
				],
			},
			{
				id: 'order-rest',
				name: 'See an order, in three REST requests',
				description:
					'Someone opens an order. The app asks for the order, then its items, then its delivery: three requests, one after another, each crossing the mobile network.',
				rps: 20,
				hops: [
					{ from: 'app', to: 'lb', label: 'GET /orders/5521', travelMs: 150 },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Read the order' },
					{ from: 'app', to: 'lb', label: 'GET /orders/5521/items', travelMs: 150 },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Read its items' },
					{ from: 'app', to: 'lb', label: 'GET /deliveries/88', travelMs: 150 },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'delivery', label: 'Where is delivery 88?' },
				],
			},
			{
				id: 'order-graphql',
				name: 'See an order, in one GraphQL request',
				description:
					'Someone opens an order. The app asks for everything the screen shows in one request, and the server gathers it.',
				rps: 20,
				hops: [
					{
						from: 'app',
						to: 'lb',
						label: 'One query: the order, its items, its delivery',
						travelMs: 150,
					},
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Read the order and its items' },
					{ from: 'server', to: 'delivery', label: 'Where is delivery 88? (RPC)' },
				],
			},
			{
				id: 'order-direct',
				name: 'Place an order, telling everyone',
				description:
					'Someone places an order. The server saves it, then calls each part that needs to know, and waits for each.',
				rps: 10,
				hops: [
					{ from: 'app', to: 'lb', label: 'Place the order' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Save the order' },
					{ from: 'server', to: 'stock-svc', label: 'Tell stock: one kettle sold' },
					{ from: 'server', to: 'reports', label: 'Tell reports: one sale' },
				],
			},
			{
				id: 'order-event',
				name: 'Place an order, publishing an event',
				description:
					'Someone places an order. The server saves it and publishes one event, “order placed”. Every part that cares reads it from the event stream, in its own time.',
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
				id: 'parcel-poll',
				name: 'Watch my parcel, asking every 2 seconds',
				description:
					'A thousand shoppers watch their parcel on a map. Each app asks for the van’s location every 2 seconds, whether it has moved or not.',
				rps: 500,
				hops: [
					{ from: 'app', to: 'lb', label: 'Anything new?' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Read the van’s location' },
				],
			},
			{
				id: 'parcel-connect',
				name: 'Open a live connection',
				description:
					'An app watching a parcel opens one connection to the live updates server, and keeps it open.',
				rps: 2,
				hops: [
					{ from: 'app', to: 'lb', label: 'Open a connection, keep it open' },
					{ from: 'lb', to: 'live', label: 'Pass it to a copy' },
				],
			},
			{
				id: 'parcel-push',
				name: 'Watch my parcel, pushed',
				description:
					'Each van sends its location every 10 seconds. The server saves it and passes it on, and the live updates server pushes it to the apps watching that van.',
				rps: 100,
				hops: [
					{ from: 'vans', to: 'lb', label: 'Here’s where I am' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Save the location' },
					{
						from: 'server',
						to: 'live',
						label: 'Pass it on to the watchers',
						mode: 'async',
					},
					{ from: 'live', to: 'app', label: 'Push: your van moved', mode: 'async' },
				],
			},
			{
				id: 'pay-poll',
				name: 'Is it paid yet?',
				description:
					'While a shopper pays, the shop asks the payment provider every couple of seconds whether the payment has gone through.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'lb', label: 'Has my payment gone through?' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'payments', label: 'Is order 5521 paid yet?' },
				],
			},
			{
				id: 'pay-webhook',
				name: 'Paid: a webhook',
				description:
					'When a payment goes through, the payment provider calls the shop’s own address to say so, once.',
				rps: 2,
				hops: [
					{ from: 'payments', to: 'lb', label: 'Order 5521 is paid' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Mark the order paid' },
				],
			},
			{
				id: 'pay-card',
				name: 'Pay by card',
				description:
					'Someone pays for their order. The server asks the payment provider to charge the card, and tries again if a call fails.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'lb', label: 'Pay for the order' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'payments', label: 'Charge ₹1,499', retries: 2 },
				],
			},
			{
				id: 'look-recs',
				name: 'Look at a product, with suggestions',
				description:
					'Someone opens a product. The page shows the product and, below it, similar products. Here, the page needs both.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'lb', label: 'Ask for the product page' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Read the product' },
					{ from: 'server', to: 'recs', label: 'Find similar products' },
				],
			},
			{
				id: 'look-recs-opt',
				name: 'Look at a product, suggestions if they come',
				description:
					'Someone opens a product. The page shows similar products if it can get them, and shows the page without them if not.',
				rps: 50,
				hops: [
					{ from: 'app', to: 'lb', label: 'Ask for the product page' },
					{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
					{ from: 'server', to: 'db', label: 'Read the product' },
					{
						from: 'server',
						to: 'recs',
						label: 'Find similar products, if it can',
						optional: true,
					},
				],
			},
			{
				id: 'look-gw',
				name: 'Look at a product, through an API gateway',
				description:
					'Shoppers open products. Every request passes the API gateway, which checks how often each user is asking.',
				rps: 150,
				hops: [
					{ from: 'app', to: 'lb', label: 'Ask for the product page' },
					{ from: 'lb', to: 'gateway', label: 'Check it' },
					{ from: 'gateway', to: 'server', label: 'Within the limit: pass it on' },
					{ from: 'server', to: 'db', label: 'Read the product' },
				],
			},
			{
				id: 'scrape',
				name: 'A bot copies every product',
				description:
					'A scraper bot asks for product after product, 400 times a second. Nothing limits it.',
				rps: 400,
				hops: [
					{ from: 'bot', to: 'lb', label: 'Next product, please' },
					{ from: 'lb', to: 'gateway', label: 'Check it' },
					{ from: 'gateway', to: 'server', label: 'No limit set: pass it on' },
					{ from: 'server', to: 'db', label: 'Read the product' },
				],
			},
			{
				id: 'scrape-limited',
				name: 'A bot copies every product, limited',
				description:
					'The same bot, but the API gateway lets each user ask 20 times a second. The rest are turned away at once.',
				rps: 400,
				hops: [
					{ from: 'bot', to: 'lb', label: 'Next product, please' },
					{ from: 'lb', to: 'gateway', label: 'Check it' },
					{
						from: 'gateway',
						to: 'server',
						label: 'Within its limit, 20 a second: pass it on',
						share: 0.05,
					},
					{ from: 'server', to: 'db', label: 'Read the product' },
				],
			},
		],
		presets: [
			{
				id: 'normal',
				name: 'Normal day',
				description: 'An ordinary day at the shop.',
				traffic: 1,
				journeyTraffic: forLessons,
			},
			{
				id: 'busy',
				name: 'Busy day',
				description: 'Nearly twice as many shoppers, arriving slowly through the day.',
				traffic: 1.8,
				journeyTraffic: forLessons,
			},
			{
				id: 'rush',
				name: 'Sudden rush',
				description:
					'A sale starts, and three times as many shoppers arrive within minutes.',
				traffic: 3,
				journeyTraffic: forLessons,
				sudden: true,
			},
			{
				id: 'db-down',
				name: 'Database down',
				description: 'An ordinary day, but the database has stopped working.',
				traffic: 1,
				journeyTraffic: forLessons,
				down: ['db'],
			},
			{
				id: 'email-down',
				name: 'Email service down',
				description: 'An ordinary day, but the email service has an outage.',
				traffic: 1,
				journeyTraffic: forLessons,
				down: ['email'],
			},
		],
		// a track still being written, with no lessons yet, isn't listed
		course: modules.map((m) => m.track).filter((t) => t.lessons.length > 0),
	};
}
