import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	// relative asset paths, so the build works from any folder on any static host
	base: './',
	// resolves the "@/..." paths from tsconfig.json
	resolve: { tsconfigPaths: true },
	build: {
		// three.js is most of this, in the lazily loaded 3D view's chunk
		chunkSizeWarningLimit: 1200,
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test/setup.ts'],
		include: ['src/**/*.test.{ts,tsx}'],
	},
});
