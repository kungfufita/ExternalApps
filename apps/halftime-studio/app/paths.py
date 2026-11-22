"""Per-user application directories (logs, cache, settings) on Windows and elsewhere."""

from __future__ import annotations

import os
import sys
from pathlib import Path

APP_DIR_NAME = "HalfTimeStudio"


def app_data_dir() -> Path:
    r"""``%APPDATA%\HalfTimeStudio`` on Windows, XDG data dir elsewhere."""
    if sys.platform == "win32":
        base = os.environ.get("APPDATA") or str(Path.home() / "AppData" / "Roaming")
    elif sys.platform == "darwin":
        base = str(Path.home() / "Library" / "Application Support")
    else:
        base = os.environ.get("XDG_DATA_HOME") or str(Path.home() / ".local" / "share")
    path = Path(base) / APP_DIR_NAME
    path.mkdir(parents=True, exist_ok=True)
    return path


def logs_dir() -> Path:
    p = app_data_dir() / "logs"
    p.mkdir(parents=True, exist_ok=True)
    return p


def cache_dir() -> Path:
    """Separated vocals and other derived data, keyed by content hash."""
    p = app_data_dir() / "cache"
    p.mkdir(parents=True, exist_ok=True)
    return p


def models_dir() -> Path:
    """Downloaded Demucs weights live here (never bundled with the installer)."""
    p = app_data_dir() / "models"
    p.mkdir(parents=True, exist_ok=True)
    return p
