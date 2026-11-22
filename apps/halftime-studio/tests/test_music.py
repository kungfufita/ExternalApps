import pytest

from app.project.music import (
    Chord,
    midi_to_freq,
    midi_to_name,
    normalize_note_name,
    parse_chord,
    scale_degree_midi,
    scale_pitch_classes,
    transpose_key,
)


def test_note_name_normalization():
    assert normalize_note_name("Bb") == "A#"
    assert normalize_note_name("db") == "C#"
    assert normalize_note_name("a") == "A"
    with pytest.raises(ValueError):
        normalize_note_name("H")


def test_midi_helpers():
    assert midi_to_freq(69) == pytest.approx(440.0)
    assert midi_to_freq(57) == pytest.approx(220.0)
    assert midi_to_name(60) == "C4"


def test_scale_pitch_classes():
    assert scale_pitch_classes("A", "minor") == [9, 11, 0, 2, 4, 5, 7]
    assert scale_pitch_classes("C", "major") == [0, 2, 4, 5, 7, 9, 11]


def test_scale_degree_wraps_octave():
    assert scale_degree_midi("A", "minor", 1, 3) == 57
    assert scale_degree_midi("A", "minor", 8, 3) == 69


@pytest.mark.parametrize(
    "symbol,root,quality",
    [
        ("i", "A", "min"),
        ("VI", "F", "maj"),
        ("III", "C", "maj"),
        ("VII", "G", "maj"),
        ("bVII", "F#", "maj"),
        ("iv7", "D", "min7"),
        ("V7", "E", "dom7"),
        ("I", "A", "maj"),
        ("Am", "A", "min"),
        ("F", "F", "maj"),
        ("Gsus2", "G", "sus2"),
        ("Bb", "A#", "maj"),
        ("Cmaj7", "C", "maj7"),
    ],
)
def test_parse_chord_in_a_minor(symbol, root, quality):
    c = parse_chord(symbol, "A", "minor")
    assert isinstance(c, Chord)
    assert c.root_name == root
    assert c.quality == quality


def test_parse_chord_major_key_diatonic_qualities():
    assert parse_chord("ii", "C", "major").quality == "min"
    assert parse_chord("V", "C", "major").root_name == "G"
    assert parse_chord("vii", "C", "major").quality == "dim"


def test_chord_voicing():
    assert parse_chord("Am", "A", "minor").midi_notes(3) == [57, 60, 64]
    assert parse_chord("i", "A", "minor").midi_notes(3, voices=2) == [57, 60]


def test_parse_chord_rejects_garbage():
    with pytest.raises(ValueError):
        parse_chord("Xyz", "A", "minor")
    with pytest.raises(ValueError):
        parse_chord("", "A", "minor")


def test_transpose_key():
    assert transpose_key("A", 3) == "C"
    assert transpose_key("A", -1) == "G#"
