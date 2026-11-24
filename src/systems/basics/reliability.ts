import type { Track } from '@/learn/course';
import type { Conditions } from '@/sim/scenario';
import { type TrackModule, roomy, copies } from './shared';

// redundancy
const oneOfEach: Conditions = { only: ['look-lb'], bigger: roomy };
// each part down 1% of the time: a page needs all three
const inARow: Conditions = { ...oneOfEach, flaky: { lb: 0.01, server: 0.01, db: 0.01 } };
const zones: Conditions = { only: ['rl-look-zones'], traffic: 3, bigger: roomy };
const zoneDown: Conditions = { ...zones, down: ['rl-zone-a'] };
const lopsidedDown: Conditions = { ...zoneDown, copies: { 'rl-zone-b': 1 } };
const zoneShow = ['app', 'lb', 'rl-zone-a', 'rl-zone-b', 'db'];

// disaster recovery: the shop in Mumbai, and what's ready in Hyderabad
const mumbai: Conditions = { only: ['rl-shop-mumbai'], traffic: 3 };
const mumbaiShow = ['app', 'rl-global', 'rl-web-mumbai', 'rl-db-mumbai'];
const pilot: Conditions = { only: ['rl-shop-pilot'], traffic: 3 };
const standby = (servers: number): Conditions => ({
	only: ['rl-shop-hyd'],
	traffic: 3,
	copies: { 'rl-web-hyd': servers },
});
const both: Conditions = {
	only: ['rl-shop-both'],
	traffic: 3,
	copies: { 'rl-web-mumbai': 2, 'rl-web-hyd': 2 },
};
const bothShow = ['app', 'rl-global', 'rl-web-mumbai', 'rl-web-hyd', 'rl-db-mumbai', 'rl-db-hyd'];

// timeouts and retries
const paying: Conditions = { only: ['pay-card'], copies: { server: 3 } };
const shaky: Conditions = { ...paying, flaky: { payments: 0.05 } };
const sale: Conditions = { ...paying, traffic: 2.4 };
const payShow = ['app', 'lb', 'server', 'payments'];
const threeCopies: Conditions = { only: ['look-pick'], traffic: 3, bigger: roomy };

// failing gracefully
const suggesting: Conditions = { only: ['look-recs'], copies: { server: 3 } };
const suggestingIfAble: Conditions = {
	only: ['look-recs-opt'],
	copies: { server: 3 },
	down: ['recs'],
};
const recsShow = ['app', 'lb', 'server', 'db', 'recs'];
// a busy evening with Recommendations slow, and each copy of the server's threads counted
const slowAndBusy: Conditions = {
	only: ['look-recs-opt'],
	copies: { server: 3 },
	traffic: 4,
	bigger: { db: 10, recs: 4 },
	slow: { recs: 50 },
	threads: { server: 50 },
};
const rush: Conditions = {
	only: ['look-lb', 'rl-checkout'],
	traffic: 4,
	copies: { server: 2 },
	bigger: roomy,
};
const shedding: Conditions = { ...rush, only: ['rl-look-shed', 'rl-checkout'] };

// rate limiting
const flooded: Conditions = {
	only: ['look-gw', 'scrape'],
	copies: { server: 3 },
	bigger: roomy,
};
const limited: Conditions = { ...flooded, only: ['look-gw', 'scrape-limited'] };
const counted: Conditions = {
	only: ['rl-look-counted', 'rl-scrape-counted'],
	copies: { server: 3, gateway: 3 },
	bigger: roomy,
};
const gwShow = ['app', 'bot', 'lb', 'gateway', 'server', 'db'];

// observability
const watching: Conditions = { only: ['look-lb'], copies: { server: 3 } };
const slowEvening: Conditions = { ...watching, traffic: 2.9 };
const watchShow = ['app', 'lb', 'server', 'db'];

const reliability: Track = {
	id: 'reliability',
	name: 'Reliability',
	tagline:
		'Spares, backups, timeouts and retries, failing gracefully, rate limits, and seeing what’s going on: keeping the shop up when things go wrong.',
	lessons: [
		{
			id: 'redundancy',
			title: 'Redundancy and failover',
			summary:
				'Availability in nines, why a chain of parts loses them and spares win them back, zones, and a standby that takes over.',
			steps: [
				{
					title: 'One of each',
					show: watchShow,
					journey: 'look-lb',
					set: oneOfEach,
					facts: ['succeed'],
					body: [
						'Here, the shop runs one **Load balancer**, one **Web server** and one **Database**. It works. But each of them is a single point of failure: if any one breaks, nobody can shop.',
						'And parts do break. Disks wear out, power fails, an update goes wrong, someone unplugs the wrong cable. Reliability is about keeping the shop working when they do.',
					],
				},
				{
					title: 'The server breaks',
					show: watchShow,
					journey: 'look-lb',
					set: { ...oneOfEach, down: ['server'] },
					facts: ['succeed', 'wait'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A disk fails, and the **Web server** stops. With nothing to take over, every page fails, after waiting 2 seconds for an answer that never comes.',
						'The fix is redundancy: more than one of everything that matters, so another can take over. This lesson is about how many, where to put them, and how the switch happens.',
					],
				},
				{
					title: 'Counting in nines',
					show: watchShow,
					journey: 'look-lb',
					set: oneOfEach,
					body: [
						'How reliable something is, is measured as its availability: the share of the time it works. It’s usually said in nines: 99.9% is “three nines”, and 99.99% is “four nines”.',
						'Each nine sounds small, but it’s ten times less time down. A year has 8,760 hours, so 99.9% allows about 8.8 hours of downtime a year, and 99.99% only about 53 minutes. Five nines is about 5 minutes a year: less time than it takes someone to notice a problem and start fixing it.',
					],
					example: {
						says: 'The downtime each target allows.',
						data: {
							'99%': '3.7 days a year, or 7.2 hours a month',
							'99.9%': '8.8 hours a year, or 43 minutes a month',
							'99.99%': '53 minutes a year, or 4.3 minutes a month',
							'99.999%': '5.3 minutes a year, or 26 seconds a month',
						},
					},
					note: {
						title: 'Planned downtime counts too',
						text: 'An hour switched off for an update is an hour down, as far as shoppers can tell. That’s why big apps update one copy at a time, rather than all at once.',
					},
				},
				{
					title: 'In a chain, nines are lost',
					show: watchShow,
					journey: 'look-lb',
					set: inARow,
					facts: [
						{
							label: 'Each part works',
							value: '99%',
							hint: 'down about 3.7 days a year',
						},
						'succeed',
					],
					body: [
						'A page needs all three parts, one after another: the load balancer, the web server and the database. Say each is down 1% of the time, at different moments. A page works only when all three are up.',
						'So their availabilities multiply: 99% × 99% × 99% is about 97%. Three parts that are each down 3.7 days a year make a shop that’s down about 11 days a year.',
						'Every part a request needs adds its own downtime. The longer the chain, the more nines each part needs.',
					],
					example: {
						says: 'Three parts at 99.9% each.',
						data: {
							'all three up': '99.9% × 99.9% × 99.9% = 99.7%',
							'down a year': 'about 26 hours: three times one part’s 8.8',
						},
					},
				},
				{
					title: 'Side by side, nines are won',
					show: ['app', 'lb', ...copies],
					journey: 'look-pick',
					set: { ...threeCopies, down: ['web-2'] },
					facts: [
						'succeed',
						{ busyEach: copies },
						{
							label: 'All three down at once',
							value: '1 in a million',
							hint: 'if each is down 1% of the time',
						},
					],
					body: [
						'Spares work the other way. With three copies of the web server behind the load balancer, a page fails only if all three are down at the same moment.',
						'If each is down 1% of the time, all three are down together only 1% × 1% × 1% of the time: one moment in a million, or 99.9999%. Here, **Web server 2** is down, and the load balancer’s health checks send its share to the other two.',
						'So a chain of parts loses nines, and spares side by side win them back. That’s why every part a request needs should have a spare.',
					],
				},
				{
					title: 'Spares that break together',
					show: zoneShow,
					journey: 'rl-look-zones',
					set: zones,
					facts: ['succeed', { busy: 'rl-zone-a' }, { busy: 'rl-zone-b' }],
					copies: true,
					body: [
						'That arithmetic only works if the copies break separately. Copies in one rack, a cabinet of servers, share its power and its network switch, and copies in one building share its cooling. When one of those fails, all the copies fail together, and the nines are gone.',
						'So clouds split each region into zones: separate data centres, or groups of them, kilometres apart, each with its own power, cooling and network, joined by fast private links. Here, 150 requests a second are shared between two **Web servers, zone A** and two **Web servers, zone B**.',
					],
				},
				{
					title: 'A zone goes down',
					show: zoneShow,
					journey: 'rl-look-zones',
					set: zoneDown,
					facts: ['succeed', { busy: 'rl-zone-a' }, { busy: 'rl-zone-b' }],
					copies: true,
					body: [
						'A storm cuts zone A’s power, and both its copies go at once. The load balancer’s health checks notice, and send everything to zone B. Its two copies are now 75% busy, but every page still works.',
						'So each zone needs room to carry the whole load without the other. Spread over three zones, each needs room for only half: losing one leaves two to share it. That’s one reason many apps run in three zones.',
					],
					note: {
						title: 'Everything in two zones',
						text: 'The load balancer and the database need to be in more than one zone too. A cloud load balancer, like AWS’s, already is. The database is harder: that’s the step after next.',
					},
				},
				{
					title: 'Not enough spares',
					show: zoneShow,
					journey: 'rl-look-zones',
					set: lopsidedDown,
					facts: ['succeed', { busy: 'rl-zone-b' }, { copies: 'rl-zone-b' }],
					copies: true,
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Now run three copies instead: two in zone A, one in zone B. On a normal day, that’s plenty. Then zone A goes down, and one copy is left for 150 requests a second. It can answer 100, so a third of the shoppers get errors.',
						'Spares only help if there are enough of them, in the right places. Having one more than you need, so that losing any one still leaves enough, is called N+1. Here, the one that can be lost is a whole zone.',
					],
				},
				{
					title: 'Failover: a standby takes over',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-promoted',
					set: {
						only: ['order-promoted'],
						traffic: 3,
						copies: { server: 3 },
						down: ['db'],
					},
					facts: ['succeed'],
					about: 'replica',
					body: [
						'Copies that all serve at once, like these web servers, are called active-active. A database leader can’t work that way: only one copy may take changes, or two could each sell the last kettle.',
						'So it keeps a standby: a follower in another zone, with every change copied to it. When the leader stops answering, the **Database copy** is promoted, and orders are saved there. That switch is failover, and the design is called active-passive. Orders sent during the switch fail, so apps try them again.',
						'The lesson on a leader breaking goes through it step by step: noticing, choosing a follower, and making sure the old leader stays out.',
					],
				},
				{
					title: 'Break things on purpose',
					show: zoneShow,
					journey: 'rl-look-zones',
					set: zones,
					copies: true,
					body: [
						'A spare that’s never been used may not work: its settings drifted, it’s too small for the load, or the switch was never tried. So teams switch parts off on purpose, at a calm moment with everyone watching, and check that the spares really take over.',
						'Netflix built a tool for it, Chaos Monkey, that switches off its servers at random during working hours, so every team has to build for it. Later tools took out a whole zone, or moved everyone out of a whole region. This is chaos engineering.',
						'Many teams also hold game days: a planned afternoon of breaking things, to practise finding and fixing them.',
					],
				},
				{
					title: 'Which one when',
					show: zoneShow,
					journey: 'rl-look-zones',
					set: zones,
					copies: true,
					body: [
						'Redundancy comes in layers: more copies, then more zones, then more regions. Each layer survives a bigger failure, and costs more.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Copies side by side, active-active',
								'Servers that keep nothing, load balancers, caches. Every copy works, and losing one only makes the rest busier.',
							],
							[
								'A standby that takes over, active-passive',
								'Anything only one copy may do at a time, like a database leader. The switch takes seconds to minutes, and the standby waits, unused.',
							],
							[
								'Copies in one zone',
								'Survives a broken machine, but not a broken building.',
							],
							[
								'Spread over zones',
								'Survives a zone going down. The usual choice: zones are close, so it adds very little delay.',
							],
							[
								'Spread over regions',
								'Survives a whole region going down. Far apart, so slower and harder. The next lesson.',
							],
							[
								'N+1',
								'However they’re spread, enough that losing any one still leaves enough.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with two copies in each zone. Take zone A down from its details, then take copies away from zone B, and find how few the shop can run on.',
				journey: 'rl-look-zones',
				set: zones,
			},
		},
		{
			id: 'disaster-recovery',
			title: 'Backups and disaster recovery',
			summary:
				'When a whole region goes, or the data itself is lost: RTO and RPO, backups that really restore, and four ways to be ready.',
			steps: [
				{
					title: 'A whole region goes down',
					show: mumbaiShow,
					journey: 'rl-shop-mumbai',
					set: { ...mumbai, down: ['rl-web-mumbai', 'rl-db-mumbai'] },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Zones protect against a broken building. But a region’s zones are all in one area, run by the same software and the same people, and now and then a whole region has a bad day.',
						'In 2017, one mistyped command took Amazon S3 down in its northern Virginia region for about four hours, and many well-known sites with it. Here, the shop runs only in Mumbai, and Mumbai is down: nobody can shop, however many zones it used.',
						'Planning for this, and for losing the data itself, is called disaster recovery.',
					],
				},
				{
					title: 'Two numbers to plan for: RTO and RPO',
					show: [...mumbaiShow, 'rl-backups'],
					journey: 'rl-shop-mumbai',
					set: mumbai,
					facts: [
						{ label: 'RTO', value: '4 hours', hint: 'down, until it works again' },
						{ label: 'RPO', value: '15 minutes', hint: 'of the newest orders lost' },
					],
					body: [
						'Every disaster plan starts with two numbers, agreed with the business, not just the engineers.',
						'RTO, the recovery time objective: how long the shop may be down before it works again. RPO, the recovery point objective: how much recent data may be lost, counted in time. An RPO of 15 minutes means the orders from the last 15 minutes before the disaster may be gone.',
						'Lower numbers cost more. Payments might need an RPO of zero, losing nothing at all, while product reviews could lose a day.',
					],
					example: {
						says: 'Mumbai fails at 14:00.',
						data: {
							'the newest copy kept elsewhere':
								'from 13:45, so 15 minutes of orders are lost',
							'the shop works again': 'at 18:00, so it was down 4 hours',
							'this plan has': 'an RPO of 15 minutes and an RTO of 4 hours',
						},
					},
				},
				{
					title: 'Backups, kept far away',
					show: [...mumbaiShow, 'rl-backups'],
					journey: 'rl-shop-mumbai',
					current: [['rl-db-mumbai', 'rl-backups']],
					set: mumbai,
					about: 'rl-backups',
					body: [
						'The last defence is a backup. The lesson on a leader breaking showed how a nightly copy, plus the database’s log of every change, can bring the data back as it was at any moment.',
						'For a disaster, what matters is where the backups live. Here, **Backups** are kept in another region, in storage like Amazon S3, ideally under a separate account, so whatever takes out Mumbai, or whoever breaks into it, can’t reach them too.',
						'How often the changes are sent there sets the RPO: every 15 minutes means up to 15 minutes of orders lost, as in the example before.',
					],
					note: {
						title: 'The 3-2-1 rule',
						text: 'Keep 3 copies of the data, on 2 different kinds of storage, with 1 of them in another place. Many teams also keep a copy that can’t be changed or deleted for a while, even by an admin, so an attacker can’t wipe it.',
					},
				},
				{
					title: 'A backup nobody has restored',
					show: [...mumbaiShow, 'rl-backups'],
					journey: 'rl-shop-mumbai',
					set: mumbai,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A backup only counts once it has been restored. In 2017, an engineer at GitLab deleted a database’s files by mistake, on the wrong server. Of the five ways the team had to back it up or copy it, none was working properly, and about six hours of data was lost.',
						'So teams restore their backups regularly, into a spare database, and check the data is all there. Timing it also tells you your real RTO: if a restore takes 5 hours, a 1-hour RTO is only a wish.',
						'The same goes for the whole plan. Practise moving to another region on a calm day, before you have to do it for real.',
					],
				},
				{
					title: 'Ready for a region: backup and restore',
					show: [...mumbaiShow, 'rl-backups'],
					journey: 'rl-shop-mumbai',
					current: [['rl-db-mumbai', 'rl-backups']],
					set: mumbai,
					facts: [
						{ label: 'RTO', value: 'hours' },
						{ label: 'RPO', value: 'minutes', hint: 'since the last archived change' },
						{ label: 'Extra cost', value: 'storage only' },
					],
					body: [
						'There are four common ways to be ready for a region going down, from cheapest to fastest. The first is backup and restore: run only in Mumbai, keep the backups in Hyderabad, and when Mumbai goes, build everything again in Hyderabad from them.',
						'It costs little: just the storage. But starting servers, restoring the database and checking it all takes hours, so the RTO is hours. The RPO is as old as the newest change archived there: minutes, if changes are sent every few minutes, or a whole day, with nightly backups alone.',
						'It’s right for things that can wait, like the shop’s internal reports, and as the last defence for everything else.',
					],
				},
				{
					title: 'Pilot light',
					show: [...mumbaiShow, 'rl-db-hyd'],
					journey: 'rl-shop-pilot',
					current: [['rl-db-mumbai', 'rl-db-hyd']],
					set: pilot,
					facts: [
						{ label: 'RTO', value: 'tens of minutes' },
						{ label: 'RPO', value: 'seconds', hint: 'changes still on their way' },
						{ label: 'Extra cost', value: 'one database' },
					],
					body: [
						'Next is a pilot light, named after the small flame that stays lit in a gas boiler. The **Database copy, Hyderabad** runs all the time, and every change is copied to it a moment after Mumbai makes it. Nothing else runs there: the servers are set up, but switched off.',
						'When Mumbai goes, the copy is promoted, the servers are started, and the global load balancer sends shoppers to Hyderabad. That takes tens of minutes. Only the changes still on their way are lost: seconds.',
					],
				},
				{
					title: 'Warm standby',
					show: ['app', 'rl-global', 'rl-web-hyd', 'rl-db-hyd'],
					journey: 'rl-shop-hyd',
					set: standby(1),
					facts: ['succeed', { busy: 'rl-web-hyd' }, { copies: 'rl-web-hyd' }],
					copies: true,
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A warm standby goes further: a small copy of the whole shop runs in Hyderabad all the time, a database copy and one web server, kept up to date and tested, but too small for everyone.',
						'When Mumbai goes, the **Global load balancer** sends every shopper to Hyderabad within a minute or two. One copy can answer 100 requests a second, not 150, so for a while a third of the shoppers get errors.',
					],
				},
				{
					title: 'The standby grows',
					show: ['app', 'rl-global', 'rl-web-hyd', 'rl-db-hyd'],
					journey: 'rl-shop-hyd',
					set: standby(2),
					facts: ['succeed', { busy: 'rl-web-hyd' }, { copies: 'rl-web-hyd' }],
					copies: true,
					body: [
						'Then it grows. Autoscaling, or a person, adds copies, and within minutes every page works again.',
						'So a warm standby has an RTO of minutes and an RPO of seconds, and costs a small second shop, running all the time.',
					],
				},
				{
					title: 'Multi-site, active-active',
					show: bothShow,
					journey: 'rl-shop-both',
					set: both,
					facts: ['succeed', { busy: 'rl-web-mumbai' }, { busy: 'rl-web-hyd' }],
					copies: true,
					body: [
						'The last way is multi-site active-active: the whole shop runs in both regions, and both serve shoppers all the time, each from its own database. Each copies its changes to the other.',
						'The hard part is two regions taking changes at once. If Riya changes her address in Mumbai while an order of hers is saved in Hyderabad, both must end up with both. Some shops give each shopper a home region, so only one region ever changes their data. Others use a database built to take writes in several regions, like DynamoDB global tables or Google Spanner. The lesson on many leaders covers the conflicts.',
					],
				},
				{
					title: 'Mumbai goes, and nobody notices',
					show: bothShow,
					journey: 'rl-shop-both',
					set: { ...both, down: ['rl-web-mumbai', 'rl-db-mumbai'] },
					facts: ['succeed', { busy: 'rl-web-hyd' }],
					copies: true,
					body: [
						'When Mumbai goes, the global load balancer stops sending shoppers there, and Hyderabad takes them all. It’s 75% busy, but every page works. The RTO is close to zero, and the RPO is only the changes still on their way.',
						'It’s the most expensive way: two whole shops, each with room for everyone. It’s worth it where every minute down costs a lot, like checkout and payments.',
					],
				},
				{
					title: 'Which one when',
					show: bothShow,
					journey: 'rl-shop-both',
					set: both,
					copies: true,
					body: [
						'These are the four strategies Amazon’s guide to disaster recovery names, and the same ideas work on any cloud. Many shops mix them: active-active for checkout, a pilot light for the rest, and backups for everything.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Backup and restore',
								'RTO hours, RPO minutes, or a day with nightly backups alone. The cheapest: storage only. For what can wait, and as the last defence for everything.',
							],
							[
								'Pilot light',
								'RTO tens of minutes, RPO seconds. A database copy runs in the second region; the servers start when needed.',
							],
							[
								'Warm standby',
								'RTO minutes, RPO seconds. A small working copy of everything, grown when needed.',
							],
							[
								'Multi-site active-active',
								'RTO and RPO near zero. Two whole shops serving at once. The most expensive, and writes in two places are hard.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the shop in both regions. Take Mumbai’s web servers down, then take a copy away from Hyderabad’s, and see how much room each region needs.',
				journey: 'rl-shop-both',
				set: both,
			},
		},
		{
			id: 'timeouts-retries',
			title: 'Timeouts and retries',
			summary:
				'How long to wait, deadlines passed along, which failures to try again, keys that make trying again safe, and asking twice to beat the slow ones.',
			steps: [
				{
					title: 'How long to wait',
					show: payShow,
					journey: 'pay-card',
					set: { ...paying, retries: false },
					facts: ['wait'],
					timeline: true,
					body: [
						'Paying sends a request to the **Payment provider**, which takes about 80 ms of the shopper’s wait. But sometimes no answer comes at all: the connection dropped, or the provider is stuck. How long should the **Web server** wait?',
						'It waits up to a set time, a timeout, then gives up. Too long, and the shopper stares at a spinner while waiting requests pile up on the server. Too short, and it gives up on answers that were on their way.',
						'So timeouts are set from measurements: a little above the slowest normal answers. If 99 answers in 100 come within 300 ms, a timeout of around half a second to a second is about right. And every call needs one: some libraries, like Python’s popular requests, wait for ever unless told otherwise.',
					],
				},
				{
					title: 'One deadline for the whole request',
					show: payShow,
					journey: 'pay-card',
					set: { ...paying, retries: false },
					body: [
						'Timeouts along a chain have to fit together. Say the app gives up after 3 seconds, but the server waits 5 seconds for the provider, and then tries again. The shopper has long gone, and the server is still waiting, for nobody.',
						'So the first part sets a deadline for the whole request, and passes it along. Each part works out how much time is left, and gives its next call no more than that. When time runs out, everyone stops. gRPC passes deadlines along like this; with plain HTTP, it goes in a header the team agrees on.',
					],
					example: {
						says: 'The app allows 3 seconds for paying.',
						data: {
							'the app sends': 'pay for order 5521, deadline 3 s from now',
							'the server, 20 ms later':
								'2.98 s left, so the provider gets at most that',
							'the first try times out at 1 s':
								'1.98 s left, enough for one more try',
							'no time left': 'everyone stops, and the app says “try again”',
						},
					},
				},
				{
					title: 'A shaky connection',
					show: payShow,
					journey: 'pay-card',
					set: { ...shaky, retries: false },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Now 1 call in 20 fails for no lasting reason: a dropped connection, a busy moment. Failures like these, which go away by themselves, are called transient.',
						'With no second try, 1 payment in 20 fails.',
					],
				},
				{
					title: 'Try again',
					show: payShow,
					journey: 'pay-card',
					set: shaky,
					facts: ['succeed', { retries: 'payments' }],
					body: [
						'Try again, up to twice, and a payment fails only if all three tries fail: 1 in 20 × 1 in 20 × 1 in 20, about 1 in 8,000.',
						'It costs little. Only the calls that fail are tried again: about 2.6 extra a second, on top of 50.',
					],
				},
				{
					title: 'Which failures to try again',
					show: payShow,
					journey: 'pay-card',
					set: shaky,
					body: [
						'Only retry a failure that might go away by itself. A timeout, a dropped connection, or an answer saying the other side is busy for now, like 503 Service Unavailable or 429 Too Many Requests, might work next time. If the answer says how long to wait, in a Retry-After header, wait that long.',
						'A request that was wrong will be just as wrong the second time: 400 Bad Request, 401 or 403, not allowed, 404 Not Found, or a card that was declined. Retrying those only adds load. Fail at once, and say why.',
					],
					example: {
						says: 'Answers, and what to do with them.',
						data: {
							'timeout, or the connection dropped': 'try again',
							'503 Service Unavailable': 'try again, after a wait',
							'429 Too Many Requests': 'try again, after the time it says',
							'400 Bad Request': 'don’t: the request needs fixing',
							'404 Not Found': 'don’t: it isn’t there',
							'card declined': 'don’t: tell the shopper',
						},
					},
				},
				{
					title: 'Charged twice?',
					show: payShow,
					journey: 'pay-card',
					set: paying,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'A timeout doesn’t say whether the work was done. The charge may have gone through, with only the answer lost on the way back. Try again, and the card is charged twice.',
						'Some requests are safe to repeat: reading an order, or setting the address to a new value. Doing them twice is the same as doing them once: they’re idempotent. In HTTP, GET, PUT and DELETE are meant to be.',
						'Others aren’t. “Charge ₹1,499” or “add one kettle to the cart” happen again each time. POST requests usually work like that.',
					],
				},
				{
					title: 'Idempotency keys',
					show: payShow,
					journey: 'pay-card',
					set: paying,
					body: [
						'So the server makes the charge safe to repeat. It makes an id for this payment once, an idempotency key, and sends the same key with every try.',
						'The provider keeps each key it has seen, with its answer. A retry with the same key gets the first answer back, and the card is charged once. Stripe’s API, for one, takes it in a header called Idempotency-Key.',
						'The key is made before the first try and kept for the retries. A new key on each try would defeat the point.',
					],
					example: {
						says: 'Charge ₹1,499, key pay-5521-7f3a.',
						data: {
							'first try': 'charged, but the answer was lost',
							'second try, same key': 'seen before: no new charge',
							answer: 'Charged ₹1,499 for order 5521 (the first answer, again)',
						},
					},
					note: {
						title: 'Your own services can do it too',
						text: 'Save each key in the database, in the same transaction as the work it did. If a key comes again, send back the saved answer instead of doing the work again.',
					},
				},
				{
					title: 'Ask twice, take the first',
					show: ['app', 'lb', ...copies],
					journey: 'look-pick',
					set: threeCopies,
					body: [
						'Most requests are quick, but a few are slow for reasons that have nothing to do with them: a copy pausing to clean up its memory, a busy disk, a noisy neighbour. As the latency lesson showed, a page that makes many calls often meets one of those slow few.',
						'For requests that are safe to repeat, like reading a product, there’s a trick. If no answer has come by the time 95 in 100 answers usually have, send the same request to another copy, and use whichever answers first. That’s a hedged request. Only about 1 request in 20 is ever sent twice.',
						'Google described a test where hedging after 10 ms cut the slowest 1 in 1,000 waits from 1,800 ms to 74 ms, for just 2% more requests. Never hedge a request that isn’t safe to repeat, like a payment without an idempotency key.',
					],
					example: {
						says: 'Reading the Blue kettle, hedged after 50 ms.',
						data: {
							'0 ms': 'ask Web server 1',
							'50 ms, no answer yet': 'ask Web server 2 as well',
							'58 ms': 'Web server 2 answers: use it, and cancel the other',
						},
					},
				},
				{
					title: 'Which one when',
					show: payShow,
					journey: 'pay-card',
					set: paying,
					body: [
						'Retries have a dark side too: when a part fails because it’s too busy, they make it worse. That’s the next lesson.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Timeout',
								'Every call, always: a little above the slowest normal answers.',
							],
							[
								'A deadline passed along',
								'Requests that cross several parts, so nobody works on after the caller has given up.',
							],
							[
								'Retry',
								'Failures that may go away by themselves: timeouts, dropped connections, 503. Never 400 or 404.',
							],
							[
								'Idempotency key',
								'Any retry of something that changes data, like a payment or an order.',
							],
							[
								'Hedged request',
								'Reads where the slowest few matter, with copies to spare. Never for anything that isn’t safe to repeat.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the shaky connection. Turn retries off and on, and watch how many payments work.',
				journey: 'pay-card',
				set: shaky,
			},
		},
		{
			id: 'retry-storms',
			title: 'Retry storms',
			summary:
				'How retries swamp a part that’s already too busy, and the fixes: one layer retrying, backoff, jitter and a retry budget.',
			steps: [
				{
					title: 'A sale, without retries',
					show: payShow,
					journey: 'pay-card',
					set: { ...sale, retries: false },
					facts: ['succeed', 'wait', { busy: 'payments' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A sale brings 120 payments a second, and the **Payment provider** can take 100. The 20 it can’t take fail: 1 payment in 6.',
					],
				},
				{
					title: 'A retry storm',
					show: payShow,
					journey: 'pay-card',
					set: sale,
					facts: ['succeed', 'wait', { retries: 'payments' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Now turn retries on. Every failed call comes back, up to twice. The provider gets 222 calls a second for the same 120 payments, so more than half of all calls fail, and those come back too.',
						'It still finishes only 100 a second, so no more payments go through than without retries, and each takes longer: 2.7 seconds, not 2.0. That’s a retry storm. Retries rescue calls that fail now and then; when a part fails because it’s too busy, they only pile more on.',
					],
				},
				{
					title: 'Every layer retrying',
					show: payShow,
					journey: 'pay-card',
					set: sale,
					facts: [
						{
							label: 'Calls for one payment',
							value: 'up to 9',
							hint: '3 tries at each of 2 layers',
						},
					],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'It gets worse when every layer retries. The app tries the server 3 times, and for each of those, the server tries the provider 3 times: up to 9 calls for one payment. Add one more layer in between, and it’s 27.',
						'One tap on Pay becomes a flood at the bottom, exactly where things are already failing. So only one layer retries, usually the one next to the part that failed, and the layers above it pass the failure up at once.',
					],
					example: {
						says: 'Each layer tries 3 times.',
						data: {
							'the app to the server': '3 tries',
							'the server to the provider': '3 × 3 = 9 calls',
							'one more layer in between': '3 × 3 × 3 = 27 calls',
						},
					},
				},
				{
					title: 'Back off: wait longer each time',
					show: payShow,
					journey: 'pay-card',
					set: sale,
					body: [
						'A retry sent at once arrives while the part is still struggling. So wait first, and wait longer after each failure: 100 ms, then 200, then 400, then 800, doubling each time, up to a cap of a few seconds. That’s exponential backoff.',
						'It gives a part with a short problem, like a restart or a brief spike, time to recover before the retries arrive. And give up after a few tries: by then, the shopper has usually given up too.',
					],
					example: {
						says: 'Exponential backoff, starting at 100 ms.',
						data: {
							'try 2': 'after 100 ms',
							'try 3': 'after 200 ms',
							'try 4': 'after 400 ms',
							'try 5': 'after 800 ms',
							then: 'give up, and say so',
						},
					},
				},
				{
					title: 'Jitter: don’t all come back at once',
					show: payShow,
					journey: 'pay-card',
					set: sale,
					body: [
						'Backoff alone has a flaw. When the provider stumbles, hundreds of calls fail at the same moment, all wait exactly 100 ms, and all come back at the same moment. Then they all wait 200 ms, and come back together again. Each wave hits as one.',
						'So each caller waits a random time instead, anywhere between zero and its backoff. That’s jitter. The retries spread out over the whole wait instead of arriving as one spike. Amazon’s engineers compared ways of doing this, and this one, called full jitter, did the least work in total. AWS’s own SDKs back off with jitter.',
					],
					example: {
						says: 'Try 3, with full jitter: a random wait from 0 to 200 ms.',
						data: {
							'server 1': 'waits 37 ms',
							'server 2': 'waits 151 ms',
							'server 3': 'waits 96 ms',
							'without jitter': 'all three wait 200 ms, and arrive together',
						},
					},
				},
				{
					title: 'A retry budget',
					show: payShow,
					journey: 'pay-card',
					set: { ...sale, retryBudget: 0.1 },
					facts: ['succeed', 'wait', { retries: 'payments' }, { busy: 'payments' }],
					body: [
						'Backoff and jitter spread retries out, but in a long overload they all still arrive in the end. A retry budget caps them: retries may add at most about 10% to the calls a server sends. When more than that would be retries, something is badly wrong, and retries stop until it’s better.',
						'On the shaky connection, retries added about 5%, well within a 10% retry budget, so they still rescued nearly every payment. During the sale, the budget lets through only 12 retries a second, not 102, so the provider gets 132 calls a second, not 222. Just as many payments go through, 5 in 6, and each waits 2.2 s, not 2.7.',
						'Google’s SRE book suggests just this: try a request at most 3 times, and keep each caller’s retries under 10% of its requests. Tools like Envoy and Linkerd can keep a retry budget for you.',
					],
				},
				{
					title: 'Which one when',
					show: payShow,
					journey: 'pay-card',
					set: sale,
					body: [
						'Retries are for failures that come and go. These keep them from turning a busy part into a broken one.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Retry at one layer',
								'Always. The layers above pass a failure up at once, instead of trying again themselves.',
							],
							[
								'Exponential backoff',
								'Every retry. It gives a part with a short problem time to recover.',
							],
							['Jitter', 'Every backoff, so many callers don’t come back in step.'],
							[
								'Retry budget',
								'Any busy path. Retries rescue rare failures, and stop when failures are common.',
							],
							[
								'Circuit breaker',
								'When a part keeps failing, stop calling it for a while. The next lesson.',
							],
							[
								'No retry',
								'A change that isn’t safe to repeat and has no idempotency key, or when the shopper will simply tap again.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely during the sale, with retries on. Turn retries off and on, and watch the payment provider. Then try circuit breakers.',
				journey: 'pay-card',
				set: sale,
			},
		},
		{
			id: 'failing-gracefully',
			title: 'Failing gracefully',
			summary:
				'When a part breaks, show what you can: optional parts, circuit breakers and their three states, fallbacks, bulkheads, and shedding load by priority.',
			steps: [
				{
					title: 'A page with suggestions',
					show: recsShow,
					journey: 'look-recs',
					set: suggesting,
					facts: ['wait'],
					timeline: true,
					body: [
						'Each product page also shows similar products, from the **Recommendations** service. Nice to have, but not what the shopper came for.',
						'The page waits for both: the product from the **Database**, and the suggestions.',
					],
				},
				{
					title: 'Suggestions break, and so does the page',
					show: recsShow,
					journey: 'look-recs',
					set: { ...suggesting, down: ['recs'] },
					facts: ['succeed', 'wait'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'When Recommendations goes down, the server waits 2 seconds for suggestions, gives up, and fails the whole page. A broken extra has taken down the main thing.',
						'In a bigger system, this is how one failure spreads, part to part, until everything is down: a cascading failure.',
					],
				},
				{
					title: 'Show the page without them',
					show: recsShow,
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
					show: recsShow,
					journey: 'look-recs-opt',
					set: { ...suggestingIfAble, circuitBreakers: true },
					facts: ['succeed', 'wait'],
					body: [
						'A circuit breaker notices that calls to Recommendations keep failing, and stops making them for a while. Pages skip the suggestions at once, instead of waiting.',
						'Every so often it lets a call through, to see if they’re back. And Recommendations gets a rest from requests it can’t answer, which can be what it needs to recover.',
					],
				},
				{
					title: 'Closed, open, half-open',
					show: recsShow,
					journey: 'look-recs-opt',
					set: { ...suggestingIfAble, circuitBreakers: true },
					current: [['server', 'recs']],
					body: [
						'A circuit breaker sits in the server, around its calls to one part, and has three states, named after the electrical kind.',
						'Closed: calls go through as usual, and it counts the failures. When too many fail, say half of the last 100, it opens. Open: no calls go through, and each fails at once. After a wait, say 60 seconds, it goes half-open, and lets a few test calls through. If they work, it closes; if not, it opens for another wait.',
						'Those numbers are the defaults in Resilience4j, a popular Java library. Netflix’s Hystrix made the idea famous, though it’s no longer developed, and Polly does the same in .NET.',
					],
					example: {
						says: 'The breaker around calls to Recommendations.',
						data: {
							closed: 'calls go through; 3 of the last 100 failed',
							open: '52 of the last 100 failed: every call fails at once, for 60 s',
							'half-open': '10 test calls let through: they work, so it closes',
						},
					},
				},
				{
					title: 'A fallback: saved suggestions',
					show: [...recsShow, 'rl-saved-recs'],
					journey: 'rl-look-recs-saved',
					set: {
						only: ['rl-look-recs-saved'],
						copies: { server: 3 },
						down: ['recs'],
						circuitBreakers: true,
					},
					facts: ['succeed', 'degraded', 'wait'],
					body: [
						'Better than nothing is an older answer, or a simpler one. That’s a fallback. Here, the server keeps the suggestions it got for each product in a cache, **Saved suggestions**, and only asks Recommendations for products with none saved.',
						'With Recommendations down, 9 pages in 10 still show suggestions, a few hours old. Only 1 in 10, with none saved, goes without.',
						'Other fallbacks are a default answer, like the shop’s bestsellers, or a simpler one, like “more from this brand”, worked out without the broken part. Shoppers may not even notice.',
					],
				},
				{
					title: 'Slow is worse than down',
					show: recsShow,
					journey: 'look-recs-opt',
					set: slowAndBusy,
					facts: ['succeed', 'degraded', 'wait', { threads: 'server' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'On a busy evening, 200 pages a second, Recommendations doesn’t break: a bad update makes every answer take 50 times as long. It still passes its health checks, and a few answers still arrive. So nearly every page waits the full 2 seconds for suggestions that mostly don’t come.',
						'In many servers, each request in progress holds a thread, and there are only so many: here 50 on each copy of the **Web server**, 150 in all. Every page waiting on suggestions holds one, so the server would need far more than it has. It runs out, and turns away what it can’t take: product pages, checkout, everything. About 2 pages in 5 fail.',
						'When Recommendations was down, the circuit breaker failed those calls at once, and no thread was held. That’s why slow is worse than down.',
					],
				},
				{
					title: 'Bulkheads',
					show: recsShow,
					journey: 'look-recs-opt',
					set: { ...slowAndBusy, bulkheads: { 'server>recs': 10 } },
					facts: ['succeed', 'degraded', 'wait', { threads: 'server' }],
					current: [['server', 'recs']],
					body: [
						'Ships are split into watertight compartments by walls called bulkheads, so one hole floods one compartment, not the whole ship. Servers do the same: each part they call gets its own small pool of threads or connections.',
						'Here each copy of the server lets calls to Recommendations use at most 10 of its 50 threads. When those 10 are all waiting, the next page skips the suggestions at once instead of waiting, and the other 40 keep serving product pages and checkout. Every page works again, in about 0.2 seconds, most of them without suggestions.',
						'The same idea works at a bigger size: separate copies of a service for checkout and for browsing, so one can’t starve the other.',
					],
					example: {
						says: 'Each copy’s 50 threads, in pools.',
						data: {
							Recommendations: 'at most 10: all waiting, so skip the suggestions',
							'Payment provider': 'at most 15',
							'everything else': 'the other 25, still free',
						},
					},
				},
				{
					title: 'A rush, and everything fails alike',
					show: watchShow,
					journey: 'rl-checkout',
					draw: ['look-lb'],
					set: rush,
					facts: [
						{ succeed: 'rl-checkout', label: 'Checkouts that work' },
						{ succeed: 'look-lb', label: 'Product pages that work' },
						{ busy: 'server' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'A sale starts, and the shop gets more than its two web servers can answer: 240 requests a second, for 200. Every request is treated the same, so 1 in 6 of everything fails: product pages, and checkouts too.',
						'But a failed checkout is a lost sale, while a failed product page is a shopper who taps again. They aren’t worth the same.',
					],
				},
				{
					title: 'Shedding load, by priority',
					show: watchShow,
					journey: 'rl-checkout',
					draw: ['rl-look-shed'],
					set: shedding,
					facts: [
						{ succeed: 'rl-checkout', label: 'Checkouts that work' },
						{ load: 'server' },
						{ busy: 'server' },
					],
					body: [
						'So the shop sorts requests by how much they matter. Near full, it turns the least important away at once, with a quick “busy, try again”, before doing any work on them. Here, it lets in 6 product pages in 10, and every checkout: 160 requests a second, 80% busy, and every checkout works.',
						'That’s load shedding. Turning a request away early costs almost nothing, while one that times out halfway costs the full work and still fails. Decide the order in advance: the extras first, then browsing, and checkout last of all.',
					],
					example: {
						says: 'What goes first, in a rush.',
						data: {
							'suggestions and reviews': 'switched off first',
							'product pages': 'let in while there’s room',
							'checkout and payment': 'always let in',
						},
					},
				},
				{
					title: 'Which one when',
					show: recsShow,
					journey: 'look-recs-opt',
					set: { ...suggestingIfAble, circuitBreakers: true },
					body: [
						'They work best together. A breaker with nothing to fall back on just fails faster, and a fallback without a breaker still waits out every timeout first.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Optional parts',
								'Anything the page can show without: suggestions, reviews, a delivery estimate.',
							],
							[
								'Circuit breaker',
								'A part that keeps failing or timing out: stop waiting on it, and check back now and then.',
							],
							[
								'Fallback',
								'When an older, default or simpler answer is better than none.',
							],
							[
								'Bulkhead',
								'Several things share one server: cap what each may use, so one slow part can’t take it all.',
							],
							[
								'Load shedding',
								'More arrives than can be answered: turn the least important away early, and keep what matters.',
							],
						],
					},
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
			summary:
				'Limiting how often each user may ask: who to count, where to check, what to answer, quotas, and staying under other companies’ limits.',
			steps: [
				{
					title: 'A bot arrives',
					show: gwShow,
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
						'The servers fill up, and nearly half the real shoppers’ pages fail.',
					],
				},
				{
					title: 'A limit for each user',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					current: [['gateway', 'server']],
					set: limited,
					facts: [
						{ succeed: 'look-gw', label: 'Shoppers’ pages that work' },
						{ busy: 'server' },
					],
					about: 'gateway',
					body: [
						'The **API gateway** counts each user’s requests. Up to 20 a second is fine. Past that, it turns the request away at once, without bothering the servers.',
						'The bot gets its 20 a second, and the other 380 are turned away at the door. Shoppers never come near the limit, and every page works again.',
					],
				},
				{
					title: 'Who to count',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					set: limited,
					body: [
						'A limit needs to know who’s asking. Signed-in shoppers are counted by their account, and partners’ apps by their API key, the secret they send with each request. Visitors who aren’t signed in can only be counted by their IP address, the number their requests come from on the internet.',
						'Addresses are rough. A whole office, or thousands of phones on a mobile network, can share one, so a limit per address has to be generous, or many real people get turned away together.',
						'Limits are also set for each kind of request, by what it costs: reading a product is cheap, a search is heavier, and logging in is limited hard, to stop people guessing passwords.',
					],
					example: {
						says: 'The shop’s limits.',
						data: {
							'each signed-in shopper': '20 requests a second',
							'each IP address': '50 a second, shared by everyone behind it',
							search: '5 a second for each shopper',
							'logging in': '5 tries a minute for each account',
							'each partner’s API key': '1,000 a minute',
						},
					},
				},
				{
					title: 'Where to check',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					current: [['lb', 'gateway']],
					set: limited,
					body: [
						'Check as early as possible, so a turned-away request costs almost nothing: at the API gateway or the load balancer, before any server does work. nginx, Envoy and Amazon API Gateway all have rate limiting built in.',
						'Limits also protect the shop from its own mistakes: an app update that asks in a loop, or a report job that suddenly asks too much. So busy services often keep a limit of their own too, for the callers inside the shop.',
					],
				},
				{
					title: 'The answer: 429',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					current: [['lb', 'gateway']],
					set: limited,
					body: [
						'A turned-away request gets the answer 429 Too Many Requests, made for just this. It’s quick, so it costs the shop almost nothing.',
						'A good 429 says when to come back, in a Retry-After header. Many APIs also say where each caller stands on every answer: the limit, how many are left, and when the count starts again. GitHub’s API, for one, sends these as x-ratelimit headers, so careful callers slow down before they hit the limit.',
					],
					example: {
						says: 'The bot’s 21st request this second.',
						data: {
							status: '429 Too Many Requests',
							'Retry-After': '1',
							'x-ratelimit-limit': '20',
							'x-ratelimit-remaining': '0',
							answer: 'Too many requests. Try again in 1 second.',
						},
					},
				},
				{
					title: 'Quotas: limits over a month',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					set: limited,
					body: [
						'A rate limit is about seconds: it protects the servers from a flood. A quota is about days or months: how much each customer may use in total, often set by what they pay for.',
						'A partner on the free plan might get 10,000 calls a day, and a paying one a million. GitHub’s API allows a signed-in user 5,000 requests an hour, and someone not signed in only 60.',
						'Most APIs have both: a quota for fair use and billing, and a rate limit for safety.',
					],
				},
				{
					title: 'Other companies’ limits',
					show: payShow,
					journey: 'pay-card',
					set: { ...sale, retries: false },
					facts: ['succeed', { busy: 'payments' }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The companies the shop calls have limits too. If the **Payment provider** allows 100 calls a second and a sale brings 120, the extra 20 are turned away, and 1 payment in 6 fails.',
						'So the shop limits itself, a little under 100 a second, before the provider has to. What doesn’t fit waits a moment in a queue, or, for work nobody waits for, like emails, goes in the background. And when a 429 does come, it waits as long as Retry-After says.',
					],
				},
				{
					title: 'Which one when',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					set: limited,
					body: [
						'How a limiter counts is the next lesson: there are five common ways, each with its own trade-off.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'For each user or API key',
								'The usual. Fair to each customer, and a bot can’t take more than its share.',
							],
							[
								'For each IP address',
								'Visitors who aren’t signed in. Generous, since many people can share one address.',
							],
							[
								'For each kind of request',
								'Costly or sensitive ones, like search or logging in, get tighter limits.',
							],
							['Quota', 'Total use over a day or a month, for fair use and billing.'],
							[
								'Your own limit on calls out',
								'Calling a company with a limit: stay under it, and queue the rest.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the bot and no limit. Add copies of the web server, and see how many it takes to keep up, compared with one limit.',
				journey: 'look-gw',
				set: flooded,
			},
		},
		{
			id: 'rate-limit-algorithms',
			title: 'How a rate limiter counts',
			summary:
				'Fixed windows, sliding logs and counters, token buckets and leaky buckets: how each counts, what it costs, and counting across many gateways.',
			steps: [
				{
					title: 'Fixed window',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					current: [['gateway', 'server']],
					set: limited,
					body: [
						'The simplest way: a counter for each user for each minute. Each request adds one. Past 100 in this minute, turn it away. When the minute ends, start again from zero. That’s a fixed window.',
						'It’s cheap: one number for each user, and nothing to clean up but the old minutes.',
					],
					example: {
						says: 'Riya, limited to 100 a minute.',
						data: {
							'14:05:00 to 14:05:58': '100 requests: all allowed',
							'14:05:59, request 101': 'turned away',
							'14:06:00': 'a new window: the count starts again at 0',
						},
					},
				},
				{
					title: 'The burst at the boundary',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					current: [['gateway', 'server']],
					set: limited,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Fixed windows have a gap. A bot sends 100 requests at 14:05:59, the last second of one window, and 100 more at 14:06:00, the first second of the next. Each window counts 100: fine. But the servers just got 200 requests in two seconds, twice the limit.',
						'For many APIs, that’s good enough. When it isn’t, the window has to slide.',
					],
					example: {
						says: 'Two windows, back to back.',
						data: {
							'14:05:59': '100 requests, counted in the 14:05 window: allowed',
							'14:06:00': '100 requests, counted in the 14:06 window: allowed',
							'in those 2 seconds': '200 requests: twice the limit',
						},
					},
				},
				{
					title: 'Sliding window log',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					current: [['gateway', 'server']],
					set: limited,
					body: [
						'Instead, keep the time of every request each user makes. For each new one, forget the times more than a minute old, and count the rest. Under 100, allow it, and add its time.',
						'It’s exact: there’s no boundary to game. But it stores one entry for every request: a user allowed 1,000 a minute needs up to 1,000 times kept, for every user. In Redis, it’s usually a sorted set of times.',
					],
				},
				{
					title: 'Sliding window counter',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					current: [['gateway', 'server']],
					set: limited,
					body: [
						'A cheaper middle way keeps just two counts for each user: this minute’s and last minute’s. It guesses how many of last minute’s requests were in the last 60 seconds, as if they had been spread evenly.',
						'15 seconds into this minute, the last 60 seconds still include 45 seconds of the minute before: three quarters of it. So it counts three quarters of last minute’s 80, which is 60, plus this minute’s 30: 90. That’s under 100, so the request is allowed.',
						'It’s nearly as exact as the log, for the memory of a fixed window. Cloudflare’s rate limiting counts this way.',
					],
					example: {
						says: 'Riya at 14:06:15, limited to 100 a minute.',
						data: {
							'14:05, the whole minute': '80 requests',
							'14:06, so far': '30 requests',
							estimate: '80 × 45 ÷ 60 + 30 = 90',
							answer: 'allowed: 90 is under 100',
						},
					},
				},
				{
					title: 'Token bucket',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					current: [['gateway', 'server']],
					set: limited,
					facts: [
						{ succeed: 'look-gw', label: 'Shoppers’ pages that work' },
						{ busy: 'server' },
					],
					body: [
						'Each user has a bucket that holds up to 40 tokens. Each request takes one. Tokens drip back in at 20 a second, and a full bucket can’t hold more. No token, no request.',
						'So after a quiet spell, a user can burst up to 40 at once, but can’t keep up more than 20 a second. Two numbers to set: the bucket’s size, the biggest burst, and how fast it fills, the steady limit. And only two values to keep for each user: the tokens left, and when it last filled.',
						'Real users do come in bursts, so this is the most common choice for APIs. Stripe and Amazon API Gateway both limit with token buckets.',
					],
					example: {
						says: 'A bucket of 40, filling at 20 a second.',
						data: {
							'the bot sends 400 a second': 'the first 40 pass, then 20 a second',
							'Riya taps 6 times quickly': 'all 6 pass: her bucket was full',
						},
					},
				},
				{
					title: 'Leaky bucket',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					current: [['gateway', 'server']],
					set: limited,
					body: [
						'A leaky bucket turns it around. Requests go into a bucket, which is a queue, and leak out of the bottom to the servers at a steady rate, say 20 a second. When the bucket is full, new requests spill over and are turned away.',
						'The servers see a smooth, even flow, however bursty the callers. The cost is that a burst waits its turn in the bucket instead of being answered at once. nginx’s limit_req works this way, and its burst setting is the bucket’s size.',
					],
					example: {
						says: 'nginx: limit_req with rate=20r/s and burst=40.',
						data: {
							'a steady flow': '20 a second passed to the servers',
							'a burst of 30 at once': 'queued, and passed on over 1.5 seconds',
							'more than 40 waiting': 'turned away with an error',
						},
					},
				},
				{
					title: 'Counting across many gateways',
					show: ['app', 'bot', 'lb', 'gateway', 'rl-counts', 'server', 'db'],
					journey: 'rl-look-counted',
					draw: ['rl-scrape-counted'],
					current: [['gateway', 'rl-counts']],
					set: counted,
					facts: [{ copies: 'gateway' }, { load: 'rl-counts' }],
					copies: true,
					body: [
						'The shop runs three copies of the gateway, and each sees only the requests it gets. If each counted alone, a bot spread over all three would get three times its limit. So the counts live in one fast shared store, **Rate limit counts**, in Redis, which every copy asks: all 550 requests a second, the bot’s and the shoppers’.',
						'Counting must be an atomic increment: add one and read the new count in a single step. Otherwise two copies can both read 19, both write 20, and a request slips through uncounted. Redis’s INCR does exactly that, and for a token bucket, a short Lua script runs inside Redis as one step.',
						'Asking Redis on every request adds a millisecond or so. The busiest gateways count in their own memory and share the counts every moment instead: a little less exact, and much cheaper.',
					],
					example: {
						says: 'A fixed window in Redis: Riya, at 14:06.',
						data: {
							'INCR rl:riya:1406': '101: the count, with this request added',
							'EXPIRE rl:riya:1406 60':
								'deleted after a minute, so nothing to clean up',
							answer: 'over 100: 429 Too Many Requests',
						},
					},
				},
				{
					title: 'Which one when',
					show: gwShow,
					journey: 'look-gw',
					draw: ['scrape-limited'],
					set: limited,
					body: [
						'All five need the same thing once there’s more than one gateway: a shared count, changed in one step.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Fixed window',
								'One counter for each user. The cheapest and simplest, but allows up to twice the limit across a window’s edge.',
							],
							[
								'Sliding window log',
								'The time of every request. Exact, but its memory grows with the limit.',
							],
							[
								'Sliding window counter',
								'Two counters, and an estimate. Nearly exact, and nearly as cheap as a fixed window.',
							],
							[
								'Token bucket',
								'Allows bursts up to the bucket’s size, then a steady rate. The usual choice for APIs.',
							],
							[
								'Leaky bucket',
								'Smooths bursts into an even flow, by making them wait. For protecting something that needs a steady pace.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with three gateways sharing their counts. Push the traffic up, and see which part fills first.',
				journey: 'rl-look-counted',
				set: counted,
			},
		},
		{
			id: 'observability',
			title: 'Observability',
			summary:
				'Seeing inside a running system: RED and USE metrics, the four golden signals, percentiles, traces, logs and dashboards.',
			steps: [
				{
					title: 'Three numbers for every service',
					show: watchShow,
					journey: 'look-lb',
					set: watching,
					facts: ['rate', 'succeed', 'wait'],
					body: [
						'You can’t fix what you can’t see. For every service, three numbers matter most: the rate of requests arriving, how many end in errors, and their duration, how long they take. That’s the RED method: rate, errors, duration.',
						'Each is measured every few seconds and kept, so it can be drawn as a graph over time. Numbers like these are metrics. The numbers above the diagram, in every lesson here, are metrics.',
					],
				},
				{
					title: 'Three numbers for every machine',
					show: watchShow,
					journey: 'look-lb',
					set: watching,
					facts: [{ busy: 'server' }, { busy: 'db' }],
					body: [
						'For the resources underneath, like processors, memory, disks and the network, there’s a matching set: utilisation, how busy it is; saturation, how much work is waiting for it; and errors. That’s the USE method.',
						'RED says shoppers are having a bad time; USE says which resource is to blame. Google’s SRE book combines them into four golden signals: latency, traffic, errors and saturation.',
					],
					example: {
						says: 'The database’s disk, measured.',
						data: {
							utilisation: 'busy 62% of the time',
							saturation: '4 reads waiting their turn',
							errors: '0',
						},
					},
				},
				{
					title: 'Percentiles, counted in buckets',
					show: watchShow,
					journey: 'look-lb',
					set: watching,
					facts: ['rate'],
					body: [
						'The latency lesson showed why waits are read as percentiles, like the p50 and the p99, not as averages. But a busy service answers thousands of requests a minute, and keeping every time to sort later would cost too much.',
						'So monitoring counts each request into buckets by how long it took: under 25 ms, under 50, under 100, and so on. From the counts, the p99 for any minute can be read off, near enough. Prometheus histograms work this way.',
						'Buckets from several servers can be added together, but their p99s can’t be averaged: the p99 of the whole shop isn’t the average of each server’s. That’s why the counts are kept, not just the percentiles.',
					],
					example: {
						says: 'One minute of product pages: 3,000 requests, counted into buckets.',
						data: {
							'under 25 ms': '1,950',
							'under 50 ms': '2,820',
							'under 100 ms': '2,955',
							'under 400 ms': '2,994',
							'so the p50': 'under 25 ms: the 1,500th request is in there',
							'and the p99': 'between 100 and 400 ms: so is the 2,970th',
						},
					},
				},
				{
					title: 'Something’s slow',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					facts: ['rate', 'succeed', 'wait'],
					tags: [{ text: 'Slow', tone: 'wait' }],
					body: [
						'One evening, pages take far longer. Every page still works, so nothing is broken, but shoppers notice. The metrics say something is wrong, but not where.',
					],
				},
				{
					title: 'A trace: where the time went',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					facts: ['wait'],
					timeline: true,
					body: [
						'A trace follows one request through every part it visits. Each part records a span: what it did, when it started, and how long it took. Put together, the spans show where the time went, like the list beside the diagram.',
						'Here, the **Database** takes most of the time. That’s the one to fix.',
					],
				},
				{
					title: 'Passing the trace id along',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					current: [
						['app', 'lb'],
						['lb', 'server'],
						['server', 'db'],
					],
					body: [
						'For the spans to be put together, the first part gives the request a trace id, and every part passes it on, in a header on each call it makes. The W3C’s traceparent header is the standard way.',
						'OpenTelemetry is the common open-source toolkit for this: libraries for most languages that record spans, pass the ids along, and send it all to a tool like Jaeger, Zipkin or Datadog.',
						'Keeping every trace costs a lot, so most are sampled: keep, say, 1 in 100, plus every one that failed or was slow. Keeping those means deciding once each trace has ended, called tail sampling.',
					],
					example: {
						says: 'The header on every call this request makes.',
						data: {
							traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
							'trace id': '4bf92f35…, the same on every call',
							'span id': '00f067aa…, the caller’s span',
						},
					},
				},
				{
					title: 'Logs: what happened, in words',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					body: [
						'Each part also writes a line for anything worth knowing: an error, a slow query, a payment refused. These are its logs. Written as structured logs, in a format like JSON rather than sentences, they can be searched by any field: every line about order 5521, or every error from checkout.',
						'Each line has a level: DEBUG for detail while building, INFO for normal events, WARN for something odd, ERROR for something that failed. Busy services often keep only WARN and above, or a sample of the rest, because storing every line costs real money.',
						'Each line carries the trace id too, so from one slow trace you can find every line about it, from every part.',
					],
					example: {
						says: 'One structured log line.',
						data: {
							time: '20:02:01.410',
							level: 'WARN',
							service: 'web',
							trace: '4bf92f35…',
							message: 'slow query, 280 ms',
							product: '77',
						},
					},
				},
				{
					title: 'Dashboards',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					facts: ['rate', 'succeed', 'wait', { busy: 'db' }],
					body: [
						'A dashboard puts the graphs that matter side by side: each service’s RED numbers, and its machines’ USE numbers. When something goes wrong, it’s the first place people look, so the most important graphs go at the top. The numbers above are a small one.',
						'Prometheus is a common choice for collecting metrics, and Grafana for drawing them. Clouds have their own, like Amazon CloudWatch, and companies like Datadog sell all of it together.',
					],
				},
				{
					title: 'Which one when',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					body: [
						'Metrics, logs and traces are often called the three pillars of observability. Between them, they answer: is something wrong, where, and why.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Metrics',
								'Cheap numbers over time. Is something wrong, and since when? For graphs and alerts.',
							],
							[
								'Traces',
								'One request’s path, timed. Where is the time going, and which part failed?',
							],
							['Logs', 'What happened, in detail. Why did this order fail?'],
							[
								'Dashboards',
								'The metrics that matter, side by side. The first place to look.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely on the slow evening. Follow the journey, find the slow step, and fix it.',
				journey: 'look-lb',
				set: slowEvening,
			},
		},
		{
			id: 'slos-alerts',
			title: 'SLOs, alerts and on-call',
			summary:
				'Targets for how well the shop works, the error budget they leave, alerts that wake people only when it matters, and learning from failures without blame.',
			steps: [
				{
					title: 'What to measure: an SLI',
					show: watchShow,
					journey: 'look-lb',
					set: watching,
					facts: ['rate', 'succeed', 'wait'],
					body: [
						'To say how well the shop works, first pick what to measure, from the shopper’s side: the share of product pages that work, in under 300 ms. That’s a service level indicator, an SLI: good requests, out of all requests.',
						'Measure it as close to the shopper as you can, like at the load balancer. A server that’s down can’t count its own failures.',
					],
					example: {
						says: 'The SLI for product pages, over 5 minutes.',
						data: {
							'all requests': '15,000',
							'good: worked, in under 300 ms': '14,991',
							SLI: '99.94%',
						},
					},
				},
				{
					title: 'The target: an SLO',
					show: watchShow,
					journey: 'look-lb',
					set: watching,
					facts: [{ label: 'SLO', value: '99.9%', hint: 'of pages good, over 30 days' }],
					body: [
						'Then set a target: 99.9% of product pages good, over 30 days. That’s a service level objective, an SLO. It’s almost never 100%: phones lose signal, networks drop, and the last fraction costs far more than shoppers would ever notice.',
						'An SLA is different: a promise in a contract, with money back if it’s missed. It’s set looser than the SLO, so the team hears about trouble well before it costs money.',
					],
				},
				{
					title: 'The error budget',
					show: watchShow,
					journey: 'look-lb',
					set: watching,
					facts: [
						{
							label: 'Error budget',
							value: '43 min',
							hint: 'a 30-day month, at 99.9%',
						},
						{
							label: 'Or, in pages',
							value: '129,600',
							hint: '0.1% of 50 a second, for 30 days',
						},
					],
					body: [
						'The 0.1% the SLO leaves is the error budget. Over a 30-day month, that’s about 43 minutes of everything down, or, at 50 pages a second, 129,600 pages that may fail or be slow.',
						'While some error budget is left, the team can take risks: ship new features, try changes. When it’s used up, they slow down and spend the time making things steadier, until it recovers. Agree this in advance, so nobody argues about it in the middle of a bad week.',
					],
				},
				{
					title: 'The error budget starts to burn',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					facts: [{ label: 'Good means', value: 'under 300 ms' }, 'wait'],
					tags: [{ text: 'Slow', tone: 'wait' }],
					body: [
						'One evening, pages take 470 ms on average, far over the 300 ms the SLO counts as good. Every page works, but many now count as bad, and the error budget is being spent fast.',
						'Someone needs to know. But who, how, and how soon?',
					],
				},
				{
					title: 'Alert on symptoms, not causes',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					facts: [{ busy: 'db' }],
					body: [
						'Nobody watches graphs all night, so alerts do. The best alerts fire on symptoms, what shoppers feel, like pages failing or slow. Not on causes, like a database at 90% busy: busy is fine if shoppers are happy, and the next problem may have a cause nobody thought to watch.',
						'Machine numbers still matter. They go on dashboards, and into tickets for working hours, not into alerts that wake people up.',
					],
				},
				{
					title: 'Burn rate: how fast the error budget goes',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					body: [
						'An alert on any failure at all would fire all day, and one on a whole month’s total would fire far too late. So alerts watch the burn rate: how fast the error budget is being used, compared with spending it evenly over the month.',
						'A burn rate of 1 uses it up exactly at the month’s end. At 14.4, one hour uses 2% of it, and all of it goes in about two days: wake someone now. At 6 for six hours, 5% is gone: page someone too. A slow burn of 1 for three days uses 10%: a ticket for the morning is enough.',
						'These are the thresholds Google’s SRE workbook suggests. Each alert also checks a short window, like the last 5 minutes, so it stops soon after the problem is fixed.',
					],
					example: {
						says: 'Alerts on the 99.9% SLO.',
						data: {
							'burn rate 14.4, for 1 hour':
								'2% of the error budget gone: page someone',
							'burn rate 6, for 6 hours': '5% gone: page someone',
							'burn rate 1, for 3 days': '10% gone: open a ticket',
						},
					},
				},
				{
					title: 'Alert fatigue',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'An alert that fires often, and needs nothing done, teaches people to ignore alerts. Then the real one gets ignored too. That’s alert fatigue.',
						'So every alert that wakes someone must be urgent, real, and need a person to act. Each links to a runbook: what it means, and the first things to check. An alert nobody needed to act on last time is changed, or deleted.',
					],
				},
				{
					title: 'On call',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					body: [
						'Someone has to answer. Engineers take turns being on call, often a week at a time, with a phone that tools like PagerDuty or Opsgenie ring when an alert fires. A second person backs them up, in case the first can’t answer.',
						'In a big incident, people take roles: one leads and decides, others fix, one keeps everyone else told. The first goal is to stop the harm, by undoing the last change or failing over, not to find the cause. That comes after.',
					],
				},
				{
					title: 'Blameless postmortems',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					body: [
						'After an incident, the team writes a postmortem: what happened, minute by minute, how shoppers were affected, why it happened, and what will change so it can’t happen the same way again.',
						'It’s blameless: it asks how the system let a person make that mistake, not who to blame. People who fear blame hide what they did, and then nobody learns. Google and Etsy both wrote about working this way, and it’s now common practice.',
					],
					example: {
						says: 'Postmortem: slow product pages, 24 November.',
						data: {
							impact: 'for 40 minutes, 1 page in 5 was slow: about a fifth of the month’s error budget',
							cause: 'a new query read every row, because its index was missing',
							'found by': 'the burn-rate alert, after about 5 minutes',
							actions:
								'add the index; test new queries on a full-size copy of the data',
						},
					},
				},
				{
					title: 'Which one when',
					show: watchShow,
					journey: 'look-lb',
					set: slowEvening,
					body: [
						'Together, these turn “is the shop working?” into a number everyone agrees on, and decide who hears about it, and when.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'SLI',
								'What you measure: the share of requests that were good, from the shopper’s side.',
							],
							[
								'SLO',
								'The target for it, like 99.9% over 30 days. A little better than shoppers would notice.',
							],
							[
								'SLA',
								'A promise to customers, with money back. Looser than the SLO.',
							],
							[
								'Error budget',
								'What the SLO leaves. It decides when to ship, and when to steady things.',
							],
							[
								'Burn-rate alert',
								'Wakes someone only when the error budget is going fast. Slow burns become tickets.',
							],
							[
								'Postmortem',
								'After every incident that used a real share of the error budget. Blameless, with actions that get done.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely on the slow evening. Find the part making pages slow, and fix it, so the error budget stops burning.',
				journey: 'look-lb',
				set: slowEvening,
			},
		},
	],
};

const parts: TrackModule['parts'] = [
	...(['a', 'b'] as const).map((zone) => ({
		id: `rl-zone-${zone}`,
		name: `Web servers, zone ${zone.toUpperCase()}`,
		kind: 'service' as const,
		layer: 'services' as const,
		summary: `Copies of the web server in zone ${zone.toUpperCase()}: a data centre with its own power, cooling and network, kilometres from the other zone. Each copy can answer about 100 requests a second.`,
		why: 'Copies in one building all fail together when its power or network does. Copies in two zones keep the shop working when one zone goes down.',
		onFailure:
			'The load balancer’s health checks send everything to the other zone, if it has room.',
		scaling: 'Add copies in each zone, so either one alone could carry the whole load.',
		capacityPerInstance: 100,
		instances: 2,
		latencyMs: 10,
	})),
	{
		id: 'rl-global',
		name: 'Global load balancer',
		kind: 'balancer',
		layer: 'balancing',
		summary:
			'Sends each shopper to a region that’s working, either by DNS, like Amazon Route 53, or with one address for the whole world, like Cloudflare’s.',
		why: 'With the shop in more than one region, something has to choose a region for each shopper, and stop choosing one that’s down.',
		onFailure:
			'It’s spread over many places, run by a cloud company. If it failed, nobody could find the shop.',
		scaling: 'It belongs to a cloud company, built for the whole internet.',
		capacityPerInstance: 100_000,
		instances: 1,
		latencyMs: 1,
	},
	{
		id: 'rl-web-mumbai',
		name: 'Web servers, Mumbai',
		kind: 'service',
		layer: 'services',
		summary:
			'The shop’s web servers in the Mumbai region. Each copy can answer about 100 requests a second.',
		why: 'Mumbai is the shop’s main region, near most of its shoppers.',
		onFailure:
			'If Mumbai goes, shoppers can only shop if another region is ready to take them.',
		scaling: 'Add copies, or let autoscaling add them.',
		capacityPerInstance: 100,
		instances: 2,
		maxInstances: 10,
		latencyMs: 10,
	},
	{
		id: 'rl-web-hyd',
		name: 'Web servers, Hyderabad',
		kind: 'service',
		layer: 'services',
		summary:
			'The shop’s web servers in a second region, Hyderabad. Each copy can answer about 100 requests a second.',
		why: 'A second region keeps the shop working when the first one goes down.',
		onFailure: 'Shoppers sent to Hyderabad get errors.',
		scaling: 'Add copies, or let autoscaling add them, when Mumbai’s shoppers arrive.',
		capacityPerInstance: 100,
		instances: 1,
		maxInstances: 10,
		latencyMs: 10,
	},
	{
		id: 'rl-db-mumbai',
		name: 'Database, Mumbai',
		kind: 'database',
		layer: 'data',
		summary:
			'The shop’s main database, in Mumbai. It sends its changes to the backups, and to Hyderabad when there’s a copy there.',
		why: 'The orders and products have to be kept somewhere safe.',
		onFailure: 'Nothing can be read or saved in Mumbai.',
		scaling: 'A big machine, with copies in other zones.',
		capacityPerInstance: 1_000,
		instances: 1,
		latencyMs: 15,
	},
	{
		id: 'rl-db-hyd',
		name: 'Database copy, Hyderabad',
		kind: 'database',
		layer: 'data',
		summary:
			'A copy of the database in Hyderabad. Every change made in Mumbai reaches it a moment later, and it can be promoted to take changes itself.',
		why: 'If Mumbai is lost, the data is still here, up to the last few seconds.',
		onFailure: 'Hyderabad has no data to serve, until it’s restored from backups.',
		scaling: 'A machine as big as Mumbai’s, so it can take over.',
		capacityPerInstance: 1_000,
		instances: 1,
		latencyMs: 15,
	},
	{
		id: 'rl-backups',
		name: 'Backups',
		kind: 'storage',
		layer: 'data',
		summary:
			'Copies of the database, kept in another region in storage like Amazon S3: a full copy each night, and the change log every few minutes.',
		why: 'If the data itself is lost or ruined, by a disaster, a bug or a mistake, it can be put back as it was at any moment.',
		onFailure:
			'New changes aren’t backed up until it’s back. The shop carries on, but a disaster now would lose more.',
		scaling: 'It can keep any amount; older copies are deleted on a schedule.',
		capacityPerInstance: 1_000,
		instances: 1,
		latencyMs: 50,
	},
	{
		id: 'rl-saved-recs',
		name: 'Saved suggestions',
		kind: 'cache',
		layer: 'data',
		summary:
			'Keeps the suggestions Recommendations gave for each product, for a few hours. 9 products in 10 have some saved.',
		why: 'When Recommendations is slow or down, a few hours old is far better than none.',
		onFailure: 'Every page asks Recommendations, and goes without when it can’t answer.',
		scaling: 'Add memory, or more copies.',
		capacityPerInstance: 5_000,
		instances: 1,
		latencyMs: 1,
		hitRate: 0.9,
	},
	{
		id: 'rl-counts',
		name: 'Rate limit counts',
		kind: 'database',
		layer: 'data',
		summary:
			'A small, very fast store in memory, like Redis, holding each user’s request count. Every copy of the gateway adds to it, in one step.',
		why: 'Each gateway copy sees only some requests. Shared counts make the limit the same, whichever copy a request reaches.',
		onFailure:
			'The gateways can’t count. Many let requests through rather than turn everyone away, so for a while there’s no limit.',
		scaling:
			'One copy can count tens of thousands of requests a second; split users between copies for more.',
		capacityPerInstance: 50_000,
		instances: 1,
		latencyMs: 1,
	},
];

const journeys: TrackModule['journeys'] = [
	{
		id: 'rl-look-zones',
		name: 'Look at a product, served from two zones',
		description:
			'Someone opens a product. The load balancer sends it to a copy of the web server in zone A or zone B, which reads the product from the database.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Ask for the product page' },
			{ from: 'lb', to: 'rl-zone-a', label: 'Pass it to zone A', pick: true, share: 0.5 },
			{ from: 'lb', to: 'rl-zone-b', label: 'Pass it to zone B', pick: true, share: 0.5 },
			{ from: 'rl-zone-a', to: 'db', label: 'Read the product' },
			{ from: 'rl-zone-b', to: 'db', label: 'Read the product' },
		],
	},
	{
		id: 'rl-shop-mumbai',
		name: 'Shop in Mumbai, backed up',
		description:
			'Shoppers look at products and place orders, all in the Mumbai region. The database archives its changes to backups in another region.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'rl-global', label: 'Open shop.example.com' },
			{ from: 'rl-global', to: 'rl-web-mumbai', label: 'To Mumbai' },
			{
				from: 'rl-web-mumbai',
				to: 'rl-db-mumbai',
				label: 'Read the product, or save the order',
			},
			{
				from: 'rl-db-mumbai',
				to: 'rl-backups',
				label: 'Archive the changes, every few minutes',
				mode: 'async',
			},
		],
	},
	{
		id: 'rl-shop-pilot',
		name: 'Shop in Mumbai, copied to Hyderabad',
		description:
			'Shoppers use the shop in Mumbai. Every change is copied to a database in Hyderabad a moment later, ready to take over.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'rl-global', label: 'Open shop.example.com' },
			{ from: 'rl-global', to: 'rl-web-mumbai', label: 'To Mumbai' },
			{
				from: 'rl-web-mumbai',
				to: 'rl-db-mumbai',
				label: 'Read the product, or save the order',
			},
			{
				from: 'rl-db-mumbai',
				to: 'rl-db-hyd',
				label: 'Copy each change to Hyderabad',
				mode: 'async',
			},
		],
	},
	{
		id: 'rl-shop-hyd',
		name: 'Shop in Hyderabad, after Mumbai goes',
		description:
			'Mumbai is down. The global load balancer sends every shopper to Hyderabad, where the database copy has been promoted.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'rl-global', label: 'Open shop.example.com' },
			{ from: 'rl-global', to: 'rl-web-hyd', label: 'Mumbai is down: to Hyderabad' },
			{
				from: 'rl-web-hyd',
				to: 'rl-db-hyd',
				label: 'Read the product, or save the order, in the promoted copy',
			},
		],
	},
	{
		id: 'rl-shop-both',
		name: 'Shop in two regions at once',
		description:
			'The whole shop runs in Mumbai and in Hyderabad, and both serve shoppers. Each region’s database copies its changes to the other.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'rl-global', label: 'Open shop.example.com' },
			{ from: 'rl-global', to: 'rl-web-mumbai', label: 'To Mumbai', pick: true, share: 0.5 },
			{ from: 'rl-global', to: 'rl-web-hyd', label: 'To Hyderabad', pick: true, share: 0.5 },
			{
				from: 'rl-web-mumbai',
				to: 'rl-db-mumbai',
				label: 'Read the product, or save the order',
			},
			{ from: 'rl-web-hyd', to: 'rl-db-hyd', label: 'Read the product, or save the order' },
			{
				from: 'rl-db-mumbai',
				to: 'rl-db-hyd',
				label: 'Copy Mumbai’s changes to Hyderabad',
				mode: 'async',
			},
			{
				from: 'rl-db-hyd',
				to: 'rl-db-mumbai',
				label: 'Copy Hyderabad’s changes to Mumbai',
				mode: 'async',
				// half of what reaches it by now is Mumbai's, copied in: only Hyderabad's own go back
				share: 0.5,
			},
		],
	},
	{
		id: 'rl-look-recs-saved',
		name: 'Look at a product, with saved suggestions',
		description:
			'Someone opens a product. The server uses the suggestions saved for it, and only asks Recommendations for a product with none saved.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Ask for the product page' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Read the product' },
			{ from: 'server', to: 'rl-saved-recs', label: 'Look for saved suggestions' },
			{
				from: 'rl-saved-recs',
				to: 'recs',
				label: 'None saved: find similar products, if it can',
				onMiss: true,
				optional: true,
			},
		],
	},
	{
		id: 'rl-checkout',
		name: 'Check out',
		description: 'Someone checks out. The server saves the order.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Check out' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Save the order' },
		],
	},
	{
		id: 'rl-look-shed',
		name: 'Look at a product, shed in a rush',
		description:
			'During a rush, the shop lets in only as many product pages as it has room for, and turns the rest away at once, so checkout keeps working.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Ask for the product page' },
			{ from: 'lb', to: 'server', label: 'Let it in, while there’s room', share: 0.6 },
			{ from: 'server', to: 'db', label: 'Read the product' },
		],
	},
	{
		id: 'rl-look-counted',
		name: 'Look at a product, counted in a shared store',
		description:
			'Shoppers open products. Each copy of the API gateway adds every request to the user’s count in a shared store, then passes it on if it’s within the limit.',
		rps: 150,
		hops: [
			{ from: 'app', to: 'lb', label: 'Ask for the product page' },
			{ from: 'lb', to: 'gateway', label: 'Check it' },
			{ from: 'gateway', to: 'rl-counts', label: 'Add one to this user’s count' },
			{ from: 'gateway', to: 'server', label: 'Within the limit: pass it on' },
			{ from: 'server', to: 'db', label: 'Read the product' },
		],
	},
	{
		id: 'rl-scrape-counted',
		name: 'A bot copies every product, counted in a shared store',
		description:
			'The scraper bot asks 400 times a second, through all three gateways. Its shared count lets 20 a second through.',
		rps: 400,
		hops: [
			{ from: 'bot', to: 'lb', label: 'Next product, please' },
			{ from: 'lb', to: 'gateway', label: 'Check it' },
			{ from: 'gateway', to: 'rl-counts', label: 'Add one to its count' },
			{
				from: 'gateway',
				to: 'server',
				label: 'Within its limit, 20 a second: pass it on',
				share: 0.05,
			},
			{ from: 'server', to: 'db', label: 'Read the product' },
		],
	},
];

export const reliabilityTrack: TrackModule = { track: reliability, parts, journeys };
