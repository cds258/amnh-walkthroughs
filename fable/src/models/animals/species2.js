// Group 2 / 3 quadrupeds: remaining African mammals, North American and Asian mammals.
import {
  col, mixCol, shade, loft, ellipsoid, D2R, lerp, clamp, sstep, hash, noise3, fbm, worley,
  grid, sheet, leaf, curve, horn, stdCoat, STD_POSES, tube,
} from './core.js';
import { Q, ext, band, vstripes, horns, simpleHorns, spiralHorns, backCrest, dewlap, lump, catBase, rhinoBase, rhinoCoat, rhinoHorns, indianElephant } from './species.js';

const W = col(0xeeeadf), K = col(0x1b1815);

// ---------------------------------------------------------------------------
// archetypes
// ---------------------------------------------------------------------------
const antelope = {
  H: 1, L: 1.05, croup: 0.98, dip: 0.02, chest: 0.45, belly: 0.52, tuck: 0.58, wChest: 0.15, wBelly: 0.19, wHip: 0.165,
  leg: { type: 'hoof', bone: 0.027, arm: 0.052 },
  neck: { len: 0.42, ang: 42, w0: 0.105, t0: 0.15, b0: 0.19, w1: 0.07, t1: 0.09, b1: 0.1, bend: 0.03 },
  head: { type: 'antelope', len: 0.32, pitch: 40 },
  ears: { len: 0.38, w: 0.11, out: 58, back: 10, t: 0.1, y: 0.6 },
  tail: { len: 0.25, r: 0.018, a0: 70, a1: 86 },
};
const deer = ext(antelope, {
  chest: 0.44, belly: 0.54, tuck: 0.6,
  neck: { len: 0.44, ang: 50, w0: 0.1, t0: 0.15, b0: 0.19, w1: 0.065, t1: 0.085, b1: 0.095, bend: 0.02 },
  head: { type: 'antelope', len: 0.3, pitch: 35 }, ears: { len: 0.42, w: 0.13, out: 50 },
  tail: { len: 0.14, r: 0.025, a0: 60, a1: 80 },
});
const dog = {
  H: 1, L: 1.1, croup: 0.97, dip: 0.02, chest: 0.44, belly: 0.6, tuck: 0.68, wChest: 0.13, wBelly: 0.15, wHip: 0.13,
  leg: { type: 'dog', bone: 0.032, arm: 0.05 },
  neck: { len: 0.34, ang: 28, w0: 0.11, t0: 0.15, b0: 0.18, w1: 0.085, t1: 0.1, b1: 0.11, bend: 0.03 },
  head: { type: 'dog', len: 0.36, pitch: 14, nose: true, noseR: 0.06, eyeCol: 0x6a4a14 },
  ears: { len: 0.3, w: 0.11, out: 20 },
  tail: { len: 0.5, r: 0.03, a0: 55, a1: 80, type: 'bushy' },
  poses: ['stand', 'walk', 'lie', 'sit', 'alert'],
};
const bear = {
  H: 1, L: 1.25, croup: 0.93, dip: 0.0, chest: 0.56, belly: 0.4, tuck: 0.45, wChest: 0.2, wBelly: 0.25, wHip: 0.22, withers: 1.0,
  leg: { type: 'bear', bone: 0.07, arm: 0.1, sh: 0.17, thigh: 0.2, gask: 0.11, m: 1.15, claws: 0.035, pawLong: 1.0, zTop: 0.6 },
  legH: { pawLong: 1.5 },
  neck: { len: 0.3, ang: 2, w0: 0.17, t0: 0.19, b0: 0.22, w1: 0.14, t1: 0.15, b1: 0.16, bend: 0.05, y: 0.74 },
  head: { type: 'bear', len: 0.37, pitch: 18, nose: true, noseR: 0.075, eyeScale: 0.8 },
  ears: { len: 0.2, w: 0.1, out: 40 },
  tail: { len: 0.08, r: 0.035, a0: 60, a1: 80 },
  poses: ['walk', 'stand', 'upright', 'sit'], pose: 'walk', stride: 0.13, walkLift: false,
};
const pig = {
  H: 1, L: 1.3, croup: 0.92, dip: 0.0, chest: 0.6, belly: 0.37, tuck: 0.43, wChest: 0.17, wBelly: 0.2, wHip: 0.17,
  leg: { type: 'hoof', bone: 0.03, arm: 0.055, m: 0.95, hock: 0.26, fet: 0.07 },
  neck: { len: 0.14, ang: -8, w0: 0.17, t0: 0.2, b0: 0.24, w1: 0.15, t1: 0.17, b1: 0.19, bend: 0.03, y: 0.7 },
  head: { type: 'pig', len: 0.5, pitch: 22, nostrils: false },
  ears: { len: 0.22, w: 0.08, out: 35, back: 15 },
  tail: { len: 0.28, r: 0.012, a0: 75, a1: 88, type: 'tuft', tuftLen: 0.06, tuftR: 0.018 },
};

// ---------------------------------------------------------------------------
// horn / antler helpers
// ---------------------------------------------------------------------------
/** horn whose direction turns from (elev0,out0) to (elev1,out1) along its length */
function arcPts(c, s, o) {
  const n = o.n || 14, b = o.base ? o.base(s) : c.hp(o.t ?? 0.18, o.a ?? 66, 0.9, s);
  const pts = [b.slice()];
  let p = b.slice();
  for (let i = 1; i <= n; i++) {
    const t = (i - 0.5) / n, e = o.efn ? o.efn(t) : lerp(o.elev0, o.elev1, t), ou = o.ofn ? o.ofn(t) : lerp(o.out0, o.out1, t);
    const d = c.ldir(e, ou, s);
    p = [p[0] + d[0] * o.len / n, p[1] + d[1] * o.len / n, p[2] + d[2] * o.len / n];
    pts.push(p);
  }
  return pts;
}
function arcHorns(c, o) {
  for (const s of [-1, 1]) c.HG.add('bone', horn(arcPts(c, s, o), o.r0, o.r1 ?? 0.004, o), null, o.col ?? 0x2a2622);
}
/** antlers: beam (arc) + tines [[at(0..1), elev, out, len, curl(0..1)]] */
function antlers(c, o) {
  for (const s of [-1, 1]) {
    const pts = arcPts(c, s, o), n = pts.length - 1;
    c.HG.add('bone', horn(pts, o.r0, o.r1 ?? 0.006, { radial: 6, sub: 2, pow: 0.8 }), null, o.col ?? 0x8a7458);
    for (const [at, elev, out, len, curl = 0.5] of o.tines) {
      const q = pts[Math.round(at * n)], tp = [q.slice()];
      let p = q.slice();
      for (let j = 1; j <= 5; j++) {
        const d = c.ldir(lerp(elev, 90, curl * j / 5), out, s);
        p = [p[0] + d[0] * len / 5, p[1] + d[1] * len / 5, p[2] + d[2] * len / 5];
        tp.push(p);
      }
      c.HG.add('bone', horn(tp, lerp(o.r0, o.r1 ?? 0.006, at) * 0.8, 0.003, { radial: 5, sub: 2 }), null, (x, y, z, i) => mixCol(o.col ?? 0x8a7458, 0xe0d4b8, sstep(18, 30, i) * 0.7));
    }
    if (o.palm) o.palm(c, s, pts);
  }
}
/** cattle-type horns: out sideways (dropping `drop`), then hooking up `rise` and inwards */
function cowHorns(c, o) {
  const { hl, hp } = c, top = hp(o.t ?? 0.14, 90)[1];
  horns(c, (t, s) => {
    const out = hl * (o.z0 + o.span * Math.sin(Math.min(1.9, t * 2.5) * 0.83) * (t < 0.7 ? 1 : 1 - (t - 0.7) * (o.hook ?? 1.3)));
    const y = top + hl * (-o.drop * Math.sin(Math.PI * Math.min(1, t * 1.6)) + o.rise * sstep(0.42, 1, t));
    return [hl * ((o.t ?? 0.14) - (o.back ?? 0.3) * t * t), y, s * out];
  }, hl * o.r0, hl * (o.r1 ?? 0.015), { n: 14, pow: 0.7, radial: 8, col: o.col ?? 0x2e2924 });
}

// ---------------------------------------------------------------------------
// spotted / striped coats
// ---------------------------------------------------------------------------
function spotCoat(C, o) {
  const dk = col(o.dark ?? 0x17120e), fill = col(o.fill ?? C.base);
  return stdCoat(C, (c0, c) => {
    if (c.part === 'ear') return c0;
    const p = c.p;
    if (c.part === 'tail') return mixCol(c0, dk, c.u > (o.tailTip ?? 2) ? 0 : band(c.u * (o.tailRings ?? 9), 0.45) * (c.u > 0.35 ? 1 : 0.6));
    let sc = 1 / o.cell;
    if (c.part === 'head') sc *= 2; else if (c.part === 'leg' && c.ly < 0.45) sc *= 1.5;
    const w = worley(p[0] * sc + 7.3, p[1] * sc + 1.1, p[2] * sc + 4.7), f = w[0];
    let d;
    if (o.kind === 'spot') d = sstep(o.r + 0.07, o.r - 0.05, f);
    else {
      const small = c.part !== 'body' || c.sy < -0.55;
      if (small) d = sstep(0.3, 0.18, f);
      else {
        d = sstep(0.2, 0.27, f) * sstep(0.48, 0.4, f) * (noise3(p[0] * sc * 2.3, p[1] * sc * 2.3, p[2] * sc * 2.3) > 0.28 ? 1 : 0.15);
        c0 = mixCol(c0, fill, sstep(0.3, 0.15, f));
        if (o.kind === 'jag') d = Math.max(d, sstep(0.1, 0.04, f));
      }
    }
    if (c.part === 'head') d *= sstep(0.72, 0.55, c.u);
    return mixCol(c0, dk, d * (o.amt ?? 0.92));
  });
}

// ===========================================================================
// GROUP 2 — antelopes & co.
// ===========================================================================
{
  // sable antelope (bull)
  const C = { base: 0x241c18, back: 0x1e1714, belly: 0xece6d8, leg: 0x2a201a, muzzle: 0xe8e2d4, face: 0x211a16, jaw: 0xece6d8, ear: 0x7a4a2c, earIn: 0xe8ddd0, tail: 0x1b1512, bellyAt: -0.55, sockHi: 0.3, sockLo: 0.1 };
  Q.sable = ext(antelope, {
    H: 1.35, L: 1.08, chest: 0.48, belly: 0.5, tuck: 0.56, wChest: 0.165, wBelly: 0.2, withers: 1.03, croup: 0.95,
    leg: { bone: 0.03, arm: 0.058, m: 1.05 },
    neck: { len: 0.4, ang: 44, w0: 0.12, t0: 0.17, b0: 0.21, w1: 0.08, t1: 0.1, b1: 0.11, bend: 0.05 },
    head: { len: 0.34, pitch: 44 }, ears: { len: 0.36, w: 0.1, out: 55 },
    crest: { s0: 0, s1: 0.95, h: 0.035, w: 0.012, col: 0x15100d },
    tail: { len: 0.36, r: 0.014, type: 'tuft', tuftLen: 0.12, tuftR: 0.028, a0: 75, a1: 88 },
    coat: stdCoat(C, (o, c) => {
      if (c.part === 'head') {
        const side = Math.abs(Math.cos(c.a));
        if (c.u > 0.3 && c.u < 0.9 && c.sy > -0.2 && c.sy < 0.72) o = W; // cheek stripe region
        if (c.sy > 0.72 && c.u < 0.85) o = col(0x211a16);
        if (c.u > 0.42 && c.u < 0.8 && c.sy < 0.45 && c.sy > 0.1 && side > 0.8) o = col(0x211a16);
      }
      return o;
    }),
    extras(c) { arcHorns(c, { t: 0.2, a: 66, elev0: 88, elev1: -12, out0: 8, out1: 14, len: 0.84, r0: 0.03, r1: 0.005, n: 34, sub: 1, ridge: 0.1, ridges: 17, ridgeTo: 0.8 }); },
  });
}
{
  // mountain nyala (bull)
  const C = { base: 0x8a7a6a, back: 0x7b6c5d, belly: 0x9a8a78, leg: 0xa98a66, muzzle: 0x2e2621, face: 0x7a6a5b, jaw: 0xe2dccf, ear: 0x7a6a5b, earIn: 0xe8d9cf, tail: 0x7b6c5d };
  Q.nyala = ext(antelope, {
    H: 1.3, L: 1.05, chest: 0.46, belly: 0.5, wChest: 0.155, wBelly: 0.195, radial: 24, sub: 7,
    neck: { len: 0.42, ang: 44, w0: 0.11, t0: 0.16, b0: 0.2 }, head: { len: 0.3, pitch: 40 },
    ears: { len: 0.48, w: 0.18, out: 62, shape: 'round', y: 0.55 },
    crest: { s0: 0, s1: 0.95, h: 0.03, w: 0.01, col: 0x4a3f36 },
    tail: { len: 0.3, r: 0.03, type: 'bushy', bush: 0.5, a0: 70, a1: 86 },
    coat: stdCoat(C, (o, c) => {
      if (c.part === 'body') {
        o = mixCol(o, W, vstripes(c.p[0], c.p[1], 4, -0.3, 0.1, 0.01) * sstep(-0.1, 0.25, c.sy) * 0.6);
        const w = worley(c.p[0] * 14, c.p[1] * 14, c.p[2] * 14);
        if (c.p[0] < -0.2 && c.sy < 0.2 && c.sy > -0.5) o = mixCol(o, W, sstep(0.2, 0.1, w[0]) * 0.8);
      }
      if (c.part === 'neck' && c.sy < -0.3 && (Math.abs(c.s - 0.85) < 0.06 || Math.abs(c.s - 0.3) < 0.06)) o = W;
      if (c.part === 'head' && c.sy > 0.1 && Math.abs(c.u - 0.4 + Math.abs(Math.cos(c.a)) * 0.07) < 0.03) o = W;
      return o;
    }),
    extras(c) {
      spiralHorns(c, { t: 0.2, a: 62, elev: 58, out: 22, len: 0.6, rad: 0.06, turns: 1.4, r0: 0.03, r1: 0.005, n: 28, col: 0x38302a, phase: 0.4 });
      backCrest(c, 0.25, 0.86, 0.022, 0.008, 0x3e342c);
    },
  });
}
{
  // impala (ram)
  const C = { base: 0xb06c3a, back: 0xa5622f, belly: 0xefe9da, leg: 0xc79a66, muzzle: 0x2a211c, face: 0xb47a48, jaw: 0xefe9da, ear: 0xb06c3a, earIn: 0xf0e8dc, tail: 0xefe9da, bellyAt: -0.5 };
  Q.impala = ext(antelope, {
    H: 0.92, L: 1.0, chest: 0.42, belly: 0.57, tuck: 0.63, wChest: 0.125, wBelly: 0.155, wHip: 0.14,
    leg: { bone: 0.021, arm: 0.042, m: 0.9 },
    neck: { len: 0.44, ang: 50, w0: 0.09, t0: 0.13, b0: 0.16, w1: 0.058, t1: 0.075, b1: 0.085 }, head: { len: 0.29, pitch: 38 },
    tail: { len: 0.26, r: 0.022, type: 'bushy', bush: 0.4 },
    coat: stdCoat(C, (o, c) => {
      if (c.part === 'body') {
        o = mixCol(o, 0xcfa26c, sstep(0.1, -0.25, c.sy) * sstep(-0.5, -0.3, c.sy)); // tan flank band
        if (c.p[0] < -0.4 && Math.abs(Math.abs(Math.cos(c.a)) - 0.75) < 0.12 && c.sy > 0) o = K; // rump stripes
      }
      if (c.part === 'leg' && c.which === 'h' && c.ly < 0.14 && c.ly > 0.07 && c.sy < -0.2) o = K;
      if (c.part === 'tail' && c.sy > 0.5) o = K;
      return o;
    }),
    extras(c) { arcHorns(c, { t: 0.2, a: 62, efn: (t) => 80 - 55 * Math.sin(t * 2.6) + 50 * sstep(0.55, 1, t), ofn: (t) => 30 * Math.cos(t * 3.4), len: 0.72, r0: 0.024, r1: 0.004, n: 32, sub: 1, ridge: 0.12, ridges: 16, ridgeTo: 0.75, col: 0x231f1c }); },
  });
}
{
  // blue wildebeest
  const C = { base: 0x6e6a67, back: 0x625e5b, belly: 0x5d5956, leg: 0x7a6a58, muzzle: 0x161412, face: 0x1b1816, jaw: 0x1b1816, ear: 0x55504c, earIn: 0x8a8078, tail: 0x151311 };
  Q.wildebeest = ext(antelope, {
    H: 1.35, L: 1.0, croup: 0.87, withers: 1.03, chest: 0.5, belly: 0.5, tuck: 0.57, wChest: 0.17, wBelly: 0.185, wHip: 0.15, radial: 24, sub: 6,
    leg: { bone: 0.026, arm: 0.052, m: 1.0 },
    neck: { len: 0.34, ang: 14, w0: 0.12, t0: 0.17, b0: 0.22, w1: 0.09, t1: 0.11, b1: 0.13, bend: 0.06, y: 0.8 },
    head: { type: 'bovine', len: 0.4, pitch: 48, w: 0.8, d: 0.9 }, ears: { len: 0.3, w: 0.1, out: 85, y: 0.3, t: 0.13 },
    crest: { s0: -0.3, s1: 0.95, h: 0.05, w: 0.014, col: 0x131110 },
    tail: { len: 0.38, r: 0.016, type: 'tuft', tuftLen: 0.42, tuftR: 0.045, a0: 72, a1: 88 },
    coat: stdCoat(C, (o, c) => {
      if (c.part === 'body' && c.p[0] > 0.0) o = mixCol(o, 0x3a3735, band(c.p[0] * 16 + 0.3 * noise3(c.p[0] * 5, c.p[1] * 8, 0), 0.4, 0.2) * sstep(-0.3, 0.2, c.sy) * sstep(0.0, 0.12, c.p[0]) * 0.8);
      if (c.part === 'neck') o = mixCol(o, 0x3a3735, band(c.s * 6, 0.4, 0.2) * 0.8);
      return o;
    }),
    extras(c) {
      cowHorns(c, { t: 0.13, z0: 0.1, span: 0.62, drop: 0.2, rise: 0.5, r0: 0.11, r1: 0.014, back: 0.2, hook: 1.6 });
      dewlap(c, [1.0, 0.8, 0.55, 0.3, 0.05], [0.03, 0.08, 0.09, 0.07, 0.02], 0.02, 0x141210, 'flat');
    },
  });
}
{
  // Grant's gazelle
  const C = { base: 0xc79a62, back: 0xbd8e56, belly: 0xf1ecde, leg: 0xcfa770, muzzle: 0x2a211c, face: 0xc79a62, jaw: 0xf1ecde, ear: 0xc79a62, earIn: 0xf0e8dc, tail: 0xf1ecde, bellyAt: -0.45 };
  Q.gazelle = ext(antelope, {
    H: 0.86, L: 0.98, chest: 0.42, belly: 0.57, tuck: 0.63, wChest: 0.125, wBelly: 0.15, wHip: 0.135,
    leg: { bone: 0.02, arm: 0.04, m: 0.9 },
    neck: { len: 0.46, ang: 54, w0: 0.09, t0: 0.13, b0: 0.16, w1: 0.056, t1: 0.072, b1: 0.082 }, head: { len: 0.28, pitch: 36 },
    tail: { len: 0.2, r: 0.012, type: 'tuft', tuftLen: 0.08, tuftR: 0.02 },
    coat: stdCoat(C, (o, c) => {
      if (c.part === 'body') {
        if (c.sy < -0.28 && c.sy > -0.46 && c.p[0] > -0.36 && c.p[0] < 0.34) o = mixCol(o, 0x3a2a1e, 0.85);
        if (c.p[0] < -0.44) o = Math.abs(Math.cos(c.a)) > 0.8 && c.sy > -0.2 ? K : W;
      }
      if (c.part === 'head') {
        if (c.sy > 0.2 && c.sy < 0.75 && c.u > 0.3 && c.u < 0.8) o = W;
        if (c.sy > 0.75 && c.u > 0.45 && c.u < 0.75) o = col(0x4a2e1c);
        if (c.sy > -0.1 && c.sy < 0.2 && c.u > 0.36 && c.u < 0.8) o = col(0x2a1c14);
      }
      return o;
    }),
    extras(c) { arcHorns(c, { t: 0.2, a: 62, efn: (t) => 78 - 30 * Math.sin(t * 3.0) + 25 * sstep(0.6, 1, t), ofn: (t) => 26 - 22 * sstep(0.5, 1, t), len: 0.62, r0: 0.026, r1: 0.004, n: 30, sub: 1, ridge: 0.12, ridges: 15, ridgeTo: 0.8, col: 0x231f1c }); },
  });
}
{
  // klipspringer
  const C = { base: 0x9a8850, back: 0x8a7a48, belly: 0xd8d0b8, leg: 0xa89a66, muzzle: 0x2a221c, face: 0xa08a52, jaw: 0xd8d0b8, ear: 0x8a7a48, earIn: 0xf0e8dc, tail: 0x8a7a48 };
  Q.klipspringer = ext(antelope, {
    H: 0.55, L: 1.02, croup: 1.06, dip: -0.03, chest: 0.5, belly: 0.46, tuck: 0.52, wChest: 0.17, wBelly: 0.21, wHip: 0.19,
    leg: { bone: 0.028, arm: 0.055, m: 1.0, fet: 0.1, fd: 0.07, footSize: 0.8 },
    neck: { len: 0.27, ang: 50, w0: 0.13, t0: 0.17, b0: 0.2, w1: 0.095, t1: 0.12, b1: 0.13 }, head: { len: 0.36, pitch: 30, w: 1.15, d: 1.1 },
    ears: { len: 0.4, w: 0.16, out: 40, shape: 'round' }, tail: { len: 0.1, r: 0.03 },
    coat: stdCoat(C, (o, c) => (c.part === 'body' || c.part === 'neck' ? mixCol(o, 0x4a4024, 0.45 * noise3(c.p[0] * 60, c.p[1] * 60, c.p[2] * 60)) : o)),
    extras(c) { simpleHorns(c, { t: 0.2, a: 62, elev: 84, out: 10, len: 0.2, r0: 0.02, r1: 0.004, n: 8, col: 0x1e1a17 }); },
  });
}
{
  // hippopotamus
  const C = { base: 0x6c5a56, back: 0x5a4a48, belly: 0xa88078, leg: 0x7a6560, muzzle: 0x8a6a64, face: 0x6c5a56, jaw: 0xa88078, ear: 0x6c5a56, earIn: 0xa88078, tail: 0x5a4a48, sockHi: 0.3, sockLo: 0.1 };
  Q.hippo = {
    H: 1.5, L: 1.85, croup: 0.98, dip: 0.02, chest: 0.72, belly: 0.2, tuck: 0.27, wChest: 0.3, wBelly: 0.38, wHip: 0.33, square: 0.15, radial: 24,
    leg: { type: 'pillar', bone: 0.085, arm: 0.11, sh: 0.18, thigh: 0.2, gask: 0.12, knee: 0.5, hock: 0.2, fet: 0.06, nails: true, ang: 0.4, zTop: 0.55, stance: 0.2 },
    neck: { len: 0.26, ang: -14, w0: 0.27, t0: 0.26, b0: 0.3, w1: 0.2, t1: 0.2, b1: 0.24, bend: 0.03, at: 0.93, y: 0.62 },
    head: { st: [[0, .3, .26, .3], [.15, .37, .32, .38], [.33, .35, .3, .38], [.52, .3, .2, .34], [.72, .35, .2, .33], [.9, .41, .23, .31], [1, .33, .14, .2]], len: 0.5, pitch: 18, eye: [0.33, 0.88, 0.02], nostrils: false, square: 0.3, radial: 18 },
    ears: { t: 0.16, y: 0.8, len: 0.1, w: 0.045, out: 35, back: 10, shape: 'round' },
    tail: { len: 0.18, r: 0.03, a0: 75, a1: 88 }, stride: 0.1, walkLift: false,
    coat: stdCoat(C, (o, c) => mixCol(o, 0x3a302e, 0.3 * fbm(c.p[0] * 8, c.p[1] * 8, c.p[2] * 8))),
    extras(c) {
      const { HG, hp, hl } = c;
      for (const s of [-1, 1]) {
        HG.add('skin', ellipsoid(hp(0.33, 62, 0.92, s), [hl * 0.07, hl * 0.06, hl * 0.06], { seg: 8, rings: 6 }), null, 0x6c5a56); // eye turrets
        HG.add('flat', ellipsoid(hp(0.93, 72, 0.98, s), [hl * 0.035, hl * 0.02, hl * 0.03], { seg: 6, rings: 4 }), null, 0x1a1414);
      }
    },
  };
}
// ---- cats -------------------------------------------------------------------
Q.cheetah = ext(catBase, {
  H: 0.8, L: 1.28, chest: 0.47, belly: 0.62, tuck: 0.72, wChest: 0.125, wBelly: 0.13, wHip: 0.115, croup: 0.99, radial: 36, sub: 8,
  leg: { bone: 0.032, arm: 0.05, gask: 0.055, thigh: 0.14, m: 0.9, sub: 5, radial: 12 },
  neck: { len: 0.32, ang: 30, w0: 0.1, t0: 0.13, b0: 0.16, w1: 0.08, t1: 0.09, b1: 0.1, sub: 5, radial: 16 },
  head: { len: 0.27, pitch: 14, sub: 5, radial: 18 }, ears: { len: 0.18, w: 0.1 },
  tail: { len: 0.95, r: 0.03, a0: 62, a1: 84, curl: 50, tip: 0.8, n: 12 },
  coat: spotCoat({ base: 0xcfa25e, back: 0xc29450, belly: 0xefe6d0, leg: 0xcfa25e, muzzle: 0xf0e8d6, face: 0xcfa25e, jaw: 0xf0e8d6, tail: 0xd8b878, ear: 0x2a2018, earIn: 0xe0d0b0 }, { kind: 'spot', cell: 0.052, r: 0.34, tailRings: 7 }),
  extras(c) {
    const { HG, hp, hl } = c;
    for (const s of [-1, 1]) HG.add('flat', tube([hp(0.52, 12, 1.01, s), hp(0.66, -8, 1.02, s), hp(0.82, -40, 1.02, s)], hl * 0.014, { radial: 4, sub: 2 }), null, 0x15110e); // tear lines
  },
});
Q.leopard = ext(catBase, {
  H: 0.7, L: 1.42, chest: 0.52, belly: 0.5, tuck: 0.57, wChest: 0.165, wBelly: 0.185, wHip: 0.165, radial: 40, sub: 9,
  leg: { bone: 0.05, arm: 0.078, sub: 5, radial: 12 }, neck: { len: 0.32, ang: 16, sub: 5, radial: 16 },
  head: { len: 0.4, pitch: 12, sub: 5, radial: 18 },
  tail: { len: 1.2, r: 0.038, a0: 55, a1: 82, curl: 75, tip: 0.8, n: 12 },
  coat: spotCoat({ base: 0xc9a05a, back: 0xbb8c44, belly: 0xf1e9d6, leg: 0xcfa866, muzzle: 0xf0e8d6, face: 0xc9a05a, jaw: 0xf0e8d6, tail: 0xcfa866, ear: 0x1c1612, earIn: 0xe0d0b0 }, { kind: 'rosette', cell: 0.085, fill: 0xb07c38, tailRings: 9 }),
});
// ---- dogs & hyena ---------------------------------------------------------
{
  const C = { base: 0xa8926c, back: 0x9a8460, belly: 0xb8a684, leg: 0x4a3c30, muzzle: 0x1e1915, face: 0x8a7658, jaw: 0x3a302a, ear: 0x6a5a48, earIn: 0x9a8a78, tail: 0x3a2e26, sockHi: 0.45, sockLo: 0.15 };
  Q.hyena = ext(dog, {
    H: 0.85, L: 1.08, croup: 0.8, chest: 0.47, belly: 0.5, tuck: 0.56, wChest: 0.16, wBelly: 0.17, wHip: 0.135, radial: 28, sub: 6,
    leg: { bone: 0.038, arm: 0.058, thigh: 0.13, m: 1.05 },
    neck: { len: 0.4, ang: 26, w0: 0.14, t0: 0.18, b0: 0.2, w1: 0.115, t1: 0.13, b1: 0.14, bend: 0.04, y: 0.82 },
    head: { type: 'bear', len: 0.37, pitch: 14, nose: true, noseR: 0.07, w: 1.05 },
    ears: { len: 0.22, w: 0.13, out: 30, shape: 'round' },
    crest: { s0: -0.3, s1: 0.9, h: 0.035, w: 0.014, col: 0x6a5a48 },
    tail: { len: 0.3, r: 0.03, type: 'bushy', a0: 70, a1: 86, bush: 0.6 },
    coat: stdCoat(C, (o, c) => {
      if (c.part === 'body' || c.part === 'neck' || (c.part === 'leg' && c.ly > 0.35)) {
        const w = worley(c.p[0] * 11, c.p[1] * 11, c.p[2] * 11);
        o = mixCol(o, 0x2e241c, sstep(0.33, 0.2, w[0]) * 0.8 * (c.part === 'neck' ? 0.5 : 1));
      }
      return o;
    }),
  });
}
{
  const tan = col(0xb98a4a), blk = col(0x1c1815);
  Q.wilddog = ext(dog, {
    H: 0.72, L: 1.1, chest: 0.42, belly: 0.62, tuck: 0.7, radial: 28, sub: 6,
    leg: { bone: 0.027, arm: 0.042, m: 0.95, sub: 4 },
    neck: { len: 0.34, ang: 30 }, head: { len: 0.36, pitch: 14, w: 1.1 },
    ears: { len: 0.42, w: 0.2, out: 30, shape: 'round', t: 0.17 },
    tail: { len: 0.48, r: 0.03, type: 'bushy', a0: 62, a1: 84 },
    coat: (c) => {
      const p = c.p;
      if (c.part === 'ear') return c.sy > 0 ? blk : col(0x8a7060);
      if (c.part === 'head') return mixCol(tan, blk, Math.max(sstep(0.45, 0.7, c.u), sstep(0.75, 1, c.sy) * 0.9));
      if (c.part === 'tail') return c.u > 0.55 ? W : c.u > 0.3 ? blk : tan;
      const n1 = fbm(p[0] * 5 + 3, p[1] * 5, p[2] * 5 + 1), n2 = fbm(p[0] * 6 + 40, p[1] * 6 + 9, p[2] * 6);
      let o = mixCol(tan, blk, sstep(0.42, 0.52, n1));
      o = mixCol(o, W, sstep(0.62, 0.68, n2));
      if (c.part === 'leg' && c.ly < 0.3) o = mixCol(o, W, sstep(0.5, 0.56, n2 + 0.2));
      return o;
    },
  });
}
{
  const C = { base: 0xb47a40, back: 0x2c2a2a, belly: 0xe2d6bc, leg: 0xb8803f, muzzle: 0xb47a40, face: 0xb47a40, jaw: 0xe8e0cc, ear: 0xb47a40, earIn: 0xe8dcc8, tail: 0x8a6a48, backAt: 0.3 };
  Q.jackal = ext(dog, {
    H: 0.42, L: 1.15, chest: 0.44, belly: 0.6, tuck: 0.66,
    leg: { bone: 0.027, arm: 0.042, m: 0.95 },
    neck: { len: 0.36, ang: 32 }, head: { len: 0.4, pitch: 14, w: 0.95 },
    ears: { len: 0.42, w: 0.15, out: 18, shape: 'point' },
    tail: { len: 0.72, r: 0.045, type: 'bushy', a0: 50, a1: 78 },
    coat: stdCoat(C, (o, c) => {
      if ((c.part === 'body' || c.part === 'neck') && c.sy > 0.3) o = mixCol(o, 0xc8c4bc, 0.6 * noise3(c.p[0] * 50, c.p[1] * 50, c.p[2] * 50) * sstep(0.3, 0.5, c.sy));
      if (c.part === 'tail' && c.u > 0.6) o = K;
      return o;
    }),
  });
}
// ---- pigs -------------------------------------------------------------------
{
  const C = { base: 0x6c645d, back: 0x5d5650, belly: 0x756c64, leg: 0x625a54, muzzle: 0x4a423c, face: 0x665e57, ear: 0x625a54, earIn: 0x8a7a70, tail: 0x5d5650 };
  Q.warthog = ext(pig, {
    H: 0.7, L: 1.25, chest: 0.56, belly: 0.4, tuck: 0.47,
    head: { st: [[0, .19, .2, .22], [.16, .25, .25, .26], [.36, .26, .2, .24], [.58, .2, .12, .16], [.84, .17, .09, .11], [1, .14, .08, .09]], len: 0.52, pitch: 24, eye: [0.3, 0.75, 0.02], nostrils: false },
    ears: { len: 0.2, w: 0.07, out: 40, back: 20, shape: 'point', t: 0.12, y: 0.75 },
    crest: { s0: -1.2, s1: 1.0, h: 0.07, w: 0.02, col: 0x3a2e24, taper: true },
    tail: { len: 0.3, r: 0.012, a0: 75, a1: 88, type: 'tuft', tuftLen: 0.06, tuftR: 0.02 },
    coat: stdCoat(C, (o, c) => mixCol(o, 0x3d3631, 0.3 * fbm(c.p[0] * 12, c.p[1] * 12, c.p[2] * 12))),
    extras(c) {
      const { HG, hp, hl } = c;
      backCrest(c, 0.4, 0.86, 0.06, 0.018, 0x3a2e24);
      for (const s of [-1, 1]) {
        HG.add('skin', ellipsoid(hp(0.42, -5, 1.0, s), [hl * 0.05, hl * 0.045, hl * 0.06], { seg: 8, rings: 6 }), null, 0x5d5650); // warts
        HG.add('skin', ellipsoid(hp(0.72, 5, 1.0, s), [hl * 0.03, hl * 0.03, hl * 0.035], { seg: 6, rings: 5 }), null, 0x5d5650);
        const b = hp(0.88, -20, 0.8, s);
        HG.add('bone', horn(curve((t) => [b[0] - hl * 0.04 * t - hl * 0.1 * t * t, b[1] + hl * (0.05 * t + 0.3 * t * t), b[2] + s * hl * 0.3 * Math.sin(t * 2.2)], 10), hl * 0.035, hl * 0.006, { radial: 7 }), null, 0xe6dcc4);
      }
      HG.add('skin', ellipsoid([hl * 0.99, 0, 0], [hl * 0.03, hl * 0.085, hl * 0.13], { seg: 10, rings: 6 }), null, 0x3a3230);
    },
  });
}
{
  const C = { base: 0x7a4a2e, back: 0x6a3e26, belly: 0x4a2e22, leg: 0x2e221c, muzzle: 0x2a201c, face: 0xa89a88, jaw: 0x6a5a50, ear: 0x3a2a20, earIn: 0x8a7a70, tail: 0x3a2a20 };
  Q.bushpig = ext(pig, {
    H: 0.7, L: 1.2, chest: 0.6, belly: 0.36, tuck: 0.42, wBelly: 0.21, croup: 0.95,
    head: { type: 'pig', len: 0.4, pitch: 24, eye: [0.4, 0.6, 0.02], nostrils: false, w: 1.1, d: 1.1 },
    ears: { len: 0.26, w: 0.07, out: 40, back: 25, shape: 'point', t: 0.12, y: 0.75 },
    crest: { s0: -1.0, s1: 1.0, h: 0.06, w: 0.02, col: 0xd8ccb4, taper: true },
    coat: stdCoat(C, (o, c) => mixCol(o, 0x2e1c12, 0.35 * noise3(c.p[0] * 40, c.p[1] * 12, c.p[2] * 40))),
    extras(c) {
      const { HG, hl } = c;
      backCrest(c, 0.3, 0.86, 0.05, 0.016, 0xd8ccb4);
      HG.add('skin', ellipsoid([hl * 0.99, 0, 0], [hl * 0.025, hl * 0.08, hl * 0.085], { seg: 10, rings: 6 }), null, 0x2a2220);
      for (const s of [-1, 1]) HG.add('bone', horn([[hl * 0.82, -hl * 0.05, s * hl * 0.09], [hl * 0.8, hl * 0.02, s * hl * 0.13], [hl * 0.77, hl * 0.07, s * hl * 0.14]], hl * 0.02, hl * 0.005, { radial: 6 }), null, 0xe6dcc4);
    },
  });
}
// ---- monkeys ----------------------------------------------------------------
{
  const C = { base: 0x6a6040, back: 0x5a5236, belly: 0xc8c0a8, leg: 0x5a5236, muzzle: 0xc03020, face: 0x4a5a8a, jaw: 0xd8b860, ear: 0x9a7060, earIn: 0x9a7060, tail: 0x5a5236 };
  Q.mandrill = ext(dog, {
    H: 0.56, L: 1.05, croup: 0.92, chest: 0.5, belly: 0.5, tuck: 0.58, wChest: 0.17, wBelly: 0.18, wHip: 0.16,
    leg: { bone: 0.04, arm: 0.062, m: 1.1, thigh: 0.15 },
    neck: { len: 0.2, ang: 24, w0: 0.15, t0: 0.18, b0: 0.2, w1: 0.13, t1: 0.15, b1: 0.15 },
    head: { st: [[0, .26, .27, .26], [.2, .33, .34, .3], [.42, .31, .27, .3], [.6, .2, .15, .22], [.84, .17, .13, .19], [1, .13, .09, .13]], len: 0.5, pitch: 14, eye: [0.44, 0.5, 0.03], nose: false, nostrils: true, eyeCol: 0x5a3a14 },
    ears: { len: 0.1, w: 0.07, out: 50, shape: 'round', t: 0.2, y: 0.3 },
    tail: { len: 0.12, r: 0.02, a0: -40, a1: -20 },
    poses: ['stand', 'walk', 'sit'],
    coat: stdCoat(C, (o, c) => {
      if (c.part === 'head') {
        const side = Math.abs(Math.cos(c.a));
        if (c.u < 0.42) o = c.sy < -0.2 ? col(0xd8b860) : mixCol(0x6a6040, 0x3a3424, sstep(0.6, 1, c.sy));
        else if (c.sy > 0.72) o = col(0xc03020); // red nose stripe
        else if (c.sy > -0.25) o = mixCol(0x4a66a8, 0x8aa0d8, band(c.sy * 5, 0.5)); // ridged blue cheeks
        else o = col(0xe0c070); // beard
        if (c.u > 0.9 && c.sy > 0.2) o = col(0xc03020);
      }
      if (c.part === 'body' && c.p[0] < -0.42) o = mixCol(0x8a70c0, 0xc05070, sstep(0.3, -0.5, c.sy));
      return o;
    }),
    extras(c) { dewlap(c, [1.15, 0.9, 0.6, 0.3], [0.04, 0.1, 0.09, 0.03], 0.05, 0xe0c070, 'flat'); },
  });
}
{
  const fur = col(0x191716);
  Q.colobus = ext(dog, {
    H: 0.42, L: 1.2, croup: 1.0, chest: 0.5, belly: 0.5, tuck: 0.56, wChest: 0.15, wBelly: 0.17, wHip: 0.15,
    leg: { bone: 0.035, arm: 0.05, m: 1.0, thigh: 0.14 },
    neck: { len: 0.2, ang: 30, w0: 0.14, t0: 0.16, b0: 0.18, w1: 0.12, t1: 0.14, b1: 0.14 },
    head: { st: [[0, .3, .3, .28], [.25, .4, .4, .36], [.52, .38, .34, .36], [.74, .26, .2, .28], [.92, .2, .14, .22], [1, .13, .08, .13]], len: 0.36, pitch: 8, eye: [0.62, 0.4, 0.045], nose: false, nostrils: true },
    ears: null, tail: { len: 1.0, r: 0.03, a0: 25, a1: 84, n: 10, tip: 0.9, type: 'tuft', tuftLen: 0.45, tuftR: 0.08, tuftCol: 0xf0ece2 },
    poses: ['stand', 'walk', 'sit'],
    coat: (c) => {
      if (c.part === 'head') { const r = c.u > 0.5 && c.u < 0.72; return r || (c.u > 0.5 && Math.abs(c.sy) > 0.8) ? W : (c.u >= 0.72 ? col(0x2a2624) : fur); }
      if (c.part === 'tail') return mixCol(fur, W, sstep(0.45, 0.7, c.u));
      return fur;
    },
    extras(c) {
      // white mantle: long fringe along the flanks from shoulder to rump
      for (const s of [-1, 1]) {
        const st = [];
        for (let i = 0; i <= 6; i++) { const t = lerp(0.1, 0.88, i / 6); st.push({ p: [c.tx(t), lerp(c.T.bot(t), c.T.top(t), 0.45), s * c.T.w(t) * 0.96], rx: 0.035, ry: 0.1 * Math.sin(Math.PI * (0.15 + 0.7 * i / 6)) + 0.03, ryb: 0.22 * Math.sin(Math.PI * (0.15 + 0.7 * i / 6)) + 0.04 }); }
        c.TG.add('flat', loft(st, { radial: 8, sub: 2, capBulge: 0.3 }), null, 0xf0ece2);
      }
    },
  });
}

// ===========================================================================
// GROUP 3 — North America, Asia, Arctic
// ===========================================================================
{
  const mk = (base, dark, pale) => stdCoat({ base, back: dark, belly: dark, leg: dark, muzzle: pale, face: base, jaw: dark, ear: dark, earIn: dark, tail: dark, sockHi: 0.5, sockLo: 0.25 },
    (o, c) => mixCol(o, pale, 0.3 * noise3(c.p[0] * 30, c.p[1] * 30, c.p[2] * 30) * (c.part === 'body' && c.sy > 0.2 ? 1 : 0.3)));
  Q.brownbear = ext(bear, { H: 1.52, pose: 'upright', poses: ['upright', 'walk', 'stand', 'sit'], coat: mk(0x6e4c30, 0x4a3020, 0xb89868), withers: 1.07, croup: 0.9, uprightAngle: 66, armSwing: -48 });
  Q.polarbear = ext(bear, {
    H: 1.45, L: 1.32, wBelly: 0.23, chest: 0.54,
    neck: { len: 0.44, ang: 4, w0: 0.16, t0: 0.18, b0: 0.2, w1: 0.12, t1: 0.13, b1: 0.14 }, head: { len: 0.36, w: 0.82, d: 0.85, pitch: 16, noseCol: 0x111111 }, ears: { len: 0.13, w: 0.07 },
    leg: { clawCol: 0x1a1a1a },
    coat: stdCoat({ base: 0xe9e4d0, back: 0xf0ecde, belly: 0xd8d0b4, leg: 0xe2dcc4, muzzle: 0xe6e0cc, ear: 0xd8d0b4, earIn: 0x5a504a }),
  });
  const pk = col(0x1a1817);
  Q.panda = ext(bear, {
    H: 0.75, L: 1.2, wBelly: 0.27, wChest: 0.22, chest: 0.6, belly: 0.36, pose: 'stand', poses: ['stand', 'walk', 'sit'], sitAngle: 52,
    neck: { len: 0.22, ang: 8, w0: 0.19, t0: 0.2, b0: 0.22, w1: 0.17, t1: 0.18, b1: 0.18 }, head: { len: 0.44, w: 1.2, d: 1.12, pitch: 14, st: [[0, .3, .3, .3], [.2, .4, .37, .35], [.46, .4, .33, .34], [.66, .25, .19, .26], [.86, .17, .13, .2], [1, .11, .08, .12]] },
    ears: { len: 0.2, w: 0.12, out: 42, cIn: 0x1a1817, cOut: 0x1a1817 }, leg: { claws: 0.02 },
    coat: (c) => {
      const p = c.p;
      if (c.part === 'leg' || c.part === 'ear') return pk;
      if (c.part === 'body') return p[0] > 0.2 && p[0] < 0.5 ? pk : W; // shoulder band
      if (c.part === 'head') { const e = Math.hypot((c.u - 0.5) * 2.2, c.sy - 0.4, 0); return e < 0.33 && Math.abs(Math.cos(c.a)) > 0.45 ? pk : W; }
      return W;
    },
  });
}
{
  // American bison
  const C = { base: 0x6a4a34, back: 0x5a3e2a, belly: 0x4a3324, leg: 0x2e2019, muzzle: 0x1e1814, face: 0x2a1e17, jaw: 0x241a14, ear: 0x2a1e17, earIn: 0x3a2a20, tail: 0x4a3324, sockHi: 0.55, sockLo: 0.4 };
  const dk = col(0x2c1f17);
  Q.bison = {
    H: 1.8, L: 1.2, croup: 0.74, dip: 0, chest: 0.62, belly: 0.4, tuck: 0.46, wChest: 0.19, wBelly: 0.2, wHip: 0.15, withers: 1.0, radial: 24,
    torso: [[0, .6, .46, .06], [.05, .72, .4, .12], [.16, .76, .45, .15], [.3, .79, .44, .185], [.45, .84, .41, .2], [.6, .93, .39, .2], [.73, 1.0, .37, .2], [.84, 0.98, .36, .19], [.94, .86, .42, .16], [1, .74, .5, .09]],
    leg: { type: 'hoof', bone: 0.034, arm: 0.07, thigh: 0.15, m: 1.1, hock: 0.28, footSize: 1.15 }, legF: { arm: 0.085, elbowY: 0.42 },
    neck: { len: 0.26, ang: -22, w0: 0.17, t0: 0.26, b0: 0.24, w1: 0.14, t1: 0.17, b1: 0.17, bend: 0.08, at: 0.93, y: 0.7 },
    head: { type: 'bovine', len: 0.34, pitch: 52, w: 1.1 }, ears: { len: 0.22, w: 0.08, out: 80, y: 0.3 },
    tail: { len: 0.3, r: 0.014, type: 'tuft', tuftLen: 0.1, tuftR: 0.025, a0: 75, a1: 88, dy: -0.12 },
    coat: stdCoat(C, (o, c) => (c.part === 'body' ? mixCol(o, dk, sstep(0.08, 0.26, c.p[0])) : c.part === 'neck' ? dk : o)),
    extras(c) {
      const { HG, hl, hp } = c;
      arcHorns(c, { t: 0.14, a: 30, elev0: 60, elev1: 95, out0: 80, out1: -5, len: 0.2, r0: 0.03, r1: 0.006, n: 10, col: 0x1c1815 });
      HG.add('flat', ellipsoid([hl * 0.2, hp(0.2, 90)[1] + hl * 0.02, 0], [hl * 0.3, hl * 0.2, hl * 0.33], { seg: 12, rings: 8 }), null, 0x241a14); // woolly crown
      dewlap(c, [1.25, 1.0, 0.7, 0.3, -0.1], [0.06, 0.16, 0.13, 0.1, 0.03], 0.05, 0x1f1611, 'flat'); // beard + chest wool
      for (const s of [-1, 1]) c.out.add('flat', ellipsoid([c.xS, 0.3, s * 0.1], [0.07, 0.1, 0.06], { seg: 8, rings: 6 }), null, 0x241a14); // "chaps"
    },
  };
}
{
  // moose (bull)
  const C = { base: 0x3e2e25, back: 0x34261f, belly: 0x2e211b, leg: 0xa39683, muzzle: 0x6a5a4c, face: 0x3e2e25, jaw: 0x4a3a30, ear: 0x4a3a30, earIn: 0x9a8a7a, tail: 0x34261f, sockHi: 0.52, sockLo: 0.36 };
  Q.moose = {
    H: 1.95, L: 0.9, croup: 0.9, dip: 0.0, chest: 0.42, belly: 0.56, tuck: 0.6, wChest: 0.14, wBelly: 0.165, wHip: 0.14, withers: 1.06,
    leg: { type: 'hoof', bone: 0.024, arm: 0.045, m: 0.95, thigh: 0.14 },
    neck: { len: 0.3, ang: 14, w0: 0.12, t0: 0.17, b0: 0.2, w1: 0.085, t1: 0.11, b1: 0.12, bend: 0.03, y: 0.8 },
    head: { st: [[0, .15, .16, .19], [.14, .2, .2, .23], [.32, .19, .19, .22], [.55, .15, .15, .19], [.78, .16, .16, .19], [.93, .17, .15, .18], [1, .12, .08, .11]], len: 0.37, pitch: 38 },
    ears: { len: 0.34, w: 0.1, out: 45, back: 20 }, tail: { len: 0.06, r: 0.02 },
    coat: stdCoat(C),
    extras(c) {
      dewlap(c, [1.05, 0.85, 0.65], [0.02, 0.11, 0.03], 0.02, 0x2a1e18); // bell
      antlers(c, {
        t: 0.17, a: 40, elev0: 25, elev1: 35, out0: 80, out1: 70, len: 0.16, r0: 0.03, r1: 0.026, col: 0xb39a70, tines: [],
        palm(c2, s, pts) {
          const o = pts[pts.length - 1], A = c2.ldir(35, 72, s), B = c2.ldir(38, -12, s);
          const fn = (u, v) => {
            const th = lerp(-1.0, 1.25, u), R = 0.36 * (0.6 + 0.42 * Math.pow(Math.abs(Math.sin(u * Math.PI * 4.5)), 0.6)) * (0.75 + 0.25 * Math.sin(u * Math.PI)), r = R * v;
            const cup = 0.05 * v * v;
            return [o[0] + (A[0] * Math.cos(th) + B[0] * Math.sin(th)) * r - 0.02, o[1] + (A[1] * Math.cos(th) + B[1] * Math.sin(th)) * r + cup, o[2] + (A[2] * Math.cos(th) + B[2] * Math.sin(th)) * r];
          };
          sheet(c2.HG, 27, 3, fn, 0xb39a70, 0xa48a62, 'bone');
        },
      });
    },
  };
}
{
  // wolf
  const C = { base: 0x8a857c, back: 0x5a5650, belly: 0xd8d2c4, leg: 0xb8ae9c, muzzle: 0xd8d2c4, face: 0x8a857c, jaw: 0xe2dccf, ear: 0x6a655c, earIn: 0xcfc8b8, tail: 0x7a756c, backAt: 0.1 };
  Q.wolf = ext(dog, {
    H: 0.8, L: 1.12, chest: 0.45, belly: 0.57, tuck: 0.64, wChest: 0.14, wBelly: 0.16,
    leg: { bone: 0.034, arm: 0.052 }, neck: { len: 0.34, ang: 24, w0: 0.13, t0: 0.17, b0: 0.19, w1: 0.1, t1: 0.115, b1: 0.125 }, head: { len: 0.38, pitch: 14 },
    tail: { len: 0.52, r: 0.04, type: 'bushy', a0: 62, a1: 82 },
    coat: stdCoat(C, (o, c) => (c.part === 'tail' && c.u > 0.8 ? col(0x2a2826) : mixCol(o, 0x3a3835, 0.3 * noise3(c.p[0] * 40, c.p[1] * 40, c.p[2] * 40)))),
  });
}
{
  // elk (wapiti)
  const C = { base: 0xb39c78, back: 0xa8906c, belly: 0x5a4030, leg: 0x4a3324, muzzle: 0x2a1e17, face: 0x5a3e2c, jaw: 0x6a4e3a, ear: 0x5a3e2c, earIn: 0xb8a890, tail: 0xe0d4b8, sockHi: 0.55, sockLo: 0.42 };
  Q.elk = ext(deer, {
    H: 1.5, L: 1.05, chest: 0.46, belly: 0.5, tuck: 0.57, wChest: 0.15, wBelly: 0.19,
    leg: { bone: 0.027, arm: 0.052 }, neck: { len: 0.46, ang: 48, w0: 0.115, t0: 0.17, b0: 0.22, w1: 0.075, t1: 0.1, b1: 0.12 }, head: { len: 0.32, pitch: 34 },
    coat: stdCoat(C, (o, c) => {
      if (c.part === 'neck') o = col(0x4e3626);
      if (c.part === 'body') { o = mixCol(o, 0x4e3626, sstep(0.36, 0.46, c.p[0])); if (c.p[0] < -0.4) o = mixCol(o, 0xe0d4b8, 0.9); }
      return o;
    }),
    extras(c) {
      antlers(c, { t: 0.17, a: 62, elev0: 72, elev1: 28, out0: 34, out1: 6, len: 0.82, r0: 0.026, r1: 0.008, tines: [[0.03, 165, 14, 0.24, 0.5], [0.12, 150, 22, 0.24, 0.5], [0.34, 120, 24, 0.22, 0.6], [0.55, 95, 10, 0.3, 0.3], [0.75, 80, 6, 0.2, 0.3], [0.9, 70, 0, 0.12, 0.3]] });
      dewlap(c, [0.95, 0.7, 0.4, 0.1], [0.02, 0.07, 0.08, 0.03], 0.03, 0x3e2a1e, 'flat');
    },
  });
}
{
  // caribou
  const C = { base: 0x75624e, back: 0x685645, belly: 0xd8d0c0, leg: 0x6a5846, muzzle: 0x2a201a, face: 0x5a4838, jaw: 0xcfc6b6, ear: 0x8a7a68, earIn: 0xd8cfc0, tail: 0xe8e2d4, bellyAt: -0.5 };
  Q.caribou = ext(deer, {
    H: 1.25, L: 1.08, chest: 0.47, belly: 0.5, tuck: 0.56, wChest: 0.15, wBelly: 0.19,
    leg: { bone: 0.027, arm: 0.05, footSize: 1.35 }, neck: { len: 0.4, ang: 22, w0: 0.115, t0: 0.16, b0: 0.24, w1: 0.08, t1: 0.1, b1: 0.14, y: 0.8 }, head: { type: 'bovine', len: 0.32, pitch: 30, w: 0.75, d: 0.85 },
    ears: { len: 0.28, w: 0.1, out: 55 },
    coat: stdCoat(C, (o, c) => {
      if (c.part === 'neck') o = mixCol(0xe6e0d2, o, sstep(0.3, -0.15, c.s) * 0.8);
      if (c.part === 'body') { o = mixCol(o, 0xe6e0d2, sstep(0.34, 0.5, c.p[0]) * 0.85); if (c.sy < -0.25 && c.sy > -0.45) o = mixCol(o, 0x3a2c22, 0.6); }
      if (c.part === 'leg' && c.ly < 0.09) o = W;
      return o;
    }),
    extras(c) {
      antlers(c, { t: 0.17, a: 62, efn: (t) => 38 + 85 * sstep(0.25, 1, t), ofn: (t) => 30 - 22 * t, len: 0.95, r0: 0.022, r1: 0.009, tines: [[0.03, 172, 4, 0.3, 0.25], [0.14, 150, 18, 0.26, 0.4], [0.8, 60, 8, 0.18, 0.2], [0.9, 85, 4, 0.2, 0.2], [1.0, 110, 0, 0.16, 0.2], [0.55, 20, 10, 0.1, 0.3]] });
      dewlap(c, [0.95, 0.7, 0.4, 0.1], [0.015, 0.045, 0.06, 0.03], 0.02, 0xeae4d6, 'flat');
    },
  });
}
{
  // white-tailed deer (buck)
  const C = { base: 0xa9764a, back: 0x996a40, belly: 0xf0eadc, leg: 0xb58456, muzzle: 0x2a201a, face: 0xa9764a, jaw: 0xf0eadc, ear: 0xa9764a, earIn: 0xf0e8dc, tail: 0xf0eadc, bellyAt: -0.5 };
  Q.deer = ext(deer, {
    H: 1.0, L: 1.02, chest: 0.42, belly: 0.56, tuck: 0.62, wChest: 0.125, wBelly: 0.16, wHip: 0.14,
    leg: { bone: 0.02, arm: 0.04, m: 0.9 }, neck: { len: 0.46, ang: 52, w0: 0.095, t0: 0.14, b0: 0.18, w1: 0.062, t1: 0.08, b1: 0.09 }, head: { len: 0.29, pitch: 34 },
    tail: { len: 0.22, r: 0.035, type: 'bushy', bush: 0.5, a0: 60, a1: 82 },
    coat: stdCoat(C, (o, c) => {
      if (c.part === 'neck' && c.s > 0.8 && c.sy < -0.2) o = W; // throat patch
      if (c.part === 'head' && c.u > 0.72 && c.u < 0.84) o = W;
      if (c.part === 'tail' && c.sy > 0.3) o = col(0x996a40);
      return o;
    }),
    extras(c) { antlers(c, { t: 0.17, a: 60, efn: (t) => 62 + 95 * sstep(0.1, 0.9, t), ofn: (t) => 42 - 44 * t, len: 0.56, r0: 0.02, r1: 0.007, tines: [[0.1, 95, 10, 0.1, 0.2], [0.42, 92, 10, 0.24, 0.1], [0.66, 95, 5, 0.2, 0.1], [0.85, 100, 0, 0.12, 0.1]] }); },
  });
}
{
  // mountain goat
  const C = { base: 0xeeeadd, back: 0xf2efe4, belly: 0xe2dccb, leg: 0xe8e3d4, muzzle: 0xcfc8b8, ear: 0xe8e3d4, earIn: 0xd0c0b0, tail: 0xeeeadd };
  Q.mountaingoat = ext(antelope, {
    H: 1.0, L: 1.12, croup: 0.92, withers: 1.04, chest: 0.6, belly: 0.38, tuck: 0.42, wChest: 0.18, wBelly: 0.21, wHip: 0.19,
    leg: { bone: 0.042, arm: 0.08, m: 1.3, thigh: 0.18, gask: 0.09, hock: 0.26, footSize: 0.9 },
    neck: { len: 0.3, ang: 20, w0: 0.14, t0: 0.19, b0: 0.22, w1: 0.1, t1: 0.12, b1: 0.14, bend: 0.05 }, head: { len: 0.33, pitch: 40, d: 1.05 },
    ears: { len: 0.26, w: 0.08, out: 60 }, tail: { len: 0.1, r: 0.03 }, hoofCol: 0x1c1a18,
    coat: stdCoat(C, (o, c) => (c.part === 'head' && c.u > 0.9 ? col(0x2a2622) : o)),
    extras(c) {
      simpleHorns(c, { t: 0.2, a: 66, elev: 80, out: 8, len: 0.22, r0: 0.02, r1: 0.004, sweep: 40, n: 10, col: 0x1a1816 });
      dewlap(c, [1.15, 1.0, 0.82], [0.02, 0.07, 0.02], 0.014, 0xeeeadd, 'flat'); // beard
    },
  });
}
{
  // bighorn sheep (ram)
  const C = { base: 0x8a6a50, back: 0x7a5c44, belly: 0xece6d8, leg: 0x7a5c44, muzzle: 0xece6d8, face: 0x8a6a50, jaw: 0xdcd4c4, ear: 0x8a6a50, earIn: 0xdcd0c0, tail: 0x3a2a20, bellyAt: -0.55 };
  Q.bighorn = ext(antelope, {
    H: 1.0, L: 1.08, chest: 0.5, belly: 0.47, tuck: 0.53, wChest: 0.17, wBelly: 0.2, wHip: 0.18,
    leg: { bone: 0.03, arm: 0.06, m: 1.1, thigh: 0.165 },
    neck: { len: 0.32, ang: 34, w0: 0.13, t0: 0.18, b0: 0.21, w1: 0.095, t1: 0.12, b1: 0.13 }, head: { len: 0.31, pitch: 40, w: 1.05 },
    ears: { len: 0.2, w: 0.07, out: 70, y: 0.4, t: 0.16 }, tail: { len: 0.1, r: 0.02 },
    coat: stdCoat(C, (o, c) => {
      if (c.part === 'body' && c.p[0] < -0.4 && c.sy < 0.85) o = W;
      if (c.part === 'leg' && c.sy < -0.3 && c.ly < 0.5) o = W;
      return o;
    }),
    extras(c) {
      const { ldir, hp } = c;
      horns(c, (t, s) => {
        const b = hp(0.2, 60, 0.88, s), bk = ldir(0, 0, s), up = ldir(90, 0, s), ph = t * 1.72 * Math.PI, R = 0.135 * (1 - 0.25 * t);
        const a = R * Math.sin(ph), d = R * (Math.cos(ph) - 1), z = s * (0.02 + 0.22 * t * t + 0.04 * t);
        return [b[0] + bk[0] * a + up[0] * d, b[1] + bk[1] * a + up[1] * d, b[2] + z];
      }, 0.055, 0.008, { n: 26, sub: 1, pow: 1.1, ridge: 0.07, ridges: 13, ridgeTo: 0.9, radial: 8, col: 0x8a7a62 });
    },
  });
}
{
  // muskox
  const C = { base: 0x3a2a20, back: 0x4a3828, belly: 0x2a1e17, leg: 0xcfc4ac, muzzle: 0xb8ac98, face: 0x30231b, ear: 0x3a2a20, earIn: 0x3a2a20, tail: 0x2a1e17, sockHi: 0.2, sockLo: 0.12 };
  Q.muskox = {
    H: 1.3, L: 1.3, croup: 0.86, dip: 0, chest: 0.78, belly: 0.2, tuck: 0.22, wChest: 0.24, wBelly: 0.27, wHip: 0.24, withers: 1.0,
    torso: [[0, .7, .3, .1], [.05, .82, .22, .19], [.16, .87, .2, .24], [.3, .88, .19, .265], [.45, .9, .19, .275], [.6, .95, .19, .275], [.73, 1.0, .2, .26], [.84, 0.99, .22, .24], [.94, .9, .3, .2], [1, .78, .42, .12]],
    leg: { type: 'hoof', bone: 0.045, arm: 0.07, m: 1.1, thigh: 0.16, hock: 0.2, kneeY: 0.16, fet: 0.07, footSize: 1.1 }, legF: { elbowY: 0.3 }, legH: { stifleY: 0.3 },
    neck: { len: 0.2, ang: -18, w0: 0.2, t0: 0.25, b0: 0.25, w1: 0.16, t1: 0.17, b1: 0.18, bend: 0.05, at: 0.94, y: 0.66 },
    head: { type: 'bovine', len: 0.36, pitch: 46, w: 1.05 }, ears: { len: 0.15, w: 0.06, out: 85, y: 0.2 }, tail: { len: 0.06, r: 0.03 },
    coat: stdCoat(C, (o, c) => (c.part === 'body' ? mixCol(o, 0xb09a78, sstep(0.5, 1, c.sy) * sstep(0.3, 0.0, Math.abs(c.p[0] - 0.05)) * 0.8) : o)),
    extras(c) {
      const { HG, hp, hl } = c, top = hp(0.14, 90)[1];
      HG.add('bone', ellipsoid([hl * 0.16, top + hl * 0.01, 0], [hl * 0.2, hl * 0.1, hl * 0.34], { seg: 12, rings: 8 }), null, 0xb8a888);
      horns(c, (t, s) => {
        const z = hl * (0.2 + 0.2 * Math.sin(Math.min(1, t * 1.6) * 1.57) + 0.2 * sstep(0.6, 1, t));
        const y = top - hl * (0.62 * Math.sin(Math.min(1, t * 1.35) * 1.57)) + hl * 0.38 * sstep(0.62, 1, t);
        return [hl * (0.16 + 0.3 * t), y, s * z];
      }, hl * 0.11, hl * 0.014, { n: 14, pow: 0.9, radial: 8, col: 0xa89878 });
    },
  };
}
// ---- more cats --------------------------------------------------------------
Q.jaguar = ext(catBase, {
  H: 0.75, L: 1.36, chest: 0.55, belly: 0.46, tuck: 0.53, wChest: 0.19, wBelly: 0.21, wHip: 0.185, radial: 40, sub: 9,
  leg: { bone: 0.058, arm: 0.09, sub: 5, radial: 12 }, neck: { len: 0.28, ang: 14, w0: 0.15, t0: 0.19, b0: 0.21, w1: 0.13, t1: 0.14, b1: 0.15, sub: 5, radial: 16 },
  head: { len: 0.45, pitch: 12, w: 1.05, sub: 5, radial: 18 },
  tail: { len: 0.85, r: 0.04, a0: 55, a1: 82, curl: 65, tip: 0.8, n: 12 },
  coat: spotCoat({ base: 0xcc9a48, back: 0xbd8636, belly: 0xf1e9d6, leg: 0xd0a252, muzzle: 0xf0e8d6, face: 0xcc9a48, jaw: 0xf0e8d6, tail: 0xd0a252, ear: 0x1c1612, earIn: 0xe0d0b0 }, { kind: 'jag', cell: 0.115, fill: 0xa8712a, tailRings: 8 }),
});
Q.cougar = ext(catBase, {
  H: 0.7, L: 1.4, chest: 0.5, belly: 0.52, tuck: 0.6, wChest: 0.155, wBelly: 0.17, wHip: 0.155,
  leg: { bone: 0.046, arm: 0.072 }, neck: { len: 0.32, ang: 18 }, head: { len: 0.33, pitch: 12, w: 0.95 }, ears: { len: 0.2, w: 0.1 },
  tail: { len: 1.15, r: 0.04, a0: 55, a1: 82, curl: 60, tip: 0.85, n: 12 },
  coat: stdCoat({ base: 0xb58a5a, back: 0xa67a4a, belly: 0xe8dcc4, leg: 0xb58a5a, muzzle: 0xf0e8d8, jaw: 0xf0e8d8, tail: 0xa67a4a, ear: 0x3a2a20, earIn: 0xd8c8b0, sockHi: 0.2, sockLo: 0.05 }, (o, c) => (c.part === 'tail' && c.u > 0.85 ? col(0x2a1e17) : o)),
});
{
  const C = { base: 0xcc7a2e, back: 0xc06c22, belly: 0xf2ecde, leg: 0xcf8236, muzzle: 0xf2ecde, face: 0xcc7a2e, jaw: 0xf2ecde, tail: 0xd8a060, ear: 0x1a1512, earIn: 0xf0e8dc, bellyAt: -0.4, sockHi: 0.2, sockLo: 0.05 };
  Q.tiger = ext(catBase, {
    H: 1.0, L: 1.4, chest: 0.53, belly: 0.47, tuck: 0.54, wChest: 0.18, wBelly: 0.2, wHip: 0.175, radial: 36, sub: 9,
    leg: { bone: 0.055, arm: 0.086, sub: 6, radial: 12 }, neck: { len: 0.3, ang: 16, w0: 0.15, t0: 0.18, b0: 0.21, w1: 0.13, t1: 0.14, b1: 0.15, sub: 6, radial: 16 },
    head: { len: 0.42, pitch: 12, w: 1.05, sub: 5, radial: 18 },
    tail: { len: 0.95, r: 0.036, a0: 55, a1: 82, curl: 60, tip: 0.8, n: 14 },
    coat: stdCoat(C, (o, c) => {
      const p = c.p; let d = 0;
      if (c.part === 'body') d = band((p[0] + 0.05 * noise3(p[0] * 5, p[1] * 8, p[2] * 8) + 0.1 * (p[1] - 0.8)) * 12, 0.34, 0.12) * (noise3(p[0] * 7 + 9, p[1] * 3, p[2] * 3) > 0.22 ? 1 : 0.1) * sstep(-1, -0.8, c.sy);
      else if (c.part === 'neck') d = band(c.s * 6 + 0.2, 0.36, 0.14);
      else if (c.part === 'head') { d = band(c.u * 9 + 0.3 * Math.cos(c.a * 2), 0.32, 0.14) * sstep(0.62, 0.5, c.u) * sstep(-0.5, 0.2, c.sy); if (c.u > 0.3 && c.u < 0.62 && c.sy < 0.1) o = mixCol(o, 0xf2ecde, 0.8); }
      else if (c.part === 'leg') d = band(c.ly * 11 + 0.2 * noise3(p[0] * 9, p[1] * 2, p[2] * 9), 0.34, 0.14) * (c.inner < 0.2 ? 1 : 0.2) * sstep(0.1, 0.2, c.ly);
      else if (c.part === 'tail') d = c.u > 0.9 ? 1 : band(c.u * 10, 0.42, 0.14);
      return mixCol(o, K, d * 0.95);
    }),
    extras(c) { // cheek ruff
      const { HG, hl } = c;
      for (const s of [-1, 1]) HG.add('skin', ellipsoid([hl * 0.3, -hl * 0.14, s * hl * 0.36], [hl * 0.16, hl * 0.2, hl * 0.1], { seg: 8, rings: 6 }), null, 0xf2ecde);
    },
  });
}
// ---- Asian megafauna --------------------------------------------------------
Q.indianelephant = indianElephant;
Q.indianrhino = ext(rhinoBase, {
  H: 1.75, L: 1.5, wBelly: 0.3, head: { len: 0.42, pitch: 30 },
  coat: (() => {
    const base = rhinoCoat(0x7d7872, 0x4c4843), d = col(0x403c38);
    return (c) => {
      let o = base(c);
      if (c.part === 'body') {
        const x = c.p[0];
        const fold = Math.max(sstep(0.03, 0, Math.abs(x - 0.2)), sstep(0.03, 0, Math.abs(x + 0.3)), sstep(0.03, 0, Math.abs(x - 0.52))) * sstep(-0.95, -0.5, c.sy);
        o = mixCol(o, d, 0.8 * fold);
        const w = worley(x * 22, c.p[1] * 22, c.p[2] * 22);
        o = mixCol(o, 0x989288, sstep(0.3, 0.15, w[0]) * 0.35 * (x < -0.3 || x > 0.2 ? 1 : 0.2)); // tubercles
      }
      return o;
    };
  })(),
  extras(c) {
    rhinoHorns(c, [[0.84, 0.42, 0.11, 98, 14]]);
    // armour plates: raised shoulder and rump shields
    const cf = (x, y, z) => c.coat({ part: 'body', sy: 0.2, p: [x, y, z], u: 0.5, a: 0 });
    for (const s of [-1, 1]) {
      lump(c.TG, [0.37, 0.66, s * 0.17], [0.19, 0.3, 0.1], cf);
      lump(c.TG, [-0.52, 0.62, s * 0.17], [0.22, 0.3, 0.1], cf);
    }
  },
});
{
  const C = { base: 0x3a3836, back: 0x302e2d, belly: 0x44403d, leg: 0x6a655f, muzzle: 0x1e1c1b, face: 0x34322f, ear: 0x3a3836, earIn: 0x6a6058, tail: 0x302e2d, sockHi: 0.3, sockLo: 0.18 };
  Q.waterbuffalo = {
    H: 1.7, L: 1.3, croup: 0.96, dip: 0.035, chest: 0.56, belly: 0.38, tuck: 0.45, wChest: 0.19, wBelly: 0.255, wHip: 0.21,
    leg: { type: 'hoof', bone: 0.04, arm: 0.07, thigh: 0.17, gask: 0.075, m: 1.15, hock: 0.31, footSize: 1.25 },
    neck: { len: 0.36, ang: 2, w0: 0.14, t0: 0.18, b0: 0.22, w1: 0.105, t1: 0.125, b1: 0.14, bend: 0.03, y: 0.78 },
    head: { type: 'bovine', len: 0.36, pitch: 22, w: 0.85 }, ears: { len: 0.3, w: 0.1, out: 95, y: 0.2, t: 0.16 },
    tail: { len: 0.55, r: 0.016, a0: 75, a1: 88, type: 'tuft', tuftLen: 0.12, tuftR: 0.028 },
    coat: stdCoat(C),
    extras(c) {
      arcHorns(c, { base: (s) => c.hp(0.13, 42, 0.9, s), efn: (t) => 10 + 55 * t, ofn: (t) => 82 - 95 * t * t, len: 0.6, r0: 0.045, r1: 0.007, n: 20, sub: 1, flat: 1.5, ridge: 0.06, ridges: 12, col: 0x2a2826 });
    },
  };
}
