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
- `src/lib/orbit/engine.js` runs the per-frame animation: orbits, camera, the WebGL black hole and
  the 2D effects canvas.
- `src/lib/orbit/system-map.css` holds the map styles, ported from the design mockup.
