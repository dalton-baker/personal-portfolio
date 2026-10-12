<script>
	import '$lib/orbit/system-map.css';
	import { onMount, tick, untrack } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { OrbitEngine } from '$lib/orbit/engine.js';
	import { all, byId, hole, orbiters, moons, blog } from '$lib/orbit/system.js';
	import { posts } from '$lib/posts';
	import Lightbox from './Lightbox.svelte';
	import { lightbox } from './lightbox.svelte.js';

	/** The URL segment: a body slug, a post slug, or null for the home page. */
	let { slug = null } = $props();

	const postSlug = (s) => (s && byId[s]?.kind === 'moon' ? s : null);
	const isMoon = (id) => byId[id]?.kind === 'moon';

	let scan = $state(false);
	let noGL = $state(false);
	let ready = $state(false);
	/** A moon picked while orbiting The Log; it shows a preview card without changing the URL. */
	let moonSel = $state(null);
	/** The post open in the reader. Lags the URL while the close animation plays. */
	let reading = $state(untrack(() => postSlug(slug)));
	let closing = $state(false);
	let instant = $state(true);
	let readX = $state(0);
	let readY = $state(0);

	const sel = $derived.by(() => {
		if (!slug) return null;
		if (isMoon(slug)) return slug;
		if (slug === blog.id && moonSel) return moonSel;
		return slug;
	});
	const inBlog = $derived(sel === blog.id || isMoon(sel));
	const card = $derived(sel ? byId[sel] : null);
	const art = $derived.by(() => {
		if (!reading) return null;
		const p = byId[reading].post;
		const i = posts.indexOf(p);
		return {
			...p,
			n: String(p.n).padStart(2, '0'),
			prev: posts[(i - 1 + posts.length) % posts.length],
			next: posts[(i + 1) % posts.length]
		};
	});

	let root, glCanvas, fxCanvas, holeEl, clockEl;
	let readerEl = $state();
	let progEl = $state();
	const els = {};
	let engine;
	let closeTimer;
	/** Path of the page we came from, if we got here by a forward in-app navigation. */
	let cameFrom = null;
	let lastSlug = untrack(() => slug);

	onMount(() => {
		engine = new OrbitEngine({
			root, glCanvas, fxCanvas, holeEl, clockEl, els,
			getState: () => ({ sel, blog: inBlog, reading, closing, scan }),
			onGLChange: (ok) => (noGL = !ok),
			onReady: () => (ready = true)
		});
		engine.start();
		return () => {
			engine.destroy();
			clearTimeout(closeTimer);
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
			const p = engine ? engine.screenPos(post) : { x: 0, y: 0 };
			readX = p.x;
			readY = p.y;
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

	function resetReaderScroll() {
		if (readerEl) readerEl.scrollTop = 0;
		if (progEl) progEl.style.transform = 'scaleX(0)';
	}

	/** Go to a path, stepping back through history instead when that is where we just came from. */
	function leaveTo(path) {
		if (cameFrom === path) history.back();
		else goto(path, { noScroll: true });
	}

	function closeCard() {
		if (isMoon(sel) && !reading) moonSel = null;
		else leaveTo('/');
	}

	function closeRead() {
		if (!reading || closing) return;
		leaveTo('/' + blog.id);
	}

	/** Moon links preview the post in a card; modified clicks still open the post itself. */
	function previewMoon(e, id) {
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		e.preventDefault();
		if (slug !== blog.id) goto('/' + blog.id, { noScroll: true });
		moonSel = id;
	}

	function onReadScroll(e) {
		const el = e.currentTarget;
		const p = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
		if (progEl) progEl.style.transform = 'scaleX(' + Math.min(1, p).toFixed(4) + ')';
	}

	function onKey(e) {
		if (e.key !== 'Escape') return;
		if (lightbox.src) lightbox.src = '';
		else if (reading) closeRead();
		else if (sel) closeCard();
	}
</script>

<svelte:window onkeydown={onKey} />

<div
	bind:this={root}
	class="bh"
	class:nogl={noGL}
	class:scan
	class:card-open={!!sel}
	class:ready
	onpointermove={(e) => engine?.pointerMove(e)}
	onpointerleave={() => engine?.pointerLeave()}
	onpointerover={(e) => engine?.pointerOver(e)}
	role="presentation"
>
	<canvas bind:this={glCanvas} class="glc" aria-hidden="true"></canvas>
	<canvas bind:this={fxCanvas} class="fxc" aria-hidden="true"></canvas>

	<nav class="orbits" aria-label="System map">
		<a
			bind:this={holeEl}
			class="hole-btn"
			class:is-sel={sel === hole.id}
			href="/{hole.id}"
			aria-label={hole.aria}
			aria-current={sel === hole.id ? 'page' : undefined}
		>
			<span class="fb"></span>
			<span class="hole-label">{scan ? 'Event horizon // about' : 'About'}</span>
		</a>
		{#each orbiters as b (b.id)}
			<a
				bind:this={els[b.id]}
				class="body {b.kind}"
				class:active={b.kind === 'moon' && inBlog}
				class:is-sel={sel === b.id}
				href="/{b.id}"
				aria-label={b.aria}
				aria-current={slug === b.id ? 'page' : undefined}
				tabindex={b.kind === 'moon' && !inBlog ? -1 : 0}
				onclick={b.kind === 'moon' ? (e) => previewMoon(e, b.id) : undefined}
			>
				<span class="dotwrap" style={b.wrapStyle}>
					{#if b.ring}<span class="ring" style={b.ringStyle}></span>{/if}
					{#if b.rays}<span class="rays"></span>{/if}
					<span class="dot" style={b.dotStyle}>
						{#if b.shaded}<span class="shade" style={b.shadeStyle}></span>{/if}
					</span>
				</span>
				<span class="label" style={b.labelStyle}><span class="lname">{b.name}</span></span>
			</a>
		{/each}
	</nav>

	<header class="hdr">
		<div class="kicker">sys://daltonsbaker.com — system map</div>
		<h1>Dalton<br />Baker</h1>
		<p class="tagline">Software engineer. Maker. Builder of things both useful and ridiculous.</p>
		<p class="sub">rapid city, sd // reg x timing // best choice pawn</p>
		<p class="hint">
			{inBlog
				? `In orbit around The Log. ${posts.length} posts, pick a moon.`
				: 'Click anything in orbit, or scan to see what’s underneath.'}
		</p>
		<div class="hdr-actions">
			{@render scanToggle()}
			{#if inBlog}
				<button class="back" onclick={() => leaveTo('/')}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M19 12H5"></path><path d="M11 6l-6 6 6 6"></path></svg>Exit orbit
				</button>
			{/if}
		</div>
	</header>
	<div class="readout">
		<div bind:this={clockEl}>T+ 00:00</div>
		<div>{all.length} objects tracked</div>
		<div>{scan ? 'mode: scan // telemetry live' : 'mode: visual'}</div>
	</div>

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
			<h1>Dalton Baker</h1>
			<p class="tagline">Software engineer. Maker. Builder of things both useful and ridiculous.</p>
			<p class="sub">rapid city, sd</p>
			<p class="hint">Tap anything in orbit, or turn on <b>scan mode</b> to see what's underneath.</p>
		</section>
	{/if}

	{#if card && !reading}
		<aside class="card" aria-live="polite">
			<div class="card-bar"></div>
			<div class="card-in">
				<div class="card-top">
					<span class="tag">{card.tag}</span>
					<button class="x" onclick={closeCard} aria-label="Close">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6L6 18"></path></svg>
					</button>
				</div>
				<h2>{card.name}</h2>
				{#if card.kind === 'moon'}<div class="date">{card.date}</div>{/if}
				<p class="desc">{card.body}</p>
				{#if card.facts.length}
					<dl class="facts">
						{#each card.facts as f (f.k)}<div class="fact"><dt>{f.k}</dt><dd>{f.v}</dd></div>{/each}
					</dl>
				{/if}
				{#if card.isBlog}
					<div class="posts-h">Posts in orbit</div>
					<ul class="posts">
						{#each moons as m (m.id)}
							<li>
								<a class="post" href="/{m.id}" onclick={(e) => previewMoon(e, m.id)}>
									<span class="pn">{m.num}</span><span class="pt">{m.name}</span><span class="pd">{m.date}</span>
								</a>
							</li>
						{/each}
					</ul>
				{/if}
				{#if card.links.length}
					<div class="links">
						{#each card.links as l (l.href)}
							{#if l.internal}
								<a class="lnk" href={l.href}>{l.label}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg></a>
							{:else}
								<a class="lnk" href={l.href} target="_blank" rel="noopener">{l.label}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M7 17L17 7"></path><path d="M8 7h9v9"></path></svg></a>
							{/if}
						{/each}
					</div>
				{/if}
				{#if card.kind === 'moon'}
					<div class="links">
						<a class="lnk primary" href="/{card.id}">Read post<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg></a>
					</div>
					<button class="ghost" onclick={() => (moonSel = null)}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M19 12H5"></path><path d="M11 6l-6 6 6 6"></path></svg>All posts
					</button>
				{/if}
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
				<span class="rcrumb">The Log // Post {art.n}</span>
				<div class="rprog"><div bind:this={progEl} class="rprog-fill"></div></div>
			</div>
			<div class="rcol">
				<div class="rkicker"><b>Post {art.n}</b> · {art.displayDate} · {art.mins} min read</div>
				<h1 class="rtitle">{art.title}</h1>
				<p class="rdek">{art.dek}</p>
				<figure class="rfig hero">
					{#if art.hero.video}
						<video src={art.hero.src} autoplay loop muted playsinline></video>
					{:else}
						<img src={art.hero.src} alt={art.hero.alt} />
					{/if}
				</figure>
				<div class="prose">
					<art.component />
				</div>
				<div class="rend">
					<div class="rend-h">End of transmission</div>
					{#if posts.length > 1}
						<div class="rnav">
							<a class="rnext" href="/{art.prev.slug}"><span class="rnext-k">← Previous moon</span><span class="rnext-t">{art.prev.title}</span></a>
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

	<Lightbox />
</div>
