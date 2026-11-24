// Model viewer for developing src/models/* libraries.
// URL: /viewer.html?lib=animals&name=lion[&opts={...json}][&dio=1][&az=..&el=..]
// Renders a triptych: side view | three-quarter view | front view, on a 1 m grid with a 1.8 m human marker.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Geo } from './engine/builder.js';

const q = new URLSearchParams(location.search);
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8d9299);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;
scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 1.3));
const sun = new THREE.DirectionalLight(0xfff2dd, 1.6);
sun.position.set(3, 6, 4);
scene.add(sun);
const holder = new THREE.Group();
scene.add(holder);
const deco = new THREE.Group();
scene.add(deco);

let box = new THREE.Box3();
async function setModel(lib, name, opts) {
  holder.clear(); deco.clear();
  const mod = await import(/* @vite-ignore */ `./models/${lib}.js`);
  const t0 = performance.now();
  const g = mod.build(name, opts || {});
  if (!(g instanceof Geo)) throw new Error('build() must return a Geo');
  const verts = g.vertexCount;
  const rename = q.get('dio') ? { skin: 'dioskin', flat: 'dio', flat_ds: 'dio_ds', skin_ds: 'dio_ds' } : null;
  const gg = new Geo();
  gg.addGeo(g, null, rename);
  gg.build(holder);
  box = new THREE.Box3().setFromObject(holder);
  const size = box.getSize(new THREE.Vector3());
  // ground grid sized to the model, 1 m cells
  const span = Math.max(4, Math.ceil(Math.max(size.x, size.z) * 1.6 / 2) * 2);
  const grid = new THREE.GridHelper(span, span, 0x333333, 0x6f747b);
  deco.add(grid);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(span, span), new THREE.MeshStandardMaterial({ color: 0x9a9fa6, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.002;
  deco.add(ground);
  // 1.8 m human marker beside the model
  const man = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.8, 0.25), new THREE.MeshStandardMaterial({ color: 0xd9552b }));
  man.position.set(box.min.x - 0.8, 0.9, box.max.z + 0.6);
  deco.add(man);
  document.getElementById('t').textContent = `${lib}/${name}  size ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)} m  ·  ${verts} verts  ·  ${(performance.now() - t0).toFixed(0)} ms  ·  minY ${box.min.y.toFixed(2)}`;
  render();
  return { size: size.toArray(), min: box.min.toArray(), max: box.max.toArray(), verts };
}

const cam = new THREE.PerspectiveCamera(32, 1, 0.05, 2000);
function view(az, el, vp) {
  const c = box.getCenter(new THREE.Vector3());
  const [x, y, w, h] = vp;
  cam.aspect = w / h;
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  const dir = new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
  const up = new THREE.Vector3().crossVectors(dir, right).normalize();
  // fit the projected bounding box
  let hw = 0, hh = 0, hd = 0;
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(c);
    hw = Math.max(hw, Math.abs(p.dot(right))); hh = Math.max(hh, Math.abs(p.dot(up))); hd = Math.max(hd, Math.abs(p.dot(dir)));
  }
  const tf = Math.tan((cam.fov / 2) * Math.PI / 180);
  const fit = Math.max(hw / (tf * cam.aspect), hh / tf) * 1.12 + hd;
  cam.position.copy(c).addScaledVector(dir, fit);
  cam.lookAt(c);
  cam.updateProjectionMatrix();
  renderer.setViewport(x, y, w, h);
  renderer.setScissor(x, y, w, h);
  renderer.setScissorTest(true);
  renderer.render(scene, cam);
}
function render() {
  const W = innerWidth, H = innerHeight;
  if (q.get('az')) { view(+q.get('az'), +(q.get('el') || 10), [0, 0, W, H]); return; }
  const w = Math.floor(W / 3);
  view(0, 6, [0, 0, w, H]);        // side (looking along -z: head to the right)
  view(40, 18, [w, 0, w, H]);      // three-quarter front
  view(90, 8, [2 * w, 0, W - 2 * w, H]); // front (camera on +x, looking at the face)
}
window.VIEW = { setModel, render, names: async (lib) => (await import(/* @vite-ignore */ `./models/${lib}.js`)).NAMES };
if (q.get('lib') && q.get('name')) {
  setModel(q.get('lib'), q.get('name'), q.get('opts') ? JSON.parse(q.get('opts')) : {}).then(() => { window.VIEW.ready = true; }).catch((e) => { console.error(e); document.getElementById('t').textContent = 'ERROR ' + e.message; window.VIEW.ready = true; window.VIEW.error = e.message; });
} else { window.VIEW.ready = true; }
