// Exhibit placards (in-world labels) and the exhibit registry used by the visitor guide.
import * as THREE from 'three';
import { makeCanvas } from './textures.js';

/** All exhibits, in registration order. */
export const EXHIBITS = [];
const byId = new Map();
export function exhibitById(id) { return byId.get(id); }

function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif';
const SANS = '"Helvetica Neue",Helvetica,Arial,sans-serif';

function drawPlacard(o) {
  const W = 512, H = 320;
  const c = makeCanvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = '#17191c';
  g.fillRect(0, 0, W, H);
  g.fillStyle = o.accent || '#c8882a';
  g.fillRect(0, 0, W, 10);
  g.fillStyle = '#f3efe6';
  g.textBaseline = 'top';
  let y = 30;
  let size = 40;
  g.font = `600 ${size}px ${SERIF}`;
  let lines = wrap(g, o.title, W - 56);
  if (lines.length > 2) { size = 31; g.font = `600 ${size}px ${SERIF}`; lines = wrap(g, o.title, W - 56); }
  for (const l of lines.slice(0, 3)) { g.fillText(l, 28, y); y += size * 1.12; }
  if (o.sub) {
    g.font = `italic 22px ${SERIF}`;
    g.fillStyle = '#d7b98a';
    for (const l of wrap(g, o.sub, W - 56).slice(0, 2)) { g.fillText(l, 28, y + 4); y += 27; }
    y += 6;
  }
  if (o.text) {
    g.font = `17px ${SANS}`;
    g.fillStyle = '#c9c6bf';
    y += 10;
    const tl = wrap(g, o.text, W - 56);
    const max = Math.floor((H - y - 16) / 22);
    for (let i = 0; i < Math.min(max, tl.length); i++) {
      let l = tl[i];
      if (i === max - 1 && tl.length > max) l = l.replace(/\s*\S*$/, '') + ' …';
      g.fillText(l, 28, y); y += 22;
    }
  }
  return c;
}

const panelGeo = new THREE.PlaneGeometry(1, 1);

/**
 * Create an in-world placard and register the exhibit.
 * ctx: {geo, group, room}
 * o: { id, title, sub, text, x, y, z, face (compass deg the label faces; 0 = north/-z, 90 = east/+x),
 *      kind: 'stand' (default, tilted reading rail on a post) | 'wall' (flat plaque, y = centre height),
 *      size (width in m, default 0.74), star (bool: listed under Highlights),
 *      view: {x, y, z, yaw, pitch} optional explicit teleport view (y = feet height),
 *      target: [x,y,z] the thing being labelled (for look-at and hover detection),
 *      list: false to keep it out of the guide lists }
 */
export function placard(ctx, o) {
  const w = o.size || 0.74, h = w * 0.625;
  const tex = new THREE.CanvasTexture(drawPlacard(o));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.MeshBasicMaterial({ map: tex });
  const mesh = new THREE.Mesh(panelGeo, m);
  const th = (o.face || 0) * Math.PI / 180;
  const dx = Math.sin(th), dz = -Math.cos(th); // facing direction
  const rotY = Math.PI - th;
  mesh.scale.set(w, h, 1);
  let px = o.x, py, pz = o.z;
  if (o.kind === 'wall') {
    py = o.y;
    mesh.position.set(px + dx * 0.035, py, pz + dz * 0.035);
    mesh.rotation.set(0, rotY, 0);
    // thin backing board
    ctx.geo.rbox('satin', px + dx * 0.015, py - h / 2 - 0.02, pz + dz * 0.015, w + 0.05, h + 0.04, 0.03, rotY, { color: 0x0c0c0e });
  } else {
    const baseY = o.y || 0;
    const top = baseY + 0.98;
    py = top;
    mesh.position.set(px, top, pz);
    mesh.rotation.set(-0.72, rotY, 0, 'YXZ');
    // post + tilted backing
    ctx.geo.rbox('satin', px - dx * 0.06, baseY, pz - dz * 0.06, 0.07, 0.86, 0.07, rotY, { color: 0x101012 });
    ctx.geo.rbox('satin', px - dx * 0.06, baseY, pz - dz * 0.06, 0.34, 0.03, 0.26, rotY, { color: 0x101012 });
    const back = new THREE.BoxGeometry(w + 0.05, h + 0.05, 0.03);
    const bm = new THREE.Matrix4().compose(
      new THREE.Vector3(px - dx * 0.012, top - 0.014, pz - dz * 0.012),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.72, rotY, 0, 'YXZ')),
      new THREE.Vector3(1, 1, 1));
    ctx.geo.add('satin', back, bm, 0x0c0c0e);
  }
  mesh.updateMatrix();
  mesh.matrixAutoUpdate = false;
  ctx.group.add(mesh);

  const target = o.target || [px - dx * 2.5, py + 0.6, pz - dz * 2.5];
  let view = o.view;
  if (!view) {
    // stand a little in front of the label, looking past it at the exhibit
    const vx = px + dx * 2.2, vz = pz + dz * 2.2;
    const yaw = Math.atan2(target[0] - vx, -(target[2] - vz)) * 180 / Math.PI;
    const dist = Math.hypot(target[0] - vx, target[2] - vz);
    const fy = o.kind === 'wall' ? (o.floorY ?? (o.y - 1.5)) : (o.y || 0);
    const pitch = Math.atan2(target[1] - (fy + 1.66), dist) * 180 / Math.PI;
    view = { x: vx, y: fy, z: vz, yaw, pitch: Math.max(-35, Math.min(50, pitch)) };
  }
  const ex = {
    id: o.id || ('ex' + EXHIBITS.length),
    title: o.title, sub: o.sub || '', text: o.text || '',
    hall: ctx.room ? ctx.room.id : null,
    hallName: ctx.room ? ctx.room.name : '',
    floor: ctx.room ? ctx.room.floor : null,
    pos: [px, py, pz], target, view, star: !!o.star, list: o.list !== false,
  };
  if (ex.list) { EXHIBITS.push(ex); byId.set(ex.id, ex); }
  mesh.userData.exhibit = ex;
  return ex;
}

/** Register an exhibit with no physical placard (rare). */
export function registerExhibit(ex) {
  EXHIBITS.push(ex); byId.set(ex.id, ex);
  return ex;
}

/** Big wall/hall signage: text rendered to a transparent texture. Returns the mesh. */
export function sign(ctx, text, x, y, z, face, height = 0.5, o = {}) {
  const font = `${o.weight || 600} 96px ${o.sans ? SANS : SERIF}`;
  const mc = makeCanvas(8, 8).getContext('2d');
  mc.font = font;
  const tw = Math.ceil(mc.measureText(text).width) + 40;
  const c = makeCanvas(tw, 128);
  const g = c.getContext('2d');
  if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, tw, 128); }
  g.font = font;
  g.textBaseline = 'middle';
  g.fillStyle = o.color || '#f3efe6';
  g.fillText(text, 20, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: !o.bg, depthWrite: !!o.bg, toneMapped: !o.bright });
  const mesh = new THREE.Mesh(panelGeo, m);
  const th = face * Math.PI / 180;
  mesh.scale.set(height * tw / 128, height, 1);
  mesh.position.set(x + Math.sin(th) * 0.03, y, z - Math.cos(th) * 0.03);
  mesh.rotation.set(0, Math.PI - th, 0);
  mesh.updateMatrix();
  mesh.matrixAutoUpdate = false;
  if (!o.bg) mesh.renderOrder = 3;
  ctx.group.add(mesh);
  return mesh;
}

/**
 * Lit text panel (engraved inscription, wall text, graphic panel). Uses a standard material so it sits in the room's light.
 * o: { x, y (centre), z, face, w, h, heading, text, bg, fg, font ('serif'|'sans'), size (px of body text on a 1024-wide canvas), align }
 */
export function textPanel(ctx, o) {
  const Wc = 1024, Hc = Math.round(1024 * o.h / o.w);
  const c = makeCanvas(Wc, Hc);
  const g = c.getContext('2d');
  g.fillStyle = o.bg || '#d9cfbb';
  g.fillRect(0, 0, Wc, Hc);
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = 10; g.strokeRect(16, 16, Wc - 32, Hc - 32); }
  const fam = o.font === 'sans' ? SANS : SERIF;
  g.fillStyle = o.fg || '#5a4a38';
  g.textAlign = o.align || 'center';
  g.textBaseline = 'top';
  const ax = g.textAlign === 'center' ? Wc / 2 : 70;
  let y = o.pad ?? 60;
  if (o.heading) {
    const hs = o.headSize || 84;
    g.font = `600 ${hs}px ${fam}`;
    for (const l of wrap(g, o.heading, Wc - 140)) { g.fillText(l, ax, y); y += hs * 1.1; }
    y += hs * 0.35;
  }
  if (o.text) {
    const bs = o.size || 44;
    g.font = `${o.weight || 400} ${bs}px ${fam}`;
    for (const para of String(o.text).split('\n')) {
      for (const l of wrap(g, para, Wc - 140)) { if (y + bs > Hc - 30) break; g.fillText(l, ax, y); y += bs * 1.32; }
      y += bs * 0.5;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const m = o.unlit ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const mesh = new THREE.Mesh(panelGeo, m);
  const th = o.face * Math.PI / 180;
  mesh.scale.set(o.w, o.h, 1);
  mesh.position.set(o.x + Math.sin(th) * 0.025, o.y, o.z - Math.cos(th) * 0.025);
  mesh.rotation.set(0, Math.PI - th, 0);
  mesh.updateMatrix();
  mesh.matrixAutoUpdate = false;
  ctx.group.add(mesh);
  return mesh;
}

/** Image panel from a canvas painter fn(g, w, h). o: { x, y, z, face, w, h, px (canvas width), unlit } */
export function picture(ctx, o, paint) {
  const Wc = o.px || 1024, Hc = Math.round(Wc * o.h / o.w);
  const c = makeCanvas(Wc, Hc);
  paint(c.getContext('2d'), Wc, Hc);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const m = o.unlit ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
  const mesh = new THREE.Mesh(panelGeo, m);
  const th = o.face * Math.PI / 180;
  mesh.scale.set(o.w, o.h, 1);
  mesh.position.set(o.x + Math.sin(th) * 0.03, o.y, o.z - Math.cos(th) * 0.03);
  mesh.rotation.set(0, Math.PI - th, 0);
  mesh.updateMatrix();
  mesh.matrixAutoUpdate = false;
  ctx.group.add(mesh);
  return mesh;
}
