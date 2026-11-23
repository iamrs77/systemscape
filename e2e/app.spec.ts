import { expect, test, type Page } from '@playwright/test';

// every test fails on any error in the page
let errors: string[] = [];
test.beforeEach(({ page }) => {
	errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
});
test.afterEach(() => {
	expect(errors).toEqual([]);
});

const step = (page: Page) => page.getByRole('complementary', { name: 'This step' });
const diagram = (page: Page) =>
	page.getByRole('group', { name: /drawn as a diagram|Every part is a button/ });

test('starts at the home page, and opens a system at its first lesson', async ({ page }) => {
	await page.goto('/');
	await expect(
		page.getByRole('heading', { name: 'Learn how big apps are built.' }),
	).toBeVisible();
	// each system's card shows its diagram
	await expect(
		page.getByRole('img', { name: 'Ride-hailing app, drawn as a diagram' }),
	).toBeVisible();

	await page.getByRole('link', { name: 'Ride-hailing app' }).click();
	await expect(page).toHaveURL(/#\/ride-hailing$/);
	await expect(page.getByRole('heading', { level: 1, name: 'The big picture' })).toBeVisible();
	await expect(step(page).getByRole('heading', { name: 'What it does' })).toBeVisible();
	await expect(page).toHaveTitle('Ride-hailing app · Systemscape');

	await page.goBack();
	await expect(
		page.getByRole('heading', { name: 'Learn how big apps are built.' }),
	).toBeVisible();
});

test('walks the big picture a row at a time, labelling every part', async ({ page }) => {
	await page.goto('/#/ride-hailing');
	await expect(diagram(page).locator('.diagram-label')).toHaveCount(17);
	await step(page).getByRole('button', { name: /^Next/ }).click();
	await expect(step(page).getByRole('heading', { name: 'How to read it' })).toBeVisible();
	await page.keyboard.press('ArrowRight');
	await expect(step(page).getByRole('heading', { name: 'The apps' })).toBeVisible();
	// only the rows met so far are labelled
	await expect(diagram(page).locator('.diagram-label')).toHaveCount(2);
	await expect(page).toHaveURL(/learn\/overview\/3$/);
});

test('follows a request, zooming in on the call being explained', async ({ page }) => {
	await page.goto('/#/ride-hailing/learn/request-ride/4');
	await expect(step(page).getByRole('heading', { name: 'Find a driver' })).toBeVisible();
	await expect(step(page)).toContainText('API gateway calls Dispatch, and waits for the answer.');
	const svg = page.locator('svg[role="group"]');
	const zoomed = await svg.getAttribute('viewBox');

	// the parts on the diagram are buttons, explained beside it
	await page.getByRole('button', { name: /^Dispatch: Service/ }).click();
	await expect(step(page).getByRole('heading', { name: 'Dispatch' })).toBeVisible();
	await step(page).getByRole('button', { name: '← Back to the step' }).click();

	// the last steps take in the whole journey, so the view widens
	await page.goto('/#/ride-hailing/learn/request-ride/12');
	await expect(step(page).getByRole('heading', { name: 'Where the time goes' })).toBeVisible();
	await expect
		.poll(async () => Number((await svg.getAttribute('viewBox'))!.split(' ')[2]))
		.toBeGreaterThan(Number(zoomed!.split(' ')[2]));
});

test('shows what breaks on a busy night, and the challenge to fix it', async ({ page }) => {
	await page.goto('/#/ride-hailing/learn/request-ride/13');
	await expect(step(page)).toContainText(/only [\d.]+% of “Request a ride” requests succeed/);
	await expect(page.getByRole('button', { name: /^Dispatch: Service, \d+% busy/ })).toBeVisible();
	await page.keyboard.press('ArrowRight');
	await step(page)
		.getByRole('link', { name: /Start the challenge/ })
		.click();
	await expect(page.getByRole('region', { name: 'Challenge: Routing goes down' })).toBeVisible();
});

test('solves a challenge by scaling up and switching on circuit breakers', async ({ page }) => {
	await page.goto('/#/ride-hailing/practice/sudden-rain');
	const card = page.getByRole('region', { name: 'Challenge: Caught in the rain' });
	await expect(card).toContainText('Not met');

	await page.getByRole('button', { name: /^Dispatch: Service/ }).click();
	await expect(page.getByRole('heading', { name: 'Dispatch' })).toBeVisible();
	const add = page.getByRole('button', { name: 'Add an instance' });
	for (let i = 0; i < 5; i++) await add.click();
	await expect(page.getByLabel('Instances set by you')).toHaveText('8');
	await page.getByRole('button', { name: 'Close details' }).click();

	await page.getByRole('button', { name: /Resilience/ }).click();
	await page.getByRole('switch', { name: 'Circuit breakers' }).click();
	await expect(card).toContainText('Solved');
	const course = page.getByRole('navigation', { name: 'Course' });
	if (!(await course.getByRole('link', { name: /Caught in the rain/ }).isVisible())) {
		// on a phone, the course is folded away
		await course.getByRole('button').first().click();
	}
	await expect(course.getByRole('link', { name: /Caught in the rain.*\(done\)/ })).toBeVisible();
});

test('takes a part down in the sandbox', async ({ page }) => {
	await page.goto('/#/ride-hailing/explore');
	await page.getByRole('button', { name: /^API gateway: Gateway/ }).click();
	await expect(page.getByRole('heading', { name: 'API gateway' })).toBeVisible();
	await page.getByRole('button', { name: 'Take down' }).click();
	await expect(page.getByRole('button', { name: /^API gateway: down/ })).toBeVisible();
	await page.getByRole('button', { name: 'Close details' }).click();
	await expect(page.getByText(/Request a ride: only 0% succeed/)).toBeVisible();
});

test('explains a word when you tap it', async ({ page }) => {
	await page.goto('/#/ride-hailing/learn/overview/8');
	await expect(step(page).getByRole('heading', { name: 'The data' })).toBeVisible();
	await step(page).getByRole('button', { name: 'shards' }).click();
	const meaning = page.getByRole('dialog', { name: 'What “Shard” means' });
	await expect(meaning).toBeVisible();
	await expect(meaning).toBeInViewport();
	await page.keyboard.press('Escape');
	await expect(meaning).toBeHidden();
});
