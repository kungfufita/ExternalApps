import numpy as np
import pytest

from app.engine.fx import (
    beats_to_delay_samples,
    limiter,
    reverb,
    reverb_tail_samples,
    saturate,
    sidechain_envelope,
    sweep_filter,
    synced_delay,
)
from app.engine.generator.patterns import snare_roll_steps


def test_sidechain_ducks_on_each_beat(sr):
    spb = sr * 60 / 120  # 120 BPM -> 22050 samples per beat
    env = sidechain_envelope(int(spb * 4), spb, amount=0.8, release_beats=0.5, sr=sr)
    for beat in range(4):
        i = int(beat * spb)
        assert env[i] == pytest.approx(0.2, abs=0.02)
        # fully recovered before the next beat
        assert env[i + int(spb * 0.95)] > 0.95
    assert env.max() <= 1.0 and env.min() >= 0.19


def test_limiter_respects_ceiling(sr):
    rng = np.random.default_rng(0)
    x = rng.standard_normal((sr, 2)) * 3.0
    y = limiter(x, sr, ceiling_db=-1.0)
    assert np.max(np.abs(y)) <= 10 ** (-1.0 / 20) + 1e-6
    quiet = np.full((sr, 2), 0.1)
    assert np.allclose(limiter(quiet, sr), quiet)


def test_reverb_adds_tail_and_preserves_dry(sr):
    x = np.zeros((sr, 2))
    x[100] = 1.0
    y = reverb(x, sr, size=0.5, damping=0.4, mix=0.3)
    assert y.shape[0] >= sr + reverb_tail_samples(sr, 0.5) - sr // 10
    assert y[100, 0] == pytest.approx(0.7, abs=0.05)
    assert np.abs(y[sr:]).max() > 0  # there is a tail
    assert np.array_equal(reverb(x, sr, mix=0.0), x)


def test_delay_taps_land_on_multiples(sr):
    d = beats_to_delay_samples(0.75, 138.0, sr)
    assert d == round(0.75 * 60 / 138 * sr)
    x = np.zeros((sr, 2))
    x[0] = 1.0
    y = synced_delay(x, d, feedback=0.5, mix=0.5, sr=sr, ping_pong=False, damping_hz=20000)
    for k in (1, 2, 3):
        window = np.abs(y[k * d - 5 : k * d + 50]).sum(axis=1)
        assert window.argmax() <= 10, "tap not at the expected position"


def test_sweep_filter_tracks_cutoff(sr):
    rng = np.random.default_rng(1)
    noise = rng.standard_normal(sr)
    closed = sweep_filter(noise, np.full(sr, 200.0), sr, q=0.7)
    open_ = sweep_filter(noise, np.full(sr, 8000.0), sr, q=0.7)
    assert np.std(closed) < np.std(open_)
    with pytest.raises(ValueError):
        sweep_filter(noise, np.full(10, 200.0), sr)


def test_saturate_is_bounded_and_bypassable():
    x = np.linspace(-2, 2, 100)
    assert np.array_equal(saturate(x, 0.0), x)
    assert np.max(np.abs(saturate(x, 1.0))) <= 1.0 + 1e-9


def test_snare_roll_subdivisions_double_each_bar():
    hits = snare_roll_steps(4, roll_bars=4)
    beats = [b for b, _ in hits]
    per_bar = [sum(1 for b in beats if bar * 4 <= b < bar * 4 + 4) for bar in range(4)]
    assert per_bar == [4, 8, 16, 32]
    assert beats == sorted(beats)
    assert hits[-1][1] <= 1.0 and hits[0][1] < hits[-1][1]
