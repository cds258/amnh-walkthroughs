// Dinosaur specs for the skeleton engine. Each function returns a Geo.
import { assemble, pair, lerp, prof, vadd } from './engine.js';
import * as SK from './skulls.js';

const THERO_FOOT = (len, r, claw) => ({ list: [
  { len: len * 0.82, ang: -24, claw, ph: 3 },
  { len, ang: 0, claw, ph: 3 },
  { len: len * 0.84, ang: 24, claw, ph: 3 },
], r, arch: 0.1 });
const SAURO_MANUS = (r) => ({ list: [-44, -22, 0, 22, 44].map((ang, i) => ({ len: r * 2.2, ang, ph: 1, claw: i === 0 ? r * 3.5 : 0 })), r: r * 0.9 });
const SAURO_PES = (len, r) => ({ list: [-40, -20, 0, 20, 40].map((ang, i) => ({ len: len * (i < 3 ? 1 : 0.7), ang, ph: 2, claw: i < 3 ? len * 0.6 : 0 })), r });
const HOOVES = (n, len, r, spread) => ({ list: Array.from({ length: n }, (_, i) => ({ len, ang: n > 1 ? spread * (i / (n - 1) - 0.5) : 0, ph: 2, claw: len * 0.45, curl: 0.2, clawR: 1.2 })), r });

// ---------------------------------------------------------------------------
// Tyrannosaurus rex — AMNH 5027, horizontal stalking pose
// ---------------------------------------------------------------------------
export function tyrannosaurus(opts = {}) {
  const leg = { lens: [1.3, 1.16, 0.7], rad: [0.14, 0.105, 0.058], pole: [1, 0.2, 0.12], digits: THERO_FOOT(0.62, 0.058, 0.2), metaGap: 1.7 };
  const arm = { lens: [0.3, 0.17, 0.08], rad: [0.04, 0.026, 0.014], lower2: 'equal', ground: false, pole: [-1, -0.3, 0.3], tarsus: false,
    digits: { n: 2, len: 0.1, spread: 22, r: 0.014, claw: 0.09, ph: 2 }, metaGap: 2.2, seg3: [-0.5, 0.85, 0], curlDir: [-1, -0.3, 0] };
  return assemble({
    tone: 'fossil', seed: 5027, detail: 2,
    spine: [[-6.8, 2.95], [-5.2, 3.08], [-3.4, 3.14], [-1.6, 3.14], [0, 3.1], [1.3, 3.05], [2.4, 2.86], [3.0, 2.98], [3.45, 3.3], [3.8, 3.42]],
    hip: 4, neckAt: 6,
    tail: { n: 40, len: [0.6, 0.85, 1, 1, 1], r: [0.014, 0.03, 0.06, 0.095, 0.13, 0.155, 0.17], ns: [0, 0.02, 0.05, 0.1, 0.2, 0.32, 0.46],
      tp: [0, 0, 0.03, 0.1, 0.2, 0.28, 0.3], chev: [0, 0.04, 0.08, 0.14, 0.24, 0.36, 0.3], nsLean: 0.4 },
    sacrum: { n: 5, len: 1.0, r: 0.175, ns: 0.5, tp: 0.2 },
    dorsal: { n: 13, r: [0.175, 0.17, 0.155], ns: [0.48, 0.42, 0.34], tp: [0.3, 0.3, 0.27], nsLean: 0.12, tpUp: 0.3 },
    neck: { n: 9, r: [0.15, 0.14, 0.12], ns: [0.26, 0.17, 0.12], tp: [0.22, 0.2, 0.15], crib: [0.32, 0.28, 0.14], nsLean: 0.05 },
    ribs: { w: [0.3, 0.52, 0.68, 0.74, 0.66, 0.42], d: [0.45, 1.15, 1.6, 1.78, 1.55, 0.95], r: 0.038, arc: 152, sweep: 0.22 },
    pelvis: { w: 0.35, drop: 0.32, r: 0.08, ilium: { len: 1.5, h: 0.75, shape: 'thero', lean: 0.3 }, pubis: [0.5, -1.15], ischium: [-0.8, -0.72], boot: 0.3 },
    shoulder: { at: 5.75, drop: 1.12, w: 0.47, scap: { len: 1.0, ang: 38, wid: 0.2, zTop: 0.7 }, cor: 0.17 },
    legs: pair(leg, { target: [1.0, 0.08, 0.36], a3: 22 }, { target: [-0.7, 0.08, 0.36], a3: 38 }),
    arms: pair(arm, { target: [2.5, 1.46, 0.42] }, { target: [2.48, 1.5, 0.42] }),
    skull: { build: (ctx) => SK.tyrannosaurSkull(ctx, { gape: 14 }), len: 1.55, pitch: -10 },
    mount: { posts: [{ at: 4, r: 0.05 }, { at: 5.6, r: 0.045 }], rails: [{ from: 0.4, to: 3.6 }, { from: 6, to: 9 }] },
  }, opts);
}

// ---------------------------------------------------------------------------
// Allosaurus — Rotunda mount, attacking the Barosaurus (or feeding)
// ---------------------------------------------------------------------------
export function allosaurus(opts = {}) {
  const feeding = opts.pose === 'feeding';
  const leg = { lens: [0.88, 0.8, 0.42], rad: [0.075, 0.055, 0.032], pole: [1, 0.2, 0.12], digits: THERO_FOOT(0.4, 0.034, 0.14), metaGap: 1.7 };
  const arm = { lens: [0.34, 0.27, 0.1], rad: [0.035, 0.024, 0.014], lower2: 'equal', ground: false, pole: [-1, -0.2, 0.3], tarsus: false,
    digits: { n: 3, len: 0.17, spread: 40, r: 0.016, claw: 0.14, ph: 3, clawR: 1.3 }, metaGap: 2.4, curlDir: [-0.6, -1, 0] };
  const spine = feeding
    ? [[-5.4, 2.55], [-4.0, 2.42], [-2.6, 2.26], [-1.3, 2.1], [0, 1.95], [0.9, 1.8], [1.65, 1.5], [2.1, 1.22], [2.4, 0.9]]
    : [[-5.4, 1.2], [-4.0, 1.42], [-2.6, 1.68], [-1.3, 1.9], [0, 2.05], [0.85, 2.38], [1.6, 2.78], [1.95, 3.18], [2.22, 3.62]];
  return assemble({
    tone: 'cast', seed: 5753, detail: 2, colors: { cast: 0x6e5f50 },
    spine, hip: 4, neckAt: 6,
    tail: { n: 42, len: [0.6, 0.85, 1, 1, 1], r: [0.01, 0.02, 0.04, 0.06, 0.085, 0.1, 0.11], ns: [0, 0.015, 0.04, 0.08, 0.15, 0.24, 0.32],
      tp: [0, 0, 0.02, 0.07, 0.14, 0.2, 0.22], chev: [0, 0.03, 0.06, 0.1, 0.18, 0.26, 0.22], nsLean: 0.4 },
    sacrum: { n: 5, len: 0.7, r: 0.115, ns: 0.34, tp: 0.14 },
    dorsal: { n: 14, r: [0.115, 0.11, 0.1], ns: [0.33, 0.3, 0.25], tp: [0.2, 0.2, 0.18], nsLean: 0.12, tpUp: 0.3 },
    neck: { n: 9, r: [0.095, 0.085, 0.075], ns: [0.18, 0.12, 0.09], tp: [0.14, 0.12, 0.1], crib: [0.22, 0.2, 0.1], nsLean: 0.05 },
    ribs: { w: [0.2, 0.34, 0.44, 0.47, 0.42, 0.28], d: [0.3, 0.75, 1.05, 1.15, 1.0, 0.6], r: 0.024, arc: 152, sweep: 0.22 },
    pelvis: { w: 0.23, drop: 0.22, r: 0.05, ilium: { len: 0.95, h: 0.48, shape: 'thero', lean: 0.3 }, pubis: [0.3, -0.78], ischium: [-0.5, -0.5], boot: 0.2 },
    shoulder: { at: 5.75, drop: 0.72, w: 0.3, scap: { len: 0.72, ang: 40, wid: 0.13, zTop: 0.7 }, cor: 0.11 },
    legs: feeding
      ? pair(leg, { target: [0.55, 0.06, 0.26], a3: 22 }, { target: [-0.35, 0.06, 0.26], a3: 30 })
      : pair(leg, { target: [0.72, 0.06, 0.26], a3: 16 }, { target: [-0.45, 0.06, 0.26], a3: 40 }),
    arms: feeding
      ? pair(arm, { target: [1.78, 0.66, 0.32], seg3: [-0.6, 0.8, 0] }, { target: [1.72, 0.74, 0.32], seg3: [-0.6, 0.8, 0] })
      : pair(arm, { target: [2.05, 2.0, 0.34], seg3: [-0.9, 0.3, 0] }, { target: [2.0, 1.75, 0.34], seg3: [-0.8, 0.5, 0] }),
    skull: { build: (ctx) => SK.allosaurSkull(ctx, { gape: feeding ? 14 : 30 }), len: 0.85, pitch: feeding ? -58 : 14 },
    mount: { posts: [{ at: 4, r: 0.035 }, { at: 5.5, r: 0.03 }], rails: [{ from: 0.4, to: 3.6, r: 0.018 }, { from: 6, to: 8, r: 0.018 }] },
  }, opts);
}

// ---------------------------------------------------------------------------
// Sauropods
// ---------------------------------------------------------------------------
export function barosaurus(opts = {}) {
  const leg = { lens: [1.6, 1.15, 0.3], rad: [0.16, 0.115, 0.05], pole: [1, 0, 0.1], digits: SAURO_PES(0.28, 0.05), metaGap: 2.3, a3: 28 };
  const arm = { lens: [1.08, 0.8, 0.32], rad: [0.125, 0.1, 0.042], lower2: 'equal', ground: false, pole: [0.2, -1, 0.3], digits: SAURO_MANUS(0.04), metaGap: 2.2 };
  return assemble({
    tone: 'cast', seed: 6341, detail: 2, colors: { cast: 0x6e5f50, fossil: 0x3a2c22 },
    spine: [[-10.6, 0.05, 2.7], [-8.8, 0.1, 1.65], [-6.8, 0.22, 0.75], [-4.8, 0.46, 0.18], [-3.0, 0.95, 0], [-1.4, 1.95, 0], [0, 3.0, 0],
      [0.62, 4.6, 0], [1.2, 6.2, 0], [1.75, 8.4, 0], [2.2, 10.7, 0], [2.85, 12.85, 0], [3.8, 14.5, 0], [4.55, 15.05, 0]],
    hip: 6, neckAt: 8,
    tail: { n: 78, r: [0.012, 0.02, 0.035, 0.06, 0.1, 0.15, 0.2], ns: [0, 0, 0, 0.05, 0.2, 0.42, 0.62], tp: [0, 0, 0, 0, 0.1, 0.25, 0.35],
      chev: [0, 0, 0.03, 0.09, 0.18, 0.3, 0.3], nsLean: 0.3 },
    sacrum: { n: 5, len: 1.0, r: 0.2, ns: 0.75, tp: 0.3 },
    dorsal: { n: 9, r: [0.2, 0.19, 0.17], ns: [0.75, 0.65, 0.5], tp: [0.38, 0.4, 0.36], tpRise: 0.45, bifid: [0, 0, 0.6, 1], nsLean: 0.05, nsW: 0.3, nsLen: 0.7 },
    neck: { n: 16, r: [0.2, 0.17, 0.145, 0.12, 0.1], ns: [0.3, 0.17, 0.11, 0.08, 0.06], tp: [0.26, 0.21, 0.17, 0.13], crib: [0.55, 0.6, 0.55, 0.4, 0.22],
      bifid: [1, 1, 0.6, 0.2, 0], nsLean: 0, nsW: 0.3, cribDrop: 1.3, ridge: true, waist: 0.82, gap: 0.47 },
    ribs: { w: [0.45, 0.85, 0.95, 0.95, 0.8, 0.55], d: [0.7, 1.8, 2.3, 2.4, 2.2, 1.5], r: 0.055, arc: 160, sweep: 0.2, flat: 1.5 },
    pelvis: { w: 0.5, drop: 0.36, r: 0.09, ilium: { len: 1.35, h: 0.8, shape: 'sauro', lean: 0.2 }, pubis: [0.6, -1.0], ischium: [-0.75, -0.8] },
    shoulder: { at: 7.7, drop: 1.4, w: 0.62, scap: { len: 1.55, ang: 55, wid: 0.5, zTop: 0.6 }, cor: 0.24 },
    legs: pair(leg, { target: [0.6, 0.1, 0.72] }, { target: [-0.15, 0.1, 0.72] }),
    arms: pair(arm, { target: [4.05, 6.1, 0.75], seg3: [-0.8, 0.45, 0] }, { target: [3.95, 4.9, 0.75], seg3: [-0.7, 0.6, 0] }),
    skull: { build: (ctx) => SK.diplodocidSkull(ctx, { gape: 8 }), len: 0.62, pitch: -28 },
    mount: { posts: [{ at: 6, r: 0.06 }, { at: 7.4, r: 0.06, x: 1.5 }], rails: [{ from: 6.2, to: 13, r: 0.035, k: 1.25 }] },
  }, opts);
}

/** Generic quadrupedal diplodocid; k = linear scale relative to Apatosaurus. */
function sauroQuad(S, opts) {
  const k = S.k, rb = S.robust ?? 1;
  const lk = S.legK ?? 1;
  const leg = { lens: [1.75 * k * lk, 1.15 * k * lk, 0.28 * k], rad: [0.175 * k * rb, 0.125 * k * rb, 0.055 * k], pole: [1, 0, 0.08], digits: SAURO_PES(0.3 * k, 0.055 * k), metaGap: 2.3, a3: 30 };
  const arm = { lens: [(S.humerus ?? 1.12) * k, (S.radius ?? 0.8) * k, (S.mc ?? 0.3) * k], rad: [0.145 * k * rb, 0.115 * k * rb, 0.05 * k], lower2: 'equal', pole: [-1, 0, 0.1], digits: SAURO_MANUS(0.045 * k), metaGap: 2.2, a3: 4 };
  const fy = 0.11 * k;
  return assemble({
    tone: S.tone || 'fossil', seed: S.seed, colors: S.colors, maxHeight: S.maxHeight, detail: 2,
    spine: S.spine, hip: S.hip, neckAt: S.neckAt,
    tail: { n: S.tailN || 80, r: [0.012, 0.02, 0.035, 0.065, 0.11, 0.17, 0.23].map((v) => v * k * rb), ns: [0, 0, 0, 0.05, 0.22, 0.48, 0.72].map((v) => v * k),
      tp: [0, 0, 0, 0, 0.12, 0.28, 0.4].map((v) => v * k), chev: [0, 0, 0.03, 0.1, 0.2, 0.34, 0.34].map((v) => v * k), nsLean: 0.3 },
    sacrum: { n: 5, len: 1.1 * k, r: 0.23 * k * rb, ns: (S.sacNs ?? 0.85) * k, tp: 0.34 * k },
    dorsal: { n: 10, r: [0.23, 0.22, 0.2].map((v) => v * k * rb), ns: (S.dorNs || [0.85, 0.72, 0.52]).map((v) => v * k), tp: [0.42, 0.46, 0.42].map((v) => v * k), tpRise: 0.45,
      bifid: S.bifid === false ? 0 : [0, 0, 0.6, 1], nsLean: 0.05, nsW: 0.3 },
    neck: { n: S.neckN || 15, r: (S.neckR || [0.2, 0.18, 0.15, 0.125, 0.1]).map((v) => v * k), ns: (S.neckNs || [0.4, 0.26, 0.2, 0.15, 0.1]).map((v) => v * k),
      tp: (S.neckTp || [0.36, 0.32, 0.26, 0.2, 0.14]).map((v) => v * k), crib: (S.neckCrib || [0.6, 0.7, 0.6, 0.42, 0.22]).map((v) => v * k),
      bifid: S.bifid === false ? 0 : [1, 1, 0.7, 0.3, 0], nsLean: 0, nsW: 0.3, cribDrop: S.cribDrop ?? 1.9, cribR: S.cribR ?? 0.34, ridge: !!S.ridge, waist: 0.82, gap: S.ridge ? 0.47 : 0.44 },
    ribs: { w: (S.ribW || [0.45, 0.85, 1.0, 1.0, 0.85, 0.6]).map((v) => v * k), d: (S.ribD || [0.8, 2.0, 2.55, 2.65, 2.3, 1.5]).map((v) => v * k), r: 0.06 * k * rb, arc: 160, sweep: 0.2, flat: 1.5 },
    pelvis: { w: (S.hipW ?? 0.6) * k, drop: 0.38 * k, r: 0.1 * k, ilium: { len: 1.5 * k, h: (S.iliumH ?? 0.85) * k, shape: 'sauro', lean: 0.2 }, pubis: [0.65 * k, -1.05 * k], ischium: [-0.8 * k, -0.85 * k] },
    shoulder: { at: S.shoulderAt, drop: (S.shDrop ?? 1.15) * k, w: (S.shW ?? 0.66) * k, scap: { len: 1.7 * k, ang: 52, wid: 0.52 * k, zTop: 0.6 }, cor: 0.26 * k },
    legs: pair(leg, { target: [S.hindX[0], fy, (S.hipW ?? 0.6) * k * 1.12] }, { target: [S.hindX[1], fy, (S.hipW ?? 0.6) * k * 1.12] }),
    arms: pair(arm, { target: [S.foreX[0], fy, (S.shW ?? 0.66) * k * 1.0] }, { target: [S.foreX[1], fy, (S.shW ?? 0.66) * k * 1.0] }),
    skull: { build: S.skull, len: S.skullLen, pitch: S.skullPitch ?? -25 },
    mount: S.mount,
  }, opts);
}

export function apatosaurus(opts = {}) {
  return sauroQuad({
    k: 1, seed: 460,
    spine: [[-15.6, 1.0], [-13, 1.4], [-10.5, 1.95], [-7.5, 2.62], [-4.5, 3.15], [-2, 3.52], [0, 3.6], [1.8, 3.55], [3.5, 3.4], [5.0, 3.55], [6.4, 3.95], [7.9, 4.6], [9.2, 5.15]],
    hip: 6, neckAt: 8, shoulderAt: 7.75, hindX: [0.3, -0.4], foreX: [3.05, 3.5],
    skull: (ctx) => SK.diplodocidSkull(ctx, { gape: 5 }), skullLen: 0.68, skullPitch: -22,
    mount: { posts: [{ at: 6, r: 0.06 }, { at: 7.6, r: 0.06 }], rails: [{ from: 1.5, to: 5.6, r: 0.03 }, { from: 8, to: 12, r: 0.035, k: 2.3 }] },
  }, opts);
}

export function barosaurus_juvenile(opts = {}) {
  return sauroQuad({
    k: 0.34, robust: 0.92, seed: 6342, tone: 'cast', colors: { cast: 0x6e5f50 }, tailN: 60, neckN: 14,
    spine: [[-4.75, 0.42], [-3.6, 0.7], [-2.4, 0.98], [-1.2, 1.17], [0, 1.24], [0.75, 1.22], [1.42, 1.17], [2.1, 1.34], [2.75, 1.68], [3.3, 2.1]],
    hip: 4, neckAt: 6, shoulderAt: 5.8, hindX: [0.12, -0.14], foreX: [1.2, 1.4],
    neckR: [0.17, 0.15, 0.13, 0.11, 0.1], cribDrop: 1.3, cribR: 0.26, ridge: true,
    skull: (ctx) => SK.diplodocidSkull(ctx, { gape: 4 }), skullLen: 0.3, skullPitch: -15,
    mount: { posts: [{ at: 4, r: 0.022 }, { at: 5.7, r: 0.022 }] },
  }, opts);
}

export function titanosaur(opts = {}) {
  return sauroQuad({
    k: 1.3, robust: 1.12, seed: 2016, tone: 'cast', colors: { cast: 0xb8b0a0, fossil: 0x4a382a }, maxHeight: opts.maxHeight || 5.8, tailN: 66, neckN: 15, bifid: false,
    spine: [[-19.6, 1.6], [-17, 2.15], [-14, 2.8], [-10.8, 3.4], [-7.4, 3.9], [-3.6, 4.25], [0, 4.38], [2.6, 4.52], [5.2, 4.5], [8, 4.45], [11, 4.4], [14, 4.36], [16.5, 4.42]],
    hip: 6, neckAt: 8, shoulderAt: 7.75, hindX: [0.45, -0.5], foreX: [4.75, 5.4],
    humerus: 1.25, radius: 0.85, mc: 0.4, shDrop: 0.9, legK: 0.93, sacNs: 0.5, dorNs: [0.5, 0.45, 0.4], iliumH: 0.72, hipW: 0.72, shW: 0.78,
    ribW: [0.5, 0.98, 1.15, 1.15, 1.0, 0.7], ribD: [0.75, 1.9, 2.4, 2.45, 2.15, 1.5],
    neckR: [0.22, 0.21, 0.19, 0.16, 0.13], neckNs: [0.3, 0.24, 0.2, 0.16, 0.1], neckTp: [0.4, 0.36, 0.3, 0.24, 0.16], neckCrib: [0.9, 1.0, 0.9, 0.6, 0.3], cribDrop: 1.5, cribR: 0.3, ridge: true,
    skull: (ctx) => SK.macronarianSkull(ctx, { gape: 5 }), skullLen: 0.9, skullPitch: -8,
    mount: { posts: [{ at: 6, r: 0.07 }, { at: 7.6, r: 0.07 }, { at: 10.5, r: 0.05 }], rails: [{ from: 1.5, to: 5.6, r: 0.035 }, { from: 8, to: 12.6, r: 0.04, k: 1.9 }] },
  }, opts);
}

// ---------------------------------------------------------------------------
// Stegosaurus
// ---------------------------------------------------------------------------
const PLATE = [[-0.5, 0], [-0.58, 0.32], [-0.36, 0.72], [0, 1], [0.36, 0.72], [0.58, 0.32], [0.5, 0], [0.2, -0.12], [-0.2, -0.12]];
export function stegosaurus(opts = {}) {
  const leg = { lens: [1.08, 0.66, 0.16], rad: [0.075, 0.055, 0.028], pole: [1, 0, 0.1], digits: HOOVES(3, 0.12, 0.035, 50), metaGap: 2.3, a3: 25 };
  const arm = { lens: [0.56, 0.42, 0.13], rad: [0.065, 0.048, 0.024], lower2: 'equal', pole: [-1, 0, 0.45], digits: HOOVES(5, 0.07, 0.024, 90), metaGap: 2.2, a3: 5 };
  return assemble({
    tone: 'fossil', seed: 650, detail: 2,
    spine: [[-3.95, 1.3], [-3.0, 1.48], [-2.0, 1.75], [-1.0, 2.0], [0, 2.14], [0.9, 2.08], [1.8, 1.74], [2.35, 1.4], [2.85, 1.15], [3.2, 1.04]],
    hip: 4, neckAt: 6,
    tail: { n: 42, r: [0.015, 0.03, 0.05, 0.07, 0.09, 0.105], ns: [0.03, 0.08, 0.14, 0.22, 0.32, 0.42], tp: [0, 0.02, 0.06, 0.12, 0.2, 0.25], chev: [0.02, 0.06, 0.1, 0.16, 0.24, 0.22], nsLean: 0.3 },
    sacrum: { n: 4, len: 0.6, r: 0.105, ns: 0.42, tp: 0.2 },
    dorsal: { n: 16, r: [0.105, 0.1, 0.085], ns: [0.44, 0.42, 0.3], tp: [0.26, 0.3, 0.24], tpRise: 0.5, tpUp: 0.4, nsLean: 0.1 },
    neck: { n: 10, r: [0.075, 0.06, 0.045], ns: [0.16, 0.1, 0.06], tp: [0.12, 0.1, 0.07], crib: [0.12, 0.1, 0.05], nsLean: 0.05 },
    ribs: { w: [0.3, 0.55, 0.66, 0.66, 0.56, 0.36], d: [0.35, 0.95, 1.2, 1.2, 1.0, 0.6], r: 0.026, arc: 158, sweep: 0.2 },
    pelvis: { w: 0.4, drop: 0.2, r: 0.055, ilium: { len: 1.25, h: 0.36, shape: 'ornith', lean: -0.25 }, pubis: [-0.75, -0.42], prepubis: [0.55, -0.12], ischium: [-0.7, -0.55] },
    shoulder: { at: 5.8, drop: 0.78, w: 0.42, scap: { len: 0.85, ang: 35, wid: 0.17, zTop: 0.7 }, cor: 0.14 },
    legs: pair(leg, { target: [0.22, 0.06, 0.48] }, { target: [-0.3, 0.06, 0.48] }),
    arms: pair(arm, { target: [1.62, 0.05, 0.55] }, { target: [1.95, 0.05, 0.55] }),
    skull: { build: (ctx) => SK.stegosaurSkull(ctx), len: 0.46, pitch: -12 },
    mount: { posts: [{ at: 4, r: 0.035 }, { at: 5.7, r: 0.03 }], rails: [{ from: 0.5, to: 3.6, r: 0.018 }, { from: 6, to: 9, r: 0.018 }] },
    extra(ctx, parts) {
      const sp = parts.spine, mb = ctx.bone;
      const sizes = [0.16, 0.2, 0.26, 0.32, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.85, 0.72, 0.6, 0.48, 0.38, 0.28];
      const s1 = sp.total - 0.25, s0 = 1.25, n = sizes.length;
      for (let i = 0; i < n; i++) {
        const s = lerp(s1, s0, i / (n - 1)), f = sp.frame(s), side = i % 2 ? 1 : -1, sz = sizes[i];
        let rr = 0.05, ns = 0.1;
        let bd = Infinity;
        for (const v of ctx.verts) { const d = Math.abs(v.s - s); if (d < bd) { bd = d; rr = v.r; ns = v.ns; } }
        const base = f.at(0, rr + ns * 0.85, side * 0.07);
        const up = f.dir(-0.08, 1, side * 0.22), ax = f.t;
        const c = ctx.jit(0.08);
        const th = 0.03 + sz * 0.03;
        mb.poly(PLATE, null, (u, v, layer) => {
          const w = sz * 0.9, h = sz * (i < 5 ? 0.85 : 1.0);
          const bul = (layer ? -1 : 1) * th * 0.5 * (1 - 0.7 * Math.max(0, v));
          return [base[0] + ax[0] * u * w + up[0] * v * h + f.s[0] * bul, base[1] + ax[1] * u * w + up[1] * v * h + f.s[1] * bul, base[2] + ax[2] * u * w + up[2] * v * h + f.s[2] * bul];
        }, { color: c });
      }
      // thagomizer: two pairs of tail spikes
      for (const [s, L] of [[0.3, 0.8], [0.85, 0.9]]) {
        const f = sp.frame(s), c = ctx.jit(0.05);
        for (const sd of [1, -1]) {
          mb.tube([f.at(0, 0.02, sd * 0.02), f.at(-L * 0.3, L * 0.3, sd * L * 0.45), f.at(-L * 0.55, L * 0.5, sd * L * 0.72)], [0.055, 0.04, 0.002], null, { radial: 6, color: c });
        }
      }
    },
  }, opts);
}

// ---------------------------------------------------------------------------
// Triceratops
// ---------------------------------------------------------------------------
export function triceratops(opts = {}) {
  const leg = { lens: [1.0, 0.72, 0.24], rad: [0.105, 0.08, 0.036], pole: [1, 0, 0.15], digits: HOOVES(4, 0.16, 0.04, 60), metaGap: 2.3, a3: 28 };
  const arm = { lens: [0.68, 0.5, 0.16], rad: [0.095, 0.07, 0.03], lower2: 'equal', pole: [-1, 0, 0.6], digits: HOOVES(5, 0.1, 0.03, 90), metaGap: 2.2, a3: 6 };
  return assemble({
    tone: 'fossil', seed: 5116, detail: 2,
    spine: [[-3.55, 0.9], [-2.5, 1.38], [-1.25, 1.88], [0, 2.1], [1.2, 2.14], [2.3, 1.98], [2.8, 1.84], [3.15, 1.7]],
    hip: 3, neckAt: 5,
    tail: { n: 36, r: [0.015, 0.035, 0.06, 0.085, 0.11, 0.125], ns: [0.02, 0.05, 0.1, 0.16, 0.24, 0.3], tp: [0, 0.03, 0.08, 0.15, 0.22, 0.26], chev: [0.02, 0.05, 0.09, 0.14, 0.2, 0.18], nsLean: 0.3 },
    sacrum: { n: 6, len: 0.9, r: 0.13, ns: 0.34, tp: 0.26 },
    dorsal: { n: 12, r: [0.13, 0.125, 0.115], ns: [0.34, 0.36, 0.34], tp: [0.3, 0.32, 0.28], tpRise: 0.3, tpUp: 0.3, nsLean: 0.15 },
    neck: { n: 7, r: [0.115, 0.11, 0.1], ns: [0.24, 0.16, 0.08], tp: [0.18, 0.15, 0.1], nsLean: 0.1 },
    ribs: { w: [0.36, 0.66, 0.82, 0.84, 0.7, 0.45], d: [0.45, 1.15, 1.55, 1.62, 1.4, 0.85], r: 0.038, arc: 160, sweep: 0.2 },
    pelvis: { w: 0.42, drop: 0.24, r: 0.07, ilium: { len: 1.6, h: 0.36, shape: 'ornith', lean: -0.2 }, pubis: [-0.5, -0.4], prepubis: [0.62, -0.1], ischium: [-0.85, -0.6] },
    shoulder: { at: 4.75, drop: 0.8, w: 0.5, scap: { len: 1.05, ang: 38, wid: 0.2, zTop: 0.7 }, cor: 0.18 },
    legs: pair(leg, { target: [0.28, 0.07, 0.52] }, { target: [-0.3, 0.07, 0.52] }),
    arms: pair(arm, { target: [1.95, 0.06, 0.68] }, { target: [2.3, 0.06, 0.68] }),
    skull: { build: (ctx) => SK.ceratopsianSkull(ctx), len: 2.3, pitch: -22 },
    mount: { posts: [{ at: 3, r: 0.04 }, { at: 4.7, r: 0.04 }], rails: [{ from: 0.5, to: 2.7, r: 0.02 }] },
  }, opts);
}

// ---------------------------------------------------------------------------
// Hadrosaurs
// ---------------------------------------------------------------------------
function hadrosaur(S, opts) {
  const k = S.k, pose = S.pose;
  const leg = { lens: [1.15 * k, 1.05 * k, 0.42 * k], rad: [0.085 * k, 0.065 * k, 0.04 * k], pole: [1, 0, 0.1], digits: HOOVES(3, 0.26 * k, 0.045 * k, 56), metaGap: 1.9 };
  const arm = { lens: [0.62 * k, 0.62 * k, 0.28 * k], rad: [0.045 * k, 0.034 * k, 0.016 * k], lower2: 'equal', pole: [-1, 0, 0.2], tarsus: false,
    digits: HOOVES(3, 0.1 * k, 0.016 * k, 30), metaGap: 2.1 };
  const P = (a) => a.map((p) => [p[0] * k, p[1] * k, 0]);
  let spine, legs, arms, pitch, posts;
  if (pose === 'graze') {
    spine = P([[-5.4, 2.0], [-3.9, 2.24], [-2.6, 2.42], [-1.3, 2.52], [0, 2.55], [1.0, 2.3], [1.95, 1.78], [2.45, 1.38], [2.85, 0.98]]);
    legs = pair(leg, { target: [0.45 * k, 0.06 * k, 0.4 * k], a3: 22 }, { target: [-0.5 * k, 0.06 * k, 0.4 * k], a3: 35 });
    arms = pair({ ...arm, a3: 8 }, { target: [1.85 * k, 0.04 * k, 0.36 * k] }, { target: [2.2 * k, 0.04 * k, 0.36 * k] });
    pitch = -50;
  } else if (pose === 'walk') {
    spine = P([[-5.3, 1.95], [-3.9, 2.2], [-2.6, 2.4], [-1.3, 2.52], [0, 2.56], [1.05, 2.5], [2.05, 2.25], [2.55, 2.35], [2.95, 2.7], [3.2, 3.02]]);
    legs = pair(leg, { target: [0.55 * k, 0.06 * k, 0.4 * k], a3: 20 }, { target: [-0.55 * k, 0.06 * k, 0.4 * k], a3: 38 });
    arms = pair({ ...arm, a3: 8 }, { target: [1.75 * k, 0.04 * k, 0.36 * k] }, { target: [2.25 * k, 0.04 * k, 0.36 * k], a3: 25 });
    pitch = -18;
  } else {
    spine = P([[-5.3, 0.75], [-3.9, 1.3], [-2.6, 1.85], [-1.3, 2.38], [0, 2.75], [1.0, 3.28], [1.9, 3.85], [2.3, 4.3], [2.5, 4.75], [2.8, 5.02]]);
    legs = pair(leg, { target: [0.4 * k, 0.06 * k, 0.4 * k], a3: 14 }, { target: [-0.25 * k, 0.06 * k, 0.4 * k], a3: 22 });
    arms = pair({ ...arm, ground: false, pole: [-1, 0.2, 0.2] }, { target: [2.75 * k, 2.3 * k, 0.4 * k], seg3: [-0.5, 0.85, 0] }, { target: [2.65 * k, 2.2 * k, 0.4 * k], seg3: [-0.4, 0.9, 0] });
    pitch = -12;
  }
  const hi = pose === 'graze' ? 4 : 4;
  return assemble({
    tone: S.tone || 'fossil', seed: S.seed,
    spine, hip: hi, neckAt: 6,
    tail: { n: 52, r: [0.015, 0.03, 0.05, 0.07, 0.09, 0.105].map((v) => v * k), ns: [0.03, 0.07, 0.13, 0.2, 0.3, 0.42].map((v) => v * k), tp: [0, 0, 0.04, 0.1, 0.18, 0.22].map((v) => v * k),
      chev: [0.02, 0.06, 0.11, 0.18, 0.27, 0.26].map((v) => v * k), nsLean: 0.5, chevLean: 0.8 },
    sacrum: { n: 8, len: 0.95 * k, r: 0.11 * k, ns: 0.5 * k, tp: 0.18 * k, nsLean: 0.3 },
    dorsal: { n: 16, r: [0.11, 0.105, 0.095].map((v) => v * k), ns: [0.5, 0.52, 0.4].map((v) => v * k), tp: [0.22, 0.24, 0.2].map((v) => v * k), tpRise: 0.25, tpUp: 0.3, nsLean: 0.3 },
    neck: { n: 12, r: [0.085, 0.07, 0.06].map((v) => v * k), ns: [0.16, 0.08, 0.05].map((v) => v * k), tp: [0.14, 0.11, 0.08].map((v) => v * k), crib: [0.12, 0.1, 0.06].map((v) => v * k), nsLean: 0.1 },
    ribs: { w: [0.24, 0.42, 0.52, 0.54, 0.46, 0.3].map((v) => v * k), d: [0.35, 0.9, 1.25, 1.35, 1.15, 0.7].map((v) => v * k), r: 0.026 * k, arc: 155, sweep: 0.25 },
    pelvis: { w: 0.3 * k, drop: 0.25 * k, r: 0.055 * k, ilium: { len: 1.35 * k, h: 0.4 * k, shape: 'ornith', lean: 0.1 }, pubis: [-0.6 * k, -0.5 * k], prepubis: [0.6 * k, -0.25 * k], ischium: [-0.95 * k, -0.75 * k] },
    shoulder: { at: 5.75, drop: 0.85 * k, w: 0.36 * k, scap: { len: 0.95 * k, ang: 28, wid: 0.13 * k, zTop: 0.75 }, cor: 0.1 * k },
    legs, arms,
    skull: { build: (ctx) => SK.hadrosaurSkull(ctx, { crest: S.crest }), len: S.skullLen, pitch },
    mount: { posts: [{ at: 4, r: 0.04 * k }, { at: 5.6, r: 0.035 * k }], rails: [{ from: 0.5, to: 3.6, r: 0.02 }, { from: 6, to: spine.length - 1, r: 0.018 }] },
  }, opts);
}
export function anatotitan(opts = {}) {
  const pose = opts.pose === 'graze' ? 'graze' : 'stand';
  return hadrosaur({ k: 1, pose, seed: 5730, crest: 'none', skullLen: 1.25 }, opts);
}
export function corythosaurus(opts = {}) {
  const pose = opts.pose === 'stand' || opts.pose === 'graze' ? opts.pose : 'walk';
  return hadrosaur({ k: 0.82, pose, seed: 5240, crest: 'helmet', skullLen: 0.78 }, opts);
}

// ---------------------------------------------------------------------------
// small theropods
// ---------------------------------------------------------------------------
/** k = linear scale relative to Deinonychus (3.3 m). */
function smallTheropod(S, opts) {
  const k = S.k;
  const sickle = S.sickle;
  const foot = { list: [
    sickle ? { len: 0.1 * k, ang: -14, claw: 0.15 * k * sickle, ph: 2, lift: 55, curl: 1.3, clawR: 1.5 } : { len: 0.13 * k, ang: -22, claw: 0.05 * k, ph: 3 },
    { len: 0.17 * k, ang: 0, claw: 0.06 * k, ph: 3 },
    { len: 0.14 * k, ang: 18, claw: 0.055 * k, ph: 3 },
  ], r: 0.014 * k, arch: 0.08 };
  const leg = { lens: [0.34 * k, 0.38 * k, (S.mt ?? 0.18) * k], rad: [0.03 * k, 0.022 * k, 0.012 * k], pole: [1, 0.2, 0.15], digits: foot, metaGap: 1.7, ...S.leg };
  const arm = { lens: [0.24 * k, 0.19 * k, 0.09 * k].map((v) => v * (S.armK ?? 1)), rad: [0.016 * k, 0.011 * k, 0.006 * k], lower2: 'equal', ground: false, pole: [-1, -0.2, 0.4], tarsus: false,
    digits: { n: S.fingers ?? 3, len: 0.13 * k * (S.armK ?? 1), spread: 34, r: 0.007 * k, claw: 0.09 * k * (S.armK ?? 1), ph: 3, clawR: 1.3 }, metaGap: 2.3, curlDir: [-0.5, -1, 0], ...S.arm };
  const r = 0.035 * k;
  const stiff = S.stiffTail;
  return assemble({
    tone: S.tone || 'fossil', seed: S.seed, colors: S.colors, floor: S.floor,
    spine: S.spine, hip: S.hip, neckAt: S.neckAt,
    tail: { n: S.tailN || 40, len: [0.7, 0.9, 1, 1], r: [0.12, 0.3, 0.55, 0.8, 0.95].map((v) => v * r), ns: [0, 0.01, 0.03, 0.07, 0.12].map((v) => v * k), tp: [0, 0, 0.02, 0.05, 0.08].map((v) => v * k),
      chev: [0, 0.01, 0.03, 0.06, 0.09].map((v) => v * k), nsLean: 0.4 },
    sacrum: { n: 5, len: 0.26 * k, r, ns: 0.13 * k, tp: 0.05 * k },
    dorsal: { n: 13, r: [r, r * 0.95, r * 0.85], ns: [0.13, 0.12, 0.1].map((v) => v * k), tp: [0.08, 0.08, 0.07].map((v) => v * k), nsLean: 0.12, tpUp: 0.3 },
    neck: { n: 10, r: [r * 0.8, r * 0.7, r * 0.62], ns: [0.06, 0.04, 0.03].map((v) => v * k), tp: [0.05, 0.045, 0.035].map((v) => v * k), crib: [0.08, 0.08, 0.04].map((v) => v * k), nsLean: 0.05 },
    ribs: { w: [0.07, 0.12, 0.15, 0.16, 0.14, 0.09].map((v) => v * k), d: [0.1, 0.26, 0.36, 0.4, 0.35, 0.2].map((v) => v * k), r: 0.009 * k, arc: 152, sweep: 0.22 },
    pelvis: { w: 0.085 * k, drop: 0.08 * k, r: 0.02 * k, ilium: { len: 0.4 * k, h: 0.19 * k, shape: 'thero', lean: 0.3 }, pubis: S.pubis || [-0.1 * k, -0.34 * k], ischium: [-0.24 * k, -0.17 * k], boot: 0.07 * k },
    shoulder: { at: S.shoulderAt, drop: 0.27 * k, w: 0.11 * k, scap: { len: 0.3 * k, ang: 30, wid: 0.05 * k, zTop: 0.7 }, cor: 0.045 * k },
    legs: S.legs(leg), arms: S.arms(arm),
    skull: S.skull, mount: S.mount, extra: S.extra,
    ...(stiff ? {} : {}),
  }, opts);
}

/** Deinonychus — AMNH mount, leaping with the sickle claws swung forward. */
export function deinonychus(opts = {}) {
  return smallTheropod({
    k: 1, seed: 3015, sickle: 1, floor: 0,
    spine: [[-2.0, 1.36], [-1.3, 1.52], [-0.65, 1.64], [0, 1.72], [0.4, 1.87], [0.8, 2.04], [1.02, 2.24], [1.16, 2.45]],
    hip: 3, neckAt: 5, shoulderAt: 4.75,
    legs: (leg) => pair({ ...leg, ground: false, pole: [1, 0.6, 0.2], curlDir: [-0.3, -1, 0] },
      { target: [0.62, 1.22, 0.16], seg3: [-0.55, 0.85, 0], toeDir: [0.85, -0.5, 0] }, { target: [0.4, 0.98, 0.16], seg3: [-0.75, 0.65, 0], toeDir: [0.95, -0.3, 0] }),
    arms: (arm) => pair(arm, { target: [1.22, 1.75, 0.2], seg3: [-0.9, 0.4, 0] }, { target: [1.15, 1.6, 0.2], seg3: [-0.8, 0.6, 0] }),
    skull: { build: (ctx) => SK.slenderTheropodSkull(ctx, { gape: 30, deep: 1.05, teeth: 1.2 }), len: 0.34, pitch: 2 },
    mount: { posts: [{ at: 3, r: 0.022 }], rails: [{ from: 0.5, to: 2.7, r: 0.008 }] },
  }, opts);
}

export function velociraptor(opts = {}) {
  const k = 0.56;
  return smallTheropod({
    k, seed: 6515, sickle: 0.9,
    spine: [[-1.1, 0.52], [-0.72, 0.56], [-0.36, 0.58], [0, 0.58], [0.22, 0.6], [0.45, 0.6], [0.56, 0.7], [0.62, 0.82]],
    hip: 3, neckAt: 5, shoulderAt: 4.75,
    legs: (leg) => pair(leg, { target: [0.16, 0.012, 0.07], a3: 22 }, { target: [-0.12, 0.012, 0.07], a3: 38 }),
    arms: (arm) => pair(arm, { target: [0.6, 0.36, 0.1], seg3: [-0.6, 0.8, 0] }, { target: [0.56, 0.38, 0.1], seg3: [-0.5, 0.85, 0] }),
    skull: { build: (ctx) => SK.slenderTheropodSkull(ctx, { gape: 10, deep: 0.85 }), len: 0.24, pitch: -8 },
    mount: { posts: [{ at: 3, r: 0.008 }, { at: 4.6, r: 0.008 }] },
  }, opts);
}

export function coelophysis(opts = {}) {
  const k = 0.82;
  return smallTheropod({
    k, seed: 7224, mt: 0.2, armK: 0.8, fingers: 3, pubis: [0.12 * k, -0.36 * k], tailN: 44,
    spine: [[-1.62, 0.7], [-1.1, 0.78], [-0.55, 0.82], [0, 0.82], [0.3, 0.84], [0.62, 0.84], [0.84, 0.98], [1.0, 1.18], [1.1, 1.3]],
    hip: 3, neckAt: 5, shoulderAt: 4.75,
    leg: { rad: [0.02 * k, 0.015 * k, 0.009 * k] },
    legs: (leg) => pair(leg, { target: [0.24, 0.016, 0.09], a3: 20 }, { target: [-0.2, 0.016, 0.09], a3: 40 }),
    arms: (arm) => pair(arm, { target: [0.78, 0.48, 0.12], seg3: [-0.5, 0.85, 0] }, { target: [0.74, 0.5, 0.12], seg3: [-0.4, 0.9, 0] }),
    skull: { build: (ctx) => SK.slenderTheropodSkull(ctx, { gape: 8, deep: 0.72, teeth: 0.7 }), len: 0.26, pitch: -10 },
    mount: { posts: [{ at: 3, r: 0.008 }, { at: 4.6, r: 0.008 }] },
  }, opts);
}

/** Oviraptorid brooding on its nest (after the "Big Mama" Citipati specimen): crouched over a ring of eggs. */
export function oviraptor(opts = {}) {
  const k = 0.62;
  return smallTheropod({
    k, seed: 9770, armK: 1.05, pubis: [0.06 * k, -0.2 * k], tailN: 30,
    spine: [[-0.95, 0.2], [-0.62, 0.3], [-0.3, 0.38], [0, 0.42], [0.2, 0.46], [0.42, 0.5], [0.52, 0.62], [0.52, 0.76], [0.58, 0.86]],
    hip: 3, neckAt: 5, shoulderAt: 4.75,
    legs: (leg) => pair({ ...leg, pole: [1, 0.5, 0.5], a3: 80 }, { target: [0.34, 0.02, 0.2] }, { target: [0.32, 0.02, 0.2] }),
    arms: (arm) => pair({ ...arm, pole: [-0.3, 0.2, 1], curlDir: [0, -1, 0] }, { target: [0.3, 0.14, 0.36], seg3: [0.5, 0.5, -0.7] }, { target: [0.3, 0.14, 0.36], seg3: [0.5, 0.5, -0.7] }),
    skull: { build: (ctx) => SK.oviraptorSkull(ctx, { gape: 5 }), len: 0.17, pitch: -12 },
    extra(ctx) {
      // nest: two rings of elongated eggs, blunt ends up and tilted inwards, on a low mound of sediment
      const eg = ctx.tone === 'fossil' ? [0.11, 0.075, 0.05] : [ctx.base[0] * 1.1, ctx.base[1] * 1.05, ctx.base[2] * 0.95];
      for (const [n, R, y, ph0] of [[12, 0.36, 0.05, 0], [8, 0.2, 0.06, 0.3]]) {
        for (let i = 0; i < n; i++) {
          const a = ph0 + (i / n) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
          const ax = [ca * 0.82, 0.57, sa * 0.82];
          const side = [-sa, 0, ca], up = [ax[1] * side[2] - ax[2] * side[1], ax[2] * side[0] - ax[0] * side[2], ax[0] * side[1] - ax[1] * side[0]];
          const j = 0.9 + 0.2 * ctx.rnd();
          ctx.bone.ellipsoid([0.12 + ca * R, y, sa * R], [0.085, 0.036, 0.036], { axes: [ax, up, side], seg: 7, rings: 5, color: [eg[0] * j, eg[1] * j, eg[2] * j] });
        }
      }
    },
  }, opts);
}
