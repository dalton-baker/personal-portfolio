/**
 * The black hole shader, shared by the map (engine.js) and the Gravity Well game.
 */

/** WebGL context options: transparent (premultiplied) so the starfield shows around and through the disk. */
export const HOLE_GL_OPTIONS = { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, stencil: false, powerPreference: 'low-power' };

/**
 * Compiles the shader and sets up the triangle it's drawn on. Returns the uniform locations (C centre,
 * R disk radius, T time, Ty tilt, Scan scan-mode mix, Px canvas pixels per CSS pixel, all in canvas
 * pixels with y up) and the largest size the context can draw, or null if it can't be built.
 */
export function createHoleProgram(gl) {
	const mk = (type, src) => {
		const s = gl.createShader(type);
		gl.shaderSource(s, src);
		gl.compileShader(s);
		if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
			console.warn(gl.getShaderInfoLog(s));
			return null;
		}
		return s;
	};
	const vs = mk(gl.VERTEX_SHADER, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }');
	const fs = mk(gl.FRAGMENT_SHADER, FRAG);
	if (!vs || !fs) return null;
	const pr = gl.createProgram();
	gl.attachShader(pr, vs);
	gl.attachShader(pr, fs);
	gl.linkProgram(pr);
	if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
	gl.useProgram(pr);
	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const loc = gl.getAttribLocation(pr, 'p');
	gl.enableVertexAttribArray(loc);
	gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
	const U = (n) => gl.getUniformLocation(pr, n);
	const vp = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
	return {
		u: { C: U('uC'), R: U('uR'), T: U('uT'), Ty: U('uTy'), Scan: U('uScan'), Px: U('uPx') },
		max: Math.min(vp[0], vp[1], gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), 4096)
	};
}

/**
 * The black hole: accretion disk, halftone haze, shadow and photon ring. It outputs premultiplied colour
 * with coverage, so the starfield shows through wherever it isn't opaque (between the haze dots, the
 * disk's gaps, and everything outside it).
 */
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uC; uniform float uR; uniform float uT; uniform float uTy; uniform float uScan; uniform float uPx;
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
vec3 band(float k){
  if(k < 1.5) return vec3(0.231,0.051,0.369);
  if(k < 2.5) return vec3(0.761,0.094,0.478);
  if(k < 3.5) return vec3(1.0,0.353,0.122);
  if(k < 4.5) return vec3(1.0,0.788,0.235);
  return vec3(1.0,0.957,0.839);
}
float dens(float ang0, float r, float sh){
  float ang = ang0 + sh;
  float arms = 0.5 + 0.5*sin(3.0*ang + log(r)*9.0);
  float str = 0.5 + 0.5*sin(17.0*ang + r*31.0 + 2.0*sin(5.0*ang - uT*0.6));
  return 0.2 + 0.55*arms + 0.3*str;
}
// Light laid over what's drawn so far, with coverage equal to its brightest channel. That's close to adding
// it, since the stars and background it covers are so dark.
void glow(inout vec3 col, inout float al, vec3 l){
  float la = min(1.0, max(l.r, max(l.g, l.b)));
  col = min(l, vec3(la)) + col*(1.0 - la);
  al = la + al*(1.0 - la);
}
void main(){
  vec2 f = gl_FragCoord.xy;
  vec2 p = (f - uC)/uR;
  vec2 q = vec2(p.x, p.y/uTy);
  float rp = length(p); float rq = length(q);
  // The disk, halftone and photon ring all fade to exactly zero before 1.75 disk radii (allowing for the
  // halftone cell size); the canvas covers about that box.
  if(rq >= 1.75){ gl_FragColor = vec4(0.0); return; }
  vec3 lime = vec3(0.784,1.0,0.18);
  float a = atan(q.y, q.x);
  float rs = 0.24; float inner = 0.30;
  float rqc = max(rq, 0.05);
  float w = pow(inner/rqc, 1.5);
  float edge = smoothstep(inner - 0.01, inner + 0.05, rq)*(1.0 - smoothstep(0.5, 1.0, rq));
  float heat = pow(inner/max(rq, inner), 1.3);
  float PER = 9.0;
  float t1 = mod(uT, PER); float t2 = mod(uT + 0.5*PER, PER);
  float w1 = 1.0 - abs(t1/PER*2.0 - 1.0);
  float base = a + uT*0.35;
  float d1 = dens(base, rqc, w*t1*0.8);
  float d2 = dens(base, rqc, w*t2*0.8);
  float dd = clamp(edge*mix(d2, d1, w1)*(0.4 + 0.8*heat), 0.0, 0.999);
  float x = dd*5.5;
  float k = floor(x);
  float fill = step(1.0, k);
  float fe = fract(x); float e = min(fe, 1.0 - fe);
  float contour = smoothstep(0.09, 0.0, e)*step(0.12, dd);
  // Premultiplied colour (col) and coverage (al): solid colour bands, or in scan mode lime contour lines.
  vec3 col = band(k)*fill; float al = fill;
  vec3 sc = vec3(0.0); float sa = 0.0;
  glow(sc, sa, lime*(contour*0.85 + 0.04*edge));
  col = mix(col, sc, uScan); al = mix(al, sa, uScan);
  // Halftone dots on a grid anchored to the black hole, so they move with it (parallax, camera).
  float hc = 7.0*uPx; vec2 cc = uC + (floor((f - uC)/hc) + 0.5)*hc;
  vec2 pc = (cc - uC)/uR; float rcc = length(vec2(pc.x, pc.y/uTy));
  float g = pow(smoothstep(1.55, 0.8, rcc), 2.0)*step(0.62, rcc);
  float hr = hc*0.36*sqrt(g);
  float dotm = g > 0.003 ? 1.0 - smoothstep(hr - 0.75*uPx, hr + 0.75*uPx, length(f - cc)) : 0.0;
  vec3 htc = mix(vec3(0.34,0.06,0.31), lime*0.3, uScan);
  float m = dotm*(1.0 - fill*(1.0 - uScan));
  col = mix(col, htc, m); al = mix(al, 1.0, m);
  float sh = step(rp, rs)*(1.0 - uScan*0.9);
  col *= 1.0 - sh; al = mix(al, 1.0, sh);
  float rr0 = rs + 0.014; float rw = 0.018; float off = 0.013;
  float cr = smoothstep(rw, 0.0, abs(length(p + vec2(off, 0.0)) - rr0));
  float cg = smoothstep(rw, 0.0, abs(rp - rr0));
  float cb = smoothstep(rw, 0.0, abs(length(p - vec2(off, 0.0)) - rr0));
  vec3 ringc = vec3(max(cr, cg), cg, max(cb, cg));
  glow(col, al, mix(ringc*1.3, lime*cg, uScan));
  glow(col, al, lime*uScan*smoothstep(0.008, 0.0, abs(rp - rs))*0.9);
  // Film grain, like the star layer's.
  col += (hash(f*0.73 + fract(uT*0.37)*91.0) - 0.5)*0.05*al;
  gl_FragColor = vec4(clamp(col, 0.0, al), al);
}
`;
