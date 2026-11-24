// Habitat dioramas: a glazed alcove behind a false wall, with a curved painted backdrop,
// modelled foreground terrain, plants and mounted animals. Interiors use self-lit materials
// so they glow in the darkened halls, as the real ones do.
import * as THREE from 'three';
import { Geo, col, shade, mixCol, mulberry } from '../engine/builder.js';
import { fbm } from '../engine/textures.js';
import { placard } from '../engine/placards.js';
import { BIOMES, backdropMat } from './backdrops.js';
import { solids } from './rooms.js';
import { model } from '../models/index.js';
import { loft, ellipsoid, tube } from '../models/loft.js';

const DIO_RENAME = { skin: 'dioskin', wetskin: 'dioskin', flat: 'dio', flat_ds: 'dio_ds', skin_ds: 'dio_ds', gloss: 'dio', bone: 'dio', bone_ds: 'dio_ds', satin: 'dio', metal: 'dio' };

const _m = new THREE.Matrix4();

class Dio {
  constructor(geo, M, o, sp, rnd) {
    this.geo = geo; this.M = M; this.o = o; this.sp = sp; this.rnd = rnd;
    this.W = o.w; this.D = o.depth; this.Rw = o.w / 2 + 0.7;
  }

  /** Terrain height (local y) at (u, z); z is negative going into the diorama. */
  ground(u, z) {
    const o = this.o;
    const t = Math.min(1, Math.max(0, -z / this.D));
    const lip = Math.min(1, t * 6);
    return (o.rise ?? 0.32) * Math.pow(t, 1.4) + lip * (o.bumps ?? 0.12) * (fbm(u * 0.6 + 7 + (o.seed || 0) * 3.1, z * 0.6, 1024, 5 + (o.seed || 0), 3) - 0.5);
  }

  /** Local -> world matrix for an object at (u, y, z) rotated rotDeg about Y and scaled. */
  xf(u, y, z, rotDeg = 0, s = 1) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(u, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotDeg * Math.PI / 180), new THREE.Vector3(s, s, s));
    return m.premultiply(this.M);
  }

  /** Place a model Geo standing on the terrain. rotDeg 0 = head to the viewer's right; 90 = facing away; -90 = facing the viewer. */
  put(g, u, z, rotDeg = 0, s = 1, dy = 0) {
    this.geo.addGeo(g, this.xf(u, this.ground(u, z) + dy, z, rotDeg, s), DIO_RENAME);
    this.shadow(u, z, 0.9 * s, 0.5 * s, rotDeg);
    return this;
  }

  animal(name, u, z, rotDeg = 0, opts = {}, s = 1) {
    return this.put(model('animals', name, opts), u, z, rotDeg, s);
  }

  /** Add raw BufferGeometry in local coordinates. */
  add(matName, geometry, color, m) {
    const mm = m ? m.clone().premultiply(this.M) : this.M;
    this.geo.add(matName, geometry, mm, color);
    return this;
  }

  shadow(u, z, rx, rz, rotDeg = 0) {
    const y = this.ground(u, z) + 0.015;
    const g = new THREE.PlaneGeometry(rx * 2, rz * 2);
    g.rotateX(-Math.PI / 2);
    this.geo.add('shadow', g, this.xf(u, y, z, rotDeg), [0, 0, 0]);
  }

  // ---- foreground props ----
  grass(n, o = {}) {
    const c1 = col(o.color ?? this.sp.grass), c2 = shade(c1, 0.7);
    const pos = [], nor = [], colr = [], idx = [];
    const u0 = o.u0 ?? -this.Rw + 0.3, u1 = o.u1 ?? this.Rw - 0.3, z0 = o.z0 ?? -0.15, z1 = o.z1 ?? -this.D * 0.8;
    const hgt = o.h ?? 0.4;
    for (let i = 0; i < n; i++) {
      const u = u0 + this.rnd() * (u1 - u0), z = z0 + this.rnd() * (z1 - z0);
      const y = this.ground(u, z);
      const blades = 5 + Math.floor(this.rnd() * 4);
      for (let b = 0; b < blades; b++) {
        const a = this.rnd() * 6.283, lean = 0.1 + this.rnd() * 0.25, h = hgt * (0.5 + this.rnd() * 0.8), w = 0.02 + this.rnd() * 0.025;
        const bx = u + Math.cos(a) * 0.04, bz = z + Math.sin(a) * 0.04;
        const tx = bx + Math.cos(a) * lean * h, tz = bz + Math.sin(a) * lean * h;
        const px = -Math.sin(a) * w, pz = Math.cos(a) * w;
        const k = pos.length / 3;
        pos.push(bx - px, y, bz - pz, bx + px, y, bz + pz, tx, y + h, tz);
        nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
        const cc = this.rnd() > 0.5 ? c1 : c2;
        colr.push(cc[0] * 0.7, cc[1] * 0.7, cc[2] * 0.7, cc[0] * 0.7, cc[1] * 0.7, cc[2] * 0.7, cc[0] * 1.15, cc[1] * 1.15, cc[2] * 1.15);
        idx.push(k, k + 1, k + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
    g.setIndex(idx);
    this.geo.add('dio_ds', g, this.M, null);
    return this;
  }

  rock(u, z, s = 0.4, color = 0x8a8478, flat = 0.7) {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const p = g.attributes.position;
    const sd = this.rnd() * 100;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), zz = p.getZ(i);
      const k = 0.78 + 0.4 * fbm(x * 1.3 + sd, y * 1.3 + zz * 1.7, 256, 3, 2);
      p.setXYZ(i, x * k, y * k * flat, zz * k);
    }
    g.computeVertexNormals();
    this.geo.add('dio', g, this.xf(u, this.ground(u, z) + s * flat * 0.25, z, this.rnd() * 360, s), color);
    return this;
  }

  rocks(n, s = 0.3, color = 0x8a8478, o = {}) {
    const u0 = o.u0 ?? -this.Rw + 0.4, u1 = o.u1 ?? this.Rw - 0.4, z0 = o.z0 ?? -0.3, z1 = o.z1 ?? -this.D * 0.8;
    for (let i = 0; i < n; i++) this.rock(u0 + this.rnd() * (u1 - u0), z0 + this.rnd() * (z1 - z0), s * (0.5 + this.rnd()), color);
    return this;
  }

  bush(u, z, s = 0.6, color) {
    const c = color ?? this.sp.grass;
    const y = this.ground(u, z);
    for (let i = 0; i < 4; i++) {
      const g = ellipsoid([(this.rnd() - 0.5) * s * 0.9, s * (0.3 + this.rnd() * 0.3), (this.rnd() - 0.5) * s * 0.6], [s * (0.35 + this.rnd() * 0.25), s * (0.28 + this.rnd() * 0.2), s * (0.3 + this.rnd() * 0.2)], { seg: 7, rings: 5 });
      this.geo.add('dio', g, this.xf(u, y, z), shade(c, 0.75 + this.rnd() * 0.5));
    }
    this.shadow(u, z, s * 0.8, s * 0.6);
    return this;
  }

  /** kind: 'acacia' | 'broadleaf' | 'conifer' | 'dead' | 'palm' | 'bamboo' */
  tree(kind, u, z, s = 3, color) {
    const y = this.ground(u, z);
    const leaf = color ?? ({ acacia: 0x56682e, broadleaf: 0x3f6a2c, conifer: 0x24402c, palm: 0x3f6e2c, bamboo: 0x6c9a40 }[kind] || 0x4a6a30);
    const bark = kind === 'bamboo' ? 0x9aa860 : 0x4a3a2a;
    const r = this.rnd;
    const M = this.xf(u, y, z, r() * 360);
    if (kind === 'bamboo') {
      for (let i = 0; i < 5; i++) {
        const bx = (r() - 0.5) * 0.5, bz = (r() - 0.5) * 0.4, h = s * (0.7 + r() * 0.5);
        this.geo.add('dio', tube([[bx, 0, bz], [bx + (r() - 0.5) * 0.2, h * 0.5, bz], [bx + (r() - 0.5) * 0.5, h, bz]], 0.035, { radial: 5, sub: 2 }), M, shade(bark, 0.8 + r() * 0.4));
        for (let k = 0; k < 3; k++) this.geo.add('dio', ellipsoid([bx + (r() - 0.5) * 0.7, h * (0.6 + r() * 0.4), bz + (r() - 0.5) * 0.5], [0.3, 0.04, 0.12], { seg: 5, rings: 3, rot: [r(), r() * 3, r()] }), M, shade(leaf, 0.8 + r() * 0.4));
      }
      return this;
    }
    const lean = (r() - 0.5) * 0.3 * s;
    const th = kind === 'conifer' ? s * 0.9 : s * 0.55;
    const tr = s * (kind === 'acacia' ? 0.045 : 0.06);
    this.geo.add('dio', tube([[0, -0.05, 0], [lean * 0.3, th * 0.5, 0], [lean, th, 0]], [tr * 1.5, tr, tr * 0.7], { radial: 6, sub: 3 }), M, bark);
    if (kind === 'acacia') {
      for (let i = 0; i < 3; i++) {
        const a = r() * 6.28, d = s * 0.25;
        this.geo.add('dio', tube([[lean, th * 0.9, 0], [lean + Math.cos(a) * d, th + s * 0.14, Math.sin(a) * d]], [tr * 0.6, tr * 0.3], { radial: 5, sub: 1 }), M, bark);
        this.geo.add('dio', ellipsoid([lean + Math.cos(a) * d * 1.2, th + s * 0.2, Math.sin(a) * d * 1.2], [s * 0.42, s * 0.07, s * 0.36], { seg: 9, rings: 5 }), M, shade(leaf, 0.8 + r() * 0.4));
      }
      this.geo.add('dio', ellipsoid([lean, th + s * 0.26, 0], [s * 0.5, s * 0.08, s * 0.45], { seg: 9, rings: 5 }), M, leaf);
    } else if (kind === 'conifer') {
      for (let i = 0; i < 5; i++) {
        const g = new THREE.ConeGeometry(s * 0.3 * (1 - i / 6.5), s * 0.36, 8);
        g.translate(lean * (0.2 + i * 0.16), s * (0.3 + i * 0.17), 0);
        this.geo.add('dio', g, M, shade(leaf, 0.85 + (i % 2) * 0.25));
      }
    } else if (kind === 'palm') {
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * 6.28;
        this.geo.add('dio', ellipsoid([lean + Math.cos(a) * s * 0.3, th - s * 0.02, Math.sin(a) * s * 0.3], [s * 0.34, s * 0.02, s * 0.07], { seg: 6, rings: 3, rot: [0, -a, -0.35] }), M, shade(leaf, 0.8 + r() * 0.4));
      }
    } else if (kind !== 'dead') {
      for (let i = 0; i < 6; i++) {
        this.geo.add('dio', ellipsoid([lean + (r() - 0.5) * s * 0.5, th + (r() - 0.2) * s * 0.35, (r() - 0.5) * s * 0.5], [s * (0.22 + r() * 0.14), s * (0.18 + r() * 0.1), s * (0.22 + r() * 0.14)], { seg: 8, rings: 6 }), M, shade(leaf, 0.75 + r() * 0.5));
      }
    } else {
      for (let i = 0; i < 4; i++) {
        const a = r() * 6.28;
        this.geo.add('dio', tube([[lean, th * (0.6 + r() * 0.4), 0], [lean + Math.cos(a) * s * 0.3, th + s * 0.2, Math.sin(a) * s * 0.3]], [tr * 0.6, tr * 0.2], { radial: 5, sub: 1 }), M, bark);
      }
    }
    this.shadow(u, z, s * 0.3, s * 0.3);
    return this;
  }

  /** Flat sheet (water, ice, snow) from u0..u1, z0..z1 at height y. */
  sheet(u0, z0, u1, z1, y, color, matName = 'dio') {
    const g = new THREE.PlaneGeometry(Math.abs(u1 - u0), Math.abs(z1 - z0));
    g.rotateX(-Math.PI / 2);
    g.translate((u0 + u1) / 2, y, (z0 + z1) / 2);
    this.geo.add(matName, g, this.M, color);
    return this;
  }

  mound(u, z, rx, ry, rz, color) {
    this.geo.add('dio', ellipsoid([0, 0, 0], [rx, ry, rz], { seg: 10, rings: 6 }), this.xf(u, this.ground(u, z), z), color);
    return this;
  }

  log(u, z, len = 1.6, r = 0.14, rotDeg = 20, color = 0x4a3a2a) {
    const g = new THREE.CylinderGeometry(r, r * 0.85, len, 8);
    g.rotateZ(Math.PI / 2);
    this.geo.add('dio', g, this.xf(u, this.ground(u, z) + r * 0.8, z, rotDeg), color);
    return this;
  }

  termite(u, z, h = 1.4) {
    const g = loft([{ p: [0, 0, 0], rx: h * 0.4, ry: h * 0.4 }, { p: [0.05, h * 0.4, 0], rx: h * 0.28, ry: h * 0.3 }, { p: [0, h * 0.75, 0.05], rx: h * 0.16, ry: h * 0.14 }, { p: [0.03, h, 0], rx: h * 0.05, ry: h * 0.05 }], { radial: 9, sub: 3, up: [1, 0, 0] });
    this.geo.add('dio', g, this.xf(u, this.ground(u, z) - 0.05, z, this.rnd() * 360), 0x9a6a44);
    return this;
  }
}

// ---- underwater helpers ----
/** Place a model at an absolute local height (swimming / flying / perched). tiltDeg pitches the nose up. */
Dio.prototype.swim = function (g, u, y, z, rotDeg = 0, s = 1, tiltDeg = 0) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotDeg * Math.PI / 180, tiltDeg * Math.PI / 180, 'YXZ'));
  const m = new THREE.Matrix4().compose(new THREE.Vector3(u, y, z), q, new THREE.Vector3(s, s, s)).premultiply(this.M);
  this.geo.addGeo(g, m, DIO_RENAME);
  return this;
};
Dio.prototype.kelp = function (u, z, h = 2.4, n = 3) {
  const y = this.ground(u, z);
  for (let i = 0; i < n; i++) {
    const bx = (this.rnd() - 0.5) * 0.5, bz = (this.rnd() - 0.5) * 0.4, ph = this.rnd() * 6;
    const pts = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([bx + Math.sin(t * 4 + ph) * 0.22, t * h * (0.8 + this.rnd() * 0.1), bz + Math.cos(t * 3 + ph) * 0.15]); }
    this.geo.add('dio', tube(pts, 0.025, { radial: 4, sub: 2 }), this.xf(u, y, z), 0x6a6a2a);
    for (let k = 1; k <= 6; k++) {
      const p = pts[k];
      this.geo.add('dio_ds', ellipsoid([p[0] + 0.16 * (k % 2 ? 1 : -1), p[1], p[2]], [0.2, 0.03, 0.07], { seg: 5, rings: 3, rot: [0, this.rnd() * 3, 0.5 * (k % 2 ? 1 : -1)] }), this.xf(u, y, z), k % 2 ? 0x7c7a30 : 0x8a8a3a);
    }
  }
  return this;
};
Dio.prototype.coral = function (u, z, s = 0.5, kind = 'branch', color = 0xd98a6a) {
  const y = this.ground(u, z);
  const M = this.xf(u, y, z, this.rnd() * 360, s);
  const r = this.rnd;
  if (kind === 'brain') {
    this.geo.add('dio', ellipsoid([0, 0.3, 0], [0.6, 0.45, 0.55], { seg: 10, rings: 7 }), M, color);
  } else if (kind === 'fan') {
    const pts = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; pts.push([Math.cos(a) * 0.7, Math.sin(a) * 1.0]); }
    pts.push([0.05, 0], [-0.05, 0]);
    const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
    this.geo.add('dio_ds', new THREE.ShapeGeometry(sh), M, color);
  } else if (kind === 'tube') {
    for (let i = 0; i < 5; i++) {
      const g = new THREE.CylinderGeometry(0.09, 0.06, 0.5 + r() * 0.5, 7, 1, true);
      g.translate((r() - 0.5) * 0.5, 0.3, (r() - 0.5) * 0.5);
      this.geo.add('dio_ds', g, M, shade(color, 0.8 + r() * 0.4));
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const a = r() * 6.28, l = 0.5 + r() * 0.6, sp = 0.2 + r() * 0.5;
      const mid = [Math.cos(a) * sp * 0.4, l * 0.5, Math.sin(a) * sp * 0.4], tip = [Math.cos(a) * sp, l, Math.sin(a) * sp];
      this.geo.add('dio', tube([[0, 0, 0], mid, tip], [0.07, 0.05, 0.025], { radial: 5, sub: 2 }), M, shade(color, 0.8 + r() * 0.4));
      const a2 = a + 1.2;
      this.geo.add('dio', tube([mid, [mid[0] + Math.cos(a2) * 0.25, mid[1] + 0.3, mid[2] + Math.sin(a2) * 0.25]], [0.04, 0.02], { radial: 5, sub: 1 }), M, shade(color, 0.9));
    }
  }
  return this;
};

/**
 * Build one diorama.
 * o: { x, z: centre of the opening on the false-wall FACE, y: hall floor height,
 *      face: compass direction the window faces (into the hall),
 *      w (5.4), h (3.2), sill (0.75), depth (3.6),
 *      biome, seed, rise, bumps, ground (colour override),
 *      scene: fn(dio) populating the alcove,
 *      title, sub, text, star, id  (label) }
 */
export function diorama(ctx, o) {
  o = { w: 5.4, h: 3.2, sill: 0.75, depth: 3.6, seed: 1, ...o };
  const sp = BIOMES[o.biome] || BIOMES.savanna;
  const geo = ctx.geo;
  const th = o.face * Math.PI / 180;
  const f = new THREE.Vector3(Math.sin(th), 0, -Math.cos(th)); // towards the viewer
  const right = new THREE.Vector3(-Math.cos(th), 0, -Math.sin(th));
  const y0 = o.y + o.sill - 0.02;
  const M = new THREE.Matrix4().makeBasis(right, new THREE.Vector3(0, 1, 0), f).setPosition(o.x, y0, o.z);
  const rnd = mulberry((o.seed || 1) * 9973 + Math.round(o.x * 13 + o.z * 7));
  const d = new Dio(geo, M, o, sp, rnd);
  const Rw = d.Rw, D = o.depth, Ht = o.h + 0.95;

  // backdrop: half-ellipse cylinder, facing inward
  const bd = backdropMat(o.biome || 'savanna', o.seed);
  const N = 22, yb = -0.35;
  const P = (a) => [-Rw * Math.cos(a), -D * Math.sin(a) - 0.12];
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N;
    const [u0, z0] = P(a0), [u1, z1] = P(a1);
    const w0 = new THREE.Vector3(u0, 0, z0).applyMatrix4(M), w1 = new THREE.Vector3(u1, 0, z1).applyMatrix4(M);
    geo.quad(bd, [w0.x, y0 + yb, w0.z], [w1.x, y0 + yb, w1.z], [w1.x, y0 + Ht, w1.z], [w0.x, y0 + Ht, w0.z],
      { uvs: [[i / N, 0], [(i + 1) / N, 0], [(i + 1) / N, 1], [i / N, 1]] });
  }
  // ceiling of the alcove in the zenith colour, side returns in shadow
  const sky = col(sp.sky[0]);
  const c0 = new THREE.Vector3(-Rw, Ht, 0).applyMatrix4(M), c1 = new THREE.Vector3(Rw, Ht, 0).applyMatrix4(M), c2 = new THREE.Vector3(Rw, Ht, -D - 0.2).applyMatrix4(M), c3 = new THREE.Vector3(-Rw, Ht, -D - 0.2).applyMatrix4(M);
  geo.quad('glow', [c0.x, c0.y, c0.z], [c3.x, c3.y, c3.z], [c2.x, c2.y, c2.z], [c1.x, c1.y, c1.z], { color: shade(sky, 0.9) });

  // terrain
  const gcol = col(o.ground ?? sp.ground), gcol2 = col(sp.grass);
  const nu = 18, nz = 10;
  const tg = new THREE.PlaneGeometry(1, 1, nu, nz);
  const tp = tg.attributes.position;
  const tcol = new Float32Array(tp.count * 3);
  for (let i = 0; i < tp.count; i++) {
    const u = (tp.getX(i)) * 2 * Rw, zz = -(tp.getY(i) + 0.5) * (D + 0.1);
    const t = fbm(u * 0.9 + 3, zz * 0.9 + (o.seed || 0), 512, 9, 3);
    const c = mixCol(gcol, gcol2, Math.max(0, Math.min(1, (t - 0.35) * 2.2)));
    const front = Math.min(1, 0.72 + (-zz) * 0.5);
    tcol[i * 3] = c[0] * front; tcol[i * 3 + 1] = c[1] * front; tcol[i * 3 + 2] = c[2] * front;
    tp.setXYZ(i, u, d.ground(u, zz), zz);
  }
  tg.setAttribute('color', new THREE.BufferAttribute(tcol, 3));
  tg.computeVertexNormals();
  // uv in metres for the ground texture
  const tuv = tg.attributes.uv;
  for (let i = 0; i < tp.count; i++) tuv.setXY(i, tp.getX(i), tp.getZ(i));
  geo.add('dioground', tg, M, null);
  // front lip below the glass (hides the terrain edge)
  const l0 = new THREE.Vector3(-o.w / 2, 0, -0.02).applyMatrix4(M), l1 = new THREE.Vector3(o.w / 2, 0, -0.02).applyMatrix4(M);
  geo.wall('dio', l0.x, l0.z, l1.x, l1.z, y0 - 0.3, y0 + 0.02, { color: shade(gcol, 0.5) });

  // contents
  if (o.scene) o.scene(d);

  // glass + bronze frame on the wall face
  const fw = 0.11, fo = 0.05;
  const fr = (u0, ya, u1, yb2, colr) => {
    const g = new THREE.BoxGeometry(Math.abs(u1 - u0), Math.abs(yb2 - ya), fo * 2);
    g.translate((u0 + u1) / 2, (ya + yb2) / 2, 0);
    geo.add('bronze', g, _m.copy(M).multiply(new THREE.Matrix4().makeTranslation(0, 0.02, 0)), colr);
  };
  const fc = o.frameCol ?? 0x7a5e34;
  fr(-o.w / 2 - fw, -fw, o.w / 2 + fw, 0, fc);
  fr(-o.w / 2 - fw, o.h, o.w / 2 + fw, o.h + fw, fc);
  fr(-o.w / 2 - fw, 0, -o.w / 2, o.h, fc);
  fr(o.w / 2, 0, o.w / 2 + fw, o.h, fc);
  const g0 = new THREE.Vector3(-o.w / 2, 0, -0.03).applyMatrix4(M), g1 = new THREE.Vector3(o.w / 2, 0, -0.03).applyMatrix4(M);
  geo.wall('glass', g0.x, g0.z, g1.x, g1.z, y0 + 0.02, y0 + 0.02 + o.h, { color: 0xcfe0e8 });

  // glow spilling onto the hall floor
  if (o.light !== false) ctx.lights.anchor(o.x + f.x * 1.6, o.y + o.sill + o.h * 0.55, o.z + f.z * 1.6, { color: o.lightCol ?? 0xffe6c0, intensity: o.lightInt ?? 14, dist: 13 });

  // label on the rail beneath the window
  if (o.title) {
    const lu = Math.min(o.w / 2 - 0.5, 1.2);
    const lp = new THREE.Vector3(lu, 0, 0).applyMatrix4(M);
    const tgt = new THREE.Vector3(0, 1.3, -D * 0.45).applyMatrix4(M);
    placard(ctx, {
      id: o.id, title: o.title, sub: o.sub, text: o.text, star: o.star, kind: 'wall', size: 0.6,
      x: lp.x, y: o.y + o.sill - 0.36, z: lp.z, face: o.face, floorY: o.y,
      target: [tgt.x, tgt.y, tgt.z],
      view: { x: o.x + f.x * 3.4, y: o.y, z: o.z + f.z * 3.4, yaw: (o.face + 180) % 360, pitch: 2 },
    });
  }
  return d;
}

/**
 * A false wall lined with dioramas.
 * o: { side: 'n'|'s'|'w'|'e' (which wall of the room), a, b (extent along the wall, world coords),
 *      depth (distance of the face from the room wall, default 4.3), y, h (wall height),
 *      wallMat, wallCol, items: [{ at (centre along wall), ...diorama options }] }
 */
export function dioramaRun(ctx, o) {
  const room = ctx.room;
  const depth = o.depth ?? 4.3;
  const y = o.y ?? room.y, h = o.h ?? room.h;
  const st = room.st;
  const wm = o.wallMat ?? st.wall, wc = o.wallCol ?? st.wallCol;
  const { geo, phys } = ctx;
  const side = o.side;
  // face position + facing
  let face, pt, box;
  if (side === 'n') { const z = room.z0 + depth; face = 180; pt = (t) => [t, z]; box = [o.a, room.z0, o.b, z]; }
  else if (side === 's') { const z = room.z1 - depth; face = 0; pt = (t) => [t, z]; box = [o.a, z, o.b, room.z1]; }
  else if (side === 'w') { const x = room.x0 + depth; face = 90; pt = (t) => [x, t]; box = [room.x0, o.a, x, o.b]; }
  else { const x = room.x1 - depth; face = 270; pt = (t) => [x, t]; box = [x, o.a, room.x1, o.b]; }
  const items = o.items.map((it) => ({ w: 5.4, h: 3.2, sill: 0.75, ...it }));
  const ops = items.map((it) => ({ a: it.at - it.w / 2, b: it.at + it.w / 2, ya: y + it.sill, yb: y + it.sill + it.h }));
  const sol = solids(o.a, o.b, y, y + h, ops);
  // wall() normal is (-dz,0,dx) for p0->p1. n-side face looks +z: go +x. s: go -x. w (faces +x): go -z. e: go +z.
  const fwd = side === 'n' || side === 'e';
  for (const [a, b, ya, yb] of sol) {
    const p0 = pt(fwd ? a : b), p1 = pt(fwd ? b : a);
    const k0 = 0.78 + 0.22 * Math.min(1, (ya - y) / 2.4), k1 = 0.78 + 0.22 * Math.min(1, (yb - y) / 2.4);
    geo.wall(wm, p0[0], p0[1], p1[0], p1[1], ya, yb, { cBot: shade(wc, k0), cTop: shade(wc, Math.min(k1, 0.84 + 0.16 * Math.min(1, (y + h - yb) / 2))), u0: a });
  }
  // base band
  {
    const p0 = pt(fwd ? o.a : o.b), p1 = pt(fwd ? o.b : o.a);
    const off = 0.012, f = face * Math.PI / 180, ox = Math.sin(f) * off, oz = -Math.cos(f) * off;
    geo.wall('satin', p0[0] + ox, p0[1] + oz, p1[0] + ox, p1[1] + oz, y, y + 0.2, { color: st.base });
  }
  // end returns
  const ends = [[o.a, true], [o.b, false]];
  for (const [t, isA] of ends) {
    const pf = pt(t);
    let pw;
    if (side === 'n') pw = [t, room.z0]; else if (side === 's') pw = [t, room.z1]; else if (side === 'w') pw = [room.x0, t]; else pw = [room.x1, t];
    // choose winding so the return faces away from the run
    const mid = pt((o.a + o.b) / 2);
    const nx = -(pw[1] - pf[1]), nz = (pw[0] - pf[0]);
    const out = (pf[0] - mid[0]) * nx + (pf[1] - mid[1]) * nz;
    if (out > 0) geo.wall(wm, pf[0], pf[1], pw[0], pw[1], y, y + h, { cBot: shade(wc, 0.7), cTop: shade(wc, 0.85) });
    else geo.wall(wm, pw[0], pw[1], pf[0], pf[1], y, y + h, { cBot: shade(wc, 0.7), cTop: shade(wc, 0.85) });
    void isA;
  }
  phys.box(box[0], box[1], box[2], box[3], y, y + h);
  const out = [];
  for (const it of items) {
    const p = pt(it.at);
    out.push(diorama(ctx, { depth: depth - 0.55, ...it, x: p[0], z: p[1], y, face }));
  }
  return out;
}

export { DIO_RENAME };
