import numpy as np

from app.engine.mix import bus_gains, mix_stems
from app.project.model import FxSettings, MixSettings


def _stems(n=1000):
    return {
        "drums": np.full((n, 2), 0.2, dtype=np.float32),
        "bass": np.full((n, 2), 0.2, dtype=np.float32),
        "synths": np.zeros((n // 2, 2), dtype=np.float32),
        "fx": np.zeros((n, 2), dtype=np.float32),
        "vocal": np.zeros((n, 2), dtype=np.float32),
    }


def test_mute_and_solo_logic():
    m = MixSettings()
    m.buses["drums"].mute = True
    g = bus_gains(m)
    assert g["drums"] == 0.0 and g["bass"] == 1.0
    m = MixSettings()
    m.buses["vocal"].solo = True
    g = bus_gains(m)
    assert g["vocal"] == 1.0 and all(g[b] == 0.0 for b in g if b != "vocal")


def test_mix_sums_and_handles_short_stems():
    m = MixSettings(master_level_db=0.0, limiter_enabled=False)
    out = mix_stems(_stems(), m, FxSettings(master_saturation=0.0), 44100)
    assert out.shape == (1000, 2)
    assert out.dtype == np.float32
    assert np.allclose(out[0], 0.4, atol=1e-6)


def test_master_limiter_holds_ceiling():
    stems = {"drums": np.full((44100, 2), 2.0, dtype=np.float32)}
    m = MixSettings(master_level_db=0.0, limiter_ceiling_db=-0.3)
    out = mix_stems(stems, m, None, 44100)
    assert np.max(np.abs(out)) <= 10 ** (-0.3 / 20) + 1e-5


def test_empty_stems():
    assert mix_stems({}, MixSettings()).shape == (0, 2)
