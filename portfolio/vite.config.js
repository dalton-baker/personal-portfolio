import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// enhancedImages() has to come before sveltekit(): it optimizes the photos in $lib/images at build time.
	plugins: [enhancedImages(), sveltekit()]
});
