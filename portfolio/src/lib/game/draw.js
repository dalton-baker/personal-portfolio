import { LEVELS, PAYLOADS, REVS } from './sim.js';
import { CometTail, cometStrength } from '$lib/orbit/comet.js';

/**
 * Slingshot's 2D layer, in the map's style: lanes, the cores other than the black hole (WebGL draws that
 * one), trails, bodies, the aiming line and its predicted path, and bursts. Drawing happens in game units
 * (the view's scale `s` and centre `cx`, `cy`), so `px` is one CSS pixel in game units.
 */

const TAU = Math.PI * 2;
const LIME = '#c8ff2e';
const lime = (a) => 'rgba(200,255,46,' + a + ')';

/** A few craters and a highlight, as on the map's rocky planets: [x, y, radius] as fractions of the width. */
const CRATERS = [
	[0.3, 0.34, 0.12, 'rgba(0,0,0,.24)'],
	[0.6, 0.64, 0.095, 'rgba(0,0,0,.2)'],
	[0.36, 0.76, 0.066, 'rgba(0,0,0,.17)'],
	[0.7, 0.3, 0.057, 'rgba(0,0,0,.15)'],
	[0.22, 0.56, 0.047, 'rgba(255,255,255,.16)']
];
/** The Log's pink bands: [colour, width] out of a 16-wide repeat, turned 24 degrees. */
const LOG_BANDS = [['#ff2e88', 5], ['#ff8ac1', 3], ['#c2187a', 5], ['#ff5aa5', 3]];
/** Live Sites' tan bands (out of 13, turned 176 degrees) and its rings: [inner, outer, opacity] in radii. */
const GIANT_BANDS = [['#f2deaa', 4], ['#dcbb7c', 3], ['#ead09a', 4], ['#c9a161', 2]];
const GIANT_RINGS = [[1.45, 1.75, 0.2], [1.75, 2.3, 0.52], [2.45, 2.67, 0.38], [2.77, 2.95, 0.34]];
/** The accretion disk's colours, from the outside in, for the star. */
const STAR_BANDS = [[1.5, '#3b0d5e', 0], [1.32, '#c2187a', 1.3], [1.16, '#ff5a1f', 2.1], [1.0, '#ffc93c', 3.4], [0.7, '#fff4d6', 4.6]];

/** Repeating bands across a disc of radius r at (x, y), already clipped to it. */
function bands(c, x, y, r, list, total, period, angle) {
	c.save();
	c.translate(x, y);
	c.rotate(angle);
	let pos = -r * 1.5;
	const unit = period / total;
	while (pos < r * 1.5) {
		for (const [col, w] of list) {
			c.fillStyle = col;
			c.fillRect(pos, -r * 1.5, w * unit + 0.5 * unit, r * 3);
			pos += w * unit;
		}
	}
	c.restore();
}

/** Ring bands as filled annuli around (x, y), radius r. */
function rings(c, x, y, r, list, colour = '232,206,150', alpha = 1) {
	for (const [r0, r1, a] of list) {
		c.beginPath();
		c.arc(x, y, r1 * r, 0, TAU);
		c.arc(x, y, r0 * r, 0, TAU, true);
		c.fillStyle = 'rgba(' + colour + ',' + a * alpha + ')';
		c.fill();
	}
}

/** The night side: a hard-edged half in `dark`, facing direction `away`, already clipped to the body. */
function nightSide(c, x, y, r, away, dark) {
	c.save();
	c.translate(x, y);
	c.rotate(away);
	c.fillStyle = dark;
	c.fillRect(-0.06 * r, -r * 1.4, r * 1.5, r * 2.8);
	c.restore();
}

function blob(c, x, y, r, verts, rot) {
	c.beginPath();
	for (let i = 0; i < verts.length; i++) {
		const a = rot + (i / verts.length) * TAU, rr = r * verts[i];
		if (i === 0) c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
		else c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
	}
	c.closePath();
}

/** A thrown body, like the map's planets, moons and belt rocks, with its night side away from the core. */
export function drawBody(c, b, px) {
	const x = b.x, y = b.y, r = Math.max(b.r, 3.5 * px), away = Math.atan2(y, x);
	if (b.kind === 'comet') {
		// Just the nucleus and a faint coma; its tails are drawn by drawScene.
		c.fillStyle = 'rgba(191,233,255,0.3)';
		c.beginPath();
		c.arc(x, y, r * 2.2, 0, TAU);
		c.fill();
		c.fillStyle = b.color;
		c.beginPath();
		c.arc(x, y, r, 0, TAU);
		c.fill();
		return;
	}
	if (b.ringed) rings(c, x, y, r, GIANT_RINGS, '232,206,150', 0.9);
	c.save();
	if (b.kind === 'asteroid') blob(c, x, y, r, b.verts, b.rot);
	else {
		c.beginPath();
		c.arc(x, y, r, 0, TAU);
	}
	c.clip();
	c.fillStyle = b.striped ? '#ff2e88' : b.color;
	c.fillRect(x - r * 1.3, y - r * 1.3, r * 2.6, r * 2.6);
	if (b.striped) bands(c, x, y, r, LOG_BANDS, 16, r * 0.95, (24 * Math.PI) / 180);
	else if (b.kind !== 'asteroid') {
		for (const [fx, fy, fr, col] of CRATERS) {
			c.fillStyle = col;
			c.beginPath();
			c.arc(x - r + fx * 2 * r, y - r + fy * 2 * r, fr * 2 * r, 0, TAU);
			c.fill();
		}
	}
	nightSide(c, x, y, r, away, b.striped ? 'rgba(40,6,40,.72)' : b.dark);
	c.restore();
}

let corona = null;

/** The star's corona: halftone dots fading out from its edge, built once as a path around (0, 0). */
function starCorona(R) {
	if (corona && corona.R === R) return corona.path;
	const path = new Path2D(), G = R * 2.3, st = 7;
	for (let gx = -G; gx <= G; gx += st) {
		for (let gy = -G; gy <= G; gy += st) {
			const d = Math.hypot(gx, gy);
			if (d > G || d < R * 1.2) continue;
			const z = st * 0.36 * Math.sqrt(1 - (d - R * 1.2) / (G - R * 1.2));
			path.moveTo(gx + z, gy);
			path.arc(gx, gy, z, 0, TAU);
		}
	}
	corona = { R, path };
	return path;
}

/** The star: the accretion disk's colours as wobbling bands, in a corona of halftone dots. */
function drawStar(c, t, x, y, R) {
	c.fillStyle = '#7a1f5c';
	c.save();
	c.translate(x, y);
	c.fill(starCorona(R));
	c.restore();
	for (const [k, col, ph] of STAR_BANDS) {
		c.beginPath();
		for (let i = 0; i <= 72; i++) {
			const th = (i / 72) * TAU;
			const rr = R * k * (1 + 0.05 * Math.sin(3 * th - t * 1.4 + ph) + 0.03 * Math.sin(7 * th + t * 2.1 + ph * 2));
			if (i === 0) c.moveTo(x + Math.cos(th) * rr, y + Math.sin(th) * rr);
			else c.lineTo(x + Math.cos(th) * rr, y + Math.sin(th) * rr);
		}
		c.closePath();
		c.fillStyle = col;
		c.fill();
	}
}

/** The ringed giant, like Live Sites: tan bands, rings, and a night side. */
function drawGiant(c, R) {
	rings(c, 0, 0, R, GIANT_RINGS);
	c.strokeStyle = 'rgba(40,24,6,0.35)';
	c.lineWidth = 0.75;
	for (const [r0, r1, a] of GIANT_RINGS) {
		if (a < 0.3) continue;
		for (const f of [0.35, 0.7]) {
			c.beginPath();
			c.arc(0, 0, (r0 + (r1 - r0) * f) * R, 0, TAU);
			c.stroke();
		}
	}
	c.save();
	c.beginPath();
	c.arc(0, 0, R, 0, TAU);
	c.clip();
	bands(c, 0, 0, R, GIANT_BANDS, 13, R * 1.44, (176 * Math.PI) / 180);
	nightSide(c, 0, 0, R, 0.6, 'rgba(60,38,8,.7)');
	c.restore();
}

/** Pluto or Charon, as on the map (State Your Name and its screensaver moon). */
function drawDwarf(c, x, y, R, charon) {
	c.save();
	c.beginPath();
	c.arc(x, y, R, 0, TAU);
	c.clip();
	c.fillStyle = charon ? '#bcb8b3' : '#e2cfb2';
	c.fillRect(x - R, y - R, R * 2, R * 2);
	const ell = (fx, fy, w, h, col) => {
		c.fillStyle = col;
		c.beginPath();
		c.ellipse(x - R + fx * 2 * R, y - R + fy * 2 * R, w * R, h * R, 0, 0, TAU);
		c.fill();
	};
	if (charon) ell(0.5, 0.06, 0.92, 0.52, 'rgba(122,52,40,.6)');
	else {
		ell(0.52, 0.5, 0.42, 0.36, 'rgba(255,252,245,.85)');
		ell(0.68, 0.58, 0.36, 0.32, 'rgba(255,252,245,.8)');
		ell(0.3, 0.72, 0.72, 0.36, 'rgba(112,56,38,.5)');
	}
	nightSide(c, x, y, R, Math.atan2(y, x), charon ? '#3c3a38' : '#4a3e34');
	c.restore();
}

/** The black hole without WebGL: the map's fallback rings. */
function drawFlatHole(c, R) {
	for (const [k, col] of [[2.0, '#3b0d5e'], [1.7, '#c2187a'], [1.43, '#ff5a1f'], [1.12, '#fff4d6']]) {
		c.fillStyle = col;
		c.beginPath();
		c.arc(0, 0, R * k, 0, TAU);
		c.fill();
	}
	c.fillStyle = '#000';
	c.beginPath();
	c.arc(0, 0, R, 0, TAU);
	c.fill();
}

function drawCore(c, sim, t, px, gl) {
	const id = sim.core;
	if (id === 'empty') {
		// Just a faint crosshair marking the middle.
		const k = 7 * px;
		c.strokeStyle = 'rgba(241,238,247,0.25)';
		c.lineWidth = px;
		c.beginPath();
		c.moveTo(-k, 0);
		c.lineTo(k, 0);
		c.moveTo(0, -k);
		c.lineTo(0, k);
		c.stroke();
	} else if (id === 'hole') {
		if (!gl) drawFlatHole(c, 30);
	} else if (id === 'star') drawStar(c, t, 0, 0, 40);
	else if (id === 'giant') drawGiant(c, 46);
	else {
		const [a, b] = sim.sources(sim.simT);
		c.setLineDash([2 * px, 5 * px]);
		c.strokeStyle = 'rgba(214,226,240,0.3)';
		c.lineWidth = px;
		c.beginPath();
		c.arc(0, 0, 48, 0, TAU);
		c.stroke();
		c.setLineDash([]);
		drawDwarf(c, a.x, a.y, a.r, false);
		drawDwarf(c, b.x, b.y, b.r, true);
	}
}

/** The map's selection frame: lime corner brackets around (x, y), half-size h. */
function frame(c, x, y, h, px) {
	const arm = 5 * px;
	c.strokeStyle = LIME;
	c.lineWidth = 1.5 * px;
	c.beginPath();
	for (let q = 0; q < 4; q++) {
		const sx = q % 2 ? 1 : -1, sy = q < 2 ? -1 : 1;
		c.moveTo(x + sx * h, y + sy * (h - arm));
		c.lineTo(x + sx * h, y + sy * h);
		c.lineTo(x + sx * (h - arm), y + sy * h);
	}
	c.stroke();
}

/** Each thrown comet's tails, kept with the body. */
const tails = new WeakMap();

/**
 * Draws a frame. `view` is { W, H, dpr, s, cx, cy, compact }; `drag` the throw being aimed, if any;
 * `t` the time (s) for the cores' motion and `dt` the time since the last frame; `gl` whether WebGL is
 * drawing the black hole.
 */
export function drawScene(c, sim, view, drag, t, dt, gl) {
	const { W, H, dpr, s, cx, cy } = view, px = 1 / s;
	c.setTransform(dpr, 0, 0, dpr, 0, 0);
	c.clearRect(0, 0, W, H);
	c.setTransform(dpr * s, 0, 0, dpr * s, dpr * cx, dpr * cy);

	// Lanes: past ones as faint dashed circles, the current one as a lime band.
	const cur = sim.level;
	if (!sim.sandbox) {
		c.setLineDash([2 * px, 6 * px]);
		c.lineWidth = px;
		c.strokeStyle = lime(0.22);
		for (let i = 0; i < cur; i++) {
			c.beginPath();
			c.arc(0, 0, (LEVELS[i].inner + LEVELS[i].outer) / 2, 0, TAU);
			c.stroke();
		}
		c.setLineDash([]);
		const lv = LEVELS[cur];
		c.beginPath();
		c.arc(0, 0, lv.outer, 0, TAU);
		c.arc(0, 0, lv.inner, 0, TAU, true);
		c.fillStyle = lime(sim.complete ? 0.12 : 0.06);
		c.fill();
		c.setLineDash(sim.complete ? [] : [6 * px, 5 * px]);
		c.lineWidth = 1.2 * px;
		c.strokeStyle = lime(0.6);
		c.beginPath();
		c.arc(0, 0, lv.outer, 0, TAU);
		c.stroke();
		c.beginPath();
		c.arc(0, 0, lv.inner, 0, TAU);
		c.stroke();
		c.setLineDash([]);
	} else {
		c.setLineDash([2 * px, 7 * px]);
		c.lineWidth = px;
		c.strokeStyle = 'rgba(241,238,247,0.14)';
		for (const r of [150, 250, 350, 450]) {
			c.beginPath();
			c.arc(0, 0, r, 0, TAU);
			c.stroke();
		}
		c.setLineDash([]);
	}

	drawCore(c, sim, t, px, gl);

	// Trails, fading toward their tails.
	c.lineCap = 'round';
	for (const b of sim.bodies) {
		const tr = b.trail, n = tr.length / 2;
		if (n < 2) continue;
		c.lineWidth = Math.min(Math.max(px, b.r * 0.3), 2 * px);
		c.strokeStyle = b.striped ? '#ff5aa5' : b.color;
		const seg = 20;
		for (let k = 0; k < n - 1; k += seg) {
			c.globalAlpha = 0.45 * ((k + seg) / n);
			c.beginPath();
			c.moveTo(tr[k * 2], tr[k * 2 + 1]);
			for (let j = k + 1; j <= Math.min(n - 1, k + seg); j++) c.lineTo(tr[j * 2], tr[j * 2 + 1]);
			c.stroke();
		}
		c.globalAlpha = 1;
	}

	// Comets' tails, pointing away from the core (or, in empty space, back along their path).
	for (const b of sim.bodies) {
		if (b.kind !== 'comet') continue;
		let tail = tails.get(b);
		if (!tail) tails.set(b, (tail = new CometTail(80)));
		const empty = sim.core === 'empty';
		tail.update(dt, b.x, b.y, b.vx, b.vy, empty ? 0.6 : cometStrength(Math.hypot(b.x, b.y), 140));
		tail.draw(c, b.x, b.y, px, empty ? tail.bx : undefined, empty ? tail.by : undefined);
	}

	// Bodies, with the selection frame on locked ones and a progress arc while one's in the lane.
	for (const b of sim.bodies) {
		drawBody(c, b, px);
		const rr = Math.max(b.r, 3.5 * px) + 6 * px;
		if (b.locked) frame(c, b.x, b.y, rr, px);
		else if (b.inBand && b.revs > 0.02) {
			c.lineWidth = 2 * px;
			c.strokeStyle = 'rgba(241,238,247,0.15)';
			c.beginPath();
			c.arc(b.x, b.y, rr, 0, TAU);
			c.stroke();
			c.strokeStyle = LIME;
			c.beginPath();
			c.arc(b.x, b.y, rr, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, b.revs / REVS));
			c.stroke();
		}
	}

	// Aiming: the predicted path (a pink cross if it ends in the core), the pull-back line, and a ghost of
	// what's about to be thrown.
	if (drag) {
		const r = drag.body ? drag.body.r : sim.nextRadius();
		const v = sim.launchVel(drag), pr = sim.predict(drag.ox, drag.oy, v[0], v[1], r), pts = pr.pts, n = pts.length / 2;
		for (let i = 0; i < n; i++) {
			c.fillStyle = lime(0.9 * (1 - i / n) + 0.08);
			c.beginPath();
			c.arc(pts[i * 2], pts[i * 2 + 1], 1.6 * px, 0, TAU);
			c.fill();
		}
		if (pr.hit && n) {
			const ex = pts[(n - 1) * 2], ey = pts[(n - 1) * 2 + 1], k = 6 * px;
			c.strokeStyle = '#ff2e88';
			c.lineWidth = 2 * px;
			c.beginPath();
			c.moveTo(ex - k, ey - k);
			c.lineTo(ex + k, ey + k);
			c.moveTo(ex + k, ey - k);
			c.lineTo(ex - k, ey + k);
			c.stroke();
		}
		c.strokeStyle = 'rgba(241,238,247,0.55)';
		c.lineWidth = 1.2 * px;
		c.setLineDash([4 * px, 4 * px]);
		c.beginPath();
		c.moveTo(drag.ox, drag.oy);
		c.lineTo(drag.x, drag.y);
		c.stroke();
		c.setLineDash([]);
		c.fillStyle = '#ff2e88';
		c.fillRect(drag.x - 1.5 * px, drag.y - 1.5 * px, 3 * px, 3 * px);
		if (!drag.body) {
			const p = PAYLOADS[sim.payload], [color, dark] = p.palette[(sim.uid + 1) % p.palette.length];
			c.globalAlpha = 0.7;
			drawBody(c, { x: drag.ox, y: drag.oy, r, color, dark, kind: p.id, rot: 0, verts: [1, 0.8, 1.05, 0.9, 1, 0.75, 1.1, 0.85], held: true }, px);
			c.globalAlpha = 1;
		}
	}

	for (const p of sim.particles) {
		c.globalAlpha = Math.max(0, p.life / p.max);
		c.fillStyle = p.color;
		const z = p.size * px;
		c.fillRect(p.x - z / 2, p.y - z / 2, z, z);
	}
	c.globalAlpha = 1;

	// The lane's label, under it.
	if (!sim.sandbox) {
		const lv = LEVELS[cur];
		c.setTransform(dpr, 0, 0, dpr, 0, 0);
		c.font = '500 ' + (view.compact ? 10 : 11) + 'px "Geist Mono", ui-monospace, monospace';
		c.textAlign = 'center';
		c.textBaseline = 'top';
		c.fillStyle = LIME;
		c.fillText(('L' + (cur + 1) + ' · ' + lv.inner + '–' + lv.outer).toUpperCase(), cx, cy + lv.outer * s + 6);
	}
}
