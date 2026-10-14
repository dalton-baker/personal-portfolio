import { buildProgram } from '$lib/orbit/blackhole.js';

/**
 * Slingshot's stars, drawn by WebGL on the black hole's canvas in the map's flat, posterized style: up to
 * two (the star, or the binary pair). Each is a circle of mottled, posterized surface (dark patches, the
 * star's colour, bright active regions) that slowly flows, with a bright rim and a faint, even haze. The
 * big star (detail 1) also has dark sunspots and, now and then, a small arc of flare looping out from its
 * edge; the binary's small stars (detail 0) keep to coarser mottling and the rim, so they stay clean when
 * they're small, fast and close together. Like the black hole, it outputs premultiplied colour with
 * coverage over the starfield.
 */

/** Palettes: surface tones dark to hot, the rim, the haze, sunspot penumbra and umbra, and flares. */
export const PALETTES = {
	sun: {
		tones: ['#c2410c', '#ff6a13', '#ff9f2b', '#ffd166', '#fff4d6'],
		rim: '#ffd98a',
		haze: '#ff8a1f',
		spot: ['#a8330a', '#3d1004'],
		flare: '#ffb83a'
	},
	blue: {
		tones: ['#2a55c8', '#3f7cff', '#6fa8ff', '#a9cfff', '#e6f2ff'],
		rim: '#e0f0ff',
		haze: '#5f95ff',
		spot: ['#2a55c8', '#16245e'],
		flare: '#bcdcff'
	},
	yellow: {
		tones: ['#e07a10', '#ffb12e', '#ffd166', '#fff1c2', '#fffaf0'],
		rim: '#fff1c2',
		haze: '#ffb12e',
		spot: ['#c25a0c', '#5a1d08'],
		flare: '#ffd166'
	}
};

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const flat = (p) => [...p.tones, p.rim, p.haze, ...p.spot, p.flare].flatMap(rgb);

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uC; uniform float uT; uniform float uPx;
uniform vec4 uS0; uniform vec4 uS1; uniform vec2 uSpots; uniform vec2 uDetail;
// Each star's palette: tones 0-4 (dark to hot), rim 5, haze 6, spot penumbra 7 and umbra 8, flare 9.
uniform vec3 uP0[10]; uniform vec3 uP1[10];

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
// Coverage of "v < edge" and "v > edge", antialiased over w.
float inside(float v, float edge, float w){ return clamp((edge - v)/w + 0.5, 0.0, 1.0); }
float above(float v, float edge, float w){ return 1.0 - inside(v, edge, w); }

// A position in the star's radii (s = centre in px from uC with y up, radius in px, and whether it's there).
vec2 local(vec2 f, vec4 s){ return (f - uC - s.xy)/s.z; }

// A faint, even haze around the star, fading out a little way from its edge.
void haze(inout vec4 acc, vec2 f, vec4 s, vec3 c, float detail){
  if (s.w < 0.5) return;
  float e = max(length(local(f, s)) - 1.0, 0.0);
  float a = mix(0.2, 0.22, detail)*(1.0 - smoothstep(0.0, mix(0.45, 0.9, detail), e))*(0.65 + 0.35*exp(-e*5.0));
  over(acc, c, a);
}

// Now and then, a small arc of flare loops out from a random point on the edge, grows, and fades. Three
// independent timers, each skipping most of its turns, so they come rarely and at odd moments.
void flares(inout vec4 acc, vec2 f, vec4 s, vec3 c, float seed){
  if (s.w < 0.5) return;
  vec2 p = local(f, s);
  float w = 1.2*uPx/s.z;
  for (int k = 0; k < 3; k++) {
    float fk = float(k), tt = uT/(5.0 + fk*2.3) + fk*0.37 + seed;
    float slot = floor(tt), q = fract(tt)/0.6;
    if (q > 1.0 || hash(vec2(slot, fk + seed)) > 0.45) continue;
    float ang = hash(vec2(slot*1.7, fk*3.1 + seed))*6.2832;
    vec2 foot = vec2(cos(ang), sin(ang));
    // A loop standing on the edge: an arc stretched outward, so it's taller than it is wide.
    float rr = (0.09 + 0.1*hash(vec2(slot, 9.1 + fk)))*smoothstep(0.0, 0.45, q);
    vec2 r = p - foot*(1.0 + rr*0.35);
    vec2 lp = vec2(dot(r, vec2(-foot.y, foot.x)), dot(r, foot)*0.62);
    float ring = abs(length(lp) - rr);
    over(acc, c, inside(ring, 0.032*(1.0 - 0.35*q), w)*(1.0 - smoothstep(0.65, 1.0, q)));
  }
}

// The disk: mottled, posterized surface that slowly flows, sunspots (big star), and a bright rim.
void disk(inout vec4 acc, vec2 f, vec4 s, vec3 P[10], float spots, float detail, float seed){
  if (s.w < 0.5) return;
  vec2 p = local(f, s);
  float d = length(p), w = 1.2*uPx/s.z;
  float cover = inside(d, 1.0, w);
  if (cover <= 0.0) return;
  float k = mix(1.5, 2.6, detail), nw = 0.012;
  vec2 flow = vec2(uT*0.06, -uT*0.045);
  vec2 warp = vec2(fbm(p*k*0.7 + flow + seed), fbm(p*k*0.7 - flow + seed + 5.2));
  float n = fbm(p*k + (warp - 0.5)*1.6 + vec2(-uT*0.05, uT*0.07) + seed*1.3);
  // Tone bands; the small stars sit in their bright tones, with only gentle mottling.
  vec4 t = mix(vec4(0.1, 0.36, 0.56, 0.7), vec4(0.31, 0.47, 0.6, 0.69), detail);
  vec3 c = P[0];
  c = mix(c, P[1], above(n, t.x, nw));
  c = mix(c, P[2], above(n, t.y, nw));
  c = mix(c, P[3], above(n, t.z, nw));
  c = mix(c, P[4], above(n, t.w, nw));
  if (spots > 0.0) {
    float m = fbm(p*3.2 + (warp - 0.5)*2.0 + seed*2.3 - flow*0.5), t0 = 0.68 + (1.0 - spots)*0.25;
    float keep = inside(d, 0.84, w*4.0);
    c = mix(c, P[7], above(m, t0, nw)*keep);
    c = mix(c, P[8], above(m, t0 + 0.05, nw)*keep);
  }
  c = mix(c, P[5], above(d, 1.0 - mix(0.07, 0.05, detail), w));
  over(acc, c, cover);
}

void main(){
  vec2 f = gl_FragCoord.xy;
  vec4 acc = vec4(0.0);
  haze(acc, f, uS1, uP1[6], uDetail.y);
  haze(acc, f, uS0, uP0[6], uDetail.x);
  if (uDetail.y > 0.5) flares(acc, f, uS1, uP1[9], 11.7);
  if (uDetail.x > 0.5) flares(acc, f, uS0, uP0[9], 3.1);
  disk(acc, f, uS1, uP1, uSpots.y, uDetail.y, 11.7);
  disk(acc, f, uS0, uP0, uSpots.x, uDetail.x, 3.1);
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
		u: { C: U('uC'), T: U('uT'), Px: U('uPx'), S0: U('uS0'), S1: U('uS1'), Spots: U('uSpots'), Detail: U('uDetail') },
		palette(i, name) {
			if (cache[i] === name) return;
			cache[i] = name;
			gl.uniform3fv(P[i], flat(PALETTES[name]));
		}
	};
}
