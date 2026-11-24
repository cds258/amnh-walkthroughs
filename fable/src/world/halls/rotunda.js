// Theodore Roosevelt Rotunda (floor 2) and the Memorial Hall beneath it (floor 1).
import * as THREE from 'three';
import { xform, shade, mulberry } from '../../engine/builder.js';
import { textPanel, picture } from '../../engine/placards.js';
import { model, geoBounds } from '../../models/index.js';
import { blob, column, pedestal, bench, rope } from '../furniture.js';
import { dioramaRun } from '../dioramas.js';
import { ellipsoid, tube } from '../../models/loft.js';

export function rotundaPre(room) {
  // the great arched window over the Central Park West entrance
  room.windows = room.windows || [];
  room.windows.push({ side: 'e', a: -4.6, b: 4.6, y0: room.y + 8.2, y1: room.y + 19.2, mullions: 5, light: false });
}

/** A loose, WPA-style mural: landscape bands, figures and animals as flat silhouettes inside a gilt border. */
function paintMural(g, w, h, seed, theme) {
  const rnd = mulberry(seed);
  const pal = theme === 'africa' ? ['#c9a35c', '#8a5a2c', '#3f4a2c', '#d9c08a', '#6a3a22', '#2c2a22']
    : theme === 'canal' ? ['#7fa3a8', '#3f6a6c', '#c8b07a', '#e0d2a8', '#5a4632', '#24323a']
      : ['#b99a6a', '#6a5a7a', '#d8c79a', '#8a3a2c', '#3a3a4a', '#2a2622'];
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, pal[3]); gr.addColorStop(0.55, pal[0]); gr.addColorStop(1, pal[1]);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // sun / medallion
  g.fillStyle = 'rgba(255,240,200,0.5)';
  g.beginPath(); g.arc(w * (0.3 + rnd() * 0.4), h * 0.24, h * 0.13, 0, 6.3); g.fill();
  // hills
  for (let i = 0; i < 4; i++) {
    g.fillStyle = [pal[2], pal[1], pal[4], pal[2]][i];
    g.globalAlpha = 0.75;
    g.beginPath(); g.moveTo(0, h);
    const base = h * (0.45 + i * 0.1);
    for (let x = 0; x <= w; x += 16) g.lineTo(x, base - Math.sin(x / w * 6.3 * (1 + i * 0.6) + seed + i) * h * 0.06 - Math.sin(x / w * 21 + i * 3) * h * 0.015);
    g.lineTo(w, h); g.closePath(); g.fill();
  }
  g.globalAlpha = 1;
  // figures: robed / standing silhouettes in a frieze
  const n = 9 + Math.floor(rnd() * 5);
  for (let i = 0; i < n; i++) {
    const x = w * (0.08 + 0.84 * (i + rnd() * 0.6) / n), s = h * (0.2 + rnd() * 0.08), y = h * (0.9 - rnd() * 0.06);
    g.fillStyle = [pal[5], pal[4], pal[1], '#e6d9b8'][Math.floor(rnd() * 4)];
    g.beginPath(); g.ellipse(x, y - s * 0.45, s * 0.14, s * 0.45, 0, 0, 6.3); g.fill();
    g.beginPath(); g.arc(x, y - s * 0.98, s * 0.09, 0, 6.3); g.fill();
    if (rnd() > 0.5) { g.strokeStyle = g.fillStyle; g.lineWidth = s * 0.05; g.beginPath(); g.moveTo(x, y - s * 0.7); g.lineTo(x + s * 0.3 * (rnd() > 0.5 ? 1 : -1), y - s * 0.95); g.stroke(); }
  }
  // animals / ships as extra motifs
  for (let i = 0; i < 5; i++) {
    const x = w * (0.1 + rnd() * 0.8), y = h * (0.6 + rnd() * 0.15), s = h * 0.07;
    g.fillStyle = pal[5]; g.globalAlpha = 0.7;
    g.beginPath(); g.ellipse(x, y, s * 1.2, s * 0.55, 0, 0, 6.3); g.fill();
    g.fillRect(x - s * 0.9, y, s * 0.2, s * 0.9); g.fillRect(x + s * 0.6, y, s * 0.2, s * 0.9);
    g.beginPath(); g.ellipse(x + s * 1.3, y - s * 0.5, s * 0.4, s * 0.3, -0.5, 0, 6.3); g.fill();
    g.globalAlpha = 1;
  }
  // craquelure wash + border
  g.fillStyle = 'rgba(90,70,40,0.12)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#b08a3c'; g.lineWidth = w * 0.022; g.strokeRect(w * 0.011, w * 0.011, w - w * 0.022, h - w * 0.022);
  g.strokeStyle = '#6a4e22'; g.lineWidth = 3; g.strokeRect(w * 0.03, w * 0.03, w - w * 0.06, h - w * 0.06);
}

const QUOTES = [
  ['NATURE', 'There is a delight in the hardy life of the open.\nThere are no words that can tell the hidden spirit of the wilderness, that can reveal its mystery, its melancholy and its charm.\nThe nation behaves well if it treats the natural resources as assets which it must turn over to the next generation increased and not impaired in value.'],
  ['MANHOOD', 'A man\'s usefulness depends upon his living up to his ideals insofar as he can.\nIt is hard to fail but it is worse never to have tried to succeed.\nAll daring and courage, all iron endurance of misfortune make for a finer, nobler type of manhood.'],
  ['YOUTH', 'I want to see you game, boys, I want to see you brave and manly, and I also want to see you gentle and tender.\nBe practical as well as generous in your ideals. Keep your eyes on the stars and keep your feet on the ground.'],
  ['THE STATE', 'Ours is a government of liberty by, through, and under the law.\nA great democracy must be progressive or it will soon cease to be great or a democracy.\nIn popular government results worth having can be achieved only by men who combine worthy ideals with practical good sense.'],
];

export function rotunda(ctx) {
  const { room, geo, phys, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  const cx = (x0 + x1) / 2, R = (x1 - x0) / 2;
  const ys = y + room.h - R; // spring line of the vault

  // ---- coffered barrel vault ----
  const N = 20;
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N;
    const p0 = [cx + R * Math.cos(a0), ys + R * Math.sin(a0)], p1 = [cx + R * Math.cos(a1), ys + R * Math.sin(a1)];
    const v0 = R * a0, v1 = R * a1;
    const k0 = 0.8 + 0.2 * Math.sin(a0), k1 = 0.8 + 0.2 * Math.sin(a1);
    geo.quad('coffer', [p0[0], p0[1], z0], [p0[0], p0[1], z1], [p1[0], p1[1], z1], [p1[0], p1[1], z0],
      { uvs: [[z0, v0], [z1, v0], [z1, v1], [z0, v1]], colors: [shade(0xf2ead8, k0), shade(0xf2ead8, k0), shade(0xf2ead8, k1), shade(0xf2ead8, k1)] });
  }
  // cornice at the spring line
  for (const s of [-1, 1]) {
    const xa = s < 0 ? x0 : x1 - 0.7;
    geo.box('stone', xa, ys - 1.5, z0, xa + 0.7, ys, z1, { color: 0xe2d6bd });
    geo.box('stone', s < 0 ? x0 : x1 - 0.35, ys - 2.2, z0, s < 0 ? x0 + 0.35 : x1, ys - 1.5, z1, { color: 0xcfc1a4 });
  }
  // lunette windows at both ends of the vault
  for (const s of [-1, 1]) {
    const zz = s < 0 ? z0 + 0.03 : z1 - 0.03;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, R - 1.6, 0, Math.PI, false);
    shape.lineTo(-(R - 1.6), 0);
    const lg = new THREE.ShapeGeometry(shape, 24);
    if (s > 0) lg.rotateY(Math.PI);
    geo.add('glow', lg, new THREE.Matrix4().makeTranslation(cx, ys + 0.3, zz), [1.5, 1.6, 1.75]);
    for (let k = 1; k < 8; k++) {
      const a = Math.PI * k / 8;
      geo.add('satin', new THREE.BoxGeometry(0.14, R - 1.6, 0.1), new THREE.Matrix4().compose(
        new THREE.Vector3(cx + Math.cos(a) * (R - 1.6) / 2, ys + 0.3 + Math.sin(a) * (R - 1.6) / 2, zz - s * 0.06),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a - Math.PI / 2), new THREE.Vector3(1, 1, 1)), 0x5a4a34);
    }
    lights.anchor(cx, ys + 2, zz - s * 3, { color: 0xeaf2ff, intensity: 190, dist: 44 });
  }
  lights.anchor(x1 - 3, y + 13, 0, { color: 0xeaf2ff, intensity: 150, dist: 40 });
  lights.anchor(cx, y + 6, -9, { color: 0xfff0d8, intensity: 60, dist: 26 });
  lights.anchor(cx, y + 6, 9, { color: 0xfff0d8, intensity: 60, dist: 26 });

  // ---- colossal red marble columns with entablature screens at each end ----
  const colH = 14.6, red = 0x7a3a30;
  for (const s of [-1, 1]) {
    const zc = s * (z1 - 3.4);
    for (const xx of [x0 + 4.6, x1 - 4.6]) column(ctx, xx, y, zc, 0.95, colH, red, 'redmarble', { base: 0.9, cap: 1.3, trim: 0xd8caa8 });
    geo.box('stone', x0, y + colH, zc - 1.0, x1, y + colH + 1.9, zc + 1.0, { color: 0xe0d4ba });
    geo.box('stone', x0, y + colH + 1.9, zc - 1.25, x1, y + colH + 2.3, zc + 1.25, { color: 0xd2c4a6 });
  }
  // engaged columns flanking the east and west doors
  for (const xx of [x0 + 1.05, x1 - 1.05]) for (const s of [-1, 1]) column(ctx, xx, y, s * 5.4, 0.8, colH, red, 'redmarble', { base: 0.9, cap: 1.3, trim: 0xd8caa8 });
  for (const xx of [x0, x1 - 1.9]) {
    geo.box('stone', xx, y + colH, -6.6, xx + 1.9, y + colH + 1.9, 6.6, { color: 0xe0d4ba });
  }

  // ---- murals (north, south and west walls) and Roosevelt's words (east wall) ----
  picture(ctx, { x: cx, y: y + 8.2, z: z0, face: 180, w: 15, h: 8.6 }, (g, w, h) => paintMural(g, w, h, 11, 'canal'));
  picture(ctx, { x: cx, y: y + 8.2, z: z1, face: 0, w: 15, h: 8.6 }, (g, w, h) => paintMural(g, w, h, 23, 'africa'));
  picture(ctx, { x: x0, y: y + 8.6, z: -11.6, face: 90, w: 8.4, h: 8.2 }, (g, w, h) => paintMural(g, w, h, 37, 'treaty'));
  picture(ctx, { x: x0, y: y + 8.6, z: 11.6, face: 90, w: 8.4, h: 8.2 }, (g, w, h) => paintMural(g, w, h, 41, 'africa'));
  const qz = [-14.2, -9.0, 9.0, 14.2];
  QUOTES.forEach((q, i) => textPanel(ctx, { x: x1, y: y + 5.4, z: qz[i], face: 270, w: 4.6, h: 6.2, heading: q[0], text: q[1], bg: '#dbcfb6', fg: '#6a5740', size: 50, headSize: 92 }));

  // floor inlay around the dinosaur island
  const ix0 = cx - 5.9, ix1 = cx + 5.9, iz0 = -13.2, iz1 = 15.4;
  for (const [a, b, c2, d] of [[ix0 - 0.5, iz0 - 0.5, ix1 + 0.5, iz0], [ix0 - 0.5, iz1, ix1 + 0.5, iz1 + 0.5], [ix0 - 0.5, iz0, ix0, iz1], [ix1, iz0, ix1 + 0.5, iz1]]) {
    geo.floor('redmarble', a, b, c2, d, y + 0.004, { color: 0x8a3f33 });
  }

  // ---- the Barosaurus group on its island ----
  const iy = y + 0.38;
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, 4.9, 13.2, 0, Math.PI * 2);
  const ig = new THREE.ExtrudeGeometry(shape, { depth: 0.38, bevelEnabled: false, curveSegments: 40 });
  ig.rotateX(-Math.PI / 2);
  geo.add('darkmarble', ig, xform(cx, y, 1.1), 0x4a4640);
  const ig2 = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false, curveSegments: 40 });
  ig2.rotateX(-Math.PI / 2);
  geo.add('ground', ig2, new THREE.Matrix4().makeScale(0.95, 1, 0.975).setPosition(cx, iy, 1.1), 0xa89678);
  // collision: ellipse approximated by overlapping boxes
  for (let k = 0; k < 7; k++) {
    const t = (k + 0.5) / 7, zz = 13.2 * (1 - t) , xx = 4.9 * Math.sqrt(1 - (zz / 13.2) ** 2);
    phys.box(cx - xx, 1.1 - zz, cx + xx, 1.1 + zz, y, y + 3);
  }
  const put = (name, opts, x, z, rotDeg, s = 1) => {
    const m = model('skeletons', name, opts);
    geo.addGeo(m, xform(x, iy + 0.03, z, rotDeg * Math.PI / 180, s));
    const b = geoBounds(m);
    blob(geo, x, iy + 0.02, z, Math.min(6, (b.max[0] - b.min[0]) * 0.3 * s), Math.min(3, (b.max[2] - b.min[2]) * 0.5 * s + 0.6), rotDeg);
    return b;
  };
  // adult rears to face the attacker to the north; the juvenile shelters behind her
  put('barosaurus', {}, cx + 0.3, 2.2, 90);
  put('barosaurus_juvenile', {}, cx - 2.3, 8.6, 78);
  put('allosaurus', { pose: 'attack' }, cx - 0.6, -7.6, -96);

  ctx.placard({
    id: 'barosaurus', star: true, title: 'Barosaurus', sub: 'Barosaurus lentus — Late Jurassic, 150 million years ago',
    text: 'A Barosaurus rears fifty feet into the vault to protect her young from an attacking Allosaurus. It is the tallest free-standing dinosaur mount in the world; the bones are casts, because real fossil is far too heavy and fragile to lift so high. Whether a sauropod could really rear like this is still debated.',
    x: cx + 6.6, y, z: 3.4, face: 90, size: 0.95,
    target: [cx, y + 9, 1],
    view: { x: x1 - 2.6, y, z: 9.5, yaw: 300, pitch: 24 },
  });
  ctx.placard({
    id: 'allosaurus-rotunda', star: true, title: 'Allosaurus', sub: 'Allosaurus fragilis — Late Jurassic',
    text: 'The top predator of the Morrison Formation lunges at the young Barosaurus. Allosaurus and Barosaurus lived side by side in what is now the American West.',
    x: cx - 6.5, y, z: -8.2, face: 270,
    target: [cx - 0.6, y + 3, -7.6],
    view: { x: x0 + 2.4, y, z: -11.5, yaw: 115, pitch: 10 },
  });
  ctx.placard({
    title: 'Young Barosaurus', sub: 'Juvenile, sheltering behind its mother',
    text: 'No juvenile Barosaurus skeleton has been found; this one was sculpted by scaling down the adult\'s bones.',
    x: cx - 6.5, y, z: 9.2, face: 270, target: [cx - 2.3, y + 2, 8.6],
  });
  ctx.placard({
    title: 'Theodore Roosevelt Rotunda', sub: 'John Russell Pope, architect — dedicated 1936',
    text: 'New York State\'s memorial to its 33rd Governor and the nation\'s 26th President. The hall is 67 by 120 feet beneath a 100-foot coffered barrel vault, with 48-foot columns of red Alicante marble. William Andrew Mackay\'s murals (1935) show the Panama Canal, the Treaty of Portsmouth and Roosevelt\'s African expedition; the east wall carries his words on Nature, Manhood, Youth and the State.',
    x: x1 - 5.5, y, z: -4.6, face: 270, list: false,
  });

  // information desk and ticketing by the entrance
  for (const s of [-1, 1]) {
    const dz = s * 11.6;
    geo.box('wood', x1 - 3.4, y, dz - 2.6, x1 - 2.5, y + 1.1, dz + 2.6, { color: 0x5a4028, top: 0x2a2622 });
    phys.box(x1 - 3.4, dz - 2.6, x1 - 2.5, dz + 2.6, y, y + 1.2);
    ctx.sign(s < 0 ? 'TICKETS' : 'INFORMATION', x1 - 3.42, y + 0.7, dz, 270, 0.26, { color: '#e9dcc0' });
  }
  ctx.sign('AKELEY HALL OF AFRICAN MAMMALS', x0 + 0.02, y + 6.4, 0, 90, 0.36, { color: '#6a5740' });
  ctx.sign('ASIAN MAMMALS', cx, y + 5.9, z1 - 0.02, 0, 0.34, { color: '#6a5740' });
  ctx.sign('ROSE CENTER FOR EARTH AND SPACE', cx, y + 5.9, z0 + 0.02, 180, 0.34, { color: '#6a5740' });
  bench(ctx, x0 + 3.2, y, -11.5, 90); bench(ctx, x0 + 3.2, y, 11.5, 90);

  ctx.view('main', x1 - 2.2, y, 0, 270, 12);
  ctx.view('entry', x1 - 1.4, y, 0, 270, 14);
  void rope; void pedestal; void ellipsoid; void tube;
}

// ---------------------------------------------------------------------------
// Floor 1: Theodore Roosevelt Memorial Hall
// ---------------------------------------------------------------------------
export function memorial(ctx) {
  const { room, geo, phys } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  const cx = (x0 + x1) / 2;
  // four dioramas of places that shaped Roosevelt
  const items = [
    { at: -14.2, title: 'Old New York', sub: 'New Amsterdam, 1660', biome: 'coast', seed: 3, text: 'Peter Stuyvesant receives a delegation of Lenape at the tip of Manhattan. Roosevelt\'s Dutch ancestors arrived in the colony in the 1640s.', scene: (d) => { d.grass(40).rocks(4, 0.2).tree('broadleaf', -1.8, -2.6, 2.6); } },
    { at: -8.6, title: 'Elkhorn Ranch', sub: 'Little Missouri River, North Dakota', biome: 'canyon', seed: 4, text: 'The badlands ranch where the young Roosevelt retreated in 1884 and became a conservationist. Bison and pronghorn graze the bottomland.', scene: (d) => { d.animal('bison', -0.8, -1.8, 10, { seed: 1 }, 0.9); d.animal('deer', 1.5, -2.4, 170, { seed: 2 }); d.grass(40, { color: 0x9a8a50 }).bush(2.2, -1.2, 0.5, 0x7a7a48); } },
  ];
  const items2 = [
    { at: 8.6, title: 'Adirondacks', sub: 'Mount Marcy region, New York', biome: 'autumn', seed: 5, text: 'Roosevelt was hiking here in September 1901 when word came that President McKinley was dying.', scene: (d) => { d.animal('deer', -0.6, -1.8, 12, { seed: 3 }); d.tree('conifer', 1.9, -2.6, 2.8).tree('broadleaf', -2.0, -2.8, 2.6, 0xb8642c).grass(40, { color: 0x8a7a3a }).rocks(3, 0.3); } },
    { at: 14.2, title: 'Bird Sanctuary', sub: 'Oyster Bay, Long Island', biome: 'broadleaf', seed: 6, text: 'The woods around Sagamore Hill, where Roosevelt kept lists of the birds he saw from boyhood.', scene: (d) => { d.animal('heron', -0.6, -1.5, 15, { seed: 1 }); d.animal('eagle', 1.4, -2.3, 170, { seed: 1 }, 1, ); d.tree('broadleaf', 2.0, -2.8, 2.8).bush(-2.0, -2.4, 0.7).grass(50); } },
  ];
  dioramaRun(ctx, { side: 'w', a: z0, b: -6.2, depth: 3.4, items: items.map((i) => ({ ...i, w: 4.2, h: 2.6 })) });
  dioramaRun(ctx, { side: 'w', a: 6.2, b: z1, depth: 3.4, items: items2.map((i) => ({ ...i, w: 4.2, h: 2.6 })) });

  // bronze of Roosevelt seated on a bench
  const bx = cx + 2, bz = 0;
  geo.rbox('bronze', bx, y + 0.42, bz, 0.6, 0.08, 2.6, 0, { color: 0x6a5234 });
  for (const s of [-1, 1]) geo.rbox('bronze', bx, y, bz + s * 1.1, 0.5, 0.42, 0.1, 0, { color: 0x6a5234 });
  const fig = (g, c, r) => geo.add('bronze', ellipsoid(c, r, { seg: 10, rings: 8 }), xform(bx, y, bz - 0.3), 0x7a5c38) && g;
  fig(0, [0, 0.62, 0], [0.22, 0.2, 0.26]); // hips
  fig(0, [0, 1.0, 0], [0.22, 0.34, 0.27]); // torso
  fig(0, [0.02, 1.48, 0], [0.13, 0.15, 0.12]); // head
  geo.add('bronze', tube([[0.1, 0.6, -0.14], [0.52, 0.56, -0.16], [0.56, 0.08, -0.16]], 0.085, { radial: 7 }), xform(bx, y, bz - 0.3), 0x7a5c38);
  geo.add('bronze', tube([[0.1, 0.6, 0.14], [0.52, 0.56, 0.16], [0.56, 0.08, 0.16]], 0.085, { radial: 7 }), xform(bx, y, bz - 0.3), 0x7a5c38);
  geo.add('bronze', tube([[0, 1.25, -0.3], [0.12, 0.95, -0.36], [0.36, 0.78, -0.2]], 0.06, { radial: 6 }), xform(bx, y, bz - 0.3), 0x7a5c38);
  geo.add('bronze', tube([[0, 1.25, 0.3], [0.1, 0.95, 0.4], [0.2, 0.62, 0.62]], 0.06, { radial: 6 }), xform(bx, y, bz - 0.3), 0x7a5c38);
  phys.box(bx - 0.4, bz - 1.4, bx + 0.7, bz + 1.4, y, y + 1.5);
  blob(geo, bx, y, bz, 1.0, 1.7);
  ctx.placard({
    id: 'troosevelt', title: 'Theodore Roosevelt', sub: 'Bronze, 2012',
    text: 'Roosevelt as he looked on a 1903 camping trip to Yosemite with John Muir. His father was one of the museum\'s founders; its charter was signed in the family parlour in 1869.',
    x: bx + 1.5, y, z: bz + 1.9, face: 90, target: [bx, y + 1.1, bz],
  });
  // wall texts on his four lives
  const themes = [['Young Naturalist', 'A boyhood "Roosevelt Museum of Natural History" began with a seal\'s skull bought on Broadway.'], ['Firebrand', 'Rancher, Rough Rider, Governor — and President at forty-two.'], ['Conservation President', 'He protected some 230 million acres: five national parks, eighteen monuments and 150 national forests.'], ['Lifelong Explorer', 'After the White House came a year in Africa and a near-fatal descent of the River of Doubt.']];
  themes.forEach((t, i) => {
    const zz = [-12.5, -6.5, 6.5, 12.5][i];
    textPanel(ctx, { x: x1, y: y + 2.5, z: zz, face: 270, w: 3.6, h: 2.6, heading: t[0], text: t[1], bg: '#2a2622', fg: '#e9dcc0', size: 46, headSize: 70, align: 'left' });
  });
  ctx.sign('THEODORE ROOSEVELT MEMORIAL HALL', x0 + 3.42, y + 4.6, 0, 90, 0.3, { color: '#6a5740' });
  // closed bronze doors to the street
  geo.box('bronze', x1 - 0.06, y, -2.6, x1, y + 3.4, 2.6, { color: 0x5a4630 });
  ctx.view('main', x1 - 3, y, 3, 270, 0);
  void bench; void rope; void column; void pedestal; void THREE;
}
