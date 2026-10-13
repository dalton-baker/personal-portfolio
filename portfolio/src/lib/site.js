import resumeUrl from '$lib/assets/DaltonBakerResume.pdf?url';

/**
 * Everything on the system map except the blog posts (those live in $lib/posts).
 *
 * Each body's `slug` is its URL: /about, /reg-x-timing, /log, ... `name` titles its card; an optional
 * shorter `label` is used for its name on the map (hover and scan labels).
 *
 * `body` is the card text: a string, or an array of paragraphs. [Text](/slug) inside it links to
 * another body or post. `contact` adds a Contact section above the card's links.
 *
 * Orbit fields: `t` is the orbit radius from 0 (innermost) to 1 (outermost),
 * `phase` is the starting angle in radians, `size` is the diameter in px.
 * The inner, `rocky` planets sit inside the asteroid belt; rocks sit in the belt itself (keep their `t`
 * within `belt`); everything else orbits beyond it. Other looks: `satellite` (a large decorative moon,
 * like Earth's; it can't be selected), `dwarf` (a tiny icy world) and `surface` (CSS background layers
 * drawn over `base`). `zoom` multiplies the camera zoom when the body is selected, for small ones.
 *
 * Giants have selectable moons, listed in their card. The Log's moons are the blog posts; other moons
 * are bodies with `kind: 'moon'` and `host` set to the giant's slug, orbiting at `mt`. A giant with
 * `rings` draws them as [inner, outer, opacity, detail] bands measured in planet radii, and its moons'
 * `mt` uses the same unit, so they can sit in the gaps; `detail` bands only fade in as the camera zooms
 * closer, keeping the overview reserved. A body with `barycenter` and one moon is a binary pair, like Pluto
 * and Charon: both circle a point `barycenter` planet radii from the planet's centre, and the moon's `mt`
 * is its distance from that point.
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
		slug: 'reg-x-timing', kind: 'planet', rocky: true, satellite: true, name: 'Reg X Timing', category: 'Business',
		t: 0.1, phase: 5.3, size: 20, base: '#ff5a1f', dark: '#9c2706',
		body: [
			'I co-founded Reg X Timing in 2024 with my mentor and first boss in software engineering. We spent our first year building our race registration and timing platform.',
			'In 2025, we timed our first event, the Pure Pactola open swim race. In 2026, we picked up a couple more clients and timed six races throughout the season.',
			'It’s been pretty cool watching something we built from scratch turn into a real business.'
		],
		links: [L('regxtiming.com', 'https://regxtiming.com')]
	},
	{
		slug: 'best-choice-pawn', kind: 'planet', rocky: true, satellite: true, name: 'Best Choice Pawn', category: 'Business',
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
		body: [
			'A browser-based, locally-running collection of web dev tools, including image utilities for icons, WebP conversions, and more.',
			'I mostly built this for myself. I got tired of searching for simple tools online and ending up on sketchy websites packed with ads. So I started making my own and putting them all in one place.'
		],
		links: [L('tools.dalt.dev', 'https://tools.dalt.dev/')]
	},
	{
		slug: 'cosmos-db-query-converter', kind: 'rock', name: 'Cosmos DB Query Converter', label: 'Cosmos Query NuGet', category: 'Package',
		t: 0.36, phase: 3.1, size: 9, base: '#c9c1d6', dark: '#5a5268',
		body: 'A lightweight NuGet package for writing native Cosmos DB SQL queries with automatic parameterization.',
		links: [L('NuGet', 'https://www.nuget.org/packages/DBaker.CosmosDbQueryConverter')]
	},
	{
		slug: 'dependency-registration-attributes', kind: 'rock', name: 'Dependency Registration Attributes', label: 'DI Attributes NuGet', category: 'Package',
		t: 0.4, phase: 5.0, size: 11, base: '#a9b8ad', dark: '#4b5a4f',
		body: 'A lightweight NuGet package that simplifies dependency injection by letting you register services using C# attributes.',
		links: [L('NuGet', 'https://www.nuget.org/packages/DBaker.DepRegAttributes')]
	},
	// Outer system
	{
		slug: 'log', kind: 'giant', isBlog: true, name: 'The Log', category: 'Blog',
		t: 0.6, phase: 2.9, size: 34, dark: 'rgba(40,6,40,.72)',
		body: 'Write-ups of things I’ve built. Every moon is a post: pick one below, or tap the moons directly while you’re in orbit.',
		moonsLabel: 'Posts in orbit',
		links: []
	},
	{
		slug: 'live-sites', kind: 'giant', name: 'Live Sites', category: 'Websites',
		t: 0.87, phase: 0.6, size: 18, swatch: '#e8c98e', dark: 'rgba(60,38,8,.7)',
		surface: 'repeating-linear-gradient(176deg,#f2deaa 0 4px,#dcbb7c 4px 7px,#ead09a 7px 11px,#c9a161 11px 13px)',
		body: 'Websites and apps I’ve built that are live right now. Every moon is a site: pick one below, or tap the moons directly while you’re in orbit.',
		moonsLabel: 'Sites in orbit',
		// Saturn-style rings, in planet radii: a clear gap, the faint C ring, the bright B ring, a narrow
		// Cassini-style division, the A ring split by a narrow Encke-style gap, a thin F ring and a faint,
		// wide E ring. Two pinpoint moons orbit in the narrow gaps, the others just outside.
		rings: [[1.45, 1.75, 0.2], [1.75, 2.3, 0.52], [2.45, 2.67, 0.38], [2.77, 2.95, 0.34], [3.05, 3.09, 0.45, true], [3.5, 4.7, 0.07, true]],
		links: []
	},
	{
		slug: 'metals-market-display', kind: 'moon', host: 'live-sites', name: 'Metals Market Display', category: 'Live site',
		mt: 3.28, phase: 0.9, size: 3.5, base: '#d5dae6', dark: '#535b6e',
		body: 'Displays live gold and silver prices with automatic updates. Designed for display in coin and pawn shops.',
		facts: [F('Runs on', 'Cloudflare Workers · R2')],
		links: [L('metalsmarketdisplay.com', 'https://metalsmarketdisplay.com/'), { label: 'The LED sign story', href: '/led-sign', internal: true }]
	},
	{
		slug: 'heartland-tanks', kind: 'moon', host: 'live-sites', name: 'Heartland Tanks', category: 'Live site',
		mt: 2.375, phase: 2.6, size: 1.4, base: '#8fd67c', dark: '#30692a',
		body: 'Custom website for a South Dakota-based tire tank manufacturer. Built for simplicity, performance, and easy maintenance.',
		facts: [F('Runs on', 'Prerendered SvelteKit · Cloudflare')],
		links: [L('heartlandtanks.com', 'https://heartlandtanks.com/')]
	},
	{
		slug: 'lottery-pool-tracker', kind: 'moon', host: 'live-sites', name: 'Lottery Pool Tracker', category: 'Live site',
		mt: 3.95, phase: 4.3, size: 3, base: '#b18cff', dark: '#4a2f8a',
		body: 'Tracks contributions, winnings, and payouts for lottery pools shared across clubs.',
		facts: [F('Runs on', 'Svelte SSR · Cloudflare Workers')],
		links: [L('lotterypooltracker.com', 'https://lotterypooltracker.com/')]
	},
	{
		slug: 'department-of-truth', kind: 'moon', host: 'live-sites', name: 'Dalton’s Department of Truth', category: 'Blog',
		mt: 2.72, phase: 5.7, size: 1.2, base: '#3ddbc4', dark: '#0e6b5f',
		body: 'A tongue-in-cheek conspiracy blog exploring absurd ideas.',
		facts: [F('Runs on', 'SvelteKit · Cloudflare · D1 · R2')],
		links: [L('truth.dalt.dev', 'https://truth.dalt.dev')]
	},
	{
		slug: 'omniscreenz', kind: 'moon', host: 'live-sites', name: 'OmniScreenz', category: 'Live site',
		mt: 4.45, phase: 1.9, size: 2.6, base: '#ffb35c', dark: '#8a4a12',
		body: 'I built this website for a coworker at [Omnitech](/omnitech). He makes screensavers and video games, and I wanted him to have a place to show them off.',
		facts: [F('Runs on', 'SvelteKit · Cloudflare · D1 · R2')],
		links: [L('omniscreenz.com', 'https://omniscreenz.com/')]
	},
	// A Pluto–Charon style binary on the outermost orbit: the game, and its screensaver as the moon.
	{
		slug: 'state-your-name', kind: 'planet', dwarf: true, barycenter: 1.35, name: 'State Your Name', category: 'Game',
		t: 1, phase: 5.9, size: 9, zoom: 1.8, base: '#e2cfb2', dark: '#4a3e34',
		// A bright, heart-shaped plain and darker reddish-brown lowlands, like Pluto's.
		surface: 'radial-gradient(ellipse 26% 22% at 52% 50%,rgba(255,252,245,.85) 0 70%,transparent 100%),radial-gradient(ellipse 22% 20% at 68% 58%,rgba(255,252,245,.8) 0 70%,transparent 100%),radial-gradient(ellipse 46% 22% at 30% 72%,rgba(112,56,38,.5) 0 60%,transparent 100%)',
		body: 'A space exploration idle game, currently in development. Explore the cosmos at your own pace.',
		moonsLabel: 'Moon',
		links: [L('Play the game', 'https://state-your-name.dalt.dev/')]
	},
	{
		slug: 'state-your-name-screensaver', kind: 'moon', host: 'state-your-name', name: 'State Your Name Screensaver', category: 'Screensaver',
		mt: 2.45, phase: 0.8, mspeed: 0.2, size: 4.6, base: '#bcb8b3', dark: '#3c3a38',
		// Grey, with a reddish polar cap like Charon's.
		surface: 'radial-gradient(ellipse 46% 26% at 50% 6%,rgba(122,52,40,.6) 0 60%,transparent 100%)',
		body: 'A screensaver I made based on State Your Name. It’s on [OmniScreenz](/omniscreenz) with the rest.',
		facts: [F('Platform', 'Windows · MonoGame')],
		links: [{ label: 'omniscreenz.com', href: 'https://omniscreenz.com/s/state-your-name', cta: 'Get the screensaver' }]
	}
];
