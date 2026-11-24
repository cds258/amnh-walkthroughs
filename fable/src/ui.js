// Visitor-guide UI: breadcrumb, minimap, museum map panel with teleport lists,
// exhibit cards, "this hall", connections, elevators, photograph.
import { FLOORS, FLOOR_NAMES, FLOOR_Y, ROOM_BY_ID, roomsOnFloor, LEVELS, floorOfY } from './world/plan.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const MAPB = { x0: -108, x1: 108, z0: -92, z1: 114 };

export class UI {
  constructor() {
    this.api = null;
    this.room = null;
    this.floor = 2;
    this.focus = null;
    this.panel = null; // {mode:'map'|'exhibit'|'hall'|'connections', ...}
    this.tab = 'halls';
    this.mapFloor = 2;
    this.query = '';
    this.modalOpen = false;
    this.started = false;
    this.thumbs = new Map();
    this.hoverRoom = null;
  }

  loading(f, label) {
    $('barfill').style.width = Math.round(f * 100) + '%';
    $('loadlabel').textContent = label || '';
  }

  ready() {
    $('bar').style.display = 'none';
    $('loadlabel').style.display = 'none';
    $('enter').style.display = 'inline-block';
  }

  init(api) {
    this.api = api;
    const { player } = api;
    $('enter').addEventListener('click', () => {
      $('start').classList.add('gone');
      this.started = true;
      player.lock();
      this.toast('Press M for the museum map · E to read a label');
    });
    $('view').addEventListener('click', () => {
      if (!this.started || this.blocking()) return;
      if (!player.locked && !player.justDragged) player.lock();
    });
    player.onLockChange = (locked) => {
      $('lookhint').classList.toggle('on', !locked && this.started && !this.blocking());
      $('reticle').style.display = locked ? 'block' : 'none';
    };
    $('btnMap').addEventListener('click', () => this.openMap());
    $('minimap').addEventListener('click', () => this.openMap());
    $('btnHelp').addEventListener('click', () => this.openHelp());
    $('btnPhoto').addEventListener('click', () => this.photograph());
    $('btnHall').addEventListener('click', () => this.openHall(this.room));
    $('btnConn').addEventListener('click', () => this.openConnections());
    $('gclose').addEventListener('click', () => this.closePanel(true));
    $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) this.closeModal(true); });

    window.addEventListener('keydown', (e) => {
      if (!this.started) { if (e.code === 'Enter' && $('enter').style.display !== 'none') $('enter').click(); return; }
      const typing = e.target && e.target.tagName === 'INPUT';
      if (e.code === 'Escape') {
        if (this.modalOpen) this.closeModal(false); else if (this.panel) this.closePanel(false);
        return;
      }
      if (typing) return;
      switch (e.code) {
        case 'KeyM': case 'Tab': e.preventDefault(); this.panel && this.panel.mode === 'map' ? this.closePanel(true) : this.openMap(); break;
        case 'KeyE': case 'Enter':
          if (this.modalOpen || this.panel) break;
          this.activateFocus(); break;
        case 'KeyH': if (!this.blocking()) this.openHall(this.room); break;
        case 'KeyC': if (!this.blocking() && !player.fly) this.openConnections(); break;
        case 'KeyP': if (!this.blocking()) this.photograph(); break;
        case 'KeyF': if (e.shiftKey) { player.fly = !player.fly; this.toast(player.fly ? 'Free-fly on (Space / C = up / down)' : 'Free-fly off'); } break;
        default:
      }
    });
    this.drawPlanLoop = null;
  }

  blocking() { return !!this.panel || this.modalOpen || !this.started; }

  toast(msg, ms = 3200) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => t.classList.remove('on'), ms);
  }

  // ---------------------------------------------------------------- HUD
  setRoom(room, floor) {
    this.room = room;
    this.floor = floor;
    this._crumb();
  }

  _crumb() {
    const room = this.room, floor = this.floor;
    if (!room) { $('bc').textContent = 'Outside'; $('hallname').textContent = 'Central Park West'; return; }
    const lv = LEVELS[room.id];
    const name = (lv && lv[floor]) || room.name;
    const fname = room.id === 'ocean' && this.api && this.api.player.pos.y < -2 ? 'Floor 1 · Lower gallery' : FLOOR_NAMES[floor];
    $('bc').textContent = `${room.wing || ''}  /  ${fname}`;
    $('hallname').textContent = name;
  }

  tick(room, floor) {
    if (floor !== this.floor) { this.floor = floor; this._crumb(); }
    this.drawMini();
  }

  setFocus(f) {
    this.focus = f;
    const el = $('focus');
    if (!f || this.blocking()) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    if (f.kind === 'exhibit') {
      $('focust').textContent = f.obj.title;
      $('focush').textContent = 'E — details';
    } else {
      $('focust').textContent = f.obj.label;
      $('focush').textContent = 'E — ' + (f.obj.type === 'elevator' ? 'choose a floor' : 'use');
    }
  }

  activateFocus() {
    const f = this.focus;
    if (!f) return;
    if (f.kind === 'exhibit') this.openExhibit(f.obj);
    else if (f.obj.type === 'elevator') this.openElevator(f.obj);
    else if (f.obj.action) f.obj.action();
  }

  // ---------------------------------------------------------------- minimap
  drawMini() {
    const api = this.api;
    if (!api) return;
    const c = $('mini'), g = c.getContext('2d');
    const S = c.width, sc = 2.5;
    const p = api.player.pos;
    g.fillStyle = '#1c1b18';
    g.fillRect(0, 0, S, S);
    const tx = (x) => S / 2 + (x - p.x) * sc, tz = (z) => S / 2 + (z - p.z) * sc;
    const list = roomsOnFloor(this.floor);
    for (const { room } of list) {
      const cur = room === this.room || (this.room && room.id === this.room.part) || (this.room && room.part && room.part === this.room.id);
      g.fillStyle = cur ? '#c98a3c' : room.stair ? '#4a4741' : room.minor ? '#5c5850' : '#7c776c';
      g.fillRect(tx(room.x0), tz(room.z0), (room.x1 - room.x0) * sc, (room.z1 - room.z0) * sc);
    }
    for (const q of api.W.portals) {
      if (q.floor !== this.floor) continue;
      g.fillStyle = '#7c776c';
      g.fillRect(tx(q.x0), tz(q.z0), (q.x1 - q.x0) * sc, (q.z1 - q.z0) * sc);
    }
    // exhibits as small dots
    g.fillStyle = 'rgba(255,255,255,.55)';
    for (const e of api.exhibits) {
      if (Math.abs(e.pos[1] - (p.y + 1.2)) > 3.2) continue;
      const x = tx(e.pos[0]), z = tz(e.pos[2]);
      if (x < 0 || z < 0 || x > S || z > S) continue;
      g.fillRect(x - 1.5, z - 1.5, 3, 3);
    }
    // visitor
    const h = api.player.heading * Math.PI / 180;
    g.save();
    g.translate(S / 2, S / 2);
    g.rotate(h);
    g.fillStyle = 'rgba(255,255,255,.16)';
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 70, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55); g.closePath(); g.fill();
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(0, -13); g.lineTo(8, 9); g.lineTo(0, 4); g.lineTo(-8, 9); g.closePath(); g.fill();
    g.restore();
    $('minilabel').textContent = FLOOR_NAMES[this.floor];
  }

  // ---------------------------------------------------------------- panel plumbing
  _open(panel) {
    this.panel = panel;
    $('guide').classList.add('open');
    this.api.player.unlock();
    $('focus').style.display = 'none';
    $('lookhint').classList.remove('on');
  }

  closePanel(relock) {
    this.panel = null;
    $('guide').classList.remove('open');
    if (relock) this.api.player.lock();
    else $('lookhint').classList.add('on');
  }

  go(view, msg) {
    const fade = $('fade');
    fade.classList.add('on');
    setTimeout(() => {
      this.api.goView(view, true);
      this.closePanel(false);
      this.closeModal(false);
      this.api.player.lock();
      setTimeout(() => fade.classList.remove('on'), 60);
      if (msg) this.toast(msg);
    }, 190);
  }

  roomView(room, level) {
    const v = room.views;
    return v['L' + level] || v.main;
  }

  crumbFor(room, level) {
    return `${esc(room.wing || '')} &nbsp;/&nbsp; ${esc(FLOOR_NAMES[level ?? room.floor])}`;
  }

  // ---------------------------------------------------------------- museum map
  openMap() {
    if (!this.api) return;
    this.mapFloor = this.floor;
    this._open({ mode: 'map' });
    this.renderMap();
  }

  renderMap() {
    const b = $('gbody');
    b.innerHTML = `
      <div class="eyebrow">Five levels &nbsp;·&nbsp; ${this.api.rooms.filter((r) => !r.minor && !r.part && !r.stair).length} halls &nbsp;·&nbsp; ${this.api.exhibits.length} exhibits</div>
      <h1 class="gt">Museum map</h1>
      <div class="tabs">
        <button data-tab="halls" class="${this.tab === 'halls' ? 'on' : ''}">Halls</button>
        <button data-tab="stars" class="${this.tab === 'stars' ? 'on' : ''}">Highlights</button>
        <button data-tab="all" class="${this.tab === 'all' ? 'on' : ''}">All exhibits</button>
      </div>
      <input id="gsearch" placeholder="${this.tab === 'halls' ? 'Find a hall or wing' : 'Find a specimen or exhibit'}" value="${esc(this.query)}" autocomplete="off">
      <div id="gdyn"></div>`;
    b.querySelectorAll('.tabs button').forEach((el) => el.addEventListener('click', () => { this.tab = el.dataset.tab; this.query = ''; this.renderMap(); }));
    const s = $('gsearch');
    s.addEventListener('input', () => { this.query = s.value; this.renderMapDyn(); });
    this.renderMapDyn();
  }

  renderMapDyn() {
    const d = $('gdyn');
    const q = this.query.trim().toLowerCase();
    const api = this.api;
    if (this.tab === 'halls') {
      const chips = FLOORS.map((f) => `<button data-f="${f}" class="${String(f) === String(this.mapFloor) ? 'on' : ''}">${f}</button>`).join('');
      let list;
      if (q) {
        list = [];
        for (const f of FLOORS) for (const e of roomsOnFloor(f)) {
          if (e.room.minor || e.room.part || e.room.stair) continue;
          if ((e.name + ' ' + (e.room.wing || '') + ' ' + (e.room.short || '')).toLowerCase().includes(q)) list.push(e);
        }
      } else {
        list = roomsOnFloor(this.mapFloor).filter((e) => !e.room.minor && !e.room.part && !e.room.stair);
      }
      list.sort((a, b2) => a.name.localeCompare(b2.name));
      d.innerHTML = `
        <div class="chips">${chips}</div>
        <canvas id="plan" width="824" height="808"></canvas>
        <div class="hint">${esc(FLOOR_NAMES[this.mapFloor])} · Select a hall on the plan, or enter one from the list. The white marker is you.</div>
        <div class="count">${list.length} ${q ? 'matching halls' : 'halls on ' + FLOOR_NAMES[this.mapFloor].toLowerCase()}</div>
        ${list.map((e, i) => `<div class="row" data-i="${i}"><div><div class="rt">${esc(e.name)}</div><div class="rs">${esc(e.room.wing || '')} · ${esc(FLOOR_NAMES[e.level])}</div></div><div class="go">Enter &rarr;</div></div>`).join('')}`;
      d.querySelectorAll('.chips button').forEach((el) => el.addEventListener('click', () => {
        const f = el.dataset.f; this.mapFloor = f === 'LL' ? 'LL' : Number(f); this.renderMapDyn();
      }));
      d.querySelectorAll('.row').forEach((el) => el.addEventListener('click', () => { const e = list[+el.dataset.i]; this.openHall(e.room, e.level); }));
      const plan = $('plan');
      plan.addEventListener('mousemove', (ev) => { const r = this._planPick(ev); if (r !== this.hoverRoom) { this.hoverRoom = r; this.drawPlan(); plan.title = r ? r.name : ''; } });
      plan.addEventListener('mouseleave', () => { this.hoverRoom = null; this.drawPlan(); });
      plan.addEventListener('click', (ev) => { const r = this._planPick(ev); if (r) this.openHall(r.room, r.level); });
      this.drawPlan();
    } else {
      let list = api.exhibits.filter((e) => (this.tab === 'stars' ? e.star : true));
      if (q) list = list.filter((e) => (e.title + ' ' + e.sub + ' ' + e.hallName).toLowerCase().includes(q));
      const order = { LL: 0, 1: 1, 2: 2, 3: 3, 4: 4 };
      list = list.slice().sort((a, b2) => (order[a.floor] - order[b2.floor]) || a.hallName.localeCompare(b2.hallName));
      d.innerHTML = `
        <div class="hint" style="margin-top:14px">${this.tab === 'stars' ? 'The specimens people cross the city to see.' : 'Every labelled specimen and diorama in the building.'} Choose one to stand in front of it.</div>
        <div class="count">${list.length} ${this.tab === 'stars' ? 'highlights' : 'exhibits'}</div>
        ${list.map((e, i) => `<div class="row" data-i="${i}"><div><div class="rt">${esc(e.title)}</div><div class="rs">${esc(e.hallName)} · ${esc(FLOOR_NAMES[e.floor] || '')}</div></div><div class="go">View &rarr;</div></div>`).join('')}`;
      d.querySelectorAll('.row').forEach((el) => el.addEventListener('click', () => this.openExhibit(list[+el.dataset.i], true)));
    }
  }

  _planXY(ev) {
    const c = $('plan');
    const r = c.getBoundingClientRect();
    const u = (ev.clientX - r.left) / r.width, v = (ev.clientY - r.top) / r.height;
    return [MAPB.x0 + u * (MAPB.x1 - MAPB.x0), MAPB.z0 + v * (MAPB.z1 - MAPB.z0)];
  }

  _planPick(ev) {
    const [x, z] = this._planXY(ev);
    let best = null, ba = Infinity;
    for (const e of roomsOnFloor(this.mapFloor)) {
      const r = e.room;
      if (r.stair) continue;
      if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) {
        const a = (r.x1 - r.x0) * (r.z1 - r.z0);
        if (a < ba) { ba = a; best = e; }
      }
    }
    if (best && best.room.part) best = { room: ROOM_BY_ID[best.room.part], name: ROOM_BY_ID[best.room.part].name, level: best.level };
    return best;
  }

  drawPlan() {
    const c = $('plan');
    if (!c) return;
    const g = c.getContext('2d');
    const Wd = c.width, Hd = c.height;
    const sx = Wd / (MAPB.x1 - MAPB.x0), sz = Hd / (MAPB.z1 - MAPB.z0);
    const tx = (x) => (x - MAPB.x0) * sx, tz = (z) => (z - MAPB.z0) * sz;
    g.fillStyle = '#ebe5d7';
    g.fillRect(0, 0, Wd, Hd);
    // streets
    g.fillStyle = '#9b958a';
    g.font = '600 15px Helvetica, Arial, sans-serif';
    g.textAlign = 'center';
    g.fillText('WEST 81ST STREET', Wd / 2, 20);
    g.fillText('WEST 77TH STREET', Wd / 2, Hd - 9);
    g.save(); g.translate(16, Hd / 2); g.rotate(-Math.PI / 2); g.fillText('COLUMBUS AVENUE', 0, 0); g.restore();
    g.save(); g.translate(Wd - 9, Hd / 2); g.rotate(-Math.PI / 2); g.fillText('CENTRAL PARK WEST', 0, 0); g.restore();
    // building footprint
    g.fillStyle = '#c9c3b5';
    const foot = [[-102, 82, 102, 107], [79, -85, 102, 107], [-12, 20, 12, 84], [13, -14, 80, 14], [-22, -22, 22, 30], [-102, 26, -76, 84], [-97, -31, -21, 30], [31, -84, 102, -19], [23, 31, 79, 73]];
    for (const f of foot) g.fillRect(tx(f[0]), tz(f[1]), (f[2] - f[0]) * sx, (f[3] - f[1]) * sz);
    const list = roomsOnFloor(this.mapFloor);
    const hov = this.hoverRoom && this.hoverRoom.room;
    const fill = (r) => {
      const isHov = hov && (r === hov || r.part === hov.id);
      const isCur = this.room && this.mapFloor === this.floor && (r === this.room || r.part === this.room.id || this.room.part === r.id);
      g.fillStyle = isHov ? '#6e2c1f' : isCur ? '#8e3a26' : r.stair ? '#a59e8f' : r.minor ? '#d3a997' : '#b5604a';
      g.fillRect(tx(r.x0), tz(r.z0), (r.x1 - r.x0) * sx, (r.z1 - r.z0) * sz);
    };
    for (const { room } of list) fill(room);
    for (const q of this.api.W.portals) {
      if (q.floor !== this.mapFloor) continue;
      g.fillStyle = '#d3a997';
      g.fillRect(tx(q.x0), tz(q.z0), (q.x1 - q.x0) * sx, (q.z1 - q.z0) * sz);
    }
    // labels
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const { room, name } of list) {
      if (room.minor || room.part || room.stair) continue;
      const w = (room.x1 - room.x0) * sx, h = (room.z1 - room.z0) * sz;
      const label = (LEVELS[room.id] && LEVELS[room.id][this.mapFloor]) ? name.split(' — ').pop() : (room.short || name.replace(/^Hall of /, ''));
      g.font = '600 13px Helvetica, Arial, sans-serif';
      const words = label.split(' ');
      const lines = [];
      let line = '';
      const vertical = h > w * 1.6;
      const maxW = (vertical ? h : w) - 8;
      for (const wd of words) {
        const t = line ? line + ' ' + wd : wd;
        if (g.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t;
      }
      lines.push(line);
      const lh = 15;
      if (lines.length * lh > (vertical ? w : h) - 2) continue;
      g.save();
      g.translate(tx((room.x0 + room.x1) / 2), tz((room.z0 + room.z1) / 2));
      if (vertical) g.rotate(-Math.PI / 2);
      lines.forEach((l, i) => g.fillText(l, 0, (i - (lines.length - 1) / 2) * lh));
      g.restore();
    }
    // visitor
    if (this.mapFloor === this.floor) {
      const p = this.api.player.pos;
      g.save();
      g.translate(tx(p.x), tz(p.z));
      g.rotate(this.api.player.heading * Math.PI / 180);
      g.fillStyle = '#fff'; g.strokeStyle = '#1d1d1b'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(0, -13); g.lineTo(9, 10); g.lineTo(0, 5); g.lineTo(-9, 10); g.closePath(); g.stroke(); g.fill();
      g.restore();
    }
  }

  // ---------------------------------------------------------------- hall card
  openHall(room, level) {
    if (!room) { this.toast('You are outside the museum.'); return; }
    if (room.part) room = ROOM_BY_ID[room.part];
    level = level ?? (LEVELS[room.id] ? this.floor : room.floor);
    if (LEVELS[room.id] && !(level in LEVELS[room.id])) level = room.floor;
    this._open({ mode: 'hall', room });
    const api = this.api;
    const name = (LEVELS[room.id] && LEVELS[room.id][level]) || room.name;
    const ex = api.exhibits.filter((e) => e.hall === room.id || (ROOM_BY_ID[e.hall] && ROOM_BY_ID[e.hall].part === room.id));
    const here = this.room && (this.room === room || this.room.part === room.id) && level === this.floor;
    const b = $('gbody');
    b.innerHTML = `
      <button class="back" id="bk">&larr; Museum map</button>
      <div class="thumb" id="th"></div>
      <div class="eyebrow">${this.crumbFor(room, level)}</div>
      <h2 class="et">${esc(name)}</h2>
      <div class="etext">${esc(room.blurb || 'A connecting space between the halls.')}</div>
      <button class="primary" id="enterhall">${here ? 'Return to the hall entrance' : 'Enter this hall'}</button>
      ${ex.length ? `<div class="sect">In this hall</div>` : ''}
      ${ex.map((e, i) => `<div class="row" data-i="${i}"><div><div class="rt">${esc(e.title)}</div>${e.sub ? `<div class="rs">${esc(e.sub)}</div>` : ''}</div><div class="go">View &rarr;</div></div>`).join('')}`;
    $('bk').addEventListener('click', () => { this.panel = { mode: 'map' }; this.mapFloor = level; this.renderMap(); });
    const view = this.roomView(room, level);
    $('enterhall').addEventListener('click', () => this.go(view));
    b.querySelectorAll('.row').forEach((el) => el.addEventListener('click', () => this.openExhibit(ex[+el.dataset.i], true)));
    this._thumb('hall:' + room.id + ':' + level, view);
  }

  _thumb(key, view) {
    const el = $('th');
    if (!el) return;
    let url = this.thumbs.get(key);
    if (!url) {
      try { url = this.api.snapshot(view); this.thumbs.set(key, url); } catch (err) { console.warn(err); }
    }
    if (url) el.style.backgroundImage = `url(${url})`;
  }

  // ---------------------------------------------------------------- exhibit card
  openExhibit(e, fromList) {
    this._open({ mode: 'exhibit', ex: e });
    const room = ROOM_BY_ID[e.hall];
    const p = this.api.player.pos;
    const near = Math.hypot(p.x - e.view.x, p.z - e.view.z) < 3 && Math.abs(p.y - e.view.y) < 2;
    const b = $('gbody');
    b.innerHTML = `
      <button class="back" id="bk">&larr; ${fromList ? 'Museum map' : 'Close'}</button>
      <div class="thumb" id="th"></div>
      <div class="eyebrow">${room ? this.crumbFor(room, e.floor) : ''}</div>
      <h2 class="et">${esc(e.title)}</h2>
      ${e.sub ? `<div class="esub">${esc(e.sub)}</div>` : ''}
      <div class="emeta">${esc(e.hallName)}</div>
      <div class="etext">${esc(e.text)}</div>
      <button class="primary" id="stand">${near ? 'Step back to the label' : 'Stand before this exhibit'}</button>
      ${room ? '<button class="secondary" id="tohall">About this hall</button>' : ''}`;
    $('bk').addEventListener('click', () => { if (fromList) { this.panel = { mode: 'map' }; this.renderMap(); } else this.closePanel(true); });
    $('stand').addEventListener('click', () => this.go(e.view));
    if (room) $('tohall').addEventListener('click', () => this.openHall(room, e.floor));
    this._thumb('ex:' + e.id, e.view);
  }

  // ---------------------------------------------------------------- connections
  openConnections() {
    const room = this.room;
    if (!room) return;
    this._open({ mode: 'connections' });
    const api = this.api;
    const seen = new Set();
    const adj = [];
    const collect = (r) => {
      for (const p of api.W.portals) {
        if (!p.rooms || !p.rooms.includes(r.id)) continue;
        for (const id of p.rooms) {
          if (id === r.id) continue;
          let o = ROOM_BY_ID[id];
          if (o.part) o = ROOM_BY_ID[o.part];
          if (o === room || o.id === room.part) continue;
          const key = o.id + ':' + p.floor;
          if (seen.has(key)) continue;
          seen.add(key);
          adj.push({ room: o, level: p.floor, portal: p });
        }
      }
    };
    collect(room);
    for (const r of api.rooms) if (r.part === room.id || (room.part && (r.id === room.part || r.part === room.part))) collect(r);
    adj.sort((a, b2) => (a.level === this.floor ? 0 : 1) - (b2.level === this.floor ? 0 : 1) || String(a.level).localeCompare(String(b2.level)));
    const b = $('gbody');
    b.innerHTML = `
      <div class="eyebrow">${this.crumbFor(room, this.floor)}</div>
      <h2 class="et">Connections</h2>
      <div class="etext">Doorways leading out of ${esc(room.short || room.name)}. Choose one to walk through it.</div>
      <div class="count">${adj.length} connecting spaces</div>
      ${adj.map((a, i) => `<div class="row" data-i="${i}"><div><div class="rt">${esc(a.room.stair ? 'Stairs' : ((LEVELS[a.room.id] && LEVELS[a.room.id][a.level]) || a.room.name))}</div><div class="rs">${esc(a.room.wing || '')} · ${esc(FLOOR_NAMES[a.level])}</div></div><div class="go">Go &rarr;</div></div>`).join('')}`;
    b.querySelectorAll('.row').forEach((el) => el.addEventListener('click', () => {
      const a = adj[+el.dataset.i];
      // stand in the doorway, facing into the destination
      const p = a.portal;
      const cx = (p.x0 + p.x1) / 2, cz = (p.z0 + p.z1) / 2;
      const r = a.room.part ? ROOM_BY_ID[a.room.part] : a.room;
      const tx = Math.max(a.room.x0, Math.min(a.room.x1, cx)), tz = Math.max(a.room.z0, Math.min(a.room.z1, cz));
      let yaw;
      if (p.axis === 'x') yaw = tx >= cx ? 90 : 270; else yaw = tz >= cz ? 180 : 0;
      void r;
      this.go({ x: cx, y: p.y, z: cz, yaw, pitch: 0 });
    }));
  }

  // ---------------------------------------------------------------- elevator
  openElevator(el) {
    const api = this.api;
    const stops = api.W.interact.filter((i) => i.type === 'elevator' && i.bank === el.bank);
    const order = { LL: 0, 1: 1, 2: 2, 3: 3, 4: 4 };
    stops.sort((a, b2) => order[b2.floor] - order[a.floor]);
    this._modal(`
      <div class="eyebrow">${esc(el.bank)}</div>
      <h3>Which floor?</h3>
      ${stops.map((s, i) => {
        const r = api.W.roomAt(s.stand.x, s.stand.y, s.stand.z);
        const near = roomsOnFloor(s.floor).filter((e) => !e.room.minor && !e.room.part && !e.room.stair).slice(0, 4).map((e) => e.room.short || e.name.replace(/^Hall of /, '')).join(' · ');
        return `<div class="frow ${s.floor === el.floor ? 'cur' : ''}" data-i="${i}"><div class="fb">${s.floor}</div><div><div class="fn">${esc(FLOOR_NAMES[s.floor])}${s.floor === el.floor ? ' — you are here' : ''}</div><div class="fs">${esc(r ? r.name : '')}${near ? ' · ' + esc(near) : ''}</div></div></div>`;
      }).join('')}`);
    $('modalbox').querySelectorAll('.frow').forEach((row) => row.addEventListener('click', () => {
      const s = stops[+row.dataset.i];
      if (s.floor === el.floor) { this.closeModal(true); return; }
      this.go(s.stand, `${FLOOR_NAMES[s.floor]}`);
    }));
  }

  openHelp() {
    this._modal(`
      <div class="eyebrow">Visitor guide</div>
      <h3>Finding your way</h3>
      <div class="keys">
        <kbd>W A S D</kbd><span>Walk (arrow keys also work)</span>
        <kbd>Mouse</kbd><span>Look around — click the view to capture the mouse, or drag</span>
        <kbd>Shift</kbd><span>Walk briskly</span>
        <kbd>E</kbd><span>Read the label you are looking at · call an elevator</span>
        <kbd>M</kbd><span>Museum map: floor plans, every hall and exhibit, teleport</span>
        <kbd>H</kbd><span>About this hall</span>
        <kbd>C</kbd><span>Connections — doorways out of this hall</span>
        <kbd>P</kbd><span>Photograph (saves a PNG)</span>
        <kbd>Esc</kbd><span>Release the mouse / close a panel</span>
      </div>
      <div class="etext" style="font-size:13.5px;margin-bottom:16px">Stairs are walkable; elevators take you to any floor. The layout follows the museum's own floor maps; specimens and dioramas are procedural reconstructions.</div>
      <button class="primary" id="helpok">Back to the museum</button>`);
    $('helpok').addEventListener('click', () => this.closeModal(true));
  }

  _modal(html) {
    $('modalbox').innerHTML = html;
    $('modal').classList.add('open');
    this.modalOpen = true;
    this.api.player.unlock();
    $('focus').style.display = 'none';
  }

  closeModal(relock) {
    if (!this.modalOpen) return;
    $('modal').classList.remove('open');
    this.modalOpen = false;
    if (relock) this.api.player.lock();
  }

  // ---------------------------------------------------------------- photograph
  photograph() {
    const hud = $('hud');
    hud.classList.add('hidden');
    const url = this.api.photo();
    const a = document.createElement('a');
    const name = (this.room ? (this.room.short || this.room.name) : 'outside').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `amnh-${name}.png`;
    a.click();
    $('fade').style.background = '#fff';
    $('fade').classList.add('on');
    setTimeout(() => { $('fade').classList.remove('on'); setTimeout(() => { $('fade').style.background = ''; }, 250); hud.classList.remove('hidden'); }, 140);
    this.toast('Photograph saved');
  }
}

export { FLOOR_Y, floorOfY };
