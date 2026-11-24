/* Pathworking — the Middle Pillar exercise, after the method taught by Ted Andrews in
   Simplified Magic: A Beginner's Guide to the New Age Qabala (Llewellyn, 1989), itself a
   popularisation of Israel Regardie's The Middle Pillar (1938).
   Andrews' particular emphases, kept here: the five centres are felt as living energy centres
   in the body and related to the chakras; each is "charged" by toning its Divine Name slowly
   and feeling the vibration in that part of the body; the light is then circulated in three
   ways and fountained; and the exercise is done daily as a tonic, before any other work.
   The wording below is this app's own; the structure is his. */

export const MP_SOURCES = [
  { cite: "Ted Andrews, Simplified Magic: A Beginner's Guide to the New Age Qabala (Llewellyn, 1989), the chapters on the Tree in the body and the Middle Pillar exercise", why: "the body-centre and chakra placement, the toning of each Name as a charge, the circulations and the fountain, daily use" },
  { cite: "Israel Regardie, The Middle Pillar (1938)", why: "the original exercise: the five spheres, the Names, the circulation of the light" },
];

/* The five centres of the Middle Pillar as Andrews places them in the body. */
export const MP_CENTRES = [
  { key: "kether", name: "Kether", body: "just above the crown of the head", chakra: "crown chakra (sahasrara)", color: "#ffffff", colorName: "brilliant white",
    godName: "Eheieh", said: "eh-heh-YEH", meaning: "I Am", feel: "a cool, tingling pressure on the top of the head; the sphere is the source the others drink from" },
  { key: "daath", name: "Daath", body: "at the throat, the hollow where the collarbones meet", chakra: "throat chakra (vishuddha); the brow chakra lies on the shaft between crown and throat", color: "#b9a6e6", colorName: "lavender grey, like moonlit mist",
    godName: "Jehovah Elohim", said: "yeh-hoh-VAH el-oh-HEEM", meaning: "the Lord God; the Name of Knowledge", feel: "warmth and loosening in the throat; the voice opens" },
  { key: "tiphareth", name: "Tiphareth", body: "at the heart, centre of the chest", chakra: "heart chakra (anahata)", color: "#f2d14b", colorName: "golden yellow, like the sun",
    godName: "Jehovah Aloah va-Daath", said: "yeh-hoh-VAH ah-LOH-ah vah-DAH-at", meaning: "Lord God of Knowledge", feel: "radiating warmth across the chest and down the arms; the breath deepens" },
  { key: "yesod", name: "Yesod", body: "at the sacral centre, just below the navel, over the generative organs", chakra: "sacral chakra (svadhisthana); the solar plexus chakra lies on the shaft between heart and sacrum", color: "#7d4fd1", colorName: "violet, deep and luminous",
    godName: "Shaddai El Chai", said: "shah-DYE el KHYE", meaning: "Almighty Living God", feel: "a pulse low in the belly; steadiness and desire quieted into power" },
  { key: "malkuth", name: "Malkuth", body: "at the feet, a sphere enclosing both feet and the floor they stand on", chakra: "base chakra (muladhara) at the perineum is the gate; the sphere itself sits at the feet", color: "#8a7a3a", colorName: "the four colours of earth: citrine, olive, russet and black",
    godName: "Adonai ha-Aretz", said: "ah-doh-NYE hah-AH-retz", meaning: "Lord of the Earth", feel: "weight and rootedness; the feet grow warm and heavy" },
];

export const MP_INTRO = {
  what: "The Middle Pillar builds the central column of the Tree of Life in your own body: five spheres of light from above the head to the feet, each charged by toning its Divine Name, then joined into one shaft and circulated through the whole aura. Andrews teaches it as the daily foundation of all Qabalistic work: it balances the energy centres, strengthens the aura, steadies the emotions and gives the magician a body that can hold what pathworking brings down.",
  how: "Stand or sit upright, feet flat. Breathe slowly. Each centre is built in the same way: see the sphere in its colour at its place in the body, then tone the Name on a long out-breath, slowly, four times, and feel the sound vibrate in that part of the body. Toning means singing the Name on one steady note, drawing out each syllable until the breath is spent. The vibration is the charge. When all five are lit, see a shaft of white light joining them, then circulate the light three ways and let it fountain. Finish by absorbing the light and grounding.",
  tips: [
    "Tone aloud whenever you can; a whisper or an inner toning will do in company, but the body learns fastest from real sound.",
    "The pitch does not matter. Find a note that makes the chest or belly hum and keep it.",
    "Do not force a centre to light. If one stays dim, tone its Name a fifth time and move on; it will brighten over days.",
    "Ten to fifteen minutes, daily, is Andrews' prescription. Morning is best; the exercise is energising and can disturb sleep if done late.",
    "Dizziness, buzzing or light-headedness afterwards mean too much energy left in the head: repeat the fountain, then the grounding, and eat.",
    "Keep the pillars balanced. If temper or restlessness follows, do the exercise again with longer time at Malkuth and the fountain.",
  ],
  benefits: "A steadier aura and nerves, better concentration, warmth and vitality, and over weeks a clear felt sense of the body's centres that makes the temples of the pathworkings far easier to build.",
};

/* The guided exercise. Each step: title, where, secs, lit/focus for the model, html, and cues
   fired by the voice at `at` seconds: { at, text } is spoken; { at, name } is toned. */
export function buildMiddlePillar() {
  const V = s => `<button type="button" class="vibrate" data-say="${s}" title="Tap to hear">${s} <span class="say-ico" aria-hidden="true">🔊</span></button>`;
  const centreStep = (c, i) => ({
    title: `Charge ${c.name} · ${c.chakra.split(" (")[0]}`, where: `${c.name} · ${c.body}`, secs: 120, lit: MP_CENTRES.slice(0, i + 1).map(x => x.key), paths: [], focus: c.key,
    html: `<p>Bring attention to ${c.body}. A sphere of <span class="swatch" style="background:${c.color}"></span>${c.colorName} forms there, the size of a grapefruit, ${i === 0 ? "bright as a star" : "fed by a thread of white light from the sphere above"}.</p>
      <p>When it is steady, tone the Name on a long out-breath, four times: ${V(c.godName)} — <em>${c.said}</em>, “${c.meaning}”. Feel the sound vibrate ${c.body.replace(/^at |^just /, "at ")}: ${c.feel}.</p>
      <p>Between tonings, breathe in and see the sphere grow brighter and more solid. Leave it shining.</p>`,
    cues: [
      { at: 6, text: `${c.name}. See the sphere of ${c.colorName} ${c.body}. When it is steady, tone the Name on a long breath. Feel it ${c.body}.` },
      { at: 24, name: c.godName }, { at: 44, name: c.godName }, { at: 64, name: c.godName }, { at: 84, name: c.godName },
      { at: 102, text: `Breathe. The sphere shines ${c.body}. Leave it burning.` },
    ],
  });
  return [
    { title: "Settle and breathe", where: "Preparation", secs: 60, lit: [], paths: [], focus: null,
      html: `<p>Stand, or sit upright with the feet flat and the hands resting. Close the eyes. Breathe in for four, hold four, out for four, hold four, until the body is quiet and the breath is slow.</p><p>You are going to build the central pillar of the Tree in your own body, charge each of its five centres with sound, and set the light moving. Take your time at every centre.</p>`,
      cues: [{ at: 4, text: "Settle. Feet flat. Breathe in for four, hold four, out for four, hold four. Let the body become quiet." }, { at: 40, text: "When you are ready, we begin at the crown." }] },
    ...MP_CENTRES.map(centreStep),
    { title: "Join the pillar", where: "Kether to Malkuth · the shaft of light", secs: 60, lit: MP_CENTRES.map(c => c.key), paths: [13, 25, 32], focus: "tiphareth",
      html: `<p>All five spheres are lit. See a shaft of brilliant white light descend from Kether through Daath, Tiphareth and Yesod into Malkuth, joining them into one pillar. Breathe along it: in from the crown to the feet, out from the feet to the crown. The pillar hums.</p>`,
      cues: [{ at: 5, text: "All five are lit. See a shaft of white light descend from the crown through the throat, the heart, the belly, into the feet, joining them into one pillar." }, { at: 30, text: "Breathe in down the pillar. Breathe out up the pillar. Feel it hum." }] },
    { title: "Circulate: down the left, up the right", where: "First circulation · the sides of the body", secs: 90, lit: MP_CENTRES.map(c => c.key), paths: [13, 25, 32], focus: "tiphareth",
      html: `<p>From Kether, on the out-breath, send a stream of light down the left side of the body to Malkuth. On the in-breath, draw it up the right side back to Kether. Six slow breaths. The light sheathes the body like a cloak.</p>`,
      cues: [{ at: 4, text: "Breathe out: the light flows from the crown down the left side to the feet." }, { at: 12, text: "Breathe in: up the right side to the crown." }, { at: 20, text: "Out: down the left." }, { at: 28, text: "In: up the right." }, { at: 36, text: "Out: down the left." }, { at: 44, text: "In: up the right." }, { at: 52, text: "Out, down the left." }, { at: 60, text: "In, up the right." }, { at: 72, text: "The light sheathes the sides of the body like a cloak." }] },
    { title: "Circulate: down the front, up the back", where: "Second circulation · front and back", secs: 90, lit: MP_CENTRES.map(c => c.key), paths: [13, 25, 32], focus: "tiphareth",
      html: `<p>Now from Kether, on the out-breath, the light flows down the front of the body to the feet; on the in-breath it rises up the spine to the crown. Six slow breaths. Front and back are enclosed; the aura is sealed.</p>`,
      cues: [{ at: 4, text: "Breathe out: the light flows down the front of the body to the feet." }, { at: 12, text: "Breathe in: up the spine to the crown." }, { at: 20, text: "Out: down the front." }, { at: 28, text: "In: up the back." }, { at: 36, text: "Out: down the front." }, { at: 44, text: "In: up the back." }, { at: 52, text: "Out, down the front." }, { at: 60, text: "In, up the spine." }, { at: 72, text: "Front and back are enclosed. The aura is sealed." }] },
    { title: "The fountain", where: "Third circulation · the central column", secs: 90, lit: MP_CENTRES.map(c => c.key), paths: [13, 25, 32], focus: "kether",
      html: `<p>On the in-breath, draw the light up the central column from Malkuth, through every sphere, to Kether. On the out-breath it bursts from the crown like a fountain, showers down over the whole aura in sparkling light, and gathers again at the feet. Six breaths. Every cell is washed.</p>`,
      cues: [{ at: 4, text: "Breathe in: draw the light up the centre from the feet, through every sphere, to the crown." }, { at: 13, text: "Breathe out: it fountains from the crown and showers down over the whole body, gathering at the feet." }, { at: 24, text: "In: up the column." }, { at: 32, text: "Out: fountain." }, { at: 40, text: "In: up." }, { at: 48, text: "Out: the fountain falls over you like light rain." }, { at: 56, text: "In." }, { at: 64, text: "Out." }, { at: 74, text: "Every cell is washed in light." }] },
    { title: "Absorb and ground", where: "Closing", secs: 60, lit: ["malkuth"], paths: [], focus: "malkuth",
      html: `<p>Let the fountain settle. See the five spheres soften into a single glow that fills the body and sinks into it, into bone and blood, until nothing is left outside. Feel the feet heavy on the floor. Open the eyes. Stamp once. Say your name. Drink some water.</p><p>Note in the journal which centres lit easily and which were dim; over the weeks the dim ones tell you where to work.</p>`,
      cues: [{ at: 5, text: "Let the light settle. The spheres soften into one glow that sinks into the body, into bone and blood." }, { at: 30, text: "Feel the feet heavy. Open the eyes. Stamp once. Say your name. Drink some water." }] },
  ];
}

/* What a Middle Pillar session needs, for the journal checklist. */
export function mpNeeds() {
  const items = [];
  const add = (group, text) => items.push({ group, text });
  add("Time", "Morning or daytime; not within an hour of a full meal; not late at night");
  add("Space", "Standing room or an upright chair; feet flat; quiet for fifteen minutes");
  add("Tools", "None required. Optional: a white candle; the journal and pen");
  for (const c of MP_CENTRES) add("Words", `${c.godName} toned ×4 at ${c.body.replace(/^at |^just /, "")} (${c.name})`);
  add("Words", "Breath count for the circulations: six out-and-in breaths each");
  add("Afterwards", "Water; feet on the floor; a note of which centres lit easily");
  return items;
}

export const MP_PSEUDO_PATH = { n: "mp", name: "Middle Pillar", letter: "", lmeaning: "Ted Andrews' method", color: "#f2d14b", colorName: "white and gold", from: "kether", to: "malkuth", attr: "the central column", tarot: "—" };
