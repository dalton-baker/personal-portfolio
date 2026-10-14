/**
 * A comet's tails (on the map, and for Slingshot's comets). The comet orbits whatever sits at (0, 0) and
 * both tails point away from it, as a real comet's do:
 * - the ion tail: a long, solid ribbon pointing straight away from the core, easing into a slight curve
 *   back along the comet's path, with a little drift only past that curve;
 * - the dust tail: a fainter, warmer ribbon that fans out as it curves back along the path.
 * Both start as wide as the nucleus and grow longer as the comet nears the core. Everything is in the
 * caller's units; `unit` sets the scale.
 */

let coma = null;

/** A soft round glow for the coma, drawn scaled and faded. */
function comaSprite() {
	if (coma) return coma;
	const n = 64, c = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(n, n) : Object.assign(document.createElement('canvas'), { width: n, height: n });
	const g = c.getContext('2d');
	if (g) {
		const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
		gr.addColorStop(0, 'rgba(214,240,255,1)');
		gr.addColorStop(0.35, 'rgba(214,240,255,0.45)');
		gr.addColorStop(1, 'rgba(214,240,255,0)');
		g.fillStyle = gr;
		g.fillRect(0, 0, n, n);
	}
	return (coma = c);
}

/** Points along each tail's centre line. */
const N = 28;

export class CometTail {
	/** @param {number} unit */
	constructor(unit) {
		this.unit = unit;
		this.t = Math.random() * 10;
		this.strength = -1;
		/** Opacity, for fading a comet out. */
		this.alpha = 1;
		/** Unit vector pointing back along the comet's path (smoothed), for the bend. */
		this.bx = 0;
		this.by = 0;
		this.xs = new Float32Array(N);
		this.ys = new Float32Array(N);
	}

	/** Advances dt seconds for a comet at (x, y) moving at (vx, vy); `strength` is about 0.3 far out to 1.6 up close. */
	update(dt, x, y, vx, vy, strength) {
		this.t += dt;
		this.strength = this.strength < 0 ? strength : this.strength + (strength - this.strength) * Math.min(1, dt * 3);
		const v = Math.hypot(vx, vy);
		if (v > 1e-6) {
			const k = this.bx || this.by ? Math.min(1, dt * 6) : 1;
			this.bx += (-vx / v - this.bx) * k;
			this.by += (-vy / v - this.by) * k;
			const b = Math.hypot(this.bx, this.by) || 1;
			this.bx /= b;
			this.by /= b;
		}
	}

	/**
	 * The centre line of a tail from the nucleus at (x, y), `len` long, heading along (ax, ay): straight at
	 * first, then from `curveFrom` (a fraction of the way along) it curves back along the path by `bend` (a
	 * fraction of its length, reached at the end), and only from `driftFrom` on does it drift a little, by up
	 * to `drift` of its length, slowly.
	 */
	line(x, y, ax, ay, len, curveFrom, bend, driftFrom, drift, phase) {
		const nx = -ay, ny = ax, bx = this.bx, by = this.by;
		for (let i = 0; i < N; i++) {
			const f = i / (N - 1), s = f * len;
			const c = Math.max(0, (f - curveFrom) / (1 - curveFrom)), e = Math.max(0, (f - driftFrom) / (1 - driftFrom));
			const b = bend * len * c * c;
			const w = drift * len * e * e * Math.sin(f * Math.PI * 1.6 - this.t * 1.3 + phase);
			this.xs[i] = x + ax * s + bx * b + nx * w;
			this.ys[i] = y + ay * s + by * b + ny * w;
		}
	}

	/** Fills a ribbon along the current centre line, `width(f)` wide at fraction f of the way along. */
	ribbon(ctx, width) {
		const xs = this.xs, ys = this.ys;
		ctx.beginPath();
		for (let side = 1; side >= -1; side -= 2) {
			for (let k = 0; k < N; k++) {
				const i = side > 0 ? k : N - 1 - k, a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
				const tx = xs[b] - xs[a], ty = ys[b] - ys[a], tl = Math.hypot(tx, ty) || 1, h = (width(i / (N - 1)) / 2) * side;
				const px = xs[i] - (ty / tl) * h, py = ys[i] + (tx / tl) * h;
				if (k === 0 && side > 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
		}
		ctx.closePath();
		ctx.fill();
	}

	/** A gradient from the nucleus to the end of the current centre line. */
	fade(ctx, rgb, stops) {
		const g = ctx.createLinearGradient(this.xs[0], this.ys[0], this.xs[N - 1], this.ys[N - 1]);
		for (const [at, a] of stops) g.addColorStop(at, 'rgba(' + rgb + ',' + a + ')');
		return g;
	}

	/**
	 * Draws both tails and the glow around the nucleus at (x, y); `px` is one screen pixel in these units.
	 * The tails start as wide as the nucleus (`head`, 7 screen pixels unless given) and point away from
	 * (0, 0) unless a direction (ax, ay) is given.
	 */
	draw(ctx, x, y, px, ax, ay, head = 7 * px) {
		if (ax == null || (!ax && !ay)) {
			const d = Math.hypot(x, y) || 1;
			ax = x / d;
			ay = y / d;
		}
		const len = this.unit * (0.75 + 0.85 * Math.max(0.3, this.strength));
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		ctx.globalAlpha = this.alpha;

		// Dust: shorter and fainter, fanning out as it curves back along the path.
		this.line(x, y, ax, ay, len * 0.72, 0.15, 0.4, 0.6, 0.012, 1.3);
		ctx.fillStyle = this.fade(ctx, '255,236,214', [[0, 0.3], [0.45, 0.13], [1, 0]]);
		this.ribbon(ctx, (f) => head * (1 + 3.2 * f));

		// Ion: long and straight, easing into a slight curve, with a little drift only past that.
		this.line(x, y, ax, ay, len, 0.35, 0.13, 0.6, 0.018, 0);
		const cx = Float32Array.from(this.xs), cy = Float32Array.from(this.ys);
		const wide = (f) => head * (1 + 0.9 * f);
		ctx.fillStyle = this.fade(ctx, '170,220,255', [[0, 0.55], [0.35, 0.26], [1, 0]]);
		this.ribbon(ctx, wide);
		ctx.fillStyle = this.fade(ctx, '228,246,255', [[0, 0.85], [0.3, 0.3], [0.75, 0]]);
		this.ribbon(ctx, (f) => head * 0.5 * (1 + 0.3 * f));
		// Two fainter strands inside it, following its line, for a little texture.
		ctx.lineWidth = Math.max(px * 0.75, head * 0.1);
		for (const [side, ph] of [[0.55, 1.7], [-0.5, 3.9]]) {
			for (let i = 0; i < N; i++) {
				const f = i / (N - 1), a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
				const tx = cx[b] - cx[a], ty = cy[b] - cy[a], tl = Math.hypot(tx, ty) || 1;
				const e = Math.max(0, (f - 0.6) / 0.4), off = (side * wide(f)) / 2 + 0.012 * len * e * e * Math.sin(f * 5 - this.t * 1.7 + ph);
				this.xs[i] = cx[i] - (ty / tl) * off;
				this.ys[i] = cy[i] + (tx / tl) * off;
			}
			ctx.strokeStyle = this.fade(ctx, '190,230,255', [[0, 0.3], [0.6, 0.09], [1, 0]]);
			ctx.beginPath();
			ctx.moveTo(this.xs[0], this.ys[0]);
			for (let i = 1; i < N; i++) ctx.lineTo(this.xs[i], this.ys[i]);
			ctx.stroke();
		}

		const r = 15 * px;
		ctx.globalAlpha = 0.5 * this.alpha;
		ctx.drawImage(comaSprite(), x - r, y - r, r * 2, r * 2);
		ctx.restore();
	}
}

/** How strongly a comet at distance d shows its tails, against `near`, the distance where it's at full strength. */
export function cometStrength(d, near) {
	return Math.min(1.6, Math.max(0.3, Math.pow(near / Math.max(1, d), 0.9)));
}
