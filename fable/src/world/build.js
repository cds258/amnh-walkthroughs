// Assembles the whole museum: generic shells, doorways, stairs, elevators, then each hall's contents.
import * as THREE from 'three';
import { Geo } from '../engine/builder.js';
import { Physics } from '../engine/physics.js';
import { placard, sign } from '../engine/placards.js';
import { ROOMS, PORTALS, ELEVATORS, FLOOR_Y, ROOM_BY_ID, floorOfY } from './plan.js';
import { buildRoom, buildPortal, buildStair, buildElevator, addWindows, pruneWindows, STYLES } from './rooms.js';
import { HALLS, PRE } from './halls/index.js';
import { buildExterior } from './exterior.js';

export async function buildWorld(scene, lights, onProgress) {
  const phys = new Physics();
  const root = new THREE.Group();
  root.name = 'museum';
  scene.add(root);
  const W = { phys, lights, portals: PORTALS, rooms: ROOMS, interact: [], scene, root, shellCol: 0xc7b3a2 };

  for (const room of ROOMS) {
    room.geo = new Geo();
    room.group = new THREE.Group();
    room.group.name = room.id;
    root.add(room.group);
    room.views = {};
  }
  // pre-hooks may add windows / openings / holes before shells are generated
  for (const room of ROOMS) if (PRE[room.id]) PRE[room.id](room, { addWindows, W });
  for (const room of ROOMS) pruneWindows(room, PORTALS);

  const tick = () => new Promise((r) => setTimeout(r, 0));
  let done = 0;
  const total = ROOMS.length * 2 + 2;
  const step = async (label) => { done++; if (onProgress) onProgress(done / total, label); await tick(); };

  // shells
  for (const room of ROOMS) {
    buildRoom(room, W);
    if (room.stair) {
      buildStair(room, W);
      room.geo.ceil('plaster', room.x0, room.z0, room.x1, room.z1, room.y + room.h, { color: room.st.ceil });
    }
    await step('Raising walls');
  }
  // doorways
  const pg = new Geo();
  for (const p of PORTALS) {
    // doorway trim / colours follow the darker of the two rooms it joins
    const rs = roomsOfPortal(p);
    p.rooms = rs.map((r) => r.id);
    const dark = rs.find((r) => ['dim', 'dark', 'ocean', 'space'].includes(r.st.mood));
    const ref = dark || rs[0];
    if (ref) { p.wallCol ??= ref.st.wallCol; p.trim ??= ref.st.trim; }
    if (!p.trims && p.sideRooms) p.trims = p.sideRooms.map((r) => (r ? r.st.trim : (ref ? ref.st.trim : 0x6f6252)));
    buildPortal(p, pg, W);
  }
  const pgroup = new THREE.Group();
  pgroup.name = 'portals';
  root.add(pgroup);
  pg.build(pgroup, { name: 'portals' });

  // elevators
  const eg = new Geo();
  for (const e of ELEVATORS) for (const f of e.floors) W.interact.push(buildElevator(eg, { ...e, ...((e.at && e.at[f]) || {}) }, f));
  eg.build(pgroup, { name: 'elevators' });
  await step('Hanging doors');

  // hall contents
  for (const room of ROOMS) {
    const fn = HALLS[room.id];
    const ctx = {
      room, geo: room.geo, group: room.group, phys, lights, W, F: FLOOR_Y,
      placard: (o) => placard(ctx, o),
      sign: (...a) => sign(ctx, ...a),
      view: (name, x, y, z, yaw, pitch = 0) => { room.views[name] = { x, y, z, yaw, pitch }; },
    };
    if (fn) {
      try { fn(ctx); } catch (err) { console.error('hall failed', room.id, err); }
    }
    room.geo.build(room.group, { name: room.id });
    // bounds for visibility culling
    const box = new THREE.Box3();
    room.group.updateMatrixWorld(true);
    box.setFromObject(room.group);
    if (box.isEmpty()) box.set(new THREE.Vector3(room.x0, room.y, room.z0), new THREE.Vector3(room.x1, room.y + room.h, room.z1));
    room.bbox = box;
    if (!room.views.main) {
      const w = room.x1 - room.x0, d = room.z1 - room.z0;
      room.views.main = { x: (room.x0 + room.x1) / 2, y: room.y, z: (room.z0 + room.z1) / 2, yaw: w > d ? 90 : 0, pitch: 0 };
    }
    await step('Installing ' + (room.short || room.name));
  }

  buildExterior(W);
  phys.finalize();
  await step('Opening the doors');

  W.roomAt = (x, y, z) => roomAt(x, y, z);
  W.adjacent = (room) => {
    const out = new Set();
    for (const p of PORTALS) if (p.rooms && p.rooms.includes(room.id)) for (const id of p.rooms) if (id !== room.id) out.add(id);
    return [...out].map((id) => ROOM_BY_ID[id]);
  };
  return W;
}

function roomsOfPortal(p) {
  const out = [];
  const cx = (p.x0 + p.x1) / 2, cz = (p.z0 + p.z1) / 2;
  const probes = p.axis === 'x' ? [[p.x0 - 0.3, cz], [p.x1 + 0.3, cz]] : [[cx, p.z0 - 0.3], [cx, p.z1 + 0.3]];
  p.sideRooms = [];
  for (const [x, z] of probes) {
    const r = roomAt(x, p.y + 0.5, z);
    p.sideRooms.push(r || null);
    if (r) out.push(r);
  }
  return out;
}

/** The room containing a point (feet position). Prefers the smallest room that contains it. */
export function roomAt(x, y, z) {
  let best = null, bestA = Infinity;
  for (const r of ROOMS) {
    if (x < r.x0 - 0.5 || x > r.x1 + 0.5 || z < r.z0 - 0.5 || z > r.z1 + 0.5) continue;
    if (y < r.y - 1.3 || y > r.y + r.h - 0.2) continue;
    const a = (r.x1 - r.x0) * (r.z1 - r.z0) * (r.tall ? 4 : 1) * (r.stair ? 0.01 : 1);
    const inside = x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
    const score = a * (inside ? 1 : 50);
    if (score < bestA) { best = r; bestA = score; }
  }
  return best;
}

export { STYLES, floorOfY };
