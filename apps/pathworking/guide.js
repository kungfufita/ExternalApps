/* Pathworking — the written guide.
   Teaching compiled from the standard Western (Hermetic) literature on the Tree of Life.
   Nothing here is quoted at length; each section is a digest, and SOURCES names where the
   method comes from so the practitioner can go to the books themselves. */

export const SOURCES = [
  { key: "fortune", short: "Fortune", cite: "Dion Fortune, The Mystical Qabalah (1935)", why: "the virtues and vices of each Sephirah, the magical images, and the rule that the Tree is climbed from Malkuth upward" },
  { key: "regardie", short: "Regardie", cite: "Israel Regardie, The Middle Pillar (1938) and A Garden of Pomegranates (1932)", why: "the Middle Pillar exercise, the Kabbalistic Cross and daily banishing as the foundation laid before any pathworking" },
  { key: "gd", short: "Golden Dawn", cite: "Israel Regardie (ed.), The Golden Dawn (1937); Chic & Sandra Tabatha Cicero, Self-Initiation into the Golden Dawn Tradition (1995)", why: "the Lesser Banishing Ritual of the Pentagram, the grade order in which the paths are taken, the tracing of the pentagrams and hexagrams, and testing visions with the appropriate symbol" },
  { key: "knight", short: "Knight", cite: "Gareth Knight, A Practical Guide to Qabalistic Symbolism (1965) and Experience of the Inner Worlds (1975)", why: "the method of building a temple of departure, the door and the letter, and the warning not to advance until a Sephirah is lived in daily life" },
  { key: "ashcroft", short: "Ashcroft-Nowicki", cite: "Dolores Ashcroft-Nowicki, The Shining Paths (1983) and Highways of the Mind (1987)", why: "scripted path visualizations for all twenty-two paths, the Sign used to test anything met on the way, and the rule of returning by the road you came" },
  { key: "crowley", short: "777", cite: "Aleister Crowley, 777 and Other Qabalistic Writings; Sepher Yetzirah (Kaplan trans., 1990)", why: "the tables of correspondence: colours, letters, tarot trumps and the Thirty-Two Paths of Wisdom" },
  { key: "psd", short: "Psychic Self-Defence", cite: "Dion Fortune, Psychic Self-Defence (1930)", why: "closing down, grounding and what to do when a working leaves you unsettled" },
];

/* ─── Order of operations ──────────────────────────────────────────────────── */
export const ORDER = {
  intro: "The Tree is climbed, never dropped into. Every tradition that teaches pathworking agrees on the shape of the work: lay a foundation of daily practice, enter at Malkuth, take the paths one at a time from the bottom, live in each Sephirah before leaving it, and always return by the road you came.",
  steps: [
    { title: "Lay the foundation first", weeks: "4–8 weeks", src: ["regardie", "gd"],
      text: "Before the first pathworking, practise the Kabbalistic Cross daily, then the Middle Pillar (the Descent tab's Middle Pillar sequence follows it), then the Lesser Banishing Ritual of the Pentagram. These teach the body to hold and release force and give you the tools you will use to protect and close every working. A pathworking without them is a journey without a door to come home through." },
    { title: "Study the map before you travel it", weeks: "ongoing", src: ["fortune", "crowley"],
      text: "Learn the correspondences of the two Sephiroth a path joins and of the path itself: Divine Name, Archangel, colour, letter, tarot trump, astrological attribution. Use the Tree tab. You should be able to recite them before you sit down. The images on the astral answer to the symbols you carry in; an unprepared mind travels blind." },
    { title: "Enter at Malkuth and work the Sephirah itself", weeks: "2–4 weeks", src: ["fortune", "knight"],
      text: "The first journeys are not along a path at all. Build the Temple of Malkuth (see Entering the Tree), sit in it, vibrate Adonai ha-Aretz, greet Sandalphon, and leave. Repeat until the temple forms instantly and stays stable. Only a steady Malkuth can be a place to return to." },
    { title: "Take the paths from the bottom, one at a time", weeks: "per path", src: ["gd", "ashcroft"],
      text: "The Serpent of Wisdom climbs from the 32nd path to the 11th, and that is the order of the Ascent tab. The Golden Dawn grades group them: 32 (Malkuth to Yesod); then 31 and 30 (into Hod); then 29, 28 and 27 (into Netzach); then 25, 24 and 26 (into Tiphareth). Never work two paths in one sitting, and never a path whose lower Sephirah you have not already stood in." },
    { title: "Arrive, rest, return the same way", weeks: "each session", src: ["ashcroft", "knight"],
      text: "A path ends in a temple. Enter it, vibrate its Name, meet its Archangel, receive what is given, then turn around and walk back down the same path to the temple you left. Do not take a shortcut, do not climb on, and do not leave an inner door open behind you." },
    { title: "Close, ground, record", weeks: "each session", src: ["psd", "regardie"],
      text: "Finish with the Kabbalistic Cross or the full banishing. Eat, drink, stamp, say your name, write the journal entry before anything else. The record is part of the work, not an afterthought: it is how you will know, weeks later, whether the path has integrated." },
    { title: "Integrate before you move on", weeks: "1 week to 1 lunar month", src: ["fortune", "knight"],
      text: "Live with the Sephirah you have reached. Watch dreams, moods, synchronicities and the state of your daily affairs. Repeat the path at least three times. Only when the virtue of the Sephirah shows in ordinary life, and its vice has been faced, is the next path open to you. See Integration." },
  ],
};

/* ─── Dangers ──────────────────────────────────────────────────────────────── */
export const DANGERS = {
  intro: "Pathworking is guided imagination deliberately pushed until it answers back. That is its power and its hazard. The classic authors are blunt about the risks, and so is this guide. Read these before the first journey and again whenever a working leaves you shaken.",
  items: [
    { title: "Do not work when unwell, unstable or altered", src: ["psd"],
      text: "No pathworking during acute grief, depression, mania, psychosis, panic, or while drunk or on drugs (including heavy cannabis). The technique amplifies whatever state you bring. If you have a psychiatric history, work with a teacher and tell your clinician what you are doing. The Tree is not a therapy and does not replace one." },
    { title: "Ungroundedness and astral drift", src: ["psd", "regardie"],
      text: "Signs: light-headedness that persists, feeling 'not quite in the body' for hours, losing time, trouble concentrating on ordinary tasks, a sense of the room being thin. Cause: skipping the return, the closing, or food. Remedy: the Kabbalistic Cross, salt and bread, physical work, and no further workings until it has cleared for several days." },
    { title: "Inflation and glamour", src: ["fortune"],
      text: "Especially on the paths into Tiphareth and Netzach. A sense of special election, of being chosen, of secret knowledge others lack, of beauty that makes daily life seem grey. This is the vice of Tiphareth (pride) and of Netzach (sentimentality and lust). Remedy: humility, service, a return to Malkuth and an honest journal." },
    { title: "Imbalance of a single Sephirah", src: ["fortune", "knight"],
      text: "Each Sephirah has a vice that appears when you draw on it without its opposite. Too much Geburah shows as temper and harshness; too much Chesed as bigotry and over-indulgence; Hod alone as cold cleverness and dishonesty; Netzach alone as dissipation; Yesod as fantasy, idleness and disturbed sexuality; Malkuth as inertia and avarice. The pillars balance each other; if a vice flares, work the opposite Sephirah or the Middle Pillar." },
    { title: "Contact with what does not belong", src: ["ashcroft", "gd"],
      text: "The lower astral is populated by your own shadows and by thought-forms that are not yours. Anything met on a path is tested: show it the letter of the path, trace the pentagram, ask its name in the Divine Name of the Sephirah. What belongs will stand firm or grow brighter; what does not will waver, change shape, or vanish. Accept no gift, bargain or instruction you did not ask for, and never follow an image off the path." },
    { title: "The vision of the machinery of the universe", src: ["crowley", "knight"],
      text: "The 32nd path (Tav, Malkuth to Yesod) can open a sudden perception of causation, of everything turning on everything, that is frightening in its impersonality. It passes. Note it, do not chase it, ground afterwards." },
    { title: "Working too fast", src: ["knight", "fortune"],
      text: "The commonest harm is not drama but exhaustion and disorder: a life that becomes chaotic because the mind has been living on the Tree instead of in the house. If appointments are being missed, sleep is poor, money is slipping, relationships are strained, stop climbing. The Tree is a map of your life; if the life is not improving, the work is not being done correctly." },
    { title: "Secrecy that becomes isolation", src: ["psd"],
      text: "Discretion is proper; isolation is not. Have someone, ideally a teacher or an experienced friend, who knows you are doing this and can tell you when you are changing in ways you cannot see." },
  ],
  stop: "Stop the session at once, return by the path, close and ground if: you feel real fear rather than awe; an image will not obey the Sign; you cannot remember which temple you are in; the body is cold, shaking or nauseous; or you hear a voice urging you to do anything in the outer world.",
};

/* ─── Entering the Tree: creative visualizations ─────────────────────────── */
export const ENTERING = {
  intro: "There are three doors into the Tree that the literature uses. Learn them in this order. Each is a visualization practised with the eyes closed, seated, after the Kabbalistic Cross, until it forms without effort.",
  methods: [
    { title: "1 · The Temple of Malkuth", src: ["knight", "ashcroft"],
      text: [
        "Sit upright and breathe the square breath (in four, hold four, out four, hold four) until the body is quiet.",
        "See the floor beneath you become a pavement of black and white squares. Walls rise around you, ten-sided, in the four colours of Malkuth: citrine before you (east), olive to your right, russet to your left, black behind. The ceiling is the night sky with the earth's own colours shading up into it.",
        "In the centre stands a double-cube altar of black stone. On it a single flame burns in a lamp. A cross of the four elements is laid on the altar cloth: a dish of salt, a cup of water, a feather or fan, a candle.",
        "Behind the altar, on the eastern wall, is a great closed door of dark wood. This is the door of the 32nd path and the way up the Tree. On the other walls other doors will appear later when you have earned them.",
        "Vibrate ADONAI HA-ARETZ, slowly, three times, feeling it in the feet and the base of the body. Say: 'Sandalphon, Archangel of the Kingdom, I stand in the Temple of Malkuth. Be present.' A tall figure in earth colours, feet rooted, may appear at the altar. Greet it. Ask nothing the first several times.",
        "To leave: thank Sandalphon, see the temple fade from the walls inward until only the flame remains, then let the flame become the breath in your own chest. Open your eyes. Stamp.",
      ] },
    { title: "2 · The Living Tree", src: ["fortune", "regardie"],
      text: [
        "Standing, perform the Kabbalistic Cross. Then build the Tree in your own body as the Middle Pillar teaches: a sphere of white brilliance above the crown (Kether), lavender at the throat (Daath), gold at the heart (Tiphareth), violet at the genitals (Yesod), and the four colours of Malkuth at the feet.",
        "Now step out of yourself and see the Tree before you as a great tree of light rooted in the earth, the Sephiroth as fruit shining in its branches, the paths as channels of coloured light between them. Its roots are in Malkuth beneath your feet; its crown is lost in white light above.",
        "Walk toward it. Its trunk opens like a door. Inside, you are in the Temple of Malkuth as above. This way of entering reminds you that the Tree is not out there: you are climbing yourself.",
      ] },
    { title: "3 · The Door and the Letter", src: ["ashcroft", "knight"],
      text: [
        "From the Temple of Malkuth (or any temple of departure) face the wall nearest the Sephirah you are travelling to. See the door. Upon it the Hebrew letter of the path kindles in the path's colour, large, and above it the tarot trump of the path appears as a painted panel.",
        "Trace the protective pentagram over the door (see Protection). Then vibrate the name of the letter. The door swings open on the landscape of the path. Step through, carrying the letter before you as a lamp. The door stays open behind you with the letter still shining on it: that is your way home.",
        "Never enter a door that bears no letter, and never one whose letter will not stay in its colour when you trace the pentagram.",
      ] },
  ],
};

/* ─── Protection ───────────────────────────────────────────────────────────── */
export const PROTECTION = {
  intro: "Protection in pathworking is not against demons in the medieval sense; it is a set of symbols that keep the imagination disciplined, give you a way to test what you meet, and guarantee the way home. Use all of them, every time, until they are reflex.",
  cross: {
    title: "The Kabbalistic Cross", src: ["regardie", "gd"],
    text: "Opens and closes every session. Standing, visualise a sphere of white light above the head. Touch the forehead and vibrate ATEH (Thou art). Draw the light down and touch the breast (or groin), vibrate MALKUTH (the Kingdom). Touch the right shoulder: VE-GEBURAH (and the Power). Touch the left shoulder: VE-GEDULAH (and the Glory). Clasp the hands at the heart: LE-OLAM, AMEN (for ever, amen). See the cross of light standing in your body with the heart at its centre.",
    words: ["Ateh", "Malkuth", "ve-Geburah", "ve-Gedulah", "le-Olam, Amen"],
  },
  pentagram: {
    title: "The pentagram on the door", src: ["gd", "ashcroft"],
    text: "Before opening any door between Sephiroth, trace the Banishing Pentagram of Earth over it in the colour of the path's letter, with the right hand or a wand, large enough to cover the door. Start at the lower left point, go up to the top, down to the lower right, up to the upper left, across to the upper right, back to the lower left. Vibrate the Divine Name of the Sephirah you are leaving as you trace. The pentagram should flame, then sink into the door. If the letter dims or shifts colour under it, do not open that door today.",
    banishing: [3, 0, 2, 4, 1, 3],
    invoking: [0, 3, 1, 4, 2, 0],
    note: "The Invoking Pentagram of Earth (start at the top, down to the lower left) is used by some teachers on the far side of a door to call the temple of arrival into clearer form. Beginners use the banishing form only.",
  },
  lamp: {
    title: "The letter as lamp and Sign", src: ["ashcroft", "knight"],
    text: "On the path itself, your protection is the letter. Carry it shining before you. When anything approaches, hold it up, and say in the Divine Name of the lower Sephirah: 'In the name of (Name), show me your true form.' The genuine inhabitants of a path will salute the letter or stand steady in its light. Illusions and intrusions blur, flicker, change or dissolve. Whatever does not pass the Sign is dismissed by tracing the pentagram toward it and continuing.",
  },
  hexagram: {
    title: "The hexagram at the temple of arrival", src: ["gd"],
    text: "Having arrived in a Sephirah's temple, more advanced practitioners trace the hexagram of its planet above the altar to steady it (two interlaced triangles: the upward triangle of fire drawn first from the top point, then the downward triangle of water from the bottom point). For a beginner it is enough to vibrate the Divine Name and see the temple's colour deepen and hold.",
  },
  seal: {
    title: "Sealing the door on return", src: ["ashcroft"],
    text: "Back in the temple of departure, turn and face the door you came through. See the letter still burning on it. Trace the banishing pentagram over it once more and vibrate the Divine Name. The letter sinks into the wood and the door closes. Nothing is left open. Only then do you let the temple fade.",
  },
  lbrp: {
    title: "The Lesser Banishing Ritual of the Pentagram", src: ["gd", "regardie"],
    text: "The full closing, used after every path until you are experienced, and always if anything felt wrong. Kabbalistic Cross. Then, turning to each quarter and tracing the banishing pentagram of Earth: East, vibrate YHVH (Yod-Heh-Vav-Heh); South, ADONAI; West, EHEIEH; North, AGLA. Return east, extend the arms as a cross and say: 'Before me Raphael, behind me Gabriel, on my right hand Michael, on my left hand Auriel. For about me flames the pentagram, and within me shines the six-rayed star.' Kabbalistic Cross again.",
    quarters: [
      { dir: "East", name: "YHVH", archangel: "Raphael", color: "#f7f3b0" },
      { dir: "South", name: "Adonai", archangel: "Michael", color: "#f03a3a" },
      { dir: "West", name: "Eheieh", archangel: "Gabriel", color: "#2f4fd6" },
      { dir: "North", name: "AGLA", archangel: "Auriel", color: "#8a7a3a" },
    ],
  },
};

/* ─── Integration ──────────────────────────────────────────────────────────── */
export const INTEGRATION = {
  intro: "A path is not finished when the vision ends; it is finished when the Sephirah it leads to has become part of how you live. The virtues and vices below are Dion Fortune's. They are your gauge. Do not take the next path until the virtue is showing in ordinary life and the vice has been met and named.",
  rules: [
    "Wait at least seven days, and ideally one lunar month, between finishing a path and beginning the next.",
    "Repeat each path at least three times before counting it worked. The second and third journeys differ from the first; that difference is the teaching.",
    "Keep the journal daily in the integration period, not just on session days: dreams, moods, coincidences, health, money, relationships, work. The effects of a path appear in the week after it, in the life, not in the vision.",
    "Practise the Middle Pillar daily between paths. It keeps the pillars balanced and drains off excess.",
    "Do something in Malkuth that belongs to the Sephirah reached: for Yesod, order your sleep and your habits; for Hod, finish a piece of study or honest accounting; for Netzach, make something beautiful or mend a relationship; for Tiphareth, an act of service nobody will know about.",
    "Before moving on, answer in the journal: Can I build the temple of arrival instantly and hold it? Has my daily life become more orderly, not less? Which vice of this Sephirah did I see in myself, and what did I do about it? If any answer is no, repeat the path.",
  ],
  virtues: {
    malkuth:   { virtue: "Discrimination", vice: "Avarice, inertia", image: "A young woman, crowned and throned", life: "Order in the body, the home and money" },
    yesod:     { virtue: "Independence", vice: "Idleness", image: "A beautiful naked man, very strong", life: "Steady habits, honest dreaming, a disciplined imagination" },
    hod:       { virtue: "Truthfulness", vice: "Falsehood, dishonesty", image: "An hermaphrodite", life: "Clear speech and writing, accounts that balance, no small lies" },
    netzach:   { virtue: "Unselfishness", vice: "Unchastity, lust", image: "A beautiful naked woman", life: "Warmth given without bargain, beauty made, feeling that does not swamp" },
    tiphareth: { virtue: "Devotion to the Great Work", vice: "Pride", image: "A majestic king; a child; a sacrificed god", life: "Service, balance of head and heart, humility under light" },
    geburah:   { virtue: "Energy, courage", vice: "Cruelty, destruction", image: "A mighty warrior in his chariot", life: "Right action taken promptly, anger governed, waste cut away" },
    chesed:    { virtue: "Obedience", vice: "Bigotry, hypocrisy, gluttony, tyranny", image: "A mighty crowned and throned king", life: "Generosity with structure, authority held lightly" },
    binah:     { virtue: "Silence", vice: "Avarice", image: "A mature woman; a matron", life: "Patience, acceptance of limit and of grief" },
    chokmah:   { virtue: "Devotion", vice: "—", image: "A bearded male figure", life: "Initiative that serves, not dominates" },
    kether:    { virtue: "Attainment, completion of the Great Work", vice: "—", image: "An ancient bearded king seen in profile", life: "—" },
    daath:     { virtue: "—", vice: "—", image: "—", life: "—" },
  },
};

/* ─── The temples: a visualization for each Sephirah ─────────────────────── */
export const TEMPLES = {
  malkuth: {
    shape: "ten-sided, floored in black and white squares", walls: "citrine, olive, russet and black, one colour to each quarter",
    altar: "a black double cube bearing a lamp and the four elemental weapons", light: "the flame of a single lamp and the colours of earth",
    sense: "the smell of soil and incense of storax or dittany; the weight of your own body",
    presence: "Sandalphon, tall, in the colours of earth, with roots at the feet",
  },
  yesod: {
    shape: "nine-sided", walls: "violet shading to silver, hung with mirrors and veils that stir in a breeze you cannot feel",
    altar: "a nine-sided altar of silver on which a crescent-shaped bowl of water reflects the moon", light: "moonlight through a high window; the room waxes and wanes",
    sense: "jasmine and camphor; the sound of the sea a long way off",
    presence: "Gabriel in violet and silver, bearing a cup, strong and quiet",
  },
  hod: {
    shape: "eight-sided", walls: "orange, lined with books, instruments, scrolls and the names of things",
    altar: "an eight-sided altar with an open book and a caduceus", light: "a clear, cool, bright light like early morning",
    sense: "mastic and sandalwood; the scratch of a pen",
    presence: "Michael in orange and flame, keen-eyed, holding the balance of thought",
  },
  netzach: {
    shape: "seven-sided", walls: "emerald green, open to a garden in which every green thing grows; roses on the pillars",
    altar: "a seven-sided altar of green stone with a lamp and a rose", light: "warm late-afternoon light through leaves",
    sense: "rose and benzoin; birdsong and water",
    presence: "Haniel in green and rose, graceful, holding a lamp",
  },
  tiphareth: {
    shape: "six-sided", walls: "gold, with a rose-cross at the centre of the eastern wall and the Sun above the altar",
    altar: "a six-sided altar of gold on which a child's cradle, a crown and a cross are laid together", light: "noon sunlight, steady, from no visible source",
    sense: "frankincense and cinnamon; a great stillness",
    presence: "Raphael in gold and rose, the healer, winged, with a caduceus",
  },
  geburah: {
    shape: "five-sided", walls: "scarlet, hung with swords, spears, chains and a five-petalled rose; everything is in order",
    altar: "a five-sided altar of red stone with a sword laid across it", light: "the red glow of a forge",
    sense: "pepper and dragon's blood; heat on the face",
    presence: "Kamael in scarlet and iron, armed, utterly disciplined",
  },
  chesed: {
    shape: "four-sided", walls: "deep blue, with a throne in the east and the forms of crook, orb and sceptre",
    altar: "a four-sided altar of blue stone bearing a crown and a cup", light: "the blue of deep sky",
    sense: "cedar and saffron; the quiet of a great hall",
    presence: "Tzadkiel in blue and violet, royal and benevolent, bearing a sceptre",
  },
  binah: {
    shape: "three-sided", walls: "black, wet as if after rain; a veil before the east that does not lift",
    altar: "a three-sided altar of black stone with a cup of dark water", light: "almost none; a grey pearl-light",
    sense: "myrrh; the smell of the sea; silence",
    presence: "Tzaphkiel, veiled, grave, in black and grey",
  },
  chokmah: {
    shape: "two pillars with no walls", walls: "grey light in every direction, the stars wheeling",
    altar: "a standing stone", light: "starlight, intensely clear",
    sense: "musk; wind",
    presence: "Raziel, a vast bearded figure, hardly to be looked at",
  },
  kether: {
    shape: "none", walls: "white brilliance", altar: "a point of light", light: "pure white", sense: "ambergris; nothing", presence: "Metatron, who is the light itself",
  },
  daath: { shape: "a gap", walls: "none", altar: "none", light: "lavender, uncertain", sense: "vertigo", presence: "none that should be trusted" },
};

/* ─── The paths: guided visualizations ───────────────────────────────────── */
/* Each entry: land (what forms when the door opens), meet (what is customarily encountered and
   how it is tested), gift (what the path customarily gives), life (where its effects show up in
   the integration period, for the journal to watch). The imagery follows the tarot trump and
   the attribution of each path, as the Golden Dawn and Ashcroft-Nowicki use it. */
export const PATH_SCRIPTS = {
  32: { land: "A road of indigo dusk leading from the earth-coloured temple up toward a violet moon. On either side the land is laid out like a great clockwork, fields and rivers moving by law. Above you the sky is the Universe card: a dancing figure within a wreath, the four Kerubic beasts in the corners.",
        meet: "Saturn as an old gatekeeper with a scythe or an hourglass, who asks why you climb. Answer plainly. He may show you the machinery of things turning; look, then show him the letter Tav and walk on. Shadows of your own fears of time and death stand at the roadside; they do not pass the Sign.",
        gift: "The sense of a boundary crossed; the first knowledge that the inner world is as lawful as the outer. Often a mark or a cross given into the hand.",
        life: "Dreams become vivid and ordered. Attention to time, death, limits and routine. Watch for inertia: the vice of Malkuth clinging." },
  31: { land: "The door opens on fire: a path of glowing scarlet-orange cinders climbing through a landscape where everything is being burned down to what it truly is. Above, the Judgement trump: an angel sounding a trumpet, the dead rising from their tombs.",
        meet: "The fire itself speaks. Figures of yourself from the past rise and demand recognition. Greet each in the Sign; those that are true will be judged and released, those that are false will burn. The archangel of fire may test your resolve with heat.",
        gift: "Purification; a settled sense of what must be let go. Sometimes a tongue of flame placed on the brow.",
        life: "Sudden energy; an urge to clear out, confess, finish. Watch for harshness toward others and for burnout." },
  30: { land: "A sunlit path of orange and gold between two walls, children playing beyond a low wall, a great Sun rising above with a face. Everything is clear, named and understood. The Sun trump.",
        meet: "A child who knows your name and asks you riddles; the Sun itself as a shining figure who shows you the truth about some matter you have been avoiding. Test both with Resh; the true Sun does not dazzle, it clarifies.",
        gift: "Clarity and joy; the ability to say what is so. A ray of the Sun placed in the heart.",
        life: "Clear thinking, better speech and writing; honesty surfaces. Watch for intellectual pride (Hod's shadow) and glib cleverness." },
  29: { land: "A crimson twilight path winding down to a pool and up again through marshland under a waning moon; a crayfish crawls from the water; two dogs howl between two towers. The Moon trump. Nothing is quite what it seems.",
        meet: "Phantoms, half-seen animals, memories from before words, old fears of the dark. Hold the letter Qoph high and keep to the path; the ground beside it is not solid. A guide in the shape of a dog or a jackal may walk beside you if it passes the Sign.",
        gift: "Knowledge of your own body's deep instincts; sometimes a night-vision that persists. The gift is often given as a shell or a stone from the pool.",
        life: "Strong dreams, bodily changes, emotional tides. Watch for self-deception, dependence and sentimentality." },
  28: { land: "A violet night under a vast sky of stars; a naked figure pours water from two vessels onto land and lake; an ibis in a tree. The Star trump. The air is cool and hopeful.",
        meet: "The Star-maiden, who gives water to drink. Test her with Tzaddi before you drink; the true water is clear and tastes of nothing. Eagles or birds that call you to look up.",
        gift: "Hope; a meditation that comes easily afterwards; a sense of the natural world as kin.",
        life: "Steadiness, generosity, new friendships. Watch for daydreaming and promises not kept." },
  27: { land: "A scarlet path between two hills; on one a tower is struck by lightning and its crown falls, figures leaping from it. The Tower trump. Thunder. Everything false is coming down.",
        meet: "Mars as a figure in armour with a hammer; the lightning itself; voices from the falling tower that are your own fixed ideas. Stand firm with Peh and let the tower fall; do not try to hold it up.",
        gift: "Release from a structure of thought that was prison. Energy that was locked in it. Often a spark or a piece of the shattered stone.",
        life: "Arguments, breakthroughs, sudden decisions. Watch for anger spent in the wrong place, for destructiveness, for words that wound." },
  26: { land: "An indigo cave path going down before it goes up; a great goat-headed figure on a black cube, two chained figures before it who could step out of their chains at any time. The Devil trump. The air is heavy and strangely funny.",
        meet: "The guardian of the cave, horned, who shows you what you are bound to and laughs. Do not argue; show Ayin, the Eye, and look clearly at the chains. They are loose. Step out.",
        gift: "Freedom from a compulsion seen for what it is; earthy humour; the strength of matter rightly used.",
        life: "Appetites surface and can be governed; practical ambition. Watch for materialism, cynicism and the sense that nothing is sacred." },
  25: { land: "A blue path along a river at evening between two mountains; a great winged figure pours water from cup to cup, one foot on land, one in the stream; a rainbow; a crown on the far peak. Temperance. The air hums like a drawn bowstring.",
        meet: "The angel of Temperance who tests you by pouring the two streams of your nature together to see if they mix. Give the Sign of Samekh. An archer may fire past you toward the Sun; follow the arrow with your eye, not your feet, until the path turns toward it.",
        gift: "Equilibrium; the sense of being aimed; the first glimpse of the gold of Tiphareth. Often an arrow or a cup.",
        life: "A calming of extremes; discipline that feels like relief. This is the Path of Probation: expect to be tested in ordinary life on patience and temperance." },
  24: { land: "A blue-green path through a dark field where a skeleton reaps; beyond, a river, a boat, a rising sun between two towers. Death. The scorpion, the serpent and the eagle move in turn.",
        meet: "Death himself, who asks what you will put down. Name it and lay it down; show Nun. The eagle may carry you a stretch of the road if you can bear to be carried.",
        gift: "Transformation; the end of some old self. Often a seed or an egg given into the hand.",
        life: "Endings in the outer world, sexual and emotional intensity, grief that cleans. Watch for morbidity and the urge to force endings." },
  23: { land: "A deep blue path that becomes water; you walk into it and breathe; a figure hangs by one foot from a living tree, serene, head downward, light around his head. The Hanged Man. Everything is reversed and slow.",
        meet: "The Hanged One, who will not speak but shows you the world upside down. Give Mem. The waters themselves hold you. Do not struggle; the path is crossed by surrender.",
        gift: "Stillness; reversal of a fixed viewpoint; a baptism. Often a drop of water that does not fall.",
        life: "A season of pause and acceptance; heightened intuition. Watch for passivity, martyrdom and the temptation to stay suspended." },
  22: { land: "An emerald path of perfect level, flagstones laid straight; a crowned woman seated between two pillars holds sword and scales. Justice. Every sound returns exactly.",
        meet: "Justice weighs something of yours. Give Lamed and let it be weighed; the scales do not lie. Figures from your past to whom you owe or who owe you.",
        gift: "Balance restored; a debt named and paid; a steady will. Often a feather or a small weight.",
        life: "Decisions, legal or financial matters, karmic settlements. Watch for self-righteousness and coldness." },
  21: { land: "A violet path climbing a slope to a great turning wheel with figures rising and falling on it; a sphinx seated atop; the four beasts in the corners of the sky. Wheel of Fortune. The ground itself seems to turn.",
        meet: "The Sphinx, who asks the riddle; the wheel, which tries to carry you round. Give Kaph, stand at the hub. The hub does not turn.",
        gift: "Understanding of cycles; good fortune accepted without grasping. Often a small wheel or a coin.",
        life: "Changes of fortune, opportunity, expansion. Watch for gambling, greed and complacency (the vice of Chesed)." },
  20: { land: "A yellowish-green path up a mountain in starlight; an old man in a hood with a lamp and a staff goes before you. The Hermit. Silence and cold clear air.",
        meet: "The Hermit, who will show the lamp but not his face until Yod is given. He may lead or may stand aside; he does not speak much. Your own wish for an audience falls away on this path.",
        gift: "The lamp: a will that goes on alone. Patience. Often a grain of wheat.",
        life: "Withdrawal, concentration, detail work done well. Watch for isolation, fussiness and self-denial that is pride." },
  19: { land: "A greenish-yellow path in full sun; a woman gently closes the jaws of a lion, a chain of roses between them; a lemniscate above her head. Strength. Heat; the smell of a summer field.",
        meet: "The lion, who is your own force, and the woman, who is the way it is tamed: by gentleness, not by fear. Give Teth. If the lion roars at you, do not run.",
        gift: "Command of the serpent-power of the body; courage without violence. Often a rose.",
        life: "Vitality, confidence, sexual energy governed. Watch for domination and showing off." },
  18: { land: "An amber path over which a canopied chariot drawn by two sphinxes, one black, one white, waits; a city behind, a river before; the charioteer in armour holds no reins. The Chariot. The sea is near.",
        meet: "The Charioteer, who asks you to mount and drive by will alone. Give Cheth; the sphinxes obey the letter. The walls of the chariot are the walls of your own guarded self.",
        gift: "Containment; the Grail cup is carried on this path, veiled. Often a shell or a cup.",
        life: "Protection, boundaries, the ability to carry something precious quietly. Watch for defensiveness and rigidity." },
  17: { land: "An orange path across a meadow where two figures stand beneath an angel in the sun, a tree of flames and a tree of fruit behind them, a serpent in one tree. The Lovers. Everything is twinned.",
        meet: "Your own other half as an image, and the angel who joins; a tempter who offers choice. Give Zayin, the sword, which divides the true from the plausible. Choose, and know you chose.",
        gift: "Discrimination between opposites and their union; often a sword or a pair of rings.",
        life: "Relationships, choices, a sharpening of mind. Watch for indecision, duplicity and splitting." },
  16: { land: "A red-orange path to a high stone seat between two pillars where a crowned priest raises his hand in blessing, two ministers kneeling before him, crossed keys at his feet. The Hierophant. A bull lows somewhere.",
        meet: "The Hierophant, who teaches by showing and asks for obedience rightly placed. Give Vav. He may hand you the keys; take only the one that fits your door.",
        gift: "Tradition rightly received; the inner teacher met. Often a key.",
        life: "Study, teaching, patience, slow building. Watch for dogmatism, stubbornness and over-eating (Taurus's shadow)." },
  15: { land: "A scarlet path up a rocky slope to a throne carved with rams' heads, on which a crowned emperor sits in armour with orb and sceptre, a mountain and a river behind. The Emperor. Dawn, red and cold.",
        meet: "The Emperor, who asks by what authority you climb. Give Heh, the Window, through which the Father looks at the Son. Rams may charge; stand.",
        gift: "Authority, order, the power to begin. Often a sceptre or a seed of fire.",
        life: "Initiative, leadership, structure brought to chaos. Watch for tyranny and impatience." },
  14: { land: "An emerald path through a garden that is a whole country: ripe wheat, a waterfall, a shield with the sign of Venus, and on a throne a crowned pregnant woman with stars in her crown. The Empress. Birdsong, sweetness.",
        meet: "The Empress, Mother of all forms, who gives without asking. Give Daleth, the Door, through which everything is born. You may be shown the door through which you came into life.",
        gift: "Fertility, love, the union of force and form. Often a fruit.",
        life: "Creativity, nurture, abundance. Watch for over-indulgence and smothering." },
  13: { land: "A blue path, the longest, straight up across the Abyss on a bridge of moonlight; the High Priestess seated between the black and white pillars with the veil of pomegranates behind her, the Book on her lap, the moon at her feet. Silence absolute.",
        meet: "The Priestess, who says nothing and shows the Book without opening it. Give Gimel, the Camel that crosses the desert. The bridge is narrow; look at her, not down.",
        gift: "Memory of what you have always known; a virginity of mind. Often a veil or a pearl.",
        life: "Deep intuition, silence, a need for solitude. Watch for coldness and for refusing to come back down." },
  12: { land: "A yellow path of brilliant light to a table on which lie cup, sword, wand and disc; a figure stands with one hand raised to heaven and one pointed to earth, a lemniscate above. The Magician. Everything is alert.",
        meet: "The Magician, who is Mercury and who may be yourself. Give Beth, the House. He shows you the four weapons and asks which you have earned.",
        gift: "Skill, speech, the knowledge that will directs form. Often a wand.",
        life: "Mental quickness, communication, craft. Watch for trickery and restlessness." },
  11: { land: "A pale yellow path into open air; a youth with a bag and a white rose steps toward a cliff edge, a small dog at his heel, the sun behind. The Fool. Wind. No ground is needed.",
        meet: "The Fool, who is the breath before creation, and who asks nothing because nothing is lacking. Give Aleph, the Ox. If you fear the fall, you are not yet on this path; return and come again.",
        gift: "Innocence that has passed through experience; the spirit free. There is no object given; the gift is the air.",
        life: "Lightness, trust, beginnings. Watch for folly, dissociation and unreality." },
};

/* Journal fields that the Guide pre-fills; kept here so both tabs agree. */
export const PROTECTION_STEPS = [
  { key: "cross", label: "Kabbalistic Cross (opening)" },
  { key: "middle", label: "Middle Pillar beforehand" },
  { key: "pentagram", label: "Pentagram traced on the door" },
  { key: "lamp", label: "Letter carried as lamp; Sign used" },
  { key: "seal", label: "Door sealed on return" },
  { key: "lbrp", label: "Banishing (LBRP) at close" },
  { key: "ground", label: "Grounded: food, drink, stamp, name" },
];

export const JOURNAL_MATERIALS = [
  "Candle(s) in the colour of the path or Sephirah", "Incense of the Sephirah", "Altar / table and cloth", "Robe or dedicated clothing",
  "Tarot trump of the path, displayed", "Salt, water, feather, flame (the four elements)", "Wand or pointing hand", "Journal and pen ready",
  "Phone silenced, door locked", "Water and food for afterwards",
];
