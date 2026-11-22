import pytest

from app.ui.timeline_math import (
    bar_to_x,
    clamp_zoom,
    format_position,
    format_time,
    ruler_step_bars,
    snap_bar,
    x_to_bar,
)


def test_bar_pixel_round_trip():
    assert bar_to_x(4, 30, 10) == 130
    assert x_to_bar(130, 30, 10) == pytest.approx(4.0)
    assert x_to_bar(-50, 30, 10) == 0.0


def test_zoom_clamp_and_ruler_step():
    assert clamp_zoom(1) == 6.0 and clamp_zoom(10_000) == 400.0
    assert ruler_step_bars(100) == 1
    assert ruler_step_bars(30) == 2
    assert ruler_step_bars(6) == 16


def test_formatting():
    assert format_time(0) == "0:00.0"
    assert format_time(65.25) == "1:05.2"
    assert format_position(0) == "1.1"
    assert format_position(16.5) == "17.3"
    assert format_position(16.75) == "17.4"


def test_snap_bar():
    assert snap_bar(3.3, 1) == 3.0
    assert snap_bar(3.3, 4) == 3.25
