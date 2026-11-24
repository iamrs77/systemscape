import type { Track } from '@/learn/course';
import type { Conditions } from '@/sim/scenario';
import { type TrackModule, roomy } from './shared';

/** The parts only the security lessons use. */
const parts: TrackModule['parts'] = [
	{
		id: 'se-auth',
		name: 'Login service',
		kind: 'service',
		layer: 'services',
		summary:
			'Checks passwords and signs people in. Checking one password takes about a tenth of a second, on purpose, so stolen password hashes are slow to guess.',
		why: 'Signing in is one job that every part of the shop relies on, and it holds the most sensitive data. So it’s kept in one place, looked after by one team.',
		onFailure:
			'Nobody can log in. People already signed in carry on, until their session or token runs out.',
		scaling:
			'Checking passwords is slow on purpose, so it needs more copies than its traffic suggests. Run more copies, and limit how often anyone can try.',
		capacityPerInstance: 40,
		instances: 1,
		latencyMs: 100,
	},
	{
		id: 'se-sessions',
		name: 'Session store',
		kind: 'database',
		layer: 'data',
		summary:
			'A small, very fast store kept in memory, like Redis. For each session id, it keeps who it belongs to and when it runs out.',
		why: 'Every copy of the web server needs to know who’s signed in, so sessions live where they can all reach them.',
		onFailure:
			'No session can be checked, so every signed-in request fails, and nobody can log in.',
		scaling: 'It’s run with copies of its own, so one breaking doesn’t sign everyone out.',
		capacityPerInstance: 5_000,
		instances: 1,
		latencyMs: 2,
	},
	{
		id: 'se-bot',
		name: 'Login bot',
		kind: 'client',
		layer: 'clients',
		summary:
			'Someone else’s program, trying emails and passwords leaked from other sites, as fast as it can.',
		why: 'Lists of leaked passwords are easy to buy, and people reuse passwords.',
		onFailure: 'It stands for the bot, so the simulation doesn’t make it fail.',
		scaling: 'It runs on other people’s computers, often thousands of them.',
	},
	{
		id: 'se-google',
		name: 'Google sign-in',
		kind: 'external',
		layer: 'external',
		summary:
			'Google’s sign-in service. Shoppers who pick “Continue with Google” prove who they are there, and Google tells the shop who they are.',
		why: 'Shoppers don’t need another password, and the shop never sees their Google password.',
		onFailure:
			'Shoppers who sign in with Google can’t, until it’s back. Those with a password still can.',
		scaling: 'It belongs to Google, so we can’t make it bigger.',
		capacityPerInstance: 100_000,
		instances: 1,
		latencyMs: 50,
	},
	{
		id: 'se-seller',
		name: 'Seller app',
		kind: 'client',
		layer: 'clients',
		summary:
			'The app other shops use to sell through the shop: their products, their orders, their staff.',
		why: 'Many sellers sell through the shop, each running a little shop of their own inside it.',
		onFailure: 'This app stands for the sellers, so the simulation doesn’t make it fail.',
		scaling: 'It runs on each seller’s own phones and computers, so there’s nothing to grow.',
	},
	{
		id: 'se-policy',
		name: 'Policy service',
		kind: 'service',
		layer: 'services',
		summary:
			'Answers “may this person do this?” for every service, from rules kept in one place, like Open Policy Agent.',
		why: 'With the rules in one place, they’re written, tested and changed once, and every service applies them the same way.',
		onFailure:
			'Nothing can be checked, so nothing is allowed: every request that needs a decision is refused.',
		scaling: 'Run more copies. Better still, run the same rules beside each service.',
		capacityPerInstance: 2_000,
		instances: 1,
		latencyMs: 3,
	},
	{
		id: 'se-policy-local',
		name: 'Policy engine',
		kind: 'service',
		layer: 'services',
		summary:
			'The same rules, checked by a copy of the policy engine running beside each copy of the web server, on the same machine. The rules are pushed to it in the background.',
		why: 'Each question is answered without crossing the network, and nothing else has to be up for it.',
		onFailure:
			'It runs on the same machine as its copy of the web server, so it only stops when that copy does.',
		scaling: 'It grows with the web server: every new copy brings its own.',
		capacityPerInstance: 20_000,
		instances: 1,
		latencyMs: 0.5,
	},
	{
		id: 'se-kms',
		name: 'Key management service',
		kind: 'external',
		layer: 'external',
		summary:
			'The cloud’s keeper of encryption keys, like AWS KMS. Its main keys never leave it: you send it a small key to lock or unlock, and it does it inside.',
		why: 'Keys kept next to the data they protect are stolen with it. Here, they’re kept apart, every use is logged, and who may use each key is controlled.',
		onFailure:
			'Nothing encrypted can be unlocked, except with keys already unwrapped and kept in memory.',
		scaling:
			'It belongs to the cloud company, which limits how many calls a second each account may make.',
		capacityPerInstance: 1_000,
		instances: 1,
		latencyMs: 10,
	},
	{
		id: 'se-vault',
		name: 'Secrets manager',
		kind: 'database',
		layer: 'data',
		summary:
			'Keeps the shop’s secrets, like the database password and the payment provider’s key, encrypted, and gives each service only the ones it’s allowed. Like HashiCorp Vault or AWS Secrets Manager.',
		why: 'Secrets written into the code leak with it. Here, they’re kept in one place, every fetch is logged, and changing one changes it everywhere.',
		onFailure:
			'Copies already running keep working, with the secrets they fetched when they started. New copies can’t start.',
		scaling:
			'Services fetch their secrets when they start, not on every request, so it has little to do. It runs with copies of its own.',
		capacityPerInstance: 1_000,
		instances: 1,
		latencyMs: 5,
	},
];

/** The designs the security lessons compare. */
const journeys: TrackModule['journeys'] = [
	{
		id: 'se-login',
		name: 'Log in with a password',
		description:
			'Riya logs in with her email and password. The login service reads her password hash, checks the password against it, slowly on purpose, and starts a session.',
		rps: 5,
		hops: [
			{ from: 'app', to: 'lb', label: 'Log in: Riya’s email and password' },
			{ from: 'lb', to: 'gateway', label: 'Check it' },
			{ from: 'gateway', to: 'se-auth', label: '/login: to the login service' },
			{ from: 'se-auth', to: 'db', label: 'Read Riya’s password hash' },
			{ from: 'se-auth', to: 'se-sessions', label: 'Start a session for Riya' },
		],
	},
	{
		id: 'se-stuff',
		name: 'A bot tries leaked passwords',
		description:
			'A bot tries emails and passwords leaked from other sites, 100 a second, betting that some people reused them. Nothing limits it.',
		rps: 100,
		hops: [
			{ from: 'se-bot', to: 'lb', label: 'Try a leaked email and password' },
			{ from: 'lb', to: 'gateway', label: 'Check it' },
			{ from: 'gateway', to: 'se-auth', label: 'No limit on logins: pass it on' },
			{ from: 'se-auth', to: 'db', label: 'Read the password hash' },
		],
	},
	{
		id: 'se-stuff-limited',
		name: 'A bot tries leaked passwords, limited',
		description:
			'The same bot, but the API gateway limits login tries for each account and each address, and turns most of them away at once.',
		rps: 100,
		hops: [
			{ from: 'se-bot', to: 'lb', label: 'Try a leaked email and password' },
			{ from: 'lb', to: 'gateway', label: 'Check it' },
			{
				from: 'gateway',
				to: 'se-auth',
				label: 'Within the limits: pass it on',
				share: 0.05,
			},
			{ from: 'se-auth', to: 'db', label: 'Read the password hash' },
		],
	},
	{
		id: 'se-session',
		name: 'See an order, signed in with a session',
		description:
			'Riya opens her order. The app sends her session id in a cookie, and the web server looks it up in the session store to find out who she is.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Show order 5521. Cookie: sid=9f2c…' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'se-sessions', label: 'Whose session is 9f2c…?' },
			{ from: 'server', to: 'db', label: 'Read order 5521' },
		],
	},
	{
		id: 'se-token',
		name: 'See an order, signed in with a token',
		description:
			'Riya opens her order. The app sends a signed token saying who she is, and the web server checks the signature itself, without asking anyone.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Show order 5521, with Riya’s token' },
			{ from: 'lb', to: 'server', label: 'Pass it on: the copy checks the signature' },
			{ from: 'server', to: 'db', label: 'Read order 5521' },
		],
	},
	{
		id: 'se-refresh',
		name: 'Get a new access token',
		description:
			'Riya’s access token runs out every 15 minutes. The app swaps her refresh token for a new one, and the login service checks it hasn’t been taken back.',
		rps: 2,
		hops: [
			{ from: 'app', to: 'lb', label: 'My token ran out: here’s my refresh token' },
			{ from: 'lb', to: 'gateway', label: 'Check it' },
			{ from: 'gateway', to: 'se-auth', label: 'Sign a new access token', work: 0.05 },
			{ from: 'se-auth', to: 'se-sessions', label: 'Is this refresh token still good?' },
		],
	},
	{
		id: 'se-google',
		name: 'Log in with Google',
		description:
			'Riya picks “Continue with Google”. She signs in at Google, which sends her back with a one-time code, and the login service swaps the code with Google for a token saying who she is.',
		rps: 2,
		hops: [
			{
				from: 'app',
				to: 'se-google',
				label: 'Sign in at Google, and agree to share your email',
			},
			{ from: 'app', to: 'lb', label: 'Here’s the one-time code Google gave me' },
			{ from: 'lb', to: 'gateway', label: 'Check it' },
			{
				from: 'gateway',
				to: 'se-auth',
				label: '/login/google: to the login service',
				work: 0.05,
			},
			{ from: 'se-auth', to: 'se-google', label: 'Swap the code for an ID token' },
			{ from: 'se-auth', to: 'se-sessions', label: 'Start a session for Riya' },
		],
	},
	{
		id: 'se-gw',
		name: 'Checked once, at the gateway',
		description:
			'Every request passes the API gateway, which checks the token once, then passes the request on, with the shopper’s number, to the service it’s for.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'A request, with Riya’s token' },
			{ from: 'lb', to: 'gateway', label: 'Check the token' },
			{
				from: 'gateway',
				to: 'server',
				label: '/orders: to the web server, as shopper 1042',
				share: 0.7,
			},
			{
				from: 'gateway',
				to: 'delivery',
				label: '/deliveries: to the delivery service, as shopper 1042',
				share: 0.3,
			},
			{ from: 'server', to: 'db', label: 'Read the order' },
		],
	},
	{
		id: 'se-my-order',
		name: 'See an order, by its number',
		description:
			'Riya opens an order by its number. The web server knows who she is from her token, and reads the order.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'GET /orders/5521, with Riya’s token' },
			{ from: 'lb', to: 'server', label: 'Pass it on: shopper 1042' },
			{ from: 'server', to: 'db', label: 'Read the order' },
		],
	},
	{
		id: 'se-seller-orders',
		name: 'A seller sees their orders',
		description:
			'A packer at Lakshmi Stores, one of the sellers, opens the new orders. They may see their own shop’s orders, and nobody else’s.',
		rps: 20,
		hops: [
			{ from: 'se-seller', to: 'lb', label: 'Show Lakshmi Stores’ new orders' },
			{ from: 'lb', to: 'server', label: 'Pass it on: a packer at seller 31' },
			{ from: 'server', to: 'db', label: 'Read the orders, for seller 31 only' },
		],
	},
	{
		id: 'se-policy-ask',
		name: 'See an order, asking a policy service',
		description:
			'Riya opens an order. The web server reads it, then asks the policy service whether she may see it.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'GET /orders/5521, with Riya’s token' },
			{ from: 'lb', to: 'server', label: 'Pass it on: shopper 1042' },
			{ from: 'server', to: 'db', label: 'Read order 5521' },
			{
				from: 'server',
				to: 'se-policy',
				label: 'May shopper 1042 see it? It’s shopper 1042’s',
			},
		],
	},
	{
		id: 'se-policy-beside',
		name: 'See an order, checked beside each copy',
		description:
			'Riya opens an order. The web server reads it, then asks the policy engine running beside it, on the same machine.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'GET /orders/5521, with Riya’s token' },
			{ from: 'lb', to: 'server', label: 'Pass it on: shopper 1042' },
			{ from: 'server', to: 'db', label: 'Read order 5521' },
			{
				from: 'server',
				to: 'se-policy-local',
				label: 'May shopper 1042 see it? (on the same machine)',
			},
		],
	},
	{
		id: 'se-https-new',
		name: 'See a product, on a new connection',
		description:
			'The app opens a new connection: it connects, agrees keys with TLS, then asks. Three round trips over mobile data before the answer arrives.',
		rps: 50,
		hops: [
			{
				from: 'app',
				to: 'lb',
				label: 'Connect, agree keys, then ask: 3 round trips',
				travelMs: 450,
			},
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Read the product' },
		],
	},
	{
		id: 'se-https-open',
		name: 'See a product, on an open connection',
		description:
			'The app asks on the connection it already has open, with keys already agreed. One round trip over mobile data.',
		rps: 50,
		hops: [
			{
				from: 'app',
				to: 'lb',
				label: 'Ask on the open connection: 1 round trip',
				travelMs: 150,
			},
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Read the product' },
		],
	},
	{
		id: 'se-mtls',
		name: 'Where’s my parcel, with mutual TLS inside',
		description:
			'Riya checks her delivery. The web server calls the delivery service over mutual TLS: both show a certificate, and everything between them is encrypted.',
		rps: 20,
		hops: [
			{ from: 'app', to: 'lb', label: 'Where’s my parcel? (HTTPS)' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{
				from: 'server',
				to: 'delivery',
				label: 'Where is delivery 88? Both show certificates',
			},
		],
	},
	{
		id: 'se-at-rest',
		name: 'See an order, encrypted on disk',
		description:
			'Riya opens an order. The database keeps everything encrypted on disk, and decrypts what it reads with a key it unwrapped at the key management service when it started.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Show order 5521' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Read order 5521: decrypted as it’s read' },
			{
				from: 'db',
				to: 'se-kms',
				label: 'Unwrap the disk’s key, only when it starts',
				share: 0.001,
				mode: 'async',
			},
		],
	},
	{
		id: 'se-field',
		name: 'See an address, encrypted by the app',
		description:
			'Riya opens her saved address. The app encrypted it with a data key of its own, so on every read the web server asks the key management service to unwrap that key.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Show my saved address' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Read the address, encrypted' },
			{ from: 'server', to: 'se-kms', label: 'Unwrap its data key' },
		],
	},
	{
		id: 'se-field-kept',
		name: 'See an address, data keys kept a while',
		description:
			'Riya opens her saved address. The web server keeps each unwrapped data key in memory for a few minutes, so only 1 read in 100 asks the key management service.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Show my saved address' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Read the address, encrypted' },
			{
				from: 'server',
				to: 'se-kms',
				label: 'Unwrap a data key, only now and then',
				share: 0.01,
			},
		],
	},
	{
		id: 'se-pay-key',
		name: 'Pay, with a key from the secrets manager',
		description:
			'Riya pays. The web server calls the payment provider with the shop’s API key, which each copy fetched from the secrets manager when it started.',
		rps: 10,
		hops: [
			{ from: 'app', to: 'lb', label: 'Pay for order 5521' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'payments', label: 'Charge ₹1,499, with the shop’s API key' },
			{
				from: 'server',
				to: 'se-vault',
				label: 'Fetch the API key, only when a copy starts',
				share: 0.001,
				mode: 'async',
			},
		],
	},
];

const loggingIn: Conditions = { only: ['se-login'], bigger: roomy };
const stuffed: Conditions = { only: ['se-login', 'se-stuff'], bigger: roomy };
const limited: Conditions = { only: ['se-login', 'se-stuff-limited'], bigger: roomy };
const withSessions: Conditions = { only: ['se-session'], copies: { server: 3 }, bigger: roomy };
const both: Conditions = {
	only: ['se-session', 'se-token'],
	copies: { server: 3 },
	bigger: roomy,
};
const refreshing: Conditions = {
	only: ['se-token', 'se-refresh'],
	copies: { server: 3 },
	bigger: roomy,
};
const atTheDoor: Conditions = {
	only: ['se-gw'],
	traffic: 3,
	copies: { server: 3 },
	bigger: roomy,
};

const ordering: Conditions = { only: ['se-my-order'], copies: { server: 3 }, bigger: roomy };
const selling: Conditions = {
	only: ['se-my-order', 'se-seller-orders'],
	copies: { server: 3 },
	bigger: roomy,
};
const asking: Conditions = { only: ['se-policy-ask'], copies: { server: 3 }, bigger: roomy };

const browsing: Conditions = { only: ['se-https-open'], copies: { server: 3 }, bigger: roomy };
const paying: Conditions = { only: ['se-pay-key'], copies: { server: 3 } };

const shoppers = ['app', 'lb', 'gateway', 'se-auth', 'db'];
const withBot = ['app', 'se-bot', 'lb', 'gateway', 'se-auth', 'db'];
const sessionParts = ['app', 'lb', 'server', 'se-sessions', 'db'];
const orderParts = ['app', 'lb', 'server', 'db'];
const sellerParts = ['app', 'se-seller', 'lb', 'server', 'db'];
const payParts = ['app', 'lb', 'server', 'payments', 'se-vault'];

const security: Track = {
	id: 'security',
	name: 'Security',
	tagline: 'Who you are, what you may do, and keeping data and secrets safe.',
	lessons: [
		{
			id: 'authentication',
			title: 'Authentication',
			summary:
				'Proving who you are: passwords kept safely, sessions or tokens, a second proof, “Log in with Google”, and where the checks happen.',
			steps: [
				{
					title: 'Who’s asking, and the password',
					show: shoppers,
					journey: 'se-login',
					current: [['se-auth', 'db']],
					set: loggingIn,
					facts: ['wait', { busy: 'se-auth' }],
					body: [
						'Before the shop shows Riya her orders, it has to know it’s really Riya asking. Proving who you are is authentication. Deciding what she may then do is authorization, the next lesson.',
						'The oldest proof is a password, checked by the **Login service**. It never keeps the password itself, in plain text: anyone who saw the database would have every shopper’s password, and people reuse them. It keeps a password hash instead: a value worked out from the password that can’t be turned back. A login is checked by working out the same value from what Riya typed, and comparing. A random salt is mixed into each password first, so two people with the same password get different results.',
						'And it’s worked out slowly, on purpose. With a fast method, like SHA-256, someone holding the stolen hashes can try billions of guesses a second on one graphics card; with a slow one, like Argon2id, scrypt or bcrypt, set up as recommended, only thousands. Here each check takes about 100 ms, and the whole login 134 ms.',
					],
					example: {
						says: 'What the database keeps for Riya.',
						data: {
							email: 'riya@example.com',
							'password hash': '$argon2id$v=19$m=19456,t=2,p=1$k3Jd…$Xq9v…',
							'which says':
								'Argon2id, 19 MB of memory, 2 passes, then the salt, then the hash',
							password: 'not kept anywhere',
						},
					},
					note: {
						title: 'Never encrypt passwords',
						text: 'Encryption can be undone with the key, and keys get stolen. A password never needs to be read back, only checked, so a password hash is the right tool.',
					},
				},
				{
					title: 'Leaked passwords, tried by the thousand',
					show: withBot,
					journey: 'se-login',
					draw: ['se-stuff'],
					set: stuffed,
					facts: [
						{ succeed: 'se-login', label: 'Shoppers’ logins that work' },
						{ busy: 'se-auth' },
					],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Other sites get broken into, and their lists of emails and passwords are sold. A **Login bot** tries each pair on the shop, 100 a second, betting that some people used the same password here. That’s credential stuffing.',
						'The slow hash that protects the passwords now works against the shop: the **Login service** can check only 40 a second. It’s swamped, and 6 real shoppers in 10 can’t log in.',
					],
				},
				{
					title: 'Limits, and a second proof',
					show: withBot,
					journey: 'se-login',
					draw: ['se-stuff-limited'],
					current: [['gateway', 'se-auth']],
					set: limited,
					facts: [
						{ succeed: 'se-login', label: 'Shoppers’ logins that work' },
						{ busy: 'se-auth' },
					],
					body: [
						'The **API gateway** limits tries: a few a minute for each account and for each address, and a puzzle when something looks automated. It slows an account down rather than locking it, or anyone could lock Riya out on purpose. Here 1 try in 20 gets through, and every shopper’s login works.',
						'Limits slow guessing down, but a guess can still be right. So the shop also asks for a second proof, something Riya has, not just something she knows: a code from an app on her phone that changes every 30 seconds, or a security key. That’s multi-factor authentication, MFA. A stolen password alone is no longer enough.',
						'Codes sent by SMS help less: a thief can move Riya’s number to a new SIM. Passkeys go further, replacing the password with a key kept on her phone or in her password manager. The shop keeps only a public key, useless to a thief, and the passkey only works on the real shop.example.com, so a fake site can’t trick her out of it.',
					],
					example: {
						says: 'Riya logs in on a new phone.',
						data: {
							'first proof': 'her password',
							'second proof': 'the 6-digit code in her authenticator app, 482 913',
							answer: 'Welcome back, Riya',
						},
					},
				},
				{
					title: 'Staying signed in: a session',
					show: sessionParts,
					journey: 'se-session',
					current: [['server', 'se-sessions']],
					set: withSessions,
					facts: ['wait', { load: 'se-sessions' }],
					body: [
						'Riya shouldn’t type her password on every tap. So when she logs in, the shop makes a session: a long random id, saved in the **Session store** with who it belongs to and when it runs out. The id goes back to the app in a cookie, which comes back with every request.',
						'On every request, the web server looks the id up: 50 lookups a second, each a couple of milliseconds. Signing out, or signing someone out after their phone is stolen, is just deleting the session.',
					],
					example: {
						says: 'The answer to a login, and every request after it.',
						data: {
							'Set-Cookie': 'sid=9f2c…; Secure; HttpOnly; SameSite=Lax',
							'in the session store': '9f2c… is shopper 1042, Riya, until 20:30',
						},
					},
					note: {
						title: 'Cookie settings that matter',
						text: 'Secure: only ever sent over HTTPS. HttpOnly: scripts on the page can’t read it, so an injected script can’t steal it. SameSite=Lax: not sent when another site’s page posts a form or calls the shop in the background, only when Riya follows a link here. That blocks most cross-site request forgery, another site making Riya’s browser act for her.',
					},
				},
				{
					title: 'The session store breaks',
					show: sessionParts,
					journey: 'se-session',
					set: { ...withSessions, down: ['se-sessions'] },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'Every request now depends on the **Session store**. When it goes down, no session can be checked, and every signed-in page fails, though the web servers and the database are fine.',
						'So it’s run with copies, like any store that everything needs: Redis with replicas, say. That’s the price of sessions: one more part on every request’s path, which must never be down.',
					],
				},
				{
					title: 'Tokens: who you are, signed',
					show: orderParts,
					journey: 'se-token',
					current: [['lb', 'server']],
					set: both,
					facts: ['wait', { wait: 'se-session', label: 'Wait, with a session' }],
					body: [
						'The other way is a token. At login, the login service writes down who Riya is and until when, and signs it with a key only it holds. That’s a JSON Web Token, a JWT, and the app sends it with every request.',
						'Any copy of the web server can check the signature itself, with the login service’s public key: no lookup, no store. A page takes 32 ms, against 34 ms with a session. The time saved is small; what matters is one part fewer that every request needs.',
						'What’s inside is only Base64, not encrypted, so anyone holding the token can read it: never put anything private in one. Always check the signature, the expiry and who it was made for, and accept only the signing method you expect, never one that says it needs no signature. In a browser, don’t keep it where any script can read it, like localStorage: an HttpOnly cookie is safer.',
					],
					example: {
						says: 'Riya’s token: three parts, joined by dots.',
						data: {
							header: 'eyJhbGciOiJSUzI1NiIs…, which says it’s signed with RS256',
							'what it says': 'shopper 1042, Riya, runs out at 20:15',
							signature: 'made with the login service’s private key',
						},
					},
				},
				{
					title: 'Taking a token back',
					show: ['app', 'lb', 'gateway', 'server', 'se-auth', 'se-sessions', 'db'],
					journey: 'se-token',
					draw: ['se-refresh'],
					current: [['se-auth', 'se-sessions']],
					set: refreshing,
					facts: [{ load: 'se-sessions' }],
					body: [
						'Tokens have a catch. A token is good until it runs out, wherever it is. If Riya’s phone is stolen, or she changes her password, the shop can’t simply delete it, because nobody looks it up.',
						'So access tokens are kept short-lived, here 15 minutes. With each comes a refresh token that lasts days, is only ever sent to the **Login service**, and is checked against the **Session store**. Swapping it for a new access token is where the shop can say no.',
						'Signing Riya out everywhere now takes at most 15 minutes, and the store is asked 2 times a second, not 50. Shops that need it at once also keep a short list of taken-back tokens, which brings back a lookup.',
					],
					note: {
						title: 'Use each refresh token once',
						text: 'Each swap gives back a new refresh token, and the old one stops working. If an old one is ever used again, it was stolen, and the login service takes back every token in that chain.',
					},
				},
				{
					title: '“Log in with Google”',
					show: ['app', 'se-google', 'lb', 'gateway', 'se-auth', 'se-sessions'],
					journey: 'se-google',
					current: [
						['app', 'se-google'],
						['se-auth', 'se-google'],
					],
					set: { only: ['se-google'], bigger: roomy },
					body: [
						'Many shoppers would rather not make another password. With “Continue with Google”, Riya signs in at **Google sign-in**, which sends her back with a one-time code. The **Login service** swaps the code with Google for an ID token: a JWT, signed by Google, saying who she is. The shop never sees her Google password.',
						'Two standards are underneath. OAuth 2.0 lets one app get limited access to something of yours at another, without your password. Its access token says what the app may do, not who you are, so it’s no proof of login. OpenID Connect adds, on top of it, a standard way to say who you are: the ID token. “Log in with Google”, Apple or Microsoft is OpenID Connect.',
						'At work, the same idea is single sign-on: staff sign in once, at the company’s identity provider, like Okta or Microsoft Entra ID, with OpenID Connect or SAML, an older standard, and every tool trusts it. When someone leaves, one switch locks them out of everything.',
					],
					example: {
						says: 'Riya continues with Google.',
						data: {
							'1. the app opens':
								'Google’s sign-in page, asking for her name and email',
							'2. Google sends her back with': 'a one-time code',
							'3. the login service swaps it for':
								'an ID token: Riya, riya@example.com, signed by Google',
							'4. and checks':
								'Google’s signature, that it was made for this shop, and that it hasn’t run out',
						},
					},
				},
				{
					title: 'Where the checks happen',
					show: ['app', 'lb', 'gateway', 'server', 'delivery', 'db'],
					journey: 'se-gw',
					current: [['lb', 'gateway']],
					set: atTheDoor,
					facts: [{ load: 'gateway' }],
					body: [
						'With several services, each could check the token itself, or the **API gateway** can check it once, at the door: the signature, the expiry, that it was made for this shop. Here it checks 150 a second, then passes each request on with Riya’s shopper number.',
						'That keeps every service simpler. But they shouldn’t trust whatever reaches them: anything inside the network could have sent it. So each still checks that the request really came through the gateway, or checks the token again, which is cheap with a JWT. Trusting nothing just for being inside is called zero trust.',
					],
				},
				{
					title: 'Which one when',
					show: sessionParts,
					journey: 'se-session',
					set: withSessions,
					body: [
						'Most shops use several of these at once: passwords kept as slow hashes with salt, a second proof, “Log in with Google” beside them, and sessions or short tokens to stay signed in.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Sessions in a store',
								'One website or app with its own servers. Signing someone out is instant. Needs a fast, shared store that every request asks.',
							],
							[
								'Signed tokens (JWT)',
								'Many services, or other companies’ APIs, checking who’s asking without a shared store. Keep them short-lived.',
							],
							[
								'Short access tokens with refresh tokens',
								'Tokens that can still be taken back within minutes: the usual way for phone apps and APIs.',
							],
							[
								'Log in with Google (OpenID Connect)',
								'Shoppers who’d rather not make another password. The shop never sees their Google password.',
							],
							[
								'Single sign-on',
								'Staff with many tools: one company account, and one place to lock someone out when they leave.',
							],
							[
								'A second proof (MFA)',
								'Always for staff and admins, and offered to every shopper. Passkeys are the strongest.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the login bot and no limit. Add copies of the login service from its details, and see how many it takes to keep up, compared with one limit at the gateway.',
				journey: 'se-login',
				set: stuffed,
			},
		},
		{
			id: 'authorization',
			title: 'Authorization',
			summary:
				'Who may do what: checking ownership on every request, roles and attributes, least privilege, scopes, policy engines, and keeping customers apart.',
			steps: [
				{
					title: 'Change one number',
					show: orderParts,
					journey: 'se-my-order',
					current: [['server', 'db']],
					set: ordering,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'Riya has logged in, so the shop knows who she is. Every request now raises a second question: may she do this? Seeing her own order, yes; someone else’s, or refunding one, no. That’s authorization.',
						'Riya notices her order’s address ends in /orders/5521, and tries /orders/5522. The server checks her token: she is Riya, signed in. So it reads order 5522 and sends it: Arjun’s name, address and phone number.',
						'Nothing checked that order 5522 was hers. That’s an insecure direct object reference, IDOR: the id in the request is trusted. OWASP’s list of API risks puts it first, as broken object level authorization, BOLA. One script can walk through every order, 5523, 5524 and on. Random ids make guessing harder, but they aren’t the fix.',
					],
					example: {
						says: 'GET /orders/5522, with Riya’s token.',
						data: {
							'who is asking': 'shopper 1042, Riya',
							'order 5522 belongs to': 'shopper 2077, Arjun',
							answer: 'Arjun’s order, with his address and phone number',
						},
					},
				},
				{
					title: 'Check the owner, every time',
					show: orderParts,
					journey: 'se-my-order',
					current: [['server', 'db']],
					set: ordering,
					body: [
						'The fix: on every request, check that the thing asked for belongs to the person asking. The simplest way is to put the owner in the query itself, so the **Database** only finds the order if it’s Riya’s.',
						'Order 5522 isn’t hers, so nothing is found, and the server answers 404, not found, rather than 403, forbidden, so she doesn’t even learn it exists.',
						'Do the check in one shared place that every request passes, and refuse by default: a new page that nobody remembered to protect should be closed, not open.',
					],
					example: {
						says: 'The query, with the owner in it.',
						data: {
							query: 'SELECT * FROM orders WHERE id = 5522 AND shopper_id = 1042',
							found: 'nothing',
							answer: '404 Not found',
						},
					},
				},
				{
					title: 'Roles: what each job may do',
					show: sellerParts,
					journey: 'se-seller-orders',
					draw: ['se-my-order'],
					current: [['se-seller', 'lb']],
					set: selling,
					body: [
						'Other shops now sell through the shop too, with the **Seller app**. At Lakshmi Stores, the owner can do anything, packers see orders and mark them packed, and the accountant sees the payouts. A separate list of permissions for each person would soon be a mess.',
						'Instead, permissions are given to roles, and people are given roles: owner, packer, accountant. That’s role-based access control, RBAC. When a packer leaves, the role is taken away; when packers need something new, the role changes once.',
						'It’s the most common model, simple to understand and to check. Its weakness shows when rules depend on details: 50 roles for 50 slightly different cases is called a role explosion.',
					],
					example: {
						says: 'Lakshmi Stores’ roles.',
						data: {
							owner: 'everything',
							packer: 'see orders, mark them packed',
							accountant: 'see sales and payouts',
							'Meena, a packer':
								'may mark order 5521 packed; may not see the payouts',
						},
					},
				},
				{
					title: 'Attributes: rules about the details',
					show: sellerParts,
					journey: 'se-seller-orders',
					draw: ['se-my-order'],
					set: selling,
					body: [
						'Some rules depend on details of the person, the thing and the moment. A support agent may see orders only from their own region. A refund over ₹10,000 needs a manager. Staff tools only work from the office network. That’s attribute-based access control, ABAC.',
						'It says more than roles can, but the rules are harder to see at a glance, and to test. Most shops start with roles, and add attributes where they need them.',
						'A third model asks how things are connected: you may see a document if it’s shared with you, or with a team you’re in. That’s relationship-based access control, ReBAC. Google built Zanzibar to do it for its own apps, and OpenFGA and SpiceDB are open-source systems based on it.',
					],
					example: {
						says: 'An attribute rule for refunds.',
						data: {
							rule: 'support may refund up to ₹10,000; above that, a manager',
							'Kabir, support, ₹1,499': 'allowed',
							'Kabir, support, ₹24,999': 'refused: needs a manager',
						},
					},
				},
				{
					title: 'Least privilege, and scopes',
					show: sellerParts,
					journey: 'se-seller-orders',
					draw: ['se-my-order'],
					set: selling,
					body: [
						'Whatever the model, give each person and each program what it needs, and nothing more: least privilege. The email worker can read shoppers’ emails, not their payments. The reports service gets a database login that can only read. Staff get admin rights for an hour when they need them, not forever.',
						'Then a stolen password, or a bug in one part, can only do that part’s damage.',
						'The same goes for other apps acting for a shopper. With OAuth 2.0, a parcel-tracking app that Riya connects gets a token with scopes, the list of what it may do: read her orders, but not place or cancel them, and nothing about payments.',
					],
					example: {
						says: 'A parcel-tracking app’s token.',
						data: {
							'acting for': 'Riya',
							scopes: 'orders:read',
							'GET /orders': 'allowed',
							'POST /orders/5521/cancel': '403: not in its scopes',
						},
					},
				},
				{
					title: 'One place for the rules',
					show: ['app', 'lb', 'server', 'se-policy', 'db'],
					journey: 'se-policy-ask',
					current: [['server', 'se-policy']],
					set: asking,
					facts: ['wait', { load: 'se-policy' }],
					body: [
						'As the rules grow, copying them into every service goes wrong: one forgets a rule, another has an old copy. So the rules are taken out of the code, into a policy engine that every service asks.',
						'Open Policy Agent, OPA, is the best known. Its rules are written in its own language, Rego, and kept, tested and reviewed like code. A service says who is asking for what, and gets back allow or deny. Here every page asks the **Policy service**: 50 questions a second, and a page takes 32 ms.',
					],
					example: {
						says: 'The web server asks the policy service.',
						data: {
							asks: 'shopper 1042 wants to see order 5521, which belongs to shopper 1042',
							rule: 'shoppers may see their own orders',
							answer: 'allow',
						},
					},
				},
				{
					title: 'The policy service breaks',
					show: ['app', 'lb', 'server', 'se-policy', 'db'],
					journey: 'se-policy-ask',
					set: { ...asking, down: ['se-policy'] },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'When the **Policy service** goes down, no request can be checked, and every page is refused. That’s on purpose: when a check can’t be made, the answer must be no. That’s failing closed. Failing open, letting everyone in while the check is down, would turn an outage into a break-in.',
						'But now the policy service is something every request needs, like the session store in the last lesson.',
					],
				},
				{
					title: 'The rules beside each copy',
					show: ['app', 'lb', 'server', 'se-policy-local', 'db'],
					journey: 'se-policy-beside',
					current: [['server', 'se-policy-local']],
					set: { only: ['se-policy-beside'], copies: { server: 3 }, bigger: roomy },
					facts: ['succeed', 'wait'],
					body: [
						'So OPA usually runs beside each copy of a service, on the same machine, as a helper called a sidecar, or inside it, as a library. The rules are pushed to every copy in the background, and each question is answered right there, in well under a millisecond.',
						'Now nothing else has to be up for the check, and a page takes 29 ms instead of 32. The rules are still written, tested and changed in one place; only the checking is spread out.',
					],
				},
				{
					title: 'Keeping sellers apart',
					show: sellerParts,
					journey: 'se-seller-orders',
					current: [['server', 'db']],
					set: selling,
					body: [
						'Thousands of sellers share the same servers and the same **Database**. Each is a tenant, and the shop is multi-tenant. Lakshmi Stores must never see another seller’s orders, even by mistake.',
						'The cheapest way is shared tables, with a seller id on every row and in every query. One forgotten filter leaks everything, so Postgres can enforce it itself: with row-level security, a query only ever sees the rows of the seller it runs for.',
						'Tenants share more than tables: one seller’s huge export can slow the database for everyone, a noisy neighbour. Limits for each tenant help, and the biggest can be given a database of their own.',
					],
					compare: {
						title: 'How far apart to keep tenants',
						rows: [
							[
								'Shared tables, a tenant id on every row',
								'Thousands of small tenants: the cheapest and simplest to run. Every query must filter by tenant, and row-level security makes the database do it.',
							],
							[
								'A schema for each tenant',
								'Tables kept apart inside one database. Harder to mix up, but thousands of schemas are slow to change all at once.',
							],
							[
								'A database for each tenant',
								'A few big customers who ask for it: the strongest wall, with their own keys and backups. Costs the most.',
							],
						],
					},
				},
				{
					title: 'Which one when',
					show: sellerParts,
					journey: 'se-my-order',
					draw: ['se-seller-orders'],
					set: selling,
					body: [
						'These work together. A shop checks ownership on every request, gives staff roles, adds attributes for the tricky rules, and keeps the rules in one place once there are many services.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Ownership checks',
								'Always, on every request for someone’s own things. The fix for IDOR.',
							],
							[
								'Roles (RBAC)',
								'Staff and sellers’ teams, where the jobs are clear. The usual starting point.',
							],
							[
								'Attributes (ABAC)',
								'Rules about amounts, places, times or the thing itself, that roles can’t say without exploding.',
							],
							[
								'Relationships (ReBAC)',
								'Sharing, where access follows who is connected to what: documents, folders, teams.',
							],
							[
								'OAuth scopes',
								'Another app acting for a user: it gets only what the user agreed to.',
							],
							[
								'A policy engine',
								'Many services sharing the same rules. Run it beside each service, and fail closed.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the policy service. Take it down from its details, see every page refused, then bring it back.',
				journey: 'se-policy-ask',
				set: asking,
			},
		},
		{
			id: 'encryption-secrets',
			title: 'Encryption and secrets',
			summary:
				'Hashing, encryption and Base64; TLS on the way and inside; encryption at rest with a key management service; secrets kept out of the code; and keeping less.',
			steps: [
				{
					title: 'Hashing, encryption and Base64',
					show: orderParts,
					journey: 'se-https-open',
					set: browsing,
					body: [
						'Three ways of turning data into something else get mixed up all the time, and only one of them hides something you need to read again.',
						'Base64 encoding writes any data as letters, digits and a couple of symbols, so it can travel inside text, like a JWT. Anyone can turn it back, with no key: it hides nothing. A cryptographic hash, like SHA-256, turns data into a short value of fixed size that can’t be turned back: right for checking, like whether a download arrived unchanged, wrong for anything you need to read. For passwords, only a slow one will do, as the authentication lesson showed. Encryption scrambles data with a key, and only someone with the key can turn it back.',
						'So use a cryptographic hash for what you only need to check, encryption for what you need to read again, and never mistake Base64 for either.',
					],
					example: {
						says: '“Riya”, three ways.',
						data: {
							Base64: 'Uml5YQ==, and anyone can turn it back',
							'SHA-256': 'beb0256e…c835a75e, and nobody can turn it back',
							'encrypted with AES-256':
								'72c37023…, and only the key can turn it back',
						},
					},
				},
				{
					title: 'On the way: TLS',
					show: orderParts,
					journey: 'se-https-open',
					current: [['app', 'lb']],
					set: browsing,
					facts: ['wait'],
					body: [
						'Everything between the app and the shop travels as HTTPS: web requests inside TLS. TLS does three things. It proves the server really is shop.example.com, with its certificate. It encrypts everything, so nobody on the café’s Wi-Fi can read Riya’s password: that’s encryption in transit. And it spots anything changed on the way.',
						'Use TLS 1.3, or 1.2: the older versions are retired. Certificates are free from Let’s Encrypt, and renewed automatically. The shop also tells browsers, with a header called HSTS, to only ever use HTTPS for it from then on, so nobody can trick them into plain HTTP.',
					],
				},
				{
					title: 'The cost is the handshake',
					show: orderParts,
					journey: 'se-https-new',
					current: [['app', 'lb']],
					set: {
						only: ['se-https-new', 'se-https-open'],
						copies: { server: 3 },
						bigger: roomy,
					},
					facts: [
						'wait',
						{ wait: 'se-https-open', label: 'Wait, on an open connection' },
					],
					body: [
						'On a new connection, the phone and the load balancer first connect, then agree on keys: the TLS handshake. With TLS 1.3, that’s three round trips before the answer arrives: one to connect, one for TLS, one for the request. At about 150 ms each on mobile data, a page takes 482 ms.',
						'On a connection that’s already open, keys agreed, it’s one round trip: 182 ms. So apps keep connections open and reuse them. TLS 1.2 needed one more round trip; HTTP/3 merges connecting and TLS into one.',
						'The encryption itself is cheap: today’s processors have instructions built for it. Nearly all the cost of HTTPS is in the handshake.',
					],
				},
				{
					title: 'Inside too: mutual TLS',
					show: ['app', 'lb', 'server', 'delivery'],
					journey: 'se-mtls',
					current: [['server', 'delivery']],
					set: { only: ['se-mtls'], copies: { server: 3 }, bigger: roomy },
					body: [
						'The load balancer decrypts each request, and inside the data centre, requests used to travel as plain HTTP, trusted for being inside. But then anyone who breaks into one machine can read every request passing by, or send fake ones.',
						'With mutual TLS, both sides show a certificate. The **Delivery service** checks it’s really the web server calling, the web server checks it’s really the delivery service, and everything between them is encrypted. Nothing is trusted just for being inside: zero trust again.',
						'Giving every service a certificate, and renewing them all, is a lot of work. So a service mesh, like Istio or Linkerd, does it: a helper beside each service makes the connections, with short-lived certificates renewed automatically.',
					],
				},
				{
					title: 'Where it’s kept: at rest',
					show: ['server', 'db', 'se-kms'],
					journey: 'se-at-rest',
					current: [['db', 'se-kms']],
					set: { only: ['se-at-rest'], copies: { server: 3 }, bigger: roomy },
					body: [
						'Data also needs protecting where it’s kept: the database’s disks, its backups, and copies of them. Encrypted at rest, a stolen disk or a lost backup is useless. Cloud databases do it with one setting, and the app never notices: the **Database** decrypts what it reads, with a key it unwraps when it starts.',
						'The keys are kept apart from the data, in a **Key management service**, like AWS KMS, Google Cloud KMS or Azure Key Vault. Its main keys never leave it, and can be kept in hardware security modules; every use is logged, and who may use each key is controlled.',
						'Know what it doesn’t do: anyone who reaches the data through the app, or logs in to the database, sees it decrypted, just as the app does. It protects against stolen disks, not stolen passwords.',
					],
				},
				{
					title: 'Envelope encryption',
					show: ['app', 'lb', 'server', 'db', 'se-kms'],
					journey: 'se-field',
					current: [['server', 'se-kms']],
					set: {
						only: ['se-field', 'se-field-kept'],
						copies: { server: 3 },
						bigger: roomy,
					},
					facts: [
						'wait',
						{ wait: 'se-field-kept', label: 'Wait, keeping data keys a while' },
					],
					body: [
						'Some data is worth encrypting in the app itself, before it’s saved: phone numbers, addresses, ID numbers. Then even a database admin, or a copy of the database, sees only scrambled bytes.',
						'But a KMS only encrypts small amounts itself, and its main key never leaves it. So each record is encrypted in the app with a data key of its own, and the KMS encrypts that data key with the main key, to be kept beside the record. Data in an envelope, the envelope’s key locked away: envelope encryption. Changing the main key only means re-wrapping the small data keys.',
						'Reading Riya’s address means asking the **Key management service** to unwrap its data key, across the network, and a KMS limits how many calls each account may make. So apps keep unwrapped data keys in memory for a few minutes: pages take 32 ms instead of 43, but keys sit in memory longer, for anyone who breaks in to find.',
					],
					example: {
						says: 'Riya’s address, as it’s saved.',
						data: {
							address: '9c41e07a…, encrypted with a data key',
							'data key': 'AQIDAHh…, encrypted with the main key',
							'main key': 'never leaves the key management service',
						},
					},
				},
				{
					title: 'Secrets: never in the code',
					show: ['app', 'lb', 'server', 'payments'],
					journey: 'se-pay-key',
					current: [['server', 'payments']],
					set: paying,
					tags: [{ text: 'A problem', tone: 'warn' }],
					body: [
						'The shop has secrets: the database password, the **Payment provider**’s API key, the key that signs login tokens. The easy mistake is to write them into the code, or a settings file next to it.',
						'Then everyone who can read the code has them, and so does every copy of it, forever: git keeps every old version, so deleting the line later doesn’t help. Bots search public repositories for keys all the time. A leaked key has to be changed at once, and everything that used it checked.',
					],
					example: {
						says: 'In the repository, for everyone to see.',
						data: {
							'settings.py': 'PAYMENT_KEY = live_7f3a9c…',
							'anyone with the code': 'can call the payment provider as the shop',
						},
					},
				},
				{
					title: 'A secrets manager, and rotation',
					show: payParts,
					journey: 'se-pay-key',
					current: [['server', 'se-vault']],
					set: { ...paying, down: ['se-vault'] },
					facts: ['succeed'],
					body: [
						'Instead, secrets live in a secrets manager, like HashiCorp Vault, AWS Secrets Manager or Google Secret Manager, encrypted, with every fetch logged. The code only names the secret it needs. Each copy proves which service it is, and gets only that service’s secrets.',
						'Copies fetch their secrets when they start, not on every request. So even now, with the **Secrets manager** down, every payment works; only new copies can’t start. It runs with copies of its own.',
						'Secrets are also rotated: changed on a schedule, and at once after a leak, with old and new both working for a while so nothing breaks. Vault can even make each copy its own database login that expires by itself. And scanners, like GitHub’s secret scanning or gitleaks, catch keys on their way into the repository.',
					],
				},
				{
					title: 'Keep less in the first place',
					show: ['app', 'lb', 'server', 'payments'],
					journey: 'se-pay-key',
					current: [['server', 'payments']],
					set: paying,
					body: [
						'Data you never keep can’t leak. The shop doesn’t keep card numbers at all: the **Payment provider** gives it a token instead, which only works for this shop. That’s tokenisation. In India, RBI rules have stopped shops, and even payment providers, keeping card numbers since 2022: only the card networks and banks may.',
						'Collect only what you need, delete it when you no longer need it, and keep it out of logs: no passwords, tokens or full card numbers. Laws like India’s Digital Personal Data Protection Act and Europe’s GDPR ask for much of this. Less data is also less to encrypt, back up and explain after a breach.',
					],
					example: {
						says: 'What the shop keeps about Riya’s card.',
						data: {
							'card number': 'never',
							token: 'tok_9Hq2…, which only works for this shop',
							'shown to Riya': 'Visa ending 4242',
						},
					},
				},
				{
					title: 'Which one when',
					show: payParts,
					journey: 'se-pay-key',
					set: paying,
					body: [
						'Each protects something different, so a shop uses all of them: TLS on the way, encryption where data is kept, a slow hash for passwords, and secrets kept out of the code.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							['Base64', 'Data that must travel as text. Hides nothing.'],
							[
								'A slow, salted hash',
								'Passwords, and anything else you only need to check: Argon2id, scrypt or bcrypt.',
							],
							['TLS', 'Everything between the apps and the shop, always: HTTPS.'],
							[
								'Mutual TLS',
								'Services calling each other inside, so each knows who’s calling. A service mesh makes it easy.',
							],
							[
								'Encryption at rest',
								'Every disk, database and backup. One setting in the cloud, so always on.',
							],
							[
								'Envelope encryption in the app',
								'The most sensitive fields, so even database admins can’t read them. Keys from a KMS.',
							],
							[
								'A secrets manager',
								'Every password and key the services use, rotated. Never in the code.',
							],
							[
								'Keeping less',
								'Anything you don’t truly need. The safest data is data you don’t have.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with payments. Take the secrets manager down from its details, and see that paying still works. Then take the payment provider down, and compare.',
				journey: 'se-pay-key',
				set: paying,
			},
		},
	],
};

export const securityTrack: TrackModule = { track: security, parts, journeys };
