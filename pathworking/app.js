/* Pathworking — UI controller */
import { TreeScene } from "./tree.js";
import {
  SEPHIROTH, SEPH_BY_KEY, PATHS, PATH_BY_N, DESCENTS, SERPENT_ORDER, buildShem, letterName, WORLDS,
} from "./data.js";

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
function updateViewport() {
  const W = innerWidth, H = innerHeight, wide = matchMedia("(min-width: 900px)").matches;
  const collapsed = panel.classList.contains("collapsed");
  stage.classList.toggle("panel-hidden", collapsed);
  const top = wide ? 70 : 118;
  let rect;
  if (wide) rect = { x: 0, y: top, w: collapsed ? W : W - 400 - 28, h: H - top - 10 };
  else rect = { x: 0, y: top, w: W, h: (collapsed ? H - 58 : H - panel.offsetHeight) - top - 6 };
  scene.setVisibleRect(rect);
}
function setCollapsed(c) {
  panel.classList.toggle("collapsed", c);
  $("#toggle-panel").setAttribute("aria-expanded", String(!c));
  updateViewport();
}
$("#toggle-panel").addEventListener("click", () => setCollapsed(!panel.classList.contains("collapsed")));
$(".panel-grip").addEventListener("click", () => setCollapsed(!panel.classList.contains("collapsed")));
addEventListener("resize", updateViewport);
new ResizeObserver(updateViewport).observe(panel);
$("#reset-view").addEventListener("click", () => scene.resetView());

$$(".tab").forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.tab)));
function setMode(m) {
  mode = m;
  $$(".tab").forEach(t => t.setAttribute("aria-selected", String(t.dataset.tab === m)));
  $$(".tabpanel").forEach(p => (p.hidden = p.dataset.tab !== m));
  if (panel.classList.contains("collapsed")) setCollapsed(false);
  scene.showFlash(m === "descent");
  scene.showSerpent(m === "ascent");
  scene.focusShem(null);
  if (m === "tree") { scene.clearLit(); setHud("Tree of Life", "Drag to rotate · pinch or scroll to zoom · tap a sphere, path or name"); }
  if (m === "descent") { scene.setFlashProgress(descent.position()); descentRender(); }
  if (m === "ascent") { scene.setSerpentProgress(ascent.position()); ascentRender(); }
  if (m === "names") {
    if (!scene.options.ring) { scene.setOptions({ ring: true }); $('[data-opt="ring"]').checked = true; }
    scene.clearLit(); setHud("Shem HaMephorash", "The 72 Names · tap a name in the ring or the list");
  }
  if (m === "guide") guideRender();
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

/* ───────────── GUIDE tab ───────────── */
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

function buildGuide(n) {
  const p = PATH_BY_N[n];
  const lower = SEPH_BY_KEY[p.to], upper = SEPH_BY_KEY[p.from];
  const col = p.color;
  const V = s => `<span class="vibrate">${esc(s)}</span>`;
  return [
    { title: "Ground and centre", where: "Malkuth", secs: 60, lit: ["malkuth"], paths: [], focus: "malkuth",
      html: `<p>Sit upright. Breathe slowly: in for four, hold four, out four, hold four. Feel the weight of the body and the floor beneath you — Malkuth, the Kingdom.</p><p>State the intention: <em>“I travel the ${ord(n)} path, ${esc(p.name)}, from ${esc(lower.name)} to ${esc(upper.name)}.”</em></p>` },
    { title: `Enter the Temple of ${lower.name}`, where: `${lower.name} · ${lower.meaning}`, secs: 90, lit: [lower.key], paths: [], focus: lower.key,
      html: `<p>Build the temple of ${esc(lower.name)} around you: walls and light of <span class="swatch" style="background:${lower.color}"></span>${esc(lower.colorName)}. Its symbols belong to ${esc(lower.planet)}.</p><p>Vibrate the Divine Name ${V(lower.godName)} ${lower.godHebrew ? `<span class="heb">${esc(lower.godHebrew)}</span>` : ""} three times. Greet the Archangel ${V(lower.archangel)} and ask for safe passage.</p>` },
    { title: `The door of ${p.name}`, where: `Path ${n} · ${p.letter} ${p.name}`, secs: 60, lit: [lower.key], paths: [n], focus: lower.key,
      html: `<p>On the wall that faces ${esc(upper.name)} a door appears. Upon it burns the letter <span class="heb" style="color:${col};font-size:1.6em">${esc(p.letter)}</span> ${esc(p.name)} — <em>${esc(p.lmeaning)}</em> — in <span class="swatch" style="background:${col}"></span>${esc(p.colorName)}. Above the door hangs the image of ${esc(p.tarot)}.</p><p>This is the ${esc(p.intelligence)}; its nature is ${esc(p.glyph)} ${esc(p.attr)}. Vibrate the letter's name, ${V(p.name)}, and the door opens.</p>` },
    { title: "Walk the path", where: `${lower.name} → ${upper.name}`, secs: 180, lit: [lower.key, upper.key], paths: [n], focus: null,
      html: `<p>Step through. The landscape of the path forms itself in ${esc(p.colorName)}. Keep the letter ${esc(p.name)} shining before you as a lamp; whatever you meet, show it the letter and ask its name. What does not belong to the path will not abide the sign.</p><p>Move steadily upward. Notice what appears, what is said, what is offered. Accept nothing you did not ask for.</p>` },
    { title: `Enter the Temple of ${upper.name}`, where: `${upper.name} · ${upper.meaning}`, secs: 120, lit: [upper.key], paths: [n], focus: upper.key,
      html: `<p>The path opens into ${esc(upper.name)}, the ${esc(upper.meaning)}: light of <span class="swatch" style="background:${upper.color}"></span>${esc(upper.colorName)}, the sphere of ${esc(upper.planet)}.</p><p>Vibrate ${V(upper.godName)} ${upper.godHebrew ? `<span class="heb">${esc(upper.godHebrew)}</span>` : ""}. Greet the Archangel ${V(upper.archangel)}. Rest here. Receive what is given.</p>` },
    { title: "Return by the same path", where: `${upper.name} → ${lower.name}`, secs: 90, lit: [lower.key, upper.key], paths: [n], focus: lower.key,
      html: `<p>Give thanks to ${esc(upper.archangel)}. Turn, find the door of ${esc(p.name)}, and walk the path back down to ${esc(lower.name)}, gathering nothing, leaving nothing behind.</p><p>In ${esc(lower.name)} thank ${esc(lower.archangel)}; let the temple fade.</p>` },
    { title: "Close and record", where: "Malkuth", secs: 45, lit: ["malkuth"], paths: [], focus: "malkuth",
      html: `<p>Return attention to the body. Press your feet to the floor, stamp once, say your own name. Eat or drink something.</p><p>Write what you saw before it fades — the journal below stays on this device.</p>` },
  ];
}

let guide = { n: +guideSel.value, steps: buildGuide(+guideSel.value), i: 0, running: false, elapsed: 0, last: 0 };
function guideLoad(n) {
  guide = { n, steps: buildGuide(n), i: 0, running: false, elapsed: 0, last: 0 };
  $("#g-notes").value = store.get("notes." + n, "");
  const ol = $("#g-steps"); ol.innerHTML = "";
  guide.steps.forEach((st, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="num">${i + 1}</span><span class="lbl">${esc(st.title)}<div class="sub">${fmt(st.secs)}</div></span>`;
    li.addEventListener("click", () => { guide.i = i; guide.elapsed = 0; guideRender(); });
    ol.appendChild(li);
  });
  guideRender();
}
function guideRender() {
  const st = guide.steps[guide.i];
  const p = PATH_BY_N[guide.n];
  $$("#g-steps li").forEach((li, i) => { li.classList.toggle("active", i === guide.i); li.classList.toggle("done", i < guide.i); });
  $("#g-step").innerHTML = `<div class="step-title">${guide.i + 1}. ${esc(st.title)}</div><div class="step-where">${esc(st.where)}</div>${st.html}<div class="timer"><span>${fmt(guide.elapsed)} / ${fmt(st.secs)}</span><span>${guide.running ? "running" : "paused"}</span></div>`;
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
  if (guide.running) { guide.last = performance.now(); guideTick(); }
  guideRender();
}
function guideTick() {
  if (!guide.running) return;
  const now = performance.now(); guide.elapsed += (now - guide.last) / 1000; guide.last = now;
  const st = guide.steps[guide.i];
  if (guide.elapsed >= st.secs && $("#guide-auto").checked) {
    if (guide.i < guide.steps.length - 1) { guide.i++; guide.elapsed = 0; }
    else { guide.running = false; }
  }
  // cheap re-render of the timer only
  const t = $("#g-step .timer span"); if (t) t.textContent = `${fmt(guide.elapsed)} / ${fmt(st.secs)}`;
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
guideLoad(+guideSel.value);

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
setMode(store.get("mode", "tree"));
if (matchMedia("(max-width: 899px)").matches && !store.get("seen", false)) {
  // first visit on a phone: start with the sheet lowered so the Tree is visible
  setCollapsed(true);
  store.set("seen", true);
}
updateViewport();
