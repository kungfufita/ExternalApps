"""Rotating file logging plus console output. API keys are never logged."""

from __future__ import annotations

import logging
import logging.handlers
import re
import sys
from pathlib import Path

from app.paths import logs_dir

_SECRET_RE = re.compile(r"(sk-ant-[A-Za-z0-9_\-]{8,})")


class _RedactFilter(logging.Filter):
    """Scrub anything that looks like an Anthropic API key from log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        if _SECRET_RE.search(msg):
            record.msg = _SECRET_RE.sub("sk-ant-***", msg)
            record.args = ()
        return True


def setup_logging(level: int = logging.INFO) -> Path:
    """Configure logging to ``<app data>/logs/halftime-studio.log``. Returns the log path."""
    log_path = logs_dir() / "halftime-studio.log"
    root = logging.getLogger()
    if getattr(root, "_halftime_configured", False):
        return log_path
    root.setLevel(level)
    fmt = logging.Formatter("%(asctime)s %(levelname)-7s %(name)s: %(message)s")
    file_handler = logging.handlers.RotatingFileHandler(log_path, maxBytes=2_000_000, backupCount=5, encoding="utf-8")
    file_handler.setFormatter(fmt)
    file_handler.addFilter(_RedactFilter())
    root.addHandler(file_handler)
    if sys.stderr:
        console = logging.StreamHandler(sys.stderr)
        console.setFormatter(fmt)
        console.addFilter(_RedactFilter())
        console.setLevel(logging.WARNING)
        root.addHandler(console)
    root._halftime_configured = True  # type: ignore[attr-defined]
    logging.getLogger(__name__).info("logging to %s", log_path)
    return log_path
