/* Pathworking — the Four Worlds above and the Four Shells below.
   Attributions follow the Golden Dawn / 777 tables for the worlds, and the Zohar, Lurianic
   Kabbalah (Vital, Etz Chaim) and 777 for the Qliphoth. The lower four are given so they can
   be recognised and avoided; the guide does not teach pathworking in them. */

/* ─── The Four Worlds (Olamot) ──────────────────────────────────────────── */
export const FOUR_WORLDS = [
  { key: "atziluth", name: "Atziluth", hebrew: "אצילות", meaning: "Emanation · the Archetypal World",
    letter: "י Yod", element: "Fire", soul: "Chiah — the life-force, the spark of will",
    suit: "Wands", court: "Kings (Knights)", scale: "King scale", scaleNote: "the colours of the Sephiroth in Atziluth",
    hierarchy: "The Divine Names", hierarchyNote: "In Atziluth each Sephirah is known by a Name of God. These are the words vibrated at every temple.",
    sephiroth: ["kether", "chokmah", "binah", "chesed", "geburah", "tiphareth", "netzach", "hod", "yesod", "malkuth"],
    field: "godName", color: "#ffffff", tone: "#fff7d6",
    body: "the point: Adam Kadmon's crown", sense: "no form, no image: pure will and light",
    partzuf: "Arikh Anpin (the Long Face) and Abba (Father)",
    description: "The world nearest to the Unmanifest. Nothing here has form; it is the realm of archetypes as pure force, the ten Names before any angel has been sent to carry them. In pathworking Atziluth is not travelled: it is invoked, by vibrating the Divine Name, and answered by light that has no shape.",
    practice: "Vibrate the Name; do not attempt to picture Atziluth. When a temple suddenly loses all form and becomes light, you have touched it. Rest, then return.",
    trumps: "The Aces are the roots of the four elements in Atziluth.",
    kether: "Kether of Atziluth is the highest point the Tree reaches: Yechidah, the single One." },
  { key: "briah", name: "Briah", hebrew: "בריאה", meaning: "Creation · the Creative World",
    letter: "ה Heh", element: "Water", soul: "Neshamah — the intuitive, divine soul",
    suit: "Cups", court: "Queens", scale: "Queen scale", scaleNote: "the colours most used for the Sephiroth in practice",
    hierarchy: "The Archangels", hierarchyNote: "In Briah each Sephirah is governed by an Archangel: the great forms met at each temple's altar.",
    sephiroth: ["kether", "chokmah", "binah", "chesed", "geburah", "tiphareth", "netzach", "hod", "yesod", "malkuth"],
    field: "archangel", color: "#7fa6ee", tone: "#b9ccf5",
    body: "the head and the heart: the throne", sense: "great forms, vast and still, seen rather than touched",
    partzuf: "Imma (Mother)",
    description: "The world of creation proper: the first ideas, the archetypes clothed in the barest form. Ezekiel's Throne and the Chariot belong here. The Archangels are its inhabitants; what they show is pattern, not picture.",
    practice: "The Archangel at the altar of each temple is Briatic. Greet, ask, listen; do not describe what you see in words until afterwards. Briah teaches by impression.",
    trumps: "The Twos, Threes and the Queens.",
    kether: "Kether of Briah is Malkuth of Atziluth: the Names descend into archangelic form." },
  { key: "yetzirah", name: "Yetzirah", hebrew: "יצירה", meaning: "Formation · the Formative World",
    letter: "ו Vav", element: "Air", soul: "Ruach — the reasoning mind, the breath",
    suit: "Swords", court: "Princes (Knights)", scale: "Emperor (Prince) scale", scaleNote: "the colours of the paths in Yetzirah",
    hierarchy: "The Angelic Choirs", hierarchyNote: "In Yetzirah each Sephirah has its order of angels, the many hands that carry one Archangel's work.",
    sephiroth: ["kether", "chokmah", "binah", "chesed", "geburah", "tiphareth", "netzach", "hod", "yesod", "malkuth"],
    field: "choir", color: "#f2d14b", tone: "#fbe99a",
    body: "the trunk and the breath", sense: "the landscapes of the paths; angels, guides, images that move and speak",
    partzuf: "Zeir Anpin (the Short Face): the six Sephiroth Chesed to Yesod",
    description: "The world of the astral: the great formative sea in which every image the imagination can hold is given shape. This is where pathworking actually takes place. The temples, the doors, the landscapes and their inhabitants are Yetziratic. It is also where illusion lives, which is why everything met is tested.",
    practice: "All the Guide's journeys are Yetziratic. Build steadily, test with the Sign, return by the road you came. The discipline of Yetzirah is to keep the image faithful to the pattern above it.",
    trumps: "The Fours to the Nines, and the Princes. The twenty-two trumps are the paths of Yetzirah.",
    kether: "Kether of Yetzirah is Malkuth of Briah: the pattern descends into forming images." },
  { key: "assiah", name: "Assiah", hebrew: "עשיה", meaning: "Action · the Material World",
    letter: "ה Heh (final)", element: "Earth", soul: "Nephesh — the animal soul, instinct and body",
    suit: "Pentacles (Disks)", court: "Princesses (Pages)", scale: "Empress (Princess) scale", scaleNote: "the flecked and mixed colours of matter",
    hierarchy: "The Spheres (the Mundane Chakras)", hierarchyNote: "In Assiah each Sephirah is reflected in a heavenly body or sphere, and finally in the body, the elements and the senses.",
    sephiroth: ["kether", "chokmah", "binah", "chesed", "geburah", "tiphareth", "netzach", "hod", "yesod", "malkuth"],
    field: "planet", color: "#8a7a3a", tone: "#c9b36a",
    body: "the feet and the hands: the world of action", sense: "the physical: candle, incense, voice, the floor underfoot",
    partzuf: "Nukvah (the Bride, the Shekinah)",
    description: "The world of action and effect, in which the three above take body. Our world. Everything done in pathworking must be sealed here: the spoken word, the lit candle, the written record and the changed life. A working that does not reach Assiah has not happened.",
    practice: "Prepare the room; speak aloud; ground with food; write the journal; watch the life. Assiah is where results are read.",
    trumps: "The Tens and the Princesses. The Ten of Pentacles is Malkuth of Assiah, the bottom of the Ladder.",
    kether: "Kether of Assiah is Malkuth of Yetzirah: the image descends into the deed." },
];
export const WORLD_BY_KEY = Object.fromEntries(FOUR_WORLDS.map(w => [w.key, w]));

export const LADDER_NOTE = "The four Worlds are not four places but four Trees, one inside the other. In the Golden Dawn's reading, the Malkuth of each higher World is the Kether of the one below, so that a single ladder of thirty-seven Sephiroth runs from Kether of Atziluth to Malkuth of Assiah (Jacob's Ladder). In the Toledano reading the Trees interlock more closely: the Tiphareth of the lower World is the Malkuth of the one above, and the Daath of the lower is the Yesod of the higher. Either way, the Tree you see is only the Tree of one World, and the same ten Sephiroth repeat above it four times in subtler substance, and below it four times in coarser.";

/* ─── The Four Shells below (Qliphoth) ───────────────────────────────────── */
/* Ezekiel 1:4 names four things seen before the Chariot: a stormy wind, a great cloud, a
   flashing fire, and a brightness (Nogah) about it. Lurianic Kabbalah reads these as the four
   shells that enclose the four Worlds from below. Nogah is the only one that can be redeemed. */
export const FOUR_SHELLS = [
  { key: "nogah", name: "Nogah", hebrew: "נֹגַהּ", meaning: "Brightness · the shell nearest the Worlds", mirrors: "assiah",
    source: "Ezekiel 1:4, 'a brightness round about it'", color: "#6b6480", tone: "#8a8099",
    description: "The neutral shell: neither holy nor unclean, it takes the colour of whatever is done through it. Habit, appetite, ordinary selfishness, the body's demands. Everything in daily life that is not yet consecrated lives here, and it is the shell that pathworking is most likely to touch, because it is the reflection of Assiah.",
    danger: "Inertia, greed, the sense that only the material is real. The reflection of Malkuth's vice.",
    redeem: "Nogah can be lifted: it is redeemed by using the material world in service. Grounding, honest work and the journal are how.",
    recognise: "A temple that looks right but feels heavy and dull; an image that argues for comfort; a wish to stop the work and eat." },
  { key: "esh", name: "Esh Mitlakachat", hebrew: "אֵשׁ מִתְלַקַּחַת", meaning: "Flashing fire · the shell of Yetzirah", mirrors: "yetzirah",
    source: "Ezekiel 1:4, 'a fire infolding itself'", color: "#8a2a2a", tone: "#b84a3a",
    description: "The false astral: images that flash and consume. Where Yetzirah forms true images from the pattern above, this shell forms them from desire and fear. Glamour, phantasm, self-generated visions, the voice that flatters, lives here.",
    danger: "Inflation, obsession, fantasy mistaken for vision. The reflection of Tiphareth's pride and Netzach's lust.",
    redeem: "Not redeemed; dismissed. The Sign and the pentagram exist for this shell.",
    recognise: "Images that will not hold still under the letter; visions that always praise you; a path that keeps offering shortcuts upward." },
  { key: "anan", name: "Anan Gadol", hebrew: "עָנָן גָּדוֹל", meaning: "Great cloud · the shell of Briah", mirrors: "briah",
    source: "Ezekiel 1:4, 'a great cloud'", color: "#3a3550", tone: "#5a5476",
    description: "Where Briah is pattern and clear understanding, this shell is obscurity: confusion of mind, false doctrine, understanding turned to concealment. It is the darkness that imitates Binah's silence but holds nothing.",
    danger: "Confusion, despair, systems of thought that explain everything and change nothing. The reflection of Binah's avarice and Hod's falsehood.",
    redeem: "Not redeemed; avoided. Return to the simple practice and the written sources.",
    recognise: "A temple whose walls will not form; a guide who speaks at length and says nothing; a longing for secret knowledge that no one else has." },
  { key: "ruach", name: "Ruach Se'arah", hebrew: "רוּחַ סְעָרָה", meaning: "Stormy wind · the shell of Atziluth", mirrors: "atziluth",
    source: "Ezekiel 1:4, 'a whirlwind came out of the north'", color: "#1c1826", tone: "#3a3048",
    description: "The furthest shell, the reflection of Atziluth: force without pattern, will without the Name. Where Atziluth is pure light, this is pure storm. The tradition names it the abode of the Thaumiel, the 'twin gods' who divide what Kether unites.",
    danger: "Megalomania, the division of the self against itself, destruction for its own sake. The reflection of Kether's unity, inverted.",
    redeem: "Not redeemed; not approached. No beginner, and few adepts, have any business here.",
    recognise: "You will not see this shell in pathworking if the order of operations has been kept. If a working is accompanied by uncontrollable force, stop, banish fully, and do not work again until you have spoken to a teacher." },
];

/* The ten Qliphoth as they reflect the Sephiroth (777, col. 8), with their traditional
   archdemons (col. 165) — listed so that they can be recognised and named, never invoked. */
export const QLIPHOTH = {
  kether:    { name: "Thaumiel", hebrew: "תאומיאל", meaning: "the Twins of God · duality where there should be unity", demon: "Satan and Moloch" },
  chokmah:   { name: "Ghagiel", hebrew: "עוגיאל", meaning: "the Hinderers · force that obstructs", demon: "Beelzebub" },
  binah:     { name: "Satariel", hebrew: "סאתאריאל", meaning: "the Concealers · understanding turned to hiding", demon: "Lucifuge Rofocale" },
  daath:     { name: "—", hebrew: "", meaning: "the Abyss itself; Choronzon, the dweller in it", demon: "Choronzon" },
  chesed:    { name: "Gha'agsheblah", hebrew: "געשכלה", meaning: "the Smiters · mercy become indulgence and tyranny", demon: "Astaroth" },
  geburah:   { name: "Golachab", hebrew: "גולחב", meaning: "the Burners · severity become cruelty", demon: "Asmodeus" },
  tiphareth: { name: "Thagirion", hebrew: "תגרירון", meaning: "the Disputers · beauty become pride", demon: "Belphegor" },
  netzach:   { name: "A'arab Zaraq", hebrew: "ערב זרק", meaning: "the Ravens of Dispersion · feeling become lust", demon: "Baal" },
  hod:       { name: "Samael", hebrew: "סמאל", meaning: "the Poison of God · intellect become falsehood", demon: "Adrammelech" },
  yesod:     { name: "Gamaliel", hebrew: "גמליאל", meaning: "the Obscene Ones · imagination become fantasy", demon: "Lilith" },
  malkuth:   { name: "Nahemoth (Lilith)", hebrew: "נהמות", meaning: "the Whisperers · the kingdom become inertia and greed", demon: "Nahema" },
};

export const QLIPHOTH_NOTE = "Every Sephirah casts a shadow, and the tradition names the shadows so that a practitioner can recognise which vice has been touched. Each Qlipha is the virtue of its Sephirah pulled out of balance: Chesed's generosity become indulgence, Geburah's strength become cruelty, Hod's intellect become lies. They are listed here for recognition only. The guide does not teach their invocation, and the protections in the Guide tab are the whole of what a pathworker needs for them: the Sign to recognise, the pentagram to dismiss, the Cross to close.";
