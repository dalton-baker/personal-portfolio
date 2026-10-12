import { bodies, belt } from '$lib/site.js';
import { posts } from '$lib/posts';

/**
 * Builds the bodies on the map: the site's bodies, their moons, and one moon of The Log per post.
 * Each body is decorated with the inline styles its markup needs; moons are linked to their giant
 * (`moon.host`, `giant.moons`). The engine adds live position fields (px, py, sx, sy, ...) every frame.
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
/** A few craters and a highlight over the base colour, for the inner rocky planets. */
const CRATERS = 'radial-gradient(circle at 30% 34%,rgba(0,0,0,.24) 0 13%,transparent 14%),radial-gradient(circle at 60% 64%,rgba(0,0,0,.2) 0 10%,transparent 11%),radial-gradient(circle at 36% 76%,rgba(0,0,0,.17) 0 7%,transparent 8%),radial-gradient(circle at 70% 30%,rgba(0,0,0,.15) 0 6%,transparent 7%),radial-gradient(circle at 22% 56%,rgba(255,255,255,.16) 0 5%,transparent 6%),';
/** Bright frost and darker plains over the base colour, for icy dwarf planets. */
const ICE = 'radial-gradient(circle at 58% 42%,rgba(255,255,255,.6) 0 20%,transparent 22%),radial-gradient(circle at 30% 64%,rgba(96,112,140,.34) 0 16%,transparent 18%),radial-gradient(circle at 70% 76%,rgba(96,112,140,.26) 0 10%,transparent 12%),';
const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Card text as paragraphs of { text, href? } segments; [text](/slug) becomes a link. */
function toParas(body) {
	return [].concat(body).map((text) => {
		const segs = [];
		let last = 0;
		for (const m of text.matchAll(LINK)) {
			if (m.index > last) segs.push({ text: text.slice(last, m.index) });
			segs.push({ text: m[1], href: m[2] });
			last = m.index + m[0].length;
		}
		if (last < text.length) segs.push({ text: text.slice(last) });
		return segs;
	});
}

/** Orbital speed for an orbit radius t in [0, 1]. */
export function kep(t) {
	return 0.15 * Math.pow(1 / (1 + t * 2.2), 1.5);
}

function postMoons(host) {
	const n = posts.length;
	return posts.map((p, i) => {
		// Spread the moons evenly between an inner and outer orbit.
		const mt = n > 1 ? 0.85 + (1.05 * i) / (n - 1) : 1.3;
		return {
			id: p.slug,
			kind: 'moon',
			host: host.id,
			num: 'P' + p.n,
			name: p.title,
			date: p.displayDate,
			body: p.dek,
			base: '#e9e4ff',
			dark: '#6b5e99',
			mt,
			phase: (0.4 + i * 1.75) % (Math.PI * 2),
			size: MOON_SIZES[i % MOON_SIZES.length],
			post: p
		};
	});
}

function decorate(b) {
	const s = b.size || 10;
	b.speed = b.t != null ? kep(b.t) : 0;
	b.shaded = b.kind === 'planet' || b.kind === 'rock' || b.kind === 'giant' || b.kind === 'moon';
	b.rays = !!b.rays;
	// Outer edge of a giant's always-visible rings (in planet radii), so its frame and label clear them.
	if (b.rings) b.ringsOuter = Math.max(...b.rings.filter((r) => !r[3]).map((r) => r[1]));
	if (b.kind === 'moon') b.mspeed ??= 0.32 * Math.pow(0.9 / b.mt, 0.8);
	b.paras = toParas(b.body);
	b.summary = b.paras[0].map((seg) => seg.text).join('');
	b.facts = b.facts || [];
	b.links = b.links || [];
	// Subtitle in a giant's moon list: a post's date, or a site's address.
	b.sub = b.date ?? b.links[0]?.label ?? b.category;
	b.wrapStyle = `width:${s}px;height:${s}px`;
	if (b.satellite) {
		// A big moon (a bit larger than ours is next to Earth, so it reads at map scale), orbiting just clear of the planet.
		const ms = Math.round(s * 0.45);
		b.sat = {
			size: ms,
			orbit: s * 1.12,
			phase: (b.phase * 1.9) % (Math.PI * 2),
			speed: 0.35,
			style: `width:${ms}px;height:${ms}px;margin:${-ms / 2}px 0 0 ${-ms / 2}px`,
			dotStyle: 'background:' + CRATERS + '#cfcac2',
			shadeStyle: 'background:linear-gradient(90deg,rgba(0,0,0,0) 0 47%,#55514b 47% 100%)'
		};
	}
	b.labelStyle = `margin-left:${Math.round(s / 2 + 12)}px`;
	b.aria = b.post ? 'Post: ' + b.name : b.kind === 'hole' ? 'About Dalton Baker' : b.name;
	if (b.kind === 'giant') b.swatch ??= '#ff2e88';
	if (!b.swatch) b.swatch = b.base;
	let bg = '';
	if (b.kind === 'planet' || b.kind === 'moon') bg = 'background:' + (b.rocky ? CRATERS : b.dwarf ? ICE : '') + b.base;
	else if (b.kind === 'rock') bg = 'background:' + b.base + ';border-radius:44% 56% 38% 62% / 58% 40% 60% 42%';
	else if (b.kind === 'giant') bg = 'background:' + (b.surface ?? 'repeating-linear-gradient(24deg,#ff2e88 0 5px,#ff8ac1 5px 8px,#c2187a 8px 13px,#ff5aa5 13px 16px)');
	else if (b.kind === 'star') bg = 'background:#e8f4ff;box-shadow:0 0 0 3px #9fd0ff,0 0 22px 6px rgba(159,208,255,.55)';
	else if (b.kind === 'pulsar') bg = 'background:#f4ffd9;box-shadow:0 0 0 2px #c8ff2e,0 0 18px 5px rgba(200,255,46,.6)';
	b.dotStyle = bg;
	b.shadeStyle = 'background:linear-gradient(90deg,rgba(0,0,0,0) 0 47%,' + (b.dark || '#222') + ' 47% 100%)';
	return b;
}

const main = bodies
	.filter((b) => b.kind !== 'moon')
	.map((b, i) => {
		const num = String(i).padStart(2, '0');
		const kindLabel = b.rings ? 'Ringed giant' : b.dwarf ? 'Dwarf planet' : b.rocky ? 'Rocky planet' : KIND_LABEL[b.kind];
		return { ...b, id: b.slug, num, tag: `OBJ ${num} // ${kindLabel} // ${b.category}` };
	});
const siteMoons = bodies.filter((b) => b.kind === 'moon').map((b) => ({ ...b, id: b.slug }));

export const all = [...main, ...postMoons(main.find((b) => b.isBlog)), ...siteMoons].map(decorate);
export const byId = Object.fromEntries(all.map((b) => [b.id, b]));

if (Object.keys(byId).length !== all.length) {
	throw new Error('A post file name collides with a body slug in $lib/site.js');
}
for (const m of all) {
	if (m.kind !== 'moon') continue;
	const host = byId[m.host];
	if (!host) throw new Error(`Moon ${m.id} has no giant called ${m.host}`);
	m.host = host;
	(host.moons ??= []).push(m);
	m.num ??= 'S' + host.moons.length;
}

export const hole = all.find((b) => b.kind === 'hole');
export const orbiters = all.filter((b) => b.kind !== 'hole');
export const moons = all.filter((b) => b.kind === 'moon');
/** Giants with moons (The Log and the ringed giant). */
export const hosts = all.filter((b) => b.moons);
export const blog = all.find((b) => b.isBlog);
export const pulsar = all.find((b) => b.kind === 'pulsar');
export { belt };
