"""Background rendering for preview playback.

:class:`PreviewManager` watches the :class:`ProjectStore`, renders sections on a thread
pool as they are needed (current section first, then the next), and feeds finished
segments to the :class:`PlaybackEngine`. Edits invalidate only the sections they affect.
"""

from __future__ import annotations

import hashlib
import json
import logging
import threading

from PySide6.QtCore import QObject, QRunnable, QThreadPool, Signal, Slot

from app.engine.dsp import db_to_lin
from app.engine.generator.render import RenderCancelled, RenderResult, SectionRenderer
from app.engine.mix import bus_gains
from app.engine.playback import PlaybackEngine, Segment
from app.engine.timing import Grid
from app.project.model import Project
from app.project.undo import ProjectStore

log = logging.getLogger(__name__)


def section_render_key(project: Project, index: int) -> str:
    """Hash of everything that influences the audio of one section (mix excluded)."""
    data = project.model_dump(mode="json")
    for k in ("mix", "name", "notes", "vocal"):
        data.pop(k, None)
    data["sections"] = [data["sections"][index]]
    data["_index"] = index
    blob = json.dumps(data, sort_keys=True, separators=(",", ":"))
    return hashlib.sha1(blob.encode()).hexdigest()[:16]


class _Signals(QObject):
    finished = Signal(str, int, object)  # key, index, RenderResult
    failed = Signal(str, int, str)


class _RenderJob(QRunnable):
    def __init__(self, project: Project, index: int, key: str, signals: _Signals, cancel: threading.Event) -> None:
        super().__init__()
        self.project, self.index, self.key, self.signals, self.cancel = project, index, key, signals, cancel
        # PySide-owned runnables must not be auto-deleted by the pool; the manager keeps them.
        self.setAutoDelete(False)

    def run(self) -> None:
        if self.cancel.is_set():
            return
        try:
            result = SectionRenderer(self.project, self.index, cancel=self.cancel.is_set).render()
        except RenderCancelled:
            return
        except Exception as exc:  # pragma: no cover - reported to the UI
            log.exception("render failed")
            self._emit(self.signals.failed, self.key, self.index, str(exc))
            return
        if not self.cancel.is_set():
            self._emit(self.signals.finished, self.key, self.index, result)

    @staticmethod
    def _emit(signal, *args) -> None:  # noqa: ANN001
        try:
            signal.emit(*args)
        except RuntimeError:  # the manager was torn down while we were rendering
            pass


class PreviewManager(QObject):
    """Keeps the playback engine stocked with up-to-date section renders."""

    status_changed = Signal(str)  # human-readable render status
    section_ready = Signal(int)  # section index

    def __init__(self, store: ProjectStore, engine: PlaybackEngine, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self.store = store
        self.engine = engine
        self.pool = QThreadPool.globalInstance()
        self._signals = _Signals()
        self._signals.finished.connect(self._on_finished)
        self._signals.failed.connect(self._on_failed)
        self._pending: dict[str, threading.Event] = {}
        self._jobs: dict[str, _RenderJob] = {}
        self._cache: dict[str, RenderResult] = {}
        self._keys: list[str] = []
        self.store.add_listener(self._on_project_changed)
        self.sync()

    # ---- project sync ----------------------------------------------------------------
    def _on_project_changed(self, store: ProjectStore, description: str) -> None:
        self.sync()

    def sync(self) -> None:
        """Recompute section keys, drop stale segments, cancel stale jobs, update gains."""
        project = self.store.project
        grid = Grid(project.tempo, project.render.sample_rate)
        self.engine.sample_rate = project.render.sample_rate
        self._keys = [section_render_key(project, i) for i in range(len(project.sections))]
        valid = set(self._keys)
        for key, cancel in list(self._pending.items()):
            if key not in valid:
                cancel.set()
                del self._pending[key]
        for key in list(self._cache):
            if key not in valid:
                del self._cache[key]
        self.engine.keep_only(valid)
        # Re-place cached segments in case positions moved (a section was resized earlier).
        for i, key in enumerate(self._keys):
            if key in self._cache:
                self._install(i, key, self._cache[key])
        self.engine.set_end(grid.section_samples(project.total_bars))
        self.apply_mix()
        self._emit_status()

    def apply_mix(self) -> None:
        project = self.store.project
        self.engine.gains = bus_gains(project.mix)
        self.engine.master_gain = db_to_lin(project.mix.master_level_db)

    # ---- requests ----------------------------------------------------------------------
    def ensure_section(self, index: int) -> bool:
        """Render ``index`` if needed; returns True when it is already available."""
        if not 0 <= index < len(self._keys):
            return False
        key = self._keys[index]
        if key in self._cache:
            return True
        if key in self._pending:
            return False
        cancel = threading.Event()
        self._pending[key] = cancel
        job = _RenderJob(self.store.project, index, key, self._signals, cancel)
        self._jobs[key] = job
        self.pool.start(job)
        self._emit_status()
        return False

    def ensure_for_position(self, sample: int, lookahead: int = 1) -> None:
        """Render the section under ``sample`` plus ``lookahead`` following sections."""
        project = self.store.project
        grid = Grid(project.tempo, project.render.sample_rate)
        bar = grid.samples_to_bars(sample)
        pos = 0
        for i, sec in enumerate(project.sections):
            if pos <= bar < pos + sec.bars:
                for j in range(i, min(i + 1 + lookahead, len(project.sections))):
                    self.ensure_section(j)
                return
            pos += sec.bars

    def ensure_range(self, start_bar: float, end_bar: float) -> None:
        pos = 0
        for i, sec in enumerate(self.store.project.sections):
            if pos + sec.bars > start_bar and pos < end_bar:
                self.ensure_section(i)
            pos += sec.bars

    def ensure_all(self) -> None:
        for i in range(len(self._keys)):
            self.ensure_section(i)

    def is_ready(self, index: int) -> bool:
        return 0 <= index < len(self._keys) and self._keys[index] in self._cache

    @property
    def pending_count(self) -> int:
        return len(self._pending)

    def shutdown(self) -> None:
        """Cancel outstanding renders and wait for the worker threads to drain."""
        for cancel in self._pending.values():
            cancel.set()
        self._pending.clear()
        self.pool.waitForDone(-1)
        self._jobs.clear()

    # ---- results -----------------------------------------------------------------------
    @Slot(str, int, object)
    def _on_finished(self, key: str, index: int, result: RenderResult) -> None:
        self._pending.pop(key, None)
        self._jobs.pop(key, None)
        if key not in self._keys:
            return  # stale
        self._cache[key] = result
        self._install(self._keys.index(key), key, result)
        self.section_ready.emit(index)
        self._emit_status()

    @Slot(str, int, str)
    def _on_failed(self, key: str, index: int, message: str) -> None:
        self._pending.pop(key, None)
        self._jobs.pop(key, None)
        self.status_changed.emit(f"Render failed: {message}")

    def _install(self, index: int, key: str, result: RenderResult) -> None:
        project = self.store.project
        grid = Grid(project.tempo, project.render.sample_rate)
        start = grid.bars_to_samples(project.section_start_bar(project.sections[index].id))
        self.engine.set_segment(Segment(key, start, result.stems, result.body_samples))

    def _emit_status(self) -> None:
        n = len(self._pending)
        ready = sum(1 for k in self._keys if k in self._cache)
        if n:
            self.status_changed.emit(f"Rendering {n} section{'s' if n != 1 else ''}…")
        else:
            self.status_changed.emit(f"{ready}/{len(self._keys)} sections rendered")
