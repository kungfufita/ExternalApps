/* Pathworking — reference data
   Correspondences follow the Hermetic (Golden Dawn) attribution of the Tree of Life:
   Sephiroth, the 22 paths (Sepher Yetzirah lettering, 32 Paths of Wisdom), and the
   Shem HaMephorash — the 72 Names derived from Exodus 14:19–21.
   Layout coordinates are in "tree units": x = pillar, y = height (0 = Malkuth, 8 = Kether). */

export const PILLAR = { left: -1.65, mid: 0, right: 1.65 }; // viewer's right = Pillar of Mercy

export const SEPHIROTH = [
  { id: 1,  key: "kether",    name: "Kether",    hebrew: "כתר",   meaning: "Crown",
    pillar: "mid",   y: 8, world: "Atziluth",
    godName: "Eheieh", godHebrew: "אהיה", archangel: "Metatron", choir: "Chaioth ha-Qadesh",
    planet: "Primum Mobile", intelligence: "Admirable (Hidden) Intelligence",
    color: "#ffffff", glow: "#fff7d6", colorName: "white brilliance", textDark: true,
    note: "The source. Undifferentiated light before any form. The energy that descends the Lightning Flash begins here." },
  { id: 2,  key: "chokmah",   name: "Chokmah",   hebrew: "חכמה",  meaning: "Wisdom",
    pillar: "right", y: 7, world: "Briah",
    godName: "Yah (YHVH)", godHebrew: "יה", archangel: "Raziel", choir: "Auphanim",
    planet: "Zodiac / Fixed Stars", intelligence: "Illuminating Intelligence",
    color: "#a9afb8", glow: "#d9dde3", colorName: "grey", textDark: true,
    note: "Pure dynamic force. The head of the Pillar of Mercy." },
  { id: 3,  key: "binah",     name: "Binah",     hebrew: "בינה",  meaning: "Understanding",
    pillar: "left",  y: 7, world: "Briah",
    godName: "YHVH Elohim", godHebrew: "יהוה אלהים", archangel: "Tzaphkiel", choir: "Aralim",
    planet: "Saturn", intelligence: "Sanctifying Intelligence",
    color: "#2a2b3a", glow: "#6b6d8a", colorName: "black", textDark: false,
    note: "Form that receives force. The head of the Pillar of Severity. Below Binah lies the Abyss." },
  { id: 0,  key: "daath",     name: "Daath",     hebrew: "דעת",   meaning: "Knowledge",
    pillar: "mid",   y: 6, world: "Abyss", hidden: true,
    godName: "—", godHebrew: "", archangel: "—", choir: "—",
    planet: "—", intelligence: "The hidden Sephirah; the gate across the Abyss",
    color: "#b9a6e6", glow: "#d7c9f5", colorName: "lavender", textDark: true,
    note: "Not counted among the ten. Where the Lightning Flash leaps the Abyss from Binah to Chesed." },
  { id: 4,  key: "chesed",    name: "Chesed",    hebrew: "חסד",   meaning: "Mercy",
    pillar: "right", y: 5, world: "Yetzirah",
    godName: "El", godHebrew: "אל", archangel: "Tzadkiel", choir: "Chashmalim",
    planet: "Jupiter", intelligence: "Measuring (Cohesive) Intelligence",
    color: "#2f6fd6", glow: "#7fa6ee", colorName: "blue", textDark: false,
    note: "Expansive, building, generous force. First Sephirah below the Abyss." },
  { id: 5,  key: "geburah",   name: "Geburah",   hebrew: "גבורה", meaning: "Severity",
    pillar: "left",  y: 5, world: "Yetzirah",
    godName: "Elohim Gibor", godHebrew: "אלהים גבור", archangel: "Kamael", choir: "Seraphim",
    planet: "Mars", intelligence: "Radical Intelligence",
    color: "#d6342f", glow: "#f08a86", colorName: "scarlet red", textDark: false,
    note: "Strength that cuts away what is unnecessary. Balances Chesed." },
  { id: 6,  key: "tiphareth", name: "Tiphareth", hebrew: "תפארת", meaning: "Beauty",
    pillar: "mid",   y: 4, world: "Yetzirah",
    godName: "YHVH Eloah va-Daath", godHebrew: "יהוה אלוה ודעת", archangel: "Raphael", choir: "Malakim",
    planet: "Sun", intelligence: "Intelligence of the Mediating Influence",
    color: "#f2d14b", glow: "#fbe99a", colorName: "gold (yellow)", textDark: true,
    note: "The heart of the Tree, where above and below meet in harmony." },
  { id: 7,  key: "netzach",   name: "Netzach",   hebrew: "נצח",   meaning: "Victory",
    pillar: "right", y: 3, world: "Yetzirah",
    godName: "YHVH Tzabaoth", godHebrew: "יהוה צבאות", archangel: "Haniel", choir: "Elohim",
    planet: "Venus", intelligence: "Occult Intelligence",
    color: "#3fae5c", glow: "#8dd79f", colorName: "emerald green", textDark: false,
    note: "Feeling, desire, the arts and nature-forces." },
  { id: 8,  key: "hod",       name: "Hod",       hebrew: "הוד",   meaning: "Splendour",
    pillar: "left",  y: 3, world: "Yetzirah",
    godName: "Elohim Tzabaoth", godHebrew: "אלהים צבאות", archangel: "Michael", choir: "Beni Elohim",
    planet: "Mercury", intelligence: "Absolute (Perfect) Intelligence",
    color: "#ef8a2b", glow: "#f7bd86", colorName: "orange", textDark: true,
    note: "Intellect, language, ritual form. Balances Netzach." },
  { id: 9,  key: "yesod",     name: "Yesod",     hebrew: "יסוד",  meaning: "Foundation",
    pillar: "mid",   y: 2, world: "Yetzirah",
    godName: "Shaddai El Chai", godHebrew: "שדי אל חי", archangel: "Gabriel", choir: "Kerubim",
    planet: "Moon", intelligence: "Pure Intelligence",
    color: "#7d4fd1", glow: "#b69af0", colorName: "violet", textDark: false,
    note: "The astral foundation and the images that give form to Malkuth." },
  { id: 10, key: "malkuth",   name: "Malkuth",   hebrew: "מלכות", meaning: "Kingdom",
    pillar: "mid",   y: 0, world: "Assiah",
    godName: "Adonai ha-Aretz", godHebrew: "אדני הארץ", archangel: "Sandalphon", choir: "Ashim",
    planet: "Earth (the Elements)", intelligence: "Resplendent Intelligence",
    color: "#8a7a3a", glow: "#c9b36a", colorName: "citrine, olive, russet and black", textDark: false, quartered: ["#c7b94a", "#6b7a2a", "#8b4a2a", "#1b1b22"],
    note: "The material world; the Serpent of Wisdom begins its ascent from here." },
];

export const SEPH_BY_KEY = Object.fromEntries(SEPHIROTH.map(s => [s.key, s]));
export const SEPH_BY_ID = Object.fromEntries(SEPHIROTH.map(s => [s.id, s]));

export function sephPos(s) {
  return { x: PILLAR[s.pillar], y: s.y };
}

/* The 22 paths — Golden Dawn numbering (11–32).
   from/to are Sephirah keys; serpent = { t, z } gives where the Serpent of Wisdom
   crosses the path (t = fraction from "from" to "to"; z = depth, + is toward viewer). */
export const PATHS = [
  { n: 11, letter: "א", name: "Aleph",  lmeaning: "Ox",            from: "kether",    to: "chokmah",   attr: "Air",         glyph: "△",  tarot: "0 · The Fool",            intelligence: "Scintillating Intelligence",                 color: "#f7f3b0", colorName: "pale yellow", serpent: { t: 0.5,  z:  0.45 } },
  { n: 12, letter: "ב", name: "Beth",   lmeaning: "House",         from: "kether",    to: "binah",     attr: "Mercury",     glyph: "☿",  tarot: "I · The Magician",        intelligence: "Intelligence of Transparency",              color: "#f3e03a", colorName: "yellow", serpent: { t: 0.5,  z: -0.45 } },
  { n: 13, letter: "ג", name: "Gimel",  lmeaning: "Camel",         from: "kether",    to: "tiphareth", attr: "Moon",        glyph: "☽",  tarot: "II · The High Priestess", intelligence: "Uniting Intelligence",                      color: "#5b8df0", colorName: "blue", serpent: { t: 0.38, z:  0.55 } },
  { n: 14, letter: "ד", name: "Daleth", lmeaning: "Door",          from: "chokmah",   to: "binah",     attr: "Venus",       glyph: "♀",  tarot: "III · The Empress",       intelligence: "Illuminating Intelligence",                 color: "#3fcf7a", colorName: "emerald green", serpent: { t: 0.5,  z: -0.55 } },
  { n: 15, letter: "ה", name: "Heh",    lmeaning: "Window",        from: "chokmah",   to: "tiphareth", attr: "Aries",       glyph: "♈",  tarot: "IV · The Emperor",        intelligence: "Constituting Intelligence",                 color: "#f03a3a", colorName: "scarlet", serpent: { t: 0.5,  z:  0.4 } },
  { n: 16, letter: "ו", name: "Vav",    lmeaning: "Nail",          from: "chokmah",   to: "chesed",    attr: "Taurus",      glyph: "♉",  tarot: "V · The Hierophant",      intelligence: "Triumphal (Eternal) Intelligence",          color: "#f0633a", colorName: "red-orange", serpent: { t: 0.5,  z: -0.3 } },
  { n: 17, letter: "ז", name: "Zayin",  lmeaning: "Sword",         from: "binah",     to: "tiphareth", attr: "Gemini",      glyph: "♊",  tarot: "VI · The Lovers",         intelligence: "Disposing Intelligence",                    color: "#f59a2a", colorName: "orange", serpent: { t: 0.5,  z:  0.4 } },
  { n: 18, letter: "ח", name: "Cheth",  lmeaning: "Fence",         from: "binah",     to: "geburah",   attr: "Cancer",      glyph: "♋",  tarot: "VII · The Chariot",       intelligence: "Intelligence of the House of Influence",    color: "#f0b02a", colorName: "amber", serpent: { t: 0.5,  z: -0.3 } },
  { n: 19, letter: "ט", name: "Teth",   lmeaning: "Serpent",       from: "chesed",    to: "geburah",   attr: "Leo",         glyph: "♌",  tarot: "VIII · Strength",         intelligence: "Intelligence of the Secret of Spiritual Activities", color: "#d9e03a", colorName: "greenish yellow", serpent: { t: 0.5,  z:  0.5 } },
  { n: 20, letter: "י", name: "Yod",    lmeaning: "Hand",          from: "chesed",    to: "tiphareth", attr: "Virgo",       glyph: "♍",  tarot: "IX · The Hermit",         intelligence: "Intelligence of Will",                      color: "#a7e03a", colorName: "yellowish green", serpent: { t: 0.5,  z: -0.35 } },
  { n: 21, letter: "כ", name: "Kaph",   lmeaning: "Palm",          from: "chesed",    to: "netzach",   attr: "Jupiter",     glyph: "♃",  tarot: "X · Wheel of Fortune",    intelligence: "Intelligence of Conciliation",              color: "#8f5be8", colorName: "violet", serpent: { t: 0.5,  z:  0.35 } },
  { n: 22, letter: "ל", name: "Lamed",  lmeaning: "Ox-goad",       from: "geburah",   to: "tiphareth", attr: "Libra",       glyph: "♎",  tarot: "XI · Justice",            intelligence: "Faithful Intelligence",                     color: "#3fcf7a", colorName: "emerald green", serpent: { t: 0.5,  z: -0.35 } },
  { n: 23, letter: "מ", name: "Mem",    lmeaning: "Water",         from: "geburah",   to: "hod",       attr: "Water",       glyph: "▽",  tarot: "XII · The Hanged Man",    intelligence: "Stable Intelligence",                       color: "#2f4fd6", colorName: "deep blue", serpent: { t: 0.5,  z:  0.35 } },
  { n: 24, letter: "נ", name: "Nun",    lmeaning: "Fish",          from: "tiphareth", to: "netzach",   attr: "Scorpio",     glyph: "♏",  tarot: "XIII · Death",            intelligence: "Imaginative Intelligence",                  color: "#2fb6b0", colorName: "blue-green", serpent: { t: 0.5,  z: -0.35 } },
  { n: 25, letter: "ס", name: "Samekh", lmeaning: "Prop",          from: "tiphareth", to: "yesod",     attr: "Sagittarius", glyph: "♐",  tarot: "XIV · Temperance",        intelligence: "Intelligence of Probation",                 color: "#4f7fe8", colorName: "blue", serpent: { t: 0.3,  z:  0.5 } },
  { n: 26, letter: "ע", name: "Ayin",   lmeaning: "Eye",           from: "tiphareth", to: "hod",       attr: "Capricorn",   glyph: "♑",  tarot: "XV · The Devil",          intelligence: "Renovating Intelligence",                   color: "#4a3fa6", colorName: "indigo", serpent: { t: 0.5,  z: -0.35 } },
  { n: 27, letter: "פ", name: "Peh",    lmeaning: "Mouth",         from: "netzach",   to: "hod",       attr: "Mars",        glyph: "♂",  tarot: "XVI · The Tower",         intelligence: "Exciting Intelligence",                     color: "#f03a3a", colorName: "scarlet", serpent: { t: 0.68, z:  0.4 } },
  { n: 28, letter: "צ", name: "Tzaddi", lmeaning: "Fish-hook",     from: "netzach",   to: "yesod",     attr: "Aquarius",    glyph: "♒",  tarot: "XVII · The Star",         intelligence: "Natural Intelligence",                      color: "#9a6ff0", colorName: "violet", serpent: { t: 0.5,  z: -0.35 } },
  { n: 29, letter: "ק", name: "Qoph",   lmeaning: "Back of head",  from: "netzach",   to: "malkuth",   attr: "Pisces",      glyph: "♓",  tarot: "XVIII · The Moon",        intelligence: "Corporeal Intelligence",                    color: "#d63a8a", colorName: "crimson", serpent: { t: 0.5,  z:  0.4 } },
  { n: 30, letter: "ר", name: "Resh",   lmeaning: "Head",          from: "hod",       to: "yesod",     attr: "Sun",         glyph: "☉",  tarot: "XIX · The Sun",           intelligence: "Collecting Intelligence",                   color: "#f59a2a", colorName: "orange", serpent: { t: 0.5,  z: -0.35 } },
  { n: 31, letter: "ש", name: "Shin",   lmeaning: "Tooth",         from: "hod",       to: "malkuth",   attr: "Fire",        glyph: "△",  tarot: "XX · Judgement",          intelligence: "Perpetual Intelligence",                    color: "#ff6a2a", colorName: "glowing scarlet-orange", serpent: { t: 0.5,  z:  0.4 } },
  { n: 32, letter: "ת", name: "Tav",    lmeaning: "Cross / Mark",  from: "yesod",     to: "malkuth",   attr: "Saturn / Earth", glyph: "♄", tarot: "XXI · The Universe",     intelligence: "Administrative Intelligence",               color: "#5b4fc9", colorName: "indigo", serpent: { t: 0.5,  z:  0.5 } },
];

export const PATH_BY_N = Object.fromEntries(PATHS.map(p => [p.n, p]));

export function pathBetween(a, b) {
  return PATHS.find(p => (p.from === a && p.to === b) || (p.from === b && p.to === a)) || null;
}

/* Descent sequences. Each step: a Sephirah key. Segments without a path (Binah→Chesed
   across the Abyss) are drawn as the Flash leaping through Daath. */
export const DESCENTS = {
  flash: {
    name: "Lightning Flash",
    subtitle: "Kether → Malkuth · the descent of the Divine Light that opens every channel",
    steps: ["kether", "chokmah", "binah", "daath", "chesed", "geburah", "tiphareth", "netzach", "hod", "yesod", "malkuth"],
  },
  middle: {
    name: "Middle Pillar",
    subtitle: "Kether → Malkuth down the Pillar of Equilibrium",
    steps: ["kether", "daath", "tiphareth", "yesod", "malkuth"],
  },
};

/* The Serpent of Wisdom (Nechushtan) climbs the 22 paths in reverse order, 32 → 11. */
export const SERPENT_ORDER = PATHS.map(p => p.n).sort((a, b) => b - a);

/* ─── Shem HaMephorash — the 72 Names ───────────────────────────────────────
   Exodus 14:19, 14:20, 14:21 each contain exactly 72 letters. Name i is formed from
   letter i of verse 19, letter (73 − i) of verse 20 (read backwards), and letter i of
   verse 21. The three verses below are consonantal text; spaces are for display only. */
export const SHEM_VERSES = {
  19: "ויסע מלאך האלהים ההלך לפני מחנה ישראל וילך מאחריהם ויסע עמוד הענן מפניהם ויעמד מאחריהם",
  20: "ויבא בין מחנה מצרים ובין מחנה ישראל ויהי הענן והחשך ויאר את הלילה ולא קרב זה אל זה כל הלילה",
  21: "ויט משה את ידו על הים ויולך יהוה את הים ברוח קדים עזה כל הלילה וישם את הים לחרבה ויבקעו המים",
};

const FINALS = { "כ": "ך", "מ": "ם", "נ": "ן", "פ": "ף", "צ": "ץ" };
const NORMAL = Object.fromEntries(Object.entries(FINALS).map(([k, v]) => [v, k]));
const unfinal = ch => NORMAL[ch] || ch;
const LETTER_NAMES = {
  "א": "Aleph", "ב": "Beth", "ג": "Gimel", "ד": "Daleth", "ה": "Heh", "ו": "Vav", "ז": "Zayin",
  "ח": "Cheth", "ט": "Teth", "י": "Yod", "כ": "Kaph", "ך": "Kaph (final)", "ל": "Lamed", "מ": "Mem",
  "ם": "Mem (final)", "נ": "Nun", "ן": "Nun (final)", "ס": "Samekh", "ע": "Ayin", "פ": "Peh",
  "ף": "Peh (final)", "צ": "Tzaddi", "ץ": "Tzaddi (final)", "ק": "Qoph", "ר": "Resh", "ש": "Shin", "ת": "Tav",
};
export function letterName(ch) { return LETTER_NAMES[ch] || ch; }

/* Traditional angelic forms of the 72 Names (suffix ־יה "-iah" or ־אל "-el"). */
const ANGELS = [
  "Vehuiah", "Yeliel", "Sitael", "Elemiah", "Mahasiah", "Lelahel", "Achaiah", "Cahetel", "Haziel",
  "Aladiah", "Lauviah", "Hahaiah", "Yezalel", "Mebahel", "Hariel", "Hakamiah", "Lauviah", "Caliel",
  "Leuviah", "Pahaliah", "Nelchael", "Yeiayel", "Melahel", "Hahuiah", "Nith-Haiah", "Haaiah", "Yerathel",
  "Seheiah", "Reiyel", "Omael", "Lecabel", "Vasariah", "Yehuiah", "Lehahiah", "Chavakiah", "Menadel",
  "Aniel", "Haamiah", "Rehael", "Ieiazel", "Hahahel", "Mikael", "Veuliah", "Yelahiah", "Sealiah",
  "Ariel", "Asaliah", "Mihael", "Vehuel", "Daniel", "Hahasiah", "Imamiah", "Nanael", "Nithael",
  "Mebahiah", "Poyel", "Nemamiah", "Yeialel", "Harahel", "Mitzrael", "Umabel", "Iah-hel", "Anauel",
  "Mehiel", "Damabiah", "Manakel", "Eyael", "Habuhiah", "Rochel", "Jabamiah", "Haiaiel", "Mumiah",
];

function stripSpaces(s) { return s.replace(/\s+/g, ""); }

export function buildShem() {
  const v19 = stripSpaces(SHEM_VERSES[19]);
  const v20 = stripSpaces(SHEM_VERSES[20]);
  const v21 = stripSpaces(SHEM_VERSES[21]);
  if (v19.length !== 72 || v20.length !== 72 || v21.length !== 72) {
    throw new Error(`Shem verses must be 72 letters each (got ${v19.length}, ${v20.length}, ${v21.length})`);
  }
  const names = [];
  for (let i = 0; i < 72; i++) {
    const a = unfinal(v19[i]), b = unfinal(v20[71 - i]), c = unfinal(v21[i]);
    const root = a + b + c;
    const display = a + b + (FINALS[c] || c);
    names.push({
      n: i + 1,
      letters: [a, b, c],
      hebrew: display,
      letterNames: [a, b, c].map(letterName),
      angel: ANGELS[i],
      suffix: ANGELS[i].endsWith("el") ? "אל" : "יה",
      indices: { v19: i, v20: 71 - i, v21: i },
      root,
    });
  }
  return { names, verses: { v19, v20, v21 } };
}

/* Four Worlds, drawn as horizontal bands behind the Tree. */
export const WORLDS = [
  { name: "Atziluth", meaning: "Archetypal — Fire — Yod",    yTop: 8.8, yBottom: 7.5, color: "#ffffff" },
  { name: "Briah",    meaning: "Creative — Water — Heh",     yTop: 7.5, yBottom: 5.6, color: "#7fa6ee" },
  { name: "Yetzirah", meaning: "Formative — Air — Vav",      yTop: 5.6, yBottom: 1.2, color: "#f2d14b" },
  { name: "Assiah",   meaning: "Material — Earth — Heh",     yTop: 1.2, yBottom: -0.8, color: "#8a7a3a" },
];

export const PILLARS = [
  { key: "right", name: "Pillar of Mercy",       hebrew: "Jachin", color: "#ffffff" },
  { key: "mid",   name: "Pillar of Equilibrium", hebrew: "—",      color: "#f2d14b" },
  { key: "left",  name: "Pillar of Severity",    hebrew: "Boaz",   color: "#2a2b3a" },
];
