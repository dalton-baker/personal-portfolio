import { error } from '@sveltejs/kit';
import { pageMarkdown, slugs } from '$lib/server/agents.js';

/** A Markdown copy of each map page, for AI agents: /about.md, /telescope.md, ... and /index.md for home. */
export const prerender = true;

export function entries() {
	return ['index', ...slugs].map((slug) => ({ slug }));
}

export function GET({ params }) {
	const md = pageMarkdown(params.slug);
	if (md === null) error(404, 'Not found');
	return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
