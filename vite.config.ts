import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	// relative asset paths, so the build works from any folder on any static host
	base: './',
	// resolves the "@/..." paths from tsconfig.json
	resolve: { tsconfigPaths: true },
});
