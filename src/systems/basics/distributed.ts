import type { Track } from '@/learn/course';
import type { SystemInput } from '@/model/schema';
import type { Conditions } from '@/sim/scenario';
import type { TrackModule } from './shared';

// replication: a leader and its followers
const replicated: Conditions = {
	only: ['order-save'],
	traffic: 3,
	copies: { server: 3, replica: 2 },
};
const oneFollower: Conditions = {
	only: ['order-sync'],
	traffic: 3,
	copies: { server: 3, replica: 1 },
};
const group: Conditions = { only: ['order-sync'], traffic: 3, copies: { server: 3, replica: 2 } };
const lagging: Conditions = {
	only: ['order-save', 'look-replica'],
	traffic: 3,
	copies: { server: 3, replica: 2 },
};
const promoted: Conditions = {
	only: ['order-promoted'],
	traffic: 3,
	copies: { server: 3 },
	down: ['db'],
};

// no leader: three nodes, each keeping every cart
const nodes = ['ds-node-1', 'ds-node-2', 'ds-node-3'];
const carts: Conditions = { only: ['ds-cart-w2'], traffic: 3, copies: { server: 3 } };
const cartReads: Conditions = { only: ['ds-cart-r2'], traffic: 3, copies: { server: 3 } };

// sharding
const evenSplit: Conditions = { only: ['order-split'], traffic: 20, copies: { server: 3 } };
const bySeller: Conditions = { only: ['order-hot'], traffic: 20, copies: { server: 3 } };
const threeShards: Conditions = { only: ['order-split3'], traffic: 30, copies: { server: 4 } };
const shards = ['shard-1', 'shard-2'];
const allShards = [...shards, 'shard-3'];
/** How busy each of these parts is, one fact each, named. */
const busy = (ids: string[]) => ids.map((id) => ({ busy: id }));

// numbering
const idService: Conditions = { only: ['order-ids'], traffic: 20, copies: { server: 3 } };

const ordinal = ['', 'one', 'two', 'all three'];
const waitFor = ['', 'one of three nodes', 'two of three nodes', 'all three nodes'];

/**
 * Adding to a cart with no leader: sent to all three nodes at once, waiting
 * for the first `wait` to confirm, whichever they are.
 */
const cartWrite = (wait: number): SystemInput['journeys'][number] => ({
	id: `ds-cart-w${wait}`,
	name: `Add to cart, waiting for ${waitFor[wait]}`,
	description: `The cart is kept on three nodes, with no leader. The web server sends the change to all three at once, and tells the shopper it’s saved as soon as ${ordinal[wait]} ${wait === 1 ? 'has' : 'have'} confirmed.`,
	rps: 20,
	hops: [
		{ from: 'app', to: 'lb', label: 'Add the Blue kettle to my cart' },
		{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
		...nodes.map((to, i) => ({
			from: 'server',
			to,
			label: `Write it on node ${i + 1}`,
			together: 'write',
			need: wait,
		})),
	],
});

const parts: SystemInput['components'] = [
	...nodes.map((id, i) => ({
		id,
		name: `Node ${i + 1}`,
		kind: 'database' as const,
		layer: 'data' as const,
		summary:
			'One of three equal machines, each keeping a copy of every cart, like the nodes of a Cassandra cluster. There’s no leader: any of them takes changes.',
		why: 'Adding to a cart should never fail. With no leader, there’s no leader to lose, and no failover to wait for.',
		onFailure:
			'Carts are still saved and read on the other two, as long as each request only waits for two answers.',
		scaling:
			'Add nodes. Each cart lives on three of them, so with more nodes, each holds a smaller share.',
		capacityPerInstance: 500,
		instances: 1,
		latencyMs: 10,
	})),
	{
		id: 'ds-directory',
		name: 'Shard directory',
		kind: 'database',
		layer: 'data',
		summary:
			'A small table that says which shard holds each shopper’s orders. Every request asks it first.',
		why: 'With a lookup table, any shopper can be put on any shard, and moved by changing one row.',
		onFailure: 'Nobody can find their orders, though every shard is fine.',
		scaling:
			'It’s small, so it’s kept in memory, copied, and cached in every web server, which only asks again when it’s told something moved.',
		capacityPerInstance: 2_000,
		instances: 1,
		latencyMs: 2,
	},
	{
		id: 'ds-index',
		name: 'Product index',
		kind: 'database',
		layer: 'data',
		summary:
			'A global index: for each product, the orders that include it, from every shard. It’s split by product, not by shopper.',
		why: 'Without it, finding who bought a product means asking every shard.',
		onFailure:
			'Questions by product can’t be answered. Orders are still saved, and the index catches up when it’s back.',
		scaling: 'It’s sharded too, by product.',
		capacityPerInstance: 150,
		instances: 1,
		latencyMs: 15,
	},
	...[1, 2].map((n) => ({
		id: `ds-ticket-${n}`,
		name: `Ticket server ${n}`,
		kind: 'service' as const,
		layer: 'services' as const,
		summary: `A tiny database that only hands out order numbers: the ${n === 1 ? 'odd ones, 1, 3, 5' : 'even ones, 2, 4, 6'} and so on.`,
		why: 'Two of them, one odd and one even, never give out the same number, and one can carry on when the other breaks.',
		onFailure: 'The web servers ask the other ticket server instead.',
		scaling: 'It does very little for each number, so one can hand out thousands a second.',
		capacityPerInstance: 500,
		instances: 1,
		latencyMs: 3,
	})),
];

const journeys: SystemInput['journeys'] = [
	{
		id: 'ds-order-old-leader',
		name: 'Save an order, in the old leader',
		description:
			'Split brain: the old leader is back, still sure it leads, and some web servers still send it orders.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place the order' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Save the order, in the old leader' },
		],
	},
	{
		id: 'ds-price-delhi',
		name: 'Change a price in Delhi, with a leader in each city',
		description:
			'Delhi has a leader of its own. A change made there is saved in Delhi at once, and copied to Mumbai a moment later.',
		rps: 5,
		hops: [
			{ from: 'app', to: 'lb', label: 'Change the kettle’s price' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'far', label: 'Save the new price, in Delhi' },
			{ from: 'far', to: 'db', label: 'Copy it to Mumbai', mode: 'async' },
		],
	},
	cartWrite(1),
	cartWrite(2),
	cartWrite(3),
	{
		id: 'ds-cart-r2',
		name: 'See my cart, reading two of three nodes',
		description:
			'The cart is kept on three nodes, with no leader. The web server asks all three at once, uses the first two answers, and keeps the newer version if they disagree.',
		rps: 20,
		hops: [
			{ from: 'app', to: 'lb', label: 'Show me my cart' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			...nodes.map((to, i) => ({
				from: 'server',
				to,
				label: `Read it from node ${i + 1}`,
				together: 'read',
				need: 2,
			})),
		],
	},
	{
		id: 'ds-order-range',
		name: 'Save an order, split by date',
		description:
			'Orders are split by date: shard 1 holds January to June, shard 2 July onwards. Every new order is dated today, so every one goes to shard 2.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place the order' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'shard-2', label: 'Save it: dated today, so July onwards' },
		],
	},
	{
		id: 'ds-order-lookup',
		name: 'Save an order, looked up in a directory',
		description:
			'Someone places an order. The web server asks the shard directory which shard holds the shopper, then saves it there.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place the order' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'ds-directory', label: 'Which shard has shopper 1043?' },
			{
				from: 'server',
				to: 'shard-1',
				label: 'Save it where the directory says',
				share: 0.5,
			},
			{
				from: 'server',
				to: 'shard-2',
				label: 'Save it where the directory says',
				share: 0.5,
			},
		],
	},
	{
		id: 'ds-order-salted',
		name: 'Save an order, the big seller split in parts',
		description:
			'Orders are split by seller, but the one big seller’s key has a part number from 0 to 9 added, so its orders spread over every shard.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place the order' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{
				from: 'server',
				to: 'shard-1',
				label: 'Save it: the big seller’s parts 0 to 4, and others',
				share: 0.5,
			},
			{
				from: 'server',
				to: 'shard-2',
				label: 'Save it: the big seller’s parts 5 to 9, and others',
				share: 0.5,
			},
		],
	},
	{
		id: 'ds-search-3',
		name: 'Who bought the kettle, from three shards?',
		description:
			'The shop asks who bought the Blue kettle. Orders are split by shopper over three shards, so all three are asked.',
		rps: 20,
		hops: [
			{ from: 'app', to: 'lb', label: 'Who bought the Blue kettle?' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			...allShards.map((to, i) => ({
				from: 'server',
				to,
				label: `Ask shard ${i + 1}`,
				together: 'every shard',
			})),
		],
	},
	{
		id: 'ds-search-index',
		name: 'Who bought the kettle, from a global index?',
		description:
			'The shop asks who bought the Blue kettle. One index, split by product, lists every order with the kettle, so only it is asked.',
		rps: 20,
		hops: [
			{ from: 'app', to: 'lb', label: 'Who bought the Blue kettle?' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'ds-index', label: 'Look up the Blue kettle in the index' },
		],
	},
	{
		id: 'ds-order-indexed',
		name: 'Save an order, and index it by product',
		description:
			'Someone places an order. It’s saved in the shopper’s shard, which adds it to the product index a moment later.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place the order' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'shard-1', label: 'Save it: odd shopper numbers', share: 0.5 },
			{ from: 'server', to: 'shard-2', label: 'Save it: even shopper numbers', share: 0.5 },
			{
				from: 'shard-1',
				to: 'ds-index',
				label: 'Add it to the product index',
				mode: 'async',
			},
			{
				from: 'shard-2',
				to: 'ds-index',
				label: 'Add it to the product index',
				mode: 'async',
			},
		],
	},
	{
		id: 'ds-order-uneven',
		name: 'Save an order, one spot each round the circle',
		description:
			'Orders are placed round a circle with consistent hashing, but each shard has only one spot, so the arcs between them came out uneven.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place the order' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{
				from: 'server',
				to: 'shard-1',
				label: 'Save it: shard 1’s arc, 55% of the circle',
				share: 0.55,
			},
			{
				from: 'server',
				to: 'shard-2',
				label: 'Save it: shard 2’s arc, 30% of the circle',
				share: 0.3,
			},
			{
				from: 'server',
				to: 'shard-3',
				label: 'Save it: shard 3’s arc, 15% of the circle',
				share: 0.15,
			},
		],
	},
	{
		id: 'ds-order-tickets',
		name: 'Save an order, numbered by two ticket servers',
		description:
			'Someone places an order. The web server gets a number from one of two ticket servers, one odd and one even, taking turns, then saves the order in its shard.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place the order' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'ds-ticket-1', label: 'Next odd number, please', share: 0.5 },
			{ from: 'server', to: 'ds-ticket-2', label: 'Next even number, please', share: 0.5 },
			{ from: 'server', to: 'shard-1', label: 'Save it: odd shopper numbers', share: 0.5 },
			{ from: 'server', to: 'shard-2', label: 'Save it: even shopper numbers', share: 0.5 },
		],
	},
	{
		id: 'ds-order-tickets-one',
		name: 'Save an order, one ticket server left',
		description:
			'Ticket server 2 has broken, so the web servers get every number from ticket server 1.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place the order' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'ds-ticket-1', label: 'Next odd number, please' },
			{ from: 'server', to: 'shard-1', label: 'Save it: odd shopper numbers', share: 0.5 },
			{ from: 'server', to: 'shard-2', label: 'Save it: even shopper numbers', share: 0.5 },
		],
	},
	{
		id: 'ds-order-blocks',
		name: 'Save an order, numbered from a block',
		description:
			'Each web server takes order numbers 1,000 at a time from the ID service, and numbers its orders from that block by itself.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Place the order' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{
				from: 'server',
				to: 'ids',
				label: 'Block used up: send the next 1,000 numbers',
				share: 0.001,
			},
			{ from: 'server', to: 'shard-1', label: 'Save it: odd shopper numbers', share: 0.5 },
			{ from: 'server', to: 'shard-2', label: 'Save it: even shopper numbers', share: 0.5 },
		],
	},
];

const distributed: Track = {
	id: 'distributed',
	name: 'Data on many machines',
	tagline:
		'Copies, shards, numbering, and agreeing on what’s true when machines and networks break.',
	lessons: [
		{
			id: 'replication',
			title: 'Replication',
			summary:
				'The same data on several machines: a leader and its followers, waiting for them or not, and what shoppers see while a follower is behind.',
			steps: [
				{
					title: 'A leader and its followers',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-save',
					current: [['db', 'replica']],
					set: replicated,
					copies: true,
					body: [
						'Replication means keeping the same data on several machines. It’s done for three reasons: if one machine dies, nothing is lost; the copies can share the reading; and a copy can sit near shoppers in another city.',
						'The usual way has one leader. Here, the **Database** is the leader, and every change goes to it. The two **Database copy** machines are its followers: each receives every change from the leader, in the same order, and makes it too.',
						'The leader keeps a log, a numbered list of every change, and sends it on to its followers as it grows. In Postgres it’s called the write-ahead log, or WAL; in MySQL, the binary log, or binlog.',
					],
					example: {
						says: 'Order 5521 is saved. What the followers are sent.',
						data: {
							'change #48,213': 'add order 5521: Riya, the Blue kettle, ₹1,499',
							'each follower': 'makes change #48,213, right after #48,212',
						},
					},
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
						'Here, the leader saves the order, answers straight away, and sends the change to its followers a moment later. That’s asynchronous replication. Nobody waits for a follower: an order takes 31 ms.',
						'It’s what Postgres and MySQL do unless told otherwise. The catch: if the leader dies in that moment, the last few changes never reached a follower. The shopper was told “saved”, and the order is gone.',
					],
				},
				{
					title: 'Wait for the follower',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					current: [['db', 'replica']],
					set: oneFollower,
					copies: true,
					facts: ['wait'],
					timeline: true,
					body: [
						'Or the leader waits until a follower confirms it has the change, and only then answers. That’s synchronous replication. Every order confirmed to a shopper is already on two machines, so losing the leader can’t lose it.',
						'Each order waits a little longer: 50 ms instead of 31. With the follower in another city, that wait is a trip there and back, on every change.',
					],
				},
				{
					title: 'The follower stops, and so do the orders',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: { ...oneFollower, down: ['replica'] },
					facts: ['succeed', 'wait'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Now the **Database copy** stops. The leader is fine, but it waits for a confirmation that never comes. Every order waits out the 2-second timeout, and fails.',
						'Waiting for one particular follower means depending on two machines instead of one. A Postgres leader set up this way simply waits until the follower is back, or until someone changes the setting.',
					],
				},
				{
					title: 'Wait for one of two: semi-synchronous',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: { ...group, copies: { server: 3, replica: 1 } },
					copies: true,
					facts: ['succeed', 'wait', { copies: 'replica' }],
					body: [
						'So the leader is given two followers, and waits for whichever confirms first. Here, one of the two has stopped, so only one is running, and orders carry on: it confirms each change.',
						'This is usually called semi-synchronous replication. Postgres does it with a setting like ANY 1 (s1, s2): any one of the two. MySQL’s version waits for one follower to say it has received the change, and if none answers within 10 seconds, it carries on without waiting, rather than hold up every order.',
						'While the leader waits, every confirmed order is on two machines, and one follower can break without anyone noticing. Many shops that care about every order run this way.',
					],
				},
				{
					title: 'A follower a moment behind',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'look-replica',
					draw: ['order-save'],
					set: lagging,
					copies: true,
					facts: [
						{
							label: 'Replication lag',
							value: 'under 1 s',
							hint: 'usually; minutes on a bad day',
						},
					],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'With asynchronous replication, a follower is always a little behind the leader. That gap is called replication lag. It’s usually well under a second, but a busy follower, one huge change or a slow network can stretch it to seconds, even minutes.',
						'Riya changes her delivery address. The change goes to the leader. Her page reloads at once, reading from a follower that hasn’t got the change yet, and shows the old address. As far as she can tell, her change was lost, so she makes it again.',
					],
					example: {
						says: 'Riya saves a new address, and the page reloads.',
						data: {
							'the leader has': '12 MG Road (new)',
							'the follower read has': '4 Park Street (old)',
							'Riya sees': '4 Park Street',
						},
					},
				},
				{
					title: 'Reading your own writes',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'look-replica',
					draw: ['order-save'],
					set: lagging,
					copies: true,
					body: [
						'The promise Riya needs is called reading your own writes: after she changes something, she always sees her change. Other shoppers can see it a moment later, and that’s fine.',
						'There are three common ways. Read what a shopper can change, like their own profile, from the leader. Or, for a minute after a shopper changes anything, send all their reads to the leader. Or remember the number of their last change, #48,213, and only read from a follower that has reached it.',
					],
					note: {
						title: 'On another device',
						text: 'If Riya changes her address on her laptop and then checks on her phone, the phone knows nothing about the change. Remembering it on the server, with her account, covers both.',
					},
				},
				{
					title: 'Reads that go back in time',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'look-replica',
					draw: ['order-save'],
					set: lagging,
					copies: true,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Riya opens her order, and it says Packed. She pulls to refresh, and now it says Placed. The first read came from a follower that was up to date, the second from one further behind. Time seemed to go backwards.',
						'The promise that prevents this is called monotonic reads: once you’ve seen something, you never see an older version of it. The usual way: each shopper always reads from the same follower, picked by a hash of their number. Only if that follower breaks are they moved to another.',
					],
					example: {
						says: 'Riya opens order 5521, then refreshes.',
						data: {
							'first, from follower 1': 'Packed',
							'then, from follower 2, further behind': 'Placed',
							'the fix': 'Riya always reads from follower 1',
						},
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: group,
					copies: true,
					body: [
						'Each choice trades waiting against what could be lost, or seen out of date. Most shops mix them: semi-synchronous for orders, and reads from followers for everything that can be a moment old.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Asynchronous',
								'The fastest writes, and the leader never waits. A failover can lose the last few changes. The usual default.',
							],
							[
								'Synchronous, one follower',
								'Nothing confirmed is ever lost. But if that follower stops, every write stops.',
							],
							[
								'Semi-synchronous, one of several',
								'Every confirmed change is on two machines, and a follower can break without stopping writes. Common for orders and money.',
							],
							[
								'Reads from followers',
								'Spreads the reading. Fine for product pages and lists that can be a moment old.',
							],
							[
								'Reads from the leader',
								'What a shopper has just changed, and anything that must be current, like the stock count when paying.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the leader waiting for one follower. Take the follower down from its details, and watch every order wait and fail. Then bring it back.',
				journey: 'order-sync',
				set: oneFollower,
			},
		},
		{
			id: 'leader-failover',
			title: 'When the leader breaks',
			summary:
				'Spotting a dead leader, promoting a follower, what can be lost, two leaders at once, and why a copy is no backup.',
			steps: [
				{
					title: 'The leader breaks',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-save',
					draw: ['look-replica'],
					set: { ...lagging, down: ['db'] },
					copies: true,
					facts: [
						{ succeed: 'order-save', label: 'Orders saved' },
						{ succeed: 'look-replica', label: 'Pages read from followers' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The leader’s machine dies. Followers don’t take changes, so not one order can be saved. Pages are still read from the followers, though, so shoppers can still browse.',
						'Something has to notice, choose a follower, and make it the new leader. That’s failover.',
					],
				},
				{
					title: 'A follower takes over',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-promoted',
					current: [['server', 'replica']],
					set: promoted,
					facts: ['succeed'],
					body: [
						'Failover has three steps. Notice: the leader is sent a small “are you there?” message every second or so, a heartbeat, and after enough go unanswered, it’s declared dead. Choose: the follower with the most changes is picked. Switch: it’s made the leader, and the web servers are pointed at it.',
						'How long to wait before declaring it dead is hard to choose. Too short, and a leader that’s only busy is replaced for nothing, in the middle of a rush. Too long, and nobody can order all that time.',
						'Tools do this for you, like Patroni for Postgres. Managed databases like Amazon RDS can keep a standby in another zone, and switch to it by themselves.',
					],
					example: {
						says: 'A failover, step by step.',
						data: {
							'10:41:00': 'the leader stops answering',
							'10:41:20': 'heartbeats missed: declared dead',
							'10:41:21': 'follower 1 has the most changes: promoted',
							'10:41:23': 'web servers send orders to it',
						},
					},
				},
				{
					title: 'What failover can lose',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-promoted',
					set: promoted,
					facts: ['succeed'],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'With asynchronous replication, the new leader may be a few changes behind. Orders the old leader confirmed but never sent are gone: those shoppers were told “saved”, and they weren’t.',
						'Its counters are behind too, so it can hand out numbers that were already given. At GitHub in 2012, an out-of-date MySQL follower was promoted and reused some ID numbers the old leader had already given out. Redis still held those numbers for the old rows, so some private data was shown to the wrong users.',
						'That’s why orders and money often use semi-synchronous replication: then the promoted follower has every confirmed change.',
					],
					example: {
						says: 'Just before the leader died.',
						data: {
							'the leader had': 'changes up to #48,213',
							'follower 1 had': 'up to #48,210',
							'lost in the failover': '#48,211 to #48,213: three orders',
						},
					},
				},
				{
					title: 'Two leaders: split brain',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'ds-order-old-leader',
					draw: ['order-promoted'],
					set: {
						only: ['ds-order-old-leader', 'order-promoted'],
						traffic: 1.5,
						copies: { server: 3 },
					},
					facts: [
						{ succeed: 'ds-order-old-leader', label: 'Orders saved in the old leader' },
						{ succeed: 'order-promoted', label: 'Orders saved in the new leader' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Sometimes the old leader wasn’t dead, only cut off or paused. It comes back still sure it leads, and some web servers still send it orders. Both leaders say yes to every order, and their data no longer fits together: one order number given twice, the last kettle sold twice. That’s split brain.',
						'So a failover must make sure the old leader stops, called fencing: by switching its machine off, or by having every write carry a number that only goes up, so the old leader’s writes are refused. The consensus lesson shows how.',
						'In 2018, GitHub lost the link to one of its data centres for 43 seconds. Its tools promoted databases on the other coast, each side ended up with writes the other didn’t have, and it took about a day to put everything right.',
					],
				},
				{
					title: 'A copy isn’t a backup',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-save',
					set: replicated,
					copies: true,
					body: [
						'Copies copy everything, mistakes included. If someone deletes every order by accident, every follower deletes them too, a moment later.',
						'So the data is also backed up: saved as it was, somewhere else, every night or more often. A backup lets you go back in time. A copy only keeps you going now.',
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
				{
					title: 'Back to the second: point-in-time recovery',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-save',
					set: replicated,
					copies: true,
					body: [
						'A nightly backup alone would lose every order since last night. So the database’s log of changes is kept too, somewhere safe like S3.',
						'To undo a mistake made at 10:42, restore last night’s backup, then replay the log up to 10:41:59. Every order up to the mistake is back, and the mistake isn’t. That’s point-in-time recovery. Postgres does it with its saved WAL, and Amazon RDS can restore to any second within the days you keep, up to 35.',
						'Some teams also keep one follower an hour behind on purpose, a delayed replica, so a recent mistake can be undone quickly. And they practise restoring, because a backup nobody has restored may not work.',
					],
					example: {
						says: 'Someone deleted every order at 10:42.',
						data: {
							restore: 'last night’s backup, from 02:00',
							'replay the log': 'from 02:00 to 10:41:59',
							result: 'every order, without the mistake',
						},
					},
				},
				{
					title: 'What each one protects you from',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-save',
					set: replicated,
					copies: true,
					body: [
						'Copies keep the shop running; backups let it go back. A shop that cares about its orders has both, each for a different kind of trouble.',
					],
					compare: {
						title: 'What each one protects you from',
						rows: [
							[
								'A follower nearby',
								'A broken machine: failover in seconds. An asynchronous one can lose the last few changes.',
							],
							[
								'A semi-synchronous follower',
								'Losing confirmed orders in a failover.',
							],
							[
								'Followers in another zone or region',
								'A whole data centre going down: fire, power, network.',
							],
							['Nightly backups', 'Mistakes and bad code: go back to last night.'],
							[
								'Point-in-time recovery',
								'Mistakes, to the second: everything up to just before.',
							],
							[
								'A delayed replica',
								'A recent mistake, undone quickly, without a slow restore.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the leader down. Bring it back from its details, then take the database copy down instead, and see what still works.',
				journey: 'order-save',
				set: { ...lagging, down: ['db'] },
			},
		},
		{
			id: 'quorums',
			title: 'Many leaders, or none',
			summary:
				'A leader in every region and the conflicts it brings, then no leader at all: write to N copies, wait for W, read from R.',
			steps: [
				{
					title: 'A leader in every region',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'ds-price-delhi',
					set: { only: ['ds-price-delhi'] },
					body: [
						'With one leader in Mumbai, every change made in Delhi or London travels to Mumbai and back before it’s saved. And if the link to Mumbai breaks, nobody elsewhere can change anything.',
						'So some shops run a leader in each region. Here, a price changed in Delhi is saved by the **Copy in Delhi**, now a leader too, and copied to Mumbai in the background. Mumbai’s changes travel the other way. That’s multi-leader replication: fast changes everywhere, and each region keeps working when the link breaks.',
						'DynamoDB global tables work like this. So does any app that works offline, like a calendar on your phone: each phone is a leader for its own changes, and catches up when it’s back online.',
					],
				},
				{
					title: 'Two changes at once',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'ds-price-delhi',
					set: { only: ['ds-price-delhi'] },
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Two staff change the Blue kettle’s price at the same moment: Asha in Mumbai to ₹1,299, Vikram in Delhi to ₹1,399. Each leader says yes at once. Then each receives the other’s change.',
						'Which price is right? There’s no single leader to say which came first. That’s a write conflict, and with many leaders, every app has to decide how to settle them.',
					],
					example: {
						says: 'Two changes to one price, a few milliseconds apart.',
						data: {
							'Mumbai, at 10:00:00.120': '₹1,299',
							'Delhi, at 10:00:00.180': '₹1,399',
							'then each city receives': 'the other’s change',
						},
					},
				},
				{
					title: 'Settling conflicts',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'ds-price-delhi',
					set: { only: ['ds-price-delhi'] },
					body: [
						'The simplest rule is last write wins: each change carries the time it was made, and the latest is kept. Here, Delhi’s ₹1,399. DynamoDB global tables and Cassandra both do this. The cost: Asha’s change is thrown away, and nobody is told.',
						'Some data can be merged instead. A cart changed on two devices can keep everything added on either: Amazon’s Dynamo did this, though an item removed on one device could reappear. Data types built to merge themselves, called CRDTs, do it for counters and sets; Riak and Redis Enterprise offer them.',
						'The safest way is to avoid conflicts: give each record a home region. Riya’s account is always changed in Mumbai, wherever she is, so only one leader ever changes it.',
					],
					note: {
						title: 'Whose clock?',
						text: 'Every machine’s clock drifts, and is corrected now and then over the network, using NTP. Two clocks can disagree by a few milliseconds, or far more on a bad day. So the “last” write is only roughly last.',
					},
				},
				{
					title: 'No leader at all',
					show: ['app', 'lb', 'server', ...nodes],
					journey: 'ds-cart-w2',
					set: carts,
					facts: ['succeed', 'wait', { busyEach: nodes }],
					body: [
						'Some databases have no leader. Every cart is kept on three machines, called nodes, and the web server sends each change to all three at once. The number of copies is called N: here, 3.',
						'It doesn’t wait for all of them. It waits for W of them to confirm, here 2, and then tells Riya her kettle is in the cart. The third gets the change too, a moment later. That’s leaderless replication.',
						'Every node still saves every change: all three are equally busy. Copies make data safe; they don’t spread the writes. Spreading those is sharding’s job.',
					],
					note: {
						title: 'Who sends it on',
						text: 'In Cassandra, the web server talks to any one node, which passes the change to the nodes that hold that cart and waits for their answers. Here, the web server does that job itself, to keep the picture simple.',
					},
					example: {
						says: 'Riya adds the Blue kettle. N = 3, W = 2.',
						data: {
							'Node 1': 'saved: the first to answer',
							'Node 2': 'saved: the second, so Riya is told “added”',
							'Node 3': 'saved a moment later',
						},
					},
				},
				{
					title: 'Reading from two',
					show: ['app', 'lb', 'server', ...nodes],
					journey: 'ds-cart-r2',
					set: cartReads,
					facts: ['succeed', 'wait'],
					body: [
						'Reading works the same way. The web server asks all three at once and uses the first R answers, here 2, and if they disagree, keeps the newer version: every change carries a version number. Dynamo used vector clocks, which can also tell when two changes were made at once, so neither is newer.',
						'Why 2? Because W + R is more than N: 2 + 2 is more than 3. The two nodes that confirmed a change and the two you read from must share at least one node, so a read always meets the latest confirmed change. Enough nodes to overlap like this is called a quorum.',
					],
					example: {
						says: 'Riya opens her cart. R = 2.',
						data: {
							'Node 1': 'version 7: the Blue kettle and a toaster',
							'Node 2': 'version 6: just the toaster, a change behind',
							kept: 'version 7, the newer',
						},
					},
				},
				{
					title: 'A node stops',
					show: ['app', 'lb', 'server', ...nodes],
					journey: 'ds-cart-w2',
					set: {
						only: ['ds-cart-w2', 'ds-cart-w3'],
						traffic: 3,
						copies: { server: 3 },
						down: ['ds-node-3'],
					},
					facts: [
						{ succeed: 'ds-cart-w2', label: 'Waiting for 2 of 3' },
						{ succeed: 'ds-cart-w3', label: 'Waiting for all 3' },
					],
					body: [
						'**Node 3** stops. Carts are still saved: two nodes confirm each change, and two is all W = 2 needs. Reads still work too, from the two that are left. Had the shop waited for all three, every change would now fail.',
						'There’s no failover to wait for, because there’s no leader. The changes node 3 misses aren’t forgotten: another node keeps them as notes, called hints, and hands them over when node 3 is back. That’s hinted handoff.',
					],
					note: {
						title: 'Any two will do',
						text: 'In a real cluster, it doesn’t matter which two answer: with node 1 down instead, nodes 2 and 3 would do. The diagram always waits for nodes 1 and 2, to keep the picture simple.',
					},
				},
				{
					title: 'A slow node',
					show: ['app', 'lb', 'server', ...nodes],
					journey: 'ds-cart-w2',
					set: {
						only: ['ds-cart-w2', 'ds-cart-w3'],
						copies: { server: 3 },
						slow: { 'ds-node-3': 10 },
					},
					facts: [
						{ wait: 'ds-cart-w2', label: 'Wait, for 2 of 3' },
						{ wait: 'ds-cart-w3', label: 'Wait, for all 3' },
					],
					body: [
						'Now node 3 isn’t down, just slow: its disk is failing, and every write takes ten times as long. Waiting for all three, every change waits for it, more than half a second. Waiting for two, the quick ones answer first, in 23 ms, and node 3 catches up on its own.',
						'That’s a big reason to use quorums: one slow machine, the hardest kind of failure to spot, slows nobody down.',
					],
				},
				{
					title: 'Two nodes stop',
					show: ['app', 'lb', 'server', ...nodes],
					journey: 'ds-cart-w2',
					set: { ...carts, down: ['ds-node-2', 'ds-node-3'] },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Two of the three stop. Only one node can confirm, W = 2 can’t be met, and every change fails.',
						'Amazon’s Dynamo, the 2007 design behind all this, and Riak can bend the rule: write to other healthy nodes instead, which keep the change as a hint until the right ones are back. That’s a sloppy quorum. Carts can always be saved, but a read may miss the change until it’s handed back.',
					],
				},
				{
					title: 'Catching up',
					show: ['app', 'lb', 'server', ...nodes],
					journey: 'ds-cart-r2',
					set: cartReads,
					body: [
						'A node that missed changes has to catch up. Two things do it.',
						'Read repair: when a read finds a node with an older version, the web server sends it the newer one. Carts that are read often get fixed quickly; ones nobody reads stay behind.',
						'Anti-entropy: in the background, nodes compare what they hold, using trees of hashes called Merkle trees, so only the parts that differ are copied. Cassandra calls this repair, and it’s run regularly, so nothing stays behind for long.',
					],
					example: {
						says: 'A read finds node 2 behind.',
						data: {
							'Node 1': 'version 7',
							'Node 2': 'version 6',
							'read repair': 'version 7 is sent to node 2',
						},
					},
				},
				{
					title: 'Choosing N, W and R',
					show: ['app', 'lb', 'server', ...nodes],
					journey: 'ds-cart-w2',
					set: carts,
					body: [
						'N, W and R are settings. In Cassandra, N is chosen for each keyspace, a group of tables, and W and R for each request: ONE, QUORUM or ALL. LOCAL_QUORUM counts only nodes in the same data centre, so nobody waits for another continent.',
						'DynamoDB, despite the name, gives each piece of data a leader. But it too keeps three copies, in three zones, and confirms a write once two have it. An ordinary read may be a moment old; a strongly consistent read costs twice as much.',
					],
					note: {
						title: 'Nearly always',
						text: 'W + R > N makes old reads rare, not impossible: a sloppy quorum, a write that failed half-way, or clocks that disagree can still let one through. For “always the latest”, read from a leader, or use consensus.',
					},
					compare: {
						title: 'With N = 3',
						rows: [
							[
								'W = 2, R = 2',
								'The usual choice. Reads meet the latest change, and one node can be down.',
							],
							[
								'W = 1, R = 1',
								'The fastest, and works with two nodes down. Reads may be out of date.',
							],
							[
								'W = 3, R = 1',
								'Quick reads that are always current. One node down stops every write.',
							],
							['W = 1, R = 3', 'Quick writes. One node down stops every read.'],
						],
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', ...nodes],
					journey: 'ds-cart-w2',
					set: carts,
					body: [
						'One leader is simplest, and most databases start there. Many leaders and no leader both keep writes working through failures, and both pay for it in conflicts that someone has to settle.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'One leader, with followers',
								'The usual choice: Postgres, MySQL, MongoDB. Simple, no write conflicts. Writes depend on one machine, and a failover.',
							],
							[
								'A leader in each region',
								'Shoppers in many regions who all write, or apps that work offline. Fast changes everywhere; conflicts to settle.',
							],
							[
								'No leader, with quorums',
								'Writes that must always work, on many machines: Cassandra, Riak, ScyllaDB. A slow or broken node doesn’t matter; conflicts and repair do.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the three nodes. Take node 3 down from its details, then node 2 as well, and see when saving a cart stops.',
				journey: 'ds-cart-w2',
				set: carts,
			},
		},
		{
			id: 'hot-shards',
			title: 'Sharding',
			summary:
				'Splitting data by range, by hash or with a lookup table, choosing the key, and the hot shard one big seller makes.',
			steps: [
				{
					title: 'Split by range',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'ds-order-range',
					set: { only: ['ds-order-range'], traffic: 5, copies: { server: 3 } },
					facts: [...busy(shards)],
					body: [
						'One way to split the orders is by ranges of a key. Here, by date: **Shard 1** holds every order from January to June, **Shard 2** every order from July on. A small table says where each range starts. That’s range sharding.',
						'Neighbours stay together, so questions about a range are cheap: last week’s orders all sit in one shard, already in order.',
						'HBase, Google’s Bigtable and CockroachDB split data by range, and split a range in two when it grows too big. MongoDB can split by range or by hash.',
					],
					example: {
						says: 'Where does each order go?',
						data: {
							'an order from 14 March': 'Shard 1: January to June',
							'an order from today, 24 November': 'Shard 2: July onwards',
							'last week’s orders': 'all in Shard 2: one shard to ask',
						},
					},
				},
				{
					title: 'The hot end',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'ds-order-range',
					set: { only: ['ds-order-range'], traffic: 20, copies: { server: 3 } },
					facts: ['succeed', ...busy(shards)],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'But every new order is dated today, so every new order lands in the last range. On sale day, **Shard 2** is sent all 200 orders a second, and can save 150, while shard 1 sits idle.',
						'Any key that only grows does this: dates, times, order numbers. Splitting the newest range doesn’t help for long, because the new last range gets every new order again.',
					],
				},
				{
					title: 'Split by hash',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'order-split',
					set: evenSplit,
					facts: ['succeed', ...busy(shards)],
					body: [
						'Instead, take a key with many values, like the shopper’s number, work out its hash, a scrambled number made from it, and split by that. Shopper 1043 and shopper 1044 land on unrelated shards, so orders spread evenly: 100 a second each. That’s hash sharding.',
						'Here it’s the simplest hash of all, odd or even. Real systems use a proper one, which spreads any kind of key evenly. Cassandra and DynamoDB hash each item’s partition key to choose where it lives.',
						'The cost: neighbours are scattered. Last week’s orders are now on every shard, so that question must ask them all.',
					],
				},
				{
					title: 'Split by a lookup table',
					show: ['app', 'lb', 'server', 'ds-directory', ...shards],
					journey: 'ds-order-lookup',
					current: [['server', 'ds-directory']],
					set: { only: ['ds-order-lookup'], traffic: 20, copies: { server: 3 } },
					facts: ['succeed', 'wait', { busy: 'ds-directory' }],
					warn: 'When the shard directory stops, nobody can find any orders, though every shard is fine. So it’s kept small, copied, and cached in each web server.',
					body: [
						'A third way: keep a table that says where each shopper’s orders live, a **Shard directory**. Every request asks it first, then goes to the right shard.',
						'It’s the most flexible. A big seller can have a shard to itself, and a shopper can be moved by copying their orders and changing one row. Vitess, made at YouTube to split MySQL, can look shards up in tables like this.',
					],
					example: {
						says: 'Which shard has shopper 1043?',
						data: {
							'shopper 1043': 'Shard 1',
							'shopper 1044': 'Shard 1',
							'seller 9': 'a shard of its own',
						},
					},
				},
				{
					title: 'Choose the key by the questions',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'order-split',
					set: evenSplit,
					body: [
						'The shard key decides which questions are cheap. A question that names the key goes to one shard; any other question goes to all of them.',
						'Shoppers mostly look at their own orders, so orders are split by shopper. Sellers mostly look at their own products, so products are split by seller. Each kind of data gets the key of its most common question.',
						'A good key also has many values, each used about as much. Shopper number is good. Country or order status is bad: only a few values, and some far bigger than the rest.',
					],
					example: {
						says: 'Orders split by shopper.',
						data: {
							'Riya’s orders': 'one shard',
							'everyone’s orders today': 'every shard',
							'who bought the Blue kettle': 'every shard',
						},
					},
				},
				{
					title: 'One huge seller',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'order-hot',
					set: bySeller,
					facts: ['succeed', ...busy(shards)],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Now the shop splits orders by seller, so each seller’s dashboard asks one shard. But one big seller has 80% of all orders, so its shard is sent 160 a second, and can save 150. **Shard 1** turns some away, while shard 2 is barely busy. That’s a hot shard.',
						'Hashing doesn’t help: all of one seller’s orders share one key, so one hash, so one shard. It’s known as the celebrity problem, after the famous accounts with millions of followers that do the same to a social network.',
					],
				},
				{
					title: 'Split the big seller’s key',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'ds-order-salted',
					set: { only: ['ds-order-salted'], traffic: 20, copies: { server: 3 } },
					facts: ['succeed', ...busy(shards)],
					body: [
						'The fix is to split that one key. A part number from 0 to 9 is added to the big seller’s key, so its orders spread over ten keys, and so over every shard. Every other seller stays as it was.',
						'Now writes are even again. The cost is reading: the big seller’s dashboard must ask all ten parts and add them up. So it’s done only for the few keys that need it.',
						'When the hot thing is only read, like a product page everyone is sharing, a cache in front usually does the job, with no change to the shards.',
					],
					example: {
						says: 'The big seller’s orders, with a part number added.',
						data: {
							'an order': 'seller 9, part 3: Shard 1',
							'the next order': 'seller 9, part 8: Shard 2',
							'the dashboard': 'reads parts 0 to 9, adds them up',
						},
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'order-split',
					set: evenSplit,
					body: [
						'Whichever way you split, choose the key by the questions you ask most, and watch for the few keys far bigger than the rest.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'By range',
								'Questions over ranges, like dates or names in order. Keys that only grow make a hot end.',
							],
							[
								'By hash',
								'An even spread for most data, and the usual default. Range questions must ask every shard.',
							],
							[
								'By a lookup table',
								'Placing data by hand, like a shard for each big customer. The table must never be down.',
							],
							[
								'Splitting one huge key',
								'A few keys far bigger than the rest: a huge seller, a famous account. Reading them gets harder.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the orders split by seller. Move the traffic up and down, and watch the hot shard fill long before the other.',
				journey: 'order-hot',
				set: bySeller,
			},
		},
		{
			id: 'shard-queries',
			title: 'Questions across shards',
			summary:
				'Questions every shard has to answer, indexes that span the shards, and moving data when you add one.',
			steps: [
				{
					title: 'A question for every shard',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'search-shards',
					current: [
						['server', 'shard-1'],
						['server', 'shard-2'],
					],
					set: { only: ['search-shards'], copies: { server: 3 } },
					facts: ['rate', { load: 'shard-1' }, { load: 'shard-2' }],
					body: [
						'Orders are split by shopper. Now the shop asks: who bought the Blue kettle? The buyers could be on any shard, so every shard is asked, and the web server puts their answers together. That’s called scatter-gather.',
						'Each shard answers every one of these questions: 20 a second each, as many as the shop asks.',
					],
				},
				{
					title: 'More shards don’t help',
					show: ['app', 'lb', 'server', ...shards, 'shard-3'],
					journey: 'ds-search-3',
					set: { only: ['ds-search-3'], copies: { server: 3 } },
					facts: ['wait', { load: 'shard-1' }, { load: 'shard-3' }],
					body: [
						'Add a third shard, and each shard still gets all 20 a second. More shards spread the data and the writes, but not these questions: a new shard gets asked too.',
					],
				},
				{
					title: 'The slowest shard sets the wait',
					show: ['app', 'lb', 'server', ...shards, 'shard-3'],
					journey: 'ds-search-3',
					set: { only: ['ds-search-3'], copies: { server: 3 }, slow: { 'shard-2': 5 } },
					facts: ['wait', { busy: 'shard-2' }],
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'The answer can’t be put together until every shard has replied, so it waits for the slowest. Here, **Shard 2** is having a bad moment, five times slower, and every question waits for it: 237 ms instead of 29.',
						'With ten or a hundred shards, one is nearly always having a bad moment. So questions that ask every shard are slow and costly, and kept rare.',
					],
				},
				{
					title: 'An index on each shard',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'search-shards',
					set: { only: ['search-shards'], copies: { server: 3 } },
					body: [
						'To make the question quicker, each shard keeps an index of its own orders by product. That’s a local index, and it keeps writes simple: each order updates one index, on its own shard.',
						'But a question by product still asks every shard, each now quickly. Indexes in Elasticsearch, MongoDB and Cassandra work like this.',
					],
				},
				{
					title: 'One index for every shard',
					show: ['app', 'lb', 'server', ...shards, 'ds-index'],
					journey: 'ds-search-index',
					draw: ['ds-order-indexed'],
					current: [['server', 'ds-index']],
					set: { only: ['ds-search-index', 'ds-order-indexed'], copies: { server: 3 } },
					facts: [{ load: 'shard-1' }, { load: 'ds-index' }, 'wait'],
					body: [
						'Or keep one index of every order, split by product instead of by shopper: a **Product index**. A question about the Blue kettle goes to the one place that holds the kettle’s list. The shards only see the orders being saved.',
						'The cost moves to writing. Each order is saved in its shopper’s shard, and also added to the product index, which is often on another machine. That’s a global index. DynamoDB’s global secondary indexes work this way, updated a moment later, in the background, so they can be slightly behind.',
					],
				},
				{
					title: 'Adding a shard',
					show: ['app', 'lb', 'server', ...shards, 'shard-3'],
					journey: 'order-split3',
					set: threeShards,
					facts: [...busy(allShards)],
					body: [
						'When the shards fill up, more are added, and some data has to move to the new one, while the shop stays open. Copy the data across, keep copying the changes made meanwhile from the log, switch over in a moment, and only then delete the old copy. That’s resharding.',
						'With the key divided by the number of shards, adding one would move most of the data. So data is often split into many more pieces than there are machines, say 1,000 pieces on 10 machines, and a new machine takes a few whole pieces from each. Elasticsearch, Riak and Couchbase work like that. HBase and MongoDB split a piece in two when it grows too big.',
					],
					example: {
						says: 'Moving shopper 1043’s orders to Shard 3.',
						data: {
							'1. copy': 'every order, while the shop runs',
							'2. catch up': 'changes made during the copy, from the log',
							'3. switch': 'new orders go to Shard 3',
							'4. clean up': 'delete them from Shard 1',
						},
					},
				},
				{
					title: 'Keep together what’s used together',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'order-split',
					set: evenSplit,
					body: [
						'Some things that were easy in one database get hard. Joining orders to shoppers on another shard means two questions, and joining the answers in the web server. A change that touches two shards, like moving stock between sellers, can’t be one simple transaction: it needs the tools of the lesson on sagas and distributed transactions.',
						'So data that’s used together is kept together. An order and its items share the shopper’s key, so they always land on the same shard, and one shard can answer for them.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'search-shards',
					set: { only: ['search-shards'], copies: { server: 3 } },
					body: [
						'Questions by the shard key are cheap. For every other question, choose how much to pay, and where: on every read, or on every write.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Ask every shard',
								'Rare questions, or few shards. Simple, but every shard does the work, and the slowest sets the wait.',
							],
							[
								'A local index on each shard',
								'Writes stay on one shard. Questions by the index still ask every shard, but quickly.',
							],
							[
								'A global index',
								'Frequent questions by something other than the shard key. Writes touch two places, and the index can lag.',
							],
							[
								'A separate copy for reports',
								'Questions across everyone, like best sellers: answered from a copy built for them, kept up to date in the background.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the question asked of all three shards, and shard 2 running slow. Push the traffic up, see which shard fills first, and watch how long every answer waits.',
				journey: 'ds-search-3',
				set: { only: ['ds-search-3'], copies: { server: 3 }, slow: { 'shard-2': 5 } },
			},
		},
		{
			id: 'consistent-hashing',
			title: 'Consistent hashing',
			summary:
				'Adding a machine without moving almost everything: the circle, virtual nodes, copies round the circle, and rendezvous hashing.',
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
						'The **Cache** has grown to three servers, each keeping a third of the answers. To find which one has the Blue kettle, the web server works out a hash of the product’s id, divides it by 3, and takes the remainder.',
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
						'Most requests now miss at once, and they all land on the **Database**.',
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
							'new server': 'at 3 o’clock',
							'it takes': 'only what was between 12 and 3: a quarter',
						},
					},
				},
				{
					title: 'One spot each is uneven',
					show: ['app', 'lb', 'server', ...shards, 'shard-3'],
					journey: 'ds-order-uneven',
					set: { only: ['ds-order-uneven'], traffic: 30, copies: { server: 4 } },
					facts: ['succeed', ...busy(allShards)],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The same circle can share orders between shards. But with one spot each, the gaps between them come out uneven, by chance. Here, **Shard 1**’s arc covers more than half the circle, so it gets more than half the orders, and turns some away, while shard 3 is only 30% busy.',
						'And when a shard leaves, everything it held goes to the one next round the circle, which can find its work doubled at once.',
					],
				},
				{
					title: 'Many spots each: virtual nodes',
					show: ['app', 'lb', 'server', ...shards, 'shard-3'],
					journey: 'order-split3',
					set: threeShards,
					facts: ['succeed', ...busy(allShards)],
					body: [
						'So each server takes many spots round the circle, say 100, each from a hash of its name and a number. They’re called virtual nodes, or vnodes. With many small arcs each, every server ends up with about the same share: here, all three are two-thirds busy.',
						'When a server leaves, its many small arcs go to many different neighbours, so its work is shared out. A bigger machine is simply given more spots. Cassandra and Amazon’s Dynamo both work this way.',
					],
					example: {
						says: 'Each shard’s spots round the circle.',
						data: {
							'Shard 1': '100 spots, scattered all the way round',
							'Shard 2': '100 more, in between',
							'Shard 3': '100 more: each holds about a third',
						},
					},
				},
				{
					title: 'Adding a shard',
					show: ['app', 'lb', 'server', ...shards, 'shard-3'],
					journey: 'order-split3',
					set: threeShards,
					facts: [
						{ busy: 'shard-3' },
						{
							label: 'Orders that move',
							value: '1 in 3',
							hint: 'with remainders, 2 in 3',
						},
					],
					body: [
						'Adding a shard is the same problem as adding a cache server, but moving data is far slower than refilling a cache. Going from two shards to three with remainders, 2 orders in 3 would move. With the circle, only the third that the new shard takes over.',
						'With virtual nodes, **Shard 3** takes a little from both of the others, not everything from one neighbour.',
					],
				},
				{
					title: 'Copies round the circle',
					show: ['app', 'lb', 'server', 'ds-node-1', 'ds-node-2', 'ds-node-3'],
					journey: 'ds-cart-w2',
					set: carts,
					body: [
						'The circle also says where the copies go. A key is kept on the server it lands on and the next ones round the circle, clockwise, skipping any server already chosen, so its three copies are on three different machines.',
						'That’s how Cassandra and Dynamo choose the N nodes for each key, and why nodes with no leader all know where a cart lives: anyone can work it out from the circle. Cassandra can also make sure the three are in different racks or zones.',
					],
					example: {
						says: 'Where cart 1043’s three copies live.',
						data: {
							'its hash lands at': '1 o’clock',
							'first copy': 'Node 2, the next server clockwise',
							'second and third': 'the next two different servers, Node 3 and Node 1',
						},
					},
				},
				{
					title: 'Another way: rendezvous hashing',
					show: ['app', 'lb', 'server', 'cache', 'db'],
					journey: 'look-cache',
					set: { only: ['look-cache'], traffic: 5, copies: { server: 4, cache: 3 } },
					copies: true,
					body: [
						'Rendezvous hashing gets the same result without a circle. For each key, every server gets a score, a hash of the key and the server’s name together, and the highest score wins.',
						'Add a server, and it takes only the keys it now wins. Remove one, and only its keys move, each to its own runner-up, so they spread evenly. The cost is a hash for every server on every lookup: fine for tens of servers, costly for thousands.',
					],
					example: {
						says: 'Which cache server gets product 77? Score each one.',
						data: {
							'server 1': 'hash of “77, server 1”: 412',
							'server 2': 'hash of “77, server 2”: 977, the highest: it goes here',
							'server 3': 'hash of “77, server 3”: 205',
						},
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'cache', 'db'],
					journey: 'look-cache',
					set: { only: ['look-cache'], traffic: 5, copies: { server: 4, cache: 3 } },
					copies: true,
					body: [
						'Consistent hashing is everywhere servers come and go. Cassandra, Riak and Dynamo place data with it. Many Memcached clients use it to pick a cache server. And load balancers use it to keep each user on the same copy: nginx’s hash with consistent, HAProxy’s consistent hashing, and Envoy’s ring hash and Maglev.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Hash, then remainder',
								'A number of servers that never changes. Change it, and almost everything moves.',
							],
							[
								'A circle, one spot each',
								'Rarely used alone: the shares come out uneven.',
							],
							[
								'A circle with virtual nodes',
								'Servers that come and go: caches, databases like Cassandra, load balancers keeping users on one copy.',
							],
							[
								'Rendezvous hashing',
								'Tens of servers, kept simple: an even spread, no circle, and only a leaving server’s keys move.',
							],
						],
					},
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
			summary:
				'Numbering orders when no single database sees them all: counters, ID services, blocks, UUIDs, and IDs built from the time.',
			steps: [
				{
					title: 'Counting, in one database',
					show: ['app', 'lb', 'server', 'db'],
					journey: 'order-save',
					set: { only: ['order-save'], copies: { server: 3 } },
					body: [
						'With one database, numbering orders is easy: it counts 1, 2, 3, and each new order gets the next number. That’s an auto-increment column in MySQL, or an identity column in Postgres. No two can ever be the same.',
						'The numbers are short, they sort in the order the orders came, and new rows always go at the end of the index, which databases handle well.',
					],
					example: {
						says: 'The next order.',
						data: { 'last number': '5520', 'new order': '5521' },
					},
				},
				{
					title: 'Two shards, two counters',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'order-split',
					set: evenSplit,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Split into two shards, each database counts on its own. Both give out number 5521, to two different orders. Now “order 5521” could mean either.',
						'A quick fix: shard 1 counts odd numbers, shard 2 even. MySQL can be set to count in steps of 2 like this. But adding a third shard means changing every counter.',
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
					show: ['app', 'lb', 'server', 'ids', ...shards],
					journey: 'order-ids',
					current: [['server', 'ids']],
					set: idService,
					facts: ['wait', { busy: 'ids' }],
					body: [
						'One fix is an **ID service** that hands out the numbers. Every order asks it first, so numbers stay unique, and in order.',
						'But every order now waits for it. And it’s one counter: two copies would hand out the same numbers.',
					],
				},
				{
					title: 'The ID service breaks',
					show: ['app', 'lb', 'server', 'ids', ...shards],
					journey: 'order-ids',
					set: { ...idService, down: ['ids'] },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'When it stops, no order can get a number, so nobody can place one, even though both shards are fine.',
					],
				},
				{
					title: 'Two ticket servers',
					show: ['app', 'lb', 'server', 'ds-ticket-1', 'ds-ticket-2', ...shards],
					journey: 'ds-order-tickets',
					current: [
						['server', 'ds-ticket-1'],
						['server', 'ds-ticket-2'],
					],
					set: { only: ['ds-order-tickets'], traffic: 20, copies: { server: 3 } },
					facts: ['succeed', ...busy(['ds-ticket-1', 'ds-ticket-2'])],
					body: [
						'Flickr’s fix, described in 2010, was two ID services, which it called ticket servers. Each is a tiny MySQL database: **Ticket server 1** hands out odd numbers, **Ticket server 2** even ones, and the web servers share the asking between them.',
						'The numbers never clash, and each server does half the work. They’re no longer in perfect order, though: one can run a little ahead of the other.',
					],
					example: {
						says: 'Four orders in a row.',
						data: {
							'order 1': 'Ticket server 1: 5521',
							'order 2': 'Ticket server 2: 5522',
							'order 3': 'Ticket server 1: 5523',
							'order 4': 'Ticket server 2: 5524',
						},
					},
				},
				{
					title: 'One ticket server breaks',
					show: ['app', 'lb', 'server', 'ds-ticket-1', 'ds-ticket-2', ...shards],
					journey: 'ds-order-tickets-one',
					set: {
						only: ['ds-order-tickets-one'],
						traffic: 20,
						copies: { server: 3 },
						down: ['ds-ticket-2'],
					},
					facts: ['succeed', { busy: 'ds-ticket-1' }],
					body: [
						'**Ticket server 2** stops. The web servers just ask ticket server 1 for every number, and every order is still numbered: odd numbers only, until the other is back.',
						'Unlike one ID service, there’s no single machine that stops the shop.',
					],
				},
				{
					title: 'Numbers in blocks',
					show: ['app', 'lb', 'server', 'ids', ...shards],
					journey: 'ds-order-blocks',
					set: { only: ['ds-order-blocks'], traffic: 20, copies: { server: 3 } },
					facts: ['wait', { load: 'ids' }, { busy: 'ids' }],
					body: [
						'Or the ID service hands out numbers a thousand at a time. A web server asks for a block, say 5,001 to 6,000, and numbers its next thousand orders by itself, from memory.',
						'The service is asked once per thousand orders: 0.2 times a second, instead of 200, and orders don’t wait for it. If it stops for a while, the servers carry on with the numbers they have left.',
						'The costs: a server that restarts throws away the rest of its block, leaving gaps, and orders on different servers aren’t numbered in exactly the order they came.',
					],
				},
				{
					title: 'Random IDs: UUIDs',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'order-split',
					set: evenSplit,
					facts: ['succeed', 'wait'],
					body: [
						'Or let each web server make its own, with nobody to ask. A random ID, a UUID version 4, is 128 bits long, 122 of them random; a bit is a single 0 or 1. The chance of two ever being the same is so small it’s ignored.',
						'It costs two things. It’s long: 36 characters as text, and twice the size of a 64-bit number, in every row and every index that points to it. And it’s random, so new orders land all over the index instead of at its end, which slows saving once the index no longer fits in memory.',
					],
					example: {
						says: 'A UUID version 4.',
						data: {
							'order ID': '3f2a9c1e-8b47-4d2e-9f61-0c5b7e2d4a18',
							'the 4 starting the third group': 'says it’s version 4: random',
						},
					},
				},
				{
					title: 'Random, but in time order',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'order-split',
					set: evenSplit,
					body: [
						'Newer kinds put the time first, then random bits. A UUID version 7, standard since 2024, starts with the time in milliseconds, followed by 74 random bits. A ULID does the same, written as 26 characters.',
						'Anyone can still make them, and now they sort by when they were made, so new rows go at the end of the index, as with counting.',
					],
					example: {
						says: 'A UUID version 7, made at 10:41 on 24 November 2026.',
						data: {
							'order ID': '01a20bf6-e6a0-7c41-9a3e-5d2b8f6e1c07',
							'01a20bf6-e6a0': 'the time, in milliseconds',
							'the 7': 'the version',
							'the rest': 'random',
						},
					},
				},
				{
					title: 'Built from parts: Snowflake',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'order-split',
					set: evenSplit,
					body: [
						'Twitter’s Snowflake, from 2010, packs an ID into 64 bits, the size of an ordinary number: 41 bits for the time in milliseconds, 10 for the machine’s number, and 12 for a count within that millisecond.',
						'That’s up to 1,024 machines, each making up to 4,096 IDs a millisecond, for about 69 years from a chosen start date. The IDs sort by time, and no machine asks anyone. Discord uses the same idea, and Instagram makes similar IDs inside Postgres, with the shard’s number in place of the machine’s.',
						'Two things must hold. Each machine needs its own number, given out when it starts. And its clock must never go backwards: after a clock correction, Snowflake refuses to make IDs until the time has caught up, or it could repeat one.',
					],
					example: {
						says: 'An order ID, made by machine 7, with the start date 1 January 2024.',
						data: {
							time: '41 bits: 91,449,660,000 ms since the start date',
							machine: '10 bits: 7',
							count: '12 bits: 12, the 13th ID this millisecond',
							'the ID': '383567674736668684',
						},
					},
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', ...shards],
					journey: 'order-split',
					set: evenSplit,
					body: [
						'Ask whether IDs need to be short, sorted by time, or made without asking anyone. Snowflake-style IDs give all three; UUID version 7 gives the last two.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Counting in one database',
								'One database for all the orders. Short, sorted, simple.',
							],
							[
								'One ID service',
								'Short numbers in order, if one service can be kept running. Every order waits for it.',
							],
							[
								'Two ticket servers',
								'Short numbers, roughly in order, and one server can break. Cheap, and proven at Flickr.',
							],
							[
								'Blocks of numbers',
								'Short numbers and few calls to the service. Gaps, and only roughly in order.',
							],
							[
								'UUID version 4',
								'Anyone can make them, with no setup. Long, random, and hard on indexes.',
							],
							[
								'UUID version 7 or ULID',
								'Anyone can make them, and they sort by time. Still 128 bits.',
							],
							[
								'Snowflake-style',
								'64 bits, sorted by time, made anywhere. Needs machine numbers and well-behaved clocks.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the ID service. Push the traffic up until it’s the bottleneck, then take it down.',
				journey: 'order-ids',
				set: idService,
			},
		},
		{
			id: 'consistency',
			title: 'Consistency and CAP',
			summary:
				'What the copies promise readers: CAP while the network is split, speed or freshness the rest of the time, and the promises in between.',
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
					set: { only: ['price-later'], cut: [['db', 'far']] },
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Then the network between the cities breaks. Both are running, but they can’t reach each other. That’s a network partition. To Mumbai, Delhi looks exactly like a copy that’s down: it can’t tell the difference.',
						'Now a price changes in Mumbai. The CAP theorem says that while the network is split, you have to choose: keep the copies agreeing, which is consistency, or keep answering everyone, which is availability. Not both.',
					],
				},
				{
					title: 'Choose to agree: refuse',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'price-wait',
					set: { only: ['price-wait'], cut: [['db', 'far']] },
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
					set: { only: ['price-later'], cut: [['db', 'far']] },
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
					title: 'Not “pick two of three”',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'price-later',
					set: { only: ['price-later'], cut: [['db', 'far']] },
					body: [
						'CAP is often told as “pick two of consistency, availability and partition tolerance”. That’s misleading. Networks break whether you like it or not, so no system spread over machines gets to leave out the P. The choice only exists while a split lasts.',
						'And the words mean less than they sound. Consistency, in CAP, means every read sees the latest change, as if there were one copy. Availability means every copy that’s still running gives a real answer, not an error. CAP’s C isn’t the C in ACID, which is about a database’s rules. Real systems often choose differently for different data: refuse for the stock count, answer for the likes.',
					],
				},
				{
					title: 'When the network is fine: PACELC',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'price-later',
					draw: ['price-wait'],
					set: { only: ['price-later', 'price-wait'] },
					facts: [
						{ wait: 'price-wait', label: 'Wait, copying first' },
						{ wait: 'price-later', label: 'Wait, copying later' },
					],
					body: [
						'Splits are rare. The rest of the time, the choice is speed or freshness: waiting for Delhi makes every change slower, 64 ms instead of 28, and not waiting leaves Delhi a moment behind.',
						'PACELC puts both choices in one name: if there’s a network Partition, choose Availability or Consistency; Else, choose Latency or Consistency. Cassandra and Riak, as they come, choose availability and speed. Google’s Spanner chooses consistency both times, and its writes wait for it.',
					],
				},
				{
					title: 'Strong: as if there were one copy',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'price-wait',
					set: { only: ['price-wait'] },
					facts: ['wait'],
					body: [
						'The strongest promise is called linearizable, or strong consistency. Once a change is confirmed, every read, anywhere, sees it. It behaves as if there were only one copy.',
						'The kettle’s stock count needs this. If shoppers in both cities read “1 left”, both buy, and one is told later there wasn’t one.',
						'It costs waiting: every change must reach enough copies before it’s confirmed, like waiting for Delhi here.',
					],
				},
				{
					title: 'Eventual: they’ll agree, later',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'price-later',
					set: { only: ['price-later'] },
					facts: ['wait'],
					body: [
						'The weakest useful promise is eventual consistency: stop changing something, and after a while every copy agrees. Until then, a read may be out of date.',
						'A review’s like count is fine this way. If Delhi shows 41 likes for a second while Mumbai shows 42, nobody minds, and nobody waits.',
					],
				},
				{
					title: 'The promises in between',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'price-later',
					set: { only: ['price-later'] },
					body: [
						'Most apps want something in between, and each promise has a name. Reading your own writes: Riya always sees her own new address. Monotonic reads: her order never goes from Packed back to Placed.',
						'Causal consistency: if one thing caused another, everyone sees them in that order. On the kettle’s page, an answer never shows up before the question it answers. It’s the strongest promise that still lets each city answer during a split.',
					],
					example: {
						says: 'Questions and answers on the Blue kettle’s page.',
						data: {
							'Sameer asks': 'Does it switch off by itself?',
							'Asha answers': 'Yes, when it boils.',
							'causal consistency': 'nobody sees the answer without the question',
						},
					},
				},
				{
					title: 'Choosing for each request',
					show: ['app', 'lb', 'server', ...nodes],
					journey: 'ds-cart-w2',
					draw: ['ds-cart-w1', 'ds-cart-w3'],
					set: {
						only: ['ds-cart-w1', 'ds-cart-w2', 'ds-cart-w3'],
						copies: { server: 3 },
						slow: { 'ds-node-3': 5 },
					},
					facts: [
						{ wait: 'ds-cart-w1', label: 'Wait, ONE' },
						{ wait: 'ds-cart-w2', label: 'Wait, QUORUM' },
						{ wait: 'ds-cart-w3', label: 'Wait, ALL' },
					],
					body: [
						'Some databases let each request choose. In Cassandra, a read or write can ask for ONE node, a QUORUM, or ALL of them. Here, with **Node 3** running slow, ALL waits for it, and the others don’t. That’s tunable consistency.',
						'DynamoDB reads are eventually consistent unless a read asks to be strongly consistent, at twice the cost. MongoDB lets each write say how many copies must have it, and each read how fresh it must be. So one database can keep the stock count strong and the like counts quick.',
					],
				},
				{
					title: 'Which one when',
					show: ['app', 'lb', 'server', 'db', 'far'],
					journey: 'price-later',
					draw: ['price-wait'],
					set: { only: ['price-later', 'price-wait'] },
					body: [
						'From strongest to weakest: the stronger the promise, the more each change waits, and the less works while the network is split. Choose for each kind of data, not once for the whole shop.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Strong (linearizable)',
								'Stock counts, payments, usernames: anywhere two copies disagreeing costs money. The slowest.',
							],
							[
								'Causal',
								'Comments and replies, chat messages: what caused what stays in order.',
							],
							[
								'Reading your own writes',
								'Profiles, settings, addresses: anything a shopper changes and then looks at.',
							],
							['Monotonic reads', 'Order status, timelines: never going backwards.'],
							[
								'Eventual',
								'Likes, view counts, recommendations: a moment out of date is fine. The fastest.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the link to Delhi cut. Mend it from the copy in Delhi’s details, and watch the waiting changes go through.',
				journey: 'price-later',
				set: { only: ['price-later'], cut: [['db', 'far']] },
			},
		},
		{
			id: 'consensus',
			title: 'Consensus and leaders',
			summary:
				'How a group of machines agrees on one leader, one lock or one setting: Raft, majorities, fencing tokens, leases, and the tools that do it for you.',
			steps: [
				{
					title: 'Deciding once, for everyone',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: group,
					copies: true,
					body: [
						'Some things must be decided once, for everyone: which database is the leader, which worker holds the lock that lets it send the daily sales report, which machines are in the group. If two machines decide differently, you get split brain.',
						'Machines can only agree by sending messages, and messages get lost or delayed, and machines pause or die half-way through. Getting a group to agree anyway is called consensus.',
					],
				},
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
						'The **Database** and its two copies form a group of three. One is the leader, and takes every change. A change counts as saved once a majority, two of the three, has it: the leader and at least one follower.',
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
						'Now the leader stops. Raft, a widely used way to run a vote like this, counts time in terms, numbered 1, 2, 3, each with at most one leader. The leader sends every follower a heartbeat, a small “I’m here”, many times a second.',
						'A follower that hears nothing for a while, a random time such as 150 to 300 ms, starts a new term, votes for itself, and asks the others. Each member votes once per term, and a majority, two votes of three, makes it leader. The random wait means two rarely ask at once.',
						'Until the vote is over, orders fail.',
					],
					example: {
						says: 'Term 8: the leader has gone quiet.',
						data: {
							'follower B':
								'heard nothing for 210 ms: starts term 9, votes for itself',
							'follower C': 'votes for B, its one vote in term 9',
							B: '2 votes of 3: leader for term 9',
						},
					},
				},
				{
					title: 'The leader’s log',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					current: [['db', 'replica']],
					set: group,
					copies: true,
					facts: ['wait'],
					body: [
						'The leader adds every change to its log, a numbered list, and sends it to the followers. Once a majority has stored a change, it’s committed: the leader applies it and answers “saved”. Every member applies the same changes in the same order, so they all end up the same.',
						'Members only vote for a candidate whose log is at least as up to date as their own. A committed change is on a majority, and any two majorities share a member, so a candidate missing it can’t get enough votes. A new leader always has every committed change, and nothing confirmed is lost.',
					],
					example: {
						says: 'The leader’s log, in term 9.',
						data: {
							'#101': 'order 5520: on all 3, committed',
							'#102': 'order 5521: on 2 of 3, committed',
							'#103': 'order 5522: only on the leader so far, not yet',
						},
					},
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
						'The network splits: the leader on one side, both followers on the other. The followers, two of three, elect a new leader. The old leader can’t reach a majority, so it can’t commit anything, and orders sent to it fail: that’s what you see here.',
						'Without that rule, both sides would take orders. Two leaders would sell the same kettle, and the data couldn’t be put back together. With it, there’s never more than one side that can decide.',
					],
				},
				{
					title: 'Odd numbers',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: group,
					copies: true,
					body: [
						'Groups have 3 or 5 members. Three can lose one and carry on; five can lose two. An even number doesn’t help: four still can’t lose two, because two of four isn’t a majority.',
						'A bigger group also means a bigger majority to wait for on every change, and more messages. That’s why groups stay small, even in huge systems.',
					],
				},
				{
					title: 'The old leader wakes up: fencing tokens',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: group,
					copies: true,
					body: [
						'Majorities stop two leaders being elected in one term. But an old leader can still act on old news. Its program pauses for a few seconds, perhaps to clean up its memory, and it wakes still sure it leads, or still holding a lock that has run out.',
						'The fix is a number that only goes up. Each new leader, or each new holder of a lock, gets a higher one: a fencing token. Every write carries it, and the database refuses any token lower than one it has already seen. Raft’s term number works this way.',
					],
					example: {
						says: 'A lock on sending the daily sales report.',
						data: {
							'worker 1': 'gets the lock, token 33, then pauses',
							'the lock runs out': 'worker 2 gets it, token 34, and writes',
							'worker 1 wakes': 'writes with token 33: refused, 34 was seen',
						},
					},
				},
				{
					title: 'Leases',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: group,
					copies: true,
					body: [
						'A lock held for ever would be stuck if its holder died. So it’s given as a lease: it lasts a set time, say 15 seconds, and the holder must renew it before then. If the holder dies, the lease runs out, and someone else can take over.',
						'Kubernetes picks which copy of its controller manager is in charge this way, with a 15-second lease. But leases depend on time, and a paused holder may act after its lease has run out. That’s why they’re used with fencing tokens, not instead of them.',
					],
				},
				{
					title: 'Tools that do it for you',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: group,
					copies: true,
					body: [
						'Consensus is famously hard to get right, so almost nobody writes their own. They use a small store that does it: etcd or Consul, built on Raft, or ZooKeeper, built on a similar method called Zab. Each runs as 3 or 5 machines, and keeps small, important things: who leads, who holds which lock, the settings.',
						'Kubernetes keeps all of its state in etcd. Patroni keeps track of the Postgres leader in one of them. Kafka used ZooKeeper for years, and now runs Raft itself, as KRaft. Databases like CockroachDB and TiDB run Raft inside. Google’s Chubby lock service uses Paxos, an older method; Raft was designed to be easier to understand.',
					],
				},
				{
					title: 'When you need it, and when you don’t',
					show: ['app', 'lb', 'server', 'db', 'replica'],
					journey: 'order-sync',
					set: group,
					copies: true,
					body: [
						'Consensus costs a trip to a majority for every decision, and stops when a majority can’t be reached. Use it for the few things that must be single, and keep everything else out of it.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Which database leads',
								'Needs consensus, or a tool built on it, so two leaders never take writes.',
							],
							[
								'A lock only one may hold',
								'Needs consensus, and a fencing token wherever the work writes.',
							],
							[
								'Settings every machine must share',
								'Keep them in etcd, Consul or ZooKeeper, and let machines watch for changes.',
							],
							[
								'Unique IDs',
								'Not on every request: Snowflake-style IDs need agreement once, on each machine’s number.',
							],
							[
								'Caches, likes, view counts',
								'No: copies a moment out of date are fine, and consensus would only slow them down.',
							],
						],
					},
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

export const distributedTrack: TrackModule = { track: distributed, parts, journeys };
