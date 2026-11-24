// Low-level mesh accumulator for the skeleton library.
// Skeletons are made of thousands of tiny pieces (vertebrae, ribs, teeth), so instead of building a
// BufferGeometry per bone we append straight into flat arrays and hand ONE geometry per material to Geo.
import * as THREE from 'three';

export class MB {
  constructor() {
    this.pos = []; this.nor = []; this.col = []; this.idx = [];
    this.c = [1, 1, 1];
  }
  get count() { return this.pos.length / 3; }

  /**
   * Elliptical tube through pts ([x,y,z] each). rx / ry: number or per-point array.
   * ry lies along o.up (projected, then parallel-transported), rx along tangent x up.
   * o.radial (6), o.color, o.cap ('both' | 'none' | 'start' | 'end'), o.phase (ring rotation).
   */
  tube(pts, rx, ry, o = {}) {
    const n = pts.length;
    if (n < 2) return this;
    const radial = o.radial || 6, c = o.color || this.c, phase = o.phase || 0;
    const pos = this.pos, nor = this.nor, colr = this.col, idx = this.idx;
    const base = pos.length / 3;
    let ux = 0, uy = 1, uz = 0;
    if (o.up) { ux = o.up[0]; uy = o.up[1]; uz = o.up[2]; }
    let t0x = 0, t0y = 0, t0z = 0, tnx = 0, tny = 0, tnz = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i > 0 ? i - 1 : 0], b = pts[i < n - 1 ? i + 1 : n - 1], p = pts[i];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
      let l = Math.hypot(tx, ty, tz) || 1;
      tx /= l; ty /= l; tz /= l;
      let d = ux * tx + uy * ty + uz * tz;
      ux -= tx * d; uy -= ty * d; uz -= tz * d;
      l = Math.hypot(ux, uy, uz);
      if (l < 1e-4) {
        if (Math.abs(tx) < 0.9) { ux = 1; uy = 0; uz = 0; } else { ux = 0; uy = 0; uz = 1; }
        d = ux * tx + uy * ty + uz * tz;
        ux -= tx * d; uy -= ty * d; uz -= tz * d;
        l = Math.hypot(ux, uy, uz);
      }
      ux /= l; uy /= l; uz /= l;
      const sx = ty * uz - tz * uy, sy = tz * ux - tx * uz, sz = tx * uy - ty * ux;
      const a1 = typeof rx === 'number' ? rx : rx[i];
      const b1 = ry == null ? a1 : (typeof ry === 'number' ? ry : ry[i]);
      for (let k = 0; k < radial; k++) {
        const ang = (k / radial) * Math.PI * 2 + phase;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        pos.push(p[0] + sx * ca * a1 + ux * sa * b1, p[1] + sy * ca * a1 + uy * sa * b1, p[2] + sz * ca * a1 + uz * sa * b1);
        let nx, ny, nz;
        if (a1 > 1e-6 && b1 > 1e-6) {
          nx = sx * ca * b1 + ux * sa * a1; ny = sy * ca * b1 + uy * sa * a1; nz = sz * ca * b1 + uz * sa * a1;
        } else { nx = sx * ca + ux * sa; ny = sy * ca + uy * sa; nz = sz * ca + uz * sa; }
        const nl = Math.hypot(nx, ny, nz) || 1;
        nor.push(nx / nl, ny / nl, nz / nl);
        colr.push(c[0], c[1], c[2]);
      }
      if (i === 0) { t0x = tx; t0y = ty; t0z = tz; }
      if (i === n - 1) { tnx = tx; tny = ty; tnz = tz; }
    }
    for (let i = 0; i < n - 1; i++) {
      for (let k = 0; k < radial; k++) {
        const a = base + i * radial + k, b = base + i * radial + (k + 1) % radial, cc = a + radial, dd = b + radial;
        idx.push(a, cc, b, b, cc, dd);
      }
    }
    const cap = o.cap || 'both';
    const r0 = Math.min(typeof rx === 'number' ? rx : rx[0], ry == null ? 1e9 : (typeof ry === 'number' ? ry : ry[0]));
    const rn = Math.min(typeof rx === 'number' ? rx : rx[n - 1], ry == null ? 1e9 : (typeof ry === 'number' ? ry : ry[n - 1]));
    if ((cap === 'both' || cap === 'start') && r0 > 1e-5) {
      const p = pts[0], bl = r0 * (o.bulge ?? 0.5), ci = pos.length / 3;
      pos.push(p[0] - t0x * bl, p[1] - t0y * bl, p[2] - t0z * bl); nor.push(-t0x, -t0y, -t0z); colr.push(c[0], c[1], c[2]);
      for (let k = 0; k < radial; k++) idx.push(ci, base + k, base + (k + 1) % radial);
    }
    if ((cap === 'both' || cap === 'end') && rn > 1e-5) {
      const p = pts[n - 1], bl = rn * (o.bulge ?? 0.5), ci = pos.length / 3, b0 = base + (n - 1) * radial;
      pos.push(p[0] + tnx * bl, p[1] + tny * bl, p[2] + tnz * bl); nor.push(tnx, tny, tnz); colr.push(c[0], c[1], c[2]);
      for (let k = 0; k < radial; k++) idx.push(ci, b0 + (k + 1) % radial, b0 + k);
    }
    return this;
  }

  /** Long bone a -> b with swollen ends. o.knob (1.6), o.bow [x,y,z] sideways bow at mid-shaft, o.flat (ry/rx ratio). */
  bone(a, b, ra, rb = ra, o = {}) {
    const k = o.knob ?? 1.6, bw = o.bow;
    const T = [0, 0.07, 0.2, 0.5, 0.8, 0.93, 1];
    const R = [ra * k * 0.75, ra * k, ra * 1.08, (ra + rb) * 0.45, rb * 1.08, rb * k, rb * k * 0.75];
    const pts = T.map((t) => {
      const w = bw ? 4 * t * (1 - t) : 0;
      return [a[0] + (b[0] - a[0]) * t + (bw ? bw[0] * w : 0), a[1] + (b[1] - a[1]) * t + (bw ? bw[1] * w : 0), a[2] + (b[2] - a[2]) * t + (bw ? bw[2] * w : 0)];
    });
    return this.tube(pts, R, o.flat ? R.map((r) => r * o.flat) : null, { radial: o.radial || 6, color: o.color, up: o.up });
  }

  /** Ellipsoid; o.axes = [X,Y,Z] basis (unit vectors), o.seg (8), o.rings (5). */
  ellipsoid(c, r, o = {}) {
    const seg = o.seg || 8, rings = o.rings || 5, cl = o.color || this.c;
    const ax = o.axes || AXES;
    const X = ax[0], Y = ax[1], Z = ax[2];
    const det = X[0] * (Y[1] * Z[2] - Y[2] * Z[1]) - X[1] * (Y[0] * Z[2] - Y[2] * Z[0]) + X[2] * (Y[0] * Z[1] - Y[1] * Z[0]);
    const pos = this.pos, nor = this.nor, colr = this.col, idx = this.idx;
    const base = pos.length / 3;
    const put = (a, b, cc) => {
      pos.push(c[0] + X[0] * a * r[0] + Y[0] * b * r[1] + Z[0] * cc * r[2], c[1] + X[1] * a * r[0] + Y[1] * b * r[1] + Z[1] * cc * r[2], c[2] + X[2] * a * r[0] + Y[2] * b * r[1] + Z[2] * cc * r[2]);
      const na = a / r[0], nb = b / r[1], nc = cc / r[2];
      const nx = X[0] * na + Y[0] * nb + Z[0] * nc, ny = X[1] * na + Y[1] * nb + Z[1] * nc, nz = X[2] * na + Y[2] * nb + Z[2] * nc;
      const l = Math.hypot(nx, ny, nz) || 1;
      nor.push(nx / l, ny / l, nz / l);
      colr.push(cl[0], cl[1], cl[2]);
    };
    put(0, 1, 0);
    for (let i = 1; i < rings; i++) {
      const ph = (i / rings) * Math.PI, sp = Math.sin(ph), cp = Math.cos(ph);
      for (let k = 0; k < seg; k++) { const th = (k / seg) * Math.PI * 2; put(sp * Math.cos(th), cp, sp * Math.sin(th)); }
    }
    put(0, -1, 0);
    const last = base + 1 + (rings - 1) * seg;
    const tri = det >= 0 ? (a, b, cc) => idx.push(a, b, cc) : (a, b, cc) => idx.push(a, cc, b);
    for (let k = 0; k < seg; k++) {
      const k1 = (k + 1) % seg;
      tri(base, base + 1 + k1, base + 1 + k);
      for (let i = 0; i < rings - 2; i++) {
        const a = base + 1 + i * seg + k, b = base + 1 + i * seg + k1, cc = a + seg, dd = b + seg;
        tri(a, b, cc); tri(b, dd, cc);
      }
      tri(last, last - seg + k, last - seg + k1);
    }
    return this;
  }

  /** Recompute smooth normals for vertices >= v0 from triangles starting at index offset i0. */
  normals(v0, i0) {
    const pos = this.pos, nor = this.nor, idx = this.idx;
    for (let i = v0 * 3; i < nor.length; i++) nor[i] = 0;
    for (let i = i0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      const e1x = pos[b] - pos[a], e1y = pos[b + 1] - pos[a + 1], e1z = pos[b + 2] - pos[a + 2];
      const e2x = pos[c] - pos[a], e2y = pos[c + 1] - pos[a + 1], e2z = pos[c + 2] - pos[a + 2];
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz;
      nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz;
      nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
    }
    for (let i = v0 * 3; i < nor.length; i += 3) {
      const l = Math.hypot(nor[i], nor[i + 1], nor[i + 2]) || 1;
      nor[i] /= l; nor[i + 1] /= l; nor[i + 2] /= l;
    }
    return this;
  }

  /**
   * Thick plate from a 2-D outline with holes. map(u, v, layer) -> [x,y,z]; layer 0 = front face
   * (the face from which a counter-clockwise (u,v) triangle looks counter-clockwise), 1 = back face.
   * o.flip reverses the winding (use for mirrored copies). o.color or o.colorFn(u, v) -> triple.
   * o.single: only the front face, no rim (for double-sided materials).
   */
  poly(outline, holes, map, o = {}) {
    const rings = [outline, ...(holes || [])];
    const contour = outline.map((p) => new THREE.Vector2(p[0], p[1]));
    const hs = (holes || []).map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
    const faces = THREE.ShapeUtils.triangulateShape(contour, hs);
    const all = [];
    for (const r of rings) for (const p of r) all.push(p);
    const N = all.length, base = this.count, i0 = this.idx.length;
    const cl = o.color || this.c;
    const layers = o.single ? 1 : 2;
    for (let layer = 0; layer < layers; layer++) {
      for (const p of all) {
        const q = map(p[0], p[1], layer);
        this.pos.push(q[0], q[1], q[2]); this.nor.push(0, 0, 0);
        const c = o.colorFn ? o.colorFn(p[0], p[1], layer) : cl;
        this.col.push(c[0], c[1], c[2]);
      }
    }
    const flip = !!o.flip;
    const tri = (a, b, c) => { if (flip) this.idx.push(base + a, base + c, base + b); else this.idx.push(base + a, base + b, base + c); };
    for (const f of faces) {
      let [a, b, c] = f;
      const pa = all[a], pb = all[b], pc = all[c];
      const area = (pb[0] - pa[0]) * (pc[1] - pa[1]) - (pc[0] - pa[0]) * (pb[1] - pa[1]);
      if (area < 0) { const t = b; b = c; c = t; }
      tri(a, b, c);
      if (layers === 2) tri(N + a, N + c, N + b);
    }
    if (layers === 2) {
      let off = 0;
      rings.forEach((r, ri) => {
        let area = 0;
        for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; area += p[0] * q[1] - q[0] * p[1]; }
        const ccw = area > 0;
        const rev = ri === 0 ? !ccw : ccw;
        for (let i = 0; i < r.length; i++) {
          const a = off + i, b = off + (i + 1) % r.length;
          if (!rev) { tri(a, N + b, b); tri(a, N + a, N + b); } else { tri(a, b, N + b); tri(a, N + b, N + a); }
        }
        off += r.length;
      });
    }
    return this.normals(base, i0);
  }

  /** Surface through a grid of points rows[i][j]. o.flip, o.color or o.colors[i][j]. */
  grid(rows, o = {}) {
    const base = this.count, i0 = this.idx.length, cl = o.color || this.c;
    const m = rows[0].length;
    for (let i = 0; i < rows.length; i++) for (let j = 0; j < m; j++) {
      const p = rows[i][j];
      this.pos.push(p[0], p[1], p[2]); this.nor.push(0, 0, 0);
      const c = o.colors ? o.colors[i][j] : cl;
      this.col.push(c[0], c[1], c[2]);
    }
    for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < m - 1; j++) {
      const a = base + i * m + j, b = a + 1, c = a + m, d = c + 1;
      if (o.flip) this.idx.push(a, b, c, b, d, c); else this.idx.push(a, c, b, b, c, d);
    }
    return this.normals(base, i0);
  }

  /** Append another MB transformed by a Matrix4. */
  merge(other, m) {
    const base = this.count;
    const e = m ? m.elements : null;
    const P = other.pos, Nn = other.nor;
    if (!e) {
      for (let i = 0; i < P.length; i++) { this.pos.push(P[i]); this.nor.push(Nn[i]); }
    } else {
      const nm = new THREE.Matrix3().getNormalMatrix(m).elements;
      for (let i = 0; i < P.length; i += 3) {
        const x = P[i], y = P[i + 1], z = P[i + 2];
        this.pos.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
        const a = Nn[i], b = Nn[i + 1], c = Nn[i + 2];
        const nx = nm[0] * a + nm[3] * b + nm[6] * c, ny = nm[1] * a + nm[4] * b + nm[7] * c, nz = nm[2] * a + nm[5] * b + nm[8] * c;
        const l = Math.hypot(nx, ny, nz) || 1;
        this.nor.push(nx / l, ny / l, nz / l);
      }
    }
    for (let i = 0; i < other.col.length; i++) this.col.push(other.col[i]);
    const flip = m && m.determinant() < 0;
    const I = other.idx;
    for (let i = 0; i < I.length; i += 3) {
      if (flip) this.idx.push(I[i] + base, I[i + 2] + base, I[i + 1] + base);
      else this.idx.push(I[i] + base, I[i + 1] + base, I[i + 2] + base);
    }
    return this;
  }

  minY() { let m = Infinity; const P = this.pos; for (let i = 1; i < P.length; i += 3) if (P[i] < m) m = P[i]; return m; }
  maxY() { let m = -Infinity; const P = this.pos; for (let i = 1; i < P.length; i += 3) if (P[i] > m) m = P[i]; return m; }

  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    return g;
  }
}

const AXES = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
