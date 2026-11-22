"""Step patterns and melodic generators.

All functions are deterministic for a given seed so renders are reproducible and the
AI assistant can describe what it will produce before rendering.
"""

from __future__ import annotations

import numpy as np

from app.engine.generator.synth import Note
from app.project.music import Chord, scale_pitch_classes

STEPS_PER_BAR = 16  # 16th-note grid
KICK_STEPS = (0, 4, 8, 12)


def kick_steps(bars: int, kind: str, roll_last_bar: bool = False) -> list[float]:
    """Kick positions in beats for ``bars`` bars."""
    beats: list[float] = []
    for bar in range(bars):
        if roll_last_bar and bar == bars - 1:
            # Eighth-note roll in the last bar of a build.
            beats.extend(bar * 4 + i * 0.5 for i in range(8))
        else:
            beats.extend(bar * 4 + s / 4 for s in KICK_STEPS)
    return beats


def hat_steps(bars: int, pattern: str) -> tuple[list[float], list[float]]:
    """Return (closed_hat_beats, open_hat_beats)."""
    closed: list[float] = []
    open_: list[float] = []
    for bar in range(bars):
        base = bar * 4
        if pattern == "offbeat8":
            open_.extend(base + s / 4 for s in (2, 6, 10, 14))
        else:  # offbeat16: closed on every odd 16th, open on offbeat 8ths
            open_.extend(base + s / 4 for s in (2, 6, 10, 14))
            closed.extend(base + s / 4 for s in (1, 3, 5, 7, 9, 11, 13, 15))
    return closed, open_


def clap_steps(bars: int) -> list[float]:
    return [bar * 4 + s / 4 for bar in range(bars) for s in (4, 12)]


def snare_roll_steps(bars: int, roll_bars: int = 4) -> list[tuple[float, float]]:
    """Accelerating roll over the last ``roll_bars`` bars: (beat, velocity) pairs.

    Subdivision doubles each bar: 1/4 -> 1/8 -> 1/16 -> 1/32.
    """
    hits: list[tuple[float, float]] = []
    start_bar = max(0, bars - roll_bars)
    divisions = [4, 8, 16, 32]
    for i, bar in enumerate(range(start_bar, bars)):
        div = divisions[min(i, len(divisions) - 1)]
        for k in range(div):
            pos = bar * 4 + k * 4 / div
            vel = 0.5 + 0.5 * (i * div + k) / (len(divisions) * div)
            hits.append((pos, min(1.0, vel)))
    return hits


def _chord_root_midi(chord: Chord, octave: int) -> int:
    return chord.root_pc + 12 * (octave + 1)


def bass_notes(chord: Chord, start_beat: float, bars: float, pattern: str, rng: np.random.Generator) -> list[Note]:
    """Rolling 16th bass avoiding kick hits, or offbeat 8ths, for one chord span."""
    root = _chord_root_midi(chord, 1)  # e.g. A1 = 33
    notes: list[Note] = []
    n_steps = int(round(bars * STEPS_PER_BAR))
    for s in range(n_steps):
        step = s % STEPS_PER_BAR
        beat = start_beat + s / 4
        if pattern == "offbeat8":
            if step % 4 != 2:
                continue
            notes.append(Note(beat, 0.45, root, 1.0))
        elif pattern == "psy16":
            if step % 4 == 0:
                continue
            notes.append(Note(beat, 0.22, root, 0.9 if step % 4 == 2 else 0.8))
        else:  # rolling16
            if step % 4 == 0:
                continue
            octave_up = step % 16 == 15 and rng.random() < 0.5
            notes.append(Note(beat, 0.2, root + (12 if octave_up else 0), 0.95 if step % 4 == 2 else 0.8))
    return notes


_ACID_SHAPES: dict[str, list[tuple[int, bool, bool]]] = {
    # (semitone offset from root, accent, slide) per 16th step; None-like via 99 = rest
    "acid_a": [
        (0, True, False),
        (99, False, False),
        (0, False, False),
        (12, False, True),
        (0, False, False),
        (99, False, False),
        (7, True, False),
        (0, False, False),
        (0, False, False),
        (12, False, False),
        (99, False, False),
        (0, True, True),
        (3, False, False),
        (0, False, False),
        (99, False, False),
        (10, False, False),
    ],
    "acid_b": [
        (0, True, False),
        (0, False, False),
        (99, False, False),
        (0, False, False),
        (12, True, True),
        (99, False, False),
        (0, False, False),
        (0, False, False),
        (7, False, False),
        (99, False, False),
        (0, True, False),
        (0, False, False),
        (99, False, False),
        (12, False, False),
        (0, False, True),
        (99, False, False),
    ],
    "acid_c": [
        (0, True, False),
        (0, False, False),
        (0, False, False),
        (0, False, True),
        (12, True, False),
        (0, False, False),
        (0, False, False),
        (0, False, False),
        (0, True, False),
        (0, False, False),
        (10, False, True),
        (0, False, False),
        (12, True, False),
        (0, False, False),
        (0, False, False),
        (0, False, False),
    ],
}


def acid_notes(chord: Chord, start_beat: float, bars: float, pattern: str, rng: np.random.Generator) -> list[Note]:
    root = _chord_root_midi(chord, 2)  # A2 = 45
    shape = _ACID_SHAPES.get(pattern, _ACID_SHAPES["acid_a"])
    notes: list[Note] = []
    n_steps = int(round(bars * STEPS_PER_BAR))
    for s in range(n_steps):
        off, accent, slide = shape[s % 16]
        if off == 99:
            continue
        if off == 3 and chord.quality not in ("min", "min7", "min9", "madd9", "dim"):
            off = 4
        # Occasional spontaneous variation keeps 16 bars from being a loop.
        if rng.random() < 0.08:
            off = rng.choice([0, 0, 7, 12])
        notes.append(Note(start_beat + s / 4, 0.24, root + int(off), 1.0, slide=slide, accent=accent))
    return notes


def arp_notes(chord: Chord, start_beat: float, bars: float, pattern: str, rng: np.random.Generator) -> list[Note]:
    """Up/down arpeggio of chord tones with an octave on top."""
    tones = chord.midi_notes(octave=4)
    seq = tones + [tones[0] + 12] + tones[::-1][1:]
    step_beats = 0.25 if pattern == "arp16" else 0.5
    n = int(round(bars * 4 / step_beats))
    notes: list[Note] = []
    for i in range(n):
        if rng.random() < 0.06:
            continue  # tiny gaps for groove
        notes.append(Note(start_beat + i * step_beats, step_beats * 0.9, seq[i % len(seq)], 0.9))
    return notes


def stab_notes(chord: Chord, start_beat: float, bars: float) -> list[Note]:
    """Offbeat-eighth chord stabs (the quintessential trance chord rhythm)."""
    notes: list[Note] = []
    for bar in range(int(round(bars))):
        for step in (2, 6, 10, 14):
            notes.append(Note(start_beat + bar * 4 + step / 4, 0.4, 0, 1.0))
    return notes


_RHYTHMS: list[list[float]] = [
    [1.0, 0.5, 0.5, 1.0, 1.0],
    [0.5, 0.5, 1.0, 0.5, 0.5, 1.0],
    [1.5, 0.5, 1.0, 1.0],
    [0.5, 0.5, 0.5, 0.5, 1.0, 1.0],
    [2.0, 1.0, 1.0],
]


def lead_melody(
    chords: list[tuple[float, float, Chord]],
    key: str,
    scale: str,
    rng: np.random.Generator,
    octave: int = 5,
) -> list[Note]:
    """Generate an original lead line over a chord timeline (start_beat, bars, chord).

    Rhythm comes from a few templates; pitches favour chord tones on strong beats and move
    mostly stepwise within the scale. Phrases repeat every 4 bars with light variation so the
    hook is memorable but never copied from anywhere.
    """
    pcs = scale_pitch_classes(key, scale)
    scale_notes = sorted({pc + 12 * (o + 1) for pc in pcs for o in (octave, octave + 1)})
    notes: list[Note] = []
    phrase_cache: dict[int, list[tuple[float, float, int]]] = {}
    current = scale_notes[len(scale_notes) // 3]
    for start_beat, bars, chord in chords:
        chord_tones = {m % 12 for m in chord.midi_notes()}
        phrase_key = int(start_beat // 16) % 2  # alternate two phrases per 8 bars
        beat = 0.0
        total = bars * 4
        pattern: list[tuple[float, float, int]] = []
        reuse = phrase_key in phrase_cache and rng.random() < 0.75
        if reuse:
            pattern = [(b, length, m) for (b, length, m) in phrase_cache[phrase_key] if b < total]
        else:
            while beat < total - 0.01:
                rhythm = _RHYTHMS[rng.integers(len(_RHYTHMS))]
                for length in rhythm:
                    if beat >= total - 0.01:
                        break
                    strong = beat % 1.0 == 0.0
                    candidates = [n for n in scale_notes if abs(n - current) <= 5]
                    if strong:
                        ct = [n for n in candidates if n % 12 in chord_tones]
                        candidates = ct or candidates
                    weights = np.array([1.0 / (1 + abs(n - current)) for n in candidates])
                    current = int(rng.choice(candidates, p=weights / weights.sum()))
                    if rng.random() < 0.12:  # rests breathe
                        beat += length
                        continue
                    pattern.append((beat, length, current))
                    beat += length
            phrase_cache[phrase_key] = pattern
        for b, length, m in pattern:
            # Snap non-chord tones on the downbeat to the nearest chord tone for the new chord.
            if b % 4 == 0 and m % 12 not in chord_tones:
                m = min((n for n in scale_notes if n % 12 in chord_tones), key=lambda n: abs(n - m))
            notes.append(Note(start_beat + b, length * 0.92, m, 0.9))
    return notes
