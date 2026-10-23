import { kep, all, byId, moons, hosts, pulsar, belt } from './system.js';
import { StarfieldHost } from './starfield-host.js';
import { HOLE_GL_OPTIONS, createHoleProgram } from './blackhole.js';
import { CometTail, cometStrength } from './comet.js';

/** The canvases render at the device's pixel ratio, up to 3x (current phones). */
const MAX_DPR = 3;
/**
 * The black hole shader only runs on a box around the hole, at full resolution unless that box would
 * take more pixels than this (zoomed in close), when it renders lower and is scaled up.
 */
const GL_BUDGET_DESKTOP = 2.4e6;
const GL_BUDGET_TOUCH = 1.2e6;
/** Adaptive quality steps for the shader, as fractions of that resolution. */
const GL_LEVELS = [1, 0.8, 0.65, 0.5];
/** The shader draws nothing beyond this many disk radii from the hole (allowing for the halftone cells). */
const GL_REACH = 1.75;
/** Frame-rate caps. The motion is slow orbits and a swirl, so lower rates look nearly identical. */
const FPS_DESKTOP = 60;
const FPS_TOUCH = 30;
/**
 * Parallax: the system and, less, the starfield (so the stars read as farther away) drift against the
 * pointer's movement, then settle back once it stops. It follows movement rather than where the pointer
 * is, so a mouse arriving at the edge of the page doesn't slide the view across. A finger dragging on the
 * map does the same. It's kept small and slow on purpose, since a whole scene lurching after a fast flick
 * of the mouse is the kind of motion that makes people queasy.
 * SYSTEM and STARS are the largest drift (CSS px), GAIN is how much of that a move across the whole map
 * gives, EASE is how slowly (seconds) the view follows the drift, and SETTLE how slowly the drift eases back.
 */
const PARALLAX_SYSTEM = 6;
const PARALLAX_STARS = 2.5;
const PARALLAX_GAIN = 2;
const PARALLAX_EASE = 0.6;
const PARALLAX_SETTLE = 1.5;

/**
 * The comet: now and then one crosses the map on a parabolic orbit around the black hole (fastest as it
 * passes closest). Clicking it opens Slingshot. WAIT is how long the map waits before the first one and
 * between them (seconds, random within the range; it doesn't count while a post or the game covers the
 * map), and PASS how long one takes to cross the view.
 */
const COMET_FIRST_WAIT = [8, 20];
const COMET_WAIT = [25, 55];
const COMET_PASS = 16;

const clamp1 = (v) => Math.max(-1, Math.min(1, v));
const between = ([a, b]) => a + Math.random() * (b - a);

/**
 * Drives the system map every animation frame: orbits, camera and three canvases. From the back: the
 * starfield (starfield.js, drawn in a worker where the browser allows), the WebGL black hole (a box
 * around the hole, transparent outside the disk) and the 2D effects (orbits, belt, rings, reticle). It
 * writes transforms straight onto the body elements; Svelte only renders the markup and the UI around it.
 */
export class OrbitEngine {
	/**
	 * @param {object} o
	 * @param {HTMLElement} o.root
	 * @param {HTMLCanvasElement} o.starCanvas
	 * @param {HTMLCanvasElement} o.glCanvas
	 * @param {HTMLCanvasElement} o.fxCanvas
	 * @param {HTMLElement} o.holeEl
	 * @param {HTMLElement} [o.cometEl] the comet's link; the engine shows, hides and moves it
	 * @param {Record<string, HTMLElement>} o.els body id -> element
	 * @param {() => {sel: string|null, host: string|null, reading: string|null, cover: boolean, closing: boolean, scan: boolean}} o.getState
	 * `host` is the giant whose moons are in play (it, or one of its moons, is selected). `cover` is true
	 * while the reader or the game covers the map, and `closing` while it's closing.
	 * @param {(ok: boolean) => void} o.onGLChange called when WebGL becomes unavailable (false) or comes back (true)
	 * @param {() => void} o.onReady
	 */
	constructor(o) {
		Object.assign(this, o);
		this.timeScale = 2.2;
		this.tiltY = 1;
		/** Index into GL_LEVELS. */
		this.glLevel = 0;
		/** The GL canvas's drawing buffer size (px) and whether it's showing; the hole can be off screen. */
		this.glBox = { w: 0, h: 0, shown: true, tf: '' };
		this.cam = { x: 0, y: 0, z: 1, cx: 0, cy: 0, init: false };
		this.simT = 0;
		this.moonT = 0;
		this.realT = 0;
		this.readT0 = 0;
		this.spd = 1;
		this.lastFrame = 0;
		this.frameClock = 0;
		this.perf = { n: 0, sum: 0, skip: 5, good: 0, wait: 2, raised: false, slowAt: 0, minInterval: 0 };
		this.scanV = 0;
		this.frame = 0;
		this.W = 1440;
		this.H = 900;
		this.isMobile = false;
		/** Canvas pixels per CSS pixel (the device pixel ratio, capped). */
		this.dpr = 1;
		this.starTf = '';
		this.ptr = null;
		this.hoverEl = null;
		this.hoverT0 = 0;
		this.parts = new Map();
		/** Parallax drift, -1..1 on each axis: eased (x, y) toward the target (tx, ty), which pointer moves push. */
		this.par = { x: 0, y: 0, tx: 0, ty: 0 };
		/** Where the pointer was at its last move, or null until it moves over the map (or a finger lands). */
		this.parPrev = null;
		/** The comet in flight (see newComet), or null; time left before the next one. */
		this.comet = null;
		this.cometWait = between(COMET_FIRST_WAIT);
		this.cometSpd = 1;

		let seed = 11;
		const rnd = () => {
			seed = (seed * 16807) % 2147483647;
			return (seed - 1) / 2147483646;
		};
		this.belt = [];
		for (let i = 0; i < 360; i++) {
			const g = (rnd() + rnd() + rnd() - 1.5) / 1.5;
			const t = belt.t + g * belt.spread;
			this.belt.push({ t, ph: rnd() * Math.PI * 2, sp: kep(t) * (0.94 + rnd() * 0.12), s: 1 + rnd() * 1.6, b: Math.round((0.35 + rnd() * 0.65) * 10) / 10 });
		}
		// Grouped by brightness, so drawing them only changes the canvas alpha a handful of times a frame.
		this.belt.sort((p, q) => p.b - q.b);
	}

	start() {
		this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		this.coarse = window.matchMedia('(pointer: coarse)').matches;
		// Phones drop the GPU context when backgrounded for a while. Without handling this the canvas
		// stays blank (Chrome shows a white "sad face" placeholder) until the page is reloaded.
		this.onContextLost = (e) => {
			e.preventDefault(); // allows the browser to restore the context
			this.gl = null;
			this.onGLChange(false);
		};
		this.onContextRestored = () => this.initGL();
		this.glCanvas.addEventListener('webglcontextlost', this.onContextLost);
		this.glCanvas.addEventListener('webglcontextrestored', this.onContextRestored);
		this.onVisible = () => {
			if (!document.hidden) this.frameClock = this.lastFrame = performance.now();
			this.stars?.run(!document.hidden);
		};
		document.addEventListener('visibilitychange', this.onVisible);
		this.initGL();
		if (this.fxCanvas) this.ctx = this.fxCanvas.getContext('2d');
		if (this.starCanvas) this.stars = new StarfieldHost(this.starCanvas, this.reduced);
		this.measure();
		this.ro = new ResizeObserver(() => this.measure());
		this.ro.observe(this.root);
		this.frameClock = this.lastFrame = performance.now();
		const loop = (now) => {
			this.raf = requestAnimationFrame(loop);
			this.tick(now);
		};
		this.raf = requestAnimationFrame(loop);
	}

	destroy() {
		cancelAnimationFrame(this.raf);
		this.stars?.destroy();
		this.ro?.disconnect();
		this.glCanvas.removeEventListener('webglcontextlost', this.onContextLost);
		this.glCanvas.removeEventListener('webglcontextrestored', this.onContextRestored);
		document.removeEventListener('visibilitychange', this.onVisible);
	}

	/** Where a body is on screen right now, in px relative to the map. */
	screenPos(id) {
		const b = byId[id];
		if (b && b.sx != null) return { x: b.sx, y: b.sy };
		return { x: this.W / 2, y: this.H / 2 };
	}

	/** Call when the reader or the game opens; rendering pauses once its iris has covered the map. */
	markRead() {
		this.readT0 = this.realT;
	}

	/** Sends a comet across as soon as the map is idle (the ?comet link). */
	launchComet() {
		this.cometWait = 0;
	}

	/** Where the comet is on screen (px relative to the map), or null when there isn't one. */
	cometPos() {
		return this.comet && this.comet.sx != null ? { x: this.comet.sx, y: this.comet.sy } : null;
	}

	/**
	 * The comet was caught (its game is opening): it holds still under the iris opening from it, and is
	 * gone once the map is covered (see tick).
	 */
	catchComet() {
		if (!this.comet) return;
		this.comet.caught = true;
		this.cometSpd = 0;
	}

	/**
	 * A new flyby, in map units around the hole. On a parabola with closest approach q, r = q (1 + D^2) where
	 * D = tan(angle from the closest point / 2), and (Barker's equation) the time from the closest point is
	 * k (D + D^3 / 3). With the whole system in view it swings close past the hole; zoomed in on something,
	 * the orbit is aimed through a point near the middle of the view instead (for a point at distance d,
	 * reached at D, q = d / (1 + D^2)). Either way it's timed to cross the view in COMET_PASS seconds, from
	 * just off screen to just off screen. Null if no such path is in view.
	 */
	newComet(L, Z, ox, oy, st) {
		const W = this.W, H = this.H, m = 60, dir = Math.random() < 0.5 ? 1 : -1;
		const inView = (x, y) => x > -m && y > -m && x < W + m && y < H + m;
		let q = L.rmin * (0.95 + Math.random() * 0.75), rot = Math.random() * Math.PI * 2, u0 = 0;
		if (st.sel) {
			const spread = 0.5 * Math.min(W, H), sx = this.cam.cx + (Math.random() - 0.5) * spread, sy = this.cam.cy + (Math.random() - 0.5) * spread;
			const wx = (sx - ox) / Z, wy = (sy - oy) / (Z * L.ty), d = Math.hypot(wx, wy);
			if (d > L.rmin * 1.2) {
				const D = (Math.random() * 2 - 1) * 1.3;
				u0 = Math.atan(D);
				q = d / (1 + D * D);
				rot = Math.atan2(wy, wx) - 2 * u0 * dir;
			}
		}
		// Walk along the orbit (u = atan D) both ways from that point to where it leaves the view.
		const shown = (u) => {
			const D = Math.tan(u), r = q * (1 + D * D), th = rot + 2 * u * dir;
			return inView(ox + r * Math.cos(th) * Z, oy + r * Math.sin(th) * L.ty * Z);
		};
		const walk = (sign) => {
			let u = u0;
			while (Math.abs(u) < 1.55 && shown(u + sign * 0.004)) u += sign * 0.004;
			return u;
		};
		const a = walk(-1), b = walk(1);
		if (b - a < 0.05) return null;
		const f = (u) => Math.tan(u) + Math.tan(u) ** 3 / 3;
		const k = (COMET_PASS * (this.reduced ? 1.6 : 1)) / (f(b) - f(a));
		return { q, k, t: k * f(a), end: k * f(b), rot, dir, alpha: 1, tail: new CometTail(L.rmin) };
	}

	endComet() {
		this.comet = null;
		this.cometWait = between(COMET_WAIT);
		if (this.cometEl) {
			this.cometEl.style.display = 'none';
			this.cometEl.style.opacity = '';
		}
		if (this.hoverEl === this.cometEl) this.hoverEl = null;
	}

	/**
	 * Moves the comet along, or counts down to the next one. It flies on through anything (a planet's card,
	 * the camera zooming, a post or the game opening over the map) until it's off screen, or the map is
	 * covered (see tick).
	 */
	updateComet(dt, L, Z, ox, oy, st) {
		const el = this.cometEl;
		if (!el) return;
		let c = this.comet;
		if (!c) {
			// No new one while a post or the game covers the map.
			if (st.cover) return;
			this.cometWait -= dt;
			if (this.cometWait > 0) return;
			c = this.comet = this.newComet(L, Z, ox, oy, st);
			if (!c) {
				this.cometWait = 3;
				return;
			}
			this.cometSpd = 1;
			el.style.display = '';
		}
		// It slows right down while the pointer is on it, so it can be caught, and once caught it holds still.
		const target = c.caught ? 0 : this.hoverEl === el ? 0.2 : 1;
		this.cometSpd += (target - this.cometSpd) * Math.min(1, dt * (c.caught ? 20 : 6));
		c.t += dt * this.cometSpd;
		// Solve Barker's equation for D (a cubic with one real root), then place it on the parabola.
		const m = c.t / c.k, w = Math.cbrt(1.5 * m + Math.sqrt(2.25 * m * m + 1)), D = w - 1 / w;
		const r = c.q * (1 + D * D), th = c.rot + 2 * Math.atan(D) * c.dir;
		c.r = r;
		const px = r * Math.cos(th), py = r * Math.sin(th) * L.ty;
		// Its velocity (map units per second), for the tails it sheds.
		const vx = c.px != null && dt > 0 ? (px - c.px) / dt : 0, vy = c.py != null && dt > 0 ? (py - c.py) / dt : 0;
		c.px = px;
		c.py = py;
		c.tail.update(dt, px, py, vx, vy, cometStrength(r, L.rmin * 1.2));
		c.sx = ox + c.px * Z;
		c.sy = oy + c.py * Z;
		// It's done once it's past the end of its pass and off screen (the camera may have moved since).
		const out = c.sx < -80 || c.sy < -80 || c.sx > this.W + 80 || c.sy > this.H + 80;
		if (c.t > c.end && out) return this.endComet();
		// Still in view well after its pass (the camera zoomed out since, say), or caught and then left
		// before the map was covered: it fades out rather than blinking away.
		if ((!c.caught && c.t > c.end + 12) || (c.caught && !st.cover)) c.fading = true;
		if (c.fading) {
			c.alpha -= dt / 1.5;
			if (c.alpha <= 0) return this.endComet();
			el.style.opacity = c.alpha.toFixed(3);
		}
		c.tail.alpha = c.alpha;
		const sx = Math.round(c.sx * 10), sy = Math.round(c.sy * 10);
		if (sx !== c.tx || sy !== c.ty) {
			c.tx = sx;
			c.ty = sy;
			el.style.transform = 'translate3d(' + sx / 10 + 'px,' + sy / 10 + 'px,0)';
		}
	}

	pointerMove(e) {
		const r = this.root.getBoundingClientRect();
		const sx = r.width ? this.W / r.width : 1;
		const sy = r.height ? this.H / r.height : 1;
		const x = (e.clientX - r.left) * sx, y = (e.clientY - r.top) * sy;
		// Each move nudges the parallax by how far the pointer went; the first one only records where it is.
		const prev = this.parPrev;
		if (prev && !this.reduced) {
			this.par.tx = clamp1(this.par.tx + ((x - prev.x) / this.W) * PARALLAX_GAIN);
			this.par.ty = clamp1(this.par.ty + ((y - prev.y) / this.H) * PARALLAX_GAIN);
		}
		this.parPrev = { x, y };
		// Only a mouse gets the hover reticle; a finger only moves the parallax while it's down.
		this.ptr = e.pointerType === 'touch' ? null : { x, y };
	}

	/** A finger landing on the map is where its drag starts; once it lifts, the view settles back. */
	pointerDown(e) {
		if (e.pointerType === 'touch') this.pointerMove(e);
	}

	pointerUp(e) {
		if (e.pointerType === 'touch') this.parPrev = null;
	}

	pointerLeave() {
		this.ptr = null;
		this.hoverEl = null;
		this.parPrev = null;
	}

	pointerOver(e) {
		const t = e.target && e.target.closest ? e.target.closest('.body,.hole-btn') : null;
		if (t !== this.hoverEl) {
			this.hoverEl = t;
			this.hoverT0 = this.realT;
		}
	}

	layout() {
		const W = this.W, H = this.H, ty = this.tiltY;
		if (this.isMobile) {
			const cy = this.getState().sel ? H * 0.25 : H * 0.39;
			const rmax = Math.max(120, Math.min(W / 2 - 12, (H * 0.25 - 14) / ty, 260));
			const rmin = rmax * 0.37;
			return { cx: W / 2, cy, rmin, rmax, ty, disk: rmin * 0.84, bs: 0.78, moonR: 16 };
		}
		const rmax = Math.max(220, Math.min((H / 2 - 26) / ty, W * 0.44 - 40, 540));
		const rmin = rmax * 0.3;
		return { cx: W * 0.44, cy: H * 0.5, rmin, rmax, ty, disk: rmin * 0.86, bs: Math.min(1.1, rmax / 400), moonR: 26 };
	}

	measure() {
		if (!this.root) return;
		this.W = Math.max(1, this.root.clientWidth);
		this.H = Math.max(1, this.root.clientHeight);
		// Matches the 760px breakpoint in system-map.css.
		this.isMobile = this.W < 760;
		// Also re-measured when the pixel ratio changes (browser zoom, a window moved to another screen).
		this.dprSeen = window.devicePixelRatio;
		const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
		this.dpr = dpr;
		if (this.fxCanvas) {
			this.fxCanvas.width = Math.round(this.W * dpr);
			this.fxCanvas.height = Math.round(this.H * dpr);
		}
		this.stars?.size(this.W, this.H, dpr);
	}

	/** Builds the shader program; also runs again after a lost context is restored. Returns whether WebGL works. */
	initGL() {
		const c = this.glCanvas;
		let gl = null;
		try {
			gl = c.getContext('webgl', HOLE_GL_OPTIONS);
		} catch {
			gl = null;
		}
		const prog = gl && !gl.isContextLost() ? createHoleProgram(gl) : null;
		if (!prog) {
			this.gl = null;
			this.onGLChange(false);
			return false;
		}
		this.u = prog.u;
		this.glMax = prog.max;
		this.gl = gl;
		this.onGLChange(true);
		return true;
	}

	/**
	 * Adaptive quality: average the frame interval over 40 frames (or 1.5 s on very slow devices). If the
	 * device can't keep up with the frame cap, render the shader a step lower; once it keeps up again, step
	 * back up (waiting longer each time a step up turns out too much). If even the lowest step is no faster
	 * than full resolution, the shader isn't what's slow (a battery saver capping the frame rate, a busy
	 * CPU), so go back to full resolution and accept that frame rate.
	 */
	samplePerf(elapsed, interval) {
		const p = this.perf;
		if (elapsed > 1000) return; // a stall (debugger, throttled tab), not a slow frame
		if (p.skip > 0) {
			p.skip--;
			return;
		}
		p.sum += elapsed;
		p.n++;
		if (p.n < 40 && p.sum < 1500) return;
		const mean = p.sum / p.n;
		p.sum = p.n = 0;
		const target = Math.max(interval, p.minInterval);
		if (mean > target * 1.35) {
			p.good = 0;
			if (p.raised) p.wait = Math.min(p.wait * 2, 32);
			p.raised = false;
			if (this.glLevel === 0) p.slowAt = mean;
			if (this.glLevel < GL_LEVELS.length - 1) this.glLevel++;
			else if (mean > p.slowAt * 0.9) {
				this.glLevel = 0;
				p.minInterval = mean;
			}
			p.skip = 3;
		} else if (mean < target * 1.12 && this.glLevel > 0 && ++p.good >= p.wait) {
			this.glLevel--;
			p.good = 0;
			p.raised = true;
			p.skip = 3;
		}
	}

	/**
	 * World-space unit for a host's moon orbits (`mt`): its radius when it has rings or is a binary pair,
	 * else the layout's moon unit.
	 */
	moonUnit(h, L) {
		return h.rings || h.barycenter ? (h.size / 2) * L.bs : L.moonR;
	}

	/** Cached children of a body element: its scaled wrapper, shading, and decorative moon. */
	partsOf(el) {
		let p = this.parts.get(el);
		if (!p) {
			p = {
				wrap: el.querySelector('.dotwrap'),
				shade: el.querySelector('.dotwrap > .dot > .shade'),
				sat: el.querySelector('.sat'),
				satShade: el.querySelector('.sat .shade')
			};
			this.parts.set(el, p);
		}
		return p;
	}

	tick(now) {
		if (document.hidden) return;
		const st = this.getState();
		if (st.cover && !st.closing && this.realT - this.readT0 > 1.1) {
			// The reader or the game covers the map, so stop rendering until it closes (and any comet is gone).
			this.frameClock = this.lastFrame = now;
			if (this.comet) this.endComet();
			this.stars?.run(false);
			return;
		}
		this.stars?.run(!document.hidden);
		const interval = 1000 / (this.isMobile || this.coarse ? FPS_TOUCH : FPS_DESKTOP);
		const sinceClock = now - this.frameClock;
		if (sinceClock < interval - 1.5) return;
		// Keep a steady cadence on displays faster than the cap (120 Hz phones, 144 Hz monitors).
		this.frameClock = sinceClock > interval * 3 ? now : now - (sinceClock % interval);
		const elapsed = now - this.lastFrame;
		this.lastFrame = now;
		this.samplePerf(elapsed, interval);
		if (window.devicePixelRatio !== this.dprSeen) this.measure();
		let dt = elapsed / 1000;
		if (!(dt > 0)) dt = 0.016;
		dt = Math.min(dt, 0.05);
		this.frame++;
		const mob = this.isMobile;
		const L = this.layout();
		const ts = this.timeScale * (this.reduced ? 0.25 : 1);
		// The camera zooms in on the giant whose moons are in play, otherwise on whatever is selected. The
		// black hole is the centre of everything, so selecting it only zooms in gently and keeps things moving.
		const selB = st.sel ? byId[st.sel] : null;
		const hostB = st.host ? byId[st.host] : null;
		const focus = hostB || (selB && selB.kind !== 'hole' && selB.kind !== 'moon' ? selB : null);
		const target = focus ? 0.03 : st.sel ? 0.3 : 1;
		this.spd += (target - this.spd) * Math.min(1, dt * 2.5);
		this.simT += dt * this.spd * ts;
		this.moonT += dt * ts * (st.reading ? 0 : hostB ? 1 : 0.6);
		this.realT += dt * (this.reduced ? 0.3 : 1);
		this.scanV += ((st.scan ? 1 : 0) - this.scanV) * Math.min(1, dt * 6);
		const span = L.rmax - L.rmin;
		for (const b of all) {
			if (b.kind === 'hole' || b.kind === 'moon') continue;
			b.r = L.rmin + span * b.t;
			b.th = b.phase + b.speed * this.simT;
			b.c = Math.cos(b.th);
			b.s = Math.sin(b.th);
			b.px = b.r * b.c;
			b.py = b.r * L.ty * b.s;
		}
		for (const m of moons) {
			const h = m.host, u = this.moonUnit(h, L);
			m.r = u * m.mt;
			m.th = m.phase + m.mspeed * this.moonT;
			m.c = Math.cos(m.th);
			m.s = Math.sin(m.th);
			m.px = h.px + m.r * m.c;
			m.py = h.py + m.r * L.ty * m.s;
			if (h.barycenter) {
				// Binary pair: the host's orbit position is the barycenter, and the planet swings opposite its moon.
				h.bx = -h.barycenter * u * m.c;
				h.by = -h.barycenter * u * L.ty * m.s;
			}
		}
		let tz = 1, tfx = 0, tfy = 0, tcx = L.cx, tcy = L.cy;
		if (focus) {
			tz = (mob ? 2.4 : 2.7) * (focus.zoom ?? 1);
			tfx = focus.px;
			tfy = focus.py;
		} else if (selB) {
			tz = mob ? 1.2 : 1.3;
		}
		if (!mob && st.sel) tcx = (this.W - 412) / 2;
		if (st.reading && byId[st.reading]) {
			const rm = byId[st.reading];
			tz = mob ? 8 : 9;
			tfx = rm.px;
			tfy = rm.py;
			tcx = this.W / 2;
			tcy = this.H / 2;
		}
		const cam = this.cam;
		this.camZ = tz;
		if (!cam.init) {
			cam.x = tfx; cam.y = tfy; cam.z = tz; cam.cx = tcx; cam.cy = tcy;
			cam.init = true;
		}
		const k = 1 - Math.exp(-dt * 3.4);
		cam.x += (tfx - cam.x) * k;
		cam.y += (tfy - cam.y) * k;
		cam.z += (tz - cam.z) * k;
		cam.cx += (tcx - cam.cx) * k;
		cam.cy += (tcy - cam.cy) * k;
		const Z = cam.z;
		// Parallax: the drift settles back toward the centre and the view eases after it, shifting the whole
		// system against the pointer's movement.
		const par = this.par, settle = Math.exp(-dt / PARALLAX_SETTLE), kp = 1 - Math.exp(-dt / PARALLAX_EASE);
		par.tx *= settle;
		par.ty *= settle;
		par.x += (par.tx - par.x) * kp;
		par.y += (par.ty - par.y) * kp;
		const amp = mob ? 0.7 : 1;
		const ox = cam.cx - cam.x * Z - par.x * PARALLAX_SYSTEM * amp;
		const oy = cam.cy - cam.y * Z - par.y * PARALLAX_SYSTEM * amp;
		const bz = L.bs * (1 + (Z - 1) * 0.32);

		for (const b of all) {
			if (b.kind === 'hole') continue;
			// Orbit centre on screen (a binary pair's barycenter), and where the body itself is drawn.
			b.csx = ox + b.px * Z;
			b.csy = oy + b.py * Z;
			const x = b.csx + (b.bx || 0) * Z, y = b.csy + (b.by || 0) * Z;
			b.sx = x;
			b.sy = y;
			const el = this.els[b.id];
			if (!el) continue;
			const p = this.partsOf(el);
			const depth = L.ty < 0.98 ? b.s : 0;
			// Ringed giants and binary pairs scale with the camera, like their rings and moon orbits, so they keep
			// their proportions at any zoom.
			let sc = b.rings || b.barycenter ? L.bs * Z : bz * (1 + 0.1 * depth);
			let op = 0.7 + 0.3 * (depth * 0.5 + 0.5);
			let zi = Math.round(200 + depth * 100);
			if (b.kind === 'moon' && b.host.barycenter) {
				// The second body of a binary pair is drawn like its partner, not as a small dim moon.
				sc = L.bs * Z;
				if (focus && focus !== b.host) op *= 0.35;
				zi = Math.round(200 + b.host.s * 100) + 2;
			} else if (b.kind === 'moon') {
				const active = b.host === hostB;
				sc = bz * (active ? 1.25 : 0.55);
				if (!active) op = focus ? 0.16 : 0.45;
				zi = Math.round(200 + b.host.s * 100) + 2;
			} else if (focus && b !== focus) op *= 0.35;
			// Styles are only written when they change (position to 0.1px, opacity to 1%), since every write
			// restyles the element. A body well off screen (the camera zoomed in elsewhere) is moved off once and
			// then left alone until it comes back; the margin covers rings, labels and the hint.
			const tx = Math.round(x * 10), ty = Math.round(y * 10);
			const margin = (b.rings ? b.ringsOuter * b.size : b.size) * sc + 240;
			const off = x < -margin || y < -margin || x > this.W + margin || y > this.H + margin;
			if (off && p.off) continue;
			p.off = off;
			if (tx !== p.tx || ty !== p.ty) {
				p.tx = tx;
				p.ty = ty;
				el.style.transform = 'translate3d(' + tx / 10 + 'px,' + ty / 10 + 'px,0)';
			}
			if (off) continue;
			const o = Math.round(op * 100);
			if (o !== p.o) {
				p.o = o;
				el.style.opacity = String(o / 100);
			}
			if (zi !== p.zi) {
				p.zi = zi;
				el.style.zIndex = String(zi);
			}
			// A planet repaints at its new size whenever its scale changes (rather than stretching a bitmap, which
			// blurs it when the camera zooms in), so skip changes too small to see.
			if (!(Math.abs(sc - p.sc) < p.sc * 0.004)) {
				p.sc = sc;
				if (p.wrap) p.wrap.style.transform = 'scale(' + sc.toFixed(3) + ')';
			}
			sc = p.sc;
			// Drawn radius (including a ring or moon), so the frame and labels clear the body at any zoom.
			const rad = (b.rings ? b.ringsOuter * (b.size / 2) : b.sat ? b.sat.orbit + b.sat.size / 2 : b.size / 2) * sc;
			if (!(Math.abs(rad - p.r) < 0.3)) {
				p.r = rad;
				el.style.setProperty('--r', rad.toFixed(1) + 'px');
			}
			// The body as you'd point at it: the planet itself, or a giant together with its rings (big moons
			// orbit outside this, so the first-visit hint can sit right on top of the planet).
			const disc = b.rings ? rad : (b.size / 2) * sc;
			if (!(Math.abs(disc - p.disc) < 0.3)) {
				p.disc = disc;
				el.style.setProperty('--disc', disc.toFixed(1) + 'px');
			}
			// Night side faces away from the black hole. It turns in steps that move its edge by half a pixel at
			// most (a few degrees on a small planet), for the same reason.
			const ang = Math.atan2(y - oy, x - ox);
			const turn = !(Math.abs(ang - p.ang) < Math.min(0.05, 1 / Math.max(1, b.size * sc)));
			if (turn) p.ang = ang;
			const shadeRot = 'rotate(' + p.ang.toFixed(3) + 'rad)';
			if (turn && b.shaded && p.shade) p.shade.style.transform = shadeRot;
			if (p.sat) {
				const s = b.sat, th = s.phase + s.speed * this.realT;
				const mx = Math.round(Math.cos(th) * s.orbit * 20), my = Math.round(Math.sin(th) * s.orbit * L.ty * 20);
				if (mx !== p.mx || my !== p.my) {
					p.mx = mx;
					p.my = my;
					p.sat.style.transform = 'translate(' + mx / 20 + 'px,' + my / 20 + 'px)';
				}
				if (turn && p.satShade) p.satShade.style.transform = shadeRot;
			}
		}
		if (this.holeEl) {
			// Clickable across the visible disk; the frame and label hug the event horizon (--hr, the
			// photon ring's outer radius in the shader).
			const size = Math.round(L.disk * Z * 1.6);
			const s = this.holeEl.style;
			if (size !== this.holeSize) {
				this.holeSize = size;
				s.width = s.height = size + 'px';
				s.left = s.top = -size / 2 + 'px';
			}
			const hr = L.disk * Z * 0.29;
			if (!(Math.abs(hr - this.holeR) < 0.3)) {
				this.holeR = hr;
				s.setProperty('--hr', hr.toFixed(1) + 'px');
			}
			const hx = Math.round(ox * 10), hy = Math.round(oy * 10);
			if (hx !== this.holeX || hy !== this.holeY) {
				this.holeX = hx;
				this.holeY = hy;
				this.holeEl.style.transform = 'translate3d(' + hx / 10 + 'px,' + hy / 10 + 'px,0)';
			}
		}
		this.updateComet(dt, L, Z, ox, oy, st);
		this.drawFx(L, Z, ox, oy, bz, hostB, focus, st, mob);
		if (this.starCanvas) {
			// The starfield drifts less than the system, so it reads as farther away. Moved in whole device
			// pixels to keep the stars crisp.
			const d = this.dpr, sa = PARALLAX_STARS * amp * d;
			const tf = 'translate3d(' + (Math.round(-par.x * sa) / d).toFixed(3) + 'px,' + (Math.round(-par.y * sa) / d).toFixed(3) + 'px,0)';
			if (tf !== this.starTf) {
				this.starTf = tf;
				this.starCanvas.style.transform = tf;
			}
			this.stars.scan(st.scan);
			this.stars.frame(now);
		}
		if (this.gl) this.drawGL(L, Z, ox, oy);
		if (this.frame === 1) this.onReady();
	}

	/**
	 * The black hole. The shader only runs on a box around the hole (it draws nothing further out), clipped
	 * to the map, at full resolution where the pixel budget allows. The canvas is placed and scaled with a
	 * transform, and its drawing buffer is only reallocated when the box outgrows it or shrinks a lot.
	 */
	drawGL(L, Z, ox, oy) {
		const gl = this.gl, c = this.glCanvas, box = this.glBox, d = this.dpr, R = L.disk * Z;
		const rx = R * GL_REACH + 2, ry = rx * L.ty;
		// The box's corner sits on a device pixel, so at full resolution the canvas maps 1:1 onto the screen.
		const x0 = Math.max(0, Math.floor((ox - rx) * d) / d), y0 = Math.max(0, Math.floor((oy - ry) * d) / d);
		const x1 = Math.min(this.W, ox + rx), y1 = Math.min(this.H, oy + ry);
		if (x1 <= x0 || y1 <= y0) {
			if (box.shown) {
				box.shown = false;
				c.style.display = 'none';
			}
			return;
		}
		if (!box.shown) {
			box.shown = true;
			c.style.display = '';
		}
		const budget = this.isMobile || this.coarse ? GL_BUDGET_TOUCH : GL_BUDGET_DESKTOP;
		const res = (w, h) => Math.min(d * GL_LEVELS[this.glLevel], Math.sqrt(budget / (w * h)), this.glMax / w, this.glMax / h);
		const bw0 = x1 - x0, bh0 = y1 - y0, q = res(bw0, bh0);
		const bw = Math.ceil(bw0 * q), bh = Math.ceil(bh0 * q);
		if (bw > box.w || bh > box.h || bw * bh < box.w * box.h * 0.25) {
			// Make room for where the camera is heading as well: a zoom grows the box every frame, and each
			// reallocation can cost a frame.
			const tr = L.disk * this.camZ * GL_REACH + 2;
			const tw0 = Math.min(2 * tr, this.W), th0 = Math.min(2 * tr * L.ty, this.H), tq = res(tw0, th0);
			box.w = Math.min(Math.ceil((Math.max(bw, tw0 * tq) * 1.15) / 16) * 16, this.glMax);
			box.h = Math.min(Math.ceil((Math.max(bh, th0 * tq) * 1.15) / 16) * 16, this.glMax);
			c.width = box.w;
			c.height = box.h;
			c.style.width = box.w + 'px';
			c.style.height = box.h + 'px';
		}
		const tf = 'translate3d(' + x0.toFixed(3) + 'px,' + y0.toFixed(3) + 'px,0) scale(' + (1 / q).toFixed(5) + ')';
		if (tf !== box.tf) {
			box.tf = tf;
			c.style.transform = tf;
		}
		// Draw into the buffer's top-left corner (GL y runs up); the rest stays transparent.
		gl.viewport(0, box.h - bh, bw, bh);
		gl.uniform2f(this.u.C, (ox - x0) * q, box.h - (oy - y0) * q);
		gl.uniform1f(this.u.R, R * q);
		gl.uniform1f(this.u.T, this.realT);
		gl.uniform1f(this.u.Ty, L.ty);
		gl.uniform1f(this.u.Scan, this.scanV);
		gl.uniform1f(this.u.Px, q);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}

	drawFx(L, Z, ox, oy, bz, hostB, focus, st, mob) {
		const ctx = this.ctx;
		if (!ctx) return;
		const W = this.W, H = this.H, TAU = Math.PI * 2, sv = this.scanV, sel = st.sel;
		ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
		ctx.clearRect(0, 0, W, H);
		ctx.lineWidth = 1;
		if (sv > 0.02) {
			ctx.globalAlpha = sv;
			ctx.strokeStyle = 'rgba(200,255,46,0.09)';
			ctx.setLineDash([]);
			const R = L.rmax * Z * 1.12;
			for (let i = 0; i < 12; i++) {
				const an = (i * TAU) / 12;
				ctx.beginPath();
				ctx.moveTo(ox + Math.cos(an) * L.disk * Z * 1.05, oy + Math.sin(an) * L.disk * Z * 1.05 * L.ty);
				ctx.lineTo(ox + Math.cos(an) * R, oy + Math.sin(an) * R * L.ty);
				ctx.stroke();
			}
			ctx.strokeStyle = 'rgba(200,255,46,0.28)';
			ctx.setLineDash([3, 4]);
			for (const b of all) {
				if (b.kind === 'hole' || b.kind === 'moon' || b.sx == null) continue;
				ctx.beginPath();
				ctx.moveTo(ox, oy);
				ctx.lineTo(b.sx, b.sy);
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
		}
		for (const b of all) {
			if (b.kind === 'hole' || b.kind === 'moon' || b.kind === 'rock') continue;
			if (sel === b.id) {
				ctx.setLineDash([]);
				ctx.lineWidth = 1.5;
				ctx.strokeStyle = 'rgba(200,255,46,0.85)';
			} else {
				ctx.setLineDash([2, 7]);
				ctx.lineWidth = 1;
				ctx.strokeStyle = sv > 0.5 ? 'rgba(200,255,46,0.32)' : focus ? 'rgba(241,238,247,0.07)' : 'rgba(241,238,247,0.2)';
			}
			ctx.beginPath();
			ctx.ellipse(ox, oy, b.r * Z, b.r * L.ty * Z, 0, 0, TAU);
			ctx.stroke();
		}
		ctx.setLineDash([]);
		ctx.lineWidth = 1;
		const span = L.rmax - L.rmin;
		ctx.fillStyle = sv > 0.5 ? '#c8ff2e' : '#b9b2a8';
		const bsz = 0.85 + 0.3 * (Z - 1), fa = (focus ? 0.4 : 1) * (sv > 0.5 ? 0.6 : 1);
		let lastB = -1;
		for (const p of this.belt) {
			const r = (L.rmin + span * p.t) * Z;
			const th = p.ph + p.sp * this.simT;
			const x = ox + r * Math.cos(th), y = oy + r * L.ty * Math.sin(th);
			if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
			if (p.b !== lastB) {
				lastB = p.b;
				ctx.globalAlpha = (0.3 + 0.5 * p.b) * fa;
			}
			const sz = p.s * bsz * (mob ? 0.8 : 1);
			ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
		}
		ctx.globalAlpha = 1;
		for (const h of hosts) {
			if (!h.rings) continue;
			// Ring bands as filled annuli at map scale, so moons stay in the gaps at any zoom. The overview
			// shows only the main bands, softly; the faint ones and the ringlets fade in as the camera zooms
			// closer. Scan mode swaps the fill for lime outlines.
			const u = this.moonUnit(h, L) * Z, dim = focus && focus !== h ? 0.35 : 1;
			const detail = Math.min(1, Math.max(0, (Z - 1.2) / 1.2));
			for (const [r0, r1, a0, detailOnly] of h.rings) {
				const a = detailOnly ? a0 * detail : a0 * (0.6 + 0.4 * detail);
				if (a < 0.004) continue;
				ctx.beginPath();
				ctx.ellipse(h.sx, h.sy, r1 * u, r1 * u * L.ty, 0, 0, TAU);
				ctx.ellipse(h.sx, h.sy, r0 * u, r0 * u * L.ty, 0, 0, TAU);
				if (sv < 1) {
					ctx.fillStyle = 'rgba(232,206,150,' + (a * dim * (1 - sv)).toFixed(3) + ')';
					ctx.fill('evenodd');
				}
				if (sv > 0.02) {
					ctx.setLineDash([2, 3]);
					ctx.strokeStyle = 'rgba(200,255,46,' + (0.45 * dim * sv * (detailOnly ? detail : 1)).toFixed(3) + ')';
					ctx.stroke();
					ctx.setLineDash([]);
				}
				if (a0 >= 0.3 && !detailOnly && sv < 1 && detail > 0) {
					// A couple of darker ringlets inside the bright bands.
					ctx.strokeStyle = 'rgba(40,24,6,' + (0.35 * dim * detail * (1 - sv)).toFixed(3) + ')';
					ctx.lineWidth = 0.75;
					for (const f of [0.35, 0.7]) {
						const rr = (r0 + (r1 - r0) * f) * u;
						ctx.beginPath();
						ctx.ellipse(h.sx, h.sy, rr, rr * L.ty, 0, 0, TAU);
						ctx.stroke();
					}
					ctx.lineWidth = 1;
				}
			}
		}
		for (const m of moons) {
			const on = sel === m.id, active = m.host === hostB;
			// Moons in a ring system only show an orbit line when selected; the gaps already show it.
			if (m.host.rings && !on) continue;
			const h = m.host, c = h.rings ? '232,206,150' : h.barycenter ? '214,226,240' : '255,46,136';
			ctx.setLineDash(on ? [] : [2, 5]);
			ctx.strokeStyle = 'rgba(' + c + ',' + (on ? 0.9 : active ? 0.35 : 0.12) + ')';
			ctx.beginPath();
			ctx.ellipse(h.csx, h.csy, m.r * Z, m.r * L.ty * Z, 0, 0, TAU);
			ctx.stroke();
			if (h.barycenter) {
				// The planet's own small orbit, and a tick marking the barycenter both bodies circle.
				const pr = h.barycenter * this.moonUnit(h, L) * Z;
				ctx.setLineDash(sel === h.id ? [] : [2, 5]);
				ctx.strokeStyle = 'rgba(' + c + ',' + (sel === h.id ? 0.9 : active ? 0.35 : 0.12) + ')';
				ctx.beginPath();
				ctx.ellipse(h.csx, h.csy, pr, pr * L.ty, 0, 0, TAU);
				ctx.stroke();
				if (active) {
					ctx.setLineDash([]);
					ctx.strokeStyle = 'rgba(' + c + ',0.55)';
					ctx.beginPath();
					ctx.moveTo(h.csx - 3, h.csy);
					ctx.lineTo(h.csx + 3, h.csy);
					ctx.moveTo(h.csx, h.csy - 3);
					ctx.lineTo(h.csx, h.csy + 3);
					ctx.stroke();
				}
			}
		}
		ctx.setLineDash([]);
		if (pulsar) {
			const px = pulsar.sx, py = pulsar.sy;
			const a = this.realT * 4.4;
			const len = 150 * bz, w = 5 * bz;
			ctx.globalAlpha = focus && focus !== pulsar ? 0.3 : 0.95;
			for (let j = 0; j < 2; j++) {
				const an = a + j * Math.PI;
				const dx = Math.cos(an), dy = Math.sin(an);
				const ex = px + dx * len, ey = py + dy * len;
				const gr = ctx.createLinearGradient(px, py, ex, ey);
				gr.addColorStop(0, 'rgba(200,255,46,0.7)');
				gr.addColorStop(1, 'rgba(200,255,46,0)');
				ctx.fillStyle = gr;
				ctx.beginPath();
				ctx.moveTo(px, py);
				ctx.lineTo(ex - dy * w, ey + dx * w);
				ctx.lineTo(ex + dy * w, ey - dx * w);
				ctx.closePath();
				ctx.fill();
			}
		}
		ctx.globalAlpha = 1;
		const c = this.comet;
		if (c && c.sx != null) {
			// The tails live in map units around the hole, so they hold together while the camera moves.
			ctx.setTransform(this.dpr * Z, 0, 0, this.dpr * Z, this.dpr * ox, this.dpr * oy);
			c.tail.draw(ctx, c.px, c.py, 1 / Z);
			ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
		}
		const P = this.ptr;
		const hel = this.hoverEl;
		if (P && !mob && hel && hel.isConnected) {
			const age = Math.min(1, (this.realT - this.hoverT0) * 7);
			const r = 17 - 7 * age, arm = 5;
			ctx.save();
			ctx.translate(P.x, P.y);
			ctx.strokeStyle = '#c8ff2e';
			ctx.lineWidth = 1.75;
			ctx.globalAlpha = 0.35 + 0.65 * age;
			ctx.beginPath();
			for (let q = 0; q < 4; q++) {
				const sx = q % 2 ? 1 : -1, sy = q < 2 ? -1 : 1;
				ctx.moveTo(sx * r, sy * (r - arm));
				ctx.lineTo(sx * r, sy * r);
				ctx.lineTo(sx * (r - arm), sy * r);
			}
			ctx.stroke();
			ctx.restore();
			ctx.globalAlpha = 1;
			ctx.fillStyle = '#ff2e88';
			ctx.fillRect(P.x - 1.5, P.y - 1.5, 3, 3);
			if (st.scan) {
				ctx.font = '500 10px "Geist Mono", ui-monospace, monospace';
				ctx.fillStyle = 'rgba(200,255,46,0.9)';
				const label = hel.dataset.name || '';
				ctx.fillText(label.toUpperCase(), P.x + 20, P.y - 16);
			}
		}
	}
}
