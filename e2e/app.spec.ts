import { expect, test, type Page } from '@playwright/test';

// every test fails on any error in the page, including the 3D view's
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

async function open(page: Page, { tour = false } = {}) {
	if (!tour) await page.addInitScript(() => localStorage.setItem('systemscape:toured', '1'));
	await page.goto('/');
	await expect(page.locator('canvas')).toBeVisible();
}

test('draws the system in 3D, with a label for every part', async ({ page }) => {
	await open(page);
	// labels are buttons over the canvas, placed once the scene has rendered
	await expect(page.getByRole('button', { name: /^Dispatch: \d+% busy/ })).toBeAttached();
	await expect(page.getByRole('button', { name: /^Rider app: app/ })).toBeVisible();
	await expect(page.locator('.node-label')).toHaveCount(16);
});

test('walks a first-time visitor through the tour', async ({ page }) => {
	await open(page, { tour: true });
	const tour = page.getByRole('dialog');
	await expect(tour).toContainText('The system, in 3D');
	for (let i = 0; i < 4; i++) await tour.getByRole('button', { name: 'Next' }).click();
	await expect(tour).toContainText('Ready for a challenge?');
	await tour.getByRole('button', { name: 'Start exploring' }).click();
	await expect(tour).toBeHidden();

	await page.reload();
	await expect(page.locator('canvas')).toBeVisible();
	await expect(page.getByRole('dialog')).toBeHidden();
});

test('solves a challenge by scaling up and switching on circuit breakers', async ({ page }) => {
	await open(page);
	await page.getByRole('button', { name: /Caught in the rain/ }).click();
	const card = page.getByRole('region', { name: 'Challenge: Caught in the rain' });
	await expect(card).toContainText('Not met');

	// find dispatch through the journey's steps, then add instances
	await page.getByRole('button', { name: 'Dispatch', exact: true }).first().click();
	await expect(page.getByRole('heading', { name: 'Dispatch' })).toBeVisible();
	const add = page.getByRole('button', { name: 'Add an instance' });
	for (let i = 0; i < 5; i++) await add.click();
	await expect(page.getByLabel('Instances set by you')).toHaveText('8');
	await page.getByRole('button', { name: 'Close details' }).click();

	await page.getByRole('switch', { name: 'Circuit breakers' }).click();
	await expect(card).toContainText('Solved');
	await expect(page.getByRole('button', { name: /Caught in the rain.*solved/ })).toBeVisible();
});

test('takes a part down from the map', async ({ page }) => {
	await open(page);
	await page.getByRole('button', { name: /^API gateway:/ }).click();
	await expect(page.getByRole('heading', { name: 'API gateway' })).toBeVisible();
	await page.getByRole('button', { name: 'Take down' }).click();
	await expect(page.getByRole('button', { name: /^API gateway: down/ })).toBeVisible();
	await page.getByRole('button', { name: 'Close details' }).click();
	await expect(page.getByText(/Request a ride: only 0% succeed/)).toBeVisible();
});

test('hides the side panels to focus on the map', async ({ page, isMobile }) => {
	test.skip(isMobile, 'the side panels only sit beside the map on big screens');
	await open(page);
	const canvas = page.locator('canvas');
	const before = (await canvas.boundingBox())!.width;
	await page.getByRole('button', { name: 'Focus on the map' }).click();
	await expect
		.poll(async () => (await canvas.boundingBox())!.width)
		.toBeGreaterThan(before + 500);
});

test('switches between the 3D and top views', async ({ page, isMobile }) => {
	test.skip(isMobile, 'the view switch is hidden on small screens');
	await open(page);
	await page.getByRole('button', { name: 'Top view' }).click();
	await expect(page.getByRole('button', { name: 'Top view' })).toHaveAttribute(
		'aria-pressed',
		'true',
	);
	await page.getByRole('button', { name: '3D view' }).click();
	await expect(page.getByRole('button', { name: '3D view' })).toHaveAttribute(
		'aria-pressed',
		'true',
	);
});
