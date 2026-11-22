import pytest
from pydantic import ValidationError

from app.project.presets import new_project
from app.project.undo import ProjectStore


def test_commit_undo_redo_round_trip():
    store = ProjectStore(new_project("x"))
    seen: list[str] = []
    store.add_listener(lambda s, d: seen.append(d))
    original = store.project
    assert store.edit("Set tempo 140", lambda p: setattr(p, "tempo", 140.0))
    assert store.project.tempo == 140.0 and store.dirty and store.can_undo
    assert store.undo_description == "Set tempo 140"
    assert store.undo() == "Set tempo 140"
    assert store.project == original and store.can_redo
    assert store.redo() == "Set tempo 140"
    assert store.project.tempo == 140.0
    assert seen == ["Set tempo 140", "Undo Set tempo 140", "Redo Set tempo 140"]


def test_noop_commit_is_ignored():
    store = ProjectStore(new_project("x"))
    assert not store.edit("nothing", lambda p: None)
    assert not store.can_undo and not store.dirty


def test_invalid_edit_leaves_project_untouched():
    store = ProjectStore(new_project("x"))
    with pytest.raises(ValidationError):
        store.edit("bad", lambda p: setattr(p, "tempo", 999.0))
    assert store.project.tempo == 138.0 and not store.can_undo


def test_new_edit_clears_redo_and_depth_is_bounded():
    store = ProjectStore(new_project("x"), max_depth=3)
    for t in (130, 131, 132, 133, 134):
        store.edit(f"t{t}", lambda p, t=t: setattr(p, "tempo", float(t)))
    assert len(store._undo) == 3
    store.undo()
    assert store.can_redo
    store.edit("branch", lambda p: setattr(p, "tempo", 150.0))
    assert not store.can_redo
    assert store.history[-1] == "branch"


def test_replace_resets_history_and_dirty():
    store = ProjectStore(new_project("x"))
    store.edit("t", lambda p: setattr(p, "tempo", 140.0))
    store.replace(new_project("y"))
    assert not store.can_undo and not store.dirty and store.project.name == "y"
    store.edit("t", lambda p: setattr(p, "tempo", 140.0))
    store.mark_saved()
    assert not store.dirty
