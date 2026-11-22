"""Bar/beat/sample arithmetic shared by the generator, the vocal placer and the UI."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

StretchMode = Literal["half_time", "normal_time"]


@dataclass(frozen=True)
class Grid:
    """Musical grid for one tempo and sample rate (4/4 only)."""

    tempo: float
    sample_rate: int
    beats_per_bar: int = 4

    def __post_init__(self) -> None:
        if self.tempo <= 0:
            raise ValueError("tempo must be positive")
        if self.sample_rate <= 0:
            raise ValueError("sample_rate must be positive")

    # --- durations -------------------------------------------------------------
    @property
    def beat_seconds(self) -> float:
        return 60.0 / self.tempo

    @property
    def bar_seconds(self) -> float:
        return self.beat_seconds * self.beats_per_bar

    @property
    def samples_per_beat(self) -> float:
        return self.beat_seconds * self.sample_rate

    @property
    def samples_per_bar(self) -> float:
        return self.bar_seconds * self.sample_rate

    # --- conversions -----------------------------------------------------------
    def bars_to_seconds(self, bars: float) -> float:
        return bars * self.bar_seconds

    def seconds_to_bars(self, seconds: float) -> float:
        return seconds / self.bar_seconds

    def beats_to_seconds(self, beats: float) -> float:
        return beats * self.beat_seconds

    def bars_to_samples(self, bars: float) -> int:
        """Nearest sample index for a bar position (never negative)."""
        return max(0, int(round(bars * self.samples_per_bar)))

    def beats_to_samples(self, beats: float) -> int:
        return max(0, int(round(beats * self.samples_per_beat)))

    def seconds_to_samples(self, seconds: float) -> int:
        return max(0, int(round(seconds * self.sample_rate)))

    def samples_to_bars(self, samples: int) -> float:
        return samples / self.samples_per_bar

    def samples_to_seconds(self, samples: int) -> float:
        return samples / self.sample_rate

    def section_samples(self, bars: int) -> int:
        """Exact sample count covering ``bars`` whole bars, rounded once (no drift)."""
        return self.bars_to_samples(bars)

    # --- snapping ----------------------------------------------------------------
    def snap_bars(self, bars: float, division: int = 1) -> float:
        """Snap a bar position to the nearest 1/``division`` of a bar.

        ``division=1`` snaps to bars, ``4`` to beats, ``8`` to eighths, ``16`` to sixteenths.
        """
        if division < 1:
            raise ValueError("division must be >= 1")
        return max(0.0, round(bars * division) / division)

    def snap_seconds(self, seconds: float, division: int = 1) -> float:
        return self.bars_to_seconds(self.snap_bars(self.seconds_to_bars(seconds), division))


def stretch_ratio(source_bpm: float, project_tempo: float, mode: StretchMode) -> float:
    """Time-stretch ratio (output length / input length) to fit a vocal to the project.

    ``half_time`` makes the vocal sit at half the project tempo (the classic trance-remix
    feel for a pop vocal); ``normal_time`` matches the project tempo directly. A ratio > 1
    slows the vocal down.
    """
    if source_bpm <= 0 or project_tempo <= 0:
        raise ValueError("tempos must be positive")
    target = project_tempo / 2.0 if mode == "half_time" else project_tempo
    return source_bpm / target


def normalize_bpm(bpm: float, lo: float = 70.0, hi: float = 140.0) -> float:
    """Fold octave errors in BPM detection into a plausible range (``lo`` <= bpm < ``hi``)."""
    if bpm <= 0:
        raise ValueError("bpm must be positive")
    while bpm >= hi:
        bpm /= 2.0
    while bpm < lo:
        bpm *= 2.0
    return bpm


def recommend_stretch_mode(source_bpm: float, project_tempo: float) -> StretchMode:
    """Pick the mode whose stretch ratio is closest to 1.0 (least audible artefacts)."""
    half = abs(math.log(stretch_ratio(source_bpm, project_tempo, "half_time")))
    normal = abs(math.log(stretch_ratio(source_bpm, project_tempo, "normal_time")))
    return "half_time" if half <= normal else "normal_time"
