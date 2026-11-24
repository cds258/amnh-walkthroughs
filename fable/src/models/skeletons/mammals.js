// Fossil mammals, synapsids and primates.
import { assemble, pair, Ctx, lerp, rad, vadd } from './engine.js';
import * as THREE from 'three';
import * as SK from './skulls.js';

const TOES = (n, len, r, spread, claw = 0) => ({ list: Array.from({ length: n }, (_, i) => ({ len, ang: n > 1 ? spread * (i / (n - 1) - 0.5) : 0, ph: 2, claw, curl: 0.4, clawR: 1.1 })), r });

/** Generic mammal built on the engine. S.r = dorsal centrum radius; S.ns = neural spine profile hip -> withers. */
function mq(S, opts) {
  const r = S.r;
  return assemble({
    tone: S.tone || 'fossil', seed: S.seed, colors: S.colors, floor: S.floor, detail: S.detail,
    spine: S.spine, hip: S.hip, neckAt: S.neckAt,
    tail: { n: S.tailN || 18, r: [r * 0.12, r * 0.3, r * 0.6], ns: [0, 0, r * 0.6], tp: [0, 0, r * 0.9], ...S.tail },
    sacrum: { n: 4, len: S.sacLen || r * 5, r: r * 0.9, ns: S.ns[0], tp: r * 1.3, nsLean: S.nsLean ?? 0.3, ...S.sacrum },
    dorsal: { n: S.dorN || 19, r: [r * 0.95, r, r * 0.9], ns: S.ns, tp: S.tp ?? [r * 2.2, r * 1.6, r * 1.3], nsLean: S.nsLean ?? 0.3, tpUp: 0.1, nsLen: 0.75, ...S.dorsal },
    neck: { n: 7, r: [r * 0.95, r * 0.85, r * 0.8], ns: S.neckNs || [r * 2, r * 1.0, r * 0.7], tp: [r * 1.6, r * 1.5, r * 1.4], nsLean: 0, ...S.neck },
    ribs: { arc: 165, sweep: 0.3, from: 0.3, ...S.ribs },
    pelvis: { type: 'mammal', ...S.pelvis },
    shoulder: S.shoulder,
    legs: pair(S.leg, S.legL, S.legR), arms: pair(S.arm, S.armL, S.armR),
    skull: S.skull, mount: S.mount, extra: S.extra,
  }, opts);
}

// ---------------------------------------------------------------------------
// proboscideans
// ---------------------------------------------------------------------------
export function mammoth(opts = {}) {
  return mq({
    seed: 1, r: 0.12, detail: 2,
    spine: [[-0.8, 1.3], [-0.68, 1.95], [-0.4, 2.5], [0, 2.72], [0.9, 2.9], [1.8, 2.98], [2.45, 2.9], [2.85, 2.95], [3.2, 3.08]],
    hip: 3, neckAt: 6, tailN: 22,
    ns: [0.3, 0.3, 0.4, 0.7, 0.75, 0.5], nsLean: 0.45,
    ribs: { w: [0.5, 0.6, 0.78, 0.88, 0.82, 0.55], d: [0.6, 0.9, 1.5, 1.78, 1.7, 1.2], r: 0.036, flat: 1.5 },
    pelvis: { w: 0.42, drop: 0.3, r: 0.09, il: [0.45, 0.42, 0.7], is: [-0.5, -0.1, 0.3], pb: [-0.15, -0.38], face: 'front', wing: 3.0 },
    shoulder: { at: 5.6, drop: 0.85, w: 0.5, scap: { len: 1.0, ang: 78, wid: 0.75, zTop: 0.5, shape: 'fan' } },
    leg: { lens: [1.3, 0.85, 0.16], rad: [0.105, 0.08, 0.035], pole: [1, 0, 0.1], a3: 20, digits: TOES(5, 0.1, 0.04, 100, 0.04), metaGap: 2.2 },
    legL: { target: [0.2, 0.06, 0.45] }, legR: { target: [-0.25, 0.06, 0.45] },
    arm: { lens: [1.05, 0.85, 0.2], rad: [0.105, 0.08, 0.036], lower2: 'equal', pole: [-1, 0, 0.1], a3: 5, digits: TOES(5, 0.09, 0.04, 100, 0.04), metaGap: 2.2 },
    armL: { target: [2.2, 0.06, 0.5] }, armR: { target: [2.55, 0.06, 0.5] },
    skull: { build: (ctx) => SK.proboscideanSkull(ctx), len: 1.3, pitch: -4 },
    mount: { posts: [{ at: 3, r: 0.045 }, { at: 5.5, r: 0.045 }] },
  }, opts);
}

export function mastodon(opts = {}) {
  return mq({
    seed: 2, r: 0.115, detail: 2,
    spine: [[-0.95, 1.0], [-0.8, 1.55], [-0.48, 2.0], [0, 2.15], [1.0, 2.25], [2.0, 2.3], [2.75, 2.22], [3.15, 2.22], [3.5, 2.3]],
    hip: 3, neckAt: 6, tailN: 22,
    ns: [0.25, 0.25, 0.3, 0.5, 0.55, 0.4], nsLean: 0.45,
    ribs: { w: [0.5, 0.6, 0.78, 0.86, 0.8, 0.55], d: [0.5, 0.8, 1.3, 1.5, 1.45, 1.05], r: 0.036, flat: 1.5 },
    pelvis: { w: 0.44, drop: 0.28, r: 0.09, il: [0.45, 0.38, 0.8], is: [-0.5, -0.1, 0.3], pb: [-0.15, -0.36], face: 'front', wing: 3.4 },
    shoulder: { at: 5.6, drop: 0.72, w: 0.5, scap: { len: 0.85, ang: 75, wid: 0.65, zTop: 0.5, shape: 'fan' } },
    leg: { lens: [1.02, 0.7, 0.14], rad: [0.105, 0.08, 0.035], pole: [1, 0, 0.1], a3: 20, digits: TOES(5, 0.1, 0.04, 100, 0.04), metaGap: 2.2 },
    legL: { target: [0.2, 0.06, 0.47] }, legR: { target: [-0.25, 0.06, 0.47] },
    arm: { lens: [0.85, 0.68, 0.18], rad: [0.105, 0.08, 0.036], lower2: 'equal', pole: [-1, 0, 0.1], a3: 5, digits: TOES(5, 0.09, 0.04, 100, 0.04), metaGap: 2.2 },
    armL: { target: [2.45, 0.06, 0.5] }, armR: { target: [2.8, 0.06, 0.5] },
    skull: { build: (ctx) => SK.proboscideanSkull(ctx, { mastodon: true }), len: 1.15, pitch: -4 },
    mount: { posts: [{ at: 3, r: 0.045 }, { at: 5.5, r: 0.045 }] },
  }, opts);
}

// ---------------------------------------------------------------------------
// Smilodon
// ---------------------------------------------------------------------------
export function smilodon(opts = {}) {
  return mq({
    seed: 3, r: 0.04,
    spine: [[-0.45, 0.7], [-0.32, 0.84], [-0.16, 0.9], [0, 0.92], [0.4, 0.96], [0.8, 0.99], [1.08, 0.96], [1.26, 1.03], [1.4, 1.14]],
    hip: 3, neckAt: 6, tailN: 10,
    ns: [0.08, 0.08, 0.09, 0.15, 0.17, 0.11],
    ribs: { w: [0.14, 0.17, 0.22, 0.24, 0.22, 0.15], d: [0.16, 0.26, 0.42, 0.5, 0.47, 0.32], r: 0.013 },
    pelvis: { w: 0.12, drop: 0.08, r: 0.03, il: [0.22, 0.09, 0.14], is: [-0.18, -0.04, 0.11], pb: [-0.05, -0.15], face: 'side', wing: 2.4 },
    shoulder: { at: 5.7, drop: 0.32, w: 0.16, scap: { len: 0.32, ang: 68, wid: 0.22, zTop: 0.45, shape: 'fan' } },
    leg: { lens: [0.38, 0.34, 0.13], rad: [0.036, 0.027, 0.012], pole: [1, 0, 0.1], a3: 38, digits: TOES(4, 0.075, 0.014, 40, 0.035), metaGap: 2.1 },
    legL: { target: [0.14, 0.03, 0.14] }, legR: { target: [-0.2, 0.03, 0.14] },
    arm: { lens: [0.36, 0.3, 0.1], rad: [0.042, 0.03, 0.013], lower2: 'equal', pole: [-1, 0, 0.1], a3: 25, digits: TOES(5, 0.075, 0.015, 50, 0.04), metaGap: 2.1 },
    armL: { target: [1.05, 0.03, 0.18] }, armR: { target: [1.26, 0.03, 0.18] },
    neck: { n: 7, r: [0.04, 0.038, 0.036], ns: [0.1, 0.06, 0.05], tp: [0.07, 0.065, 0.06] },
    skull: { build: (ctx) => SK.mammalSkull(ctx, SK.SMILODON()), len: 0.37, pitch: -6 },
    mount: { posts: [{ at: 3, r: 0.014 }, { at: 5.6, r: 0.014 }] },
  }, opts);
}

// ---------------------------------------------------------------------------
// Brontops (brontothere)
// ---------------------------------------------------------------------------
export function brontops(opts = {}) {
  return mq({
    seed: 4, r: 0.09,
    spine: [[-0.85, 1.25], [-0.7, 1.72], [-0.35, 2.02], [0, 2.1], [0.9, 2.2], [1.8, 2.25], [2.4, 2.1], [2.75, 2.0], [3.05, 1.95]],
    hip: 3, neckAt: 6, tailN: 16,
    ns: [0.22, 0.22, 0.3, 0.5, 0.55, 0.38], nsLean: 0.5,
    ribs: { w: [0.4, 0.5, 0.64, 0.72, 0.68, 0.45], d: [0.45, 0.7, 1.15, 1.35, 1.3, 0.9], r: 0.03, flat: 1.4 },
    pelvis: { w: 0.36, drop: 0.25, r: 0.07, il: [0.42, 0.3, 0.62], is: [-0.42, -0.08, 0.25], pb: [-0.12, -0.32], face: 'front', wing: 3 },
    shoulder: { at: 5.6, drop: 0.75, w: 0.4, scap: { len: 0.8, ang: 72, wid: 0.5, zTop: 0.45, shape: 'fan' } },
    leg: { lens: [0.95, 0.66, 0.25], rad: [0.08, 0.06, 0.03], pole: [1, 0, 0.1], a3: 25, digits: TOES(3, 0.12, 0.035, 50, 0.06), metaGap: 2.1 },
    legL: { target: [0.2, 0.05, 0.4] }, legR: { target: [-0.3, 0.05, 0.4] },
    arm: { lens: [0.72, 0.6, 0.22], rad: [0.08, 0.06, 0.028], lower2: 'equal', pole: [-1, 0, 0.1], a3: 10, digits: TOES(4, 0.11, 0.032, 60, 0.06), metaGap: 2.1 },
    armL: { target: [2.15, 0.05, 0.42] }, armR: { target: [2.5, 0.05, 0.42] },
    skull: { build: (ctx) => SK.mammalSkull(ctx, SK.BRONTOPS()), len: 0.85, pitch: -14 },
    mount: { posts: [{ at: 3, r: 0.035 }, { at: 5.5, r: 0.035 }] },
  }, opts);
}

// ---------------------------------------------------------------------------
// Megaloceros (Irish elk)
// ---------------------------------------------------------------------------
const PALM = [[0, -0.1], [0.3, -0.22], [0.5, -0.75], [0.66, -0.3], [1.0, -0.38], [1.22, -0.9], [1.36, -0.4], [1.7, -0.4], [2.0, -0.82], [2.02, -0.3], [2.35, -0.3], [2.12, 0.0], [2.4, 0.22],
  [1.95, 0.26], [1.9, 0.6], [1.6, 0.36], [1.3, 0.62], [1.1, 0.36], [0.6, 0.3], [0.2, 0.14], [0, 0.1]];
export function megaloceros(opts = {}) {
  const deer = SK.DEER();
  deer.extra = (bone, ds, h) => {
    const c = h.ctx.jit(0.05, 1.1);
    for (const s of [1, -1]) {
      const p0 = [0.2, 0.36, s * 0.09], p1 = [0.13, 0.5, s * 0.45], p2 = [0.05, 0.62, s * 1.0];
      bone.tube([p0, p1, p2], [0.055, 0.05, 0.06], null, { radial: 6, color: c });
      bone.tube([[0.18, 0.42, s * 0.2], [0.42, 0.56, s * 0.3], [0.62, 0.74, s * 0.32]], [0.035, 0.028, 0.004], null, { radial: 5, color: c }); // brow tine
      const o = [-0.08, 0.22, s * 0.95], ol = Math.hypot(...o), on = o.map((v) => v / ol);
      const b = [-0.95, 0.3, 0], bl = Math.hypot(...b), bn = b.map((v) => v / bl);
      const nr = [on[1] * bn[2] - on[2] * bn[1], on[2] * bn[0] - on[0] * bn[2], on[0] * bn[1] - on[1] * bn[0]];
      bone.poly(PALM, null, (u, v, layer) => {
        const t = (layer ? -1 : 1) * 0.022, cup = 0.12 * v * v;
        return [p2[0] + on[0] * u + bn[0] * v + nr[0] * t, p2[1] + on[1] * u + bn[1] * v + nr[1] * t + cup, p2[2] + on[2] * u + bn[2] * v + nr[2] * t];
      }, { color: c, flip: s < 0 });
    }
  };
  return mq({
    seed: 5, r: 0.05,
    spine: [[-0.34, 1.52], [-0.26, 1.72], [-0.12, 1.82], [0, 1.85], [0.55, 1.9], [1.1, 1.95], [1.5, 1.9], [1.8, 2.15], [2.02, 2.5], [2.15, 2.8]],
    hip: 3, neckAt: 6, tailN: 12,
    ns: [0.12, 0.12, 0.15, 0.3, 0.34, 0.22], nsLean: 0.45,
    ribs: { w: [0.2, 0.26, 0.34, 0.38, 0.36, 0.24], d: [0.25, 0.4, 0.72, 0.86, 0.82, 0.55], r: 0.016, flat: 1.3 },
    pelvis: { w: 0.17, drop: 0.14, r: 0.035, il: [0.28, 0.16, 0.26], is: [-0.26, -0.04, 0.14], pb: [-0.08, -0.2], face: 'side', wing: 2.6 },
    shoulder: { at: 5.7, drop: 0.6, w: 0.2, scap: { len: 0.5, ang: 70, wid: 0.3, zTop: 0.4, shape: 'fan' } },
    leg: { lens: [0.58, 0.64, 0.5], rad: [0.036, 0.027, 0.02], pole: [1, 0, 0.1], a3: 14, lower2: false, metas: 1, digits: TOES(2, 0.11, 0.02, 14, 0.06), metaGap: 2.0 },
    legL: { target: [0.18, 0.05, 0.19] }, legR: { target: [-0.3, 0.05, 0.19] },
    arm: { lens: [0.42, 0.5, 0.42], rad: [0.036, 0.027, 0.02], lower2: false, metas: 1, pole: [-1, 0, 0.1], a3: 5, digits: TOES(2, 0.11, 0.02, 14, 0.06), metaGap: 2.0 },
    armL: { target: [1.3, 0.05, 0.2] }, armR: { target: [1.62, 0.05, 0.2] },
    neck: { n: 7, r: [0.062, 0.055, 0.048], ns: [0.12, 0.06, 0.04], tp: [0.1, 0.09, 0.07] },
    skull: { build: (ctx) => SK.mammalSkull(ctx, deer), len: 0.55, pitch: -22 },
    mount: { posts: [{ at: 3, r: 0.02 }, { at: 5.6, r: 0.02 }] },
  }, opts);
}

// ---------------------------------------------------------------------------
// Megatherium (giant ground sloth), rearing against a tree-height browse
// ---------------------------------------------------------------------------
export function megatherium(opts = {}) {
  return mq({
    seed: 6, r: 0.1,
    spine: [[-2.3, 0.2], [-1.6, 0.3], [-0.9, 0.6], [-0.35, 1.1], [0, 1.62], [0.45, 2.3], [0.85, 3.0], [1.1, 3.3], [1.32, 3.5]],
    hip: 4, neckAt: 6, tailN: 20,
    tail: { r: [0.03, 0.06, 0.09, 0.115], ns: [0.02, 0.08, 0.16, 0.24], tp: [0.02, 0.1, 0.2, 0.26], chev: [0.02, 0.08, 0.14, 0.14] },
    ns: [0.24, 0.24, 0.26, 0.32, 0.3, 0.22], nsLean: 0.4,
    ribs: { w: [0.5, 0.6, 0.7, 0.74, 0.66, 0.42], d: [0.5, 0.8, 1.2, 1.35, 1.25, 0.8], r: 0.04, flat: 1.6 },
    pelvis: { w: 0.45, drop: 0.16, r: 0.1, il: [0.5, 0.3, 0.86], is: [-0.45, -0.1, 0.3], pb: [-0.15, -0.38], face: 'front', wing: 4 },
    shoulder: { at: 5.6, drop: 0.55, w: 0.48, scap: { len: 0.7, ang: 70, wid: 0.55, zTop: 0.5, shape: 'fan' }, clav: [0.05, -0.35] },
    leg: { lens: [0.82, 0.64, 0.22], rad: [0.13, 0.09, 0.04], pole: [1, 0, 0.25], a3: 68, digits: TOES(3, 0.14, 0.04, 40, 0.2), metaGap: 2.3 },
    legL: { target: [0.62, 0.06, 0.52] }, legR: { target: [0.35, 0.06, 0.52] },
    arm: { lens: [0.75, 0.65, 0.2], rad: [0.075, 0.06, 0.03], lower2: 'equal', ground: false, pole: [0.2, -1, 0.4], digits: TOES(4, 0.16, 0.03, 30, 0.26), metaGap: 2.2, curlDir: [0, -1, 0] },
    armL: { target: [2.2, 3.3, 0.5], seg3: [-0.8, -0.5, 0] }, armR: { target: [2.05, 2.65, 0.5], seg3: [-0.9, -0.2, 0] },
    skull: { build: (ctx) => SK.mammalSkull(ctx, SK.SLOTH({ gape: 8 })), len: 0.8, pitch: 22 },
    mount: { posts: [{ at: 4, r: 0.04 }, { at: 5.4, r: 0.04, x: 0.9 }] },
  }, opts);
}

// ---------------------------------------------------------------------------
// Glyptodon
// ---------------------------------------------------------------------------
export function glyptodon(opts = {}) {
  return mq({
    seed: 7, r: 0.05,
    spine: [[-1.75, 0.42], [-1.25, 0.56], [-0.7, 0.85], [0, 1.02], [0.5, 1.05], [0.95, 0.98], [1.2, 0.86], [1.38, 0.82], [1.52, 0.82]],
    hip: 3, neckAt: 6, tailN: 16,
    tail: { r: [0.02, 0.035, 0.05], ns: [0.02, 0.05, 0.08], tp: [0.03, 0.06, 0.09] },
    ns: [0.14, 0.14, 0.14, 0.14, 0.12, 0.1],
    ribs: { w: [0.36, 0.42, 0.5, 0.52, 0.46, 0.3], d: [0.3, 0.45, 0.68, 0.74, 0.66, 0.42], r: 0.018, flat: 1.4 },
    pelvis: { w: 0.26, drop: 0.14, r: 0.05, il: [0.3, 0.14, 0.45], is: [-0.3, -0.02, 0.35], pb: [-0.1, -0.22], face: 'front', wing: 3 },
    shoulder: { at: 5.6, drop: 0.36, w: 0.28, scap: { len: 0.36, ang: 70, wid: 0.3, zTop: 0.5, shape: 'fan' } },
    leg: { lens: [0.46, 0.33, 0.1], rad: [0.055, 0.045, 0.02], pole: [1, 0, 0.2], a3: 40, digits: TOES(4, 0.07, 0.022, 60, 0.05), metaGap: 2.2 },
    legL: { target: [0.2, 0.04, 0.32] }, legR: { target: [-0.1, 0.04, 0.32] },
    arm: { lens: [0.32, 0.26, 0.08], rad: [0.045, 0.035, 0.016], lower2: 'equal', pole: [-1, 0, 0.3], a3: 20, digits: TOES(4, 0.06, 0.018, 60, 0.07), metaGap: 2.2 },
    armL: { target: [1.0, 0.04, 0.32] }, armR: { target: [1.22, 0.04, 0.32] },
    skull: { build: (ctx) => SK.mammalSkull(ctx, SK.SLOTH({ gape: 3 })), len: 0.36, pitch: -12 },
    mount: { posts: [{ at: 3, r: 0.02 }, { at: 5.5, r: 0.02 }] },
    extra(ctx, parts) {
      // carapace: dome of fused polygonal osteoderms (rosette mottling in the vertex colours)
      const cx = 0.36, cy = 0.72, rx = 1.14, ry = 0.82, rz = 0.74;
      const rows = [], cols = [], nphi = 9, nth = 28;
      const rnd = ctx.rnd;
      for (let i = 0; i <= nphi; i++) {
        const row = [], crow = [];
        for (let j = 0; j <= nth; j++) {
          const th = (j / nth) * Math.PI * 2, c2 = Math.cos(th) * Math.cos(th);
          const pmax = rad(108 - 34 * Math.pow(c2, 3));
          const ph = (i / nphi) * pmax;
          row.push([cx + rx * Math.sin(ph) * Math.cos(th), cy + ry * Math.cos(ph), rz * Math.sin(ph) * Math.sin(th)]);
          const k = 0.82 + 0.3 * rnd() + (i === nphi ? 0.12 : 0);
          crow.push([ctx.base[0] * k, ctx.base[1] * k, ctx.base[2] * k * 0.95]);
        }
        rows.push(row); cols.push(crow);
      }
      for (let i = 0; i <= nphi; i++) { rows[i][nth] = rows[i][0]; cols[i][nth] = cols[i][0]; }
      ctx.ds.grid(rows, { colors: cols });
      // raised scute bosses
      for (let i = 2; i <= nphi; i++) for (let j = 0; j < nth; j++) {
        if ((i + j) % 2) continue;
        const p = rows[i][j];
        ctx.bone.ellipsoid([p[0], p[1], p[2]], [0.042, 0.042, 0.042], { seg: 6, rings: 4, color: ctx.jit(0.15, 1.08) });
      }
      // tail armour rings
      const sp = parts.spine, sEnd = sp.sAt(2.6);
      for (let k = 0; k < 11; k++) {
        const s0 = lerp(0.05, sEnd, k / 11), s1 = lerp(0.05, sEnd, (k + 0.85) / 11);
        const f0 = sp.frame(s0), f1 = sp.frame(s1), r0 = 0.07 + 0.016 * k, r1 = 0.085 + 0.016 * k;
        ctx.ds.tube([f0.at(0, 0, 0), f1.at(0, 0, 0)], [r0, r1], null, { radial: 10, color: ctx.jit(0.12), cap: 'none' });
      }
      // head shield
      const e = sp.frame(sp.total);
      ctx.bone.ellipsoid(e.at(0.14, 0.13, 0), [0.17, 0.035, 0.13], { axes: [e.dir(1, -0.2, 0).map((v) => v / Math.hypot(1, 0.2)), e.dir(0.2, 1, 0).map((v) => v / Math.hypot(1, 0.2)), e.s], seg: 8, rings: 4, color: ctx.jit(0.1, 1.05) });
    },
  }, opts);
}

// ---------------------------------------------------------------------------
// Dimetrodon (sail-backed synapsid, sprawling)
// ---------------------------------------------------------------------------
export function dimetrodon(opts = {}) {
  return mq({
    seed: 8, r: 0.034,
    spine: [[-1.75, 0.16], [-1.2, 0.26], [-0.6, 0.38], [0, 0.46], [0.5, 0.5], [1.0, 0.5], [1.25, 0.48], [1.4, 0.52], [1.52, 0.58]],
    hip: 3, neckAt: 6, tailN: 36,
    tail: { r: [0.006, 0.014, 0.022, 0.03], ns: [0.01, 0.03, 0.07, 0.2], tp: [0, 0.01, 0.03, 0.05], chev: [0.01, 0.03, 0.05, 0.05] },
    ns: [0.5, 0.95, 1.15, 1.2, 1.0, 0.6], nsLean: 0.12, dorN: 20,
    dorsal: { nsW: 0.3, nsLen: 0.3, nsTip: 0.55, nsTipW: 0.6, tp: 0.05 },
    sacrum: { ns: 0.4, nsW: 0.3, nsLen: 0.3, nsTip: 0.55, nsTipW: 0.6, n: 3 },
    neck: { n: 6, r: [0.032, 0.03, 0.028], ns: [0.42, 0.24, 0.1], tp: 0.04, nsW: 0.3, nsLen: 0.3, nsTip: 0.55 },
    ribs: { w: [0.2, 0.26, 0.3, 0.3, 0.26, 0.18], d: [0.2, 0.3, 0.4, 0.42, 0.38, 0.25], r: 0.011, from: 0.05, arc: 160 },
    pelvis: { w: 0.12, drop: 0.07, r: 0.025, il: [0.12, 0.1, 0.07], is: [-0.14, -0.05, 0.06], pb: [0.08, -0.1], face: 'side', wing: 2 },
    shoulder: { at: 5.7, drop: 0.15, w: 0.15, scap: { len: 0.24, ang: 75, wid: 0.12, zTop: 0.5 }, cor: 0.07 },
    leg: { lens: [0.26, 0.22, 0.08], rad: [0.024, 0.016, 0.007], pole: [0.5, 0.6, 1], a3: 0, digits: TOES(5, 0.08, 0.008, 70, 0.03), metaGap: 2.4, toeDir: [1, 0, 0.5] },
    legL: { target: [0.1, 0.03, 0.44] }, legR: { target: [-0.06, 0.03, 0.44] },
    arm: { lens: [0.24, 0.2, 0.07], rad: [0.024, 0.016, 0.007], lower2: 'equal', pole: [-0.4, 0.6, 1], a3: 0, digits: TOES(5, 0.07, 0.008, 70, 0.03), metaGap: 2.4, toeDir: [1, 0, 0.5] },
    armL: { target: [1.22, 0.03, 0.44] }, armR: { target: [1.32, 0.03, 0.44] },
    skull: { build: (ctx) => SK.pelycosaurSkull(ctx), len: 0.45, pitch: -4 },
    mount: { posts: [{ at: 3, r: 0.012 }, { at: 5.6, r: 0.012 }] },
  }, opts);
}

// ---------------------------------------------------------------------------
// primates
// ---------------------------------------------------------------------------
function hominid(S, opts) {
  const k = S.k, ak = S.armK || 1, lk = S.legK || 1;
  const P = (a) => a.map((p) => [p[0] * k, p[1] * k, 0]);
  const hipY = 0.98 * lk;                       // spine heights are shifted so the legs can be shorter (Lucy)
  const sh = (p) => [p[0], p[1] - 0.98 + hipY];
  return assemble({
    tone: S.tone || 'cast', seed: S.seed, colors: S.colors,
    spine: P([[-0.075, 0.87], [-0.065, 0.92], [-0.045, 0.98], [-0.01, 1.12], [-0.045, 1.3], [-0.05, 1.42], [-0.025, 1.49], [-0.005, 1.55], [0.0, 1.59]].map(sh)),
    hip: 2, neckAt: 6,
    tail: { n: 4, r: [0.006, 0.01], ns: 0, tp: 0 },
    sacrum: { n: 5, len: 0.1 * k, r: 0.022 * k, ns: 0.02 * k, tp: 0.045 * k },
    dorsal: { n: 17, r: [0.025 * k, 0.022 * k, 0.016 * k], ns: [0.03 * k, 0.03 * k, 0.035 * k], tp: [0.04 * k, 0.035 * k, 0.03 * k], nsLean: 0.6, nsLen: 0.7 },
    neck: { n: 7, r: [0.014 * k, 0.012 * k], ns: [0.03 * k, 0.015 * k], tp: 0.025 * k, nsLean: 0.5 },
    ribs: { w: (S.ribW || [0.11, 0.12, 0.145, 0.16, 0.15, 0.09]).map((v) => v * k), d: [0.08, 0.11, 0.19, 0.215, 0.19, 0.09].map((v) => v * k), r: 0.0065 * k, arc: 168, sweep: 0.55, from: 0.3, flat: 1.3 },
    pelvis: { type: 'mammal', w: 0.09 * k * (S.pelvisW || 1), drop: 0.04 * k, fwd: -0.085 * k, r: 0.02 * k, il: [0.16 * k, 0.05 * k, 0.1 * k * (S.pelvisW || 1)], is: [-0.075 * k, 0.02 * k, 0.05 * k], pb: [-0.04 * k, -0.065 * k], face: 'dorsal', wing: 3.6 },
    shoulder: { at: 5.75, drop: 0.0, w: 0.185 * k, scap: { len: 0.15 * k, ang: 40, wid: 0.12 * k, shape: 'fan', frontal: true, lift: 0.012 * k, th: 0.008 * k }, clav: [0.0, -0.14 * k], clavR: 0.007 * k,
      sternum: { fwd: -0.1 * k, drop: 0.165 * k, len: 0.09 * k, w: 0.026 * k, th: 0.009 * k } },
    legs: pair({ lens: [0.435 * k * lk, 0.385 * k * lk, 0.14 * k], rad: [0.017 * k, 0.014 * k, 0.006 * k], pole: [1, 0, 0.05], a3: 72, digits: TOES(5, 0.05 * k, 0.006 * k, 22, 0), metaGap: 2.2 },
      { target: [0.125 * k, 0.022 * k, 0.1 * k] }, { target: [0.1 * k, 0.022 * k, 0.1 * k] }),
    arms: pair({ lens: [0.31 * k * ak, 0.25 * k * ak, 0.08 * k], rad: [0.013 * k, 0.01 * k, 0.0045 * k], lower2: 'equal', ground: false, pole: [-1, 0, 0.2], tarsus: false,
      digits: { n: 5, len: 0.085 * k, spread: 24, r: 0.0045 * k, ph: 3 }, metaGap: 2.3, seg3: [0.05, 1, 0], curlDir: [1, 0, 0] },
      { target: [0.03 * k, (1.47 - 0.98 + hipY - (0.31 + 0.25) * ak - 0.07) * k, 0.235 * k] }, { target: [0.0, (1.47 - 0.98 + hipY - (0.31 + 0.25) * ak - 0.07) * k, 0.235 * k] }),
    skull: { build: (ctx) => SK.primateSkull(ctx, S.skullO), len: S.skullLen, pitch: S.skullPitch ?? 0 },
    mount: { posts: [{ at: 2.6, r: 0.008 * Math.max(1, k), x: -0.14 * k }] },
  }, opts);
}
export function human(opts = {}) {
  return hominid({ k: 1, seed: 21, skullO: { kind: 'human' }, skullLen: 0.185 }, opts);
}
export function lucy(opts = {}) {
  return hominid({ k: 0.68, legK: 0.86, armK: 1.18, seed: 22, tone: 'fossil', skullO: { kind: 'ape', canine: 0.03 }, skullLen: 0.125, ribW: [0.11, 0.125, 0.15, 0.155, 0.13, 0.08], pelvisW: 1.2 }, opts);
}

export function gorilla_skeleton(opts = {}) {
  return mq({
    seed: 23, r: 0.03, tone: 'cast',
    spine: [[-0.12, 0.62], [-0.07, 0.69], [0, 0.76], [0.27, 0.88], [0.53, 0.98], [0.72, 1.04], [0.82, 1.1], [0.9, 1.15]],
    hip: 2, neckAt: 5, tailN: 4,
    tail: { r: [0.006, 0.012], ns: 0, tp: 0 },
    sacLen: 0.12, ns: [0.05, 0.05, 0.06, 0.08, 0.09, 0.09], nsLean: 0.5, dorN: 17,
    neck: { n: 7, r: [0.024, 0.022], ns: [0.11, 0.09, 0.06], tp: 0.04 },
    ribs: { w: [0.16, 0.2, 0.24, 0.26, 0.24, 0.15], d: [0.14, 0.2, 0.33, 0.37, 0.33, 0.18], r: 0.012, flat: 1.4 },
    pelvis: { w: 0.12, drop: 0.07, fwd: -0.06, r: 0.028, il: [0.25, 0.06, 0.16], is: [-0.1, -0.03, 0.07], pb: [-0.05, -0.12], face: 'dorsal', wing: 3.6 },
    shoulder: { at: 4.75, drop: 0.08, w: 0.25, scap: { len: 0.22, ang: 40, wid: 0.18, shape: 'fan', frontal: true, lift: 0.03, th: 0.012 }, clav: [0.02, -0.2], clavR: 0.012 },
    leg: { lens: [0.36, 0.3, 0.16], rad: [0.03, 0.023, 0.01], pole: [1, 0, 0.3], a3: 72, digits: TOES(5, 0.06, 0.009, 30, 0), metaGap: 2.2 },
    legL: { target: [0.26, 0.025, 0.18] }, legR: { target: [0.14, 0.025, 0.18] },
    arm: { lens: [0.44, 0.38, 0.1], rad: [0.033, 0.025, 0.01], lower2: 'equal', pole: [-1, 0, 0.2], a3: -5, digits: { n: 4, len: 0.05, spread: 14, r: 0.01, ph: 1 }, toeDir: [-1, 0, 0], metaGap: 2.2 },
    armL: { target: [0.84, 0.03, 0.27] }, armR: { target: [0.68, 0.03, 0.27] },
    skull: { build: (ctx) => SK.primateSkull(ctx, { kind: 'ape', crest: 0.1, canine: 0.07 }), len: 0.21, pitch: -8 },
    mount: { posts: [{ at: 2.5, r: 0.012 }] },
  }, opts);
}

// ---------------------------------------------------------------------------
// Andrewsarchus skull on a post
// ---------------------------------------------------------------------------
export function andrewsarchus_skull(opts = {}) {
  const ctx = new Ctx({ tone: 'fossil', seed: 31, floor: 0 }, opts);
  const sk = SK.mammalSkull(ctx, SK.ANDREWSARCHUS());
  const L = 0.83, h = 1.12;
  const m = new THREE.Matrix4().makeTranslation(-0.36, h, 0).multiply(new THREE.Matrix4().makeRotationZ(rad(-6))).multiply(new THREE.Matrix4().makeScale(L, L, L));
  ctx.bone.merge(sk.bone, m); ctx.ds.merge(sk.ds, m);
  const c = ctx.steel, mb = ctx.metal;
  mb.tube([[0, 0, 0], [0, 0.03, 0]], 0.16, null, { radial: 12, color: c, bulge: 0.01, cap: 'end' });
  mb.tube([[0, 0, 0], [0, h - 0.06, 0]], 0.022, null, { radial: 8, color: c, cap: 'end' });
  mb.tube([[-0.22, h + 0.02, 0], [0, h - 0.07, 0], [0.26, h - 0.04, 0]], 0.012, null, { radial: 6, color: c });
  for (const s of [1, -1]) mb.tube([[0, h - 0.07, 0], [-0.05, h + 0.0, s * 0.16], [-0.08, h + 0.06, s * 0.2]], 0.01, null, { radial: 6, color: c });
  return ctx.finish();
}
