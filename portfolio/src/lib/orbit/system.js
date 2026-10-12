import { bodies } from '$lib/site.js';
import { posts } from '$lib/posts';

/**
 * Builds the bodies on the map: the site's bodies plus one moon of The Log per
 * post. Each body is decorated with the inline styles its markup needs; the
 * engine adds its live position fields (px, py, sx, sy, ...) every frame.
 */

const KIND_LABEL = {
	hole: 'Event horizon',
	planet: 'Planet',
	rock: 'Belt object',
	giant: 'Gas giant',
	star: 'Companion star',
	pulsar: 'Pulsar'
};
const MOON_SIZES = [8, 9, 8, 10];

/** Orbital speed for an orbit radius t in [0, 1]. */
export function kep(t) {
	return 0.15 * Math.pow(1 / (1 + t * 2.2), 1.5);
}

function makeMoons() {
	const n = posts.length;
	return posts.map((p, i) => {
		// Spread the moons between the inner and outer orbit the design used.
		const mt = n > 1 ? 0.9 + (1.35 * i) / (n - 1) : 1.35;
		return {
			id: p.slug,
			kind: 'moon',
			num: 'P' + p.n,
			name: p.title,
			date: p.displayDate,
			body: p.dek,
			tag: 'Moon of The Log // Post ' + p.n,
			base: '#e9e4ff',
			dark: '#6b5e99',
			mt,
			phase: (0.4 + i * 1.75) % (Math.PI * 2),
			mspeed: 0.32 * Math.pow(0.9 / mt, 0.8),
			size: MOON_SIZES[i % MOON_SIZES.length],
			post: p
		};
	});
}

function decorate(b) {
	const s = b.size || 10;
	b.speed = b.t != null ? kep(b.t) : 0;
	b.shaded = b.kind === 'planet' || b.kind === 'rock' || b.kind === 'giant' || b.kind === 'moon';
	b.ring = !!b.ring;
	b.rays = !!b.rays;
	b.facts = b.facts || [];
	b.links = b.links || [];
	b.wrapStyle = `width:${s}px;height:${s}px`;
	b.ringStyle = `width:${Math.round(s * 2)}px;height:${Math.round(s * 2)}px`;
	b.labelStyle = `margin-left:${Math.round(s / 2 + 12)}px`;
	b.aria = b.kind === 'moon' ? 'Post: ' + b.name : b.kind === 'hole' ? b.name + ': about' : b.name;
	if (b.kind === 'giant') b.swatch = '#ff2e88';
	if (!b.swatch) b.swatch = b.base;
	let bg = '';
	if (b.kind === 'planet' || b.kind === 'moon') bg = 'background:' + b.base;
	else if (b.kind === 'rock') bg = 'background:' + b.base + ';border-radius:44% 56% 38% 62% / 58% 40% 60% 42%';
	else if (b.kind === 'giant') bg = 'background:repeating-linear-gradient(24deg,#ff2e88 0 5px,#ff8ac1 5px 8px,#c2187a 8px 13px,#ff5aa5 13px 16px)';
	else if (b.kind === 'star') bg = 'background:#e8f4ff;box-shadow:0 0 0 3px #9fd0ff,0 0 22px 6px rgba(159,208,255,.55)';
	else if (b.kind === 'pulsar') bg = 'background:#f4ffd9;box-shadow:0 0 0 2px #c8ff2e,0 0 18px 5px rgba(200,255,46,.6)';
	b.dotStyle = bg;
	b.shadeStyle = 'background:linear-gradient(90deg,rgba(0,0,0,0) 0 47%,' + (b.dark || '#222') + ' 47% 100%)';
	return b;
}

const main = bodies.map((b, i) => {
	const num = String(i).padStart(2, '0');
	const kindLabel = b.ring ? 'Ringed planet' : KIND_LABEL[b.kind];
	return { ...b, id: b.slug, num, tag: `OBJ ${num} // ${kindLabel} // ${b.category}` };
});

export const all = [...main, ...makeMoons()].map(decorate);
export const byId = Object.fromEntries(all.map((b) => [b.id, b]));
export const hole = all.find((b) => b.kind === 'hole');
export const orbiters = all.filter((b) => b.kind !== 'hole');
export const moons = all.filter((b) => b.kind === 'moon');
export const blog = all.find((b) => b.isBlog);
export const pulsar = all.find((b) => b.kind === 'pulsar');

if (Object.keys(byId).length !== all.length) {
	throw new Error('A post file name collides with a body slug in $lib/site.js');
}
