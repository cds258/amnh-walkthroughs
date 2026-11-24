// Special builders: birds, pinnipeds, reptiles. Authored directly in metres.
import { THREE, Geo, col, mixCol, loft, ellipsoid, tube, spike, D2R, lerp, clamp, sstep, noise3, fbm, worley, grid, sheet, leaf, horn, finish, seeded } from './core.js';

const K = col(0x151311), W = col(0xf0ece2);
const fixed = (c) => { const v = col(c); return () => v; };
const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

// ===========================================================================
// BIRDS
// ===========================================================================
/** body loft along an axis tilted `tilt` deg above horizontal through centre c. st: [d, rx, ryTop, ryBot] */
function birdBody(G, c, tilt, st, color, o = {}) {
  const a = tilt * D2R, ax = [Math.cos(a), Math.sin(a)];
  G.add('skin', loft(st.map(([d, rx, ry, ryb]) => ({ p: [c[0] + ax[0] * d, c[1] + ax[1] * d, 0], rx, ry, ryb })), { radial: o.radial || 16, sub: 4, up: [-ax[1], ax[0], 0], color, capBulge: 0.5 }));
  return (d, off = 0) => [c[0] + ax[0] * d - ax[1] * off, c[1] + ax[1] * d + ax[0] * off];
}
/** neck / tube through [x, y, r] points in the sagittal plane (optionally yawed about the first point) */
function neckTube(G, pts, color, yaw = 0, o = {}) {
  const b = pts[0], cy = Math.cos(yaw), sy = Math.sin(yaw);
  const P = pts.map((p, i) => { const k = i / (pts.length - 1), dx = p[0] - b[0]; return { p: [b[0] + dx * lerp(1, cy, k), p[1], -dx * sy * k], rx: p[2], ry: p[3] ?? p[2] }; });
  G.add(o.mat || 'skin', loft(P, { radial: o.radial || 10, sub: 4, color, capBulge: 0.4, up: o.up || [-1, 0, 0] }));
  return P[P.length - 1].p;
}
/** bird leg: joints [[x,y]...] at lateral z; toes */
function birdLeg(G, pts, rad, z, toe, colr, s) {
  G.add('skin', loft(pts.map((p, i) => ({ p: [p[0], p[1], z], rx: rad[i], ry: rad[i] })), { radial: 7, sub: 3, up: [1, 0, 0], capBulge: 0.3 }), null, colr);
  const f = pts[pts.length - 1], r = toe.r;
  const angs = toe.angs || [-28, 0, 28];
  for (const a of angs) {
    const d = [Math.cos(a * D2R), 0, Math.sin(a * D2R) * s];
    const e = [f[0] + d[0] * toe.len, r * 0.8, z + d[2] * toe.len];
    G.add('skin', tube([[f[0], Math.max(f[1], r), z], [lerp(f[0], e[0], 0.5), r * 1.3, lerp(z, e[2], 0.5)], e], [r * 1.2, r, r * 0.7], { radial: 5, sub: 2 }), null, colr);
    if (toe.claw) G.add('bone', spike(e, [e[0] + d[0] * toe.claw, 0.002, e[2] + d[2] * toe.claw], r * 0.7, { seg: 5 }), null, toe.clawCol ?? 0x1a1816);
  }
  if (toe.back) G.add('skin', tube([[f[0], Math.max(f[1], r), z], [f[0] - toe.back, r * 0.8, z]], [r, r * 0.6], { radial: 5, sub: 2 }), null, colr);
}
/** beak: stations along direction ang (deg above horizontal) from base. st: [t, halfW, top, bot, yoff] in units of len */
function beak(HG, base, ang, len, st, color, mat = 'bone') {
  const a = ang * D2R, ax = [Math.cos(a), Math.sin(a)], up = [-ax[1], ax[0]];
  HG.add(mat, loft(st.map(([t, w, top, bot, yo = 0]) => ({ p: [base[0] + ax[0] * t * len + up[0] * yo * len, base[1] + ax[1] * t * len + up[1] * yo * len, 0], rx: w * len, ry: top * len, ryb: bot * len })), { radial: 8, sub: 3, up: [up[0], up[1], 0], color, capBulge: 0.3 }));
}
/** folded wing: flattened loft from a to b on side s */
function wing(G, a, b, zOff, wMid, th, s, color, o = {}) {
  const n = 5, st = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, k = Math.pow(Math.sin(Math.PI * (0.12 + 0.8 * t)), 0.7) * (1 - 0.35 * t);
    st.push({ p: [lerp(a[0], b[0], t), lerp(a[1], b[1], t) + (o.sag || 0) * Math.sin(Math.PI * t), s * (zOff * (1 - 0.35 * t * t))], rx: th * (1 - 0.5 * t), ry: wMid * k, ryb: wMid * k * (o.low ?? 1.2) });
  }
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
  G.add('skin', loft(st, { radial: 10, sub: 3, up: [-dy / l, dx / l, 0], color, capBulge: 0.3 }));
}
function birdHead(G, HG, at, yaw, pitch) {
  const m = new THREE.Matrix4().makeTranslation(at[0], at[1], at[2] || 0).multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(new THREE.Matrix4().makeRotationZ(-pitch * D2R));
  G.addGeo(HG, m);
}
const eyes = (HG, x, y, z, r, c = 0x0c0a08) => { for (const s of [-1, 1]) HG.add('gloss', ellipsoid([x, y, s * z], [r, r, r * 0.6], { seg: 7, rings: 5 }), null, c); };

function ostrich(opts) {
  const { rv } = seeded(opts, 5), G = new Geo(), HG = new Geo();
  const blk = col(0x1d1b1a), skin = col(0xb9a39a);
  const at = birdBody(G, [0, 1.2], 8, [[-0.62, .1, .1, .08], [-0.42, .28, .27, .2], [-0.1, .37, .31, .3], [0.2, .34, .27, .3], [0.42, .2, .17, .2], [0.52, .1, .08, .1]],
    (u, a, p, sy) => mixCol(blk, 0x000000, 0.3 * noise3(p[0] * 20, p[1] * 20, p[2] * 20)), { radial: 20 });
  // white tail plumes and wing tips
  for (const [x, y, z, r] of [[-0.66, 1.2, 0, .2], [-0.58, 1.05, 0.14, .14], [-0.58, 1.05, -0.14, .14], [-0.3, 1.02, 0.36, .16], [-0.3, 1.02, -0.36, .16]]) G.add('flat', ellipsoid([x, y, z], [r * 1.2, r, r * 0.8], { seg: 9, rings: 6 }), null, (px, py, pz) => mixCol(W, 0xcfc8b8, noise3(px * 30, py * 30, pz * 30)));
  for (const s of [-1, 1]) wing(G, [0.3, 1.32], [-0.38, 1.12], 0.36, 0.2, 0.06, s, fixed(blk));
  const yaw = rv(35) * D2R;
  const end = neckTube(G, [[0.42, 1.24, .09], [0.52, 1.42, .06], [0.54, 1.7, .042], [0.52, 2.0, .036], [0.56, 2.2, .036], [0.63, 2.3, .04]], (u, a, p) => mixCol(skin, 0xe0d4cc, 0.4 * noise3(p[0] * 60, p[1] * 60, p[2] * 60) + sstep(0.2, 0, u) * 0.6), yaw);
  HG.add('skin', ellipsoid([0.02, 0.005, 0], [0.085, 0.052, 0.055], { seg: 12, rings: 8 }), null, skin);
  beak(HG, [0.06, -0.005], -6, 0.13, [[0, .33, .2, .18], [.5, .3, .13, .1], [1, .14, .04, .04]], fixed(0xc8a890));
  eyes(HG, 0.03, 0.02, 0.046, 0.022);
  birdHead(G, HG, end, yaw, 4);
  for (const s of [-1, 1]) {
    const dx = s > 0 ? 0.06 : -0.08;
    birdLeg(G, [[0.0, 1.05], [0.02 + dx * 0.3, 0.86], [-0.1 + dx * 0.5, 0.56], [-0.06 + dx * 0.8, 0.3], [0.0 + dx, 0.05]], [.13, .1, .05, .032, .036], s * 0.14, { len: 0.2, r: 0.026, angs: [-6, 22], claw: 0.04 }, 0xc0a8a0, s);
  }
  return finish(G, opts.scale || 1);
}

function vulture(opts) {
  const { rv } = seeded(opts, 6), G = new Geo(), HG = new Geo();
  const br = col(0x4a3a2c), pale = col(0x8a7a66), skin = col(0x6a7078);
  birdBody(G, [0, 0.43], 52, [[-0.36, .06, .05, .05], [-0.2, .15, .14, .12], [0.0, .19, .17, .17], [0.17, .17, .15, .17], [0.3, .11, .1, .11]],
    (u, a, p, sy) => mixCol(sy < -0.2 ? pale : br, 0x1a140f, 0.3 * noise3(p[0] * 30, p[1] * 30, p[2] * 30)));
  for (const s of [-1, 1]) wing(G, [0.12, 0.72], [-0.34, 0.12], 0.17, 0.15, 0.05, s, (u, a, p) => mixCol(br, 0x1e1712, sstep(0.4, 1, u) * 0.8 + 0.2 * noise3(p[0] * 40, p[1] * 40, p[2] * 40)));
  // tail
  G.add('skin', loft([{ p: [-0.2, 0.2, 0], rx: .09, ry: .03 }, { p: [-0.36, 0.06, 0], rx: .1, ry: .015 }], { radial: 8, sub: 2, up: [0.6, 0.8, 0] }), null, 0x1e1712);
  // white ruff, bare neck
  G.add('flat', ellipsoid([0.2, 0.7, 0], [0.12, 0.08, 0.13], { seg: 10, rings: 7, rot: [0, 0, 0.6] }), null, 0xe8e2d4);
  const yaw = rv(40) * D2R;
  const end = neckTube(G, [[0.2, 0.7, .05], [0.3, 0.8, .04], [0.32, 0.9, .035], [0.36, 0.95, .036]], fixed(skin), yaw);
  HG.add('skin', ellipsoid([0.02, 0, 0], [0.06, 0.042, 0.042], { seg: 10, rings: 7 }), null, skin);
  beak(HG, [0.05, 0], -8, 0.085, [[0, .3, .28, .22], [.5, .26, .26, .16], [.85, .16, .16, .1, -0.08], [1, .06, .05, .05, -0.3]], fixed(0x3a342e));
  eyes(HG, 0.035, 0.012, 0.036, 0.011);
  birdHead(G, HG, end, yaw, 12);
  for (const s of [-1, 1]) birdLeg(G, [[0.03, 0.34], [0.05, 0.2], [0.04, 0.03]], [.06, .03, .016], s * 0.08, { len: 0.085, r: 0.011, back: 0.04, claw: 0.025 }, 0x8a8880, s);
  return finish(G, opts.scale || 1);
}

function penguin(opts) {
  const { rv } = seeded(opts, 7), G = new Geo(), HG = new Geo();
  const back = col(0x39424c), blk = col(0x15171a), org = col(0xf09a1e);
  // upright body: path goes up, "top" (ry) faces the back (-x)
  const st = [[0.04, .07, .06, .06], [0.16, .135, .1, .12], [0.38, .155, .11, .15], [0.58, .14, .1, .13], [0.72, .1, .085, .09], [0.8, .075, .07, .07]];
  G.add('skin', loft(st.map(([y, rx, rb, rf]) => ({ p: [0, y, 0], rx, ry: rb, ryb: rf })), {
    radial: 20, sub: 5, up: [-1, 0, 0], capBulge: 0.4,
    color: (u, a, p, sy) => {
      let o = sy > 0.05 ? back : W;
      if (sy <= 0.05) o = mixCol(W, 0xf6c44a, sstep(0.52, 0.72, p[1]) * 0.9);
      if (Math.abs(sy - 0.05) < 0.09) o = mixCol(o, blk, 0.7);
      if (p[1] > 0.735) o = blk;
      return o;
    },
  }));
  const yaw = rv(30) * D2R;
  HG.add('skin', ellipsoid([0.0, 0, 0], [0.07, 0.062, 0.058], { seg: 12, rings: 8 }), null, (x, y, z) => (Math.abs(z) > 0.035 && x < 0.01 && y < 0.03 ? org : blk));
  beak(HG, [0.05, 0.0], 6, 0.115, [[0, .16, .14, .14], [.5, .1, .09, .08], [1, .025, .02, .02, -0.03]], (u, a, p, sy) => (sy < -0.1 && u < 0.7 ? org : blk));
  eyes(HG, 0.035, 0.015, 0.05, 0.008);
  birdHead(G, HG, [0.01, 0.85, 0], yaw, -8);
  for (const s of [-1, 1]) {
    // flippers
    G.add('skin', loft([{ p: [0.0, 0.62, s * 0.13], rx: .018, ry: .045 }, { p: [-0.01, 0.48, s * 0.17], rx: .014, ry: .055 }, { p: [-0.02, 0.33, s * 0.185], rx: .01, ry: .04 }, { p: [-0.03, 0.26, s * 0.18], rx: .006, ry: .015 }], { radial: 8, sub: 3, up: [1, 0, 0] }), null, (x, y, z) => (Math.abs(z) > 0.16 || x < 0 ? back : back));
    G.add('skin', loft([{ p: [-0.02, 0.03, s * 0.06], rx: .04, ry: .025 }, { p: [0.07, 0.02, s * 0.075], rx: .05, ry: .018 }, { p: [0.13, 0.012, s * 0.085], rx: .035, ry: .01 }], { radial: 7, sub: 2 }), null, 0x1c1c1e);
  }
  G.add('skin', loft([{ p: [-0.04, 0.09, 0], rx: .05, ry: .03 }, { p: [-0.13, 0.02, 0], rx: .035, ry: .012 }], { radial: 6, sub: 2, up: [0.6, 0.8, 0] }), null, back);
  return finish(G, (opts.scale || 1) * 0.92 / 0.915);
}

function flamingo(opts) {
  const { rv } = seeded(opts, 8), G = new Geo(), HG = new Geo();
  const pink = col(0xf0a59c), deep = col(0xe66a62);
  birdBody(G, [0, 0.8], 6, [[-0.3, .03, .03, .03], [-0.18, .1, .1, .09], [0.0, .13, .12, .12], [0.15, .11, .1, .11], [0.24, .06, .05, .06]],
    (u, a, p, sy) => mixCol(pink, 0xf8d0c8, sstep(0.2, -0.8, sy) * 0.6));
  for (const s of [-1, 1]) wing(G, [0.16, 0.86], [-0.3, 0.76], 0.115, 0.085, 0.035, s, (u, a, p) => (u > 0.82 ? K : mixCol(deep, pink, sstep(0.5, 0.0, u) * 0.6)));
  const yaw = rv(30) * D2R;
  const end = neckTube(G, [[0.2, 0.84, .045], [0.33, 0.9, .03], [0.37, 1.02, .024], [0.31, 1.14, .021], [0.25, 1.24, .02], [0.27, 1.33, .022], [0.32, 1.35, .024]], fixed(pink), yaw);
  HG.add('skin', ellipsoid([0.01, 0, 0], [0.04, 0.032, 0.03], { seg: 10, rings: 7 }), null, pink);
  beak(HG, [0.035, -0.005], -28, 0.12, [[0, .17, .15, .17], [.45, .16, .15, .16], [.7, .14, .12, .14, -0.1], [1, .05, .04, .05, -0.34]], (u) => (u > 0.6 ? K : col(0xf4d8cc)));
  eyes(HG, 0.02, 0.008, 0.027, 0.006, 0xd8c020);
  birdHead(G, HG, end, yaw, 6);
  for (const s of [-1, 1]) birdLeg(G, [[0.0, 0.74], [0.01, 0.62], [s > 0 ? -0.04 : -0.02, 0.36], [s > 0 ? 0.02 : -0.03, 0.03]], [.04, .014, .012, .01], s * 0.04, { len: 0.07, r: 0.006 }, 0xe88a88, s);
  return finish(G, opts.scale || 1);
}

function eagle(opts) {
  const { rv } = seeded(opts, 9), G = new Geo(), HG = new Geo();
  const br = col(0x3a2a1f), yl = col(0xe8b820);
  birdBody(G, [0, 0.42], 60, [[-0.26, .06, .05, .05], [-0.14, .13, .12, .11], [0.04, .16, .14, .15], [0.2, .14, .12, .14], [0.32, .09, .08, .09]],
    (u, a, p) => mixCol(mixCol(br, W, sstep(0.82, 0.95, u)), 0x140e0a, 0.3 * noise3(p[0] * 30, p[1] * 30, p[2] * 30) * sstep(0.95, 0.8, u)));
  for (const s of [-1, 1]) wing(G, [0.1, 0.68], [-0.26, 0.12], 0.15, 0.14, 0.045, s, (u, a, p) => mixCol(br, 0x1c140e, sstep(0.3, 1, u) * 0.7 + 0.2 * noise3(p[0] * 40, p[1] * 40, p[2] * 40)));
  G.add('skin', loft([{ p: [-0.16, 0.2, 0], rx: .08, ry: .03 }, { p: [-0.27, 0.03, 0], rx: .1, ry: .012 }], { radial: 8, sub: 2, up: [0.8, 0.6, 0] }), null, 0xf0ece2);
  const yaw = rv(45) * D2R;
  const end = neckTube(G, [[0.14, 0.66, .085], [0.2, 0.74, .07], [0.24, 0.79, .06]], fixed(W), yaw);
  HG.add('skin', ellipsoid([0.015, 0, 0], [0.068, 0.055, 0.052], { seg: 10, rings: 7 }), null, W);
  beak(HG, [0.05, -0.005], -10, 0.085, [[0, .28, .3, .22], [.5, .24, .28, .16], [.85, .15, .17, .1, -0.1], [1, .05, .05, .05, -0.34]], fixed(yl));
  eyes(HG, 0.04, 0.012, 0.042, 0.01, 0xd8c040);
  for (const s of [-1, 1]) HG.add('skin', tube([[0.02, 0.03, s * 0.03], [0.06, 0.028, s * 0.036]], 0.012, { radial: 5 }), null, W); // brow
  birdHead(G, HG, end, yaw, 8);
  for (const s of [-1, 1]) birdLeg(G, [[0.04, 0.3], [0.06, 0.17], [0.05, 0.03]], [.07, .04, .018], s * 0.075, { len: 0.075, r: 0.012, back: 0.04, claw: 0.03 }, (x, y) => (y > 0.1 ? br : yl), s);
  return finish(G, opts.scale || 1);
}

function heron(opts) {
  const { rv } = seeded(opts, 10), G = new Geo(), HG = new Geo();
  const gy = col(0x7c8a98), pale = col(0xcfd4d8);
  birdBody(G, [0, 0.66], 28, [[-0.32, .03, .03, .03], [-0.18, .09, .09, .08], [0.0, .115, .1, .11], [0.15, .1, .09, .1], [0.24, .055, .05, .055]],
    (u, a, p, sy) => mixCol(gy, pale, sstep(-0.2, -0.9, sy) * 0.7));
  for (const s of [-1, 1]) wing(G, [0.16, 0.78], [-0.34, 0.5], 0.1, 0.085, 0.03, s, (u) => mixCol(gy, 0x2a3038, sstep(0.6, 1, u) * 0.8));
  const yaw = rv(30) * D2R;
  const end = neckTube(G, [[0.2, 0.78, .04], [0.33, 0.86, .028], [0.36, 0.98, .022], [0.28, 1.06, .02], [0.24, 1.14, .02], [0.28, 1.2, .022]], (u, a, p, sy) => mixCol(pale, 0x8a8078, sstep(0.3, -0.8, sy) * 0.4), yaw);
  HG.add('skin', ellipsoid([0.02, 0, 0], [0.05, 0.03, 0.028], { seg: 10, rings: 7 }), null, (x, y) => (y > 0.012 ? col(0x1a1c20) : W));
  HG.add('flat', tube([[-0.01, 0.02, 0], [-0.08, 0.01, 0], [-0.15, -0.03, 0]], [0.008, 0.005, 0.002], { radial: 4 }), null, 0x1a1c20); // plume
  beak(HG, [0.05, -0.002], -4, 0.15, [[0, .1, .1, .09], [.5, .06, .06, .05], [1, .01, .01, .01]], fixed(0xd8a830));
  eyes(HG, 0.04, 0.008, 0.024, 0.006, 0xe0c030);
  birdHead(G, HG, end, yaw, 6);
  for (const s of [-1, 1]) birdLeg(G, [[0.0, 0.6], [0.01, 0.5], [s > 0 ? -0.04 : -0.01, 0.28], [s > 0 ? 0.03 : -0.04, 0.03]], [.035, .013, .011, .009], s * 0.04, { len: 0.085, r: 0.006, back: 0.04 }, 0x6a6048, s);
  return finish(G, opts.scale || 1);
}

// ===========================================================================
// PINNIPEDS
// ===========================================================================
/** S.spine: [x, y, rx, ryTop, ryBot]; flippers; head features */
function pinniped(S, opts) {
  const { rv } = seeded(opts, 11), G = new Geo();
  const base = col(S.base), dark = col(S.dark), pale = col(S.pale ?? S.base);
  const sp = S.spine, n = sp.length;
  const colr = (u, a, p, sy) => {
    let o = mixCol(base, dark, sstep(0.2, 0.9, sy) * 0.6 + 0.35 * fbm(p[0] * 7, p[1] * 7, p[2] * 7));
    o = mixCol(o, pale, sstep(-0.3, -0.9, sy) * 0.6);
    if (S.mark) o = S.mark(o, u, p, sy);
    return o;
  };
  G.add('skin', loft(sp.map(([x, y, rx, ry, ryb]) => ({ p: [x, y, 0], rx, ry, ryb: ryb ?? ry })), { radial: 24, sub: 5, color: colr, capBulge: 0.5 }));
  const flip = (pts, c) => G.add('skin', loft(pts.map((p) => ({ p: [p[0], p[1], p[2]], rx: p[3], ry: p[4] })), { radial: 9, sub: 3, up: [0, 1, 0], capBulge: 0.3 }), null, c ?? dark);
  for (const s of [-1, 1]) {
    for (const f of S.flippers) flip(f.map((p) => [p[0], p[1], p[2] * s, p[3], p[4]]), S.flipCol);
  }
  if (S.extras) S.extras(G, rv);
  return finish(G, (opts.scale || 1) * (1 + rv(0.04)));
}
const walrus = (o) => pinniped({
  base: 0x8a5e44, dark: 0x5e3e2e, pale: 0xa57a5e,
  spine: [[-1.55, 0.14, .1, .08, .08], [-1.25, 0.26, .26, .2, .2], [-0.8, 0.42, .45, .36, .4], [-0.2, 0.55, .58, .46, .52], [0.4, 0.66, .56, .46, .52], [0.85, 0.9, .44, .38, .4], [1.15, 1.12, .3, .27, .28], [1.38, 1.2, .23, .2, .22], [1.5, 1.17, .2, .14, .2]],
  flippers: [
    [[0.5, 0.45, 0.42, .1, .16], [0.72, 0.2, 0.62, .07, .17], [0.98, 0.06, 0.78, .035, .2], [1.2, 0.04, 0.86, .02, .13]],
    [[-1.25, 0.2, 0.2, .07, .14], [-1.5, 0.08, 0.36, .04, .17], [-1.8, 0.04, 0.46, .02, .19]],
  ],
  mark: (c, u, p) => mixCol(c, 0x3e2a20, 0.4 * sstep(0.45, 0.55, noise3(p[0] * 3, p[1] * 14, p[2] * 3))),
  extras(G) {
    G.add('skin', ellipsoid([1.56, 1.1, 0], [0.12, 0.13, 0.2], { seg: 12, rings: 8 }), null, 0x9a7258); // whisker pads
    for (const s of [-1, 1]) {
      G.add('bone', horn([[1.5, 1.04, s * 0.1], [1.56, 0.8, s * 0.12], [1.58, 0.56, s * 0.13], [1.55, 0.42, s * 0.12]], 0.036, 0.012, { radial: 8, sub: 3 }), null, 0xeadfc6);
      G.add('gloss', ellipsoid([1.44, 1.27, s * 0.15], [0.016, 0.016, 0.01], { seg: 6, rings: 5 }), null, 0x0c0908);
      for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.3; G.add('flat', tube([[1.64, 1.08 + 0.02 * Math.cos(a * 3), s * (0.06 + i * 0.018)], [1.7, 1.0 - 0.01 * i, s * (0.08 + i * 0.03)]], 0.004, { radial: 3 }), null, 0xe0d6c0); }
    }
    G.add('flat', ellipsoid([1.66, 1.18, 0], [0.03, 0.03, 0.06], { seg: 6, rings: 5 }), null, 0x2a1e1a);
  },
}, o);
const sealion = (o) => pinniped({
  base: 0x7a5a3e, dark: 0x4a3626, pale: 0x9a7a58, flipCol: 0x2e241e,
  spine: [[-1.15, 0.1, .07, .06, .06], [-0.85, 0.18, .17, .13, .13], [-0.4, 0.28, .27, .22, .24], [0.05, 0.4, .32, .27, .3], [0.4, 0.62, .3, .25, .27], [0.62, 0.92, .2, .19, .19], [0.72, 1.18, .14, .14, .14], [0.82, 1.32, .12, .1, .11], [0.95, 1.4, .07, .05, .06]],
  flippers: [
    [[0.36, 0.5, 0.26, .06, .11], [0.46, 0.26, 0.4, .04, .12], [0.62, 0.05, 0.54, .02, .15], [0.86, 0.03, 0.66, .012, .1]],
    [[-0.9, 0.12, 0.14, .04, .09], [-0.7, 0.05, 0.32, .02, .12], [-0.45, 0.03, 0.44, .012, .1]],
  ],
  extras(G) {
    for (const s of [-1, 1]) {
      G.add('gloss', ellipsoid([0.86, 1.39, s * 0.085], [0.016, 0.016, 0.01], { seg: 6, rings: 5 }), null, 0x0c0908);
      leaf(G, { base: [0.76, 1.32, s * 0.115], axis: [-0.8, -0.2, s * 0.3], face: [0, 0.3, s], len: 0.04, w: 0.01, cIn: 0x3a2a20, cOut: 0x3a2a20 });
    }
    G.add('gloss', ellipsoid([1.0, 1.42, 0], [0.022, 0.018, 0.028], { seg: 6, rings: 5 }), null, 0x141010);
  },
}, o);
const elephantseal = (o) => pinniped({
  base: 0x7a6c5e, dark: 0x554a40, pale: 0x9a8a78, flipCol: 0x4a4038,
  spine: [[-2.2, 0.16, .12, .1, .1], [-1.8, 0.32, .32, .24, .26], [-1.1, 0.52, .58, .44, .5], [-0.2, 0.66, .76, .58, .64], [0.6, 0.78, .74, .58, .66], [1.15, 1.15, .56, .5, .52], [1.5, 1.6, .4, .38, .4], [1.72, 1.95, .3, .27, .3], [1.9, 2.08, .22, .18, .22]],
  flippers: [
    [[0.7, 0.5, 0.62, .1, .2], [0.95, 0.2, 0.86, .06, .2], [1.2, 0.06, 1.0, .03, .22], [1.4, 0.04, 1.06, .02, .12]],
    [[-1.9, 0.2, 0.22, .06, .16], [-2.3, 0.08, 0.36, .035, .2], [-2.65, 0.04, 0.44, .02, .22]],
  ],
  mark: (c, u, p, sy) => mixCol(c, 0xb08a80, sstep(0.55, 0.8, u) * sstep(-0.1, -0.7, sy) * 0.7),
  extras(G) {
    // proboscis drooping over the mouth
    G.add('skin', loft([{ p: [1.86, 2.12, 0], rx: .17, ry: .14 }, { p: [2.06, 2.12, 0], rx: .17, ry: .15 }, { p: [2.2, 1.98, 0], rx: .15, ry: .14 }, { p: [2.22, 1.78, 0], rx: .12, ry: .11 }, { p: [2.16, 1.66, 0], rx: .08, ry: .07 }], { radial: 12, sub: 4, capBulge: 0.5 }), null, (x, y, z) => mixCol(0x6a5c50, 0x4a4038, noise3(x * 10, y * 30, z * 10)));
    for (const s of [-1, 1]) G.add('gloss', ellipsoid([1.9, 2.16, s * 0.2], [0.03, 0.03, 0.02], { seg: 6, rings: 5 }), null, 0x0c0908);
    G.add('flat', ellipsoid([2.0, 1.86, 0], [0.12, 0.05, 0.13], { seg: 8, rings: 5 }), null, 0x5a2e2a); // open mouth hint
  },
}, o);

// ===========================================================================
// REPTILES
// ===========================================================================
/** S.spine: [x, y, rx, ryTop, ryBot] tail tip -> snout; S.legs: [{x, y, z, out, fwd, r}] */
function lizard(S, opts) {
  const { rv } = seeded(opts, 12), G = new Geo();
  const wave = S.wave ?? 0.08, L = S.spine[S.spine.length - 1][0] - S.spine[0][0], x0 = S.spine[0][0];
  const zAt = (x) => wave * Math.sin(((x - x0) / L) * Math.PI * 2.2 + 0.6) * (1 - 0.6 * ((x - x0) / L));
  G.add('skin', loft(S.spine.map(([x, y, rx, ry, ryb]) => ({ p: [x, y, zAt(x)], rx, ry, ryb: ryb ?? ry })), { radial: S.radial || 20, sub: 5, color: S.color, capBulge: 0.4, squareness: S.square || 0 }));
  for (const lg of S.legs) for (const s of [-1, 1]) {
    const z0 = zAt(lg.x) + s * lg.z, r = lg.r, fw = lg.fwd * (s > 0 ? 1 : 0.6);
    const knee = [lg.x + fw * 0.4, lg.y + lg.rise, z0 + s * lg.out], foot = [lg.x + fw, r * 0.6, z0 + s * lg.out * 1.15];
    G.add('skin', loft([{ p: [lg.x, lg.y, z0 - s * r], rx: r * 1.3, ry: r * 1.2 }, { p: [lerp(lg.x, knee[0], 0.5), lerp(lg.y, knee[1], 0.6), lerp(z0, knee[2], 0.5)], rx: r * 1.25, ry: r * 1.1 }, { p: knee, rx: r, ry: r * 0.95 }, { p: [lerp(knee[0], foot[0], 0.5), lerp(knee[1], foot[1], 0.55), lerp(knee[2], foot[2], 0.5)], rx: r * 0.85, ry: r * 0.8 }, { p: [foot[0], foot[1] + r * 0.4, foot[2]], rx: r * 0.75, ry: r * 0.65 }],
      { radial: 8, sub: 3, up: [0, 1, 0], color: S.legColor || S.color }));
    G.add('skin', ellipsoid([foot[0] + r * 0.8, r * 0.45, foot[2]], [r * 1.6, r * 0.45, r * 1.2], { seg: 8, rings: 5 }), null, S.footCol);
    for (let i = -2; i <= 2; i++) G.add('bone', spike([foot[0] + r * 1.9 - Math.abs(i) * r * 0.3, r * 0.4, foot[2] + i * r * 0.45], [foot[0] + r * 3.0 - Math.abs(i) * r * 0.4, 0.004, foot[2] + i * r * 0.6], r * 0.2, { seg: 5 }), null, S.clawCol ?? 0x1a1816);
  }
  if (S.extras) S.extras(G, zAt, rv);
  return finish(G, (opts.scale || 1) * (1 + rv(0.04)));
}
const komodo = (o) => {
  const base = col(0x5a5248), dark = col(0x3a342e), pale = col(0x8a8272);
  const c = (u, a, p, sy) => mixCol(mixCol(base, dark, 0.5 * fbm(p[0] * 12, p[1] * 12, p[2] * 12) + sstep(0.3, 1, sy) * 0.3), pale, sstep(-0.4, -0.95, sy) * 0.6 + 0.25 * (noise3(p[0] * 70, p[1] * 70, p[2] * 70) > 0.62 ? 1 : 0));
  return lizard({
    wave: 0.1, color: c, footCol: 0x3a342e,
    spine: [[-1.3, 0.04, .02, .02, .02], [-1.0, 0.08, .05, .055, .05], [-0.6, 0.14, .085, .1, .09], [-0.25, 0.22, .14, .13, .12], [0.1, 0.27, .19, .14, .16], [0.45, 0.3, .19, .14, .15], [0.7, 0.34, .14, .11, .12], [0.88, 0.38, .1, .08, .09], [1.0, 0.4, .095, .07, .08], [1.15, 0.38, .08, .05, .06], [1.3, 0.36, .045, .025, .035]],
    legs: [{ x: 0.55, y: 0.28, z: 0.15, out: 0.2, fwd: 0.08, rise: -0.04, r: 0.05 }, { x: -0.2, y: 0.2, z: 0.12, out: 0.2, fwd: 0.1, rise: -0.02, r: 0.055 }],
    extras(G, zAt) {
      const z = zAt(1.3);
      for (const s of [-1, 1]) G.add('gloss', ellipsoid([1.08, 0.425, zAt(1.08) + s * 0.07], [0.014, 0.012, 0.008], { seg: 6, rings: 5 }), null, 0x0c0908);
      G.add('flat', tube([[1.32, 0.345, z], [1.42, 0.32, z], [1.46, 0.3, z + 0.02]], 0.006, { radial: 4 }), null, 0xd8c060);
      G.add('flat', tube([[1.42, 0.32, z], [1.46, 0.3, z - 0.02]], 0.005, { radial: 4 }), null, 0xd8c060);
    },
  }, o);
};
const alligator = (o) => {
  const base = col(0x363a2e), dark = col(0x1e2019), pale = col(0xcfc8a4);
  const c = (u, a, p, sy) => mixCol(mixCol(base, dark, 0.6 * fbm(p[0] * 9, p[1] * 9, p[2] * 9) + sstep(0.5, 1, sy) * 0.2), pale, sstep(-0.55, -0.9, sy) * 0.85);
  return lizard({
    wave: 0.12, color: c, footCol: 0x2a2c24, square: 0.35, radial: 24,
    spine: [[-1.75, 0.07, .015, .06, .05], [-1.3, 0.1, .05, .1, .08], [-0.8, 0.14, .11, .13, .11], [-0.4, 0.2, .2, .15, .16], [0.1, 0.24, .28, .16, .2], [0.55, 0.25, .28, .15, .2], [0.85, 0.24, .2, .12, .14], [1.05, 0.24, .17, .11, .11], [1.25, 0.21, .15, .08, .08], [1.5, 0.17, .11, .045, .05], [1.75, 0.15, .08, .03, .04]],
    legs: [{ x: 0.65, y: 0.2, z: 0.22, out: 0.2, fwd: 0.1, rise: -0.06, r: 0.055 }, { x: -0.3, y: 0.18, z: 0.17, out: 0.24, fwd: 0.12, rise: -0.04, r: 0.07 }],
    extras(G, zAt) {
      // scute ridges along the back and tail
      for (let i = 0; i < 46; i++) {
        const x = -1.7 + i * 0.062, t = (x + 1.75) / 3.5;
        if (x > 0.95) break;
        const y = x < -0.4 ? lerp(0.13, 0.35, (x + 1.75) / 1.35) : lerp(0.35, 0.4, clamp((x + 0.4) / 0.9)) - (x > 0.55 ? (x - 0.55) * 0.12 : 0);
        const w = x < -0.6 ? 0.01 + 0.07 * clamp((x + 1.75) / 1.1) : 0.09;
        for (const s of x < -0.9 ? [0] : [-1, 1]) G.add('skin', spike([x, y - 0.03, zAt(x) + s * w], [x - 0.03, y + (x < -0.6 ? 0.05 : 0.025), zAt(x) + s * w], 0.028, { seg: 4 }), null, 0x23261d);
      }
      for (const s of [-1, 1]) {
        G.add('skin', ellipsoid([1.1, 0.345, zAt(1.1) + s * 0.085], [0.05, 0.035, 0.035], { seg: 7, rings: 5 }), null, 0x2a2c24);
        G.add('gloss', ellipsoid([1.115, 0.355, zAt(1.1) + s * 0.105], [0.016, 0.014, 0.01], { seg: 6, rings: 5 }), null, 0x4a4a14);
        G.add('skin', ellipsoid([1.76, 0.18, zAt(1.76) + s * 0.03], [0.03, 0.02, 0.025], { seg: 6, rings: 4 }), null, 0x2a2c24);
        for (let i = 0; i < 12; i++) { const x = 1.2 + i * 0.048, hw = lerp(0.145, 0.08, i / 11); G.add('bone', spike([x, 0.135, zAt(x) + s * hw], [x, 0.105, zAt(x) + s * hw * 1.02], 0.008, { seg: 4 }), null, 0xe8e2d0); }
      }
    },
  }, o);
};
function tortoise(opts) {
  const { rv } = seeded(opts, 13), G = new Geo();
  const sh = col(0x4a463f), shd = col(0x2a2824), skin = col(0x4e4a44);
  // carapace: dome
  const dome = new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.56);
  dome.scale(0.62, 0.46, 0.5); dome.translate(0, 0.36, 0);
  G.add('skin', dome, null, (x, y, z) => {
    const w = worley(x * 4.2 + 1.3, y * 3.2, z * 4.2 + 0.7);
    return mixCol(mixCol(sh, 0x6a6458, sstep(0.1, 0.5, w[0]) * 0.6), shd, sstep(0.12, 0.02, w[1] - w[0]) * 0.9);
  });
  G.add('skin', ellipsoid([0, 0.3, 0], [0.6, 0.1, 0.48], { seg: 20, rings: 6 }), null, 0x3a3630); // plastron / rim
  for (const [x, z, fw] of [[0.36, 0.33, 0.04], [0.36, -0.33, 0.0], [-0.36, 0.34, -0.03], [-0.36, -0.34, 0.02]]) {
    G.add('skin', loft([{ p: [x * 0.85, 0.34, z * 0.8], rx: .12, ry: .12 }, { p: [x + fw * 0.5, 0.18, z], rx: .1, ry: .1 }, { p: [x + fw, 0.05, z], rx: .095, ry: .1 }, { p: [x + fw, 0.0, z], rx: .1, ry: .105 }], { radial: 10, sub: 3, up: [1, 0, 0], capBulge: 0 }), null, (px, py, pz) => mixCol(skin, 0x2e2c28, 0.5 * (noise3(px * 40, py * 40, pz * 40) > 0.5 ? 1 : 0)));
    for (let i = -1; i <= 1; i++) G.add('bone', ellipsoid([x + fw + (x > 0 ? 0.095 : -0.095) * Math.cos(i * 0.5), 0.02, z + 0.1 * Math.sin(i * 0.5)], [0.016, 0.022, 0.02], { seg: 5, rings: 4 }), null, 0x8a8478);
  }
  const yaw = rv(30) * D2R;
  const end = neckTube(G, [[0.42, 0.36, .11], [0.62, 0.42, .075], [0.78, 0.56, .06], [0.86, 0.7, .055], [0.92, 0.76, .055]], (u, a, p) => mixCol(skin, 0x6a665e, 0.4 * noise3(p[0] * 30, p[1] * 30, p[2] * 30)), yaw, { up: [0, 1, 0] });
  const HG = new Geo();
  HG.add('skin', loft([{ p: [-0.03, 0, 0], rx: .05, ry: .045 }, { p: [0.03, 0.005, 0], rx: .06, ry: .05 }, { p: [0.1, 0, 0], rx: .05, ry: .04 }, { p: [0.145, -0.005, 0], rx: .03, ry: .025 }], { radial: 10, sub: 3 }), null, skin);
  eyes(HG, 0.07, 0.022, 0.045, 0.009);
  HG.add('flat', tube([[0.07, -0.018, -0.05], [0.14, -0.012, -0.02], [0.15, -0.012, 0], [0.14, -0.012, 0.02], [0.07, -0.018, 0.05]], 0.004, { radial: 3 }), null, 0x1a1816);
  birdHead(G, HG, end, yaw, -4);
  G.add('skin', loft([{ p: [-0.55, 0.3, 0], rx: .05, ry: .04 }, { p: [-0.68, 0.22, 0.02], rx: .02, ry: .018 }], { radial: 6, sub: 2 }), null, skin);
  return finish(G, (opts.scale || 1) * (1 + rv(0.04)));
}

export const SPECIAL = { ostrich, vulture, walrus, sealion, elephantseal, komodo, alligator, tortoise, penguin, flamingo, eagle, heron };
