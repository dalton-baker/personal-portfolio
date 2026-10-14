import { buildProgram } from '$lib/orbit/blackhole.js';

/**
 * Slingshot's stars, drawn by WebGL on the black hole's canvas: up to two (the star, or the binary pair).
 * Each is a white-hot disk going to its colour at the edge, with sunspots that drift and change shape as
 * it turns (domain-warped noise, flowing like the black hole's disk), and glare far too bright to look at:
 * an overexposed halo that washes out the stars behind it, slow streamers, a flicker, and a lens-flare
 * streak. Like the black hole, it outputs premultiplied colour with coverage over the starfield.
 */
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uC; uniform float uT; uniform float uEdge; uniform float uPx; uniform float uGlow;
uniform vec4 uS0; uniform vec4 uS1;
uniform vec3 uCol0; uniform vec3 uCol1; uniform vec2 uSpots;

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p), u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a*noise(p); p = p*2.03 + 17.1; a *= 0.5; }
  return v;
}

// Light from one star (before tone mapping) at fragment f. s = centre (px from uC, y up), radius (px),
// and whether it's there; spots is how spotted it is (0 to 1); disk gathers how much of the fragment the
// star's disk covers.
vec3 star(vec2 f, vec4 s, vec3 col, float spots, float seed, inout float disk){
  if (s.w < 0.5) return vec3(0.0);
  vec2 p = (f - uC - s.xy)/s.z;
  float d = length(p);
  vec3 surf = vec3(0.0);
  float z = 0.0;
  if (d < 1.0) {
    // The visible face of a sphere, turning slowly: white-hot in the middle, darkening to the star's colour
    // at the limb, with boiling granules.
    z = sqrt(1.0 - d*d);
    vec2 q = vec2(atan(p.x, z) + uT*0.04, asin(clamp(p.y, -1.0, 1.0)))*3.4 + seed;
    float gran = 0.9 + 0.1*noise(q*7.0 + vec2(uT*0.9, -uT*0.6));
    surf = (col*2.2 + vec3(1.6)*pow(z, 1.5))*(0.6 + 0.4*pow(z, 0.6))*gran;
    // Sunspots: a dark umbra in a warm penumbra. The noise they come from is warped by more noise that
    // flows over time, so they undulate, drift and change shape, like the black hole's disk.
    vec2 w = vec2(fbm(q*1.1 + vec2(uT*0.11, -uT*0.07)), fbm(q*1.1 + vec2(-uT*0.09, uT*0.12) + 5.2));
    float n = fbm(q*1.2 + (w - 0.5)*1.6), t0 = 0.67 + (1.0 - spots)*0.2;
    float pen = smoothstep(t0, t0 + 0.025, n), umbra = smoothstep(t0 + 0.045, t0 + 0.065, n);
    surf = mix(surf, surf*vec3(0.62, 0.4, 0.22), pen*z);
    surf = mix(surf, vec3(0.16, 0.06, 0.02), umbra*z);
  }
  // The glare is sized as if the star were at least uGlow px across, so a small star still blinds.
  float g = max(s.z, uGlow), e = max(d - 1.0, 0.0)*s.z/g, ang = atan(p.y, p.x);
  vec2 pg = p*s.z/g;
  float flick = 1.0 + 0.05*sin(uT*6.3 + seed) + 0.035*sin(uT*14.1 + seed*2.0);
  float rays = 0.5 + 0.5*sin(ang*7.0 + 4.0*fbm(vec2(ang*1.6 + seed, uT*0.25)));
  // A blinding core of glare, a softer halo, streamers, and a faint bloom reaching far across the field.
  float halo = exp(-e*2.6)*2.2 + 0.8/(1.0 + e*e*4.0) + rays*rays*exp(-e*1.2)*0.55 + 0.32*exp(-e*0.55);
  float flare = exp(-abs(pg.y)*14.0)*exp(-abs(pg.x)*0.16)*0.6 + exp(-abs(pg.x)*22.0)*exp(-abs(pg.y)*0.3)*0.18;
  vec3 glare = mix(col, vec3(1.0), exp(-e*2.4))*(halo + flare)*flick;
  float edge = smoothstep(1.0, 1.0 - 1.5*uPx/s.z, d);
  disk = max(disk, edge);
  // The glare blooms over the limb too, so the disk is the source of the light rather than a ball in front of it.
  return mix(glare, surf + glare*0.4*pow(1.0 - z, 2.0), edge);
}

void main(){
  vec2 f = gl_FragCoord.xy;
  float disk = 0.0;
  vec3 c = star(f, uS0, uCol0, uSpots.x, 3.1, disk) + star(f, uS1, uCol1, uSpots.y, 11.7, disk);
  // The glare fades out before the edge of the canvas.
  c *= mix(smoothstep(uEdge, uEdge*0.78, length(f - uC)), 1.0, disk);
  c = 1.0 - exp(-c*1.25);
  float a = max(disk, min(1.0, max(c.r, max(c.g, c.b))));
  gl_FragColor = vec4(min(c, vec3(a)), a);
}
`;

/** The stars' program; uniforms in canvas pixels with y up (see FRAG). */
export function createStarProgram(gl) {
	const p = buildProgram(gl, FRAG);
	if (!p) return null;
	const U = p.U;
	return { use: p.use, u: { C: U('uC'), T: U('uT'), Edge: U('uEdge'), Px: U('uPx'), Glow: U('uGlow'), S0: U('uS0'), S1: U('uS1'), Col0: U('uCol0'), Col1: U('uCol1'), Spots: U('uSpots') } };
}
