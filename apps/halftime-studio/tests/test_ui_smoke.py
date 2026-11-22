"""Offscreen GUI tests. Skipped when PySide6 is not installed."""

from __future__ import annotations

import time

import numpy as np
import pytest

pytest.importorskip("PySide6")

from app.project import load_project  # noqa: E402
from app.project.model import SectionKind  # noqa: E402


@pytest.fixture(scope="module")
def qapp():
    from app.ui.main import create_app

    return create_app(["halftime-tests"])


def _pump(qapp, seconds: float, until=None) -> None:
    t0 = time.time()
    while time.time() - t0 < seconds:
        qapp.processEvents()
        if until and until():
            return
        time.sleep(0.01)


@pytest.fixture
def window(qapp, small_project):
    from app.ui.main_window import MainWindow

    w = MainWindow(small_project)
    w.engine.use_device = False  # drive the engine manually; no sound card in CI
    w.show()
    yield w
    w.store._dirty = False
    w.close()
    w.deleteLater()
    _pump(qapp, 0.2)


def test_window_renders_all_sections_and_plays(qapp, window):
    _pump(qapp, 30, until=lambda: window.manager.pending_count == 0 and len(window.timeline.canvas.rendered) == 4)
    assert len(window.timeline.canvas.rendered) == 4
    window._seek_bar(6.0)  # inside the drop
    window.transport.play_btn.setChecked(True)
    assert window.engine.playing
    block = window.engine.render_block(8192)
    assert np.abs(block).max() > 0.05 and not window.engine.underrun
    window._stop()
    assert not window.engine.playing and window.engine.position == 0


def test_start_screen_builds_project(qapp):
    from app.ui.start_screen import NewProjectDialog, StartScreen

    s = StartScreen()
    s.show()
    _pump(qapp, 0.1)
    dlg = NewProjectDialog(s, "Progressive")
    p = dlg.build()
    assert p.style.value == "Progressive" and p.tempo == 128.0
    s.close()
    s.deleteLater()
    _pump(qapp, 0.1)


def test_edits_through_widgets_are_undoable(qapp, window):
    sid = window.project.sections[3].id
    window._select_section(sid)
    window.inspector.bars.setValue(8)
    window.inspector.bars.editingFinished.emit()
    assert window.project.sections[3].bars == 8
    window.undo_action.trigger()
    assert window.project.sections[3].bars == 4
    window.redo_action.trigger()
    assert window.project.sections[3].bars == 8
    window.inspector.overrides["acid"].setCurrentIndex(2)  # Off
    assert window.project.sections[3].element_overrides["acid"] is False
    window.transport.tempo.setValue(140)
    window.transport.tempo.editingFinished.emit()
    assert window.project.tempo == 140.0
    assert window.store.can_undo and "tempo" in window.store.undo_description


def test_chord_text_and_style(qapp, window):
    window.inspector.chords_edit.setText("Am F:1 C:1 G")
    window.inspector.chords_edit.editingFinished.emit()
    assert [(c.symbol, c.bars) for c in window.project.chord_progression] == [
        ("Am", 2.0),
        ("F", 1.0),
        ("C", 1.0),
        ("G", 2.0),
    ]
    window.inspector.chords_edit.setText("Am Zz")
    window.inspector.chords_edit.editingFinished.emit()
    assert "Zz" in window.inspector.chords_error.text()
    assert len(window.project.chord_progression) == 4  # unchanged
    window.transport.style.setCurrentText("Tech Trance")
    assert window.project.style.value == "Tech Trance" and window.project.tempo == 138.0


def test_section_operations(qapp, window):
    first = window.project.sections[0].id
    window._add_section_after(first)
    assert len(window.project.sections) == 5 and window.project.sections[1].kind == SectionKind.DROP
    new_id = window.project.sections[1].id
    window._move_section(new_id, 1)
    assert window.project.sections[2].id == new_id
    window._duplicate_section(new_id)
    assert window.project.sections[3].name.endswith("copy")
    window._delete_section(new_id)
    assert all(s.id != new_id for s in window.project.sections)
    window._edit_section(first, {"kind": "drop", "name": "Opener"})
    assert window.project.sections[0].kind == SectionKind.DROP and window.project.sections[0].name == "Opener"


def test_mixer_updates_engine_gains_live(qapp, window):
    window.mixer.strips["bass"].mute.setChecked(True)
    assert window.project.mix.buses["bass"].mute is True
    assert window.engine.gains["bass"] == 0.0
    window.mixer.strips["drums"].fader.setValue(window.mixer.strips["drums"].fader.value() - 60)  # -6 dB
    assert window.project.mix.buses["drums"].level_db == pytest.approx(-6.0)
    assert window.engine.gains["drums"] == pytest.approx(10 ** (-6 / 20))
    window.elements.checks["acid"].setChecked(False)
    assert window.project.elements["acid"].enabled is False


def test_loop_and_preview_section(qapp, window):
    sid = window.project.sections[2].id  # build: bars 4-6
    window._select_section(sid)
    window._preview_section()
    assert window.engine.loop == (window._grid().bars_to_samples(4), window._grid().bars_to_samples(6))
    assert window.engine.position == window._grid().bars_to_samples(4)
    window.transport.loop_btn.setChecked(False)
    assert window.engine.loop is None
    window._on_timeline_loop((1.0, 3.0))
    assert window.transport.loop_btn.isChecked() and window.engine.loop[0] == window._grid().bars_to_samples(1)


def test_save_and_reload_from_window(qapp, window, tmp_path):
    window.path = tmp_path / "song.htproj"
    window._edit("tempo", lambda p: setattr(p, "tempo", 132.0))
    assert window.store.dirty
    assert window._save()
    assert not window.store.dirty
    assert load_project(window.path).tempo == 132.0
    assert "song.htproj" in window.windowTitle()
