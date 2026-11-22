"""Reading and writing audio files (WAV/FLAC via libsndfile; MP3 via bundled ffmpeg)."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf


class AudioFileError(Exception):
    """Unreadable, unsupported or corrupt audio file."""


def read_audio(path: str | Path, target_sr: int | None = None, mono: bool = False) -> tuple[np.ndarray, int]:
    """Load an audio file as float32 ``(n, channels)``. Falls back to ffmpeg for MP3/M4A etc."""
    path = Path(path)
    if not path.exists():
        raise AudioFileError(f"file not found: {path}")
    try:
        data, sr = sf.read(str(path), dtype="float32", always_2d=True)
    except (RuntimeError, sf.LibsndfileError) as exc:
        data, sr = _read_via_ffmpeg(path, exc)
    if mono and data.shape[1] > 1:
        data = data.mean(axis=1, keepdims=True)
    if target_sr and sr != target_sr:
        data = resample(data, sr, target_sr)
        sr = target_sr
    return data, sr


def _read_via_ffmpeg(path: Path, original: Exception) -> tuple[np.ndarray, int]:
    exe = ffmpeg_path()
    if not exe:
        raise AudioFileError(f"could not decode {path.name} ({original}); ffmpeg not found") from original
    cmd = [exe, "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "2", "-ar", "44100", "-"]
    try:
        proc = subprocess.run(cmd, capture_output=True, check=True, timeout=600)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        err = exc.stderr.decode(errors="replace") if getattr(exc, "stderr", None) else str(exc)
        raise AudioFileError(f"ffmpeg could not decode {path.name}: {err.strip()}") from exc
    raw = np.frombuffer(proc.stdout, dtype=np.float32)
    if raw.size == 0:
        raise AudioFileError(f"{path.name} contains no audio")
    return raw.reshape(-1, 2).copy(), 44100


def resample(data: np.ndarray, sr_in: int, sr_out: int) -> np.ndarray:
    from math import gcd

    from scipy.signal import resample_poly

    g = gcd(sr_in, sr_out)
    return resample_poly(data, sr_out // g, sr_in // g, axis=0).astype(np.float32)


def write_wav(path: str | Path, data: np.ndarray, sr: int, bit_depth: int = 24) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    subtype = {16: "PCM_16", 24: "PCM_24", 32: "FLOAT"}[bit_depth]
    sf.write(str(path), np.clip(data, -1.0, 1.0), sr, subtype=subtype)
    return path


def ffmpeg_path() -> str | None:
    """Bundled ffmpeg (next to the frozen executable) first, then PATH."""
    candidates = []
    if getattr(sys, "frozen", False):
        base = Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent))
        candidates += [base / "bin" / "ffmpeg.exe", base / "bin" / "ffmpeg", base / "ffmpeg.exe"]
    env = os.environ.get("HALFTIME_FFMPEG")
    if env:
        candidates.append(Path(env))
    for c in candidates:
        if c.exists():
            return str(c)
    return shutil.which("ffmpeg")


def write_mp3(path: str | Path, data: np.ndarray, sr: int, bitrate_k: int = 320) -> Path:
    """Encode to MP3 with ffmpeg via a temporary WAV."""
    path = Path(path)
    exe = ffmpeg_path()
    if not exe:
        raise AudioFileError("ffmpeg not found; MP3 export unavailable")
    tmp_wav = path.with_suffix(".tmp.wav")
    write_wav(tmp_wav, data, sr, 16)
    try:
        cmd = [
            exe,
            "-y",
            "-v",
            "error",
            "-i",
            str(tmp_wav),
            "-codec:a",
            "libmp3lame",
            "-b:a",
            f"{bitrate_k}k",
            str(path),
        ]
        subprocess.run(cmd, capture_output=True, check=True, timeout=600)
    except subprocess.CalledProcessError as exc:
        raise AudioFileError(f"MP3 encoding failed: {exc.stderr.decode(errors='replace').strip()}") from exc
    finally:
        tmp_wav.unlink(missing_ok=True)
    return path
