/* =========================================================================
   IEP Studio — Deaf Education (Ontario)
   Offline-first PWA for teachers of Deaf and hard-of-hearing students.

   - Student IEP profiles following the Ontario Ministry of Education IEP
     standard (strengths/needs, accommodations, AC/MOD/ALT program areas,
     annual goals, term learning expectations, transition plan).
   - Per-student intake questions and adaptive question banks.
   - Interactive session runner with difficulty adaptation and prompt-level
     recording.
   - Standardized reporting: printable IEP form, progress summaries,
     CSV / JSON exports.
   - PDSB exchange: referral packages for the Provincial and Demonstration
     Schools Branch (printable + JSON + optional configured endpoint).

   All data stays on-device in IndexedDB unless the teacher explicitly
   exports it or submits a package to a configured board endpoint.
   ========================================================================= */

"use strict";

/* ======================= 1. Reference data (Ontario) ==================== */

const EXCEPTIONALITIES = [
  "Communication — Deaf and Hard-of-Hearing",
  "Communication — Language Impairment",
  "Communication — Speech Impairment",
  "Communication — Learning Disability",
  "Communication — Autism",
  "Behaviour",
  "Intellectual — Giftedness",
  "Intellectual — Mild Intellectual Disability",
  "Intellectual — Developmental Disability",
  "Physical — Physical Disability",
  "Physical — Blind and Low Vision",
  "Multiple Exceptionalities",
  "Not formally identified (IEP without IPRC)"
];

const PLACEMENTS = [
  "Regular class with indirect support",
  "Regular class with resource assistance",
  "Regular class with withdrawal assistance",
  "Special education class with partial integration",
  "Special education class full time",
  "Provincial School for the Deaf (day)",
  "Provincial School for the Deaf (residential)"
];

const PROGRAM_TYPES = {
  AC: "Accommodated only",
  MOD: "Modified",
  ALT: "Alternative"
};

const ACHIEVEMENT_LEVELS = ["R", "1-", "1", "1+", "2-", "2", "2+", "3-", "3", "3+", "4-", "4", "4+"];

const PROMPT_LEVELS = [
  { id: "IND", label: "Independent" },
  { id: "VIS", label: "Visual cue" },
  { id: "SGN", label: "Sign prompt" },
  { id: "MOD", label: "Modelled" },
  { id: "HOH", label: "Hand-over-hand" }
];

/* Starter Ontario curriculum map (subject → strands). Teachers can type any
   subject/strand; this list seeds pickers. Includes alternative program areas
   commonly used for Deaf learners. */
const CURRICULUM = {
  "Language": ["Literacy Connections and Applications", "Foundations of Language", "Comprehension", "Composition"],
  "ASL as a Language": ["Receptive ASL", "Expressive ASL", "ASL Literature and Culture"],
  "LSQ as a Language": ["Receptive LSQ", "Expressive LSQ", "LSQ Literature and Culture"],
  "Mathematics": ["Number", "Algebra", "Data", "Spatial Sense", "Financial Literacy", "Social-Emotional Learning Skills"],
  "Science and Technology": ["STEM Skills and Connections", "Life Systems", "Matter and Energy", "Structures and Mechanisms", "Earth and Space Systems"],
  "Social Studies": ["Heritage and Identity", "People and Environments"],
  "Health and Physical Education": ["Social-Emotional Learning Skills", "Active Living", "Movement Competence", "Healthy Living"],
  "The Arts": ["Dance", "Drama", "Music (visual/vibro access)", "Visual Arts"],
  "ALT: Self-Advocacy": ["Understanding my hearing", "Requesting accommodations", "Using interpreting services"],
  "ALT: Communication Skills": ["Attention-getting strategies", "Repair strategies", "Technology use (FM/DM, captions)"],
  "ALT: Social Skills": ["Peer interaction", "Group work strategies", "Community participation"]
};

const ACCOMMODATION_SUGGESTIONS = {
  instructional: [
    "ASL/LSQ instruction and interpretation",
    "Visual schedules and graphic organizers",
    "Pre-teaching of key vocabulary with sign equivalents",
    "Captioned media for all video content",
    "Face-to-face seating for speechreading sightlines",
    "Note-taking support / copies of notes",
    "Chunking tasks with visual checklists",
    "Extra time for visual language processing"
  ],
  environmental: [
    "Preferential seating with clear sightlines to teacher and interpreter",
    "Reduced visual clutter near instruction area",
    "Good, glare-free lighting on speaker's face",
    "Visual fire alarm / emergency signal access",
    "Sound-field or personal FM/DM system",
    "Horseshoe seating for group discussion sightlines"
  ],
  assessment: [
    "Instructions presented in ASL/LSQ",
    "Extended time",
    "Alternative demonstration of learning (signed responses, visual products)",
    "Access to sign language interpreter during assessment",
    "Reduced linguistic complexity of written instructions",
    "Quiet, visually calm assessment setting"
  ]
};

/* Default per-student intake questions. The teacher can add, edit, or remove
   questions for each child individually — answers feed the IEP and sessions. */
const DEFAULT_INTAKE_QUESTIONS = [
  { text: "What is the student's primary language of communication (ASL, LSQ, spoken English, spoken French, other)?", type: "open" },
  { text: "Does the student use amplification (hearing aids, cochlear implant, BAHA)? Describe use and consistency.", type: "open" },
  { text: "Does the student work with an interpreter or intervenor? How consistently?", type: "open" },
  { text: "How does the student prefer to get a teacher's attention, and to be alerted?", type: "open" },
  { text: "What visual supports does the student already rely on (schedules, timers, cue cards)?", type: "open" },
  { text: "Is there a family history of Deafness? Is sign language used at home?", type: "open" },
  { text: "What are the student's interests and motivators?", type: "open" },
  { text: "Any medical, vision, or additional needs the program must account for?", type: "open" },
  { text: "Has a referral to the Provincial and Demonstration Schools Branch ever been made or considered?", type: "open" }
];

const STARTER_QUESTIONS = [
  { subject: "Mathematics", strand: "Number", text: "Which group shows MORE?", type: "choice", choices: ["Group A (7 dots)", "Group B (4 dots)"], answer: "Group A (7 dots)", difficulty: 1 },
  { subject: "Mathematics", strand: "Number", text: "What number comes after 29?", type: "choice", choices: ["28", "30", "39", "20"], answer: "30", difficulty: 2 },
  { subject: "Mathematics", strand: "Number", text: "Show 3/4 — which picture matches?", type: "choice", choices: ["3 of 4 parts shaded", "4 of 3 parts shaded", "1 of 4 parts shaded"], answer: "3 of 4 parts shaded", difficulty: 3 },
  { subject: "Language", strand: "Comprehension", text: "Look at the picture story. What happened FIRST?", type: "open", difficulty: 2 },
  { subject: "ASL as a Language", strand: "Expressive ASL", text: "Sign a sentence describing the picture using a topic-comment structure.", type: "open", difficulty: 3 },
  { subject: "ALT: Self-Advocacy", strand: "Requesting accommodations", text: "Your FM system battery died. Show or tell what you do next.", type: "choice", choices: ["Tell the teacher / show the dead battery", "Wait and do nothing", "Leave the room"], answer: "Tell the teacher / show the dead battery", difficulty: 2 },
  { subject: "ALT: Communication Skills", strand: "Repair strategies", text: "You missed what a classmate said. What is the BEST repair strategy?", type: "choice", choices: ["Ask them to repeat or write it", "Pretend you understood", "Change the topic"], answer: "Ask them to repeat or write it", difficulty: 1 }
];

/* ======================= 2. IndexedDB data layer ======================== */

const DB_NAME = "iep-studio";
const DB_VERSION = 1;
let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of ["students", "questions", "sessions", "exchanges", "kv"]) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = _db.transaction(store, mode);
    const s = t.objectStore(store);
    const out = fn(s);
    t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : undefined);
    t.onerror = () => reject(t.error);
  });
}

const DB = {
  put: (store, obj) => tx(store, "readwrite", s => s.put(obj)),
  del: (store, id) => tx(store, "readwrite", s => s.delete(id)),
  get: (store, id) => new Promise((res, rej) => {
    const r = _db.transaction(store).objectStore(store).get(id);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => rej(r.error);
  }),
  all: (store) => new Promise((res, rej) => {
    const r = _db.transaction(store).objectStore(store).getAll();
    r.onsuccess = () => res(r.result || []);
    r.onerror = () => rej(r.error);
  })
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const today = () => new Date().toISOString().slice(0, 10);

async function getSettings() {
  return (await DB.get("kv", "settings")) || {
    id: "settings", teacherName: "", school: "", board: "",
    pdsb: { school: "", endpoint: "", apiKey: "" }
  };
}

/* ======================= 3. Small UI helpers ============================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Visual, non-audio notification. Flashes to attract peripheral attention. */
let alertTimer = null;
function visualAlert(message, kind = "ok") {
  const el = $("#visual-alert");
  el.textContent = message;
  el.className = "visual-alert" + (kind === "warn" ? " is-warn" : kind === "danger" ? " is-danger" : "");
  el.hidden = false;
  clearTimeout(alertTimer);
  alertTimer = setTimeout(() => { el.hidden = true; }, 4000);
}

function openModal(title, bodyHTML, onMount) {
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = bodyHTML;
  $("#modal-root").hidden = false;
  if (onMount) onMount($("#modal-body"));
  $(".modal-card").focus?.();
}
function closeModal() { $("#modal-root").hidden = true; $("#modal-body").innerHTML = ""; }
document.addEventListener("click", e => { if (e.target.closest("[data-close-modal]")) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#modal-root").hidden) closeModal(); });

function download(filename, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function toCSV(rows) {
  return rows.map(r => r.map(v => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(",")).join("\r\n");
}

const fmtDate = (d) => d ? new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }) : "—";

/* ======================= 4. Student model =============================== */

function newStudent() {
  return {
    id: uid(),
    name: "", oen: "", dob: "", grade: "", school: "", board: "", homeroom: "",
    identification: {
      formallyIdentified: false,
      exceptionality: EXCEPTIONALITIES[0],
      placement: PLACEMENTS[0],
      iprcDate: ""
    },
    communication: {
      primaryLanguage: "ASL",
      modes: [], amplification: "", interpreter: "", notes: ""
    },
    strengths: [], needs: [],
    healthSupport: "",
    assessmentData: [],           // {source, date, summary}
    accommodations: { instructional: [], environmental: [], assessment: [] },
    subjects: [],                 // {id, name, program, currentLevel, annualGoal, expectations:[...]}
    humanResources: [],           // {type, frequency, location}
    transition: { goals: "", actions: "", responsible: "", timelines: "" },
    intake: DEFAULT_INTAKE_QUESTIONS.map(q => ({ id: uid(), text: q.text, type: q.type, answer: "" })),
    consultations: [],            // {date, who, note}
    mastery: {},                  // expectationId -> {score 0..1, attempts, lastSeen}
    createdAt: today(), updatedAt: today()
  };
}

function newExpectation(term = "Term 1") {
  return { id: uid(), term, text: "", strategies: "", assessmentMethods: "", status: "In progress" };
}

/* ======================= 5. Adaptive engine ============================= */

const Adaptive = {
  /* Exponential moving average of correctness per learning expectation. */
  update(student, expectationId, correct, promptLevel) {
    if (!expectationId) return;
    const m = student.mastery[expectationId] || { score: 0.5, attempts: 0, lastSeen: null };
    // Prompted-correct counts less than independent-correct.
    const weight = promptLevel === "IND" ? 1 : promptLevel === "VIS" ? 0.75 : promptLevel === "SGN" ? 0.6 : 0.4;
    const value = correct ? weight : 0;
    m.score = +(m.score * 0.7 + value * 0.3).toFixed(3);
    m.attempts += 1;
    m.lastSeen = today();
    student.mastery[expectationId] = m;
  },

  targetDifficulty(student, expectationId) {
    const m = student.mastery[expectationId];
    if (!m) return 2;
    return Math.max(1, Math.min(5, Math.round(1 + m.score * 4)));
  },

  /* Pick the next question: prefer the expectation's target difficulty,
     avoid immediate repeats, fall back to nearest difficulty. */
  nextQuestion(pool, student, expectationId, askedIds) {
    const target = this.targetDifficulty(student, expectationId);
    const fresh = pool.filter(q => !askedIds.includes(q.id));
    if (!fresh.length) return null;
    fresh.sort((a, b) =>
      Math.abs((a.difficulty || 2) - target) - Math.abs((b.difficulty || 2) - target));
    const best = Math.abs((fresh[0].difficulty || 2) - target);
    const candidates = fresh.filter(q => Math.abs((q.difficulty || 2) - target) === best);
    return candidates[Math.floor(Math.random() * candidates.length)];
  },

  masteryLabel(score) {
    if (score >= 0.8) return { text: "Consolidating", cls: "pill-ok" };
    if (score >= 0.55) return { text: "Developing", cls: "pill-info" };
    if (score >= 0.35) return { text: "Emerging", cls: "pill-warn" };
    return { text: "Needs support", cls: "pill-danger" };
  }
};

/* ======================= 6. Views ======================================= */

const Views = {};
let currentView = "dashboard";

async function navigate(view, params = {}) {
  currentView = view;
  $$(".nav-btn").forEach(b =>
    b.setAttribute("aria-current", b.dataset.view === view ? "page" : "false"));
  const main = $("#main");
  main.innerHTML = "<p>Loading…</p>";
  await Views[view](main, params);
  main.focus();
}

/* ---------- 6.1 Dashboard ---------- */

Views.dashboard = async (main) => {
  const [students, sessions, exchanges] = await Promise.all([
    DB.all("students"), DB.all("sessions"), DB.all("exchanges")
  ]);
  const settings = await getSettings();
  const recentSessions = sessions.sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const thisWeek = sessions.filter(s => (s.date || "") >= weekAgo).length;

  main.innerHTML = `
    <div class="card">
      <h2>Welcome${settings.teacherName ? ", " + esc(settings.teacherName) : ""} 👋</h2>
      <p>Visual-first planning, teaching, and reporting for your Deaf and hard-of-hearing students —
         built around the Ontario IEP standard.</p>
      <div class="btn-row">
        <button class="btn btn-big" data-go="sessions">🎯 Start a session</button>
        <button class="btn btn-secondary btn-big" data-go="students">🧑‍🎓 Students</button>
      </div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="stat-num">${students.length}</div><div class="stat-label">Students</div></div>
      <div class="stat"><div class="stat-num">${sessions.length}</div><div class="stat-label">Sessions recorded</div></div>
      <div class="stat"><div class="stat-num">${thisWeek}</div><div class="stat-label">Sessions this week</div></div>
      <div class="stat"><div class="stat-num">${exchanges.length}</div><div class="stat-label">PDSB exchanges</div></div>
    </div>
    <div class="card">
      <h3>Recent sessions</h3>
      ${recentSessions.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Student</th><th>Subject</th><th>Result</th></tr></thead>
        <tbody>${recentSessions.map(s => {
          const st = students.find(x => x.id === s.studentId);
          const pct = s.entries.length ? Math.round(100 * s.entries.filter(e => e.correct).length / s.entries.length) : 0;
          return `<tr><td>${fmtDate(s.date)}</td><td>${esc(st?.name || "—")}</td>
                  <td>${esc(s.subject)}</td><td><span class="pill ${pct >= 70 ? "pill-ok" : pct >= 40 ? "pill-warn" : "pill-danger"}">${pct}% independent-correct</span></td></tr>`;
        }).join("")}</tbody></table></div>`
      : `<div class="empty"><span class="empty-icon">🎯</span>No sessions yet. Add a student, then start your first session.</div>`}
    </div>`;
  main.addEventListener("click", e => {
    const go = e.target.closest("[data-go]");
    if (go) navigate(go.dataset.go);
  });
};

/* ---------- 6.2 Students list + editor ---------- */

Views.students = async (main, params) => {
  if (params.edit !== undefined) return renderStudentEditor(main, params.edit);
  const students = await DB.all("students");
  students.sort((a, b) => a.name.localeCompare(b.name));

  main.innerHTML = `
    <div class="card">
      <h2>Students</h2>
      <div class="btn-row">
        <button class="btn" id="add-student">➕ Add student</button>
      </div>
    </div>
    ${students.length ? students.map(s => {
      const mods = s.subjects.filter(x => x.program === "MOD").length;
      const alts = s.subjects.filter(x => x.program === "ALT").length;
      return `<div class="card student-card">
        <div>
          <h3 style="margin:0">${esc(s.name) || "<em>Unnamed</em>"}</h3>
          <div class="student-meta">Grade ${esc(s.grade) || "—"} · OEN ${esc(s.oen) || "—"} · ${esc(s.identification.exceptionality)}</div>
          <div class="tag-list">
            <span class="pill pill-info">${esc(s.communication.primaryLanguage || "—")}</span>
            <span class="pill pill-info">${s.subjects.length} subject${s.subjects.length === 1 ? "" : "s"}</span>
            ${mods ? `<span class="pill pill-warn">${mods} MOD</span>` : ""}
            ${alts ? `<span class="pill pill-warn">${alts} ALT</span>` : ""}
            ${s.identification.formallyIdentified ? `<span class="pill pill-ok">IPRC identified</span>` : `<span class="pill pill-info">IEP without IPRC</span>`}
          </div>
        </div>
        <div class="btn-row" style="margin:0">
          <button class="btn btn-secondary" data-edit="${s.id}">✏️ Open IEP</button>
          <button class="btn btn-danger" data-del="${s.id}">🗑️</button>
        </div>
      </div>`;
    }).join("")
    : `<div class="empty"><span class="empty-icon">🧑‍🎓</span>No students yet. Each student gets a full Ontario-format IEP profile.</div>`}`;

  $("#add-student").onclick = async () => {
    const s = newStudent();
    await DB.put("students", s);
    navigate("students", { edit: s.id });
  };
  main.addEventListener("click", async e => {
    const ed = e.target.closest("[data-edit]");
    if (ed) return navigate("students", { edit: ed.dataset.edit });
    const del = e.target.closest("[data-del]");
    if (del) {
      const s = await DB.get("students", del.dataset.del);
      if (confirm(`Delete ${s?.name || "this student"} and all their data? This cannot be undone.`)) {
        await DB.del("students", del.dataset.del);
        visualAlert("Student deleted", "warn");
        navigate("students");
      }
    }
  });
};

function chipEditor(items, listId, placeholder) {
  return `
    <div class="chip-list" id="${listId}">
      ${items.map((v, i) => `<span class="chip">${esc(v)}<button type="button" data-chip-del="${i}" aria-label="Remove ${esc(v)}">✕</button></span>`).join("")}
    </div>
    <div style="display:flex;gap:0.5rem">
      <input type="text" id="${listId}-input" placeholder="${esc(placeholder)}">
      <button type="button" class="btn btn-secondary" data-chip-add="${listId}">Add</button>
    </div>`;
}

async function renderStudentEditor(main, id) {
  const s = await DB.get("students", id);
  if (!s) return navigate("students");
  const settings = await getSettings();

  const accomBlock = (kind, label) => `
    <fieldset><legend>${label} accommodations</legend>
      ${chipEditor(s.accommodations[kind], `acc-${kind}`, "Type an accommodation…")}
      <label for="acc-${kind}-suggest">Add from suggestions (Deaf/HH-focused)</label>
      <select id="acc-${kind}-suggest">
        <option value="">— choose —</option>
        ${ACCOMMODATION_SUGGESTIONS[kind].map(a => `<option>${esc(a)}</option>`).join("")}
      </select>
    </fieldset>`;

  main.innerHTML = `
    <div class="card no-print">
      <button class="btn btn-ghost" id="back">← All students</button>
      <h2 style="margin:0.3rem 0 0">${esc(s.name) || "New student"} — IEP profile</h2>
      <p class="field-hint">Sections follow the Ontario Ministry of Education IEP standard. Everything saves on this device.</p>
    </div>

    <form id="student-form">
    <div class="card">
      <h3>1 · Student information</h3>
      <div class="grid grid-3">
        <div><label>Full name</label><input name="name" type="text" value="${esc(s.name)}" required></div>
        <div><label>OEN (Ontario Education Number)</label><input name="oen" type="text" value="${esc(s.oen)}" maxlength="9" placeholder="9 digits"></div>
        <div><label>Date of birth</label><input name="dob" type="date" value="${esc(s.dob)}"></div>
        <div><label>Grade</label><input name="grade" type="text" value="${esc(s.grade)}"></div>
        <div><label>School</label><input name="school" type="text" value="${esc(s.school || settings.school)}"></div>
        <div><label>School board</label><input name="board" type="text" value="${esc(s.board || settings.board)}"></div>
      </div>
    </div>

    <div class="card">
      <h3>2 · Identification &amp; placement</h3>
      <label><input type="checkbox" name="formallyIdentified" ${s.identification.formallyIdentified ? "checked" : ""} style="width:auto;min-height:auto"> Formally identified by an IPRC</label>
      <div class="grid grid-3">
        <div><label>Exceptionality</label>
          <select name="exceptionality">${EXCEPTIONALITIES.map(x => `<option ${x === s.identification.exceptionality ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></div>
        <div><label>Placement</label>
          <select name="placement">${PLACEMENTS.map(x => `<option ${x === s.identification.placement ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></div>
        <div><label>Most recent IPRC date</label><input name="iprcDate" type="date" value="${esc(s.identification.iprcDate)}"></div>
      </div>
    </div>

    <div class="card">
      <h3>3 · Communication profile</h3>
      <div class="grid grid-3">
        <div><label>Primary language</label>
          <select name="primaryLanguage">${["ASL", "LSQ", "Spoken English", "Spoken French", "Bimodal (sign + spoken)", "Other"].map(x => `<option ${x === s.communication.primaryLanguage ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></div>
        <div><label>Amplification / technology</label><input name="amplification" type="text" value="${esc(s.communication.amplification)}" placeholder="e.g., bilateral CIs, FM/DM system"></div>
        <div><label>Interpreter / intervenor support</label><input name="interpreter" type="text" value="${esc(s.communication.interpreter)}" placeholder="e.g., ASL interpreter, full day"></div>
      </div>
      <label>Notes</label><textarea name="commNotes">${esc(s.communication.notes)}</textarea>
    </div>

    <div class="card">
      <h3>4 · Strengths and needs</h3>
      <label>Areas of strength</label>
      ${chipEditor(s.strengths, "strengths", "e.g., strong visual memory")}
      <label>Areas of need</label>
      ${chipEditor(s.needs, "needs", "e.g., English print vocabulary")}
    </div>

    <div class="card">
      <h3>5 · Assessment data &amp; health support</h3>
      <div id="assess-list">
        ${s.assessmentData.map((a, i) => `<div class="grid grid-3" data-assess="${i}">
          <div><label>Source</label><input data-af="source" type="text" value="${esc(a.source)}"></div>
          <div><label>Date</label><input data-af="date" type="date" value="${esc(a.date)}"></div>
          <div><label>Summary</label><input data-af="summary" type="text" value="${esc(a.summary)}"></div>
        </div>`).join("")}
      </div>
      <button type="button" class="btn btn-secondary" id="add-assess">➕ Add assessment</button>
      <label>Health support services / medical conditions</label>
      <textarea name="healthSupport">${esc(s.healthSupport)}</textarea>
    </div>

    <div class="card">
      <h3>6 · Accommodations</h3>
      ${accomBlock("instructional", "Instructional")}
      ${accomBlock("environmental", "Environmental")}
      ${accomBlock("assessment", "Assessment")}
    </div>

    <div class="card">
      <h3>7 · Program: subjects, goals &amp; learning expectations</h3>
      <p class="field-hint">AC = accommodated only · MOD = modified expectations · ALT = alternative program area.</p>
      <div id="subjects-list">${s.subjects.map((sub, si) => subjectBlock(sub, si)).join("")}</div>
      <div class="btn-row">
        <select id="subject-picker" style="max-width:320px">
          ${Object.keys(CURRICULUM).map(k => `<option>${esc(k)}</option>`).join("")}
          <option value="__custom">Custom subject…</option>
        </select>
        <button type="button" class="btn btn-secondary" id="add-subject">➕ Add subject / program area</button>
      </div>
    </div>

    <div class="card">
      <h3>8 · Human resources</h3>
      <div id="hr-list">
        ${s.humanResources.map((h, i) => `<div class="grid grid-3" data-hr="${i}">
          <div><label>Support type</label><input data-hf="type" type="text" value="${esc(h.type)}" placeholder="e.g., Teacher of the Deaf"></div>
          <div><label>Frequency / intensity</label><input data-hf="frequency" type="text" value="${esc(h.frequency)}" placeholder="e.g., 2× 40 min weekly"></div>
          <div><label>Location</label><input data-hf="location" type="text" value="${esc(h.location)}" placeholder="e.g., resource room"></div>
        </div>`).join("")}
      </div>
      <button type="button" class="btn btn-secondary" id="add-hr">➕ Add support</button>
    </div>

    <div class="card">
      <h3>9 · Transition plan</h3>
      <label>Goals</label><textarea name="trGoals">${esc(s.transition.goals)}</textarea>
      <label>Actions</label><textarea name="trActions">${esc(s.transition.actions)}</textarea>
      <div class="grid grid-2">
        <div><label>Person(s) responsible</label><input name="trResponsible" type="text" value="${esc(s.transition.responsible)}"></div>
        <div><label>Timelines</label><input name="trTimelines" type="text" value="${esc(s.transition.timelines)}"></div>
      </div>
    </div>

    <div class="card">
      <h3>10 · Individual intake questions</h3>
      <p class="field-hint">These questions are specific to this student. Add any question you need answered
         for this child's programming — answers appear in the IEP consultation record.</p>
      <div id="intake-list">
        ${s.intake.map((q, i) => `<div data-intake="${i}" style="margin-bottom:0.8rem">
          <label>${i + 1}. <span class="intake-q-text">${esc(q.text)}</span>
            <button type="button" class="btn btn-ghost" data-intake-del="${i}" aria-label="Remove question">✕</button></label>
          <textarea data-intake-answer="${i}" placeholder="Answer…">${esc(q.answer)}</textarea>
        </div>`).join("")}
      </div>
      <div style="display:flex;gap:0.5rem">
        <input type="text" id="new-intake-q" placeholder="Add a new question for this student…">
        <button type="button" class="btn btn-secondary" id="add-intake">Add</button>
      </div>
    </div>

    <div class="card">
      <h3>11 · Parent / student consultation log</h3>
      <div id="consult-list">
        ${s.consultations.map((c, i) => `<div class="grid grid-3" data-consult="${i}">
          <div><label>Date</label><input data-cf="date" type="date" value="${esc(c.date)}"></div>
          <div><label>Who</label><input data-cf="who" type="text" value="${esc(c.who)}"></div>
          <div><label>Outcome</label><input data-cf="note" type="text" value="${esc(c.note)}"></div>
        </div>`).join("")}
      </div>
      <button type="button" class="btn btn-secondary" id="add-consult">➕ Add consultation</button>
    </div>

    <div class="card no-print">
      <div class="btn-row">
        <button type="submit" class="btn btn-big">💾 Save IEP</button>
        <button type="button" class="btn btn-secondary" id="print-iep">🖨️ Printable IEP</button>
      </div>
    </div>
    </form>`;

  /* --- wire up dynamic bits --- */
  $("#back").onclick = () => navigate("students");

  const chipLists = { strengths: s.strengths, needs: s.needs,
    "acc-instructional": s.accommodations.instructional,
    "acc-environmental": s.accommodations.environmental,
    "acc-assessment": s.accommodations.assessment };

  function redrawChips(listId) {
    $(`#${listId}`).innerHTML = chipLists[listId].map((v, i) =>
      `<span class="chip">${esc(v)}<button type="button" data-chip-del="${i}" aria-label="Remove ${esc(v)}">✕</button></span>`).join("");
  }

  main.addEventListener("click", e => {
    const add = e.target.closest("[data-chip-add]");
    if (add) {
      const listId = add.dataset.chipAdd;
      const input = $(`#${listId}-input`);
      if (input.value.trim()) { chipLists[listId].push(input.value.trim()); input.value = ""; redrawChips(listId); }
      return;
    }
    const del = e.target.closest("[data-chip-del]");
    if (del) {
      const listEl = del.closest(".chip-list");
      chipLists[listEl.id].splice(+del.dataset.chipDel, 1);
      redrawChips(listEl.id);
    }
  });

  ["instructional", "environmental", "assessment"].forEach(kind => {
    $(`#acc-${kind}-suggest`).onchange = (e) => {
      if (e.target.value) {
        chipLists[`acc-${kind}`].push(e.target.value);
        redrawChips(`acc-${kind}`);
        e.target.value = "";
      }
    };
  });

  $("#add-assess").onclick = () => { s.assessmentData.push({ source: "", date: "", summary: "" }); saveDraftAndRerender(); };
  $("#add-hr").onclick = () => { s.humanResources.push({ type: "", frequency: "", location: "" }); saveDraftAndRerender(); };
  $("#add-consult").onclick = () => { s.consultations.push({ date: today(), who: "", note: "" }); saveDraftAndRerender(); };

  $("#add-intake").onclick = () => {
    const inp = $("#new-intake-q");
    if (inp.value.trim()) {
      s.intake.push({ id: uid(), text: inp.value.trim(), type: "open", answer: "" });
      saveDraftAndRerender();
    }
  };
  main.addEventListener("click", e => {
    const d = e.target.closest("[data-intake-del]");
    if (d) { collectForm(); s.intake.splice(+d.dataset.intakeDel, 1); saveDraftAndRerender(); }
  });

  $("#add-subject").onclick = () => {
    collectForm();
    let name = $("#subject-picker").value;
    if (name === "__custom") name = prompt("Subject / program area name:") || "";
    if (!name.trim()) return;
    const isAlt = name.startsWith("ALT:");
    s.subjects.push({
      id: uid(), name: name.trim(), program: isAlt ? "ALT" : "AC",
      currentLevel: "", annualGoal: "",
      expectations: [newExpectation("Term 1")]
    });
    saveDraftAndRerender();
  };

  main.addEventListener("click", e => {
    const addExp = e.target.closest("[data-add-exp]");
    if (addExp) {
      collectForm();
      const sub = s.subjects.find(x => x.id === addExp.dataset.addExp);
      sub.expectations.push(newExpectation(addExp.dataset.term || "Term 1"));
      saveDraftAndRerender();
      return;
    }
    const delExp = e.target.closest("[data-del-exp]");
    if (delExp) {
      collectForm();
      const sub = s.subjects.find(x => x.id === delExp.dataset.subj);
      sub.expectations = sub.expectations.filter(x => x.id !== delExp.dataset.delExp);
      saveDraftAndRerender();
      return;
    }
    const delSub = e.target.closest("[data-del-subj]");
    if (delSub && confirm("Remove this subject and its expectations from the IEP?")) {
      collectForm();
      s.subjects = s.subjects.filter(x => x.id !== delSub.dataset.delSubj);
      saveDraftAndRerender();
    }
  });

  function collectForm() {
    const f = $("#student-form");
    const v = (n) => f.elements[n]?.value ?? "";
    Object.assign(s, {
      name: v("name"), oen: v("oen"), dob: v("dob"), grade: v("grade"),
      school: v("school"), board: v("board")
    });
    s.identification = {
      formallyIdentified: f.elements.formallyIdentified.checked,
      exceptionality: v("exceptionality"), placement: v("placement"), iprcDate: v("iprcDate")
    };
    s.communication = {
      ...s.communication,
      primaryLanguage: v("primaryLanguage"), amplification: v("amplification"),
      interpreter: v("interpreter"), notes: v("commNotes")
    };
    s.healthSupport = v("healthSupport");
    s.transition = { goals: v("trGoals"), actions: v("trActions"), responsible: v("trResponsible"), timelines: v("trTimelines") };

    $$("[data-assess]").forEach((row, i) => {
      s.assessmentData[i] = {
        source: $('[data-af="source"]', row).value,
        date: $('[data-af="date"]', row).value,
        summary: $('[data-af="summary"]', row).value
      };
    });
    $$("[data-hr]").forEach((row, i) => {
      s.humanResources[i] = {
        type: $('[data-hf="type"]', row).value,
        frequency: $('[data-hf="frequency"]', row).value,
        location: $('[data-hf="location"]', row).value
      };
    });
    $$("[data-consult]").forEach((row, i) => {
      s.consultations[i] = {
        date: $('[data-cf="date"]', row).value,
        who: $('[data-cf="who"]', row).value,
        note: $('[data-cf="note"]', row).value
      };
    });
    $$("[data-intake-answer]").forEach(t => { s.intake[+t.dataset.intakeAnswer].answer = t.value; });

    $$("[data-subj-block]").forEach(block => {
      const sub = s.subjects.find(x => x.id === block.dataset.subjBlock);
      if (!sub) return;
      sub.program = $('[data-sf="program"]', block).value;
      sub.currentLevel = $('[data-sf="currentLevel"]', block).value;
      sub.annualGoal = $('[data-sf="annualGoal"]', block).value;
      $$("[data-exp-row]", block).forEach(row => {
        const exp = sub.expectations.find(x => x.id === row.dataset.expRow);
        if (!exp) return;
        exp.term = $('[data-ef="term"]', row).value;
        exp.text = $('[data-ef="text"]', row).value;
        exp.strategies = $('[data-ef="strategies"]', row).value;
        exp.assessmentMethods = $('[data-ef="assessmentMethods"]', row).value;
        exp.status = $('[data-ef="status"]', row).value;
      });
    });
  }

  async function saveDraftAndRerender() {
    s.updatedAt = today();
    await DB.put("students", s);
    renderStudentEditor(main, s.id);
  }

  $("#student-form").onsubmit = async (e) => {
    e.preventDefault();
    collectForm();
    s.updatedAt = today();
    await DB.put("students", s);
    visualAlert("✅ IEP saved");
  };

  $("#print-iep").onclick = () => { collectForm(); DB.put("students", s).then(() => navigate("reports", { iep: s.id })); };
}

function subjectBlock(sub, si) {
  return `<fieldset data-subj-block="${sub.id}">
    <legend>${esc(sub.name)}</legend>
    <div class="grid grid-3">
      <div><label>Program type</label>
        <select data-sf="program">${Object.entries(PROGRAM_TYPES).map(([k, v]) =>
          `<option value="${k}" ${sub.program === k ? "selected" : ""}>${k} — ${esc(v)}</option>`).join("")}</select></div>
      <div><label>Current level of achievement</label>
        <select data-sf="currentLevel"><option value="">—</option>${ACHIEVEMENT_LEVELS.map(l =>
          `<option ${sub.currentLevel === l ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div style="align-self:end"><button type="button" class="btn btn-danger" data-del-subj="${sub.id}">Remove subject</button></div>
    </div>
    <label>Annual program goal</label>
    <textarea data-sf="annualGoal" placeholder="By June, ${esc(sub.name)}…">${esc(sub.annualGoal)}</textarea>
    <h4 style="margin:0.8rem 0 0.2rem">Learning expectations</h4>
    ${sub.expectations.map(exp => `
      <div data-exp-row="${exp.id}" style="border-top:1px dashed var(--line);padding-top:0.6rem;margin-top:0.6rem">
        <div class="grid grid-3">
          <div><label>Reporting period</label>
            <select data-ef="term">${["Term 1", "Term 2", "Term 3"].map(t => `<option ${exp.term === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
          <div><label>Status</label>
            <select data-ef="status">${["Not started", "In progress", "Achieved", "Continued next term"].map(t => `<option ${exp.status === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
          <div style="align-self:end"><button type="button" class="btn btn-ghost" data-subj="${sub.id}" data-del-exp="${exp.id}">✕ Remove</button></div>
        </div>
        <label>Learning expectation</label>
        <textarea data-ef="text" placeholder="Observable, measurable expectation…">${esc(exp.text)}</textarea>
        <div class="grid grid-2">
          <div><label>Teaching strategies</label><textarea data-ef="strategies">${esc(exp.strategies)}</textarea></div>
          <div><label>Assessment methods</label><textarea data-ef="assessmentMethods">${esc(exp.assessmentMethods)}</textarea></div>
        </div>
      </div>`).join("")}
    <div class="btn-row">
      <button type="button" class="btn btn-secondary" data-add-exp="${sub.id}">➕ Add expectation</button>
    </div>
  </fieldset>`;
}

/* ---------- 6.3 Question bank ---------- */

Views.questions = async (main) => {
  const [questions, students] = await Promise.all([DB.all("questions"), DB.all("students")]);
  questions.sort((a, b) => (a.subject + a.strand).localeCompare(b.subject + b.strand));

  main.innerHTML = `
    <div class="card">
      <h2>Question bank</h2>
      <p class="field-hint">Questions drive interactive sessions. Attach a question to one student for
         individualized practice, or leave it shared. Every question can carry an ASL/LSQ video link and an
         image so nothing depends on spoken instructions.</p>
      <div class="btn-row">
        <button class="btn" id="add-q">➕ New question</button>
        ${questions.length === 0 ? `<button class="btn btn-secondary" id="seed-q">✨ Load starter questions</button>` : ""}
      </div>
    </div>
    ${questions.length ? `<div class="card table-wrap"><table>
      <thead><tr><th>Subject / strand</th><th>Question</th><th>Type</th><th>Difficulty</th><th>For</th><th></th></tr></thead>
      <tbody>${questions.map(q => {
        const st = q.studentId ? students.find(x => x.id === q.studentId) : null;
        return `<tr>
          <td>${esc(q.subject)}<br><span class="field-hint">${esc(q.strand || "")}</span></td>
          <td>${esc(q.text)}${q.aslVideoUrl ? " 🤟" : ""}${q.imageUrl ? " 🖼️" : ""}</td>
          <td>${esc(q.type)}</td>
          <td>${"●".repeat(q.difficulty || 2)}${"○".repeat(5 - (q.difficulty || 2))}</td>
          <td>${st ? esc(st.name) : '<span class="pill pill-info">Shared</span>'}</td>
          <td><button class="btn btn-ghost" data-edit-q="${q.id}">✏️</button>
              <button class="btn btn-ghost" data-del-q="${q.id}" aria-label="Delete question">🗑️</button></td>
        </tr>`;
      }).join("")}</tbody></table></div>`
    : `<div class="empty"><span class="empty-icon">❓</span>No questions yet. Create your own or load the starter set.</div>`}`;

  $("#seed-q")?.addEventListener("click", async () => {
    for (const q of STARTER_QUESTIONS) {
      await DB.put("questions", { id: uid(), studentId: null, expectationId: null,
        aslVideoUrl: "", imageUrl: "", ...q, choices: q.choices || [], answer: q.answer || "" });
    }
    visualAlert("Starter questions loaded");
    navigate("questions");
  });
  $("#add-q").onclick = () => questionModal(null, students);
  main.addEventListener("click", async e => {
    const ed = e.target.closest("[data-edit-q]");
    if (ed) return questionModal(await DB.get("questions", ed.dataset.editQ), students);
    const del = e.target.closest("[data-del-q]");
    if (del && confirm("Delete this question?")) {
      await DB.del("questions", del.dataset.delQ);
      navigate("questions");
    }
  });
};

function questionModal(q, students) {
  const isNew = !q;
  q = q || { id: uid(), studentId: null, expectationId: null, subject: "Mathematics", strand: "",
    text: "", type: "choice", choices: ["", ""], answer: "", difficulty: 2, aslVideoUrl: "", imageUrl: "" };

  const student = students.find(x => x.id === q.studentId);
  const expOptions = (st) => !st ? "" : st.subjects.flatMap(sub =>
    sub.expectations.filter(e => e.text).map(e =>
      `<option value="${e.id}" ${q.expectationId === e.id ? "selected" : ""}>${esc(sub.name)}: ${esc(e.text.slice(0, 70))}</option>`)).join("");

  openModal(isNew ? "New question" : "Edit question", `
    <label>Subject</label>
    <select id="q-subject">${Object.keys(CURRICULUM).map(k => `<option ${q.subject === k ? "selected" : ""}>${esc(k)}</option>`).join("")}</select>
    <label>Strand</label>
    <select id="q-strand"></select>
    <label>Question text (displayed large, visual-first)</label>
    <textarea id="q-text">${esc(q.text)}</textarea>
    <div class="grid grid-2">
      <div><label>ASL / LSQ video URL (optional)</label>
        <input id="q-asl" type="url" value="${esc(q.aslVideoUrl)}" placeholder="Link to a signed version of this question">
        <p class="field-hint">Shown as a 🤟 button during the session.</p></div>
      <div><label>Image URL (optional)</label>
        <input id="q-img" type="url" value="${esc(q.imageUrl)}"></div>
    </div>
    <div class="grid grid-3">
      <div><label>Type</label>
        <select id="q-type">
          <option value="choice" ${q.type === "choice" ? "selected" : ""}>Multiple choice</option>
          <option value="open" ${q.type === "open" ? "selected" : ""}>Open / observed response</option>
        </select></div>
      <div><label>Difficulty (1 easy – 5 hard)</label>
        <input id="q-diff" type="number" min="1" max="5" value="${q.difficulty || 2}"></div>
      <div><label>Assigned student (blank = shared)</label>
        <select id="q-student"><option value="">Shared — all students</option>
          ${students.map(st => `<option value="${st.id}" ${q.studentId === st.id ? "selected" : ""}>${esc(st.name)}</option>`).join("")}
        </select></div>
    </div>
    <div id="q-exp-wrap" ${q.studentId ? "" : "hidden"}>
      <label>Linked IEP learning expectation (drives adaptive tracking)</label>
      <select id="q-exp"><option value="">— none —</option>${expOptions(student)}</select>
    </div>
    <div id="q-choices-wrap" ${q.type === "choice" ? "" : "hidden"}>
      <label>Choices (mark the correct one)</label>
      <div id="q-choices"></div>
      <button type="button" class="btn btn-secondary" id="q-add-choice">➕ Add choice</button>
    </div>
    <div class="btn-row">
      <button class="btn" id="q-save">💾 Save question</button>
    </div>
  `, (body) => {
    const strandSel = $("#q-strand", body);
    const fillStrands = () => {
      const subj = $("#q-subject", body).value;
      strandSel.innerHTML = (CURRICULUM[subj] || []).map(st =>
        `<option ${q.strand === st ? "selected" : ""}>${esc(st)}</option>`).join("") + `<option value="">(none)</option>`;
    };
    fillStrands();
    $("#q-subject", body).onchange = fillStrands;

    let choices = q.choices?.length ? [...q.choices] : ["", ""];
    const drawChoices = () => {
      $("#q-choices", body).innerHTML = choices.map((c, i) => `
        <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.4rem">
          <input type="radio" name="q-correct" ${q.answer && q.answer === c && c !== "" ? "checked" : ""} value="${i}" style="width:auto;min-height:auto" aria-label="Correct answer">
          <input type="text" data-choice="${i}" value="${esc(c)}" placeholder="Choice ${i + 1}">
          <button type="button" class="btn btn-ghost" data-del-choice="${i}">✕</button>
        </div>`).join("");
    };
    drawChoices();
    body.addEventListener("input", e => { if (e.target.dataset.choice !== undefined) choices[+e.target.dataset.choice] = e.target.value; });
    body.addEventListener("click", e => {
      const d = e.target.closest("[data-del-choice]");
      if (d) { choices.splice(+d.dataset.delChoice, 1); drawChoices(); }
    });
    $("#q-add-choice", body).onclick = () => { choices.push(""); drawChoices(); };
    $("#q-type", body).onchange = e => { $("#q-choices-wrap", body).hidden = e.target.value !== "choice"; };
    $("#q-student", body).onchange = e => {
      const st = students.find(x => x.id === e.target.value);
      $("#q-exp-wrap", body).hidden = !st;
      $("#q-exp", body).innerHTML = `<option value="">— none —</option>` + expOptions(st);
    };

    $("#q-save", body).onclick = async () => {
      q.subject = $("#q-subject", body).value;
      q.strand = strandSel.value;
      q.text = $("#q-text", body).value.trim();
      q.type = $("#q-type", body).value;
      q.difficulty = Math.max(1, Math.min(5, +$("#q-diff", body).value || 2));
      q.studentId = $("#q-student", body).value || null;
      q.expectationId = q.studentId ? ($("#q-exp", body).value || null) : null;
      q.aslVideoUrl = $("#q-asl", body).value.trim();
      q.imageUrl = $("#q-img", body).value.trim();
      if (q.type === "choice") {
        q.choices = choices.filter(c => c.trim());
        const checked = body.querySelector('input[name="q-correct"]:checked');
        q.answer = checked ? (choices[+checked.value] || "") : "";
        if (q.choices.length < 2 || !q.answer) return visualAlert("Choice questions need 2+ choices and a marked answer", "warn");
      } else { q.choices = []; q.answer = ""; }
      if (!q.text) return visualAlert("Question text is required", "warn");
      await DB.put("questions", q);
      closeModal();
      visualAlert("✅ Question saved");
      navigate("questions");
    };
  });
}

/* ---------- 6.4 Sessions (setup, runner, history) ---------- */

Views.sessions = async (main, params) => {
  if (params.run) return runSession(main, params.run);
  const [students, sessions] = await Promise.all([DB.all("students"), DB.all("sessions")]);
  sessions.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  main.innerHTML = `
    <div class="card">
      <h2>Interactive sessions</h2>
      <p class="field-hint">Sessions present each child's questions visually, one at a time. Difficulty adapts
         to the student's mastery on each linked IEP expectation, and you record the prompt level used.</p>
      <label>Student</label>
      <select id="sess-student">${students.length ? students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("") : "<option value=''>— add a student first —</option>"}</select>
      <label>Subject focus</label>
      <select id="sess-subject">${Object.keys(CURRICULUM).map(k => `<option>${esc(k)}</option>`).join("")}</select>
      <label>Number of questions</label>
      <select id="sess-count"><option>5</option><option selected>8</option><option>10</option><option>15</option></select>
      <div class="btn-row">
        <button class="btn btn-big" id="start-sess" ${students.length ? "" : "disabled"}>🎯 Start session</button>
      </div>
    </div>
    <div class="card">
      <h3>Session history</h3>
      ${sessions.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Student</th><th>Subject</th><th>Questions</th><th>Correct</th><th></th></tr></thead>
        <tbody>${sessions.slice(0, 25).map(sess => {
          const st = students.find(x => x.id === sess.studentId);
          const c = sess.entries.filter(e => e.correct).length;
          return `<tr><td>${fmtDate(sess.date)}</td><td>${esc(st?.name || "—")}</td><td>${esc(sess.subject)}</td>
            <td>${sess.entries.length}</td><td>${c}/${sess.entries.length}</td>
            <td><button class="btn btn-ghost" data-view-sess="${sess.id}">👁️ View</button></td></tr>`;
        }).join("")}</tbody></table></div>`
      : `<div class="empty"><span class="empty-icon">🕐</span>No sessions recorded yet.</div>`}
    </div>`;

  $("#start-sess")?.addEventListener("click", async () => {
    const studentId = $("#sess-student").value;
    const subject = $("#sess-subject").value;
    const count = +$("#sess-count").value;
    if (!studentId) return;
    const allQ = await DB.all("questions");
    const pool = allQ.filter(q => q.subject === subject && (!q.studentId || q.studentId === studentId));
    if (!pool.length) return visualAlert("No questions for that subject — add some in the Question bank first", "warn");
    const sess = { id: uid(), studentId, subject, date: today(),
      plannedCount: Math.min(count, pool.length), entries: [], notes: "", finished: false };
    await DB.put("sessions", sess);
    navigate("sessions", { run: sess.id });
  });

  main.addEventListener("click", async e => {
    const v = e.target.closest("[data-view-sess]");
    if (v) {
      const sess = await DB.get("sessions", v.dataset.viewSess);
      const st = await DB.get("students", sess.studentId);
      const allQ = await DB.all("questions");
      openModal(`Session — ${esc(st?.name || "")} · ${fmtDate(sess.date)}`, `
        <div class="table-wrap"><table>
          <thead><tr><th>Question</th><th>Result</th><th>Prompt level</th><th>Difficulty</th></tr></thead>
          <tbody>${sess.entries.map(en => {
            const q = allQ.find(x => x.id === en.questionId);
            return `<tr><td>${esc(q?.text || en.questionText || "(deleted)")}</td>
              <td>${en.correct ? '<span class="pill pill-ok">✔ correct</span>' : '<span class="pill pill-danger">✘ not yet</span>'}</td>
              <td>${esc(PROMPT_LEVELS.find(p => p.id === en.promptLevel)?.label || en.promptLevel)}</td>
              <td>${en.difficulty}</td></tr>`;
          }).join("")}</tbody></table></div>
        ${sess.notes ? `<h3>Notes</h3><p>${esc(sess.notes)}</p>` : ""}`);
    }
  });
};

async function runSession(main, sessionId) {
  const sess = await DB.get("sessions", sessionId);
  const student = await DB.get("students", sess.studentId);
  const allQ = await DB.all("questions");
  const pool = allQ.filter(q => q.subject === sess.subject && (!q.studentId || q.studentId === student.id));

  let currentQ = null;
  let selectedPrompt = "IND";
  let phase = "question"; // question -> feedback

  function pickNext() {
    const askedIds = sess.entries.map(e => e.questionId);
    // Prefer questions tied to this student's expectations, rotating across them.
    const tied = pool.filter(q => q.expectationId);
    const expCounts = {};
    for (const e of sess.entries) {
      const q = pool.find(x => x.id === e.questionId);
      if (q?.expectationId) expCounts[q.expectationId] = (expCounts[q.expectationId] || 0) + 1;
    }
    const expIds = [...new Set(tied.map(q => q.expectationId))]
      .sort((a, b) => (expCounts[a] || 0) - (expCounts[b] || 0));
    for (const expId of expIds) {
      const q = Adaptive.nextQuestion(tied.filter(x => x.expectationId === expId), student, expId, askedIds);
      if (q) return q;
    }
    return Adaptive.nextQuestion(pool, student, null, askedIds);
  }

  function render() {
    const done = sess.entries.length;
    const total = sess.plannedCount;
    if (done >= total || (!currentQ && !(currentQ = pickNext()))) return renderSummary();

    const q = currentQ;
    const target = q.expectationId ? Adaptive.targetDifficulty(student, q.expectationId) : (q.difficulty || 2);
    main.innerHTML = `
      <div class="runner">
        <div class="card no-print" style="display:flex;justify-content:space-between;align-items:center;gap:1rem">
          <div><strong>${esc(student.name)}</strong> · ${esc(sess.subject)}</div>
          <div class="difficulty-meter">Question ${done + 1} of ${total} · difficulty ${"●".repeat(q.difficulty || 2)}${"○".repeat(5 - (q.difficulty || 2))} (target ${target})</div>
          <button class="btn btn-ghost" id="end-early">End session</button>
        </div>
        <div class="runner-progress" aria-hidden="true">
          ${Array.from({ length: total }, (_, i) =>
            `<span class="${i < done ? "done" : i === done ? "current" : ""}"></span>`).join("")}
        </div>
        <div class="card">
          <div class="q-media">
            ${q.imageUrl ? `<img src="${esc(q.imageUrl)}" alt="Question image">` : ""}
            ${q.aslVideoUrl ? `<p><a class="asl-link" href="${esc(q.aslVideoUrl)}" target="_blank" rel="noopener">🤟 Watch this question in ASL/LSQ</a></p>` : ""}
          </div>
          <p class="q-text">${esc(q.text)}</p>
          <div class="feedback-visual" id="feedback" aria-live="assertive"></div>
          ${phase === "question" ? renderAnswerUI(q) : ""}
          ${phase === "feedback" ? `<div class="btn-row" style="justify-content:center">
              <button class="btn btn-big" id="next-q">Next ➜</button></div>` : ""}
        </div>
        ${phase === "question" ? `<div class="card no-print">
          <strong>Prompt level used</strong>
          <p class="field-hint">Record how much support the student needed. Independent responses weigh more in mastery tracking.</p>
          <div class="prompt-level" role="radiogroup" aria-label="Prompt level">
            ${PROMPT_LEVELS.map(p => `<button class="btn ${selectedPrompt === p.id ? "" : "btn-secondary"}" data-prompt="${p.id}">${esc(p.label)}</button>`).join("")}
          </div>
        </div>` : ""}
      </div>`;

    $("#end-early").onclick = () => renderSummary();
    $$("[data-prompt]").forEach(b => b.onclick = () => { selectedPrompt = b.dataset.prompt; render(); });

    if (phase === "question") {
      if (q.type === "choice") {
        $$(".choice-btn").forEach(b => b.onclick = () => record(b.dataset.value === q.answer, b));
      } else {
        $("#mark-correct").onclick = () => record(true);
        $("#mark-incorrect").onclick = () => record(false);
      }
    }
    if (phase === "feedback") $("#next-q").onclick = () => { currentQ = null; phase = "question"; selectedPrompt = "IND"; render(); };
  }

  function renderAnswerUI(q) {
    if (q.type === "choice") {
      const shuffled = [...q.choices].sort(() => Math.random() - 0.5);
      return `<div class="choice-grid">${shuffled.map(c =>
        `<button class="choice-btn" data-value="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
    }
    return `<p class="field-hint">Observe the student's response (signed, written, or demonstrated), then mark it:</p>
      <div class="btn-row" style="justify-content:center">
        <button class="btn btn-big" id="mark-correct">✔ Got it</button>
        <button class="btn btn-secondary btn-big" id="mark-incorrect">✘ Not yet</button>
      </div>`;
  }

  async function record(correct, clickedBtn) {
    const q = currentQ;
    if (clickedBtn) {
      $$(".choice-btn").forEach(b => {
        if (b.dataset.value === q.answer) b.classList.add("correct");
        else if (b === clickedBtn) b.classList.add("incorrect");
        b.disabled = true;
      });
    }
    $("#feedback").textContent = correct ? "✔️ 👏" : "🤔 ➜";
    sess.entries.push({
      questionId: q.id, questionText: q.text, correct,
      promptLevel: selectedPrompt, difficulty: q.difficulty || 2,
      expectationId: q.expectationId || null, at: new Date().toISOString()
    });
    Adaptive.update(student, q.expectationId, correct, selectedPrompt);
    await Promise.all([DB.put("sessions", sess), DB.put("students", student)]);
    phase = "feedback";
    setTimeout(render, clickedBtn ? 900 : 250);
  }

  function renderSummary() {
    sess.finished = true;
    const c = sess.entries.filter(e => e.correct).length;
    const ind = sess.entries.filter(e => e.correct && e.promptLevel === "IND").length;
    main.innerHTML = `
      <div class="runner">
        <div class="card" style="text-align:center">
          <h2>Session complete 🎉</h2>
          <p class="q-text">${c} / ${sess.entries.length} correct · ${ind} fully independent</p>
          <div class="feedback-visual">${c >= sess.entries.length * 0.7 ? "🌟🌟🌟" : c >= sess.entries.length * 0.4 ? "🌟🌟" : "🌟"}</div>
        </div>
        <div class="card">
          <h3>Mastery updates</h3>
          ${masteryTable(student)}
          <label>Session notes (behaviour, engagement, follow-ups)</label>
          <textarea id="sess-notes">${esc(sess.notes)}</textarea>
          <div class="btn-row">
            <button class="btn" id="save-sess">💾 Save &amp; finish</button>
          </div>
        </div>
      </div>`;
    $("#save-sess").onclick = async () => {
      sess.notes = $("#sess-notes").value;
      await DB.put("sessions", sess);
      visualAlert("✅ Session saved");
      navigate("sessions");
    };
  }

  render();
}

function masteryTable(student) {
  const rows = [];
  for (const sub of student.subjects) {
    for (const exp of sub.expectations) {
      const m = student.mastery[exp.id];
      if (!m) continue;
      const lab = Adaptive.masteryLabel(m.score);
      rows.push(`<tr><td>${esc(sub.name)}</td><td>${esc(exp.text.slice(0, 80))}</td>
        <td><span class="pill ${lab.cls}">${lab.text}</span></td>
        <td>${Math.round(m.score * 100)}%</td><td>${m.attempts}</td></tr>`);
    }
  }
  if (!rows.length) return `<p class="field-hint">No expectation-linked questions answered yet — link questions to IEP expectations to build mastery data.</p>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Subject</th><th>Expectation</th><th>Stage</th><th>Mastery</th><th>Attempts</th></tr></thead>
    <tbody>${rows.join("")}</tbody></table></div>`;
}

/* ---------- 6.5 Reports ---------- */

Views.reports = async (main, params) => {
  const students = await DB.all("students");
  if (params.iep) return renderIEPReport(main, params.iep);
  if (params.progress) return renderProgressReport(main, params.progress);

  main.innerHTML = `
    <div class="card">
      <h2>Reports &amp; exports</h2>
      <p class="field-hint">Standardized outputs: the Ontario-format IEP form (print or save as PDF from the print
         dialog), a progress report keyed to IEP expectations, and CSV/JSON data exports for board systems.</p>
      ${students.length ? `<label>Student</label>
      <select id="rep-student">${students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select>
      <div class="btn-row">
        <button class="btn" id="rep-iep">📄 IEP form (printable)</button>
        <button class="btn" id="rep-progress">📈 Progress report</button>
        <button class="btn btn-secondary" id="rep-csv">⬇️ Session data (CSV)</button>
        <button class="btn btn-secondary" id="rep-json">⬇️ Full record (JSON)</button>
      </div>` : `<div class="empty"><span class="empty-icon">📊</span>Add a student first.</div>`}
    </div>
    <div class="card">
      <h3>Whole-class export</h3>
      <div class="btn-row">
        <button class="btn btn-secondary" id="rep-all-json">⬇️ All data backup (JSON)</button>
      </div>
    </div>`;

  const sel = () => $("#rep-student").value;
  $("#rep-iep")?.addEventListener("click", () => navigate("reports", { iep: sel() }));
  $("#rep-progress")?.addEventListener("click", () => navigate("reports", { progress: sel() }));
  $("#rep-csv")?.addEventListener("click", async () => {
    const s = await DB.get("students", sel());
    const sessions = (await DB.all("sessions")).filter(x => x.studentId === s.id);
    const rows = [["Date", "Subject", "Question", "Correct", "PromptLevel", "Difficulty", "ExpectationId"]];
    for (const sess of sessions) for (const e of sess.entries)
      rows.push([sess.date, sess.subject, e.questionText, e.correct ? "Y" : "N", e.promptLevel, e.difficulty, e.expectationId || ""]);
    download(`${s.name.replace(/\s+/g, "_")}_sessions.csv`, toCSV(rows), "text/csv");
    visualAlert("CSV downloaded");
  });
  $("#rep-json")?.addEventListener("click", async () => {
    const s = await DB.get("students", sel());
    const sessions = (await DB.all("sessions")).filter(x => x.studentId === s.id);
    download(`${s.name.replace(/\s+/g, "_")}_record.json`,
      JSON.stringify({ format: "iep-studio/student-record@1", exportedAt: new Date().toISOString(), student: s, sessions }, null, 2));
    visualAlert("JSON downloaded");
  });
  $("#rep-all-json")?.addEventListener("click", async () => {
    const [st, se, q, ex] = await Promise.all([DB.all("students"), DB.all("sessions"), DB.all("questions"), DB.all("exchanges")]);
    download(`iep-studio-backup-${today()}.json`,
      JSON.stringify({ format: "iep-studio/backup@1", exportedAt: new Date().toISOString(), students: st, sessions: se, questions: q, exchanges: ex }, null, 2));
    visualAlert("Backup downloaded");
  });
};

async function renderIEPReport(main, id) {
  const s = await DB.get("students", id);
  const settings = await getSettings();
  if (!s) return navigate("reports");
  const acc = s.accommodations;

  main.innerHTML = `
    <div class="btn-row no-print">
      <button class="btn btn-ghost" id="back">← Reports</button>
      <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
    <div class="report-sheet">
      <h2>INDIVIDUAL EDUCATION PLAN (IEP)</h2>
      <p style="text-align:center" class="field-hint">This IEP contains ${
        s.subjects.some(x => x.program === "MOD") ? "modified expectations · " : ""}${
        s.subjects.some(x => x.program === "ALT") ? "alternative expectations · " : ""}accommodations</p>

      <div class="report-section"><h3>Student information</h3>
        <div class="report-head-grid">
          <div><strong>Name:</strong> ${esc(s.name)}</div>
          <div><strong>OEN:</strong> ${esc(s.oen) || "—"}</div>
          <div><strong>Date of birth:</strong> ${fmtDate(s.dob)}</div>
          <div><strong>Grade:</strong> ${esc(s.grade) || "—"}</div>
          <div><strong>School:</strong> ${esc(s.school) || "—"}</div>
          <div><strong>Board:</strong> ${esc(s.board) || "—"}</div>
          <div><strong>Exceptionality:</strong> ${esc(s.identification.exceptionality)}</div>
          <div><strong>IPRC:</strong> ${s.identification.formallyIdentified ? "Identified" + (s.identification.iprcDate ? " — " + fmtDate(s.identification.iprcDate) : "") : "Not formally identified"}</div>
          <div><strong>Placement:</strong> ${esc(s.identification.placement)}</div>
          <div><strong>Date of plan:</strong> ${fmtDate(s.updatedAt)}</div>
        </div></div>

      <div class="report-section"><h3>Communication profile</h3>
        <p><strong>Primary language:</strong> ${esc(s.communication.primaryLanguage)} ·
           <strong>Amplification:</strong> ${esc(s.communication.amplification) || "—"} ·
           <strong>Interpreter/intervenor:</strong> ${esc(s.communication.interpreter) || "—"}</p>
        ${s.communication.notes ? `<p>${esc(s.communication.notes)}</p>` : ""}</div>

      <div class="report-section"><h3>Areas of strength / areas of need</h3>
        <div class="report-head-grid">
          <div><strong>Strengths</strong><ul>${s.strengths.map(x => `<li>${esc(x)}</li>`).join("") || "<li>—</li>"}</ul></div>
          <div><strong>Needs</strong><ul>${s.needs.map(x => `<li>${esc(x)}</li>`).join("") || "<li>—</li>"}</ul></div>
        </div></div>

      <div class="report-section"><h3>Relevant assessment data</h3>
        ${s.assessmentData.length ? `<table><thead><tr><th>Source</th><th>Date</th><th>Summary</th></tr></thead>
        <tbody>${s.assessmentData.map(a => `<tr><td>${esc(a.source)}</td><td>${fmtDate(a.date)}</td><td>${esc(a.summary)}</td></tr>`).join("")}</tbody></table>` : "<p>—</p>"}
        ${s.healthSupport ? `<p><strong>Health support services:</strong> ${esc(s.healthSupport)}</p>` : ""}</div>

      <div class="report-section"><h3>Accommodations</h3>
        <table><thead><tr><th>Instructional</th><th>Environmental</th><th>Assessment</th></tr></thead>
          <tbody><tr>
            <td><ul>${acc.instructional.map(x => `<li>${esc(x)}</li>`).join("") || "—"}</ul></td>
            <td><ul>${acc.environmental.map(x => `<li>${esc(x)}</li>`).join("") || "—"}</ul></td>
            <td><ul>${acc.assessment.map(x => `<li>${esc(x)}</li>`).join("") || "—"}</ul></td>
          </tr></tbody></table></div>

      ${s.subjects.map(sub => `
      <div class="report-section"><h3>${esc(sub.name)} — ${sub.program} (${esc(PROGRAM_TYPES[sub.program])})</h3>
        <p><strong>Current level of achievement:</strong> ${esc(sub.currentLevel) || "—"} ·
           <strong>Annual program goal:</strong> ${esc(sub.annualGoal) || "—"}</p>
        <table><thead><tr><th>Period</th><th>Learning expectation</th><th>Teaching strategies</th><th>Assessment methods</th><th>Status</th></tr></thead>
        <tbody>${sub.expectations.map(e => `<tr>
          <td>${esc(e.term)}</td><td>${esc(e.text)}</td><td>${esc(e.strategies)}</td><td>${esc(e.assessmentMethods)}</td><td>${esc(e.status)}</td>
        </tr>`).join("")}</tbody></table></div>`).join("")}

      <div class="report-section"><h3>Human resources</h3>
        ${s.humanResources.length ? `<table><thead><tr><th>Type of service</th><th>Frequency / intensity</th><th>Location</th></tr></thead>
        <tbody>${s.humanResources.map(h => `<tr><td>${esc(h.type)}</td><td>${esc(h.frequency)}</td><td>${esc(h.location)}</td></tr>`).join("")}</tbody></table>` : "<p>—</p>"}</div>

      <div class="report-section"><h3>Transition plan</h3>
        <p><strong>Goals:</strong> ${esc(s.transition.goals) || "—"}</p>
        <p><strong>Actions:</strong> ${esc(s.transition.actions) || "—"}</p>
        <p><strong>Responsible:</strong> ${esc(s.transition.responsible) || "—"} · <strong>Timelines:</strong> ${esc(s.transition.timelines) || "—"}</p></div>

      <div class="report-section"><h3>Student-specific consultation questions &amp; responses</h3>
        ${s.intake.filter(q => q.answer).map(q => `<p><strong>${esc(q.text)}</strong><br>${esc(q.answer)}</p>`).join("") || "<p>—</p>"}</div>

      <div class="report-section"><h3>Parent/guardian and student consultation</h3>
        ${s.consultations.length ? `<table><thead><tr><th>Date</th><th>Consulted</th><th>Outcome</th></tr></thead>
        <tbody>${s.consultations.map(c => `<tr><td>${fmtDate(c.date)}</td><td>${esc(c.who)}</td><td>${esc(c.note)}</td></tr>`).join("")}</tbody></table>` : "<p>—</p>"}</div>

      <div class="sig-row">
        <div class="sig-line">Principal signature &amp; date</div>
        <div class="sig-line">Parent/guardian signature &amp; date</div>
      </div>
      <p class="field-hint" style="margin-top:1.4rem">Prepared by ${esc(settings.teacherName) || "________________"} ·
         Generated by IEP Studio on ${fmtDate(today())}. Review this document against your board's current IEP template before filing.</p>
    </div>`;
  $("#back").onclick = () => navigate("reports");
}

async function renderProgressReport(main, id) {
  const s = await DB.get("students", id);
  if (!s) return navigate("reports");
  const sessions = (await DB.all("sessions")).filter(x => x.studentId === s.id)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  /* Per-expectation trend: compare first-half vs second-half correctness. */
  const byExp = {};
  for (const sess of sessions) for (const e of sess.entries) {
    if (!e.expectationId) continue;
    (byExp[e.expectationId] = byExp[e.expectationId] || []).push(e);
  }

  const expRows = [];
  for (const sub of s.subjects) for (const exp of sub.expectations) {
    const entries = byExp[exp.id] || [];
    const m = s.mastery[exp.id];
    let trend = "—", trendCls = "trend-flat";
    if (entries.length >= 4) {
      const half = Math.floor(entries.length / 2);
      const p1 = entries.slice(0, half).filter(e => e.correct).length / half;
      const p2 = entries.slice(half).filter(e => e.correct).length / (entries.length - half);
      if (p2 - p1 > 0.1) { trend = "▲ improving"; trendCls = "trend-up"; }
      else if (p1 - p2 > 0.1) { trend = "▼ needs attention"; trendCls = "trend-down"; }
      else { trend = "◆ steady"; trendCls = "trend-flat"; }
    }
    const lab = m ? Adaptive.masteryLabel(m.score) : null;
    expRows.push(`<tr>
      <td>${esc(sub.name)} <span class="pill pill-info">${sub.program}</span></td>
      <td>${esc(exp.text) || "<em>(no text)</em>"}</td>
      <td>${esc(exp.term)}</td>
      <td>${lab ? `<span class="pill ${lab.cls}">${lab.text}</span> ${Math.round(m.score * 100)}%` : "no data"}</td>
      <td>${entries.length}</td>
      <td class="${trendCls}">${trend}</td>
      <td>${esc(exp.status)}</td></tr>`);
  }

  main.innerHTML = `
    <div class="btn-row no-print">
      <button class="btn btn-ghost" id="back">← Reports</button>
      <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn btn-secondary" id="dl-csv">⬇️ CSV</button>
    </div>
    <div class="report-sheet">
      <h2>IEP PROGRESS REPORT</h2>
      <div class="report-head-grid">
        <div><strong>Student:</strong> ${esc(s.name)}</div>
        <div><strong>Grade:</strong> ${esc(s.grade) || "—"}</div>
        <div><strong>Report date:</strong> ${fmtDate(today())}</div>
        <div><strong>Sessions on record:</strong> ${sessions.length}</div>
      </div>
      <div class="report-section"><h3>Progress on IEP learning expectations</h3>
        <div class="table-wrap"><table>
          <thead><tr><th>Subject</th><th>Expectation</th><th>Period</th><th>Mastery</th><th>Trials</th><th>Trend</th><th>Status</th></tr></thead>
          <tbody>${expRows.join("") || "<tr><td colspan='7'>No expectations recorded.</td></tr>"}</tbody>
        </table></div></div>
      <div class="report-section"><h3>Session log</h3>
        <div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>Subject</th><th>Correct</th><th>Independent</th><th>Notes</th></tr></thead>
          <tbody>${sessions.map(sess => {
            const c = sess.entries.filter(e => e.correct).length;
            const ind = sess.entries.filter(e => e.correct && e.promptLevel === "IND").length;
            return `<tr><td>${fmtDate(sess.date)}</td><td>${esc(sess.subject)}</td>
              <td>${c}/${sess.entries.length}</td><td>${ind}</td><td>${esc(sess.notes)}</td></tr>`;
          }).join("") || "<tr><td colspan='5'>No sessions.</td></tr>"}</tbody>
        </table></div></div>
    </div>`;
  $("#back").onclick = () => navigate("reports");
  $("#dl-csv").onclick = () => {
    const rows = [["Subject", "Expectation", "Period", "MasteryPct", "Trials", "Status"]];
    for (const sub of s.subjects) for (const exp of sub.expectations) {
      const m = s.mastery[exp.id];
      rows.push([sub.name, exp.text, exp.term, m ? Math.round(m.score * 100) : "", (byExp[exp.id] || []).length, exp.status]);
    }
    download(`${s.name.replace(/\s+/g, "_")}_progress.csv`, toCSV(rows), "text/csv");
    visualAlert("CSV downloaded");
  };
}

/* ---------- 6.6 PDSB exchange ---------- */

Views.pdsb = async (main) => {
  const [students, exchanges] = await Promise.all([DB.all("students"), DB.all("exchanges")]);
  const settings = await getSettings();
  exchanges.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  main.innerHTML = `
    <div class="card">
      <h2>Provincial and Demonstration Schools Branch</h2>
      <p>Ontario's Provincial Schools for the Deaf (Sir James Whitney, E.C. Drury, Robarts, and
         Centre Jules-Léger for francophone students) accept referrals through your school board.
         This module assembles a complete, standardized <strong>referral package</strong> from a student's
         IEP record — ready to print for the board's referral committee or to transmit to a
         board-configured secure endpoint.</p>
      <p class="field-hint">⚠️ PDSB has no public API. Nothing is sent anywhere unless you configure your board's
         endpoint in Settings and press Send. Always follow your board's privacy protocols (PPM, MFIPPA) for
         student records.</p>
      ${students.length ? `
      <label>Student</label>
      <select id="pdsb-student">${students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select>
      <label>Referral destination</label>
      <select id="pdsb-dest">
        ${["Sir James Whitney School for the Deaf (Belleville)",
           "E.C. Drury School for the Deaf (Milton)",
           "Robarts School for the Deaf (London)",
           "Centre Jules-Léger (Ottawa, francophone)",
           "PDSB Resource Services / Consultation"].map(d => `<option ${settings.pdsb.school === d ? "selected" : ""}>${esc(d)}</option>`).join("")}
      </select>
      <label>Reason for referral</label>
      <textarea id="pdsb-reason" placeholder="e.g., Student requires an ASL-rich learning environment with direct instruction from teachers of the Deaf…"></textarea>
      <div class="btn-row">
        <button class="btn" id="pdsb-preview">📄 Preview referral package</button>
        <button class="btn btn-secondary" id="pdsb-json">⬇️ Download package (JSON)</button>
        <button class="btn btn-secondary" id="pdsb-send" ${settings.pdsb.endpoint ? "" : "disabled"}>📤 Send to board endpoint${settings.pdsb.endpoint ? "" : " (configure in Settings)"}</button>
      </div>` : `<div class="empty"><span class="empty-icon">🏛️</span>Add a student first.</div>`}
    </div>
    <div class="card">
      <h3>Exchange log</h3>
      ${exchanges.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Student</th><th>Destination</th><th>Method</th><th>Status</th></tr></thead>
        <tbody>${exchanges.map(x => `<tr><td>${fmtDate(x.date)}</td><td>${esc(x.studentName)}</td>
          <td>${esc(x.destination)}</td><td>${esc(x.method)}</td>
          <td><span class="pill ${x.status === "sent" ? "pill-ok" : x.status === "failed" ? "pill-danger" : "pill-info"}">${esc(x.status)}</span></td></tr>`).join("")}</tbody>
      </table></div>` : `<p class="field-hint">No exchanges recorded yet. Every package you generate or send is logged here for your records.</p>`}
    </div>`;

  if (!students.length) return;

  async function buildPackage() {
    const s = await DB.get("students", $("#pdsb-student").value);
    const sessions = (await DB.all("sessions")).filter(x => x.studentId === s.id);
    return {
      format: "on-pdsb-referral@1",
      generatedAt: new Date().toISOString(),
      destination: $("#pdsb-dest").value,
      reasonForReferral: $("#pdsb-reason").value,
      referringTeacher: settings.teacherName,
      referringSchool: settings.school,
      referringBoard: settings.board,
      student: {
        name: s.name, oen: s.oen, dob: s.dob, grade: s.grade,
        school: s.school, board: s.board,
        identification: s.identification,
        communicationProfile: s.communication,
        strengths: s.strengths, needs: s.needs,
        assessmentData: s.assessmentData,
        healthSupport: s.healthSupport,
        accommodations: s.accommodations,
        program: s.subjects,
        humanResources: s.humanResources,
        transitionPlan: s.transition,
        consultationRecord: s.consultations,
        intakeResponses: s.intake.filter(q => q.answer)
      },
      progressSummary: {
        sessionCount: sessions.length,
        mastery: s.mastery
      }
    };
  }

  async function logExchange(pkg, method, status) {
    await DB.put("exchanges", {
      id: uid(), date: today(), studentName: pkg.student.name,
      destination: pkg.destination, method, status
    });
  }

  $("#pdsb-preview").onclick = async () => {
    const pkg = await buildPackage();
    await logExchange(pkg, "preview/print", "generated");
    openModal("Referral package — " + esc(pkg.student.name), `
      <div class="report-sheet" style="border:none;padding:0">
        <h2 style="font-size:1.1rem">REFERRAL — PROVINCIAL AND DEMONSTRATION SCHOOLS BRANCH</h2>
        <p><strong>To:</strong> ${esc(pkg.destination)}<br>
           <strong>From:</strong> ${esc(pkg.referringTeacher || "—")}, ${esc(pkg.referringSchool || "—")}, ${esc(pkg.referringBoard || "—")}<br>
           <strong>Date:</strong> ${fmtDate(today())}</p>
        <div class="report-section"><h3>Student</h3>
          <p>${esc(pkg.student.name)} · OEN ${esc(pkg.student.oen) || "—"} · DOB ${fmtDate(pkg.student.dob)} · Grade ${esc(pkg.student.grade) || "—"}</p>
          <p><strong>Exceptionality:</strong> ${esc(pkg.student.identification.exceptionality)}<br>
             <strong>Placement:</strong> ${esc(pkg.student.identification.placement)}<br>
             <strong>Primary language:</strong> ${esc(pkg.student.communicationProfile.primaryLanguage)}</p></div>
        <div class="report-section"><h3>Reason for referral</h3><p>${esc(pkg.reasonForReferral) || "—"}</p></div>
        <div class="report-section"><h3>Strengths / needs</h3>
          <p><strong>Strengths:</strong> ${pkg.student.strengths.map(esc).join("; ") || "—"}<br>
             <strong>Needs:</strong> ${pkg.student.needs.map(esc).join("; ") || "—"}</p></div>
        <div class="report-section"><h3>Assessment data</h3>
          ${pkg.student.assessmentData.map(a => `<p>${esc(a.source)} (${fmtDate(a.date)}): ${esc(a.summary)}</p>`).join("") || "<p>—</p>"}</div>
        <p class="field-hint">Attach: current IEP (print from Reports), recent report card, audiological report,
           IPRC statement of decision if applicable, and parent/guardian consent forms per board policy.</p>
      </div>
      <div class="btn-row no-print"><button class="btn" onclick="window.print()">🖨️ Print</button></div>`);
    navigateSoonRefresh();
  };

  $("#pdsb-json").onclick = async () => {
    const pkg = await buildPackage();
    await logExchange(pkg, "json-download", "generated");
    download(`PDSB_referral_${pkg.student.name.replace(/\s+/g, "_")}_${today()}.json`, JSON.stringify(pkg, null, 2));
    visualAlert("Referral package downloaded");
    navigateSoonRefresh();
  };

  $("#pdsb-send").onclick = async () => {
    const pkg = await buildPackage();
    if (!confirm(`Send ${pkg.student.name}'s referral package to your board's configured endpoint?\n\n${settings.pdsb.endpoint}\n\nMake sure parent/guardian consent is on file.`)) return;
    try {
      const res = await fetch(settings.pdsb.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(settings.pdsb.apiKey ? { "Authorization": "Bearer " + settings.pdsb.apiKey } : {})
        },
        body: JSON.stringify(pkg)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      await logExchange(pkg, "endpoint", "sent");
      visualAlert("✅ Package sent to board endpoint");
    } catch (err) {
      await logExchange(pkg, "endpoint", "failed");
      visualAlert("❌ Send failed (" + err.message + ") — package logged, try the JSON download instead", "danger");
    }
    navigateSoonRefresh();
  };

  function navigateSoonRefresh() { setTimeout(() => { if (currentView === "pdsb") navigate("pdsb"); }, 600); }
};

/* ---------- 6.7 Settings ---------- */

Views.settings = async (main) => {
  const settings = await getSettings();
  main.innerHTML = `
    <div class="card">
      <h2>Settings</h2>
      <label>Your name (appears on reports)</label>
      <input id="set-name" type="text" value="${esc(settings.teacherName)}">
      <div class="grid grid-2">
        <div><label>School</label><input id="set-school" type="text" value="${esc(settings.school)}"></div>
        <div><label>School board</label><input id="set-board" type="text" value="${esc(settings.board)}"></div>
      </div>
    </div>
    <div class="card">
      <h3>PDSB / board transmission endpoint</h3>
      <p class="field-hint">Optional. If your board provides a secure intake endpoint for referral packages,
         enter it here. Leave blank to use print/JSON download only.</p>
      <label>Default destination school</label>
      <input id="set-pdsb-school" type="text" value="${esc(settings.pdsb.school)}" placeholder="e.g., E.C. Drury School for the Deaf (Milton)">
      <label>Endpoint URL (HTTPS)</label>
      <input id="set-pdsb-endpoint" type="url" value="${esc(settings.pdsb.endpoint)}" placeholder="https://board.example.ca/api/pdsb-referrals">
      <label>API key / token</label>
      <input id="set-pdsb-key" type="password" value="${esc(settings.pdsb.apiKey)}">
    </div>
    <div class="card">
      <h3>Data</h3>
      <p class="field-hint">All data lives in this browser (IndexedDB) and works offline. Use Reports → backup
         for a portable copy, and Restore to load one.</p>
      <div class="btn-row">
        <label class="btn btn-secondary" style="margin:0">📥 Restore backup<input type="file" id="restore-file" accept=".json" hidden></label>
        <button class="btn btn-danger" id="wipe">🗑️ Erase all data</button>
      </div>
    </div>
    <div class="btn-row"><button class="btn btn-big" id="save-settings">💾 Save settings</button></div>`;

  $("#save-settings").onclick = async () => {
    await DB.put("kv", {
      id: "settings",
      teacherName: $("#set-name").value.trim(),
      school: $("#set-school").value.trim(),
      board: $("#set-board").value.trim(),
      pdsb: {
        school: $("#set-pdsb-school").value.trim(),
        endpoint: $("#set-pdsb-endpoint").value.trim(),
        apiKey: $("#set-pdsb-key").value.trim()
      }
    });
    visualAlert("✅ Settings saved");
  };

  $("#restore-file").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.format !== "iep-studio/backup@1") throw new Error("Not an IEP Studio backup file");
      for (const st of data.students || []) await DB.put("students", st);
      for (const se of data.sessions || []) await DB.put("sessions", se);
      for (const q of data.questions || []) await DB.put("questions", q);
      for (const x of data.exchanges || []) await DB.put("exchanges", x);
      visualAlert("✅ Backup restored");
      navigate("dashboard");
    } catch (err) {
      visualAlert("❌ Restore failed: " + err.message, "danger");
    }
  };

  $("#wipe").onclick = async () => {
    if (!confirm("Erase ALL students, sessions, questions and logs from this device? Download a backup first!")) return;
    if (!confirm("Really erase everything? This cannot be undone.")) return;
    for (const store of ["students", "questions", "sessions", "exchanges", "kv"])
      await tx(store, "readwrite", s => s.clear());
    visualAlert("All data erased", "warn");
    navigate("dashboard");
  };
};

/* ======================= 7. App bootstrap =============================== */

function updateNetStatus() {
  const el = $("#net-status");
  if (navigator.onLine) { el.textContent = "● Online"; el.className = "pill pill-ok"; }
  else { el.textContent = "● Offline — everything still works"; el.className = "pill pill-warn"; }
}
window.addEventListener("online", () => { updateNetStatus(); visualAlert("Back online"); });
window.addEventListener("offline", () => { updateNetStatus(); visualAlert("Offline — your work keeps saving locally", "warn"); });

let deferredInstall = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstall = e;
  const btn = $("#install-btn");
  btn.hidden = false;
  btn.onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice; btn.hidden = true; };
});

document.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  updateNetStatus();
  $$(".nav-btn").forEach(b => b.onclick = () => navigate(b.dataset.view));
  navigate("dashboard");
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {/* offline-first is best-effort */});
  }
});
