// The fourth-floor fossil halls.
import * as THREE from 'three';
import { xform } from '../../engine/builder.js';
import { textPanel } from '../../engine/placards.js';
import { model, geoBounds, hasModel } from '../../models/index.js';
import { mount } from '../mounts.js';
import { vitrine, bench, blob, island, railing } from '../furniture.js';
import { ellipsoid } from '../../models/loft.js';

export const fossilPre = {
  saurischian: (room, { addWindows }) => { addWindows(room, 'n', 7, { sill: 1.5 }); addWindows(room, 's', 7, { sill: 1.5 }); },
  orientation: (room, { addWindows }) => { addWindows(room, 's', 6, { sill: 1.5 }); },
  advmammals: (room, { addWindows }) => { addWindows(room, 's', 9, { sill: 1.5 }); },
  primmammals: (room, { addWindows }) => { addWindows(room, 's', 4, { sill: 1.5 }); addWindows(room, 'e', 4, { sill: 1.5 }); },
  ornithischian: (room, { addWindows }) => { addWindows(room, 'e', 9, { sill: 1.5 }); },
  vertorigins: (room, { addWindows }) => { addWindows(room, 'e', 8, { sill: 1.6 }); addWindows(room, 'w', 8, { sill: 1.6 }); },
};

/** Wall-hung fossil slab (a dark matrix block with pale bone shapes), with an optional small label. */
function slab(ctx, x, y, z, face, w, h, seed = 1) {
  const th = face * Math.PI / 180;
  const { geo } = ctx;
  const rot = Math.PI - th;
  const fx = Math.sin(th), fz = -Math.cos(th);
  geo.rbox('rock', x + fx * 0.05, y - h / 2, z + fz * 0.05, w, h, 0.1, rot, { color: 0x8a7a66 });
  // a few rib / limb shapes
  let sd = seed * 97;
  const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const tx = Math.cos(th), tz = Math.sin(th);
  for (let i = 0; i < 6; i++) {
    const u = (rnd() - 0.5) * w * 0.7, v = (rnd() - 0.5) * h * 0.6, l = 0.2 + rnd() * w * 0.3;
    const g = ellipsoid([0, 0, 0], [l / 2, 0.025 + rnd() * 0.03, 0.03], { seg: 6, rings: 4, rot: [0, 0, (rnd() - 0.5) * 2] });
    geo.add('bone', g, new THREE.Matrix4().makeRotationY(rot).setPosition(x + fx * 0.11 + tx * u, y + v, z + fz * 0.11 + tz * u), 0x3a2c22);
  }
}

/** Cladogram trail: a brass line down the middle of the hall with nodes, as in the real fossil halls. */
function cladePath(ctx, pts, y) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const len = Math.hypot(bx - ax, bz - az), rot = Math.atan2(-(bz - az), bx - ax);
    ctx.geo.rbox('flat', (ax + bx) / 2, y + 0.002, (az + bz) / 2, len, 0.004, 0.22, rot, { color: 0x1c1c1e });
  }
  for (const [x, z] of pts) ctx.geo.cyl('bronze', x, y + 0.002, z, 0.42, 0.006, { color: 0xb08a4a, seg: 20 });
}

// ---------------------------------------------------------------------------
export function orientation(ctx) {
  const { room, geo, phys } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  const zc = 95;
  // The Titanosaur: tail tip just inside the west wall, head out through the east doorway
  const m = model('skeletons', 'titanosaur', {});
  const b = geoBounds(m);
  const L = b.max[0] - b.min[0];
  const ox = (x0 + 1.2) - b.min[0];
  const res = mount(ctx, 'titanosaur', ox, zc, 0, {
    ph: 0.25, trimX: [0.02, Math.min(0.66, (x1 - 3.5 - (x0 + 1.2)) / L)], padZ: 0.5, pcol: 0xe6e0d2,
    label: { id: 'titanosaur', star: true, title: 'The Titanosaur', sub: 'Patagotitan mayorum — Late Cretaceous, about 100 million years ago', side: -1, at: 3, dist: 7.5, lookAt: 6, lookH: 0.7,
      text: 'At 122 feet this cast is too long for its room: the neck and head reach out through the doorway toward the elevators. The animal, a young adult found in Patagonia in 2014, weighed about 70 tons — as much as ten African elephants. The original fossils were too heavy to mount; this skeleton is made from 3-D prints of 84 excavated bones.' },
  });
  void res;
  // a femur you can stand beside (cast of the 8-foot thigh bone)
  const fx = x0 + 6.5, fz = z0 + 3.2;
  island(ctx, fx - 1.6, fz - 0.6, fx + 1.6, fz + 0.6, y, 0.35, 0x2a2826);
  geo.add('bone', ellipsoid([0, 0, 0], [1.22, 0.2, 0.2], { seg: 12, rings: 8 }), xform(fx, y + 0.62, fz), 0x4a3a2c);
  geo.add('bone', ellipsoid([0, 0, 0], [0.3, 0.3, 0.32]), xform(fx - 1.1, y + 0.66, fz), 0x4a3a2c);
  geo.add('bone', ellipsoid([0, 0, 0], [0.32, 0.28, 0.34]), xform(fx + 1.1, y + 0.64, fz), 0x4a3a2c);
  ctx.placard({ title: 'Titanosaur Femur', sub: 'Original fossil thigh bone, 8 feet long', text: 'One of the original bones from the quarry at La Flecha ranch, Chubut Province, Argentina.', x: fx, y, z: fz + 1.2, face: 180, target: [fx, y + 0.7, fz] });
  // orientation film corner
  textPanel(ctx, { x: x1 - 9, y: y + 3.1, z: z0, face: 180, w: 6.4, h: 3.2, heading: 'Start here', text: 'The fossil halls are arranged like a family tree. Follow the black line on the floor: each branching point marks an evolutionary novelty — jaws, four limbs, the amniote egg — shared by everything beyond it.', bg: '#1d1d1f', fg: '#efe9dc', size: 44, headSize: 80, align: 'left' });
  bench(ctx, x1 - 9, y, z0 + 4.2, 0, 3); bench(ctx, x1 - 9, y, z0 + 6, 0, 3);
  ctx.sign('WALLACH ORIENTATION CENTER', 0, y + 5.3, z0 + 0.02, 180, 0.34, { color: '#5a5040' });
  cladePath(ctx, [[0, z0 + 0.5], [0, z0 + 4], [x1 - 4, z0 + 4], [x1 - 0.5, zc - 2.2]], y);
  ctx.view('main', x1 - 4.5, y, z0 + 5.5, 248, 14);
  void phys;
}

// ---------------------------------------------------------------------------
export function saurischian(ctx) {
  const { room, geo } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  mount(ctx, 'apatosaurus', 41.5, -6.6, 0, { center: true, pcol: 0xd9d0bc,
    label: { id: 'apatosaurus', star: true, title: 'Apatosaurus', sub: 'Apatosaurus excelsus — Late Jurassic, 150 million years ago', side: 1, at: 2, dist: 9, lookH: 0.6,
      text: 'When it went on view in 1905 this was the first sauropod skeleton ever mounted, and for decades it wore the wrong head. In the 1990s it was rebuilt with the correct skull, four more neck vertebrae and its tail lifted off the ground, the way trackways show sauropods really walked.' } });
  mount(ctx, 'tyrannosaurus', 43, 6.4, -6, { center: true, pcol: 0xd9d0bc,
    label: { id: 'trex', star: true, title: 'Tyrannosaurus rex', sub: 'AMNH 5027 — Hell Creek Formation, Montana, 66 million years ago', side: -1, at: 3.2, dist: 6.5, lookAt: 2.5, lookH: 0.62,
      text: 'Found by Barnum Brown in 1908 and made almost entirely of real fossil bone, this is one of the most complete T. rex skeletons known — and the one that defined the animal for the world. For eighty years it stood upright like a kangaroo; since 1995 it has stalked with its back level and its tail in the air.' } });
  mount(ctx, 'allosaurus', 59.5, 7.2, 196, { center: true, opts: { pose: 'feeding' }, pcol: 0xd9d0bc,
    label: { id: 'allosaurus-feeding', title: 'Allosaurus', sub: 'Allosaurus fragilis — feeding on an Apatosaurus carcass', side: 1, dist: 4.5,
      text: 'Mounted in 1908 crouching over sauropod bones that bear real tooth marks: the first dinosaur skeleton posed to show behaviour rather than just anatomy.' } });
  // Glen Rose trackway behind the Apatosaurus
  island(ctx, 28, z0 + 0.2, 55, z0 + 2.4, y, 0.25, 0x8a7a68, 'rock', 0x9a8a76);
  for (let i = 0; i < 12; i++) {
    blob(geo, 29.5 + i * 2.1, y + 0.25, z0 + 0.9 + (i % 2) * 0.9, 0.5, 0.42, 20);
    if (i % 2) blob(geo, 30.2 + i * 2.1, y + 0.25, z0 + 1.2, 0.3, 0.22, 80);
  }
  ctx.placard({ title: 'Glen Rose Trackway', sub: 'Paluxy River, Texas — 107 million years old', text: 'Footprints of a sauropod followed by a three-toed theropod, excavated by Roland T. Bird in 1938 and set behind the Apatosaurus as if it had just walked by.', x: 56.2, y, z: z0 + 2.9, face: 180, target: [42, y + 0.3, z0 + 1.3] });
  // the small theropods and the road to birds
  mount(ctx, 'deinonychus', 27.5, 8.6, 20, { center: true, ph: 0.3, pcol: 0xd9d0bc, label: { title: 'Deinonychus', sub: 'Deinonychus antirrhopus — Early Cretaceous', side: -1, dist: 3.2, text: 'The agile, sickle-clawed hunter whose discovery in 1964 revived the idea that birds are living dinosaurs.' } });
  const vy = vitrine(ctx, 62.5, y, -8.6, 2.6, 1.6, 1.3, { plinth: 0.8 });
  geo.addGeo(model('skeletons', 'oviraptor', {}), xform(62.5, vy, -8.6, 0.3, 0.8));
  ctx.placard({ title: 'Oviraptorid on its Nest', sub: 'Citipati osmolskae — Gobi Desert, Mongolia', text: 'Found by a Museum expedition in 1993: a dinosaur that died brooding its eggs like a bird, arms spread over the clutch.', x: 62.5, y, z: -7.2, face: 180, target: [62.5, y + 1.3, -8.6] });
  const vy2 = vitrine(ctx, 32, y, 10.6, 2.4, 1.2, 1.2, { plinth: 0.85 });
  geo.addGeo(model('skeletons', 'velociraptor', {}), xform(32, vy2, 10.6, 0.1, 0.9));
  ctx.placard({ title: 'Velociraptor', sub: 'Velociraptor mongoliensis — Gobi Desert', text: 'Turkey-sized and feathered — quill knobs on the forearm prove it. The first specimen was found by the Museum\'s Central Asiatic Expedition in 1923.', x: 32, y, z: 9.4, face: 0, target: [32, y + 1.4, 10.6] });
  const vy3 = vitrine(ctx, 24.6, y, -9.4, 1.2, 3.2, 1.2, { plinth: 0.85 });
  geo.addGeo(model('skeletons', 'coelophysis', {}), xform(24.6, vy3, -9.4, Math.PI / 2, 0.85));
  ctx.placard({ title: 'Coelophysis', sub: 'Coelophysis bauri — Late Triassic, Ghost Ranch, New Mexico', text: 'One of the earliest well-known dinosaurs, found by the hundred in a single quarry.', x: 26.1, y, z: -9.4, face: 90, target: [24.6, y + 1.4, -9.4] });
  for (const xx of [36, 48]) slab(ctx, xx, y + 2.6, z1, 0, 2.4, 1.4, xx);
  cladePath(ctx, [[x0 + 0.5, 0], [30, 0], [36, 0.6], [50, 0.2], [x1 - 0.5, 0]], y);
  ctx.sign('HALL OF SAURISCHIAN DINOSAURS', x1 - 0.02, y + 5.4, 0, 270, 0.34, { color: '#5a5040' });
  ctx.view('main', x1 - 3, y, 0.5, 270, 8);
}

// ---------------------------------------------------------------------------
export function ornithischian(ctx) {
  const { room } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  const cx = (x0 + x1) / 2;
  mount(ctx, 'triceratops', cx - 0.5, 31.5, 82, { center: true, pcol: 0xd9d0bc,
    label: { id: 'triceratops', star: true, title: 'Triceratops', sub: 'Triceratops horridus — Late Cretaceous, 66 million years ago', side: 1, dist: 5, lookAt: 1.5,
      text: 'A composite of several animals collected in Wyoming and Montana. One of the last non-avian dinosaurs, it shared its world with Tyrannosaurus rex — whose bite marks are known from Triceratops frills.' } });
  mount(ctx, 'stegosaurus', cx + 0.5, 44.5, 96, { center: true, pcol: 0xd9d0bc,
    label: { id: 'stegosaurus', star: true, title: 'Stegosaurus', sub: 'Stegosaurus stenops — Late Jurassic, 150 million years ago', side: -1, dist: 5,
      text: 'Seventeen plates in two staggered rows and four tail spikes. The plates were laced with blood vessels and may have been for display; the spikes were certainly weapons — an Allosaurus vertebra has been found with a hole that fits one.' } });
  mount(ctx, 'anatotitan', cx - 3.2, 57.5, 84, { center: true, opts: { pose: 'stand' }, pcol: 0xd9d0bc,
    label: { id: 'anatotitan', title: 'Anatotitan', sub: 'Anatotitan copei — two duck-billed dinosaurs', side: -1, dist: 5.5,
      text: 'Mounted in 1908 as a pair, one browsing and one alert. Duck-bills chewed with hundreds of teeth packed into grinding batteries.' } });
  mount(ctx, 'anatotitan', cx + 3.4, 58.5, 100, { center: true, opts: { pose: 'graze' }, pcol: 0xd9d0bc });
  mount(ctx, 'corythosaurus', cx - 3.6, 69.5, 78, { center: true, pcol: 0xd9d0bc,
    label: { title: 'Corythosaurus', sub: 'Corythosaurus casuarius — Late Cretaceous, Alberta', side: -1, dist: 4.5,
      text: 'The hollow, helmet-shaped crest contained looping nasal passages that probably worked as a resonating chamber.' } });
  // the dinosaur "mummy" in a floor case
  const vy = vitrine(ctx, x1 - 3.4, y, 68.5, 2.6, 4.6, 0.9, { plinth: 0.55, deck: 0x6a5c4a });
  ctx.geo.add('rock', ellipsoid([0, 0.14, 0], [0.9, 0.2, 1.9], { seg: 14, rings: 8 }), xform(x1 - 3.4, vy, 68.5), 0x5a4a3a);
  ctx.geo.add('rock', ellipsoid([0.3, 0.2, 1.3], [0.35, 0.16, 0.6]), xform(x1 - 3.4, vy, 68.5), 0x5a4a3a);
  ctx.placard({ id: 'mummy', title: 'Dinosaur "Mummy"', sub: 'Edmontosaurus annectens — Wyoming, 1908', text: 'Not a true mummy but a fossil with the impression of the skin preserved over much of the body — one of the greatest dinosaur discoveries ever made, by the Sternberg family.', x: x1 - 5.4, y, z: 68.5, face: 270, target: [x1 - 3.4, y + 0.8, 68.5] });
  for (const zz of [30, 42, 54, 66]) slab(ctx, x0, y + 2.6, zz, 90, 2.4, 1.4, zz);
  cladePath(ctx, [[x0 + 0.5, 25], [x0 + 3.5, 25], [x0 + 3.5, 50], [cx, 73], [cx, z1 - 0.5]], y);
  ctx.sign('HALL OF ORNITHISCHIAN DINOSAURS', x0 + 0.02, y + 5.2, 25, 90, 0.3, { color: '#5a5040' });
  ctx.view('main', x0 + 3, y, 24, 150, 6);
}

// ---------------------------------------------------------------------------
export function vertorigins(ctx) {
  const { room, geo } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  mount(ctx, 'megalodon_jaw', 0, 75.5, -90, { center: true, ph: 0.2, pcol: 0x2a2826,
    label: { id: 'megalodon', star: true, title: 'Megalodon Jaw', sub: 'Carcharocles megalodon — reconstructed jaws', side: -1, dist: 4.5, lookH: 0.5,
      text: 'The largest shark that ever lived, known almost entirely from teeth up to seven inches long. These reconstructed jaws hang where visitors have posed inside them since 1909.' } });
  mount(ctx, 'dunkleosteus', -6.2, 63, -60, { center: true, ph: 0.2, pcol: 0x2a2826,
    label: { id: 'dunkleosteus', title: 'Dunkleosteus', sub: 'Dunkleosteus terrelli — Late Devonian, 360 million years ago', side: -1, dist: 3.4, lookH: 0.5,
      text: 'An armoured placoderm some 20 feet long. It had no teeth: the self-sharpening bony plates of its jaws sheared like bolt cutters.' } });
  // pterosaur overhead
  geo.addGeo(model('skeletons', 'pteranodon', {}), xform(0, y + 3.9, 50, 0.4, 1));
  ctx.placard({ id: 'pteranodon', title: 'Pteranodon', sub: 'Pteranodon longiceps — Late Cretaceous, Kansas', text: 'Overhead: a flying reptile with a 23-foot wingspan that soared over the inland sea covering the middle of North America.', x: 3.4, y, z: 50, face: 180, target: [0, y + 4.4, 50], view: { x: 4, y, z: 55, yaw: 325, pitch: 34 } });
  if (hasModel('skeletons', 'plesiosaur')) {
    geo.addGeo(model('skeletons', 'plesiosaur', {}), xform(-2, y + 3.6, 38, -0.3, 1));
    ctx.placard({ title: 'Plesiosaur', sub: 'Long-necked marine reptile', text: 'Plesiosaurs "flew" underwater on four wing-like paddles.', x: 3.4, y, z: 38, face: 180, target: [-2, y + 4, 38] });
  }
  if (hasModel('skeletons', 'mosasaur')) {
    geo.addGeo(model('skeletons', 'mosasaur', {}), xform(1, y + 3.4, 66, 0.5, 1));
  }
  // giant side-necked turtle shell
  island(ctx, 4.2, 40.5, 8.6, 45.5, y, 0.3, 0x2a2826);
  geo.add('bone', ellipsoid([0, 0, 0], [1.5, 0.55, 2.0], { seg: 16, rings: 8 }), xform(6.4, y + 0.55, 43), 0x4a3c2e);
  ctx.placard({ title: 'Stupendemys', sub: 'Stupendemys geographicus — Miocene, Venezuela', text: 'The shell of the largest freshwater turtle known, nearly eleven feet long.', x: 3.4, y, z: 43, face: 270, target: [6.4, y + 0.8, 43] });
  for (const zz of [36, 46, 56, 70]) { slab(ctx, x0, y + 2.4, zz + 3, 90, 2.2, 1.3, zz); slab(ctx, x1, y + 2.4, zz, 270, 2.2, 1.3, zz + 9); }
  cladePath(ctx, [[0, z1 - 0.5], [0, 79], [3, 72], [3, 58], [0, 52], [0, z0 + 0.5]], y);
  ctx.sign('HALL OF VERTEBRATE ORIGINS', 0, y + 5.1, z1 - 0.02, 0, 0.32, { color: '#5a5040' });
  ctx.view('main', 0.6, y, z1 - 2.5, 0, 6);
}

// ---------------------------------------------------------------------------
export function primmammals(ctx) {
  const { room } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  mount(ctx, 'dimetrodon', x0 + 7.5, z0 + 7, 15, { center: true, pcol: 0xd9d0bc,
    label: { id: 'dimetrodon', title: 'Dimetrodon', sub: 'Dimetrodon limbatus — Early Permian, 280 million years ago', side: 1, dist: 3.6,
      text: 'Not a dinosaur: the sail-backed Dimetrodon stands on the line that led to mammals, and is more closely related to you than to any reptile.' } });
  mount(ctx, 'megatherium', x1 - 6.5, z0 + 12, 200, { center: true, pcol: 0xd9d0bc,
    label: { id: 'megatherium', title: 'Giant Ground Sloth', sub: 'Lestodon / Megatherium — Pleistocene, South America', side: 1, dist: 4.5, lookH: 0.6,
      text: 'Elephant-sized relatives of the tree sloths reared up to pull down branches. They reached North America when the Isthmus of Panama formed.' } });
  mount(ctx, 'glyptodon', x0 + 9, z1 - 7.5, -10, { center: true, pcol: 0xd9d0bc,
    label: { id: 'glyptodon', title: 'Glyptodont', sub: 'Panochthus frenzelianus — Pleistocene, Argentina', side: -1, dist: 3.6,
      text: 'A car-sized relative of the armadillos, armoured with a rigid dome of more than a thousand bony plates.' } });
  ctx.sign('ASTOR TURRET', x1 - 0.02, y + 4.6, z1 - 3, 270, 0.26, { color: '#5a5040' });
  bench(ctx, x1 - 3, y, z1 - 3, 45, 2);
  cladePath(ctx, [[(x0 + x1) / 2, z0 + 0.5], [(x0 + x1) / 2, z0 + 6], [x0 + 4, z1 - 14], [x0 + 0.5, 95]], y);
  ctx.sign('HALL OF PRIMITIVE MAMMALS', (x0 + x1) / 2, y + 5.2, z0 + 0.02, 180, 0.3, { color: '#5a5040' });
  ctx.view('main', (x0 + x1) / 2, y, z0 + 2.5, 180, 4);
}

// ---------------------------------------------------------------------------
export function advmammals(ctx) {
  const { room, geo } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  mount(ctx, 'mammoth', 47, 95.5, 186, { center: true, pcol: 0xd9d0bc,
    label: { id: 'mammoth', star: true, title: 'Mammoth', sub: 'Mammuthus — Pleistocene, Indiana', side: 1, dist: 5.5, lookAt: -1, lookH: 0.6,
      text: 'A southern relative of the woolly mammoth, standing thirteen feet at the shoulder beneath tusks that curve through most of a circle. Mammoths were true elephants; the last of them died only 4,000 years ago.' } });
  mount(ctx, 'mastodon', 60.5, 90.5, 170, { center: true, pcol: 0xd9d0bc,
    label: { id: 'mastodon', title: 'American Mastodon', sub: 'Mammut americanum — the Warren Mastodon, Newburgh, New York', side: -1, dist: 4.5,
      text: 'Dug from a bog in the Hudson Valley in 1845 and among the most complete mastodons ever found. Stockier than a mammoth, with cone-cusped teeth for browsing trees.' } });
  mount(ctx, 'brontops', 34, 100, 8, { center: true, pcol: 0xd9d0bc,
    label: { title: 'Brontops', sub: 'Megacerops — Late Eocene, South Dakota', side: -1, dist: 4,
      text: 'A brontothere, or "thunder beast": a rhino-like relative of horses with a forked horn of bone.' } });
  mount(ctx, 'megaloceros', 33, 89.5, 12, { center: true, pcol: 0xd9d0bc,
    label: { title: 'Irish Elk', sub: 'Megaloceros giganteus — Pleistocene, Ireland', side: 1, dist: 4,
      text: 'The largest deer that ever lived, with antlers spanning twelve feet and weighing ninety pounds, shed and regrown every year.' } });
  mount(ctx, 'smilodon', 68, 100, 190, { center: true, pcol: 0xd9d0bc,
    label: { id: 'smilodon', title: 'Sabre-toothed Cat', sub: 'Smilodon — Rancho La Brea, California', side: -1, dist: 3,
      text: 'Its seven-inch canines were surprisingly fragile; Smilodon killed with a precise bite to the throat of prey already wrestled to the ground.' } });
  const vy = vitrine(ctx, 69, y, 88.8, 2.0, 1.4, 1.1, { plinth: 0.9 });
  geo.addGeo(model('skeletons', 'andrewsarchus_skull', {}), xform(69, vy - 0.9, 88.8, Math.PI, 1));
  ctx.placard({ title: 'Andrewsarchus', sub: 'Andrewsarchus mongoliensis — Eocene, Inner Mongolia', text: 'Known from this single 33-inch skull found in 1923: perhaps the largest meat-eating land mammal ever, and a distant cousin of hippos and whales.', x: 69, y, z: 90.2, face: 0, target: [69, y + 1.4, 88.8] });
  ctx.placard({ title: 'The Titanosaur\'s Head', sub: 'Look up', text: 'The head of the 122-foot Titanosaur reaches out of the Orientation Center next door, 19 feet above the floor.', x: x0 + 3.2, y, z: 99.6, face: 0, list: false, target: [x0 + 1.5, y + 4.8, 95] });
  cladePath(ctx, [[x0 + 0.5, 93], [x0 + 6, 94.5], [40, 94.5], [54, 95.6], [x1 - 0.5, 95]], y);
  ctx.sign('MILSTEIN HALL OF ADVANCED MAMMALS', (x0 + x1) / 2, y + 5.2, z0 + 0.02, 180, 0.32, { color: '#5a5040' });
  ctx.view('main', x1 - 4, y, 95, 270, 5);
  void railing;
}

export function landing4(ctx) {
  const { room } = ctx;
  ctx.sign('DINO STORE', room.x1 - 0.02, room.y + 4.3, 4.6, 270, 0.26, { color: '#5a5040' });
  ctx.sign('FOSSIL HALLS', room.x0 + 0.02, room.y + 4.8, 0, 90, 0.34, { color: '#5a5040' });
}
