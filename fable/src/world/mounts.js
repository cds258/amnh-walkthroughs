// Mounting model-library specimens (skeletons, taxidermy) in the halls: platform, collision, shadow, label.
import * as THREE from 'three';
import { xform } from '../engine/builder.js';
import { model, geoBounds } from '../models/index.js';
import { blob } from './furniture.js';

/**
 * Place a model on a low platform sized to its footprint.
 * o: { lib ('skeletons'), opts, scale, y, ph (platform height, 0.3; 0 = none), pcol, pmat, padX, padZ,
 *      hang: true (no platform/collider; y = lowest point), rename,
 *      trimX: [fracStart, fracEnd] restrict the platform to part of the model's length (0 = tail end, 1 = head end),
 *      label: { title, sub, text, star, id, side: 1 | -1 (which long side, +1 = model's +z), at: 0 (offset along the body), dist } }
 * Returns { top, hx, hz, cx, cz, bounds }.
 */
export function mount(ctx, name, x, z, rotDeg = 0, o = {}) {
  const { geo, phys } = ctx;
  const m = model(o.lib || 'skeletons', name, o.opts || {});
  const b = geoBounds(m);
  const s = o.scale || 1;
  const y = o.y ?? ctx.room.y;
  const r = rotDeg * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r);
  let lx0 = b.min[0] * s, lx1 = b.max[0] * s;
  if (o.trimX) { const L = lx1 - lx0; const a = lx0 + L * o.trimX[0], e = lx0 + L * o.trimX[1]; lx0 = a; lx1 = e; }
  const padX = o.padX ?? 0.6, padZ = o.padZ ?? 0.55;
  const cxm = (lx0 + lx1) / 2, czm = (b.min[2] + b.max[2]) / 2 * s;
  const hx = (lx1 - lx0) / 2 + padX, hz = Math.max((b.max[2] - b.min[2]) / 2 * s + padZ, o.minHalfZ ?? 1.0);
  // model local (lx, lz) -> world: x + lx*c + lz*sn, z - lx*sn + lz*c
  const toW = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
  if (o.center) {
    // shift so the centre of the whole footprint lands on (x, z)
    const fx = (b.min[0] + b.max[0]) / 2 * s, fz = (b.min[2] + b.max[2]) / 2 * s;
    x -= fx * c + fz * sn; z -= -fx * sn + fz * c;
  }
  const [pcx, pcz] = toW(cxm, czm);
  const ph = o.hang ? 0 : (o.ph ?? 0.3);
  if (ph > 0) {
    geo.rbox(o.pmat || 'wood', pcx, y, pcz, hx * 2, ph, hz * 2, r, { color: o.pcol ?? 0xd6ccb8 });
    geo.rbox('satin', pcx, y, pcz, hx * 2 + 0.06, 0.1, hz * 2 + 0.06, r, { color: 0x2a2826 });
    phys.obb(pcx, pcz, hx, hz, r, y, y + (o.collideH ?? 2.4));
    blob(geo, pcx, y, pcz, hx * 1.15, hz * 1.25, rotDeg);
  } else if (!o.hang && o.collide !== false) {
    phys.obb(pcx, pcz, Math.max(0.3, hx - padX), Math.max(0.3, hz - padZ), r, y, y + 2.4);
  }
  geo.addGeo(m, xform(x, y + ph, z, r, s), o.rename);
  if (!o.hang) blob(geo, pcx, y + ph, pcz, Math.max(0.5, hx - padX) * 0.95, Math.max(0.4, hz - padZ) * 1.1, rotDeg);
  const H = (b.max[1] - b.min[1]) * s;
  if (o.label) {
    const L = o.label;
    const side = L.side ?? 1;
    const [px, pz] = toW(cxm + (L.at ?? 0), czm + side * (hz + 0.5));
    const face = side > 0 ? 180 - rotDeg : -rotDeg;
    const dist = L.dist ?? Math.min(9, Math.max(3, Math.max(H, hx) * 0.55));
    const [vx, vz] = toW(cxm + (L.at ?? 0) + (L.viewAt ?? 0), czm + side * (hz + 0.5 + dist));
    const tgt = toW(cxm + (L.lookAt ?? 0), czm);
    const ty = y + ph + H * (L.lookH ?? 0.55);
    const yaw = Math.atan2(tgt[0] - vx, -(tgt[1] - vz)) * 180 / Math.PI;
    const pitch = Math.atan2(ty - (y + 1.66), Math.hypot(tgt[0] - vx, tgt[1] - vz)) * 180 / Math.PI;
    ctx.placard({
      id: L.id, title: L.title, sub: L.sub, text: L.text, star: L.star, size: L.size,
      x: px, y, z: pz, face: ((face % 360) + 360) % 360,
      target: [tgt[0], ty, tgt[1]],
      view: { x: vx, y, z: vz, yaw, pitch: Math.max(-20, Math.min(50, pitch)) },
    });
  }
  return { top: y + ph, hx, hz, cx: pcx, cz: pcz, bounds: b, H, toW };
}

export { THREE };
