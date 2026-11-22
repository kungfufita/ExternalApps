"""Headless command line for development and testing.

End users never need this: the installed app launches the GUI. Developers use it to render
projects without Qt, e.g.::

    python -m app new demo.htproj --style "Heavy Trance" --key A --tempo 138
    python -m app render demo.htproj demo.wav --stems
    python -m app render demo.htproj preview.wav --section "Drop 1"
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

from app import APP_NAME, __version__


def _cmd_new(args: argparse.Namespace) -> int:
    from app.project import new_project, save_project

    project = new_project(Path(args.path).stem, args.style, key=args.key, scale=args.scale, tempo=args.tempo)
    out = save_project(project, args.path)
    summary = f"{project.style.value}, {project.key} {project.scale}, {project.tempo:g} BPM"
    print(f"Created {out} ({summary}, {project.total_bars} bars)")
    return 0


def _cmd_render(args: argparse.Namespace) -> int:
    from app.engine.audio_io import write_mp3, write_wav
    from app.engine.generator.render import render_project, render_section
    from app.engine.mix import mix_stems
    from app.project import load_project

    project = load_project(args.project)
    t0 = time.time()

    def progress(frac: float, msg: str) -> None:
        print(f"\r[{int(frac * 100):3d}%] {msg:<40s}", end="", flush=True)

    if args.section:
        result = render_section(project, args.section)
        print(f"Rendered section {args.section!r}: {result.bars} bars")
    else:
        result = render_project(project, progress=progress)
        print()
    master = mix_stems(result.stems, project.mix, project.fx, result.sample_rate)
    out = Path(args.output)
    if out.suffix.lower() == ".mp3":
        write_mp3(out, master, result.sample_rate)
    else:
        write_wav(out, master, result.sample_rate, 24)
    print(f"Wrote {out}  ({master.shape[0] / result.sample_rate:.1f} s, {time.time() - t0:.1f} s render)")
    if args.stems:
        for bus, data in result.stems.items():
            stem_path = out.with_name(f"{out.stem}_{bus}.wav")
            write_wav(stem_path, data, result.sample_rate, 24)
            print(f"  stem: {stem_path}")
    if args.verbose:
        for line in result.notes:
            print("  ", line)
    return 0


def _cmd_info(args: argparse.Namespace) -> int:
    from app.project import load_project

    p = load_project(args.project)
    summary = f"{p.style.value}, {p.key} {p.scale}, {p.tempo:g} BPM"
    print(f"{p.name}: {summary}, {p.total_bars} bars ({p.duration_seconds:.0f} s)")
    print("Chords:", " | ".join(f"{c.symbol} x{c.bars:g}" for c in p.chord_progression))
    bar = 0
    for s in p.sections:
        active = [e for e in p.elements if p.element_active(e, s)]
        head = f"  bar {bar:3d}  {s.name:<16s} {s.kind.value:<10s} {s.bars:3d} bars"
        print(f"{head}  energy {s.energy:.2f}  [{', '.join(active)}]")
        bar += s.bars
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="halftime-studio", description=f"{APP_NAME} {__version__} developer CLI")
    parser.add_argument("--version", action="version", version=f"{APP_NAME} {__version__}")
    sub = parser.add_subparsers(dest="command")

    new = sub.add_parser("new", help="create a project file from a style preset")
    new.add_argument("path")
    new.add_argument("--style", default="Heavy Trance")
    new.add_argument("--key", default="A")
    new.add_argument("--scale", default="minor")
    new.add_argument("--tempo", type=float, default=None)
    new.set_defaults(func=_cmd_new)

    render = sub.add_parser("render", help="render a project (or one section) to WAV/MP3")
    render.add_argument("project")
    render.add_argument("output")
    render.add_argument("--section", help="section name, id or index to preview")
    render.add_argument("--stems", action="store_true", help="also write one WAV per bus")
    render.add_argument("-v", "--verbose", action="store_true")
    render.set_defaults(func=_cmd_render)

    info = sub.add_parser("info", help="print the arrangement of a project")
    info.add_argument("project")
    info.set_defaults(func=_cmd_info)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not args.command:
        parser.print_help()
        return 0
    return int(args.func(args))


if __name__ == "__main__":
    sys.exit(main())
