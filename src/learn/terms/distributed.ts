import type { Term } from '../glossary';

/** Words the distributed lessons explain. */
export const distributedTerms: Term[] = [
	{
		id: 'asynchronous-replication',
		term: 'Asynchronous replication',
		meaning:
			'The leader says a change is saved as soon as it has it, and sends it to its followers afterwards. Fast, but a failover can lose the last few changes.',
		forms: ['asynchronous replication'],
	},
	{
		id: 'synchronous-replication',
		term: 'Synchronous replication',
		meaning:
			'The leader waits until a follower confirms it has a change before saying it’s saved. Nothing confirmed is lost, but every change waits longer.',
		forms: ['synchronous replication'],
	},
	{
		id: 'semi-synchronous',
		term: 'Semi-synchronous replication',
		meaning:
			'The leader waits for any one of several followers to confirm each change, and sends it to the rest later. Safe, and one follower can break without stopping writes.',
		forms: ['semi-synchronous', 'semi-synchronous replication'],
	},
	{
		id: 'replication-lag',
		term: 'Replication lag',
		meaning:
			'How far a follower is behind its leader: the changes it hasn’t made yet. Usually well under a second, sometimes much more.',
		like: 'A newspaper printed this morning: true, but not up to the minute.',
		forms: ['replication lag'],
	},
	{
		id: 'monotonic-reads',
		term: 'Monotonic reads',
		meaning:
			'A promise that once you’ve seen something, you never see an older version of it, even if your reads go to different copies.',
		forms: ['monotonic reads'],
	},
	{
		id: 'point-in-time-recovery',
		term: 'Point-in-time recovery',
		meaning:
			'Putting a database back as it was at a chosen moment, by restoring a backup and replaying its log of changes up to that moment.',
		forms: ['point-in-time recovery'],
	},
	{
		id: 'delayed-replica',
		term: 'Delayed replica',
		meaning:
			'A follower kept behind the leader on purpose, say an hour, so a recent mistake can be undone from it.',
		forms: ['delayed replica', 'delayed replicas'],
	},
	{
		id: 'fencing',
		term: 'Fencing',
		meaning:
			'Making sure a machine that has been replaced can do no more harm: switching it off, or refusing anything it writes.',
		forms: ['fencing'],
	},
	{
		id: 'fencing-token',
		term: 'Fencing token',
		meaning:
			'A number that goes up each time a new leader or lock holder takes over. Every write carries it, and writes with an older number are refused.',
		like: 'A ticket number at a counter: once 34 has been called, 33 is too late.',
		forms: ['fencing token', 'fencing tokens'],
	},
	{
		id: 'multi-leader',
		term: 'Multi-leader replication',
		meaning:
			'Several copies each take changes, usually one in each region, and copy them to each other in the background.',
		forms: ['multi-leader', 'multi-leader replication'],
	},
	{
		id: 'write-conflict',
		term: 'Write conflict',
		meaning:
			'Two copies took different changes to the same thing at about the same time, and something has to decide which one stays.',
		forms: ['write conflict', 'write conflicts'],
	},
	{
		id: 'last-write-wins',
		term: 'Last write wins',
		meaning:
			'Settling a write conflict by keeping the change with the latest time on it. Simple, but the other change is lost without a word.',
		forms: ['last write wins'],
	},
	{
		id: 'crdt',
		term: 'CRDT',
		meaning:
			'A kind of data, like a counter or a set, built so that changes made on different copies can always be merged, with no conflicts.',
		forms: ['crdt', 'crdts'],
	},
	{
		id: 'ntp',
		term: 'NTP',
		meaning:
			'The Network Time Protocol: how computers set their clocks from time servers over the network. It keeps them close, never exactly the same.',
		forms: ['ntp'],
	},
	{
		id: 'leaderless',
		term: 'Leaderless replication',
		meaning:
			'Every copy takes changes, and there’s no leader. Each change is sent to several copies, and counts once enough of them confirm.',
		forms: ['leaderless', 'leaderless replication'],
	},
	{
		id: 'quorum',
		term: 'Quorum',
		meaning:
			'Enough copies that any two such groups share at least one: with 3 copies, 2. A change confirmed by a quorum, and a read from a quorum, always meet.',
		like: 'The smallest number of members a club needs at a meeting before it can decide anything.',
		forms: ['quorum', 'quorums'],
	},
	{
		id: 'sloppy-quorum',
		term: 'Sloppy quorum',
		meaning:
			'When the usual copies can’t be reached, a change is saved on other healthy machines instead, and handed back later. Writes always work, but reads may miss them for a while.',
		forms: ['sloppy quorum', 'sloppy quorums'],
	},
	{
		id: 'hinted-handoff',
		term: 'Hinted handoff',
		meaning:
			'While a copy is down, another machine keeps the changes it missed as notes, called hints, and hands them over when it’s back.',
		like: 'A neighbour taking in your parcels while you’re away.',
		forms: ['hinted handoff'],
	},
	{
		id: 'read-repair',
		term: 'Read repair',
		meaning:
			'When a read finds a copy with an older version, the newer one is sent to it, so copies catch up as they’re read.',
		forms: ['read repair'],
	},
	{
		id: 'anti-entropy',
		term: 'Anti-entropy',
		meaning:
			'Copies comparing what they hold in the background, and copying over whatever differs, so even data nobody reads catches up.',
		forms: ['anti-entropy'],
	},
	{
		id: 'merkle-tree',
		term: 'Merkle tree',
		meaning:
			'A tree of hashes: each leaf is a hash of some of the data, and each branch a hash of those below it. Two copies compare the tops first, and only follow the branches that differ.',
		forms: ['merkle tree', 'merkle trees'],
	},
	{
		id: 'vector-clock',
		term: 'Vector clock',
		meaning:
			'A counter for each copy, carried with every version, so a database can tell whether one change came after another, or whether they were made without seeing each other and clash.',
		forms: ['vector clock', 'vector clocks'],
	},
	{
		id: 'range-sharding',
		term: 'Range sharding',
		meaning:
			'Splitting data into shards by ranges of a key, like dates or names in order. Ranges are quick to read, but a key that only grows sends every new item to the last shard.',
		forms: ['range sharding'],
	},
	{
		id: 'hash-sharding',
		term: 'Hash sharding',
		meaning:
			'Splitting data into shards by a hash of a key, which spreads it evenly, but scatters neighbours, so range questions must ask every shard.',
		forms: ['hash sharding'],
	},
	{
		id: 'shard-key',
		term: 'Shard key',
		meaning:
			'The part of each item used to choose its shard, like the shopper’s number. Questions that name it go to one shard; the rest go to all of them.',
		forms: ['shard key', 'shard keys', 'partition key', 'partition keys'],
	},
	{
		id: 'shard-directory',
		term: 'Shard directory',
		meaning:
			'A lookup table that says which shard holds each item, or each customer. Flexible, but every request depends on it.',
		forms: ['shard directory'],
	},
	{
		id: 'celebrity-problem',
		term: 'Celebrity problem',
		meaning:
			'One account or key so popular that it swamps whatever handles it: the shard holding it, or the work of copying its posts to millions of followers.',
		forms: ['celebrity problem'],
	},
	{
		id: 'scatter-gather',
		term: 'Scatter-gather',
		meaning:
			'Sending one question to every shard, then putting their answers together. Every shard does the work, and the slowest sets the wait.',
		forms: ['scatter-gather'],
	},
	{
		id: 'local-index',
		term: 'Local index',
		meaning:
			'An index each shard keeps for its own data only. Writes stay on one shard, but a question by that index still asks every shard.',
		forms: ['local index', 'local indexes'],
	},
	{
		id: 'global-index',
		term: 'Global index',
		meaning:
			'One index over the data of every shard, split by its own key. Questions go to one place, but every write also updates the index, often a moment later.',
		forms: [
			'global index',
			'global indexes',
			'global secondary index',
			'global secondary indexes',
		],
	},
	{
		id: 'resharding',
		term: 'Resharding',
		meaning:
			'Moving data between shards, usually to add a new one, while the app keeps running: copy, catch up, switch over, then clean up.',
		forms: ['resharding'],
	},
	{
		id: 'virtual-node',
		term: 'Virtual node',
		meaning:
			'One of many spots a single server takes round the consistent hashing circle, so each server holds an even share, and a leaving server’s work spreads out.',
		forms: ['virtual node', 'virtual nodes', 'vnode', 'vnodes'],
	},
	{
		id: 'rendezvous-hashing',
		term: 'Rendezvous hashing',
		meaning:
			'Choosing a server for each key by scoring every server with a hash of the key and the server’s name, and taking the highest. Only a leaving server’s keys move.',
		forms: ['rendezvous hashing'],
	},
	{
		id: 'auto-increment',
		term: 'Auto-increment',
		meaning:
			'A column the database fills in itself by counting: 1, 2, 3. Unique and in order, as long as one database does all the counting.',
		forms: ['auto-increment'],
	},
	{
		id: 'ticket-server',
		term: 'Ticket server',
		meaning:
			'A tiny database that only hands out unique numbers. Two of them, one giving odd numbers and one even, never clash.',
		like: 'The ticket machine at a deli counter.',
		forms: ['ticket server', 'ticket servers'],
	},
	{
		id: 'ulid',
		term: 'ULID',
		meaning:
			'An ID of 26 characters: the time it was made, then random characters. Anyone can make one, and they sort by time.',
		forms: ['ulid', 'ulids'],
	},
	{
		id: 'snowflake',
		term: 'Snowflake ID',
		meaning:
			'A 64-bit ID built from the time, the machine’s number and a count, first made at Twitter. Made anywhere, unique, and sorted by time.',
		forms: ['snowflake id', 'snowflake ids', 'snowflake-style'],
	},
	{
		id: 'network-partition',
		term: 'Network partition',
		meaning:
			'The network between machines breaks, so each side keeps running but can’t reach the other.',
		like: 'A bridge closing: both towns carry on, but nobody can cross.',
		forms: ['network partition', 'network partitions', 'partition tolerance'],
	},
	{
		id: 'pacelc',
		term: 'PACELC',
		meaning:
			'CAP, extended: during a network Partition, choose Availability or Consistency; Else, the rest of the time, choose Latency or Consistency.',
		forms: ['pacelc'],
	},
	{
		id: 'linearizable',
		term: 'Linearizable',
		meaning:
			'The strongest promise copies can make: once a change is confirmed, every read anywhere sees it, as if there were only one copy.',
		forms: ['linearizable', 'strong consistency'],
	},
	{
		id: 'causal-consistency',
		term: 'Causal consistency',
		meaning:
			'A promise that if one thing caused another, like a question and its answer, everyone sees them in that order.',
		forms: ['causal consistency'],
	},
	{
		id: 'tunable-consistency',
		term: 'Tunable consistency',
		meaning:
			'Choosing for each read or write how many copies must answer: fewer for speed, more for freshness.',
		forms: ['tunable consistency'],
	},
	{
		id: 'consensus',
		term: 'Consensus',
		meaning:
			'Getting a group of machines to agree on one thing, like who leads, even when some are down and messages get lost.',
		forms: ['consensus'],
	},
	{
		id: 'majority',
		term: 'Majority',
		meaning:
			'More than half of a group: 2 of 3, or 3 of 5. Two majorities of the same group always share at least one member.',
		forms: ['majority'],
	},
	{
		id: 'raft',
		term: 'Raft',
		meaning:
			'A widely used method for consensus: members elect a leader by majority vote, and the leader’s log of changes counts once a majority has it.',
		forms: ['raft'],
	},
	{
		id: 'paxos',
		term: 'Paxos',
		meaning:
			'The older, famously hard to follow method for consensus that Raft was designed to replace with something easier to understand.',
		forms: ['paxos'],
	},
	{
		id: 'lease',
		term: 'Lease',
		meaning:
			'A lock or a leadership that lasts a set time, and must be renewed before it runs out. If its holder dies, someone else can take over when it ends.',
		like: 'Renting a flat: if you stop renewing, it goes to someone else.',
		forms: ['lease', 'leases'],
	},
	{
		id: 'etcd',
		term: 'etcd',
		meaning:
			'A small, very reliable store, run on 3 or 5 machines that agree using Raft. Kubernetes keeps all of its state in it.',
		forms: ['etcd'],
	},
	{
		id: 'zookeeper',
		term: 'ZooKeeper',
		meaning:
			'A small, very reliable store for leaders, locks and settings, run on 3 or 5 machines that agree with each other. Older than etcd, and still widely used.',
		forms: ['zookeeper'],
	},
	{
		id: 'consul',
		term: 'Consul',
		meaning:
			'A tool that keeps track of which services are running where, with a small, reliable store that agrees using Raft.',
		forms: ['consul'],
	},
];
