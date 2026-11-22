"""Mixer dock (bus faders, mute/solo, master) and the per-element panel."""

from __future__ import annotations

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import (
    QCheckBox,
    QDoubleSpinBox,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QScrollArea,
    QSlider,
    QVBoxLayout,
    QWidget,
)

from app.project.model import BUS_NAMES, ELEMENT_BUS, ELEMENT_NAMES, Project

BUS_LABELS = {"drums": "Drums", "bass": "Bass", "synths": "Synths", "fx": "FX", "vocal": "Vocal"}
FADER_MIN_DB, FADER_MAX_DB = -60.0, 12.0


def _db_to_slider(db: float) -> int:
    return int(round((db - FADER_MIN_DB) * 10))


def _slider_to_db(v: int) -> float:
    return FADER_MIN_DB + v / 10.0


class BusStrip(QFrame):
    """One channel strip: name, dB readout, fader, M/S buttons."""

    level_changed = Signal(str, float)  # live (while dragging)
    level_committed = Signal(str, float)  # on release
    mute_toggled = Signal(str, bool)
    solo_toggled = Signal(str, bool)

    def __init__(self, bus: str, label: str, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.bus = bus
        self._updating = False
        lay = QVBoxLayout(self)
        lay.setContentsMargins(6, 6, 6, 6)
        lay.setSpacing(4)
        title = QLabel(label)
        title.setAlignment(Qt.AlignmentFlag.AlignHCenter)
        title.setStyleSheet("font-weight: 600;")
        lay.addWidget(title)
        self.readout = QLabel("0.0 dB")
        self.readout.setObjectName("dim")
        self.readout.setAlignment(Qt.AlignmentFlag.AlignHCenter)
        lay.addWidget(self.readout)
        self.fader = QSlider(Qt.Orientation.Vertical)
        self.fader.setRange(0, _db_to_slider(FADER_MAX_DB))
        self.fader.setValue(_db_to_slider(0.0))
        self.fader.setMinimumHeight(120)
        self.fader.setToolTip("Double-click to reset to 0 dB")
        lay.addWidget(self.fader, 1, Qt.AlignmentFlag.AlignHCenter)
        row = QHBoxLayout()
        self.mute = QPushButton("M")
        self.mute.setCheckable(True)
        self.mute.setFixedSize(34, 26)
        self.mute.setStyleSheet("padding: 0; font-weight: 600;")
        self.mute.setToolTip("Mute")
        self.solo = QPushButton("S")
        self.solo.setCheckable(True)
        self.solo.setFixedSize(34, 26)
        self.solo.setStyleSheet("padding: 0; font-weight: 600;")
        self.solo.setToolTip("Solo")
        row.addWidget(self.mute)
        row.addWidget(self.solo)
        lay.addLayout(row)
        self.fader.valueChanged.connect(self._on_value)
        self.fader.sliderReleased.connect(
            lambda: self.level_committed.emit(self.bus, _slider_to_db(self.fader.value()))
        )
        self.mute.toggled.connect(lambda c: not self._updating and self.mute_toggled.emit(self.bus, c))
        self.solo.toggled.connect(lambda c: not self._updating and self.solo_toggled.emit(self.bus, c))
        self.fader.mouseDoubleClickEvent = self._reset  # type: ignore[method-assign]

    def _reset(self, _e) -> None:  # noqa: ANN001
        self.fader.setValue(_db_to_slider(0.0))
        self.level_committed.emit(self.bus, 0.0)

    def _on_value(self, v: int) -> None:
        db = _slider_to_db(v)
        self.readout.setText(f"{db:+.1f} dB" if db > FADER_MIN_DB else "-inf")
        if not self._updating:
            self.level_changed.emit(self.bus, db)
            if not self.fader.isSliderDown():  # keyboard / wheel edits commit immediately
                self.level_committed.emit(self.bus, db)

    def set_state(self, level_db: float, mute: bool, solo: bool) -> None:
        self._updating = True
        try:
            self.fader.setValue(_db_to_slider(level_db))
            self.mute.setChecked(mute)
            self.solo.setChecked(solo)
        finally:
            self._updating = False


class MixerPanel(QWidget):
    bus_level_live = Signal(str, float)
    bus_level_committed = Signal(str, float)
    bus_mute = Signal(str, bool)
    bus_solo = Signal(str, bool)
    master_level_committed = Signal(float)
    limiter_toggled = Signal(bool)

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._updating = False
        lay = QHBoxLayout(self)
        lay.setContentsMargins(8, 4, 8, 4)
        self.strips: dict[str, BusStrip] = {}
        for bus in BUS_NAMES:
            strip = BusStrip(bus, BUS_LABELS[bus])
            strip.level_changed.connect(self.bus_level_live)
            strip.level_committed.connect(self.bus_level_committed)
            strip.mute_toggled.connect(self.bus_mute)
            strip.solo_toggled.connect(self.bus_solo)
            self.strips[bus] = strip
            lay.addWidget(strip)
        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.VLine)
        lay.addWidget(sep)
        self.master = BusStrip("master", "Master")
        self.master.mute.hide()
        self.master.solo.hide()
        self.master.level_committed.connect(lambda _b, db: self.master_level_committed.emit(db))
        self.master.level_changed.connect(lambda _b, db: self.bus_level_live.emit("master", db))
        lay.addWidget(self.master)
        col = QVBoxLayout()
        self.limiter = QCheckBox("Limiter")
        self.limiter.setToolTip("Brick-wall limiter on export and full renders")
        self.limiter.toggled.connect(lambda c: not self._updating and self.limiter_toggled.emit(c))
        col.addWidget(self.limiter)
        col.addStretch(1)
        lay.addLayout(col)
        lay.addStretch(1)

    def set_project(self, project: Project) -> None:
        self._updating = True
        try:
            for bus, strip in self.strips.items():
                b = project.mix.buses[bus]
                strip.set_state(b.level_db, b.mute, b.solo)
            self.master.set_state(project.mix.master_level_db, False, False)
            self.limiter.setChecked(project.mix.limiter_enabled)
        finally:
            self._updating = False


class ElementsPanel(QWidget):
    """Enable/level per backing element, grouped by bus."""

    element_toggled = Signal(str, bool)
    element_level_committed = Signal(str, float)

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._updating = False
        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        inner = QWidget()
        grid = QGridLayout(inner)
        grid.setContentsMargins(10, 8, 10, 8)
        grid.setHorizontalSpacing(10)
        self.checks: dict[str, QCheckBox] = {}
        self.levels: dict[str, QDoubleSpinBox] = {}
        row = 0
        for bus in ("drums", "bass", "synths", "fx"):
            header = QLabel(BUS_LABELS[bus].upper())
            header.setObjectName("dim")
            grid.addWidget(header, row, 0, 1, 3)
            row += 1
            for name in ELEMENT_NAMES:
                if ELEMENT_BUS[name] != bus:
                    continue
                cb = QCheckBox(name.title())
                cb.toggled.connect(lambda c, n=name: not self._updating and self.element_toggled.emit(n, c))
                spin = QDoubleSpinBox()
                spin.setRange(-60, 12)
                spin.setDecimals(1)
                spin.setSuffix(" dB")
                spin.setFixedWidth(90)
                spin.editingFinished.connect(
                    lambda n=name, s=spin: not self._updating and self.element_level_committed.emit(n, s.value())
                )
                grid.addWidget(cb, row, 0)
                grid.addWidget(spin, row, 1)
                self.checks[name] = cb
                self.levels[name] = spin
                row += 1
        grid.setRowStretch(row, 1)
        scroll.setWidget(inner)
        outer.addWidget(scroll)

    def set_project(self, project: Project) -> None:
        self._updating = True
        try:
            for name, cb in self.checks.items():
                el = project.elements[name]
                cb.setChecked(el.enabled)
                self.levels[name].setValue(el.level_db)
                self.levels[name].setEnabled(el.enabled)
        finally:
            self._updating = False
