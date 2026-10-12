import resumeUrl from '$lib/assets/DaltonBakerResume.pdf?url';

/**
 * Everything on the system map except the blog posts (those live in $lib/posts).
 *
 * Each body's `slug` is its URL: /about, /reg-x-timing, /log, ...
 *
 * Orbit fields: `t` is the orbit radius from 0 (innermost) to 1 (outermost),
 * `phase` is the starting angle in radians, `size` is the diameter in px.
 * Rocks sit in the asteroid belt, so keep their `t` between about 0.40 and 0.49.
 */

const L = (label, href) => ({ label, href });
const F = (k, v) => ({ k, v });

const github = L('GitHub', 'https://github.com/dalton-baker');
const linkedin = L('LinkedIn', 'https://www.linkedin.com/in/dalton-baker');
const resume = L('Résumé', resumeUrl);
const email = L('Email', 'mailto:dalton.s.baker@gmail.com');

export const bodies = [
	{
		slug: 'about', kind: 'hole', name: 'Dalton Baker', category: 'About',
		body: 'Hi, I’m Dalton. Software engineer. Maker. Builder of things both useful and ridiculous.',
		facts: [
			F('Day job', 'Software engineer, Omnitech Inc.'),
			F('Based', 'Rapid City, SD'),
			F('Degree', 'B.S. Computer Science, SD Mines'),
			F('Stack', 'C# · ASP.NET Core · Blazor · SvelteKit · Cloudflare')
		],
		links: [github, linkedin, resume]
	},
	{
		slug: 'best-choice-pawn', kind: 'planet', name: 'Best Choice Pawn', category: 'Business',
		t: 0, phase: 3.7, size: 18, base: '#ffc93c', dark: '#a8700c',
		body: 'Pawn shop located in Rapid City, South Dakota. Buying, selling, and loaning on a wide variety of items.',
		links: [L('bestchoicepawn.com', 'https://bestchoicepawn.com/')]
	},
	{
		slug: 'reg-x-timing', kind: 'planet', ring: true, name: 'Reg X Timing', category: 'Business',
		t: 0.1, phase: 5.3, size: 20, base: '#ff5a1f', dark: '#9c2706',
		body: 'Integrated registration, timing, and results platform designed for small to mid-sized races.',
		links: [L('regxtiming.com', 'https://regxtiming.com')]
	},
	{
		slug: 'metals-market-display', kind: 'planet', name: 'Metals Market Display', category: 'Live site',
		t: 0.2, phase: 0.9, size: 16, base: '#d5dae6', dark: '#535b6e',
		body: 'Displays live gold and silver prices with automatic updates. Designed for display in coin and pawn shops.',
		facts: [F('Runs on', 'Cloudflare Workers · R2')],
		links: [L('metalsmarketdisplay.com', 'https://metalsmarketdisplay.com/'), { label: 'The LED sign story', href: '/led-sign', internal: true }]
	},
	{
		slug: 'heartland-tanks', kind: 'planet', name: 'Heartland Tanks', category: 'Live site',
		t: 0.3, phase: 2.4, size: 15, base: '#8fd67c', dark: '#30692a',
		body: 'Custom website for a South Dakota-based tire tank manufacturer. Built for simplicity, performance, and easy maintenance.',
		links: [L('heartlandtanks.com', 'https://heartlandtanks.com/')]
	},
	{
		slug: 'web-tools', kind: 'rock', name: 'Web Tools', category: 'Tool',
		t: 0.4, phase: 1.2, size: 10, base: '#b9b2a8', dark: '#56504a',
		body: 'A browser-based, locally-running collection of web dev tools, including image utilities for icons, WebP conversions, and more.',
		links: [L('tools.dalt.dev', 'https://tools.dalt.dev/')]
	},
	{
		slug: 'cosmos-db-query-converter', kind: 'rock', name: 'Cosmos DB Query Converter', category: 'Package',
		t: 0.445, phase: 3.1, size: 9, base: '#c9c1d6', dark: '#5a5268',
		body: 'A lightweight NuGet package for writing native Cosmos DB SQL queries with automatic parameterization.',
		links: [L('NuGet', 'https://www.nuget.org/packages/DBaker.CosmosDbQueryConverter')]
	},
	{
		slug: 'dependency-registration-attributes', kind: 'rock', name: 'Dependency Registration Attributes', category: 'Package',
		t: 0.49, phase: 5.0, size: 11, base: '#a9b8ad', dark: '#4b5a4f',
		body: 'A lightweight NuGet package that simplifies dependency injection by letting you register services using C# attributes.',
		links: [L('NuGet', 'https://www.nuget.org/packages/DBaker.DepRegAttributes')]
	},
	{
		slug: 'lottery-pool-tracker', kind: 'planet', name: 'Lottery Pool Tracker', category: 'Live site',
		t: 0.6, phase: 4.4, size: 16, base: '#6fa8ff', dark: '#2a4a9c',
		body: 'Tracks contributions, winnings, and payouts for lottery pools shared across clubs.',
		facts: [F('Runs on', 'Svelte SSR · Cloudflare Workers')],
		links: [L('lotterypooltracker.com', 'https://lotterypooltracker.com/')]
	},
	{
		slug: 'log', kind: 'giant', isBlog: true, name: 'The Log', category: 'Blog',
		t: 0.71, phase: 2.2, size: 34, dark: 'rgba(40,6,40,.72)',
		body: 'Write-ups of things I’ve built. Every moon is a post: pick one below, or tap the moons directly while you’re in orbit.',
		links: []
	},
	{
		slug: 'department-of-truth', kind: 'planet', name: 'Dalton’s Department of Truth', category: 'Blog',
		t: 0.82, phase: 0.3, size: 14, base: '#3ddbc4', dark: '#0e6b5f',
		body: 'A tongue-in-cheek conspiracy blog exploring absurd ideas.',
		links: [L('truth.dalt.dev', 'https://truth.dalt.dev')]
	},
	{
		slug: 'state-your-name', kind: 'star', rays: true, name: 'State Your Name', category: 'Game',
		t: 0.91, phase: 5.9, size: 14, swatch: '#9fd0ff',
		body: 'A space exploration idle game, currently in development. Explore the cosmos at your own pace.',
		links: [L('Play the game', 'https://state-your-name.dalt.dev/')]
	},
	{
		slug: 'contact', kind: 'pulsar', name: 'Signal', category: 'Contact',
		t: 1, phase: 4.1, size: 9, swatch: '#c8ff2e',
		body: 'Want to get in touch? Find me on GitHub or LinkedIn, grab my résumé, or send an email.',
		links: [email, github, linkedin, resume]
	}
];
