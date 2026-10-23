<script>
	import '$lib/orbit/system-map.css';
	import { onMount, tick, untrack } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { OrbitEngine } from '$lib/orbit/engine.js';
	import { all, byId, hole, orbiters, blog } from '$lib/orbit/system.js';
	import { posts } from '$lib/posts';
	import { recipes } from '$lib/recipes';
	import Recipe from './Recipe.svelte';
	import { game } from '$lib/game';
	import Lightbox from './Lightbox.svelte';
	import { lightbox } from './lightbox.svelte.js';

	/** The URL segment: a body slug, a post slug, or null for the home page. */
	let { slug = null } = $props();

	/** Posts and recipes (The Log's moons) open in the reader. */
	const readable = (b) => !!(b?.post || b?.recipe);
	const postSlug = (s) => (s && readable(byId[s]) ? s : null);
	const isMoon = (id) => byId[id]?.kind === 'moon';

	let scan = $state(false);
	let noGL = $state(false);
	let ready = $state(false);
	/**
	 * A post or recipe moon picked while orbiting The Log; it expands inside The Log's card without changing
	 * the URL (its own URL opens the reader). Other giants' moons are selected through their URLs.
	 */
	let moonSel = $state(null);
	/** The post or recipe open in the reader. Lags the URL while the close animation plays. */
	let reading = $state(untrack(() => postSlug(slug)));
	let closing = $state(false);
	let instant = $state(true);
	let readX = $state(0);
	let readY = $state(0);
	/**
	 * Slingshot, the comet's game, open over the map (it lags the URL while its close animation plays).
	 * It opens with an iris from where the comet was caught, or instantly when its page is loaded directly.
	 */
	let playing = $state(untrack(() => slug === game.slug));
	let gameClosing = $state(false);
	let gameInstant = $state(true);
	let gameX = $state(0);
	let gameY = $state(0);
	let gameTimer;

	const sel = $derived.by(() => {
		if (!slug || slug === game.slug) return null;
		if (isMoon(slug)) return slug;
		if (slug === blog.id && moonSel) return moonSel;
		return slug;
	});
	/** The giant whose moons are in play: it, or one of its moons, is selected. */
	const hostId = $derived(sel ? (isMoon(sel) ? byId[sel].host.id : byId[sel]?.moons ? sel : null) : null);
	/** A selected moon is shown as an expanded entry in its giant's card rather than a card of its own. */
	const card = $derived(sel ? byId[isMoon(sel) ? byId[sel].host.id : sel] : null);
	const art = $derived.by(() => {
		if (!reading) return null;
		const b = byId[reading];
		const p = b.post ?? b.recipe;
		// Previous and next step through the posts, or through the recipes.
		const list = b.post ? posts : recipes;
		const i = list.indexOf(p);
		return {
			...p,
			recipe: b.recipe,
			noun: b.post ? 'Post' : 'Recipe',
			n: String(p.n).padStart(2, '0'),
			list,
			prev: list[(i - 1 + list.length) % list.length],
			next: list[(i + 1) % list.length]
		};
	});

	let root, starCanvas, glCanvas, fxCanvas, holeEl, cometEl;
	let readerEl = $state();
	let progEl = $state();
	const els = {};
	let engine;
	let closeTimer;
	/** Path of the page we came from, if we got here by a forward in-app navigation. */
	let cameFrom = null;
	let lastSlug = untrack(() => slug);

	/**
	 * First-visit hint: a "Click me" (or "Tap me") tag on a random planet, until a panel is opened. Opening
	 * one sets a session flag so it doesn't come back during the visit.
	 */
	const HINT_KEY = 'map-hint-done';
	const HINT_BODIES = orbiters.filter((b) => b.kind === 'planet' || b.kind === 'giant');
	let hintId = $state(null);
	let hintVerb = $state('Click');

	function dismissHint() {
		hintId = null;
		try {
			sessionStorage.setItem(HINT_KEY, '1');
		} catch {
			// Storage can be unavailable (private mode, blocked); the hint just goes away for this page view.
		}
	}

	$effect(() => {
		if (sel && hintId) dismissHint();
	});

	function startHint() {
		let done = false;
		try {
			done = sessionStorage.getItem(HINT_KEY) === '1';
		} catch {
			// Treat unavailable storage as a first visit.
		}
		if (sel) dismissHint();
		else if (!done) {
			hintVerb = matchMedia('(pointer: coarse)').matches ? 'Tap' : 'Click';
			hintId = HINT_BODIES[Math.floor(Math.random() * HINT_BODIES.length)].id;
		}
	}

	onMount(() => {
		startHint();
		engine = new OrbitEngine({
			root, starCanvas, glCanvas, fxCanvas, holeEl, cometEl, els,
			getState: () => ({ sel, host: hostId, reading, cover: !!reading || playing, closing: closing || gameClosing, scan }),
			onGLChange: (ok) => (noGL = !ok),
			onReady: () => (ready = true)
		});
		engine.start();
		// /?comet sends one across straight away.
		if (new URLSearchParams(location.search).has('comet')) engine.launchComet();
		return () => {
			engine.destroy();
			clearTimeout(closeTimer);
			clearTimeout(gameTimer);
		};
	});

	afterNavigate(({ from, type }) => {
		cameFrom = type === 'link' || type === 'goto' ? (from?.url.pathname ?? null) : null;
	});

	// React to URL changes: open, switch or close the reader, and drop a moon preview once we leave The Log.
	$effect(() => {
		const next = slug;
		untrack(() => {
			if (next !== lastSlug) onRoute(next);
			lastSlug = next;
		});
	});

	function onRoute(next) {
		if (next === game.slug) {
			openGame();
			return;
		}
		if (playing && !gameClosing) {
			gameClosing = true;
			gameTimer = setTimeout(() => {
				playing = false;
				gameClosing = false;
			}, 430);
		}
		const post = postSlug(next);
		if (post) {
			moonSel = null;
			clearTimeout(closeTimer);
			if (reading && !closing) {
				// Previous/next post: swap the article in place.
				reading = post;
				tick().then(resetReaderScroll);
				return;
			}
			// The iris opens from the post's moon. Clamp that point onto the map: from an off-screen moon (say,
			// following a link from another planet's card) the final circle wouldn't cover the page.
			const p = engine ? engine.screenPos(post) : { x: 0, y: 0 };
			readX = Math.min(Math.max(p.x, 0), root.clientWidth);
			readY = Math.min(Math.max(p.y, 0), root.clientHeight);
			instant = false;
			closing = false;
			reading = post;
			engine?.markRead();
			tick().then(resetReaderScroll);
			return;
		}
		if (reading && !closing) {
			// Leaving a post: keep its moon selected if we land back in The Log.
			const was = reading;
			moonSel = next === blog.id ? was : null;
			closing = true;
			closeTimer = setTimeout(() => {
				reading = null;
				closing = false;
			}, 430);
			return;
		}
		if (next !== blog.id) moonSel = null;
	}

	/** Opens the game with an iris from the comet that was clicked (or the middle of the map). */
	function openGame() {
		clearTimeout(gameTimer);
		if (playing && !gameClosing) return;
		const p = engine?.cometPos() ?? { x: root.clientWidth / 2, y: root.clientHeight / 2 };
		gameX = Math.min(Math.max(p.x, 0), root.clientWidth);
		gameY = Math.min(Math.max(p.y, 0), root.clientHeight);
		gameInstant = false;
		gameClosing = false;
		playing = true;
		engine?.catchComet();
		engine?.markRead();
	}

	/** Back to the map, stepping back through history when that's where the game was opened from. */
	function closeGame() {
		if (!playing || gameClosing) return;
		if (cameFrom === '/') history.back();
		else goto('/', { noScroll: true });
	}

	function resetReaderScroll() {
		if (readerEl) readerEl.scrollTop = 0;
		if (progEl) progEl.style.transform = 'scaleX(0)';
	}

	/** Back to the plain map, stepping back through history when that is where we came from. */
	function closeCard() {
		if (cameFrom === '/') history.back();
		else goto('/', { noScroll: true });
	}

	/** Back to The Log, stepping back through history when that is where the post was opened from. */
	function closeRead() {
		if (!reading || closing) return;
		if (cameFrom === '/' + blog.id) history.back();
		else goto('/' + blog.id, { noScroll: true });
	}

	const plainClick = (e) => !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

	/**
	 * Moon links select the moon and expand its post or recipe in The Log's card; `toggle` (the card's list)
	 * collapses it again on a second click. Modified clicks still open the post or recipe itself.
	 */
	function previewMoon(e, id, toggle = false) {
		if (!plainClick(e)) return;
		e.preventDefault();
		if (slug !== blog.id) goto('/' + blog.id, { noScroll: true });
		moonSel = toggle && moonSel === id ? null : id;
	}

	/** Clicking The Log while one of its moons is selected goes back to The Log itself. */
	function selectLog(e) {
		if (slug !== blog.id || !moonSel || !plainClick(e)) return;
		e.preventDefault();
		moonSel = null;
	}

	// Keep the expanded moon entry in view, e.g. on a phone where the card is a half-height sheet.
	let cardEl = $state();
	$effect(() => {
		if (!isMoon(sel) || !cardEl) return;
		tick().then(() => {
			const item = cardEl?.querySelector('.post-item.on');
			if (!item) return;
			const c = cardEl.getBoundingClientRect();
			const r = item.getBoundingClientRect();
			const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
			if (r.bottom > c.bottom) cardEl.scrollBy({ top: r.bottom - c.bottom + 16, behavior });
			else if (r.top < c.top) cardEl.scrollBy({ top: r.top - c.top - 16, behavior });
		});
	});

	function onReadScroll(e) {
		const el = e.currentTarget;
		const p = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
		if (progEl) progEl.style.transform = 'scaleX(' + Math.min(1, p).toFixed(4) + ')';
	}

	/** Anything on the map that isn't empty space: bodies, buttons, links, the card, the reader, the lightbox. */
	const NOT_SPACE = 'a, button, .card, .mpanel, .reader, .game, .lb';

	/** Clicking empty space on the map leaves whatever is selected and returns to the full system view. */
	function onMapClick(e) {
		if (!sel || reading || e.button !== 0 || e.target.closest(NOT_SPACE)) return;
		closeCard();
	}

	function onKey(e) {
		if (e.key !== 'Escape') return;
		if (lightbox.src) lightbox.src = '';
		else if (playing) closeGame();
		else if (reading) closeRead();
		else if (sel) closeCard();
	}
</script>

<svelte:window onkeydown={onKey} />

<!-- svelte-ignore a11y_click_events_have_key_events (clicking empty space is a mouse shortcut; Escape does the same from the keyboard) -->
<div
	bind:this={root}
	class="bh"
	class:nogl={noGL}
	class:scan
	class:card-open={!!sel}
	class:ready
	onpointermove={(e) => engine?.pointerMove(e)}
	onpointerleave={() => engine?.pointerLeave()}
	onpointerdown={(e) => engine?.pointerDown(e)}
	onpointerup={(e) => engine?.pointerUp(e)}
	onpointercancel={(e) => engine?.pointerUp(e)}
	onpointerover={(e) => engine?.pointerOver(e)}
	onclick={onMapClick}
	role="presentation"
>
	<canvas bind:this={starCanvas} class="starc" aria-hidden="true"></canvas>
	<canvas bind:this={glCanvas} class="glc" aria-hidden="true"></canvas>
	<canvas bind:this={fxCanvas} class="fxc" aria-hidden="true"></canvas>

	<nav class="orbits" aria-label="System map">
		<a
			bind:this={holeEl}
			class="hole-btn"
			class:is-sel={sel === hole.id}
			href="/{hole.id}"
			aria-label={hole.aria}
			data-name={hole.name}
			aria-current={slug === hole.id ? 'page' : undefined}
		>
			<span class="fb"></span>
			<span class="hole-label">{hole.name}</span>
		</a>
		{#each orbiters as b (b.id)}
			<a
				bind:this={els[b.id]}
				class="body {b.kind}"
				class:active={b.kind === 'moon' && b.host.id === hostId}
				class:is-sel={sel === b.id}
				class:hinted={hintId === b.id}
				href="/{b.id}"
				aria-label={b.aria}
				data-name={b.label}
				aria-current={slug === b.id ? 'page' : undefined}
				tabindex={b.kind === 'moon' && b.host.id !== hostId ? -1 : 0}
				onclick={readable(b) ? (e) => previewMoon(e, b.id) : b === blog ? selectLog : undefined}
			>
				<span class="dotwrap" style={b.wrapStyle}>
					{#if b.rays}<span class="rays"></span>{/if}
					<span class="dot" style={b.dotStyle}>
						{#if b.shaded}<span class="shade" style={b.shadeStyle}></span>{/if}
					</span>
					{#if b.sat}
						<span class="sat" style={b.sat.style}><span class="dot" style={b.sat.dotStyle}><span class="shade" style={b.sat.shadeStyle}></span></span></span>
					{/if}
				</span>
				<span class="label"><span class="lname">{b.label}</span></span>
				<span class="tip" aria-hidden="true">{b.label}</span>
				{#if hintId === b.id}
					<span class="hint-tag" aria-hidden="true"
						><span class="hint-bob"
							><span class="hint-text">{hintVerb} me</span
							><svg class="hint-arrow" width="18" height="12" viewBox="0 0 18 12"><path d="M3.5 3h11L9 9z"></path></svg></span
						></span
					>
				{/if}
			</a>
		{/each}
		<!-- The comet: hidden until the engine sends one across (now and then, while the whole map is in view). -->
		<a
			bind:this={cometEl}
			class="body comet"
			href="/{game.slug}"
			aria-label="A comet. Catch it to play {game.title}"
			data-name="Comet"
			style="display:none"
		>
			<span class="comet-core"></span>
			<span class="label"><span class="lname">Comet</span></span>
			<span class="tip" aria-hidden="true">Comet</span>
		</a>
	</nav>

	<header class="hdr">
		<div class="kicker">sys://daltonsbaker.com — system map</div>
		<h1 data-text={'Dalton\nBaker'}>Dalton<br />Baker</h1>
		<p class="tagline">Software engineer. Maker. Builder of things both useful and ridiculous.</p>
		<div class="hdr-actions">{@render scanToggle()}</div>
	</header>

	<!-- A paragraph of { text, href? } segments. -->
	{#snippet richText(para)}{#each para as seg, j (j)}{#if seg.href}<a href={seg.href}>{seg.text}</a>{:else}{seg.text}{/if}{/each}{/snippet}
	<!-- `primary` turns the first link into a "Visit site" button (or its `cta`), like a post's "Read post"; the address is already shown above it. -->
	{#snippet linkButtons(links, primary = false)}
		{#if links.length}
			<div class="links">
				{#each links as l, i (l.href)}
					{#if l.internal}
						<a class="lnk" class:primary={primary && i === 0} href={l.href}>{l.label}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg></a>
					{:else}
						<a class="lnk" class:primary={primary && i === 0} href={l.href} target={l.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener">{primary && i === 0 ? (l.cta ?? 'Visit site') : l.label}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M7 17L17 7"></path><path d="M8 7h9v9"></path></svg></a>
					{/if}
				{/each}
			</div>
		{/if}
	{/snippet}
	{#snippet scanToggle()}
		<button class="scanbtn" class:on={scan} onclick={() => (scan = !scan)} aria-pressed={scan}>
			<span class="frame" aria-hidden="true"></span><span class="led"></span>Scan mode
		</button>
	{/snippet}
	<!-- On desktop the toggle sits under the intro; phones keep it in the top-right corner. -->
	<div class="hud">{@render scanToggle()}</div>

	{#if !sel}
		<section class="mpanel" aria-label="Intro">
			<div class="kicker">sys://daltonsbaker.com</div>
			<h1 data-text="Dalton Baker">Dalton Baker</h1>
			<p class="tagline">Software engineer. Maker. Builder of things both useful and ridiculous.</p>
		</section>
	{/if}

	{#if card && !reading}
		<aside class="card" aria-live="polite" bind:this={cardEl}>
			<div class="card-bar"></div>
			<div class="card-in">
				<div class="card-top">
					<span class="tag">{card.tag}</span>
					<button class="x" onclick={closeCard} aria-label="Close">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6L6 18"></path></svg>
					</button>
				</div>
				<h2>{card.name}</h2>
				{#each card.paras as para, i (i)}
					<p class="desc">{@render richText(para)}</p>
				{/each}
				{#each card.sections as sec (sec.title)}
					<div class="card-h">{sec.title}</div>
					{#each sec.paras as para, i (i)}
						<p class="desc">{@render richText(para)}</p>
					{/each}
				{/each}
				{#if card.facts.length}
					<dl class="facts">
						{#each card.facts as f (f.k)}<div class="fact"><dt>{f.k}</dt><dd>{f.v}</dd></div>{/each}
					</dl>
				{/if}
				{#if card.contact}
					<div class="card-h">Contact</div>
					<p class="desc">{card.contact}</p>
				{/if}
				{@render linkButtons(card.links)}
				{#each card.moonGroups ?? [] as group (group.label)}
					<div class="card-h">{group.label}</div>
					<ul class="posts">
						{#each group.moons as m (m.id)}
							{@const open = sel === m.id}
							<li class="post-item" class:on={open}>
								{#if readable(m)}
									<a class="post" href="/{m.id}" aria-expanded={open} onclick={(e) => previewMoon(e, m.id, true)}>
										<span class="pn">{m.num}</span><span class="pt">{m.name}</span><span class="pd">{m.sub}</span>
									</a>
								{:else}
									<a class="post" href={open ? `/${card.id}` : `/${m.id}`} aria-expanded={open}>
										<span class="pn">{m.num}</span><span class="pt">{m.name}</span><span class="pd">{m.sub}</span>
									</a>
								{/if}
								{#if open}
									<div class="post-more">
										{#if readable(m)}
											<p class="post-dek">{m.body}</p>
											<a class="lnk primary" href="/{m.id}">{m.post ? 'Read post' : 'See recipe'}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg></a>
										{:else}
											{#each m.paras as para, i (i)}<p class="post-dek">{@render richText(para)}</p>{/each}
											{#if m.facts.length}
												<dl class="facts">
													{#each m.facts as f (f.k)}<div class="fact"><dt>{f.k}</dt><dd>{f.v}</dd></div>{/each}
												</dl>
											{/if}
											{@render linkButtons(m.links, true)}
										{/if}
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				{/each}
			</div>
		</aside>
	{/if}

	{#if art}
		<article
			bind:this={readerEl}
			class="reader"
			class:out={closing}
			class:instant
			style={closing ? '--ox:50%;--oy:50%' : `--ox:${Math.round(readX)}px;--oy:${Math.round(readY)}px`}
			onscroll={onReadScroll}
			aria-label={art.title}
		>
			<div class="rbar">
				<button class="rback" onclick={closeRead}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M19 12H5"></path><path d="M11 6l-6 6 6 6"></path></svg>Back to orbit
				</button>
				<span class="rcrumb">The Log // {art.noun} {art.n}</span>
				<div class="rprog"><div bind:this={progEl} class="rprog-fill"></div></div>
			</div>
			<div class="rcol">
				<div class="rkicker"><b>{art.noun} {art.n}</b> · {art.displayDate}{art.mins ? ` · ${art.mins} min read` : ''}</div>
				<h1 class="rtitle">{art.title}</h1>
				<p class="rdek">{art.dek}</p>
				{#if art.hero}
					<figure class="rfig hero">
						{#if art.hero.video}
							<video src={art.hero.src} autoplay loop muted playsinline></video>
						{:else}
							<img src={art.hero.src} alt={art.hero.alt} />
						{/if}
					</figure>
				{/if}
				<div class="prose">
					{#if art.recipe}
						<Recipe recipe={art.recipe} />
					{:else}
						<art.component />
					{/if}
				</div>
				<div class="rend">
					<div class="rend-h">End of transmission</div>
					{#if art.list.length > 1}
						<div class="rnav">
							<!-- With only two, previous and next are the same one: just show it as next. -->
							{#if art.prev !== art.next}<a class="rnext" href="/{art.prev.slug}"><span class="rnext-k">← Previous moon</span><span class="rnext-t">{art.prev.title}</span></a>{/if}
							<a class="rnext right" href="/{art.next.slug}"><span class="rnext-k">Next moon →</span><span class="rnext-t">{art.next.title}</span></a>
						</div>
					{/if}
					<button class="rback rback2" onclick={closeRead}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M19 12H5"></path><path d="M11 6l-6 6 6 6"></path></svg>Back to orbit
					</button>
				</div>
			</div>
		</article>
	{/if}

	{#if playing}
		<div
			class="game"
			class:out={gameClosing}
			class:instant={gameInstant}
			style={gameClosing ? '--ox:50%;--oy:50%' : `--ox:${Math.round(gameX)}px;--oy:${Math.round(gameY)}px`}
		>
			<!-- Loaded on demand, so the map doesn't carry the game's code. -->
			{#await import('$lib/game/Slingshot.svelte') then { default: Slingshot }}
				<Slingshot onclose={closeGame} />
			{/await}
		</div>
	{/if}

	<Lightbox />
</div>
