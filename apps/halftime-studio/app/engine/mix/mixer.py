"""Sum stems to a stereo master according to :class:`MixSettings`."""

from __future__ import annotations

import numpy as np

from app.engine.dsp import db_to_lin
from app.engine.fx.dynamics import limiter, saturate
from app.project.model import FxSettings, MixSettings


def bus_gains(mix: MixSettings) -> dict[str, float]:
    """Linear gain per bus after level, mute and solo logic."""
    any_solo = any(b.solo for b in mix.buses.values())
    gains: dict[str, float] = {}
    for name, b in mix.buses.items():
        audible = (b.solo if any_solo else True) and not b.mute
        gains[name] = db_to_lin(b.level_db) if audible else 0.0
    return gains


def _pan_gains(pan: float) -> tuple[float, float]:
    angle = (pan + 1.0) * np.pi / 4.0
    return float(np.cos(angle) * np.sqrt(2)), float(np.sin(angle) * np.sqrt(2))


def mix_stems(
    stems: dict[str, np.ndarray],
    mix: MixSettings,
    fx: FxSettings | None = None,
    sr: int = 44100,
) -> np.ndarray:
    """Return the stereo master (float32) for the given stems."""
    if not stems:
        return np.zeros((0, 2), dtype=np.float32)
    n = max(s.shape[0] for s in stems.values())
    master = np.zeros((n, 2), dtype=np.float64)
    gains = bus_gains(mix)
    for name, data in stems.items():
        g = gains.get(name, 1.0)
        if g == 0.0:
            continue
        pan_l, pan_r = _pan_gains(mix.buses[name].pan) if name in mix.buses else (1.0, 1.0)
        master[: data.shape[0], 0] += data[:, 0] * g * pan_l
        master[: data.shape[0], 1] += data[:, 1] * g * pan_r
    master *= db_to_lin(mix.master_level_db)
    if fx is not None and fx.master_saturation > 0:
        master = saturate(master, fx.master_saturation * 0.5)
    if mix.limiter_enabled:
        master = limiter(master, sr, ceiling_db=mix.limiter_ceiling_db)
    return master.astype(np.float32)
