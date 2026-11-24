// Procedural canvas textures. Everything in the museum is generated at load time;
// there are no image assets.
import * as THREE from 'three';
import { mulberry } from './builder.js';

const cache = new Map();
let maxAniso = 8;
export function setMaxAnisotropy(a) { maxAniso = Math.min(8, a); }

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function canvasTexture(canvas, { repeat = true, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = maxAniso;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

// ---- value noise ---------------------------------------------------------
function hash2(ix, iy, seed) {
  let h = (ix * 374761393 + iy * 668265263 + seed * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}
/** Tileable value noise, period `per` in lattice units. */
export function vnoise(x, y, per, seed) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const m = (v) => ((v % per) + per) % per;
  const a = hash2(m(x0), m(y0), seed), b = hash2(m(x0 + 1), m(y0), seed);
  const c = hash2(m(x0), m(y0 + 1), seed), d = hash2(m(x0 + 1), m(y0 + 1), seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
export function fbm(x, y, per, seed, oct = 4) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x * f, y * f, per * f, seed + i * 17);
    n += a; a *= 0.5; f *= 2;
  }
  return s / n;
}

function pixelTex(size, fn) {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = fn(x / size, y / size, x, y);
      const i = (y * size + x) * 4;
      if (typeof v === 'number') { d[i] = d[i + 1] = d[i + 2] = v * 255; }
      else { d[i] = v[0] * 255; d[i + 1] = v[1] * 255; d[i + 2] = v[2] * 255; }
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

const GEN = {
  // faint mottled plaster; tint via vertex colour
  plaster() {
    return pixelTex(256, (u, v) => 0.9 + 0.1 * fbm(u * 8, v * 8, 8, 3, 4));
  },
  // rough sprayed concrete (Gilder Center)
  shotcrete() {
    return pixelTex(512, (u, v) => {
      const n = fbm(u * 48, v * 48, 48, 9, 3);
      const m = fbm(u * 6, v * 6, 6, 21, 3);
      return 0.78 + 0.16 * n + 0.08 * m;
    });
  },
  // limestone / granite ashlar blocks, 4 x 2 m tile => courses 0.5 m
  ashlar() {
    const S = 512;
    const c = pixelTex(S, (u, v) => 0.86 + 0.12 * fbm(u * 24, v * 24, 24, 5, 4));
    const ctx = c.getContext('2d');
    const rnd = mulberry(11);
    const rows = 4, rh = S / rows;
    for (let r = 0; r < rows; r++) {
      const cols = 2;
      const off = (r % 2) * (S / cols / 2);
      for (let k = 0; k < cols; k++) {
        const x = off + k * S / cols;
        ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + rnd() * 0.05})`;
        ctx.fillRect(x, r * rh, S / cols, rh);
        if (x + S / cols > S) ctx.fillRect(x - S, r * rh, S / cols, rh);
        ctx.fillStyle = 'rgba(40,30,20,0.35)';
        ctx.fillRect(x - 1, r * rh, 2.5, rh);
      }
      ctx.fillStyle = 'rgba(40,30,20,0.35)';
      ctx.fillRect(0, r * rh - 1, S, 2.5);
    }
    return c;
  },
  // polished marble tiles (2 x 2 per texture => texture spans 2 m, tiles 1 m)
  marble() {
    const S = 512;
    const c = pixelTex(S, (u, v) => {
      const tu = Math.floor(u * 2), tv = Math.floor(v * 2);
      const o = (tu * 7 + tv * 13) * 3.1;
      const w = fbm(u * 6 + o, v * 6 + o * 0.7, 6, 31, 5);
      const vein = Math.abs(Math.sin((u * 5 + v * 3 + w * 6 + o) * 3.0));
      const veinD = clamp01(1 - vein * 6) * 0.22;
      const tone = ((tu + tv) % 2 ? 0.93 : 0.84) + 0.07 * w - veinD;
      return [tone, tone * 0.985, tone * 0.95];
    });
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(60,50,40,0.35)';
    for (let i = 0; i < 2; i++) { ctx.fillRect(i * S / 2 - 1, 0, 2, S); ctx.fillRect(0, i * S / 2 - 1, S, 2); }
    return c;
  },
  // terrazzo with fine chips
  terrazzo() {
    const S = 512;
    const c = pixelTex(S, (u, v) => 0.82 + 0.08 * fbm(u * 10, v * 10, 10, 41, 3));
    const ctx = c.getContext('2d');
    const rnd = mulberry(5);
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * S, y = rnd() * S, r = 1 + rnd() * 3.2;
      const g = 110 + rnd() * 140;
      ctx.fillStyle = `rgba(${g},${g * (0.9 + rnd() * 0.1)},${g * (0.8 + rnd() * 0.2)},0.75)`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.5 + rnd() * 0.5), rnd() * 3.14, 0, 6.3);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(150,120,60,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, S, S);
    return c;
  },
  // herringbone-ish oak planks, texture spans 2 m
  wood() {
    const S = 512;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const rnd = mulberry(77);
    const ph = S / 8;
    for (let r = 0; r < 8; r++) {
      let x = -rnd() * S * 0.5;
      while (x < S) {
        const w = S * (0.35 + rnd() * 0.3);
        const t = 150 + rnd() * 50;
        ctx.fillStyle = `rgb(${t + 30},${t - 5},${t - 55})`;
        ctx.fillRect(x, r * ph, w, ph);
        for (let k = 0; k < 14; k++) {
          ctx.strokeStyle = `rgba(90,55,20,${0.05 + rnd() * 0.1})`;
          ctx.lineWidth = 0.6 + rnd();
          const yy = r * ph + rnd() * ph;
          ctx.beginPath(); ctx.moveTo(x, yy); ctx.bezierCurveTo(x + w * 0.3, yy + rnd() * 4 - 2, x + w * 0.6, yy + rnd() * 4 - 2, x + w, yy + rnd() * 3 - 1.5); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(50,30,10,0.5)';
        ctx.fillRect(x, r * ph, 1.5, ph);
        x += w;
      }
      ctx.fillStyle = 'rgba(50,30,10,0.45)';
      ctx.fillRect(0, r * ph, S, 1.5);
    }
    return c;
  },
  // dark veined marble (Akeley Hall walls)
  darkmarble() {
    return pixelTex(512, (u, v) => {
      const w = fbm(u * 5, v * 5, 5, 61, 5);
      const vein = Math.abs(Math.sin((u * 4 - v * 7 + w * 7) * 3.0));
      const veinL = clamp01(1 - vein * 9);
      const base = 0.62 + 0.26 * w;
      return [base + veinL * 0.22, base + veinL * 0.22, base + veinL * 0.2];
    });
  },
  carpet() {
    return pixelTex(256, (u, v, x, y) => 0.8 + 0.2 * hash2(x, y, 3) * (0.6 + 0.4 * fbm(u * 4, v * 4, 4, 2, 2)));
  },
  // square stone pavers (1 m tiles) with subtle variation
  pavers() {
    const S = 512;
    const c = pixelTex(S, (u, v) => {
      const tu = Math.floor(u * 2), tv = Math.floor(v * 2);
      return 0.8 + 0.12 * fbm(u * 16 + tu * 5, v * 16 + tv * 9, 16, 71, 4) + ((tu * 3 + tv * 5) % 4) * 0.015;
    });
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(30,30,30,0.4)';
    for (let i = 0; i < 2; i++) { ctx.fillRect(i * S / 2 - 1, 0, 2, S); ctx.fillRect(0, i * S / 2 - 1, S, 2); }
    return c;
  },
  // iron meteorite surface: regmaglypts (thumbprint pits)
  meteorite() {
    return pixelTex(512, (u, v) => {
      const n = fbm(u * 10, v * 10, 10, 91, 4);
      const pits = fbm(u * 22, v * 22, 22, 93, 2);
      const rust = fbm(u * 5, v * 5, 5, 97, 3);
      const t = 0.5 + 0.35 * n - 0.25 * clamp01((pits - 0.55) * 4);
      return [t * (0.95 + 0.25 * rust), t * (0.8 + 0.1 * rust), t * 0.7];
    });
  },
  // whale / animal skin mottling
  mottle() {
    return pixelTex(256, (u, v) => 0.82 + 0.18 * fbm(u * 12, v * 12, 12, 101, 4));
  },
  // sand / ground with pebbles
  ground() {
    return pixelTex(256, (u, v, x, y) => 0.75 + 0.18 * fbm(u * 16, v * 16, 16, 111, 4) + 0.07 * hash2(x, y, 9));
  },
  // water caustics (ocean hall ceiling)
  caustics() {
    return pixelTex(512, (u, v) => {
      const a = fbm(u * 6, v * 6, 6, 121, 3), b = fbm(u * 6 + 3.3, v * 6 + 1.7, 6, 123, 3);
      const w = Math.abs(Math.sin((a - b) * 9 + u * 6.283 * 2));
      const line = clamp01(1 - w * 1.25);
      const t = 0.42 + line * line * 0.5;
      return [t * 0.55, t * 0.8, t];
    });
  },
  // coffered vault panel (one coffer per repeat)
  coffer() {
    const S = 256;
    const c = makeCanvas(S, S);
    const g = c.getContext('2d');
    g.fillStyle = '#e9e2d2'; g.fillRect(0, 0, S, S);
    const steps = [[14, '#cfc6b2'], [30, '#b9ae98'], [46, '#a2967e'], [60, '#8f8268']];
    for (const [m, colr] of steps) { g.fillStyle = colr; g.fillRect(m, m, S - 2 * m, S - 2 * m); }
    // shading: top-left edges dark (recess), bottom-right light
    g.strokeStyle = 'rgba(60,50,35,0.55)'; g.lineWidth = 3;
    for (const [m] of steps) { g.beginPath(); g.moveTo(m, S - m); g.lineTo(m, m); g.lineTo(S - m, m); g.stroke(); }
    g.strokeStyle = 'rgba(255,250,235,0.6)';
    for (const [m] of steps) { g.beginPath(); g.moveTo(m, S - m); g.lineTo(S - m, S - m); g.lineTo(S - m, m); g.stroke(); }
    // rosette
    g.fillStyle = '#d8c79a';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.ellipse(S / 2 + Math.cos(a) * 20, S / 2 + Math.sin(a) * 20, 17, 8, a, 0, 6.3); g.fill(); }
    g.fillStyle = '#b89a5c'; g.beginPath(); g.arc(S / 2, S / 2, 11, 0, 6.3); g.fill();
    return c;
  },
  // star field (planetarium / cosmic displays)
  stars() {
    const S = 1024;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#02030a';
    ctx.fillRect(0, 0, S, S);
    const rnd = mulberry(1234);
    for (let i = 0; i < 40; i++) {
      const x = rnd() * S, y = rnd() * S, r = 60 + rnd() * 160;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const hue = 200 + rnd() * 100;
      g.addColorStop(0, `hsla(${hue},70%,45%,0.10)`);
      g.addColorStop(1, 'hsla(0,0%,0%,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 3500; i++) {
      const x = rnd() * S, y = rnd() * S, m = rnd();
      const r = m > 0.985 ? 1.8 : m > 0.9 ? 1.1 : 0.6;
      ctx.fillStyle = `hsla(${rnd() > 0.7 ? 40 : 210},${rnd() * 60}%,${70 + rnd() * 30}%,${0.4 + rnd() * 0.6})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
    }
    return c;
  },
};

/** Named, cached repeating texture. `span` = metres covered by one repeat. */
export function tex(name, span = 1) {
  const key = name + '@' + span;
  let t = cache.get(key);
  if (!t) {
    let c = cache.get('canvas:' + name);
    if (!c) { c = GEN[name](); cache.set('canvas:' + name, c); }
    t = canvasTexture(c);
    t.repeat.set(1 / span, 1 / span);
    cache.set(key, t);
  }
  return t;
}
