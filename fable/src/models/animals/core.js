// Shared helpers + the parametric quadruped generator for the taxidermy animal library.
// Everything is authored in "H units" (shoulder height = 1) in standing coordinates:
// y up, feet on y = 0, head towards +X, symmetric about z = 0. finish() scales to metres.
import * as THREE from 'three';
import { Geo, col, mixCol, shade, mulberry } from '../../engine/builder.js';
import { loft, tube, ellipsoid, spike, rod, plate } from '../loft.js';

export { THREE, Geo, col, mixCol, shade, mulberry, loft, tube, ellipsoid, spike, rod, plate };

export const D2R = Math.PI / 180;
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
/** smoothstep that also works with reversed edges (a > b). */
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

// ---------------------------------------------------------------------------
// noise for markings
// ---------------------------------------------------------------------------
export function hash(ix, iy, iz) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul(iz | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const h = hash;
  const a = lerp(lerp(h(ix, iy, iz), h(ix + 1, iy, iz), fx), lerp(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), fx), fy);
  const b = lerp(lerp(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), fx), lerp(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), fx), fy);
  return lerp(a, b, fz);
}
export function fbm(x, y, z) { return noise3(x, y, z) * 0.6 + noise3(x * 2.1 + 7, y * 2.1 + 3, z * 2.1 + 11) * 0.4; }
/** Worley noise: returns [f1, f2, cellId] for point p scaled by 1/cell. */
const _w = [0, 0, 0];
export function worley(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let f1 = 9, f2 = 9, id = 0;
  for (let k = -1; k <= 1; k++) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = ix + i, cy = iy + j, cz = iz + k;
    const px = cx + hash(cx, cy, cz), py = cy + hash(cy, cz + 17, cx), pz = cz + hash(cz, cx + 31, cy);
    const d = Math.hypot(px - x, py - y, pz - z);
    if (d < f1) { f2 = f1; f1 = d; id = hash(cx + 5, cy + 9, cz + 3); } else if (d < f2) f2 = d;
  }
  _w[0] = f1; _w[1] = f2; _w[2] = id;
  return _w;
}

/** Piecewise (half smooth) interpolation of column k of a table sorted by column 0. */
export function samp(st, t, k) {
  if (t <= st[0][0]) return st[0][k];
  for (let i = 1; i < st.length; i++) {
    if (t <= st[i][0]) {
      const f = (t - st[i - 1][0]) / (st[i][0] - st[i - 1][0]);
      return lerp(st[i - 1][k], st[i][k], lerp(f, f * f * (3 - 2 * f), 0.5));
    }
  }
  return st[st.length - 1][k];
}

// ---------------------------------------------------------------------------
// geometry helpers
// ---------------------------------------------------------------------------
/** Parametric sheet fn(u,v)->[x,y,z], u,v in 0..1. Normal = du x dv (or flipped). */
export function grid(nu, nv, fn, flip = false) {
  const pos = [], idx = [], uv = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); pos.push(p[0], p[1], p[2]); uv.push(i / nu, j / nv); }
  const W = nu + 1;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
    if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
/** Add both faces of a sheet with separate colours (colour may be hex / triple / fn(x,y,z,i)). */
export function sheet(G, nu, nv, fn, cFront, cBack, mat = 'flat') {
  G.add(mat, grid(nu, nv, fn, false), null, cFront);
  G.add(mat, grid(nu, nv, fn, true), null, cBack ?? cFront);
}

const SHAPES = {
  leaf: (v) => Math.pow(Math.sin(Math.PI * Math.pow(0.14 + 0.86 * v, 0.8)), 0.7),
  round: (v) => Math.sqrt(Math.max(0, 1 - v * v * v)) * (0.8 + 0.2 * Math.sin(Math.PI * Math.min(1, v * 1.6))),
  point: (v) => (1 - v) * 0.75 + 0.25 * Math.sin(Math.PI * v),
  long: (v) => Math.pow(Math.sin(Math.PI * Math.pow(0.1 + 0.9 * v, 0.6)), 0.8),
};
/**
 * Cupped ear / leaf / feather. o: base, axis (length direction), face (direction the concave side looks),
 * len, w (half width), cup, bend (tip curls towards face), shape, cIn, cOut.
 */
export function leaf(G, o) {
  const A = V3(o.axis).normalize();
  const S = new THREE.Vector3().crossVectors(A, V3(o.face)).normalize();
  const F = new THREE.Vector3().crossVectors(S, A).normalize();
  const shape = typeof o.shape === 'function' ? o.shape : SHAPES[o.shape || 'leaf'];
  const B = o.base, len = o.len, w = o.w, cup = o.cup ?? 0.4, bend = o.bend ?? 0;
  const fn = (u, v) => {
    const uu = u * 2 - 1, ww = w * shape(v);
    const s = uu * ww, f = -cup * ww * (1 - uu * uu) + bend * len * v * v, l = len * v;
    return [B[0] + A.x * l + S.x * s + F.x * f, B[1] + A.y * l + S.y * s + F.y * f, B[2] + A.z * l + S.z * s + F.z * f];
  };
  sheet(G, o.nu || 4, o.nv || 5, fn, o.cIn, o.cOut, o.mat || 'flat');
}

/** Sample fn(t)->[x,y,z] at n+1 points. */
export function curve(fn, n) { const p = []; for (let i = 0; i <= n; i++) p.push(fn(i / n)); return p; }

/** Horn / tusk tube with tapering radius and optional annular ridges. */
export function horn(pts, r0, r1, o = {}) {
  const n = pts.length - 1;
  const ridge = o.ridge || 0, rn = o.ridges || n / 2, upto = o.ridgeTo ?? 0.7, pw = o.pow || 1;
  const rad = pts.map((_, i) => {
    const t = i / n;
    let r = lerp(r0, r1, Math.pow(t, pw));
    if (ridge && t < upto) r *= 1 + ridge * Math.cos(t * rn * 2 * Math.PI);
    return r;
  });
  return loft(pts.map((p, i) => ({ p, rx: rad[i] * (o.flat || 1), ry: rad[i] })), { radial: o.radial || 7, sub: o.sub || 2, capBulge: 0.3, up: o.up, color: o.color });
}

/** Displace vertices along their normals with noise (shaggy fur, manes, wool). */
export function shag(g, amp, freq = 14) {
  const P = g.attributes.position, N = g.attributes.normal;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    const d = (fbm(x * freq, y * freq, z * freq) - 0.5) * 2 * amp;
    P.setXYZ(i, x + N.getX(i) * d, y + N.getY(i) * d, z + N.getZ(i) * d);
  }
  g.computeVertexNormals();
  return g;
}

/** Limb loft. pts: [x, y, z, halfLateral, halfFore, halfAft]; path should run downwards (up ref = +x). */
export function limb(pts, o = {}) {
  return loft(pts.map((p) => ({ p: [p[0], p[1], p[2]], rx: p[3], ry: p[4], ryb: p[5] ?? p[4] })),
    { radial: o.radial || 10, sub: o.sub || 3, up: o.up || [1, 0, 0], color: o.color, capBulge: o.capBulge ?? 0.4, capStart: o.capStart, capEnd: o.capEnd, squareness: o.squareness });
}

/** Translate so the lowest vertex sits on y = 0 and scale uniformly. */
export function finish(g, scale = 1) {
  let min = Infinity;
  for (const b of g.buckets.values()) for (const ch of b.chunks) for (let i = 1; i < ch.pos.length; i += 3) if (ch.pos[i] < min) min = ch.pos[i];
  if (!isFinite(min)) min = 0;
  const out = new Geo();
  out.addGeo(g, new THREE.Matrix4().makeScale(scale, scale, scale).setPosition(0, -min * scale, 0));
  return out;
}

export function seeded(opts, salt = 0) {
  const seed = (opts.seed | 0);
  const rng = mulberry(Math.imul(seed, 2654435761) + 777 + salt);
  for (let i = 0; i < 3; i++) rng();
  return { seed, rng, rv: (a) => (seed ? (rng() * 2 - 1) * a : 0) };
}

// ---------------------------------------------------------------------------
// standard coat: counter-shading + socks + muzzle, with an optional marking hook
// ---------------------------------------------------------------------------
/**
 * C: { base, back, belly, leg, muzzle, face, tail, sockHi, sockLo, inner }
 * mark(colour, c) -> colour   (c: {part, u, a, sy, p, inner, s, which, hl})
 */
export function stdCoat(C, mark) {
  const base = col(C.base), back = col(C.back ?? C.base), belly = col(C.belly ?? C.base);
  const leg = col(C.leg ?? C.base), muzzle = col(C.muzzle ?? C.base), face = col(C.face ?? C.base);
  const tailC = col(C.tail ?? C.base), jaw = col(C.jaw ?? C.belly ?? C.base);
  const earC = col(C.ear ?? C.base), earIn = col(C.earIn ?? C.belly ?? C.base);
  const hi = C.sockHi ?? 0.42, lo = C.sockLo ?? 0.25, bk = C.backAt ?? 0.25, bl = C.bellyAt ?? -0.2;
  return (c) => {
    let o;
    const sy = c.sy;
    switch (c.part) {
      case 'body': case 'neck':
        o = sy > 0 ? mixCol(base, back, sstep(bk, 0.95, sy)) : mixCol(base, belly, sstep(bl, -0.8, sy));
        break;
      case 'leg': {
        o = mixCol(base, leg, sstep(hi, lo, c.ly));
        if (c.inner > 0) o = mixCol(o, belly, c.inner * 0.55 * sstep(lo, hi + 0.1, c.ly));
        break;
      }
      case 'head':
        o = sy > 0 ? mixCol(face, back, sstep(0.5, 1, sy) * 0.6) : mixCol(face, jaw, sstep(-0.3, -0.9, sy));
        o = mixCol(o, muzzle, sstep(C.muzAt ?? 0.74, (C.muzAt ?? 0.74) + 0.18, c.u));
        break;
      case 'tail': o = tailC; break;
      case 'ear': o = c.sy > 0 ? earC : earIn; break;
      default: o = base;
    }
    return mark ? mark(o, c) : o;
  };
}

// ---------------------------------------------------------------------------
// head profiles: [t, halfWidth, top, bottom, (centre y)] in units of head length
// ---------------------------------------------------------------------------
export const HEADS = {
  equid: [[0, .15, .16, .21], [.13, .2, .2, .26], [.3, .195, .2, .25], [.52, .135, .14, .19], [.76, .1, .105, .135], [.93, .1, .09, .12], [1, .065, .05, .075]],
  antelope: [[0, .16, .17, .2], [.14, .215, .21, .24], [.32, .2, .2, .22], [.55, .125, .13, .16], [.78, .085, .09, .115], [.94, .08, .075, .1], [1, .05, .04, .06]],
  bovine: [[0, .2, .2, .24], [.14, .27, .25, .28], [.33, .26, .24, .27], [.56, .18, .17, .21], [.8, .15, .13, .16], [.95, .15, .11, .14], [1, .1, .06, .09]],
  cat: [[0, .3, .29, .3], [.2, .4, .37, .36], [.44, .41, .36, .38], [.64, .3, .25, .33], [.84, .26, .21, .28], [.96, .22, .17, .22], [1, .14, .1, .14]],
  dog: [[0, .23, .22, .24], [.2, .29, .27, .28], [.42, .275, .24, .27], [.6, .15, .13, .2], [.84, .115, .1, .16], [1, .08, .06, .1]],
  bear: [[0, .3, .28, .3], [.2, .37, .33, .33], [.44, .35, .29, .32], [.64, .2, .16, .24], [.86, .155, .12, .19], [1, .1, .07, .12]],
  pig: [[0, .2, .22, .24], [.18, .25, .26, .28], [.4, .22, .22, .25], [.62, .14, .13, .17], [.86, .1, .09, .11], [1, .085, .08, .085]],
};
const EYES = {
  equid: [.33, .5, .034], antelope: [.33, .5, .04], bovine: [.34, .45, .032], cat: [.5, .42, .045], dog: [.44, .45, .04], bear: [.47, .45, .03], pig: [.42, .55, .028],
};
const EARS = {
  equid: { t: .1, y: .8, len: .3, w: .075, out: 18, back: 8, shape: 'leaf' },
  antelope: { t: .1, y: .75, len: .36, w: .1, out: 42, back: 12, shape: 'leaf' },
  bovine: { t: .12, y: .45, len: .32, w: .1, out: 78, back: 10, shape: 'leaf' },
  cat: { t: .2, y: .7, len: .2, w: .11, out: 32, back: 5, shape: 'round' },
  dog: { t: .17, y: .72, len: .3, w: .11, out: 22, back: 0, shape: 'point' },
  bear: { t: .2, y: .72, len: .17, w: .09, out: 35, back: 5, shape: 'round' },
  pig: { t: .12, y: .7, len: .3, w: .11, out: 30, back: 15, shape: 'leaf' },
};

const LEG = {
  hoof: { bone: .03, arm: .055, sh: .125, thigh: .15, gask: .062, knee: .5, hock: .36, fet: .085, foot: 'hoof', fd: .05, ang: 1 },
  cat: { bone: .04, arm: .06, sh: .13, thigh: .15, gask: .068, knee: .34, hock: .27, fet: .055, foot: 'paw', fd: .055, ang: 1 },
  dog: { bone: .03, arm: .045, sh: .11, thigh: .13, gask: .055, knee: .36, hock: .3, fet: .05, foot: 'paw', fd: .05, ang: 1 },
  bear: { bone: .06, arm: .085, sh: .15, thigh: .17, gask: .09, knee: .3, hock: .2, fet: .06, foot: 'paw', fd: .06, ang: .6 },
  pillar: { bone: .08, arm: .1, sh: .16, thigh: .18, gask: .11, knee: .45, hock: .3, fet: .07, foot: 'pad', fd: .07, ang: .35 },
};

function torsoStations(S) {
  if (S.torso) return S.torso;
  const cr = S.croup, dip = S.dip, cb = 1 - S.chest, wc = S.wChest, wb = S.wBelly, wh = S.wHip;
  const wt = S.withers ?? 1;
  return [
    [0.00, cr - 0.14, cr - 0.30, wh * 0.40],
    [0.05, cr - 0.04, Math.min(cr - 0.36, S.tuck + 0.14), wh * 0.80],
    [0.16, cr, S.tuck + 0.04, wh],
    [0.30, lerp(cr, 1, 0.25) - dip * 0.8, S.tuck, lerp(wh, wb, 0.6)],
    [0.45, lerp(cr, 1, 0.5) - dip, lerp(S.tuck, S.belly, 0.7), wb],
    [0.60, lerp(cr, 1, 0.75) - dip * 0.7, S.belly, wb],
    [0.73, lerp(0.985, wt, 0.7), lerp(S.belly, cb, 0.7), lerp(wb, wc, 0.8)],
    [0.84, wt, cb + 0.01, wc],
    [0.94, lerp(0.92, wt, 0.3), cb + 0.08, wc * 0.82],
    [1.00, 0.82, cb + 0.2, wc * 0.45],
  ];
}

function frontLegSt(S, lg) {
  if (lg.st) return lg.st;
  const cb = 1 - S.chest, eY = lg.elbowY ?? (cb + 0.05), kY = lg.kneeY ?? eY * lg.knee, fY = lg.fet, m = lg.m ?? 1, b = lg.bone;
  const sY = lerp(eY, 1, 0.5);
  const st = [
    [-0.04, 0.9, .03, .08, .08],
    [0.02, sY, .068 * m, lg.sh * m, lg.sh * .9 * m],
    [-0.02, eY + 0.02, .062 * m, lg.arm * 1.45, lg.arm * 1.75],
    [0.0, lerp(kY, eY, 0.55), lg.arm * .8, lg.arm, lg.arm],
    [0.012, kY, b * 1.2, b * 1.3, b * 1.15],
    [0.004, lerp(fY, kY, 0.5), b * .85, b * .9, b],
    [0.0, fY, b * 1.1, b * 1.15, b * 1.4],
  ];
  if (lg.foot === 'hoof') st.push([0.015, lg.fd, b, b * 1.1, b * 1.05]);
  if (lg.foot === 'pad') st.push([0.01, 0.0, b * 1.2, b * 1.3, b * 1.2]);
  return st;
}
function hindLegSt(S, lg) {
  if (lg.st) return lg.st;
  const cr = S.croup, stY = lg.stifleY ?? (S.tuck - 0.02), hkY = lg.hock, fY = lg.fet, m = lg.m ?? 1, b = lg.bone, th = lg.thigh * m, k = lg.ang;
  const st = [
    [0.02, cr - 0.1, .03, .1, .1],
    [0.03, lerp(stY, cr, 0.55), .085 * m, th, th * .95],
    [0.06 * k, stY + 0.03, .068 * m, th * .7, th * .85],
    [-0.035 * k, lerp(hkY, stY, 0.5), lg.gask * .78, lg.gask, lg.gask * 1.05],
    [-0.135 * k, hkY, b * 1.2, b * 1.25, b * 1.7],
    [-0.128 * k, lerp(fY, hkY, 0.5), b * .9, b * .95, b * 1.05],
    [-0.12 * k, fY, b * 1.1, b * 1.15, b * 1.4],
  ];
  if (lg.foot === 'hoof') st.push([-0.105 * k, lg.fd, b, b * 1.1, b * 1.05]);
  if (lg.foot === 'pad') st.push([-0.11 * k, 0.0, b * 1.2, b * 1.3, b * 1.2]);
  return st;
}

// foot geometry in local coordinates: ankle at the origin, ground at y = -d, toes towards +x
function hoofGeo(b, d) {
  return limb([[0, 0, 0, b * .95, b, b * .95], [0.3 * d, -0.5 * d, 0, b * 1.1, b * 1.35, b * 1.0], [0.5 * d, -d, 0, b * 1.2, b * 1.6, b * 1.05]], { radial: 8, sub: 2, capBulge: 0 });
}
function pawGeo(r, d, long = 1) {
  const st = [
    [-0.6 * r, -0.42 * d, .85 * r, .48 * d, .56 * d],
    [0.5 * r * long, -0.48 * d, 1.12 * r, .5 * d, .5 * d],
    [1.5 * r * long, -0.6 * d, 1.1 * r, .42 * d, .38 * d],
    [2.15 * r * long, -0.7 * d, .7 * r, .3 * d, .28 * d],
  ];
  return loft(st.map((p) => ({ p: [p[0], p[1], 0], rx: p[2], ry: p[3], ryb: p[4] })), { radial: 10, sub: 2, capBulge: 0.5 });
}

export const STD_POSES = ['stand', 'walk', 'graze', 'alert'];

/**
 * Parametric taxidermy quadruped. See species.js for specs.
 * Returns a Geo in metres (finished).
 */
export function quadruped(S, opts = {}) {
  const { seed, rng, rv } = seeded(opts);
  let pose = opts.pose;
  if (!pose || !(S.poses || STD_POSES).includes(pose)) pose = S.pose || 'stand';
  const lgF = { ...LEG[(S.leg && S.leg.type) || 'hoof'], ...S.leg, ...S.legF };
  const lgH = { ...LEG[(S.leg && S.leg.type) || 'hoof'], ...S.leg, ...S.legH };
  const L = S.L * (1 + rv(0.03));
  const ts = torsoStations(S);
  const tx = (t) => (t - 0.5) * L;
  const T = { st: ts, x: tx, top: (t) => samp(ts, t, 1), bot: (t) => samp(ts, t, 2), w: (t) => samp(ts, t, 3) };
  const cf = S.cfrac ?? 0.52;
  const TG = new Geo(), HG = new Geo(), out = new Geo();
  const coat = S.coat;
  const cc = (part, extra) => {
    const c = { part, H: S.H, pose, ...extra };
    return (u, a, p, sy) => { c.u = u; c.a = a; c.p = p; c.sy = sy; return coat(c); };
  };
  const cb = 1 - S.chest;

  // ---- torso -------------------------------------------------------------
  TG.add('skin', loft(ts.map(([t, top, bot, w, cfi]) => { const yc = bot + (top - bot) * (cfi ?? cf); return { p: [tx(t), yc, 0], rx: w, ry: top - yc, ryb: yc - bot }; }),
    { radial: S.radial || 20, sub: S.sub || 4, color: cc('body'), squareness: S.square || 0, capBulge: 0.5 }));

  // ---- pose --------------------------------------------------------------
  const HD = { type: 'antelope', len: .4, pitch: 35, ...S.head };
  const N = { len: .5, ang: 40, w0: .11, t0: .15, b0: .2, w1: .07, t1: .085, b1: .1, bend: .04, at: .9, taper: 1.5, ...S.neck };
  let nAng = N.ang + rv(6), pitch = HD.pitch + rv(7), yaw = (S.yaw || 0) + rv(26), nBend = N.bend;
  if (opts.yaw != null) yaw = +opts.yaw;
  const B = [tx(N.at), N.y ?? lerp(cb, 1, 0.62)];
  let bodyPitch = 0, hipDrop = 0, splay = 0;
  const xS = tx(S.tS ?? 0.8), xH = tx(S.tH ?? 0.17);
  const stF = frontLegSt(S, lgF), stH = hindLegSt(S, lgH);
  const sY = stF[1][1], hY = stH[1][1];
  if (pose === 'graze' || pose === 'drink') {
    if (pose === 'drink' && S.drinkSplay) {
      splay = S.drinkSplay;
      const drop = sY - Math.sqrt(Math.max(0.01, sY * sY - splay * splay));
      bodyPitch = -Math.asin(clamp(drop / (xS - xH), 0, 0.9)) / D2R;
    }
    const want = HD.len * Math.sin((S.grazePitch ?? 62) * D2R) + 0.04 + (S.grazeLift || 0);
    const bp = bodyPitch * D2R;
    // poll height after body pitch (about the hip): solve for the neck angle
    const by = hY + (B[0] - xH) * Math.sin(bp) + (B[1] - hY) * Math.cos(bp);
    const sinA = clamp((want - by) / N.len, -0.97, 0.5);
    nAng = Math.asin(sinA) / D2R - bodyPitch + rv(3);
    pitch = (S.grazePitch ?? 62) + bodyPitch + rv(4);
    nBend = -Math.abs(N.bend) * 0.5;
    yaw *= 0.4;
  } else if (pose === 'alert') { nAng += S.alertUp ?? 12; pitch -= 8; }
  else if (pose === 'walk') { nAng -= S.walkDrop ?? 4; }
  else if (pose === 'sit') { bodyPitch = S.sitAngle ?? 38; hipDrop = (lgH.thigh * 0.95 + 0.02) - hY; nAng -= bodyPitch * 0.62; pitch += bodyPitch * 0.9; }
  else if (pose === 'upright') { bodyPitch = S.uprightAngle ?? 68; nAng -= bodyPitch * 0.75; pitch += bodyPitch * 0.75; }
  else if (pose === 'lie') { hipDrop = -(Math.min(cb, S.belly, S.tuck) - 0.012); nAng += S.lieNeck ?? 6; }
  const TX = new THREE.Matrix4().makeTranslation(xH, hY + hipDrop, 0)
    .multiply(new THREE.Matrix4().makeRotationZ(bodyPitch * D2R))
    .multiply(new THREE.Matrix4().makeTranslation(-xH, -hY, 0));
  const txp = (x, y, z = 0) => { const v = new THREE.Vector3(x, y, z).applyMatrix4(TX); return [v.x, v.y, v.z]; };

  // ---- neck --------------------------------------------------------------
  const na = nAng * D2R, nd = [Math.cos(na), Math.sin(na)];
  const P = [B[0] + nd[0] * N.len, B[1] + nd[1] * N.len];
  const C = [(B[0] + P[0]) / 2 - nd[1] * nBend * N.len, (B[1] + P[1]) / 2 + nd[0] * nBend * N.len];
  const yawN = yaw * 0.45 * D2R;
  const neckAt = (s) => {
    let x, y, dx, dy;
    if (s < 0) { dx = 2 * (C[0] - B[0]); dy = 2 * (C[1] - B[1]); x = B[0] + dx * s; y = B[1] + dy * s; }
    else {
      const q = 1 - s;
      x = q * q * B[0] + 2 * q * s * C[0] + s * s * P[0]; y = q * q * B[1] + 2 * q * s * C[1] + s * s * P[1];
      dx = 2 * q * (C[0] - B[0]) + 2 * s * (P[0] - C[0]); dy = 2 * q * (C[1] - B[1]) + 2 * s * (P[1] - C[1]);
    }
    const tl = Math.hypot(dx, dy) || 1; dx /= tl; dy /= tl;
    const f = Math.pow(clamp(1 - s), N.taper);
    const ph = yawN * Math.pow(clamp(s), 1.4), c = Math.cos(ph), sn = Math.sin(ph), rx0 = x - B[0];
    return {
      p: [B[0] + rx0 * c, y, -rx0 * sn], n: [-dy * c, dx, dy * sn], t: [dx * c, dy, -dx * sn],
      rx: lerp(N.w1, N.w0, f), ry: lerp(N.t1, N.t0, f), ryb: lerp(N.b1, N.b0, f),
    };
  };
  const NS = N.stations || [-0.2, 0.08, 0.34, 0.62, 0.86, 1.0];
  const ncx = { part: 'neck', H: S.H, pose };
  const neckCol = (u, a, p, sy) => {
    const f = u * (NS.length - 1), i = Math.min(NS.length - 2, Math.floor(f));
    ncx.s = lerp(NS[i], NS[i + 1], f - i); ncx.u = u; ncx.a = a; ncx.p = p; ncx.sy = sy;
    return coat(ncx);
  };
  if (N.len > 0.02) {
    TG.add('skin', loft(NS.map((s) => { const q = neckAt(s); const k = s < 0 ? 0.9 : 1; return { p: q.p, rx: q.rx * k, ry: q.ry * k, ryb: q.ryb * k }; }),
      { radial: N.radial || 14, sub: N.sub || 3, color: neckCol, capBulge: 0.3 }));
  }
  const poll = neckAt(1).p;

  // ---- head (local coords: poll at origin, +x to the nose) ------------------
  const hl = HD.len * (1 + rv(0.03)), wm = HD.w ?? 1, dm = HD.d ?? 1;
  const hs = (HD.st || HEADS[HD.type]).map(([t, w, top, bot, yc]) => [t, w * wm * hl, top * dm * hl, bot * dm * hl, (yc || 0) * hl]);
  const hw = (t) => samp(hs, t, 1), htop = (t) => samp(hs, t, 2) + samp(hs, t, 4), hbot = (t) => samp(hs, t, 3) - samp(hs, t, 4);
  /** point on the head surface at station t, angle a (0 = +z side, 90 = top) */
  const hp = (t, aDeg, k = 1, s = 1) => {
    const a = aDeg * D2R, sa = Math.sin(a);
    return [t * hl, samp(hs, t, 4) + (sa >= 0 ? samp(hs, t, 2) : samp(hs, t, 3)) * sa * k, s * hw(t) * Math.cos(a) * k];
  };
  HG.add('skin', loft(hs.map(([t, w, top, bot, yc]) => ({ p: [t * hl, yc, 0], rx: w, ry: top, ryb: bot })),
    { radial: HD.radial || 14, sub: HD.sub || 3, color: cc('head', { hl }), capBulge: 0.45, squareness: HD.square || 0 }));
  const EY = HD.eye === null ? null : (HD.eye || EYES[HD.type] || EYES.antelope);
  if (EY) for (const s of [-1, 1]) {
    const er = EY[2] * hl * (HD.eyeScale || 1);
    const p = hp(EY[0], Math.asin(EY[1]) / D2R, 0.93, s);
    HG.add('gloss', ellipsoid(p, [er * 1.15, er, er * 0.8], { seg: 8, rings: 6 }), null, HD.eyeCol ?? 0x140c06);
  }
  if (HD.nose) {
    const nr = (HD.noseR || 0.07) * hl;
    HG.add('gloss', ellipsoid([hl - nr * 0.35, htop(0.97) * 0.35, 0], [nr * 0.8, nr * 0.75, nr * 1.15], { seg: 8, rings: 6 }), null, HD.noseCol ?? 0x18120f);
  } else if (HD.nostrils !== false) {
    for (const s of [-1, 1]) HG.add('flat', ellipsoid([hl * 0.975, htop(0.95) * 0.1, s * hw(0.95) * 0.55], [hl * 0.022, hl * 0.014, hl * 0.014], { seg: 6, rings: 4 }), null, 0x0c0a09);
  }
  const ER = S.ears === null ? null : { ...(EARS[HD.type] || EARS.antelope), ...S.ears };
  if (ER) for (const s of [-1, 1]) {
    const o = (ER.out + rv(8)) * D2R, bk = (ER.back + rv(8)) * D2R, fa = (ER.faceAng ?? 55) * D2R;
    const base = hp(ER.t, Math.asin(ER.y) / D2R, 0.9, s);
    leaf(HG, {
      base, axis: [-Math.sin(bk) * Math.cos(o), Math.cos(o) * Math.cos(bk), s * Math.sin(o)], face: [Math.cos(fa), 0.05, s * Math.sin(fa)],
      len: ER.len * hl, w: ER.w * hl, cup: ER.cup ?? 0.45, bend: ER.bend ?? 0, shape: ER.shape,
      cIn: ER.cIn ?? coat({ part: 'ear', sy: 0, u: 0, p: base, H: S.H }), cOut: ER.cOut ?? coat({ part: 'ear', sy: 1, u: 0, p: base, H: S.H }), nu: ER.nu || 4, nv: ER.nv || 5,
    });
  }
  const MH = new THREE.Matrix4().makeTranslation(poll[0], poll[1], poll[2])
    .multiply(new THREE.Matrix4().makeRotationY(yaw * D2R))
    .multiply(new THREE.Matrix4().makeRotationZ(-pitch * D2R));

  // ---- crest / mane along the neck ----------------------------------------
  if (S.crest) {
    const K = S.crest, s0 = K.s0 ?? 0.0, s1 = K.s1 ?? 1.0, n = K.n || 8;
    const st = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n, s = lerp(s0, s1, f), q = neckAt(s);
      const h = K.h * (K.taper ? Math.sin(Math.PI * clamp(0.12 + 0.88 * f)) ** 0.5 : (f === 0 || f === 1 ? 0.5 : 1));
      const off = q.ry * (s < 0 ? 0.9 : 1) + h * 0.25;
      st.push({ p: [q.p[0] + q.n[0] * off, q.p[1] + q.n[1] * off, q.p[2] + q.n[2] * off], rx: K.w, ry: h, ryb: h * 0.6 });
    }
    const cfn = typeof K.col === 'function' ? K.col : null, cc0 = cfn ? null : col(K.col);
    TG.add('flat', loft(st, { radial: 6, sub: K.sub || 2, color: cfn ? (u, a, p, sy) => cfn(lerp(s0, s1, u), p, sy) : () => cc0, capBulge: 0.2 }));
  }

  // ---- species extras -----------------------------------------------------
  const hp0 = HD.pitch * D2R;
  /** head-local direction for a world direction given as elevation (deg above horizontal, measured towards the back), outward angle, side */
  const ldir = (elev, outDeg, s) => { const e = elev * D2R - hp0, o = outDeg * D2R; return [-Math.cos(e) * Math.cos(o), Math.sin(e) * Math.cos(o), s * Math.sin(o)]; };
  /** world (standing) -> head-local for a vector in the sagittal plane, using the posed pitch */
  const w2h = (x, y, z = 0) => { const a = pitch * D2R; return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]; };
  const ctx = { S, TG, HG, out, T, tx, hl, hp, hw, htop, hbot, neckAt, B, cb, xS, xH, sY, hY, pose, rng, rv, seed, opts, coat, cc, TX, txp, MH, lgF, lgH, yaw, pitch, ldir, w2h, L };
  if (S.extras) S.extras(ctx);

  // ---- legs ---------------------------------------------------------------
  const footCol = S.hoofCol ?? 0x1c1815;
  const legCol = (s, which) => cc('leg', { s, which });
  const addFoot = (lg, p, ang, s, which, colr) => {
    const m = new THREE.Matrix4().makeTranslation(p[0], p[1], p[2]).multiply(new THREE.Matrix4().makeRotationZ(ang));
    const b = lg.bone * (lg.footSize || 1);
    if (lg.foot === 'hoof') out.add('bone', hoofGeo(b * 1.12, lg.fd), m, footCol);
    else if (lg.foot === 'paw') {
      out.add('skin', pawGeo(b * 1.45, lg.fet, lg.pawLong || 1), m, colr);
      if (lg.claws) for (let i = -1.5; i <= 1.5; i++) {
        const r = b * 1.45;
        out.add('bone', spike([2.0 * r * (lg.pawLong || 1) - Math.abs(i) * r * 0.25, -lg.fet * 0.72, i * r * 0.45], [2.0 * r * (lg.pawLong || 1) + lg.claws - Math.abs(i) * r * 0.25, -lg.fet * 0.98, i * r * 0.5], r * 0.16, { seg: 5 }), m, lg.clawCol ?? 0x2a2420);
      }
    }
  };
  const padNails = (lg, p, s) => {
    if (!lg.nails) return;
    const r = lg.bone * 1.3;
    for (const a of [-50, -17, 17, 50]) {
      const c = Math.cos(a * D2R), sn = Math.sin(a * D2R);
      out.add('bone', ellipsoid([p[0] + r * c * 0.98, 0.028, p[2] + r * 0.92 * sn], [r * 0.14, 0.03, r * 0.24], { seg: 6, rings: 5, rot: [0, -a * D2R, 0] }), null, lg.nailCol ?? 0xcfc4a8);
    }
  };
  /** standing leg: stations sheared to a foot offset, with optional joint flexion */
  const standLeg = (st, lg, which, s, o) => {
    const front = which === 'f';
    const ax = front ? xS : xH, wTop = front ? S.wChest : S.wHip;
    const zTop = wTop * (lg.zTop ?? 0.66), zFoot = (lg.stance ?? wTop * 0.62) + (o.dz || 0);
    const yPiv = st[1][1];
    // anchor (shoulder / hip mass) after the body transform
    const a0 = txp(ax + st[1][0], yPiv, 0);
    const yScale = a0[1] / yPiv, xOff = a0[0] - (ax + st[1][0]);
    const pts = st.map((q, i) => {
      const w = clamp(1 - q[1] / yPiv);
      let x = ax + q[0] + xOff, y = q[1] * yScale, z = lerp(zTop, zFoot, o.dz ? w : sstep(0.1, 0.9, w));
      if (i === 0) { // buried top follows the body
        const t0 = txp(ax + q[0], q[1], 0); x = t0[0]; y = t0[1]; z = zTop * 0.5;
      }
      return [x, y, s * z, q[2], q[3], q[4], w];
    });
    let tot = 0;
    for (const [idx, deg] of (o.bend || [])) {
      const a = deg * D2R, c = Math.cos(a), sn = Math.sin(a), px = pts[idx][0], py = pts[idx][1];
      for (let i = idx + 1; i < pts.length; i++) { const rx = pts[i][0] - px, ry = pts[i][1] - py; pts[i][0] = px + rx * c - ry * sn; pts[i][1] = py + rx * sn + ry * c; }
      tot += a;
    }
    for (const p of pts) p[0] += (o.dx || 0) * p[6];
    const c = { part: 'leg', H: S.H, s, which, pose };
    out.add('skin', limb(pts, { radial: lg.radial || 10, sub: lg.sub || 3, capEnd: lg.foot === 'pad' ? true : false, capBulge: lg.foot === 'pad' ? 0 : 0.4, squareness: lg.square || 0,
      color: (u, a, p, sy) => { c.u = u; c.a = a; c.p = p; c.sy = sy; c.inner = -s * Math.cos(a); c.ly = p[1]; return coat(c); } }));
    const last = pts[pts.length - 1];
    const fc = coat({ part: 'leg', H: S.H, s, which, u: 1, a: 0, sy: 1, inner: 0, ly: 0.01, p: [last[0], 0.01, last[2]], foot: true });
    addFoot(lg, last, tot, s, which, fc);
    if (lg.foot === 'pad') padNails(lg, last, s);
  };

  const stance = { f1: { dx: 0.02 }, f0: { dx: -0.02 }, h1: { dx: -0.03 }, h0: { dx: 0.03 } };
  if (seed) for (const k in stance) stance[k].dx += rv(0.05);
  if (pose === 'walk') {
    const w = S.stride ?? 0.16;
    stance.f1.dx = w; stance.h1.dx = -w; stance.h0.dx = w * 0.8;
    if (S.walkLift === false) stance.f0.dx = -w * 0.85;
    else { stance.f0.dx = -w * 0.35; stance.f0.bend = [[2, 24], [4, -52]]; if (lgF.foot === 'hoof') stance.f0.bend.push([6, -25]); }
  }
  if (splay) { stance.f1.dz = splay; stance.f0.dz = splay; stance.f1.dx = 0.03; stance.f0.dx = 0.0; }

  const zFt = S.wChest * (lgF.zTop ?? 0.66), zHt = S.wHip * (lgH.zTop ?? 0.66);
  const lieFront = (s) => {
    const A = txp(xS + 0.02, sY), a = lgF.arm, b = lgF.bone, m = lgF.m ?? 1;
    const fwd = S.lieReach ?? 0.34;
    const c = { part: 'leg', H: S.H, s, which: 'f', pose };
    const cf1 = (k0, k1) => (u, ang, p, sy) => { c.u = u; c.a = ang; c.p = p; c.sy = sy; c.inner = -s * Math.cos(ang); c.ly = lerp(k0, k1, u); return coat(c); };
    out.add('skin', limb([[A[0], A[1], s * zFt, .075 * m, lgF.sh * m, lgF.sh * m], [A[0] - 0.05, lerp(A[1], a * 1.3, 0.6), s * (zFt + 0.02), .07 * m, a * 1.7, a * 1.9], [A[0] - 0.08, a * 1.25, s * (zFt + 0.03), a * 1.1, a * 1.3, a * 1.4]], { color: cf1(0.75, 0.5) }));
    out.add('skin', limb([[A[0] - 0.1, a * 1.02, s * (zFt + 0.03), a * 0.95, a, a], [A[0] + fwd * 0.4, a * 0.9, s * (zFt + 0.02), a * 0.85, a * 0.88, a * 0.88], [A[0] + fwd * 0.85, b * 1.25, s * (zFt + 0.015), b * 1.2, b * 1.15, b * 1.15], [A[0] + fwd, lgF.fet, s * (zFt + 0.015), b * 1.1, b * 1.05, b * 1.0]], { up: [0, 1, 0], color: cf1(0.5, 0.05), capEnd: false }));
    addFoot(lgF, [A[0] + fwd, lgF.fet, s * (zFt + 0.015)], 0, s, 'f', coat({ part: 'leg', H: S.H, s, which: 'f', u: 1, a: 0, sy: 1, inner: 0, ly: 0.01, p: [0, 0.01, 0], foot: true }));
  };
  const foldHind = (s) => {
    const A = txp(xH + 0.0, hY), th = lgH.thigh * (lgH.m ?? 1), b = lgH.bone, g = lgH.gask;
    const c = { part: 'leg', H: S.H, s, which: 'h', pose };
    const cf1 = (k0, k1) => (u, ang, p, sy) => { c.u = u; c.a = ang; c.p = p; c.sy = sy; c.inner = -s * Math.cos(ang); c.ly = lerp(k0, k1, u); return coat(c); };
    const kneeY = Math.max(g * 1.2, A[1] * 0.55);
    out.add('skin', limb([[A[0] - 0.07, A[1] + 0.01, s * (zHt - 0.01), .07, th * 0.8, th * 0.8], [A[0] + 0.06, lerp(A[1], kneeY, 0.45), s * (zHt + 0.03), .085, th * 0.95, th * 0.9], [A[0] + 0.2, kneeY, s * (zHt + 0.055), .07, g * 1.5, g * 1.3], [A[0] + 0.28, g * 1.1, s * (zHt + 0.06), g * 0.9, g, g]], { up: [0, 1, 0], color: cf1(0.8, 0.45) }));
    out.add('skin', limb([[A[0] - 0.06, b * 1.5, s * (zHt + 0.09), b * 1.2, b * 1.4, b * 1.4], [A[0] + 0.1, b * 1.2, s * (zHt + 0.1), b * 1.1, b * 1.15, b * 1.15], [A[0] + 0.24, lgH.fet, s * (zHt + 0.1), b * 1.1, b * 1.05, b]], { up: [0, 1, 0], color: cf1(0.3, 0.05), capEnd: false }));
    addFoot(lgH, [A[0] + 0.24, lgH.fet, s * (zHt + 0.1)], 0, s, 'h', coat({ part: 'leg', H: S.H, s, which: 'h', u: 1, a: 0, sy: 1, inner: 0, ly: 0.01, p: [0, 0.01, 0], foot: true }));
  };
  /** free-hanging fore limb (upright bear): standing stations carried by the body, then swung about the shoulder */
  const armLeg = (s, swing) => {
    const st = stF, yPiv = st[1][1];
    const piv = txp(xS + st[1][0], yPiv);
    const a = (bodyPitch + swing) * D2R, cs = Math.cos(a), sn = Math.sin(a);
    const pts = st.map((q, i) => {
      if (i === 0) { const t0 = txp(xS + q[0], q[1]); return [t0[0], t0[1], s * zFt * 0.55, q[2], q[3], q[4]]; }
      const rx = q[0] - st[1][0], ry = q[1] - yPiv;
      return [piv[0] + rx * cs - ry * sn, piv[1] + rx * sn + ry * cs, s * (zFt + 0.03 * clamp(-ry * 3)), q[2], q[3], q[4]];
    });
    const c = { part: 'leg', H: S.H, s, which: 'f', pose };
    out.add('skin', limb(pts, { capEnd: false, color: (u, ang, p, sy) => { c.u = u; c.a = ang; c.p = p; c.sy = sy; c.inner = -s * Math.cos(ang); c.ly = lerp(0.8, 0.05, u); return coat(c); } }));
    addFoot(lgF, pts[pts.length - 1], a, s, 'f', coat({ part: 'leg', H: S.H, s, which: 'f', u: 1, a: 0, sy: 1, inner: 0, ly: 0.01, p: [0, 0.01, 0], foot: true }));
  };

  if (S.legs !== false) {
    for (const s of [1, -1]) {
      const k = s > 0 ? '1' : '0';
      if (pose === 'lie') { lieFront(s); foldHind(s); }
      else if (pose === 'sit') { standLeg(stF, lgF, 'f', s, { dx: -0.03 + (s > 0 ? 0.02 : -0.02) }); foldHind(s); }
      else if (pose === 'upright') { armLeg(s, (S.armSwing ?? -52) + (s > 0 ? 8 : -6)); standLeg(stH, lgH, 'h', s, { dx: s > 0 ? 0.05 : -0.04, dz: 0.03 }); }
      else { standLeg(stF, lgF, 'f', s, stance['f' + k]); standLeg(stH, lgH, 'h', s, stance['h' + k]); }
    }
  }

  // ---- tail (world coords) --------------------------------------------------
  if (S.tail) {
    const TL = { len: .45, r: .022, a0: 55, a1: 86, curl: 0, type: 'plain', at: 0.012, dy: -0.07, ...S.tail };
    const tb = txp(tx(TL.at), S.croup + TL.dy);
    const n = TL.n || 7, pts = [], rad = [];
    const sway = rv(0.12) + (TL.sway || 0);
    const onGround = pose === 'lie' || pose === 'sit';
    let x = tb[0] + 0.03, y = tb[1], z = 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([x, Math.max(y, TL.r * 0.9), z]);
      let r = TL.r * lerp(1, TL.tip ?? 0.55, t);
      if (TL.type === 'bushy') r = TL.r * (0.75 + 1.5 * Math.sin(Math.PI * Math.pow(t, 0.8)) ** 1 * (TL.bush ?? 1)) * (t > 0.92 ? 0.6 : 1);
      rad.push(r);
      let ang = (lerp(TL.a0, TL.a1, sstep(0, 0.55, t)) - TL.curl * sstep(0.5, 1, t)) * D2R;
      const seg = TL.len / n;
      if (onGround && y - seg * Math.sin(ang) < TL.r) ang = 0.02;
      const gz = onGround ? 0.55 * sstep(0.2, 1, t) : sway * t;
      x -= seg * Math.cos(ang) * Math.cos(gz * 1.2); y -= seg * Math.sin(ang); z += seg * Math.sin(gz * 1.2) * (onGround ? 1 : 1);
    }
    const tc = cc('tail');
    out.add('skin', loft(pts.map((p, i) => ({ p, rx: rad[i], ry: rad[i] })), { radial: TL.radial || 7, sub: 2, color: tc, capBulge: 0.5 }));
    if (TL.type === 'tuft' || TL.type === 'horse') {
      const e = pts[n], e0 = pts[n - 1];
      const d = [e[0] - e0[0], e[1] - e0[1], e[2] - e0[2]], dl = Math.hypot(d[0], d[1], d[2]) || 1;
      const tl = TL.tuftLen ?? 0.14, tr = TL.tuftR ?? 0.035;
      const q = (k) => [e[0] + d[0] / dl * tl * k, Math.max(e[1] + d[1] / dl * tl * k, tr * 0.5), e[2] + d[2] / dl * tl * k];
      out.add('flat', loft([{ p: q(-0.25), rx: tr * 0.45, ry: tr * 0.45 }, { p: q(0.2), rx: tr, ry: tr }, { p: q(0.6), rx: tr * 0.9, ry: tr * 0.9 }, { p: q(1), rx: tr * 0.25, ry: tr * 0.25 }], { radial: 7, sub: 2 }), null, TL.tuftCol ?? 0x15110e);
    }
  }

  // ---- assemble -----------------------------------------------------------
  out.addGeo(TG, TX);
  out.addGeo(HG, new THREE.Matrix4().multiplyMatrices(TX, MH));
  return finish(out, S.H * (opts.scale || 1) * (1 + rv(0.04)));
}
