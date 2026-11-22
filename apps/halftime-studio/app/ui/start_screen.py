"""Start screen: new project (choose style), open project, recent list."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import (
    QComboBox,
    QDialog,
    QDialogButtonBox,
    QDoubleSpinBox,
    QFileDialog,
    QFormLayout,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

from app import APP_NAME, __version__
from app.project import Project, ProjectFileError, load_project, new_project, preset_names
from app.project.model import SectionKind, StylePresetName
from app.project.music import NOTE_NAMES, SCALES
from app.ui import theme
from app.ui.dialogs import show_error
from app.ui.settings import recent_projects

STYLE_BLURBS = {
    "Heavy Trance": "138 BPM · rolling bass · acid · big stabs",
    "Uplifting Trance": "138 BPM · wide supersaws · soaring lead",
    "Tech Trance": "136 BPM · driving · dark · minimal pads",
    "Progressive": "128 BPM · deep · patient · long builds",
    "Psytrance-lite": "142 BPM · psy bass · fast hats · acid",
}

_TEMPO_FOR_STYLE = {
    "Heavy Trance": 138,
    "Uplifting Trance": 138,
    "Tech Trance": 136,
    "Progressive": 128,
    "Psytrance-lite": 142,
}


class NewProjectDialog(QDialog):
    def __init__(self, parent: QWidget | None = None, style: str = "Heavy Trance") -> None:
        super().__init__(parent)
        self.setWindowTitle("New project")
        form = QFormLayout(self)
        self.name = QLineEdit("Untitled remix")
        self.style = QComboBox()
        self.style.addItems(preset_names())
        self.style.setCurrentText(style)
        self.key = QComboBox()
        self.key.addItems(NOTE_NAMES)
        self.key.setCurrentText("A")
        self.scale = QComboBox()
        self.scale.addItems(sorted(SCALES))
        self.scale.setCurrentText("minor")
        self.tempo = QDoubleSpinBox()
        self.tempo.setRange(60, 200)
        self.tempo.setDecimals(1)
        self.tempo.setValue(_TEMPO_FOR_STYLE.get(style, 138))
        self.style.currentTextChanged.connect(lambda s: self.tempo.setValue(_TEMPO_FOR_STYLE.get(s, 138)))
        form.addRow("Name", self.name)
        form.addRow("Style", self.style)
        form.addRow("Key", self.key)
        form.addRow("Scale", self.scale)
        form.addRow("Tempo (BPM)", self.tempo)
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        form.addRow(buttons)

    def build(self) -> Project:
        return new_project(
            self.name.text().strip() or "Untitled remix",
            StylePresetName(self.style.currentText()),
            key=self.key.currentText(),
            scale=self.scale.currentText(),
            tempo=float(self.tempo.value()),
        )


class StartScreen(QWidget):
    project_chosen = Signal(object, object)  # Project, Path | None

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setWindowTitle(APP_NAME)
        self.resize(820, 540)
        outer = QVBoxLayout(self)
        outer.setContentsMargins(40, 36, 40, 28)
        title = QLabel(APP_NAME)
        title.setObjectName("title")
        sub = QLabel("Original electronic backing tracks, your vocals, half-time. Choose a style to start.")
        sub.setObjectName("subtitle")
        outer.addWidget(title)
        outer.addWidget(sub)
        outer.addSpacing(16)

        body = QHBoxLayout()
        outer.addLayout(body, 1)

        left = QVBoxLayout()
        grid = QGridLayout()
        grid.setSpacing(10)
        for i, name in enumerate(preset_names()):
            btn = QPushButton(f"{name}\n{STYLE_BLURBS.get(name, '')}")
            btn.setMinimumHeight(64)
            btn.setStyleSheet(f"text-align:left; padding:10px 14px; border-left: 4px solid {self._style_color(name)};")
            btn.clicked.connect(lambda _c=False, n=name: self._new(n))
            grid.addWidget(btn, i // 2, i % 2)
        left.addLayout(grid)
        left.addStretch(1)
        open_btn = QPushButton("Open project…")
        open_btn.clicked.connect(self._open)
        left.addWidget(open_btn)
        body.addLayout(left, 3)

        right = QVBoxLayout()
        recent_label = QLabel("Recent projects")
        recent_label.setObjectName("dim")
        right.addWidget(recent_label)
        self.recent = QListWidget()
        for path in recent_projects():
            item = QListWidgetItem(Path(path).stem)
            item.setToolTip(path)
            item.setData(Qt.ItemDataRole.UserRole, path)
            self.recent.addItem(item)
        if self.recent.count() == 0:
            empty = QListWidgetItem("No recent projects yet")
            empty.setFlags(Qt.ItemFlag.NoItemFlags)
            self.recent.addItem(empty)
        self.recent.itemActivated.connect(self._open_recent)
        right.addWidget(self.recent, 1)
        body.addLayout(right, 2)

        foot = QLabel(f"v{__version__} · personal-use remixing of files you own")
        foot.setObjectName("dim")
        outer.addWidget(foot)

    @staticmethod
    def _style_color(name: str) -> str:
        return {
            "Heavy Trance": theme.SECTION_COLORS[SectionKind.DROP],
            "Uplifting Trance": theme.SECTION_COLORS[SectionKind.BREAKDOWN],
            "Tech Trance": theme.SECTION_COLORS[SectionKind.INTRO],
            "Progressive": theme.SECTION_COLORS[SectionKind.OUTRO],
            "Psytrance-lite": theme.SECTION_COLORS[SectionKind.BUILD],
        }.get(name, theme.ACCENT)

    def _new(self, style: str) -> None:
        dlg = NewProjectDialog(self, style)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            self.project_chosen.emit(dlg.build(), None)

    def _open(self) -> None:
        path, _ = QFileDialog.getOpenFileName(self, "Open project", "", "HalfTime Studio project (*.htproj)")
        if path:
            self.open_path(Path(path))

    def _open_recent(self, item: QListWidgetItem) -> None:
        path = item.data(Qt.ItemDataRole.UserRole)
        if path:
            self.open_path(Path(path))

    def open_path(self, path: Path) -> None:
        try:
            project = load_project(path)
        except ProjectFileError as exc:
            show_error(self, "Could not open project", str(exc), exc)
            return
        self.project_chosen.emit(project, path)
