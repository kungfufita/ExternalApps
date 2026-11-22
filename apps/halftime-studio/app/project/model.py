"""The HalfTime Studio project model.

A :class:`Project` is a plain, fully-typed description of a remix: tempo, key, style,
arrangement, per-element settings, imported vocal and its placements, FX and mix levels.
The audio engine renders *from* this model and the AI assistant edits *only* this model,
so everything that changes sound is visible, validated and undoable.
"""

from __future__ import annotations

import uuid
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.project.music import SCALES, default_progression_for, normalize_note_name, parse_chord

PROJECT_FORMAT_VERSION = 1

ElementName = Literal["kick", "hats", "clap", "bass", "acid", "chords", "lead", "pads", "plucks", "risers", "impacts"]
ELEMENT_NAMES: tuple[str, ...] = (
    "kick",
    "hats",
    "clap",
    "bass",
    "acid",
    "chords",
    "lead",
    "pads",
    "plucks",
    "risers",
    "impacts",
)

# Stem buses used for export / mixer. Each element belongs to exactly one bus.
BusName = Literal["drums", "bass", "synths", "fx", "vocal"]
BUS_NAMES: tuple[str, ...] = ("drums", "bass", "synths", "fx", "vocal")
ELEMENT_BUS: dict[str, str] = {
    "kick": "drums",
    "hats": "drums",
    "clap": "drums",
    "bass": "bass",
    "acid": "bass",
    "chords": "synths",
    "lead": "synths",
    "pads": "synths",
    "plucks": "synths",
    "risers": "fx",
    "impacts": "fx",
}


class SectionKind(str, Enum):
    INTRO = "intro"
    BREAKDOWN = "breakdown"
    BUILD = "build"
    DROP = "drop"
    OUTRO = "outro"


class StylePresetName(str, Enum):
    HEAVY_TRANCE = "Heavy Trance"
    UPLIFTING_TRANCE = "Uplifting Trance"
    TECH_TRANCE = "Tech Trance"
    PROGRESSIVE = "Progressive"
    PSYTRANCE_LITE = "Psytrance-lite"


def _new_id() -> str:
    return uuid.uuid4().hex[:8]


class StrictModel(BaseModel):
    """Base with extra-field rejection so typos in AI tool calls fail loudly."""

    model_config = ConfigDict(extra="forbid", validate_assignment=True)


class ChordStep(StrictModel):
    """One chord in the progression. ``bars`` defaults to 2 for half-time vocals."""

    symbol: str = Field(description="Roman numeral (i, VI, bVII7) or chord name (Am, F, Gsus2)")
    bars: float = Field(default=2.0, gt=0, le=16)


class ElementSettings(StrictModel):
    """Enable state, level and synth parameters for one backing-track element."""

    enabled: bool = True
    level_db: float = Field(default=0.0, ge=-60.0, le=12.0)
    params: dict[str, float | int | bool | str] = Field(default_factory=dict)


class Section(StrictModel):
    """An arrangement block. Element on/off defaults come from the kind; overrides win."""

    id: str = Field(default_factory=_new_id)
    kind: SectionKind
    name: str = ""
    bars: int = Field(default=16, ge=1, le=128)
    energy: float = Field(default=1.0, ge=0.0, le=1.5, description="Intensity scaler (0..1.5)")
    element_overrides: dict[str, bool] = Field(
        default_factory=dict, description="Force an element on/off in this section"
    )
    chords: list[ChordStep] | None = Field(default=None, description="Optional progression override for this section")
    params: dict[str, float | int | bool | str] = Field(
        default_factory=dict,
        description="Section-level hints, e.g. {'acid': True, 'filter_sweep': True}",
    )

    @model_validator(mode="after")
    def _default_name(self) -> Section:
        if not self.name:
            object.__setattr__(self, "name", self.kind.value.title())
        return self

    @field_validator("element_overrides")
    @classmethod
    def _check_elements(cls, v: dict[str, bool]) -> dict[str, bool]:
        bad = set(v) - set(ELEMENT_NAMES)
        if bad:
            raise ValueError(f"unknown elements: {sorted(bad)}")
        return v


class VocalFx(StrictModel):
    """Per-region vocal effects. All values are in natural units (dB, Hz, ms, beats)."""

    gain_db: float = Field(default=0.0, ge=-60, le=24)
    fade_in_ms: float = Field(default=10.0, ge=0, le=10000)
    fade_out_ms: float = Field(default=30.0, ge=0, le=10000)
    highpass_hz: float = Field(default=120.0, ge=20, le=2000)
    saturation: float = Field(default=0.0, ge=0, le=1)
    delay_mix: float = Field(default=0.0, ge=0, le=1)
    delay_beats: float = Field(default=0.75, gt=0, le=8, description="Synced delay time in beats")
    delay_feedback: float = Field(default=0.35, ge=0, le=0.95)
    reverb_mix: float = Field(default=0.15, ge=0, le=1)
    reverb_throw: bool = Field(default=False, description="Big wet tail on the last word")
    chop: Literal["off", "quarter", "eighth", "sixteenth", "accelerate"] = "off"
    chop_gate: float = Field(default=0.5, gt=0, le=1, description="Fraction of each chop that is open")
    gated_stab: bool = False
    formant_shift: float = Field(default=0.0, ge=-12, le=12, description="Semitones")


class VocalRegion(StrictModel):
    """A labelled span of the *source* vocal (in source-time seconds)."""

    id: str = Field(default_factory=_new_id)
    label: str = "custom"
    start_s: float = Field(ge=0)
    end_s: float = Field(gt=0)

    @model_validator(mode="after")
    def _check_span(self) -> VocalRegion:
        if self.end_s <= self.start_s:
            raise ValueError("region end must be after start")
        return self

    @property
    def duration_s(self) -> float:
        return self.end_s - self.start_s


class VocalPlacement(StrictModel):
    """A region placed on the project timeline at a bar position."""

    id: str = Field(default_factory=_new_id)
    region_id: str
    bar: float = Field(ge=0, description="Timeline position in bars (0-based, fractional allowed)")
    mode: Literal["half_time", "normal_time"] = "half_time"
    fx: VocalFx = Field(default_factory=VocalFx)


class VocalAnalysis(StrictModel):
    """Cached analysis of the imported vocal source."""

    bpm: float | None = None
    bpm_confidence: float = Field(default=0.0, ge=0, le=1)
    key: str | None = None
    scale: str | None = None
    key_confidence: float = Field(default=0.0, ge=0, le=1)
    duration_s: float = 0.0
    energy_curve: list[float] = Field(default_factory=list, description="RMS per hop (0..1)")
    energy_hop_s: float = 0.5
    detected_sections: list[VocalRegion] = Field(default_factory=list)


class VocalTrack(StrictModel):
    """The imported vocal: source file, separation cache key, regions, placements."""

    source_path: str | None = None
    source_hash: str | None = None
    separated_path: str | None = Field(default=None, description="Cached Demucs vocal stem")
    analysis: VocalAnalysis = Field(default_factory=VocalAnalysis)
    regions: list[VocalRegion] = Field(default_factory=list)
    placements: list[VocalPlacement] = Field(default_factory=list)
    stretch_semitone_shift: float = Field(default=0.0, ge=-12, le=12)


class FxSettings(StrictModel):
    """Global send/return and bus processing."""

    reverb_size: float = Field(default=0.6, ge=0, le=1)
    reverb_damping: float = Field(default=0.4, ge=0, le=1)
    delay_beats: float = Field(default=0.75, gt=0, le=8)
    delay_feedback: float = Field(default=0.4, ge=0, le=0.95)
    sidechain_amount: float = Field(default=0.7, ge=0, le=1)
    sidechain_release_beats: float = Field(default=0.9, gt=0, le=4)
    master_saturation: float = Field(default=0.1, ge=0, le=1)


class BusMix(StrictModel):
    level_db: float = Field(default=0.0, ge=-60, le=12)
    mute: bool = False
    solo: bool = False
    pan: float = Field(default=0.0, ge=-1, le=1)


class MixSettings(StrictModel):
    buses: dict[str, BusMix] = Field(default_factory=lambda: {name: BusMix() for name in BUS_NAMES})
    master_level_db: float = Field(default=-1.0, ge=-30, le=6)
    limiter_ceiling_db: float = Field(default=-0.3, ge=-6, le=0)
    limiter_enabled: bool = True

    @field_validator("buses")
    @classmethod
    def _check_buses(cls, v: dict[str, BusMix]) -> dict[str, BusMix]:
        bad = set(v) - set(BUS_NAMES)
        if bad:
            raise ValueError(f"unknown buses: {sorted(bad)}")
        for name in BUS_NAMES:
            v.setdefault(name, BusMix())
        return v


class RenderSettings(StrictModel):
    sample_rate: int = Field(default=44100)
    seed: int = Field(default=1138, description="Deterministic seed for melodic/rhythmic choices")

    @field_validator("sample_rate")
    @classmethod
    def _sr(cls, v: int) -> int:
        if v not in (44100, 48000):
            raise ValueError("sample_rate must be 44100 or 48000")
        return v


class Project(StrictModel):
    """Top-level project document (saved as ``.htproj``)."""

    format_version: int = PROJECT_FORMAT_VERSION
    name: str = "Untitled"
    tempo: float = Field(default=138.0, ge=60, le=200)
    key: str = "A"
    scale: str = "minor"
    style: StylePresetName = StylePresetName.HEAVY_TRANCE
    chord_progression: list[ChordStep] = Field(default_factory=list)
    sections: list[Section] = Field(default_factory=list)
    elements: dict[str, ElementSettings] = Field(
        default_factory=lambda: {name: ElementSettings() for name in ELEMENT_NAMES}
    )
    vocal: VocalTrack = Field(default_factory=VocalTrack)
    fx: FxSettings = Field(default_factory=FxSettings)
    mix: MixSettings = Field(default_factory=MixSettings)
    render: RenderSettings = Field(default_factory=RenderSettings)
    notes: str = ""

    # ---- validation -------------------------------------------------------------

    @field_validator("key")
    @classmethod
    def _key(cls, v: str) -> str:
        return normalize_note_name(v)

    @field_validator("scale")
    @classmethod
    def _scale(cls, v: str) -> str:
        v = v.strip().lower().replace(" ", "_")
        if v not in SCALES:
            raise ValueError(f"unknown scale {v!r}; choose from {sorted(SCALES)}")
        return v

    @field_validator("elements")
    @classmethod
    def _elements(cls, v: dict[str, ElementSettings]) -> dict[str, ElementSettings]:
        bad = set(v) - set(ELEMENT_NAMES)
        if bad:
            raise ValueError(f"unknown elements: {sorted(bad)}")
        for name in ELEMENT_NAMES:
            v.setdefault(name, ElementSettings())
        return v

    @model_validator(mode="after")
    def _fill_defaults(self) -> Project:
        if not self.chord_progression:
            object.__setattr__(
                self,
                "chord_progression",
                [ChordStep(symbol=s) for s in default_progression_for(self.scale)],
            )
        # Every chord symbol must resolve in this key/scale.
        for step in self.chord_progression:
            parse_chord(step.symbol, self.key, self.scale)
        for sec in self.sections:
            for step in sec.chords or []:
                parse_chord(step.symbol, self.key, self.scale)
        ids = [s.id for s in self.sections]
        if len(ids) != len(set(ids)):
            raise ValueError("duplicate section ids")
        region_ids = {r.id for r in self.vocal.regions}
        for p in self.vocal.placements:
            if p.region_id not in region_ids:
                raise ValueError(f"placement refers to unknown region {p.region_id!r}")
        return self

    # ---- derived properties -----------------------------------------------------

    @property
    def total_bars(self) -> int:
        return sum(s.bars for s in self.sections)

    @property
    def beat_seconds(self) -> float:
        return 60.0 / self.tempo

    @property
    def bar_seconds(self) -> float:
        return 4.0 * self.beat_seconds

    @property
    def duration_seconds(self) -> float:
        return self.total_bars * self.bar_seconds

    def section_start_bar(self, section_id: str) -> int:
        """0-based bar at which the section starts."""
        bar = 0
        for s in self.sections:
            if s.id == section_id:
                return bar
            bar += s.bars
        raise KeyError(section_id)

    def section_at_bar(self, bar: float) -> Section | None:
        pos = 0
        for s in self.sections:
            if pos <= bar < pos + s.bars:
                return s
            pos += s.bars
        return None

    def get_section(self, ref: str | int) -> Section:
        """Look a section up by id, by name (case-insensitive) or by index."""
        if isinstance(ref, int):
            return self.sections[ref]
        for s in self.sections:
            if s.id == ref:
                return s
        for s in self.sections:
            if s.name.lower() == ref.lower():
                return s
        raise KeyError(ref)

    def progression_for(self, section: Section) -> list[ChordStep]:
        return section.chords if section.chords else self.chord_progression

    def element_active(self, element: str, section: Section) -> bool:
        """Whether ``element`` sounds in ``section`` after global and section overrides."""
        from app.project.presets import default_elements_for_kind

        if not self.elements[element].enabled:
            return False
        if element in section.element_overrides:
            return section.element_overrides[element]
        return element in default_elements_for_kind(section.kind)

    def to_dict(self) -> dict[str, Any]:
        return self.model_dump(mode="json")

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Project:
        return cls.model_validate(data)
