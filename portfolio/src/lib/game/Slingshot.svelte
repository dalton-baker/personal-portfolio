<script>
	import { onMount } from 'svelte';
	import { Sim, LEVELS, CORES, PAYLOADS, REVS } from './sim.js';
	import { drawScene } from './draw.js';
	import { HOLE_GL_OPTIONS, createHoleProgram } from '$lib/orbit/blackhole.js';
	import { StarfieldHost } from '$lib/orbit/starfield-host.js';

	/**
	 * Slingshot: fling bodies around a core and hold them in orbit. It opens over the map when the comet
	 * is caught (and at /slingshot). The physics is in sim.js and the drawing in draw.js; the black hole is
	 * the map's own shader, and the stars are the map's starfield.
	 */

	/** @type {{ onclose: () => void }} */
	let { onclose } = $props();

	/** The black hole's disk radius in game units, so its photon ring sits at the core's edge (30 units). */
	const HOLE_R = 110;
	const MAX_DPR = 3;
	const CORE_LIST = Object.values(CORES);
	const PAYLOAD_LIST = Object.values(PAYLOADS);

	const sim = new Sim();
	/** Screen layout: size, scale (px per game unit) and where the core sits. */
	const view = { W: 0, H: 0, dpr: 1, s: 1, cx: 0, cy: 0, compact: false };
	/** The throw being aimed: where it started (ox, oy), where the pointer is, and the body if it's a re-throw. */
	let drag = null;

	let wrap, starCanvas, glCanvas, canvas;
	/** What the panels show, copied from the simulation. */
	let ui = $state(read());
	let trayOpen = $state(false);

	function read() {
		return { core: sim.core, payload: sim.payload, level: sim.level, sandbox: sim.sandbox, complete: sim.complete, finished: sim.finished, revs: sim.revs, bound: sim.bound, toast: sim.toast };
	}

	function sync() {
		const next = read();
		for (const k in next) if (ui[k] !== next[k]) ui[k] = next[k];
	}

	const act = (fn) => () => {
		fn();
		sync();
	};

	const lv = $derived(LEVELS[ui.level]);
	const pips = $derived(Array.from({ length: REVS }, (_, i) => (ui.revs >= i + 1 ? 'on' : ui.revs > i ? 'part' : '')));
	const nextLane = $derived(LEVELS[Math.min(ui.level + 1, LEVELS.length - 1)]);

	function pt(e) {
		const rc = canvas.getBoundingClientRect();
		return { x: (e.clientX - rc.left - view.cx) / view.s, y: (e.clientY - rc.top - view.cy) / view.s };
	}

	function down(e) {
		if (e.button > 0 || !view.s) return;
		trayOpen = false;
		const p = pt(e), b = sim.bodyAt(p.x, p.y, (e.pointerType === 'touch' ? 28 : 16) / view.s);
		if (b) {
			sim.hold(b);
			drag = { body: b, ox: b.x, oy: b.y, x: p.x, y: p.y };
		} else if (!sim.onCore(p.x, p.y)) {
			drag = { body: null, ox: p.x, oy: p.y, x: p.x, y: p.y };
		} else return;
		try {
			canvas.setPointerCapture(e.pointerId);
		} catch {
			// Not every pointer can be captured; the throw still works while it stays on the canvas.
		}
	}

	function move(e) {
		if (!drag) return;
		const p = pt(e);
		drag.x = p.x;
		drag.y = p.y;
	}

	function up() {
		if (!drag) return;
		sim.release(drag);
		drag = null;
		sync();
	}

	onMount(() => {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const ctx = canvas.getContext('2d');
		const stars = new StarfieldHost(starCanvas, reduced);
		let gl = null, prog = null;
		/** The black hole's canvas: a square around the core, its buffer size and pixels per CSS pixel. */
		const hole = { size: 0, w: 0, q: 1 };

		function initGL() {
			try {
				gl = glCanvas.getContext('webgl', HOLE_GL_OPTIONS);
			} catch {
				gl = null;
			}
			prog = gl && !gl.isContextLost() ? createHoleProgram(gl) : null;
			glCanvas.style.visibility = prog ? '' : 'hidden';
		}

		function sizeHole() {
			const d = view.dpr, half = Math.ceil(HOLE_R * view.s * 1.75 + 2);
			hole.size = half * 2;
			hole.q = Math.min(d, prog ? prog.max / hole.size : d);
			hole.w = Math.round(hole.size * hole.q);
			glCanvas.width = glCanvas.height = hole.w;
			const st = glCanvas.style;
			st.width = st.height = hole.size + 'px';
			st.left = Math.round((view.cx - half) * d) / d + 'px';
			st.top = Math.round((view.cy - half) * d) / d + 'px';
		}

		// Fits the outermost lane (390 units) with some margin; phones held upright get a bigger system.
		function resize() {
			const W = wrap.clientWidth, H = wrap.clientHeight;
			if (!W || !H) return;
			const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
			const portrait = H > W * 1.2, compact = W <= 700 || H <= 520;
			Object.assign(view, {
				W, H, dpr, compact,
				s: portrait ? Math.min(W / 840, H / 1300) : Math.min(W, H * (compact ? 0.92 : 0.82)) / 840,
				cx: W / 2,
				cy: portrait ? H * 0.56 : compact ? H * 0.55 : H / 2
			});
			canvas.width = Math.round(W * dpr);
			canvas.height = Math.round(H * dpr);
			stars.size(W, H, dpr);
			sizeHole();
		}

		const lost = (e) => {
			e.preventDefault();
			prog = null;
			glCanvas.style.visibility = 'hidden';
		};
		const restored = () => {
			initGL();
			sizeHole();
		};
		glCanvas.addEventListener('webglcontextlost', lost);
		glCanvas.addEventListener('webglcontextrestored', restored);
		const vis = () => stars.run(!document.hidden);
		document.addEventListener('visibilitychange', vis);
		initGL();
		const ro = new ResizeObserver(resize);
		ro.observe(wrap);
		resize();

		let last = performance.now(), t = 0, hudT = 0, raf = 0;
		const loop = (now) => {
			raf = requestAnimationFrame(loop);
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			t += dt * (reduced ? 0.4 : 1);
			sim.advance(dt);
			hudT += dt;
			if (hudT > 0.1) {
				hudT = 0;
				sync();
			}
			const showHole = sim.core === 'hole' && !!prog;
			if (ctx && view.W) drawScene(ctx, sim, view, drag, t, dt, showHole);
			glCanvas.style.display = showHole ? '' : 'none';
			if (showHole) {
				gl.viewport(0, 0, hole.w, hole.w);
				gl.uniform2f(prog.u.C, hole.w / 2, hole.w / 2);
				gl.uniform1f(prog.u.R, HOLE_R * view.s * hole.q);
				gl.uniform1f(prog.u.T, t);
				gl.uniform1f(prog.u.Ty, 1);
				gl.uniform1f(prog.u.Scan, 0);
				gl.uniform1f(prog.u.Px, hole.q);
				gl.drawArrays(gl.TRIANGLES, 0, 3);
			}
			stars.frame(now);
		};
		raf = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			stars.destroy();
			document.removeEventListener('visibilitychange', vis);
			glCanvas.removeEventListener('webglcontextlost', lost);
			glCanvas.removeEventListener('webglcontextrestored', restored);
		};
	});
</script>

<div class="gw" bind:this={wrap}>
	<canvas bind:this={starCanvas} class="starc" aria-hidden="true"></canvas>
	<canvas bind:this={glCanvas} class="gw-hole" aria-hidden="true"></canvas>
	<canvas
		bind:this={canvas}
		class="gw-play"
		aria-hidden="true"
		onpointerdown={down}
		onpointermove={move}
		onpointerup={up}
		onpointercancel={up}
	></canvas>

	<p class="gw-sr">A slingshot orbit game: press anywhere on the playfield, pull back and let go to fling a body around the core, and keep it inside the lane for {REVS} turns.</p>

	<div class="gw-top">
		<div class="gw-head">
			<div class="kicker">sys://slingshot — orbit game</div>
			<h1 class="gw-title">Slingshot</h1>
		</div>
		<button class="rback" onclick={onclose}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M19 12H5"></path><path d="M11 6l-6 6 6 6"></path></svg>Back<span class="gw-long">&nbsp;to orbit</span>
		</button>
	</div>

	<section class="gw-card" aria-label="Level">
		<div class="card-bar"></div>
		<div class="gw-card-in">
			{#if ui.sandbox}
				<div class="tag">Sandbox</div>
				<div class="gw-name">No goals. Just physics.</div>
				<div class="gw-meta">{ui.bound} bound to the core</div>
			{:else}
				<div class="tag">Level {ui.level + 1} / {LEVELS.length}</div>
				<div class="gw-name">{lv.name}</div>
				<p class="gw-note">{lv.note} Hold it inside the lane for {REVS} full revolutions.</p>
				<div class="gw-pips">
					{#each pips as p, i (i)}<span class="gw-pip {p}"></span>{/each}
					<span class="gw-meta">{ui.revs.toFixed(1)} / {REVS} rev</span>
				</div>
			{/if}
			<p class="gw-toast" aria-live="polite">&gt; {ui.toast}</p>
		</div>
	</section>

	{#if ui.complete && !ui.sandbox}
		<div class="gw-banner" role="status">
			<div class="card-bar"></div>
			<div class="gw-banner-in">
			<div class="tag">Orbit locked</div>
			<div class="gw-banner-h">{ui.finished ? 'System stable' : lv.name + ' cleared'}</div>
			<p class="gw-note">
				{ui.finished
					? 'Every lane has a resident. Sandbox is unlocked: fling whatever you want at whatever you want.'
					: 'Your orbiter stays put. Next lane: ' + nextLane.name.toLowerCase() + '.'}
			</p>
			<button class="lnk primary" onclick={act(() => sim.next())}>{ui.finished ? 'Enter sandbox' : 'Next lane'}</button>
			</div>
		</div>
	{/if}

	<div class="gw-bottom">
		<div class="gw-tray" class:open={trayOpen}>
			<div class="gw-group">
				<div class="gw-label">Core</div>
				<div class="gw-chips">
					{#each CORE_LIST as c (c.id)}
						<button class="lnk gw-chip" class:on={ui.core === c.id} aria-pressed={ui.core === c.id} onclick={act(() => sim.setCore(c.id))}>{c.label}</button>
					{/each}
				</div>
			</div>
			<div class="gw-group">
				<div class="gw-label">Payload</div>
				<div class="gw-chips">
					{#each PAYLOAD_LIST as p (p.id)}
						<button class="lnk gw-chip" class:on={ui.payload === p.id} aria-pressed={ui.payload === p.id} onclick={act(() => (sim.payload = p.id))}>{p.label}</button>
					{/each}
				</div>
			</div>
		</div>
		<div class="gw-actions">
			<button class="lnk gw-chip gw-traybtn" aria-expanded={trayOpen} onclick={() => (trayOpen = !trayOpen)}>
				{trayOpen ? 'Close' : CORES[ui.core].label + ' · ' + PAYLOADS[ui.payload].label}
			</button>
			<button class="lnk gw-chip" onclick={act(() => sim.clear())}>Clear</button>
			<button class="lnk gw-chip" class:on={ui.sandbox} aria-pressed={ui.sandbox} onclick={act(() => sim.toggleSandbox())}>Sandbox</button>
		</div>
		<div class="gw-hint">Drag anywhere, pull back, release<br />Grab any body to re-throw it</div>
	</div>
</div>

<style>
	.gw {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: #07060b;
		user-select: none;
		-webkit-user-select: none;
	}
	/* Placed and sized around the core by resize(). */
	.gw-hole {
		pointer-events: none;
	}
	.gw-play {
		cursor: crosshair;
	}
	.gw-sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	.gw-top {
		position: absolute;
		left: 36px;
		right: 28px;
		top: 30px;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
		pointer-events: none;
	}
	.gw-top .rback {
		pointer-events: auto;
	}
	.gw-title {
		margin: 14px 0 0;
		font: 800 46px/0.92 'Unbounded', system-ui, sans-serif;
		letter-spacing: -0.03em;
		text-transform: uppercase;
		color: #f1eef7;
	}
	.gw-card {
		position: absolute;
		left: 36px;
		top: 136px;
		width: 340px;
		background: #0e0d15;
		clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px));
	}
	.gw-card-in {
		padding: 12px 20px 16px;
	}
	.gw-name {
		margin-top: 8px;
		font: 800 20px/1.1 'Unbounded', system-ui, sans-serif;
		letter-spacing: -0.02em;
		color: #f1eef7;
	}
	.gw-note {
		margin: 10px 0 0;
		font: 400 14px/1.5 'Geist', system-ui, sans-serif;
		color: rgba(241, 238, 247, 0.8);
	}
	.gw-meta,
	.gw-label,
	.gw-hint {
		font: 500 10.5px/1.6 'Geist Mono', ui-monospace, monospace;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(241, 238, 247, 0.55);
	}
	.gw-meta {
		margin-left: 6px;
	}
	.gw-pips {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 12px;
	}
	.gw-pip {
		width: 28px;
		height: 6px;
		background: #2a2633;
	}
	.gw-pip.part {
		background: #c8ff2e;
		opacity: 0.4;
	}
	.gw-pip.on {
		background: #c8ff2e;
	}
	.gw-toast {
		margin: 12px 0 0;
		padding-top: 10px;
		border-top: 1px solid rgba(241, 238, 247, 0.1);
		font: 500 11px/1.5 'Geist Mono', ui-monospace, monospace;
		letter-spacing: 0.02em;
		color: #c8ff2e;
	}
	.gw-banner {
		position: absolute;
		left: 50%;
		bottom: 132px;
		transform: translateX(-50%);
		width: min(420px, calc(100% - 24px));
		background: #0e0d15;
		clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px));
	}
	.gw-banner-in {
		padding: 14px 20px 18px;
	}
	.gw-banner-h {
		margin-top: 8px;
		font: 800 20px/1.1 'Unbounded', system-ui, sans-serif;
		text-transform: uppercase;
		color: #f1eef7;
	}
	.gw-banner .lnk {
		margin-top: 14px;
	}
	.gw-bottom {
		position: absolute;
		left: 36px;
		right: 28px;
		bottom: 24px;
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 14px;
		pointer-events: none;
	}
	.gw-tray,
	.gw-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
		pointer-events: auto;
	}
	.gw-actions {
		gap: 8px;
		margin-left: auto;
	}
	.gw-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.gw-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.gw :global(.lnk.gw-chip) {
		background: rgba(7, 6, 11, 0.8);
		cursor: pointer;
		font-size: 11px;
		padding: 0 14px;
	}
	.gw :global(.lnk.gw-chip.on) {
		border-color: #c8ff2e;
		color: #c8ff2e;
	}
	.gw :global(.lnk.gw-chip.on)::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #c8ff2e;
	}
	/* The site's hover (a lime fill with dark text), restated: the chips' own background would otherwise
	   win and leave dark text on a dark button. */
	@media (hover: hover) {
		.gw :global(.lnk.gw-chip:hover) {
			border-color: #c8ff2e;
			background: #c8ff2e;
			color: #07060b;
		}
		.gw :global(.lnk.gw-chip.on:hover)::before {
			background: #07060b;
		}
	}
	.gw :global(.lnk:focus-visible) {
		outline: 2px solid #c8ff2e;
		outline-offset: 2px;
	}
	.gw-traybtn {
		display: none !important;
	}
	.gw-hint {
		text-align: right;
		width: 100%;
	}

	@media (max-width: 479.98px) {
		.gw-long {
			display: none;
		}
	}

	/* Phones and short windows: a smaller title, a slimmer card, and the core and payload pickers folded
	   into a button. */
	@media (max-width: 759.98px), (max-height: 520px) {
		.gw-top {
			left: 16px;
			right: 12px;
			top: 16px;
		}
		.gw-title {
			margin-top: 10px;
			font-size: 28px;
		}
		.gw-card {
			left: 12px;
			right: 12px;
			top: 84px;
			width: auto;
		}
		.gw-card-in {
			padding: 10px 14px 12px;
		}
		.gw-name {
			font-size: 16px;
		}
		.gw-card .gw-note,
		.gw-hint {
			display: none;
		}
		.gw-pip {
			width: 20px;
		}
		.gw-bottom {
			left: 12px;
			right: 12px;
			bottom: max(12px, env(safe-area-inset-bottom));
		}
		.gw-tray {
			display: none;
			padding: 10px;
			background: rgba(7, 6, 11, 0.86);
		}
		.gw-tray.open {
			display: flex;
		}
		.gw-actions {
			margin-left: 0;
			width: 100%;
		}
		.gw-traybtn {
			display: inline-flex !important;
			margin-right: auto;
		}
		.gw-banner {
			bottom: 76px;
		}
	}
</style>
