// Geometry accumulator: everything static in the museum is merged into a few
// big meshes per room (one per material) to keep draw calls low.
import * as THREE from 'three';
import { mat } from './materials.js';

const _color = new THREE.Color();
const colorCache = new Map();

/** Convert a hex colour (sRGB) or [r,g,b] linear triple to a linear triple. */
export function col(c) {
  if (c == null) return WHITE;
  if (Array.isArray(c)) return c;
  let v = colorCache.get(c);
  if (!v) {
    _color.set(c);
    v = [_color.r, _color.g, _color.b];
    colorCache.set(c, v);
  }
  return v;
}
const WHITE = [1, 1, 1];

/** Scale a colour triple. */
export function shade(c, k) {
  c = col(c);
  return [c[0] * k, c[1] * k, c[2] * k];
}
export function mixCol(a, b, t) {
  a = col(a); b = col(b);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const _m3 = new THREE.Matrix3();
const IDENT = new THREE.Matrix4();

export class Geo {
  constructor() {
    this.buckets = new Map();
  }

  _bucket(name) {
    let b = this.buckets.get(name);
    if (!b) {
      b = { chunks: [], nv: 0, ni: 0 };
      this.buckets.set(name, b);
    }
    return b;
  }

  _push(name, pos, nor, uv, colr, idx) {
    const b = this._bucket(name);
    b.chunks.push({ pos, nor, uv, col: colr, idx, base: b.nv });
    b.nv += pos.length / 3;
    b.ni += idx.length;
  }

  /**
   * Merge a BufferGeometry.
   * @param {string} name material name (see materials.js)
   * @param {THREE.BufferGeometry} g
   * @param {THREE.Matrix4} [m] transform
   * @param {number|number[]|Function} [color] hex, linear triple, or fn(x,y,z,i)->triple evaluated on
   *        LOCAL (untransformed) coordinates. If the geometry has a colour attribute it is multiplied in.
   */
  add(name, g, m, color) {
    m = m || IDENT;
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, C = g.attributes.color;
    const n = P.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), cl = new Float32Array(n * 3);
    const e = m.elements;
    _m3.getNormalMatrix(m);
    const ne = _m3.elements;
    const fn = typeof color === 'function' ? color : null;
    const cc = fn ? null : col(color);
    const pa = P.array, na = N ? N.array : null;
    const pItem = P.itemSize;
    for (let i = 0; i < n; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      pos[i * 3] = e[0] * x + e[4] * y + e[8] * z + e[12];
      pos[i * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
      pos[i * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      if (N) {
        const a = N.getX(i), b = N.getY(i), c = N.getZ(i);
        let nx = ne[0] * a + ne[3] * b + ne[6] * c;
        let ny = ne[1] * a + ne[4] * b + ne[7] * c;
        let nz = ne[2] * a + ne[5] * b + ne[8] * c;
        const l = Math.hypot(nx, ny, nz) || 1;
        nor[i * 3] = nx / l; nor[i * 3 + 1] = ny / l; nor[i * 3 + 2] = nz / l;
      } else {
        nor[i * 3 + 1] = 1;
      }
      if (U) { uv[i * 2] = U.getX(i); uv[i * 2 + 1] = U.getY(i); }
      let r, gg, bb;
      if (fn) { const t = fn(x, y, z, i); r = t[0]; gg = t[1]; bb = t[2]; }
      else { r = cc[0]; gg = cc[1]; bb = cc[2]; }
      if (C) { r *= C.getX(i); gg *= C.getY(i); bb *= C.getZ(i); }
      cl[i * 3] = r; cl[i * 3 + 1] = gg; cl[i * 3 + 2] = bb;
    }
    let idx;
    if (g.index) {
      idx = new Uint32Array(g.index.array);
    } else {
      idx = new Uint32Array(n);
      for (let i = 0; i < n; i++) idx[i] = i;
    }
    // mirrored transforms flip winding
    if (m.determinant() < 0) {
      for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
    }
    this._push(name, pos, nor, uv, cl, idx);
    return this;
  }

  /** Merge another Geo (optionally transformed). rename: {fromMaterial: toMaterial} remaps buckets (e.g. into self-lit diorama materials). */
  addGeo(other, m, rename) {
    for (const [name0, b] of other.buckets) {
      const name = (rename && rename[name0]) || name0;
      for (const ch of b.chunks) {
        if (!m) { this._push(name, ch.pos, ch.nor, ch.uv, ch.col, ch.idx); continue; }
        const n = ch.pos.length / 3;
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
        const e = m.elements;
        _m3.getNormalMatrix(m);
        const ne = _m3.elements;
        for (let i = 0; i < n; i++) {
          const x = ch.pos[i * 3], y = ch.pos[i * 3 + 1], z = ch.pos[i * 3 + 2];
          pos[i * 3] = e[0] * x + e[4] * y + e[8] * z + e[12];
          pos[i * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
          pos[i * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
          const a = ch.nor[i * 3], b2 = ch.nor[i * 3 + 1], c = ch.nor[i * 3 + 2];
          const nx = ne[0] * a + ne[3] * b2 + ne[6] * c, ny = ne[1] * a + ne[4] * b2 + ne[7] * c, nz = ne[2] * a + ne[5] * b2 + ne[8] * c;
          const l = Math.hypot(nx, ny, nz) || 1;
          nor[i * 3] = nx / l; nor[i * 3 + 1] = ny / l; nor[i * 3 + 2] = nz / l;
        }
        let idx = ch.idx;
        if (m.determinant() < 0) {
          idx = new Uint32Array(idx);
          for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
        }
        this._push(name, pos, nor, ch.uv, ch.col, idx);
      }
    }
    return this;
  }

  /**
   * Quad a,b,c,d (counter-clockwise seen from the front). Each is [x,y,z].
   * o.color: colour for all verts, or o.colors: [ca,cb,cc,cd].
   * o.uvs: [[u,v]x4]; default derives metre-scaled uvs from edge lengths.
   */
  quad(name, a, b, c, d, o = {}) {
    const pos = new Float32Array([a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]]);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    const nor = new Float32Array([nx, ny, nz, nx, ny, nz, nx, ny, nz, nx, ny, nz]);
    let uv;
    if (o.uvs) {
      uv = new Float32Array([o.uvs[0][0], o.uvs[0][1], o.uvs[1][0], o.uvs[1][1], o.uvs[2][0], o.uvs[2][1], o.uvs[3][0], o.uvs[3][1]]);
    } else {
      const w = Math.hypot(ux, uy, uz), h = Math.hypot(vx, vy, vz);
      const u0 = o.u0 || 0, v0 = o.v0 || 0;
      uv = new Float32Array([u0, v0, u0 + w, v0, u0 + w, v0 + h, u0, v0 + h]);
    }
    const cl = new Float32Array(12);
    if (o.colors) {
      for (let i = 0; i < 4; i++) { const c4 = col(o.colors[i]); cl[i * 3] = c4[0]; cl[i * 3 + 1] = c4[1]; cl[i * 3 + 2] = c4[2]; }
    } else {
      const c4 = col(o.color);
      for (let i = 0; i < 4; i++) { cl[i * 3] = c4[0]; cl[i * 3 + 1] = c4[1]; cl[i * 3 + 2] = c4[2]; }
    }
    this._push(name, pos, nor, uv, cl, QUAD_IDX);
    return this;
  }

  /** Horizontal quad facing up at height y. uv = (x,z) metres. */
  floor(name, x0, z0, x1, z1, y, o = {}) {
    return this.quad(name, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0],
      { ...o, uvs: [[x0, z1], [x1, z1], [x1, z0], [x0, z0]] });
  }

  /** Horizontal quad facing down at height y. */
  ceil(name, x0, z0, x1, z1, y, o = {}) {
    return this.quad(name, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1],
      { ...o, uvs: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]] });
  }

  /**
   * Vertical quad running from (x0,z0) to (x1,z1), between heights y0..y1.
   * Faces normal (-dz,0,dx): i.e. walking from p0 to p1 the face points to your LEFT
   * when +z is "towards you" (right-handed, y up).
   * o.color or o.cBot / o.cTop for a vertical gradient. o.u0 shifts the u coordinate.
   */
  wall(name, x0, z0, x1, z1, y0, y1, o = {}) {
    const L = Math.hypot(x1 - x0, z1 - z0);
    const u0 = o.u0 || 0;
    const cb = o.cBot || o.color, ct = o.cTop || o.color;
    return this.quad(name, [x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0],
      { colors: [cb, cb, ct, ct], uvs: [[u0, y0], [u0 + L, y0], [u0 + L, y1], [u0, y1]] });
  }

  /**
   * Axis-aligned box. o.color; o.skip = string containing any of 'x-','x+','y-','y+','z-','z+'
   * faces to omit; o.colors = {top, bottom, side} optional overrides.
   */
  box(name, x0, y0, z0, x1, y1, z1, o = {}) {
    if (x0 > x1) [x0, x1] = [x1, x0];
    if (y0 > y1) [y0, y1] = [y1, y0];
    if (z0 > z1) [z0, z1] = [z1, z0];
    const s = o.skip || '';
    const side = o.side || o.color, top = o.top || o.color, bot = o.bottom || o.color;
    if (!s.includes('y+')) this.floor(name, x0, z0, x1, z1, y1, { color: top });
    if (!s.includes('y-')) this.ceil(name, x0, z0, x1, z1, y0, { color: bot });
    if (!s.includes('z+')) this.wall(name, x0, z1, x1, z1, y0, y1, { color: side, u0: x0 });
    if (!s.includes('z-')) this.wall(name, x1, z0, x0, z0, y0, y1, { color: side, u0: -x1 });
    if (!s.includes('x+')) this.wall(name, x1, z1, x1, z0, y0, y1, { color: side, u0: -z1 });
    if (!s.includes('x-')) this.wall(name, x0, z0, x0, z1, y0, y1, { color: side, u0: z0 });
    return this;
  }

  /** Box centred at (cx, cz) sitting on y0, rotated by rot about Y. */
  rbox(name, cx, y0, cz, w, h, d, rot = 0, o = {}) {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Matrix4().makeRotationY(rot).setPosition(cx, y0 + h / 2, cz);
    this.add(name, g, m, o.color);
    g.dispose();
    return this;
  }

  /** Vertical cylinder / cone / prism. */
  cyl(name, cx, y0, cz, r, h, o = {}) {
    const g = new THREE.CylinderGeometry(o.rTop ?? r, r, h, o.seg || 16, 1, !!o.open);
    const m = new THREE.Matrix4().makeTranslation(cx, y0 + h / 2, cz);
    this.add(name, g, m, o.color);
    g.dispose();
    return this;
  }

  /** Build meshes and attach to parent. Returns the meshes. */
  build(parent, opts = {}) {
    const out = [];
    for (const [name, b] of this.buckets) {
      if (!b.nv) continue;
      const pos = new Float32Array(b.nv * 3), nor = new Float32Array(b.nv * 3), uv = new Float32Array(b.nv * 2), cl = new Float32Array(b.nv * 3);
      const idx = new Uint32Array(b.ni);
      let io = 0;
      for (const ch of b.chunks) {
        pos.set(ch.pos, ch.base * 3);
        nor.set(ch.nor, ch.base * 3);
        uv.set(ch.uv, ch.base * 2);
        cl.set(ch.col, ch.base * 3);
        const ci = ch.idx, base = ch.base;
        for (let i = 0; i < ci.length; i++) idx[io++] = ci[i] + base;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setAttribute('color', new THREE.BufferAttribute(cl, 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.computeBoundingSphere();
      g.computeBoundingBox();
      const mesh = new THREE.Mesh(g, mat(name));
      mesh.name = (opts.name || 'geo') + ':' + name;
      mesh.matrixAutoUpdate = false;
      const mm = mat(name);
      if (mm.userData.renderOrder) mesh.renderOrder = mm.userData.renderOrder;
      if (parent) parent.add(mesh);
      out.push(mesh);
    }
    this.buckets.clear();
    return out;
  }

  /** Vertex count so far (for stats). */
  get vertexCount() {
    let n = 0;
    for (const b of this.buckets.values()) n += b.nv;
    return n;
  }
}

const QUAD_IDX = new Uint32Array([0, 1, 2, 0, 2, 3]);

// ---------------------------------------------------------------------------
// small math helpers shared by model code
// ---------------------------------------------------------------------------
export function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Transform helper: T(x,y,z) * Ry(rot) * S(s). */
export function xform(x = 0, y = 0, z = 0, rotY = 0, s = 1) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
  const sv = typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(s[0], s[1], s[2]);
  m.compose(new THREE.Vector3(x, y, z), q, sv);
  return m;
}

/** Matrix that maps the unit Y axis segment [0,1] onto a->b (for bones/cylinders), scaled by radius. */
export function alignY(a, b, r = 1) {
  const va = new THREE.Vector3(a[0], a[1], a[2]);
  const vb = new THREE.Vector3(b[0], b[1], b[2]);
  const dir = vb.clone().sub(va);
  const len = dir.length() || 1e-6;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.divideScalar(len));
  return new THREE.Matrix4().compose(va, q, new THREE.Vector3(r, len, r));
}
