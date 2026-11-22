"""Tempo-synced feedback delay (optionally ping-pong) implemented as a tap sum."""

from __future__ import annotations

import numpy as np

from app.engine.fx.filters import one_pole_lowpass


def synced_delay(
    x: np.ndarray,
    delay_samples: int,
    feedback: float = 0.4,
    mix: float = 0.25,
    sr: int = 44100,
    ping_pong: bool = True,
    damping_hz: float = 5000.0,
    max_taps: int = 48,
) -> np.ndarray:
    """Feedback delay. Output is extended so the repeats are not cut off."""
    if mix <= 0.0 or delay_samples <= 0:
        return x
    feedback = float(min(max(feedback, 0.0), 0.95))
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    taps = 1
    while taps < max_taps and feedback**taps > 10 ** (-60 / 20):
        taps += 1
    n = x.shape[0]
    out = np.zeros((n + taps * delay_samples, 2), dtype=np.float64)
    out[:n] += x * (1.0 - mix)
    tap_sig = x.copy()
    for k in range(1, taps + 1):
        tap_sig = one_pole_lowpass(tap_sig, damping_hz, sr) * feedback
        sig = tap_sig
        if ping_pong:
            # Alternate the stereo image on each repeat.
            sig = sig[:, ::-1] if k % 2 else sig
        start = k * delay_samples
        out[start : start + n] += sig * mix
    return out


def beats_to_delay_samples(beats: float, tempo: float, sr: int) -> int:
    return int(round(beats * 60.0 / tempo * sr))
