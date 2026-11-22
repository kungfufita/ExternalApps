"""Oscillators and voices. Everything is synthesized; nothing is sampled."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.engine.dsp import adsr, exp_decay, soft_clip
from app.engine.fx.filters import lowpass, resonance_to_q, sweep_filter
from app.project.music import midi_to_freq


@dataclass(frozen=True)
class Note:
    """A note event relative to the start of the rendered block (times in beats)."""

    start_beats: float
    length_beats: float
    midi: int
    velocity: float = 1.0
    slide: bool = False
    accent: bool = False


def phase_accumulate(freq: np.ndarray | float, n: int, sr: int, phase0: float = 0.0) -> np.ndarray:
    """Phase in cycles for a constant or per-sample frequency."""
    if np.isscalar(freq):
        return (phase0 + np.arange(n) * (float(freq) / sr)) % 1.0
    return (phase0 + np.cumsum(np.asarray(freq) / sr)) % 1.0


def saw(freq: np.ndarray | float, n: int, sr: int, phase0: float = 0.0) -> np.ndarray:
    ph = phase_accumulate(freq, n, sr, phase0)
    return 2.0 * ph - 1.0


def square(freq: np.ndarray | float, n: int, sr: int, phase0: float = 0.0, pw: float = 0.5) -> np.ndarray:
    ph = phase_accumulate(freq, n, sr, phase0)
    return np.where(ph < pw, 1.0, -1.0)


def sine(freq: np.ndarray | float, n: int, sr: int, phase0: float = 0.0) -> np.ndarray:
    ph = phase_accumulate(freq, n, sr, phase0)
    return np.sin(2.0 * np.pi * ph)


def supersaw(
    midi: float,
    n: int,
    sr: int,
    rng: np.random.Generator,
    voices: int = 7,
    detune: float = 0.3,
    spread: float = 0.8,
) -> np.ndarray:
    """Classic detuned saw stack, stereo ``(n, 2)``; ``detune`` 0..1 ~ 0..50 cents."""
    voices = max(1, int(voices))
    cents = np.linspace(-1.0, 1.0, voices) * detune * 50.0 if voices > 1 else np.zeros(1)
    freqs = midi_to_freq(midi) * 2.0 ** (cents / 1200.0)
    t = np.arange(n) / sr
    phases = (rng.random(voices)[:, None] + t[None, :] * freqs[:, None]) % 1.0
    saws = 2.0 * phases - 1.0  # (voices, n)
    pans = (np.linspace(-1.0, 1.0, voices) * spread) if voices > 1 else np.zeros(1)
    angles = (pans + 1.0) * np.pi / 4.0
    left = (saws * np.cos(angles)[:, None]).sum(axis=0)
    right = (saws * np.sin(angles)[:, None]).sum(axis=0)
    out = np.stack([left, right], axis=1) / np.sqrt(voices)
    return out


def supersaw_chord(
    midis: list[int], n: int, sr: int, rng: np.random.Generator, voices: int, detune: float
) -> np.ndarray:
    out = np.zeros((n, 2))
    for m in midis:
        out += supersaw(m, n, sr, rng, voices=voices, detune=detune)
    return out / np.sqrt(max(1, len(midis)))


def stab_voice(
    midis: list[int],
    n: int,
    sr: int,
    rng: np.random.Generator,
    voices: int = 7,
    detune: float = 0.35,
    cutoff: float = 3200.0,
    gate: int | None = None,
) -> np.ndarray:
    """Short, punchy supersaw chord with a filter envelope (the trance 'stab')."""
    raw = supersaw_chord(midis, n, sr, rng, voices, detune)
    env = adsr(n, sr, attack=0.002, decay=0.12, sustain=0.55, release=0.05, gate=gate)
    fenv = cutoff * (0.45 + 0.55 * adsr(n, sr, 0.001, 0.15, 0.3, 0.1, gate=gate))
    filtered = sweep_filter(raw, fenv, sr, q=1.0, kind="lowpass")
    return filtered * env[:, None]


def pad_voice(
    midis: list[int],
    n: int,
    sr: int,
    rng: np.random.Generator,
    voices: int = 5,
    detune: float = 0.2,
    cutoff: float = 1800.0,
    attack: float = 0.4,
    release: float = 0.6,
) -> np.ndarray:
    """Slow, wide supersaw chord with a gentle lowpass and an LFO-shimmer on the cutoff."""
    raw = supersaw_chord(midis, n, sr, rng, voices, detune)
    env = adsr(n, sr, attack=attack, decay=0.5, sustain=0.9, release=release)
    t = np.arange(n) / sr
    lfo = 1.0 + 0.25 * np.sin(2 * np.pi * 0.2 * t + rng.random() * 6.28)
    filtered = sweep_filter(raw, cutoff * lfo, sr, q=0.8, kind="lowpass", block=256)
    return filtered * env[:, None]


def pluck_voice(midi: int, n: int, sr: int, rng: np.random.Generator, decay: float = 0.18) -> np.ndarray:
    """Bright plucked saw/square blend with a fast closing filter."""
    f = midi_to_freq(midi)
    raw = 0.6 * saw(f, n, sr, rng.random()) + 0.4 * square(f, n, sr, rng.random(), pw=0.3)
    amp = exp_decay(n, sr, decay)
    fenv = 300.0 + 6000.0 * exp_decay(n, sr, decay * 0.6)
    y = sweep_filter(raw, fenv, sr, q=1.4, kind="lowpass")
    return y * amp


def lead_voice(
    midi: int,
    n: int,
    sr: int,
    rng: np.random.Generator,
    voices: int = 5,
    detune: float = 0.25,
    gate: int | None = None,
) -> np.ndarray:
    raw = supersaw(midi, n, sr, rng, voices=voices, detune=detune, spread=0.6)
    env = adsr(n, sr, attack=0.01, decay=0.2, sustain=0.75, release=0.08, gate=gate)
    y = lowpass(raw, 6000.0, sr)
    return y * env[:, None]


def rolling_bass_voice(
    midi: int,
    n: int,
    sr: int,
    rng: np.random.Generator,
    cutoff: float = 900.0,
    drive: float = 0.6,
    gate: int | None = None,
) -> np.ndarray:
    """Saw + sub-sine bass note with a snappy filter envelope and saturation (mono)."""
    f = midi_to_freq(midi)
    body = saw(f, n, sr, 0.0)
    sub = sine(f / 2.0, n, sr, 0.0) * 0.7
    env = adsr(n, sr, attack=0.001, decay=0.09, sustain=0.5, release=0.02, gate=gate)
    fenv = cutoff * (0.3 + 0.7 * exp_decay(n, sr, 0.08)) + 60.0
    y = sweep_filter(body, fenv, sr, q=1.2, kind="lowpass")
    y = soft_clip(y * (1.0 + drive), drive * 0.6) * 0.7 + sub * env
    return y * env


def acid_voice(
    freq: np.ndarray,
    n: int,
    sr: int,
    cutoff: float,
    resonance: float,
    env_mod: float,
    accent: bool,
    gate: int | None = None,
) -> np.ndarray:
    """303-style saw through a resonant lowpass with an exponential filter envelope (mono)."""
    raw = saw(freq, n, sr, 0.0)
    amp = adsr(n, sr, attack=0.002, decay=0.25, sustain=0.6, release=0.03, gate=gate)
    acc = 1.6 if accent else 1.0
    fenv = cutoff * (1.0 + env_mod * 3.0 * acc * exp_decay(n, sr, 0.18 if not accent else 0.3))
    q = resonance_to_q(resonance * (1.1 if accent else 1.0))
    y = sweep_filter(raw, fenv, sr, q=q, kind="lowpass", block=32)
    return soft_clip(y * amp * (1.2 if accent else 1.0), 0.25)
