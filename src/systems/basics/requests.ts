import type { Track } from '@/learn/course';
import type { Conditions } from '@/sim/scenario';
import { type TrackModule, look } from './shared';

// a first visit over TCP and TLS, a first visit over HTTP/3, and the requests after them, side by side:
// most requests reuse a connection, so the three add up to an ordinary 50 a second
const travels: Conditions = { only: ['fd-first', 'fd-h3', 'fd-again'] };
const exporting: Conditions = { only: ['fd-export'] };
const checking: Conditions = { only: ['fd-export', 'fd-export-check'] };
const told: Conditions = { only: ['fd-export-told'] };
const shaky: Conditions = { only: ['fd-look-retry'], flaky: { db: 0.1 } };

const requests: Track = {
	id: 'requests',
	name: 'How requests work',
	tagline:
		'What happens between tapping a button and seeing the answer: requests, round trips, status codes, waiting, and what to do when nothing comes back.',
	lessons: [
		{
			id: 'a-request',
			title: 'A request and its answer',
			summary:
				'You tap, a request goes out, and an answer comes back. What each one says, and why the app waits.',
			steps: [
				{
					title: 'You tap a product',
					show: ['app', 'server'],
					journey: 'look',
					current: [['app', 'server']],
					set: look,
					body: [
						'You open the shop app and tap the Blue kettle. Your phone doesn’t have the kettle’s page: it lives on the shop’s computers. So the **Shop app** sends a message to the **Web server**, asking for it.',
						'That message is a request, and what comes back is the answer, also called the response. The side that asks is the client, and the side that answers is the server.',
						'The arrow is the path a request takes, and each moving dot is one request.',
					],
					example: {
						says: 'Please send me the Blue kettle’s page.',
						data: {
							from: 'the Shop app, on your phone',
							to: 'the Web server, at shop.example.com',
						},
					},
				},
				{
					title: 'What a request says',
					show: ['app', 'server'],
					journey: 'look',
					current: [['app', 'server']],
					set: look,
					body: [
						'Every request says the same few things. First, what to do, in one word called the method: GET to read something, POST to create something, like an order. Then which thing, as an address called the path: /products/77 is the Blue kettle.',
						'Then some details, called headers: which app is asking, which language you read, and who you are, once you’ve signed in. Some requests also carry a body: when you place an order, the order itself travels inside the request.',
						'This shared format is HTTP, the language of the web. The next lesson looks at it closely.',
					],
					example: {
						says: 'Two requests, side by side.',
						data: {
							'opening the kettle': 'GET /products/77, no body',
							'placing an order': 'POST /orders, with the order in the body',
							'both carry headers': 'Host: shop.example.com, Accept-Language: en-IN',
						},
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
						'So the server sends a request of its own, and waits for the answer. Now the server is the client: client and server are roles in one exchange, not kinds of computer. One tap can start several requests behind the scenes.',
					],
					example: {
						says: 'What are the price and stock of the Blue kettle?',
						data: { answer: '₹1,499, 12 left' },
					},
				},
				{
					title: 'What an answer says',
					show: ['app', 'server', 'db'],
					journey: 'look',
					current: [['app', 'server']],
					set: look,
					body: [
						'The database answers the server, and the server answers your phone. Every answer starts with a status code, a number that says how it went: 200 means it worked, here it is. 404 means there’s no such thing. 500 means something broke on the server.',
						'Then come headers of its own, like what kind of content it is, and then the body: here, the kettle’s details, usually written as JSON, which the app turns into the page you see.',
						'Every request gets an answer: what you asked for, or an error. Even silence ends in one: after a while, the side that asked gives up and counts it as an error, as a later lesson shows.',
					],
					example: {
						says: 'The answer to GET /products/77.',
						data: {
							status: '200 OK',
							'Content-Type': 'application/json',
							answer: '{ "name": "Blue kettle", "price": 1499, "left": 12 }',
						},
					},
				},
				{
					title: 'The app waits',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					facts: ['wait'],
					timeline: true,
					body: [
						'From your tap until the page appears, the app waits, usually showing a spinner. Each request waits for its own answer, so their times add up: the server’s work, plus the database’s. That total is the wait you feel.',
						'Here it’s 43 ms, too quick to notice. But that’s only the work inside the shop. A real request also spends time crossing the internet, often far more. The next lesson adds that in.',
					],
				},
				{
					title: 'Many people at once',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: look,
					facts: ['rate', { busy: 'server' }],
					body: [
						'You aren’t the only one shopping. Right now, about 50 people a second are opening products: 3,000 a minute. Every dot is somebody’s request.',
						'Each request stands alone. It carries everything the server needs to answer it, like who you are, so the server needn’t remember anything between one request and the next.',
						'The server answers them very fast, and it’s about half busy. What happens as it gets fuller is what the performance lessons are about.',
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
			id: 'request-travels',
			title: 'How a request travels',
			summary:
				'Finding the address, opening a connection, agreeing on encryption, then the request itself: the round trips a first visit costs, the status codes that come back, and how reusing a connection saves most of it.',
			steps: [
				{
					title: 'First, find the address: DNS',
					show: ['app', 'fd-dns'],
					journey: 'fd-first',
					current: [['app', 'fd-dns']],
					set: travels,
					body: [
						'The app knows the shop by its name, shop.example.com. But computers on the internet find each other by number, an IP address like 203.0.113.10. So the first time, the **Shop app** asks a **DNS resolver** to look the name up. It’s usually run by the mobile network, or it’s a public one, like Google’s 8.8.8.8 or Cloudflare’s 1.1.1.1.',
						'If it doesn’t know the name, it asks around: a root server points it to the servers for .com, which point it to example.com’s own name servers, which have the answer. Each is another trip, so it keeps every answer it gets. For a popular name, it usually already knows.',
						'Every answer comes with a TTL, its time to live: how many seconds it may be kept. The phone keeps it too, so the next lookup costs nothing. A short TTL lets the shop move to a new address quickly; a long one saves lookups. Here, a lookup takes 50 ms.',
					],
					example: {
						says: 'Where is shop.example.com?',
						data: {
							'the phone asks': 'its DNS resolver',
							'if the resolver doesn’t know, it asks':
								'a root server, then the .com servers, then example.com’s name servers',
							answer: '203.0.113.10, and keep it for 300 seconds',
						},
					},
				},
				{
					title: 'Open a connection: TCP',
					show: ['app', 'fd-dns', 'server'],
					journey: 'fd-first',
					current: [['app', 'server']],
					set: travels,
					body: [
						'Now the app opens a connection to the **Web server**. Most web traffic travels over TCP, which numbers every piece of data, has the other side confirm what arrived, and sends again whatever got lost. So everything arrives whole and in order, over a network that sometimes drops pieces.',
						'Opening a TCP connection takes a handshake of three messages. The app can send its next message along with the third, so the handshake costs one round trip: there and back.',
						'Here, on mobile data, a round trip to the shop takes 150 ms. On good Wi-Fi near the data centre it’s much less, and on a weak signal far more.',
					],
					example: {
						says: 'Opening a connection: three messages.',
						data: {
							'the phone': 'SYN: shall we talk?',
							'the server': 'SYN-ACK: yes. Shall we?',
							'the phone again': 'ACK: yes.',
						},
					},
				},
				{
					title: 'Agree on encryption: TLS',
					show: ['app', 'fd-dns', 'server'],
					journey: 'fd-first',
					current: [['app', 'server']],
					set: travels,
					body: [
						'Next they agree on how to encrypt everything, so nobody on the way can read or change it. That’s TLS, the S in HTTPS. The server also shows its certificate, to prove it really is shop.example.com.',
						'With TLS 1.3, the current version, that takes one more round trip: another 150 ms. The older TLS 1.2 took two.',
					],
					example: {
						says: 'Agreeing on encryption, with TLS 1.3.',
						data: {
							'the phone':
								'Hello. Here’s the encryption I know, and my half of a key.',
							'the server':
								'Hello. We’ll use this one. Here’s my half of the key, and my certificate.',
							'after one round trip':
								'both sides hold the same secret key, and the request goes out encrypted',
						},
					},
				},
				{
					title: 'The request itself',
					show: ['app', 'fd-dns', 'server', 'db'],
					journey: 'fd-first',
					current: [['app', 'server']],
					set: travels,
					body: [
						'Only now does the request go out, in HTTP. It starts with the method, what to do: GET reads, POST creates, PUT replaces, PATCH changes part of something, and DELETE removes it. Then the path, which thing: /products/77.',
						'Then the headers, a list of details: which site, what kind of answer the app can read, which language, and who you are once you’ve signed in. Last comes the body, anything being sent. A GET has none; placing an order is a POST with the order in its body.',
						'The request costs one more round trip, plus the time the **Web server** and the **Database** take to answer it.',
					],
					example: {
						says: 'GET /products/77',
						data: {
							Host: 'shop.example.com',
							Accept: 'application/json',
							'Accept-Language': 'en-IN',
							'User-Agent': 'ShopApp/4.2 (Android)',
							body: 'none: a GET only asks',
						},
					},
				},
				{
					title: 'The answer',
					show: ['app', 'fd-dns', 'server', 'db'],
					journey: 'fd-first',
					current: [['app', 'server']],
					set: travels,
					body: [
						'The answer has the same shape. First a status code, a number that says how it went. Then headers: what kind of content this is, and how long it may be kept. Then the body: the kettle’s details, as JSON.',
						'The first digit tells the app what kind of answer it is, even for a number it’s never seen: 2 means it worked, 3 look elsewhere, 4 the request was wrong, and 5 the server failed. Codes starting with 1 exist too, but apps rarely see them.',
					],
					example: {
						says: 'The answer to GET /products/77.',
						data: {
							status: '200 OK',
							'Content-Type': 'application/json',
							'Cache-Control': 'max-age=60: you may keep it for a minute',
							answer: '{ "name": "Blue kettle", "price": 1499, "left": 12 }',
						},
					},
				},
				{
					title: 'Status codes you’ll meet',
					show: ['app', 'fd-dns', 'server', 'db'],
					journey: 'fd-first',
					current: [['app', 'server']],
					set: travels,
					body: [
						'A handful of codes cover nearly everything. Getting them right matters, because apps, load balancers and caches decide what to do next from the number alone. Trying again won’t fix a 404, for example, but it might fix a 503.',
					],
					compare: {
						title: 'Status codes you’ll meet',
						rows: [
							[
								'2xx: it worked',
								'200 OK: here’s the answer. 201 Created: the order is saved, and here’s its address. 204 No Content: done, with nothing to send back.',
							],
							[
								'3xx: look elsewhere',
								'301 Moved Permanently and 302 Found send the app to another address, for good or for now. 304 Not Modified: the copy you kept is still right, so nothing is sent again.',
							],
							[
								'4xx: the request was wrong',
								'400 Bad Request: it makes no sense. 401 Unauthorized: who are you? Sign in first. 403 Forbidden: I know who you are, and you can’t. 404 Not Found: no such thing.',
							],
							[
								'More 4xx: 409 and 429',
								'409 Conflict: it clashes with how things are, like paying for an order that’s already paid. 429 Too Many Requests: you’re asking too often, so slow down.',
							],
							[
								'5xx: the server’s side failed',
								'500 Internal Server Error: a bug or a crash. 502 Bad Gateway: the part in front got a broken answer from the one behind. 503 Service Unavailable: overloaded or down, so try later. 504 Gateway Timeout: the part behind didn’t answer in time.',
							],
						],
					},
				},
				{
					title: 'Adding it up: the first visit',
					show: ['app', 'fd-dns', 'server', 'db'],
					journey: 'fd-first',
					set: travels,
					facts: ['wait'],
					timeline: true,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Add it all up: the lookup, the connection, the encryption and the request itself. That’s four trips across the network before the kettle’s page arrives, about 540 ms in all.',
						'Only about 40 ms of it is the shop’s own work, as in the first lesson. The other 500 ms is travel. That’s why fast servers can still feel slow on a phone, and why big sites put servers near their users, as the CDN lesson shows.',
					],
				},
				{
					title: 'The next request: keep the connection',
					show: ['app', 'server', 'db'],
					journey: 'fd-again',
					set: travels,
					facts: ['wait', { wait: 'fd-first', label: 'First visit' }],
					timeline: true,
					body: [
						'The app doesn’t close the connection after one answer. It keeps it open, and sends the next request down the same one: no lookup, no handshake, no new encryption. Just one round trip and the work, about 190 ms instead of about 540.',
						'That’s keep-alive, and HTTP/1.1 does it by default. But in practice HTTP/1.1 carries one request at a time on each connection, so a browser opens up to six connections to a site, to fetch a page, its photos and its scripts side by side.',
						'HTTP/2 sends many requests at once on one connection, each kept apart from the others: that’s called multiplexing. Servers reuse connections too: they keep a pool of open connections to the database and to each other, so they don’t pay for new handshakes on every request.',
					],
				},
				{
					title: 'HTTP/3: one round trip fewer',
					show: ['app', 'fd-dns', 'server', 'db'],
					journey: 'fd-h3',
					set: travels,
					facts: ['wait', { wait: 'fd-first', label: 'Over TCP and TLS' }],
					timeline: true,
					body: [
						'HTTP/3 runs over QUIC instead of TCP. QUIC sets up the connection and the encryption in the same round trip, so a new connection needs one round trip fewer: about 390 ms here, not 540.',
						'It also suits shaky mobile networks. Over TCP, one lost piece holds up everything behind it on that connection, called head-of-line blocking; over QUIC, it holds up only its own request. And a QUIC connection can survive the phone moving from Wi-Fi to mobile data, which an ordinary TCP connection can’t.',
						'QUIC is built on UDP, a plain way to send pieces of data with no handshake and no resending, and does the careful part itself. Most browsers support HTTP/3, though a browser often learns that a site offers it only from an earlier answer over TCP, and saves the round trip from its next connection. An app built for it can use it from the start.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'fd-dns', 'server', 'db'],
					journey: 'fd-first',
					set: travels,
					body: [
						'You rarely pick a version by hand: the app and the server agree on the newest one both know. What you do choose is to reuse connections everywhere, and to offer the newer versions at the front door.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'HTTP/1.1',
								'One request at a time on each connection. Still everywhere, and the simplest to read and debug.',
							],
							[
								'HTTP/2',
								'Many requests at once on one connection. The usual choice for websites and apps, and what gRPC runs on.',
							],
							[
								'HTTP/3',
								'One round trip fewer to connect, and better on shaky mobile networks. Offered by big sites and CDNs.',
							],
							[
								'TLS 1.3',
								'One round trip to agree on encryption, where TLS 1.2 takes two. Turn it on wherever you can.',
							],
							[
								'Keep-alive and connection pools',
								'Always. Reusing a connection skips the lookup and the handshakes, from phones and between servers.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with first visits and later requests side by side. Push the traffic up: the time on the network stays the same, while the server’s part grows.',
				journey: 'fd-first',
				set: travels,
			},
		},
		{
			id: 'waiting',
			title: 'Waiting, or doing it later',
			summary:
				'Some work must happen before you get an answer. Some can wait: sent to the background, or accepted now and finished later.',
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
						'In this design, everything is synchronous: the server does each step in turn, and your phone waits for all of it. The email alone takes most of a second, so the order feels slow.',
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
						'You don’t need to wait for the email. So now the server saves the order, leaves a note in a **Queue**, and answers you straight away. An **Email worker** picks up the note a moment later and sends the email.',
						'This is asynchronous, or background, work. The dashed arrows are calls nobody waits for, and the order now feels instant.',
					],
					example: {
						says: 'The answer, before the email is sent.',
						data: {
							status: '201 Created',
							Location: '/orders/5521',
							answer: 'Order 5521 is placed. A receipt is on its way.',
						},
					},
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
						'The cost is that the work isn’t done when you get your answer. If it fails later, nobody is watching, so the worker has to try again by itself, and someone has to notice if it never works. The message queue lesson shows how.',
					],
				},
				{
					title: 'A big job: accepted, not done',
					show: ['app', 'server', 'db', 'queue', 'fd-exporter', 'files'],
					journey: 'fd-export',
					set: exporting,
					facts: ['wait'],
					tags: [{ text: 'Background: nobody waits', tone: 'background' }],
					body: [
						'Riya asks for a file of every order she’s ever placed. Building it means reading years of orders and writing them all into one file. That can take far longer than anyone should wait, and longer than the timeout on a request.',
						'So the server saves a job, leaves it in the **Queue**, and answers at once with 202 Accepted: “I’ve got it. It isn’t done yet. Here’s where to look.” An **Export worker** builds the file in the background, and saves it in **File storage**.',
						'This time the main work itself happens later, not just an extra like the email. 201 Created would mean the thing exists now; 202 Accepted only says the job was taken on, to be done later.',
					],
					example: {
						says: 'POST /exports, and the answer.',
						data: {
							status: '202 Accepted',
							Location: '/exports/31',
							answer: '{ "job": 31, "status": "queued" }',
						},
					},
				},
				{
					title: 'How does she find out? Check back',
					show: ['app', 'server', 'db', 'queue', 'fd-exporter', 'files'],
					journey: 'fd-export-check',
					draw: ['fd-export'],
					set: checking,
					facts: [{ load: 'server' }],
					body: [
						'The simplest way: the app keeps asking “is it ready yet?” That’s polling. Say an export takes about 20 seconds, and the app asks every 2: that’s 10 checks for each export, and 9 of them answer “not yet”.',
						'Here, 1 export a second brings 10 checks a second. So the server gets 11 requests a second, and 10 of them only ask.',
						'Polling is easy to build and works everywhere. But it’s wasteful when jobs are slow or many people are waiting, and the news arrives up to one check late.',
					],
					example: {
						says: 'GET /exports/31, every 2 seconds.',
						data: {
							'the first check': '{ "status": "running" }',
							'2 seconds later': '{ "status": "running" }',
							'about 20 seconds in':
								'{ "status": "ready", "file": "/files/riya-orders.csv" }',
						},
					},
				},
				{
					title: 'Or be told',
					show: ['app', 'server', 'db', 'queue', 'fd-exporter', 'files', 'fd-push'],
					journey: 'fd-export-told',
					set: told,
					facts: [{ load: 'server' }],
					body: [
						'Instead, the worker says when it’s done. It asks a **Push service** to send a notification to Riya’s phone, through Apple’s or Google’s push systems, and it arrives even when the app is closed.',
						'No request is wasted: the server gets 1 a second for exports, not 11. When the one waiting is another company’s server, the same idea is a webhook; when the app is open, the server can push down a connection the app keeps open. The real-time lesson compares them.',
						'Being told costs more to build, and a message can go missing. So many apps do both: wait to be told, and check now and then just in case.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'server', 'db', 'queue', 'fd-exporter', 'files', 'fd-push'],
					journey: 'fd-export-told',
					set: told,
					body: [
						'A good rule: do now only what the answer depends on. Everything else can usually wait, and is safer in the background, where a slow or broken part doesn’t hold anyone up.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Now, while they wait',
								'What the answer depends on: saving the order, checking the kettle is in stock. Simple, and the user knows at once if it failed.',
							],
							[
								'Later, in the background',
								'What the user doesn’t need to see yet: receipt emails, smaller sizes of photos, sales reports. Faster answers, and an outage there doesn’t stop shopping.',
							],
							[
								'Accept now, finish later (202)',
								'Big jobs the user asked for, like an export or a video to process: answer at once, and say where to look.',
							],
							[
								'Check back (polling)',
								'Simple, and works anywhere. Wasteful when jobs are slow or many are waiting.',
							],
							[
								'Be told (push, webhook)',
								'No wasted requests, and the news arrives at once. More to build, and a message can go missing.',
							],
						],
					},
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
			summary:
				'Timeouts, the errors people see, saying no quickly, and a first look at trying again.',
			steps: [
				{
					title: 'The database is down',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], down: ['db'] },
					facts: ['succeed', 'wait'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'If the **Database** stops working, the **Web server** can’t build any page. It sends its request, and waits for an answer that never comes.',
						'A part can fail loudly or quietly. Loudly is easy: the connection is refused at once, and the caller knows straight away. Quietly is hard: a crashed machine, a cut cable, or a part too overloaded to reply all look the same from outside. Nothing comes back, and the caller can’t tell slow from dead.',
					],
				},
				{
					title: 'Waiting has a limit: timeouts',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], down: ['db'] },
					facts: ['succeed', 'wait', 'rate'],
					body: [
						'So the server doesn’t wait forever. After 2 seconds, it gives up and answers your phone with an error. That limit is a timeout.',
						'Without one, stuck requests pile up. Here, 50 arrive a second and each is stuck for 2 seconds, so about 100 are waiting at any moment, each holding memory and a connection. With no limit at all, they’d pile up until the server couldn’t answer anyone, even for pages that don’t need the database.',
						'So every call gets a timeout, a little above its slowest normal answers. Many tools wait forever unless told otherwise: Python’s popular requests library, for one.',
					],
					note: {
						title: 'Timeouts inside timeouts',
						text: 'The app waits for the server, which waits for the database. Give the inner call the shorter timeout, so the server gives up first, and still has time to send the app a proper error.',
					},
				},
				{
					title: 'What the user sees',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], down: ['db'] },
					facts: ['succeed'],
					body: [
						'When the server gives up, it should still answer, with the right status code. A 5 at the front means the server’s side failed, not the request, so trying again later might work.',
						'503 Service Unavailable says “I can’t help right now”: overloaded, or something it needs is down. It can add Retry-After, saying when to come back. With a load balancer in front, two more appear: 504 Gateway Timeout when the server behind it didn’t answer in time, and 502 Bad Gateway when it refused the connection or answered with nonsense.',
						'The app turns that into words a person understands, like “We can’t show this right now. Try again in a moment.” It keeps whatever they typed, and never shows a raw error.',
					],
					example: {
						says: 'The server gives up on the database, and tells the app.',
						data: {
							status: '503 Service Unavailable',
							'Retry-After': '30',
							answer: '{ "error": "We can’t show this product right now." }',
						},
					},
				},
				{
					title: 'Saying no quickly',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], down: ['db'], circuitBreakers: true },
					facts: ['succeed', 'wait'],
					body: [
						'The server could notice that the database keeps failing, and stop calling it for a while. Then it says no straight away, instead of making everyone wait 2 seconds first. Now and then it lets one call through, to see if the database is back.',
						'That’s a circuit breaker, named after the switch at home that cuts the power when something’s wrong, and it’s the amber arrow. It doesn’t fix the database, but it stops one broken part from slowing everything down.',
						'Failing fast is kinder to people, too: an error in a blink beats an error after 2 seconds of spinner. And it frees the server for the requests it can still answer.',
					],
				},
				{
					title: 'A shaky connection',
					show: ['app', 'server', 'db'],
					journey: 'fd-look-retry',
					set: { ...shaky, retries: false },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Not every failure is an outage. Here, the database is fine, but 1 call in 10 fails at random: a dropped connection, a copy restarting, a busy moment.',
						'So 1 page in 10 fails, though asking again a moment later would almost certainly work.',
					],
				},
				{
					title: 'Try again',
					show: ['app', 'server', 'db'],
					journey: 'fd-look-retry',
					set: shaky,
					facts: ['succeed', { retries: 'db' }],
					body: [
						'So the server tries again, up to twice. A page now fails only if all three tries fail: 1 in 10, three times over, is 1 in 1,000. The cost is a few extra calls to the database: 5.5 a second, on top of the 50.',
						'Retries need care. Only repeat what’s safe to repeat: reading a product, yes; charging a card, only if the payment provider can tell it’s the same request. Wait a little longer before each try. And don’t retry into a part that’s overloaded, which only adds to its load. The reliability lessons cover all three.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'server', 'db'],
					journey: 'look',
					set: { only: ['look'], down: ['db'], circuitBreakers: true },
					body: [
						'They work together. The timeout decides when to give up, a retry or two covers brief failures, the circuit breaker covers long ones, and the error tells the person what happened.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Timeout',
								'On every call, always. A little above the slowest normal answers, and shorter on the inside than on the outside.',
							],
							[
								'A clear error',
								'Whenever you give up: the right status code, words a person understands, and nothing they typed lost.',
							],
							[
								'Retry',
								'Brief, random failures, on requests that are safe to repeat. A few tries, waiting longer each time.',
							],
							[
								'Circuit breaker',
								'A part that keeps failing: stop calling it for a while, and answer at once.',
							],
							[
								'Fail fast',
								'Whenever you already know it won’t work: say so at once, rather than make anyone wait for a timeout.',
							],
						],
					},
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

export const requestsTrack: TrackModule = {
	track: requests,
	parts: [
		{
			id: 'fd-dns',
			name: 'DNS resolver',
			kind: 'external',
			layer: 'external',
			summary:
				'Turns a name like shop.example.com into the address of a computer. Usually run by the mobile network, or a public one like Google’s 8.8.8.8 or Cloudflare’s 1.1.1.1.',
			why: 'Apps know the shop by its name, but connections are made to numbered addresses.',
			onFailure:
				'New visitors can’t find the shop. Phones that already have the address, kept from an earlier lookup, carry on until it expires.',
			scaling:
				'It belongs to someone else, and answers huge numbers of lookups, most of them from its cache.',
			capacityPerInstance: 100_000,
			instances: 1,
			latencyMs: 1,
		},
		{
			id: 'fd-exporter',
			name: 'Export worker',
			kind: 'worker',
			layer: 'async',
			summary:
				'Takes export jobs from the queue, reads every order the shopper has placed, and saves them as one file.',
			why: 'Building a big file takes far longer than anyone should wait for an answer, so it happens here, after the answer.',
			onFailure: 'Exports wait in the queue until it’s back. Shopping carries on.',
			scaling: 'Add more workers when exports wait too long.',
			capacityPerInstance: 5,
			instances: 1,
			maxInstances: 5,
			latencyMs: 1000,
		},
		{
			id: 'fd-push',
			name: 'Push service',
			kind: 'notifier',
			layer: 'async',
			summary:
				'Sends notifications to phones, through Apple’s and Google’s push systems. They arrive even when the app is closed.',
			why: 'So the app can be told when a long job is done, instead of asking again and again.',
			onFailure: 'Notifications don’t arrive. Shoppers have to open the app and look.',
			scaling:
				'It’s usually a service run by another company, like Google’s Firebase Cloud Messaging, and grows by itself.',
			capacityPerInstance: 5_000,
			instances: 1,
			latencyMs: 50,
		},
	],
	journeys: [
		{
			id: 'fd-first',
			name: 'Open the shop for the first time',
			description:
				'A phone on mobile data opens the shop for the first time: it looks up the address, opens a connection, agrees on encryption, then sends the request. Each is a round trip.',
			rps: 5,
			hops: [
				{ from: 'app', to: 'fd-dns', label: 'Look up shop.example.com', travelMs: 49 },
				// the handshakes are only the network: a round trip each, and no work for the server
				{
					from: 'app',
					to: 'server',
					label: 'Open a connection (TCP)',
					travelMs: 150,
					work: 0,
				},
				{
					from: 'app',
					to: 'server',
					label: 'Agree on encryption (TLS)',
					travelMs: 150,
					work: 0,
				},
				{ from: 'app', to: 'server', label: 'GET /products/77', travelMs: 150 },
				{ from: 'server', to: 'db', label: 'Read the product' },
			],
		},
		{
			id: 'fd-h3',
			name: 'Open the shop for the first time, over HTTP/3',
			description:
				'The same first visit over HTTP/3: QUIC opens the connection and agrees on encryption in one round trip.',
			rps: 5,
			hops: [
				{ from: 'app', to: 'fd-dns', label: 'Look up shop.example.com', travelMs: 49 },
				{
					from: 'app',
					to: 'server',
					label: 'Connect and encrypt at once (QUIC)',
					travelMs: 150,
					work: 0,
				},
				{ from: 'app', to: 'server', label: 'GET /products/77', travelMs: 150 },
				{ from: 'server', to: 'db', label: 'Read the product' },
			],
		},
		{
			id: 'fd-again',
			name: 'The next request, on an open connection',
			description:
				'The app asks for the next product down the connection it already has open: no lookup, no handshakes, one round trip.',
			rps: 40,
			hops: [
				{ from: 'app', to: 'server', label: 'GET /products/78', travelMs: 150 },
				{ from: 'server', to: 'db', label: 'Read the product' },
			],
		},
		{
			id: 'fd-export',
			name: 'Export my orders',
			description:
				'A shopper asks for a file of all her orders. The server saves a job and answers 202 Accepted at once; a worker builds the file in the background.',
			rps: 1,
			hops: [
				{ from: 'app', to: 'server', label: 'POST /exports: all my orders' },
				{ from: 'server', to: 'db', label: 'Save job 31: queued' },
				{
					from: 'server',
					to: 'queue',
					label: 'Job 31: export Riya’s orders',
					mode: 'async',
				},
				{ from: 'queue', to: 'fd-exporter', label: 'Hand out the job', mode: 'async' },
				{
					from: 'fd-exporter',
					to: 'db',
					label: 'Read all her orders',
					mode: 'async',
					work: 5,
				},
				{ from: 'fd-exporter', to: 'files', label: 'Save the file', mode: 'async' },
				{ from: 'fd-exporter', to: 'db', label: 'Mark job 31 ready', mode: 'async' },
			],
		},
		{
			id: 'fd-export-check',
			name: 'Is my export ready yet?',
			description:
				'While an export is being built, the app asks every 2 seconds whether it’s ready. Ten checks for each export.',
			rps: 10,
			hops: [
				{ from: 'app', to: 'server', label: 'GET /exports/31: ready yet?' },
				{ from: 'server', to: 'db', label: 'Read job 31’s status' },
			],
		},
		{
			id: 'fd-export-told',
			name: 'Export my orders, and be told',
			description:
				'The same export, but when the file is ready the worker has a notification sent to the shopper’s phone, so the app never needs to ask.',
			rps: 1,
			hops: [
				{ from: 'app', to: 'server', label: 'POST /exports: all my orders' },
				{ from: 'server', to: 'db', label: 'Save job 31: queued' },
				{
					from: 'server',
					to: 'queue',
					label: 'Job 31: export Riya’s orders',
					mode: 'async',
				},
				{ from: 'queue', to: 'fd-exporter', label: 'Hand out the job', mode: 'async' },
				{
					from: 'fd-exporter',
					to: 'db',
					label: 'Read all her orders',
					mode: 'async',
					work: 5,
				},
				{ from: 'fd-exporter', to: 'files', label: 'Save the file', mode: 'async' },
				{ from: 'fd-exporter', to: 'db', label: 'Mark job 31 ready', mode: 'async' },
				{
					from: 'fd-exporter',
					to: 'fd-push',
					label: 'Tell Riya it’s ready',
					mode: 'async',
				},
				{ from: 'fd-push', to: 'app', label: 'Your export is ready', mode: 'async' },
			],
		},
		{
			id: 'fd-look-retry',
			name: 'Look at a product, trying again',
			description:
				'Someone opens a product. When the call to the database fails, the server tries again, up to twice.',
			rps: 50,
			hops: [
				{ from: 'app', to: 'server', label: 'Ask for the product page' },
				{ from: 'server', to: 'db', label: 'Read the product', retries: 2 },
			],
		},
	],
};
