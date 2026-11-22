import math

import pytest

from app.engine.timing import Grid, normalize_bpm, recommend_stretch_mode, stretch_ratio


def test_bar_and_beat_durations():
    g = Grid(138.0, 44100)
    assert math.isclose(g.beat_seconds, 60 / 138)
    assert math.isclose(g.bar_seconds, 240 / 138)
    assert math.isclose(g.samples_per_bar, 240 / 138 * 44100)


def test_bars_to_samples_round_trip():
    g = Grid(120.0, 48000)
    assert g.bars_to_samples(1) == 96000  # 2 s at 48 kHz
    assert g.bars_to_samples(0.25) == 24000
    assert math.isclose(g.samples_to_bars(96000), 1.0)


def test_section_samples_no_drift():
    g = Grid(138.0, 44100)
    total = g.section_samples(104)
    assert abs(total - 104 * g.samples_per_bar) <= 0.5


def test_snap_to_bars_beats_and_sixteenths():
    g = Grid(140.0, 44100)
    assert g.snap_bars(3.4, 1) == 3.0
    assert g.snap_bars(3.6, 1) == 4.0
    assert g.snap_bars(3.3, 4) == 3.25
    assert g.snap_bars(3.07, 16) == pytest.approx(3.0625)
    assert g.snap_bars(-0.2, 1) == 0.0


def test_snap_seconds_matches_grid():
    g = Grid(120.0, 44100)  # bar = 2 s, beat = 0.5 s
    assert g.snap_seconds(2.9, 1) == pytest.approx(2.0)
    assert g.snap_seconds(2.9, 4) == pytest.approx(3.0)


@pytest.mark.parametrize(
    "source,tempo,mode,expected",
    [
        (69.0, 138.0, "half_time", 1.0),
        (138.0, 138.0, "normal_time", 1.0),
        (120.0, 138.0, "half_time", 120 / 69),
        (120.0, 138.0, "normal_time", 120 / 138),
        (90.0, 128.0, "half_time", 90 / 64),
    ],
)
def test_stretch_ratio(source, tempo, mode, expected):
    assert stretch_ratio(source, tempo, mode) == pytest.approx(expected)


def test_stretch_ratio_rejects_bad_tempo():
    with pytest.raises(ValueError):
        stretch_ratio(0, 138, "half_time")


def test_normalize_bpm_folds_octaves():
    assert normalize_bpm(276.0) == 138.0
    assert normalize_bpm(34.5) == 138.0
    assert normalize_bpm(100.0) == 100.0


def test_recommend_stretch_mode():
    assert recommend_stretch_mode(72.0, 138.0) == "half_time"
    assert recommend_stretch_mode(135.0, 138.0) == "normal_time"
