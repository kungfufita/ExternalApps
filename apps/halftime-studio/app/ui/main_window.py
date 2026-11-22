"""The main workstation window."""

from __future__ import annotations

import logging
import subprocess
import sys
from pathlib import Path

from PySide6.QtCore import QPoint, Qt, QTimer
from PySide6.QtGui import QAction, QCloseEvent, QKeySequence
from PySide6.QtWidgets import (
    QDockWidget,
    QFileDialog,
    QMainWindow,
    QMenu,
    QMessageBox,
    QToolBar,
    QWidget,
)

from app import APP_NAME, __version__
from app.engine.playback import AudioDeviceError, PlaybackEngine
from app.engine.timing import Grid
from app.paths import logs_dir
from app.project import Project, ProjectFileError, Section, SectionKind, apply_style_preset, save_project
from app.project.model import ChordStep
from app.project.music import parse_progression_text
from app.project.undo import ProjectStore
from app.ui.dialogs import show_error
from app.ui.inspector import Inspector
from app.ui.mixer import ElementsPanel, MixerPanel
from app.ui.settings import add_recent_project, recent_projects
from app.ui.timeline import TimelineView
from app.ui.transport import TransportBar
from app.ui.workers import PreviewManager

log = logging.getLogger(__name__)


class MainWindow(QMainWindow):
    def __init__(self, project: Project, path: Path | None = None) -> None:
        super().__init__()
        self.store = ProjectStore(project)
        self.path = path
        self.engine = PlaybackEngine(project.render.sample_rate)
        self.manager = PreviewManager(self.store, self.engine, self)
        self.selected_section: str | None = None
        self._loop_region: tuple[float, float] | None = None

        self.resize(1480, 900)
        self._build_widgets()
        self._build_menus()
        self.store.add_listener(self._on_store_changed)
        self.manager.status_changed.connect(self.transport.set_status)
        self.manager.section_ready.connect(lambda _i: self._refresh_rendered())
        self.engine.on_finished = lambda: None
        self._timer = QTimer(self)
        self._timer.setInterval(33)
        self._timer.timeout.connect(self._tick)
        self._timer.start()
        self._refresh_all("loaded")
        QTimer.singleShot(0, self.timeline.zoom_to_fit)
        QTimer.singleShot(200, self.manager.ensure_all)

    # ------------------------------------------------------------------ construction
    def _build_widgets(self) -> None:
        self.transport = TransportBar()
        tb = QToolBar("Transport")
        tb.setMovable(False)
        tb.addWidget(self.transport)
        self.addToolBar(Qt.ToolBarArea.TopToolBarArea, tb)
        self.transport.play_toggled.connect(self._on_play_toggled)
        self.transport.stop_clicked.connect(self._stop)
        self.transport.loop_toggled.connect(self._on_loop_toggled)
        self.transport.preview_section_clicked.connect(self._preview_section)
        self.transport.tempo_changed.connect(lambda t: self._edit(f"Set tempo {t:g}", lambda p: setattr(p, "tempo", t)))
        self.transport.key_changed.connect(lambda k: self._edit(f"Set key {k}", lambda p: setattr(p, "key", k)))
        self.transport.scale_changed.connect(lambda s: self._edit(f"Set scale {s}", lambda p: setattr(p, "scale", s)))
        self.transport.style_changed.connect(self._set_style)

        self.timeline = TimelineView()
        self.setCentralWidget(self.timeline)
        c = self.timeline.canvas
        c.seek_requested.connect(self._seek_bar)
        c.loop_changed.connect(self._on_timeline_loop)
        c.section_selected.connect(self._select_section)
        c.section_activated.connect(lambda sid: (self._select_section(sid), self.inspector_dock.raise_()))
        c.section_resized.connect(lambda sid, bars: self._edit_section(sid, {"bars": bars}))
        c.context_menu_requested.connect(self._section_menu)

        self.inspector = Inspector()
        self.inspector_dock = self._dock("Inspector", self.inspector, Qt.DockWidgetArea.LeftDockWidgetArea)
        self.inspector_dock.setMinimumWidth(300)
        self.inspector.section_edited.connect(self._edit_section)
        self.inspector.override_changed.connect(self._set_override)
        self.inspector.add_section.connect(self._add_section_after)
        self.inspector.duplicate_section.connect(self._duplicate_section)
        self.inspector.delete_section.connect(self._delete_section)
        self.inspector.move_section.connect(self._move_section)
        self.inspector.chords_edited.connect(self._set_chords)

        self.mixer = MixerPanel()
        self.mixer_dock = self._dock("Mixer", self.mixer, Qt.DockWidgetArea.BottomDockWidgetArea)
        self.mixer.bus_level_live.connect(self._live_gain)
        self.mixer.bus_level_committed.connect(
            lambda b, db: self._edit(
                f"{b.title()} level {db:+.1f} dB", lambda p: setattr(p.mix.buses[b], "level_db", db)
            )
        )
        self.mixer.bus_mute.connect(
            lambda b, m: self._edit(f"{'Mute' if m else 'Unmute'} {b}", lambda p: setattr(p.mix.buses[b], "mute", m))
        )
        self.mixer.bus_solo.connect(
            lambda b, s: self._edit(f"{'Solo' if s else 'Unsolo'} {b}", lambda p: setattr(p.mix.buses[b], "solo", s))
        )
        self.mixer.master_level_committed.connect(
            lambda db: self._edit(f"Master level {db:+.1f} dB", lambda p: setattr(p.mix, "master_level_db", db))
        )
        self.mixer.limiter_toggled.connect(
            lambda on: self._edit(f"Limiter {'on' if on else 'off'}", lambda p: setattr(p.mix, "limiter_enabled", on))
        )

        self.elements = ElementsPanel()
        self.elements_dock = self._dock("Elements", self.elements, Qt.DockWidgetArea.RightDockWidgetArea)
        self.elements_dock.setMinimumWidth(260)
        self.elements.element_toggled.connect(
            lambda n, on: self._edit(
                f"{'Enable' if on else 'Disable'} {n}", lambda p: setattr(p.elements[n], "enabled", on)
            )
        )
        self.elements.element_level_committed.connect(
            lambda n, db: self._edit(
                f"{n.title()} level {db:+.1f} dB", lambda p: setattr(p.elements[n], "level_db", db)
            )
        )

        self.statusBar().showMessage("Ready")

    def _dock(self, title: str, widget: QWidget, area: Qt.DockWidgetArea) -> QDockWidget:
        dock = QDockWidget(title, self)
        dock.setWidget(widget)
        dock.setFeatures(
            QDockWidget.DockWidgetFeature.DockWidgetMovable | QDockWidget.DockWidgetFeature.DockWidgetClosable
        )
        self.addDockWidget(area, dock)
        return dock

    def _build_menus(self) -> None:
        bar = self.menuBar()
        file_menu = bar.addMenu("&File")
        self._act(file_menu, "&New project…", QKeySequence.StandardKey.New, self._new_project)
        self._act(file_menu, "&Open…", QKeySequence.StandardKey.Open, self._open_project)
        self.recent_menu = file_menu.addMenu("Open &recent")
        self.recent_menu.aboutToShow.connect(self._fill_recent)
        file_menu.addSeparator()
        self._act(file_menu, "&Save", QKeySequence.StandardKey.Save, self._save)
        self._act(file_menu, "Save &as…", QKeySequence.StandardKey.SaveAs, lambda: self._save(save_as=True))
        file_menu.addSeparator()
        self._act(file_menu, "E&xit", QKeySequence.StandardKey.Quit, self.close)

        edit_menu = bar.addMenu("&Edit")
        self.undo_action = self._act(edit_menu, "&Undo", QKeySequence.StandardKey.Undo, self._undo)
        self.redo_action = self._act(edit_menu, "&Redo", QKeySequence.StandardKey.Redo, self._redo)
        edit_menu.addSeparator()
        self._act(edit_menu, "Add section at end", None, lambda: self._add_section_after(None))

        view_menu = bar.addMenu("&View")
        self._act(
            view_menu,
            "Zoom in",
            QKeySequence.StandardKey.ZoomIn,
            lambda: self.timeline.canvas.set_zoom(self.timeline.canvas.ppb * 1.25),
        )
        self._act(
            view_menu,
            "Zoom out",
            QKeySequence.StandardKey.ZoomOut,
            lambda: self.timeline.canvas.set_zoom(self.timeline.canvas.ppb / 1.25),
        )
        self._act(view_menu, "Zoom to fit", "Ctrl+0", self.timeline.zoom_to_fit)
        view_menu.addSeparator()
        for dock in (self.inspector_dock, self.mixer_dock, self.elements_dock):
            view_menu.addAction(dock.toggleViewAction())

        transport_menu = bar.addMenu("&Transport")
        self._act(transport_menu, "Play / pause", "Space", lambda: self.transport.play_btn.toggle())
        self._act(transport_menu, "Stop", "Esc", self._stop)
        self._act(transport_menu, "Go to start", "Home", lambda: self._seek_bar(0.0))
        self._act(transport_menu, "Toggle loop", "L", lambda: self.transport.loop_btn.toggle())
        self._act(transport_menu, "Preview selected section", "Ctrl+Space", self._preview_section)
        transport_menu.addSeparator()
        self._act(transport_menu, "Render all sections now", None, self.manager.ensure_all)

        help_menu = bar.addMenu("&Help")
        self._act(help_menu, "Open log folder", None, self._open_logs)
        self._act(help_menu, "&About", None, self._about)

    def _act(self, menu: QMenu, text: str, shortcut, slot) -> QAction:  # noqa: ANN001
        action = QAction(text, self)
        if shortcut is not None:
            action.setShortcut(QKeySequence(shortcut))
        action.triggered.connect(slot)
        menu.addAction(action)
        return action

    # ------------------------------------------------------------------ store plumbing
    @property
    def project(self) -> Project:
        return self.store.project

    def _grid(self) -> Grid:
        return Grid(self.project.tempo, self.project.render.sample_rate)

    def _edit(self, description: str, fn) -> None:  # noqa: ANN001
        try:
            self.store.edit(description, fn)
        except ValueError as exc:
            show_error(self, "Change rejected", f"{description}: {exc}", exc)
            self._refresh_all("rejected")

    def _on_store_changed(self, store: ProjectStore, description: str) -> None:
        self._refresh_all(description)
        if description not in ("saved", "loaded"):
            self.statusBar().showMessage(description, 4000)

    def _refresh_all(self, description: str) -> None:
        p = self.project
        self.transport.set_project(p)
        self.mixer.set_project(p)
        self.elements.set_project(p)
        self.inspector.set_project(p)
        self.timeline.canvas.set_project(p)
        if self.selected_section and not any(s.id == self.selected_section for s in p.sections):
            self.selected_section = None
        self.timeline.canvas.set_selected(self.selected_section)
        self.inspector.set_section(p, p.get_section(self.selected_section) if self.selected_section else None)
        self._refresh_rendered()
        self.undo_action.setEnabled(self.store.can_undo)
        self.undo_action.setText(f"&Undo {self.store.undo_description}" if self.store.can_undo else "&Undo")
        self.redo_action.setEnabled(self.store.can_redo)
        self.redo_action.setText(f"&Redo {self.store.redo_description}" if self.store.can_redo else "&Redo")
        self._update_title()
        # Clamp the loop region to the arrangement.
        if self._loop_region and self._loop_region[1] > p.total_bars:
            self._loop_region = None
            self.timeline.canvas.set_loop(None)
            self.engine.set_loop(None)
        elif self._loop_region and self.transport.loop_btn.isChecked():
            self._apply_loop(self._loop_region)

    def _refresh_rendered(self) -> None:
        ready = {s.id for i, s in enumerate(self.project.sections) if self.manager.is_ready(i)}
        self.timeline.canvas.set_rendered(ready)

    def _update_title(self) -> None:
        name = self.path.name if self.path else f"{self.project.name}.htproj"
        star = "*" if self.store.dirty else ""
        self.setWindowTitle(f"{name}{star} — {APP_NAME}")

    # ------------------------------------------------------------------ transport
    def _tick(self) -> None:
        grid = self._grid()
        pos = self.engine.position
        bar = grid.samples_to_bars(pos)
        self.transport.set_position(bar, grid.samples_to_seconds(pos))
        self.timeline.canvas.set_playhead(bar)
        if self.engine.playing:
            self.timeline.follow_playhead()
            self.manager.ensure_for_position(pos, lookahead=1)
            if self.engine.underrun:
                self.statusBar().showMessage("Rendering this section… playback resumes when it is ready", 500)
        elif self.transport.play_btn.isChecked():
            self.transport.set_playing(False)

    def _on_play_toggled(self, on: bool) -> None:
        if on:
            self.manager.ensure_for_position(self.engine.position, lookahead=1)
            try:
                self.engine.play()
            except AudioDeviceError as exc:
                self.transport.set_playing(False)
                show_error(self, "No audio output", str(exc), exc)
                return
            self.transport.set_playing(True)
        else:
            self.engine.pause()
            self.transport.set_playing(False)

    def _stop(self) -> None:
        self.engine.stop()
        if not self.engine.loop:
            self.engine.seek(0)
        self.transport.set_playing(False)

    def _seek_bar(self, bar: float) -> None:
        sample = self._grid().bars_to_samples(bar)
        self.engine.seek(sample)
        self.manager.ensure_for_position(sample, lookahead=1)

    def _apply_loop(self, region: tuple[float, float] | None) -> None:
        if region is None:
            self.engine.set_loop(None)
            return
        grid = self._grid()
        self.engine.set_loop(grid.bars_to_samples(region[0]), grid.bars_to_samples(region[1]))
        self.manager.ensure_range(region[0], region[1])

    def _on_timeline_loop(self, region) -> None:  # noqa: ANN001
        self._loop_region = tuple(region) if region else None
        self.timeline.canvas.set_loop(self._loop_region)
        if self._loop_region:
            self.transport.loop_btn.setChecked(True)
            self._apply_loop(self._loop_region)
        else:
            self.transport.loop_btn.setChecked(False)
            self.engine.set_loop(None)

    def _on_loop_toggled(self, on: bool) -> None:
        if on:
            if not self._loop_region and self.selected_section:
                start = self.project.section_start_bar(self.selected_section)
                self._loop_region = (float(start), float(start + self.project.get_section(self.selected_section).bars))
                self.timeline.canvas.set_loop(self._loop_region)
            if self._loop_region:
                self._apply_loop(self._loop_region)
            else:
                self.transport.loop_btn.setChecked(False)
                self.statusBar().showMessage("Drag in the ruler or select a section to define a loop", 4000)
        else:
            self.engine.set_loop(None)

    def _preview_section(self) -> None:
        if not self.selected_section:
            self.statusBar().showMessage("Select a section on the timeline first", 3000)
            return
        start = self.project.section_start_bar(self.selected_section)
        sec = self.project.get_section(self.selected_section)
        self._loop_region = (float(start), float(start + sec.bars))
        self.timeline.canvas.set_loop(self._loop_region)
        self.transport.loop_btn.setChecked(True)
        self._apply_loop(self._loop_region)
        self._seek_bar(float(start))
        if not self.engine.playing:
            self.transport.play_btn.setChecked(True)

    def _live_gain(self, bus: str, db: float) -> None:
        from app.engine.dsp import db_to_lin

        if bus == "master":
            self.engine.master_gain = db_to_lin(db)
        else:
            self.engine.gains[bus] = db_to_lin(db) if not self.project.mix.buses[bus].mute else 0.0

    # ------------------------------------------------------------------ sections
    def _select_section(self, sid: str | None) -> None:
        self.selected_section = sid
        self.timeline.canvas.set_selected(sid)
        self.inspector.set_section(self.project, self.project.get_section(sid) if sid else None)

    def _edit_section(self, sid: str, fields: dict) -> None:
        def fn(p: Project) -> None:
            s = p.get_section(sid)
            for k, v in fields.items():
                setattr(s, k, SectionKind(v) if k == "kind" else v)

        label = ", ".join(f"{k} → {v}" for k, v in fields.items())
        self._edit(f"Section {self.project.get_section(sid).name}: {label}", fn)

    def _set_override(self, sid: str, element: str, value) -> None:  # noqa: ANN001
        def fn(p: Project) -> None:
            s = p.get_section(sid)
            if value is None:
                s.element_overrides.pop(element, None)
            else:
                s.element_overrides[element] = bool(value)

        state = "default" if value is None else ("on" if value else "off")
        self._edit(f"{element.title()} {state} in {self.project.get_section(sid).name}", fn)

    def _add_section_after(self, sid: str | None) -> None:
        def fn(p: Project) -> None:
            new = Section(kind=SectionKind.DROP, name=f"Section {len(p.sections) + 1}", bars=8)
            if sid is None:
                p.sections.append(new)
            else:
                idx = next(i for i, s in enumerate(p.sections) if s.id == sid)
                p.sections.insert(idx + 1, new)
            self.selected_section = new.id

        self._edit("Add section", fn)

    def _duplicate_section(self, sid: str) -> None:
        def fn(p: Project) -> None:
            idx = next(i for i, s in enumerate(p.sections) if s.id == sid)
            copy = p.sections[idx].model_copy(deep=True, update={"id": Section(kind=SectionKind.DROP).id})
            copy.name = f"{copy.name} copy"
            p.sections.insert(idx + 1, copy)
            self.selected_section = copy.id

        self._edit("Duplicate section", fn)

    def _delete_section(self, sid: str) -> None:
        if len(self.project.sections) <= 1:
            return
        name = self.project.get_section(sid).name
        self.selected_section = None
        self._edit(f"Delete {name}", lambda p: p.sections.remove(p.get_section(sid)))

    def _move_section(self, sid: str, delta: int) -> None:
        def fn(p: Project) -> None:
            idx = next(i for i, s in enumerate(p.sections) if s.id == sid)
            j = idx + delta
            if 0 <= j < len(p.sections):
                p.sections[idx], p.sections[j] = p.sections[j], p.sections[idx]

        self._edit(f"Move {self.project.get_section(sid).name}", fn)

    def _set_chords(self, text: str) -> None:
        try:
            steps = parse_progression_text(text, self.project.key, self.project.scale)
        except ValueError as exc:
            self.inspector.set_chord_error(str(exc))
            return
        self.inspector.set_chord_error("")
        self._edit(
            "Set chord progression",
            lambda p: setattr(p, "chord_progression", [ChordStep(symbol=s, bars=b) for s, b in steps]),
        )

    def _set_style(self, style: str) -> None:
        try:
            new = apply_style_preset(self.project, style)
        except ValueError as exc:
            show_error(self, "Could not apply style", str(exc), exc)
            return
        self.store.commit(new, f"Style → {style}")

    def _section_menu(self, sid: str | None, global_pos: QPoint) -> None:
        menu = QMenu(self)
        if sid:
            self._select_section(sid)
            sec = self.project.get_section(sid)
            kind_menu = menu.addMenu("Change kind")
            for k in SectionKind:
                a = kind_menu.addAction(k.value.title())
                a.setCheckable(True)
                a.setChecked(k == sec.kind)
                a.triggered.connect(lambda _c=False, k=k: self._edit_section(sid, {"kind": k.value}))
            menu.addAction("Preview this section", self._preview_section)
            menu.addSeparator()
            menu.addAction("Add section after", lambda: self._add_section_after(sid))
            menu.addAction("Duplicate", lambda: self._duplicate_section(sid))
            menu.addAction("Move left", lambda: self._move_section(sid, -1))
            menu.addAction("Move right", lambda: self._move_section(sid, 1))
            menu.addSeparator()
            delete = menu.addAction("Delete", lambda: self._delete_section(sid))
            delete.setEnabled(len(self.project.sections) > 1)
        else:
            menu.addAction("Add section at end", lambda: self._add_section_after(None))
            menu.addAction("Zoom to fit", self.timeline.zoom_to_fit)
        menu.exec(global_pos)

    # ------------------------------------------------------------------ files
    def _undo(self) -> None:
        self.store.undo()

    def _redo(self) -> None:
        self.store.redo()

    def _confirm_discard(self) -> bool:
        if not self.store.dirty:
            return True
        ret = QMessageBox.question(
            self,
            "Unsaved changes",
            "Save changes to this project?",
            QMessageBox.StandardButton.Save | QMessageBox.StandardButton.Discard | QMessageBox.StandardButton.Cancel,
        )
        if ret == QMessageBox.StandardButton.Save:
            return self._save()
        return ret == QMessageBox.StandardButton.Discard

    def _new_project(self) -> None:
        from app.ui.start_screen import NewProjectDialog

        if not self._confirm_discard():
            return
        dlg = NewProjectDialog(self, self.project.style.value)
        if dlg.exec():
            self.load_project(dlg.build(), None)

    def _open_project(self) -> None:
        if not self._confirm_discard():
            return
        path, _ = QFileDialog.getOpenFileName(self, "Open project", "", "HalfTime Studio project (*.htproj)")
        if path:
            self.open_path(Path(path))

    def open_path(self, path: Path) -> None:
        from app.project import load_project

        try:
            project = load_project(path)
        except ProjectFileError as exc:
            show_error(self, "Could not open project", str(exc), exc)
            return
        self.load_project(project, path)

    def load_project(self, project: Project, path: Path | None) -> None:
        self.engine.pause()
        self.engine.seek(0)
        self.engine.set_loop(None)
        self._loop_region = None
        self.selected_section = None
        self.path = path
        self.store.replace(project)
        if path:
            add_recent_project(path)
        self.timeline.canvas.set_loop(None)
        self.transport.loop_btn.setChecked(False)
        QTimer.singleShot(0, self.timeline.zoom_to_fit)
        QTimer.singleShot(100, self.manager.ensure_all)

    def _fill_recent(self) -> None:
        self.recent_menu.clear()
        for path in recent_projects():
            self.recent_menu.addAction(
                Path(path).name, lambda p=path: self._confirm_discard() and self.open_path(Path(p))
            )
        if self.recent_menu.isEmpty():
            self.recent_menu.addAction("(none)").setEnabled(False)

    def _save(self, save_as: bool = False) -> bool:
        path = self.path
        if save_as or path is None:
            suggested = str(path) if path else f"{self.project.name}.htproj"
            chosen, _ = QFileDialog.getSaveFileName(
                self, "Save project", suggested, "HalfTime Studio project (*.htproj)"
            )
            if not chosen:
                return False
            path = Path(chosen)
        try:
            self.path = save_project(self.project, path)
        except OSError as exc:
            show_error(self, "Could not save project", str(exc), exc)
            return False
        add_recent_project(self.path)
        self.store.mark_saved()
        self.statusBar().showMessage(f"Saved {self.path.name}", 3000)
        return True

    def _open_logs(self) -> None:
        folder = str(logs_dir())
        if sys.platform == "win32":
            subprocess.Popen(["explorer", folder])
        elif sys.platform == "darwin":
            subprocess.Popen(["open", folder])
        else:
            subprocess.Popen(["xdg-open", folder])

    def _about(self) -> None:
        QMessageBox.about(
            self,
            f"About {APP_NAME}",
            f"<b>{APP_NAME}</b> v{__version__}<br>AI-assisted remix workstation.<br><br>"
            "Backing tracks are synthesized from scratch. Vocals come only from local files you own; "
            "remixes of commercial recordings are for personal listening and cannot be distributed without a licence.",
        )

    def closeEvent(self, event: QCloseEvent) -> None:  # noqa: N802
        if not self._confirm_discard():
            event.ignore()
            return
        self._timer.stop()
        self.engine.close()
        self.manager.shutdown()
        event.accept()
