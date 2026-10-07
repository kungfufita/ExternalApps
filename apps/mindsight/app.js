/* Mindsight — blindfold-sight training platform.
   Staged practice (light → colour → shape → symbol → word) with device-blinded
   trials: the stimulus is shown on screen while the blindfold is on and is
   gone before the answer buttons appear, so a score can only come from
   perceiving the screen, never from peeking at the answer. All data stays on
   this device (localStorage). */
(() => {
"use strict";

const KEY = "mindsight:v2";
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- storage ---------- */
const fresh = () => ({ trials: [], sessions: [], settings: { exposure: 10, trialsPerSession: 20, sound: true } });
const load = () => {
  const db = fresh();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    for (const k of ["trials", "sessions"]) if (Array.isArray(raw?.[k])) db[k] = raw[k];
    if (raw?.settings && typeof raw.settings === "object") db.settings = { ...db.settings, ...raw.settings };
  } catch { /* corrupt storage: start fresh */ }
  return db;
};
const db = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage blocked */ } };

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove("show"), 2400);
}

/* ---------- audio / haptics (the trainee is blindfolded, so cues are sound + vibration) ---------- */
let actx = null;
function beep(freq = 660, ms = 160, n = 1) {
  if (!db.settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < n; i++) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(actx.destination);
      const t0 = actx.currentTime + i * (ms / 1000 + 0.08);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
      o.start(t0); o.stop(t0 + ms / 1000 + 0.02);
    }
  } catch { /* no audio */ }
  try { navigator.vibrate?.(Array(n).fill([ms, 80]).flat()); } catch { /* no haptics */ }
}

/* ---------- stages ---------- */
const COLOURS = { red: "#e03b2f", blue: "#2a62d9", green: "#2aa84a", yellow: "#f2d33a", white: "#ffffff", black: "#000000", orange: "#f28c28", purple: "#7b3fc4" };
const SHAPES = {
  circle: '<circle cx="50" cy="50" r="38"/>',
  square: '<rect x="14" y="14" width="72" height="72"/>',
  triangle: '<polygon points="50,10 92,88 8,88"/>',
  cross: '<path d="M20 20 L80 80 M80 20 L20 80" stroke-width="16" stroke="currentColor" fill="none"/>'
};
const STAGES = [
  { id: "light", name: "Light & dark", goal: "Tell a bright screen from a dark one.", kind: "fill", options: ["white", "black"] },
  { id: "colour", name: "Colours", goal: "Name which of four colours fills the screen.", kind: "fill", options: ["red", "blue", "green", "yellow"] },
  { id: "colour6", name: "Six colours", goal: "Six colours, finer distinctions.", kind: "fill", options: ["red", "blue", "green", "yellow", "orange", "purple"] },
  { id: "shape", name: "Shapes", goal: "A black shape on a white screen.", kind: "shape", options: ["circle", "square", "triangle", "cross"] },
  { id: "symbol", name: "Letters & digits", goal: "One large character.", kind: "text", options: ["A", "E", "O", "X", "3", "7"] },
  { id: "word", name: "Words", goal: "A short word in large type.", kind: "text", options: ["SUN", "CAT", "RED", "BOX", "TEA", "MAP"] }
];
const stageById = (id) => STAGES.find(s => s.id === id);

/* Advancement rule: last 20 training trials at the stage show ≥ 75% accuracy AND
   the binomial probability of doing that well by guessing is < 1%. */
const WINDOW = 20, ADVANCE_ACC = 0.75, ADVANCE_P = 0.01;
function binomTail(k, n, p) { // P(X >= k) for X ~ Binomial(n, p)
  let total = 0;
  for (let i = k; i <= n; i++) {
    let c = 0; for (let j = 1; j <= i; j++) c += Math.log(n - i + j) - Math.log(j);
    total += Math.exp(c + i * Math.log(p) + (n - i) * Math.log(1 - p));
  }
  return Math.min(1, total);
}
function stageStats(id, mode) {
  const t = db.trials.filter(x => x.stage === id && (!mode || x.mode === mode));
  const last = t.slice(-WINDOW);
  const n = last.length, k = last.filter(x => x.correct).length;
  const chance = 1 / stageById(id).options.length;
  return { n, k, acc: n ? k / n : 0, chance, p: n ? binomTail(k, n, chance) : 1, total: t.length, totalCorrect: t.filter(x => x.correct).length };
}
function stageUnlocked(i) {
  if (i === 0) return true;
  const s = stageStats(STAGES[i - 1].id, "train");
  return s.n >= WINDOW && s.acc >= ADVANCE_ACC && s.p < ADVANCE_P;
}
function currentStageIndex() { let i = 0; while (i + 1 < STAGES.length && stageUnlocked(i + 1)) i++; return i; }

/* ---------- views ---------- */
let view = "home";
const views = {
  home() {
    const ci = currentStageIndex(), cs = STAGES[ci], st = stageStats(cs.id, "train");
    const days = new Set(db.sessions.map(s => s.day));
    let streak = 0; const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
    const mins = Math.round(db.sessions.reduce((a, s) => a + s.seconds, 0) / 60);
    const today = db.sessions.filter(s => s.day === dayKey()).length;
    return `
      <section class="card warn-box"><h3>Before you start</h3><p class="muted" style="margin:0">Use a blindfold with <b>no gap at the nose</b> (see Learn → Blindfold). The app shows what to see on this screen and hides it before you answer, so your score is honest either way; the blindfold is for your own training, not for the app.</p></section>
      <section class="card"><h2 style="margin-top:0">Today</h2>
        <p>Stage ${ci + 1} of ${STAGES.length}: <b>${cs.name}</b> <span class="muted">· ${cs.goal}</span></p>
        <p class="muted" style="margin:0 0 8px">Last ${st.n}/${WINDOW} trials: ${st.n ? Math.round(st.acc * 100) + "%" : "—"} (chance ${Math.round(st.chance * 100)}%). Advance at ≥ ${ADVANCE_ACC * 100}% with p &lt; ${ADVANCE_P}.</p>
        <div class="bar"><i style="width:${Math.min(100, st.n / WINDOW * 100)}%"></i></div>
        <div class="row"><button class="btn" data-go="train">Start today's session</button><button class="btn ghost" data-go="test">Run a blind test</button></div></section>
      <section class="card kpi"><div><b>${streak}</b><span class="muted">day streak</span></div><div><b>${mins}</b><span class="muted">minutes</span></div><div><b>${today}</b><span class="muted">sessions today</span></div></section>
      <section class="card"><h3>The plan</h3><p class="muted">15–30 minutes a day, every day, for 4–8 weeks. That is the dose the courses in Learn prescribe. Each session: 3 minutes settling, then ${db.settings.trialsPerSession} trials with feedback. Run a blind test (no feedback) once a week.</p>
        <div class="row"><button class="btn ghost small" id="export">Export data</button><button class="btn ghost small" id="wipe">Delete all data</button></div></section>`;
  },

  train() {
    const ci = currentStageIndex();
    const cards = STAGES.map((s, i) => {
      const st = stageStats(s.id, "train"); const unlocked = stageUnlocked(i);
      const cls = i < ci ? "done" : i === ci ? "current" : "";
      return `<div class="card stage-card ${cls}"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${i + 1}. ${s.name}</h3>
        ${i < ci ? '<span class="pill ok">passed</span>' : i === ci ? '<span class="pill warn">current</span>' : '<span class="pill no">locked</span>'}</div>
        <p class="muted" style="margin:4px 0 8px">${s.goal} ${st.total ? `· ${st.totalCorrect}/${st.total} all time` : ""}</p>
        ${unlocked ? `<button class="btn small" data-train="${s.id}">Practise ${s.name.toLowerCase()}</button>` : ""}</div>`;
    }).join("");
    return `<h2>Training</h2><p class="muted">Each session begins with a short settling routine. Then ${db.settings.trialsPerSession} trials: sound cue → stimulus on screen for ${db.settings.exposure} s → sound cue → lift blindfold and answer → feedback.</p>
      ${cards}
      <div class="card"><h3>Settings</h3>
        <label for="exp">Stimulus exposure <small id="expv">${db.settings.exposure} s</small></label><input type="range" id="exp" min="3" max="30" value="${db.settings.exposure}">
        <label for="tps">Trials per session <small id="tpsv">${db.settings.trialsPerSession}</small></label><input type="range" id="tps" min="10" max="40" step="5" value="${db.settings.trialsPerSession}">
        <label><input type="checkbox" id="snd" ${db.settings.sound ? "checked" : ""}> Sound cues (vibration is used too)</label></div>`;
  },

  test() {
    const tests = db.sessions.filter(s => s.mode === "test").slice(-8).reverse();
    return `<h2>Blind test</h2><p class="muted">20 trials, no feedback until the end, the stimulus chosen at random by the device. This is the number that tells you whether anything is happening. Run it once a week at your current stage, and at the Light &amp; dark stage from day one.</p>
      <div class="card"><label for="tstage">Stage</label><select id="tstage">${STAGES.map((s, i) => `<option value="${s.id}" ${i === currentStageIndex() ? "selected" : ""}>${i + 1}. ${s.name} (chance ${Math.round(100 / s.options.length)}%)</option>`).join("")}</select>
        <p><button class="btn" id="t-start">Begin blind test</button></p></div>
      <div class="card"><h3>Results</h3>${tests.length ? tests.map(s => { const chance = 1 / stageById(s.stage).options.length; const p = binomTail(s.correct, s.n, chance);
        return `<div class="entry"><b>${stageById(s.stage).name}</b> · ${new Date(s.t).toLocaleDateString()}<br>${s.correct}/${s.n} correct (${Math.round(s.correct / s.n * 100)}%, chance ${Math.round(chance * 100)}%) ${verdict(p)}</div>`; }).join("") : '<p class="muted">No blind tests yet.</p>'}</div>
      <div class="card"><h3>How to read it</h3><p class="muted" style="margin:0">"p" is the probability of scoring at least this well by guessing. One test below 0.01 is interesting; three in a row is a real result. Scores around chance mean the practice has not produced perception yet, no matter how it felt.</p></div>`;
  },

  progress() {
    const sessions = db.sessions.filter(s => s.n);
    const total = db.trials.length, correct = db.trials.filter(t => t.correct).length;
    const rows = STAGES.map(s => { const a = stageStats(s.id, "train"), b = stageStats(s.id, "test");
      return `<tr><td>${s.name}</td><td>${Math.round(a.chance * 100)}%</td><td>${a.total ? Math.round(a.totalCorrect / a.total * 100) + "% (" + a.total + ")" : "—"}</td><td>${b.total ? Math.round(b.totalCorrect / b.total * 100) + "% (" + b.total + ")" : "—"}</td></tr>`; }).join("");
    return `<h2>Progress</h2>
      <section class="card kpi"><div><b>${sessions.length}</b><span class="muted">sessions</span></div><div><b>${total}</b><span class="muted">trials</span></div><div><b>${total ? Math.round(correct / total * 100) : 0}%</b><span class="muted">overall</span></div></section>
      <section class="card"><h3>Accuracy per session</h3>${chartHtml(sessions)}<p class="muted" style="margin:4px 0 0">Dashed line: chance for that session's stage.</p></section>
      <section class="card"><h3>By stage</h3><table style="width:100%;font-size:.92rem;border-collapse:collapse"><tr class="muted"><th style="text-align:left">Stage</th><th>Chance</th><th>Training</th><th>Blind tests</th></tr>${rows}</table></section>`;
  },

  learn() {
    return `<h2>Learn</h2>
      <div class="card"><details open><summary>What this is</summary><p class="muted">"Mindsight", "closed-eye vision", "blindfold sight", "midbrain activation" and "InfoVision" are names for the same claim: with training, a person can identify colours, shapes and text while their eyes are fully covered. Season 2 of <i>The Telepathy Tapes</i> presents it as a trainable, widespread skill taught in England (ICU Academy), India, China and the US.</p></details></div>
      <div class="card"><details><summary>How the courses train it</summary><p class="muted">The published programmes share one recipe, and this app follows it:</p>
        <div class="step"><b class="num">1</b><div><b>Settle.</b> Eyes covered, a few minutes of slow breathing, relaxed face and eyes, "quiet the chatter". Denisov's Original Sight and Komissarov's InfoVision both open every session this way.</div></div>
        <div class="step"><b class="num">2</b><div><b>Easy stimuli, instant feedback.</b> Light vs dark first, then bold colours, then shapes, then letters and words. The trainer says "tell me what you see" and the student answers with the first impression, without judging it; the trainer confirms or corrects at once.</div></div>
        <div class="step"><b class="num">3</b><div><b>Daily, for weeks.</b> Original Sight runs weekly sessions plus daily home practice over several weeks; InfoVision is a 10-session course; the Denisov video course is 20 daily sessions. 15–30 minutes a day is the common dose.</div></div>
        <div class="step"><b class="num">4</b><div><b>Advance on accuracy.</b> Move to the next stage only when the current one is reliable. This app requires 75% over 20 trials with less than a 1% chance of guessing it.</div></div></details></div>
      <div class="card warn-box"><details open><summary>What the evidence says (read this)</summary><p class="muted">Every time blindfold sight has been tested with the gap at the nose closed (adhesive eye patches, cotton pads under the mask, or the target in a sealed box) the ability has disappeared. This has been true from Rosa Kuleshova in the 1960s, through Houdini's and Randi's investigations, to the "midbrain activation" schools in India where children, tested by rationalist Narendra Nayak, admitted they were peeking and had been told to keep it secret. No controlled test has ever been passed.</p>
        <p class="muted">That is why this app never relies on the blindfold for its score. The target is on the screen only while the blindfold is on, and is gone before the answer buttons appear. If you ever score above chance here over repeated blind tests, that is a result nobody has produced under control before, and the data export will show exactly what happened. If you score at chance, you have learned something true, which is also the point.</p></details></div>
      <div class="card"><details><summary>Blindfold: make one with no gaps</summary>
        <div class="step"><b class="num">1</b><div>Place a cotton pad over each closed eye.</div></div>
        <div class="step"><b class="num">2</b><div>Put on an opaque contoured sleep mask on top.</div></div>
        <div class="step"><b class="num">3</b><div>Tape the lower edge along the nose and cheeks with medical tape. The nose gap is where every exposed case peeked.</div></div>
        <div class="step"><b class="num">4</b><div>Check: with the room lit, you should see no light at all, even looking down.</div></div>
        <p class="muted">Training with a leaky blindfold teaches peeking, not perception.</p></details></div>
      <div class="card"><details><summary>Session routine</summary>
        <div class="step"><b class="num">1</b><div>Screen brightness to maximum; auto-lock off; phone 20–30 cm in front of your face, screen toward you.</div></div>
        <div class="step"><b class="num">2</b><div>Blindfold on. Tap anywhere to start a trial. A rising chime means the target is on screen; a double chime means it has gone.</div></div>
        <div class="step"><b class="num">3</b><div>Lift the blindfold, tap what you saw, read the feedback, blindfold back on, tap for the next trial.</div></div>
        <div class="step"><b class="num">4</b><div>Say the first impression. Do not reason it out; the courses are emphatic that analysis blocks the channel. Keep the session short and stop before fatigue.</div></div></details></div>
      <div class="card"><details><summary>Sources</summary><ul class="muted" style="padding-left:18px">
        <li>The Telepathy Tapes S2E11, "Mindsight: Seeing Without Eyes"</li>
        <li>Nikolay Denisov &amp; Marina, Original Sight sessions and 20-day video course</li>
        <li>Mark Komissarov, InfoVision method (10-session course)</li>
        <li>Lloyd Hopkins, <i>Training Manual for Sight Without Eyes</i></li>
        <li>Wikipedia: Dermo-optical perception; Midbrain activation</li>
        <li>Skeptoid #613; Narendra Nayak's controlled tests; University of Pavia sealed-box test (2010)</li></ul>
        <p class="muted">This app is a training and measurement tool. It makes no medical or scientific claims.</p></details></div>`;
  }
};

function verdict(p) {
  if (p < 0.01) return '<span class="pill ok">above chance, p &lt; 0.01</span>';
  if (p < 0.05) return '<span class="pill warn">borderline, p &lt; 0.05</span>';
  return `<span class="pill no">consistent with guessing, p = ${p.toFixed(2)}</span>`;
}

function chartHtml(sessions) {
  const pts = sessions.slice(-30);
  if (pts.length < 2) return '<p class="muted">Complete two sessions to see a trend.</p>';
  const W = 320, H = 140, px = 24, py = 10;
  const x = (i) => px + i / (pts.length - 1) * (W - 2 * px), y = (v) => H - py - v * (H - 2 * py);
  const line = pts.map((s, i) => `${x(i)},${y(s.correct / s.n)}`).join(" ");
  const chance = pts.map((s, i) => `${x(i)},${y(1 / stageById(s.stage).options.length)}`).join(" ");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Accuracy per session">
    <text x="2" y="${y(1) + 4}">100%</text><text x="2" y="${y(0.5) + 4}">50%</text><text x="8" y="${y(0) + 4}">0%</text>
    <polyline class="chance" points="${chance}"/><polyline class="line" points="${line}"/>
    ${pts.map((s, i) => `<circle class="pt" cx="${x(i)}" cy="${y(s.correct / s.n)}" r="3"/>`).join("")}</svg>`;
}

/* ---------- wiring ---------- */
function render(v) {
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
      a.download = `mindsight-${dayKey()}.json`; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    };
    $("#wipe").onclick = () => {
      if (!confirm("Delete all Mindsight data on this device? This cannot be undone.")) return;
      db.trials = []; db.sessions = []; save(); render("home"); toast("All data deleted");
    };
  },
  train() {
    $("#main").querySelectorAll("[data-train]").forEach(b => b.onclick = () => runSession(b.dataset.train, "train"));
    $("#exp").oninput = (e) => { db.settings.exposure = +e.target.value; $("#expv").textContent = `${e.target.value} s`; save(); };
    $("#tps").oninput = (e) => { db.settings.trialsPerSession = +e.target.value; $("#tpsv").textContent = e.target.value; save(); };
    $("#snd").onchange = (e) => { db.settings.sound = e.target.checked; save(); };
  },
  test() { $("#t-start").onclick = () => runSession($("#tstage").value, "test"); },
  progress() {}, learn() {}
};

/* ---------- the trial runner (full-screen) ---------- */
const stage = () => $("#stage");
const wait = (ms) => new Promise(r => setTimeout(r, ms));
let cancelled = false;

function stimulusHtml(s, target) {
  if (s.kind === "fill") return `<div class="fill" style="background:${COLOURS[target]}"></div>`;
  if (s.kind === "shape") return `<div class="fill" style="background:#fff"></div><svg class="sym" viewBox="0 0 100 100" style="position:relative;color:#000;fill:#000">${SHAPES[target]}</svg>`;
  return `<div class="fill" style="background:#fff"></div><div class="big" style="position:relative;color:#000">${esc(target)}</div>`;
}
function answerHtml(s, opts) {
  return `<div class="answers">${opts.map(o => {
    if (s.kind === "fill") return `<button class="swatch" data-a="${o}" style="background:${COLOURS[o]}">${o}</button>`;
    if (s.kind === "shape") return `<button class="sym-btn" data-a="${o}" aria-label="${o}"><svg viewBox="0 0 100 100" style="fill:#000;color:#000">${SHAPES[o]}</svg></button>`;
    return `<button data-a="${o}">${esc(o)}</button>`; }).join("")}</div>`;
}
function tapToContinue(html) {
  return new Promise(res => {
    stage().innerHTML = html;
    const go = (e) => { if (e.target.closest("[data-cancel]")) { cancelled = true; } stage().onclick = null; res(); };
    stage().onclick = go;
  });
}
function chooseAnswer(s, opts) {
  return new Promise(res => {
    stage().innerHTML = `<p class="muted" style="color:#ccc;margin:0 0 16px">Lift the blindfold. What did you see?</p>${answerHtml(s, opts)}<div class="stage-row"><button class="btn ghost" data-cancel>End session</button></div>`;
    stage().onclick = (e) => { const b = e.target.closest("[data-a]"); if (b) { stage().onclick = null; res(b.dataset.a); } else if (e.target.closest("[data-cancel]")) { stage().onclick = null; cancelled = true; res(null); } };
  });
}

async function runSession(stageId, mode) {
  const s = stageById(stageId); cancelled = false;
  const n = mode === "test" ? 20 : db.settings.trialsPerSession;
  const started = Date.now(); let correct = 0, done = 0;
  stage().hidden = false; document.body.style.overflow = "hidden";
  try { await navigator.wakeLock?.request("screen"); } catch { /* optional */ }

  // Settling routine (training only): three minutes of slow breathing, eyes covered.
  if (mode === "train") {
    await tapToContinue(`<h2>Settle</h2><p style="max-width:34ch">Blindfold on. Sit upright, phone in your lap. Breathe slowly: in for four, out for six. Let the eyes go soft behind the mask. When thoughts come, let them pass. A chime will sound after three minutes, or tap to skip.</p><div class="stage-row"><button class="btn">Begin settling</button><button class="btn ghost" data-cancel>Cancel</button></div>`);
    if (cancelled) return endSession();
    let skipped = false;
    stage().innerHTML = `<div class="big" id="cnt">3:00</div><p style="opacity:.7">in… four · out… six</p><p class="hint">Tap anywhere to skip</p>`;
    stage().onclick = () => { skipped = true; };
    const t0 = Date.now();
    while (!skipped && Date.now() - t0 < 180000) { const left = 180 - Math.floor((Date.now() - t0) / 1000); $("#cnt").textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; await wait(250); }
    stage().onclick = null; beep(520, 400);
  }

  await tapToContinue(`<h2>${mode === "test" ? "Blind test" : "Practice"} · ${s.name}</h2><p style="max-width:34ch">${n} trials. Blindfold on, phone 20–30 cm in front of your face, screen toward you. Rising chime: target on screen. Double chime: gone, lift the blindfold and answer.</p><div class="stage-row"><button class="btn">Tap when ready</button><button class="btn ghost" data-cancel>Cancel</button></div>`);
  if (cancelled) return endSession();

  for (let i = 0; i < n && !cancelled; i++) {
    const target = pick(s.options);
    // Countdown so the trainee has time to settle after tapping.
    stage().innerHTML = `<div class="big" style="opacity:.5">·</div><p class="hint">Trial ${i + 1} of ${n}</p>`;
    await wait(1500);
    beep(880, 180);
    stage().innerHTML = stimulusHtml(s, target) + `<p class="hint" style="mix-blend-mode:difference;color:#fff">Trial ${i + 1} of ${n}</p>`;
    await wait(db.settings.exposure * 1000);
    stage().innerHTML = "";               // target gone before any answer UI exists
    beep(660, 120, 2);
    await wait(800);
    const opts = shuffle(s.options);
    const answer = await chooseAnswer(s, opts);
    if (answer === null) break;
    const ok = answer === target; if (ok) correct++; done++;
    db.trials.push({ t: Date.now(), day: dayKey(), mode, stage: s.id, k: s.options.length, target, answer, correct: ok, exposure: db.settings.exposure }); save();
    if (mode === "train") {
      beep(ok ? 988 : 220, ok ? 150 : 350);
      await tapToContinue(`<div class="big" style="color:${ok ? "#7be0a8" : "#ff8a7a"}">${ok ? "Correct" : "No"}</div><p>It was <b>${esc(target)}</b>${ok ? "" : `; you said <b>${esc(answer)}</b>`}. Running: ${correct}/${done}.</p><p class="hint">Blindfold on, then tap anywhere for the next trial</p>`);
    } else if (i < n - 1) {
      await tapToContinue(`<div class="big" style="opacity:.6">${done}/${n}</div><p class="hint">Blindfold on, then tap anywhere for the next trial</p>`);
    }
  }
  if (done) {
    const seconds = Math.round((Date.now() - started) / 1000);
    db.sessions.push({ t: Date.now(), day: dayKey(), mode, stage: s.id, n: done, correct, seconds }); save();
    const chance = 1 / s.options.length, p = binomTail(correct, done, chance);
    await tapToContinue(`<h2>${mode === "test" ? "Blind test" : "Session"} complete</h2><div class="big">${correct}/${done}</div><p>${Math.round(correct / done * 100)}% · chance ${Math.round(chance * 100)}% · ${verdict(p)}</p><p style="max-width:34ch;opacity:.8">${p < 0.01 ? "That is well above chance. Repeat the blind test; three in a row is a finding worth reporting." : p < 0.05 ? "Borderline. Keep going and repeat the blind test." : "At chance, which is the honest baseline. Keep the daily routine and measure again next week."}</p><div class="stage-row"><button class="btn">Done</button></div>`);
  }
  endSession();
}
function endSession() {
  stage().hidden = true; stage().innerHTML = ""; stage().onclick = null; document.body.style.overflow = "";
  render(view === "test" ? "test" : "home");
}

/* ---------- boot ---------- */
document.querySelectorAll(".app-nav button").forEach(b => b.onclick = () => render(b.dataset.view));
render("home");
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
