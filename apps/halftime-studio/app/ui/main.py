"""GUI entry point."""

from __future__ import annotations

import logging
import sys
from pathlib import Path

from PySide6.QtCore import Qt
from PySide6.QtWidgets import QApplication

from app import APP_NAME
from app.logging_setup import setup_logging
from app.ui import theme
from app.ui.dialogs import show_error

log = logging.getLogger(__name__)


class HalfTimeApp:
    """Owns the start screen and the main window(s)."""

    def __init__(self) -> None:
        self.main_window = None
        self.start_screen = None

    def show_start(self) -> None:
        from app.ui.start_screen import StartScreen

        self.start_screen = StartScreen()
        self.start_screen.project_chosen.connect(self.open_main)
        self.start_screen.show()

    def open_main(self, project, path) -> None:  # noqa: ANN001
        from app.ui.main_window import MainWindow

        self.main_window = MainWindow(project, Path(path) if path else None)
        self.main_window.show()
        if self.start_screen:
            self.start_screen.close()
            self.start_screen = None


def _excepthook(exc_type, exc, tb) -> None:  # noqa: ANN001
    log.critical("unhandled exception", exc_info=(exc_type, exc, tb))
    try:
        show_error(None, "Unexpected error", f"{APP_NAME} hit a problem it did not expect:\n\n{exc}", exc)
    except Exception:  # pragma: no cover
        pass


def create_app(argv: list[str] | None = None) -> QApplication:
    QApplication.setHighDpiScaleFactorRoundingPolicy(Qt.HighDpiScaleFactorRoundingPolicy.PassThrough)
    app = QApplication.instance() or QApplication(argv or sys.argv)
    app.setApplicationName(APP_NAME)
    app.setOrganizationName("HalfTimeStudio")
    app.setStyle("Fusion")
    app.setStyleSheet(theme.STYLESHEET)
    return app


def run_gui(argv: list[str] | None = None) -> int:
    setup_logging()
    app = create_app(argv)
    sys.excepthook = _excepthook
    controller = HalfTimeApp()
    args = [a for a in (argv or sys.argv)[1:] if a.endswith(".htproj")]
    if args and Path(args[0]).exists():
        from app.project import load_project

        try:
            controller.open_main(load_project(args[0]), Path(args[0]))
        except Exception as exc:
            show_error(None, "Could not open project", str(exc), exc)
            controller.show_start()
    else:
        controller.show_start()
    return app.exec()
