"""``python -m app`` entry point.

With no arguments the desktop GUI starts (once PySide6 is installed — build phase 2).
With a CLI sub-command (``new``, ``render``, ``info``) the developer CLI runs instead; a
``.htproj`` path opens that project in the GUI.
"""

from __future__ import annotations

import sys


def main() -> int:
    cli_commands = {"new", "render", "info", "--help", "-h", "--version"}
    if len(sys.argv) > 1 and sys.argv[1] in cli_commands:
        from app.cli import main as cli_main

        return cli_main()
    try:
        from app.ui.main import run_gui
    except ImportError as exc:
        from app.cli import main as cli_main

        print(f"The GUI needs PySide6 (pip install -r requirements-app.txt): {exc}\n")
        return cli_main(["--help"])
    return int(run_gui())


if __name__ == "__main__":
    sys.exit(main())
