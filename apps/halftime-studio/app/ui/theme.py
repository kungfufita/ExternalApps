"""Dark theme: palette constants and the application stylesheet."""

from __future__ import annotations

from app.project.model import SectionKind

BG = "#15161c"
PANEL = "#1e2029"
PANEL_ALT = "#262935"
BORDER = "#343746"
TEXT = "#e6e6ec"
TEXT_DIM = "#9aa0b4"
ACCENT = "#6f8cff"
ACCENT_DIM = "#4a5ec4"
PLAYHEAD = "#ff5c5c"
LOOP = "#6f8cff"
GRID = "#2c2f3b"
GRID_STRONG = "#3b3f50"

SECTION_COLORS: dict[SectionKind, str] = {
    SectionKind.INTRO: "#3e7a8c",
    SectionKind.BREAKDOWN: "#7d5bb5",
    SectionKind.BUILD: "#d9902b",
    SectionKind.DROP: "#d94f4f",
    SectionKind.OUTRO: "#4a8c62",
}

STYLESHEET = f"""
QWidget {{
    background: {BG};
    color: {TEXT};
    font-family: "Segoe UI", "Inter", "Noto Sans", sans-serif;
    font-size: 13px;
}}
QMainWindow::separator {{ background: {BORDER}; width: 2px; height: 2px; }}
QDockWidget {{ titlebar-close-icon: none; titlebar-normal-icon: none; }}
QDockWidget::title {{
    background: {PANEL}; padding: 6px 10px; border-bottom: 1px solid {BORDER};
    font-weight: 600; color: {TEXT_DIM};
}}
QMenuBar {{ background: {PANEL}; border-bottom: 1px solid {BORDER}; }}
QMenuBar::item:selected {{ background: {PANEL_ALT}; }}
QMenu {{ background: {PANEL}; border: 1px solid {BORDER}; padding: 4px; }}
QMenu::item {{ padding: 6px 24px; border-radius: 4px; }}
QMenu::item:selected {{ background: {ACCENT_DIM}; }}
QMenu::separator {{ height: 1px; background: {BORDER}; margin: 4px 8px; }}
QToolBar {{ background: {PANEL}; border-bottom: 1px solid {BORDER}; spacing: 6px; padding: 4px; }}
QStatusBar {{ background: {PANEL}; border-top: 1px solid {BORDER}; color: {TEXT_DIM}; }}
QPushButton, QToolButton {{
    background: {PANEL_ALT}; border: 1px solid {BORDER}; border-radius: 6px;
    padding: 6px 12px; color: {TEXT};
}}
QPushButton:hover, QToolButton:hover {{ background: #2f3342; border-color: #4a4f63; }}
QPushButton:pressed, QToolButton:pressed {{ background: #1a1c25; }}
QPushButton:checked, QToolButton:checked {{ background: {ACCENT_DIM}; border-color: {ACCENT}; }}
QPushButton:disabled, QToolButton:disabled {{ color: #5c6072; border-color: #2a2d39; }}
QPushButton#primary {{ background: {ACCENT}; border-color: {ACCENT}; color: white; font-weight: 600; }}
QPushButton#primary:hover {{ background: #7f9bff; }}
QPushButton#danger {{ border-color: #7a3b3b; }}
QPushButton#danger:hover {{ background: #4a2a2a; }}
QLineEdit, QSpinBox, QDoubleSpinBox, QComboBox, QPlainTextEdit, QTextEdit, QListWidget {{
    background: {PANEL}; border: 1px solid {BORDER}; border-radius: 6px; padding: 4px 8px;
    selection-background-color: {ACCENT_DIM};
}}
QLineEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus, QComboBox:focus {{ border-color: {ACCENT}; }}
QComboBox::drop-down {{ border: none; width: 22px; }}
QComboBox QAbstractItemView {{ background: {PANEL}; border: 1px solid {BORDER}; selection-background-color: {ACCENT_DIM}; }}
QSpinBox::up-button, QSpinBox::down-button, QDoubleSpinBox::up-button, QDoubleSpinBox::down-button {{ width: 16px; border: none; }}
QCheckBox::indicator {{ width: 16px; height: 16px; border: 1px solid {BORDER}; border-radius: 4px; background: {PANEL}; }}
QCheckBox::indicator:checked {{ background: {ACCENT}; border-color: {ACCENT}; }}
QSlider::groove:vertical {{ background: {PANEL}; width: 6px; border-radius: 3px; }}
QSlider::handle:vertical {{ background: {TEXT}; height: 14px; margin: 0 -6px; border-radius: 7px; }}
QSlider::sub-page:vertical {{ background: {PANEL}; border-radius: 3px; }}
QSlider::add-page:vertical {{ background: {ACCENT_DIM}; border-radius: 3px; }}
QSlider::groove:horizontal {{ background: {PANEL}; height: 6px; border-radius: 3px; }}
QSlider::handle:horizontal {{ background: {TEXT}; width: 14px; margin: -5px 0; border-radius: 7px; }}
QSlider::sub-page:horizontal {{ background: {ACCENT_DIM}; border-radius: 3px; }}
QScrollBar:horizontal {{ background: {PANEL}; height: 10px; }}
QScrollBar::handle:horizontal {{ background: #3f4357; border-radius: 5px; min-width: 30px; }}
QScrollBar:vertical {{ background: {PANEL}; width: 10px; }}
QScrollBar::handle:vertical {{ background: #3f4357; border-radius: 5px; min-height: 30px; }}
QScrollBar::add-line, QScrollBar::sub-line {{ width: 0; height: 0; }}
QProgressBar {{ background: {PANEL}; border: 1px solid {BORDER}; border-radius: 6px; text-align: center; height: 16px; }}
QProgressBar::chunk {{ background: {ACCENT}; border-radius: 5px; }}
QGroupBox {{ border: 1px solid {BORDER}; border-radius: 8px; margin-top: 12px; padding: 8px; }}
QGroupBox::title {{ subcontrol-origin: margin; left: 10px; padding: 0 4px; color: {TEXT_DIM}; }}
QLabel#dim {{ color: {TEXT_DIM}; }}
QLabel#title {{ font-size: 26px; font-weight: 700; }}
QLabel#subtitle {{ font-size: 14px; color: {TEXT_DIM}; }}
QLabel#position {{ font-family: "Consolas", "DejaVu Sans Mono", monospace; font-size: 15px; padding: 0 8px; }}
QToolTip {{ background: {PANEL_ALT}; color: {TEXT}; border: 1px solid {BORDER}; }}
QTabBar::tab {{ background: {PANEL}; padding: 6px 12px; border: 1px solid {BORDER}; border-bottom: none; }}
QTabBar::tab:selected {{ background: {PANEL_ALT}; }}
QSplitter::handle {{ background: {BORDER}; }}
"""
