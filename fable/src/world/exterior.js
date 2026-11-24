// Sky dome, street-level ground, the Central Park West front (Theodore Roosevelt Memorial)
// with its terrace and steps, and the surrounding park, visible through windows and glass walls.
import * as THREE from 'three';
import { Geo, xform, shade, mulberry } from '../engine/builder.js';
import { sign, textPanel } from '../engine/placards.js';
import { ellipsoid } from '../models/loft.js';

function tree(g, x, z, h, seed, leaf = 0x4a7a3a) {
  const r = mulberry(seed);
  g.cyl('flat', x, 0, z, h * 0.035, h * 0.5, { color: 0x4a3a2c, seg: 6 });
  for (let i = 0; i < 4; i++) g.add('flat', ellipsoid([x + (r() - 0.5) * h * 0.3, h * (0.5 + r() * 0.3), z + (r() - 0.5) * h * 0.3], [h * (0.22 + r() * 0.1), h * (0.2 + r() * 0.08), h * (0.22 + r() * 0.1)], { seg: 7, rings: 5 }), null, shade(leaf, 0.75 + r() * 0.5));
}

export function buildExterior(W) {
  const g = new Geo();
  const { phys, lights } = W;
  const grp = new THREE.Group();
  grp.name = 'exterior';
  W.root.add(grp);
  const ctx = { geo: g, group: grp, room: null };
  const granite = 0xc9b3a6, dark = 0x8a7a70;

  // ground: lawn of Theodore Roosevelt Park, sidewalks and the avenue
  g.floor('ground', -400, -400, 400, 400, -0.06, { color: 0x5a7a44 });
  g.floor('pavers', 109, -120, 127, 140, -0.03, { color: 0x9a968e });
  g.floor('flat', 127, -400, 147, 400, -0.02, { color: 0x3a3a3c });
  g.floor('pavers', 147, -400, 152, 400, -0.01, { color: 0x9a968e });
  for (let z = -200; z < 220; z += 9) g.floor('flat', 136.9, z, 137.1, z + 4, -0.01, { color: 0xd9c85a });
  // Central Park wall and trees across the avenue
  g.box('stone', 152, 0, -400, 152.6, 1.2, 400, { color: 0x6a6660 });
  for (let i = 0; i < 46; i++) tree(g, 156 + (i % 3) * 7 + Math.sin(i * 3.3) * 2, -170 + i * 7.6, 9 + (i % 4) * 2.2, i + 1, [0x4a7a3a, 0x5a8a3a, 0x3f6a34][i % 3]);
  // park trees around the Rose Center and the Gilder Center
  for (let i = 0; i < 14; i++) tree(g, 20 + i * 6.5, -96 - (i % 3) * 7, 8 + (i % 3) * 2, i + 60);
  for (let i = 0; i < 12; i++) tree(g, -108 - (i % 3) * 8, -40 + i * 7.5, 8 + (i % 4) * 2, i + 90);
  for (let i = 0; i < 8; i++) tree(g, 14 - (i % 2) * 7, -50 - i * 6, 8 + (i % 3) * 2, i + 120);

  // ---- Theodore Roosevelt Memorial front ----
  const ty = 6.5; // terrace = Rotunda floor
  const TZ = 15;
  // terrace and its podium
  g.box('stone', 103, 0, -TZ, 110, ty, TZ, { color: granite, top: 0xb9aa9c });
  phys.floor(103, -TZ, 110, TZ, ty);
  // steps down to the sidewalk
  const n = 30, run = 12 / n, rise = ty / n, SZ = 11;
  for (let i = 0; i < n; i++) {
    const xa = 110 + i * run, top = ty - (i + 1) * rise;
    g.box('stone', xa, 0, -SZ, xa + run, top + rise, SZ, { color: granite, top: 0xbcae9f, skip: 'y-x-' });
  }
  phys.ramp(110, -SZ, 122, SZ, ty, 0, 'x');
  // cheek walls beside the steps, parapets round the terrace
  for (const s of [-1, 1]) {
    g.box('stone', 110, 0, s * SZ, 122.6, 2.4, s * (SZ + 1.6), { color: granite });
    g.box('stone', 110, 0, s * (SZ + 1.6), 116, ty + 1.0, s * TZ, { color: granite });
    g.box('stone', 103, ty, s * (TZ - 0.5), 110, ty + 1.0, s * TZ, { color: granite });
    g.box('stone', 109.5, ty, s * SZ, 110, ty + 1.0, s * TZ, { color: granite });
    phys.box(103, s * (TZ - 0.5), 110, s * TZ, 0, ty + 3);
    phys.box(109.5, Math.min(s * SZ, s * TZ), 110.2, Math.max(s * SZ, s * TZ), 0, ty + 3);
    phys.box(110, Math.min(s * SZ, s * (SZ + 1.6)), 122.6, Math.max(s * SZ, s * (SZ + 1.6)), -1, ty + 3);
  }
  // sidewalk walkable strip, bounded by the kerb
  phys.floor(109, -40, 127, 40, 0);
  phys.box(127, -41, 127.5, 41, -1, 4);
  phys.box(108, -41, 127, -40, -1, 4);
  phys.box(108, 40, 127, 41, -1, 4);
  for (const s of [-1, 1]) phys.box(108.6, Math.min(s * (SZ + 1.6), s * 40), 110, Math.max(s * (SZ + 1.6), s * 40), -1, 4);
  phys.box(109.9, -TZ, 110.4, -SZ, -1, 12); phys.box(109.9, SZ, 110.4, TZ, -1, 12);
  phys.box(101.5, -40, 103, -3.2, 0, 40); phys.box(101.5, 3.2, 103, 40, 0, 40);

  // the triumphal-arch front: piers, giant arch, four Ionic columns, entablature, attic
  const FX = 103, top = ty + 21.5, HW = 21;
  const archW = 5.4, spring = ty + 13.5;
  for (const s of [-1, 1]) g.box('stone', FX - 1.4, 0, s * archW, FX, top, s * HW, { color: granite });
  g.box('stone', FX - 1.4, spring + archW, -archW, FX, top, archW, { color: granite });
  // arch ring (voussoirs) and spandrel fill
  for (let i = 0; i < 16; i++) {
    const a0 = Math.PI * i / 16, a1 = Math.PI * (i + 1) / 16, am = (a0 + a1) / 2;
    const zc = Math.cos(am) * (archW + 0.45), yc = spring + Math.sin(am) * (archW + 0.45);
    g.add('stone', new THREE.BoxGeometry(1.7, 1.25, 0.9).applyMatrix4(new THREE.Matrix4().makeRotationX(am - Math.PI / 2)), xform(FX - 0.6, yc, zc), shade(granite, i % 2 ? 1.04 : 0.94));
    // spandrel wedges
    const zo = Math.cos(am) * archW, yo = spring + Math.sin(am) * archW;
    g.box('stone', FX - 1.4, yo, Math.min(zo, Math.sign(zo) * archW), FX, spring + archW, Math.max(zo, Math.sign(zo) * archW), { color: granite });
  }
  // glazing of the great arched window above the bronze doors
  g.wall('glassblue', FX - 0.9, archW, FX - 0.9, -archW, ty + 6.3, spring + archW, { color: 0x9ab8d0 });
  for (let z = -archW + 1.8; z < archW; z += 1.8) g.box('bronze', FX - 0.98, ty + 6.3, z - 0.06, FX - 0.82, spring + archW, z + 0.06, { color: 0x4a3a2a });
  for (let yy = ty + 6.3; yy < spring + archW; yy += 2.2) g.box('bronze', FX - 0.98, yy - 0.06, -archW, FX - 0.82, yy + 0.06, archW, { color: 0x4a3a2a });
  g.box('bronze', FX - 1.2, ty + 6.2, -archW, FX - 0.2, ty + 6.5, archW, { color: 0x4a3a2a });
  // door surround
  for (const s of [-1, 1]) g.box('bronze', FX - 1.0, ty, s * 3.2, FX - 0.3, ty + 6.2, s * archW, { color: 0x3c3026 });
  // columns on pedestals, each carrying a statue block
  for (const z of [-11.4, -7.3, 7.3, 11.4]) {
    g.box('stone', 104.0, ty, z - 1.0, 106.0, ty + 2.2, z + 1.0, { color: granite });
    g.cyl('stone', 105, ty + 2.2, z, 0.9, 14.6, { rTop: 0.76, color: shade(granite, 1.03), seg: 20 });
    g.box('stone', 104.0, ty + 16.8, z - 1.15, 106.0, ty + 17.5, z + 1.15, { color: shade(granite, 1.05) });
    for (const s of [-1, 1]) g.add('stone', new THREE.CylinderGeometry(0.36, 0.36, 2.0, 12).rotateZ(Math.PI / 2), xform(105, ty + 16.95, z + s * 1.05), shade(granite, 1.05));
    phys.box(104, z - 1, 106, z + 1, ty, ty + 20);
    // statue (explorers and naturalists stand above the columns)
    g.box('stone', 104.3, top - 1.9, z - 0.8, 105.7, top - 1.4, z + 0.8, { color: granite });
    g.add('stone', ellipsoid([105, top - 0.1, z], [0.42, 1.3, 0.36], { seg: 8, rings: 6 }), null, shade(granite, 0.92));
    g.add('stone', ellipsoid([105, top + 1.4, z], [0.24, 0.28, 0.24], { seg: 8, rings: 6 }), null, shade(granite, 0.92));
  }
  // entablature and attic
  g.box('stone', FX - 1.4, ty + 17.5, -HW, 106.3, ty + 19.6, HW, { color: shade(granite, 1.02) });
  g.box('stone', FX - 1.4, ty + 19.6, -HW - 0.3, 106.7, ty + 20.1, HW + 0.3, { color: shade(granite, 1.06) });
  g.box('stone', FX - 1.4, top, -HW + 2, FX + 1.2, top + 6.5, HW - 2, { color: granite });
  g.box('stone', FX - 1.4, top + 6.5, -HW + 1.6, FX + 1.6, top + 7.1, HW - 1.6, { color: shade(granite, 1.06) });
  sign(ctx, 'TRUTH', FX + 1.22, top + 4.9, -12.5, 90, 0.75, { color: '#6a5a50' });
  sign(ctx, 'KNOWLEDGE', FX + 1.22, top + 4.9, 0, 90, 0.75, { color: '#6a5a50' });
  sign(ctx, 'VISION', FX + 1.22, top + 4.9, 12.5, 90, 0.75, { color: '#6a5a50' });
  textPanel(ctx, { x: FX + 1.22, y: top + 2.3, z: 0, face: 90, w: 30, h: 3.0, heading: 'STATE OF NEW YORK MEMORIAL TO THEODORE ROOSEVELT', text: 'A GREAT LEADER OF THE YOUTH OF AMERICA, IN ENERGY AND FORTITUDE, IN THE FAITH OF OUR FATHERS, IN DEFENSE OF THE RIGHTS OF THE PEOPLE, IN THE LOVE AND CONSERVATION OF NATURE AND OF THE BEST IN LIFE AND IN MAN', bg: '#c4afa2', fg: '#5a4a42', headSize: 44, size: 24, pad: 16 });
  sign(ctx, 'AMERICAN MUSEUM OF NATURAL HISTORY', 109.52, ty + 0.45, 0, 90, 0.3, { color: '#5a4a42' });
  // flanking wings of the Central Park West range (windows in a pink-granite wall)
  const wingWall = (z0, z1, h) => {
    g.wall('stone', 101.9, z1, 101.9, z0, 0, h, { cBot: shade(granite, 0.92), cTop: granite });
    g.box('stone', 101.5, h, z0, 102.5, h + 0.9, z1, { color: shade(granite, 1.05) });
    const nb = Math.round(Math.abs(z1 - z0) / 5.2);
    for (let i = 0; i < nb; i++) {
      const zc = z0 + (i + 0.5) * (z1 - z0) / nb;
      for (const [ya, yb] of [[1.6, 4.6], [8.0, 11.6], [14.4, 17.8], [20.6, 23.6]]) {
        g.wall('gloss', 101.95, zc + 1.1, 101.95, zc - 1.1, ya, yb, { color: 0x1c2630 });
        g.box('stone', 101.9, ya - 0.25, zc - 1.3, 102.15, ya, zc + 1.3, { color: shade(granite, 1.08) });
      }
    }
  };
  wingWall(HW, 108, 26.5);
  wingWall(-86, -HW, 26.5);
  // corner towers
  for (const z of [108, -86]) g.box('stone', 98, 0, z - 4, 104, 30, z + 4, { color: shade(granite, 0.97) });
  // banners and lamp standards on the terrace
  for (const z of [-13, 13]) {
    g.cyl('bronze', 108, ty, z, 0.12, 4.4, { color: 0x3c3026, seg: 8 });
    g.add('glow', new THREE.SphereGeometry(0.34, 12, 8), xform(108, ty + 4.6, z), [1.8, 1.7, 1.4]);
  }
  for (const [z, c] of [[-9.3, 0x1e4a8a], [9.3, 0x8a2a1e]]) g.box('flat', FX + 0.02, ty + 8, z - 1.0, FX + 0.08, ty + 15, z + 1.0, { color: c });
  void dark; void lights;

  g.build(grp, { name: 'exterior' });

  // sky dome follows the camera; unaffected by fog
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(500, 24, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x4f86c9) }, hor: { value: new THREE.Color(0xdbe9f6) } },
      vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vp; uniform vec3 top; uniform vec3 hor; void main(){ float h = clamp(normalize(vp).y, 0.0, 1.0); vec3 c = mix(hor, top, pow(h, 0.55)); gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n }',
    })
  );
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  sky.name = 'sky';
  W.scene.add(sky);
  W.sky = sky;
}
