// Great apes (gorilla, chimpanzee): built from explicit joint positions per pose. Authored in metres for a
// silverback gorilla and scaled per species.
import { THREE, Geo, col, mixCol, loft, ellipsoid, tube, D2R, lerp, clamp, sstep, noise3, fbm, limb, leaf, finish, seeded } from './core.js';

// joints in metres: [x, y, z] (z for the +side; mirrored for the other). Each pose: spine path + limbs.
const POSES = {
  knuckle: {
    spine: [[-0.5, 0.62], [-0.38, 0.74], [-0.1, 0.86], [0.2, 0.98], [0.36, 1.05], [0.46, 1.1]],
    head: [0.58, 1.12], headPitch: 16,
    arm: [[0.3, 1.0, 0.3], [0.36, 0.58, 0.35], [0.42, 0.18, 0.31], [0.47, 0.07, 0.3]], fist: true,
    leg: [[-0.36, 0.68, 0.17], [-0.16, 0.4, 0.24], [-0.36, 0.1, 0.21], [-0.14, 0.035, 0.24]],
  },
  chestbeat: {
    spine: [[-0.07, 0.6], [-0.02, 0.74], [0.05, 0.96], [0.04, 1.2], [0.0, 1.37], [0.03, 1.45]],
    head: [0.09, 1.5], headPitch: -8,
    arm: [[0.0, 1.36, 0.33], [0.1, 1.02, 0.52], [0.27, 1.18, 0.22], [0.3, 1.22, 0.13]], fist: true,
    armAlt: [[0.0, 1.36, 0.33], [0.14, 1.08, 0.54], [0.34, 1.3, 0.31], [0.36, 1.36, 0.23]],
    leg: [[0.0, 0.7, 0.18], [0.14, 0.4, 0.23], [0.0, 0.1, 0.21], [0.22, 0.035, 0.25]],
  },
  sit: {
    spine: [[-0.16, 0.14], [-0.1, 0.28], [0.0, 0.52], [0.07, 0.76], [0.1, 0.93], [0.15, 1.0]],
    head: [0.22, 1.06], headPitch: 10,
    arm: [[0.1, 0.9, 0.3], [0.2, 0.52, 0.38], [0.44, 0.34, 0.3], [0.52, 0.3, 0.27]], fist: false,
    leg: [[-0.06, 0.2, 0.17], [0.32, 0.42, 0.32], [0.42, 0.1, 0.24], [0.64, 0.035, 0.27]],
  },
};

/**
 * P: { scale, fur, fur2 (silver back), skin, face, crest (0..1), ear, bulk, arms (length factor), belly }
 */
export function ape(P, opts = {}) {
  const { seed, rv } = seeded(opts, 91);
  const poseName = (P.poses || ['knuckle']).includes(opts.pose) ? opts.pose : P.pose;
  const J = POSES[poseName];
  const G = new Geo();
  const fur = col(P.fur), fur2 = col(P.fur2 ?? P.fur), skin = col(P.skin), face = col(P.face ?? P.skin);
  const bk = P.bulk ?? 1, lk = P.limb ?? 1;
  const furC = (p, k = 0) => mixCol(fur, 0x000000, 0.35 * noise3(p[0] * 18, p[1] * 18, p[2] * 18) + k);

  // ---- torso ---------------------------------------------------------------
  const sp = J.spine;
  const tdir = [sp[4][0] - sp[1][0], sp[4][1] - sp[1][1]], tl = Math.hypot(tdir[0], tdir[1]);
  const up = [-tdir[1] / tl, tdir[0] / tl, 0]; // dorsal direction
  const R = [[.14, .1, .12], [.23, .15, .2], [.28, .16, .27 * (P.belly ?? 1)], [.31, .18, .25], [.3, .17, .2], [.2, .15, .15]];
  G.add('skin', loft(sp.map((p, i) => ({ p: [p[0], p[1], 0], rx: R[i][0] * bk, ry: R[i][1] * bk, ryb: R[i][2] * bk })), {
    radial: 20, sub: 4, up, capBulge: 0.5,
    color: (u, a, p, sy) => {
      let o = furC(p);
      if (P.fur2 != null) o = mixCol(o, fur2, sstep(0.1, 0.6, sy) * sstep(0.08, 0.3, u) * sstep(0.95, 0.6, u));
      if (P.chest && sy < -0.55 && u > 0.5 && u < 0.85) o = mixCol(o, skin, 0.75);
      return o;
    },
  }));

  // ---- limbs ---------------------------------------------------------------
  const seg = (pts, o = {}) => G.add('skin', loft(pts.map((p) => ({ p: [p[0], p[1], p[2]], rx: p[3], ry: p[4], ryb: p[5] ?? p[4] })), { radial: 10, sub: 3, up: o.up || [1, 0, 0], capBulge: 0.5, color: o.color || ((u, a, p) => furC(p)) }));
  const mid = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  for (const s of [1, -1]) {
    let A = J.arm;
    if (J.armAlt && s < 0) A = J.armAlt;
    const a = A.map((p) => [p[0] + (s > 0 ? rv(0.03) : 0), p[1], p[2] * s]);
    const ar = lk;
    // arm: shoulder -> elbow -> wrist ; pick an up reference that is not parallel to the limb
    const dx = a[1][0] - a[0][0], dy = a[1][1] - a[0][1];
    const upA = Math.abs(dy) > Math.abs(dx) * 0.7 ? [1, 0, 0] : [0, 1, 0];
    seg([
      [...mid(a[0], a[1], -0.12), .1 * ar, .11 * ar], [...mid(a[0], a[1], 0.1), .125 * ar, .145 * ar], [...mid(a[0], a[1], 0.55), .105 * ar, .12 * ar], [...a[1], .088 * ar, .095 * ar],
      [...mid(a[1], a[2], 0.3), .1 * ar, .105 * ar], [...mid(a[1], a[2], 0.75), .085 * ar, .088 * ar], [...a[2], .07 * ar, .07 * ar],
    ], { up: upA });
    // hand
    const hd = a[3], hr = 0.088 * ar;
    const hk = J.fist ? 1 : 0.6;
    G.add('skin', loft([{ p: mid(a[2], hd, -0.15), rx: hr * 0.8, ry: hr * 0.8 * hk }, { p: mid(a[2], hd, 0.5), rx: hr * 1.05, ry: hr * 0.95 * hk }, { p: hd, rx: hr * 1.0, ry: hr * 0.85 * hk }, { p: mid(a[2], hd, 1.25), rx: hr * 0.7, ry: hr * 0.55 * hk }], { radial: 9, sub: 3, up: [0, 0, 1], capBulge: 0.6 }), null, skin);
    // leg
    const l = J.leg.map((p) => [p[0], p[1], p[2] * s]);
    const ldx = l[1][0] - l[0][0], ldy = l[1][1] - l[0][1];
    const upL = Math.abs(ldy) > Math.abs(ldx) * 0.7 ? [1, 0, 0] : [0, 1, 0];
    seg([
      [...mid(l[0], l[1], -0.1), .11 * ar, .13 * ar], [...mid(l[0], l[1], 0.2), .14 * ar, .165 * ar], [...mid(l[0], l[1], 0.65), .115 * ar, .13 * ar], [...l[1], .095 * ar, .1 * ar],
      [...mid(l[1], l[2], 0.35), .1 * ar, .11 * ar], [...mid(l[1], l[2], 0.8), .078 * ar, .082 * ar], [...l[2], .066 * ar, .068 * ar],
    ], { up: upL });
    // foot along the ground
    const f0 = [l[2][0] - 0.06, 0.05, l[2][2]], f1 = l[3];
    seg([[...f0, .06 * ar, .05, .05], [...mid(f0, f1, 0.5), .075 * ar, .045, .045], [f1[0], f1[1], f1[2], .075 * ar, .032, .032], [f1[0] + 0.06, 0.028, f1[2] + s * 0.01, .05 * ar, .022, .022]], { up: [0, 1, 0], color: (u) => mixCol(fur, skin, sstep(0.2, 0.6, u)) });
  }

  // ---- head (local: +x face, y up) -------------------------------------------
  const HG = new Geo();
  const cr = P.crest ?? 1, hs = P.headScale ?? 1, mz = P.muzzle ?? 1;
  const sk = [[-0.17, .06, .08, .07], [-0.11, .11, .115 + 0.075 * cr, .105], [-0.03, .13, .125 + 0.04 * cr, .125], [0.05, .13, .105, .145], [0.11, .11, .06, .15], [0.165 * mz, .09, .04, .135], [0.2 * mz, .065, .022, .095]];
  HG.add('skin', loft(sk.map(([x, w, t, b]) => ({ p: [x, 0, 0], rx: w, ry: t, ryb: b })), {
    radial: 16, sub: 4, capBulge: 0.5,
    color: (u, a, p, sy) => {
      const inFace = p[0] > 0.075 + 0.05 * Math.max(0, -sy) && Math.abs(p[2]) < 0.1;
      if (inFace) return mixCol(face, P.muzzleCol ?? face, sstep(0.12, 0.17, p[0]) * sstep(0.05, -0.02, p[1]));
      let o = furC(p);
      if (P.crown != null) o = mixCol(o, P.crown, sstep(0.04, 0.12, p[1]) * sstep(0.1, 0.0, p[0]));
      return o;
    },
  }));
  // brow ridge
  HG.add('skin', tube([[0.09, 0.045, -0.105], [0.118, 0.068, -0.055], [0.124, 0.066, 0], [0.118, 0.068, 0.055], [0.09, 0.045, 0.105]], 0.023 * (P.brow ?? 1), { radial: 7, sub: 3 }), null, face);
  for (const s of [-1, 1]) {
    HG.add('gloss', ellipsoid([0.124, 0.034, s * 0.046], [0.012, 0.013, 0.015], { seg: 7, rings: 5 }), null, 0x24130a);
    HG.add('flat', ellipsoid([0.186 * mz, -0.004, s * 0.022], [0.012, 0.014, 0.017], { seg: 6, rings: 4 }), null, 0x050505);
    leaf(HG, { base: [-0.01, 0.0, s * 0.118], axis: [-0.25, 0.9, s * 0.35], face: [0.6, 0, s * 0.8], len: 0.05 * (P.ear ?? 1), w: 0.028 * (P.ear ?? 1), shape: 'round', cIn: P.earCol ?? face, cOut: P.earCol ?? face });
  }
  // mouth line + chin
  HG.add('flat', tube([[0.13 * mz, -0.075, -0.075], [0.185 * mz, -0.062, -0.035], [0.198 * mz, -0.06, 0], [0.185 * mz, -0.062, 0.035], [0.13 * mz, -0.075, 0.075]], 0.006, { radial: 4, sub: 2 }), null, 0x070606);
  const yaw = rv(28) + (opts.yaw != null ? +opts.yaw : 0);
  const MH = new THREE.Matrix4().makeTranslation(J.head[0], J.head[1], 0)
    .multiply(new THREE.Matrix4().makeRotationY(yaw * D2R))
    .multiply(new THREE.Matrix4().makeRotationZ(-(J.headPitch + rv(6)) * D2R))
    .multiply(new THREE.Matrix4().makeScale(hs, hs, hs));
  G.addGeo(HG, MH);
  return finish(G, P.scale * (opts.scale || 1) * (1 + rv(0.04)));
}

export const APES = {
  gorilla: (o) => ape({ scale: 1, fur: 0x35312e, fur2: 0xa3a19b, skin: 0x1f1d1d, face: 0x222020, crest: 1, headScale: 1.18, chest: true, pose: 'chestbeat', poses: ['chestbeat', 'knuckle', 'sit'] }, o),
  gorilla_female: (o) => ape({ scale: 0.84, fur: 0x35312e, skin: 0x1f1d1d, face: 0x222020, crest: 0.4, headScale: 1.12, bulk: 0.95, pose: 'sit', poses: ['sit', 'knuckle'] }, o),
  chimpanzee: (o) => ape({ scale: 0.68, fur: 0x2a2625, skin: 0x2a2220, face: 0x8a6a58, muzzleCol: 0xa58672, crest: 0, bulk: 0.8, limb: 0.82, belly: 0.85, ear: 2.2, earCol: 0x8a6a58, brow: 0.85, headScale: 0.95, muzzle: 1.05, pose: 'knuckle', poses: ['knuckle', 'sit'] }, o),
};
export const APE_POSES = { gorilla: ['chestbeat', 'knuckle', 'sit'], gorilla_female: ['sit', 'knuckle'], chimpanzee: ['knuckle', 'sit'] };
