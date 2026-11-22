"""Persistent user settings (QSettings: registry on Windows)."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import QSettings

ORG = "HalfTimeStudio"
APP = "HalfTimeStudio"
MAX_RECENT = 10


def settings() -> QSettings:
    return QSettings(ORG, APP)


def recent_projects() -> list[str]:
    value = settings().value("recent_projects", [])
    if isinstance(value, str):
        value = [value]
    return [p for p in (value or []) if Path(p).exists()]


def add_recent_project(path: str | Path) -> None:
    path = str(Path(path).resolve())
    items = [p for p in recent_projects() if p != path]
    items.insert(0, path)
    settings().setValue("recent_projects", items[:MAX_RECENT])


def get_setting(key: str, default=None):  # noqa: ANN001, ANN201
    return settings().value(key, default)


def set_setting(key: str, value) -> None:  # noqa: ANN001
    settings().setValue(key, value)
