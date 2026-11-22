import numpy as np
import pytest

from app.engine.generator import drums
from app.engine.generator.render import (
    RenderCancelled,
    chord_timeline,
    render_project,
    render_range,
    render_section,
)
from app.engine.timing import Grid
from app.project.model import ChordStep, Section, SectionKind

TOL_MS = 5.0


def _onsets(mono: np.ndarray, sr: int, threshold: float = 0.3, min_gap_ms: float = 200.0) -> list[int]:
    """Crude onset detector for synthetic drum stems: rising edges of the envelope."""
    env = np.abs(mono)
    hits: list[int] = []
    gap = int(min_gap_ms / 1000 * sr)
    last = -gap
    above = env > threshold * env.max()
    for i in np.flatnonzero(above):
        if i - last >= gap:
            hits.append(int(i))
            last = i
    return hits


def test_section_length_matches_grid(small_project):
    g = Grid(small_project.tempo, small_project.render.sample_rate)
    for i, sec in enumerate(small_project.sections):
        res = render_section(small_project, i)
        assert res.body_samples == g.section_samples(sec.bars)
        for stem in res.stems.values():
            assert stem.shape == (res.body_samples + res.tail_samples, 2)
            assert stem.dtype == np.float32
            assert np.isfinite(stem).all()
        assert res.trimmed().stems["drums"].shape[0] == res.body_samples


def test_full_render_is_exactly_total_bars(small_project):
    g = Grid(small_project.tempo, small_project.render.sample_rate)
    res = render_project(small_project)
    assert res.body_samples == g.section_samples(small_project.total_bars)
    assert set(res.stems) == {"drums", "bass", "synths", "fx"}
    assert np.abs(res.stems["drums"]).max() > 0.1
    assert np.abs(res.stems["synths"]).max() > 0.01


def test_render_is_deterministic(small_project):
    a = render_section(small_project, 3)
    b = render_section(small_project, 3)
    for bus in a.stems:
        assert np.array_equal(a.stems[bus], b.stems[bus])


def test_kick_hits_land_on_beats(small_project):
    sr = small_project.render.sample_rate
    g = Grid(small_project.tempo, sr)
    small_project.elements["hats"].enabled = False
    small_project.elements["clap"].enabled = False
    res = render_section(small_project, 3).trimmed()
    onsets = _onsets(res.stems["drums"][:, 0], sr)
    expected = [g.beats_to_samples(b) for b in range(16)]
    assert len(onsets) == 16
    for got, want in zip(onsets, expected, strict=True):
        assert abs(got - want) / sr * 1000 <= TOL_MS


def test_breakdown_has_no_drums_or_bass(small_project):
    res = render_section(small_project, 1)
    assert np.abs(res.stems["drums"]).max() == 0.0
    assert np.abs(res.stems["bass"]).max() == 0.0
    assert np.abs(res.stems["synths"]).max() > 0.0


def test_toggle_element_silences_its_stem(small_project):
    small_project.elements["bass"].enabled = False
    small_project.elements["acid"].enabled = False
    res = render_section(small_project, 3)
    assert np.abs(res.stems["bass"]).max() == 0.0
    small_project.elements["acid"].enabled = True
    res = render_section(small_project, 3)
    assert np.abs(res.stems["bass"]).max() > 0.0


def test_section_override_forces_element_on(small_project):
    small_project.sections[1].element_overrides["kick"] = True
    res = render_section(small_project, 1)
    assert np.abs(res.stems["drums"]).max() > 0.1


def test_level_db_scales_stem(small_project):
    loud = render_section(small_project, 3)
    small_project.elements["kick"].level_db = -12.0
    small_project.elements["hats"].enabled = False
    small_project.elements["clap"].enabled = False
    quiet = render_section(small_project, 3)
    assert np.abs(quiet.stems["drums"]).max() < np.abs(loud.stems["drums"]).max() * 0.5


def test_chord_timeline_cycles_and_truncates(small_project):
    sec = Section(kind=SectionKind.DROP, bars=6)
    small_project.chord_progression = [ChordStep(symbol="i", bars=2), ChordStep(symbol="VI", bars=2)]
    tl = chord_timeline(small_project, sec)
    assert [(b, bars) for b, bars, _ in tl] == [(0.0, 2.0), (8.0, 2.0), (16.0, 2.0)]
    sec = Section(kind=SectionKind.DROP, bars=3)
    tl = chord_timeline(small_project, sec)
    assert [(b, bars) for b, bars, _ in tl] == [(0.0, 2.0), (8.0, 1.0)]
    assert tl[0][2].root_name == "A" and tl[1][2].root_name == "F"


def test_section_chord_override_is_used(small_project):
    small_project.sections[3].chords = [ChordStep(symbol="iv", bars=1)]
    tl = chord_timeline(small_project, small_project.sections[3])
    assert all(c.root_name == "D" for _, _, c in tl)
    assert len(tl) == 4


def test_render_range_slices_exact_bars(small_project):
    g = Grid(small_project.tempo, small_project.render.sample_rate)
    res = render_range(small_project, 5, 7)  # spans build end + drop start
    assert res.body_samples == g.bars_to_samples(7) - g.bars_to_samples(5)
    for stem in res.stems.values():
        assert stem.shape[0] == res.body_samples
    with pytest.raises(ValueError):
        render_range(small_project, 7, 5)


def test_render_project_progress_and_cancel(small_project):
    seen: list[float] = []
    render_project(small_project, progress=lambda f, m: seen.append(f))
    assert seen[0] == 0.0 and seen[-1] == 1.0
    with pytest.raises(RenderCancelled):
        render_project(small_project, cancel=lambda: True)


def test_build_has_riser_and_sweep(small_project):
    res = render_section(small_project, 2)
    assert any("riser" in n for n in res.notes)
    assert any("sweep" in n for n in res.notes)
    fx = res.stems["fx"][: res.body_samples, 0]
    # riser gets louder towards the end of the build
    first, last = np.abs(fx[: len(fx) // 4]).mean(), np.abs(fx[-len(fx) // 4 :]).mean()
    assert last > first * 2


def test_drum_one_shots_are_normalized(sr):
    for sample in (drums.kick(sr), drums.hat(sr), drums.hat(sr, True), drums.clap(sr), drums.snare(sr)):
        assert sample.ndim == 1
        assert np.max(np.abs(sample)) == pytest.approx(1.0, abs=1e-6)
        assert np.isfinite(sample).all()
    r = drums.riser(sr, sr)
    assert r.shape == (sr, 2) and np.isfinite(r).all()


def test_other_presets_and_scales_render(small_project):
    from app.project.presets import apply_style_preset

    for style in ("Uplifting Trance", "Progressive", "Psytrance-lite"):
        p = apply_style_preset(small_project, style)
        p.key, p.scale = "C", "major"
        p.chord_progression = [
            ChordStep(symbol="I"),
            ChordStep(symbol="V"),
            ChordStep(symbol="vi"),
            ChordStep(symbol="IV"),
        ]
        res = render_section(p, 3)
        assert np.isfinite(res.stems["synths"]).all()
        assert np.abs(res.stems["synths"]).max() > 0
