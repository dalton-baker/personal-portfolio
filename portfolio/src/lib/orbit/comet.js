/**
 * A comet's tails, as particles it sheds (used on the map and for Slingshot's comets). The comet orbits
 * whatever sits at (0, 0), and both tails stream away from it:
 * - the ion tail: fast, thin streaks blown nearly straight away from the core, jittering as they go;
 * - the dust tail: slow, faint haze that lags behind along the comet's path, so it fans out and curves.
 * Now and then the comet flares and sheds a lot more for a moment. Everything is in the caller's units;
 * `unit` sets the scale (about how far an ion streak travels in a second), and `keep` is how much of the
 * comet's speed its dust holds on to (less spreads it wider behind a fast comet).
 */

let sprites = null;

/** A soft round glow for the coma, drawn scaled and faded. */
function puffs() {
	if (sprites) return sprites;
	const make = (rgb) => {
		const n = 64, c = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(n, n) : Object.assign(document.createElement('canvas'), { width: n, height: n });
		const g = c.getContext('2d');
		if (!g) return c;
		const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
		gr.addColorStop(0, 'rgba(' + rgb + ',1)');
		gr.addColorStop(0.35, 'rgba(' + rgb + ',0.45)');
		gr.addColorStop(1, 'rgba(' + rgb + ',0)');
		g.fillStyle = gr;
		g.fillRect(0, 0, n, n);
		return c;
	};
	sprites = { coma: make('214,240,255') };
	return sprites;
}

/** A random number from -1 to 1, more often near 0. */
const jitter = () => Math.random() + Math.random() - 1;

export class CometTail {
	/**
	 * @param {number} unit
	 * @param {number} [keep]
	 */
	constructor(unit, keep = 0.6) {
		this.unit = unit;
		this.keep = keep;
		this.ion = [];
		this.dust = [];
		this.ionDue = 0;
		this.dustDue = 0;
		this.flare = 0;
	}

	/**
	 * Advances dt seconds: sheds particles from the nucleus at (x, y), moving at (vx, vy) per second (unless
	 * `emit` is false), and moves the ones already out. `strength` (about 0.3 far out to 1.5 up close)
	 * scales how much it sheds and how fast.
	 */
	update(dt, x, y, vx, vy, strength, emit = true) {
		const u = this.unit, s = strength, d = Math.hypot(x, y) || 1, ax = x / d, ay = y / d;
		if (emit) {
			if (Math.random() < dt * 0.35) this.flare = 1;
			this.flare = Math.max(0, this.flare - dt * 1.2);
			const boost = 1 + this.flare * 2.5;
			this.ionDue += dt * 170 * s * boost;
			for (; this.ionDue >= 1; this.ionDue--) {
				// Blown out within a few degrees of straight away from the core, carrying a little of the comet's
				// motion, so the tail leans slightly back along its path.
				const a = jitter() * 0.09, c = Math.cos(a), sn = Math.sin(a), dx = ax * c - ay * sn, dy = ax * sn + ay * c;
				const sp = u * (0.7 + Math.random() * 0.7) * (0.6 + 0.45 * s);
				const life = 0.7 + Math.random() * 0.8;
				this.ion.push({ x, y, vx: vx * 0.32 + dx * sp, vy: vy * 0.32 + dy * sp, life, max: life, w: 0.6 + Math.random() * 1.2 });
			}
			this.dustDue += dt * 120 * s * boost;
			for (; this.dustDue >= 1; this.dustDue--) {
				// Pushed gently away from the core in a wide fan and left behind by the comet.
				const a = jitter() * 0.7, c = Math.cos(a), sn = Math.sin(a), dx = ax * c - ay * sn, dy = ax * sn + ay * c;
				const sp = u * (0.06 + Math.random() * 0.2) * (0.7 + 0.3 * s), keep = this.keep + (Math.random() - 0.5) * 0.3 * (1 - this.keep) * 2;
				const life = 1.3 + Math.random() * 1.6;
				this.dust.push({ x, y, vx: vx * keep + dx * sp, vy: vy * keep + dy * sp, life, max: life, k: 0.7 + Math.random() * 0.8 });
			}
		}
		// Pushed further away from the core as they go (harder for the ion tail), with a random sideways
		// shove now and then so the streaks kink and wisp.
		const step = (list, push, kick) => {
			for (let i = list.length - 1; i >= 0; i--) {
				const p = list[i];
				p.life -= dt;
				if (p.life <= 0) {
					list[i] = list[list.length - 1];
					list.pop();
					continue;
				}
				// (The shove scales with the square root of dt, so it's as wild at any frame rate.)
				const pd = Math.hypot(p.x, p.y) || 1, px = p.x / pd, py = p.y / pd, side = jitter() * kick * u * Math.sqrt(dt);
				p.vx += px * push * u * dt - py * side;
				p.vy += py * push * u * dt + px * side;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
			}
		};
		step(this.ion, 1, 0.8);
		step(this.dust, 0.12, 0.3);
	}

	/** Draws the tails and the glow around the nucleus at (x, y); `px` is one screen pixel in these units. */
	draw(ctx, x, y, px) {
		const S = puffs();
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		ctx.lineCap = 'round';
		// Dust: soft, wide smears along its drift, widening as it disperses. (Streaks are capped in length, so
		// a fast comet's don't turn into long lines.)
		const cap = this.unit * 0.3;
		ctx.strokeStyle = 'rgb(255,240,222)';
		for (const p of this.dust) {
			const f = p.life / p.max, v = Math.hypot(p.vx, p.vy), k = v > 0 ? Math.min(0.12, cap / v) : 0;
			ctx.globalAlpha = 0.12 * f;
			ctx.lineWidth = (1.5 + 3.5 * (1 - f)) * p.k * px;
			ctx.beginPath();
			ctx.moveTo(p.x, p.y);
			ctx.lineTo(p.x - p.vx * k, p.y - p.vy * k);
			ctx.stroke();
		}
		// Ions: thin streaks along their flight, fading in just off the nucleus and out as they go.
		ctx.strokeStyle = 'rgb(170,225,255)';
		for (const p of this.ion) {
			const f = p.life / p.max;
			ctx.globalAlpha = 0.36 * f * Math.min(1, (p.max - p.life) * 8);
			ctx.lineWidth = p.w * px;
			ctx.beginPath();
			ctx.moveTo(p.x, p.y);
			const v = Math.hypot(p.vx, p.vy), k = v > 0 ? Math.min(0.06, cap / v) : 0;
			ctx.lineTo(p.x - p.vx * k, p.y - p.vy * k);
			ctx.stroke();
		}
		const r = (16 + 10 * this.flare) * px;
		ctx.globalAlpha = 0.5;
		ctx.drawImage(S.coma, x - r, y - r, r * 2, r * 2);
		ctx.restore();
	}
}

/** How hard a comet at distance d sheds, against `near`, the distance where it's at full strength. */
export function cometStrength(d, near) {
	return Math.min(1.6, Math.max(0.3, Math.pow(near / Math.max(1, d), 0.9)));
}
