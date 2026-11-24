// Parametric skeleton engine: spine -> vertebrae, ribs, girdles, limbs (IK), skull attachment, mount armature.
import * as THREE from 'three';
import { Geo, col, mulberry } from '../../engine/builder.js';
import { MB } from './mesh.js';

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rad = (d) => d * Math.PI / 180;
export const vadd = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
export const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const vlerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const vlen = (a) => Math.hypot(a[0], a[1], a[2]);
export const vnorm = (a) => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const vscale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

/** Evenly spaced profile lookup: number, or array interpolated linearly over t in 0..1. */
export function prof(v, t) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const n = v.length;
  if (n === 1) return v[0];
  const x = clamp(t, 0, 1) * (n - 1);
  const i = Math.min(n - 2, Math.floor(x));
  return lerp(v[i], v[i + 1], x - i);
}
/** Piecewise-linear lookup through [[x, y], ...] sorted by x. */
export function pw(tab, x) {
  if (typeof tab === 'number') return tab;
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) return lerp(tab[i - 1][1], tab[i][1], (x - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0] || 1));
  return tab[tab.length - 1][1];
}

/** Local frame on the spine: p origin, t towards the head, u dorsal, s to the animal's left (+z). */
export class Frame {
  constructor(p, t, u, s) { this.p = p; this.t = t; this.u = u; this.s = s; }
  at(dt = 0, du = 0, ds = 0) {
    const { p, t, u, s } = this;
    return [p[0] + t[0] * dt + u[0] * du + s[0] * ds, p[1] + t[1] * dt + u[1] * du + s[1] * ds, p[2] + t[2] * dt + u[2] * du + s[2] * ds];
  }
  dir(dt = 0, du = 0, ds = 0) {
    const { t, u, s } = this;
    return [t[0] * dt + u[0] * du + s[0] * ds, t[1] * dt + u[1] * du + s[1] * ds, t[2] * dt + u[2] * du + s[2] * ds];
  }
}

export class Spine {
  /** ctrl: [[x,y,z?], ...] tail tip -> skull joint. hipIdx: control index where the side vector is exactly +z. */
  constructor(ctrl, hipIdx = 0) {
    const pts = ctrl.map((p) => new THREE.Vector3(p[0], p[1], p[2] || 0));
    this.n = pts.length;
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const K = this.K = 24, N = this.N = K * (this.n - 1);
    const P = this.P = [], S = this.S = [0], T = this.T = [], D = this.D = [];
    const v = new THREE.Vector3();
    for (let i = 0; i <= N; i++) { curve.getPoint(i / N, v); P.push([v.x, v.y, v.z]); }
    for (let i = 1; i <= N; i++) S.push(S[i - 1] + vlen(vsub(P[i], P[i - 1])));
    for (let i = 0; i <= N; i++) T.push(vnorm(vsub(P[Math.min(N, i + 1)], P[Math.max(0, i - 1)])));
    const h = clamp(Math.round(hipIdx * K), 0, N);
    const proj = (sv, t) => vnorm(vadd(sv, t, -vdot(sv, t)));
    D[h] = proj([0, 0, 1], T[h]);
    for (let i = h + 1; i <= N; i++) D[i] = proj(D[i - 1], T[i]);
    for (let i = h - 1; i >= 0; i--) D[i] = proj(D[i + 1], T[i]);
    this.total = S[N];
  }
  /** arc length at (fractional) control index */
  sAt(ci) {
    const x = clamp(ci, 0, this.n - 1) * this.K, i = Math.min(this.N - 1, Math.floor(x));
    return lerp(this.S[i], this.S[i + 1], x - i);
  }
  frame(s) {
    const S = this.S, N = this.N;
    s = clamp(s, 0, this.total);
    let lo = 0, hi = N;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
    const f = (s - S[lo]) / (S[hi] - S[lo] || 1);
    const p = vlerp(this.P[lo], this.P[hi], f);
    const t = vnorm(vlerp(this.T[lo], this.T[hi], f));
    let sd = vlerp(this.D[lo], this.D[hi], f);
    sd = vnorm(vadd(sd, t, -vdot(sd, t)));
    return new Frame(p, t, vcross(sd, t), sd);
  }
  frameAt(ci) { return this.frame(this.sAt(ci)); }
}

const TONES = { fossil: 0x3a2c22, cast: 0xa89c88 };

export class Ctx {
  constructor(spec = {}, opts = {}) {
    this.bone = new MB(); this.ds = new MB(); this.metal = new MB();
    this.rnd = mulberry(spec.seed || 11);
    this.tone = opts.tone === 'fossil' || opts.tone === 'cast' ? opts.tone : (spec.tone || 'fossil');
    const hex = (spec.colors && spec.colors[this.tone]) ?? TONES[this.tone];
    this.base = col(hex).slice();
    this.dark = this.base.map((v) => v * 0.16);
    this.steel = col(0x2a2a2c);
    this.scale = opts.scale || 1;
    this.verts = [];
    this.debug = !!opts.debug;
    this.spec = spec;
    this.maxHeight = spec.maxHeight || 0;
    this.floor = spec.floor;
    this.detail = spec.detail || 1;
  }
  /** base bone colour with per-piece variation */
  jit(k = 0.08, mul = 1) {
    const f = (1 + (this.rnd() - 0.5) * 2 * k) * mul, w = (this.rnd() - 0.5) * 0.06;
    const b = this.base;
    return [b[0] * f * (1 + w), b[1] * f, b[2] * f * (1 - w)];
  }
  tooth() {
    const b = this.base;
    return this.tone === 'fossil' ? [b[0] * 1.9 + 0.01, b[1] * 1.8 + 0.008, b[2] * 1.6 + 0.005] : [b[0] * 1.05, b[1] * 1.05, b[2] * 1.02];
  }
  warn(...a) { if (this.debug) console.error('[skeleton]', ...a); }
  /** centrum radius near arc length s */
  radiusAt(s) {
    let best = 0.05, bd = Infinity;
    for (const v of this.verts) { const d = Math.abs(v.s - s); if (d < bd) { bd = d; best = v.r; } }
    return best;
  }
  minY() { return Math.min(this.bone.count ? this.bone.minY() : Infinity, this.ds.count ? this.ds.minY() : Infinity); }
  finish() {
    const minY = this.minY();
    const y0 = this.floor != null ? this.floor : (isFinite(minY) ? minY : 0);
    if (this.pendingMount) drawMount(this, this.pendingMount, y0);
    { const mp = this.metal.pos; for (let i = 1; i < mp.length; i += 3) if (mp[i] < y0) mp[i] = y0; }
    const s = this.scale;
    let ys = 1;
    if (this.maxHeight) {
      const top = Math.max(this.bone.count ? this.bone.maxY() : 0, this.ds.count ? this.ds.maxY() : 0) - y0;
      if (top > this.maxHeight) ys = this.maxHeight / top;
    }
    const m = new THREE.Matrix4().makeScale(s, s * ys, s).multiply(new THREE.Matrix4().makeTranslation(0, -y0, 0));
    const g = new Geo();
    for (const [name, mb] of [['bone', this.bone], ['bone_ds', this.ds], ['metal', this.metal]]) {
      if (!mb.count) continue;
      const geo = mb.toGeometry();
      g.add(name, geo, m);
      geo.dispose();
    }
    return g;
  }
}

// ---------------------------------------------------------------------------
// vertebral column
// ---------------------------------------------------------------------------
function vertebra(ctx, v, P) {
  const mb = ctx.bone, f = v.f, r = v.r, len = v.len;
  const c = ctx.jit(P.jit ?? 0.09);
  const hl = len * (P.fused ? 0.5 : (P.gap ?? 0.44));
  const radial = P.radial || (ctx.detail > 1 ? 8 : 6);
  const rk = P.waist ?? 0.8;
  const ry = r * (P.cy ?? 1);
  mb.tube([f.at(-hl), f.at(-hl * 0.45), f.at(hl * 0.45), f.at(hl)], [r, r * rk, r * rk, r], [ry, ry * rk, ry * rk, ry], { radial, color: c, up: f.u, bulge: 0.15 });
  const nsLean = P.nsLean ?? 0.25;
  const nsW = (P.nsW ?? 0.22) * r;
  const tipK = P.nsTip ?? 0.8;
  const nsL = hl * (P.nsLen ?? 1.0);
  if (v.ns > 0.012 && P.ridge) {
    // elongated cervicals: a long low neural arch running the length of the centrum, reaching towards its neighbours
    const bif = prof(P.bifid, v.t), hh = len * 0.5;
    for (const s of bif > 0.05 ? [1, -1] : [0]) {
      const z = s * (r * 0.25 + v.ns * bif * 0.35);
      mb.tube([f.at(-hh * 1.02, ry * 0.75, z * 0.6), f.at(-hh * 0.45, ry * 0.8 + v.ns * 0.9, z), f.at(hh * 0.3, ry * 0.8 + v.ns * 0.75, z), f.at(hh * 1.02, ry * 0.8, z * 0.5)],
        [nsW * 1.2, nsW * 1.5, nsW * 1.4, nsW * 1.1], [v.ns * 0.3, v.ns * 0.5, v.ns * 0.42, v.ns * 0.25], { radial: 5, color: c, up: f.u });
    }
    mb.tube([f.at(0, ry * 0.3, 0), f.at(-hh * 0.1, ry * 0.8 + v.ns * 0.5, 0)], [r * 0.7, r * 0.5], [hh * 0.5, hh * 0.45], { radial: 4, color: c, up: f.t, cap: 'none' });
  } else if (v.ns > 0.012) {
    const bif = prof(P.bifid, v.t);
    const top = ry + v.ns;
    if (bif > 0.05) {
      for (const s of [1, -1]) {
        mb.tube([f.at(0, ry * 0.6, s * r * 0.2), f.at(-v.ns * nsLean * 0.5, ry + v.ns * 0.55, s * (r * 0.3 + v.ns * bif * 0.3)), f.at(-v.ns * nsLean, top, s * (r * 0.3 + v.ns * bif * 0.55))],
          [nsW * 1.3, nsW, nsW * 0.8], [nsL, nsL * 0.8, nsL * 0.6 * tipK], { radial: 4, color: c, up: f.t });
      }
    } else {
      mb.tube([f.at(0, ry * 0.55), f.at(-v.ns * nsLean * 0.45, ry + v.ns * 0.5), f.at(-v.ns * nsLean, top)],
        [Math.max(nsW * 1.6, r * 0.45), nsW, nsW * (P.nsTipW ?? 0.9)], [nsL, nsL * 0.78, nsL * tipK], { radial: 4, color: c, up: f.t });
    }
  }
  v.tpTip = null;
  if (v.tp > 0.012) {
    const y0 = ry * 0.7 + (P.tpRise ?? 0) * v.ns, y1 = y0 + (P.tpUp ?? 0.1) * v.tp, back = (P.tpBack ?? 0) * v.tp;
    for (const s of [1, -1]) {
      mb.tube([f.at(0, y0 * 0.8, s * r * 0.4), f.at(-back, y1, s * v.tp)], [hl * 0.5, hl * 0.32], [r * 0.3, r * 0.2], { radial: 4, color: c, up: f.u });
    }
    v.tpTip = [-back, y1, v.tp];
  }
  if (v.chev > 0.012) {
    const cl = P.chevLean ?? 0.6;
    mb.tube([f.at(-len * 0.5, -ry * 0.75), f.at(-len * 0.5 - v.chev * cl, -ry * 0.8 - v.chev)], [r * 0.3, r * 0.12], [hl * 0.45, hl * (P.chevTip ?? 0.3)], { radial: 4, color: c, up: f.t });
  }
  if (v.crib > 0.012) {
    for (const s of [1, -1]) {
      mb.tube([f.at(hl * 0.3, -ry * 0.2, s * r * 0.7), f.at(hl * 0.5, -ry * (P.cribDrop ?? 1.05), s * r * 1.05), f.at(hl * 0.2 - v.crib, -ry * ((P.cribDrop ?? 1.05) + 0.15), s * r * 1.0)], [r * (P.cribR ?? 0.26), r * (P.cribR ?? 0.26), r * 0.1], null, { radial: 4, color: c });
    }
  }
}

/** Lay n vertebrae along arc interval [s0, s1]. Profiles in P run with t = 0 at s0. Returns the vertebra records. */
export function column(ctx, s0, s1, n, P) {
  const sp = ctx.spine, out = [], L = s1 - s0;
  if (n < 1 || L <= 0) return out;
  const w = []; let tot = 0;
  for (let i = 0; i < n; i++) { const wi = prof(P.len ?? 1, (i + 0.5) / n); w.push(wi); tot += wi; }
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const len = w[i] / tot * L, s = s0 + acc + len / 2;
    acc += len;
    const t = (s - s0) / L;
    const v = { f: sp.frame(s), s, len, t, i, r: prof(P.r, t), ns: prof(P.ns, t), tp: prof(P.tp, t), chev: prof(P.chev, t), crib: prof(P.crib, t) };
    vertebra(ctx, v, P);
    out.push(v);
    ctx.verts.push(v);
  }
  return out;
}

/**
 * Rib cage on the given (dorsal) vertebrae. R: { w, d (profiles hip -> neck: half-width, depth), r (rib radius),
 * arc (deg, how far the rib curls round), sweep (backward rake as a fraction of depth), from, to (t range), n }.
 */
export function ribcage(ctx, verts, R) {
  const mb = ctx.bone, tips = [];
  const arc = rad(R.arc ?? 150), n = R.n || (ctx.detail > 1 ? 10 : 7);
  for (const v of verts) {
    if (v.t < (R.from ?? 0) || v.t > (R.to ?? 1)) continue;
    const W = prof(R.w, v.t), D = prof(R.d, v.t);
    if (D < 0.03 || W < 0.02) continue;
    const f = v.f, rr = prof(R.r, v.t), c = ctx.jit(0.08);
    const tp = v.tpTip || [0, v.r * 0.8, v.r];
    const z0 = Math.min(tp[2], W * 0.9), y0 = tp[1], x0 = tp[0];
    const p0 = Math.asin(clamp(z0 / W, 0, 0.95));
    const sweep = prof(R.sweep ?? 0.25, v.t) * D;
    for (const s of [1, -1]) {
      const pts = [f.at(0, v.r * 0.35, s * v.r * 0.85)], rx = [rr * 0.7], ry = [rr * 0.9];
      for (let k = 0; k <= n; k++) {
        const a = k / n, ph = lerp(p0, arc, a);
        const z = W * Math.sin(ph), y = y0 - D * (Math.cos(p0) - Math.cos(ph)) / (Math.cos(p0) - Math.cos(arc));
        pts.push(f.at(x0 - sweep * Math.pow(a, 1.3), y, s * z));
        const tk = 1 - 0.45 * a;
        rx.push(rr * 0.62 * tk); ry.push(rr * tk * (R.flat ?? 1));
      }
      mb.tube(pts, rx, ry, { radial: ctx.detail > 1 ? 6 : 5, color: c, up: f.t });
      tips.push({ p: pts[pts.length - 1], s, v });
    }
  }
  return tips;
}

// ---------------------------------------------------------------------------
// girdles
// ---------------------------------------------------------------------------
const ILIA = {
  thero: [[-0.55, 0.45], [-0.5, 0.8], [-0.25, 1.0], [0.15, 1.0], [0.42, 0.85], [0.5, 0.55], [0.44, 0.35], [0.26, 0.3], [0.17, -0.05], [0.1, 0.0], [0.06, 0.18], [-0.06, 0.18], [-0.1, 0.0], [-0.17, -0.05], [-0.24, 0.3], [-0.45, 0.32]],
  sauro: [[-0.4, 0.35], [-0.42, 0.6], [-0.3, 0.85], [-0.05, 1.0], [0.25, 0.95], [0.5, 0.72], [0.6, 0.45], [0.5, 0.3], [0.3, 0.3], [0.2, -0.04], [0.11, 0.0], [0.07, 0.18], [-0.07, 0.18], [-0.11, 0], [-0.2, -0.04], [-0.26, 0.3]],
  ornith: [[-0.5, 0.4], [-0.46, 0.75], [-0.2, 0.95], [0.2, 0.95], [0.42, 0.82], [0.78, 0.5], [0.74, 0.36], [0.42, 0.52], [0.25, 0.35], [0.15, -0.04], [0.08, 0.0], [0.05, 0.18], [-0.05, 0.18], [-0.08, 0], [-0.15, -0.04], [-0.22, 0.35], [-0.42, 0.3]],
};

/**
 * Pelvis at the hip frame. G: { w, drop, fwd, ilium: { len, h, shape, lean, th }, pubis: [dx, dy], ischium: [dx, dy],
 * r, boot, prepubis: [dx, dy], type: 'dino' | 'mammal', il: [dx,dy,dz], is: [dx,dy,dz], pb: [dx,dy], face }
 * Returns acetabulum positions { L, R }.
 */
export function pelvis(ctx, G) {
  const f = ctx.hipFrame, mb = ctx.bone;
  const w = G.w, drop = G.drop, fwd = G.fwd || 0, r = G.r || w * 0.18;
  const out = {};
  const c = ctx.jit(0.05);
  for (const s of [1, -1]) {
    const A = f.at(fwd, -drop, s * w);
    out[s > 0 ? 'L' : 'R'] = A;
    if (G.type === 'mammal') {
      const il = G.il, is = G.is, pb = G.pb;
      const top = f.at(fwd + il[0], -drop + il[1], s * il[2]);
      const wing = G.wing ?? 3;
      mb.tube([A, vlerp(A, top, 0.3), vlerp(A, top, 0.62), vlerp(A, top, 0.88), top], [r * 1.1, r * 1.0, r * wing * 0.85, r * wing, r * wing * 0.55], [r * 1.1, r * 0.7, r * 0.45, r * 0.38, r * 0.3],
        { radial: 8, color: c, up: G.face === 'front' ? f.t : G.face === 'dorsal' ? f.u : f.s });
      const it = f.at(fwd + is[0], -drop + is[1], s * is[2]);
      mb.tube([A, vlerp(A, it, 0.6), it], [r * 0.9, r * 0.7, r * 1.1], [r * 0.9, r * 0.6, r * 0.6], { radial: 5, color: c, up: f.s });
      const pt = f.at(fwd + pb[0], -drop + pb[1], 0);
      mb.tube([A, vlerp(A, pt, 0.6), pt], [r * 0.7, r * 0.5, r * 0.6], null, { radial: 5, color: c });
      mb.tube([it, pt], r * 0.45, null, { radial: 4, color: c });
      continue;
    }
    const I = G.ilium, th = I.th || r * 0.5, lean = I.lean ?? 0.25;
    const outl = Array.isArray(I.shape) ? I.shape : ILIA[I.shape || 'thero'];
    mb.poly(outl, null, (u, v, layer) => f.at(fwd + u * I.len, -drop + v * I.h, s * Math.max(0.01, w + r * 0.3 - lean * Math.max(0, v) * I.h - layer * th)), { flip: s < 0, color: c });
    if (G.pubis) {
      const tip = f.at(fwd + G.pubis[0], -drop + G.pubis[1], s * (G.pubisZ ?? r * 0.35));
      mb.bone(f.at(fwd + I.len * 0.13, -drop - I.h * 0.02, s * w), tip, r * 0.8, r * 0.6, { color: c, knob: 1.3, flat: 0.7, up: f.s });
    }
    if (G.ischium) {
      const tip = f.at(fwd + G.ischium[0], -drop + G.ischium[1], s * (G.ischiumZ ?? r * 0.35));
      mb.bone(f.at(fwd - I.len * 0.13, -drop - I.h * 0.02, s * w), tip, r * 0.75, r * 0.5, { color: c, knob: 1.25, flat: 0.7, up: f.s });
    }
    if (G.prepubis) {
      const a = f.at(fwd + I.len * 0.13, -drop - I.h * 0.02, s * w), tip = f.at(fwd + G.prepubis[0], -drop + G.prepubis[1], s * w * 1.1);
      mb.tube([a, vlerp(a, tip, 0.5), tip], [r * 0.5, r * 0.45, r * 0.9], [r * 0.5, r * 0.3, r * 0.25], { radial: 5, color: c, up: f.s });
    }
  }
  if (G.type !== 'mammal' && G.boot && G.pubis) {
    const p = f.at(fwd + G.pubis[0] - G.boot * 0.25, -drop + G.pubis[1], 0);
    mb.ellipsoid(p, [G.boot, r * 0.7, r * 0.75], { axes: [f.t, f.u, f.s], color: c, seg: 7 });
  }
  return out;
}

const SCAPS = {
  strap: [[-0.08, -0.5], [0.06, -0.45], [0.22, -0.2], [0.6, -0.18], [1.0, -0.32], [1.03, 0], [1.0, 0.32], [0.6, 0.18], [0.22, 0.25], [0.06, 0.6], [-0.1, 0.5], [-0.12, 0]],
  fan: [[-0.06, -0.14], [0.12, -0.15], [0.55, -0.34], [1.0, -0.52], [1.03, -0.1], [1.0, 0.42], [0.55, 0.26], [0.14, 0.14], [-0.06, 0.12], [-0.1, 0]],
};

/**
 * Shoulder girdle. Sh: { at (spine control index), drop, w, fwd, scap: { len, ang, wid, zTop, shape, th }, cor (coracoid radius),
 * clav: bool (clavicle to the midline), sternum: { len, w } }. Returns glenoid positions { L, R } and the frame.
 */
export function shoulder(ctx, Sh) {
  const f = ctx.spine.frameAt(Sh.at), mb = ctx.bone;
  const out = { f };
  const c = ctx.jit(0.05);
  const Sc = Sh.scap;
  for (const s of [1, -1]) {
    const G = f.at(Sh.fwd || 0, -Sh.drop, s * Sh.w);
    out[s > 0 ? 'L' : 'R'] = G;
    if (Sc) {
      const an = rad(Sc.ang), ca = Math.cos(an), sa = Math.sin(an);
      const frontal = !!Sc.frontal;
      const a = frontal ? f.dir(-ca, 0, -s * sa) : f.dir(-ca, sa, 0), b = frontal ? f.dir(sa, 0, -s * ca) : f.dir(sa, ca, 0);
      const nv = frontal ? f.u : f.s, sg = frontal ? 1 : s;
      const th = Sc.th || Sc.wid * 0.12, zTop = Sc.zTop ?? 0.6;
      const outl = SCAPS[Sc.shape || 'strap'];
      const bulge = Sc.bulge ?? 0.12;
      mb.poly(outl, null, (u, v, layer) => {
        const z = frontal ? th * 0.5 - layer * th + (Sc.lift || 0) : s * (lerp(0, Sh.w * (zTop - 1), clamp(u, 0, 1)) + Sh.w * bulge * Math.sin(Math.PI * clamp(u, 0, 1)) + th * 0.5 - layer * th);
        return [G[0] + a[0] * u * Sc.len + b[0] * v * Sc.wid + nv[0] * z, G[1] + a[1] * u * Sc.len + b[1] * v * Sc.wid + nv[1] * z, G[2] + a[2] * u * Sc.len + b[2] * v * Sc.wid + nv[2] * z];
      }, { flip: s > 0, color: c });
      if (Sc.shape === 'fan' && !frontal) {
        const q = (u, dz) => { const z = s * (lerp(0, Sh.w * (zTop - 1), u) + Sh.w * bulge * Math.sin(Math.PI * u) + dz); return [G[0] + a[0] * u * Sc.len + f.s[0] * z, G[1] + a[1] * u * Sc.len + f.s[1] * z, G[2] + a[2] * u * Sc.len + f.s[2] * z]; };
        mb.tube([q(0.02, th * 2.2), q(0.5, th * 1.6), q(0.95, th * 0.6)], th * 0.7, th * 1.2, { radial: 4, color: c, up: f.s });
      }
    }
    if (Sh.cor) {
      const cr = Sh.cor;
      mb.ellipsoid(f.at((Sh.fwd || 0) + cr * 0.75, -Sh.drop - cr * 0.45, s * Sh.w * 0.72), [cr, cr * 0.85, cr * 0.2], { axes: [f.t, f.u, vnorm(f.dir(0.5, -0.3, s))], color: c, seg: 8, rings: 4 });
    }
    if (Sh.clav) {
      const e = f.at((Sh.fwd || 0) + Sh.clav[0], -Sh.drop + Sh.clav[1], s * Sh.w * 0.08), mid = vlerp(G, e, 0.5);
      mb.tube([G, [mid[0] + f.u[0] * Sh.w * -0.08, mid[1] + f.u[1] * Sh.w * -0.08, mid[2] + f.u[2] * Sh.w * -0.08], e], Sh.clavR || Sh.w * 0.05, null, { radial: 5, color: c });
    }
  }
  if (Sh.sternum) {
    const St = Sh.sternum;
    mb.ellipsoid(f.at((Sh.fwd || 0) + (St.fwd || 0), -Sh.drop - (St.drop || 0), 0), [St.len, St.th || St.w * 0.2, St.w], { axes: [f.dir(Math.cos(rad(St.ang || 0)), Math.sin(rad(St.ang || 0)), 0), f.dir(-Math.sin(rad(St.ang || 0)), Math.cos(rad(St.ang || 0)), 0), f.s], color: c, seg: 8, rings: 4 });
  }
  return out;
}

// ---------------------------------------------------------------------------
// limbs
// ---------------------------------------------------------------------------
/**
 * Three-segment limb solved by IK.
 * Lm: { root, lens: [l1,l2,l3], rad: [r1,r2,r3], target (distal end of the metapodials = toe bases),
 *       a3 (deg: metapodial lean, 0 = vertical, + = ankle behind the toes) or seg3 (vector toe-base -> ankle),
 *       pole (bend direction of knee/elbow), lower2 ('fib' | 'equal' | false), metas (count), side,
 *       digits: { n, len, spread, r, claw, ph, list }, ground (default true), toeDir, curlDir, knob }
 */
export function limb(ctx, Lm) {
  const mb = ctx.bone;
  let [l1, l2, l3] = Lm.lens;
  const [r1, r2, r3] = Lm.rad;
  const side = Lm.side || 1;
  const root = Lm.root, target = Lm.target;
  const a3 = rad(Lm.a3 ?? 0);
  const d3 = Lm.seg3 ? vnorm(Lm.seg3) : [-Math.sin(a3), Math.cos(a3), 0];
  const ankle = vadd(target, d3, l3);
  let D = vsub(ankle, root), dist = vlen(D);
  const reach = l1 + l2;
  if (dist > reach * 0.998) {
    const k = dist / (reach * 0.998);
    ctx.warn(`${Lm.name || 'limb'} over-reach x${k.toFixed(3)} (dist ${dist.toFixed(2)}, reach ${reach.toFixed(2)})`);
    l1 *= k; l2 *= k;
  } else if (dist < Math.abs(l1 - l2) * 1.02 + 1e-4) {
    ctx.warn(`${Lm.name || 'limb'} too folded`);
    dist = Math.abs(l1 - l2) * 1.02 + 1e-4;
  }
  const dh = vnorm(D);
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let pole = Lm.pole || [1, 0, 0];
  pole = vadd(pole, dh, -vdot(pole, dh));
  if (vlen(pole) < 1e-4) pole = [0, 0, 1];
  pole = vnorm(pole);
  const knee = vadd(vadd(root, dh, a), pole, h);
  const lat = [0, 0, side];
  const c = ctx.jit(0.06);
  const knob = Lm.knob ?? 1.55;
  // segment 1
  mb.bone(root, knee, r1, r1 * 0.95, { color: c, knob, radial: Lm.radial || (ctx.detail > 1 ? 9 : 7), bow: Lm.bow1 ? vscale(pole, Lm.bow1) : null });
  // segment 2 (+ second bone)
  const c2 = ctx.jit(0.06);
  if (Lm.lower2 === 'equal') {
    const o1 = vscale(lat, r2 * 0.75), o2 = vscale(lat, -r2 * 0.75);
    mb.bone(vadd(knee, o1), vadd(ankle, o1), r2 * 0.72, r2 * 0.66, { color: c2, knob: 1.4, radial: 6 });
    mb.bone(vadd(vadd(knee, o2), pole, -r2 * 0.8), vadd(ankle, o2), r2 * 0.66, r2 * 0.6, { color: c2, knob: 1.4, radial: 6 });
  } else {
    mb.bone(knee, ankle, r2, r2 * 0.85, { color: c2, knob, radial: Lm.radial || (ctx.detail > 1 ? 9 : 7) });
    if (Lm.lower2 !== false) mb.bone(vadd(knee, lat, r2 * 1.45), vadd(ankle, lat, r2 * 1.15), r2 * 0.34, r2 * 0.28, { color: c2, knob: 1.3, radial: 5 });
  }
  // metapodials
  const ground = Lm.ground !== false;
  const toeDir = vnorm(Lm.toeDir || (ground ? [1, 0, 0] : vscale(d3, -1)));
  let fl = vcross(d3, toeDir);
  if (vlen(fl) < 0.05) fl = lat;
  fl = vnorm(fl);
  if (vdot(fl, lat) < 0) fl = vscale(fl, -1); // fl points to the lateral (outer) side
  const Dg = Lm.digits || { n: 0 };
  const nm = Lm.metas ?? (Dg.list ? Dg.list.length : Dg.n) ?? 1;
  const c3 = ctx.jit(0.06);
  const sp = Lm.metaGap ?? 2.0;
  const bases = [];
  for (let k = 0; k < nm; k++) {
    const off = (k - (nm - 1) / 2) * r3 * sp;
    const b = vadd(target, fl, off);
    bases.push(b);
    mb.bone(vadd(ankle, fl, off * (Lm.metaTop ?? 0.75)), b, r3, r3 * 0.95, { color: c3, knob: 1.35, radial: 5 });
  }
  if (Lm.tarsus !== false) mb.ellipsoid(ankle, [r3 * nm * 0.6 + r2 * 0.25, r2 * 0.5, r2 * 0.75], { axes: [fl, d3, vnorm(vcross(fl, d3))], color: c2, seg: 6, rings: 4 });
  // digits
  let curl = Lm.curlDir || [0, -1, 0];
  curl = vadd(curl, toeDir, -vdot(curl, toeDir));
  if (vlen(curl) < 0.05) curl = [-1, 0, 0];
  curl = vnorm(curl);
  const list = Dg.list || Array.from({ length: Dg.n || 0 }, (_, k) => ({
    len: Array.isArray(Dg.len) ? Dg.len[k] : Dg.len,
    ang: Dg.n > 1 ? (Dg.spread || 0) * (k / (Dg.n - 1) - 0.5) : 0,
  }));
  list.forEach((d, k) => {
    const b = bases.length ? bases[Math.min(bases.length - 1, d.meta ?? k)] : target;
    const base = d.off ? vadd(b, fl, d.off) : b;
    const an = rad(d.ang || 0), li = rad(d.lift || 0);
    let dir = vadd(vscale(toeDir, Math.cos(an)), fl, Math.sin(an));
    dir = vnorm(vadd(vscale(dir, Math.cos(li)), curl, -Math.sin(li)));
    const ph = d.ph || Dg.ph || 3, rd = d.r || Dg.r || r3 * 0.9, len = d.len, cw = d.claw ?? Dg.claw ?? 0;
    const cc = ctx.jit(0.06);
    const arch = d.arch ?? Dg.arch ?? 0;
    let p = base;
    const seg = [];
    for (let j = 1; j <= ph; j++) {
      const t = j / ph;
      const q = vadd(vadd(base, dir, len * t), curl, -arch * len * Math.sin(Math.PI * t) + (d.droop || 0) * len * t * t);
      seg.push([p, q]);
      p = q;
    }
    seg.forEach(([p0, p1], j) => mb.bone(p0, p1, rd * (1 - 0.12 * j), rd * (0.92 - 0.12 * j), { color: cc, knob: 1.35, radial: 5 }));
    if (cw > 0) {
      const ck = d.curl ?? Dg.curl ?? 0.55;
      const tdir = seg.length ? vnorm(vsub(seg[seg.length - 1][1], seg[seg.length - 1][0])) : dir;
      const m1 = vadd(vadd(p, tdir, cw * 0.5), curl, cw * ck * 0.22), m2 = vadd(vadd(p, tdir, cw), curl, cw * ck);
      if (ground && Lm.clampClaws !== false) { m1[1] = Math.max(m1[1], rd * 0.3); m2[1] = Math.max(m2[1], 0); }
      const cr = rd * (d.clawR ?? Dg.clawR ?? 0.95);
      mb.tube([p, m1, m2], [cr * 0.6, cr * 0.45, 0.001], [cr, cr * 0.7, 0.001], { radial: 5, color: cc, up: curl });
    }
  });
  return { root, knee, ankle, target, d3 };
}

// ---------------------------------------------------------------------------
// mount armature
// ---------------------------------------------------------------------------
/** M: { posts: [{ at, r, x, z, top:[x,y,z] }], rails: [{ from, to, r, off }], rods: [[a, b, r]] } */
export function drawMount(ctx, M, floorY) {
  const mb = ctx.metal, sp = ctx.spine, c = ctx.steel;
  for (const p of M.posts || []) {
    let top;
    if (p.top) top = p.top;
    else {
      const s = sp.sAt(p.at), f = sp.frame(s), r = ctx.radiusAt(s);
      top = f.at(0, -r * 0.6, 0);
    }
    const r = p.r || 0.04;
    const bx = p.x ?? top[0], bz = p.z ?? top[2];
    mb.tube([[bx, floorY, bz], top], r, null, { radial: 8, color: c, cap: 'end' });
    if (p.base !== false) mb.tube([[bx, floorY, bz], [bx, floorY + 0.03, bz]], r * 3.2, null, { radial: 10, color: c, bulge: 0.01, cap: 'end' });
  }
  for (const rl of M.rails || []) {
    const s0 = sp.sAt(rl.from), s1 = sp.sAt(rl.to), n = Math.max(2, Math.ceil(Math.abs(s1 - s0) / (rl.step || 0.35)));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const s = lerp(s0, s1, i / n), f = sp.frame(s);
      pts.push(f.at(0, -(ctx.radiusAt(s) * (rl.k ?? 1.0) + (rl.off ?? 0.02)), 0));
    }
    mb.tube(pts, rl.r || 0.025, null, { radial: 6, color: c });
  }
  for (const rd of M.rods || []) {
    const a = rd[0].slice(), b = rd[1].slice();
    if (a[1] === 'floor') a[1] = floorY;
    if (b[1] === 'floor') b[1] = floorY;
    mb.tube([a, b], rd[2] || 0.03, null, { radial: 8, color: c });
  }
}

// ---------------------------------------------------------------------------
// whole-animal assembly from a spec
// ---------------------------------------------------------------------------
/**
 * spec: { tone, colors, seed, spine, hip (ctrl index), neckAt (ctrl index), sacrum: { n, len, r, ns, ... },
 *   tail, dorsal, neck (column profiles + n), ribs, pelvis, shoulder, legs: [limb specs], arms: [limb specs],
 *   skull: { build(ctx) -> { bone, ds, origin }, len, pitch (absolute deg) | tilt (relative deg), yaw, roll },
 *   mount, extra(ctx, parts) }
 */
export function assemble(spec, opts = {}) {
  const ctx = new Ctx(spec, opts);
  const sp = ctx.spine = new Spine(spec.spine, spec.hip);
  const sHip = sp.sAt(spec.hip), sacLen = spec.sacrum ? spec.sacrum.len : 0;
  const sNeck = spec.neckAt != null ? sp.sAt(spec.neckAt) : sp.total;
  ctx.hipFrame = sp.frame(sHip);
  const parts = { ctx, spine: sp };
  if (spec.tail) parts.tail = column(ctx, 0, sHip - sacLen / 2, spec.tail.n, spec.tail);
  if (spec.sacrum) parts.sacrum = column(ctx, sHip - sacLen / 2, sHip + sacLen / 2, spec.sacrum.n, { fused: true, ...spec.sacrum });
  if (spec.dorsal) parts.dorsal = column(ctx, sHip + sacLen / 2, sNeck, spec.dorsal.n, spec.dorsal);
  if (spec.neck) parts.neck = column(ctx, sNeck, sp.total, spec.neck.n, spec.neck);
  if (spec.ribs && parts.dorsal) parts.ribTips = ribcage(ctx, parts.dorsal, spec.ribs);
  if (spec.pelvis) parts.hips = pelvis(ctx, spec.pelvis);
  if (spec.shoulder) parts.shoulders = shoulder(ctx, spec.shoulder);
  parts.legs = [];
  for (const L of spec.legs || []) {
    const side = L.side || 1;
    const root = L.root || (parts.hips ? parts.hips[side > 0 ? 'L' : 'R'] : null);
    parts.legs.push(limb(ctx, { name: 'leg' + (side > 0 ? 'L' : 'R'), ...L, root: L.rootOff ? vadd(root, L.rootOff) : root }));
  }
  parts.arms = [];
  for (const L of spec.arms || []) {
    const side = L.side || 1;
    const root = L.root || (parts.shoulders ? parts.shoulders[side > 0 ? 'L' : 'R'] : null);
    parts.arms.push(limb(ctx, { name: 'arm' + (side > 0 ? 'L' : 'R'), ...L, root: L.rootOff ? vadd(root, L.rootOff) : root }));
  }
  if (spec.skull) {
    const K = spec.skull;
    const end = sp.frame(sp.total);
    const sk = K.build(ctx);
    const tp = Math.atan2(end.t[1], Math.hypot(end.t[0], end.t[2]));
    const pitch = K.pitch != null ? rad(K.pitch) : tp + rad(K.tilt || 0);
    const yaw = Math.atan2(-end.t[2], end.t[0]) + rad(K.yaw || 0);
    const o = sk.origin || [0, 0];
    const m = new THREE.Matrix4().makeTranslation(end.p[0], end.p[1], end.p[2])
      .multiply(new THREE.Matrix4().makeRotationY(yaw))
      .multiply(new THREE.Matrix4().makeRotationZ(pitch))
      .multiply(new THREE.Matrix4().makeRotationX(rad(K.roll || 0)))
      .multiply(new THREE.Matrix4().makeScale(K.len, K.len, K.len))
      .multiply(new THREE.Matrix4().makeTranslation(-o[0], -o[1], 0));
    ctx.bone.merge(sk.bone, m);
    if (sk.ds) ctx.ds.merge(sk.ds, m);
    parts.skullMatrix = m;
  }
  if (spec.extra) spec.extra(ctx, parts);
  if (spec.mount) ctx.pendingMount = typeof spec.mount === 'function' ? spec.mount(ctx, parts) : spec.mount;
  if (ctx.debug) {
    const b = ctx.bone;
    let x0 = Infinity, x1 = -Infinity;
    for (let i = 0; i < b.pos.length; i += 3) { if (b.pos[i] < x0) x0 = b.pos[i]; if (b.pos[i] > x1) x1 = b.pos[i]; }
    console.error(`[skeleton] spine ${sp.total.toFixed(2)} m, x ${x0.toFixed(2)}..${x1.toFixed(2)}, maxY ${(Math.max(b.maxY(), ctx.ds.count ? ctx.ds.maxY() : -1e9) - ctx.minY()).toFixed(2)}`);
  }
  return ctx.finish();
}

/** Mirror helper for limb specs: returns [left, right] from a base spec and per-side overrides. */
export function pair(base, L = {}, R = {}) {
  const mk = (side, o) => {
    const m = { ...base, ...o, side };
    if (m.target) m.target = [m.target[0], m.target[1], Math.abs(m.target[2]) * side * (m.cross ? -1 : 1)];
    if (m.pole) m.pole = [m.pole[0], m.pole[1], (m.pole[2] || 0) * side];
    if (m.toeDir) m.toeDir = [m.toeDir[0], m.toeDir[1], (m.toeDir[2] || 0) * side];
    if (m.seg3) m.seg3 = [m.seg3[0], m.seg3[1], (m.seg3[2] || 0) * side];
    if (m.curlDir) m.curlDir = [m.curlDir[0], m.curlDir[1], (m.curlDir[2] || 0) * side];
    return m;
  };
  return [mk(1, L), mk(-1, R)];
}
