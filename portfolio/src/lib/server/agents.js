// The plain-text side of the site, for search engines and AI agents: /sitemap.xml, /llms.txt
// (https://llmstxt.org), /llms-full.txt, a Markdown copy of every page (/about.md, /telescope.md, ...)
// and the agent discovery manifest (/.well-known/ard.json). All of it is built from the same data as the
// map, so it can't drift from the pages. Server-only: turndown and the post renders stay out of the
// browser bundle.
import { render } from 'svelte/server';
import TurndownService from 'turndown';
import { all, byId, hole, blog } from '$lib/orbit/system.js';
import { game } from '$lib/game';
import { origin, person, resumePdf, resumeUrl } from '$lib/site.js';
import { markdownPath } from '$lib/head.js';

/** Every page with its own URL, in the order llms-full.txt and the sitemap list them. */
export const slugs = [hole.id, ...all.filter((b) => b !== hole).map((b) => b.id)];

const pageUrl = (slug) => `${origin}/${slug ?? ''}`;
const mdUrl = (slug) => origin + markdownPath(slug);

/** A link as Markdown sees it: pages go to their Markdown copy, site files get the full address. */
function href(url) {
	if (url === resumeUrl) return origin + resumePdf;
	if (!url.startsWith('/')) return url;
	const slug = url.slice(1).split(/[?#]/)[0];
	return byId[slug] ? mdUrl(slug) : origin + url;
}

const link = (text, url) => `[${text}](${href(url)})`;

// Clients guess the encoding of .txt and .md files differently (some ignore the charset), so swap
// typographic characters for plain ASCII and strip accents.
const ASCII = { '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '--', '…': '...', '·': '-', '×': 'x', '→': '->', '←': '<-', 'µ': 'u', 'μ': 'u', '°': ' degrees ', '\u00a0': ' ' };
const NON_ASCII = new RegExp(`[${Object.keys(ASCII).join('')}]`, 'g');
const FRACTIONS = { '¼': '1/4', '½': '1/2', '¾': '3/4' };

function toAscii(text) {
	return text
		.replaceAll(' · ', ', ')
		// 2½ lb -> 2 1/2 lb
		.replace(/(\d?)([¼½¾])/g, (m, whole, f) => (whole ? whole + ' ' : '') + FRACTIONS[f])
		.replace(NON_ASCII, (c) => ASCII[c])
		.normalize('NFKD')
		.replace(/\p{M}/gu, '');
}

/** Card text (paragraphs of { text, href? } segments) as Markdown paragraphs. */
const paras = (list) => list.map((segs) => segs.map((s) => (s.href ? link(s.text, s.href) : s.text)).join(''));

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });
turndown.addRule('link', {
	filter: (node) => node.nodeName === 'A' && !!node.getAttribute('href'),
	replacement: (content, node) => link(content, node.getAttribute('href'))
});
turndown.addRule('image', {
	filter: 'img',
	replacement: (content, node) => `![${node.getAttribute('alt') ?? ''}](${href(node.getAttribute('src'))})`
});
// Gallery thumbnails are buttons around an image: give each its own line.
turndown.addRule('thumb', { filter: 'button', replacement: (content) => `\n\n${content}\n\n` });
turndown.addRule('video', {
	filter: 'video',
	replacement: (content, node) => {
		const src = node.getAttribute('src') ?? node.querySelector('source')?.getAttribute('src');
		return src ? `\n\n[Video: ${src.split('/').pop()}](${href(src)})\n\n` : '';
	}
});

function media(m) {
	return m.video ? `[Video: ${m.src.split('/').pop()}](${href(m.src)})` : `![${m.alt ?? ''}](${href(m.src)})`;
}

/** The post's own text, rendered from its component and converted to Markdown. */
function postBody(post) {
	const { body } = render(post.component);
	return turndown.turndown(body).replace(/^(\s*)-\s+/gm, '$1- ').replace(/\n{3,}/g, '\n\n').trim();
}

function postMarkdown(b) {
	const p = b.post;
	return [
		`# ${p.title}`,
		`By ${person.name}, ${p.displayDate}. ${p.mins} min read. Post ${p.n} in ${link(blog.name, `/${blog.id}`)}. Web page: ${pageUrl(p.slug)}`,
		`> ${p.dek}`,
		media(p.hero),
		postBody(p)
	].join('\n\n');
}

const items = (list, ordered) => list.map((item, i) => `${ordered ? `${i + 1}.` : '-'} ${item}`).join('\n');

function recipeMarkdown(b) {
	const r = b.recipe;
	return [
		`# ${r.title}`,
		`A recipe by ${person.name}, recipe ${r.n} in ${link(b.host.name, `/${b.host.id}`)}. Web page: ${pageUrl(r.slug)}`,
		`> ${r.dek}`,
		...(r.hero ? [media(r.hero)] : []),
		`- Makes: ${r.makes}\n- Prep: ${r.prep}\n- Cooking: ${r.cook}`,
		'## Ingredients',
		...r.ingredients.map((g) => `### ${g.title}\n\n${items(g.items)}`),
		'## Instructions',
		...r.steps.map((g) => `### ${g.title}\n\n${items(g.items, true)}`),
		...r.tips.map((g) => `## ${g.title}\n\n${items(g.items)}`)
	].join('\n\n');
}

/** A page's Markdown, whatever kind of page it is. */
const markdownOf = (b) => (b.post ? postMarkdown(b) : b.recipe ? recipeMarkdown(b) : bodyMarkdown(b));

function moonList(moons) {
	return moons
		.map((m) => (m.post ? `- ${link(m.name, `/${m.id}`)} (${m.date}): ${m.body}` : `- ${link(m.name, `/${m.id}`)}: ${m.summary}`))
		.join('\n');
}

function bodyMarkdown(b) {
	const about = b === hole;
	const where = b.host ? `${b.category}, listed under ${link(b.host.name, `/${b.host.id}`)}` : b.category;
	const out = [
		`# ${about ? `About ${person.name}` : b.name}`,
		about ? `${person.tagline} Web page: ${pageUrl(b.id)}` : `${where}, from ${person.name}'s portfolio. Web page: ${pageUrl(b.id)}`,
		...paras(b.paras)
	];
	for (const sec of b.sections) out.push(`## ${sec.title}`, ...paras(sec.paras));
	if (b.facts.length) out.push('## Details', b.facts.map((f) => `- ${f.k}: ${f.v}`).join('\n'));
	for (const g of b.moonGroups ?? []) out.push(`## ${g.label.replace(/ in orbit$/, '').replace(/^Moons?$/, 'Related')}`, moonList(g.moons));
	if (b.contact) out.push('## Contact', b.contact);
	if (b.links.length) out.push(...(b.contact ? [] : ['## Links']), b.links.map((l) => `- ${link(l.label, l.href)}`).join('\n'));
	return out.join('\n\n');
}

/** A page's Markdown copy, or null if it has none. The home page's (/index.md) is the llms.txt index. */
export function pageMarkdown(slug) {
	if (slug === 'index') return toAscii(llmsTxt(true)) + '\n';
	const b = byId[slug];
	if (!b) return null;
	return toAscii(markdownOf(b)) + '\n';
}

/** How the map works and where the hidden game is, for the top of llms.txt and llms-full.txt. */
const MAP_INTRO = `The site is an interactive "system map": each planet, moon and asteroid is a page, the blog posts and recipes are moons of a gas giant called The Log. It also hides a game: about once a minute a comet swings past the black hole at the center, and clicking it opens ${link(game.title, `/${game.slug}`)}, a gravity sandbox game (${origin}/?comet sends one straight away).`;

/** One llms.txt line per body. */
const bodyLine = (b) => `- ${link(b.name, `/${b.id}`)}: ${b.post ? `${b.post.dek} (${b.post.displayDate})` : b.summary}`;
const gameLine = `- ${link(game.title, `/${game.slug}`)}: ${game.description} Interactive only, with no Markdown copy.`;

function llmsTxt(home = false) {
	const groups = [
		['Work and businesses', all.filter((b) => b.rocky).map(bodyLine)],
		['Posts', all.filter((b) => b.post).map(bodyLine)],
		['Recipes', all.filter((b) => b.recipe).map(bodyLine)],
		['Websites I built', (all.find((b) => b.rings)?.moons ?? []).map(bodyLine)],
		['Tools and packages', all.filter((b) => b.kind === 'rock').map(bodyLine)],
		['Games', [...all.filter((b) => b.dwarf || b.host?.dwarf).map(bodyLine), gameLine]]
	];
	return [
		`# ${person.name}`,
		`> ${person.summary} This is ${person.name}'s portfolio, daltonsbaker.com.`,
		MAP_INTRO,
		`Every page also has a plain Markdown copy at the same address plus \`.md\`, which the links below point to. Everything in one file: ${link('llms-full.txt', '/llms-full.txt')}.`,
		`- ${link('About Dalton Baker', `/${hole.id}`)}: background, education, résumé facts and contact`,
		...groups.filter(([, lines]) => lines.length).map(([title, lines]) => `## ${title}\n\n${lines.join('\n')}`),
		[
			'## Optional',
			'',
			`- ${link('Résumé (PDF)', resumeUrl)}`,
			...person.profiles.map((p) => `- ${link(p.label, p.href)}`),
			`- ${link('Privacy policy', '/privacyPolicy')}`,
			...(home ? [] : [`- ${link('Sitemap', '/sitemap.xml')}`])
		].join('\n')
	].join('\n\n');
}

export function llmsTxtFile() {
	return toAscii(llmsTxt()) + '\n';
}

/** Every page in full, About first, then the rest of the map and each post in order. */
export function llmsFullTxt() {
	const demote = (md) => md.replace(/^(#{1,5}) /gm, '#$1 ');
	const pages = slugs.map((slug) => demote(markdownOf(byId[slug])));
	const intro = [
		`# ${person.name}: everything on daltonsbaker.com`,
		`> The full text of every page on ${person.name}'s portfolio, one section per page. The short index is ${link('llms.txt', '/llms.txt')}.`,
		MAP_INTRO
	].join('\n\n');
	return toAscii([intro, ...pages].join('\n\n---\n\n')) + '\n';
}

export function sitemapXml() {
	const paths = ['/', ...slugs.map((s) => `/${s}`), `/${game.slug}`, '/privacyPolicy'];
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `\t<url><loc>${origin}${p}</loc></url>`).join('\n')}
</urlset>
`;
}

/** Path of the Agent Skill the discovery manifest points at. */
const skillPath = '/.well-known/skills/dalton-baker/SKILL.md';

/**
 * The Agentic Resource Discovery manifest (https://agenticresourcediscovery.org/spec/), served at
 * /.well-known/ard.json and at its old name, /.well-known/ai-catalog.json, which Lighthouse 13.5 still
 * reads (it also wants `specVersion`). The site has no tools or APIs for agents, so its one entry is
 * a small Agent Skill that tells an agent where to read about Dalton.
 */
export function ardManifest() {
	return {
		specVersion: '1.0',
		entries: [
			{
				identifier: 'urn:air:daltonsbaker.com:skill:dalton-baker',
				displayName: `About ${person.name}`,
				type: 'text/markdown; profile="urn:air:agent-skills"',
				url: origin + skillPath,
				description: `Look up ${person.name}'s background, work, businesses, projects and blog posts, and contact details, from the portfolio at daltonsbaker.com.`,
				representativeQueries: [
					'Who is Dalton Baker?',
					'What projects has Dalton Baker built?',
					'Where does Dalton Baker work?',
					'How do I contact Dalton Baker?'
				],
				tags: ['portfolio', 'software engineer', 'Rapid City']
			}
		]
	};
}

export function skillMd() {
	return toAscii(`---
name: dalton-baker
description: Look up ${person.name}. ${person.summary} Use when asked who Dalton Baker is, what Dalton has built or written, where Dalton works, or how to get in touch.
---

# About ${person.name}

${person.name}'s portfolio, ${origin}, is an interactive map built for people. Read its plain-text versions instead:

1. Fetch ${origin}/llms.txt for a short index: a summary of Dalton and one line per page.
2. Fetch a page's Markdown copy (the page address plus \`.md\`, such as ${origin}/about.md) for its full text,
   or ${origin}/llms-full.txt for every page at once.
3. Cite the page itself, without \`.md\`, such as ${origin}/about.

Contact: email ${person.email.replace('mailto:', '')}, or ${person.profiles.map((p) => `${p.label} (${p.href})`).join(', ')}.
`);
}
