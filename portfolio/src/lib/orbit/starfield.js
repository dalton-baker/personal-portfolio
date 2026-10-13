/**
 * The starfield behind the map: background colour, film grain and stars, each twinkling at its own pace.
 * It runs in a worker on an OffscreenCanvas where the browser supports that (starfield.worker.js), and
 * on the main thread otherwise; the engine moves the canvas for the parallax either way.
 */

/** Redraws per second, for the twinkle and grain. */
export const STAR_FPS = 20;
/** Starfield grid (CSS px): about 45% of the cells hold a star, a few of them four-pointed. */
const STAR_CELL = 46;
/** How far the star canvas overhangs the map on each side (see .starc), so the parallax never shows its edge. */
const STAR_PAD = 8;
/** Film grain tile, in CSS px. */
const GRAIN = 256;

const smooth = (e0, e1, x) => {
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};

/** A scratch canvas, in a worker or on the page. */
const makeCanvas = (w, h) =>
	typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });

export class Starfield {
	/**
	 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
	 * @param {boolean} reduced prefers-reduced-motion: a slower twinkle and still grain
	 */
	constructor(canvas, reduced) {
		this.c = canvas;
		this.g = canvas.getContext('2d', { alpha: false });
		this.reduced = reduced;
		this.grain = makeGrain(this.g);
		this.stars = [];
		this.sprites = null;
		this.dpr = 0;
		/** Twinkle clock (s), and the scan-mode tint easing toward its target. */
		this.t = 0;
		this.scan = 0;
		this.scanTarget = 0;
	}

	/** Sizes the canvas for a w x h (CSS px) map and lays out the stars, then draws. */
	size(w, h, dpr) {
		const cw = w + STAR_PAD * 2, ch = h + STAR_PAD * 2;
		this.c.width = Math.round(cw * dpr);
		this.c.height = Math.round(ch * dpr);
		if (dpr !== this.dpr) {
			this.sprites = makeStarSprites(dpr);
			this.dpr = dpr;
		}
		this.stars = layoutStars(cw, ch);
		this.draw();
	}

	/** Advances the twinkle and scan tint by dt seconds, then draws. */
	frame(dt) {
		this.t += dt * (this.reduced ? 0.3 : 1);
		this.scan += (this.scanTarget - this.scan) * Math.min(1, dt * 6);
		this.draw();
	}

	/** Background and grain, then the stars added on top as light. Scan mode dims the small stars and turns the bright ones lime. */
	draw() {
		const g = this.g, S = this.sprites, c = this.c, d = this.dpr;
		if (!g || !S) return;
		g.setTransform(d, 0, 0, d, 0, 0);
		g.globalCompositeOperation = 'source-over';
		g.globalAlpha = 1;
		g.imageSmoothingEnabled = false;
		// The grain tile jumps to a new offset on every redraw, so it shimmers.
		const gx = this.reduced ? 0 : Math.floor(Math.random() * GRAIN), gy = this.reduced ? 0 : Math.floor(Math.random() * GRAIN);
		g.translate(-gx, -gy);
		g.fillStyle = this.grain;
		g.fillRect(gx, gy, c.width / d, c.height / d);
		g.setTransform(1, 0, 0, 1, 0, 0);
		g.globalCompositeOperation = 'lighter';
		const t = this.t, sv = this.scan, dim = 1 - sv * 0.5, lime = sv * 0.8;
		for (const s of this.stars) {
			const tw = 0.55 + 0.45 * Math.sin(t * s.f + s.ph);
			const x = Math.round(s.x * d), y = Math.round(s.y * d);
			if (s.spark) {
				const sp = S.spark(s.spark);
				if (lime < 0.99) {
					g.globalAlpha = tw * (1 - lime);
					g.drawImage(sp.white.cv, x - sp.white.c, y - sp.white.c);
				}
				if (lime > 0.01) {
					g.globalAlpha = tw * lime;
					g.drawImage(sp.lime.cv, x - sp.lime.c, y - sp.lime.c);
				}
			} else {
				g.globalAlpha = tw * s.b * dim;
				g.drawImage(S.dot.cv, x - S.dot.c, y - S.dot.c);
			}
		}
		g.globalAlpha = 1;
		g.globalCompositeOperation = 'source-over';
	}
}

/** A random sequence fixed by a starfield cell, so the stars stay put when the map is resized. */
function cellRandom(i, j) {
	let s = (Math.imul(i, 73856093) ^ Math.imul(j, 19349663) ^ 0x5bd1e995) >>> 0;
	return () => {
		s = (s + 0x6d2b79f5) >>> 0;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Stars for a w x h (CSS px) area, at most one per grid cell: most are small dots of varying brightness, a
 * few are four-pointed. `f` and `ph` set the twinkle's pace and phase.
 */
function layoutStars(w, h) {
	const stars = [];
	for (let j = 0; j * STAR_CELL < h; j++) {
		for (let i = 0; i * STAR_CELL < w; i++) {
			const r = cellRandom(i, j);
			const k = r();
			if (k <= 0.55) continue;
			const star = { x: (i + 0.2 + 0.6 * r()) * STAR_CELL, y: (j + 0.2 + 0.6 * r()) * STAR_CELL, f: 0.6 + k * 2, ph: k * 40 };
			if (k > 0.968) star.spark = Math.round((4 + 4 * r()) * 2) / 2; // arm length (px), in half-pixel steps
			else star.b = 0.25 + 0.6 * r();
			stars.push(star);
		}
	}
	return stars;
}

/**
 * A star sprite at device resolution, centred on a pixel. `shape(x, y)` is its brightness at an offset in
 * CSS px; `reach` is how far that goes.
 */
function starSprite(dpr, reach, rgb, shape) {
	const c = Math.ceil(reach * dpr), n = c * 2 + 1;
	const cv = makeCanvas(n, n);
	const g = cv.getContext('2d');
	const img = g.createImageData(n, n), px = img.data;
	for (let y = 0; y < n; y++) {
		for (let x = 0; x < n; x++) {
			const o = (y * n + x) * 4;
			px[o] = rgb[0];
			px[o + 1] = rgb[1];
			px[o + 2] = rgb[2];
			px[o + 3] = Math.round(shape((x - c) / dpr, (y - c) / dpr) * 255);
		}
	}
	g.putImageData(img, 0, 0);
	return { cv, c };
}

/** The small round star, and the four-pointed ones (made on first use for each arm length, in white and in lime). */
function makeStarSprites(dpr) {
	const sparks = new Map();
	const sparkShape = (sz) => (x, y) => {
		const ax = Math.abs(x), ay = Math.abs(y);
		return Math.max(smooth(0.9, 0, ax) * smooth(sz, 0, ay), smooth(0.9, 0, ay) * smooth(sz, 0, ax), smooth(1.7, 0.6, Math.hypot(x, y)));
	};
	return {
		dot: starSprite(dpr, 1.1, [217, 217, 255], (x, y) => smooth(1.1, 0.2, Math.hypot(x, y))),
		spark(sz) {
			let s = sparks.get(sz);
			if (!s) {
				s = { white: starSprite(dpr, sz, [242, 237, 255], sparkShape(sz)), lime: starSprite(dpr, sz, [200, 255, 46], sparkShape(sz)) };
				sparks.set(sz, s);
			}
			return s;
		}
	};
}

/** A tile of the background colour with film grain (up to 2.5% brighter or darker per CSS px), as a repeating pattern. */
function makeGrain(g) {
	const cv = makeCanvas(GRAIN, GRAIN);
	const c = cv.getContext('2d');
	const img = c.createImageData(GRAIN, GRAIN), px = img.data;
	for (let o = 0; o < px.length; o += 4) {
		const v = (Math.random() - 0.5) * 12.75;
		px[o] = 7 + v;
		px[o + 1] = 6 + v;
		px[o + 2] = 11 + v;
		px[o + 3] = 255;
	}
	c.putImageData(img, 0, 0);
	return g.createPattern(cv, 'repeat');
}
