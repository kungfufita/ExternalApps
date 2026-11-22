"""``python -m app`` entry point.

With no arguments the desktop GUI starts (once PySide6 is installed — build phase 2).
With arguments the developer CLI runs (``new``, ``render``, ``info``).
"""

from __future__ import annotations

import sys


def main() -> int:
    if len(sys.argv) > 1:
        from app.cli import main as cli_main

        return cli_main()
    try:
        from app.ui.main import run_gui  # type: ignore[attr-defined]
    except ImportError:
        from app.cli import main as cli_main

        print("The GUI is not available in this build yet; showing the developer CLI help.\n")
        return cli_main(["--help"])
    return int(run_gui())


if __name__ == "__main__":
    sys.exit(main())
