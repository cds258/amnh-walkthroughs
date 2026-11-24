// Irregular rock / meteorite masses.
import * as THREE from 'three';
import { fbm } from '../engine/textures.js';

/**
 * Lumpy mass roughly inscribed in radii [rx, ry, rz].
 * o: { seed, detail (icosphere subdivisions, 3), rough (0.25), pits (0..1 regmaglypt depth), flatBottom }
 */
export function lump(rx, ry, rz, o = {}) {
  const g = new THREE.IcosahedronGeometry(1, o.detail ?? 3);
  const p = g.attributes.position;
  const sd = (o.seed || 1) * 13.37;
  const rough = o.rough ?? 0.25, pits = o.pits ?? 0;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l;
    let k = 1 + rough * (fbm(x * 1.4 + sd, y * 1.4 + z * 1.9 + sd, 512, 3, 3) - 0.5) * 2;
    k += rough * 0.5 * (fbm(x * 3.1 + z * 2.2 + sd, y * 3.3 - sd, 512, 7, 2) - 0.5);
    if (pits) {
      const c = fbm(x * 5 + sd, y * 5 + z * 6, 512, 11, 2);
      k -= pits * Math.max(0, c - 0.55) * 1.2;
    }
    k = Math.max(0.55, k);
    let yy = y * k * ry;
    if (o.flatBottom && yy < -ry * o.flatBottom) yy = -ry * o.flatBottom;
    p.setXYZ(i, x * k * rx, yy, z * k * rz);
  }
  // IcosahedronGeometry is non-indexed: merge duplicates by position for smooth shading
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  const merged = mergeByPosition(g);
  merged.computeVertexNormals();
  // spherical uv
  const mp = merged.attributes.position;
  const uv = new Float32Array(mp.count * 2);
  for (let i = 0; i < mp.count; i++) {
    const x = mp.getX(i), y = mp.getY(i), z = mp.getZ(i);
    uv[i * 2] = Math.atan2(z, x) / 6.283 * Math.max(rx, rz) * 3;
    uv[i * 2 + 1] = y;
  }
  merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return merged;
}

function mergeByPosition(g) {
  const p = g.attributes.position;
  const map = new Map();
  const pos = [], idx = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;
    let j = map.get(k);
    if (j === undefined) { j = pos.length / 3; pos.push(x, y, z); map.set(k, j); }
    idx.push(j);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setIndex(idx);
  return out;
}
