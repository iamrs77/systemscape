import { defineConfig, devices } from '@playwright/test';

const PORT = 4180;
const ci = Boolean(process.env.CI);

/** End-to-end tests run against the production build, on a desktop and a phone. */
export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: ci,
	retries: ci ? 1 : 0,
	reporter: ci ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'retain-on-failure',
	},
	projects: [
		{
			name: 'desktop',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
		},
		{ name: 'phone', use: { ...devices['Pixel 7'] } },
	],
	webServer: {
		command: `npm run preview -- --port ${PORT} --strictPort`,
		port: PORT,
		reuseExistingServer: !ci,
	},
});
