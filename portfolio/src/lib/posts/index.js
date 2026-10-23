/**
 * Blog posts ("The Log"). Every .svelte file in this folder is a post, and
 * its file name is its URL: telescope.svelte is served at /telescope.
 *
 * A post exports `meta` from a <script module> block:
 *   title     heading shown on the map and in the reader
 *   pageTitle optional <title> text (defaults to title)
 *   date      'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM', also sets the post order
 *   dek       one or two sentence summary
 *   hero      { src, alt } image, or { src, video: true } looping video
 */

const modules = import.meta.glob('./*.svelte', { eager: true });
const sources = import.meta.glob('./*.svelte', { eager: true, query: '?raw', import: 'default' });

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatDate(iso) {
	const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
	return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function countWords(src) {
	return src
		.replace(/<script[\s\S]*?<\/script>/g, ' ')
		.replace(/<style[\s\S]*?<\/style>/g, ' ')
		.replace(/<[A-Z][\s\S]*?\/>/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.split(/\s+/)
		.filter(Boolean).length;
}

export const posts = Object.entries(modules)
	.map(([path, mod]) => {
		const slug = path.slice(2, -'.svelte'.length);
		const words = countWords(sources[path]) + mod.meta.dek.split(/\s+/).length;
		return {
			...mod.meta,
			slug,
			component: mod.default,
			pageTitle: mod.meta.pageTitle ?? mod.meta.title,
			displayDate: formatDate(mod.meta.date),
			mins: Math.max(1, Math.round(words / 220))
		};
	})
	.sort((a, b) => a.date.localeCompare(b.date));

posts.forEach((p, i) => {
	p.n = i + 1;
});

export const postsBySlug = Object.fromEntries(posts.map((p) => [p.slug, p]));
