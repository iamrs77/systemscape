import type { Track } from '@/learn/course';
import type { SystemInput } from '@/model/schema';

/**
 * The basics: the ideas every system here is built from, taught on a small
 * shop app made up for the purpose. It grows track by track: each lesson
 * shows only the parts it's about, and runs the conditions that make its
 * point visible.
 */

const look = { only: ['look'] };

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
	].map((id) => [id, 0]),
);

const requests: Track = {
	id: 'requests',
	name: 'How requests work',
	tagline: 'What happens between tapping a button and seeing the answer.',
	lessons: [
		{
			id: 'a-request',
			title: 'A request and its answer',
			summary: 'You tap, a request goes out, and an answer comes back.',
			steps: [
				{
					title: 'You tap a product',
					show: ['app', 'server'],
					journey: 'look',
					current: [['app', 'server']],
					set: look,
					body: [
						'You open the shop app and tap a blue kettle. Your phone doesn’t have the kettle’s page: it lives on the shop’s computers. So the **Shop app** sends a message to the **Web server**, asking for it.',
						'That message is called a request. The arrow is the path it takes, and each moving dot is one request.',
					],
					example: {
						says: 'Please send me the page for the blue kettle.',
						data: { product: 'Blue kettle', from: 'your phone' },
					},
				},
				{
					title: 'The server needs the details',
					show: ['app', 'server', 'db'],
					journey: 'look',
					current: [['server', 'db']],
					set: look,
					body: [
						'The **Web server** knows how to build the page, but not the kettle’s price or how many are left. Those are kept in the **Database**.',
						'So the server sends a request of its own, and waits for the answer. One tap can start several requests behind the scenes.',
					],
					example: {
						says: 'What are the price and stock of the blue kettle?',
						data: { answer: '₹1,499, 12 left' },
					},
				},
				{
					title: 'The answers come back',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					facts: ['wait'],
					timeline: true,
					body: [
						'The database answers the server, and the server answers your phone with the finished page. Every request gets an answer: what you asked for, or an error.',
						'Each request waits for its answer, so their times add up. That total is the wait you feel after tapping.',
					],
				},
				{
					title: 'Many people at once',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					facts: ['rate', { busy: 'server' }],
					body: [
						'You aren’t the only one shopping. Right now, about 50 people a second are opening products. Every dot is somebody’s request.',
						'The server answers them one after another, very fast, and it’s about half busy. What happens when it gets fuller is what the Performance track is about.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely on the shop app, following “Look at a product”. Push the traffic up, and watch the dots and the numbers.',
				journey: 'look',
				set: look,
			},
		},
		{
			id: 'waiting',
			title: 'Waiting, or doing it later',
			summary: 'Some work must happen before you get an answer. Some can wait.',
			steps: [
				{
					title: 'Placing an order',
					show: ['app', 'server', 'db', 'email'],
					journey: 'order-wait',
					set: { only: ['order-wait'] },
					facts: ['wait'],
					timeline: true,
					body: [
						'When you place an order, the **Web server** saves it in the **Database**, then sends you a receipt by email, through an **Email service** run by another company.',
						'In this design, your phone waits for all of it. The email alone takes most of a second, so the order feels slow.',
					],
				},
				{
					title: 'Send the email later',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: { only: ['order'] },
					facts: ['wait'],
					timeline: true,
					tags: [{ text: 'Background: nobody waits', tone: 'background' }],
					body: [
						'You don’t need to wait for the email. So now the server leaves a note in a **Queue** and answers you straight away. An **Email worker** picks up the note a moment later and sends the email.',
						'This is called background work. The dashed arrows are calls nobody waits for, and the order now feels instant.',
					],
				},
				{
					title: 'The email service goes down',
					show: ['app', 'server', 'db', 'email'],
					journey: 'order-wait',
					set: { only: ['order-wait'], down: ['email'] },
					facts: ['succeed', 'wait'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Now the email service has an outage. In the first design, every order fails. The server waits for an email that never sends, gives up after 2 seconds, and tells you something went wrong.',
						'A broken part that you wait for breaks everything that waits for it.',
					],
				},
				{
					title: 'The same outage, sent later',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: { only: ['order'], down: ['email'] },
					facts: ['succeed', 'wait'],
					tags: [{ text: 'It keeps working', tone: 'plain' }],
					body: [
						'With the queue, orders still work, as fast as ever. The notes wait in the queue, and the emails go out when the service is back.',
						'Deciding what has to happen now, and what can happen later, is one of the most useful choices in any design.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely during the email outage. Then bring the email service back from its details, and watch the waiting emails go out.',
				journey: 'order',
				set: { only: ['order'], down: ['email'] },
			},
		},
		{
			id: 'no-answer',
			title: 'When a part doesn’t answer',
			summary: 'Errors, timeouts, and saying no quickly.',
			steps: [
				{
					title: 'The database is down',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], down: ['db'] },
					facts: ['succeed', 'wait'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'If the **Database** stops working, the **Web server** can’t build any page. It sends its request and waits for an answer that never comes.',
					],
				},
				{
					title: 'Waiting has a limit',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], down: ['db'] },
					facts: ['succeed', 'wait'],
					body: [
						'The server doesn’t wait forever. After 2 seconds, it gives up and answers your phone with an error. That limit is called a timeout.',
						'Without a timeout, every request would wait forever. The server would fill up with stuck requests, until it couldn’t answer anyone at all.',
					],
				},
				{
					title: 'Saying no quickly',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], down: ['db'], circuitBreakers: true },
					facts: ['succeed', 'wait'],
					body: [
						'The server could notice that the database keeps failing, and stop calling it for a while. Then it says no straight away, instead of making everyone wait 2 seconds first.',
						'That’s a circuit breaker, named after the switch at home that cuts the power when something’s wrong. It doesn’t fix the database, but it stops one broken part from slowing everything down.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with the database down. Turn circuit breakers on and off, and watch the wait change.',
				journey: 'look',
				set: { only: ['look'], down: ['db'] },
			},
		},
	],
};

// the next three lessons are about the server alone, so the database is made big enough to stay out of the way
const serverOnly = { only: ['look'], bigger: { db: 10 } };

const performance: Track = {
	id: 'performance',
	name: 'Performance',
	tagline: 'Latency, throughput and capacity, and why things slow down when they get busy.',
	lessons: [
		{
			id: 'latency',
			title: 'Latency: how long you wait',
			summary: 'Every step takes time, and the slowest step decides the wait.',
			steps: [
				{
					title: 'Every step takes time',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					facts: ['wait'],
					timeline: true,
					body: [
						'Latency is the time from asking to getting the answer. For a product page, it’s the **Web server**’s work plus the **Database**’s work, added up.',
						'It’s measured in milliseconds, thousandths of a second. A blink takes about 100.',
					],
				},
				{
					title: 'The slowest step decides',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], traffic: 2.6, bigger: { server: 4 } },
					facts: ['wait', { busy: 'db' }],
					timeline: true,
					body: [
						'Now the database is busy, so its answers take longer, and it makes up most of the wait. A faster web server would barely help.',
						'To cut a wait, find the slowest step first. Speeding up anything else changes almost nothing.',
					],
				},
				{
					title: 'What a wait feels like',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					facts: ['wait'],
					body: [
						'Under 100 milliseconds feels instant. Around a second, people notice. After a few seconds, many give up and leave.',
						'That’s why every design here counts milliseconds: each step adds to the wait someone feels.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely and push the traffic up. Watch which step’s time grows first.',
				journey: 'look',
				set: look,
			},
		},
		{
			id: 'throughput',
			title: 'Throughput and capacity',
			summary: 'How much work gets done, and the most a part can do.',
			steps: [
				{
					title: 'Requests a second',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					facts: ['rate', { load: 'server' }],
					body: [
						'Throughput is how much work gets done. Here, it’s how many requests are answered each second: right now, 50.',
					],
				},
				{
					title: 'Capacity: the most a part can do',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					facts: [
						{ label: 'Capacity', value: '100/s', hint: 'one web server' },
						{ busy: 'server' },
					],
					about: 'server',
					body: [
						'Every part has a limit, called its capacity. One copy of this **Web server** can answer about 100 requests a second. With 50 arriving, it’s half busy.',
						'How busy a part is, its load compared with its capacity, is the first number to look at when something feels slow.',
					],
				},
				{
					title: 'Getting busier',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { ...serverOnly, traffic: 1.8 },
					facts: ['rate', { busy: 'server' }, 'wait'],
					body: [
						'On a busy day, 90 requests a second arrive, and the server is 90% busy. Everything still works.',
						'But look at the wait: it went up far more than the traffic did. The next lesson is about why.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely and move the traffic slider. Watch how busy the web server gets.',
				journey: 'look',
				set: look,
			},
		},
		{
			id: 'queueing',
			title: 'Why waits shoot up near full',
			summary: 'The busier a part is, the longer each request waits in line.',
			steps: [
				{
					title: 'Quiet: 30% busy',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...serverOnly, traffic: 0.6 },
					facts: [{ busy: 'server' }, 'wait'],
					body: [
						'At 30% busy, a request almost never finds another one ahead of it. It’s answered straight away.',
					],
				},
				{
					title: 'Busy: 70%',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...serverOnly, traffic: 1.4 },
					facts: [{ busy: 'server' }, 'wait'],
					body: [
						'At 70% busy, a request often arrives while the server is still on the one before. It waits its turn in a queue, and the server’s part of the wait more than doubles.',
					],
				},
				{
					title: 'Nearly full: 90%',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...serverOnly, traffic: 1.8 },
					facts: [{ busy: 'server' }, 'wait'],
					body: [
						'At 90% busy, there’s almost always a queue. The server’s part of the wait is now 7 times what it was at 30%, though the traffic only tripled.',
					],
				},
				{
					title: 'Almost full: 98%',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...serverOnly, traffic: 1.96 },
					facts: [{ busy: 'server' }, 'wait'],
					note: {
						title: 'Like a checkout counter',
						text: 'A cashier who is busy 90% of the time almost always has a queue. The few free moments are what keep the line short.',
					},
					body: [
						'At 98%, the queue hardly ever clears, and the wait is enormous. That’s why parts are kept well below full, around 70%, and why autoscaling adds copies long before they’re full.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely and move the traffic slider slowly. The wait stays low, then shoots up near full.',
				journey: 'look',
				set: { ...serverOnly, traffic: 1.4 },
			},
		},
		{
			id: 'overload',
			title: 'Past full: requests turned away',
			summary: 'Above its capacity, a part doesn’t just slow down. It fails people.',
			steps: [
				{
					title: 'More than it can answer',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...serverOnly, traffic: 2.5 },
					facts: ['succeed', { busy: 'server' }, 'wait'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Now 125 requests a second arrive, but the server can answer only 100. It can’t keep up. Requests pile up until they time out, and about 1 in 5 fail.',
						'Past full, a part doesn’t just get slower: it turns people away.',
					],
				},
				{
					title: 'Room to grow',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...serverOnly, traffic: 2.5, copies: { server: 2 } },
					facts: ['succeed', { busy: 'server' }, { copies: 'server' }],
					copies: true,
					body: [
						'With a second copy of the server, there’s room for 200 a second. It’s comfortably busy again, and everyone gets an answer.',
						'Adding copies is one way to grow. The Scaling track covers the others.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with too much traffic. Add copies of the web server from its details, until everyone gets an answer.',
				journey: 'look',
				set: { ...serverOnly, traffic: 2.5 },
			},
		},
		{
			id: 'bottleneck',
			title: 'The bottleneck',
			summary: 'The part that holds everything back, and why fixing it can uncover the next.',
			steps: [
				{
					title: 'The web server holds everything back',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], traffic: 3.4 },
					facts: ['succeed', { busy: 'server' }, { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'170 requests a second, and the **Web server** is overloaded. It’s the bottleneck: the part that holds everything else back.',
					],
				},
				{
					title: 'The bottleneck moves',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], traffic: 3.4, copies: { server: 3 } },
					facts: ['succeed', { busy: 'server' }, { busy: 'db' }],
					copies: true,
					body: [
						'Add copies of the server, and it copes. But now every request reaches the **Database**, more than it can answer. The bottleneck has moved.',
					],
				},
				{
					title: 'Fix the next one',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], traffic: 3.4, copies: { server: 3 }, bigger: { db: 2 } },
					facts: ['succeed', { busy: 'server' }, { busy: 'db' }],
					copies: true,
					body: [
						'Give the database twice the capacity, and everything flows again.',
						'Fixing one bottleneck often uncovers the next. So look at how busy every part is, not just the first one that broke.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with the database as the bottleneck. Try adding web servers, then try the database, and see which one helps.',
				journey: 'look',
				set: { only: ['look'], traffic: 3.4, copies: { server: 3 } },
			},
		},
	],
};

// the scaling lessons look at one idea at a time, so the database is made big enough to stay out of the way when it isn't the subject
const roomy = { db: 10 };

const scaling: Track = {
	id: 'scaling',
	name: 'Scaling',
	tagline:
		'Bigger servers or more of them, load balancers, caches, CDNs and splitting the data: how apps grow.',
	lessons: [
		{
			id: 'up-or-out',
			title: 'Bigger, or more copies',
			summary: 'Two ways to handle more: a bigger server, or more of them.',
			steps: [
				{
					title: 'More than one server can answer',
					show: ['app', 'server'],
					journey: 'look',
					set: { only: ['look'], bigger: roomy, traffic: 3 },
					facts: ['succeed', { busy: 'server' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A sale brings 150 requests a second. One **Web server** can answer 100, so a third of the shoppers get an error.',
						'The shop has to grow. There are two ways to do it.',
					],
				},
				{
					title: 'Scale up: a bigger server',
					show: ['app', 'server'],
					journey: 'look',
					set: { only: ['look'], bigger: { ...roomy, server: 2 }, traffic: 3 },
					facts: [
						'succeed',
						{ busy: 'server' },
						{ label: 'Capacity', value: '200/s', hint: 'one server, twice as big' },
					],
					body: [
						'The first way is a bigger computer, with more processors and more memory. One twice as big answers about twice as many: 200 a second.',
						'This is called scaling up, or vertical scaling. It’s the easiest way, because nothing about the app changes, so it’s usually tried first.',
					],
				},
				{
					title: 'But one is still one',
					show: ['app', 'server'],
					journey: 'look',
					set: {
						only: ['look'],
						bigger: { ...roomy, server: 2 },
						traffic: 3,
						down: ['server'],
					},
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Scaling up has limits. There’s a biggest computer you can buy, and the biggest ones cost far more than twice as much for twice the power.',
						'And it’s still one computer. When it breaks, or restarts for an update, nobody can shop.',
					],
				},
				{
					title: 'Scale out: more copies',
					show: ['app', 'server'],
					journey: 'look',
					set: { only: ['look'], bigger: roomy, traffic: 3, copies: { server: 3 } },
					facts: ['succeed', { busy: 'server' }, { copies: 'server' }],
					copies: true,
					body: [
						'The other way is to run several ordinary servers, all doing the same job. Three copies answer 300 a second between them.',
						'This is called scaling out, or horizontal scaling. There’s no biggest size: when you need more, you add another copy.',
					],
				},
				{
					title: 'One copy breaks',
					show: ['app', 'server'],
					journey: 'look',
					set: { only: ['look'], bigger: roomy, traffic: 3, copies: { server: 2 } },
					facts: ['succeed', { busy: 'server' }, { copies: 'server' }],
					copies: true,
					body: [
						'When one of the three breaks, the other two carry on. They’re busier, at 75%, but everyone still gets an answer.',
						'So most big apps scale out. But copies need two things: something to share the requests between them, and servers that don’t keep anything to themselves. Those are the next two lessons.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with 150 requests a second. From the web server’s details, change how many copies it runs, and watch how busy they get.',
				journey: 'look',
				set: { only: ['look'], bigger: roomy, traffic: 3 },
			},
		},
		{
			id: 'load-balancing',
			title: 'Load balancing',
			summary: 'One address in front, sharing the requests between the copies.',
			steps: [
				{
					title: 'Which copy?',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					current: [['app', 'lb']],
					set: { only: ['look-lb'], bigger: roomy, traffic: 3, copies: { server: 3 } },
					copies: true,
					facts: [{ load: 'lb' }],
					body: [
						'With three copies of the web server, which one should your phone ask? Phones can’t keep track of which copies are running, or which are busy.',
						'So a **Load balancer** stands in front of them. The app only knows its address, and it passes each request on to one of the copies.',
					],
				},
				{
					title: 'Sharing out the work',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					current: [['lb', 'server']],
					set: { only: ['look-lb'], bigger: roomy, traffic: 3, copies: { server: 3 } },
					copies: true,
					facts: [{ each: 'server' }, { busy: 'server' }],
					body: [
						'It takes turns: the first request goes to copy 1, the next to copy 2, then copy 3, and round again. Or it picks whichever copy has the fewest requests right now.',
						'Each copy gets a third of the 150: 50 a second. None is overloaded while another sits idle.',
					],
					example: {
						says: 'This one goes to copy 2: it has the fewest requests right now.',
						data: { request: 'Blue kettle page', 'sent to': 'Web server, copy 2' },
					},
				},
				{
					title: 'Skipping a broken copy',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: { only: ['look-lb'], bigger: roomy, traffic: 3, copies: { server: 2 } },
					copies: true,
					facts: ['succeed', { each: 'server' }],
					body: [
						'Every few seconds, the load balancer asks each copy if it’s well. That’s called a health check. A copy that stops answering stops getting requests, until it’s back.',
						'So when one copy breaks, shoppers don’t notice. The other two share its requests.',
					],
				},
				{
					title: 'Adding a copy',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: { only: ['look-lb'], bigger: roomy, traffic: 3, copies: { server: 4 } },
					copies: true,
					facts: [{ each: 'server' }, { busy: 'server' }, { busy: 'lb' }],
					body: [
						'Adding a copy works the same way: the load balancer starts sending it requests, and the app never needs to know.',
						'The load balancer does very little with each request, so one can pass on many thousands a second. It’s usually run as a pair, so one can take over if the other breaks.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely, with the load balancer in front of three copies. Add and remove copies of the web server, and watch the requests spread.',
				journey: 'look-lb',
				set: { only: ['look-lb'], bigger: roomy, traffic: 3, copies: { server: 3 } },
			},
		},
		{
			id: 'stateless',
			title: 'Servers that remember nothing',
			summary: 'Why any copy should be able to answer anyone.',
			steps: [
				{
					title: 'You add a kettle to your cart',
					show: ['app', 'lb', 'server'],
					journey: 'cart',
					current: [
						['app', 'lb'],
						['lb', 'server'],
					],
					set: { only: ['cart'], copies: { server: 3 } },
					copies: true,
					body: [
						'You add the blue kettle to your cart. The load balancer sends your request to copy 1, which keeps your cart in its own memory.',
						'Simple. But what happens when you tap again?',
					],
					example: {
						says: 'Add the blue kettle to my cart.',
						data: { cart: 'Blue kettle × 1', 'kept in': 'Web server copy 1’s memory' },
					},
				},
				{
					title: 'The next tap goes elsewhere',
					show: ['app', 'lb', 'server'],
					journey: 'cart',
					set: { only: ['cart'], copies: { server: 3 } },
					copies: true,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Your next tap goes to copy 2. Copy 2 has never seen your cart, so it’s empty.',
						'One fix is to send you to the same copy every time, called sticky sessions. But when that copy restarts, every cart it held is lost. And when its shoppers get busy, it can’t share them with the others.',
					],
					example: {
						says: 'Show me my cart.',
						data: { 'answered by': 'Web server copy 2', answer: 'Your cart is empty' },
					},
				},
				{
					title: 'Keep the cart in one shared place',
					show: ['app', 'lb', 'server', 'carts'],
					journey: 'cart',
					current: [['server', 'carts']],
					set: { only: ['cart'], copies: { server: 3 } },
					copies: true,
					body: [
						'Instead, the servers keep nothing between requests. Your cart goes into a shared **Cart store**, and whichever copy answers reads it from there.',
						'A server that keeps nothing between requests is called stateless. What it would have remembered, like carts and who’s signed in, lives in a shared store or a database.',
					],
					example: {
						says: 'Save this cart for shopper 1042.',
						data: {
							cart: 'Blue kettle × 1',
							'kept in': 'Cart store',
							'read by': 'any copy',
						},
					},
				},
				{
					title: 'Now any copy will do',
					show: ['app', 'lb', 'server', 'carts'],
					journey: 'cart',
					set: { only: ['cart'], copies: { server: 2 } },
					copies: true,
					facts: ['succeed', { copies: 'server' }],
					note: {
						title: 'The shared store matters now',
						text: 'If the cart store goes down, nobody can add to a cart. So it’s run with copies of its own.',
					},
					body: [
						'Now copies can come and go. When one breaks, your next tap goes to another, and your cart is still there.',
						'That’s what lets load balancing, adding copies and autoscaling all work. Most services in big apps are built this way.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely, adding to carts. Take the cart store down from its details, and see what stops working.',
				journey: 'cart',
				set: { only: ['cart'], copies: { server: 3 } },
			},
		},
		{
			id: 'caching',
			title: 'Caching',
			summary:
				'Keep popular answers close, so the database isn’t asked the same thing all day.',
			steps: [
				{
					title: 'The same question, all day',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { only: ['look-lb'], traffic: 3.4, copies: { server: 3 } },
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'On a busy day, 170 product pages are opened every second, and the **Database** can answer 150. So some shoppers get errors.',
						'But most of those pages are the same few popular products, and a product’s details rarely change. The database works out the same answers again and again.',
					],
				},
				{
					title: 'Keep the answers close',
					show: ['app', 'lb', 'server', 'cache', 'db'],
					journey: 'look-cache',
					current: [['server', 'cache']],
					set: { only: ['look-cache'], traffic: 3.4, copies: { server: 3 } },
					facts: ['succeed', { load: 'db' }, { busy: 'db' }],
					body: [
						'A **Cache** keeps recent answers in memory, where they’re very quick to read. The server asks the cache first. When it has the answer, called a cache hit, it takes about a millisecond.',
						'Here, 9 requests in 10 are hits. The database is asked only 17 times a second, and everyone gets an answer.',
					],
				},
				{
					title: 'When the cache doesn’t have it',
					show: ['app', 'lb', 'server', 'cache', 'db'],
					journey: 'look-cache',
					current: [['cache', 'db']],
					set: { only: ['look-cache'], traffic: 3.4, copies: { server: 3 } },
					facts: [
						{ label: 'Hit rate', value: '90%', hint: '9 in 10 answered by the cache' },
						'wait',
					],
					timeline: true,
					note: {
						title: 'Out-of-date answers',
						text: 'When a price changes, the cache may still hold the old one. So answers are kept only for a while, say a minute, or removed when the product changes.',
					},
					body: [
						'When the cache doesn’t have the answer, a cache miss, the request goes on to the database as before. The answer is then kept in the cache, so the next shopper gets a hit.',
					],
				},
				{
					title: 'An empty cache',
					show: ['app', 'lb', 'server', 'cache', 'db'],
					journey: 'look-cache',
					set: {
						only: ['look-cache'],
						traffic: 3.4,
						copies: { server: 3 },
						hitRate: { cache: 0 },
					},
					facts: [
						'succeed',
						{ label: 'Hit rate', value: '0%', hint: 'the cache has just started' },
						{ busy: 'db' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'When the cache restarts, it starts empty: a cold cache. Every request misses, and they all land on the database at once.',
						'So the database has to cope while the cache fills up again, or the cache is filled before shoppers are sent to it.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with the cache. Take the cache down from its details, and watch what lands on the database.',
				journey: 'look-cache',
				set: { only: ['look-cache'], traffic: 3.4, copies: { server: 3 } },
			},
		},
		{
			id: 'cdn',
			title: 'Content delivery (CDN)',
			summary: 'Copies of the photos near every shopper, so they load fast.',
			steps: [
				{
					title: 'Photos from far away',
					show: ['app', 'files'],
					journey: 'photos',
					set: { only: ['photos'] },
					facts: ['wait'],
					body: [
						'Every product page has photos, kept in **File storage** in one city. A shopper in another city waits for each photo to travel all that way, and one abroad waits even longer.',
						'Here, a photo takes about a quarter of a second to arrive.',
					],
				},
				{
					title: 'Copies near everyone',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					current: [['app', 'cdn']],
					set: { only: ['photos-cdn'] },
					facts: ['wait'],
					body: [
						'A **CDN**, a content delivery network, is many servers in cities all over the world. Each keeps copies of the photos, so your phone downloads them from one nearby.',
						'Now a photo takes a few hundredths of a second, about ten times faster.',
					],
				},
				{
					title: 'The first time, from the source',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					current: [['cdn', 'files']],
					set: { only: ['photos-cdn'] },
					facts: [
						{ label: 'Hit rate', value: '95%', hint: '95 in 100 answered nearby' },
						{ load: 'files' },
					],
					body: [
						'The first time someone nearby asks for a photo, the CDN doesn’t have it. It fetches it from file storage, then keeps it for everyone after.',
						'Photos hardly ever change, so 95 requests in 100 are answered nearby. File storage sends 10 photos a second, instead of 200.',
					],
				},
				{
					title: 'Sale day, without a CDN',
					show: ['app', 'files'],
					journey: 'photos',
					set: { only: ['photos'], traffic: 6 },
					facts: ['succeed', { busy: 'files' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'On sale day, six times as many shoppers arrive. Without a CDN, every photo comes from file storage, and it can’t send 1,200 a second.',
					],
				},
				{
					title: 'Sale day, with a CDN',
					show: ['app', 'cdn', 'files'],
					journey: 'photos-cdn',
					set: { only: ['photos-cdn'], traffic: 6 },
					facts: ['succeed', { busy: 'files' }, 'wait'],
					body: [
						'With the CDN, file storage only sends what the CDN doesn’t have yet. The CDN’s servers share everything else, and shopping keeps working.',
						'CDNs are used for anything that’s the same for everyone: photos, videos, and the app’s own files.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely on sale day, with the CDN. Take the CDN down from its details, and see what lands on file storage.',
				journey: 'photos-cdn',
				set: { only: ['photos-cdn'], traffic: 6 },
			},
		},
		{
			id: 'read-copies',
			title: 'Read copies',
			summary: 'Copies of the database that answer reads, while one takes the writes.',
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
						'For every order placed, products are looked at many times. Here, 150 reads a second and 30 orders: more than the **Database** can answer.',
						'A cache helps with popular products. But many reads are different for each shopper, like their past orders, so they still come from the database.',
					],
				},
				{
					title: 'Copies that answer reads',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'look-replica',
					draw: ['order-save'],
					current: [['db', 'replica']],
					set: {
						only: ['look-replica', 'order-save'],
						traffic: 3,
						copies: { server: 3, replica: 2 },
					},
					copies: true,
					facts: ['succeed', { busy: 'db' }, { busy: 'replica' }],
					body: [
						'Now the database keeps copies of itself, called read copies. Every change saved in the main database is copied to them a moment later.',
						'Reads go to the copies, and only writes go to the main database. Two read copies answer 300 reads a second between them, and you can add more.',
					],
				},
				{
					title: 'A moment behind',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'look-replica',
					draw: ['order-save'],
					set: {
						only: ['look-replica', 'order-save'],
						traffic: 3,
						copies: { server: 3, replica: 2 },
					},
					copies: true,
					body: [
						'A read copy is usually a fraction of a second behind. So just after you place an order, a read copy may not have it yet.',
						'Pages that must be up to date, like the one that says your order is placed, read from the main database instead.',
					],
					example: {
						says: 'Show me my orders, a moment after placing one.',
						data: {
							'main database': '3 orders, with the new one',
							'read copy': '2 orders, a moment behind',
						},
					},
				},
				{
					title: 'Writes don’t spread',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-save',
					set: { only: ['order-save'], traffic: 20, copies: { server: 3, replica: 2 } },
					copies: true,
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Read copies only help with reads. Every order still has to be saved in the main database. On a big sale, with 200 orders a second, it’s overloaded again.',
						'To spread the writes, the data itself has to be split. That’s the next lesson.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with read copies. Push the traffic up, and add read copies from their details. Then see which part fills up next.',
				journey: 'look-replica',
				set: {
					only: ['look-replica', 'order-save'],
					traffic: 3,
					copies: { server: 3, replica: 2 },
				},
			},
		},
		{
			id: 'sharding',
			title: 'Splitting the data',
			summary: 'When one database can’t take all the writes, split the data between several.',
			steps: [
				{
					title: 'Two databases, each with half',
					show: ['app', 'lb', 'server', 'shard-1', 'shard-2'],
					journey: 'order-split',
					current: [
						['server', 'shard-1'],
						['server', 'shard-2'],
					],
					set: { only: ['order-split'], traffic: 20, copies: { server: 3 } },
					facts: ['succeed', { busy: 'shard-1' }, { busy: 'shard-2' }],
					body: [
						'Instead of one database with every order, use two. Each shopper’s orders are kept in one of them, say by shopper number: odd numbers in one, even in the other. Each piece is called a shard.',
						'An order is saved in just one shard, so each takes half: 100 a second, which it can easily answer.',
					],
					example: {
						says: 'Shopper 1043 placed an order: an odd number, so it goes to shard 1.',
						data: { shopper: '1043', 'saved in': 'Shard 1' },
					},
				},
				{
					title: 'Splitting it evenly',
					show: ['app', 'lb', 'server', 'shard-1', 'shard-2'],
					journey: 'order-split',
					set: { only: ['order-split'], traffic: 20, copies: { server: 3 } },
					facts: [{ load: 'shard-1' }, { load: 'shard-2' }],
					note: {
						title: 'A hot shard',
						text: 'Even split well, one very busy shopper or seller can make their shard busier than the rest. That’s called a hot shard.',
					},
					body: [
						'How you split matters. Split by name, A to M and N to Z, and one shard gets far more: many more names start with A or S than with X or Z.',
						'So apps usually split by a hash: a scrambled number made from the shopper’s id, which spreads shoppers evenly. Need more room? Split into four shards, or forty.',
					],
				},
				{
					title: 'What gets harder',
					show: ['app', 'lb', 'server', 'shard-1', 'shard-2'],
					journey: 'order-split',
					set: { only: ['order-split'], traffic: 20, copies: { server: 3 } },
					body: [
						'Some questions now need every shard. Today’s total sales means asking both, and adding up. A change that touches two shoppers on different shards can’t be one simple transaction.',
						'That’s why splitting the data usually comes last. A bigger database, a cache and read copies are tried first.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with the orders split in two. Push the traffic up until the shards fill, and compare it with one database.',
				journey: 'order-split',
				set: { only: ['order-split'], traffic: 20, copies: { server: 3 } },
			},
		},
		{
			id: 'autoscaling',
			title: 'Autoscaling, and scaling ahead',
			summary:
				'Adding copies by itself when it gets busy, and why a sudden rush needs a plan.',
			steps: [
				{
					title: 'Quiet hours, busy hours',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: { only: ['look-lb'], bigger: roomy, autoscale: true },
					copies: true,
					facts: [{ copies: 'server' }, { busy: 'server' }],
					body: [
						'Shoppers come and go: few at night, many in the evening. Enough servers for the busiest hour would sit idle all night, and you pay for every one.',
						'Right now it’s quiet, and one copy of the web server is enough.',
					],
				},
				{
					title: 'Adding copies by itself',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: { only: ['look-lb'], bigger: roomy, autoscale: true, traffic: 3 },
					copies: true,
					facts: ['succeed', { copies: 'server' }, { busy: 'server' }],
					body: [
						'Autoscaling watches how busy the copies are. When they pass about 70%, it starts more. When it’s quiet again, it stops some.',
						'In the evening, 150 requests a second arrive, so it runs three copies, and each stays comfortably busy.',
					],
				},
				{
					title: 'Too slow for a sudden rush',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: {
						only: ['look-lb'],
						bigger: roomy,
						autoscale: true,
						traffic: 3,
						sudden: true,
					},
					copies: true,
					facts: ['succeed', { copies: 'server' }, { busy: 'server' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A new copy takes a few minutes to start. When a sale opens at 8 pm sharp, everyone arrives within seconds, long before new copies are ready.',
						'For those minutes, one copy faces three times its usual load, and a third of the shoppers get errors.',
					],
				},
				{
					title: 'Scaling ahead',
					show: ['app', 'lb', 'server'],
					journey: 'look-lb',
					set: {
						only: ['look-lb'],
						bigger: roomy,
						autoscale: true,
						traffic: 3,
						sudden: true,
						copies: { server: 4 },
					},
					copies: true,
					facts: ['succeed', { copies: 'server' }, { busy: 'server' }],
					body: [
						'When you know a rush is coming, start the copies before it does. That’s called scaling ahead. Sales, big launches and live matches are planned this way.',
						'Autoscaling handles the slow rise and fall of every day. Scaling ahead handles the rushes you can see coming.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with a sudden rush. Turn autoscaling and the sudden rush on and off, then add copies by hand, before the rush.',
				journey: 'look-lb',
				set: {
					only: ['look-lb'],
					bigger: roomy,
					autoscale: true,
					traffic: 3,
					sudden: true,
				},
			},
		},
	],
};

const storing: Track = {
	id: 'storing',
	name: 'Storing data',
	tagline:
		'Tables or documents, indexes, transactions, and where photos go: how one database keeps the shop’s data.',
	lessons: [
		{
			id: 'tables-or-documents',
			title: 'Tables or documents',
			summary: 'SQL tables joined together, or NoSQL documents read whole.',
			steps: [
				{
					title: 'Tables: SQL',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'order-page',
					current: [['server', 'db']],
					set: { only: ['order-page'], copies: { server: 3 } },
					facts: ['wait'],
					body: [
						'An SQL database keeps data in tables, like spreadsheets: one for orders, one for the items in each order, one for products, one for shoppers. Each fact is kept once, in one place.',
						'To show your order, the **Database** joins the tables back together: this order, its items, their products, and you.',
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
					title: 'Documents: NoSQL',
					show: ['app', 'lb', 'server', 'docs'],
					journey: 'order-page-docs',
					current: [['server', 'docs']],
					set: { only: ['order-page-docs'], copies: { server: 3 } },
					facts: ['wait'],
					body: [
						'A **Document database** keeps the whole order together, as one document, with its items and the shopper’s name inside. Showing it is one read, with no joining.',
						'Databases that aren’t tables are called NoSQL. The cart store is one too, the simplest kind: a key, like a shopper’s number, and a value, their cart.',
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
					title: 'A huge sale, one SQL database',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'order-page',
					set: { only: ['order-page'], traffic: 6, copies: { server: 4 } },
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'On a huge sale day, 300 orders are opened every second. The tables all live on one machine, and it can answer 150.',
					],
				},
				{
					title: 'Built to spread out',
					show: ['app', 'lb', 'server', 'docs'],
					journey: 'order-page-docs',
					set: { only: ['order-page-docs'], traffic: 6, copies: { server: 4 } },
					copies: true,
					facts: ['succeed', { busy: 'docs' }, { copies: 'docs' }],
					body: [
						'Most document databases are built to spread over many machines from the start. Each document lives on one of them, so more machines means more room. Here, three share the work.',
						'SQL databases can be split too, but you have to do the splitting yourself. The Data on many machines track shows how.',
					],
				},
				{
					title: 'What documents give up',
					show: ['app', 'lb', 'server', 'docs'],
					journey: 'order-page-docs',
					set: { only: ['order-page-docs'], copies: { server: 3 } },
					body: [
						'The shopper’s name is now copied into every one of their orders. When they change it, every copy has to change. And questions across many documents, like which products sell best, are slower and harder.',
						'So choose by how the data is used. Tables suit data with many links between its parts, like orders, products and stock. Documents suit things that are read whole, like a cart or a chat message. Most apps start with SQL, and add NoSQL where it fits.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely on the huge sale, with the document database. Change how many machines it runs, from its details, and watch how busy they get.',
				journey: 'order-page-docs',
				set: { only: ['order-page-docs'], traffic: 6, copies: { server: 4 } },
			},
		},
		{
			id: 'indexes',
			title: 'Indexes',
			summary: 'A sorted list that takes the database straight to what it needs.',
			steps: [
				{
					title: 'Reading every order',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'find-scan',
					current: [['server', 'db']],
					set: { only: ['find-scan'] },
					facts: ['wait', { busy: 'db' }],
					body: [
						'You open your past orders. The database holds every order from every shopper, in the order they were placed. To find yours, it reads them all, and keeps the ones that are yours.',
						'That’s slow, and it keeps the database busy: just 5 of these searches a second take two-thirds of its time.',
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
						'An index is a sorted list kept beside the table: each shopper, and where their orders are. The database finds you in the list, and goes straight to your orders.',
						'It’s like the index at the back of a book: you don’t read every page to find one word.',
					],
					example: {
						says: 'Shopper 1042: orders 88, 412, 5521 …',
						data: { index: 'each shopper → their orders', read: '12 orders' },
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
						'On a busy evening, twice as many people check their orders: still only 10 a second. Without the index, that’s more reading than the database can do, and searches fail.',
					],
				},
				{
					title: 'The same evening, with one',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'find-index',
					set: { only: ['find-index'], traffic: 2 },
					facts: ['succeed', { busy: 'db' }, 'wait'],
					note: {
						title: 'What an index costs',
						text: 'Every new order has to be added to the index too, so saving gets a little slower, and the index takes space. So index the questions you actually ask, not every column.',
					},
					body: [
						'With the index, the same searches hardly make the database busy at all.',
					],
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
			title: 'Built for reading, or for writing',
			summary: 'How a database stores each change decides whether reads or writes are cheap.',
			steps: [
				{
					title: 'Built for reading',
					show: ['vans', 'app', 'lb', 'server', 'db'],
					journey: 'van-save',
					draw: ['van-see-db'],
					set: { only: ['van-save', 'van-see-db'], copies: { server: 3 } },
					facts: [{ busy: 'db' }, 'succeed'],
					body: [
						'Delivery vans now send where they are every few seconds: 100 updates a second. Shoppers check where their parcel is.',
						'Most databases, like PostgreSQL and MySQL, keep data sorted, in place, in a shape called a B-tree. A read goes straight to the row. A write has to find the row first, and change it where it is.',
					],
				},
				{
					title: 'Twice the vans',
					show: ['vans', 'app', 'lb', 'server', 'db'],
					journey: 'van-save',
					draw: ['van-see-db'],
					set: { only: ['van-save', 'van-see-db'], traffic: 2, copies: { server: 3 } },
					facts: ['succeed', { busy: 'db' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The shop grows to twice as many vans. Every update is a small search and a change in place, and the database can’t keep up.',
					],
				},
				{
					title: 'Built for writing',
					show: ['vans', 'app', 'lb', 'server', 'logdb'],
					journey: 'van-log',
					draw: ['van-see'],
					set: { only: ['van-log', 'van-see'], traffic: 2, copies: { server: 3 } },
					facts: ['succeed', { busy: 'logdb' }],
					note: {
						title: 'Choose by what you do most',
						text: 'Mostly reading, like a shop’s products: a database built for reading. Mostly writing, like locations, sensor readings or logs: one built for writing.',
					},
					body: [
						'Some databases, like Cassandra, are built the other way round. Each change is added to the end of a log, like writing the next line in a diary: very quick. The log is sorted into files later, in the background.',
						'Writes are cheap, so the same vans take a fraction of the work. But a read may have to look in the log and several files to find the newest location, so each read takes more.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with the database built for writing. Push the traffic up, and see which fills it first: the vans or the shoppers.',
				journey: 'van-log',
				set: { only: ['van-log', 'van-see'], traffic: 2, copies: { server: 3 } },
			},
		},
		{
			id: 'transactions',
			title: 'Transactions',
			summary: 'Changes made all together or not at all, and two people at the same moment.',
			steps: [
				{
					title: 'All or nothing',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					current: [['server', 'db']],
					set: { only: ['buy'] },
					body: [
						'Buying a kettle changes two things: an order is saved, and one kettle is taken from stock. If the server crashed in between, you’d have an order with no kettle taken, or a kettle gone with no order.',
						'So both go in one transaction: the database makes all its changes, or none of them. Never half.',
					],
					example: {
						says: 'Begin. Save order 5521. Take one blue kettle from stock. Commit.',
						data: { 'if anything fails': 'neither change is kept' },
					},
				},
				{
					title: 'Two people, one kettle',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					set: { only: ['buy'] },
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'One kettle is left. Riya and Sameer tap Buy at the same moment. Both read “1 left”, both take one, and the stock says −1: two orders for one kettle.',
						'This is called a race: what happens depends on who gets there first, by a fraction of a second.',
					],
					example: {
						says: 'Both read the stock before either changes it.',
						data: {
							Riya: 'reads 1 left, takes one',
							Sameer: 'reads 1 left, takes one',
							stock: '−1',
						},
					},
				},
				{
					title: 'Taking turns',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'buy',
					set: { only: ['buy'] },
					body: [
						'The fix is to keep transactions apart, called isolation. Riya’s transaction locks the kettle’s stock while it changes it. Sameer’s waits, then reads 0 left, and he’s told it’s sold out.',
						'Databases offer several levels of isolation. Stronger levels prevent more of these mix-ups, but make more transactions wait for each other.',
					],
					example: {
						says: 'Sameer waits for Riya to finish.',
						data: {
							Riya: 'locks the stock, takes the last one',
							Sameer: 'waits, then reads 0 left: sold out',
							stock: '0',
						},
					},
				},
				{
					title: 'Everyone wants the same kettle',
					show: ['app', 'lb', 'server', 'db', 'row'],
					journey: 'flash-buy',
					current: [['db', 'row']],
					set: {
						only: ['flash-buy'],
						traffic: 30,
						copies: { server: 4 },
						bigger: { db: 10 },
					},
					facts: ['succeed', { busy: 'db' }, { busy: 'row' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A flash sale: 300 people a second try to buy the same kettle. Each order locks the one row that counts its stock, for about a hundredth of a second, so they can only go one at a time: 100 a second.',
						'The database itself is barely busy. That single row is the bottleneck.',
					],
				},
				{
					title: 'Split the count',
					show: ['app', 'lb', 'server', 'db', 'row'],
					journey: 'flash-buy',
					set: {
						only: ['flash-buy'],
						traffic: 30,
						copies: { server: 4, row: 4 },
						bigger: { db: 10 },
					},
					copies: true,
					facts: ['succeed', { busy: 'row' }, { copies: 'row' }],
					body: [
						'Instead of one count of 400 kettles, keep four rows of 100. Each order takes from any row with kettles left, so four orders can go at once.',
						'Another way is to queue the orders and take them one at a time in the background, telling each shopper a moment later.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely on the flash sale. Split the stock into more rows, from the row’s details, until everyone gets an answer.',
				journey: 'flash-buy',
				set: {
					only: ['flash-buy'],
					traffic: 30,
					copies: { server: 4 },
					bigger: { db: 10 },
				},
			},
		},
		{
			id: 'files',
			title: 'Files and media',
			summary:
				'Where photos and videos go, and how they get there without clogging the servers.',
			steps: [
				{
					title: 'Photos go in file storage',
					show: ['app', 'lb', 'server', 'files'],
					journey: 'upload-server',
					current: [['server', 'files']],
					set: { only: ['upload-server'], copies: { server: 3 } },
					body: [
						'Sellers upload product photos, a few megabytes each. They don’t go in the database: big files make it slow, and costly to copy. They go in **File storage**, built for big files, like Amazon S3. The database keeps only each photo’s address.',
						'Here, each photo travels through a web server on its way.',
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
					title: 'Uploads clog the servers',
					show: ['app', 'lb', 'server', 'files'],
					journey: 'upload-server',
					draw: ['look-lb'],
					set: {
						only: ['upload-server', 'look-lb'],
						traffic: 3,
						copies: { server: 3 },
						bigger: roomy,
					},
					facts: [
						{ busy: 'server' },
						{ succeed: 'look-lb', label: 'Product pages that work' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'An upload keeps a server copy busy until all of it has arrived: as long as 30 ordinary pages. When many sellers upload at once, the copies fill up, and shoppers’ product pages start failing too.',
					],
				},
				{
					title: 'Straight to storage',
					show: ['app', 'lb', 'server', 'files'],
					journey: 'upload-direct',
					draw: ['look-lb'],
					current: [['app', 'files']],
					set: {
						only: ['upload-direct', 'look-lb'],
						traffic: 3,
						copies: { server: 3 },
						bigger: roomy,
					},
					facts: [
						{ busy: 'server' },
						{ succeed: 'look-lb', label: 'Product pages that work' },
					],
					body: [
						'Instead, the server only hands out a link that allows one upload, to one place, for a few minutes. The app sends the photo straight to file storage, and the server’s part takes a moment.',
					],
					example: {
						says: 'A link that allows one upload.',
						data: {
							link: 'storage…/kettle-blue-2.jpg?signature=…',
							allows: 'one photo, for 15 minutes',
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
						'When a photo arrives, file storage leaves a note in a queue. A **Photo worker** picks it up and makes smaller sizes for lists and phones, in the background.',
						'Shoppers then download the photos through a CDN, as in the Scaling track. Videos work the same way, with more sizes.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with uploads going through the servers. Turn the traffic up, and see what else fails.',
				journey: 'upload-server',
				set: {
					only: ['upload-server', 'look-lb'],
					traffic: 3,
					copies: { server: 3 },
					bigger: roomy,
				},
			},
		},
	],
};

const replicated = { only: ['order-save'], traffic: 3, copies: { server: 3, replica: 2 } };
const group = { only: ['order-sync'], traffic: 3, copies: { server: 3, replica: 2 } };

const distributed: Track = {
	id: 'distributed',
	name: 'Data on many machines',
	tagline:
		'Copies, shards, numbering, and agreeing on what’s true when machines and networks break.',
	lessons: [
		{
			id: 'replication',
			title: 'Copies that keep data safe',
			summary:
				'A leader and its followers, waiting for a copy or not, and when the leader breaks.',
			steps: [
				{
					title: 'A leader and its followers',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-save',
					current: [['db', 'replica']],
					set: replicated,
					copies: true,
					body: [
						'The Scaling track used copies of the database to share the reading. They also keep the data safe: if the database’s disk dies, every order is still in its copies.',
						'The main database is called the leader, and every change goes to it. The copies, called followers, receive each change from the leader and make it too.',
					],
				},
				{
					title: 'Answer now, copy later',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-save',
					set: replicated,
					copies: true,
					facts: ['wait'],
					timeline: true,
					body: [
						'Here, the leader saves your order, answers you straight away, and sends the change on to its followers a moment later. That’s asynchronous copying, and it’s fast.',
						'But if the leader breaks in that moment, the last few orders never reached a follower. They’re lost.',
					],
				},
				{
					title: 'Wait for a copy',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					current: [['db', 'replica']],
					set: group,
					copies: true,
					facts: ['wait'],
					timeline: true,
					body: [
						'Or the leader waits until a follower has the change before it answers. That’s synchronous copying. Every order you’re told is saved is in two places, but each one waits a little longer.',
						'Many databases wait for one follower and send to the rest later: safe, and not too slow.',
					],
				},
				{
					title: 'The leader breaks',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-save',
					set: { ...replicated, down: ['db'] },
					copies: true,
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The leader stops. Followers don’t take changes, so nobody can place an order.',
					],
				},
				{
					title: 'A follower takes over',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-promoted',
					current: [['server', 'replica']],
					set: {
						only: ['order-promoted'],
						traffic: 3,
						copies: { server: 3 },
						down: ['db'],
					},
					facts: ['succeed'],
					body: [
						'Within seconds, a follower is made the new leader, and the servers send orders to it. That’s called failover, and orders work again.',
						'With asynchronous copying, any orders the old leader hadn’t sent on are gone. That’s the price of answering first.',
					],
				},
				{
					title: 'A copy isn’t a backup',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-save',
					set: replicated,
					copies: true,
					body: [
						'Copies copy everything, mistakes included. If someone deletes all the orders by accident, every follower deletes them too, a moment later.',
						'So the data is also backed up: saved as it was, somewhere else, every night or every few minutes. A backup lets you go back in time. A copy only keeps you going now.',
					],
					example: {
						says: 'Delete every order. (Oops.)',
						data: {
							leader: 'orders deleted',
							followers: 'deleted too, a moment later',
							'last night’s backup': 'every order, safe',
						},
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with a leader and two followers. Take the leader down from its details, and see what stops.',
				journey: 'order-save',
				set: replicated,
			},
		},
		{
			id: 'hot-shards',
			title: 'Shards that don’t share evenly',
			summary: 'Hot shards, and questions that every shard has to answer.',
			steps: [
				{
					title: 'Split by seller',
					show: ['app', 'lb', 'server', 'shard-1', 'shard-2'],
					journey: 'order-hot',
					set: { only: ['order-hot'], traffic: 20, copies: { server: 3 } },
					facts: ['succeed', { busy: 'shard-1' }, { busy: 'shard-2' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The shop splits its orders by seller: each seller’s orders live in one shard. But one big seller has 80% of all orders, so its shard gets 160 a second, and it can save 150.',
						'Shard 1 is overloaded while shard 2 is barely busy. That’s a hot shard.',
					],
				},
				{
					title: 'Split by something even',
					show: ['app', 'lb', 'server', 'shard-1', 'shard-2'],
					journey: 'order-split',
					set: { only: ['order-split'], traffic: 20, copies: { server: 3 } },
					facts: ['succeed', { busy: 'shard-1' }, { busy: 'shard-2' }],
					body: [
						'Split by shopper instead, by a hash of their number, and the orders spread evenly: 100 a second each.',
						'A good key has many different values, each used about as much. One big seller, one famous person or one sale product can make any shard hot.',
					],
				},
				{
					title: 'A question for every shard',
					show: ['app', 'lb', 'server', 'shard-1', 'shard-2'],
					journey: 'search-shards',
					current: [
						['server', 'shard-1'],
						['server', 'shard-2'],
					],
					set: { only: ['search-shards'], copies: { server: 3 } },
					facts: ['rate', { load: 'shard-1' }, { load: 'shard-2' }],
					body: [
						'Now the shop asks: who bought the blue kettle? Orders are split by shopper, so the buyers could be in any shard. Every shard has to be asked, and their answers put together.',
						'Each shard answers every one of these questions, so adding shards doesn’t make them cheaper: a new shard gets asked too.',
					],
				},
				{
					title: 'Pick the key by the questions',
					show: ['app', 'lb', 'server', 'shard-1', 'shard-2'],
					journey: 'order-split',
					set: { only: ['order-split'], traffic: 20, copies: { server: 3 } },
					body: [
						'So the key is chosen by the questions asked most. Shoppers mostly ask about their own orders, so orders are split by shopper.',
						'Questions across everyone, like the best sellers, are answered from a separate copy made for them, kept up to date in the background.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with the orders split by seller. Move the traffic up and down, and watch the hot shard fill long before the other.',
				journey: 'order-hot',
				set: { only: ['order-hot'], traffic: 20, copies: { server: 3 } },
			},
		},
		{
			id: 'consistent-hashing',
			title: 'Consistent hashing',
			summary: 'Adding a machine without moving almost everything.',
			steps: [
				{
					title: 'Three cache servers',
					show: ['app', 'lb', 'server', 'cache', 'db'],
					journey: 'look-cache',
					set: { only: ['look-cache'], traffic: 5, copies: { server: 4, cache: 3 } },
					copies: true,
					facts: [
						{ label: 'Hit rate', value: '90%', hint: '9 in 10 answered by the cache' },
						{ busy: 'db' },
					],
					body: [
						'The cache has grown to three servers, each keeping a third of the answers. To find which one has the blue kettle, the web server works out a number from the product’s id, called a hash, divides it by 3, and takes the remainder.',
					],
					example: {
						says: 'Which cache server has product 77?',
						data: {
							'hash of 77': '5,012',
							'remainder after ÷ 3': '2',
							so: 'the third server',
						},
					},
				},
				{
					title: 'Add a fourth, and almost everything moves',
					show: ['app', 'lb', 'server', 'cache', 'db'],
					journey: 'look-cache',
					set: {
						only: ['look-cache'],
						traffic: 5,
						copies: { server: 4, cache: 4 },
						hitRate: { cache: 0.225 },
					},
					copies: true,
					facts: [
						'succeed',
						{
							label: 'Hit rate',
							value: '22%',
							hint: '3 in 4 answers are in the wrong place',
						},
						{ busy: 'db' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A fourth cache server is added. Now the remainder is after dividing by 4, and for 3 products in 4 it changes. Their answers sit on a server nobody asks any more.',
						'Almost every request misses at once, and they all land on the database.',
					],
					example: {
						says: 'Product 77, with four servers.',
						data: {
							'hash of 77': '5,012',
							'remainder after ÷ 4': '0',
							so: 'the first server: it doesn’t have it',
						},
					},
				},
				{
					title: 'A circle instead',
					show: ['app', 'lb', 'server', 'cache', 'db'],
					journey: 'look-cache',
					set: {
						only: ['look-cache'],
						traffic: 5,
						copies: { server: 4, cache: 4 },
						hitRate: { cache: 0.675 },
					},
					copies: true,
					facts: [
						'succeed',
						{ label: 'Hit rate', value: '68%', hint: 'only 1 in 4 moved' },
						{ busy: 'db' },
					],
					body: [
						'Consistent hashing places the servers and the products around a circle, by their hashes. Each product belongs to the next server round the circle, clockwise.',
						'A new server lands at one spot, and takes over only the products just before it. About 1 in 4 move, so most requests still hit, and the database copes.',
					],
					example: {
						says: 'Around the circle, like a clock face.',
						data: {
							servers: 'at 12, 4 and 8 o’clock',
							'new server': 'at 2 o’clock',
							'it takes': 'only what was between 12 and 2',
						},
					},
				},
				{
					title: 'The same for shards',
					show: ['app', 'lb', 'server', 'shard-1', 'shard-2', 'shard-3'],
					journey: 'order-split3',
					set: { only: ['order-split3'], traffic: 30, copies: { server: 4 } },
					facts: [
						{ busy: 'shard-3' },
						{
							label: 'Orders that move',
							value: '1 in 3',
							hint: 'with remainders, 2 in 3',
						},
					],
					note: {
						title: 'Many spots each',
						text: 'Each server takes many spots round the circle, not one. Then each holds an even share, and a new one takes a little from every other server, not everything from one neighbour.',
					},
					body: [
						'Adding a shard is the same problem, but moving data is much slower than refilling a cache. With remainders, 2 in 3 orders would move to a different shard. With a circle, only the third that the new shard takes over.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely just after the fourth cache server was added, using remainders. See what’s overloaded, and try the fixes.',
				journey: 'look-cache',
				set: {
					only: ['look-cache'],
					traffic: 5,
					copies: { server: 4, cache: 4 },
					hitRate: { cache: 0.225 },
				},
			},
		},
		{
			id: 'unique-ids',
			title: 'Unique IDs at scale',
			summary: 'Numbering orders when no single database sees them all.',
			steps: [
				{
					title: 'Counting, in one database',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'order-save',
					set: { only: ['order-save'], copies: { server: 3 } },
					body: [
						'With one database, numbering orders is easy: it counts 1, 2, 3, and each new order gets the next number. No two can ever be the same.',
					],
					example: {
						says: 'The next order.',
						data: { 'last number': '5520', 'new order': '5521' },
					},
				},
				{
					title: 'Two shards, two counters',
					show: ['app', 'lb', 'server', 'shard-1', 'shard-2'],
					journey: 'order-split',
					set: { only: ['order-split'], traffic: 20, copies: { server: 3 } },
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Split into two shards, each database counts on its own. Both give out number 5521, to two different orders. Now “order 5521” could mean either.',
					],
					example: {
						says: 'Two orders, one number.',
						data: {
							'shard 1': '5521: Riya’s kettle',
							'shard 2': '5521: Sameer’s toaster',
						},
					},
				},
				{
					title: 'Ask one ID service',
					show: ['app', 'lb', 'server', 'ids', 'shard-1', 'shard-2'],
					journey: 'order-ids',
					current: [['server', 'ids']],
					set: { only: ['order-ids'], traffic: 20, copies: { server: 3 } },
					facts: ['wait', { busy: 'ids' }],
					body: [
						'One fix is an **ID service** that hands out the numbers. Every order asks it first, so numbers stay unique, and in order.',
						'But every order now waits for it. And it’s one counter: two copies would hand out the same numbers.',
					],
				},
				{
					title: 'The ID service breaks',
					show: ['app', 'lb', 'server', 'ids', 'shard-1', 'shard-2'],
					journey: 'order-ids',
					set: { only: ['order-ids'], traffic: 20, copies: { server: 3 }, down: ['ids'] },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'When it stops, no order can get a number, so nobody can place one, even though both shards are fine.',
					],
				},
				{
					title: 'Make them anywhere',
					show: ['app', 'lb', 'server', 'shard-1', 'shard-2'],
					journey: 'order-split',
					set: { only: ['order-split'], traffic: 20, copies: { server: 3 } },
					facts: ['succeed', 'wait'],
					body: [
						'Better: let each server make its own. A random ID, called a UUID, is so long that two are never the same. But it says nothing about when, and doesn’t sort.',
						'Or build the number from parts: the time, the server’s own number, and a count for that millisecond, as Twitter did with Snowflake. Unique without asking anyone, and sorted by time.',
					],
					example: {
						says: 'Two ways to make an ID, with nobody to ask.',
						data: {
							UUID: '3f2a9c1e-8b47-4d2e-9f61-0c5b7e2d4a18',
							'from parts': 'time + server 7 + count 12',
						},
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the ID service. Push the traffic up until it’s the bottleneck, then take it down.',
				journey: 'order-ids',
				set: { only: ['order-ids'], traffic: 20, copies: { server: 3 } },
			},
		},
		{
			id: 'consistency',
			title: 'Consistency, when the network breaks',
			summary: 'Two cities, one broken link: refuse changes, or let the copies disagree.',
			steps: [
				{
					title: 'A copy in another city',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'price-later',
					current: [['db', 'far']],
					set: { only: ['price-later'] },
					body: [
						'The shop keeps a copy of its database in Delhi, so shoppers in the north get fast pages, and the data survives if Mumbai’s data centre goes down. Every change made in Mumbai is copied to Delhi.',
					],
				},
				{
					title: 'The link breaks',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'price-later',
					set: { only: ['price-later'], down: ['far'] },
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Then the network between the cities breaks. Both are running, but they can’t reach each other. To Mumbai, Delhi looks exactly like a copy that’s down: it can’t tell the difference.',
						'Now a price changes in Mumbai. The CAP theorem says that while the network is split, you have to choose: keep the copies agreeing, or keep answering. Not both.',
					],
				},
				{
					title: 'Choose to agree: refuse',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'price-wait',
					set: { only: ['price-wait'], down: ['far'] },
					facts: ['succeed', 'wait'],
					tags: [{ text: 'Consistent', tone: 'plain' }],
					body: [
						'If every change must reach both cities first, Mumbai can’t save the new price. It waits, gives up after 2 seconds, and refuses. Nobody ever reads an old price, but nobody can change anything until the link is back.',
						'Payments and stock counts often choose this: being wrong costs more than waiting.',
					],
				},
				{
					title: 'Choose to answer: disagree',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'price-later',
					set: { only: ['price-later'], down: ['far'] },
					facts: ['succeed', 'wait'],
					tags: [{ text: 'Available', tone: 'plain' }],
					body: [
						'If changes are copied later, Mumbai saves the price at once. But Delhi keeps showing the old one until the link is back. Each city answers; they just disagree for a while.',
						'Likes, views and product pages usually choose this: a slightly old answer is fine.',
					],
					example: {
						says: 'The same kettle, in two cities, while the link is down.',
						data: { Mumbai: '₹1,299 (new)', Delhi: '₹1,499 (old)' },
					},
				},
				{
					title: 'When the network is fine',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'price-later',
					draw: ['price-wait'],
					set: { only: ['price-later', 'price-wait'] },
					facts: [
						{ wait: 'price-wait', label: 'Wait, copying first' },
						{ wait: 'price-later', label: 'Wait, copying later' },
					],
					body: [
						'Splits are rare. Most of the time, the choice is speed or freshness: waiting for Delhi makes every change slower, and not waiting leaves Delhi a moment behind. Copies that catch up a moment later are called eventually consistent.',
						'A common middle way: after you change something, your own reads come from Mumbai for a while, so you always see your change. That’s called reading your own writes.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with Delhi cut off. Bring the copy in Delhi back from its details, and watch the waiting changes go through.',
				journey: 'price-later',
				set: { only: ['price-later'], down: ['far'] },
			},
		},
		{
			id: 'consensus',
			title: 'Agreeing on a leader',
			summary: 'How a group of databases picks one leader, and why it takes a majority.',
			steps: [
				{
					title: 'A group of three',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: group,
					copies: true,
					facts: [
						'succeed',
						{ label: 'In the group', value: '3', hint: 'a leader and 2 followers' },
					],
					body: [
						'The database and its two copies form a group of three. One is the leader, and takes every change. A change counts as saved once a majority, two of the three, has it: the leader and at least one follower.',
					],
				},
				{
					title: 'One follower breaks',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: { ...group, copies: { server: 3, replica: 1 } },
					copies: true,
					facts: [
						'succeed',
						{ label: 'Still running', value: '2 of 3', hint: 'a majority' },
					],
					body: [
						'One follower stops. The leader and the other follower are still two of three: a majority. Orders carry on.',
					],
				},
				{
					title: 'The leader breaks: a vote',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: { ...group, down: ['db'] },
					copies: true,
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Now the leader stops. The followers stop hearing from it, and after a moment they hold a vote. The one that gets a majority, two votes of three, becomes the new leader.',
						'Until then, for a few seconds, orders fail.',
					],
				},
				{
					title: 'Why it takes a majority',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: { ...group, down: ['replica'] },
					copies: true,
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The network splits: the leader on one side, both followers on the other. The followers, two of three, elect a new leader. The old leader can’t reach a majority, so it stops taking changes: that’s what you see here.',
						'Without that rule, both sides would take orders. Two leaders would sell the same kettle, and the data couldn’t be put back together. That’s called split brain.',
					],
				},
				{
					title: 'Odd numbers',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: group,
					copies: true,
					body: [
						'Groups have 3 or 5 members. Three can lose one and carry on; five can lose two. An even number doesn’t help: four still can’t lose two.',
						'Getting this right is famously hard, so most teams don’t build it. They use a database that does it, or a tool like etcd or ZooKeeper, built on rules called Raft or Paxos.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with a group of three. Take the followers and the leader down from their details, and see when orders stop.',
				journey: 'order-sync',
				set: group,
			},
		},
	],
};

const ordersOnly = { only: ['order'], copies: { server: 2 } };
const publishing = { only: ['order-event'], copies: { server: 3 } };
const telling = { only: ['order-direct'], copies: { server: 3 } };
const polling = { only: ['parcel-poll'], copies: { server: 6 }, bigger: roomy };
const pushing = {
	only: ['parcel-push', 'parcel-connect'],
	traffic: 3,
	copies: { server: 6 },
	bigger: roomy,
};

const communication: Track = {
	id: 'communication',
	name: 'Communication',
	tagline:
		'How the parts talk: asking for what you need, handing work over, announcing what happened, and pushing updates as they happen.',
	lessons: [
		{
			id: 'apis',
			title: 'REST, RPC and GraphQL',
			summary: 'Three ways to ask a server for something, and where each one fits.',
			steps: [
				{
					title: 'REST: things with addresses',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'order-rest',
					current: [['app', 'lb']],
					set: { only: ['order-rest'], copies: { server: 3 } },
					body: [
						'A REST API gives every thing its own address, like /orders/5521, and a few verbs to use on it: GET to read it, POST to make a new one, PUT to change it, DELETE to remove it.',
						'It’s plain web requests and JSON text, so any app, browser or company can use it, and answers to GET can be cached, even by a CDN. Most public APIs are REST.',
					],
					example: {
						says: 'GET /orders/5521',
						data: { answer: '{ "id": 5521, "status": "packed", "delivery": 88 }' },
					},
				},
				{
					title: 'One screen, three requests',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'order-rest',
					set: { only: ['order-rest'], copies: { server: 3 } },
					facts: ['wait'],
					timeline: true,
					body: [
						'Your order screen shows the order, its items and where the delivery is. That’s three things, so three requests, and each one needs the answer before it: the order says which delivery to ask about.',
						'On mobile data, each request takes about 150 ms just to travel there and back. Three in a row, and the screen takes half a second to fill in.',
					],
				},
				{
					title: 'GraphQL: ask for exactly what the screen needs',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'order-graphql',
					draw: ['order-rest'],
					set: { only: ['order-graphql', 'order-rest'], copies: { server: 3 } },
					facts: [
						{ wait: 'order-graphql', label: 'Wait, one GraphQL request' },
						{ wait: 'order-rest', label: 'Wait, three REST requests' },
					],
					body: [
						'With GraphQL, the app sends one request that lists exactly what the screen shows. The server gathers it all from the database and the **Delivery service**, nearby in the data centre, and answers once.',
						'One trip across the mobile network instead of three, and nothing sent that the screen doesn’t use. The cost: answers are hard to cache, and one careless query can ask for far too much.',
					],
					example: {
						says: '{ order(id: 5521) { status items { name } delivery { eta } } }',
						data: { answer: 'packed · Blue kettle · arriving 6 pm' },
					},
				},
				{
					title: 'RPC: between your own services',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'order-graphql',
					current: [['server', 'delivery']],
					set: { only: ['order-graphql'], copies: { server: 3 } },
					body: [
						'Inside the data centre, the server asks the delivery service as if calling one of its own functions: GetDelivery(88). That’s RPC, a remote procedure call, often with gRPC.',
						'Both sides share a strict description of every call, so a mistake is caught before it ships. Messages are compact, not text, so calls are fast. Browsers can’t easily use it, so RPC stays between your own services.',
					],
					example: {
						says: 'GetDelivery(id: 88)',
						data: { answer: 'out for delivery, arriving 6 pm' },
					},
					note: {
						title: 'Which one where',
						text: 'REST for public APIs and anything worth caching. GraphQL for apps with many screens that each need different data. RPC between your own services.',
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with both designs. Follow each one, and compare where the time goes.',
				journey: 'order-rest',
				set: { only: ['order-graphql', 'order-rest'], copies: { server: 3 } },
			},
		},
		{
			id: 'message-queues',
			title: 'Message queues',
			summary:
				'Handing work over: bursts, more workers, jobs done twice, and jobs that never work.',
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
						'As in the first track, the server leaves a note in a **Queue** for each receipt, and answers you straight away. The **Email worker** takes notes from the other end and sends the emails.',
						'Each note goes to exactly one worker. When it’s done, the worker tells the queue, and the note is removed.',
					],
				},
				{
					title: 'A rush: the queue takes the strain',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: { ...ordersOnly, traffic: 8 },
					facts: ['succeed', { busy: 'worker' }, { backlog: 'worker' }],
					body: [
						'A sale brings 80 orders a second, and the worker can send 50 emails a second. It can’t keep up, so notes pile up in the queue.',
						'But orders still work, as fast as ever. The emails go out late, not never: when the rush ends, the worker catches up.',
					],
				},
				{
					title: 'More workers',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: { ...ordersOnly, traffic: 8, copies: { server: 2, worker: 2 } },
					copies: true,
					facts: [{ busy: 'worker' }, { backlog: 'worker' }],
					body: [
						'Or add a second worker. Both take notes from the same queue, each note going to one of them, so together they send 100 a second and keep up.',
						'How long the queue is says when to add workers. Many apps add them automatically when it grows.',
					],
				},
				{
					title: 'Sent twice',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: ordersOnly,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A worker sends Riya’s receipt, then crashes before telling the queue it’s done. The queue never hears back, so after a while it hands the note to another worker, which sends the receipt again.',
						'Queues promise each note at least once, not exactly once. So workers are made idempotent: before sending, the worker checks whether this order’s receipt has already gone, and skips it if so.',
					],
					example: {
						says: 'Note: send the receipt for order 5521.',
						data: {
							'first worker': 'sends it, crashes before saying done',
							'second worker': 'checks: already sent for 5521, so skips it',
						},
					},
				},
				{
					title: 'A note that never works',
					show: ['app', 'server', 'db', 'queue', 'worker', 'email'],
					journey: 'order',
					set: ordersOnly,
					body: [
						'One receipt has a mistyped email address, so it fails every time. Tried forever, it would come back again and again, and waste the worker’s time.',
						'So after a few tries, the note is moved to a separate dead-letter queue, where a person can look at it. Everything else keeps flowing.',
					],
					example: {
						says: 'Note: send the receipt to riya@gmial.con.',
						data: {
							'tries 1 to 3': 'address doesn’t exist',
							then: 'moved to the dead-letter queue',
						},
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely on the sale. Add workers from their details until the queue stops growing.',
				journey: 'order',
				set: { ...ordersOnly, traffic: 8 },
			},
		},
		{
			id: 'pub-sub',
			title: 'Publish and subscribe',
			summary: 'Say what happened once, and let every part that cares listen.',
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
						'Here, the server calls each one in turn, and waits for each. It has to know every part that cares, and you wait for all of them.',
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
						'The reports service goes down, and now nobody can place an order, all because a sales count couldn’t be updated.',
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
						'The stock service, the reports service and the email worker each subscribe: each gets its own copy of every event, and reads at its own pace.',
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
						'With the reports service down, orders work as before. Its events wait in the stream, and when it’s back, it carries on reading from where it stopped.',
					],
				},
				{
					title: 'A queue, or a stream',
					show: ['app', 'lb', 'server', 'db', 'events', 'stock-svc', 'reports', 'worker'],
					journey: 'order-event',
					set: publishing,
					body: [
						'A queue hands each note to one worker, and forgets it once it’s done, like RabbitMQ or Amazon SQS. A stream keeps every event for days, and every subscriber reads all of them, like Kafka.',
						'So a new subscriber can join tomorrow, a loyalty-points service, say, and the order code doesn’t change at all. It can even read last week’s events, to catch up.',
					],
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
						'The server saves the order, then crashes before publishing. The order exists, but no receipt is sent, and the stock is never taken. Publish first, and a crash leaves an event for an order that doesn’t exist.',
						'The fix is an outbox: the event is saved in the database in the same transaction as the order, and a worker publishes it from there. Stockroom works this way.',
					],
					example: {
						says: 'In one transaction:',
						data: { orders: 'order 5521', outbox: 'event: order 5521 placed' },
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the event stream. Take the subscribers down, one at a time, and see what still works.',
				journey: 'order-event',
				set: publishing,
			},
		},
		{
			id: 'real-time',
			title: 'Real-time updates',
			summary: 'Asking again and again, or being told the moment something changes.',
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
					title: 'Keep a line open',
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
						'Instead, each app opens one connection to a **Live updates server**, and keeps it open: a WebSocket. When a van sends its location, the server passes it on, and the live server pushes it down the connection of whoever is watching.',
						'Now messages flow only when something changes. On the same busy evening, the servers handle just the vans’ updates.',
					],
				},
				{
					title: 'Other ways to push',
					show: ['vans', 'app', 'lb', 'server', 'db', 'live'],
					journey: 'parcel-push',
					draw: ['parcel-connect'],
					set: pushing,
					note: {
						title: 'Open connections cost too',
						text: 'Each one holds a little memory, for as long as the app is open. And when a live server restarts, all its apps reconnect at once, so they wait a random moment first.',
					},
					body: [
						'A WebSocket carries messages both ways, which suits chat and games. When only the server talks, server-sent events are simpler. Long polling asks, and the server holds the answer until there’s news.',
						'When the app is closed, a push notification goes through Apple or Google instead, as in the ride-hailing app. And for something checked once a minute, plain polling is fine.',
					],
				},
				{
					title: 'Is it paid yet?',
					show: ['app', 'lb', 'server', 'payments'],
					journey: 'pay-poll',
					set: { only: ['pay-poll'], copies: { server: 3 } },
					facts: [{ load: 'payments' }],
					body: [
						'Companies poll each other too. While shoppers pay, the shop asks the **Payment provider** every couple of seconds whether each payment has gone through: 50 questions a second, nearly all answered “not yet”.',
					],
				},
				{
					title: 'Tell me when it’s done: webhooks',
					show: ['app', 'lb', 'server', 'db', 'payments'],
					journey: 'pay-webhook',
					current: [['payments', 'lb']],
					set: { only: ['pay-webhook'], copies: { server: 3 } },
					facts: [{ load: 'server' }],
					body: [
						'Instead, the shop gives the provider an address of its own. When a payment goes through, the provider calls it, once. That’s a webhook: the call goes the other way.',
						'Webhooks can arrive twice, late, or never, so the shop handles repeats, and still checks now and then for any it missed.',
					],
					example: {
						says: 'POST shop.example.com/webhooks/payments',
						data: { event: 'payment succeeded', order: '5521', amount: '₹1,499' },
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the live updates. Push the traffic up and down, and compare it with polling.',
				journey: 'parcel-push',
				set: pushing,
			},
		},
	],
};

const oneOfEach = { only: ['look-lb'], bigger: roomy };
const paying = { only: ['pay-card'], copies: { server: 3 } };
const suggesting = { only: ['look-recs'], copies: { server: 3 } };
const suggestingIfAble = { only: ['look-recs-opt'], copies: { server: 3 }, down: ['recs'] };
const flooded = { only: ['look-gw', 'scrape'], copies: { server: 3 }, bigger: roomy };
const limited = { only: ['look-gw', 'scrape-limited'], copies: { server: 3 }, bigger: roomy };
const watching = { only: ['look-lb'], copies: { server: 3 } };

const reliability: Track = {
	id: 'reliability',
	name: 'Reliability',
	tagline:
		'Spares, timeouts and retries, failing gracefully, limits, and seeing what’s going on: keeping the shop up when things go wrong.',
	lessons: [
		{
			id: 'redundancy',
			title: 'Redundancy and failover',
			summary:
				'More than one of everything, in more than one place, and something ready to take over.',
			steps: [
				{
					title: 'One of each',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: oneOfEach,
					facts: ['succeed'],
					body: [
						'Here, the shop runs one load balancer, one web server and one database. It works. But each of them is a single point of failure: if any one breaks, nobody can shop.',
					],
				},
				{
					title: 'The server breaks',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { ...oneOfEach, down: ['server'] },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A disk fails, or an update goes wrong, and the web server stops. With nothing to take over, every page fails.',
					],
				},
				{
					title: 'Spares, in two places',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { ...oneOfEach, traffic: 3, copies: { server: 4 } },
					copies: true,
					facts: ['succeed', { busy: 'server' }, { copies: 'server' }],
					body: [
						'Run spares instead: four copies, two in each of two data centres, called zones. Zones are a few kilometres apart, with their own power and network.',
						'Parts break one at a time, and sometimes a whole zone does, in a fire, a flood or a cut cable.',
					],
				},
				{
					title: 'A zone goes down',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { ...oneOfEach, traffic: 3, copies: { server: 2 } },
					copies: true,
					facts: ['succeed', { busy: 'server' }, { copies: 'server' }],
					body: [
						'When a zone goes down, its two copies go with it. The other two take everything: busier, but every page still works.',
						'So each zone needs enough copies to carry the whole load alone.',
					],
				},
				{
					title: 'Not enough spares',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { ...oneOfEach, traffic: 3, copies: { server: 1 } },
					copies: true,
					facts: ['succeed', { busy: 'server' }, { copies: 'server' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Run three copies instead, two in one zone and one in the other, and lose the bigger zone. One copy is left for everything, and a third of the shoppers get errors.',
						'Spares only help if there are enough of them, in the right places.',
					],
				},
				{
					title: 'Failover: taking over',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-promoted',
					set: {
						only: ['order-promoted'],
						traffic: 3,
						copies: { server: 3 },
						down: ['db'],
					},
					facts: ['succeed'],
					body: [
						'Some parts can’t simply run side by side, like the leader database. They keep a standby, a follower, that takes over when the leader breaks. That’s failover, and the few seconds it takes still fail.',
						'Copies that all serve at once are called active-active. A standby that waits is active-passive: simpler, but it has to work the one time it’s needed.',
					],
				},
				{
					title: 'Break things on purpose',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { ...oneOfEach, traffic: 3, copies: { server: 4 } },
					copies: true,
					body: [
						'A spare you’ve never used may not work. So teams switch parts off on purpose, at a calm moment, to check that the spares really take over.',
						'Netflix built a tool for it, Chaos Monkey, that switches off its servers at random, every working day.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with four copies. Take copies away from the web server’s details, as if a zone went down, and find how few the shop can run on.',
				journey: 'look-lb',
				set: { ...oneOfEach, traffic: 3, copies: { server: 4 } },
			},
		},
		{
			id: 'timeouts-retries',
			title: 'Timeouts and retries',
			summary:
				'How long to wait, when to try again, and how trying again can make things worse.',
			steps: [
				{
					title: 'How long to wait',
					show: ['app', 'lb', 'server', 'payments'],
					journey: 'pay-card',
					set: { ...paying, retries: false },
					facts: ['wait'],
					timeline: true,
					body: [
						'Paying sends a request to the **Payment provider**, which normally answers in about 40 ms. But how long should the server wait if it doesn’t?',
						'It waits up to a set time, a timeout, then gives up. Too long, and people stare at a spinner while requests pile up. Too short, and it gives up on answers that were on their way. A little above the slowest normal answer is about right.',
					],
				},
				{
					title: 'A shaky connection',
					show: ['app', 'lb', 'server', 'payments'],
					journey: 'pay-card',
					set: { ...paying, retries: false, flaky: { payments: 0.05 } },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Now 1 call in 20 fails for no lasting reason: a dropped connection, a busy moment. With no second try, 1 payment in 20 fails.',
					],
				},
				{
					title: 'Try again',
					show: ['app', 'lb', 'server', 'payments'],
					journey: 'pay-card',
					set: { ...paying, retries: true, flaky: { payments: 0.05 } },
					facts: ['succeed', { retries: 'payments' }],
					body: [
						'Try again, up to twice, and a payment fails only if all three tries do: about 1 in 8,000. It costs little, because few calls fail.',
					],
				},
				{
					title: 'A sale, without retries',
					show: ['app', 'lb', 'server', 'payments'],
					journey: 'pay-card',
					set: { ...paying, retries: false, traffic: 2.4 },
					facts: ['succeed', { busy: 'payments' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A sale brings 120 payments a second, and the provider can take 100. Without retries, 1 payment in 6 fails.',
					],
				},
				{
					title: 'A retry storm',
					show: ['app', 'lb', 'server', 'payments'],
					journey: 'pay-card',
					set: { ...paying, retries: true, traffic: 2.4 },
					facts: ['succeed', 'wait', { retries: 'payments' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'With retries, every failed call comes back, twice. The provider now gets 222 calls a second for the same 120 payments, so most calls fail, and those come back too.',
						'It still finishes only 100 a second, so no more payments go through than without retries, and each one takes far longer. That’s a retry storm: when a part fails because it’s too busy, retries only pile more on.',
					],
				},
				{
					title: 'Wait, then try',
					show: ['app', 'lb', 'server', 'payments'],
					journey: 'pay-card',
					set: { ...paying, retries: true, traffic: 2.4 },
					body: [
						'So retries wait first, longer each time, plus a random bit, so that thousands of callers don’t all come back in the same instant. That’s called backoff, with jitter.',
						'Callers also stop retrying when most calls fail, and only one layer retries, not every layer on the way. A circuit breaker stops calling altogether for a while.',
					],
					example: {
						says: 'When each try happens.',
						data: {
							'try 1': 'now',
							'try 2': 'after 0.2 s, plus a random bit',
							'try 3': 'after 0.4 s, plus a random bit',
						},
					},
				},
				{
					title: 'Charged twice?',
					show: ['app', 'lb', 'server', 'payments'],
					journey: 'pay-card',
					set: { ...paying, retries: true },
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A charge goes through, but the answer is lost on the way back. The server tries again, and the card is charged twice.',
						'So each payment carries an idempotency key, an id made once for this payment. A retry sends the same key, and the provider answers “already done” instead of charging again.',
					],
					example: {
						says: 'Charge ₹1,499, key pay-5521-7f3a.',
						data: {
							'first try': 'charged, but the answer was lost',
							'second try, same key': 'already charged: no new charge',
						},
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely during the sale, with retries on. Turn retries off and on, and watch the payment provider.',
				journey: 'pay-card',
				set: { ...paying, retries: true, traffic: 2.4 },
			},
		},
		{
			id: 'failing-gracefully',
			title: 'Failing gracefully',
			summary: 'When a part breaks, show what you can, and stop waiting for it.',
			steps: [
				{
					title: 'A page with suggestions',
					show: ['app', 'lb', 'server', 'db', 'recs'],
					journey: 'look-recs',
					set: suggesting,
					facts: ['wait'],
					timeline: true,
					body: [
						'Each product page also shows similar products, from the **Recommendations** service. Nice to have, but not what the shopper came for.',
					],
				},
				{
					title: 'Suggestions break, and so does the page',
					show: ['app', 'lb', 'server', 'db', 'recs'],
					journey: 'look-recs',
					set: { ...suggesting, down: ['recs'] },
					facts: ['succeed', 'wait'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'When it goes down, the server waits 2 seconds for suggestions, gives up, and fails the whole page. A broken extra has taken down the main thing.',
						'In a bigger system, this is how one failure spreads, part to part, until everything is down: a cascading failure.',
					],
				},
				{
					title: 'Show the page without them',
					show: ['app', 'lb', 'server', 'db', 'recs'],
					journey: 'look-recs-opt',
					set: suggestingIfAble,
					facts: ['succeed', 'degraded', 'wait'],
					body: [
						'Make the suggestions optional: if they don’t come, show the page without them. That’s graceful degradation. Every page works again.',
						'But each one still waits 2 seconds before giving up on the suggestions.',
					],
				},
				{
					title: 'Stop asking for a while',
					show: ['app', 'lb', 'server', 'db', 'recs'],
					journey: 'look-recs-opt',
					set: { ...suggestingIfAble, circuitBreakers: true },
					facts: ['succeed', 'wait'],
					body: [
						'A circuit breaker notices that calls to recommendations keep failing, and stops making them for a while. Pages skip the suggestions at once, instead of waiting.',
						'Every so often it lets one call through, to see if they’re back.',
					],
				},
				{
					title: 'Drop the extras on purpose',
					show: ['app', 'lb', 'server', 'db', 'recs'],
					journey: 'look-recs-opt',
					set: { ...suggestingIfAble, circuitBreakers: true },
					body: [
						'In a big rush, the same idea works on purpose: switch off the extras, like suggestions and reviews, so the servers spend their time on what matters most, like checkout.',
						'That’s called load shedding. Deciding ahead of time what can be dropped, and in what order, is part of designing any app.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with recommendations down. Turn circuit breakers on and off, and watch the wait.',
				journey: 'look-recs-opt',
				set: suggestingIfAble,
			},
		},
		{
			id: 'rate-limiting',
			title: 'Rate limiting',
			summary: 'Limit how often each user can ask, so no one user can take the shop down.',
			steps: [
				{
					title: 'A bot arrives',
					show: ['app', 'bot', 'lb', 'gateway', 'server', 'db'],
					journey: 'look-gw',
					draw: ['scrape'],
					set: flooded,
					facts: [
						{ succeed: 'look-gw', label: 'Shoppers’ pages that work' },
						{ busy: 'server' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Someone points a **Scraper bot** at the shop, to copy every product and price. It asks 400 times a second, far more than all 150 shoppers together.',
						'The servers fill up, and real shoppers’ pages fail.',
					],
				},
				{
					title: 'A limit for each user',
					show: ['app', 'bot', 'lb', 'gateway', 'server', 'db'],
					journey: 'look-gw',
					draw: ['scrape-limited'],
					current: [['gateway', 'server']],
					set: limited,
					facts: [
						{ succeed: 'look-gw', label: 'Shoppers’ pages that work' },
						{ busy: 'server' },
					],
					body: [
						'The **API gateway** counts each user’s requests. Up to 20 a second is fine. Past that, it answers “429: too many requests” at once, without bothering the servers.',
						'The bot gets its 20 a second, and the other 380 are turned away at the door. Shoppers never come near the limit.',
					],
					example: {
						says: 'The bot’s 21st request this second.',
						data: {
							limit: '20 a second for each user',
							answer: '429 Too many requests. Try again in 1 second.',
						},
					},
				},
				{
					title: 'How it counts',
					show: ['app', 'bot', 'lb', 'gateway', 'server', 'db'],
					journey: 'look-gw',
					draw: ['scrape-limited'],
					set: limited,
					body: [
						'A common way is a bucket of tokens for each user. Each request takes a token, and tokens drip back in, 20 a second. A short burst is fine, as long as the bucket isn’t empty.',
						'The counts live in a fast shared store, like Redis, so every copy of the gateway sees the same numbers.',
					],
				},
				{
					title: 'Limits everywhere',
					show: ['app', 'bot', 'lb', 'gateway', 'server', 'db'],
					journey: 'look-gw',
					draw: ['scrape-limited'],
					set: limited,
					body: [
						'Limits also protect the shop from its own mistakes: an app update that asks in a loop, or a partner who retries too fast.',
						'And the companies the shop calls have limits of their own. If the payment provider allows 100 calls a second, the shop has to stay under it, or its own payments start failing.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely with the bot and no limit. Add copies of the web server, and see how many it takes to keep up, compared with one limit.',
				journey: 'look-gw',
				set: flooded,
			},
		},
		{
			id: 'observability',
			title: 'Observability',
			summary: 'Seeing what’s going on inside: metrics, traces, logs and alerts.',
			steps: [
				{
					title: 'Three numbers for every part',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: watching,
					facts: ['rate', 'succeed', 'wait'],
					body: [
						'You can’t fix what you can’t see. For every service, three numbers matter most: how many requests arrive, how many fail, and how long they take. Measured every few seconds and drawn as graphs, they’re called metrics.',
						'The numbers above the diagram, in every lesson here, are metrics.',
					],
				},
				{
					title: 'Something’s slow',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { ...watching, traffic: 2.9 },
					facts: ['rate', 'succeed', 'wait'],
					tags: [{ text: 'Slow', tone: 'wait' }],
					body: [
						'One evening, pages take far longer. Every page still works, so nothing is broken, but shoppers notice. The metrics say something is wrong, but not where.',
					],
				},
				{
					title: 'A trace: where the time went',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { ...watching, traffic: 2.9 },
					facts: ['wait'],
					timeline: true,
					body: [
						'A trace follows one request through every part it visits, and times each step, like the list beside the diagram. Here, the database takes most of the time. That’s the one to fix.',
						'Each request is given an id when it arrives, and every part passes it along, so the steps can be put back together.',
					],
				},
				{
					title: 'Logs: what happened, in words',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { ...watching, traffic: 2.9 },
					body: [
						'Each part also writes a line for anything worth knowing: an error, a slow query, a payment refused. These are its logs.',
						'Each line carries the request’s id, so you can find every line about one shopper’s slow page, from every part it passed through.',
					],
					example: {
						says: 'Three lines about one request, from two parts.',
						data: {
							'20:02:01.120 web': 'req 7f3a: GET /products/77',
							'20:02:01.410 db': 'req 7f3a: slow query, 280 ms',
							'20:02:01.415 web': 'req 7f3a: answered in 295 ms',
						},
					},
				},
				{
					title: 'Wake someone when shoppers suffer',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'look-lb',
					set: { ...watching, traffic: 2.9 },
					facts: [
						{ label: 'Target', value: '99.9%', hint: 'of pages work, in under 300 ms' },
						'wait',
					],
					body: [
						'Nobody watches graphs all night. The best warnings go off when shoppers feel something, not when a machine is busy: say, fewer than 99.9% of pages working in under 300 ms. Tonight’s pages are slower than that, so the warning goes off, and someone is woken up.',
						'That promise is called an SLO. The 0.1% left over is the error budget: about 43 minutes a month when things may go wrong. Use it up, and the team slows down new changes until things are steady again.',
					],
				},
			],
			tryIt: {
				text: 'Open Explore freely on the slow evening. Follow the journey, find the slow step, and fix it.',
				journey: 'look-lb',
				set: { ...watching, traffic: 2.9 },
			},
		},
	],
};

export const basics: SystemInput = {
	id: 'basics',
	name: 'The basics',
	tagline:
		'The ideas every system is built from, on a small shop app: requests, latency, throughput and more.',
	basis: 'example',
	description: [
		'A small online shop: you look at products and place orders on your phone, and a web server answers, using a database. It’s made up to teach the ideas every other system here is built from, one at a time.',
		'Each lesson shows only the parts it’s about, and changes one thing at a time, so you can see exactly what it does.',
	],
	components: [
		{
			id: 'app',
			name: 'Shop app',
			kind: 'client',
			layer: 'clients',
			summary:
				'The app on your phone. It shows products and takes orders, and asks the server for everything.',
			why: 'It’s how people shop.',
			onFailure: 'This app stands for the shoppers, so the simulation doesn’t make it fail.',
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
			scaling: 'It can store any number of photos, but it can only send so many a second.',
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
			scaling: 'It’s usually spread over many machines, each taking a share of the writes.',
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
			onFailure: 'A third of the shoppers can’t place orders. The others aren’t affected.',
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
				{ from: 'server', to: 'queue', label: 'Leave a note for the email', mode: 'async' },
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
				{ from: 'cache', to: 'db', label: 'Not there: read the database', onMiss: true },
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
				{ from: 'db', to: 'replica', label: 'Copy the change', mode: 'async' },
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
			description: 'Someone opens an order. The whole order is one document, read in one go.',
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
				{ from: 'server', to: 'logdb', label: 'Add it to the end of the log', work: 0.2 },
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
				{ from: 'server', to: 'logdb', label: 'Look in the log and the files', work: 1.5 },
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
				{ from: 'photo-worker', to: 'files', label: 'Save smaller sizes', mode: 'async' },
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
				{ from: 'db', to: 'replica', label: 'Copy the change, and wait' },
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
				{ from: 'server', to: 'shard-2', label: 'Save it: every other seller', share: 0.2 },
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
				{ from: 'server', to: 'live', label: 'Pass it on to the watchers', mode: 'async' },
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
			description: 'A sale starts, and three times as many shoppers arrive within minutes.',
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
	course: [requests, performance, scaling, storing, distributed, communication, reliability],
};
