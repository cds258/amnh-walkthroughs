// First-person controller: WASD + mouse look (pointer lock, with drag-look fallback).
import * as THREE from 'three';

const EYE = 1.66;
const RADIUS = 0.36;
const HEIGHT = 1.8;

export class Player {
  constructor(camera, physics, dom) {
    this.camera = camera;
    this.physics = physics;
    this.dom = dom;
    this.pos = new THREE.Vector3(0, 0, 0); // feet
    this.vel = new THREE.Vector3();
    this.yaw = 0; // radians; 0 looks toward -z (north)
    this.pitch = 0;
    this.vy = 0;
    this.grounded = true;
    this.keys = new Set();
    this.enabled = true;
    this.fly = false;
    this.bobT = 0;
    this.eyeY = EYE;
    this.lastSafe = new THREE.Vector3();
    this.locked = false;
    this.dragging = false;
    this.onLockChange = null;
    this.touchMove = { x: 0, y: 0 };
    this._bind();
  }

  _bind() {
    const dom = this.dom;
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === dom;
      if (this.onLockChange) this.onLockChange(this.locked);
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (this.locked) this.look(e.movementX, e.movementY, 0.0022);
      else if (this.dragging) this.look(-e.movementX, -e.movementY, 0.004);
    });
    dom.addEventListener('mousedown', (e) => { if (e.button === 0 && !this.locked) this.dragging = true; });
    window.addEventListener('mouseup', () => { this.dragging = false; });
    // touch: left half = move stick, right half = look
    const touches = new Map();
    dom.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) touches.set(t.identifier, { x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, left: t.clientX < window.innerWidth * 0.4 });
      e.preventDefault();
    }, { passive: false });
    dom.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        const s = touches.get(t.identifier);
        if (!s) continue;
        if (s.left) {
          this.touchMove.x = THREE.MathUtils.clamp((t.clientX - s.x0) / 60, -1, 1);
          this.touchMove.y = THREE.MathUtils.clamp((t.clientY - s.y0) / 60, -1, 1);
        } else {
          this.look(-(t.clientX - s.x), -(t.clientY - s.y), 0.005);
        }
        s.x = t.clientX; s.y = t.clientY;
      }
      e.preventDefault();
    }, { passive: false });
    const end = (e) => {
      for (const t of e.changedTouches) {
        const s = touches.get(t.identifier);
        if (s && s.left) { this.touchMove.x = 0; this.touchMove.y = 0; }
        touches.delete(t.identifier);
      }
    };
    dom.addEventListener('touchend', end);
    dom.addEventListener('touchcancel', end);
  }

  look(dx, dy, k) {
    this.yaw -= dx * k;
    this.pitch -= dy * k;
    const lim = Math.PI / 2 - 0.02;
    this.pitch = Math.max(-lim, Math.min(lim, this.pitch));
  }

  lock() {
    if (this.dom.requestPointerLock) {
      try { const p = this.dom.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
    }
  }
  unlock() { if (document.pointerLockElement) document.exitPointerLock(); }

  /** Place the player. yawDeg: compass heading, 0 = north (-z), 90 = east (+x). */
  teleport(x, y, z, yawDeg = 0, pitchDeg = 0) {
    this.pos.set(x, y, z);
    const g = this.physics.groundAt(x, z, y + 0.3);
    if (g > -Infinity && Math.abs(g - y) < 1.5) this.pos.y = g;
    this.vy = 0;
    this.vel.set(0, 0, 0);
    this.yaw = -yawDeg * Math.PI / 180;
    this.pitch = pitchDeg * Math.PI / 180;
    this.lastSafe.copy(this.pos);
    this.sync();
  }

  /** Compass heading in degrees (0 = north, 90 = east). */
  get heading() {
    let d = (-this.yaw * 180 / Math.PI) % 360;
    if (d < 0) d += 360;
    return d;
  }

  update(dt) {
    const k = this.keys;
    let f = 0, s = 0;
    if (this.enabled) {
      if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
      if (k.has('KeyD')) s += 1;
      if (k.has('KeyA')) s -= 1;
      if (k.has('ArrowLeft')) this.yaw += 1.8 * dt;
      if (k.has('ArrowRight')) this.yaw -= 1.8 * dt;
      f -= this.touchMove.y; s += this.touchMove.x;
    }
    const run = k.has('ShiftLeft') || k.has('ShiftRight');
    const speed = this.fly ? (run ? 30 : 12) : (run ? 9.5 : 4.6);
    const l = Math.hypot(f, s);
    if (l > 1) { f /= l; s /= l; }
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    // forward = (-sin, 0, -cos); right = (cos, 0, -sin)
    const tx = (-sin * f + cos * s) * speed;
    const tz = (-cos * f - sin * s) * speed;
    const acc = 1 - Math.exp(-dt * (l > 0 ? 12 : 9));
    this.vel.x += (tx - this.vel.x) * acc;
    this.vel.z += (tz - this.vel.z) * acc;

    const P = this.physics;
    if (this.fly) {
      this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
      if (k.has('Space')) this.pos.y += speed * dt;
      if (k.has('KeyC')) this.pos.y -= speed * dt;
      this.pos.y += Math.sin(this.pitch) * f * speed * dt;
      this.sync();
      return;
    }

    let mx = this.vel.x * dt, mz = this.vel.z * dt;
    const dist = Math.hypot(mx, mz);
    const steps = Math.max(1, Math.ceil(dist / 0.2));
    mx /= steps; mz /= steps;
    for (let i = 0; i < steps; i++) {
      const ox = this.pos.x, oz = this.pos.z;
      this.pos.x += mx; this.pos.z += mz;
      P.resolve(this.pos, RADIUS, this.pos.y + 0.6, this.pos.y + HEIGHT);
      // do not walk off into the void (no ground at all) or off ledges taller than a storey
      const g = P.groundAt(this.pos.x, this.pos.z, this.pos.y);
      if (g === -Infinity) { this.pos.x = ox; this.pos.z = oz; this.vel.x = this.vel.z = 0; break; }
      if (this.grounded && g >= this.pos.y - 0.75) this.pos.y = g; // follow stairs / ramps
    }
    const g = P.groundAt(this.pos.x, this.pos.z, this.pos.y);
    if (this.pos.y > g + 0.001) {
      this.vy -= 22 * dt;
      this.pos.y += this.vy * dt;
      this.grounded = false;
      if (this.pos.y <= g) { this.pos.y = g; this.vy = 0; this.grounded = true; }
    } else {
      this.pos.y = g; this.vy = 0; this.grounded = true;
    }
    if (this.grounded && this.enabled && k.has('Space')) { this.vy = 6.2; this.grounded = false; this.pos.y += 0.01; }
    if (this.grounded) this.lastSafe.copy(this.pos);
    if (this.pos.y < -60) { this.pos.copy(this.lastSafe); this.vy = 0; }

    // gentle head bob
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && sp > 0.5) this.bobT += dt * sp * 1.55;
    const bob = Math.sin(this.bobT * 2) * 0.022 * Math.min(1, sp / 4);
    this.eyeY += ((EYE + bob) - this.eyeY) * Math.min(1, dt * 14);
    this.sync();
  }

  sync() {
    this.camera.position.set(this.pos.x, this.pos.y + this.eyeY, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}

export const PLAYER_EYE = EYE;
