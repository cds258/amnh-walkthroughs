import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Lights } from './engine/lights.js';
import { Player } from './engine/player.js';
import { setMaxAnisotropy } from './engine/textures.js';
import { EXHIBITS, exhibitById } from './engine/placards.js';
import { buildWorld, roomAt } from './world/build.js';
import { ROOMS, ROOM_BY_ID, FLOOR_Y, floorOfY } from './world/plan.js';
import { UI } from './ui.js';
import { loadModelLibs } from './models/index.js';

const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfc6b8);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.08, 700);
const lights = new Lights(scene);
const ui = new UI();

let W = null, player = null;
let curRoom = null;
const VIS = 150;

const hopCache = new Map();
/** Rooms reachable from `room` through at most `n` doorways (what can possibly be seen from inside it). */
function withinHops(room, n = 3) {
  let set = hopCache.get(room.id);
  if (set) return set;
  set = new Set([room.id]);
  let frontier = [room];
  for (let i = 0; i < n; i++) {
    const next = [];
    for (const r of frontier) for (const a of W.adjacent(r)) if (a && !set.has(a.id)) { set.add(a.id); next.push(a); }
    frontier = next;
  }
  hopCache.set(room.id, set);
  return set;
}

function updateVisibility(p) {
  let here = W && W.adjacent && !(player && player.fly) ? roomAt(p.x, p.y - 1.5, p.z) : null;
  if (!here && W && W.adjacent && !(player && player.fly) && p.x > 101) here = ROOM_BY_ID.rotunda; // out on the Central Park West steps
  const near = here ? withinHops(here) : null;
  for (const r of ROOMS) {
    const b = r.bbox;
    if (!b) continue;
    const dx = Math.max(b.min.x - p.x, 0, p.x - b.max.x);
    const dz = Math.max(b.min.z - p.z, 0, p.z - b.max.z);
    const dy = Math.max(b.min.y - p.y, 0, p.y - b.max.y);
    const d = Math.hypot(dx, dz);
    // rooms on other storeys only matter when close by (seen across atria / through floor openings)
    let vis = d < VIS && (dy < 3 || d < 55 || r.tall);
    if (vis && near && !near.has(r.id)) vis = false;
    r.group.visible = vis;
  }
}

function setRoom(r, snap) {
  if (r === curRoom) return;
  curRoom = r;
  if (r) lights.setMood(r.moodOverride || r.st.mood);
  else lights.setMood('outside');
  if (snap) lights.snap(camera);
  ui.setRoom(r, player ? floorOfY(player.pos.y) : 1);
}

function goView(v, snap = true) {
  player.teleport(v.x, v.y, v.z, v.yaw, v.pitch || 0);
  const r = roomAt(player.pos.x, player.pos.y, player.pos.z);
  curRoom = undefined;
  updateVisibility(camera.position);
  setRoom(r, snap);
  if (snap) lights.snap(camera);
}

/** Render a small picture from a viewpoint (used for exhibit cards). */
const snapRT = new THREE.WebGLRenderTarget(480, 300, { samples: 4 });
const snapCam = new THREE.PerspectiveCamera(60, 480 / 300, 0.08, 700);
function snapshot(v) {
  const keepMood = lights.mood;
  snapCam.position.set(v.x, v.y + 1.66, v.z);
  snapCam.rotation.set((v.pitch || 0) * Math.PI / 180, -v.yaw * Math.PI / 180, 0, 'YXZ');
  snapCam.updateMatrixWorld(true);
  const r = roomAt(v.x, v.y, v.z);
  lights.setMood(r ? (r.moodOverride || r.st.mood) : 'outside');
  lights.snap(snapCam);
  updateVisibility(snapCam.position);
  if (W.sky) W.sky.position.copy(snapCam.position);
  renderer.setRenderTarget(snapRT);
  renderer.render(scene, snapCam);
  const buf = new Uint8Array(480 * 300 * 4);
  renderer.readRenderTargetPixels(snapRT, 0, 0, 480, 300, buf);
  renderer.setRenderTarget(null);
  const c = document.createElement('canvas');
  c.width = 480; c.height = 300;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(480, 300);
  for (let y = 0; y < 300; y++) img.data.set(buf.subarray((299 - y) * 480 * 4, (300 - y) * 480 * 4), y * 480 * 4);
  ctx.putImageData(img, 0, 0);
  // restore the visitor's own lighting
  lights.setMood(keepMood === lights.mood ? keepMood : keepMood);
  lights.mood = keepMood;
  lights.snap(camera);
  updateVisibility(camera.position);
  return c.toDataURL('image/jpeg', 0.85);
}

const _dir = new THREE.Vector3(), _to = new THREE.Vector3();
function findFocus() {
  // nearest exhibit / interactable the visitor is looking at
  camera.getWorldDirection(_dir);
  const p = camera.position;
  let best = null, bestS = 0.0;
  const test = (pos, obj, range, kind) => {
    _to.set(pos[0] - p.x, pos[1] - p.y, pos[2] - p.z);
    const d = _to.length();
    if (d > range) return;
    const dot = _to.multiplyScalar(1 / d).dot(_dir);
    if (dot < 0.86) return;
    const s = dot * 2 - d / range;
    if (s > bestS) { bestS = s; best = { kind, obj, d }; }
  };
  for (const e of EXHIBITS) {
    if (Math.abs(e.pos[1] - p.y) > 9) continue;
    test(e.pos, e, 5.5, 'exhibit');
    test(e.target, e, 16, 'exhibit');
  }
  for (const it of W.interact) test(it.pos, it, 3.6, 'interact');
  return best;
}

async function start() {
  ui.loading(0, 'Surveying the site');
  await loadModelLibs();
  W = await buildWorld(scene, lights, (f, label) => ui.loading(f, label));
  player = new Player(camera, W.phys, canvas);
  ui.init({
    W, player, rooms: ROOMS, exhibits: EXHIBITS, goView, snapshot, renderer, scene, camera,
    photo: () => { renderer.render(scene, camera); return canvas.toDataURL('image/png'); },
  });
  const s = ROOM_BY_ID.rotunda.views.entry || ROOM_BY_ID.rotunda.views.main;
  goView(s, true);
  ui.ready();

  window.AMNH = {
    W, player, lights, scene, camera, renderer, ROOMS, EXHIBITS, ui, THREE,
    tp: (x, y, z, yaw = 0, pitch = 0) => goView({ x, y, z, yaw, pitch }),
    goto: (id, view = 'main') => {
      const r = ROOM_BY_ID[id];
      if (r) return goView(r.views[view] || r.views.main);
      const e = exhibitById(id);
      if (e) return goView(e.view);
      throw new Error('no such room/exhibit ' + id);
    },
    stats: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures }),
    ready: true,
  };

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    player.enabled = !ui.blocking();
    player.update(dt);
    const r = roomAt(player.pos.x, player.pos.y, player.pos.z);
    setRoom(r, false);
    lights.update(dt, camera);
    acc += dt;
    if (acc > 0.15) {
      acc = 0;
      updateVisibility(camera.position);
      ui.setFocus(findFocus());
      ui.tick(r, floorOfY(player.pos.y));
    }
    if (W.sky) W.sky.position.copy(camera.position);
    if (W.animate) for (const f of W.animate) f(now / 1000, dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

start().catch((e) => {
  console.error(e);
  ui.loading(0, 'Something went wrong: ' + e.message);
});

export { FLOOR_Y };
