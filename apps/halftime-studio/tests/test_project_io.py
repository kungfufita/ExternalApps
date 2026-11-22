import pytest
from pydantic import ValidationError

from app.project import (
    ChordStep,
    Project,
    ProjectFileError,
    Section,
    SectionKind,
    VocalPlacement,
    VocalRegion,
    apply_style_preset,
    load_project,
    new_project,
    preset_names,
    save_project,
)
from app.project.io import project_from_text, project_to_text


def test_new_project_defaults():
    p = new_project("Demo", "Heavy Trance")
    assert p.tempo == 138.0
    assert p.key == "A" and p.scale == "minor"
    assert [c.symbol for c in p.chord_progression] == ["i", "VI", "III", "VII"]
    assert all(c.bars == 2.0 for c in p.chord_progression)
    assert p.total_bars == 104
    assert set(p.elements) == {
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
    }


def test_all_presets_construct():
    for name in preset_names():
        p = new_project("x", name)
        assert p.style.value == name
        assert p.tempo > 0


def test_apply_preset_keeps_user_tempo_and_key():
    p = new_project("x", "Heavy Trance", key="F#", tempo=140)
    q = apply_style_preset(p, "Progressive")
    assert q.tempo == 140 and q.key == "F#"
    assert q.style.value == "Progressive"
    assert q.elements["acid"].enabled is False


def test_save_load_roundtrip_yaml_and_json(tmp_path):
    p = new_project("Roundtrip", "Tech Trance", key="D", scale="minor")
    p.vocal.regions.append(VocalRegion(label="verse", start_s=10.0, end_s=25.5))
    p.vocal.placements.append(VocalPlacement(region_id=p.vocal.regions[0].id, bar=16))
    p.sections[3].element_overrides["acid"] = True
    path = save_project(p, tmp_path / "song")
    assert path.suffix == ".htproj"
    assert load_project(path) == p
    assert project_from_text(project_to_text(p, "json")) == p


def test_load_missing_file_raises(tmp_path):
    with pytest.raises(ProjectFileError):
        load_project(tmp_path / "nope.htproj")


def test_newer_format_version_rejected(tmp_path):
    f = tmp_path / "future.htproj"
    f.write_text("format_version: 99\nname: x\n", encoding="utf-8")
    with pytest.raises(ProjectFileError):
        load_project(f)


def test_invalid_project_text_is_friendly_error():
    with pytest.raises(ProjectFileError):
        project_from_text("- just\n- a list\n")
    with pytest.raises(ProjectFileError):
        project_from_text("name: x\ntempo: 999\n")


def test_validation_rejects_unknown_element_and_bad_chord():
    with pytest.raises(ValidationError):
        Section(kind=SectionKind.DROP, element_overrides={"kazoo": True})
    with pytest.raises(ValidationError):
        Project(chord_progression=[ChordStep(symbol="Xyz")])
    with pytest.raises(ValidationError):
        Project(scale="klingon")


def test_validation_rejects_dangling_placement():
    with pytest.raises(ValidationError):
        Project(vocal={"placements": [{"region_id": "missing", "bar": 0}]})


def test_extra_fields_rejected():
    with pytest.raises(ValidationError):
        Project(tempo=138, bogus=1)


def test_section_lookup_and_bar_positions():
    p = new_project()
    assert p.section_start_bar(p.sections[0].id) == 0
    assert p.section_start_bar(p.sections[3].id) == 16 + 16 + 8
    assert p.get_section("drop 1").name == "Drop 1"
    assert p.get_section(2).kind == SectionKind.BUILD
    assert p.section_at_bar(45).name == "Drop 1"
    assert p.section_at_bar(10_000) is None
    with pytest.raises(KeyError):
        p.get_section("nonexistent")


def test_element_active_respects_kind_defaults_and_overrides():
    p = new_project()
    breakdown = p.sections[1]
    drop = p.sections[3]
    assert not p.element_active("kick", breakdown)
    assert p.element_active("kick", drop)
    breakdown.element_overrides["kick"] = True
    assert p.element_active("kick", breakdown)
    p.elements["kick"].enabled = False
    assert not p.element_active("kick", drop)
