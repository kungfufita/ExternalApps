"""Music theory helpers: note names, scales, chord symbols and MIDI conversion.

Everything here is pure Python so the AI tools and the generator share one definition
of what "key of A minor, chord VI" means.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
_FLAT_TO_SHARP = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#", "Cb": "B", "Fb": "E"}

# Interval patterns (semitones from the root) for the supported scales.
SCALES: dict[str, tuple[int, ...]] = {
    "minor": (0, 2, 3, 5, 7, 8, 10),  # natural minor / aeolian
    "major": (0, 2, 4, 5, 7, 9, 11),
    "harmonic_minor": (0, 2, 3, 5, 7, 8, 11),
    "dorian": (0, 2, 3, 5, 7, 9, 10),
    "phrygian": (0, 1, 3, 5, 7, 8, 10),
    "lydian": (0, 2, 4, 6, 7, 9, 11),
    "mixolydian": (0, 2, 4, 5, 7, 9, 10),
    "minor_pentatonic": (0, 3, 5, 7, 10),
    "major_pentatonic": (0, 2, 4, 7, 9),
}

# Chord quality -> intervals from the chord root.
CHORD_QUALITIES: dict[str, tuple[int, ...]] = {
    "maj": (0, 4, 7),
    "min": (0, 3, 7),
    "dim": (0, 3, 6),
    "aug": (0, 4, 8),
    "sus2": (0, 2, 7),
    "sus4": (0, 5, 7),
    "maj7": (0, 4, 7, 11),
    "min7": (0, 3, 7, 10),
    "dom7": (0, 4, 7, 10),
    "min9": (0, 3, 7, 10, 14),
    "maj9": (0, 4, 7, 11, 14),
    "add9": (0, 4, 7, 14),
    "madd9": (0, 3, 7, 14),
    "power": (0, 7),
}

_ROMAN = {"i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7}
_ROMAN_RE = re.compile(r"^(b|#)?(vii|vi|iv|v|iii|ii|i)(.*)$", re.IGNORECASE)
_NAME_RE = re.compile(r"^([A-Ga-g])([#b]?)(.*)$")


def normalize_note_name(name: str) -> str:
    """Return the canonical sharp spelling of a note name (``"Bb"`` -> ``"A#"``)."""
    name = name.strip()
    if not name:
        raise ValueError("empty note name")
    name = name[0].upper() + name[1:]
    if name in _FLAT_TO_SHARP:
        return _FLAT_TO_SHARP[name]
    if name == "E#":
        return "F"
    if name == "B#":
        return "C"
    if name not in NOTE_NAMES:
        raise ValueError(f"unknown note name: {name!r}")
    return name


def note_to_pitch_class(name: str) -> int:
    """Pitch class 0..11 for a note name (C = 0)."""
    return NOTE_NAMES.index(normalize_note_name(name))


def midi_to_freq(midi: float) -> float:
    """Equal-tempered frequency in Hz for a (possibly fractional) MIDI note number."""
    return 440.0 * 2.0 ** ((midi - 69) / 12.0)


def midi_to_name(midi: int) -> str:
    """``60`` -> ``"C4"``."""
    return f"{NOTE_NAMES[midi % 12]}{midi // 12 - 1}"


def scale_pitch_classes(key: str, scale: str) -> list[int]:
    """Pitch classes of ``scale`` rooted on ``key``."""
    if scale not in SCALES:
        raise ValueError(f"unknown scale: {scale!r}")
    root = note_to_pitch_class(key)
    return [(root + i) % 12 for i in SCALES[scale]]


def scale_degree_midi(key: str, scale: str, degree: int, octave: int = 4) -> int:
    """MIDI note for a 1-based scale ``degree``; degrees above 7 wrap to the next octave."""
    intervals = SCALES[scale]
    n = len(intervals)
    idx = degree - 1
    oct_shift, idx = divmod(idx, n)
    root = note_to_pitch_class(key) + 12 * (octave + 1)
    return root + intervals[idx] + 12 * oct_shift


def _diatonic_quality(key: str, scale: str, degree: int) -> str:
    """Triad quality that falls naturally on ``degree`` of the scale."""
    r = scale_degree_midi(key, scale, degree, 4)
    t = scale_degree_midi(key, scale, degree + 2, 4)
    f = scale_degree_midi(key, scale, degree + 4, 4)
    third, fifth = (t - r) % 12, (f - r) % 12
    if third == 3 and fifth == 7:
        return "min"
    if third == 4 and fifth == 7:
        return "maj"
    if third == 3 and fifth == 6:
        return "dim"
    if third == 4 and fifth == 8:
        return "aug"
    return "power"


def _parse_quality_suffix(suffix: str, default: str) -> str:
    s = suffix.strip().lower()
    if s in ("", "triad"):
        return default
    aliases = {
        "m": "min",
        "min": "min",
        "-": "min",
        "minor": "min",
        "maj": "maj",
        "major": "maj",
        "M": "maj",
        "dim": "dim",
        "°": "dim",
        "o": "dim",
        "aug": "aug",
        "+": "aug",
        "sus2": "sus2",
        "sus4": "sus4",
        "sus": "sus4",
        "7": "dom7",
        "dom7": "dom7",
        "m7": "min7",
        "min7": "min7",
        "-7": "min7",
        "maj7": "maj7",
        "M7": "maj7",
        "m9": "min9",
        "min9": "min9",
        "maj9": "maj9",
        "add9": "add9",
        "madd9": "madd9",
        "5": "power",
        "power": "power",
    }
    if s in aliases:
        return aliases[s]
    if suffix in aliases:  # case-sensitive forms like "M7"
        return aliases[suffix]
    raise ValueError(f"unknown chord quality: {suffix!r}")


@dataclass(frozen=True)
class Chord:
    """A resolved chord: absolute root MIDI pitch class plus voicing intervals."""

    root_pc: int
    quality: str
    symbol: str

    def midi_notes(self, octave: int = 3, voices: int | None = None) -> list[int]:
        """Return MIDI notes for the chord with the root in ``octave``."""
        intervals = CHORD_QUALITIES[self.quality]
        if voices is not None:
            intervals = intervals[:voices]
        root = self.root_pc + 12 * (octave + 1)
        return [root + i for i in intervals]

    @property
    def root_name(self) -> str:
        return NOTE_NAMES[self.root_pc]


def _is_roman_head(sym: str) -> bool:
    """True when the symbol starts with a roman numeral (optionally prefixed by b/#)."""
    body = sym[1:] if sym[:1] in ("b", "#") and len(sym) > 1 and sym[1] in "iIvV" else sym
    return body[:1] in "iIvV" and body[:1] != ""


def parse_chord(symbol: str, key: str, scale: str) -> Chord:
    """Resolve a chord symbol relative to a key.

    Accepts roman numerals (``"i"``, ``"VI"``, ``"bVII"``, ``"iv7"``) where case sets
    the default quality (upper = major, lower = minor) but diatonic quality is used when the
    case is ambiguous with the scale, or absolute names (``"Am"``, ``"F"``, ``"Gsus2"``).
    """
    sym = symbol.strip()
    if not sym:
        raise ValueError("empty chord symbol")
    m = _ROMAN_RE.match(sym)
    if m and _is_roman_head(sym):
        accidental, numeral, suffix = m.group(1), m.group(2), m.group(3)
        degree = _ROMAN[numeral.lower()]
        pc = scale_degree_midi(key, scale, degree, 4) % 12
        if accidental == "b":
            pc = (pc - 1) % 12
        elif accidental == "#":
            pc = (pc + 1) % 12
        if suffix == "7":
            quality = "min7" if numeral.islower() else "dom7"
        elif suffix:
            quality = _parse_quality_suffix(suffix, "min" if numeral.islower() else "maj")
        elif accidental:
            quality = "min" if numeral.islower() else "maj"
        else:
            quality = _diatonic_quality(key, scale, degree)
            # Respect an explicit case override (e.g. "I" in a minor key -> major).
            if quality in ("min", "maj"):
                quality = "min" if numeral.islower() else "maj"
        return Chord(root_pc=pc, quality=quality, symbol=sym)

    m = _NAME_RE.match(sym)
    if not m:
        raise ValueError(f"cannot parse chord symbol: {symbol!r}")
    letter, acc, suffix = m.groups()
    pc = note_to_pitch_class(letter + acc)
    quality = _parse_quality_suffix(suffix, "maj")
    return Chord(root_pc=pc, quality=quality, symbol=sym)


def default_progression_for(scale: str) -> list[str]:
    """A sensible default progression (as roman numerals) for a scale family."""
    if scale in ("major", "lydian", "mixolydian", "major_pentatonic"):
        return ["I", "V", "vi", "IV"]
    return ["i", "VI", "III", "VII"]


def transpose_key(key: str, semitones: int) -> str:
    return NOTE_NAMES[(note_to_pitch_class(key) + semitones) % 12]


def parse_progression_text(text: str, key: str, scale: str) -> list[tuple[str, float]]:
    """Parse ``"i VI III VII"`` or ``"Am:2 F:2 C:1 G:1"`` into ``[(symbol, bars), ...]``.

    Bars default to 2. Every symbol is validated against the key/scale.
    """
    tokens = [t for t in re.split(r"[\s,|]+", text.strip()) if t]
    if not tokens:
        raise ValueError("progression is empty")
    out: list[tuple[str, float]] = []
    for tok in tokens:
        sym, _, bars_txt = tok.partition(":")
        bars = 2.0
        if bars_txt:
            try:
                bars = float(bars_txt)
            except ValueError as exc:
                raise ValueError(f"bad bar count in {tok!r}") from exc
            if not 0 < bars <= 16:
                raise ValueError(f"bars must be between 0 and 16 in {tok!r}")
        parse_chord(sym, key, scale)  # raises on garbage
        out.append((sym, bars))
    return out
