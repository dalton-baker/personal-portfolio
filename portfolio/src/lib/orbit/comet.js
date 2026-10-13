/**
 * A comet's tails (on the map, and for Slingshot's comets). The comet orbits whatever sits at (0, 0) and
 * both tails point away from it, as a real comet's do:
 * - the ion tail: a long, solid, tapering ribbon pointing straight away from the core, whose far end
 *   wiggles (a slow wave runs down it) and bends a little back along the comet's path;
 * - the dust tail: a fainter, warmer, wider ribbon that curves back along the path.
 * Both grow as the comet nears the core. Everything is in the caller's units; `unit` sets the scale.
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
	 * The centre line of a tail from the nucleus at (x, y): `len` long, heading along (ax, ay) and bending
	 * back by `bend` (a fraction of its length, reached at the end), with a wiggle of `amp` (also a fraction
	 * of its length) that grows toward the end and travels outward.
	 */
	line(x, y, ax, ay, len, bend, amp, waves, speed, phase) {
		const nx = -ay, ny = ax, bx = this.bx, by = this.by;
		for (let i = 0; i < N; i++) {
			const f = i / (N - 1), s = f * len;
			const w = amp * len * f * f * Math.sin(f * waves * Math.PI * 2 - this.t * speed + phase);
			const b = bend * len * f * f;
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
	 * The tails point away from (0, 0) unless a direction (ax, ay) is given.
	 */
	draw(ctx, x, y, px, ax, ay) {
		if (ax == null || (!ax && !ay)) {
			const d = Math.hypot(x, y) || 1;
			ax = x / d;
			ay = y / d;
		}
		const u = this.unit, s = Math.max(0.3, this.strength);
		const len = u * (0.75 + 0.85 * s), w0 = Math.max(u * 0.075, 5 * px);
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';

		// Dust: shorter, wider and fainter, curving back along the path, its end swaying slowly.
		this.line(x, y, ax, ay, len * 0.72, 0.42, 0.05, 0.8, 1.6, 1.3);
		ctx.fillStyle = this.fade(ctx, '255,236,214', [[0, 0.32], [0.45, 0.14], [1, 0]]);
		this.ribbon(ctx, (f) => w0 * (0.9 + 1.6 * f));

		// Ion: long and straight from the head, a slow wave rippling its end.
		this.line(x, y, ax, ay, len, 0.12, 0.07, 1.4, 2.6, 0);
		ctx.fillStyle = this.fade(ctx, '170,220,255', [[0, 0.55], [0.35, 0.26], [1, 0]]);
		this.ribbon(ctx, (f) => w0 * (1 - 0.8 * f));
		ctx.fillStyle = this.fade(ctx, '228,246,255', [[0, 0.85], [0.3, 0.3], [0.75, 0]]);
		this.ribbon(ctx, (f) => w0 * 0.38 * (1 - 0.85 * f));
		// A couple of fainter strands running along it, out of step, so it has some texture.
		ctx.lineWidth = Math.max(px, w0 * 0.08);
		for (const [off, ph] of [[0.28, 1.7], [-0.3, 3.9]]) {
			this.line(x - ay * w0 * off, y + ax * w0 * off, ax, ay, len * 0.9, 0.13, 0.078, 1.5, 2.4, ph);
			ctx.strokeStyle = this.fade(ctx, '190,230,255', [[0, 0.3], [0.6, 0.09], [1, 0]]);
			ctx.beginPath();
			ctx.moveTo(this.xs[0], this.ys[0]);
			for (let i = 1; i < N; i++) ctx.lineTo(this.xs[i], this.ys[i]);
			ctx.stroke();
		}

		const r = 15 * px;
		ctx.globalAlpha = 0.5;
		ctx.drawImage(comaSprite(), x - r, y - r, r * 2, r * 2);
		ctx.restore();
	}
}

/** How strongly a comet at distance d shows its tails, against `near`, the distance where it's at full strength. */
export function cometStrength(d, near) {
	return Math.min(1.6, Math.max(0.3, Math.pow(near / Math.max(1, d), 0.9)));
}
