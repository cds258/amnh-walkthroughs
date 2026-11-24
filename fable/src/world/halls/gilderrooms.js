// Rooms of the Gilder Center around the atrium: Insectarium, Butterfly Vivarium, Invisible Worlds,
// the Gottesman Research Library, the Collections Core levels and the galleria that joins the old buildings.
import * as THREE from 'three';
import { xform, shade, col, mulberry } from '../../engine/builder.js';
import { textPanel, picture } from '../../engine/placards.js';
import { registerMat, hasMat } from '../../engine/materials.js';
import { makeCanvas } from '../../engine/textures.js';
import { bench, blob, island, vitrine } from '../furniture.js';
import { ellipsoid, tube } from '../../models/loft.js';
import { local, wallCase, caseRow, fillStorage, fillPots, plant, landscape, crystals } from '../kit.js';

const mid = (r) => [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2];

/** Big model insect, body length L, head towards +X. kind: 'bee' | 'beetle' | 'mosquito' | 'ant' */
function insect(Lc, kind, lx, ly, lz, rot, L = 1) {
  const A = (m, g, c) => Lc.add(m, g, lx, ly, lz, rot, 1, c);
  const pal = { bee: [0x2a2014, 0xd9a020], beetle: [0x1e5a3a, 0x16402a], mosquito: [0x4a4038, 0x6a5a4a], ant: [0x5a2a16, 0x7a3a1e] }[kind];
  const slim = kind === 'mosquito' ? 0.45 : kind === 'ant' ? 0.7 : 1;
  A('gloss', ellipsoid([L * 0.02, L * 0.42, 0], [L * 0.17, L * 0.15 * slim, L * 0.15 * slim], { seg: 12, rings: 8 }), pal[0]); // thorax
  A('gloss', ellipsoid([L * 0.28, L * 0.4, 0], [L * 0.1, L * 0.09, L * 0.1], { seg: 10, rings: 7 }), pal[0]); // head
  const ab = tube([[-L * 0.12, L * 0.42, 0], [-L * 0.3, L * 0.4, 0], [-L * 0.5, L * 0.36, 0], [-L * 0.62, L * 0.33, 0]], [L * 0.1 * slim, L * 0.17 * slim, L * 0.13 * slim, L * 0.02], { radial: 10, sub: 4, color: (u) => col(kind === 'bee' && Math.floor(u * 9) % 2 ? pal[1] : kind === 'bee' ? pal[0] : pal[1]) });
  A('gloss', ab, 0xffffff);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const bx = L * (0.14 - k * 0.12);
      A('satin', tube([[bx, L * 0.36, s * L * 0.1], [bx + L * (0.1 - k * 0.1), L * 0.46, s * L * 0.34], [bx + L * (0.16 - k * 0.16), 0, s * L * 0.46]], L * 0.016, { radial: 5, sub: 3 }), 0x1a140e);
    }
    A('satin', tube([[L * 0.34, L * 0.46, s * L * 0.04], [L * 0.5, L * 0.6, s * L * 0.12]], L * 0.008, { radial: 4, sub: 2 }), 0x1a140e);
    if (kind !== 'ant') A(kind === 'beetle' ? 'gloss' : 'glass', ellipsoid([-L * 0.2, L * 0.6, s * L * 0.26], [L * 0.36, L * 0.012, L * 0.13], { seg: 10, rings: 4, rot: [s * 0.25, -s * 0.5, 0.12] }), kind === 'beetle' ? pal[0] : 0xe8f0f4);
  }
  if (kind === 'mosquito') A('satin', tube([[L * 0.36, L * 0.38, 0], [L * 0.62, L * 0.2, 0]], L * 0.008, { radial: 4, sub: 1 }), 0x1a140e);
}

const honeycomb = (g, w, h) => {
  g.fillStyle = '#b8780e'; g.fillRect(0, 0, w, h);
  const s = w / 14;
  for (let j = -1; j < h / (s * 0.87) + 1; j++) for (let i = -1; i < 16; i++) {
    const cx = i * s + (j % 2 ? s / 2 : 0), cy = j * s * 0.87;
    const gr = g.createRadialGradient(cx, cy, 2, cx, cy, s * 0.5);
    gr.addColorStop(0, ['#f0b020', '#e09a10', '#ffd060', '#c8860c'][(i * 7 + j * 3 + 40) % 4]); gr.addColorStop(1, '#8a5a08');
    g.fillStyle = gr; g.beginPath();
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; g.lineTo(cx + Math.cos(a) * s * 0.52, cy + Math.sin(a) * s * 0.52); }
    g.fill();
  }
};

export function insectarium(ctx) {
  const { room, geo, phys, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room, [cx, cz] = mid(room);
  // the hive: hanging lobes of honeycomb you can walk between
  if (!hasMat('honeycomb')) {
    const c = makeCanvas(512, 512);
    honeycomb(c.getContext('2d'), 512, 512);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    registerMat('honeycomb', new THREE.MeshBasicMaterial({ map: t, vertexColors: true }));
  }
  const hx = x1 - 9, hz = cz - 1;
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45, px = hx + Math.sin(a) * 3.2, pz = hz - Math.cos(a) * 2.2 + 2.2;
    const w = 2.2, hgt = 3.6 - Math.abs(i - 2) * 0.35;
    const g = new THREE.SphereGeometry(1, 20, 14);
    g.scale(w / 2, hgt / 2, 0.2);
    const uv = g.attributes.uv, pp = g.attributes.position;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, pp.getX(k) / 2.2 + 0.5, pp.getY(k) / 2.2 + 0.5);
    geo.add('honeycomb', g, xform(px, y + room.h - 0.2 - hgt / 2, pz, -a), [1, 1, 1]);
  }
  lights.anchor(hx, y + 3.4, hz + 1.5, { color: 0xffc860, intensity: 60, dist: 16 });
  ctx.placard({ id: 'beehive', star: true, title: 'The Hive', sub: 'Model of a honeybee colony · 8,000 pounds of resin',
    text: 'A monumental cast of the hanging combs of a wild honeybee nest. A colony of 50,000 bees builds its wax city to a single rule — hexagons, the shape that stores the most honey for the least wax.',
    x: hx - 3.4, y, z: hz + 3.4, face: 180, target: [hx, y + 3.2, hz + 1], view: { x: hx - 5.5, y, z: hz + 5.8, yaw: 52, pitch: 12 } });
  // giant insects on a long plinth
  const Lc = local(ctx, cx - 6, y, z0, 180);
  Lc.box('satin', -7, 0, 0.3, 7, 0.7, 1.7, 0xd8ccb8);
  Lc.collide(-7, 0.3, 7, 1.7, 1.6);
  [['bee', 'Honeybee', -5.4, 1.5], ['beetle', 'Hercules Beetle', -1.8, 1.6], ['mosquito', 'Mosquito', 1.8, 1.7], ['ant', 'Leafcutter Ant', 5.4, 1.5]].forEach(([k, n, u, s]) => {
    insect(Lc, k, u, 0.7, 1.0, 12, s);
    Lc.placard({ title: n, sub: 'Model, greatly enlarged', text: { bee: 'Bees pollinate a third of the food we eat.', beetle: 'One in every four animal species on Earth is a beetle.', mosquito: 'The deadliest animal to humans, as a carrier of malaria, dengue and yellow fever.', ant: 'Leafcutters do not eat leaves: they farm fungus on them, and have done so for 50 million years.' }[k], lx: u, lz: 2.5, lt: [u, 1.4, 1] });
  });
  lights.anchor(cx - 6, y + 4, z0 + 4, { color: 0xfff0d8, intensity: 36, dist: 18 });
  // leafcutter ant colony: a transparent skybridge the ants cross overhead
  const ty = y + 2.7;
  geo.add('glass', new THREE.CylinderGeometry(0.16, 0.16, 12, 12, 1, true).rotateZ(Math.PI / 2), xform(cx - 12, ty, cz + 3.2), 0xd8f0e0);
  for (let i = 0; i < 30; i++) geo.add('flat', ellipsoid([0, 0, 0], [0.05, 0.035, 0.02], { seg: 5, rings: 3 }), xform(cx - 17.7 + i * 0.39, ty - 0.1 + (i % 3) * 0.02, cz + 3.2, i), i % 2 ? 0x3f8a34 : 0x5a2a16);
  for (const [vx, c] of [[cx - 18, 0x3f7a34], [cx - 6, 0xcfc8b8]]) {
    const top = vitrine(ctx, vx, y, cz + 3.2, 1.6, 1.2, 1.5, { plinth: 0.8 });
    geo.add('flat', ellipsoid([0, 0.45, 0], [0.6, 0.45, 0.42], { seg: 10, rings: 7 }), xform(vx, top, cz + 3.2), c);
  }
  ctx.placard({ id: 'leafcutter', title: 'Leafcutter Ant Colony', sub: 'Atta cephalotes · about 500,000 live ants', text: 'Follow the ants as they carry leaf fragments along the transparent skybridge from their foraging area to the fungus gardens that feed the colony — one of the largest displays of leafcutters anywhere.', x: cx - 12, y, z: cz + 5.0, face: 180, target: [cx - 12, ty, cz + 3.2] });
  // pinned collection wall
  picture(ctx, { x: x0, y: y + 2.4, z: cz, face: 90, w: 9, h: 3.2 }, (g, w, h) => {
    g.fillStyle = '#f1ece2'; g.fillRect(0, 0, w, h);
    const r = mulberry(5);
    for (let j = 0; j < 9; j++) for (let i = 0; i < 30; i++) { const x = 20 + i * (w - 40) / 30, yy = 20 + j * (h - 40) / 9, s = 4 + r() * 8; g.fillStyle = `hsl(${r() * 360},${40 + r() * 50}%,${25 + r() * 35}%)`; g.beginPath(); g.ellipse(x + 14, yy + 16, s, s * 1.5, 0, 0, 6.3); g.fill(); g.fillRect(x + 14 - s * 2.2, yy + 12, s * 4.4, 2); }
  });
  ctx.placard({ title: 'Insects of New York City', sub: 'Pinned collection', text: 'The five boroughs are home to thousands of insect species; scientists are still finding new ones in the city\'s parks.', x: x0 + 1.6, y, z: cz, face: 90, target: [x0 + 0.1, y + 2.4, cz] });
  ctx.sign('SOLOMON FAMILY INSECTARIUM', cx, y + 4.6, z1 - 0.02, 0, 0.26, { color: '#6a5a48', sans: true });
  ctx.view('main', -61, y, z1 - 2.2, 0, 4);
  void phys; void blob;
}

export function butterfly(ctx) {
  const { room, geo, phys, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room, [cx, cz] = mid(room);
  const r = mulberry(21);
  // planted beds either side of a winding path
  for (const [bx0, bz0, bx1, bz1] of [[x0 + 1, z0 + 1, x1 - 1, z0 + 5], [x0 + 1, z1 - 3.2, -66, z1 - 0.6], [-56, z1 - 3.2, x1 - 1, z1 - 0.6], [x0 + 6, cz - 0.6, x0 + 16, cz + 2.4], [x1 - 16, cz - 0.6, x1 - 6, cz + 2.4]]) {
    geo.box('ground', bx0, y, bz0, bx1, y + 0.3, bz1, { color: 0x4a3a26, side: 0x8a8a80 });
    phys.box(bx0, bz0, bx1, bz1, y, y + 1.4);
    const n = Math.round((bx1 - bx0) * (bz1 - bz0) / 3.2);
    for (let i = 0; i < n; i++) plant(ctx, bx0 + 0.5 + r() * (bx1 - bx0 - 1), y + 0.3, bz0 + 0.4 + r() * (bz1 - bz0 - 0.8), 0.9 + r() * 2.4, i + bx0, [0x3f7a34, 0x2f6a26, 0x5c9a3a, 0x4a8a44][i % 4]);
    for (let i = 0; i < n; i++) geo.add('flat', ellipsoid([0, 0, 0], [0.09, 0.06, 0.09], { seg: 6, rings: 4 }), xform(bx0 + 0.4 + r() * (bx1 - bx0 - 0.8), y + 0.5 + r() * 1.2, bz0 + 0.3 + r() * (bz1 - bz0 - 0.6)), [0xe84a6a, 0xe8c81e, 0xf08a2a, 0xd8d8f0, 0xb83ad0][i % 5]);
  }
  // butterflies
  const wing = new THREE.BufferGeometry();
  wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.07, 0.03, 0.06, 0.02, 0.02, -0.06, 0, 0, 0, -0.07, 0.03, 0.06, -0.02, 0.02, -0.06], 3));
  wing.computeVertexNormals();
  const cols = [0x1e6ad9, 0xe88a1e, 0xe8d81e, 0xf0f0f0, 0x16181a, 0xd92a1e, 0x3ad0c0];
  for (let i = 0; i < 260; i++) {
    const s = 0.7 + r() * 1.1;
    geo.add('glow_ds', wing, new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((r() - 0.5) * 1.2, r() * 6.28, (r() - 0.5) * 0.8)).scale(new THREE.Vector3(s, s, s)).setPosition(x0 + 1 + r() * (x1 - x0 - 2), y + 0.6 + r() * 3.6, z0 + 1 + r() * (z1 - z0 - 2)), shade(cols[i % cols.length], 0.9));
  }
  // pupae incubator
  wallCase(ctx, { x: x1, z: cz + 4.6, face: 270, y, w: 3, h: 1.4, d: 0.5, sill: 1.0, back: 0xe8f0e0,
    fill: (L, w, h, d, deck) => { for (let j = 0; j < 3; j++) for (let i = 0; i < 12; i++) L.add('gloss', ellipsoid([0, 0, 0], [0.025, 0.06, 0.025], { seg: 6, rings: 4 }), -w / 2 + 0.2 + i * (w - 0.4) / 11, deck + 0.35 + j * 0.38, 0.2, 0, 1, [0x6a8a3a, 0x8a6a3a, 0xc9a23a][(i + j) % 3]); },
    label: { title: 'Pupae Incubator', sub: 'Chrysalises from butterfly farms', text: 'New butterflies emerge here every day, pump up their wings, and are released into the vivarium.' } });
  for (const dx of [-12, 0, 12]) lights.anchor(cx + dx, y + 4.6, cz, { color: 0xf4ffe0, intensity: 44, dist: 20 });
  ctx.placard({ id: 'butterflies', star: true, title: 'Davis Family Butterfly Vivarium', sub: 'Up to 1,000 free-flying butterflies · 80 species',
    text: 'A warm, humid garden kept at about 80°F all year. Blue morphos, owl butterflies and monarchs fly freely around you — check your shoulders before you leave. Butterflies are indicators of a healthy environment, and many species are in steep decline.',
    x: -58, y, z: z1 - 4.4, face: 0, target: [cx, y + 2, cz], view: { x: -61, y, z: z1 - 1.8, yaw: 20, pitch: 4 } });
  bench(ctx, cx, y, cz + 4.0, 0, 2.4);
  ctx.view('main', -61, y, z1 - 1.8, 0, 2);
}

export function invisible(ctx) {
  const { room, geo, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room, [cx, cz] = mid(room);
  const web = (seed, hue) => (g, w, h) => {
    g.fillStyle = '#020308'; g.fillRect(0, 0, w, h);
    const r = mulberry(seed);
    const pts = Array.from({ length: 70 }, () => [r() * w, r() * h]);
    g.lineWidth = 1.5;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d < w * 0.16) { g.strokeStyle = `hsla(${hue + r() * 60},90%,65%,${0.6 - d / (w * 0.3)})`; g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.quadraticCurveTo((pts[i][0] + pts[j][0]) / 2 + (r() - 0.5) * 40, (pts[i][1] + pts[j][1]) / 2 + (r() - 0.5) * 40, pts[j][0], pts[j][1]); g.stroke(); } }
    for (const p of pts) { const s = 4 + r() * 14; const rg = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], s); rg.addColorStop(0, `hsla(${hue + r() * 80},100%,80%,1)`); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(p[0] - s, p[1] - s, 2 * s, 2 * s); }
  };
  // immersive room: a walled oval theatre at the east end
  const tx0 = x1 - 20, th = room.h - 0.3;
  picture(ctx, { x: x1, y: y + th / 2, z: cz, face: 270, w: z1 - z0 - 0.4, h: th, unlit: true }, web(3, 180));
  picture(ctx, { x: (tx0 + x1) / 2, y: y + th / 2, z: z0, face: 180, w: x1 - tx0, h: th, unlit: true }, web(4, 260));
  picture(ctx, { x: (tx0 + x1) / 2 + 4, y: y + th / 2, z: z1, face: 0, w: x1 - tx0 - 8, h: th, unlit: true }, web(5, 120));
  const disc = new THREE.CircleGeometry(5, 40);
  disc.rotateX(-Math.PI / 2);
  geo.add('glow', disc, xform(x1 - 9, y + 0.02, cz), [0.05, 0.16, 0.2]);
  for (let i = 0; i < 3; i++) geo.add('glow', new THREE.RingGeometry(1.4 + i * 1.4, 1.46 + i * 1.4, 48).rotateX(-Math.PI / 2), xform(x1 - 9, y + 0.03, cz), [0.2, 0.8, 0.9]);
  lights.anchor(x1 - 9, y + 3, cz, { color: 0x4ad0e8, intensity: 26, dist: 16 });
  ctx.placard({ id: 'invisibleworlds', star: true, title: 'Invisible Worlds', sub: '360-degree immersive experience · 12 minutes',
    text: 'A room as large as an ice rink whose walls and floor respond to your movement. The loop travels from the neurons firing in a human brain to the fungal networks that link the trees of a rain forest and the plankton that drive the ocean — all life is connected.',
    x: tx0 - 1.2, y, z: cz + 1.8, face: 270, target: [x1 - 8, y + 2.4, cz], view: { x: tx0 - 4, y, z: cz + 0.8, yaw: 88, pitch: 4 } });
  // introductory gallery
  const intro = [['DNA', 'Every living thing reads the same four-letter code.', 300], ['Food Webs', 'Who eats whom: energy flows from the Sun through every organism.', 40], ['Signals', 'Chemical and electrical messages tie cells into bodies.', 200]];
  intro.forEach(([t, text, hue], i) => {
    const x = x0 + 5 + i * 6.2;
    picture(ctx, { x, y: y + 2.3, z: z0, face: 180, w: 5, h: 2.8, unlit: true }, web(10 + i, hue));
    ctx.placard({ title: t, sub: 'Invisible Worlds · introduction', text, x, y, z: z0 + 1.6, face: 180, target: [x, y + 2.3, z0 + 0.1] });
    lights.anchor(x, y + 3.6, z0 + 3, { color: 0x9ab8ff, intensity: 10, dist: 10 });
  });
  ctx.view('main', -61, y, z1 - 2.2, 20, 2);
}

const spines = (seed) => (g, w, h) => {
  const r = mulberry(seed);
  g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, w, h);
  const rows = 6, rh = h / rows;
  for (let j = 0; j < rows; j++) {
    let x = 6;
    while (x < w - 10) { const bw = 10 + r() * 22, bh = rh * (0.68 + r() * 0.24); g.fillStyle = `hsl(${[20, 35, 200, 120, 0, 45][Math.floor(r() * 6)]},${20 + r() * 40}%,${22 + r() * 40}%)`; g.fillRect(x, (j + 1) * rh - bh - 6, bw - 2, bh); g.fillStyle = 'rgba(255,240,200,0.5)'; g.fillRect(x + 2, (j + 1) * rh - bh * 0.7, bw - 6, 3); x += bw; }
    g.fillStyle = '#6a4e30'; g.fillRect(0, (j + 1) * rh - 6, w, 6);
  }
};
export function library(ctx) {
  const { room, geo, phys, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room, [cx, cz] = mid(room);
  // the tree-like column that opens into the ceiling
  const trunk = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; trunk.push(new THREE.Vector2(0.55 + Math.pow(t, 3.2) * 6.5, t * room.h)); }
  geo.add('plaster', new THREE.LatheGeometry(trunk, 40), xform(cx - 4, y, cz), 0xe6d8c4);
  phys.cyl(cx - 4, cz, 0.7, y, y + room.h);
  // book stacks along the north wall and as free-standing ranges
  for (let i = 0; i < 6; i++) {
    const x = x0 + 4 + i * 6.2;
    geo.box('wood', x - 2.7, y, z0, x + 2.7, y + 3.0, z0 + 0.45, { color: 0x6a4e30 });
    picture(ctx, { x, y: y + 1.55, z: z0 + 0.45, face: 180, w: 5.2, h: 2.8, px: 1024 }, spines(i + 1));
  }
  phys.box(x0, z0, x1, z0 + 0.5, y, y + 3);
  for (let i = 0; i < 3; i++) {
    const x = x1 - 5 - i * 3.4;
    geo.box('wood', x - 0.25, y, cz - 2, x + 0.25, y + 2.2, cz + 3.4, { color: 0x6a4e30 });
    phys.box(x - 0.25, cz - 2, x + 0.25, cz + 3.4, y, y + 2.2);
    for (const f of [90, 270]) picture(ctx, { x: x + (f === 90 ? 0.25 : -0.25), y: y + 1.15, z: cz + 0.7, face: f, w: 5.2, h: 2.0, px: 1024 }, spines(i + 9 + f));
  }
  // reading tables
  for (const tx of [x0 + 8, x0 + 15]) {
    geo.box('wood', tx - 1.6, y + 0.72, cz + 0.4, tx + 1.6, y + 0.78, cz + 1.8, { color: 0x9a7a52 });
    for (const [dx, dz] of [[-1.5, 0.5], [1.5, 0.5], [-1.5, 1.7], [1.5, 1.7]]) geo.box('wood', tx + dx - 0.04, y, cz + dz - 0.04, tx + dx + 0.04, y + 0.72, cz + dz + 0.04, { color: 0x6a4e30 });
    phys.box(tx - 1.6, cz + 0.4, tx + 1.6, cz + 1.8, y, y + 0.9);
    for (const dx of [-0.9, 0, 0.9]) { geo.box('flat', tx + dx - 0.22, y + 0.42, cz - 0.2, tx + dx + 0.22, y + 0.47, cz + 0.25, { color: 0x4a6a5a }); geo.box('flat', tx + dx - 0.22, y + 0.42, cz - 0.24, tx + dx + 0.22, y + 0.95, cz - 0.2, { color: 0x4a6a5a }); }
    geo.box('glow', tx - 0.5, y + 1.15, cz + 1.05, tx + 0.5, y + 1.18, cz + 1.15, { color: [2.2, 1.9, 1.4] });
    blob(geo, tx, y, cz + 1.1, 2, 1.2);
  }
  // windows on Theodore Roosevelt Park (west wall)
  geo.wall('glow', x0 + 0.03, z1 - 2, x0 + 0.03, z0 + 2, y + 0.9, y + room.h - 0.6, { color: [1.3, 1.5, 1.8] });
  for (let z = z0 + 2; z <= z1 - 1.99; z += 2.2) geo.box('satin', x0 + 0.02, y + 0.9, z - 0.05, x0 + 0.1, y + room.h - 0.6, z + 0.05, { color: 0x6a5238 });
  lights.anchor(x0 + 3, y + 3, cz, { color: 0xdfeaff, intensity: 40, dist: 18 });
  ctx.placard({ id: 'library', title: 'Gottesman Research Library', sub: 'More than 550,000 volumes on natural history', text: 'Founded with the museum in 1869, the library holds rare books, expedition diaries, a million photographs and the museum\'s archives. Its new reading room, beneath a tree-like column that spreads into the ceiling, looks west over Theodore Roosevelt Park.', x: -58, y, z: z1 - 4.2, face: 0, target: [cx - 4, y + 3, cz] });
  ctx.view('main', -61, y, z1 - 2.2, 10, 6);
}

function collections(ctx, floorTitle, cases) {
  const { room, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  // floor-to-ceiling open storage behind glass along the south wall (and the north wall away from the door)
  const n = cases.length;
  caseRow(ctx, 's', x0 + 2, x1 - 2, n, (i) => ({ h: 3.5, sill: 0.45, d: 1.0, back: 0xe9e4d8, frame: 0xd8ccb8, glow: 0.7, li: 12, fill: cases[i].fill, label: { id: cases[i].id, star: cases[i].star, title: cases[i].t, sub: floorTitle, text: cases[i].text } }));
  for (let x = x0 + 8; x < x1 - 4; x += 11) lights.anchor(x, y + 4.4, (z0 + z1) / 2, { color: 0xfff0d8, intensity: 30, dist: 18 });
  for (const x of [x0 + 16, x1 - 18]) bench(ctx, x, y, z0 + 2.2, 0, 2.4, 0xb89a70);
  ctx.sign('LOUIS V. GERSTNER, JR. COLLECTIONS CORE', -52, y + 4.4, z0 + 0.02, 180, 0.22, { color: '#6a5a48', sans: true });
  ctx.view('main', -67, y, z0 + 2.2, 180, 4);
}
const bones = (seed) => (L, w, h, d, deck) => {
  const r = mulberry(seed);
  for (let j = 0; j < 5; j++) { const yy = deck + j * h / 5; if (j) L.box('satin', -w / 2, yy - 0.025, 0.02, w / 2, yy, d * 0.9, 0x3a3a3c); for (let i = 0; i < Math.floor(w / 0.6); i++) L.add('bone', tube([[-0.22, 0.06, 0], [0, 0.07 + r() * 0.04, 0], [0.22, 0.06, 0]], [0.06, 0.03, 0.055], { radial: 6, sub: 2 }), -w / 2 + 0.4 + i * 0.6, yy, d * 0.5, r() * 60 - 30, 0.8 + r() * 0.5, 0xd9cfb4); }
};
const minerals = (seed) => (L, w, h, d, deck) => {
  const r = mulberry(seed);
  for (let j = 0; j < 5; j++) { const yy = deck + j * h / 5; if (j) L.box('satin', -w / 2, yy - 0.025, 0.02, w / 2, yy, d * 0.9, 0x3a3a3c); for (let i = 0; i < Math.floor(w / 0.55); i++) for (const [g, k] of crystals(0.16, 0.2, seed * 9 + i + j * 20, 4)) L.add('gloss', g, -w / 2 + 0.35 + i * 0.55, yy, d * 0.5, 0, 1, shade([0x7a3ab0, 0x2f9a6a, 0xd9c020, 0xe8e8f0, 0x1e4ab8][Math.floor(r() * 5)], k)); }
};
export function collections1(ctx) {
  collections(ctx, 'Collections Core · Level 1', [
    { t: 'Fossil Trackways', text: 'Footprints of dinosaurs and early reptiles on slabs of sandstone.', fill: bones(1) },
    { id: 'collectionscore', star: true, t: 'Open Storage', text: 'Only a tiny fraction of the museum\'s 34 million specimens and objects is ever on exhibition. The Collections Core puts three storeys of working collections behind glass, so visitors can see what scientists actually study.', fill: fillStorage(2) },
    { t: 'Trilobites', text: 'Hundreds of species of these extinct arthropods, which ruled the seas for 270 million years.', fill: fillStorage(3, 'boxes') },
    { t: 'Minerals in Reserve', text: 'Study specimens from the mineralogy collection.', fill: minerals(4) },
    { t: 'Fishes in Fluid', text: 'Jars from the ichthyology collection of more than two million specimens.', fill: fillStorage(5, 'jars') },
    { t: 'Mammal Bones', text: 'Limb bones and vertebrae used to compare living and fossil species.', fill: bones(6) },
  ]);
}
export function collections2(ctx) {
  collections(ctx, 'Collections Core · Level 2', [
    { t: 'Ceramics of the Americas', text: 'Vessels from the anthropology collections, shelved by region and period.', fill: fillPots([0xa8663a, 0x8a4a2a, 0xd9b890, 0x3a2a20], 2) },
    { t: 'Pinned Insects', text: 'Drawers from a collection of more than 20 million insects.', fill: fillStorage(8, 'boxes') },
    { t: 'Amphibians and Reptiles', text: 'Specimens preserved in alcohol for anatomical and genetic study.', fill: fillStorage(9, 'jars') },
    { t: 'Pottery Sherds', text: 'Even fragments record how and when a pot was made.', fill: fillPots([0x8a6a4a, 0xb8865a], 10, ['bowl']) },
    { t: 'Spiders and Scorpions', text: 'One of the world\'s great arachnid collections.', fill: fillStorage(11, 'jars') },
    { t: 'Shells', text: 'Mollusc shells sorted by family.', fill: fillStorage(12) },
  ]);
}
export function collections3(ctx) {
  collections(ctx, 'Collections Core · Level 3', [
    { t: 'Antlers and Horns', text: 'Series that show how individuals of one species vary.', fill: bones(13) },
    { t: 'Marine Invertebrates', text: 'Corals, sponges and sea stars from reef expeditions.', fill: fillStorage(14) },
    { t: 'Bird Eggs and Nests', text: 'Historic egg collections now help track the effects of pesticides and climate change.', fill: fillStorage(15, 'boxes') },
    { t: 'Meteorite Slices', text: 'Cut and polished sections for research.', fill: minerals(16) },
    { t: 'Fossil Fishes', text: 'Type specimens — the individuals on which a species\' name is based.', fill: fillStorage(17, 'boxes') },
    { t: 'Bats', text: 'Skulls and skins from the mammalogy collection.', fill: bones(18) },
  ]);
}
export function alcove4(ctx) {
  const { room, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  for (let i = 0; i < 6; i++) {
    const x = x0 + 8 + i * 7.6;
    ctx.geo.box('satin', x - 1.6, y + 1.15, z1 - 0.05, x + 1.6, y + 3.25, z1, { color: 0x1c1c1e });
    picture(ctx, { x, y: y + 2.2, z: z1 - 0.05, face: 0, w: 3, h: 1.9, px: 512 }, landscape(i + 70, [['#7fa6d0', '#e8d8b8', '#6a7a4a', '#3a4a2a'], ['#e8a060', '#f8e0b0', '#8a5a3a', '#3a2418'], ['#9ab8d8', '#f0f0f0', '#b0c0d0', '#6a7a8a']][i % 3]));
  }
  for (let x = x0 + 8; x < x1 - 4; x += 11) lights.anchor(x, y + 4.4, (z0 + z1) / 2, { color: 0xfff0d8, intensity: 30, dist: 18 });
  ctx.placard({ title: 'Alcove Gallery', sub: 'Level 4', text: 'A small gallery for changing displays from the library\'s rare-book and photograph collections.', x: -62, y, z: z0 + 2.6, face: 180 });
  bench(ctx, -52, y, (z0 + z1) / 2, 0, 2.4, 0xb89a70);
}

function galleria(ctx, level) {
  const { room, geo, phys } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  textPanel(ctx, { x: x1 - 0.03, y: y + 2.3, z: 0, face: 270, w: 4.4, h: 2.4, heading: `Gilder Center · Level ${level}`, text: ['← Griffin Exploration Atrium · Insectarium · Collections Core\n→ Theater Lobby · Northwest Coast Hall · North American Mammals', '← Atrium · Butterfly Vivarium · Collections Core\n→ African Peoples · Akeley Hall of African Mammals', '← Atrium · Invisible Worlds · Collections Core\n→ North American Birds · Primates · Reptiles and Amphibians', '← Atrium · Research Library\n→ Fossil Halls: Vertebrate Origins · Dinosaurs · Mammals'][level - 1], bg: '#efe6d6', fg: '#5a4a3a', headSize: 64, size: 38, align: 'left', font: 'sans' });
  if (level === 1) {
    for (const zz of [16, 20]) {
      geo.box('wood', x0 + 3, y, zz - 0.35, x0 + 10, y + 1.3, zz + 0.35, { color: 0xc8b08a });
      phys.box(x0 + 3, zz - 0.35, x0 + 10, zz + 0.35, y, y + 1.3);
      for (let k = 0; k < 10; k++) geo.add('gloss', ellipsoid([0, 0, 0], [0.14, 0.12, 0.14], { seg: 8, rings: 6 }), xform(x0 + 3.5 + k * 0.68, y + 1.44, zz), [0x3f8a5a, 0xd9a020, 0x7a3ab0, 0xb8402a, 0x2a6ab8][k % 5]);
    }
    ctx.sign('MUSEUM SHOP', x0 + 6.5, y + 4.2, z1 - 0.02, 0, 0.26, { color: '#6a5a48', sans: true });
  } else {
    for (const zz of [8, 18]) bench(ctx, x0 + 5, y, zz, 90, 2.4, 0xb89a70);
    plant(ctx, x0 + 2, y, 26, 2.4, level * 3);
  }
  void z0;
}
export const gildershop1 = (ctx) => galleria(ctx, 1);
export const gildereast2 = (ctx) => galleria(ctx, 2);
export const gildereast3 = (ctx) => galleria(ctx, 3);
export const gildereast4 = (ctx) => galleria(ctx, 4);
void island; void wallCase;
