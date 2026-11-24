// Pterosaur, armoured fish, shark jaw.
import * as THREE from 'three';
import { assemble, pair, Ctx, rad, lerp, vlerp } from './engine.js';
import { MB } from './mesh.js';
import * as SK from './skulls.js';

// ---------------------------------------------------------------------------
// Pteranodon — wings spread, meant to hang from the ceiling (opts.wires = wire length in metres, default none)
// ---------------------------------------------------------------------------
export function pteranodon(opts = {}) {
  const wires = +opts.wires || 0;
  return assemble({
    tone: 'cast', seed: 1175, colors: { cast: 0x9a8b76 },
    spine: [[-0.26, 0.27], [-0.12, 0.3], [0, 0.31], [0.2, 0.33], [0.42, 0.35], [0.62, 0.42], [0.84, 0.5], [1.0, 0.53]],
    hip: 2, neckAt: 4,
    tail: { n: 8, r: [0.004, 0.01], ns: 0, tp: 0 },
    sacrum: { n: 5, len: 0.12, r: 0.016, ns: 0.03, tp: 0.03 },
    dorsal: { n: 10, r: [0.016, 0.018, 0.018], ns: [0.035, 0.04, 0.045], tp: [0.035, 0.045, 0.05], nsLean: 0.1 },
    neck: { n: 7, r: [0.024, 0.024, 0.02], ns: [0.03, 0.015, 0.01], tp: [0.03, 0.025, 0.02], nsLean: 0, waist: 0.75 },
    ribs: { w: [0.05, 0.09, 0.11, 0.115, 0.1, 0.07], d: [0.06, 0.14, 0.19, 0.2, 0.18, 0.1], r: 0.005, arc: 160, sweep: 0.25 },
    pelvis: { type: 'mammal', w: 0.05, drop: 0.03, r: 0.008, il: [0.1, 0.03, 0.035], is: [-0.06, -0.02, 0.03], pb: [0.01, -0.06], face: 'side', wing: 2.5 },
    shoulder: { at: 3.8, drop: 0.03, w: 0.1, scap: { len: 0.13, ang: 20, wid: 0.04, zTop: 0.5 }, cor: 0.03, sternum: { fwd: 0.0, drop: 0.2, len: 0.1, w: 0.07, th: 0.012, ang: -10 } },
    legs: pair({ lens: [0.25, 0.33, 0.12], rad: [0.011, 0.008, 0.003], ground: false, pole: [0.2, -0.4, 1], tarsus: false, lower2: false,
      digits: { n: 4, len: 0.08, spread: 30, r: 0.003, claw: 0.02, ph: 3 }, metaGap: 2.4, seg3: [1, 0.15, 0], toeDir: [-1, -0.1, 0.1] }, { target: [-0.58, 0.2, 0.3] }, { target: [-0.58, 0.2, 0.3] }),
    skull: { build: (ctx) => SK.pteranodonSkull(ctx, { gape: 6 }), len: 0.74, pitch: -18 },
    extra(ctx, parts) {
      const mb = ctx.bone;
      for (const s of [1, -1]) {
        const c = ctx.jit(0.06);
        const P = (x, y, z) => [x, y, z * s];
        const sh = P(0.38, 0.335, 0.1), el = P(0.44, 0.39, 0.4), wr = P(0.66, 0.41, 0.95), kn = P(0.52, 0.39, 1.62);
        mb.bone(sh, el, 0.034, 0.028, { color: c, knob: 1.5 });
        mb.bone(el, wr, 0.022, 0.02, { color: c, knob: 1.4 });
        mb.bone(vlerp(el, P(0.4, 0.39, 0.42), 1), P(0.63, 0.41, 0.96), 0.011, 0.01, { color: c, knob: 1.3 });
        mb.bone(wr, kn, 0.024, 0.02, { color: c, knob: 1.5 });
        // pteroid (towards the neck) and three small clawed fingers
        mb.tube([wr, P(0.8, 0.42, 0.78)], [0.007, 0.002], null, { radial: 4, color: c });
        for (let i = 0; i < 3; i++) {
          const a = P(0.56 + i * 0.012, 0.39, 1.62), b = P(0.66 + i * 0.03, 0.385, 1.68 + i * 0.03);
          mb.tube([a, b, P(b[0] + 0.035, 0.365, Math.abs(b[2]) + 0.01)], [0.005, 0.004, 0.0008], null, { radial: 4, color: c });
        }
        // wing finger: four long phalanges sweeping back to the tip
        const ph = [kn, P(0.28, 0.36, 2.3), P(0.0, 0.33, 2.82), P(-0.24, 0.3, 3.12), P(-0.44, 0.28, 3.3)];
        for (let i = 0; i < 4; i++) mb.bone(ph[i], ph[i + 1], 0.02 - i * 0.004, 0.017 - i * 0.004, { color: c, knob: 1.35, radial: 5 });
        if (wires) {
          ctx.metal.tube([P(0.5, 0.4, 1.3), P(0.5, 0.4 + wires, 1.3)], 0.003, null, { radial: 4, color: ctx.steel });
        }
      }
      if (wires) for (const x of [0.36, -0.02]) ctx.metal.tube([[x, 0.36, 0], [x, 0.36 + wires, 0]], 0.003, null, { radial: 4, color: ctx.steel });
    },
  }, opts);
}

// ---------------------------------------------------------------------------
// Dunkleosteus — armoured head and trunk shield on a post
// ---------------------------------------------------------------------------
export function dunkleosteus(opts = {}) {
  const ctx = new Ctx({ tone: 'fossil', seed: 5555, floor: 0, colors: { fossil: 0x3f342b, cast: 0x9a8f7d } }, opts);
  const head = SK.shellSkull(ctx, {
    out: [[1.0, 0.0], [1.01, 0.24], [0.94, 0.45], [0.72, 0.63], [0.42, 0.73], [0.16, 0.73], [0.1, 0.5], [0.14, 0.3], [0.2, 0.1], [0.34, -0.02], [0.6, -0.05], [0.8, -0.01], [0.9, 0.02]],
    holes: [ell8(0.73, 0.36, 0.09)],
    w: [[0.1, 0.44], [0.4, 0.46], [0.7, 0.38], [0.9, 0.27], [1.0, 0.17]], kTop: [[0.1, 0.55], [0.6, 0.55], [1, 0.8]], kPow: 2,
    th: 0.035, roof: [12, 5], arch: 0.3,
    condyle: [0, 0],
    teeth: [{ line: [[0.9, 0.02], [0.99, 0.01]], n: 1, len: 0.2, back: 0.15, rk: 0.16, flat: 2.2, inset: 0.03, jit: 0 },
      { line: [[0.62, -0.05], [0.84, 0.0]], n: 1, len: 0.085, back: 0, rk: 0.9, flat: 1.6, inset: 0.03, jit: 0, blunt: 0.4 }],
    jaw: {
      joint: [0.22, 0.04], wBack: 0.38,
      out: [[-0.05, 0.0], [0.0, 0.04], [0.3, 0.05], [0.56, 0.07], [0.67, 0.22], [0.72, 0.06], [0.7, -0.07], [0.42, -0.11], [0.1, -0.09]],
      wFront: 0.07, pw: 1.2, th: 0.045, sym: false,
    },
    gape: 24,
    extra(bone, ds, h) {
      // sclerotic rings in the orbits
      for (const s of [1, -1]) {
        const pts = [];
        for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2; const x = 0.73 + Math.cos(a) * 0.062, y = 0.36 + Math.sin(a) * 0.062; pts.push([x, y, s * (h.W(x, y) - 0.02)]); }
        bone.tube(pts, 0.016, null, { radial: 4, color: h.ctx.jit(0.05, 1.25), cap: 'none' });
      }
    },
  });
  const trunk = SK.shellSkull(ctx, {
    out: [[0.08, 0.78], [-0.3, 0.83], [-0.56, 0.72], [-0.62, 0.4], [-0.52, 0.05], [-0.32, -0.2], [0.0, -0.26], [0.26, -0.2], [0.1, 0.0], [0.04, 0.3], [0.03, 0.55]],
    holes: [ell8(-0.2, 0.12, 0.13)],
    w: [[-0.62, 0.36], [-0.3, 0.5], [0.08, 0.47], [0.26, 0.3]], kTop: [[-0.62, 0.5], [0.1, 0.5]], kPow: 2, th: 0.035,
    roof: [[0, 3], [4, 7]], arch: 0.3, condyle: [0, 0], shade: 0.92,
  });
  const U = 1.22, y0 = 1.02;
  const m = new THREE.Matrix4().makeTranslation(-0.3, y0, 0).multiply(new THREE.Matrix4().makeScale(U, U, U));
  for (const part of [head, trunk]) { ctx.bone.merge(part.bone, m); ctx.ds.merge(part.ds, m); }
  const mb = ctx.metal, c = ctx.steel;
  mb.tube([[0, 0, 0], [0, 0.03, 0]], 0.26, null, { radial: 12, color: c, bulge: 0.01, cap: 'end' });
  mb.tube([[0, 0, 0], [0, y0 - 0.26 * U + 0.04, 0]], 0.03, null, { radial: 8, color: c, cap: 'end' });
  mb.tube([[-0.75, y0 - 0.1, 0], [-0.3, y0 - 0.3, 0], [0.0, y0 - 0.29, 0], [0.5, y0 - 0.08, 0]], 0.016, null, { radial: 6, color: c });
  return ctx.finish();
}
function ell8(cx, cy, r) { const o = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; }

// ---------------------------------------------------------------------------
// Carcharocles megalodon — reconstructed jaws, upright and open, on a low base
// ---------------------------------------------------------------------------
export function megalodon_jaw(opts = {}) {
  const ctx = new Ctx({ tone: 'cast', seed: 1909, floor: 0, colors: { cast: 0xb9b0a0, fossil: 0x5a4c40 } }, opts);
  const mb = ctx.bone;
  const R = 1.3, yc = 1.42, Hu = 1.22, Hl = 1.02, base = 0.16;
  const arch = (u, upper) => {
    const sn = Math.sin(u);
    return [(upper ? 0.5 : 0.42) * Math.pow(sn, 0.8) - 0.1, yc + base + (upper ? Hu : -Hl) * Math.pow(sn, 0.85), -R * Math.cos(u)];
  };
  const tooth = ctx.tone === 'fossil' ? [0.12, 0.11, 0.1] : [0.2, 0.2, 0.2];
  const root = [ctx.base[0] * 0.75, ctx.base[1] * 0.72, ctx.base[2] * 0.66];
  for (const upper of [true, false]) {
    const pts = [], n = 28;
    for (let i = 0; i <= n; i++) pts.push(arch((i / n) * Math.PI, upper));
    const cc = ctx.jit(0.04);
    mb.tube(pts, pts.map((_, i) => 0.085 + 0.05 * Math.sin((i / n) * Math.PI)), pts.map((_, i) => 0.14 + 0.08 * Math.sin((i / n) * Math.PI)), { radial: 8, color: cc, up: [1, 0, 0] });
    // teeth: 3 rows, the front row erect, replacement rows lying back
    const nt = upper ? 24 : 22;
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < nt; i++) {
        const u = lerp(0.2, Math.PI - 0.2, (i + 0.5) / nt);
        const p = arch(u, upper), q = arch(u + 0.02, upper);
        const tan = [q[0] - p[0], q[1] - p[1], q[2] - p[2]]; const tl = Math.hypot(...tan); tan[0] /= tl; tan[1] /= tl; tan[2] /= tl;
        // inward: towards the centre of the gape, in the plane of the arch
        let inw = [0.0 - p[0] * 0, yc + base - p[1], -p[2]]; const d = inw[0] * tan[0] + inw[1] * tan[1] + inw[2] * tan[2];
        inw = [inw[0] - tan[0] * d, inw[1] - tan[1] * d, inw[2] - tan[2] * d]; const il = Math.hypot(...inw); inw = inw.map((v) => v / il);
        const mid = Math.sin(u);
        const h = (upper ? 0.24 : 0.2) * (0.45 + 0.55 * mid) * (1 - row * 0.12), w = h * 0.45;
        const rb = 0.1 + 0.06 * mid;
        const bx = -0.05 - row * 0.07, lean = row * 0.45;
        const b = [p[0] + inw[0] * rb + bx, p[1] + inw[1] * rb, p[2] + inw[2] * rb];
        const tip = [b[0] + inw[0] * h * Math.cos(lean) - h * Math.sin(lean), b[1] + inw[1] * h * Math.cos(lean), b[2] + inw[2] * h * Math.cos(lean)];
        const m1 = vlerp(b, tip, 0.3);
        mb.tube([vlerp(b, tip, -0.25), b], [0.02, 0.02], [w * 0.9, w * 1.05], { radial: 4, color: root, up: tan, cap: 'none' });
        mb.tube([b, m1, tip], [0.018, 0.014, 0.001], [w, w * 0.72, 0.002], { radial: 4, color: tooth, up: tan, cap: 'none' });
      }
    }
  }
  // base and uprights
  const mt = ctx.metal, c = ctx.steel;
  mt.tube([[0.1, base / 2, -1.25], [0.1, base / 2, 1.25]], 0.5, base * 0.7, { radial: 4, phase: Math.PI / 4, color: c, bulge: 0.001 });
  for (let i = 1; i < mt.pos.length; i += 3) if (mt.pos[i] < 0) mt.pos[i] = 0;
  for (const s of [1, -1]) {
    mt.tube([[0.05, base, s * 0.75], arch(Math.PI / 2 + s * 0.62, false)], 0.022, null, { radial: 6, color: c });
    mt.tube([[-0.15, base, s * 1.1], [-0.12, yc + base, s * 1.3]], 0.022, null, { radial: 6, color: c });
  }
  return ctx.finish();
}
export const _unused = { MB, pair, rad };
