/* Pathworking — pronunciation and speech.
   Uses the browser's built-in speech engine (Web Speech API), so it works offline and needs no
   account. Names are respelled phonetically before they are spoken, following the usual Western
   (Golden Dawn / Ashkenazi-influenced) pronunciation taught in the sources; "kh" is the guttural
   ch of Scottish "loch", "tz" as in "its", stress on the last syllable in most Hebrew words. */

/* Phonetic respellings. Syllables are separated by hyphens; the stressed syllable is written in
   capitals for the eye, but speech receives lowercase so the engine does not read initials. */
export const PRONOUNCE = {
  // Sephiroth
  "Kether": "KEH-ter", "Chokmah": "KHOKH-mah", "Binah": "bee-NAH", "Daath": "DAH-at", "Chesed": "KHEH-sed", "Geburah": "geh-voo-RAH",
  "Tiphareth": "tif-AH-ret", "Netzach": "NET-zakh", "Hod": "HODE", "Yesod": "yeh-SODE", "Malkuth": "mal-KOOT",
  // Divine Names
  "Eheieh": "eh-heh-YEH", "Yah (YHVH)": "YAH", "Yah": "YAH", "YHVH": "yode-HAY-vahv-HAY", "YHVH Elohim": "yode-HAY-vahv-HAY el-oh-HEEM", "El": "EL",
  "Elohim Gibor": "el-oh-HEEM gi-BOR", "YHVH Eloah va-Daath": "yode-HAY-vahv-HAY el-OH-ah veh-DAH-at", "YHVH Tzabaoth": "yode-HAY-vahv-HAY tzah-bah-OTE",
  "Elohim Tzabaoth": "el-oh-HEEM tzah-bah-OTE", "Shaddai El Chai": "shah-DYE el KHYE", "Adonai ha-Aretz": "ah-doh-NYE hah-AH-retz", "Adonai": "ah-doh-NYE",
  "AGLA": "ah-gah-LAH", "Elohim": "el-oh-HEEM", "YHShVH": "yeh-heh-SHOO-ah", "Eloah": "el-OH-ah",
  "Jehovah": "yeh-hoh-VAH", "Jehovah Elohim": "yeh-hoh-VAH el-oh-HEEM", "Jehovah Aloah va-Daath": "yeh-hoh-VAH ah-LOH-ah vah-DAH-at", "Jehovah Aloah va Daath": "yeh-hoh-VAH ah-LOH-ah vah-DAH-at",
  // Archangels
  "Metatron": "meh-tah-TRON", "Raziel": "rah-zee-EL", "Tzaphkiel": "tzaf-kee-EL", "Tzadkiel": "tzad-kee-EL", "Kamael": "kah-mah-EL", "Raphael": "rah-fah-EL",
  "Haniel": "hah-nee-EL", "Michael": "mee-khah-EL", "Gabriel": "gahv-ree-EL", "Sandalphon": "san-dal-FONE", "Auriel": "oh-ree-EL", "Uriel": "oo-ree-EL",
  // Choirs
  "Chaioth ha-Qadesh": "khah-YOTE hah-KAH-desh", "Auphanim": "oh-fah-NEEM", "Aralim": "ah-rah-LEEM", "Chashmalim": "khash-mah-LEEM", "Seraphim": "seh-rah-FEEM",
  "Malakim": "mah-lah-KHEEM", "Beni Elohim": "beh-NAY el-oh-HEEM", "Kerubim": "keh-roo-BEEM", "Ashim": "ah-SHEEM",
  // Letters
  "Aleph": "AH-lef", "Beth": "BET", "Gimel": "GEE-mel", "Daleth": "DAH-let", "Heh": "HAY", "Vav": "VAHV", "Zayin": "ZAH-yin", "Cheth": "KHET", "Teth": "TET",
  "Yod": "YODE", "Kaph": "KAHF", "Lamed": "LAH-med", "Mem": "MEM", "Nun": "NOON", "Samekh": "SAH-mekh", "Ayin": "AH-yin", "Peh": "PAY", "Tzaddi": "TZAH-dee",
  "Qoph": "KOFE", "Resh": "RAYSH", "Shin": "SHEEN", "Tav": "TAHV",
  // The Kabbalistic Cross and ritual words
  "Ateh": "ah-TAH", "ve-Geburah": "veh-geh-voo-RAH", "ve-Gedulah": "veh-geh-doo-LAH", "le-Olam": "leh-oh-LAHM", "Amen": "ah-MEN", "le-Olam, Amen": "leh-oh-LAHM, ah-MEN",
  // Worlds, shells and other terms
  "Atziluth": "ah-tzee-LOOT", "Briah": "bree-AH", "Yetzirah": "yeh-tzee-RAH", "Assiah": "ah-see-AH",
  "Nogah": "NOH-gah", "Esh Mitlakachat": "ESH mit-lah-KAH-khat", "Anan Gadol": "ah-NAHN gah-DOLE", "Ruach Se'arah": "ROO-akh seh-ah-RAH",
  "Qliphoth": "klee-FOTE", "Sephirah": "seh-fee-RAH", "Sephiroth": "seh-fee-ROTE", "Nechushtan": "neh-khoosh-TAHN", "Shem HaMephorash": "SHEM hah-meh-foh-RASH",
  "Paroketh": "pah-ROH-ket", "Shekinah": "sheh-khee-NAH", "Partzuf": "par-TZOOF", "Chiah": "khee-AH", "Neshamah": "neh-shah-MAH", "Ruach": "ROO-akh", "Nephesh": "NEH-fesh",
  "Yechidah": "yeh-khee-DAH", "Thaumiel": "tah-oo-mee-EL", "Samael": "sah-mah-EL", "Lilith": "LEE-lit", "Gamaliel": "gah-mah-lee-EL",
};

/* Angelic names of the 72 and anything not in the table: a respelling by rule. */
export function phonetic(name) {
  if (!name) return "";
  if (PRONOUNCE[name]) return PRONOUNCE[name];
  // compound: try each word
  if (/[\s,·]/.test(name)) return name.split(/[\s,·]+/).map(w => PRONOUNCE[w] || ruleRespell(w)).join(" ");
  return ruleRespell(name);
}
function ruleRespell(w) {
  let s = w.replace(/[^A-Za-z'-]/g, "").toLowerCase().replace(/ch/g, "kh").replace(/ph/g, "f").replace(/th/g, "t");
  if (!s) return w;
  // the angelic suffixes first
  let suffix = "";
  for (const [re, out] of [[/iah$/, "ee-AH"], [/ael$/, "ah-EL"], [/iel$/, "ee-EL"], [/uel$/, "oo-EL"], [/el$/, "EL"]]) {
    if (re.test(s)) { s = s.replace(re, ""); suffix = out; break; }
  }
  // a single consonant left at the end of the stem opens the suffix: yel + ee-EL → yeh-lee-EL
  const tail = s.match(/[aeiouy][a-z]*?(kh|[bcdfghjklmnpqrstvwxz])$/);
  if (suffix && tail) { s = s.slice(0, -tail[1].length); suffix = tail[1] + suffix.toLowerCase(); }
  s = s.replace(/'/g, "-");
  // split into syllables: a vowel followed by consonant(s) and another vowel breaks after the first consonant
  s = s.replace(/([aeiouy])([bcdfghjklmnpqrstvwxz]+)(?=[aeiouy])/g, (m, v, c) => c.length > 1 ? v + c[0] + "-" + c.slice(1) : v + "-" + c);
  // open the vowels so the engine says them as Hebrew does
  s = s.split("-").map(syl => syl.replace(/ai/, "eye").replace(/ei/, "ay").replace(/ou/, "oo")
    .replace(/([bcdfghjklmnpqrstvwxz]*)a([bcdfghjklmnpqrstvwxz]*)$/, "$1ah$2").replace(/([bcdfghjklmnpqrstvwxz]*)e([bcdfghjklmnpqrstvwxz]*)$/, "$1eh$2")
    .replace(/([bcdfghjklmnpqrstvwxz]*)i([bcdfghjklmnpqrstvwxz]*)$/, "$1ee$2").replace(/([bcdfghjklmnpqrstvwxz]*)o([bcdfghjklmnpqrstvwxz]*)$/, "$1oh$2")
    .replace(/([bcdfghjklmnpqrstvwxz]*)u([bcdfghjklmnpqrstvwxz]*)$/, "$1oo$2")).filter(Boolean).join("-");
  return [s, suffix].filter(Boolean).join("-").replace(/--+/g, "-");
}

/* Replace known names inside a passage of prose so the engine says them correctly. */
const NAME_RE = new RegExp("\\b(" + Object.keys(PRONOUNCE).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b", "g");
export function readable(text) {
  return String(text).replace(NAME_RE, m => PRONOUNCE[m].toLowerCase().replace(/-/g, " "));
}

/* ─── the engine ─────────────────────────────────────────────────────────── */
export const speech = {
  supported: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
  settings: { voice: "", rate: 0.9, pitch: 1, vibrate: false },
  voices() { return this.supported ? speechSynthesis.getVoices().filter(v => /^en|^he/i.test(v.lang)) : []; },
  pick() {
    const vs = this.voices();
    return vs.find(v => v.name === this.settings.voice) || vs.find(v => /^en/i.test(v.lang) && v.default) || vs.find(v => /^en/i.test(v.lang)) || null;
  },
  stop() { if (this.supported) speechSynthesis.cancel(); },
  /* say a Name: phonetic respelling; in "vibrate" mode each syllable is drawn out with a pause */
  sayName(name, { vibrate = this.settings.vibrate } = {}) {
    let text = phonetic(name).toLowerCase();
    if (vibrate) text = text.replace(/[-\s,]+/g, ", ");
    else text = text.replace(/-/g, " ");
    this.say(text, { rate: vibrate ? Math.min(this.settings.rate, 0.55) : this.settings.rate, pitch: vibrate ? 0.8 : this.settings.pitch });
  },
  /* read a passage: names respelled inline */
  read(text, opts = {}) { return this.say(readable(text), opts); },
  say(text, { rate = this.settings.rate, pitch = this.settings.pitch, onend } = {}) {
    if (!this.supported || !text) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = this.pick(); if (v) u.voice = v;
    u.lang = v?.lang || "en-US"; u.rate = rate; u.pitch = pitch;
    if (onend) u.onend = onend;
    speechSynthesis.speak(u);
    return true;
  },
  speaking() { return this.supported && speechSynthesis.speaking; },
};

/* HTML for a small speaker button. `name` is what will be pronounced. */
export function sayBtn(name, { label = "", cls = "" } = {}) {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  return `<button type="button" class="say ${cls}" data-say="${esc(name)}" title="Hear: ${esc(phonetic(name))}" aria-label="Pronounce ${esc(name)}">🔊${label ? " " + esc(label) : ""}</button>`;
}
