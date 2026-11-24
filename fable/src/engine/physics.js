// Lightweight walk physics: a vertical capsule (circle in XZ) against boxes,
// oriented boxes and cylinders, standing on flat / ramp / spiral ground patches.
const CELL = 8;
const STEP = 0.55; // max step-up height

export class Physics {
  constructor() {
    this.cols = [];
    this.grounds = [];
    this.gc = new Map();
    this.gg = new Map();
    this.final = false;
  }

  // ---- colliders ---------------------------------------------------------
  /** Axis-aligned solid box. */
  box(x0, z0, x1, z1, y0, y1) {
    if (x0 > x1) [x0, x1] = [x1, x0];
    if (z0 > z1) [z0, z1] = [z1, z0];
    this._addCol({ t: 0, x0, z0, x1, z1, y0, y1, ax0: x0, az0: z0, ax1: x1, az1: z1 });
  }
  /** Oriented box centred (cx,cz), half extents hx,hz, rotated rot about Y. */
  obb(cx, cz, hx, hz, rot, y0, y1) {
    const r = Math.hypot(hx, hz);
    this._addCol({ t: 1, cx, cz, hx, hz, c: Math.cos(rot), s: Math.sin(rot), y0, y1, ax0: cx - r, az0: cz - r, ax1: cx + r, az1: cz + r });
  }
  /** Wall segment from (x0,z0) to (x1,z1) with thickness th. */
  seg(x0, z0, x1, z1, th, y0, y1) {
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    // three.js rotation about Y by rot maps +x to (cos, 0, -sin)
    this.obb((x0 + x1) / 2, (z0 + z1) / 2, len / 2, th / 2, Math.atan2(-dz, dx), y0, y1);
  }
  cyl(x, z, r, y0, y1) {
    this._addCol({ t: 2, x, z, r, y0, y1, ax0: x - r, az0: z - r, ax1: x + r, az1: z + r });
  }
  /** Inverted cylinder: keeps the player INSIDE radius r (round rooms). gaps: [[a0,a1],...] angular door gaps (atan2(z,x)). */
  ringWall(x, z, r, y0, y1, gaps = []) {
    this._addCol({ t: 3, x, z, r, y0, y1, gaps, ax0: x - r - 1, az0: z - r - 1, ax1: x + r + 1, az1: z + r + 1 });
  }
  /** Solid defined by a signed-distance function fn(x,y,z) (positive = free air) inside an AABB. */
  sdf(fn, x0, z0, x1, z1, y0, y1) {
    this._addCol({ t: 4, fn, y0, y1, ax0: x0, az0: z0, ax1: x1, az1: z1 });
  }
  _addCol(c) {
    c.id = this.cols.length;
    this.cols.push(c);
    if (this.final) this._ins(this.gc, c);
  }

  // ---- ground ------------------------------------------------------------
  floor(x0, z0, x1, z1, y) {
    if (x0 > x1) [x0, x1] = [x1, x0];
    if (z0 > z1) [z0, z1] = [z1, z0];
    this._addG({ t: 0, x0, z0, x1, z1, y, ax0: x0, az0: z0, ax1: x1, az1: z1 });
  }
  /** Ramp over rect; axis 'x': height ya at x0 -> yb at x1; axis 'z': ya at z0 -> yb at z1. */
  ramp(x0, z0, x1, z1, ya, yb, axis) {
    if (x0 > x1) { [x0, x1] = [x1, x0]; if (axis === 'x') [ya, yb] = [yb, ya]; }
    if (z0 > z1) { [z0, z1] = [z1, z0]; if (axis === 'z') [ya, yb] = [yb, ya]; }
    this._addG({ t: 1, x0, z0, x1, z1, ya, yb, axis, ax0: x0, az0: z0, ax1: x1, az1: z1 });
  }
  disc(x, z, r, y) {
    this._addG({ t: 2, x, z, r, y, ax0: x - r, az0: z - r, ax1: x + r, az1: z + r });
  }
  /** Annulus (optionally a sector a0..a1, angles = atan2(z - cz, x - cx)). */
  ring(x, z, r0, r1, y, a0 = -4, a1 = 4) {
    this._addG({ t: 3, x, z, r0, r1, y, a0, a1, ax0: x - r1, az0: z - r1, ax1: x + r1, az1: z + r1 });
  }
  /** Spiral ramp: angle runs continuously a0 -> a1 (may exceed 2pi), height ya -> yb. */
  spiral(x, z, r0, r1, a0, a1, ya, yb) {
    this._addG({ t: 4, x, z, r0, r1, a0, a1, ya, yb, ax0: x - r1, az0: z - r1, ax1: x + r1, az1: z + r1 });
  }
  /** Arbitrary height function over an AABB: fn(x,z,feetY) -> height or -Infinity. */
  custom(x0, z0, x1, z1, fn) {
    this._addG({ t: 5, fn, ax0: x0, az0: z0, ax1: x1, az1: z1 });
  }
  _addG(g) {
    this.grounds.push(g);
    if (this.final) this._ins(this.gg, g);
  }

  _ins(grid, o) {
    const i0 = Math.floor(o.ax0 / CELL), i1 = Math.floor(o.ax1 / CELL);
    const j0 = Math.floor(o.az0 / CELL), j1 = Math.floor(o.az1 / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const k = i * 4096 + j;
      let a = grid.get(k);
      if (!a) { a = []; grid.set(k, a); }
      a.push(o);
    }
  }
  finalize() {
    this.gc.clear(); this.gg.clear();
    for (const c of this.cols) this._ins(this.gc, c);
    for (const g of this.grounds) this._ins(this.gg, g);
    this.final = true;
  }

  /** Highest ground height that is <= feetY + STEP at (x,z); -Infinity if none. */
  groundAt(x, z, feetY, step = STEP) {
    const a = this.gg.get(Math.floor(x / CELL) * 4096 + Math.floor(z / CELL));
    if (!a) return -Infinity;
    let best = -Infinity;
    const lim = feetY + step;
    for (let i = 0; i < a.length; i++) {
      const g = a[i];
      if (x < g.ax0 || x > g.ax1 || z < g.az0 || z > g.az1) continue;
      let h;
      switch (g.t) {
        case 0: h = g.y; break;
        case 1: {
          const t = g.axis === 'x' ? (x - g.x0) / (g.x1 - g.x0) : (z - g.z0) / (g.z1 - g.z0);
          h = g.ya + (g.yb - g.ya) * t; break;
        }
        case 2: { const dx = x - g.x, dz = z - g.z; if (dx * dx + dz * dz > g.r * g.r) continue; h = g.y; break; }
        case 3: {
          const dx = x - g.x, dz = z - g.z, d2 = dx * dx + dz * dz;
          if (d2 > g.r1 * g.r1 || d2 < g.r0 * g.r0) continue;
          if (g.a1 - g.a0 < 6.2831) {
            let an = Math.atan2(dz, dx);
            while (an < g.a0) an += 6.283185307;
            if (an > g.a1) continue;
          }
          h = g.y; break;
        }
        case 4: {
          const dx = x - g.x, dz = z - g.z, d2 = dx * dx + dz * dz;
          if (d2 > g.r1 * g.r1 || d2 < g.r0 * g.r0) continue;
          let an = Math.atan2(dz, dx);
          const lo = Math.min(g.a0, g.a1), hi = Math.max(g.a0, g.a1);
          while (an < lo) an += 6.283185307;
          h = -Infinity;
          for (; an <= hi; an += 6.283185307) {
            const hh = g.ya + (g.yb - g.ya) * (an - g.a0) / (g.a1 - g.a0);
            if (hh <= lim && hh > h) h = hh;
          }
          break;
        }
        default: h = g.fn(x, z, feetY);
      }
      if (h <= lim && h > best) best = h;
    }
    return best;
  }

  /** Push circle (p.x,p.z) radius r out of colliders overlapping the vertical span [y0,y1]. */
  resolve(p, r, y0, y1) {
    const i0 = Math.floor((p.x - r) / CELL), i1 = Math.floor((p.x + r) / CELL);
    const j0 = Math.floor((p.z - r) / CELL), j1 = Math.floor((p.z + r) / CELL);
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const a = this.gc.get(i * 4096 + j);
        if (!a) continue;
        for (let k = 0; k < a.length; k++) {
          const c = a[k];
          if (c.y1 <= y0 || c.y0 >= y1) continue;
          if (p.x + r < c.ax0 || p.x - r > c.ax1 || p.z + r < c.az0 || p.z - r > c.az1) continue;
          if (c.t === 0) {
            const nx = p.x < c.x0 ? c.x0 : p.x > c.x1 ? c.x1 : p.x;
            const nz = p.z < c.z0 ? c.z0 : p.z > c.z1 ? c.z1 : p.z;
            let dx = p.x - nx, dz = p.z - nz;
            const d2 = dx * dx + dz * dz;
            if (d2 >= r * r) continue;
            if (d2 > 1e-10) {
              const d = Math.sqrt(d2), k2 = (r - d) / d;
              p.x += dx * k2; p.z += dz * k2;
            } else {
              // centre inside: push out along least penetration
              const l = p.x - c.x0, rr = c.x1 - p.x, t = p.z - c.z0, b = c.z1 - p.z;
              const m = Math.min(l, rr, t, b);
              if (m === l) p.x = c.x0 - r; else if (m === rr) p.x = c.x1 + r; else if (m === t) p.z = c.z0 - r; else p.z = c.z1 + r;
            }
            moved = true;
          } else if (c.t === 1) {
            // to local frame (inverse of Ry(rot)): lx = dx*c - dz*s ; lz = dx*s + dz*c
            const dx0 = p.x - c.cx, dz0 = p.z - c.cz;
            const lx = dx0 * c.c - dz0 * c.s, lz = dx0 * c.s + dz0 * c.c;
            const nx = lx < -c.hx ? -c.hx : lx > c.hx ? c.hx : lx;
            const nz = lz < -c.hz ? -c.hz : lz > c.hz ? c.hz : lz;
            let dx = lx - nx, dz = lz - nz;
            const d2 = dx * dx + dz * dz;
            if (d2 >= r * r) continue;
            let px, pz;
            if (d2 > 1e-10) {
              const d = Math.sqrt(d2), k2 = (r - d) / d;
              px = dx * k2; pz = dz * k2;
            } else {
              const l = lx + c.hx, rr = c.hx - lx, t = lz + c.hz, b = c.hz - lz;
              const m = Math.min(l, rr, t, b);
              px = 0; pz = 0;
              if (m === l) px = -(l + r); else if (m === rr) px = rr + r; else if (m === t) pz = -(t + r); else pz = b + r;
            }
            // back to world: x = lx*c + lz*s ; z = -lx*s + lz*c
            p.x += px * c.c + pz * c.s;
            p.z += -px * c.s + pz * c.c;
            moved = true;
          } else if (c.t === 2) {
            const dx = p.x - c.x, dz = p.z - c.z;
            const d2 = dx * dx + dz * dz, rr = r + c.r;
            if (d2 >= rr * rr) continue;
            const d = Math.sqrt(d2) || 1e-5;
            p.x = c.x + dx / d * rr; p.z = c.z + dz / d * rr;
            moved = true;
          } else if (c.t === 4) {
            if (p.x < c.ax0 || p.x > c.ax1 || p.z < c.az0 || p.z > c.az1) continue;
            const ya = Math.max(y0, c.y0), yb = Math.min(y1, c.y1);
            for (let q = 0; q < 3; q++) {
              const yy = ya + 0.05 + (yb - ya - 0.1) * q / 2;
              const d = c.fn(p.x, yy, p.z);
              if (d >= r) continue;
              const e = 0.08;
              const gx = c.fn(p.x + e, yy, p.z) - c.fn(p.x - e, yy, p.z), gz = c.fn(p.x, yy, p.z + e) - c.fn(p.x, yy, p.z - e);
              const gl = Math.hypot(gx, gz);
              if (gl < 1e-6) continue;
              const push = Math.min(r - d, 0.4);
              p.x += gx / gl * push; p.z += gz / gl * push;
              moved = true;
            }
          } else {
            const dx = p.x - c.x, dz = p.z - c.z;
            const d = Math.hypot(dx, dz), lim = c.r - r;
            if (d <= lim || d > c.r + r + 0.6) continue;
            const an = Math.atan2(dz, dx);
            let inGap = false;
            for (const g of c.gaps) {
              let a2 = an;
              while (a2 < g[0]) a2 += 6.283185307;
              if (a2 <= g[1]) { inGap = true; break; }
            }
            if (inGap) continue;
            if (d < c.r) { p.x = c.x + dx / d * lim; p.z = c.z + dz / d * lim; }
            else { const o = c.r + r + 0.6; p.x = c.x + dx / d * o; p.z = c.z + dz / d * o; }
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
  }
}

export const STEP_HEIGHT = STEP;
