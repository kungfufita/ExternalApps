/* Pathworking — UI controller */
import { TreeScene } from "./tree.js";
import {
  SEPHIROTH, SEPH_BY_KEY, PATHS, PATH_BY_N, DESCENTS, SERPENT_ORDER, buildShem, letterName, WORLDS,
} from "./data.js";
import {
  SOURCES, ORDER, DANGERS, ENTERING, PROTECTION, INTEGRATION, TEMPLES, PATH_SCRIPTS, PROTECTION_STEPS, JOURNAL_MATERIALS,
  sessionNeeds, DEFAULT_EFFECT_KINDS,
} from "./guide.js";
import { FOUR_WORLDS, WORLD_BY_KEY, FOUR_SHELLS, QLIPHOTH, LADDER_NOTE, QLIPHOTH_NOTE } from "./worlds.js";
import { MAJORS, MAJOR_BY_PATH, SUITS, buildMinors, TAROT_USES, TAROT_SECRET, TAROT_SOURCES } from "./tarot.js";
import { APP_VERSION, CHANGELOG, TYPE_LABELS } from "./changelog.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ord = n => { const r = n % 100, u = n % 10; return n + (r >= 11 && r <= 13 ? "th" : u === 1 ? "st" : u === 2 ? "nd" : u === 3 ? "rd" : "th"); };
const fmt = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const store = {
  get(k, d) { try { const v = localStorage.getItem("pw:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("pw:" + k, JSON.stringify(v)); } catch { /* private mode */ } },
};

/* ───────────── scene ───────────── */
const scene = new TreeScene($("#scene"));
const shem = buildShem();
scene.setShem(shem.names);

const hud = { title: $("#hud-title"), sub: $("#hud-sub") };
function setHud(title, sub = "") { hud.title.innerHTML = title; hud.sub.innerHTML = sub; }

let toastTimer;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

/* ───────────── panel + tabs ───────────── */
const panel = $("#panel");
const stage = $(".stage");
let mode = "tree";
const PANEL_W = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--panel-w")) || 450;

/* Layout: auto (by screen width), or forced phone / desktop. Sets body.wide / body.narrow, which the stylesheet keys on. */
const layoutPick = $("#layout-pick");
const wideQuery = matchMedia("(min-width: 900px)");
let layout = store.get("layout", "auto");
layoutPick.value = layout;
const isWide = () => layout === "desktop" || (layout === "auto" && wideQuery.matches);
function applyLayout() {
  const wide = isWide();
  document.body.classList.toggle("wide", wide);
  document.body.classList.toggle("narrow", !wide);
  if (wide) panel.classList.remove("tall");
  updateViewport();
}
layoutPick.addEventListener("change", () => { layout = layoutPick.value; store.set("layout", layout); applyLayout(); toast(layout === "auto" ? "Layout follows the screen size" : `${layout === "phone" ? "Phone" : "Desktop"} layout`); });
wideQuery.addEventListener("change", applyLayout);

function updateViewport() {
  const W = innerWidth, H = innerHeight, wide = isWide();
  const collapsed = panel.classList.contains("collapsed");
  stage.classList.toggle("panel-hidden", collapsed);
  const top = wide ? 70 : 118;
  let rect;
  if (wide) rect = { x: 0, y: top, w: collapsed ? W : W - PANEL_W - 28, h: H - top - 10 };
  else rect = { x: 0, y: top, w: W, h: (collapsed ? H - 58 : H - panel.offsetHeight) - top - 6 };
  scene.setVisibleRect(rect);
}
function setCollapsed(c) {
  panel.classList.toggle("collapsed", c);
  if (c) panel.classList.remove("tall");
  $("#toggle-panel").setAttribute("aria-expanded", String(!c));
  gripHint();
  updateViewport();
}
/* phone sheet: tap the grip to cycle half → tall → hidden → half */
function gripHint() {
  const h = $("#grip-hint");
  h.textContent = panel.classList.contains("collapsed") ? "tap to open" : panel.classList.contains("tall") ? "tap to hide" : "tap to expand";
}
function cycleSheet() {
  if (panel.classList.contains("collapsed")) setCollapsed(false);
  else if (!panel.classList.contains("tall")) { panel.classList.add("tall"); gripHint(); updateViewport(); }
  else setCollapsed(true);
}
$("#toggle-panel").addEventListener("click", () => setCollapsed(!panel.classList.contains("collapsed")));
$(".panel-grip").addEventListener("click", cycleSheet);
$(".panel-grip").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cycleSheet(); } });
addEventListener("resize", updateViewport);
new ResizeObserver(updateViewport).observe(panel);
$("#reset-view").addEventListener("click", () => scene.resetView());

$$(".tab").forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.tab)));
function setMode(m) {
  mode = m;
  $$(".tab").forEach(t => t.setAttribute("aria-selected", String(t.dataset.tab === m)));
  $$(".tabpanel").forEach(p => (p.hidden = p.dataset.tab !== m));
  if (panel.classList.contains("collapsed")) setCollapsed(false);
  if (!isWide()) { $(`.tab[data-tab="${m}"]`)?.scrollIntoView({ inline: "center", block: "nearest" }); $(".panel-body").scrollTop = 0; }
  scene.showFlash(m === "descent");
  scene.showSerpent(m === "ascent");
  scene.focusShem(null);
  if (scene.ladderFocus && m !== "worlds") { scene.focusWorld(null); scene.resetView(); $$(".world-chip").forEach(c => c.classList.remove("active")); }
  if (m === "tree") { scene.clearLit(); setHud("Tree of Life", "Drag to rotate · pinch or scroll to zoom · tap a sphere, path or name"); }
  if (m === "descent") { scene.setFlashProgress(descent.position()); descentRender(); }
  if (m === "ascent") { scene.setSerpentProgress(ascent.position()); ascentRender(); }
  if (m === "names") {
    if (!scene.options.ring) { scene.setOptions({ ring: true }); $('[data-opt="ring"]').checked = true; }
    scene.clearLit(); setHud("Shem HaMephorash", "The 72 Names · tap a name in the ring or the list");
  }
  if (m === "worlds") { scene.clearLit(); setHud("The Four Worlds", "Above: Atziluth, Briah, Yetzirah, Assiah · Below: the four Shells · tap a World"); }
  if (m === "tarot") { scene.clearLit(); setHud("Tarot", "The 78 cards on the Tree · tap a card"); if (tarotSelected) selectTarot(tarotSelected); }
  if (m === "guide") { guideRender(); renderReadiness(); }
  if (m === "journal") { scene.clearLit(); setHud("Journal", "Your record of each working and what followed it · kept on this device"); journalRender(); }
  if (m === "history") { scene.clearLit(); setHud("Revision history", `Pathworking ${APP_VERSION} · what was added, adjusted and fixed`); }
  store.set("mode", m);
}

/* ───────────── sequence player ───────────── */
class Player {
  constructor({ count, travel, hold, onUpdate }) {
    Object.assign(this, { count, travel, hold, onUpdate, t: 0, playing: false, last: 0 });
  }
  cycle() { return this.travel + this.hold; }
  total() { return (this.count - 1) * this.cycle() + this.hold; }
  position() {
    const c = this.cycle(), k = Math.floor(this.t / c), r = this.t - k * c;
    if (k >= this.count - 1) return this.count - 1;
    return r < this.hold ? k : k + (r - this.hold) / this.travel;
  }
  phase() {
    const c = this.cycle(), k = Math.floor(this.t / c), r = this.t - k * c;
    if (k >= this.count - 1) return { node: this.count - 1, resting: true, frac: 1, done: true };
    return r < this.hold ? { node: k, resting: true, frac: this.hold ? r / this.hold : 1 } : { node: k, resting: false, frac: (r - this.hold) / this.travel };
  }
  seek(node) { this.t = Math.max(0, Math.min(node, this.count - 1)) * this.cycle(); this.emit(); }
  step(d) { const ph = this.phase(); this.seek(ph.resting ? ph.node + d : (d > 0 ? ph.node + 1 : ph.node)); }
  play() { this.playing = true; this.last = performance.now(); if (this.phase().done) this.t = 0; this.tick(); }
  pause() { this.playing = false; }
  toggle() { this.playing ? this.pause() : this.play(); return this.playing; }
  tick() {
    if (!this.playing) return;
    const now = performance.now(); const dt = Math.min((now - this.last) / 1000, 0.25); this.last = now;
    this.t = Math.min(this.t + dt, this.total());
    this.emit();
    if (this.t >= this.total()) { this.playing = false; this.emit(); return; }
    requestAnimationFrame(() => this.tick());
  }
  emit() { this.onUpdate(this.position(), this.phase()); }
}

/* ───────────── correspondences cards ───────────── */
function sephCard(s, { close = true } = {}) {
  const pillar = { right: "Pillar of Mercy", left: "Pillar of Severity", mid: "Pillar of Equilibrium" }[s.pillar];
  return `
    ${close ? '<button class="close" type="button" aria-label="Close">×</button>' : ""}
    <div class="title"><span class="heb">${esc(s.hebrew)}</span><span class="name">${esc(s.name)}</span><span class="meta">${s.hidden ? "hidden" : s.id} · ${esc(s.meaning)}</span></div>
    <dl>
      <dt>Divine Name</dt><dd>${esc(s.godName)}${s.godHebrew ? `<span class="heb">${esc(s.godHebrew)}</span>` : ""}</dd>
      <dt>Archangel</dt><dd>${esc(s.archangel)}</dd>
      <dt>Choir</dt><dd>${esc(s.choir)}</dd>
      <dt>Sphere</dt><dd>${esc(s.planet)}</dd>
      <dt>Intelligence</dt><dd>${esc(s.intelligence)}</dd>
      <dt>World · Pillar</dt><dd>${esc(s.world)} · ${pillar}</dd>
      <dt>Colour</dt><dd><span class="swatch" style="background:${s.color}"></span>${esc(s.colorName)}</dd>
    </dl>
    <p class="note">${esc(s.note)}</p>`;
}
function pathCard(p, { close = true } = {}) {
  const a = SEPH_BY_KEY[p.from], b = SEPH_BY_KEY[p.to];
  return `
    ${close ? '<button class="close" type="button" aria-label="Close">×</button>' : ""}
    <div class="title"><span class="heb">${esc(p.letter)}</span><span class="name">${esc(p.name)}</span><span class="meta">Path ${p.n} · ${esc(p.lmeaning)}</span></div>
    <dl>
      <dt>Joins</dt><dd>${esc(b.name)} ↔ ${esc(a.name)}</dd>
      <dt>Attribution</dt><dd>${esc(p.glyph)} ${esc(p.attr)}</dd>
      <dt>Tarot</dt><dd>${esc(p.tarot)}</dd>
      <dt>Intelligence</dt><dd>${esc(p.intelligence)}</dd>
      <dt>Colour</dt><dd><span class="swatch" style="background:${p.color}"></span>${esc(p.colorName)}</dd>
    </dl>`;
}
function shemCard(nm, { close = true } = {}) {
  return `
    ${close ? '<button class="close" type="button" aria-label="Close">×</button>' : ""}
    <div class="big-heb" lang="he" dir="rtl">${esc(nm.hebrew)}</div>
    <div class="center"><strong>${nm.n}</strong> · ${esc(nm.angel)} <span class="heb">${esc(nm.root + nm.suffix)}</span></div>
    <dl>
      <dt>Letters</dt><dd>${nm.letterNames.map(esc).join(" · ")}</dd>
      <dt>From verse 19</dt><dd>letter ${nm.indices.v19 + 1}: <span class="heb">${esc(nm.letters[0])}</span></dd>
      <dt>From verse 20</dt><dd>letter ${nm.indices.v20 + 1} (read backwards): <span class="heb">${esc(nm.letters[1])}</span></dd>
      <dt>From verse 21</dt><dd>letter ${nm.indices.v21 + 1}: <span class="heb">${esc(nm.letters[2])}</span></dd>
      <dt>Angelic form</dt><dd>${nm.suffix === "יה" ? "־יה (-iah), of Mercy" : "־אל (-el), of Severity"}</dd>
    </dl>`;
}

/* ───────────── TREE tab ───────────── */
const detail = $("#detail");
function showDetail(html) {
  detail.innerHTML = html; detail.hidden = false;
  $(".close", detail)?.addEventListener("click", () => { detail.hidden = true; scene.clearLit(); setChipActive(null); });
  detail.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function setChipActive(id) { $$(".chip").forEach(c => c.classList.toggle("active", c.dataset.id === id)); }

const sephList = $("#seph-list");
for (const s of SEPHIROTH) {
  const b = document.createElement("button");
  b.className = "chip"; b.type = "button"; b.dataset.id = "s:" + s.key;
  b.innerHTML = `<span class="dot" style="background:${s.quartered ? "linear-gradient(135deg,#c7b94a,#6b7a2a,#8b4a2a,#1b1b22)" : s.color}"></span>${esc(s.name)} <span class="heb">${esc(s.hebrew)}</span>`;
  b.addEventListener("click", () => selectSephirah(s.key));
  sephList.appendChild(b);
}
const pathList = $("#path-list");
for (const p of PATHS) {
  const b = document.createElement("button");
  b.className = "chip"; b.type = "button"; b.dataset.id = "p:" + p.n;
  b.innerHTML = `<span class="dot" style="background:${p.color}"></span>${p.n} <span class="heb">${esc(p.letter)}</span> ${esc(p.name)}`;
  b.addEventListener("click", () => selectPath(p.n));
  pathList.appendChild(b);
}
function selectSephirah(key) {
  const s = SEPH_BY_KEY[key];
  if (mode !== "tree") setMode("tree");
  scene.setLit([key], []); scene.focusSephirah(key);
  setChipActive("s:" + key); showDetail(sephCard(s));
  setHud(`${esc(s.name)} <span class="heb">${esc(s.hebrew)}</span>`, `${s.hidden ? "The hidden Sephirah" : "Sephirah " + s.id} · ${esc(s.meaning)} · ${esc(s.godName)}`);
}
function selectPath(n) {
  const p = PATH_BY_N[n];
  if (mode !== "tree") setMode("tree");
  scene.setLit([p.from, p.to], [n]);
  setChipActive("p:" + n); showDetail(pathCard(p));
  setHud(`Path ${n} · ${esc(p.name)} <span class="heb">${esc(p.letter)}</span>`, `${esc(SEPH_BY_KEY[p.to].name)} ↔ ${esc(SEPH_BY_KEY[p.from].name)} · ${esc(p.attr)} · ${esc(p.tarot)}`);
}
scene.onSelect = sel => {
  if (sel.type === "sephirah") selectSephirah(sel.key);
  else if (sel.type === "path") selectPath(sel.n);
  else if (sel.type === "shem") { setMode("names"); selectShem(sel.n); }
  else if (sel.type === "world") selectWorld(sel.key, { fromScene: true });
};

$$("[data-opt]").forEach(cb => {
  const saved = store.get("opt." + cb.dataset.opt, null);
  if (saved != null) cb.checked = saved;
  cb.addEventListener("change", () => { scene.setOptions({ [cb.dataset.opt]: cb.checked }); store.set("opt." + cb.dataset.opt, cb.checked); });
});
scene.setOptions(Object.fromEntries($$("[data-opt]").map(cb => [cb.dataset.opt, cb.checked])));
const ringPlace = $("#ring-place");
ringPlace.value = store.get("ringPlace", "base");
scene.setOptions({ ringPlace: ringPlace.value });
ringPlace.addEventListener("change", () => { scene.setOptions({ ringPlace: ringPlace.value }); store.set("ringPlace", ringPlace.value); });

/* ───────────── DESCENT tab ───────────── */
let descentPreset = store.get("descentPreset", "flash");
$("#descent-preset").value = descentPreset;
const dTravel = $("#d-travel"), dHold = $("#d-hold");
dTravel.value = store.get("dTravel", 3); dHold.value = store.get("dHold", 8);

const descent = new Player({ count: DESCENTS[descentPreset].steps.length, travel: +dTravel.value, hold: +dHold.value, onUpdate: descentUpdate });
function descentReset() {
  const d = DESCENTS[descentPreset];
  descent.pause(); descent.count = d.steps.length; descent.t = 0;
  scene.setFlashSequence(d.steps);
  const ol = $("#d-steps"); ol.innerHTML = "";
  d.steps.forEach((k, i) => {
    const s = SEPH_BY_KEY[k];
    const li = document.createElement("li");
    li.innerHTML = `<span class="dot" style="background:${s.quartered ? "#c7b94a" : s.color}"></span><span class="heb">${esc(s.hebrew)}</span><span class="lbl">${esc(s.name)}<div class="sub">${esc(s.meaning)}${s.hidden ? " · across the Abyss" : " · " + esc(s.godName)}</div></span>`;
    li.addEventListener("click", () => { descent.seek(i); });
    ol.appendChild(li);
  });
  descent.emit();
}
function descentUpdate(pos, ph) {
  if (mode === "descent") scene.setFlashProgress(pos);
  const d = DESCENTS[descentPreset];
  $("#d-bar").style.width = `${(descent.t / descent.total()) * 100}%`;
  $$("#d-steps li").forEach((li, i) => { li.classList.toggle("active", i === ph.node); li.classList.toggle("done", i < ph.node); });
  const s = SEPH_BY_KEY[d.steps[ph.node]];
  const nxt = SEPH_BY_KEY[d.steps[ph.node + 1]];
  $("#d-detail").innerHTML = sephCard(s, { close: false });
  const btn = $('[data-act="d-play"]');
  btn.textContent = descent.playing ? "❚❚ Pause" : ph.done ? "↻ Again" : descent.t > 0 ? "▶ Resume" : "▶ Begin";
  if (mode === "descent") {
    const where = ph.resting
      ? `Resting in ${esc(s.name)} · ${esc(s.meaning)} — ${ph.done ? "the channels are open" : `vibrate <b>${esc(s.godName)}</b>`}`
      : `Descending to ${esc(nxt?.name || "")}${nxt?.hidden ? " — leaping the Abyss" : ""}`;
    setHud(`${esc(d.name)} <span class="heb">${esc(s.hebrew)}</span>`, where);
  }
}
function descentRender() { descentUpdate(descent.position(), descent.phase()); }
$("#descent-preset").addEventListener("change", e => { descentPreset = e.target.value; store.set("descentPreset", descentPreset); descentReset(); });
dTravel.addEventListener("change", () => { descent.travel = Math.max(0.5, +dTravel.value || 3); store.set("dTravel", descent.travel); descent.seek(descent.phase().node); });
dHold.addEventListener("change", () => { descent.hold = Math.max(0, +dHold.value || 0); store.set("dHold", descent.hold); descent.seek(descent.phase().node); });
descentReset();

/* ───────────── ASCENT tab ───────────── */
const sTravel = $("#s-travel");
sTravel.value = store.get("sTravel", 6);
const ascent = new Player({ count: SERPENT_ORDER.length + 1, travel: +sTravel.value, hold: 1.2, onUpdate: ascentUpdate });
{
  const ol = $("#s-steps");
  const li0 = document.createElement("li");
  li0.innerHTML = `<span class="num">—</span><span class="heb">מלכות</span><span class="lbl">Malkuth<div class="sub">coiled at the root</div></span>`;
  li0.addEventListener("click", () => ascent.seek(0));
  ol.appendChild(li0);
  SERPENT_ORDER.forEach((n, i) => {
    const p = PATH_BY_N[n];
    const li = document.createElement("li");
    li.innerHTML = `<span class="num">${n}</span><span class="heb">${esc(p.letter)}</span><span class="lbl">${esc(p.name)}<div class="sub">${esc(p.attr)}</div></span>`;
    li.addEventListener("click", () => ascent.seek(i + 1));
    ol.appendChild(li);
  });
}
function ascentUpdate(pos, ph) {
  if (mode === "ascent") scene.setSerpentProgress(pos);
  $("#s-bar").style.width = `${(ascent.t / ascent.total()) * 100}%`;
  $$("#s-steps li").forEach((li, i) => { li.classList.toggle("active", i === ph.node); li.classList.toggle("done", i < ph.node); });
  const btn = $('[data-act="s-play"]');
  btn.textContent = ascent.playing ? "❚❚ Pause" : ph.done ? "↻ Again" : ascent.t > 0 ? "▶ Resume" : "▶ Begin ascent";
  const kind = $("#serpent-kind").value === "dragon" ? "The Dragon" : "The Serpent of Wisdom";
  if (ph.node === 0) {
    $("#s-detail").innerHTML = sephCard(SEPH_BY_KEY.malkuth, { close: false });
    if (mode === "ascent") setHud(`${kind} <span class="heb">נחשתן</span>`, ph.resting ? "Coiled at the root of the Tree in Malkuth" : "Rising toward the 32nd path, Tav");
  } else {
    const n = SERPENT_ORDER[ph.node - 1], p = PATH_BY_N[n], nx = SERPENT_ORDER[ph.node];
    $("#s-detail").innerHTML = pathCard(p, { close: false });
    if (mode === "ascent") {
      const sub = ph.done ? "Arrived in Kether — the circuit is complete" : ph.resting ? `Path ${n} · ${esc(p.lmeaning)} · ${esc(p.attr)} · ${esc(p.tarot)}` : `Climbing from path ${n} toward path ${nx} (${esc(PATH_BY_N[nx].name)})`;
      setHud(`${kind} · ${esc(p.name)} <span class="heb">${esc(p.letter)}</span>`, sub);
    }
  }
}
function ascentRender() { ascentUpdate(ascent.position(), ascent.phase()); }
$("#serpent-kind").value = store.get("serpentKind", "serpent");
scene.setSerpentKind($("#serpent-kind").value);
$("#serpent-kind").addEventListener("change", e => { scene.setSerpentKind(e.target.value); store.set("serpentKind", e.target.value); ascentRender(); });
sTravel.addEventListener("change", () => { ascent.travel = Math.max(1, +sTravel.value || 6); store.set("sTravel", ascent.travel); ascent.seek(ascent.phase().node); });
ascent.emit();

/* transport buttons */
document.addEventListener("click", e => {
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (!act) return;
  const map = {
    "d-play": () => descent.toggle(), "d-prev": () => descent.step(-1), "d-next": () => descent.step(1), "d-restart": () => { descent.pause(); descent.seek(0); },
    "s-play": () => ascent.toggle(), "s-prev": () => ascent.step(-1), "s-next": () => ascent.step(1), "s-restart": () => { ascent.pause(); ascent.seek(0); },
    "g-play": () => guideToggle(), "g-prev": () => guideStep(-1), "g-next": () => guideStep(1),
  };
  map[act]?.();
  if (act.startsWith("d-")) descentRender();
  if (act.startsWith("s-")) ascentRender();
});

/* ───────────── NAMES tab ───────────── */
const shemGrid = $("#shem-grid");
let shemSelected = null;
for (const nm of shem.names) {
  const b = document.createElement("button");
  b.className = "shem"; b.type = "button"; b.dataset.n = nm.n;
  b.innerHTML = `<span class="heb" lang="he" dir="rtl">${esc(nm.hebrew)}</span><span class="num">${nm.n}</span><span class="ang">${esc(nm.angel)}</span>`;
  b.addEventListener("click", () => selectShem(nm.n));
  shemGrid.appendChild(b);
}
function selectShem(n) {
  shemSelected = n;
  const nm = shem.names[n - 1];
  $$(".shem").forEach(el => el.classList.toggle("active", +el.dataset.n === n));
  const card = $("#shem-detail"); card.innerHTML = shemCard(nm); card.hidden = false;
  $(".close", card).addEventListener("click", () => { card.hidden = true; shemSelected = null; scene.focusShem(null); $$(".shem").forEach(el => el.classList.remove("active")); renderDerivation(); });
  scene.focusShem(n);
  setHud(`${esc(nm.angel)} <span class="heb">${esc(nm.hebrew)}</span>`, `Name ${n} of 72 · ${nm.letterNames.join(" · ")}`);
  renderDerivation();
  $(".vl.hit", $("#shem-derivation"))?.scrollIntoView({ block: "nearest", inline: "center" });
  card.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
$("#shem-search").addEventListener("input", e => {
  const q = e.target.value.trim().toLowerCase();
  $$(".shem").forEach(el => {
    const nm = shem.names[+el.dataset.n - 1];
    const hit = !q || String(nm.n) === q || nm.hebrew.includes(q) || nm.root.includes(q) || nm.angel.toLowerCase().includes(q) || nm.letterNames.join(" ").toLowerCase().includes(q);
    el.classList.toggle("dim", !hit);
  });
});
$("#shem-derive").addEventListener("change", renderDerivation);
function renderDerivation() {
  const box = $("#shem-derivation");
  box.hidden = !$("#shem-derive").checked;
  if (box.hidden) return;
  const sel = shemSelected ? shem.names[shemSelected - 1] : null;
  const row = (label, letters, hitIdx, reversed) => {
    const cells = [...letters].map((ch, i) => `<span class="vl ${sel && i === hitIdx ? "hit" : ""}">${esc(ch)}</span>`);
    return `<div class="vrow"><span class="vlabel">${label}${reversed ? " ⟵" : ""}</span><div class="vletters" lang="he" dir="rtl">${cells.join("")}</div></div>`;
  };
  box.innerHTML =
    row("Ex. 14:19", shem.verses.v19, sel?.indices.v19, false) +
    row("Ex. 14:20", shem.verses.v20, sel?.indices.v20, true) +
    row("Ex. 14:21", shem.verses.v21, sel?.indices.v21, false) +
    `<div class="vnote">Each row is 72 letters, read right to left. Verse 20 is taken in reverse (boustrophedon), so Name 1 pairs the first letters of verses 19 and 21 with the last letter of verse 20.${sel ? ` Highlighted: Name ${sel.n}, <span class="heb">${esc(sel.hebrew)}</span>.` : ""}</div>`;
}

/* ───────────── WORLDS tab ───────────── */
const ladderToggle = $("#ladder-toggle");
const ladderOpt = $('[data-opt="ladder"]');
function setLadder(v) {
  ladderToggle.checked = v; ladderOpt.checked = v;
  scene.setOptions({ ladder: v }); store.set("opt.ladder", v);
}
ladderToggle.addEventListener("change", () => setLadder(ladderToggle.checked));
ladderOpt.addEventListener("change", () => { ladderToggle.checked = ladderOpt.checked; });
ladderToggle.checked = ladderOpt.checked;

function worldCard(w) {
  const rows = w.sephiroth.map(k => { const s = SEPH_BY_KEY[k]; return `<tr><td><span class="dot" style="background:${s.quartered ? "#c7b94a" : s.color}"></span>${esc(s.name)}</td><td>${esc(s[w.field])}</td></tr>`; }).join("");
  return `<button class="close" type="button" aria-label="Close">×</button>
    <div class="title"><span class="heb">${esc(w.hebrew)}</span><span class="name">${esc(w.name)}</span><span class="meta">${esc(w.meaning)}</span></div>
    <dl>
      <dt>Letter of the Name</dt><dd>${esc(w.letter)}</dd>
      <dt>Element</dt><dd>${esc(w.element)}</dd>
      <dt>Part of the soul</dt><dd>${esc(w.soul)}</dd>
      <dt>Tarot</dt><dd>${esc(w.suit)} · ${esc(w.court)} · ${esc(w.trumps)}</dd>
      <dt>Colour scale</dt><dd>${esc(w.scale)} — ${esc(w.scaleNote)}</dd>
      <dt>Partzuf</dt><dd>${esc(w.partzuf)}</dd>
      <dt>In the body</dt><dd>${esc(w.body)}</dd>
      <dt>How it is sensed</dt><dd>${esc(w.sense)}</dd>
      <dt>Joins</dt><dd>${esc(w.kether)}</dd>
    </dl>
    <p class="note">${esc(w.description)}</p>
    <p><strong>In practice.</strong> ${esc(w.practice)}</p>
    <h3 class="jh">${esc(w.hierarchy)} in ${esc(w.name)}</h3>
    <p class="note">${esc(w.hierarchyNote)}</p>
    <table class="vtable"><tbody>${rows}</tbody></table>`;
}
function shellCard(s) {
  const mirror = WORLD_BY_KEY[s.mirrors];
  return `<button class="close" type="button" aria-label="Close">×</button>
    <div class="title"><span class="heb">${esc(s.hebrew)}</span><span class="name">${esc(s.name)}</span><span class="meta">${esc(s.meaning)}</span></div>
    <dl>
      <dt>Source</dt><dd>${esc(s.source)}</dd>
      <dt>Reflects</dt><dd>${esc(mirror.name)} · ${esc(mirror.meaning)}</dd>
      <dt>Danger</dt><dd>${esc(s.danger)}</dd>
      <dt>Redeemed?</dt><dd>${esc(s.redeem)}</dd>
    </dl>
    <p class="note">${esc(s.description)}</p>
    <div class="stop"><strong>How to recognise it in a working</strong><p>${esc(s.recognise)}</p></div>`;
}
function selectWorld(key, { fromScene = false } = {}) {
  const w = WORLD_BY_KEY[key], sh = FOUR_SHELLS.find(x => x.key === key);
  if (!w && !sh) return;
  if (mode !== "worlds") setMode("worlds");
  if (!ladderToggle.checked) setLadder(true);
  scene.focusWorld(key);
  $$(".world-chip").forEach(c => c.classList.toggle("active", c.dataset.key === key));
  const d = $("#world-detail"); d.innerHTML = w ? worldCard(w) : shellCard(sh); d.hidden = false;
  $(".close", d).addEventListener("click", () => { d.hidden = true; scene.focusWorld(null); $$(".world-chip").forEach(c => c.classList.remove("active")); });
  setHud(`${esc((w || sh).name)} <span class="heb">${esc((w || sh).hebrew)}</span>`, esc((w || sh).meaning));
  if (!fromScene) d.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
{
  const wl = $("#worlds-list");
  for (const w of FOUR_WORLDS) {
    const b = document.createElement("button"); b.className = "world-chip"; b.type = "button"; b.dataset.key = w.key;
    b.style.setProperty("--wc", w.color);
    b.innerHTML = `<span class="w-name">${esc(w.name)} <span class="heb">${esc(w.hebrew)}</span></span><span class="w-sub">${esc(w.meaning.split(" · ")[0])} · ${esc(w.letter)} · ${esc(w.element)} · ${esc(w.hierarchy)}</span>`;
    b.addEventListener("click", () => selectWorld(w.key));
    wl.appendChild(b);
  }
  const sl = $("#shells-list");
  for (const s of FOUR_SHELLS) {
    const b = document.createElement("button"); b.className = "world-chip world-chip-shell"; b.type = "button"; b.dataset.key = s.key;
    b.style.setProperty("--wc", s.tone);
    b.innerHTML = `<span class="w-name">${esc(s.name)} <span class="heb">${esc(s.hebrew)}</span></span><span class="w-sub">${esc(s.meaning)}</span>`;
    b.addEventListener("click", () => selectWorld(s.key));
    sl.appendChild(b);
  }
  $("#ladder-note").innerHTML = `<p>${esc(LADDER_NOTE)}</p>`;
  $("#qliphoth-note").innerHTML = `<p class="prep-intro">${esc(QLIPHOTH_NOTE)}</p><table class="vtable"><thead><tr><th>Sephirah</th><th>Qlipha</th><th>What it is</th><th>Archdemon (777)</th></tr></thead><tbody>${SEPHIROTH.map(s => { const q = QLIPHOTH[s.key]; return `<tr><td><span class="dot" style="background:${s.quartered ? "#c7b94a" : s.color}"></span>${esc(s.name)}</td><td>${esc(q.name)} <span class="heb">${esc(q.hebrew)}</span></td><td>${esc(q.meaning)}</td><td>${esc(q.demon)}</td></tr>`; }).join("")}</tbody></table>`;
}

/* ───────────── TAROT tab ───────────── */
const MINORS = buildMinors();
const SUIT_BY_KEY = Object.fromEntries(SUITS.map(s => [s.key, s]));
const tarotFilter = $("#tarot-filter"), tarotSearch = $("#tarot-search"), tarotGrid = $("#tarot-grid");
tarotFilter.value = store.get("tarotFilter", "major");
let tarotSelected = null;
function tarotCards() {
  const f = tarotFilter.value, q = tarotSearch.value.trim().toLowerCase();
  let list = f === "major" ? MAJORS.map(m => ({ ...m, id: "major-" + m.num, kind: "major" })) : MINORS.filter(c => c.suit === f);
  if (q) list = list.filter(c => [c.name, c.title, c.roman, c.path, c.decan, c.seph].filter(Boolean).join(" ").toLowerCase().includes(q));
  return list;
}
function renderTarotGrid() {
  const list = tarotCards();
  tarotGrid.innerHTML = list.map(c => {
    if (c.kind === "major") { const p = PATH_BY_N[c.path]; return `<button class="tcard" type="button" data-id="${c.id}" style="--tc:${p.color}"><span class="t-num">${c.roman}</span><span class="t-name">${esc(c.name)}</span><span class="t-sub"><span class="heb">${esc(p.letter)}</span> path ${c.path} · ${esc(p.attr)}</span></button>`; }
    const s = SUIT_BY_KEY[c.suit], sp = SEPH_BY_KEY[c.seph];
    return `<button class="tcard" type="button" data-id="${c.id}" style="--tc:${s.color}"><span class="t-num">${c.kind === "court" ? c.name.split(" ")[0] : c.num}</span><span class="t-name">${esc(c.name)}</span><span class="t-sub">${esc(c.title)}<br>${esc(sp.name)} · ${esc(WORLD_BY_KEY[c.world].name)}</span></button>`;
  }).join("");
  $$(".tcard", tarotGrid).forEach(b => b.addEventListener("click", () => selectTarot(b.dataset.id)));
  $$(".tcard", tarotGrid).forEach(b => b.classList.toggle("active", b.dataset.id === tarotSelected));
}
function selectTarot(id) {
  tarotSelected = id;
  $$(".tcard").forEach(b => b.classList.toggle("active", b.dataset.id === id));
  const d = $("#tarot-detail"); d.hidden = false;
  if (id.startsWith("major-")) {
    const m = MAJORS[+id.slice(6)], p = PATH_BY_N[m.path], lo = SEPH_BY_KEY[p.to], up = SEPH_BY_KEY[p.from];
    d.innerHTML = `<button class="close" type="button" aria-label="Close">×</button>
      <div class="title"><span class="t-big" style="color:${p.color}">${m.roman}</span><span class="name">${esc(m.name)}</span><span class="meta">${esc(m.title)}</span></div>
      <dl>
        <dt>Path</dt><dd>${m.path} · <span class="heb">${esc(p.letter)}</span> ${esc(p.name)} (${esc(p.lmeaning)}) · ${esc(lo.name)} ↔ ${esc(up.name)}</dd>
        <dt>Attribution</dt><dd>${esc(p.glyph)} ${esc(p.attr)}</dd>
        <dt>Intelligence</dt><dd>${esc(p.intelligence)}</dd>
        <dt>Colour</dt><dd><span class="swatch" style="background:${p.color}"></span>${esc(p.colorName)}</dd>
        <dt>Upright</dt><dd>${esc(m.upright)}</dd>
        <dt>Reversed</dt><dd>${esc(m.reversed)}</dd>
      </dl>
      <div class="secret"><strong>What the image keeps</strong><p>${esc(m.secret)}</p></div>
      <div class="transport"><button class="btn btn-wide" type="button" id="t-open">Open this path in the Guide</button></div>`;
    scene.setLit([p.from, p.to], [p.n]);
    setHud(`${m.roman} · ${esc(m.name)} <span class="heb">${esc(p.letter)}</span>`, `${esc(m.title)} · path ${p.n}`);
    $("#t-open", d).addEventListener("click", () => { guideSel.value = p.n; store.set("guidePath", p.n); guideLoad(p.n); setMode("guide"); });
  } else {
    const c = MINORS.find(x => x.id === id), s = SUIT_BY_KEY[c.suit], sp = SEPH_BY_KEY[c.seph], w = WORLD_BY_KEY[c.world];
    d.innerHTML = `<button class="close" type="button" aria-label="Close">×</button>
      <div class="title"><span class="t-big" style="color:${s.color}">${esc(s.sign)}</span><span class="name">${esc(c.name)}</span><span class="meta">${esc(c.title)}</span></div>
      <dl>
        <dt>Suit</dt><dd>${esc(s.name)} · ${esc(s.element)} · ${esc(s.letter)} of the Name</dd>
        <dt>Sephirah</dt><dd><span class="dot-inline" style="background:${sp.quartered ? "#c7b94a" : sp.color}"></span>${esc(sp.name)} · ${esc(sp.meaning)}</dd>
        <dt>World</dt><dd>${esc(w.name)} · ${esc(w.meaning)}</dd>
        ${c.kind === "pip" ? `<dt>Decan</dt><dd>${esc(c.decan)}</dd>` : ""}
        <dt>Meaning</dt><dd>${esc(c.meaning)}</dd>
      </dl>`;
    scene.setLit([c.seph], []);
    setHud(`${esc(c.name)}`, `${esc(c.title)} · ${esc(sp.name)} in ${esc(w.name)}`);
  }
  $(".close", d).addEventListener("click", () => { d.hidden = true; tarotSelected = null; scene.clearLit(); $$(".tcard").forEach(b => b.classList.remove("active")); });
  d.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
tarotFilter.addEventListener("change", () => { store.set("tarotFilter", tarotFilter.value); renderTarotGrid(); });
tarotSearch.addEventListener("input", renderTarotGrid);
{
  const T = Object.fromEntries(TAROT_SOURCES.map(s => [s.key, s]));
  const tags = keys => `<span class="src">${keys.map(k => `<span class="src-tag" title="${esc(T[k].cite)}">${esc(T[k].cite.split(",")[0])}</span>`).join("")}</span>`;
  $("#tarot-uses").innerHTML = TAROT_USES.map(u => `<div class="method"><strong>${esc(u.title)}</strong><p>${esc(u.text)}</p>${tags(u.src)}</div>`).join("");
  $("#tarot-secret").innerHTML = `<strong class="secret-title">${esc(TAROT_SECRET.title)}</strong>${TAROT_SECRET.text.map(t => `<p>${esc(t)}</p>`).join("")}`;
  $("#tarot-sources").innerHTML = `<ul class="sources">${TAROT_SOURCES.map(s => `<li>${esc(s.cite)}</li>`).join("")}</ul>`;
}
renderTarotGrid();

/* ───────────── GUIDE tab: preparation ───────────── */
const SRC_BY_KEY = Object.fromEntries(SOURCES.map(s => [s.key, s]));
const srcTags = keys => keys?.length ? `<span class="src">${keys.map(k => `<span class="src-tag" title="${esc(SRC_BY_KEY[k].cite)}">${esc(SRC_BY_KEY[k].short)}</span>`).join("")}</span>` : "";
const paras = arr => arr.map(t => `<p>${esc(t)}</p>`).join("");

/* Pentagram diagram: points 0 top, 1 upper-right, 2 lower-right, 3 lower-left, 4 upper-left.
   `order` is the sequence of point indices for the stroke; numbered arrows show the strokes. */
function pentagramSVG(order, color, label) {
  const R = 44, cx = 50, cy = 54;
  const pt = i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; };
  const P = [0, 1, 2, 3, 4].map(pt);
  let d = "", marks = "";
  for (let k = 0; k < order.length - 1; k++) {
    const [x1, y1] = P[order[k]], [x2, y2] = P[order[k + 1]];
    d += `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} `;
    const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    const ax = x1 + (x2 - x1) * 0.62, ay = y1 + (y2 - y1) * 0.62;
    marks += `<g transform="translate(${ax.toFixed(1)} ${ay.toFixed(1)}) rotate(${ang.toFixed(1)})"><path d="M-4 -3.5 L2 0 L-4 3.5 Z" fill="${color}"/></g>`;
    // number badge near the start of the stroke, offset to the side so it sits clear of the lines
    const bx = x1 + (x2 - x1) * 0.2 + Math.cos((ang - 90) * Math.PI / 180) * 9, by = y1 + (y2 - y1) * 0.2 + Math.sin((ang - 90) * Math.PI / 180) * 9;
    marks += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="6" fill="#0d1020" stroke="${color}" stroke-width="0.8"/><text x="${bx.toFixed(1)}" y="${(by + 2.6).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="${color}" font-weight="700">${k + 1}</text>`;
  }
  const [sx, sy] = P[order[0]];
  return `<figure class="sym"><svg viewBox="0 0 100 108" role="img" aria-label="${esc(label)}">
    <path d="${d.trim()}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 4px ${color})"/>
    <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="4" fill="${color}"/><text x="${sx.toFixed(1)}" y="${(sy - 7).toFixed(1)}" text-anchor="middle" font-size="7" fill="#e8eaf6">start</text>
    ${marks}</svg><figcaption>${esc(label)}</figcaption></figure>`;
}
function hexagramSVG(color) {
  return `<figure class="sym"><svg viewBox="0 0 100 108" role="img" aria-label="Hexagram: fire triangle then water triangle">
    <polygon points="50,10 88,76 12,76" fill="none" stroke="#f03a3a" stroke-width="2.2" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px #f03a3a)"/>
    <polygon points="50,98 12,32 88,32" fill="none" stroke="#2f6fd6" stroke-width="2.2" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px #2f6fd6)"/>
    <circle cx="50" cy="10" r="3.5" fill="#f03a3a"/><text x="50" y="6" text-anchor="middle" font-size="6.5" fill="#e8eaf6">1 · fire ▲</text>
    <circle cx="50" cy="98" r="3.5" fill="#2f6fd6"/><text x="50" y="107" text-anchor="middle" font-size="6.5" fill="#e8eaf6">2 · water ▼</text>
    </svg><figcaption>Hexagram of the temple of arrival${color ? "" : ""}</figcaption></figure>`;
}
function crossSVG() {
  const pts = [["Ateh", 50, 14], ["ve-Gedulah", 18, 50], ["le-Olam, Amen", 50, 50], ["ve-Geburah", 82, 50], ["Malkuth", 50, 92]];
  return `<figure class="sym sym-wide"><svg viewBox="0 0 100 108" role="img" aria-label="The Kabbalistic Cross: forehead, breast, right shoulder, left shoulder, hands at heart">
    <line x1="50" y1="14" x2="50" y2="92" stroke="#fff7d6" stroke-width="2.2" style="filter:drop-shadow(0 0 4px #f2d14b)"/>
    <line x1="18" y1="50" x2="82" y2="50" stroke="#fff7d6" stroke-width="2.2" style="filter:drop-shadow(0 0 4px #f2d14b)"/>
    ${pts.map(([t, x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="#f2d14b"/><text x="${x}" y="${y + 1.9}" text-anchor="middle" font-size="5" fill="#1a1400" font-weight="700">${[1, 4, 5, 3, 2][i]}</text><text x="${x}" y="${y + (y === 50 ? 12 : y < 50 ? -8 : 13)}" text-anchor="middle" font-size="6" fill="#e8eaf6">${t}</text>`).join("")}
    </svg><figcaption>The Kabbalistic Cross: 1 brow, 2 breast, 3 right shoulder (viewer's left), 4 left shoulder, 5 hands at heart</figcaption></figure>`;
}

function renderPrep() {
  $("#prep-order").innerHTML = `<p class="prep-intro">${esc(ORDER.intro)}</p><ol class="prep-steps">${ORDER.steps.map(s => `<li><div class="ps-head"><strong>${esc(s.title)}</strong><span class="ps-when">${esc(s.weeks)}</span></div><p>${esc(s.text)}</p>${srcTags(s.src)}</li>`).join("")}</ol>`;
  $("#prep-dangers").innerHTML = `<p class="prep-intro">${esc(DANGERS.intro)}</p>${DANGERS.items.map(d => `<div class="danger"><strong>${esc(d.title)}</strong><p>${esc(d.text)}</p>${srcTags(d.src)}</div>`).join("")}<div class="stop"><strong>Stop at once if…</strong><p>${esc(DANGERS.stop)}</p></div>`;
  $("#prep-entering").innerHTML = `<p class="prep-intro">${esc(ENTERING.intro)}</p>${ENTERING.methods.map(m => `<div class="method"><strong>${esc(m.title)}</strong>${paras(m.text)}${srcTags(m.src)}</div>`).join("")}`;
  const P = PROTECTION;
  $("#prep-protection").innerHTML = `<p class="prep-intro">${esc(P.intro)}</p>
    <div class="method"><strong>${esc(P.cross.title)}</strong><p>${esc(P.cross.text)}</p>${crossSVG()}${srcTags(P.cross.src)}</div>
    <div class="method"><strong>${esc(P.pentagram.title)}</strong><p>${esc(P.pentagram.text)}</p>
      <div class="sym-row">${pentagramSVG(P.pentagram.banishing, "#5fd38a", "Banishing Pentagram of Earth: trace in this order")}${pentagramSVG(P.pentagram.invoking, "#f2d14b", "Invoking Pentagram of Earth (advanced)")}</div>
      <p class="note">${esc(P.pentagram.note)}</p>${srcTags(P.pentagram.src)}</div>
    <div class="method"><strong>${esc(P.lamp.title)}</strong><p>${esc(P.lamp.text)}</p>${srcTags(P.lamp.src)}</div>
    <div class="method"><strong>${esc(P.hexagram.title)}</strong><p>${esc(P.hexagram.text)}</p>${hexagramSVG()}${srcTags(P.hexagram.src)}</div>
    <div class="method"><strong>${esc(P.seal.title)}</strong><p>${esc(P.seal.text)}</p>${srcTags(P.seal.src)}</div>
    <div class="method"><strong>${esc(P.lbrp.title)}</strong><p>${esc(P.lbrp.text)}</p>
      <div class="quarters">${P.lbrp.quarters.map(q => `<div class="quarter" style="--qc:${q.color}"><span class="q-dir">${q.dir}</span><span class="q-name">${esc(q.name)}</span><span class="q-arch">${esc(q.archangel)}</span></div>`).join("")}</div>${srcTags(P.lbrp.src)}</div>`;
  const V = INTEGRATION.virtues;
  $("#prep-integration").innerHTML = `<p class="prep-intro">${esc(INTEGRATION.intro)}</p><ul class="rules">${INTEGRATION.rules.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
    <table class="vtable"><thead><tr><th>Sephirah</th><th>Virtue</th><th>Vice</th><th>Shows in life as</th></tr></thead><tbody>
    ${SEPHIROTH.filter(s => !s.hidden).slice().reverse().map(s => `<tr><td><span class="dot" style="background:${s.quartered ? "#c7b94a" : s.color}"></span>${esc(s.name)}</td><td>${esc(V[s.key].virtue)}</td><td>${esc(V[s.key].vice)}</td><td>${esc(V[s.key].life)}</td></tr>`).join("")}
    </tbody></table>${srcTags(["fortune", "knight"])}`;
  $("#prep-sources").innerHTML = `<p class="prep-intro">The method in this guide is a digest of the standard literature. These are the books it draws on, and what each one contributes. Read them; this app is a visual aid, not a teacher.</p><ul class="sources">${SOURCES.map(s => `<li><strong>${esc(s.cite)}</strong><div class="sub">${esc(s.why)}</div></li>`).join("")}</ul>`;
  $$(".prep-sec").forEach(d => {
    d.open = store.get("prep." + d.dataset.sec, false);
    d.addEventListener("toggle", () => store.set("prep." + d.dataset.sec, d.open));
  });
}
renderPrep();

/* ───────────── GUIDE tab: the pathworking ───────────── */
const guideSel = $("#guide-path");
for (const n of SERPENT_ORDER) {
  const p = PATH_BY_N[n];
  const o = document.createElement("option");
  o.value = n; o.textContent = `${n} · ${p.letter} ${p.name} — ${SEPH_BY_KEY[p.to].name} to ${SEPH_BY_KEY[p.from].name}`;
  guideSel.appendChild(o);
}
guideSel.value = store.get("guidePath", 32);
$("#guide-auto").checked = store.get("guideAuto", false);
$("#guide-breath").checked = store.get("guideBreath", false);
$("#breath").hidden = !$("#guide-breath").checked;
$("#g-notes").value = store.get("notes." + guideSel.value, "");

function templeText(s) {
  const t = TEMPLES[s.key];
  return `<p>Build the Temple of ${esc(s.name)} around you: ${esc(t.shape)}; walls ${esc(t.walls)}. In the centre, ${esc(t.altar)}. The light is ${esc(t.light)}. Notice ${esc(t.sense)}.</p>`;
}
function buildGuide(n) {
  const p = PATH_BY_N[n];
  const lower = SEPH_BY_KEY[p.to], upper = SEPH_BY_KEY[p.from];
  const col = p.color;
  const V = s => `<span class="vibrate">${esc(s)}</span>`;
  const sc = PATH_SCRIPTS[n];
  const tl = TEMPLES[lower.key], tu = TEMPLES[upper.key];
  const vu = INTEGRATION.virtues[upper.key];
  return [
    { title: "Ground and centre", where: "Malkuth", secs: 60, lit: ["malkuth"], paths: [], focus: "malkuth", protect: "ground",
      html: `<p>Sit upright. Breathe slowly: in for four, hold four, out four, hold four. Feel the weight of the body and the floor beneath you — Malkuth, the Kingdom.</p><p>State the intention aloud: <em>“I travel the ${ord(n)} path, ${esc(p.name)}, from ${esc(lower.name)} to ${esc(upper.name)}, and I return by the same road.”</em></p>` },
    { title: "The Kabbalistic Cross", where: "Opening · protection", secs: 60, lit: ["kether", "tiphareth", "malkuth"], paths: [], focus: "tiphareth", protect: "cross",
      html: `<p>Standing or seated, see white light above the head. Touch the brow: ${V("Ateh")}. Draw the light down to the breast: ${V("Malkuth")}. Right shoulder: ${V("ve-Geburah")}. Left shoulder: ${V("ve-Gedulah")}. Hands clasped at the heart: ${V("le-Olam, Amen")}.</p><p>See the cross of light standing in the body. This is the sign you will close with; nothing opened between now and then stays open.</p>` },
    { title: `Enter the Temple of ${lower.name}`, where: `${lower.name} · ${lower.meaning}`, secs: 90, lit: [lower.key], paths: [], focus: lower.key,
      html: `${templeText(lower)}<p>Vibrate the Divine Name ${V(lower.godName)} ${lower.godHebrew ? `<span class="heb">${esc(lower.godHebrew)}</span>` : ""} three times. Greet the Archangel: ${esc(tl.presence)}. Say: <em>“${esc(lower.archangel)}, I ask safe passage on the ${ord(n)} path.”</em></p>` },
    { title: `The door and the letter ${p.name}`, where: `Path ${n} · ${p.letter} ${p.name}`, secs: 60, lit: [lower.key], paths: [n], focus: lower.key,
      html: `<p>On the wall that faces ${esc(upper.name)} a door appears. Upon it kindles the letter <span class="heb" style="color:${col};font-size:1.6em">${esc(p.letter)}</span> ${esc(p.name)} — <em>${esc(p.lmeaning)}</em> — in <span class="swatch" style="background:${col}"></span>${esc(p.colorName)}. Above the door hangs the image of ${esc(p.tarot)}.</p><p>This is the ${esc(p.intelligence)}; its nature is ${esc(p.glyph)} ${esc(p.attr)}. Look at the letter until it holds steady in its colour.</p>` },
    { title: "Trace the pentagram on the door", where: "Protection · Banishing Pentagram of Earth", secs: 45, lit: [lower.key], paths: [n], focus: lower.key, protect: "pentagram",
      html: `<p>With the right hand, trace the Banishing Pentagram of Earth over the door, large, in the colour of the letter: lower left → top → lower right → upper left → upper right → lower left. As you trace, vibrate ${V(lower.godName)}.</p><div class="sym-row">${pentagramSVG(PROTECTION.pentagram.banishing, col, "Trace in this order")}</div><p>The pentagram flames and sinks into the door. If the letter dims or changes colour, close the working: do not open this door today. If it burns brighter, vibrate the letter's name, ${V(p.name)}, and the door opens.</p>` },
    { title: "Walk the path", where: `${lower.name} → ${upper.name}`, secs: 240, lit: [lower.key, upper.key], paths: [n], focus: null, protect: "lamp",
      html: `<p>Step through, carrying the letter ${esc(p.name)} before you as a lamp. The door stays open behind you, the letter still burning on it.</p><p><strong>The landscape.</strong> ${esc(sc.land)}</p><p><strong>What you may meet.</strong> ${esc(sc.meet)} Test everything: hold up the letter and say, <em>“In the name of ${esc(lower.godName)}, show me your true form.”</em> What does not stand steady in the light of the Sign is dismissed with the pentagram.</p><p>Move steadily upward. Accept nothing you did not ask for.</p>` },
    { title: `Enter the Temple of ${upper.name}`, where: `${upper.name} · ${upper.meaning}`, secs: 150, lit: [upper.key], paths: [n], focus: upper.key,
      html: `<p>The path opens into ${esc(upper.name)}, the ${esc(upper.meaning)}, sphere of ${esc(upper.planet)}.</p>${templeText(upper)}<p>Vibrate ${V(upper.godName)} ${upper.godHebrew ? `<span class="heb">${esc(upper.godHebrew)}</span>` : ""}. Greet the Archangel: ${esc(tu.presence)}. Rest here. <strong>The gift of this path:</strong> ${esc(sc.gift)} Receive only what is freely given and shown true by the Sign.</p>` },
    { title: "Return by the same path", where: `${upper.name} → ${lower.name}`, secs: 120, lit: [lower.key, upper.key], paths: [n], focus: lower.key,
      html: `<p>Give thanks to ${esc(upper.archangel)}. Turn, find the open door with the letter ${esc(p.name)} burning on it, and walk the path back down to ${esc(lower.name)}, gathering nothing, leaving nothing behind. Do not take a shortcut, and do not climb on.</p>` },
    { title: "Seal the door", where: `${lower.name} · protection`, secs: 45, lit: [lower.key], paths: [n], focus: lower.key, protect: "seal",
      html: `<p>Back in the Temple of ${esc(lower.name)}, face the door you came through. Trace the Banishing Pentagram of Earth over it once more and vibrate ${V(lower.godName)}. The letter sinks into the wood; the door closes; the wall is whole.</p><p>Thank ${esc(lower.archangel)}. Let the temple fade from the walls inward until only the lamp-flame remains, then let the flame become the breath in your own chest.</p>` },
    { title: "Banish and close", where: "Kabbalistic Cross · LBRP", secs: 90, lit: ["kether", "tiphareth", "malkuth"], paths: [], focus: "tiphareth", protect: "lbrp",
      html: `<p>Perform the Kabbalistic Cross again: ${V("Ateh")} · ${V("Malkuth")} · ${V("ve-Geburah")} · ${V("ve-Gedulah")} · ${V("le-Olam, Amen")}.</p><p>Until you are experienced, or whenever anything felt wrong, add the full Lesser Banishing Ritual: pentagrams to the four quarters with ${V("YHVH")}, ${V("Adonai")}, ${V("Eheieh")}, ${V("AGLA")}; then <em>“Before me Raphael, behind me Gabriel, on my right hand Michael, on my left hand Auriel. About me flames the pentagram, and within me shines the six-rayed star.”</em></p>` },
    { title: "Ground and record", where: "Malkuth", secs: 60, lit: ["malkuth"], paths: [], focus: "malkuth", protect: "ground",
      html: `<p>Return attention to the body. Press your feet to the floor, stamp once, say your own name aloud. Eat and drink something.</p><p>Write it down now, before it fades: use <strong>Log this session</strong> below to open a journal entry pre-filled with this path, the Names vibrated and the protections used. In the days that follow, add what happens in ordinary life. <strong>Watch for:</strong> ${esc(sc.life)} The virtue of ${esc(upper.name)} is <em>${esc(vu.virtue)}</em>; its vice is <em>${esc(vu.vice)}</em>.</p>` },
  ];
}

let guide = { n: +guideSel.value, steps: buildGuide(+guideSel.value), i: 0, running: false, elapsed: 0, last: 0, total: 0, started: null };
function guideLoad(n) {
  guide = { n, steps: buildGuide(n), i: 0, running: false, elapsed: 0, last: 0, total: 0, started: null };
  $("#g-notes").value = store.get("notes." + n, "");
  const ol = $("#g-steps"); ol.innerHTML = "";
  guide.steps.forEach((st, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="num">${i + 1}</span><span class="lbl">${esc(st.title)}${st.protect ? ' <span class="shield" title="protection">⛨</span>' : ""}<div class="sub">${fmt(st.secs)}</div></span>`;
    li.addEventListener("click", () => { guide.i = i; guide.elapsed = 0; guideRender(); });
    ol.appendChild(li);
  });
  guideRender();
  renderReadiness();
}
function guideRender() {
  const st = guide.steps[guide.i];
  const p = PATH_BY_N[guide.n];
  $$("#g-steps li").forEach((li, i) => { li.classList.toggle("active", i === guide.i); li.classList.toggle("done", i < guide.i); });
  $("#g-step").innerHTML = `<div class="step-title">${guide.i + 1}. ${esc(st.title)}</div><div class="step-where">${esc(st.where)}</div>${st.html}<div class="timer"><span>${fmt(guide.elapsed)} / ${fmt(st.secs)}</span><span>${guide.running ? "running" : "paused"} · session ${fmt(guide.total)}</span></div>`;
  $("#g-bar").style.width = `${Math.min(100, (guide.elapsed / st.secs) * 100)}%`;
  $('[data-act="g-play"]').textContent = guide.running ? "❚❚ Pause" : guide.elapsed > 0 || guide.i > 0 ? "▶ Resume" : "▶ Start";
  if (mode === "guide") {
    scene.setLit(st.lit, st.paths);
    if (st.focus) scene.focusSephirah(st.focus); else scene.resetView();
    setHud(`Path ${guide.n} · ${esc(p.name)} <span class="heb">${esc(p.letter)}</span>`, `${esc(st.title)} · ${esc(st.where)}`);
  }
}
function guideStep(d) {
  guide.i = Math.max(0, Math.min(guide.steps.length - 1, guide.i + d));
  guide.elapsed = 0; guideRender();
}
function guideToggle() {
  guide.running = !guide.running;
  if (guide.running) { guide.last = performance.now(); if (!guide.started) guide.started = new Date().toISOString(); guideTick(); }
  guideRender();
}
function guideTick() {
  if (!guide.running) return;
  const now = performance.now(); const dt = (now - guide.last) / 1000; guide.elapsed += dt; guide.total += dt; guide.last = now;
  const st = guide.steps[guide.i];
  if (guide.elapsed >= st.secs && $("#guide-auto").checked) {
    if (guide.i < guide.steps.length - 1) { guide.i++; guide.elapsed = 0; }
    else { guide.running = false; }
  }
  // cheap re-render of the timer only
  const t = $$("#g-step .timer span"); if (t[0]) { t[0].textContent = `${fmt(guide.elapsed)} / ${fmt(st.secs)}`; t[1].textContent = `running · session ${fmt(guide.total)}`; }
  $("#g-bar").style.width = `${Math.min(100, (guide.elapsed / guide.steps[guide.i].secs) * 100)}%`;
  if (st !== guide.steps[guide.i] || !guide.running) guideRender();
  if (guide.running) setTimeout(guideTick, 250);
}
guideSel.addEventListener("change", () => { store.set("guidePath", +guideSel.value); guideLoad(+guideSel.value); });
$("#guide-auto").addEventListener("change", e => store.set("guideAuto", e.target.checked));
$("#guide-breath").addEventListener("change", e => { store.set("guideBreath", e.target.checked); $("#breath").hidden = !e.target.checked; });
$("#g-notes").addEventListener("input", e => store.set("notes." + guide.n, e.target.value));
// breath pacer label (box breathing, 4 s each)
setInterval(() => {
  if ($("#breath").hidden) return;
  const ph = Math.floor((performance.now() / 4000) % 4);
  $("#breath-label").textContent = ["Inhale", "Hold", "Exhale", "Hold"][ph];
}, 250);

/* Readiness: what the journal says about this path and the one below it. */
function renderReadiness() {
  const n = guide.n, p = PATH_BY_N[n];
  const box = $("#guide-readiness");
  const entries = journalAll();
  const mine = entries.filter(e => +e.path === n);
  const lower = SEPH_BY_KEY[p.to];
  const feeding = PATHS.filter(q => q.from === lower.key).map(q => q.n); // paths that arrive in the lower Sephirah
  const prereqDone = lower.key === "malkuth" || feeding.some(q => entries.some(e => +e.path === q));
  const last = mine.map(e => e.date).sort().pop();
  const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / 864e5) : null;
  const lastPath = entries.map(e => ({ d: e.date, n: +e.path })).sort((a, b) => a.d < b.d ? 1 : -1)[0];
  const sinceAny = lastPath ? Math.floor((Date.now() - new Date(lastPath.d).getTime()) / 864e5) : null;
  const items = [];
  items.push(mine.length ? `<span class="ok">✓</span> Worked ${mine.length}× · last ${days === 0 ? "today" : days + " days ago"}` : `<span class="dim">○</span> Not yet worked`);
  if (!prereqDone) items.push(`<span class="warn">!</span> No journal entry yet for a path arriving in ${esc(lower.name)} (paths ${feeding.join(", ")}). The order of operations asks for the lower Sephirah first.`);
  if (lastPath && lastPath.n !== n && sinceAny != null && sinceAny < 7) items.push(`<span class="warn">!</span> Last working (path ${lastPath.n}) was ${sinceAny === 0 ? "today" : sinceAny + " days ago"}. Integration asks for at least seven days before a new path.`);
  const ready = mine.filter(e => e.ready).length;
  if (mine.length) items.push(ready ? `<span class="ok">✓</span> Marked “ready to proceed” in ${ready} entr${ready === 1 ? "y" : "ies"}` : `<span class="dim">○</span> Not yet marked ready to proceed in the journal`);
  box.innerHTML = items.map(i => `<div>${i}</div>`).join("");
}

/* ───────────── JOURNAL tab ───────────── */
const JKEY = "journal";
function journalAll() { return store.get(JKEY, []); }
function journalSave(list) { store.set(JKEY, list); }
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nowLocal = () => { const d = new Date(); d.setSeconds(0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };
const fmtDate = iso => { try { return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); } catch { return iso; } };
const fmtDay = iso => { try { return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }); } catch { return iso; } };

function blankEntry(n = guide.n) {
  const p = PATH_BY_N[n], lower = SEPH_BY_KEY[p.to], upper = SEPH_BY_KEY[p.from];
  return {
    id: uid(), date: nowLocal(), path: n, duration: 0,
    location: "", materials: [], materialsOther: "", tools: "", state: "", conditions: "",
    protection: [], words: `${lower.godName} ×3 · ${p.name} · ${upper.godName} · Ateh, Malkuth, ve-Geburah, ve-Gedulah, le-Olam Amen`,
    intention: `I travel the ${ord(n)} path, ${p.name}, from ${lower.name} to ${upper.name}, and I return by the same road.`,
    visual: `Temple of ${lower.name}; door with ${p.letter} ${p.name} in ${p.colorName}; ${p.tarot}; Temple of ${upper.name}.`,
    met: "", experience: "", gift: "", moodBefore: 3, moodAfter: 3, body: "", grounded: false, difficulty: 3,
    effects: [], results: {}, ready: false, vice: "", virtue: "",
  };
}
function entryFromGuide() {
  const e = blankEntry(guide.n);
  e.date = guide.started ? guide.started.slice(0, 16) : nowLocal();
  e.duration = Math.round(guide.total / 60);
  e.protection = [...new Set(guide.steps.filter(s => s.protect && guide.steps.indexOf(s) <= guide.i).map(s => s.protect))];
  if (guide.steps.some(s => s.protect === "cross")) e.protection.push("cross");
  e.protection = [...new Set(e.protection)];
  e.experience = store.get("notes." + guide.n, "");
  // the guide itself spoke the Names and used the sign: tick those as used
  const p = PATH_BY_N[guide.n];
  e.materials = sessionNeeds(p, SEPH_BY_KEY[p.to], SEPH_BY_KEY[p.from], MAJOR_BY_PATH[p.n]).filter(n => n.group === "Words").map(n => n.text);
  return e;
}

/* Result categories: the defaults plus whatever the user adds. */
function effectKinds() { return [...new Set([...DEFAULT_EFFECT_KINDS, ...store.get("effectKinds", [])])]; }
function addEffectKind(name) {
  name = (name || "").trim(); if (!name) return;
  const custom = store.get("effectKinds", []);
  if (!effectKinds().some(k => k.toLowerCase() === name.toLowerCase())) { custom.push(name); store.set("effectKinds", custom); }
}
function dropEffectKind(name) { store.set("effectKinds", store.get("effectKinds", []).filter(k => k !== name)); }
const STATES = [["better", "better"], ["same", "same"], ["worse", "worse"]];

/* What this session should have had ready, grouped, as a checklist. Checked items are stored by text in e.materials. */
function needsHTML(e) {
  const p = PATH_BY_N[e.path], lower = SEPH_BY_KEY[p.to], upper = SEPH_BY_KEY[p.from];
  const needs = sessionNeeds(p, lower, upper, MAJOR_BY_PATH[p.n]);
  const groups = [...new Set(needs.map(n => n.group))];
  const done = needs.filter(n => e.materials.includes(n.text)).length;
  return `<div class="needs-head"><span>For the ${ord(p.n)} path, ${esc(p.name)} (${esc(lower.name)} → ${esc(upper.name)})</span><span class="needs-count">${done}/${needs.length} used</span><button class="btn btn-sm" type="button" id="needs-all">Mark all used</button></div>
    ${groups.map(g => `<div class="needs-group"><div class="needs-g">${esc(g)}</div>${needs.filter(n => n.group === g).map(n => `<label class="toggle"><input type="checkbox" name="materials" value="${esc(n.text)}" ${e.materials.includes(n.text) ? "checked" : ""}> ${esc(n.text)}</label>`).join("")}</div>`).join("")}
    <div class="needs-group"><div class="needs-g">General</div>${JOURNAL_MATERIALS.map(m => `<label class="toggle"><input type="checkbox" name="materials" value="${esc(m)}" ${e.materials.includes(m) ? "checked" : ""}> ${esc(m)}</label>`).join("")}</div>`;
}
function kindOptions(sel) {
  return effectKinds().map(k => `<option ${k === sel ? "selected" : ""}>${esc(k)}</option>`).join("") + `<option value="__add">+ Add a category…</option><option value="__manage">Manage categories…</option>`;
}
function resultsHTML(e) {
  const r = e.results || {};
  return effectKinds().map(k => { const v = r[k] || {}; return `<div class="result-row" data-kind="${esc(k)}"><span class="r-kind">${esc(k)}</span><span class="r-states">${STATES.map(([s, l]) => `<button type="button" class="r-state ${v.state === s ? "on " + s : ""}" data-s="${s}">${l}</button>`).join("")}</span><input class="r-note" placeholder="what happened" value="${esc(v.note || "")}"><span class="r-count">${(e.effects || []).filter(f => f.kind === k).length || ""}</span></div>`; }).join("");
}

let jEditing = null;
const jFilter = $("#j-filter"), jSort = $("#j-sort");
for (const n of SERPENT_ORDER) { const o = document.createElement("option"); o.value = n; o.textContent = `${n} · ${PATH_BY_N[n].name}`; jFilter.appendChild(o); }
jFilter.value = store.get("jFilter", ""); jSort.value = store.get("jSort", "newest");
jFilter.addEventListener("change", () => { store.set("jFilter", jFilter.value); journalRender(); });
jSort.addEventListener("change", () => { store.set("jSort", jSort.value); journalRender(); });

const scale = (name, val, lo, hi) => `<div class="scale" data-name="${name}">${[1, 2, 3, 4, 5].map(v => `<button type="button" class="${+val === v ? "on" : ""}" data-v="${v}" aria-label="${v}">${v}</button>`).join("")}<span class="scale-lbl"><span>${lo}</span><span>${hi}</span></span></div>`;

function journalEdit(e) {
  jEditing = e;
  const ed = $("#j-editor"); ed.hidden = false;
  const p = PATH_BY_N[e.path];
  ed.innerHTML = `
    <div class="j-head"><strong>${e.saved ? "Edit entry" : "New entry"}</strong><button class="close" type="button" aria-label="Close">×</button></div>
    <div class="row2">
      <label class="field">Date &amp; time<input name="date" type="datetime-local" value="${esc(e.date)}"></label>
      <label class="field">Path<select name="path">${SERPENT_ORDER.map(n => `<option value="${n}" ${+e.path === n ? "selected" : ""}>${n} · ${PATH_BY_N[n].letter} ${PATH_BY_N[n].name}</option>`).join("")}</select></label>
    </div>
    <div class="row2">
      <label class="field">Duration (minutes)<input name="duration" type="number" min="0" step="1" value="${+e.duration || 0}"></label>
      <label class="field">Place<input name="location" placeholder="room, temple, outdoors…" value="${esc(e.location)}"></label>
    </div>

    <h3 class="jh">What this session needed <span class="sub">tick what was used</span></h3>
    <div class="checks needs" id="j-needs">${needsHTML(e)}</div>
    <label class="field">Other materials<input name="materialsOther" placeholder="e.g. sandalwood incense, violet candle" value="${esc(e.materialsOther)}"></label>
    <label class="field">Tools used<input name="tools" placeholder="wand, cup, tarot card, pointing hand…" value="${esc(e.tools)}"></label>
    <div class="row2">
      <label class="field">Physical &amp; mental state before<input name="state" placeholder="sleep, food, mood, sobriety" value="${esc(e.state)}"></label>
      <label class="field">Conditions<input name="conditions" placeholder="moon phase, planetary day, weather" value="${esc(e.conditions)}"></label>
    </div>

    <h3 class="jh">Protection</h3>
    <div class="checks">${PROTECTION_STEPS.map(s => `<label class="toggle"><input type="checkbox" name="protection" value="${s.key}" ${e.protection.includes(s.key) ? "checked" : ""}> ${esc(s.label)}</label>`).join("")}</div>

    <h3 class="jh">Spoken word</h3>
    <label class="field">Intention stated<textarea name="intention" rows="2">${esc(e.intention)}</textarea></label>
    <label class="field">Names and words vibrated<textarea name="words" rows="2">${esc(e.words)}</textarea></label>

    <h3 class="jh">Visualization</h3>
    <label class="field">Visualizations built<textarea name="visual" rows="2">${esc(e.visual)}</textarea></label>
    <label class="field">What was met, and how it answered the Sign<textarea name="met" rows="2" placeholder="figures, animals, voices; did they stand steady under the letter?">${esc(e.met)}</textarea></label>
    <label class="field">The journey<textarea name="experience" rows="4" placeholder="What did you see, hear, feel? In order, as it happened.">${esc(e.experience)}</textarea></label>
    <label class="field">What was given<input name="gift" placeholder="object, word, image, feeling" value="${esc(e.gift)}"></label>

    <h3 class="jh">Afterwards</h3>
    <div class="row2">
      <label class="field">Mood before${scale("moodBefore", e.moodBefore, "low", "high")}</label>
      <label class="field">Mood after${scale("moodAfter", e.moodAfter, "low", "high")}</label>
    </div>
    <label class="field">Difficulty / intensity${scale("difficulty", e.difficulty, "gentle", "overwhelming")}</label>
    <label class="field">Body afterwards<input name="body" placeholder="warm, cold, tired, shaky, light-headed, steady…" value="${esc(e.body)}"></label>
    <label class="toggle"><input type="checkbox" name="grounded" ${e.grounded ? "checked" : ""}> Grounded fully (food, drink, stamp, name) before leaving the room</label>

    <h3 class="jh">Effects in reality <span class="sub">add in the days that follow</span></h3>
    <div class="effects" id="j-effects">${e.effects.map((f, i) => `<div class="effect"><span class="ef-date">${fmtDay(f.date)}</span><span class="ef-kind">${esc(f.kind)}</span><span class="ef-text">${esc(f.text)}</span><button type="button" class="ef-del" data-i="${i}" aria-label="Remove">×</button></div>`).join("") || `<p class="note">Nothing recorded yet. Dreams, moods, coincidences, health, money, relationships, work: the path shows itself in the week after.</p>`}</div>
    <div class="ef-add">
      <input type="date" id="ef-date" value="${new Date().toISOString().slice(0, 10)}">
      <select id="ef-kind">${kindOptions(e._lastKind)}</select>
      <input id="ef-text" placeholder="What happened">
      <button class="btn" type="button" id="ef-plus">+</button>
    </div>

    <h3 class="jh">Results by category <span class="sub">how each area went in the days after</span></h3>
    <div class="results" id="j-results">${resultsHTML(e)}</div>

    <h3 class="jh">Integration · ${esc(SEPH_BY_KEY[p.from].name)}</h3>
    <p class="note">Virtue: <em>${esc(INTEGRATION.virtues[p.from].virtue)}</em> · Vice: <em>${esc(INTEGRATION.virtues[p.from].vice)}</em></p>
    <label class="field">Where the virtue showed in ordinary life<input name="virtue" value="${esc(e.virtue)}"></label>
    <label class="field">Where the vice showed, and what I did<input name="vice" value="${esc(e.vice)}"></label>
    <label class="toggle"><input type="checkbox" name="ready" ${e.ready ? "checked" : ""}> Ready to proceed: the temple of arrival builds instantly, daily life is more orderly, the vice has been faced</label>

    <div class="transport">
      <button class="btn btn-gold btn-wide" type="button" id="j-save">Save entry</button>
      ${e.saved ? '<button class="btn btn-danger" type="button" id="j-delete">Delete</button>' : ""}
    </div>`;
  $(".close", ed).addEventListener("click", () => { jEditing = null; ed.hidden = true; });
  $$(".scale button", ed).forEach(b => b.addEventListener("click", () => { const sc = b.closest(".scale"); $$("button", sc).forEach(x => x.classList.toggle("on", x === b)); }));
  $("select[name=path]", ed).addEventListener("change", ev => { const n = +ev.target.value; scene.setLit([PATH_BY_N[n].from, PATH_BY_N[n].to], [n]); journalCollect(e); $("#j-needs", ed).innerHTML = needsHTML(e); bindNeeds(); });
  const needsCount = () => { const all = $$("#j-needs .needs-group:not(:last-child) [name=materials]", ed); $(".needs-count", ed).textContent = `${all.filter(c => c.checked).length}/${all.length} used`; };
  const bindNeeds = () => {
    $("#needs-all", ed)?.addEventListener("click", () => { $$("#j-needs [name=materials]", ed).forEach(c => (c.checked = true)); needsCount(); });
    $$("#j-needs [name=materials]", ed).forEach(c => c.addEventListener("change", needsCount));
  };
  bindNeeds();
  $("#ef-kind", ed).addEventListener("change", ev => {
    const v = ev.target.value;
    if (v === "__add") { const name = prompt("New category for effects in reality (e.g. Creativity, Sleep, Family):"); addEffectKind(name); e._lastKind = name && name.trim(); journalCollect(e); journalEdit(e); }
    else if (v === "__manage") {
      const custom = store.get("effectKinds", []);
      if (!custom.length) { toast("Only the default categories exist; add one first"); ev.target.value = effectKinds()[0]; return; }
      const name = prompt(`Your added categories:\n${custom.join(", ")}\n\nType one to take it off the list, or leave blank to keep all:`);
      if (name && custom.includes(name.trim())) { dropEffectKind(name.trim()); toast(`Category “${name.trim()}” taken off the list`); }
      journalCollect(e); journalEdit(e);
    } else e._lastKind = v;
  });
  $$(".r-state", ed).forEach(b => b.addEventListener("click", () => { const row = b.closest(".result-row"); const on = b.classList.contains("on"); $$(".r-state", row).forEach(x => (x.className = "r-state")); if (!on) b.classList.add("on", b.dataset.s); }));
  $("#ef-plus", ed).addEventListener("click", () => {
    const text = $("#ef-text", ed).value.trim(); if (!text) return;
    const kind = $("#ef-kind", ed).value; if (kind.startsWith("__")) return;
    e.effects.push({ date: $("#ef-date", ed).value || new Date().toISOString().slice(0, 10), kind, text });
    journalCollect(e); journalEdit(e);
  });
  $$(".ef-del", ed).forEach(b => b.addEventListener("click", () => { e.effects.splice(+b.dataset.i, 1); journalCollect(e); journalEdit(e); }));
  $("#j-save", ed).addEventListener("click", () => {
    journalCollect(e); e.saved = true;
    const list = journalAll(); const i = list.findIndex(x => x.id === e.id);
    if (i >= 0) list[i] = e; else list.push(e);
    journalSave(list); jEditing = null; ed.hidden = true; journalRender(); renderReadiness(); toast("Entry saved on this device");
  });
  $("#j-delete", ed)?.addEventListener("click", () => {
    if (!confirm("Delete this journal entry? This cannot be undone.")) return;
    journalSave(journalAll().filter(x => x.id !== e.id)); jEditing = null; ed.hidden = true; journalRender(); renderReadiness();
  });
  scene.setLit([p.from, p.to], [+e.path]);
  ed.scrollIntoView({ block: "start", behavior: "smooth" });
}
function journalCollect(e) {
  const ed = $("#j-editor");
  for (const k of ["date", "location", "materialsOther", "tools", "state", "conditions", "intention", "words", "visual", "met", "experience", "gift", "body", "virtue", "vice"]) { const el = $(`[name=${k}]`, ed); if (el) e[k] = el.value; }
  e.path = +$("[name=path]", ed).value; e.duration = +$("[name=duration]", ed).value || 0;
  e.materials = $$("[name=materials]:checked", ed).map(x => x.value);
  e.results = {};
  $$(".result-row", ed).forEach(row => { const on = $(".r-state.on", row); const note = $(".r-note", row).value.trim(); if (on || note) e.results[row.dataset.kind] = { state: on ? on.dataset.s : "", note }; });
  e.protection = $$("[name=protection]:checked", ed).map(x => x.value);
  e.grounded = $("[name=grounded]", ed).checked; e.ready = $("[name=ready]", ed).checked;
  for (const k of ["moodBefore", "moodAfter", "difficulty"]) { const on = $(`.scale[data-name=${k}] button.on`, ed); e[k] = on ? +on.dataset.v : null; }
}
function journalRender() {
  let list = journalAll().slice();
  const f = jFilter.value; if (f) list = list.filter(e => +e.path === +f);
  const s = jSort.value;
  list.sort((a, b) => s === "oldest" ? (a.date < b.date ? -1 : 1) : s === "path" ? (b.path - a.path || (a.date < b.date ? 1 : -1)) : (a.date < b.date ? 1 : -1));
  const all = journalAll();
  const worked = new Set(all.map(e => +e.path));
  const lastAny = all.map(e => e.date).sort().pop();
  $("#j-summary").innerHTML = `
    <div class="j-stat"><b>${all.length}</b><span>entries</span></div>
    <div class="j-stat"><b>${worked.size}</b><span>of 22 paths</span></div>
    <div class="j-stat"><b>${lastAny ? Math.floor((Date.now() - new Date(lastAny).getTime()) / 864e5) : "—"}</b><span>days since last</span></div>
    <div class="j-paths">${SERPENT_ORDER.map(n => `<span class="jp ${worked.has(n) ? "on" : ""}" style="--pc:${PATH_BY_N[n].color}" title="Path ${n} ${PATH_BY_N[n].name}${worked.has(n) ? " · worked" : ""}">${n}</span>`).join("")}</div>`;
  const box = $("#j-list");
  if (!list.length) { box.innerHTML = `<p class="note center">No entries${f ? " for this path" : ""} yet. Finish a guided pathworking and press “Log this session”, or add one by hand.</p>`; return; }
  box.innerHTML = list.map(e => {
    const p = PATH_BY_N[e.path];
    const prot = PROTECTION_STEPS.filter(s => e.protection?.includes(s.key)).length;
    return `<article class="j-entry" data-id="${e.id}">
      <div class="j-row"><span class="dot" style="background:${p.color}"></span><strong>Path ${e.path} · ${esc(p.name)} <span class="heb">${esc(p.letter)}</span></strong><span class="j-date">${fmtDate(e.date)}</span></div>
      <div class="j-meta">${e.duration ? `${e.duration} min · ` : ""}protection ${prot}/${PROTECTION_STEPS.length}${e.grounded ? " · grounded" : ""}${e.moodBefore && e.moodAfter ? ` · mood ${e.moodBefore}→${e.moodAfter}` : ""}${e.effects?.length ? ` · ${e.effects.length} effect${e.effects.length === 1 ? "" : "s"}` : ""}${e.ready ? ' · <span class="ok">ready</span>' : ""}</div>
      ${e.experience ? `<p class="j-text">${esc(e.experience).slice(0, 220)}${e.experience.length > 220 ? "…" : ""}</p>` : ""}
      ${e.results && Object.keys(e.results).length ? `<div class="j-results">${Object.entries(e.results).filter(([, v]) => v.state).map(([k, v]) => `<span class="rs ${v.state}">${esc(k)} ${v.state === "better" ? "▲" : v.state === "worse" ? "▼" : "•"}</span>`).join("")}</div>` : ""}
      ${e.effects?.length ? `<div class="j-effects">${e.effects.slice(-3).map(f => `<span><b>${esc(f.kind)}</b> ${fmtDay(f.date)}: ${esc(f.text).slice(0, 90)}</span>`).join("")}</div>` : ""}
    </article>`;
  }).join("");
  $$(".j-entry", box).forEach(a => a.addEventListener("click", () => { const e = journalAll().find(x => x.id === a.dataset.id); if (e) journalEdit(structuredClone(e)); }));
}
$("#j-new").addEventListener("click", () => journalEdit(blankEntry()));
$("#g-log").addEventListener("click", () => { const e = entryFromGuide(); setMode("journal"); journalEdit(e); });

function download(name, text, type) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$("#j-export").addEventListener("click", () => download(`pathworking-journal-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: "pathworking", version: 1, exported: new Date().toISOString(), entries: journalAll() }, null, 2), "application/json"));
$("#j-export-md").addEventListener("click", () => {
  const md = ["# Pathworking journal"].concat(journalAll().sort((a, b) => a.date < b.date ? -1 : 1).map(e => {
    const p = PATH_BY_N[e.path];
    const L = [`## ${fmtDate(e.date)} — Path ${e.path} · ${p.letter} ${p.name} (${SEPH_BY_KEY[p.to].name} → ${SEPH_BY_KEY[p.from].name})`, ""];
    if (e.duration) L.push(`- Duration: ${e.duration} min`);
    if (e.location) L.push(`- Place: ${e.location}`);
    if (e.state) L.push(`- State before: ${e.state}`);
    if (e.conditions) L.push(`- Conditions: ${e.conditions}`);
    if (e.materials?.length || e.materialsOther) L.push(`- Materials: ${[...e.materials, e.materialsOther].filter(Boolean).join("; ")}`);
    if (e.tools) L.push(`- Tools: ${e.tools}`);
    L.push(`- Protection: ${PROTECTION_STEPS.filter(s => e.protection?.includes(s.key)).map(s => s.label).join("; ") || "none recorded"}`);
    if (e.intention) L.push(`- Intention: ${e.intention}`);
    if (e.words) L.push(`- Words vibrated: ${e.words}`);
    if (e.visual) L.push(`- Visualizations: ${e.visual}`);
    if (e.met) L.push(`- Met: ${e.met}`);
    if (e.gift) L.push(`- Given: ${e.gift}`);
    if (e.moodBefore) L.push(`- Mood: ${e.moodBefore} → ${e.moodAfter} · intensity ${e.difficulty}`);
    if (e.body) L.push(`- Body afterwards: ${e.body}`);
    L.push(`- Grounded: ${e.grounded ? "yes" : "no"} · Ready to proceed: ${e.ready ? "yes" : "no"}`);
    if (e.experience) L.push("", "### The journey", "", e.experience);
    if (e.effects?.length) L.push("", "### Effects in reality", "", ...e.effects.map(f => `- ${f.date} · ${f.kind}: ${f.text}`));
    if (e.results && Object.keys(e.results).length) L.push("", "### Results by category", "", ...Object.entries(e.results).map(([k, v]) => `- ${k}: ${v.state || "—"}${v.note ? ` — ${v.note}` : ""}`));
    if (e.virtue || e.vice) L.push("", "### Integration", "", e.virtue ? `- Virtue showed: ${e.virtue}` : "", e.vice ? `- Vice faced: ${e.vice}` : "");
    return L.filter(x => x !== undefined).join("\n");
  })).join("\n\n");
  download(`pathworking-journal-${new Date().toISOString().slice(0, 10)}.md`, md, "text/markdown");
});
$("#j-import").addEventListener("change", async ev => {
  const file = ev.target.files?.[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const incoming = Array.isArray(data) ? data : data.entries;
    if (!Array.isArray(incoming)) throw new Error("not a journal export");
    const list = journalAll(); const ids = new Set(list.map(e => e.id)); let added = 0;
    for (const e of incoming) { if (e && e.id && e.date && e.path && !ids.has(e.id)) { list.push(e); ids.add(e.id); added++; } }
    journalSave(list); journalRender(); renderReadiness(); toast(`Imported ${added} new entr${added === 1 ? "y" : "ies"}`);
  } catch { toast("That file is not a Pathworking journal export"); }
  ev.target.value = "";
});

guideLoad(+guideSel.value);
journalRender();

/* ───────────── HISTORY tab ───────────── */
{
  $("#app-version").textContent = `v${APP_VERSION}`;
  $("#hist-version").textContent = `v${APP_VERSION} · ${CHANGELOG[0].date}`;
  const hf = $("#hist-filter");
  const render = () => {
    const f = hf.value;
    $("#hist-list").innerHTML = CHANGELOG.map(r => {
      const items = r.items.filter(i => !f || i.type === f);
      if (!items.length) return "";
      const counts = Object.keys(TYPE_LABELS).map(t => [t, r.items.filter(i => i.type === t).length]).filter(([, n]) => n);
      return `<article class="hist-rel${r.version === APP_VERSION ? " current" : ""}">
        <div class="hist-head"><span class="hist-ver">v${esc(r.version)}</span><strong>${esc(r.title)}</strong><span class="hist-date">${esc(r.date)}</span></div>
        <div class="hist-counts">${counts.map(([t, n]) => `<span class="tag tag-${t}">${n} ${esc(TYPE_LABELS[t].toLowerCase())}</span>`).join("")}</div>
        <ul class="hist-items">${items.map(i => `<li><span class="tag tag-${i.type}">${esc(TYPE_LABELS[i.type])}</span><span>${esc(i.text)}</span></li>`).join("")}</ul>
      </article>`;
    }).join("") || `<p class="note center">Nothing of that kind yet.</p>`;
  };
  hf.addEventListener("change", render);
  render();
}

/* ───────────── share / install / offline ───────────── */
$("#share-btn").addEventListener("click", async () => {
  const url = location.href.split("#")[0];
  const data = { title: "Pathworking — Tree of Life", text: "A 3D Tree of Life for Kabbalistic pathworking: Lightning Flash, Serpent of Wisdom, and the 72 Names.", url };
  try {
    if (navigator.share) { await navigator.share(data); return; }
  } catch (err) { if (err?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(url); toast("Link copied — send it to anyone"); }
  catch { prompt("Copy this link:", url); }
});

let installPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; $("#install-btn").hidden = false; });
$("#install-btn").addEventListener("click", async () => {
  if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $("#install-btn").hidden = true; return; }
  toast("In Safari: Share → Add to Home Screen");
});
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
if (isIOS && !standalone) { $("#install-btn").hidden = false; }

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

/* ───────────── start ───────────── */
applyLayout();
setMode(store.get("mode", "tree"));
if (!isWide() && !store.get("seen", false)) {
  // first visit on a phone: start with the sheet lowered so the Tree is visible
  setCollapsed(true);
  store.set("seen", true);
}
gripHint();
updateViewport();
