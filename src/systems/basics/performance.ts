import type { Track } from '@/learn/course';
import type { Conditions } from '@/sim/scenario';
import { type TrackModule, look } from './shared';

// most of these lessons are about the server alone, so the database is made big enough to stay out of the way
const serverOnly: Conditions = { only: ['look'], bigger: { db: 10 } };
const phone: Conditions = { only: ['fd-phone'] };
const fanout: Conditions = { only: ['fd-fanout'] };
const sale: Conditions = { ...serverOnly, traffic: 5 };
// the napkin math lesson's peak: 700 product pages a second
const peak: Conditions = { ...serverOnly, traffic: 14 };

const performance: Track = {
	id: 'performance',
	name: 'Performance',
	tagline:
		'Latency, percentiles, throughput and capacity, why things slow down near full, what happens past it, and the rough sums that size a design.',
	lessons: [
		{
			id: 'latency',
			title: 'Latency: how long you wait',
			summary:
				'Where the time goes, why the slowest step decides, why averages hide the slow ones, and how a page that asks many parts meets the slow end of each.',
			steps: [
				{
					title: 'Every step takes time',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					facts: ['wait'],
					timeline: true,
					body: [
						'Latency is the time from asking to getting the answer. For a product page, it’s the **Web server**’s time plus the **Database**’s time, added up.',
						'It’s measured in milliseconds, thousandths of a second. A blink takes about 100.',
					],
				},
				{
					title: 'Where the time goes',
					show: ['app', 'server', 'db'],
					journey: 'fd-phone',
					set: phone,
					facts: ['wait'],
					timeline: true,
					body: [
						'Time goes to four places. The network: every trip across it, there and back. Waiting in line: a request that arrives while a part is busy waits its turn. The work itself: the processor building the page. And the disk: anything not already in memory has to be read from it.',
						'The first lesson’s 43 ms left the network out. On a phone, with a connection already open, the same page takes about 190 ms, and 150 of it is the network. The napkin math lesson gives rough times for memory, disks and the network.',
					],
					example: {
						says: 'Where the 190 ms goes.',
						data: {
							'the network, there and back': '150 ms',
							'the Web server, waiting its turn and working': 'about 20 ms',
							'the Database, the same, plus reading': 'about 20 ms',
						},
					},
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
						'Jakob Nielsen’s old rule of thumb still holds. Under about a tenth of a second, 100 ms, feels instant. Up to about a second, people notice the delay but keep their train of thought. Past about 10 seconds, their attention wanders, and many give up.',
						'That’s why every design here counts milliseconds: each step adds to the wait someone feels.',
					],
				},
				{
					title: 'Averages hide the slow ones',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					facts: [
						{ label: 'Average', value: '55 ms', hint: 'the example’s 1,000 requests' },
						{ label: 'p50', value: '30 ms', hint: 'half are this quick or quicker' },
						{
							label: 'p99',
							value: '1 s',
							hint: 'the slowest 1 in 100 take this long or longer',
						},
					],
					body: [
						'The wait over each diagram here is an average. Real requests vary: most are quick, and a few are very slow, because they meet a long queue, a cold cache, a slow disk or a lost piece on the network. An average hides those few.',
						'So teams sort the times, and read them at points along the list. The 50th percentile, p50 or the median, is the middle one: half are quicker. At p95, 95 in 100 are quicker; at p99, 99 in 100. The slow end, p99 and beyond, is called the tail.',
						'Targets are set on the tail, because someone who opens 100 pages is likely to meet it. Amazon’s Dynamo paper describes targets set at p99.9: the slowest 1 in 1,000.',
					],
					example: {
						says: '1,000 requests for the product page, sorted by time.',
						data: {
							'the first 900': '30 ms each',
							'the next 80': '100 ms each',
							'the slowest 20': '1 s each',
							'the average': '55 ms, which looks fine',
							'p50, p95 and p99': '30 ms, 100 ms and 1 s',
						},
					},
				},
				{
					title: 'One page, many parts',
					show: ['app', 'server', 'db', 'recs', 'delivery', 'stock-svc'],
					journey: 'fd-fanout',
					set: fanout,
					facts: ['wait'],
					timeline: true,
					body: [
						'Real pages need more than one part. Here the **Web server** reads the product from the **Database**, then asks **Recommendations** for similar products, the **Delivery service** when it could arrive, and the **Stock service** whether the nearest warehouse has it.',
						'Asked one after another, as here, their times add up: about 105 ms.',
					],
				},
				{
					title: 'Asking at the same time',
					show: ['app', 'server', 'db', 'recs', 'delivery', 'stock-svc'],
					journey: 'fd-fanout-together',
					current: [
						['server', 'recs'],
						['server', 'delivery'],
						['server', 'stock-svc'],
					],
					set: { only: ['fd-fanout-together'] },
					facts: ['wait'],
					timeline: true,
					body: [
						'The three services don’t need each other’s answers, so the **Web server** can ask them all at once, and wait only for the slowest, here **Recommendations**. The page now takes about 83 ms, not 105.',
						'So calls that don’t depend on each other go out together whenever they can. But the page still waits for the slowest of them, and the more parts a page asks, the more often one of them is slow.',
					],
				},
				{
					title: 'The tail at scale',
					show: ['app', 'server', 'db', 'recs', 'delivery', 'stock-svc'],
					journey: 'fd-fanout',
					set: fanout,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Say each part is slow, past its own p99, 1 time in 100. A page that needs one of them is slow 1 time in 100. But a page that needs all four is slow whenever any one of them is: about 4 times in 100. A search that asks 100 servers at once is slow 63 times in 100.',
						'So one part’s rare slow moment becomes the page’s everyday wait. Jeff Dean and Luiz Barroso at Google called this the tail at scale. One of their fixes is the hedged request: if an answer is later than usual, ask another copy too, and use whichever answers first. In one of Google’s tests, it cut the slowest waits sharply, for only a few per cent more requests.',
						'The other fix is not to wait for the extras: show the page without suggestions if they’re late, as the lesson on failing gracefully shows.',
					],
					example: {
						says: 'The chance a page is slow, when each part is slow 1 time in 100.',
						data: {
							'1 part': '1 in 100',
							'4 parts': '0.99⁴ = 0.96 all quick, so about 4 in 100 slow',
							'10 parts': '0.99¹⁰ = 0.90, so about 1 in 10',
							'100 parts': '0.99¹⁰⁰ = 0.37, so about 63 in 100',
						},
					},
				},
				{
					title: 'A latency budget',
					show: ['app', 'server', 'db'],
					journey: 'fd-phone',
					set: phone,
					facts: [
						'wait',
						{ label: 'Target', value: '300 ms', hint: 'p99, the whole page' },
					],
					body: [
						'Teams turn this into a target, then share it out. Say the product page should arrive within 300 ms for 99 requests in 100. On a phone, the network takes 150 of that, which leaves 150 ms for the shop, and each part gets a slice of it: its budget.',
						'A budget tells each team how fast its part must be, and sets its timeouts: a part that blows its slice is cut off, or left out of the page. The average today is about 190 ms, but the target is on the tail, so it needs room above the average.',
					],
					example: {
						says: 'The product page’s budget: 300 ms, at p99.',
						data: {
							'the network, there and back': '150 ms',
							'the Web server': '50 ms',
							'the Database': '50 ms',
							'kept spare': '50 ms',
						},
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					body: [
						'Find where the time goes first, then pick the fix for that part. A fix anywhere else changes almost nothing.',
					],
					compare: {
						title: 'Ways to cut the wait',
						rows: [
							[
								'Fewer round trips',
								'Reuse connections, and fetch what a screen needs in one request. Often the biggest win on phones.',
							],
							[
								'Move closer',
								'A CDN, or servers in a region near the users, shortens every round trip.',
							],
							[
								'Cache',
								'Keep popular answers in memory, and skip the database and its disk.',
							],
							[
								'Ask at the same time',
								'Calls that don’t depend on each other go out together: the page waits for the slowest, not the sum.',
							],
							[
								'Do it later',
								'Move work nobody needs to wait for into the background.',
							],
							[
								'Keep headroom',
								'A part at 90% busy takes 5 times as long as at 50%. Add copies before it gets there.',
							],
							[
								'Trim the tail',
								'Timeouts, hedged requests, and pages that show what they have when the extras are late.',
							],
						],
					},
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
			summary:
				'How much work gets done, the most a part can do, how many requests are in progress at once, and why more throughput isn’t a faster answer.',
			steps: [
				{
					title: 'Requests a second',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					facts: ['rate', { load: 'server' }],
					body: [
						'Throughput is how much work gets done: here, how many requests are answered each second. Right now, 50.',
						'It’s the other half of performance. Latency is how long one request takes; throughput is how many get done. A shop can be quick for one shopper, and still unable to cope with a sale.',
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
						'You find a part’s capacity by measuring it. A load test sends more and more requests, with a tool like k6, JMeter or Locust, until the wait or the errors pass what you’d accept. That point, not the most it can survive, is its capacity.',
						'How busy a part is, its load compared with its capacity, is the first number to look at when something feels slow.',
					],
				},
				{
					title: 'Requests in progress: Little’s law',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: serverOnly,
					facts: ['rate', 'wait'],
					body: [
						'How many requests are being worked on at any moment? A simple rule answers it, called Little’s law: requests in progress = how many arrive a second × how long each takes.',
						'Here, 50 arrive a second, and each takes 36 ms, which is 0.036 seconds. 50 × 0.036 is about 2: at any moment, about 2 requests are in progress.',
						'It works for anything that flows. A shop where 10 people walk in a minute, and each stays 6 minutes, has about 60 people inside.',
					],
				},
				{
					title: 'Busier, and a bigger crowd',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { ...serverOnly, traffic: 1.8 },
					facts: ['rate', { busy: 'server' }, 'wait'],
					body: [
						'On a busy evening, 90 requests arrive a second, and the server is 90% busy. Each now takes 116 ms, so about 10 are in progress at once: 90 × 0.116. Not even twice the traffic, but nearly 6 times the crowd.',
						'That matters, because each request in progress holds something: memory, a thread, a connection to the database. Those run out. Postgres, for example, allows 100 connections by default. When a pool of connections is used up, new requests wait in line for one.',
						'Notice too that the wait went up far more than the traffic did. The next lesson is about why.',
					],
				},
				{
					title: 'More throughput isn’t a faster answer',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { ...serverOnly, traffic: 3.6, copies: { server: 4 } },
					facts: ['rate', 'wait', { copies: 'server' }],
					copies: true,
					body: [
						'With four copies of the server, the shop answers 180 a second, nearly four times as many, and each request still takes about 35 ms. More copies raised the throughput, but no single answer got faster.',
						'To make each answer faster, the work itself has to shrink: a cache, an index, less to do. Throughput and latency are different numbers, fixed in different ways.',
						'Sometimes you trade one for the other. Kafka, for example, can wait a few milliseconds to send messages in batches: each one waits a little longer, and far more get through.',
					],
				},
				{
					title: 'Five numbers, side by side',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					body: [
						'Five numbers describe how a part is doing, and they’re linked. Push the throughput towards the capacity, and how busy it is, the wait, and the requests in progress all go up together.',
					],
					compare: {
						title: 'Five numbers, side by side',
						rows: [
							['Latency', 'How long one request takes. Read it at p50 and p99.'],
							['Throughput', 'How many requests get done each second.'],
							[
								'Capacity',
								'The most a part can do each second, found by a load test.',
							],
							[
								'How busy',
								'Load divided by capacity. Above about 70%, waits climb fast.',
							],
							[
								'In progress',
								'Rate times time, by Little’s law: how many are being worked on at once.',
							],
						],
					},
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
			summary:
				'The busier a part is, the longer each request waits in line. Why teams aim for about 70% busy, and keep room to spare.',
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
						'At 98%, the queue hardly ever clears, and the wait is enormous, for only a little more traffic than at 90%.',
					],
				},
				{
					title: 'The rule behind it',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...serverOnly, traffic: 1.4 },
					facts: [{ busy: 'server' }],
					body: [
						'The server takes 10 ms for a request when it’s idle. Busy, its part of the wait is that time divided by the share of time it’s free: 10 ms ÷ (1 − how busy). Near full, the share that’s free gets tiny, so the wait gets huge.',
						'That’s the simplest model of a queue, with requests arriving at random. Real traffic comes in bursts, and some requests take far longer than others, which often makes real queues worse still.',
					],
					example: {
						says: 'The server’s part of the wait, at each level.',
						data: {
							'30% busy': '10 ms ÷ 0.7 = 14 ms',
							'50% busy': '10 ms ÷ 0.5 = 20 ms',
							'70% busy': '10 ms ÷ 0.3 = 33 ms',
							'90% busy': '10 ms ÷ 0.1 = 100 ms',
							'98% busy': '10 ms ÷ 0.02 = 500 ms',
						},
					},
				},
				{
					title: 'Room to spare',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...serverOnly, traffic: 3.6, copies: { server: 3 } },
					facts: ['succeed', { busy: 'server' }, 'wait'],
					copies: true,
					body: [
						'On a sale day the shop runs three copies of the server, answering 180 requests a second between them, and each is 60% busy. Why leave so much room?',
						'Because things go wrong. A rush can arrive within minutes, faster than new copies can start. A copy can break, or be taken out for an update. The room kept spare for those moments is called headroom.',
					],
				},
				{
					title: 'One copy breaks',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...serverOnly, traffic: 3.6, copies: { server: 2 } },
					facts: ['succeed', { busy: 'server' }, 'wait'],
					copies: true,
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'One copy breaks. The other two take its share, and they’re 90% busy: slower, but everyone still gets an answer. Had the three been running at 80%, losing one would put the other two at 120%, past full, and people would start getting errors.',
						'How much room you need depends on how many copies there are. With three, losing one adds half again to each of the others; with ten, only a ninth. So teams aim for about 60 to 70% busy, and autoscaling adds copies long before they’re full.',
					],
				},
				{
					title: 'How busy to run',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...serverOnly, traffic: 1.4 },
					body: [
						'Running fuller saves money, and running emptier saves waits. Where to sit depends on whether anyone is waiting for the answer.',
					],
					compare: {
						title: 'How busy to run',
						rows: [
							[
								'Under 50%',
								'Quick answers and lots of room, but you pay for machines that mostly wait.',
							],
							[
								'About 60 to 70%',
								'The usual target for parts people wait on. Room for a rush, or a lost copy.',
							],
							[
								'80% and up',
								'Waits climb fast, and a lost copy or a rush tips it past full.',
							],
							[
								'Close to 100%',
								'Fine for background work nobody waits on, like the email worker: a queue in front holds what it can’t take yet.',
							],
						],
					},
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
			summary:
				'Above its capacity, a part doesn’t just slow down: it fails people. Turning requests away quickly, 503 and Retry-After, dropping the least important first, and making room.',
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
					title: 'Why it gets worse, not just slower',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...serverOnly, traffic: 2.5 },
					facts: ['rate', 'wait'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Past full, the line in front of the server grows every second, because more arrive than leave. Here, 125 arrive a second and each waits about 2 seconds, so about 250 are in progress at once, by Little’s law. Each one holds memory and a connection.',
						'Worse, many answers come too late to matter: the app has already given up, so the server did that work for nobody. And people tap again, adding even more requests. Past full, a part can be working flat out and helping almost no one.',
					],
				},
				{
					title: 'A big sale',
					show: ['app', 'server'],
					journey: 'look',
					set: sale,
					facts: ['succeed', { busy: 'server' }, 'wait'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A sale starts, and 250 requests a second arrive: two and a half times what the server can answer. 3 in 5 fail, and every one of them keeps someone waiting 2 seconds first, for nothing.',
					],
				},
				{
					title: 'Say no at once',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...sale, shed: ['server'] },
					facts: ['succeed', 'wait'],
					body: [
						'Instead, the server turns away what it can’t answer, at once. It keeps only a short line of requests waiting, and anything beyond that gets a quick “busy, try later”.',
						'The same 2 in 5 get through, because the server can’t do more. But nobody waits for nothing now: the ones turned away find out at once, and the ones let in are answered quickly, since the line is short. The average wait falls from 2.0 s to 46 ms, and the people turned away can come back in a moment.',
						'It’s done with a cap on how many requests are worked on or waiting at once, in the server itself or in the load balancer in front, with an error straight away for the rest. Envoy, a popular load balancer, calls these caps circuit breaking. A circuit breaker in the caller, from the reliability lessons, gets a similar result from the other side.',
					],
				},
				{
					title: '503, and when to come back',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...sale, shed: ['server'] },
					facts: ['succeed'],
					body: [
						'Turned away well, a request gets 503 Service Unavailable, with a Retry-After header saying how long to wait, usually in seconds. The app waits that long, plus a random bit called jitter, so the people turned away don’t all come back in the same second.',
						'When it’s one user asking too often, the answer is 429 Too Many Requests instead, which the rate limiting lesson covers. Both are quick, cheap answers, and far kinder than a timeout.',
					],
					example: {
						says: 'Turned away during the sale.',
						data: {
							status: '503 Service Unavailable',
							'Retry-After': '10',
							answer: '{ "error": "We’re very busy. Please try again in 10 seconds." }',
						},
					},
				},
				{
					title: 'Drop the least important first',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...sale, shed: ['server'] },
					body: [
						'Not every request matters equally. During a sale, placing an order matters more than a list of similar products, and both matter more than a record of what people clicked.',
						'So when there’s too much, drop the least important first, and keep the checkout working. That’s load shedding. Netflix, for example, sheds its less important requests first, so pressing play keeps working. The lesson on failing gracefully shows how a page copes without its extras.',
					],
					example: {
						says: 'What goes first, during a sale.',
						data: {
							'kept to the end': 'placing orders, paying',
							'dropped next': 'opening products, the cart',
							'dropped first': 'suggestions, records of clicks',
						},
					},
				},
				{
					title: 'Room to grow',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...sale, copies: { server: 4 } },
					facts: ['succeed', { busy: 'server' }, { copies: 'server' }],
					copies: true,
					body: [
						'Turning people away is for the moment. If the sale keeps going, the fix is more room: with four copies of the server, there’s room for 400 a second. It’s comfortably busy again, and everyone gets an answer.',
						'Adding copies is one way to grow, and the scaling lessons cover the others. Autoscaling can add copies by itself, but a new copy often takes a minute or more to start, so a sudden rush still needs headroom, or some turned away.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...sale, copies: { server: 4 } },
					body: [
						'Past full, someone is going to be disappointed. The choice is who, and how quickly they find out.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Let them wait',
								'Never on purpose. Past full, waiting only ends in timeouts.',
							],
							[
								'Turn away at once (503)',
								'A sudden rush, more than you can answer: say no quickly, with Retry-After.',
							],
							['Limit each user (429)', 'One user or bot asking far too often.'],
							[
								'Drop the least important',
								'Too much for everything: keep what matters most, and drop the extras.',
							],
							[
								'A queue in front',
								'Work that can wait, like emails: let it pile up, and do it at the workers’ pace.',
							],
							[
								'More room',
								'The real fix when demand stays high: more copies, bigger ones, or autoscaling with headroom.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely during the sale. Select the web server and switch on “Turn away at once”, then add copies from its details until everyone gets an answer.',
				journey: 'look',
				set: sale,
			},
		},
		{
			id: 'bottleneck',
			title: 'The bottleneck',
			summary:
				'The part that holds everything back: how to find it by measuring, why adding to anything else changes nothing, and why fixing it uncovers the next.',
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
						'The **Database** looks fine, two thirds busy, but only because the server lets just 100 a second through to it.',
					],
				},
				{
					title: 'Find it by measuring',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], traffic: 3.4 },
					facts: [{ busy: 'server' }, { busy: 'db' }],
					timeline: true,
					body: [
						'In a real system, you find the bottleneck by measuring, not guessing. For every part, look at how busy it is, how long its queue is, and how many requests it fails. Brendan Gregg calls this the USE method: utilisation, saturation and errors.',
						'Then look at where each request’s time goes, as in this list: here, the web server’s part is nearly all of it. Tools like Prometheus collect the numbers, Grafana graphs them, and traces show each request’s time, part by part.',
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
						'The whole shop now answers only 150 a second, exactly what the database can do: 88% of 170. The slowest part sets the pace for everything.',
					],
				},
				{
					title: 'More web servers won’t help',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], traffic: 3.4, copies: { server: 6 } },
					facts: ['succeed', { busy: 'server' }, { busy: 'db' }],
					copies: true,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Add three more web servers, six in all, and nothing changes: still 88% succeed. The servers are hardly busy, and the database is still past full.',
						'Speeding up any part that isn’t the bottleneck changes almost nothing for the whole. It only costs money.',
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
						'Back to three web servers, and give the database twice the capacity. Everything flows again.',
						'Fixing one bottleneck often uncovers the next. So look at how busy every part is, not just the first one that broke.',
					],
				},
				{
					title: 'Where bottlenecks hide',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], traffic: 3.4, copies: { server: 3 }, bigger: { db: 2 } },
					body: [
						'Some part is always the first to fill: every system has a bottleneck. The aim is to know which, and to keep it busy enough to be worth its cost, but never past full.',
					],
					compare: {
						title: 'Where bottlenecks hide',
						rows: [
							[
								'Web servers',
								'The easy one: add copies, because they keep nothing between requests.',
							],
							[
								'The database',
								'The usual one, because it’s the hardest to copy. A cache, read copies and indexes first, then splitting the data.',
							],
							[
								'One hot row',
								'Every order changing the same stock count, one at a time. Split the count, or queue the changes, as the storing lessons show.',
							],
							[
								'An outside service',
								'Its limit is someone else’s. Cache its answers, queue the calls, or agree a higher limit.',
							],
							[
								'Connection pools',
								'Plenty of power, but every request waits for one of a few connections. Measure the pool too.',
							],
							[
								'The network',
								'Big files, or many round trips. A CDN, smaller images, fewer requests.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the database as the bottleneck. Try adding web servers, then try the database, and see which one helps.',
				journey: 'look',
				set: { only: ['look'], traffic: 3.4, copies: { server: 3 } },
			},
		},
		{
			id: 'napkin-math',
			title: 'Napkin math',
			summary:
				'Rough times worth knowing, units, and the sums that size a design: requests a second from daily users, the peak, storage, bandwidth and servers, worked through for the shop.',
			steps: [
				{
					title: 'Why rough numbers',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					facts: ['rate'],
					body: [
						'Before choosing a design, you need to know roughly how big the problem is. Is it 10 requests a second, or 10,000? A few gigabytes, or a few petabytes? The answer changes everything: one database, or a hundred.',
						'So designers estimate, on the back of an envelope or a napkin. Round hard, keep one or two digits, and aim for the right power of ten, not the exact answer. In a system design interview, it’s expected early on.',
						'Today the shop gets about 50 product pages a second. This lesson works out what it would need if it grew.',
					],
				},
				{
					title: 'Times worth knowing',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					body: [
						'A few times are worth knowing by heart. They’re rough, and hardware keeps getting faster, but the gaps between them are what matter: memory is far faster than an SSD, an SSD far faster than a spinning disk, and anything inside a data centre far faster than anything across the world.',
					],
					compare: {
						title: 'Rough times, worth knowing',
						rows: [
							[
								'Read from memory',
								'About 100 nanoseconds: a ten-thousandth of a ms.',
							],
							[
								'Read a small block from an SSD',
								'About 0.1 ms: about a thousand times slower than memory.',
							],
							[
								'A seek on a spinning disk',
								'About 10 ms: about a hundred times slower than an SSD.',
							],
							['A round trip inside a data centre', 'About 0.5 ms.'],
							[
								'A round trip across a continent',
								'Tens of ms. Light in fibre covers about 200 km each ms, so every 1,000 km away adds at least 10 ms, there and back.',
							],
							[
								'A round trip between continents',
								'About 150 ms, California to the Netherlands and back.',
							],
							[
								'A phone on mobile data',
								'Tens to hundreds of ms for each round trip: 150 ms in these lessons.',
							],
						],
					},
				},
				{
					title: 'Units, and a day in seconds',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					body: [
						'Sizes go up in thousands. A kilobyte (KB) is about a thousand bytes, then come the megabyte (MB), gigabyte (GB), terabyte (TB) and petabyte (PB), each a thousand times the one before. A byte holds one English letter. Networks count in bits, and a byte is 8 bits.',
						'A day has 86,400 seconds. Round it to 100,000, and sums get easy: a million things a day is about 10 a second. More exactly, it’s about 12.',
					],
					example: {
						says: 'Sums worth remembering.',
						data: {
							'a day': '86,400 seconds, about 100,000',
							'a year': 'about 31.5 million seconds',
							'1 million a day': 'about 12 a second',
							'1 billion a day': 'about 12,000 a second',
							'1 gigabit a second': 'about 125 MB a second',
						},
					},
				},
				{
					title: 'Requests a second, and the peak',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					body: [
						'Say the shop grows to 1 million daily active users, people who open it on a given day, and each opens 20 products. That’s 20 million product pages a day. Divided by 86,400 seconds, it’s about 230 a second, on average.',
						'But nobody shops evenly through the day. Evenings are busy and nights are quiet, so the busiest hour is often two or three times the average, and a sale far more. Plan for the peak: three times 230 is about 700 a second.',
						'Orders are much rarer. If 1 shopper in 20 orders, that’s 50,000 orders a day, under 1 a second on average. Reads outnumber writes 400 to 1, which is why a cache and read copies pay off so well here.',
					],
					example: {
						says: 'From shoppers to requests a second.',
						data: {
							'shoppers a day': '1 million',
							'pages a day': '1 million × 20 = 20 million',
							'on average': '20 million ÷ 86,400 ≈ 230 a second',
							'at the peak, 3 times that': 'about 700 a second',
						},
					},
				},
				{
					title: 'Storage for a year',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					body: [
						'Each order is small: the items, the address, the prices, about 2 KB. 50,000 a day is 100 MB a day, and a year is about 37 GB. One database server holds that easily.',
						'Photos are another matter. If sellers add 2,000 photos a day at 500 KB each, that’s 1 GB a day, about 365 GB a year. That belongs in file storage like S3, not in the database.',
						'Then multiply by the copies kept. Data is often kept three times over, so a broken disk loses nothing: 37 GB of orders becomes about 110 GB.',
					],
					example: {
						says: 'A year of storage.',
						data: {
							orders: '50,000 a day × 2 KB = 100 MB a day',
							'a year of orders': '100 MB × 365 ≈ 37 GB',
							photos: '2,000 a day × 500 KB = 1 GB a day, 365 GB a year',
							'kept three times': 'about 110 GB of orders, 1.1 TB of photos',
						},
					},
				},
				{
					title: 'Bandwidth',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					body: [
						'Bandwidth is how much data a network can carry each second, so the question is how much the shop needs. Each product page shows four photos of about 120 KB, plus the page itself: call it 500 KB in all. At the peak, 700 pages a second is 350 MB a second. Networks count bits, so times 8: 2.8 gigabits a second.',
						'That’s why photos come from a CDN, near the shoppers. The shop’s own servers then send only the pages, about 20 KB each: 14 MB a second.',
					],
					example: {
						says: 'Bandwidth at the peak.',
						data: {
							'each page': '4 photos × 120 KB, plus the page ≈ 500 KB',
							'700 pages a second': '700 × 500 KB = 350 MB a second',
							'in bits': '350 MB × 8 = 2.8 gigabits a second',
							'without the photos': '700 × 20 KB = 14 MB a second',
						},
					},
				},
				{
					title: 'How many servers',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...peak, copies: { server: 10 } },
					facts: ['rate', { busy: 'server' }, { copies: 'server' }],
					copies: true,
					body: [
						'One web server answers about 100 a second, and should run at about 70% busy, so count on 70 each. The peak of 700 a second needs 700 ÷ 70 = 10 servers.',
						'Here they are: 700 a second, and each copy 70% busy. The database is left out of this sum: 700 reads a second is more than the shop’s database can answer, so they’d come from a cache or read copies, as the scaling lessons show. Here, the database is made ten times bigger to stand in for them.',
					],
					note: {
						title: 'Real machines do more',
						text: 'The shop’s parts are kept small, so the sums stay easy. A real web server often answers hundreds or thousands of simple requests a second, and a database thousands of simple reads. A load test tells you yours, and the sum works the same way.',
					},
				},
				{
					title: 'Plus spares',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...peak, copies: { server: 12 } },
					facts: ['succeed', { busy: 'server' }, { copies: 'server' }],
					copies: true,
					body: [
						'Then add spares, for a copy that breaks or one taken out for an update: say two more, 12 in all. Now each is 58% busy, and losing one still leaves the other 11 at about 64%.',
						'So: servers needed = the peak ÷ what one handles at about 70% busy, plus a spare or two. The same sum sizes databases, caches and workers.',
					],
				},
				{
					title: 'Napkin rules',
					show: ['app', 'server'],
					journey: 'look',
					set: { ...peak, copies: { server: 12 } },
					body: [
						'For the shop: about 700 pages a second at the peak, 12 web servers, under 40 GB of orders a year, and 2.8 gigabits a second of pages and photos, mostly sent by a CDN. Small enough for one main database, big enough to need a cache, a CDN and a few web servers.',
					],
					compare: {
						title: 'Napkin rules',
						rows: [
							[
								'Requests a second',
								'Things a day ÷ 86,400. A million a day is about 12 a second.',
							],
							['The peak', 'Two or three times the average, and a sale far more.'],
							['Storage', 'Items a day × size × 365 × the copies kept.'],
							['Bandwidth', 'Requests a second × size. Times 8 for bits.'],
							[
								'Servers',
								'The peak ÷ what one handles at about 70% busy, plus a spare or two.',
							],
							[
								'Then check',
								'Does it fit on one machine, or need hundreds? That decides the design.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely at the peak, 700 pages a second. Change how many copies of the web server run, and see how busy each gets.',
				journey: 'look',
				set: { ...peak, copies: { server: 12 } },
			},
		},
	],
};

export const performanceTrack: TrackModule = {
	track: performance,
	journeys: [
		{
			id: 'fd-phone',
			name: 'Look at a product, from a phone',
			description:
				'Someone opens a product on mobile data, down a connection that’s already open. The request crosses the network, and the server reads the product from the database.',
			rps: 50,
			hops: [
				{
					from: 'app',
					to: 'server',
					label: 'GET /products/77, across the network',
					travelMs: 150,
				},
				{ from: 'server', to: 'db', label: 'Read the product' },
			],
		},
		{
			id: 'fd-fanout',
			name: 'Look at a product, asking four parts',
			description:
				'Someone opens a product. The server reads it from the database, then asks three services, one after another: for similar products, for when it could arrive, and for stock nearby.',
			rps: 50,
			hops: [
				{ from: 'app', to: 'server', label: 'Ask for the product page' },
				{ from: 'server', to: 'db', label: 'Read the product' },
				{ from: 'server', to: 'recs', label: 'Find similar products' },
				{ from: 'server', to: 'delivery', label: 'When could it arrive?' },
				{ from: 'server', to: 'stock-svc', label: 'Stock at the nearest warehouse' },
			],
		},
		{
			id: 'fd-fanout-together',
			name: 'Look at a product, asking three parts at once',
			description:
				'Someone opens a product. The server reads it from the database, then asks the three services at the same time, and waits for the slowest.',
			rps: 50,
			hops: [
				{ from: 'app', to: 'server', label: 'Ask for the product page' },
				{ from: 'server', to: 'db', label: 'Read the product' },
				{
					from: 'server',
					to: 'recs',
					label: 'Find similar products',
					together: 'services',
				},
				{
					from: 'server',
					to: 'delivery',
					label: 'When could it arrive?',
					together: 'services',
				},
				{
					from: 'server',
					to: 'stock-svc',
					label: 'Stock at the nearest warehouse',
					together: 'services',
				},
			],
		},
	],
};
