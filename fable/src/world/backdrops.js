// Painted diorama backgrounds, generated on a canvas (the real ones were painted on curved plaster).
import * as THREE from 'three';
import { makeCanvas, fbm } from '../engine/textures.js';
import { mulberry } from '../engine/builder.js';
import { registerMat, hasMat } from '../engine/materials.js';

const W = 1024, H = 400;

const hex = (c, a = 1) => {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  return `rgba(${r},${g},${b},${a})`;
};
const mix = (c1, c2, t) => {
  const r = ((c1 >> 16) & 255) * (1 - t) + ((c2 >> 16) & 255) * t;
  const g = ((c1 >> 8) & 255) * (1 - t) + ((c2 >> 8) & 255) * t;
  const b = (c1 & 255) * (1 - t) + (c2 & 255) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
};

// ---- biome specs ----------------------------------------------------------
// horizon: fraction from the top. ridges: far -> near. trees: painted on the plain between yMin..yMax (fractions from top).
export const BIOMES = {
  savanna: { sky: [0x5d93cf, 0xe9e2c8], horizon: 0.6, clouds: 0.5, ridges: [{ y: 0.6, amp: 0.05, col: 0x9aa7b4, f: 2 }, { y: 0.615, amp: 0.025, col: 0x8f9a7c, f: 4 }], plain: [0xc9b676, 0xb59a52], trees: { style: 'acacia', n: 16, col: 0x4c5a2c }, ground: 0xb39a56, grass: 0x9c8a4a },
  savannagreen: { sky: [0x6fa0d6, 0xe6ead6], horizon: 0.58, clouds: 0.7, ridges: [{ y: 0.58, amp: 0.06, col: 0x8fa2b8, f: 2 }, { y: 0.6, amp: 0.03, col: 0x71875a, f: 5 }], plain: [0x9aa862, 0x7d8f44], trees: { style: 'acacia', n: 22, col: 0x3f5226 }, ground: 0x84903f, grass: 0x6f8236 },
  dusk: { sky: [0x3b4f86, 0xf1b27a], horizon: 0.62, clouds: 0.35, cloudCol: 0xf7c9a0, ridges: [{ y: 0.62, amp: 0.05, col: 0x6a5f7c, f: 2 }], plain: [0xb08a55, 0x8a6a3c], trees: { style: 'acacia', n: 12, col: 0x2e2a1c }, ground: 0x8a6c3e, grass: 0x7a6236 },
  waterhole: { sky: [0x6a9bd2, 0xeee6cc], horizon: 0.56, clouds: 0.45, ridges: [{ y: 0.56, amp: 0.04, col: 0xa0aab2, f: 2 }], plain: [0xcbb77a, 0xb9a05e], water: { y: 0.72, h: 0.1, col: 0x7fa0b0 }, trees: { style: 'acacia', n: 14, col: 0x4c5a2c }, ground: 0xb7a060, grass: 0xa08c4c },
  virunga: { sky: [0x8fa9b8, 0xdfe4dc], horizon: 0.66, clouds: 0.9, ridges: [{ y: 0.42, amp: 0.2, col: 0x8f9fa8, f: 1.2, volcano: true }, { y: 0.56, amp: 0.1, col: 0x5f7a66, f: 2.5 }, { y: 0.66, amp: 0.05, col: 0x3d5c3c, f: 5 }], plain: [0x3f6034, 0x2f4d26], trees: { style: 'jungle', n: 40, col: 0x27421f }, ground: 0x35522a, grass: 0x3c6a2c, mist: 0.5 },
  jungle: { sky: [0x9db8a6, 0xd6e2c8], horizon: 0.3, clouds: 0, ridges: [{ y: 0.32, amp: 0.05, col: 0x4c6a44, f: 6 }], plain: [0x2c4a26, 0x1e3a1c], trees: { style: 'jungle', n: 70, col: 0x1e3a1a, yMin: 0.05, yMax: 0.9 }, ground: 0x2c4424, grass: 0x35602a, mist: 0.25, shafts: true },
  bamboo: { sky: [0xa8c0b0, 0xdde8d2], horizon: 0.32, clouds: 0, ridges: [{ y: 0.36, amp: 0.08, col: 0x7c9a86, f: 2 }], plain: [0x4a6a38, 0x3a5a2c], trees: { style: 'bamboo', n: 90, col: 0x5c8a3c, yMin: 0.0, yMax: 0.85 }, ground: 0x4a5c30, grass: 0x567a34, mist: 0.3 },
  desert: { sky: [0x5c94d6, 0xf2e3c4], horizon: 0.58, clouds: 0.08, ridges: [{ y: 0.56, amp: 0.07, col: 0xc9a98a, f: 1.5 }, { y: 0.6, amp: 0.035, col: 0xd9b780, f: 3 }], plain: [0xe6c88c, 0xd9b472], trees: { style: 'scrub', n: 14, col: 0x7a7a4a }, ground: 0xd8b574, grass: 0xb09a5c },
  mountain: { sky: [0x4f88cc, 0xd9e6f0], horizon: 0.7, clouds: 0.4, ridges: [{ y: 0.3, amp: 0.26, col: 0x8a9db4, f: 1.6, snow: 0.55 }, { y: 0.5, amp: 0.16, col: 0x6a8296, f: 2.5, snow: 0.3 }, { y: 0.66, amp: 0.07, col: 0x5c7250, f: 5 }], plain: [0x7c8c56, 0x6a7a48], trees: { style: 'conifer', n: 30, col: 0x2c4630 }, ground: 0x7a8052, grass: 0x6c7c44 },
  alpine: { sky: [0x4f88cc, 0xdfeaf2], horizon: 0.74, clouds: 0.3, ridges: [{ y: 0.22, amp: 0.3, col: 0x96a8bc, f: 1.4, snow: 0.7 }, { y: 0.5, amp: 0.2, col: 0x7c8ea2, f: 2.4, snow: 0.45 }], plain: [0x9a9a8a, 0x8a8a7a], trees: { style: 'none' }, ground: 0x8c8a7c, grass: 0x7c8460 },
  tundra: { sky: [0x7fa3c8, 0xe6e6da], horizon: 0.6, clouds: 0.6, ridges: [{ y: 0.56, amp: 0.08, col: 0xa9b6c4, f: 1.5, snow: 0.5 }], plain: [0xa39a6a, 0x8c8454], trees: { style: 'scrub', n: 10, col: 0x6a6a3c }, ground: 0x8f8656, grass: 0x8a7c48 },
  arctic: { sky: [0x7c9cc4, 0xe9eef2], horizon: 0.58, clouds: 0.5, ridges: [{ y: 0.54, amp: 0.07, col: 0xd4dfea, f: 2 }], plain: [0xe6edf2, 0xf4f7f9], trees: { style: 'none' }, ground: 0xeef2f5, grass: 0xdfe8ee, ice: true },
  prairie: { sky: [0x5a90d2, 0xe9ead8], horizon: 0.6, clouds: 0.75, ridges: [{ y: 0.6, amp: 0.02, col: 0x94a47c, f: 3 }], plain: [0xc2b46e, 0xa89a50], trees: { style: 'none' }, ground: 0xa99a52, grass: 0xb5a45a },
  conifer: { sky: [0x6c9ccc, 0xdfe8ea], horizon: 0.62, clouds: 0.5, ridges: [{ y: 0.4, amp: 0.2, col: 0x8fa2b6, f: 1.5, snow: 0.35 }, { y: 0.58, amp: 0.08, col: 0x4f6a52, f: 4 }], plain: [0x5a6e42, 0x4a5c36], trees: { style: 'conifer', n: 60, col: 0x22382a, yMin: 0.34, yMax: 0.8 }, ground: 0x565c38, grass: 0x5c6c3a },
  autumn: { sky: [0x7ba3cf, 0xe9e6d8], horizon: 0.6, clouds: 0.45, ridges: [{ y: 0.5, amp: 0.1, col: 0x9a8a7c, f: 2 }, { y: 0.6, amp: 0.05, col: 0xa8683a, f: 5 }], plain: [0x9a8a4a, 0x8a7438], trees: { style: 'autumn', n: 50, col: 0xb8642c, yMin: 0.3, yMax: 0.8 }, ground: 0x8a6c3a, grass: 0xa07c3c },
  broadleaf: { sky: [0x78a4d0, 0xe2ead8], horizon: 0.6, clouds: 0.45, ridges: [{ y: 0.52, amp: 0.08, col: 0x7c967c, f: 2 }, { y: 0.6, amp: 0.05, col: 0x4f7040, f: 5 }], plain: [0x6a8a44, 0x587a38], trees: { style: 'broadleaf', n: 50, col: 0x33562a, yMin: 0.3, yMax: 0.8 }, ground: 0x5a6e38, grass: 0x5c8034 },
  swamp: { sky: [0x8caec4, 0xe4e6d2], horizon: 0.55, clouds: 0.5, ridges: [{ y: 0.52, amp: 0.05, col: 0x5f7a5a, f: 4 }], plain: [0x5c6e44, 0x4a5c3a], water: { y: 0.7, h: 0.16, col: 0x5c7468 }, trees: { style: 'broadleaf', n: 40, col: 0x2f4a2c, yMin: 0.25, yMax: 0.7 }, ground: 0x4c5a36, grass: 0x56703a, mist: 0.3 },
  coast: { sky: [0x5f97d4, 0xe2ecf0], horizon: 0.55, clouds: 0.55, ridges: [{ y: 0.52, amp: 0.05, col: 0x8c9cac, f: 1.5 }], plain: [0x3f7a9c, 0x4a8aa8], sea: true, trees: { style: 'none' }, ground: 0xa89a82, grass: 0x8a8a6a },
  island: { sky: [0x4f92d6, 0xdcecf2], horizon: 0.5, clouds: 0.6, ridges: [{ y: 0.46, amp: 0.07, col: 0x6a8a6c, f: 1.3 }], plain: [0x2f86a8, 0x54b0be], sea: true, trees: { style: 'palm', n: 9, col: 0x2f5a2c, yMin: 0.55, yMax: 0.8 }, ground: 0xe2d2a8, grass: 0x7a9a4a },
  nile: { sky: [0x6c9cd2, 0xeee4c8], horizon: 0.5, clouds: 0.3, ridges: [{ y: 0.5, amp: 0.03, col: 0x8f9a7c, f: 3 }], plain: [0x8fa25c, 0x7c8f48], water: { y: 0.6, h: 0.22, col: 0x8aa6a4 }, trees: { style: 'papyrus', n: 60, col: 0x56783a, yMin: 0.42, yMax: 0.62 }, ground: 0x7c8444, grass: 0x6c8a3a },
  underwater: { sky: [0x2a7fc0, 0x0c3a6c], horizon: 0.78, clouds: 0, ridges: [{ y: 0.76, amp: 0.06, col: 0x0c3058, f: 3 }], plain: [0x1c4a70, 0x2c5c7c], trees: { style: 'none' }, ground: 0x4a6a78, grass: 0x3a6a5a, rays: true },
  deepsea: { sky: [0x06203c, 0x010810], horizon: 0.9, clouds: 0, ridges: [], plain: [0x020a14, 0x030c18], trees: { style: 'none' }, ground: 0x0a1420, grass: 0x0a1a24 },
  reef: { sky: [0x39a0d8, 0x1464a0], horizon: 0.7, clouds: 0, ridges: [{ y: 0.66, amp: 0.1, col: 0x1c5c84, f: 4 }], plain: [0x2c7a98, 0x4a9aa8], trees: { style: 'none' }, ground: 0xc8c0a0, grass: 0x5aa090, rays: true },
  night: { sky: [0x0a1024, 0x24304c], horizon: 0.62, clouds: 0.1, cloudCol: 0x3a4660, ridges: [{ y: 0.6, amp: 0.06, col: 0x161c2c, f: 2 }], plain: [0x1c2430, 0x161c24], trees: { style: 'conifer', n: 20, col: 0x0a1014 }, ground: 0x1c2228, grass: 0x1c2a26, stars: true },
  canyon: { sky: [0x5a94d8, 0xf0e2c8], horizon: 0.68, clouds: 0.2, ridges: [{ y: 0.3, amp: 0.1, col: 0xc98a5c, f: 1.2, mesa: true }, { y: 0.5, amp: 0.1, col: 0xb8703c, f: 2, mesa: true }], plain: [0xc99a62, 0xb8844c], trees: { style: 'scrub', n: 22, col: 0x6a7040 }, ground: 0xb8864e, grass: 0x9a8a50 },
};

function ridgeY(x, r, seed) {
  let n = fbm(x / W * 6 * r.f, seed * 3.7, 4096, seed, 4);
  if (r.volcano) {
    const cx = W * 0.62, d = Math.abs(x - cx) / (W * 0.3);
    n = n * 0.3 + Math.max(0, 1 - d * d) * 0.9 - (Math.abs(x - cx) < 18 ? 0.06 : 0);
  }
  if (r.mesa) n = Math.round(n * 4) / 4 * 0.8 + n * 0.2;
  return (r.y - r.amp * n) * H;
}

function drawTree(g, style, x, y, s, colr, rnd) {
  const dark = mix(colr, 0x000000, 0.35), light = mix(colr, 0xdde8a0, 0.25);
  g.lineCap = 'round';
  switch (style) {
    case 'acacia': {
      g.strokeStyle = hex(mix(0x3a2e22, colr, 0.2));
      g.lineWidth = Math.max(1, s * 0.06);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * 0.04, y - s * 0.5);
      g.moveTo(x + s * 0.03, y - s * 0.35); g.lineTo(x - s * 0.28, y - s * 0.66);
      g.moveTo(x + s * 0.04, y - s * 0.42); g.lineTo(x + s * 0.3, y - s * 0.68); g.stroke();
      for (let i = 0; i < 5; i++) {
        g.fillStyle = hex(i % 2 ? colr : dark, 0.95);
        g.beginPath(); g.ellipse(x + (rnd() - 0.5) * s * 0.5, y - s * (0.68 + rnd() * 0.08), s * (0.3 + rnd() * 0.25), s * 0.07, 0, 0, 6.3); g.fill();
      }
      g.fillStyle = hex(light, 0.5);
      g.beginPath(); g.ellipse(x - s * 0.05, y - s * 0.76, s * 0.4, s * 0.03, 0, 0, 6.3); g.fill();
      break;
    }
    case 'conifer': {
      g.fillStyle = hex(colr);
      for (let i = 0; i < 5; i++) {
        const w = s * 0.28 * (1 - i / 6.5), yy = y - s * (0.12 + i * 0.17);
        g.beginPath(); g.moveTo(x - w, yy); g.lineTo(x, yy - s * 0.3); g.lineTo(x + w, yy); g.closePath(); g.fill();
      }
      g.fillStyle = hex(light, 0.25);
      g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.18, y - s * 0.2); g.lineTo(x, y - s * 0.2); g.closePath(); g.fill();
      break;
    }
    case 'autumn':
    case 'broadleaf': {
      g.strokeStyle = hex(0x3a2c20); g.lineWidth = Math.max(1, s * 0.07);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - s * 0.5); g.stroke();
      const pal = style === 'autumn' ? [0xc8642c, 0xd99a2c, 0xa8402a, 0xd9b84a, 0x8a5a2a] : [colr, dark, light, mix(colr, 0x6a8a3a, 0.5)];
      for (let i = 0; i < 9; i++) {
        g.fillStyle = hex(pal[Math.floor(rnd() * pal.length)], 0.95);
        g.beginPath(); g.arc(x + (rnd() - 0.5) * s * 0.55, y - s * (0.45 + rnd() * 0.45), s * (0.14 + rnd() * 0.12), 0, 6.3); g.fill();
      }
      break;
    }
    case 'jungle': {
      const pal = [colr, dark, mix(colr, 0x5a8a3a, 0.5), mix(colr, 0x0a1a0a, 0.5)];
      g.strokeStyle = hex(mix(0x2a2218, colr, 0.3)); g.lineWidth = Math.max(1, s * 0.05);
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + s * 0.1, y - s * 0.5, x - s * 0.05, y - s); g.stroke();
      for (let i = 0; i < 12; i++) {
        g.fillStyle = hex(pal[Math.floor(rnd() * pal.length)], 0.92);
        g.beginPath(); g.ellipse(x + (rnd() - 0.5) * s * 0.8, y - s * (0.3 + rnd() * 0.8), s * (0.16 + rnd() * 0.2), s * (0.1 + rnd() * 0.1), rnd() * 3, 0, 6.3); g.fill();
      }
      break;
    }
    case 'bamboo': {
      g.strokeStyle = hex(mix(colr, 0xc8d890, rnd() * 0.4)); g.lineWidth = Math.max(1.2, s * 0.025);
      const lean = (rnd() - 0.5) * s * 0.15;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + lean, y - s * 1.6); g.stroke();
      g.strokeStyle = hex(dark, 0.8); g.lineWidth = 1;
      for (let i = 1; i < 7; i++) { const yy = y - s * 1.6 * i / 7, xx = x + lean * i / 7; g.beginPath(); g.moveTo(xx - 2, yy); g.lineTo(xx + 2, yy); g.stroke(); }
      g.fillStyle = hex(mix(colr, 0x2a5a1a, 0.4), 0.8);
      for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(x + lean + (rnd() - 0.5) * s * 0.4, y - s * (0.9 + rnd() * 0.8), s * 0.12, s * 0.025, rnd() * 3, 0, 6.3); g.fill(); }
      break;
    }
    case 'palm': {
      g.strokeStyle = hex(0x6a5a44); g.lineWidth = Math.max(1.5, s * 0.05);
      const lean = (rnd() - 0.5) * s * 0.4;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * 0.3, y - s * 0.6, x + lean, y - s); g.stroke();
      g.strokeStyle = hex(colr); g.lineWidth = Math.max(1.5, s * 0.04);
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI * (0.05 + 0.9 * i / 7);
        g.beginPath(); g.moveTo(x + lean, y - s); g.quadraticCurveTo(x + lean + Math.cos(a) * s * 0.3, y - s + Math.sin(a) * s * 0.3, x + lean + Math.cos(a) * s * 0.5, y - s + Math.sin(a) * s * 0.18 + s * 0.12); g.stroke();
      }
      break;
    }
    case 'papyrus': {
      g.strokeStyle = hex(colr); g.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const xx = x + (rnd() - 0.5) * s * 0.5, top = y - s * (0.6 + rnd() * 0.5);
        g.beginPath(); g.moveTo(xx, y); g.lineTo(xx + (rnd() - 0.5) * 6, top); g.stroke();
        g.fillStyle = hex(light, 0.8); g.beginPath(); g.arc(xx, top, s * 0.08, 0, 6.3); g.fill();
      }
      break;
    }
    case 'scrub': {
      for (let i = 0; i < 5; i++) {
        g.fillStyle = hex(i % 2 ? colr : dark, 0.9);
        g.beginPath(); g.ellipse(x + (rnd() - 0.5) * s * 0.5, y - s * 0.1 - rnd() * s * 0.12, s * (0.12 + rnd() * 0.12), s * 0.09, 0, 0, 6.3); g.fill();
      }
      break;
    }
    default:
  }
}

export function paintBackdrop(biome, seed = 1) {
  const sp = typeof biome === 'string' ? BIOMES[biome] : biome;
  const c = makeCanvas(W, H);
  const g = c.getContext('2d');
  const rnd = mulberry(seed * 7919 + 13);
  const hy = sp.horizon * H;
  // sky
  let gr = g.createLinearGradient(0, 0, 0, hy);
  gr.addColorStop(0, hex(sp.sky[0]));
  gr.addColorStop(1, hex(sp.sky[1]));
  g.fillStyle = gr;
  g.fillRect(0, 0, W, hy + 2);
  if (sp.stars) {
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; g.fillRect(rnd() * W, rnd() * hy * 0.9, 1.2, 1.2); }
  }
  // clouds
  const nC = Math.round((sp.clouds || 0) * 16);
  for (let i = 0; i < nC; i++) {
    const cx = rnd() * W, cy = hy * (0.08 + rnd() * 0.62), s = 30 + rnd() * 70;
    const persp = 0.35 + 0.65 * (1 - cy / hy);
    for (let k = 0; k < 8; k++) {
      const x = cx + (rnd() - 0.5) * s * 3.2 * persp, y = cy + (rnd() - 0.7) * s * 0.45 * persp, r = s * (0.45 + rnd() * 0.5) * persp;
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, hex(sp.cloudCol || 0xffffff, 0.75));
      rg.addColorStop(0.6, hex(sp.cloudCol || 0xffffff, 0.3));
      rg.addColorStop(1, hex(sp.cloudCol || 0xffffff, 0));
      g.fillStyle = rg;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  // underwater light rays
  if (sp.rays) {
    for (let i = 0; i < 14; i++) {
      const x = rnd() * W, w = 20 + rnd() * 60;
      const rg = g.createLinearGradient(0, 0, 0, H * 0.8);
      rg.addColorStop(0, 'rgba(190,235,255,0.26)');
      rg.addColorStop(1, 'rgba(190,235,255,0)');
      g.fillStyle = rg;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w * 1.6 - 80, H * 0.8); g.lineTo(x - 80, H * 0.8); g.closePath(); g.fill();
    }
  }
  // ridges (far to near)
  sp.ridges.forEach((r, i) => {
    const s2 = seed + i * 31;
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, ridgeY(x, r, s2));
    g.lineTo(W, H);
    g.closePath();
    const top = (r.y - r.amp) * H;
    const rg = g.createLinearGradient(0, top, 0, r.y * H + 30);
    rg.addColorStop(0, hex(mix(r.col, sp.sky[1], 0.15)));
    rg.addColorStop(1, hex(mix(r.col, sp.sky[1], 0.4)));
    g.fillStyle = rg;
    g.fill();
    if (r.snow) {
      g.save();
      g.clip();
      g.beginPath();
      g.moveTo(0, 0);
      for (let x = 0; x <= W; x += 4) {
        const y0 = ridgeY(x, r, s2);
        g.lineTo(x, y0 + r.amp * H * r.snow * (0.5 + 0.8 * fbm(x / 40, 3, 4096, s2 + 5, 3)));
      }
      g.lineTo(W, 0);
      g.closePath();
      g.fillStyle = 'rgba(248,250,255,0.92)';
      g.fill();
      g.restore();
    }
  });
  // plain / sea
  gr = g.createLinearGradient(0, hy, 0, H);
  gr.addColorStop(0, hex(mix(sp.plain[0], sp.sky[1], 0.35)));
  gr.addColorStop(0.3, hex(sp.plain[0]));
  gr.addColorStop(1, hex(sp.plain[1]));
  g.fillStyle = gr;
  g.fillRect(0, hy, W, H - hy);
  // ground texture strokes
  for (let i = 0; i < 900; i++) {
    const y = hy + Math.pow(rnd(), 1.6) * (H - hy), d = (y - hy) / (H - hy);
    const x = rnd() * W, w = 6 + d * 40 * rnd();
    g.strokeStyle = hex(rnd() > 0.5 ? mix(sp.plain[1], 0x000000, 0.25) : mix(sp.plain[0], 0xffffff, 0.2), sp.sea ? 0.25 : 0.35);
    g.lineWidth = 0.6 + d * 1.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + (rnd() - 0.5) * 2); g.stroke();
  }
  if (sp.water) {
    const wy = sp.water.y * H, wh = sp.water.h * H;
    const wg = g.createLinearGradient(0, wy, 0, wy + wh);
    wg.addColorStop(0, hex(mix(sp.water.col, sp.sky[1], 0.5)));
    wg.addColorStop(1, hex(sp.water.col));
    g.fillStyle = wg;
    g.beginPath(); g.ellipse(W * 0.5, wy + wh / 2, W * 0.46, wh / 2, 0, 0, 6.3); g.fill();
  }
  if (sp.ice) {
    for (let i = 0; i < 26; i++) {
      const y = hy + rnd() * (H - hy) * 0.7, x = rnd() * W, d = (y - hy) / (H - hy), w = 30 + d * 120;
      g.fillStyle = hex(0xbfd2e2, 0.6);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.4, y - 6 - d * 22); g.lineTo(x + w, y); g.closePath(); g.fill();
      g.fillStyle = hex(0xffffff, 0.8);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.4, y - 6 - d * 22); g.lineTo(x + w * 0.5, y); g.closePath(); g.fill();
    }
  }
  // trees, far to near
  const t = sp.trees || { style: 'none' };
  if (t.style !== 'none' && t.n) {
    const y0 = (t.yMin ?? sp.horizon) * H, y1 = (t.yMax ?? 0.86) * H;
    const list = [];
    for (let i = 0; i < t.n; i++) list.push([rnd() * W, y0 + Math.pow(rnd(), 1.4) * (y1 - y0)]);
    list.sort((a, b) => a[1] - b[1]);
    for (const [x, y] of list) {
      const d = Math.max(0, (y - hy) / (H - hy));
      const s = (t.style === 'jungle' || t.style === 'bamboo') ? 60 + d * 150 + (y < hy ? 50 : 0) : 16 + d * 120;
      const hazed = mix(t.col, sp.sky[1], Math.max(0, 0.45 - d * 0.6));
      drawTree(g, t.style, x, y, s, hazed, rnd);
    }
  }
  if (sp.shafts) {
    for (let i = 0; i < 6; i++) {
      const x = rnd() * W;
      const rg = g.createLinearGradient(x, 0, x - 120, H);
      rg.addColorStop(0, 'rgba(255,250,200,0.22)');
      rg.addColorStop(1, 'rgba(255,250,200,0)');
      g.fillStyle = rg;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 50, 0); g.lineTo(x - 90, H); g.lineTo(x - 170, H); g.closePath(); g.fill();
    }
  }
  if (sp.mist) {
    const mg = g.createLinearGradient(0, hy - 60, 0, hy + 70);
    mg.addColorStop(0, 'rgba(235,240,235,0)');
    mg.addColorStop(0.5, `rgba(235,240,235,${sp.mist})`);
    mg.addColorStop(1, 'rgba(235,240,235,0)');
    g.fillStyle = mg;
    g.fillRect(0, hy - 60, W, 130);
  }
  // blend the bottom edge into the modelled foreground colour
  const bg = g.createLinearGradient(0, H * 0.84, 0, H);
  bg.addColorStop(0, hex(sp.ground, 0));
  bg.addColorStop(1, hex(sp.ground, 1));
  g.fillStyle = bg;
  g.fillRect(0, H * 0.84, W, H * 0.16);
  return c;
}

/** Material name for a painted backdrop (created and cached on first use). */
export function backdropMat(biome, seed = 1) {
  const name = `bd:${biome}:${seed}`;
  if (!hasMat(name)) {
    const tex = new THREE.CanvasTexture(paintBackdrop(biome, seed));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 4;
    registerMat(name, new THREE.MeshBasicMaterial({ map: tex, vertexColors: true }));
  }
  return name;
}
