// Species specs for the parametric quadruped generator (see core.js). All lengths in H units (shoulder height = 1).
import {
  THREE, col, mixCol, shade, loft, ellipsoid, D2R, lerp, clamp, sstep, hash, noise3, fbm, worley,
  grid, leaf, curve, horn, stdCoat, STD_POSES, shag,
} from './core.js';

export const Q = {}; // name -> spec | (opts) => spec
export const frac = (x) => x - Math.floor(x);
/** 0..1 darkness of a stripe pattern with given phase (1 period per unit), duty = dark fraction. */
export const band = (ph, duty = 0.5, soft = 0.12) => { const tri = Math.abs(frac(ph) - 0.5) * 2; return sstep(duty + soft, duty - soft, tri); };
/** n thin vertical stripes between x0 and x1 (half width hw); returns 0..1 */
export const vstripes = (x, y, n, x0, x1, hw, wob = 0.012) => {
  if (x < x0 - hw * 2 || x > x1 + hw * 2) return 0;
  const xx = x + wob * Math.sin(y * 23 + x * 9);
  const ph = (xx - x0) / (x1 - x0) * (n - 1);
  const d = Math.abs(ph - Math.round(ph)) * (x1 - x0) / (n - 1);
  return sstep(hw * 1.5, hw * 0.5, d);
};
export const ext = (a, b) => {
  const o = { ...a, ...b };
  for (const k of ['leg', 'legF', 'legH', 'neck', 'head', 'ears', 'tail', 'crest']) if (a[k] && b[k] && typeof a[k] === 'object' && typeof b[k] === 'object') o[k] = { ...a[k], ...b[k] };
  return o;
};

// ===========================================================================
// shared add-ons
// ===========================================================================
/** Pair of horns. fn(t, s) -> [x,y,z] in head coords (H units). */
export function horns(c, fn, r0, r1, o = {}) {
  for (const s of [-1, 1]) c.HG.add('bone', horn(curve((t) => fn(t, s), o.n || 12), r0, r1, o), null, o.col ?? 0x2a2622);
}
/** straight / gently curved horns from the head top: world elevation `elev` (deg, backwards), spread `out`, length len, sweep = backward curl */
export function simpleHorns(c, o) {
  const { hp, ldir } = c;
  horns(c, (t, s) => {
    const b = hp(o.t ?? 0.2, o.a ?? 68, 0.92, s);
    const d = ldir(o.elev, o.out ?? 8, s), d2 = ldir(o.elev - (o.sweep || 0), (o.out ?? 8) + (o.flare || 0), s);
    const k = t * t;
    return [b[0] + o.len * (d[0] * t + (d2[0] - d[0]) * k * 0.5), b[1] + o.len * (d[1] * t + (d2[1] - d[1]) * k * 0.5), b[2] + o.len * (d[2] * t + (d2[2] - d[2]) * k * 0.5)];
  }, o.r0, o.r1 ?? 0.003, o);
}
/** spiral horns (kudu, eland, bongo, nyala): helix of radius rad about an axis */
export function spiralHorns(c, o) {
  const { hp, ldir } = c;
  horns(c, (t, s) => {
    const b = hp(o.t ?? 0.2, o.a ?? 68, 0.92, s);
    const d = ldir(o.elev, o.out ?? 18, s);
    // two unit vectors perpendicular to d
    let e1 = [0, 0, 1], dot = d[2];
    e1 = [e1[0] - d[0] * dot, e1[1] - d[1] * dot, e1[2] - d[2] * dot];
    const l1 = Math.hypot(...e1); e1 = e1.map((v) => v / l1);
    const e2 = [d[1] * e1[2] - d[2] * e1[1], d[2] * e1[0] - d[0] * e1[2], d[0] * e1[1] - d[1] * e1[0]];
    const ph = t * o.turns * 2 * Math.PI * s + (o.phase || 0) * s, r = o.rad * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.35 * t) + o.rad * 0.25 * t;
    const c1 = Math.cos(ph) - 1 * (1 - t), s1 = Math.sin(ph);
    return [b[0] + d[0] * o.len * t + r * (e1[0] * c1 * s + e2[0] * s1), b[1] + d[1] * o.len * t + r * (e1[1] * c1 * s + e2[1] * s1), b[2] + d[2] * o.len * t + r * (e1[2] * c1 * s + e2[2] * s1)];
  }, o.r0, o.r1 ?? 0.004, { n: o.n || 28, ...o });
}
/** ridge of hair along the spine (TG coords) from torso t0..t1 */
export function backCrest(c, t0, t1, h, w, colr, n = 8) {
  const st = [];
  for (let i = 0; i <= n; i++) { const t = lerp(t0, t1, i / n); const k = Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * i / n)), 0.5); st.push({ p: [c.tx(t), c.T.top(t) - h * 0.2, 0], rx: w, ry: h * 0.9 * k + h * 0.2, ryb: h * 0.3 }); }
  const cfn = typeof colr === 'function' ? colr : null, c0 = cfn ? null : col(colr);
  c.TG.add('flat', loft(st, { radial: 6, sub: 2, capBulge: 0.2, color: cfn ? (u, a, p) => cfn(p) : () => c0 }));
}
/** hanging fringe / dewlap under the neck: depth d[i] at neck params ss[i] */
export function dewlap(c, ss, d, w, colr, mat = 'skin') {
  const st = ss.map((s, i) => { const q = c.neckAt(s); const off = q.ryb + d[i] * 0.42; return { p: [q.p[0] - q.n[0] * off, q.p[1] - q.n[1] * off, q.p[2] - q.n[2] * off], rx: w * (0.6 + 0.4 * Math.min(1, d[i] / 0.08)), ry: d[i] * 0.6, ryb: d[i] * 0.6 }; });
  const cfn = typeof colr === 'function' ? colr : null, c0 = cfn ? null : col(colr);
  c.TG.add(mat, loft(st, { radial: 8, sub: 3, capBulge: 0.3, color: cfn ? (u, a, p, sy) => cfn(u, p, sy) : () => c0 }));
}
/** lump (hump, boss) in TG coords */
export function lump(G, p, r, colr, mat = 'skin', rot) { G.add(mat, ellipsoid(p, r, { seg: 12, rings: 8, rot }), null, colr); }

// ===========================================================================
// ZEBRA
// ===========================================================================
{
  const W = col(0xe6e0d0), K = col(0x1d1a18);
  const bodyPhase = (x, y) => {
    const m = 1.5 * sstep(-0.08, -0.42, x);
    let q = x + m * (y - 1.02) * 0.9;
    if (q < -0.14) q = -0.14 + (q + 0.14) * 0.6;
    return q * 10.5 + 0.3;
  };
  const coat = (c) => {
    const p = c.p; let d;
    switch (c.part) {
      case 'body': d = band(bodyPhase(p[0], p[1]), 0.48); if (c.sy < -0.8) d *= sstep(-0.99, -0.8, c.sy); break;
      case 'neck': d = band(c.s * 6.6 + 0.15, 0.5); break;
      case 'head': d = Math.max(band(c.u * 9 + 0.5, 0.5) * sstep(0.74, 0.6, c.u), sstep(0.76, 0.88, c.u)); break;
      case 'leg': {
        const up = sstep(0.7, 0.84, c.ly);
        d = lerp(band(c.ly * 13.5, 0.5), band(bodyPhase(p[0], p[1]), 0.48), up);
        if (c.ly < 0.07) d = Math.max(d, sstep(0.07, 0.04, c.ly));
        break;
      }
      case 'tail': d = c.u > 0.6 ? 1 : band(c.u * 9, 0.5); break;
      case 'ear': return c.sy > 0 ? mixCol(W, K, 0.75) : W;
      default: d = 0;
    }
    return mixCol(W, K, d);
  };
  Q.zebra = {
    H: 1.3, L: 1.1, croup: 1.0, dip: 0.035, chest: 0.45, belly: 0.47, tuck: 0.54, wChest: 0.17, wBelly: 0.225, wHip: 0.2,
    radial: 36, sub: 7,
    leg: { type: 'hoof', bone: 0.033, arm: 0.064, gask: 0.07, thigh: 0.16, sub: 5, m: 1.05 },
    neck: { len: 0.45, ang: 40, w0: 0.125, t0: 0.19, b0: 0.21, w1: 0.09, t1: 0.125, b1: 0.135, bend: 0.035, sub: 5 },
    head: { type: 'equid', len: 0.44, pitch: 50, sub: 4 },
    ears: { len: 0.3, w: 0.085, out: 20, shape: 'leaf' },
    crest: { s0: -0.1, s1: 1.02, h: 0.05, w: 0.016, n: 10, sub: 3, col: (s) => mixCol(W, K, band(s * 6.6 + 0.15, 0.5)) },
    tail: { len: 0.4, r: 0.022, a0: 65, a1: 88, type: 'tuft', tuftLen: 0.2, tuftR: 0.04 },
    coat,
  };
}

// ===========================================================================
// BIG CATS
// ===========================================================================
export const catBase = {
  H: 1.0, L: 1.25, croup: 0.98, dip: 0.02, chest: 0.5, belly: 0.52, tuck: 0.59, wChest: 0.17, wBelly: 0.19, wHip: 0.17,
  leg: { type: 'cat', bone: 0.054, arm: 0.084, gask: 0.085, thigh: 0.18, m: 1.15 },
  neck: { len: 0.3, ang: 22, w0: 0.135, t0: 0.17, b0: 0.2, w1: 0.115, t1: 0.125, b1: 0.135, bend: 0.03 },
  head: { type: 'cat', len: 0.4, pitch: 12, nose: true, noseCol: 0x3a2a26, noseR: 0.08, eyeCol: 0x4a3410 },
  ears: { len: 0.2, w: 0.1 },
  tail: { len: 0.82, r: 0.026, a0: 60, a1: 86, curl: 55, tip: 0.6 },
  poses: ['stand', 'walk', 'lie', 'sit', 'alert'],
};
{
  const C = { base: 0xb8915a, back: 0xa67f4a, belly: 0xd9c6a0, leg: 0xbd9860, muzzle: 0xdccdb2, face: 0xb8915a, jaw: 0xe0d2b6, tail: 0xb08a55, ear: 0x6a4a2a, earIn: 0xcdb590, sockHi: 0.3, sockLo: 0.1 };
  const coat = stdCoat(C);
  const base = ext(catBase, { H: 1.12, L: 1.18, wBelly: 0.2, chest: 0.52, belly: 0.5, head: { len: 0.42 }, tail: { type: 'tuft', tuftLen: 0.11, tuftR: 0.04, tuftCol: 0x2a1c12 }, coat });
  const maneC = (x, y, z) => mixCol(0x8c5f2e, 0x33221a, clamp(0.25 + 1.6 * (0.15 - y)) * 0.9 + 0.1 * noise3(x * 30, y * 30, z * 30));
  Q.lion = {
    ...base,
    extras(c) {
      const { TG, HG, hl, neckAt } = c;
      const ss = [-0.95, -0.55, -0.1, 0.3, 0.65, 0.95];
      const k = [0.5, 1.0, 1.15, 1.12, 1.02, 0.8];
      const low = c.pose === 'lie' ? 0.5 : 1;
      const st = ss.map((s, i) => { const q = neckAt(s); return { p: q.p, rx: (q.rx * 1.25 + 0.05) * k[i], ry: (q.ry * 1.15 + 0.045) * k[i], ryb: (q.ryb * 1.3 + 0.11 * low) * k[i] }; });
      const y0 = neckAt(0.3).p[1];
      TG.add('flat', shag(loft(st, { radial: 18, sub: 4, capBulge: 0.6, color: (u, a, p) => maneC(p[0], (p[1] - y0) * 0.9, p[2]) }), 0.028, 13));
      const rf = [[-0.25, .5, .46, .6], [-0.02, .68, .57, .8], [0.18, .66, .53, .82], [0.33, .52, .43, .62], [0.4, .38, .3, .4]];
      HG.add('flat', shag(loft(rf.map(([t, w, top, bot]) => ({ p: [t * hl, 0, 0], rx: w * hl, ry: top * hl, ryb: bot * hl })), { radial: 18, sub: 4, capBulge: 0.3, color: (u, a, p) => maneC(p[0], p[1] * 0.8 - 0.02 + (u > 0.6 ? 0.12 * (u - 0.6) / 0.4 : 0), p[2]) }), 0.022, 15));
    },
  };
  Q.lioness = ext(base, { H: 0.98, L: 1.28, neck: { w0: 0.125, w1: 0.105, t1: 0.115 }, head: { len: 0.37, w: 0.95 }, leg: { bone: 0.048, arm: 0.074 } });
}

// ===========================================================================
// GIRAFFE
// ===========================================================================
{
  const cream = col(0xe6d6ae), brown = col(0x8a5226), brown2 = col(0x6e3d1c);
  const patch = (p, sc = 8.6) => {
    const w = worley(p[0] * sc + 3.1, p[1] * sc + 1.7, p[2] * sc * 0.9 + 5.3);
    return [sstep(0.04, 0.24, w[1] - w[0]), w[2]];
  };
  const coat = (c) => {
    const p = c.p;
    if (c.part === 'ear') return c.sy > 0 ? col(0xd2c19a) : col(0xefe6d0);
    if (c.part === 'tail') return mixCol(cream, brown, 0.5);
    if (c.part === 'head') {
      const [k, id] = patch(p, 22);
      let o = mixCol(cream, mixCol(brown, brown2, id), k * sstep(0.55, 0.3, c.u) * 0.85);
      return mixCol(o, 0x6b5a48, sstep(0.86, 0.98, c.u) * 0.7);
    }
    const [k, id] = patch(p);
    let amt = k;
    if (c.part === 'leg') amt *= sstep(0.2, 0.42, c.ly);
    if (c.part === 'body' && c.sy < -0.7) amt *= sstep(-0.98, -0.7, c.sy) * 0.6 + 0.4;
    return mixCol(cream, mixCol(brown, brown2, id), amt);
  };
  Q.giraffe = {
    H: 3.15, L: 0.64, croup: 0.83, dip: 0, chest: 0.36, belly: 0.63, tuck: 0.67, wChest: 0.105, wBelly: 0.13, wHip: 0.11, withers: 1.0,
    radial: 36, sub: 8, tS: 0.78,
    leg: { type: 'hoof', bone: 0.022, arm: 0.038, sh: 0.1, thigh: 0.115, gask: 0.045, sub: 6, m: 0.8, fet: 0.06, fd: 0.035, footSize: 1.25, hock: 0.38, radial: 12 },
    legF: { knee: 0.52 },
    neck: { len: 0.74, ang: 62, w0: 0.1, t0: 0.15, b0: 0.17, w1: 0.042, t1: 0.05, b1: 0.055, bend: -0.03, taper: 1.3, sub: 10, radial: 18, y: 0.84, at: 0.9, stations: [-0.15, 0.05, 0.25, 0.45, 0.65, 0.85, 1.0] },
    head: { type: 'antelope', len: 0.2, pitch: 22, w: 0.9, sub: 4 },
    ears: { len: 0.3, w: 0.09, out: 72, back: 20, t: 0.14, y: 0.6 },
    crest: { s0: -0.1, s1: 1.0, h: 0.022, w: 0.008, n: 10, col: 0x7a4a26 },
    tail: { len: 0.3, r: 0.012, a0: 75, a1: 88, type: 'tuft', tuftLen: 0.15, tuftR: 0.022, at: 0.02, dy: -0.1 },
    poses: ['stand', 'walk', 'drink', 'alert'], drinkSplay: 0.3, grazePitch: 50, grazeLift: 0.02,
    stride: 0.14,
    extras(c) {
      const { HG, hp, hl, ldir } = c;
      for (const s of [-1, 1]) {
        const b = hp(0.2, 62, 0.9, s), d = ldir(78, 6, s), len = hl * 0.24;
        const e = [b[0] + d[0] * len, b[1] + d[1] * len, b[2] + d[2] * len];
        HG.add('skin', loft([{ p: b, rx: hl * 0.045, ry: hl * 0.045 }, { p: e, rx: hl * 0.036, ry: hl * 0.036 }], { radial: 7, sub: 2 }), null, 0xb89766);
        HG.add('flat', ellipsoid(e, [hl * 0.046, hl * 0.04, hl * 0.046], { seg: 7, rings: 5 }), null, 0x2a1d14);
      }
      HG.add('skin', ellipsoid(hp(0.44, 90, 0.85), [hl * 0.1, hl * 0.05, hl * 0.06], { seg: 8, rings: 6 }), null, 0xcdb88c);
    },
    coat,
  };
}

// ===========================================================================
// RHINOS
// ===========================================================================
const RHINO_HEAD = [[0, .2, .2, .24], [.15, .27, .27, .3], [.35, .26, .22, .31], [.55, .21, .17, .27], [.75, .185, .17, .23], [.92, .17, .16, .19], [1, .1, .08, .1, -.03]];
export const rhinoBase = {
  L: 1.5, croup: 0.97, dip: 0.035, chest: 0.6, belly: 0.33, tuck: 0.4, wChest: 0.235, wBelly: 0.29, wHip: 0.25, square: 0.25,
  leg: { type: 'pillar', bone: 0.07, arm: 0.095, sh: 0.17, thigh: 0.19, gask: 0.1, knee: 0.5, hock: 0.26, fet: 0.07, nails: true, ang: 0.6, zTop: 0.6, stance: 0.15 },
  neck: { len: 0.3, ang: -8, w0: 0.2, t0: 0.21, b0: 0.25, w1: 0.16, t1: 0.17, b1: 0.2, bend: 0.05, at: 0.92, y: 0.7 },
  head: { st: RHINO_HEAD, len: 0.44, pitch: 30, eye: [0.48, 0.25, 0.02], nostrils: true },
  ears: { t: 0.08, y: 0.78, len: 0.24, w: 0.07, out: 22, back: 8, shape: 'long', cup: 0.9 },
  tail: { len: 0.36, r: 0.02, a0: 70, a1: 88, type: 'tuft', tuftLen: 0.08, tuftR: 0.025 },
  stride: 0.12, grazePitch: 55,
};
export function rhinoCoat(base, dark) {
  const b = col(base), d = col(dark);
  return (c) => {
    const p = c.p;
    let o = b;
    const n = fbm(p[0] * 14, p[1] * 14, p[2] * 14);
    o = mixCol(o, d, 0.35 * n);
    if (c.part === 'body') {
      // skin folds behind the shoulder and in front of the haunch
      const f = Math.max(sstep(0.035, 0.0, Math.abs(p[0] - 0.33)), sstep(0.03, 0.0, Math.abs(p[0] + 0.42))) * sstep(-0.9, -0.2, c.sy) * sstep(1, 0.55, c.sy);
      o = mixCol(o, d, 0.55 * f);
      if (c.sy < -0.5) o = mixCol(o, d, 0.25 * sstep(-0.5, -0.9, c.sy));
    }
    if (c.part === 'leg') o = mixCol(o, d, 0.3 * sstep(0.2, 0.0, c.ly));
    if (c.part === 'ear') return c.sy > 0 ? b : mixCol(b, d, 0.6);
    return o;
  };
}
export function rhinoHorns(c, list) {
  const { HG, hp, hl, ldir } = c;
  for (const [t, len, r, lean, curl] of list) {
    const b = hp(t, 90, 0.8);
    const pts = curve((u) => {
      const d = ldir(lean - curl * u, 0, 1);
      return [b[0] + d[0] * len * u * hl * (1 - 0.0), b[1] + d[1] * len * u * hl, 0];
    }, 8);
    HG.add('bone', horn(pts, r * hl, r * hl * 0.08, { pow: 0.8, radial: 9, flat: 0.85 }), null, 0x3a352f);
  }
}
Q.blackrhino = ext(rhinoBase, {
  H: 1.6, coat: rhinoCoat(0x78706a, 0x4a443f),
  extras(c) { rhinoHorns(c, [[0.86, 0.95, 0.105, 100, 22], [0.62, 0.45, 0.085, 92, 10]]); },
});
Q.whiterhino = ext(rhinoBase, {
  H: 1.8, L: 1.55, coat: rhinoCoat(0x8f8a80, 0x5d584f),
  neck: { len: 0.3, ang: -32, w0: 0.21, t0: 0.26, b0: 0.24, w1: 0.17, t1: 0.2, b1: 0.2, bend: 0.1, at: 0.92, y: 0.7 },
  head: { st: [[0, .2, .2, .24], [.15, .25, .26, .28], [.35, .23, .2, .28], [.55, .19, .16, .25], [.75, .185, .16, .22], [.93, .215, .16, .2], [1, .19, .1, .15]], len: 0.52, pitch: 42, eye: [0.42, 0.25, 0.017], square: 0.4 },
  extras(c) {
    rhinoHorns(c, [[0.86, 0.8, 0.1, 102, 20], [0.63, 0.3, 0.085, 92, 8]]);
    const q = c.neckAt(0.2);
    lump(c.TG, [q.p[0] + q.n[0] * q.ry * 0.75, q.p[1] + q.n[1] * q.ry * 0.75, 0], [0.15, 0.06, 0.13], c.coat({ part: 'body', sy: 1, p: [0.5, 1, 0], u: 0.9, a: 1.5 }), 'skin', [0, 0, -0.5]);
  },
});

// ===========================================================================
// BOVIDS: buffalo, antelopes
// ===========================================================================
{
  const C = { base: 0x2c2724, back: 0x24201e, belly: 0x2a2522, leg: 0x211e1c, muzzle: 0x191614, ear: 0x2a2522, earIn: 0x4a3f38 };
  Q.buffalo = {
    H: 1.5, L: 1.32, croup: 0.96, dip: 0.03, chest: 0.57, belly: 0.39, tuck: 0.45, wChest: 0.2, wBelly: 0.255, wHip: 0.22,
    leg: { type: 'hoof', bone: 0.042, arm: 0.075, thigh: 0.18, gask: 0.08, m: 1.2, hock: 0.32, footSize: 1.2 },
    neck: { len: 0.32, ang: 6, w0: 0.18, t0: 0.2, b0: 0.26, w1: 0.14, t1: 0.16, b1: 0.19, bend: 0.06, y: 0.76 },
    head: { type: 'bovine', len: 0.4, pitch: 32 },
    ears: { t: 0.14, y: 0.3, len: 0.36, w: 0.12, out: 100, back: 15, cup: 0.5 },
    tail: { len: 0.55, r: 0.018, a0: 75, a1: 88, type: 'tuft', tuftLen: 0.14, tuftR: 0.03 },
    coat: stdCoat(C),
    extras(c) {
      const { HG, hp, hl } = c;
      const top = hp(0.14, 90)[1];
      // boss
      HG.add('bone', ellipsoid([hl * 0.14, top + hl * 0.02, 0], [hl * 0.2, hl * 0.12, hl * 0.36], { seg: 12, rings: 8 }), null, 0x3b352f);
      horns(c, (t, s) => {
        const a = t * 2.5; // sweep: out and down, then hooking up and in
        const out = hl * (0.1 + 0.78 * Math.sin(Math.min(1.9, a) * 0.83) * (t < 0.7 ? 1 : 1 - (t - 0.7) * 1.3));
        const y = top + hl * (0.0 - 0.3 * Math.sin(Math.PI * Math.min(1, t * 1.6)) + 0.62 * sstep(0.42, 1, t));
        return [hl * (0.14 - 0.3 * t * t), y, s * out];
      }, hl * 0.17, hl * 0.016, { n: 14, pow: 0.7, radial: 8, col: 0x37312b });
    },
  };
}
{
  // gemsbok
  const fawn = col(0xb7a58c), W = col(0xeee9dc), K = col(0x1c1917);
  const coat = (c) => {
    const p = c.p, sy = c.sy;
    switch (c.part) {
      case 'body': {
        let o = mixCol(fawn, 0xa8967d, sstep(0.3, 1, sy) * 0.5);
        const mid = p[0] > -0.4 && p[0] < 0.42 ? 1 : 0;
        if (sy < -0.34) o = mixCol(o, K, sstep(-0.34, -0.42, sy) * mid);
        if (sy < -0.6) o = mixCol(o, W, sstep(-0.6, -0.7, sy));
        if (sy > 0.975 || (p[0] < -0.42 && sy > 0.6)) o = mixCol(o, K, 0.9);
        if (p[0] < -0.47 && sy < 0.5) o = W;
        return o;
      }
      case 'neck': return sy < -0.82 ? K : mixCol(fawn, 0xa8967d, sstep(0.3, 1, sy) * 0.5);
      case 'leg': {
        const up = c.which === 'f' ? sstep(0.4, 0.46, c.ly) * sstep(0.66, 0.6, c.ly) : sstep(0.5, 0.56, c.ly) * sstep(0.8, 0.7, c.ly) * (sy < 0.3 ? 0.0 : 1);
        let o = mixCol(fawn, W, sstep(c.which === 'f' ? 0.44 : 0.52, c.which === 'f' ? 0.4 : 0.46, c.ly));
        o = mixCol(o, K, up);
        if (c.ly < 0.3 && sy > 0.45 && c.ly > 0.1) o = mixCol(o, K, 0.9);
        return o;
      }
      case 'head': {
        const u = c.u;
        let k = 0;
        if (sy > 0.35 && u > 0.1 && u < 0.3) k = 1; // forehead
        if (u > 0.46 && u < 0.7 && sy > -0.2) k = 1; // nose band
        if (Math.abs(u - 0.35 - (0.5 - sy) * 0.06) < 0.045 && sy < 0.75) k = 1; // eye stripe
        if (u > 0.94) k = 1;
        if (u < 0.1) return fawn;
        return k ? K : W;
      }
      case 'tail': return K;
      case 'ear': return sy > 0 ? fawn : W;
    }
    return fawn;
  };
  Q.gemsbok = {
    H: 1.2, L: 1.08, croup: 0.98, dip: 0.02, chest: 0.47, belly: 0.5, tuck: 0.56, wChest: 0.16, wBelly: 0.2, wHip: 0.175,
    radial: 28, sub: 5,
    leg: { type: 'hoof', bone: 0.03, arm: 0.058, m: 1.05, sub: 4 },
    neck: { len: 0.4, ang: 40, w0: 0.115, t0: 0.16, b0: 0.2, w1: 0.08, t1: 0.1, b1: 0.11, bend: 0.03 },
    head: { type: 'antelope', len: 0.36, pitch: 44, sub: 5, radial: 16 },
    ears: { len: 0.34, w: 0.1, out: 58, back: 10, t: 0.1, y: 0.6 },
    tail: { len: 0.32, r: 0.018, a0: 72, a1: 88, type: 'tuft', tuftLen: 0.3, tuftR: 0.04 },
    coat,
    extras(c) { simpleHorns(c, { t: 0.2, a: 66, elev: 62, out: 7, len: 0.72, r0: 0.024, r1: 0.004, sweep: 6, ridge: 0.1, ridges: 14, ridgeTo: 0.55, n: 40, sub: 1 }); },
  };
}
{
  // greater kudu
  const base = col(0x9a8b7b), W = col(0xe9e3d6);
  const C = { base: 0x9a8b7b, back: 0x8d7f70, belly: 0xa59685, leg: 0xb0885f, muzzle: 0x3a302a, face: 0x8a7a6b, jaw: 0xe2dccf, ear: 0x8a7868, earIn: 0xe8d9cf, tail: 0x8d7f70, sockHi: 0.42, sockLo: 0.3 };
  const coat = stdCoat(C, (o, c) => {
    if (c.part === 'body') o = mixCol(o, W, vstripes(c.p[0], c.p[1], 8, -0.4, 0.26, 0.012) * sstep(-0.25, 0.15, c.sy) * 0.9);
    if (c.part === 'head') {
      if (c.sy > 0.1 && Math.abs(c.u - 0.4 + Math.abs(Math.cos(c.a)) * 0.07) < 0.03) o = W; // chevron
      if (c.u > 0.9 && c.sy < 0.2) o = W;
    }
    return o;
  });
  Q.kudu = {
    H: 1.45, L: 1.02, croup: 0.97, dip: 0.02, chest: 0.43, belly: 0.55, tuck: 0.6, wChest: 0.14, wBelly: 0.175, wHip: 0.155, withers: 1.02,
    radial: 24, sub: 8,
    leg: { type: 'hoof', bone: 0.026, arm: 0.05, m: 0.95 },
    neck: { len: 0.46, ang: 48, w0: 0.1, t0: 0.15, b0: 0.19, w1: 0.068, t1: 0.085, b1: 0.095, bend: 0.03 },
    head: { type: 'antelope', len: 0.3, pitch: 40 },
    ears: { len: 0.5, w: 0.2, out: 62, back: 10, t: 0.1, y: 0.55, shape: 'round', cup: 0.5 },
    crest: { s0: 0.0, s1: 0.95, h: 0.03, w: 0.01, col: 0xcfc4b0 },
    tail: { len: 0.34, r: 0.03, a0: 70, a1: 86, type: 'bushy', bush: 0.5 },
    coat,
    extras(c) {
      spiralHorns(c, { t: 0.2, a: 62, elev: 70, out: 20, len: 0.62, rad: 0.075, turns: 2.4, r0: 0.03, r1: 0.005, n: 36, col: 0x3b342c, radial: 7 });
      dewlap(c, [0.92, 0.7, 0.45, 0.2, 0.0], [0.015, 0.04, 0.05, 0.045, 0.02], 0.008, (u) => mixCol(0xb9ad9c, 0x54483e, sstep(0.2, 0.9, u)), 'flat');
      backCrest(c, 0.3, 0.86, 0.022, 0.008, 0xd9d0bf);
    },
  };
}
{
  // giant (Lord Derby's) eland
  const W = col(0xeae3d2), K = col(0x1f1b18);
  const C = { base: 0xb38959, back: 0xa67c4e, belly: 0xcbb38d, leg: 0xc0a57c, muzzle: 0x2a221d, face: 0x9a7a55, jaw: 0xd8c7a6, ear: 0xa98458, earIn: 0xe6d6bd, tail: 0xa67c4e, sockHi: 0.4, sockLo: 0.28 };
  const coat = stdCoat(C, (o, c) => {
    if (c.part === 'body') {
      o = mixCol(o, W, vstripes(c.p[0], c.p[1], 11, -0.44, 0.36, 0.011) * sstep(-0.35, 0.1, c.sy) * 0.9);
      if (c.sy > 0.975) o = mixCol(o, K, 0.8);
      o = mixCol(o, K, sstep(0.44, 0.52, c.p[0]) * 0.85);
    }
    if (c.part === 'neck') { o = mixCol(o, K, sstep(0.75, 0.1, c.s) * 0.85); if (c.s < 0.02) o = mixCol(o, W, 0.0); }
    if (c.part === 'leg' && c.which === 'f' && c.ly > 0.34 && c.ly < 0.42 && c.inner < 0.3) o = mixCol(o, K, 0.8);
    if (c.part === 'head') {
      if (c.sy > 0.1 && Math.abs(c.u - 0.4 + Math.abs(Math.cos(c.a)) * 0.07) < 0.028) o = W;
      if (c.sy > 0.5 && c.u < 0.34) o = mixCol(o, 0x4a3324, 0.8);
      if (c.u > 0.9 && c.sy < 0.2) o = W;
    }
    return o;
  });
  Q.eland = {
    H: 1.7, L: 1.12, croup: 0.96, dip: 0.02, chest: 0.5, belly: 0.46, tuck: 0.53, wChest: 0.165, wBelly: 0.2, wHip: 0.18, withers: 1.03,
    radial: 24, sub: 8,
    leg: { type: 'hoof', bone: 0.03, arm: 0.058, m: 1.08, thigh: 0.165 },
    neck: { len: 0.36, ang: 30, w0: 0.125, t0: 0.18, b0: 0.22, w1: 0.08, t1: 0.1, b1: 0.11, bend: 0.03, y: 0.78 },
    head: { type: 'antelope', len: 0.29, pitch: 42 },
    ears: { len: 0.42, w: 0.15, out: 75, back: 10, t: 0.1, y: 0.45, shape: 'round' },
    tail: { len: 0.5, r: 0.014, a0: 75, a1: 88, type: 'tuft', tuftLen: 0.12, tuftR: 0.025 },
    coat,
    extras(c) {
      spiralHorns(c, { t: 0.2, a: 66, elev: 66, out: 17, len: 0.58, rad: 0.014, turns: 2.2, r0: 0.03, r1: 0.005, n: 30, col: 0x2e2822, ridge: 0.06, ridges: 5 });
      dewlap(c, [0.95, 0.7, 0.45, 0.2, -0.05, -0.3], [0.015, 0.05, 0.085, 0.1, 0.08, 0.02], 0.012, (u, p, sy) => mixCol(0x3a2e26, 0x8a6a48, sstep(0.3, 1, u) * 0.7));
      backCrest(c, 0.3, 0.88, 0.016, 0.008, 0x2a2420);
    },
  };
}
{
  // okapi
  const D = col(0x47291f), W = col(0xe9e2d2), K = col(0x1c1614);
  const stripe = (p) => band((p[1] + 0.22 * (p[0] + 0.4)) * 15.5 + 0.35 * noise3(p[0] * 7, p[1] * 3, p[2] * 7), 0.5, 0.2);
  const coat = (c) => {
    const p = c.p, sy = c.sy;
    switch (c.part) {
      case 'body': {
        let o = mixCol(D, 0x3a2018, sstep(0.3, 1, sy) * 0.5);
        const hq = sstep(-0.2, -0.3, p[0]) * sstep(0.84, 0.76, p[1]);
        return mixCol(o, mixCol(W, K, stripe(p) * 0.92), hq);
      }
      case 'neck': return mixCol(D, 0x5a3a2c, sstep(-0.2, -0.9, sy) * 0.6 + sstep(0.6, 1, c.s) * 0.3);
      case 'leg': {
        const hind = c.which === 'h';
        const top = hind ? 0.95 : 0.64, bot = hind ? 0.37 : 0.4;
        if (c.ly > top) return D;
        if (c.ly > bot) return mixCol(mixCol(W, K, stripe(p) * 0.92), D, sstep(top - 0.05, top, c.ly));
        let o = W;
        if (c.ly < 0.13) o = mixCol(W, K, sstep(0.13, 0.1, c.ly));
        if (!hind && c.ly > 0.26 && c.ly < 0.33) o = K;
        if (sy > 0.6 && c.ly < bot - 0.03) o = mixCol(o, K, 0.85);
        return o;
      }
      case 'head': {
        let o = mixCol(0xcfc8bb, D, sstep(0.25, 0.75, sy) * 0.95);
        if (c.u < 0.14) o = mixCol(o, D, sstep(0.14, 0.05, c.u));
        return mixCol(o, K, sstep(0.8, 0.95, c.u) * 0.9);
      }
      case 'tail': return D;
      case 'ear': return sy > 0 ? D : col(0x9c8478);
    }
    return D;
  };
  Q.okapi = {
    H: 1.55, L: 0.95, croup: 0.9, dip: 0.0, chest: 0.42, belly: 0.55, tuck: 0.6, wChest: 0.135, wBelly: 0.17, wHip: 0.15,
    radial: 28, sub: 7,
    leg: { type: 'hoof', bone: 0.027, arm: 0.05, sub: 6, m: 1.0, radial: 12 },
    neck: { len: 0.5, ang: 36, w0: 0.11, t0: 0.16, b0: 0.2, w1: 0.07, t1: 0.085, b1: 0.095, bend: 0.01, y: 0.8 },
    head: { type: 'antelope', len: 0.34, pitch: 36, w: 0.95 },
    ears: { len: 0.42, w: 0.16, out: 55, back: 25, t: 0.1, y: 0.6, shape: 'leaf' },
    tail: { len: 0.3, r: 0.014, a0: 78, a1: 88, type: 'tuft', tuftLen: 0.1, tuftR: 0.022 },
    coat,
    extras(c) {
      const { HG, hp, hl, ldir } = c;
      for (const s of [-1, 1]) {
        const b = hp(0.22, 62, 0.9, s), d = ldir(60, 8, s), len = hl * 0.3;
        HG.add('skin', loft([{ p: b, rx: hl * 0.045, ry: hl * 0.045 }, { p: [b[0] + d[0] * len, b[1] + d[1] * len, b[2] + d[2] * len], rx: hl * 0.02, ry: hl * 0.02 }], { radial: 6, sub: 2 }), null, 0x3a2018);
      }
    },
  };
}
{
  // bongo
  const W = col(0xf0eadc), K = col(0x1d1815);
  const C = { base: 0xa6532a, back: 0x9a4a24, belly: 0x5e2f1c, leg: 0x3a2118, muzzle: 0x231a16, face: 0x7a3c22, jaw: 0x8a5a3a, ear: 0x9a4a24, earIn: 0xe8d8c8, tail: 0x9a4a24, sockHi: 0.5, sockLo: 0.4 };
  const coat = stdCoat(C, (o, c) => {
    if (c.part === 'body') o = mixCol(o, W, vstripes(c.p[0], c.p[1], 12, -0.44, 0.38, 0.011) * sstep(-0.55, -0.2, c.sy) * 0.95);
    if (c.part === 'neck' && c.s < 0.25 && c.s > 0.08 && c.sy < -0.3) o = W; // chest crescent
    if (c.part === 'leg') {
      if (c.ly < 0.33 && (c.inner > 0.2 || (c.ly < 0.3 && c.ly > 0.2))) o = W;
      if (c.ly < 0.12 && c.ly > 0.07) o = W;
    }
    if (c.part === 'head') {
      if (c.sy > 0.1 && Math.abs(c.u - 0.4 + Math.abs(Math.cos(c.a)) * 0.07) < 0.03) o = W;
      if (Math.abs(c.sy + 0.25) < 0.2 && (Math.abs(c.u - 0.3) < 0.035 || Math.abs(c.u - 0.42) < 0.03)) o = W;
      if (c.u > 0.92 && c.sy < 0.1) o = W;
    }
    return o;
  });
  Q.bongo = {
    H: 1.25, L: 1.1, croup: 0.99, dip: 0.015, chest: 0.48, belly: 0.47, tuck: 0.53, wChest: 0.16, wBelly: 0.2, wHip: 0.18,
    radial: 24, sub: 8,
    leg: { type: 'hoof', bone: 0.03, arm: 0.056, m: 1.05 },
    neck: { len: 0.38, ang: 30, w0: 0.115, t0: 0.16, b0: 0.2, w1: 0.075, t1: 0.095, b1: 0.105, bend: 0.03 },
    head: { type: 'antelope', len: 0.32, pitch: 38 },
    ears: { len: 0.46, w: 0.19, out: 68, back: 10, t: 0.1, y: 0.5, shape: 'round' },
    tail: { len: 0.42, r: 0.014, a0: 75, a1: 88, type: 'tuft', tuftLen: 0.1, tuftR: 0.024 },
    coat,
    extras(c) {
      spiralHorns(c, { t: 0.2, a: 64, elev: 50, out: 20, len: 0.56, rad: 0.05, turns: 1.0, r0: 0.03, r1: 0.006, n: 24, col: 0x3a3028, phase: 0.6 });
      backCrest(c, 0.1, 0.88, 0.022, 0.008, (p) => (band(p[0] * 14, 0.5) > 0.5 ? K : W), 20);
    },
  };
}

// ===========================================================================
// ELEPHANTS (spec depends on opts.sex / opts.age / opts.pose)
// ===========================================================================
function elephantSpec(kind, opts = {}) {
  const african = kind === 'african';
  const calf = opts.age === 'calf', cow = opts.sex === 'cow';
  const H = african ? (calf ? 1.3 : cow ? 2.6 : 3.2) : (calf ? 1.2 : cow ? 2.35 : 2.75);
  let pose = ['walk', 'alarm', 'stand'].includes(opts.pose) ? opts.pose : 'walk';
  const alarm = pose === 'alarm';
  const g0 = col(african ? 0x847b72 : 0x6f6964), g1 = col(african ? 0x5a534d : 0x4a4643), pink = col(0xb08a80);
  const coat = (c) => {
    const p = c.p;
    let o = mixCol(g0, g1, 0.5 * fbm(p[0] * 9, p[1] * 9, p[2] * 9) + 0.25 * noise3(p[0] * 40, p[1] * 14, p[2] * 40));
    if (c.part === 'body' && c.sy < -0.3) o = mixCol(o, g1, 0.35 * sstep(-0.3, -0.9, c.sy));
    if (c.part === 'leg') { o = mixCol(o, g1, 0.25 * sstep(0.25, 0, c.ly)); o = mixCol(o, g1, 0.25 * band(c.ly * 30, 0.3, 0.3) * sstep(0.5, 0.2, c.ly)); }
    if (c.part === 'head' && !african) o = mixCol(o, pink, 0.35 * sstep(0.55, 0.95, c.u) * noise3(p[0] * 60, p[1] * 60, p[2] * 60));
    return o;
  };
  const torso = african
    ? [[0, .72, .5, .08], [.05, .86, .44, .17], [.15, .945, .43, .215], [.3, .95, .41, .245], [.45, .94, .39, .26], [.6, .955, .4, .26], [.74, .99, .44, .235], [.85, 1.0, .5, .2], [.94, .96, .56, .16], [1, .88, .64, .1]]
    : [[0, .7, .48, .08], [.05, .86, .43, .17], [.15, .97, .42, .215], [.3, 1.02, .4, .25], [.45, 1.04, .38, .265], [.6, 1.03, .39, .265], [.74, 1.01, .43, .24], [.85, 1.0, .49, .2], [.94, .95, .55, .16], [1, .87, .63, .1]];
  const tuskLen = calf ? 0 : african ? (cow ? 0.3 : 0.56) : (cow ? 0 : 0.36);
  return {
    H, L: 1.05, croup: 0.95, chest: 0.5, belly: 0.4, tuck: 0.44, wChest: 0.2, wBelly: 0.26, wHip: 0.215, torso, radial: 24, sub: 4,
    pose, poses: ['walk', 'alarm', 'stand'], stride: 0.15, walkLift: false, tS: 0.82, tH: 0.16,
    legF: { foot: 'pad', nails: true, bone: 0.066, zTop: 0.62, stance: 0.135, sub: 4, radial: 12,
      st: [[-0.04, 0.88, .04, .1, .1], [0.0, 0.7, .085, .14, .13], [-0.02, 0.5, .08, .1, .115], [0, 0.36, .068, .076, .08], [0.012, 0.22, .066, .074, .07], [0.0, 0.1, .066, .07, .072], [0.004, 0.035, .078, .084, .08], [0.008, 0, .082, .09, .083]] },
    legH: { foot: 'pad', nails: true, bone: 0.064, zTop: 0.62, stance: 0.13, sub: 4, radial: 12,
      st: [[0.02, 0.86, .04, .1, .1], [0.04, 0.68, .09, .16, .15], [0.07, 0.5, .085, .125, .13], [0.06, 0.36, .07, .086, .09], [-0.005, 0.2, .062, .068, .076], [-0.025, 0.09, .063, .068, .075], [-0.025, 0.035, .074, .08, .08], [-0.02, 0, .079, .086, .08]] },
    neck: { len: 0.17, ang: alarm ? 34 : 20, w0: 0.19, t0: 0.2, b0: 0.24, w1: 0.17, t1: 0.2, b1: 0.21, bend: 0.02, at: 0.93, y: 0.84 },
    head: {
      st: african ? [[0, .3, .3, .3], [.18, .43, .42, .4], [.42, .46, .44, .42], [.66, .4, .34, .36], [.86, .3, .22, .28], [1, .2, .14, .2]]
        : [[0, .3, .32, .3], [.18, .44, .5, .4], [.42, .45, .46, .42], [.66, .38, .32, .36], [.86, .29, .21, .28], [1, .2, .14, .2]],
      len: calf ? 0.4 : 0.38, pitch: alarm ? 48 : 66, eye: [0.56, 0.1, 0.02], nostrils: false, radial: 18, sub: 4,
    },
    ears: null,
    tail: { len: 0.42, r: 0.02, a0: 78, a1: 88, type: 'tuft', tuftLen: 0.09, tuftR: 0.026, at: 0.02, dy: -0.2 },
    coat,
    extras(c) {
      const { HG, TG, hp, hl, w2h, MH, rv } = c;
      // ---- ears: sheet hanging from the side of the head, in world-aligned axes converted to head coords
      const EH = african ? 0.5 : 0.32, EW = african ? 0.36 : 0.2;
      for (const s of [-1, 1]) {
        const O = hp(african ? 0.16 : 0.24, 55, 0.96, s);
        const phi = ((alarm ? 80 : pose === 'stand' ? 28 : 40) + rv(6)) * D2R;
        const R = [-Math.cos(phi), 0, s * Math.sin(phi)], Nn = [Math.sin(phi), 0, s * Math.cos(phi)];
        const fn = (u, v) => {
          const w = EW * Math.pow(Math.sin(Math.PI * (0.1 + 0.8 * v)), 0.55) * (1 - 0.35 * v);
          const a = u * w, b = v * EH - Math.sin(Math.PI * Math.min(1, u * 1.15)) * (african ? 0.11 : 0.05) * (1 - v) * (1 - v);
          const wave = 0.018 * Math.sin(u * 7 + v * 5) * u + 0.03 * u * u;
          const wx = R[0] * a + Nn[0] * wave, wy = -b, wz = R[2] * a + Nn[2] * wave;
          const l = w2h(wx, wy, wz);
          return [O[0] + l[0] - 0.02 * hl, O[1] + l[1], O[2] + l[2]];
        };
        const ec = (x, y, z) => { const n = fbm(x * 12, y * 12, z * 12); return mixCol(g0, g1, 0.3 + 0.4 * n); };
        const ec2 = (x, y, z) => { const n = fbm(x * 12, y * 12, z * 12); return mixCol(mixCol(g0, pink, african ? 0.12 : 0.3), g1, 0.2 + 0.4 * n); };
        // winding depends on side so that "front" always faces outwards
        HG.add('skin', grid(9, 10, fn, s > 0), null, ec);
        HG.add('skin', grid(9, 10, fn, s < 0), null, ec2);
      }
      if (!african) for (const s of [-1, 1]) HG.add('skin', ellipsoid(hp(0.2, 68, 0.86, s), [hl * 0.2, hl * 0.13, hl * 0.17], { seg: 10, rings: 7 }), null, (x, y, z) => coat({ part: 'head', p: [x, y, z], u: 0.2, sy: 1 }));
      // ---- trunk (standing coords, hangs from the end of the face)
      const root = new THREE.Vector3(hl * 0.86, -0.02 * hl, 0).applyMatrix4(MH);
      const yawR = c.yaw * D2R;
      const n = 30, Lt = alarm ? 0.66 : Math.max(0.3, root.y - 0.035) * 1.04;
      let ang = -c.pitch * D2R, x = 0, y = 0;
      const pts = [], st = [];
      const tipCurl = pose === 'stand' ? -1 : 1;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        if (alarm) ang = (-40 + 135 * sstep(0.05, 0.45, t) + 40 * sstep(0.45, 0.8, t) - 120 * sstep(0.8, 1, t)) * D2R;
        else ang = (lerp(-c.pitch, -88, sstep(0, 0.35, t)) + tipCurl * 42 * sstep(0.72, 1, t) + (pose === 'walk' ? 10 * Math.sin(t * 5) : 0)) * D2R;
        const px = root.x + x * Math.cos(yawR), pz = root.z - x * Math.sin(yawR);
        const r = lerp(0.082, 0.027, Math.pow(t, 0.8)) * (1 + (i % 2 ? 0.035 : -0.02) * (t > 0.06 ? 1 : 0));
        st.push({ p: [px, Math.max(root.y + y, r * 0.9), pz], rx: r, ry: r * 0.95, ryb: r * 0.95 });
        x += Math.cos(ang) * Lt / n; y += Math.sin(ang) * Lt / n;
      }
      TG.add('skin', loft(st, { radial: 12, sub: 1, capBulge: 0.3, color: (u, a, p, sy) => { const k = Math.round(u * n) % 2; return mixCol(coat({ part: 'trunk', p, sy, u }), g1, k ? 0.3 : 0.0); } }));
      // ---- tusks (rigid with the head)
      if (tuskLen > 0) for (const s of [-1, 1]) {
        const b = [hl * 0.72, -hl * 0.12, s * hl * 0.2];
        const m = 14, tp = [];
        let tx = b[0], ty = b[1];
        for (let i = 0; i <= m; i++) {
          const t = i / m, a = lerp(4, african ? 78 : 60, Math.pow(t, 1.25)) * D2R;
          tp.push([tx, ty, b[2] + s * tuskLen * (0.2 * Math.sin(Math.PI * Math.min(1, t * 1.25)) - 0.05 * t)]);
          tx += Math.cos(a) * tuskLen / m; ty += Math.sin(a) * tuskLen / m;
        }
        HG.add('bone', horn(tp, cow ? 0.02 : 0.03, 0.006, { pow: 1.2, radial: 8, sub: 2 }), null, 0xe9dfc6);
      }
      // lower lip
      HG.add('skin', ellipsoid([hl * 0.78, -hl * 0.25, 0], [hl * 0.2, hl * 0.1, hl * 0.13], { seg: 8, rings: 6, rot: [0, 0, 0.5] }), null, (x, y, z) => coat({ part: 'head', p: [x, y, z], u: 0.5, sy: -1 }));
    },
  };
}
Q.elephant = (opts) => elephantSpec('african', opts);
export const indianElephant = (opts) => elephantSpec('indian', opts);

export { STD_POSES };
