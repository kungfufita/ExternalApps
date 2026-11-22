"""HalfTime Studio — AI-assisted remix workstation.

Package layout:

* ``app.project``  — the project data model (pydantic), presets, music theory helpers, save/load.
* ``app.engine``   — pure-numpy audio engine: generator, FX, vocal processing, mixing.
  The engine never imports Qt, so it can be unit-tested headlessly.
* ``app.ai``       — Anthropic-powered assistant that edits the project through typed tools.
* ``app.ui``       — PySide6 desktop user interface.
"""

__version__ = "0.1.0"
APP_NAME = "HalfTime Studio"
