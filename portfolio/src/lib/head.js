import { byId, blog } from '$lib/orbit/system.js';
import { game } from '$lib/game';
import { origin, person } from '$lib/site.js';

/**
 * What goes in a map page's <head> besides the visible card: title, description, canonical address,
 * Open Graph tags and schema.org structured data (JSON-LD), so search engines and AI agents can tell
 * what each page is about. `slug` is null for the home page.
 */

const DEFAULT_DESCRIPTION = 'Dalton Baker: software engineer, maker, and builder of things both useful and ridiculous.';

const PERSON_ID = `${origin}/#person`;
const SITE_ID = `${origin}/#website`;

const personNode = {
	'@type': 'Person',
	'@id': PERSON_ID,
	name: person.name,
	url: `${origin}/`,
	description: person.summary,
	jobTitle: person.jobTitle,
	worksFor: { '@type': 'Organization', ...person.worksFor },
	alumniOf: { '@type': 'CollegeOrUniversity', ...person.alumniOf },
	homeLocation: { '@type': 'Place', name: person.homeLocation },
	knowsAbout: person.knowsAbout,
	email: person.email,
	sameAs: person.profiles.map((p) => p.href)
};

const siteNode = {
	'@type': 'WebSite',
	'@id': SITE_ID,
	url: `${origin}/`,
	name: person.name,
	description: DEFAULT_DESCRIPTION,
	inLanguage: 'en',
	author: { '@id': PERSON_ID },
	publisher: { '@id': PERSON_ID }
};

/** schema.org type of the thing a body's page describes, by its category. */
const THING = {
	'Day job': 'Organization',
	Business: 'Organization',
	Tool: 'WebApplication',
	Package: 'SoftwareApplication',
	'Live site': 'WebSite',
	Blog: 'Blog',
	Game: 'VideoGame',
	Screensaver: 'SoftwareApplication'
};

/** Where a page's Markdown copy lives (built by $lib/server/agents.js): /about.md, and /index.md for home. */
export const markdownPath = (slug) => `/${slug ?? 'index'}.md`;

const abs = (src) => (src.startsWith('/') ? origin + src : src);

/** The thing a body is about, with its own address (the body's first outside link). */
function thing(b) {
	const type = THING[b.category];
	if (!type) return null;
	const url = b.links.find((l) => !l.internal && l.href.startsWith('http'))?.href;
	const node = { '@type': type, name: b.name, ...(url && { url }) };
	if (type === 'Organization') return node;
	return { ...node, author: { '@id': PERSON_ID } };
}

function pageNode(slug, url, h) {
	const page = { '@id': url, url, name: h.title, description: h.description, isPartOf: { '@id': SITE_ID } };
	if (!slug) return { '@type': 'WebPage', ...page, about: { '@id': PERSON_ID } };
	if (slug === game.slug) {
		return { '@type': 'WebPage', ...page, about: { '@type': 'VideoGame', name: game.title, description: game.description, url, gamePlatform: 'Web browser', author: { '@id': PERSON_ID } } };
	}
	const b = byId[slug];
	if (b.kind === 'hole') return { '@type': 'ProfilePage', ...page, mainEntity: { '@id': PERSON_ID } };
	if (b.post) {
		const p = b.post;
		return {
			'@type': 'BlogPosting',
			'@id': `${url}#post`,
			mainEntityOfPage: { '@type': 'WebPage', ...page },
			headline: p.title,
			description: p.dek,
			datePublished: p.date.slice(0, 10),
			author: { '@id': PERSON_ID },
			isPartOf: { '@id': `${origin}/${blog.id}#blog` },
			...(!p.hero.video && { image: abs(p.hero.src) })
		};
	}
	if (b.recipe) {
		const r = b.recipe;
		return {
			'@type': 'Recipe',
			'@id': `${url}#recipe`,
			mainEntityOfPage: { '@type': 'WebPage', ...page },
			name: r.title,
			description: r.dek,
			author: { '@id': PERSON_ID },
			...(r.makes && { recipeYield: r.makes }),
			recipeIngredient: r.ingredients.flatMap((g) => g.items),
			// Titled groups of steps become sections; an untitled group is just its steps.
			recipeInstructions: r.steps.flatMap((g) => {
				const steps = g.items.map((text) => ({ '@type': 'HowToStep', text }));
				return g.title ? [{ '@type': 'HowToSection', name: g.title, itemListElement: steps }] : steps;
			}),
			...(r.hero && { image: abs(r.hero.src) })
		};
	}
	if (b.isBlog) {
		return {
			'@type': 'Blog',
			'@id': `${url}#blog`,
			mainEntityOfPage: { '@type': 'CollectionPage', ...page },
			name: b.name,
			description: b.summary,
			author: { '@id': PERSON_ID },
			blogPost: b.moons.filter((m) => m.post).map((m) => ({ '@type': 'BlogPosting', '@id': `${origin}/${m.id}#post`, headline: m.name, url: `${origin}/${m.id}` })),
			hasPart: b.moons.filter((m) => m.recipe).map((m) => ({ '@type': 'Recipe', '@id': `${origin}/${m.id}#recipe`, name: m.name, url: `${origin}/${m.id}` }))
		};
	}
	if (b.moons) return { '@type': 'CollectionPage', ...page, about: b.moons.map(thing).filter(Boolean) };
	const about = thing(b);
	return { '@type': 'WebPage', ...page, ...(about && { about }) };
}

/** Title, description and the rest of a page's head, or null for a slug that isn't a page. */
export function pageHead(slug) {
	let h;
	if (!slug) h = { title: 'Dalton Baker | Portfolio', description: DEFAULT_DESCRIPTION };
	else if (slug === game.slug) h = { title: `${game.title} | Dalton Baker`, description: game.description };
	else {
		const b = byId[slug];
		if (!b) return null;
		if (b.post) h = { title: `${b.post.pageTitle} | Dalton Baker`, description: b.post.dek, type: 'article', image: !b.post.hero.video && abs(b.post.hero.src) };
		else if (b.recipe) h = { title: `${b.recipe.title} | Dalton Baker`, description: b.recipe.dek, type: 'article', image: b.recipe.hero && abs(b.recipe.hero.src) };
		else if (b.kind === 'hole') h = { title: 'About | Dalton Baker', description: b.summary, type: 'profile' };
		else h = { title: `${b.name} | Dalton Baker`, description: b.summary };
	}
	const url = `${origin}/${slug ?? ''}`;
	const graph = { '@context': 'https://schema.org', '@graph': [siteNode, personNode, pageNode(slug, url, h)] };
	return {
		...h,
		url,
		type: h.type ?? 'website',
		markdown: slug === game.slug ? null : markdownPath(slug),
		// Escape `<` so text in the data can't close the script tag early.
		jsonLd: JSON.stringify(graph).replace(/</g, '\\u003c')
	};
}
