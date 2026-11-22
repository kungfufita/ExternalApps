"""Real-time preview playback.

:class:`PlaybackEngine` holds rendered *segments* (stems for a span of the song) and a
sample-accurate play position. The audio callback sums whatever segments overlap the
requested block, applying the current bus gains, so faders respond instantly without a
re-render. Segments are added as background renders finish; where nothing is ready yet
the engine outputs silence and reports it so the UI can show "rendering".

The engine has no Qt dependency. ``sounddevice`` is imported lazily so the rest of the
application (and the tests) work on machines without PortAudio.
"""

from __future__ import annotations

import logging
import threading
from collections.abc import Callable
from dataclasses import dataclass

import numpy as np

log = logging.getLogger(__name__)


class AudioDeviceError(Exception):
    """No usable output device, or the audio backend failed to start."""


@dataclass
class Segment:
    """Rendered stems placed at ``start`` (song samples). Arrays are ``(n, 2)`` float32."""

    key: str
    start: int
    stems: dict[str, np.ndarray]
    body: int  # samples that belong to this segment proper (tail may extend further)

    @property
    def length(self) -> int:
        return max((s.shape[0] for s in self.stems.values()), default=0)

    @property
    def end(self) -> int:
        return self.start + self.length


class PlaybackEngine:
    """Mixes segments on the fly and tracks the playhead."""

    def __init__(self, sample_rate: int = 44100, blocksize: int = 2048, use_device: bool = True) -> None:
        self.sample_rate = sample_rate
        self.blocksize = blocksize
        self.use_device = use_device  # False in tests: render_block() is driven manually
        self._lock = threading.Lock()
        self._segments: dict[str, Segment] = {}
        self._position = 0
        self._playing = False
        self._loop: tuple[int, int] | None = None
        self._end = 0
        self.gains: dict[str, float] = {}
        self.master_gain = 1.0
        self.underrun = False  # True when the last block hit an unrendered span
        self._stream = None
        self.on_finished: Callable[[], None] | None = None

    # ---- segments ----------------------------------------------------------------
    def set_segment(self, segment: Segment) -> None:
        with self._lock:
            self._segments[segment.key] = segment

    def remove_segment(self, key: str) -> None:
        with self._lock:
            self._segments.pop(key, None)

    def keep_only(self, keys: set[str]) -> None:
        with self._lock:
            for k in list(self._segments):
                if k not in keys:
                    del self._segments[k]

    def clear_segments(self) -> None:
        with self._lock:
            self._segments.clear()

    def has_segment(self, key: str) -> bool:
        return key in self._segments

    def covered(self, position: int) -> bool:
        """True when some segment's body covers ``position``."""
        with self._lock:
            return any(s.start <= position < s.start + s.body for s in self._segments.values())

    # ---- transport -----------------------------------------------------------------
    @property
    def position(self) -> int:
        return self._position

    @property
    def playing(self) -> bool:
        return self._playing

    def seek(self, sample: int) -> None:
        self._position = max(0, int(sample))

    def set_end(self, end_sample: int) -> None:
        """Song length; playback stops here unless looping."""
        self._end = max(0, int(end_sample))

    def set_loop(self, start: int | None, end: int | None = None) -> None:
        if start is None or end is None or end <= start:
            self._loop = None
        else:
            self._loop = (int(start), int(end))

    @property
    def loop(self) -> tuple[int, int] | None:
        return self._loop

    def play(self) -> None:
        if self.use_device:
            self._ensure_stream()
        self._playing = True

    def pause(self) -> None:
        self._playing = False

    def stop(self) -> None:
        self._playing = False
        if self._loop:
            self._position = self._loop[0]

    def close(self) -> None:
        self._playing = False
        if self._stream is not None:
            try:
                self._stream.stop()
                self._stream.close()
            except Exception:  # pragma: no cover - device teardown
                log.exception("closing audio stream")
            self._stream = None

    # ---- rendering ----------------------------------------------------------------
    def render_block(self, frames: int) -> np.ndarray:
        """Produce ``frames`` stereo samples from the current position (advances it)."""
        out = np.zeros((frames, 2), dtype=np.float32)
        if not self._playing:
            return out
        filled = 0
        underrun = False
        while filled < frames:
            pos = self._position
            if self._loop:
                loop_start, loop_end = self._loop
                if pos >= loop_end:
                    self._position = loop_start
                    continue
                stop_at = loop_end
            else:
                stop_at = self._end
            if stop_at <= pos:
                self._playing = False
                if self.on_finished:
                    self.on_finished()
                break
            n = min(frames - filled, stop_at - pos)
            hit = self._mix_span(out[filled : filled + n], pos, n)
            underrun = underrun or not hit
            self._position = pos + n
            filled += n
        self.underrun = underrun
        np.clip(out, -1.0, 1.0, out=out)
        return out

    def _mix_span(self, out: np.ndarray, pos: int, n: int) -> bool:
        """Add every overlapping segment into ``out``; return whether any body covered ``pos``."""
        covered = False
        with self._lock:
            segments = list(self._segments.values())
        for seg in segments:
            if seg.end <= pos or seg.start >= pos + n:
                continue
            if seg.start <= pos < seg.start + seg.body:
                covered = True
            a = max(pos, seg.start)
            b = min(pos + n, seg.end)
            o0 = a - pos
            s0, s1 = a - seg.start, b - seg.start
            for bus, data in seg.stems.items():
                g = self.gains.get(bus, 1.0) * self.master_gain
                if g == 0.0 or s0 >= data.shape[0]:
                    continue
                chunk = data[s0 : min(s1, data.shape[0])]
                out[o0 : o0 + chunk.shape[0]] += chunk * g
        return covered

    # ---- device ----------------------------------------------------------------------
    def _callback(self, outdata, frames, time_info, status) -> None:  # noqa: ANN001
        if status:
            log.debug("audio status: %s", status)
        try:
            outdata[:] = self.render_block(frames)
        except Exception:  # pragma: no cover - never let the callback die
            log.exception("audio callback")
            outdata.fill(0)

    def _ensure_stream(self) -> None:
        if self._stream is not None:
            return
        try:
            import sounddevice as sd
        except Exception as exc:  # OSError when PortAudio is missing
            raise AudioDeviceError(f"audio backend unavailable: {exc}") from exc
        try:
            self._stream = sd.OutputStream(
                samplerate=self.sample_rate,
                channels=2,
                dtype="float32",
                blocksize=self.blocksize,
                callback=self._callback,
            )
            self._stream.start()
        except Exception as exc:
            self._stream = None
            raise AudioDeviceError(
                "No audio output device could be opened. Check that speakers or headphones are "
                f"connected and not in exclusive use by another program.\n\n{exc}"
            ) from exc


def list_output_devices() -> list[str]:
    """Names of output-capable devices; empty list when the backend is unavailable."""
    try:
        import sounddevice as sd

        return [d["name"] for d in sd.query_devices() if d.get("max_output_channels", 0) > 0]
    except Exception:
        return []
