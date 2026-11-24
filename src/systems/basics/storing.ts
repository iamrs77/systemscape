import type { Track } from '@/learn/course';
import type { Conditions } from '@/sim/scenario';
import { type TrackModule, roomy } from './shared';

const orderTables: Conditions = { only: ['order-page'], copies: { server: 3 } };
const orderDocs: Conditions = { only: ['order-page-docs'], copies: { server: 3 } };
const saleTables: Conditions = { only: ['order-page'], traffic: 6, copies: { server: 4 } };
const saleDocs: Conditions = { only: ['order-page-docs'], traffic: 6, copies: { server: 4 } };

const viewed: Conditions = { only: ['st-viewed', 'st-viewed-add'], copies: { server: 3 } };
const viewersScan: Conditions = {
	only: ['st-viewers-scan', 'st-viewed-add'],
	copies: { server: 3 },
};
const viewersTable: Conditions = {
	only: ['st-viewers', 'st-viewed-add2'],
	copies: { server: 3 },
};
const alsoBought: Conditions = { only: ['st-also-sql', 'st-also-graph'], copies: { server: 3 } };
const manyStores: Conditions = {
	only: ['order-page', 'cart', 'st-search', 'st-viewed'],
	copies: { server: 3 },
};

const vansInPlace: Conditions = { only: ['van-save', 'van-see-db'], copies: { server: 3 } };
const vansLogged: Conditions = { only: ['van-log', 'van-see'], traffic: 2, copies: { server: 3 } };
const pagesBoth = (traffic: number): Conditions => ({
	only: ['look-lb', 'st-look-lsm'],
	traffic,
	copies: { server: 4 },
});

const buy: Conditions = { only: ['buy'] };
const flash: Conditions = {
	only: ['flash-buy'],
	traffic: 30,
	copies: { server: 4 },
	bigger: { db: 10 },
};
const serializable: Conditions = {
	only: ['st-checkout'],
	traffic: 8,
	copies: { server: 2 },
	flaky: { db: 0.2 },
};

const uploadsThrough: Conditions = {
	only: ['upload-server', 'look-lb'],
	traffic: 3,
	copies: { server: 3 },
	bigger: roomy,
};
const catalogue: Conditions = { only: ['upload-direct'], traffic: 15, copies: { server: 3 } };

const storing: Track = {
	id: 'storing',
	name: 'Storing data',
	tagline:
		'SQL or NoSQL, indexes, storage engines, transactions, isolation, and where photos go: how the shop keeps its data.',
	lessons: [
		{
			id: 'tables-or-documents',
			title: 'SQL or NoSQL',
			summary:
				'Tables with a schema, joined by SQL, or documents read whole: how each keeps an order, what each costs, and which spreads out.',
			steps: [
				{
					title: 'Tables, rows and keys',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'order-page',
					current: [['server', 'db']],
					set: orderTables,
					facts: ['wait'],
					body: [
						'The shop keeps its data in an SQL database, also called a relational database, like PostgreSQL or MySQL. The data lives in tables, like spreadsheets: one for orders, one for the items in each order, one for products, one for shoppers. Each row is one thing, and each column is one fact about it.',
						'Every row has a primary key, a value no other row in its table has, often a number, like order 5521. Rows point at each other by those keys, called foreign keys: order 5521 says “shopper 1042”, rather than copying Riya’s name.',
						'So each fact is kept once, in one place. That’s called normalised data. To show your order, the **Database** puts the four tables back together: a join.',
					],
					example: {
						says: 'One order, spread over four tables.',
						data: {
							orders: '5521 · shopper 1042 · 24 Nov',
							'order items': '5521 · product 77 · ×1',
							products: '77 · Blue kettle · ₹1,499',
							shoppers: '1042 · Riya Sharma',
						},
					},
				},
				{
					title: 'A schema, and the rules it keeps',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'order-page',
					set: orderTables,
					body: [
						'Before any data goes in, each table is declared: its columns, and the type of each, like a number, some text or a date. That’s the schema, and every row must fit it.',
						'The schema can also hold rules, called constraints, and the database refuses anything that breaks them. A product’s price can’t be empty. No two shoppers can share an email address. An order item must point at a product that exists. Stock can’t go below zero.',
						'Changing the schema later, like adding a column for gift wrapping, is a migration: a small script that changes the table’s shape, run once, before the code that needs it.',
					],
					example: {
						says: 'An order item for a product that doesn’t exist.',
						data: {
							'add an item': 'order 5521, product 999, ×1',
							answer: 'refused: there’s no product 999',
						},
					},
				},
				{
					title: 'Asking in SQL',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'order-page',
					current: [['server', 'db']],
					set: orderTables,
					facts: ['wait'],
					body: [
						'You ask an SQL database questions in SQL, a language for saying what you want, not how to find it. The database works out how, using its indexes where it can.',
						'Because each fact is kept once, any question can be asked later, even ones nobody planned for: which products sold best in Pune last month, or which shoppers haven’t ordered for a year.',
						'SQL databases also keep changes safe with transactions: several changes made all together or not at all, kept apart from other people’s, and never lost once saved. Together, those promises are called ACID, and the Transactions lesson takes them letter by letter.',
					],
					example: {
						says: 'Show order 5521: one question, four tables.',
						data: {
							SQL: 'SELECT … FROM orders JOIN order_items … JOIN products … JOIN shoppers … WHERE orders.id = 5521',
							answer: 'Riya Sharma, 24 Nov: Blue kettle ×1, ₹1,499',
						},
					},
				},
				{
					title: 'Documents: NoSQL',
					show: ['app', 'lb', 'server', 'docs'],
					journey: 'order-page-docs',
					current: [['server', 'docs']],
					set: orderDocs,
					facts: ['wait'],
					body: [
						'A **Document database**, like MongoDB, keeps the whole order together, as one document, with its items and the shopper’s name inside. Showing it is one read, with no joining, so it’s quicker here.',
						'There’s usually no schema up front: each document can have its own fields, so a kettle can have a capacity and a T-shirt a size. The app has to cope with whatever shape it finds.',
						'Databases that don’t keep data in SQL’s linked tables, with a schema and joins, are called NoSQL. There are several kinds, and the next lesson goes through them.',
					],
					example: {
						says: 'The same order, as one document.',
						data: {
							order: '5521',
							shopper: 'Riya Sharma (1042)',
							items: 'Blue kettle ×1, ₹1,499',
							placed: '24 Nov',
						},
					},
				},
				{
					title: 'Copies, or links',
					show: ['app', 'lb', 'server', 'docs'],
					journey: 'order-page-docs',
					set: orderDocs,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Putting everything an order needs inside it is called denormalising: copying facts to where they’re read, so reading needs no joins.',
						'The cost comes when a fact changes. Riya’s name is now copied into every one of her 12 orders. When she changes it, all 12 have to change, and until they have, they disagree. In tables, it was one row.',
						'A document can hold a link instead, like “shopper 1042”, but then the app does the join itself, with a second read. So documents suit data that’s read whole, and rarely changes in more than one place.',
					],
					example: {
						says: 'Riya changes her name.',
						data: {
							'in tables': 'change 1 row',
							'in documents': 'change 12 orders, and anything else that copied it',
						},
					},
					note: {
						title: 'Tables get copies too',
						text: 'SQL databases are denormalised on purpose sometimes, when a join is too slow for a busy page: keeping each order’s total in the orders table, say, instead of adding up its items every time. The cost is the same: every copy has to be kept right.',
					},
				},
				{
					title: 'A huge sale, one SQL database',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'order-page',
					set: saleTables,
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'On a huge sale day, 300 orders are opened every second. The tables all live on one machine, and it can answer 150, so half the shoppers get an error.',
						'A bigger machine helps, up to a point. But joins are quickest with every table on the same machine, so most SQL databases are built around one machine that takes the writes.',
					],
				},
				{
					title: 'Built to spread out',
					show: ['app', 'lb', 'server', 'docs'],
					journey: 'order-page-docs',
					set: saleDocs,
					copies: true,
					facts: ['succeed', { busy: 'docs' }, { copies: 'docs' }],
					body: [
						'Most document databases are built to spread over many machines from the start. Each document lives on one of them, picked by its key, like the order number. More machines means more room, and the database shares the documents out by itself. Here, three share the work, each two-thirds busy.',
						'It works because a document needs nothing from the others. A join across machines would be slow, which is why the data is shaped so that reads don’t need one.',
						'Early NoSQL databases also gave up transactions across several items, to spread out more easily. Many have since added them, MongoDB and DynamoDB among them.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'db', 'docs'],
					journey: 'order-page',
					draw: ['order-page-docs'],
					set: { only: ['order-page', 'order-page-docs'], copies: { server: 3 } },
					body: [
						'Choose by how the data is used. Most apps start with one SQL database, which goes further than people expect, and can even keep documents in a column, as PostgreSQL does with JSON. They add NoSQL where something fits it better.',
						'SQL can spread out too: read copies and splitting the data yourself, both in the Scaling track, or a distributed SQL database, like CockroachDB or Google Spanner, which spreads its tables over many machines and keeps transactions working across them.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'SQL, on one machine',
								'Data with many links, like orders, products and stock. Changes that must be all or nothing. Questions nobody has thought of yet. PostgreSQL, MySQL. The usual first choice.',
							],
							[
								'Document database',
								'Things read and written whole, whose shape varies, like a product’s details or a shopper’s settings, at more than one machine can take. MongoDB, DynamoDB.',
							],
							[
								'SQL, spread out',
								'You need tables and transactions, and more than one machine: read copies, sharding, or distributed SQL like CockroachDB or Spanner.',
							],
							[
								'Both',
								'Most big apps: SQL for the orders and the money, and NoSQL beside it for the parts that fit it better.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely on the huge sale, with the document database. Change how many machines it runs, from its details, and watch how busy they get.',
				journey: 'order-page-docs',
				set: saleDocs,
			},
		},
		{
			id: 'nosql-kinds',
			title: 'Kinds of NoSQL',
			summary:
				'Key-value, wide-column, graph, search engines and time-series: how each keeps its data, the questions it answers fast, and the ones it can’t.',
			steps: [
				{
					title: 'Key-value: the simplest',
					show: ['app', 'lb', 'server', 'carts'],
					journey: 'cart',
					current: [['server', 'carts']],
					set: { only: ['cart'], copies: { server: 3 } },
					facts: ['wait'],
					body: [
						'The simplest kind of NoSQL database is a key-value store. It keeps a key, like cart:1042, and a value: whatever is stored under it. You can save a value, get it back or delete it, by its key. That’s all, so it’s very fast.',
						'The **Cart store** is one, like Redis, which keeps everything in memory, and is often used as a cache too. DynamoDB is another, kept on disk and spread over many machines by AWS.',
						'What it can’t do, on its own, is search: “which carts have a kettle in them?” means reading every one. So it suits things always found by one key: carts, sessions, counters, settings.',
					],
					example: {
						says: 'Get a cart by its key.',
						data: { GET: 'cart:1042', answer: 'Blue kettle ×1, Steel toaster ×1' },
					},
					note: {
						title: 'Redis does more',
						text: 'A Redis value can be a list, a set, a counter, or a sorted set, which keeps a leaderboard in order as scores change. Each has its own quick commands.',
					},
				},
				{
					title: 'Wide-column: rows grouped by a key',
					show: ['app', 'lb', 'server', 'st-wide'],
					journey: 'st-viewed',
					draw: ['st-viewed-add'],
					set: viewed,
					copies: true,
					facts: ['wait', { busy: 'st-wide' }, { copies: 'st-wide' }],
					body: [
						'The shop shows each shopper what they looked at recently. Every product view adds a row: 50 a second.',
						'A **Wide-column store**, like Cassandra, keeps rows in groups called partitions. Each partition has a key, here the shopper, and the key decides which machine it lives on. Inside a partition, rows are kept sorted, here newest first. So “Riya’s last 10 views” is one machine, one partition, read from the top.',
						'Writes are quick, and more machines take more of them. ScyllaDB works the same way. Google’s Bigtable, where the idea began, and HBase are wide-column stores too.',
					],
					example: {
						says: 'Riya’s partition, newest first.',
						data: {
							'partition key': 'shopper 1042',
							'20:14': 'Blue kettle',
							'20:12': 'Steel toaster',
							'19:58': 'Glass teapot',
						},
					},
				},
				{
					title: 'A question the keys don’t fit',
					show: ['app', 'lb', 'server', 'st-wide'],
					journey: 'st-viewers-scan',
					draw: ['st-viewed-add'],
					current: [['server', 'st-wide']],
					set: viewersScan,
					facts: ['succeed', { busy: 'st-wide' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A seller asks: who looked at my kettle today? The partitions are by shopper, so the answer could be in any of them, on any machine. The store has to read them all.',
						'Cassandra won’t even run a question like that unless you add ALLOW FILTERING, a warning that it reads everything. Here, just 2 a second swamp the **Wide-column store**, and a third of everything fails, shoppers’ views included.',
					],
				},
				{
					title: 'A table for each question',
					show: ['app', 'lb', 'server', 'st-wide'],
					journey: 'st-viewers',
					draw: ['st-viewed-add2'],
					set: viewersTable,
					facts: ['succeed', { busy: 'st-wide' }],
					body: [
						'The fix is to write each view twice: into Riya’s partition, and into a second table whose partitions are by product. Now the seller’s question is one partition too, and the store is a third busy.',
						'That’s how wide-column stores are designed: list the questions first, make a table for each, and copy the data into every one. Writes are cheap, so the copies cost little. A question nobody planned for is hard, the opposite of SQL.',
					],
					example: {
						says: 'One view, written twice.',
						data: {
							'views by shopper': 'partition 1042: 20:14, Blue kettle',
							'views by product': 'partition Blue kettle: 20:14, shopper 1042',
						},
					},
				},
				{
					title: 'Graph: following links',
					show: ['app', 'lb', 'server', 'db', 'st-graph'],
					journey: 'st-also-graph',
					draw: ['st-also-sql'],
					set: alsoBought,
					facts: [
						{ wait: 'st-also-sql', label: 'Also bought, from tables' },
						{ wait: 'st-also-graph', label: 'Also bought, from a graph' },
						{ busy: 'db' },
					],
					body: [
						'“Shoppers who bought this also bought…” follows links: from the kettle to the people who bought it, then to everything else they bought. In tables, each step along the links is another join over the orders. Here, 10 of these a second keep the **Database** two-thirds busy, and each takes nearly half a second.',
						'A **Graph database**, like Neo4j or Amazon Neptune, keeps things as nodes, and the links between them as edges. Each node keeps its links beside it, so following one is quick however big the data is, and questions many links deep stay cheap.',
						'It suits data that’s mostly links: recommendations, who knows whom, or rings of fake accounts paying each other. For a simple link, like an order’s shopper, tables do fine.',
					],
					example: {
						says: 'The question in Cypher, Neo4j’s language.',
						data: {
							MATCH: '(kettle)<-[:BOUGHT]-(shopper)-[:BOUGHT]->(other)',
							RETURN: 'each other product, counted, most first',
							answer: 'Steel toaster, Glass teapot, Tea strainer',
						},
					},
				},
				{
					title: 'Searching with SQL',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'st-search-sql',
					current: [['server', 'db']],
					set: { only: ['st-search-sql'], copies: { server: 3 } },
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Shoppers type “blue kettle” into the search box. In SQL, the easy way is to look for names containing both words. An ordinary index can’t help with words in the middle of a name, so the database reads every product.',
						'Just 10 searches a second are more than it can do, and a quarter of them fail. Even when it works, it’s a poor search: “kettles” or “ketle” finds nothing, and the best match isn’t first.',
					],
					example: {
						says: 'Searching every product name.',
						data: {
							asks: 'does the name contain “blue” and “kettle”?',
							reads: 'every product, every time',
						},
					},
				},
				{
					title: 'A search engine',
					show: ['app', 'lb', 'server', 'db', 'st-search'],
					journey: 'st-search',
					draw: ['st-search-feed'],
					current: [
						['server', 'st-search'],
						['db', 'st-search'],
					],
					set: { only: ['st-search', 'st-search-feed'], copies: { server: 3 } },
					facts: ['succeed', 'wait', { busy: 'st-search' }],
					body: [
						'A **Search engine**, like Elasticsearch or OpenSearch, keeps an inverted index: every word, and the products it appears in, like the index at the back of a book. “blue kettle” is two quick lookups, and the products in both.',
						'It can also be set up to understand words: “kettles” finds kettle, a typo still finds it, and the best matches come first. And it can count the results by brand or price as it goes, for the filters beside them.',
						'It isn’t where the products are kept. The **Database** is still the one true copy, and each change is copied to the search engine in the background, so it’s a moment behind. If the search engine is lost, it can be built again from the database.',
					],
					example: {
						says: 'The inverted index.',
						data: {
							blue: 'products 12, 77, 301',
							kettle: 'products 77, 78, 301',
							'in both': 'products 77 and 301: the Blue kettle first',
						},
					},
				},
				{
					title: 'Time-series: numbers over time',
					show: ['vans', 'lb', 'server', 'st-tsdb'],
					journey: 'st-van-points',
					current: [['server', 'st-tsdb']],
					set: { only: ['st-van-points'], copies: { server: 3 } },
					facts: ['rate', { busy: 'st-tsdb' }],
					body: [
						'Every few seconds, each of the shop’s delivery vans sends its speed and fuel: 100 readings a second, all day, every day. Each is a time, a name and a number, written once and never changed.',
						'A **Time-series database**, like InfluxDB or TimescaleDB, is built for that. It keeps readings in time order, packed tightly, and answers “average speed per hour, this week” quickly. It can be set to thin out old readings by itself: hourly averages after a month, say, and nothing after a year.',
						'The shop’s own measurements, like how busy each server is, are time-series too. Prometheus, a popular monitoring tool, keeps them this way.',
					],
					example: {
						says: 'Three readings from one van.',
						data: {
							'20:01:00': 'van 12, speed 32 km/h',
							'20:01:05': 'van 12, speed 35 km/h',
							'20:01:10': 'van 12, speed 0 km/h',
						},
					},
				},
				{
					title: 'One shop, several databases',
					show: ['app', 'lb', 'server', 'db', 'carts', 'st-search', 'st-wide'],
					journey: 'order-page',
					draw: ['cart', 'st-search', 'st-viewed'],
					set: manyStores,
					body: [
						'A big shop often uses several at once: SQL for orders and money, a key-value store for carts, a search engine for the search box, a wide-column store for what each shopper viewed. Each does the job it’s best at. That’s called polyglot persistence.',
						'But each one is another thing to run, back up, watch and learn, and the copies between them can disagree for a moment. So start with one database, and add another only when a need is clear.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'db', 'carts', 'st-search', 'st-wide'],
					journey: 'order-page',
					draw: ['cart', 'st-search', 'st-viewed'],
					set: manyStores,
					body: [
						'Each kind is fast at the questions it was shaped for, and slow or unable at the rest. So ask first: what will we read, how often, and by what?',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Key-value',
								'Anything always found by one key: carts, sessions, counters, a cache. Redis, DynamoDB, Memcached.',
							],
							[
								'Document',
								'Things read whole, whose shape varies: products, profiles, settings. MongoDB, DynamoDB.',
							],
							[
								'Wide-column',
								'Huge numbers of writes, read by key, in order: activity, messages, histories. Cassandra, Bigtable, ScyllaDB.',
							],
							[
								'Graph',
								'Questions that follow links many steps deep: recommendations, fraud, who knows whom. Neo4j, Neptune.',
							],
							[
								'Search engine',
								'Searching text, with typos, ranking and filters, fed from the main database. Elasticsearch, OpenSearch.',
							],
							[
								'Time-series',
								'Readings over time: measurements, sensors, prices. InfluxDB, TimescaleDB, Prometheus.',
							],
							[
								'SQL',
								'Everything else, and the one true copy of what matters most. PostgreSQL, MySQL.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the seller’s question reading every partition. Add machines to the wide-column store, from its details, and see how many it takes to keep up.',
				journey: 'st-viewers-scan',
				set: viewersScan,
			},
		},
		{
			id: 'indexes',
			title: 'Indexes',
			summary:
				'How a database finds rows without reading them all: B-trees, indexes on two columns, covering indexes, what each index costs, and how to check one is used.',
			steps: [
				{
					title: 'Reading every order',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'find-scan',
					current: [['server', 'db']],
					set: { only: ['find-scan'] },
					facts: ['wait', { busy: 'db' }],
					body: [
						'You open your past orders. The database holds every order from every shopper, in the order they were placed. To find yours, it reads them all, and keeps the ones that are yours. That’s a full table scan.',
						'It’s slow, and it keeps the database busy: just 5 of these searches a second take two-thirds of its time.',
					],
					example: {
						says: 'Is order 1 shopper 1042’s? Order 2? Order 3? … all the way to the last one.',
						data: { read: 'every order in the shop', kept: '12 orders' },
					},
				},
				{
					title: 'An index',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'find-index',
					current: [['server', 'db']],
					set: { only: ['find-index'] },
					facts: ['wait', { busy: 'db' }],
					body: [
						'An index is a sorted list kept beside the table: each shopper number, and where that shopper’s orders are. The database finds you in the list, and goes straight to your orders.',
						'It’s like the index at the back of a book: you don’t read every page to find one word. The wait drops from most of a second to almost nothing, and the database is barely busy.',
					],
					example: {
						says: 'Making the index, once.',
						data: {
							SQL: 'CREATE INDEX orders_shopper ON orders (shopper_id)',
							'then shopper 1042': 'orders 88, 412, 5521 …',
						},
					},
				},
				{
					title: 'A busy evening, without one',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'find-scan',
					set: { only: ['find-scan'], traffic: 2 },
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'On a busy evening, twice as many people check their orders: still only 10 a second. Without the index, that’s more reading than the database can do, and a quarter of the searches fail.',
					],
				},
				{
					title: 'The same evening, with one',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'find-index',
					set: { only: ['find-index'], traffic: 2 },
					facts: ['succeed', { busy: 'db' }, 'wait'],
					body: [
						'With the index, the same searches hardly make the database busy at all: 7%, where reading every order needed more than it had.',
					],
				},
				{
					title: 'How a B-tree finds a row',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'find-index',
					current: [['server', 'db']],
					set: { only: ['find-index'] },
					body: [
						'Most indexes are B-trees. The sorted list is cut into pages of a few kilobytes, kept as a tree. The top page says which page below holds each range of shoppers, that page says which page below it, and so on down to the bottom, where each shopper points to their rows.',
						'Each page points to hundreds below it, so three or four steps find anyone among millions. A table ten times bigger needs at most one more step.',
						'And because it’s sorted, an index on the date finds ranges too, like every order from 1 to 24 November, and hands them back already in order.',
					],
					example: {
						says: 'Finding shopper 1042, in three steps.',
						data: {
							'top page': 'shoppers 1 to 40,000: go to page 7',
							'page 7': 'shoppers 1,001 to 1,100: go to page 352',
							'page 352': 'shopper 1042: orders 88, 412, 5521 …',
						},
					},
				},
				{
					title: 'An index on two columns',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'find-index',
					set: { only: ['find-index'] },
					body: [
						'Your orders page shows the newest first. An index on two columns, shopper then date, is sorted by shopper, and within each shopper by date, so your newest orders are right there, in order. That’s a composite index.',
						'The order of the columns matters. It’s like a phone book, sorted by surname, then first name. It finds shopper 1042, or shopper 1042 since 1 November. But it’s little help with every order placed on 24 November, just as a phone book can’t find everyone called Riya without reading most of it.',
						'So the columns every question names go first: the leftmost columns. And one index on shopper and date also does the job of an index on shopper alone.',
					],
					example: {
						says: 'One index, three questions.',
						data: {
							'index on': 'shopper, then date',
							'shopper 1042': 'goes straight there',
							'shopper 1042, since 1 Nov': 'goes straight there',
							'every order on 24 Nov': 'little help: reads most of it',
						},
					},
				},
				{
					title: 'Answering from the index alone',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'find-index',
					set: { only: ['find-index'] },
					body: [
						'Usually the index points to the rows, and the database then fetches each row from the table: one more read for each.',
						'If the index also holds every column the question needs, say shopper, date and total, the database answers from the index alone, and never touches the table. That’s a covering index, and PostgreSQL calls the read an index-only scan.',
						'It’s about as quick as a read gets. But every column added makes the index bigger, so it’s kept for the busiest questions.',
					],
					example: {
						says: '“My orders: date and total”, with a covering index.',
						data: {
							'index on': 'shopper, date, and total',
							reads: 'the index only',
							'rows read from the table': 'none',
						},
					},
					note: {
						title: 'Clustered indexes',
						text: 'In MySQL’s InnoDB, the table itself is a B-tree sorted by its primary key: a clustered index. A read by primary key finds the whole row there, and every other index points to the primary key. PostgreSQL keeps rows in no particular order, and every index points into the table. SQL Server lets you choose which index is the clustered one.',
					},
				},
				{
					title: 'Too many indexes',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'st-order-heavy',
					current: [['server', 'db']],
					set: { only: ['st-order-heavy'], traffic: 6, copies: { server: 3 } },
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Every index is one more sorted list to keep right. Each new order goes into the table, and into every index on it. Over the years, the orders table has gathered nine indexes, some for reports nobody runs any more.',
						'Saving an order is now about three times the work. On a sale, 60 orders a second is more than the database can save, and 1 in 6 fails.',
						'Indexes take space too, sometimes as much as the table itself, and they need room in memory to be quick.',
					],
				},
				{
					title: 'Only the indexes you use',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'st-order-lean',
					set: { only: ['st-order-lean'], traffic: 6, copies: { server: 3 } },
					facts: ['succeed', { busy: 'db' }],
					body: [
						'PostgreSQL, for one, counts how often each index is used, so the ones nobody uses can be found and dropped. With just the two the shop needs, the same sale saves every order, and the database is 40% busy.',
						'An index rarely pays for itself on a small table, which is quicker to read whole; on a column with only a few values, like yes or no; or on a table written far more than it’s read, like a log.',
					],
				},
				{
					title: 'Checking the query plan',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'find-scan',
					current: [['server', 'db']],
					set: { only: ['find-scan'] },
					facts: ['wait'],
					body: [
						'You don’t have to guess whether an index is used. Put EXPLAIN in front of a question, and the database shows its query plan: which indexes it will use, and how many rows it expects to read. In PostgreSQL, EXPLAIN ANALYZE also runs it, and shows the real times.',
						'A plan that reads the whole table, for a question asked a thousand times a minute, is the place to start. Databases can also log every question slower than a limit you set, so you can find them.',
					],
					example: {
						says: 'EXPLAIN, in PostgreSQL.',
						data: {
							'without the index': 'Seq Scan on orders: every row read',
							'with it': 'Index Scan using orders_shopper on orders',
						},
					},
				},
				{
					title: 'Which index when',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'find-index',
					set: { only: ['find-index'] },
					body: [
						'B-trees aren’t the only kind. A hash index turns each value into a number that says exactly where it is: one step, but only for exact matches, with no ranges and no order. A full-text index, also called an inverted index, lists every word and the rows it appears in, for searching text.',
						'Whatever the kind, index the questions you actually ask, often, and check the plan.',
					],
					compare: {
						title: 'Which index when',
						rows: [
							[
								'B-tree on one column',
								'The default. Exact matches, ranges and sorting, on columns that questions filter, join or sort by. Primary keys get one by themselves; foreign keys don’t, in PostgreSQL.',
							],
							[
								'Composite',
								'Questions that name several columns. The ones always named go first.',
							],
							[
								'Covering',
								'The busiest few questions: answered from the index alone.',
							],
							[
								'Hash',
								'Exact matches only, like a key. Key-value stores find things this way.',
							],
							[
								'Full-text (inverted)',
								'Searching words in text. PostgreSQL and MySQL have one; search engines are built on it.',
							],
							[
								'Spatial',
								'Places on a map, like “shops within 2 km”. PostGIS adds them to PostgreSQL.',
							],
							[
								'No index',
								'Small tables, columns with few values, tables written far more than read, and questions nobody asks.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely, searching without an index. Push the traffic up and watch the database fill.',
				journey: 'find-scan',
				set: { only: ['find-scan'] },
			},
		},
		{
			id: 'reading-or-writing',
			title: 'Storage engines',
			summary:
				'How a database lays its data on disk: B-trees that change pages in place, LSM trees that only add, the log that survives a crash, and rows or columns.',
			steps: [
				{
					title: 'Pages and B-trees',
					show: ['vans', 'app', 'lb', 'server', 'db'],
					journey: 'van-save',
					draw: ['van-see-db'],
					set: vansInPlace,
					facts: [{ busy: 'db' }, 'succeed'],
					body: [
						'Delivery vans send where they are every few seconds: 100 updates a second. Shoppers check where their parcel is: 20 a second.',
						'The part of a database that lays the data out on disk is its storage engine. PostgreSQL keeps tables and indexes in pages of 8 kilobytes, and MySQL’s InnoDB in pages of 16, found through B-trees. A read walks down the tree to the right page. A write walks down too, then changes that page where it is: an update in place.',
						'Here, the **Database** is 80% busy, mostly with the vans.',
					],
				},
				{
					title: 'The write-ahead log',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					current: [['server', 'db']],
					set: buy,
					body: [
						'Changing pages on disk is slow, so the database changes them in memory first, and writes them to disk later. But if the power went off in between, saved orders would be lost.',
						'So every change is first added to the end of a log on disk: the write-ahead log. Adding to the end is quick. Only once a transaction’s commit is in the log does the database say “saved”. After a crash, it reads the log as it starts, and redoes every committed change the pages missed. Anything never committed is thrown away.',
						'PostgreSQL calls it the WAL, and InnoDB the redo log. PostgreSQL also keeps its read copies up to date by sending them the same log.',
					],
					example: {
						says: 'The end of the log.',
						data: {
							'1001': 'add order 5521',
							'1002': 'Blue kettle stock: 3 → 2',
							'1003': 'commit',
							'after a crash': 'redo from the log: order 5521 is still there',
						},
					},
				},
				{
					title: 'Twice the vans',
					show: ['vans', 'app', 'lb', 'server', 'db'],
					journey: 'van-save',
					draw: ['van-see-db'],
					set: { ...vansInPlace, traffic: 2 },
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The shop grows to twice as many vans. Every update is a walk down the tree and a page changed in place, scattered all over the disk.',
						'The database can’t keep up, and 3 in 8 requests fail, shoppers’ included.',
					],
				},
				{
					title: 'LSM trees: built for writing',
					show: ['vans', 'app', 'lb', 'server', 'logdb'],
					journey: 'van-log',
					draw: ['van-see'],
					set: vansLogged,
					facts: ['succeed', { busy: 'logdb' }],
					body: [
						'Some storage engines never change anything in place. Each write goes into a sorted table in memory, the memtable, and onto the end of a log, for safety. Nothing on disk is searched or changed.',
						'When the memtable fills, it’s written to disk in one go, as a sorted file that’s never changed again, called an SSTable. In the background, files are merged, keeping the newest version of each row: that’s compaction. The whole design is called a log-structured merge tree, or LSM tree.',
						'RocksDB, Cassandra, ScyllaDB and HBase work this way. Here, the **Write-first database** is one, and takes the same vans at two-thirds busy.',
					],
					example: {
						says: 'Van 12 moves, three times.',
						data: {
							memtable: 'van 12: Indiranagar, 20:01:10',
							'file 2, newer': 'van 12: Domlur, 20:01:05',
							'file 1, older': 'van 12: Ulsoor, 20:01:00',
							compaction: 'keeps only the newest',
						},
					},
				},
				{
					title: 'Reads pay for it',
					show: ['app', 'lb', 'server', 'db', 'logdb'],
					journey: 'st-look-lsm',
					draw: ['look-lb'],
					set: pagesBoth(2.5),
					facts: [
						{ succeed: 'look-lb', label: 'Pages from the B-tree' },
						{ succeed: 'st-look-lsm', label: 'Pages from the LSM tree' },
						{ busy: 'logdb' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A read in an LSM tree may look in the memtable, then in file after file, newest first, until it finds the row. To skip most files, each keeps a Bloom filter: a small summary that answers “definitely not here” or “maybe here”.',
						'Even so, reads cost more. Take product pages, read far more than they’re changed: 125 a second, sent to each design side by side. The B-tree answers every one. The LSM tree can’t keep up, and a fifth of its pages fail.',
					],
				},
				{
					title: 'Reading, writing and space',
					show: ['vans', 'app', 'lb', 'server', 'logdb'],
					journey: 'van-log',
					draw: ['van-see'],
					set: vansLogged,
					body: [
						'Every storage engine trades three costs: the work for each read, the work for each write, and space on disk.',
						'A B-tree reads in a few steps. But each small change rewrites a whole page, somewhere random on the disk, and pages are left partly empty, to make room for new rows.',
						'An LSM tree writes in long runs, which disks do fastest, and packs its files tightly. But reads may look in several places, and compaction rewrites the data again and again in the background, needing spare disk while it works. Even deleting is a write: a marker saying “gone”, called a tombstone, until compaction clears it.',
					],
				},
				{
					title: 'Reports on the shop’s database',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'st-report-rows',
					draw: ['look-lb'],
					current: [['server', 'db']],
					set: { only: ['look-lb', 'st-report-rows'], copies: { server: 3 } },
					facts: [
						{ succeed: 'look-lb', label: 'Product pages that work' },
						{ busy: 'db' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Every database so far kept each row together: all of an order’s columns side by side. That’s a row store, right for an app reading and writing a few rows at a time. That kind of work is called OLTP, online transaction processing.',
						'Now the shop’s team opens a report: sales per category, per month, for the year. It needs two columns, but of every order, so the database reads every whole row. A report comes in every second, each as much work as 150 product pages, and a quarter of the shoppers’ pages start failing.',
					],
				},
				{
					title: 'A column store for reports',
					show: ['app', 'lb', 'server', 'db', 'st-columns'],
					journey: 'st-report-cols',
					draw: ['look-lb'],
					current: [['server', 'st-columns']],
					set: { only: ['look-lb', 'st-report-cols'], copies: { server: 3 } },
					facts: [
						{ succeed: 'look-lb', label: 'Product pages that work' },
						{ busy: 'db' },
						{ wait: 'st-report-cols', label: 'Each report' },
					],
					body: [
						'A **Column store** keeps each column together instead: every order’s date, then every order’s total, and so on. A report reads only the columns it needs, and values in a column are alike, so they pack tightly.',
						'The shop copies its orders across, every night or as they happen, and runs reports there. That’s OLAP, online analytical processing, and a database kept for it is a data warehouse. ClickHouse, Google BigQuery, Amazon Redshift and Snowflake are all column stores.',
						'The shop’s own database is left to the shoppers, a third busy. Column stores are poor at changing one row at a time, so neither replaces the other.',
					],
					example: {
						says: 'The same orders, two ways round.',
						data: {
							'row store':
								'5521, 24 Nov, Kitchen, ₹1,499 | 5522, 24 Nov, Toys, ₹399 | …',
							'column store':
								'dates: 24 Nov, 24 Nov, … | categories: Kitchen, Toys, … | totals: ₹1,499, ₹399, …',
						},
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'db', 'logdb'],
					journey: 'look-lb',
					draw: ['st-look-lsm'],
					set: pagesBoth(1),
					body: [
						'The storage engine decides what’s cheap. Choose by what the data does most: is it read, written, or added up?',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'B-tree, row store',
								'Reads and writes mixed, read more than written, with transactions: most apps. PostgreSQL, MySQL’s InnoDB, SQL Server, Oracle.',
							],
							[
								'LSM tree',
								'Far more writes than reads: locations, events, messages, measurements. RocksDB, Cassandra, ScyllaDB, HBase.',
							],
							[
								'Column store',
								'Reports over many rows, a few columns at a time, copied from the main database. ClickHouse, BigQuery, Redshift, Snowflake.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with product pages read from both kinds of storage engine. Push the traffic up, and see which one fills first.',
				journey: 'st-look-lsm',
				set: pagesBoth(1.5),
			},
		},
		{
			id: 'transactions',
			title: 'Transactions',
			summary:
				'All or nothing, ACID letter by letter, two people and the last kettle, locking first or checking at the end, deadlocks, and one very busy row.',
			steps: [
				{
					title: 'All or nothing',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					current: [['server', 'db']],
					set: buy,
					body: [
						'Buying a kettle changes two things: an order is saved, and one kettle is taken from stock. If the server crashed in between, you’d have an order with no kettle taken, or a kettle gone with no order.',
						'So both go in one transaction. It starts with BEGIN, makes its changes, and ends with COMMIT, when they’re all kept at once. If anything goes wrong first, ROLLBACK undoes the lot. Never half.',
					],
					example: {
						says: 'Begin. Save order 5521. Take one Blue kettle from stock. Commit.',
						data: { 'if anything fails': 'rollback: neither change is kept' },
					},
				},
				{
					title: 'ACID, letter by letter',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					set: buy,
					body: [
						'What a transaction promises is called ACID, after four words.',
						'Atomic: all of it happens, or none. Consistent: the schema’s rules hold before and after, so stock never goes below zero. Isolated: transactions running at the same moment don’t trip over each other’s half-made changes. Durable: once it says “committed”, it stays saved, even if the power goes off a moment later, thanks to the write-ahead log.',
						'SQL databases are built around these. Many NoSQL databases offer them too, though often only for one item at a time.',
					],
					example: {
						says: 'Buying the kettle, letter by letter.',
						data: {
							atomic: 'the order and the stock change together, or neither does',
							consistent: 'stock can’t go below 0',
							isolated: 'nobody sees Riya’s half-made order',
							durable: 'after “committed”, a crash loses nothing',
						},
					},
				},
				{
					title: 'Two people, one kettle',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					set: buy,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'One kettle is left. Riya and Sameer tap Buy at the same moment. Each transaction reads the stock, sees 1 left, and writes back 0. Two orders, one kettle, and the stock says 0, as if only one was sold. That’s a lost update.',
						'It’s a race: what happens depends on who gets there first, by a fraction of a second. Each transaction did its job, and the result is still wrong.',
					],
					example: {
						says: 'Both read the stock before either writes.',
						data: {
							Riya: 'reads 1 left, writes 0',
							Sameer: 'reads 1 left, writes 0',
							result: 'two orders, and the stock says 0',
						},
					},
				},
				{
					title: 'Lock it first',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					current: [['server', 'db']],
					set: buy,
					body: [
						'One fix is to lock the row while you use it. Riya’s transaction reads the stock with SELECT … FOR UPDATE, which locks it. Sameer’s does the same, and has to wait. When Riya commits, his read goes ahead, sees 0 left, and he’s told it’s sold out.',
						'That’s pessimistic locking: assume someone else will want it, and lock it first. It’s simple and always right, but everyone else waits for as long as the lock is held. So keep those transactions short: never call a payment provider, or wait for a person, while holding a lock.',
					],
					example: {
						says: 'Sameer waits for Riya.',
						data: {
							Riya: 'locks the stock, takes the last one, commits',
							Sameer: 'waits, then reads 0 left: sold out',
							stock: '0',
						},
					},
				},
				{
					title: 'Check at the end',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					current: [['server', 'db']],
					set: buy,
					body: [
						'The other way is optimistic locking: assume nobody else will, and check at the end. Each row carries a version number. Riya reads stock 1, version 7, and writes “stock 0, version 8, but only if it’s still version 7”.',
						'Sameer’s write says the same, but by then it’s version 8, so it changes nothing. His app sees that, reads again, finds 0 left, and tells him. Nobody ever waits for a lock. Libraries like Hibernate and Rails can do this for you.',
						'It’s cheap when clashes are rare. When many people want the same row, most attempts fail and try again, adding work just when the database is busiest.',
					],
					example: {
						says: 'Two writes, one version.',
						data: {
							Riya: 'stock 0, version 8, where version is 7: 1 row changed',
							Sameer: 'the same: 0 rows changed, so he reads again',
							stock: '0, version 8',
						},
					},
					note: {
						title: 'Or one statement',
						text: 'For a simple count, one statement will do: take one from stock, only where stock is above 0. The database changes the row in one step, so two of them can’t both take the last kettle, and it says how many rows it changed: 0 means sold out.',
					},
				},
				{
					title: 'Deadlocks',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					set: buy,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Riya buys a kettle and a toaster. At the same moment, Sameer buys a toaster and a kettle. Riya’s transaction locks the kettle, and Sameer’s the toaster. Then each waits for the one the other holds. Neither can ever finish: a deadlock.',
						'Databases watch for these circles. When they find one, they cancel one of the transactions with an error, so the other can go on, and the app tries the cancelled one again.',
						'To make them rare, lock things in the same order everywhere, like by product number, and keep transactions short.',
					],
					example: {
						says: 'Each waits for the other.',
						data: {
							Riya: 'holds the kettle, waits for the toaster',
							Sameer: 'holds the toaster, waits for the kettle',
							database: 'cancels Sameer’s, and his app tries again',
						},
					},
				},
				{
					title: 'Everyone wants the same kettle',
					show: ['app', 'lb', 'server', 'db', 'row'],
					journey: 'flash-buy',
					current: [['db', 'row']],
					set: flash,
					facts: ['succeed', { busy: 'db' }, { busy: 'row' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A flash sale: 300 people a second try to buy the same kettle. Each order locks the one row that counts its stock, for about a hundredth of a second, so they can only go one at a time: 100 a second. Two in three get an error.',
						'The database itself is barely busy, at 20%. That single row is the bottleneck: a hot row. Holding its lock any longer, say while calling the payment provider, would make it worse still.',
					],
				},
				{
					title: 'Split the count',
					show: ['app', 'lb', 'server', 'db', 'row'],
					journey: 'flash-buy',
					set: { ...flash, copies: { server: 4, row: 4 } },
					copies: true,
					facts: ['succeed', { busy: 'row' }, { copies: 'row' }],
					body: [
						'Instead of one count of 400 kettles, keep four rows of 100. Each order takes from any row with kettles left, so four orders can go at once, and everyone gets an answer.',
						'Another way is to queue the orders and take them one at a time in the background, telling each shopper a moment later.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'db', 'row'],
					journey: 'flash-buy',
					set: { ...flash, copies: { server: 4, row: 4 } },
					body: [
						'All of them keep the count right. They differ in who waits, who tries again, and how many can go at once.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Lock it first',
								'Clashes are likely, and a short wait is fine: moving money between accounts, the last few seats. SELECT … FOR UPDATE.',
							],
							[
								'Check at the end',
								'Clashes are rare, like two people editing the same product. A version number, and try again if it changed.',
							],
							[
								'One statement',
								'A simple count or total: change it in one step, with the check inside.',
							],
							[
								'Split the hot row',
								'Many people changing one count at once: keep several rows, and take from any.',
							],
							[
								'Queue it',
								'A rush on one thing: line the orders up, and take them one at a time in the background.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely on the flash sale. Split the stock into more rows, from the row’s details, until everyone gets an answer.',
				journey: 'flash-buy',
				set: flash,
			},
		},
		{
			id: 'isolation',
			title: 'Isolation levels',
			summary:
				'What goes wrong when transactions overlap: dirty reads, non-repeatable reads, phantoms, lost updates and write skew, and the levels that prevent each.',
			steps: [
				{
					title: 'When transactions overlap',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					current: [['server', 'db']],
					set: buy,
					body: [
						'A database runs many transactions at once: dozens a second here, thousands in a big shop. Isolation is how well they’re kept apart.',
						'Perfect isolation is called serializable: the result is the same as if they’d run one after another, in some order. It’s the easiest to think about, but it costs: transactions wait for each other, or get cancelled and tried again.',
						'So databases also offer weaker levels, which are quicker but let some mix-ups through. Each mix-up has a name, and knowing them is how you know what your level allows.',
					],
				},
				{
					title: 'Dirty reads',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					set: buy,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A dirty read is seeing another transaction’s change before it commits.',
						'Riya’s transaction takes the last Blue kettle, so the stock is 0. Before it commits, Sameer’s page reads 0 and says “sold out”. Then Riya’s payment fails, and her transaction rolls back. The stock was 1 all along: Sameer was told something that never happened.',
					],
					example: {
						says: 'Sameer reads a change that’s undone.',
						data: {
							'1. Riya': 'sets the stock to 0, not committed yet',
							'2. Sameer': 'reads 0: “sold out”',
							'3. Riya': 'payment fails: rolled back to 1',
						},
					},
				},
				{
					title: 'Non-repeatable reads',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					set: buy,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A non-repeatable read is reading the same row twice in one transaction, and getting two answers, because another transaction committed a change in between.',
						'Riya’s checkout reads the kettle’s price, ₹1,499, to show her the total. The shop drops it to ₹1,299, and commits. Her checkout reads the price again, to charge her: ₹1,299. What she was shown and what she’s charged disagree.',
					],
					example: {
						says: 'One checkout, two prices.',
						data: {
							'1. Riya’s checkout': 'reads ₹1,499, shows the total',
							'2. The shop': 'sets ₹1,299, commits',
							'3. Riya’s checkout': 'reads ₹1,299, to charge her',
						},
					},
				},
				{
					title: 'Phantoms',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					set: buy,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A phantom is a row that appears, or disappears, between two reads of the same set of rows, like “today’s orders”, because another transaction added or removed it.',
						'The day’s sales report counts today’s orders, 120, then adds up their totals. In between, Sameer places order 5522. The total now covers 121 orders, and the report disagrees with itself.',
					],
					example: {
						says: 'One report, two answers.',
						data: {
							'1. The report': 'counts today’s orders: 120',
							'2. Sameer': 'places order 5522, commits',
							'3. The report': 'adds up today’s totals: 121 orders',
						},
					},
				},
				{
					title: 'Lost updates',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					set: buy,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A lost update is two transactions each reading a value, changing it, and writing it back, so the second write wipes out the first. The two kettle buyers in the Transactions lesson were one.',
						'Another: two of the shop’s staff fix the kettle’s description at once. Each loads it, fixes a different sentence, and saves. The second save puts back the sentence the first one fixed.',
						'Locking the row first, a version number, or one statement that changes the row in place all prevent it.',
					],
					example: {
						says: 'Two saves, one survives.',
						data: {
							'1. Asha': 'loads the description, fixes sentence 1',
							'2. Vikram': 'loads it too, fixes sentence 2',
							'3. Both save': 'Vikram’s wins: sentence 1 is wrong again',
						},
					},
				},
				{
					title: 'Write skew',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					set: buy,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Write skew is the sneakiest. Two transactions read the same rows, decide something from them, then write to different rows. Neither changes what the other wrote, so nothing looks like a clash. But together, they break a rule.',
						'The shop needs at least one person on call during the sale. Asha and Vikram both are. At the same moment, each checks “is anyone else on call?”, sees yes, and signs off. Both commit. Nobody is on call.',
						'The cure is serializable isolation, or locking the rows you read, with SELECT … FOR UPDATE.',
					],
					example: {
						says: 'Each decision was right on its own.',
						data: {
							'1. Asha': 'reads 2 on call, so signs off',
							'2. Vikram': 'reads 2 on call, so signs off',
							result: '0 on call',
						},
					},
				},
				{
					title: 'Snapshots: many versions of a row',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					current: [['server', 'db']],
					set: buy,
					body: [
						'Most databases today keep several versions of each row: when a row changes, the old version stays for a while beside the new one. That’s multi-version concurrency control, MVCC, used by PostgreSQL, MySQL’s InnoDB and Oracle.',
						'A transaction can then read from a snapshot: the data as it was when it started, ignoring anything committed since. Its reads always agree with each other, and readers never wait for writers, or writers for readers. That’s snapshot isolation.',
						'Old versions are cleared away once no transaction can still see them. In PostgreSQL, that’s the job of VACUUM.',
					],
					example: {
						says: 'Riya’s checkout, reading from a snapshot.',
						data: {
							'her checkout starts': '20:00:00, price ₹1,499',
							'20:00:02': 'the shop sets ₹1,299, commits',
							'her second read': '₹1,499, the same as she was shown',
						},
					},
				},
				{
					title: 'The four levels',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					set: buy,
					body: [
						'The SQL standard names four levels, by the mix-ups each one prevents. Each database builds them its own way, so check yours.',
						'Most apps run at their database’s default, so it’s worth knowing what that lets through. PostgreSQL, Oracle and SQL Server default to read committed, where lost updates and write skew can both happen. MySQL’s InnoDB defaults to repeatable read.',
						'Names can mislead, too: what Oracle calls serializable is really snapshot isolation, which still lets write skew through.',
					],
					compare: {
						title: 'What each level prevents',
						rows: [
							[
								'Read uncommitted',
								'Nothing: even dirty reads get through. Rarely used; PostgreSQL treats it as read committed.',
							],
							[
								'Read committed',
								'Dirty reads. Each statement sees only committed data, but a second read can differ.',
							],
							[
								'Repeatable read',
								'Dirty and non-repeatable reads, and in PostgreSQL, phantoms too. Write skew still gets through.',
							],
							[
								'Serializable',
								'All of them, write skew included: as if one at a time.',
							],
						],
					},
				},
				{
					title: 'Serializable, three ways',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					set: buy,
					body: [
						'One way is to really run one transaction at a time, on one thread, each one very short. Redis runs every command this way, and VoltDB whole transactions.',
						'Another is two-phase locking: reads lock rows too, so a writer waits for every reader, and readers wait for writers. MySQL and SQL Server work this way at serializable. It’s safe, but the waits and deadlocks grow.',
						'The newest is serializable snapshot isolation: run on snapshots without waiting, watch for transactions that could clash, and cancel one of them at commit, to be tried again. PostgreSQL has done this since 2011, and CockroachDB uses serializable by default.',
					],
				},
				{
					title: 'The cost: clashes and retries',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'st-checkout',
					current: [['server', 'db']],
					set: serializable,
					facts: ['succeed', { retries: 'db' }, { busy: 'db' }],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'On a busy sale, checkouts often touch the same rows. At serializable, say 1 in 5 is cancelled for a possible clash. The app has to catch that error and run the whole transaction again, here up to twice.',
						'So 80 checkouts a second become about 99 attempts: the database does a quarter more work for the same sales, and a few still fail after both retries.',
						'In PostgreSQL, the error is a serialization failure, and every app using serializable has to expect it.',
					],
				},
				{
					title: 'Which level when',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'st-checkout',
					set: serializable,
					body: [
						'Pick the weakest level that can’t break your rules, then protect the few places that need more: a lock, a version number, a constraint, or serializable for just those transactions.',
					],
					compare: {
						title: 'Which level when',
						rows: [
							[
								'Read committed',
								'Most apps, most of the time, with care: lock or use a version number wherever two people can change the same thing.',
							],
							[
								'Repeatable read, or snapshot',
								'Reports and long reads that must agree with themselves, and backups, which must be one moment’s copy.',
							],
							[
								'Serializable',
								'Money, stock and bookings, where a rule spans several rows and a mistake is costly. Be ready to retry.',
							],
							['Read uncommitted', 'Almost never.'],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely on a bigger sale, with serializable checkouts. The checkouts alone would fit, but their retries push the database past full. Turn retries off and on, then give the database more room from its details, and compare.',
				journey: 'st-checkout',
				set: { ...serializable, traffic: 13 },
			},
		},
		{
			id: 'files',
			title: 'Files and media',
			summary:
				'Where photos and videos go, how they get there without clogging the servers, and how they’re processed, served, kept cheaply and kept safe.',
			steps: [
				{
					title: 'Where should a photo go?',
					show: ['app', 'lb', 'server', 'files'],
					journey: 'upload-server',
					current: [['server', 'files']],
					set: { only: ['upload-server'], copies: { server: 3 } },
					body: [
						'Sellers upload product photos, a few megabytes each. There are three places they could go.',
						'In the database, as a blob, a column of raw bytes: it works, but every backup and every read copy carries them, and they crowd out the rows the database keeps in memory. On the web server’s own disk: lost if that server dies, and the other copies can’t see it.',
						'So they go in **File storage**, built for big files: object storage, like Amazon S3, Google Cloud Storage or Azure Blob Storage. It holds any number of files, cheaply, and every copy of the server can reach it.',
					],
					example: {
						says: 'What the database keeps about a photo.',
						data: {
							product: 'Blue kettle',
							photo: 'photos/kettle-blue-1.jpg',
							'the photo itself': '5 MB, in file storage',
						},
					},
				},
				{
					title: 'Buckets, keys and metadata',
					show: ['app', 'lb', 'server', 'files'],
					journey: 'upload-server',
					set: { only: ['upload-server'], copies: { server: 3 } },
					body: [
						'Object storage is like a huge key-value store for files. Each file, called an object, sits in a bucket under a key, like photos/kettle-blue-1.jpg. The slashes look like folders, but they’re just part of the name.',
						'You put a whole object, get it, or delete it. You don’t change part of one: you upload a new one in its place.',
						'Everything you look things up by goes in the database, beside the key: which product a photo belongs to, its place on the page, who uploaded it. That’s the metadata. The database answers the questions; storage holds the bytes.',
					],
					example: {
						says: 'One photo, in two places.',
						data: {
							'database row':
								'product 77, photo 1, key photos/kettle-blue-1.jpg, 5 MB, from seller 31',
							'in the bucket': 'photos/kettle-blue-1.jpg: the 5 MB photo itself',
						},
					},
				},
				{
					title: 'Uploads clog the servers',
					show: ['app', 'lb', 'server', 'files'],
					journey: 'upload-server',
					draw: ['look-lb'],
					set: uploadsThrough,
					facts: [
						{ busy: 'server' },
						{ succeed: 'look-lb', label: 'Product pages that work' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Here, each photo travels through a web server on its way. An upload keeps a server copy busy until all of it has arrived: as long as 30 ordinary pages.',
						'When many sellers upload at once, the copies fill up, and shoppers’ product pages start failing too: about 9 in 100.',
					],
				},
				{
					title: 'Straight to storage',
					show: ['app', 'lb', 'server', 'files'],
					journey: 'upload-direct',
					draw: ['look-lb'],
					current: [['app', 'files']],
					set: { ...uploadsThrough, only: ['upload-direct', 'look-lb'] },
					facts: [
						{ busy: 'server' },
						{ succeed: 'look-lb', label: 'Product pages that work' },
					],
					body: [
						'Instead, the server only hands out a pre-signed URL: a link that allows uploading one file, to one key, for a few minutes, signed so that storage can check it. The app sends the photo straight to file storage, and the server’s part takes a moment.',
						'The web servers are about half busy now, and every page works.',
					],
					example: {
						says: 'A link that allows one upload.',
						data: {
							link: 'storage…/photos/kettle-blue-2.jpg?signature=…',
							allows: 'one photo, for 15 minutes',
						},
					},
				},
				{
					title: 'Big files: multipart uploads',
					show: ['app', 'lb', 'server', 'files'],
					journey: 'upload-direct',
					current: [['app', 'files']],
					set: { only: ['upload-direct'], copies: { server: 3 } },
					body: [
						'A seller’s 2 GB product video is another matter. Sent in one piece, a dropped connection at 90% means starting again.',
						'So it’s sent as a multipart upload: cut into parts, uploaded several at a time, and joined by storage at the end. A part that fails is sent again on its own, and an upload can carry on after the connection drops.',
						'Amazon suggests it for anything over 100 MB, and S3 takes up to 10,000 parts.',
					],
					example: {
						says: 'A 2 GB video, in parts.',
						data: {
							start: 'storage gives the upload an ID',
							parts: 'about 200 parts of 10 MB, 4 at a time, each with its own signed link',
							'part 117 fails': 'only part 117 is sent again',
							finish: 'storage joins the parts into one video',
						},
					},
				},
				{
					title: 'Smaller sizes, later',
					show: ['app', 'lb', 'server', 'files', 'queue', 'photo-worker'],
					journey: 'upload-direct',
					current: [
						['files', 'queue'],
						['queue', 'photo-worker'],
						['photo-worker', 'files'],
					],
					set: { only: ['upload-direct'], traffic: 3, copies: { server: 3 } },
					tags: [{ text: 'Background: nobody waits', tone: 'background' }],
					body: [
						'When a photo arrives, file storage leaves a note in a queue. A **Photo worker** picks it up, makes smaller sizes for lists and for phones, and saves them back in storage. Nobody waits for it.',
						'Videos are transcoded the same way, often with FFmpeg or a cloud service: into several sizes and qualities, cut into short pieces, so a phone on a slow network can switch to a smaller size mid-video.',
					],
				},
				{
					title: 'A whole catalogue at once',
					show: ['app', 'lb', 'server', 'files', 'queue', 'photo-worker'],
					journey: 'upload-direct',
					current: [['queue', 'photo-worker']],
					set: catalogue,
					facts: [{ backlog: 'photo-worker' }, { busy: 'photo-worker' }],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A big seller adds a whole catalogue: 30 photos a second, for an hour. The photo worker can resize 20 a second.',
						'Nothing fails: the queue holds the rest. But 10 more jobs pile up every second, and new products show without their small photos for longer and longer.',
					],
				},
				{
					title: 'More workers',
					show: ['app', 'lb', 'server', 'files', 'queue', 'photo-worker'],
					journey: 'upload-direct',
					current: [['queue', 'photo-worker']],
					set: { ...catalogue, copies: { server: 3, 'photo-worker': 2 } },
					copies: true,
					facts: [
						{ backlog: 'photo-worker' },
						{ busy: 'photo-worker' },
						{ copies: 'photo-worker' },
					],
					body: [
						'Each job stands alone, so more workers simply take more at once. Two keep up, at three-quarters busy each.',
						'Shops often start workers by the length of the queue, and stop them when it’s empty.',
					],
				},
				{
					title: 'Serving through a CDN',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					set: { only: ['photos-cdn'] },
					facts: ['wait', { load: 'files' }],
					body: [
						'Shoppers download the photos through a **CDN**, as in the CDN lesson: copies kept near them, with file storage behind. Of 200 photo downloads a second, about 10 reach file storage.',
						'Private files, like invoices, stay private: the bucket isn’t public, and each download gets its own short-lived signed link, as uploads did.',
					],
				},
				{
					title: 'Cheaper, and kept safe',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					set: { only: ['photos-cdn'] },
					body: [
						'Not every file is read as often. Object storage has storage classes. In S3, Standard is for files read often. Standard-Infrequent Access costs less to keep, but charges to read. Glacier is for archives, cheapest of all, and its coldest class can take hours to bring a file back.',
						'Lifecycle rules move files between them by age, by themselves: invoices to Glacier after a year, say, and unfinished multipart uploads deleted after a week.',
						'S3 is designed for eleven nines of durability, 99.999999999% a year, by storing each file on many devices, in at least three zones of a region. Turn on versioning, and a file deleted or overwritten by mistake can be brought back too.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'files', 'queue', 'photo-worker'],
					journey: 'upload-direct',
					set: { only: ['upload-direct'], copies: { server: 3 } },
					body: ['Big files and the facts about them live apart, and meet by key.'],
					compare: {
						title: 'Where each thing goes',
						rows: [
							[
								'The database',
								'Facts you look things up by: products, orders, and each file’s key, owner and size.',
							],
							[
								'Object storage',
								'The files themselves: photos, videos, invoices, backups. S3, Google Cloud Storage, Azure Blob Storage.',
							],
							[
								'A server’s own disk',
								'Only scratch space, for work in progress. Assume it’s gone when the server is.',
							],
							[
								'Pre-signed URL',
								'Any upload, or private download, so the bytes skip the web servers.',
							],
							['Multipart upload', 'Files over about 100 MB, or shaky connections.'],
							[
								'A CDN in front',
								'Files many people download, like product photos and videos.',
							],
							[
								'A colder storage class',
								'Files kept for years and rarely read, like old invoices, moved there by lifecycle rules.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with a whole catalogue arriving. From the photo worker’s details, add workers until the queue stops growing.',
				journey: 'upload-direct',
				set: catalogue,
			},
		},
	],
};

export const storingTrack: TrackModule = {
	track: storing,
	parts: [
		{
			id: 'st-wide',
			name: 'Wide-column store',
			kind: 'database',
			layer: 'data',
			summary:
				'Keeps rows in groups called partitions, each on one of several machines, with the rows inside kept sorted: here, each shopper’s recently viewed products, newest first. Like Cassandra.',
			why: 'Every product view adds a row, and each shopper’s list is one partition, read from the top.',
			onFailure:
				'Recently viewed lists can’t be saved or shown. Each partition is usually kept on three machines, so one breaking loses nothing.',
			scaling:
				'Add machines: the partitions are shared out between them by a hash of their key.',
			capacityPerInstance: 100,
			instances: 3,
			latencyMs: 5,
		},
		{
			id: 'st-graph',
			name: 'Graph database',
			kind: 'database',
			layer: 'data',
			summary:
				'Keeps shoppers and products as nodes, and every purchase as a link between them, so following links is quick. Like Neo4j.',
			why: '“Also bought” follows links: from a product to its buyers, and on to what else they bought.',
			onFailure: 'Product pages show without “also bought”, if the page can do without it.',
			scaling:
				'Read copies for more questions. Splitting a graph over machines is hard, because the links cross between them.',
			capacityPerInstance: 150,
			instances: 1,
			latencyMs: 10,
		},
		{
			id: 'st-search',
			name: 'Search engine',
			kind: 'database',
			layer: 'data',
			summary:
				'Keeps an inverted index: every word, and the products it appears in, so it finds and ranks matches at once. Like Elasticsearch.',
			why: 'Searching for words inside names and descriptions means reading every product, unless something keeps a list of the words.',
			onFailure:
				'The search box stops working, but products can still be browsed. The index can be built again from the database.',
			scaling:
				'The index is split over several machines, each with copies, for more searches.',
			capacityPerInstance: 500,
			instances: 1,
			latencyMs: 10,
		},
		{
			id: 'st-tsdb',
			name: 'Time-series database',
			kind: 'database',
			layer: 'data',
			summary:
				'Keeps readings that arrive over time, like each van’s speed every few seconds, packed tightly in time order. Like InfluxDB or TimescaleDB.',
			why: 'Readings pour in all day, are never changed, and are asked for by time: the last hour, the average per day.',
			onFailure:
				'New readings are lost until it’s back, unless the vans keep them and send them later.',
			scaling:
				'Old readings are thinned out to averages, or deleted, by age, so it grows slowly. It can be spread over machines by time.',
			capacityPerInstance: 2_000,
			instances: 1,
			latencyMs: 3,
		},
		{
			id: 'st-columns',
			name: 'Column store',
			kind: 'database',
			layer: 'data',
			summary:
				'A copy of the shop’s orders, kept column by column, for reports. Adding up one column reads only that column. Like ClickHouse or BigQuery.',
			why: 'Reports read a few columns of every order. In the shop’s own database, that means reading every whole row, and slowing the shoppers down.',
			onFailure: 'Reports stop. The shop itself carries on.',
			scaling: 'Built to share one report out over many machines, each adding up its part.',
			capacityPerInstance: 10,
			instances: 1,
			latencyMs: 200,
		},
	],
	journeys: [
		{
			id: 'st-viewed-add',
			name: 'Add to recently viewed',
			description:
				'Every time someone opens a product, it’s added to their recently viewed list, in their partition of the wide-column store.',
			rps: 50,
			hops: [
				{ from: 'app', to: 'lb', label: 'Opened the Blue kettle' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{ from: 'server', to: 'st-wide', label: 'Add a row to Riya’s partition' },
			],
		},
		{
			id: 'st-viewed',
			name: 'See my recently viewed',
			description:
				'Someone opens their recently viewed products. It’s one partition, already sorted newest first.',
			rps: 20,
			hops: [
				{ from: 'app', to: 'lb', label: 'Show my recently viewed' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{ from: 'server', to: 'st-wide', label: 'Read Riya’s partition, from the top' },
			],
		},
		{
			id: 'st-viewers-scan',
			name: 'Who viewed my product, reading every partition',
			description:
				'A seller asks who looked at their kettle today. The partitions are by shopper, so every one of them, on every machine, has to be read.',
			rps: 2,
			hops: [
				{ from: 'app', to: 'lb', label: 'Who looked at my kettle today?' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{
					from: 'server',
					to: 'st-wide',
					label: 'Read every partition, on every machine',
					work: 200,
				},
			],
		},
		{
			id: 'st-viewed-add2',
			name: 'Add to recently viewed, in two tables',
			description:
				'Every product view is written twice: into the shopper’s partition, and into the product’s, in a second table.',
			rps: 50,
			hops: [
				{ from: 'app', to: 'lb', label: 'Opened the Blue kettle' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{
					from: 'server',
					to: 'st-wide',
					label: 'Add a row to Riya’s partition, and to the kettle’s',
					calls: 2,
				},
			],
		},
		{
			id: 'st-viewers',
			name: 'Who viewed my product, from its own table',
			description:
				'A seller asks who looked at their kettle today. Views are also kept by product, so it’s one partition.',
			rps: 2,
			hops: [
				{ from: 'app', to: 'lb', label: 'Who looked at my kettle today?' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{ from: 'server', to: 'st-wide', label: 'Read the kettle’s partition' },
			],
		},
		{
			id: 'st-also-sql',
			name: 'Also bought, from tables',
			description:
				'A product page asks what else the kettle’s buyers bought. In tables, that’s joining the orders to themselves, step by step.',
			rps: 10,
			hops: [
				{ from: 'app', to: 'lb', label: 'Who bought this also bought…?' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{ from: 'server', to: 'db', label: 'Join the orders, twice', work: 10 },
			],
		},
		{
			id: 'st-also-graph',
			name: 'Also bought, from a graph',
			description:
				'A product page asks what else the kettle’s buyers bought. The graph database follows the links from the kettle.',
			rps: 10,
			hops: [
				{ from: 'app', to: 'lb', label: 'Who bought this also bought…?' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{ from: 'server', to: 'st-graph', label: 'Follow the links from the kettle' },
			],
		},
		{
			id: 'st-search-sql',
			name: 'Search, reading every product',
			description:
				'Someone searches for “blue kettle”. The database reads every product, keeping the names with both words.',
			rps: 10,
			hops: [
				{ from: 'app', to: 'lb', label: 'Search: blue kettle' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{
					from: 'server',
					to: 'db',
					label: 'Read every product, keep names with both words',
					work: 20,
				},
			],
		},
		{
			id: 'st-search',
			name: 'Search, with a search engine',
			description:
				'Someone searches for “blue kettle”. The search engine looks up both words in its inverted index, and ranks the matches.',
			rps: 10,
			hops: [
				{ from: 'app', to: 'lb', label: 'Search: blue kettle' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{ from: 'server', to: 'st-search', label: 'Look up both words' },
			],
		},
		{
			id: 'st-search-feed',
			name: 'Change a product, copied to search',
			description:
				'A seller changes a product. It’s saved in the database, and the change is copied to the search engine in the background.',
			rps: 2,
			hops: [
				{ from: 'app', to: 'lb', label: 'Rename the kettle' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{ from: 'server', to: 'db', label: 'Save the change' },
				{
					from: 'db',
					to: 'st-search',
					label: 'Copy the change to search',
					mode: 'async',
				},
			],
		},
		{
			id: 'st-van-points',
			name: 'Save a van’s readings',
			description:
				'Every few seconds, each van sends its speed and fuel. Each reading is added, with its time, to the time-series database.',
			rps: 100,
			hops: [
				{ from: 'vans', to: 'lb', label: 'Speed 32 km/h, fuel 61%' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{ from: 'server', to: 'st-tsdb', label: 'Add the readings, with the time' },
			],
		},
		{
			id: 'st-order-heavy',
			name: 'Save an order, nine indexes',
			description:
				'Someone places an order. It’s saved in the orders table, and added to each of its nine indexes.',
			rps: 10,
			hops: [
				{ from: 'app', to: 'lb', label: 'Place the order' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{ from: 'server', to: 'db', label: 'Save it, and add it to 9 indexes', work: 3 },
			],
		},
		{
			id: 'st-order-lean',
			name: 'Save an order, two indexes',
			description:
				'Someone places an order. It’s saved in the orders table, and added to its two indexes.',
			rps: 10,
			hops: [
				{ from: 'app', to: 'lb', label: 'Place the order' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{ from: 'server', to: 'db', label: 'Save it, and add it to 2 indexes' },
			],
		},
		{
			id: 'st-look-lsm',
			name: 'Look at a product, from an LSM tree',
			description:
				'Someone opens a product, kept in a database built for writing. The read looks in memory, then in its files, newest first.',
			rps: 50,
			hops: [
				{ from: 'app', to: 'lb', label: 'Ask for the product page' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{
					from: 'server',
					to: 'logdb',
					label: 'Look in memory, then the files',
					work: 1.5,
				},
			],
		},
		{
			id: 'st-report-rows',
			name: 'Sales report, from the shop’s database',
			description:
				'The shop’s team opens a sales report. The shop’s own database reads every order of the year, whole, to add up two columns.',
			rps: 1,
			hops: [
				{ from: 'app', to: 'lb', label: 'Open the sales report' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{
					from: 'server',
					to: 'db',
					label: 'Read every order of the year, whole',
					work: 150,
				},
			],
		},
		{
			id: 'st-report-cols',
			name: 'Sales report, from a column store',
			description:
				'The shop’s team opens a sales report. The column store reads only the two columns it needs.',
			rps: 1,
			hops: [
				{ from: 'app', to: 'lb', label: 'Open the sales report' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{ from: 'server', to: 'st-columns', label: 'Read two columns of every order' },
			],
		},
		{
			id: 'st-checkout',
			name: 'Check out, serializable',
			description:
				'Someone checks out. The transaction runs at serializable, and the app runs it again if the database cancels it for a possible clash.',
			rps: 10,
			hops: [
				{ from: 'app', to: 'lb', label: 'Check out' },
				{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
				{
					from: 'server',
					to: 'db',
					label: 'Run the checkout; if cancelled, run it again',
					retries: 2,
				},
			],
		},
	],
};
