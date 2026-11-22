import numpy as np

from app.engine.playback import PlaybackEngine, Segment


def _seg(key, start, length, value, body=None):
    stems = {"drums": np.full((length, 2), value, dtype=np.float32)}
    return Segment(key, start, stems, body if body is not None else length)


def test_silence_when_stopped_and_underrun_flag():
    eng = PlaybackEngine(44100, use_device=False)
    eng.set_end(1000)
    assert not np.any(eng.render_block(64))
    eng.play()  # no device: render_block drives the engine directly in tests
    out = eng.render_block(64)
    assert not np.any(out) and eng.underrun
    assert eng.position == 64


def test_segments_are_mixed_with_gains_and_master():
    eng = PlaybackEngine()
    eng.set_end(400)
    eng.set_segment(_seg("a", 0, 200, 0.25))
    eng.set_segment(Segment("b", 100, {"bass": np.full((100, 2), 0.25, dtype=np.float32)}, 100))
    eng.gains = {"drums": 1.0, "bass": 0.5}
    eng.master_gain = 2.0
    eng._playing = True
    out = eng.render_block(200)
    assert np.allclose(out[:100, 0], 0.5)  # drums only
    assert np.allclose(out[100:200, 0], 0.5 + 0.25)  # drums + bass*0.5 (then x2 master)
    assert not eng.underrun


def test_loop_wraps_exactly():
    eng = PlaybackEngine()
    eng.set_end(10_000)
    data = np.arange(1000, dtype=np.float32) / 1000.0
    eng.set_segment(Segment("a", 0, {"drums": np.stack([data, data], axis=1)}, 1000))
    eng.set_loop(100, 300)
    eng.seek(250)
    eng._playing = True
    out = eng.render_block(100)
    # 50 samples to the loop end, then wraps to 100
    assert np.allclose(out[:50, 0], data[250:300])
    assert np.allclose(out[50:, 0], data[100:150])
    assert eng.position == 150


def test_stops_at_end_and_calls_back():
    eng = PlaybackEngine()
    done = []
    eng.on_finished = lambda: done.append(True)
    eng.set_end(100)
    eng.set_segment(_seg("a", 0, 100, 0.1))
    eng.seek(90)
    eng._playing = True
    out = eng.render_block(50)
    assert np.allclose(out[:10, 0], 0.1) and not np.any(out[10:])
    assert not eng.playing and done == [True]


def test_segment_bookkeeping():
    eng = PlaybackEngine()
    eng.set_segment(_seg("a", 0, 10, 0.1))
    eng.set_segment(_seg("b", 10, 10, 0.1, body=5))
    assert eng.covered(0) and eng.covered(12) and not eng.covered(16)
    eng.keep_only({"a"})
    assert eng.has_segment("a") and not eng.has_segment("b")
    eng.clear_segments()
    assert not eng.covered(0)


def test_output_is_clipped():
    eng = PlaybackEngine()
    eng.set_end(10)
    eng.set_segment(_seg("a", 0, 10, 3.0))
    eng._playing = True
    assert np.max(eng.render_block(10)) <= 1.0
