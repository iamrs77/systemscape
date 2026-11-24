import type { Track } from '@/learn/course';
import type { Conditions } from '@/sim/scenario';
import { type TrackModule, roomy } from './shared';

/** The Stock service's three copies, drawn apart, for finding them as they come and go. */
const stockCopies = ['ar-stock-1', 'ar-stock-2', 'ar-stock-3'];
/** `from` picking one of the Stock service's copies, and that copy taking the kettle. */
const pickStock = (from: string, label: string) => [
	...stockCopies.map((to) => ({ from, to, label, pick: true, share: 1 / 3 })),
	...stockCopies.map((copy) => ({ from: copy, to: 'ar-stock-db', label: 'Take one from stock' })),
];

// lesson 1: one app, or many services
const mono: Conditions = { only: ['ar-mono-order'], copies: { server: 3 } };
// both designs at once, so the monolith's numbers stay the same when they're compared
const both: Conditions = { ...mono, only: ['ar-mono-order', 'ar-ms-order'] };
const ms: Conditions = { only: ['ar-ms-order'] };
const msParts = [
	'app',
	'lb',
	'ar-orders',
	'ar-orders-db',
	'ar-pay',
	'ar-pay-db',
	'payments',
	'stock-svc',
	'ar-stock-db',
	'delivery',
	'ar-delivery-db',
];
const monoParts = ['app', 'lb', 'server', 'db', 'payments'];

// lesson 2: finding the copies
const fixed: Conditions = { only: ['ar-find-fixed'] };
const registered: Conditions = { only: ['ar-find-registry'] };
const findParts = ['app', 'lb', 'ar-orders', ...stockCopies, 'ar-stock-db'];
const lbParts = ['app', 'lb', 'ar-orders', 'ar-stock-lb', ...stockCopies, 'ar-stock-db'];
const mesh: Conditions = {
	only: ['ar-find-mesh'],
	slow: { 'ar-stock-3': 10 },
	balancing: { 'ar-sidecar': 'least-connections' },
};

// lesson 3: one order, three databases
const saga: Conditions = { only: ['ar-saga'] };
const flashSale = 3;
const sagaParts = [
	'app',
	'lb',
	'ar-orders',
	'ar-orders-db',
	'ar-pay',
	'ar-pay-db',
	'payments',
	'stock-svc',
	'row',
	'delivery',
	'ar-delivery-db',
];

// lesson 4: batches and streams
const reporting: Conditions = {
	only: ['ar-report-db', 'look-lb'],
	traffic: 2,
	copies: { server: 3 },
};
const batching: Conditions = { only: ['ar-views-batch'], copies: { server: 2 } };
const streaming: Conditions = { only: ['ar-views-stream'], copies: { server: 2 } };
const sale: Conditions = {
	only: ['ar-views-stream'],
	traffic: 3,
	copies: { server: 3 },
	bigger: roomy,
};
const batchParts = ['app', 'lb', 'server', 'db', 'events', 'ar-lake', 'ar-batch', 'ar-warehouse'];
const streamParts = ['app', 'lb', 'server', 'db', 'events', 'ar-stream', 'ar-live'];

const architecture: Track = {
	id: 'architecture',
	name: 'Architecture',
	tagline:
		'How a big app is split into services, how they find each other, how they keep data right across them, and how big piles of data are processed.',
	lessons: [
		{
			id: 'monolith-microservices',
			title: 'Monolith or microservices',
			summary:
				'One app, or many small services: what each costs, why services follow teams, when to split, and how to move over a piece at a time.',
			steps: [
				{
					title: 'One app, one database',
					show: monoParts,
					journey: 'ar-mono-order',
					set: both,
					copies: true,
					facts: ['succeed', 'wait', { copies: 'server' }],
					body: [
						'So far, the shop has been one program. The same **Web server** code shows products, keeps carts, takes orders, counts stock and books deliveries, and it keeps all its data in one **Database**. That’s a monolith: one app, built, tested and deployed as one piece.',
						'Placing an order is simple here. The parts of the code call each other as ordinary functions, which takes far less than a millisecond. Saving the order, taking the kettle from stock and booking the van happen in one transaction: all of it, or none.',
						'It still grows: run more copies of the whole app behind the load balancer, three here. Most apps start like this, and many big ones stay this way: Shopify and Stack Overflow are well-known monoliths.',
					],
					example: {
						says: 'POST /orders, for order 5521.',
						data: {
							'one program': 'charges ₹1,499 through the payment provider',
							'then, in one transaction':
								'saves the order, takes one Blue kettle, books a van',
							answer: 'Order 5521 placed',
						},
					},
				},
				{
					title: 'Walls inside: a modular monolith',
					show: monoParts,
					journey: 'ar-mono-order',
					set: both,
					copies: true,
					body: [
						'A monolith doesn’t have to be a tangle. In a modular monolith, the code is split into modules, one for each part of the business: orders, stock, payments, delivery.',
						'Each module owns its own tables, and other modules may only call the functions it chooses to share. So the stock team can change how stock is stored without breaking the orders code. A tool can check the rules on every change: Shopify built one, called Packwerk.',
						'It keeps the monolith’s simplicity, and a module can be moved out into a service of its own later, if it ever needs to be.',
					],
					example: {
						says: 'The shop’s code, in modules.',
						data: {
							'orders/': 'calls stock.take(kettle, 1), never the stock tables',
							'stock/': 'owns the stock tables',
							'payments/': 'owns the payment records',
							'delivery/': 'owns the van bookings',
						},
					},
				},
				{
					title: 'One bug, and the whole shop is down',
					show: monoParts,
					journey: 'ar-mono-order',
					draw: ['look-lb'],
					set: { ...mono, only: ['ar-mono-order', 'look-lb'], down: ['server'] },
					copies: true,
					facts: [
						{ succeed: 'look-lb', label: 'Product pages work' },
						{ succeed: 'ar-mono-order', label: 'Orders work' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The shop grows to 80 developers in 8 teams, all changing the same program. A change to the gift-wrap code has a memory leak. Every copy runs the same code, so every copy runs out of memory and crashes, and nobody can even look at a product.',
						'Size brings other pains. Every team’s changes go out together, so one team’s mistake holds back everyone’s release. The code takes ages to build and test. Every part has to use the same language. And it all grows together: you can’t give only the busy part more copies.',
					],
				},
				{
					title: 'Split into services',
					show: msParts,
					journey: 'ar-ms-order',
					current: [
						['ar-orders', 'ar-pay'],
						['ar-orders', 'stock-svc'],
						['ar-orders', 'delivery'],
					],
					set: ms,
					facts: ['succeed'],
					body: [
						'With microservices, the shop is split into small programs, each doing one job for the business: an **Order service**, a **Payment service**, a **Stock service** and a **Delivery service**. Each is deployed on its own, whenever its team likes, and grown on its own, with as many copies as it needs.',
						'Each owns its own data. The **Stock database** belongs to the Stock service, and no other service reads its tables: to know how many kettles are left, you ask the Stock service. So a team can change its tables, or even its kind of database, without breaking anyone.',
						'They talk over the network, with REST or RPC calls, or with events. Each is owned by one team, and small enough for that team to understand whole. Amazon, Netflix and Uber all work this way.',
					],
					example: {
						says: 'The Order service asks the Stock service.',
						data: {
							request: 'POST stock.internal/reservations',
							body: '{ "order": 5521, "product": "Blue kettle", "quantity": 1 }',
							answer: '201 Created: one kettle taken',
						},
					},
				},
				{
					title: 'Every call crosses the network',
					show: msParts,
					journey: 'ar-ms-order',
					set: both,
					timeline: true,
					facts: [
						{ wait: 'ar-mono-order', label: 'Wait, one app' },
						{ wait: 'ar-ms-order', label: 'Wait, four services' },
					],
					body: [
						'In one app, the order code called the stock code as a function. Now it’s a request over the network: turned into bytes, sent, read, checked and answered. And each service asks its own database too.',
						'Each call adds only a few milliseconds, but they add up: placing an order takes 132 ms now, not 77 ms. A page that calls ten services, some of which call others, adds up to far more.',
						'There’s more to pay. A question across services, like “which shoppers in Pune bought a kettle?”, can’t be one database query any more. No transaction covers the whole order, the subject of a later lesson. And instead of one app, there are dozens to deploy, watch and trace.',
					],
				},
				{
					title: 'One slow service slows every order',
					show: msParts,
					journey: 'ar-ms-order',
					set: { ...ms, slow: { delivery: 10 } },
					facts: ['wait', { busy: 'delivery' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The **Delivery service** has a bad day: a slow query makes each request take ten times as long. The Order service waits for it on every order, so every order now takes 267 ms.',
						'If it stops answering altogether, every order fails after a timeout, even though payment and stock are fine. Services split apart, but still waiting on each other for everything, are called a distributed monolith: the costs of microservices, without the independence.',
					],
				},
				{
					title: 'Wait only for what you must',
					show: [...msParts, 'events'],
					journey: 'ar-ms-order-event',
					current: [
						['ar-orders', 'events'],
						['events', 'delivery'],
					],
					set: { only: ['ar-ms-order-event'], down: ['delivery'] },
					facts: ['succeed', 'wait'],
					tags: [{ text: 'It keeps working', tone: 'plain' }],
					body: [
						'Riya doesn’t need the van booked before she sees “order placed”. So the Order service publishes an event, “order 5521 placed”, to the **Event stream**, and the Delivery service books a van when it reads it.',
						'Now, even with the Delivery service down, every order works, in 105 ms. The bookings wait in the stream, and are made when it’s back.',
						'Services that call each other less, and carry on when another is down, are loosely coupled. That’s what makes splitting worth it. For the calls that remain, the reliability track’s timeouts, retries and circuit breakers help.',
					],
				},
				{
					title: 'Services follow teams: Conway’s law',
					show: msParts,
					journey: 'ar-ms-order',
					set: ms,
					body: [
						'In 1968, Melvin Conway wrote that a system’s design copies the way the people building it talk to each other. Four teams building a shop tend to build it in four parts, joined where the teams talk. That’s Conway’s law.',
						'So services are drawn around teams, and teams around parts of the business. Each team builds its service, deploys it, and is woken up when it breaks: “you build it, you run it”, as Amazon puts it. Amazon also keeps each team small enough to feed with two pizzas.',
						'Some companies use the law on purpose: they arrange the teams the way they want the system to look. That’s called the inverse Conway manoeuvre.',
					],
					example: {
						says: 'Teams, and the services they own.',
						data: {
							'Checkout team': 'Order service',
							'Payments team': 'Payment service',
							'Warehouse team': 'Stock service',
							'Delivery team': 'Delivery service',
						},
					},
				},
				{
					title: 'When to split, and when not',
					show: msParts,
					journey: 'ar-ms-order',
					set: ms,
					body: [
						'Split when the monolith slows people down: many teams waiting on one release, parts that need very different amounts of computing, or a part that must keep working when the rest breaks. Payments, with strict rules of its own, is often one of the first to go.',
						'Don’t split a small team’s app, or a new product whose parts aren’t clear yet: walls drawn in the wrong place are costly to move once they’re network calls. Many teams start with a modular monolith, and move a module out only when they must. Martin Fowler calls this “monolith first”.',
						'It can go the other way too. In 2023, a team at Amazon Prime Video moved a tool that checks video quality from many separate pieces back into one program, and cut its cost by 90%.',
					],
					note: {
						title: 'A rule of thumb',
						text: 'If two services always have to change and deploy together, they’re really one. If one small team owns ten services, it has more to run than it needs.',
					},
				},
				{
					title: 'Moving over: the strangler fig',
					show: ['app', 'lb', 'server', 'db', 'ar-orders', 'ar-orders-db'],
					journey: 'ar-strangler',
					draw: ['look-lb'],
					current: [
						['lb', 'ar-orders'],
						['ar-orders', 'server'],
					],
					set: { only: ['ar-strangler', 'look-lb'], copies: { server: 3 } },
					copies: true,
					facts: [{ load: 'ar-orders' }, { load: 'server' }],
					body: [
						'Rewriting a whole monolith at once is risky: for months nothing new ships, and on its first day the new system must match years of small fixes. So teams move one piece at a time.',
						'The **Load balancer**, or an API gateway, reads each request’s address. Orders, sent to /orders, now go to the new **Order service**, and everything else still goes to the old app. Where the Order service still needs something only the old app does, like taking stock, it asks the old app.',
						'Piece by piece, more moves over, until the old app is small, or gone. Martin Fowler named this after the strangler fig, a vine that grows around a tree until it stands on its own.',
					],
					example: {
						says: 'The load balancer’s routes.',
						data: {
							'/orders': 'the new Order service',
							'everything else': 'the old app, for now',
						},
					},
				},
				{
					title: 'Which one when',
					show: msParts,
					journey: 'ar-ms-order',
					set: ms,
					body: [
						'Choose by the size of the teams and the problem, not by fashion. Many problems blamed on monoliths are really tangled code, and a modular monolith fixes that for far less.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Monolith',
								'One small team, a new product, or parts that change together. The simplest to build, test, deploy and debug.',
							],
							[
								'Modular monolith',
								'Several teams in one codebase. Clear walls inside, one thing to run, and modules ready to move out later.',
							],
							[
								'Microservices',
								'Many teams that need to ship on their own, parts that grow very differently, or parts that must keep working when others break. Costs network waits, spread-out data and much more to run.',
							],
							[
								'Distributed monolith',
								'Never on purpose: services that must change, deploy and stay up together. The costs of both, and the benefits of neither.',
							],
							[
								'Strangler fig',
								'Moving from one to the other: a piece at a time, behind a router.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the four services. Take each one down in turn, from its details, and see that orders stop every time: that’s the cost of waiting on each other.',
				journey: 'ar-ms-order',
				set: ms,
			},
		},
		{
			id: 'service-discovery',
			title: 'Service discovery',
			summary:
				'How one service finds the copies of another as they come and go: addresses in config, DNS, registries and heartbeats, load balancers, Kubernetes, and service meshes.',
			steps: [
				{
					title: 'Where is the Stock service?',
					show: findParts,
					journey: 'ar-find-fixed',
					current: stockCopies.map((copy): [string, string] => ['ar-orders', copy]),
					set: fixed,
					facts: [{ busyEach: stockCopies }],
					body: [
						'For every order, the **Order service** asks the Stock service to take one kettle. The Stock service runs as three copies, each on its own machine, with its own address. Which addresses should the Order service call?',
						'They don’t stay put. Autoscaling adds copies at 8 pm and removes them at midnight, every deploy replaces each copy with a new one, and machines die. In the cloud, and in containers, a new copy usually gets a new address.',
						'So the Order service needs an up-to-date list of the copies running now. Finding them is called service discovery.',
					],
					example: {
						says: 'The Stock service’s copies, right now.',
						data: {
							'Stock service 1': '10.0.2.11, port 8080',
							'Stock service 2': '10.0.2.12, port 8080',
							'Stock service 3': '10.0.2.13, port 8080',
						},
					},
				},
				{
					title: 'Addresses written down',
					show: findParts,
					journey: 'ar-find-fixed',
					set: fixed,
					facts: [{ busyEach: stockCopies }],
					body: [
						'The simplest way is to write the addresses in the Order service’s settings. It takes turns between them, and each copy is 40% busy. That’s fine for things that rarely move, like a database at a fixed address, but every change means editing the settings and restarting every caller.',
						'A step up is DNS: one name, stock.internal, that gives the addresses of all the copies, changed in one place. But callers remember each answer for as long as the name says, and some programs for longer, so changes are slow to reach them. And plain DNS doesn’t know whether a copy is healthy.',
					],
					example: {
						says: 'Looking up stock.internal.',
						data: {
							answer: '10.0.2.11, 10.0.2.12, 10.0.2.13',
							'remember it for': '60 seconds',
						},
					},
				},
				{
					title: 'A copy dies, and nobody says',
					show: findParts,
					journey: 'ar-find-fixed',
					set: { ...fixed, down: ['ar-stock-2'], healthChecks: false },
					facts: ['succeed', 'wait', { busyEach: stockCopies }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'**Stock service 2** crashes. Its address is still on the list, so the Order service still sends it every third order, and each of those waits 2 seconds for a timeout, then fails.',
						'One order in three fails, and the average order takes 697 ms, while the two healthy copies have plenty of room. The list has to change by itself, as copies come and go.',
					],
				},
				{
					title: 'A service registry',
					show: [...findParts, 'ar-registry'],
					journey: 'ar-find-registry',
					current: [
						['ar-orders', 'ar-registry'],
						...stockCopies.map((copy): [string, string] => [copy, 'ar-registry']),
					],
					set: registered,
					facts: ['succeed', 'wait', { busyEach: stockCopies }],
					about: 'ar-registry',
					body: [
						'A **Service registry** keeps the list. When a copy starts, it registers: its service’s name, its address, and how to check on it. While it runs, it keeps saying it’s alive, every few seconds: a heartbeat. Or the registry checks on it, like a load balancer’s health check.',
						'The Order service asks the registry for the Stock service’s copies, keeps the list in memory, and is told when it changes, or asks again every so often. The registry isn’t asked on every order, so it adds nothing to the wait. The Order service then picks a copy itself, for each call. That’s client-side discovery: the caller chooses, and nothing stands in between.',
						'Consul, etcd, ZooKeeper and Netflix’s Eureka are common registries.',
					],
					example: {
						says: 'Stock service 3 registers as it starts.',
						data: {
							service: 'stock',
							address: '10.0.2.13, port 8080',
							check: 'GET /health, every 10 seconds',
						},
					},
				},
				{
					title: 'A copy dies, and is dropped',
					show: [...findParts, 'ar-registry'],
					journey: 'ar-find-registry',
					set: { ...registered, down: ['ar-stock-2'] },
					facts: ['succeed', { busyEach: stockCopies }],
					body: [
						'Stock service 2 crashes again. Its heartbeats stop, and after a few are missed, the registry drops it and tells the callers. The other two copies take its share, at 60% busy each, and every order works.',
						'In the seconds before it’s dropped, a few calls still go to it. So callers keep timeouts short, and try a failed call again on another copy. A copy that’s stopped on purpose, for a deploy, takes itself off the registry first, and stops only once callers have heard, so nothing fails.',
					],
					example: {
						says: 'Eureka, as it comes.',
						data: {
							'each copy says it’s alive': 'every 30 seconds',
							'counted as gone': 'after 90 seconds without a word',
						},
					},
				},
				{
					title: 'The registry breaks',
					show: [...findParts, 'ar-registry'],
					journey: 'ar-find-registry',
					set: { ...registered, down: ['ar-registry'] },
					facts: ['succeed'],
					tags: [{ text: 'It keeps working', tone: 'plain' }],
					body: [
						'If the registry stops, callers keep the last list they got, so orders carry on. But nothing can change: new copies can’t be found, and a copy that dies now isn’t dropped.',
						'So a registry runs as three or five servers. etcd, Consul and ZooKeeper agree on every change by a majority vote, as in the consensus lesson: the list never splits into two versions, but a server cut off from the rest refuses changes. Eureka chooses the other way: each server keeps answering, even if they disagree for a while.',
					],
				},
				{
					title: 'A load balancer in between',
					show: lbParts,
					journey: 'ar-find-lb',
					current: [['ar-orders', 'ar-stock-lb']],
					set: { only: ['ar-find-lb'] },
					facts: ['succeed', 'wait'],
					timeline: true,
					body: [
						'The other way is to put an **Internal load balancer** in front of the copies. The Order service knows only its address, and the load balancer keeps track of the copies, with health checks or from the registry. That’s server-side discovery.',
						'Callers stay simple, in any language, with nothing to install. The cost is one more hop on every call, here about a millisecond, and one more thing to run, in pairs, so it isn’t a single point of failure. AWS’s internal load balancers work this way.',
						'Client-side discovery skips that hop, and lets each caller choose cleverly. But every service, in every language it’s written in, needs the code that asks the registry and picks a copy.',
					],
				},
				{
					title: 'Kubernetes Services',
					show: lbParts,
					journey: 'ar-find-lb',
					set: { only: ['ar-find-lb'] },
					body: [
						'Kubernetes, which runs containers across many machines, builds discovery in. Each copy runs in a pod, and Kubernetes knows every pod it starts. A Service gives a group of pods one name, and one address that never changes.',
						'The Order service just calls stock. Kubernetes’ own DNS turns the name into the Service’s address, and rules on every machine pass each connection on to one of the ready pods. A pod is ready once its readiness check passes, by default checked every 10 seconds, and it’s taken out after 3 failures in a row.',
						'So it’s server-side discovery, without a separate load balancer machine. In this picture, the internal load balancer stands for those rules.',
					],
					example: {
						says: 'The Order service calls the Stock service.',
						data: {
							'it looks up': 'stock.shop.svc.cluster.local',
							'DNS answers': '10.96.0.42, the Service’s steady address',
							'passed on to': 'one of the 3 ready stock pods',
						},
					},
					note: {
						title: 'One connection, one pod',
						text: 'Those rules pick a pod when a connection opens. gRPC keeps one connection open and sends every call down it, so all of one caller’s calls land on the same pod. That’s one reason teams add a service mesh.',
					},
				},
				{
					title: 'A service mesh: a proxy beside every copy',
					show: [
						'app',
						'lb',
						'ar-orders',
						'ar-sidecar',
						'ar-registry',
						...stockCopies,
						'ar-stock-db',
					],
					journey: 'ar-find-mesh',
					current: [['ar-orders', 'ar-sidecar']],
					set: mesh,
					facts: ['succeed', { load: 'ar-stock-3' }, { load: 'ar-stock-1' }],
					body: [
						'A service mesh puts a small proxy beside every copy of every service, a sidecar, like Envoy. The Order service sends each call to its own **Sidecar proxy**, on the same machine, and the sidecar does the rest: finds the copies, picks one, sets a timeout, tries a failed call again on another copy, and encrypts it, each side proving who it is. That’s mutual TLS.',
						'Here, **Stock service 3** falls sick, ten times as slow. The sidecars send each call to the copy with the fewest open, so it gets about 3 calls a second, against 29 for each of the others, and every order works. Every service gets the same retries, encryption and measurements, whatever language it’s written in, without changing its code.',
						'A control plane, like Istio or Linkerd, gives every sidecar its list of copies and its rules. The cost: a proxy beside every copy, using memory and adding a little wait, and one more complicated system to learn and run.',
					],
				},
				{
					title: 'Which one when',
					show: [...findParts, 'ar-registry'],
					journey: 'ar-find-registry',
					set: registered,
					body: [
						'Every way keeps a list of the copies running now. They differ in who keeps it, and who picks a copy from it.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Addresses in config',
								'A few servers that rarely move, like a database. Every change means a restart.',
							],
							[
								'DNS names',
								'Simple, and works with anything. Slow to change, and blind to health unless something updates it.',
							],
							[
								'A registry, client-side',
								'Callers pick copies themselves, with no extra hop. Every service needs the code for it, in its own language. Eureka, Consul.',
							],
							[
								'A load balancer, server-side',
								'Callers stay simple. One more hop, and one more thing to run.',
							],
							[
								'Kubernetes Services',
								'When you run on Kubernetes: built in, by name.',
							],
							[
								'A service mesh',
								'Many services, in many languages, that all need retries, encryption and measurements. Istio, Linkerd. A lot to run.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the registry. Take a Stock service copy down from its details, then select the Order service and turn its health checks off, to see a list that never changes.',
				journey: 'ar-find-registry',
				set: registered,
			},
		},
		{
			id: 'sagas',
			title: 'Sagas and distributed transactions',
			summary:
				'One order, three services, three databases: two-phase commit and why services rarely use it, and sagas, which undo what’s been done.',
			steps: [
				{
					title: 'One order, three services',
					show: sagaParts,
					journey: 'ar-saga',
					set: saga,
					facts: ['succeed', 'wait'],
					body: [
						'Riya buys the Blue kettle. Her order needs three things: the **Payment service** charges ₹1,499, the **Stock service** takes one kettle off the **Kettle stock row** in its database, and the **Delivery service** books a van.',
						'In one database, a transaction made them all happen or none, as in the transactions lesson. But here each service has its own database. Each can make its own part all or nothing, but no transaction spans all three: one database can’t lock or undo another’s rows.',
						'A change that must happen in several places, all or nothing, is a distributed transaction. It’s one of the hardest problems in system design.',
					],
				},
				{
					title: 'Charged, but no kettle',
					show: sagaParts,
					journey: 'ar-saga',
					set: { ...saga, down: ['stock-svc'] },
					facts: ['succeed', { load: 'ar-pay' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The Stock service goes down. Every order is charged, then fails when it asks for the kettle: 10 charges a second, and no orders.',
						'The same happens if the Order service crashes between the two calls, or the last kettle is sold in between. Riya has paid ₹1,499 for nothing, unless something notices and refunds her. With three services, any step can fail after the ones before it have worked.',
					],
					example: {
						says: 'Order 5521, half done.',
						data: {
							'Payment service': '₹1,499 charged',
							'Stock service': 'no answer',
							'Delivery service': 'never asked',
						},
					},
				},
				{
					title: 'Two-phase commit',
					show: sagaParts,
					journey: 'ar-2pc',
					set: { only: ['ar-2pc'] },
					facts: ['succeed', 'wait'],
					body: [
						'One answer is two-phase commit. A transaction coordinator, here the **Order service**, runs a vote. Phase one: it asks every service to prepare. Each makes its change, keeps the rows it touched locked, and votes yes if it can promise to finish, or no.',
						'Phase two: if every vote is yes, the coordinator writes “commit” in its own log, then tells every service to commit, and they unlock. If any votes no, or doesn’t answer, it tells them all to undo.',
						'It really is all or nothing, across databases, though slower: two rounds of calls, and Riya waits 249 ms. Databases support it, like Postgres with PREPARE TRANSACTION, or any that follow the XA standard, and databases spread over many machines, like Google Spanner, use it inside.',
					],
					example: {
						says: 'The vote for order 5521.',
						data: {
							'Payment service': '₹1,499 held on the card, not taken yet: yes',
							'Stock service': 'one kettle set aside, row locked: yes',
							'Delivery service': 'van 12 held for 6 pm: yes',
							then: 'all yes: commit, all three',
						},
					},
				},
				{
					title: 'Why services rarely use it',
					show: sagaParts,
					journey: 'ar-2pc',
					set: { only: ['ar-2pc'], traffic: flashSale },
					facts: ['succeed', { busy: 'row' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A flash sale brings 30 orders a second for the kettle. Each keeps the kettle’s row locked through the whole vote, about five times as long as taking a kettle needs. So the row can take only 20 orders a second, and a third of orders fail.',
						'Worse, if the coordinator crashes after the votes, the services that voted yes can’t decide alone: they promised to commit if told to. So they wait, rows locked, until it’s back. One stuck coordinator blocks everyone.',
						'And every service has to be up at once, for every order. Many systems can’t take part at all, like Kafka, many NoSQL databases and most other companies’ APIs. So between services, two-phase commit is rarely used.',
					],
				},
				{
					title: 'A saga: steps that can be undone',
					show: sagaParts,
					journey: 'ar-saga',
					set: { ...saga, traffic: flashSale },
					facts: ['succeed', { busy: 'row' }],
					body: [
						'A saga gives up on all at once. It’s a series of steps, each a small transaction in one service, saved straight away. Every step has an undo, called a compensating action: a refund for a charge, putting the kettle back for taking it.',
						'If a step fails, the saga runs the undos of the steps before it, newest first. So the order ends up fully done, or fully undone, just not in one instant.',
						'Each step locks the row only for its own short transaction, so in the same sale the kettle’s row is 30% busy, and every order works. Sagas were first described in 1987, for database work too long to keep locked.',
					],
					example: {
						says: 'Order 5521, as a saga.',
						data: {
							'step 1: charge ₹1,499': 'undo: refund ₹1,499',
							'step 2: take one kettle': 'undo: put it back',
							'step 3: book a van': 'undo: cancel the booking',
						},
					},
				},
				{
					title: 'Sold out: refund the payment',
					show: [
						'app',
						'lb',
						'ar-orders',
						'ar-orders-db',
						'ar-pay',
						'ar-pay-db',
						'payments',
						'stock-svc',
						'row',
					],
					journey: 'ar-saga-undo',
					current: [
						['ar-orders', 'ar-pay'],
						['ar-pay', 'payments'],
					],
					set: { only: ['ar-saga-undo'] },
					facts: ['wait'],
					body: [
						'Riya’s card is charged, then the Stock service answers: none left. The last kettle sold a moment ago. So the Order service runs the undo for step 1, and the **Payment service** refunds ₹1,499. The order is marked cancelled, and Riya is told, 196 ms after she tapped.',
						'An undo isn’t time travel. The charge happened, and the refund is a new transaction: Riya may see both on her statement. Some steps can’t be undone at all, like an email that’s been sent, so they go last.',
					],
					example: {
						says: 'Order 5521, undone.',
						data: {
							'step 1': 'charged ₹1,499',
							'step 2': 'none left: failed',
							'undo step 1': 'refunded ₹1,499',
							order: 'cancelled, and Riya emailed',
						},
					},
					note: {
						title: 'Put the steps in a good order',
						text: 'First, what’s most likely to fail and easiest to undo, like setting the kettle aside. Then the charge. Last, what can’t be undone, like handing the parcel to the van.',
					},
				},
				{
					title: 'Orchestration: one part in charge',
					show: sagaParts,
					journey: 'ar-saga',
					current: [['ar-orders', 'ar-orders-db']],
					set: saga,
					facts: ['wait'],
					body: [
						'So far, the **Order service** has run the saga: it tells each service what to do, in order, and decides when to undo. That’s orchestration, and the Order service is the orchestrator.',
						'It writes each step in the **Orders database** as it goes: “5521: charged, taking stock”. If it crashes halfway, a new copy reads where each order got to, and carries on. Tools like Temporal, AWS Step Functions and Camunda do this bookkeeping for you.',
						'The whole flow is in one place, easy to read, change and check: where is order 5521? The cost is that the orchestrator knows every service, and too much logic can pile up in it. Here Riya waits for all three steps, 127 ms, but an orchestrator can also work in the background.',
					],
				},
				{
					title: 'Choreography: services react to events',
					show: [...sagaParts, 'events'],
					journey: 'ar-saga-events',
					set: { only: ['ar-saga-events'] },
					facts: ['succeed', 'wait'],
					tags: [{ text: 'Background: nobody waits', tone: 'background' }],
					body: [
						'With choreography, nobody is in charge. The Order service saves the order as pending, and publishes “order placed” to the **Event stream**. The Payment service hears it, charges, and publishes “payment taken”. The Stock service hears that, takes a kettle, and publishes “kettle taken”, and so on.',
						'An undo is an event too: if the kettle is gone, the Stock service publishes “out of stock”, and the Payment service, hearing it, refunds. Riya waits only for her order to be saved, 21 ms, and is told when it’s confirmed.',
						'Services know nothing about each other, only events, so adding one is easy. But the flow is spread over many services: nobody can read it in one place, and it’s hard to tell where order 5521 is stuck. It suits short flows; for long ones, many teams prefer an orchestrator.',
					],
				},
				{
					title: 'Twice, and in between',
					show: sagaParts,
					journey: 'ar-saga',
					set: saga,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Messages get lost and sent again, so any step may run twice. Each carries the order number, and is made idempotent: a second “charge order 5521” finds the charge already made, and does nothing. Undos must be idempotent too, and are retried until they work: a refund can’t give up.',
						'Each service saves its change and the event announcing it in one transaction of its own, with an outbox, so a crash can’t leave one without the other.',
						'And a saga isn’t isolated: halfway through, others can see its work. The kettle is taken for an order that may yet be refunded, so another shopper sees “sold out”. So in-between states are shown honestly, like “order pending”, and steps check again before they act.',
					],
					example: {
						says: 'Charge ₹1,499 for order 5521, sent twice.',
						data: {
							'first time': 'charged, but the answer was lost',
							'second time, same order': 'already charged: nothing more to do',
						},
					},
				},
				{
					title: 'Which one when',
					show: sagaParts,
					journey: 'ar-saga',
					set: saga,
					body: [
						'The best distributed transaction is the one you don’t need. Draw the services so that what must change together stays in one database, and use a saga for the rest.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'One database transaction',
								'Whenever the data can live in one database. By far the simplest, and truly all or nothing.',
							],
							[
								'Two-phase commit',
								'Inside a database spread over machines, or between a few of your own databases that support it. Locks across the network, and blocks if the coordinator is stuck.',
							],
							[
								'Saga, orchestrated',
								'Flows of several steps between services, especially long ones. Easy to follow and change in one place.',
							],
							[
								'Saga, choreographed',
								'A few steps between services that already publish events. Nothing in charge, but the flow is hard to see.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with two-phase commit during the flash sale. Change the traffic, and find the most orders a second the kettle’s row can take.',
				journey: 'ar-2pc',
				set: { only: ['ar-2pc'], traffic: flashSale },
			},
		},
		{
			id: 'batch-stream',
			title: 'Batch and stream processing',
			summary:
				'Adding up data in big batches at night, or event by event as it arrives: MapReduce, windows, late events, exactly once, and lambda and kappa.',
			steps: [
				{
					title: 'Adding up, on the shop’s database',
					show: ['app', 'ar-office', 'lb', 'server', 'db'],
					journey: 'ar-report-db',
					draw: ['look-lb'],
					set: reporting,
					facts: [{ succeed: 'look-lb', label: 'Product pages work' }, { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The shop’s office wants a screen showing today’s sales so far, product by product. The easy way is to ask the shop’s own **Database** to add up every order since midnight, and the **Office dashboard** asks again every few seconds.',
						'Each question reads thousands of orders, as much work as 30 product pages. On a busy afternoon, that’s more than the database can do, and nearly a third of product pages fail.',
						'The shop’s database is built for many small, quick reads and writes while shoppers wait, called OLTP. Big questions over millions of rows, called OLAP, belong elsewhere. There are two ways to answer them: in batches, or as a stream.',
					],
				},
				{
					title: 'Batch: the whole day, at night',
					show: batchParts,
					journey: 'ar-views-batch',
					current: [
						['events', 'ar-lake'],
						['ar-lake', 'ar-batch'],
						['ar-batch', 'ar-warehouse'],
					],
					set: batching,
					facts: [
						'succeed',
						{ label: 'How fresh', value: 'up to a day', hint: 'ready each morning' },
					],
					tags: [{ text: 'Background: nobody waits', tone: 'background' }],
					body: [
						'Each time someone views a product, the **Web server** publishes an event, “viewed: Blue kettle”, to the **Event stream**. Every event is kept in files in a **Data lake**: cheap storage like S3, an hour to a file.',
						'At 2 am, a **Batch job** reads all of yesterday’s files, adds them up, and writes the totals to a **Data warehouse** built for big questions, like BigQuery, Snowflake or Redshift. The office reads them there in the morning. Shoppers never notice: the shop’s database isn’t asked at all.',
						'A batch job’s input is fixed and finished, which makes it simple. Reading big files from start to end is very efficient, and if the job fails, or has a bug, you fix it and run it again over the same files. The cost: its answers are always late, by up to a day.',
					],
				},
				{
					title: 'Many machines: MapReduce and Spark',
					show: batchParts,
					journey: 'ar-views-batch',
					set: { ...batching, copies: { server: 2, 'ar-batch': 20 } },
					copies: true,
					facts: [{ copies: 'ar-batch' }],
					body: [
						'A year of views is too much for one machine to read in a night, so the job is spread over many, 20 here. Google described how in 2004, as MapReduce, and Hadoop made a free version of it.',
						'Map: each machine reads its own share of the files, and writes out a pair for each view, like (Blue kettle, 1). Shuffle: all the pairs for one product are sent to the same machine. Reduce: each machine adds up its products’ pairs. If a machine dies, only its share is done again.',
						'Spark does the same, but keeps the data in memory between steps where it can, instead of writing it to disk after each one, so it’s usually much faster. It’s the usual choice today.',
					],
					example: {
						says: 'Counting views, in three steps.',
						data: {
							map: '(Blue kettle, 1), (Red toaster, 1), (Blue kettle, 1)…',
							shuffle: 'every Blue kettle pair to machine 4',
							reduce: 'Blue kettle: 18,240 views',
						},
					},
				},
				{
					title: 'Stream: each event as it arrives',
					show: streamParts,
					journey: 'ar-views-stream',
					current: [
						['events', 'ar-stream'],
						['ar-stream', 'ar-live'],
					],
					set: streaming,
					facts: [
						{ busy: 'ar-stream' },
						{ label: 'How fresh', value: 'seconds', hint: 'counted as it happens' },
					],
					tags: [{ text: 'Background: nobody waits', tone: 'background' }],
					body: [
						'A sale starts at 8 pm, and the office wants to see what’s selling now, not tomorrow. So a **Stream processor** reads each event the moment it arrives, keeps a running count for every product in its memory, and writes the counts to **Live counts**, a fast store the dashboard reads.',
						'Its input never ends, so there’s no “all of it” to add up, only what’s come so far. Here it handles 50 views a second, and is half busy. Apache Flink and Kafka Streams are common stream processors, and Spark can work this way too.',
						'Streams are for where late is useless: stopping a fraudulent payment before the parcel leaves, “trending now” lists, and alerts. They’re harder to get right than a batch job, for reasons the next steps show.',
					],
				},
				{
					title: 'Windows: counting by the minute',
					show: streamParts,
					journey: 'ar-views-stream',
					set: streaming,
					body: [
						'A count that never ends isn’t much use, so a stream processor counts in windows of time. A tumbling window is fixed, one after another: 8:00 to 8:05, then 8:05 to 8:10, with each view in exactly one.',
						'A sliding window has a fixed length, and moves along: the last 5 minutes, worked out every minute, so the windows overlap. A session window follows one shopper, and closes after, say, 30 minutes without a tap.',
					],
					example: {
						says: 'Views of the Blue kettle, in 5-minute tumbling windows.',
						data: {
							'8:00 to 8:05': '312',
							'8:05 to 8:10': '1,048: the sale has started',
							'8:10 to 8:15': 'still counting',
						},
					},
				},
				{
					title: 'Late events',
					show: streamParts,
					journey: 'ar-views-stream',
					set: streaming,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Every event has two times: when it happened, on the shopper’s phone, and when it reached the processor. They’re called event time and processing time, and usually they’re a moment apart.',
						'But Riya views the kettle at 8:04 in the metro, with no signal, and her phone sends it at 8:09. Counted by when it arrived, it lands in the wrong window. Counted by when it happened, the 8:00 window can’t be closed at 8:05: views from it might still be on their way.',
						'So the processor keeps a watermark: its estimate that everything up to, say, 8:04 has now arrived. A window is closed once the watermark passes its end. Events later than that are added as a correction, or dropped. Each pipeline chooses how long to wait, trading freshness for accuracy.',
					],
					example: {
						says: 'Riya’s view.',
						data: {
							'event time': '8:04, when she tapped',
							'processing time': '8:09, when it arrived',
							'counted in': 'the 8:00 to 8:05 window, by event time',
						},
					},
				},
				{
					title: 'A sale: the processor falls behind',
					show: streamParts,
					journey: 'ar-views-stream',
					set: sale,
					facts: ['succeed', { busy: 'ar-stream' }, { backlog: 'ar-stream' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The sale brings three times the views: 150 a second, and one copy of the processor can count 100. The rest wait in the event stream, 50 more every second.',
						'Nothing is lost, and shoppers don’t notice. But the counts fall further behind every second: after an hour of the sale, 180,000 views are waiting. How far a reader is behind is called consumer lag, and it’s the first number to watch on a stream.',
					],
				},
				{
					title: 'More copies, one for each partition',
					show: streamParts,
					journey: 'ar-views-stream',
					set: { ...sale, copies: { server: 3, 'ar-stream': 2 } },
					copies: true,
					facts: [{ busy: 'ar-stream' }, { backlog: 'ar-stream' }],
					body: [
						'So run a second copy. Kafka splits a stream into partitions, and each copy reads its own. Views are sent to a partition by product, so every view of the Blue kettle goes to the same copy, which keeps its count. Two copies count 200 a second between them, and keep up.',
						'Each partition is read by only one copy at a time, so a stream with 2 partitions can’t use a third copy. Teams give a stream more partitions than they need today, like 12, to leave room to grow.',
					],
				},
				{
					title: 'A crash: checkpoints and exactly once',
					show: streamParts,
					journey: 'ar-views-stream',
					set: { ...streaming, down: ['ar-stream'] },
					facts: ['succeed'],
					tags: [{ text: 'It keeps working', tone: 'plain' }],
					body: [
						'The processor keeps its counts in memory, so a crash would lose them. So every few seconds, Flink saves a checkpoint: all its counts, and how far it had read in each partition, together, in safe storage like S3.',
						'Here it’s down, and shoppers don’t notice: the views wait in the stream. A new copy loads the last checkpoint, and reads again from the place saved with it. Views after the checkpoint are read twice, but the saved counts didn’t include them, so each is counted once. That’s exactly-once processing.',
						'What it writes out needs care too: it must be idempotent, like setting “8:05 window: 1,048” rather than adding to it, or written in a transaction, which Kafka supports.',
					],
				},
				{
					title: 'Lambda and kappa',
					show: [...batchParts, 'ar-stream', 'ar-live'],
					journey: 'ar-views-both',
					set: { only: ['ar-views-both'], copies: { server: 2 } },
					body: [
						'Early stream processors were fast, but not always right. So the lambda architecture, named by Nathan Marz, runs both: a stream for numbers now, and a batch job each night that works them out again from the data lake, exactly, and replaces them. The cost: the same logic written, tested and kept in step twice.',
						'The kappa architecture, named by Jay Kreps, one of Kafka’s creators, uses only the stream. The event stream keeps events for a long time, so to fix a bug or change the logic, you start a new copy of the stream job from the beginning, let it catch up, then switch over.',
						'Today, Flink and Spark can run the same code over files and over streams, so many teams use one engine for both.',
					],
				},
				{
					title: 'Which one when',
					show: [...batchParts, 'ar-stream', 'ar-live'],
					journey: 'ar-views-both',
					set: { only: ['ar-views-both'], copies: { server: 2 } },
					body: [
						'Most shops use both, over the same events: streams for what’s happening now, batches for what happened.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Ask the shop’s database',
								'Small, rare questions. Or ask a read copy, so shoppers aren’t slowed.',
							],
							[
								'Batch',
								'Reports, bills, training recommendations: whole days or years, when tomorrow morning is soon enough. Simple, efficient, easy to run again.',
							],
							[
								'Stream',
								'Fraud checks, live dashboards, alerts: when seconds matter. Needs windows, watermarks and checkpoints.',
							],
							[
								'Lambda',
								'Fast numbers now, made exact each night. Two copies of the logic to keep in step.',
							],
							[
								'Kappa',
								'One stream job for everything, run again from the log to work it all out again. Needs events kept long enough.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely during the sale. From the stream processor’s details, change how many copies it runs, and watch the views waiting in the stream.',
				journey: 'ar-views-stream',
				set: sale,
			},
		},
	],
};

const parts: TrackModule['parts'] = [
	{
		id: 'ar-orders',
		name: 'Order service',
		kind: 'service',
		layer: 'services',
		summary:
			'Takes orders. It saves each one in its own database, and asks the other services to do their part: charge the card, take the stock, book a van.',
		why: 'Orders are their own job, run by their own team, so they’re their own service.',
		onFailure: 'Nobody can place an order. Looking at products still works.',
		scaling: 'Run more copies; it keeps nothing between requests.',
		capacityPerInstance: 200,
		instances: 1,
		latencyMs: 8,
	},
	{
		id: 'ar-orders-db',
		name: 'Orders database',
		kind: 'database',
		layer: 'data',
		summary: 'The Order service’s own database. No other service reads or changes it.',
		why: 'Each service keeps its own data, so its team can change its tables without breaking anyone else.',
		onFailure: 'Orders can’t be saved or read.',
		scaling: 'A bigger machine, read copies or shards, like any database.',
		capacityPerInstance: 150,
		instances: 1,
		latencyMs: 10,
	},
	{
		id: 'ar-pay',
		name: 'Payment service',
		kind: 'service',
		layer: 'services',
		summary:
			'Charges for orders through the payment provider, and refunds them, keeping a record of each.',
		why: 'Money needs careful handling and records of its own, so one team looks after it.',
		onFailure: 'Nobody can pay, so no order can go through.',
		scaling: 'Run more copies. The payment provider’s limit usually comes first.',
		capacityPerInstance: 200,
		instances: 1,
		latencyMs: 8,
	},
	{
		id: 'ar-pay-db',
		name: 'Payments database',
		kind: 'database',
		layer: 'data',
		summary: 'The Payment service’s own database: every charge and refund.',
		why: 'Each service keeps its own data, so its team can change its tables without breaking anyone else.',
		onFailure: 'Charges can’t be recorded, so the Payment service stops taking them.',
		scaling: 'A bigger machine, read copies or shards, like any database.',
		capacityPerInstance: 150,
		instances: 1,
		latencyMs: 10,
	},
	{
		id: 'ar-stock-db',
		name: 'Stock database',
		kind: 'database',
		layer: 'data',
		summary: 'The Stock service’s own database: how many of each product are left.',
		why: 'Each service keeps its own data, so its team can change its tables without breaking anyone else.',
		onFailure: 'Stock can’t be taken, so orders can’t go through.',
		scaling: 'A bigger machine, read copies or shards, like any database.',
		capacityPerInstance: 150,
		instances: 1,
		latencyMs: 10,
	},
	{
		id: 'ar-delivery-db',
		name: 'Deliveries database',
		kind: 'database',
		layer: 'data',
		summary: 'The Delivery service’s own database: every van booking.',
		why: 'Each service keeps its own data, so its team can change its tables without breaking anyone else.',
		onFailure: 'Vans can’t be booked.',
		scaling: 'A bigger machine, read copies or shards, like any database.',
		capacityPerInstance: 150,
		instances: 1,
		latencyMs: 10,
	},
	...[1, 2, 3].map((n) => ({
		id: `ar-stock-${n}`,
		name: `Stock service ${n}`,
		kind: 'service' as const,
		layer: 'services' as const,
		summary: `Copy ${n} of the Stock service, at the address its machine was given when it started. It can take about 50 requests a second.`,
		why: 'Three copies share the work, and stock keeps working when one breaks. Each was started at a different time, on a different machine.',
		onFailure:
			'Callers that still have its address wait for a timeout. Once it’s dropped from their list, the other copies take its share.',
		scaling: 'Start another copy. It gets no work until callers find it.',
		capacityPerInstance: 50,
		instances: 1,
		latencyMs: 8,
	})),
	{
		id: 'ar-registry',
		name: 'Service registry',
		kind: 'database',
		layer: 'data',
		summary:
			'A list of every running copy of every service, and its address. Copies add themselves when they start, and keep saying they’re alive. Like Consul, etcd or Eureka.',
		why: 'Copies come and go all day. Callers need one place to find the ones running now.',
		onFailure:
			'Callers keep using the last list they got, so calls carry on. But new copies can’t be found, and dead ones aren’t dropped.',
		scaling:
			'It runs as three or five servers that agree on the list, so one breaking loses nothing.',
		capacityPerInstance: 5_000,
		instances: 1,
		latencyMs: 2,
	},
	{
		id: 'ar-stock-lb',
		name: 'Internal load balancer',
		kind: 'balancer',
		layer: 'services',
		summary:
			'A load balancer inside the data centre, in front of the Stock service’s copies. Callers only know its address.',
		why: 'Callers don’t need to know where the copies are: the load balancer keeps track, and skips broken ones.',
		onFailure: 'Nothing reaches the Stock service, so it’s run as a pair.',
		scaling: 'It does little with each request, so one passes on many thousands a second.',
		capacityPerInstance: 10_000,
		instances: 1,
		latencyMs: 1,
	},
	{
		id: 'ar-sidecar',
		name: 'Sidecar proxy',
		kind: 'gateway',
		layer: 'services',
		summary:
			'A small proxy running beside each copy of the Order service, like Envoy. Every call goes through it: it finds a copy, retries, encrypts and measures.',
		why: 'Every service needs the same retries, encryption and measurements. A proxy beside each one gives them that, whatever language it’s written in.',
		onFailure:
			'Its own copy of the Order service can’t call anything, so it’s restarted with it.',
		scaling: 'There’s one beside every copy, so it grows with the service.',
		capacityPerInstance: 10_000,
		instances: 1,
		latencyMs: 1,
	},
	{
		id: 'ar-office',
		name: 'Office dashboard',
		kind: 'client',
		layer: 'clients',
		summary: 'The screens in the shop’s office, showing how sales are going.',
		why: 'The shop wants to know what sells, and when.',
		onFailure: 'It stands for the shop’s staff, so the simulation doesn’t make it fail.',
		scaling: 'It runs on the office’s own screens.',
	},
	{
		id: 'ar-lake',
		name: 'Data lake',
		kind: 'storage',
		layer: 'data',
		summary:
			'Every event the shop publishes, kept as files in cheap storage like S3, an hour to a file, for years.',
		why: 'Big jobs need all the history in one place, away from the shop’s own database.',
		onFailure: 'New events can’t be kept until it’s back. They wait in the event stream.',
		scaling:
			'It holds any amount. Each file can be read by a different machine, so many can read at once.',
		capacityPerInstance: 10_000,
		instances: 1,
		latencyMs: 50,
	},
	{
		id: 'ar-batch',
		name: 'Batch job',
		kind: 'worker',
		layer: 'async',
		summary:
			'Runs at 2 am. It reads all of yesterday’s events and adds them up, spread over many machines, like a Spark job.',
		why: 'Some questions are about a whole day, a month or a year. It’s cheapest to answer them all at once.',
		onFailure:
			'Yesterday’s report is late. The files are still there, so the job is simply run again.',
		scaling: 'Add machines: each reads its own share of the files.',
		capacityPerInstance: 10_000,
		instances: 1,
		latencyMs: 100,
	},
	{
		id: 'ar-warehouse',
		name: 'Data warehouse',
		kind: 'database',
		layer: 'data',
		summary:
			'Keeps the totals and the history, built for big questions over millions of rows, like BigQuery, Snowflake or Redshift.',
		why: 'The office’s questions are big and few. A database built for them answers fast, without slowing the shop.',
		onFailure: 'Reports can’t be read. The shop works as usual.',
		scaling: 'It’s spread over many machines, which share each big question.',
		capacityPerInstance: 1_000,
		instances: 1,
		latencyMs: 50,
	},
	{
		id: 'ar-stream',
		name: 'Stream processor',
		kind: 'worker',
		layer: 'async',
		summary:
			'Reads each event the moment it arrives, and keeps running counts, like Flink or Kafka Streams. One copy counts about 100 events a second.',
		why: 'Some numbers are only useful now: what’s selling in this sale, or a payment that looks like fraud.',
		onFailure:
			'The counts stop moving. Events wait in the event stream, and it carries on from its last checkpoint when it’s back.',
		scaling: 'Add copies, up to one for each partition of the stream.',
		capacityPerInstance: 100,
		instances: 1,
		maxInstances: 12,
		latencyMs: 5,
	},
	{
		id: 'ar-live',
		name: 'Live counts',
		kind: 'database',
		layer: 'data',
		summary:
			'A small, fast store of the running counts, like Redis. The office dashboard reads it every few seconds.',
		why: 'The dashboard needs the latest counts at once, without asking the stream processor.',
		onFailure: 'The dashboard stops updating. The counts carry on being worked out.',
		scaling: 'It holds only the counts, so it rarely needs to grow.',
		capacityPerInstance: 5_000,
		instances: 1,
		latencyMs: 2,
	},
];

/**
 * Heartbeats and list updates come every few seconds, not with every call:
 * a small share of the calls, so the registry's load stays what it would be.
 */
const rarely = 0.01;

/** Placing an order across the four services, the van booked while the shopper waits. */
const msOrderHops = [
	{ from: 'app', to: 'lb', label: 'Place order 5521' },
	{ from: 'lb', to: 'ar-orders', label: '/orders: to the Order service' },
	{ from: 'ar-orders', to: 'ar-orders-db', label: 'Save order 5521' },
	{ from: 'ar-orders', to: 'ar-pay', label: 'Charge ₹1,499', travelMs: 1 },
	{ from: 'ar-pay', to: 'payments', label: 'Charge the card' },
	{ from: 'ar-pay', to: 'ar-pay-db', label: 'Record the charge' },
	{ from: 'ar-orders', to: 'stock-svc', label: 'Take one Blue kettle', travelMs: 1 },
	{ from: 'stock-svc', to: 'ar-stock-db', label: 'Take one from stock' },
];

/** A product view, published as an event for the reports. */
const viewHops = [
	{ from: 'app', to: 'lb', label: 'Ask for the product page' },
	{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
	{ from: 'server', to: 'db', label: 'Read the product' },
	{
		from: 'server',
		to: 'events',
		label: 'Publish: viewed, Blue kettle',
		mode: 'async' as const,
	},
];
const batchHops = [
	{
		from: 'events',
		to: 'ar-lake',
		label: 'Keep it in this hour’s file',
		mode: 'async' as const,
	},
	{
		from: 'ar-lake',
		to: 'ar-batch',
		label: 'Read at 2 am, with the whole day',
		mode: 'async' as const,
	},
	{
		from: 'ar-batch',
		to: 'ar-warehouse',
		label: 'Write each product’s totals',
		mode: 'async' as const,
	},
];
const streamHops = [
	{ from: 'events', to: 'ar-stream', label: 'Each view, as it arrives', mode: 'async' as const },
	{
		from: 'ar-stream',
		to: 'ar-live',
		label: 'Update this window’s count',
		mode: 'async' as const,
	},
];

const journeys: TrackModule['journeys'] = [
	{
		id: 'ar-mono-order',
		name: 'Place an order, in one app',
		description:
			'Someone places an order. One program charges the card, then saves the order, takes the stock and books a van in one transaction.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place order 5521' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'payments', label: 'Charge ₹1,499' },
			{
				from: 'server',
				to: 'db',
				label: 'Save the order, take the kettle, book a van: one transaction',
			},
		],
	},
	{
		id: 'ar-ms-order',
		name: 'Place an order, across four services',
		description:
			'Someone places an order. The Order service saves it, then asks the Payment, Stock and Delivery services in turn, and waits for each.',
		rps: 10,
		hops: [
			...msOrderHops,
			{ from: 'ar-orders', to: 'delivery', label: 'Book a van', travelMs: 1 },
			{ from: 'delivery', to: 'ar-delivery-db', label: 'Save the booking' },
		],
	},
	{
		id: 'ar-ms-order-event',
		name: 'Place an order, the van booked later',
		description:
			'Someone places an order. The Order service waits for the payment and the stock, and publishes an event; the Delivery service books a van when it reads it.',
		rps: 10,
		hops: [
			...msOrderHops,
			{
				from: 'ar-orders',
				to: 'events',
				label: 'Publish: order 5521 placed',
				mode: 'async',
			},
			{ from: 'events', to: 'delivery', label: 'Order placed: book a van', mode: 'async' },
			{ from: 'delivery', to: 'ar-delivery-db', label: 'Save the booking', mode: 'async' },
		],
	},
	{
		id: 'ar-strangler',
		name: 'Place an order, moved to a new service',
		description:
			'Orders have moved out of the old app into a new Order service. The load balancer sends /orders there, and the new service still asks the old app to take the stock.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'POST /orders' },
			{ from: 'lb', to: 'ar-orders', label: '/orders: to the new Order service' },
			{ from: 'ar-orders', to: 'ar-orders-db', label: 'Save order 5521' },
			{
				from: 'ar-orders',
				to: 'server',
				label: 'Take one kettle: the old app still does it',
			},
			{ from: 'server', to: 'db', label: 'Take one from stock' },
		],
	},
	{
		id: 'ar-find-fixed',
		name: 'Take stock, from a fixed list',
		description:
			'For every order, the Order service takes the kettle from one of the Stock service’s three copies, picked in turn from a list written in its settings.',
		rps: 60,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place order 5521' },
			{ from: 'lb', to: 'ar-orders', label: 'Pass it to the Order service' },
			...pickStock('ar-orders', 'Take one Blue kettle'),
		],
	},
	{
		id: 'ar-find-registry',
		name: 'Take stock, found in a registry',
		description:
			'The Stock service’s copies register when they start and send heartbeats. The Order service keeps the registry’s list of live copies, and picks one itself.',
		rps: 60,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place order 5521' },
			{ from: 'lb', to: 'ar-orders', label: 'Pass it to the Order service' },
			{
				from: 'ar-orders',
				to: 'ar-registry',
				label: 'Keep my list of Stock copies up to date',
				mode: 'async',
				share: rarely,
			},
			...pickStock('ar-orders', 'Take one Blue kettle'),
			...stockCopies.map((copy) => ({
				from: copy,
				to: 'ar-registry',
				label: 'Heartbeat: still here',
				mode: 'async' as const,
				share: rarely,
			})),
		],
	},
	{
		id: 'ar-find-lb',
		name: 'Take stock, through a load balancer',
		description:
			'The Order service calls one address, an internal load balancer, which passes each call to a healthy copy of the Stock service.',
		rps: 60,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place order 5521' },
			{ from: 'lb', to: 'ar-orders', label: 'Pass it to the Order service' },
			{ from: 'ar-orders', to: 'ar-stock-lb', label: 'Take one Blue kettle' },
			...pickStock('ar-stock-lb', 'Pass it to a healthy copy'),
		],
	},
	{
		id: 'ar-find-mesh',
		name: 'Take stock, through a sidecar',
		description:
			'The Order service sends each call to the proxy beside it, which picks a copy of the Stock service, encrypts the call, and retries on another copy if it fails.',
		rps: 60,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place order 5521' },
			{ from: 'lb', to: 'ar-orders', label: 'Pass it to the Order service' },
			{ from: 'ar-orders', to: 'ar-sidecar', label: 'Take one Blue kettle: to localhost' },
			{
				from: 'ar-sidecar',
				to: 'ar-registry',
				label: 'The copies, from the control plane',
				mode: 'async',
				share: rarely,
			},
			...pickStock('ar-sidecar', 'Pass it to a copy, encrypted'),
		],
	},
	{
		id: 'ar-saga',
		name: 'Buy a kettle, one service at a time',
		description:
			'Someone buys the Blue kettle. The Order service charges the card, takes the kettle and books a van, one service after another, each saving its own part at once.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Buy the Blue kettle' },
			{ from: 'lb', to: 'ar-orders', label: 'Pass it to the Order service' },
			{ from: 'ar-orders', to: 'ar-orders-db', label: 'Save order 5521: pending' },
			{ from: 'ar-orders', to: 'ar-pay', label: 'Step 1: charge ₹1,499', travelMs: 1 },
			{ from: 'ar-pay', to: 'payments', label: 'Charge the card' },
			{ from: 'ar-pay', to: 'ar-pay-db', label: 'Record the charge' },
			{ from: 'ar-orders', to: 'stock-svc', label: 'Step 2: take one kettle', travelMs: 1 },
			{ from: 'stock-svc', to: 'row', label: 'Take one, and unlock at once' },
			{ from: 'ar-orders', to: 'delivery', label: 'Step 3: book a van', travelMs: 1 },
			{ from: 'delivery', to: 'ar-delivery-db', label: 'Save the booking' },
		],
	},
	{
		id: 'ar-2pc',
		name: 'Buy a kettle, with two-phase commit',
		description:
			'Someone buys the Blue kettle. The Order service asks all three services to prepare and vote, keeping their rows locked, then tells them all to commit.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Buy the Blue kettle' },
			{ from: 'lb', to: 'ar-orders', label: 'Pass it to the coordinator' },
			{
				from: 'ar-orders',
				to: 'ar-pay',
				label: 'Prepare: can you charge ₹1,499?',
				travelMs: 1,
			},
			{ from: 'ar-pay', to: 'payments', label: 'Hold ₹1,499 on the card' },
			{ from: 'ar-pay', to: 'ar-pay-db', label: 'Write it, keep it locked, vote yes' },
			{
				from: 'ar-orders',
				to: 'stock-svc',
				label: 'Prepare: can you take one kettle?',
				travelMs: 1,
			},
			// the row stays locked from this vote until the commit arrives: about five times as long
			{
				from: 'stock-svc',
				to: 'row',
				label: 'Take one, keep the row locked until the vote ends',
				work: 5,
			},
			{
				from: 'ar-orders',
				to: 'delivery',
				label: 'Prepare: can you book a van?',
				travelMs: 1,
			},
			{
				from: 'delivery',
				to: 'ar-delivery-db',
				label: 'Write it, keep it locked, vote yes',
			},
			{ from: 'ar-orders', to: 'ar-orders-db', label: 'All voted yes: write “commit”' },
			{ from: 'ar-orders', to: 'ar-pay', label: 'Commit', travelMs: 1 },
			{ from: 'ar-orders', to: 'stock-svc', label: 'Commit', travelMs: 1 },
			{ from: 'ar-orders', to: 'delivery', label: 'Commit', travelMs: 1 },
		],
	},
	{
		id: 'ar-saga-undo',
		name: 'Buy a kettle, sold out: refunded',
		description:
			'Someone buys the Blue kettle. The card is charged, but the kettle has just sold out, so the Order service undoes the charge with a refund, and cancels the order.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Buy the Blue kettle' },
			{ from: 'lb', to: 'ar-orders', label: 'Pass it to the Order service' },
			{ from: 'ar-orders', to: 'ar-orders-db', label: 'Save order 5521: pending' },
			{ from: 'ar-orders', to: 'ar-pay', label: 'Step 1: charge ₹1,499', travelMs: 1 },
			{ from: 'ar-pay', to: 'payments', label: 'Charge the card' },
			{ from: 'ar-pay', to: 'ar-pay-db', label: 'Record the charge' },
			{ from: 'ar-orders', to: 'stock-svc', label: 'Step 2: take one kettle', travelMs: 1 },
			{ from: 'stock-svc', to: 'row', label: 'None left: say no' },
			{ from: 'ar-orders', to: 'ar-pay', label: 'Undo step 1: refund ₹1,499', travelMs: 1 },
			{ from: 'ar-pay', to: 'payments', label: 'Refund the card' },
			{ from: 'ar-pay', to: 'ar-pay-db', label: 'Record the refund' },
			{ from: 'ar-orders', to: 'ar-orders-db', label: 'Order 5521: cancelled' },
		],
	},
	{
		id: 'ar-saga-events',
		name: 'Buy a kettle, services reacting to events',
		description:
			'Someone buys the Blue kettle. The order is saved as pending, and each service hears the event before it, does its part, and publishes the next.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Buy the Blue kettle' },
			{ from: 'lb', to: 'ar-orders', label: 'Pass it to the Order service' },
			{
				from: 'ar-orders',
				to: 'ar-orders-db',
				label: 'Save order 5521 as pending, and its event',
			},
			{ from: 'ar-orders', to: 'events', label: 'Publish: order placed', mode: 'async' },
			{ from: 'events', to: 'ar-pay', label: 'Order placed: charge it', mode: 'async' },
			{ from: 'ar-pay', to: 'payments', label: 'Charge ₹1,499', mode: 'async' },
			{ from: 'ar-pay', to: 'ar-pay-db', label: 'Record the charge', mode: 'async' },
			{ from: 'ar-pay', to: 'events', label: 'Publish: payment taken', mode: 'async' },
			{
				from: 'events',
				to: 'stock-svc',
				label: 'Payment taken: take one kettle',
				mode: 'async',
			},
			{ from: 'stock-svc', to: 'row', label: 'Take one', mode: 'async' },
			{ from: 'stock-svc', to: 'events', label: 'Publish: kettle taken', mode: 'async' },
			{ from: 'events', to: 'delivery', label: 'Kettle taken: book a van', mode: 'async' },
			{ from: 'delivery', to: 'ar-delivery-db', label: 'Save the booking', mode: 'async' },
			{ from: 'delivery', to: 'events', label: 'Publish: van booked', mode: 'async' },
			{
				from: 'events',
				to: 'ar-orders',
				label: 'Van booked: order confirmed',
				mode: 'async',
			},
		],
	},
	{
		id: 'ar-report-db',
		name: 'Today’s sales, from the shop’s database',
		description:
			'The office dashboard asks the shop’s own database to add up every order since midnight, again every few seconds.',
		rps: 2,
		hops: [
			{ from: 'ar-office', to: 'lb', label: 'Today’s sales so far?' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Add up every order today', work: 30 },
		],
	},
	{
		id: 'ar-views-batch',
		name: 'Look at a product, added up at night',
		description:
			'Someone opens a product, and the view is published as an event. It’s kept in the data lake, and a batch job adds up the whole day at 2 am.',
		rps: 50,
		hops: [...viewHops, ...batchHops],
	},
	{
		id: 'ar-views-stream',
		name: 'Look at a product, counted as it happens',
		description:
			'Someone opens a product, and the view is published as an event. A stream processor counts it within seconds, for the live dashboard.',
		rps: 50,
		hops: [...viewHops, ...streamHops],
	},
	{
		id: 'ar-views-both',
		name: 'Look at a product, counted both ways',
		description:
			'Someone opens a product. The view is counted at once by a stream processor, and again at night by a batch job: the lambda architecture.',
		rps: 50,
		hops: [...viewHops, ...streamHops, ...batchHops],
	},
];

export const architectureTrack: TrackModule = { track: architecture, parts, journeys };
