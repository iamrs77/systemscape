import type { Term } from '../glossary';

/** Words the shipping lessons explain. */
export const shippingTerms: Term[] = [
	{
		id: 'unit-test',
		term: 'Unit test',
		meaning:
			'A test of one small piece of code on its own, like the function that works out an order’s total. Thousands run in seconds.',
		forms: ['unit test', 'unit tests'],
	},
	{
		id: 'mock',
		term: 'Mock',
		meaning:
			'A stand-in for a real part, used in tests, like a pretend delivery service that always gives the same answer.',
		like: 'A crash-test dummy.',
		forms: ['mock', 'mocks'],
	},
	{
		id: 'integration-test',
		term: 'Integration test',
		meaning:
			'A test of a piece of code with its real neighbours, like a real database, to check they work together.',
		forms: ['integration test', 'integration tests'],
	},
	{
		id: 'end-to-end-test',
		term: 'End-to-end test',
		meaning:
			'A test that uses the whole app the way a person does, from tapping in the app all the way to the database and back.',
		forms: ['end-to-end test', 'end-to-end tests'],
	},
	{
		id: 'flaky-test',
		term: 'Flaky test',
		meaning:
			'A test that sometimes passes and sometimes fails, with nothing changed. Teams learn to ignore it, and then it misses real bugs.',
		forms: ['flaky test', 'flaky tests'],
	},
	{
		id: 'testing-pyramid',
		term: 'Testing pyramid',
		meaning:
			'Many fast unit tests, fewer integration tests, and a few end-to-end tests: the slower the test, the fewer of them.',
		forms: ['testing pyramid'],
	},
	{
		id: 'contract-test',
		term: 'Contract test',
		meaning:
			'A test that one service still answers the way another service expects. It runs in the first service’s build, so a broken promise stops it before it ships.',
		forms: [
			'contract test',
			'contract tests',
			'contract testing',
			'consumer-driven contract testing',
		],
	},
	{
		id: 'stress-test',
		term: 'Stress test',
		meaning:
			'A load test pushed past the limit on purpose, to see how the app fails and how it recovers.',
		forms: ['stress test', 'stress tests'],
	},
	{
		id: 'spike-test',
		term: 'Spike test',
		meaning:
			'A load test where the traffic jumps all at once, like the first minute of a sale.',
		forms: ['spike test', 'spike tests'],
	},
	{
		id: 'soak-test',
		term: 'Soak test',
		meaning:
			'A load test held at a steady rate for hours, to find problems that only build up slowly, like memory that’s never given back.',
		forms: ['soak test', 'soak tests'],
	},
	{
		id: 'staging',
		term: 'Staging',
		meaning:
			'A copy of the app set up like production, where changes are tried before customers see them.',
		like: 'A dress rehearsal.',
		forms: ['staging'],
	},
	{
		id: 'production',
		term: 'Production',
		meaning: 'The real, live app that customers use, as opposed to copies kept for testing.',
		forms: ['production'],
	},
	{
		id: 'synthetic-monitoring',
		term: 'Synthetic monitoring',
		meaning:
			'Robots that use the live app all day, like placing a test order every minute, to spot a problem before customers do.',
		like: 'A mystery shopper.',
		forms: ['synthetic monitoring'],
	},
	{
		id: 'continuous-integration',
		term: 'Continuous integration (CI)',
		meaning:
			'Merging small changes into the main code often, at least daily, with every change built and tested automatically.',
		forms: ['continuous integration', 'ci'],
	},
	{
		id: 'continuous-delivery',
		term: 'Continuous delivery',
		meaning:
			'Every change that passes the tests is ready to go out, and a person presses a button to send it.',
		forms: ['continuous delivery'],
	},
	{
		id: 'continuous-deployment',
		term: 'Continuous deployment',
		meaning:
			'Every change that passes the tests goes out to customers by itself, with no button to press.',
		forms: ['continuous deployment'],
	},
	{
		id: 'pull-request',
		term: 'Pull request',
		meaning:
			'A proposed change to the code, shown to the team to review and tested automatically, before it’s merged.',
		forms: ['pull request', 'pull requests'],
	},
	{
		id: 'repository',
		term: 'Repository',
		meaning:
			'Where a project’s code is kept, with every change ever made to it. Most teams use git.',
		forms: ['repository', 'repositories', 'git'],
	},
	{
		id: 'deployment-pipeline',
		term: 'Deployment pipeline',
		meaning:
			'The automatic steps every change goes through on its way out: build, test, package, try on staging, then production.',
		like: 'An assembly line with an inspection at every station.',
		forms: ['deployment pipeline', 'deployment pipelines'],
	},
	{
		id: 'container-image',
		term: 'Container image',
		meaning:
			'An app packed up with everything it needs to run, so it runs the same on a laptop, in staging and in production. Docker made them common.',
		forms: ['container image', 'container images'],
	},
	{
		id: 'deploy',
		term: 'Deploy',
		meaning: 'Putting a new version of the code onto the servers.',
		forms: ['deploy', 'deploys', 'deployed', 'deploying', 'deployment', 'deployments'],
	},
	{
		id: 'recreate-deploy',
		term: 'Recreate deploy',
		meaning:
			'Stopping every copy, then starting them all on the new version. Simple, but nobody can use the app in between.',
		forms: ['recreate deploy', 'recreate deploys'],
	},
	{
		id: 'blue-green',
		term: 'Blue-green deploy',
		meaning:
			'Keeping two full sets of servers, putting the new version on the idle one, then switching everyone to it at once. Switching back is the way back.',
		forms: ['blue-green deploy', 'blue-green deploys', 'blue-green'],
	},
	{
		id: 'feature-flag',
		term: 'Feature flag',
		meaning:
			'A switch in the code that turns a feature on or off, for everyone or for some people, without a new deploy.',
		like: 'A light switch wired in before the lamp is plugged in.',
		forms: ['feature flag', 'feature flags'],
	},
	{
		id: 'kill-switch',
		term: 'Kill switch',
		meaning: 'A feature flag used to turn something off at once when it misbehaves.',
		forms: ['kill switch', 'kill switches'],
	},
	{
		id: 'ab-test',
		term: 'A/B test',
		meaning:
			'Showing two versions of something to two random groups of users at the same time, and measuring which does better, like which checkout sells more.',
		forms: ['a/b test', 'a/b tests', 'a/b testing'],
	},
	{
		id: 'rollback',
		term: 'Rollback',
		meaning:
			'Undoing a change: putting the version before back when a new one misbehaves, or a database undoing a transaction that didn’t finish, as if it never started.',
		forms: ['rollback', 'rollbacks', 'roll back', 'rolls back', 'rolled back', 'rolling back'],
	},
	{
		id: 'expand-and-contract',
		term: 'Expand and contract',
		meaning:
			'Changing a database in safe steps: add the new, copy the data across, switch the code, and only then remove the old. Every step works with both versions of the code.',
		forms: ['expand and contract'],
	},
	{
		id: 'backfill',
		term: 'Backfill',
		meaning:
			'Filling a new column or table with the old data, usually in small batches, while the app keeps running.',
		forms: ['backfill', 'backfills'],
	},
	{
		id: 'infrastructure-as-code',
		term: 'Infrastructure as code',
		meaning:
			'Describing servers, networks and databases in files, kept and reviewed like code, so a tool can build them the same way every time.',
		like: 'A recipe instead of cooking from memory.',
		forms: ['infrastructure as code'],
	},
	{
		id: 'terraform',
		term: 'Terraform',
		meaning:
			'A popular tool for infrastructure as code. It compares the files with what exists, shows what would change, and makes the changes.',
		forms: ['terraform'],
	},
	{
		id: 'drift',
		term: 'Drift',
		meaning:
			'When a system slowly stops matching how it was meant to be set up, through changes made by hand.',
		forms: ['drift', 'drifts'],
	},
];
