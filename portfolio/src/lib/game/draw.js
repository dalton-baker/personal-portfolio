import { LEVELS, CORES, PAYLOADS, REVS } from './sim.js';
import { CometTail, cometStrength } from '$lib/orbit/comet.js';
import { PALETTES } from './stars.js';

/**
 * Slingshot's 2D layer, in the map's style: lanes, the cores WebGL doesn't draw (it draws the black hole and
 * the stars, unless it's unavailable), trails, bodies, the aiming line and its predicted path, and bursts.
 * Drawing happens in game units (the view's scale `s` and centre `cx`, `cy`), so `px` is one CSS pixel in
 * game units.
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

/** A star without WebGL: its flames and disk bands as flat circles (see stars.js). */
function drawFlatStar(c, x, y, R, name) {
	const p = PALETTES[name];
	for (const [k, col] of [[1.22, p.flame[1]], [1.12, p.flame[0]], [1, p.disk[2]], [0.8, p.disk[1]], [0.48, p.disk[0]]]) {
		c.fillStyle = col;
		c.beginPath();
		c.arc(x, y, R * k, 0, TAU);
		c.fill();
	}
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
	} else if (id === 'star') {
		if (!gl) drawFlatStar(c, 0, 0, CORES.star.r, CORES.star.palette);
	} else if (id === 'giant') drawGiant(c, 46);
	else {
		// The binary pair: each star's orbit around their centre of mass (WebGL draws the stars themselves).
		const srcs = sim.sources(sim.simT), stars = CORES.binary.stars;
		c.setLineDash([2 * px, 5 * px]);
		c.strokeStyle = 'rgba(214,226,240,0.22)';
		c.lineWidth = px;
		for (const sr of srcs) {
			c.beginPath();
			c.arc(0, 0, Math.hypot(sr.x, sr.y), 0, TAU);
			c.stroke();
		}
		c.setLineDash([]);
		if (!gl) srcs.forEach((sr, i) => drawFlatStar(c, sr.x, sr.y, sr.r, stars[i].palette));
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
		tail.draw(c, b.x, b.y, px, empty ? tail.bx : undefined, empty ? tail.by : undefined, b.r * 2);
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
		const v = sim.launchVel(drag), pr = sim.predict(drag.ox, drag.oy, v[0], v[1], r, drag.body), pts = pr.pts, n = pts.length / 2;
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
