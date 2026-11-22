"""Style presets and arrangement templates.

A preset is a bundle of element settings + FX defaults + a default arrangement.
Applying one replaces the element parameters but keeps the user's key, tempo and vocal.
"""

from __future__ import annotations

from copy import deepcopy

from app.project.model import (
    ELEMENT_NAMES,
    ChordStep,
    ElementSettings,
    FxSettings,
    Project,
    Section,
    SectionKind,
    StylePresetName,
)

# Which elements sound by default in each section kind. Sections may override.
_KIND_ELEMENTS: dict[SectionKind, frozenset[str]] = {
    SectionKind.INTRO: frozenset({"kick", "hats", "bass", "plucks", "pads", "impacts"}),
    SectionKind.BREAKDOWN: frozenset({"pads", "chords", "plucks", "impacts"}),
    SectionKind.BUILD: frozenset({"kick", "hats", "clap", "chords", "pads", "plucks", "risers"}),
    SectionKind.DROP: frozenset({"kick", "hats", "clap", "bass", "acid", "chords", "lead", "pads", "impacts"}),
    SectionKind.OUTRO: frozenset({"kick", "hats", "bass", "pads", "plucks"}),
}


def default_elements_for_kind(kind: SectionKind) -> frozenset[str]:
    return _KIND_ELEMENTS[kind]


def default_arrangement() -> list[Section]:
    """Half-time friendly layout: long breakdowns for verses, two drops."""
    return [
        Section(kind=SectionKind.INTRO, name="Intro", bars=16, energy=0.6),
        Section(kind=SectionKind.BREAKDOWN, name="Breakdown 1", bars=16, energy=0.5),
        Section(kind=SectionKind.BUILD, name="Build 1", bars=8, energy=0.8),
        Section(kind=SectionKind.DROP, name="Drop 1", bars=16, energy=1.0),
        Section(kind=SectionKind.BREAKDOWN, name="Main Breakdown", bars=16, energy=0.5),
        Section(kind=SectionKind.BUILD, name="Build 2", bars=8, energy=0.9),
        Section(kind=SectionKind.DROP, name="Drop 2", bars=16, energy=1.1),
        Section(kind=SectionKind.OUTRO, name="Outro", bars=8, energy=0.5),
    ]


def _elements(**overrides: ElementSettings) -> dict[str, ElementSettings]:
    base = {name: ElementSettings() for name in ELEMENT_NAMES}
    base.update(overrides)
    return base


_PRESETS: dict[StylePresetName, dict] = {
    StylePresetName.HEAVY_TRANCE: {
        "tempo": 138.0,
        "elements": _elements(
            kick=ElementSettings(level_db=0.0, params={"punch": 0.9, "sub": 0.9, "decay": 0.45}),
            hats=ElementSettings(level_db=-10.0, params={"pattern": "offbeat16", "tone": 0.6}),
            clap=ElementSettings(level_db=-8.0, params={"pattern": "backbeat"}),
            bass=ElementSettings(level_db=-2.0, params={"pattern": "rolling16", "drive": 0.6, "cutoff": 900}),
            acid=ElementSettings(
                level_db=-9.0, params={"cutoff": 700, "resonance": 0.8, "env_mod": 0.8, "pattern": "acid_a"}
            ),
            chords=ElementSettings(
                level_db=-6.0, params={"voices": 7, "detune": 0.35, "cutoff": 3200, "style": "stab"}
            ),
            lead=ElementSettings(level_db=-10.0, params={"voices": 5, "detune": 0.25, "octave": 5}),
            pads=ElementSettings(level_db=-14.0, params={"voices": 5, "detune": 0.2, "cutoff": 1800}),
            plucks=ElementSettings(level_db=-12.0, params={"decay": 0.18, "pattern": "arp16"}),
            risers=ElementSettings(level_db=-10.0, params={}),
            impacts=ElementSettings(level_db=-6.0, params={}),
        ),
        "fx": FxSettings(reverb_size=0.6, delay_beats=0.75, sidechain_amount=0.8),
    },
    StylePresetName.UPLIFTING_TRANCE: {
        "tempo": 138.0,
        "elements": _elements(
            kick=ElementSettings(params={"punch": 0.7, "sub": 0.8, "decay": 0.5}),
            hats=ElementSettings(level_db=-11.0, params={"pattern": "offbeat8", "tone": 0.7}),
            clap=ElementSettings(level_db=-10.0, params={"pattern": "backbeat"}),
            bass=ElementSettings(level_db=-3.0, params={"pattern": "offbeat8", "drive": 0.3, "cutoff": 700}),
            acid=ElementSettings(
                enabled=False,
                level_db=-14.0,
                params={"cutoff": 600, "resonance": 0.6, "env_mod": 0.5, "pattern": "acid_b"},
            ),
            chords=ElementSettings(
                level_db=-5.0, params={"voices": 7, "detune": 0.45, "cutoff": 4500, "style": "sustain"}
            ),
            lead=ElementSettings(level_db=-7.0, params={"voices": 7, "detune": 0.35, "octave": 5}),
            pads=ElementSettings(level_db=-12.0, params={"voices": 7, "detune": 0.3, "cutoff": 2500}),
            plucks=ElementSettings(level_db=-10.0, params={"decay": 0.22, "pattern": "arp8"}),
            risers=ElementSettings(level_db=-9.0),
            impacts=ElementSettings(level_db=-7.0),
        ),
        "fx": FxSettings(reverb_size=0.8, delay_beats=0.75, sidechain_amount=0.6),
    },
    StylePresetName.TECH_TRANCE: {
        "tempo": 136.0,
        "elements": _elements(
            kick=ElementSettings(params={"punch": 1.0, "sub": 0.7, "decay": 0.35}),
            hats=ElementSettings(level_db=-9.0, params={"pattern": "offbeat16", "tone": 0.5}),
            clap=ElementSettings(level_db=-9.0, params={"pattern": "backbeat"}),
            bass=ElementSettings(level_db=-1.0, params={"pattern": "rolling16", "drive": 0.8, "cutoff": 1200}),
            acid=ElementSettings(
                level_db=-7.0, params={"cutoff": 900, "resonance": 0.9, "env_mod": 0.9, "pattern": "acid_c"}
            ),
            chords=ElementSettings(
                level_db=-9.0, params={"voices": 5, "detune": 0.25, "cutoff": 2500, "style": "stab"}
            ),
            lead=ElementSettings(enabled=False, level_db=-12.0, params={"voices": 3, "detune": 0.15, "octave": 4}),
            pads=ElementSettings(level_db=-16.0, params={"voices": 3, "detune": 0.15, "cutoff": 1200}),
            plucks=ElementSettings(level_db=-12.0, params={"decay": 0.12, "pattern": "arp16"}),
            risers=ElementSettings(level_db=-10.0),
            impacts=ElementSettings(level_db=-6.0),
        ),
        "fx": FxSettings(reverb_size=0.4, delay_beats=0.5, sidechain_amount=0.9),
    },
    StylePresetName.PROGRESSIVE: {
        "tempo": 128.0,
        "elements": _elements(
            kick=ElementSettings(params={"punch": 0.6, "sub": 0.9, "decay": 0.55}),
            hats=ElementSettings(level_db=-12.0, params={"pattern": "offbeat8", "tone": 0.6}),
            clap=ElementSettings(level_db=-12.0, params={"pattern": "backbeat"}),
            bass=ElementSettings(level_db=-3.0, params={"pattern": "offbeat8", "drive": 0.2, "cutoff": 500}),
            acid=ElementSettings(
                enabled=False,
                level_db=-16.0,
                params={"cutoff": 500, "resonance": 0.5, "env_mod": 0.4, "pattern": "acid_b"},
            ),
            chords=ElementSettings(
                level_db=-8.0, params={"voices": 5, "detune": 0.2, "cutoff": 2200, "style": "sustain"}
            ),
            lead=ElementSettings(level_db=-12.0, params={"voices": 3, "detune": 0.15, "octave": 5}),
            pads=ElementSettings(level_db=-10.0, params={"voices": 7, "detune": 0.3, "cutoff": 2000}),
            plucks=ElementSettings(level_db=-9.0, params={"decay": 0.3, "pattern": "arp8"}),
            risers=ElementSettings(level_db=-12.0),
            impacts=ElementSettings(level_db=-9.0),
        ),
        "fx": FxSettings(reverb_size=0.75, delay_beats=0.75, sidechain_amount=0.5),
    },
    StylePresetName.PSYTRANCE_LITE: {
        "tempo": 142.0,
        "elements": _elements(
            kick=ElementSettings(params={"punch": 1.0, "sub": 0.8, "decay": 0.3}),
            hats=ElementSettings(level_db=-10.0, params={"pattern": "offbeat16", "tone": 0.8}),
            clap=ElementSettings(level_db=-14.0, params={"pattern": "backbeat"}),
            bass=ElementSettings(level_db=0.0, params={"pattern": "psy16", "drive": 0.7, "cutoff": 1500}),
            acid=ElementSettings(
                level_db=-8.0, params={"cutoff": 1100, "resonance": 0.85, "env_mod": 0.7, "pattern": "acid_c"}
            ),
            chords=ElementSettings(
                level_db=-12.0, params={"voices": 3, "detune": 0.2, "cutoff": 2000, "style": "stab"}
            ),
            lead=ElementSettings(level_db=-9.0, params={"voices": 3, "detune": 0.2, "octave": 5}),
            pads=ElementSettings(level_db=-14.0, params={"voices": 5, "detune": 0.25, "cutoff": 1500}),
            plucks=ElementSettings(level_db=-10.0, params={"decay": 0.1, "pattern": "arp16"}),
            risers=ElementSettings(level_db=-9.0),
            impacts=ElementSettings(level_db=-7.0),
        ),
        "fx": FxSettings(reverb_size=0.5, delay_beats=0.375, sidechain_amount=0.85),
    },
}


def preset_names() -> list[str]:
    return [p.value for p in StylePresetName]


def apply_style_preset(project: Project, style: StylePresetName | str, *, set_tempo: bool = False) -> Project:
    """Return a copy of ``project`` with the preset's element and FX settings applied.

    Tempo is only changed when ``set_tempo`` is true, because the user's tempo (and the
    vocal stretched to it) is usually deliberate.
    """
    style = StylePresetName(style)
    spec = _PRESETS[style]
    data = project.model_dump()
    data["style"] = style.value
    data["elements"] = {k: v.model_dump() for k, v in deepcopy(spec["elements"]).items()}
    data["fx"] = spec["fx"].model_dump()
    if set_tempo:
        data["tempo"] = spec["tempo"]
    return Project.model_validate(data)


def new_project(
    name: str = "Untitled",
    style: StylePresetName | str = StylePresetName.HEAVY_TRANCE,
    key: str = "A",
    scale: str = "minor",
    tempo: float | None = None,
) -> Project:
    """Create a fresh project from a style preset with the default arrangement."""
    style = StylePresetName(style)
    project = Project(name=name, key=key, scale=scale, sections=default_arrangement())
    project = apply_style_preset(project, style, set_tempo=True)
    if tempo is not None:
        project = project.model_copy(update={"tempo": tempo})
    project.chord_progression = [ChordStep(symbol=s) for s in _default_symbols(scale)]
    return project


def _default_symbols(scale: str) -> list[str]:
    from app.project.music import default_progression_for

    return default_progression_for(scale)
