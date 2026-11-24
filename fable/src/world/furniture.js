// Reusable museum furniture: railings, cases, pedestals, benches, shadow blobs, ropes.
import * as THREE from 'three';
import { shade } from '../engine/builder.js';

/** Soft contact shadow on a floor. */
export function blob(geo, x, y, z, rx, rz, rotDeg = 0) {
  const g = new THREE.PlaneGeometry(rx * 2, rz * 2);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Matrix4().makeRotationY(rotDeg * Math.PI / 180).setPosition(x, y + 0.012, z);
  geo.add('shadow', g, m, [0, 0, 0]);
}

/**
 * Railing along a polyline of [x,z] points at floor height y.
 * o: { h: 1.05, color, mat: 'bronze', glass: false, bars: 3, collide: true }
 */
export function railing(ctx, pts, y, o = {}) {
  const { geo, phys } = ctx;
  const h = o.h ?? 1.05, colr = o.color ?? 0x3a3a3c, mat = o.mat ?? 'bronze';
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 0.01) continue;
    const rot = Math.atan2(-(bz - az), bx - ax);
    const cx = (ax + bx) / 2, cz = (az + bz) / 2;
    geo.rbox(mat, cx, y + h - 0.05, cz, len + 0.06, 0.05, 0.07, rot, { color: colr });
    if (o.glass) {
      const g = new THREE.PlaneGeometry(len, h - 0.12);
      geo.add('glass', g, new THREE.Matrix4().makeRotationY(rot).setPosition(cx, y + (h - 0.12) / 2 + 0.04, cz), 0xd0e4ee);
      geo.rbox(mat, cx, y, cz, len, 0.04, 0.05, rot, { color: colr });
    } else {
      const bars = o.bars ?? 3;
      for (let b = 1; b <= bars; b++) geo.rbox(mat, cx, y + (h - 0.05) * b / (bars + 1) - 0.015, cz, len, 0.03, 0.03, rot, { color: colr });
    }
    const n = Math.max(1, Math.round(len / (o.post ?? 1.4)));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      geo.rbox(mat, ax + (bx - ax) * t, y, az + (bz - az) * t, 0.06, h - 0.02, 0.06, rot, { color: colr });
    }
    if (o.collide !== false) phys.seg(ax, az, bx, bz, 0.14, y - 0.2, y + h + 0.5);
  }
}

/** Simple backless bench. */
export function bench(ctx, x, y, z, rotDeg = 0, len = 2.2, color = 0x5a4632) {
  const { geo, phys } = ctx;
  const r = rotDeg * Math.PI / 180;
  geo.rbox('wood', x, y + 0.4, z, len, 0.08, 0.5, r, { color });
  const c = Math.cos(r), s = Math.sin(r);
  for (const k of [-1, 1]) {
    const ox = k * (len / 2 - 0.2);
    geo.rbox('satin', x + c * ox, y, z - s * ox, 0.08, 0.4, 0.44, r, { color: 0x24221f });
  }
  blob(geo, x, y, z, len * 0.6, 0.45, rotDeg);
  phys.obb(x, z, len / 2, 0.25, r, y, y + 0.5);
}

/** Solid pedestal / plinth. Returns the top height. */
export function pedestal(ctx, x, y, z, w, d, h, color = 0x2a2826, o = {}) {
  const { geo, phys } = ctx;
  const r = (o.rot || 0) * Math.PI / 180;
  geo.rbox(o.mat || 'satin', x, y, z, w, h, d, r, { color });
  if (o.cap) geo.rbox(o.mat || 'satin', x, y + h, z, w + 0.06, 0.04, d + 0.06, r, { color: shade(color, 1.4) });
  if (o.collide !== false) phys.obb(x, z, w / 2, d / 2, r, y, y + Math.max(h, 1.2));
  if (o.shadow !== false) blob(geo, x, y, z, w * 0.75, d * 0.75, o.rot || 0);
  return y + h;
}

/**
 * Free-standing glass display case on a plinth. Returns the height of the display deck.
 * o: { rot, plinth: 0.85, color, top: true, light: true }
 */
export function vitrine(ctx, x, y, z, w, d, h, o = {}) {
  const { geo, phys } = ctx;
  const r = (o.rot || 0) * Math.PI / 180;
  const ph = o.plinth ?? 0.85, colr = o.color ?? 0x1e1d1c;
  geo.rbox('satin', x, y, z, w, ph, d, r, { color: colr });
  geo.rbox('flat', x, y + ph, z, w - 0.04, 0.015, d - 0.04, r, { color: o.deck ?? 0x3a3835 });
  // glass
  const g = new THREE.BoxGeometry(w - 0.02, h, d - 0.02);
  geo.add('glass', g, new THREE.Matrix4().makeRotationY(r).setPosition(x, y + ph + h / 2, z), 0xd4e6ee);
  // thin metal frame edges + lid
  const c = Math.cos(r), s = Math.sin(r);
  for (const [ex, ez] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const lx = ex * (w / 2 - 0.012), lz = ez * (d / 2 - 0.012);
    geo.rbox('metal', x + c * lx + s * lz, y + ph, z - s * lx + c * lz, 0.024, h, 0.024, r, { color: 0x4a4844 });
  }
  if (o.top !== false) {
    geo.rbox('satin', x, y + ph + h, z, w, 0.07, d, r, { color: colr });
    if (o.light !== false) geo.rbox('glow', x, y + ph + h - 0.012, z, w * 0.7, 0.012, d * 0.5, r, { color: [1.8, 1.65, 1.35] });
  }
  phys.obb(x, z, w / 2, d / 2, r, y, y + ph + h);
  blob(geo, x, y, z, w * 0.7, d * 0.7, o.rot || 0);
  return y + ph + 0.015;
}

/** Low exhibit island (not walkable). */
export function island(ctx, x0, z0, x1, z1, y, h = 0.3, color = 0x2e2c2a, mat = 'satin', top) {
  const { geo, phys } = ctx;
  geo.box(mat, x0, y, z0, x1, y + h, z1, { color, top: top ?? color });
  phys.box(x0, z0, x1, z1, y, y + 2.4);
  return y + h;
}

/** Rope barrier on stanchions along a polyline. */
export function rope(ctx, pts, y, o = {}) {
  const { geo, phys } = ctx;
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    geo.cyl('metal', x, y, z, 0.035, 0.95, { color: 0xb09a5a, seg: 8 });
    geo.cyl('metal', x, y, z, 0.16, 0.03, { color: 0xb09a5a, seg: 12 });
    if (i < pts.length - 1) {
      const [bx, bz] = pts[i + 1];
      const len = Math.hypot(bx - x, bz - z), rot = Math.atan2(-(bz - z), bx - x);
      geo.rbox('flat', (x + bx) / 2, y + 0.78, (z + bz) / 2, len, 0.035, 0.035, rot, { color: o.color ?? 0x6a1a1a });
      if (o.collide !== false) phys.seg(x, z, bx, bz, 0.1, y, y + 1.2);
    }
  }
}

/** Hanging banner / title panel backing (plain coloured board on a wall). */
export function board(ctx, x, y, z, face, w, h, color = 0x1c1c1e, mat = 'satin') {
  const th = face * Math.PI / 180;
  ctx.geo.rbox(mat, x + Math.sin(th) * 0.02, y - h / 2, z - Math.cos(th) * 0.02, w, h, 0.04, Math.PI - th, { color });
}

/** Round column. */
export function column(ctx, x, y, z, r, h, color, mat = 'marble', o = {}) {
  const { geo, phys } = ctx;
  geo.cyl(mat, x, y + (o.base ?? 0.5), z, r, h - (o.base ?? 0.5) - (o.cap ?? 0.5), { color, seg: o.seg || 18 });
  geo.cyl(mat, x, y, z, r * 1.25, o.base ?? 0.5, { color: o.trim ?? color, seg: o.seg || 18 });
  geo.cyl(mat, x, y + h - (o.cap ?? 0.5), z, r * 1.3, o.cap ?? 0.5, { color: o.trim ?? color, seg: o.seg || 18, rTop: r * 1.45 });
  phys.cyl(x, z, r * 1.2, y, y + h);
}
