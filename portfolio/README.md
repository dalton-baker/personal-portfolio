# daltonsbaker.com

Personal portfolio: an interactive "system map" built with SvelteKit, prerendered with
`adapter-static`, and served from Cloudflare Workers static assets.

## Developing

```sh
npm ci
npm run dev       # local dev server
npm run build     # prerender every page to dist/
npm run preview   # build, then serve dist/ with wrangler
```

## Content

- **Planets and other bodies** live in `src/lib/site.js`. Each body's `slug` is its URL
  (`/reg-x-timing`, `/log`, `/about`, ...). Add an entry there to put something new in orbit.
- **Posts** ("The Log") are the `.svelte` files in `src/lib/posts/`. The file name is the URL
  (`telescope.svelte` is served at `/telescope`), and each post exports a `meta` block with its
  title, date, summary and hero image. Each post becomes a moon of The Log automatically.
  Use `Gallery` for image grids; clicking a thumbnail opens it full screen.
- **Recipes** are the `.js` files in `src/lib/recipes/` (`chili.js` is served at `/chili`). Each one
  exports its title, a short intro, what it makes, prep and cooking times, and lists of ingredients,
  steps and notes (the fields are listed in `src/lib/recipes/index.js`). Recipes are moons of The Log
  too, after the posts, listed under their own heading in its card, and open in the same reader.
- Photos live in `src/lib/images/` and are referred to by their path there, like
  `/telescope-build/first-assembly.jpeg`. At build time `@sveltejs/enhanced-img` resizes each one to a
  few widths and converts it to WebP (with a JPEG fallback); the widths and quality are set in
  `src/lib/images/index.js`. Use lowercase extensions (`.jpeg`, `.jpg`, `.png`), since the plugin skips
  `.JPG`, and keep PNGs opaque. Videos stay in `static/`.

Every body, post and recipe is its own prerendered page, so links to them load straight into that view.

## For search engines and AI agents

The map is built for people; these give crawlers and agents the same content as plain text. All of
them are generated at build time from `site.js` and the posts, so new bodies and posts show up
automatically:

- `/sitemap.xml` lists every page (and `robots.txt` points to it).
- `/llms.txt` ([llmstxt.org](https://llmstxt.org)) is a short index of the site; `/llms-full.txt` has
  every page in full.
- Every map page has a Markdown copy at its address plus `.md` (`/about.md`, `/telescope.md`, and
  `/index.md` for home), linked from the page with `<link rel="alternate" type="text/markdown">`.
  Posts are rendered and converted with turndown, so galleries become image and video links.
- `/.well-known/ard.json` is the [Agentic Resource Discovery](https://agenticresourcediscovery.org/spec/)
  manifest, also served at its old name `/.well-known/ai-catalog.json`, which Lighthouse 13.5 reads.
  Its one entry is a small Agent Skill (`/.well-known/skills/dalton-baker/SKILL.md`) that points agents
  at the files above.
- Every page's `<head>` carries a canonical URL, Open Graph tags and schema.org JSON-LD
  (`src/lib/head.js`): a Person and WebSite on every page, plus a ProfilePage, BlogPosting, Blog, Recipe or
  WebPage about the body's project.

The text files are folded to plain ASCII, because some clients guess the wrong encoding for `.txt` and
`.md`. The code is in `src/lib/server/agents.js` and the routes next to it in `src/routes/`. Unknown URLs
get a real 404 (`not_found_handling: "404-page"` in `wrangler.jsonc`) rather than the home page, so
crawlers don't index missing pages as copies of it.

## How it fits together

- `src/routes/[[slug]]/` is the only map route. Navigating between bodies and posts keeps the
  same component mounted, so the animation continues while the URL changes.
- `src/lib/components/SystemMap.svelte` renders the map UI, the info card and the post reader.
- `src/lib/orbit/engine.js` runs the per-frame animation: orbits, camera and three canvases, from the
  back: the starfield, the WebGL black hole (a box around the hole, at full resolution) and the 2D
  effects (orbits, belt, rings). Planets and moons are HTML elements it moves and scales.
- `src/lib/orbit/starfield.js` draws the stars and film grain, in a worker
  (`starfield.worker.js`, on an OffscreenCanvas) where the browser supports it; `starfield-host.js`
  starts it. `blackhole.js` holds the black hole shader, which the game uses too.
- Now and then a comet swings past the black hole (`engine.js`, `comet.js`); catching it opens
  Slingshot, an orbit game in `src/lib/game/` with its own page at `/slingshot`.
  Its code only loads when it opens. `/?comet` sends a comet across straight away.
- `src/lib/fonts/` holds the self-hosted fonts, trimmed to the weights and characters the site uses
  by `scripts/trim-fonts.py` (instructions at the top of the script).
- `src/lib/orbit/system-map.css` holds the map styles, ported from the design mockup.
