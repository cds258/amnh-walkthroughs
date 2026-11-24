// Marine animals for the Milstein Hall of Ocean Life.
// Convention (all model libraries): metres, y up, lowest point at y = 0, head towards +X, symmetric about z = 0.
// build(name, opts) returns a Geo using materials 'wetskin'/'skin' (vertex-coloured, mottled), 'flat', 'gloss'.
import * as THREE from 'three';
import { Geo, col, mixCol, shade, mulberry } from '../engine/builder.js';
import { loft, tube, ellipsoid, plate, spike } from './loft.js';

function lift(g) {
  // translate so the lowest vertex sits on y = 0
  let min = Infinity;
  for (const b of g.buckets.values()) for (const ch of b.chunks) for (let i = 1; i < ch.pos.length; i += 3) if (ch.pos[i] < min) min = ch.pos[i];
  if (!isFinite(min) || Math.abs(min) < 1e-6) return g;
  const out = new Geo();
  out.addGeo(g, new THREE.Matrix4().makeTranslation(0, -min, 0));
  return out;
}

/** Streamlined body (whales, dolphins, sharks, fish). spec.st: [[t, rx, ryTop, ryBottom], ...] with t = 0 at the snout. */
function body(L, st, pathFn, colorFn, o = {}) {
  const stations = st.map(([t, rx, ry, ryb]) => {
    const [y, z] = pathFn(t);
    return { p: [L / 2 - t * L, y, z], rx, ry, ryb: ryb ?? ry };
  });
  return loft(stations, { radial: o.radial || 28, sub: o.sub || 6, color: colorFn, uvLen: L / 2, uvAround: 4, capBulge: 0.4 });
}

/** A fin: flattened loft from root outward. pts: [[x,y,z, halfChord, halfThick], ...] */
function fin(pts, color, o = {}) {
  const cc = color != null ? col(color) : null;
  return loft(pts.map((p) => ({ p: [p[0], p[1], p[2]], rx: p[3], ry: p[4] })), { radial: 10, sub: 4, up: o.up || [0, 1, 0], color: cc ? () => cc : undefined, capBulge: 0.2 });
}

// ---------------------------------------------------------------------------
// Blue whale — after the 94-foot fibreglass model in the Milstein Hall (diving pose)
// ---------------------------------------------------------------------------
function blueWhale() {
  const g = new Geo();
  const L = 28.6;
  const path = (t) => [1.9 * Math.sin(Math.PI * Math.min(1, t * 1.02)) - 1.5 * (1 - t) * (1 - t) + 0.9 * t * t * t, 0.7 * Math.sin(Math.PI * t * 1.15) - 0.25];
  const dorsal = col(0x48657f), flank = col(0x5d7b94), belly = col(0xa7b9c6), groove = col(0x6f8497);
  const colorFn = (u, a, p, sy) => {
    // counter-shading with ~70 ventral pleats running from the chin to the navel
    let c = sy > 0.15 ? mixCol(flank, dorsal, Math.min(1, (sy - 0.15) * 1.6)) : mixCol(flank, belly, Math.min(1, (0.15 - sy) * 1.9));
    if (sy < -0.02 && u < 0.58) {
      const k = Math.cos(a * 72) * 0.5 + 0.5;
      const fade = Math.min(1, (0.58 - u) * 12) * Math.min(1, (-0.02 - sy) * 6);
      c = mixCol(c, groove, k * k * 0.75 * fade);
    }
    return c;
  };
  const st = [
    [0.0, 0.34, 0.16, 0.2], [0.025, 1.0, 0.36, 0.5], [0.08, 1.5, 0.62, 1.15], [0.16, 1.78, 1.0, 1.75],
    [0.26, 1.92, 1.42, 2.0], [0.36, 1.95, 1.62, 1.95], [0.47, 1.82, 1.66, 1.75], [0.58, 1.5, 1.52, 1.45],
    [0.69, 1.08, 1.26, 1.15], [0.79, 0.68, 0.98, 0.86], [0.88, 0.36, 0.72, 0.6], [0.95, 0.2, 0.42, 0.36], [1.0, 0.13, 0.2, 0.2],
  ];
  g.add('wetskin', body(L, st, path, colorFn, { radial: 144, sub: 8 }));
  const P = (t, dy = 0, dz = 0) => { const [y, z] = path(t); return [L / 2 - t * L, y + dy, z + dz]; };

  // flippers (long, slender, swept back and down)
  for (const s of [-1, 1]) {
    const r = P(0.3);
    g.add('wetskin', fin([
      [r[0], r[1] - 1.1, r[2] + s * 1.75, 0.62, 0.16],
      [r[0] - 0.7, r[1] - 1.75, r[2] + s * 2.6, 0.6, 0.13],
      [r[0] - 1.7, r[1] - 2.3, r[2] + s * 3.5, 0.48, 0.1],
      [r[0] - 2.7, r[1] - 2.6, r[2] + s * 4.2, 0.3, 0.07],
      [r[0] - 3.3, r[1] - 2.7, r[2] + s * 4.55, 0.1, 0.04],
    ], flank, { up: [0.2, 1, s * 0.5] }));
  }
  // flukes
  const tl = P(1.0), tp = P(0.96);
  for (const s of [-1, 1]) {
    g.add('wetskin', fin([
      [tp[0], tp[1], tp[2] + s * 0.05, 0.75, 0.16],
      [tl[0] + 0.1, tl[1] + 0.12, tl[2] + s * 1.2, 0.95, 0.13],
      [tl[0] - 0.35, tl[1] + 0.3, tl[2] + s * 2.4, 0.72, 0.1],
      [tl[0] - 0.95, tl[1] + 0.42, tl[2] + s * 3.2, 0.42, 0.07],
      [tl[0] - 1.45, tl[1] + 0.48, tl[2] + s * 3.6, 0.12, 0.04],
    ], dorsal));
  }
  // small dorsal fin three-quarters of the way back
  const d = P(0.76);
  g.add('wetskin', plate([[0.55, 0], [0.1, 0.42], [-0.28, 0.5], [-0.2, 0.3], [-0.5, 0]], [d[0], d[1] + 1.0, d[2]], [1, 0, 0], [0, 1, 0], 0.09, { bevel: true }), null, dorsal);
  // splash guard and blowholes on top of the head
  const b = P(0.17);
  g.add('wetskin', ellipsoid([b[0], b[1] + 0.98, b[2]], [0.85, 0.22, 0.42]), null, dorsal);
  // eyes just above the corner of the mouth
  const e = P(0.2);
  for (const s of [-1, 1]) g.add('gloss', ellipsoid([e[0], e[1] - 0.25, e[2] + s * 1.74], [0.09, 0.07, 0.05]), null, 0x0a0c10);
  // jaw line: a dark seam from the snout back to the eye
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = 0.012 + (0.2 - 0.012) * i / 10;
      const [y, z] = path(t);
      const rx = 0.34 + (1.86 - 0.34) * Math.pow(i / 10, 0.55);
      pts.push([L / 2 - t * L, y + 0.06 - 0.28 * (i / 10), z + s * (rx - 0.02)]);
    }
    g.add('flat', tube(pts, 0.035, { radial: 5 }), null, 0x26323c);
  }
  return lift(g);
}

// ---------------------------------------------------------------------------
// Generic streamlined swimmer: dolphins, sharks, tunas, reef fish
// ---------------------------------------------------------------------------
function swimmer(sp) {
  const g = new Geo();
  const L = sp.L;
  const bend = sp.bend ?? 0.06;
  const path = (t) => [L * (sp.arch ?? 0) * Math.sin(Math.PI * t), L * bend * Math.sin(Math.PI * (t * 1.3 - 0.1))];
  const top = col(sp.top), side = col(sp.side ?? sp.top), belly = col(sp.belly);
  const mark = sp.mark;
  const colorFn = (u, a, p, sy) => {
    let c = sy > 0.2 ? mixCol(side, top, Math.min(1, (sy - 0.2) * 2)) : mixCol(side, belly, Math.min(1, (0.2 - sy) * 2.2));
    if (mark) c = mark(u, a, sy, c);
    return c;
  };
  g.add(sp.mat || 'wetskin', body(L, sp.st, path, colorFn, { radial: sp.radial || 16, sub: sp.sub || 5 }));
  const P = (t, dy = 0, dz = 0) => { const [y, z] = path(t); return [L / 2 - t * L, y + dy, z + dz]; };
  const rAt = (t) => { // interpolate half-width / heights at t
    const st = sp.st; let i = 0; while (i < st.length - 2 && st[i + 1][0] < t) i++;
    const a = st[i], b = st[i + 1], f = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
    return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, (a[3] ?? a[2]) + ((b[3] ?? b[2]) - (a[3] ?? a[2])) * f];
  };
  const fc = sp.finCol ?? sp.top;
  // tail
  const tl = P(1.0);
  if (sp.tail === 'fluke') {
    for (const s of [-1, 1]) g.add(sp.mat || 'wetskin', fin([
      [tl[0] + L * 0.03, tl[1], tl[2] + s * L * 0.004, L * 0.035, L * 0.008],
      [tl[0], tl[1], tl[2] + s * L * 0.06, L * 0.05, L * 0.007],
      [tl[0] - L * 0.03, tl[1] + L * 0.004, tl[2] + s * L * 0.11, L * 0.03, L * 0.005],
      [tl[0] - L * 0.05, tl[1] + L * 0.006, tl[2] + s * L * 0.135, L * 0.008, L * 0.003],
    ], fc));
  } else {
    const h = (sp.tailH ?? 0.14) * L, lo = sp.tail === 'shark' ? 0.55 : 1;
    g.add('flat_ds', plate([[0.02 * L, 0], [-0.06 * L, h], [-0.085 * L, h * 0.98], [-0.03 * L, 0.01 * L], [-0.07 * L, -h * lo], [-0.05 * L, -h * lo * 1.02]], [tl[0] + 0.02 * L, tl[1], tl[2]], [1, 0, 0], [0, 1, 0], L * 0.006), null, fc);
  }
  // dorsal fin
  if (sp.dorsal) {
    const [t, h, len, rake = 0.6] = sp.dorsal;
    const d = P(t), r = rAt(t);
    g.add('flat_ds', plate([[len * 0.5, 0], [-len * rake * 0.3, h], [-len * rake * 0.55, h * 0.92], [-len * 0.5, 0]], [d[0], d[1] + r[1] * 0.92, d[2]], [1, 0, 0], [0, 1, 0], L * 0.008), null, fc);
  }
  // pectoral fins
  if (sp.pec) {
    const [t, len, chord] = sp.pec;
    const r0 = P(t), r = rAt(t);
    for (const s of [-1, 1]) g.add(sp.mat || 'wetskin', fin([
      [r0[0], r0[1] - r[2] * 0.45, r0[2] + s * r[0] * 0.85, chord, chord * 0.2],
      [r0[0] - len * 0.4, r0[1] - r[2] * 0.6 - len * 0.3, r0[2] + s * (r[0] * 0.85 + len * 0.5), chord * 0.8, chord * 0.14],
      [r0[0] - len * 0.8, r0[1] - r[2] * 0.6 - len * 0.5, r0[2] + s * (r[0] * 0.85 + len * 0.8), chord * 0.25, chord * 0.07],
    ], fc, { up: [0.2, 1, s * 0.4] }));
  }
  // eyes
  const et = sp.eye ?? 0.1;
  const e = P(et), er = rAt(et);
  for (const s of [-1, 1]) g.add('gloss', ellipsoid([e[0], e[1] + er[1] * 0.15, e[2] + s * er[0] * 0.93], [L * 0.008, L * 0.008, L * 0.004]), null, 0x08090c);
  if (sp.extra) sp.extra(g, P, rAt, L);
  return lift(g);
}

const dolphin = (o = {}) => swimmer({ L: o.L || 2.6, arch: 0.05, bend: 0.03, top: 0x55606e, side: 0x7c8794, belly: 0xdcdfe0, tail: 'fluke',
  st: [[0, 0.02, 0.02], [0.05, 0.05, 0.045], [0.11, 0.075, 0.07, 0.07], [0.17, 0.13, 0.15, 0.13], [0.3, 0.19, 0.21, 0.2], [0.45, 0.2, 0.22, 0.21], [0.62, 0.15, 0.18, 0.17], [0.8, 0.07, 0.12, 0.1], [0.93, 0.03, 0.06, 0.05], [1, 0.015, 0.02]].map((r) => r.map((v, i) => (i ? v * (o.L || 2.6) / 2.6 * 1.25 : v))),
  dorsal: [0.47, 0.3, 0.42, 0.9], pec: [0.27, 0.42, 0.11], eye: 0.16 });

const orca = () => swimmer({ L: 6.5, arch: 0.04, bend: 0.03, top: 0x101216, side: 0x14161a, belly: 0xf0f0ec, tail: 'fluke',
  st: [[0, 0.1, 0.08], [0.06, 0.32, 0.26], [0.16, 0.58, 0.55], [0.32, 0.78, 0.8], [0.48, 0.76, 0.78], [0.66, 0.5, 0.6], [0.83, 0.22, 0.34], [0.94, 0.09, 0.16], [1, 0.04, 0.05]],
  dorsal: [0.42, 1.5, 0.9, 0.5], pec: [0.25, 1.0, 0.36], eye: 0.13,
  mark: (u, a, sy, c) => (u > 0.1 && u < 0.17 && sy > 0.25 && sy < 0.6 ? col(0xf0f0ec) : c) });

const shark = (o = {}) => swimmer({ L: o.L || 4.2, bend: 0.07, top: 0x5c6670, side: 0x77828c, belly: 0xe6e6e2, tail: 'shark', tailH: 0.17,
  st: [[0, 0.02, 0.02], [0.04, 0.1, 0.07], [0.12, 0.2, 0.17, 0.2], [0.26, 0.29, 0.28, 0.32], [0.42, 0.3, 0.3, 0.33], [0.6, 0.22, 0.24, 0.24], [0.78, 0.11, 0.14, 0.13], [0.92, 0.05, 0.07], [1, 0.03, 0.04]].map((r) => r.map((v, i) => (i ? v * (o.L || 4.2) / 4.2 * 1.35 : v))),
  dorsal: [0.38, 0.55 * (o.L || 4.2) / 4.2, 0.6 * (o.L || 4.2) / 4.2, 0.9], pec: [0.26, 0.75 * (o.L || 4.2) / 4.2, 0.2 * (o.L || 4.2) / 4.2], eye: 0.09 });

const tuna = (o = {}) => swimmer({ L: o.L || 2.2, bend: 0.04, top: 0x1c2c46, side: 0x7f8c98, belly: 0xd9dcda, tail: 'lunate', tailH: 0.17, finCol: 0x2a3440, mat: 'skin',
  st: [[0, 0.02, 0.03], [0.07, 0.11, 0.15], [0.2, 0.2, 0.28], [0.38, 0.23, 0.33], [0.56, 0.19, 0.28], [0.75, 0.1, 0.16], [0.9, 0.035, 0.05], [1, 0.02, 0.03]].map((r) => r.map((v, i) => (i ? v * (o.L || 2.2) / 2.2 : v))),
  dorsal: [0.36, 0.3, 0.35, 1.0], pec: [0.24, 0.42, 0.07], eye: 0.07 });

/** Small reef fish; o.hue picks one of several liveries. */
const reefFish = (o = {}) => {
  const liv = [[0xf2c230, 0xf2d24a, 0xf6f0c8], [0x2f6fd0, 0x3f8fe0, 0xe8e060], [0xe8642c, 0xf08a3c, 0xf6f0e6], [0x9a9fa6, 0xb6bcc2, 0xe6e8ea], [0x30343c, 0xd8d8d0, 0xf0f0e8]][(o.hue || 0) % 5];
  const L = o.L || 0.3;
  return swimmer({ L, bend: 0.05, top: liv[0], side: liv[1], belly: liv[2], tail: 'lunate', tailH: 0.2, finCol: liv[0], mat: 'skin', radial: 7, sub: 2,
    st: [[0, 0.02, 0.03], [0.1, 0.06, 0.16], [0.3, 0.09, 0.26], [0.55, 0.08, 0.24], [0.8, 0.035, 0.1], [1, 0.012, 0.05]].map((r) => r.map((v, i) => (i ? v * L / 0.3 * 0.3 / 1 : v))),
    dorsal: [0.4, L * 0.16, L * 0.5, 0.3], eye: 0.1 });
};

function spermWhale() {
  const g = new Geo();
  const L = 15;
  const path = (t) => [0.5 * Math.sin(Math.PI * t), 0.4 * Math.sin(Math.PI * t * 1.2)];
  const grey = col(0x4a4c52), pale = col(0x8a8c90);
  const st = [[0, 1.0, 1.15, 0.8], [0.03, 1.3, 1.45, 1.1], [0.15, 1.42, 1.55, 1.35], [0.3, 1.5, 1.6, 1.6], [0.45, 1.4, 1.5, 1.6], [0.62, 1.05, 1.2, 1.2], [0.78, 0.6, 0.85, 0.75], [0.9, 0.3, 0.5, 0.4], [1, 0.12, 0.15]];
  g.add('wetskin', body(L, st, path, (u, a, p, sy) => (sy < -0.6 && u > 0.2 && u < 0.6 ? mixCol(grey, pale, 0.5) : mixCol(grey, pale, Math.max(0, (Math.cos(a * 9 + u * 40) - 0.7)) * 0.5)), { radial: 20, sub: 6 }));
  const P = (t, dy = 0, dz = 0) => { const [y, z] = path(t); return [L / 2 - t * L, y + dy, z + dz]; };
  // narrow underslung jaw with teeth
  const j0 = P(0.04), j1 = P(0.22);
  g.add('wetskin', loft([{ p: [j0[0], j0[1] - 1.25, j0[2]], rx: 0.1, ry: 0.08 }, { p: [(j0[0] + j1[0]) / 2, j0[1] - 1.75, j0[2]], rx: 0.2, ry: 0.12 }, { p: [j1[0], j1[1] - 1.5, j1[2]], rx: 0.5, ry: 0.2 }], { radial: 8, sub: 4 }), null, 0xb9b9b4);
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) {
    const t = i / 9, x = j0[0] + (j1[0] - j0[0]) * t * 0.8, y = j0[1] - 1.22 - 0.42 * Math.sin(t * Math.PI * 0.6);
    g.add('bone', spike([x, y, j0[2] + s * (0.07 + 0.1 * t)], [x, y + 0.2, j0[2] + s * (0.08 + 0.12 * t)], 0.045, { seg: 5 }), null, 0xe8e2d0);
  }
  const tl = P(1.0);
  for (const s of [-1, 1]) g.add('wetskin', fin([[tl[0] + 0.5, tl[1], tl[2] + s * 0.05, 0.6, 0.12], [tl[0], tl[1], tl[2] + s * 1.0, 0.75, 0.1], [tl[0] - 0.4, tl[1], tl[2] + s * 1.8, 0.45, 0.07], [tl[0] - 0.7, tl[1], tl[2] + s * 2.1, 0.1, 0.04]], 0x44464c));
  const pf = P(0.28);
  for (const s of [-1, 1]) g.add('wetskin', fin([[pf[0], pf[1] - 1.1, pf[2] + s * 1.3, 0.45, 0.1], [pf[0] - 0.5, pf[1] - 1.5, pf[2] + s * 1.9, 0.4, 0.08], [pf[0] - 0.9, pf[1] - 1.7, pf[2] + s * 2.2, 0.15, 0.05]], 0x44464c));
  const e = P(0.2);
  for (const s of [-1, 1]) g.add('gloss', ellipsoid([e[0], e[1] - 0.5, e[2] + s * 1.42], [0.07, 0.06, 0.04]), null, 0x050506);
  return lift(g);
}

function giantSquid(o = {}) {
  const g = new Geo();
  const red = 0xb4533a, pale = 0xd9a48a;
  const rnd = mulberry(o.seed || 3);
  // mantle (pointing -x), head, eyes
  g.add('wetskin', loft([{ p: [-2.4, 0, 0], rx: 0.05, ry: 0.05 }, { p: [-1.8, 0, 0], rx: 0.2, ry: 0.2 }, { p: [-0.9, 0, 0], rx: 0.34, ry: 0.34 }, { p: [-0.1, 0, 0], rx: 0.36, ry: 0.36 }, { p: [0.15, 0, 0], rx: 0.26, ry: 0.26 }, { p: [0.5, 0, 0], rx: 0.24, ry: 0.22 }, { p: [0.75, 0, 0], rx: 0.16, ry: 0.15 }], { radial: 14, sub: 4, color: (u, a, p, sy) => mixCol(col(red), col(pale), Math.max(0, -sy) * 0.6) }));
  for (const s of [-1, 1]) {
    g.add('wetskin', plate([[0, 0], [-0.9, 0.45], [-1.0, 0.1], [-0.6, 0]], [-1.5, 0, s * 0.12], [1, 0, 0], [0, 0.25, s], 0.04), null, red);
    g.add('gloss', ellipsoid([0.45, 0.05, s * 0.21], [0.11, 0.11, 0.05]), null, 0x0c0c0e);
    g.add('gloss', ellipsoid([0.45, 0.05, s * 0.2], [0.14, 0.14, 0.04]), null, 0xd8d2b8);
  }
  // eight arms
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, len = 2.0 + rnd() * 0.8;
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, w = 0.25 + t * (0.5 + rnd() * 0.6);
      pts.push([0.75 + t * len, Math.sin(a) * w * 0.7 + Math.sin(t * 5 + i) * 0.18 * t, Math.cos(a) * w + Math.cos(t * 4 + i * 2) * 0.22 * t]);
    }
    g.add('wetskin', tube(pts, pts.map((_, k) => 0.07 * (1 - k / 6.6)), { radial: 6, sub: 3 }), null, i % 2 ? red : 0xa84a34);
  }
  // two long feeding tentacles with clubs
  for (const s of [-1, 1]) {
    const pts = [];
    for (let k = 0; k <= 9; k++) { const t = k / 9; pts.push([0.75 + t * 6.0, 0.25 * Math.sin(t * 7 + s) + 0.3 * t, s * (0.12 + 0.9 * Math.sin(t * 3.4))]); }
    g.add('wetskin', tube(pts, pts.map((_, k) => (k > 7 ? 0.075 : 0.035)), { radial: 6, sub: 3 }), null, red);
  }
  return lift(g);
}

function manatee() {
  const g = new Geo();
  const L = 3.0, grey = col(0x7c7a74), dark = col(0x5c5a56);
  const path = () => [0, 0];
  g.add('skin', body(L, [[0, 0.16, 0.14], [0.05, 0.24, 0.2], [0.14, 0.26, 0.24], [0.3, 0.44, 0.42], [0.5, 0.5, 0.48, 0.5], [0.7, 0.36, 0.34], [0.84, 0.2, 0.14], [0.93, 0.34, 0.06], [1, 0.3, 0.03]], path, (u, a, p, sy) => mixCol(grey, dark, Math.max(0, sy) * 0.6), { radial: 16 }));
  for (const s of [-1, 1]) {
    g.add('skin', fin([[0.55, -0.25, s * 0.38, 0.14, 0.05], [0.45, -0.5, s * 0.6, 0.15, 0.04], [0.35, -0.68, s * 0.7, 0.08, 0.03]], 0x6a6862, { up: [0.3, 1, s * 0.4] }));
    g.add('gloss', ellipsoid([1.15, 0.1, s * 0.2], [0.025, 0.025, 0.015]), null, 0x08080a);
  }
  return lift(g);
}

function seaTurtle() {
  const g = new Geo();
  g.add('skin', ellipsoid([0, 0, 0], [0.55, 0.16, 0.42], { seg: 14, rings: 8 }), null, 0x5a5a34);
  g.add('skin', ellipsoid([0, -0.07, 0], [0.5, 0.1, 0.38]), null, 0xd8cf9a);
  g.add('skin', loft([{ p: [0.45, 0, 0], rx: 0.1, ry: 0.08 }, { p: [0.7, 0.03, 0], rx: 0.1, ry: 0.09 }, { p: [0.84, 0.02, 0], rx: 0.05, ry: 0.05 }], { radial: 8 }), null, 0x7a7a4a);
  for (const s of [-1, 1]) {
    g.add('skin', fin([[0.3, -0.03, s * 0.36, 0.13, 0.03], [0.5, -0.06, s * 0.75, 0.12, 0.025], [0.3, -0.1, s * 1.05, 0.05, 0.02]], 0x6a6a3c));
    g.add('skin', fin([[-0.4, -0.03, s * 0.3, 0.1, 0.03], [-0.65, -0.05, s * 0.48, 0.07, 0.02]], 0x6a6a3c));
  }
  return lift(g);
}

function ray() {
  const g = new Geo();
  const out = [[0.9, 0], [0.5, 0.5], [0.1, 1.5], [-0.3, 1.2], [-0.6, 0.35], [-0.7, 0], [-0.6, -0.35], [-0.3, -1.2], [0.1, -1.5], [0.5, -0.5]];
  g.add('skin', plate(out, [0, 0, 0], [1, 0, 0], [0, 0, 1], 0.14, { bevel: true }), null, 0x4a4c52);
  g.add('skin', ellipsoid([0.1, 0.04, 0], [0.7, 0.14, 0.3]), null, 0x44464c);
  g.add('skin', tube([[-0.6, 0, 0], [-1.4, 0.02, 0.05], [-2.2, 0, 0]], [0.04, 0.02, 0.006], { radial: 5 }), null, 0x3a3c42);
  return lift(g);
}

function jelly(o = {}) {
  const g = new Geo();
  const rnd = mulberry(o.seed || 1);
  const bell = new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
  g.add('glassblue', bell, null, o.color ?? 0xf0c8e0);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * 6.28;
    const pts = [];
    for (let k = 0; k <= 4; k++) pts.push([Math.cos(a) * 0.15 + (rnd() - 0.5) * 0.08, 0.02 - k * 0.22, Math.sin(a) * 0.15 + (rnd() - 0.5) * 0.08]);
    g.add('flat', tube(pts, 0.006, { radial: 4, sub: 2 }), null, 0xf0d8e8);
  }
  return lift(g);
}

/** A loose school of n small fish (already distributed in a blob ~spread metres across), all heading +x. */
function school(o = {}) {
  const g = new Geo();
  const rnd = mulberry(o.seed || 7);
  const n = o.n || 30, spread = o.spread || 2;
  const one = reefFish({ hue: o.hue ?? 3, L: o.L || 0.22 });
  for (let i = 0; i < n; i++) {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3((rnd() - 0.5) * spread * 1.6, (rnd() - 0.5) * spread * 0.7 + spread * 0.4, (rnd() - 0.5) * spread),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.3)),
      new THREE.Vector3(1, 1, 1).multiplyScalar(0.7 + rnd() * 0.6));
    g.addGeo(one, m);
  }
  return lift(g);
}

const BUILDERS = { bluewhale: blueWhale, dolphin, orca, shark, tuna, reeffish: reefFish, spermwhale: spermWhale, giantsquid: giantSquid, manatee, seaturtle: seaTurtle, ray, jelly, school };
export const NAMES = Object.keys(BUILDERS);
export function build(name, opts = {}) {
  const f = BUILDERS[name];
  if (!f) throw new Error('unknown sealife model ' + name);
  return f(opts);
}
export const _unused = { shade };
