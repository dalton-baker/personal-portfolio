/**
 * Slingshot's physics and rules, with no drawing. Units are game units around the core at (0, 0);
 * Slingshot.svelte scales them to the screen.
 *
 * Bodies are thrown by dragging back from a point and letting go. Gravity pulls them toward the core (and,
 * a little, toward each other). Each level is a lane, a ring between two radii: keep a body inside it for
 * REVS full turns to lock it in place and open the next lane. After the last lane comes a sandbox.
 */

/** Full turns a body has to make inside the lane. */
export const REVS = 3;

export const LEVELS = [
	{ name: 'First capture', inner: 170, outer: 290, note: 'Wide lane. Any roundish orbit counts.' },
	{ name: 'Tighten up', inner: 215, outer: 260, note: 'Narrower lane. Throw closer to sideways.' },
	{ name: 'Outer lane', inner: 340, outer: 390, note: 'Way out. Slower orbit, more patience.' },
	{ name: 'The needle', inner: 280, outer: 302, note: 'Twenty-two units of wiggle room. Trust the predictor.' },
	{ name: 'Traffic', inner: 160, outer: 195, note: 'Low and fast, with your old orbiters tugging at it.' }
];

/** What sits in the middle: its pull (gm), how close a body can get before it's gone (r), and its epitaph. */
export const CORES = {
	hole: { id: 'hole', label: 'Black hole', gm: 4.0e7, r: 30, eat: 'Consumed by the black hole. Spaghettified.' },
	star: { id: 'star', label: 'Star', gm: 3.0e7, r: 40, eat: 'Vaporized. Stars are hot, turns out.' },
	giant: { id: 'giant', label: 'Ringed giant', gm: 2.0e7, r: 46, eat: 'Swallowed by the giant. No refunds.' },
	binary: { id: 'binary', label: 'Binary pair', gm: 3.4e7, r: 18, sep: 96, omega: 2.1, eat: 'Fell into the binary pair. Chaotic, as advertised.' },
	// Nothing in the middle: the bodies only pull on each other, so there are no lanes to hold (it's a sandbox).
	empty: { id: 'empty', label: 'Empty space', gm: 0, r: 0, eat: '' }
};

/**
 * What gets thrown. Colours are [base, night side] pairs from the bodies on the map: the inner planets and
 * a few of Live Sites' moons, the moons, and the belt rocks.
 */
export const PAYLOADS = {
	planet: {
		id: 'planet', label: 'Planet', r: 11, m: 1,
		palette: [['#6fa8ff', '#2a4a9c'], ['#ff5a1f', '#9c2706'], ['#ffc93c', '#a8700c'], ['#b18cff', '#4a2f8a'], ['#3ddbc4', '#0e6b5f'], ['#8fd67c', '#30692a']]
	},
	moon: { id: 'moon', label: 'Moon', r: 6.5, m: 0.2, palette: [['#cfcac2', '#55514b'], ['#e9e4ff', '#6b5e99'], ['#d5dae6', '#535b6e']] },
	asteroid: { id: 'asteroid', label: 'Asteroid', r: 4.5, m: 0.05, palette: [['#b9b2a8', '#56504a'], ['#c9c1d6', '#5a5268'], ['#a9b8ad', '#4b5a4f']] },
	comet: { id: 'comet', label: 'Comet', r: 4, m: 0.05, palette: [['#f4fbff', '#9fb8c8']] }
};

/** A body is eaten once its centre is within the core's radius plus this much of its own. */
const EAT = 0.4;
const LOST = 1800;
const MAX_BODIES = 40;
const STEP = 1 / 240;

export class Sim {
	constructor() {
		this.core = 'hole';
		this.payload = 'planet';
		this.level = 0;
		this.sandbox = false;
		/** The current lane has a locked body; `finished` when that was the last lane. */
		this.complete = false;
		this.finished = false;
		this.toast = 'Press anywhere, pull back, let go. Land something in the green lane.';
		/** Best progress in the current lane (turns), and bodies bound to the core (sandbox). */
		this.revs = 0;
		this.bound = 0;
		this.bodies = [];
		this.particles = [];
		this.simT = 0;
		this.acc = 0;
		this.uid = 1;
		this.hudT = 0;
		/** Size of the next body thrown (bodies vary a little), chosen ahead so the aiming guide can use it. */
		this.nextSize = 0.85 + Math.random() * 0.3;
	}

	/** Radius of the next body to be thrown. */
	nextRadius() {
		return PAYLOADS[this.payload].r * this.nextSize;
	}

	say(msg) {
		this.toast = msg;
	}

	/** Where the core's mass is at time t: one point, two for the binary pair, or none in empty space. */
	sources(t) {
		const c = CORES[this.core];
		if (c.id === 'empty') return [];
		if (c.id === 'binary') {
			const a = c.sep / 2, ang = t * c.omega, cs = Math.cos(ang) * a, sn = Math.sin(ang) * a;
			return [{ x: cs, y: sn, gm: c.gm / 2, r: c.r }, { x: -cs, y: -sn, gm: c.gm / 2, r: c.r * 0.85 }];
		}
		return [{ x: 0, y: 0, gm: c.gm, r: c.r }];
	}

	/** Gravity at (x, y): from the core, and from the other bodies when `self` is one of them. */
	accel(x, y, srcs, self) {
		let ax = 0, ay = 0;
		for (const s of srcs) {
			const dx = s.x - x, dy = s.y - y, d2 = dx * dx + dy * dy + 25, inv = s.gm / (d2 * Math.sqrt(d2));
			ax += dx * inv;
			ay += dy * inv;
		}
		if (self) {
			for (const o of this.bodies) {
				if (o === self) continue;
				const dx = o.x - x, dy = o.y - y, d2 = dx * dx + dy * dy + 100, inv = (o.m * 4e5) / (d2 * Math.sqrt(d2));
				ax += dx * inv;
				ay += dy * inv;
			}
		}
		return [ax, ay];
	}

	/** One velocity Verlet step. */
	step(h) {
		const B = this.bodies;
		for (const b of B) {
			if (b.held) continue;
			b.vx += b.ax * h * 0.5;
			b.vy += b.ay * h * 0.5;
			b.x += b.vx * h;
			b.y += b.vy * h;
		}
		this.simT += h;
		const srcs = this.sources(this.simT);
		for (const b of B) {
			if (b.held) continue;
			const a = this.accel(b.x, b.y, srcs, b);
			b.ax = a[0];
			b.ay = a[1];
			b.vx += b.ax * h * 0.5;
			b.vy += b.ay * h * 0.5;
			b.rot += b.spin * h;
		}
		this.collide(srcs);
		this.track();
	}

	/** Bodies that hit the core are eaten, ones that wander off are lost, and two that touch merge. */
	collide(srcs) {
		const B = this.bodies, core = CORES[this.core];
		for (let i = B.length - 1; i >= 0; i--) {
			const b = B[i];
			if (b.held) continue;
			let gone = false;
			for (const s of srcs) {
				if (Math.hypot(b.x - s.x, b.y - s.y) < s.r + b.r * EAT) {
					this.burst(b.x, b.y, b.color, 16, 90);
					B.splice(i, 1);
					this.say(core.eat);
					gone = true;
					break;
				}
			}
			if (!gone && b.x * b.x + b.y * b.y > LOST * LOST) {
				B.splice(i, 1);
				this.say('Lost to deep space. Bye.');
			}
		}
		for (let i = 0; i < B.length; i++) {
			for (let j = i + 1; j < B.length; j++) {
				const a = B[i], b = B[j];
				if (a.held || b.held) continue;
				if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) {
					const big = a.m >= b.m ? a : b, small = big === a ? b : a, M = a.m + b.m;
					big.vx = (a.m * a.vx + b.m * b.vx) / M;
					big.vy = (a.m * a.vy + b.m * b.vy) / M;
					big.x = (a.m * a.x + b.m * b.x) / M;
					big.y = (a.m * a.y + b.m * b.y) / M;
					big.r = Math.cbrt(a.r * a.r * a.r + b.r * b.r * b.r);
					big.m = M;
					big.locked = false;
					big.sweep = 0;
					big.lastAng = Math.atan2(big.y, big.x);
					this.burst(small.x, small.y, small.color, 12, 70);
					B.splice(B.indexOf(small), 1);
					this.say('Collision. Two bodies, one problem.');
					return;
				}
			}
		}
	}

	/** Counts each body's turns while it stays inside the lane, and locks the first to make REVS. */
	track() {
		const lv = this.sandbox || this.complete ? null : LEVELS[this.level];
		for (const b of this.bodies) {
			if (b.held) continue;
			const ang = Math.atan2(b.y, b.x);
			let d = ang - b.lastAng;
			if (d > Math.PI) d -= Math.PI * 2;
			else if (d < -Math.PI) d += Math.PI * 2;
			b.lastAng = ang;
			if (b.locked) continue;
			const r = Math.hypot(b.x, b.y);
			if (lv && r >= lv.inner && r <= lv.outer) {
				b.sweep += d;
				b.inBand = true;
			} else {
				b.sweep = 0;
				b.inBand = false;
			}
			b.revs = Math.abs(b.sweep) / (Math.PI * 2);
			if (lv && b.revs >= REVS) {
				b.locked = true;
				this.lock(b);
				return;
			}
		}
	}

	lock(b) {
		this.finished = this.level >= LEVELS.length - 1;
		for (let i = 0; i < 24; i++) {
			const a = (i / 24) * Math.PI * 2;
			this.particles.push({ x: b.x, y: b.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.8, max: 0.8, color: '#c8ff2e', size: 3 });
		}
		this.complete = true;
		this.revs = REVS;
		this.say('Stable orbit confirmed. ' + REVS + ' clean revolutions.');
	}

	burst(x, y, color, n, sp) {
		for (let i = 0; i < n; i++) {
			const a = Math.random() * Math.PI * 2, v = sp * (0.3 + Math.random());
			this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + Math.random() * 0.6, max: 1.2, color, size: 2 + Math.random() * 2.5 });
		}
	}

	/** A new body of the current payload kind, launched from (x, y). */
	spawn(x, y, vx, vy) {
		const p = PAYLOADS[this.payload];
		// The same colour the aiming ghost showed (draw.js picks the next one along).
		const [color, dark] = p.palette[(this.uid + 1) % p.palette.length];
		const b = {
			id: this.uid++, kind: p.id, x, y, vx, vy, r: this.nextRadius(), m: p.m, color, dark,
			// Some planets are banded gas worlds (pink, like The Log) or carry rings (like Live Sites).
			striped: p.id === 'planet' && Math.random() < 0.35,
			ringed: p.id === 'planet' && Math.random() < 0.15,
			trail: [], sweep: 0, revs: 0, inBand: false, lastAng: Math.atan2(y, x), locked: false,
			rot: Math.random() * 6, spin: (Math.random() - 0.5) * 2, verts: []
		};
		for (let i = 0; i < 8; i++) b.verts.push(0.7 + Math.random() * 0.45);
		this.nextSize = 0.85 + Math.random() * 0.3;
		const a = this.accel(x, y, this.sources(this.simT), b);
		b.ax = a[0];
		b.ay = a[1];
		this.bodies.push(b);
		if (this.bodies.length > MAX_BODIES) {
			const i = this.bodies.findIndex((o) => !o.locked);
			if (i >= 0) this.bodies.splice(i, 1);
		}
	}

	/** Advances the simulation by dt seconds of real time. */
	advance(dt) {
		this.acc += dt;
		let n = 0;
		while (this.acc >= STEP && n < 24) {
			this.step(STEP);
			this.acc -= STEP;
			n++;
		}
		if (n >= 24) this.acc = 0;
		for (const b of this.bodies) {
			if (b.held) continue;
			b.trail.push(b.x, b.y);
			if (b.trail.length > 440) b.trail.splice(0, 2);
		}
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.life -= dt;
			if (p.life <= 0) {
				this.particles.splice(i, 1);
				continue;
			}
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.vx *= 0.96;
			p.vy *= 0.96;
		}
		this.hud(dt);
	}

	/** Lane progress and the sandbox's bound count, ten times a second. */
	hud(dt) {
		this.hudT += dt;
		if (this.hudT < 0.1) return;
		this.hudT = 0;
		if (this.sandbox) {
			const srcs = this.sources(this.simT);
			let bound = 0;
			for (const b of this.bodies) {
				let pot = 0;
				for (const s of srcs) pot -= s.gm / Math.max(1, Math.hypot(b.x - s.x, b.y - s.y));
				if (0.5 * (b.vx * b.vx + b.vy * b.vy) + pot < 0) bound++;
			}
			this.bound = bound;
			return;
		}
		if (this.complete) return;
		let best = 0;
		for (const b of this.bodies) if (!b.locked && b.inBand && b.revs > best) best = b.revs;
		this.revs = Math.floor(best * 10) / 10;
	}

	/** The body near (x, y) to pick up (`reach` is the extra slack, in game units), if any. */
	bodyAt(x, y, reach) {
		let best = null, bd = 1e9;
		for (const b of this.bodies) {
			const d = Math.hypot(b.x - x, b.y - y);
			if (d < b.r + reach && d < bd) {
				best = b;
				bd = d;
			}
		}
		return best;
	}

	/** Whether (x, y) is on the core, where a throw can't start. */
	onCore(x, y) {
		return this.sources(this.simT).some((s) => Math.hypot(x - s.x, y - s.y) < s.r + 16);
	}

	/** Launch velocity for a drag from (ox, oy) back to (x, y): the opposite way, capped. */
	launchVel(d) {
		let dx = d.ox - d.x, dy = d.oy - d.y;
		const L = Math.hypot(dx, dy), max = 360;
		if (L > max) {
			dx *= max / L;
			dy *= max / L;
		}
		return [dx * 2.4, dy * 2.4];
	}

	/** Picks up a body to re-throw it: it holds still until it's let go. */
	hold(b) {
		b.held = true;
		b.vx = b.vy = 0;
		b.locked = false;
		b.sweep = 0;
		b.revs = 0;
	}

	/** Lets go of a drag: re-throws the held body, or launches a new one. */
	release(d) {
		const v = this.launchVel(d);
		if (d.body) {
			const b = d.body;
			b.held = false;
			b.vx = v[0];
			b.vy = v[1];
			b.lastAng = Math.atan2(b.y, b.x);
			b.sweep = 0;
			b.trail = [];
			const a = this.accel(b.x, b.y, this.sources(this.simT), b);
			b.ax = a[0];
			b.ay = a[1];
		} else {
			this.spawn(d.ox, d.oy, v[0], v[1]);
		}
	}

	/**
	 * Where a throw would go over the next few seconds, and whether the core eats it. It steps exactly like
	 * the simulation, so a throw that skims the core is judged the same way; `r` is the radius of what's
	 * thrown, since a body is eaten a little before its centre reaches the core (see collide). It ignores the
	 * other bodies, except in empty space, where they're all there is to pull on it (then it counts them
	 * where they are now); `self` is the body being re-thrown, if it is one, so it doesn't pull on itself.
	 */
	predict(ox, oy, vx, vy, r = 0, self = null, steps = 640) {
		let x = ox, y = oy, t = this.simT;
		const h = STEP, pts = [];
		const others = this.core === 'empty' ? self || {} : null;
		let srcs = this.sources(t), a = this.accel(x, y, srcs, others), hit = false;
		for (let i = 0; i < steps; i++) {
			vx += a[0] * h * 0.5;
			vy += a[1] * h * 0.5;
			x += vx * h;
			y += vy * h;
			t += h;
			srcs = this.sources(t);
			a = this.accel(x, y, srcs, others);
			vx += a[0] * h * 0.5;
			vy += a[1] * h * 0.5;
			if (i % 8 === 0) pts.push(x, y);
			for (const s of srcs) if (Math.hypot(x - s.x, y - s.y) < s.r + r * EAT) hit = true;
			if (hit || x * x + y * y > 4e6) {
				pts.push(x, y);
				break;
			}
		}
		return { pts, hit };
	}

	setCore(id) {
		this.bodies = [];
		this.particles = [];
		this.simT = 0;
		this.core = id;
		this.complete = false;
		this.revs = 0;
		if (id === 'empty') {
			this.sandbox = true;
			this.say('Empty space. No core, just the bodies pulling on each other.');
		} else this.say('Core swapped to ' + CORES[id].label.toLowerCase() + '. System cleared.');
	}

	clear() {
		this.bodies = [];
		this.particles = [];
		this.complete = false;
		this.revs = 0;
		this.say('System cleared.');
	}

	/** After a lock: the next lane, or the sandbox once every lane is done. */
	next() {
		if (this.finished) {
			this.sandbox = true;
			this.complete = false;
			this.say('Sandbox. No rules, only Newton.');
		} else {
			this.level++;
			this.complete = false;
			this.revs = 0;
			this.say('New lane. Old orbiters stay and pull on things.');
		}
	}

	toggleSandbox() {
		// Empty space is sandbox only (there's nothing to hold a lane around), so back in the lanes the black
		// hole returns.
		if (this.sandbox && this.core === 'empty') {
			this.setCore('hole');
			this.sandbox = false;
			this.say('Back to the lanes, around a black hole again.');
			return;
		}
		this.sandbox = !this.sandbox;
		this.complete = false;
		this.say(this.sandbox ? 'Sandbox. No rules, only Newton.' : 'Back to the lanes.');
	}
}
