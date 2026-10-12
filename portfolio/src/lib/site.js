import resumeUrl from '$lib/assets/DaltonBakerResume.pdf?url';

/**
 * Everything on the system map except the blog posts (those live in $lib/posts).
 *
 * Each body's `slug` is its URL: /about, /reg-x-timing, /log, ...
 *
 * `body` is the card text: a string, or an array of paragraphs. [Text](/slug) inside it links to
 * another body or post. `contact` adds a Contact section above the card's links.
 *
 * Orbit fields: `t` is the orbit radius from 0 (innermost) to 1 (outermost),
 * `phase` is the starting angle in radians, `size` is the diameter in px.
 * The inner, `rocky` planets sit inside the asteroid belt; rocks sit in the belt itself (keep their `t`
 * within `belt`); everything else orbits beyond it.
 */

const L = (label, href) => ({ label, href });
const F = (k, v) => ({ k, v });

const github = L('GitHub', 'https://github.com/dalton-baker');
const linkedin = L('LinkedIn', 'https://www.linkedin.com/in/dalton-baker');
const resume = L('Résumé', resumeUrl);
const email = L('Email', 'mailto:dalton.s.baker@gmail.com');

/** The asteroid belt: centre orbit and how far its particles spread either side. */
export const belt = { t: 0.36, spread: 0.055 };

export const bodies = [
	{
		slug: 'about', kind: 'hole', name: 'About', category: 'About',
		body: [
			'I grew up in Rapid City, South Dakota, and spent nine years working in pawn shops and precious metals before making the jump into software.',
			'I graduated from South Dakota Mines in 2022, spent two and a half years at Innovative Systems in Mitchell, and eventually moved back home to work at [Omnitech](/omnitech).',
			'Along the way, I’ve done a lot of freelance work for small businesses. I also co-founded [Reg X Timing](/reg-x-timing), started timing races, and bought [Best Choice Pawn](/best-choice-pawn) with my best friend.',
			'I have a lot of hobbies and probably way too many side projects. Quite a few of them are floating around this site, so click around and see what you find!'
		],
		facts: [
			F('Day job', 'Software engineer, Omnitech Inc.'),
			F('Based', 'Rapid City, SD'),
			F('Degree', 'B.S. Computer Science, SD Mines'),
			F('Stack', 'C# · ASP.NET Core · Blazor · SvelteKit · Cloudflare')
		],
		contact: 'Want to get in touch? Find me on GitHub or LinkedIn, grab my résumé, or send an email.',
		links: [email, github, linkedin, resume]
	},
	// Inner rocky planets
	{
		slug: 'omnitech', kind: 'planet', rocky: true, name: 'Omnitech', category: 'Day job',
		t: 0, phase: 1.4, size: 17, base: '#6fa8ff', dark: '#2a4a9c',
		body: [
			'I joined Omnitech’s Rapid City office in 2024. As a software engineer, I work directly with clients across a variety of industries, building solutions to their unique problems.',
			'I really enjoy contracting, especially getting to work directly with the people and businesses I’m building software for.'
		],
		links: [L('omnitech-inc.com', 'https://omnitech-inc.com/')]
	},
	{
		slug: 'reg-x-timing', kind: 'planet', rocky: true, ring: true, name: 'Reg X Timing', category: 'Business',
		t: 0.1, phase: 5.3, size: 20, base: '#ff5a1f', dark: '#9c2706',
		body: [
			'I co-founded Reg X Timing in 2024 with my mentor and first boss in software engineering. We spent our first year building our race registration and timing platform.',
			'In 2025, we timed our first event, the Pure Pactola open swim race. In 2026, we picked up a couple more clients and timed six races throughout the season.',
			'It’s been pretty cool watching something we built from scratch turn into a real business.'
		],
		links: [L('regxtiming.com', 'https://regxtiming.com')]
	},
	{
		slug: 'best-choice-pawn', kind: 'planet', rocky: true, name: 'Best Choice Pawn', category: 'Business',
		t: 0.2, phase: 3.7, size: 18, base: '#ffc93c', dark: '#a8700c',
		body: [
			'I bought Best Choice Pawn with my best friend in November 2025. We actually worked together at another pawn shop nearly a decade earlier.',
			'After we both earned college degrees and built careers in our respective fields, we decided to buy a pawn shop of our own.',
			'We’ve made a lot of improvements since taking over, and were even voted Best Pawn Shop in the Rapid City Journal’s 2026 Best of the Black Hills!'
		],
		links: [L('bestchoicepawn.com', 'https://bestchoicepawn.com/')]
	},
	// Asteroid belt
	{
		slug: 'web-tools', kind: 'rock', name: 'Web Tools', category: 'Tool',
		t: 0.32, phase: 1.2, size: 10, base: '#b9b2a8', dark: '#56504a',
		body: 'A browser-based, locally-running collection of web dev tools, including image utilities for icons, WebP conversions, and more.',
		links: [L('tools.dalt.dev', 'https://tools.dalt.dev/')]
	},
	{
		slug: 'cosmos-db-query-converter', kind: 'rock', name: 'Cosmos DB Query Converter', category: 'Package',
		t: 0.36, phase: 3.1, size: 9, base: '#c9c1d6', dark: '#5a5268',
		body: 'A lightweight NuGet package for writing native Cosmos DB SQL queries with automatic parameterization.',
		links: [L('NuGet', 'https://www.nuget.org/packages/DBaker.CosmosDbQueryConverter')]
	},
	{
		slug: 'dependency-registration-attributes', kind: 'rock', name: 'Dependency Registration Attributes', category: 'Package',
		t: 0.4, phase: 5.0, size: 11, base: '#a9b8ad', dark: '#4b5a4f',
		body: 'A lightweight NuGet package that simplifies dependency injection by letting you register services using C# attributes.',
		links: [L('NuGet', 'https://www.nuget.org/packages/DBaker.DepRegAttributes')]
	},
	// Outer system
	{
		slug: 'metals-market-display', kind: 'planet', name: 'Metals Market Display', category: 'Live site',
		t: 0.5, phase: 0.9, size: 16, base: '#d5dae6', dark: '#535b6e',
		body: 'Displays live gold and silver prices with automatic updates. Designed for display in coin and pawn shops.',
		facts: [F('Runs on', 'Cloudflare Workers · R2')],
		links: [L('metalsmarketdisplay.com', 'https://metalsmarketdisplay.com/'), { label: 'The LED sign story', href: '/led-sign', internal: true }]
	},
	{
		slug: 'heartland-tanks', kind: 'planet', name: 'Heartland Tanks', category: 'Live site',
		t: 0.6, phase: 2.4, size: 15, base: '#8fd67c', dark: '#30692a',
		body: 'Custom website for a South Dakota-based tire tank manufacturer. Built for simplicity, performance, and easy maintenance.',
		links: [L('heartlandtanks.com', 'https://heartlandtanks.com/')]
	},
	{
		slug: 'lottery-pool-tracker', kind: 'planet', name: 'Lottery Pool Tracker', category: 'Live site',
		t: 0.7, phase: 4.4, size: 16, base: '#b18cff', dark: '#4a2f8a',
		body: 'Tracks contributions, winnings, and payouts for lottery pools shared across clubs.',
		facts: [F('Runs on', 'Svelte SSR · Cloudflare Workers')],
		links: [L('lotterypooltracker.com', 'https://lotterypooltracker.com/')]
	},
	{
		slug: 'log', kind: 'giant', isBlog: true, name: 'The Log', category: 'Blog',
		t: 0.8, phase: 2.9, size: 34, dark: 'rgba(40,6,40,.72)',
		body: 'Write-ups of things I’ve built. Every moon is a post: pick one below, or tap the moons directly while you’re in orbit.',
		links: []
	},
	{
		slug: 'department-of-truth', kind: 'planet', name: 'Dalton’s Department of Truth', category: 'Blog',
		t: 0.9, phase: 0.3, size: 14, base: '#3ddbc4', dark: '#0e6b5f',
		body: 'A tongue-in-cheek conspiracy blog exploring absurd ideas.',
		links: [L('truth.dalt.dev', 'https://truth.dalt.dev')]
	},
	{
		slug: 'state-your-name', kind: 'star', rays: true, name: 'State Your Name', category: 'Game',
		t: 1, phase: 5.9, size: 14, swatch: '#9fd0ff',
		body: 'A space exploration idle game, currently in development. Explore the cosmos at your own pace.',
		links: [L('Play the game', 'https://state-your-name.dalt.dev/')]
	}
];
