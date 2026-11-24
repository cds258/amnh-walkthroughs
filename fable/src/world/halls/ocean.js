// Milstein Hall of Ocean Life (floor 1). Visitors enter on the mezzanine (floor-1 level) and
// descend to the main floor beneath the 94-foot blue whale.
import * as THREE from 'three';
import { xform } from '../../engine/builder.js';
import { tex } from '../../engine/textures.js';
import { dioramaRun } from '../dioramas.js';
import { model } from '../../models/index.js';
import { railing, blob, bench } from '../furniture.js';

const S = (name, opts) => model('sealife', name, opts || {});
const An = (name, opts) => model('animals', name, opts || {});

const UW = { lightCol: 0x9fd0ff, frameCol: 0x2c4a66 };

// ---- lower level: the classic dioramas ------------------------------------
const LOW_N = [
  { title: 'Sperm Whale and Giant Squid', sub: 'The deep North Atlantic', biome: 'deepsea', seed: 1, star: true, id: 'spermwhale', rise: 0, bumps: 0, ...UW, lightInt: 5,
    text: 'A battle no one has ever witnessed: a sperm whale seizes a giant squid in total darkness a kilometre down. The diorama is kept almost black — look for the squid\'s arms across the whale\'s jaw.',
    scene: (d) => { d.swim(S('spermwhale'), -2.6, -1.0, -2.3, 205, 0.42, 8); d.swim(S('giantsquid', { seed: 2 }), 1.3, 0.9, -1.5, 195, 0.62, -10); } },
  { title: 'Walrus', sub: 'Bering Strait, Alaska', biome: 'arctic', seed: 2,
    text: 'Pacific walruses hauled out on the ice. Their tusks — long upper canines — are used to haul out, to keep breathing holes open and to settle arguments.',
    scene: (d) => { d.put(An('walrus', { seed: 1 }), -1.3, -1.5, 15); d.put(An('walrus', { seed: 2 }), 1.0, -2.0, 170, 0.9); d.put(An('walrus', { seed: 3 }), 2.3, -1.2, 200, 0.75); d.mound(-2.4, -2.5, 1.6, 0.5, 1.0, 0xe8f0f6).mound(2.2, -2.7, 1.4, 0.4, 0.9, 0xdce8f0); } },
  { title: 'Polar Bear', sub: 'Arctic pack ice', biome: 'arctic', seed: 3,
    text: 'A polar bear stands over a ringed seal\'s breathing hole. The bears are marine mammals in all but name, living almost entirely on sea ice.',
    scene: (d) => { d.put(An('polarbear', { seed: 1 }), -0.6, -1.6, 12); d.put(An('polarbear', { seed: 2 }), 1.8, -2.4, 175, 0.6); d.sheet(0.6, -0.4, 2.2, -1.2, 0.04, 0x3c6a8a); d.mound(-2.5, -2.6, 1.4, 0.6, 1.0, 0xe8f0f6); } },
  { title: 'Northern Sea Lion', sub: 'Pribilof Islands, Alaska', biome: 'coast', seed: 4,
    text: 'A Steller sea lion bull roars over his harem on a rocky rookery in the Bering Sea.',
    scene: (d) => { d.rock(-1.4, -2.0, 1.1, 0x5a5650, 0.6).rock(1.4, -2.5, 1.3, 0x5a5650, 0.6); d.put(An('sealion', { seed: 1 }), -1.2, -1.6, 15, 1, 0.45); d.put(An('sealion', { seed: 2 }), 0.9, -1.3, 170, 0.75); d.put(An('sealion', { seed: 3 }), 2.2, -2.2, 200, 0.7, 0.5); } },
  { title: 'Northern Elephant Seal', sub: 'Guadalupe Island, Mexico', biome: 'coast', seed: 5,
    text: 'Hunted almost to extinction for their oil, elephant seals survived on one Mexican island. Bulls can weigh more than two tons.',
    scene: (d) => { d.put(An('elephantseal', { seed: 1 }), -1.0, -1.6, 10); d.put(An('elephantseal', { seed: 2 }), 1.5, -2.2, 170, 0.7); d.rocks(4, 0.3, 0x6a6258); } },
  { title: 'Sea Otter and Kelp Forest', sub: 'Monterey Bay, California', biome: 'underwater', seed: 6, ...UW,
    text: 'Giant kelp grows as much as two feet a day. By eating sea urchins, otters keep the kelp forest — and everything living in it — from being grazed away.',
    scene: (d) => { d.kelp(-2.2, -2.2, 3.0, 4).kelp(-0.4, -2.8, 3.2, 4).kelp(1.6, -2.4, 3.0, 4).kelp(2.6, -1.4, 2.6, 3); d.swim(S('school', { n: 18, hue: 2, spread: 1.6 }), 0.4, 1.0, -1.6, 10); d.swim(S('reeffish', { hue: 3, L: 0.5 }), -1.4, 0.6, -1.0, 190); d.rocks(4, 0.35, 0x4a5a58); } },
  { title: 'Dolphin and Tuna', sub: 'Open Pacific', biome: 'underwater', seed: 7, star: true, id: 'dolphins', ...UW,
    text: 'Spinner dolphins and yellowfin tuna hunt together beneath the surface. Fishing fleets once used that partnership to find tuna, at great cost to the dolphins.',
    scene: (d) => { d.swim(S('dolphin'), -1.4, 1.9, -1.6, 12, 0.85, 14); d.swim(S('dolphin'), 0.6, 1.3, -2.3, 20, 0.8, 4); d.swim(S('dolphin'), 2.0, 2.2, -1.2, 195, 0.75, 10); d.swim(S('tuna'), -0.6, 0.5, -1.2, 8, 0.7); d.swim(S('tuna'), 1.6, 0.7, -2.0, 15, 0.65); d.swim(S('school', { n: 20, hue: 3, spread: 1.6 }), -2.0, 0.4, -2.4, 10); } },
];
const LOW_S = [
  { title: 'West Indian Manatee', sub: 'Crystal River, Florida', biome: 'underwater', seed: 11, ...UW,
    text: 'Slow, gentle grazers of warm rivers and coasts. Florida\'s manatees crowd into spring-fed rivers when the sea turns cold.',
    scene: (d) => { d.swim(S('manatee'), -1.0, 0.9, -1.6, 12, 0.9, 6); d.swim(S('manatee'), 1.4, 0.4, -2.2, 170, 0.75); d.kelp(-2.5, -2.4, 1.4, 3).kelp(2.5, -1.2, 1.2, 3); d.grass(40, { color: 0x4a7a44, h: 0.5 }); } },
  { title: 'Sargasso Sea', sub: 'North Atlantic gyre', biome: 'underwater', seed: 12, ...UW,
    text: 'A sea without shores: rafts of floating sargassum weed shelter hatchling sea turtles and fishes found nowhere else.',
    scene: (d) => { d.swim(S('seaturtle'), -0.8, 1.9, -1.4, 20, 1); d.swim(S('seaturtle'), 1.6, 1.2, -2.2, 190, 0.6); d.swim(S('school', { n: 22, hue: 0, spread: 1.8 }), 0.6, 1.2, -1.8, 5); d.swim(S('jelly', { seed: 2 }), -2.2, 1.0, -2.2, 0, 1.4); d.swim(S('jelly', { seed: 3 }), 2.4, 1.6, -1.0, 0, 1.0); } },
  { title: 'Sharks of the Open Sea', sub: 'Gulf Stream', biome: 'underwater', seed: 13, star: true, id: 'sharks', ...UW,
    text: 'Blue and mako sharks cruise the open ocean. Sharks have patrolled the seas for more than 400 million years.',
    scene: (d) => { d.swim(S('shark'), -1.0, 1.4, -1.8, 10, 0.75, 4); d.swim(S('shark', { L: 3 }), 1.6, 0.6, -2.4, 185, 0.8); d.swim(S('ray'), 0.8, 2.3, -1.2, 30, 0.6, 6); d.swim(S('school', { n: 16, hue: 3, spread: 1.4 }), -2.2, 0.5, -1.2, 190); } },
  { title: 'Pearl Divers', sub: 'Tongareva, South Pacific', biome: 'reef', seed: 14, ...UW,
    text: 'A coral lagoon in the Cook Islands where islanders dived for black-lipped pearl oysters.',
    scene: (d) => { d.coral(-2.0, -2.2, 0.9, 'branch', 0xd98a6a).coral(-0.6, -2.8, 0.8, 'brain', 0xb8a45a).coral(1.2, -2.2, 1.0, 'fan', 0xa84a8a).coral(2.4, -1.4, 0.7, 'tube', 0xe0b84a).coral(0.4, -1.2, 0.6, 'branch', 0xe07a5a); d.swim(S('school', { n: 20, hue: 1, spread: 1.6 }), 0.2, 1.2, -1.6, 10); d.swim(S('reeffish', { hue: 2, L: 0.45 }), -1.6, 0.8, -1.0, 190); } },
  { title: 'Killer Whale', sub: 'Puget Sound', biome: 'underwater', seed: 15, ...UW,
    text: 'Orcas are the largest of the dolphins and hunt in family groups led by the oldest female.',
    scene: (d) => { d.swim(S('orca'), -0.4, 0.8, -1.9, 12, 0.5, 6); d.swim(S('orca'), 1.8, 1.7, -2.4, 15, 0.36, 2); d.swim(S('school', { n: 14, hue: 3, spread: 1.2 }), -2.2, 0.6, -1.0, 190); } },
  { title: 'Harbor Seal', sub: 'Coast of Maine', biome: 'coast', seed: 16,
    text: 'Harbor seals bask on a weed-covered ledge at low tide.',
    scene: (d) => { d.rock(-1.2, -1.9, 1.2, 0x5c5a50, 0.5).rock(1.6, -2.4, 1.1, 0x5c5a50, 0.5); d.put(An('sealion', { seed: 4 }), -1.1, -1.7, 20, 0.55, 0.42); d.put(An('sealion', { seed: 5 }), 1.5, -2.1, 175, 0.5, 0.4); d.grass(20, { color: 0x5a6a3a, h: 0.2 }); } },
  { title: 'Coral Reef Fishes', sub: 'Great Barrier Reef, Australia', biome: 'reef', seed: 17, ...UW,
    text: 'A quarter of all marine fish species live on coral reefs, which cover less than one percent of the sea floor.',
    scene: (d) => { d.coral(-2.2, -1.6, 0.9, 'brain', 0xc8a85a).coral(-0.8, -2.6, 1.0, 'branch', 0xe08a7a).coral(1.0, -2.0, 1.1, 'fan', 0xd0507a).coral(2.4, -2.6, 0.9, 'branch', 0xe0b060); d.swim(S('school', { n: 20, hue: 0, spread: 1.6 }), -1.0, 1.3, -1.6, 10); d.swim(S('school', { n: 16, hue: 2, spread: 1.4 }), 1.6, 0.8, -1.2, 190); d.swim(S('shark', { L: 1.6 }), 0.4, 2.2, -2.4, 15, 1); } },
];
// ---- mezzanine: ecosystem displays ------------------------------------------
const MEZ_N = [
  { title: 'Kelp Forests', biome: 'underwater', seed: 21, ...UW, text: 'Towering algae create a three-dimensional forest on cold, rocky coasts.', scene: (d) => { d.kelp(-1.6, -1.2, 2.4, 3).kelp(0.2, -1.5, 2.6, 3).kelp(1.8, -1.2, 2.4, 3); d.swim(S('school', { n: 12, hue: 2, spread: 1.2 }), 0, 0.9, -0.8, 10); } },
  { title: 'Coral Reefs', biome: 'reef', seed: 22, ...UW, text: 'Reefs are built by colonies of tiny animals living in partnership with algae.', scene: (d) => { d.coral(-1.6, -1.2, 0.8, 'branch', 0xe08a6a).coral(0.0, -1.5, 0.8, 'brain', 0xb8a45a).coral(1.6, -1.2, 0.9, 'fan', 0xa84a8a); d.swim(S('school', { n: 14, hue: 1, spread: 1.2 }), 0.2, 1.0, -0.8, 10); } },
  { title: 'Deep Sea', biome: 'deepsea', seed: 23, ...UW, lightInt: 5, text: 'Below 200 metres sunlight fades; most animals here make their own light.', scene: (d) => { d.swim(S('jelly', { seed: 4, color: 0x9fd0ff }), -1.2, 0.8, -1.0, 0, 1.5); d.swim(S('jelly', { seed: 5, color: 0xffa0c0 }), 0.9, 1.4, -1.2, 0, 1.1); d.swim(S('giantsquid', { seed: 5 }), 0.2, 0.5, -1.4, 190, 0.2); } },
  { title: 'Polar Seas', biome: 'arctic', seed: 24, text: 'Under the ice, blooms of algae feed krill, and krill feed almost everything else.', scene: (d) => { d.put(An('penguin', { seed: 1 }), -1.4, -1.0, 20); d.put(An('penguin', { seed: 2 }), -0.6, -1.4, 160); d.put(An('penguin', { seed: 3 }), 1.2, -1.1, 200); d.mound(1.9, -1.5, 1.0, 0.4, 0.7, 0xe8f0f6); } },
  { title: 'Estuaries', biome: 'swamp', seed: 25, text: 'Where rivers meet the sea, salt marshes are nurseries for fish and feeding grounds for birds.', scene: (d) => { d.put(An('heron', { seed: 1 }), -1.0, -1.1, 15); d.put(An('heron', { seed: 2 }), 1.4, -1.4, 170, 0.9); d.grass(50, { color: 0x6a8a3a, h: 0.6 }); } },
  { title: 'Mangroves', biome: 'island', seed: 26, text: 'Salt-tolerant trees whose stilt roots shelter young reef fishes and hold the shoreline together.', scene: (d) => { d.tree('broadleaf', -1.4, -1.3, 2.0, 0x3f6e2c).tree('broadleaf', 1.2, -1.5, 2.2, 0x356a2a); d.put(An('flamingo', { seed: 1 }), 0.1, -1.0, 10); d.grass(20, { color: 0x5a8a3a }); } },
];
const MEZ_S = [
  { title: 'Continental Shelf', biome: 'underwater', seed: 31, ...UW, text: 'The shallow, sunlit margins of the continents produce most of the world\'s seafood.', scene: (d) => { d.swim(S('tuna'), -0.8, 0.9, -1.0, 10, 0.5); d.swim(S('school', { n: 16, hue: 3, spread: 1.4 }), 0.8, 0.8, -1.0, 10); d.rocks(4, 0.2, 0x5a6a68); } },
  { title: 'Sea Floor', biome: 'deepsea', seed: 32, ...UW, lightInt: 5, text: 'At hydrothermal vents, whole communities live on chemical energy instead of sunlight.', scene: (d) => { d.coral(-1.0, -1.2, 0.9, 'tube', 0xd8d2c0).coral(0.9, -1.4, 1.0, 'tube', 0xc0392b).rocks(5, 0.3, 0x2a2a2e); } },
  { title: 'Open Ocean', biome: 'underwater', seed: 33, ...UW, text: 'The largest habitat on Earth, home to the fastest swimmers and the longest migrations.', scene: (d) => { d.swim(S('shark', { L: 2 }), -0.6, 1.0, -1.0, 10, 0.8); d.swim(S('ray'), 1.2, 1.5, -1.2, 190, 0.4); d.swim(S('jelly', { seed: 6 }), 1.9, 0.6, -0.8, 0, 1); } },
  { title: 'Rocky Shores', biome: 'coast', seed: 34, text: 'Twice a day the tide uncovers bands of barnacles, mussels and seaweeds, each with its own zone.', scene: (d) => { d.rock(-1.0, -1.2, 0.8, 0x5c5a50, 0.6).rock(1.0, -1.4, 0.9, 0x55534a, 0.6).rocks(5, 0.2, 0x6a665c); d.put(An('eagle', { seed: 1 }), 1.0, -1.4, 190, 1, 0.5); } },
  { title: 'Sea Turtles', biome: 'reef', seed: 35, ...UW, text: 'Green turtles return across whole oceans to nest on the beach where they hatched.', scene: (d) => { d.swim(S('seaturtle'), -0.6, 1.1, -1.0, 15, 0.8, 8); d.coral(1.4, -1.3, 0.7, 'branch', 0xe08a6a).coral(-1.8, -1.4, 0.6, 'brain', 0xb8a45a); } },
  { title: 'Marine Mammals', biome: 'underwater', seed: 36, ...UW, text: 'Whales, seals, sea cows and otters each returned to the sea separately from ancestors on land.', scene: (d) => { d.swim(S('dolphin'), -0.8, 1.0, -1.0, 12, 0.6, 8); d.swim(S('orca'), 1.0, 0.5, -1.3, 190, 0.22); } },
];

function slots(a, b, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(a + (i + 0.5) * (b - a) / n);
  return out;
}

export function ocean(ctx) {
  const { room, geo, phys, lights, W } = ctx;
  const { x0, x1, z0, z1 } = room;
  const yL = room.y, yM = 0, yT = room.y + room.h; // lower floor, mezzanine, ceiling
  const MW = 7; // mezzanine width
  const vx0 = x0 + MW, vx1 = x1 - MW, vz0 = z0 + MW, vz1 = z1 - MW;
  const cz = (z0 + z1) / 2;
  const navy = 0x1c3f66;

  // ---- mezzanine ring ----
  const strips = [[x0, z0, x1, vz0], [x0, vz1, x1, z1], [x0, vz0, vx0, vz1], [vx1, vz0, x1, vz1]];
  for (const s of strips) {
    geo.box('terrazzo', s[0], yM - 0.5, s[1], s[2], yM, s[3], { color: 0x5a7896, bottom: 0x122c4a, side: navy });
    phys.floor(s[0], s[1], s[2], s[3], yM);
  }
  // stair opening in the east mezzanine edge: z 49.5..54.5
  const sz0 = cz - 2.6, sz1 = cz + 2.6;
  railing(ctx, [[vx1, sz0], [vx1, vz0], [vx0, vz0], [vx0, vz1], [vx1, vz1], [vx1, sz1]], yM, { glass: true, color: 0x9aa6b2, mat: 'metal', h: 1.1 });
  // grand stair: from the east mezzanine down to the main floor, descending west
  const sx0 = vx1 - 9.6, n = 30, run = 9.6 / n, rise = (yM - yL) / n;
  for (let i = 0; i < n; i++) {
    const xa = vx1 - (i + 1) * run, ty = yM - (i + 1) * rise;
    geo.box('terrazzo', xa, ty - 0.25, sz0, xa + run, ty + rise, sz1, { color: 0x6a86a2, top: 0x8aa4bc });
  }
  phys.ramp(sx0, sz0, vx1, sz1, yL, yM, 'x');
  for (const zz of [sz0, sz1]) {
    // sloping glass guards
    for (let i = 0; i < 6; i++) {
      const xa = sx0 + i * 1.6, xb = xa + 1.6, ya = yL + (xa - sx0) / 9.6 * 4.5, yb = yL + (xb - sx0) / 9.6 * 4.5;
      geo.quad('glass', [xa, ya, zz], [xb, yb, zz], [xb, yb + 1.1, zz], [xa, ya + 1.1, zz], { color: 0xcfe4f0 });
      geo.quad('metal', [xa, ya + 1.06, zz - 0.03], [xb, yb + 1.06, zz - 0.03], [xb, yb + 1.12, zz - 0.03], [xa, ya + 1.12, zz - 0.03], { color: 0x9aa6b2 });
      geo.quad('metal', [xb, yb + 1.06, zz + 0.03], [xa, ya + 1.06, zz + 0.03], [xa, ya + 1.12, zz + 0.03], [xb, yb + 1.12, zz + 0.03], { color: 0x9aa6b2 });
    }
    phys.box(sx0, zz - 0.08, vx1, zz + 0.08, yL, yM + 1.2);
  }
  // nobody walks under the low end of the stair
  phys.box(sx0 + 4.2, sz0, vx1, sz1, yL, yL + 1.9);
  geo.box('plaster', sx0 + 4.2, yL, sz0 + 0.05, vx1, yL + 2.0, sz1 - 0.05, { color: navy, skip: 'y+' });

  // ---- dioramas, lower level (under the mezzanine) ----
  const dl = 3.9;
  const lowX = slots(x0 + dl, x1, 7);
  const mkL = (list) => list.map((it, i) => ({ ...it, at: lowX[i], w: 5.3, h: 2.5, sill: 0.6 }));
  dioramaRun(ctx, { side: 'n', a: x0 + dl, b: x1, depth: dl, y: yL, h: 4, wallCol: 0x173a61, items: mkL(LOW_N) });
  dioramaRun(ctx, { side: 's', a: x0 + dl, b: x1, depth: dl, y: yL, h: 4, wallCol: 0x173a61, items: mkL(LOW_S) });
  // west wall: the two-level Andros Coral Reef between two smaller groups
  dioramaRun(ctx, { side: 'w', a: z0, b: z1, depth: dl, y: yL, h: 4, wallCol: 0x173a61, items: [
    { at: cz - 11.5, w: 5.6, h: 2.5, sill: 0.6, title: 'Tidal Flat', sub: 'Bahamas', biome: 'island', seed: 41, text: 'At low tide, wading birds work the exposed flats behind the reef.', scene: (d) => { d.put(An('flamingo', { seed: 1 }), -1.2, -1.6, 15); d.put(An('flamingo', { seed: 2 }), 0.3, -2.2, 170); d.put(An('heron', { seed: 3 }), 1.8, -1.4, 190); d.sheet(-2.6, -0.3, 2.6, -1.0, 0.04, 0x7fc0c8); } },
    { at: cz, w: 9.5, h: 2.7, sill: 0.5, title: 'Andros Coral Reef', sub: 'Bahamas — below the surface', biome: 'reef', seed: 42, star: true, id: 'androsreef', ...UW,
      text: 'The museum\'s only two-level diorama. Its forty tons of coral were collected in the Bahamas in 1923–24; this lower half shows the reef itself, the mezzanine above shows the island and sky. Roy Waldo Miner spent twelve years building it.',
      scene: (d) => { const k = ['branch', 'brain', 'fan', 'tube', 'branch', 'fan', 'branch', 'brain']; const cl = [0xe08a6a, 0xb8a45a, 0xa84a8a, 0xe0b84a, 0xd9705a, 0xc85a9a, 0xe6a070, 0x9a9a5a]; for (let i = 0; i < 14; i++) d.coral(-4.2 + i * 0.62 + (i % 2) * 0.2, -1.0 - (i * 37 % 20) / 10, 0.7 + (i % 3) * 0.25, k[i % 8], cl[i % 8]); d.swim(S('school', { n: 24, hue: 0, spread: 2 }), -2.0, 1.3, -1.6, 10); d.swim(S('school', { n: 20, hue: 1, spread: 1.8 }), 2.2, 0.9, -1.8, 190); d.swim(S('shark', { L: 2 }), 0.4, 2.0, -2.6, 15, 1); d.swim(S('seaturtle'), -3.2, 1.9, -2.2, 20, 0.8); d.swim(S('ray'), 3.0, 0.5, -1.2, 200, 0.4); } },
    { at: cz + 11.5, w: 5.6, h: 2.5, sill: 0.6, title: 'Mangrove Shore', sub: 'Andros Island', biome: 'island', seed: 43, text: 'Red mangroves fringe the sheltered side of the island.', scene: (d) => { d.tree('broadleaf', -1.6, -2.2, 2.2, 0x3f6e2c).tree('broadleaf', 1.4, -2.6, 2.4, 0x356a2a).tree('palm', 2.4, -1.4, 2.6); d.put(An('heron', { seed: 4 }), 0, -1.4, 20); } },
  ] });
  // ---- mezzanine displays ----
  const dm = 2.7;
  const mezX = slots(x0 + 4, x1 - 9, 6);
  const mkM = (list) => list.map((it, i) => ({ ...it, at: mezX[i], w: 4.6, h: 2.5, sill: 0.8, sub: it.sub || 'Ocean ecosystems' }));
  dioramaRun(ctx, { side: 'n', a: x0, b: x1, depth: dm, y: yM, h: yT - yM, wallCol: 0x1d4a7a, items: mkM(MEZ_N) });
  dioramaRun(ctx, { side: 's', a: x0, b: x1, depth: dm, y: yM, h: yT - yM, wallCol: 0x1d4a7a, items: mkM(MEZ_S) });
  dioramaRun(ctx, { side: 'w', a: z0 + dm, b: z1 - dm, depth: dm, y: yM, h: yT - yM, wallCol: 0x1d4a7a, items: [
    { at: cz, w: 9.5, h: 3.0, sill: 0.7, title: 'Andros Coral Reef', sub: 'Bahamas — above the surface', biome: 'island', seed: 44,
      text: 'The upper half of the two-level reef diorama: the calm lagoon, a cay crowned with coconut palms and a trade-wind sky.',
      scene: (d) => { d.sheet(-5.4, -0.1, 5.4, -1.4, 0.05, 0x58b8c8); d.tree('palm', -3.0, -1.8, 2.8).tree('palm', -1.6, -1.6, 2.4).tree('palm', 2.8, -1.8, 2.6); d.put(An('flamingo', { seed: 5 }), 0.6, -1.6, 15); d.put(An('flamingo', { seed: 6 }), 1.6, -1.7, 170); d.rocks(4, 0.3, 0xd8cfb0); } },
  ] });

  // ---- the luminous ceiling ----
  const bays = 6, rows = 4, bw = (x1 - x0) / bays, bd = (z1 - z0) / rows;
  geo.ceil('plaster', x0, z0, x1, z1, yT, { color: 0x0c2a4c });
  for (let i = 0; i < bays; i++) for (let j = 0; j < rows; j++) {
    const a = x0 + i * bw + 0.5, b = z0 + j * bd + 0.5;
    geo.ceil('caustics', a, b, a + bw - 1, b + bd - 1, yT - 0.25, { color: [1.5, 1.6, 1.7] });
  }
  for (let i = 0; i <= bays; i++) geo.box('plaster', x0 + i * bw - 0.5, yT - 1.0, z0, x0 + i * bw + 0.5, yT, z1, { color: 0x10325a });
  for (let j = 0; j <= rows; j++) geo.box('plaster', x0, yT - 0.8, z0 + j * bd - 0.5, x1, yT, z0 + j * bd + 0.5, { color: 0x10325a });
  const ct = tex('caustics', 14);
  W.animate = W.animate || [];
  W.animate.push((t) => { ct.offset.set(Math.sin(t * 0.05) * 0.15 + t * 0.006, t * 0.011); });
  // light: cool wash from above, dim under the balcony
  for (const xx of [38, 51, 64]) for (const zz of [45, 59]) lights.anchor(xx, yT - 3, zz, { color: 0x6fb8ff, intensity: 150, dist: 34 });
  for (const xx of [34, 51, 68]) for (const zz of [z0 + 5.4, z1 - 5.4]) lights.anchor(xx, yL + 2.8, zz, { color: 0x8fc4ff, intensity: 10, dist: 12 });

  // ---- the blue whale ----
  const wx = (vx0 + vx1) / 2 - 0.5, wy = yL + 4.6, wz = cz;
  geo.addGeo(model('sealife', 'bluewhale'), xform(wx, wy, wz, 0, 1));
  // the single mount: a faired strut from the roof truss into the whale's back
  geo.cyl('satin', wx - 1.2, wy + 4.3, wz + 0.2, 0.34, yT - (wy + 4.3), { color: 0x2c5f95, seg: 12, rTop: 0.5 });
  blob(geo, wx, yL, wz, 13.5, 3.2);
  ctx.placard({
    id: 'bluewhale', star: true, title: 'Blue Whale', sub: 'Balaenoptera musculus — 94 feet, 21,000 pounds',
    text: 'The largest animal that has ever lived, modelled in fibreglass on a female found in 1925 off South America. Installed in 1969 and reshaped in 2003 — flatter head, slimmer body, a navel and more than 600 gallons of fresh paint — it hangs from a single point in its back so that it seems to dive over your head.',
    x: wx + 9.5, y: yL, z: wz + 5.5, face: 135, size: 0.95,
    target: [wx + 6, wy + 2.4, wz],
    view: { x: vx1 - 12, y: yL, z: cz + 9, yaw: 285, pitch: 22 },
  });
  ctx.placard({
    title: 'Blue Whale', sub: 'Seen from the mezzanine',
    text: 'At eye level the whale\'s throat pleats are easy to see: they let the mouth balloon outward to engulf a volume of water larger than the whale itself.',
    x: vx1 - 3, y: yM, z: vz0 - 0.9, face: 0, list: false, target: [wx + 6, wy + 2.4, wz],
  });
  ctx.placard({
    title: 'Milstein Hall of Ocean Life', sub: 'Opened 1933 · restored 2003',
    text: 'Eight ocean ecosystems on the mezzanine and fourteen classic dioramas below surround the blue whale, beneath a ceiling that shimmers like sunlit water.',
    x: x1 - 3.6, y: yM, z: 44 + 5.6, face: 90, list: false,
  });
  // seating on the main floor
  for (const xx of [40, 51, 62]) { bench(ctx, xx, yL, cz - 9.5, 0, 2.6, 0x2c4a66); bench(ctx, xx, yL, cz + 9.5, 0, 2.6, 0x2c4a66); }
  ctx.sign('MILSTEIN HALL OF OCEAN LIFE', x1 - 0.03, yM + 6.2, cz, 270, 0.6, { color: '#bfe0ff', bright: true });

  ctx.view('main', x1 - 2.6, yM, 44, 262, 4);
  ctx.view('L1', x1 - 2.6, yM, 44, 262, 4);
  ctx.view('floor', vx1 - 12, yL, cz + 9, 285, 22);
  void THREE;
}
