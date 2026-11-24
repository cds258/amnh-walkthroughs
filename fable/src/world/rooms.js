// Generic architecture: rooms (floor, walls with openings, ceiling, outer shell),
// doorways, stairwells and elevator call points.
import * as THREE from 'three';
import { Geo, col, shade, mixCol } from '../engine/builder.js';
import { FLOOR_Y, F2F } from './plan.js';

export const STYLES = {
  classic: { floor: 'marble', floorCol: 0xd8cfc0, wall: 'plaster', wallCol: 0xe6decd, base: 0x6a5f52, ceil: 0xefe9dc, mood: 'bright', fix: 'panel', li: 42, lc: 0xfff0dc, trim: 0x8b7c66 },
  stonehall: { floor: 'marble', floorCol: 0xcdc3b2, wall: 'stone', wallCol: 0xdcd2c0, base: 0x7a6e5e, ceil: 0xe6dfd0, mood: 'bright', fix: 'panel', li: 42, lc: 0xfff0dc, trim: 0x9a8c76 },
  dioramahall: { floor: 'terrazzo', floorCol: 0x8a8174, wall: 'plaster', wallCol: 0x4a463c, base: 0x1e1c19, ceil: 0x2b2824, mood: 'dim', fix: 'none', li: 16, lc: 0xffd9a8, trim: 0x2a2520 },
  akeley: { floor: 'marble', floorCol: 0x5e584e, wall: 'darkmarble', wallCol: 0x4e544c, base: 0x151515, ceil: 0x3a362f, mood: 'dim', fix: 'none', li: 20, lc: 0xffd9a8, trim: 0x6b5a3a },
  darkhall: { floor: 'carpet', floorCol: 0x2a2a30, wall: 'plaster', wallCol: 0x1e1f25, base: 0x0c0c0e, ceil: 0x101013, mood: 'dark', fix: 'none', li: 10, lc: 0xcfe0ff, trim: 0x101012 },
  darkmodern: { floor: 'carpet', floorCol: 0x202028, wall: 'plaster', wallCol: 0x17171d, base: 0x0c0c0e, ceil: 0x0c0c10, mood: 'dark', fix: 'none', li: 10, lc: 0xb0c8ff, trim: 0x101012 },
  woodhall: { floor: 'wood', floorCol: 0xc0a47c, wall: 'plaster', wallCol: 0xd9ccb0, base: 0x5a4632, ceil: 0xe2d8c4, mood: 'warm', fix: 'panel', li: 34, lc: 0xffe2b8, trim: 0x6a5238 },
  modern: { floor: 'terrazzo', floorCol: 0xc9c6c0, wall: 'plaster', wallCol: 0xf0eee9, base: 0x9a968e, ceil: 0xf6f5f1, mood: 'bright', fix: 'panel', li: 44, lc: 0xfff6ea, trim: 0xbab5aa },
  meteor: { floor: 'pavers', floorCol: 0x5c5853, wall: 'plaster', wallCol: 0x3a3733, base: 0x141312, ceil: 0x1b1a18, mood: 'dim', fix: 'none', li: 16, lc: 0xffdcb0, trim: 0x1a1816 },
  gemhall: { floor: 'terrazzo', floorCol: 0x3c3c44, wall: 'plaster', wallCol: 0x25252c, base: 0x0c0c0e, ceil: 0x131317, mood: 'dark', fix: 'none', li: 10, lc: 0xdfe6ff, trim: 0x121214 },
  fossil: { floor: 'terrazzo', floorCol: 0x8f897c, wall: 'plaster', wallCol: 0xebe3d0, base: 0x7d7362, ceil: 0xefe8d8, mood: 'day', fix: 'panel', li: 24, lc: 0xfff4e2, trim: 0xb9ad94 },
  ocean: { floor: 'terrazzo', floorCol: 0x4a6a8c, wall: 'plaster', wallCol: 0x2c5f95, base: 0x123055, ceil: 0x0a2850, mood: 'ocean', fix: 'none', li: 0, trim: 0x1c3f66 },
  rotunda: { floor: 'marble', floorCol: 0xd6c9b2, wall: 'stone', wallCol: 0xdccfb6, base: 0x7b2f2a, ceil: 0xe8dfcc, mood: 'bright', fix: 'none', li: 0, trim: 0x8c6f48 },
  rose: { floor: 'terrazzo', floorCol: 0x8d9096, wall: 'plaster', wallCol: 0xe8e8ea, base: 0x777777, ceil: 0xffffff, mood: 'rose', fix: 'none', li: 0, trim: 0x888888 },
  earthhall: { floor: 'pavers', floorCol: 0x55514d, wall: 'plaster', wallCol: 0x302e2c, base: 0x121212, ceil: 0x161514, mood: 'dim', fix: 'none', li: 16, lc: 0xffe0b8, trim: 0x1a1816 },
  gilder: { floor: 'terrazzo', floorCol: 0xd6cfc2, wall: 'shotcrete', wallCol: 0xeadfce, base: 0xd8ccb8, ceil: 0xefe6d6, mood: 'cave', fix: 'panel', li: 40, lc: 0xfff0d8, trim: 0xd9ccb6 },
  vivarium: { floor: 'pavers', floorCol: 0x9a9585, wall: 'plaster', wallCol: 0xdfe8d6, base: 0x7c8a70, ceil: 0xf2f8ee, mood: 'green', fix: 'panel', li: 40, lc: 0xf4ffe8, trim: 0xa8b49a },
  library: { floor: 'wood', floorCol: 0xb79468, wall: 'plaster', wallCol: 0xe9dfcc, base: 0x6a5238, ceil: 0xf2ebdc, mood: 'cave', fix: 'panel', li: 40, lc: 0xffecd0, trim: 0x7a6040 },
  pacific: { floor: 'wood', floorCol: 0xb89a74, wall: 'plaster', wallCol: 0x9cc3c6, base: 0x4d6f72, ceil: 0xe6eeee, mood: 'bright', fix: 'panel', li: 40, lc: 0xf2fbff, trim: 0x6b8c8e },
  stair: { floor: 'terrazzo', floorCol: 0xb9b2a4, wall: 'plaster', wallCol: 0xd9d2c4, base: 0x7d7566, ceil: 0xe6e0d2, mood: 'warm', fix: 'none', li: 26, lc: 0xffe6c4, trim: 0x8d8372 },
};

// per-room overrides of the generic shell
const CUSTOM = {
  rotunda: { noCeil: true },
  ocean: { noCeil: true },
  rose: { noCeil: true, noWalls: true, noFloor: true, noShell: true },
  gilder: { noCeil: true, noWalls: true, noFloor: true, noShell: true },
};

const EPS = 0.02;
const SHELL = 0.45;

/** Subtract opening rects from a wall rect; returns solid [a,b,ya,yb] pieces. */
export function solids(u0, u1, y0, y1, ops) {
  const us = new Set([u0, u1]);
  for (const o of ops) {
    if (o.a > u0 && o.a < u1) us.add(o.a);
    if (o.b > u0 && o.b < u1) us.add(o.b);
  }
  const U = [...us].sort((a, b) => a - b);
  const cols = [];
  for (let i = 0; i < U.length - 1; i++) {
    const a = U[i], b = U[i + 1], mid = (a + b) / 2;
    const cover = ops.filter((o) => o.a <= mid && o.b >= mid).sort((p, q) => p.ya - q.ya);
    const spans = [];
    let y = y0;
    for (const o of cover) {
      if (o.ya > y + 1e-4) spans.push([y, Math.min(o.ya, y1)]);
      y = Math.max(y, o.yb);
    }
    if (y < y1 - 1e-4) spans.push([y, y1]);
    cols.push({ a, b, spans });
  }
  // merge neighbouring columns with identical spans
  const out = [];
  let cur = null;
  for (const c of cols) {
    const key = JSON.stringify(c.spans);
    if (cur && cur.key === key) cur.b = c.b;
    else { if (cur) for (const s of cur.spans) out.push([cur.a, cur.b, s[0], s[1]]); cur = { a: c.a, b: c.b, spans: c.spans, key }; }
  }
  if (cur) for (const s of cur.spans) out.push([cur.a, cur.b, s[0], s[1]]);
  return out;
}

/** Subtract hole rects [x0,z0,x1,z1] from a rect; returns list of rects. */
export function rectMinus(rect, holes) {
  let list = [rect];
  for (const h of holes) {
    const next = [];
    for (const r of list) {
      const ix0 = Math.max(r[0], h[0]), iz0 = Math.max(r[1], h[1]), ix1 = Math.min(r[2], h[2]), iz1 = Math.min(r[3], h[3]);
      if (ix0 >= ix1 || iz0 >= iz1) { next.push(r); continue; }
      if (r[1] < iz0) next.push([r[0], r[1], r[2], iz0]);
      if (iz1 < r[3]) next.push([r[0], iz1, r[2], r[3]]);
      if (r[0] < ix0) next.push([r[0], iz0, ix0, iz1]);
      if (ix1 < r[2]) next.push([ix1, iz0, r[2], iz1]);
    }
    list = next;
  }
  return list;
}

const SIDES = ['n', 's', 'w', 'e'];

/** Openings on one wall of a room, from portals + declared windows. */
function wallOpenings(room, side, portals) {
  const ops = [];
  const y0 = room.y, y1 = room.y + room.h;
  for (const p of portals) {
    if (p.y + p.h <= y0 + EPS || p.y >= y1 - EPS) continue;
    let hit = false, a, b;
    if (side === 'n' && p.axis === 'z' && Math.abs(p.z1 - room.z0) < EPS) { hit = true; a = p.x0; b = p.x1; }
    if (side === 's' && p.axis === 'z' && Math.abs(p.z0 - room.z1) < EPS) { hit = true; a = p.x0; b = p.x1; }
    if (side === 'w' && p.axis === 'x' && Math.abs(p.x1 - room.x0) < EPS) { hit = true; a = p.z0; b = p.z1; }
    if (side === 'e' && p.axis === 'x' && Math.abs(p.x0 - room.x1) < EPS) { hit = true; a = p.z0; b = p.z1; }
    if (!hit) continue;
    const lo = (side === 'n' || side === 's') ? room.x0 : room.z0, hi = (side === 'n' || side === 's') ? room.x1 : room.z1;
    if (b <= lo + EPS || a >= hi - EPS) continue;
    ops.push({ a: Math.max(a, lo), b: Math.min(b, hi), ya: p.y, yb: p.y + p.h, portal: p });
  }
  for (const w of room.windows || []) {
    if (w.side !== side) continue;
    ops.push({ a: w.a, b: w.b, ya: w.y0, yb: w.y1, window: w });
  }
  for (const w of room.openings || []) {
    if (w.side !== side) continue;
    ops.push({ a: w.a, b: w.b, ya: w.y0, yb: w.y1 });
  }
  return ops;
}

/** Map wall-local (u, y) on a side to world endpoints so the face points INTO the room. */
function sidePts(room, side, a, b, inset = 0) {
  switch (side) {
    case 'n': return [a, room.z0 + inset, b, room.z0 + inset];
    case 's': return [b, room.z1 - inset, a, room.z1 - inset];
    case 'w': return [room.x0 + inset, b, room.x0 + inset, a];
    default: return [room.x1 - inset, a, room.x1 - inset, b];
  }
}

function shadedWall(g, matName, pts, ya, yb, yFloor, yCeil, wallCol, baseCol, u0, flip) {
  // vertical gradient: darker near floor and ceiling (cheap ambient occlusion)
  const sh = (y) => {
    const up = y - yFloor, dn = yCeil - y;
    let k = 1;
    if (up < 2.4) k = Math.min(k, 0.8 + 0.2 * (up / 2.4));
    if (dn < 2.0) k = Math.min(k, 0.84 + 0.16 * (dn / 2.0));
    return k;
  };
  const brk = [ya, yb];
  for (const y of [yFloor + 0.24, yFloor + 2.4, yCeil - 2.0]) if (y > ya + 1e-3 && y < yb - 1e-3) brk.push(y);
  brk.sort((p, q) => p - q);
  for (let i = 0; i < brk.length - 1; i++) {
    const y0 = brk[i], y1 = brk[i + 1];
    const isBase = baseCol != null && y1 <= yFloor + 0.24 + 1e-3;
    const c0 = isBase ? shade(baseCol, 0.9) : shade(wallCol, sh(y0));
    const c1 = isBase ? baseCol : shade(wallCol, sh(y1));
    if (flip) g.wall(matName, pts[2], pts[3], pts[0], pts[1], y0, y1, { cBot: c0, cTop: c1, u0 });
    else g.wall(matName, pts[0], pts[1], pts[2], pts[3], y0, y1, { cBot: c0, cTop: c1, u0 });
  }
}

/**
 * Build the generic shell of a room into room.geo, and register physics.
 * W: { phys, lights, portals }
 */
export function buildRoom(room, W) {
  const st = { ...STYLES[room.style] || STYLES.classic, ...(room.over || {}) };
  const cu = { ...(CUSTOM[room.id] || {}), ...room };
  room.st = st;
  const g = room.geo;
  const { phys, lights } = W;
  const { x0, z0, x1, z1 } = room;
  const y0 = room.y, y1 = room.y + room.h;

  // ---- floor ----
  if (!cu.noFloor && !room.stair) {
    const rects = rectMinus([x0, z0, x1, z1], room.holes || []);
    for (const r of rects) {
      g.floor(st.floor, r[0], r[1], r[2], r[3], y0, { color: st.floorCol });
      phys.floor(r[0], r[1], r[2], r[3], y0);
    }
  }

  // ---- ceiling ----
  if (!cu.noCeil && !room.stair) {
    g.ceil('plaster', x0, z0, x1, z1, y1, { color: st.ceil });
    const w = x1 - x0, d = z1 - z0;
    if (st.fix === 'panel') {
      const nx = Math.max(1, Math.round(w / 5.5)), nz = Math.max(1, Math.round(d / 5.5));
      const long = w >= d;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const cx = x0 + (i + 0.5) * w / nx, cz = z0 + (j + 0.5) * d / nz;
        const hx = long ? 0.9 : 0.28, hz = long ? 0.28 : 0.9;
        g.ceil('glow', cx - hx, cz - hz, cx + hx, cz + hz, y1 - 0.065, { color: [2.4, 2.25, 1.95] });
        g.box('flat', cx - hx - 0.06, y1 - 0.06, cz - hz - 0.06, cx + hx + 0.06, y1 - 0.001, cz + hz + 0.06, { color: 0x3a3832, skip: 'y+' });
      }
    }
  }
  // light anchors
  if (st.li > 0) {
    const w = x1 - x0, d = z1 - z0;
    const nx = Math.max(1, Math.round(w / 15)), nz = Math.max(1, Math.round(d / 15));
    const ly = Math.min(y1 - 0.7, y0 + 5.2);
    const levels = room.stair ? [1, 2, 3, 4].map((f) => FLOOR_Y[f] + 4.6) : [ly];
    for (const yy of levels) for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      lights.anchor(x0 + (i + 0.5) * w / nx, yy, z0 + (j + 0.5) * d / nz, { color: st.lc, intensity: st.li, dist: Math.max(18, Math.min(30, Math.max(w / nx, d / nz) * 1.9)) });
    }
  }

  // ---- walls + outer shell ----
  for (const side of SIDES) {
    if (cu.noWalls === true || (cu.noWalls && cu.noWalls[side])) continue;
    const horiz = side === 'n' || side === 's';
    const lo = horiz ? x0 : z0, hi = horiz ? x1 : z1;
    const ops = wallOpenings(room, side, W.portals);
    const sol = solids(lo, hi, y0, y1, ops);
    for (const [a, b, ya, yb] of sol) {
      shadedWall(g, st.wall, sidePts(room, side, a, b), ya, yb, y0, y1, st.wallCol, Math.abs(ya - y0) < 1e-3 ? st.base : null, a, false);
      // collider just behind the face
      if (side === 'n') phys.box(a, z0 - 0.4, b, z0, ya, yb);
      else if (side === 's') phys.box(a, z1, b, z1 + 0.4, ya, yb);
      else if (side === 'w') phys.box(x0 - 0.4, a, x0, b, ya, yb);
      else phys.box(x1, a, x1 + 0.4, b, ya, yb);
      // exterior shell (faces outward)
      if (!cu.noShell) {
        const p = sidePts(room, side, a, b, -SHELL);
        const ea = a === lo ? a - SHELL : a, eb = b === hi ? b + SHELL : b;
        const q = sidePts(room, side, ea, eb, -SHELL);
        g.wall('stone', q[2], q[3], q[0], q[1], ya, yb, { color: W.shellCol || 0xc9b8a6, u0: a });
      }
    }
    // windows: glass + frame + reveal
    for (const o of ops) {
      if (!o.window) continue;
      const wdw = o.window;
      const p = sidePts(room, side, o.a, o.b, -SHELL / 2);
      g.wall('glass', p[0], p[1], p[2], p[3], o.ya, o.yb, { color: 0xbfd8e8 });
      // reveals (4 sides of the hole through the wall thickness)
      const pin = sidePts(room, side, o.a, o.b, 0), pout = sidePts(room, side, o.a, o.b, -SHELL);
      const rc = shade(st.wallCol, 0.92);
      g.quad('plaster', [pin[0], o.ya, pin[1]], [pin[2], o.ya, pin[3]], [pout[2], o.ya, pout[3]], [pout[0], o.ya, pout[1]], { color: rc });
      g.quad('plaster', [pout[0], o.yb, pout[1]], [pout[2], o.yb, pout[3]], [pin[2], o.yb, pin[3]], [pin[0], o.yb, pin[1]], { color: rc });
      g.quad('plaster', [pin[0], o.ya, pin[1]], [pout[0], o.ya, pout[1]], [pout[0], o.yb, pout[1]], [pin[0], o.yb, pin[1]], { color: rc });
      g.quad('plaster', [pout[2], o.ya, pout[3]], [pin[2], o.ya, pin[3]], [pin[2], o.yb, pin[3]], [pout[2], o.yb, pout[3]], { color: rc });
      // mullions
      const n = wdw.mullions ?? 2;
      for (let i = 1; i <= n; i++) {
        const u = o.a + (o.b - o.a) * i / (n + 1);
        const m0 = sidePts(room, side, u - 0.04, u + 0.04, -SHELL / 2 + 0.03);
        g.wall('satin', m0[0], m0[1], m0[2], m0[3], o.ya, o.yb, { color: 0x2c2a26 });
      }
      const my = o.ya + (o.yb - o.ya) * 0.62;
      const m1 = sidePts(room, side, o.a, o.b, -SHELL / 2 + 0.03);
      g.wall('satin', m1[0], m1[1], m1[2], m1[3], my - 0.04, my + 0.04, { color: 0x2c2a26 });
      // keep people inside
      if (side === 'n') phys.box(o.a, z0 - 0.4, o.b, z0, o.ya, o.yb);
      else if (side === 's') phys.box(o.a, z1, o.b, z1 + 0.4, o.ya, o.yb);
      else if (side === 'w') phys.box(x0 - 0.4, o.a, x0, o.b, o.ya, o.yb);
      else phys.box(x1, o.a, x1 + 0.4, o.b, o.ya, o.yb);
      // daylight spilling in
      const c = sidePts(room, side, (o.a + o.b) / 2, (o.a + o.b) / 2, 1.2);
      if (wdw.light !== false) lights.anchor(c[0], (o.ya + o.yb) / 2, c[1], { color: 0xdfeaff, intensity: 16, dist: 18 });
    }
  }
  // roof of the shell
  if (!cu.noShell) {
    g.floor('flat', x0 - SHELL, z0 - SHELL, x1 + SHELL, z1 + SHELL, y1 + 0.35, { color: 0x6d6a66 });
  }
}

/** Evenly spaced windows on a wall; skips spots that collide with doorways. */
export function addWindows(room, side, n, o = {}) {
  const horiz = side === 'n' || side === 's';
  const lo = horiz ? room.x0 : room.z0, hi = horiz ? room.x1 : room.z1;
  const w = o.w || 2.6, sill = o.sill ?? 1.3, top = o.top ?? (room.h - 0.9);
  const from = o.from ?? lo, to = o.to ?? hi;
  room.windows = room.windows || [];
  for (let i = 0; i < n; i++) {
    const c = from + (i + 0.5) * (to - from) / n;
    room.windows.push({ side, a: c - w / 2, b: c + w / 2, y0: room.y + sill, y1: room.y + top, mullions: o.mullions });
  }
}

/** Remove windows that overlap doorways on the same wall (call after all addWindows). */
export function pruneWindows(room, portals) {
  if (!room.windows) return;
  room.windows = room.windows.filter((w) => {
    const ops = wallOpenings({ ...room, windows: [], openings: [] }, w.side, portals);
    return !ops.some((o) => o.a < w.b + 0.6 && o.b > w.a - 0.6 && o.ya < w.y1 && o.yb > w.y0);
  });
}

/** Doorway passage through the 1 m wall between two rooms. */
export function buildPortal(p, g, W) {
  const { phys } = W;
  const y = p.y, h = p.h;
  const cFloor = p.floorCol ?? 0x9d9484, cWall = p.wallCol ?? 0xcfc5b3;
  const trims = p.trims || [p.trim ?? 0x6f6252, p.trim ?? 0x6f6252];
  g.floor('marble', p.x0, p.z0, p.x1, p.z1, y + 0.003, { color: cFloor });
  g.ceil('plaster', p.x0, p.z0, p.x1, p.z1, y + h, { color: shade(cWall, 0.8) });
  if (p.axis === 'x') {
    g.wall('plaster', p.x0, p.z0, p.x1, p.z0, y, y + h, { cBot: shade(cWall, 0.75), cTop: shade(cWall, 0.9) });
    g.wall('plaster', p.x1, p.z1, p.x0, p.z1, y, y + h, { cBot: shade(cWall, 0.75), cTop: shade(cWall, 0.9) });
    phys.box(p.x0 - 0.05, p.z0 - 0.5, p.x1 + 0.05, p.z0, y, y + h + 1);
    phys.box(p.x0 - 0.05, p.z1, p.x1 + 0.05, p.z1 + 0.5, y, y + h + 1);
    phys.floor(p.x0 - 0.05, p.z0, p.x1 + 0.05, p.z1, y);
    if (!p.noTrim) for (const [xf, dir] of [[p.x0, -1], [p.x1, 1]]) {
      const xa = xf, xb = xf + dir * 0.07;
      const cTrim = trims[dir < 0 ? 0 : 1];
      g.box('satin', xa, y, p.z0 - 0.28, xb, y + h + 0.3, p.z0, { color: cTrim });
      g.box('satin', xa, y, p.z1, xb, y + h + 0.3, p.z1 + 0.28, { color: cTrim });
      g.box('satin', xa, y + h, p.z0, xb, y + h + 0.3, p.z1, { color: cTrim });
    }
  } else {
    g.wall('plaster', p.x0, p.z1, p.x0, p.z0, y, y + h, { cBot: shade(cWall, 0.75), cTop: shade(cWall, 0.9) });
    g.wall('plaster', p.x1, p.z0, p.x1, p.z1, y, y + h, { cBot: shade(cWall, 0.75), cTop: shade(cWall, 0.9) });
    phys.box(p.x0 - 0.5, p.z0 - 0.05, p.x0, p.z1 + 0.05, y, y + h + 1);
    phys.box(p.x1, p.z0 - 0.05, p.x1 + 0.5, p.z1 + 0.05, y, y + h + 1);
    phys.floor(p.x0, p.z0 - 0.05, p.x1, p.z1 + 0.05, y);
    if (!p.noTrim) for (const [zf, dir] of [[p.z0, -1], [p.z1, 1]]) {
      const za = zf, zb = zf + dir * 0.07;
      const cTrim = trims[dir < 0 ? 0 : 1];
      g.box('satin', p.x0 - 0.28, y, za, p.x0, y + h + 0.3, zb, { color: cTrim });
      g.box('satin', p.x1, y, za, p.x1 + 0.28, y + h + 0.3, zb, { color: cTrim });
      g.box('satin', p.x0, y + h, za, p.x1, y + h + 0.3, zb, { color: cTrim });
    }
  }
}

/**
 * Switchback stair filling a 5.2 x 10 m shaft (room.x0..x1 must be 5.2 wide, z0..z1 10 long).
 * Landing A (the floor-level landing, where the door is) is at the z0 end, or the z1 end if flip.
 */
export function buildStair(room, W) {
  const { phys, lights } = W;
  const g = room.geo;
  const st = room.st;
  const { x0, x1, z0, z1 } = room;
  const flip = room.stair.flip;
  const floors = room.stair.floors;
  const Z = (s) => (flip ? z1 - s : z0 + s); // s: distance from landing-A end
  const xa0 = x0, xa1 = x0 + 2.4, xb0 = x0 + 2.8, xb1 = x1;
  const stepCol = 0xb9b0a0, slab = 0x9a9284, rail = 0x3a3630;
  const zr = (s0, s1) => [Math.min(Z(s0), Z(s1)), Math.max(Z(s0), Z(s1))];

  for (let k = 0; k < floors.length; k++) {
    const y = FLOOR_Y[floors[k]];
    const top = k === floors.length - 1;
    // landing A
    const [la0, la1] = zr(0, 2);
    g.box('terrazzo', x0, y - 0.25, la0, x1, y, la1, { color: st.floorCol });
    phys.floor(x0, la0, x1, la1, y);
    if (!top) {
      const ym = y + F2F / 2, yn = y + F2F;
      // landing B (mid level)
      const [lb0, lb1] = zr(8, 10);
      g.box('terrazzo', x0, ym - 0.25, lb0, x1, ym, lb1, { color: st.floorCol });
      phys.floor(x0, lb0, x1, lb1, ym);
      // flights
      const n = 20, run = 6 / n, rise = (F2F / 2) / n;
      for (let i = 0; i < n; i++) {
        const [s0, s1] = [2 + i * run, 2 + (i + 1) * run];
        const [fa0, fa1] = zr(s0, s1);
        const ty = y + (i + 1) * rise;
        g.box('terrazzo', xa0, ty - rise - 0.12, fa0, xa1, ty, fa1, { color: stepCol, top: 0xc9c0b0 });
        // flight 2 runs back from s=8 to s=2
        const [t0, t1] = [8 - i * run, 8 - (i + 1) * run];
        const [fb0, fb1] = zr(t0, t1);
        const ty2 = ym + (i + 1) * rise;
        g.box('terrazzo', xb0, ty2 - rise - 0.12, fb0, xb1, ty2, fb1, { color: stepCol, top: 0xc9c0b0 });
      }
      if (flip) {
        phys.ramp(xa0, Z(2), xa1, Z(8), y, ym, 'z');
        phys.ramp(xb0, Z(8), xb1, Z(2), ym, yn, 'z');
      } else {
        phys.ramp(xa0, Z(2), xa1, Z(8), y, ym, 'z');
        phys.ramp(xb0, Z(8), xb1, Z(2), ym, yn, 'z');
      }
      lights.anchor((x0 + x1) / 2, ym + 2.6, Z(8.6), { color: st.lc, intensity: st.li, dist: 16 });
      // wall light
      const [wl0, wl1] = zr(9.9, 9.97);
      g.box('glow', x0 + 1.6, ym + 2.3, wl0, x1 - 1.6, ym + 2.6, wl1, { color: [2.2, 2.0, 1.6] });
    }
    // guards so nobody steps into a void at the bottom / top
    if (k === 0) {
      const [b0, b1] = zr(2, 2.15);
      g.box('plaster', xb0, y, b0, xb1, y + 1.1, b1, { color: st.wallCol });
      phys.box(xb0, b0, xb1, b1, y, y + 2);
    }
    if (top) {
      const [b0, b1] = zr(2, 2.15);
      g.box('plaster', xa0, y, b0, xa1, y + 1.1, b1, { color: st.wallCol });
      phys.box(xa0, b0, xa1, b1, y, y + 2);
    }
  }
  // shaft floor
  g.floor('terrazzo', x0, z0, x1, z1, FLOOR_Y[floors[0]] - 0.01, { color: st.floorCol });
  // central spine wall with handrail
  const yb = FLOOR_Y[floors[0]], yt = FLOOR_Y[floors[floors.length - 1]] + 1.1;
  const [c0, c1] = zr(2, 8);
  g.box('plaster', xa1, yb, c0, xb0, yt, c1, { color: shade(st.wallCol, 0.92) });
  phys.box(xa1, c0, xb0, c1, yb, yt + 2);
  void rail; void slab;
}

/** Elevator doors on a wall. Returns the interactable descriptor. */
export function buildElevator(g, e, floor) {
  const y = FLOOR_Y[floor];
  const th = e.face * Math.PI / 180;
  const dx = Math.sin(th), dz = -Math.cos(th);
  const rot = Math.PI - th;
  const px = e.x, pz = e.z;
  // frame
  g.rbox('metal', px + dx * 0.03, y, pz + dz * 0.03, 2.3, 2.75, 0.1, rot, { color: 0x8b8478 });
  // doors
  for (const s of [-1, 1]) {
    const ox = Math.cos(th) * s * 0.5, oz = Math.sin(th) * s * 0.5;
    g.rbox('metal', px + dx * 0.07 + ox, y + 0.02, pz + dz * 0.07 + oz, 0.97, 2.5, 0.05, rot, { color: 0xb8b2a6 });
  }
  // indicator + call button
  g.rbox('glow', px + dx * 0.09, y + 2.56, pz + dz * 0.09, 0.5, 0.12, 0.02, rot, { color: [2.2, 1.4, 0.4] });
  const bx = Math.cos(th) * 1.4, bz = Math.sin(th) * 1.4;
  g.rbox('metal', px + dx * 0.04 + bx, y + 1.0, pz + dz * 0.04 + bz, 0.14, 0.3, 0.04, rot, { color: 0x5a564e });
  g.rbox('glow', px + dx * 0.07 + bx, y + 1.12, pz + dz * 0.07 + bz, 0.05, 0.05, 0.02, rot, { color: [0.6, 2.0, 0.8] });
  return {
    type: 'elevator', bank: e.bank, floor, floors: e.floors,
    pos: [px + dx * 0.5, y + 1.4, pz + dz * 0.5],
    stand: { x: px + dx * 1.6, y, z: pz + dz * 1.6, yaw: (e.face) % 360 },
    label: 'Elevator',
  };
}

export { Geo, col, mixCol };
export const _T = THREE;
