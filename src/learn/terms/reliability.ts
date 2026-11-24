import type { Term } from '../glossary';

/** Words the reliability lessons explain. */
export const reliabilityTerms: Term[] = [
	{
		id: 'redundancy',
		term: 'Redundancy',
		meaning:
			'Having more than one of everything that matters, so another can take over when one breaks.',
		like: 'Carrying a spare tyre.',
		forms: ['redundancy', 'redundant'],
	},
	{
		id: 'nines',
		term: 'Nines',
		meaning:
			'How availability, the share of the time something works, is usually said: 99.9% is three nines, 99.99% is four. Each extra nine is ten times less time down.',
		forms: ['nines', 'three nines', 'four nines', 'five nines'],
	},
	{
		id: 'active-active',
		term: 'Active-active',
		meaning:
			'Every copy serves at the same time, sharing the work. When one breaks, the others carry on with more each.',
		like: 'Several tills open in a shop: if one closes, the queues move to the others.',
		forms: ['active-active'],
	},
	{
		id: 'active-passive',
		term: 'Active-passive',
		meaning:
			'One copy does the work while another stands by, kept up to date, ready to take over if the first breaks.',
		like: 'A reserve goalkeeper on the bench.',
		forms: ['active-passive'],
	},
	{
		id: 'n-plus-one',
		term: 'N+1',
		meaning:
			'Running one more than you need, so that losing any one still leaves enough to carry the load.',
		forms: ['n+1'],
	},
	{
		id: 'chaos-engineering',
		term: 'Chaos engineering',
		meaning:
			'Breaking things on purpose, like switching off servers at random, to check that the system really survives it. Netflix’s Chaos Monkey is the best-known tool.',
		like: 'A fire drill.',
		forms: ['chaos engineering', 'chaos monkey'],
	},
	{
		id: 'game-day',
		term: 'Game day',
		meaning:
			'A planned time when a team breaks parts of its own system on purpose, to practise noticing and fixing it.',
		forms: ['game day', 'game days'],
	},
	{
		id: 'disaster-recovery',
		term: 'Disaster recovery',
		meaning:
			'Planning for the worst, like losing a whole region or the data itself, and getting the app working again afterwards.',
		forms: ['disaster recovery'],
	},
	{
		id: 'rto',
		term: 'RTO',
		meaning:
			'Recovery time objective: the longest an app may be down after a disaster before it must work again.',
		forms: ['rto'],
	},
	{
		id: 'rpo',
		term: 'RPO',
		meaning:
			'Recovery point objective: how much of the newest data may be lost in a disaster, counted in time, like the last 15 minutes of orders.',
		forms: ['rpo'],
	},
	{
		id: 'three-two-one',
		term: '3-2-1 rule',
		meaning:
			'A rule for backups: 3 copies of the data, on 2 different kinds of storage, with 1 of them somewhere else.',
		forms: ['3-2-1 rule'],
	},
	{
		id: 'pilot-light',
		term: 'Pilot light',
		meaning:
			'Being ready for a region going down by keeping only a copy of the database running in a second region. The servers there are started when needed.',
		like: 'The small flame that stays lit in a gas boiler, ready to light the rest.',
		forms: ['pilot light'],
	},
	{
		id: 'warm-standby',
		term: 'Warm standby',
		meaning:
			'A small but complete copy of an app, kept running in a second region, that’s grown to full size when the first region goes down.',
		forms: ['warm standby'],
	},
	{
		id: 'multi-site',
		term: 'Multi-site active-active',
		meaning:
			'The whole app running in two or more regions at once, each serving users, so losing one region loses almost nothing.',
		forms: ['multi-site active-active', 'multi-site'],
	},
	{
		id: 'deadline',
		term: 'Deadline',
		meaning:
			'The moment a whole request must be finished by. It’s passed from part to part, and each gives its next call only the time that’s left.',
		forms: ['deadline', 'deadlines'],
	},
	{
		id: 'transient',
		term: 'Transient failure',
		meaning:
			'A failure that goes away by itself, like a dropped connection or a busy moment. Trying again usually works.',
		like: 'A call that drops in a tunnel, and goes through when you ring back.',
		forms: ['transient'],
	},
	{
		id: 'idempotency-key',
		term: 'Idempotency key',
		meaning:
			'An id made once for one action, like a payment, and sent with every try. The other side remembers it, so a retry with the same key isn’t done twice.',
		like: 'A ticket number at a counter: show it again, and you’re told it’s already been served.',
		forms: ['idempotency key', 'idempotency keys'],
	},
	{
		id: 'exponential-backoff',
		term: 'Exponential backoff',
		meaning:
			'Waiting before each retry, and doubling the wait every time: 100 ms, 200, 400, 800, up to a limit.',
		forms: ['exponential backoff'],
	},
	{
		id: 'retry-budget',
		term: 'Retry budget',
		meaning:
			'A cap on retries, like at most 10% more calls than the first tries. Retries stop when failures are common, so they can’t swamp a part that’s struggling.',
		forms: ['retry budget', 'retry budgets'],
	},
	{
		id: 'half-open',
		term: 'Half-open',
		meaning:
			'The state a circuit breaker goes into after a wait: it lets a few test calls through, and closes again if they work.',
		forms: ['half-open'],
	},
	{
		id: 'bulkhead',
		term: 'Bulkhead',
		meaning:
			'A cap on how much of a server one kind of work, or one part it calls, may use, so one slow part can’t take everything.',
		like: 'The watertight walls inside a ship, so one hole floods only one compartment.',
		forms: ['bulkhead', 'bulkheads'],
	},
	{
		id: 'too-many-requests',
		term: '429 Too Many Requests',
		meaning:
			'The answer to a request turned away by a rate limit. It often says, in a Retry-After header, when to come back.',
		forms: ['429'],
	},
	{
		id: 'quota',
		term: 'Quota',
		meaning:
			'How much a customer may use in total over a day or a month, like 10,000 calls a day, often set by what they pay for.',
		like: 'A phone plan’s monthly data allowance.',
		forms: ['quota', 'quotas'],
	},
	{
		id: 'fixed-window',
		term: 'Fixed window',
		meaning:
			'A rate limiter that counts each user’s requests in each minute, or second, and starts again from zero when it ends.',
		forms: ['fixed window', 'fixed windows'],
	},
	{
		id: 'sliding-window-log',
		term: 'Sliding window log',
		meaning:
			'A rate limiter that keeps the time of every request, and counts those in the last minute. Exact, but it stores a lot.',
		forms: ['sliding window log'],
	},
	{
		id: 'sliding-window-counter',
		term: 'Sliding window counter',
		meaning:
			'A rate limiter that keeps this minute’s count and last minute’s, and estimates the last 60 seconds from the two.',
		forms: ['sliding window counter'],
	},
	{
		id: 'token-bucket',
		term: 'Token bucket',
		meaning:
			'A rate limiter where each request takes a token from a bucket that refills at a steady rate. A full bucket allows a short burst.',
		like: 'A jar of tickets topped up by one every few seconds: take one per ride.',
		forms: ['token bucket', 'token buckets'],
	},
	{
		id: 'leaky-bucket',
		term: 'Leaky bucket',
		meaning:
			'A rate limiter that queues requests and lets them out at a steady rate, turning away new ones when the queue is full.',
		like: 'A bucket with a small hole: pour as fast as you like, it drips out at the same pace.',
		forms: ['leaky bucket', 'leaky buckets'],
	},
	{
		id: 'atomic-increment',
		term: 'Atomic increment',
		meaning:
			'Adding one to a count and reading the result in a single step, so two callers at the same moment can never both read the same number.',
		forms: ['atomic increment'],
	},
	{
		id: 'lua-script',
		term: 'Lua script',
		meaning:
			'A short program sent to Redis to run inside it, all in one step, with nothing else happening in between.',
		forms: ['lua script'],
	},
	{
		id: 'observability',
		term: 'Observability',
		meaning:
			'How well you can tell what’s happening inside a running system, and why, from what it records: metrics, logs and traces.',
		forms: ['observability'],
	},
	{
		id: 'red-method',
		term: 'RED method',
		meaning:
			'Three numbers to watch for every service: the rate of requests, how many end in errors, and their duration.',
		forms: ['red method'],
	},
	{
		id: 'golden-signals',
		term: 'Four golden signals',
		meaning:
			'Google’s four numbers to watch for any service: latency, traffic, errors and saturation.',
		forms: ['four golden signals', 'golden signals'],
	},
	{
		id: 'saturation',
		term: 'Saturation',
		meaning:
			'How much work is waiting for something that’s already busy, like reads queued for a disk.',
		like: 'The queue at a till, rather than how busy the cashier is.',
		forms: ['saturation'],
	},
	{
		id: 'histogram',
		term: 'Histogram',
		meaning:
			'Counts of how many requests took how long, in buckets like under 25 ms and under 50 ms. Percentiles are read off from them.',
		forms: ['histogram', 'histograms'],
	},
	{
		id: 'trace-id',
		term: 'Trace id',
		meaning:
			'An id given to a request when it arrives and passed along with every call it causes, so the pieces of its trace can be put together.',
		forms: ['trace id', 'trace ids', 'traceparent'],
	},
	{
		id: 'opentelemetry',
		term: 'OpenTelemetry',
		meaning:
			'A free, open-source set of tools for recording metrics, logs and traces, and passing trace ids along, in most programming languages.',
		forms: ['opentelemetry'],
	},
	{
		id: 'sampling',
		term: 'Sampling',
		meaning:
			'Keeping only some of the traces or log lines, like 1 in 100, to save money, plus the ones that matter most, like errors.',
		forms: ['sampling', 'sampled'],
	},
	{
		id: 'structured-logs',
		term: 'Structured logs',
		meaning:
			'Log lines written as named fields, often JSON, rather than sentences, so they can be searched by any field.',
		forms: ['structured logs', 'structured logging'],
	},
	{
		id: 'dashboard',
		term: 'Dashboard',
		meaning:
			'A screen of graphs and numbers, side by side, showing how something is doing right now.',
		like: 'A car’s dashboard: speed, fuel and warning lights at a glance.',
		forms: ['dashboard', 'dashboards'],
	},
	{
		id: 'sli',
		term: 'SLI',
		meaning:
			'Service level indicator: a measurement of how well the app is doing for its users, like the share of pages that loaded in under 300 ms.',
		forms: ['sli', 'slis'],
	},
	{
		id: 'sla',
		term: 'SLA',
		meaning:
			'Service level agreement: a promise about how well a service works, written in a contract, with money back if it’s missed.',
		forms: ['sla', 'slas'],
	},
	{
		id: 'burn-rate',
		term: 'Burn rate',
		meaning:
			'How fast the error budget is being used, compared with using it evenly over the month. At a burn rate of 1, it lasts exactly the month.',
		forms: ['burn rate', 'burn rates', 'burn-rate'],
	},
	{
		id: 'alert',
		term: 'Alert',
		meaning:
			'A message sent to a person, by phone or chat, when a measurement crosses a line set in advance.',
		forms: ['alert', 'alerts'],
	},
	{
		id: 'alert-fatigue',
		term: 'Alert fatigue',
		meaning:
			'When alerts fire so often, for nothing, that people stop paying attention, and miss the one that matters.',
		like: 'The boy who cried wolf.',
		forms: ['alert fatigue'],
	},
	{
		id: 'runbook',
		term: 'Runbook',
		meaning:
			'Written steps for handling a known problem: what an alert means, and what to check first.',
		forms: ['runbook', 'runbooks'],
	},
	{
		id: 'on-call',
		term: 'On call',
		meaning:
			'Being the person who answers when something goes wrong, at any hour, for a set time, often a week.',
		forms: ['on call', 'on-call'],
	},
	{
		id: 'incident',
		term: 'Incident',
		meaning:
			'Something going wrong that users notice, or soon will, and that people are working to fix now.',
		forms: ['incident', 'incidents'],
	},
	{
		id: 'postmortem',
		term: 'Postmortem',
		meaning:
			'A write-up after an incident: what happened, its effect on users, why, and what will change so it can’t happen the same way again.',
		forms: ['postmortem', 'postmortems'],
	},
	{
		id: 'blameless',
		term: 'Blameless',
		meaning:
			'Looking at how the system let a mistake happen, not at who made it, so people say what really happened and everyone learns.',
		forms: ['blameless'],
	},
	{
		id: 'sre',
		term: 'SRE',
		meaning:
			'Site reliability engineering: Google’s name for running services with software engineers, and the books it published about how.',
		forms: ['sre'],
	},
	{
		id: 'sdk',
		term: 'SDK',
		meaning:
			'Software development kit: a library a company gives you for calling its service from your own code.',
		forms: ['sdk', 'sdks'],
	},
];
