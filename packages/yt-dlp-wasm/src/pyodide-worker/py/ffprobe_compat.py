"""Emulate ffprobe by parsing `ffmpeg -i <file>` stderr.

Emits ffprobe's default flat `[STREAM] key=value [/STREAM]` text (which
yt-dlp's FFmpegPostProcessor.get_audio_codec parses for `codec_name=` /
`codec_type=audio`), or JSON when `-of json` / `-print_format json` is given.
"""

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


def _wants_json(rest: list[str]) -> bool:
    for i, tok in enumerate(rest):
        if tok in ("-of", "-print_format") and i + 1 < len(rest):
            if rest[i + 1].startswith("json"):
                return True
        elif tok.startswith(("-of=json", "-print_format=json")):
            return True
    return False


def _flat(info: dict) -> str:
    """ffprobe's default key=value output. codec_name precedes codec_type so
    yt-dlp's get_audio_codec resolves the right stream."""
    lines: list[str] = []
    for idx, st in enumerate(info.get("streams", [])):
        lines.append("[STREAM]")
        lines.append(f"index={idx}")
        lines.append(f"codec_name={st.get('codec_name', '')}")
        lines.append(f"codec_type={st.get('codec_type', '')}")
        if "width" in st:
            lines.append(f"width={st['width']}")
            lines.append(f"height={st['height']}")
        lines.append("[/STREAM]")
    fmt = info.get("format", {})
    lines.append("[FORMAT]")
    if "duration" in fmt:
        lines.append(f"duration={fmt['duration']}")
    lines.append("[/FORMAT]")
    return "\n".join(lines) + "\n"


def run(args: list[str]) -> tuple[int, bytes, bytes]:
    # Version/info queries (`-version`, `-bsfs`, …) are intercepted by the
    # subprocess shim before reaching here, so this only handles real probes.
    rest = args[1:]
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
    out = json.dumps(info) if _wants_json(rest) else _flat(info)
    return 0, out.encode(), b""
