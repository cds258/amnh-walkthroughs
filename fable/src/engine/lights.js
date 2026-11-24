// Lighting: one global hemisphere/ambient "mood" that follows the room the visitor
// is in, plus a small pool of point lights that hop between the nearest light anchors.
import * as THREE from 'three';

const POOL = 8;

export const MOODS = {
  //            sky        ground     hemi  amb   env   fog        fogDensity  exposure
  bright: { sky: 0xfff6e8, ground: 0x8a7f72, hemi: 1.05, env: 0.5, fog: 0xcfc6b8, fd: 0.0035 },
  day: { sky: 0xf4f6ff, ground: 0x8c8a86, hemi: 1.0, env: 0.45, fog: 0xd4dae0, fd: 0.0028 },
  rose: { sky: 0xe6f0ff, ground: 0x6c7280, hemi: 0.95, env: 0.5, fog: 0xb8c8dc, fd: 0.002 },
  warm: { sky: 0xffe9c8, ground: 0x6b5a48, hemi: 0.95, env: 0.4, fog: 0x8a7a66, fd: 0.005 },
  dim: { sky: 0xffdfb0, ground: 0x3a3028, hemi: 0.5, env: 0.22, fog: 0x2a231c, fd: 0.008 },
  dark: { sky: 0xb9c4ff, ground: 0x15151c, hemi: 0.22, env: 0.1, fog: 0x08080c, fd: 0.011 },
  ocean: { sky: 0x4f9dff, ground: 0x0a2a55, hemi: 0.85, env: 0.25, fog: 0x06264d, fd: 0.006 },
  space: { sky: 0x8fa8ff, ground: 0x202030, hemi: 0.55, env: 0.35, fog: 0x05060c, fd: 0.004 },
  cave: { sky: 0xfff1dc, ground: 0xb09a80, hemi: 0.8, env: 0.5, fog: 0xd9c8b0, fd: 0.004 },
  green: { sky: 0xeaffd8, ground: 0x4a6a3a, hemi: 1.2, env: 0.5, fog: 0xb8d0a8, fd: 0.006 },
  outside: { sky: 0xdcecff, ground: 0x8a8f80, hemi: 1.7, env: 0.8, fog: 0xbcd0e6, fd: 0.0016 },
};

export class Lights {
  constructor(scene) {
    this.scene = scene;
    this.anchors = [];
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff4e0, 0.6);
    this.sun.position.set(0.4, 1, 0.3);
    scene.add(this.sun);
    this.pool = [];
    for (let i = 0; i < POOL; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 30, 1.6);
      l.userData = { anchor: null, k: 0 };
      scene.add(l);
      this.pool.push(l);
    }
    this.mood = { ...MOODS.bright };
    this.cur = {
      sky: new THREE.Color(MOODS.bright.sky), ground: new THREE.Color(MOODS.bright.ground),
      hemi: MOODS.bright.hemi, env: MOODS.bright.env, fog: new THREE.Color(MOODS.bright.fog), fd: MOODS.bright.fd,
    };
    scene.fog = new THREE.FogExp2(MOODS.bright.fog, MOODS.bright.fd);
    this.t = 0;
    this._tmp = new THREE.Color();
  }

  /** Register a light anchor. */
  anchor(x, y, z, o = {}) {
    this.anchors.push({ x, y, z, color: new THREE.Color(o.color ?? 0xffe8c8), intensity: o.intensity ?? 60, dist: o.dist ?? 26, used: false });
  }

  setMood(name) {
    const m = MOODS[name] || MOODS.bright;
    this.mood = m;
  }

  /** Jump straight to the target mood and nearest lights (after a teleport). */
  snap(cam) {
    const m = this.mood, c = this.cur;
    c.sky.set(m.sky); c.ground.set(m.ground); c.hemi = m.hemi; c.env = m.env; c.fog.set(m.fog); c.fd = m.fd;
    for (const l of this.pool) { l.userData.anchor = null; l.userData.k = 0; l.userData.target = 0; l.intensity = 0; }
    if (cam) {
      const best = this._rank(cam.position).slice(0, POOL);
      best.forEach((an, i) => {
        const l = this.pool[i];
        l.userData.anchor = an; l.userData.k = 1; l.userData.target = 1;
        l.position.set(an.x, an.y, an.z); l.color.copy(an.color); l.distance = an.dist;
      });
    }
    this.t = 0;
    this.update(0, cam || { position: { x: 0, y: 0, z: 0 } });
  }

  _rank(p) {
    const A = this.anchors;
    for (let i = 0; i < A.length; i++) {
      const an = A[i];
      const dy = an.y - p.y;
      // strongly prefer lights on the visitor's own storey
      an.score = Math.hypot(an.x - p.x, an.z - p.z) + Math.abs(dy) * (dy > 9 || dy < -4 ? 4 : 0.5) - an.dist * 0.35;
    }
    return A.slice().sort((x, y) => x.score - y.score);
  }

  update(dt, cam) {
    // mood lerp
    const m = this.mood, c = this.cur;
    const a = 1 - Math.exp(-dt * 2.2);
    c.sky.lerp(this._tmp.set(m.sky), a);
    c.ground.lerp(this._tmp.set(m.ground), a);
    c.fog.lerp(this._tmp.set(m.fog), a);
    c.hemi += (m.hemi - c.hemi) * a;
    c.env += (m.env - c.env) * a;
    c.fd += (m.fd - c.fd) * a;
    this.hemi.color.copy(c.sky);
    this.hemi.groundColor.copy(c.ground);
    this.hemi.intensity = c.hemi;
    this.sun.intensity = c.hemi * 0.35;
    this.scene.environmentIntensity = c.env;
    this.scene.fog.color.copy(c.fog);
    this.scene.fog.density = c.fd;
    if (this.scene.background && this.scene.background.isColor) this.scene.background.copy(c.fog);

    // re-pick nearest anchors a few times a second
    this.t += dt;
    if (this.t > 0.2) {
      this.t = 0;
      const best = this._rank(cam.position).slice(0, POOL);
      const want = new Set(best);
      // keep lights already on a wanted anchor; reassign the rest once they have faded out
      for (const l of this.pool) {
        if (l.userData.anchor && want.has(l.userData.anchor)) { want.delete(l.userData.anchor); l.userData.target = 1; }
        else l.userData.target = 0;
      }
      const free = [...want];
      for (const l of this.pool) {
        if (l.userData.target === 0 && (l.userData.k <= 0.02 || !l.userData.anchor) && free.length) {
          const an = free.shift();
          l.userData.anchor = an;
          l.position.set(an.x, an.y, an.z);
          l.color.copy(an.color);
          l.distance = an.dist;
          l.userData.target = 1;
        }
      }
    }
    for (const l of this.pool) {
      const u = l.userData;
      const tgt = u.target || 0;
      u.k += (tgt - u.k) * Math.min(1, dt * 5);
      l.intensity = u.anchor ? u.anchor.intensity * u.k : 0;
    }
  }
}
