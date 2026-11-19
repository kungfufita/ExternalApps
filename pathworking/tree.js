/* Pathworking — 3D Tree of Life scene (Three.js)
   Exposes a TreeScene with high-level controls the UI drives:
     flash   — Lightning Flash descent (any Sephirah sequence)
     serpent — Serpent of Wisdom ascent along the 22 paths (32 → 11)
     ring    — the 72 Names of the Shem HaMephorash encircling the Tree
     lit     — arbitrary highlighting of Sephiroth / paths (guide mode)        */

import * as THREE from "./vendor/three.module.min.js";
import {
  SEPHIROTH, SEPH_BY_KEY, PATHS, PATH_BY_N, PILLAR, WORLDS, sephPos, SERPENT_ORDER,
} from "./data.js";

const Y_OFF = -4;                 // centre the Tree (0..8) on the origin
const tv = (x, y, z = 0) => new THREE.Vector3(x, y + Y_OFF, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───────────── canvas helpers ───────────── */
function makeTextTexture({ lines, font = "600 44px system-ui, 'Segoe UI', sans-serif", hebrewFont = "500 64px 'Noto Serif Hebrew', 'David', 'Times New Roman', serif", color = "#fff", shadow = "rgba(0,0,0,.65)", width = 320, height = 160 }) {
  const c = document.createElement("canvas");
  c.width = width; c.height = height;
  const g = c.getContext("2d");
  g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = shadow; g.shadowBlur = 10;
  const total = lines.length;
  lines.forEach((ln, i) => {
    g.font = ln.hebrew ? hebrewFont : (ln.font || font);
    g.fillStyle = ln.color || color;
    const y = height / 2 + (i - (total - 1) / 2) * (ln.gap || 56);
    g.fillText(ln.text, width / 2, y);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,.45)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeQuarteredTexture(colors) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 128;
  const g = c.getContext("2d");
  // Malkuth: citrine (top), olive & russet (sides), black (bottom) — as a sphere map
  g.fillStyle = colors[0]; g.fillRect(0, 0, 256, 44);
  g.fillStyle = colors[1]; g.fillRect(0, 44, 128, 44);
  g.fillStyle = colors[2]; g.fillRect(128, 44, 128, 44);
  g.fillStyle = colors[3]; g.fillRect(0, 88, 256, 40);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeSerpentTexture(kind) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 64;
  const g = c.getContext("2d");
  const [a, b, c2] = kind === "dragon"
    ? ["#b8241f", "#f2b134", "#5a0d0b"]
    : ["#2f8f5a", "#d8c25a", "#13402a"];
  g.fillStyle = a; g.fillRect(0, 0, 512, 64);
  for (let i = 0; i < 64; i++) {
    g.fillStyle = i % 2 ? b : c2;
    g.globalAlpha = 0.55;
    g.beginPath();
    g.ellipse(i * 8 + 4, 32 + Math.sin(i * 0.8) * 10, 5, 14, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 1);
  return t;
}

/* ───────────── orbit controls (pointer + pinch) ───────────── */
class Orbit {
  constructor(camera, dom) {
    this.camera = camera; this.dom = dom;
    this.target = new THREE.Vector3(0, 0, 0);
    this.theta = 0; this.phi = 1.42; this.radius = 14; this.userZoomed = false;
    this.target.set(0, 0.35, 0);
    this.minR = 4; this.maxR = 140;
    this.autoRotate = false; this.autoSpeed = 0.12;
    this.pointers = new Map();
    this.lastPinch = 0; this.moved = 0;
    this.onTap = null;
    this.goal = null; // {theta, phi, radius, target}
    dom.style.touchAction = "none";
    dom.addEventListener("pointerdown", e => this.down(e));
    dom.addEventListener("pointermove", e => this.move(e));
    dom.addEventListener("pointerup", e => this.up(e));
    dom.addEventListener("pointercancel", e => this.up(e));
    dom.addEventListener("wheel", e => { e.preventDefault(); this.zoom(Math.exp(e.deltaY * 0.0012)); }, { passive: false });
    dom.addEventListener("contextmenu", e => e.preventDefault());
  }
  down(e) {
    this.dom.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    this.moved = 0; this.goal = null;
    if (this.pointers.size === 2) this.lastPinch = this.pinch();
  }
  move(e) {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    this.moved += Math.abs(dx) + Math.abs(dy);
    if (this.pointers.size === 1) {
      if (e.buttons === 2 || e.shiftKey) this.pan(dx, dy); else this.rotate(dx, dy);
    } else if (this.pointers.size === 2) {
      const d = this.pinch();
      if (this.lastPinch) this.zoom(this.lastPinch / d);
      this.lastPinch = d;
      // two-finger drag pans vertically
      this.pan(0, dy * 0.5);
    }
  }
  up(e) {
    const p = this.pointers.get(e.pointerId);
    this.pointers.delete(e.pointerId);
    this.lastPinch = 0;
    if (p && this.moved < 8 && this.onTap) this.onTap(e.clientX, e.clientY);
  }
  pinch() {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }
  rotate(dx, dy) {
    this.theta -= dx * 0.006;
    this.phi = clamp(this.phi - dy * 0.006, 0.2, Math.PI - 0.2);
  }
  pan(dx, dy) { this.target.y = clamp(this.target.y + dy * 0.01 * (this.radius / 14), -6, 6); }
  zoom(f) { this.userZoomed = true; this.radius = clamp(this.radius * f, this.minR, this.maxR); }
  flyTo(goal) { this.goal = { ...goal }; }
  reset(fit) {
    this.userZoomed = false;
    this.flyTo({ theta: 0, phi: 1.42, radius: TreeScene.fitRadius(fit), target: new THREE.Vector3(0, 0.35, 0) });
  }
  update(dt) {
    if (this.autoRotate && this.pointers.size === 0 && !this.goal) this.theta += this.autoSpeed * dt;
    if (this.goal) {
      const k = 1 - Math.pow(0.001, dt); // smooth approach
      this.theta = lerp(this.theta, this.goal.theta, k);
      this.phi = lerp(this.phi, this.goal.phi, k);
      this.radius = lerp(this.radius, this.goal.radius, k);
      this.target.lerp(this.goal.target, k);
      if (Math.abs(this.theta - this.goal.theta) < 1e-3 && Math.abs(this.radius - this.goal.radius) < 1e-2 && this.target.distanceTo(this.goal.target) < 1e-2) this.goal = null;
    }
    const s = Math.sin(this.phi), c = Math.cos(this.phi);
    this.camera.position.set(
      this.target.x + this.radius * s * Math.sin(this.theta),
      this.target.y + this.radius * c,
      this.target.z + this.radius * s * Math.cos(this.theta),
    );
    this.camera.lookAt(this.target);
  }
}

/* ───────────── the scene ───────────── */
export class TreeScene {
  /* fit the Tree (12.4 units tall, 7.4 wide) into the visible fraction of the frustum */
  static fitRadius(fit) {
    const fov = THREE.MathUtils.degToRad(48), t = Math.tan(fov / 2);
    const f = fit || { h: 1, w: 1 };
    const h = 13.2 / (2 * t * Math.max(f.h, 0.05));
    const w = 7.4 / (2 * t * Math.max(f.w, 0.05));
    return clamp(Math.max(h, w) * 1.03, 6, 140);
  }

  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x070912, 1);
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute("aria-label", "3D Tree of Life. Drag to rotate, pinch or scroll to zoom.");
    this.renderer.domElement.setAttribute("role", "img");

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070912, 0.005);
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 400);
    this.orbit = new Orbit(this.camera, this.renderer.domElement);
    this.orbit.onTap = (x, y) => this.handleTap(x, y);
    this.onSelect = null;

    this.glowTex = makeGlowTexture();
    this.clock = new THREE.Clock();
    this.time = 0;

    this.lit = { sephiroth: new Set(), paths: new Set() };
    this.flashState = { seq: [], progress: -1, visible: false };
    this.serpentState = { progress: 0, visible: false, kind: "serpent" };
    this.options = { labels: true, pathLabels: true, worlds: true, pillars: true, daath: true, ring: true, ringPlace: "base" };

    this.buildLights();
    this.buildStars();
    this.buildWorlds();
    this.buildPillars();
    this.buildPaths();
    this.buildSephiroth();
    this.buildFlash();
    this.buildSerpent();
    this.ring = null; // built lazily via setShem()


    this.visibleRect = null;
    this.resize();
    this.orbit.radius = TreeScene.fitRadius(this.fit);
    new ResizeObserver(() => this.resize()).observe(container);
    this.running = true;
    document.addEventListener("visibilitychange", () => { this.running = !document.hidden; if (this.running) this.loop(); });
    this.loop();
  }

  /* ---- construction ---- */
  buildLights() {
    this.scene.add(new THREE.AmbientLight(0x6a6f9a, 0.9));
    const hemi = new THREE.HemisphereLight(0xcfd6ff, 0x2a1a3a, 0.7);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 8, 10);
    this.scene.add(key);
    this.crownLight = new THREE.PointLight(0xfff2c0, 20, 18, 1.6);
    this.crownLight.position.copy(tv(0, 8, 1.2));
    this.scene.add(this.crownLight);
    this.sparkLight = new THREE.PointLight(0xffe9a0, 0, 8, 1.8);
    this.scene.add(this.sparkLight);
  }

  buildStars() {
    const n = 900, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 40 + Math.random() * 60, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0xbfc6ff, size: 0.35, sizeAttenuation: true, transparent: true, opacity: 0.8, fog: false });
    this.stars = new THREE.Points(g, m);
    this.scene.add(this.stars);
  }

  buildWorlds() {
    this.worldsGroup = new THREE.Group();
    for (const w of WORLDS) {
      const h = w.yTop - w.yBottom;
      const geo = new THREE.PlaneGeometry(6.9, h);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(w.color), transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(tv(0, (w.yTop + w.yBottom) / 2, -1.1));
      this.worldsGroup.add(mesh);
      // label on the viewer's far left
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeTextTexture({ lines: [{ text: w.name, font: "600 40px system-ui, sans-serif", color: w.color }], width: 320, height: 96 }), transparent: true, opacity: 0.75, depthWrite: false }));
      sp.scale.set(1.9, 0.57, 1);
      sp.position.copy(tv(-2.75, w.yTop - 0.32, -1.0));
      this.worldsGroup.add(sp);
      // thin separator line
      const line = new THREE.Mesh(new THREE.PlaneGeometry(6.9, 0.012), new THREE.MeshBasicMaterial({ color: new THREE.Color(w.color), transparent: true, opacity: 0.25, depthWrite: false }));
      line.position.copy(tv(0, w.yBottom, -1.09));
      this.worldsGroup.add(line);
    }
    this.scene.add(this.worldsGroup);
  }

  buildPillars() {
    this.pillarsGroup = new THREE.Group();
    const cols = [["right", 0xffffff], ["mid", 0xf2d14b], ["left", 0x7a7d9a]];
    for (const [k, c] of cols) {
      const geo = new THREE.CylinderGeometry(0.06, 0.08, 9.6, 12, 1, true);
      const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(tv(PILLAR[k], 4, -0.6));
      this.pillarsGroup.add(m);
    }
    this.scene.add(this.pillarsGroup);
  }

  buildPaths() {
    this.pathMeshes = {};
    this.pathLabelGroup = new THREE.Group();
    this.pathsGroup = new THREE.Group();
    for (const p of PATHS) {
      const a = sephPos(SEPH_BY_KEY[p.from]), b = sephPos(SEPH_BY_KEY[p.to]);
      const A = tv(a.x, a.y), B = tv(b.x, b.y);
      const dir = new THREE.Vector3().subVectors(B, A);
      const len = dir.length();
      const geo = new THREE.CylinderGeometry(0.04, 0.04, len - 0.7, 10, 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0x5c5f7d, emissive: new THREE.Color(p.color), emissiveIntensity: 0.0, roughness: 0.5, metalness: 0.2 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(A).add(B).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      mesh.userData = { path: p.n };
      this.pathsGroup.add(mesh);
      this.pathMeshes[p.n] = { mesh, mat, base: 0x5c5f7d, p, A, B };
      // label: letter + number, placed off the midpoint, nudged perpendicular
      const mid = A.clone().add(B).multiplyScalar(0.5);
      const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(0.22);
      if (Math.abs(dir.x) < 1e-3) perp.set(0.3, 0, 0); // vertical paths: push right
      const tex = makeTextTexture({ lines: [{ text: p.letter, hebrew: true, color: p.color, gap: 50 }, { text: String(p.n), font: "600 30px system-ui, sans-serif", color: "#c9cbe0", gap: 50 }], width: 160, height: 160 });
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      sp.scale.set(0.7, 0.7, 1);
      sp.position.copy(mid).add(perp).add(new THREE.Vector3(0, 0, 0.25));
      this.pathLabelGroup.add(sp);
    }
    this.scene.add(this.pathsGroup, this.pathLabelGroup);
  }

  buildSephiroth() {
    this.sephMeshes = {};
    this.labelGroup = new THREE.Group();
    this.sephGroup = new THREE.Group();
    for (const s of SEPHIROTH) {
      const { x, y } = sephPos(s);
      const pos = tv(x, y);
      const r = s.hidden ? 0.26 : 0.38;
      let mat;
      if (s.quartered) {
        mat = new THREE.MeshStandardMaterial({ map: makeQuarteredTexture(s.quartered), emissive: new THREE.Color(s.glow), emissiveIntensity: 0.08, roughness: 0.55, metalness: 0.1 });
      } else if (s.hidden) {
        mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(s.color), emissive: new THREE.Color(s.glow), emissiveIntensity: 0.15, transparent: true, opacity: 0.35, roughness: 0.3, wireframe: true });
      } else {
        mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(s.color), emissive: new THREE.Color(s.key === "kether" ? s.glow : s.color), emissiveIntensity: s.key === "kether" ? 0.6 : 0.1, roughness: 0.35, metalness: 0.15 });
      }
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), mat);
      mesh.position.copy(pos);
      mesh.userData = { seph: s.key };
      this.sephGroup.add(mesh);
      // glow halo
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: new THREE.Color(s.glow), transparent: true, opacity: s.key === "kether" ? 0.75 : 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.scale.setScalar(s.key === "kether" ? 2.4 : 1.4);
      glow.position.copy(pos);
      this.sephGroup.add(glow);
      // label
      const tex = makeTextTexture({ lines: [{ text: s.hebrew, hebrew: true, color: "#fff", gap: 54 }, { text: s.name + (s.hidden ? "" : " · " + s.id), font: "600 34px system-ui, sans-serif", color: "#dfe2f5", gap: 54 }], width: 320, height: 150 });
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      label.scale.set(1.7, 0.8, 1);
      const side = s.pillar === "right" ? 1 : s.pillar === "left" ? -1 : 0;
      label.position.copy(pos).add(new THREE.Vector3(side * 1.05, side === 0 ? -0.72 : 0, 0.3));
      if (s.key === "kether") label.position.copy(pos).add(new THREE.Vector3(0, 0.8, 0.3));
      if (s.key === "malkuth") label.position.copy(pos).add(new THREE.Vector3(0, -0.8, 0.3));
      if (s.hidden) label.position.copy(pos).add(new THREE.Vector3(1.05, 0, 0.3));
      this.labelGroup.add(label);
      this.sephMeshes[s.key] = { mesh, mat, glow, label, s, pos, baseEmissive: mat.emissiveIntensity, baseGlow: glow.material.opacity, baseScale: glow.scale.x };
    }
    this.scene.add(this.sephGroup, this.labelGroup);
  }

  buildFlash() {
    this.flashGroup = new THREE.Group();
    this.flashGroup.visible = false;
    this.flashMat = new THREE.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    this.flashTube = null;
    this.spark = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.sparkGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffe8a8, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.sparkGlow.scale.setScalar(1.8);
    this.flashGroup.add(this.spark, this.sparkGlow);
    this.scene.add(this.flashGroup);
  }

  setFlashSequence(keys) {
    if (this.flashTube) { this.flashGroup.remove(this.flashTube); this.flashTube.geometry.dispose(); }
    const pts = keys.map(k => this.sephMeshes[k].pos.clone().add(new THREE.Vector3(0, 0, 0.18)));
    const path = new THREE.CurvePath();
    for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    this.flashSegments = (pts.length - 1) * 24;
    this.flashRadial = 10;
    const geo = new THREE.TubeGeometry(path, this.flashSegments, 0.055, this.flashRadial, false);
    this.flashTube = new THREE.Mesh(geo, this.flashMat);
    this.flashGroup.add(this.flashTube);
    this.flashState.seq = keys;
    this.flashState.pts = pts;
    this.setFlashProgress(this.flashState.progress);
  }

  /* progress: -1 = nothing; 0..N-1 continuous (integer = resting on that Sephirah) */
  setFlashProgress(p) {
    const { seq, pts } = this.flashState;
    this.flashState.progress = p;
    if (!seq || !seq.length) return;
    const N = seq.length;
    const q = clamp(p, 0, N - 1);
    const frac = q / (N - 1);
    const count = Math.floor(frac * this.flashSegments) * this.flashRadial * 6;
    this.flashTube.geometry.setDrawRange(0, p < 0 ? 0 : count);
    const i = Math.min(Math.floor(q), N - 2), f = q - i;
    const pos = pts[i].clone().lerp(pts[i + 1], f);
    this.spark.position.copy(pos); this.sparkGlow.position.copy(pos);
    this.sparkLight.position.copy(pos);
    this.spark.visible = this.sparkGlow.visible = p >= 0;
    this.sparkLight.intensity = p >= 0 ? 14 : 0;
    // light the Sephiroth already reached
    this.lit.sephiroth = new Set(seq.slice(0, Math.floor(q + 1e-6) + 1));
    if (p < 0) this.lit.sephiroth.clear();
    // and the paths between consecutive reached Sephiroth
    this.lit.paths = new Set();
    for (let k = 0; k < Math.floor(q + 1e-6); k++) {
      const a = seq[k], b = seq[k + 1];
      const path = PATHS.find(pp => (pp.from === a && pp.to === b) || (pp.from === b && pp.to === a));
      if (path) this.lit.paths.add(path.n);
    }
  }

  showFlash(v) { this.flashGroup.visible = v; this.flashState.visible = v; if (!v) { this.sparkLight.intensity = 0; } }

  buildSerpent() {
    this.serpentGroup = new THREE.Group();
    this.serpentGroup.visible = false;
    // crossing points in ascent order, start below Malkuth, end at Kether
    const pts = [];
    const m = sephPos(SEPH_BY_KEY.malkuth);
    pts.push(tv(m.x + 0.9, m.y - 0.55, 0.5));
    pts.push(tv(m.x + 0.45, m.y - 0.15, 0.55));
    this.serpentCross = [];
    for (const n of SERPENT_ORDER) {
      const p = PATH_BY_N[n];
      const a = sephPos(SEPH_BY_KEY[p.from]), b = sephPos(SEPH_BY_KEY[p.to]);
      const pt = tv(lerp(a.x, b.x, p.serpent.t), lerp(a.y, b.y, p.serpent.t), p.serpent.z);
      pts.push(pt);
      this.serpentCross.push({ n, index: pts.length - 1 });
    }
    const k = sephPos(SEPH_BY_KEY.kether);
    pts.push(tv(k.x, k.y - 0.1, 0.45));
    this.serpentCurve = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
    this.serpentSegments = 520; this.serpentRadial = 9;
    const geo = new THREE.TubeGeometry(this.serpentCurve, this.serpentSegments, 0.085, this.serpentRadial, false);
    this.serpentTex = makeSerpentTexture("serpent");
    this.serpentMat = new THREE.MeshStandardMaterial({ map: this.serpentTex, roughness: 0.4, metalness: 0.35, emissive: 0x2a5a30, emissiveIntensity: 0.25 });
    this.serpentTube = new THREE.Mesh(geo, this.serpentMat);
    this.serpentGroup.add(this.serpentTube);
    // head
    this.serpentHead = new THREE.Group();
    const headMat = new THREE.MeshStandardMaterial({ color: 0x3a9a60, roughness: 0.4, metalness: 0.3, emissive: 0x1a4a2a, emissiveIntensity: 0.3 });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 16), headMat);
    cone.rotation.x = Math.PI / 2; cone.position.z = 0.16;
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffd34d });
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat); e1.position.set(0.06, 0.05, 0.1);
    const e2 = e1.clone(); e2.position.x = -0.06;
    this.serpentHead.add(cone, e1, e2);
    this.serpentHeadMat = headMat;
    this.serpentGroup.add(this.serpentHead);
    this.serpentGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0x9fffb0, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.serpentGlow.scale.setScalar(1.1);
    this.serpentGroup.add(this.serpentGlow);
    this.scene.add(this.serpentGroup);
    // arc-length fractions of each crossing point
    const div = 2000, lengths = this.serpentCurve.getLengths(div), total = lengths[div];
    const L = pts.length;
    this.serpentU = pts.map((_, i) => lengths[Math.round((i / (L - 1)) * div)] / total);
    this.setSerpentProgress(0);
  }

  setSerpentKind(kind) {
    if (kind === this.serpentState.kind) return;
    this.serpentState.kind = kind;
    this.serpentTex.dispose();
    this.serpentTex = makeSerpentTexture(kind);
    this.serpentMat.map = this.serpentTex; this.serpentMat.needsUpdate = true;
    const dragon = kind === "dragon";
    this.serpentMat.emissive.set(dragon ? 0x6a1a10 : 0x2a5a30);
    this.serpentHeadMat.color.set(dragon ? 0xc9302a : 0x3a9a60);
    this.serpentHeadMat.emissive.set(dragon ? 0x5a1008 : 0x1a4a2a);
    this.serpentGlow.material.color.set(dragon ? 0xffb080 : 0x9fffb0);
  }

  /* progress: 0..22 continuous (integer k = head resting on crossing k, 1-based; 0 = coiled at Malkuth) */
  setSerpentProgress(p) {
    this.serpentState.progress = p;
    const q = clamp(p, 0, SERPENT_ORDER.length);
    // map 0..22 onto curve point indices: 0 → start (index 1), k → crossing k (index 1+k), 22 → crossing 22; beyond: tail to Kether
    const idx = 1 + q;
    const i = Math.floor(idx), f = idx - i;
    const uA = this.serpentU[Math.min(i, this.serpentU.length - 1)];
    const uB = this.serpentU[Math.min(i + 1, this.serpentU.length - 1)];
    let u = lerp(uA, uB, f);
    if (q >= SERPENT_ORDER.length) u = this.serpentU[this.serpentU.length - 1]; // finished: reach Kether
    u = clamp(u, 0.0005, 0.9995);
    const count = Math.floor(u * this.serpentSegments) * this.serpentRadial * 6;
    this.serpentTube.geometry.setDrawRange(0, count);
    const pos = this.serpentCurve.getPointAt(u), tan = this.serpentCurve.getTangentAt(u);
    this.serpentHead.position.copy(pos);
    this.serpentHead.lookAt(pos.clone().add(tan));
    this.serpentGlow.position.copy(pos);
    this.lit.paths = new Set(SERPENT_ORDER.slice(0, Math.floor(q + 1e-6)));
    // Sephiroth touched: both ends of every path reached
    this.lit.sephiroth = new Set();
    for (const n of this.lit.paths) { const pp = PATH_BY_N[n]; this.lit.sephiroth.add(pp.from); this.lit.sephiroth.add(pp.to); }
    if (q < 1) this.lit.sephiroth.add("malkuth");
    if (q >= SERPENT_ORDER.length) this.lit.sephiroth.add("kether");
  }

  showSerpent(v) { this.serpentGroup.visible = v; this.serpentState.visible = v; }

  /* ---- Shem HaMephorash ring ---- */
  setShem(names) {
    if (this.ring) this.scene.remove(this.ring);
    this.ring = new THREE.Group();
    this.ringItems = [];
    const N = names.length;
    for (let i = 0; i < N; i++) {
      const nm = names[i];
      const tex = makeTextTexture({ lines: [{ text: nm.hebrew, hebrew: true, color: "#ffe9a8", gap: 50 }, { text: String(nm.n), font: "500 26px system-ui, sans-serif", color: "#aab0d8", gap: 50 }], width: 160, height: 160 });
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85, depthWrite: false }));
      sp.scale.set(0.5, 0.5, 1);
      sp.userData = { shem: nm.n };
      this.ring.add(sp);
      this.ringItems.push({ sp, n: nm.n, angle: (i / N) * Math.PI * 2, row: i % 2 });
    }
    // ring base: a faint torus
    this.ringTorus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 8, 144), new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.35, depthWrite: false }));
    this.ringTorus.rotation.x = Math.PI / 2;
    this.ring.add(this.ringTorus);
    this.scene.add(this.ring);
    this.ringFocus = null; this.ringSpin = 0; this.ringGoal = null;
    this.placeRing(this.options.ringPlace);
  }

  placeRing(place) {
    this.options.ringPlace = place;
    if (!this.ring) return;
    const cfg = { base: { y: -1.5, r: 4.3 }, crown: { y: 9.3, r: 3.6 }, encircle: { y: 4.0, r: 5.4 } }[place] || { y: -1.5, r: 4.3 };
    this.ringCfg = cfg;
    this.ring.position.set(0, cfg.y + Y_OFF, 0);
    this.ringTorus.scale.setScalar(cfg.r);
    for (const it of this.ringItems) { it.baseY = it.row * 0.46; it.sp.position.set(Math.sin(it.angle) * cfg.r, it.baseY, Math.cos(it.angle) * cfg.r); }
  }

  focusShem(n) {
    this.ringFocus = n;
    if (n == null) { this.ringGoal = null; return; }
    const it = this.ringItems.find(i => i.n === n);
    if (!it) return;
    // rotate the ring so the item faces the camera (camera azimuth = orbit.theta)
    const target = this.orbit.theta - it.angle;
    // choose the nearest equivalent angle
    const cur = this.ringSpin;
    let d = ((target - cur) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    this.ringGoal = cur + d;
  }

  /* ---- highlighting ---- */
  setLit(sephiroth = [], paths = []) {
    this.lit.sephiroth = new Set(sephiroth);
    this.lit.paths = new Set(paths);
  }
  clearLit() { this.lit.sephiroth.clear(); this.lit.paths.clear(); }

  setOptions(o) {
    Object.assign(this.options, o);
    this.labelGroup.visible = this.options.labels;
    this.pathLabelGroup.visible = this.options.pathLabels;
    this.worldsGroup.visible = this.options.worlds;
    this.pillarsGroup.visible = this.options.pillars;
    const d = this.sephMeshes.daath; d.mesh.visible = d.label.visible = this.options.daath && this.options.labels;
    d.mesh.visible = this.options.daath;
    if (this.ring) this.ring.visible = this.options.ring;
    if (o.ringPlace) this.placeRing(o.ringPlace);
    this.orbit.autoRotate = !!this.options.autoRotate && !REDUCED;
  }

  focusSephirah(key) {
    const m = this.sephMeshes[key];
    if (!m) return;
    this.orbit.flyTo({ theta: this.orbit.theta, phi: this.orbit.phi, radius: Math.min(this.orbit.radius, Math.max(10, TreeScene.fitRadius(this.fit) * 0.8)), target: new THREE.Vector3(0, 0.35 + m.pos.y * 0.5, 0) });
  }
  resetView() { this.orbit.reset(this.fit); }

  /* the part of the canvas not covered by UI; the camera centres the Tree inside it */
  setVisibleRect(rect) {
    this.visibleRect = rect;
    this.resize();
    if (!this.orbit.userZoomed) {
      const g = this.orbit.goal;
      this.orbit.flyTo({ theta: g ? g.theta : this.orbit.theta, phi: g ? g.phi : this.orbit.phi, radius: TreeScene.fitRadius(this.fit), target: g ? g.target : this.orbit.target.clone() });
    }
  }

  handleTap(x, y) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc, this.camera);
    const targets = [...this.sephGroup.children.filter(c => c.isMesh && c.visible), ...this.pathsGroup.children];
    if (this.ring && this.ring.visible) targets.push(...this.ring.children.filter(c => c.isSprite));
    const hits = rc.intersectObjects(targets, false);
    if (!hits.length || !this.onSelect) return;
    const u = hits[0].object.userData;
    if (u.seph) this.onSelect({ type: "sephirah", key: u.seph });
    else if (u.path) this.onSelect({ type: "path", n: u.path });
    else if (u.shem) this.onSelect({ type: "shem", n: u.shem });
  }

  /* ---- frame loop ---- */
  resize() {
    const W = this.container.clientWidth || 1, H = this.container.clientHeight || 1;
    this.renderer.setSize(W, H, false);
    const r = this.visibleRect && this.visibleRect.w > 40 && this.visibleRect.h > 40 ? this.visibleRect : { x: 0, y: 0, w: W, h: H };
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const Fw = 2 * Math.max(cx, W - cx), Fh = 2 * Math.max(cy, H - cy);
    this.camera.aspect = Fw / Fh;
    this.camera.setViewOffset(Fw, Fh, Fw / 2 - cx, Fh / 2 - cy, W, H);
    this.camera.updateProjectionMatrix();
    this.fit = { h: r.h / Fh, w: r.w / Fh };
  }

  loop() {
    if (!this.running) return;
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.time += dt;
    this.orbit.update(dt);
    const pulse = REDUCED ? 0.5 : 0.5 + 0.5 * Math.sin(this.time * 2.2);

    // Sephiroth glow states
    for (const k in this.sephMeshes) {
      const m = this.sephMeshes[k];
      const on = this.lit.sephiroth.has(k);
      const tgtE = on ? 0.8 + pulse * 0.4 : m.baseEmissive;
      const tgtG = on ? 0.62 : m.baseGlow;
      const tgtS = on ? m.baseScale * (1.7 + pulse * 0.3) : m.baseScale;
      m.mat.emissiveIntensity = lerp(m.mat.emissiveIntensity, tgtE, 0.12);
      m.glow.material.opacity = lerp(m.glow.material.opacity, tgtG, 0.12);
      const sc = lerp(m.glow.scale.x, tgtS, 0.12); m.glow.scale.setScalar(sc);
      if (m.s.hidden) m.mat.opacity = on ? 0.9 : 0.35;
    }
    // path states
    for (const n in this.pathMeshes) {
      const pm = this.pathMeshes[n];
      const on = this.lit.paths.has(+n);
      pm.mat.emissiveIntensity = lerp(pm.mat.emissiveIntensity, on ? 1.1 + pulse * 0.5 : 0, 0.12);
      pm.mat.color.lerp(on ? pm.mat.emissive : new THREE.Color(pm.base), 0.12);
      pm.mesh.scale.x = pm.mesh.scale.z = lerp(pm.mesh.scale.x, on ? 1.8 : 1, 0.12);
    }
    // spark shimmer
    if (this.flashGroup.visible && this.spark.visible) {
      const s = 1.6 + pulse * 0.7; this.sparkGlow.scale.setScalar(s);
      this.sparkLight.intensity = 10 + pulse * 10;
    }
    if (this.serpentGroup.visible) this.serpentGlow.scale.setScalar(0.9 + pulse * 0.5);
    // ring
    if (this.ring && this.ring.visible) {
      if (this.ringGoal != null) {
        this.ringSpin = lerp(this.ringSpin, this.ringGoal, 1 - Math.pow(0.002, dt));
        if (Math.abs(this.ringSpin - this.ringGoal) < 1e-3) this.ringGoal = null;
      } else if (this.ringFocus == null && !REDUCED) {
        this.ringSpin += dt * 0.05;
      }
      this.ring.rotation.y = this.ringSpin;
      for (const it of this.ringItems) {
        const on = it.n === this.ringFocus;
        const tgt = on ? 1.4 : 0.5;
        const sc = lerp(it.sp.scale.x, tgt, 0.15);
        it.sp.scale.set(sc, sc, 1);
        it.sp.material.opacity = lerp(it.sp.material.opacity, on ? 1 : (this.ringFocus == null ? 0.85 : 0.35), 0.15);
        it.sp.position.y = lerp(it.sp.position.y, on ? it.baseY + 0.9 : it.baseY, 0.15);
      }
    }
    this.stars.rotation.y += dt * 0.004;
    this.renderer.render(this.scene, this.camera);
  }
}
