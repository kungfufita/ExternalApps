# Pathworking — Tree of Life

A progressive web app (PWA) that assists Kabbalistic pathworking with an interactive
**3D Tree of Life**. It runs in any modern browser on a phone, tablet or laptop, installs
to the home screen, and works offline once loaded. Share the link and anyone can use it.

**Live:** https://kungfufita.github.io/ExternalApps/pathworking/

## What it shows

| Mode | What happens |
| --- | --- |
| **Tree** | The ten Sephiroth (plus hidden Daath), the 22 paths with their Hebrew letters, the Three Pillars and the Four Worlds. Tap any sphere, path or Name for its correspondences: Divine Name, Archangel, choir, sphere, Yetziratic intelligence, colour, tarot trump. |
| **Descent** | The **Lightning Flash** — the Light descends from Kether through every Sephirah to Malkuth, leaping the Abyss through Daath, lighting each channel as it opens. Adjustable travel and rest times so you can breathe with it. A **Middle Pillar** sequence is included too. |
| **Ascent** | The **Serpent of Wisdom** (Nechushtan) rises from Malkuth to Kether, winding through all 22 paths in order from the 32nd (Tav) to the 11th (Aleph). Each path lights as the serpent touches it. Switch the form to a crimson-and-gold **Dragon**. |
| **72 Names** | The **Shem HaMephorash**, derived live from the Hebrew of Exodus 14:19–21 (72 letters per verse, verse 20 read backwards). The Names encircle the Tree as a rotating ring; tap one to bring it forward. A derivation view highlights the three source letters. |
| **Guide** | The written guide and an eleven-step pathworking for any path. Six preparation sections, compiled from the standard literature and cited to it: **Order of operations** (foundation practice, enter at Malkuth, paths from the bottom one at a time, return the same way, integrate before moving on), **Dangers** (when not to work, ungroundedness, inflation, Sephirothic imbalance, intrusions, and when to stop at once), **Entering the Tree** (three creative visualizations: the Temple of Malkuth, the Living Tree, the Door and the Letter), **Protection** (the Kabbalistic Cross, the Banishing Pentagram of Earth traced on every door with stroke-order diagrams, the letter carried as lamp and Sign, the hexagram of arrival, sealing the door on return, the Lesser Banishing Ritual), **Integration** (rules for the period between paths and Dion Fortune's virtues and vices of each Sephirah as the gauge) and **Sources**. The guided pathworking itself includes a visualization of each temple, a scripted landscape, encounter, gift and after-effects for every one of the twenty-two paths, and protective steps built in: Kabbalistic Cross, pentagram on the door, sealing, banishing. Readiness notes drawn from the journal warn when the lower Sephirah has not been worked or a path was worked fewer than seven days ago. Suggested timings, auto-advance and a box-breathing pacer. |
| **Journal** | A tracking tab, kept on this device. Each entry records the preparation (materials, tools, place, state, conditions), the protections used, the spoken word (intention, Names vibrated), the visualizations built, what was met and how it answered the Sign, the journey, what was given, mood before and after, intensity, grounding, and a dated list of **effects in reality** to be added in the days that follow. An integration section asks where the virtue and vice of the Sephirah reached showed in ordinary life and whether you are ready to proceed. "Log this session" in the Guide pre-fills an entry from the pathworking just completed. Filter and sort by path; export as JSON or Markdown; import a JSON export. |

Correspondences follow the Hermetic (Golden Dawn) attribution of the Tree. The method in the
guide is a digest of Dion Fortune (*The Mystical Qabalah*, *Psychic Self-Defence*), Israel
Regardie (*The Middle Pillar*, *The Golden Dawn*), Gareth Knight (*A Practical Guide to
Qabalistic Symbolism*), Dolores Ashcroft-Nowicki (*The Shining Paths*), the Ciceros and
Crowley's *777*; each section names its sources. The app is a visual aid for practice, not a
substitute for study or a teacher.

## Running locally

It is a static app — serve the folder over HTTP(S):

```bash
cd apps/pathworking
python3 -m http.server 8080
# open http://localhost:8080
```

Three.js (MIT) is vendored in `vendor/` so the whole app, including the 3D engine, is
cached by the service worker and runs offline.

## Files

```
index.html             App shell and panel markup
styles.css             Dark theme; bottom sheet on phones, side panel on laptops
app.js                 UI controller: tabs, players, Names browser, guide, journal, share/install
tree.js                Three.js scene: Sephiroth, paths, Lightning Flash, Serpent, Shem ring
data.js                Correspondences and the Shem HaMephorash derivation
guide.js               The written guide: order of operations, dangers, entering, protection,
                       integration, the temples, per-path visualizations, sources
sw.js                  Offline-first service worker
manifest.webmanifest   PWA manifest
icons/                 SVG icons (any + maskable) and the iOS touch icon
vendor/                three.module.min.js and its licence
```
