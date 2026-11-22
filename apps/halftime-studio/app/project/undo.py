"""Undo/redo for the project model.

:class:`ProjectStore` owns the *current* :class:`Project` and keeps full snapshots of
previous states. Every edit — manual or made by the AI assistant — goes through
:meth:`ProjectStore.commit`, so Ctrl+Z behaves identically for both. Snapshots are plain
dicts (pydantic dumps), which are cheap at this model size and trivially serializable.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from app.project.model import Project

Listener = Callable[["ProjectStore", str], None]


@dataclass
class _Entry:
    description: str
    snapshot: dict[str, Any]


@dataclass
class ProjectStore:
    """Holds the current project plus undo and redo stacks of snapshots."""

    project: Project
    max_depth: int = 200
    _undo: list[_Entry] = field(default_factory=list, repr=False)
    _redo: list[_Entry] = field(default_factory=list, repr=False)
    _listeners: list[Listener] = field(default_factory=list, repr=False)
    _dirty: bool = False
    _history: list[str] = field(default_factory=list, repr=False)

    # ---- listeners -------------------------------------------------------------
    def add_listener(self, fn: Listener) -> None:
        self._listeners.append(fn)

    def remove_listener(self, fn: Listener) -> None:
        self._listeners = [x for x in self._listeners if x is not fn]

    def _notify(self, description: str) -> None:
        for fn in list(self._listeners):
            fn(self, description)

    # ---- state -------------------------------------------------------------------
    @property
    def dirty(self) -> bool:
        return self._dirty

    def mark_saved(self) -> None:
        self._dirty = False
        self._notify("saved")

    @property
    def can_undo(self) -> bool:
        return bool(self._undo)

    @property
    def can_redo(self) -> bool:
        return bool(self._redo)

    @property
    def undo_description(self) -> str | None:
        return self._undo[-1].description if self._undo else None

    @property
    def redo_description(self) -> str | None:
        return self._redo[-1].description if self._redo else None

    @property
    def history(self) -> list[str]:
        """Descriptions of every committed change in order (for the AI's context)."""
        return list(self._history)

    # ---- editing -----------------------------------------------------------------
    def commit(self, new_project: Project, description: str) -> bool:
        """Replace the current project, recording the previous state for undo.

        Returns ``False`` (and records nothing) when the new project is identical.
        """
        if new_project == self.project:
            return False
        self._undo.append(_Entry(description, self.project.model_dump(mode="json")))
        if len(self._undo) > self.max_depth:
            del self._undo[0]
        self._redo.clear()
        self.project = new_project
        self._dirty = True
        self._history.append(description)
        self._notify(description)
        return True

    def edit(self, description: str, fn: Callable[[Project], None]) -> bool:
        """Apply ``fn`` to a deep copy of the project and commit the result.

        Validation runs on the result, so an invalid edit raises and leaves the project
        untouched.
        """
        draft = self.project.model_copy(deep=True)
        fn(draft)
        validated = Project.model_validate(draft.model_dump(mode="json"))
        return self.commit(validated, description)

    def undo(self) -> str | None:
        if not self._undo:
            return None
        entry = self._undo.pop()
        self._redo.append(_Entry(entry.description, self.project.model_dump(mode="json")))
        self.project = Project.model_validate(entry.snapshot)
        self._dirty = True
        self._history.append(f"undo: {entry.description}")
        self._notify(f"Undo {entry.description}")
        return entry.description

    def redo(self) -> str | None:
        if not self._redo:
            return None
        entry = self._redo.pop()
        self._undo.append(_Entry(entry.description, self.project.model_dump(mode="json")))
        self.project = Project.model_validate(entry.snapshot)
        self._dirty = True
        self._history.append(f"redo: {entry.description}")
        self._notify(f"Redo {entry.description}")
        return entry.description

    def replace(self, project: Project, *, clear_history: bool = True) -> None:
        """Load a different project (open file / new project) without an undo entry."""
        self.project = project
        if clear_history:
            self._undo.clear()
            self._redo.clear()
            self._history.clear()
        self._dirty = False
        self._notify("loaded")
