"""Chunked file transfer over the JS sync bridge (ytdlp_bridge_js.call)."""

import json
import struct

import ytdlp_bridge_js
from pyodide.ffi import to_js

OP_FS_PUT = 2
OP_FS_GET = 3
OP_FS_STAT = 4
OP_FS_DELETE = 5
OP_FFMPEG_EXEC = 6

CHUNK = 8 * 1024 * 1024  # 8 MiB; fits inside the default 16 MiB SAB region


def strip_file_prefix(p: str) -> str:
    return p[5:] if p.startswith("file:") else p


def call(op: int, meta: dict, body: bytes = b"") -> tuple[dict, bytes]:
    meta_bytes = json.dumps(meta).encode()
    frame = struct.pack("<I", len(meta_bytes)) + meta_bytes + body
    result = ytdlp_bridge_js.call(op, to_js(frame))
    raw = bytes(result.to_py()) if hasattr(result, "to_py") else bytes(result)
    mlen = struct.unpack("<I", raw[:4])[0]
    rmeta = json.loads(raw[4 : 4 + mlen].decode())
    return rmeta, raw[4 + mlen :]


def put_file(name: str, data: bytes) -> None:
    if not data:
        call(OP_FS_PUT, {"name": name, "offset": 0})
        return
    offset = 0
    while offset < len(data):
        chunk = data[offset : offset + CHUNK]
        call(OP_FS_PUT, {"name": name, "offset": offset}, chunk)
        offset += len(chunk)


def get_file(name: str) -> bytes:
    rmeta, _ = call(OP_FS_STAT, {"name": name})
    size = rmeta["size"]
    out = bytearray()
    while len(out) < size:
        rmeta, rbody = call(OP_FS_GET, {"name": name, "offset": len(out), "len": CHUNK})
        out += rbody
        if rmeta.get("eof"):
            break
    return bytes(out)


def delete_file(name: str) -> None:
    call(OP_FS_DELETE, {"name": name})
