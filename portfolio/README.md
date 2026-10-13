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
- Images and video stay in `static/`.

Every body and post is its own prerendered page, so links to them load straight into that view.

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
  Gravity Well, a slingshot orbit game in `src/lib/game/` with its own page at `/gravity-well`.
  Its code only loads when it opens. `/?comet` sends a comet across straight away.
- `src/lib/fonts/` holds the self-hosted fonts, trimmed to the weights and characters the site uses
  by `scripts/trim-fonts.py` (instructions at the top of the script).
- `src/lib/orbit/system-map.css` holds the map styles, ported from the design mockup.
