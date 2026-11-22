"""Static and time-varying filters built on scipy.signal."""

from __future__ import annotations

import numpy as np
from scipy import signal


def _nyq_clamp(freq: float, sr: int) -> float:
    return float(min(max(freq, 10.0), sr * 0.45))


def butter_filter(x: np.ndarray, cutoff_hz: float, sr: int, kind: str = "lowpass", order: int = 2) -> np.ndarray:
    """Causal Butterworth filter along axis 0 (works for mono or stereo)."""
    sos = signal.butter(order, _nyq_clamp(cutoff_hz, sr), btype=kind, fs=sr, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def lowpass(x: np.ndarray, cutoff_hz: float, sr: int, order: int = 2) -> np.ndarray:
    return butter_filter(x, cutoff_hz, sr, "lowpass", order)


def highpass(x: np.ndarray, cutoff_hz: float, sr: int, order: int = 2) -> np.ndarray:
    return butter_filter(x, cutoff_hz, sr, "highpass", order)


def bandpass(x: np.ndarray, low_hz: float, high_hz: float, sr: int, order: int = 2) -> np.ndarray:
    lo, hi = _nyq_clamp(low_hz, sr), _nyq_clamp(high_hz, sr)
    if hi <= lo:
        hi = min(lo * 1.5, sr * 0.45)
    sos = signal.butter(order, [lo, hi], btype="bandpass", fs=sr, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def rbj_coeffs(kind: str, fc: float, q: float, sr: int) -> tuple[np.ndarray, np.ndarray]:
    """RBJ cookbook biquad coefficients (``b``, ``a``) for lowpass/highpass/bandpass."""
    fc = _nyq_clamp(fc, sr)
    q = max(q, 0.1)
    w0 = 2.0 * np.pi * fc / sr
    cw, sw = np.cos(w0), np.sin(w0)
    alpha = sw / (2.0 * q)
    if kind == "lowpass":
        b0, b1, b2 = (1 - cw) / 2, 1 - cw, (1 - cw) / 2
    elif kind == "highpass":
        b0, b1, b2 = (1 + cw) / 2, -(1 + cw), (1 + cw) / 2
    elif kind == "bandpass":
        b0, b1, b2 = alpha, 0.0, -alpha
    else:
        raise ValueError(kind)
    a0, a1, a2 = 1 + alpha, -2 * cw, 1 - alpha
    return np.array([b0, b1, b2]) / a0, np.array([1.0, a1 / a0, a2 / a0])


def resonance_to_q(resonance: float) -> float:
    """Map a 0..1 'resonance' knob to a biquad Q (0.707 .. ~12)."""
    r = min(max(resonance, 0.0), 1.0)
    return float(0.707 * (12.0 / 0.707) ** r)


def sweep_filter(
    x: np.ndarray,
    cutoff_hz: np.ndarray,
    sr: int,
    q: float = 0.707,
    kind: str = "lowpass",
    block: int = 64,
) -> np.ndarray:
    """Resonant biquad whose cutoff follows ``cutoff_hz`` (one value per sample).

    Coefficients are updated every ``block`` samples; filter state is carried across blocks,
    so this is the workhorse for acid lines, build sweeps and filter envelopes.
    """
    n = x.shape[0]
    if cutoff_hz.shape[0] != n:
        raise ValueError("cutoff_hz must have one value per sample")
    y = np.empty_like(x, dtype=np.float64)
    zi_shape = (2,) if x.ndim == 1 else (2, x.shape[1])
    zi = np.zeros(zi_shape)
    for i in range(0, n, block):
        j = min(i + block, n)
        fc = float(cutoff_hz[(i + j) // 2])
        b, a = rbj_coeffs(kind, fc, q, sr)
        y[i:j], zi = signal.lfilter(b, a, x[i:j], axis=0, zi=zi)
    return y


def one_pole_lowpass(x: np.ndarray, cutoff_hz: float, sr: int) -> np.ndarray:
    """Gentle 6 dB/oct lowpass; used for damping delay/reverb taps."""
    k = float(np.exp(-2.0 * np.pi * _nyq_clamp(cutoff_hz, sr) / sr))
    return signal.lfilter([1.0 - k], [1.0, -k], x, axis=0)
