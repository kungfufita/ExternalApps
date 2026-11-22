"""Small, dependency-light DSP helpers used across the engine.

Conventions: audio buffers are ``float32``/``float64`` numpy arrays shaped ``(n, 2)`` for
stereo or ``(n,)`` for mono, with samples in ``[-1, 1]``.
"""

from __future__ import annotations

import numpy as np

EPS = 1e-12


def db_to_lin(db: float) -> float:
    return float(10.0 ** (db / 20.0))


def lin_to_db(lin: float) -> float:
    return float(20.0 * np.log10(max(abs(lin), EPS)))


def to_stereo(x: np.ndarray, pan: float = 0.0) -> np.ndarray:
    """Mono -> stereo with constant-power panning (``pan`` in -1..1). Stereo passes through."""
    if x.ndim == 2:
        return x
    angle = (pan + 1.0) * np.pi / 4.0
    out = np.empty((x.shape[0], 2), dtype=x.dtype)
    out[:, 0] = x * np.cos(angle)
    out[:, 1] = x * np.sin(angle)
    return out


def to_mono(x: np.ndarray) -> np.ndarray:
    return x if x.ndim == 1 else x.mean(axis=1)


def peak(x: np.ndarray) -> float:
    return float(np.max(np.abs(x))) if x.size else 0.0


def rms(x: np.ndarray) -> float:
    return float(np.sqrt(np.mean(np.square(x)))) if x.size else 0.0


def normalize_peak(x: np.ndarray, target_db: float = -1.0) -> np.ndarray:
    p = peak(x)
    if p < EPS:
        return x
    return x * (db_to_lin(target_db) / p)


def adsr(
    n: int, sr: int, attack: float, decay: float, sustain: float, release: float, gate: int | None = None
) -> np.ndarray:
    """Linear-attack / exponential-decay ADSR of ``n`` samples.

    ``gate`` is the sample at which the note is released (defaults to ``n - release``).
    """
    n = int(n)
    env = np.zeros(n, dtype=np.float64)
    if n == 0:
        return env
    a = max(1, int(attack * sr))
    d = max(1, int(decay * sr))
    r = max(1, int(release * sr))
    gate = n - r if gate is None else int(min(max(gate, 1), n))
    t = np.arange(n)
    # attack
    env[:a] = np.minimum(1.0, t[:a] / a)
    # decay to sustain
    if gate > a:
        seg = t[a:gate] - a
        env[a:gate] = sustain + (1.0 - sustain) * np.exp(-5.0 * seg / d)
    # release from wherever we are
    level_at_gate = env[gate - 1] if gate > 0 else 1.0
    if gate < n:
        seg = t[gate:] - gate
        env[gate:] = level_at_gate * np.exp(-6.0 * seg / r)
    return env


def exp_decay(n: int, sr: int, time_s: float, floor_db: float = -60.0) -> np.ndarray:
    """Exponential decay reaching ``floor_db`` after ``time_s`` seconds."""
    n = int(n)
    k = -np.log(10.0 ** (floor_db / 20.0)) / max(time_s * sr, 1.0)
    return np.exp(-k * np.arange(n))


def soft_clip(x: np.ndarray, drive: float = 1.0) -> np.ndarray:
    """tanh saturation with gain compensation so unity input stays near unity."""
    if drive <= 0:
        return x
    g = 1.0 + 4.0 * drive
    return np.tanh(x * g) / np.tanh(g)


def fade(x: np.ndarray, fade_in: int = 0, fade_out: int = 0) -> np.ndarray:
    """Apply linear fades in place-safe copy. Fade lengths in samples."""
    y = x.copy()
    n = y.shape[0]
    fi = int(min(max(fade_in, 0), n))
    fo = int(min(max(fade_out, 0), n))
    if fi > 0:
        ramp = np.linspace(0.0, 1.0, fi, endpoint=False)
        y[:fi] = (y[:fi].T * ramp).T
    if fo > 0:
        ramp = np.linspace(1.0, 0.0, fo, endpoint=False)
        y[n - fo :] = (y[n - fo :].T * ramp).T
    return y


def mix_into(buffer: np.ndarray, signal: np.ndarray, offset: int, gain: float = 1.0) -> None:
    """Add ``signal`` into ``buffer`` starting at ``offset``, clipping at the buffer edges."""
    n = buffer.shape[0]
    if offset >= n:
        return
    start = max(offset, 0)
    src_start = start - offset
    end = min(offset + signal.shape[0], n)
    if end <= start:
        return
    seg = signal[src_start : src_start + (end - start)]
    if buffer.ndim == 2 and seg.ndim == 1:
        seg = to_stereo(seg)
    buffer[start:end] += seg * gain


def white_noise(n: int, rng: np.random.Generator) -> np.ndarray:
    return rng.uniform(-1.0, 1.0, int(n))


def ensure_length(x: np.ndarray, n: int) -> np.ndarray:
    """Pad with zeros or truncate so the first dimension is exactly ``n``."""
    if x.shape[0] == n:
        return x
    if x.shape[0] > n:
        return x[:n]
    pad = [(0, n - x.shape[0])] + [(0, 0)] * (x.ndim - 1)
    return np.pad(x, pad)
