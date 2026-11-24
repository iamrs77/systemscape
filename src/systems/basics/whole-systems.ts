import type { Track } from '@/learn/course';
import type { Conditions } from '@/sim/scenario';
import { type TrackModule, look, roomy } from './shared';

type Parts = NonNullable<TrackModule['parts']>;
type Journeys = NonNullable<TrackModule['journeys']>;

// ---- the shop, as a worked example ----

const shopParts = ['app', 'lb', 'server', 'cache', 'db', 'carts', 'queue', 'worker', 'email'];
const shopDesign: Conditions = {
	only: ['look-cache', 'ws-order', 'cart'],
	copies: { server: 3 },
};

// ---- a URL shortener ----

const urlShards = ['ws-url-shard-1', 'ws-url-shard-2', 'ws-url-shard-3'];
const urlAll = [
	'ws-url-browser',
	'ws-url-lb',
	'ws-url-api',
	'ws-url-keys',
	'ws-url-cache',
	...urlShards,
	'ws-url-clicks',
	'ws-url-worker',
	'ws-url-stats',
];
const urlDay: Conditions = { only: ['ws-url-click'] };
const urlEvening: Conditions = { only: ['ws-url-click'], traffic: 2 };
const urlCached: Conditions = { only: ['ws-url-click-cache'], traffic: 2 };
const urlWhole: Conditions = {
	only: ['ws-url-click-full', 'ws-url-make-shards'],
	traffic: 2,
	copies: { 'ws-url-worker': 2 },
};

// ---- a news feed ----

const feedAll = [
	'ws-feed-app',
	'ws-feed-lb',
	'ws-feed-posts',
	'ws-feed-postdb',
	'ws-feed-queue',
	'ws-feed-worker',
	'ws-feed-follows',
	'ws-feed-cache',
	'ws-feed-svc',
	'ws-feed-postcache',
	'ws-feed-rank',
	'ws-feed-cdn',
	'ws-feed-media',
];
const feedPull: Conditions = { only: ['ws-feed-pull'] };
const feedPush: Conditions = { only: ['ws-feed-push-post', 'ws-feed-push-read'] };
const feedCeleb: Conditions = {
	only: ['ws-feed-push-post', 'ws-feed-push-read', 'ws-feed-celeb'],
};
const feedHybrid: Conditions = {
	only: ['ws-feed-push-post', 'ws-feed-hybrid-post', 'ws-feed-hybrid-read'],
};
const feedRanked: Conditions = {
	only: ['ws-feed-push-post', 'ws-feed-hybrid-post', 'ws-feed-ranked'],
};
const feedWhole: Conditions = {
	only: ['ws-feed-push-post', 'ws-feed-hybrid-post', 'ws-feed-ranked', 'ws-feed-photos'],
};

// ---- a chat app ----

const chatPath = [
	'ws-chat-riya',
	'ws-chat-lb',
	'ws-chat-s1',
	'ws-chat-db',
	'ws-chat-registry',
	'ws-chat-s2',
	'ws-chat-arjun',
];
const chatAll = [...chatPath, 'ws-chat-presence', 'ws-chat-queue', 'ws-chat-push', 'ws-chat-apns'];
const chatSend: Conditions = { only: ['ws-chat-send'] };
const chatWhole: Conditions = {
	only: ['ws-chat-send-full', 'ws-chat-receipt', 'ws-chat-heartbeat', 'ws-chat-group'],
	copies: { 'ws-chat-presence': 4 },
};

const wholeSystems: Track = {
	id: 'whole-systems',
	name: 'Whole systems',
	tagline:
		'Putting it all together: how to design a system, then a URL shortener, a news feed and a chat app, step by step.',
	lessons: [
		{
			id: 'design-approach',
			title: 'How to design a system',
			summary:
				'The steps of a design discussion, on the shop: requirements, napkin math, the API, the data, the big picture, deep dives and trade-offs. And high-level versus low-level design.',
			steps: [
				{
					title: 'A design discussion has steps',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					body: [
						'Someone asks you to design an online shop, in an interview or at work. It’s tempting to start drawing boxes at once. Experienced designers don’t: they go through the same few steps, in order, thinking out loud.',
						'First, agree what the system must do, and how well. Then rough out the numbers, the API and the data, and draw the big picture. Only then go deep into the hardest parts, and say what each choice costs.',
						'This lesson walks through each step on the shop every lesson so far has used. The next three lessons design other apps the same way.',
					],
					example: {
						says: 'A common plan for a 45-minute interview.',
						data: {
							'the requirements, and the numbers': 'about 10 minutes',
							'the API, the data, and the big picture': 'about 15 minutes',
							'deep dives into the hard parts': 'about 15 minutes',
							'trade-offs, and what you’d do next': 'about 5 minutes',
						},
					},
				},
				{
					title: 'Clarify: what must it do?',
					show: ['app'],
					journey: 'look',
					set: look,
					body: [
						'Start with questions. “Design a shop” could mean a corner shop’s website or Amazon, and the two have almost nothing in common. Asking first isn’t a delay: it’s the first thing being judged.',
						'First, what it must do: the functional requirements, the things a user can do. Shoppers browse and search products, add them to a cart, place an order, pay, and get a receipt by email.',
						'Then agree what’s out of scope, like reviews or tools for sellers, so the time goes on what matters. Write the list where both of you can see it: every box drawn later should serve something on it.',
					],
					example: {
						says: 'Questions worth asking first.',
						data: {
							'who uses it?': 'shoppers, on a phone app and a website',
							'what can they do?': 'browse, search, add to a cart, order, pay',
							'what’s left out?': 'reviews, seller tools, returns',
							'anything unusual?': 'big sales, where a few products are very popular',
						},
					},
				},
				{
					title: 'How well must it do it?',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					body: [
						'Next, the non-functional requirements: not what it does, but how well. Four come up in almost every design: scale, latency, availability and consistency.',
						'Scale is how many users, and how many requests a second at the busiest moment. Latency is how fast each answer must be. Availability is how much of the time it must work: 99.9% still allows almost 9 hours down a year. Consistency is whether everyone must see the very latest data, or can see it a moment late.',
						'The answers can differ within one app. A product page may show a price a minute old, but a payment must never be taken twice, and the last kettle must never be sold twice.',
					],
					example: {
						says: 'The shop’s answers.',
						data: {
							scale: '5 million product views and a million orders a day; sales bring three times as many',
							latency: 'a product page in under 200 ms',
							availability: '99.9% of the time',
							consistency:
								'exact for stock and payments; a minute late is fine for product details',
						},
					},
				},
				{
					title: 'Napkin math',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], traffic: 3, bigger: roomy },
					facts: ['rate', 'succeed', { busy: 'server' }],
					body: [
						'Now turn those answers into rough numbers, as in the napkin math lesson. A day has 86,400 seconds: call it 100,000. So 5 million product views a day is about 50 a second, and a million orders is about 10.',
						'A sale brings three times as many: 150 views a second. One **Web server** answers 100, so a third of shoppers would get errors. Before anything is drawn, the numbers say the shop needs several copies, and a load balancer.',
						'Storage too: a million orders a day at about 1 KB each is 1 GB a day, 365 GB a year. One database holds that for years, so splitting the data can wait.',
					],
				},
				{
					title: 'Define the API',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					current: [['app', 'lb']],
					set: { only: ['look-lb'], copies: { server: 3 } },
					copies: true,
					body: [
						'Next, write down how the app talks to the servers: the API. Each thing a user can do becomes a request to the **Load balancer**, passed on to one of the **Web server** copies the numbers asked for.',
						'The API is the contract between the app and everything behind it, so it’s worth agreeing early. REST suits a shop, as in the REST lesson: simple, understood by every app and browser, and answers to GET can be cached.',
					],
					example: {
						says: 'The shop’s main requests.',
						data: {
							'GET /products/77': 'the Blue kettle’s details and price',
							'GET /search?q=kettle': 'matching products, 20 at a time',
							'POST /cart/items': 'add a product to the cart',
							'POST /orders': 'order what’s in the cart, and get back order 5521',
							'GET /orders/5521': 'the order, and where it is',
						},
					},
				},
				{
					title: 'Sketch the data',
					show: ['app', 'lb', 'server', 'db', 'carts'],
					journey: 'look-lb',
					draw: ['cart'],
					current: [
						['server', 'db'],
						['server', 'carts'],
					],
					set: { only: ['look-lb', 'cart'], copies: { server: 3 } },
					copies: true,
					body: [
						'Then the data model: what’s stored, how the pieces link up, and how each is found.',
						'Products, shoppers and orders link to each other, and an order must be saved and its stock taken in one transaction. So a SQL **Database**, like Postgres, fits them, as in the SQL or NoSQL lesson. Carts change all the time and are read whole, so they go in a fast **Cart store**, like Redis.',
						'How the data is read decides its indexes. Shoppers look up their own orders, so orders get an index on the shopper.',
					],
					example: {
						says: 'The main tables.',
						data: {
							products: 'id, name, price, stock',
							shoppers: 'id, name, email',
							orders: 'id, shopper_id, status, placed_at',
							order_items: 'order_id, product_id, quantity, price',
							'carts, in Redis': 'cart:1042 → Blue kettle × 1',
						},
					},
				},
				{
					title: 'Draw the high-level design',
					show: shopParts,
					journey: 'look-cache',
					draw: ['ws-order', 'cart'],
					set: shopDesign,
					copies: true,
					facts: ['succeed', 'wait'],
					body: [
						'Now the big picture: every part, and how each request flows through them. A **Load balancer** in front of three copies of the **Web server**. A **Cache** for popular products, the **Database** for the facts, and the **Cart store**.',
						'Slow work, like the receipt email, is handed to a **Queue**, and an **Email worker** sends it through the **Email service**, so nobody waits for it, as in the message queues lesson.',
						'Then walk each requirement through the drawing: “Riya opens the Blue kettle”, “Riya places order 5521”. A request with nowhere to go means a part is missing. This drawing is the high-level design.',
					],
				},
				{
					title: 'Dive deep into the hardest part',
					show: ['app', 'lb', 'server', 'db', 'row'],
					journey: 'flash-buy',
					current: [['db', 'row']],
					set: { only: ['flash-buy'], traffic: 20, copies: { server: 3 }, bigger: roomy },
					facts: ['succeed', { busy: 'row' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A high-level design hides the hard parts inside boxes. So pick the one or two hardest, or let the interviewer pick, and go deeper: a deep dive. For a shop, it’s the flash sale: 500 kettles at half price, at 8 pm sharp.',
						'200 orders a second arrive, and each takes a kettle from the same count, locking the **Kettle stock row** for a moment, as in the transactions lesson. It can take 100 a second, so half the orders fail.',
						'Now talk through the fixes, and what each costs: split the count over several rows; keep it in Redis, and take one in a single step nothing can interrupt; or let buyers in from a virtual waiting room, a few at a time.',
					],
				},
				{
					title: 'Talk through trade-offs and failures',
					show: shopParts,
					journey: 'look-cache',
					draw: ['ws-order', 'cart'],
					set: { ...shopDesign, down: ['db'] },
					copies: true,
					facts: [
						{ succeed: 'look-cache', label: 'Product pages work' },
						{ succeed: 'ws-order', label: 'Orders work' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Every choice is a trade-off, and saying what it costs is what interviewers listen for most. The cache makes pages fast, but a price can be a minute old. The email in the background means nobody waits, but a receipt can arrive late.',
						'Then hunt for bottlenecks and single points of failure. What if the **Database** breaks? 9 product pages in 10 still work, from the cache, but no order can be placed. So the database needs a standby that takes over, as in the redundancy lesson.',
						'Finish with what you’d change at ten times the size: read copies, then splitting the orders, as in the scaling lessons.',
					],
				},
				{
					title: 'Common mistakes',
					show: shopParts,
					journey: 'look-cache',
					draw: ['ws-order', 'cart'],
					set: shopDesign,
					copies: true,
					body: [
						'Naming tools first. “Kafka, Kubernetes and Cassandra” isn’t a design. Say what a part must do, then pick a tool, and say why: “a queue, so orders don’t wait for emails; Amazon SQS would do”.',
						'Skipping the numbers. Without them, nobody can tell whether one database is plenty or hopeless, or whether a cache is worth having. And the opposite: designing for a billion users when the requirements said a million.',
						'Never saying what a choice costs, ignoring what happens when parts break, and going quiet while drawing. The reasoning is what’s being judged, so think out loud.',
					],
					example: {
						says: 'The same idea, said two ways.',
						data: {
							weak: '“We’ll put Redis in front.”',
							strong: '“Product pages are read five times as often as orders are placed, and products rarely change. So a cache like Redis in front of the database takes most reads off it. The cost: a price can be a minute old.”',
						},
					},
				},
				{
					title: 'High-level and low-level design',
					show: ['server', 'carts'],
					journey: 'cart',
					set: { only: ['cart'], copies: { server: 3 } },
					copies: true,
					about: 'server',
					body: [
						'Everything so far is high-level design, or HLD: the parts, and how they talk. Low-level design, or LLD, zooms into one part and designs its inside: the classes, their fields and methods, the interfaces between them, and the data structures.',
						'Inside the **Web server**, the cart might be a Cart class holding a map from product to CartItem, with add, remove and total, that saves itself in the **Cart store**. Payments go through a PaymentProvider interface, so Razorpay can be swapped for Stripe without touching the order code.',
						'LLD interviews ask things like “design a parking lot” or “design an elevator”, and look for clear classes, sensible interfaces and well-known design patterns. HLD interviews ask “design a news feed”, like the next lessons.',
					],
					example: {
						says: 'The cart, in low-level design.',
						data: {
							'class Cart':
								'items: Map<productId, CartItem>; add(product, qty); remove(productId); total()',
							'class CartItem': 'product, quantity, price when added',
							'interface PaymentProvider': 'charge(order, amount); refund(payment)',
							'class RazorpayProvider': 'implements PaymentProvider',
						},
					},
					compare: {
						title: 'HLD or LLD',
						rows: [
							[
								'High-level design',
								'The whole system: the parts, how they talk, where data lives, how it grows and what happens when parts break. Asked as “design a URL shortener”.',
							],
							[
								'Low-level design',
								'The inside of one part: classes, interfaces, data structures and design patterns. Asked as “design a parking lot”.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely on the shop’s whole design. Push the traffic up and see which part fills first, then take the database or the cache down from its details and see what still works.',
				journey: 'look-cache',
				set: shopDesign,
			},
		},
		{
			id: 'url-shortener',
			title: 'Design a URL shortener',
			summary:
				'A new app, designed step by step: estimates, the API, 301 or 302, three ways to make short codes, a cache, sharding, counting clicks, custom names and expiry.',
			steps: [
				{
					title: 'A new app: a URL shortener',
					show: ['ws-url-browser'],
					journey: 'ws-url-click',
					set: urlDay,
					body: [
						'This lesson designs a new app, not the shop: a URL shortener, like TinyURL or Bitly. Paste in a long link, get a short one like s.example.com/x7Kp2Qa, and anyone who opens the short one is sent on to the long one.',
						'Functional requirements first. Make a short link from a long one. Open a short link and land on the long one. And, if there’s time: choose your own short name, set a link to expire, and see how many clicks it got.',
						'Then how well. Opening a link must be fast, since it’s an extra stop on the way to the page. It must almost never be down, or millions of links in emails and on posters break at once. And a short code must never point to two different links.',
					],
					example: {
						says: 'A long link, shortened.',
						data: {
							long: 'https://blog.example.com/2026/11/how-we-made-our-pages-load-twice-as-fast',
							short: 's.example.com/x7Kp2Qa',
						},
					},
				},
				{
					title: 'Napkin math: far more reads than writes',
					show: ['ws-url-browser'],
					journey: 'ws-url-click',
					set: urlDay,
					facts: [
						'rate',
						{ label: 'New links', value: '40/s', hint: '4 million a day' },
						{ label: 'Kept after 5 years', value: '3.7 TB', hint: '7.3 billion links' },
					],
					body: [
						'Say 4 million new links are made a day. A day is about 100,000 seconds, so that’s 40 a second. If each link is opened 100 times on average, that’s 400 million clicks a day: 4,000 a second, and twice that at busy moments.',
						'So reads outnumber writes 100 to 1. That one ratio shapes the whole design: making a link can take a moment, but opening one must be fast and cheap.',
						'Storage: each link is about 500 bytes, for the long link, its code and a few dates. Over 5 years, that’s 7.3 billion links, about 3.7 TB. The short codes need room for all of them, which comes up in a few steps.',
					],
				},
				{
					title: 'The API',
					show: ['ws-url-browser', 'ws-url-lb', 'ws-url-api'],
					journey: 'ws-url-click',
					current: [['ws-url-browser', 'ws-url-lb']],
					set: urlDay,
					body: [
						'Two requests do almost everything, each through a **Load balancer** to a **Link service**. POST /api/links makes a short link: it sends the long link, and, if wanted, a custom name and an expiry date. It gets back the short link.',
						'GET /x7Kp2Qa opens one. The answer isn’t a page: it’s a redirect, a reply that says “go here instead”, with the long link in its Location header. The browser follows it at once, so people barely notice the stop.',
					],
					example: {
						says: 'POST /api/links',
						data: {
							long_url:
								'https://blog.example.com/2026/11/how-we-made-our-pages-load-twice-as-fast',
							custom_alias: 'optional, like fast-pages',
							expires_at: 'optional, like 2027-01-01',
							answer: '201 Created: { "short_url": "s.example.com/x7Kp2Qa" }',
						},
					},
				},
				{
					title: 'The simplest design',
					show: ['ws-url-browser', 'ws-url-lb', 'ws-url-api', 'ws-url-db'],
					journey: 'ws-url-click',
					set: urlDay,
					copies: true,
					facts: ['succeed', 'wait', { busy: 'ws-url-db' }],
					about: 'ws-url-db',
					body: [
						'The **Link service** runs as 6 copies that keep nothing to themselves, as in the lesson on servers that remember nothing. Behind them, a **Link database** keeps every code and its long link.',
						'Every lookup is by one key, the code, with no joins and no transactions. So a key-value store fits: it keeps each value under a key and finds it by that key, like a dictionary. DynamoDB and Cassandra are common picks; Postgres, with an index on the code, does fine at the start.',
						'On an ordinary day, 4,000 clicks a second arrive, and every one works. But the database is already 80% busy.',
					],
					example: {
						says: 'GET s.example.com/x7Kp2Qa',
						data: {
							'the service looks up': 'x7Kp2Qa',
							answer: '302 Found, Location: https://blog.example.com/2026/11/how-we-made-our-pages-load-twice-as-fast',
						},
					},
				},
				{
					title: '301 or 302?',
					show: ['ws-url-browser', 'ws-url-lb', 'ws-url-api', 'ws-url-db'],
					journey: 'ws-url-click-301',
					set: { only: ['ws-url-click-301'] },
					copies: true,
					facts: [{ load: 'ws-url-api' }, { busy: 'ws-url-db' }],
					body: [
						'There are two kinds of redirect. A 301 means “moved for good”: the browser may remember it, and next time go straight to the long link without asking. A 302 means “found, for now”: the browser asks every time.',
						'With 301s, repeat clicks never reach us. Say 4 clicks in 10 come from a browser that has opened the link before: the **Link service** gets 2,400 a second instead of 4,000, and the database has room to spare.',
						'But a click we never see is a click we can’t count, and a link we can’t change: browsers that remember it keep going to the old address. So a shortener that counts clicks, like this one, uses 302, or 307, which is much the same. One that only wants to be cheap and fast can use 301. A middle way is a 301 with a short cache time, so browsers remember it for minutes, not for good.',
					],
				},
				{
					title: 'Making the code: a counter in base 62',
					show: [
						'ws-url-browser',
						'ws-url-lb',
						'ws-url-api',
						'ws-url-counter',
						'ws-url-db',
					],
					journey: 'ws-url-make-counter',
					current: [['ws-url-api', 'ws-url-counter']],
					set: { only: ['ws-url-make-counter'] },
					facts: [{ load: 'ws-url-counter' }],
					about: 'ws-url-counter',
					body: [
						'Now the interesting part: where does a code come from? It must be short, and never handed out twice. The simplest way is a **Counter** that goes up by one for each new link, like Redis’s INCR, written in base 62.',
						'Base 62 uses 0 to 9, a to z and A to Z: 62 symbols, so each character holds far more than a decimal digit. The billionth link is just 15FTGg. Six characters give 62 × 62 × 62 × 62 × 62 × 62, about 56.8 billion codes: plenty for 7.3 billion links, and no two links ever clash.',
						'But codes come out in order, so anyone can guess the next ones and walk through every link. And every new link asks the one counter, 40 times a second: if it breaks, nobody can make a link.',
					],
					example: {
						says: 'The counter says 1,000,000,000.',
						data: {
							'in base 62': '15FTGg',
							'the short link': 's.example.com/15FTGg',
							'the next one': '15FTGh',
						},
					},
				},
				{
					title: 'Making the code: a hash of the link',
					show: ['ws-url-browser', 'ws-url-lb', 'ws-url-api', 'ws-url-db'],
					journey: 'ws-url-make-hash',
					current: [['ws-url-api', 'ws-url-db']],
					set: { only: ['ws-url-make-hash'] },
					body: [
						'Another way needs no counter: hash the long link with MD5 or SHA-256, write the result in base 62, and keep the first 7 characters. The codes look random, so nobody can guess them, and the same long link always gets the same code.',
						'But keeping only 7 characters means two different links can get the same code: a collision. The chance grows as links pile up. With 7.3 billion links among 3.5 trillion 7-character codes, about 1 new code in 500 is already taken. With 6 characters, it would be about 1 in 8.',
						'So the **Link service** saves a link only if its code is free, checked and saved in one step: a conditional write, which DynamoDB, Cassandra and SQL’s unique keys all offer. If the code is taken, it adds a character to the long link, hashes again, and tries once more.',
					],
					example: {
						says: 'Hashing the blog link.',
						data: {
							MD5: 'e64ec3042963c10f2fcecec6f4d64229',
							'in base 62, the first 7': '70AedYs',
							'if 70AedYs is taken': 'hash the link plus “1”, and try again',
						},
					},
				},
				{
					title: 'Making the code: keys made in advance',
					show: ['ws-url-browser', 'ws-url-lb', 'ws-url-api', 'ws-url-keys', 'ws-url-db'],
					journey: 'ws-url-make-keys',
					current: [['ws-url-api', 'ws-url-keys']],
					set: { only: ['ws-url-make-keys'] },
					facts: [{ load: 'ws-url-keys' }],
					about: 'ws-url-keys',
					body: [
						'The third way does the hard work early. A **Key service** makes random 7-character codes in advance, checks each is unique, and keeps them in a list of unused keys.',
						'Each copy of the link service takes a block of 1,000 keys at a time, and hands them out from its own memory. So the key service is asked about 2.4 times a minute, not 40 times a second. Codes are random, never clash, and need no check when a link is made. If a copy crashes, the rest of its block is never used: with 3.5 trillion codes, that doesn’t matter.',
						'If the key service breaks, the copies carry on with the keys they hold. The same block trick works with a counter: each copy takes a range of 1,000 numbers at a time.',
					],
					compare: {
						title: 'Which code maker when',
						rows: [
							[
								'A counter, in base 62',
								'The simplest, and the shortest codes, with no collisions. But codes can be guessed, and every new link asks the one counter.',
							],
							[
								'A hash of the link',
								'No counter to ask, and the same link always gets the same code. Every save must check for a collision.',
							],
							[
								'Keys made in advance',
								'Random codes that can’t be guessed, no checks when a link is made, and the key service is asked once per 1,000. One more service to run.',
							],
							[
								'Counter ranges, in blocks',
								'Almost no load on the counter, and still the shortest codes. They can still be guessed.',
							],
						],
					},
				},
				{
					title: 'A busy evening',
					show: ['ws-url-browser', 'ws-url-lb', 'ws-url-api', 'ws-url-db'],
					journey: 'ws-url-click',
					set: urlEvening,
					copies: true,
					facts: ['succeed', { busy: 'ws-url-api' }, { busy: 'ws-url-db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'In the evening, and whenever a link goes viral, clicks double: 8,000 a second. The **Link service** copies cope, but the **Link database** can answer 5,000, so 3 clicks in 8 fail.',
						'Read copies of the database would help, as in the read copies lesson. But look at what’s being read: the same popular links, again and again, and a link never changes once it’s made.',
					],
				},
				{
					title: 'A cache for hot links',
					show: [
						'ws-url-browser',
						'ws-url-lb',
						'ws-url-api',
						'ws-url-cache',
						'ws-url-db',
					],
					journey: 'ws-url-click-cache',
					current: [['ws-url-api', 'ws-url-cache']],
					set: urlCached,
					copies: true,
					facts: ['succeed', { load: 'ws-url-db' }, { busy: 'ws-url-db' }],
					body: [
						'Most clicks go to a few links: today’s viral post, this week’s newsletter. So a **Link cache** in memory, like Redis or Memcached, keeps the popular ones. The service asks it first, and asks the database only when it misses, as in the caching lesson.',
						'Here, 9 clicks in 10 are hits. The database gets 800 reads a second instead of 8,000, and every click works.',
						'Size it with napkin math: 20 million links at 500 bytes each is 10 GB, which fits in one machine’s memory. When it’s full, it drops the link used least recently. And since a link never changes, the cache is never out of date, unless a link is deleted or expires.',
					],
				},
				{
					title: 'Splitting the links',
					show: [
						'ws-url-browser',
						'ws-url-lb',
						'ws-url-api',
						'ws-url-cache',
						...urlShards,
					],
					journey: 'ws-url-click-full',
					draw: ['ws-url-make-shards'],
					set: { ...urlWhole, down: ['ws-url-shard-2'] },
					copies: true,
					facts: ['succeed', { busyEach: urlShards }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Over five years, the links grow to 3.7 TB, more than one machine should keep and serve. So they’re split by a hash of the code, as in the sharding lesson: here, three shards, each with a third of the links. Every lookup is by code, so each goes to exactly one shard.',
						'Key-value stores like DynamoDB and Cassandra split the data by key for you. Cassandra places keys with consistent hashing, so adding a machine moves only some of them.',
						'Now **Link shard 2** breaks. Only links whose code lives there, and that aren’t in the cache, fail: about 3 clicks in 100. Each shard is also kept on three machines, as in the replication lesson, so even that is rare.',
					],
				},
				{
					title: 'Counting clicks in the background',
					show: [
						'ws-url-browser',
						'ws-url-lb',
						'ws-url-api',
						'ws-url-clicks',
						'ws-url-worker',
						'ws-url-stats',
					],
					journey: 'ws-url-click-full',
					current: [['ws-url-api', 'ws-url-clicks']],
					set: { ...urlWhole, copies: {} },
					facts: ['succeed', 'wait', { backlog: 'ws-url-worker' }],
					tags: [{ text: 'Background: nobody waits', tone: 'background' }],
					about: 'ws-url-clicks',
					body: [
						'Owners want to know how many clicks each link got, when, and from where. Counting in the link database on every click would double its work, and slow every redirect.',
						'So the **Link service** publishes each click to a **Click stream**, like Kafka, and answers at once. An **Analytics worker** reads the stream and adds the clicks up in **Click counts**, a database built for counting, like ClickHouse.',
						'At 8,000 clicks a second, one worker falls behind, and clicks pile up in the stream. Redirects don’t notice at all: the counts are a little late, until another worker is added.',
					],
				},
				{
					title: 'Custom names and expiry',
					show: [
						'ws-url-browser',
						'ws-url-lb',
						'ws-url-api',
						'ws-url-keys',
						...urlShards,
					],
					journey: 'ws-url-make-shards',
					set: { only: ['ws-url-make-shards'] },
					body: [
						'A custom name, like s.example.com/fast-pages, skips the **Key service**. The **Link service** saves it in its shard only if the name is free, with the same conditional write as before, and answers “taken” if not. Names that look like the service’s own pages, like /api or /login, are kept back.',
						'An expiring link keeps its expiry time. Each redirect checks it, and answers 410 Gone once it has passed. Expired links are removed later, in the background: DynamoDB and Cassandra can delete rows by themselves after a set time, and the cache copy is given the same deadline.',
						'Old codes are usually never handed out again: someone may still have the old link in an email, and would land somewhere they didn’t expect.',
					],
					example: {
						says: 'POST /api/links, with a custom name.',
						data: {
							long_url:
								'https://blog.example.com/2026/11/how-we-made-our-pages-load-twice-as-fast',
							custom_alias: 'fast-pages',
							answer: '409 Conflict: fast-pages is taken',
						},
					},
				},
				{
					title: 'The whole design',
					show: urlAll,
					journey: 'ws-url-click-full',
					draw: ['ws-url-make-shards'],
					set: urlWhole,
					copies: true,
					facts: ['succeed', 'wait', { backlog: 'ws-url-worker' }],
					body: [
						'Put together: links are made with keys handed out in blocks, kept in a sharded key-value store, opened through a cache, and counted in the background. Each piece is there because a number or a requirement asked for it.',
						'On a busy evening, at 8,000 clicks a second, with a second analytics worker, every click works, in 19 ms of our time, and nothing piles up.',
						'An interviewer may also ask about abuse. Limit how fast anyone can make links, and check each new long link against lists of known scam sites, like Google Safe Browsing, so short links don’t become a disguise for scams.',
					],
					compare: {
						title: 'Each choice, and why',
						rows: [
							[
								'302 redirects',
								'Every click reaches us, so it can be counted, and links can be changed. 301 saves work when neither matters.',
							],
							[
								'Keys in blocks',
								'Short codes that can’t be guessed, with no collisions and no busy counter.',
							],
							[
								'A key-value store',
								'Every lookup is by one key, and it spreads over machines by itself.',
							],
							[
								'A cache',
								'A few links get most clicks: it takes 9 reads in 10 off the database.',
							],
							[
								'Sharding',
								'Terabytes of links, and a broken shard only touches its own links.',
							],
							[
								'A click stream',
								'Counting never slows a redirect. The counts can be a moment late.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely on the whole link shortener, on a busy evening. Take the link cache or a shard down from its details, and watch what reaches the shards.',
				journey: 'ws-url-click-full',
				set: urlWhole,
			},
		},
		{
			id: 'news-feed',
			title: 'Design a news feed',
			summary:
				'A new app: building feeds when posts are made or when they’re read, the celebrity problem and the hybrid, a feed cache, ranking, cursors and a CDN.',
			steps: [
				{
					title: 'A new app: a news feed',
					show: ['ws-feed-app'],
					journey: 'ws-feed-push-read',
					set: feedPush,
					body: [
						'This lesson designs another new app: a social app’s news feed, like the home screen of Instagram or X. People post, follow each other, and open the app to see the newest posts from everyone they follow.',
						'Functional requirements: post text and photos; follow and unfollow; see a feed of posts from the people you follow, newest or best first, and scroll back through it.',
						'How well: the feed must open fast, in a few hundred milliseconds, and always open. But a new post that takes a few seconds to reach followers is fine. Accepting eventual consistency here is what makes the whole design possible.',
					],
				},
				{
					title: 'Napkin math',
					show: ['ws-feed-app'],
					journey: 'ws-feed-push-read',
					set: feedPush,
					facts: [
						'rate',
						{ label: 'Posts', value: '20/s', hint: '2 million a day' },
						{
							label: 'Followers, on average',
							value: '200',
							hint: 'feeds each post reaches',
						},
					],
					body: [
						'Say 10 million people use it each day, and open their feed 10 times: 100 million opens a day, about 1,000 a second. About 2 million posts are made a day: 20 a second.',
						'So feeds are opened 50 times as often as posts are made. And each person follows about 200 accounts, so a post has, on average, 200 followers whose feeds it should reach.',
						'Those two numbers, 50 opens per post and 200 followers per post, decide the whole design.',
					],
				},
				{
					title: 'The API and the data',
					show: ['ws-feed-app', 'ws-feed-lb', 'ws-feed-posts', 'ws-feed-postdb'],
					journey: 'ws-feed-post',
					set: { only: ['ws-feed-post'] },
					body: [
						'POST /posts makes a post. POST /follows/arjun follows Arjun. GET /feed gets the first page of the feed, and a cursor for the next. Each goes through a **Load balancer**.',
						'The data: posts, with their author, text, a link to the photo, and the time; and follows, who follows whom. A **Post service** saves each post in a **Post database**. Post ids are made sortable by time, as in the unique IDs lesson, so newest first is just biggest id first.',
					],
					example: {
						says: 'POST /posts',
						data: {
							text: 'Sunset at Marine Drive',
							photo: 'photo-311.jpg',
							answer: '201 Created: post 9001',
						},
					},
				},
				{
					title: 'Build the feed when it’s opened',
					show: [
						'ws-feed-app',
						'ws-feed-lb',
						'ws-feed-svc',
						'ws-feed-follows',
						'ws-feed-postdb',
					],
					journey: 'ws-feed-pull',
					current: [['ws-feed-svc', 'ws-feed-postdb']],
					set: { ...feedPull, traffic: 0.05 },
					facts: ['rate', { load: 'ws-feed-postdb' }, { busy: 'ws-feed-postdb' }],
					body: [
						'The simplest way: when Riya opens the app, a **Feed service** asks the **Follow graph** who she follows, fetches the newest posts from each of those 200 accounts, and merges them, newest first. That’s fan-out on read, also called the pull model.',
						'Posting is cheap: one write. But every open does 200 reads. While the app is small, with 50 opens a second, that’s 10,000 reads a second, and the **Post database** copes.',
					],
				},
				{
					title: 'At full size',
					show: [
						'ws-feed-app',
						'ws-feed-lb',
						'ws-feed-svc',
						'ws-feed-follows',
						'ws-feed-postdb',
					],
					journey: 'ws-feed-pull',
					set: feedPull,
					facts: ['succeed', { load: 'ws-feed-postdb' }, { busy: 'ws-feed-postdb' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'At 1,000 opens a second, the same work is 200,000 reads a second. The **Post database**, even with read copies, can answer 20,000, so 9 feeds in 10 fail.',
						'And most of it is wasted. Riya’s feed is worked out from scratch every time she opens it, though only a few posts are new since last time. With opens 50 times as common as posts, it’s better to do the work once, when a post is made.',
					],
				},
				{
					title: 'Build feeds when a post is made',
					show: [
						'ws-feed-app',
						'ws-feed-lb',
						'ws-feed-posts',
						'ws-feed-postdb',
						'ws-feed-queue',
						'ws-feed-worker',
						'ws-feed-follows',
						'ws-feed-cache',
						'ws-feed-svc',
					],
					journey: 'ws-feed-push-post',
					draw: ['ws-feed-push-read'],
					current: [['ws-feed-worker', 'ws-feed-cache']],
					set: feedPush,
					facts: [
						{ busy: 'ws-feed-worker' },
						{ load: 'ws-feed-cache' },
						{ succeed: 'ws-feed-push-read', label: 'Feeds that open' },
					],
					about: 'ws-feed-worker',
					body: [
						'So turn it round. When Riya posts, the **Post service** saves it and leaves a job on a **Fan-out queue**. A **Fan-out worker** asks who follows her, and adds the post’s id to the top of each follower’s feed, kept ready in a **Feed cache**. That’s fan-out on write, also called the push model.',
						'Now each post costs 200 writes, in the background, and each open costs one read: the **Feed service** just reads the list. 20 posts a second make 4,000 feed writes a second, and the worker is 40% busy. With 1,000 reads for the opens, the feed cache gets 5,000 a second, easy for memory, and every feed opens.',
						'Twitter built its home timelines this way, kept in Redis.',
					],
				},
				{
					title: 'The feed cache',
					show: [
						'ws-feed-app',
						'ws-feed-lb',
						'ws-feed-svc',
						'ws-feed-cache',
						'ws-feed-postcache',
						'ws-feed-postdb',
					],
					journey: 'ws-feed-push-read',
					set: feedPush,
					facts: ['wait', { load: 'ws-feed-postdb' }],
					timeline: true,
					about: 'ws-feed-cache',
					body: [
						'Each feed in the **Feed cache** is just a list of post ids, newest first, cut off after a few hundred, since hardly anyone scrolls back further. The posts themselves are fetched by id from a **Post cache**, so an edited post shows the change in every feed at once.',
						'Napkin math for its size: 10 million feeds of 500 ids, at 8 bytes each, is 40 GB. That fits in memory, over a few machines.',
						'People who haven’t opened the app for weeks get no feed kept, so fan-out skips them. When one comes back, the feed is built the old way, just once. Here that’s 1 open in 100, so with the post cache’s misses, the **Post database** gets about 2,100 reads a second, not 200,000.',
					],
				},
				{
					title: 'The celebrity problem',
					show: [
						'ws-feed-app',
						'ws-feed-lb',
						'ws-feed-posts',
						'ws-feed-postdb',
						'ws-feed-queue',
						'ws-feed-worker',
						'ws-feed-follows',
						'ws-feed-cache',
					],
					journey: 'ws-feed-celeb',
					draw: ['ws-feed-push-post'],
					set: feedCeleb,
					facts: [{ busy: 'ws-feed-worker' }, { backlog: 'ws-feed-worker' }],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Now a singer with 2 million followers posts. Fan-out on write means 2 million feed writes, for one post: as much work as 10,000 ordinary posts.',
						'Say big accounts like hers post about once every 100 seconds between them. That’s 20,000 feed writes a second, five times everything else. The **Fan-out worker** has more than twice what it can do, and 14,000 writes a second pile up in the queue.',
						'Nothing fails, but every post now waits behind hers, and Riya sees her friend’s post many minutes late. More workers help, but writing 2 million feeds still takes time, and most of those followers won’t open the app today anyway.',
					],
				},
				{
					title: 'The hybrid',
					show: [
						'ws-feed-app',
						'ws-feed-lb',
						'ws-feed-posts',
						'ws-feed-postdb',
						'ws-feed-queue',
						'ws-feed-worker',
						'ws-feed-follows',
						'ws-feed-cache',
						'ws-feed-svc',
						'ws-feed-postcache',
					],
					journey: 'ws-feed-hybrid-read',
					draw: ['ws-feed-push-post', 'ws-feed-hybrid-post'],
					current: [['ws-feed-svc', 'ws-feed-postcache']],
					set: feedHybrid,
					facts: [
						{ busy: 'ws-feed-worker' },
						{ backlog: 'ws-feed-worker' },
						{ load: 'ws-feed-postcache' },
					],
					body: [
						'The usual answer mixes the two. Ordinary accounts are fanned out on write. Accounts with more than, say, 100,000 followers aren’t: their posts are only saved. Twitter worked this way for its biggest accounts.',
						'When Riya opens her feed, the **Feed service** reads her ready-made list, then fetches the newest posts from the few big accounts she follows, here 4, from the **Post cache**, and merges them in. Posts read by millions are always in the cache.',
						'The worker is back to 40% busy, with nothing waiting. Each open costs 4 more reads, which the cache answers easily: 5,000 a second in all.',
					],
				},
				{
					title: 'Ranking, briefly',
					show: [
						'ws-feed-app',
						'ws-feed-lb',
						'ws-feed-svc',
						'ws-feed-cache',
						'ws-feed-postcache',
						'ws-feed-rank',
					],
					journey: 'ws-feed-ranked',
					current: [['ws-feed-svc', 'ws-feed-rank']],
					set: { ...feedRanked, down: ['ws-feed-rank'], circuitBreakers: true },
					facts: ['succeed', 'degraded', 'wait'],
					tags: [{ text: 'It keeps working', tone: 'plain' }],
					about: 'ws-feed-rank',
					body: [
						'Many feeds aren’t newest first, but best first. The feed service takes a few hundred candidate posts, and a **Ranking service** scores each one: how close Riya is to the author, how many people liked it, how new it is. A machine-learning model usually does the scoring.',
						'Ranking is an extra, so the call is optional, as in the failing gracefully lesson. Here the ranking service is down, and every feed still opens, newest first. A circuit breaker, from the reliability lessons, stops the feed service calling it at all, so nobody waits out a timeout either.',
					],
				},
				{
					title: 'Scrolling: cursors, not page numbers',
					show: ['ws-feed-app', 'ws-feed-lb', 'ws-feed-svc', 'ws-feed-cache'],
					journey: 'ws-feed-hybrid-read',
					current: [['ws-feed-app', 'ws-feed-lb']],
					set: feedHybrid,
					body: [
						'A feed is sent a page at a time: 20 posts, then 20 more as you scroll. The obvious way is page numbers, “skip 20, give me the next 20”. That’s offset pagination.',
						'But a feed changes while you read it. If 3 new posts arrive while Riya reads page 1, “skip 20” now lands 3 posts earlier, and she sees 3 posts twice. And skipping far into a long list makes the database step over every row it skips.',
						'So each page ends with a cursor: a marker for where it stopped, like the id of the last post shown. The next page asks for posts older than that, which is always the right place, and quick to find.',
					],
					example: {
						says: 'GET /feed?limit=20',
						data: {
							answer: '20 posts, and next_cursor: 8812',
							'the next page': 'GET /feed?limit=20&cursor=8812',
							'which means': 'the 20 posts just older than post 8812',
						},
					},
				},
				{
					title: 'Photos and videos through a CDN',
					show: ['ws-feed-app', 'ws-feed-cdn', 'ws-feed-media'],
					journey: 'ws-feed-photos',
					set: { only: ['ws-feed-photos'] },
					facts: [{ load: 'ws-feed-cdn' }, { load: 'ws-feed-media' }],
					body: [
						'Most of what a feed shows is photos and videos, far bigger than the posts. They’re uploaded straight to **Media storage**, like Amazon S3, as in the files and media lesson, and the post only keeps a link.',
						'They’re sent through a **CDN**, as in the CDN lesson. Each screen of the feed shows about 10 photos: 10,000 downloads a second. The CDN answers 95 in 100 from a server nearby, so storage sends just 500 a second.',
					],
				},
				{
					title: 'Which one when',
					show: feedAll,
					journey: 'ws-feed-ranked',
					draw: ['ws-feed-push-post', 'ws-feed-hybrid-post', 'ws-feed-photos'],
					set: feedWhole,
					facts: ['succeed', 'wait'],
					body: [
						'A news feed trades work when posting against work when reading. Two numbers, opens per post and followers per account, decide where that work goes.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Fan-out on read',
								'Few opens, or huge followings. Nothing is wasted on people who never look, but every open does the work.',
							],
							[
								'Fan-out on write',
								'Far more opens than posts, and ordinary follower counts. Opening is one read; each post costs a write per follower.',
							],
							[
								'The hybrid',
								'Ordinary accounts fanned out on write, big accounts pulled on read. The usual answer at scale.',
							],
							[
								'A feed cache of ids',
								'Keeps feeds small enough for memory. Posts are fetched by id, so edits show everywhere.',
							],
							['Cursors', 'Any list that changes while people scroll through it.'],
							[
								'A CDN',
								'Photos and videos: the same files for everyone, sent from nearby.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely on the whole news feed. Take the feed cache down from its details, and see how much work lands on the post database.',
				journey: 'ws-feed-ranked',
				set: feedWhole,
			},
		},
		{
			id: 'chat',
			title: 'Design a chat app',
			summary:
				'A new app: WebSockets, finding the receiver’s server, ticks, ordering, storing messages, presence, groups, offline users, several devices and end-to-end encryption.',
			steps: [
				{
					title: 'A new app: chat',
					show: ['ws-chat-riya', 'ws-chat-arjun'],
					journey: 'ws-chat-send',
					set: chatSend,
					body: [
						'The last design is another new app: a chat app, like WhatsApp, Messenger or Slack. Riya sends Arjun a message, and it appears on his phone a moment later.',
						'Functional requirements: one-to-one and group chats; messages delivered at once when the other person is online, and later when they’re not; ticks for sent, delivered and read; who’s online; and the same chats on a phone and a laptop.',
						'How well: messages arrive in well under a second, in the order they were sent, and are never lost. That last one matters most. A slow message is annoying; a lost one breaks people’s trust in the app.',
					],
				},
				{
					title: 'Napkin math',
					show: ['ws-chat-riya', 'ws-chat-arjun'],
					journey: 'ws-chat-send',
					set: chatSend,
					facts: [
						'rate',
						{
							label: 'Online at the busiest moment',
							value: '6 million',
							hint: 'connections kept open',
						},
						{ label: 'Kept each year', value: '73 TB', hint: '200 GB a day' },
					],
					body: [
						'Say 50 million people chat each day, and send 40 messages each: 2 billion messages a day, about 20,000 a second. At the busiest moment, 6 million people are online at once, each with a connection kept open.',
						'Unlike the URL shortener, writes and reads are about equal: each message is written once and read about once. So this design has to be good at writing.',
						'A message is about 100 bytes, so 2 billion a day is 200 GB a day: 73 TB a year, if every message is kept.',
					],
				},
				{
					title: 'A line kept open',
					show: ['ws-chat-riya', 'ws-chat-lb', 'ws-chat-s1'],
					journey: 'ws-chat-connect',
					set: { only: ['ws-chat-connect'] },
					body: [
						'Plain requests can’t deliver a message: the server can’t send Arjun anything until he asks, and asking every few seconds is slow and wasteful, as the real-time updates lesson showed.',
						'So each app opens a WebSocket to a chat server, here **Chat server 1**, and keeps it open while the app is in use. Messages travel both ways over it the moment they’re sent. A well-tuned server holds hundreds of thousands of open connections, so 6 million need a few dozen servers.',
						'Connections last for hours, so the **Load balancer** sends each new one to the server with the fewest, as in the load balancing lessons, and it must pass WebSockets through, at layer 4 or layer 7.',
					],
					example: {
						says: 'Opening the connection.',
						data: {
							'the app sends': 'GET /connect, with Upgrade: websocket',
							answer: '101 Switching Protocols: the line stays open',
						},
					},
				},
				{
					title: 'Which server is Arjun on?',
					show: [
						'ws-chat-riya',
						'ws-chat-lb',
						'ws-chat-s1',
						'ws-chat-registry',
						'ws-chat-s2',
						'ws-chat-arjun',
					],
					journey: 'ws-chat-send',
					current: [
						['ws-chat-s1', 'ws-chat-registry'],
						['ws-chat-s1', 'ws-chat-s2'],
					],
					set: chatSend,
					facts: [{ load: 'ws-chat-registry' }],
					about: 'ws-chat-registry',
					body: [
						'Riya is connected to **Chat server 1**, and Arjun to **Chat server 2**. Riya’s message arrives at server 1, which has to find Arjun.',
						'So when a phone connects, its server writes it down in a **Connection registry**, a fast shared store like Redis: “Arjun is on chat server 2”. Server 1 looks him up and passes the message to server 2, which pushes it down Arjun’s open connection.',
						'That’s one lookup per message, 20,000 a second, so the registry lives in memory. Each entry expires unless its server keeps renewing it, so a crashed server’s entries soon disappear, instead of sending messages to a server that’s gone.',
					],
					example: {
						says: 'In the connection registry.',
						data: { riya: 'chat server 1', arjun: 'chat server 2' },
					},
				},
				{
					title: 'A message, step by step',
					show: chatPath,
					journey: 'ws-chat-send',
					current: [['ws-chat-s1', 'ws-chat-db']],
					set: chatSend,
					facts: ['succeed', 'wait'],
					timeline: true,
					about: 'ws-chat-db',
					body: [
						'First, **Chat server 1** saves the message in the **Message store**, and only then tells Riya’s phone it’s saved: one tick. From then on, it can’t be lost, even if a server crashes.',
						'Then, in the background, it finds Arjun and passes the message on. Riya waits only for the save: 13 ms of our own time, in all.',
						'If Riya’s phone hears nothing back, it sends the message again, with the same id, and the server ignores the copy. So a retry never makes a message appear twice, like the idempotent workers in the message queues lesson.',
					],
					example: {
						says: 'Riya’s message, as it’s sent.',
						data: {
							id: 'm-7f3a, made by the phone',
							chat: 'riya-arjun',
							text: 'On my way!',
							answer: 'saved as number 42 in this chat: one tick',
						},
					},
				},
				{
					title: 'Delivered and read',
					show: chatPath,
					journey: 'ws-chat-receipt',
					draw: ['ws-chat-send'],
					current: [
						['ws-chat-arjun', 'ws-chat-lb'],
						['ws-chat-s1', 'ws-chat-riya'],
					],
					set: { only: ['ws-chat-send', 'ws-chat-receipt'] },
					facts: [{ load: 'ws-chat-registry' }],
					body: [
						'When the message reaches Arjun’s phone, the phone sends back a small message of its own: “delivered 42”. It travels the same way back, and Riya sees two ticks. When Arjun opens the chat, “read 42” turns them blue. These are delivery and read receipts.',
						'Receipts are messages too. With two for every message, the **Connection registry** now gets 60,000 lookups a second, three times as many. So phones often send one receipt for many messages at once, like “read everything up to 42”.',
					],
				},
				{
					title: 'Keeping messages in order',
					show: ['ws-chat-riya', 'ws-chat-lb', 'ws-chat-s1', 'ws-chat-db'],
					journey: 'ws-chat-send',
					current: [['ws-chat-s1', 'ws-chat-db']],
					set: chatSend,
					body: [
						'Riya sends “Leaving now”, then “On my way!”. They must appear in that order, on every device. The phones’ clocks can’t decide: a phone’s clock can be seconds out, and two messages can be sent in the same millisecond.',
						'So the server gives each message a sequence number within its chat: 41, 42, 43. One place hands out the numbers for each chat, so they never clash, and every device shows messages in number order. Order only matters within a chat, so each chat counts on its own.',
						'Numbers also show gaps. If Arjun’s phone has 41 and 43, it knows 42 is missing, and asks for it. Discord uses ids sortable by time instead, as in the unique IDs lesson.',
					],
					example: {
						says: 'Chat riya-arjun, in order.',
						data: {
							'41': 'Riya: Leaving now',
							'42': 'Riya: On my way!',
							'43': 'Arjun: See you there',
						},
					},
				},
				{
					title: 'Storing messages',
					show: ['ws-chat-riya', 'ws-chat-lb', 'ws-chat-s1', 'ws-chat-db'],
					journey: 'ws-chat-send',
					current: [['ws-chat-s1', 'ws-chat-db']],
					set: chatSend,
					facts: [{ load: 'ws-chat-db' }, { busy: 'ws-chat-db' }],
					body: [
						'20,000 new messages a second, and almost every read is “the newest 50 messages in this chat”, then older ones as you scroll. That suits a wide-column store like Cassandra or ScyllaDB, built for writing, as in the storage engines lesson.',
						'The **Message store** keeps messages by chat: the chat is the partition key, so one chat’s messages sit together on the same machines, sorted by sequence number. The newest 50 are one quick read from one place. A busy chat grows for years, so its history is also split by time, into buckets of, say, 10 days.',
						'Discord stores its messages this way: first in Cassandra, and now in ScyllaDB.',
					],
					example: {
						says: 'How messages are kept.',
						data: {
							'partition key': 'the chat, and a 10-day bucket',
							'sorted by': 'sequence number, newest first',
							'the newest 50': 'one read, from one place',
						},
					},
				},
				{
					title: 'Who’s online: heartbeats',
					show: ['ws-chat-riya', 'ws-chat-lb', 'ws-chat-s1', 'ws-chat-presence'],
					journey: 'ws-chat-heartbeat',
					set: { only: ['ws-chat-heartbeat'], copies: { 'ws-chat-presence': 4 } },
					copies: true,
					facts: ['rate', { busy: 'ws-chat-presence' }],
					about: 'ws-chat-presence',
					body: [
						'To show “online” or “last seen at 9:41”, the app must know who’s there. A phone can vanish without saying goodbye, in a tunnel or with a flat battery. So each open app sends a heartbeat, a tiny “still here”, every 30 seconds.',
						'Each heartbeat sets a key in a **Presence store**, like Redis, that expires after 60 seconds. Miss two heartbeats, and the key expires: Riya shows as offline, last seen at her last heartbeat.',
						'With 6 million online, that’s 200,000 heartbeats a second, ten times the messages, so four copies share them. And presence is only sent to people who are looking, like friends with Riya’s chat open, not to all her contacts every time.',
					],
				},
				{
					title: 'Group chats',
					show: chatPath,
					journey: 'ws-chat-group',
					current: [
						['ws-chat-s1', 'ws-chat-s2'],
						['ws-chat-s2', 'ws-chat-arjun'],
					],
					set: { only: ['ws-chat-group'] },
					facts: ['rate', { load: 'ws-chat-s2' }],
					body: [
						'In a group, one message goes to everyone in it. It’s saved once, in the group’s chat, with one sequence number. Then **Chat server 1** looks up where every member is connected, and passes a copy to each of their servers: fan-out, as in the news feed lesson.',
						'Here, 2,000 group messages a second, to groups of 50, become 100,000 deliveries a second, five times all the one-to-one messages. The work grows with the group, which is why chat apps cap how big a group can be.',
						'For huge channels with millions of members, nobody pushes to all of them. Members fetch the newest messages when they open the channel: fan-out on read, like the news feed’s.',
					],
				},
				{
					title: 'When Arjun is offline',
					show: chatAll.filter((id) => id !== 'ws-chat-presence'),
					journey: 'ws-chat-send-full',
					current: [
						['ws-chat-s1', 'ws-chat-queue'],
						['ws-chat-push', 'ws-chat-apns'],
					],
					set: { only: ['ws-chat-send-full'] },
					facts: [{ load: 'ws-chat-apns' }, 'wait'],
					about: 'ws-chat-apns',
					body: [
						'Arjun’s phone is in his pocket, the app closed, so the registry has no connection for him. The message is already safe in the message store. Server 1 leaves a job on a **Push queue**, and a **Push worker** sends a notification through **Apple and Google push**: Apple’s APNs and Google’s Firebase Cloud Messaging, the services every phone listens to.',
						'Here 3 messages in 10 are for someone offline: 6,000 notifications a second, all in the background, so Riya’s wait doesn’t change. If Apple’s or Google’s service is slow, nothing is lost: notifications just arrive late.',
						'When Arjun opens the app, it connects and asks for everything after the last number it has, “riya-arjun, after 41”, and the message store sends 42 and anything newer.',
					],
				},
				{
					title: 'Several devices',
					show: chatPath,
					journey: 'ws-chat-devices',
					current: [
						['ws-chat-s1', 'ws-chat-s2'],
						['ws-chat-s2', 'ws-chat-arjun'],
					],
					set: { only: ['ws-chat-devices'] },
					facts: ['rate', { load: 'ws-chat-s2' }],
					body: [
						'Arjun also chats on his laptop. Each device has its own connection, so the **Connection registry** keeps a list for each person: “Arjun: phone on chat server 2, laptop on chat server 7”. Every message goes to each of them, and a message Riya sends from her phone goes to her laptop too.',
						'Here people have 2 devices on average, so 20,000 messages a second become 40,000 deliveries.',
						'Each device remembers the last sequence number it has in each chat. When the laptop wakes after a week, it asks for everything newer, chat by chat, and is up to date. Read receipts sync the same way, so a message read on the phone shows as read on the laptop.',
					],
				},
				{
					title: 'End-to-end encryption',
					show: [
						'ws-chat-riya',
						'ws-chat-lb',
						'ws-chat-s1',
						'ws-chat-db',
						'ws-chat-s2',
						'ws-chat-arjun',
					],
					journey: 'ws-chat-send',
					set: chatSend,
					body: [
						'With end-to-end encryption, Riya’s phone locks each message with keys only Arjun’s devices hold, before it leaves. Every server on the way, ours included, sees only scrambled bytes, so a break-in, or a curious employee, reveals nothing. WhatsApp and Signal work this way, with the Signal Protocol.',
						'The design hardly changes, since the servers never needed to read the text. But the server can’t search messages for you, and each device has its own keys, so a message to Arjun is locked once for his phone and once for his laptop. The servers still see who talks to whom, and when.',
					],
					example: {
						says: 'What the servers see.',
						data: {
							chat: 'riya-arjun',
							number: '42',
							text: '9c1f04e7a2b5… (scrambled)',
						},
					},
				},
				{
					title: 'The whole design',
					show: chatAll,
					journey: 'ws-chat-send-full',
					draw: ['ws-chat-receipt', 'ws-chat-heartbeat', 'ws-chat-group'],
					set: chatWhole,
					copies: true,
					facts: ['succeed', 'wait'],
					body: [
						'Put together: phones keep a WebSocket open to a chat server, a registry says where everyone is, messages are saved before they’re acknowledged, numbered within their chat, and pushed to every device, or through a notification when the app is closed.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'WebSockets',
								'Messages both ways, the moment they’re sent, while the app is open.',
							],
							[
								'Push notifications',
								'The app is closed. Not guaranteed to arrive, so the app still syncs when it opens.',
							],
							[
								'Long polling',
								'A fallback for networks where WebSockets can’t get through.',
							],
							[
								'A wide-column store, by chat',
								'Many writes, and reads of the newest messages in one chat.',
							],
							[
								'Fan-out by the server',
								'Ordinary groups: a copy pushed to every member.',
							],
							[
								'Fan-out on read',
								'Channels with huge audiences: members fetch when they look.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely on the whole chat app. Take Chat server 2, the connection registry or Apple and Google push down from their details, and see what still works.',
				journey: 'ws-chat-send-full',
				set: chatWhole,
			},
		},
	],
};

const urlParts: Parts = [
	{
		id: 'ws-url-browser',
		name: 'Browser',
		kind: 'client',
		layer: 'clients',
		summary:
			'Whoever opens a short link, or makes one: a web browser, or an app that opens links.',
		why: 'People click short links in emails, posts and posters, and paste long ones in to shorten.',
		onFailure: 'It stands for the people clicking, so the simulation doesn’t make it fail.',
		scaling: 'It runs on each person’s own device.',
	},
	{
		id: 'ws-url-lb',
		name: 'Load balancer',
		kind: 'balancer',
		layer: 'balancing',
		summary:
			'The one address behind s.example.com. It passes each request to a copy of the link service.',
		why: 'The link service runs as several copies, and broken ones have to be skipped.',
		onFailure:
			'No short link opens anywhere, so it runs as a pair, or as a cloud load balancer.',
		scaling: 'It does very little with each request, so it passes on many thousands a second.',
		capacityPerInstance: 100_000,
		instances: 1,
		latencyMs: 1,
	},
	{
		id: 'ws-url-api',
		name: 'Link service',
		kind: 'service',
		layer: 'services',
		summary:
			'Makes short links, and answers every click with a redirect to the long link. Each copy answers about 2,000 requests a second.',
		why: 'Something has to turn a code into its long link, and check new links as they’re made.',
		onFailure: 'Short links stop working, everywhere they’ve been shared.',
		scaling: 'It keeps nothing between requests, so add copies. Here it runs 6.',
		capacityPerInstance: 2_000,
		instances: 6,
		maxInstances: 20,
		latencyMs: 5,
	},
	{
		id: 'ws-url-db',
		name: 'Link database',
		kind: 'database',
		layer: 'data',
		summary:
			'Keeps every short code and its long link, as a key and its value. One machine answers about 5,000 lookups a second.',
		why: 'Every link must be kept for years, and found by its code in a moment.',
		onFailure: 'No links can be made, and only those in the cache still open.',
		scaling:
			'A cache in front for popular links, then splitting the links over several machines.',
		capacityPerInstance: 5_000,
		instances: 1,
		latencyMs: 10,
	},
	{
		id: 'ws-url-counter',
		name: 'Counter',
		kind: 'database',
		layer: 'data',
		summary:
			'One number that goes up by one for each new link, like a Redis INCR. Written in base 62, it’s the short code.',
		why: 'Numbers handed out one after another never clash.',
		onFailure:
			'Nobody can make a link until it’s back. And if it ever lost its place, it could hand out the same numbers again.',
		scaling:
			'It’s one counter, so it can’t simply run copies. Handing out ranges of numbers takes almost all the load off it.',
		capacityPerInstance: 10_000,
		instances: 1,
		latencyMs: 1,
	},
	{
		id: 'ws-url-keys',
		name: 'Key service',
		kind: 'service',
		layer: 'services',
		summary:
			'Makes random 7-character codes in advance, checks each is unique, and hands them out to the link service in blocks of 1,000.',
		why: 'With codes made early, making a link needs no counter and no collision check.',
		onFailure:
			'The link service carries on with the keys its copies already hold. If it stays down, they run out.',
		scaling:
			'It’s asked only once per 1,000 links, so it barely needs to grow. A standby takes over if it breaks.',
		capacityPerInstance: 100,
		instances: 1,
		latencyMs: 5,
	},
	{
		id: 'ws-url-cache',
		name: 'Link cache',
		kind: 'cache',
		layer: 'data',
		summary:
			'Keeps the most-clicked links in memory, like Redis. 9 clicks in 10 are answered here.',
		why: 'A few links get most of the clicks, and a link never changes once it’s made.',
		onFailure:
			'Every click goes to the database: on a busy evening, far more than it can answer.',
		scaling: 'Add memory, or more copies, each holding some of the links.',
		capacityPerInstance: 100_000,
		instances: 1,
		latencyMs: 1,
		hitRate: 0.9,
	},
	...[1, 2, 3].map((n) => ({
		id: `ws-url-shard-${n}`,
		name: `Link shard ${n}`,
		kind: 'database' as const,
		layer: 'data' as const,
		summary: `A third of the links: those whose code hashes to shard ${n}. Kept on three machines, so one breaking loses nothing.`,
		why: 'Over the years, the links grow to terabytes. Split three ways, each shard keeps and answers a third.',
		onFailure:
			'Links whose code lives here can’t be opened, unless they’re in the cache. Other links aren’t affected.',
		scaling: 'Add shards. With consistent hashing, only some of the links move.',
		capacityPerInstance: 5_000,
		instances: 1,
		latencyMs: 10,
	})),
	{
		id: 'ws-url-clicks',
		name: 'Click stream',
		kind: 'stream',
		layer: 'async',
		summary: 'A log of every click: which code, when, and roughly from where. Like Kafka.',
		why: 'Counting clicks must never slow a redirect down.',
		onFailure: 'Clicks can’t be recorded, so counts stop growing. Links still open.',
		scaling: 'It’s split into partitions over many machines.',
		capacityPerInstance: 100_000,
		instances: 1,
		latencyMs: 2,
	},
	{
		id: 'ws-url-worker',
		name: 'Analytics worker',
		kind: 'worker',
		layer: 'async',
		summary:
			'Reads clicks from the stream and adds them up, by link, by day and by country. Each copy handles about 5,000 a second.',
		why: 'The counting happens here, where nobody is waiting for it.',
		onFailure: 'Clicks wait in the stream until it’s back. Counts are late, not lost.',
		scaling: 'Add copies when clicks pile up.',
		capacityPerInstance: 5_000,
		instances: 1,
		maxInstances: 10,
		latencyMs: 2,
	},
	{
		id: 'ws-url-stats',
		name: 'Click counts',
		kind: 'database',
		layer: 'data',
		summary:
			'Keeps the click totals for every link, in a database built for counting, like ClickHouse.',
		why: 'Owners want charts of their clicks, by day and by country.',
		onFailure: 'Owners can’t see their counts. Links still open.',
		scaling: 'Spread over more machines as the history grows.',
		capacityPerInstance: 20_000,
		instances: 1,
		latencyMs: 5,
	},
];

const feedParts: Parts = [
	{
		id: 'ws-feed-app',
		name: 'Feed app',
		kind: 'client',
		layer: 'clients',
		summary: 'The social app on people’s phones. It shows the feed, and sends their posts.',
		why: 'It’s how people post and read.',
		onFailure: 'It stands for the people using it, so the simulation doesn’t make it fail.',
		scaling: 'It runs on each person’s own phone.',
	},
	{
		id: 'ws-feed-lb',
		name: 'Load balancer',
		kind: 'balancer',
		layer: 'balancing',
		summary: 'Passes each request to a copy of the post service or the feed service.',
		why: 'Both services run as several copies, and broken ones have to be skipped.',
		onFailure: 'Nothing gets through, so it runs as a pair, or as a cloud load balancer.',
		scaling: 'It does very little with each request, so it passes on many thousands a second.',
		capacityPerInstance: 100_000,
		instances: 1,
		latencyMs: 1,
	},
	{
		id: 'ws-feed-posts',
		name: 'Post service',
		kind: 'service',
		layer: 'services',
		summary: 'Takes new posts, saves them, and starts sending them out to followers.',
		why: 'Posting is its own job, with its own checks.',
		onFailure: 'Nobody can post. Feeds still open.',
		scaling: 'It keeps nothing between requests, so add copies.',
		capacityPerInstance: 500,
		instances: 1,
		maxInstances: 10,
		latencyMs: 10,
	},
	{
		id: 'ws-feed-postdb',
		name: 'Post database',
		kind: 'database',
		layer: 'data',
		summary:
			'Keeps every post: who wrote it, the text, a link to its photo, and when. With its read copies, it answers about 20,000 reads a second.',
		why: 'Posts must be kept for good, and found by id or by author.',
		onFailure: 'Nobody can post, and posts not in the cache can’t be shown.',
		scaling: 'More read copies, then splitting the posts by author.',
		capacityPerInstance: 20_000,
		instances: 1,
		latencyMs: 10,
	},
	{
		id: 'ws-feed-follows',
		name: 'Follow graph',
		kind: 'database',
		layer: 'data',
		summary: 'Keeps who follows whom, both ways round: who Riya follows, and who follows her.',
		why: 'Every feed starts from who follows whom.',
		onFailure: 'Feeds can’t be built, and new posts can’t be sent out to followers.',
		scaling: 'Split by person, with copies for reading.',
		capacityPerInstance: 50_000,
		instances: 1,
		latencyMs: 5,
	},
	{
		id: 'ws-feed-svc',
		name: 'Feed service',
		kind: 'service',
		layer: 'services',
		summary:
			'Puts together each person’s feed when they open the app. Each copy answers about 1,000 a second.',
		why: 'Opening the feed is the thing everyone does most.',
		onFailure: 'The app opens to an empty feed.',
		scaling: 'It keeps nothing between requests, so add copies.',
		capacityPerInstance: 1_000,
		instances: 2,
		maxInstances: 20,
		latencyMs: 10,
	},
	{
		id: 'ws-feed-queue',
		name: 'Fan-out queue',
		kind: 'queue',
		layer: 'async',
		summary: 'Holds a job for each new post, waiting to be added to its followers’ feeds.',
		why: 'Writing to 200 feeds takes time nobody should wait for.',
		onFailure: 'Posts are saved, but reach nobody’s feed until it’s back.',
		scaling: 'It only holds the jobs, so it rarely needs to grow.',
		capacityPerInstance: 10_000,
		instances: 1,
		latencyMs: 2,
	},
	{
		id: 'ws-feed-worker',
		name: 'Fan-out worker',
		kind: 'worker',
		layer: 'async',
		summary:
			'Takes each new post, finds its author’s followers, and adds the post to each of their feeds. One copy writes about 10,000 feeds a second.',
		why: 'So that opening a feed is one quick read.',
		onFailure: 'New posts pile up in the queue, and feeds go stale until it’s back.',
		scaling: 'Add copies when posts wait too long.',
		capacityPerInstance: 10_000,
		instances: 1,
		maxInstances: 10,
		latencyMs: 5,
	},
	{
		id: 'ws-feed-cache',
		name: 'Feed cache',
		kind: 'cache',
		layer: 'data',
		summary:
			'Keeps each active person’s feed ready in memory, like Redis: a list of the newest few hundred post ids.',
		why: 'With feeds kept ready, opening the app is one read.',
		onFailure:
			'Every feed has to be built when it’s opened: far more work than the post database can do.',
		scaling: 'Spread over many machines, by person.',
		capacityPerInstance: 200_000,
		instances: 1,
		latencyMs: 2,
		hitRate: 0.99,
	},
	{
		id: 'ws-feed-postcache',
		name: 'Post cache',
		kind: 'cache',
		layer: 'data',
		summary: 'Keeps recent and popular posts in memory, so feeds can fetch them by id.',
		why: 'The same posts appear in many feeds at once.',
		onFailure: 'Posts come from the post database instead: slower, and much more work for it.',
		scaling: 'Add memory, or more copies.',
		capacityPerInstance: 100_000,
		instances: 1,
		latencyMs: 1,
		hitRate: 0.95,
	},
	{
		id: 'ws-feed-rank',
		name: 'Ranking service',
		kind: 'service',
		layer: 'services',
		summary:
			'Scores each candidate post for one person, so the best come first. Usually a machine-learning model.',
		why: 'People see more of what they care about.',
		onFailure: 'Feeds show newest first instead, since the call is optional.',
		scaling: 'Add copies: scoring is heavy work.',
		capacityPerInstance: 2_000,
		instances: 1,
		latencyMs: 40,
	},
	{
		id: 'ws-feed-cdn',
		name: 'CDN',
		kind: 'cdn',
		layer: 'edge',
		summary:
			'Servers in cities all over the world, each keeping copies of the photos and videos.',
		why: 'Photos are the same for everyone, and far bigger than posts.',
		onFailure: 'Every photo comes from media storage: slow, and far too much for it.',
		scaling: 'It belongs to a CDN company, and grows by itself.',
		capacityPerInstance: 1_000_000,
		instances: 1,
		latencyMs: 15,
		hitRate: 0.95,
	},
	{
		id: 'ws-feed-media',
		name: 'Media storage',
		kind: 'storage',
		layer: 'data',
		summary: 'Keeps every photo and video, like Amazon S3.',
		why: 'Big files are cheaper and simpler to keep apart from the posts.',
		onFailure: 'Photos the CDN doesn’t already have don’t load.',
		scaling: 'It holds any amount, but sends only so many files a second.',
		capacityPerInstance: 5_000,
		instances: 1,
		latencyMs: 120,
	},
];

const chatParts: Parts = [
	{
		id: 'ws-chat-riya',
		name: 'Riya’s phone',
		kind: 'client',
		layer: 'clients',
		summary: 'Riya’s chat app, with a connection to a chat server kept open while it’s in use.',
		why: 'Riya sends the messages in this lesson.',
		onFailure:
			'It stands for everyone sending messages, so the simulation doesn’t make it fail.',
		scaling: 'It runs on Riya’s phone.',
	},
	{
		id: 'ws-chat-arjun',
		name: 'Arjun’s phone',
		kind: 'client',
		layer: 'clients',
		summary: 'Arjun’s chat app. Messages for him are pushed down its open connection.',
		why: 'Arjun gets the messages in this lesson.',
		onFailure:
			'It stands for everyone receiving messages, so the simulation doesn’t make it fail.',
		scaling: 'It runs on Arjun’s phone.',
	},
	{
		id: 'ws-chat-lb',
		name: 'Load balancer',
		kind: 'balancer',
		layer: 'balancing',
		summary:
			'Sends each new connection to the chat server with the fewest open, then keeps passing that connection’s messages along.',
		why: 'Phones need one address, and connections need spreading evenly over the chat servers.',
		onFailure: 'Phones lose their connections, and reconnect through its standby.',
		scaling: 'At layer 4, one handles millions of open connections.',
		capacityPerInstance: 500_000,
		instances: 1,
		latencyMs: 1,
	},
	{
		id: 'ws-chat-s1',
		name: 'Chat server 1',
		kind: 'service',
		layer: 'services',
		summary:
			'The chat server Riya’s phone is connected to. A real app has dozens, each holding many thousands of connections; here, this one stands for the server a message’s sender is on.',
		why: 'Each phone keeps a connection open to one chat server, which saves its messages and passes them on.',
		onFailure:
			'Its phones lose their connections, and reconnect to another chat server. Then they ask for anything they missed.',
		scaling: 'Add servers: each new one takes new connections.',
		capacityPerInstance: 500_000,
		instances: 1,
		latencyMs: 5,
	},
	{
		id: 'ws-chat-s2',
		name: 'Chat server 2',
		kind: 'service',
		layer: 'services',
		summary:
			'The chat server Arjun’s phone is connected to. Here, it stands for the server a message’s receiver is on: it pushes each message down the right connection.',
		why: 'Only the server holding Arjun’s connection can push to his phone.',
		onFailure:
			'Messages can’t be pushed to its phones until they reconnect elsewhere. They’re safe in the message store meanwhile.',
		scaling: 'Add servers: each new one takes new connections.',
		capacityPerInstance: 500_000,
		instances: 1,
		latencyMs: 5,
	},
	{
		id: 'ws-chat-registry',
		name: 'Connection registry',
		kind: 'database',
		layer: 'data',
		summary:
			'A fast shared store, like Redis, that says which chat server each person’s devices are connected to.',
		why: 'A message arrives at the sender’s server, and has to find the receiver’s.',
		onFailure:
			'Messages are saved, but can’t find their way to phones that are online. They arrive when the phones next sync.',
		scaling: 'It’s kept in memory, and split over several machines by person.',
		capacityPerInstance: 500_000,
		instances: 1,
		latencyMs: 1,
	},
	{
		id: 'ws-chat-db',
		name: 'Message store',
		kind: 'database',
		layer: 'data',
		summary:
			'Keeps every message, grouped by chat and sorted by number, in a wide-column store like Cassandra.',
		why: 'Messages must never be lost, and each chat’s newest must be quick to read.',
		onFailure: 'No message can be sent: nothing is acknowledged until it’s saved.',
		scaling: 'Add machines: chats are spread over them by a hash of the chat id.',
		capacityPerInstance: 100_000,
		instances: 1,
		latencyMs: 5,
	},
	{
		id: 'ws-chat-presence',
		name: 'Presence store',
		kind: 'database',
		layer: 'data',
		summary:
			'Knows who’s online: each heartbeat sets a key that expires after 60 seconds. Like Redis. One copy takes about 100,000 a second.',
		why: 'Apps show who’s online, and when others were last seen.',
		onFailure: 'Everyone shows as offline, or last seen long ago. Messages still work.',
		scaling: 'Split by person over more copies.',
		capacityPerInstance: 100_000,
		instances: 1,
		latencyMs: 1,
	},
	{
		id: 'ws-chat-queue',
		name: 'Push queue',
		kind: 'queue',
		layer: 'async',
		summary: 'Holds a job for each notification waiting to be sent.',
		why: 'Notifications go through outside services that can be slow, and nobody should wait for them.',
		onFailure:
			'Notifications can’t be queued. Messages are still saved, and arrive when apps open.',
		scaling: 'It only holds the jobs, so it rarely needs to grow.',
		capacityPerInstance: 100_000,
		instances: 1,
		latencyMs: 2,
	},
	{
		id: 'ws-chat-push',
		name: 'Push worker',
		kind: 'worker',
		layer: 'async',
		summary:
			'Takes notification jobs from the queue, and sends each to Apple’s or Google’s push service.',
		why: 'Something has to talk to the phone makers’ services, away from the chat servers.',
		onFailure: 'Notifications wait in the queue until it’s back.',
		scaling: 'Add copies when jobs wait.',
		capacityPerInstance: 10_000,
		instances: 1,
		maxInstances: 10,
		latencyMs: 5,
	},
	{
		id: 'ws-chat-apns',
		name: 'Apple and Google push',
		kind: 'notifier',
		layer: 'external',
		summary:
			'Apple’s and Google’s push services, which every phone listens to, even with the app closed.',
		why: 'The only way to reach a phone whose app is closed.',
		onFailure:
			'Notifications arrive late, or not at all. Messages wait safely for the app to open.',
		scaling: 'It belongs to Apple and Google.',
		capacityPerInstance: 100_000,
		instances: 1,
		latencyMs: 50,
	},
];

const shopJourneys: Journeys = [
	{
		id: 'ws-order',
		name: 'Place an order, in the whole design',
		description:
			'Someone places an order. A copy of the web server saves it, and leaves a note for the receipt email, which is sent in the background.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'POST /orders' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Save the order, take the stock' },
			{ from: 'server', to: 'queue', label: 'Leave a note for the email', mode: 'async' },
			{ from: 'queue', to: 'worker', label: 'Hand out the note', mode: 'async' },
			{ from: 'worker', to: 'email', label: 'Send the receipt', mode: 'async', retries: 2 },
		],
	},
];

const toLb = { from: 'ws-url-browser', to: 'ws-url-lb' };
const toApi = { from: 'ws-url-lb', to: 'ws-url-api', label: 'Pass it to a copy' };
const urlJourneys: Journeys = [
	{
		id: 'ws-url-click',
		name: 'Open a short link',
		description:
			'Someone opens s.example.com/x7Kp2Qa. The link service looks the code up in the database, and answers with a redirect to the long link.',
		rps: 4000,
		hops: [
			{ ...toLb, label: 'GET /x7Kp2Qa' },
			toApi,
			{ from: 'ws-url-api', to: 'ws-url-db', label: 'Look up x7Kp2Qa' },
		],
	},
	{
		id: 'ws-url-click-301',
		name: 'Open a short link, with 301 redirects',
		description:
			'The same, but answered with 301s: a browser that has opened the link before remembers it, and goes straight to the long link. Here, 4 clicks in 10.',
		rps: 4000,
		hops: [
			{ ...toLb, label: 'GET /x7Kp2Qa, unless the browser remembers it', share: 0.6 },
			toApi,
			{ from: 'ws-url-api', to: 'ws-url-db', label: 'Look up x7Kp2Qa' },
		],
	},
	{
		id: 'ws-url-make-counter',
		name: 'Make a short link, from a counter',
		description:
			'Someone shortens a link. The link service asks the counter for the next number, writes it in base 62, and saves the link.',
		rps: 40,
		hops: [
			{ ...toLb, label: 'POST /api/links' },
			toApi,
			{ from: 'ws-url-api', to: 'ws-url-counter', label: 'Next number, please' },
			{ from: 'ws-url-api', to: 'ws-url-db', label: 'Save 15FTGg and its long link' },
		],
	},
	{
		id: 'ws-url-make-hash',
		name: 'Make a short link, from a hash',
		description:
			'Someone shortens a link. The link service hashes it, keeps 7 characters, and saves the link only if that code is free. Rarely, it’s taken, and it tries again.',
		rps: 40,
		hops: [
			{ ...toLb, label: 'POST /api/links' },
			toApi,
			{ from: 'ws-url-api', to: 'ws-url-db', label: 'Save 70AedYs, only if it’s free' },
			{
				from: 'ws-url-api',
				to: 'ws-url-db',
				label: 'Taken: hash again, and try again',
				share: 0.002,
			},
		],
	},
	{
		id: 'ws-url-make-keys',
		name: 'Make a short link, with a key made in advance',
		description:
			'Someone shortens a link. The link service copy takes the next key from its block, and saves the link. Once every 1,000 links, it asks the key service for a new block.',
		rps: 40,
		hops: [
			{ ...toLb, label: 'POST /api/links' },
			toApi,
			{
				from: 'ws-url-api',
				to: 'ws-url-keys',
				label: 'Out of keys: the next block of 1,000',
				share: 0.001,
			},
			{ from: 'ws-url-api', to: 'ws-url-db', label: 'Save x7Kp2Qa and its long link' },
		],
	},
	{
		id: 'ws-url-click-cache',
		name: 'Open a short link, with a cache',
		description:
			'Someone opens a short link. The link service asks the cache first, and the database only when the cache doesn’t have it.',
		rps: 4000,
		hops: [
			{ ...toLb, label: 'GET /x7Kp2Qa' },
			toApi,
			{ from: 'ws-url-api', to: 'ws-url-cache', label: 'Look up x7Kp2Qa' },
			{
				from: 'ws-url-cache',
				to: 'ws-url-db',
				label: 'Not there: read the database',
				onMiss: true,
			},
		],
	},
	{
		id: 'ws-url-click-full',
		name: 'Open a short link, in the whole design',
		description:
			'Someone opens a short link. The cache answers most; the rest are read from the shard the code hashes to. The click is published to the click stream and counted in the background.',
		rps: 4000,
		hops: [
			{ ...toLb, label: 'GET /x7Kp2Qa' },
			toApi,
			{ from: 'ws-url-api', to: 'ws-url-cache', label: 'Look up x7Kp2Qa' },
			...urlShards.map((to, i) => ({
				from: 'ws-url-cache',
				to,
				label: `Not there: read shard ${i + 1}`,
				onMiss: true,
				share: 1 / 3,
			})),
			{
				from: 'ws-url-api',
				to: 'ws-url-clicks',
				label: 'A click: x7Kp2Qa, 8:02 pm, India',
				mode: 'async' as const,
			},
			{
				from: 'ws-url-clicks',
				to: 'ws-url-worker',
				label: 'Count it',
				mode: 'async' as const,
			},
			{
				from: 'ws-url-worker',
				to: 'ws-url-stats',
				label: 'Add it to the totals',
				mode: 'async' as const,
			},
		],
	},
	{
		id: 'ws-url-make-shards',
		name: 'Make a short link, in the whole design',
		description:
			'Someone shortens a link. It gets a key from the link service copy’s block, and is saved in the shard its code hashes to.',
		rps: 40,
		hops: [
			{ ...toLb, label: 'POST /api/links' },
			toApi,
			{
				from: 'ws-url-api',
				to: 'ws-url-keys',
				label: 'Out of keys: the next block of 1,000',
				share: 0.001,
			},
			...urlShards.map((to, i) => ({
				from: 'ws-url-api',
				to,
				label: `Save it in shard ${i + 1}`,
				share: 1 / 3,
			})),
		],
	},
];

const feedIn = { from: 'ws-feed-app', to: 'ws-feed-lb' };
const toPosts = { from: 'ws-feed-lb', to: 'ws-feed-posts', label: 'Pass it to a copy' };
const toFeed = { from: 'ws-feed-lb', to: 'ws-feed-svc', label: 'Pass it to a copy' };
const readFeed = [
	{ ...feedIn, label: 'GET /feed' },
	toFeed,
	{
		from: 'ws-feed-svc',
		to: 'ws-feed-cache',
		label: 'Riya’s feed: the newest post ids',
	},
	// someone back after weeks has no feed kept: it's built from the newest posts of all 200
	{
		from: 'ws-feed-cache',
		to: 'ws-feed-postdb',
		label: 'Not kept: build it from the newest posts',
		onMiss: true,
		calls: 200,
	},
	{ from: 'ws-feed-svc', to: 'ws-feed-postcache', label: 'Fetch those posts' },
	{
		from: 'ws-feed-postcache',
		to: 'ws-feed-postdb',
		label: 'Not there: read them',
		onMiss: true,
	},
];
const bigAccounts = {
	from: 'ws-feed-svc',
	to: 'ws-feed-postcache',
	label: 'The newest posts from the 4 big accounts she follows',
	calls: 4,
};
const feedJourneys: Journeys = [
	{
		id: 'ws-feed-post',
		name: 'Post something',
		description: 'Riya posts a photo. The post service saves it in the post database.',
		rps: 20,
		hops: [
			{ ...feedIn, label: 'POST /posts' },
			toPosts,
			{ from: 'ws-feed-posts', to: 'ws-feed-postdb', label: 'Save post 9001' },
		],
	},
	{
		id: 'ws-feed-pull',
		name: 'Open the feed, built when it’s opened',
		description:
			'Riya opens her feed. The feed service finds the 200 accounts she follows, reads the newest posts from each, and merges them.',
		rps: 1000,
		hops: [
			{ ...feedIn, label: 'GET /feed' },
			toFeed,
			{ from: 'ws-feed-svc', to: 'ws-feed-follows', label: 'Who does Riya follow?' },
			{
				from: 'ws-feed-svc',
				to: 'ws-feed-postdb',
				label: 'The newest posts from each of 200 accounts',
				calls: 200,
			},
		],
	},
	{
		id: 'ws-feed-push-post',
		name: 'Post something, fanned out',
		description:
			'Riya posts. It’s saved, and in the background the fan-out worker adds it to each of her 200 followers’ feeds.',
		rps: 20,
		hops: [
			{ ...feedIn, label: 'POST /posts' },
			toPosts,
			{ from: 'ws-feed-posts', to: 'ws-feed-postdb', label: 'Save post 9001' },
			{
				from: 'ws-feed-posts',
				to: 'ws-feed-queue',
				label: 'Fan post 9001 out',
				mode: 'async',
			},
			// the worker's capacity counts feed writes: an ordinary post is 200 of them
			{
				from: 'ws-feed-queue',
				to: 'ws-feed-worker',
				label: 'Hand out the job',
				mode: 'async',
				work: 200,
			},
			{
				from: 'ws-feed-worker',
				to: 'ws-feed-follows',
				label: 'Who follows Riya?',
				mode: 'async',
			},
			{
				from: 'ws-feed-worker',
				to: 'ws-feed-cache',
				label: 'Add 9001 to each follower’s feed',
				mode: 'async',
				calls: 200,
			},
		],
	},
	{
		id: 'ws-feed-push-read',
		name: 'Open the feed, made in advance',
		description:
			'Riya opens her feed. It’s already in the feed cache, as a list of post ids, and the posts are fetched from the post cache.',
		rps: 1000,
		hops: readFeed,
	},
	{
		id: 'ws-feed-celeb',
		name: 'A big account posts, fanned out',
		description:
			'A singer with 2 million followers posts. Fanned out on write, that’s 2 million feed writes for one post. Big accounts post about once every 100 seconds between them.',
		rps: 0.01,
		hops: [
			{ ...feedIn, label: 'POST /posts' },
			toPosts,
			{ from: 'ws-feed-posts', to: 'ws-feed-postdb', label: 'Save the singer’s post' },
			{ from: 'ws-feed-posts', to: 'ws-feed-queue', label: 'Fan it out', mode: 'async' },
			{
				from: 'ws-feed-queue',
				to: 'ws-feed-worker',
				label: 'Hand out the job',
				mode: 'async',
				work: 2_000_000,
			},
			{
				from: 'ws-feed-worker',
				to: 'ws-feed-follows',
				label: 'Who follows the singer?',
				mode: 'async',
			},
			{
				from: 'ws-feed-worker',
				to: 'ws-feed-cache',
				label: 'Add it to each follower’s feed',
				mode: 'async',
				calls: 2_000_000,
			},
		],
	},
	{
		id: 'ws-feed-hybrid-post',
		name: 'A big account posts, not fanned out',
		description:
			'A singer with 2 million followers posts. It’s only saved: followers fetch it when they open their feeds.',
		rps: 0.01,
		hops: [
			{ ...feedIn, label: 'POST /posts' },
			toPosts,
			{
				from: 'ws-feed-posts',
				to: 'ws-feed-postdb',
				label: 'Save the singer’s post: a big account, so no fan-out',
			},
		],
	},
	{
		id: 'ws-feed-hybrid-read',
		name: 'Open the feed, mixed',
		description:
			'Riya opens her feed. Her ready-made list comes from the feed cache, and the newest posts from the big accounts she follows are fetched and merged in.',
		rps: 1000,
		hops: [...readFeed, bigAccounts],
	},
	{
		id: 'ws-feed-ranked',
		name: 'Open the feed, ranked',
		description:
			'Riya opens her feed. A few hundred candidate posts are gathered, and the ranking service scores them, best first. If it can’t, the feed shows newest first.',
		rps: 1000,
		hops: [
			...readFeed,
			bigAccounts,
			{
				from: 'ws-feed-svc',
				to: 'ws-feed-rank',
				label: 'Score them, best first',
				optional: true,
			},
		],
	},
	{
		id: 'ws-feed-photos',
		name: 'See the photos in the feed',
		description:
			'Each screen of the feed shows about 10 photos, downloaded from a CDN server nearby. Only photos it doesn’t have yet come from media storage.',
		rps: 1000,
		hops: [
			{
				from: 'ws-feed-app',
				to: 'ws-feed-cdn',
				label: 'Download the photos on screen',
				calls: 10,
			},
			{
				from: 'ws-feed-cdn',
				to: 'ws-feed-media',
				label: 'Not there: fetch it from storage',
				onMiss: true,
				calls: 10,
			},
		],
	},
];

const riyaIn = { from: 'ws-chat-riya', to: 'ws-chat-lb' };
const toS1 = { from: 'ws-chat-lb', to: 'ws-chat-s1', label: 'Along Riya’s connection' };
const save42 = { from: 'ws-chat-s1', to: 'ws-chat-db', label: 'Save it as number 42 in this chat' };
const findArjun = {
	from: 'ws-chat-s1',
	to: 'ws-chat-registry',
	label: 'Which server is Arjun on?',
	mode: 'async' as const,
};
const pushArjun = {
	from: 'ws-chat-s2',
	to: 'ws-chat-arjun',
	label: 'Push: a message from Riya',
	mode: 'async' as const,
};
const chatJourneys: Journeys = [
	{
		id: 'ws-chat-connect',
		name: 'Open the chat connection',
		description:
			'Riya opens the app. It opens a WebSocket to a chat server, which writes down where she is.',
		rps: 5000,
		hops: [
			{ ...riyaIn, label: 'Open a WebSocket, and keep it open' },
			{
				from: 'ws-chat-lb',
				to: 'ws-chat-s1',
				label: 'To the chat server with the fewest connections',
			},
			{ from: 'ws-chat-s1', to: 'ws-chat-registry', label: 'Riya is on chat server 1' },
		],
	},
	{
		id: 'ws-chat-send',
		name: 'Send a message',
		description:
			'Riya sends Arjun a message. Chat server 1 saves it, then finds Arjun’s server and passes it on, and that server pushes it to his phone.',
		rps: 20000,
		hops: [
			{ ...riyaIn, label: 'For Arjun: On my way!' },
			toS1,
			save42,
			findArjun,
			{ from: 'ws-chat-s1', to: 'ws-chat-s2', label: 'A message for Arjun', mode: 'async' },
			pushArjun,
		],
	},
	{
		id: 'ws-chat-receipt',
		name: 'Delivered and read ticks',
		description:
			'Arjun’s phone says it got message 42, and later that he read it. Each receipt travels back to Riya the same way a message does.',
		rps: 40000,
		hops: [
			{ from: 'ws-chat-arjun', to: 'ws-chat-lb', label: 'Delivered: 42' },
			{ from: 'ws-chat-lb', to: 'ws-chat-s2', label: 'Along Arjun’s connection' },
			{ from: 'ws-chat-s2', to: 'ws-chat-db', label: 'Mark 42 delivered' },
			{
				from: 'ws-chat-s2',
				to: 'ws-chat-registry',
				label: 'Which server is Riya on?',
				mode: 'async',
			},
			{ from: 'ws-chat-s2', to: 'ws-chat-s1', label: 'A receipt for Riya', mode: 'async' },
			{ from: 'ws-chat-s1', to: 'ws-chat-riya', label: 'Two ticks on 42', mode: 'async' },
		],
	},
	{
		id: 'ws-chat-heartbeat',
		name: 'Still here',
		description:
			'Every 30 seconds, each open app says it’s still there, and the presence store marks it online for 60 more seconds.',
		rps: 200000,
		hops: [
			{ ...riyaIn, label: 'Heartbeat: still here' },
			toS1,
			{
				from: 'ws-chat-s1',
				to: 'ws-chat-presence',
				label: 'Riya is online, for 60 more seconds',
			},
		],
	},
	{
		id: 'ws-chat-group',
		name: 'Send to a group',
		description:
			'Riya writes in a family group of 50. The message is saved once, and a copy goes to every member’s server.',
		rps: 2000,
		hops: [
			{ ...riyaIn, label: 'For the Family group: Dinner at 8?' },
			toS1,
			{
				from: 'ws-chat-s1',
				to: 'ws-chat-db',
				label: 'Save it once, as number 318 in the group',
			},
			{
				from: 'ws-chat-s1',
				to: 'ws-chat-registry',
				label: 'Where are the 50 members?',
				mode: 'async',
			},
			{
				from: 'ws-chat-s1',
				to: 'ws-chat-s2',
				label: 'A copy for each member',
				mode: 'async',
				calls: 50,
			},
			{
				from: 'ws-chat-s2',
				to: 'ws-chat-arjun',
				label: 'Push: new in Family',
				mode: 'async',
				calls: 50,
			},
		],
	},
	{
		id: 'ws-chat-send-full',
		name: 'Send a message, online or not',
		description:
			'Riya sends Arjun a message. If he’s online, it’s pushed to his phone; if not, a notification goes through Apple’s or Google’s push service. Here, 3 in 10 are for someone offline.',
		rps: 20000,
		hops: [
			{ ...riyaIn, label: 'For Arjun: On my way!' },
			toS1,
			save42,
			findArjun,
			{
				from: 'ws-chat-s1',
				to: 'ws-chat-s2',
				label: 'Arjun is online: a message for him',
				mode: 'async',
				share: 0.7,
			},
			pushArjun,
			{
				from: 'ws-chat-s1',
				to: 'ws-chat-queue',
				label: 'Arjun is offline: notify him',
				mode: 'async',
				share: 0.3,
			},
			{ from: 'ws-chat-queue', to: 'ws-chat-push', label: 'Hand out the job', mode: 'async' },
			{
				from: 'ws-chat-push',
				to: 'ws-chat-apns',
				label: 'Notify Arjun’s phone',
				mode: 'async',
			},
		],
	},
	{
		id: 'ws-chat-devices',
		name: 'Send a message, to every device',
		description:
			'Riya sends Arjun a message. He’s signed in on his phone and his laptop, so a copy goes to each.',
		rps: 20000,
		hops: [
			{ ...riyaIn, label: 'For Arjun: On my way!' },
			toS1,
			save42,
			{
				from: 'ws-chat-s1',
				to: 'ws-chat-registry',
				label: 'Where are Arjun’s devices?',
				mode: 'async',
			},
			{
				from: 'ws-chat-s1',
				to: 'ws-chat-s2',
				label: 'A copy for each of Arjun’s devices',
				mode: 'async',
				calls: 2,
			},
			{ ...pushArjun, calls: 2 },
		],
	},
];

export const wholeSystemsTrack: TrackModule = {
	track: wholeSystems,
	parts: [...urlParts, ...feedParts, ...chatParts],
	journeys: [...shopJourneys, ...urlJourneys, ...feedJourneys, ...chatJourneys],
};
