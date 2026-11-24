// Shared exhibit kit: a local-frame builder, wall cases, and small procedural objects
// (pottery, masks, crystals, birds, jars, shields, carved posts) used to furnish the halls.
import * as THREE from 'three';
import { xform, mulberry, shade, col } from '../engine/builder.js';
import { picture } from '../engine/placards.js';
import { ellipsoid, tube } from '../models/loft.js';
import { blob } from './furniture.js';
import { ELEVATORS, FLOOR_Y } from './plan.js';

/**
 * Local frame standing at (x, y, z) and facing compass `face`:
 * +X = the viewer's right, +Y up, +Z = out of the wall towards the viewer.
 */
export function local(ctx, x, y, z, face) {
  const th = face * Math.PI / 180;
  const M = xform(x, y, z, Math.PI - th);
  const tmp = new THREE.Matrix4();
  const L = {
    M, face,
    /** local point -> world [x, y, z] */
    w(lx, ly, lz) { const v = new THREE.Vector3(lx, ly, lz).applyMatrix4(M); return [v.x, v.y, v.z]; },
    box(mat, x0, y0, z0, x1, y1, z1, color) {
      const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
      g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      ctx.geo.add(mat, g, M, color);
      return L;
    },
    /** add geometry at local position with rotation about Y (deg) and scale */
    add(mat, g, lx = 0, ly = 0, lz = 0, rot = 0, s = 1, color) {
      tmp.copy(M).multiply(xform(lx, ly, lz, rot * Math.PI / 180, s));
      ctx.geo.add(mat, g, tmp.clone(), color);
      return L;
    },
    /** add a whole Geo (model library output) */
    geo(g, lx = 0, ly = 0, lz = 0, rot = 0, s = 1, rename) {
      ctx.geo.addGeo(g, tmp.copy(M).multiply(xform(lx, ly, lz, rot * Math.PI / 180, s)).clone(), rename);
      return L;
    },
    /** collider for a local box footprint */
    collide(x0, z0, x1, z1, h = 2.4) {
      const c = L.w((x0 + x1) / 2, 0, (z0 + z1) / 2);
      ctx.phys.obb(c[0], c[2], Math.abs(x1 - x0) / 2, Math.abs(z1 - z0) / 2, Math.PI - th, y, y + h);
      return L;
    },
    placard(o) {
      const p = L.w(o.lx ?? 0, 0, o.lz ?? 1);
      const t = o.lt ? L.w(o.lt[0], o.lt[1], o.lt[2]) : L.w(o.lx ?? 0, 1.4, 0.2);
      return ctx.placard({ ...o, x: p[0], y, z: p[2], face, target: t });
    },
    picture(o, paint) { const p = L.w(o.lx || 0, o.ly, o.lz || 0.03); return picture(ctx, { ...o, x: p[0], y: p[1], z: p[2], face }, paint); },
  };
  return L;
}

// ---------------------------------------------------------------------------
// small objects (local, base at y = 0 unless noted)
// ---------------------------------------------------------------------------
const PROFILES = {
  vase: [[0.001, 0], [0.5, 0], [0.7, 0.25], [0.78, 0.5], [0.62, 0.78], [0.34, 0.92], [0.3, 1.02], [0.42, 1.1]],
  jar: [[0.001, 0], [0.45, 0], [0.8, 0.3], [0.85, 0.6], [0.6, 0.88], [0.5, 0.95], [0.55, 1.0]],
  bowl: [[0.001, 0], [0.35, 0], [0.75, 0.2], [1.0, 0.5], [1.02, 0.56]],
  bottle: [[0.001, 0], [0.5, 0], [0.6, 0.2], [0.55, 0.5], [0.2, 0.7], [0.16, 1.0], [0.22, 1.05]],
  stirrup: [[0.001, 0], [0.6, 0], [0.8, 0.3], [0.7, 0.6], [0.3, 0.75], [0.12, 0.8], [0.1, 1.1]],
};
/** Lathe-turned vessel of height h. */
export function pot(kind = 'vase', h = 0.3) {
  const pr = PROFILES[kind] || PROFILES.vase;
  const g = new THREE.LatheGeometry(pr.map((p) => new THREE.Vector2(p[0] * h * 0.5, p[1] * h)), 14);
  return g;
}
/** Carved mask, about h tall, facing +Z, centred at y = h/2. */
export function mask(h = 0.4, seed = 1) {
  const r = mulberry(seed);
  const parts = [];
  const face = ellipsoid([0, h / 2, 0], [h * (0.3 + r() * 0.12), h / 2, h * 0.12], { seg: 12, rings: 8 });
  parts.push([face, 1]);
  for (const s of [-1, 1]) parts.push([ellipsoid([s * h * 0.13, h * 0.6, h * 0.1], [h * 0.07, h * 0.035, h * 0.03], { seg: 8, rings: 4 }), 0.12]);
  parts.push([ellipsoid([0, h * 0.42, h * 0.13], [h * 0.04, h * 0.14, h * 0.05], { seg: 6, rings: 4 }), 0.8]);
  parts.push([ellipsoid([0, h * 0.2, h * 0.1], [h * 0.12, h * 0.04, h * 0.03], { seg: 8, rings: 4 }), 0.25]);
  return parts;
}
/** Crystal cluster roughly r wide and h tall: array of [geometry, shadeFactor]. */
export function crystals(r = 0.3, h = 0.4, seed = 1, n = 9) {
  const rnd = mulberry(seed * 77 + 5);
  const out = [];
  for (let i = 0; i < n; i++) {
    const hh = h * (0.4 + rnd() * 0.6), rr = r * (0.1 + rnd() * 0.12);
    const g = new THREE.CylinderGeometry(rr * 0.25, rr, hh, 6, 1);
    g.translate(0, hh / 2, 0);
    const tip = new THREE.ConeGeometry(rr * 0.25, rr * 0.5, 6);
    tip.translate(0, hh + rr * 0.25, 0);
    const a = rnd() * 6.28, lean = rnd() * 0.6;
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.cos(a) * lean, rnd() * 3, Math.sin(a) * lean)).setPosition(Math.cos(a) * r * 0.35 * rnd(), 0, Math.sin(a) * r * 0.35 * rnd());
    g.applyMatrix4(m); tip.applyMatrix4(m);
    out.push([g, 0.75 + rnd() * 0.5], [tip, 0.9 + rnd() * 0.4]);
  }
  return out;
}
/** Simple perching bird, length L, head towards +X. Returns [[geometry, colourKey]] with keys body/head/wing/beak/leg. */
export function bird(L = 0.25, o = {}) {
  const b = [];
  const tall = o.legs || 0.25;
  const y = L * tall + L * 0.18;
  b.push([ellipsoid([0, y, 0], [L * 0.36, L * 0.2, L * 0.17], { seg: 10, rings: 7, rot: [0, 0, 0.25] }), 'body']);
  b.push([ellipsoid([L * 0.3, y + L * 0.2, 0], [L * 0.13, L * 0.12, L * 0.11], { seg: 8, rings: 6 }), 'head']);
  const beak = new THREE.ConeGeometry(L * 0.04, L * (o.beak || 0.16), 6);
  beak.rotateZ(-Math.PI / 2); beak.translate(L * 0.42 + L * (o.beak || 0.16) / 2, y + L * 0.19, 0);
  b.push([beak, 'beak']);
  for (const s of [-1, 1]) {
    b.push([ellipsoid([-L * 0.08, y + L * 0.03, s * L * 0.15], [L * 0.32, L * 0.13, L * 0.035], { seg: 8, rings: 5, rot: [0, 0, 0.3] }), 'wing']);
    b.push([tube([[0, y - L * 0.12, s * L * 0.07], [L * 0.02, 0, s * L * 0.07]], L * 0.014, { radial: 4, sub: 1 }), 'leg']);
  }
  b.push([ellipsoid([-L * 0.45, y - L * 0.04, 0], [L * 0.22, L * 0.03, L * 0.08], { seg: 6, rings: 4, rot: [0, 0, 0.35] }), 'wing']);
  return b;
}
export function putBird(L, lx, ly, lz, rot, size, c) {
  const cols = { body: c.body, head: c.head ?? c.body, wing: c.wing ?? shade(c.body, 0.7), beak: c.bk ?? 0xd9a020, leg: c.leg ?? 0x4a3a2a };
  for (const [g, k] of bird(size, c)) L.add(c.mat || 'flat', g, lx, ly, lz, rot, 1, cols[k]);
}
/** Specimen jar (glass cylinder with a pale specimen in fluid). */
export function putJar(L, lx, ly, lz, h = 0.3, tint = 0xd9c98a) {
  L.add('glass', new THREE.CylinderGeometry(h * 0.22, h * 0.22, h, 12).translate(0, h / 2, 0), lx, ly, lz, 0, 1, 0xe8f0e0);
  L.add('flat', new THREE.CylinderGeometry(h * 0.2, h * 0.2, h * 0.8, 10).translate(0, h * 0.4, 0), lx, ly, lz, 0, 1, tint);
  L.add('satin', new THREE.CylinderGeometry(h * 0.23, h * 0.23, h * 0.06, 12).translate(0, h * 1.02, 0), lx, ly, lz, 0, 1, 0x1a1a1a);
}

// ---------------------------------------------------------------------------
// wall case: a lit vitrine built against a wall
// ---------------------------------------------------------------------------
/**
 * o: { x, z (point on the wall), face, y, w (3.2), h (1.9), d (0.6), sill (0.85), frame, back (colour of the lit interior),
 *      fill: fn(L, w, h, d, deckY) placing objects (local coords, x across -w/2..w/2, z 0..d),
 *      label: { id, title, sub, text, star } }
 */
export function wallCase(ctx, o) {
  const w = o.w ?? 3.2, h = o.h ?? 1.9, d = o.d ?? 0.6, sill = o.sill ?? 0.85, y = o.y ?? ctx.room.y;
  const fr = o.frame ?? 0x2a241c, back = o.back ?? 0xd9d0bc;
  const L = local(ctx, o.x, y, o.z, o.face);
  L.box('satin', -w / 2 - 0.06, 0, 0, w / 2 + 0.06, sill, d + 0.04, fr);
  L.box('satin', -w / 2 - 0.06, sill + h, 0, w / 2 + 0.06, sill + h + 0.14, d + 0.04, fr);
  L.box('satin', -w / 2 - 0.06, sill, 0, -w / 2, sill + h, d + 0.04, fr);
  L.box('satin', w / 2, sill, 0, w / 2 + 0.06, sill + h, d + 0.04, fr);
  // lit interior: back and deck are self-lit so cases glow in dark halls
  const k = o.glow ?? 0.9, bc = col(back);
  L.box('glow', -w / 2, sill, 0, w / 2, sill + h, 0.02, [bc[0] * k, bc[1] * k, bc[2] * k]);
  L.box('glow', -w / 2, sill, 0.02, w / 2, sill + 0.02, d, [bc[0] * k * 0.8, bc[1] * k * 0.8, bc[2] * k * 0.8]);
  L.add('glass', new THREE.PlaneGeometry(w, h), 0, sill + h / 2, d + 0.02, 0, 1, 0xd8e8ee);
  L.collide(-w / 2 - 0.06, 0, w / 2 + 0.06, d + 0.06, sill + h + 0.2);
  if (o.light !== false) { const p = L.w(0, sill + h * 0.6, d + 1.4); ctx.lights.anchor(p[0], p[1], p[2], { color: o.lc ?? 0xffe8c8, intensity: o.li ?? 10, dist: 8 }); }
  if (o.fill) o.fill(L, w, h, d, sill + 0.02);
  if (o.label) L.placard({ ...o.label, lx: o.label.lx ?? 0, lz: d + 0.75, lt: [0, sill + h * 0.5, d / 2], kind: 'stand' });
  return L;
}

/** Doorway / elevator spans along one wall of the room (so furniture can keep clear of them). */
export function doorSpans(ctx, side) {
  const r = ctx.room, out = [];
  const near = (a, b) => Math.abs(a - b) < 0.05;
  for (const p of ctx.W.portals) {
    if (p.y < r.y - 0.1 || p.y > r.y + r.h - 1) continue;
    if (side === 'n' && p.axis === 'z' && near(p.z1, r.z0)) out.push([p.x0, p.x1]);
    else if (side === 's' && p.axis === 'z' && near(p.z0, r.z1)) out.push([p.x0, p.x1]);
    else if (side === 'w' && p.axis === 'x' && near(p.x1, r.x0)) out.push([p.z0, p.z1]);
    else if (side === 'e' && p.axis === 'x' && near(p.x0, r.x1)) out.push([p.z0, p.z1]);
  }
  for (const e of ELEVATORS) {
    if (!e.floors.some((f) => FLOOR_Y[f] === r.y)) continue;
    if (side === 'e' && Math.abs(e.x - r.x1) < 0.3 && e.z > r.z0 && e.z < r.z1) out.push([e.z - 1.6, e.z + 1.6]);
    if (side === 'w' && Math.abs(e.x - r.x0) < 0.3 && e.z > r.z0 && e.z < r.z1) out.push([e.z - 1.6, e.z + 1.6]);
    if (side === 'n' && Math.abs(e.z - r.z0) < 0.3 && e.x > r.x0 && e.x < r.x1) out.push([e.x - 1.6, e.x + 1.6]);
    if (side === 's' && Math.abs(e.z - r.z1) < 0.3 && e.x > r.x0 && e.x < r.x1) out.push([e.x - 1.6, e.x + 1.6]);
  }
  return out;
}

/** A row of n wall cases along a wall; slots that would block a doorway are skipped.
 *  side: 'n'|'s'|'e'|'w' of ctx.room; a..b extent; each(i, t) -> case options (or {skip:true}). */
export function caseRow(ctx, side, a, b, n, each) {
  const r = ctx.room;
  const doors = doorSpans(ctx, side);
  for (let i = 0; i < n; i++) {
    const t = a + (i + 0.5) * (b - a) / n;
    const o = each(i, t) || {};
    if (o.skip) continue;
    const w = o.w ?? ((b - a) / n - 1.0);
    if (doors.some((d) => t + w / 2 + 0.5 > d[0] && t - w / 2 - 0.5 < d[1])) continue;
    const base = side === 'n' ? { x: t, z: r.z0, face: 180 } : side === 's' ? { x: t, z: r.z1, face: 0 } : side === 'w' ? { x: r.x0, z: t, face: 90 } : { x: r.x1, z: t, face: 270 };
    wallCase(ctx, { ...base, ...o, w });
  }
}

/** Fill helper: scatter pots along a case deck. */
export function fillPots(colors, seed = 1, kinds = ['vase', 'jar', 'bowl', 'bottle', 'stirrup']) {
  return (L, w, h, d, deck) => {
    const r = mulberry(seed * 31 + 7);
    const n = Math.max(3, Math.floor(w / 0.45));
    for (let i = 0; i < n; i++) {
      const hh = 0.18 + r() * 0.3;
      const x = -w / 2 + (i + 0.5) * w / n;
      const step = r() < 0.4 ? 0.3 + r() * 0.3 : 0;
      if (step) L.box('flat', x - 0.14, deck, d * 0.3, x + 0.14, deck + step, d * 0.75, 0x8a8478);
      L.add('satin', pot(kinds[Math.floor(r() * kinds.length)], hh), x, deck + step, d * 0.52, r() * 360, 1, shade(colors[Math.floor(r() * colors.length)], 0.8 + r() * 0.4));
    }
  };
}
/** Fill helper: masks hung on the back of a case. */
export function fillMasks(colors, seed = 1) {
  return (L, w, h, d, deck) => {
    const r = mulberry(seed * 53 + 3);
    const n = Math.max(2, Math.floor(w / 0.7));
    for (let i = 0; i < n; i++) {
      const hh = 0.35 + r() * 0.3, x = -w / 2 + (i + 0.5) * w / n, yy = deck + h * (0.3 + r() * 0.3);
      const c = colors[Math.floor(r() * colors.length)];
      for (const [g, k] of mask(hh, seed * 10 + i)) L.add('satin', g, x, yy, 0.1, 0, 1, shade(c, k));
    }
  };
}
/** Fill helper: mineral specimens on little blocks. */
export function fillCrystals(colors, seed = 1) {
  return (L, w, h, d, deck) => {
    const r = mulberry(seed * 17 + 11);
    const n = Math.max(3, Math.floor(w / 0.55));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (i + 0.5) * w / n, step = 0.1 + r() * 0.5;
      L.box('flat', x - 0.16, deck, d * 0.25, x + 0.16, deck + step, d * 0.8, 0x18181c);
      const c = colors[Math.floor(r() * colors.length)];
      for (const [g, k] of crystals(0.22 + r() * 0.1, 0.2 + r() * 0.22, seed * 20 + i, 7)) L.add('gloss', g, x, deck + step, d * 0.52, 0, 1, shade(c, k));
    }
  };
}
/** Fill helper: rows of specimen jars / boxes / bones (open storage look). */
export function fillStorage(seed = 1, kind = 'mixed') {
  return (L, w, h, d, deck) => {
    const r = mulberry(seed * 13 + 1);
    const rows = Math.max(2, Math.floor(h / 0.55));
    for (let j = 0; j < rows; j++) {
      const yy = deck + j * (h / rows);
      if (j) L.box('satin', -w / 2, yy - 0.025, 0.02, w / 2, yy, d * 0.9, 0x3a3a3c);
      const n = Math.floor(w / 0.3);
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + (i + 0.5) * w / n, t = kind === 'mixed' ? r() : kind === 'jars' ? 0.1 : 0.9;
        if (t < 0.4) putJar(L, x, yy, d * 0.5, 0.18 + r() * 0.14, [0xd9c98a, 0xc9b070, 0xe0d6b0, 0xb8a888][Math.floor(r() * 4)]);
        else if (t < 0.7) L.box('flat', x - 0.11, yy, d * 0.25, x + 0.11, yy + 0.1 + r() * 0.16, d * 0.75, [0xb8a888, 0x8a7a66, 0xd0c4a8, 0x6a6258][Math.floor(r() * 4)]);
        else L.add('bone', ellipsoid([0, 0.07, 0], [0.11, 0.06 + r() * 0.05, 0.07], { seg: 7, rings: 5 }), x, yy, d * 0.5, r() * 360, 1, 0xd9cfb4);
      }
    }
  };
}

/** Free-standing carved, painted post (totem / house post / stela), built from stacked painted drums. */
export function carvedPost(ctx, x, y, z, face, h = 4, r = 0.36, seed = 1, palette = [0x7a2a1e, 0x16181a, 0x2f6a66, 0xd9cfb0]) {
  const L = local(ctx, x, y, z, face);
  const rnd = mulberry(seed * 91 + 3);
  let yy = 0;
  const wood = 0x8a6a4a;
  while (yy < h - 0.2) {
    const hh = Math.min(h - yy, 0.7 + rnd() * 0.6);
    L.add('wood', new THREE.CylinderGeometry(r * (0.92 + rnd() * 0.1), r, hh, 14).translate(0, hh / 2, 0), 0, yy, 0, 0, 1, shade(wood, 0.85 + rnd() * 0.3));
    // a face: brow, eyes, mouth, on the front
    const c1 = palette[Math.floor(rnd() * palette.length)], c2 = palette[Math.floor(rnd() * palette.length)];
    L.add('satin', ellipsoid([0, hh * 0.72, r * 0.86], [r * 0.8, hh * 0.09, r * 0.2], { seg: 8, rings: 4 }), 0, yy, 0, 0, 1, c1);
    for (const s of [-1, 1]) {
      L.add('satin', ellipsoid([s * r * 0.38, hh * 0.55, r * 0.9], [r * 0.26, hh * 0.1, r * 0.12], { seg: 8, rings: 4 }), 0, yy, 0, 0, 1, 0xd9cfb0);
      L.add('satin', ellipsoid([s * r * 0.38, hh * 0.55, r * 0.99], [r * 0.12, hh * 0.06, r * 0.06], { seg: 6, rings: 4 }), 0, yy, 0, 0, 1, 0x101010);
    }
    L.add('satin', ellipsoid([0, hh * 0.22, r * 0.88], [r * 0.6, hh * 0.09, r * 0.16], { seg: 8, rings: 4 }), 0, yy, 0, 0, 1, c2);
    L.add('satin', ellipsoid([0, hh * 0.4, r * 0.98], [r * 0.16, hh * 0.16, r * 0.16], { seg: 6, rings: 4 }), 0, yy, 0, 0, 1, shade(wood, 0.8));
    yy += hh;
  }
  ctx.phys.cyl(x, z, r + 0.05, y, y + h);
  blob(ctx.geo, x, y, z, r * 2.2, r * 2.2);
  return L;
}

/** Painted pattern panels (textiles, bark cloth, blankets, graphic walls). kind: 'stripes' | 'diamonds' | 'steps' | 'dots' */
export function pattern(kind, colors, seed = 1) {
  return (g, w, h) => {
    const r = mulberry(seed * 7 + 2);
    g.fillStyle = colors[0]; g.fillRect(0, 0, w, h);
    if (kind === 'stripes') {
      let x = 0;
      while (x < w) { const sw = 10 + r() * 60; g.fillStyle = colors[Math.floor(r() * colors.length)]; g.fillRect(x, 0, sw, h); x += sw; }
    } else if (kind === 'diamonds') {
      const s = w / 8;
      for (let j = -1; j < h / s + 1; j++) for (let i = -1; i < 9; i++) {
        g.fillStyle = colors[1 + ((i + j * 2 + 40) % (colors.length - 1))];
        g.beginPath(); const cx = i * s + (j % 2 ? s / 2 : 0), cy = j * s * 0.5;
        g.moveTo(cx, cy - s * 0.45); g.lineTo(cx + s * 0.45, cy); g.lineTo(cx, cy + s * 0.45); g.lineTo(cx - s * 0.45, cy); g.fill();
      }
    } else if (kind === 'steps') {
      const s = w / 16;
      for (let j = 0; j < h / s; j++) for (let i = 0; i < 16; i++) if (((i + j) % 4) < 2) { g.fillStyle = colors[1 + ((i >> 1) + (j >> 1)) % (colors.length - 1)]; g.fillRect(i * s, j * s, s, s); }
    } else {
      for (let i = 0; i < 260; i++) { g.fillStyle = colors[1 + Math.floor(r() * (colors.length - 1))]; g.beginPath(); g.arc(r() * w, r() * h, 4 + r() * 14, 0, 6.3); g.fill(); }
    }
    g.strokeStyle = colors[colors.length - 1]; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  };
}

/** Framed photograph-like landscape (procedural). theme: hue of sky/land */
export function landscape(seed = 1, pal = ['#7fa6d0', '#e8d8b8', '#6a7a4a', '#3a4a2a']) {
  return (g, w, h) => {
    const r = mulberry(seed * 23 + 9);
    const sky = g.createLinearGradient(0, 0, 0, h * 0.6); sky.addColorStop(0, pal[0]); sky.addColorStop(1, pal[1]);
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 3; k++) {
      g.fillStyle = k === 2 ? pal[3] : pal[2];
      g.globalAlpha = 0.55 + k * 0.2;
      g.beginPath(); g.moveTo(0, h);
      const base = h * (0.45 + k * 0.17);
      for (let x = 0; x <= w; x += w / 24) g.lineTo(x, base - Math.sin(x * 0.006 * (k + 1) + seed + k) * h * 0.08 - r() * h * 0.05);
      g.lineTo(w, h); g.fill();
    }
    g.globalAlpha = 1;
  };
}

/** Simple leafy plant / small tree (lit by room light). */
export function plant(ctx, x, y, z, h = 2, seed = 1, leaf = 0x3f7a34) {
  const { geo } = ctx;
  const r = mulberry(seed * 41 + 13);
  geo.add('flat', tube([[0, 0, 0], [(r() - 0.5) * 0.3, h * 0.5, (r() - 0.5) * 0.3], [(r() - 0.5) * 0.5, h * 0.85, (r() - 0.5) * 0.5]], [h * 0.03, h * 0.022, h * 0.012], { radial: 6, sub: 3 }), xform(x, y, z), 0x4a3a2a);
  const n = 7 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) {
    const a = r() * 6.28, rr = h * (0.1 + r() * 0.3), hy = h * (0.45 + r() * 0.5);
    geo.add('flat', ellipsoid([Math.cos(a) * rr, hy, Math.sin(a) * rr], [h * 0.2, h * 0.035, h * 0.09], { seg: 6, rings: 4, rot: [r() - 0.5, -a, (r() - 0.5) * 1.2] }), xform(x, y, z), shade(leaf, 0.7 + r() * 0.6));
  }
  blob(geo, x, y, z, h * 0.3, h * 0.3);
}
