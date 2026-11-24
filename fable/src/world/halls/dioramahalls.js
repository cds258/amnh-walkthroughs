// The classic habitat-group halls: North American Mammals, Small Mammals, Asian Mammals, Reptiles and
// Amphibians, North American Birds, Birds of the World, New York City Birds, New York State Mammals,
// North American Forests and the Warburg Hall of New York State Environment.
import * as THREE from 'three';
import { xform, shade, col } from '../../engine/builder.js';
import { dioramaRun } from '../dioramas.js';
import { model } from '../../models/index.js';
import { textPanel, picture } from '../../engine/placards.js';
import { bench, blob, island } from '../furniture.js';
import { tube, ellipsoid } from '../../models/loft.js';
import { bird, wallCase, putBird, landscape } from '../kit.js';

const A = (d, name, u, z, rot, opts, s, dy) => d.put(model('animals', name, opts || {}), u, z, rot, s || 1, dy || 0);
/** Small procedural bird inside a diorama. c: {body, head, wing, beak, leg, legs, beak (length)} */
function B(d, L, u, z, rot, c, dy = 0) {
  const cols = { body: c.body, head: c.head ?? c.body, wing: c.wing ?? shade(c.body, 0.7), beak: c.bk ?? 0xd9a020, leg: c.leg ?? 0x4a3a2a };
  const m = xform(u, d.ground(u, z) + dy, z, rot * Math.PI / 180);
  for (const [g, k] of bird(L, c)) d.add('dio', g, cols[k], m);
}
/** Snake lying on the ground of a diorama. */
function snake(d, u, z, len, r, color, band) {
  const pts = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = t * 7;
    const px = u + Math.cos(a) * (0.25 + t * len * 0.16), pz = z + Math.sin(a) * (0.2 + t * len * 0.1);
    pts.push([px, d.ground(px, pz) + r * 0.9 + (i === n ? r * 3 : 0), pz]);
  }
  d.add('dio', tube(pts, pts.map((_, i) => r * (i === n ? 0.9 : 0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, i / n * 1.3)))), { radial: 7, sub: 3, color: band ? (uu) => col(Math.floor(uu * 26) % 2 ? band : color) : undefined }), band ? 0xffffff : color);
}
const slots = (a, b, n) => Array.from({ length: n }, (_, i) => a + (i + 0.5) * (b - a) / n);
const lay = (list, a, b, o = {}) => { const xs = slots(a, b, list.length); return list.map((it, i) => ({ ...o, ...it, at: xs[i] })); };

// ---------------------------------------------------------------------------
// Bernard Family Hall of North American Mammals (floor 1)
// ---------------------------------------------------------------------------
const NAM_N = [
  { id: 'brownbear', star: true, title: 'Alaska Brown Bear', sub: 'Canoe Bay, Alaska Peninsula', biome: 'mountain', seed: 41, h: 3.6,
    text: 'The largest land carnivore in North America: one bear rears to its full nine feet while another stands over a salmon, with the Aghileen Pinnacles and the smoking cone of Pavlof volcano behind.',
    scene: (d) => { d.sheet(-3, -0.2, 0.6, -1.4, 0.05, 0x7d98a2); A(d, 'brownbear', -0.9, -2.0, 15, { pose: 'upright', seed: 1 }); A(d, 'brownbear', 1.5, -1.6, 175, { pose: 'stand', seed: 2 }, 0.95); d.grass(60, { h: 0.5, color: 0x7a8a3e }).rocks(5, 0.3).bush(2.7, -3.0, 0.7); } },
  { id: 'moose', star: true, title: 'Alaska Moose', sub: 'Kenai Peninsula, Alaska', biome: 'autumn', seed: 42, h: 3.6,
    text: 'Two bulls, the largest deer in the world, square off in a muskeg bog in the rutting season of early autumn.',
    scene: (d) => { A(d, 'moose', -1.4, -1.8, 8, { seed: 1 }); A(d, 'moose', 1.5, -2.2, 172, { pose: 'alert', seed: 2 }, 0.96); d.tree('conifer', -2.7, -3.1, 3).tree('conifer', 2.8, -3.2, 2.6).grass(70, { h: 0.45, color: 0xa8873a }).bush(0.2, -3.2, 0.6, 0xa8632a); } },
  { title: 'Grizzly Bear', sub: 'Yellowstone National Park, Wyoming', biome: 'canyon', seed: 43,
    text: 'A sow and her cubs above the Grand Canyon of the Yellowstone, with the Lower Falls in the distance.',
    scene: (d) => { A(d, 'brownbear', -0.8, -1.7, 10, { pose: 'stand', seed: 3 }, 0.85); A(d, 'brownbear', 1.2, -1.3, 160, { pose: 'sit', seed: 4 }, 0.45); A(d, 'brownbear', 2.0, -2.3, 200, { pose: 'walk', seed: 5 }, 0.42); d.tree('conifer', -2.6, -3.0, 2.8).rocks(6, 0.35, 0xc9a66a).grass(30); } },
  { id: 'wolves', star: true, title: 'Wolf', sub: 'Gunflint Lake, Minnesota', biome: 'night', seed: 44,
    text: 'Two wolves run a deer trail across the frozen lake at midnight under the northern lights — the only night scene in the hall.',
    scene: (d) => { d.sheet(-3, -0.1, 3, -3.4, 0.03, 0xb8c6dc); A(d, 'wolf', -1.2, -1.6, 12, { pose: 'walk', seed: 1 }); A(d, 'wolf', 1.0, -2.3, 14, { pose: 'walk', seed: 2 }, 0.95); d.tree('conifer', 2.7, -3.2, 2.8, 0x16241c).tree('conifer', -2.8, -3.3, 2.4, 0x16241c); } },
  { title: 'Mountain Goat', sub: 'Tongass National Forest, Alaska', biome: 'alpine', seed: 45,
    text: 'White goats on a ledge high above a tidewater glacier of the Alaska coast.',
    scene: (d) => { d.mound(-1.5, -2.6, 1.8, 0.9, 1.2, 0x8a8c90).mound(1.6, -3.0, 2.0, 0.6, 1.0, 0x9a9ca0); A(d, 'mountaingoat', -1.2, -1.5, 10, { seed: 1 }); A(d, 'mountaingoat', 1.0, -1.9, 170, { seed: 2 }, 0.9); A(d, 'mountaingoat', 2.2, -1.3, 195, { seed: 3 }, 0.55); d.rocks(6, 0.3, 0x8a8c90); } },
  { title: 'Musk Ox', sub: 'Ellesmere Island, Nunavut', biome: 'tundra', seed: 46,
    text: 'Survivors of the Ice Age, on the wind-scoured tundra of the High Arctic.',
    scene: (d) => { A(d, 'muskox', -1.3, -1.7, 10, { seed: 1 }); A(d, 'muskox', 0.8, -2.4, 170, { seed: 2 }, 0.95); A(d, 'muskox', 2.1, -1.5, 195, { seed: 3 }, 0.7); d.rocks(6, 0.2, 0x7a7872).grass(30, { h: 0.2, color: 0x8a8450 }); } },
  { title: 'Dall Sheep', sub: 'Denali, Alaska', biome: 'alpine', seed: 47,
    text: 'Pure white wild sheep on the slopes below the highest peak in North America.',
    scene: (d) => { A(d, 'bighorn', -1.2, -1.6, 10, { seed: 1 }, 0.95); A(d, 'bighorn', 1.0, -2.3, 170, { seed: 2 }, 0.9); A(d, 'bighorn', 2.2, -1.4, 190, { seed: 3 }, 0.85); d.rocks(7, 0.3, 0x9a9ca0).grass(25, { h: 0.2 }); } },
];
const NAM_S = [
  { id: 'bison', star: true, title: 'American Bison and Pronghorn', sub: 'Wyoming plains, mid-1800s', biome: 'prairie', seed: 51, h: 3.6,
    text: 'The grasslands as they were when tens of millions of bison still roamed them. The group is the largest in the hall; a pronghorn, the fastest land animal in the Americas, shares the prairie.',
    scene: (d) => { A(d, 'bison', -1.5, -1.6, 10, { seed: 1 }); A(d, 'bison', 0.6, -2.6, 172, { pose: 'graze', seed: 2 }, 0.95); A(d, 'bison', 2.2, -1.5, 195, { seed: 3 }, 0.6); A(d, 'gazelle', -2.5, -2.8, 20, { seed: 4 }, 1.15); d.grass(90, { h: 0.4, color: 0xa89648 }); } },
  { title: 'Wapiti', sub: 'White River, Colorado', biome: 'autumn', seed: 52,
    text: 'A bull elk bugles to his harem among golden aspens in the Rockies.',
    scene: (d) => { A(d, 'elk', -1.0, -1.7, 12, { pose: 'alert', seed: 1 }); A(d, 'elk', 1.3, -2.4, 170, { pose: 'graze', seed: 2, sex: 'f' }, 0.9); A(d, 'elk', 2.3, -1.4, 195, { seed: 3, sex: 'f' }, 0.88); d.tree('broadleaf', -2.6, -3.0, 3, 0xc9a23a).tree('broadleaf', 2.8, -3.2, 2.8, 0xd0aa40).grass(60, { color: 0xa8873a }); } },
  { title: 'Grant Caribou', sub: 'Alaska Peninsula', biome: 'tundra', seed: 53,
    text: 'Caribou on autumn tundra; both sexes carry antlers.',
    scene: (d) => { A(d, 'caribou', -1.2, -1.6, 10, { seed: 1 }); A(d, 'caribou', 0.9, -2.5, 20, { pose: 'graze', seed: 2 }, 0.92); A(d, 'caribou', 2.2, -1.5, 190, { seed: 3 }, 0.9); d.grass(50, { h: 0.25, color: 0xa86a3a }).rocks(4, 0.2); } },
  { title: 'Mule Deer', sub: 'Devils Tower, Wyoming', biome: 'canyon', seed: 54,
    text: 'Two bucks spar while does look on, beneath the first national monument in the United States.',
    scene: (d) => { A(d, 'deer', -1.0, -1.6, 8, { seed: 1 }); A(d, 'deer', 0.7, -1.8, 174, { seed: 2 }); A(d, 'deer', 2.2, -2.7, 200, { seed: 3, sex: 'f' }, 0.9); d.tree('conifer', -2.7, -3.1, 2.6).grass(50, { color: 0x9a8a48 }).rocks(3, 0.25, 0xb08a60); } },
  { title: 'White-tailed Deer', sub: 'Bear Mountain, New York', biome: 'autumn', seed: 55,
    text: 'A buck, doe and fawn in a Hudson Highlands wood in October, an hour north of the museum.',
    scene: (d) => { A(d, 'deer', -1.1, -1.7, 12, { pose: 'alert', seed: 4 }); A(d, 'deer', 1.0, -2.3, 170, { seed: 5, sex: 'f' }, 0.9); A(d, 'deer', 2.0, -1.4, 195, { seed: 6, sex: 'f' }, 0.55); d.tree('broadleaf', 2.7, -3.1, 3.2, 0xc8642a).tree('broadleaf', -2.7, -3.0, 3, 0xd08a2a).grass(40, { color: 0xa87a3a }).log(0.2, -3.0, 1.8); } },
  { title: 'Jaguar', sub: 'Sonora, Mexico', biome: 'desert', seed: 56,
    text: 'The largest cat of the Americas at the northern edge of its range, at sunset above a desert river.',
    scene: (d) => { d.mound(-1.2, -2.6, 2.0, 0.6, 1.2, 0xb08a60); A(d, 'jaguar', -0.9, -1.8, 12, { pose: 'stand', seed: 1 }); A(d, 'jaguar', 1.5, -2.2, 172, { pose: 'lie', seed: 2 }, 0.95); d.rocks(5, 0.3, 0xb08a60).bush(2.6, -3.0, 0.6, 0x7a8a4a); } },
  { title: 'Mountain Lion', sub: 'Grand Canyon, Arizona', biome: 'canyon', seed: 57,
    text: 'Two cougars rest on a ledge of the South Rim as evening shadow fills the canyon.',
    scene: (d) => { d.mound(0, -2.8, 3.0, 0.5, 1.0, 0xc49a6a); A(d, 'cougar', -1.0, -1.7, 10, { pose: 'lie', seed: 1 }); A(d, 'cougar', 1.3, -2.1, 170, { pose: 'sit', seed: 2 }); d.rocks(6, 0.3, 0xc49a6a).tree('conifer', 2.8, -3.2, 2.2); } },
];
export function namammals(ctx) {
  const { room, lights } = ctx;
  const y = room.y, { x0, x1 } = room;
  dioramaRun(ctx, { side: 'n', a: x0, b: x1, depth: 4.3, y, h: room.h, items: lay(NAM_N, x0, x1, { w: 4.9 }) });
  dioramaRun(ctx, { side: 's', a: x0, b: x1, depth: 4.3, y, h: room.h, items: lay([...NAM_S].reverse(), x0, x1, { w: 4.9 }) });
  for (const x of [30, 44, 58]) { lights.anchor(x, y + 4.6, 0, { color: 0xffd9a0, intensity: 22, dist: 20 }); bench(ctx, x, y, 0, 0, 2.4); }
  ctx.sign('BERNARD FAMILY HALL OF NORTH AMERICAN MAMMALS', x1 - 0.02, y + 4.8, 0, 270, 0.26, { color: '#c9a25e' });
  ctx.placard({ title: 'Hall of North American Mammals', sub: 'Opened 1942 · restored 2012', list: false,
    text: 'Each diorama shows a real place at a particular time of day and year. The backgrounds were painted from field studies by James Perry Wilson and others, whose curved canvases erase the join between the foreground and the painted distance.',
    x: x1 - 4.6, y, z: 4.4, face: 90 });
  ctx.view('main', x1 - 3, y, 0, 270, 2);
}

// ---------------------------------------------------------------------------
// Hall of Small Mammals (floor 1 corridor) and floor-3 corridor / crossing halls
// ---------------------------------------------------------------------------
export function smallmammals(ctx) {
  const { room } = ctx;
  const y = room.y;
  const items = [
    { title: 'Coyote', sub: 'Yosemite Valley, California', biome: 'mountain', seed: 61, text: 'Coyotes howl at dawn beneath El Capitan.', scene: (d) => { A(d, 'wolf', -0.4, -0.8, 10, { pose: 'sit', seed: 3 }, 0.62); A(d, 'wolf', 0.6, -1.0, 170, { pose: 'stand', seed: 4 }, 0.6); d.grass(20, { h: 0.2 }); } },
    { title: 'Collared Peccary', sub: 'Sonoran Desert, Arizona', biome: 'desert', seed: 62, text: 'The only wild pig-like mammal native to the United States.', scene: (d) => { A(d, 'bushpig', -0.4, -0.8, 10, { seed: 1 }, 0.62); A(d, 'bushpig', 0.6, -1.0, 170, { seed: 2 }, 0.55); d.rocks(3, 0.15, 0xb08a60); } },
    { title: 'Wolverine', sub: 'Northern Quebec', biome: 'tundra', seed: 63, text: 'The largest land-dwelling member of the weasel family, powerful out of all proportion to its size.', scene: (d) => { A(d, 'brownbear', 0, -0.9, 10, { pose: 'walk', seed: 6 }, 0.3); d.rocks(4, 0.15).grass(15, { h: 0.15 }); } },
    { title: 'Gray Fox', sub: 'Great Smoky Mountains, Tennessee', biome: 'broadleaf', seed: 64, text: 'The only North American dog that regularly climbs trees.', scene: (d) => { A(d, 'jackal', -0.3, -0.8, 10, { seed: 2 }, 0.9); A(d, 'jackal', 0.6, -1.1, 175, { pose: 'sit', seed: 3 }, 0.85); d.log(0, -1.3, 1.4).grass(20, { color: 0x4f7a34 }); } },
    { title: 'Canada Lynx and Snowshoe Hare', sub: 'Mount Albert, Quebec', biome: 'arctic', seed: 65, text: 'Hunter and hunted, whose numbers rise and fall together in a ten-year cycle.', scene: (d) => { d.sheet(-2, -0.05, 2, -1.6, 0.03, 0xe8eef4); A(d, 'cougar', -0.2, -0.9, 10, { pose: 'alert', seed: 5 }, 0.6); d.tree('conifer', 0.9, -1.4, 1.4); } },
  ];
  dioramaRun(ctx, { side: 'w', a: room.z0 + 0.6, b: room.z1 - 0.6, depth: 2.4, y, h: room.h, items: lay(items, room.z0 + 0.6, room.z1 - 0.6, { w: 2.6, h: 1.7, sill: 0.95, rise: 0.15 }) });
  ctx.sign('SMALL MAMMALS', room.x1 - 0.02, y + 4.2, 12, 270, 0.26, { color: '#c9a25e' });
}

export function crossing3(ctx) {
  // Hall of New York State Mammals
  const { room } = ctx;
  const y = room.y;
  const items = [
    { title: 'Red Fox', sub: 'New York State', biome: 'autumn', seed: 71, text: 'Common from the Adirondacks to the edges of the city.', scene: (d) => { A(d, 'jackal', 0, -0.9, 10, { seed: 5 }, 0.95); d.grass(20, { color: 0xa87a3a }); } },
    { title: 'White-tailed Deer', sub: 'New York State', biome: 'broadleaf', seed: 72, text: 'The state\'s largest common mammal.', scene: (d) => { A(d, 'deer', 0, -1.0, 10, { seed: 7 }, 0.75); d.grass(20, { color: 0x4f7a34 }); } },
    { title: 'Black Bear', sub: 'Catskill Mountains', biome: 'conifer', seed: 73, text: 'Some 6,000 to 8,000 black bears live in New York State.', scene: (d) => { A(d, 'brownbear', 0, -1.0, 10, { pose: 'walk', seed: 8 }, 0.55); d.tree('conifer', 0.9, -1.4, 1.5); } },
    { title: 'Eastern Coyote', sub: 'New York State', biome: 'arctic', seed: 74, text: 'A newcomer that reached the state in the 1930s and now lives even in the Bronx.', scene: (d) => { d.sheet(-2, -0.05, 2, -1.6, 0.03, 0xe8eef4); A(d, 'wolf', 0, -0.9, 170, { seed: 9 }, 0.65); } },
  ];
  dioramaRun(ctx, { side: 'n', a: room.x0 + 1, b: 13, depth: 2.2, y, h: room.h, items: lay(items, room.x0 + 1, 13, { w: 2.8, h: 1.7, sill: 0.95, rise: 0.15 }) });
  ctx.sign('NEW YORK STATE MAMMALS', 0, y + 4.4, room.z1 - 0.02, 0, 0.26, { color: '#c9a25e' });
}

const BIRDC = {
  robin: { body: 0x6a5a4a, head: 0x2a2a2a, wing: 0x4a4038, bk: 0xd9a020 }, jay: { body: 0x4a78b8, head: 0x4a78b8, wing: 0x2f5a98 },
  cardinal: { body: 0xb8281e, head: 0xb8281e, wing: 0x8a1e18, bk: 0xd96a20 }, pigeon: { body: 0x7a8088, head: 0x4a5a6a, wing: 0x5a6068 },
  owl: { body: 0x8a6a4a, head: 0x9a7a5a, wing: 0x6a4e36, beak: 0.06 }, hawk: { body: 0x7a5a3e, head: 0x8a6a4a, wing: 0x5a4028, beak: 0.1 },
  duck: { body: 0x8a7a66, head: 0x1e5a3a, wing: 0x6a5a4a, legs: 0.08 }, gull: { body: 0xe8e8e8, head: 0xf2f2f2, wing: 0x9a9ea4 },
  crane: { body: 0xe8e8e4, head: 0xb8281e, wing: 0xc9c9c4, legs: 1.1, beak: 0.3 }, goose: { body: 0x7a6a58, head: 0x1a1a1a, wing: 0x5a4e40, legs: 0.2 },
  turkey: { body: 0x4a3626, head: 0x8a3a3a, wing: 0x6a4a2e, legs: 0.35 }, puffin: { body: 0x1a1a1c, head: 0xe8e8e8, wing: 0x101012, bk: 0xd9601e },
  parrot: { body: 0x2f9a3a, head: 0xd9c020, wing: 0x2060b8, bk: 0x2a2a2a }, toucan: { body: 0x141414, head: 0xe8d040, wing: 0x101010, bk: 0xe07a1e, beak: 0.4 },
  bop: { body: 0x7a3a1e, head: 0x2f8a5a, wing: 0xd9b030 }, condor: { body: 0x18181a, head: 0xc98a6a, wing: 0x101012, beak: 0.12 },
};

export function nycbirds(ctx) {
  const { room } = ctx;
  const y = room.y;
  const groups = [['Birds of Central Park', 'More than 280 species have been recorded in the park across the street — a vital stop on the Atlantic Flyway.', ['robin', 'jay', 'cardinal', 'pigeon']],
    ['Birds of Prey', 'Red-tailed hawks nest on Fifth Avenue ledges; peregrine falcons hunt from the bridges.', ['hawk', 'owl', 'hawk']],
    ['Water Birds of the Harbor', 'Herons, egrets and ibis nest on the small islands of New York Harbor.', ['duck', 'gull', 'goose', 'duck']],
    ['Winter Visitors', 'Birds from the boreal forest that pass the cold months in the city.', ['owl', 'jay', 'robin', 'cardinal']]];
  groups.forEach((gr, i) => {
    wallCase(ctx, { x: room.x0, z: room.z0 + 3.4 + i * 5.6, face: 90, y, w: 3.8, h: 1.9, d: 0.7, back: 0xcfd8c8,
      label: { title: gr[0], sub: 'Birds of New York City', text: gr[1] },
      fill: (L, w, h, d, deck) => {
        L.add('flat', tube([[-w / 2 + 0.2, 0.7, 0.2], [0, 0.9, 0.35], [w / 2 - 0.2, 0.75, 0.25]], 0.03, { radial: 5, sub: 3 }), 0, deck, 0, 0, 1, 0x4a3a2a);
        gr[2].forEach((b, k) => putBird(L, -w / 2 + (k + 0.6) * w / (gr[2].length + 0.2), deck + (k % 2 ? 0.86 : 0), d * 0.5, k % 2 ? 180 : 10, b === 'hawk' || b === 'owl' || b === 'goose' ? 0.5 : 0.24, BIRDC[b]));
      } });
  });
  ctx.sign('BIRDS OF NEW YORK CITY', room.x1 - 0.02, y + 4.2, 12, 270, 0.24, { color: '#c9a25e' });
}

// ---------------------------------------------------------------------------
// Hall of Asian Mammals (floor 2)
// ---------------------------------------------------------------------------
const ASIA_W = [
  { id: 'tiger', star: true, title: 'Tiger', sub: 'Central India', biome: 'jungle', seed: 81, h: 3.4,
    text: 'A pair of Bengal tigers in sal forest. Arthur Vernay and Colonel John Faunthorpe collected most of this hall\'s animals on six expeditions to India, Burma and Siam between 1922 and 1928.',
    scene: (d) => { A(d, 'tiger', -1.1, -1.7, 12, { pose: 'walk', seed: 1 }); A(d, 'tiger', 1.3, -2.3, 170, { pose: 'lie', seed: 2 }, 0.95); d.tree('bamboo', -2.6, -2.9, 3.2).tree('broadleaf', 2.7, -3.1, 3.2, 0x2f5a26).grass(60, { h: 0.6, color: 0x8a8a3e }); } },
  { title: 'Indian Rhinoceros', sub: 'Nepal terai', biome: 'swamp', seed: 82,
    text: 'The great one-horned rhinoceros, armoured in folded skin, in tall elephant grass.',
    scene: (d) => { A(d, 'indianrhino', -0.9, -1.8, 10, { seed: 1 }); A(d, 'indianrhino', 1.6, -2.4, 172, { seed: 2 }, 0.6); d.grass(90, { h: 0.9, color: 0x7a8a3e }); } },
  { title: 'Water Buffalo', sub: 'Central Provinces, India', biome: 'nile', seed: 83,
    text: 'Wild water buffalo, ancestors of the domestic animal, at a forest pool.',
    scene: (d) => { d.sheet(-3, -0.2, 0.5, -1.6, 0.05, 0x6f8a80); A(d, 'waterbuffalo', -1.2, -1.7, 12, { seed: 1 }); A(d, 'waterbuffalo', 1.3, -2.4, 170, { seed: 2 }, 0.92); d.grass(60, { h: 0.6, color: 0x5c8238 }); } },
  { title: 'Leopard', sub: 'Southern India', biome: 'jungle', seed: 84,
    text: 'A leopard guards its kill, a peacock, in dry jungle at dusk.',
    scene: (d) => { d.log(0.2, -2.0, 2.4, 0.2); A(d, 'leopard', -0.8, -1.7, 12, { pose: 'stand', seed: 1 }); A(d, 'leopard', 1.5, -2.5, 170, { pose: 'lie', seed: 2 }, 0.9); d.tree('broadleaf', -2.6, -3.0, 3).grass(40, { color: 0x6a7a34 }); } },
  { title: 'Sambar', sub: 'Mysore, India', biome: 'broadleaf', seed: 85,
    text: 'The largest deer of southern Asia, and the tiger\'s chief prey.',
    scene: (d) => { A(d, 'elk', -1.0, -1.7, 10, { seed: 5 }, 0.9); A(d, 'elk', 1.3, -2.4, 170, { seed: 6, sex: 'f' }, 0.82); d.tree('broadleaf', 2.7, -3.1, 3.2).grass(50, { color: 0x5c7a34 }); } },
  { title: 'Asiatic Wild Dog', sub: 'Central India', biome: 'savannagreen', seed: 86,
    text: 'Dholes hunt in packs that can drive even a tiger from its kill.',
    scene: (d) => { A(d, 'wilddog', -1.2, -1.6, 10, { seed: 1 }); A(d, 'wilddog', 0.4, -2.3, 20, { pose: 'alert', seed: 2 }, 0.95); A(d, 'wilddog', 1.9, -1.6, 190, { pose: 'sit', seed: 3 }, 0.95); d.grass(50).rocks(3, 0.25); } },
];
const ASIA_E = [
  { id: 'panda', star: true, title: 'Giant Panda', sub: 'Sichuan, China', biome: 'bamboo', seed: 91, h: 3.4,
    text: 'Pandas in the cold bamboo forest of the Sichuan mountains, collected in the 1930s when the animal was almost unknown in the West.',
    scene: (d) => { A(d, 'panda', -0.9, -1.6, 12, { pose: 'stand', seed: 1 }); A(d, 'panda', 1.3, -2.2, 172, { pose: 'walk', seed: 2 }, 0.9); d.tree('bamboo', -2.5, -2.8, 3.2).tree('bamboo', 2.6, -2.2, 3.0).tree('bamboo', 0.3, -3.2, 3.4).rocks(3, 0.3); } },
  { title: 'Indian Lion', sub: 'Gir Forest, Gujarat', biome: 'savanna', seed: 92,
    text: 'The last wild lions of Asia survive only in the Gir Forest.',
    scene: (d) => { A(d, 'lion', -1.0, -1.8, 12, { pose: 'stand', seed: 6 }, 0.94); A(d, 'lioness', 1.3, -2.2, 170, { pose: 'lie', seed: 7 }, 0.94); d.tree('acacia', 2.6, -3.1, 2.8).grass(50, { color: 0xa8935a }); } },
  { title: 'Gaur', sub: 'Mysore, India', biome: 'jungle', seed: 93,
    text: 'The largest of all wild cattle; a bull may stand six feet at the shoulder.',
    scene: (d) => { A(d, 'buffalo', -1.1, -1.8, 10, { seed: 7 }, 1.12); A(d, 'buffalo', 1.4, -2.4, 170, { seed: 8 }, 1.0); d.tree('bamboo', 2.6, -2.9, 3.2).grass(60, { h: 0.5, color: 0x4f7a34 }); } },
  { title: 'Siberian Tiger', sub: 'Amur River, Russia', biome: 'arctic', seed: 94,
    text: 'The largest of the cats, in the snowbound forest of the Russian Far East.',
    scene: (d) => { d.sheet(-3, -0.1, 3, -3.4, 0.04, 0xe8eef4); A(d, 'tiger', -0.6, -1.8, 12, { pose: 'stand', seed: 4 }, 1.08); d.tree('conifer', 2.5, -3.0, 3).tree('conifer', -2.6, -3.1, 2.6); } },
  { title: 'Blackbuck and Chinkara', sub: 'Plains of India', biome: 'savanna', seed: 95,
    text: 'Spiral-horned antelope of the open Indian plain.',
    scene: (d) => { A(d, 'impala', -1.3, -1.6, 10, { seed: 6 }, 0.9); A(d, 'gazelle', 0.5, -2.3, 20, { seed: 7 }); A(d, 'gazelle', 2.0, -1.5, 190, { seed: 8 }, 0.95); d.grass(60, { color: 0xb09a5c }); } },
  { title: 'Sloth Bear', sub: 'Central India', biome: 'broadleaf', seed: 96,
    text: 'A shaggy insect-eater that sucks termites from their mounds.',
    scene: (d) => { d.termite(1.4, -2.3, 1.2); A(d, 'brownbear', -0.6, -1.7, 12, { pose: 'stand', seed: 9 }, 0.6); d.tree('broadleaf', -2.6, -3.0, 3).grass(40); } },
];
export function asianmammals(ctx) {
  const { room, geo, phys, lights } = ctx;
  const y = room.y, { z0, z1 } = room, cx = (room.x0 + room.x1) / 2;
  dioramaRun(ctx, { side: 'w', a: z0 + 2, b: z1 - 2, depth: 4.0, y, h: room.h, items: lay(ASIA_W, z0 + 2, z1 - 2, { w: 5.2 }) });
  dioramaRun(ctx, { side: 'e', a: z0 + 2, b: z1 - 2, depth: 4.0, y, h: room.h, items: lay(ASIA_E, z0 + 2, z1 - 2, { w: 5.2 }) });
  // the pair of Indian elephants in the centre
  const cz = (z0 + z1) / 2;
  island(ctx, cx - 2.6, cz - 5.2, cx + 2.6, cz + 5.2, y, 0.4, 0x3a362f, 'darkmarble');
  geo.addGeo(model('animals', 'indianelephant', { sex: 'bull', pose: 'walk', seed: 1 }), xform(cx + 0.3, y + 0.4, cz - 2.0, Math.PI / 2));
  geo.addGeo(model('animals', 'indianelephant', { sex: 'cow', pose: 'stand', seed: 2 }), xform(cx - 0.4, y + 0.4, cz + 2.4, Math.PI / 2 + 0.15));
  blob(geo, cx, y + 0.41, cz, 2.0, 4.6);
  lights.anchor(cx, y + 5, cz, { color: 0xffd9a0, intensity: 40, dist: 20 });
  lights.anchor(cx, y + 4.8, cz - 18, { color: 0xffd9a0, intensity: 20, dist: 20 });
  lights.anchor(cx, y + 4.8, cz + 18, { color: 0xffd9a0, intensity: 20, dist: 20 });
  ctx.placard({ id: 'indianelephants', star: true, title: 'Indian Elephants', sub: 'Elephas maximus · Mysore, India',
    text: 'Smaller-eared and rounder-backed than their African cousins in the Akeley Hall. The pair was collected on the Vernay-Faunthorpe expedition of 1923 and has stood at the centre of the hall since it opened in 1930.',
    x: cx + 0.8, y, z: cz - 6.2, face: 0, target: [cx, y + 2.4, cz - 2], view: { x: cx + 1.6, y, z: cz - 10.5, yaw: 186, pitch: 6 } });
  for (const zz of [cz - 14, cz + 14]) bench(ctx, cx, y, zz, 90, 2.4);
  ctx.sign('HALL OF ASIAN MAMMALS', cx, y + 5.0, z0 + 0.02, 180, 0.3, { color: '#c9a25e' });
  ctx.view('main', cx, y, z0 + 3, 180, 2);
  void phys;
}

// ---------------------------------------------------------------------------
// Hall of Reptiles and Amphibians (floor 3)
// ---------------------------------------------------------------------------
const REP_E = [
  { id: 'komodo', star: true, title: 'Komodo Dragons', sub: 'Komodo Island, Indonesia', biome: 'island', seed: 101, h: 3.2,
    text: 'The world\'s largest lizards tear at the carcass of a wild boar. The group was collected in 1926 by the W. Douglas Burden expedition — the adventure that helped inspire the film King Kong.',
    scene: (d) => { A(d, 'bushpig', 0.2, -1.5, 80, { seed: 3 }, 0.9, -0.25); A(d, 'komodo', -1.4, -1.5, 5, { seed: 1 }); A(d, 'komodo', 1.6, -1.9, 168, { seed: 2 }, 0.92); A(d, 'komodo', 0.6, -3.0, 200, { seed: 3 }, 0.8); d.tree('palm', -2.6, -3.0, 3).grass(50, { h: 0.5, color: 0x9a8a48 }).rocks(4, 0.25); } },
  { title: 'American Alligator', sub: 'Okefenokee Swamp, Georgia', biome: 'swamp', seed: 102,
    text: 'A female guards her nest mound of rotting vegetation, whose heat incubates the eggs.',
    scene: (d) => { d.sheet(-3, -0.1, 3, -1.6, 0.05, 0x4a5a40); d.mound(1.2, -2.6, 1.0, 0.4, 0.8, 0x5a4a30); A(d, 'alligator', -0.8, -1.7, 12, { seed: 1 }); d.tree('broadleaf', 2.7, -3.2, 3, 0x4a6a40).grass(40, { h: 0.6, color: 0x5c7a38 }); } },
  { title: 'Galápagos Tortoise', sub: 'Isabela Island, Ecuador', biome: 'island', seed: 103,
    text: 'Giant tortoises, each island\'s race with its own shape of shell, were among the animals that set Darwin thinking.',
    scene: (d) => { A(d, 'tortoise', -1.0, -1.6, 12, { seed: 1 }); A(d, 'tortoise', 1.3, -2.3, 170, { seed: 2 }, 0.85); d.rocks(6, 0.3, 0x3a3634).bush(2.5, -3.0, 0.6, 0x7a8a4a).grass(20, { h: 0.2 }); } },
  { title: 'Reticulated Python', sub: 'Southeast Asia', biome: 'jungle', seed: 104,
    text: 'The longest of all snakes, coiled around her clutch of eggs to guard and warm them.',
    scene: (d) => { snake(d, 0, -1.8, 5, 0.11, 0x7a6a3a, 0x2a2418); for (let i = 0; i < 9; i++) d.add('dio', ellipsoid([Math.cos(i) * 0.25, d.ground(0, -1.8) + 0.07, -1.8 + Math.sin(i) * 0.2], [0.06, 0.045, 0.045], { seg: 6, rings: 4 }), 0xe8e2d0); d.tree('bamboo', -2.4, -2.8, 3).grass(40, { color: 0x356a2a }); } },
  { title: 'King Cobra', sub: 'India', biome: 'jungle', seed: 105,
    text: 'The largest venomous snake, rearing with spread hood. It preys mainly on other snakes.',
    scene: (d) => { snake(d, -0.4, -1.6, 3.4, 0.07, 0x5a5230); d.log(1.2, -2.2, 1.8, 0.16).grass(40, { color: 0x4f7a34 }); } },
  { title: 'Leatherback Turtle', sub: 'Florida coast', biome: 'coast', seed: 106,
    text: 'The largest living turtle comes ashore by night to bury her eggs in the sand.',
    scene: (d) => { A(d, 'tortoise', 0, -1.8, 12, { seed: 4 }, 1.6); d.mound(-2, -3, 2, 0.3, 1, 0xdcc89a); } },
];
const REP_W = [
  { title: 'Gila Monster and Rattlesnake', sub: 'Sonoran Desert', biome: 'desert', seed: 111,
    text: 'North America\'s venomous reptiles: the beaded Gila monster and a western diamondback, coiled to strike.',
    scene: (d) => { snake(d, 1.0, -1.6, 2.2, 0.05, 0xa89a78, 0x5a4a38); A(d, 'komodo', -1.0, -1.6, 10, { seed: 5 }, 0.2); d.rocks(5, 0.25, 0xb08a60).bush(-2.4, -2.8, 0.5, 0x8a8a52); } },
  { title: 'Frogs of the Rain Forest', sub: 'Central America', biome: 'jungle', seed: 112,
    text: 'Poison-dart frogs advertise their toxins with brilliant colour; tree frogs glide on webbed feet.',
    scene: (d) => { for (let i = 0; i < 7; i++) { const u = -2 + i * 0.7, z = -1.2 - (i % 3) * 0.5; d.add('dio', ellipsoid([u, d.ground(u, z) + 0.06, z], [0.07, 0.05, 0.05], { seg: 7, rings: 5 }), [0xd92a1e, 0x1e6ad9, 0xe8c81e, 0x2f9a3a][i % 4]); } d.tree('broadleaf', 2.4, -2.8, 2.8, 0x24521e).bush(-2.4, -2.6, 0.8, 0x2f6a26).grass(40, { color: 0x356a2a }); } },
  { title: 'Marine Iguanas', sub: 'Galápagos Islands', biome: 'coast', seed: 113,
    text: 'The only lizards that feed in the sea, basking on black lava to warm up after diving for algae.',
    scene: (d) => { d.mound(0, -2.4, 3, 0.5, 1.2, 0x2a2826); A(d, 'komodo', -1.2, -1.6, 10, { seed: 6 }, 0.38, 0.3); A(d, 'komodo', 0.8, -2.0, 170, { seed: 7 }, 0.34, 0.4); A(d, 'komodo', 1.8, -1.4, 200, { seed: 8 }, 0.3, 0.2); } },
  { title: 'Nile Crocodile', sub: 'East Africa', biome: 'nile', seed: 114,
    text: 'Crocodiles are the reptiles most closely related to birds — and to the dinosaurs upstairs.',
    scene: (d) => { d.sheet(-3, -0.1, 3, -1.4, 0.05, 0x7f9a96); A(d, 'alligator', 0.4, -1.8, 172, { seed: 3 }, 1.15); d.grass(40, { h: 0.6, color: 0x5c8238 }); } },
];
export function reptiles(ctx) {
  const { room, lights } = ctx;
  const y = room.y, { z0, z1 } = room, cx = (room.x0 + room.x1) / 2;
  dioramaRun(ctx, { side: 'e', a: z0 + 2, b: z1 - 2, depth: 4.0, y, h: room.h, items: lay(REP_E, z0 + 2, z1 - 2, { w: 5.2 }) });
  dioramaRun(ctx, { side: 'w', a: z0 + 12, b: z1 - 2, depth: 4.0, y, h: room.h, items: lay(REP_W, z0 + 12, z1 - 2, { w: 5.2 }) });
  for (const zz of [z0 + 10, (z0 + z1) / 2, z1 - 10]) { lights.anchor(cx, y + 4.6, zz, { color: 0xffd9a0, intensity: 22, dist: 20 }); bench(ctx, cx, y, zz + 3, 90, 2.4); }
  // skeleton of a giant: python vertebrae column in a central case
  textPanel(ctx, { x: room.x0 + 0.03, y: y + 2.6, z: z0 + 6.5, face: 90, w: 4.4, h: 2.2, heading: 'Reptiles and Amphibians', text: 'Two great groups of backboned animals that between them invented the shelled egg, the venomous bite and life on land. This hall explores their anatomy, defences, locomotion and care of their young.', bg: '#2c2a24', fg: '#e8dcc4', headSize: 70, size: 40 });
  ctx.sign('HALL OF REPTILES AND AMPHIBIANS', cx, y + 4.9, z1 - 0.02, 0, 0.28, { color: '#c9a25e' });
  ctx.view('main', cx, y, z0 + 4, 180, 2);
}

// ---------------------------------------------------------------------------
// Bird halls
// ---------------------------------------------------------------------------
const flock = (d, kind, n, size, seed = 1, spread = 2.4) => { for (let i = 0; i < n; i++) { const u = -spread + (i + 0.5) * 2 * spread / n + Math.sin(i * 7 + seed) * 0.3, z = -1.0 - ((i * 37 + seed * 11) % 20) / 10; B(d, size, u, z, (i % 2 ? 170 : 10) + Math.sin(i * 3) * 30, BIRDC[kind]); } };
const NAB = [
  { id: 'baldeagle', star: true, title: 'Bald Eagle', sub: 'Chilkat River, Alaska', biome: 'mountain', seed: 121, text: 'Thousands of eagles gather each autumn where late salmon runs keep the river open.', scene: (d) => { d.log(-0.6, -1.8, 2.2, 0.2, 10); A(d, 'eagle', -0.6, -1.8, 10, { seed: 1 }, 1, 0.42); A(d, 'eagle', 1.6, -2.4, 170, { seed: 2 }, 0.95); d.sheet(-3, -0.1, 3, -1.0, 0.04, 0x7d98a2).rocks(4, 0.25); } },
  { title: 'Whooping Crane', sub: 'Aransas, Texas', biome: 'swamp', seed: 122, text: 'North America\'s tallest bird, brought back from just fifteen survivors in 1941.', scene: (d) => { A(d, 'heron', -0.9, -1.7, 10, { seed: 1 }, 1.2); A(d, 'heron', 1.1, -2.2, 170, { seed: 2 }, 1.15); d.sheet(-3, -0.1, 3, -1.2, 0.04, 0x7f9a96).grass(50, { h: 0.6, color: 0x9a9a52 }); } },
  { title: 'California Condor', sub: 'Sespe Wilderness, California', biome: 'canyon', seed: 123, text: 'With a wingspan of nine and a half feet, the largest flying bird of North America.', scene: (d) => { d.mound(0, -2.4, 2.4, 0.9, 1.0, 0xb08a60); A(d, 'vulture', -0.8, -1.9, 10, { seed: 3 }, 1.25, 0.6); A(d, 'vulture', 1.2, -2.2, 170, { seed: 4 }, 1.2, 0.5); d.rocks(4, 0.3, 0xb08a60); } },
  { title: 'Great Blue Heron', sub: 'Everglades, Florida', biome: 'swamp', seed: 124, text: 'Herons, egrets and spoonbills in a cypress swamp.', scene: (d) => { A(d, 'heron', -1.4, -1.6, 10, { seed: 3 }); A(d, 'heron', 0.5, -2.4, 170, { seed: 4 }, 0.9); A(d, 'flamingo', 2.0, -1.8, 190, { seed: 1 }, 0.8); d.sheet(-3, -0.1, 3, -3, 0.04, 0x55664a).tree('broadleaf', -2.7, -3.1, 3, 0x4a6a40); } },
  { title: 'Wild Turkey', sub: 'West Virginia', biome: 'autumn', seed: 125, text: 'A gobbler displays to hens in oak woods.', scene: (d) => { flock(d, 'turkey', 4, 0.8, 2, 2.0); d.tree('broadleaf', 2.6, -3.1, 3, 0xc8642a).grass(30, { color: 0xa87a3a }); } },
  { title: 'Canada Goose', sub: 'Lake Bowdoin, Montana', biome: 'prairie', seed: 126, text: 'Geese and ducks on a prairie marsh at nesting time.', scene: (d) => { flock(d, 'goose', 4, 0.7, 3); flock(d, 'duck', 3, 0.42, 5, 1.6); d.sheet(-3, -0.1, 3, -1.0, 0.04, 0x7f9a96).grass(50, { h: 0.5 }); } },
  { title: 'Atlantic Puffin and Seabirds', sub: 'Bonaventure Island, Quebec', biome: 'coast', seed: 127, text: 'A crowded seabird cliff in the Gulf of St. Lawrence.', scene: (d) => { d.mound(0, -2.6, 3, 1.0, 1.0, 0x6a6660); flock(d, 'puffin', 5, 0.3, 4); flock(d, 'gull', 4, 0.42, 6); } },
  { title: 'Peregrine Falcon', sub: 'Hudson River Palisades, New Jersey', biome: 'broadleaf', seed: 128, text: 'Falcons at their eyrie on the cliffs across the river from Manhattan.', scene: (d) => { d.mound(-0.5, -2.2, 2.4, 1.1, 1.0, 0x5a5650); A(d, 'eagle', -0.6, -1.9, 10, { seed: 5 }, 0.5, 0.7); A(d, 'eagle', 1.0, -2.2, 170, { seed: 6 }, 0.45, 0.6); } },
];
export function nabirds(ctx) {
  const { room, lights } = ctx;
  const y = room.y, { z0, z1 } = room;
  dioramaRun(ctx, { side: 'w', a: z0 + 2, b: z1 - 2, depth: 3.6, y, h: room.h, items: lay(NAB.slice(0, 4), z0 + 2, z1 - 2, { w: 4.8, h: 2.8 }) });
  dioramaRun(ctx, { side: 'e', a: z0 + 2, b: z1 - 2, depth: 3.6, y, h: room.h, items: lay(NAB.slice(4), z0 + 2, z1 - 2, { w: 4.8, h: 2.8 }) });
  for (const zz of [z0 + 9, (z0 + z1) / 2, z1 - 9]) { lights.anchor(0, y + 4.6, zz, { color: 0xffd9a0, intensity: 22, dist: 20 }); bench(ctx, 0, y, zz, 90, 2.4); }
  ctx.sign('SANFORD HALL OF NORTH AMERICAN BIRDS', 0, y + 4.9, z0 + 0.02, 180, 0.26, { color: '#c9a25e' });
}

const BOW = [
  { id: 'kingpenguins', star: true, title: 'King Penguins', sub: 'South Georgia Island', biome: 'arctic', seed: 131, text: 'A rookery on a sub-Antarctic beach, with elephant seals hauled out among the birds.', scene: (d) => { for (let i = 0; i < 7; i++) A(d, 'penguin', -2.3 + i * 0.75, -1.2 - (i % 3) * 0.7, i % 2 ? 160 : 20, { seed: i }, 0.95 + (i % 3) * 0.05); A(d, 'elephantseal', 0.6, -3.0, 170, { seed: 1 }, 0.5); } },
  { title: 'East African Plains', sub: 'Kenya', biome: 'savanna', seed: 132, text: 'Ostrich, secretary bird, vultures and bustards share the grassland with the great herds.', scene: (d) => { A(d, 'ostrich', -1.2, -1.8, 10, { seed: 1 }); A(d, 'ostrich', 1.2, -2.5, 170, { seed: 2 }, 0.92); A(d, 'vulture', 2.3, -1.4, 200, { seed: 5 }); d.tree('acacia', -2.6, -3.1, 2.8).grass(60); } },
  { title: 'High Andes', sub: 'Lake Junín, Peru', biome: 'alpine', seed: 133, text: 'Flamingos and Andean geese on a salt lake 13,000 feet above the sea.', scene: (d) => { d.sheet(-3, -0.1, 3, -2.4, 0.04, 0x8aa6b0); for (let i = 0; i < 5; i++) A(d, 'flamingo', -2 + i * 1.0, -1.2 - (i % 2) * 0.9, i % 2 ? 165 : 15, { seed: i }); } },
  { title: 'New Guinea Forest', sub: 'Birds-of-paradise', biome: 'jungle', seed: 134, text: 'Male birds-of-paradise display plumes that astonished the first Europeans to see them.', scene: (d) => { d.log(0, -1.8, 3, 0.1, 5); flock(d, 'bop', 4, 0.36, 2, 1.6); flock(d, 'parrot', 3, 0.3, 7, 2.0); d.tree('broadleaf', 2.6, -3.0, 3, 0x24521e).tree('palm', -2.6, -3.0, 2.8); } },
  { title: 'Amazon Rain Forest', sub: 'Brazil', biome: 'jungle', seed: 135, text: 'Toucans, macaws and hummingbirds in the canopy of the largest forest on Earth.', scene: (d) => { flock(d, 'toucan', 3, 0.42, 3, 1.8); flock(d, 'parrot', 4, 0.5, 9, 2.2); d.tree('broadleaf', -2.6, -3.0, 3, 0x24521e).tree('palm', 2.6, -3.0, 3); } },
  { title: 'Japanese Crane', sub: 'Hokkaido, Japan', biome: 'arctic', seed: 136, text: 'Red-crowned cranes dance on a snowy marsh — in Japan a symbol of long life.', scene: (d) => { d.sheet(-3, -0.1, 3, -3.4, 0.04, 0xe8eef4); flock(d, 'crane', 3, 0.9, 1, 1.8); } },
  { title: 'Gobi Desert', sub: 'Mongolia', biome: 'desert', seed: 137, text: 'Sandgrouse, bustards and a saker falcon in the cold desert of Central Asia.', scene: (d) => { flock(d, 'hawk', 2, 0.5, 2, 1.5); flock(d, 'pigeon', 4, 0.3, 4); d.rocks(4, 0.2, 0xb08a60); } },
  { title: 'Australian Barrier Reef', sub: 'Queensland', biome: 'coast', seed: 138, text: 'Terns, noddies and boobies crowd a coral cay.', scene: (d) => { flock(d, 'gull', 6, 0.36, 5); d.mound(0, -2.8, 3, 0.3, 1, 0xe8d8b0); } },
  { title: 'Pampas', sub: 'Argentina', biome: 'prairie', seed: 139, text: 'The rhea, South America\'s ostrich, with ovenbirds and tinamous.', scene: (d) => { A(d, 'ostrich', 0, -1.9, 12, { seed: 4 }, 0.7); flock(d, 'robin', 4, 0.26, 2); d.grass(70, { h: 0.5, color: 0xa89648 }); } },
];
export function birdsworld(ctx) {
  const { room, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  dioramaRun(ctx, { side: 's', a: x0 + 1, b: x1 - 1, depth: 3.6, y, h: room.h, items: lay(BOW.slice(0, 5), x0 + 1, x1 - 1, { w: 5.0, h: 2.8 }) });
  dioramaRun(ctx, { side: 'n', a: x0 + 1, b: -5.5, depth: 3.6, y, h: room.h, items: lay(BOW.slice(5, 7), x0 + 1, -5.5, { w: 4.6, h: 2.8 }) });
  dioramaRun(ctx, { side: 'n', a: 5.5, b: x1 - 1, depth: 3.6, y, h: room.h, items: lay(BOW.slice(7), 5.5, x1 - 1, { w: 4.6, h: 2.8 }) });
  lights.anchor(-9, y + 4.6, (z0 + z1) / 2, { color: 0xffd9a0, intensity: 22, dist: 20 });
  lights.anchor(9, y + 4.6, (z0 + z1) / 2, { color: 0xffd9a0, intensity: 22, dist: 20 });
  bench(ctx, -6, y, (z0 + z1) / 2, 0, 2.4); bench(ctx, 6, y, (z0 + z1) / 2, 0, 2.4);
  ctx.view('main', 0, y, z0 + 2.2, 180, 0);
}

// ---------------------------------------------------------------------------
// Hall of North American Forests + Warburg Hall of New York State Environment (floor 1)
// ---------------------------------------------------------------------------
export function forests(ctx) {
  const { room, geo, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  const items = [
    { title: 'Olympic Rain Forest', sub: 'Washington', biome: 'conifer', seed: 141, text: 'Sitka spruce and western hemlock draped in moss, in the wettest place in the lower 48 states.', scene: (d) => { d.tree('conifer', -1.6, -2.4, 3.6).tree('conifer', 1.4, -3.0, 3.4).tree('conifer', 2.6, -1.8, 3).log(0, -1.4, 2.6, 0.22).grass(60, { h: 0.4, color: 0x3f7a34 }); A(d, 'elk', 0.2, -2.2, 12, { seed: 9 }, 0.8); } },
    { title: 'Giant Cactus Forest', sub: 'Sonoran Desert, Arizona', biome: 'desert', seed: 142, text: 'Saguaros, some two centuries old, store tons of water against the dry season.', scene: (d) => { for (const [u, z, h] of [[-1.8, -2.2, 2.8], [0.6, -2.9, 3.2], [2.2, -1.8, 2.2]]) { d.add('dio', new THREE.CylinderGeometry(0.16, 0.18, h, 10).translate(u, h / 2, z), 0x4a7a44); d.add('dio', tube([[u, h * 0.5, z], [u + 0.45, h * 0.55, z], [u + 0.5, h * 0.85, z]], 0.1, { radial: 7, sub: 3 }), 0x4a7a44); } d.bush(-0.6, -1.4, 0.5, 0x8a8a52).rocks(4, 0.2, 0xb08a60); } },
    { title: 'Mixed Deciduous Forest', sub: 'Great Smoky Mountains', biome: 'autumn', seed: 143, text: 'More kinds of trees grow in the southern Appalachians than in all of northern Europe.', scene: (d) => { d.tree('broadleaf', -2, -2.6, 3.4, 0xc8642a).tree('broadleaf', 0.4, -3.0, 3.6, 0xd0aa40).tree('broadleaf', 2.3, -2.2, 3.2, 0xb8401e).grass(40, { color: 0xa87a3a }).log(0, -1.4, 2); A(d, 'deer', -0.4, -1.8, 12, { seed: 3 }, 0.9); } },
    { title: 'Northern Spruce-Fir Forest', sub: 'Lake Nipigon, Ontario', biome: 'conifer', seed: 144, text: 'The boreal forest that rings the top of the world.', scene: (d) => { for (let i = 0; i < 5; i++) d.tree('conifer', -2.4 + i * 1.2, -2 - (i % 2), 3 + (i % 3) * 0.3); A(d, 'moose', 0.2, -1.5, 10, { seed: 6 }, 0.7); } },
  ];
  dioramaRun(ctx, { side: 'e', a: z0 + 1, b: z1 - 1, depth: 4.0, y, h: room.h, items: lay(items, z0 + 1, z1 - 1, { w: 5.0, h: 3.2 }) });
  // cross-section of the giant sequoia
  const sx = (x0 + x1) / 2 - 2, R = 2.45;
  const disc = new THREE.CylinderGeometry(R, R, 0.45, 48);
  disc.rotateX(Math.PI / 2);
  geo.add('wood', disc, xform(sx, y + 0.5 + R, z1 - 0.25), 0x7a4a2a);
  geo.box('satin', sx - 1.6, y, z1 - 0.6, sx + 1.6, y + 0.55, z1, { color: 0x1e1c19 });
  ctx.phys.box(sx - R, z1 - 0.7, sx + R, z1, y, y + 6);
  picture(ctx, { x: sx, y: y + 0.5 + R, z: z1 - 0.49, face: 0, w: R * 1.96, h: R * 1.96, px: 1024 }, (g, w, h) => {
    g.fillStyle = '#3a2416'; g.fillRect(0, 0, w, h);
    for (let r = w / 2; r > 2; r -= 2.2 + Math.sin(r * 0.3) * 1.2) { g.strokeStyle = `rgba(${150 + Math.sin(r * 0.21) * 40},${90 + Math.sin(r * 0.17) * 25},${50},1)`; g.lineWidth = 2.4; g.beginPath(); g.ellipse(w / 2, h / 2, r, r * (0.985 + Math.sin(r * 0.05) * 0.012), 0, 0, 6.3); g.stroke(); }
    g.strokeStyle = 'rgba(30,16,8,0.8)'; g.lineWidth = 3;
    for (let k = 0; k < 9; k++) { const a = k * 0.7 + 0.3; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 30, h / 2 + Math.sin(a) * 30); g.lineTo(w / 2 + Math.cos(a) * w * 0.47, h / 2 + Math.sin(a) * w * 0.47); g.stroke(); }
    g.fillStyle = '#f3ead8'; g.font = '600 20px Georgia, serif';
    [['550', 0.02], ['1066', 0.17], ['1492', 0.3], ['1776', 0.4], ['1891', 0.47]].forEach(([t, f]) => { g.fillRect(w / 2 + w * f - 2, h / 2 - 2, 4, 4); g.fillText(t, w / 2 + w * f - 16, h / 2 - 8); });
  });
  ctx.placard({ id: 'sequoia', star: true, title: 'Giant Sequoia', sub: 'The "Mark Twain Tree" · King\'s River, California · felled 1891',
    text: 'A slice sixteen feet across from a tree that was 1,342 years old when it was cut down — a seedling in the year 550. The markers on its rings count off the centuries it lived through.',
    x: sx + 3.2, y, z: z1 - 1.6, face: 0, target: [sx, y + 3, z1 - 0.4], view: { x: sx, y, z: z1 - 7.5, yaw: 180, pitch: 8 } });
  lights.anchor(sx, y + 4.4, z1 - 4, { color: 0xffe0b0, intensity: 30, dist: 14 });
  // forest floor, enlarged 24 times
  island(ctx, x0 + 2, z0 + 3, x0 + 8, z0 + 9, y, 0.5, 0x2a241c);
  geo.add('flat', ellipsoid([0, 0, 0], [2.6, 0.5, 2.6], { seg: 16, rings: 6 }), xform(x0 + 5, y + 0.5, z0 + 6), 0x5a4630);
  geo.add('gloss', tube([[-1.6, 0.6, -0.6], [-0.6, 0.85, 0.2], [0.5, 0.8, -0.2], [1.5, 0.6, 0.6]], 0.2, { radial: 9, sub: 4, color: (u) => (Math.floor(u * 22) % 2 ? [0.25, 0.1, 0.05] : [0.12, 0.05, 0.03]) }), xform(x0 + 5, y + 0.4, z0 + 6));
  for (let i = 0; i < 6; i++) geo.add('flat', ellipsoid([Math.cos(i * 1.1) * 1.8, 0.7, Math.sin(i * 1.1) * 1.8], [0.5, 0.03, 0.3], { seg: 6, rings: 3, rot: [0.3, i, 0.2] }), xform(x0 + 5, y + 0.4, z0 + 6), [0xa8632a, 0xc8842a, 0x8a4a1e][i % 3]);
  ctx.placard({ title: 'Life of the Forest Floor', sub: 'Model, enlarged 24 times', text: 'A cross-section of soil and leaf litter magnified until a millipede is the size of a python: most of a forest\'s animals live here, unseen.', x: x0 + 8.8, y, z: z0 + 6, face: 90, target: [x0 + 5, y + 1, z0 + 6] });
  lights.anchor(x0 + 6, y + 4.2, z0 + 6, { color: 0xffe0b0, intensity: 22, dist: 12 });
  ctx.sign('HALL OF NORTH AMERICAN FORESTS', x0 + 0.02, y + 4.8, z0 + 9, 90, 0.26, { color: '#c9a25e' });
}

export function warburg(ctx) {
  const { room, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  const items = [
    { title: 'An October Afternoon near Stissing Mountain', sub: 'Pine Plains, Dutchess County, New York', biome: 'autumn', seed: 151, star: true, id: 'stissing', text: 'The whole hall explains this one view: farms, woods and a lake beneath Stissing Mountain, ninety miles north of the museum.', scene: (d) => { d.tree('broadleaf', -2.2, -2.8, 3, 0xc8642a).tree('broadleaf', 2.4, -3.0, 3.2, 0xd0aa40).grass(60, { color: 0xa8873a }); A(d, 'deer', 0.2, -1.8, 12, { seed: 11 }, 0.9); } },
    { title: 'Life in the Soil', sub: 'Cross-section through a woodland floor', biome: 'broadleaf', seed: 152, text: 'Earthworms, moles, roots and fungi turn dead leaves back into soil.', scene: (d) => { d.mound(0, -1.8, 3, 0.7, 1, 0x4a3626); d.log(0.4, -1.4, 2); d.grass(40, { color: 0x4f7a34 }); } },
    { title: 'Spring in an Apple Orchard', sub: 'Dutchess County', biome: 'broadleaf', seed: 153, text: 'Blossom, bees and the cycle of a farm year.', scene: (d) => { d.tree('broadleaf', -1.6, -2.4, 2.6, 0xe8c8d0).tree('broadleaf', 1.6, -2.8, 2.8, 0xf0d8dc).grass(70, { color: 0x5c9a3a }); } },
    { title: 'From Field to Lake', sub: 'A relief of the Pine Plains landscape', biome: 'prairie', seed: 154, text: 'How glaciers shaped the valley, and how its rock decides what grows where.', scene: (d) => { d.sheet(-1, -1.2, 2, -2.6, 0.06, 0x6a8a9a); d.grass(60, { color: 0x7a9a3a }); flock(d, 'duck', 3, 0.4, 2, 1.2); } },
    { title: 'Winter Woods', sub: 'Dutchess County', biome: 'arctic', seed: 155, text: 'Tracks in the snow tell the night\'s stories.', scene: (d) => { d.sheet(-3, -0.1, 3, -3.4, 0.04, 0xe8eef4); d.tree('dead', -1.8, -2.4, 3).tree('dead', 1.6, -2.8, 3.2).tree('conifer', 2.6, -2.0, 2.4); A(d, 'jackal', 0, -1.6, 12, { seed: 8 }, 0.95); } },
  ];
  dioramaRun(ctx, { side: 's', a: x0 + 2, b: x1 - 2, depth: 3.4, y, h: room.h, wallCol: 0x7a6248, items: lay(items, x0 + 2, x1 - 2, { w: 5.2, h: 2.6 }) });
  for (let i = 0; i < 4; i++) {
    const x = 30 + i * 11;
    picture(ctx, { x, y: y + 2.5, z: z0, face: 180, w: 5, h: 2.6 }, landscape(i + 3, [['#7fa6d0', '#e8d8b8', '#7a8a4a', '#4a5a2a'], ['#c9d6e2', '#f0e8dc', '#b8c0c8', '#8a949c'], ['#8ab0d8', '#e8e0c0', '#c8a23a', '#8a5a2a'], ['#6a9ac8', '#dce8d0', '#5c9a3a', '#2f6a26']][i]));
    lights.anchor(x, y + 4.4, z0 + 5, { color: 0xffe2b8, intensity: 20, dist: 16 });
  }
  ['Winter', 'Spring', 'Summer', 'Autumn'].reverse().forEach((s, i) => ctx.sign(s.toUpperCase(), 30 + i * 11, y + 4.2, z0 + 0.02, 180, 0.22, { color: '#6a5238' }));
  bench(ctx, 36, y, (z0 + z1) / 2 - 1, 0, 2.4); bench(ctx, 58, y, (z0 + z1) / 2 - 1, 0, 2.4);
  ctx.sign('WARBURG HALL OF NEW YORK STATE ENVIRONMENT', (x0 + x1) / 2, y + 4.8, z0 + 0.02, 180, 0.26, { color: '#6a5238' });
}
