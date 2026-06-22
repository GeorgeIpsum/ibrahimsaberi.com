"""Route subprocess ffmpeg/ffprobe calls into ffmpeg.wasm via the bridge."""

import os
import subprocess

import ffprobe_compat
import fs

_FFMPEG = ("ffmpeg", "avconv")
_FFPROBE = ("ffprobe", "avprobe")

# Info/version queries yt-dlp runs to *discover* ffmpeg/ffprobe. yt-dlp's
# FFmpegPostProcessor probes `ffmpeg -bsfs` / `ffprobe -bsfs` (see
# _get_exe_version_output): it merges stderr into stdout, treats a non-zero exit
# as "not found", and runs detect_exe_version() on the output. None of these
# touch a real file, so we answer them with a synthetic banner on stdout (exit
# 0) instead of routing to ffmpeg.wasm. The banner carries `version` (so a
# version parses) and the `libavformat ... / runtime` line (so feature
# detection works). These flags don't collide with transcode flags (`-bsf:a`,
# `-f`, `-c` are distinct tokens).
_INFO_FLAGS = frozenset((
    "-version", "-bsfs", "-formats", "-muxers", "-demuxers", "-codecs",
    "-encoders", "-decoders", "-protocols", "-filters", "-pix_fmts",
    "-sample_fmts", "-layouts", "-hwaccels", "-h", "-help",
))

# Mirrors the pinned @ffmpeg/core (ffmpeg 5.1.4) so the parsed version + lib
# versions match the actual wasm core.
_FFMPEG_BANNER = (
    "ffmpeg version 5.1.4 Copyright (c) 2000-2023 the FFmpeg developers\n"
    "  built with emcc (Emscripten) ffmpeg.wasm\n"
    "  libavutil      57. 28.100 / 57. 28.100\n"
    "  libavcodec     59. 37.100 / 59. 37.100\n"
    "  libavformat    59. 27.100 / 59. 27.100\n"
    "  libavfilter     8. 44.100 /  8. 44.100\n"
    "  libswscale      6.  7.100 /  6.  7.100\n"
    "  libswresample   4.  7.100 /  4.  7.100\n"
).encode()


def _is_info_query(args) -> bool:
    return any(str(a) in _INFO_FLAGS for a in args[1:])


def _kind(args) -> str | None:
    if not args:
        return None
    prog = os.path.basename(str(args[0])).lower()
    if any(prog == n or prog.startswith(n) for n in _FFPROBE):
        return "ffprobe"
    if any(prog == n or prog.startswith(n) for n in _FFMPEG):
        return "ffmpeg"
    return None


def _run_ffmpeg(args) -> tuple[int, bytes, bytes]:
    rest = [str(a) for a in args[1:]]

    inputs: list[tuple[str, str]] = []
    out_argv: list[str] = []
    i = 0
    while i < len(rest):
        a = rest[i]
        if a == "-i" and i + 1 < len(rest):
            src = fs.strip_file_prefix(rest[i + 1])
            base = os.path.basename(src)
            inputs.append((src, base))
            out_argv.extend(["-i", base])
            i += 2
            continue
        out_argv.append(a)
        i += 1

    out_src = ""
    out_base = ""
    if out_argv and not out_argv[-1].startswith("-"):
        out_src = fs.strip_file_prefix(out_argv[-1])
        out_base = os.path.basename(out_src)
        out_argv[-1] = out_base

    in_bases: list[str] = []
    for src, base in inputs:
        with open(src, "rb") as f:
            fs.put_file(base, f.read())
        in_bases.append(base)

    rmeta, _ = fs.call(
        fs.OP_FFMPEG_EXEC,
        {"argv": out_argv, "inputs": in_bases, "outputs": [out_base] if out_base else []},
    )
    code = int(rmeta.get("code", 1))
    stderr = rmeta.get("stderr", "").encode()

    if out_base:
        try:
            data = fs.get_file(out_base)
            with open(out_src, "wb") as f:
                f.write(data)
            fs.delete_file(out_base)
        except Exception:
            pass
    for base in in_bases:
        try:
            fs.delete_file(base)
        except Exception:
            pass
    return code, b"", stderr


class _FakePopen:
    def __init__(self, args, **kwargs):
        self.args = args
        # yt-dlp's Popen.run passes text=True (forwarded as universal_newlines/
        # encoding/errors). detect_exe_version() and run_ffmpeg() then require
        # str output, so honor text mode and decode in communicate().
        self._text = bool(
            kwargs.get("text")
            or kwargs.get("universal_newlines")
            or kwargs.get("encoding")
            or kwargs.get("errors")
        )
        kind = _kind(args)
        if kind in ("ffmpeg", "ffprobe") and _is_info_query(args):
            # Discovery/version probe for either tool — answer with the banner.
            self.returncode, self._out, self._err = 0, _FFMPEG_BANNER, b""
        elif kind == "ffmpeg":
            self.returncode, self._out, self._err = _run_ffmpeg(args)
        elif kind == "ffprobe":
            self.returncode, self._out, self._err = ffprobe_compat.run(
                [str(a) for a in args]
            )
        else:
            raise OSError(f"subprocess not supported in pyodide: {args}")
        self.stdin = None
        self.stdout = None
        self.stderr = None
        self.pid = -1

    def communicate(self, input=None, timeout=None):
        if self._text:
            out = self._out.decode("utf-8", "replace") if isinstance(self._out, bytes) else self._out
            err = self._err.decode("utf-8", "replace") if isinstance(self._err, bytes) else self._err
            return out, err
        return self._out, self._err

    def wait(self, timeout=None):
        return self.returncode

    def poll(self):
        return self.returncode

    def kill(self):
        pass

    def terminate(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def _run(args, **kwargs):
    p = _FakePopen(args, **kwargs)
    out, err = p.communicate(kwargs.get("input"))
    if kwargs.get("check") and p.returncode != 0:
        raise subprocess.CalledProcessError(p.returncode, args, out, err)
    return subprocess.CompletedProcess(args, p.returncode, out, err)


def _check_output(args, **kwargs):
    p = _FakePopen(args, **kwargs)
    out, err = p.communicate(kwargs.get("input"))
    if p.returncode != 0:
        raise subprocess.CalledProcessError(p.returncode, args, out, err)
    return out


def install() -> None:
    subprocess.Popen = _FakePopen
    subprocess.run = _run
    subprocess.check_output = _check_output
