import { error } from '@sveltejs/kit';
import { all, byId } from '$lib/orbit/system.js';
import { game } from '$lib/game';

/**
 * Every body and post gets its own prerendered page: /about, /log, /telescope, ..., and so does the comet's
 * game (/gravity-well). The home page is listed too (no slug), so it doesn't depend on the default '*'
 * prerender entry.
 */
export function entries() {
	return [{ slug: undefined }, ...all.map((b) => ({ slug: b.id })), { slug: game.slug }];
}

export function load({ params }) {
	const slug = params.slug ?? null;
	if (slug && !byId[slug] && slug !== game.slug) error(404, 'Not found');
	return { slug };
}
