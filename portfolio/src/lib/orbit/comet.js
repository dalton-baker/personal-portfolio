/**
 * A comet's tails, drawn on a 2D canvas (the map's effects canvas, and Slingshot's comets). Both point
 * away from the star or black hole: a faint straight ion tail, and a dust tail of halftone dots that bends
 * back along the comet's path. (x, y) is the nucleus, (ax, ay) the unit vector away from what it orbits,
 * (vx, vy) its unit direction of travel, len the tail length and s the size of a pixel, in canvas units.
 */
export function drawCometTail(ctx, x, y, ax, ay, vx, vy, len, s = 1) {
	if (!(len > 1)) return;
	const ex = x + ax * len, ey = y + ay * len, w = 3 * s;
	const ion = ctx.createLinearGradient(x, y, ex, ey);
	ion.addColorStop(0, 'rgba(191,233,255,0.85)');
	ion.addColorStop(1, 'rgba(191,233,255,0)');
	ctx.fillStyle = ion;
	ctx.beginPath();
	ctx.moveTo(x - ay * w, y + ax * w);
	ctx.lineTo(ex, ey);
	ctx.lineTo(x + ay * w, y - ax * w);
	ctx.closePath();
	ctx.fill();
	const n = Math.max(3, Math.round(len / (4.5 * s)));
	ctx.fillStyle = '#ffe2b8';
	for (let i = 1; i <= n; i++) {
		const f = i / n, d = f * len * 0.85, bend = f * f * len * 0.35;
		const px = x + ax * d - vx * bend, py = y + ay * d - vy * bend;
		const r = (2.5 - 1.9 * f) * s;
		ctx.globalAlpha = 0.85 * (1 - f) + 0.05;
		ctx.beginPath();
		ctx.arc(px, py, r, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = 1;
}
