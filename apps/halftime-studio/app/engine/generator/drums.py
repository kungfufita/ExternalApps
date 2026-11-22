"""Synthesized drums and one-shot FX: kick, hats, clap, impact, riser, snare roll."""

from __future__ import annotations

from functools import lru_cache

import numpy as np

from app.engine.dsp import exp_decay, soft_clip
from app.engine.fx.filters import bandpass, highpass, lowpass, sweep_filter


@lru_cache(maxsize=64)
def kick(sr: int, punch: float = 0.8, sub: float = 0.9, decay: float = 0.45) -> np.ndarray:
    """Pitch-swept sine kick with a click transient. Returns a mono array (cached)."""
    n = int((decay + 0.1) * sr)
    t = np.arange(n) / sr
    f_start, f_end = 160.0 + 120.0 * punch, 42.0 + 10.0 * sub
    pitch = f_end + (f_start - f_end) * np.exp(-t / (0.028 + 0.02 * (1 - punch)))
    phase = 2 * np.pi * np.cumsum(pitch) / sr
    body = np.sin(phase) * exp_decay(n, sr, decay)
    click_n = int(0.004 * sr)
    click = np.zeros(n)
    rng = np.random.default_rng(3)
    click[:click_n] = rng.uniform(-1, 1, click_n) * np.linspace(1, 0, click_n) ** 2
    click = highpass(click, 2500.0, sr) * punch * 0.6
    y = soft_clip(body * (1.0 + 0.5 * sub) + click, 0.3)
    return (y / (np.max(np.abs(y)) + 1e-9)).astype(np.float64)


@lru_cache(maxsize=16)
def hat(sr: int, open_: bool = False, tone: float = 0.6) -> np.ndarray:
    """Metallic noise hat (mono, cached). ``open_`` gives the longer offbeat hat."""
    length = 0.22 if open_ else 0.05
    n = int(length * sr)
    rng = np.random.default_rng(11 if open_ else 12)
    noise = rng.uniform(-1, 1, n)
    t = np.arange(n) / sr
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (3140.0, 4210.0, 5590.0, 7010.0, 9230.0))
    y = 0.7 * noise + 0.3 * metal / 5.0
    y = bandpass(y, 5000.0 + 3000.0 * tone, 14000.0, sr)
    y *= exp_decay(n, sr, length * 0.9)
    return y / (np.max(np.abs(y)) + 1e-9)


@lru_cache(maxsize=4)
def clap(sr: int) -> np.ndarray:
    """Layered noise bursts (mono, cached)."""
    n = int(0.3 * sr)
    rng = np.random.default_rng(21)
    y = np.zeros(n)
    for i, g in enumerate((1.0, 0.8, 0.7)):
        off = int(i * 0.011 * sr)
        burst_n = int(0.02 * sr)
        y[off : off + burst_n] += rng.uniform(-1, 1, burst_n) * exp_decay(burst_n, sr, 0.015) * g
    tail_off = int(0.03 * sr)
    y[tail_off:] += rng.uniform(-1, 1, n - tail_off) * exp_decay(n - tail_off, sr, 0.18) * 0.8
    y = bandpass(y, 900.0, 5500.0, sr)
    return y / (np.max(np.abs(y)) + 1e-9)


@lru_cache(maxsize=4)
def snare(sr: int) -> np.ndarray:
    """Tight electronic snare for build rolls (mono, cached)."""
    n = int(0.18 * sr)
    rng = np.random.default_rng(31)
    t = np.arange(n) / sr
    tone = np.sin(2 * np.pi * (190.0 + 80.0 * np.exp(-t * 40)) * t) * exp_decay(n, sr, 0.08)
    noise = bandpass(rng.uniform(-1, 1, n), 1500.0, 9000.0, sr) * exp_decay(n, sr, 0.15)
    y = 0.5 * tone + 0.8 * noise
    return y / (np.max(np.abs(y)) + 1e-9)


def impact(sr: int, seed: int = 41) -> np.ndarray:
    """Sub boom + noise crash used at section downbeats (stereo)."""
    n = int(2.2 * sr)
    rng = np.random.default_rng(seed)
    t = np.arange(n) / sr
    boom = np.sin(2 * np.pi * (38.0 + 60.0 * np.exp(-t * 12)) * t) * exp_decay(n, sr, 1.4)
    crash = rng.uniform(-1, 1, (n, 2)) * exp_decay(n, sr, 1.8)[:, None]
    crash = highpass(crash, 1800.0, sr)
    y = crash * 0.5 + boom[:, None] * 0.9
    return soft_clip(y, 0.2)


def riser(sr: int, n: int, seed: int = 51) -> np.ndarray:
    """Noise sweep + rising tone that peaks exactly at the end of ``n`` samples (stereo)."""
    rng = np.random.default_rng(seed)
    t = np.linspace(0.0, 1.0, n, endpoint=False)
    noise = rng.uniform(-1, 1, (n, 2))
    cutoff = 200.0 * (40.0**t)  # 200 Hz -> 8 kHz
    swept = sweep_filter(noise, np.minimum(cutoff, sr * 0.45), sr, q=2.0, kind="bandpass", block=256)
    tone_f = 110.0 * (4.0**t)  # two octaves up
    tone = np.sin(2 * np.pi * np.cumsum(tone_f) / sr)
    tone = np.stack([tone, np.roll(tone, int(0.003 * sr))], axis=1)
    amp = (t**2.2)[:, None]
    y = swept * 0.9 * amp + tone[:, None].reshape(n, 2) * 0.25 * amp
    return lowpass(y, 14000.0, sr)


def downlifter(sr: int, n: int, seed: int = 61) -> np.ndarray:
    """Falling noise sweep that starts loud; placed right after a drop lands (stereo)."""
    rng = np.random.default_rng(seed)
    t = np.linspace(0.0, 1.0, n, endpoint=False)
    noise = rng.uniform(-1, 1, (n, 2))
    cutoff = 8000.0 * (0.03**t)
    swept = sweep_filter(noise, np.maximum(cutoff, 60.0), sr, q=1.5, kind="lowpass", block=256)
    amp = ((1.0 - t) ** 1.5)[:, None]
    return swept * amp * 0.7
