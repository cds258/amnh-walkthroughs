// The museum plan, derived from AMNH's official floor maps.
//
// World axes: +x = EAST (Central Park West), -x = WEST (Columbus Ave),
//             -z = NORTH (West 81st St),      +z = SOUTH (West 77th St), y up. Units: metres.
// The east-west axis through the Theodore Roosevelt Memorial (79th St) is z = 0.
//
// Rooms are axis-aligned rectangles separated by 1 m of wall; `PORTALS` are the doorways
// through those walls. Multi-storey spaces (Rotunda, Akeley Hall, Ocean Life, Rose Center,
// Gilder atrium, stairwells) are single tall rooms.

export const FLOOR_Y = { LL: -6.5, 1: 0, 2: 6.5, 3: 13, 4: 19.5 };
export const FLOORS = ['LL', 1, 2, 3, 4];
export const FLOOR_NAMES = { LL: 'Lower Level', 1: 'Floor 1', 2: 'Floor 2', 3: 'Floor 3', 4: 'Floor 4' };
export const F2F = 6.5;

/** Floor key for a given feet height. */
export function floorOfY(y) {
  let best = 'LL';
  for (const f of FLOORS) if (y >= FLOOR_Y[f] - 1.2) best = f;
  return best;
}

const R = (id, name, floor, x0, z0, x1, z1, o = {}) => ({
  id, name, floor, x0, z0, x1, z1, y: FLOOR_Y[floor], h: 5.4, style: 'classic', ...o,
});

// Wing labels for the breadcrumb
const CPW = 'Central Park West', S77 = 'West 77th Street', CORE = 'Central Pavilion', COL = 'Columbus Avenue',
  ROSE = 'Rose Center for Earth and Space', GILDER = 'Gilder Center';

export const ROOMS = [
  // ============================== FLOOR 1 ==============================
  R('memorial', 'Theodore Roosevelt Memorial Hall', 1, 80, -18.5, 101, 18.5, { wing: CPW, style: 'stonehall', h: 5.6,
    blurb: 'The street-level hall beneath the Rotunda, honouring Theodore Roosevelt as naturalist and conservationist.' }),
  R('vest1', 'East Stair Hall', 1, 67, -6, 79, 6, { wing: CPW, style: 'stonehall', minor: true }),
  R('namammals', 'Bernard Family Hall of North American Mammals', 1, 22, -13, 66, 13, { wing: CORE, style: 'dioramahall', h: 5.6,
    blurb: 'Forty-three dioramas, completed in 1942 and restored in 2012, showing the continent\'s mammals in precisely recreated places and moments.' }),
  R('smallmammals', 'Hall of Small Mammals', 1, 14, -6, 21, 20, { wing: CORE, style: 'dioramahall', short: 'Small Mammals',
    blurb: 'A corridor of small dioramas off the Hall of North American Mammals.' }),
  R('crossing1', 'Theater Lobby', 1, -21, 21, 21, 29, { wing: CORE, style: 'stonehall', minor: true,
    blurb: 'The crossing at the centre of the museum, outside the LeFrak Giant-Screen Theater.' }),
  R('nwcoast', 'Northwest Coast Hall', 1, -11, 30, 11, 83, { wing: S77, style: 'woodhall', h: 5.8,
    blurb: 'The museum\'s oldest gallery (1899), reopened in 2022: more than 1,000 works from ten Pacific Northwest nations.' }),
  R('grand', 'Grand Gallery', 1, -18, 84, 18, 106, { wing: S77, style: 'stonehall', h: 5.8,
    blurb: 'The 77th Street entrance foyer.' }),
  R('warburg', 'Felix M. Warburg Hall of New York State Environment', 1, 19, 84, 75, 106, { wing: S77, style: 'woodhall', short: 'New York State Environment',
    blurb: 'A 1951 hall that explains a single landscape — Stissing Mountain and Pine Plains, New York — through the seasons.' }),
  R('forests', 'Hall of North American Forests', 1, 77, 77, 101, 106, { wing: S77, style: 'dioramahall',
    blurb: 'Forest dioramas from the boreal north to the southern swamps, opened in 1959.' }),
  R('biodiversity', 'Hall of Biodiversity', 1, 80, 20, 101, 76, { wing: CPW, style: 'darkhall', h: 5.6,
    blurb: 'Opened in 1998: the Spectrum of Life wall of 1,500 specimens and a walk-through Dzanga-Sangha rainforest.' }),
  R('ocean', 'Milstein Hall of Ocean Life', 1, 24, 32, 78, 72, { wing: CORE, style: 'ocean', y: -4.5, h: 18.5, tall: true, custom: true,
    blurb: 'A 29,000-square-foot hall beneath a glowing blue skylight, dominated by the 94-foot model of a blue whale.' }),
  R('humanorigins', 'Anne and Bernard Spitzer Hall of Human Origins', 1, -75, 84, -19, 106, { wing: S77, style: 'modern', short: 'Human Origins',
    blurb: 'Fossils and DNA tell the story of human evolution, from Lucy to Homo sapiens.' }),
  R('meteorites', 'Arthur Ross Hall of Meteorites', 1, -101, 81, -76, 106, { wing: S77, style: 'meteor', h: 6,
    blurb: 'More than 130 meteorites around Ahnighito, the 34-ton centrepiece of the Cape York fall.' }),
  R('gems', 'Allison and Roberto Mignone Halls of Gems and Minerals', 1, -100, 27, -70, 80, { wing: COL, style: 'gemhall', short: 'Gems and Minerals',
    blurb: 'Reopened in 2021: 5,000 specimens from 98 countries, from giant amethyst geodes to the Star of India.' }),
  R('gildershop1', 'Gilder Center Galleria', 1, -38, -9, -22, 29, { wing: GILDER, style: 'gilder', minor: true }),
  R('insectarium', 'Susan and Peter J. Solomon Family Insectarium', 1, -80, -30, -40, -15, { wing: GILDER, style: 'gilder', short: 'Insectarium',
    blurb: 'The museum\'s first gallery devoted to insects in fifty years, with live colonies and an 8,000-pound resin model of a beehive.' }),
  R('collections1', 'Louis V. Gerstner, Jr. Collections Core', 1, -94, 15, -40, 26, { wing: GILDER, style: 'gilder', short: 'Collections Core',
    blurb: 'Floor-to-ceiling windows into working collections: more than 3,000 objects on three public levels.' }),
  R('planetearth', 'David S. and Ruth L. Gottesman Hall of Planet Earth', 1, 71, -84, 101, -20, { wing: ROSE, style: 'earthhall', short: 'Hall of Planet Earth', h: 6,
    blurb: 'How the Earth works, told with 168 rock samples collected on 28 expeditions.' }),
  R('rose', 'Rose Center for Earth and Space', 1, 32, -83, 70, -45, { wing: ROSE, style: 'rose', y: -6.5, h: 30.5, tall: true, custom: true,
    blurb: 'A glass cube 95 feet high enclosing the 87-foot Hayden Sphere, opened in 2000.' }),
  R('gilder', 'Kenneth C. Griffin Exploration Atrium', 1, -96, -14, -39, 14, { wing: GILDER, style: 'gilder', h: 28, tall: true, custom: true,
    blurb: 'Studio Gang\'s five-storey canyon of sprayed concrete, opened in 2023, which links ten museum buildings.' }),

  // ============================== FLOOR 2 ==============================
  R('rotunda', 'Theodore Roosevelt Rotunda', 2, 80, -18.5, 101, 18.5, { wing: CPW, style: 'rotunda', h: 30.5, tall: true, custom: true,
    blurb: 'The museum\'s grand entrance: a 100-foot barrel-vaulted hall where a Barosaurus rears to defend her young from an Allosaurus.' }),
  R('vest2', 'East Stair Hall', 2, 67, -6, 79, 6, { wing: CPW, style: 'stonehall', minor: true }),
  R('akeley', 'Akeley Hall of African Mammals', 2, 22, -13, 66, 13, { wing: CORE, style: 'akeley', h: 12, tall: true, custom: true,
    blurb: 'Carl Akeley\'s masterpiece, opened in 1936: 28 dioramas on two levels around a herd of eight African elephants.' }),
  R('akeleygallery', 'Akeley Gallery', 2, 14, -6, 21, 20, { wing: CORE, style: 'stonehall', minor: true }),
  R('crossing2', 'Central Crossing', 2, -21, 21, 21, 29, { wing: CORE, style: 'stonehall', minor: true }),
  R('africanpeoples', 'Hall of African Peoples', 2, -11, 30, 11, 83, { wing: S77, style: 'woodhall',
    blurb: 'The cultures of Africa across grasslands, deserts, forests and river valleys.' }),
  R('birdsworld', 'Hall of Birds of the World', 2, -18, 84, 18, 106, { wing: S77, style: 'dioramahall',
    blurb: 'Twelve dioramas of the world\'s bird life in its major biomes.' }),
  R('asianpeoples', 'Gardner D. Stout Hall of Asian Peoples', 2, 19, 84, 75, 106, { wing: S77, style: 'woodhall', short: 'Asian Peoples',
    blurb: 'The museum\'s largest cultural hall, from prehistory to the traditional cultures of Asia.' }),
  R('asianpeoples2', 'Gardner D. Stout Hall of Asian Peoples', 2, 77, 77, 101, 106, { wing: S77, style: 'woodhall', part: 'asianpeoples' }),
  R('asianmammals', 'Hall of Asian Mammals', 2, 80, 20, 101, 76, { wing: CPW, style: 'dioramahall', h: 5.8,
    blurb: 'Dioramas from the Vernay-Faunthorpe expeditions of the 1920s, around a pair of Indian elephants.' }),
  R('mexico', 'Hall of Mexico and Central America', 2, -75, 84, -19, 106, { wing: S77, style: 'woodhall',
    blurb: 'Olmec, Maya, Zapotec and Aztec art and architecture.' }),
  R('southamerica2', 'Hall of South American Peoples', 2, -101, 81, -76, 106, { wing: S77, style: 'woodhall', part: 'southamerica' }),
  R('southamerica', 'Hall of South American Peoples', 2, -98, 27, -77, 80, { wing: COL, style: 'woodhall',
    blurb: 'Pre-Columbian Andean cultures and the living peoples of Amazonia.' }),
  R('gildereast2', 'Gilder Center Galleria', 2, -38, -9, -22, 29, { wing: GILDER, style: 'gilder', minor: true }),
  R('butterfly', 'Davis Family Butterfly Vivarium', 2, -80, -30, -40, -15, { wing: GILDER, style: 'vivarium', short: 'Butterfly Vivarium',
    blurb: 'A year-round tropical vivarium where up to 1,000 butterflies of 80 species fly free.' }),
  R('collections2', 'Collections Core', 2, -94, 15, -40, 26, { wing: GILDER, style: 'gilder' }),
  R('roselink2', 'Cosmic Shop & Rose Gallery', 2, 71, -56, 101, -20, { wing: ROSE, style: 'modern', minor: true }),

  // ============================== FLOOR 3 ==============================
  R('landing3', 'East Landing', 3, 67, -6, 79, 6, { wing: CPW, style: 'stonehall', minor: true }),
  R('landing3s', 'East Landing', 3, 73.5, 7, 79, 30, { wing: CPW, style: 'stonehall', minor: true, part: 'landing3' }),
  R('landing3n', 'East Landing', 3, 73.5, -30, 79, -7, { wing: CPW, style: 'stonehall', minor: true, part: 'landing3' }),
  R('nycbirds', 'Birds of New York City', 3, 14, -6, 21, 20, { wing: CORE, style: 'dioramahall', short: 'New York City Birds' }),
  R('crossing3', 'Hall of New York State Mammals', 3, -21, 21, 21, 29, { wing: CORE, style: 'dioramahall', short: 'New York State Mammals' }),
  R('nabirds', 'Leonard C. Sanford Hall of North American Birds', 3, -11, 30, 11, 83, { wing: S77, style: 'dioramahall', short: 'North American Birds',
    blurb: 'More than twenty dioramas, with painted backgrounds by Louis Agassiz Fuertes and Francis Lee Jaques.' }),
  R('primates', 'Hall of Primates', 3, -18, 84, 18, 106, { wing: S77, style: 'woodhall',
    blurb: 'Skeletons, mounts and models tracing the primate family tree.' }),
  R('gallery3', 'Gallery 3', 3, 19, 84, 75, 106, { wing: S77, style: 'modern', blurb: 'Special exhibition gallery.' }),
  R('secorner3', 'Gallery 3', 3, 77, 77, 101, 106, { wing: S77, style: 'modern', part: 'gallery3' }),
  R('reptiles', 'Hall of Reptiles and Amphibians', 3, 80, 20, 101, 76, { wing: CPW, style: 'dioramahall',
    blurb: 'Anatomy, defence and reproduction of reptiles and amphibians — including the Komodo dragon group.' }),
  R('woodlands', 'Halls of Eastern Woodlands and Plains Indians', 3, -75, 84, -19, 106, { wing: S77, style: 'woodhall', short: 'Eastern Woodlands & Plains',
    blurb: 'Closed since January 2024 while the museum consults with Native Nations; shown here with its cases covered.' }),
  R('pacific2', 'Margaret Mead Hall of Pacific Peoples', 3, -101, 81, -76, 106, { wing: S77, style: 'pacific', part: 'pacific' }),
  R('pacific', 'Margaret Mead Hall of Pacific Peoples', 3, -98, 27, -77, 80, { wing: COL, style: 'pacific',
    blurb: 'The cultures of the South Pacific, named for the anthropologist who worked at the museum for more than fifty years.' }),
  R('gildereast3', 'Gilder Center Galleria', 3, -38, -9, -22, 29, { wing: GILDER, style: 'gilder', minor: true }),
  R('invisible', 'Invisible Worlds', 3, -80, -30, -40, -15, { wing: GILDER, style: 'darkmodern',
    blurb: 'A 360-degree immersive room about the networks of life at every scale.' }),
  R('collections3', 'Collections Core', 3, -94, 15, -40, 26, { wing: GILDER, style: 'gilder' }),
  R('roselink3', 'Hayden Planetarium Gallery', 3, 71, -56, 79, -31, { wing: ROSE, style: 'modern', minor: true }),

  // ============================== FLOOR 4 ==============================
  R('landing4', 'East Landing', 4, 67, -6, 79, 6, { wing: CPW, style: 'fossil', minor: true }),
  R('landing4s', 'East Landing', 4, 73.5, 7, 79, 30, { wing: CPW, style: 'fossil', minor: true, part: 'landing4' }),
  R('saurischian', 'Hall of Saurischian Dinosaurs', 4, 22, -13, 66, 13, { wing: CORE, style: 'fossil', h: 6.4,
    blurb: 'The lizard-hipped dinosaurs: Tyrannosaurus rex, Apatosaurus and their relatives, down to the living birds.' }),
  R('shop4', 'Fossil Halls Crossing', 4, 14, -6, 21, 20, { wing: CORE, style: 'fossil', minor: true }),
  R('crossing4', 'Fossil Halls Crossing', 4, -21, 21, 21, 29, { wing: CORE, style: 'fossil', minor: true, part: 'shop4' }),
  R('vertorigins', 'Hall of Vertebrate Origins', 4, -11, 30, 11, 83, { wing: S77, style: 'fossil', h: 6,
    blurb: '500 million years of vertebrate evolution: jawless fishes, armoured placoderms, sharks, marine reptiles and pterosaurs.' }),
  R('orientation', 'Miriam and Ira D. Wallach Orientation Center', 4, -18, 84, 18, 106, { wing: S77, style: 'fossil', short: 'Wallach Orientation Center', h: 6.2,
    blurb: 'The starting point of the fossil halls — and home of the 122-foot Titanosaur, too long to fit in the room.' }),
  R('advmammals', 'Paul and Irma Milstein Hall of Advanced Mammals', 4, 19, 84, 75, 106, { wing: S77, style: 'fossil', short: 'Advanced Mammals', h: 6,
    blurb: 'The great radiation of placental mammals after the dinosaurs: mammoths, mastodons, brontotheres and sabre-toothed cats.' }),
  R('primmammals', 'Hall of Primitive Mammals', 4, 77, 77, 101, 106, { wing: S77, style: 'fossil', h: 6,
    blurb: 'The roots of the mammal line, from sail-backed Dimetrodon to glyptodonts and giant ground sloths.' }),
  R('ornithischian', 'Hall of Ornithischian Dinosaurs', 4, 80, 20, 101, 76, { wing: CPW, style: 'fossil', h: 6,
    blurb: 'The bird-hipped dinosaurs: Stegosaurus, Triceratops, the duck-bills and the Edmontosaurus "mummy".' }),
  R('gildereast4', 'Gilder Center Galleria', 4, -38, -9, -22, 29, { wing: GILDER, style: 'gilder', minor: true }),
  R('library', 'Gottesman Research Library and Learning Center', 4, -80, -30, -40, -15, { wing: GILDER, style: 'library', short: 'Gottesman Research Library',
    blurb: 'One of the world\'s great natural history libraries, with a reading room looking west over Columbus Avenue.' }),
  R('alcove4', 'Alcove Gallery', 4, -94, 15, -40, 26, { wing: GILDER, style: 'gilder' }),

  // ============================== STAIRS ==============================
  R('stairES', 'Stairs', 1, 67.4, 7, 72.6, 17, { wing: CPW, style: 'stair', stair: { flip: false, floors: [1, 2, 3, 4] }, h: 25.5, tall: true, minor: true }),
  R('stairEN', 'Stairs', 1, 67.4, -17, 72.6, -7, { wing: CPW, style: 'stair', stair: { flip: true, floors: [1, 2, 3, 4] }, h: 25.5, tall: true, minor: true }),
  R('stair77', 'Stairs', 1, 19.4, 73, 24.6, 83, { wing: S77, style: 'stair', stair: { flip: true, floors: [1, 2, 3, 4] }, h: 25.5, tall: true, minor: true }),
  R('stairG', 'Stairs', 1, -37.6, -20, -32.4, -10, { wing: GILDER, style: 'stair', stair: { flip: true, floors: [1, 2, 3, 4] }, h: 25.5, tall: true, minor: true }),
];

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]));

// ---------------------------------------------------------------------------
// Doorways. axis 'x': passage runs east-west between x=a0..a1, spanning z=c0..c1.
//           axis 'z': passage runs north-south between z=a0..a1, spanning x=c0..c1.
// ---------------------------------------------------------------------------
export const PORTALS = [];
function D(floor, axis, a0, a1, c0, c1, h = 4.2, o = {}) {
  const p = axis === 'x'
    ? { floor, axis, x0: a0, x1: a1, z0: c0, z1: c1 }
    : { floor, axis, z0: a0, z1: a1, x0: c0, x1: c1 };
  p.y = o.y ?? FLOOR_Y[floor];
  p.h = h;
  Object.assign(p, o);
  PORTALS.push(p);
  return p;
}

for (const f of [1, 2, 3, 4]) {
  // east stair hall <-> the east-west arm (N.A. Mammals / Akeley / mezzanine / Saurischian)
  D(f, 'x', 66, 67, -3, 3, f === 2 ? 4.8 : 4.2);
  // stairs off the stair hall
  D(f, 'z', 6, 7, 67.9, 72.1, 3.2);
  D(f, 'z', -7, -6, 67.9, 72.1, 3.2);
  // west end of the arm <-> corridor
  D(f, 'x', 21, 22, -3, 3, f === 2 ? 4.8 : 4.2);
  // corridor <-> crossing
  D(f, 'z', 20, 21, 14.5, 20.5, 4.4);
  // crossing <-> 1877 building
  D(f, 'z', 29, 30, -4, 4, 4.4);
  // 1877 building <-> 77th St centre
  D(f, 'z', 83, 84, -4, 4, 4.4);
  // 77th St centre <-> east wing
  D(f, 'x', 18, 19, 91, 99, f === 4 ? 5.7 : 4.4); // (floor 4: tall enough for the Titanosaur's neck)
  // 77th St stair
  D(f, 'z', 83, 84, 19.9, 24.1, 3.2);
  // east wing <-> SE corner
  D(f, 'x', 75, 77, 91, 99, 4.4);
  // SE corner <-> Central Park West range
  D(f, 'z', 76, 77, 86, 95, 4.4);
  // crossing <-> Gilder
  D(f, 'x', -22, -21, 22, 28, 4.4);
  // Gilder stair
  D(f, 'z', -10, -9, -37.1, -32.9, 3.2);
}
for (const f of [1, 2, 3]) {
  // 77th St centre <-> west wing, west wing <-> SW corner, SW corner <-> Columbus range, Columbus range <-> Gilder
  D(f, 'x', -19, -18, 91, 99, 4.4);
  D(f, 'x', -76, -75, 91, 99, 4.4);
  D(f, 'z', 80, 81, -92, -84, 4.4);
  D(f, 'z', 26, 27, -92, -84, 4.2);
}
for (const f of [1, 2, 3, 4]) {
  // Gilder atrium <-> galleria (east), north rooms, south rooms
  D(f, 'x', -39, -38, -4, 4, 4.3, { noTrim: true });
  D(f, 'z', -15, -14, -64, -58, 4.2, { noTrim: true });
  D(f, 'z', 14, 15, -70, -64, 4.2, { noTrim: true });
}
// Floor 1
D(1, 'x', 79, 80, -3, 3, 4.2); // stair hall <-> Memorial Hall
D(1, 'z', 18.5, 20, 86, 95, 4.4); // Memorial Hall <-> Biodiversity
D(1, 'z', -20, -18.5, 86, 95, 4.4); // Memorial Hall <-> Planet Earth
D(1, 'x', 78, 80, 40, 48, 4.2); // Ocean Life (mezzanine level) <-> Biodiversity
D(1, 'x', 70, 71, -68, -60, 4.4); // Planet Earth <-> Rose Center
// Floor 2
D(2, 'x', 79, 80, -3.5, 3.5, 5.6); // stair hall <-> Rotunda
D(2, 'x', 101, 103, -3.2, 3.2, 6.2, { exterior: true }); // Rotunda <-> Central Park West steps
D(2, 'z', 18.5, 20, 86, 95, 5.2); // Rotunda <-> Asian Mammals
D(2, 'z', -20, -18.5, 86, 95, 5.2); // Rotunda <-> Rose gallery
D(2, 'x', 70, 71, -54, -48, 4.2); // Rose gallery <-> Scales of the Universe
// Floors 3 & 4: landings
for (const f of [3, 4]) {
  D(f, 'z', 6, 7, 73.9, 78.6, 4.4); // landing <-> south arm
  D(f, 'x', 79, 80, 22, 28, 4.2); // south arm <-> CPW hall (Reptiles / Ornithischians)
}
D(3, 'z', -7, -6, 73.9, 78.6, 4.4); // landing <-> north arm
D(3, 'z', -31, -30, 74, 78.5, 4.2); // north arm <-> planetarium gallery
D(3, 'x', 70, 71, -54, -48, 4); // planetarium gallery <-> Rose Center level 3

// ---------------------------------------------------------------------------
// Elevator banks: each entry is a call point; riding moves between points in the same bank.
// ---------------------------------------------------------------------------
export const ELEVATORS = [
  { bank: 'Central Park West elevators', floors: [1, 2, 3, 4], x: 67.1, z: 4.55, face: 90 },
  { bank: '77th Street elevators', floors: [1, 2, 3, 4], x: 17.9, z: 88, face: 270 },
  { bank: 'Gilder Center elevators', floors: [1, 2, 3, 4], x: -22.1, z: 12, face: 270 },
  { bank: 'Rose Center elevators', floors: ['LL', 1, 2, 3], x: 69.9, z: -72, face: 270, at: { 3: { x: 65, z: -45.1, face: 0 } } },
];

// Tall rooms appear on several floors of the map; value = name override for that level (null = room name).
export const LEVELS = {
  akeley: { 2: null, 3: 'Akeley Hall of African Mammals — Mezzanine' },
  rose: { LL: 'Dorothy and Lewis B. Cullman Hall of the Universe', 1: 'Rose Center — Hayden Sphere & Cosmic Pathway', 2: 'Scales of the Universe', 3: 'Hayden Planetarium — Space Theater' },
  gilder: { 1: null, 2: 'Griffin Exploration Atrium — Level 2', 3: 'Griffin Exploration Atrium — Level 3', 4: 'Griffin Exploration Atrium — Level 4' },
  ocean: { 1: null },
  rotunda: { 2: null },
  stairES: { 1: null, 2: null, 3: null, 4: null },
  stairEN: { 1: null, 2: null, 3: null, 4: null },
  stair77: { 1: null, 2: null, 3: null, 4: null },
  stairG: { 1: null, 2: null, 3: null, 4: null },
};

/** Rooms shown on a given floor of the map: [{room, name, level}] */
export function roomsOnFloor(f) {
  const out = [];
  for (const r of ROOMS) {
    const lv = LEVELS[r.id];
    if (lv) { if (f in lv) out.push({ room: r, name: lv[f] || r.name, level: f }); }
    else if (r.floor === f) out.push({ room: r, name: r.name, level: f });
  }
  return out;
}
