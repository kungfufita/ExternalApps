"""Inspector dock: edit the selected section and the chord progression."""

from __future__ import annotations

from PySide6.QtCore import Signal
from PySide6.QtWidgets import (
    QComboBox,
    QDoubleSpinBox,
    QFormLayout,
    QGroupBox,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QSpinBox,
    QVBoxLayout,
    QWidget,
)

from app.project.model import ELEMENT_NAMES, Project, Section, SectionKind

OVERRIDE_CHOICES = ("Default", "On", "Off")


class Inspector(QWidget):
    section_edited = Signal(str, dict)  # section id, {field: value}
    override_changed = Signal(str, str, object)  # section id, element, True/False/None
    add_section = Signal(str)  # after section id
    duplicate_section = Signal(str)
    delete_section = Signal(str)
    move_section = Signal(str, int)  # id, -1 / +1
    chords_edited = Signal(str)  # text like "i VI III VII" or "Am:2 F:2 C G"

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._section_id: str | None = None
        self._updating = False
        lay = QVBoxLayout(self)
        lay.setContentsMargins(8, 8, 8, 8)

        chords_box = QGroupBox("Chord progression")
        cl = QVBoxLayout(chords_box)
        hint_text = "Roman numerals or chord names, ':bars' for length (default 2)."
        hint = QLabel(f"{hint_text}\nExample: i VI III VII  or  Am:2 F:2 C:1 G:1")
        hint.setObjectName("dim")
        hint.setWordWrap(True)
        cl.addWidget(hint)
        self.chords_edit = QLineEdit()
        self.chords_edit.setPlaceholderText("i VI III VII")
        self.chords_edit.editingFinished.connect(
            lambda: not self._updating and self.chords_edited.emit(self.chords_edit.text())
        )
        cl.addWidget(self.chords_edit)
        self.chords_error = QLabel("")
        self.chords_error.setStyleSheet("color: #ff7b7b;")
        self.chords_error.setWordWrap(True)
        cl.addWidget(self.chords_error)
        lay.addWidget(chords_box)

        self.section_box = QGroupBox("Section")
        form = QFormLayout(self.section_box)
        self.name = QLineEdit()
        self.kind = QComboBox()
        self.kind.addItems([k.value for k in SectionKind])
        self.bars = QSpinBox()
        self.bars.setRange(1, 128)
        self.energy = QDoubleSpinBox()
        self.energy.setRange(0.0, 1.5)
        self.energy.setSingleStep(0.1)
        self.energy.setDecimals(2)
        form.addRow("Name", self.name)
        form.addRow("Kind", self.kind)
        form.addRow("Bars", self.bars)
        form.addRow("Energy", self.energy)
        self.name.editingFinished.connect(lambda: self._edit("name", self.name.text()))
        self.kind.currentTextChanged.connect(lambda t: self._edit("kind", t))
        self.bars.editingFinished.connect(lambda: self._edit("bars", self.bars.value()))
        self.energy.editingFinished.connect(lambda: self._edit("energy", self.energy.value()))

        btns = QHBoxLayout()
        self.move_left = QPushButton("◀")
        self.move_right = QPushButton("▶")
        self.add_btn = QPushButton("Add after")
        self.dup_btn = QPushButton("Duplicate")
        self.del_btn = QPushButton("Delete")
        self.del_btn.setObjectName("danger")
        for b in (self.move_left, self.move_right, self.add_btn, self.dup_btn, self.del_btn):
            btns.addWidget(b)
        form.addRow(btns)
        self.move_left.clicked.connect(lambda: self._section_id and self.move_section.emit(self._section_id, -1))
        self.move_right.clicked.connect(lambda: self._section_id and self.move_section.emit(self._section_id, 1))
        self.add_btn.clicked.connect(lambda: self._section_id and self.add_section.emit(self._section_id))
        self.dup_btn.clicked.connect(lambda: self._section_id and self.duplicate_section.emit(self._section_id))
        self.del_btn.clicked.connect(lambda: self._section_id and self.delete_section.emit(self._section_id))
        lay.addWidget(self.section_box)

        self.override_box = QGroupBox("Elements in this section")
        oform = QFormLayout(self.override_box)
        self.overrides: dict[str, QComboBox] = {}
        for name in ELEMENT_NAMES:
            combo = QComboBox()
            combo.addItems(OVERRIDE_CHOICES)
            combo.currentIndexChanged.connect(lambda idx, n=name: self._override(n, idx))
            oform.addRow(name.title(), combo)
            self.overrides[name] = combo
        lay.addWidget(self.override_box)
        lay.addStretch(1)
        self.set_section(None, None)

    def _edit(self, field: str, value) -> None:  # noqa: ANN001
        if self._section_id and not self._updating:
            self.section_edited.emit(self._section_id, {field: value})

    def _override(self, element: str, idx: int) -> None:
        if self._section_id and not self._updating:
            value = {0: None, 1: True, 2: False}[idx]
            self.override_changed.emit(self._section_id, element, value)

    def set_project(self, project: Project) -> None:
        self._updating = True
        try:
            self.chords_edit.setText(
                " ".join(f"{c.symbol}:{c.bars:g}" if c.bars != 2 else c.symbol for c in project.chord_progression)
            )
            self.chords_error.setText("")
        finally:
            self._updating = False

    def set_chord_error(self, text: str) -> None:
        self.chords_error.setText(text)

    def set_section(self, project: Project | None, section: Section | None) -> None:
        self._section_id = section.id if section else None
        enabled = section is not None
        self.section_box.setEnabled(enabled)
        self.override_box.setEnabled(enabled)
        if not section or not project:
            self.section_box.setTitle("Section — click a block on the timeline")
            return
        self._updating = True
        try:
            idx = next(i for i, s in enumerate(project.sections) if s.id == section.id)
            self.section_box.setTitle(f"Section {idx + 1} of {len(project.sections)}")
            self.name.setText(section.name)
            self.kind.setCurrentText(section.kind.value)
            self.bars.setValue(section.bars)
            self.energy.setValue(section.energy)
            self.move_left.setEnabled(idx > 0)
            self.move_right.setEnabled(idx < len(project.sections) - 1)
            self.del_btn.setEnabled(len(project.sections) > 1)
            for name, combo in self.overrides.items():
                ov = section.element_overrides.get(name)
                combo.setCurrentIndex(0 if ov is None else (1 if ov else 2))
                default_on = project.element_active(name, Section(kind=section.kind, bars=1))
                combo.setItemText(0, f"Default ({'on' if default_on else 'off'})")
        finally:
            self._updating = False
