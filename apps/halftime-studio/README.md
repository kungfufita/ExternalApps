# HalfTime Studio

An AI-assisted remix workstation for Windows. It **generates original electronic backing
tracks** (trance, progressive, psy) entirely from synthesis, and **mixes in vocals from audio
files you own**: separates the vocal, detects its tempo and key, time-stretches it to
half-time, and lets you drop labelled regions onto a bar grid with chops, stutters, delays
and reverb throws. A chat panel powered by Claude turns plain-English requests into project
edits.

> **Status:** Phase 2 of 6 — project model, generator engine, and the desktop workstation
> (timeline, transport, mixer, section preview). Vocal import, the AI assistant, export and
> the installer follow in phases 3–6.

## Install (developer, any OS)

Python 3.11 or newer.

```bash
cd apps/halftime-studio
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements-dev.txt
pytest
```

The full application (GUI, vocal separation, AI assistant) adds the heavier dependencies:

```bash
pip install torch --index-url https://download.pytorch.org/whl/cu121   # NVIDIA GPU; skip for CPU
pip install -r requirements-app.txt
```

Start the workstation with:

```bash
python -m app
```

End users will get a normal Windows installer (phase 6) with ffmpeg and Rubber Band bundled;
the Demucs model downloads on first use.

### The workstation (phase 2)

* **Start screen** — pick a style preset, open a project, or reopen a recent one.
* **Timeline** — colour-coded section blocks on a bar/time ruler, a vocal lane, playhead and
  loop region. Click a block to select it, drag its right edge to resize, right-click for
  kind/add/duplicate/move/delete. Drag in the ruler to set a loop; double-click the ruler to
  clear it. Ctrl+wheel zooms, Ctrl+0 fits the song.
* **Transport** — Play/Pause (Space), Stop (Esc), Loop (L), *Preview section* (Ctrl+Space)
  loops just the selected section. Tempo, key, scale and style live here too.
* **Inspector** — chord progression as text (`i VI III VII` or `Am:2 F:2 C:1 G:1`), the
  selected section's name/kind/bars/energy, and per-section element overrides.
* **Mixer** — faders with mute/solo for drums, bass, synths, FX and vocal, master level and
  limiter. **Elements** — enable and level for every synthesized element.
* Every edit is undoable (Ctrl+Z / Ctrl+Y) and sections re-render in the background only
  when something that affects their sound changes; faders respond live.

## Workflow

1. **New project** — pick a style preset (Heavy Trance, Uplifting Trance, Tech Trance,
   Progressive, Psytrance-lite), key, scale and tempo. The default arrangement is
   intro → breakdown → build → drop → main breakdown → build → drop → outro, with each chord
   held for two bars so a half-time vocal sits naturally.
2. **Import a vocal** — a local file you own. Demucs separates the vocal (cached by file
   hash); BPM and key are detected with confidence scores and you can match the track's key.
3. **Place regions** — mark verse / chorus / hook on the source waveform, drag them onto the
   timeline. They snap to bars or beats and stretch to half-time (or normal time).
4. **Shape** — per-region vocal FX (gain, fades, high-pass, saturation, synced delay, reverb
   throw, accelerating chops, gated stabs, formant shift); toggle and balance backing elements.
5. **Export** — MP3 320k, 24-bit WAV, and stems (drums, bass, synths, FX, vocal).

### Developer CLI

```bash
python -m app new demo.htproj --style "Heavy Trance" --key A --tempo 138
python -m app info demo.htproj
python -m app render demo.htproj demo.wav --stems -v
python -m app render demo.htproj drop.wav --section "Drop 1"
```

## AI examples (phase 4)

The assistant edits the project through typed tools and never writes audio itself:

* "Make a heavy trance remix at 138, half-time the vocal, verse in the first breakdown,
  chorus in the main breakdown, chop the hook into the builds, make the second drop harder
  with acid."
* "Switch to F minor to match the vocal and give the drops a i–VI–III–VII progression."
* "Mute the lead in drop 1 and bring the acid up 3 dB in drop 2."

## Project layout

```
app/
  project/     pydantic model (.htproj), style presets, music theory helpers, save/load
  engine/
    timing.py  bar/beat/sample grid, snapping, half-time stretch ratios
    dsp.py     envelopes, panning, saturation, mixing helpers
    generator/ synth voices, drums, patterns, section & song renderer
    fx/        filters (static + swept), reverb, synced delay, sidechain, limiter
    mix/       bus gains, mute/solo, master chain
    vocal/     (phase 3) separation, analysis, stretching, placement, vocal FX
  ai/          (phase 4) Anthropic tool-use assistant, undo stack
  ui/          PySide6 interface: start screen, main window, timeline, transport, mixer,
               inspector, background preview rendering
  engine/playback.py  real-time segment mixer driven by sounddevice
tests/         pytest, synthetic audio only
installer/     (phase 6) PyInstaller spec + Inno Setup script
```

The engine never imports Qt, so everything that makes sound is unit-tested headlessly.

### Generator notes

The generator is written to the brief of the original `synth_bed_reference.py` numpy
trance generator (138 BPM, half-time layout, supersaw chords, rolling bass, acid line,
risers, reverb/delay, sidechain). That reference file was not present in the repository when
this engine was written, so the voices in `app/engine/generator/` are new implementations
of the same elements. Each voice lives in its own function (`synth.py`, `drums.py`) and
the arrangement logic in `render.py`, so individual sounds from the reference can be dropped
in one at a time.

## Building the installer (phase 6)

See `installer/` once phase 6 lands: PyInstaller one-folder build, then Inno Setup produces
`HalfTimeStudio-Setup.exe` with Start-menu and desktop shortcuts and an uninstaller.

## Troubleshooting

* **Tests fail importing `soundfile`** — `pip install -r requirements-dev.txt` inside the venv.
* **MP3 export says ffmpeg not found** — set `HALFTIME_FFMPEG` to the ffmpeg executable or
  install ffmpeg on PATH; the installer bundles it.
* **Render is slow** — a full 104-bar song takes ~15 s on a laptop CPU; previews render a
  single section in 1–3 s. The status at the right of the transport shows what is rendering.
* **"No audio output"** — no output device could be opened. Check Windows sound settings;
  exclusive-mode use by another program (some DAWs) blocks the device.
* **Logs** — Help → Open log folder, or `%APPDATA%\HalfTimeStudio\logs`.

## Personal-use note

Remixes that include vocals from commercial recordings are for personal listening. They
cannot be distributed, uploaded or sold without a licence from the rights holders. The app
works only with local files you already have; it has no downloading or recording features.
