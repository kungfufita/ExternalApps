"""Save and load ``.htproj`` files.

Projects are stored as YAML (a JSON superset, so JSON files load too). Audio is never
embedded: the vocal source is referenced by path and content hash.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml

from app.project.model import PROJECT_FORMAT_VERSION, Project

PROJECT_SUFFIX = ".htproj"


class ProjectFileError(Exception):
    """Raised when a project file is unreadable or has an unsupported version."""


def project_to_text(project: Project, fmt: str = "yaml") -> str:
    data = project.to_dict()
    if fmt == "json":
        return json.dumps(data, indent=2, ensure_ascii=False)
    return yaml.safe_dump(data, sort_keys=False, allow_unicode=True)


def project_from_text(text: str) -> Project:
    try:
        data = yaml.safe_load(text)
    except yaml.YAMLError as exc:  # pragma: no cover - message only
        raise ProjectFileError(f"could not parse project file: {exc}") from exc
    if not isinstance(data, dict):
        raise ProjectFileError("project file does not contain a mapping")
    return _migrate_and_validate(data)


def save_project(project: Project, path: str | Path, fmt: str = "yaml") -> Path:
    """Write the project; the suffix is forced to ``.htproj``. Returns the final path."""
    path = Path(path)
    if path.suffix.lower() != PROJECT_SUFFIX:
        path = path.with_suffix(PROJECT_SUFFIX)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(project_to_text(project, fmt), encoding="utf-8")
    tmp.replace(path)
    return path


def load_project(path: str | Path) -> Project:
    path = Path(path)
    if not path.exists():
        raise ProjectFileError(f"project file not found: {path}")
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise ProjectFileError(f"could not read {path}: {exc}") from exc
    return project_from_text(text)


def _migrate_and_validate(data: dict[str, Any]) -> Project:
    version = int(data.get("format_version", 1))
    if version > PROJECT_FORMAT_VERSION:
        raise ProjectFileError(f"project was saved by a newer HalfTime Studio (format {version}); please update")
    # Future migrations go here: while version < PROJECT_FORMAT_VERSION: ...
    data["format_version"] = PROJECT_FORMAT_VERSION
    try:
        return Project.from_dict(data)
    except ValueError as exc:
        raise ProjectFileError(f"invalid project file: {exc}") from exc
