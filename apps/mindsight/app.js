/* Mindsight — insight, empathy, integration. All data stays on-device (localStorage). */
(() => {
"use strict";

const KEY = "mindsight:v1";
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

let mem = { entries: [], practice: [], river: [] };
const load = () => { try { return { ...mem, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return mem; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage blocked: stay in-memory */ } };
const db = load();

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- content ---------- */
const FEELINGS = ["calm", "content", "curious", "grateful", "tender", "tired", "anxious", "irritated", "sad", "overwhelmed", "lonely", "numb"];
const PROMPTS = [
  "What is one sensation in my body right now?",
  "What story is my mind telling me, and is it the only one?",
  "Whose perspective have I not yet considered today?",
  "Where do I feel pulled toward chaos or rigidity?",
  "What would it be like to be a kind witness to this feeling?",
  "Which part of me needs attention right now?"
];
const WHEEL_STEPS = [
  { id: "hub", arc: null, title: "Settle into the hub", text: "Feel your breath. Rest in the calm, open center of awareness, the place from which you can notice everything." },
  { id: "senses", arc: 0, title: "Rim · The five senses", text: "Send a spoke of attention to sound, sight, smell, taste, and touch, one at a time. Notice, then return to the hub." },
  { id: "body", arc: 1, title: "Rim · The body inside", text: "Move attention through muscles, belly, heart, lungs. Sense the interior of the body without trying to change it." },
  { id: "mind", arc: 2, title: "Rim · The mind's activity", text: "Notice thoughts, feelings, memories, and hopes arising and passing, like weather. You are the sky, not the weather." },
  { id: "connect", arc: 3, title: "Rim · Connection", text: "Sense your connection to people you love, to your community, to nature. Notice the felt sense of being part of something larger." },
  { id: "return", arc: null, title: "Return to the hub", text: "Rest in the hub once more. Let your attention gather, and carry this spaciousness with you." }
];
const DOMAINS = [
  ["Consciousness", "Awareness of awareness: the hub and the rim in balance."],
  ["Bilateral", "Logic and emotion, left and right, working together."],
  ["Vertical", "Body, brainstem and heart informing the thinking mind."],
  ["Memory", "Implicit and explicit memory linked, past not hijacking the present."],
  ["Narrative", "Making coherent sense of your story."],
  ["State", "Different states of self honored and woven together."],
  ["Interpersonal", "Honoring differences while linking with others."],
  ["Temporal", "Accepting uncertainty, impermanence, and mortality."],
  ["Identity", "A sense of self that is both individual and part of a greater whole."]
];
const RIVER_HINTS = {
  chaos: "Try the Wheel practice, with a long stay in the hub, to build stability.",
  rigid: "Try a Check-in; naming sensations and feelings can soften rigidity and let in more flexibility.",
  flow: "Notice what supports this flow, and keep what's working."
};

/* ---------- state ---------- */
let view = "home";
let wheelTimer = null;

/* ---------- views ---------- */
const views = {
  home() {
    const days = new Set([...db.entries.map(e => e.day), ...db.practice.map(p => p.day)]);
    let streak = 0; const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
    const mins = Math.round(db.practice.reduce((a, p) => a + p.seconds, 0) / 60);
    const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];
    const recent = [...db.entries].reverse().slice(0, 5);
    return `
      <section class="card"><h2 style="margin-top:0">Today's reflection</h2><p>${esc(prompt)}</p>
        <div class="row"><button class="btn" data-go="checkin">Check in</button><button class="btn ghost" data-go="wheel">Open the Wheel</button></div></section>
      <section class="card grid2"><div class="stat"><b>${streak}</b><span class="muted">day streak</span></div>
        <div class="stat"><b>${mins}</b><span class="muted">minutes of practice</span></div></section>
      <section class="card"><h3>Recent</h3>${recent.length ? recent.map(entryHtml).join("") : '<p class="muted">Nothing yet. Your first check-in takes about a minute.</p>'}</section>
      <section class="card"><h3>About mindsight</h3><p class="muted">Mindsight is the ability to see the inner life of yourself (<b>insight</b>) and others (<b>empathy</b>) and to link differences into a harmonious whole (<b>integration</b>). It is not therapy or medical advice. Everything you write stays on this device.</p>
        <div class="row"><button class="btn ghost small" id="export">Export data</button><button class="btn ghost small" id="wipe">Delete all data</button></div></section>`;
  },

  checkin() {
    return `<h2>Check-in · SIFT</h2><p class="muted">Pause and notice what's inside, without judging it.</p>
      <form class="card" id="sift">
        <label for="s">Sensations <small>(body: tight chest, warm hands…)</small></label><textarea id="s"></textarea>
        <label for="i">Images <small>(pictures or scenes in the mind)</small></label><textarea id="i"></textarea>
        <label for="f">Feelings <small>(name it to tame it)</small></label>
        <div class="chips" id="feel">${FEELINGS.map(f => `<button type="button" class="chip" aria-pressed="false">${f}</button>`).join("")}</div>
        <label for="t">Thoughts <small>(what is the mind saying?)</small></label><textarea id="t"></textarea>
        <label for="int">Intensity <small id="intv">3 / 5</small></label><input type="range" id="int" min="1" max="5" value="3">
        <p><button class="btn" type="submit">Save check-in</button></p>
      </form>`;
  },

  wheel() {
    const arcs = [0, 1, 2, 3].map(i => {
      const a0 = (i * 90 - 90 + 6) * Math.PI / 180, a1 = ((i + 1) * 90 - 90 - 6) * Math.PI / 180, r = 118;
      return `<path class="arc" data-arc="${i}" d="M${150 + r * Math.cos(a0)} ${150 + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${150 + r * Math.cos(a1)} ${150 + r * Math.sin(a1)}"/>`;
    }).join("");
    return `<h2>Wheel of Awareness</h2><p class="muted">A guided visual practice, with no audio. Attention travels from the hub out along a spoke to the rim, and back.</p>
      <div class="card"><div class="wheel-wrap"><svg class="wheel" viewBox="0 0 300 300" role="img" aria-label="Wheel of awareness with hub and four rim segments">
        ${arcs}<line class="spoke" id="spoke" x1="150" y1="150" x2="150" y2="150"/><circle class="hub" cx="150" cy="150" r="22"/>
        <circle class="focus-dot" id="dot" cx="150" cy="150" r="7"/></svg></div>
        <div class="guide" aria-live="polite"><h3 id="g-title">Ready when you are</h3><p id="g-text" class="muted">Choose a length and begin.</p></div>
        <div class="bar"><i id="bar"></i></div>
        <div class="row"><label for="len" style="margin:0">Time per step</label>
          <select id="len" style="width:auto"><option value="15">15 s</option><option value="30" selected>30 s</option><option value="60">60 s</option></select>
          <button class="btn" id="w-start">Begin</button><button class="btn ghost" id="w-stop" hidden>End</button></div></div>`;
  },

  empathy() {
    return `<h2>Empathy · Seeing another mind</h2><p class="muted">Practice imagining someone's inner world, especially when you disagree.</p>
      <form class="card" id="emp">
        <label for="who">Who are you thinking of?</label><input type="text" id="who" required maxlength="60">
        <label for="e1">What might they be sensing or feeling?</label><textarea id="e1"></textarea>
        <label for="e2">What might they be thinking or fearing?</label><textarea id="e2"></textarea>
        <label for="e3">What might they need right now?</label><textarea id="e3"></textarea>
        <label for="e4">What is one thing we share? <small>(linking differences)</small></label><textarea id="e4"></textarea>
        <p><button class="btn" type="submit">Save reflection</button></p></form>`;
  },

  river() {
    const latest = db.river[db.river.length - 1];
    const cur = latest ? latest.vals : {};
    const rows = DOMAINS.map(([n, d]) => `<div class="card" style="margin:0"><h3>${n}</h3><p class="muted" style="margin:0 0 8px">${d}</p>
      <div class="seg" data-dom="${n}">${["chaos", "flow", "rigid"].map(k => `<button type="button" class="${k}" data-k="${k}" aria-pressed="${cur[n] === k}">${k === "flow" ? "Flowing" : k === "chaos" ? "Chaotic" : "Rigid"}</button>`).join("")}</div></div>`).join("");
    return `<h2>River of Integration</h2><p class="muted">Well-being flows between the banks of <b style="color:var(--chaos)">chaos</b> and <b style="color:var(--rigid)">rigidity</b>. How does each domain feel lately?</p>
      <div class="river">${rows}</div><div class="card" id="river-sum"></div>
      <p><button class="btn" id="river-save">Save snapshot</button></p>`;
  }
};

function entryHtml(e) {
  const when = new Date(e.t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (e.type === "empathy") return `<div class="entry"><span class="tag">empathy · ${when}</span><p style="margin:4px 0"><b>${esc(e.who)}</b>: ${esc(e.e3 || e.e1 || "")}</p></div>`;
  return `<div class="entry"><span class="tag">check-in · ${when}</span><p style="margin:4px 0">${e.feelings.length ? esc(e.feelings.join(", ")) : "—"} <span class="muted">(${e.intensity}/5)</span></p>${e.t2 ? `<p class="muted" style="margin:0">${esc(e.t2)}</p>` : ""}</div>`;
}

/* ---------- wiring ---------- */
function render(v) {
  stopWheel(true);
  view = v;
  $("#main").innerHTML = views[v]();
  document.querySelectorAll(".app-nav button").forEach(b => b.setAttribute("aria-current", b.dataset.view === v ? "page" : "false"));
  wire[v]?.();
  $("#main").focus({ preventScroll: true }); window.scrollTo(0, 0);
}

const wire = {
  home() {
    $("#main").querySelectorAll("[data-go]").forEach(b => b.onclick = () => render(b.dataset.go));
    $("#export").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }));
      a.download = `mindsight-${dayKey()}.json`; a.click(); URL.revokeObjectURL(a.href);
    };
    $("#wipe").onclick = () => {
      if (!confirm("Delete all Mindsight data on this device? This cannot be undone.")) return;
      db.entries = []; db.practice = []; db.river = []; save(); render("home"); toast("All data deleted");
    };
  },
  checkin() {
    const sel = new Set();
    document.querySelectorAll("#feel .chip").forEach(c => c.onclick = () => {
      const on = c.getAttribute("aria-pressed") !== "true"; c.setAttribute("aria-pressed", on);
      on ? sel.add(c.textContent) : sel.delete(c.textContent);
    });
    $("#int").oninput = (e) => $("#intv").textContent = `${e.target.value} / 5`;
    $("#sift").onsubmit = (e) => {
      e.preventDefault();
      db.entries.push({ type: "checkin", t: Date.now(), day: dayKey(), s: $("#s").value.trim(), i: $("#i").value.trim(),
        t2: $("#t").value.trim(), feelings: [...sel], intensity: +$("#int").value });
      save(); toast("Check-in saved. Well noticed."); render("home");
    };
  },
  wheel() {
    $("#w-start").onclick = startWheel;
    $("#w-stop").onclick = () => stopWheel(false);
  },
  empathy() {
    $("#emp").onsubmit = (e) => {
      e.preventDefault();
      db.entries.push({ type: "empathy", t: Date.now(), day: dayKey(), who: $("#who").value.trim(),
        e1: $("#e1").value.trim(), e2: $("#e2").value.trim(), e3: $("#e3").value.trim(), e4: $("#e4").value.trim() });
      save(); toast("Reflection saved."); render("home");
    };
  },
  river() {
    const vals = { ...(db.river[db.river.length - 1]?.vals || {}) };
    const summarize = () => {
      const n = { chaos: 0, flow: 0, rigid: 0 }; Object.values(vals).forEach(k => n[k]++);
      const total = n.chaos + n.flow + n.rigid;
      if (!total) { $("#river-sum").innerHTML = '<p class="muted" style="margin:0">Choose a state for each domain to see your river.</p>'; return; }
      const dom = n.chaos >= n.rigid ? "chaos" : "rigid";
      const hint = n.chaos === 0 && n.rigid === 0 ? RIVER_HINTS.flow : RIVER_HINTS[dom];
      $("#river-sum").innerHTML = `<div class="river-bar" aria-hidden="true"><i style="width:${n.chaos / total * 100}%"></i><i style="width:${n.flow / total * 100}%"></i><i style="width:${n.rigid / total * 100}%"></i></div>
        <p style="margin:8px 0 0">${n.flow} flowing · ${n.chaos} chaotic · ${n.rigid} rigid. <span class="muted">${hint}</span></p>`;
    };
    document.querySelectorAll(".seg").forEach(seg => seg.querySelectorAll("button").forEach(b => b.onclick = () => {
      vals[seg.dataset.dom] = b.dataset.k;
      seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
      summarize();
    }));
    $("#river-save").onclick = () => { db.river.push({ t: Date.now(), vals: { ...vals } }); save(); toast("Snapshot saved."); };
    summarize();
  }
};

/* ---------- wheel practice ---------- */
function setGuide(step) {
  $("#g-title").textContent = step.title; $("#g-text").textContent = step.text;
  document.querySelectorAll(".arc").forEach(a => a.classList.toggle("on", +a.dataset.arc === step.arc));
  const spoke = $("#spoke"), dot = $("#dot");
  let x = 150, y = 150;
  if (step.arc !== null) { const ang = (step.arc * 90 + 45 - 90) * Math.PI / 180; x = 150 + 118 * Math.cos(ang); y = 150 + 118 * Math.sin(ang); }
  spoke.setAttribute("x2", x); spoke.setAttribute("y2", y); dot.setAttribute("cx", x); dot.setAttribute("cy", y);
}

function startWheel() {
  const per = +$("#len").value, total = per * WHEEL_STEPS.length;
  let i = 0, elapsed = 0;
  $("#w-start").hidden = true; $("#w-stop").hidden = false; $("#len").disabled = true;
  setGuide(WHEEL_STEPS[0]);
  wheelTimer = { per, started: Date.now(), id: setInterval(() => {
    elapsed++;
    $("#bar").style.width = `${Math.min(100, elapsed / total * 100)}%`;
    if (elapsed >= total) return stopWheel(false, true);
    const n = Math.floor(elapsed / per);
    if (n !== i) { i = n; setGuide(WHEEL_STEPS[i]); }
  }, 1000) };
}

function stopWheel(silent, completed = false) {
  if (!wheelTimer) return;
  clearInterval(wheelTimer.id);
  const seconds = Math.round((Date.now() - wheelTimer.started) / 1000);
  wheelTimer = null;
  if (seconds >= 15) { db.practice.push({ t: Date.now(), day: dayKey(), seconds }); save(); }
  if (silent) return;
  if (completed) { toast("Practice complete. Carry the spaciousness with you."); }
  render("wheel");
}

/* ---------- boot ---------- */
document.querySelectorAll(".app-nav button").forEach(b => b.onclick = () => render(b.dataset.view));
render("home");
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
