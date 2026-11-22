"""Convolution reverb with a synthesized stereo impulse response (no sample files)."""

from __future__ import annotations

from functools import lru_cache

import numpy as np
from scipy import signal

from app.engine.fx.filters import highpass, lowpass


@lru_cache(maxsize=16)
def _impulse_response(sr: int, size: float, damping: float, seed: int) -> np.ndarray:
    """Exponentially decaying, progressively darkening noise tail with a short pre-delay."""
    size = float(min(max(size, 0.0), 1.0))
    damping = float(min(max(damping, 0.0), 1.0))
    length_s = 0.4 + 3.6 * size
    n = int(length_s * sr)
    rng = np.random.default_rng(seed)
    noise = rng.standard_normal((n, 2))
    # Decorrelate channels slightly for width.
    noise[:, 1] = 0.7 * noise[:, 1] + 0.3 * np.roll(noise[:, 0], int(0.0007 * sr))
    t = np.arange(n) / sr
    decay = np.exp(-6.9 * t / length_s)  # -60 dB at the end of the tail
    ir = noise * decay[:, None]
    # Early reflections: a few sparse taps in the first 60 ms.
    for tap_ms, gain in ((7, 0.6), (13, 0.45), (23, 0.35), (37, 0.25), (53, 0.2)):
        idx = int(tap_ms / 1000 * sr)
        if idx < n:
            ir[idx] += gain * rng.choice([-1, 1], size=2)
    # Damping: darken the tail; stronger damping -> lower cutoff.
    cutoff = 12000.0 - 9500.0 * damping
    ir = lowpass(ir, cutoff, sr, order=1)
    ir = highpass(ir, 120.0, sr, order=1)
    pre = np.zeros((int(0.02 * sr), 2))
    ir = np.vstack([pre, ir])
    # Normalize so a unit impulse produces roughly unit-energy output.
    ir /= np.sqrt(np.sum(ir**2) / 2.0) + 1e-9
    ir *= 0.25
    return ir.astype(np.float32)


def reverb(
    x: np.ndarray, sr: int, size: float = 0.6, damping: float = 0.4, mix: float = 0.25, seed: int = 7
) -> np.ndarray:
    """Return ``dry * (1-mix) + wet * mix``; the output is longer than the input by the tail."""
    if mix <= 0.0:
        return x
    ir = _impulse_response(sr, round(size, 3), round(damping, 3), seed)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    wet_l = signal.fftconvolve(x[:, 0], ir[:, 0])
    wet_r = signal.fftconvolve(x[:, 1], ir[:, 1])
    wet = np.stack([wet_l, wet_r], axis=1)
    out = wet * mix
    out[: x.shape[0]] += x * (1.0 - mix)
    return out


def reverb_tail_samples(sr: int, size: float) -> int:
    return int((0.42 + 3.6 * min(max(size, 0.0), 1.0)) * sr)
