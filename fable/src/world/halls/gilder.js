// Richard Gilder Center: the Griffin Exploration Atrium.
// The atrium is modelled as a block of "shotcrete" with the canyon, the side galleries, the arched
// openings and the tunnels carved out of it as a signed-distance field; bridges and floor slabs are
// added back. The field is polygonised with surface nets and also serves as the collision volume.
import * as THREE from 'three';
import { registerMat } from '../../engine/materials.js';
import { col } from '../../engine/builder.js';
import { bench } from '../furniture.js';

const X0 = -96, X1 = -39, Z0 = -14, Z1 = 14, YT = 28;
const FY = [0, 6.5, 13, 19.5];
const K = 0.8; // blend radius between carved voids
const SLOTS = [-90, -83, -76, -69, -62, -55, -48];
const BRIDGES = { 1: [-69], 2: [-83, -55], 3: [-76] };
const DOORS1 = [-83, -62];
const NORTH_DOOR = [-64, -58], SOUTH_DOOR = [-70, -64];
const STAIR = { x0: -60, x1: -47, z0: -2.6, z1: 0.2, zb: 3.4 };

const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
function rrect(u, v, hu, hv, r) {
  const qx = Math.abs(u) - hu + r, qy = Math.abs(v) - hv + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
function boxd(x, y, z, b) {
  const qx = Math.abs(x - (b[0] + b[3]) / 2) - (b[3] - b[0]) / 2;
  const qy = Math.abs(y - (b[1] + b[4]) / 2) - (b[4] - b[1]) / 2;
  const qz = Math.abs(z - (b[2] + b[5]) / 2) - (b[5] - b[2]) / 2;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0);
}

const canyonZ = (x, y) => 1.2 * Math.sin(0.12 * x + 0.09 * y);
function canyon(x, y, z) {
  const zc = canyonZ(x, y);
  let w = 5.4 + 0.7 * Math.sin(0.21 * x + 0.5) + 0.5 * Math.sin(0.13 * x - 0.25 * y) + 0.05 * y;
  const b = (x + 53.5) / 8;
  w += 2.0 * Math.exp(-b * b);
  w = Math.min(w, 7.8 - Math.abs(zc));
  const dz = z - zc;
  let d = Math.abs(dz) - w;
  d = smax(d, x + 40.6, 1.5);
  d = smax(d, y - (25.2 + 0.8 * Math.sin(0.15 * x)) + 0.045 * dz * dz, 2.0);
  return d;
}

// ---- carved voids (negative inside) and added solids, each with a bounding box for early-out ----
const AIR = [], SOLID = [];
const M = 1.5;
function air(bb, f) { AIR.push({ x0: bb[0] - M, y0: bb[1] - M, z0: bb[2] - M, x1: bb[3] + M, y1: bb[4] + M, z1: bb[5] + M, f }); }
function solid(b) { SOLID.push({ b, x0: b[0] - M, y0: b[1] - M, z0: b[2] - M, x1: b[3] + M, y1: b[4] + M, z1: b[5] + M }); }

function define() {
  if (AIR.length) return;
  for (let fi = 0; fi < 4; fi++) {
    const fy = FY[fi];
    for (const s of [-1, 1]) {
      // side gallery
      const zc = s * 11.3, yc = fy + 1.75;
      air([-94, fy - 0.9, zc - 2.1, -40.6, fy + 4.4, zc + 2.1], (x, y, z) => Math.max(rrect(z - zc, y - yc, 2.1, 2.65, 0.9), -94 - x, x + 40.6));
      // arched openings between gallery and canyon: doors where a deck lands, windows with sills elsewhere
      const doors = fi === 0 ? DOORS1 : (BRIDGES[fi] || []);
      for (const xs of SLOTS) {
        const door = doors.includes(xs);
        const hw = door ? 1.6 : 2.2, y0 = door ? fy - 0.9 : fy + 1.0, y1 = door ? fy + 3.5 : fy + 3.9, r = door ? 1.0 : 1.2;
        const ym = (y0 + y1) / 2, hh = (y1 - y0) / 2;
        air([xs - hw, y0, s > 0 ? 2.5 : -9.7, xs + hw, y1, s > 0 ? 9.7 : -2.5], (x, y, z) => Math.max(rrect(x - xs, y - ym, hw, hh, r), 2.5 - s * z, s * z - 9.7));
      }
      // door at the east balcony
      const ym = fy + 1.3;
      air([-45, fy - 0.9, s > 0 ? 2.5 : -9.7, -42, fy + 3.5, s > 0 ? 9.7 : -2.5], (x, y, z) => Math.max(rrect(x + 43.5, y - ym, 1.5, 2.2, 1.0), 2.5 - s * z, s * z - 9.7));
    }
    // tunnels to the neighbouring rooms
    const tn = [NORTH_DOOR[0] - 0.2, fy - 0.9, -15.5, NORTH_DOOR[1] + 0.2, fy + 4.4, -12.4];
    const ts = [SOUTH_DOOR[0] - 0.2, fy - 0.9, 12.4, SOUTH_DOOR[1] + 0.2, fy + 4.4, 15.5];
    const te = [-42.5, fy - 0.9, -4.2, -38, fy + 4.5, 4.2];
    for (const t of [tn, ts, te]) air(t, (x, y, z) => boxd(x, y, z, t));
    if (fi > 0) {
      // gallery floor slabs, bridges with parapets, the east balcony
      solid([X0 - 2, fy - 0.9, 8.4, X1 + 2, fy, 16]);
      solid([X0 - 2, fy - 0.9, -16, X1 + 2, fy, -8.4]);
      for (const bx of BRIDGES[fi]) {
        solid([bx - 2.25, fy - 0.7, -9.5, bx + 2.25, fy, 9.5]);
        solid([bx - 2.25, fy - 0.7, -8.6, bx - 1.62, fy + 1.05, 8.6]);
        solid([bx + 1.62, fy - 0.7, -8.6, bx + 2.25, fy + 1.05, 8.6]);
      }
      solid([-47, fy - 0.7, -9.5, X1 + 2, fy, 9.5]);
      if (fi === 1) {
        solid([-47, fy - 0.7, -8.6, -46.36, fy + 1.05, STAIR.z0 - 0.1]);
        solid([-47, fy - 0.7, STAIR.zb + 0.1, -46.36, fy + 1.05, 8.6]);
      } else solid([-47, fy - 0.7, -8.6, -46.36, fy + 1.05, 8.6]);
    }
  }
  // skylights
  for (const sx of [-84, -67, -50]) {
    air([sx - 2.6, 22, -2.6, sx + 2.6, 30, 2.6], (x, y, z) => Math.max(Math.hypot(x - sx, z - canyonZ(sx, 25)) - 2.6, 22 - y));
  }
}

/** The atrium's solid as a signed distance: negative inside concrete, positive in open air. */
export function gilderSDF(x, y, z) {
  let a = canyon(x, y, z);
  for (let i = 0; i < AIR.length; i++) {
    const s = AIR[i];
    if (x < s.x0 || x > s.x1 || y < s.y0 || y > s.y1 || z < s.z0 || z > s.z1) continue;
    a = smin(a, s.f(x, y, z), K);
  }
  let d = -a;
  if (y < d) d = y;
  for (let i = 0; i < SOLID.length; i++) {
    const s = SOLID[i];
    if (x < s.x0 || x > s.x1 || y < s.y0 || y > s.y1 || z < s.z0 || z > s.z1) continue;
    const v = boxd(x, y, z, s.b) - 0.06;
    if (v < d) d = v;
  }
  // outside the atrium's footprint everything is solid except the exact doorway prisms
  if (z < Z0 + 1 || z > Z1 - 1 || x > X1 - 1) {
    let pn = 1e9, ps = 1e9, pe = 1e9;
    for (let fi = 0; fi < 4; fi++) {
      const fy = FY[fi];
      pn = Math.min(pn, rrect(x - (NORTH_DOOR[0] + NORTH_DOOR[1]) / 2, y - (fy + 2.1), 3, 2.1, 0));
      ps = Math.min(ps, rrect(x - (SOUTH_DOOR[0] + SOUTH_DOOR[1]) / 2, y - (fy + 2.1), 3, 2.1, 0));
      pe = Math.min(pe, rrect(z, y - (fy + 2.15), 4, 2.15, 0));
    }
    d = Math.min(d, Math.max(z - Z0, -pn), Math.max(Z1 - z, -ps), Math.max(X1 - x, -pe));
  }
  return d;
}

// ---- surface nets ----
function polygonise(h) {
  // two extra layers on the capped sides (floor, north, south, east) so their boundary faces are generated
  const gx0 = X0 - h, gy0 = -2 * h, gz0 = Z0 - 2 * h;
  const nx = Math.ceil((X1 + 2 * h - gx0) / h) + 1, ny = Math.ceil((YT + h - gy0) / h) + 1, nz = Math.ceil((Z1 + 2 * h - gz0) / h) + 1;
  const F = new Float32Array(nx * ny * nz);
  const at = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F[at(i, j, k)] = gilderSDF(gx0 + i * h, gy0 + j * h, gz0 + k * h);
  const cell = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cat = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const P = [];
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { v[c] = F[at(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))]; if (v[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of EDGES) {
      if ((v[a] < 0) === (v[b] < 0)) continue;
      const t = v[a] / (v[a] - v[b]);
      sx += (a & 1) + ((b & 1) - (a & 1)) * t;
      sy += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t;
      sz += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t;
      n++;
    }
    cell[cat(i, j, k)] = P.length / 3;
    let py = Math.min(YT, gy0 + (j + sy / n) * h);
    for (const f of FY) if (Math.abs(py - f) < 0.17) py = f; // crisp junction between walls and floors
    P.push(
      Math.min(X1, Math.max(X0, gx0 + (i + sx / n) * h)),
      Math.max(0, py),
      Math.min(Z1, Math.max(Z0, gz0 + (k + sz / n) * h)));
  }
  const Q = [];
  const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) Q.push(a, d, c, b); else Q.push(a, b, c, d); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const f0 = F[at(i, j, k)];
    const fx = F[at(i + 1, j, k)], fy = F[at(i, j + 1, k)], fz = F[at(i, j, k + 1)];
    if ((f0 < 0) !== (fx < 0)) quad(cell[cat(i, j - 1, k - 1)], cell[cat(i, j, k - 1)], cell[cat(i, j, k)], cell[cat(i, j - 1, k)], f0 > 0);
    if ((f0 < 0) !== (fy < 0)) quad(cell[cat(i - 1, j, k - 1)], cell[cat(i - 1, j, k)], cell[cat(i, j, k)], cell[cat(i, j, k - 1)], f0 > 0);
    if ((f0 < 0) !== (fz < 0)) quad(cell[cat(i - 1, j - 1, k)], cell[cat(i, j - 1, k)], cell[cat(i, j, k)], cell[cat(i - 1, j, k)], f0 > 0);
  }
  return { P, Q };
}

const hash = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };

function buildRock(geo) {
  registerMat('gildrock', new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
  const { P, Q } = polygonise(0.42);
  const nv = P.length / 3;
  const N = new Float32Array(nv * 3), C = new Float32Array(nv * 3), flat = new Uint8Array(nv);
  const base = col(0xd8c6b0), floorC = col(0xb9b2a6);
  const e = 0.12;
  for (let i = 0; i < nv; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    let gx = gilderSDF(x + e, y, z) - gilderSDF(x - e, y, z);
    let gy = gilderSDF(x, y + e, z) - gilderSDF(x, y - e, z);
    let gz = gilderSDF(x, y, z + e) - gilderSDF(x, y, z - e);
    const l = Math.hypot(gx, gy, gz) || 1;
    gx /= l; gy /= l; gz /= l;
    N[i * 3] = gx; N[i * 3 + 1] = gy; N[i * 3 + 2] = gz;
    // cheap ambient occlusion: how much free air lies along the normal
    const ao = Math.max(0, Math.min(1, gilderSDF(x + gx * 1.3, y + gy * 1.3, z + gz * 1.3) / 1.3));
    const ao2 = Math.max(0, Math.min(1, gilderSDF(x + gx * 3.5, y + gy * 3.5, z + gz * 3.5) / 3.5));
    const up = false;
    flat[i] = FY.some((f) => Math.abs(y - f) < 1e-4) ? 1 : 0;
    const k = (0.34 + 0.36 * ao + 0.3 * ao2) * (0.95 + 0.1 * hash(Math.round(x * 2), Math.round(y * 2), Math.round(z * 2))) * (0.92 + 0.08 * Math.min(1, y / 22));
    const b = up ? floorC : base;
    C[i * 3] = b[0] * k; C[i * 3 + 1] = b[1] * k * (up ? 1 : 0.995); C[i * 3 + 2] = b[2] * k;
  }
  // split quads into floor (terrazzo) and wall (rock) buckets, dropping slivers flattened on the boundary
  const emit = (name, quads, uvFn, isFloor) => {
    const map = new Map();
    const pos = [], nor = [], uv = [], cl = [], idx = [];
    const vi = (i) => {
      let j = map.get(i);
      if (j === undefined) {
        j = pos.length / 3; map.set(i, j);
        pos.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
        if (isFloor) {
          nor.push(0, 1, 0);
          const k = Math.max(C[i * 3] / base[0], 0.55);
          cl.push(floorC[0] * k, floorC[1] * k, floorC[2] * k);
        } else {
          nor.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]);
          cl.push(C[i * 3], C[i * 3 + 1], C[i * 3 + 2]);
        }
        const t = uvFn(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); uv.push(t[0], t[1]);
      }
      return j;
    };
    for (let q = 0; q < quads.length; q += 4) {
      const a = vi(quads[q]), b = vi(quads[q + 1]), c = vi(quads[q + 2]), d = vi(quads[q + 3]);
      idx.push(a, b, c, a, c, d);
    }
    geo._push(name, new Float32Array(pos), new Float32Array(nor), new Float32Array(uv), new Float32Array(cl), new Uint32Array(idx));
  };
  const qf = [], qw = [];
  for (let q = 0; q < Q.length; q += 4) {
    const a = Q[q], b = Q[q + 1], c = Q[q + 2], d = Q[q + 3];
    const ux = P[c * 3] - P[a * 3], uy = P[c * 3 + 1] - P[a * 3 + 1], uz = P[c * 3 + 2] - P[a * 3 + 2];
    const vx = P[d * 3] - P[b * 3], vy = P[d * 3 + 1] - P[b * 3 + 1], vz = P[d * 3 + 2] - P[b * 3 + 2];
    if (Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) < 0.004) continue;
    const isF = flat[a] && flat[b] && flat[c] && flat[d] && P[a * 3 + 1] === P[b * 3 + 1] && P[a * 3 + 1] === P[c * 3 + 1] && P[a * 3 + 1] === P[d * 3 + 1]
      && (ux * vz - uz * vx) < 0; // facing up
    (isF ? qf : qw).push(a, b, c, d);
  }
  emit('terrazzo', qf, (x, y, z) => [x, z], true);
  emit('gildrock', qw, (x, y, z) => [x + z, y]);
  return { tris: (qf.length + qw.length) / 2 };
}

export function gilder(ctx) {
  const { geo, phys, lights, room } = ctx;
  define();
  buildRock(geo);

  geo.floor('terrazzo', X0, Z0, X1, Z1, -0.015, { color: 0x9a948a }); // underlay beneath the meshed floor
  // ---- collision and ground straight from the field ----
  phys.sdf(gilderSDF, X0, Z0 - 1, X1 + 1, Z1 + 1, -1, YT);
  phys.custom(X0, Z0 - 1, X1 + 1, Z1 + 1, (x, z, feet) => {
    for (let fi = 3; fi >= 0; fi--) {
      const fy = FY[fi];
      if (fy > feet + 0.55) continue;
      if (gilderSDF(x, fy + 0.4, z) > 0.04 && gilderSDF(x, fy - 0.2, z) < 0) return fy;
    }
    return -Infinity;
  });

  // ---- west front: the great window onto Columbus Avenue and Theodore Roosevelt Park ----
  const gxw = X0 + 0.06, steel = 0x6c6258;
  geo.wall('glassblue', gxw, 10, gxw, -10, 0, 27, { color: 0xcfe2f2 });
  for (let z = -10; z <= 10.01; z += 2.5) geo.box('metal', gxw - 0.04, 0, z - 0.05, gxw + 0.1, 27, z + 0.05, { color: steel });
  for (let y = 3.2; y < 27; y += 3.4) geo.box('metal', gxw - 0.04, y - 0.05, -10, gxw + 0.1, y + 0.05, 10, { color: steel });
  geo.box('metal', gxw - 0.05, 0, -2.6, gxw + 0.14, 2.9, 2.6, { color: 0x3c3a36, skip: 'x-' });
  phys.box(X0 - 0.5, Z0, X0 + 0.1, Z1, 0, YT);
  ctx.sign('COLUMBUS AVENUE · THEODORE ROOSEVELT PARK', gxw + 0.16, 3.25, 0, 90, 0.22, { color: '#5a5048', sans: true });
  lights.anchor(X0 + 5, 9, 0, { color: 0xeaf2ff, intensity: 70, dist: 40 });
  lights.anchor(X0 + 5, 20, 0, { color: 0xeaf2ff, intensity: 60, dist: 40 });

  // ---- skylights ----
  for (const sx of [-84, -67, -50]) {
    const zc = canyonZ(sx, 25);
    const disc = new THREE.CircleGeometry(2.7, 28);
    disc.rotateX(Math.PI / 2);
    geo.add('glow', disc, new THREE.Matrix4().makeTranslation(sx, 27.6, zc), [2.6, 2.7, 2.9]);
    lights.anchor(sx, 23.5, zc, { color: 0xfff6e6, intensity: 90, dist: 34 });
    lights.anchor(sx, 9, zc, { color: 0xfff0dc, intensity: 45, dist: 26 });
  }
  // gallery lighting: recessed discs along each side gallery
  for (let fi = 0; fi < 4; fi++) for (const s of [-1, 1]) for (let x = -90; x <= -44; x += 9.2) {
    const d = new THREE.CircleGeometry(0.34, 14);
    d.rotateX(Math.PI / 2);
    geo.add('glow', d, new THREE.Matrix4().makeTranslation(x, FY[fi] + 4.33, s * 11.3), [2.4, 2.2, 1.9]);
    if (Math.round((x + 90) / 9.2) % 2 === 0) lights.anchor(x, FY[fi] + 3.6, s * 11.3, { color: 0xffe9cc, intensity: 18, dist: 17 });
  }

  // ---- grand stair with bleacher seating, floor 1 to floor 2 ----
  const S = STAIR, run = S.x1 - S.x0, n = 36, tread = run / n, rise = 6.5 / n, stone = 0xddd0bd;
  for (let i = 0; i < n; i++) {
    const xa = S.x0 + i * tread;
    geo.box('terrazzo', xa, 0, S.z0, xa + tread, (i + 1) * rise, S.z1, { color: 0xc9c1b2, side: stone, skip: 'y-x+' });
  }
  phys.ramp(S.x0, S.z0, S.x1, S.z1, 0, 6.5, 'x');
  const tiers = 14, tr = run / tiers, th = 6.5 / tiers;
  for (let i = 0; i < tiers; i++) {
    const xa = S.x0 + i * tr, top = (i + 1) * th;
    geo.box('wood', xa, 0, S.z1, xa + tr, top, S.zb, { color: 0xc8a878, side: stone, skip: 'y-x+' });
    phys.floor(xa, S.z1, xa + tr, S.zb, top);
    if (top > 0.6) phys.box(xa, S.z0, xa + tr, S.zb, 0, top - 0.55);
    // a few visitors' cushions
    if (i % 3 === 1) geo.box('flat', xa + 0.2, top, S.z1 + 0.6 + (i % 2), xa + 0.75, top + 0.06, S.z1 + 1.3 + (i % 2), { color: 0x7a8f6a });
  }
  // glass guard between stair and open floor on the north side
  for (let i = 0; i < 6; i++) {
    const xa = S.x0 + i * run / 6, xb = S.x0 + (i + 1) * run / 6, ya = i * 6.5 / 6, yb = (i + 1) * 6.5 / 6;
    geo.quad('glass', [xa, ya, S.z0], [xb, yb, S.z0], [xb, yb + 1.05, S.z0], [xa, ya + 1.05, S.z0], { color: 0xd4e6ee });
    geo.quad('metal', [xa, ya + 1.03, S.z0 - 0.03], [xb, yb + 1.03, S.z0 - 0.03], [xb, yb + 1.08, S.z0 - 0.03], [xa, ya + 1.08, S.z0 - 0.03], { color: 0x8a7a5c });
  }
  phys.seg(S.x0 + 1.2, S.z0, S.x1, S.z0, 0.12, 0.6, 8);

  // ---- people-scale furniture and labels ----
  for (const [bx, bz, r] of [[-86, -3.2, 20], [-74, 3.4, -15], [-66, -3.6, 8]]) bench(ctx, bx, 0, bz, r, 2.4, 0xb89a70);
  ctx.placard({ id: 'gilderatrium', star: true, size: 0.9, title: 'Kenneth C. Griffin Exploration Atrium', sub: 'Richard Gilder Center · Studio Gang · 2023',
    text: 'A five-storey canyon that seems carved by wind and water. Its walls are shotcrete — structural concrete sprayed directly onto steel reinforcing and finished by hand, with no formwork — a technique invented in 1907 by Carl Akeley, the taxidermist whose African hall stands at the other end of the museum. The atrium makes some thirty connections between ten of the museum\'s buildings.',
    x: -88.2, y: 0, z: 2.4, face: 270, target: [-70, 12, 0], view: { x: -92.2, y: 0, z: 0.6, yaw: 90, pitch: 16 } });
  ctx.placard({ id: 'gilderbridges', title: 'Bridges and Overlooks', sub: 'Level 3',
    text: 'Bridges cross the canyon at every upper level, and arched openings in its walls look into the galleries, the Collections Core and the library, so that daylight from the skylights reaches deep into the building.',
    x: -83 + 1.15, y: FY[2], z: 3.2, face: 270, target: [-66, FY[2] - 2, 0], view: { x: -83, y: FY[2], z: 0.4, yaw: 90, pitch: -12 } });
  ctx.placard({ id: 'gilderstair', title: 'The Grand Staircase', sub: 'Stairs and seating steps to Level 2',
    text: 'One side is for climbing, the other for sitting: broad timber-lined steps that turn the staircase into an amphitheatre facing the park.',
    x: -61.2, y: 0, z: 4.4, face: 270, target: [-52, 3.5, 1], view: { x: -65.5, y: 0, z: 1.4, yaw: 92, pitch: 10 } });
  const names = [['INSECTARIUM', 'COLLECTIONS CORE'], ['BUTTERFLY VIVARIUM', 'COLLECTIONS CORE'], ['INVISIBLE WORLDS', 'COLLECTIONS CORE'], ['RESEARCH LIBRARY', 'ALCOVE GALLERY']];
  for (let fi = 0; fi < 4; fi++) {
    ctx.sign(names[fi][0], NORTH_DOOR[1] + 2.3, FY[fi] + 2.3, -13.36, 180, 0.2, { color: '#6a5a48', sans: true });
    ctx.sign(names[fi][1], SOUTH_DOOR[0] - 2.3, FY[fi] + 2.3, 13.36, 0, 0.2, { color: '#6a5a48', sans: true });
  }
  ctx.view('main', -92.2, 0, 0.6, 90, 14);
  ctx.view('L1', -92.2, 0, 0.6, 90, 14);
  ctx.view('L2', -69, FY[1], 0.2, 90, 6);
  ctx.view('L3', -83, FY[2], 0.3, 90, -10);
  ctx.view('L4', -76, FY[3], 0.2, 90, -22);
  void room;
}
