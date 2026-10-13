/**
 * Draws the starfield off the main thread. The page transfers the star canvas here and sends its size,
 * the scan mode, and when to pause (the reader covering the map, a hidden tab).
 */
import { Starfield, STAR_FPS } from './starfield.js';

/** @type {Starfield | null} */
let field = null;
let running = true;
let timer = 0;
let last = 0;

function loop() {
	timer = 0;
	if (!running || !field) return;
	const now = performance.now();
	field.frame(Math.min(0.1, (now - last) / 1000));
	last = now;
	timer = setTimeout(loop, 1000 / STAR_FPS);
}

self.onmessage = ({ data: m }) => {
	if (m.type === 'init') {
		field = new Starfield(m.canvas, m.reduced);
	} else if (m.type === 'size') {
		field?.size(m.w, m.h, m.dpr);
	} else if (m.type === 'scan') {
		if (field) field.scanTarget = m.on ? 1 : 0;
	} else if (m.type === 'run') {
		running = m.on;
	}
	if (running && field && !timer) {
		last = performance.now();
		timer = setTimeout(loop, 1000 / STAR_FPS);
	}
};
