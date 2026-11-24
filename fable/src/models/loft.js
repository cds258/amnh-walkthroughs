// Organic modelling primitives shared by the animal, sea-life and skeleton libraries.
// Everything returns THREE.BufferGeometry (with position/normal/uv and optionally color),
// ready to be merged with Geo.add(material, geometry, matrix, color).
//
// Model convention used across src/models: metres, y up, standing on y = 0,
// head towards +X, left/right symmetric about z = 0.
import * as THREE from 'three';

const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);

/** Catmull-Rom interpolation of scalar values at parameter t in [0, n-1]. */
function crScalar(vals, t) {
  const n = vals.length;
  const i = Math.min(n - 2, Math.max(0, Math.floor(t)));
  const f = t - i;
  const p0 = vals[Math.max(0, i - 1)], p1 = vals[i], p2 = vals[i + 1], p3 = vals[Math.min(n - 1, i + 2)];
  // monotone-ish: clamp tangents so radii never overshoot below zero
  const m1 = (p2 - p0) / 2, m2 = (p3 - p1) / 2;
  const f2 = f * f, f3 = f2 * f;
  const v = (2 * f3 - 3 * f2 + 1) * p1 + (f3 - 2 * f2 + f) * m1 + (-2 * f3 + 3 * f2) * p2 + (f3 - f2) * m2;
  return Math.max(v, Math.min(p1, p2) * 0.6);
}

/**
 * Loft a smooth skin through cross-section stations.
 *
 * stations: [{ p:[x,y,z], rx, ry, [ryb], [twist] }, ...]
 *   p   centre of the section
 *   rx  half-WIDTH (sideways, perpendicular to path and to `up`)
 *   ry  half-HEIGHT above the centre
 *   ryb half-height below the centre (defaults to ry) — lets bellies sag / backs arch
 * o.radial   segments around (default 16)
 * o.sub      subdivisions between stations (default 4)
 * o.up       reference up vector (default [0,1,0]); frames are parallel-transported from it,
 *            so paths may go vertical (rearing necks) without flipping
 * o.capStart / o.capEnd  close the ends with a rounded cap (default true)
 * o.color    fn(u, a, pos, sy) -> [r,g,b] linear triple; u in 0..1 along the path, a = angle around
 *            (0 = +side, PI/2 = top, -PI/2 = belly), sy = sin(a) (1 top, -1 belly). Use col() for hex.
 * o.squareness  0 = ellipse (default) .. 1 = boxier superellipse
 */
export function loft(stations, o = {}) {
  const radial = o.radial || 16, sub = o.sub || 4;
  const n = stations.length;
  const pts = stations.map((s) => V(s.p));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const rings = (n - 1) * sub + 1;
  const rxs = stations.map((s) => s.rx), rys = stations.map((s) => s.ry), rybs = stations.map((s) => s.ryb ?? s.ry);
  const tw = stations.map((s) => s.twist || 0);
  // arc-length-independent parameterisation: station i sits at t = i/(n-1) for centripetal CR via getPoint
  const pos = [], nor = [], uv = [], colr = [], idx = [];
  const up0 = o.up ? V(o.up) : new THREE.Vector3(0, 1, 0);
  let prevUp = null, prevT = null;
  const centre = new THREE.Vector3(), tan = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3();
  const sq = o.squareness || 0;
  const ringCentres = [];
  for (let r = 0; r < rings; r++) {
    const t = r / (rings - 1);
    curve.getPoint(t, centre);
    curve.getTangent(t, tan).normalize();
    if (!prevUp) {
      up.copy(up0).addScaledVector(tan, -up0.dot(tan));
      if (up.lengthSq() < 1e-6) up.set(1, 0, 0).addScaledVector(tan, -tan.x);
      up.normalize();
    } else {
      // parallel transport
      up.copy(prevUp).addScaledVector(tan, -prevUp.dot(tan));
      if (up.lengthSq() < 1e-8) up.copy(prevUp);
      up.normalize();
    }
    prevUp = up.clone(); prevT = tan.clone();
    side.crossVectors(tan, up).normalize(); // for path along +x and up=+y, side = +z
    const st = t * (n - 1);
    const rx = crScalar(rxs, st), ry = crScalar(rys, st), ryb = crScalar(rybs, st), twist = crScalar2(tw, st);
    ringCentres.push(centre.clone());
    for (let k = 0; k <= radial; k++) {
      const a = (k / radial) * Math.PI * 2 + twist;
      let ca = Math.cos(a), sa = Math.sin(a);
      if (sq > 0) {
        const e = 1 - sq * 0.6;
        ca = Math.sign(ca) * Math.pow(Math.abs(ca), e);
        sa = Math.sign(sa) * Math.pow(Math.abs(sa), e);
      }
      const h = sa >= 0 ? ry : ryb;
      const px = centre.x + side.x * ca * rx + up.x * sa * h;
      const py = centre.y + side.y * ca * rx + up.y * sa * h;
      const pz = centre.z + side.z * ca * rx + up.z * sa * h;
      pos.push(px, py, pz);
      // approximate normal of an ellipse
      const nx = side.x * ca / Math.max(rx, 1e-4) + up.x * sa / Math.max(h, 1e-4);
      const ny = side.y * ca / Math.max(rx, 1e-4) + up.y * sa / Math.max(h, 1e-4);
      const nz = side.z * ca / Math.max(rx, 1e-4) + up.z * sa / Math.max(h, 1e-4);
      const l = Math.hypot(nx, ny, nz) || 1;
      nor.push(nx / l, ny / l, nz / l);
      uv.push(t * (o.uvLen || 4), k / radial * (o.uvAround || 2));
      if (o.color) { const c = o.color(t, Math.atan2(Math.sin(a - twist), Math.cos(a - twist)), [px, py, pz], Math.sin(a - twist)); colr.push(c[0], c[1], c[2]); }
    }
  }
  const W = radial + 1;
  for (let r = 0; r < rings - 1; r++) {
    for (let k = 0; k < radial; k++) {
      const a = r * W + k, b = a + 1, c = a + W, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  // end caps (fan to the ring centre, pushed out slightly for a rounded look)
  const cap = (ringIndex, flip) => {
    const c0 = pos.length / 3;
    const cc = ringCentres[ringIndex];
    const neigh = ringCentres[flip ? 1 : rings - 2] || cc;
    const dir = cc.clone().sub(neigh).normalize();
    const st = flip ? 0 : n - 1;
    const bulge = Math.min(rxs[st], rys[st]) * (o.capBulge ?? 0.55);
    pos.push(cc.x + dir.x * bulge, cc.y + dir.y * bulge, cc.z + dir.z * bulge);
    nor.push(dir.x, dir.y, dir.z);
    uv.push(flip ? 0 : (o.uvLen || 4), 0.5);
    if (o.color) { const c = o.color(flip ? 0 : 1, 0, [cc.x, cc.y, cc.z], 0); colr.push(c[0], c[1], c[2]); }
    const base = ringIndex * W;
    for (let k = 0; k < radial; k++) {
      if (flip) idx.push(c0, base + k, base + k + 1);
      else idx.push(c0, base + k + 1, base + k);
    }
  };
  if (o.capStart !== false) cap(0, true);
  if (o.capEnd !== false) cap(rings - 1, false);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (o.color) g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  g.setIndex(idx);
  if (o.smooth !== false) {
    g.computeVertexNormals();
    // weld normals across the seam (k = 0 and k = radial are duplicate vertices)
    const N = g.attributes.normal;
    for (let r = 0; r < rings; r++) {
      const i0 = r * W, i1 = r * W + radial;
      const x = N.getX(i0) + N.getX(i1), y = N.getY(i0) + N.getY(i1), z = N.getZ(i0) + N.getZ(i1);
      const l = Math.hypot(x, y, z) || 1;
      N.setXYZ(i0, x / l, y / l, z / l); N.setXYZ(i1, x / l, y / l, z / l);
    }
  }
  return g;
}

function crScalar2(vals, t) {
  const n = vals.length;
  const i = Math.min(n - 2, Math.max(0, Math.floor(t)));
  const f = t - i;
  return vals[i] + (vals[i + 1] - vals[i]) * f;
}

/** Round tube through points with per-point radii (number or array). Handy for tails, trunks, tusks, ribs. */
export function tube(points, radius, o = {}) {
  const rad = Array.isArray(radius) ? radius : points.map(() => radius);
  return loft(points.map((p, i) => ({ p, rx: rad[i], ry: rad[i] })), { radial: o.radial || 8, sub: o.sub || 3, ...o });
}

/** Ellipsoid centred at c with radii r=[rx,ry,rz]. */
export function ellipsoid(c, r, o = {}) {
  const g = new THREE.SphereGeometry(1, o.seg || 14, o.rings || 10);
  g.scale(r[0], r[1], r[2]);
  if (o.rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(o.rot[0], o.rot[1], o.rot[2])));
  g.translate(c[0], c[1], c[2]);
  return g;
}

/** Cone / spike from base centre a to tip b with base radius r. */
export function spike(a, b, r, o = {}) {
  const va = V(a), vb = V(b);
  const len = va.distanceTo(vb);
  const g = new THREE.ConeGeometry(r, len, o.seg || 8, 1, !!o.open);
  g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(va, q, new THREE.Vector3(1, 1, 1)));
  return g;
}

/** Tapered cylinder from a to b (radii ra, rb). */
export function rod(a, b, ra, rb = ra, o = {}) {
  const va = V(a), vb = V(b);
  const len = va.distanceTo(vb) || 1e-5;
  const g = new THREE.CylinderGeometry(rb, ra, len, o.seg || 8, 1, !!o.open);
  g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(va, q, new THREE.Vector3(1, 1, 1)));
  return g;
}

/**
 * A limb bone: shaft from a to b with knobby ends (for skeletons).
 * ra / rb: shaft radius at each end; knob: end-swelling factor (default 1.6).
 */
export function bone(a, b, ra, rb = ra, o = {}) {
  const va = V(a), vb = V(b);
  const k = o.knob ?? 1.6;
  const d = vb.clone().sub(va);
  const p = (t) => { const q = va.clone().addScaledVector(d, t); return [q.x, q.y, q.z]; };
  return loft([
    { p: p(0), rx: ra * k * 0.8, ry: ra * k * 0.8 },
    { p: p(0.06), rx: ra * k, ry: ra * k },
    { p: p(0.2), rx: ra * 1.05, ry: ra * 1.05 },
    { p: p(0.5), rx: (ra + rb) / 2 * 0.9, ry: (ra + rb) / 2 * 0.9 },
    { p: p(0.8), rx: rb * 1.05, ry: rb * 1.05 },
    { p: p(0.94), rx: rb * k, ry: rb * k },
    { p: p(1), rx: rb * k * 0.8, ry: rb * k * 0.8 },
  ], { radial: o.radial || 7, sub: 2 });
}

/**
 * Thin plate from a 2-D outline (array of [u,v]) placed in the plane spanned by `origin`, `uAxis`, `vAxis`,
 * with thickness th (extruded symmetrically along the plane normal). For fins, flukes, ears, armour plates, blades.
 */
export function plate(outline, origin, uAxis, vAxis, th = 0.02, o = {}) {
  const shape = new THREE.Shape(outline.map((p) => new THREE.Vector2(p[0], p[1])));
  let g;
  if (o.curved) {
    const pts = shape.getSpacedPoints(o.curved);
    g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: th, bevelEnabled: false });
  } else {
    g = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: !!o.bevel, bevelThickness: th * 0.4, bevelSize: th * 0.4, bevelSegments: 1 });
  }
  g.translate(0, 0, -th / 2);
  const u = V(uAxis).normalize(), v = V(vAxis).normalize();
  const nrm = new THREE.Vector3().crossVectors(u, v).normalize();
  const m = new THREE.Matrix4().makeBasis(u, v, nrm).setPosition(V(origin));
  g.applyMatrix4(m);
  return g;
}

/** Arc of a rib: semi-elliptical tube from spine point `top`, bulging sideways by `w` and down by `d`, on side s (+1 / -1 along z). */
export function rib(top, w, d, r, s = 1, o = {}) {
  const n = o.n || 6;
  const pts = [];
  const sweep = o.sweep || 0; // x offset at the tip (ribs raked backwards)
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * Math.PI * (o.arc || 0.92);
    pts.push([top[0] + sweep * t, top[1] - d * (1 - Math.cos(a)) / 2, top[2] + s * w * Math.sin(a) * (1 - 0.15 * t)]);
  }
  return tube(pts, pts.map((_, i) => r * (1 - 0.45 * i / n)), { radial: 5, sub: 2 });
}

export { V as vec };
