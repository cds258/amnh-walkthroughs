// Akeley Hall of African Mammals (floor 2, with its mezzanine on floor 3).
// 28 habitat dioramas, 14 per level, around the herd of eight elephants.
import * as THREE from 'three';
import { xform, shade } from '../../engine/builder.js';
import { dioramaRun } from '../dioramas.js';
import { model } from '../../models/index.js';
import { railing, blob, bench } from '../furniture.js';

const A = (d, name, u, z, rot, opts, s, dy) => d.put(model('animals', name, opts || {}), u, z, rot, s || 1, dy || 0);

// ---- the 28 groups ---------------------------------------------------------
const MAIN_N = [
  { title: 'Water Hole', sub: 'Guaso Nyiro River, Kenya', biome: 'waterhole', seed: 2, h: 3.7, star: true, id: 'waterhole',
    text: 'Reticulated giraffes, Grévy\'s zebras, oryx and gazelles gather warily at a dry-season water hole in northern Kenya — one of the largest groups in the hall.',
    scene: (d) => {
      d.sheet(-1.6, -0.5, 1.4, -1.6, 0.05, 0x6f8e98);
      A(d, 'giraffe', -1.5, -2.6, -20, { pose: 'stand', seed: 1 }, 0.8);
      A(d, 'giraffe', 0.4, -2.1, 160, { pose: 'drink', seed: 2 }, 0.8);
      A(d, 'zebra', 2.0, -1.5, 200, { seed: 3 }, 0.92);
      A(d, 'gazelle', -2.5, -1.0, 30, { seed: 4 });
      A(d, 'gemsbok', 2.4, -2.9, 170, { seed: 2 }, 0.9);
      d.tree('acacia', 2.6, -3.2, 3.4).grass(40).rocks(4, 0.2);
    } },
  { title: 'Mountain Nyala', sub: 'Arussi Mountains, Ethiopia', biome: 'mountain', seed: 3,
    text: 'A shy antelope of the Ethiopian highlands, unknown to science until 1908, shown among giant heath at 9,000 feet.',
    scene: (d) => { A(d, 'nyala', -0.9, -1.6, 10, { seed: 1 }); A(d, 'nyala', 1.1, -2.4, 170, { seed: 2 }, 0.9); A(d, 'nyala', 2.0, -1.3, 200, { seed: 3 }, 0.85); d.bush(-2.3, -2.4, 0.9).bush(2.5, -3.0, 0.7).grass(50, { h: 0.5 }).rocks(3, 0.3); } },
  { title: 'African Buffalo', sub: 'Tana River marshes, Kenya', biome: 'nile', seed: 4,
    text: 'Cape buffalo stand in a papyrus marsh. Akeley counted the buffalo among the most dangerous animals he ever hunted.',
    scene: (d) => { A(d, 'buffalo', -1.2, -1.5, 15, { seed: 1 }); A(d, 'buffalo', 1.2, -2.3, 165, { seed: 2 }); A(d, 'buffalo', 0.2, -3.0, 190, { seed: 3 }, 0.9); d.grass(70, { h: 0.7, color: 0x6c8a3a }).bush(-2.6, -2.8, 0.8, 0x56783a); } },
  { title: 'African Lion', sub: 'Serengeti Plain, Tanzania', biome: 'savanna', seed: 5, star: true, id: 'lions',
    text: 'A pride rests in the shade at midday while a maned male stands watch over the Serengeti plain.',
    scene: (d) => { A(d, 'lion', -1.3, -1.9, 12, { pose: 'stand', seed: 1 }); A(d, 'lioness', 0.8, -1.2, 190, { pose: 'lie', seed: 2 }); A(d, 'lioness', 1.9, -2.3, 150, { pose: 'lie', seed: 3 }); A(d, 'lioness', -0.2, -2.9, 30, { pose: 'stand', seed: 4 }, 0.95); d.tree('acacia', 2.4, -3.1, 3.2).grass(60).rocks(3, 0.25).termite(-2.5, -2.9, 1.1); } },
  { title: 'Bongo', sub: 'Aberdare Mountains, Kenya', biome: 'bamboo', seed: 6,
    text: 'The largest and most colourful of the forest antelopes, at home in dense bamboo on the slopes of the Aberdares.',
    scene: (d) => { A(d, 'bongo', -0.7, -1.7, 8, { seed: 1 }); A(d, 'bongo', 1.4, -2.5, 175, { seed: 2 }, 0.92); d.tree('bamboo', -2.4, -2.6, 3.4).tree('bamboo', 2.5, -1.6, 3.2).tree('bamboo', 0.4, -3.3, 3.6).grass(40, { color: 0x4f7a34 }); } },
  { title: 'Giant Eland', sub: 'Bahr el Ghazal, South Sudan', biome: 'savannagreen', seed: 7,
    text: 'The largest of all antelopes browses in open woodland on the southern edge of the Sahel.',
    scene: (d) => { A(d, 'eland', -1.0, -1.8, 10, { seed: 1 }); A(d, 'eland', 1.3, -2.6, 172, { seed: 2 }, 0.93); d.tree('broadleaf', 2.5, -3.0, 3.2).tree('broadleaf', -2.6, -3.0, 2.8).grass(60); } },
  { title: 'Upper Nile Region', sub: 'White Nile, South Sudan', biome: 'nile', seed: 8,
    text: 'Along the papyrus-fringed White Nile: Nile lechwe, roan antelope, white-eared kob and a hippopotamus in the shallows.',
    scene: (d) => { d.sheet(-3, -0.2, 0.2, -1.7, 0.06, 0x7f9a96); A(d, 'hippo', -1.5, -1.3, 20, { seed: 1 }, 0.9); A(d, 'impala', 1.2, -1.6, 170, { seed: 2 }, 1.1); A(d, 'sable', 2.2, -2.7, 190, { seed: 3 }, 0.9); A(d, 'gazelle', 0.4, -2.9, 30, { seed: 4 }, 1.2); d.grass(60, { h: 0.7, color: 0x5c8238, u0: 0 }); } },
];
const MAIN_S = [
  { title: 'Plains', sub: 'Serengeti Plain, Tanzania', biome: 'savanna', seed: 11, star: true, id: 'plains',
    text: 'The great herds of the Serengeti: wildebeest, plains zebra, Thomson\'s and Grant\'s gazelles, with Mount Lemagrut on the horizon.',
    scene: (d) => { A(d, 'zebra', -1.6, -1.4, 10, { seed: 1 }); A(d, 'zebra', -0.2, -2.6, 30, { seed: 2 }, 0.95); A(d, 'wildebeest', 1.4, -1.7, 170, { seed: 3 }); A(d, 'wildebeest', 2.3, -2.9, 200, { seed: 4 }, 0.95); A(d, 'gazelle', 0.5, -1.0, 150, { seed: 5 }); A(d, 'gazelle', -2.4, -2.7, 0, { seed: 6 }); d.grass(70).tree('acacia', -2.7, -3.2, 2.8); } },
  { title: 'Greater Koodoo', sub: 'Tanzania', biome: 'savannagreen', seed: 12,
    text: 'A spiral-horned bull and his cows among the thorn scrub of a rocky hillside.',
    scene: (d) => { A(d, 'kudu', -0.8, -1.7, 12, { seed: 1 }); A(d, 'kudu', 1.3, -2.5, 170, { seed: 2, sex: 'f' }, 0.9); A(d, 'kudu', 2.3, -1.4, 200, { seed: 3, sex: 'f' }, 0.88); d.rocks(5, 0.45, 0x9a8a78).bush(-2.5, -2.7, 0.9).tree('acacia', 2.6, -3.1, 2.8).grass(40); } },
  { title: 'Giant Sable Antelope', sub: 'Cuanza River, Angola', biome: 'savannagreen', seed: 13,
    text: 'Found only in central Angola, the giant sable carries scimitar horns more than five feet long.',
    scene: (d) => { A(d, 'sable', -0.9, -1.7, 10, { seed: 1 }); A(d, 'sable', 1.2, -2.6, 172, { seed: 2 }, 0.9); A(d, 'sable', 2.2, -1.5, 195, { seed: 3 }, 0.85); d.tree('broadleaf', -2.5, -3.0, 3).grass(60).termite(2.6, -3.0, 1.2); } },
  { title: 'Gemsbok', sub: 'Kalahari Desert, Botswana', biome: 'desert', seed: 14,
    text: 'Desert-adapted oryx with rapier horns cross the red sand of the Kalahari.',
    scene: (d) => { A(d, 'gemsbok', -1.2, -1.6, 10, { seed: 1 }); A(d, 'gemsbok', 0.9, -2.5, 15, { seed: 2 }, 0.95); A(d, 'gemsbok', 2.2, -1.5, 190, { seed: 3 }, 0.92); d.bush(-2.4, -2.8, 0.5, 0x8a8a52).bush(2.6, -3.0, 0.5, 0x8a8a52).grass(25, { color: 0xb09a5c, h: 0.3 }).rocks(3, 0.2, 0xb08a60); } },
  { title: 'Libyan Desert', sub: 'Northern Sudan', biome: 'desert', seed: 15,
    text: 'Addax and scimitar-horned oryx, antelopes that can live without drinking, on the dunes of the eastern Sahara.',
    scene: (d) => { A(d, 'gemsbok', -1.0, -1.8, 12, { seed: 4 }, 0.85); A(d, 'gazelle', 1.0, -1.3, 170, { seed: 2 }, 1.1); A(d, 'gazelle', 2.0, -2.6, 200, { seed: 3 }, 1.1); d.mound(-2.2, -3.0, 2.2, 0.5, 1.2, 0xdcb878).mound(2.2, -3.2, 2.0, 0.4, 1.0, 0xd8b472).grass(10, { color: 0xb09a5c, h: 0.25 }); } },
  { title: 'Okapi', sub: 'Ituri Forest, Congo', biome: 'jungle', seed: 16, star: true, id: 'okapi',
    text: 'The giraffe\'s only living relative, unknown to science until 1901, in the deep shade of the Ituri rainforest.',
    scene: (d) => { A(d, 'okapi', -0.8, -1.7, 10, { seed: 1 }); A(d, 'okapi', 1.4, -2.5, 170, { seed: 2 }, 0.92); d.tree('broadleaf', -2.5, -2.7, 3.4, 0x2a4a22).tree('broadleaf', 2.6, -3.0, 3.6, 0x24421e).bush(2.3, -1.2, 0.6, 0x2f5a26).bush(-2.2, -1.0, 0.5, 0x356a2a).grass(40, { color: 0x3c6a2c }); } },
  { title: 'Mountain Gorilla', sub: 'Mount Mikeno, Virunga Volcanoes, Congo', biome: 'virunga', seed: 17, star: true, id: 'gorillas',
    text: 'Akeley\'s own favourite: a silverback beats his chest above the forest of the Virungas, where Akeley died in 1926 and is buried — within the very view painted here.',
    scene: (d) => { A(d, 'gorilla', -0.3, -1.9, -40, { pose: 'chestbeat', seed: 1 }); A(d, 'gorilla_female', 1.6, -1.5, 200, { seed: 2 }); A(d, 'gorilla', -2.0, -2.6, 20, { pose: 'knuckle', seed: 3 }, 0.8); A(d, 'gorilla_female', 2.4, -2.8, 170, { seed: 4 }, 0.6); d.bush(-2.6, -1.3, 0.7, 0x3a6a2c).bush(0.9, -3.1, 0.9, 0x2f5a26).tree('broadleaf', 2.7, -3.3, 2.6, 0x2c4c22).grass(60, { color: 0x3f7030, h: 0.5 }); } },
];
const MEZZ_N = [
  { title: 'Klipspringer', sub: 'Lukenia Hills, Kenya', biome: 'savanna', seed: 21,
    text: 'Small antelopes that walk on the tips of their hooves, with a rock hyrax and a pair of baboons on a granite kopje.',
    scene: (d) => { d.rock(-0.6, -2.0, 1.3, 0x8f8676, 0.8).rock(1.2, -2.6, 1.0, 0x857c6c, 0.9).rock(-2.2, -2.8, 0.9, 0x8f8676); A(d, 'klipspringer', -0.6, -2.0, 15, { seed: 1 }, 1, 0.95); A(d, 'klipspringer', 1.9, -1.4, 170, { seed: 2 }); d.grass(30); } },
  { title: 'Lesser Koodoo', sub: 'Northern Kenya', biome: 'savanna', seed: 22,
    text: 'A slender, heavily striped antelope of dry thornbush country.',
    scene: (d) => { A(d, 'kudu', -0.9, -1.7, 10, { seed: 5 }, 0.72); A(d, 'kudu', 1.2, -2.4, 172, { seed: 6, sex: 'f' }, 0.68); d.tree('acacia', 2.5, -3.1, 2.6).bush(-2.4, -2.6, 0.7, 0x7a7a48).grass(40); } },
  { title: 'White Rhinoceros', sub: 'Uganda', biome: 'savannagreen', seed: 23,
    text: 'The square-lipped grazer of the grasslands — the largest land mammal after the elephants.',
    scene: (d) => { A(d, 'whiterhino', -0.8, -1.8, 8, { seed: 1 }, 0.9); A(d, 'whiterhino', 1.5, -2.6, 170, { seed: 2 }, 0.72); d.grass(60).tree('acacia', -2.6, -3.1, 2.8); } },
  { title: 'Black Rhinoceros', sub: 'Mount Kenya foothills', biome: 'savanna', seed: 24, star: true, id: 'blackrhino',
    text: 'A hook-lipped browser of the thorn scrub, with tick birds riding on its back.',
    scene: (d) => { A(d, 'blackrhino', -0.9, -1.7, 10, { seed: 1 }, 0.95); A(d, 'blackrhino', 1.5, -2.6, 165, { seed: 2 }, 0.8); d.bush(2.5, -1.3, 0.7, 0x6a7040).tree('acacia', -2.6, -3.0, 2.6).grass(40); } },
  { title: 'Hunting Dog', sub: 'Serengeti Plain, Tanzania', biome: 'dusk', seed: 25,
    text: 'A pack of African wild dogs sets out across the plain at first light in search of prey.',
    scene: (d) => { A(d, 'wilddog', -1.6, -1.4, 10, { seed: 1 }); A(d, 'wilddog', -0.2, -2.1, 5, { seed: 2 }); A(d, 'wilddog', 1.2, -1.5, 20, { seed: 3 }); A(d, 'wilddog', 2.2, -2.6, 0, { seed: 4 }); A(d, 'wilddog', 0.4, -3.0, 350, { seed: 5 }, 0.95); d.grass(60, { color: 0x8a7038 }); } },
  { title: 'South African', sub: 'Karoo, South Africa', biome: 'prairie', seed: 26,
    text: 'Springbok, blesbok and black wildebeest on the open veld of the Karoo.',
    scene: (d) => { A(d, 'wildebeest', -1.2, -1.9, 10, { seed: 5 }, 0.9); A(d, 'gazelle', 0.6, -1.3, 170, { seed: 7 }, 1.15); A(d, 'gazelle', 1.8, -2.4, 200, { seed: 8 }, 1.15); A(d, 'impala', -2.3, -2.9, 0, { seed: 3 }); d.grass(70, { h: 0.3 }).termite(2.6, -3.0, 0.9); } },
  { title: 'Ostrich', sub: 'Athi Plains, Kenya', biome: 'savanna', seed: 27,
    text: 'A pair of ostriches defends its nest of eggs from an inquisitive family of warthogs.',
    scene: (d) => { A(d, 'ostrich', -0.9, -1.8, 10, { seed: 1 }); A(d, 'ostrich', 0.9, -2.7, 170, { seed: 2 }, 0.92); A(d, 'warthog', 2.1, -1.4, 190, { seed: 1 }); A(d, 'warthog', 2.6, -2.2, 200, { seed: 2 }, 0.7); d.grass(50).rocks(3, 0.15, 0xe8e2d0); } },
];
const MEZZ_S = [
  { title: 'Leopard', sub: 'with Bush Pig — Aberdare Mountains, Kenya', biome: 'night', seed: 31,
    text: 'A leopard crouches over the trail as a bush pig passes below in the forest at night.',
    scene: (d) => { d.rock(-1.2, -2.2, 1.2, 0x4a4a48, 0.9); A(d, 'leopard', -1.2, -2.2, 10, { seed: 1, pose: 'crouch' }, 1, 1.0); A(d, 'bushpig', 1.6, -1.5, 185, { seed: 1 }); d.tree('broadleaf', 2.6, -3.0, 3, 0x1c2c1c).grass(40, { color: 0x24382a }); },
    lightCol: 0x9fb4e0 },
  { title: 'Colobus Monkey', sub: 'Aberdare Mountains, Kenya', biome: 'virunga', seed: 32,
    text: 'Black-and-white colobus monkeys in the canopy of a mountain forest, their long white mantles streaming.',
    scene: (d) => { d.tree('dead', -1.0, -2.2, 3.0).tree('broadleaf', 2.2, -3.0, 3.2, 0x2c4c22); A(d, 'colobus', -1.0, -1.6, 10, { seed: 1 }); A(d, 'colobus', 0.8, -2.3, 170, { seed: 2 }); A(d, 'colobus', 2.0, -1.4, 200, { seed: 3 }, 0.9); d.grass(40, { color: 0x3f7030 }); } },
  { title: 'Chimpanzee', sub: 'Tai Forest, Ivory Coast', biome: 'jungle', seed: 33,
    text: 'A family of chimpanzees feeds on the ground in the West African rainforest.',
    scene: (d) => { A(d, 'chimpanzee', -1.2, -1.6, 15, { seed: 1 }); A(d, 'chimpanzee', 0.7, -2.2, 175, { seed: 2 }); A(d, 'chimpanzee', 2.0, -1.5, 200, { seed: 3 }, 0.8); d.tree('broadleaf', -2.6, -3.0, 3.4, 0x24421e).log(0.2, -3.0, 2.2, 0.18, 10).grass(40, { color: 0x356a2a }); } },
  { title: 'Mandrill', sub: 'Cameroon', biome: 'jungle', seed: 34,
    text: 'The most vividly coloured of all mammals forages on the rainforest floor.',
    scene: (d) => { A(d, 'mandrill', -1.0, -1.6, 12, { seed: 1 }); A(d, 'mandrill', 1.0, -2.3, 170, { seed: 2 }, 0.85); A(d, 'mandrill', 2.2, -1.4, 195, { seed: 3 }, 0.7); d.tree('broadleaf', 2.7, -3.1, 3.2, 0x24421e).bush(-2.5, -2.8, 0.8, 0x2f5a26).grass(40, { color: 0x356a2a }); } },
  { title: 'Impala', sub: 'Northern Kenya', biome: 'savannagreen', seed: 35,
    text: 'A lyre-horned ram and his herd of ewes in acacia woodland.',
    scene: (d) => { A(d, 'impala', -1.4, -1.5, 10, { seed: 1 }); A(d, 'impala', 0.2, -2.3, 20, { seed: 2, sex: 'f' }, 0.95); A(d, 'impala', 1.5, -1.6, 170, { seed: 3, sex: 'f' }, 0.95); A(d, 'impala', 2.4, -2.8, 190, { seed: 4, sex: 'f' }, 0.9); d.tree('acacia', -2.6, -3.1, 3).grass(60); } },
  { title: 'Hyena–Jackal–Vulture', sub: 'Serengeti Plain, Tanzania', biome: 'dusk', seed: 36,
    text: 'The scavengers of the plain: spotted hyenas, jackals and vultures dispute what the lions have left.',
    scene: (d) => { A(d, 'hyena', -1.1, -1.7, 12, { seed: 1 }); A(d, 'hyena', 1.3, -2.4, 170, { seed: 2 }, 0.95); A(d, 'jackal', 2.3, -1.3, 200, { seed: 1 }); A(d, 'vulture', -2.4, -2.6, 30, { seed: 1 }); A(d, 'vulture', 0.2, -3.0, 160, { seed: 2 }); d.rocks(3, 0.14, 0xe2dccc).grass(50, { color: 0x8a7038 }); } },
  { title: 'Cheetah', sub: 'Kalahari, Botswana', biome: 'desert', seed: 37,
    text: 'The fastest land animal, with her cubs on a termite mound in the Kalahari thirstland.',
    scene: (d) => { d.termite(-1.2, -2.4, 1.0); A(d, 'cheetah', -0.2, -1.6, 10, { seed: 1 }); A(d, 'cheetah', 1.6, -2.3, 170, { seed: 2 }, 0.9); A(d, 'cheetah', 2.3, -1.4, 190, { seed: 3 }, 0.5); d.grass(40, { color: 0xa8935a, h: 0.35 }).bush(2.6, -3.0, 0.5, 0x8a8a52); } },
];

function slots(a, b, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(a + (i + 0.5) * (b - a) / n);
  return out;
}

export function akeley(ctx) {
  const { room, geo, phys, lights } = ctx;
  const y = room.y, yM = y + 6.5; // mezzanine = floor 3
  const { x0, x1, z0, z1 } = room;
  const depth = 4.3;
  const zi = z1 - depth; // face of the diorama walls: z = +-8.7
  const dark = 0x3a3f39;

  // ---- diorama walls, both levels ----
  const xs = slots(x0, x1, 7);
  const mk = (list) => list.map((it, i) => ({ ...it, at: xs[i], w: 4.9 }));
  dioramaRun(ctx, { side: 'n', a: x0, b: x1, depth, y, h: 6, items: mk(MAIN_N) });
  dioramaRun(ctx, { side: 's', a: x0, b: x1, depth, y, h: 6, items: mk([...MAIN_S].reverse()) });
  dioramaRun(ctx, { side: 'n', a: x0, b: x1, depth, y: yM, h: 5.5, items: mk(MEZZ_N) });
  dioramaRun(ctx, { side: 's', a: x0, b: x1, depth, y: yM, h: 5.5, items: mk([...MEZZ_S].reverse()) });

  // ---- mezzanine ring ----
  const vx0 = x0 + 4.2, vx1 = x1 - 4.2, vz = 5.0; // void: x 26.2..61.8, z -5..5
  const strips = [
    [x0, -zi, x1, -vz], [x0, vz, x1, zi], [x0, -vz, vx0, vz], [vx1, -vz, x1, vz],
  ];
  for (const s of strips) {
    geo.box('marble', s[0], yM - 0.55, s[1], s[2], yM, s[3], { color: 0x5e584e, bottom: 0x2e2b27, side: dark, skip: '' });
    phys.floor(s[0], s[1], s[2], s[3], yM);
  }
  // fascia band + bronze balustrade round the void
  geo.box('darkmarble', vx0 - 0.12, yM - 0.6, -vz - 0.12, vx1 + 0.12, yM + 0.06, -vz, { color: 0x5a6058 });
  geo.box('darkmarble', vx0 - 0.12, yM - 0.6, vz, vx1 + 0.12, yM + 0.06, vz + 0.12, { color: 0x5a6058 });
  geo.box('darkmarble', vx0 - 0.12, yM - 0.6, -vz, vx0, yM + 0.06, vz, { color: 0x5a6058 });
  geo.box('darkmarble', vx1, yM - 0.6, -vz, vx1 + 0.12, yM + 0.06, vz, { color: 0x5a6058 });
  railing(ctx, [[vx0, -vz], [vx1, -vz], [vx1, vz], [vx0, vz], [vx0, -vz]], yM, { color: 0x8a6a3a });
  // downlights under the balcony, uplight wash on the ceiling
  for (const x of slots(x0, x1, 7)) for (const s of [-1, 1]) {
    geo.box('glow', x - 0.12, yM - 0.6, s * 6.9 - 0.12, x + 0.12, yM - 0.57, s * 6.9 + 0.12, { color: [1.1, 0.8, 0.45] });
  }
  for (const x of [30, 44, 58]) {
    lights.anchor(x, y + 10.2, 0, { color: 0xffd9a0, intensity: 46, dist: 26 });
  }
  lights.anchor(44, y + 4, 0, { color: 0xffe0b0, intensity: 30, dist: 20 });
  lights.anchor(26, yM + 3.4, 0, { color: 0xffd9a0, intensity: 14, dist: 14 });
  lights.anchor(62, yM + 3.4, 0, { color: 0xffd9a0, intensity: 14, dist: 14 });
  // coffered ceiling
  const yc = y + room.h;
  for (const x of slots(x0, x1, 11)) geo.box('plaster', x - 0.25, yc - 0.55, -zi, x + 0.25, yc, zi, { color: 0x4a443a });
  for (const zz of [-vz, 0, vz]) geo.box('plaster', x0, yc - 0.45, zz - 0.2, x1, yc, zz + 0.2, { color: 0x4a443a });
  for (const x of slots(x0, x1, 11)) geo.ceil('glow', x + 1.2, -1.0, x + 2.8, 1.0, yc - 0.03, { color: [0.42, 0.3, 0.17] });

  // ---- the elephant group ("The Alarm") on its plinth ----
  const cx = 44, cz = 0, px = 8.2, pz = 3.5, ph = 0.42;
  // octagonal plinth
  const shape = new THREE.Shape();
  const c = 1.3;
  shape.moveTo(-px + c, -pz); shape.lineTo(px - c, -pz); shape.lineTo(px, -pz + c); shape.lineTo(px, pz - c);
  shape.lineTo(px - c, pz); shape.lineTo(-px + c, pz); shape.lineTo(-px, pz - c); shape.lineTo(-px, -pz + c); shape.closePath();
  const pg = new THREE.ExtrudeGeometry(shape, { depth: ph, bevelEnabled: false });
  pg.rotateX(-Math.PI / 2);
  geo.add('darkmarble', pg, xform(cx, y, cz), 0x3c403a);
  const pg2 = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false });
  pg2.rotateX(-Math.PI / 2);
  geo.add('ground', pg2, new THREE.Matrix4().makeScale(0.97, 1, 0.93).setPosition(cx, y + ph, cz), 0x8a7a58);
  phys.box(cx - px + 0.5, cz - pz, cx + px - 0.5, cz + pz, y, y + 3);
  phys.box(cx - px, cz - pz + 0.9, cx + px, cz + pz - 0.9, y, y + 3);
  const herd = [
    ['elephant', { sex: 'bull', pose: 'alarm', seed: 1 }, 5.3, 0.1, 0, 1],
    ['elephant', { sex: 'cow', pose: 'walk', seed: 2 }, 2.6, 1.75, -10, 1],
    ['elephant', { sex: 'cow', pose: 'stand', seed: 3 }, 2.3, -1.8, 12, 1],
    ['elephant', { age: 'calf', pose: 'stand', seed: 4 }, 0.9, 0.2, 5, 1],
    ['elephant', { sex: 'cow', pose: 'walk', seed: 5 }, -1.0, 1.9, -18, 0.96],
    ['elephant', { sex: 'cow', pose: 'stand', seed: 6 }, -1.3, -1.8, 22, 0.94],
    ['elephant', { age: 'calf', pose: 'walk', seed: 7 }, -2.9, 0.0, -8, 1.15],
    ['elephant', { sex: 'bull', pose: 'stand', seed: 8 }, -5.4, 0.1, 176, 0.92],
  ];
  for (const [name, opts, dx, dz, rot, s] of herd) {
    geo.addGeo(model('animals', name, opts), xform(cx + dx, y + ph + 0.04, cz + dz, rot * Math.PI / 180, s));
    blob(geo, cx + dx, y + ph + 0.06, cz + dz, 2.3 * s, 1.3 * s, rot);
  }
  ctx.placard({
    id: 'elephants', star: true, title: 'African Elephants', sub: '"The Alarm" — Loxodonta africana',
    text: 'Eight elephants, mounted by Carl Akeley and his successors, stand as a herd alerted to danger: the big bull in front raises his trunk to test the wind while another turns to guard the rear. Akeley\'s taxidermy method — skin over a sculpted, hollow manikin — was invented for these animals.',
    x: cx + px + 1.0, y, z: cz + 1.4, face: 90, size: 0.95,
    target: [cx + 4, y + 2.6, cz],
    view: { x: cx + px + 5.5, y, z: cz + 0.6, yaw: 265, pitch: 6 },
  });
  ctx.placard({
    title: 'Akeley Hall of African Mammals', sub: 'Opened 1936',
    text: 'Carl Akeley — taxidermist, sculptor, inventor and conservationist — conceived this hall in 1909 and died on Mount Mikeno in 1926 while collecting for it. The 28 dioramas reproduce real places down to individual plants, with backgrounds painted on site by artists such as William R. Leigh and James Perry Wilson.',
    x: x1 - 5.2, y, z: 4.2, face: 90, list: false,
  });
  // elephant tusks flanking the west end
  for (const s of [-1, 1]) {
    const tusk = new THREE.TorusGeometry(1.5, 0.085, 7, 20, 1.5);
    geo.add('bone', tusk, new THREE.Matrix4().compose(new THREE.Vector3(x0 + 5.6, y + 0.45, s * 3.9), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s > 0 ? 0 : Math.PI, 0.25)), new THREE.Vector3(1, 1.6, 1)), 0xe6dcc0);
    geo.cyl('darkmarble', x0 + 6.6, y, s * 3.9, 0.55, 0.45, { color: 0x3c403a, seg: 12 });
    phys.cyl(x0 + 6.6, s * 3.9, 0.6, y, y + 2);
  }
  bench(ctx, 33, y, 6.9, 0); bench(ctx, 55, y, 6.9, 0); bench(ctx, 33, y, -6.9, 0); bench(ctx, 55, y, -6.9, 0);

  // signage over the doors
  ctx.sign('AKELEY HALL OF AFRICAN MAMMALS', x1 - 0.02, y + 5.5, 0, 270, 0.34, { color: '#c9a25e' });
  ctx.view('main', x1 - 3.2, y, 0, 270, 4);
  ctx.view('L3', x1 - 2.2, yM, 0, 270, -6);
  void shade;
}
