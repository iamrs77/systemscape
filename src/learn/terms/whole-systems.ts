import type { Term } from '../glossary';

/** Words the whole systems lessons explain. */
export const wholeSystemsTerms: Term[] = [
	{
		id: 'functional-requirements',
		term: 'Functional requirements',
		meaning:
			'What a system must do: the things its users can do with it, like “make a short link” or “send a message”.',
		like: 'The list of rooms you want in a new house.',
		forms: ['functional requirement', 'functional requirements'],
	},
	{
		id: 'non-functional-requirements',
		term: 'Non-functional requirements',
		meaning:
			'How well a system must do its job: how many users, how fast, how much of the time it must work, and how up to date its data must be.',
		like: 'How big the house must be, and how warm in winter.',
		forms: ['non-functional requirement', 'non-functional requirements'],
	},
	{
		id: 'out-of-scope',
		term: 'Out of scope',
		meaning:
			'Agreed to be left out of a design, so the time goes on what matters. What’s in scope is what the design covers.',
		forms: ['out of scope', 'in scope'],
	},
	{
		id: 'trade-off',
		term: 'Trade-off',
		meaning:
			'Giving up some of one thing to get more of another, like freshness for speed. Every design choice has one.',
		like: 'A bigger car carries more, but uses more fuel.',
		forms: ['trade-off', 'trade-offs'],
	},
	{
		id: 'data-model',
		term: 'Data model',
		meaning:
			'What a system keeps, and how the pieces link up: its tables or documents, their fields, and how each is found.',
		forms: ['data model', 'data models'],
	},
	{
		id: 'high-level-design',
		term: 'High-level design (HLD)',
		meaning:
			'The big picture of a system: its parts, what each one does, and how they talk to each other.',
		like: 'A map of a town’s roads, without the inside of any building.',
		forms: ['high-level design', 'hld'],
	},
	{
		id: 'low-level-design',
		term: 'Low-level design (LLD)',
		meaning:
			'The inside of one part: its classes, their fields and methods, the interfaces between them, and its data structures.',
		like: 'The floor plan of one building.',
		forms: ['low-level design', 'lld'],
	},
	{
		id: 'deep-dive',
		term: 'Deep dive',
		meaning: 'Going into one hard part of a design in detail, once the big picture is agreed.',
		forms: ['deep dive', 'deep dives', 'dive deep'],
	},
	{
		id: 'design-pattern',
		term: 'Design pattern',
		meaning:
			'A well-known way of arranging code to solve a common problem, with a name programmers recognise, like “strategy” or “observer”.',
		forms: ['design pattern', 'design patterns'],
	},
	{
		id: 'waiting-room',
		term: 'Virtual waiting room',
		meaning:
			'A holding page for a rush: visitors wait their turn there, and are let into the site a few at a time.',
		like: 'A queue outside a shop on sale day, with a guard letting people in.',
		forms: ['virtual waiting room', 'waiting room'],
	},
	{
		id: 'url-shortener',
		term: 'URL shortener',
		meaning:
			'A service that turns a long web address into a short one, and sends anyone who opens the short one on to the long one. TinyURL and Bitly are well known.',
		forms: ['url shortener', 'url shorteners'],
	},
	{
		id: 'redirect',
		term: 'Redirect',
		meaning:
			'A reply that tells the browser “go to this other address instead”. A 301 says it has moved for good, so the browser may remember; a 302 says it’s only for now.',
		like: 'A sign on a shop door: “We’ve moved to number 12.”',
		forms: ['redirect', 'redirects', 'redirected'],
	},
	{
		id: 'short-code',
		term: 'Short code',
		meaning:
			'The few characters at the end of a short link, like x7Kp2Qa, that stand for one long link.',
		forms: ['short code', 'short codes'],
	},
	{
		id: 'base-62',
		term: 'Base 62',
		meaning:
			'Writing numbers with 62 symbols, 0 to 9, a to z and A to Z, instead of 10 digits. Each character holds far more, so the codes stay short.',
		like: 'Counting with letters as well as digits.',
		forms: ['base 62', 'base62'],
	},
	{
		id: 'hash-collision',
		term: 'Collision',
		meaning:
			'Two different things ending up with the same id or code, like two links whose hashes start with the same 7 characters.',
		like: 'Two people in one class with the same name.',
		forms: ['collision', 'collisions'],
	},
	{
		id: 'conditional-write',
		term: 'Conditional write',
		meaning:
			'A save that only happens if something is true, like “save this code only if nobody has it yet”, checked and saved in one step, so two saves can’t both win.',
		forms: ['conditional write', 'conditional writes'],
	},
	{
		id: 'viral',
		term: 'Going viral',
		meaning:
			'Suddenly being shared and opened by huge numbers of people, usually within hours.',
		forms: ['viral', 'goes viral'],
	},
	{
		id: 'news-feed',
		term: 'News feed',
		meaning:
			'The screen of the newest or best posts from the accounts someone follows, as on Instagram or X.',
		forms: ['news feed', 'news feeds'],
	},
	{
		id: 'follow-graph',
		term: 'Follow graph',
		meaning:
			'Who follows whom, across a whole app, kept so it can be read both ways round. Also called the social graph.',
		forms: ['follow graph', 'social graph'],
	},
	{
		id: 'fan-out-on-read',
		term: 'Fan-out on read',
		meaning:
			'Building a feed when someone opens it: the newest posts of everyone they follow are fetched and merged there and then. Also called the pull model.',
		like: 'Ringing every friend for news each time you want to catch up.',
		forms: ['fan-out on read', 'pull model'],
	},
	{
		id: 'fan-out-on-write',
		term: 'Fan-out on write',
		meaning:
			'Building feeds when a post is made: it’s added at once to every follower’s ready-made feed. Also called the push model.',
		like: 'A friend posting a letter to everyone they know whenever they have news.',
		forms: ['fan-out on write', 'push model'],
	},
	{
		id: 'ranking',
		term: 'Ranking',
		meaning:
			'Putting results in order of how useful or interesting they’re likely to be, not just by time or name. Search engines rank pages; feeds rank posts.',
		forms: ['ranking', 'ranked'],
	},
	{
		id: 'machine-learning',
		term: 'Machine learning',
		meaning:
			'Programs that learn patterns from past data, like which posts people liked, and use them to make guesses about new cases.',
		forms: ['machine learning', 'machine-learning'],
	},
	{
		id: 'sequence-number',
		term: 'Sequence number',
		meaning:
			'A number given to each message in a chat, one after another, so every device shows them in the same order and can spot one that’s missing.',
		like: 'The numbered tickets at a deli counter.',
		forms: ['sequence number', 'sequence numbers'],
	},
	{
		id: 'read-receipt',
		term: 'Read receipt',
		meaning:
			'A small message back to the sender saying a message arrived (delivered) or was opened (read): the ticks in a chat app.',
		forms: ['read receipt', 'read receipts', 'delivery receipt', 'delivery receipts'],
	},
	{
		id: 'presence',
		term: 'Presence',
		meaning: 'Whether someone is online right now, or when they were last seen.',
		forms: ['presence'],
	},
	{
		id: 'signal-protocol',
		term: 'Signal Protocol',
		meaning:
			'A well-studied way of encrypting chats end to end, made by the team behind the Signal app, and used by WhatsApp too.',
		forms: ['signal protocol'],
	},
];
