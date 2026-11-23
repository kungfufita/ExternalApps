/* Pathworking — the Tarot.
   The 22 trumps on the 22 paths, the 40 pips on the Sephiroth in the four Worlds, and the
   16 court cards on the letters of the Name. Esoteric titles and decans follow the Golden
   Dawn (Book T) as tabulated in 777; divinatory meanings are the common Rider–Waite tradition. */

export const MAJORS = [
  { num: 0, roman: "0", name: "The Fool", path: 11, title: "The Spirit of the Aether",
    upright: "Beginning, innocence, the leap of faith, freedom, the unconditioned.", reversed: "Folly, recklessness, refusal to commit, a leap taken blind.",
    secret: "The Fool is numbered zero because he is before and after the whole sequence: the breath (Aleph, air) that has not yet become a word. The secret is that the end of the Great Work and its beginning are the same innocence, the second time with eyes open." },
  { num: 1, roman: "I", name: "The Magician", path: 12, title: "The Magus of Power",
    upright: "Skill, will directed, the tools at hand, communication, beginning with intent.", reversed: "Trickery, misuse of skill, scattered will, manipulation.",
    secret: "On the table lie the four weapons of the four Worlds. One hand points up and one down: 'as above, so below'. The secret is that magic is not power over things but the alignment of the four Worlds in one act." },
  { num: 2, roman: "II", name: "The High Priestess", path: 13, title: "The Priestess of the Silver Star",
    upright: "Intuition, hidden knowledge, silence, the unconscious, patience.", reversed: "Secrets withheld, surface knowledge, repression, gossip.",
    secret: "Her path crosses the Abyss by the Middle Pillar. The scroll on her lap is the Torah half-hidden; the veil behind her is the veil of Paroketh. The secret is memory: what the soul knew before it descended." },
  { num: 3, roman: "III", name: "The Empress", path: 14, title: "The Daughter of the Mighty Ones",
    upright: "Fertility, abundance, nurture, creativity, nature, the mother.", reversed: "Smothering, dependence, creative block, indulgence.",
    secret: "Daleth, the Door, between Wisdom and Understanding: the door through which all form is born. The secret is that love is the mechanism of creation, not its ornament." },
  { num: 4, roman: "IV", name: "The Emperor", path: 15, title: "Sun of the Morning, Chief among the Mighty",
    upright: "Authority, structure, order, the father, stability.", reversed: "Tyranny, rigidity, domination, weakness disguised as force.",
    secret: "Heh, the Window: the Father sees the Son through it. Aries, the first fire of the year. The secret is that authority is sight, and the right to rule is the willingness to look." },
  { num: 5, roman: "V", name: "The Hierophant", path: 16, title: "The Magus of the Eternal",
    upright: "Tradition, teaching, initiation, conformity for the sake of transmission.", reversed: "Dogma, hypocrisy, rebellion, the letter without the spirit.",
    secret: "Vav, the Nail, which fastens heaven to earth. The crossed keys are the keys of the inner and outer teaching. The secret is the one the tradition keeps best: that it has a secret, passed mouth to ear, that cannot be written." },
  { num: 6, roman: "VI", name: "The Lovers", path: 17, title: "The Children of the Voice, the Oracle of the Mighty Gods",
    upright: "Union, choice, harmony, relationship, the alignment of opposites.", reversed: "Disharmony, indecision, misalignment, temptation.",
    secret: "Zayin, the Sword, divides to unite. In the older image a youth stands between two women while Cupid aims. The secret is discrimination: love is a choice made with the sword." },
  { num: 7, roman: "VII", name: "The Chariot", path: 18, title: "The Child of the Powers of the Waters, the Lord of the Triumph of Light",
    upright: "Victory by will, control, determination, movement, the vehicle held together.", reversed: "Loss of control, aggression, scattered forces, the chariot overturned.",
    secret: "Cheth, the Fence. The charioteer holds no reins; the sphinxes are driven by will. Beneath the canopy the Grail is carried, veiled. The secret is that the body is the chariot and the Cup is what it carries." },
  { num: 8, roman: "VIII", name: "Strength", path: 19, title: "The Daughter of the Flaming Sword",
    upright: "Courage, gentleness governing force, patience, vitality.", reversed: "Weakness, force misused, self-doubt, the beast loose.",
    secret: "Teth, the Serpent, on the path between Mercy and Severity. The woman closes the lion's mouth with flowers. The secret is that the serpent-power of the body is tamed by love, never by fear; and that Strength and Justice were exchanged in numbering so that Leo should fall on this path." },
  { num: 9, roman: "IX", name: "The Hermit", path: 20, title: "The Prophet of the Eternal, the Magus of the Voice of Power",
    upright: "Solitude, inner guidance, the search, prudence, the teacher within.", reversed: "Isolation, withdrawal, loneliness, refusal of counsel.",
    secret: "Yod, the Hand, the smallest letter from which all others are formed. The lamp holds a six-pointed star. The secret is that the seed of the whole Name is carried alone, in the dark, by a hand that asks nothing." },
  { num: 10, roman: "X", name: "Wheel of Fortune", path: 21, title: "The Lord of the Forces of Life",
    upright: "Change, cycles, fortune turning, destiny, expansion.", reversed: "Bad luck, resistance to change, the wheel stuck.",
    secret: "Kaph, the Palm, in which fortune is read. The letters on the wheel spell both TARO and ROTA, and the Name. The secret is the hub: the one who stands at the centre is not turned." },
  { num: 11, roman: "XI", name: "Justice", path: 22, title: "The Daughter of the Lords of Truth, the Ruler of the Balance",
    upright: "Balance, truth, fairness, cause and effect, a decision.", reversed: "Injustice, dishonesty, imbalance, a debt unpaid.",
    secret: "Lamed, the Ox-goad, the longest letter, which drives Aleph the Ox. Libra on the path from Severity to Beauty. The secret is that karma is not punishment but weight, and that the scales are the Middle Pillar." },
  { num: 12, roman: "XII", name: "The Hanged Man", path: 23, title: "The Spirit of the Mighty Waters",
    upright: "Surrender, suspension, reversal of viewpoint, sacrifice, waiting.", reversed: "Stalling, martyrdom, resistance, pointless sacrifice.",
    secret: "Mem, Water, one of the three mother letters. The figure is serene; his head is lit. The secret is baptism: the ego drowned so that the self can breathe." },
  { num: 13, roman: "XIII", name: "Death", path: 24, title: "The Child of the Great Transformers, the Lord of the Gate of Death",
    upright: "Transformation, ending, release, the necessary close.", reversed: "Resistance to change, stagnation, decay that will not finish.",
    secret: "Nun, the Fish, which lives in the water of Mem and is the sign of the Messiah. Scorpio: scorpion, serpent, eagle. The secret is that putrefaction is the first stage of the Work, and that nothing is reborn that has not been allowed to die." },
  { num: 14, roman: "XIV", name: "Temperance", path: 25, title: "The Daughter of the Reconcilers, the Bringer-forth of Life",
    upright: "Balance, moderation, patience, the blending of opposites, alchemy.", reversed: "Excess, imbalance, impatience, the mixture that will not take.",
    secret: "Samekh, the Prop, on the Middle Pillar from Yesod to Tiphareth: the path of the arrow. The angel pours between two cups without spilling. The secret is that this is the path of probation, and the way to the Sun is through the mixing of what you are." },
  { num: 15, roman: "XV", name: "The Devil", path: 26, title: "The Lord of the Gates of Matter, the Child of the Forces of Time",
    upright: "Bondage, materialism, appetite, the shadow, the chains that are loose.", reversed: "Release, breaking free, seeing the chain for what it is.",
    secret: "Ayin, the Eye. Capricorn, the goat that climbs. The chains on the two figures are loose enough to lift off. The secret is that the Devil is matter seen without the eye of the spirit, and that he laughs because the joke is on no one but ourselves." },
  { num: 16, roman: "XVI", name: "The Tower", path: 27, title: "The Lord of the Hosts of the Mighty",
    upright: "Sudden upheaval, revelation, the false structure falling, release.", reversed: "Disaster averted or prolonged, fear of change, the tower propped up.",
    secret: "Peh, the Mouth, on the path between Netzach and Hod: the word that breaks the prison of the mind. Mars. The secret is that the Tower is the House of God (Beth) struck by its own lightning, and that the fall is a liberation." },
  { num: 17, roman: "XVII", name: "The Star", path: 28, title: "The Daughter of the Firmament, the Dweller between the Waters",
    upright: "Hope, inspiration, renewal, serenity, guidance.", reversed: "Despair, lack of faith, disconnection, a hope misplaced.",
    secret: "Tzaddi, the Fish-hook. Aquarius, the water-bearer. She pours onto land and water alike. The secret is that the Star is the soul's own star, Binah's light reaching the astral, and that hope is a faculty rather than a feeling." },
  { num: 18, roman: "XVIII", name: "The Moon", path: 29, title: "The Ruler of Flux and Reflux, the Child of the Sons of the Mighty",
    upright: "Illusion, the unconscious, dreams, the uncertain path, instinct.", reversed: "Confusion lifting, fear released, deception exposed.",
    secret: "Qoph, the Back of the Head, where the oldest brain lives. Pisces. The crayfish climbs from the pool; the dogs howl; the path winds between towers. The secret is that this path from Malkuth to Netzach is walked in the dark of the body, and that its guide is instinct rightly trusted." },
  { num: 19, roman: "XIX", name: "The Sun", path: 30, title: "The Lord of the Fire of the World",
    upright: "Joy, clarity, success, vitality, truth made visible.", reversed: "Clouded joy, vanity, a truth refused, burnout.",
    secret: "Resh, the Head. The Sun with a face; the child on the horse; the wall. The secret is that the Sun's light here is the light of Tiphareth reflected into Hod: clear thought is sunlight, and the child is the reborn self." },
  { num: 20, roman: "XX", name: "Judgement", path: 31, title: "The Spirit of the Primal Fire",
    upright: "Awakening, the call, renewal, reckoning, absolution.", reversed: "Self-doubt, refusal of the call, judgement withheld or harsh.",
    secret: "Shin, Fire, the mother letter; the tooth that devours. The trumpet raises the dead. The secret is that the three flames of Shin set within YHVH make YHShVH, the Pentagrammaton, the Name of the Redeemer; this path from Malkuth to Hod is the first fire of initiation." },
  { num: 21, roman: "XXI", name: "The World (The Universe)", path: 32, title: "The Great One of the Night of Time",
    upright: "Completion, integration, the whole, travel, accomplishment.", reversed: "Incompletion, delay, the circle unclosed.",
    secret: "Tav, the Cross, the last letter, Saturn and Earth. The dancer within the wreath, the four beasts at the corners. The secret is that this is the first path of the Serpent and the last of the Flash: the end of the descent and the beginning of the return, the door of Malkuth." },
];
export const MAJOR_BY_PATH = Object.fromEntries(MAJORS.map(m => [m.path, m]));

export const SUITS = [
  { key: "wands", name: "Wands", world: "atziluth", element: "Fire", letter: "Yod", color: "#f03a3a", sign: "△", concerns: "will, energy, enterprise, the spirit" },
  { key: "cups", name: "Cups", world: "briah", element: "Water", letter: "Heh", color: "#2f6fd6", sign: "▽", concerns: "feeling, love, the heart, the soul" },
  { key: "swords", name: "Swords", world: "yetzirah", element: "Air", letter: "Vav", color: "#f7f3b0", sign: "△", concerns: "thought, conflict, the mind, decision" },
  { key: "pentacles", name: "Pentacles", world: "assiah", element: "Earth", letter: "Heh (final)", color: "#8a7a3a", sign: "▽", concerns: "body, money, work, the material result" },
];

/* Pips 2–10: Golden Dawn titles and decans (planet in sign). Index 0 = Two. */
const PIPS = {
  wands: [["Dominion", "Mars in Aries"], ["Established Strength", "Sun in Aries"], ["Perfected Work", "Venus in Aries"], ["Strife", "Saturn in Leo"], ["Victory", "Jupiter in Leo"], ["Valour", "Mars in Leo"], ["Swiftness", "Mercury in Sagittarius"], ["Great Strength", "Moon in Sagittarius"], ["Oppression", "Saturn in Sagittarius"]],
  cups: [["Love", "Venus in Cancer"], ["Abundance", "Mercury in Cancer"], ["Blended Pleasure", "Moon in Cancer"], ["Loss in Pleasure", "Mars in Scorpio"], ["Pleasure", "Sun in Scorpio"], ["Illusionary Success", "Venus in Scorpio"], ["Abandoned Success", "Saturn in Pisces"], ["Material Happiness", "Jupiter in Pisces"], ["Perfected Success", "Mars in Pisces"]],
  swords: [["Peace Restored", "Moon in Libra"], ["Sorrow", "Saturn in Libra"], ["Rest from Strife", "Jupiter in Libra"], ["Defeat", "Venus in Aquarius"], ["Earned Success", "Mercury in Aquarius"], ["Unstable Effort", "Moon in Aquarius"], ["Shortened Force", "Jupiter in Gemini"], ["Despair and Cruelty", "Mars in Gemini"], ["Ruin", "Sun in Gemini"]],
  pentacles: [["Harmonious Change", "Jupiter in Capricorn"], ["Material Works", "Mars in Capricorn"], ["Earthly Power", "Sun in Capricorn"], ["Material Trouble", "Mercury in Taurus"], ["Material Success", "Moon in Taurus"], ["Success Unfulfilled", "Saturn in Taurus"], ["Prudence", "Sun in Virgo"], ["Material Gain", "Venus in Virgo"], ["Wealth", "Mercury in Virgo"]],
};
const ACES = { wands: "the Root of the Powers of Fire", cups: "the Root of the Powers of Water", swords: "the Root of the Powers of Air", pentacles: "the Root of the Powers of Earth" };
const SEPH_ORDER = ["kether", "chokmah", "binah", "chesed", "geburah", "tiphareth", "netzach", "hod", "yesod", "malkuth"];
const NUM_WORDS = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const COURTS = [
  { rank: "King (Knight)", letter: "Yod", sub: "Fire", world: "atziluth", seph: "chokmah", note: "the swift, initiating force of the suit; rules the last decan of one sign and the first two of the next" },
  { rank: "Queen", letter: "Heh", sub: "Water", world: "briah", seph: "binah", note: "the receptive, forming power of the suit; the throne" },
  { rank: "Prince (Knight)", letter: "Vav", sub: "Air", world: "yetzirah", seph: "tiphareth", note: "the suit in motion, the son of the King and Queen; the chariot" },
  { rank: "Princess (Page)", letter: "Heh (final)", sub: "Earth", world: "assiah", seph: "malkuth", note: "the suit brought to earth; the throne of the Ace, ruling a quadrant of the heavens about the North Pole" },
];

export function buildMinors() {
  const cards = [];
  for (const s of SUITS) {
    cards.push({ id: `${s.key}-1`, suit: s.key, num: 1, name: `Ace of ${s.name}`, title: ACES[s.key], seph: "kether", world: "atziluth", decan: "—", kind: "ace",
      meaning: `The pure ${s.element} of ${s.element}: the seed of ${s.concerns}, before any shape.` });
    PIPS[s.key].forEach(([title, decan], i) => {
      const n = i + 2;
      const world = n <= 3 ? "briah" : n <= 9 ? "yetzirah" : "assiah";
      cards.push({ id: `${s.key}-${n}`, suit: s.key, num: n, name: `${NUM_WORDS[n - 1]} of ${s.name}`, title: `Lord of ${title}`, seph: SEPH_ORDER[n - 1], world, decan, kind: "pip",
        meaning: `${s.element} in ${SEPH_ORDER[n - 1][0].toUpperCase() + SEPH_ORDER[n - 1].slice(1)}: ${title.toLowerCase()} in the matter of ${s.concerns}. Decan ${decan}.` });
    });
    COURTS.forEach(c => {
      cards.push({ id: `${s.key}-${c.rank.split(" ")[0].toLowerCase()}`, suit: s.key, num: 0, name: `${c.rank} of ${s.name}`, title: `${c.sub} of ${s.element}`, seph: c.seph, world: c.world, decan: c.letter, kind: "court",
        meaning: `${c.letter} of the Name in the suit of ${s.element}: ${c.note}.` });
    });
  }
  return cards;
}

export const TAROT_USES = [
  { title: "The trumps as the doors of the paths", src: ["gd", "knight"],
    text: "Each of the twenty-two trumps hangs above the door of its path in the Guide. Before a pathworking, set the physical card where you can see it and study it until you can close your eyes and see it whole; then let it become the door. The images on the card are the landscape of the path in compressed form, and whatever you meet there will carry the card's symbols." },
  { title: "Meditation on a single card", src: ["fortune", "knight"],
    text: "Sit with the card at eye level. Breathe the square breath. Enter the card as if it were a window: step over the frame, walk among its figures, ask the central figure one question, and return over the frame. Write what was said. This is pathworking in miniature and the safest practice for a beginner." },
  { title: "The pips as the Sephiroth in the four Worlds", src: ["gd", "crowley"],
    text: "The forty pips are the ten Sephiroth seen in the four Worlds: Aces in Atziluth, Twos and Threes in Briah, Fours to Nines in Yetzirah, Tens in Assiah. Laid out as four Trees they form Jacob's Ladder. To study a Sephirah, lay its four cards side by side and read the same force in fire, water, air and earth." },
  { title: "The court cards as the letters of the Name", src: ["gd"],
    text: "Sixteen court cards are the four letters of YHVH in each of the four elements: King (Yod, fire), Queen (Heh, water), Prince (Vav, air), Princess (final Heh, earth). They describe people, and the four stages of any force: initiating, receiving, moving, grounding." },
  { title: "Divination: how a reading is made", src: ["gd", "waite"],
    text: "Shuffle while holding the question; cut; lay the cards in a fixed pattern. The Tree of Life spread places ten cards on the ten Sephiroth and reads the question as a descent from cause (Kether) to outcome (Malkuth). The Golden Dawn's Opening of the Key is longer and uses the four suits as the four Worlds. The common Celtic Cross reads situation, crossing, root, past, crown, near future, self, environment, hopes and fears, outcome. A reading is a mirror of the Yetziratic pattern around the question; it does not fix the future, it shows the shape of the present." },
  { title: "The Tarot as a book", src: ["papus", "crowley"],
    text: "The tradition calls the Tarot the Book of Thoth: seventy-eight leaves that can be read in any order. The twenty-two trumps are the twenty-two letters; the four suits are the four Worlds and the four letters of the Name; the ten numbers are the ten Sephiroth. Taken together the pack is the Tree of Life in a form that can be shuffled, and so it is the Tree's own teaching device: every reading is a rearrangement of the one pattern." },
];

export const TAROT_SECRET = {
  title: "The hidden teaching and those entrusted with it",
  text: [
    "The esoteric tradition holds that the Tarot is a book of the ancient wisdom disguised as a game so that it could survive the loss of the temples. In this account the images were carried out of Egypt, or out of the East, and entrusted to a wandering people who did not need to understand them to preserve them: the Romani, called in the old books 'the Gypsies' and 'the Bohemians'. Card by card, hand to hand, through fairs and fortune-telling, the pack kept its pictures while its meaning slept. This is the teaching of Court de Gébelin (1781), of Vaillant, who lived among the Romani and wrote of their lore (1857), and of Papus, whose Tarot of the Bohemians (1889) laid the pack on the Tree of Life and the Name.",
    "The Hermetic schools received it from them. Éliphas Lévi matched the twenty-two trumps to the twenty-two letters; the Golden Dawn fixed the attributions used in this app and gave each trump its esoteric title; Waite and Crowley drew the decks that carry them. What the tradition says was entrusted and kept is this: that the pack is the Tree, that the trumps are the paths, that the four suits are the four Worlds, and that a person holding the cards is holding a map of their own soul, whether or not they know it.",
    "The historical record, which the serious student should also know, finds the first tarot packs in northern Italy in the fifteenth century as a game, and the Romani connection first written down in the eighteenth and nineteenth. The two accounts need not quarrel: a symbol is not less true for being adopted, and the fortune-tellers at the fair did keep the pictures alive for three hundred years before anyone wrote the Tree beside them. What matters for practice is that the correspondences work: the trumps open the paths, and the paths answer to the trumps.",
    "The 'secrets' the cards are said to hold are not passwords. They are the correspondences themselves, which the pictures encode for anyone who learns to read them: the letter in the image (the Fool's bag and the Ox of Aleph; the Hanged Man's crossed leg; the Hermit's lamp), the number, the colour, the position on the Tree. The hidden thing is in plain sight, which is the Hermetic way of hiding. Each trump in this tab lists what its image conceals.",
  ],
};

export const TAROT_SOURCES = [
  { key: "gd", cite: "Golden Dawn, Book T (in Regardie, The Golden Dawn)" },
  { key: "crowley", cite: "Aleister Crowley, The Book of Thoth (1944) and 777" },
  { key: "waite", cite: "A. E. Waite, The Pictorial Key to the Tarot (1910)" },
  { key: "papus", cite: "Papus, The Tarot of the Bohemians (1889); J.-A. Vaillant, Les Rômes (1857); Court de Gébelin, Le Monde primitif (1781)" },
  { key: "fortune", cite: "Dion Fortune, The Mystical Qabalah" },
  { key: "knight", cite: "Gareth Knight, A Practical Guide to Qabalistic Symbolism, vol. II (the paths and the trumps)" },
];
