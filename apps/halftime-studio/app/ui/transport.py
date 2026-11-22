"""Transport toolbar: play/stop/loop, position readout, tempo/key/scale/style controls."""

from __future__ import annotations

from PySide6.QtCore import Signal
from PySide6.QtWidgets import QComboBox, QDoubleSpinBox, QHBoxLayout, QLabel, QPushButton, QWidget

from app.project.model import Project
from app.project.music import NOTE_NAMES, SCALES
from app.project.presets import preset_names
from app.ui.timeline_math import format_position, format_time


class TransportBar(QWidget):
    play_toggled = Signal(bool)
    stop_clicked = Signal()
    loop_toggled = Signal(bool)
    preview_section_clicked = Signal()
    tempo_changed = Signal(float)
    key_changed = Signal(str)
    scale_changed = Signal(str)
    style_changed = Signal(str)

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._updating = False
        lay = QHBoxLayout(self)
        lay.setContentsMargins(6, 2, 6, 2)
        lay.setSpacing(8)

        self.play_btn = QPushButton("▶  Play")
        self.play_btn.setCheckable(True)
        self.play_btn.setMinimumWidth(96)
        self.play_btn.setToolTip("Play / pause (Space)")
        self.stop_btn = QPushButton("■  Stop")
        self.stop_btn.setToolTip("Stop and return to the loop start (or song start)")
        self.loop_btn = QPushButton("⟲  Loop")
        self.loop_btn.setCheckable(True)
        self.loop_btn.setToolTip("Loop the selected region (drag in the ruler to set one)")
        self.preview_btn = QPushButton("Preview section")
        self.preview_btn.setToolTip("Loop and play the selected section")
        for b in (self.play_btn, self.stop_btn, self.loop_btn, self.preview_btn):
            lay.addWidget(b)

        self.position_label = QLabel("1.1   0:00.0")
        self.position_label.setObjectName("position")
        self.position_label.setMinimumWidth(150)
        lay.addWidget(self.position_label)
        lay.addStretch(1)

        lay.addWidget(QLabel("BPM"))
        self.tempo = QDoubleSpinBox()
        self.tempo.setRange(60, 200)
        self.tempo.setDecimals(1)
        self.tempo.setSingleStep(1.0)
        self.tempo.setFixedWidth(80)
        lay.addWidget(self.tempo)

        lay.addWidget(QLabel("Key"))
        self.key = QComboBox()
        self.key.addItems(NOTE_NAMES)
        lay.addWidget(self.key)
        self.scale = QComboBox()
        self.scale.addItems(sorted(SCALES))
        lay.addWidget(self.scale)

        lay.addWidget(QLabel("Style"))
        self.style = QComboBox()
        self.style.addItems(preset_names())
        lay.addWidget(self.style)

        self.status_label = QLabel("")
        self.status_label.setObjectName("dim")
        self.status_label.setMinimumWidth(170)
        lay.addWidget(self.status_label)

        self.play_btn.toggled.connect(self.play_toggled)
        self.stop_btn.clicked.connect(self.stop_clicked)
        self.loop_btn.toggled.connect(self.loop_toggled)
        self.preview_btn.clicked.connect(self.preview_section_clicked)
        self.tempo.editingFinished.connect(lambda: self._emit(self.tempo_changed, float(self.tempo.value())))
        self.key.currentTextChanged.connect(lambda t: self._emit(self.key_changed, t))
        self.scale.currentTextChanged.connect(lambda t: self._emit(self.scale_changed, t))
        self.style.currentTextChanged.connect(lambda t: self._emit(self.style_changed, t))

    def _emit(self, signal, value) -> None:  # noqa: ANN001
        if not self._updating:
            signal.emit(value)

    def set_project(self, project: Project) -> None:
        self._updating = True
        try:
            self.tempo.setValue(project.tempo)
            self.key.setCurrentText(project.key)
            self.scale.setCurrentText(project.scale)
            self.style.setCurrentText(project.style.value)
        finally:
            self._updating = False

    def set_position(self, bar: float, seconds: float) -> None:
        self.position_label.setText(f"{format_position(bar):>6}   {format_time(seconds)}")

    def set_playing(self, playing: bool) -> None:
        self._updating = True
        self.play_btn.setChecked(playing)
        self.play_btn.setText("❚❚  Pause" if playing else "▶  Play")
        self._updating = False

    def set_status(self, text: str) -> None:
        self.status_label.setText(text)
