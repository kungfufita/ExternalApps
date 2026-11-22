"""Sidechain pumping, saturation and a lookahead limiter."""

from __future__ import annotations

import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d, uniform_filter1d

from app.engine.dsp import db_to_lin


def sidechain_envelope(
    n: int,
    samples_per_beat: float,
    amount: float,
    release_beats: float = 0.9,
    hit_beats: list[float] | None = None,
    attack_ms: float = 2.0,
    sr: int = 44100,
) -> np.ndarray:
    """Gain curve (0..1) that ducks at every kick and recovers exponentially.

    ``hit_beats`` lists beat positions (relative to sample 0) where the kick hits; when
    omitted every beat is a hit.
    """
    env = np.ones(n, dtype=np.float64)
    amount = float(min(max(amount, 0.0), 1.0))
    if amount <= 0.0 or n == 0:
        return env
    if hit_beats is None:
        hit_beats = list(np.arange(0.0, n / samples_per_beat + 1e-9, 1.0))
    release = max(1, int(release_beats * samples_per_beat))
    attack = max(1, int(attack_ms / 1000 * sr))
    t = np.arange(release)
    curve = 1.0 - amount * np.exp(-5.0 * t / release)
    for beat in hit_beats:
        start = int(round(beat * samples_per_beat))
        if start >= n:
            continue
        end = min(start + release, n)
        seg = curve[: end - start]
        env[start:end] = np.minimum(env[start:end], seg)
        # Short attack ramp before the hit so the duck is not a hard step.
        a0 = max(0, start - attack)
        if start > a0:
            ramp = np.linspace(env[a0], 1.0 - amount, start - a0)
            env[a0:start] = np.minimum(env[a0:start], ramp)
    return env


def apply_gain_curve(x: np.ndarray, gain: np.ndarray) -> np.ndarray:
    n = min(x.shape[0], gain.shape[0])
    y = x.copy()
    if y.ndim == 2:
        y[:n] *= gain[:n, None]
    else:
        y[:n] *= gain[:n]
    return y


def saturate(x: np.ndarray, amount: float) -> np.ndarray:
    """Warm tanh saturation; ``amount`` 0 is bypass, 1 is heavy."""
    amount = float(min(max(amount, 0.0), 1.0))
    if amount <= 0.0:
        return x
    drive = 1.0 + 6.0 * amount
    wet = np.clip(np.tanh(x * drive) / np.tanh(drive), -1.0, 1.0)
    return x * (1.0 - amount) + wet * amount


def limiter(
    x: np.ndarray,
    sr: int,
    ceiling_db: float = -0.3,
    lookahead_ms: float = 5.0,
    release_ms: float = 80.0,
) -> np.ndarray:
    """Brick-wall peak limiter with lookahead and smooth release (vectorized)."""
    ceiling = db_to_lin(ceiling_db)
    if x.size == 0:
        return x
    peak = np.max(np.abs(x), axis=1) if x.ndim == 2 else np.abs(x)
    la = max(1, int(lookahead_ms / 1000 * sr))
    held = maximum_filter1d(peak, size=2 * la + 1, mode="nearest")
    needed = np.minimum(1.0, ceiling / np.maximum(held, 1e-9))
    # Release: smooth the gain-reduction so it returns slowly, never exceeding what is needed.
    k = float(np.exp(-1.0 / max(release_ms / 1000 * sr, 1.0)))
    zi = signal.lfilter_zi([1.0 - k], [1.0, -k]) * needed[0]
    smoothed, _ = signal.lfilter([1.0 - k], [1.0, -k], needed, zi=zi)
    gain = np.minimum(needed, smoothed)
    gain = uniform_filter1d(gain, size=la, mode="nearest")
    gain = np.minimum(gain, needed)  # smoothing must not re-introduce overs
    y = x * (gain[:, None] if x.ndim == 2 else gain)
    return np.clip(y, -ceiling, ceiling)
