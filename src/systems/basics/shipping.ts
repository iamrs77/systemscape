import type { Track } from '@/learn/course';
import type { Conditions } from '@/sim/scenario';
import { type TrackModule, roomy, copies } from './shared';

/** The parts only the shipping lessons use. */
const parts: TrackModule['parts'] = [
	{
		id: 'sh-tests',
		name: 'Test runner',
		kind: 'client',
		layer: 'clients',
		summary:
			'Runs the shop’s automated tests, on a developer’s laptop or on a build server, for every change.',
		why: 'Checking every change by hand would take days. Tests check it in minutes, every time, the same way.',
		onFailure: 'It stands for the tests, so the simulation doesn’t make it fail.',
		scaling: 'Split the tests over several machines, to run side by side.',
	},
	{
		id: 'sh-loadgen',
		name: 'Load generator',
		kind: 'client',
		layer: 'clients',
		summary:
			'A program like k6 or JMeter that pretends to be thousands of shoppers at once, to find out how much the shop can take.',
		why: 'Better to find the breaking point on a quiet Tuesday than during the Diwali sale.',
		onFailure: 'It stands for the test, so the simulation doesn’t make it fail.',
		scaling: 'For a big test, it runs on many machines at once.',
	},
	{
		id: 'sh-new',
		name: 'New version',
		kind: 'service',
		layer: 'services',
		summary:
			'A copy of the web server running the new version, given a small share of the shoppers first: a canary.',
		why: 'If the new version has a bug the tests missed, only a few shoppers meet it, and it’s rolled back before anyone else does.',
		onFailure:
			'Only its small share of shoppers get errors. It’s taken out, and the old version takes everyone.',
		scaling:
			'While it looks healthy, its share grows, from 5% to 25% to half, then everyone, as the old copies are replaced.',
		capacityPerInstance: 100,
		instances: 1,
		latencyMs: 10,
	},
	{
		id: 'sh-blue',
		name: 'Blue servers',
		kind: 'service',
		layer: 'services',
		summary:
			'A full set of web servers, running the version that was live before. With blue-green deploys, the load balancer sends everyone to one set or the other.',
		why: 'The old version stays running and ready, so going back is one switch at the load balancer.',
		onFailure:
			'If it’s the live set, nobody can shop until the load balancer switches to green.',
		scaling: 'Each set must be big enough to carry everyone alone.',
		capacityPerInstance: 100,
		instances: 3,
		latencyMs: 10,
	},
	{
		id: 'sh-green',
		name: 'Green servers',
		kind: 'service',
		layer: 'services',
		summary:
			'A second full set of web servers, where the new version goes. It’s tested there, then the load balancer sends everyone to it at once.',
		why: 'The new version is tried on real servers, set up exactly like the live ones, before any shopper sees it.',
		onFailure:
			'If it’s the live set, nobody can shop until the load balancer switches back to blue.',
		scaling: 'Each set must be big enough to carry everyone alone.',
		capacityPerInstance: 100,
		instances: 3,
		latencyMs: 10,
	},
];

/** The designs the shipping lessons compare. */
const journeys: TrackModule['journeys'] = [
	{
		id: 'sh-unit',
		name: 'Run the unit tests',
		description:
			'The test runner checks small pieces of the web server’s code, one at a time, with nothing else involved.',
		rps: 10,
		hops: [{ from: 'sh-tests', to: 'server', label: 'Check one small piece of its code' }],
	},
	{
		id: 'sh-integration',
		name: 'Run the integration tests',
		description:
			'The test runner checks the web server’s code against a real database, started just for the tests.',
		rps: 10,
		hops: [
			{ from: 'sh-tests', to: 'server', label: 'Check the code with a real database' },
			{ from: 'server', to: 'db', label: 'Save a test order, read it back' },
		],
	},
	{
		id: 'sh-e2e',
		name: 'Run the end-to-end tests',
		description:
			'A robot uses the app like a shopper: it finds the Blue kettle, adds it to the cart and pays, with the payment provider in test mode.',
		rps: 2,
		hops: [
			{
				from: 'sh-tests',
				to: 'app',
				label: 'Tap through like a shopper: find, add, pay',
			},
			{ from: 'app', to: 'lb', label: 'Place the order' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Save the order' },
			{ from: 'server', to: 'payments', label: 'Charge ₹1,499, in test mode' },
		],
	},
	{
		id: 'sh-track',
		name: 'See an order and its delivery',
		description:
			'Riya opens her order. The web server reads it, and asks the delivery service when the parcel will arrive.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Show order 5521' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Read order 5521' },
			{ from: 'server', to: 'delivery', label: 'Where is delivery 88? Expects an eta' },
		],
	},
	{
		id: 'sh-contract',
		name: 'Check the delivery service keeps its promise',
		description:
			'In the delivery team’s build, the test runner replays what the web server expects of the delivery service, against the real thing.',
		rps: 2,
		hops: [
			{
				from: 'sh-tests',
				to: 'delivery',
				label: 'Replay the contract: GET /deliveries/88 answers with an eta',
			},
		],
	},
	{
		id: 'sh-load',
		name: 'A load test',
		description:
			'The load generator pretends to be shoppers opening products, more and more of them, to find how much the shop can take.',
		rps: 50,
		hops: [
			{ from: 'sh-loadgen', to: 'lb', label: 'Open a product, as a pretend shopper' },
			{ from: 'lb', to: 'server', label: 'Pass it to a copy' },
			{ from: 'server', to: 'db', label: 'Read the product' },
		],
	},
	{
		id: 'sh-canary',
		name: 'Look at a product, during a canary',
		description:
			'A new version is going out. The load balancer sends 5% of requests to a copy running it, and the rest to the current version.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Ask for the product page' },
			{ from: 'lb', to: 'server', label: '95%: the current version', share: 0.95 },
			{ from: 'lb', to: 'sh-new', label: '5%: the new version', share: 0.05 },
			{ from: 'server', to: 'db', label: 'Read the product' },
			{ from: 'sh-new', to: 'db', label: 'Read the product' },
		],
	},
	{
		id: 'sh-on-green',
		name: 'Look at a product, after a blue-green switch',
		description:
			'The new version runs on the green servers, and the load balancer has just switched everyone to them. The blue servers wait, still running the old version.',
		rps: 50,
		hops: [
			{ from: 'app', to: 'lb', label: 'Ask for the product page' },
			{ from: 'lb', to: 'sh-green', label: 'Everyone: to green' },
			{ from: 'sh-green', to: 'db', label: 'Read the product' },
		],
	},
];

const pyramid: Conditions = { only: ['sh-unit', 'sh-integration', 'sh-e2e'] };
const tracking: Conditions = { only: ['sh-track'], copies: { server: 3 }, bigger: roomy };
const loadTest: Conditions = { only: ['sh-load'], copies: { server: 3 }, traffic: 3.6 };
const canary: Conditions = {
	only: ['sh-canary'],
	traffic: 3,
	copies: { server: 3 },
	bigger: roomy,
};

/** A sale-day load on the three copies, with the database out of the way. */
const deploying: Conditions = { only: ['look-pick'], traffic: 3, bigger: roomy };
const deployParts = ['app', 'lb', ...copies, 'db'];
const badVersion = 0.3;

const testParts = ['sh-tests', 'app', 'lb', 'server', 'db', 'payments'];

const shipping: Track = {
	id: 'shipping',
	name: 'Shipping',
	tagline: 'Testing, and getting each change out safely, many times a day.',
	lessons: [
		{
			id: 'testing',
			title: 'Testing',
			summary:
				'Unit, integration and end-to-end tests, the testing pyramid, contracts between services, load tests that find the bottleneck, and testing in production safely.',
			steps: [
				{
					title: 'Unit tests',
					show: ['sh-tests', 'server'],
					journey: 'sh-unit',
					current: [['sh-tests', 'server']],
					set: { only: ['sh-unit'] },
					body: [
						'Every change to the shop’s code could break something that used to work. Checking everything by hand before each change would take days, so the checks are written as code too: tests, run by a **Test runner** for every change.',
						'The smallest are unit tests. Each checks one small piece of code alone, like the function that works out an order’s total, with everything around it left out or replaced by a stand-in, a mock. They need no network and no database, so thousands run in seconds, and a failing one points straight at what broke.',
					],
					example: {
						says: 'A unit test for the order total.',
						data: {
							given: '2 Blue kettles at ₹1,499, with the code DIWALI10',
							expect: '₹2,698.20, which is 10% off',
							answer: 'pass, in 2 ms',
						},
					},
				},
				{
					title: 'Integration tests',
					show: ['sh-tests', 'server', 'db'],
					journey: 'sh-integration',
					current: [['server', 'db']],
					set: { only: ['sh-integration'] },
					body: [
						'Pieces that each work alone can still fail together: a query with a typo, a column that was renamed, a date saved in the wrong format. Integration tests check a piece with its real neighbours.',
						'Here the web server’s code runs against a real **Database**, a throwaway Postgres started just for the tests, often with a tool like Testcontainers. Each test saves an order and reads it back. Each takes up to a second or so, not milliseconds, so there are fewer of them.',
					],
				},
				{
					title: 'End-to-end tests',
					show: testParts,
					journey: 'sh-e2e',
					current: [['sh-tests', 'app']],
					set: { only: ['sh-e2e'] },
					body: [
						'End-to-end tests use the whole shop the way Riya does. A robot opens the app, searches for the Blue kettle, adds it to the cart and pays, with the **Payment provider** in its test mode. Playwright, Cypress and Selenium drive web pages; Appium, Espresso and XCUITest drive phone apps.',
						'They catch what nothing else does, because everything is tested together. But they’re slow, often most of a minute each, and fragile: a slow network or a moved button fails them when nothing is wrong. A test that passes and fails at random is a flaky test, and teams soon learn to ignore it.',
					],
					example: {
						says: 'One end-to-end test.',
						data: {
							steps: 'open the app, search “kettle”, add the Blue kettle, pay with a test card',
							expect: 'order placed, and a receipt email',
							answer: 'pass, in 48 seconds',
						},
					},
				},
				{
					title: 'The testing pyramid',
					show: testParts,
					journey: 'sh-e2e',
					draw: ['sh-unit', 'sh-integration'],
					set: pyramid,
					body: [
						'So a healthy set of tests is shaped like a pyramid: many fast unit tests at the bottom, fewer integration tests in the middle, and a few end-to-end tests at the top, for the journeys that matter most, like paying. That’s the testing pyramid, an idea from Mike Cohn.',
						'Turn it upside down, mostly end-to-end tests, and every change waits an hour for tests that fail at random, and nobody can tell what broke. Some teams prefer more integration tests than unit tests, but the rule holds: the slower the test, the fewer of them.',
					],
					example: {
						says: 'The shop’s tests, say.',
						data: {
							'unit tests': '3,000, in 40 seconds',
							'integration tests': '300, in 4 minutes',
							'end-to-end tests': '25, in 12 minutes',
						},
					},
				},
				{
					title: 'A change breaks a neighbour',
					show: ['app', 'lb', 'server', 'db', 'delivery'],
					journey: 'sh-track',
					current: [['server', 'delivery']],
					set: { ...tracking, flaky: { delivery: 1 } },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The delivery team makes a breaking change to the **Delivery service**: it renames a field in its answers, from eta to arrivesAt. All their tests pass. All the web server’s tests pass too, because they use a mock of the delivery service that still answers with an eta.',
						'In production, the web server finds no eta in any answer, and every order page fails. Each team tested only its own side, against its own idea of the other.',
					],
				},
				{
					title: 'Contract tests',
					show: ['sh-tests', 'app', 'lb', 'server', 'db', 'delivery'],
					journey: 'sh-track',
					draw: ['sh-contract'],
					current: [['sh-tests', 'delivery']],
					set: { ...tracking, only: ['sh-track', 'sh-contract'] },
					facts: ['succeed'],
					body: [
						'A contract writes down what one service expects of another: GET /deliveries/88 answers with an eta. The web server’s tests record it, and the **Delivery service**’s build replays it against the real thing, for every change. Renaming eta now fails the delivery team’s build, before it ships, and every order page keeps working.',
						'That’s consumer-driven contract testing, and Pact is the best-known tool for it. It’s far quicker than an end-to-end test of both services, and it says exactly which promise broke.',
					],
					example: {
						says: 'The contract the web server wrote.',
						data: {
							request: 'GET /deliveries/88',
							'must answer': '200, with an eta, like 18:30',
							'the delivery team’s change':
								'eta renamed to arrivesAt: contract broken, build stopped',
						},
					},
				},
				{
					title: 'Load tests: find the breaking point',
					show: ['sh-loadgen', 'lb', 'server', 'db'],
					journey: 'sh-load',
					set: loadTest,
					facts: ['succeed', 'wait', { busy: 'server' }, { busy: 'db' }],
					copies: true,
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The tests so far check that the shop works. A load test checks how much it can take. Before the Diwali sale, a **Load generator** pretends to be shoppers, more and more of them, against a copy of the shop set up like the real one. k6, JMeter, Gatling and Locust are common tools.',
						'At first, everything keeps up. At 180 requests a second, the **Database** can’t: it’s at 120%, about 1 page in 6 fails, and pages take 2 seconds. The web servers are only 60% busy. The database is the bottleneck, and the team knows it weeks before the sale.',
						'Load tests come in a few kinds: a ramp like this one, to find the limit; a stress test past it, to see how the shop fails and recovers; a spike test, a sudden jump like a sale’s first minute; and a soak test, hours at a steady rate, to find slow leaks.',
					],
				},
				{
					title: 'Fix it, and test again',
					show: ['sh-loadgen', 'lb', 'server', 'db'],
					journey: 'sh-load',
					set: { ...loadTest, bigger: { db: 2 } },
					facts: ['succeed', 'wait', { busy: 'server' }, { busy: 'db' }],
					copies: true,
					body: [
						'The team moves the database to a machine twice the size, though a cache or read copies would work too, and runs the same test again. At 180 a second, every page works, and the **Database** is 60% busy.',
						'Now the next limit is somewhere else, so the test keeps climbing to find it. Run it before every big event, and after big changes: one slow new query can move the limit.',
					],
				},
				{
					title: 'Testing in production, safely',
					show: ['app', 'lb', 'server', 'sh-new', 'db'],
					journey: 'sh-canary',
					current: [['lb', 'sh-new']],
					set: canary,
					facts: ['succeed', { load: 'sh-new' }],
					copies: true,
					body: [
						'However good the copy of the shop, production is different: real data, real traffic, real phones. So teams test there too, carefully. A canary gives the **New version** a small share of shoppers first, here 5%, about 8 requests a second, and compares its errors with the old version’s. Feature flags turn new code on for staff first, then a few shoppers. The next lesson covers both.',
						'Robots also place a test order every minute in production, to spot a broken checkout before shoppers do: that’s synthetic monitoring. And chaos engineering switches parts off on purpose, to check the spares take over, as the reliability lessons describe.',
					],
				},
				{
					title: 'Which test when',
					show: testParts,
					journey: 'sh-e2e',
					draw: ['sh-unit', 'sh-integration'],
					set: pyramid,
					body: [
						'Each kind of test catches a different kind of mistake, at a different cost. A good team uses them all, in the right amounts.',
					],
					compare: {
						title: 'Which test when',
						rows: [
							[
								'Unit tests',
								'Logic in one piece: totals, discounts, rules. Thousands, for every change.',
							],
							[
								'Integration tests',
								'A piece with its real database, queue or cache: queries, saving and reading back.',
							],
							[
								'Contract tests',
								'Services built by different teams that call each other. Catches a broken promise before it ships.',
							],
							[
								'End-to-end tests',
								'The few journeys that must never break, like paying. Slow and fragile, so keep them few.',
							],
							[
								'Load tests',
								'Before big events and after big changes: find the bottleneck before shoppers do.',
							],
							[
								'Canaries and flags',
								'What only production shows: a small share first, watched closely.',
							],
							['Chaos tests', 'Checking that spares and failover really work.'],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely with the load test at 180 requests a second. Add copies of the database from its details, as if adding read copies, then push the traffic up until the next part gives way.',
				journey: 'sh-load',
				set: loadTest,
			},
		},
		{
			id: 'ci-cd',
			title: 'CI/CD and deployments',
			summary:
				'Every change built and tested, then shipped: recreate, rolling, blue-green and canary deploys, feature flags, fast rollbacks, database changes without downtime, and infrastructure as code.',
			steps: [
				{
					title: 'Every change, built, tested and shipped',
					show: ['sh-tests', 'server', 'db'],
					journey: 'sh-integration',
					current: [['sh-tests', 'server']],
					set: { only: ['sh-integration'] },
					body: [
						'Ten developers change the shop’s code. Instead of working apart for weeks and joining it all up at the end, they merge small changes into the main copy every day. Each comes as a pull request, and a CI server, like GitHub Actions, GitLab CI or Jenkins, builds it and runs every test on it. A change that fails isn’t merged. That’s continuous integration, CI.',
						'Then the deployment pipeline packs the shop into a container image, puts it on a staging copy of the shop, and runs the end-to-end tests there. With continuous delivery, every change that passes is ready to go out, and a person presses the button. With continuous deployment, there’s no button: it goes out by itself, often many times a day.',
						'Small, routine deploys each risk little, and a problem is easy to trace to its change. But how do you swap the version on servers that are busy serving shoppers?',
					],
					example: {
						says: 'One change, on its way out.',
						data: {
							'10:02': 'pull request merged',
							'10:11': 'built, and every test passes',
							'10:25': 'on staging, the end-to-end tests pass',
							'10:26': 'in production: by itself, or when someone presses deploy',
						},
					},
				},
				{
					title: 'Recreate: stop, then start',
					show: deployParts,
					journey: 'look-pick',
					set: { ...deploying, down: copies },
					facts: ['succeed'],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The simplest way is to stop every copy, then start them all on the new version. That’s a recreate deploy. While they restart, nobody can shop: every page fails, for a minute or more.',
						'It’s only worth it when two versions must never run side by side, and then at a quiet hour, announced ahead.',
					],
				},
				{
					title: 'Rolling: one copy at a time',
					show: deployParts,
					journey: 'look-pick',
					set: { ...deploying, down: ['web-2'] },
					facts: ['succeed', { busyEach: copies }],
					body: [
						'A rolling deploy updates one copy at a time. The load balancer drains it, it’s updated, it passes its health checks, it’s put back, then the next. Here **Web server 2** is being updated, and the other two carry everything, at 75% each. Every page works.',
						'The costs: a third less room while it runs, so not in the middle of a sale. Old and new versions serve shoppers side by side for a while, so they must work together. And going back means another rolling deploy.',
						'It’s what Kubernetes does unless told otherwise, and it can start an extra new copy first, so there’s never less room than usual.',
					],
				},
				{
					title: 'A bad version reaches everyone',
					show: deployParts,
					journey: 'look-pick',
					set: {
						...deploying,
						flaky: Object.fromEntries(copies.map((id) => [id, badVersion])),
					},
					facts: ['succeed', { busyEach: copies }],
					tags: [{ text: 'Something breaks', tone: 'warn' }],
					body: [
						'The new version has a bug the tests missed: 3 requests in 10 fail. Its health checks still pass, so the rolling deploy carries on, copy by copy, until every copy runs it. Now 3 pages in 10 fail, for every shopper.',
						'The answer is to roll back to the version before, at once, and find the bug afterwards. Teams keep the last version’s image ready, so rolling back is one command. But with a rolling deploy, that’s another rolling deploy: minutes, while shoppers keep failing.',
					],
				},
				{
					title: 'Blue-green: two full sets',
					show: ['app', 'lb', 'sh-blue', 'sh-green', 'db'],
					journey: 'sh-on-green',
					current: [['lb', 'sh-green']],
					set: { only: ['sh-on-green'], traffic: 3, bigger: roomy },
					facts: ['succeed', { busyEach: ['sh-blue', 'sh-green'] }],
					copies: true,
					body: [
						'Blue-green deploys keep two full sets of servers. The **Blue servers** run the current version and serve everyone; the new version goes onto the **Green servers**, and is tested there, with no shopper on it. Then the load balancer switches everyone to green at once.',
						'Here green has just taken over, at 50% busy, and blue sits idle, still running the old version. If green misbehaves, the switch goes back: seconds, not minutes.',
						'The costs: twice the servers, at least for the switch. Everyone moves at once, so a bug reaches everyone, if only briefly. And both sets share the database, so its changes must suit both versions.',
					],
				},
				{
					title: 'Canary: a few shoppers first',
					show: ['app', 'lb', 'server', 'sh-new', 'db'],
					journey: 'sh-canary',
					current: [['lb', 'sh-new']],
					set: { ...canary, flaky: { 'sh-new': badVersion } },
					facts: ['succeed', { load: 'sh-new' }],
					copies: true,
					body: [
						'A canary deploy sends the new version to a small share of shoppers first. Here the **New version** gets 5% of requests, about 8 a second, and it has the same bug: 3 of its requests in 10 fail. But that’s 1.5% of all requests, so 98.5% of pages work.',
						'Its errors and waits are compared with the old version’s. Worse, and it’s rolled back automatically, before most shoppers ever meet it. As good, and its share grows: 5%, 25%, half, everyone. Argo Rollouts, Flagger and Spinnaker do the comparing and the rolling back.',
						'The costs: a slower deploy, and good metrics to judge by. A canary that gets too few requests can’t tell a bug from bad luck.',
					],
				},
				{
					title: 'Deploy isn’t release: feature flags',
					show: deployParts,
					journey: 'look-pick',
					set: deploying,
					body: [
						'A feature flag is a switch in the code. The new one-tap checkout goes out turned off, so deploying it changes nothing for shoppers. Releasing it is turning the flag on: for staff first, then 1% of shoppers, then everyone, with no new deploy.',
						'If it misbehaves, turning it off takes seconds: a kill switch. Unfinished work can be merged every day, hidden behind a flag, so nobody keeps a branch apart for weeks. Flags also run A/B tests: half the shoppers get one checkout, half the other, and the sales decide. LaunchDarkly and Unleash are tools for flags, and OpenFeature is an open standard for them.',
						'The cost: every flag is a fork in the code. Remove each one once its feature is out, or the code fills with switches nobody dares touch.',
					],
					example: {
						says: 'The flag for one-tap checkout.',
						data: {
							staff: 'on',
							'shoppers in Pune': 'on for 10%',
							everyone: 'off',
							answer: 'Riya, in Pune, is in the 10%, so she sees it',
						},
					},
				},
				{
					title: 'Changing the database without downtime',
					show: deployParts,
					journey: 'look-pick',
					current: copies.map((id): [string, string] => [id, 'db']),
					set: deploying,
					body: [
						'During any of these deploys, old and new versions share one **Database**, and the old one may need to come back. So a change to the database is made in steps, each safe for both versions: expand and contract.',
						'Say the phone column is to be renamed mobile. Expand: add mobile, and deploy code that writes both. Migrate: copy the old rows across, a backfill, in small batches. Then deploy code that reads mobile. Contract: only when nothing uses phone any more, drop it.',
						'Each step is its own deploy, can be rolled back, and never breaks the version still running. Tools like Flyway and Liquibase keep each schema migration as a file beside the code, and run each one once, in order, on every database.',
					],
					example: {
						says: 'Renaming phone to mobile, in steps.',
						data: {
							'1. expand': 'add the mobile column; code writes both',
							'2. migrate': 'copy phone into mobile, 1,000 rows at a time',
							'3. switch': 'code reads mobile',
							'4. contract': 'drop the phone column',
						},
					},
				},
				{
					title: 'Infrastructure as code',
					show: deployParts,
					journey: 'look-pick',
					set: deploying,
					body: [
						'The servers, the load balancer, the database and the network need setting up too. Clicked together by hand in a web console, nobody can say exactly how they were made, and the staging copy slowly drifts away from production.',
						'With infrastructure as code, they’re described in files, kept in git and reviewed like code. Terraform is the best known, with an open-source fork, OpenTofu; Pulumi and AWS CloudFormation are others. terraform plan shows what would change, and terraform apply makes it so.',
						'Then staging is built from the same files as production, a lost region can be rebuilt from them, and every change to the infrastructure has an author and a reason.',
					],
					example: {
						says: 'Adding a fourth web server.',
						data: {
							'the change': 'web servers: 3 becomes 4',
							'terraform plan': 'Plan: 1 to add, 0 to change, 0 to destroy.',
							'terraform apply':
								'the new server is made, and joins the load balancer',
						},
					},
				},
				{
					title: 'Which one when',
					show: deployParts,
					journey: 'look-pick',
					set: deploying,
					body: [
						'Most teams combine them: small changes through CI, rolling or canary deploys, feature flags for anything risky, and expand and contract for the database.',
					],
					compare: {
						title: 'Which one when',
						rows: [
							[
								'Recreate',
								'Two versions can’t run side by side, and some downtime is acceptable. Rare.',
							],
							[
								'Rolling',
								'The everyday default: no downtime and no extra servers. Slow to roll back.',
							],
							[
								'Blue-green',
								'An instant switch and an instant way back, for twice the servers. Everyone moves at once.',
							],
							[
								'Canary',
								'Risky changes to busy services: a few shoppers first, rolled back automatically. Needs good metrics.',
							],
							[
								'Feature flags',
								'Shipping code before it’s released, turning it on gradually, with a kill switch. Remove them after.',
							],
							[
								'Expand and contract',
								'Any change to the database, so old and new code both keep working.',
							],
						],
					},
				},
			],
			tryIt: {
				text: 'Open Explore freely during a rolling deploy, with Web server 2 out. Push the traffic up to see how much room the deploy leaves, then take another copy down.',
				journey: 'look-pick',
				set: { ...deploying, down: ['web-2'] },
			},
		},
	],
};

export const shippingTrack: TrackModule = { track: shipping, parts, journeys };
