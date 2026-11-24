// Rose Center for Earth and Space: the glass cube, Hayden Sphere, Scales of the Universe,
// Heilbrunn Cosmic Pathway, Cullman Hall of the Universe; plus the Hall of Planet Earth and link galleries.
import * as THREE from 'three';
import { xform, shade } from '../../engine/builder.js';
import { registerMat } from '../../engine/materials.js';
import { makeCanvas } from '../../engine/textures.js';
import { textPanel, picture } from '../../engine/placards.js';
import { solids } from '../rooms.js';
import { railing, blob, bench, pedestal, vitrine, island } from '../furniture.js';
import { lump } from '../../models/rocks.js';
import { rod, ellipsoid } from '../../models/loft.js';

const CX = 51, CZ = -64, R = 13.25, CY = 11.5;

function sphereMaterial() {
  const c = makeCanvas(512, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#eef0f2'; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = 'rgba(120,130,145,0.3)'; g.lineWidth = 1;
  for (let i = 0; i <= 48; i++) { g.beginPath(); g.moveTo(i * 512 / 48, 0); g.lineTo(i * 512 / 48, 256); g.stroke(); }
  for (let j = 0; j <= 24; j++) { g.beginPath(); g.moveTo(0, j * 256 / 24); g.lineTo(512, j * 256 / 24); g.stroke(); }
  // faint perforation speckle
  for (let i = 0; i < 6000; i++) { g.fillStyle = 'rgba(150,160,175,0.25)'; g.fillRect(Math.random() * 512, Math.random() * 256, 1, 1); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return registerMat('hayden', new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.15, vertexColors: true }));
}

function planetTex(name, paint) {
  const c = makeCanvas(256, 128);
  paint(c.getContext('2d'), 256, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return registerMat('planet:' + name, new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, vertexColors: true }));
}
function bands(cols) {
  return (g, w, h) => {
    for (let y = 0; y < h; y++) {
      const t = y / h * (cols.length - 1), i = Math.floor(t), f = t - i;
      const a = cols[i], b = cols[Math.min(cols.length - 1, i + 1)];
      const wob = Math.sin(y * 0.9) * 0.08;
      const mixc = (k) => Math.round(a[k] + (b[k] - a[k]) * Math.min(1, Math.max(0, f + wob)));
      g.fillStyle = `rgb(${mixc(0)},${mixc(1)},${mixc(2)})`;
      g.fillRect(0, y, w, 1);
    }
  };
}

export function rose(ctx) {
  const { room, geo, phys, lights, W } = ctx;
  const { x0, x1, z0, z1 } = room;
  const yL = room.y, y1 = 0, y2 = 6.5, y3 = 13, yT = room.y + room.h;
  const white = 0xe9eaec;

  // ---------------- envelope ----------------
  geo.floor('terrazzo', x0, z0, x1, z1, yL, { color: 0x3c3e44 });
  phys.floor(x0, z0, x1, z1, yL);
  // solid south wall, and east wall with doorways to the museum
  geo.wall('plaster', x1, z1, x0, z1, yL, yT, { cBot: shade(white, 0.7), cTop: white });
  phys.box(x0, z1, x1, z1 + 0.4, yL, yT);
  const ops = W.portals.filter((p) => p.axis === 'x' && Math.abs(p.x0 - x1) < 0.05 && p.z1 > z0 && p.z0 < z1).map((p) => ({ a: p.z0, b: p.z1, ya: p.y, yb: p.y + p.h }));
  for (const [a, b, ya, yb] of solids(z0, z1, yL, yT, ops)) {
    geo.wall('plaster', x1, a, x1, b, ya, yb, { cBot: shade(white, 0.75), cTop: white });
    phys.box(x1, a, x1 + 0.4, b, ya, yb);
  }
  // glass curtain walls north and west, on a truss grid
  const glassCol = 0xbcd8ee, steel = 0x9aa2ac;
  geo.wall('glassblue', x0, z0, x1, z0, y1, yT, { color: glassCol });
  geo.wall('glassblue', x0, z1, x0, z0, y1, yT, { color: glassCol });
  geo.wall('plaster', x0, z0, x1, z0, yL, y1, { color: 0x2c2e34 });
  geo.wall('plaster', x0, z1, x0, z0, yL, y1, { color: 0x2c2e34 });
  phys.box(x0, z0 - 0.4, x1, z0, yL, yT);
  phys.box(x0 - 0.4, z0, x0, z1, yL, yT);
  const bay = (x1 - x0) / 8;
  for (let i = 0; i <= 8; i++) {
    geo.box('metal', x0 + i * bay - 0.06, y1, z0 + 0.02, x0 + i * bay + 0.06, yT, z0 + 0.5, { color: steel });
    geo.box('metal', x0 + 0.02, y1, z0 + i * bay - 0.06, x0 + 0.5, yT, z0 + i * bay + 0.06, { color: steel });
  }
  for (let j = 1; j <= 5; j++) {
    const yy = y1 + j * (yT - y1) / 6;
    geo.box('metal', x0, yy - 0.05, z0 + 0.03, x1, yy + 0.05, z0 + 0.14, { color: steel });
    geo.box('metal', x0 + 0.03, yy - 0.05, z0, x0 + 0.14, yy + 0.05, z1, { color: steel });
  }
  // roof with space-frame
  geo.ceil('plaster', x0, z0, x1, z1, yT, { color: 0xdfe3e8 });
  for (let i = 0; i <= 8; i++) {
    geo.box('metal', x0 + i * bay - 0.08, yT - 1.1, z0, x0 + i * bay + 0.08, yT - 0.9, z1, { color: steel });
    geo.box('metal', x0, yT - 1.1, z0 + i * bay - 0.08, x1, yT - 0.9, z0 + i * bay + 0.08, { color: steel });
  }
  // 81st Street doors (north, closed)
  geo.box('metal', CX - 2.4, y1, z0 + 0.03, CX + 2.4, y1 + 3, z0 + 0.12, { color: 0x6c7480 });
  ctx.sign('WEST 81ST STREET', CX, y1 + 3.4, z0 + 0.16, 180, 0.24, { color: '#e9eef4', sans: true });

  // ---------------- floor 1 plate with the round opening ----------------
  const VR = 12.5;
  const mkPlate = (flip) => {
    const s = new THREE.Shape();
    const k = flip ? -1 : 1; // top face uses (x, -z)
    const pts = [[x0, z0], [x1, z0], [x1, z1], [49, z1], [49, z1 - 2.6], [36, z1 - 2.6], [36, z1], [x0, z1]];
    pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1] * k) : s.moveTo(p[0], p[1] * k)));
    s.closePath();
    const h = new THREE.Path();
    h.absarc(CX, CZ * k, VR, 0, Math.PI * 2, flip);
    s.holes.push(h);
    const gm = new THREE.ShapeGeometry(s, 48);
    gm.rotateX(flip ? -Math.PI / 2 : Math.PI / 2);
    return gm;
  };
  geo.add('terrazzo', mkPlate(true), xform(0, y1, 0), 0x8d9096);
  geo.add('plaster', mkPlate(false), xform(0, y1 - 0.5, 0), 0xcfd3d8);
  const rim = new THREE.CylinderGeometry(VR, VR, 0.5, 64, 1, true);
  geo.add('flat_ds', rim, xform(CX, y1 - 0.25, CZ), 0xd9dde2);
  phys.custom(x0, z0, x1, z1, (x, z) => {
    if (Math.hypot(x - CX, z - CZ) < VR) return -Infinity;
    if (x > 36 && x < 49 && z > z1 - 2.6) return -Infinity;
    return y1;
  });
  // glass guard round the opening
  const guard = new THREE.CylinderGeometry(VR - 0.05, VR - 0.05, 1.1, 64, 1, true);
  geo.add('glass', guard, xform(CX, y1 + 0.55, CZ), 0xd0e4f0);
  const torus = new THREE.TorusGeometry(VR - 0.05, 0.035, 6, 80);
  torus.rotateX(Math.PI / 2);
  geo.add('metal', torus, xform(CX, y1 + 1.1, CZ), steel);
  phys.cyl(CX, CZ, VR - 0.1, y1 - 0.3, y1 + 1.4);
  // stair down to the Hall of the Universe along the south wall
  const sn = 40, srun = 13 / sn, srise = 6.5 / sn;
  for (let i = 0; i < sn; i++) {
    const xa = 49 - (i + 1) * srun, ty = y1 - (i + 1) * srise;
    geo.box('terrazzo', xa, yL, z1 - 2.6, xa + srun, ty + srise, z1, { color: 0x6c7078, top: 0x8d9096, skip: 'y-' });
    if (i % 4 === 3) phys.box(xa, z1 - 2.6, xa + srun * 4, z1, yL, ty - 0.2);
  }
  phys.ramp(36, z1 - 2.6, 49, z1, yL, y1, 'x');
  railing(ctx, [[36, z1], [36, z1 - 2.6], [49, z1 - 2.6]], y1, { glass: true, mat: 'metal', color: steel });

  // ---------------- Hayden Sphere ----------------
  sphereMaterial();
  geo.add('hayden', new THREE.SphereGeometry(R, 64, 40), xform(CX, CY, CZ), 0xffffff);
  phys.cyl(CX, CZ, R + 0.05, 4.4, yT);
  for (let k = 0; k < 3; k++) {
    for (const d of [-0.16, 0.16]) {
      const a = k * Math.PI * 2 / 3 + 0.5 + d;
      const bx = CX + Math.cos(a) * 10.6, bz = CZ + Math.sin(a) * 10.6;
      const tx = CX + Math.cos(a - d * 0.5) * 9.6, tz = CZ + Math.sin(a - d * 0.5) * 9.6;
      geo.add('satin', rod([bx, yL, bz], [tx, CY - 9.0, tz], 0.26, 0.42, { seg: 10 }), null, 0xdfe2e6);
      geo.cyl('satin', bx, yL, bz, 0.5, 0.25, { color: 0xbfc4ca, seg: 12 });
      phys.cyl(bx, bz, 0.55, yL, yL + 3);
    }
  }
  // soft underlighting of the sphere
  lights.anchor(CX, yL + 3.2, CZ, { color: 0x9fc4ff, intensity: 120, dist: 30 });
  lights.anchor(CX - 14, y2 + 5, CZ - 14, { color: 0xeaf2ff, intensity: 150, dist: 40 });
  lights.anchor(CX + 13, y2 + 5, CZ - 14, { color: 0xeaf2ff, intensity: 120, dist: 40 });
  lights.anchor(CX - 14, y2 + 5, CZ + 13, { color: 0xeaf2ff, intensity: 120, dist: 40 });
  lights.anchor(CX + 12, y1 + 3, CZ + 14, { color: 0xfff0dc, intensity: 60, dist: 26 });
  lights.anchor(CX - 12, yL + 3.6, CZ + 12, { color: 0xcfe0ff, intensity: 50, dist: 24 });
  lights.anchor(CX + 12, yL + 3.6, CZ - 12, { color: 0xcfe0ff, intensity: 50, dist: 24 });

  // ---------------- Scales of the Universe walkway (floor 2) ----------------
  const ww = 3.5;
  const strips = [[x0, z0, x0 + ww, z1], [x1 - ww, z0, x1, z1], [x0 + ww, z0, x1 - ww, z0 + ww], [x0 + ww, z1 - ww, x1 - ww, z1]];
  for (const s of strips) {
    geo.box('terrazzo', s[0], y2 - 0.4, s[1], s[2], y2, s[3], { color: 0x9a9da3, bottom: 0xcfd3d8, side: 0xd9dde2 });
    phys.floor(s[0], s[1], s[2], s[3], y2);
  }
  const ix0 = x0 + ww, ix1 = x1 - ww, iz0 = z0 + ww, iz1 = z1 - ww;
  const rg = { glass: true, mat: 'metal', color: steel };
  railing(ctx, [[CX - 1.5, iz0], [ix0, iz0], [ix0, iz1], [ix1, iz1], [ix1, CZ + 5.0]], y2, rg);
  railing(ctx, [[ix1, CZ - 3.3], [ix1, iz0], [CX + 1.5, iz0]], y2, rg);
  // bridge to the Big Bang Theater in the lower half of the sphere
  const bz1 = CZ - Math.sqrt(R * R - (CY - y2) ** 2) + 0.4;
  geo.box('terrazzo', CX - 1.5, y2 - 0.4, iz0, CX + 1.5, y2, bz1, { color: 0x9a9da3, bottom: 0xcfd3d8, side: 0xd9dde2 });
  phys.floor(CX - 1.5, iz0, CX + 1.5, bz1, y2);
  railing(ctx, [[CX - 1.5, iz0], [CX - 1.5, bz1 - 0.3]], y2, rg);
  railing(ctx, [[CX + 1.5, iz0], [CX + 1.5, bz1 - 0.3]], y2, rg);
  geo.box('flat', CX - 1.1, y2, bz1 - 0.5, CX + 1.1, y2 + 2.6, bz1 + 0.4, { color: 0x101218 });
  phys.box(CX - 1.5, bz1 - 0.3, CX + 1.5, bz1 + 1, y2, y2 + 3);
  ctx.sign('BIG BANG THEATER', CX, y2 + 3.0, bz1 - 0.52, 180, 0.24, { color: '#ffffff', sans: true, bright: true });
  ctx.placard({ id: 'bigbang', title: 'Big Bang Theater', sub: 'Lower half of the Hayden Sphere',
    text: 'A four-minute presentation of the first moments of the universe, projected into an eight-foot bowl beneath your feet. Visitors exit onto the Cosmic Pathway.',
    x: CX + 2.3, y: y2, z: iz0 - 0.8, face: 180, target: [CX, y2 + 4, CZ - 9], view: { x: CX, y: y2, z: z0 + 1.2, yaw: 180, pitch: 14 } });

  // hanging planets, to scale with the sphere as the Sun
  const planets = [
    ['Jupiter', 1.37, [x0 + 7.2, y2 + 4.6, z0 + 7.2], bands([[196, 160, 120], [222, 200, 170], [170, 120, 90], [230, 214, 190], [190, 140, 100], [214, 190, 160], [160, 120, 100]])],
    ['Saturn', 1.15, [x1 - 7.6, y2 + 4.4, z0 + 7.4], bands([[214, 196, 150], [230, 214, 170], [200, 176, 130], [224, 206, 160], [196, 170, 126]])],
    ['Uranus', 0.5, [x0 + 6.6, y2 + 3.6, z1 - 9.5], bands([[170, 220, 226], [186, 228, 232], [170, 216, 224]])],
    ['Neptune', 0.48, [x0 + 9.6, y2 + 3.2, z1 - 6.4], bands([[60, 96, 200], [80, 120, 220], [56, 90, 190]])],
    ['Earth', 0.125, [x0 + 4.4, y2 + 1.9, CZ + 3], bands([[240, 244, 248], [60, 110, 190], [70, 140, 90], [56, 104, 186], [240, 244, 248]])],
    ['Venus', 0.118, [x0 + 4.4, y2 + 1.9, CZ + 1], bands([[226, 200, 150], [236, 214, 170], [220, 190, 140]])],
    ['Mars', 0.066, [x0 + 4.4, y2 + 1.9, CZ - 1], bands([[190, 100, 70], [206, 120, 80], [180, 96, 66]])],
    ['Mercury', 0.048, [x0 + 4.4, y2 + 1.9, CZ - 3], bands([[150, 146, 140], [170, 166, 160]])],
  ];
  for (const [name, r, p, paint] of planets) {
    planetTex(name, paint);
    geo.add('planet:' + name, new THREE.SphereGeometry(r, 28, 18), xform(p[0], p[1], p[2], 0.4), 0xffffff);
    geo.add('metal', rod([p[0], p[1] + r, p[2]], [p[0], yT - 1, p[2]], 0.012, 0.012, { seg: 4 }), null, 0x8a9098);
    if (name === 'Saturn') {
      const ring = new THREE.RingGeometry(r * 1.25, r * 2.25, 48, 1);
      ring.rotateX(-Math.PI / 2 + 0.42);
      geo.add('flat_ds', ring, xform(p[0], p[1], p[2]), 0xcdbb94);
    }
  }
  ctx.placard({ id: 'scales', star: true, title: 'Scales of the Universe', sub: 'A 400-foot walk through the powers of ten',
    text: 'The Hayden Sphere is the yardstick. If the sphere were the Sun, the planets would be the models hanging here — Jupiter nine feet across, Earth the size of a grapefruit. Around the walkway the comparison steps up to galaxies and down to atoms.',
    x: x0 + ww - 0.7, y: y2, z: z0 + 10.5, face: 90, target: [x0 + 7.2, y2 + 4.6, z0 + 7.2], view: { x: x0 + 1.6, y: y2, z: z0 + 14.5, yaw: 40, pitch: 22 } });
  ctx.placard({ title: 'Saturn', sub: 'Model, with rings 17 feet across', text: 'At this scale Saturn\'s rings would just about span a city bus; the planet itself would float in water.', x: x1 - ww + 0.7, y: y2, z: z0 + 11, face: 270, target: [x1 - 7.6, y2 + 4.4, z0 + 7.4] });
  ctx.placard({ title: 'The Rocky Planets', sub: 'Mercury, Venus, Earth, Mars', text: 'With the sphere as the Sun, Earth is 10 inches across and would orbit nearly two miles away.', x: x0 + ww - 0.7, y: y2, z: CZ + 4.6, face: 90, target: [x0 + 4.4, y2 + 1.9, CZ] });

  // ---------------- Heilbrunn Cosmic Pathway: spiral ramp from floor 2 to floor 1 ----------------
  const r0 = 13.7, r1 = 16.3, a0 = 0, a1 = Math.PI * 2.4;
  phys.spiral(CX, CZ, r0, r1, a0, a1, y2, y1);
  phys.ring(CX, CZ, r0, r1, y2, -0.3, 0.001);
  const NS = 110;
  const hAt = (a) => y2 + (y1 - y2) * Math.max(0, Math.min(1, (a - a0) / (a1 - a0)));
  const P = (a, r, y) => [CX + Math.cos(a) * r, y, CZ + Math.sin(a) * r];
  for (let i = -3; i < NS; i++) {
    const aa = a0 + (a1 - a0) * i / NS, ab = a0 + (a1 - a0) * (i + 1) / NS;
    const ha = hAt(aa), hb = hAt(ab);
    const ia = P(aa, r0, ha), oa = P(aa, r1, ha), ib = P(ab, r0, hb), ob = P(ab, r1, hb);
    geo.quad('terrazzo', ia, ib, ob, oa, { color: 0x3a3c44 });
    const d = 0.3;
    geo.quad('plaster', [ia[0], ia[1] - d, ia[2]], [oa[0], oa[1] - d, oa[2]], [ob[0], ob[1] - d, ob[2]], [ib[0], ib[1] - d, ib[2]], { color: 0xdfe3e8 });
    geo.quad('plaster', [ia[0], ia[1] - d, ia[2]], [ib[0], ib[1] - d, ib[2]], ib, ia, { color: 0xe9ecef });
    geo.quad('plaster', [ob[0], ob[1] - d, ob[2]], [oa[0], oa[1] - d, oa[2]], oa, ob, { color: 0xe9ecef });
    // glass guards (outer guard left open where the path meets the walkway)
    const open = aa < 0.31;
    geo.quad('glass', ia, ib, [ib[0], ib[1] + 1.1, ib[2]], [ia[0], ia[1] + 1.1, ia[2]], { color: 0xd0e4f0 });
    phys.seg(ia[0], ia[2], ib[0], ib[2], 0.12, Math.min(ha, hb) - 0.3, Math.max(ha, hb) + 1.4);
    if (!open) {
      geo.quad('glass', oa, ob, [ob[0], ob[1] + 1.1, ob[2]], [oa[0], oa[1] + 1.1, oa[2]], { color: 0xd0e4f0 });
      phys.seg(oa[0], oa[2], ob[0], ob[2], 0.12, Math.min(ha, hb) - 0.3, Math.max(ha, hb) + 1.4);
    }
    // where the ramp is low, wall it in so nobody on floor 1 walks under it
    if (hb < y1 + 2.4 && hb > y1 + 0.2) {
      geo.quad('plaster', [ia[0], y1, ia[2]], [ib[0], y1, ib[2]], [ib[0], ib[1] - d, ib[2]], [ia[0], ia[1] - d, ia[2]], { color: 0xdfe3e8 });
      geo.quad('plaster', [ob[0], y1, ob[2]], [oa[0], y1, oa[2]], [oa[0], oa[1] - d, oa[2]], [ob[0], ob[1] - d, ob[2]], { color: 0xdfe3e8 });
      phys.seg(ia[0], ia[2], ib[0], ib[2], 0.12, y1 - 0.2, hb - 0.25);
      phys.seg(oa[0], oa[2], ob[0], ob[2], 0.12, y1 - 0.2, hb - 0.25);
    }
    // timeline markers along the outer rail
    if (i >= 0 && i % 11 === 5) {
      const am = (aa + ab) / 2, hm = (ha + hb) / 2;
      const m = P(am, r1 - 0.12, hm + 0.75);
      const bya = (13.0 * (1 - (am - a0) / (a1 - a0))).toFixed(1);
      const face = (Math.atan2(-Math.cos(am), Math.sin(am)) * 180 / Math.PI + 360) % 360; // facing inward
      textPanel(ctx, { x: m[0], y: m[1], z: m[2], face, w: 1.3, h: 0.5, heading: `${bya} billion years ago`, bg: '#14161c', fg: '#e9eef6', headSize: 96, pad: 60, unlit: true });
    }
  }
  // end cap rail at the top landing
  const e0 = P(-0.3 * (a1 - a0) / NS * 10, r0, y2), e1 = P(-0.3 * (a1 - a0) / NS * 10, r1, y2);
  railing(ctx, [[e0[0], e0[2]], [e1[0], e1[2]]], y2, rg);
  ctx.placard({ id: 'cosmicpathway', star: true, title: 'Heilbrunn Cosmic Pathway', sub: '13 billion years in 360 feet',
    text: 'A spiral ramp from the Big Bang to today. An average stride covers 75 million years; the age of the dinosaurs is the last few steps, and all of recorded human history is the width of one human hair at the end.',
    x: CX + r0 + 0.6, y: y2, z: CZ - 1.9, face: 0, target: [CX + 4, y2 - 1.5, CZ + 14], view: { x: ix1 + 1.4, y: y2, z: CZ - 5.5, yaw: 196, pitch: -8 } });

  // ---------------- floor 3: Space Theater platform ----------------
  geo.box('terrazzo', 60, y3 - 0.4, -57, x1, y3, z1, { color: 0x9a9da3, bottom: 0xcfd3d8, side: 0xd9dde2 });
  phys.floor(60, -57, x1, z1, y3);
  railing(ctx, [[60, z1], [60, -57], [x1, -57]], y3, rg);
  geo.rbox('flat', CX + 9.0, y3, CZ + 9.0, 2.6, 2.7, 0.5, Math.PI / 4, { color: 0x101218 });
  ctx.sign('SPACE THEATER', CX + 8.75, y3 + 3.2, CZ + 8.75, 135, 0.3, { color: '#ffffff', sans: true, bright: true });
  ctx.placard({ id: 'spacetheater', title: 'Hayden Planetarium Space Theater', sub: 'Upper half of the Hayden Sphere',
    text: 'A 429-seat dome theatre whose Zeiss star projector and digital dome system fly audiences through a three-dimensional atlas of the observable universe.',
    x: 63, y: y3, z: -52, face: 135, target: [CX, y3 + 5, CZ], view: { x: 66.5, y: y3, z: -48.5, yaw: 318, pitch: 16 } });
  ctx.view('L3', 67.5, y3, -49.5, 315, 12);

  // ---------------- Cullman Hall of the Universe (lower level) ----------------
  // Willamette Meteorite
  const wx = 40.5, wz = -55;
  island(ctx, wx - 2.4, wz - 1.8, wx + 2.4, wz + 1.8, yL, 0.3, 0x24262a);
  geo.add('iron', lump(1.55, 0.72, 1.0, { seed: 5, detail: 4, rough: 0.34, pits: 1.3, flatBottom: 0.7 }), xform(wx, yL + 0.3 + 0.52, wz, 0.3), 0x54483e);
  blob(geo, wx, yL + 0.3, wz, 2.0, 1.4);
  ctx.placard({ id: 'willamette', star: true, title: 'Willamette Meteorite', sub: 'Iron meteorite — 15.5 tons — Oregon',
    text: 'The largest meteorite ever found in the United States, the iron core of a shattered planet. Its deep basins were eaten out by centuries of Oregon rain. To the Clackamas it is Tomanowos, a sacred visitor from the Sky People; under a 2000 agreement the Confederated Tribes of Grand Ronde hold a ceremony with it here each year.',
    x: wx + 3.1, y: yL, z: wz + 1.2, face: 90, size: 0.9, target: [wx, yL + 1, wz], view: { x: wx + 6.5, y: yL, z: wz + 3, yaw: 245, pitch: 0 } });
  // AstroBulletin screen and zone titles
  picture(ctx, { x: 58, y: yL + 3.4, z: z1, face: 0, w: 8.2, h: 4.1, unlit: true }, (g, w, h) => {
    g.fillStyle = '#04060c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6); }
    const rg2 = g.createRadialGradient(w * 0.5, h * 0.5, 4, w * 0.5, h * 0.5, h * 0.42);
    rg2.addColorStop(0, 'rgba(255,240,210,0.95)'); rg2.addColorStop(0.25, 'rgba(170,150,255,0.5)'); rg2.addColorStop(1, 'rgba(60,40,120,0)');
    g.save(); g.translate(w * 0.5, h * 0.5); g.scale(1.9, 0.75); g.translate(-w * 0.5, -h * 0.5); g.fillStyle = rg2; g.fillRect(0, 0, w, h); g.restore();
    g.fillStyle = '#e9eef6'; g.font = '600 44px Helvetica, Arial, sans-serif'; g.fillText('ASTROBULLETIN', 40, 70);
  });
  const zones = [['UNIVERSE', x0 + 0.02, CZ - 8, 90], ['GALAXIES', x0 + 0.02, CZ + 8, 90], ['STARS', CX - 6, z0 + 0.02, 180], ['PLANETS', CX + 8, z0 + 0.02, 180]];
  for (const [t, zx, zz, f] of zones) ctx.sign(t, zx, yL + 4.4, zz, f, 0.5, { color: '#cfe0ff', sans: true });
  // Ecosphere
  const ey = pedestal(ctx, 62, yL, -76, 0.9, 0.9, 1.0, 0x24262a);
  geo.add('glassblue', new THREE.SphereGeometry(0.45, 20, 14), xform(62, ey + 0.45, -76), 0xbfe6f0);
  geo.add('flat', ellipsoid([0, 0, 0], [0.3, 0.12, 0.3]), xform(62, ey + 0.2, -76), 0x4a7a3a);
  ctx.placard({ title: 'Ecosphere', sub: 'A sealed world of shrimp, algae and bacteria', text: 'Nothing but light has entered this glass globe since it was sealed — a small model of a living planet.', x: 62, y: yL, z: -74.9, face: 0, target: [62, yL + 1.5, -76] });
  for (const [bx, bz] of [[44, -74], [58, -52]]) bench(ctx, bx, yL, bz, 30, 2.2, 0x2a2c30);
  ctx.placard({ title: 'Cullman Hall of the Universe', sub: 'Beneath the Hayden Sphere', text: 'Four zones — Universe, Galaxies, Stars and Planets — on the floor of the glass cube, looking up at the underside of the 87-foot sphere on its three pairs of legs.', x: 52, y: yL, z: z1 - 4.4, face: 180, list: false });
  ctx.placard({ id: 'haydensphere', star: true, title: 'Hayden Sphere', sub: '87 feet in diameter · James Polshek and Todd Schliemann, 2000',
    text: 'An aluminium-clad sphere that seems to float inside a 95-foot cube of clear glass. The upper half is the Space Theater, the lower half the Big Bang Theater; the whole 4-million-pound ball stands on just three pairs of tapered legs.',
    x: 60.5, y: y1, z: -47.6, face: 180, size: 0.9, target: [CX, CY, CZ], view: { x: 64.5, y: y1, z: -47.8, yaw: 318, pitch: 30 } });

  ctx.view('main', 35.2, y1, -79.8, 135, 24);
  ctx.view('L1', 35.2, y1, -79.8, 135, 24);
  ctx.view('L2', x1 - 1.6, y2, -51, 300, 8);
  ctx.view('LLL', 45.5, yL, -50, 20, 38);
}

// ---------------------------------------------------------------------------
export function planetearth(ctx) {
  const { room, geo, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  const cx = (x0 + x1) / 2;
  // dynamic Earth globe over a granite amphitheatre
  const gz = -68;
  for (let i = 0; i < 3; i++) {
    const r = 5.2 - i * 0.9;
    geo.cyl('rock', cx, y + i * 0.35, gz, r, 0.35, { color: 0x5a5856, seg: 40 });
  }
  geo.cyl('flat', cx, y + 0.9, gz, 2.4, 0.2, { color: 0x1a1a1c, seg: 30 });
  ctx.phys.cyl(cx, gz, 5.2, y, y + 1.4);
  planetTex('earth', (g, w, h) => {
    g.fillStyle = '#20508a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3f7a44';
    for (const [ex, ey, rx, ry] of [[60, 50, 26, 22], [78, 86, 12, 22], [140, 44, 34, 20], [150, 80, 14, 20], [200, 90, 12, 8], [128, 30, 40, 10]]) { g.beginPath(); g.ellipse(ex, ey, rx, ry, 0.3, 0, 6.3); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.fillRect(0, 0, w, 9); g.fillRect(0, h - 10, w, 10);
    for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(Math.random() * w, 20 + Math.random() * 88, 12 + Math.random() * 14, 3, 0, 0, 6.3); g.fill(); }
  });
  geo.add('planet:earth', new THREE.SphereGeometry(1.25, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.52), xform(cx, y + 3.9, gz), [1.5, 1.5, 1.5]);
  lights.anchor(cx, y + 4.4, gz + 3, { color: 0xbcd8ff, intensity: 36, dist: 18 });
  ctx.placard({ id: 'earthglobe', title: 'Dynamic Earth Globe', sub: 'Our planet as seen from space', text: 'A hemisphere eight feet across onto which satellite images are projected from within, so that clouds, vegetation and ocean currents sweep across it as they would from orbit.', x: cx + 5.9, y, z: gz + 1.5, face: 90, target: [cx, y + 3.6, gz] });

  // rock specimens: each is a chapter of how the Earth works
  const rocks = [
    { id: 'blacksmokers', star: true, t: 'Black Smokers', s: 'Sulfide chimneys — Juan de Fuca Ridge, 7,000 feet down', x: x1 - 6, z: -36, kind: 'smoker',
      text: 'Chimneys of metal sulfides that grew around scalding hydrothermal vents on the Pacific floor, raised by a Museum expedition in 1998. Whole ecosystems live around such vents without sunlight.' },
    { t: 'Banded Iron Formation', s: 'Ontario — 2.7 billion years old', x: x0 + 6, z: -34, col: 0x8a3a30, rx: 1.3, ry: 0.9, rz: 0.9, band: true,
      text: 'Rust-red layers laid down as the first oxygen from photosynthesis stripped dissolved iron out of the ancient seas.' },
    { t: 'Folded Gneiss', s: 'Adirondack Mountains, New York', x: x0 + 6, z: -48, col: 0x7a7c80, rx: 1.1, ry: 1.0, rz: 0.8,
      text: 'Rock squeezed and folded like taffy deep within a mountain belt a billion years ago.' },
    { t: 'Kilauea Lava', s: 'Pahoehoe basalt — Hawaii', x: x1 - 6, z: -52, col: 0x26262a, rx: 1.4, ry: 0.45, rz: 1.1,
      text: 'Ropy basalt, poured out and frozen within the lifetime of the people who collected it.' },
    { t: 'Jack Hills Zircon Rock', s: 'Western Australia — grains up to 4.3 billion years old', x: x0 + 6, z: -80, col: 0x9a8a72, rx: 0.9, ry: 0.7, rz: 0.8,
      text: 'A conglomerate containing crystals of zircon that are the oldest known pieces of the Earth.' },
    { t: 'Stromatolite', s: 'Fossil microbial reef — Mauritania', x: x1 - 6, z: -78, col: 0xa08a6a, rx: 1.1, ry: 0.8, rz: 0.9,
      text: 'Layered mounds built by mats of bacteria, the dominant life on Earth for two billion years.' },
  ];
  rocks.forEach((r, i) => {
    island(ctx, r.x - 1.9, r.z - 1.5, r.x + 1.9, r.z + 1.5, y, 0.35, 0x1c1c1e);
    if (r.kind === 'smoker') {
      for (const [dx, dz, h, w] of [[-0.6, 0.2, 3.4, 0.5], [0.4, -0.3, 2.6, 0.42], [0.9, 0.5, 1.8, 0.34], [-0.1, 0.7, 1.2, 0.3]]) {
        geo.add('rock', lump(w, h / 2, w, { seed: i * 7 + dx * 10, detail: 2, rough: 0.5 }), xform(r.x + dx, y + 0.35 + h / 2, r.z + dz), 0x2c2a2a);
      }
    } else {
      geo.add('rock', lump(r.rx, r.ry, r.rz, { seed: i + 2, detail: 3, rough: 0.3, flatBottom: 0.75 }), xform(r.x, y + 0.35 + r.ry * 0.75, r.z, i), r.col);
      if (r.band) for (let k = 0; k < 4; k++) geo.add('rock', lump(r.rx * 1.01, 0.05, r.rz * 1.01, { seed: k, detail: 2, rough: 0.2 }), xform(r.x, y + 0.6 + k * 0.32, r.z, i), 0x4a4a50);
    }
    lights.anchor(r.x, y + 4.6, r.z, { color: 0xffe2b8, intensity: 22, dist: 11 });
    const west = r.x < cx;
    ctx.placard({ id: r.id, star: r.star, title: r.t, sub: r.s, text: r.text, x: r.x + (west ? 2.4 : -2.4), y, z: r.z + 0.6, face: west ? 90 : 270, target: [r.x, y + 1.6, r.z] });
  });
  // Grand Canyon section along the east wall
  picture(ctx, { x: x1, y: y + 2.8, z: -64, face: 270, w: 9, h: 3.6 }, (g, w, h) => {
    const cols = ['#c9a27a', '#b9805a', '#d8b78c', '#9a5a44', '#c89a6a', '#7a4a3c', '#b08a66', '#5a4a44'];
    let yy = 0;
    cols.forEach((c, i) => { const hh = h / cols.length * (0.7 + (i * 37 % 10) / 14); g.fillStyle = c; g.fillRect(0, yy, w, hh + 2); yy += hh; });
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 300; i++) g.fillRect(Math.random() * w, Math.random() * h, 30 + Math.random() * 60, 1.5);
    g.fillStyle = '#f1e8d8'; g.font = '600 36px Georgia, serif'; g.fillText('Grand Canyon: 1.7 billion years, layer by layer', 30, 50);
  });
  ctx.sign('GOTTESMAN HALL OF PLANET EARTH', cx, y + 5.2, z1 - 0.02, 0, 0.34, { color: '#d8c8a8' });
  ctx.view('main', cx, y, z1 - 3, 0, 4);
  void bench; void vitrine; void pedestal;
}

export function roselink2(ctx) {
  const { room, geo } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  // Cosmic Shop shelving and three astronomical prints
  for (const zz of [-30, -36, -42]) {
    geo.box('wood', x0 + 4, y, zz - 0.3, x0 + 12, y + 1.5, zz + 0.3, { color: 0xb8a078 });
    ctx.phys.box(x0 + 4, zz - 0.3, x0 + 12, zz + 0.3, y, y + 1.5);
    for (let k = 0; k < 8; k++) geo.add('gloss', new THREE.SphereGeometry(0.16, 12, 8), xform(x0 + 4.6 + k * 0.95, y + 1.68, zz), [0x3f6ac0, 0xc9a25e, 0xb4533a, 0x8a8f98][k % 4]);
  }
  const neb = (hue) => (g, w, h) => {
    g.fillStyle = '#05060c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) { const x = Math.random() * w, yy = Math.random() * h, r = 40 + Math.random() * 180; const rg = g.createRadialGradient(x, yy, 0, x, yy, r); rg.addColorStop(0, `hsla(${hue + Math.random() * 60},80%,60%,0.22)`); rg.addColorStop(1, 'hsla(0,0%,0%,0)'); g.fillStyle = rg; g.fillRect(x - r, yy - r, 2 * r, 2 * r); }
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(255,255,255,${Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
  };
  [200, 320, 20].forEach((hue, i) => picture(ctx, { x: x1, y: y + 2.6, z: -28 - i * 8, face: 270, w: 5, h: 3.2, unlit: true }, neb(hue)));
  ctx.sign('ROSE CENTER FOR EARTH AND SPACE', x0 + 0.02, y + 4.6, -51, 90, 0.3, { color: '#5a6270', sans: true });
  ctx.sign('COSMIC SHOP', x0 + 8, y + 4.4, z1 - 0.02, 0, 0.3, { color: '#5a6270', sans: true });
  void z0;
}
