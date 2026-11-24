// Access to the procedural model libraries (cached). Libraries that fail to load fall back to placeholders
// so the museum still builds.
import { Geo } from '../engine/builder.js';
import * as sealife from './sealife.js';
import * as animals from './animals.js';
import * as skeletons from './skeletons.js';

const libs = { sealife, animals, skeletons };
const cache = new Map();
const warned = new Set();

/** Kept for callers that await the libraries; everything is bundled statically. */
export async function loadModelLibs() {}

function placeholder() {
  const g = new Geo();
  g.box('flat', -0.9, 0, -0.35, 0.9, 1.4, 0.35, { color: 0x8a7f72 });
  g.box('flat', 0.8, 1.0, -0.25, 1.5, 1.7, 0.25, { color: 0x8a7f72 });
  return g;
}

/** Build (or fetch from cache) a model Geo: model('animals', 'lion', {pose:'stand', seed:2}). Do not mutate the result. */
export function model(lib, name, opts = {}) {
  const key = lib + ':' + name + ':' + JSON.stringify(opts);
  let g = cache.get(key);
  if (!g) {
    try {
      if (!libs[lib]) throw new Error('library not loaded');
      g = libs[lib].build(name, opts);
    } catch (e) {
      if (!warned.has(lib + name)) { warned.add(lib + name); console.warn(`model ${lib}/${name} failed: ${e.message}`); }
      g = placeholder();
    }
    cache.set(key, g);
  }
  return g;
}

export function hasModel(lib, name) {
  return !!(libs[lib] && libs[lib].NAMES && libs[lib].NAMES.includes(name));
}

/** Axis-aligned bounds of a Geo: {min:[x,y,z], max:[x,y,z]} */
export function geoBounds(g) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const b of g.buckets.values()) for (const ch of b.chunks) {
    const p = ch.pos;
    for (let i = 0; i < p.length; i += 3) for (let k = 0; k < 3; k++) { if (p[i + k] < min[k]) min[k] = p[i + k]; if (p[i + k] > max[k]) max[k] = p[i + k]; }
  }
  return { min, max };
}
