"""Shared fixtures. Tests use ONLY synthetic audio (sines, clicks, noise) — never real songs."""

from __future__ import annotations

import numpy as np
import pytest

from app.project.model import Project, Section, SectionKind
from app.project.presets import new_project


@pytest.fixture
def small_project() -> Project:
    """A short arrangement (10 bars) so render tests stay fast."""
    p = new_project("Test", "Heavy Trance")
    p.sections = [
        Section(kind=SectionKind.INTRO, name="Intro", bars=2),
        Section(kind=SectionKind.BREAKDOWN, name="Breakdown", bars=2),
        Section(kind=SectionKind.BUILD, name="Build", bars=2),
        Section(kind=SectionKind.DROP, name="Drop", bars=4),
    ]
    return p


@pytest.fixture
def sr() -> int:
    return 44100


@pytest.fixture
def click_track(sr: int) -> np.ndarray:
    """One-sample clicks every 0.5 s for 4 s (mono)."""
    x = np.zeros(sr * 4)
    x[:: sr // 2] = 1.0
    return x


@pytest.fixture
def sine(sr: int) -> np.ndarray:
    t = np.arange(sr * 2) / sr
    return 0.5 * np.sin(2 * np.pi * 440.0 * t)
