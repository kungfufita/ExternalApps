"""Pure geometry for the timeline widget (kept Qt-free so it is unit-testable)."""

from __future__ import annotations

import math

MIN_PIXELS_PER_BAR = 6.0
MAX_PIXELS_PER_BAR = 400.0


def bar_to_x(bar: float, pixels_per_bar: float, origin_x: float = 0.0) -> float:
    return origin_x + bar * pixels_per_bar


def x_to_bar(x: float, pixels_per_bar: float, origin_x: float = 0.0) -> float:
    return max(0.0, (x - origin_x) / pixels_per_bar)


def clamp_zoom(pixels_per_bar: float) -> float:
    return min(MAX_PIXELS_PER_BAR, max(MIN_PIXELS_PER_BAR, pixels_per_bar))


def ruler_step_bars(pixels_per_bar: float, min_label_px: float = 56.0) -> int:
    """Smallest 'nice' bar step (1, 2, 4, 8, 16, 32...) whose labels don't collide."""
    step = 1
    while step * pixels_per_bar < min_label_px:
        step *= 2
    return step


def beat_subdivisions_visible(pixels_per_bar: float) -> bool:
    return pixels_per_bar >= 48.0


def format_time(seconds: float) -> str:
    seconds = max(0.0, seconds)
    m, s = divmod(seconds, 60.0)
    return f"{int(m)}:{s:04.1f}"


def format_position(bar: float, beats_per_bar: int = 4) -> str:
    """1-based 'bar.beat' display, e.g. bar 16.5 -> '17.3'."""
    whole = math.floor(bar + 1e-9)
    beat = int((bar - whole) * beats_per_bar + 1e-9) + 1
    return f"{whole + 1}.{beat}"


def snap_bar(bar: float, division: int) -> float:
    return max(0.0, round(bar * division) / division)
