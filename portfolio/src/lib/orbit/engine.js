import { kep, all, byId, moons, blog, pulsar } from './system.js';

/** WebGL pixels per CSS pixel: starts at 60% of the device's pixel ratio (never below 1:1) and can drop to MIN_SCALE. */
const BASE_SCALE = 0.6;
const MIN_SCALE = 0.5;
/** Frame-rate caps. The motion is slow orbits and a swirl, so lower rates look nearly identical. */
const FPS_DESKTOP = 60;
const FPS_TOUCH = 30;

/**
 * Drives the system map every animation frame: orbits, camera, the WebGL
 * black hole and the 2D effects canvas. It writes transforms straight onto the
 * body elements; Svelte only renders the markup and the UI around it.
 */
export class OrbitEngine {
	/**
	 * @param {object} o
	 * @param {HTMLElement} o.root
	 * @param {HTMLCanvasElement} o.glCanvas
	 * @param {HTMLCanvasElement} o.fxCanvas
	 * @param {HTMLElement} o.holeEl
	 * @param {HTMLElement} o.clockEl
	 * @param {Record<string, HTMLElement>} o.els body id -> element
	 * @param {() => {sel: string|null, blog: boolean, reading: string|null, closing: boolean, scan: boolean}} o.getState
	 * @param {(ok: boolean) => void} o.onGLChange called when WebGL becomes unavailable (false) or comes back (true)
	 * @param {() => void} o.onReady
	 */
	constructor(o) {
		Object.assign(this, o);
		this.timeScale = 2.2;
		this.tiltY = 1;
		this.glScale = 1;
		this.cam = { x: 0, y: 0, z: 1, cx: 0, cy: 0, init: false };
		this.simT = 0;
		this.moonT = 0;
		this.realT = 0;
		this.readT0 = 0;
		this.spd = 1;
		this.lastFrame = 0;
		this.frameClock = 0;
		this.perf = { n: 0, sum: 0, skip: 5 };
		this.scanV = 0;
		this.frame = 0;
		this.W = 1440;
		this.H = 900;
		this.isMobile = false;
		this.q2 = 1;
		this.qGL = 1;
		this.ptr = null;
		this.hoverEl = null;
		this.hoverT0 = 0;
		this.parts = new Map();

		let seed = 11;
		const rnd = () => {
			seed = (seed * 16807) % 2147483647;
			return (seed - 1) / 2147483646;
		};
		this.belt = [];
		for (let i = 0; i < 360; i++) {
			const g = (rnd() + rnd() + rnd() - 1.5) / 1.5;
			const t = 0.44 + g * 0.065;
			this.belt.push({ t, ph: rnd() * Math.PI * 2, sp: kep(t) * (0.94 + rnd() * 0.12), s: 1 + rnd() * 1.6, b: 0.35 + rnd() * 0.65 });
		}
	}

	start() {
		this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		this.coarse = window.matchMedia('(pointer: coarse)').matches;
		this.glScale = Math.max(1, Math.min(window.devicePixelRatio || 1, 2) * BASE_SCALE);
		// Phones drop the GPU context when backgrounded for a while. Without handling this the canvas
		// stays blank (Chrome shows a white "sad face" placeholder) until the page is reloaded.
		this.onContextLost = (e) => {
			e.preventDefault(); // allows the browser to restore the context
			this.gl = null;
			this.onGLChange(false);
		};
		this.onContextRestored = () => {
			if (this.initGL()) this.sizeGL();
		};
		this.glCanvas.addEventListener('webglcontextlost', this.onContextLost);
		this.glCanvas.addEventListener('webglcontextrestored', this.onContextRestored);
		this.onVisible = () => {
			if (!document.hidden) this.frameClock = this.lastFrame = performance.now();
		};
		document.addEventListener('visibilitychange', this.onVisible);
		this.initGL();
		if (this.fxCanvas) this.ctx = this.fxCanvas.getContext('2d');
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

	/** Call when the reader opens; rendering pauses once its iris has covered the map. */
	markRead() {
		this.readT0 = this.realT;
	}

	pointerMove(e) {
		if (e.pointerType === 'touch') {
			this.ptr = null;
			return;
		}
		const r = this.root.getBoundingClientRect();
		const sx = r.width ? this.W / r.width : 1;
		const sy = r.height ? this.H / r.height : 1;
		this.ptr = { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
	}

	pointerLeave() {
		this.ptr = null;
		this.hoverEl = null;
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
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		this.q2 = dpr;
		if (this.fxCanvas) {
			this.fxCanvas.width = Math.round(this.W * dpr);
			this.fxCanvas.height = Math.round(this.H * dpr);
		}
		this.sizeGL();
	}

	sizeGL() {
		if (!this.gl || !this.glCanvas) return;
		const w = Math.max(1, Math.round(this.W * this.glScale));
		const h = Math.max(1, Math.round(this.H * this.glScale));
		if (this.glCanvas.width !== w || this.glCanvas.height !== h) {
			this.glCanvas.width = w;
			this.glCanvas.height = h;
		}
		this.qGL = w / this.W;
		this.gl.viewport(0, 0, w, h);
	}

	/** Builds the shader program; also runs again after a lost context is restored. Returns whether WebGL works. */
	initGL() {
		const c = this.glCanvas;
		let gl = null;
		try {
			gl = c.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power' });
		} catch {
			gl = null;
		}
		const fail = () => {
			this.gl = null;
			this.onGLChange(false);
			return false;
		};
		if (!gl || gl.isContextLost()) return fail();
		const mk = (type, src) => {
			const s = gl.createShader(type);
			gl.shaderSource(s, src);
			gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
				console.warn(gl.getShaderInfoLog(s));
				return null;
			}
			return s;
		};
		const vs = mk(gl.VERTEX_SHADER, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }');
		const fs = mk(gl.FRAGMENT_SHADER, FRAG);
		if (!vs || !fs) return fail();
		const pr = gl.createProgram();
		gl.attachShader(pr, vs);
		gl.attachShader(pr, fs);
		gl.linkProgram(pr);
		if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return fail();
		gl.useProgram(pr);
		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		const loc = gl.getAttribLocation(pr, 'p');
		gl.enableVertexAttribArray(loc);
		gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
		const U = (n) => gl.getUniformLocation(pr, n);
		this.u = { C: U('uC'), R: U('uR'), T: U('uT'), Ty: U('uTy'), Scan: U('uScan'), Px: U('uPx') };
		this.gl = gl;
		this.onGLChange(true);
		return true;
	}

	/**
	 * Adaptive quality: average the frame interval over 40 frames (or 1.5 s on very slow devices)
	 * and, if the device can't keep up with the frame cap, render the shader at a lower resolution.
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
		if (mean > interval * 1.35 && this.glScale > MIN_SCALE) {
			this.glScale = Math.max(MIN_SCALE, this.glScale * 0.75);
			this.sizeGL();
			p.skip = 3;
		}
	}

	/** Cached .dotwrap / .shade children of a body element. */
	partsOf(el) {
		let p = this.parts.get(el);
		if (!p) {
			p = { wrap: el.querySelector('.dotwrap'), shade: el.querySelector('.shade') };
			this.parts.set(el, p);
		}
		return p;
	}

	tick(now) {
		if (document.hidden) return;
		const st = this.getState();
		if (st.reading && !st.closing && this.realT - this.readT0 > 1.1) {
			// The reader covers the map, so stop rendering until it closes.
			this.frameClock = this.lastFrame = now;
			return;
		}
		const interval = 1000 / (this.isMobile || this.coarse ? FPS_TOUCH : FPS_DESKTOP);
		const sinceClock = now - this.frameClock;
		if (sinceClock < interval - 1.5) return;
		// Keep a steady cadence on displays faster than the cap (120 Hz phones, 144 Hz monitors).
		this.frameClock = sinceClock > interval * 3 ? now : now - (sinceClock % interval);
		const elapsed = now - this.lastFrame;
		this.lastFrame = now;
		this.samplePerf(elapsed, interval);
		let dt = elapsed / 1000;
		if (!(dt > 0)) dt = 0.016;
		dt = Math.min(dt, 0.05);
		this.frame++;
		const mob = this.isMobile, isBlog = st.blog;
		const L = this.layout();
		const ts = this.timeScale * (this.reduced ? 0.25 : 1);
		const g = blog;
		// The camera zooms in on The Log while orbiting it, otherwise on whatever is selected. The black
		// hole is the centre of everything, so selecting it only zooms in gently and keeps the system moving.
		const selB = st.sel ? byId[st.sel] : null;
		const focus = isBlog ? g : selB && selB.kind !== 'hole' ? selB : null;
		const target = focus ? 0.03 : st.sel ? 0.3 : 1;
		this.spd += (target - this.spd) * Math.min(1, dt * 2.5);
		this.simT += dt * this.spd * ts;
		this.moonT += dt * ts * (st.reading ? 0 : isBlog ? 1 : 0.6);
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
			m.r = L.moonR * m.mt;
			m.th = m.phase + m.mspeed * this.moonT;
			m.c = Math.cos(m.th);
			m.s = Math.sin(m.th);
			m.px = g.px + m.r * m.c;
			m.py = g.py + m.r * L.ty * m.s;
		}
		let tz = 1, tfx = 0, tfy = 0, tcx = L.cx, tcy = L.cy;
		if (focus) {
			tz = mob ? 2.4 : 2.7;
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
		const ox = cam.cx - cam.x * Z, oy = cam.cy - cam.y * Z;
		const bz = L.bs * (1 + (Z - 1) * 0.32);
		const blogZ = Math.round(200 + g.s * 100);

		for (const b of all) {
			if (b.kind === 'hole') continue;
			const x = ox + b.px * Z, y = oy + b.py * Z;
			b.sx = x;
			b.sy = y;
			const el = this.els[b.id];
			if (!el) continue;
			const depth = L.ty < 0.98 ? b.s : 0;
			let sc = bz * (1 + 0.1 * depth);
			let op = 0.7 + 0.3 * (depth * 0.5 + 0.5);
			let zi = Math.round(200 + depth * 100);
			if (b.kind === 'moon') {
				sc = bz * (isBlog ? 1.25 : 0.55);
				if (!isBlog) op = focus ? 0.16 : 0.45;
				zi = blogZ + 2;
			} else if (focus && b !== focus) op *= 0.35;
			el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
			el.style.opacity = op.toFixed(3);
			el.style.zIndex = String(zi);
			const p = this.partsOf(el);
			if (p.wrap) p.wrap.style.transform = 'scale(' + sc.toFixed(3) + ')';
			// Drawn radius, so the hover label sits just below the body at any zoom.
			const rad = (b.ring ? b.size : b.size / 2) * sc;
			if (!(Math.abs(rad - p.r) < 0.3)) {
				p.r = rad;
				el.style.setProperty('--r', rad.toFixed(1) + 'px');
			}
			if (b.shaded && p.shade) {
				const an = Math.atan2(y - oy, x - ox);
				p.shade.style.transform = 'rotate(' + an.toFixed(3) + 'rad)';
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
			this.holeEl.style.transform = 'translate3d(' + ox.toFixed(1) + 'px,' + oy.toFixed(1) + 'px,0)';
		}
		if (this.clockEl && this.frame % 15 === 0) {
			const s = Math.floor(this.realT);
			this.clockEl.textContent = 'T+ ' + String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
		}

		this.drawFx(L, Z, ox, oy, bz, isBlog, focus, st, mob);

		if (this.gl) {
			const gl = this.gl, qq = this.qGL;
			gl.uniform2f(this.u.C, ox * qq, (this.H - oy) * qq);
			gl.uniform1f(this.u.R, L.disk * Z * qq);
			gl.uniform1f(this.u.T, this.realT);
			gl.uniform1f(this.u.Ty, L.ty);
			gl.uniform1f(this.u.Scan, this.scanV);
			gl.uniform1f(this.u.Px, qq);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		}
		if (this.frame === 1) this.onReady();
	}

	drawFx(L, Z, ox, oy, bz, isBlog, focus, st, mob) {
		const ctx = this.ctx;
		if (!ctx) return;
		const W = this.W, H = this.H, TAU = Math.PI * 2, sv = this.scanV, sel = st.sel;
		ctx.setTransform(this.q2, 0, 0, this.q2, 0, 0);
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
		const bsz = 0.85 + 0.3 * (Z - 1);
		for (const p of this.belt) {
			const r = (L.rmin + span * p.t) * Z;
			const th = p.ph + p.sp * this.simT;
			const x = ox + r * Math.cos(th), y = oy + r * L.ty * Math.sin(th);
			if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
			ctx.globalAlpha = (0.3 + 0.5 * p.b) * (focus ? 0.4 : 1) * (sv > 0.5 ? 0.6 : 1);
			const sz = p.s * bsz * (mob ? 0.8 : 1);
			ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
		}
		ctx.globalAlpha = 1;
		const gx = blog.sx, gy = blog.sy;
		for (const m of moons) {
			const on = sel === m.id;
			ctx.setLineDash(on ? [] : [2, 5]);
			ctx.strokeStyle = on ? 'rgba(255,46,136,0.9)' : isBlog ? 'rgba(255,46,136,0.35)' : 'rgba(255,46,136,0.12)';
			ctx.beginPath();
			ctx.ellipse(gx, gy, m.r * Z, m.r * L.ty * Z, 0, 0, TAU);
			ctx.stroke();
		}
		ctx.setLineDash([]);
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
		ctx.globalAlpha = 1;
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
				const label = (hel.getAttribute('aria-label') || '').replace(/^Post: /, '').replace(/:.*$/, '');
				ctx.fillText(label.toUpperCase(), P.x + 20, P.y - 16);
			}
		}
	}
}

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uC; uniform float uR; uniform float uT; uniform float uTy; uniform float uScan; uniform float uPx;
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
vec3 band(float k){
  if(k < 1.5) return vec3(0.231,0.051,0.369);
  if(k < 2.5) return vec3(0.761,0.094,0.478);
  if(k < 3.5) return vec3(1.0,0.353,0.122);
  if(k < 4.5) return vec3(1.0,0.788,0.235);
  return vec3(1.0,0.957,0.839);
}
float dens(float ang0, float r, float sh){
  float ang = ang0 + sh;
  float arms = 0.5 + 0.5*sin(3.0*ang + log(r)*9.0);
  float str = 0.5 + 0.5*sin(17.0*ang + r*31.0 + 2.0*sin(5.0*ang - uT*0.6));
  return 0.2 + 0.55*arms + 0.3*str;
}
void main(){
  vec2 f = gl_FragCoord.xy;
  vec3 lime = vec3(0.784,1.0,0.18);
  vec3 col = vec3(0.027,0.024,0.043);
  float cs = 46.0*uPx;
  vec2 cell = floor(f/cs); vec2 lc = f - cell*cs;
  float h = hash(cell);
  if(h > 0.55){
    vec2 sp = (0.2 + 0.6*vec2(hash(cell+1.3), hash(cell+7.1)))*cs;
    vec2 d = (lc - sp)/uPx;
    float tw = 0.55 + 0.45*sin(uT*(0.6 + h*2.0) + h*40.0);
    if(h > 0.968){
      float sz = 4.0 + 4.0*hash(cell+3.3);
      float s = max(smoothstep(0.9,0.0,abs(d.x))*smoothstep(sz,0.0,abs(d.y)), smoothstep(0.9,0.0,abs(d.y))*smoothstep(sz,0.0,abs(d.x)));
      s = max(s, smoothstep(1.7,0.6,length(d)));
      col += mix(vec3(0.95,0.93,1.0), lime, uScan*0.8)*s*tw;
    } else {
      float s = smoothstep(1.1,0.2,length(d))*(0.25 + 0.6*hash(cell+5.5));
      col += vec3(0.85,0.85,1.0)*s*tw*(1.0 - uScan*0.5);
    }
  }
  vec2 p = (f - uC)/uR;
  vec2 q = vec2(p.x, p.y/uTy);
  float rp = length(p); float rq = length(q);
  // The disk, halftone and photon ring all fade to exactly zero before 1.75 disk radii (allowing for the
  // halftone cell size), so most of the screen only needs the stars and grain.
  if(rq < 1.75){
    float a = atan(q.y, q.x);
    float rs = 0.24; float inner = 0.30;
    float rqc = max(rq, 0.05);
    float w = pow(inner/rqc, 1.5);
    float edge = smoothstep(inner - 0.01, inner + 0.05, rq)*(1.0 - smoothstep(0.5, 1.0, rq));
    float heat = pow(inner/max(rq, inner), 1.3);
    float PER = 9.0;
    float t1 = mod(uT, PER); float t2 = mod(uT + 0.5*PER, PER);
    float w1 = 1.0 - abs(t1/PER*2.0 - 1.0);
    float base = a + uT*0.35;
    float d1 = dens(base, rqc, w*t1*0.8);
    float d2 = dens(base, rqc, w*t2*0.8);
    float dd = clamp(edge*mix(d2, d1, w1)*(0.4 + 0.8*heat), 0.0, 0.999);
    float x = dd*5.5;
    float k = floor(x);
    float fill = step(1.0, k);
    float fe = fract(x); float e = min(fe, 1.0 - fe);
    float contour = smoothstep(0.09, 0.0, e)*step(0.12, dd);
    vec3 filled = mix(col, band(k), fill);
    vec3 scanC = col + lime*contour*0.85 + lime*0.04*edge;
    col = mix(filled, scanC, uScan);
    float hc = 7.0*uPx; vec2 cc = (floor(f/hc) + 0.5)*hc;
    vec2 pc = (cc - uC)/uR; float rcc = length(vec2(pc.x, pc.y/uTy));
    float g = pow(smoothstep(1.55, 0.8, rcc), 2.0)*step(0.62, rcc);
    float hr = hc*0.36*sqrt(g);
    float dotm = g > 0.003 ? 1.0 - smoothstep(hr - 0.75*uPx, hr + 0.75*uPx, length(f - cc)) : 0.0;
    vec3 htc = mix(vec3(0.34,0.06,0.31), lime*0.3, uScan);
    col = mix(col, htc, dotm*(1.0 - fill*(1.0 - uScan)));
    float sh = step(rp, rs);
    col = mix(col, vec3(0.0), sh*(1.0 - uScan*0.9));
    float rr0 = rs + 0.014; float rw = 0.018; float off = 0.013;
    float cr = smoothstep(rw, 0.0, abs(length(p + vec2(off, 0.0)) - rr0));
    float cg = smoothstep(rw, 0.0, abs(rp - rr0));
    float cb = smoothstep(rw, 0.0, abs(length(p - vec2(off, 0.0)) - rr0));
    vec3 ringc = vec3(max(cr, cg), cg, max(cb, cg));
    col = mix(col + ringc*1.3, col + lime*cg, uScan);
    col += lime*uScan*smoothstep(0.008, 0.0, abs(rp - rs))*0.9;
  }
  col += (hash(f*0.73 + fract(uT*0.37)*91.0) - 0.5)*0.05;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
