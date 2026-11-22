"""Render a :class:`Project` (or one section of it) to stereo stems.

The renderer works section by section so the UI can preview a single section quickly and
so long renders can report progress and be cancelled. Each section is rendered with a
reverb/delay *tail*; a full-song render overlap-adds the tails into the next section.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field

import numpy as np

from app.engine.dsp import db_to_lin, fade, mix_into, to_stereo
from app.engine.fx.delay import beats_to_delay_samples, synced_delay
from app.engine.fx.dynamics import apply_gain_curve, sidechain_envelope
from app.engine.fx.filters import highpass, sweep_filter
from app.engine.fx.reverb import reverb, reverb_tail_samples
from app.engine.generator import drums, patterns
from app.engine.generator.synth import (
    Note,
    acid_voice,
    lead_voice,
    pad_voice,
    pluck_voice,
    rolling_bass_voice,
    stab_voice,
)
from app.engine.timing import Grid
from app.project.model import BUS_NAMES, Project, Section, SectionKind
from app.project.music import Chord, midi_to_freq, parse_chord

ProgressFn = Callable[[float, str], None]
CancelFn = Callable[[], bool]

GENERATED_BUSES: tuple[str, ...] = ("drums", "bass", "synths", "fx")


class RenderCancelled(Exception):
    """Raised when the cancel callback returns True mid-render."""


@dataclass
class RenderResult:
    """Stems for a span of the timeline. ``body_samples`` excludes the FX tail."""

    stems: dict[str, np.ndarray]
    sample_rate: int
    start_bar: int
    bars: int
    body_samples: int
    tail_samples: int = 0
    notes: list[str] = field(default_factory=list)

    @property
    def total_samples(self) -> int:
        return self.body_samples + self.tail_samples

    def trimmed(self) -> RenderResult:
        """Copy with tails removed (exactly ``bars`` bars long)."""
        return RenderResult(
            {k: v[: self.body_samples] for k, v in self.stems.items()},
            self.sample_rate,
            self.start_bar,
            self.bars,
            self.body_samples,
            0,
            list(self.notes),
        )


def chord_timeline(project: Project, section: Section) -> list[tuple[float, float, Chord]]:
    """(start_beat_in_section, bars, Chord) tuples covering the section, cycling the progression."""
    steps = project.progression_for(section)
    out: list[tuple[float, float, Chord]] = []
    pos = 0.0
    i = 0
    while pos < section.bars - 1e-9:
        step = steps[i % len(steps)]
        bars = min(step.bars, section.bars - pos)
        out.append((pos * 4.0, bars, parse_chord(step.symbol, project.key, project.scale)))
        pos += bars
        i += 1
    return out


class SectionRenderer:
    """Renders one section of a project into stems (plus FX tail)."""

    def __init__(self, project: Project, section_index: int) -> None:
        self.project = project
        self.index = section_index
        self.section = project.sections[section_index]
        self.sr = project.render.sample_rate
        self.grid = Grid(project.tempo, self.sr)
        self.body = self.grid.section_samples(self.section.bars)
        self.tail = reverb_tail_samples(self.sr, project.fx.reverb_size) + beats_to_delay_samples(
            project.fx.delay_beats * 6, project.tempo, self.sr
        )
        self.total = self.body + self.tail
        self.rng = np.random.default_rng(project.render.seed * 7919 + section_index)
        self.chords = chord_timeline(project, self.section)
        self.energy_gain = 0.75 + 0.25 * self.section.energy
        self.notes: list[str] = []

    # ------------------------------------------------------------------ helpers
    def _active(self, element: str) -> bool:
        return self.project.element_active(element, self.section)

    def _level(self, element: str) -> float:
        return db_to_lin(self.project.elements[element].level_db) * self.energy_gain

    def _params(self, element: str) -> dict:
        return self.project.elements[element].params

    def _buf(self) -> np.ndarray:
        return np.zeros((self.total, 2), dtype=np.float64)

    def _beats(self, beats: float) -> int:
        return self.grid.beats_to_samples(beats)

    def _place_notes(
        self,
        buf: np.ndarray,
        notes: list[Note],
        voice: Callable[[Note, int, int], np.ndarray],
        gain: float,
        release_s: float = 0.05,
    ) -> None:
        for note in notes:
            start = self._beats(note.start_beats)
            if start >= self.body:
                continue
            gate = max(1, self._beats(note.length_beats))
            n = gate + int(release_s * self.sr)
            sig = voice(note, n, gate)
            mix_into(buf, sig, start, gain * note.velocity)

    # ------------------------------------------------------------------ buses
    def render_drums(self) -> np.ndarray:
        buf = self._buf()
        kind = self.section.kind
        bars = self.section.bars
        if self._active("kick"):
            p = self._params("kick")
            k = drums.kick(self.sr, float(p.get("punch", 0.8)), float(p.get("sub", 0.9)), float(p.get("decay", 0.45)))
            roll = kind == SectionKind.BUILD and bool(self.section.params.get("kick_roll", True))
            for beat in patterns.kick_steps(bars, kind.value, roll_last_bar=roll):
                mix_into(buf, k, self._beats(beat), self._level("kick"))
            self.notes.append("kick: four-on-the-floor" + (" with roll" if roll else ""))
        wet = self._buf()
        if self._active("hats"):
            p = self._params("hats")
            closed, open_ = patterns.hat_steps(bars, str(p.get("pattern", "offbeat16")))
            tone = float(p.get("tone", 0.6))
            ch, oh = drums.hat(self.sr, False, tone), drums.hat(self.sr, True, tone)
            for beat in closed:
                mix_into(wet, to_stereo(ch, -0.15), self._beats(beat), self._level("hats") * 0.6)
            for beat in open_:
                mix_into(wet, to_stereo(oh, 0.15), self._beats(beat), self._level("hats"))
        if self._active("clap"):
            c = drums.clap(self.sr)
            for beat in patterns.clap_steps(bars):
                mix_into(wet, c, self._beats(beat), self._level("clap"))
            if kind == SectionKind.BUILD:
                s = drums.snare(self.sr)
                for beat, vel in patterns.snare_roll_steps(bars, roll_bars=min(4, bars)):
                    mix_into(wet, s, self._beats(beat), self._level("clap") * vel)
                self.notes.append("snare roll accelerating 1/4 -> 1/32 over the last bars")
        if np.any(wet):
            wet = reverb(wet, self.sr, size=0.35, damping=0.6, mix=0.12, seed=3)[: self.total]
            buf[: wet.shape[0]] += wet
        return buf

    def render_bass(self) -> np.ndarray:
        buf = self._buf()
        if self._active("bass"):
            p = self._params("bass")
            cutoff = float(p.get("cutoff", 900.0)) * (0.7 + 0.3 * self.section.energy)
            drive = float(p.get("drive", 0.6))
            pattern = str(p.get("pattern", "rolling16"))
            cache: dict[tuple[int, int], np.ndarray] = {}

            def voice(note: Note, n: int, gate: int) -> np.ndarray:
                key = (note.midi, n)
                if key not in cache:
                    cache[key] = rolling_bass_voice(note.midi, n, self.sr, self.rng, cutoff, drive, gate)
                return cache[key]

            for start_beat, bars, chord in self.chords:
                notes = patterns.bass_notes(chord, start_beat, bars, pattern, self.rng)
                self._place_notes(buf, notes, voice, self._level("bass") * 0.8)
            self.notes.append(f"bass: {pattern} pattern")
        if self._active("acid"):
            p = self._params("acid")
            cutoff = float(p.get("cutoff", 700.0)) * (0.6 + 0.4 * self.section.energy)
            res = float(p.get("resonance", 0.8))
            env_mod = float(p.get("env_mod", 0.8))
            pattern = str(p.get("pattern", "acid_a"))
            prev_midi: int | None = None
            cache: dict[tuple[int, int, bool], np.ndarray] = {}
            acid_buf = np.zeros(self.total)
            for start_beat, bars, chord in self.chords:
                for note in patterns.acid_notes(chord, start_beat, bars, pattern, self.rng):
                    start = self._beats(note.start_beats)
                    if start >= self.body:
                        continue
                    gate = max(1, self._beats(note.length_beats))
                    n = gate + int(0.05 * self.sr)
                    if note.slide and prev_midi is not None and prev_midi != note.midi:
                        glide = int(0.06 * self.sr)
                        f = np.full(n, midi_to_freq(note.midi))
                        f[:glide] = np.linspace(midi_to_freq(prev_midi), midi_to_freq(note.midi), glide)
                        sig = acid_voice(f, n, self.sr, cutoff, res, env_mod, note.accent, gate)
                    else:
                        key = (note.midi, n, note.accent)
                        if key not in cache:
                            f = np.full(n, midi_to_freq(note.midi))
                            cache[key] = acid_voice(f, n, self.sr, cutoff, res, env_mod, note.accent, gate)
                        sig = cache[key]
                    mix_into(acid_buf, sig, start, self._level("acid") * 0.7)
                    prev_midi = note.midi
            acid_st = to_stereo(acid_buf, 0.0)
            d = beats_to_delay_samples(0.375, self.project.tempo, self.sr)
            acid_st = synced_delay(acid_st, d, 0.3, 0.15, self.sr)[: self.total]
            buf[: acid_st.shape[0]] += acid_st
            self.notes.append(f"acid: {pattern} line with slides and accents")
        return buf

    def render_synths(self) -> np.ndarray:
        buf = self._buf()
        kind = self.section.kind
        if self._active("chords"):
            p = self._params("chords")
            voices, detune = int(p.get("voices", 7)), float(p.get("detune", 0.35))
            cutoff = float(p.get("cutoff", 3200.0)) * (0.75 + 0.25 * self.section.energy)
            style = str(p.get("style", "stab"))
            if kind == SectionKind.BREAKDOWN or style == "sustain":
                for start_beat, bars, chord in self.chords:
                    n = self._beats(bars * 4) + int(0.6 * self.sr)
                    sig = pad_voice(
                        chord.midi_notes(3),
                        n,
                        self.sr,
                        self.rng,
                        voices,
                        detune,
                        cutoff * 1.2,
                        attack=0.08,
                        release=0.5,
                    )
                    mix_into(buf, sig, self._beats(start_beat), self._level("chords") * 0.55)
                self.notes.append("chords: sustained supersaw")
            else:
                for start_beat, bars, chord in self.chords:
                    stab_n = self._beats(0.4) + int(0.08 * self.sr)
                    stab = stab_voice(
                        chord.midi_notes(3), stab_n, self.sr, self.rng, voices, detune, cutoff, gate=self._beats(0.4)
                    )
                    for note in patterns.stab_notes(chord, start_beat, bars):
                        mix_into(buf, stab, self._beats(note.start_beats), self._level("chords") * 0.7)
                self.notes.append("chords: offbeat supersaw stabs")
        if self._active("pads"):
            p = self._params("pads")
            for start_beat, bars, chord in self.chords:
                n = self._beats(bars * 4) + int(0.8 * self.sr)
                notes = chord.midi_notes(3) + [chord.midi_notes(4)[0]]
                sig = pad_voice(
                    notes,
                    n,
                    self.sr,
                    self.rng,
                    int(p.get("voices", 5)),
                    float(p.get("detune", 0.2)),
                    float(p.get("cutoff", 1800.0)),
                )
                mix_into(buf, sig, self._beats(start_beat), self._level("pads") * 0.5)
            self.notes.append("pads: wide sustained chords")
        if self._active("plucks"):
            p = self._params("plucks")
            decay = float(p.get("decay", 0.18))
            pattern = str(p.get("pattern", "arp16"))
            cache: dict[tuple[int, int], np.ndarray] = {}

            def pluck(note: Note, n: int, gate: int) -> np.ndarray:
                key = (note.midi, n)
                if key not in cache:
                    pan = self.rng.uniform(-0.5, 0.5)
                    cache[key] = to_stereo(pluck_voice(note.midi, n, self.sr, self.rng, decay), pan)
                return cache[key]

            for start_beat, bars, chord in self.chords:
                self._place_notes(
                    buf,
                    patterns.arp_notes(chord, start_beat, bars, pattern, self.rng),
                    pluck,
                    self._level("plucks") * 0.5,
                    release_s=decay * 2,
                )
            self.notes.append(f"plucks: {pattern} arpeggio")
        if self._active("lead"):
            p = self._params("lead")
            voices, detune = int(p.get("voices", 5)), float(p.get("detune", 0.25))
            octave = int(p.get("octave", 5))
            melody = patterns.lead_melody(self.chords, self.project.key, self.project.scale, self.rng, octave)

            def lead(note: Note, n: int, gate: int) -> np.ndarray:
                return lead_voice(note.midi, n, self.sr, self.rng, voices, detune, gate)

            self._place_notes(buf, melody, lead, self._level("lead") * 0.55, release_s=0.1)
            self.notes.append(f"lead: generated melody, {len(melody)} notes")
        # Build tension: rising highpass sweep across the section.
        if kind == SectionKind.BUILD and bool(self.section.params.get("filter_sweep", True)) and np.any(buf):
            t = np.linspace(0.0, 1.0, self.total)
            cutoff = 60.0 * (25.0 ** np.minimum(t * self.total / max(self.body, 1), 1.0))
            buf = sweep_filter(buf, cutoff, self.sr, q=0.9, kind="highpass", block=512)
            self.notes.append("build: highpass sweep")
        # Sends.
        fx = self.project.fx
        if np.any(buf):
            d = beats_to_delay_samples(fx.delay_beats, self.project.tempo, self.sr)
            buf = synced_delay(buf, d, fx.delay_feedback, 0.18, self.sr)[: self.total]
            buf = reverb(buf, self.sr, fx.reverb_size, fx.reverb_damping, mix=0.22, seed=5)[: self.total]
            buf = highpass(buf, 90.0, self.sr)
        return buf

    def render_fx(self) -> np.ndarray:
        buf = self._buf()
        kind = self.section.kind
        if self._active("risers") and kind == SectionKind.BUILD:
            r = drums.riser(self.sr, self.body, seed=self.project.render.seed + self.index)
            mix_into(buf, r, 0, self._level("risers"))
            self.notes.append("riser across the build")
        if self._active("impacts") and kind in (SectionKind.DROP, SectionKind.BREAKDOWN, SectionKind.INTRO):
            mix_into(buf, drums.impact(self.sr, seed=self.project.render.seed + self.index), 0, self._level("impacts"))
            if kind == SectionKind.DROP:
                dl = drums.downlifter(self.sr, min(self.body, self._beats(8)), seed=self.index)
                mix_into(buf, dl, 0, self._level("impacts") * 0.6)
            self.notes.append("impact on the downbeat")
        if np.any(buf):
            buf = reverb(buf, self.sr, 0.7, 0.5, mix=0.3, seed=9)[: self.total]
        return buf

    # ------------------------------------------------------------------ driver
    def render(self) -> RenderResult:
        stems = {
            "drums": self.render_drums(),
            "bass": self.render_bass(),
            "synths": self.render_synths(),
            "fx": self.render_fx(),
        }
        # Sidechain pumping follows the kick.
        if self._active("kick") and self.project.fx.sidechain_amount > 0:
            hits = patterns.kick_steps(self.section.bars, self.section.kind.value, roll_last_bar=False)
            env = sidechain_envelope(
                self.total,
                self.grid.samples_per_beat,
                self.project.fx.sidechain_amount,
                self.project.fx.sidechain_release_beats,
                hits,
                sr=self.sr,
            )
            stems["bass"] = apply_gain_curve(stems["bass"], env)
            soft = 1.0 - (1.0 - env) * 0.8
            stems["synths"] = apply_gain_curve(stems["synths"], soft)
        if self.section.kind == SectionKind.OUTRO and bool(self.section.params.get("fade_out", True)):
            fo = self.body // 2
            for k in stems:
                stems[k] = fade(stems[k], 0, 0)
                stems[k][self.body - fo : self.body] *= np.linspace(1.0, 0.0, fo)[:, None]
                stems[k][self.body :] = 0.0
        for k in stems:
            stems[k] = stems[k].astype(np.float32)
        return RenderResult(
            stems,
            self.sr,
            self.project.section_start_bar(self.section.id),
            self.section.bars,
            self.body,
            self.tail,
            self.notes,
        )


def render_section(project: Project, section: int | str) -> RenderResult:
    """Render one section (by index, id or name) with its FX tail."""
    if isinstance(section, str):
        sec = project.get_section(section)
        index = next(i for i, s in enumerate(project.sections) if s.id == sec.id)
    else:
        index = section
    return SectionRenderer(project, index).render()


def render_project(
    project: Project, progress: ProgressFn | None = None, cancel: CancelFn | None = None
) -> RenderResult:
    """Render the whole arrangement; the result is exactly ``total_bars`` long plus a tail."""
    if not project.sections:
        raise ValueError("project has no sections")
    grid = Grid(project.tempo, project.render.sample_rate)
    body = grid.section_samples(project.total_bars)
    tail = 0
    sections: list[RenderResult] = []
    for i, _ in enumerate(project.sections):
        if cancel and cancel():
            raise RenderCancelled()
        if progress:
            progress(i / len(project.sections), f"Rendering {project.sections[i].name}")
        sections.append(SectionRenderer(project, i).render())
        tail = max(tail, sections[-1].tail_samples)
    total = body + tail
    stems = {bus: np.zeros((total, 2), dtype=np.float32) for bus in GENERATED_BUSES}
    notes: list[str] = []
    for res in sections:
        offset = grid.bars_to_samples(res.start_bar)
        for bus, data in res.stems.items():
            mix_into(stems[bus], data, offset)
        notes.extend(f"{project.sections[len(notes) and 0].name}: {n}" for n in [])
        notes.append(f"[{res.start_bar}] " + "; ".join(res.notes))
    if progress:
        progress(1.0, "Done")
    return RenderResult(stems, project.render.sample_rate, 0, project.total_bars, body, tail, notes)


def render_range(project: Project, start_bar: float, end_bar: float) -> RenderResult:
    """Render just the bars in ``[start_bar, end_bar)`` (for loop previews); no tail."""
    if end_bar <= start_bar:
        raise ValueError("end_bar must be after start_bar")
    grid = Grid(project.tempo, project.render.sample_rate)
    # Render each section that overlaps the range, then slice.
    pos = 0
    first_start = None
    pieces: list[RenderResult] = []
    for i, sec in enumerate(project.sections):
        sec_end = pos + sec.bars
        if sec_end > start_bar and pos < end_bar:
            pieces.append(SectionRenderer(project, i).render())
            if first_start is None:
                first_start = pos
        pos = sec_end
    if not pieces or first_start is None:
        raise ValueError("range is outside the arrangement")
    span_body = grid.bars_to_samples(end_bar) - grid.bars_to_samples(start_bar)
    total = grid.bars_to_samples(pos) + max(p.tail_samples for p in pieces)
    stems = {bus: np.zeros((total, 2), dtype=np.float32) for bus in GENERATED_BUSES}
    for res in pieces:
        offset = grid.bars_to_samples(res.start_bar)
        for bus, data in res.stems.items():
            mix_into(stems[bus], data, offset)
    a = grid.bars_to_samples(start_bar)
    out = {bus: data[a : a + span_body] for bus, data in stems.items()}
    return RenderResult(out, project.render.sample_rate, int(start_bar), int(end_bar - start_bar), span_body, 0)


def empty_stems(n: int, buses: tuple[str, ...] = BUS_NAMES) -> dict[str, np.ndarray]:
    return {b: np.zeros((n, 2), dtype=np.float32) for b in buses}
