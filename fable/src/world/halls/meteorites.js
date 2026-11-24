// Arthur Ross Hall of Meteorites: Ahnighito and the other Cape York irons at the centre,
// ringed by curved walls that carry the hall's three sections.
import * as THREE from 'three';
import { xform } from '../../engine/builder.js';
import { textPanel, picture } from '../../engine/placards.js';
import { blob, pedestal, vitrine, bench } from '../furniture.js';
import { lump } from '../../models/rocks.js';

/** Curved partition built from short straight panels. Angles are atan2(z, x) in radians. */
export function arcWall(ctx, cx, cz, r, a0, a1, y, h, th, color, mat = 'plaster', n) {
  const { geo, phys } = ctx;
  n = n || Math.max(3, Math.round(Math.abs(a1 - a0) * r / 1.1));
  for (let i = 0; i < n; i++) {
    const aa = a0 + (a1 - a0) * i / n, ab = a0 + (a1 - a0) * (i + 1) / n;
    const ax = cx + Math.cos(aa) * r, az = cz + Math.sin(aa) * r, bx = cx + Math.cos(ab) * r, bz = cz + Math.sin(ab) * r;
    const len = Math.hypot(bx - ax, bz - az);
    geo.rbox(mat, (ax + bx) / 2, y, (az + bz) / 2, len + th * 0.25, h, th, Math.atan2(-(bz - az), bx - ax), { color });
    phys.seg(ax, az, bx, bz, th, y, y + h);
  }
}

/** Compass bearing (deg) of the direction (dx, dz). */
const bearing = (dx, dz) => (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360;

export function meteorites(ctx) {
  const { room, geo, phys, lights } = ctx;
  const y = room.y, { x0, x1, z0, z1 } = room;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;

  // ---------------- Ahnighito ----------------
  geo.cyl('pavers', cx, y, cz, 3.6, 0.14, { color: 0x3a3733, seg: 48 });
  geo.cyl('satin', cx, y, cz, 3.7, 0.05, { color: 0x15140f, seg: 48 });
  // six steel posts that (in the real hall) run down through the floor to bedrock
  for (const [dx, dz] of [[-1.05, -0.5], [0, -0.6], [1.05, -0.5], [-1.05, 0.5], [0, 0.6], [1.05, 0.5]]) {
    geo.cyl('metal', cx + dx, y + 0.14, cz + dz, 0.11, 0.5, { color: 0x4a4a4c, seg: 10 });
    geo.cyl('metal', cx + dx, y + 0.14, cz + dz, 0.2, 0.04, { color: 0x38383a, seg: 10 });
  }
  const ah = lump(1.75, 1.08, 0.92, { seed: 3, detail: 5, rough: 0.3, pits: 1.5, flatBottom: 0.86 });
  geo.add('iron', ah, xform(cx, y + 0.6 + 1.08 * 0.86, cz, 0.12), 0x4c3f36);
  blob(geo, cx, y + 0.14, cz, 2.3, 1.4);
  phys.cyl(cx, cz, 1.55, y, y + 3);
  lights.anchor(cx, y + 5.2, cz + 2.5, { color: 0xffd9a6, intensity: 70, dist: 16 });
  lights.anchor(cx - 3, y + 4.6, cz - 3, { color: 0xffe8c8, intensity: 40, dist: 14 });
  ctx.placard({ id: 'ahnighito', star: true, size: 0.92, title: 'Ahnighito', sub: 'Cape York Meteorite · Iron · 34 tons · Greenland',
    text: 'The largest meteorite on display in any museum, and one piece of a 200-ton iron that broke up over Greenland thousands of years ago. For centuries the Inughuit hammered flakes from the Cape York irons to make knives and harpoon points. Robert Peary shipped "the Tent" to New York in 1897; it is so heavy that its supports pass through the floor to the bedrock of Manhattan. Touch it — you are touching the core of a shattered asteroid, 4.5 billion years old.',
    x: cx + 0.4, y, z: cz + 3.0, face: 180, target: [cx, y + 1.5, cz], view: { x: cx + 1.2, y, z: cz + 6.6, yaw: 350, pitch: -2 } });

  // The Woman and The Dog, the two smaller Cape York masses
  const companions = [
    { id: 'thewoman', t: 'The Woman', s: 'Cape York Meteorite · Iron · 3 tons', dx: -4.9, dz: -1.6, r: [0.75, 0.6, 0.55], seed: 9, face: 90,
      text: 'In Inughuit tradition the Cape York irons were a woman, her dog and her tent, hurled from the sky. This mass is ringed with the hammer-stones used to work iron from it.' },
    { id: 'thedog', t: 'The Dog', s: 'Cape York Meteorite · Iron · 880 pounds', dx: -4.4, dz: 2.6, r: [0.42, 0.34, 0.33], seed: 12, face: 90,
      text: 'The smallest of the three masses that Peary removed from Cape York between 1895 and 1897.' },
  ];
  for (const c of companions) {
    const px = cx + c.dx, pz = cz + c.dz;
    const top = pedestal(ctx, px, y, pz, c.r[0] * 2 + 0.5, c.r[2] * 2 + 0.5, 0.45, 0x1c1b19);
    geo.add('iron', lump(c.r[0], c.r[1], c.r[2], { seed: c.seed, detail: 4, rough: 0.3, pits: 1.2, flatBottom: 0.8 }), xform(px, top + c.r[1] * 0.8, pz, 0.5), 0x4c3f36);
    lights.anchor(px, y + 4.4, pz, { color: 0xffe0b4, intensity: 22, dist: 9 });
    ctx.placard({ id: c.id, title: c.t, sub: c.s, text: c.text, x: px + c.r[0] + 0.9, y, z: pz + 0.3, face: c.face, target: [px, y + 1, pz] });
  }

  // ---------------- curved section walls ----------------
  const RW = 9.3, wallH = 3.6, wc = 0x24221f;
  const sections = [
    { a: Math.PI * 0.25, title: 'ORIGINS OF THE SOLAR SYSTEM', text: 'Meteorites are the oldest things you will ever see. The grains inside the most primitive ones condensed from the cloud of gas and dust that became the Sun and planets, 4.568 billion years ago.' },
    { a: Math.PI * 0.75, title: 'BUILDING PLANETS', text: 'Dust clumped into rock, rock into asteroids, and the largest asteroids melted: iron sank to form cores, lighter rock rose to form crusts. Iron meteorites are pieces of those cores.' },
    { a: Math.PI * 1.25, title: 'METEORITE IMPACTS', text: 'Collisions built the planets and have scarred them ever since — from Meteor Crater in Arizona to the Chicxulub impact that ended the age of dinosaurs.' },
    { a: Math.PI * 1.75, title: 'THE CAPE YORK FALL', text: 'Eight large masses, more than 58 tons of iron in all, have been recovered from a strewn field near Cape York in north-west Greenland.' },
  ];
  for (const s of sections) {
    arcWall(ctx, cx, cz, RW, s.a - 0.56, s.a + 0.56, y, wallH, 0.4, wc);
    const ix = cx + Math.cos(s.a) * (RW - 0.21), iz = cz + Math.sin(s.a) * (RW - 0.21);
    textPanel(ctx, { x: ix, y: y + 2.45, z: iz, face: bearing(-Math.cos(s.a), -Math.sin(s.a)), w: 4.2, h: 1.5, heading: s.title, text: s.text, bg: '#1b1a18', fg: '#e8dcc4', headSize: 62, size: 36, font: 'sans', pad: 46 });
  }

  // ---------------- specimens ----------------
  const metal = 0x8a8078;
  const specimens = [
    { id: 'canyondiablo', star: true, t: 'Canyon Diablo', s: 'Iron · 1,400 pounds · Meteor Crater, Arizona', x: x0 + 4.2, z: z0 + 4.4, kind: 'iron', r: [0.55, 0.42, 0.45],
      text: 'A fragment of the 150-foot iron asteroid that blasted out Meteor Crater about 50,000 years ago. The shock of impact turned some of its carbon to diamond.' },
    { id: 'allende', t: 'Allende', s: 'Carbonaceous chondrite · Chihuahua, Mexico · fell 1969', x: x1 - 4.2, z: z0 + 4.4, kind: 'chondrite', r: [0.3, 0.22, 0.26],
      text: 'The white inclusions in this black stone are the first solids to form in the solar system — and they give the solar system its age.' },
    { id: 'esquel', t: 'Esquel', s: 'Pallasite · Chubut, Argentina', x: x1 - 4.2, z: z1 - 4.4, kind: 'pallasite',
      text: 'Golden olivine crystals set in nickel-iron: a slice across the boundary between the metal core and rocky mantle of a vanished asteroid.' },
    { id: 'gibeon', t: 'Gibeon', s: 'Iron · Namibia · etched slice', x: x0 + 4.2, z: z1 - 4.4, kind: 'etched',
      text: 'Acid reveals the Widmanstätten pattern, interlocking crystals of iron and nickel that take millions of years of slow cooling to grow — proof the metal formed deep inside a planetary body.' },
    { id: 'moonrocks', star: true, t: 'Moon Rocks', s: 'Apollo 14, 15 and 17 samples · on loan from NASA', x: cx + 5.4, z: cz - 5.2, kind: 'moon',
      text: 'Three pieces of the Moon collected by Apollo astronauts between 1971 and 1972: a breccia, a basalt and an anorthosite, the pale rock of the lunar highlands.' },
    { id: 'marsmeteorite', t: 'Nakhla', s: 'Martian meteorite · Egypt · fell 1911', x: cx + 5.4, z: cz + 5.2, kind: 'mars',
      text: 'Blasted off Mars by an impact and delivered to Earth: gas trapped in meteorites like this one matches the Martian atmosphere measured by the Viking landers.' },
    { id: 'peekskill', t: 'Peekskill', s: 'Chondrite · New York · fell 9 October 1992', x: cx - 5.4, z: cz + 6.2, kind: 'chondrite', r: [0.2, 0.16, 0.18],
      text: 'Filmed by sixteen spectators at high-school football games as it crossed the sky, this 27-pound stone ended its journey through the boot of a parked Chevrolet Malibu.' },
    { id: 'guffey', t: 'Guffey', s: 'Iron · 682 pounds · Colorado', x: cx - 5.6, z: cz - 6.0, kind: 'iron', r: [0.45, 0.3, 0.3],
      text: 'The largest meteorite ever found in Colorado, discovered by cowboys in 1907.' },
  ];
  specimens.forEach((sp, i) => {
    let top;
    if (sp.kind === 'iron') {
      top = pedestal(ctx, sp.x, y, sp.z, sp.r[0] * 2 + 0.5, sp.r[2] * 2 + 0.5, 0.7, 0x1c1b19);
      geo.add('iron', lump(sp.r[0], sp.r[1], sp.r[2], { seed: i + 20, detail: 4, rough: 0.32, pits: 1.3, flatBottom: 0.8 }), xform(sp.x, top + sp.r[1] * 0.8, sp.z, i), 0x4c4038);
    } else {
      top = vitrine(ctx, sp.x, y, sp.z, 1.3, 1.0, 0.95, { plinth: 0.95 });
      if (sp.kind === 'chondrite') {
        geo.add('rock', lump(sp.r[0], sp.r[1], sp.r[2], { seed: i + 30, detail: 3, rough: 0.22, flatBottom: 0.8 }), xform(sp.x, top + sp.r[1] * 0.8, sp.z, i), 0x1a1918);
      } else if (sp.kind === 'pallasite' || sp.kind === 'etched') {
        // upright polished slice on a little stand
        const paint = sp.kind === 'pallasite'
          ? (g, w, h) => {
            g.fillStyle = '#9a9a98'; g.fillRect(0, 0, w, h);
            for (let k = 0; k < 150; k++) { g.fillStyle = `hsl(${40 + Math.random() * 18},${70 + Math.random() * 20}%,${38 + Math.random() * 22}%)`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 12 + Math.random() * 22, 10 + Math.random() * 16, Math.random() * 3, 0, 6.3); g.fill(); }
          }
          : (g, w, h) => {
            g.fillStyle = '#a8a8a6'; g.fillRect(0, 0, w, h);
            for (let k = 0; k < 500; k++) { const a = [0.3, 1.35, 2.4][k % 3] + (Math.random() - 0.5) * 0.08, x = Math.random() * w, yy = Math.random() * h, l = 40 + Math.random() * 160; g.strokeStyle = `rgba(${k % 2 ? 60 : 230},${k % 2 ? 60 : 230},${k % 2 ? 62 : 228},0.5)`; g.lineWidth = 1 + Math.random() * 3; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + Math.cos(a) * l, yy + Math.sin(a) * l); g.stroke(); }
          };
        geo.box('metal', sp.x - 0.42, top, sp.z - 0.04, sp.x + 0.42, top + 0.62, sp.z + 0.04, { color: 0x6a6a68 });
        picture(ctx, { x: sp.x, y: top + 0.31, z: sp.z + 0.04, face: 180, w: 0.8, h: 0.58, px: 512 }, paint);
        picture(ctx, { x: sp.x, y: top + 0.31, z: sp.z - 0.04, face: 0, w: 0.8, h: 0.58, px: 512 }, paint);
      } else if (sp.kind === 'moon') {
        [[-0.38, 0xb8b6b0, 0.1], [0, 0x3a3a3c, 0.12], [0.38, 0xdcdad4, 0.09]].forEach(([dx, c, r], k) => {
          geo.cyl('satin', sp.x + dx, top, sp.z, 0.13, 0.08, { color: 0x101010, seg: 14 });
          geo.add('rock', lump(r, r * 0.8, r * 0.9, { seed: 40 + k, detail: 2, rough: 0.3 }), xform(sp.x + dx, top + 0.08 + r * 0.7, sp.z), c);
        });
      } else {
        geo.add('rock', lump(0.2, 0.15, 0.17, { seed: 51, detail: 3, rough: 0.25, flatBottom: 0.8 }), xform(sp.x, top + 0.12, sp.z, 1), 0x2c2622);
      }
    }
    lights.anchor(sp.x, y + 4.4, sp.z, { color: 0xffe2b8, intensity: 16, dist: 8 });
    // label on the side nearest the centre of the hall
    const dx = cx - sp.x, dz = cz - sp.z, l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
    const major = Math.abs(ux) > Math.abs(uz);
    const lx = sp.x + (major ? Math.sign(ux) * 1.15 : 0), lz = sp.z + (major ? 0 : Math.sign(uz) * 1.0);
    ctx.placard({ id: sp.id, star: sp.star, title: sp.t, sub: sp.s, text: sp.text, x: lx, y, z: lz, face: major ? (ux > 0 ? 90 : 270) : (uz > 0 ? 180 : 0), target: [sp.x, y + 1.3, sp.z] });
  });
  void metal;

  // impact wall: Meteor Crater
  picture(ctx, { x: x0, y: y + 2.7, z: cz + 1, face: 90, w: 8, h: 3.4 }, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.45); sky.addColorStop(0, '#5a86b8'); sky.addColorStop(1, '#d9c9a8');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b88a5c'; g.fillRect(0, h * 0.42, w, h);
    g.fillStyle = '#8a6444'; g.beginPath(); g.ellipse(w * 0.5, h * 0.7, w * 0.42, h * 0.2, 0, 0, 6.3); g.fill();
    g.fillStyle = '#5c4230'; g.beginPath(); g.ellipse(w * 0.5, h * 0.74, w * 0.33, h * 0.13, 0, 0, 6.3); g.fill();
    g.fillStyle = '#c9a070'; g.beginPath(); g.ellipse(w * 0.5, h * 0.77, w * 0.16, h * 0.05, 0, 0, 6.3); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < 400; i++) g.fillRect(Math.random() * w, h * 0.45 + Math.random() * h * 0.55, 2 + Math.random() * 14, 1.5);
    g.fillStyle = '#f3ead8'; g.font = '600 40px Georgia, serif'; g.fillText('Meteor Crater, Arizona — three-quarters of a mile across', 34, h - 40);
  });
  ctx.sign('ARTHUR ROSS HALL OF METEORITES', cx, y + 5.0, z1 - 0.02, 0, 0.34, { color: '#d8c8a8' });
  bench(ctx, cx - 1.8, y, cz - 5.8, 0, 2.2, 0x2a2622);
  ctx.view('main', x1 - 2.2, y, cz + 2.6, 264, 0);
  void THREE;
}
