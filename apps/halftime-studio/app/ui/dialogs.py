"""Friendly error dialogs with a 'Copy details' button."""

from __future__ import annotations

import logging
import traceback

from PySide6.QtWidgets import (
    QApplication,
    QDialog,
    QDialogButtonBox,
    QLabel,
    QPlainTextEdit,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

log = logging.getLogger(__name__)


class ErrorDialog(QDialog):
    def __init__(self, parent: QWidget | None, title: str, message: str, details: str = "") -> None:
        super().__init__(parent)
        self.setWindowTitle(title)
        self.setMinimumWidth(460)
        layout = QVBoxLayout(self)
        msg = QLabel(message)
        msg.setWordWrap(True)
        layout.addWidget(msg)
        self._details = QPlainTextEdit(details)
        self._details.setReadOnly(True)
        self._details.setVisible(False)
        self._details.setMinimumHeight(180)
        layout.addWidget(self._details)
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok)
        if details:
            self._toggle = QPushButton("Show details")
            self._toggle.setCheckable(True)
            self._toggle.toggled.connect(self._on_toggle)
            buttons.addButton(self._toggle, QDialogButtonBox.ButtonRole.ActionRole)
            copy = QPushButton("Copy details")
            copy.clicked.connect(self._copy)
            buttons.addButton(copy, QDialogButtonBox.ButtonRole.ActionRole)
        buttons.accepted.connect(self.accept)
        layout.addWidget(buttons)
        self._message = message

    def _on_toggle(self, checked: bool) -> None:
        self._details.setVisible(checked)
        self._toggle.setText("Hide details" if checked else "Show details")
        self.adjustSize()

    def _copy(self) -> None:
        QApplication.clipboard().setText(f"{self.windowTitle()}\n{self._message}\n\n{self._details.toPlainText()}")


def show_error(parent: QWidget | None, title: str, message: str, exc: BaseException | None = None) -> None:
    """Log the problem and show it to the user with the traceback behind a button."""
    details = ""
    if exc is not None:
        details = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
        log.error("%s: %s", title, message, exc_info=exc)
    else:
        log.error("%s: %s", title, message)
    ErrorDialog(parent, title, message, details).exec()
