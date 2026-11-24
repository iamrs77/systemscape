import type { Term } from '../glossary';

/** Words the foundations lessons explain. */
export const foundationsTerms: Term[] = [
	{
		id: 'round-trip',
		term: 'Round trip',
		meaning:
			'A message going from one computer to another, and the answer coming back. Each one crosses the network twice.',
		like: 'Posting a letter, and waiting for the reply.',
		forms: ['round trip', 'round trips'],
	},
	{
		id: 'ip-address',
		term: 'IP address',
		meaning:
			'The number that finds a computer on the internet, like 203.0.113.10. A name like shop.example.com is turned into one before anything is sent.',
		like: 'A phone number, where the name is the contact you saved it under.',
		forms: ['ip address', 'ip addresses'],
	},
	{
		id: 'dns-resolver',
		term: 'DNS resolver',
		meaning:
			'The server a phone asks to turn a name into an IP address. It asks other name servers when it doesn’t know, and keeps the answers it gets.',
		like: 'Directory enquiries: it looks the number up for you, and remembers the popular ones.',
		forms: ['dns resolver', 'dns resolvers'],
	},
	{
		id: 'ttl',
		term: 'TTL (time to live)',
		meaning:
			'How many seconds a saved answer may be kept before it has to be fetched again, like a DNS answer kept for 300 seconds.',
		like: 'A best-before date.',
		forms: ['ttl', 'ttls', 'time to live'],
	},
	{
		id: 'tcp',
		term: 'TCP',
		meaning:
			'The way most internet traffic is carried. It numbers every piece of data, has the other side confirm what arrived, and sends again whatever got lost, so everything arrives whole and in order.',
		like: 'Registered post: every parcel is signed for, and lost ones are sent again.',
		forms: ['tcp'],
	},
	{
		id: 'udp',
		term: 'UDP',
		meaning:
			'A plain way to send pieces of data across the internet, with no handshake and no resending. Quick, but anything lost stays lost, unless something built on top of it notices.',
		like: 'Dropping postcards in a postbox: quick, but nobody tells you if one goes missing.',
		forms: ['udp'],
	},
	{
		id: 'handshake',
		term: 'Handshake',
		meaning:
			'The messages two computers swap before they can talk properly: to open a connection, or to agree on encryption. Each one costs at least one round trip.',
		forms: ['handshake', 'handshakes'],
	},
	{
		id: 'http',
		term: 'HTTP',
		meaning:
			'The shared format of web requests and answers. A request has a method, a path, headers and sometimes a body; an answer has a status code, headers and a body.',
		forms: ['http', 'http/1.1'],
	},
	{
		id: 'http-2',
		term: 'HTTP/2',
		meaning:
			'A newer version of HTTP that sends many requests at once down one connection, instead of one at a time.',
		forms: ['http/2'],
	},
	{
		id: 'multiplexing',
		term: 'Multiplexing',
		meaning:
			'Sending many requests and answers down one connection at the same time, each kept apart from the others, instead of one after another. HTTP/2 and HTTP/3 do it.',
		like: 'Several phone calls sharing one line, without hearing each other.',
		forms: ['multiplexing'],
	},
	{
		id: 'head-of-line-blocking',
		term: 'Head-of-line blocking',
		meaning:
			'One slow or lost piece of data holding up everything queued behind it. Over TCP, one lost piece stalls every request on that connection until it’s sent again.',
		like: 'One slow car at a single-lane bridge holding up every car behind it.',
		forms: ['head-of-line blocking'],
	},
	{
		id: 'http-3',
		term: 'HTTP/3',
		meaning:
			'The newest version of HTTP. It runs over QUIC, so connecting takes one round trip fewer, and a lost piece of data holds up only its own request.',
		forms: ['http/3'],
	},
	{
		id: 'quic',
		term: 'QUIC',
		meaning:
			'A way of carrying web traffic, built on UDP and first made at Google. It opens a connection and agrees on encryption in one round trip. HTTP/3 runs on it.',
		forms: ['quic'],
	},
	{
		id: 'keep-alive',
		term: 'Keep-alive',
		meaning:
			'Keeping a connection open after an answer, so the next request can use it without new handshakes.',
		like: 'Staying on the phone for a second question, instead of hanging up and dialling again.',
		forms: ['keep-alive'],
	},
	{
		id: 'connection-pool',
		term: 'Connection pool',
		meaning:
			'A set of connections a server keeps open, to a database or another service, and lends to each request in turn, so none has to open its own.',
		like: 'A taxi rank: the cars wait ready, instead of each being called from home.',
		forms: [
			'connection pool',
			'connection pools',
			'pool of connections',
			'pool of open connections',
		],
	},
	{
		id: 'status-code',
		term: 'Status code',
		meaning:
			'The number at the start of every answer that says how it went: 2xx it worked, 3xx look elsewhere, 4xx the request was wrong, 5xx the server failed.',
		forms: ['status code', 'status codes'],
	},
	{
		id: 'header',
		term: 'Header',
		meaning:
			'A named detail sent with a request or an answer, like which site it’s for, which language to use, or how long the answer may be kept.',
		like: 'What’s written on the outside of an envelope, rather than the letter inside.',
		forms: ['header', 'headers'],
	},
	{
		id: 'service-unavailable',
		term: '503 Service Unavailable',
		meaning:
			'The status code for “I can’t help right now”: the server is overloaded, or something it needs is down. Trying again later may work.',
		forms: ['service unavailable'],
	},
	{
		id: 'bad-gateway',
		term: '502 Bad Gateway',
		meaning:
			'The status code a load balancer or gateway sends when the server behind it refused the connection, or sent back something broken.',
		forms: ['bad gateway'],
	},
	{
		id: 'gateway-timeout',
		term: '504 Gateway Timeout',
		meaning:
			'The status code a load balancer or gateway sends when the server behind it didn’t answer in time.',
		forms: ['gateway timeout'],
	},
	{
		id: 'retry-after',
		term: 'Retry-After',
		meaning:
			'A header on an answer like 503 or 429 that says how long to wait before trying again: a number of seconds, or a date and time.',
		forms: ['retry-after'],
	},
	{
		id: 'fail-fast',
		term: 'Failing fast',
		meaning:
			'Saying no at once when a request can’t work, instead of letting it wait for a timeout. The caller can move on, and nothing is tied up waiting.',
		forms: ['fail fast', 'fails fast', 'failing fast'],
	},
	{
		id: 'thread',
		term: 'Thread',
		meaning:
			'One line of work inside a program. A server often gives each request in progress a thread of its own, and it only has so many.',
		forms: ['thread', 'threads'],
	},
	{
		id: 'percentile',
		term: 'Percentile (p50, p99)',
		meaning:
			'A point in a list of times, sorted from quickest to slowest. p50 is the middle one: half are quicker. p99 is the time 99 requests in 100 come in under.',
		like: 'Lining 100 people up by height: p50 is the height of the 50th, and p99 of the 99th.',
		forms: ['percentile', 'percentiles', '50th percentile', 'p50', 'p95', 'p99', 'p99.9'],
	},
	{
		id: 'tail-latency',
		term: 'Tail latency',
		meaning:
			'The waits at the slow end, p99 and beyond. Rare for any one request, but common for a page that asks many parts, or a person who opens many pages.',
		forms: ['tail latency', 'the tail', 'the tail at scale'],
	},
	{
		id: 'hedged-request',
		term: 'Hedged request',
		meaning:
			'Sending the same request to a second copy when the first is slower than usual, and using whichever answers first. It trims the slowest waits for a few extra requests.',
		forms: ['hedged request', 'hedged requests'],
	},
	{
		id: 'latency-budget',
		term: 'Latency budget',
		meaning:
			'A target for a whole request’s wait, shared out so each part knows how long it may take.',
		like: 'A household budget: the total is fixed, and each thing gets its share.',
		forms: ['latency budget', 'latency budgets'],
	},
	{
		id: 'littles-law',
		term: 'Little’s law',
		meaning:
			'Requests in progress = how many arrive each second × how long each takes. 50 a second, each taking 2 seconds, means about 100 in progress at once.',
		like: '10 people walking into a shop each minute and staying 6 minutes means about 60 inside.',
		forms: ['little’s law'],
	},
	{
		id: 'load-test',
		term: 'Load test',
		meaning:
			'Sending a part more and more requests on purpose, to find how much it can take before the wait or the errors get too high.',
		forms: ['load test', 'load tests', 'load testing'],
	},
	{
		id: 'utilisation',
		term: 'Utilisation',
		meaning:
			'How busy a part is: its load divided by its capacity. 50 requests a second to a part that can do 100 is 50%.',
		forms: ['utilisation', 'utilization'],
	},
	{
		id: 'use-method',
		term: 'USE method',
		meaning:
			'A checklist for finding a bottleneck: for every part, look at its utilisation, its saturation (work waiting in line), and its errors.',
		forms: ['use method'],
	},
	{
		id: 'headroom',
		term: 'Headroom',
		meaning:
			'Room kept spare, so a part can take a rush, a broken copy or an update without going past full.',
		like: 'Leaving early for the station, in case the roads are slow.',
		forms: ['headroom'],
	},
	{
		id: 'peak',
		term: 'Peak',
		meaning:
			'The busiest time, like an evening rush or a sale. Designs are sized for the peak, not the average.',
		forms: ['peak', 'peaks'],
	},
	{
		id: 'daily-active-users',
		term: 'Daily active users',
		meaning:
			'How many different people use an app on a given day. The usual starting point for estimating its traffic.',
		forms: ['daily active users', 'dau'],
	},
	{
		id: 'napkin-math',
		term: 'Napkin math',
		meaning:
			'Quick, rough sums to find how big a problem is, kept to a digit or two: the right power of ten matters, not the exact number. Also called a back-of-the-envelope estimate.',
		forms: ['napkin math', 'back of an envelope', 'back-of-the-envelope'],
	},
	{
		id: 'bandwidth',
		term: 'Bandwidth',
		meaning:
			'How much data a network link carries each second, counted in bits: 1 gigabit a second is about 125 MB a second.',
		forms: ['bandwidth'],
	},
	{
		id: 'nanosecond',
		term: 'Nanosecond',
		meaning:
			'A billionth of a second, or a millionth of a millisecond. Reading from memory takes about 100.',
		forms: ['nanosecond', 'nanoseconds'],
	},
	{
		id: 'ssd',
		term: 'SSD',
		meaning:
			'A solid-state drive: a disk made of memory chips, with no moving parts. Far quicker than a spinning disk, but slower than memory.',
		forms: ['ssd', 'ssds'],
	},
	{
		id: 'spinning-disk',
		term: 'Spinning disk',
		meaning:
			'An older kind of disk, with platters that spin and an arm that has to move to the right place before reading: a seek, of about 10 ms. Cheap for storing a lot.',
		like: 'A record player, where the needle has to be moved to the song.',
		forms: ['spinning disk', 'spinning disks'],
	},
	{
		id: 'byte',
		term: 'Byte (KB, MB, GB)',
		meaning:
			'The unit stored data is counted in: one byte holds one English letter. A kilobyte (KB) is about a thousand bytes, and MB, GB, TB and PB are each a thousand times the one before.',
		forms: [
			'byte',
			'bytes',
			'kilobyte',
			'kilobytes',
			'megabyte',
			'megabytes',
			'gigabyte',
			'gigabytes',
			'terabyte',
			'terabytes',
			'petabyte',
			'petabytes',
			'kb',
			'mb',
			'gb',
			'tb',
			'pb',
		],
	},
	{
		id: 'bit',
		term: 'Bit',
		meaning:
			'The smallest piece of data, a 0 or a 1. A byte is 8 bits, and networks count their speed in bits a second: megabits and gigabits.',
		forms: ['bits', 'megabit', 'megabits', 'gigabit', 'gigabits'],
	},
];
