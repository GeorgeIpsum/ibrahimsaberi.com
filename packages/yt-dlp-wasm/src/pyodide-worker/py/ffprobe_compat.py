"""Emulate `ffprobe -of json` by parsing `ffmpeg -i <file>` stderr."""

import json
import os
import re

import fs

_DURATION = re.compile(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)")
_STREAM = re.compile(r"Stream #\d+:\d+.*?: (\w+): (\w+)")
_VIDEO_DIMS = re.compile(r"(\d{2,5})x(\d{2,5})")


def _parse(stderr: str) -> dict:
    fmt: dict = {}
    streams: list[dict] = []
    m = _DURATION.search(stderr)
    if m:
        h, mm, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
        fmt["duration"] = f"{h * 3600 + mm * 60 + s:.6f}"
    for line in stderr.splitlines():
        sm = _STREAM.search(line)
        if not sm:
            continue
        kind, codec = sm.group(1).lower(), sm.group(2)
        st = {"codec_type": kind, "codec_name": codec}
        if kind == "video":
            dm = _VIDEO_DIMS.search(line)
            if dm:
                st["width"], st["height"] = int(dm.group(1)), int(dm.group(2))
        streams.append(st)
    return {"streams": streams, "format": fmt}


def run(args: list[str]) -> tuple[int, bytes, bytes]:
    rest = args[1:]
    if "-version" in rest:
        return 0, b"ffprobe version wasm-yt-dlp\n", b""
    infile = None
    for tok in reversed(rest):
        cand = fs.strip_file_prefix(tok)
        if os.path.exists(cand):
            infile = cand
            break
    if not infile:
        return 1, b"", b"ffprobe: no input file found\n"
    base = os.path.basename(infile)
    with open(infile, "rb") as f:
        fs.put_file(base, f.read())
    rmeta, _ = fs.call(
        fs.OP_FFMPEG_EXEC, {"argv": ["-i", base], "inputs": [base], "outputs": []}
    )
    fs.delete_file(base)
    info = _parse(rmeta.get("stderr", ""))
    return 0, json.dumps(info).encode(), b""
