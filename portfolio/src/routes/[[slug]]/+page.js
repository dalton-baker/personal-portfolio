import { error } from '@sveltejs/kit';
import { all, byId } from '$lib/orbit/system.js';

/** Every body and post gets its own prerendered page: /about, /log, /telescope, ... */
export function entries() {
	return all.map((b) => ({ slug: b.id }));
}

export function load({ params }) {
	const slug = params.slug ?? null;
	if (slug && !byId[slug]) error(404, 'Not found');
	return { slug };
}
