import { Starfield, STAR_FPS } from './starfield.js';

/**
 * Runs a starfield (starfield.js) on a canvas. It draws in a worker on an OffscreenCanvas where the browser
 * supports it (Chrome 69+, Firefox 105+, Safari 16.4+), keeping its redraws off the main thread; otherwise
 * it draws here, on frame(), which the owner calls every animation frame either way.
 */
export class StarfieldHost {
	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {boolean} reduced prefers-reduced-motion
	 */
	constructor(canvas, reduced) {
		this.canvas = canvas;
		this.reduced = reduced;
		/** The last size, scan mode and running state asked for, so a starfield that starts late catches up. */
		this.dims = null;
		this.scanOn = false;
		this.running = true;
		this.at = 0;
		/** @type {Worker | null} */
		this.worker = null;
		/** @type {Worker | null} */
		this.pending = null;
		/** @type {Starfield | null} */
		this.field = null;
		let worker = null;
		if (typeof canvas.transferControlToOffscreen === 'function' && typeof Worker === 'function') {
			try {
				worker = new Worker(new URL('./starfield.worker.js', import.meta.url), { type: 'module' });
			} catch {
				worker = null;
			}
		}
		if (!worker) {
			this.drawHere();
			return;
		}
		// The canvas can only be handed over once, so wait for the worker to say it has loaded and can draw.
		// If it fails to load, can't draw there, or doesn't answer, terminate it and draw here instead.
		const fail = () => {
			if (this.pending !== worker) return;
			clearTimeout(this.timer);
			this.pending = null;
			worker.terminate();
			this.drawHere();
		};
		this.pending = worker;
		this.timer = setTimeout(fail, 4000);
		worker.onerror = fail;
		worker.onmessage = ({ data }) => {
			if (this.pending !== worker) return;
			if (data.type !== 'ready') return fail();
			clearTimeout(this.timer);
			this.pending = null;
			worker.onerror = worker.onmessage = null;
			const off = canvas.transferControlToOffscreen();
			worker.postMessage({ type: 'init', canvas: off, reduced }, [off]);
			this.worker = worker;
			if (this.dims) worker.postMessage({ type: 'size', ...this.dims });
			worker.postMessage({ type: 'scan', on: this.scanOn });
			worker.postMessage({ type: 'run', on: this.running });
		};
	}

	drawHere() {
		const f = (this.field = new Starfield(this.canvas, this.reduced));
		if (this.dims) f.size(this.dims.w, this.dims.h, this.dims.dpr);
		f.scanTarget = f.scan = this.scanOn ? 1 : 0;
	}

	/** Sizes it for a w x h (CSS px) area. */
	size(w, h, dpr) {
		this.dims = { w, h, dpr };
		this.worker?.postMessage({ type: 'size', w, h, dpr });
		this.field?.size(w, h, dpr);
	}

	/** Scan mode tints the stars lime. */
	scan(on) {
		if (on === this.scanOn) return;
		this.scanOn = on;
		this.worker?.postMessage({ type: 'scan', on });
		if (this.field) this.field.scanTarget = on ? 1 : 0;
	}

	/** Pauses it (the map covered, a hidden tab) or lets it run again. */
	run(on) {
		if (on === this.running) return;
		this.running = on;
		this.worker?.postMessage({ type: 'run', on });
		if (on) this.at = performance.now();
	}

	/** Redraws a starfield running here, when it's due. */
	frame(now) {
		if (!this.field || !this.running || now - this.at < 1000 / STAR_FPS - 2) return;
		this.field.frame(Math.min(0.1, (now - this.at) / 1000));
		this.at = now;
	}

	destroy() {
		clearTimeout(this.timer);
		this.pending?.terminate();
		this.worker?.terminate();
		this.pending = this.worker = null;
	}
}
