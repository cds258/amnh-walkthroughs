// Cultural halls, Gems and Minerals, Human Origins, Primates, Biodiversity and the smaller connecting rooms.
import * as THREE from 'three';
import { xform, shade, col, mulberry } from '../../engine/builder.js';
import { textPanel, picture } from '../../engine/placards.js';
import { bench, blob, island, pedestal, vitrine, rope } from '../furniture.js';
import { model } from '../../models/index.js';
import { mount } from '../mounts.js';
import { ellipsoid, tube, rod } from '../../models/loft.js';
import { lump } from '../../models/rocks.js';
import { local, wallCase, caseRow, fillPots, fillMasks, fillCrystals, carvedPost, pattern, landscape, crystals, plant, pot, mask } from '../kit.js';

const mid = (r) => [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2];
const title = (ctx, text, side, color = '#6a5238', h = 0.28) => {
  const r = ctx.room, [cx, cz] = mid(r), y = r.y + r.h - 0.75;
  if (side === 'n') ctx.sign(text, cx, y, r.z0 + 0.02, 180, h, { color });
  else if (side === 's') ctx.sign(text, cx, y, r.z1 - 0.02, 0, h, { color });
  else if (side === 'w') ctx.sign(text, r.x0 + 0.02, y, cz, 90, h, { color });
  else ctx.sign(text, r.x1 - 0.02, y, cz, 270, h, { color });
};
/** Themed case rows down both long walls of a room. secs: [{t, s, text, fill, back}] */
function caseWalls(ctx, sides, secs, o = {}) {
  const r = ctx.room;
  const per = Math.ceil(secs.length / sides.length);
  sides.forEach((side, si) => {
    const horiz = side === 'n' || side === 's';
    const a = (horiz ? r.x0 : r.z0) + (o.inset ?? 1.5), b = (horiz ? r.x1 : r.z1) - (o.inset ?? 1.5);
    const list = secs.slice(si * per, (si + 1) * per);
    caseRow(ctx, side, a, b, list.length, (i) => {
      const s = list[i];
      return { h: o.h ?? 2.0, d: o.d ?? 0.7, back: s.back ?? o.back, frame: o.frame, li: o.li, lc: o.lc, glow: o.glow, fill: s.fill, w: o.w,
        label: { id: s.id, star: s.star, title: s.t, sub: s.s, text: s.text } };
    });
  });
}
/** Shields / boards hung on the back of a case. */
const fillShields = (colors, seed = 1) => (L, w, h, d, deck) => {
  const r = mulberry(seed * 19 + 5), n = Math.max(2, Math.floor(w / 0.8));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * w / n, hh = h * (0.5 + r() * 0.3);
    L.add('satin', ellipsoid([0, 0, 0], [0.22 + r() * 0.1, hh / 2, 0.04], { seg: 10, rings: 8 }), x, deck + h * 0.5, 0.12, 0, 1, colors[Math.floor(r() * colors.length)]);
    L.add('satin', ellipsoid([0, 0, 0], [0.08, hh * 0.3, 0.02], { seg: 8, rings: 6 }), x, deck + h * 0.5, 0.17, 0, 1, colors[Math.floor(r() * colors.length)]);
  }
};
/** Textile panels on the back of a case. */
const fillTextiles = (kind, cols, seed = 1) => (L, w, h, d, deck) => {
  const n = Math.max(1, Math.floor(w / 1.6));
  for (let i = 0; i < n; i++) L.picture({ lx: -w / 2 + (i + 0.5) * w / n, ly: deck + h * 0.52, lz: 0.05, w: w / n - 0.3, h: h * 0.8, px: 512, unlit: true }, pattern(kind, cols, seed + i));
};
/** Boxes / chests on the deck. */
const fillBoxes = (colors, seed = 1) => (L, w, h, d, deck) => {
  const r = mulberry(seed * 29 + 3), n = Math.max(2, Math.floor(w / 0.75));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * w / n, s = 0.2 + r() * 0.16;
    L.box('satin', x - s, deck, d * 0.5 - s * 0.7, x + s, deck + s * 1.5, d * 0.5 + s * 0.7, colors[Math.floor(r() * colors.length)]);
    L.box('satin', x - s * 1.06, deck + s * 1.5, d * 0.5 - s * 0.75, x + s * 1.06, deck + s * 1.62, d * 0.5 + s * 0.75, colors[Math.floor(r() * colors.length)]);
    L.add('satin', ellipsoid([0, 0, 0], [s * 0.6, s * 0.5, 0.01], { seg: 8, rings: 5 }), x, deck + s * 0.75, d * 0.5 + s * 0.71, 0, 1, 0x101010);
  }
};
const both = (...fs) => (L, w, h, d, deck) => fs.forEach((f) => f(L, w, h, d, deck));

// ---------------------------------------------------------------------------
// Northwest Coast Hall (floor 1)
// ---------------------------------------------------------------------------
function canoe(len, beam, depth) {
  const NI = 40, NJ = 12, pos = [], cl = [], idx = [];
  const red = col(0x8a2218), black = col(0x1a1614), wood = col(0x3a281c);
  for (let i = 0; i <= NI; i++) {
    const t = -1 + 2 * i / NI, at = Math.abs(t);
    const b = beam / 2 * Math.pow(Math.max(0, 1 - Math.pow(at, 2.6)), 0.75);
    const dp = depth * (1 - 0.35 * at * at * at);
    const sheer = depth * 0.95 * Math.pow(at, 3.2) * (t > 0 ? 1.25 : 0.85);
    for (let j = 0; j <= NJ; j++) {
      const ph = -Math.PI / 2 + Math.PI * j / NJ;
      const edge = Math.abs(ph) > 1.15;
      pos.push(t * len / 2 + (edge ? Math.sign(t) * Math.pow(at, 4) * 0.9 : 0), -dp * Math.cos(ph) + sheer + dp, b * Math.sin(ph));
      const c = edge ? ((Math.floor((t + 1) * 24) % 3) ? black : red) : (at > 0.8 ? ((Math.floor(Math.abs(ph) * 3.2 + at * 22) % 3) ? black : red) : wood);
      cl.push(c[0], c[1], c[2]);
    }
  }
  for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) {
    const a = i * (NJ + 1) + j, b2 = a + NJ + 1;
    idx.push(a, b2, a + 1, a + 1, b2, b2 + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const NWC = ['Tlingit', 'Haida', 'Tsimshian', 'Nisg̱a\'a', 'Gitxsan', 'Haíłzaqv', 'Nuxalk', 'Kwakwa̱ka̱\'wakw', 'Nuu-chah-nulth', 'Coast Salish'];
const NWC_COLS = [0x7a2a1e, 0x16181a, 0x2f6a66, 0xd9cfb0, 0x8a6a4a];
export function nwcoast(ctx) {
  const { room, geo, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  // the Great Canoe, suspended inside the north entrance
  const cz = z0 + 14.5, cy = y + 2.5;
  geo.add('flat_ds', canoe(19.2, 2.5, 1.25), xform(0, cy, cz, Math.PI / 2), 0xffffff);
  for (const dz of [-6.5, -2.2, 2.2, 6.5]) for (const s of [-1, 1]) geo.add('metal', rod([s * 0.9, cy + 1.1, cz + dz], [s * 0.9, y + room.h, cz + dz], 0.012, 0.012, { seg: 4 }), null, 0x8a8a8a);
  blob(geo, 0, y, cz, 1.6, 9.5);
  lights.anchor(0, y + 5, cz, { color: 0xffe2b8, intensity: 40, dist: 18 });
  ctx.placard({ id: 'greatcanoe', star: true, size: 0.9, title: 'The Great Canoe', sub: 'Haida and Haíłzaqv · carved about 1878 · 63 feet',
    text: 'Carved from a single western red cedar, this is one of the largest dugout canoes in existence, with features of both Haida and Haíłzaqv (Heiltsuk) design. It reached the museum in 1883 by ship, rail and horse cart. After decades in the Grand Gallery next door it was conserved and raised here when the hall reopened in 2022.',
    x: 3.0, y, z: cz + 2, face: 90, target: [0, cy + 0.4, cz], view: { x: 5.6, y, z: cz + 8.5, yaw: 318, pitch: 6 } });
  // carved house posts and poles down both sides
  const zs = [0, 1, 2, 3, 4, 5].map((i) => z0 + 10.5 + i * 6.4);
  zs.forEach((zz, i) => {
    carvedPost(ctx, x0 + 1.0, y, zz, 90, 4.6 + (i % 2) * 0.5, 0.36, i + 1, NWC_COLS);
    carvedPost(ctx, x1 - 1.0, y, zz, 270, 4.6 + ((i + 1) % 2) * 0.5, 0.36, i + 11, NWC_COLS);
  });
  // two great poles flanking the canoe
  carvedPost(ctx, x0 + 4.2, y, z0 + 5, 135, 5.4, 0.5, 31, NWC_COLS);
  carvedPost(ctx, x1 - 4.2, y, z0 + 5, 225, 5.4, 0.5, 32, NWC_COLS);
  // one alcove per nation
  const fills = (i) => (i % 3 === 0 ? both(fillMasks(NWC_COLS, i + 1), fillBoxes(NWC_COLS, i)) : i % 3 === 1 ? both(fillTextiles('diamonds', ['#d9cfb0', '#7a2a1e', '#16181a', '#2f6a66'], i), fillBoxes(NWC_COLS, i + 4)) : fillMasks(NWC_COLS, i + 7));
  const secs = NWC.map((n, i) => ({ t: n, s: 'Northwest Coast Hall', text: `Regalia, feast dishes, bentwood boxes and carvings of the ${n}, chosen and interpreted with consulting curators from the community.`, fill: fills(i), back: 0xcbbf9f }));
  caseWalls(ctx, ['w', 'e'], secs, { inset: 10.5, h: 2.1, d: 0.8, w: 5.2 });
  for (const zz of [z0 + 21.8, z0 + 32.2, z0 + 42.8]) bench(ctx, 0, y, zz, 90, 2.4);
  for (const zz of [z0 + 27, z0 + 43]) lights.anchor(0, y + 4.8, zz, { color: 0xffe2b8, intensity: 30, dist: 20 });
  textPanel(ctx, { x: x1 - 0.03, y: y + 2.5, z: z0 + 3.5, face: 270, w: 4.6, h: 2.3, heading: 'Northwest Coast Hall', text: 'The museum\'s first permanent exhibition hall opened in 1899 under Franz Boas. It was rebuilt between 2017 and 2022 with curators from ten Native Nations of the Pacific Northwest, whose territories run from southern Alaska to Washington State.', bg: '#3a2a1e', fg: '#eadcc0', headSize: 70, size: 38 });
  ctx.view('main', 0, y, z0 + 2.4, 180, 8);
}

export function grand(ctx) {
  const { room, geo, phys, lights } = ctx;
  const y = room.y, { z1 } = room;
  // 77th Street doors
  for (const x of [-5, 0, 5]) {
    geo.box('bronze', x - 1.5, y, z1 - 0.12, x + 1.5, y + 3.4, z1 - 0.02, { color: 0x6a4a2a });
    geo.box('glassblue', x - 1.25, y + 0.3, z1 - 0.16, x + 1.25, y + 3.1, z1 - 0.12, { color: 0xbcd4e4 });
    geo.box('bronze', x - 0.03, y, z1 - 0.2, x + 0.03, y + 3.4, z1 - 0.1, { color: 0x6a4a2a });
  }
  ctx.sign('WEST 77TH STREET', 0, y + 4.0, z1 - 0.03, 0, 0.3, { color: '#6a5238' });
  // information desk
  island(ctx, -3, 92.4, 3, 94, y, 1.05, 0x4a3626, 'wood', 0x2a2420);
  ctx.sign('INFORMATION · TICKETS', 0, y + 0.7, 92.38, 180, 0.2, { color: '#eadcc0', sans: true });
  lights.anchor(0, y + 4.6, 95, { color: 0xfff0dc, intensity: 34, dist: 20 });
  ctx.placard({ title: 'Grand Gallery', sub: 'West 77th Street entrance', text: 'The museum\'s original front door, in the Romanesque Revival façade of 1900. For most of the twentieth century the 63-foot Great Canoe stood in this room; since 2022 it has hung in the Northwest Coast Hall straight ahead.', x: 6.5, y, z: 90.5, face: 180 });
  for (const x of [-12, 12]) { plant(ctx, x, y, 103, 2.6, x + 20); bench(ctx, x, y, 98, 0, 2.4); }
  ctx.view('main', 0, y, z1 - 3, 0, 2);
  void phys;
}

// ---------------------------------------------------------------------------
// African Peoples, Asian Peoples, Mexico & Central America, South American Peoples, Pacific Peoples
// ---------------------------------------------------------------------------
const EARTH = [0x8a5a3a, 0x5a3a26, 0xb8865a, 0x2a2018, 0xc9a25e];
export function africanpeoples(ctx) {
  const { room, geo, lights } = ctx;
  const y = room.y, { z0, z1 } = room;
  const secs = [
    { t: 'River Valley', s: 'Ancient Egypt and Nubia', text: 'Farming along the Nile supported some of the world\'s first states.', fill: fillPots([0xb8865a, 0x8a5a3a, 0xd9c9a0], 1) },
    { t: 'Grasslands', s: 'Pastoralists of East Africa', text: 'For the Pokot, Maasai and their neighbours, cattle are wealth, food and the heart of ceremony.', fill: both(fillShields([0x8a2a1e, 0xd9cfb0, 0x16181a], 2), fillPots(EARTH, 2, ['bowl', 'jar'])) },
    { t: 'Forest-Woodland', s: 'Central and West Africa', text: 'Masks dance at initiations, funerals and harvests, giving a face to spirits and ancestors.', fill: fillMasks(EARTH, 3) },
    { t: 'Yoruba Masquerade', s: 'Nigeria', text: 'Egungun costumes of layered cloth honour the returning dead.', fill: fillTextiles('stripes', ['#8a2a1e', '#d9b030', '#1e3a6a', '#eadcc0', '#16181a'], 3) },
    { t: 'Desert', s: 'Peoples of the Sahara and Kalahari', text: 'Salt caravans, oasis farming and the foraging knowledge of the San.', fill: both(fillTextiles('steps', ['#d9cfb0', '#1e3a6a', '#8a2a1e'], 5), fillPots(EARTH, 5, ['bottle', 'bowl'])) },
    { t: 'Kingdom of Benin', s: 'Nigeria', text: 'Brass heads and plaques cast for the royal court of the Oba.', fill: fillMasks([0xb8862a, 0x8a6a2a, 0xc9a23a], 6) },
    { t: 'Music and Dance', s: 'Drums, harps and thumb pianos', text: 'Instruments that speak: talking drums reproduce the tones of language.', fill: fillPots([0x6a4a2a, 0x8a6a4a], 7, ['jar', 'vase']) },
    { t: 'Ethiopia', s: 'Highland Christianity', text: 'Processional crosses and painted icons from one of the world\'s oldest Christian kingdoms.', fill: fillShields([0xb8862a, 0x8a2a1e, 0x1e3a6a], 8) },
  ];
  caseWalls(ctx, ['w', 'e'], secs, { inset: 3, back: 0xd6c8a8 });
  // drums in the centre
  for (const [zz, s] of [[z0 + 16, 1], [z0 + 36, 0.8]]) {
    island(ctx, -1.6, zz - 1.2, 1.6, zz + 1.2, y, 0.3, 0x3a2a1e, 'wood');
    for (const [dx, h, r] of [[-0.9, 1.1, 0.3], [0, 1.4, 0.36], [0.9, 0.9, 0.26]]) {
      geo.cyl('wood', dx, y + 0.3, zz, r * s, h * s, { rTop: r * 1.2 * s, color: 0x6a4428, seg: 14 });
      geo.cyl('flat', dx, y + 0.3 + h * s, zz, r * 1.22 * s, 0.03, { color: 0xd9c9a0, seg: 14 });
    }
    lights.anchor(0, y + 4.6, zz, { color: 0xffe2b8, intensity: 26, dist: 18 });
  }
  bench(ctx, 0, y, z0 + 26, 90, 2.4); bench(ctx, 0, y, z1 - 8, 90, 2.4);
  title(ctx, 'HALL OF AFRICAN PEOPLES', 'n');
  ctx.view('main', 0, y, z0 + 2.5, 180, 0);
}

export function asianpeoples(ctx) {
  const { room, geo, lights } = ctx;
  const y = room.y, [cx, cz] = mid(room);
  const blue = [0x2a4a8a, 0xe8e4d8, 0x8a2a1e, 0xc9a23a, 0x2f6a4a];
  const secs = [
    { t: 'Early Asia', s: 'From Homo erectus to the first cities', text: 'Stone tools, early farming and the bronze foundries of Shang China.', fill: fillPots([0x8a7a5a, 0x5a6a5a, 0xb8a888], 1) },
    { t: 'Samarkand and the Silk Road', s: 'Central Asia', text: 'For 1,500 years caravans carried silk, glass, religions and ideas between China and the Mediterranean.', fill: both(fillTextiles('diamonds', ['#8a2a1e', '#1e3a6a', '#d9b030', '#eadcc0'], 2), fillPots(blue, 2)) },
    { t: 'China', s: 'Scholars, farmers and a wedding procession', text: 'A bride travelled to her husband\'s family in a carved and gilded sedan chair.', fill: fillPots([0x2a4a8a, 0xe8e4d8, 0x2a4a8a], 3, ['vase', 'jar', 'bottle']) },
    { t: 'Japan', s: 'Samurai, Shinto and the tea ceremony', text: 'Armour of lacquered plates laced with silk.', fill: both(fillShields([0x16181a, 0x8a2a1e, 0xc9a23a], 4), fillBoxes([0x16181a, 0x8a2a1e], 4)) },
    { t: 'Korea', s: 'A scholar\'s study', text: 'Celadon, brush and inkstone: the tools of the Confucian gentleman.', fill: fillPots([0x8ab0a0, 0xa8c8b8, 0xe8e4d8], 5) },
    { t: 'India', s: 'Village life and the great religions', text: 'Hindu, Buddhist, Jain and Muslim traditions in dance, sculpture and daily ritual.', fill: both(fillTextiles('dots', ['#8a2a1e', '#d9b030', '#2f6a4a', '#eadcc0'], 6), fillMasks([0xb8862a, 0x8a2a1e, 0x2f6a4a], 6)) },
    { t: 'Tibet', s: 'A Buddhist shrine', text: 'Gilded images, butter lamps and painted thangkas from the roof of the world.', fill: both(fillTextiles('steps', ['#8a2a1e', '#d9b030', '#1e3a6a', '#2f6a4a'], 7), fillPots([0xc9a23a, 0xb8862a], 7, ['bowl', 'bottle'])) },
    { t: 'Siberia', s: 'Peoples of the taiga and tundra', text: 'Shamans\' drums and reindeer-skin clothing collected by the Jesup North Pacific Expedition of 1897–1902.', fill: both(fillMasks([0x8a6a4a, 0xd9cfb0], 8), fillBoxes([0x6a4a2a, 0x8a6a4a], 8)) },
  ];
  caseWalls(ctx, ['n', 's'], secs, { inset: 7, back: 0xd9ccb0 });
  // centrepiece: a painted sedan chair on a dais
  island(ctx, cx - 2, cz - 1.5, cx + 2, cz + 1.5, y, 0.3, 0x4a2a1e, 'wood');
  geo.box('gloss', cx - 0.7, y + 0.6, cz - 0.6, cx + 0.7, y + 2.1, cz + 0.6, { color: 0x8a1e16 });
  geo.box('gloss', cx - 0.85, y + 2.1, cz - 0.75, cx + 0.85, y + 2.3, cz + 0.75, { color: 0xc9a23a });
  geo.add('gloss', new THREE.ConeGeometry(1.1, 0.5, 4).rotateY(Math.PI / 4), xform(cx, y + 2.55, cz), 0x8a1e16);
  for (const s of [-1, 1]) geo.box('wood', cx - 2.3, y + 0.8, cz + s * 0.66, cx + 2.3, y + 0.88, cz + s * 0.74, { color: 0x5a1e16 });
  ctx.placard({ id: 'bridalchair', title: 'Bridal Sedan Chair', sub: 'China · Qing dynasty', text: 'Lacquered red — the colour of joy — and carried by bearers, the chair delivered a bride in a noisy procession from her parents\' house to her husband\'s.', x: cx + 2.9, y, z: cz + 0.8, face: 90, target: [cx, y + 1.5, cz] });
  for (const dx of [-16, 0, 16]) lights.anchor(cx + dx, y + 4.6, cz, { color: 0xffe2b8, intensity: 28, dist: 20 });
  bench(ctx, cx - 9, y, cz, 0, 2.4); bench(ctx, cx + 9, y, cz, 0, 2.4);
  title(ctx, 'STOUT HALL OF ASIAN PEOPLES', 'n');
  ctx.view('main', room.x0 + 3, y, cz, 90, 0);
}
export function asianpeoples2(ctx) {
  const { room, lights } = ctx;
  const y = room.y, [cx, cz] = mid(room);
  const secs = [
    { t: 'Islamic Asia', s: 'From Arabia to Indonesia', text: 'Calligraphy, metalwork and textiles of the Muslim world.', fill: both(fillTextiles('diamonds', ['#1e3a6a', '#eadcc0', '#c9a23a', '#2f6a4a'], 11), fillPots([0x2a4a8a, 0xc9a23a], 11, ['bottle', 'vase'])) },
    { t: 'Armenia and the Caucasus', s: 'Crossroads of empires', text: 'Carpets, silver and carved stone crosses.', fill: fillTextiles('steps', ['#8a2a1e', '#1e3a6a', '#eadcc0'], 12) },
    { t: 'Southeast Asia', s: 'Shadow theatre and the rice cycle', text: 'Javanese wayang puppets act out the Hindu epics by lamplight.', fill: fillMasks([0xc9a23a, 0x8a2a1e, 0xe8e4d8], 13) },
    { t: 'The Ainu', s: 'Hokkaido, Japan', text: 'Robes of elm-bark fibre appliquéd with protective designs.', fill: fillTextiles('diamonds', ['#1e2a4a', '#eadcc0', '#8a2a1e'], 14) },
  ];
  caseWalls(ctx, ['e', 's'], secs, { inset: 3, back: 0xd9ccb0 });
  lights.anchor(cx, y + 4.6, cz, { color: 0xffe2b8, intensity: 28, dist: 20 });
  bench(ctx, cx, y, cz, 0, 2.4);
}

function olmecHead(L, s = 1, color = 0x56514a) {
  const A2 = (g, c = color) => L.add('flat', g, 0, 0, 0, 0, s, c);
  A2(ellipsoid([0, 1.15, 0], [1.05, 1.2, 0.98], { seg: 22, rings: 16 }));
  A2(ellipsoid([0, 1.95, 0], [1.02, 0.55, 0.96], { seg: 20, rings: 8 }), shade(color, 0.86)); // helmet
  A2(ellipsoid([0, 1.62, 0.5], [0.95, 0.1, 0.55], { seg: 14, rings: 5 }), shade(color, 0.7)); // helmet band
  for (const k of [-1, 1]) {
    A2(ellipsoid([k * 0.4, 1.32, 0.84], [0.24, 0.1, 0.1], { seg: 10, rings: 6 }), shade(color, 0.55)); // eyes
    A2(ellipsoid([k * 0.4, 1.47, 0.82], [0.3, 0.07, 0.12], { seg: 10, rings: 5 }), shade(color, 0.95)); // brow
    A2(ellipsoid([k * 1.02, 1.2, 0.05], [0.12, 0.5, 0.3], { seg: 8, rings: 6 }), shade(color, 0.85)); // ear flaps
    A2(ellipsoid([k * 0.5, 0.82, 0.74], [0.3, 0.26, 0.22], { seg: 10, rings: 6 })); // cheeks
  }
  A2(ellipsoid([0, 1.02, 0.98], [0.3, 0.26, 0.2], { seg: 10, rings: 8 })); // nose
  A2(ellipsoid([0, 0.66, 0.9], [0.42, 0.1, 0.16], { seg: 12, rings: 6 }), shade(color, 1.05)); // upper lip
  A2(ellipsoid([0, 0.5, 0.88], [0.38, 0.09, 0.15], { seg: 12, rings: 6 }), shade(color, 1.02)); // lower lip
  A2(ellipsoid([0, 0.58, 0.95], [0.34, 0.02, 0.1], { seg: 10, rings: 4 }), shade(color, 0.4));
  A2(ellipsoid([0, 0.3, 0.6], [0.5, 0.26, 0.4], { seg: 10, rings: 6 })); // chin
}
export function mexico(ctx) {
  const { room, geo, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room, [cx, cz] = mid(room);
  // Olmec colossal head
  const hx = x1 - 9, hz = cz;
  island(ctx, hx - 1.9, hz - 1.9, hx + 1.9, hz + 1.9, y, 0.35, 0x3a2e24, 'wood');
  olmecHead(local(ctx, hx, y + 0.35, hz, 90), 1.12);
  blob(geo, hx, y + 0.36, hz, 1.6, 1.6);
  lights.anchor(hx + 3, y + 4.6, hz, { color: 0xffe2b8, intensity: 46, dist: 16 });
  ctx.placard({ id: 'olmechead', star: true, size: 0.86, title: 'Colossal Olmec Head', sub: 'Cast of San Lorenzo Monument 1 · Veracruz, Mexico · about 1200–900 BCE',
    text: 'The Olmec, Mesoamerica\'s first great civilisation, carved portraits of their rulers from basalt boulders dragged more than fifty miles from the Tuxtla Mountains. The original of this head weighs about twenty tons; each of the seventeen known heads wears its own distinctive helmet.',
    x: hx + 2.6, y, z: hz + 1.4, face: 90, target: [hx, y + 1.9, hz], view: { x: hx + 6.2, y, z: hz + 0.8, yaw: 264, pitch: 4 } });
  // Aztec Stone of the Sun (cast) on the west wall
  const R = 1.85, sy = y + 2.9, sz0 = z0 + 3.6;
  geo.add('rock', new THREE.CylinderGeometry(R, R, 0.3, 48).rotateZ(Math.PI / 2), xform(x0 + 0.17, sy, sz0), 0x8a8478);
  picture(ctx, { x: x0 + 0.33, y: sy, z: sz0, face: 90, w: R * 1.98, h: R * 1.98, px: 1024 }, (g, w, h) => {
    g.fillStyle = '#7d766a'; g.fillRect(0, 0, w, h);
    const c = w / 2;
    [[0.5, '#8a8478'], [0.44, '#6e675c'], [0.36, '#8f887b'], [0.27, '#6e675c'], [0.17, '#948c7e']].forEach(([r, f]) => { g.fillStyle = f; g.beginPath(); g.arc(c, c, r * w, 0, 6.3); g.fill(); });
    g.strokeStyle = '#4a443c'; g.lineWidth = 3;
    for (const [r0, r1, n] of [[0.44, 0.5, 40], [0.36, 0.44, 20], [0.27, 0.36, 20], [0.17, 0.27, 8]]) for (let i = 0; i < n; i++) { const a = i / n * 6.283; g.beginPath(); g.moveTo(c + Math.cos(a) * r0 * w, c + Math.sin(a) * r0 * w); g.lineTo(c + Math.cos(a) * r1 * w, c + Math.sin(a) * r1 * w); g.stroke(); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + 0.39; g.fillStyle = '#9a9284'; g.beginPath(); g.moveTo(c + Math.cos(a - 0.09) * 0.3 * w, c + Math.sin(a - 0.09) * 0.3 * w); g.lineTo(c + Math.cos(a) * 0.46 * w, c + Math.sin(a) * 0.46 * w); g.lineTo(c + Math.cos(a + 0.09) * 0.3 * w, c + Math.sin(a + 0.09) * 0.3 * w); g.fill(); g.stroke(); }
    g.fillStyle = '#5c554b'; g.beginPath(); g.arc(c - 0.05 * w, c - 0.03 * w, 0.022 * w, 0, 6.3); g.arc(c + 0.05 * w, c - 0.03 * w, 0.022 * w, 0, 6.3); g.fill();
    g.fillRect(c - 0.05 * w, c + 0.05 * w, 0.1 * w, 0.03 * w);
  });
  lights.anchor(x0 + 4, y + 4.4, sz0, { color: 0xffe2b8, intensity: 34, dist: 14 });
  ctx.placard({ id: 'sunstone', star: true, title: 'Stone of the Sun', sub: 'Cast · Aztec (Mexica) · Tenochtitlan, about 1500',
    text: 'Twelve feet across and long miscalled a calendar, the stone shows the face of a sun deity ringed by the signs of the twenty days and of the four ages that ended before our own.',
    x: x0 + 3.0, y, z: sz0 + 1.6, face: 90, target: [x0 + 0.4, sy, sz0] });
  // Maya stelae
  [[cx - 9, cz - 3, 1], [cx - 3, cz + 3, 2], [cx + 4, cz - 3, 3]].forEach(([sx, sz, sd]) => {
    geo.box('rock', sx - 0.55, y, sz - 0.28, sx + 0.55, y + 3.6, sz + 0.28, { color: 0x9a9280 });
    ctx.phys.box(sx - 0.6, sz - 0.33, sx + 0.6, sz + 0.33, y, y + 3.6);
    for (const f of [0, 180]) picture(ctx, { x: sx, y: y + 1.9, z: sz + (f ? -0.29 : 0.29), face: f, w: 1.0, h: 3.3, px: 256 }, (g, w, h) => {
      const r = mulberry(sd * 5 + f); g.fillStyle = '#9a9280'; g.fillRect(0, 0, w, h);
      for (let j = 0; j < 12; j++) for (let i = 0; i < 3; i++) { g.strokeStyle = '#5c5648'; g.lineWidth = 4; g.strokeRect(14 + i * 78, 20 + j * (h - 40) / 12, 66, (h - 40) / 12 - 10); g.beginPath(); g.arc(47 + i * 78, 20 + (j + 0.45) * (h - 40) / 12, 10 + r() * 12, 0, 6.3); g.stroke(); }
    });
    blob(geo, sx, y, sz, 1, 0.7);
  });
  ctx.placard({ title: 'Maya Stelae', sub: 'Casts · Classic Maya, 250–900 CE', text: 'Carved stone shafts recorded the accessions, wars and rituals of Maya kings in the only complete writing system of the ancient Americas.', x: cx - 3, y, z: cz + 4.6, face: 0, target: [cx - 3, y + 2, cz + 3] });
  const gold = [0xc9a23a, 0xb8862a, 0x2f8a5a], clay = [0xa8663a, 0x8a4a2a, 0xd9b890, 0x3a2a20];
  const secs = [
    { t: 'The Olmec', s: 'Gulf Coast, 1500–400 BCE', text: 'Jade celts and "baby-face" figures from the mother culture of Mesoamerica.', fill: fillPots([0x5a8a6a, 0x8aa890, 0x6a6258], 1, ['jar', 'bowl']) },
    { t: 'West Mexico', s: 'Shaft-tomb ceramics', text: 'Lively clay dogs, ball players and village scenes buried with the dead of Colima, Jalisco and Nayarit.', fill: fillPots(clay, 2) },
    { t: 'Monte Albán', s: 'Zapotec and Mixtec, Oaxaca', text: 'Funerary urns in the form of gods, and the goldwork of Tomb 7.', fill: both(fillMasks(clay, 3), fillPots(gold, 3, ['bowl'])) },
    { t: 'The Maya', s: 'Yucatán and Guatemala', text: 'Painted cylinder vases show court life and the journey of the Hero Twins through the underworld.', fill: fillPots([0xd98a4a, 0xe8d8b0, 0x8a2a1e], 4, ['jar', 'vase']) },
    { t: 'The Aztec', s: 'Central Mexico, 1325–1521', text: 'Stone gods, obsidian blades and the tribute of an empire of millions.', fill: fillMasks([0x6a6258, 0x3a8a7a, 0x8a8478], 5) },
    { t: 'Gold and Jade of Costa Rica', s: 'Central America', text: 'Cast-gold eagles, frogs and jaguars worn as pendants by chiefs.', fill: fillCrystals(gold, 6) },
    { t: 'Teotihuacan', s: 'The City of the Gods', text: 'Masks of greenstone from the largest city of the ancient Americas.', fill: fillMasks([0x5a8a6a, 0x8a8478, 0xa8663a], 7) },
    { t: 'Veracruz', s: 'The ball game', text: 'Stone yokes, palmas and hachas, ceremonial versions of the players\' gear.', fill: fillBoxes([0x6a6258, 0x8a8478], 8) },
  ];
  caseWalls(ctx, ['n', 's'], secs, { inset: 6, back: 0xd6c4a2 });
  lights.anchor(cx - 6, y + 4.6, cz, { color: 0xffe2b8, intensity: 26, dist: 20 });
  title(ctx, 'HALL OF MEXICO AND CENTRAL AMERICA', 'n');
  ctx.view('main', x1 - 3, y, cz + 3, 270, 2);
}

export function southamerica(ctx) {
  const { room, geo, lights } = ctx;
  const y = room.y, [cx, cz] = mid(room);
  const andes = ['#8a2a1e', '#d9b030', '#1e3a6a', '#eadcc0', '#2a2018'];
  const secs = [
    { t: 'Chavín and Paracas', s: 'Peru, 900–100 BCE', text: 'Embroidered mantles from the desert tombs of Paracas keep their colours after two thousand years.', fill: fillTextiles('steps', andes, 1) },
    { t: 'Moche', s: 'North coast of Peru, 100–800 CE', text: 'Portrait vessels and stirrup-spout bottles modelled with the faces of real individuals.', fill: fillPots([0xb8663a, 0xe8d8b0, 0x8a3a1e], 2, ['stirrup', 'jar', 'stirrup']) },
    { t: 'Nasca', s: 'South coast of Peru', text: 'Polychrome pottery from the makers of the great desert lines.', fill: fillPots([0xb8402a, 0xe8d8b0, 0x2a2018, 0xd9a030], 3, ['bowl', 'vase']) },
    { t: 'Royal Tombs of Sipán', s: 'Replica of a Moche lord\'s burial', text: 'Gold, silver and turquoise as it lay around the Lord of Sipán, discovered in 1987.', fill: fillCrystals([0xc9a23a, 0xb8862a, 0x3a9a9a], 4) },
    { t: 'The Inca', s: 'Tawantinsuyu, 1400–1532', text: 'Knotted-cord khipus kept the accounts of an empire without writing.', fill: both(fillTextiles('diamonds', andes, 5), fillPots([0x8a4a2a, 0x2a2018], 5, ['jar'])) },
    { t: 'Andean Music', s: 'Panpipes and drums', text: 'Instruments of bone, cane and clay.', fill: fillBoxes([0x8a6a4a, 0xb8865a], 6) },
    { t: 'Amazonia', s: 'Peoples of the rain forest', text: 'Featherwork crowns of macaw and toucan plumes, worn in dances that renew the world.', fill: both(fillShields([0xd92a1e, 0xe8c81e, 0x1e6ad9, 0x2f9a3a], 7), fillPots([0x8a5a3a], 7, ['bowl'])) },
    { t: 'Peoples of the Gran Chaco and Patagonia', s: 'Southern cone', text: 'Guanaco-skin cloaks and bolas of the far south.', fill: fillTextiles('stripes', ['#8a6a4a', '#eadcc0', '#3a2a1e', '#8a2a1e'], 8) },
  ];
  caseWalls(ctx, ['w', 'e'], secs, { inset: 3, back: 0xd6c4a2 });
  // gold display in the centre
  const top = vitrine(ctx, cx, y, cz, 1.6, 1.0, 0.9, { plinth: 0.95 });
  for (let i = 0; i < 5; i++) geo.add('metal', new THREE.CylinderGeometry(0.1 + (i % 2) * 0.05, 0.1, 0.02, 16), xform(cx - 0.56 + i * 0.28, top + 0.12 + (i % 2) * 0.1, cz), 0xd9b030);
  ctx.placard({ title: 'Andean Gold', sub: 'Chimú and Inca', text: 'To the Inca gold was the sweat of the Sun; most of what they made was melted down by the conquistadors.', x: cx + 1.5, y, z: cz + 0.4, face: 90, target: [cx, y + 1.3, cz] });
  for (const dz of [-16, 0, 16]) lights.anchor(cx, y + 4.6, cz + dz, { color: 0xffe2b8, intensity: 26, dist: 20 });
  bench(ctx, cx, y, cz - 9, 90, 2.4); bench(ctx, cx, y, cz + 9, 90, 2.4);
  title(ctx, 'HALL OF SOUTH AMERICAN PEOPLES', 's');
  ctx.view('main', cx, y, room.z0 + 3, 180, 0);
}
export function southamerica2(ctx) {
  const { room, lights } = ctx;
  const y = room.y, [cx, cz] = mid(room);
  const secs = [
    { t: 'Shuar and Achuar', s: 'Ecuador and Peru', text: 'Blowguns, feather ornaments and beadwork.', fill: fillShields([0xd92a1e, 0xe8c81e, 0x2a2018], 21) },
    { t: 'Manioc and the Garden', s: 'Amazonian farming', text: 'Basketry presses squeeze the poison from bitter manioc, the staple of the forest.', fill: fillPots([0x8a6a4a, 0xb8865a, 0x5a3a26], 22, ['bowl', 'jar']) },
    { t: 'Kayapó', s: 'Central Brazil', text: 'Body painting and radiant feather headdresses.', fill: fillShields([0xe8c81e, 0xd92a1e, 0x1e6ad9], 23) },
    { t: 'The Maloca', s: 'A communal house', text: 'One great roof shelters a whole community.', fill: fillTextiles('diamonds', ['#8a6a4a', '#eadcc0', '#3a2a1e'], 24) },
  ];
  caseWalls(ctx, ['w', 's'], secs, { inset: 3, back: 0xd6c4a2 });
  lights.anchor(cx, y + 4.6, cz, { color: 0xffe2b8, intensity: 28, dist: 20 });
  bench(ctx, cx, y, cz, 0, 2.4);
}

function moai(L, s = 1, color = 0x4c4944) {
  const A2 = (g, c = color) => L.add('flat', g, 0, 0, 0, 0, s, c);
  A2(new THREE.BoxGeometry(1.7, 1.3, 0.95).translate(0, 0.65, 0)); A2(ellipsoid([0, 1.25, 0], [0.92, 0.4, 0.52], { seg: 16, rings: 8 })); // torso and shoulders
  A2(ellipsoid([0, 1.55, 0.02], [0.5, 0.35, 0.42], { seg: 12, rings: 8 })); // neck
  A2(ellipsoid([0, 2.55, 0.05], [0.62, 1.0, 0.62], { seg: 18, rings: 14 })); // head
  A2(new THREE.BoxGeometry(1.26, 0.24, 0.5).translate(0, 3.0, 0.38), shade(color, 0.95)); // brow
  A2(ellipsoid([0, 3.35, 0], [0.6, 0.3, 0.58], { seg: 14, rings: 6 }), shade(color, 0.92)); // flat crown
  for (const k of [-1, 1]) {
    A2(ellipsoid([k * 0.27, 2.86, 0.52], [0.17, 0.09, 0.1], { seg: 8, rings: 5 }), shade(color, 0.45)); // eye sockets
    A2(ellipsoid([k * 0.64, 2.45, 0.0], [0.08, 0.52, 0.2], { seg: 8, rings: 8 }), shade(color, 0.9)); // long ears
  }
  A2(ellipsoid([0, 2.55, 0.66], [0.16, 0.42, 0.22], { seg: 10, rings: 8 })); // nose
  A2(ellipsoid([0, 2.22, 0.74], [0.24, 0.08, 0.12], { seg: 8, rings: 5 })); // nostrils
  A2(ellipsoid([0, 1.98, 0.6], [0.3, 0.07, 0.14], { seg: 10, rings: 5 }), shade(color, 1.05)); // lips
  A2(ellipsoid([0, 1.8, 0.5], [0.34, 0.14, 0.2], { seg: 10, rings: 6 })); // chin
}
export function pacific(ctx) {
  const { room, geo, lights } = ctx;
  const y = room.y, { z0, z1 } = room, [cx, cz] = mid(room);
  // Rapa Nui moai cast
  const mz = z0 + 13;
  island(ctx, cx - 1.6, mz - 1.4, cx + 1.6, mz + 1.4, y, 0.3, 0x4d6f72);
  moai(local(ctx, cx, y + 0.3, mz, 0), 1.08);
  blob(geo, cx, y + 0.31, mz, 1.3, 1.1);
  lights.anchor(cx, y + 4.8, mz - 3.5, { color: 0xf2fbff, intensity: 50, dist: 16 });
  ctx.placard({ id: 'moai', star: true, size: 0.86, title: 'Moai', sub: 'Cast · Rapa Nui (Easter Island), Chile',
    text: 'A plaster cast made on the museum\'s 1934–35 expedition from one of the nearly 900 stone ancestors of Rapa Nui. The islanders carved them from volcanic tuff between about 1250 and 1500 and "walked" them upright, rocking on ropes, miles from the quarry at Rano Raraku.',
    x: cx + 2.3, y, z: mz - 1.8, face: 0, target: [cx, y + 2.6, mz], view: { x: cx + 1.2, y, z: mz - 6.2, yaw: 190, pitch: 8 } });
  const sea = [0x8a2a1e, 0xe8e4d8, 0x16181a, 0x9a6a3a, 0xd9b030];
  const secs = [
    { t: 'Polynesia', s: 'Hawai\'i, Samoa, Tonga, Aotearoa', text: 'Feather cloaks, barkcloth and greenstone: the arts of the great voyagers.', fill: both(fillTextiles('diamonds', ['#eadcc0', '#3a2a1e', '#8a2a1e'], 1), fillBoxes([0x6a4a2a], 1)) },
    { t: 'Micronesia', s: 'Navigators of the low islands', text: 'Stick charts map the swells that guide canoes between atolls.', fill: fillShields([0x9a6a3a, 0xd9cfb0], 2) },
    { t: 'Melanesia', s: 'New Guinea and the Sepik River', text: 'Spirit masks and ancestor boards from men\'s houses on the Sepik.', fill: fillMasks(sea, 3) },
    { t: 'New Ireland', s: 'Malagan carvings', text: 'Intricate openwork sculptures made for memorial feasts, then deliberately left to decay.', fill: fillMasks([0xe8e4d8, 0x8a2a1e, 0x16181a], 4) },
    { t: 'Australia', s: 'Aboriginal peoples', text: 'Bark paintings, spear-throwers and boomerangs.', fill: both(fillTextiles('dots', ['#8a4a2a', '#eadcc0', '#16181a', '#d9a030'], 5), fillShields([0x8a4a2a, 0xd9a030], 5)) },
    { t: 'Indonesia', s: 'Java and Bali', text: 'Shadow puppets and gamelan gongs.', fill: fillMasks([0xc9a23a, 0x8a2a1e, 0xe8e4d8, 0x2f6a4a], 6) },
    { t: 'Philippines', s: 'Mountain peoples of Luzon', text: 'Rice-terrace farmers\' carved guardian figures.', fill: fillPots([0x6a4a2a, 0x8a6a4a], 7, ['jar', 'vase']) },
    { t: 'Margaret Mead', s: 'Anthropologist, 1901–1978', text: 'Mead joined the museum in 1926, the year after her fieldwork in Samoa, and worked here for more than fifty years. This hall, which she designed, was renamed for her in 1984.', fill: both(fillBoxes([0x6a4a2a, 0x8a6a4a], 8), fillTextiles('stripes', ['#eadcc0', '#3a2a1e', '#8a6a4a'], 8)) },
  ];
  caseWalls(ctx, ['w', 'e'], secs, { inset: 3, back: 0xe2e8e4, frame: 0x4d6f72 });
  // outrigger canoe model
  const oz = z1 - 16;
  island(ctx, cx - 0.9, oz - 2.6, cx + 0.9, oz + 2.6, y, 0.6, 0x4d6f72);
  geo.add('wood', ellipsoid([0, 0, 0], [0.28, 0.22, 2.3], { seg: 10, rings: 14 }), xform(cx - 0.2, y + 0.95, oz), 0x8a5a3a);
  geo.add('wood', ellipsoid([0, 0, 0], [0.08, 0.07, 1.6], { seg: 6, rings: 8 }), xform(cx + 0.6, y + 0.8, oz), 0x8a5a3a);
  for (const dz of [-0.8, 0.8]) geo.box('wood', cx - 0.2, y + 1.05, oz + dz - 0.02, cx + 0.6, y + 1.09, oz + dz + 0.02, { color: 0x6a4a2a });
  geo.add('flat_ds', new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(1.5, 0.2), new THREE.Vector2(0, 1.9)])).rotateY(Math.PI / 2), xform(cx - 0.2, y + 1.1, oz + 0.6), 0xe8dcc0);
  ctx.placard({ title: 'Outrigger Sailing Canoe', sub: 'Model · Caroline Islands', text: 'Craft like this, steered by star paths and the feel of the swell, settled a third of the planet.', x: cx + 1.5, y, z: oz, face: 90, target: [cx, y + 1.4, oz] });
  for (const dz of [-8, 8]) lights.anchor(cx, y + 4.6, cz + dz, { color: 0xf2fbff, intensity: 28, dist: 20 });
  title(ctx, 'MARGARET MEAD HALL OF PACIFIC PEOPLES', 's', '#4d6f72');
  ctx.view('main', cx, y, z0 + 3, 180, 4);
}
export function pacific2(ctx) {
  const { room, lights } = ctx;
  const y = room.y, [cx, cz] = mid(room);
  const secs = [
    { t: 'Sepik River Spirit House', s: 'Papua New Guinea', text: 'Carved posts and painted bark from the gable of a haus tambaran.', fill: fillMasks([0x8a2a1e, 0xe8e4d8, 0x16181a], 31) },
    { t: 'Trobriand Islands', s: 'The Kula ring', text: 'Shell armbands and necklaces travel in opposite directions around a ring of islands, binding trading partners for life.', fill: fillPots([0xe8e4d8, 0x8a2a1e], 32, ['bowl']) },
    { t: 'Asmat', s: 'West Papua', text: 'Shields carved with the symbols of ancestors.', fill: fillShields([0x8a2a1e, 0xe8e4d8, 0x16181a], 33) },
    { t: 'Solomon Islands', s: 'Canoe-prow figures', text: 'Inlaid with pearl shell, they watched for reefs and enemies.', fill: fillMasks([0x16181a, 0xe8e4d8], 34) },
  ];
  caseWalls(ctx, ['w', 's'], secs, { inset: 3, back: 0xe2e8e4, frame: 0x4d6f72 });
  lights.anchor(cx, y + 4.6, cz, { color: 0xf2fbff, intensity: 28, dist: 20 });
  bench(ctx, cx, y, cz, 0, 2.4);
}

export function woodlands(ctx) {
  const { room, geo, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room, [cx, cz] = mid(room);
  // cases covered and gallery roped off: the halls have been closed since January 2024
  for (const side of [z0, z1]) for (let x = x0 + 6; x < x1 - 4; x += 7.5) {
    const zz = side === z0 ? z0 + 0.45 : z1 - 0.45;
    geo.box('flat', x - 2.8, y, zz - 0.42, x + 2.8, y + 3.0, zz + 0.42, { color: 0x8a8880 });
    ctx.phys.box(x - 2.8, zz - 0.45, x + 2.8, zz + 0.45, y, y + 3);
  }
  rope(ctx, [[x0 + 5, cz - 5], [x0 + 5, cz + 5]], y);
  rope(ctx, [[x1 - 5, cz - 5], [x1 - 5, cz + 5]], y);
  textPanel(ctx, { x: cx, y: y + 1.7, z: cz, face: 270, w: 2.6, h: 1.9, heading: 'These halls are closed', text: 'In January 2024 the museum closed the Halls of Eastern Woodlands and Plains Indians while it consults with Native Nations, as required by federal regulations on the display of cultural items.', bg: '#f1ece2', fg: '#3a3028', headSize: 86, size: 50 });
  textPanel(ctx, { x: cx, y: y + 1.7, z: cz, face: 90, w: 2.6, h: 1.9, heading: 'These halls are closed', text: 'In January 2024 the museum closed the Halls of Eastern Woodlands and Plains Indians while it consults with Native Nations, as required by federal regulations on the display of cultural items.', bg: '#f1ece2', fg: '#3a3028', headSize: 86, size: 50 });
  geo.box('satin', cx - 0.04, y, cz - 1.35, cx + 0.04, y + 2.7, cz + 1.35, { color: 0x2a2826 });
  ctx.phys.box(cx - 0.1, cz - 1.4, cx + 0.1, cz + 1.4, y, y + 2.7);
  lights.anchor(cx, y + 4.6, cz, { color: 0xffe2b8, intensity: 14, dist: 22 });
  ctx.view('main', x1 - 3, y, cz, 270, 0);
}

// ---------------------------------------------------------------------------
// Primates, Human Origins
// ---------------------------------------------------------------------------
export function primates(ctx) {
  const { room, lights } = ctx;
  const y = room.y, { x0, z0, z1 } = room, [cx, cz] = mid(room);
  const m = (name, lib, x, z, rot, label, opts, scale) => mount(ctx, name, x, z, rot, { lib, opts, scale, ph: 0.4, pcol: 0x5a4632, padX: 0.4, padZ: 0.4, minHalfZ: 0.6, label });
  m('gorilla', 'animals', -9, cz - 2, 0, { id: 'gorillamount', title: 'Western Gorilla', sub: 'Gorilla gorilla', text: 'The largest living primate. An adult male, a silverback, may weigh 400 pounds.', side: -1 }, { pose: 'knuckle' });
  m('chimpanzee', 'animals', -3, cz - 2, 0, { title: 'Chimpanzee', sub: 'Pan troglodytes', text: 'With the bonobo, our closest living relative: we share about 98.8 percent of our DNA.', side: -1 }, { pose: 'knuckle' });
  m('mandrill', 'animals', 3, cz - 2, 0, { title: 'Mandrill', sub: 'Mandrillus sphinx', text: 'The largest of all monkeys.', side: -1 });
  m('colobus', 'animals', 9, cz - 2, 0, { title: 'Black-and-white Colobus', sub: 'Colobus guereza', text: 'A leaf-eating monkey with a stomach like a cow\'s.', side: -1 });
  m('human', 'skeletons', -6, cz + 6, 0, { title: 'Human', sub: 'Homo sapiens · skeleton', text: 'An upright spine, a bowl-shaped pelvis and long legs: the anatomy of a habitual biped.', side: -1 });
  m('gorilla_skeleton', 'skeletons', 0, cz + 6, 0, { title: 'Gorilla', sub: 'Skeleton', text: 'Long arms and curved fingers for knuckle-walking and climbing.', side: -1 });
  m('lucy', 'skeletons', 6, cz + 6, 0, { title: 'Early Hominin', sub: 'Cast · Australopithecus', text: 'Small-brained but upright: a body between ape and human.', side: -1 }, { tone: 'cast' });
  textPanel(ctx, { x: x0 + 0.03, y: y + 2.5, z: cz + 3, face: 90, w: 5, h: 2.6, heading: 'The Primate Family Tree', text: 'Lemurs and lorises · tarsiers · New World monkeys · Old World monkeys · gibbons · great apes · humans.\nPrimates share grasping hands, forward-facing eyes and large brains — adaptations that began in the trees.', bg: '#d9ccb0', fg: '#4a3a28', headSize: 72, size: 42 });
  for (const dx of [-9, 9]) lights.anchor(cx + dx, y + 4.6, cz, { color: 0xffe2b8, intensity: 30, dist: 20 });
  ctx.sign('HALL OF PRIMATES', cx, y + 4.6, z1 - 0.02, 0, 0.28, { color: '#6a5238' });
  ctx.view('main', 0, y, z0 + 2.4, 180, 0);
}

export function humanorigins(ctx) {
  const { room, geo, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room, [cx, cz] = mid(room);
  // Lucy
  const lx = x1 - 12, lz = cz;
  const m = mount(ctx, 'lucy', lx, lz, 0, { lib: 'skeletons', ph: 0.5, pcol: 0x2a2826, pmat: 'satin', padX: 0.7, padZ: 0.7, minHalfZ: 0.8 });
  geo.add('glass', new THREE.BoxGeometry(1.7, 1.6, 1.7), xform(lx, y + 0.5 + 0.8, lz), 0xd8e8ee);
  lights.anchor(lx, y + 4.4, lz + 2, { color: 0xfff0dc, intensity: 40, dist: 12 });
  ctx.placard({ id: 'lucy', star: true, size: 0.86, title: '"Lucy"', sub: 'Australopithecus afarensis · cast · Hadar, Ethiopia · 3.18 million years old',
    text: 'Found in 1974 and named for a Beatles song playing in camp, Lucy was a little over three and a half feet tall. Her pelvis and knee prove that our ancestors walked upright long before their brains grew large. About 40 percent of her skeleton survives — astonishingly complete for a fossil so old.',
    x: lx + 0.2, y, z: lz + 1.9, face: 180, target: [lx, y + 1.2, lz], view: { x: lx + 0.8, y, z: lz + 4.4, yaw: 350, pitch: -4 } });
  void m;
  // the three skeletons at the entrance
  const trio = [['gorilla_skeleton', 'Chimpanzee', 'Pan troglodytes', 0.82], ['human', 'Neanderthal', 'Homo neanderthalensis · composite reconstruction', 0.95], ['human', 'Modern Human', 'Homo sapiens', 1]];
  trio.forEach(([n, t, s, sc], i) => mount(ctx, n, x1 - 6.5, cz - 4 + i * 4, 180, { lib: 'skeletons', scale: sc, opts: { tone: 'cast' }, ph: 0.45, pcol: 0x2a2826, pmat: 'satin', padX: 0.5, padZ: 0.5, minHalfZ: 0.7,
    label: { title: t, sub: s, text: i === 0 ? 'Our closest living relative, built for climbing and knuckle-walking.' : i === 1 ? 'Stocky, powerful and big-brained: a human species adapted to Ice Age Europe that vanished about 40,000 years ago.' : 'Tall, slender and globular-skulled: the only human species left.', side: i === 2 ? 1 : -1 } }));
  // Turkana Boy
  mount(ctx, 'human', cx + 4, cz - 5, 0, { lib: 'skeletons', scale: 0.92, ph: 0.45, pcol: 0x2a2826, pmat: 'satin', padX: 0.5, padZ: 0.5, minHalfZ: 0.7,
    label: { id: 'turkanaboy', title: '"Turkana Boy"', sub: 'Homo ergaster · cast · Kenya · 1.6 million years old', text: 'The most complete early human skeleton known: a youth already five feet three, with the long legs of a tireless walker.', side: 1 } });
  // habitat scenes of earlier humans (wall dioramas as lit pictures)
  const scenes = [['Homo ergaster', 'East Africa, 1.7 million years ago', 'A pair butcher a carcass on the savanna, watched by a hyena and vultures.', ['#c9a878', '#e8d8b0', '#a8935a', '#6a5a34']],
    ['Neanderthals', 'Western Europe, 50,000 years ago', 'A family prepares hides at the mouth of a rock shelter.', ['#8a9ab0', '#d8dce0', '#7a7468', '#4a463e']],
    ['Homo erectus', 'Zhoukoudian, China, 500,000 years ago', 'Peking Man in a landscape of hills and hyenas.', ['#9ab0c0', '#e0d8c0', '#8a8a5a', '#5a5a3a']],
    ['Cro-Magnons', 'Mezhirich, Ukraine, 15,000 years ago', 'Ice Age hunters build a house from the bones of woolly mammoths.', ['#b0c0d0', '#f0f0f0', '#d0d8e0', '#9aa6b0']]];
  scenes.forEach((s, i) => {
    const x = x0 + 9 + i * 10.5;
    geo.box('satin', x - 3.1, y + 0.75, z0, x + 3.1, y + 3.75, z0 + 0.12, { color: 0x1c1c1e });
    picture(ctx, { x, y: y + 2.25, z: z0 + 0.12, face: 180, w: 5.8, h: 2.7, unlit: true }, landscape(i + 31, s[3]));
    ctx.placard({ title: s[0], sub: s[1], text: s[2], x, y, z: z0 + 1.5, face: 180, target: [x, y + 2.2, z0 + 0.2] });
    lights.anchor(x, y + 4.2, z0 + 3.5, { color: 0xfff0dc, intensity: 16, dist: 12 });
  });
  // Laetoli footprints
  const fx = cx - 10, fz = cz + 2;
  island(ctx, fx - 3.2, fz - 0.9, fx + 3.2, fz + 0.9, y, 0.5, 0x2a2826);
  geo.floor('ground', fx - 3.1, fz - 0.8, fx + 3.1, fz + 0.8, y + 0.51, { color: 0x8a867c });
  for (let i = 0; i < 12; i++) geo.add('flat', ellipsoid([0, 0, 0], [0.11, 0.012, 0.06], { seg: 8, rings: 4 }), xform(fx - 2.8 + i * 0.5, y + 0.515, fz + (i % 2 ? 0.14 : -0.14) + (i > 6 ? 0.3 : 0), 0.1), 0x4a4640);
  ctx.placard({ id: 'laetoli', title: 'Laetoli Footprints', sub: 'Cast · Tanzania · 3.6 million years old', text: 'Two — perhaps three — individuals walked across wet volcanic ash, which set like cement: the oldest direct evidence of upright walking.', x: fx, y, z: fz + 1.9, face: 180, target: [fx, y + 0.6, fz] });
  // cave art wall
  picture(ctx, { x: x0 + 14, y: y + 2.4, z: z1, face: 0, w: 9, h: 3 }, (g, w, h) => {
    g.fillStyle = '#b89a6a'; g.fillRect(0, 0, w, h);
    const r = mulberry(4);
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${90 + r() * 60},${60 + r() * 40},${30 + r() * 30},0.14)`; g.beginPath(); g.arc(r() * w, r() * h, 20 + r() * 80, 0, 6.3); g.fill(); }
    for (let i = 0; i < 7; i++) { const x = 60 + i * 135 + r() * 30, yy = 150 + r() * 110, s = 0.8 + r() * 0.7; g.fillStyle = i % 3 ? '#5a2a14' : '#1e1410'; g.beginPath(); g.ellipse(x, yy, 60 * s, 30 * s, 0, 0, 6.3); g.fill(); g.beginPath(); g.ellipse(x + 62 * s, yy - 22 * s, 20 * s, 14 * s, -0.5, 0, 6.3); g.fill(); g.lineWidth = 6 * s; g.strokeStyle = g.fillStyle; for (const lx2 of [-36, -18, 24, 40]) { g.beginPath(); g.moveTo(x + lx2 * s, yy + 20 * s); g.lineTo(x + (lx2 - 6) * s, yy + 62 * s); g.stroke(); } g.beginPath(); g.moveTo(x + 70 * s, yy - 34 * s); g.quadraticCurveTo(x + 92 * s, yy - 70 * s, x + 110 * s, yy - 50 * s); g.stroke(); }
  });
  ctx.placard({ title: 'The Creative Spark', sub: 'Ice Age art · Lascaux, France · 17,000 years ago', text: 'Painting, carving, music and ornament appear together with our own species: evidence of minds that think in symbols.', x: x0 + 14, y, z: z1 - 1.6, face: 0, target: [x0 + 14, y + 2.4, z1 - 0.1] });
  lights.anchor(x0 + 14, y + 4.2, z1 - 4, { color: 0xffe2b8, intensity: 18, dist: 14 });
  // skull casts
  const sk = ['Sahelanthropus · 7 million years', 'Australopithecus africanus · 2.5 million', 'Paranthropus boisei · 1.8 million', 'Homo habilis · 1.9 million', 'Homo erectus · 1 million', 'Homo floresiensis · 60,000'];
  sk.forEach((t, i) => {
    const x = cx - 4 + (i % 3) * 2.6, z = z1 - 3.2 - Math.floor(i / 3) * 3;
    const top = vitrine(ctx, x, y, z, 0.8, 0.8, 0.6, { plinth: 1.1 });
    geo.add('bone', lump(0.11, 0.1, 0.13, { seed: i + 3, detail: 3, rough: 0.12 }), xform(x, top + 0.17, z, i), 0xcfc2a2);
    geo.cyl('metal', x, top, z, 0.012, 0.08, { color: 0x3a3a3a, seg: 6 });
  });
  ctx.placard({ title: 'Family Album', sub: 'Skull casts of six hominins', text: sk.join(' — ') + '. Our family tree is a bush: for most of the last six million years several human species shared the planet.', x: cx - 1.4, y, z: z1 - 8, face: 180, target: [cx - 1.4, y + 1.4, z1 - 5] });
  lights.anchor(cx - 1.4, y + 4.4, z1 - 5, { color: 0xfff0dc, intensity: 26, dist: 14 });
  lights.anchor(cx, y + 4.6, cz, { color: 0xfff0dc, intensity: 30, dist: 22 });
  title(ctx, 'SPITZER HALL OF HUMAN ORIGINS', 'e', '#5a5a60');
  ctx.view('main', x1 - 2.5, y, cz + 6, 280, 0);
}

// ---------------------------------------------------------------------------
// Mignone Halls of Gems and Minerals
// ---------------------------------------------------------------------------
function geode(ctx, x, y, z, face, h, seed) {
  const L = local(ctx, x, y, z, face);
  const w = h * 0.42;
  const shell = new THREE.SphereGeometry(1, 28, 20, 0, Math.PI);
  shell.scale(w, h / 2, w * 0.8);
  shell.rotateY(Math.PI); // open towards +Z
  L.add('flat_ds', shell, 0, h / 2, 0, 0, 1, 0x4a3e36);
  const inner = new THREE.SphereGeometry(1, 28, 20, 0, Math.PI);
  inner.scale(w * 0.9, h / 2 * 0.94, w * 0.72);
  inner.rotateY(Math.PI);
  L.add('glow_ds', inner, 0, h / 2, 0.02, 0, 1, [0.2, 0.06, 0.32]);
  const r = mulberry(seed * 9 + 1);
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI, e = (r() - 0.5) * 2.6;
    const px = Math.cos(a) * Math.cos(e) * w * 0.8, py = h / 2 + Math.sin(e) * h * 0.42, pz = -Math.sin(a) * Math.cos(e) * w * 0.62;
    for (const [g, k] of crystals(0.2, 0.24, seed * 50 + i, 3)) L.add('gloss', g.rotateX(Math.PI / 2 * (0.6 + r() * 0.5)), px, py, pz, 0, 1, shade(0x7a3ab0, k * (0.7 + r() * 0.6)));
  }
  L.collide(-w, -w * 0.8, w, w * 0.3, h);
  blob(ctx.geo, x, y, z, w * 1.3, w);
  return L;
}
export function gems(ctx) {
  const { room, geo, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room, [cx, cz] = mid(room);
  // the two giant amethyst geodes inside the south entrance
  geode(ctx, cx - 6.5, y, z1 - 7.5, 180, 3.6, 1);
  geode(ctx, cx + 6.5, y, z1 - 7.5, 180, 2.8, 2);
  lights.anchor(cx, y + 4.6, z1 - 9.5, { color: 0xe8dcff, intensity: 46, dist: 16 });
  ctx.placard({ id: 'geodes', star: true, title: 'Giant Amethyst Geodes', sub: 'Bolsa Mine, Artigas, Uruguay · 135 million years old',
    text: 'Gas bubbles in ancient lava flows, slowly lined with quartz coloured violet by traces of iron and natural radiation. The taller geode stands twelve feet high and weighs more than four tons; its partner weighs nearly five. They are among the largest ever put on public display.',
    x: cx - 3.4, y, z: z1 - 5.6, face: 180, target: [cx - 6.5, y + 2, z1 - 7.5], view: { x: cx - 3.2, y, z: z1 - 1.6, yaw: 335, pitch: 8 } });
  // Star of India
  const sx = cx, sz = cz + 4;
  const top = vitrine(ctx, sx, y, sz, 0.9, 0.9, 0.75, { plinth: 1.05, color: 0x101014 });
  geo.cyl('satin', sx, top, sz, 0.09, 0.14, { color: 0x101014, seg: 12 });
  geo.add('gloss', ellipsoid([0, 0, 0], [0.085, 0.06, 0.085], { seg: 20, rings: 12 }), xform(sx, top + 0.19, sz), 0x7a8ec8);
  for (let k = 0; k < 3; k++) geo.add('glow', new THREE.BoxGeometry(0.15, 0.004, 0.008), xform(sx, top + 0.251, sz, k * Math.PI / 3), [1.6, 1.7, 2.0]);
  lights.anchor(sx, y + 3.4, sz + 1.2, { color: 0xdfe6ff, intensity: 24, dist: 8 });
  ctx.placard({ id: 'starofindia', star: true, title: 'Star of India', sub: 'Star sapphire · 563.35 carats · Sri Lanka',
    text: 'The world\'s largest gem-quality blue star sapphire, about two billion years old and polished into a dome so that needles of rutile inside it reflect a six-rayed star — on both faces. J. P. Morgan gave it to the museum in 1900; in 1964 it was stolen in a notorious burglary and recovered from a bus-station locker in Miami.',
    x: sx + 1.1, y, z: sz + 0.4, face: 90, target: [sx, top + 0.2, sz], view: { x: sx + 0.5, y, z: sz + 2.3, yaw: 348, pitch: -12 } });
  // other treasures in free-standing cases
  const jewels = [
    { id: 'patricia', t: 'Patricia Emerald', s: '632 carats · Chivor Mine, Colombia', x: cx - 6, z: cz + 4, text: 'One of the few large emeralds left uncut: a twelve-sided crystal found in 1920.', make: (tp, x, z) => geo.add('gloss', new THREE.CylinderGeometry(0.035, 0.035, 0.11, 12).translate(0, 0.055, 0), xform(x, tp + 0.1, z), 0x1e9a4a) },
    { id: 'delong', t: 'DeLong Star Ruby', s: '100.32 carats · Myanmar', x: cx + 6, z: cz + 4, text: 'An orchid-red star ruby, stolen with the Star of India in 1964 and ransomed for $25,000.', make: (tp, x, z) => geo.add('gloss', ellipsoid([0, 0, 0], [0.045, 0.03, 0.04], { seg: 14, rings: 8 }), xform(x, tp + 0.13, z), 0xb81e4a) },
    { id: 'subwaygarnet', t: 'Subway Garnet', s: 'Almandine · 10 pounds · Manhattan', x: cx - 6, z: cz - 3, text: 'Dug up in 1885 from a sewer trench on 35th Street (not the subway): the finest garnet crystal ever found in the United States.', make: (tp, x, z) => geo.add('gloss', new THREE.DodecahedronGeometry(0.11), xform(x, tp + 0.2, z, 0.4), 0x5a1220) },
    { id: 'singingstone', t: 'Singing Stone', s: 'Azurite and malachite · 4.5 tons · Bisbee, Arizona', x: cx + 6, z: cz - 3, big: true, text: 'A block of vivid blue copper ore shown at the 1893 World\'s Columbian Exposition. In its old hall it squeaked as the humidity changed — hence the name.', make: null },
  ];
  for (const j of jewels) {
    if (j.big) {
      pedestal(ctx, j.x, y, j.z, 2.2, 1.6, 0.3, 0x101014);
      geo.add('rock', lump(0.95, 0.75, 0.6, { seed: 8, detail: 4, rough: 0.3, flatBottom: 0.8 }), xform(j.x, y + 0.3 + 0.6, j.z), 0x1e4ab8);
      geo.add('rock', lump(0.5, 0.3, 0.4, { seed: 9, detail: 3, rough: 0.3 }), xform(j.x + 0.4, y + 0.7, j.z + 0.3), 0x1e8a5a);
    } else {
      const tp = vitrine(ctx, j.x, y, j.z, 0.8, 0.8, 0.6, { plinth: 1.1, color: 0x101014 });
      geo.cyl('satin', j.x, tp, j.z, 0.07, 0.1, { color: 0x101014, seg: 10 });
      j.make(tp, j.x, j.z);
    }
    lights.anchor(j.x, y + 3.4, j.z + 1, { color: 0xdfe6ff, intensity: 16, dist: 8 });
    ctx.placard({ id: j.id, title: j.t, sub: j.s, text: j.text, x: j.x + (j.big ? 1.6 : 1.0), y, z: j.z + 0.3, face: 90, target: [j.x, y + 1.3, j.z] });
  }
  const P = { quartz: [0xe8e8f0, 0xc8b8e0, 0xf0d8c0], copper: [0x1e8a5a, 0x1e4ab8, 0xb86a3a], gold: [0xd9b030, 0xc9a23a, 0xe8e4d8], fluor: [0x7a3ab0, 0x2f9a6a, 0xd9c020], beryl: [0x3ab0a0, 0x8ad0e8, 0xe89ab0], tourm: [0xd92a6a, 0x2f8a4a, 0x1e2a6a], sulf: [0xd9c020, 0x8a8a90, 0xb8402a], calc: [0xe8d8b0, 0xe8a060, 0xf0f0f0] };
  const secs = [
    { t: 'Pegmatites', s: 'Where giant crystals grow', text: 'Slow-cooling pockets of granite magma grow tourmaline, beryl and topaz crystals of gem quality.', fill: fillCrystals(P.tourm, 1) },
    { t: 'Copper Minerals', s: 'Bisbee, Arizona', text: 'Azurite blue and malachite green form where water alters copper ore.', fill: fillCrystals(P.copper, 2) },
    { t: 'Quartz', s: 'The most common mineral in the crust', text: 'Amethyst, citrine, smoky and rose quartz are one mineral with different impurities.', fill: fillCrystals(P.quartz, 3) },
    { t: 'Gold and Native Elements', s: 'Metals found pure', text: 'Leaf and wire gold, native silver and copper.', fill: fillCrystals(P.gold, 4) },
    { t: 'Minerals of New York City', s: 'Manhattan schist and its treasures', text: 'Garnet, tourmaline and chrysoberyl turned up by the city\'s builders.', fill: fillCrystals(P.sulf, 5) },
    { t: 'Fluorite and Calcite', s: 'Cubes and rhombs', text: 'The same few crystal shapes repeat in endless colours.', fill: fillCrystals(P.fluor, 6) },
    { t: 'Beryl', s: 'Emerald, aquamarine, morganite', text: 'One mineral, many gems: chromium makes emerald green, iron makes aquamarine blue.', fill: fillCrystals(P.beryl, 7) },
    { t: 'Organic Gems', s: 'Pearl, coral, amber, jet', text: 'Gems made by living things.', fill: fillCrystals(P.calc, 8) },
    { t: 'Diamonds', s: 'Carbon from the deep mantle', text: 'Crystallised more than 90 miles down and shot to the surface in volcanic pipes.', fill: fillCrystals([0xf0f4ff, 0xe8f0ff, 0xfff0d0], 9) },
    { t: 'Sulfides', s: 'Pyrite, galena, stibnite', text: 'Ores of iron, lead and antimony with a metallic lustre.', fill: fillCrystals(P.sulf, 10) },
  ];
  caseWalls(ctx, ['w', 'e'], secs, { inset: 3, back: 0x30303a, glow: 0.7, frame: 0x101014, lc: 0xdfe6ff, li: 9 });
  // fluorescence wall at the north end
  picture(ctx, { x: cx + 8, y: y + 2.5, z: z0, face: 180, w: 9, h: 3.2, unlit: true }, (g, w, h) => {
    g.fillStyle = '#05050a'; g.fillRect(0, 0, w, h);
    const r = mulberry(6);
    for (let i = 0; i < 260; i++) { const x = r() * w, yy = r() * h, s = 10 + r() * 50; const rg = g.createRadialGradient(x, yy, 0, x, yy, s); rg.addColorStop(0, ['#3aff6a', '#ff5a2a', '#ff3a5a', '#3ad0ff', '#f0ff3a'][i % 5]); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - s, yy - s, 2 * s, 2 * s); }
  });
  geo.box('satin', cx + 3.3, y + 0.7, z0, cx + 12.7, y + 4.3, z0 + 0.03, { color: 0x05050a });
  ctx.placard({ id: 'fluorescent', title: 'Fluorescent Minerals', sub: 'Sterling Hill, New Jersey', text: 'A wall-sized slab of zinc ore that glows red and green under ultraviolet light: calcite and willemite from one of the world\'s great mineral localities, 50 miles from here.', x: cx + 8, y, z: z0 + 2.2, face: 180, target: [cx + 8, y + 2.5, z0 + 0.1] });
  lights.anchor(cx, y + 4.4, cz - 8, { color: 0xdfe6ff, intensity: 20, dist: 20 });
  title(ctx, 'MIGNONE HALLS OF GEMS AND MINERALS', 's', '#b8b8c8');
  ctx.view('main', cx, y, z1 - 1.8, 0, 6);
  void x0; void x1;
}

// ---------------------------------------------------------------------------
// Hall of Biodiversity
// ---------------------------------------------------------------------------
export function biodiversity(ctx) {
  const { room, geo, phys, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room, cz = (z0 + z1) / 2;
  // Spectrum of Life: a 100-foot wall of specimens, backlit
  const L = local(ctx, x1, y, cz + 2, 270);
  const WW = 30, HH = 3.6;
  L.box('glow', -WW / 2, 0.6, 0, WW / 2, 0.6 + HH, 0.06, [0.8, 0.84, 0.88]);
  L.box('satin', -WW / 2 - 0.1, 0, 0, WW / 2 + 0.1, 0.6, 0.5, 0x0c0c0e);
  L.collide(-WW / 2 - 0.1, 0, WW / 2 + 0.1, 0.55, 4.4);
  const r = mulberry(12);
  const pieces = [['sealife', 'jelly', 0.5], ['sealife', 'shark', 0.14], ['sealife', 'ray', 0.25], ['sealife', 'seaturtle', 0.35], ['sealife', 'reeffish', 0.9], ['sealife', 'dolphin', 0.2], ['sealife', 'giantsquid', 0.07],
    ['animals', 'penguin', 0.5], ['animals', 'flamingo', 0.45], ['animals', 'eagle', 0.6], ['animals', 'heron', 0.5], ['animals', 'tortoise', 0.45], ['animals', 'komodo', 0.24], ['animals', 'alligator', 0.2],
    ['animals', 'colobus', 0.7], ['animals', 'jackal', 0.7], ['animals', 'vulture', 0.55], ['animals', 'ostrich', 0.25], ['animals', 'warthog', 0.5], ['animals', 'gazelle', 0.5], ['animals', 'sealion', 0.3], ['animals', 'chimpanzee', 0.55]];
  let k = 0;
  for (let i = 0; i < 44; i++) {
    const u = -WW / 2 + 0.6 + (i + 0.5) * (WW - 1.2) / 44, v = 0.9 + ((i * 7) % 5) * 0.62 + r() * 0.2;
    if (i % 2 === 0) {
      const p = pieces[k++ % pieces.length];
      L.geo(model(p[0], p[1], { seed: i }), u, v, 0.3, i % 4 ? 0 : 180, p[2] * 1.9);
    } else if (i % 4 === 1) {
      for (const [g, kk] of crystals(0.2, 0.25, i, 5)) L.add('gloss', g, u, v, 0.25, 0, 1, shade([0x2f9a6a, 0xd94a2a, 0xe8c81e, 0x7a3ab0][i % 4], kk));
    } else {
      // an invertebrate: shell / beetle / star
      L.add('gloss', ellipsoid([0, 0.12, 0], [0.16 + r() * 0.1, 0.1, 0.07], { seg: 10, rings: 6 }), u, v, 0.2, r() * 360, 1, [0x1e5a3a, 0xb8402a, 0x2a2a6a, 0xd9a030, 0x4a2a1a][i % 5]);
    }
  }
  for (let i = 0; i < 5; i++) { const p = L.w(-12 + i * 6, 2.4, 3.2); lights.anchor(p[0], p[1], p[2], { color: 0xe8f0ff, intensity: 16, dist: 12 }); }
  L.placard({ id: 'spectrumoflife', star: true, size: 0.9, title: 'Spectrum of Life', sub: '1,500 specimens and models · 28 groups of living things', lx: 0, lz: 2.0, lt: [0, 2.4, 0.2],
    text: 'A 100-foot-long cladogram: bacteria at one end, mammals at the other, with every major branch of the 3.5-billion-year-old tree of life between them. It was the first time a museum had tried to show the whole of life\'s diversity in a single glance.', view: { x: x1 - 8.5, y, z: cz + 6, yaw: 68, pitch: 6 } });
  // Dzanga-Sangha rain forest
  const fx0 = x0 + 0.5, fx1 = x0 + 9.5, fz0 = cz + 4, fz1 = z1 - 3;
  geo.floor('ground', fx0, fz0, fx1, fz1, y + 0.02, { color: 0x3a3626 });
  const rr = mulberry(8);
  for (let i = 0; i < 16; i++) {
    const tx = fx0 + 0.8 + rr() * (fx1 - fx0 - 1.6), tz = fz0 + 0.8 + rr() * (fz1 - fz0 - 1.6), tr = 0.14 + rr() * 0.28;
    geo.cyl('wood', tx, y, tz, tr, room.h, { rTop: tr * 0.8, color: shade(0x4a3a2a, 0.7 + rr() * 0.6), seg: 9 });
    phys.cyl(tx, tz, tr + 0.05, y, y + room.h);
    for (let b = 0; b < 3; b++) geo.add('flat', ellipsoid([tx + (rr() - 0.5) * 2.4, y + room.h - 0.6 - rr() * 1.2, tz + (rr() - 0.5) * 2.4], [1.1 + rr() * 0.6, 0.35, 1.0 + rr() * 0.6], { seg: 8, rings: 5 }), null, shade(0x24521e, 0.6 + rr() * 0.7));
    if (i % 3 === 0) plant(ctx, tx + 0.9, y, tz + 0.5, 1.2 + rr() * 0.8, i + 3, 0x2f6a26);
    // lianas
    if (i % 2) geo.add('flat', tube([[tx, y + room.h - 0.3, tz], [tx + 0.6, y + 2.4, tz + 0.5], [tx + 1.3, y + room.h - 0.5, tz + 1.1]], 0.025, { radial: 5, sub: 4 }), null, 0x3a2e1e);
  }
  geo.addGeo(model('animals', 'bongo', { seed: 3 }), xform(fx0 + 3.0, y + 0.02, fz0 + 6, 0.5));
  geo.addGeo(model('animals', 'gorilla', { pose: 'knuckle', seed: 2 }), xform(fx0 + 6.2, y + 0.02, fz1 - 6, -1.2));
  geo.addGeo(model('animals', 'leopard', { pose: 'lie', seed: 3 }), xform(fx0 + 2.6, y + 0.02, fz1 - 3.4, 0.9));
  geo.addGeo(model('animals', 'colobus', { pose: 'sit', seed: 1 }), xform(fx0 + 6.0, y + 0.02, fz0 + 2.8, 2.2));
  rope(ctx, [[fx1 + 0.2, fz0], [fx1 + 0.2, (fz0 + fz1) / 2], [fx1 + 0.2, fz1]], y, { color: 0x24421e });
  phys.box(fx0, fz0, fx1, fz1, y, y + 2);
  for (const zz of [fz0 + 4, (fz0 + fz1) / 2, fz1 - 4]) lights.anchor(fx1 - 2, y + 3.6, zz, { color: 0xc8f0a8, intensity: 60, dist: 16 });
  ctx.placard({ id: 'dzanga', star: true, title: 'Dzanga-Sangha Rain Forest', sub: 'Central African Republic · 2,500 square feet',
    text: 'A life-size diorama of one of Earth\'s most diverse ecosystems, recreated with more than 160 species of plants and animals and half a million hand-made leaves. Museum scientists and artists spent weeks in the forest recording a single clearing at three moments: pristine, altered by nature, and damaged by people.',
    x: fx1 + 1.2, y, z: (fz0 + fz1) / 2 + 1, face: 90, target: [fx0 + 4, y + 2, (fz0 + fz1) / 2], view: { x: fx1 + 4.6, y, z: (fz0 + fz1) / 2 + 3, yaw: 252, pitch: 4 } });
  // Crisis Zone / resource centre panels at the north end
  textPanel(ctx, { x: x0 + 0.03, y: y + 2.5, z: z0 + 9, face: 90, w: 7, h: 2.8, heading: 'The Sixth Extinction', text: 'Five times in the history of life, most species on Earth have vanished. Human activity — habitat loss, overharvesting, invasive species, pollution and climate change — is now driving a sixth mass extinction.', bg: '#101418', fg: '#dfe8f0', headSize: 76, size: 42, unlit: true });
  for (const [t, zz] of [['Endangered: Siberian Tiger', z0 + 16], ['Endangered: Giant Panda', z0 + 20]]) ctx.sign(t.toUpperCase(), x0 + 0.03, y + 0.9, zz, 90, 0.14, { color: '#8a9aa8', sans: true });
  ctx.sign('HALL OF BIODIVERSITY', (x0 + x1) / 2, y + 4.8, z0 + 0.02, 180, 0.3, { color: '#cfe0ff', sans: true });
  ctx.view('main', (x0 + x1) / 2, y, z0 + 4, 180, 2);
}

// ---------------------------------------------------------------------------
// Special exhibition gallery, crossings, corridors and landings
// ---------------------------------------------------------------------------
function photoWalls(ctx, sides, n, seed, pals) {
  const r = ctx.room;
  const PAL = pals || [['#7fa6d0', '#e8d8b8', '#6a7a4a', '#3a4a2a'], ['#e8a060', '#f8e0b0', '#8a5a3a', '#3a2418'], ['#9ab8d8', '#f0f0f0', '#b0c0d0', '#6a7a8a'], ['#2a4a7a', '#8ab0d0', '#1e6a8a', '#0e3a5a']];
  sides.forEach((side, si) => {
    const horiz = side === 'n' || side === 's';
    const a = (horiz ? r.x0 : r.z0) + 2, b = (horiz ? r.x1 : r.z1) - 2;
    for (let i = 0; i < n; i++) {
      const t = a + (i + 0.5) * (b - a) / n;
      const o = side === 'n' ? { x: t, z: r.z0, face: 180 } : side === 's' ? { x: t, z: r.z1, face: 0 } : side === 'w' ? { x: r.x0, z: t, face: 90 } : { x: r.x1, z: t, face: 270 };
      const blocked = ctx.W.portals.some((p) => Math.abs(p.y - r.y) < 0.1 && (horiz ? (p.axis === 'z' && t > p.x0 - 2 && t < p.x1 + 2 && (Math.abs(p.z1 - r.z0) < 0.1 || Math.abs(p.z0 - r.z1) < 0.1) && (side === 'n' ? Math.abs(p.z1 - r.z0) < 0.1 : Math.abs(p.z0 - r.z1) < 0.1)) : (p.axis === 'x' && t > p.z0 - 2 && t < p.z1 + 2 && (side === 'w' ? Math.abs(p.x1 - r.x0) < 0.1 : Math.abs(p.x0 - r.x1) < 0.1))));
      if (blocked) continue;
      const th = o.face * Math.PI / 180;
      ctx.geo.rbox('satin', o.x + Math.sin(th) * 0.02, r.y + 1.35, o.z - Math.cos(th) * 0.02, 2.5, 1.7, 0.04, Math.PI - th, { color: 0x1c1c1e });
      picture(ctx, { ...o, x: o.x + Math.sin(th) * 0.02, z: o.z - Math.cos(th) * 0.02, y: r.y + 2.2, w: 2.3, h: 1.5, px: 512 }, landscape(seed + si * 10 + i, PAL[(i + si) % PAL.length]));
    }
  });
}
export function gallery3(ctx) {
  const { room } = ctx;
  const y = room.y, [cx, cz] = mid(room);
  photoWalls(ctx, ['n', 's'], 8, 40);
  for (const dx of [-14, 0, 14]) { bench(ctx, cx + dx, y, cz, 0, 2.4, 0x3a3a3c); }
  ctx.placard({ title: 'Gallery 3', sub: 'Special exhibitions', text: 'The museum\'s largest temporary-exhibition gallery, shown here hung with landscape photographs from museum expeditions.', x: room.x0 + 3, y, z: cz + 3, face: 90 });
}
export function secorner3(ctx) { photoWalls(ctx, ['e', 's'], 4, 60); bench(ctx, ...mid(ctx.room).slice(0, 1), ctx.room.y, mid(ctx.room)[1], 0, 2.4, 0x3a3a3c); }
export function roselink3(ctx) { photoWalls(ctx, ['e'], 4, 80, [['#05060c', '#2a1a4a', '#4a2a6a', '#0a0a1a'], ['#05060c', '#1a2a5a', '#2a4a8a', '#05060c']]); }
export function akeleygallery(ctx) {
  const { room } = ctx;
  photoWalls(ctx, ['w'], 4, 90, [['#c9a878', '#e8d8b0', '#a8935a', '#6a5a34'], ['#7fa6d0', '#e8d8b8', '#6a7a4a', '#3a4a2a']]);
  ctx.placard({ title: 'Akeley Gallery', sub: 'Carl Akeley, 1864–1926', text: 'Photographs from the expeditions that built the African hall. Akeley also invented a motion-picture camera to film animals in the field, and persuaded King Albert of Belgium to create Africa\'s first national park to protect the mountain gorilla.', x: room.x1 - 1.4, y: room.y, z: 12, face: 270 });
}
export function crossing1(ctx) {
  const { room, geo } = ctx;
  const y = room.y;
  geo.box('bronze', -3, y, room.z0 + 0.02, 3, y + 3.3, room.z0 + 0.14, { color: 0x4a3a2a });
  ctx.sign('LEFRAK THEATER', 0, y + 3.8, room.z0 + 0.03, 180, 0.34, { color: '#6a5238' });
  picture(ctx, { x: -9, y: y + 2.3, z: room.z0, face: 180, w: 3, h: 2.2 }, landscape(7, ['#1e3a6a', '#8ab0d0', '#2a6a8a', '#0e2a4a']));
  ctx.placard({ title: 'LeFrak Theater', sub: 'Giant-screen films', text: 'A 40-foot-high screen in the museum\'s original 1,000-seat auditorium of 1900.', x: 4.4, y, z: room.z0 + 1.2, face: 180 });
  for (const x of [-12, 12]) bench(ctx, x, y, room.z1 - 1.2, 0, 2.4);
}
export function crossing2(ctx) { photoWalls(ctx, ['n'], 5, 110); for (const x of [-12, 12]) bench(ctx, x, ctx.room.y, ctx.room.z1 - 1.2, 0, 2.4); }
export function crossing4(ctx) {
  const { room } = ctx;
  textPanel(ctx, { x: -6, y: room.y + 2.5, z: room.z0 + 0.03, face: 180, w: 8, h: 2.6, heading: 'A Walk Through the Tree of Life', text: 'The fossil halls are arranged not by time but by family tree. Follow the black path on the floor: each branching point marks a new feature — jaws, four limbs, the watertight egg — inherited by every animal beyond it.', bg: '#ebe3d0', fg: '#4a4034', headSize: 70, size: 40 });
  for (const x of [-12, 12]) bench(ctx, x, room.y, room.z1 - 1.2, 0, 2.4, 0x8a7a66);
}
export function shop4(ctx) {
  const { room, geo } = ctx;
  const y = room.y;
  for (const zz of [0, 6, 12]) {
    geo.box('wood', room.x0 + 0.1, y, zz - 1.6, room.x0 + 0.7, y + 2.2, zz + 1.6, { color: 0xb8a078 });
    ctx.phys.box(room.x0, zz - 1.6, room.x0 + 0.7, zz + 1.6, y, y + 2.2);
    for (let k = 0; k < 12; k++) geo.add('gloss', ellipsoid([0, 0, 0], [0.12, 0.09, 0.2], { seg: 8, rings: 5 }), xform(room.x0 + 0.5, y + 0.7 + (k % 3) * 0.6, zz - 1.3 + Math.floor(k / 3) * 0.85, 0), [0x4a7a3a, 0x8a5a2a, 0x5a6a8a, 0xb8402a][k % 4]);
  }
  ctx.sign('DINO STORE', room.x0 + 0.72, y + 2.6, 6, 90, 0.26, { color: '#6a5238', sans: true });
}
void pot; void mask; void THREE;
