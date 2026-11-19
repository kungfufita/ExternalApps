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
| **Guide** | A seven-step pathworking for any path — grounding, the temple of departure, the door and letter, the journey, the temple of arrival, return, and closing — with suggested timings, auto-advance, a box-breathing pacer, and a private on-device journal. The model lights the relevant Sephiroth and path at every step. |

Correspondences follow the Hermetic (Golden Dawn) attribution of the Tree. The app is a
visual aid for practice, not a substitute for study or a teacher.

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
app.js                 UI controller: tabs, players, Names browser, guide, share/install
tree.js                Three.js scene: Sephiroth, paths, Lightning Flash, Serpent, Shem ring
data.js                Correspondences and the Shem HaMephorash derivation
sw.js                  Offline-first service worker
manifest.webmanifest   PWA manifest
icons/                 SVG icons (any + maskable) and the iOS touch icon
vendor/                three.module.min.js and its licence
```
