import { buildProgram } from '$lib/orbit/blackhole.js';

/**
 * Slingshot's stars, drawn by WebGL on the black hole's canvas, in the map's flat, posterized style: up to
 * two (the star, or the binary pair). Each is a disk of flat colour bands whose edges wobble as its surface
 * flows, with sunspots (a dark blob in a lighter ring) that drift and change shape, inside two bands of
 * flame like the black hole's disk. Around it are a flat four-point starburst, like the background's
 * sparkle stars, and a halftone haze like the black hole's. Like the black hole, it outputs premultiplied
 * colour with coverage over the starfield.
 */

/** Palettes, centre out: disk bands, the two flames, the haze's dots near and far, and the sunspots. */
export const PALETTES = {
	yellow: {
		disk: ['#fff4d6', '#ffe58a', '#ffc93c'],
		flame: ['#ff5a1f', '#c2187a'],
		dots: ['#ffb12e', '#7a1f5c'],
		spot: ['#e0701a', '#5a1d08']
	},
	blue: {
		disk: ['#f2f8ff', '#bcdcff', '#6fa8ff'],
		flame: ['#3f6fe8', '#2a2f8a'],
		dots: ['#6fa8ff', '#2a2f8a'],
		spot: ['#4f7fe0', '#16245e']
	}
};

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const flat = (p) => [...p.disk, ...p.flame, ...p.dots, ...p.spot].flatMap(rgb);

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uC; uniform float uT; uniform float uPx; uniform float uGlow;
uniform vec4 uS0; uniform vec4 uS1; uniform vec2 uSpots;
// Each star's palette: disk bands 0-2, flames 3-4, dots near/far 5-6, spot penumbra/umbra 7-8.
uniform vec3 uP0[9]; uniform vec3 uP1[9];

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p), u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a*noise(p); p = p*2.03 + 17.1; a *= 0.5; }
  return v;
}
// Premultiplied "over".
void over(inout vec4 acc, vec3 c, float a){ acc = vec4(c*a + acc.rgb*(1.0 - a), a + acc.a*(1.0 - a)); }
// Coverage of "v < edge", antialiased over w.
float inside(float v, float edge, float w){ return clamp((edge - v)/w + 0.5, 0.0, 1.0); }

// A star's position in its own radii, and the glare's (sized as if it were at least uGlow px across).
vec2 local(vec2 f, vec4 s){ return (f - uC - s.xy)/s.z; }
float glowR(vec4 s){ return max(s.z, uGlow); }

// The four-point starburst, with shorter diagonals, its length breathing a little.
void burst(inout vec4 acc, vec2 f, vec4 s, vec3 c, float seed){
  if (s.w < 0.5) return;
  float g = glowR(s), w = uPx/g;
  vec2 p = (f - uC - s.xy)/g;
  float L = 3.0 + 0.2*sin(uT*1.3 + seed);
  float a = 0.0;
  for (int k = 0; k < 2; k++) {
    vec2 q = k == 0 ? abs(p) : abs(vec2(p.x + p.y, p.x - p.y))*0.7071;
    float l = k == 0 ? L : L*0.5, wd = k == 0 ? 0.075 : 0.05;
    a = max(a, inside(q.y, wd*(1.0 - q.x/l), w)*step(q.x, l));
    a = max(a, inside(q.x, wd*(1.0 - q.y/l), w)*step(q.y, l));
  }
  over(acc, c, a*0.92);
}

// Two bands of flame around the disk; their edges wobble and flow like the black hole's disk.
void flames(inout vec4 acc, vec2 f, vec4 s, vec3 inner, vec3 outer, float seed){
  if (s.w < 0.5) return;
  vec2 p = local(f, s);
  float d = length(p), a = atan(p.y, p.x), w = 1.2*uPx/s.z;
  vec2 ring = vec2(cos(a), sin(a));
  float wob = 0.07*sin(5.0*a - uT*1.2 + seed) + 0.05*sin(9.0*a + uT*1.9 + seed*2.0) + 0.12*(fbm(ring*1.8 + vec2(uT*0.35, seed)) - 0.5);
  float r1 = 1.22 + wob, r2 = 1.0 + (r1 - 1.0)*0.55 + 0.03*sin(7.0*a - uT*2.3 + seed);
  over(acc, outer, inside(d, r1, w));
  over(acc, inner, inside(d, r2, w));
}

// The disk: flat bands whose edges wobble as the surface flows, and sunspots that drift and change shape.
void disk(inout vec4 acc, vec2 f, vec4 s, vec3 b0, vec3 b1, vec3 b2, vec3 pen, vec3 umb, float spots, float seed){
  if (s.w < 0.5) return;
  vec2 p = local(f, s);
  float d = length(p), w = 1.2*uPx/s.z;
  float cover = inside(d, 1.0, w);
  if (cover <= 0.0) return;
  vec2 flow = vec2(uT*0.12, -uT*0.08);
  vec2 warp = vec2(fbm(p*1.6 + flow + seed), fbm(p*1.6 - flow + seed + 5.2));
  float v = d + (fbm(p*2.2 + (warp - 0.5)*1.4 + vec2(-uT*0.1, uT*0.15)) - 0.5)*0.3;
  vec3 c = b2;
  c = mix(c, b1, inside(v, 0.8, w*1.5));
  c = mix(c, b0, inside(v, 0.48, w*1.5));
  float n = fbm(p*2.8 + (warp - 0.5)*2.0 + seed*1.7), t0 = 0.66 + (1.0 - spots)*0.2;
  float keep = inside(d, 0.86, w*4.0);
  c = mix(c, pen, (1.0 - inside(n, t0, w*0.8))*keep);
  c = mix(c, umb, (1.0 - inside(n, t0 + 0.06, w*0.8))*keep);
  over(acc, c, cover);
}

void main(){
  vec2 f = gl_FragCoord.xy;
  vec4 acc = vec4(0.0);
  // Halftone haze on one grid for both stars (anchored to the middle, like the black hole's): dots big and
  // bright near a star, shrinking away from it, coloured by whichever star they belong to most.
  float hc = 7.0*uPx; vec2 cc = uC + (floor((f - uC)/hc) + 0.5)*hc;
  float g0 = uS0.w > 0.5 ? pow(clamp((3.4 - length(cc - uC - uS0.xy)/glowR(uS0))/2.4, 0.0, 1.0), 1.5) : 0.0;
  float g1 = uS1.w > 0.5 ? pow(clamp((3.4 - length(cc - uC - uS1.xy)/glowR(uS1))/2.4, 0.0, 1.0), 1.5) : 0.0;
  float gl = max(g0, g1);
  if (gl > 0.002) {
    vec3 dc = g0 >= g1 ? mix(uP0[6], uP0[5], g0) : mix(uP1[6], uP1[5], g1);
    float hr = hc*0.46*sqrt(gl);
    over(acc, dc, inside(length(f - cc), hr, uPx*1.2));
  }
  burst(acc, f, uS1, uP1[1], 11.7);
  burst(acc, f, uS0, uP0[1], 3.1);
  flames(acc, f, uS1, uP1[3], uP1[4], 11.7);
  flames(acc, f, uS0, uP0[3], uP0[4], 3.1);
  disk(acc, f, uS1, uP1[0], uP1[1], uP1[2], uP1[7], uP1[8], uSpots.y, 11.7);
  disk(acc, f, uS0, uP0[0], uP0[1], uP0[2], uP0[7], uP0[8], uSpots.x, 3.1);
  gl_FragColor = acc;
}
`;

/** The stars' program; positions in canvas pixels with y up (see FRAG). `palette(i, name)` sets star i's colours. */
export function createStarProgram(gl) {
	const p = buildProgram(gl, FRAG);
	if (!p) return null;
	const U = p.U;
	const P = [U('uP0'), U('uP1')];
	const cache = [null, null];
	return {
		use: p.use,
		u: { C: U('uC'), T: U('uT'), Px: U('uPx'), Glow: U('uGlow'), S0: U('uS0'), S1: U('uS1'), Spots: U('uSpots') },
		palette(i, name) {
			if (cache[i] === name) return;
			cache[i] = name;
			gl.uniform3fv(P[i], flat(PALETTES[name]));
		}
	};
}
