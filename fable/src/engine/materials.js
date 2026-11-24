// Shared material registry. Every material uses vertex colours so that a single
// material can serve many differently-tinted surfaces merged into one mesh.
import * as THREE from 'three';
import { tex } from './textures.js';

const M = new Map();

function std(o) {
  return new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, ...o });
}

/** Adds `colour * k` as emissive so diorama interiors read as brightly lit inside dark halls. */
function glowify(m, k) {
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * ${k.toFixed(3)};`
    );
  };
  m.customProgramCacheKey = () => 'glow' + k;
  return m;
}

const DEF = {
  // ---- architecture (textured; tint with vertex colour) ----
  plaster: () => std({ map: tex('plaster', 3), roughness: 0.95 }),
  stone: () => std({ map: tex('ashlar', 4), roughness: 0.9 }),
  marble: () => std({ map: tex('marble', 2.4), roughness: 0.32 }),
  terrazzo: () => std({ map: tex('terrazzo', 2), roughness: 0.4 }),
  wood: () => std({ map: tex('wood', 2.2), roughness: 0.5 }),
  darkmarble: () => std({ map: tex('darkmarble', 3), roughness: 0.3 }),
  carpet: () => std({ map: tex('carpet', 1), roughness: 1 }),
  pavers: () => std({ map: tex('pavers', 2), roughness: 0.75 }),
  shotcrete: () => std({ map: tex('shotcrete', 3), roughness: 1 }),
  ground: () => std({ map: tex('ground', 2), roughness: 1 }),
  coffer: () => std({ map: tex('coffer', 2.6), roughness: 0.9 }),
  redmarble: () => std({ map: tex('darkmarble', 2.2), roughness: 0.34 }),
  // ---- untextured, vertex-coloured ----
  flat: () => std({ roughness: 0.9 }),
  flat_ds: () => std({ roughness: 0.9, side: THREE.DoubleSide }),
  satin: () => std({ roughness: 0.55 }),
  gloss: () => std({ roughness: 0.18 }),
  bone: () => std({ roughness: 0.62 }),
  bone_ds: () => std({ roughness: 0.62, side: THREE.DoubleSide }),
  skin: () => std({ map: tex('mottle', 1.5), roughness: 0.7 }),
  skin_ds: () => std({ map: tex('mottle', 1.5), roughness: 0.7, side: THREE.DoubleSide }),
  wetskin: () => std({ map: tex('mottle', 2.5), roughness: 0.35 }),
  metal: () => std({ roughness: 0.38, metalness: 1 }),
  bronze: () => std({ roughness: 0.45, metalness: 0.85 }),
  iron: () => std({ map: tex('meteorite', 1.6), roughness: 0.5, metalness: 0.75 }),
  rock: () => std({ map: tex('meteorite', 2.5), roughness: 0.95 }),
  // ---- diorama interiors: self-lit so they glow in dark halls ----
  dio: () => glowify(std({ roughness: 0.9 }), 0.5),
  dio_ds: () => glowify(std({ roughness: 0.9, side: THREE.DoubleSide }), 0.5),
  dioskin: () => glowify(std({ map: tex('mottle', 1.2), roughness: 0.8 }), 0.5),
  dioground: () => glowify(std({ map: tex('ground', 2), roughness: 1 }), 0.5),
  // ---- unlit ----
  glow: () => new THREE.MeshBasicMaterial({ vertexColors: true }),
  glow_ds: () => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  caustics: () => new THREE.MeshBasicMaterial({ vertexColors: true, map: tex('caustics', 14) }),
  stars: () => new THREE.MeshBasicMaterial({ vertexColors: true, map: tex('stars', 12) }),
  stars_ds: () => new THREE.MeshBasicMaterial({ vertexColors: true, map: tex('stars', 12), side: THREE.DoubleSide }),
  shadow: () => {
    const m = new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, depthWrite: false, opacity: 1,
      map: shadowTex(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    m.userData.renderOrder = 1;
    return m;
  },
  // ---- transparent ----
  glass: () => {
    const m = new THREE.MeshStandardMaterial({
      vertexColors: true, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2,
      depthWrite: false, side: THREE.DoubleSide,
    });
    m.userData.renderOrder = 5;
    return m;
  },
  glassblue: () => {
    const m = new THREE.MeshStandardMaterial({
      vertexColors: true, transparent: true, opacity: 0.3, roughness: 0.08, metalness: 0.3,
      depthWrite: false, side: THREE.DoubleSide,
    });
    m.userData.renderOrder = 5;
    return m;
  },
};

let _shadowTex = null;
function shadowTex() {
  if (_shadowTex) return _shadowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.62)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.32)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  _shadowTex = new THREE.CanvasTexture(c);
  return _shadowTex;
}

/** Look up (or lazily create) a shared material by name. */
export function mat(name) {
  let m = M.get(name);
  if (!m) {
    const f = DEF[name];
    if (!f) throw new Error('unknown material ' + name);
    m = f();
    m.name = name;
    M.set(name, m);
  }
  return m;
}

/** Register a custom material under a name (e.g. diorama backdrops with unique textures). */
export function registerMat(name, material) {
  material.name = name;
  M.set(name, material);
  return material;
}
export function hasMat(name) { return M.has(name) || !!DEF[name]; }
export function allMats() { return M; }
