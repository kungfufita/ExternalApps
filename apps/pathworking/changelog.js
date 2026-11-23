/* Pathworking — revision history.
   Newest first. Each entry: version, date, title, and items tagged
   feature | adjusted | fixed | content. Add a new entry at the top for every release. */

export const APP_VERSION = "1.3.0";

export const CHANGELOG = [
  { version: "1.3.0", date: "2026-11-23", title: "History tab",
    items: [
      { type: "feature", text: "History tab: this revision log, with what was added, adjusted and fixed in each version, and the version shown in the panel footer." },
    ] },
  { version: "1.2.0", date: "2026-11-23", title: "Worlds, Tarot, Jacob's Ladder, session needs and results",
    items: [
      { type: "feature", text: "Worlds tab: the Four Worlds above (Atziluth, Briah, Yetzirah, Assiah) with letter of the Name, element, part of the soul, tarot suit and court, colour scale, partzuf, place in the body, how each is sensed, how they join, and each World's hierarchy for all ten Sephiroth." },
      { type: "feature", text: "The Four Shells below (Nogah, Esh Mitlakachat, Anan Gadol, Ruach Se'arah) with what each reflects, its danger, whether it can be redeemed and how to recognise it in a working; the ten Qliphoth of 777 for recognition only." },
      { type: "feature", text: "Jacob's Ladder on the model: four ghost Trees above and four inverted below, tappable, with camera focus per World; toggle in the Worlds and Tree tabs." },
      { type: "feature", text: "Tarot tab: all 78 cards on the Tree. Trumps with Golden Dawn esoteric titles, upright and reversed meanings and what each image keeps; pips with Book T titles, decans, Sephirah and World; court cards on the letters of the Name. A trump opens its path in the Guide." },
      { type: "content", text: "How the Tarot is used (door-images, card meditation, the four Trees, divination spreads, the pack as a book); the hidden teaching and the tradition that the Romani were entrusted with it, with the historical record alongside; sources." },
      { type: "feature", text: "Journal: each entry lists everything the chosen path's session needed (planetary day, candle colours, incense from 777, trump, letter, Names, Archangels, Cross and banishing words, grounding), grouped, to tick as used; 'mark all used'; logging from the Guide pre-ticks the spoken words." },
      { type: "feature", text: "Journal: effect categories are editable from the dropdown (add your own, manage them); defaults are Dreams, Moods, Coincidences, Health, Money, Relationships, Work." },
      { type: "feature", text: "Journal: results-by-category grid marking each area better, same or worse with a note; shown on the entry card and in the Markdown export." },
      { type: "adjusted", text: "Tabs wrap to two rows on wide screens so all eight fit." },
      { type: "fixed", text: "A World focused on the ladder no longer stays focused when switching to another tab." },
    ] },
  { version: "1.1.0", date: "2026-11-23", title: "The written guide, protective steps and a journal",
    items: [
      { type: "content", text: "Guide: six preparation sections compiled from the standard literature and cited to it: order of operations, dangers (with a 'stop at once' rule), entering the Tree (three visualizations), protection (Kabbalistic Cross, banishing pentagram on every door with stroke-order diagrams, the letter as lamp and Sign, hexagram of arrival, sealing the door, LBRP), integration (rules and the virtues and vices of each Sephirah), sources." },
      { type: "feature", text: "Guided pathworking grows from seven to eleven steps with the protective steps built in; a visualization of each of the ten temples; a scripted landscape, encounter, gift and after-effects for every one of the 22 paths; a running session timer." },
      { type: "feature", text: "Readiness notes under the path picker, read from the journal: warns when the lower Sephirah has not been worked or the last working was under seven days ago." },
      { type: "feature", text: "Journal tab: per-session entries for preparation, protections, spoken word, visualizations, what was met, the journey, what was given, mood before and after, intensity, grounding, dated effects in reality, and an integration check. 'Log this session' pre-fills an entry from the Guide. Filter, sort, JSON and Markdown export, JSON import. Stored on this device only." },
      { type: "adjusted", text: "Desktop panel widened so the tab strip fits; service worker cache bumped so the new files load offline." },
      { type: "fixed", text: "Stroke-number badges on the pentagram diagrams moved toward the start of each stroke so the tracing order reads clearly." },
      { type: "fixed", text: "Stray blank lines at the top of the Markdown export." },
    ] },
  { version: "1.0.0", date: "2026-11-19", title: "First release",
    items: [
      { type: "feature", text: "Interactive 3D Tree of Life: ten Sephiroth and Daath, 22 paths with Hebrew letters, Three Pillars, Four Worlds, correspondences on tap." },
      { type: "feature", text: "Descent: the Lightning Flash from Kether to Malkuth through Daath, and the Middle Pillar, with adjustable travel and rest times." },
      { type: "feature", text: "Ascent: the Serpent of Wisdom (or a Dragon) climbing the 22 paths from the 32nd to the 11th." },
      { type: "feature", text: "72 Names: the Shem HaMephorash derived live from Exodus 14:19–21, as a rotating ring around the Tree, with a derivation view." },
      { type: "feature", text: "Guide: a seven-step pathworking for any path with timings, auto-advance, a box-breathing pacer and on-device notes." },
      { type: "feature", text: "Installable PWA; works offline once loaded; share and install buttons." },
    ] },
];

export const TYPE_LABELS = { feature: "Feature", adjusted: "Adjusted", fixed: "Fixed", content: "Content" };
